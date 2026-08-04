import { prisma } from '../../lib/prisma';

/**
 * Handover Service
 * 
 * Generates a summary of all VP actions during a delegation period
 * so the Principal can see what happened when they return to ONLINE.
 */
export class HandoverService {

  /**
   * Generate a handover summary for a delegation that is ending.
   * Counts all VP actions (approved, rejected, returned) during the delegation.
   */
  static async generateHandover(
    delegationId: string,
    principalUserId: string,
    actingUserId: string
  ): Promise<any> {
    // Count VP actions during this delegation
    const allActions = await (prisma as any).delegationActionLog.findMany({
      where: {
        delegationId,
        module: { not: 'DELEGATION' }, // Exclude delegation lifecycle logs
        actionType: { notIn: ['TRANSFERRED_TO_VP', 'ROUTED_TO_VP', 'RETURNED_TO_PRINCIPAL'] }
      }
    });

    const approvedCount = allActions.filter((a: any) => 
      a.actionType === 'APPROVED' || a.actionType === 'APPROVE'
    ).length;

    const rejectedCount = allActions.filter((a: any) => 
      a.actionType === 'REJECTED' || a.actionType === 'REJECT'
    ).length;

    // Count requests that were transferred but still pending (will be returned)
    const transferLogs = await (prisma as any).delegationActionLog.findMany({
      where: {
        delegationId,
        actionType: { in: ['TRANSFERRED_TO_VP', 'ROUTED_TO_VP'] }
      }
    });

    const transferredIds = transferLogs.map((t: any) => t.recordId);
    let returnedCount = 0;

    if (transferredIds.length > 0) {
      const stillPending = await prisma.workflowRequest.count({
        where: {
          id: { in: transferredIds },
          status: 'PENDING',
          currentStep: 'PRINCIPAL'
        }
      });
      returnedCount = stillPending;
    }

    const totalRequests = approvedCount + rejectedCount + returnedCount;

    // Build detailed summary
    const summaryData = {
      delegation: {
        id: delegationId,
        principalUserId,
        actingUserId
      },
      actions: allActions.map((a: any) => ({
        recordId: a.recordId,
        actionType: a.actionType,
        module: a.module,
        remarks: a.remarks,
        performedAt: a.createdAt
      })),
      counts: {
        total: totalRequests,
        approved: approvedCount,
        rejected: rejectedCount,
        returned: returnedCount,
        pending: 0 // All pending become returned
      }
    };

    // Create handover record
    const handover = await (prisma as any).delegationHandover.create({
      data: {
        delegationId,
        principalUserId,
        actingUserId,
        totalRequests,
        approvedCount,
        rejectedCount,
        returnedCount,
        pendingCount: 0,
        summary: JSON.stringify(summaryData)
      }
    });

    return handover;
  }

  /**
   * Get the latest unacknowledged handover for a Principal.
   */
  static async getLatestHandover(principalUserId: string): Promise<any> {
    const handover = await (prisma as any).delegationHandover.findFirst({
      where: {
        principalUserId,
        acknowledgedAt: null
      },
      orderBy: { generatedAt: 'desc' }
    });

    return handover;
  }

  /**
   * Acknowledge a handover (Principal has reviewed it).
   */
  static async acknowledgeHandover(handoverId: string): Promise<any> {
    const updated = await (prisma as any).delegationHandover.update({
      where: { id: handoverId },
      data: {
        acknowledgedAt: new Date()
      }
    });

    return updated;
  }

  /**
   * Get handover history for a Principal.
   */
  static async getHandoverHistory(principalUserId: string, limit: number = 10): Promise<any[]> {
    const handovers = await (prisma as any).delegationHandover.findMany({
      where: { principalUserId },
      orderBy: { generatedAt: 'desc' },
      take: limit
    });

    return handovers;
  }
}
