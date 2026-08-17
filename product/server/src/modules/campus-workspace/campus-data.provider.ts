/**
 * Campus Data Provider
 * Permission-aware provider for all Campus Workspace data fields.
 * Every dataset enforces the caller's role + department scope.
 * No raw DB table exposure. Each dataset has a defined safe schema.
 */

import { prisma } from '../../lib/prisma';
import { CampusDataContext } from './workspace.types';

export class CampusDataProvider {
  /**
   * Get the full contextual data for the current user (for template auto-fill).
   * Used in mail merge, report builder, document tokens.
   */
  static async getUserContext(userId: string): Promise<CampusDataContext> {
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        faculty: { include: { department: true } },
      },
    });

    if (!user) return {};

    // Institution info
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: ['COLLEGE_NAME', 'COLLEGE_CODE', 'COLLEGE_ADDRESS', 'COLLEGE_PHONE', 'COLLEGE_EMAIL'] } },
    });
    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    // Academic year
    const activeYear = await prisma.academicYear.findFirst({
      where: { status: 'ACTIVE', deleted: false },
      select: { name: true },
    });

    // Current semester
    const activeSemester = await prisma.semester.findFirst({
      where: { status: 'ACTIVE', deleted: false },
      select: { name: true, number: true },
    });

    const ctx: CampusDataContext = {
      institution: {
        name: settingsMap['COLLEGE_NAME'] || 'CampusOS Institution',
        code: settingsMap['COLLEGE_CODE'],
        address: settingsMap['COLLEGE_ADDRESS'],
        phone: settingsMap['COLLEGE_PHONE'],
        email: settingsMap['COLLEGE_EMAIL'],
      },
      academicYear: activeYear?.name,
      semester: activeSemester?.name,
      currentDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
    };

    if (user.faculty) {
      ctx.faculty = {
        id: user.faculty.id,
        name: `${user.faculty.firstName} ${user.faculty.lastName}`,
        employeeId: user.faculty.employeeId || '',
        designation: user.faculty.designation || '',
        email: user.faculty.email || user.email,
      };
      if (user.faculty.department) {
        const deptHod = user.faculty.department.hodId
          ? await prisma.faculty.findUnique({
              where: { id: user.faculty.department.hodId },
              select: { firstName: true, lastName: true, email: true },
            })
          : null;

        ctx.department = {
          id: user.faculty.department.id,
          name: user.faculty.department.name,
          code: user.faculty.department.code,
          hod: deptHod
            ? { name: `${deptHod.firstName} ${deptHod.lastName}`, email: deptHod.email || '' }
            : undefined,
        };
      }
    }

    return ctx;
  }

  /**
   * Replace {{ token }} placeholders in a document string.
   * Only tokens within the user's authorized context are resolved.
   */
  static async resolveTokens(content: string, userId: string): Promise<string> {
    const ctx = await this.getUserContext(userId);

    const tokenMap: Record<string, string> = {
      'institution.name': ctx.institution?.name || '',
      'institution.code': ctx.institution?.code || '',
      'institution.address': ctx.institution?.address || '',
      'institution.phone': ctx.institution?.phone || '',
      'institution.email': ctx.institution?.email || '',
      'faculty.name': ctx.faculty?.name || '',
      'faculty.employeeId': ctx.faculty?.employeeId || '',
      'faculty.designation': ctx.faculty?.designation || '',
      'faculty.email': ctx.faculty?.email || '',
      'department.name': ctx.department?.name || '',
      'department.code': ctx.department?.code || '',
      'department.hod.name': ctx.department?.hod?.name || '',
      'department.hod.email': ctx.department?.hod?.email || '',
      'academicYear': ctx.academicYear || '',
      'academic_year': ctx.academicYear || '',
      'semester': ctx.semester || '',
      'currentDate': ctx.currentDate || '',
      'date': ctx.currentDate || '',
    };

    return content.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, token) => {
      return tokenMap[token] !== undefined ? tokenMap[token] : match;
    });
  }

  /**
   * Return list of available datasets for the current user's role.
   */
  static getAvailableDatasets(userRole: string): Array<{ id: string; label: string; fields: string[] }> {
    const common = [
      {
        id: 'institution_info',
        label: 'Institution Details',
        fields: ['name', 'code', 'address', 'phone', 'email'],
      },
      {
        id: 'academic_context',
        label: 'Academic Calendar',
        fields: ['currentYear', 'currentSemester', 'todayDate'],
      },
    ];

    const facultyAndAbove = [
      ...common,
      {
        id: 'students',
        label: 'Department Students',
        fields: ['registerNumber', 'name', 'program', 'section'],
      },
      {
        id: 'attendance',
        label: 'Attendance Summary',
        fields: ['studentId', 'totalClasses', 'presentClasses', 'percentage'],
      },
    ];

    const hodAndAbove = [
      ...facultyAndAbove,
      {
        id: 'faculty_list',
        label: 'Department Faculty',
        fields: ['employeeId', 'name', 'designation', 'email', 'qualification'],
      },
    ];

    if (['HOD', 'Super Admin', 'College Admin', 'Principal', 'Vice Principal', 'Academic Dean', 'Admission Dean', 'IQAC Dean'].includes(userRole)) {
      return hodAndAbove;
    }
    if (['Faculty', 'Mentor', 'Class Adviser'].includes(userRole)) {
      return facultyAndAbove;
    }
    return common;
  }

  /**
   * Fetch structured dataset records for document insertion / mail merge.
   * Strictly bounded to caller's department.
   */
  static async fetchDataset(
    dataset: string,
    userId: string,
    userRole: string,
    userDepartmentId?: string,
    filters?: Record<string, string>
  ): Promise<any[]> {
    const staffRoles = ['Faculty', 'Mentor', 'HOD', 'Class Adviser', 'Super Admin', 'College Admin', 'Principal', 'Vice Principal', 'Academic Dean', 'Admission Dean', 'IQAC Dean'];

    if (!staffRoles.includes(userRole)) {
      throw new Error('Unauthorized: insufficient role for campus data access');
    }

    switch (dataset) {
      case 'students': {
        const deptFilter = userDepartmentId ? { departmentId: userDepartmentId } : {};
        const students = await prisma.student.findMany({
          where: { ...deptFilter, deleted: false },
          select: {
            id: true,
            admissionNo: true,
            firstName: true,
            lastName: true,
            email: true,
            section: { select: { name: true } },
            program: { select: { name: true, code: true } },
          },
          take: 500,
        });
        // Safe schema — no personal contact, no Aadhaar/PAN
        return students.map((s) => ({
          id: s.id,
          registerNumber: s.admissionNo,
          name: `${s.firstName} ${s.lastName}`,
          program: s.program?.name,
          section: s.section?.name,
        }));
      }

      case 'faculty_list': {
        const hodRoles = ['HOD', 'Super Admin', 'College Admin', 'Principal', 'Vice Principal', 'Academic Dean'];
        if (!hodRoles.includes(userRole)) throw new Error('Unauthorized');
        const deptFilter = userDepartmentId ? { departmentId: userDepartmentId } : {};
        const faculty = await prisma.faculty.findMany({
          where: { ...deptFilter, deleted: false },
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            designation: true,
            qualification: true,
          },
          take: 200,
        });
        return faculty.map((f) => ({
          id: f.id,
          employeeId: f.employeeId,
          name: `${f.firstName} ${f.lastName}`,
          email: f.email,
          designation: f.designation,
          qualification: f.qualification,
        }));
      }

      case 'attendance': {
        if (!userDepartmentId) return [];
        const records = await prisma.attendance.findMany({
          where: {
            student: { departmentId: userDepartmentId },
            ...(filters?.startDate ? { date: { gte: new Date(filters.startDate) } } : {}),
            ...(filters?.endDate ? { date: { lte: new Date(filters.endDate) } } : {}),
          },
          select: {
            studentId: true,
            status: true,
            date: true,
          },
          take: 500,
        });
        return records;
      }

      default:
        return [];
    }
  }
}
