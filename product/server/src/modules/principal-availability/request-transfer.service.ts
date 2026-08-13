import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { categoryForRequestType } from './delegation.guard';

export class RequestTransferService {
  /**
   * Transfer all eligible unresolved Principal requests to VP on delegation activation.
   * Only requests whose category was actually delegated move — the rest stay with the
   * Principal so the delegate never gains authority over an undelegated category.
   */
  static async transferPendingRequestsToVp(params: {
    principalUserId: string;
    vpUserId: string;
    delegationId: string;
    categories: string[];
    permissions?: string[];
    scope?: { tenantId?: string; requestTypes?: string[]; departmentIds?: string[]; workflowStages?: string[] };
    financialThreshold?: number | null;
  }) {
    let transferredCount = 0;

    // 1. Reassign existing pending assignments for Principal (category-eligible only)
    const existingPrincipalAssignments = await (prisma as any).approvalAssignment.findMany({
      where: {
        assignedUserId: params.principalUserId,
        status: 'PENDING',
      },
    });

    for (const assignment of existingPrincipalAssignments) {
      if (!this.isEligible(assignment, params)) {
        continue;
      }
      await (prisma as any).approvalAssignment.update({
        where: { id: assignment.id },
        data: {
          assignedUserId: params.vpUserId,
          originalAssigneeId: assignment.originalAssigneeId || params.principalUserId,
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
          where: { requestId: reqItem.id, status: 'PENDING' },
        });

        const isOd = (reqItem.type || '').toUpperCase().includes('OD');
        const isFaculty = Boolean(reqItem.facultyRequester);
        const reqRole = isFaculty ? (reqItem.facultyRequester?.user?.role?.name || 'Executive') : 'Student';
        const reqType = isFaculty ? (isOd ? 'FACULTY_OD' : 'FACULTY_LEAVE') : (isOd ? 'STUDENT_OD' : 'STUDENT_LEAVE');
        const applicantName = isFaculty
          ? `${reqItem.facultyRequester?.firstName || ''} ${reqItem.facultyRequester?.lastName || ''}`.trim()
          : `${reqItem.student?.firstName || ''} ${reqItem.student?.lastName || ''}`.trim();

        const candidate = {
          requestType: reqType,
          workflowStage: reqItem.currentStep,
          departmentId: reqItem.facultyRequester?.departmentId || reqItem.student?.departmentId || null,
          financialAmount: null,
        };
        if (!this.isEligible(candidate, params)) {
          continue;
        }

        if (existing) {
          await (prisma as any).approvalAssignment.update({
            where: { id: existing.id },
            data: {
              assignedUserId: params.vpUserId,
              originalAssigneeId: existing.originalAssigneeId || params.principalUserId,
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
              originalAssigneeId: params.principalUserId,
              assignedRole: 'ACTING_PRINCIPAL',
              assignmentType: 'DELEGATED',
              delegationId: params.delegationId,
              departmentId: candidate.departmentId,
              workflowStage: reqItem.currentStep,
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
    if (!params.categories.includes('CIRCULAR_APPROVAL')) {
      logger.info(`Transferred ${transferredCount} pending requests to Vice Principal (${params.vpUserId})`);
      return transferredCount;
    }
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
              originalAssigneeId: params.principalUserId,
              assignedRole: 'ACTING_PRINCIPAL',
              assignmentType: 'DELEGATED',
              delegationId: params.delegationId,
              workflowStage: 'PRINCIPAL',
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
        delegationId: params.delegationId,
        status: 'PENDING',
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

  private static isEligible(
    assignment: { requestType: string; departmentId?: string | null; workflowStage?: string | null; financialAmount?: number | null },
    params: {
      categories: string[];
      permissions?: string[];
      scope?: { tenantId?: string; requestTypes?: string[]; departmentIds?: string[]; workflowStages?: string[] };
      financialThreshold?: number | null;
    }
  ): boolean {
    if (!params.categories.includes(categoryForRequestType(assignment.requestType))) return false;
    const type = assignment.requestType.toUpperCase();
    const permission = type.includes('OD') ? 'od.approve'
      : type.includes('LEAVE') ? 'leave.approve'
      : type.includes('CIRCULAR') ? 'circular.publish'
      : type.includes('FINANCE') || type.includes('FEE') ? 'finance.approve'
      : null;
    if (!permission || !params.permissions?.includes(permission)) return false;
    if (params.scope?.requestTypes?.length && !params.scope.requestTypes.includes(assignment.requestType)) return false;
    if (params.scope?.departmentIds?.length && (!assignment.departmentId || !params.scope.departmentIds.includes(assignment.departmentId))) return false;
    if (params.scope?.workflowStages?.length && (!assignment.workflowStage || !params.scope.workflowStages.includes(assignment.workflowStage))) return false;
    if (permission === 'finance.approve' && assignment.financialAmount != null &&
      (params.financialThreshold == null || assignment.financialAmount > params.financialThreshold)) return false;
    return true;
  }
}
