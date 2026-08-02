import { prisma } from '../../lib/prisma';
import { NotFoundException, BadRequestException, ForbiddenException } from '../../utils/exceptions';
import { AuditService } from '../security/audit.service';
import { NotificationService } from '../notifications/notification.service';

export interface CreateAcademicTaskDto {
  title: string;
  description?: string;
  category?: string;
  expectedOutput?: string;
  instructions?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  confidentialityLevel?: 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  assignmentMode: 'ALL_HODS' | 'ALL_DEPARTMENTS' | 'SINGLE_DEPARTMENT' | 'MULTIPLE_DEPARTMENTS' | 'SINGLE_HOD' | 'MULTIPLE_HODS';
  departmentIds?: string[];
  hodUserIds?: string[];
  startAt?: string;
  dueAt: string;
  reminderConfig?: {
    reminder7Days?: boolean;
    reminder3Days?: boolean;
    reminder1Day?: boolean;
    reminderDueDay?: boolean;
    overdueReminder?: boolean;
    escalationReminder?: boolean;
  };
  submissionRequirements?: {
    requiredFileTypes?: string[];
    maxFileCount?: number;
    maxFileSizeMb?: number;
    textResponseRequired?: boolean;
    excelRequired?: boolean;
    pdfRequired?: boolean;
    proofRequired?: boolean;
    remarksRequired?: boolean;
    checklistItems?: string[];
  };
  referenceFileIds?: string[];
  publishImmediately?: boolean;
  scheduledPublishAt?: string;
}

export interface ReviewSubmissionDto {
  action: 'APPROVE' | 'REQUEST_CORRECTION' | 'RETURN_FOR_CLARIFICATION' | 'REOPEN' | 'MARK_COMPLETED' | 'REJECT_WITH_REASON';
  remarks: string;
}

export interface ExtendDueDateDto {
  newDueAt: string;
  reason: string;
  scope: 'ALL' | 'SELECTED_DEPARTMENTS' | 'SELECTED_HOD';
  targetDepartmentIds?: string[];
  targetAssignmentIds?: string[];
}

export class AcademicTaskService {
  /**
   * 1. Resolve target HOD assignments based on scope
   */
  static async resolveAssignments(mode: string, deptIds?: string[], hodIds?: string[]) {
    const targets: { departmentId: string; hodUserId: string }[] = [];

    if (mode === 'ALL_HODS' || mode === 'ALL_DEPARTMENTS') {
      const activeDepts = await prisma.department.findMany({
        where: { status: 'ACTIVE', deleted: false },
        select: { id: true, hodId: true, code: true },
      });

      for (const dept of activeDepts) {
        // Find user with HOD role in this department
        const hodUser = await prisma.user.findFirst({
          where: {
            departmentId: dept.id,
            status: 'ACTIVE',
            role: { name: 'HOD' },
          },
          select: { id: true },
        });

        if (hodUser) {
          targets.push({ departmentId: dept.id, hodUserId: hodUser.id });
        }
      }
    } else if (mode === 'SINGLE_DEPARTMENT' || mode === 'MULTIPLE_DEPARTMENTS') {
      if (!deptIds || deptIds.length === 0) {
        throw new BadRequestException('At least one department must be selected');
      }

      for (const deptId of deptIds) {
        const hodUser = await prisma.user.findFirst({
          where: {
            departmentId: deptId,
            status: 'ACTIVE',
            role: { name: 'HOD' },
          },
          select: { id: true },
        });

        if (!hodUser) {
          throw new BadRequestException(`No active HOD found for department ID ${deptId}`);
        }

        targets.push({ departmentId: deptId, hodUserId: hodUser.id });
      }
    } else if (mode === 'SINGLE_HOD' || mode === 'MULTIPLE_HODS') {
      if (!hodIds || hodIds.length === 0) {
        throw new BadRequestException('At least one HOD must be selected');
      }

      for (const hodUserId of hodIds) {
        const user = await prisma.user.findUnique({
          where: { id: hodUserId },
          select: { id: true, departmentId: true, status: true, role: { select: { name: true } } },
        });

        if (!user || user.status !== 'ACTIVE' || user.role.name !== 'HOD') {
          throw new BadRequestException(`Invalid or inactive HOD user ID: ${hodUserId}`);
        }

        if (!user.departmentId) {
          throw new BadRequestException(`HOD user ${hodUserId} is not assigned to a department`);
        }

        targets.push({ departmentId: user.departmentId, hodUserId: user.id });
      }
    }

    if (targets.length === 0) {
      throw new BadRequestException('No valid active HOD recipients could be resolved for task assignment');
    }

    // Deduplicate recipients
    const uniqueMap = new Map<string, { departmentId: string; hodUserId: string }>();
    for (const t of targets) {
      uniqueMap.set(`${t.departmentId}_${t.hodUserId}`, t);
    }

    return Array.from(uniqueMap.values());
  }

