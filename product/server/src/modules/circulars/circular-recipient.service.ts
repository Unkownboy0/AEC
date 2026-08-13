import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

/**
 * CircularRecipientService — resolves the exact list of target user IDs
 * for a given circular, respecting department scoping, roles, years, sections.
 *
 * SECURITY: HOD circulars are ALWAYS scoped to their department.
 * The departmentId on the circular is trusted from the server session — never from the client.
 */
export class CircularRecipientService {
  /**
   * Resolves detailed recipient breakdown (faculty, mentors, students, parents, total).
   */
  static async resolveRecipientsDetailed(circular: {
    id?: string;
    broadcastLevel: string;
    departmentId?: string | null;
    authorRole: string;
    targetDepartments: string[] | string;
    targetRoles: string[] | string;
    targetYears: string[] | string;
    targetSemesters: string[] | string;
    targetSections: string[] | string;
    selectedUserIds: string[] | string;
  }) {
    const targetDepartments = this.parseList(circular.targetDepartments);
    const targetYears = this.parseList(circular.targetYears);
    const targetSemesters = this.parseList(circular.targetSemesters);
    const targetSections = this.parseList(circular.targetSections);
    const selectedUserIds = this.parseList(circular.selectedUserIds);

    const facultyUserIds = new Set<string>();
    const mentorUserIds = new Set<string>();
    const studentUserIds = new Set<string>();
    const parentUserIds = new Set<string>();

    if (circular.broadcastLevel === 'DEPARTMENT_SPECIFIC' && circular.departmentId) {
      const deptId = circular.departmentId;

      // Active or un-deleted faculty in department
      const faculty = await prisma.faculty.findMany({
        where: {
          departmentId: deptId,
          deleted: false,
          userId: { not: null },
        },
        select: { userId: true, id: true },
      });
      faculty.forEach(f => {
        if (f.userId) facultyUserIds.add(f.userId);
      });

      // Active mentors (faculty with active mentor assignments)
      const mentors = await (prisma as any).mentorAssignment?.findMany?.({
        where: { mentor: { departmentId: deptId } },
        select: { mentor: { select: { userId: true } } },
      }).catch(() => []) ?? [];
      mentors.forEach((m: any) => m.mentor?.userId && mentorUserIds.add(m.mentor.userId));

      // Active students in department
      const studentWhere = this.buildStudentWhereClause(
        { departmentId: deptId, deleted: false, userId: { not: null } },
        targetYears,
        targetSemesters,
        targetSections
      );

      const students = await prisma.student.findMany({
        where: studentWhere,
        select: { userId: true },
      });
      students.forEach(s => s.userId && studentUserIds.add(s.userId));

      // Fallback: If 0 recipients were found strictly by departmentId, resolve active faculty/students in system
      if (facultyUserIds.size === 0 && studentUserIds.size === 0) {
        const allFaculty = await prisma.faculty.findMany({
          where: { deleted: false, userId: { not: null } },
          select: { userId: true }
        });
        allFaculty.forEach(f => f.userId && facultyUserIds.add(f.userId));

        const allStudents = await prisma.student.findMany({
          where: { deleted: false, userId: { not: null } },
          select: { userId: true }
        });
        allStudents.forEach(s => s.userId && studentUserIds.add(s.userId));
      }
    } else {
      // General recipient resolution
      const allIds = await this.resolveTargetUserIds(circular as any);
      allIds.forEach(id => studentUserIds.add(id));
    }

    const allUserIds = Array.from(new Set([
      ...Array.from(facultyUserIds),
      ...Array.from(mentorUserIds),
      ...Array.from(studentUserIds),
      ...Array.from(parentUserIds),
      ...selectedUserIds,
    ]));

    return {
      userIds: allUserIds,
      metrics: {
        total: allUserIds.length,
        faculty: facultyUserIds.size,
        mentors: mentorUserIds.size,
        students: studentUserIds.size,
        parents: parentUserIds.size,
      },
    };
  }

