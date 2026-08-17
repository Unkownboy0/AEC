import { prisma } from '../../lib/prisma';
import { NotFoundException, ForbiddenException, BadRequestException } from '../../utils/exceptions';
import { AuditService } from '../security/audit.service';
import { NotificationService } from '../notifications/notification.service';

export interface UpdateResidentialPayload {
  residentialType: 'HOSTELLER' | 'DAY_SCHOLAR';
  transportMode?: 'COLLEGE_BUS' | 'OUT_BUS' | 'OWN_VEHICLE' | 'PUBLIC_TRANSPORT' | 'PARENT_DROP_PICKUP' | 'OTHER';
  reason: string;
  remarks?: string;
}

export class StudentResidentialService {
  /**
   * Helper: Ensure faculty profile exists for current user
   */
  private async getFacultyByUserId(userId: string) {
    const faculty = await (prisma as any).faculty.findFirst({ where: { userId } });
    if (!faculty) throw new NotFoundException('Faculty profile not found for this user account');
    return faculty;
  }

  /**
   * Helper: Ensure student is assigned to mentor
   */
  private async assertMentee(facultyId: string, studentId: string, userRole?: string) {
    // Super Admin / College Admin can bypass mentee restriction
    if (['Super Admin', 'College Admin', 'SUPER_ADMIN', 'COLLEGE_ADMIN'].includes(userRole || '')) {
      const student = await (prisma as any).student.findUnique({
        where: { id: studentId },
        include: { department: true, program: true, section: true, semester: true },
      });
      if (!student) throw new NotFoundException('Student record not found');
      return student;
    }

    const student = await (prisma as any).student.findFirst({
      where: {
        id: studentId,
        deleted: false,
        OR: [
          { mentorId: facultyId },
          { mentorAssignments: { some: { mentorId: facultyId, status: 'ACTIVE' } } },
        ],
      },
      include: { department: true, program: true, section: true, semester: true },
    });

    if (!student) {
      throw new ForbiddenException('Access denied: You can only view and manage residential/transport for assigned mentees');
    }
    return student;
  }

