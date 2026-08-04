import { prisma } from '../../lib/prisma';
import { PrincipalAvailabilityContext } from './availability.types';
import { logger } from '../../utils/logger';

export class PrincipalAvailabilityResolver {
  /**
   * Authoritative single source of truth for Principal availability status & VP delegation context.
   * Automatically normalizes invalid / expired database states.
   */
  static async resolveContext(targetPrincipalUserId?: string): Promise<PrincipalAvailabilityContext> {
    const now = new Date();

    // 1. Locate Principal User ID
    let principalUserId: string | null = null;

    if (targetPrincipalUserId) {
      const targetUser = await prisma.user.findFirst({
        where: {
          id: targetPrincipalUserId,
          OR: [
            { role: { name: { in: ['Principal', 'PRINCIPAL'] } } },
            { email: { contains: 'principal' } },
            { username: { contains: 'principal' } },
          ],
        },
      });
      if (targetUser) {
        principalUserId = targetUser.id;
      }
    }

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

    // 2. Fetch or create PrincipalStatus record
    let statusRecord = await (prisma as any).principalStatus.findFirst({
      where: { principalUserId },
    });

    if (!statusRecord) {
      statusRecord = await (prisma as any).principalStatus.create({
        data: {
          principalUserId,
          status: 'AVAILABLE',
          version: 1,
        },
      });
    }

    // Normalize legacy 'ONLINE' | 'ACTIVE' | 'PRESENT' status strings to 'AVAILABLE'
    if (['ONLINE', 'ACTIVE', 'PRESENT'].includes(statusRecord.status as string)) {
      statusRecord = await (prisma as any).principalStatus.update({
        where: { principalUserId },
        data: { status: 'AVAILABLE', version: { increment: 1 } },
      });
    }

    const currentStatus = statusRecord.status as 'AVAILABLE' | 'BUSY' | 'OFFLINE';

    // 3. Normalization Rule 1: If Principal is AVAILABLE, revoke any lingering ACTIVE delegations
    if (currentStatus === 'AVAILABLE') {
      const activeDelegations = await (prisma as any).principalDelegation.findMany({
        where: {
          principalUserId,
          status: 'ACTIVE',
        },
      });

      if (activeDelegations.length > 0) {
        await (prisma as any).principalDelegation.updateMany({
          where: {
            principalUserId,
            status: 'ACTIVE',
          },
          data: {
            status: 'REVOKED',
            revokedAt: now,
            revokedReason: 'AUTO_NORMALIZED_PRINCIPAL_AVAILABLE',
          },
        });

        statusRecord = await (prisma as any).principalStatus.update({
          where: { principalUserId },
          data: {
            activeDelegationId: null,
            version: { increment: 1 },
          },
        });

        logger.info(`Auto-normalized lingering ACTIVE delegations for Principal (${principalUserId}) to REVOKED`);
      }

      // Calculate pending counts
      const pendingPrincipalRequests = await (prisma as any).approvalAssignment.count({
        where: {
          assignedUserId: principalUserId,
          status: 'PENDING',
        },
      });

      const latestHandover = await (prisma as any).delegationHandover.findFirst({
        where: { principalUserId, acknowledgedAt: null },
        orderBy: { generatedAt: 'desc' },
      });

      return {
        principalStatus: 'AVAILABLE',
        delegationStatus: 'INACTIVE',
        actingPrincipal: null,
        delegation: null,
        canPrincipalProcessRequests: true,
        canVpActAsPrincipal: false,
        permissionVersion: statusRecord.version || 1,
        serverTime: now.toISOString(),
        pendingPrincipalRequests,
        pendingActingRequests: 0,
        latestHandoverId: latestHandover?.id || null,
      };
    }

    // 4. Normalization Rule 2: Principal is BUSY or OFFLINE -> Find valid ACTIVE delegation
    const activeDelegation = await (prisma as any).principalDelegation.findFirst({
      where: {
        principalUserId,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    // Check if delegation expired
    if (activeDelegation && new Date(activeDelegation.endDate) <= now) {
      await (prisma as any).principalDelegation.update({
        where: { id: activeDelegation.id },
        data: {
          status: 'EXPIRED',
          expiredAt: now,
        },
      });

      // Auto-revert principal status back to AVAILABLE
      statusRecord = await (prisma as any).principalStatus.update({
        where: { principalUserId },
        data: {
          status: 'AVAILABLE',
          activeDelegationId: null,
          version: { increment: 1 },
        },
      });

      logger.info(`Delegation ${activeDelegation.id} expired. Reverted Principal (${principalUserId}) to AVAILABLE`);

      return {
        principalStatus: 'AVAILABLE',
        delegationStatus: 'EXPIRED',
        actingPrincipal: null,
        delegation: null,
        canPrincipalProcessRequests: true,
        canVpActAsPrincipal: false,
        permissionVersion: statusRecord.version || 1,
        serverTime: now.toISOString(),
        pendingPrincipalRequests: 0,
        pendingActingRequests: 0,
        latestHandoverId: null,
      };
    }

    if (!activeDelegation) {
      // If status is BUSY/OFFLINE but no active delegation exists, normalize back to AVAILABLE
      statusRecord = await (prisma as any).principalStatus.update({
        where: { principalUserId },
        data: {
          status: 'AVAILABLE',
          activeDelegationId: null,
          version: { increment: 1 },
        },
      });

      return {
        principalStatus: 'AVAILABLE',
        delegationStatus: 'INACTIVE',
        actingPrincipal: null,
        delegation: null,
        canPrincipalProcessRequests: true,
        canVpActAsPrincipal: false,
        permissionVersion: statusRecord.version || 1,
        serverTime: now.toISOString(),
        pendingPrincipalRequests: 0,
        pendingActingRequests: 0,
        latestHandoverId: null,
      };
    }

    // 5. Fetch VP User Details for Acting Principal
    const vpUser = await prisma.user.findUnique({
      where: { id: activeDelegation.actingUserId },
    });

    const parsedCategories = JSON.parse(activeDelegation.delegatedCategories || '[]');
    const parsedPermissions = JSON.parse(activeDelegation.delegatedPermissions || '[]');

    const pendingActingRequests = await (prisma as any).approvalAssignment.count({
      where: {
        assignedUserId: activeDelegation.actingUserId,
        status: 'PENDING',
      },
    });

    const pendingPrincipalRequests = await (prisma as any).approvalAssignment.count({
      where: {
        assignedUserId: principalUserId,
        status: 'PENDING',
      },
    });

    return {
      principalStatus: currentStatus,
      delegationStatus: 'ACTIVE',
      actingPrincipal: vpUser
        ? {
            userId: vpUser.id,
            name: `${vpUser.firstName} ${vpUser.lastName}`.trim(),
            role: 'VICE_PRINCIPAL',
            email: vpUser.email,
          }
        : {
            userId: activeDelegation.actingUserId,
            name: 'Dr. Vice Principal',
            role: 'VICE_PRINCIPAL',
          },
      delegation: {
        id: activeDelegation.id,
        startsAt: activeDelegation.startDate.toISOString(),
        endsAt: activeDelegation.endDate.toISOString(),
        reason: activeDelegation.reason,
        delegatedCategories: parsedCategories,
        permissions: parsedPermissions,
      },
      canPrincipalProcessRequests: false,
      canVpActAsPrincipal: true,
      permissionVersion: statusRecord.version || 1,
      serverTime: now.toISOString(),
      pendingPrincipalRequests,
      pendingActingRequests,
      latestHandoverId: null,
    };
  }
}
