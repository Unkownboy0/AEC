import { prisma } from '../../lib/prisma';

export interface CreateDelegationDto {
  status: 'BUSY' | 'OFFLINE';
  startDate: string;
  endDate: string;
  reason: string;
  actingAuthority?: string;
  delegatedPermissions?: string[];
  emergencyContactNote?: string;
  messageToVp?: string;
}

export class DelegationService {
  /**
   * Get Principal's current status and active delegation info.
   */
  static async getPrincipalStatus(principalUserId: string) {
    let statusRecord = await (prisma as any).principalStatus.findUnique({
      where: { principalUserId }
    });

    if (!statusRecord) {
      statusRecord = await (prisma as any).principalStatus.create({
        data: {
          principalUserId,
          status: 'ONLINE'
        }
      });
    }

    // Check for active delegation
    let activeDelegation = null;
    if (statusRecord.activeDelegationId) {
      activeDelegation = await (prisma as any).principalDelegation.findUnique({
        where: { id: statusRecord.activeDelegationId }
      });

      // Auto-expire check
      if (activeDelegation && new Date() > new Date(activeDelegation.endDate)) {
        await this.revokeDelegation(principalUserId, activeDelegation.id, 'AUTOMATIC_EXPIRED');
        statusRecord = await (prisma as any).principalStatus.findUnique({ where: { principalUserId } });
        activeDelegation = null;
      }
    }

    return {
      status: statusRecord?.status || 'ONLINE',
      activeDelegation
    };
  }

  /**
   * Update Principal status to ONLINE, BUSY, or OFFLINE and process delegation.
   */
  static async updatePrincipalStatus(
    principalUserId: string,
    dto: { status: 'ONLINE' | 'BUSY' | 'OFFLINE'; delegation?: CreateDelegationDto },
    ipAddress?: string
  ) {
    // 1. If returning to ONLINE, revoke active delegation immediately
    if (dto.status === 'ONLINE' || (dto.status as string) === 'AVAILABLE') {
      const currentStatus = await (prisma as any).principalStatus.findUnique({
        where: { principalUserId }
      });

      if (currentStatus?.activeDelegationId) {
        await this.revokeDelegation(principalUserId, currentStatus.activeDelegationId, 'PRINCIPAL_RETURNED_EARLY');
      }

      await prisma.systemSetting.upsert({
        where: { key: 'PRINCIPAL_OFFLINE_MODE' },
        update: { value: 'false' },
        create: { key: 'PRINCIPAL_OFFLINE_MODE', value: 'false' }
      });

      const updatedStatus = await (prisma as any).principalStatus.upsert({
        where: { principalUserId },
        update: { status: 'ONLINE', activeDelegationId: null },
        create: { principalUserId, status: 'ONLINE' }
      });

      return { status: updatedStatus.status, activeDelegation: null };
    }

    // 2. Otherwise enable BUSY or OFFLINE with explicit delegation
    if (!dto.delegation) {
      throw new Error('Delegation details are required when setting status to Busy or Offline');
    }

    // Sync SystemSetting for PRINCIPAL_OFFLINE_MODE
    await prisma.systemSetting.upsert({
      where: { key: 'PRINCIPAL_OFFLINE_MODE' },
      update: { value: 'true' },
      create: { key: 'PRINCIPAL_OFFLINE_MODE', value: 'true' }
    });

    // Find Vice Principal user ID reliably
    const vpUser = await prisma.user.findFirst({
      where: {
        OR: [
          { role: { name: { in: ['Vice Principal', 'VP', 'VicePrincipal', 'VICE_PRINCIPAL'] } } },
          { email: { contains: 'vp' } },
          { email: { contains: 'vice' } },
          { username: { contains: 'vp' } }
        ]
      }
    });

    const vpUserId = vpUser ? vpUser.id : principalUserId;

    // Create Delegation record
    const startDate = new Date(dto.delegation.startDate);
    const endDate = new Date(dto.delegation.endDate);

    const newDelegation = await (prisma as any).principalDelegation.create({
      data: {
        principalUserId,
        actingUserId: vpUserId,
        actingUserRole: 'Vice Principal',
        status: 'ACTIVE',
        principalStatus: dto.status,
        startDate,
        endDate,
        reason: dto.delegation.reason,
        delegatedPermissions: JSON.stringify(dto.delegation.delegatedPermissions || [
          'FACULTY_LEAVE_APPROVAL',
          'CIRCULAR_PUBLISH',
          'INSTITUTIONAL_APPROVAL',
          'REPORTS_REVIEW',
          'WORKFLOW_APPROVAL'
        ]),
        emergencyContactNote: dto.delegation.emergencyContactNote || null,
        messageToVp: dto.delegation.messageToVp || null
      }
    });

    // Update Principal Status
    await (prisma as any).principalStatus.upsert({
      where: { principalUserId },
      update: { status: dto.status, activeDelegationId: newDelegation.id },
      create: { principalUserId, status: dto.status, activeDelegationId: newDelegation.id }
    });

    // Dispatch Native & In-App Notification to VP
    if (vpUser) {
      const formattedStart = startDate.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const formattedEnd = endDate.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      await prisma.notification.create({
        data: {
          recipientId: vpUser.id,
          eventType: 'ACTING_PRINCIPAL_ACTIVATED',
          title: 'Acting Principal Access Activated',
          message: `The Principal has enabled ${dto.status} Mode. You are authorized to perform delegated Principal actions from ${formattedStart} to ${formattedEnd}.`,
          relatedEntityType: 'PermissionDelegation',
          relatedEntityId: newDelegation.id,
          deepLinkRoute: '/vp/acting-principal',
          deliveryState: 'DELIVERED',
          deliveryChannel: 'NATIVE_PUSH'
        }
      });
    }

    // Audit Log
    await (prisma as any).delegationActionLog.create({
      data: {
        delegationId: newDelegation.id,
        module: 'DELEGATION',
        recordId: newDelegation.id,
        actionType: 'DELEGATION_ACTIVATED',
        performedByUserId: principalUserId,
        performedByRole: 'Principal',
        performedAsRole: 'Principal',
        delegatedByUserId: principalUserId,
        newStatus: dto.status,
        remarks: `Delegated Acting Principal powers to Vice Principal (${vpUser?.firstName || 'VP'}) until ${endDate.toISOString()}`,
        ipAddress: ipAddress || '127.0.0.1',
        platform: 'WEB'
      }
    });

    return {
      status: dto.status,
      activeDelegation: newDelegation
    };
  }

