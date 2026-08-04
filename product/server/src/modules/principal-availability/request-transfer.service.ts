import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

export class RequestTransferService {
  /**
   * Transfer all eligible unresolved Principal requests to VP on delegation activation
   */
  static async transferPendingRequestsToVp(params: {
    principalUserId: string;
    vpUserId: string;
    delegationId: string;
    categories: string[];
  }) {
    let transferredCount = 0;

    // 1. Reassign existing pending assignments for Principal
    const existingPrincipalAssignments = await (prisma as any).approvalAssignment.findMany({
      where: {
        assignedUserId: params.principalUserId,
        status: 'PENDING',
      },
    });

    for (const assignment of existingPrincipalAssignments) {
      await (prisma as any).approvalAssignment.update({
        where: { id: assignment.id },
        data: {
          assignedUserId: params.vpUserId,
          assignedRole: 'ACTING_PRINCIPAL',
          assignmentType: 'DELEGATED',
          delegationId: params.delegationId,
        },
      });
      transferredCount++;
    }

    // 2. Fetch pending workflow requests (HOD Leave/OD, Dean Leave/OD, Faculty Leave/OD) at PRINCIPAL step
    try {
      const pendingWorkflows = await prisma.workflowRequest.findMany({
        where: {
          currentStep: 'PRINCIPAL',
          status: 'PENDING',
        },
        include: {
          facultyRequester: { include: { user: { include: { role: true } } } },
          student: true,
        },
      });

      for (const reqItem of pendingWorkflows) {
        const existing = await (prisma as any).approvalAssignment.findFirst({
          where: { requestId: reqItem.id },
        });

        const isOd = (reqItem.type || '').toUpperCase().includes('OD');
        const isFaculty = Boolean(reqItem.facultyRequester);
        const reqRole = isFaculty ? (reqItem.facultyRequester?.user?.role?.name || 'Executive') : 'Student';
        const reqType = isFaculty ? (isOd ? 'FACULTY_OD' : 'FACULTY_LEAVE') : (isOd ? 'STUDENT_OD' : 'STUDENT_LEAVE');
        const applicantName = isFaculty
          ? `${reqItem.facultyRequester?.firstName || ''} ${reqItem.facultyRequester?.lastName || ''}`.trim()
          : `${reqItem.student?.firstName || ''} ${reqItem.student?.lastName || ''}`.trim();

        if (existing) {
          await (prisma as any).approvalAssignment.update({
            where: { id: existing.id },
            data: {
              assignedUserId: params.vpUserId,
              assignedRole: 'ACTING_PRINCIPAL',
              assignmentType: 'DELEGATED',
              delegationId: params.delegationId,
            },
          });
        } else {
          await (prisma as any).approvalAssignment.create({
            data: {
              requestId: reqItem.id,
              requestType: reqType,
              title: `[${reqRole}] ${reqItem.type}: ${reqItem.title}`,
              applicantName: applicantName || 'Executive Applicant',
              departmentName: 'Academic Department',
              assignedUserId: params.vpUserId,
              assignedRole: 'ACTING_PRINCIPAL',
              assignmentType: 'DELEGATED',
              delegationId: params.delegationId,
              status: 'PENDING',
            },
          });
        }
        transferredCount++;
      }
    } catch (err) {
      logger.warn('Error fetching workflow requests during transfer:', err);
    }

    // 3. Fetch pending circulars requiring Principal signoff
    try {
      const pendingCirculars = await (prisma as any).circular?.findMany({
        where: {
          status: { in: ['DRAFT', 'PENDING_APPROVAL'] },
        },
      }) || [];

      for (const circ of pendingCirculars) {
        const existing = await (prisma as any).approvalAssignment.findFirst({
          where: { requestId: circ.id, requestType: 'CIRCULAR_APPROVAL' },
        });

        if (!existing) {
          await (prisma as any).approvalAssignment.create({
            data: {
              requestId: circ.id,
              requestType: 'CIRCULAR_APPROVAL',
              title: circ.title || 'Circular Signoff',
              assignedUserId: params.vpUserId,
              assignedRole: 'ACTING_PRINCIPAL',
              assignmentType: 'DELEGATED',
              delegationId: params.delegationId,
              status: 'PENDING',
            },
          });
          transferredCount++;
        }
      }
    } catch (err) {
      logger.warn('Error fetching circulars during transfer:', err);
    }

    logger.info(`Transferred ${transferredCount} pending requests to Vice Principal (${params.vpUserId})`);
    return transferredCount;
  }

  /**
   * Return unresolved delegated requests back to Principal when Principal becomes AVAILABLE
   */
  static async returnPendingRequestsToPrincipal(params: {
    principalUserId: string;
    delegationId: string;
  }) {
    // Find all pending assignments for this delegation or assigned to VP as ACTING_PRINCIPAL
    const pendingAssignments = await (prisma as any).approvalAssignment.findMany({
      where: {
        OR: [
          { delegationId: params.delegationId, status: 'PENDING' },
          { assignedRole: 'ACTING_PRINCIPAL', status: 'PENDING' },
        ],
      },
    });

    const now = new Date();

    for (const assignment of pendingAssignments) {
      await (prisma as any).approvalAssignment.update({
        where: { id: assignment.id },
        data: {
          assignedUserId: params.principalUserId,
          assignedRole: 'PRINCIPAL',
          assignmentType: 'RETURNED_TO_PRINCIPAL',
          returnedAt: now,
        },
      });
    }

    logger.info(`Returned ${pendingAssignments.length} unresolved requests back to Principal (${params.principalUserId})`);
    return pendingAssignments.length;
  }
}