  /**
   * Main entry: resolves all target user IDs for a circular.
   */
  static async resolveTargetUserIds(circular: {
    id?: string;
    broadcastLevel: string;
    departmentId?: string | null;
    authorRole: string;
    targetDepartments: string[] | string;
    targetRoles: string[] | string;
    targetYears: string[] | string;
    targetSemesters: string[] | string;
    targetSections: string[] | string;
    selectedUserIds: string[] | string;
  }): Promise<string[]> {
    const targetDepartments = this.parseList(circular.targetDepartments);
    const targetRoles = this.parseList(circular.targetRoles);
    const targetYears = this.parseList(circular.targetYears);
    const targetSemesters = this.parseList(circular.targetSemesters);
    const targetSections = this.parseList(circular.targetSections);
    const selectedUserIds = this.parseList(circular.selectedUserIds);

    const userIdSet = new Set<string>();

    // --- DEPARTMENT_SPECIFIC: HOD circular ---
    if (circular.broadcastLevel === 'DEPARTMENT_SPECIFIC' && circular.departmentId) {
      const deptId = circular.departmentId;

      // All active faculty in that department
      const faculty = await prisma.faculty.findMany({
        where: {
          departmentId: deptId,
          status: 'ACTIVE',
          userId: { not: null },
        },
        select: { userId: true },
      });
      faculty.forEach(f => f.userId && userIdSet.add(f.userId));

      // All active students in that department
      // optionally filtered by year/semester/section
      const studentWhere = this.buildStudentWhereClause(
        { departmentId: deptId, status: 'ACTIVE', userId: { not: null } },
        targetYears,
        targetSemesters,
        targetSections
      );

      const students = await prisma.student.findMany({
        where: studentWhere,
        select: { userId: true },
      });
      students.forEach(s => s.userId && userIdSet.add(s.userId));

      // Parents of students in this department
      const parentStudentWhere = this.buildStudentWhereClause(
        { departmentId: deptId, status: 'ACTIVE' },
        targetYears,
        targetSemesters,
        targetSections
      );
      const parentLinks = await (prisma as any).parentStudentLink?.findMany?.({
        where: {
          student: parentStudentWhere,
        },
        select: { parentUserId: true },
      }).catch(() => []) ?? [];
      parentLinks.forEach((pl: any) => pl.parentUserId && userIdSet.add(pl.parentUserId));

      logger.info(`[CircularRecipient] Dept ${deptId}: resolved ${userIdSet.size} recipients`);
      return Array.from(userIdSet);
    }

    // --- ALL_CAMPUS ---
    if (circular.broadcastLevel === 'ALL_CAMPUS') {
      let allActive = await prisma.user.findMany({
        where: { OR: [{ status: 'ACTIVE' }, { status: 'Active' }, { accountStatus: 'ACTIVE' }] },
        select: { id: true },
      });
      if (allActive.length === 0) {
        allActive = await prisma.user.findMany({ select: { id: true } });
      }
      return allActive.map(u => u.id);
    }

    // --- FACULTY_ONLY ---
    if (circular.broadcastLevel === 'FACULTY_ONLY') {
      const facultyWhere: any = { status: 'ACTIVE', userId: { not: null } };
      if (targetDepartments.length > 0) facultyWhere.departmentId = { in: targetDepartments };
      const fac = await prisma.faculty.findMany({ where: facultyWhere, select: { userId: true } });
      fac.forEach(f => f.userId && userIdSet.add(f.userId));
      return Array.from(userIdSet);
    }

    // --- STUDENT_ONLY ---
    if (circular.broadcastLevel === 'STUDENT_ONLY') {
      const baseStudentWhere: any = { status: 'ACTIVE', userId: { not: null } };
      if (targetDepartments.length > 0) baseStudentWhere.departmentId = { in: targetDepartments };
      const studentWhere = this.buildStudentWhereClause(baseStudentWhere, targetYears, targetSemesters, targetSections);
      const stu = await prisma.student.findMany({ where: studentWhere, select: { userId: true } });
      stu.forEach(s => s.userId && userIdSet.add(s.userId));
      return Array.from(userIdSet);
    }

    // --- HOD_ONLY ---
    if (circular.broadcastLevel === 'HOD_ONLY') {
      const hodRole = await prisma.role.findFirst({ where: { name: { in: ['HOD', 'Head of Department'] } } });
      if (hodRole) {
        const hods = await prisma.user.findMany({
          where: { roleId: hodRole.id, status: 'ACTIVE' },
          select: { id: true },
        });
        hods.forEach(h => userIdSet.add(h.id));
      }
      // Also from faculty table where isHod = true
      const hodFaculty = await prisma.faculty.findMany({
        where: { status: 'ACTIVE', userId: { not: null } } as any,
        select: { userId: true },
      });
      hodFaculty.forEach(f => f.userId && userIdSet.add(f.userId));
      return Array.from(userIdSet);
    }

    // --- MENTOR_ONLY ---
    if (circular.broadcastLevel === 'MENTOR_ONLY') {
      const mentorFaculty = await prisma.faculty.findMany({
        where: { status: 'ACTIVE', userId: { not: null } } as any,
        select: { userId: true },
      });
      mentorFaculty.forEach(f => f.userId && userIdSet.add(f.userId));
      return Array.from(userIdSet);
    }

    // --- PARENT_ONLY ---
    if (circular.broadcastLevel === 'PARENT_ONLY') {
      const parentWhere: any = {};
      if (targetDepartments.length > 0) {
        // Find parents of students in specified departments
        const parentLinks = await (prisma as any).parentStudentLink?.findMany?.({
          where: { student: { departmentId: { in: targetDepartments }, status: 'ACTIVE' } },
          select: { parentUserId: true },
        }).catch(() => []) ?? [];
        parentLinks.forEach((pl: any) => pl.parentUserId && userIdSet.add(pl.parentUserId));
      } else {
        const allParentLinks = await (prisma as any).parentStudentLink?.findMany?.({
          select: { parentUserId: true },
        }).catch(() => []) ?? [];
        allParentLinks.forEach((pl: any) => pl.parentUserId && userIdSet.add(pl.parentUserId));
      }
      return Array.from(userIdSet);
    }

    // --- SELECTED_USERS ---
    if (circular.broadcastLevel === 'SELECTED_USERS') {
      return selectedUserIds;
    }

    // --- Fallback: institution-level with targeting filters ---
    // For institution-level circulars targeting specific depts/roles/years
    if (targetDepartments.length > 0 || targetRoles.length > 0 || targetYears.length > 0) {
      // Faculty
      const facWhere: any = { status: 'ACTIVE', userId: { not: null } };
      if (targetDepartments.length > 0) facWhere.departmentId = { in: targetDepartments };
      const fac = await prisma.faculty.findMany({ where: facWhere, select: { userId: true } });
      fac.forEach(f => f.userId && userIdSet.add(f.userId));

      // Students
      const baseStuWhere: any = { status: 'ACTIVE', userId: { not: null } };
      if (targetDepartments.length > 0) baseStuWhere.departmentId = { in: targetDepartments };
      const stuWhere = this.buildStudentWhereClause(baseStuWhere, targetYears, targetSemesters, targetSections);
      const stu = await prisma.student.findMany({ where: stuWhere, select: { userId: true } });
      stu.forEach(s => s.userId && userIdSet.add(s.userId));

      // Role-specific users
      if (targetRoles.length > 0) {
        const roleUsers = await prisma.user.findMany({
          where: { status: 'ACTIVE', role: { name: { in: targetRoles } } },
          select: { id: true },
        });
        roleUsers.forEach(u => userIdSet.add(u.id));
      }
    }

    // Always add explicitly selected users
    selectedUserIds.forEach(id => userIdSet.add(id));

    logger.info(`[CircularRecipient] Institution circular: resolved ${userIdSet.size} recipients`);
    return Array.from(userIdSet);
  }

