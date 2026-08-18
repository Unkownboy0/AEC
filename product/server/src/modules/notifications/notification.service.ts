import { prisma } from '../../lib/prisma';
import { NotFoundException } from '../../utils/exceptions';
import { PushDispatchService } from './push-dispatch.service';
import { RecipientResolverService } from './recipient-resolver.service';
import { NotificationPolicyService } from './notification-policy.service';
import { NotificationDeepLinkResolver } from './notification-deeplink.resolver';
import type { DomainEvent } from './domain-events.types';

export interface SendNotificationDto {
  recipientId: string;
  eventType: string;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  deepLinkRoute?: string;
  deliveryChannel?: 'IN_APP' | 'PUSH' | 'EMAIL' | 'SMS' | 'MULTI';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'URGENT';
}

export interface NotificationFilterOptions {
  page?: number;
  limit?: number;
  category?: string;
  isRead?: boolean;
  search?: string;
}

import { logger } from '../../utils/logger';

export class NotificationService {
  /**
   * CENTRAL PIPELINE: Dispatch a standardized Domain Event across the entire institution.
   * Resolves recipients, checks preferences, persists records, and fires background push.
   */
  static async dispatchDomainEvent(event: DomainEvent): Promise<{ dispatchedCount: number; recipientIds: string[] }> {
    return this.executeDispatch(event);
  }

