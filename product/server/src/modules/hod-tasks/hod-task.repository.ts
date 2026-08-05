import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

export class HodTaskRepository {
  /**
   * Fetch all tasks assigned to a specific HOD user or their department.
   */
  async findTasksForHod(userId: string, filterStatus?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const hodFaculty = await prisma.faculty.findFirst({
      where: { OR: [{ userId }, { email: user?.email }] },
      select: { departmentId: true }
    });

    const whereClause: any = {
      deleted: false,
      OR: [
        { assignedToId: userId },
        ...(hodFaculty?.departmentId ? [{ departmentId: hodFaculty.departmentId }] : []),
      ]
    };

    if (filterStatus && filterStatus !== 'ALL') {
      if (filterStatus === 'UNREAD') whereClause.status = 'ASSIGNED';
      else if (filterStatus === 'IN_PROGRESS') whereClause.status = 'IN_PROGRESS';
      else if (filterStatus === 'SUBMITTED') whereClause.status = 'SUBMITTED';
      else if (filterStatus === 'COMPLETED') whereClause.status = 'COMPLETED';
      else if (filterStatus === 'OVERDUE') whereClause.status = 'OVERDUE';
      else if (filterStatus === 'REVISION_REQUIRED') whereClause.status = 'REVISION_REQUIRED';
    }

    return (prisma as any).task.findMany({
      where: whereClause,
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, email: true, role: { select: { name: true } } } },
        department: { select: { id: true, name: true, code: true } },
      }
    });
  }

  /**
   * Calculate live summary metrics for HOD Task Dashboard.
   */
  async getHodTaskSummary(userId: string) {
    const tasks = await this.findTasksForHod(userId, 'ALL');
    const now = new Date();

    const newTasks = tasks.filter((t: any) => t.status === 'ASSIGNED' || t.status === 'DELIVERED').length;
    const unreadTasks = tasks.filter((t: any) => t.status === 'ASSIGNED').length;
    const pendingAck = tasks.filter((t: any) => t.status === 'DELIVERED' || t.status === 'ASSIGNED').length;
    const inProgress = tasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
    const dueToday = tasks.filter((t: any) => t.dueDate && new Date(t.dueDate).toDateString() === now.toDateString()).length;
    const overdue = tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED').length;
    const submitted = tasks.filter((t: any) => t.status === 'SUBMITTED' || t.status === 'UNDER_REVIEW').length;
    const revisionRequired = tasks.filter((t: any) => t.status === 'REVISION_REQUIRED').length;
    const completedThisMonth = tasks.filter((t: any) => t.status === 'COMPLETED').length;

    return {
      newTasks,
      unreadTasks,
      pendingAcknowledgement: pendingAck,
      inProgress,
      dueToday,
      overdue,
      submitted,
      revisionRequired,
      completedThisMonth,
      unreadTaskMessages: 0,
    };
  }

  /**
   * Find single task detail.
   */
  async findById(taskId: string) {
    return (prisma as any).task.findUnique({
      where: { id: taskId },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: { select: { name: true } } } },
        department: { select: { id: true, name: true, code: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });
  }

  /**
   * Update task fields.
   */
  async update(taskId: string, data: Partial<any>) {
    return (prisma as any).task.update({
      where: { id: taskId },
      data,
    });
  }
}
