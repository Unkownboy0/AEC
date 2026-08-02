import { prisma } from '../../lib/prisma';
import { NotFoundException, BadRequestException, ForbiddenException } from '../../utils/exceptions';
import { NotificationService } from '../notifications/notification.service';
import { AuditService } from '../security/audit.service';

export interface CreateAdmissionCoordinationDto {
  title: string;
  description: string;
  requestType?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  departmentId: string;
  dueAt: string;
}

export interface RespondAdmissionCoordinationDto {
  responseNotes: string;
  responseFiles?: string[];
}

export class AdmissionCoordinationService {
  /**
   * 1. Admission Dean creates coordination request to HOD
   */
  static async createRequest(createdById: string, dto: CreateAdmissionCoordinationDto) {
    if (!dto.title || !dto.description || !dto.departmentId || !dto.dueAt) {
      throw new BadRequestException('Title, description, department, and due date are required');
    }

    const dueAtDate = new Date(dto.dueAt);
    if (isNaN(dueAtDate.getTime())) {
      throw new BadRequestException('Invalid due date format');
    }

    // Resolve active HOD for department
    const hodUser = await prisma.user.findFirst({
      where: {
        departmentId: dto.departmentId,
        status: 'ACTIVE',
        role: { name: 'HOD' },
      },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!hodUser) {
      throw new BadRequestException(`No active HOD found for department ID ${dto.departmentId}`);
    }

    const year = new Date().getFullYear();
    const count = await (prisma as any).admissionCoordinationRequest.count();
    const requestCode = `ADM-REQ-${year}-${String(count + 1).padStart(3, '0')}`;

    const request = await (prisma as any).admissionCoordinationRequest.create({
      data: {
        requestCode,
        title: dto.title.trim(),
        description: dto.description.trim(),
        requestType: dto.requestType || 'GENERAL_VERIFICATION',
        priority: dto.priority || 'MEDIUM',
        departmentId: dto.departmentId,
        assignedHodUserId: hodUser.id,
        status: 'ASSIGNED',
        dueAt: dueAtDate,
        createdById,
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
        assignedHod: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    // Send notification to assigned HOD
    await NotificationService.sendNotification({
      recipientId: hodUser.id,
      eventType: 'ADMISSION_COORDINATION_ASSIGNED',
      title: 'New Admission Coordination Request',
      message: `${requestCode}: ${request.title}`,
      relatedEntityType: 'ADMISSION_COORDINATION',
      relatedEntityId: request.id,
      deepLinkRoute: `/hod/admission-coordination/${request.id}`,
    });

    await AuditService.log({
      actorId: createdById,
      action: 'ADMISSION_COORDINATION_CREATED',
      entityType: 'ADMISSION_COORDINATION',
      entityId: request.id,
      description: `Created admission coordination request ${requestCode} for ${request.department.code}`,
    });

    return request;
  }

  /**
   * 2. List Admission Coordination Requests for Admission Dean
   */
  static async getRequestsForDean(filters: {
    status?: string;
    departmentId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.departmentId) where.departmentId = filters.departmentId;

    if (filters.search) {
      const s = filters.search.trim();
      where.OR = [
        { requestCode: { contains: s } },
        { title: { contains: s } },
        { description: { contains: s } },
      ];
    }

    const [requests, total] = await Promise.all([
      (prisma as any).admissionCoordinationRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          department: { select: { id: true, name: true, code: true } },
          assignedHod: { select: { id: true, firstName: true, lastName: true, email: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      (prisma as any).admissionCoordinationRequest.count({ where }),
    ]);

    return {
      data: requests,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * 3. List Requests Received by HOD (Scoped to HOD)
   */
  static async getRequestsForHod(hodUserId: string) {
    const requests = await (prisma as any).admissionCoordinationRequest.findMany({
      where: { assignedHodUserId: hodUserId },
      orderBy: { dueAt: 'asc' },
      include: {
        department: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    return requests;
  }

  /**
   * 4. HOD Responds to Admission Coordination Request
   */
  static async respondToRequest(requestId: string, dto: RespondAdmissionCoordinationDto, hodUserId: string) {
    const request = await (prisma as any).admissionCoordinationRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new NotFoundException('Admission coordination request not found');

    if (request.assignedHodUserId !== hodUserId) {
      throw new ForbiddenException('Unauthorized: You cannot respond to a request assigned to another HOD');
    }

    if (!dto.responseNotes || !dto.responseNotes.trim()) {
      throw new BadRequestException('Response notes are required');
    }

    const now = new Date();
    const updated = await (prisma as any).admissionCoordinationRequest.update({
      where: { id: requestId },
      data: {
        status: 'SUBMITTED',
        submittedAt: now,
        responseNotes: dto.responseNotes.trim(),
        responseFiles: dto.responseFiles ? JSON.stringify(dto.responseFiles) : '[]',
      },
      include: {
        department: { select: { code: true } },
      },
    });

    // Notify Admission Dean
    await NotificationService.sendNotification({
      recipientId: request.createdById,
      eventType: 'ADMISSION_COORDINATION_SUBMITTED',
      title: 'HOD Responded to Admission Coordination Request',
      message: `${request.requestCode} responded by HOD of ${updated.department.code}`,
      relatedEntityType: 'ADMISSION_COORDINATION',
      relatedEntityId: requestId,
      deepLinkRoute: `/admission-dean/coordination/${requestId}`,
    });

    await AuditService.log({
      actorId: hodUserId,
      action: 'ADMISSION_COORDINATION_SUBMITTED',
      entityType: 'ADMISSION_COORDINATION',
      entityId: requestId,
      description: `HOD responded to admission coordination request ${request.requestCode}`,
    });

    return updated;
  }

  /**
   * 5. Admission Dean Reviews HOD Response
   */
  static async reviewRequest(requestId: string, action: 'APPROVE' | 'REQUEST_REVISION', remarks: string, deanUserId: string) {
    const request = await (prisma as any).admissionCoordinationRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new NotFoundException('Admission coordination request not found');

    const newStatus = action === 'APPROVE' ? 'COMPLETED' : 'REVISION_REQUESTED';
    const now = new Date();

    const updated = await (prisma as any).admissionCoordinationRequest.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        reviewedById: deanUserId,
        reviewedAt: now,
        reviewRemarks: remarks,
      },
    });

    // Notify HOD
    await NotificationService.sendNotification({
      recipientId: request.assignedHodUserId,
      eventType: 'ADMISSION_COORDINATION_REVIEWED',
      title: `Admission Coordination Request ${action === 'APPROVE' ? 'Completed' : 'Revision Requested'}`,
      message: `${request.requestCode}: ${remarks}`,
      relatedEntityType: 'ADMISSION_COORDINATION',
      relatedEntityId: requestId,
      deepLinkRoute: `/hod/admission-coordination/${requestId}`,
    });

    return updated;
  }
}
