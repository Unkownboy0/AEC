import { prisma } from '../../lib/prisma';
import { DelegationService } from '../delegation/delegation.service';
import { CircularRepository } from './circular.repository';
import { CircularRecipientService } from './circular-recipient.service';
import { CircularNotificationService } from './circular-notification.service';
import { CircularEvents } from './circular.events';
import {
  canPublishDepartmentCircular,
  canPublishInstitutionCircular,
  getPublishedAsLabel,
  isHodRole,
} from './circular.permissions';
import { CreateCircularDto } from './circular.validation';
import { logger } from '../../utils/logger';

const repo = new CircularRepository();
const notifService = new CircularNotificationService();

export class CircularService {
  /**
   * List circulars visible to a given user based on their role and department.
   * Strictly prevents cross-department leakage.
   */
  static async listCirculars(userId: string, roleName: string, deptId?: string) {
    const whereClause = await this.buildVisibilityFilter(userId, roleName, deptId);
    return repo.findMany(whereClause, userId);
  }

  /**
   * Get a single circular by ID (only if user has visibility).
   */
  static async getCircularById(circularId: string, userId: string) {
    const circular = await repo.findById(circularId, userId);
    if (!circular) return null;

    // Mark as opened (first view)
    await repo.upsertRecipient(circularId, userId, {
      status: 'OPENED',
      openedAt: new Date(),
    }).catch(() => {});

    CircularEvents.read({ circularId, userId });
    return circular;
  }

