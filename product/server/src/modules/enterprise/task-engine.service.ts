import { prisma } from '../../lib/prisma';
import { NotFoundException, BadRequestException, ForbiddenException } from '../../utils/exceptions';
import { AuditService } from '../security/audit.service';
import { NotificationService } from '../notifications/notification.service';

export interface CreateTaskEngineDto {
  title: string;
  description?: string;
  category?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  departmentId?: string;
  assigneeIds: string[];
  checklist?: { id?: string; title: string; isCompleted?: boolean }[];
  estimatedHours?: number;
  colorLabel?: string;
  slaHours?: number;
  isRecurring?: boolean;
  recurringRule?: string;
  templateId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  remarks?: string;
}

export class TaskEngineService {
  /**
   * 1. Create Enterprise Task with Checklist & SLA
   */
  static async createTask(createdById: string, dto: CreateTaskEngineDto) {
    if (!dto.title || !dto.title.trim()) {
      throw new BadRequestException('Task title is required');
    }
    if (!dto.assigneeIds || dto.assigneeIds.length === 0) {
      throw new BadRequestException('At least one assignee is required');
    }

    const count = await prisma.task.count();
    const taskNumber = `TSK-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const formattedChecklist = dto.checklist
      ? JSON.stringify(
          dto.checklist.map((item, idx) => ({
            id: item.id || `chk-${Date.now()}-${idx}`,
            title: item.title,
            isCompleted: !!item.isCompleted,
          }))
        )
      : null;

    const task = await prisma.task.create({
      data: {
        taskNumber,
        title: dto.title.trim(),
        description: dto.description || null,
        category: dto.category || 'ACADEMIC_DOCUMENTATION',
        priority: dto.priority || 'MEDIUM',
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        departmentId: dto.departmentId || null,
        createdById,
        status: 'NOT_SEEN',
        completionPercent: 0,
        checklist: formattedChecklist,
        estimatedHours: dto.estimatedHours || 4.0,
        colorLabel: dto.colorLabel || '#6366f1',
        slaHours: dto.slaHours || 48,
        isRecurring: !!dto.isRecurring,
        recurringRule: dto.recurringRule || null,
        templateId: dto.templateId || null,
        relatedEntityType: dto.relatedEntityType || null,
        relatedEntityId: dto.relatedEntityId || null,
        remarks: dto.remarks || null,
        assignees: {
          create: dto.assigneeIds.map((assigneeId) => ({
            assigneeId,
            status: 'NOT_SEEN',
            completionPercent: 0,
          })),
        },
      },
      include: {
        assignees: {
          include: {
            assignee: { select: { id: true, firstName: true, lastName: true, email: true, designation: true } },
          },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    });

    // Log Audit
    await AuditService.log({
      actorId: createdById,
      action: 'CREATE',
      entityType: 'TASK',
      entityId: task.id,
      description: `Created Enterprise Task ${task.taskNumber}: ${task.title}`,
    });

    // Instant Notifications
    for (const assigneeId of dto.assigneeIds) {
      await NotificationService.sendNotification({
        recipientId: assigneeId,
        eventType: 'TASK_ASSIGNED',
        title: 'New Enterprise Task Assigned',
        message: `Task ${task.taskNumber} (${task.title}) has been assigned to you.`,
        relatedEntityType: 'TASK',
        relatedEntityId: task.id,
        deepLinkRoute: `/tasks/${task.id}`,
      });
    }

    return task;
  }

  /**
   * 2. Get Kanban Board Grouped Data
   */
  static async getKanbanBoard(departmentId?: string, assigneeId?: string) {
    const where: any = {};
    if (departmentId && departmentId !== 'ALL') {
      where.departmentId = departmentId;
    }
    if (assigneeId) {
      where.assignees = { some: { assigneeId } };
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignees: {
          include: {
            assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        department: { select: { id: true, code: true, name: true } },
      },
    });

    const columns: Record<string, any[]> = {
      NOT_SEEN: [],
      SEEN: [],
      ACCEPTED: [],
      IN_PROGRESS: [],
      WAITING_APPROVAL: [],
      COMPLETED: [],
      REJECTED: [],
    };

    tasks.forEach((t) => {
      const colKey = columns[t.status] ? t.status : 'NOT_SEEN';
      columns[colKey].push(t);
    });

    return {
      totalTasks: tasks.length,
      columns,
    };
  }

  /**
   * 3. Update Checklist & Progress
   */
  static async updateChecklist(taskId: string, userId: string, checklist: any[]) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    const total = checklist.length;
    const completedCount = checklist.filter((c) => c.isCompleted).length;
    const completionPercent = total > 0 ? Math.round((completedCount / total) * 100) : task.completionPercent;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        checklist: JSON.stringify(checklist),
        completionPercent,
        status: completionPercent === 100 ? 'COMPLETED' : task.status === 'NOT_SEEN' ? 'IN_PROGRESS' : task.status,
        completedAt: completionPercent === 100 ? new Date() : null,
      },
    });

    await AuditService.log({
      actorId: userId,
      action: 'UPDATE',
      entityType: 'TASK',
      entityId: taskId,
      description: `Updated checklist for task ${task.taskNumber}. Progress: ${completionPercent}%`,
    });

    return updatedTask;
  }

  /**
   * 4. Workload Balancer & Department Analytics
   */
  static async getWorkloadAnalytics(departmentId?: string) {
    const whereClause: any = { status: 'ACTIVE' };
    if (departmentId && departmentId !== 'ALL') {
      whereClause.departmentId = departmentId;
    }

    const faculties = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        designation: true,
        departmentId: true,
        assignedTasks: {
          where: {
            task: { status: { notIn: ['COMPLETED', 'REJECTED'] } },
          },
          include: {
            task: {
              select: { id: true, title: true, priority: true, estimatedHours: true, dueDate: true },
            },
          },
        },
      },
    });

    const workloadList = faculties.map((f) => {
      const activeTasks = f.assignedTasks.length;
      const totalEstimatedHours = f.assignedTasks.reduce(
        (sum, t) => sum + (t.task.estimatedHours || 4.0),
        0
      );

      let loadRisk = 'LOW';
      if (activeTasks >= 7 || totalEstimatedHours > 35) loadRisk = 'HIGH_LOAD';
      else if (activeTasks >= 4 || totalEstimatedHours > 20) loadRisk = 'MEDIUM';

      return {
        userId: f.id,
        name: `${f.firstName} ${f.lastName}`,
        email: f.email,
        designation: f.designation,
        activeTasksCount: activeTasks,
        totalEstimatedHours,
        loadRisk,
        tasks: f.assignedTasks.map((at) => at.task),
      };
    });

    return {
      totalStaff: faculties.length,
      highLoadStaffCount: workloadList.filter((w) => w.loadRisk === 'HIGH_LOAD').length,
      workloadList,
    };
  }

  /**
   * 5. Task Template Library Management
   */
  static async getTemplates(category?: string) {
    const where: any = { status: 'ACTIVE' };
    if (category) where.category = category;
    return await prisma.taskTemplate.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  static async createTemplate(data: {
    name: string;
    category?: string;
    description?: string;
    defaultChecklist?: any[];
    suggestedTimelineDays?: number;
    slaHours?: number;
    defaultPriority?: string;
    departmentId?: string;
  }) {
    return await prisma.taskTemplate.create({
      data: {
        name: data.name,
        category: data.category || 'ACADEMIC_DOCUMENTATION',
        description: data.description || null,
        defaultChecklist: data.defaultChecklist ? JSON.stringify(data.defaultChecklist) : null,
        suggestedTimelineDays: data.suggestedTimelineDays || 7,
        slaHours: data.slaHours || 48,
        defaultPriority: data.defaultPriority || 'MEDIUM',
        departmentId: data.departmentId || null,
      },
    });
  }
}