  /**
   * Authoritative execution pipeline for all domain notifications.
   */
  public static async executeDispatch(event: DomainEvent): Promise<{ dispatchedCount: number; recipientIds: string[] }> {
    const correlationId = event.correlationId || `corr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const eventId = event.eventId || `evt-${Date.now()}`;

    try {
      // 1. Resolve exact affected user IDs (owning active device registrations)
      const recipientIds = await RecipientResolverService.resolveRecipients(event);
      if (!recipientIds || recipientIds.length === 0) {
        logger.info(
          `[NotificationEngine] [EVENT_SKIPPED: NO_RECIPIENTS] eventId=${eventId} eventType=${event.eventType} ` +
          `entityId=${event.entityId} correlationId=${correlationId}`
        );
        return { dispatchedCount: 0, recipientIds: [] };
      }

      const pushRecipients: string[] = [];
      const createdNotifications: any[] = [];

      // 2. Query recipient user roles for personalized deep link routing
      const recipientUsers = await prisma.user.findMany({
        where: { id: { in: recipientIds }, status: 'ACTIVE' },
        select: { id: true, role: { select: { name: true, roleCode: true } } },
      });
      const userRoleMap = new Map<string, string>();
      recipientUsers.forEach((u) => {
        userRoleMap.set(u.id, u.role?.name || u.role?.roleCode || '');
      });

      // 3. Process for each recipient with anti-spam, personalized deep links, and preferences
      for (const recipientId of recipientIds) {
        if (NotificationPolicyService.isDuplicateOrSpam(event, recipientId)) {
          logger.info(`[NotificationEngine] [SPAM_THROTTLED] recipientId=${recipientId} eventType=${event.eventType}`);
          continue;
        }

        const channels = await NotificationPolicyService.resolveChannelsForUser(recipientId, event);
        const userRole = userRoleMap.get(recipientId);
        const resolvedDeepLink = NotificationDeepLinkResolver.resolve(event, userRole);

        if (channels.inApp) {
          try {
            const notif = await prisma.notification.create({
              data: {
                recipientId,
                eventType: event.eventType,
                title: event.title,
                message: event.body,
                relatedEntityType: event.entityType || null,
                relatedEntityId: event.entityId || null,
                deepLinkRoute: resolvedDeepLink || event.deepLinkRoute || null,
                deliveryChannel: channels.push ? 'PUSH' : 'IN_APP',
                deliveryState: 'DELIVERED',
              },
            });
            createdNotifications.push(notif);
          } catch (dbErr) {
            logger.warn(`[NotificationEngine] In-app record creation failed for recipient ${recipientId}:`, dbErr);
          }
        }

        if (channels.push) {
          pushRecipients.push(recipientId);
        }
      }

      // 3. Dispatch background FCM push notifications
      let pushResult: { totalUsers: number; totalDevices: number; deliveredCount: number; failedCount: number; skipReason?: string } = {
        totalUsers: 0,
        totalDevices: 0,
        deliveredCount: 0,
        failedCount: 0,
        skipReason: 'NO_PUSH_RECIPIENTS',
      };
      if (pushRecipients.length > 0) {
        const isHighOrCritical = event.priority === 'CRITICAL' || event.priority === 'HIGH' || event.eventType.includes('EMERGENCY');
        pushResult = await PushDispatchService.sendToUsers(pushRecipients, {
          title: event.title,
          body: event.body,
          channelId: 'campusos_alerts',
          priority: isHighOrCritical ? 'high' : 'normal',
          data: {
            eventType: event.eventType,
            entityType: event.entityType || '',
            entityId: event.entityId || '',
            relatedEntityId: event.entityId || '',
            deepLinkRoute: event.deepLinkRoute || '',
            priority: event.priority || 'NORMAL',
            correlationId,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Central Diagnostic Structured Logging
      logger.info(
        `[Notify] event=${event.eventType} requestId=${event.entityId} recipientUserCount=${recipientIds.length} ` +
        `deviceCount=${pushResult.totalDevices} pushQueued=${pushResult.totalDevices > 0}`
      );

      logger.info(
        `[Push] provider=FCM successCount=${pushResult.deliveredCount} failureCount=${pushResult.failedCount} ` +
        `skipReason=${pushResult.skipReason || 'NONE'}`
      );

      logger.info(
        `[NotificationEngine] [EVENT_DISPATCH_COMPLETE] eventId=${eventId} eventType=${event.eventType} ` +
        `entityId=${event.entityId} recipientCount=${recipientIds.length} inAppCount=${createdNotifications.length} ` +
        `pushDeviceCount=${pushResult.totalDevices} pushDelivered=${pushResult.deliveredCount} ` +
        `pushFailed=${pushResult.failedCount} skipReason=${pushResult.skipReason || 'NONE'} correlationId=${correlationId}`
      );

      // 4. Audit Log for Critical and High priority events (safe insertion)
      if (event.actorUserId && (event.priority === 'CRITICAL' || event.priority === 'HIGH')) {
        try {
          const userExists = await prisma.user.findUnique({ where: { id: event.actorUserId }, select: { id: true } });
          if (userExists) {
            await prisma.userActivityLog.create({
              data: {
                userId: event.actorUserId,
                action: 'EVENT_DISPATCH',
                module: 'NOTIFICATION',
                description: `[${event.eventType}] Dispatched to ${recipientIds.length} recipient(s): ${event.title}`,
              },
            }).catch(() => null);
          }
        } catch (_) {}
      }

      return {
        dispatchedCount: createdNotifications.length,
        recipientIds,
      };
    } catch (error) {
      logger.error(`[NotificationEngine] Fatal dispatch error for ${event.eventType}:`, error);
      return { dispatchedCount: 0, recipientIds: [] };
    }
  }

  /**
   * Single notification helper wired to standard delivery engine.
   */
  static async sendNotification(dto: SendNotificationDto) {
    try {
      const isCritical = dto.priority === 'CRITICAL' || dto.priority === 'URGENT' || dto.eventType.includes('EMERGENCY') || dto.eventType.includes('SOS');

      // Check user preferences
      const pref = await prisma.notificationPreference.findUnique({
        where: { userId: dto.recipientId },
      });

      const allowInApp = isCritical || !pref || pref.inAppEnabled;
      const allowPush = isCritical || (pref ? pref.pushEnabled : true);
      const allowEmail = isCritical || (pref ? pref.emailEnabled : false) || dto.deliveryChannel === 'EMAIL';

      if (!allowInApp && !allowPush && !allowEmail && dto.deliveryChannel !== 'MULTI') {
        return null;
      }

      const primaryChannel = dto.deliveryChannel && dto.deliveryChannel !== 'MULTI'
        ? dto.deliveryChannel
        : allowPush ? 'PUSH' : allowEmail ? 'EMAIL' : 'IN_APP';

      const notification = await prisma.notification.create({
        data: {
          recipientId: dto.recipientId,
          eventType: dto.eventType,
          title: dto.title,
          message: dto.message,
          relatedEntityType: dto.relatedEntityType || null,
          relatedEntityId: dto.relatedEntityId || null,
          deepLinkRoute: dto.deepLinkRoute || null,
          deliveryChannel: primaryChannel,
          deliveryState: 'DELIVERED',
        },
      });

      // Dispatch push notification if push channel is allowed
      if (allowPush) {
        PushDispatchService.sendToUsers([dto.recipientId], {
          title: dto.title,
          body: dto.message,
          channelId: 'campusos_alerts',
          priority: isCritical ? 'high' : 'normal',
          data: {
            eventType: dto.eventType,
            entityType: dto.relatedEntityType || '',
            entityId: dto.relatedEntityId || '',
            relatedEntityId: dto.relatedEntityId || '',
            deepLinkRoute: dto.deepLinkRoute || '',
            priority: dto.priority || 'NORMAL',
            timestamp: new Date().toISOString(),
          },
        }).catch((err) => logger.error('[PushDispatch] Push dispatch error:', err));
      }

      return notification;
    } catch (error) {
      logger.error('Notification delivery error:', error);
      return null;
    }
  }

  /**
   * Get paginated notifications for logged in user with category & text search filtering.
   */
  static async getUserNotifications(userId: string, options: NotificationFilterOptions = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { recipientId: userId };

    if (typeof options.isRead === 'boolean') {
      where.isRead = options.isRead;
    }

    if (options.category && options.category !== 'ALL') {
      const cat = options.category.toUpperCase();
      if (cat === 'APPROVALS') {
        where.eventType = {
          in: [
            'LEAVE_REQUESTED',
            'LEAVE_SUBMITTED',
            'LEAVE_FORWARDED',
            'OD_REQUESTED',
            'OD_SUBMITTED',
            'OD_FORWARDED',
            'FACULTY_LEAVE_SUBMITTED',
            'FACULTY_LEAVE_RECOMMENDED',
            'FACULTY_LEAVE_FORWARDED',
            'FACULTY_OD_SUBMITTED',
            'FACULTY_OD_RECOMMENDED',
            'PURCHASE_REQUEST_CREATED',
            'REFUND_APPROVAL_REQUIRED',
            'ESCALATED_APPROVAL',
            'GOVERNANCE_APPROVAL_REQUIRED',
          ],
        };
      } else if (cat === 'TASKS') {
        where.eventType = {
          in: [
            'TASK_ASSIGNED',
            'TASK_UPDATED',
            'TASK_SUBMITTED',
            'TASK_COMPLETED',
            'TASK_RETURNED',
            'TASK_OVERDUE',
            'DEPARTMENT_TASK_ASSIGNED',
            'PRINCIPAL_TASK_UPDATED',
          ],
        };
      } else if (cat === 'ACADEMIC') {
        where.eventType = {
          in: [
            'ASSIGNMENT_PUBLISHED',
            'ASSIGNMENT_GRADED',
            'ATTENDANCE_MARKED',
            'ATTENDANCE_SHORTAGE',
            'TIMETABLE_CHANGED',
            'CLASS_TIMETABLE_CHANGED',
            'SUBSTITUTION_ASSIGNED',
            'CLASS_SUBSTITUTION_ASSIGNED',
          ],
        };
      } else if (cat === 'FEES' || cat === 'FINANCE') {
        where.eventType = {
          in: [
            'FEE_DUE',
            'PAYMENT_SUCCESS',
            'PAYMENT_FAILED',
            'RECEIPT_GENERATED',
            'SCHOLARSHIP_UPDATE',
            'PAYMENT_ACTION_REQUIRED',
            'FEE_REFUND_REQUESTED',
          ],
        };
      } else if (cat === 'EXAMS') {
        where.eventType = {
          in: [
            'EXAM_TIMETABLE_PUBLISHED',
            'HALL_ALLOCATION_PUBLISHED',
            'RESULT_PUBLISHED',
            'EXAM_RESULT_PUBLISHED',
            'MARKS_PUBLISHED',
            'REVALUATION_REQUESTED',
            'REVALUATION_UPDATE',
          ],
        };
      } else if (cat === 'CIRCULARS') {
        where.eventType = {
          in: [
            'CIRCULAR_PUBLISHED',
            'EMERGENCY_CIRCULAR',
            'CIRCULAR_REMINDER',
            'SECTION_CIRCULAR',
            'EMERGENCY_NOTICE',
          ],
        };
      } else if (cat === 'COMPLAINTS') {
        where.eventType = {
          in: [
            'COMPLAINT_SUBMITTED',
            'ACADEMIC_COMPLAINT_SUBMITTED',
            'ADMINISTRATIVE_COMPLAINT',
            'COMPLAINT_RESOLVED',
            'GRIEVANCE_CREATED',
          ],
        };
      } else if (cat === 'HOSTEL') {
        where.eventType = {
          in: [
            'HOSTEL_ROOM_ALLOCATED',
            'HOSTEL_OUTING_REQUEST',
            'HOSTEL_OUTING_APPROVED',
            'HOSTEL_OUTING_REJECTED',
            'HOSTEL_MESS_NOTICE',
            'HOSTEL_COMPLAINT_SUBMITTED',
          ],
        };
      } else if (cat === 'TRANSPORT') {
        where.eventType = {
          in: [
            'TRANSPORT_ROUTE_ALLOCATED',
            'TRANSPORT_BUS_DELAY',
            'BUS_BREAKDOWN_ALERT',
            'ROUTE_STOP_CHANGE_REQUEST',
            'TRANSPORT_COMPLAINT_SUBMITTED',
          ],
        };
      } else if (cat === 'LIBRARY') {
        where.eventType = {
          in: [
            'LIBRARY_BOOK_ISSUED',
            'LIBRARY_BOOK_RETURNED',
            'LIBRARY_BOOK_OVERDUE',
            'LIBRARY_FINE_GENERATED',
            'BOOK_RESERVATION_REQUEST',
          ],
        };
      } else if (cat === 'PLACEMENT') {
        where.eventType = {
          in: [
            'PLACEMENT_JOB_POSTED',
            'COMPANY_JOB_POSTED',
            'PLACEMENT_DRIVE_SCHEDULED',
            'STUDENT_JOB_APPLIED',
            'INTERVIEW_ROUND_SCHEDULED',
            'PLACEMENT_OFFER_RECEIVED',
          ],
        };
      } else if (cat === 'IQAC') {
        where.eventType = {
          in: [
            'EVIDENCE_SUBMITTED',
            'EVIDENCE_RETURNED',
            'EVIDENCE_MISSING',
            'ACCREDITATION_TASK',
            'APPRAISAL_SUBMITTED',
            'NAAC_NBA_DEADLINE',
          ],
        };
      } else if (cat === 'CRITICAL' || cat === 'EMERGENCY') {
        where.eventType = {
          in: ['EMERGENCY_ALERT', 'SECURITY_ALERT', 'CAMPUS_ANNOUNCEMENT', 'MAJOR_INCIDENT_ALERT'],
        };
      }
    }

    if (options.search && options.search.trim()) {
      where.OR = [
        { title: { contains: options.search.trim(), mode: 'insensitive' } },
        { message: { contains: options.search.trim(), mode: 'insensitive' } },
      ];
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { recipientId: userId, isRead: false } }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    };
  }

  /**
   * Get unread notifications count.
   */
  static async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });
    return { unreadCount: count };
  }

  /**
   * Mark a notification as read.
   */
  static async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, recipientId: userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * Acknowledge a notification.
   */
  static async acknowledgeNotification(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, recipientId: userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: notification.readAt || new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read.
   */
  static async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  static async clearOne(notificationId: string, userId: string) {
    const result = await prisma.notification.deleteMany({ where: { id: notificationId, recipientId: userId } });
    if (result.count === 0) throw new NotFoundException('Notification not found');
  }

  static async clearAll(userId: string) {
    const result = await prisma.notification.deleteMany({ where: { recipientId: userId } });
    return { cleared: result.count };
  }

  /**
   * Register or update device token for push notifications.
   * Ensures token uniqueness and safe user reassignment on shared physical devices.
   */
  static async registerDeviceToken(
    userId: string,
    token: string,
    platform: string,
    deviceId: string,
    appVersion?: string
  ) {
    if (!token || !userId) {
      throw new Error('Token and userId are required for device registration');
    }

    const normPlatform = (platform || 'ANDROID').toUpperCase();
    const effectiveDeviceId = deviceId || `dev-${token.slice(0, 16)}`;

    // If another user was previously registered on this physical device, deactivate their stale records
    if (deviceId) {
      await prisma.deviceToken.updateMany({
        where: {
          deviceId,
          userId: { not: userId },
          active: true,
        },
        data: { active: false },
      }).catch(() => {});
    }

    // Reassign token to this user and activate
    return prisma.deviceToken.upsert({
      where: { token },
      update: {
        userId,
        platform: normPlatform,
        deviceId: effectiveDeviceId,
        appVersion: appVersion || '1.0.2',
        active: true,
        lastUsedAt: new Date(),
      },
      create: {
        userId,
        token,
        platform: normPlatform,
        deviceId: effectiveDeviceId,
        appVersion: appVersion || '1.0.2',
        active: true,
      },
    });
  }

  /**
   * Get notification preferences for user.
   */
  static async getPreferences(userId: string) {
    let pref = await prisma.notificationPreference.findUnique({
      where: { userId },
    });
    if (!pref) {
      pref = await prisma.notificationPreference.create({
        data: { userId, inAppEnabled: true, emailEnabled: true, pushEnabled: true },
      });
    }
    return pref;
  }

  /**
   * Update notification preferences for user.
   */
  static async updatePreferences(userId: string, data: { inAppEnabled?: boolean; emailEnabled?: boolean; pushEnabled?: boolean; taskAlerts?: boolean; messageAlerts?: boolean; academicAlerts?: boolean }) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }
}
