import { prisma } from '../../lib/prisma';
import { ForbiddenException, NotFoundException } from '../../utils/exceptions';

export interface RequesterIdentity {
  id: string;
  role: string;
}

export interface StudentAccessScope {
  unrestricted: boolean;
  studentIds: string[];
  departmentIds: string[];
  sectionIds: string[];
  subjectIds: string[];
}

export interface ResolvedStudentIdentity {
  id: string;
  departmentId: string;
  sectionId: string;
}

const normalizeRole = (role: string) => (role || '').toUpperCase().replace(/[\s_-]+/g, '');

const INSTITUTION_ROLES = new Set([
  'SUPERADMIN',
  'COLLEGEADMIN',
  'PRINCIPAL',
  'VICEPRINCIPAL',
  'ACADEMICDEAN',
  'ADMISSIONDEAN',
  'ADMINISTRATION&ADMISSIONDEAN',
  'IQACDEAN',
]);

export function canViewResolvedStudent(
  roleName: string,
  scope: StudentAccessScope,
  student: ResolvedStudentIdentity
): boolean {
  if (scope.unrestricted) return true;

  const role = normalizeRole(roleName);
  const explicitlyAssigned = scope.studentIds.includes(student.id);
  const departmentAuthorized = scope.departmentIds.includes(student.departmentId);
  const sectionAuthorized = scope.sectionIds.includes(student.sectionId);

  if (role === 'STUDENT' || role === 'PARENT' || role === 'MENTOR') return explicitlyAssigned;
  if (role === 'HOD' || role === 'HEADOFDEPARTMENT') return departmentAuthorized;
  if (role === 'FACULTY') return explicitlyAssigned || sectionAuthorized;
  return false;
}

export class StudentAccessService {
  static isInstitutionRole(role: string): boolean {
    return INSTITUTION_ROLES.has(normalizeRole(role));
  }

  static async resolveScope(requester: RequesterIdentity): Promise<StudentAccessScope> {
    if (this.isInstitutionRole(requester.role)) {
      return {
        unrestricted: true,
        studentIds: [],
        departmentIds: [],
        sectionIds: [],
        subjectIds: [],
      };
    }

    const role = normalizeRole(requester.role);
    const user = await prisma.user.findUnique({
      where: { id: requester.id },
      select: {
        departmentId: true,
        student: { select: { id: true, departmentId: true, sectionId: true } },
        parentProfile: {
          select: {
            students: { select: { studentId: true } },
          },
        },
        faculty: {
          select: {
            id: true,
            departmentId: true,
            subjectAssignments: {
              select: { sectionId: true, subjectId: true },
            },
            mentorAssignments: {
              where: { status: 'ACTIVE' },
              select: { studentId: true },
            },
            mentoredStudents: { select: { id: true } },
          },
        },
        departmentMemberships: {
          select: { departmentId: true, role: true },
        },
      },
    });

    if (!user) {
      throw new ForbiddenException('Your account cannot access student records');
    }

    const studentIds = new Set<string>();
    const departmentIds = new Set<string>();
    const sectionIds = new Set<string>();
    const subjectIds = new Set<string>();

    if (role === 'STUDENT' && user.student) {
      studentIds.add(user.student.id);
      departmentIds.add(user.student.departmentId);
      sectionIds.add(user.student.sectionId);
    }

    if (role === 'PARENT') {
      user.parentProfile?.students.forEach((relation) => studentIds.add(relation.studentId));
    }

    if (user.faculty && (role === 'FACULTY' || role === 'MENTOR' || role === 'HOD' || role === 'HEADOFDEPARTMENT')) {
      departmentIds.add(user.faculty.departmentId);
      user.departmentMemberships.forEach((membership) => {
        const membershipRole = normalizeRole(membership.role);
        if (role === 'HOD' || role === 'HEADOFDEPARTMENT') {
          if (membershipRole === 'HOD' || membershipRole === 'HEADOFDEPARTMENT') {
            departmentIds.add(membership.departmentId);
          }
        } else if (membershipRole === 'FACULTY' || membershipRole === 'MENTOR' || membershipRole === 'MEMBER') {
          departmentIds.add(membership.departmentId);
        }
      });

      user.faculty.subjectAssignments.forEach((assignment) => {
        sectionIds.add(assignment.sectionId);
        subjectIds.add(assignment.subjectId);
      });
      user.faculty.mentorAssignments.forEach((assignment) => studentIds.add(assignment.studentId));
      user.faculty.mentoredStudents.forEach((student) => studentIds.add(student.id));
    }

    if (role === 'PARENT' && studentIds.size > 0) {
      const children = await prisma.student.findMany({
        where: { id: { in: Array.from(studentIds) }, deleted: false },
        select: { departmentId: true, sectionId: true },
      });
      children.forEach((student) => {
        departmentIds.add(student.departmentId);
        sectionIds.add(student.sectionId);
      });
    }

    return {
      unrestricted: false,
      studentIds: Array.from(studentIds),
      departmentIds: Array.from(departmentIds),
      sectionIds: Array.from(sectionIds),
      subjectIds: Array.from(subjectIds),
    };
  }