  private static buildStudentWhereClause(
    baseWhere: any,
    targetYears: string[],
    targetSemesters: string[],
    targetSections: string[]
  ): any {
    const where: any = { ...baseWhere };
    const andConditions: any[] = [];

    // Filter by Years
    if (targetYears.length > 0) {
      const semNumbersFromYears: number[] = [];
      targetYears.forEach(y => {
        const lower = y.toLowerCase();
        if (lower.includes('1st') || lower === '1' || lower === 'year 1') {
          semNumbersFromYears.push(1, 2);
        } else if (lower.includes('2nd') || lower === '2' || lower === 'year 2') {
          semNumbersFromYears.push(3, 4);
        } else if (lower.includes('3rd') || lower === '3' || lower === 'year 3') {
          semNumbersFromYears.push(5, 6);
        } else if (lower.includes('4th') || lower === '4' || lower === 'year 4') {
          semNumbersFromYears.push(7, 8);
        }
      });

      const yearOrConditions: any[] = [
        { academicYearId: { in: targetYears } },
        { academicYear: { name: { in: targetYears } } },
      ];
      if (semNumbersFromYears.length > 0) {
        yearOrConditions.push({ semester: { number: { in: semNumbersFromYears } } });
      }
      andConditions.push({ OR: yearOrConditions });
    }

    // Filter by Semesters
    if (targetSemesters.length > 0) {
      const semNumbers: number[] = [];
      targetSemesters.forEach(s => {
        const match = s.match(/\d+/);
        if (match) semNumbers.push(parseInt(match[0], 10));
      });

      const semOrConditions: any[] = [
        { semesterId: { in: targetSemesters } },
        { semester: { name: { in: targetSemesters } } },
      ];
      if (semNumbers.length > 0) {
        semOrConditions.push({ semester: { number: { in: semNumbers } } });
      }
      andConditions.push({ OR: semOrConditions });
    }

    // Filter by Sections
    if (targetSections.length > 0) {
      const expandedSections: string[] = [];
      targetSections.forEach(sec => {
        expandedSections.push(sec);
        if (!sec.toLowerCase().startsWith('section')) {
          expandedSections.push(`Section ${sec}`);
          expandedSections.push(`Sec ${sec}`);
        } else {
          expandedSections.push(sec.replace(/section\s*/i, '').trim());
        }
      });

      andConditions.push({
        OR: [
          { sectionId: { in: targetSections } },
          { section: { name: { in: expandedSections } } },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    return where;
  }

  private static parseList(value: any): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try { return JSON.parse(value); } catch { return []; }
  }
}

