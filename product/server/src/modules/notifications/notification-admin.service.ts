import { prisma } from '../../lib/prisma';
import { PushDispatchService } from './push-dispatch.service';
import { NotificationService } from './notification.service';

export interface TestPushParams {
  userId?: string;
  roleCode?: string;
  title: string;
  body: string;
  channel?: 'PUSH' | 'IN_APP' | 'MULTI';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  deepLinkRoute?: string;
}

export class NotificationAdminService {
  /**
   * Super Admin health dashboard metrics.
   */
  public static async getHealthDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalNotificationsToday,
      activeTokensCount,
      deviceBreakdown,
      recentFailures,
      totalUnread,
    ] = await Promise.all([
      prisma.notification.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.deviceToken.count({
        where: { active: true },
      }),
      prisma.deviceToken.groupBy({
        by: ['platform'],
        where: { active: true },
        _count: { id: true },
      }),
      prisma.notification.findMany({
        where: { deliveryState: 'FAILED' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.notification.count({
        where: { isRead: false },
      }),
    ]);

    const platformCounts: Record<string, number> = {
      android: 0,
      ios: 0,
      web: 0,
    };

    deviceBreakdown.forEach((b) => {
      const plat = (b.platform || '').toLowerCase();
      platformCounts[plat] = (platformCounts[plat] || 0) + b._count.id;
    });

    return {
      fcmStatus: 'HEALTHY_ACTIVE',
      projectId: 'campusos-db831',
      activeTokensCount,
      platformCounts,
      totalNotificationsToday,
      totalUnread,
      recentFailures,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Controlled diagnostic tool: Send test notification to specific User or Role.
   */
  public static async sendTestPush(params: TestPushParams, actorUserId: string) {
    let targetUserIds: string[] = [];

    if (params.userId) {
      targetUserIds = [params.userId];
    } else if (params.roleCode) {
      const users = await prisma.user.findMany({
        where: {
          role: { roleCode: params.roleCode },
          status: 'ACTIVE',
        },
        select: { id: true },
      });
      targetUserIds = users.map((u) => u.id);
    }

    if (targetUserIds.length === 0) {
      return { success: false, message: 'No active target users found.' };
    }

    const result = await NotificationService.dispatchDomainEvent({
      eventType: 'CAMPUS_ANNOUNCEMENT',
      actorUserId,
      entityType: 'DIAGNOSTIC_TEST',
      entityId: `TEST-${Date.now()}`,
      title: params.title || '🔔 CampusOS Test Alert',
      body: params.body || 'Controlled push dispatch test from Notification Control Centre.',
      priority: params.priority || 'HIGH',
      category: 'ADMINISTRATIVE',
      deepLinkRoute: params.deepLinkRoute || '/notifications',
      targetUserIds,
    });

    return {
      success: true,
      dispatchedCount: result.dispatchedCount,
      targetUserIds: result.recipientIds,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Super Admin Live Delivery Logs Monitor with filters and pagination.
   */
  public static async getDeliveryLogs(options: {
    page?: number;
    limit?: number;
    eventType?: string;
    deliveryState?: string;
    search?: string;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 25));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.eventType && options.eventType !== 'ALL') {
      where.eventType = options.eventType;
    }
    if (options.deliveryState && options.deliveryState !== 'ALL') {
      where.deliveryState = options.deliveryState;
    }
    if (options.search && options.search.trim()) {
      where.OR = [
        { title: { contains: options.search.trim(), mode: 'insensitive' } },
        { message: { contains: options.search.trim(), mode: 'insensitive' } },
        { recipient: { email: { contains: options.search.trim(), mode: 'insensitive' } } },
        { recipient: { firstName: { contains: options.search.trim(), mode: 'insensitive' } } },
        { recipient: { lastName: { contains: options.search.trim(), mode: 'insensitive' } } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          recipient: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: { select: { name: true, roleCode: true } },
              deviceTokens: {
                where: { active: true },
                select: { id: true, platform: true, lastUsedAt: true },
              },
            },
          },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    const formattedLogs = logs.map((n) => ({
      id: n.id,
      eventType: n.eventType,
      title: n.title,
      message: n.message,
      relatedEntityType: n.relatedEntityType,
      relatedEntityId: n.relatedEntityId,
      deepLinkRoute: n.deepLinkRoute,
      deliveryChannel: n.deliveryChannel,
      deliveryState: n.deliveryState,
      retryCount: n.retryCount,
      isRead: n.isRead,
      createdAt: n.createdAt,
      recipient: {
        id: n.recipient?.id,
        email: n.recipient?.email,
        name: `${n.recipient?.firstName || ''} ${n.recipient?.lastName || ''}`.trim(),
        role: n.recipient?.role?.name || 'User',
        activeDevices: n.recipient?.deviceTokens?.length || 0,
        platforms: n.recipient?.deviceTokens?.map((d) => d.platform) || [],
      },
    }));

    return {
      data: formattedLogs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Super Admin Retry Delivery for a specific notification.
   */
  public static async retryDelivery(notificationId: string) {
    const notif = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        recipient: {
          include: {
            deviceTokens: { where: { active: true } },
          },
        },
      },
    });

    if (!notif) {
      throw new Error('Notification record not found');
    }

    const recipientUserId = notif.recipientId;
    const isPushAllowed = notif.deliveryChannel === 'PUSH' || notif.deliveryChannel === 'MULTI';

    let pushResult = null;
    if (isPushAllowed && notif.recipient?.deviceTokens?.length) {
      pushResult = await PushDispatchService.sendToUsers([recipientUserId], {
        title: notif.title,
        body: notif.message,
        channelId: 'campusos_alerts',
        priority: 'high',
        data: {
          eventType: notif.eventType,
          entityType: notif.relatedEntityType || '',
          entityId: notif.relatedEntityId || '',
          deepLinkRoute: notif.deepLinkRoute || '',
          priority: 'HIGH',
          isRetry: 'true',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        deliveryState: pushResult && pushResult.deliveredCount > 0 ? 'DELIVERED' : notif.deliveryState,
        retryCount: (notif.retryCount || 0) + 1,
      },
    });

    return {
      success: true,
      notification: updated,
      pushResult,
    };
  }
}
