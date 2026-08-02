import { prisma } from '../../lib/prisma';
import { BadRequestException, NotFoundException, ForbiddenException } from '../../utils/exceptions';
import { logger } from '../../utils/logger';

export interface ClassSubstitutionItem {
  subjectId?: string;
  sectionId?: string;
  substituteFacultyId: string;
  substituteFacultyName: string;
  date?: string;
  timeSlot?: string;
}

export interface SubmitFacultyLeaveInput {
  leaveType: 'CASUAL_LEAVE' | 'MEDICAL_LEAVE' | 'EARNED_LEAVE' | 'ON_DUTY';
  reason: string;
  startDate: string;
  endDate: string;
  attachmentUrl?: string;
  substitutions?: ClassSubstitutionItem[];
}

export class FacultyLeaveService {
  /**
   * Submit Faculty Leave / OD Request
   */
  async submitRequest(userId: string, input: SubmitFacultyLeaveInput) {
    const faculty = await prisma.faculty.findFirst({
      where: { userId },
      include: { department: true },
    });

    if (!faculty) {
      throw new NotFoundException('Faculty profile not found for current user session');
    }

    const start = new Date(input.startDate);
    const end = new Date(input.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid start date or end date format');
    }

    if (end < start) {
      throw new BadRequestException('End date cannot be prior to start date');
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Generate Request Number (e.g. FL-2026-0001)
    const count = await prisma.facultyLeaveRequest.count();
    const requestNumber = `FL-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    const request = await prisma.facultyLeaveRequest.create({
      data: {
        requestNumber,
        facultyId: faculty.id,
        departmentId: faculty.departmentId,
        leaveType: input.leaveType,
        reason: input.reason,
        startDate: start,
        endDate: end,
        totalDays,
        attachmentUrl: input.attachmentUrl,
        substitutions: JSON.stringify(input.substitutions || []),
        status: 'PENDING_HOD',
      },
      include: {
        faculty: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    });

    // Notify Substitute Faculty if specified
    if (input.substitutions && input.substitutions.length > 0) {
      for (const sub of input.substitutions) {
        try {
          const subFaculty = await prisma.faculty.findUnique({ where: { id: sub.substituteFacultyId } });
          if (subFaculty && subFaculty.userId) {
            await prisma.notification.create({
              data: {
                recipientId: subFaculty.userId,
                eventType: 'FACULTY_SUBSTITUTION_REQUESTED',
                title: `Class Substitution Request from Prof. ${faculty.lastName}`,
                message: `Prof. ${faculty.firstName} ${faculty.lastName} requested you to cover lectures during ${input.leaveType} (${input.startDate} to ${input.endDate}).`,
                relatedEntityType: 'FACULTY_LEAVE_REQUEST',
                relatedEntityId: request.id,
              },
            });
          }
        } catch (err) {
          logger.warn('Failed to dispatch substitute notification:', err);
        }
      }
    }

    // Notify Department HOD for Level 1 Review
    try {
      const hodFaculty = await prisma.faculty.findFirst({
        where: {
          departmentId: faculty.departmentId,
          user: { role: { name: 'HOD' } },
        },
        include: { user: true },
      });

      if (hodFaculty && hodFaculty.userId) {
        await prisma.notification.create({
          data: {
            recipientId: hodFaculty.userId,
            eventType: 'FACULTY_LEAVE_SUBMITTED',
            title: `Faculty Leave Request: Prof. ${faculty.firstName} ${faculty.lastName}`,
            message: `Prof. ${faculty.firstName} ${faculty.lastName} submitted a ${input.leaveType} (${totalDays} day(s)) for your HOD Level 1 review.`,
            relatedEntityType: 'FACULTY_LEAVE_REQUEST',
            relatedEntityId: request.id,
            deepLinkRoute: `/hod/faculty-leave-approvals?requestId=${request.id}`,
          },
        });
      }
    } catch (err) {
      logger.warn('Failed to dispatch HOD leave notification:', err);
    }

    logger.info(`📝 Faculty Leave Request ${requestNumber} created by Prof. ${faculty.firstName} ${faculty.lastName}`);
    return request;
  }

  /**
   * Level 1 HOD Review
   */
  async hodReview(userId: string, requestId: string, decision: 'APPROVE' | 'REJECT', remarks?: string) {
    const faculty = await prisma.faculty.findFirst({ where: { userId } });
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });

    if (!user || !['HOD', 'Super Admin', 'Principal', 'Vice Principal', 'Academic Dean'].includes(user.role.name)) {
      throw new ForbiddenException('Only Department HOD or College Executives can perform Level 1 Faculty Leave reviews');
    }

    const request = await prisma.facultyLeaveRequest.findUnique({
      where: { id: requestId },
      include: { faculty: true, department: true },
    });

    if (!request) {
      throw new NotFoundException('Faculty leave request not found');
    }

    if (request.status !== 'PENDING_HOD') {
      throw new BadRequestException(`Request is currently in status '${request.status}' and cannot be reviewed by HOD`);
    }

    const newStatus = decision === 'APPROVE' ? 'APPROVED_HOD' : 'REJECTED_HOD';

    const updated = await prisma.facultyLeaveRequest.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        hodId: faculty?.id || userId,
        hodApprovedAt: new Date(),
        hodRemarks: remarks || (decision === 'APPROVE' ? 'HOD Endorsed' : 'Rejected by HOD'),
      },
    });

    // Notify Faculty Applicant
    if (request.faculty.userId) {
      try {
        await prisma.notification.create({
          data: {
            recipientId: request.faculty.userId,
            eventType: decision === 'APPROVE' ? 'FACULTY_LEAVE_HOD_APPROVED' : 'FACULTY_LEAVE_HOD_REJECTED',
            title: `Faculty ${request.leaveType} ${decision === 'APPROVE' ? 'Endorsed by HOD' : 'Rejected by HOD'}`,
            message: `Your ${request.leaveType} request (${request.requestNumber}) was ${decision === 'APPROVE' ? 'endorsed by HOD and forwarded to Principal for final approval.' : 'rejected by HOD.'}`,
            relatedEntityType: 'FACULTY_LEAVE_REQUEST',
            relatedEntityId: request.id,
          },
        });
      } catch (err) {}
    }

    // Forward to Level 2 Principal (or Acting Principal VP if Principal is offline)
    if (decision === 'APPROVE') {
      try {
        const principalOffline = (await prisma.systemSetting.findUnique({ where: { key: 'PRINCIPAL_OFFLINE_MODE' } }))?.value === 'true';
        const targetRole = principalOffline ? 'Vice Principal' : 'Principal';

        const principalUsers = await prisma.user.findMany({
          where: { role: { name: targetRole }, status: 'ACTIVE' },
        });

        for (const pu of principalUsers) {
          await prisma.notification.create({
            data: {
              recipientId: pu.id,
              eventType: 'FACULTY_LEAVE_PRINCIPAL_PENDING',
              title: `${targetRole} Level 2 Action Required: Prof. ${request.faculty.firstName} ${request.faculty.lastName}`,
              message: `Faculty ${request.leaveType} (${request.requestNumber}) endorsed by HOD. Awaiting ${targetRole} sign-off.`,
              relatedEntityType: 'FACULTY_LEAVE_REQUEST',
              relatedEntityId: request.id,
              deepLinkRoute: `/executive/leave-approvals?requestId=${request.id}`,
            },
          });
        }
      } catch (err) {
        logger.warn('Failed to notify Principal/Acting Principal:', err);
      }
    }

    return updated;
  }

  /**
   * Level 2 Principal / Acting Principal Review
   */
  async principalReview(userId: string, requestId: string, decision: 'APPROVE' | 'REJECT', remarks?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });

    if (!user || !['Principal', 'Vice Principal', 'Super Admin'].includes(user.role.name)) {
      throw new ForbiddenException('Only Principal or Acting Principal (Vice Principal) can perform Level 2 final sign-offs');
    }

    const request = await prisma.facultyLeaveRequest.findUnique({
      where: { id: requestId },
      include: { faculty: true },
    });

    if (!request) {
      throw new NotFoundException('Faculty leave request not found');
    }

    if (request.status !== 'APPROVED_HOD' && user.role.name !== 'Super Admin') {
      throw new BadRequestException('Request must be endorsed by Level 1 HOD before Principal final sign-off');
    }

    const isActing = user.role.name === 'Vice Principal';
    const newStatus = decision === 'APPROVE' ? 'APPROVED_PRINCIPAL' : 'REJECTED_PRINCIPAL';

    const updated = await prisma.facultyLeaveRequest.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        principalId: userId,
        principalApprovedAt: new Date(),
        principalRemarks: remarks || (decision === 'APPROVE' ? (isActing ? 'Approved by Vice Principal (Acting Principal)' : 'Approved by Principal') : 'Rejected by Principal'),
        isActingPrincipal: isActing,
      },
    });

    // Notify Applicant Faculty of final decision
    if (request.faculty.userId) {
      try {
        await prisma.notification.create({
          data: {
            recipientId: request.faculty.userId,
            eventType: decision === 'APPROVE' ? 'FACULTY_LEAVE_FINAL_APPROVED' : 'FACULTY_LEAVE_FINAL_REJECTED',
            title: `Final Decision: ${request.leaveType} ${decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'}`,
            message: `Your ${request.leaveType} request (${request.requestNumber}) has received final approval from ${isActing ? 'Acting Principal' : 'Principal'}!`,
            relatedEntityType: 'FACULTY_LEAVE_REQUEST',
            relatedEntityId: request.id,
          },
        });
      } catch (err) {}
    }

    return updated;
  }

  /**
   * Get Faculty Personal Requests
   */
  async getFacultyRequests(userId: string) {
    const faculty = await prisma.faculty.findFirst({ where: { userId } });
    if (!faculty) return [];

    return prisma.facultyLeaveRequest.findMany({
      where: { facultyId: faculty.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get HOD Level 1 Pending Queue
   */
  async getHodPendingRequests(userId: string) {
    const faculty = await prisma.faculty.findFirst({ where: { userId } });
    if (!faculty) return [];

    return prisma.facultyLeaveRequest.findMany({
      where: {
        departmentId: faculty.departmentId,
        status: 'PENDING_HOD',
      },
      orderBy: { createdAt: 'asc' },
      include: {
        faculty: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      },
    });
  }

  /**
   * Get Principal Level 2 Pending Queue
   */
  async getPrincipalPendingRequests(userId: string) {
    return prisma.facultyLeaveRequest.findMany({
      where: { status: 'APPROVED_HOD' },
      orderBy: { createdAt: 'asc' },
      include: {
        faculty: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    });
  }
}
