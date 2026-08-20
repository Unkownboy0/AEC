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

            try {
              const { broadcastRBACUpdate } = require('../../lib/socket');
              broadcastRBACUpdate({
                type: 'notification:sent',
                userId: recipientId,
                payload: {
                  id: notif.id,
                  eventType: notif.eventType,
                  title: notif.title,
                  message: notif.message,
                  relatedEntityType: notif.relatedEntityType,
                  relatedEntityId: notif.relatedEntityId,
                  deepLinkRoute: notif.deepLinkRoute,
                  createdAt: notif.createdAt.toISOString()
                }
              });
            } catch (err) {
              logger.warn('[NotificationEngine] SSE broadcast failed:', err);
            }
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
        } catch (_) { }
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

      try {
        const { broadcastRBACUpdate } = require('../../lib/socket');
        broadcastRBACUpdate({
          type: 'notification:sent',
          userId: dto.recipientId,
          payload: {
            id: notification.id,
            eventType: notification.eventType,
            title: notification.title,
            message: notification.message,
            relatedEntityType: notification.relatedEntityType,
            relatedEntityId: notification.relatedEntityId,
            deepLinkRoute: notification.deepLinkRoute,
            createdAt: notification.createdAt.toISOString()
          }
        });
      } catch (err) {
        logger.warn('[NotificationService] SSE broadcast failed:', err);
      }

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

    const enrichedNotifications = await this.enrichNotificationsWithSenderDetails(notifications);

    return {
      data: enrichedNotifications,
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
   * Helper to enrich notifications with sender/actor profile pictures, roles, and names.
   */
  private static async enrichNotificationsWithSenderDetails(notifications: any[]) {
    if (!notifications || notifications.length === 0) return [];

    try {
      const studentLeaveIds: string[] = [];
      const facultyLeaveIds: string[] = [];
      const taskIds: string[] = [];
      const circularIds: string[] = [];
      const docIds: string[] = [];
      const complaintIds: string[] = [];

      notifications.forEach((n) => {
        const type = (n.relatedEntityType || '').toUpperCase();
        const eventType = (n.eventType || '').toUpperCase();
        if (n.relatedEntityId) {
          if (type.includes('STUDENT_LEAVE') || eventType.includes('STUDENT_LEAVE') || eventType.includes('STUDENT_OD') || eventType.includes('LEAVE_') || eventType.includes('OD_')) {
            studentLeaveIds.push(n.relatedEntityId);
          } else if (type.includes('FACULTY_LEAVE') || eventType.includes('FACULTY_LEAVE') || eventType.includes('FACULTY_OD')) {
            facultyLeaveIds.push(n.relatedEntityId);
          } else if (type.includes('TASK') || eventType.includes('TASK')) {
            taskIds.push(n.relatedEntityId);
          } else if (type.includes('CIRCULAR') || eventType.includes('CIRCULAR')) {
            circularIds.push(n.relatedEntityId);
          } else if (type.includes('WORKSPACE') || type.includes('DOC') || eventType.includes('DOCUMENT') || eventType.includes('FILE')) {
            docIds.push(n.relatedEntityId);
          } else if (type.includes('COMPLAINT') || eventType.includes('COMPLAINT')) {
            complaintIds.push(n.relatedEntityId);
          }
        }
      });

      const [studentLeaves, facultyLeaves, tasks, circulars, docs, complaints] = await Promise.all([
        studentLeaveIds.length > 0
          ? prisma.studentLeaveRequest.findMany({
            where: { id: { in: studentLeaveIds } },
            select: {
              id: true,
              type: true,
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  gender: true,
                  user: {
                    select: { id: true, firstName: true, lastName: true, gender: true, profilePhoto: true, profileImageFileId: true },
                  },
                },
              },
              mentor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  user: { select: { id: true, firstName: true, lastName: true, gender: true, profilePhoto: true, profileImageFileId: true } },
                },
              },
            },
          }).catch(() => [])
          : [],
        facultyLeaveIds.length > 0
          ? prisma.facultyLeaveRequest.findMany({
            where: { id: { in: facultyLeaveIds } },
            select: {
              id: true,
              leaveType: true,
              faculty: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  user: { select: { id: true, firstName: true, lastName: true, gender: true, profilePhoto: true, profileImageFileId: true } },
                },
              },
            },
          }).catch(() => [])
          : [],
        taskIds.length > 0
          ? prisma.task.findMany({
            where: { id: { in: taskIds } },
            select: {
              id: true,
              title: true,
              createdById: true,
            },
          }).catch(() => [])
          : [],
        circularIds.length > 0
          ? prisma.institutionalCircular.findMany({
            where: { id: { in: circularIds } },
            select: {
              id: true,
              title: true,
              authorId: true,
            },
          }).catch(() => [])
          : [],
        docIds.length > 0
          ? prisma.campusOfficeDocument.findMany({
            where: { id: { in: docIds } },
            select: {
              id: true,
              title: true,
              authorId: true,
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  gender: true,
                  profilePhoto: true,
                  profileImageFileId: true,
                  role: { select: { name: true } },
                  student: { select: { firstName: true, lastName: true, gender: true } },
                  faculty: { select: { firstName: true, lastName: true } },
                },
              },
            },
          }).catch(() => [])
          : [],
        complaintIds.length > 0
          ? prisma.ticket.findMany({
            where: { id: { in: complaintIds } },
            select: {
              id: true,
              title: true,
              student: {
                select: {
                  firstName: true,
                  lastName: true,
                  user: { select: { id: true, firstName: true, lastName: true, profilePhoto: true, profileImageFileId: true } },
                },
              },
              faculty: {
                select: {
                  firstName: true,
                  lastName: true,
                  user: { select: { id: true, firstName: true, lastName: true, profilePhoto: true, profileImageFileId: true } },
                },
              },
            },
          }).catch(() => [])
          : [],
      ]);

      const userIdsToFetch = Array.from(
        new Set([
          ...tasks.map((t: any) => t.createdById).filter(Boolean),
          ...circulars.map((c: any) => c.authorId).filter(Boolean),
        ])
      );

      const creatorUsers = userIdsToFetch.length > 0
        ? await prisma.user.findMany({
          where: { id: { in: userIdsToFetch } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            profilePhoto: true,
            profileImageFileId: true,
            role: { select: { name: true } },
            student: { select: { firstName: true, lastName: true, gender: true } },
            faculty: { select: { firstName: true, lastName: true } },
          },
        }).catch(() => [])
        : [];

      const userMap = new Map((creatorUsers as any[]).map((u) => [u.id, u]));
      const studentLeaveMap = new Map((studentLeaves as any[]).map((sl) => [sl.id, sl]));
      const facultyLeaveMap = new Map((facultyLeaves as any[]).map((fl) => [fl.id, fl]));
      const taskMap = new Map((tasks as any[]).map((t) => [t.id, t]));
      const circularMap = new Map((circulars as any[]).map((c) => [c.id, c]));
      const docMap = new Map((docs as any[]).map((d) => [d.id, d]));
      const complaintMap = new Map((complaints as any[]).map((comp) => [comp.id, comp]));

      return notifications.map((n) => {
        let actorUserId: string | undefined = undefined;
        let actorDisplayName: string | undefined = undefined;
        let actorProfileImage: string | undefined = undefined;
        let actorRole: string | undefined = undefined;
        let actorGender: string | undefined = undefined;
        let actorType: 'HUMAN' | 'SYSTEM' = 'SYSTEM';

        let subjectName: string | undefined = undefined;
        let subjectRole: string | undefined = undefined;
        let subjectAvatar: string | undefined = undefined;

        const eventType = (n.eventType || '').toUpperCase();
        const relatedId = n.relatedEntityId;

        if (relatedId && studentLeaveMap.has(relatedId)) {
          const req = studentLeaveMap.get(relatedId);
          actorType = 'HUMAN';
          const stUser = req.student?.user;
          const studentFullName = `${req.student?.firstName || stUser?.firstName || ''} ${req.student?.lastName || stUser?.lastName || ''}`.trim() || 'Student';
          const studentAvatar = req.student?.profilePhoto || stUser?.profilePhoto || (stUser?.profileImageFileId ? `/api/files/${stUser.profileImageFileId}/content` : undefined);
          const studentGender = req.student?.gender || stUser?.gender || undefined;

          subjectName = studentFullName;
          subjectRole = 'Student';
          subjectAvatar = studentAvatar;

          if (eventType.includes('SUBMITTED') || eventType.includes('REQUESTED')) {
            actorUserId = stUser?.id || req.student?.id;
            actorDisplayName = studentFullName;
            actorProfileImage = studentAvatar;
            actorRole = 'Student';
            actorGender = studentGender;
          } else if (eventType.includes('MENTOR') || eventType.includes('FORWARDED')) {
            const mUser = req.mentor?.user;
            actorUserId = mUser?.id || req.mentor?.id;
            actorDisplayName = `${req.mentor?.firstName || mUser?.firstName || ''} ${req.mentor?.lastName || mUser?.lastName || ''}`.trim() || 'Mentor';
            actorProfileImage = mUser?.profilePhoto || (mUser?.profileImageFileId ? `/api/files/${mUser.profileImageFileId}/content` : undefined);
            actorRole = 'Mentor';
            actorGender = mUser?.gender || undefined;
          } else if (eventType.includes('HOD') || eventType.includes('APPROVED') || eventType.includes('REJECTED')) {
            actorDisplayName = eventType.includes('MENTOR') ? 'Faculty Mentor' : 'Head of Department';
            actorRole = eventType.includes('MENTOR') ? 'Mentor' : 'HOD';
          }
        } else if (relatedId && facultyLeaveMap.has(relatedId)) {
          const req = facultyLeaveMap.get(relatedId);
          actorType = 'HUMAN';
          const fUser = req.faculty?.user;
          const facName = `${req.faculty?.firstName || fUser?.firstName || ''} ${req.faculty?.lastName || fUser?.lastName || ''}`.trim() || 'Faculty';
          const facAvatar = fUser?.profilePhoto || (fUser?.profileImageFileId ? `/api/files/${fUser.profileImageFileId}/content` : undefined);

          subjectName = facName;
          subjectRole = 'Faculty';
          subjectAvatar = facAvatar;

          if (eventType.includes('SUBMITTED') || eventType.includes('REQUESTED')) {
            actorUserId = fUser?.id || req.faculty?.id;
            actorDisplayName = facName;
            actorProfileImage = facAvatar;
            actorRole = 'Faculty';
            actorGender = fUser?.gender || undefined;
          } else if (eventType.includes('HOD') || eventType.includes('RECOMMENDED')) {
            actorDisplayName = 'Head of Department';
            actorRole = 'HOD';
          } else if (eventType.includes('PRINCIPAL') || eventType.includes('APPROVED')) {
            actorDisplayName = 'Principal';
            actorRole = 'Principal';
          }
        } else if (relatedId && docMap.has(relatedId)) {
          const d = docMap.get(relatedId);
          const author = d?.author;
          if (author) {
            actorType = 'HUMAN';
            actorUserId = author.id;
            actorDisplayName = author.student
              ? `${author.student.firstName} ${author.student.lastName}`.trim()
              : author.faculty
                ? `${author.faculty.firstName} ${author.faculty.lastName}`.trim()
                : `${author.firstName || ''} ${author.lastName || ''}`.trim() || author.role?.name || 'Collaborator';
            actorProfileImage = author.profilePhoto || (author.profileImageFileId ? `/api/files/${author.profileImageFileId}/content` : undefined);
            actorRole = author.role?.name || 'Author';
            actorGender = author.gender || author.student?.gender || undefined;
          }
        } else if (relatedId && taskMap.has(relatedId)) {
          const t = taskMap.get(relatedId);
          const creator = t?.createdById ? userMap.get(t.createdById) : undefined;
          if (creator) {
            actorType = 'HUMAN';
            actorUserId = creator.id;
            actorDisplayName = `${creator.firstName || ''} ${creator.lastName || ''}`.trim() || 'Assigner';
            actorProfileImage = creator.profilePhoto || (creator.profileImageFileId ? `/api/files/${creator.profileImageFileId}/content` : undefined);
            actorRole = creator.role?.name || 'Task Assigner';
            actorGender = creator.gender || undefined;
          }
        } else if (relatedId && circularMap.has(relatedId)) {
          const c = circularMap.get(relatedId);
          const author = c?.authorId ? userMap.get(c.authorId) : undefined;
          if (author) {
            actorType = 'HUMAN';
            actorUserId = author.id;
            actorDisplayName = `${author.firstName || ''} ${author.lastName || ''}`.trim() || 'Administration';
            actorProfileImage = author.profilePhoto || (author.profileImageFileId ? `/api/files/${author.profileImageFileId}/content` : undefined);
            actorRole = author.role?.name || 'Administration';
            actorGender = author.gender || undefined;
          }
        } else if (relatedId && complaintMap.has(relatedId)) {
          const comp = complaintMap.get(relatedId);
          const cUser = comp?.student?.user || comp?.faculty?.user;
          const cName = comp?.student ? `${comp.student.firstName} ${comp.student.lastName}` : comp?.faculty ? `${comp.faculty.firstName} ${comp.faculty.lastName}` : cUser ? `${cUser.firstName} ${cUser.lastName}` : 'Complainant';
          actorType = 'HUMAN';
          actorUserId = cUser?.id;
          actorDisplayName = cName;
          actorProfileImage = cUser?.profilePhoto || (cUser?.profileImageFileId ? `/api/files/${cUser.profileImageFileId}/content` : undefined);
          actorRole = 'Complainant';
          actorGender = cUser?.gender || undefined;
        }

        // Detect known human actor event categories
        if (!actorDisplayName) {
          if (eventType.includes('LEAVE') || eventType.includes('OD') || eventType.includes('APPROVAL') || eventType.includes('DELEGAT')) {
            actorType = 'HUMAN';
            actorDisplayName = eventType.includes('MENTOR') ? 'Faculty Mentor' : eventType.includes('HOD') ? 'Head of Department' : eventType.includes('PRINCIPAL') ? 'Principal' : 'Academic Reviewer';
            actorRole = eventType.includes('MENTOR') ? 'Mentor' : eventType.includes('HOD') ? 'HOD' : eventType.includes('PRINCIPAL') ? 'Principal' : 'Authority';
          } else if (eventType.includes('CIRCULAR') || eventType.includes('ANNOUNCEMENT')) {
            actorType = 'HUMAN';
            actorDisplayName = 'Institutional Administration';
            actorRole = 'Administration';
          } else {
            actorType = 'SYSTEM';
            actorDisplayName = 'CampusOS System';
            actorRole = 'System';
          }
        }

        return {
          ...n,
          actorUserId: actorUserId || undefined,
          actorDisplayName: actorDisplayName || undefined,
          actorProfileImage: actorProfileImage || undefined,
          actorRole: actorRole || undefined,
          actorGender: actorGender || undefined,
          actorType,

          senderName: actorDisplayName || undefined,
          senderAvatar: actorProfileImage || undefined,
          senderRole: actorRole || undefined,
          senderGender: actorGender || undefined,

          subjectName: subjectName || undefined,
          subjectRole: subjectRole || undefined,
          subjectAvatar: subjectAvatar || undefined,
        };
      });
    } catch (err) {
      logger.warn('[NotificationEngine] Error enriching notifications with sender details:', err);
      return notifications;
    }
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
   * Get role-aware consolidated badge summary for all workspace modules.
   * Real server-backed source of truth for indicators.
   */
  static async getBadgeSummary(userId: string, roleName?: string) {
    const unreadNotifications = await prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    }).catch(() => 0);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        student: true,
        faculty: true,
      },
    }).catch(() => null);

    const activeRole = (roleName || user?.role?.name || '').toUpperCase().replace(/[\s_-]+/g, '');
    let pendingApprovals = 0;
    let pendingLeaveRequests = 0;
    let pendingTasks = 0;
    let unreadCirculars = 0;
    let unreadMessages = 0;
    let pendingAssignments = 0;
    let pendingFees = 0;

    // 1. Role-aware Pending Approvals
    if (activeRole.includes('MENTOR') && user?.faculty?.id) {
      pendingApprovals = await prisma.studentLeaveRequest.count({
        where: {
          mentorId: user.faculty.id,
          status: { in: ['PENDING_MENTOR', 'PENDING'] },
        },
      }).catch(() => 0);
    } else if (activeRole.includes('HOD') && user?.faculty?.departmentId) {
      const [studentLeaves, facultyLeaves] = await Promise.all([
        prisma.studentLeaveRequest.count({
          where: {
            departmentId: user.faculty.departmentId,
            status: { in: ['PENDING_HOD', 'FORWARDED_TO_HOD'] },
          },
        }).catch(() => 0),
        prisma.facultyLeaveRequest.count({
          where: {
            departmentId: user.faculty.departmentId,
            status: { in: ['PENDING_HOD', 'PENDING', 'SUBMITTED'] },
          },
        }).catch(() => 0),
      ]);
      pendingApprovals = studentLeaves + facultyLeaves;
    } else if (activeRole.includes('PRINCIPAL') || activeRole.includes('HEADOFINSTITUTION')) {
      pendingApprovals = await prisma.facultyLeaveRequest.count({
        where: {
          status: { in: ['PENDING_PRINCIPAL', 'FORWARDED_TO_PRINCIPAL', 'PENDING'] },
        },
      }).catch(() => 0);
    } else if (activeRole.includes('VP') || activeRole.includes('VICEPRINCIPAL')) {
      pendingApprovals = await prisma.facultyLeaveRequest.count({
        where: {
          status: { in: ['PENDING_PRINCIPAL', 'DELEGATED_TO_VP', 'PENDING_VP'] },
        },
      }).catch(() => 0);
    } else if (activeRole.includes('ACADEMICDEAN') || activeRole.includes('DEANACADEMIC')) {
      pendingApprovals = await prisma.studentLeaveRequest.count({
        where: {
          status: { in: ['PENDING_DEAN', 'ESCALATED_TO_DEAN'] },
        },
      }).catch(() => 0);
    } else if (activeRole.includes('ADMISSIONDEAN') || activeRole.includes('ADMINISTRATIONDEAN')) {
      pendingApprovals = await prisma.facultyLeaveRequest.count({
        where: {
          status: { in: ['PENDING_ADMIN_DEAN', 'PENDING_DEAN'] },
        },
      }).catch(() => 0);
    }

    // 2. Pending Tasks assigned to user
    pendingTasks = await prisma.taskAssignee.count({
      where: {
        assigneeId: userId,
        status: { notIn: ['COMPLETED', 'REJECTED'] },
      },
    }).catch(() => 0);

    // 3. Unread Circulars (published circulars without read receipt)
    const publishedCirculars = await prisma.institutionalCircular.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true },
      take: 50,
    }).catch(() => []);

    if (publishedCirculars.length > 0) {
      const readReceipts = await prisma.circularReadReceipt.findMany({
        where: {
          userId,
          circularId: { in: publishedCirculars.map((c) => c.id) },
        },
        select: { circularId: true },
      }).catch(() => []);
      const readSet = new Set(readReceipts.map((r) => r.circularId));
      unreadCirculars = publishedCirculars.filter((c) => !readSet.has(c.id)).length;
    }

    // 4. Student active pending leave requests
    if (activeRole.includes('STUDENT') && user?.student?.id) {
      pendingLeaveRequests = await prisma.studentLeaveRequest.count({
        where: {
          studentId: user.student.id,
          status: { in: ['PENDING_MENTOR', 'PENDING_HOD', 'PENDING_DEAN', 'RETURNED_TO_STUDENT'] },
        },
      }).catch(() => 0);
    }

    return {
      unreadNotifications,
      pendingApprovals,
      pendingLeaveRequests,
      pendingTasks,
      unreadCirculars,
      unreadMessages,
      pendingAssignments,
      pendingFees,
    };
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

    if (notification.isRead) {
      return notification;
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
      }).catch(() => { });
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
