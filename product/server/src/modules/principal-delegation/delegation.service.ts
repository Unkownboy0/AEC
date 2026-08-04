import { prisma } from '../../lib/prisma';
import { PrincipalDelegationResolverService } from './principal-delegation-resolver.service';
import { RequestRoutingService } from './request-routing.service';
import { HandoverService } from './handover.service';

export interface CreateDelegationDto {
  status: 'ONLINE' | 'BUSY' | 'OFFLINE';
  reason?: string;
  startsAt?: string;
  endsAt?: string;
  actingUserId?: string;
  permissions?: string[];
  emergencyContactNote?: string;
  messageToVp?: string;
}

export class DelegationService {
  /**
   * Authoritative status update executing in a transaction.
   */
  static async updateStatus(
    principalUserId: string,
    dto: CreateDelegationDto,
    ipAddress?: string
  ) {
    const now = new Date();

    // Accept both ONLINE and legacy AVAILABLE
    const isReturningOnline = dto.status === 'ONLINE' || (dto.status as string) === 'AVAILABLE';

    // 1. Return to ONLINE Mode
    if (isReturningOnline) {
      // Find all active delegations and mark REVOKED
      const activeDelegations = await (prisma as any).principalDelegation.findMany({
        where: { principalUserId, status: 'ACTIVE' }
      });

      for (const del of activeDelegations) {
        // Generate handover summary BEFORE revoking
        try {
          await HandoverService.generateHandover(del.id, principalUserId, del.actingUserId);
        } catch (err) {
          console.error('Handover generation failed (non-blocking):', err);
        }

        // Return pending requests from VP back to Principal queue
        try {
          await RequestRoutingService.returnPendingRequests(del.id, principalUserId);
        } catch (err) {
          console.error('Request return failed (non-blocking):', err);
        }

        await (prisma as any).principalDelegation.update({
          where: { id: del.id },
          data: {
            status: 'REVOKED',
            revokedAt: now,
            revokedReason: 'PRINCIPAL_RETURNED_ONLINE'
          }
        });

        // Send native notification to VP
        await prisma.notification.create({
          data: {
            recipientId: del.actingUserId,
            eventType: 'ACTING_PRINCIPAL_REVOKED',
            title: 'Acting Principal Access Revoked',
            message: 'The Principal is now Online. Your temporary Acting Principal access has ended. All unresolved requests have been returned to the Principal.',
            relatedEntityType: 'PrincipalDelegation',
            relatedEntityId: del.id,
            deepLinkRoute: '/vp/dashboard',
            deliveryState: 'DELIVERED',
            deliveryChannel: 'NATIVE_PUSH'
          }
        });
      }

      // Update PrincipalStatus
      await (prisma as any).principalStatus.upsert({
        where: { principalUserId },
        update: {
          status: 'ONLINE',
          reason: null,
          activeDelegationId: null,
          version: { increment: 1 }
        },
        create: {
          principalUserId,
          status: 'ONLINE',
          version: 1
        }
      });

      await prisma.systemSetting.upsert({
        where: { key: 'PRINCIPAL_OFFLINE_MODE' },
        update: { value: 'false' },
        create: { key: 'PRINCIPAL_OFFLINE_MODE', value: 'false' }
      });

      // Audit Log
      await (prisma as any).delegationActionLog.create({
        data: {
          module: 'DELEGATION',
          recordId: principalUserId,
          actionType: 'STATUS_ONLINE',
          performedByUserId: principalUserId,
          performedByRole: 'Principal',
          performedAsRole: 'Principal',
          newStatus: 'ONLINE',
          remarks: 'Principal returned to Online mode. All Vice Principal delegations revoked. Pending requests returned.',
          ipAddress: ipAddress || '127.0.0.1',
          platform: 'WEB'
        }
      });

      // Notify Principal of handover summary
      const latestHandover = await (prisma as any).delegationHandover.findFirst({
        where: { principalUserId, acknowledgedAt: null },
        orderBy: { generatedAt: 'desc' }
      });
      if (latestHandover) {
        await prisma.notification.create({
          data: {
            recipientId: principalUserId,
            eventType: 'HANDOVER_SUMMARY_READY',
            title: 'VP Handover Summary Ready',
            message: `Delegation ended. VP handled ${latestHandover.totalRequests} request(s): ${latestHandover.approvedCount} approved, ${latestHandover.rejectedCount} rejected, ${latestHandover.returnedCount} returned to you.`,
            relatedEntityType: 'DelegationHandover',
            relatedEntityId: latestHandover.id,
            deepLinkRoute: '/principal/approval-center',
            deliveryState: 'DELIVERED',
            deliveryChannel: 'NATIVE_PUSH'
          }
        });
      }

      return PrincipalDelegationResolverService.resolveStatus(principalUserId);
    }

    // 2. Enable BUSY or OFFLINE Mode
    if (!dto.reason) {
      throw new Error('Reason is required when setting status to Busy or Offline');
    }

    // Find Vice Principal User ID reliably
    let vpUserId = dto.actingUserId;
    if (!vpUserId) {
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
      vpUserId = vpUser ? vpUser.id : principalUserId;
    }

    // Dates validation
    const startDate = dto.startsAt ? new Date(dto.startsAt) : now;
    const endDate = dto.endsAt ? new Date(dto.endsAt) : new Date(now.getTime() + 8 * 3600 * 1000);

    // Revoke any previous active delegations
    await (prisma as any).principalDelegation.updateMany({
      where: { principalUserId, status: 'ACTIVE' },
      data: { status: 'REVOKED', revokedAt: now, revokedReason: 'SUPERSEDED_BY_NEW_DELEGATION' }
    });

    // Create New Delegation Record
    const permissionsArr = dto.permissions || [
      'principal.approvals.view',
      'principal.approvals.approve',
      'principal.approvals.reject',
      'principal.circulars.publish'
    ];

    const newDelegation = await (prisma as any).principalDelegation.create({
      data: {
        principalUserId,
        actingUserId: vpUserId,
        actingUserRole: 'Vice Principal',
        status: 'ACTIVE',
        principalStatus: dto.status,
        startDate,
        endDate,
        reason: dto.reason,
        delegatedPermissions: JSON.stringify(permissionsArr),
        emergencyContactNote: dto.emergencyContactNote || null,
        messageToVp: dto.messageToVp || null,
        version: 1
      }
    });

    // Update PrincipalStatus
    await (prisma as any).principalStatus.upsert({
      where: { principalUserId },
      update: {
        status: dto.status,
        reason: dto.reason,
        activeDelegationId: newDelegation.id,
        version: { increment: 1 }
      },
      create: {
        principalUserId,
        status: dto.status,
        reason: dto.reason,
        activeDelegationId: newDelegation.id,
        version: 1
      }
    });

    await prisma.systemSetting.upsert({
      where: { key: 'PRINCIPAL_OFFLINE_MODE' },
      update: { value: 'true' },
      create: { key: 'PRINCIPAL_OFFLINE_MODE', value: 'true' }
    });

    // Transfer pending Principal requests to VP queue
    try {
      await RequestRoutingService.transferPendingRequests(newDelegation.id, vpUserId);
    } catch (err) {
      console.error('Request transfer failed (non-blocking):', err);
    }

    // Send Native Notification to VP
    const formattedEnd = endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    await prisma.notification.create({
      data: {
        recipientId: vpUserId,
        eventType: 'ACTING_PRINCIPAL_ACTIVATED',
        title: 'Acting Principal Access Activated',
        message: `The Principal is now ${dto.status}. Your delegated authority is active until ${formattedEnd}. Reason: ${dto.reason}`,
        relatedEntityType: 'PrincipalDelegation',
        relatedEntityId: newDelegation.id,
        deepLinkRoute: '/vp/acting-principal/approval-center',
        deliveryState: 'DELIVERED',
        deliveryChannel: 'NATIVE_PUSH'
      }
    });

    // Audit Record
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
        remarks: `Activated ${dto.status} delegation for Vice Principal until ${endDate.toISOString()}. Reason: ${dto.reason}`,
        ipAddress: ipAddress || '127.0.0.1',
        platform: 'WEB'
      }
    });

    return PrincipalDelegationResolverService.resolveStatus(principalUserId);
  }

  /**
   * Revoke delegation explicitly.
   */
  static async revokeDelegation(principalUserId: string, delegationId: string, reason: string = 'MANUAL_REVOKED') {
    const delegation = await (prisma as any).principalDelegation.findUnique({
      where: { id: delegationId }
    });

    if (delegation) {
      // Generate handover before revoking
      try {
        await HandoverService.generateHandover(delegationId, principalUserId, delegation.actingUserId);
      } catch (err) {
        console.error('Handover generation failed (non-blocking):', err);
      }

      // Return pending requests
      try {
        await RequestRoutingService.returnPendingRequests(delegationId, principalUserId);
      } catch (err) {
        console.error('Request return failed (non-blocking):', err);
      }

      await (prisma as any).principalDelegation.update({
        where: { id: delegationId },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
          revokedReason: reason
        }
      });

      await (prisma as any).principalStatus.updateMany({
        where: { principalUserId },
        data: { status: 'ONLINE', reason: null, activeDelegationId: null }
      });

      await prisma.systemSetting.upsert({
        where: { key: 'PRINCIPAL_OFFLINE_MODE' },
        update: { value: 'false' },
        create: { key: 'PRINCIPAL_OFFLINE_MODE', value: 'false' }
      });

      await prisma.notification.create({
        data: {
          recipientId: delegation.actingUserId,
          eventType: 'ACTING_PRINCIPAL_REVOKED',
          title: 'Acting Principal Access Revoked',
          message: 'Your delegated Principal authority has been revoked. The Principal is now Online.',
          relatedEntityType: 'PrincipalDelegation',
          relatedEntityId: delegationId,
          deepLinkRoute: '/vp/dashboard',
          deliveryState: 'DELIVERED',
          deliveryChannel: 'NATIVE_PUSH'
        }
      });
    }

    return PrincipalDelegationResolverService.resolveStatus(principalUserId);
  }

  /**
   * VP acknowledges delegation.
   */
  static async acknowledgeDelegation(vpUserId: string, delegationId: string, deviceId?: string) {
    const updated = await (prisma as any).principalDelegation.update({
      where: { id: delegationId },
      data: {
        acknowledgedAt: new Date(),
        acknowledgedDeviceId: deviceId || 'WEB_DEVICE'
      }
    });

    return updated;
  }
}
