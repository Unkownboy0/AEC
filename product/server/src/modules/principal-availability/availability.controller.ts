import { Response } from 'express';
import { AuthenticatedRequest, authorizeDelegatedAssignmentAction, authorizeDirectPrincipalAction, DelegatedAction } from './delegation.guard';
import { PrincipalAvailabilityResolver } from './availability.resolver';
import { PrincipalAvailabilityService } from './availability.service';
import { PrincipalRequestRoutingService } from './request-routing.service';
import { ApprovalTimelineService } from '../approvals/approval-timeline.service';
import { HandoverService } from './handover.service';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { NotificationService } from '../notifications/notification.service';
import { broadcastRBACUpdate } from '../../lib/socket';

export class PrincipalAvailabilityController {
  private static async completeDirectActionSideEffects(params: { requestId: string; assignmentId?: string; action: 'APPROVED' | 'REJECTED' | 'RETURNED'; actorId: string; remarks: string; ip?: string; userAgent?: string }) {
    const [workflow, leave] = await Promise.all([
      prisma.workflowRequest.findUnique({ where: { id: params.requestId }, include: { student: { include: { user: true } }, facultyRequester: { include: { user: true } } } }),
      (prisma as any).facultyLeaveRequest.findFirst({ where: { OR: [{ id: params.requestId }, { requestNumber: params.requestId }] }, include: { faculty: { include: { user: true } } } }),
    ]);
    const applicantRecipientId = workflow?.student?.user?.id || workflow?.facultyRequester?.user?.id || leave?.faculty?.user?.id;
    const recipientId = applicantRecipientId || params.actorId;
    await NotificationService.sendNotification({
        recipientId,
        eventType: `PRINCIPAL_REQUEST_${params.action}`,
        title: applicantRecipientId ? `Request ${params.action.toLowerCase()}` : `Principal action recorded`,
        message: applicantRecipientId
          ? `The Principal ${params.action.toLowerCase()} your request. ${params.remarks}`
          : `Request ${params.requestId} was ${params.action.toLowerCase()}. The legacy request has no linked recipient account.`,
        relatedEntityType: 'APPROVAL_REQUEST', relatedEntityId: params.requestId,
        deepLinkRoute: workflow?.studentId ? '/student/leave-od' : '/faculty/leave-od',
        deliveryChannel: 'IN_APP',
      });
    await prisma.auditLog.create({ data: {
      actorId: params.actorId, action: params.action, entityType: 'APPROVAL_REQUEST', entityId: params.requestId,
      description: `Principal ${params.action.toLowerCase()} request ${params.requestId}`,
      newValues: JSON.stringify({ status: params.action, remarks: params.remarks, notificationRecipientId: recipientId, applicantRecipientResolved: Boolean(applicantRecipientId) }),
      ipAddress: params.ip, userAgent: params.userAgent,
    } });
    broadcastRBACUpdate({ type: 'APPROVAL_UPDATED', userId: recipientId, payload: { requestId: params.requestId, status: params.action } });
    broadcastRBACUpdate({ type: 'DASHBOARD_UPDATED', userId: params.actorId, payload: { source: 'PRINCIPAL_APPROVAL', requestId: params.requestId } });
  }
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
      const context = await PrincipalAvailabilityResolver.resolveContext();
      const role = String(req.user?.role || '').toUpperCase().replace(/[\s_]+/g, '');
      const isVpRequest = role === 'VP' || role === 'VICEPRINCIPAL';
      const isDesignatedVp = Boolean(isVpRequest && context.actingPrincipal?.userId === req.user?.id && context.delegationStatus === 'ACTIVE');
      const personalizedContext = isVpRequest && !isDesignatedVp
        ? { ...context, actingPrincipal: null, delegation: null, canVpActAsPrincipal: false, pendingActingRequests: 0 }
        : context;
      return res.status(200).json({
        success: true,
        data: personalizedContext,
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
   * Deny-by-default check that the current VP is actually entitled to act on this specific
   * delegated assignment right now (active delegation, correct delegate, category actually
   * delegated, assignment still pending). Writes a denial audit row and 403/409 response on failure.
   */
  private static async authorizeDelegatedAction(
    res: Response,
    assignment: { id: string; assignedUserId: string; assignedRole: string; requestType: string; status: string; delegationId?: string | null; departmentId?: string | null; workflowStage?: string | null; financialAmount?: number | null },
    vpUserId: string,
    action: DelegatedAction
  ): Promise<boolean> {
    const context = await PrincipalAvailabilityResolver.resolveContext();
    const result = authorizeDelegatedAssignmentAction(context, assignment, vpUserId, action);

    if (!result.ok) {
      try {
        await (prisma as any).delegationActionLog.create({
          data: {
            delegationId: assignment.delegationId || context.delegation?.id || null,
            module: assignment.requestType,
            recordId: assignment.id,
            actionType: 'DENIED',
            performedByUserId: vpUserId,
            performedByRole: 'VICE_PRINCIPAL',
            performedAsRole: 'ACTING_PRINCIPAL',
            remarks: `${result.code}: ${result.error}`,
          },
        });
      } catch (err) {}

      res.status(result.status).json({ success: false, code: result.code, error: result.error });
      return false;
    }

    return true;
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

      // Scoped to this VP only — assignedRole alone is not sufficient since a different VP's
      // historical delegated assignments would otherwise leak into this VP's queue.
      const assignments = await (prisma as any).approvalAssignment.findMany({
        where: { assignedUserId: vpUserId },
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

      const vpUserId = req.user?.id || '';
      if (assignment.assignedUserId !== vpUserId) {
        return res.status(403).json({ success: false, code: 'ASSIGNMENT_NOT_DELEGATED', error: 'This request is not assigned to you.' });
      }

      if (!req.actingDelegationId || assignment.delegationId !== req.actingDelegationId) {
        return res.status(403).json({ success: false, code: 'DELEGATION_MISMATCH', error: 'This request is outside the current active delegation.' });
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

      if (!(await PrincipalAvailabilityController.authorizeDelegatedAction(res, assignment, vpUserId, 'approve'))) {
        return;
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

      if (!(await PrincipalAvailabilityController.authorizeDelegatedAction(res, assignment, vpUserId, 'reject'))) {
        return;
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

      if (!(await PrincipalAvailabilityController.authorizeDelegatedAction(res, assignment, vpUserId, 'return'))) {
        return;
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

      if (!(await PrincipalAvailabilityController.authorizeDelegatedAction(res, assignment, vpUserId, 'request-info'))) {
        return;
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

      await (prisma as any).delegationActionLog.create({
        data: { delegationId: assignment.delegationId, module: assignment.requestType, recordId: assignment.requestId, actionType: 'REQUESTED_INFORMATION', performedByUserId: vpUserId, performedByRole: 'VICE_PRINCIPAL', performedAsRole: 'ACTING_PRINCIPAL', remarks },
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

      const authResult = authorizeDirectPrincipalAction(req.user?.role, principalUserId, assignment);
      if (!authResult.ok) {
        return res.status(authResult.status).json({ success: false, code: authResult.code, error: authResult.error });
      }

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

      await PrincipalAvailabilityController.completeDirectActionSideEffects({ requestId: targetReqId, assignmentId: assignment?.id, action: 'APPROVED', actorId: principalUserId, remarks, ip: req.ip, userAgent: req.headers['user-agent'] });

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

      const authResult = authorizeDirectPrincipalAction(req.user?.role, principalUserId, assignment);
      if (!authResult.ok) {
        return res.status(authResult.status).json({ success: false, code: authResult.code, error: authResult.error });
      }

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

      await PrincipalAvailabilityController.completeDirectActionSideEffects({ requestId: targetReqId, assignmentId: assignment?.id, action: 'REJECTED', actorId: principalUserId, remarks, ip: req.ip, userAgent: req.headers['user-agent'] });

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

  /** POST /api/principal/approval-center/requests/:id/return */
  static async returnPrincipalRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const assignmentId = req.params.id;
      const principalUserId = req.user?.id || 'SYSTEM_PRINCIPAL';
      const remarks = String(req.body?.remarks || '').trim();
      if (remarks.length < 3) return res.status(400).json({ success: false, error: 'Return remarks are required' });
      const assignment = await (prisma as any).approvalAssignment.findFirst({ where: { OR: [{ id: assignmentId }, { requestId: assignmentId }] } });
      const authResult = authorizeDirectPrincipalAction(req.user?.role, principalUserId, assignment);
      if (!authResult.ok) return res.status(authResult.status).json({ success: false, code: authResult.code, error: authResult.error });
      const targetReqId = assignment.requestId;

      await prisma.$transaction(async (tx) => {
        await (tx as any).approvalAssignment.update({ where: { id: assignment.id }, data: { status: 'RETURNED', returnedAt: new Date(), completedAt: new Date(), actionByUserId: principalUserId, actionByRole: 'PRINCIPAL', actionAsRole: 'PRINCIPAL', actionRemarks: remarks } });
        await (tx as any).facultyLeaveRequest.updateMany({ where: { OR: [{ id: targetReqId }, { requestNumber: targetReqId }] }, data: { status: 'RETURNED_BY_PRINCIPAL', principalRemarks: remarks } });
        await tx.workflowRequest.updateMany({ where: { id: targetReqId }, data: { status: 'CLARIFICATION_REQUESTED', currentStep: 'HOD' } });
      });
      await ApprovalTimelineService.recordEvent({ requestId: targetReqId, eventType: 'RETURNED', fromStage: 'PRINCIPAL', toStage: 'HOD', fromStatus: 'PENDING', toStatus: 'CLARIFICATION_REQUESTED', actorUserId: principalUserId, actorNameSnapshot: req.user?.email || 'Principal Executive', actorRole: 'PRINCIPAL', actorDisplayRole: 'Principal Executive', performedAsRole: 'PRINCIPAL', remarks, idempotencyKey: `${targetReqId}:RETURNED:${Date.now()}` });
      await PrincipalAvailabilityController.completeDirectActionSideEffects({ requestId: targetReqId, assignmentId: assignment.id, action: 'RETURNED', actorId: principalUserId, remarks, ip: req.ip, userAgent: req.headers['user-agent'] });
      return res.status(200).json({ success: true, message: 'Request returned for correction' });
    } catch (error: any) { return res.status(500).json({ success: false, error: error.message || 'Failed to return request' }); }
  }
}
