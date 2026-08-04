import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { CreateTimelineEventInput, TimelineEventDto } from './approval.types';

export class ApprovalTimelineService {
  /**
   * Record a single workflow timeline event with strict idempotency deduplication
   */
  static async recordEvent(input: CreateTimelineEventInput) {
    try {
      // 1. Idempotency Check
      if (input.idempotencyKey) {
        const existing = await (prisma as any).approvalWorkflowEvent.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        });
        if (existing) {
          logger.info(`Timeline event with idempotencyKey ${input.idempotencyKey} already exists. Skipping.`);
          return existing;
        }
      }

      // 2. Determine sequence number
      const lastEvent = await (prisma as any).approvalWorkflowEvent.findFirst({
        where: { requestId: input.requestId },
        orderBy: { sequenceNumber: 'desc' },
      });
      const sequenceNumber = (lastEvent?.sequenceNumber || 0) + 1;

      // 3. Create Event Record
      const event = await (prisma as any).approvalWorkflowEvent.create({
        data: {
          requestId: input.requestId,
          eventType: input.eventType,
          fromStage: input.fromStage || null,
          toStage: input.toStage || null,
          fromStatus: input.fromStatus || null,
          toStatus: input.toStatus || null,
          actorUserId: input.actorUserId || null,
          actorNameSnapshot: input.actorNameSnapshot,
          actorRole: input.actorRole,
          actorDisplayRole: input.actorDisplayRole || input.actorRole,
          performedAsRole: input.performedAsRole || null,
          delegationId: input.delegationId || null,
          remarks: input.remarks || null,
          attachmentId: input.attachmentId || null,
          metadataJson: input.metadataJson || null,
          sequenceNumber,
          idempotencyKey: input.idempotencyKey || null,
        },
      });

