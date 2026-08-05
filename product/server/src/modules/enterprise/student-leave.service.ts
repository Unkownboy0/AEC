import { prisma } from '../../lib/prisma';
import { BadRequestException, NotFoundException, ForbiddenException } from '../../utils/exceptions';
import { logger } from '../../utils/logger';
import { broadcastRBACUpdate } from '../../lib/socket';

export interface SubmitLeaveInput {
  type: 'LEAVE' | 'ON_DUTY';
  requestCategory?: string; // MEDICAL, PERSONAL, EMERGENCY, PERMISSION, HALF_DAY, INTERNSHIP, PLACEMENT, SPORTS, CULTURAL, WORKSHOP, INDUSTRIAL_VISIT, COMPETITION, OTHER
  reason: string;
  description?: string;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  startTime?: string;
  endTime?: string;
  durationType?: 'FULL_DAY' | 'HALF_DAY';
  eventName?: string;
  eventLocation?: string;
  emergencyContact?: string;
  attachmentUrl?: string;
  isEmergency?: boolean;
}

export class StudentLeaveService {
  /**
   * Resolve active HOD User ID for a given Department ID
   */
  async resolveDepartmentHodUser(departmentId: string): Promise<{ hodUserId: string; hodFacultyId?: string } | null> {
    if (!departmentId) return null;

    // Strategy 0: Check DepartmentHodAssignment model
    try {
      const activeAssignment = await (prisma as any).departmentHodAssignment.findFirst({
        where: { departmentId, isActive: true },
      });
      if (activeAssignment?.hodUserId) {
        const fac = await prisma.faculty.findFirst({ where: { userId: activeAssignment.hodUserId } });
        return { hodUserId: activeAssignment.hodUserId, hodFacultyId: fac?.id };
      }
    } catch (e) {}

    // Strategy 1: Check Department model directly
    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        faculties: {
          include: { user: { include: { role: true } } }
        }
      }
    });

    if (dept) {
      if (dept.hodUserId) {
        const hodFac = dept.faculties.find(f => f.userId === dept.hodUserId);
        return { hodUserId: dept.hodUserId, hodFacultyId: hodFac?.id };
      }
      if (dept.hodId) {
        const hodFac = dept.faculties.find(f => f.id === dept.hodId);
        if (hodFac?.userId) {
          return { hodUserId: hodFac.userId, hodFacultyId: hodFac.id };
        }
      }
    }

    // Strategy 2: Check DepartmentMembership table for HOD role
    const membership = await prisma.departmentMembership.findFirst({
      where: {
        departmentId,
        role: 'HOD',
        user: { status: 'ACTIVE' }
      },
      include: { user: true }
    });

    if (membership?.userId) {
      const fac = await prisma.faculty.findFirst({ where: { userId: membership.userId } });
      return { hodUserId: membership.userId, hodFacultyId: fac?.id };
    }

    // Strategy 3: Check Faculty where user role name is HOD in the department
    const hodFaculty = await prisma.faculty.findFirst({
      where: {
        departmentId,
        user: {
          role: {
            name: { in: ['HOD', 'Head of Department', 'Department HOD'] }
          },
          status: 'ACTIVE'
        }
      }
    });

    if (hodFaculty?.userId) {
      return { hodUserId: hodFaculty.userId, hodFacultyId: hodFaculty.id };
    }

    return null;
  }

  /**
   * Submit new Student Leave / OD Request
   */
  async submitRequest(userId: string, input: SubmitLeaveInput) {
    const student = await prisma.student.findFirst({
      where: { userId },
      include: { mentor: true, department: true },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found for current user session');
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
    const totalDays = input.durationType === 'HALF_DAY' ? 0.5 : Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Resolve assigned HOD
    const hodInfo = student.departmentId ? await this.resolveDepartmentHodUser(student.departmentId) : null;

    // Generate Request Number (e.g. SL-2026-1002)
    const count = await prisma.studentLeaveRequest.count();
    const requestNumber = `SL-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    const request = await prisma.$transaction(async (tx) => {
      const created = await tx.studentLeaveRequest.create({
        data: {
          requestNumber,
          studentId: student.id,
          departmentId: student.departmentId,
          type: input.type,
          requestCategory: input.requestCategory || 'PERSONAL',
          reason: input.reason,
          description: input.description,
          startDate: start,
          endDate: end,
          startTime: input.startTime,
          endTime: input.endTime,
          durationType: input.durationType || 'FULL_DAY',
          totalDays,
          eventName: input.eventName,
          eventLocation: input.eventLocation,
          emergencyContact: input.emergencyContact || student.parentPhone || student.phone,
          attachmentUrl: input.attachmentUrl,
          status: 'PENDING_MENTOR',
          workflowStatus: 'PENDING_MENTOR',
          studentStatus: 'SUBMITTED',
          mentorStatus: 'PENDING',
          hodStatus: 'PENDING',
          finalStatus: 'PENDING',
          priority: input.isEmergency ? 'URGENT' : 'NORMAL',
          isEmergency: !!input.isEmergency,
          mentorId: student.mentorId,
          hodId: hodInfo?.hodFacultyId,
        },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, admissionNo: true, departmentId: true } },
          mentor: { select: { id: true, firstName: true, lastName: true, email: true, userId: true } },
        },
      });

      // Log Workflow History
      await tx.requestWorkflowHistory.create({
        data: {
          requestId: created.id,
          action: 'SUBMITTED',
          performedBy: userId,
          performedRole: 'STUDENT',
          fromStatus: 'DRAFT',
          toStatus: 'PENDING_MENTOR',
          remarks: input.reason,
        }
      });

      if (input.attachmentUrl) {
        await tx.requestAttachment.create({
          data: {
            requestId: created.id,
            fileName: input.attachmentUrl.split('/').pop() || 'Attachment',
            fileType: input.attachmentUrl.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
            fileUrl: input.attachmentUrl,
            uploadedBy: userId,
          }
        });
      }

      return created;
    });

    // Notify Mentor (Level 1)
    if (student.mentor?.userId) {
      try {
        await prisma.notification.create({
          data: {
            recipientId: student.mentor.userId,
            eventType: 'STUDENT_LEAVE_SUBMITTED',
            title: `New ${input.type} Request: ${student.firstName} ${student.lastName}`,
            message: `Student ${student.firstName} ${student.lastName} (${student.admissionNo}) submitted a ${input.type} request (${totalDays} day(s)) for your review.`,
            relatedEntityType: 'STUDENT_LEAVE_REQUEST',
            relatedEntityId: request.id,
            deepLinkRoute: `/faculty/mentor-approvals?requestId=${request.id}`,
          },
        });
      } catch (err) {
        logger.warn('Failed to send mentor notification:', err);
      }
    }

    broadcastRBACUpdate({ type: 'APPROVAL_UPDATED', userId: student.mentor?.userId || undefined, payload: { requestId: request.id } });

    logger.info(`📝 Student Leave Request ${requestNumber} created by ${student.firstName} ${student.lastName}`);
    return request;
  }

  /**
   * Level 1 Mentor Review (Approve / Reject / Return)
   */
  async mentorReview(
    userId: string,
    requestId: string,
    decision: 'APPROVE' | 'REJECT' | 'RETURN',
    remarks?: string,
    ipAddress?: string,
    deviceInfo?: string
  ) {
    const faculty = await prisma.faculty.findFirst({ where: { userId } });
    if (!faculty) {
      throw new ForbiddenException('Only assigned Faculty / Mentors can perform Level 1 reviews');
    }

    const cleanId = requestId.replace(/^WF-|^SLR-|^OD-/, '');
    const request = await prisma.studentLeaveRequest.findFirst({
      where: {
        OR: [
          { id: requestId },
          { requestNumber: requestId },
          { requestNumber: { contains: cleanId } },
          { id: { endsWith: cleanId.toLowerCase() } }
        ]
      },
      include: {
        student: {
          include: { department: true }
        }
      },
    });

    if (!request) {
      throw new NotFoundException('Leave request not found');
    }

    if (request.status !== 'PENDING_MENTOR' && request.workflowStatus !== 'PENDING_MENTOR') {
      throw new BadRequestException(`Request is currently in status '${request.status}' and cannot be reviewed by Mentor`);
    }

    if (decision === 'APPROVE') {
      // Find active HOD for student's department
      const hodInfo = request.student.departmentId
        ? await this.resolveDepartmentHodUser(request.student.departmentId)
        : null;

      if (!hodInfo || !hodInfo.hodUserId) {
        // Missing HOD Guard Rail Requirement
        logger.error(`❌ No active HOD assigned for department ${request.student.department?.name || request.student.departmentId}`);

        try {
          await prisma.securityAuditLog.create({
            data: {
              userId,
              action: 'MISSING_HOD_CONFIGURATION_ALERT',
              module: 'WORKFLOW',
              targetId: requestId,
              targetType: 'StudentLeaveRequest',
              description: `No active HOD is assigned to department ${request.student.department?.name || request.student.departmentId}. Workflow halted at Mentor Approval stage.`,
            }
          });
        } catch (e) {}

        throw new BadRequestException(
          'No active HOD is assigned to the student\'s department. Assign an HOD before forwarding the request.'
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const req = await tx.studentLeaveRequest.update({
          where: { id: request.id },
          data: {
            status: 'PENDING_HOD',
            workflowStatus: 'PENDING_HOD',
            mentorStatus: 'APPROVED',
            mentorId: faculty.id,
            mentorApprovedAt: new Date(),
            mentorRemarks: remarks || 'Endorsed by Mentor',
            forwardedToHodAt: new Date(),
            hodId: hodInfo.hodFacultyId || request.hodId,
          },
          include: { student: true, mentor: true }
        });

        // Add Approval record
        await tx.requestApproval.create({
          data: {
            requestId: request.id,
            approverId: userId,
            approverRole: 'MENTOR',
            approvalLevel: 1,
            decision: 'APPROVE',
            remarks: remarks || 'Endorsed by Mentor',
            previousStatus: 'PENDING_MENTOR',
            newStatus: 'PENDING_HOD',
            ipAddress,
            deviceInfo,
          }
        });

        // Add Workflow history
        await tx.requestWorkflowHistory.create({
          data: {
            requestId: request.id,
            action: 'FORWARDED_TO_HOD',
            performedBy: userId,
            performedRole: 'MENTOR',
            fromStatus: 'PENDING_MENTOR',
            toStatus: 'PENDING_HOD',
            remarks: remarks || 'Mentor Endorsed and forwarded to HOD',
          }
        });

        return req;
      });

      // Notify Student
      if (request.student.userId) {
        try {
          await prisma.notification.create({
            data: {
              recipientId: request.student.userId,
              eventType: 'LEAVE_MENTOR_APPROVED',
              title: `${request.type} Request Endorsed by Mentor`,
              message: `Your ${request.type} request (${request.requestNumber}) was endorsed by Mentor and automatically forwarded to HOD for final approval.`,
              relatedEntityType: 'STUDENT_LEAVE_REQUEST',
              relatedEntityId: request.id,
            },
          });
        } catch (err) {}
      }

      // Notify HOD
      try {
        await prisma.notification.create({
          data: {
            recipientId: hodInfo.hodUserId,
            eventType: 'STUDENT_LEAVE_HOD_PENDING',
            title: `Action Required: HOD Approval for ${request.student.firstName} ${request.student.lastName}`,
            message: `${request.type} request (${request.requestNumber}) endorsed by Mentor ${faculty.firstName} ${faculty.lastName}. Awaiting your final sign-off.`,
            relatedEntityType: 'STUDENT_LEAVE_REQUEST',
            relatedEntityId: request.id,
            deepLinkRoute: `/hod/leave-approvals?requestId=${request.id}`,
          },
        });
      } catch (err) {
        logger.warn('Failed to send HOD notification:', err);
      }

      broadcastRBACUpdate({ type: 'APPROVAL_UPDATED', userId: hodInfo.hodUserId, payload: { requestId: request.id } });
      broadcastRBACUpdate({ type: 'APPROVAL_UPDATED', userId: request.student.userId || undefined, payload: { requestId: request.id } });

      return updated;
    } else if (decision === 'REJECT') {
      const updated = await prisma.$transaction(async (tx) => {
        const req = await tx.studentLeaveRequest.update({
          where: { id: requestId },
          data: {
            status: 'REJECTED_BY_MENTOR',
            workflowStatus: 'REJECTED_BY_MENTOR',
            mentorStatus: 'REJECTED',
            finalStatus: 'REJECTED',
            rejectedAt: new Date(),
            mentorId: faculty.id,
            mentorRemarks: remarks || 'Rejected by Mentor',
          },
        });

        await tx.requestApproval.create({
          data: {
            requestId,
            approverId: userId,
            approverRole: 'MENTOR',
            approvalLevel: 1,
            decision: 'REJECT',
            remarks: remarks || 'Rejected by Mentor',
            previousStatus: 'PENDING_MENTOR',
            newStatus: 'REJECTED_BY_MENTOR',
            ipAddress,
            deviceInfo,
          }
        });

        await tx.requestWorkflowHistory.create({
          data: {
            requestId,
            action: 'MENTOR_REJECTED',
            performedBy: userId,
            performedRole: 'MENTOR',
            fromStatus: 'PENDING_MENTOR',
            toStatus: 'REJECTED_BY_MENTOR',
            remarks: remarks || 'Rejected by Mentor',
          }
        });

        return req;
      });

      if (request.student.userId) {
        try {
          await prisma.notification.create({
            data: {
              recipientId: request.student.userId,
              eventType: 'LEAVE_MENTOR_REJECTED',
              title: `${request.type} Request Rejected by Mentor`,
              message: `Your ${request.type} request (${request.requestNumber}) was rejected by your Mentor. Reason: ${remarks || 'N/A'}`,
              relatedEntityType: 'STUDENT_LEAVE_REQUEST',
              relatedEntityId: request.id,
            },
          });
        } catch (err) {}
      }

      broadcastRBACUpdate({ type: 'APPROVAL_UPDATED', userId: request.student.userId || undefined, payload: { requestId: request.id } });
      return updated;
    } else {
      // RETURN TO STUDENT
      const updated = await prisma.$transaction(async (tx) => {
        const req = await tx.studentLeaveRequest.update({
          where: { id: requestId },
          data: {
            status: 'RETURNED_TO_STUDENT',
            workflowStatus: 'RETURNED_TO_STUDENT',
            studentActionRequired: true,
            mentorRemarks: remarks || 'Returned for clarification',
          },
        });

        await tx.requestWorkflowHistory.create({
          data: {
            requestId,
            action: 'RETURNED_TO_STUDENT',
            performedBy: userId,
            performedRole: 'MENTOR',
            fromStatus: 'PENDING_MENTOR',
            toStatus: 'RETURNED_TO_STUDENT',
            remarks: remarks || 'Returned for clarification',
          }
        });

        return req;
      });

      if (request.student.userId) {
        try {
          await prisma.notification.create({
            data: {
              recipientId: request.student.userId,
              eventType: 'LEAVE_RETURNED',
              title: `${request.type} Request Returned for Clarification`,
              message: `Your Mentor returned request ${request.requestNumber}. Remarks: ${remarks || 'Please revise details'}`,
              relatedEntityType: 'STUDENT_LEAVE_REQUEST',
              relatedEntityId: request.id,
            },
          });
        } catch (err) {}
      }

      return updated;
    }
  }

  /**
   * Level 2 HOD Approval / Rejection / Return / Escalate
   */
  async hodReview(
    userId: string,
    requestId: string,
    action: 'APPROVE' | 'REJECT' | 'RETURN_MENTOR' | 'RETURN_STUDENT' | 'ESCALATE',
    remarks?: string,
    ipAddress?: string,
    deviceInfo?: string
  ) {
    const faculty = await prisma.faculty.findFirst({ where: { userId } });
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });

    if (!user || !['HOD', 'Super Admin', 'Principal', 'Vice Principal', 'Academic Dean'].includes(user.role.name)) {
      const membership = await prisma.departmentMembership.findFirst({
        where: { userId, role: 'HOD' }
      });
      if (!membership) {
        throw new ForbiddenException('Only Department HOD or College Executives can perform Level 2 approvals');
      }
    }

    const trimmedId = (requestId || '').trim();
    const cleanId = trimmedId.replace(/^WF-|^SLR-|^OD-|^FL-/, '');

    let request = await prisma.studentLeaveRequest.findFirst({
      where: {
        OR: [
          { id: trimmedId },
          { requestNumber: trimmedId },
          { requestNumber: { contains: cleanId } },
          { id: { endsWith: cleanId.toLowerCase() } },
          { id: { endsWith: cleanId } }
        ]
      },
      include: { student: { include: { department: true } }, mentor: true },
    });

    if (!request) {
      // Fallback 1: Check WorkflowRequest table (legacy / unified workflow engine)
      const wfReq = await prisma.workflowRequest.findFirst({
        where: {
          OR: [
            { id: trimmedId },
            { id: { endsWith: cleanId.toLowerCase() } },
            { id: { endsWith: cleanId } }
          ]
        },
        include: { student: true, facultyRequester: true }
      });

      if (wfReq) {
        const normAction = (action || '').toUpperCase().replace(/-/g, '_');
        let wfNextStep = wfReq.currentStep;
        let wfNextStatus = wfReq.status;

        if (normAction === 'APPROVE') {
          wfNextStep = wfReq.facultyRequesterId ? 'PRINCIPAL' : 'COMPLETED';
          wfNextStatus = 'APPROVED';
        } else if (normAction === 'REJECT' || normAction === 'REJECTED') {
          wfNextStep = 'COMPLETED';
          wfNextStatus = 'REJECTED_BY_HOD';
        } else if (normAction.includes('MENTOR')) {
          wfNextStep = 'MENTOR';
          wfNextStatus = 'RETURNED_TO_MENTOR';
        } else {
          wfNextStep = 'STUDENT';
          wfNextStatus = 'RETURNED_TO_STUDENT';
        }

        const updatedWf = await prisma.workflowRequest.update({
          where: { id: wfReq.id },
          data: { status: wfNextStatus, currentStep: wfNextStep }
        });

        await prisma.workflowHistory.create({
          data: {
            requestId: wfReq.id,
            stage: 'HOD',
            action: action === 'APPROVE' ? 'APPROVE' : action === 'REJECT' ? 'REJECT' : 'CLARIFICATION',
            comment: remarks || `HOD ${action} action executed`,
            actionById: userId,
            actionByName: user ? `${user.firstName} ${user.lastName}` : 'HOD',
          }
        });

        // Auto-adjust attendance if approved
        if (action === 'APPROVE' && wfReq.studentId && wfReq.startDate && wfReq.endDate) {
          const startDate = new Date(wfReq.startDate);
          const endDate = new Date(wfReq.endDate);
          const currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            const dateObj = new Date(currentDate);
            const existingAtt = await prisma.attendance.findFirst({
              where: { studentId: wfReq.studentId, date: dateObj }
            });

            if (existingAtt) {
              await prisma.attendance.update({
                where: { id: existingAtt.id },
                data: { status: wfReq.type === 'ON_DUTY' ? 'ON_DUTY' : 'EXCUSED_LEAVE', remarks: `Approved by HOD: ${wfReq.title || 'Leave/OD'}` }
              });
            } else {
              await prisma.attendance.create({
                data: {
                  studentId: wfReq.studentId,
                  date: dateObj,
                  status: wfReq.type === 'ON_DUTY' ? 'ON_DUTY' : 'EXCUSED_LEAVE',
                  remarks: `Approved by HOD: ${wfReq.title || 'Leave/OD'}`,
                }
              });
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }

        return {
          id: updatedWf.id,
          requestNumber: `WF-${updatedWf.id.slice(-6).toUpperCase()}`,
          workflowStatus: updatedWf.status,
          status: updatedWf.status,
          approvedAt: new Date(),
        };
      }

      // Fallback 2: Check FacultyLeaveRequest table
      const facLeave = await prisma.facultyLeaveRequest.findFirst({
        where: {
          OR: [
            { id: trimmedId },
            { id: { endsWith: cleanId.toLowerCase() } },
            { id: { endsWith: cleanId } }
          ]
        },
      });

      if (facLeave) {
        const updatedFac = await prisma.facultyLeaveRequest.update({
          where: { id: facLeave.id },
          data: {
            status: action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED_BY_HOD' : 'RETURNED',
            hodApprovedAt: action === 'APPROVE' ? new Date() : undefined,
            hodRemarks: remarks || `HOD ${action}`,
          }
        });

        return {
          id: updatedFac.id,
          requestNumber: `FL-${updatedFac.id.slice(-6).toUpperCase()}`,
          workflowStatus: updatedFac.status,
          status: updatedFac.status,
          approvedAt: new Date(),
        };
      }

      throw new NotFoundException('Leave request not found');
    }

    const ALLOWED_PENDING_STATUSES = [
      'PENDING_HOD', 'APPROVED_MENTOR', 'PENDING_MENTOR', 'SUBMITTED', 'PENDING', 'MENTOR_APPROVED'
    ];

    const isPendingForHod = ALLOWED_PENDING_STATUSES.includes(request.status || '') || ALLOWED_PENDING_STATUSES.includes(request.workflowStatus || '');

    if (!isPendingForHod && !['Super Admin', 'HOD', 'Academic Dean', 'Principal', 'Vice Principal'].includes(user?.role?.name || '')) {
      throw new BadRequestException(`Request is currently in status '${request.status}' and cannot be reviewed by HOD`);
    }

    // Verify Department Isolation (HOD must belong to same department)
    const hodDepartmentId = faculty?.departmentId || (user as any)?.departmentId;
    if (user?.role?.name === 'HOD' && hodDepartmentId && request.student?.departmentId && hodDepartmentId !== request.student.departmentId) {
      throw new ForbiddenException('HOD cannot access or approve leave requests from another department');
    }

    const normAction = (action || '').toUpperCase().replace(/-/g, '_');

    let newStatus = 'APPROVED';
    let newHodStatus = 'APPROVED';
    let finalStatus = 'APPROVED';

    if (normAction === 'REJECT' || normAction === 'REJECTED') {
      newStatus = 'REJECTED_BY_HOD';
      newHodStatus = 'REJECTED';
      finalStatus = 'REJECTED';
    } else if (normAction === 'RETURN_MENTOR' || normAction === 'RETURN_TO_MENTOR') {
      newStatus = 'RETURNED_TO_MENTOR';
      newHodStatus = 'RETURNED';
      finalStatus = 'PENDING';
    } else if (normAction === 'RETURN_STUDENT' || normAction === 'RETURN_TO_STUDENT' || normAction === 'CLARIFICATION' || normAction === 'RETURN') {
      newStatus = 'RETURNED_TO_STUDENT';
      newHodStatus = 'RETURNED';
      finalStatus = 'PENDING';
    } else if (normAction === 'ESCALATE' || normAction === 'ESCALATE_TO_DEAN') {
      newStatus = 'PENDING_DEAN';
      newHodStatus = 'ESCALATED';
      finalStatus = 'PENDING';
    }

    const updated = await prisma.$transaction(async (tx) => {
      const req = await tx.studentLeaveRequest.update({
        where: { id: request.id },
        data: {
          status: newStatus,
          workflowStatus: newStatus,
          hodStatus: newHodStatus,
          finalStatus: finalStatus,
          hodId: faculty?.id || request.hodId,
          hodApprovedAt: normAction === 'APPROVE' ? new Date() : undefined,
          approvedAt: normAction === 'APPROVE' ? new Date() : undefined,
          rejectedAt: (normAction === 'REJECT' || normAction === 'REJECTED') ? new Date() : undefined,
          hodRemarks: remarks || `HOD ${normAction}`,
          studentActionRequired: normAction.includes('STUDENT') || normAction === 'CLARIFICATION' || normAction === 'RETURN',
        },
        include: { student: true }
      });

      await tx.requestApproval.create({
        data: {
          requestId: request.id,
          approverId: userId,
          approverRole: 'HOD',
          approvalLevel: 2,
          decision: action,
          remarks: remarks || `HOD ${action}`,
          previousStatus: 'PENDING_HOD',
          newStatus: newStatus,
          ipAddress,
          deviceInfo,
        }
      });

      await tx.requestWorkflowHistory.create({
        data: {
          requestId: request.id,
          action: `HOD_${action}`,
          performedBy: userId,
          performedRole: 'HOD',
          fromStatus: 'PENDING_HOD',
          toStatus: newStatus,
          remarks: remarks || `HOD ${action}`,
        }
      });

      // Daily Attendance Auto-Adjustment on Final Approval
      if (action === 'APPROVE') {
        const startDate = new Date(request.startDate);
        const endDate = new Date(request.endDate);
        const currentDate = new Date(startDate);
        const attendanceStatus = request.type === 'ON_DUTY' ? 'ON_DUTY' : 'EXCUSED_LEAVE';

        while (currentDate <= endDate) {
          const dateObj = new Date(currentDate);
          const existingAtt = await tx.attendance.findFirst({
            where: { studentId: request.studentId, date: dateObj }
          });

          if (existingAtt) {
            await tx.attendance.update({
              where: { id: existingAtt.id },
              data: {
                status: attendanceStatus,
                remarks: `Official ${request.type} Approved by HOD (${request.requestNumber})`
              }
            });
          } else {
            await tx.attendance.create({
              data: {
                studentId: request.studentId,
                date: dateObj,
                status: attendanceStatus,
                remarks: `Official ${request.type} Approved by HOD (${request.requestNumber})`
              }
            });
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }

        await tx.studentLeaveRequest.update({
          where: { id: requestId },
          data: { attendanceUpdated: true }
        });
      }

      return req;
    });

    // Notify Student
    if (request.student.userId) {
      try {
        await prisma.notification.create({
          data: {
            recipientId: request.student.userId,
            eventType: `LEAVE_HOD_${action}`,
            title: `${request.type} Request ${action === 'APPROVE' ? 'Approved by HOD' : action === 'REJECT' ? 'Rejected by HOD' : 'Updated by HOD'}`,
            message: `Your ${request.type} request (${request.requestNumber}) has been ${action.toLowerCase()}ed by the Department HOD. ${remarks ? `Remarks: ${remarks}` : ''}`,
            relatedEntityType: 'STUDENT_LEAVE_REQUEST',
            relatedEntityId: request.id,
          },
        });
      } catch (err) {}
    }

    broadcastRBACUpdate({ type: 'APPROVAL_UPDATED', userId: request.student.userId || undefined, payload: { requestId: request.id } });

    return updated;
  }

  /**
      try {
        const res = await this.hodReview(userId, id, 'APPROVE', remarks || 'Bulk Approved by HOD');
        results.push({ id, status: 'SUCCESS', res });
      } catch (err: any) {
        results.push({ id, status: 'FAILED', error: err.message });
      }
    }
    return results;
  }

  /**
   * Bulk Reject requests for HOD
   */
  async bulkRejectHod(userId: string, requestIds: string[], remarks: string) {
    if (!remarks) {
      throw new BadRequestException('Mandatory rejection reason required for bulk rejection');
    }
    const results = [];
    for (const id of requestIds) {
      try {
        const res = await this.hodReview(userId, id, 'REJECT', remarks);
        results.push({ id, status: 'SUCCESS', res });
      } catch (err: any) {
        results.push({ id, status: 'FAILED', error: err.message });
      }
    }
    return results;
  }

  /**
   * Automated Attendance Adjustment Engine
   */
  async adjustAttendance(request: any) {
    try {
      const attendanceStatus = request.type === 'ON_DUTY' ? 'ON_DUTY' : 'EXCUSED_LEAVE';
      const curDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);

      while (curDate <= endDate) {
        const dateStr = curDate.toISOString().split('T')[0];
        const dayStart = new Date(`${dateStr}T00:00:00.000Z`);

        const existing = await prisma.attendance.findFirst({
          where: {
            studentId: request.studentId,
            date: dayStart,
          },
        });

        if (existing) {
          await prisma.attendance.update({
            where: { id: existing.id },
            data: {
              status: attendanceStatus,
              remarks: `Auto-adjusted via ${request.type} Request (${request.requestNumber})`,
            },
          });
        } else {
          await prisma.attendance.create({
            data: {
              studentId: request.studentId,
              date: dayStart,
              status: attendanceStatus,
              type: 'DAILY',
              remarks: `Auto-adjusted via ${request.type} Request (${request.requestNumber})`,
            },
          });
        }

        curDate.setDate(curDate.getDate() + 1);
      }

      await prisma.studentLeaveRequest.update({
        where: { id: request.id },
        data: { attendanceUpdated: true },
      });

      logger.info(`✅ Attendance automatically adjusted for student ${request.studentId} (${request.type})`);
    } catch (err) {
      logger.error('Failed to auto-adjust attendance for approved leave:', err);
    }
  }

  /**
   * Get Student Requests with Timeline
   */
  async getStudentRequests(userId: string) {
    const student = await prisma.student.findFirst({ where: { userId } });
    if (!student) return [];

    return prisma.studentLeaveRequest.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
      include: {
        mentor: { select: { id: true, firstName: true, lastName: true } },
        approvals: { orderBy: { actedAt: 'asc' } },
        workflowHistory: { orderBy: { createdAt: 'asc' } },
        attachments: true,
      },
    });
  }

  /**
   * Get Mentor Level 1 Pending Queue
   */
  async getMentorPendingRequests(userId: string) {
    const faculty = await prisma.faculty.findFirst({ where: { userId } });
    if (!faculty) return [];

    return prisma.studentLeaveRequest.findMany({
      where: {
        mentorId: faculty.id,
        workflowStatus: 'PENDING_MENTOR',
      },
      orderBy: { createdAt: 'asc' },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            department: { select: { id: true, name: true, code: true } },
            section: { select: { name: true } },
            semester: { select: { name: true, number: true } },
            attendanceRecords: { select: { status: true } },
          }
        },
        workflowHistory: { orderBy: { createdAt: 'asc' } },
        attachments: true,
      },
    });
  }

  /**
   * Get HOD Requests (Filtered by HOD's Department with tab status support)
   */
  async getHodRequests(userId: string, filterStatus?: string) {
    const faculty = await prisma.faculty.findFirst({ where: { userId } });
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });

    let departmentId = faculty?.departmentId;

    if (!departmentId) {
      const membership = await prisma.departmentMembership.findFirst({ where: { userId, role: 'HOD' } });
      departmentId = membership?.departmentId;
    }

    if (!departmentId && user?.role?.name === 'HOD') {
      const dept = await prisma.department.findFirst({ where: { hodUserId: userId } });
      departmentId = dept?.id;
    }

    // Super Admin or Dean fallback can view all
    const isSuperAdmin = user?.role?.name === 'Super Admin' || user?.role?.name === 'Academic Dean';
    
    const whereCondition: any = {};

    if (!isSuperAdmin) {
      if (!departmentId) return [];
      whereCondition.student = { departmentId };
    }

    if (filterStatus) {
      if (filterStatus === 'PENDING_HOD') {
        whereCondition.OR = [
          { workflowStatus: 'PENDING_HOD' },
          { status: 'PENDING_HOD' },
          { status: 'APPROVED_MENTOR' },
          { workflowStatus: 'APPROVED_MENTOR' },
        ];
      } else if (filterStatus === 'APPROVED') {
        whereCondition.workflowStatus = 'APPROVED';
      } else if (filterStatus === 'REJECTED') {
        whereCondition.workflowStatus = { in: ['REJECTED_BY_HOD', 'REJECTED_BY_MENTOR'] };
      } else if (filterStatus === 'RETURNED') {
        whereCondition.workflowStatus = { in: ['RETURNED_TO_MENTOR', 'RETURNED_TO_STUDENT'] };
      } else if (filterStatus === 'EMERGENCY') {
        whereCondition.isEmergency = true;
      } else if (filterStatus === 'ESCALATED') {
        whereCondition.workflowStatus = 'PENDING_DEAN';
      } else if (filterStatus !== 'ALL') {
        whereCondition.workflowStatus = filterStatus;
      }
    }

    const studentLeaveReqs = await prisma.studentLeaveRequest.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            phone: true,
            parentPhone: true,
            department: { select: { id: true, name: true, code: true } },
            section: { select: { name: true } },
            semester: { select: { name: true, number: true } },
            attendanceRecords: { select: { status: true } },
          }
        },
        mentor: { select: { id: true, firstName: true, lastName: true, email: true } },
        approvals: { orderBy: { actedAt: 'asc' } },
        workflowHistory: { orderBy: { createdAt: 'asc' } },
        attachments: true,
      },
    });

    // Also fetch matching WorkflowRequests (from general workflow engine)
    const workflowWhere: any = {};
    if (!isSuperAdmin && departmentId) {
      workflowWhere.OR = [
        { departmentId },
        { student: { departmentId } }
      ];
    }

    if (filterStatus === 'PENDING_HOD') {
      workflowWhere.OR = [
        { currentStep: 'HOD' },
        { status: 'MENTOR_APPROVED' },
        { status: 'PENDING_HOD' }
      ];
    } else if (filterStatus === 'APPROVED') {
      workflowWhere.status = { in: ['APPROVED', 'COMPLETED', 'HOD_APPROVED'] };
    } else if (filterStatus === 'REJECTED') {
      workflowWhere.status = { in: ['REJECTED', 'REJECTED_BY_HOD', 'REJECTED_BY_MENTOR'] };
    }

    const workflowReqs = await prisma.workflowRequest.findMany({
      where: workflowWhere,
      include: {
        student: {
          include: {
            department: true,
            section: true,
            semester: true,
            attendanceRecords: { select: { status: true } },
          }
        },
        facultyRequester: { include: { department: true } },
        history: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const mappedWfReqs = workflowReqs.map((wf: any) => ({
      id: wf.id,
      requestNumber: `WF-${wf.id.slice(-6).toUpperCase()}`,
      studentId: wf.studentId,
      departmentId: wf.departmentId || wf.student?.departmentId,
      type: wf.type || 'LEAVE',
      requestCategory: 'ACADEMIC',
      reason: wf.reason || wf.title || 'Student Request',
      description: wf.title || wf.reason || '',
      startDate: wf.startDate || wf.createdAt,
      endDate: wf.endDate || wf.createdAt,
      totalDays: wf.startDate && wf.endDate ? Math.max(1, Math.ceil((new Date(wf.endDate).getTime() - new Date(wf.startDate).getTime()) / (1000 * 3600 * 24)) + 1) : 1,
      workflowStatus: (wf.currentStep === 'HOD' || wf.status === 'MENTOR_APPROVED') ? 'PENDING_HOD' : wf.status,
      status: wf.status,
      isEmergency: false,
      student: wf.student ? {
        id: wf.student.id,
        firstName: wf.student.firstName,
        lastName: wf.student.lastName,
        admissionNo: wf.student.admissionNo,
        phone: wf.student.phone || '',
        parentPhone: wf.student.parentPhone || '',
        department: wf.student.department,
        section: wf.student.section,
        semester: wf.student.semester,
        attendanceRecords: wf.student.attendanceRecords || [],
      } : {
        id: wf.facultyRequester?.id || 'FAC',
        firstName: wf.facultyRequester?.firstName || 'Faculty',
        lastName: wf.facultyRequester?.lastName || 'Member',
        admissionNo: wf.facultyRequester?.employeeId || 'EMP',
        phone: wf.facultyRequester?.phone || '',
        parentPhone: '',
        department: wf.facultyRequester?.department,
        section: { name: 'Faculty' },
        semester: { name: 'Staff', number: 0 },
        attendanceRecords: [],
      },
      mentor: null,
      approvals: (wf.history || []).map((h: any) => ({
        id: h.id,
        approverRole: h.stage,
        decision: h.action,
        remarks: h.comment,
        actedAt: h.createdAt,
      })),
      workflowHistory: (wf.history || []).map((h: any) => ({
        id: h.id,
        action: h.action,
        performedRole: h.stage,
        remarks: h.comment,
        createdAt: h.createdAt,
      })),
      attachments: [],
      createdAt: wf.createdAt,
      updatedAt: wf.updatedAt,
    }));

    const existingIds = new Set(studentLeaveReqs.map(r => r.id));
    const uniqueMappedWf = mappedWfReqs.filter(w => !existingIds.has(w.id));

    return [...studentLeaveReqs, ...uniqueMappedWf].sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Get HOD Level 2 Pending Queue specifically
   */
  async getHodPendingRequests(userId: string) {
    return this.getHodRequests(userId, 'PENDING_HOD');
  }

  /**
   * Get Full Request Details by ID with Complete Workflow Timeline
   */
  async getRequestDetails(requestId: string) {
    const cleanId = requestId.replace(/^WF-|^SLR-|^OD-/, '');
    const request = await prisma.studentLeaveRequest.findFirst({
      where: {
        OR: [
          { id: requestId },
          { requestNumber: requestId },
          { requestNumber: { contains: cleanId } },
          { id: { endsWith: cleanId.toLowerCase() } }
        ]
      },
      include: {
        student: {
          include: {
            department: true,
            semester: true,
            section: true,
            course: true,
            program: true,
            mentor: true,
            attendanceRecords: { select: { status: true, date: true } },
          }
        },
        mentor: true,
        approvals: { orderBy: { actedAt: 'asc' } },
        workflowHistory: { orderBy: { createdAt: 'asc' } },
        attachments: true,
      }
    });

    if (request) {
      return request;
    }

    // Fallback lookup in WorkflowRequest table
    const wfReq = await prisma.workflowRequest.findFirst({
      where: {
        OR: [
          { id: requestId },
          { id: { endsWith: cleanId.toLowerCase() } },
          { id: { endsWith: cleanId } }
        ]
      },
      include: {
        student: {
          include: { department: true, semester: true, section: true }
        },
        facultyRequester: true
      }
    });

    if (wfReq) {
      return {
        id: wfReq.id,
        requestNumber: `WF-${wfReq.id.slice(-6).toUpperCase()}`,
        type: wfReq.type === 'ON_DUTY' ? 'ON_DUTY' : 'LEAVE',
        reason: wfReq.title || (wfReq as any).description || 'Workflow Request',
        description: (wfReq as any).description || wfReq.title || '',
        startDate: wfReq.startDate ? wfReq.startDate.toISOString() : new Date().toISOString(),
        endDate: wfReq.endDate ? wfReq.endDate.toISOString() : new Date().toISOString(),
        totalDays: 1,
        status: wfReq.status,
        workflowStatus: wfReq.status,
        createdAt: wfReq.createdAt.toISOString(),
        student: wfReq.student ? {
          id: wfReq.student.id,
          firstName: wfReq.student.firstName,
          lastName: wfReq.student.lastName,
          admissionNo: wfReq.student.admissionNo,
          department: wfReq.student.department,
          section: wfReq.student.section,
          semester: wfReq.student.semester,
        } : {
          id: 'STUDENT-MOCK',
          firstName: 'Student',
          lastName: 'Requester',
          admissionNo: 'REG-2026-001',
          department: { name: 'Computer Science and Engineering' },
        },
        approvals: [],
        workflowHistory: [],
        attachments: [],
      };
    }

    throw new NotFoundException('Leave request not found');
  }
}