  static async resolveStudent(targetId: string) {
    const student = await prisma.student.findFirst({
      where: {
        deleted: false,
        OR: [
          { id: targetId },
          { userId: targetId },
          { admissionNo: targetId },
          { email: targetId },
        ],
      },
      select: {
        id: true,
        userId: true,
        departmentId: true,
        sectionId: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    return student;
  }

  static async assertCanViewStudent(requester: RequesterIdentity, targetId: string) {
    const [scope, student] = await Promise.all([
      this.resolveScope(requester),
      this.resolveStudent(targetId),
    ]);

    if (scope.unrestricted) return student;

    if (!canViewResolvedStudent(requester.role, scope, student)) {
      throw new ForbiddenException("You don't have permission to view this student profile");
    }

    return student;
  }

  static async assertCanViewUser(requester: RequesterIdentity, targetId: string): Promise<void> {
    if (requester.id === targetId) return;

    const target = await prisma.user.findFirst({
      where: {
        OR: [{ id: targetId }, { email: targetId }, { username: targetId }],
      },
      select: {
        id: true,
        departmentId: true,
        student: { select: { id: true } },
        faculty: { select: { id: true, departmentId: true, userId: true } },
      },
    });

    const studentTarget = target?.student
      ? target.student
      : await prisma.student.findFirst({
          where: {
            deleted: false,
            OR: [{ id: targetId }, { userId: targetId }, { admissionNo: targetId }, { email: targetId }],
          },
          select: { id: true },
        });

    if (studentTarget) {
      await this.assertCanViewStudent(requester, studentTarget.id);
      return;
    }

    if (this.isInstitutionRole(requester.role)) return;

    const role = normalizeRole(requester.role);
    if (role === 'STUDENT' || role === 'PARENT') {
      throw new ForbiddenException("You don't have permission to view this profile");
    }

    const facultyTarget = target?.faculty
      ? target.faculty
      : await prisma.faculty.findFirst({
          where: {
            deleted: false,
            OR: [{ id: targetId }, { userId: targetId }, { employeeId: targetId }, { email: targetId }],
          },
          select: { id: true, departmentId: true, userId: true },
        });

    if (!facultyTarget) {
      throw new NotFoundException('Profile not found');
    }

    if (facultyTarget.userId === requester.id) return;

    const scope = await this.resolveScope(requester);
    if (!scope.departmentIds.includes(facultyTarget.departmentId)) {
      throw new ForbiddenException("You don't have permission to view this profile");
    }
  }

  static async visibleStudentWhere(requester: RequesterIdentity): Promise<Record<string, unknown>> {
    const scope = await this.resolveScope(requester);
    if (scope.unrestricted) return { deleted: false };

    const role = normalizeRole(requester.role);
    if (role === 'HOD' || role === 'HEADOFDEPARTMENT') {
      return {
        deleted: false,
        departmentId: { in: scope.departmentIds },
      };
    }

    if (role === 'FACULTY') {
      return {
        deleted: false,
        OR: [
          { id: { in: scope.studentIds } },
          { sectionId: { in: scope.sectionIds } },
        ],
      };
    }

    return {
      deleted: false,
      id: { in: scope.studentIds },
    };
  }
}
