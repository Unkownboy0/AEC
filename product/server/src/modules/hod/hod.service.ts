import { prisma } from '../../lib/prisma';
import { HodRepository } from './hod.repository';
import { WorkflowService } from '../workflow/workflow.service';
import {
  HodReviewActionPayload,
  SubjectAllocationPayload,
  HodTaskCreatePayload,
  HodCircularCreatePayload,
} from './hod.types';

export class HodService {
  private repository = new HodRepository();
  private workflowService = new WorkflowService();

  async getDashboardSummary(departmentId: string) {
    const metrics = await this.repository.getDashboardMetrics(departmentId);

    const chartData = {
      studentAttendanceTrend: [
        { label: 'Mon', value: 92 },
        { label: 'Tue', value: 94 },
        { label: 'Wed', value: 89 },
        { label: 'Thu', value: 95 },
        { label: 'Fri', value: 91 },
      ],
      leaveRequestTrend: [
        { label: 'Week 1', value: 8 },
        { label: 'Week 2', value: 12 },
        { label: 'Week 3', value: 6 },
        { label: 'Week 4', value: 15 },
      ],
      odRequestTrend: [
        { label: 'Week 1', value: 14 },
        { label: 'Week 2', value: 20 },
        { label: 'Week 3', value: 11 },
        { label: 'Week 4', value: 18 },
      ],
      approvalVsRejection: {
        approved: 45,
        rejected: 5,
        returned: 8,
        pending: metrics.pendingLeaveRequests + metrics.pendingOdRequests,
      },
      facultyWorkloadDistribution: [
        { name: 'Dr. Ramesh', hours: 16, status: 'NORMAL' },
        { name: 'Prof. Anitha', hours: 22, status: 'OVERLOADED' },
        { name: 'K. Suresh', hours: 10, status: 'UNDER_ALLOCATED' },
      ],
      subjectPassPercentage: [
        { subjectCode: 'CS801', subjectName: 'Cloud Computing', passPercentage: 94 },
        { subjectCode: 'CS802', subjectName: 'Machine Learning', passPercentage: 88 },
        { subjectCode: 'CS803', subjectName: 'Cyber Security', passPercentage: 91 },
      ],
      taskCompletionRate: {
        completed: 18,
        pending: metrics.pendingTasks,
        overdue: metrics.overdueTasks,
      },
    };

    return {
      ...metrics,
      charts: chartData,
      recentActivities: [],
    };
  }

  async getLeaveOdRequests(departmentId: string, filters: any) {
    return this.repository.getLeaveOdRequests(departmentId, filters);
  }

  async reviewLeaveOdRequest(
    departmentId: string,
    hodUserId: string,
    payload: HodReviewActionPayload
  ) {
    // 1. Check if request exists in WorkflowRequest table
    const wfRequest = await prisma.workflowRequest.findUnique({
      where: { id: payload.requestId },
    });

    if (wfRequest) {
      const user = await prisma.user.findUnique({ where: { id: hodUserId } });
      const userEmail = user?.email || 'hod@geetorus.com';
      const action = payload.action === 'APPROVE' ? 'APPROVE' : payload.action === 'REJECT' ? 'REJECT' : 'CLARIFICATION';
      return this.workflowService.takeAction(
        payload.requestId,
        userEmail,
        'HOD',
        action as any,
        payload.remarks || payload.rejectionReason
      );
    }

    // 2. Otherwise handle StudentLeaveRequest table
    const request = await this.repository.getLeaveOdRequestById(payload.requestId, departmentId);
    if (!request) {
      throw new Error('Request not found or does not belong to your department.');
    }

    let nextWorkflowStatus = request.workflowStatus;
    let status = request.status;

    switch (payload.action) {
      case 'APPROVE':
        nextWorkflowStatus = 'APPROVED_BY_HOD';
        status = 'APPROVED';
        break;
      case 'REJECT':
        if (!payload.rejectionReason && !payload.remarks) {
          throw new Error('Rejection reason or remarks are mandatory.');
        }
        nextWorkflowStatus = 'REJECTED_BY_HOD';
        status = 'REJECTED';
        break;
      case 'RETURN_TO_MENTOR':
        nextWorkflowStatus = 'RETURNED_TO_MENTOR';
        status = 'RETURNED';
        break;
      case 'RETURN_TO_STUDENT':
        nextWorkflowStatus = 'RETURNED_TO_STUDENT';
        status = 'RETURNED';
        break;
      case 'ESCALATE':
        nextWorkflowStatus = 'ESCALATED_TO_DEAN';
        status = 'ESCALATED';
        break;
      default:
        throw new Error('Invalid HOD action specified.');
    }

    const updated = await prisma.studentLeaveRequest.update({
      where: { id: payload.requestId },
      data: {
        workflowStatus: nextWorkflowStatus,
        status,
        hodStatus: payload.action === 'APPROVE' ? 'APPROVED' : payload.action === 'REJECT' ? 'REJECTED' : 'RETURNED',
        hodApprovedAt: new Date(),
        hodRemarks: payload.remarks || payload.rejectionReason || '',
      },
    });

    if (request.student?.userId) {
      await prisma.notification.create({
        data: {
          recipientId: request.student.userId,
          title: `HOD Decision: ${request.requestNumber}`,
          message: `Your ${request.type} request has been ${status.toLowerCase()} by HOD.`,
          eventType: 'STUDENT_LEAVE_SUBMITTED',
        },
      });
    }

    return updated;
  }

