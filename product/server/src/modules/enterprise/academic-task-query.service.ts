import { prisma } from '../../lib/prisma';
import { NotFoundException, BadRequestException, ForbiddenException } from '../../utils/exceptions';
import { NotificationService } from '../notifications/notification.service';
import { AuditService } from '../security/audit.service';

export interface PostQueryDto {
  taskId: string;
  assignmentId?: string;
  parentQueryId?: string;
  message: string;
  visibility?: 'ASSIGNMENT_PRIVATE' | 'COMMON_TO_ALL_RECIPIENTS' | 'INTERNAL_DEAN_NOTE';
}

export class AcademicTaskQueryService {
  /**
   * 1. Post Query or Discussion Message
   */
  static async postQuery(authorId: string, dto: PostQueryDto) {
    if (!dto.message || !dto.message.trim()) {
      throw new BadRequestException('Query message content cannot be empty');
    }

    const task = await (prisma as any).academicTask.findUnique({ where: { id: dto.taskId } });
    if (!task) throw new NotFoundException('Academic task not found');

    const author = await prisma.user.findUnique({
      where: { id: authorId },
      select: { id: true, firstName: true, lastName: true, departmentId: true, role: { select: { name: true } } },
    });

    if (!author) throw new ForbiddenException('User record not found');

    const isDean = ['Academic Dean', 'Super Admin', 'College Admin', 'Principal'].includes(author.role.name);

    if (!isDean && dto.assignmentId) {
      const assignment = await (prisma as any).academicTaskAssignment.findUnique({ where: { id: dto.assignmentId } });
      if (assignment && assignment.assignedHodUserId !== authorId && author.departmentId !== assignment.departmentId) {
        throw new ForbiddenException('Access denied: Cannot post queries inside another department assignment');
      }
    }

    const query = await (prisma as any).academicTaskQuery.create({
      data: {
        taskId: dto.taskId,
        assignmentId: dto.assignmentId || null,
        parentQueryId: dto.parentQueryId || null,
        message: dto.message.trim(),
        status: isDean ? 'AWAITING_HOD_RESPONSE' : 'AWAITING_DEAN_RESPONSE',
        visibility: dto.visibility || 'ASSIGNMENT_PRIVATE',
        createdById: authorId,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    // Update assignment query status
    if (dto.assignmentId) {
      await (prisma as any).academicTaskAssignment.update({
        where: { id: dto.assignmentId },
        data: { status: 'QUERY_RAISED' },
      });
    }

    // Record timeline log
    await (prisma as any).academicTaskTimeline.create({
      data: {
        taskId: dto.taskId,
        assignmentId: dto.assignmentId || null,
        eventType: isDean ? 'QUERY_ANSWERED' : 'QUERY_RAISED',
        actorUserId: authorId,
        actorRole: author.role.name,
        remarks: `${author.firstName} ${author.lastName}: ${dto.message.substring(0, 80)}`,
      },
    });

    // Send notifications
    if (isDean && dto.assignmentId) {
      const assign = await (prisma as any).academicTaskAssignment.findUnique({ where: { id: dto.assignmentId } });
      if (assign) {
        await NotificationService.sendNotification({
          recipientId: assign.assignedHodUserId,
          eventType: 'ACADEMIC_TASK_QUERY_ANSWERED',
          title: 'Academic Dean Replied to Task Query',
          message: `Query response on ${task.taskCode}: ${dto.message.substring(0, 100)}`,
          relatedEntityType: 'ACADEMIC_TASK_QUERY',
          relatedEntityId: query.id,
          deepLinkRoute: `/hod/academic-tasks/${assign.id}`,
        });
      }
    } else if (!isDean) {
      await NotificationService.sendNotification({
        recipientId: task.createdById,
        eventType: 'ACADEMIC_TASK_QUERY_POSTED',
        title: 'New HOD Task Query Raised',
        message: `Query raised on ${task.taskCode}: ${dto.message.substring(0, 100)}`,
        relatedEntityType: 'ACADEMIC_TASK_QUERY',
        relatedEntityId: query.id,
        deepLinkRoute: `/academic-dean/tasks/${task.id}`,
      });
    }

    return query;
  }

  /**
   * 2. Resolve Query Thread
   */
  static async resolveQuery(queryId: string, userId: string) {
    const query = await (prisma as any).academicTaskQuery.findUnique({ where: { id: queryId } });
    if (!query) throw new NotFoundException('Query record not found');

    const updated = await (prisma as any).academicTaskQuery.update({
      where: { id: queryId },
      data: {
        status: 'RESOLVED',
        resolvedById: userId,
        resolvedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * 3. Get Queries for an Assignment (Department Isolated)
   */
  static async getQueries(assignmentId: string, userId: string) {
    const assignment = await (prisma as any).academicTaskAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) throw new NotFoundException('Assignment not found');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { departmentId: true, role: { select: { name: true } } },
    });

    const isDean = ['Academic Dean', 'Super Admin', 'College Admin', 'Principal'].includes(user?.role.name || '');

    if (!isDean && assignment.assignedHodUserId !== userId && user?.departmentId !== assignment.departmentId) {
      throw new ForbiddenException('Access denied: Cannot view queries of another department');
    }

    const queries = await (prisma as any).academicTaskQuery.findMany({
      where: {
        assignmentId,
        parentQueryId: null, // top-level queries
      },
      orderBy: { createdAt: 'asc' },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, role: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: { createdBy: { select: { id: true, firstName: true, lastName: true, role: true } } },
        },
      },
    });

    return queries;
  }

  /**
   * 4. Get Common Clarifications (Visible to all task recipients)
   */
  static async getCommonClarifications(taskId: string) {
    const clarifications = await (prisma as any).academicTaskQuery.findMany({
      where: {
        taskId,
        visibility: 'COMMON_TO_ALL_RECIPIENTS',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    return clarifications;
  }
}
