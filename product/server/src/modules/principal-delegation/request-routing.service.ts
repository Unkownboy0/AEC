import { prisma } from '../../lib/prisma';

/**
 * Request Routing Service
 * 
 * Handles the transfer and return of workflow requests between Principal and VP
 * based on delegation state.
 * 
 * Transfer: Principal → VP (when Principal goes BUSY/OFFLINE)
 * Return:   VP → Principal (when Principal returns ONLINE)
 */
export class RequestRoutingService {

  /**
   * Route a new request to the correct approver based on current Principal availability.
   * Called by workflow service when a new request reaches the PRINCIPAL step.
   */
  static async routeNewRequest(requestId: string): Promise<{ routedTo: 'PRINCIPAL' | 'VP'; reason: string }> {
    try {
      const offlineSetting = await prisma.systemSetting.findUnique({
        where: { key: 'PRINCIPAL_OFFLINE_MODE' }
      });
      const isPrincipalOffline = offlineSetting?.value === 'true';

      if (isPrincipalOffline) {
        // Find the active delegation
        const activeDelegation = await (prisma as any).principalDelegation.findFirst({
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' }
        });

        if (activeDelegation) {
          // Log the routing decision
          await (prisma as any).delegationActionLog.create({
            data: {
              delegationId: activeDelegation.id,
              module: 'ROUTING',
              recordId: requestId,
              actionType: 'ROUTED_TO_VP',
              performedByUserId: 'SYSTEM',
              performedByRole: 'SYSTEM',
              performedAsRole: 'ROUTING_ENGINE',
              delegatedByUserId: activeDelegation.principalUserId,
              previousStatus: 'PRINCIPAL',
              newStatus: 'VP_ACTING',
              remarks: `Request auto-routed to VP (Acting Principal) because Principal is ${activeDelegation.principalStatus}`,
              platform: 'SYSTEM'
            }
          });

          return { routedTo: 'VP', reason: `Principal is ${activeDelegation.principalStatus}, routed to VP as Acting Principal` };
        }
      }

      return { routedTo: 'PRINCIPAL', reason: 'Principal is ONLINE, routed directly' };
    } catch (err) {
      console.error('Request routing error:', err);
      return { routedTo: 'PRINCIPAL', reason: 'Routing error, defaulting to Principal' };
    }
  }

  /**
   * Transfer ALL pending PRINCIPAL-step requests to VP when delegation is activated.
   * This ensures VP sees all pending work in their Acting Principal approval center.
   */
  static async transferPendingRequests(delegationId: string, vpUserId: string): Promise<number> {
    try {
      // Find all pending requests at PRINCIPAL step
      const pendingRequests = await prisma.workflowRequest.findMany({
        where: {
          currentStep: 'PRINCIPAL',
          status: 'PENDING'
        }
      });

      let transferCount = 0;

      for (const req of pendingRequests) {
        // Log each transfer
        await (prisma as any).delegationActionLog.create({
          data: {
            delegationId,
            module: 'ROUTING',
            recordId: req.id,
            actionType: 'TRANSFERRED_TO_VP',
            performedByUserId: 'SYSTEM',
            performedByRole: 'SYSTEM',
            performedAsRole: 'ROUTING_ENGINE',
            previousStatus: 'PRINCIPAL',
            newStatus: 'VP_ACTING',
            remarks: `Request transferred to VP queue on delegation activation`,
            platform: 'SYSTEM'
          }
        });
        transferCount++;
      }

      console.log(`[RequestRouting] Transferred ${transferCount} pending requests to VP queue for delegation ${delegationId}`);
      return transferCount;
    } catch (err) {
      console.error('[RequestRouting] Transfer failed:', err);
      return 0;
    }
  }

  /**
   * Return all unresolved (still-pending) requests from VP back to Principal queue
   * when delegation ends. Completed VP actions are NOT modified.
   */
  static async returnPendingRequests(delegationId: string, principalUserId: string): Promise<number> {
    try {
      // Find all VP actions during this delegation that are still pending
      const vpActions = await (prisma as any).delegationActionLog.findMany({
        where: {
          delegationId,
          actionType: { in: ['TRANSFERRED_TO_VP', 'ROUTED_TO_VP'] }
        }
      });

      const transferredRequestIds = vpActions.map((a: any) => a.recordId);
      
      if (transferredRequestIds.length === 0) return 0;

      // Find which of these requests are STILL PENDING (not yet actioned by VP)
      const stillPending = await prisma.workflowRequest.findMany({
        where: {
          id: { in: transferredRequestIds },
          status: 'PENDING',
          currentStep: 'PRINCIPAL'
        }
      });

      let returnCount = 0;

      for (const req of stillPending) {
        // Log the return
        await (prisma as any).delegationActionLog.create({
          data: {
            delegationId,
            module: 'ROUTING',
            recordId: req.id,
            actionType: 'RETURNED_TO_PRINCIPAL',
            performedByUserId: 'SYSTEM',
            performedByRole: 'SYSTEM',
            performedAsRole: 'ROUTING_ENGINE',
            previousStatus: 'VP_ACTING',
            newStatus: 'PRINCIPAL',
            remarks: `Request returned to Principal queue on delegation end`,
            platform: 'SYSTEM'
          }
        });
        returnCount++;
      }

      console.log(`[RequestRouting] Returned ${returnCount} pending requests to Principal queue after delegation ${delegationId} ended`);
      return returnCount;
    } catch (err) {
      console.error('[RequestRouting] Return failed:', err);
      return 0;
    }
  }
}
