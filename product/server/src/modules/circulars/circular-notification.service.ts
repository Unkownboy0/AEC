import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { NotificationService } from '../notifications/notification.service';
import { CircularRepository } from './circular.repository';

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
   * Dispatch all notifications after a circular is published via central NotificationEngine.
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
    const deepLinkRoute = `/circulars/${circular.id}`;
    const eventType = circular.isEmergency ? 'EMERGENCY_CIRCULAR' : 'CIRCULAR_PUBLISHED';

    logger.info(`[CircularNotification] Dispatching domain event ${eventType} to ${recipientUserIds.length} users for circular ${circular.id}`);

    await NotificationService.dispatchDomainEvent({
      eventType,
      actorUserId: circular.authorId,
      entityType: 'CIRCULAR',
      entityId: circular.id,
      title: notifTitle,
      body: notifBody,
      priority: circular.isEmergency ? 'CRITICAL' : circular.priority === 'HIGH' || circular.priority === 'URGENT' ? 'HIGH' : 'NORMAL',
      category: 'CIRCULARS',
      deepLinkRoute,
      targetUserIds: recipientUserIds,
      departmentId: circular.departmentId,
      metadata: {
        circularId: circular.id,
        circularTitle: circular.title,
        publisherName,
        publisherRole: circular.publishedAs ?? circular.authorRole ?? '',
        publishedAt: (circular.publishedAt ?? new Date()).toISOString(),
      },
    });
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

    const userIds = unreadRecipients.map((r: any) => r.userId).filter(Boolean);
    if (userIds.length === 0) return 0;

    const circular = await this.repo.findById(circularId);
    if (!circular) return 0;

    await NotificationService.dispatchDomainEvent({
      eventType: 'CIRCULAR_REMINDER',
      actorUserId: circular.authorId,
      entityType: 'CIRCULAR',
      entityId: circularId,
      title: '📋 Circular Reminder',
      body: customMessage ?? `Please read and acknowledge: "${circular.title}"`,
      priority: 'NORMAL',
      category: 'CIRCULARS',
      deepLinkRoute: `/circulars/${circularId}`,
      targetUserIds: userIds,
      metadata: {
        circularId,
        circularTitle: circular.title,
      },
    });

    return userIds.length;
  }
}
