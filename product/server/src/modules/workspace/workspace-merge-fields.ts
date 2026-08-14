import { prisma } from '../../lib/prisma';

export { applyMergeFields } from './merge-fields-apply';

// Resolves {{institution.name}}-style tokens against live CampusOS data.
// Values are embedded as <span data-field="key">value</span> so a later
// "Refresh institutional data" action can re-resolve the same span in place
// instead of the document silently going stale — see spec section 17.
export const resolveMergeFields = async (ctx: { userId: string; departmentId?: string | null }): Promise<Record<string, string>> => {
  const [settingsRows, department, faculty, academicYear] = await Promise.all([
    prisma.systemSetting.findMany({ where: { key: { in: ['COLLEGE_NAME', 'COLLEGE_ADDRESS', 'COLLEGE_LOGO_URL', 'COLLEGE_WEBSITE'] } } }),
    ctx.departmentId ? prisma.department.findUnique({ where: { id: ctx.departmentId } }) : Promise.resolve(null),
    prisma.faculty.findUnique({ where: { userId: ctx.userId }, include: { department: true } }),
    prisma.academicYear.findFirst({ where: { status: 'ACTIVE' } }).then((y) => y ?? prisma.academicYear.findFirst({ orderBy: { startDate: 'desc' } })),
  ]);
  const settings = Object.fromEntries(settingsRows.map((s) => [s.key, s.value]));
  const dept = department ?? faculty?.department ?? null;

  const fields: Record<string, string> = {
    'institution.name': settings.COLLEGE_NAME || '',
    'institution.address': settings.COLLEGE_ADDRESS || '',
    'institution.logo': settings.COLLEGE_LOGO_URL || '',
    'institution.website': settings.COLLEGE_WEBSITE || '',
    'academicYear': academicYear?.name || '',
    'department.name': dept?.name || '',
  };

  if (faculty) {
    fields['faculty.name'] = `${faculty.firstName} ${faculty.lastName}`.trim();
    fields['faculty.employeeId'] = faculty.employeeId;
    fields['faculty.designation'] = faculty.designation;
    fields['faculty.department'] = dept?.name || '';
  }

  return fields;
};

