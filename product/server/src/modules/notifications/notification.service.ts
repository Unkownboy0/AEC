import { prisma } from '../../lib/prisma';
import { NotFoundException } from '../../utils/exceptions';
import { PushDispatchService } from './push-dispatch.service';
import { RecipientResolverService } from './recipient-resolver.service';
import { NotificationPolicyService } from './notification-policy.service';
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

      // 2. Process for each recipient with anti-spam and preferences
      for (const recipientId of recipientIds) {
        if (NotificationPolicyService.isDuplicateOrSpam(event, recipientId)) {
          logger.info(`[NotificationEngine] [SPAM_THROTTLED] recipientId=${recipientId} eventType=${event.eventType}`);
          continue;
        }

        const channels = await NotificationPolicyService.resolveChannelsForUser(recipientId, event);

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
                deepLinkRoute: event.deepLinkRoute || null,
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
        where.eventType = { in: ['LEAVE_REQUESTED', 'LEAVE_FORWARDED', 'OD_REQUESTED', 'PURCHASE_REQUEST_CREATED'] };
      } else if (cat === 'TASKS') {
        where.eventType = { in: ['TASK_ASSIGNED', 'TASK_UPDATED', 'TASK_SUBMITTED', 'TASK_COMPLETED'] };
      } else if (cat === 'ACADEMIC') {
        where.eventType = { in: ['ASSIGNMENT_PUBLISHED', 'ATTENDANCE_MARKED', 'ATTENDANCE_SHORTAGE', 'TIMETABLE_CHANGED'] };
      } else if (cat === 'FEES') {
        where.eventType = { in: ['FEE_DUE', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'RECEIPT_GENERATED'] };
      } else if (cat === 'EXAMS') {
        where.eventType = { in: ['EXAM_TIMETABLE_PUBLISHED', 'HALL_ALLOCATION_PUBLISHED', 'RESULT_PUBLISHED'] };
      } else if (cat === 'CRITICAL') {
        where.eventType = { in: ['EMERGENCY_ALERT', 'SECURITY_ALERT', 'CAMPUS_ANNOUNCEMENT'] };
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
   */
  static async registerDeviceToken(userId: string, token: string, platform: string, deviceId: string) {
    return prisma.deviceToken.upsert({
      where: { token },
      update: {
        userId,
        platform,
        deviceId,
        active: true,
        lastUsedAt: new Date(),
      },
      create: {
        userId,
        token,
        platform,
        deviceId,
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
