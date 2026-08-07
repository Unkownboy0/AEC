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
  deliveryChannel?: 'IN_APP' | 'PUSH' | 'EMAIL';
}

export class NotificationService {
  /**
   * Send & persist notification in DB and trigger provider adapters
   */
  static async sendNotification(dto: SendNotificationDto) {
    try {
      // Check user preferences
      const pref = await prisma.notificationPreference.findUnique({
        where: { userId: dto.recipientId },
      });

      if (pref && !pref.inAppEnabled && dto.deliveryChannel === 'IN_APP') {
        return null;
      }

      const notification = await prisma.notification.create({
        data: {
          recipientId: dto.recipientId,
          eventType: dto.eventType,
          title: dto.title,
          message: dto.message,
          relatedEntityType: dto.relatedEntityType || null,
          relatedEntityId: dto.relatedEntityId || null,
          deepLinkRoute: dto.deepLinkRoute || null,
          deliveryChannel: dto.deliveryChannel || 'IN_APP',
          deliveryState: 'DELIVERED',
        },
      });

      // Dispatch push notification to user's registered device tokens
      PushDispatchService.sendToUsers([dto.recipientId], {
        title: dto.title,
        body: dto.message,
        data: {
          eventType: dto.eventType,
          relatedEntityId: dto.relatedEntityId || '',
          deepLinkRoute: dto.deepLinkRoute || '',
        },
      }).catch((err) => console.error('[PushDispatch] Push dispatch error:', err));

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
}
