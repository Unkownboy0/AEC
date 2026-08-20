import { prisma } from '../../lib/prisma';
import { credentialService } from './credential.service';
import { ProvisioningRow, provisioningRowSchema } from './provisioning.validator';
import { normalizeProfileGender } from './profile-values';
import ExcelJS from 'exceljs';

type ReferenceData = Awaited<ReturnType<ProvisioningService['references']>>;
type RowPreview = { rowNumber: number; valid: boolean; errors: string[]; normalized?: ProvisioningRow; resolved?: Record<string, string | null> };

const IMPORT_COLUMNS = [
  'profileType', 'email', 'firstName', 'lastName', 'roleName', 'username', 'phone', 'status',
  'departmentCode', 'programCode', 'courseCode', 'academicYear', 'semesterNumber', 'sectionName',
  'registerNumber', 'employeeId', 'dob', 'dateOfAdmission', 'dateOfJoining', 'gender', 'parentName',
  'parentPhone', 'currentAddress', 'permanentAddress', 'designation', 'qualification', 'experience',
  'workspaceRoles',
] as const;

const normalizedHeader = (value: unknown) => String(value ?? '').replace(/[\s_-]+/g, '').toLowerCase();
const headerMap = new Map(IMPORT_COLUMNS.map((column) => [normalizedHeader(column), column]));

const parseCsvLine = (line: string) => {
  const values: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') { value += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { values.push(value.trim()); value = ''; }
    else value += character;
  }
  values.push(value.trim());
  return values;
};

const rowsFromMatrix = (matrix: unknown[][]) => {
  if (matrix.length < 2) throw new Error('Import file must contain a header row and at least one data row');
  const headers = matrix[0].map((cell) => headerMap.get(normalizedHeader(cell)));
  if (!headers.some(Boolean)) throw new Error(`No supported columns found. Expected columns include: ${IMPORT_COLUMNS.join(', ')}`);
  return matrix.slice(1).filter((row) => row.some((cell) => String(cell ?? '').trim())).map((row) => {
    const record: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      if (!header) return;
      const value = row[index];
      if (value === '' || value == null) return;
      record[header] = header === 'workspaceRoles'
        ? String(value).split(/[|;]/).map((role) => role.trim()).filter(Boolean)
        : value;
    });
    return record;
  });
};

const required = (row: ProvisioningRow, fields: Array<keyof ProvisioningRow>) => fields.filter((field) => row[field] == null || row[field] === '').map((field) => `${String(field)} is required`);

