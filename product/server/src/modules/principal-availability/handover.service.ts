import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

export class HandoverService {
  /**
   * Create a delegation handover summary record when principal returns AVAILABLE
   */
  static async generateHandover(params: {
    delegationId: string;
    principalUserId: string;
    actingUserId: string;
  }) {
    // Fetch all logs and assignments associated with this delegation
    const [actionLogs, assignments] = await Promise.all([
      (prisma as any).delegationActionLog.findMany({
        where: { delegationId: params.delegationId },
        orderBy: { createdAt: 'desc' },
      }),
      (prisma as any).approvalAssignment.findMany({
        where: { delegationId: params.delegationId },
      }),
    ]);

    const approvedCount = actionLogs.filter((l: any) => l.actionType === 'APPROVED').length;
    const rejectedCount = actionLogs.filter((l: any) => l.actionType === 'REJECTED').length;
    const returnedCount = assignments.filter((a: any) => a.assignmentType === 'RETURNED_TO_PRINCIPAL' || a.status === 'PENDING').length;
    const pendingCount = returnedCount;
    const totalRequests = approvedCount + rejectedCount + returnedCount;

    const summaryDetails = {
      approvedCount,
      rejectedCount,
      returnedCount,
      totalRequests,
      actionLogs: actionLogs.map((l: any) => ({
        id: l.id,
        recordId: l.recordId,
        module: l.module,
        actionType: l.actionType,
        remarks: l.remarks,
        performedByRole: l.performedByRole,
        createdAt: l.createdAt,
      })),
    };

    const handover = await (prisma as any).delegationHandover.create({
      data: {
        delegationId: params.delegationId,
        principalUserId: params.principalUserId,
        actingUserId: params.actingUserId,
        totalRequests,
        approvedCount,
        rejectedCount,
        returnedCount,
        pendingCount,
        summary: JSON.stringify(summaryDetails),
      },
    });

    logger.info(`Generated handover summary (${handover.id}) for delegation ${params.delegationId}`);
    return handover;
  }

  /**
   * Get latest unacknowledged handover for Principal
   */
  static async getLatestHandover(principalUserId: string) {
    const handover = await (prisma as any).delegationHandover.findFirst({
      where: { principalUserId, acknowledgedAt: null },
      orderBy: { generatedAt: 'desc' },
      include: {
        delegation: true,
      },
    });
    return handover;
  }

  /**
   * Acknowledge handover by Principal
   */
  static async acknowledgeHandover(handoverId: string, principalUserId: string) {
    const handover = await (prisma as any).delegationHandover.updateMany({
      where: { id: handoverId, principalUserId },
      data: { acknowledgedAt: new Date() },
    });
    return handover;
  }
}
