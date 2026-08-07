import { prisma } from '../../lib/prisma';
import { UpdateAvailabilityDto } from './availability.types';
import { PrincipalAvailabilityResolver } from './availability.resolver';
import { RequestTransferService } from './request-transfer.service';
import { HandoverService } from './handover.service';
import { availabilityEvents } from './availability.events';
import { AvailabilityNotificationService } from './availability.notifications';
import { logger } from '../../utils/logger';

export class PrincipalAvailabilityService {
  /**
   * Update Principal status & handle atomic delegation transactions
   */
  static async updateAvailability(targetUserId: string, dto: UpdateAvailabilityDto) {
    const now = new Date();

    // Find principal user
    let principalUser = await prisma.user.findFirst({
      where: {
        id: targetUserId,
        OR: [
          { role: { name: { in: ['Principal', 'PRINCIPAL'] } } },
          { email: { contains: 'principal' } },
          { username: { contains: 'principal' } },
        ],
      },
    });

    if (!principalUser) {
      principalUser = await prisma.user.findFirst({
        where: {
          OR: [
            { role: { name: { in: ['Principal', 'PRINCIPAL'] } } },
            { email: { contains: 'principal' } },
            { username: { contains: 'principal' } },
          ],
        },
      });
    }

    const principalUserId = principalUser ? principalUser.id : targetUserId;
    const principalName = principalUser ? `${principalUser.firstName} ${principalUser.lastName}`.trim() : 'Principal';

    if (dto.status === 'AVAILABLE') {
      // -------------------------------------------------------------
      // TRANSACTION 1: RETURN TO AVAILABLE
      // -------------------------------------------------------------

      // Find any current active delegation
      const activeDelegation = await (prisma as any).principalDelegation.findFirst({
        where: { principalUserId, status: 'ACTIVE' },
      });

      let handoverId: string | null = null;
      let vpUserId: string | null = null;
      let returnedCount = 0;
      let processedCount = 0;

      if (activeDelegation) {
        vpUserId = activeDelegation.actingUserId;

        // Revoke active delegation
        await (prisma as any).principalDelegation.update({
          where: { id: activeDelegation.id },
          data: {
            status: 'REVOKED',
            revokedAt: now,
            revokedBy: principalUserId,
            revokedReason: 'PRINCIPAL_RETURNED_AVAILABLE',
          },
        });

        // Return unresolved requests back to Principal
        returnedCount = await RequestTransferService.returnPendingRequestsToPrincipal({
          principalUserId,
          delegationId: activeDelegation.id,
        });

        // Calculate processed count
        const logsCount = await (prisma as any).delegationActionLog.count({
          where: { delegationId: activeDelegation.id },
        });
        processedCount = logsCount;

        // Generate handover summary
        const handover = await HandoverService.generateHandover({
          delegationId: activeDelegation.id,
          principalUserId,
          actingUserId: activeDelegation.actingUserId,
        });
        handoverId = handover.id;
      }

      // Update Principal status record
      const statusRecord = await (prisma as any).principalStatus.upsert({
        where: { principalUserId },
        update: {
          status: 'AVAILABLE',
          reason: null,
          startsAt: null,
          endsAt: null,
          updatedBy: principalUserId,
          activeDelegationId: null,
          version: { increment: 1 },
        },
        create: {
          principalUserId,
          status: 'AVAILABLE',
          version: 1,
        },
      });

      // Emit realtime events
      availabilityEvents.emitAvailabilityChanged({
        principalUserId,
        principalStatus: 'AVAILABLE',
        delegationStatus: 'INACTIVE',
        actingPrincipalUserId: null,
        version: statusRecord.version,
      });

      if (activeDelegation && vpUserId) {
        availabilityEvents.emitDelegationEnded({
          delegationId: activeDelegation.id,
          principalUserId,
          actingUserId: vpUserId,
          handoverId: handoverId || undefined,
        });

        if (handoverId) {
          availabilityEvents.emitHandoverGenerated({
            handoverId,
            principalUserId,
          });
        }

        // Send notifications
        await AvailabilityNotificationService.notifyDelegationEnded({
          vpUserId,
          principalUserId,
          returnedCount,
          processedCount,
        });
      }

      return await PrincipalAvailabilityResolver.resolveContext(principalUserId);
    }

    // -------------------------------------------------------------
    // TRANSACTION 2: TRANSITION TO BUSY OR OFFLINE
    // -------------------------------------------------------------
    if (!dto.actingUserId) {
      // Find default Vice Principal user if not supplied
      const vpUser = await prisma.user.findFirst({
        where: {
          OR: [
            { role: { name: { in: ['Vice Principal', 'VICE_PRINCIPAL', 'VP'] } } },
            { designation: { contains: 'Vice Principal' } },
            { email: { contains: 'vp' } },
          ],
        },
      });

      if (!vpUser) {
        throw new Error('Vice Principal user not found for delegation authorization');
      }
      dto.actingUserId = vpUser.id;
    }

    const startDate = dto.startsAt ? new Date(dto.startsAt) : now;
    const endDate = dto.endsAt ? new Date(dto.endsAt) : new Date(now.getTime() + 8 * 3600 * 1000); // Default 8 hrs

    const categories = dto.delegatedCategories || [
      'FACULTY_LEAVE',
      'HOD_LEAVE',
      'DEAN_LEAVE',
      'DOCUMENT_APPROVAL',
      'CIRCULAR_APPROVAL',
      'TASK_APPROVAL',
    ];

    const permissions = [
      'principal.approvals.view',
      'principal.approvals.approve',
      'principal.approvals.reject',
      'principal.approvals.return',
    ];

    // Close any previous active delegation
    await (prisma as any).principalDelegation.updateMany({
      where: { principalUserId, status: 'ACTIVE' },
      data: {
        status: 'REVOKED',
        revokedAt: now,
        revokedBy: principalUserId,
        revokedReason: 'SUPERSEDED_BY_NEW_DELEGATION',
      },
    });

    // Create new delegation
    const delegation = await (prisma as any).principalDelegation.create({
      data: {
        principalUserId,
        actingUserId: dto.actingUserId,
        actingUserRole: 'Vice Principal',
        status: 'ACTIVE',
        principalStatus: dto.status,
        startDate,
        endDate,
        reason: dto.reason || (dto.status === 'BUSY' ? 'Principal busy with meetings' : 'Principal offline on leave'),
        delegatedCategories: JSON.stringify(categories),
        delegatedPermissions: JSON.stringify(permissions),
        messageToVp: dto.messageToVp || null,
        createdBy: principalUserId,
        version: 1,
      },
    });

    // Update PrincipalStatus
    const statusRecord = await (prisma as any).principalStatus.upsert({
      where: { principalUserId },
      update: {
        status: dto.status,
        reason: dto.reason || null,
        startsAt: startDate,
        endsAt: endDate,
        updatedBy: principalUserId,
        activeDelegationId: delegation.id,
        version: { increment: 1 },
      },
      create: {
        principalUserId,
        status: dto.status,
        reason: dto.reason || null,
        startsAt: startDate,
        endsAt: endDate,
        activeDelegationId: delegation.id,
        version: 1,
      },
    });

    // Transfer eligible pending requests to VP
    const pendingTransferredCount = await RequestTransferService.transferPendingRequestsToVp({
      principalUserId,
      vpUserId: dto.actingUserId,
      delegationId: delegation.id,
      categories,
    });

    // Emit events
    availabilityEvents.emitAvailabilityChanged({
      principalUserId,
      principalStatus: dto.status as any,
      delegationStatus: 'ACTIVE',
      actingPrincipalUserId: dto.actingUserId,
      version: statusRecord.version,
    });

    availabilityEvents.emitDelegationStarted({
      delegationId: delegation.id,
      principalUserId,
      actingUserId: dto.actingUserId,
      endsAt: endDate.toISOString(),
    });

    // Send native & in-app notification
    await AvailabilityNotificationService.notifyVpDelegationStarted({
      vpUserId: dto.actingUserId,
      principalName,
      status: dto.status as 'BUSY' | 'OFFLINE',
      endsAt: endDate.toISOString(),
      pendingCount: pendingTransferredCount,
    });

    logger.info(`Successfully set Principal status to ${dto.status} with active delegation to VP (${dto.actingUserId})`);

    return await PrincipalAvailabilityResolver.resolveContext(principalUserId);
  }

  /**
   * Fetch eligible delegation roles (Vice Principal ONLY)
   */
  static async getEligibleDelegates() {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { role: { name: { in: ['Vice Principal', 'VICE_PRINCIPAL', 'VP'] } } },
          { designation: { contains: 'Vice Principal' } },
          { email: { contains: 'vp' } },
        ],
      },
      include: { role: true },
    });

    const mapped = users.map((u) => ({
      id: u.id,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
      role: u.role?.name || 'Vice Principal',
      designation: u.designation || 'Vice Principal',
      email: u.email,
      priority: 1,
    }));

    return mapped;
  }
}
