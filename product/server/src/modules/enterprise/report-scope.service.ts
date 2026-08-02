import { prisma } from '../../lib/prisma';

export interface ScopeContext {
  userId: string;
  userRole: string;
  activeWorkspace?: string;
  departmentId?: string;
  facultyId?: string;
  studentId?: string;
}

export class ReportScopeResolver {
  /**
   * Resolve user scope context for analytics queries
   */
  static async resolveScope(userId: string, roleName: string): Promise<ScopeContext> {
    const context: ScopeContext = {
      userId,
      userRole: roleName,
    };

    if (roleName === 'HOD') {
      const faculty = await prisma.faculty.findFirst({ where: { userId } });
      if (faculty) context.departmentId = faculty.departmentId;
    } else if (['Faculty', 'Mentor'].includes(roleName)) {
      const faculty = await prisma.faculty.findFirst({ where: { userId } });
      if (faculty) {
        context.facultyId = faculty.id;
        context.departmentId = faculty.departmentId;
      }
    } else if (roleName === 'Student') {
      const student = await prisma.student.findFirst({ where: { userId } });
      if (student) {
        context.studentId = student.id;
        context.departmentId = student.departmentId;
      }
    }

    return context;
  }
}
