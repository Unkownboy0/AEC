import { prisma } from '../../lib/prisma';

export interface DelegationContextPayload {
  principalStatus: 'ONLINE' | 'BUSY' | 'OFFLINE';
  delegationStatus: 'INACTIVE' | 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  actingPrincipalUserId: string | null;
  actingUser: { id: string; name: string; role: string } | null;
  delegationId: string | null;
  delegationStartsAt: string | null;
  delegationEndsAt: string | null;
  permissions: string[];
  permissionVersion: number;
  serverTime: string;
  reason?: string | null;
  acknowledgedAt?: string | null;
  pendingPrincipalRequests: number;
  pendingActingRequests: number;
  latestHandoverId?: string | null;
}

export class PrincipalDelegationResolverService {
  /**
   * Authoritative single source of truth for Principal status & delegation context.
   * Automatically normalizes invalid / expired database states.
   */
  static async resolveStatus(targetPrincipalUserId?: string): Promise<DelegationContextPayload> {
    const now = new Date();

    // 1. Locate Principal User ID if not provided directly
    let principalUserId = targetPrincipalUserId;
    if (!principalUserId) {
      const principalUser = await prisma.user.findFirst({
        where: {
          OR: [
            { role: { name: { in: ['Principal', 'PRINCIPAL'] } } },
            { email: { contains: 'principal' } },
            { username: { contains: 'principal' } }
          ]
        }
      });
      principalUserId = principalUser ? principalUser.id : 'SYSTEM_PRINCIPAL';
    }

    // 2. Fetch or create PrincipalStatus
    let statusRecord = await prisma.principalStatus.findFirst({
      where: { principalUserId }
    });

    if (!statusRecord) {
      statusRecord = await prisma.principalStatus.create({
        data: {
          principalUserId,
          status: 'ONLINE',
          version: 1
        }
      });
    }

    // Migrate legacy AVAILABLE → ONLINE
    if ((statusRecord.status as string) === 'AVAILABLE') {
      statusRecord = await prisma.principalStatus.update({
        where: { principalUserId },
        data: { status: 'ONLINE', version: { increment: 1 } }
      });
    }

    // 3. Normalization Rule 1: If Principal is ONLINE, revoke any lingering ACTIVE delegations
    if (statusRecord.status === 'ONLINE') {
      const activeDelegations = await (prisma as any).principalDelegation.findMany({
        where: {
          principalUserId,
          status: 'ACTIVE'
        }
      });

      if (activeDelegations.length > 0) {
        await (prisma as any).principalDelegation.updateMany({
          where: {
            principalUserId,
            status: 'ACTIVE'
          },
          data: {
            status: 'REVOKED',
            revokedAt: now,
            revokedReason: 'NORMALIZED_PRINCIPAL_ONLINE'
          }
        });

        await prisma.systemSetting.upsert({
          where: { key: 'PRINCIPAL_OFFLINE_MODE' },
          update: { value: 'false' },
          create: { key: 'PRINCIPAL_OFFLINE_MODE', value: 'false' }
        });

        statusRecord = await prisma.principalStatus.update({
          where: { principalUserId },
          data: {
            activeDelegationId: null,
            version: { increment: 1 }
          }
        });
      }

      // Get pending request counts
      const pendingPrincipalRequests = await this.countPendingPrincipalRequests();

      // Check for latest handover
      const latestHandover = await (prisma as any).delegationHandover.findFirst({
        where: { principalUserId, acknowledgedAt: null },
        orderBy: { generatedAt: 'desc' }
      });

      return {
        principalStatus: 'ONLINE',
        delegationStatus: 'INACTIVE',
        actingPrincipalUserId: null,
        actingUser: null,
        delegationId: null,
        delegationStartsAt: null,
        delegationEndsAt: null,
        permissions: [],
        permissionVersion: statusRecord.version || 1,
        serverTime: now.toISOString(),
        reason: null,
        acknowledgedAt: null,
        pendingPrincipalRequests,
        pendingActingRequests: 0,
        latestHandoverId: latestHandover?.id || null
      };
    }

    // 4. Normalization Rule 2: If Principal is BUSY or OFFLINE, find valid ACTIVE delegation
    const activeDelegation = await (prisma as any).principalDelegation.findFirst({
      where: {
        principalUserId,
        status: 'ACTIVE'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!activeDelegation) {
      // Auto-normalize: BUSY/OFFLINE with no active delegation reverts to ONLINE
      statusRecord = await prisma.principalStatus.update({
        where: { principalUserId },
        data: {
          status: 'ONLINE',
          activeDelegationId: null,
          version: { increment: 1 }
        }
      });

      await prisma.systemSetting.upsert({
        where: { key: 'PRINCIPAL_OFFLINE_MODE' },
        update: { value: 'false' },
        create: { key: 'PRINCIPAL_OFFLINE_MODE', value: 'false' }
      });

      return {
        principalStatus: 'ONLINE',
        delegationStatus: 'INACTIVE',
        actingPrincipalUserId: null,
        actingUser: null,
        delegationId: null,
        delegationStartsAt: null,
        delegationEndsAt: null,
        permissions: [],
        permissionVersion: statusRecord.version || 1,
        serverTime: now.toISOString(),
        pendingPrincipalRequests: 0,
        pendingActingRequests: 0
      };
    }

    // Check for delegation expiry
    if (now >= new Date(activeDelegation.endDate)) {
      await (prisma as any).principalDelegation.update({
        where: { id: activeDelegation.id },
        data: {
          status: 'EXPIRED',
          revokedAt: now,
          revokedReason: 'AUTOMATIC_EXPIRED'
        }
      });

      statusRecord = await prisma.principalStatus.update({
        where: { principalUserId },
        data: {
          status: 'ONLINE',
          activeDelegationId: null,
          version: { increment: 1 }
        }
      });

      await prisma.systemSetting.upsert({
        where: { key: 'PRINCIPAL_OFFLINE_MODE' },
        update: { value: 'false' },
        create: { key: 'PRINCIPAL_OFFLINE_MODE', value: 'false' }
      });

      return {
        principalStatus: 'ONLINE',
        delegationStatus: 'EXPIRED',
        actingPrincipalUserId: null,
        actingUser: null,
        delegationId: null,
        delegationStartsAt: null,
        delegationEndsAt: null,
        permissions: [],
        permissionVersion: statusRecord.version || 1,
        serverTime: now.toISOString(),
        pendingPrincipalRequests: 0,
        pendingActingRequests: 0
      };
    }

    // Active & valid delegation context
    let parsedPermissions: string[] = [];
    try {
      parsedPermissions = JSON.parse(activeDelegation.delegatedPermissions || '[]');
    } catch {
      parsedPermissions = [
        'principal.approvals.view',
        'principal.approvals.approve',
        'principal.approvals.reject',
        'principal.circulars.publish'
      ];
    }

    // Resolve acting user details
    let actingUser: { id: string; name: string; role: string } | null = null;
    try {
      const vpUser = await prisma.user.findUnique({
        where: { id: activeDelegation.actingUserId },
        include: { role: true }
      });
      if (vpUser) {
        actingUser = {
          id: vpUser.id,
          name: (vpUser as any).name || (vpUser as any).username || 'Vice Principal',
          role: (vpUser.role as any)?.name || 'Vice Principal'
        };
      }
    } catch { /* graceful fallback */ }

    // Count pending requests assigned to VP (acting)
    const pendingActingRequests = await this.countPendingPrincipalRequests();

    return {
      principalStatus: statusRecord.status as any,
      delegationStatus: 'ACTIVE',
      actingPrincipalUserId: activeDelegation.actingUserId,
      actingUser,
      delegationId: activeDelegation.id,
      delegationStartsAt: new Date(activeDelegation.startDate).toISOString(),
      delegationEndsAt: new Date(activeDelegation.endDate).toISOString(),
      permissions: parsedPermissions,
      permissionVersion: statusRecord.version || 1,
      serverTime: now.toISOString(),
      reason: activeDelegation.reason,
      acknowledgedAt: activeDelegation.acknowledgedAt ? new Date(activeDelegation.acknowledgedAt).toISOString() : null,
      pendingPrincipalRequests: 0,
      pendingActingRequests
    };
  }

  /**
   * Count pending requests at PRINCIPAL step.
   */
  static async countPendingPrincipalRequests(): Promise<number> {
    try {
      const count = await prisma.workflowRequest.count({
        where: {
          currentStep: 'PRINCIPAL',
          status: 'PENDING'
        }
      });
      return count;
    } catch {
      return 0;
    }
  }

  /**
   * One-time startup database cleanup of invalid / stale delegations.
   */
  static async runDatabaseCleanup() {
    const now = new Date();
    const activeDelegations = await (prisma as any).principalDelegation.findMany({
      where: { status: 'ACTIVE' }
    });

    let expiredCount = 0;
    let revokedCount = 0;

    for (const del of activeDelegations) {
      const principalStatus = await prisma.principalStatus.findFirst({
        where: { principalUserId: del.principalUserId }
      });

      // Migrate legacy AVAILABLE → ONLINE and cleanup
      if (!principalStatus || principalStatus.status === 'ONLINE' || principalStatus.status === 'AVAILABLE') {
        await (prisma as any).principalDelegation.update({
          where: { id: del.id },
          data: { status: 'REVOKED', revokedAt: now, revokedReason: 'MIGRATION_CLEANUP' }
        });
        revokedCount++;
      } else if (now >= new Date(del.endDate)) {
        await (prisma as any).principalDelegation.update({
          where: { id: del.id },
          data: { status: 'EXPIRED', revokedAt: now, revokedReason: 'MIGRATION_EXPIRED' }
        });
        await prisma.principalStatus.update({
          where: { id: principalStatus.id },
          data: { status: 'ONLINE', activeDelegationId: null }
        });
        expiredCount++;
      }
    }

    // Migrate any AVAILABLE status records to ONLINE
    await prisma.principalStatus.updateMany({
      where: { status: 'AVAILABLE' },
      data: { status: 'ONLINE' }
    });

    return {
      expiredCount,
      revokedCount,
      timestamp: now.toISOString()
    };
  }
}
