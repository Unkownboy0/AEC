import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { PushDispatchService } from '../notifications/push-dispatch.service';
import { EventEmitter } from 'events';

class FacultyLeaveEventBus extends EventEmitter {}
export const facultyLeaveEvents = new FacultyLeaveEventBus();
facultyLeaveEvents.setMaxListeners(50);

export class FacultyLeaveNotificationService {
  /**
   * Send notification to HOD when Faculty submits a request.
   */
  static async notifyHodOnSubmission(request: any, facultyName: string, hodUserId: string) {
    const title = `New Faculty ${request.type === 'LEAVE' ? 'Leave' : 'OD'} Request`;
    const startDateStr = new Date(request.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const endDateStr = new Date(request.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const body = `${facultyName} submitted a ${request.title || request.reason} from ${startDateStr} to ${endDateStr}.`;
    const deepLink = `/hod/faculty-requests/${request.id}`;

    // 1. In-app notification
    await prisma.notification.create({
      data: {
        recipientId: hodUserId,
        eventType: 'FACULTY_LEAVE_SUBMITTED',
        title,
        message: body,
        relatedEntityType: 'WorkflowRequest',
        relatedEntityId: request.id,
        deepLinkRoute: deepLink,
        deliveryChannel: 'IN_APP',
        deliveryState: 'DELIVERED',
      },
    }).catch(err => logger.warn('[FacultyLeaveNotif] Failed in-app notification:', err));

    // 2. Native push notification
    await PushDispatchService.sendToUsers([hodUserId], {
      title,
      body,
      sound: 'default',
      priority: request.isEmergency ? 'high' : 'default',
      data: {
        type: 'FACULTY_LEAVE_SUBMITTED',
        requestId: request.id,
        deepLink,
        nativeDeepLink: `campusos://hod/faculty-requests/${request.id}`,
      },
    });

    // 3. Emit realtime event
    facultyLeaveEvents.emit('hod.faculty-request.received', { requestId: request.id, hodUserId });
  }

  /**
   * Send notification to Faculty when HOD updates their request status.
   */
  static async notifyFacultyOnHodAction(
    request: any,
    facultyUserId: string,
    action: 'RECOMMENDED' | 'REJECTED' | 'RETURNED',
    remarks?: string
  ) {
    let title = '';
    let body = '';

    if (action === 'RECOMMENDED') {
      title = 'Leave/OD Recommended';
      body = 'Your request was recommended by the HOD and forwarded for final approval.';
    } else if (action === 'REJECTED') {
      title = 'Leave/OD Request Rejected';
      body = `Your request was rejected by the HOD.${remarks ? ` Reason: ${remarks}` : ''}`;
    } else if (action === 'RETURNED') {
      title = 'Leave/OD Returned for Clarification';
      body = `Your request was returned by the HOD for update.${remarks ? ` Remarks: ${remarks}` : ''}`;
    }

    const deepLink = `/faculty/leave-od/${request.id}`;

    await prisma.notification.create({
      data: {
        recipientId: facultyUserId,
        eventType: `FACULTY_LEAVE_${action}`,
        title,
        message: body,
        relatedEntityType: 'WorkflowRequest',
        relatedEntityId: request.id,
        deepLinkRoute: deepLink,
        deliveryChannel: 'IN_APP',
        deliveryState: 'DELIVERED',
      },
    }).catch(() => {});

    await PushDispatchService.sendToUsers([facultyUserId], {
      title,
      body,
      data: {
        type: `FACULTY_LEAVE_${action}`,
        requestId: request.id,
        deepLink,
        nativeDeepLink: `campusos://faculty/leave-od/${request.id}`,
      },
    });

    facultyLeaveEvents.emit(`faculty.request.${action.toLowerCase()}`, { requestId: request.id, facultyUserId });
  }

  /**
   * Send notification to Substitute Faculty, Home HOD, Cross-Department HODs, and Applicant on Principal final approval.
   */
  static async notifySubstitutesAndStakeholdersOnApproval(params: {
    request: any;
    substitutions: any[];
    applicantFaculty: any;
  }) {
    const { request, substitutions, applicantFaculty } = params;

    // 1. Notify each assigned substitute faculty
    const substituteMap = new Map<string, any[]>();
    for (const sub of substitutions) {
      if (sub.assignedSubstituteId) {
        const list = substituteMap.get(sub.assignedSubstituteId) || [];
        list.push(sub);
        substituteMap.set(sub.assignedSubstituteId, list);
      }
    }

    for (const [subFacultyId, sessions] of substituteMap.entries()) {
      const subFaculty = await prisma.faculty.findUnique({
        where: { id: subFacultyId },
        include: { user: true },
      });

      if (subFaculty && subFaculty.userId) {
        const sessionCount = sessions.length;
        const firstSession = sessions[0];
        const title = 'Substitution Duty Assigned';
        const body = `You have been assigned as substitute for ${sessionCount} class session(s) (${firstSession.subjectName} - ${firstSession.periodDisplay}) for ${applicantFaculty.firstName} ${applicantFaculty.lastName} on ${firstSession.date}.`;
        const deepLink = `/faculty/timetable`;

        await prisma.notification.create({
          data: {
            recipientId: subFaculty.userId,
            eventType: 'SUBSTITUTE_DUTY_ASSIGNED',
            title,
            message: body,
            relatedEntityType: 'TimetableSlotOverride',
            relatedEntityId: request.id,
            deepLinkRoute: deepLink,
            deliveryChannel: 'IN_APP',
            deliveryState: 'DELIVERED',
          },
        }).catch(() => {});

        await PushDispatchService.sendToUsers([subFaculty.userId], {
          title,
          body,
          data: {
            type: 'SUBSTITUTE_DUTY_ASSIGNED',
            requestId: request.id,
            deepLink,
            nativeDeepLink: `campusos://faculty/timetable`,
          },
        });
      }
    }

    // 2. Notify cross-department HODs where classes were substituted
    const crossDeptIds = new Set<string>();
    for (const sub of substitutions) {
      if (sub.departmentId && sub.departmentId !== applicantFaculty.departmentId) {
        crossDeptIds.add(sub.departmentId);
      }
    }

    for (const deptId of crossDeptIds) {
      const deptHod = await prisma.user.findFirst({
        where: { departmentId: deptId, role: { name: 'HOD' } },
      });
      if (deptHod) {
        const title = 'Cross-Department Substitution Active';
        const body = `Approved leave substitution for ${applicantFaculty.firstName} ${applicantFaculty.lastName} in your department classes has been activated.`;
        await prisma.notification.create({
          data: {
            recipientId: deptHod.id,
            eventType: 'CROSS_DEPT_SUBSTITUTION_ACTIVE',
            title,
            message: body,
            relatedEntityType: 'WorkflowRequest',
            relatedEntityId: request.id,
            deepLinkRoute: `/hod/faculty-requests`,
            deliveryChannel: 'IN_APP',
            deliveryState: 'DELIVERED',
          },
        }).catch(() => {});
      }
    }

    // 3. Notify applicant faculty
    if (applicantFaculty.userId) {
      const title = 'Leave / OD Approved & Substitutions Activated';
      const body = `Your ${request.leaveType || 'Leave'} application (${request.requestNumber}) has been approved by the Principal. All ${substitutions.length} class substitution(s) are active.`;
      await prisma.notification.create({
        data: {
          recipientId: applicantFaculty.userId,
          eventType: 'FACULTY_LEAVE_APPROVED_PRINCIPAL',
          title,
          message: body,
          relatedEntityType: 'WorkflowRequest',
          relatedEntityId: request.id,
          deepLinkRoute: `/faculty/leave-od/${request.id}`,
          deliveryChannel: 'IN_APP',
          deliveryState: 'DELIVERED',
        },
      }).catch(() => {});
    }
  }
}