  /**
   * 2. Create Academic Dean Task with per-department child assignments
   */
  static async createTask(createdById: string, dto: CreateAcademicTaskDto) {
    if (!dto.title || !dto.title.trim()) {
      throw new BadRequestException('Task title is required');
    }

    if (!dto.dueAt) {
      throw new BadRequestException('Task due date is required');
    }

    const dueAtDate = new Date(dto.dueAt);
    if (isNaN(dueAtDate.getTime())) {
      throw new BadRequestException('Invalid due date format');
    }

    const resolvedRecipients = await this.resolveAssignments(
      dto.assignmentMode,
      dto.departmentIds,
      dto.hodUserIds
    );

    const year = new Date().getFullYear();
    const count = await (prisma as any).academicTask.count();
    const taskCode = `TASK-${year}-${String(count + 1).padStart(3, '0')}`;

    const isPublished = dto.publishImmediately !== false;

    // Transaction to create parent task, child assignments, reference file links, timeline, and reminders
    const result = await prisma.$transaction(async (tx) => {
      const parentTask = await (tx as any).academicTask.create({
        data: {
          taskCode,
          title: dto.title.trim(),
          description: dto.description || null,
          category: dto.category || 'ACADEMIC_REPORT',
          expectedOutput: dto.expectedOutput || null,
          instructions: dto.instructions || null,
          priority: dto.priority || 'MEDIUM',
          confidentialityLevel: dto.confidentialityLevel || 'INTERNAL',
          assignmentMode: dto.assignmentMode,
          startAt: dto.startAt ? new Date(dto.startAt) : new Date(),
          dueAt: dueAtDate,
          publishedAt: isPublished ? new Date() : null,
          scheduledPublishAt: dto.scheduledPublishAt ? new Date(dto.scheduledPublishAt) : null,
          status: isPublished ? 'PUBLISHED' : 'DRAFT',
          reminderConfig: dto.reminderConfig ? JSON.stringify(dto.reminderConfig) : null,
          submissionRequirements: dto.submissionRequirements ? JSON.stringify(dto.submissionRequirements) : null,
          createdById,
        },
      });

      const assignmentRecords = [];
      for (const recipient of resolvedRecipients) {
        const dept = await tx.department.findUnique({
          where: { id: recipient.departmentId },
          select: { code: true },
        });

        const assignmentCode = `${taskCode}-${dept?.code || 'DEPT'}`;

        const assignment = await (tx as any).academicTaskAssignment.create({
          data: {
            taskId: parentTask.id,
            departmentId: recipient.departmentId,
            assignedHodUserId: recipient.hodUserId,
            assignmentCode,
            status: isPublished ? 'ASSIGNED' : 'DRAFT',
            originalDueAt: dueAtDate,
            currentDueAt: dueAtDate,
            assignedById: createdById,
          },
        });

        assignmentRecords.push(assignment);

        if (isPublished) {
          // Timeline event for each assignment
          await (tx as any).academicTaskTimeline.create({
            data: {
              taskId: parentTask.id,
              assignmentId: assignment.id,
              eventType: 'HOD_ASSIGNED',
              actorUserId: createdById,
              actorRole: 'Academic Dean',
              departmentId: recipient.departmentId,
              newStatus: 'ASSIGNED',
              remarks: `Task assigned to department ${dept?.code}`,
            },
          });
        }
      }

      // Link reference files if provided
      if (dto.referenceFileIds && dto.referenceFileIds.length > 0) {
        await (tx as any).academicTaskFile.updateMany({
          where: { id: { in: dto.referenceFileIds } },
          data: { taskId: parentTask.id, fileScope: 'REFERENCE' },
        });
      }

      // Parent Task Timeline event
      await (tx as any).academicTaskTimeline.create({
        data: {
          taskId: parentTask.id,
          eventType: isPublished ? 'TASK_PUBLISHED' : 'TASK_CREATED',
          actorUserId: createdById,
          actorRole: 'Academic Dean',
          newStatus: isPublished ? 'PUBLISHED' : 'DRAFT',
          remarks: isPublished ? `Published task ${taskCode}` : `Created draft task ${taskCode}`,
        },
      });

      return { parentTask, assignments: assignmentRecords };
    });

    // Notify HODs if published immediately
    if (isPublished) {
      for (const assign of result.assignments) {
        await NotificationService.sendNotification({
          recipientId: assign.assignedHodUserId,
          eventType: 'ACADEMIC_TASK_ASSIGNED',
          title: 'New Academic Task Assigned',
          message: `Academic Task ${assign.assignmentCode}: ${result.parentTask.title}`,
          relatedEntityType: 'ACADEMIC_TASK',
          relatedEntityId: assign.id,
          deepLinkRoute: `/hod/academic-tasks/${assign.id}`,
        });
      }
    }

    await AuditService.log({
      actorId: createdById,
      action: 'ACADEMIC_TASK_CREATED',
      entityType: 'ACADEMIC_TASK',
      entityId: result.parentTask.id,
      description: `Created academic task ${taskCode}: ${result.parentTask.title}`,
    });

    return result;
  }

