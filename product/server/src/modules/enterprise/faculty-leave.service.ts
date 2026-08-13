import { prisma } from '../../lib/prisma';
import { BadRequestException, NotFoundException, ForbiddenException } from '../../utils/exceptions';
import { logger } from '../../utils/logger';
import { PrincipalRequestRoutingService } from '../principal-availability/request-routing.service';
import { validateRequestDate } from '../../utils/leavePolicy';

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
    let faculty = await prisma.faculty.findFirst({
      where: { userId },
      include: { department: true },
    });

    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });

    if (!faculty && user) {
      // Check if faculty profile exists by email and link userId
      faculty = await prisma.faculty.findFirst({
        where: { email: user.email },
        include: { department: true },
      });

      if (faculty) {
        await prisma.faculty.update({
          where: { id: faculty.id },
          data: { userId }
        });
        faculty = await prisma.faculty.findUnique({
          where: { id: faculty.id },
          include: { department: true }
        });
      } else {
        // Auto-create faculty profile for user session
        let deptId = (user as any).departmentId;
        if (!deptId) {
          const firstDept = await prisma.department.findFirst({ where: { status: 'ACTIVE' } });
          deptId = firstDept?.id;
        }

        if (!deptId) {
          const anyDept = await prisma.department.findFirst();
          deptId = anyDept?.id;
        }

        if (!deptId) {
          throw new BadRequestException('No active department found in system to associate faculty leave');
        }

        faculty = await (prisma.faculty.create({
          data: {
            userId,
            employeeId: `FAC-${Date.now().toString().slice(-4)}`,
            firstName: user.firstName || 'Faculty',
            lastName: user.lastName || 'Member',
            email: user.email,
            phone: user.phone || '9999999999',
            dob: new Date('1990-01-01'),
            dateOfJoining: new Date(),
            qualification: 'Ph.D / M.Tech',
            experience: 5,
            departmentId: deptId,
            designation: user.role?.name === 'HOD' ? 'Head of Department' : 'Faculty Member',
            status: 'ACTIVE',
          },
          include: { department: true }
        }) as any);
      }
    }

    if (!faculty) {
      throw new NotFoundException('Faculty profile not found for current user session');
    }

    const firstActiveDept = await prisma.department.findFirst({ where: { status: 'ACTIVE' } });
    const finalDepartmentId = faculty.departmentId || (user as any)?.departmentId || firstActiveDept?.id;

    if (!finalDepartmentId) {
      throw new BadRequestException('Valid department ID is required to submit leave request');
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

    // Normalize leaveType (CASUAL -> CASUAL_LEAVE, MEDICAL -> MEDICAL_LEAVE)
    const rawType = (input.leaveType || (input as any).type || (input as any).requestType || 'CASUAL_LEAVE').toString().toUpperCase();
    const normalizedLeaveType = rawType.includes('CASUAL') ? 'CASUAL_LEAVE'
      : rawType.includes('MEDICAL') ? 'MEDICAL_LEAVE'
      : rawType.includes('EARNED') ? 'EARNED_LEAVE'
      : rawType === 'OD' || rawType.includes('DUTY') ? 'ON_DUTY'
      : 'CASUAL_LEAVE';

    await validateRequestDate(start, normalizedLeaveType === 'ON_DUTY');

    // Generate Request Number (e.g. FL-2026-0001)
    const count = await prisma.facultyLeaveRequest.count();
    const requestNumber = `FL-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    const isExecutiveUser = 
      ['HOD', 'Head of Department', 'Academic Dean', 'Admission Dean', 'IQAC Dean', 'Vice Principal'].includes(user?.role?.name || '') || 
      (user as any)?.activeWorkspace === 'HOD' || 
      faculty.department?.hodUserId === userId;
      
    const initialStatus = isExecutiveUser ? 'PENDING_PRINCIPAL' : 'PENDING_HOD';

    const request = await prisma.facultyLeaveRequest.create({
      data: {
        requestNumber,
        facultyId: faculty.id,
        departmentId: finalDepartmentId,
        leaveType: normalizedLeaveType,
        reason: input.reason || 'Faculty leave request',
        startDate: start,
        endDate: end,
        totalDays,
        attachmentUrl: input.attachmentUrl,
        substitutions: JSON.stringify(input.substitutions || []),
        status: initialStatus,
      },
      include: {
        faculty: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    });

    if (isExecutiveUser || initialStatus === 'PENDING_PRINCIPAL') {
      const isOd = normalizedLeaveType === 'ON_DUTY';
      const reqType = isOd ? 'FACULTY_OD' : 'FACULTY_LEAVE';
      try {
        await PrincipalRequestRoutingService.createApprovalAssignment({
          requestId: request.id,
          requestType: reqType,
          title: `[${user?.role?.name || 'Executive'}] ${normalizedLeaveType.replace('_', ' ')}: ${requestNumber}`,
          applicantName: `${faculty.firstName} ${faculty.lastName}`,
          departmentName: faculty.department?.name || 'Academic Department',
        });
      } catch (routingErr) {
        logger.warn('Error creating approval assignment for executive leave:', routingErr);
      }
    }

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

    // Notify Approver (Principal / Acting Principal if Executive user, else HOD)
    try {
      if (isExecutiveUser) {
        const principalOfflineSetting = await prisma.systemSetting.findUnique({ where: { key: 'PRINCIPAL_OFFLINE_MODE' } });
        const isPrincipalOffline = principalOfflineSetting?.value === 'true';
        const targetRole = isPrincipalOffline ? 'Vice Principal' : 'Principal';

        const targetUsers = await prisma.user.findMany({
          where: { role: { name: targetRole }, status: 'ACTIVE' }
        });

        for (const targetUser of targetUsers) {
          await prisma.notification.create({
            data: {
              recipientId: targetUser.id,
              eventType: 'EXECUTIVE_LEAVE_SUBMITTED',
              title: `${isPrincipalOffline ? '⚡ [Acting Principal Required] ' : ''}${user?.role?.name || 'Executive'} Leave Request: Dr. ${faculty.firstName} ${faculty.lastName}`,
              message: `${user?.role?.name || 'Executive'} Dr. ${faculty.firstName} ${faculty.lastName} (${faculty.department?.name || 'Department'}) submitted a ${input.leaveType} (${totalDays} day(s)) ${isPrincipalOffline ? 'requiring Vice Principal (Acting Principal) sign-off.' : 'directly for Principal approval.'}`,
              relatedEntityType: 'FACULTY_LEAVE_REQUEST',
              relatedEntityId: request.id,
              deepLinkRoute: `/approval-center?requestId=${request.id}`,
            },
          });
        }
      } else {
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
      }
    } catch (err) {
      logger.warn('Failed to dispatch leave notification:', err);
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

    if (!['APPROVED_HOD', 'PENDING_PRINCIPAL'].includes(request.status) && user.role.name !== 'Super Admin') {
      throw new BadRequestException('Request must be in pending approval status before Principal/Acting Principal final sign-off');
    }

    const isActing = user.role.name === 'Vice Principal';
    const newStatus = decision === 'APPROVE' ? 'APPROVED_PRINCIPAL' : 'REJECTED_PRINCIPAL';
    const approvalStamp = isActing ? 'Approved by: Vice Principal (Acting on behalf of Principal)' : 'Approved by Principal';

    const updated = await prisma.facultyLeaveRequest.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        principalId: userId,
        principalApprovedAt: new Date(),
        principalRemarks: remarks || (decision === 'APPROVE' ? approvalStamp : 'Rejected by Principal'),
        isActingPrincipal: isActing,
      },
    });

    // Cross-sync matching WorkflowRequest if exists
    await prisma.workflowRequest.updateMany({
      where: {
        facultyRequesterId: request.facultyId,
        status: { in: ['PENDING', 'HOD_APPROVED'] }
      },
      data: {
        status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        currentStep: 'COMPLETED'
      }
    }).catch(() => {});

    // Auto-adjust attendance if approved
    if (decision === 'APPROVE' && request.facultyId && request.startDate && request.endDate) {
      try {
        const isOD = request.leaveType === 'ON_DUTY';
        const attStatus = isOD ? 'PRESENT' : 'ABSENT';
        const attRemarks = isOD ? 'On Duty (Approved)' : 'Authorized Leave (Approved)';

        let cur = new Date(request.startDate);
        const end = new Date(request.endDate);
        while (cur <= end) {
          const dateOnly = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate());
          const existing = await prisma.attendance.findFirst({
            where: { facultyId: request.facultyId, date: dateOnly }
          });
          if (existing) {
            await prisma.attendance.update({
              where: { id: existing.id },
              data: { status: attStatus, remarks: attRemarks }
            });
          } else {
            await prisma.attendance.create({
              data: {
                facultyId: request.facultyId,
                date: dateOnly,
                status: attStatus,
                remarks: attRemarks,
                type: 'DAILY'
              }
            });
          }
          cur.setDate(cur.getDate() + 1);
        }
      } catch (attErr) {
        logger.warn('Failed to auto-update faculty attendance upon principal approval:', attErr);
      }
    }

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
      where: { status: { in: ['APPROVED_HOD', 'PENDING_PRINCIPAL'] } },
      orderBy: { createdAt: 'asc' },
      include: {
        faculty: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    });
  }
}
