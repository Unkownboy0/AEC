import { prisma } from '../../lib/prisma';
import { NotFoundException } from '../../utils/exceptions';
import { PushDispatchService } from './push-dispatch.service';

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

export class NotificationService {
  /**
   * Send & persist notification in DB with intelligent multi-channel routing
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
          data: {
            eventType: dto.eventType,
            relatedEntityId: dto.relatedEntityId || '',
            deepLinkRoute: dto.deepLinkRoute || '',
            priority: dto.priority || 'NORMAL',
          },
        }).catch((err) => console.error('[PushDispatch] Push dispatch error:', err));
      }

      return notification;
    } catch (error) {
      console.error('Notification delivery error:', error);
      return null;
    }
  }

  /**
   * Get paginated notifications for logged in user
   */
  static async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { recipientId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { recipientId: userId } }),
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
   * Get unread notifications count
   */
  static async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });
    return { unreadCount: count };
  }

  /**
   * Mark a notification as read
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
   * Mark all notifications as read
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
   * Register or update device token for push notifications
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
   * Get notification preferences for user
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
   * Update notification preferences for user
   */
  static async updatePreferences(userId: string, data: { inAppEnabled?: boolean; emailEnabled?: boolean; pushEnabled?: boolean; taskAlerts?: boolean; messageAlerts?: boolean; academicAlerts?: boolean }) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }
}
