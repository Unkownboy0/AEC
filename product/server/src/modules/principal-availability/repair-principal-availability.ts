import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

export class PrincipalDataRepairScript {
  /**
   * Data Repair & Startup Cleanup Routine
   */
  static async runCleanup() {
    logger.info('Running Principal Availability & Delegation Repair Script...');

    const now = new Date();
    let revokedCount = 0;
    let expiredCount = 0;
    let returnedCount = 0;

    // 1. Find PrincipalStatuses with legacy statuses and normalize to AVAILABLE
    const legacyStatuses = await (prisma as any).principalStatus.findMany({
      where: {
        status: { in: ['ONLINE', 'ACTIVE', 'PRESENT'] },
      },
    });

    for (const record of legacyStatuses) {
      await (prisma as any).principalStatus.update({
        where: { id: record.id },
        data: { status: 'AVAILABLE', version: { increment: 1 } },
      });
    }

    // 2. Find all Principals currently set to AVAILABLE
    const availablePrincipals = await (prisma as any).principalStatus.findMany({
      where: { status: 'AVAILABLE' },
    });

    for (const record of availablePrincipals) {
      // Revoke any active delegations while principal is AVAILABLE
      const invalidDelegations = await (prisma as any).principalDelegation.findMany({
        where: {
          principalUserId: record.principalUserId,
          status: 'ACTIVE',
        },
      });

      for (const del of invalidDelegations) {
        await (prisma as any).principalDelegation.update({
          where: { id: del.id },
          data: {
            status: 'REVOKED',
            revokedAt: now,
            revokedReason: 'DATA_REPAIR_PRINCIPAL_AVAILABLE',
          },
        });
        revokedCount++;

        // Return unresolved requests assigned to VP during this invalid delegation
        const pendingAssignments = await (prisma as any).approvalAssignment.findMany({
          where: {
            delegationId: del.id,
            status: 'PENDING',
          },
        });

        for (const assign of pendingAssignments) {
          await (prisma as any).approvalAssignment.update({
            where: { id: assign.id },
            data: {
              assignedUserId: record.principalUserId,
              assignedRole: 'PRINCIPAL',
              assignmentType: 'RETURNED_TO_PRINCIPAL',
              returnedAt: now,
            },
          });
          returnedCount++;
        }
      }
    }

    // 3. Find delegations past their endDate and expire them
    const expiredDelegations = await (prisma as any).principalDelegation.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { lte: now },
      },
    });

    for (const del of expiredDelegations) {
      await (prisma as any).principalDelegation.update({
        where: { id: del.id },
        data: {
          status: 'EXPIRED',
          expiredAt: now,
        },
      });
      expiredCount++;

      // Revert Principal status back to AVAILABLE if activeDelegationId matches
      await (prisma as any).principalStatus.updateMany({
        where: {
          principalUserId: del.principalUserId,
          activeDelegationId: del.id,
        },
        data: {
          status: 'AVAILABLE',
          activeDelegationId: null,
          version: { increment: 1 },
        },
      });
    }

    const report = {
      timestamp: now.toISOString(),
      normalizedLegacyStatuses: legacyStatuses.length,
      revokedInvalidDelegations: revokedCount,
      expiredDelegations: expiredCount,
      returnedPendingRequests: returnedCount,
    };

    logger.info(`⚡ Cleanup Report: ${JSON.stringify(report)}`);
    return report;
  }
}
