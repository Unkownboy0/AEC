import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { NotificationService } from '../notifications/notification.service';
import { EventEmitter } from 'events';

class FacultyLeaveEventBus extends EventEmitter {}
export const facultyLeaveEvents = new FacultyLeaveEventBus();
facultyLeaveEvents.setMaxListeners(50);

export class FacultyLeaveNotificationService {
  /**
   * Send notification to HOD when Faculty submits a request.
   */
  static async notifyHodOnSubmission(request: any, facultyName: string, hodUserId: string) {
    const isOd = request.type === 'ON_DUTY' || request.type === 'OD';
    const title = `New Faculty ${isOd ? 'OD' : 'Leave'} Request`;
    const startDateStr = new Date(request.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const endDateStr = new Date(request.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const body = `${facultyName} submitted a ${request.title || request.reason || 'leave request'} from ${startDateStr} to ${endDateStr}.`;
    const deepLinkRoute = `/hod/faculty-requests/${request.id}`;

    await NotificationService.dispatchDomainEvent({
      eventType: isOd ? 'OD_SUBMITTED' : 'LEAVE_SUBMITTED',
      actorUserId: request.facultyRequesterId,
      entityType: 'FACULTY_LEAVE_REQUEST',
      entityId: request.id,
      title,
      body,
      priority: request.isEmergency ? 'CRITICAL' : 'HIGH',
      category: 'APPROVALS',
      deepLinkRoute,
      targetUserIds: [hodUserId],
    });

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
    let eventType: any = 'LEAVE_FORWARDED';

    if (action === 'RECOMMENDED') {
      title = 'Leave/OD Recommended';
      body = 'Your request was recommended by the HOD and forwarded for final approval.';
      eventType = 'LEAVE_FORWARDED';
    } else if (action === 'REJECTED') {
      title = 'Leave/OD Request Rejected';
      body = `Your request was rejected by the HOD.${remarks ? ` Reason: ${remarks}` : ''}`;
      eventType = 'LEAVE_REJECTED';
    } else if (action === 'RETURNED') {
      title = 'Leave/OD Returned for Clarification';
      body = `Your request was returned by the HOD for update.${remarks ? ` Remarks: ${remarks}` : ''}`;
      eventType = 'LEAVE_RETURNED';
    }

    const deepLinkRoute = `/faculty/leave-od/${request.id}`;

    await NotificationService.dispatchDomainEvent({
      eventType,
      entityType: 'FACULTY_LEAVE_REQUEST',
      entityId: request.id,
      title,
      body,
      priority: action === 'REJECTED' ? 'HIGH' : 'NORMAL',
      category: 'APPROVALS',
      deepLinkRoute,
      targetUserIds: [facultyUserId],
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
        const body = `You have been assigned as substitute for ${sessionCount} class session(s) (${firstSession.subjectName || 'Class'} - ${firstSession.periodDisplay || 'Period'}) for ${applicantFaculty.firstName} ${applicantFaculty.lastName} on ${firstSession.date || 'scheduled date'}.`;
        const deepLinkRoute = `/faculty/timetable`;

        await NotificationService.dispatchDomainEvent({
          eventType: 'CLASS_SUBSTITUTION_ASSIGNED',
          entityType: 'TIMETABLE_SUBSTITUTION',
          entityId: request.id,
          title,
          body,
          priority: 'HIGH',
          category: 'ACADEMIC',
          deepLinkRoute,
          targetUserIds: [subFaculty.userId],
          metadata: {
            substituteFacultyUserId: subFaculty.userId,
            applicantFacultyName: `${applicantFaculty.firstName} ${applicantFaculty.lastName}`,
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
        await NotificationService.dispatchDomainEvent({
          eventType: 'CLASS_SUBSTITUTION_ASSIGNED',
          entityType: 'TIMETABLE_SUBSTITUTION',
          entityId: request.id,
          title: 'Cross-Department Substitution Active',
          body: `Approved leave substitution for ${applicantFaculty.firstName} ${applicantFaculty.lastName} in your department classes has been activated.`,
          priority: 'NORMAL',
          category: 'ACADEMIC',
          deepLinkRoute: `/hod/faculty-requests`,
          targetUserIds: [deptHod.id],
        });
      }
    }

    // 3. Notify applicant faculty
    if (applicantFaculty.userId) {
      const title = 'Leave / OD Approved & Substitutions Activated';
      const body = `Your ${request.leaveType || 'Leave'} application (${request.requestNumber || ''}) has been approved by the Principal. All ${substitutions.length} class substitution(s) are active.`;

      await NotificationService.dispatchDomainEvent({
        eventType: 'LEAVE_APPROVED',
        entityType: 'FACULTY_LEAVE_REQUEST',
        entityId: request.id,
        title,
        body,
        priority: 'HIGH',
        category: 'APPROVALS',
        deepLinkRoute: `/faculty/leave-od/${request.id}`,
        targetUserIds: [applicantFaculty.userId],
      });
    }
  }
}