  /**
   * Revoke active delegation.
   */
  static async revokeDelegation(principalUserId: string, delegationId: string, reason: string = 'REVOKED_BY_PRINCIPAL') {
    const delegation = await (prisma as any).principalDelegation.findUnique({
      where: { id: delegationId }
    });

    if (delegation) {
      await (prisma as any).principalDelegation.update({
        where: { id: delegationId },
        data: {
          status: reason === 'AUTOMATIC_EXPIRED' ? 'EXPIRED' : 'REVOKED',
          revokedAt: new Date(),
          revokedReason: reason
        }
      });

      // Reset Principal Status
      await (prisma as any).principalStatus.updateMany({
        where: { principalUserId },
        data: { status: 'ONLINE', activeDelegationId: null }
      });

      await prisma.systemSetting.upsert({
        where: { key: 'PRINCIPAL_OFFLINE_MODE' },
        update: { value: 'false' },
        create: { key: 'PRINCIPAL_OFFLINE_MODE', value: 'false' }
      });

      // Send Native Revocation / Expiry Notification to VP
      await prisma.notification.create({
        data: {
          recipientId: delegation.actingUserId,
          eventType: 'ACTING_PRINCIPAL_ENDED',
          title: 'Acting Principal Access Ended',
          message: `Your delegated Acting Principal authority has ended (${reason === 'AUTOMATIC_EXPIRED' ? 'Time Expiry' : 'Principal Returned'}).`,
          relatedEntityType: 'PermissionDelegation',
          relatedEntityId: delegationId,
          deepLinkRoute: '/vp/dashboard',
          deliveryState: 'DELIVERED',
          deliveryChannel: 'NATIVE_PUSH'
        }
      });
    }
  }

  /**
   * Get VP Acting Principal active status and details.
   */
  static async getVpActingStatus(vpUserId: string) {
    const activeDelegation = await (prisma as any).principalDelegation.findFirst({
      where: {
        actingUserId: vpUserId,
        status: 'ACTIVE',
        endDate: { gte: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      isActingPrincipal: Boolean(activeDelegation),
      activeDelegation
    };
  }

  /**
   * VP acknowledges Acting Principal authority.
   */
  static async acknowledgeDelegation(vpUserId: string, delegationId: string, deviceId?: string) {
    const updated = await (prisma as any).principalDelegation.update({
      where: { id: delegationId },
      data: {
        acknowledgedAt: new Date(),
        acknowledgedDeviceId: deviceId || 'WEB_CLIENT'
      }
    });

    return updated;
  }

  /**
   * Log a delegated action (Audit attribution rule: Performed by VP, acting as ACTING_PRINCIPAL).
   */
  static async logDelegatedAction(params: {
    delegationId?: string;
    module: string;
    recordId: string;
    actionType: string;
    performedByUserId: string;
    performedByRole: string;
    performedAsRole: string;
    delegatedByUserId?: string;
    previousStatus?: string;
    newStatus?: string;
    remarks?: string;
    attachmentId?: string;
    ipAddress?: string;
    deviceId?: string;
  }) {
    return (prisma as any).delegationActionLog.create({
      data: {
        delegationId: params.delegationId || null,
        module: params.module,
        recordId: params.recordId,
        actionType: params.actionType,
        performedByUserId: params.performedByUserId,
        performedByRole: params.performedByRole,
        performedAsRole: params.performedAsRole || 'ACTING_PRINCIPAL',
        delegatedByUserId: params.delegatedByUserId || null,
        previousStatus: params.previousStatus || null,
        newStatus: params.newStatus || null,
        remarks: params.remarks || null,
        attachmentId: params.attachmentId || null,
        ipAddress: params.ipAddress || '127.0.0.1',
        deviceId: params.deviceId || null,
        platform: 'WEB'
      }
    });
  }
}
