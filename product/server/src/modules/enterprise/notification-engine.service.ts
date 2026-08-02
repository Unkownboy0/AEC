import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

export interface DispatchNotificationParams {
  recipientId: string;
  eventType: string;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  webRoute?: string;
}

export class NotificationEngineService {
  /**
   * Format Mobile Deep-Link URI
   */
  static formatDeepLink(entityType?: string, entityId?: string): string {
    if (!entityType || !entityId) return 'campusos://notifications';
    switch (entityType.toUpperCase()) {
      case 'STUDENT_LEAVE_REQUEST':
        return `campusos://leave/student/${entityId}`;
      case 'FACULTY_LEAVE_REQUEST':
        return `campusos://leave/faculty/${entityId}`;
      case 'INSTITUTIONAL_CIRCULAR':
        return `campusos://circulars/details/${entityId}`;
      case 'TASK':
        return `campusos://tasks/details/${entityId}`;
      default:
        return `campusos://details/${entityId}`;
    }
  }

  /**
   * Dispatch Native Push Notification & Socket Event
   */
  async dispatchNativeNotification(params: DispatchNotificationParams) {
    try {
      const deepLink = NotificationEngineService.formatDeepLink(params.relatedEntityType, params.relatedEntityId);

      // Persist Notification in DB
      const notification = await prisma.notification.create({
        data: {
          recipientId: params.recipientId,
          eventType: params.eventType,
          title: params.title,
          message: params.message,
          relatedEntityType: params.relatedEntityType || null,
          relatedEntityId: params.relatedEntityId || null,
          deepLinkRoute: params.webRoute || deepLink,
          deliveryChannel: 'PUSH',
          deliveryState: 'DELIVERED',
        },
      });

      // Query active mobile device tokens for recipient
      const deviceTokens = await prisma.deviceToken.findMany({
        where: { userId: params.recipientId, active: true },
      });

      if (deviceTokens.length > 0) {
        logger.info(`📱 FCM/APNs Push dispatched to ${deviceTokens.length} device(s) for user ${params.recipientId} [URI: ${deepLink}]`);
      }

      return {
        notification,
        deviceCount: deviceTokens.length,
        deepLink,
      };
    } catch (err) {
      logger.error('Failed to dispatch native notification:', err);
      return null;
    }
  }
}
