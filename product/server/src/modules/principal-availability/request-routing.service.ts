import { prisma } from '../../lib/prisma';
import { PrincipalAvailabilityResolver } from './availability.resolver';
import { logger } from '../../utils/logger';

export interface RouteRequestResult {
  assignedUserId: string;
  assignedRole: 'PRINCIPAL' | 'ACTING_PRINCIPAL';
  assignmentType: 'DIRECT' | 'DELEGATED';
  delegationId?: string | null;
  principalStatus: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
}

export class PrincipalRequestRoutingService {
  /**
   * Determine approver for any incoming Principal-level request dynamically
   */
  static async resolveApproverForRequest(targetPrincipalUserId?: string): Promise<RouteRequestResult> {
    const context = await PrincipalAvailabilityResolver.resolveContext(targetPrincipalUserId);

    if (context.principalStatus === 'AVAILABLE' || !context.canVpActAsPrincipal || !context.actingPrincipal) {
      // Route to Principal
      let principalUserId = targetPrincipalUserId;
      if (!principalUserId) {
        const principalUser = await prisma.user.findFirst({
          where: {
            OR: [
              { role: { name: { in: ['Principal', 'PRINCIPAL'] } } },
              { email: { contains: 'principal' } },
              { username: { contains: 'principal' } },
            ],
          },
        });
        principalUserId = principalUser ? principalUser.id : 'SYSTEM_PRINCIPAL';
      }

      return {
        assignedUserId: principalUserId,
        assignedRole: 'PRINCIPAL',
        assignmentType: 'DIRECT',
        delegationId: null,
        principalStatus: 'AVAILABLE',
      };
    }

    // Route to Vice Principal as ACTING_PRINCIPAL
    return {
      assignedUserId: context.actingPrincipal.userId,
      assignedRole: 'ACTING_PRINCIPAL',
      assignmentType: 'DELEGATED',
      delegationId: context.delegation?.id || null,
      principalStatus: context.principalStatus,
    };
  }

  /**
   * Register a new request in the approval routing system
   */
  static async createApprovalAssignment(dto: {
    requestId: string;
    requestType: string;
    title: string;
    applicantName?: string;
    departmentName?: string;
    targetPrincipalUserId?: string;
  }) {
    const routing = await this.resolveApproverForRequest(dto.targetPrincipalUserId);

    const assignment = await (prisma as any).approvalAssignment.create({
      data: {
        requestId: dto.requestId,
        requestType: dto.requestType,
        title: dto.title,
        applicantName: dto.applicantName || 'Applicant',
        departmentName: dto.departmentName || 'General',
        assignedUserId: routing.assignedUserId,
        assignedRole: routing.assignedRole,
        assignmentType: routing.assignmentType,
        delegationId: routing.delegationId || null,
        status: 'PENDING',
      },
    });

    logger.info(`Created ApprovalAssignment (${assignment.id}) routed to ${routing.assignedRole} (${routing.assignedUserId})`);
    return { assignment, routing };
  }
}