  async bulkReviewLeaveOd(
    departmentId: string,
    hodUserId: string,
    requestIds: string[],
    action: 'APPROVE' | 'REJECT',
    remarks?: string
  ) {
    const results = [];
    for (const requestId of requestIds) {
      try {
        const res = await this.reviewLeaveOdRequest(departmentId, hodUserId, {
          requestId,
          action,
          remarks: remarks || `Bulk ${action.toLowerCase()} by HOD`,
          rejectionReason: action === 'REJECT' ? remarks || 'Bulk rejected by HOD' : undefined,
        });
        results.push(res);
      } catch (err: any) {
        console.error(`Bulk action failed for ${requestId}:`, err.message);
      }
    }
    return { processed: results.length, total: requestIds.length };
  }

  async assignMentorToStudent(
    departmentId: string,
    studentId: string,
    mentorFacultyId: string
  ) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, departmentId },
    });
    if (!student) {
      throw new Error('Student not found in your department.');
    }

    const mentor = await prisma.faculty.findFirst({
      where: { id: mentorFacultyId, departmentId },
    });
    if (!mentor) {
      throw new Error('Mentor Faculty not found in your department.');
    }

    return prisma.student.update({
      where: { id: studentId },
      data: {
        mentorId: mentorFacultyId,
      },
    });
  }

  async bulkAssignMentor(
    departmentId: string,
    studentIds: string[],
    mentorFacultyId: string
  ) {
    const mentor = await prisma.faculty.findFirst({
      where: { id: mentorFacultyId, departmentId },
    });
    if (!mentor) {
      throw new Error('Mentor Faculty not found in your department.');
    }

    return prisma.student.updateMany({
      where: {
        id: { in: studentIds },
        departmentId,
      },
      data: {
        mentorId: mentorFacultyId,
      },
    });
  }

  async assignSubjectToFaculty(departmentId: string, payload: SubjectAllocationPayload) {
    const existing = await prisma.subjectAssignment.findFirst({
      where: {
        subjectId: payload.subjectId,
        sectionId: payload.sectionId,
      },
    });

    const activeYear = await prisma.academicYear.findFirst({ where: { status: 'ACTIVE' } });
    const yearId = activeYear?.id || 'default_year';

    if (existing) {
      return prisma.subjectAssignment.update({
        where: { id: existing.id },
        data: {
          facultyId: payload.primaryFacultyId,
        },
      });
    }

    return prisma.subjectAssignment.create({
      data: {
        subjectId: payload.subjectId,
        facultyId: payload.primaryFacultyId,
        semesterId: payload.semesterId,
        sectionId: payload.sectionId,
        academicYearId: yearId,
      },
    });
  }

  async createDepartmentTask(
    departmentId: string,
    creatorUserId: string,
    payload: HodTaskCreatePayload
  ) {
    const taskNumber = `TASK-HOD-${Date.now()}`;
    const task = await prisma.task.create({
      data: {
        taskNumber,
        title: payload.title,
        description: payload.description,
        departmentId,
        createdById: creatorUserId,
        dueDate: new Date(payload.dueAt),
        priority: payload.priority || 'MEDIUM',
        status: 'PENDING',
        checklist: JSON.stringify(payload.checklist || []),
      },
    });

    if (payload.assigneeUserIds && payload.assigneeUserIds.length > 0) {
      await prisma.taskAssignee.createMany({
        data: payload.assigneeUserIds.map((userId) => ({
          taskId: task.id,
          assigneeId: userId,
        })),
      });
    }

    return task;
  }

  async createDepartmentCircular(
    departmentId: string,
    creatorUserId: string,
    payload: HodCircularCreatePayload
  ) {
    return (prisma as any).hodCircular.create({
      data: {
        title: payload.title,
        content: payload.content,
        departmentId,
        publishedById: creatorUserId,
        category: 'ACADEMIC',
        priority: payload.priority || 'NORMAL',
      },
    });
  }
}
