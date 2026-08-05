import { prisma } from '../../lib/prisma';
import { FacultyLeaveRepository } from './faculty-leave.repository';
import { FacultyLeaveWorkflowEngine } from './faculty-leave.workflow';
import { FacultyLeaveNotificationService } from './faculty-leave.notifications';
import { CreateFacultyLeaveOdDto } from './faculty-leave.validation';
import { logger } from '../../utils/logger';

const repo = new FacultyLeaveRepository();

export class FacultyLeaveService {
  /**
   * Submit Leave or OD application as Faculty.
   * Auto-resolves department & HOD from session — never trusts frontend IDs.
   */
  static async submitLeaveOd(userId: string, dto: CreateFacultyLeaveOdDto) {
    const faculty = await repo.findFacultyByUserId(userId);
    if (!faculty) {
      throw new Error('Faculty profile not found for logged-in session');
    }
    if (!faculty.departmentId) {
      throw new Error('Faculty is not assigned to an active department');
    }

    const hodUser = await repo.findDepartmentHod(faculty.departmentId);
    if (!hodUser) {
      throw new Error(`No active HOD assigned for department "${faculty.department?.name || faculty.departmentId}"`);
    }

    // Generate Request Number
    const year = new Date().getFullYear();
    const count = await repo.countTotalRequests();
    const prefix = dto.requestType === 'LEAVE' ? 'FLV' : 'FOD';
    const requestNumber = `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    // Build JSON metadata payload
    const attachmentsPayload = JSON.stringify({
      requestNumber,
      category: dto.category,
      isEmergency: Boolean(dto.isEmergency),
      workHandoverDetails: dto.workHandoverDetails || null,
      preferredSubstituteId: dto.preferredSubstituteId || null,
      supportingDocumentUrl: dto.supportingDocumentUrl || null,
      supportingDocumentName: dto.supportingDocumentName || null,
      affectedPeriods: dto.affectedPeriods || [],
      contactNumber: dto.contactNumber || null,
      // OD specific
      eventName: dto.eventName || null,
      organization: dto.organization || null,
      venue: dto.venue || null,
      eventDate: dto.eventDate || null,
      invitationLetterUrl: dto.invitationLetterUrl || null,
      expectedOutcome: dto.expectedOutcome || null,
      // Medical specific
      medicalCertificateUrl: dto.medicalCertificateUrl || null,
      hospitalDetails: dto.hospitalDetails || null,
    });


    const actorName = `${faculty.firstName} ${faculty.lastName}`;

    const request = await repo.createLeaveOdRequest({
      requestNumber,
      facultyRequesterId: faculty.id,
      departmentId: faculty.departmentId,
      type: dto.requestType === 'LEAVE' ? 'LEAVE' : 'ON_DUTY',
      title: `${dto.category} Request`,
      category: dto.category,
      reason: dto.reason,
      description: dto.description,
      startDate,
      endDate,
      isHalfDay: Boolean(dto.isHalfDay),
      startTime: dto.startTime,
      endTime: dto.endTime,
      totalDays: dto.totalDays,
      isEmergency: Boolean(dto.isEmergency),
      contactNumber: dto.contactNumber,
      attachments: attachmentsPayload,
      workHandoverDetails: dto.workHandoverDetails,
      preferredSubstituteId: dto.preferredSubstituteId,
      status: 'PENDING',
      currentStep: 'HOD',
      historyComment: `Submitted ${dto.requestType} (${dto.category}) from ${dto.startDate} to ${dto.endDate}`,
      actorUserId: userId,
      actorName,
    });

    // Async dispatch notifications
    FacultyLeaveNotificationService.notifyHodOnSubmission(request, actorName, hodUser.id).catch(err => {
      logger.error(`[FacultyLeaveService] HOD notification failed for request ${request.id}:`, err);
    });

    logger.info(`[FacultyLeaveService] Request ${requestNumber} submitted by Faculty ${faculty.id} to HOD ${hodUser.id}`);
    return request;
  }

  /**
   * Fetch all requests created by logged-in Faculty.
   */
  static async getFacultyRequests(userId: string) {
    const faculty = await repo.findFacultyByUserId(userId);
    if (!faculty) return [];
    return repo.findByFacultyId(faculty.id);
  }

  /**
   * Get request detail.
   */
  static async getRequestById(requestId: string) {
    return repo.findById(requestId);
  }

  /**
   * Fetch HOD Faculty Request Queue + Summary Cards for logged-in HOD.
   */
  static async getHodDashboard(userId: string, filterStatus?: string) {
    const hodFaculty = await repo.findFacultyByUserId(userId);
    let deptId = hodFaculty?.departmentId;

    if (!deptId) {
      const dept = await prisma.department.findFirst({ where: { hodUserId: userId } });
      deptId = dept?.id;
    }

    if (!deptId) {
      throw new Error('Logged-in user is not authorized as a Department HOD');
    }

    const [summary, queue] = await Promise.all([
      repo.getHodSummaryCards(deptId),
      repo.findForHodQueue(deptId, filterStatus),
    ]);

    return { summary, queue };
  }

  /**
   * HOD Recommendation Transaction (Single DB Transaction).
   * Validates HOD, checks Principal availability, assigns Principal or Acting VP.
   */
  static async hodRecommend(
    hodUserId: string,
    requestId: string,
    remarks?: string,
    confirmedSubstituteId?: string,
    handoverInstructions?: string
  ) {
    const request = await repo.findById(requestId);
    if (!request) throw new Error('Faculty request not found');

    if (request.currentStep !== 'HOD') {
      throw new Error(`Request is not pending HOD review (current step: ${request.currentStep})`);
    }

    // Resolve Final Approver (Principal vs Vice Principal / Acting Principal)
    const finalApprover = await FacultyLeaveWorkflowEngine.resolveFinalApprover(hodUserId);

    const hodUser = await prisma.user.findUnique({ where: { id: hodUserId } });
    const actorName = hodUser ? `${hodUser.firstName} ${hodUser.lastName}` : 'Department HOD';

    // Execute single DB transaction
    const updated = await (prisma as any).$transaction(async (tx: any) => {
      const reqUpdate = await tx.workflowRequest.update({
        where: { id: requestId },
        data: {
          status: finalApprover.nextStatus,
          currentStep: finalApprover.nextStep,
          confirmedSubstituteId: confirmedSubstituteId || (request as any).preferredSubstituteId || null,
        },
      });

      await tx.workflowHistory.create({
        data: {
          requestId,
          stage: 'HOD',
          action: 'RECOMMEND',
          comment: remarks || `Recommended by HOD (${actorName}) and forwarded to ${finalApprover.publishedAsLabel}`,
          actionById: hodUserId,
          actionByName: actorName,
          performedByRole: 'HOD',
          performedAsRole: finalApprover.isActingPrincipal ? 'ACTING_PRINCIPAL' : 'HOD',
          delegationId: finalApprover.activeDelegationId || null,
        },
      });

      return reqUpdate;
    });

    // Async notify Faculty
    if ((request as any).facultyRequester?.user?.id) {
      FacultyLeaveNotificationService.notifyFacultyOnHodAction(
        updated,
        (request as any).facultyRequester.user.id,
        'RECOMMENDED',
        remarks
      ).catch(() => {});
    }

    return updated;
  }

  /**
   * HOD Rejection Action.
   */
  static async hodReject(hodUserId: string, requestId: string, reason: string) {
    const request = await repo.findById(requestId);
    if (!request) throw new Error('Faculty request not found');

    const hodUser = await prisma.user.findUnique({ where: { id: hodUserId } });
    const actorName = hodUser ? `${hodUser.firstName} ${hodUser.lastName}` : 'Department HOD';

    const updated = await (prisma as any).$transaction(async (tx: any) => {
      const reqUpdate = await tx.workflowRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED_BY_HOD',
          currentStep: 'COMPLETED',
        },
      });

      await tx.workflowHistory.create({
        data: {
          requestId,
          stage: 'HOD',
          action: 'REJECT',
          comment: `Rejected by HOD: ${reason}`,
          actionById: hodUserId,
          actionByName: actorName,
        },
      });

      return reqUpdate;
    });

    if ((request as any).facultyRequester?.user?.id) {
      FacultyLeaveNotificationService.notifyFacultyOnHodAction(
        updated,
        (request as any).facultyRequester.user.id,
        'REJECTED',
        reason
      ).catch(() => {});
    }

    return updated;
  }

  /**
   * HOD Return for Clarification Action.
   */
  static async hodReturn(hodUserId: string, requestId: string, reason: string) {
    const request = await repo.findById(requestId);
    if (!request) throw new Error('Faculty request not found');

    const hodUser = await prisma.user.findUnique({ where: { id: hodUserId } });
    const actorName = hodUser ? `${hodUser.firstName} ${hodUser.lastName}` : 'Department HOD';

    const updated = await (prisma as any).$transaction(async (tx: any) => {
      const reqUpdate = await tx.workflowRequest.update({
        where: { id: requestId },
        data: {
          status: 'RETURNED_TO_FACULTY',
          currentStep: 'FACULTY',
        },
      });

      await tx.workflowHistory.create({
        data: {
          requestId,
          stage: 'HOD',
          action: 'RETURN',
          comment: `Returned for clarification by HOD: ${reason}`,
          actionById: hodUserId,
          actionByName: actorName,
        },
      });

      return reqUpdate;
    });

    if ((request as any).facultyRequester?.user?.id) {
      FacultyLeaveNotificationService.notifyFacultyOnHodAction(
        updated,
        (request as any).facultyRequester.user.id,
        'RETURNED',
        reason
      ).catch(() => {});
    }

    return updated;
  }
}