export class ProvisioningService {
  async parseFile(fileName: string, base64: string) {
    const buffer = Buffer.from(base64, 'base64');
    if (!buffer.length) throw new Error('The import file is empty');
    if (buffer.length > 5 * 1024 * 1024) throw new Error('Import file exceeds the 5 MB limit');
    if (fileName.toLowerCase().endsWith('.csv')) {
      const lines = buffer.toString('utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
      return rowsFromMatrix(lines.map(parseCsvLine));
    }
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) throw new Error('The XLSX workbook has no worksheets');
    const matrix: unknown[][] = [];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const values = Array.isArray(row.values) ? row.values.slice(1) : [];
      matrix.push(values.map((value: any) => value?.text ?? value?.result ?? value));
    });
    return rowsFromMatrix(matrix);
  }

  async references() {
    const [roles, departments, programs, courses, academicYears, semesters, sections, users, students, faculty] = await Promise.all([
      prisma.role.findMany({ where: { status: 'ACTIVE' } }),
      prisma.department.findMany({ where: { deleted: false } }),
      prisma.program.findMany({ where: { deleted: false } }),
      prisma.course.findMany({ where: { deleted: false } }),
      prisma.academicYear.findMany(),
      prisma.semester.findMany({ where: { deleted: false } }),
      prisma.section.findMany({ where: { deleted: false } }),
      prisma.user.findMany({ select: { email: true, username: true } }),
      prisma.student.findMany({ select: { admissionNo: true } }),
      prisma.faculty.findMany({ select: { employeeId: true } }),
    ]);
    return { roles, departments, programs, courses, academicYears, semesters, sections, users, students, faculty };
  }

  private inspect(raw: unknown, rowNumber: number, refs: ReferenceData, batch: { emails: Set<string>; usernames: Set<string>; identifiers: Set<string> }): RowPreview {
    const parsed = provisioningRowSchema.safeParse(raw);
    if (!parsed.success) return { rowNumber, valid: false, errors: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`) };
    const row = parsed.data;
    const errors: string[] = [];
    const email = row.email.toLowerCase();
    const role = refs.roles.find((item) => item.name.toLowerCase() === row.roleName.toLowerCase());
    const workspaceRoles = row.workspaceRoles.map((workspaceRole) => refs.roles.find((item) => item.name.toLowerCase() === workspaceRole.toLowerCase()));
    const department = row.departmentCode ? refs.departments.find((item) => [item.code, item.shortName, item.name].filter(Boolean).some((value) => String(value).toLowerCase() === row.departmentCode!.toLowerCase())) : undefined;
    const program = row.programCode ? refs.programs.find((item) => item.code.toLowerCase() === row.programCode!.toLowerCase() && (!department || item.departmentId === department.id)) : undefined;
    const course = row.courseCode ? refs.courses.find((item) => item.code.toLowerCase() === row.courseCode!.toLowerCase() && (!program || item.programId === program.id)) : undefined;
    const academicYear = row.academicYear ? refs.academicYears.find((item) => item.name.toLowerCase() === row.academicYear!.toLowerCase()) : undefined;
    const semester = row.semesterNumber ? refs.semesters.find((item) => item.number === row.semesterNumber && (!course || item.courseId === course.id)) : undefined;
    const section = row.sectionName ? refs.sections.find((item) => item.name.toLowerCase() === row.sectionName!.toLowerCase() && (!semester || item.semesterId === semester.id)) : undefined;

    if (!role) errors.push(`Unknown active role: ${row.roleName}`);
    row.workspaceRoles.forEach((workspaceRole, index) => { if (!workspaceRoles[index]) errors.push(`Unknown active workspace role: ${workspaceRole}`); });
    if (refs.users.some((user) => user.email.toLowerCase() === email) || batch.emails.has(email)) errors.push('Email already exists or is duplicated in this import');
    if (row.username && (refs.users.some((user) => user.username?.toLowerCase() === row.username!.toLowerCase()) || batch.usernames.has(row.username.toLowerCase()))) errors.push('Username already exists or is duplicated in this import');
    if (row.departmentCode && !department) errors.push(`Department not found: ${row.departmentCode}`);

    if (row.profileType === 'STUDENT') {
      errors.push(...required(row, ['registerNumber', 'phone', 'dob', 'dateOfAdmission', 'gender', 'parentName', 'parentPhone', 'currentAddress', 'permanentAddress', 'departmentCode', 'programCode', 'courseCode', 'academicYear', 'semesterNumber', 'sectionName']));
      if (row.registerNumber && (refs.students.some((student) => student.admissionNo.toLowerCase() === row.registerNumber!.toLowerCase()) || batch.identifiers.has(`student:${row.registerNumber.toLowerCase()}`))) errors.push('Register number already exists or is duplicated in this import');
      if (row.roleName.toLowerCase() !== 'student') errors.push('STUDENT profileType requires the Student role');
      if (row.programCode && !program) errors.push(`Program not found in department: ${row.programCode}`);
      if (row.courseCode && !course) errors.push(`Course not found in program: ${row.courseCode}`);
      if (row.academicYear && !academicYear) errors.push(`Academic year not found: ${row.academicYear}`);
      if (row.semesterNumber && !semester) errors.push(`Semester not found in course: ${row.semesterNumber}`);
      if (row.sectionName && !section) errors.push(`Section not found in semester: ${row.sectionName}`);
    } else if (row.profileType === 'EMPLOYEE') {
      errors.push(...required(row, ['employeeId', 'phone', 'dob', 'dateOfJoining', 'designation', 'qualification', 'experience', 'departmentCode']));
      if (row.employeeId && (refs.faculty.some((item) => item.employeeId.toLowerCase() === row.employeeId!.toLowerCase()) || batch.identifiers.has(`employee:${row.employeeId.toLowerCase()}`))) errors.push('Employee ID already exists or is duplicated in this import');
    }

    batch.emails.add(email);
    if (row.username) batch.usernames.add(row.username.toLowerCase());
    if (row.registerNumber) batch.identifiers.add(`student:${row.registerNumber.toLowerCase()}`);
    if (row.employeeId) batch.identifiers.add(`employee:${row.employeeId.toLowerCase()}`);
    return { rowNumber, valid: errors.length === 0, errors, normalized: row, resolved: { roleId: role?.id ?? null, departmentId: department?.id ?? null, programId: program?.id ?? null, courseId: course?.id ?? null, academicYearId: academicYear?.id ?? null, semesterId: semester?.id ?? null, sectionId: section?.id ?? null } };
  }

  async preview(rows: unknown[]) {
    const refs = await this.references();
    const batch = { emails: new Set<string>(), usernames: new Set<string>(), identifiers: new Set<string>() };
    const results = rows.map((row, index) => this.inspect(row, index + 1, refs, batch));
    return { total: results.length, valid: results.filter((row) => row.valid).length, invalid: results.filter((row) => !row.valid).length, rows: results };
  }

  async commit(rows: unknown[], actorId: string, ip?: string, userAgent?: string) {
    const preview = await this.preview(rows);
    if (preview.invalid) return { ...preview, committed: 0, failed: 0, failures: [], credentials: [] };
    const credentials: Array<{ rowNumber: number; email: string; username: string; temporaryPassword: string }> = [];
    const failures: Array<{ rowNumber: number; email?: string; errors: string[] }> = [];
    const refs = await this.references();

    for (const item of preview.rows) {
      const row = item.normalized!;
      const resolved = item.resolved!;
      const temporaryPassword = credentialService.generateTemporaryPassword();
      const passwordHash = await credentialService.hashPassword(temporaryPassword);
      const username = row.username || row.registerNumber || row.employeeId || await credentialService.generateUsername(row.roleName);
      try {
        const normalizedGender = row.gender ? normalizeProfileGender(row.gender) : undefined;
        await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              email: row.email.toLowerCase(),
              username,
              passwordHash,
              firstName: row.firstName,
              lastName: row.lastName,
              phone: row.phone,
              gender: normalizedGender,
              departmentId: resolved.departmentId,
              status: row.status,
              accountStatus: row.status === 'ACTIVE' ? 'ACTIVE' : 'DEACTIVATED',
              forcePasswordChange: true,
              roleId: resolved.roleId!,
            },
          });
          const workspaceRoleNames = Array.from(new Set([row.roleName, ...row.workspaceRoles]));
          for (const [index, workspaceRoleName] of workspaceRoleNames.entries()) {
            const workspaceRole = refs.roles.find((candidate) => candidate.name.toLowerCase() === workspaceRoleName.toLowerCase())!;
            await tx.userRole.create({ data: { userId: user.id, roleId: workspaceRole.id, isPrimary: index === 0 } });
            await tx.userWorkspace.create({ data: { userId: user.id, workspaceCode: workspaceRole.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_'), workspaceName: `${workspaceRole.name} Workspace`, roleName: workspaceRole.name, isPrimary: index === 0 } });
          }
          if (row.profileType === 'STUDENT') {
            await tx.student.create({
              data: {
                admissionNo: row.registerNumber!,
                firstName: row.firstName,
                lastName: row.lastName,
                email: row.email,
                phone: row.phone,
                dob: row.dob!,
                dateOfAdmission: row.dateOfAdmission!,
                gender: normalizedGender || row.gender || 'UNSPECIFIED',
                parentName: row.parentName!,
                parentPhone: row.parentPhone!,
                currentAddress: row.currentAddress!,
                permanentAddress: row.permanentAddress!,
                academicYearId: resolved.academicYearId!,
                departmentId: resolved.departmentId!,
                programId: resolved.programId!,
                courseId: resolved.courseId!,
                semesterId: resolved.semesterId!,
                sectionId: resolved.sectionId!,
                userId: user.id,
              },
            });
          }
          if (row.profileType === 'EMPLOYEE') {
            await tx.faculty.create({
              data: {
                employeeId: row.employeeId!,
                firstName: row.firstName,
                lastName: row.lastName,
                email: row.email,
                phone: row.phone!,
                dob: row.dob!,
                dateOfJoining: row.dateOfJoining!,
                gender: normalizedGender,
                designation: row.designation!,
                qualification: row.qualification!,
                experience: row.experience!,
                departmentId: resolved.departmentId!,
                userId: user.id,
              },
            });
          }
          await tx.userActivityLog.create({ data: { userId: actorId, action: 'CREATE', module: 'USER', description: `Provisioned ${row.profileType} account ${row.email} with role ${row.roleName}`, ipAddress: ip, userAgent } });
        });
        credentials.push({ rowNumber: item.rowNumber, email: row.email, username, temporaryPassword });
      } catch {
        failures.push({ rowNumber: item.rowNumber, email: row.email, errors: ['Database transaction failed; no records for this row were created'] });
      }
    }
    return { ...preview, committed: credentials.length, failed: failures.length, failures, credentials };
  }
}