  /**
   * 3. Publish draft task
   */
  static async publishTask(taskId: string, deanUserId: string) {
    const task = await (prisma as any).academicTask.findUnique({
      where: { id: taskId },
      include: { assignments: true },
    });

    if (!task) throw new NotFoundException('Academic task not found');
    if (task.status !== 'DRAFT') {
      throw new BadRequestException(`Task is already in ${task.status} state`);
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await (tx as any).academicTask.update({
        where: { id: taskId },
        data: { status: 'PUBLISHED', publishedAt: now },
      });

      await (tx as any).academicTaskAssignment.updateMany({
        where: { taskId },
        data: { status: 'ASSIGNED' },
      });

      await (tx as any).academicTaskTimeline.create({
        data: {
          taskId,
          eventType: 'TASK_PUBLISHED',
          actorUserId: deanUserId,
          actorRole: 'Academic Dean',
          previousStatus: 'DRAFT',
          newStatus: 'PUBLISHED',
          remarks: `Published task ${task.taskCode}`,
        },
      });
    });

    // Send notifications to HODs
    for (const assign of task.assignments) {
      await NotificationService.sendNotification({
        recipientId: assign.assignedHodUserId,
        eventType: 'ACADEMIC_TASK_ASSIGNED',
        title: 'New Academic Task Assigned',
        message: `Academic Task ${assign.assignmentCode}: ${task.title}`,
        relatedEntityType: 'ACADEMIC_TASK',
        relatedEntityId: assign.id,
        deepLinkRoute: `/hod/academic-tasks/${assign.id}`,
      });
    }

