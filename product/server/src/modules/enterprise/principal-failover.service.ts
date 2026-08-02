import { prisma } from '../../lib/prisma';
import { BadRequestException, NotFoundException, ForbiddenException } from '../../utils/exceptions';
import { logger } from '../../utils/logger';

export interface FailoverLogParams {
  principalUserId: string;
  actingUserId: string;
  actingUserRole?: string;
  actionType: string;
  targetEntityId: string;
  targetEntityType: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
}

export class PrincipalFailoverService {
  /**
   * Toggle Principal Failover Mode (ONLINE, OFFLINE, ON_LEAVE, DELEGATED)
   */
  async setFailoverStatus(userId: string, status: 'ONLINE' | 'OFFLINE' | 'ON_LEAVE' | 'DELEGATED', reason?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !['Principal', 'Super Admin'].includes(user.role.name)) {
      throw new ForbiddenException('Only Principal or Super Admin can toggle failover status');
    }

    const isOffline = status !== 'ONLINE';

    // Upsert SystemSetting for PRINCIPAL_OFFLINE_MODE
    await prisma.systemSetting.upsert({
      where: { key: 'PRINCIPAL_OFFLINE_MODE' },
      update: { value: String(isOffline) },
      create: { key: 'PRINCIPAL_OFFLINE_MODE', value: String(isOffline) },
    });

    // Notify all Vice Principal users
    const vicePrincipals = await prisma.user.findMany({
      where: { role: { name: 'Vice Principal' }, status: 'ACTIVE' },
    });

    for (const vp of vicePrincipals) {
      try {
        await (prisma as any).notification.create({
          data: {
            recipientId: vp.id,
            eventType: isOffline ? 'ACTING_PRINCIPAL_ACTIVATED' : 'ACTING_PRINCIPAL_DEACTIVATED',
            title: isOffline ? '⚡ Acting Principal Mode Activated' : 'ℹ️ Principal Online Mode Restored',
            message: isOffline
              ? `Principal is now ${status}. Full Level 2 sign-off & institutional sign-off authority has been delegated to you.`
              : 'Principal is back online. Delegated sign-off authority deactivated.',
            relatedEntityType: 'FAILOVER_SETTING',
            relatedEntityId: 'PRINCIPAL_OFFLINE_MODE',
          },
        });
      } catch (err) {
        logger.warn('Failed to notify Vice Principal of failover toggle:', err);
      }
    }

    logger.info(`⚡ Principal Failover Status changed to '${status}' by ${user.email} (Offline Mode: ${isOffline})`);

    return {
      status,
      isOffline,
      reason: reason || `Failover mode set to ${status}`,
      updatedAt: new Date(),
    };
  }

  /**
   * Get Current Principal Failover Status
   */
  async getFailoverStatus() {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'PRINCIPAL_OFFLINE_MODE' },
    });

    const isOffline = setting?.value === 'true';

    const vicePrincipals = await prisma.user.findMany({
      where: { role: { name: 'Vice Principal' }, status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    return {
      status: isOffline ? 'OFFLINE' : 'ONLINE',
      isOffline,
      actingRole: 'Vice Principal',
      actingUsers: vicePrincipals,
      updatedAt: setting?.updatedAt || new Date(),
    };
  }

  /**
   * Log Delegated Action performed by Vice Principal as Acting Principal
   */
  async logDelegatedAction(params: FailoverLogParams) {
    try {
      return await (prisma as any).principalDelegationLog.create({
        data: {
          principalUserId: params.principalUserId,
          actingUserId: params.actingUserId,
          actingUserRole: params.actingUserRole || 'Vice Principal',
          actionType: params.actionType,
          targetEntityId: params.targetEntityId,
          targetEntityType: params.targetEntityType,
          description: params.description,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (err) {
      logger.error('Failed to log principal delegation action:', err);
      return null;
    }
  }

  /**
   * Get Delegation Audit Trail Logs
   */
  async getDelegationAuditLogs(limit = 100) {
    return (prisma as any).principalDelegationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