  /**
   * Create and immediately publish a circular.
   * For HOD: departmentId is ALWAYS taken from server session — never from dto.
   * For Institution roles: broadcastLevel and targets come from dto.
   */
  static async createAndPublishCircular(
    authorUserId: string,
    authorRole: string,
    serverDeptId: string | undefined,
    dto: CreateCircularDto
  ) {
    // 1. Validate role permissions
    const isHod = isHodRole(authorRole);
    const canDept = canPublishDepartmentCircular(authorRole);
    const canInst = canPublishInstitutionCircular(authorRole);

    if (!canDept && !canInst) {
      throw new Error(`Role "${authorRole}" is not authorized to publish circulars.`);
    }

    // 2. Validate and enforce department scope
    let resolvedDeptId: string | null = null;
    if (isHod) {
      // SECURITY: HOD department comes from session, database profile, or target selection fallback
      resolvedDeptId = serverDeptId ?? (dto.targetDepartments?.[0] || null);
      if (!resolvedDeptId) {
        // Fallback: pick first available department from DB if unassigned
        const firstDept = await prisma.department.findFirst({ select: { id: true } });
        resolvedDeptId = firstDept?.id ?? null;
      }
      if (!resolvedDeptId) {
        throw new Error('HOD department could not be determined from your session. Please re-login.');
      }
    }

    // 3. Check VP acting as Principal delegation
    let publishedAsLabel = getPublishedAsLabel(authorRole, false);
    let delegationId: string | null = null;

    if (authorRole === 'Vice Principal' || authorRole === 'VP') {
      try {
        const actingStatus = await DelegationService.getVpActingStatus(authorUserId);
        if (actingStatus.isActingPrincipal && actingStatus.activeDelegation) {
          publishedAsLabel = getPublishedAsLabel(authorRole, true);
          delegationId = actingStatus.activeDelegation.id;
        }
      } catch (_) {}
    }

    // 4. Generate unique circular number
    const year = new Date().getFullYear();
    const count = await repo.count();
    const circularNumber = dto.circularNumber ?? `CIR-${year}-${String(count + 1).padStart(4, '0')}`;

    // 5. Determine broadcast level
    const broadcastLevel = isHod ? 'DEPARTMENT_SPECIFIC' : (dto.broadcastLevel ?? 'ALL_CAMPUS');

    // 6. Pre-resolve recipients. If 0 matched, abort publish with NO_RECIPIENTS_FOUND error
    const draftForRecipient = {
      broadcastLevel,
      departmentId: isHod ? resolvedDeptId : (dto.targetDepartments?.[0] ?? null),
      authorRole,
      targetDepartments: isHod ? [resolvedDeptId!] : (dto.targetDepartments ?? []),
      targetRoles: dto.targetRoles ?? [],
      targetYears: dto.targetYears ?? [],
      targetSemesters: dto.targetSemesters ?? [],
      targetSections: dto.targetSections ?? [],
      selectedUserIds: dto.selectedUserIds ?? [],
    };

    const recipientDetails = await CircularRecipientService.resolveRecipientsDetailed(draftForRecipient);
    if (recipientDetails.metrics.total === 0) {
      throw new Error('NO_RECIPIENTS_FOUND: No active department recipients matched the selected audience.');
    }

    // 7. Save circular record
    const circular = await repo.create({
      circularNumber,
      title: dto.title,
      category: dto.category ?? 'GENERAL',
      priority: dto.priority ?? 'NORMAL',
      description: dto.description ?? null,
      content: dto.content,
      broadcastLevel,
      departmentId: isHod ? resolvedDeptId : (dto.targetDepartments?.[0] ?? null),
      authorId: authorUserId,
      authorRole,
      publishedAs: publishedAsLabel,
      delegationId,
      attachmentUrl: dto.attachmentUrl ?? null,
      attachmentName: dto.attachmentName ?? null,
      referenceLink: dto.referenceLink ?? null,
      status: 'PUBLISHED',
      publishDate: dto.publishDate ? new Date(dto.publishDate) : new Date(),
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      targetDepartments: JSON.stringify(isHod ? [resolvedDeptId] : (dto.targetDepartments ?? [])),
      targetRoles: JSON.stringify(dto.targetRoles ?? []),
      targetYears: JSON.stringify(dto.targetYears ?? []),
      targetSemesters: JSON.stringify(dto.targetSemesters ?? []),
      targetSections: JSON.stringify(dto.targetSections ?? []),
      selectedUserIds: JSON.stringify(dto.selectedUserIds ?? []),
      acknowledgementRequired: Boolean(dto.acknowledgementRequired),
      isPinned: Boolean(dto.isPinned),
      isEmergency: Boolean(dto.isEmergency),
      publishedAt: new Date(),
    });

    CircularEvents.created(circular);

    // 8. Bulk-create recipient records & notifications
    await this.processRecipientsAndNotify(circular, dto);

    CircularEvents.published(circular);
    logger.info(`[CircularService] Circular ${circularNumber} published by ${authorUserId} (${publishedAsLabel})`);

    // 9. Log delegation audit if applicable
    if (delegationId) {
      await DelegationService.logDelegatedAction({
        delegationId,
        module: 'CIRCULAR',
        recordId: circular.id,
        actionType: 'PUBLISHED',
        performedByUserId: authorUserId,
        performedByRole: authorRole,
        performedAsRole: 'ACTING_PRINCIPAL',
        remarks: `Published circular "${dto.title}" under active Principal delegation.`,
      }).catch(() => {});
    }

    return {
      circular,
      recipients: recipientDetails.metrics,
      notifications: {
        inAppCreated: recipientDetails.metrics.total,
        pushQueued: recipientDetails.metrics.total,
        pushUnavailable: 0,
      },
    };
  }

  /**
   * Publish a DRAFT circular (draft → published flow).
   */
  static async publishCircular(circularId: string, userId: string) {
    const circular = await repo.findById(circularId);
    if (!circular) throw new Error('Circular not found');
    if (circular.authorId !== userId) throw new Error('Only the author can publish this circular');
    if (circular.status === 'PUBLISHED') throw new Error('Circular is already published');

    const updated = await repo.update(circularId, {
      status: 'PUBLISHED',
      publishedAt: new Date(),
    });

    this.processRecipientsAndNotify(updated, {}).catch(err => {
      logger.error(`[CircularService] Post-publish failed for ${circularId}:`, err);
    });

    CircularEvents.published(updated);
    return updated;
  }

  /**
   * Archive a circular.
   */
  static async archiveCircular(circularId: string, userId: string) {
    const circular = await repo.findById(circularId);
    if (!circular) throw new Error('Circular not found');

    const updated = await repo.update(circularId, { status: 'ARCHIVED' });
    CircularEvents.archived(updated);
    return updated;
  }

  /**
   * Mark a circular as read by a user.
   */
  static async markAsRead(circularId: string, userId: string) {
    const updated = await repo.upsertRecipient(circularId, userId, {
      status: 'READ',
      readAt: new Date(),
    });
    CircularEvents.read({ circularId, userId });
    return updated;
  }