  /**
   * Get Student Residential & Transport Status + History
   */
  async getResidentialStatus(userId: string, studentId: string, userRole?: string) {
    const faculty = await this.getFacultyByUserId(userId);
    const student = await this.assertMentee(faculty.id, studentId, userRole);

    const [history, activeHostelAllocation, activeTransportAllocation] = await Promise.all([
      (prisma as any).studentResidentialHistory.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      (prisma as any).hostelAllocation.findFirst({
        where: { studentId, status: 'ACTIVE' },
        include: { room: { include: { floor: { include: { block: true } } } }, bed: true },
      }),
      (prisma as any).transportAllocation.findFirst({
        where: { passengerId: studentId, passengerType: 'STUDENT', status: 'ACTIVE' },
        include: { route: true, stop: true },
      }),
    ]);

    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNo: student.admissionNo,
      department: student.department?.name,
      section: student.section?.name,
      residentialType: student.residentialType || 'DAY_SCHOLAR',
      transportMode: student.transportMode || 'OTHER',
      activeHostelAllocation,
      activeTransportAllocation,
      history,
    };
  }

  /**
   * Update Student Residential Type & Transport Mode
   * Mandatory requirements:
   * 1. If changed from DAY_SCHOLAR -> HOSTELLER, creates HOSTEL_ALLOCATION_REQUIRED workflow task
   * 2. If changed to DAY_SCHOLAR + COLLEGE_BUS, creates TRANSPORT_ALLOCATION_REQUIRED workflow task
   * 3. If changed to DAY_SCHOLAR + other mode, deactivates / ignores college bus allocations
   * 4. Complete audit log, old/new value capture, history retention, domain notifications.
   */
  async updateResidentialStatus(
    userId: string,
    studentId: string,
    payload: UpdateResidentialPayload,
    userRole?: string
  ) {
    const faculty = await this.getFacultyByUserId(userId);
    const student = await this.assertMentee(faculty.id, studentId, userRole);

    if (!payload.residentialType) {
      throw new BadRequestException('Residential type (HOSTELLER or DAY_SCHOLAR) is required');
    }
    if (!payload.reason || !payload.reason.trim()) {
      throw new BadRequestException('A valid reason for the residential status change is mandatory');
    }

    if (payload.residentialType === 'DAY_SCHOLAR' && !payload.transportMode) {
      throw new BadRequestException('Transport mode is required when setting residential type to Day Scholar');
    }

    const oldResidentialType = student.residentialType || 'DAY_SCHOLAR';
    const oldTransportMode = student.transportMode || 'OTHER';
    const newResidentialType = payload.residentialType;
    const newTransportMode = payload.residentialType === 'HOSTELLER' ? null : (payload.transportMode || 'OTHER');

    let triggeredWorkflowTaskId: string | null = null;
    const studentFullName = `${student.firstName} ${student.lastName}`;

    // 1. If transitioning to HOSTELLER -> Create HOSTEL_ALLOCATION_REQUIRED workflow task
    if (oldResidentialType !== 'HOSTELLER' && newResidentialType === 'HOSTELLER') {
      try {
        const task = await (prisma as any).workflowRequest.create({
          data: {
            type: 'HOSTEL_ALLOCATION_REQUIRED',
            studentId: student.id,
            status: 'PENDING_HOSTEL_ADMIN',
            data: JSON.stringify({
              reason: payload.reason,
              remarks: payload.remarks || '',
              requestedByMentorId: faculty.id,
              requestedByUserId: userId,
              studentName: studentFullName,
              admissionNo: student.admissionNo,
              department: student.department?.name,
              section: student.section?.name,
              effectiveDate: new Date().toISOString(),
            }),
            currentStage: 'HOSTEL_ALLOCATION',
          },
        });
        triggeredWorkflowTaskId = task.id;

        // Dispatch domain event notification
        await NotificationService.dispatchDomainEvent({
          eventType: 'REQUEST_SUBMITTED',
          title: 'Hostel Allocation Required',
          body: `Student ${studentFullName} (${student.admissionNo}) changed to Hosteller by Mentor ${faculty.firstName} ${faculty.lastName}. Room allocation required.`,
          entityType: 'WORKFLOW_TASK',
          entityId: task.id,
          deepLinkRoute: `/hostel/allocations?studentId=${student.id}&taskId=${task.id}`,
          actorUserId: userId,
          metadata: { targetRoleNames: ['Warden', 'Chief Warden', 'Hostel Admin', 'Administration Dean'] },
        });
      } catch (wfErr) {
        console.warn('Workflow task creation warning for hostel allocation:', wfErr);
      }
    }

    // 2. If transitioning to DAY_SCHOLAR + COLLEGE_BUS -> Create TRANSPORT_ALLOCATION_REQUIRED workflow task
    if (newResidentialType === 'DAY_SCHOLAR' && newTransportMode === 'COLLEGE_BUS' && oldTransportMode !== 'COLLEGE_BUS') {
      try {
        const task = await (prisma as any).workflowRequest.create({
          data: {
            type: 'TRANSPORT_ALLOCATION_REQUIRED',
            studentId: student.id,
            status: 'PENDING_TRANSPORT_ADMIN',
            data: JSON.stringify({
              reason: payload.reason,
              remarks: payload.remarks || '',
              requestedByMentorId: faculty.id,
              requestedByUserId: userId,
              studentName: studentFullName,
              admissionNo: student.admissionNo,
              department: student.department?.name,
              section: student.section?.name,
              effectiveDate: new Date().toISOString(),
            }),
            currentStage: 'TRANSPORT_ALLOCATION',
          },
        });
        triggeredWorkflowTaskId = task.id;

        // Dispatch domain event notification
        await NotificationService.dispatchDomainEvent({
          eventType: 'REQUEST_SUBMITTED',
          title: 'Transport Allocation Required',
          body: `Student ${studentFullName} (${student.admissionNo}) selected College Bus by Mentor ${faculty.firstName} ${faculty.lastName}. Route and Stop allocation required.`,
          entityType: 'WORKFLOW_TASK',
          entityId: task.id,
          deepLinkRoute: `/transport/allocations?studentId=${student.id}&taskId=${task.id}`,
          actorUserId: userId,
          metadata: { targetRoleNames: ['Transport Manager', 'Transport Admin', 'Administration Dean'] },
        });
      } catch (wfErr) {
        console.warn('Workflow task creation warning for transport allocation:', wfErr);
      }
    }

    // 3. Update Student Master Record
    const updatedStudent = await (prisma as any).student.update({
      where: { id: studentId },
      data: {
        residentialType: newResidentialType,
        transportMode: newTransportMode,
      },
    });

    // 4. Save historical audit entry
    const historyEntry = await (prisma as any).studentResidentialHistory.create({
      data: {
        studentId: student.id,
        oldResidentialType,
        newResidentialType,
        oldTransportMode,
        newTransportMode,
        reason: payload.reason,
        remarks: payload.remarks || null,
        changedById: userId,
        changedByRole: userRole || 'Mentor',
        workflowTaskId: triggeredWorkflowTaskId,
      },
    });

    // 5. System Audit Trail
    await AuditService.log({
      actorId: userId,
      action: 'STUDENT_RESIDENTIAL_STATUS_UPDATED',
      entityType: 'STUDENT',
      entityId: student.id,
      description: `Updated residential status from ${oldResidentialType} (${oldTransportMode}) to ${newResidentialType} (${newTransportMode || 'N/A'}). Reason: ${payload.reason}`,
      newValues: {
        oldResidentialType,
        newResidentialType,
        oldTransportMode,
        newTransportMode,
        workflowTaskId: triggeredWorkflowTaskId,
      },
    });

    return {
      status: 'success',
      message: 'Student residential and transport status updated successfully',
      data: {
        student: updatedStudent,
        history: historyEntry,
        workflowTaskId: triggeredWorkflowTaskId,
      },
    };
  }
}
