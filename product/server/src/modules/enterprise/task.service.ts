import { prisma } from '../../lib/prisma';
import { NotFoundException, BadRequestException, ForbiddenException } from '../../utils/exceptions';
import { AuditService } from '../security/audit.service';
import { NotificationService } from '../notifications/notification.service';

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  departmentId?: string;
  assigneeIds: string[];
  visibility?: 'ASSIGNED' | 'DEPARTMENT' | 'PUBLIC';
  relatedEntityType?: string;
  relatedEntityId?: string;
  remarks?: string;
}

export interface UpdateTaskProgressDto {
  completionPercent: number;
  comment?: string;
}

export class TaskService {
  private async assertCanAccessTask(taskId: string, userId: string, userRole?: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        createdById: true,
        visibility: true,
        departmentId: true,
        assignees: { select: { assigneeId: true } },
      },
    });
    if (!task) throw new NotFoundException('Task not found');

    const normalizedRole = String(userRole || '').toUpperCase().replace(/[\s_-]+/g, '');
    if (['SUPERADMIN', 'COLLEGEADMIN', 'PRINCIPAL'].includes(normalizedRole)) return task;
    if (task.createdById === userId || task.assignees.some((item) => item.assigneeId === userId)) return task;
    if (task.visibility === 'PUBLIC') return task;

    if (task.visibility === 'DEPARTMENT' && task.departmentId) {
      const membership = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          departmentId: true,
          departmentMemberships: { select: { departmentId: true } },
        },
      });
      const departments = new Set([
        ...(membership?.departmentId ? [membership.departmentId] : []),
        ...(membership?.departmentMemberships.map((item) => item.departmentId) || []),
      ]);
      if (departments.has(task.departmentId)) return task;
    }

    throw new ForbiddenException("You don't have permission to view this task");
  }

  private async assertCanParticipate(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { createdById: true, assignees: { select: { assigneeId: true } } },
    });
    if (!task) throw new NotFoundException('Task not found');
    if (task.createdById !== userId && !task.assignees.some((item) => item.assigneeId === userId)) {
      throw new ForbiddenException('Only the task creator or assigned recipients can change this task');
    }
  }

  /**
   * Create a new task and assign to one or multiple users
   */
  async createTask(createdById: string, dto: CreateTaskDto) {
    if (!dto.title || !dto.title.trim()) {
      throw new BadRequestException('Task title is required');
    }

    if (!dto.assigneeIds || dto.assigneeIds.length === 0) {
      throw new BadRequestException('At least one assignee is required');
    }

    const taskCount = await prisma.task.count();
    const taskNumber = `TSK-${new Date().getFullYear()}-${String(taskCount + 1).padStart(4, '0')}`;

    const task = await prisma.task.create({
      data: {
        taskNumber,
        title: dto.title.trim(),
        description: dto.description,
        priority: dto.priority || 'MEDIUM',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        departmentId: dto.departmentId || null,
        createdById,
        status: 'NOT_SEEN',
        visibility: dto.visibility || 'ASSIGNED',
        completionPercent: 0,
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
        history: {
          create: {
            changedById: createdById,
            newStatus: 'NOT_SEEN',
            newPercent: 0,
            comment: 'Task created and assigned',
          },
        },
      },
      include: {
        assignees: {
          include: {
            assignee: {
              select: { id: true, firstName: true, lastName: true, email: true, role: true },
            },
          },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Central Event-Driven Dispatch to assignees
    NotificationService.dispatchDomainEvent({
      eventType: 'TASK_ASSIGNED',
      actorUserId: createdById,
      entityType: 'TASK',
      entityId: task.id,
      title: `New Task Assigned: ${dto.title.trim()}`,
      body: `${task.createdBy.firstName} ${task.createdBy.lastName} assigned you a task: ${dto.title.trim()}`,
      priority: dto.priority === 'URGENT' || dto.priority === 'HIGH' ? 'HIGH' : 'NORMAL',
      category: 'TASKS',
      deepLinkRoute: `/tasks/${task.id}`,
      targetUserIds: dto.assigneeIds,
    }).catch((err) => console.error('[TaskService] Notification dispatch error:', err));

    await AuditService.log({
      actorId: createdById,
      action: 'TASK_CREATED',
      entityType: 'TASK',
      entityId: task.id,
      description: `Task ${task.taskNumber} created: ${task.title}`,
      newValues: { taskNumber: task.taskNumber, title: task.title, priority: task.priority },
    });

    return task;
  }

  /**
   * Get tasks accessible by the requesting user
   */
  async getTasks(userId: string, userRole: string, options: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    departmentId?: string;
    search?: string;
  }) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.status) {
      where.status = options.status;
    }

    if (options.priority) {
      where.priority = options.priority;
    }

    if (options.departmentId) {
      where.departmentId = options.departmentId;
    }

    if (options.search) {
      where.OR = [
        { title: { contains: options.search } },
        { description: { contains: options.search } },
        { taskNumber: { contains: options.search } },
      ];
    }

    // Role-aware task filtering
    const isCollegeWide = [
      'Super Admin', 'College Admin', 'Principal',
    ].includes(userRole);

    if (!isCollegeWide) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { departmentId: true, departmentMemberships: { select: { departmentId: true } } },
      });
      const deptIds = Array.from(new Set([
        ...(user?.departmentId ? [user.departmentId] : []),
        ...(user?.departmentMemberships.map((item) => item.departmentId) || []),
      ]));

      where.AND = [
        {
          OR: [
            { createdById: userId },
            { assignees: { some: { assigneeId: userId } } },
            { visibility: 'PUBLIC' },
            { AND: [{ visibility: 'DEPARTMENT' }, { departmentId: { in: deptIds } }] },
          ],
        },
      ];
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignees: {
            include: {
              assignee: {
                select: { id: true, firstName: true, lastName: true, email: true },
              },
            },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          department: {
            select: { id: true, name: true, code: true },
          },
          _count: {
            select: { comments: true, attachments: true },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    // Calculate dynamic overdue flag
    const now = new Date();
    const formattedTasks = tasks.map((t) => {
      const isOverdue = t.dueDate && t.dueDate < now && !['COMPLETED', 'REJECTED'].includes(t.status);
      return {
        ...t,
        isOverdue,
        computedStatus: isOverdue ? 'OVERDUE' : t.status,
      };
    });

    return {
      data: formattedTasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get task details by ID & automatically mark as SEEN if user is an assignee
   */
  async getTaskById(taskId: string, userId: string, userRole?: string) {
    await this.assertCanAccessTask(taskId, userId, userRole);
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: {
          include: {
            assignee: {
              select: { id: true, firstName: true, lastName: true, email: true, role: true },
            },
          },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
        history: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        comments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true, email: true, role: true },
            },
            mentions: {
              include: {
                mentionedUser: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
            attachments: true,
          },
        },
        attachments: {
          where: { deletedAt: null },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Automatically mark as SEEN if user is an assignee and currently NOT_SEEN
    const assigneeRecord = task.assignees.find((a) => a.assigneeId === userId);
    if (assigneeRecord && assigneeRecord.status === 'NOT_SEEN') {
      await prisma.taskAssignee.update({
        where: { id: assigneeRecord.id },
        data: { status: 'SEEN', seenAt: new Date() },
      });

      if (task.status === 'NOT_SEEN') {
        await prisma.task.update({
          where: { id: taskId },
          data: { status: 'SEEN' },
        });

        await prisma.taskStatusHistory.create({
          data: {
            taskId,
            changedById: userId,
            previousStatus: 'NOT_SEEN',
            newStatus: 'SEEN',
            comment: 'Task viewed by assignee',
          },
        });
      }
    }

    const now = new Date();
    const isOverdue = task.dueDate && task.dueDate < now && !['COMPLETED', 'REJECTED'].includes(task.status);

    return {
      ...task,
      isOverdue,
      computedStatus: isOverdue ? 'OVERDUE' : task.status,
    };
  }

  /**
   * Update task status (Accept, Start, Complete, Reject)
   */
  async updateTaskStatus(taskId: string, userId: string, newStatus: 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED', comment?: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignees: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const isAssignee = task.assignees.some((a) => a.assigneeId === userId);
    const isCreator = task.createdById === userId;

    if (!isAssignee && !isCreator) {
      throw new ForbiddenException('Only task creator or assignees can update status');
    }

    let completionPercent = task.completionPercent;
    if (newStatus === 'COMPLETED') completionPercent = 100;
    if (newStatus === 'ACCEPTED' && completionPercent === 0) completionPercent = 0;

    const previousStatus = task.status;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        completionPercent,
        completedAt: newStatus === 'COMPLETED' ? new Date() : undefined,
      },
    });

    // Update Assignee record if user is an assignee
    const assigneeRecord = task.assignees.find((a) => a.assigneeId === userId);
    if (assigneeRecord) {
      await prisma.taskAssignee.update({
        where: { id: assigneeRecord.id },
        data: {
          status: newStatus,
          completionPercent,
          acceptedAt: newStatus === 'ACCEPTED' ? new Date() : undefined,
          completedAt: newStatus === 'COMPLETED' ? new Date() : undefined,
          rejectedAt: newStatus === 'REJECTED' ? new Date() : undefined,
          rejectionReason: newStatus === 'REJECTED' ? comment : undefined,
        },
      });
    }

    // Add status history
    await prisma.taskStatusHistory.create({
      data: {
        taskId,
        changedById: userId,
        previousStatus,
        newStatus,
        previousPercent: task.completionPercent,
        newPercent: completionPercent,
        comment: comment || `Status updated to ${newStatus}`,
      },
    });

    // Notify task creator or assignees
    if (userId !== task.createdById) {
      const eventType = newStatus === 'COMPLETED' ? 'TASK_COMPLETED' : 'TASK_UPDATED';
      await NotificationService.dispatchDomainEvent({
        eventType,
        actorUserId: userId,
        entityType: 'TASK',
        entityId: task.id,
        title: `Task ${newStatus === 'COMPLETED' ? 'Completed' : 'Updated'}: ${task.title}`,
        body: `Task ${task.taskNumber} was marked as ${newStatus} by ${userId}.`,
        priority: newStatus === 'COMPLETED' ? 'NORMAL' : 'NORMAL',
        category: 'TASKS',
        deepLinkRoute: `/tasks/${task.id}`,
        targetUserIds: [task.createdById],
        metadata: {
          taskId: task.id,
          taskNumber: task.taskNumber,
          newStatus,
        },
      });
    }

    await AuditService.log({
      actorId: userId,
      action: 'TASK_STATUS_UPDATED',
      entityType: 'TASK',
      entityId: taskId,
      description: `Task ${task.taskNumber} status changed from ${previousStatus} to ${newStatus}`,
    });

    return updatedTask;
  }

  /**
   * Update completion percentage (0 - 100%)
   */
  async updateProgress(taskId: string, userId: string, dto: UpdateTaskProgressDto) {
    if (dto.completionPercent < 0 || dto.completionPercent > 100) {
      throw new BadRequestException('Completion percentage must be between 0 and 100');
    }

    await this.assertCanParticipate(taskId, userId);
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    const previousPercent = task.completionPercent;
    const newStatus = dto.completionPercent === 100 ? 'COMPLETED' : 'IN_PROGRESS';

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        completionPercent: dto.completionPercent,
        status: newStatus,
        completedAt: dto.completionPercent === 100 ? new Date() : undefined,
      },
    });

    await prisma.taskStatusHistory.create({
      data: {
        taskId,
        changedById: userId,
        previousStatus: task.status,
        newStatus,
        previousPercent,
        newPercent: dto.completionPercent,
        comment: dto.comment || `Progress updated to ${dto.completionPercent}%`,
      },
    });

    return updatedTask;
  }

  /**
   * Add a comment to task discussion with optional @mentions
   */
  async addComment(taskId: string, authorId: string, content: string, parentId?: string) {
    if (!content || !content.trim()) {
      throw new BadRequestException('Comment content cannot be empty');
    }

    await this.assertCanParticipate(taskId, authorId);
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        authorId,
        parentId: parentId || null,
        content: content.trim(),
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // Parse @mentions (e.g., @user@geetorus.com or @UserFirstName)
    const mentionRegex = /@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
    const matches = Array.from(content.matchAll(mentionRegex));

    for (const match of matches) {
      const email = match[1];
      const mentionedUser = await prisma.user.findUnique({ where: { email } });
      if (mentionedUser) {
        await prisma.taskCommentMention.create({
          data: {
            commentId: comment.id,
            mentionedUserId: mentionedUser.id,
          },
        });

        await NotificationService.dispatchDomainEvent({
          eventType: 'TASK_COMMENTED',
          actorUserId: authorId,
          entityType: 'TASK',
          entityId: taskId,
          title: 'You were mentioned in a task discussion',
          body: `${comment.author.firstName} mentioned you in Task ${task.taskNumber}: "${content.slice(0, 80)}"`,
          priority: 'NORMAL',
          category: 'TASKS',
          deepLinkRoute: `/tasks/${taskId}`,
          targetUserIds: [mentionedUser.id],
        });
      }
    }

    return comment;
  }
}
