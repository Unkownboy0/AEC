import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../principal-availability/delegation.guard';
import { ApprovalTimelineService } from './approval-timeline.service';
import { ApprovalAttachmentService } from './approval-attachment.service';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

export class ApprovalController {
  /**
   * GET /api/approval-requests/:requestId/timeline
   */
  static async getTimeline(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requestId = req.approvalAccess?.canonicalRequestId || req.params.requestId;
      const events = await ApprovalTimelineService.getTimelineForRequest(requestId);

      return res.status(200).json({
        success: true,
        requestId,
        events,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/approval-requests/:requestId/attachments
   */
  static async getAttachments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requestId = req.approvalAccess?.canonicalRequestId || req.params.requestId;
      const attachments = await ApprovalAttachmentService.getAttachmentsForRequest(requestId);

      return res.status(200).json({
        success: true,
        requestId,
        attachments,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/approval-requests/:requestId/attachments/:attachmentId/download
   */
  static async downloadAttachment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { attachmentId } = req.params;
      const attachment = await (prisma as any).approvalAttachment.findUnique({
        where: { id: attachmentId },
      });

      if (!attachment || attachment.status === 'DELETED') {
        return res.status(404).json({ success: false, error: 'Attachment not found or deleted' });
      }
      if (!req.approvalAccess?.allowedRequestIds.includes(attachment.requestId)) {
        return res.status(403).json({ success: false, error: 'This attachment does not belong to the authorized approval request' });
      }

      // Return metadata & stream/download
      return res.status(200).json({
        success: true,
        data: {
          id: attachment.id,
          fileName: attachment.originalFileName || attachment.fileName,
          mimeType: attachment.mimeType,
          fileSize: attachment.fileSize,
          storageKey: attachment.storageKey,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/approval-requests/:requestId/details
   * Authoritative real-world details for the drawer with role consistency checks
   */
  static async getRequestDetails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requestedRequestId = req.params.requestId;
      const requestId = req.approvalAccess?.canonicalRequestId || requestedRequestId;

      // 1. Check ApprovalAssignment
      const assignment = await (prisma as any).approvalAssignment.findFirst({
        where: { OR: [{ id: requestId }, { requestId: requestId }] },
        include: { delegation: true },
      });

      const actualRequestId = assignment?.requestId || requestId;

      // Extract request number from title pattern (e.g. FL-2026-0008)
      const titleMatch = (assignment?.title || requestId || '').match(/([A-Z]+-\d{4}-\d+)/i);
      const extractedReqNo = titleMatch ? titleMatch[1] : null;

      // 2. Query FacultyLeaveRequest
      const leave = await (prisma as any).facultyLeaveRequest.findFirst({
        where: {
          OR: [
            { id: actualRequestId },
            { requestNumber: actualRequestId },
            ...(extractedReqNo ? [{ requestNumber: extractedReqNo }, { id: extractedReqNo }] : []),
            ...(requestId ? [{ id: requestId }, { requestNumber: requestId }] : []),
          ],
        },
        include: {
          faculty: {
            include: {
              department: true,
              user: { include: { role: true } },
            },
          },
          department: true,
        },
      });

      // 3. Query WorkflowRequest
      const wf = await prisma.workflowRequest.findFirst({
        where: {
          OR: [
            { id: actualRequestId },
            ...(extractedReqNo ? [{ id: extractedReqNo }] : []),
          ],
        },
        include: {
          facultyRequester: { include: { department: true, user: { include: { role: true } } } },
          student: { include: { department: true, section: true } },
        },
      });

      // Assemble unified details
      let details: any = null;

      if (leave) {
        const isOd = leave.leaveType === 'ON_DUTY';
        const roleName = leave.faculty?.user?.role?.name || 'Executive';
        const deptName = leave.department?.name || leave.faculty?.department?.name || 'Academic Department';
        const empId = leave.faculty?.employeeId || `EMP-${leave.faculty?.id?.slice(0, 6)}`;
        const applicantName = leave.faculty ? `${leave.faculty.firstName} ${leave.faculty.lastName}`.trim() : 'Applicant';

        // Check for inconsistency (e.g. Medical leave with conference reason)
        let warning: string | null = null;
        if (leave.leaveType === 'MEDICAL_LEAVE' && (leave.reason || '').toLowerCase().includes('conference')) {
          warning = 'Request category (Medical Leave) and submitted reason (Conference) do not match. Please verify before processing.';
        }

        details = {
          id: leave.id,
          requestNumber: leave.requestNumber,
          requestType: isOd ? 'FACULTY_OD' : 'FACULTY_LEAVE',
          title: `[${roleName}] ${leave.leaveType.replace(/_/g, ' ')}: ${leave.requestNumber}`,
          leaveType: leave.leaveType,
          reason: leave.reason || `Casual Leave application for ${leave.totalDays || 1} day(s)`,
          startDate: leave.startDate ? new Date(leave.startDate).toISOString() : null,
          endDate: leave.endDate ? new Date(leave.endDate).toISOString() : null,
          totalDays: leave.totalDays || 1,
          status: assignment?.status || leave.status || 'PENDING',
          currentStage: assignment?.assignedRole === 'ACTING_PRINCIPAL' ? 'Acting Principal Review' : 'Principal Review',
          assignedRole: assignment?.assignedRole || 'PRINCIPAL',
          actionByRole: assignment?.actionByRole || null,
          actionAsRole: assignment?.actionAsRole || null,
          applicant: {
            id: leave.faculty?.id,
            name: applicantName,
            departmentName: deptName,
            submittedAsRole: roleName,
            primaryEmploymentRole: leave.faculty?.designation || 'Associate Professor',
            additionalResponsibility: roleName.includes('HOD') || roleName.includes('Dean') ? roleName : null,
            employeeId: empId,
          },
          submittedAt: leave.createdAt ? new Date(leave.createdAt).toISOString() : new Date().toISOString(),
          warning,
        };
      } else if (wf) {
        const isFaculty = Boolean(wf.facultyRequester);
        const applicantName = isFaculty
          ? `${wf.facultyRequester?.firstName} ${wf.facultyRequester?.lastName}`.trim()
          : `${wf.student?.firstName} ${wf.student?.lastName}`.trim();
        const roleName = isFaculty ? (wf.facultyRequester?.user?.role?.name || 'Faculty') : 'Student';
        const deptName = isFaculty
          ? wf.facultyRequester?.department?.name || 'Academic Department'
          : wf.student?.department?.name || 'Department';

        details = {
          id: wf.id,
          requestNumber: wf.id.slice(0, 8),
          requestType: wf.type,
          title: wf.title || `Workflow Request (${wf.type})`,
          reason: wf.reason || wf.title || 'Official authorization request submitted for review',
          startDate: wf.startDate ? new Date(wf.startDate).toISOString() : null,
          endDate: wf.endDate ? new Date(wf.endDate).toISOString() : null,
          status: assignment?.status || wf.status || 'PENDING',
          currentStage: `${wf.currentStep} Review`,
          assignedRole: assignment?.assignedRole || wf.currentStep,
          applicant: {
            id: isFaculty ? wf.facultyRequester?.id : wf.student?.id,
            name: applicantName,
            departmentName: deptName,
            submittedAsRole: roleName,
            employeeId: isFaculty ? `EMP-${wf.facultyRequester?.id?.slice(0, 6)}` : `ADM-${wf.student?.admissionNo || wf.student?.id?.slice(0, 6)}`,
          },
          submittedAt: wf.createdAt ? new Date(wf.createdAt).toISOString() : new Date().toISOString(),
        };
      } else if (assignment) {
        details = {
          id: assignment.id,
          requestNumber: assignment.requestId?.slice(0, 8) || assignment.id.slice(0, 8),
          requestType: assignment.requestType,
          title: assignment.title,
          reason: assignment.actionRemarks || (assignment.title ? `Official authorization request for ${assignment.title}` : 'Official leave authorization request submitted'),
          status: assignment.status,
          currentStage: assignment.assignedRole === 'ACTING_PRINCIPAL' ? 'Acting Principal Review' : 'Principal Review',
          assignedRole: assignment.assignedRole,
          applicant: {
            name: assignment.applicantName || 'Applicant',
            departmentName: assignment.departmentName || 'Academic Department',
            submittedAsRole: 'Executive',
          },
          submittedAt: assignment.createdAt ? new Date(assignment.createdAt).toISOString() : new Date().toISOString(),
        };
      }

      if (!details) {
        return res.status(404).json({ success: false, error: 'Request details not found' });
      }

      return res.status(200).json({
        success: true,
        data: details,
      });
    } catch (error: any) {
      next(error);
    }
  }
}