    return { status: 'success', message: `Task ${task.taskCode} published successfully` };
  }

  /**
   * 4. List tasks for Academic Dean with advanced filters & pagination
   */
  static async getTasksForDean(filters: {
    status?: string;
    category?: string;
    priority?: string;
    departmentId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.priority) where.priority = filters.priority;

    if (filters.search) {
      const s = filters.search.trim();
      where.OR = [
        { title: { contains: s } },
        { taskCode: { contains: s } },
        { description: { contains: s } },
      ];
    }

    if (filters.departmentId) {
      where.assignments = {
        some: { departmentId: filters.departmentId },
      };
    }

    const [tasks, total] = await Promise.all([
      (prisma as any).academicTask.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          assignments: {
            include: {
              department: { select: { id: true, name: true, code: true } },
              assignedHod: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
          _count: {
            select: { assignments: true, files: true, queries: true },
          },
        },
      }),
      (prisma as any).academicTask.count({ where }),
    ]);

    const now = new Date();
    const formatted = tasks.map((t: any) => {
      const isOverdue = t.dueAt && t.dueAt < now && !['COMPLETED', 'CANCELLED'].includes(t.status);
      const totalAssignments = t.assignments.length;
      const completedAssignments = t.assignments.filter((a: any) => a.status === 'COMPLETED').length;
      const submittedAssignments = t.assignments.filter((a: any) => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'COMPLETED'].includes(a.status)).length;
      const progressPercent = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

      return {
        ...t,
        isOverdue,
        computedStatus: isOverdue && t.status !== 'COMPLETED' ? 'OVERDUE' : t.status,
        totalAssignments,
        submittedAssignments,
        completedAssignments,
        progressPercent,
      };
    });

    return {
      data: formatted,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * 5. Get Task Details with all Department Assignments
   */
  static async getTaskDetail(taskId: string) {
    const task = await (prisma as any).academicTask.findUnique({
      where: { id: taskId },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        files: {
          where: { isActive: true },
          include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } },
        },
        assignments: {
          include: {
            department: { select: { id: true, name: true, code: true, hodName: true } },
            assignedHod: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            submissions: {
              orderBy: { submissionVersion: 'desc' },
              include: { submittedBy: { select: { firstName: true, lastName: true } } },
            },
            queries: {
              orderBy: { createdAt: 'desc' },
              include: { createdBy: { select: { firstName: true, lastName: true, role: true } } },
            },
          },
        },
        timeline: {
          orderBy: { createdAt: 'desc' },
          include: {
            actor: { select: { firstName: true, lastName: true } },
            department: { select: { name: true, code: true } },
          },
        },
      },
    });

    if (!task) throw new NotFoundException('Academic task not found');

    const now = new Date();
    const isOverdue = task.dueAt && task.dueAt < now && !['COMPLETED', 'CANCELLED'].includes(task.status);

    return {
      ...task,
      isOverdue,
      computedStatus: isOverdue && task.status !== 'COMPLETED' ? 'OVERDUE' : task.status,
    };
  }

  /**
   * 6. Academic Dean Review of Department Submission
   */
  static async reviewSubmission(assignmentId: string, dto: ReviewSubmissionDto, deanUserId: string) {
    const assignment = await (prisma as any).academicTaskAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        task: true,
        department: { select: { name: true, code: true } },
        submissions: { orderBy: { submissionVersion: 'desc' }, take: 1 },
      },
    });

    if (!assignment) throw new NotFoundException('Task assignment record not found');

    const latestSubmission = assignment.submissions[0];
    const previousStatus = assignment.status;
    let newStatus = assignment.status;

    switch (dto.action) {
      case 'APPROVE':
      case 'MARK_COMPLETED':
        newStatus = 'COMPLETED';
        break;
      case 'REQUEST_CORRECTION':
        newStatus = 'CORRECTION_REQUESTED';
        break;
      case 'RETURN_FOR_CLARIFICATION':
        newStatus = 'AWAITING_CLARIFICATION';
        break;
      case 'REJECT_WITH_REASON':
        newStatus = 'REJECTED';
        break;
      case 'REOPEN':
        newStatus = 'IN_PROGRESS';
        break;
    }

    await prisma.$transaction(async (tx) => {
      // Update assignment status
      await (tx as any).academicTaskAssignment.update({
        where: { id: assignmentId },
        data: {
          status: newStatus,
          completedAt: newStatus === 'COMPLETED' ? new Date() : undefined,
        },
      });

      // Update submission record if exists
      if (latestSubmission) {
        await (tx as any).academicTaskSubmission.update({
          where: { id: latestSubmission.id },
          data: {
            status: newStatus,
            reviewedById: deanUserId,
            reviewedAt: new Date(),
            reviewAction: dto.action,
            reviewRemarks: dto.remarks,
          },
        });
      }

      // Add timeline log
      await (tx as any).academicTaskTimeline.create({
        data: {
          taskId: assignment.taskId,
          assignmentId: assignment.id,
          eventType: `DEAN_REVIEW_${dto.action}`,
          actorUserId: deanUserId,
          actorRole: 'Academic Dean',
          departmentId: assignment.departmentId,
          previousStatus,
          newStatus,
          remarks: dto.remarks,
        },
      });

      // Synchronize parent task status if all assignments completed
      const allAssignments = await (tx as any).academicTaskAssignment.findMany({
        where: { taskId: assignment.taskId },
        select: { status: true },
      });

      const allCompleted = allAssignments.every((a: any) => a.status === 'COMPLETED');
      const anySubmitted = allAssignments.some((a: any) => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'COMPLETED'].includes(a.status));

      let parentStatus = assignment.task.status;
      if (allCompleted) {
        parentStatus = 'COMPLETED';
      } else if (anySubmitted) {
        parentStatus = 'PARTIALLY_COMPLETED';
      }

      if (parentStatus !== assignment.task.status) {
        await (tx as any).academicTask.update({
          where: { id: assignment.taskId },
          data: { status: parentStatus },
        });
      }
    });

    // Notify HOD
    const notifyEventType = dto.action === 'REQUEST_CORRECTION'
      ? 'ACADEMIC_TASK_CORRECTION_REQUESTED'
      : dto.action === 'APPROVE' || dto.action === 'MARK_COMPLETED'
      ? 'ACADEMIC_TASK_APPROVED'
      : 'ACADEMIC_TASK_UPDATED';

    await NotificationService.sendNotification({
      recipientId: assignment.assignedHodUserId,
      eventType: notifyEventType,
      title: `Task Review Update: ${dto.action.replace(/_/g, ' ')}`,
      message: `Academic Dean reviewed ${assignment.assignmentCode}: ${dto.remarks}`,
      relatedEntityType: 'ACADEMIC_TASK',
      relatedEntityId: assignment.id,
      deepLinkRoute: `/hod/academic-tasks/${assignment.id}`,
    });

    await AuditService.log({
      actorId: deanUserId,
      action: `ACADEMIC_TASK_${dto.action}`,
      entityType: 'ACADEMIC_TASK_ASSIGNMENT',
      entityId: assignmentId,
      description: `Reviewed task assignment ${assignment.assignmentCode}: ${dto.action}`,
    });

    return { status: 'success', newStatus };
  }

  /**
   * 7. Extend Due Date
   */
  static async extendDueDate(taskId: string, dto: ExtendDueDateDto, deanUserId: string) {
    if (!dto.newDueAt || !dto.reason) {
      throw new BadRequestException('New due date and extension reason are required');
    }

    const newDueAtDate = new Date(dto.newDueAt);

    await prisma.$transaction(async (tx) => {
      if (dto.scope === 'ALL') {
        await (tx as any).academicTask.update({
          where: { id: taskId },
          data: { dueAt: newDueAtDate },
        });

        await (tx as any).academicTaskAssignment.updateMany({
          where: { taskId },
          data: { currentDueAt: newDueAtDate },
        });
      } else if (dto.scope === 'SELECTED_DEPARTMENTS' && dto.targetDepartmentIds) {
        await (tx as any).academicTaskAssignment.updateMany({
          where: { taskId, departmentId: { in: dto.targetDepartmentIds } },
          data: { currentDueAt: newDueAtDate },
        });
      } else if (dto.scope === 'SELECTED_HOD' && dto.targetAssignmentIds) {
        await (tx as any).academicTaskAssignment.updateMany({
          where: { id: { in: dto.targetAssignmentIds } },
          data: { currentDueAt: newDueAtDate },
        });
      }

      await (tx as any).academicTaskTimeline.create({
        data: {
          taskId,
          eventType: 'DUE_DATE_EXTENDED',
          actorUserId: deanUserId,
          actorRole: 'Academic Dean',
          remarks: `Due date extended to ${dto.newDueAt}. Reason: ${dto.reason}`,
        },
      });
    });

    return { status: 'success', message: 'Due date extended successfully' };
  }

  /**
   * 8. Executive KPI Summary for Dashboard
   */
  static async getExecutiveDashboardStats() {
    const [
      totalDepartments,
      activeHods,
      totalStudents,
      totalFaculty,
      tasksCreated,
      tasksInProgress,
      tasksAwaitingReview,
      tasksOverdue,
      tasksCompleted,
      lowAttendanceCount,
      academicRiskCount,
      recentTimetables,
    ] = await Promise.all([
      prisma.department.count({ where: { status: 'ACTIVE', deleted: false } }),
      prisma.user.count({ where: { status: 'ACTIVE', role: { name: 'HOD' } } }),
      prisma.student.count({ where: { status: 'ACTIVE', deleted: false } }),
      prisma.faculty.count({ where: { status: 'ACTIVE', deleted: false } }),
      (prisma as any).academicTask.count(),
      (prisma as any).academicTaskAssignment.count({ where: { status: 'IN_PROGRESS' } }),
      (prisma as any).academicTaskAssignment.count({ where: { status: 'SUBMITTED' } }),
      (prisma as any).academicTaskAssignment.count({
        where: { currentDueAt: { lt: new Date() }, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      }),
      (prisma as any).academicTaskAssignment.count({ where: { status: 'COMPLETED' } }),
      prisma.attendance.groupBy({
        by: ['studentId'],
        where: { status: 'ABSENT' },
        _count: { status: true },
        having: { status: { _count: { gt: 5 } } },
      }).then((res) => res.length),
      prisma.mark.count({ where: { grade: 'F' } }),
      (prisma as any).timetablePublish ? (prisma as any).timetablePublish.count() : 0,
    ]);

    const totalAssigned = tasksInProgress + tasksAwaitingReview + tasksOverdue + tasksCompleted;
    const departmentSubmissionRate = totalAssigned > 0
      ? Math.round(((tasksCompleted + tasksAwaitingReview) / totalAssigned) * 100)
      : 100;

    const academicComplianceStatus = tasksOverdue === 0 ? 'OPTIMAL' : tasksOverdue < 5 ? 'ATTENTION_REQUIRED' : 'CRITICAL';

    return {
      totalDepartments,
      activeHods,
      totalStudents,
      totalFaculty,
      tasksCreated,
      tasksInProgress,
      tasksAwaitingReview,
      tasksOverdue,
      tasksCompleted,
      departmentSubmissionRate,
      academicComplianceStatus,
      lowAttendanceCount,
      academicRiskCount,
      pendingAcademicReports: tasksAwaitingReview,
      recentlyUpdatedTimetables: recentTimetables,
    };
  }
}
