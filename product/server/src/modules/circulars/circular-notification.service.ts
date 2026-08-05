import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { PushDispatchService } from '../notifications/push-dispatch.service';
import { CircularRepository } from './circular.repository';

/**
 * Maps publisher role to a deep-link prefix.
 */
const ROLE_DEEP_LINK_PREFIX: Record<string, string> = {
  HOD: '/hod/circulars',
  'Head of Department': '/hod/circulars',
  Principal: '/principal/circulars',
  'Vice Principal': '/vp/circulars',
  VP: '/vp/circulars',
  'Academic Dean': '/academic-dean/circulars',
  'Admission Dean': '/admission-dean/circulars',
  'IQAC Dean': '/iqac/circulars',
  Faculty: '/faculty/circulars',
  Student: '/student/circulars',
  default: '/circulars',
};

/**
 * Maps recipient role to their circular viewing route.
 */
function getDeepLinkForRecipient(recipientRole: string, circularId: string): string {
  const prefix = ROLE_DEEP_LINK_PREFIX[recipientRole] ?? ROLE_DEEP_LINK_PREFIX.default;
  return `${prefix}/${circularId}`;
}

/**
 * Build native notification title.
 */
function buildNotificationTitle(circular: any): string {
  if (circular.isEmergency) return '🚨 Emergency Circular';
  const role = circular.publishedAs ?? circular.authorRole ?? '';
  if (role.includes('HOD') || role.includes('Head of Department')) return 'New Department Circular';
  if (role === 'Principal') return 'New Institution Circular';
  if (role.includes('Dean')) return 'New Academic Circular';
  if (role.includes('Vice Principal') || role === 'VP') return 'New Notice';
  return 'New Circular';
}

/**
 * Build native notification body.
 */
function buildNotificationBody(circular: any, publisherName: string): string {
  const role = circular.publishedAs ?? circular.authorRole ?? 'Administrator';
  return `${publisherName} (${role}) published "${circular.title}". Tap to view.`;
}

export class CircularNotificationService {
  private repo = new CircularRepository();

  /**
   * Dispatch all notifications after a circular is published.
   * 1. Creates in-app Notification records in bulk.
   * 2. Sends native push via Expo Push API.
   * 3. Updates CircularRecipient status to DELIVERED.
   */
  async dispatchCircularNotifications(
    circular: any,
    recipientUserIds: string[]
  ): Promise<void> {
    if (recipientUserIds.length === 0) return;

    // Resolve publisher name
    const publisher = await prisma.user.findUnique({
      where: { id: circular.authorId },
      select: { firstName: true, lastName: true },
    });
    const publisherName = publisher
      ? `${publisher.firstName} ${publisher.lastName}`
      : circular.publishedAs ?? 'Administrator';

    const notifTitle = buildNotificationTitle(circular);
    const notifBody = buildNotificationBody(circular, publisherName);
    const webDeepLink = `/circulars/${circular.id}`;

    // 1. Bulk create in-app notifications (skip if already exists)
    const notifData = recipientUserIds.map(uid => ({
      recipientId: uid,
      eventType: circular.isEmergency ? 'EMERGENCY_CIRCULAR' : 'CIRCULAR_PUBLISHED',
      title: notifTitle,
      message: notifBody,
      relatedEntityType: 'Circular',
      relatedEntityId: circular.id,
      deepLinkRoute: webDeepLink,
      deliveryChannel: 'IN_APP',
      deliveryState: 'DELIVERED',
    }));

    // Chunk in-app notifications to avoid DB timeout
    const CHUNK_SIZE = 200;
    for (let i = 0; i < notifData.length; i += CHUNK_SIZE) {
      const chunk = notifData.slice(i, i + CHUNK_SIZE);
      await prisma.notification.createMany({
        data: chunk as any[],
        skipDuplicates: true,
      }).catch(err => logger.warn('[CircularNotification] In-app notif chunk failed:', err));
    }

    logger.info(`[CircularNotification] Created ${recipientUserIds.length} in-app notifications for circular ${circular.id}`);

    // 2. Send native push notifications
    await PushDispatchService.sendToUsers(recipientUserIds, {
      title: notifTitle,
      body: notifBody,
      sound: 'default',
      priority: circular.isEmergency ? 'high' : 'default',
      channelId: circular.isEmergency ? 'emergency' : 'circulars',
      data: {
        type: 'CIRCULAR',
        circularId: circular.id,
        circularTitle: circular.title,
        category: circular.category ?? 'GENERAL',
        priority: circular.priority ?? 'NORMAL',
        publisherName,
        publisherRole: circular.publishedAs ?? circular.authorRole ?? '',
        publishedAt: (circular.publishedAt ?? new Date()).toISOString(),
        deepLink: webDeepLink,
        // Native deep-link scheme (campusos://...)
        nativeDeepLink: `campusos:/${webDeepLink}`,
      },
    });

    logger.info(`[CircularNotification] Push dispatch completed for ${recipientUserIds.length} users`);
  }

  /**
   * Send a reminder notification to unread recipients.
   */
  async sendReminders(circularId: string, customMessage?: string): Promise<number> {
    const unreadRecipients = await (prisma as any).circularRecipient.findMany({
      where: {
        circularId,
        readAt: null,
        acknowledgedAt: null,
      },
      select: { userId: true },
    });

    const userIds = unreadRecipients.map((r: any) => r.userId);
    if (userIds.length === 0) return 0;

    const circular = await this.repo.findById(circularId);
    if (!circular) return 0;

    await PushDispatchService.sendToUsers(userIds, {
      title: '📋 Circular Reminder',
      body: customMessage ?? `Please read and acknowledge: "${circular.title}"`,
      priority: 'normal',
      channelId: 'circulars',
      data: {
        type: 'CIRCULAR_REMINDER',
        circularId,
        deepLink: `/circulars/${circularId}`,
        nativeDeepLink: `campusos://circulars/${circularId}`,
      },
    });

    return userIds.length;
  }
}
