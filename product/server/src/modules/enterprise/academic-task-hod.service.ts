import { prisma } from '../../lib/prisma';
import { NotFoundException, BadRequestException, ForbiddenException } from '../../utils/exceptions';
import { AuditService } from '../security/audit.service';
import { NotificationService } from '../notifications/notification.service';

export interface SubmitHodTaskDto {
  title?: string;
  notes?: string;
  checklistData?: Array<{ id: string; title: string; isCompleted: boolean }>;
  fileIds?: string[];
  isDraft?: boolean;
}

export class AcademicTaskHodService {
  /**
   * 1. Get tasks assigned to HOD (Department isolated)
   */
  static async getAssignedTasks(hodUserId: string, filters: {
    status?: string;
    priority?: string;
    dueSoon?: boolean;
    overdue?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      assignedHodUserId: hodUserId,
      status: { not: 'DRAFT' }, // HOD never sees Academic Dean draft tasks
    };

    if (filters.status) {
      where.status = filters.status;
    }

    const now = new Date();
    if (filters.overdue) {
      where.currentDueAt = { lt: now };
      where.status = { notIn: ['COMPLETED', 'CANCELLED'] };
    }

    if (filters.dueSoon) {
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      where.currentDueAt = { gte: now, lte: threeDaysLater };
      where.status = { notIn: ['COMPLETED', 'CANCELLED'] };
    }

    if (filters.search) {
      const s = filters.search.trim();
      where.OR = [
        { assignmentCode: { contains: s } },
        { task: { title: { contains: s } } },
        { task: { description: { contains: s } } },
      ];
    }

    const [assignments, total] = await Promise.all([
      (prisma as any).academicTaskAssignment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { currentDueAt: 'asc' },
        include: {
          task: {
            select: {
              id: true,
              taskCode: true,
              title: true,
              description: true,
              category: true,
              priority: true,
              confidentialityLevel: true,
              startAt: true,
              dueAt: true,
              submissionRequirements: true,
              createdBy: { select: { firstName: true, lastName: true } },
            },
          },
          department: { select: { id: true, name: true, code: true } },
          submissions: {
            orderBy: { submissionVersion: 'desc' },
            take: 1,
          },
          _count: {
            select: { queries: true, files: true },
          },
        },
      }),
      (prisma as any).academicTaskAssignment.count({ where }),
    ]);

    const formatted = assignments.map((a: any) => {
      const isOverdue = a.currentDueAt && a.currentDueAt < now && !['COMPLETED', 'CANCELLED'].includes(a.status);
      return {
        ...a,
        isOverdue,
        computedStatus: isOverdue && a.status !== 'COMPLETED' ? 'OVERDUE' : a.status,
      };
    });

    return {
      data: formatted,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * 2. Get Single Assignment Detail with strict department isolation check
   */
  static async getAssignmentDetail(assignmentId: string, hodUserId: string) {
    const assignment = await (prisma as any).academicTaskAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        task: {
          include: {
            createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
            files: {
              where: { fileScope: 'REFERENCE', isActive: true },
            },
          },
        },
        department: { select: { id: true, name: true, code: true } },
        files: {
          where: { isActive: true },
          include: { uploadedBy: { select: { firstName: true, lastName: true } } },
        },
        queries: {
          orderBy: { createdAt: 'asc' },
          include: { createdBy: { select: { id: true, firstName: true, lastName: true, role: true } } },
        },
        submissions: {
          orderBy: { submissionVersion: 'desc' },
          include: { submittedBy: { select: { firstName: true, lastName: true } } },
        },
        timeline: {
          orderBy: { createdAt: 'desc' },
          include: { actor: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Task assignment not found');
    }

    // Strict Department Isolation Enforcement
    if (assignment.assignedHodUserId !== hodUserId) {
      // Check if user is an authorized department member
      const user = await prisma.user.findUnique({
        where: { id: hodUserId },
        select: { role: { select: { name: true } }, departmentId: true },
      });

      if (user?.role.name !== 'Super Admin' && user?.role.name !== 'Academic Dean' && user?.departmentId !== assignment.departmentId) {
        throw new ForbiddenException('Access denied: You cannot view task assignments belonging to another department');
      }
    }

    // Auto mark as VIEWED if status is ASSIGNED
    if (assignment.status === 'ASSIGNED') {
      await (prisma as any).academicTaskAssignment.update({
        where: { id: assignmentId },
        data: { status: 'VIEWED', viewedAt: new Date() },
      });

      await (prisma as any).academicTaskTimeline.create({
        data: {
          taskId: assignment.taskId,
          assignmentId,
          eventType: 'TASK_VIEWED',
          actorUserId: hodUserId,
          actorRole: 'HOD',
          departmentId: assignment.departmentId,
          previousStatus: 'ASSIGNED',
          newStatus: 'VIEWED',
          remarks: 'HOD viewed task assignment',
        },
      });

      assignment.status = 'VIEWED';
    }

    const now = new Date();
    const isOverdue = assignment.currentDueAt && assignment.currentDueAt < now && !['COMPLETED', 'CANCELLED'].includes(assignment.status);

    return {
      ...assignment,
      isOverdue,
      computedStatus: isOverdue && assignment.status !== 'COMPLETED' ? 'OVERDUE' : assignment.status,
    };
  }

  /**
   * 3. HOD starts working on assigned task
   */
  static async startTask(assignmentId: string, hodUserId: string) {
    const assignment = await (prisma as any).academicTaskAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.assignedHodUserId !== hodUserId) {
      throw new ForbiddenException('You are not authorized to start this department assignment');
    }

    const previousStatus = assignment.status;
    const updated = await (prisma as any).academicTaskAssignment.update({
      where: { id: assignmentId },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });

    await (prisma as any).academicTaskTimeline.create({
      data: {
        taskId: assignment.taskId,
        assignmentId,
        eventType: 'TASK_STARTED',
        actorUserId: hodUserId,
        actorRole: 'HOD',
        departmentId: assignment.departmentId,
        previousStatus,
        newStatus: 'IN_PROGRESS',
        remarks: 'HOD marked task in-progress',
      },
    });

    return updated;
  }

  /**
   * 4. Save Draft Submission
   */
  static async saveDraft(assignmentId: string, dto: SubmitHodTaskDto, hodUserId: string) {
    const assignment = await (prisma as any).academicTaskAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.assignedHodUserId !== hodUserId) {
      throw new ForbiddenException('Unauthorized submission attempt');
    }

    const latestSubmission = await (prisma as any).academicTaskSubmission.findFirst({
      where: { assignmentId, status: 'DRAFT' },
      orderBy: { submissionVersion: 'desc' },
    });

    if (latestSubmission) {
      await (prisma as any).academicTaskSubmission.update({
        where: { id: latestSubmission.id },
        data: {
          title: dto.title || assignment.assignmentCode,
          notes: dto.notes || null,
          checklistData: dto.checklistData ? JSON.stringify(dto.checklistData) : null,
        },
      });
    } else {
      await (prisma as any).academicTaskSubmission.create({
        data: {
          assignmentId,
          submissionVersion: 1,
          title: dto.title || assignment.assignmentCode,
          notes: dto.notes || null,
          checklistData: dto.checklistData ? JSON.stringify(dto.checklistData) : null,
          status: 'DRAFT',
          submittedById: hodUserId,
        },
      });
    }

    await (prisma as any).academicTaskAssignment.update({
      where: { id: assignmentId },
      data: { status: 'DRAFT_SUBMISSION' },
    });

    return { status: 'success', message: 'Draft submission saved' };
  }

  /**
   * 5. Final HOD Submission (with requirement validation)
   */
  static async submitTask(assignmentId: string, dto: SubmitHodTaskDto, hodUserId: string) {
    const assignment = await (prisma as any).academicTaskAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        task: true,
        submissions: { orderBy: { submissionVersion: 'desc' }, take: 1 },
      },
    });

    if (!assignment) throw new NotFoundException('Task assignment not found');
    if (assignment.assignedHodUserId !== hodUserId) {
      throw new ForbiddenException('Unauthorized submission attempt');
    }

    if (['COMPLETED', 'APPROVED'].includes(assignment.status)) {
      throw new BadRequestException('Task is already completed and locked');
    }

    // Parse task submission requirements
    let requirements: any = {};
    if (assignment.task.submissionRequirements) {
      try {
        requirements = JSON.parse(assignment.task.submissionRequirements);
      } catch (_) {}
    }

    // Validate submission requirements
    if (requirements.textResponseRequired && (!dto.notes || !dto.notes.trim())) {
      throw new BadRequestException('Text response / submission notes are required by the Academic Dean');
    }

    // Calculate version number
    const previousVersion = assignment.submissions[0]?.submissionVersion || 0;
    const newVersion = previousVersion + 1;

    const previousStatus = assignment.status;
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // Create new locked submission record
      const submission = await (tx as any).academicTaskSubmission.create({
        data: {
          assignmentId,
          submissionVersion: newVersion,
          title: dto.title || `Submission v${newVersion} - ${assignment.assignmentCode}`,
          notes: dto.notes || null,
          checklistData: dto.checklistData ? JSON.stringify(dto.checklistData) : null,
          status: 'SUBMITTED',
          submittedById: hodUserId,
          submittedAt: now,
        },
      });

      // Update assignment state
      await (tx as any).academicTaskAssignment.update({
        where: { id: assignmentId },
        data: {
          status: 'SUBMITTED',
          submittedAt: now,
        },
      });

      // Update parent task status if still IN_PROGRESS/ASSIGNED
      const parentTask = await (tx as any).academicTask.findUnique({ where: { id: assignment.taskId } });
      if (['PUBLISHED', 'IN_PROGRESS'].includes(parentTask.status)) {
        await (tx as any).academicTask.update({
          where: { id: assignment.taskId },
          data: { status: 'PARTIALLY_SUBMITTED' },
        });
      }

      // Add immutable timeline log
      await (tx as any).academicTaskTimeline.create({
        data: {
          taskId: assignment.taskId,
          assignmentId,
          eventType: 'TASK_SUBMITTED',
          actorUserId: hodUserId,
          actorRole: 'HOD',
          departmentId: assignment.departmentId,
          previousStatus,
          newStatus: 'SUBMITTED',
          remarks: `HOD submitted task version v${newVersion}`,
        },
      });

      return submission;
    });

    // Notify Academic Dean
    await NotificationService.sendNotification({
      recipientId: assignment.task.createdById,
      eventType: 'ACADEMIC_TASK_SUBMITTED',
      title: 'Academic Task Submitted by HOD',
      message: `HOD submitted work for ${assignment.assignmentCode}`,
      relatedEntityType: 'ACADEMIC_TASK_ASSIGNMENT',
      relatedEntityId: assignmentId,
      deepLinkRoute: `/academic-dean/tasks/${assignment.taskId}`,
    });

    await AuditService.log({
      actorId: hodUserId,
      action: 'ACADEMIC_TASK_SUBMITTED',
      entityType: 'ACADEMIC_TASK_ASSIGNMENT',
      entityId: assignmentId,
      description: `Submitted task assignment ${assignment.assignmentCode} (v${newVersion})`,
    });

    return result;
  }
}
