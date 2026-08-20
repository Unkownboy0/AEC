import { prisma } from '../../lib/prisma';
import { ForbiddenException } from '../../utils/exceptions';
import { profileImageDescriptor } from '../users/profile-media.service';

const BROAD_ROLES = new Set([
  'SUPERADMIN', 'COLLEGEADMIN', 'PRINCIPAL', 'VICEPRINCIPAL',
  'ACADEMICDEAN', 'ADMISSIONDEAN', 'IQACDEAN',
]);

function roleKey(role?: string) {
  return String(role || '').toUpperCase().replace(/[\s_-]+/g, '');
}

type Actor = { id: string; role: string; departmentId?: string | null };

export class WorkspaceRecipientService {
  private static async actorContext(actor: Actor) {
    const [student, faculty] = await Promise.all([
      (prisma.student as any).findFirst({
        where: { userId: actor.id, deleted: false },
        select: { id: true, mentorId: true, departmentId: true, sectionId: true, semesterId: true },
      }),
      (prisma.faculty as any).findFirst({
        where: { userId: actor.id, deleted: false },
        select: { id: true, departmentId: true },
      }),
    ]);
    return { student, faculty, departmentId: actor.departmentId || student?.departmentId || faculty?.departmentId || null };
  }

  private static async eligibleWhere(actor: Actor) {
    const key = roleKey(actor.role);
    const context = await this.actorContext(actor);

    if (key === 'PARENT') return { id: '__NO_AUTHORIZED_RECIPIENT__' };
    if (BROAD_ROLES.has(key)) return {};

    if (key === 'STUDENT') {
      const student = context.student;
      if (!student) return { id: '__NO_AUTHORIZED_RECIPIENT__' };
      const facultyEligibility: any[] = [];
      if (student.mentorId) facultyEligibility.push({ id: student.mentorId });
      if (student.departmentId) facultyEligibility.push({ departmentId: student.departmentId });
      const assignmentScope = [
        ...(student.sectionId ? [{ sectionId: student.sectionId }] : []),
        ...(student.semesterId ? [{ semesterId: student.semesterId }] : []),
      ];
      if (assignmentScope.length) facultyEligibility.push({ subjectAssignments: { some: { OR: assignmentScope } } });
      return { faculty: { is: { deleted: false, OR: facultyEligibility } } };
    }

    // Operational and academic staff discovery is institution-scoped by their
    // canonical department unless they hold an explicitly broad leadership role.
    if (!context.departmentId) return { id: actor.id };
    return {
      OR: [
        { id: actor.id },
        { student: { is: { deleted: false, departmentId: context.departmentId } } },
        { faculty: { is: { deleted: false, departmentId: context.departmentId } } },
      ],
    };
  }

  static async search(actor: Actor, query: string, requestedLimit = 15) {
    const q = query.trim();
    if (q.length < 2) return [];
    const eligibility = await this.eligibleWhere(actor);
    const limit = Math.min(Math.max(Number(requestedLimit) || 15, 1), 20);
    const users = await (prisma.user as any).findMany({
      where: {
        status: 'ACTIVE',
        id: { not: actor.id },
        AND: [eligibility, {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { student: { is: { admissionNo: { contains: q, mode: 'insensitive' } } } },
            { faculty: { is: { employeeId: { contains: q, mode: 'insensitive' } } } },
          ],
        }],
      },
      select: {
        id: true, firstName: true, lastName: true, gender: true,
        profilePhoto: true, profileImageFileId: true, profileImageFile: true,
        role: { select: { name: true } },
        student: { select: { admissionNo: true, department: { select: { name: true } }, section: { select: { name: true } } } },
        faculty: { select: { employeeId: true, designation: true, department: { select: { name: true } } } },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      take: limit,
    });

    return users.map((user: any) => ({
      id: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      role: user.role?.name || (user.student ? 'Student' : 'Staff'),
      context: user.student
        ? [user.student.department?.name, user.student.section?.name].filter(Boolean).join(' • ')
        : [user.faculty?.designation, user.faculty?.department?.name].filter(Boolean).join(' • '),
      reference: user.student?.admissionNo || user.faculty?.employeeId || null,
      gender: user.gender,
      profileImage: profileImageDescriptor(user),
    }));
  }

  static async assertEligible(actor: Actor, targetUserIds: string[]) {
    const uniqueIds = [...new Set(targetUserIds.filter(Boolean))];
    if (!uniqueIds.length) return;
    const eligibility = await this.eligibleWhere(actor);
    const allowed = await (prisma.user as any).count({
      where: { status: 'ACTIVE', id: { in: uniqueIds, not: actor.id }, AND: [eligibility] },
    });
    if (allowed !== uniqueIds.length) {
      throw new ForbiddenException('One or more recipients are outside your authorized sharing scope.');
    }
  }

  static assertShareEnvelope(actor: Actor, shareEntries: any[], targetScope?: string) {
    if (!Array.isArray(shareEntries)) throw new ForbiddenException('A valid recipient list is required.');
    const key = roleKey(actor.role);
    const scope = String(targetScope || 'PRIVATE').toUpperCase();
    const allowedPermissions = new Set(['VIEWER', 'COMMENTER', 'EDITOR']);
    if (!['PRIVATE', 'DEPARTMENT', 'ALL_CAMPUS'].includes(scope)) throw new ForbiddenException('Unsupported sharing scope.');
    if (scope === 'ALL_CAMPUS' && !BROAD_ROLES.has(key)) throw new ForbiddenException('Institution-wide sharing is not permitted for this role.');
    if (scope === 'DEPARTMENT' && (key === 'STUDENT' || key === 'PARENT' || !actor.departmentId)) throw new ForbiddenException('Department sharing is not available in this workspace.');
    if (shareEntries.some((entry) => !allowedPermissions.has(String(entry?.permission || '').toUpperCase()))) throw new ForbiddenException('Unsupported document permission.');
    if (shareEntries.some((entry) => entry?.roleName) && !BROAD_ROLES.has(key)) throw new ForbiddenException('Role-wide sharing is not permitted for this role.');
  }
}