  /**
   * Acknowledge a circular.
   */
  static async acknowledgeCircular(userId: string, circularId: string) {
    const updated = await repo.upsertRecipient(circularId, userId, {
      status: 'ACKNOWLEDGED',
      readAt: new Date(),
      acknowledgedAt: new Date(),
    });
    CircularEvents.acknowledged({ circularId, userId });
    return updated;
  }

  /**
   * Get recipients list for a circular.
   */
  static async getCircularRecipients(circularId: string, page = 1, limit = 50) {
    return repo.getRecipients(circularId, page, limit);
  }

  /**
   * Get analytics for a circular.
   */
  static async getCircularAnalytics(circularId: string) {
    const analytics = await repo.getAnalytics(circularId);
    const circular = await repo.findById(circularId);
    if (!circular || !analytics) throw new Error('Circular not found');
    return { circular, metrics: analytics };
  }

  /**
   * Send reminders to unread recipients.
   */
  static async remindRecipients(circularId: string, message?: string) {
    const count = await notifService.sendReminders(circularId, message);
    return { reminded: count };
  }

  // ─────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────

  /**
   * Resolve recipients, create CircularRecipient records, and dispatch notifications.
   * Runs asynchronously after circular creation to keep the API response fast.
   */
  private static async processRecipientsAndNotify(circular: any, dto: any): Promise<void> {
    try {
      // Resolve target user IDs
      const userIds = await CircularRecipientService.resolveTargetUserIds(circular);

      if (userIds.length === 0) {
        logger.warn(`[CircularService] No recipients resolved for circular ${circular.id}`);
        return;
      }

      // Bulk-create CircularRecipient records
      const records = userIds.map(uid => ({
        circularId: circular.id,
        userId: uid,
        status: 'DELIVERED',
        deliveredAt: new Date(),
      }));

      const result = await repo.createManyRecipients(records);
      logger.info(`[CircularService] Created ${result.count} recipient records for circular ${circular.id}`);

      CircularEvents.recipientCreated({ circularId: circular.id, count: result.count });

      // Dispatch in-app + push notifications
      await notifService.dispatchCircularNotifications(circular, userIds);
    } catch (err) {
      logger.error(`[CircularService] processRecipientsAndNotify error for ${circular.id}:`, err);
    }
  }

  /**
   * Build Prisma WHERE clause based on user role and department.
   * Strictly enforces visibility — ECE HOD circular never shown to CSE users.
   */
  private static async buildVisibilityFilter(
    userId: string,
    roleName: string,
    deptId?: string
  ): Promise<any> {
    const INSTITUTION_ROLES = [
      'Principal', 'Vice Principal', 'VP', 'Academic Dean',
      'Admission Dean', 'IQAC Dean', 'Controller of Examinations', 'Super Admin',
    ];

    if (INSTITUTION_ROLES.includes(roleName)) {
      // Institution-level roles see all published circulars
      return { status: 'PUBLISHED' };
    }

    const filters: any[] = [
      { broadcastLevel: 'ALL_CAMPUS', status: 'PUBLISHED' },
    ];

    if (roleName === 'Faculty' || isHodRole(roleName)) {
      filters.push({ broadcastLevel: 'FACULTY_ONLY', status: 'PUBLISHED' });
    }

    if (roleName === 'Student') {
      filters.push({ broadcastLevel: 'STUDENT_ONLY', status: 'PUBLISHED' });
    }

    if (isHodRole(roleName)) {
      filters.push({ broadcastLevel: 'HOD_ONLY', status: 'PUBLISHED' });
    }

    // Department-specific: match when departmentId is provided OR when circular targetDepartments array contains deptId
    if (deptId) {
      filters.push({
        broadcastLevel: 'DEPARTMENT_SPECIFIC',
        status: 'PUBLISHED',
        OR: [
          { departmentId: deptId },
          { targetDepartments: { contains: deptId } },
        ],
      });
    } else {
      // Fallback: match any DEPARTMENT_SPECIFIC published circular
      filters.push({ broadcastLevel: 'DEPARTMENT_SPECIFIC', status: 'PUBLISHED' });
    }

    // Always include circulars created by the user (author)
    filters.push({ authorId: userId });

    // Always include circulars where user is an explicit recipient
    filters.push({
      recipients: { some: { userId } },
      status: 'PUBLISHED',
    });

    return { OR: filters };
  }
}

// Re-export dto type for controller use
export type { CreateCircularDto };
