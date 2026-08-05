import { DelegationService } from '../delegation/delegation.service';
import { logger } from '../../utils/logger';

export interface FinalApproverResolution {
  approverRole: 'PRINCIPAL' | 'ACTING_PRINCIPAL';
  publishedAsLabel: string;
  nextStep: 'PRINCIPAL';
  nextStatus: 'HOD_APPROVED' | 'PENDING_PRINCIPAL';
  isActingPrincipal: boolean;
  activeDelegationId?: string | null;
  actingVpUserId?: string | null;
  principalUserId?: string | null;
}

export class FacultyLeaveWorkflowEngine {
  /**
   * Resolves the current final approval authority when HOD recommends a Faculty Leave/OD request.
   * If Principal is Online -> Principal
   * If Principal is Busy/Offline with active delegation -> Vice Principal (Acting Principal)
   */
  static async resolveFinalApprover(hodUserId: string): Promise<FinalApproverResolution> {
    try {
      // Check Principal offline / active VP delegation status using DelegationService
      const vpStatus = await DelegationService.getVpActingStatus(hodUserId).catch(() => null);

      if (vpStatus?.isActingPrincipal && vpStatus?.activeDelegation) {
        logger.info(`[FacultyLeaveWorkflow] Principal is offline. Routing to Acting Principal (VP: ${vpStatus.activeDelegation.delegateUserId})`);
        return {
          approverRole: 'ACTING_PRINCIPAL',
          publishedAsLabel: 'Vice Principal — Acting Principal',
          nextStep: 'PRINCIPAL',
          nextStatus: 'HOD_APPROVED',
          isActingPrincipal: true,
          activeDelegationId: vpStatus.activeDelegation.id,
          actingVpUserId: vpStatus.activeDelegation.delegateUserId,
          principalUserId: vpStatus.activeDelegation.delegatorUserId,
        };
      }
    } catch (err) {
      logger.warn('[FacultyLeaveWorkflow] Error checking delegation status:', err);
    }

    // Default: Principal is online
    return {
      approverRole: 'PRINCIPAL',
      publishedAsLabel: 'Principal',
      nextStep: 'PRINCIPAL',
      nextStatus: 'HOD_APPROVED',
      isActingPrincipal: false,
      activeDelegationId: null,
    };
  }
}