      logger.info(`Recorded Workflow Event [${input.eventType}] for Request ${input.requestId}`);
      return event;
    } catch (err: any) {
      logger.error('Error recording workflow event:', err);
      return null;
    }
  }

  /**
   * Retrieve timeline for a request, with auto-seeding for legacy database records
   */
  static async getTimelineForRequest(requestId: string): Promise<TimelineEventDto[]> {
    // Check if events exist
    let events = await (prisma as any).approvalWorkflowEvent.findMany({
      where: { requestId },
      orderBy: [
        { sequenceNumber: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // Auto-seed legacy records if empty
    if (events.length === 0) {
      await this.autoSeedTimelineForRequest(requestId);
      events = await (prisma as any).approvalWorkflowEvent.findMany({
        where: { requestId },
        orderBy: [
          { sequenceNumber: 'asc' },
          { createdAt: 'asc' },
        ],
      });
    }

    return events.map((e: any) => this.mapEventToDto(e));
  }

  /**
   * Helper to format human-readable event title
   */
  private static mapEventToDto(e: any): TimelineEventDto {
    let title = 'Workflow Event';
    switch (e.eventType) {
      case 'REQUEST_CREATED':
      case 'REQUEST_SUBMITTED':
        title = 'Submitted by Applicant';
        break;
      case 'HOD_RECOMMENDED':
        title = 'Recommended by HOD';
        break;
      case 'HOD_REJECTED':
        title = 'Rejected by HOD';
        break;
      case 'HOD_RETURNED':
        title = 'Returned by HOD';
        break;
      case 'FORWARDED_TO_PRINCIPAL':
        title = 'Forwarded for Principal Approval';
        break;
      case 'DELEGATED_TO_VP':
        title = 'Assigned to Acting Principal';
        break;
      case 'ACTING_PRINCIPAL_VIEWED':
        title = 'Reviewed by Acting Principal';
        break;
      case 'APPROVED':
        title = e.performedAsRole === 'ACTING_PRINCIPAL'
          ? 'Approved by Vice Principal — Acting Principal'
          : 'Approved by Principal';
        break;
      case 'REJECTED':
        title = e.performedAsRole === 'ACTING_PRINCIPAL'
          ? 'Rejected by Vice Principal — Acting Principal'
          : 'Rejected by Principal';
        break;
      case 'RETURNED':
        title = 'Returned for Revisions';
        break;
      case 'CLARIFICATION_REQUESTED':
        title = 'Clarification Requested';
        break;
      case 'ATTACHMENT_UPLOADED':
        title = 'Supporting Document Uploaded';
        break;
      default:
        title = (e.eventType || 'Event').replace(/_/g, ' ');
    }

    let metadata = null;
    if (e.metadataJson) {
      try { metadata = JSON.parse(e.metadataJson); } catch (_) {}
    }

    return {
      id: e.id,
      requestId: e.requestId,
      eventType: e.eventType,
      title,
      fromStage: e.fromStage,
      toStage: e.toStage,
      fromStatus: e.fromStatus,
      toStatus: e.toStatus,
      actor: {
        id: e.actorUserId,
        name: e.actorNameSnapshot || 'System',
        role: e.actorRole || 'SYSTEM',
        displayRole: e.actorDisplayRole || e.actorRole || 'System',
        performedAsRole: e.performedAsRole,
      },
      delegationId: e.delegationId,
      remarks: e.remarks,
      attachmentId: e.attachmentId,
      metadata,
      sequenceNumber: e.sequenceNumber || 1,
      createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Auto-seed timeline events from existing FacultyLeave / WorkflowRequest / Assignment DB rows
   */
  private static async autoSeedTimelineForRequest(requestId: string) {
    try {
      // 1. Check FacultyLeaveRequest
      const leave = await (prisma as any).facultyLeaveRequest.findFirst({
        where: { OR: [{ id: requestId }, { requestNumber: requestId }] },
        include: { faculty: { include: { user: { include: { role: true } } } }, department: true },
      });

      if (leave) {
        const applicantName = leave.faculty ? `${leave.faculty.firstName} ${leave.faculty.lastName}`.trim() : 'Faculty Member';
        const roleName = leave.faculty?.user?.role?.name || 'Faculty';

        // Event 1: SUBMITTED
        await this.recordEvent({
          requestId,
          eventType: 'REQUEST_SUBMITTED',
          fromStage: 'DRAFT',
          toStage: leave.status === 'PENDING_HOD' ? 'PENDING_HOD' : 'PENDING_PRINCIPAL',
          actorUserId: leave.faculty?.userId,
          actorNameSnapshot: applicantName,
          actorRole: roleName,
          actorDisplayRole: roleName,
          remarks: leave.reason,
          idempotencyKey: `${requestId}:REQUEST_SUBMITTED:v1`,
        });

        // Event 2: HOD Recommendation if endorsed
        if (leave.hodApprovedAt || leave.status === 'APPROVED_HOD' || leave.status === 'APPROVED_PRINCIPAL') {
          await this.recordEvent({
            requestId,
            eventType: 'HOD_RECOMMENDED',
            fromStage: 'PENDING_HOD',
            toStage: 'PENDING_PRINCIPAL',
            actorNameSnapshot: leave.department?.name ? `HOD (${leave.department.name})` : 'Head of Department',
            actorRole: 'HOD',
            actorDisplayRole: 'Head of Department',
            remarks: leave.hodRemarks || 'Recommended for approval',
            idempotencyKey: `${requestId}:HOD_RECOMMENDED:v1`,
          });
        }

        // Event 3: Forwarded or Delegated
        const assignment = await (prisma as any).approvalAssignment.findFirst({
          where: { requestId: leave.id },
        });

        if (assignment && assignment.assignedRole === 'ACTING_PRINCIPAL') {
          await this.recordEvent({
            requestId,
            eventType: 'DELEGATED_TO_VP',
            fromStage: 'PENDING_PRINCIPAL',
            toStage: 'ACTING_PRINCIPAL',
            actorNameSnapshot: 'Workflow Engine',
            actorRole: 'SYSTEM',
            actorDisplayRole: 'System Workflow',
            performedAsRole: 'ACTING_PRINCIPAL',
            delegationId: assignment.delegationId,
            remarks: 'Assigned to Vice Principal during Principal absence',
            idempotencyKey: `${requestId}:DELEGATED_TO_VP:v1`,
          });
        } else {
          await this.recordEvent({
            requestId,
            eventType: 'FORWARDED_TO_PRINCIPAL',
            fromStage: 'PENDING_HOD',
            toStage: 'PENDING_PRINCIPAL',
            actorNameSnapshot: 'Workflow Engine',
            actorRole: 'SYSTEM',
            actorDisplayRole: 'System Workflow',
            remarks: 'Forwarded for Principal Level authorization',
            idempotencyKey: `${requestId}:FORWARDED_TO_PRINCIPAL:v1`,
          });
        }

        // Event 4: Approved/Rejected by Principal or VP
        if (leave.status === 'APPROVED_PRINCIPAL' || assignment?.status === 'APPROVED') {
          await this.recordEvent({
            requestId,
            eventType: 'APPROVED',
            fromStage: 'PENDING_PRINCIPAL',
            toStage: 'APPROVED',
            fromStatus: 'PENDING',
            toStatus: 'APPROVED',
            actorUserId: assignment?.actionByUserId,
            actorNameSnapshot: assignment?.actionByRole === 'VICE_PRINCIPAL' ? 'Dr. Meenakshi Sundaram' : 'Dr. Subramanian Ramasamy',
            actorRole: assignment?.actionByRole || 'PRINCIPAL',
            actorDisplayRole: assignment?.actionAsRole === 'ACTING_PRINCIPAL' ? 'Vice Principal — Acting Principal' : 'Principal',
            performedAsRole: assignment?.actionAsRole || 'PRINCIPAL',
            remarks: assignment?.actionRemarks || leave.principalRemarks || 'Approved',
            idempotencyKey: `${requestId}:APPROVED:v1`,
          });
        }
        return;
      }

      // 2. Check WorkflowRequest
      const wf = await prisma.workflowRequest.findUnique({
        where: { id: requestId },
        include: { facultyRequester: { include: { user: { include: { role: true } } } }, student: true },
      });

      if (wf) {
        const isFaculty = Boolean(wf.facultyRequester);
        const applicantName = isFaculty
          ? `${wf.facultyRequester?.firstName} ${wf.facultyRequester?.lastName}`.trim()
          : `${wf.student?.firstName} ${wf.student?.lastName}`.trim();
        const roleName = isFaculty ? (wf.facultyRequester?.user?.role?.name || 'Faculty') : 'Student';

        await this.recordEvent({
          requestId,
          eventType: 'REQUEST_SUBMITTED',
          fromStage: 'DRAFT',
          toStage: wf.currentStep,
          actorUserId: isFaculty ? (wf.facultyRequester?.userId || undefined) : (wf.student?.userId || undefined),
          actorNameSnapshot: applicantName,
          actorRole: roleName,
          actorDisplayRole: roleName,
          remarks: wf.reason || undefined,
          idempotencyKey: `${requestId}:REQUEST_SUBMITTED:v1`,
        });

        if (wf.status === 'APPROVED') {
          await this.recordEvent({
            requestId,
            eventType: 'APPROVED',
            fromStage: wf.currentStep,
            toStage: 'APPROVED',
            actorNameSnapshot: 'Executive Authority',
            actorRole: 'PRINCIPAL',
            actorDisplayRole: 'Principal / Acting Principal',
            remarks: 'Request approved',
            idempotencyKey: `${requestId}:APPROVED:v1`,
          });
        }
      }
    } catch (err) {
      logger.warn('Error auto-seeding timeline events:', err);
    }
  }
}
