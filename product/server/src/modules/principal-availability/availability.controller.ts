import { Response } from 'express';
import { AuthenticatedRequest } from './delegation.guard';
import { PrincipalAvailabilityResolver } from './availability.resolver';
import { PrincipalAvailabilityService } from './availability.service';
import { PrincipalRequestRoutingService } from './request-routing.service';
import { ApprovalTimelineService } from '../approvals/approval-timeline.service';
import { HandoverService } from './handover.service';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

export class PrincipalAvailabilityController {
  /**
   * GET /api/principal/availability/eligible-delegates
   */
  static async getEligibleDelegates(req: AuthenticatedRequest, res: Response) {
    try {
      const delegates = await PrincipalAvailabilityService.getEligibleDelegates();
      return res.status(200).json({
        success: true,
        data: delegates,
      });
    } catch (error: any) {
      logger.error('Error fetching eligible delegates:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch eligible delegates',
      });
    }
  }

  /**
   * GET /api/principal/availability/context & GET /api/vp/acting-principal/context
   */
  static async getContext(req: AuthenticatedRequest, res: Response) {
    try {
      const context = await PrincipalAvailabilityResolver.resolveContext(req.user?.id);
      return res.status(200).json({
        success: true,
        data: context,
      });
    } catch (error: any) {
      logger.error('Error fetching principal availability context:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch availability context',
      });
    }
  }

  /**
   * POST /api/principal/availability
   */
  static async updateAvailability(req: AuthenticatedRequest, res: Response) {
    try {
      const principalUserId = req.user?.id || 'SYSTEM_PRINCIPAL';
      const updatedContext = await PrincipalAvailabilityService.updateAvailability(principalUserId, req.body);
      return res.status(200).json({
        success: true,
        message: 'Principal availability status updated successfully',
        data: updatedContext,
      });
    } catch (error: any) {
      logger.error('Error updating principal availability:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Failed to update availability status',
      });
    }
  }

  /**
   * Helper to ensure all pending faculty leave & workflow requests have approval assignments
   */
  private static async ensurePendingRequestsSynced() {
    try {
      // 1. Sync pending facultyLeaveRequest items
      const pendingLeaves = await (prisma as any).facultyLeaveRequest.findMany({
        where: {
          status: { in: ['PENDING_PRINCIPAL', 'SUBMITTED', 'PENDING', 'APPROVED_HOD'] },
        },
        include: {
          faculty: { select: { firstName: true, lastName: true } },
          department: { select: { name: true } },
        },
      });

      for (const leave of pendingLeaves) {
        const existing = await (prisma as any).approvalAssignment.findFirst({
          where: { requestId: leave.id },
        });

        if (!existing) {
          const isOd = leave.leaveType === 'ON_DUTY';
          const reqType = isOd ? 'FACULTY_OD' : 'FACULTY_LEAVE';
          await PrincipalRequestRoutingService.createApprovalAssignment({
            requestId: leave.id,
            requestType: reqType,
            title: `[Executive] ${leave.leaveType.replace('_', ' ')}: ${leave.requestNumber || leave.id.slice(0, 8)}`,
            applicantName: `${leave.faculty?.firstName || 'Faculty'} ${leave.faculty?.lastName || ''}`.trim(),
            departmentName: leave.department?.name || 'Academic Department',
          });
        }
      }

      // 2. Sync pending workflowRequest items at PRINCIPAL step
      const pendingWorkflows = await prisma.workflowRequest.findMany({
        where: {
          currentStep: 'PRINCIPAL',
          status: 'PENDING',
        },
        include: {
          facultyRequester: { include: { user: { include: { role: true } } } },
          student: true,
        },
      });

      for (const wf of pendingWorkflows) {
        const existing = await (prisma as any).approvalAssignment.findFirst({
          where: { requestId: wf.id },
        });

        if (!existing) {
          const isOd = (wf.type || '').toUpperCase().includes('OD');
          const isFaculty = Boolean(wf.facultyRequester);
          const reqRole = isFaculty ? (wf.facultyRequester?.user?.role?.name || 'Executive') : 'Student';
          const reqType = isFaculty ? (isOd ? 'FACULTY_OD' : 'FACULTY_LEAVE') : (isOd ? 'STUDENT_OD' : 'STUDENT_LEAVE');
          const applicantName = isFaculty
            ? `${wf.facultyRequester?.firstName || ''} ${wf.facultyRequester?.lastName || ''}`.trim()
            : `${wf.student?.firstName || ''} ${wf.student?.lastName || ''}`.trim();

          await PrincipalRequestRoutingService.createApprovalAssignment({
            requestId: wf.id,
            requestType: reqType,
            title: `[${reqRole}] ${wf.type}: ${wf.title}`,
            applicantName: applicantName || 'Executive Applicant',
            departmentName: 'Academic Department',
          });
        }
      }
    } catch (err) {
      logger.warn('Error auto-syncing pending requests to approval assignments:', err);
    }
  }

  /**
   * GET /api/principal/approval-center
   */
  static async getPrincipalApprovalCenter(req: AuthenticatedRequest, res: Response) {
    try {
      await PrincipalAvailabilityController.ensurePendingRequestsSynced();
      const context = await PrincipalAvailabilityResolver.resolveContext(req.user?.id);
      const principalUserId = req.user?.id || 'SYSTEM_PRINCIPAL';

      // Fetch all relevant assignments for Principal (including delegated and VP-handled)
      const assignments = await (prisma as any).approvalAssignment.findMany({
        where: {
          OR: [
            { assignedUserId: principalUserId },
            { assignedRole: 'ACTING_PRINCIPAL' },
            { actionAsRole: 'ACTING_PRINCIPAL' },
            { delegationId: { not: null } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        include: { delegation: true },
      });

      // Enrich assignments with applicant's leave reason
      const reqIds = assignments.map((a: any) => a.requestId);
      const leaves = await (prisma as any).facultyLeaveRequest.findMany({
        where: { OR: [{ id: { in: reqIds } }, { requestNumber: { in: reqIds } }] },
      });
      const leaveMap = new Map();
      leaves.forEach((l: any) => {
        leaveMap.set(l.id, l);
        leaveMap.set(l.requestNumber, l);
      });

      const enrichedRequests = assignments.map((a: any) => {
        const matchNo = (a.title || '').match(/([A-Z]+-\d{4}-\d+)/i);
        const l = leaveMap.get(a.requestId) || (matchNo ? leaveMap.get(matchNo[1]) : null);
        return {
          ...a,
          reason: l?.reason || a.actionRemarks || `Leave Application for ${a.title?.replace(/\[.*?\]\s*/g, '') || 'Official Authorization'}`,
        };
      });

      const pending = enrichedRequests.filter((a: any) => a.status === 'PENDING');
      const approved = enrichedRequests.filter((a: any) => a.status === 'APPROVED');
      const rejected = enrichedRequests.filter((a: any) => a.status === 'REJECTED');
      const returned = enrichedRequests.filter((a: any) => a.assignmentType === 'RETURNED_TO_PRINCIPAL' || a.status === 'RETURNED');

      return res.status(200).json({
        success: true,
        data: {
          context,
          summaryCards: {
            pendingCount: pending.length,
            approvedTodayCount: approved.length,
            rejectedTodayCount: rejected.length,
            returnedCount: returned.length,
            urgentCount: pending.filter((p: any) => (p.title || '').toLowerCase().includes('urgent')).length,
          },
          requests: enrichedRequests,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch Principal approval center queue',
      });
    }
  }

  /**
   * GET /api/vp/acting-principal/approval-center & GET /api/vp/acting-principal/approvals
   */
  static async getVpDelegatedApprovalCenter(req: AuthenticatedRequest, res: Response) {
    try {
      await PrincipalAvailabilityController.ensurePendingRequestsSynced();
      const context = await PrincipalAvailabilityResolver.resolveContext();
      if (!context.canVpActAsPrincipal || !context.actingPrincipal) {
        return res.status(403).json({
          success: false,
          code: 'DELEGATION_INACTIVE',
          error: 'Principal is currently Available. VP Acting Principal mode is inactive.',
        });
      }

      const vpUserId = req.user?.id || context.actingPrincipal.userId;

      const assignments = await (prisma as any).approvalAssignment.findMany({
        where: {
          OR: [
            { assignedUserId: vpUserId },
            { assignedRole: 'ACTING_PRINCIPAL' },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      // Enrich assignments with applicant's leave reason
      const reqIds = assignments.map((a: any) => a.requestId);
      const leaves = await (prisma as any).facultyLeaveRequest.findMany({
        where: { OR: [{ id: { in: reqIds } }, { requestNumber: { in: reqIds } }] },
      });
      const leaveMap = new Map();
      leaves.forEach((l: any) => {
        leaveMap.set(l.id, l);
        leaveMap.set(l.requestNumber, l);
      });

      const enrichedRequests = assignments.map((a: any) => {
        const matchNo = (a.title || '').match(/([A-Z]+-\d{4}-\d+)/i);
        const l = leaveMap.get(a.requestId) || (matchNo ? leaveMap.get(matchNo[1]) : null);
        return {
          ...a,
          reason: l?.reason || a.actionRemarks || `Leave Application for ${a.title?.replace(/\[.*?\]\s*/g, '') || 'Official Authorization'}`,
        };
      });

      const pending = enrichedRequests.filter((a: any) => a.status === 'PENDING');
      const approvedToday = enrichedRequests.filter((a: any) => a.status === 'APPROVED');
      const rejectedToday = enrichedRequests.filter((a: any) => a.status === 'REJECTED');
      const returned = enrichedRequests.filter((a: any) => a.status === 'RETURNED' || a.status === 'NEEDS_INFORMATION');
      const urgent = pending.filter((p: any) => (p.title || '').toLowerCase().includes('urgent') || p.isUrgent);

      return res.status(200).json({
        success: true,
        data: {
          context,
          counts: {
            pending: pending.length,
            urgent: urgent.length,
            approvedToday: approvedToday.length,
            rejectedToday: rejectedToday.length,
            returned: returned.length,
          },
          pendingRequests: pending,
          processedRequests: enrichedRequests.filter((a: any) => a.status !== 'PENDING'),
          requests: enrichedRequests,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch VP delegated approval queue',
      });
    }
  }

  /**
   * GET /api/vp/acting-principal/approvals/:id
   */
  static async getDelegatedRequestDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const requestId = req.params.id;
      const assignment = await (prisma as any).approvalAssignment.findFirst({
        where: {
          OR: [
            { id: requestId },
            { requestId: requestId },
          ],
        },
      });

      if (!assignment) {
        return res.status(404).json({ success: false, error: 'Approval request not found' });
      }

      return res.status(200).json({
        success: true,
        data: assignment,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch delegated request details',
      });
    }
  }

  /**
   * POST /api/vp/acting-principal/approvals/:id/approve
   */
  static async approveDelegatedRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const assignmentId = req.params.id;
      const vpUserId = req.user?.id || 'VP_USER';
      const vpUser = req.user ? `${req.user.email}` : 'Dr. Vice Principal';
      const remarks = req.body.remarks || 'Approved by Vice Principal in Acting Principal Mode';

      const assignment = await (prisma as any).approvalAssignment.findFirst({
        where: { OR: [{ id: assignmentId }, { requestId: assignmentId }] },
      });

      if (!assignment) {
        return res.status(404).json({ success: false, error: 'Approval assignment not found' });
      }

      // Update assignment record
      const updatedAssignment = await (prisma as any).approvalAssignment.update({
        where: { id: assignment.id },
        data: {
          status: 'APPROVED',
          completedAt: new Date(),
          actionByUserId: vpUserId,
          actionByRole: 'VICE_PRINCIPAL',
          actionAsRole: 'ACTING_PRINCIPAL',
          actionRemarks: remarks,
        },
      });

      // Update underlying FacultyLeaveRequest if applicable
      try {
        await (prisma as any).facultyLeaveRequest.updateMany({
          where: { id: assignment.requestId },
          data: {
            status: 'APPROVED_PRINCIPAL',
            principalApprovedAt: new Date(),
            principalRemarks: `${remarks} (Approved by Vice Principal — Acting Principal)`,
          },
        });
      } catch (err) {}

      // Update underlying WorkflowRequest if applicable
      try {
        await prisma.workflowRequest.updateMany({
          where: { id: assignment.requestId },
          data: {
            status: 'APPROVED',
          },
        });
      } catch (err) {}

      // Record Workflow Timeline Event
      await ApprovalTimelineService.recordEvent({
        requestId: assignment.requestId || assignment.id,
        eventType: 'APPROVED',
        fromStage: assignment.assignedRole || 'PRINCIPAL',
        toStage: 'APPROVED',
        fromStatus: 'PENDING',
        toStatus: 'APPROVED',
        actorUserId: vpUserId,
        actorNameSnapshot: 'Dr. Meenakshi Sundaram',
        actorRole: 'VICE_PRINCIPAL',
        actorDisplayRole: 'Vice Principal — Acting Principal',
        performedAsRole: 'ACTING_PRINCIPAL',
        delegationId: assignment.delegationId,
        remarks,
        idempotencyKey: `${assignment.requestId}:APPROVED:${Date.now()}`,
      });

      // Audit Log with full attribution
      await (prisma as any).delegationActionLog.create({
        data: {
          delegationId: assignment.delegationId || null,
          module: assignment.requestType,
          recordId: assignment.requestId,
          actionType: 'APPROVED',
          performedByUserId: vpUserId,
          performedByRole: 'VICE_PRINCIPAL',
          performedAsRole: 'ACTING_PRINCIPAL',
          remarks,
        },
      });

      return res.status(200).json({
        success: true,
        message: `Request approved by Dr. ${vpUser} (Vice Principal — Acting Principal)`,
        data: updatedAssignment,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to process VP approval action',
      });
    }
  }

  /**
   * POST /api/vp/acting-principal/approvals/:id/reject
   */
  static async rejectDelegatedRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const assignmentId = req.params.id;
      const vpUserId = req.user?.id || 'VP_USER';
      const remarks = req.body.remarks || 'Rejected by Vice Principal in Acting Principal Mode';

      const assignment = await (prisma as any).approvalAssignment.findFirst({
        where: { OR: [{ id: assignmentId }, { requestId: assignmentId }] },
      });

      if (!assignment) {
        return res.status(404).json({ success: false, error: 'Approval assignment not found' });
      }

      const updatedAssignment = await (prisma as any).approvalAssignment.update({
        where: { id: assignment.id },
        data: {
          status: 'REJECTED',
          completedAt: new Date(),
          actionByUserId: vpUserId,
          actionByRole: 'VICE_PRINCIPAL',
          actionAsRole: 'ACTING_PRINCIPAL',
          actionRemarks: remarks,
        },
      });

      // Update underlying FacultyLeaveRequest if applicable
      try {
        await (prisma as any).facultyLeaveRequest.updateMany({
          where: { id: assignment.requestId },
          data: {
            status: 'REJECTED_PRINCIPAL',
            principalRemarks: `${remarks} (Rejected by Vice Principal — Acting Principal)`,
          },
        });
      } catch (err) {}

      // Update underlying WorkflowRequest if applicable
      try {
        await prisma.workflowRequest.updateMany({
          where: { id: assignment.requestId },
          data: {
            status: 'REJECTED',
          },
        });
      } catch (err) {}

      // Record Workflow Timeline Event
      await ApprovalTimelineService.recordEvent({
        requestId: assignment.requestId || assignment.id,
        eventType: 'REJECTED',
        fromStage: assignment.assignedRole || 'PRINCIPAL',
        toStage: 'REJECTED',
        fromStatus: 'PENDING',
        toStatus: 'REJECTED',
        actorUserId: vpUserId,
        actorNameSnapshot: 'Dr. Meenakshi Sundaram',
        actorRole: 'VICE_PRINCIPAL',
        actorDisplayRole: 'Vice Principal — Acting Principal',
        performedAsRole: 'ACTING_PRINCIPAL',
        delegationId: assignment.delegationId,
        remarks,
        idempotencyKey: `${assignment.requestId}:REJECTED:${Date.now()}`,
      });

      await (prisma as any).delegationActionLog.create({
        data: {
          delegationId: assignment.delegationId || null,
          module: assignment.requestType,
          recordId: assignment.requestId,
          actionType: 'REJECTED',
          performedByUserId: vpUserId,
          performedByRole: 'VICE_PRINCIPAL',
          performedAsRole: 'ACTING_PRINCIPAL',
          remarks,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Request rejected by Vice Principal (Acting Principal)',
        data: updatedAssignment,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to process VP rejection action',
      });
    }
  }

  /**
   * POST /api/vp/acting-principal/approvals/:id/return
   */
  static async returnDelegatedRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const assignmentId = req.params.id;
      const vpUserId = req.user?.id || 'VP_USER';
      const remarks = req.body.remarks || 'Returned by Vice Principal in Acting Principal Mode for revisions';

      const assignment = await (prisma as any).approvalAssignment.findFirst({
        where: { OR: [{ id: assignmentId }, { requestId: assignmentId }] },
      });

      if (!assignment) {
        return res.status(404).json({ success: false, error: 'Approval assignment not found' });
      }

      const updatedAssignment = await (prisma as any).approvalAssignment.update({
        where: { id: assignment.id },
        data: {
          status: 'RETURNED',
          completedAt: new Date(),
          actionByUserId: vpUserId,
          actionByRole: 'VICE_PRINCIPAL',
          actionAsRole: 'ACTING_PRINCIPAL',
          actionRemarks: remarks,
        },
      });

      await (prisma as any).delegationActionLog.create({
        data: {
          delegationId: assignment.delegationId || null,
          module: assignment.requestType,
          recordId: assignment.requestId,
          actionType: 'RETURNED',
          performedByUserId: vpUserId,
          performedByRole: 'VICE_PRINCIPAL',
          performedAsRole: 'ACTING_PRINCIPAL',
          remarks,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Request returned by Vice Principal (Acting Principal)',
        data: updatedAssignment,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to return request',
      });
    }
  }

  /**
   * POST /api/vp/acting-principal/approvals/:id/request-info
   */
  static async requestInfoDelegatedRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const assignmentId = req.params.id;
      const vpUserId = req.user?.id || 'VP_USER';
      const remarks = req.body.remarks || 'Additional information requested by Vice Principal in Acting Principal Mode';

      const assignment = await (prisma as any).approvalAssignment.findFirst({
        where: { OR: [{ id: assignmentId }, { requestId: assignmentId }] },
      });

      if (!assignment) {
        return res.status(404).json({ success: false, error: 'Approval assignment not found' });
      }

      const updatedAssignment = await (prisma as any).approvalAssignment.update({
        where: { id: assignment.id },
        data: {
          status: 'NEEDS_INFORMATION',
          actionByUserId: vpUserId,
          actionByRole: 'VICE_PRINCIPAL',
          actionAsRole: 'ACTING_PRINCIPAL',
          actionRemarks: remarks,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Information requested by Vice Principal (Acting Principal)',
        data: updatedAssignment,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to request information',
      });
    }
  }

  /**
   * POST /api/vp/acting-principal/acknowledge
   */
  static async acknowledgeDelegation(req: AuthenticatedRequest, res: Response) {
    try {
      const vpUserId = req.user?.id || 'VP_USER';
      return res.status(200).json({
        success: true,
        message: 'VP Acting Principal authority acknowledged successfully',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to acknowledge authority',
      });
    }
  }

  /**
   * GET /api/principal/handover/latest
   */
  static async getLatestHandover(req: AuthenticatedRequest, res: Response) {
    try {
      const principalUserId = req.user?.id || 'SYSTEM_PRINCIPAL';
      const handover = await HandoverService.getLatestHandover(principalUserId);
      return res.status(200).json({
        success: true,
        data: handover,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch latest handover',
      });
    }
  }

  /**
   * POST /api/principal/handover/:id/acknowledge
   */
  static async acknowledgeHandover(req: AuthenticatedRequest, res: Response) {
    try {
      const handoverId = req.params.id;
      const principalUserId = req.user?.id || 'SYSTEM_PRINCIPAL';
      await HandoverService.acknowledgeHandover(handoverId, principalUserId);
      return res.status(200).json({
        success: true,
        message: 'Delegation handover summary acknowledged',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to acknowledge handover',
      });
    }
  }

  /**
   * POST /api/principal/approval-center/requests/:id/approve
   */
  static async approvePrincipalRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const assignmentId = req.params.id;
      const principalUserId = req.user?.id || 'SYSTEM_PRINCIPAL';
      const principalName = req.user ? `${req.user.email}` : 'Principal Executive';
      const remarks = req.body.remarks || 'Approved by Principal Executive';

      const assignment = await (prisma as any).approvalAssignment.findFirst({
        where: {
          OR: [
            { id: assignmentId },
            { requestId: assignmentId },
          ],
        },
      });

      const targetReqId = assignment?.requestId || assignmentId;
      const matchNo = (assignment?.title || assignmentId || '').match(/([A-Z]+-\d{4}-\d+)/i);
      const reqNo = matchNo ? matchNo[1] : null;

      if (assignment) {
        await (prisma as any).approvalAssignment.update({
          where: { id: assignment.id },
          data: {
            status: 'APPROVED',
            completedAt: new Date(),
            actionByUserId: principalUserId,
            actionByRole: 'PRINCIPAL',
            actionAsRole: 'PRINCIPAL',
            actionRemarks: remarks,
          },
        });
      }

      try {
        await (prisma as any).facultyLeaveRequest.updateMany({
          where: {
            OR: [
              { id: targetReqId },
              { requestNumber: targetReqId },
              ...(reqNo ? [{ requestNumber: reqNo }, { id: reqNo }] : []),
            ],
          },
          data: {
            status: 'APPROVED_PRINCIPAL',
            principalApprovedAt: new Date(),
            principalRemarks: remarks,
          },
        });
      } catch (err) {}

      try {
        await prisma.workflowRequest.updateMany({
          where: {
            OR: [
              { id: targetReqId },
              ...(reqNo ? [{ id: reqNo }] : []),
            ],
          },
          data: {
            status: 'APPROVED',
          },
        });
      } catch (err) {}

      await ApprovalTimelineService.recordEvent({
        requestId: targetReqId,
        eventType: 'APPROVED',
        fromStage: 'PRINCIPAL',
        toStage: 'APPROVED',
        fromStatus: 'PENDING',
        toStatus: 'APPROVED',
        actorUserId: principalUserId,
        actorNameSnapshot: principalName,
        actorRole: 'PRINCIPAL',
        actorDisplayRole: 'Principal Executive',
        performedAsRole: 'PRINCIPAL',
        remarks,
        idempotencyKey: `${targetReqId}:APPROVED:${Date.now()}`,
      });

      return res.status(200).json({
        success: true,
        message: 'Request successfully approved by Principal',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to approve request',
      });
    }
  }

  /**
   * POST /api/principal/approval-center/requests/:id/reject
   */
  static async rejectPrincipalRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const assignmentId = req.params.id;
      const principalUserId = req.user?.id || 'SYSTEM_PRINCIPAL';
      const principalName = req.user ? `${req.user.email}` : 'Principal Executive';
      const remarks = req.body.remarks || 'Rejected by Principal Executive';

      const assignment = await (prisma as any).approvalAssignment.findFirst({
        where: {
          OR: [
            { id: assignmentId },
            { requestId: assignmentId },
          ],
        },
      });

      const targetReqId = assignment?.requestId || assignmentId;
      const matchNo = (assignment?.title || assignmentId || '').match(/([A-Z]+-\d{4}-\d+)/i);
      const reqNo = matchNo ? matchNo[1] : null;

      if (assignment) {
        await (prisma as any).approvalAssignment.update({
          where: { id: assignment.id },
          data: {
            status: 'REJECTED',
            completedAt: new Date(),
            actionByUserId: principalUserId,
            actionByRole: 'PRINCIPAL',
            actionAsRole: 'PRINCIPAL',
            actionRemarks: remarks,
          },
        });
      }

      try {
        await (prisma as any).facultyLeaveRequest.updateMany({
          where: {
            OR: [
              { id: targetReqId },
              { requestNumber: targetReqId },
              ...(reqNo ? [{ requestNumber: reqNo }, { id: reqNo }] : []),
            ],
          },
          data: {
            status: 'REJECTED_PRINCIPAL',
            principalRemarks: remarks,
          },
        });
      } catch (err) {}

      try {
        await prisma.workflowRequest.updateMany({
          where: {
            OR: [
              { id: targetReqId },
              ...(reqNo ? [{ id: reqNo }] : []),
            ],
          },
          data: {
            status: 'REJECTED',
          },
        });
      } catch (err) {}

      await ApprovalTimelineService.recordEvent({
        requestId: targetReqId,
        eventType: 'REJECTED',
        fromStage: 'PRINCIPAL',
        toStage: 'REJECTED',
        fromStatus: 'PENDING',
        toStatus: 'REJECTED',
        actorUserId: principalUserId,
        actorNameSnapshot: principalName,
        actorRole: 'PRINCIPAL',
        actorDisplayRole: 'Principal Executive',
        performedAsRole: 'PRINCIPAL',
        remarks,
        idempotencyKey: `${targetReqId}:REJECTED:${Date.now()}`,
      });

      return res.status(200).json({
        success: true,
        message: 'Request rejected by Principal',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to reject request',
      });
    }
  }
}
