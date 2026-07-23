import { prisma } from '../../lib/prisma';
import { BadRequestException, NotFoundException, UnauthorizedException } from '../../utils/exceptions';

export class WorkflowService {
  /**
   * Submit a new student leave/document request
   */
  async createRequest(
    userEmail: string,
    type: string,
    title: string,
    reason: string,
    startDateStr?: string,
    endDateStr?: string,
    attachments?: string
  ) {
    // Find student matching user account email or student email
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { email: userEmail },
          { user: { email: userEmail } }
        ],
        deleted: false
      },
      include: { user: true, section: true }
    });

    let faculty = null;
    if (!student) {
      faculty = await prisma.faculty.findFirst({
        where: {
          OR: [
            { email: userEmail },
            { user: { email: userEmail } }
          ],
          deleted: false
        },
        include: { user: true }
      });
    }

    if (!student && !faculty) {
      throw new NotFoundException('User profile not found for this session');
    }

    if (faculty) {
      const startDate = startDateStr ? new Date(startDateStr) : null;
      const endDate = endDateStr ? new Date(endDateStr) : null;

      const request = await prisma.workflowRequest.create({
        data: {
          facultyRequesterId: faculty.id,
          type,
          title,
          reason,
          startDate,
          endDate,
          status: 'PENDING',
          currentStep: 'HOD',
          attachments: attachments || '[]',
          departmentId: faculty.departmentId,
        },
      });

      // Create history trace
      await prisma.workflowHistory.create({
        data: {
          requestId: request.id,
          stage: 'FACULTY',
          action: 'SUBMIT',
          comment: `Submitted ${type} request: ${title}`,
          actionById: faculty.userId || 'FACULTY',
          actionByName: `${faculty.firstName} ${faculty.lastName}`,
        },
      });

      // Notify HOD
      const hodRole = await prisma.role.findFirst({ where: { name: 'HOD' } });
      const departmentHod = hodRole ? await prisma.faculty.findFirst({
        where: {
          departmentId: faculty.departmentId,
          user: { roleId: hodRole.id }
        }
      }) : null;
      
      if (departmentHod) {
        await this.sendNotification(
          `New Faculty ${type} Request`,
          `Faculty member ${faculty.firstName} ${faculty.lastName} has submitted a new request: "${title}". Please review and action in your Leave & OD Approvals module.`,
          'EMAIL',
          departmentHod.userId || undefined
        );
      }

      return request;
    }

    if (!student) {
      throw new NotFoundException('Student profile not found for this user session');
    }

    // Resolve Faculty, Class Advisor, and Mentor Mappings
    // Replace mentor_id dependency with: faculty_id, class_advisor_id. If mentor_id is null, automatically use assigned faculty.
    let resolvedFacultyId = student.facultyId || student.mentorId || student.section?.classAdvisor || null;
    let resolvedClassAdvisorId = student.classAdvisorId || student.section?.classAdvisor || resolvedFacultyId || null;

    if (!resolvedFacultyId) {
      const defaultFaculty = await prisma.faculty.findFirst({
        where: { departmentId: student.departmentId, deleted: false }
      });
      if (defaultFaculty) {
        resolvedFacultyId = defaultFaculty.id;
        resolvedClassAdvisorId = resolvedClassAdvisorId || defaultFaculty.id;
      }
    }
    const resolvedMentorId = resolvedFacultyId; // Sync mentorId with facultyId for legacy compatibility
    const departmentId = student.departmentId || null;

    const startDate = startDateStr ? new Date(startDateStr) : null;
    const endDate = endDateStr ? new Date(endDateStr) : null;

    const request = await prisma.workflowRequest.create({
      data: {
        studentId: student.id,
        type,
        title,
        reason,
        startDate,
        endDate,
        status: 'PENDING',
        currentStep: 'MENTOR',
        attachments: attachments || '[]',
        mentorId: resolvedMentorId,
        facultyId: resolvedFacultyId,
        classAdvisorId: resolvedClassAdvisorId,
        departmentId,
      },
    });

    // Create history trace
    await prisma.workflowHistory.create({
      data: {
        requestId: request.id,
        stage: 'STUDENT',
        action: 'SUBMIT',
        comment: `Submitted ${type} request: ${title}`,
        actionById: student.userId || 'STUDENT',
        actionByName: `${student.firstName} ${student.lastName}`,
      },
    });

    // Notify assigned Faculty Advisor and Class Advisor instantly
    const notifyIds = Array.from(new Set([resolvedFacultyId, resolvedClassAdvisorId].filter(Boolean) as string[]));
    for (const targetId of notifyIds) {
      const faculty = await prisma.faculty.findUnique({ where: { id: targetId } });
      if (faculty) {
        await this.sendNotification(
          `New ${type} Request Received`,
          `Student ${student.firstName} ${student.lastName} (${student.admissionNo}) has submitted a new ${type} request: "${title}". Please review and action in your Student Leave / OD Requests module.`,
          'EMAIL',
          faculty.userId || undefined
        );
      }
    }

    return request;
  }

  /**
   * List requests filtered by user role and context
   */
  async listRequests(userEmail: string, userRole: string, status?: string) {
    const filters: any = {};

    if (status) {
      filters.status = status;
    }

    if (userRole === 'Student') {
      const student = await prisma.student.findFirst({ where: { email: userEmail } });
      if (!student) return [];
      filters.studentId = student.id;
      return prisma.workflowRequest.findMany({
        where: filters,
        include: { student: true, history: true },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (userRole === 'Parent') {
      const students = await prisma.student.findMany({ where: { parentEmail: userEmail } });
      const studentIds = students.map(s => s.id);
      filters.studentId = { in: studentIds };
      return prisma.workflowRequest.findMany({
        where: filters,
        include: { student: true, history: true },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (userRole === 'Faculty') {
      // Find faculty advisor
      const faculty = await prisma.faculty.findFirst({ where: { email: userEmail } });
      if (!faculty) return [];
      
      return prisma.workflowRequest.findMany({
        where: {
          OR: [
            { mentorId: faculty.id },
            { facultyId: faculty.id },
            { classAdvisorId: faculty.id },
            { facultyRequesterId: faculty.id }
          ],
          ...(status ? { status } : {})
        },
        include: { 
          student: { include: { department: true } }, 
          facultyRequester: { include: { department: true } },
          history: true 
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (userRole === 'HOD') {
      // Find HOD faculty
      const faculty = await prisma.faculty.findFirst({ where: { email: userEmail } });
      if (!faculty) return [];
      
      return prisma.workflowRequest.findMany({
        where: {
          departmentId: faculty.departmentId,
          NOT: {
            currentStep: 'MENTOR',
            status: 'PENDING'
          },
          ...(status ? { status } : {})
        },
        include: { 
          student: { include: { department: true } }, 
          facultyRequester: { include: { department: true } },
          history: true 
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (userRole === 'Principal' || userRole === 'Academic Dean' || userRole === 'Admission Dean' || userRole === 'Super Admin') {
      // Principal/Dean/Super Admin can see everything or what is at their steps
      if (userRole === 'Academic Dean') {
        filters.currentStep = 'DEAN';
        filters.facultyRequesterId = null;
      } else if (userRole === 'Admission Dean') {
        filters.currentStep = 'DEAN';
        filters.facultyRequesterId = { not: null };
      } else if (userRole === 'Principal') {
        filters.currentStep = 'PRINCIPAL';
      }
      return prisma.workflowRequest.findMany({
        where: filters,
        include: { 
          student: true, 
          facultyRequester: { include: { department: true } },
          history: true 
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    return [];
  }

  /**
   * Action a request (APPROVE, REJECT, FORWARD, CLARIFICATION)
   */
  async takeAction(
    requestId: string,
    userEmail: string,
    userRole: string,
    action: 'APPROVE' | 'REJECT' | 'CLARIFICATION' | 'FORWARD',
    comment?: string
  ) {
    const request = await prisma.workflowRequest.findUnique({
      where: { id: requestId },
      include: { 
        student: { include: { department: true } },
        facultyRequester: { include: { department: true } }
      }
    });

    if (!request) {
      throw new NotFoundException('Workflow request not found');
    }

    // Verify auth role matches step
    if (request.facultyRequesterId) {
      if (request.currentStep === 'HOD' && userRole !== 'HOD' && userRole !== 'Super Admin') {
        throw new UnauthorizedException('Only the Department HOD can action this request');
      }
      if (request.currentStep === 'DEAN' && userRole !== 'Admission Dean' && userRole !== 'Super Admin') {
        throw new UnauthorizedException('Only the Admission Dean can action this request');
      }
    } else {
      if (request.currentStep === 'MENTOR' && userRole !== 'Faculty' && userRole !== 'Super Admin') {
        throw new UnauthorizedException('Only the assigned Mentor/Faculty can action this request');
      }

      if (request.currentStep === 'MENTOR' && userRole === 'Faculty') {
        const faculty = await prisma.faculty.findFirst({ where: { email: userEmail } });
        if (!faculty) {
          throw new UnauthorizedException('Faculty profile not found');
        }

        const isAssigned =
          request.facultyId === faculty.id ||
          request.classAdvisorId === faculty.id ||
          request.mentorId === faculty.id ||
          (request.student && (
            request.student.facultyId === faculty.id ||
            request.student.classAdvisorId === faculty.id ||
            request.student.mentorId === faculty.id
          ));

        if (!isAssigned) {
          throw new UnauthorizedException('You are not the assigned Faculty, Class Advisor, or Mentor for this student');
        }
      }

      if (request.currentStep === 'HOD' && userRole !== 'HOD' && userRole !== 'Super Admin') {
        throw new UnauthorizedException('Only the Department HOD can action this request');
      }
    }

    let nextStep = request.currentStep;
    let nextStatus = request.status;

    // Resolve user profile for logging name
    const user = await prisma.user.findFirst({ where: { email: userEmail } });
    const actorName = user ? `${user.firstName} ${user.lastName}` : userRole;
    const actorId = user ? user.id : 'SYSTEM';

    if (action === 'REJECT') {
      if (request.currentStep === 'MENTOR') {
        nextStatus = 'REJECTED_BY_MENTOR';
      } else if (request.currentStep === 'HOD') {
        nextStatus = 'REJECTED_BY_HOD';
      } else if (request.currentStep === 'DEAN') {
        nextStatus = 'REJECTED_BY_DEAN';
      } else {
        nextStatus = 'REJECTED';
      }
    } else if (action === 'CLARIFICATION') {
      nextStatus = 'CLARIFICATION_REQUESTED';
    } else if (action === 'FORWARD' || action === 'APPROVE') {
      if (request.currentStep === 'MENTOR') {
        if (action === 'FORWARD') {
          nextStep = 'HOD';
          nextStatus = 'MENTOR_APPROVED';
        } else {
          nextStatus = 'APPROVED';
          nextStep = 'MENTOR';
        }
      } else if (request.currentStep === 'HOD') {
        if (action === 'FORWARD' || (action === 'APPROVE' && request.facultyRequesterId)) {
          nextStep = 'DEAN';
          nextStatus = request.facultyRequesterId ? 'HOD_APPROVED' : 'PENDING';
        } else {
          nextStatus = 'APPROVED';
        }
      } else if (request.currentStep === 'DEAN') {
        if (action === 'FORWARD') {
          nextStep = 'PRINCIPAL';
          nextStatus = 'PENDING';
        } else {
          nextStatus = 'APPROVED';
        }
      } else if (request.currentStep === 'PRINCIPAL') {
        nextStatus = 'APPROVED';
      }
    }

    const updatedRequest = await prisma.workflowRequest.update({
      where: { id: requestId },
      data: {
        status: nextStatus,
        currentStep: nextStep,
      },
    });

    // Write history log
    await prisma.workflowHistory.create({
      data: {
        requestId,
        stage: request.currentStep,
        action,
        comment: comment || `${action} by ${actorName}`,
        actionById: actorId,
        actionByName: actorName,
      },
    });

    // Send notifications to appropriate roles/parties & handle attendance integration
    if (nextStatus === 'MENTOR_APPROVED') {
      // Notify HOD
      const hodRole = await prisma.role.findFirst({ where: { name: 'HOD' } });
      const departmentHod = hodRole ? await prisma.faculty.findFirst({
        where: {
          departmentId: request.student?.departmentId || '',
          user: { roleId: hodRole.id }
        }
      }) : null;
      
      if (departmentHod) {
        await this.sendNotification(
          `🔔 New Student Request: ${request.student?.firstName} ${request.student?.lastName}`,
          `A ${request.type} request "${request.title}" from ${request.student?.firstName} ${request.student?.lastName} has been approved by Advisor and is pending your HOD approval.`,
          'EMAIL',
          departmentHod.userId || undefined
        );
      }

      await this.sendNotification(
        `🔔 Request Approved by Faculty/Advisor`,
        `Your request "${request.title}" has been approved by your Faculty Advisor / Class Advisor and sent to HOD for final approval.`,
        'EMAIL',
        request.student?.userId || undefined
      );

    } else if (nextStatus === 'REJECTED_BY_MENTOR') {
      await this.sendNotification(
        `🔔 Request Rejected by Faculty/Advisor`,
        `Your request has been rejected by your Faculty Advisor / Class Advisor. Remarks: ${comment || 'None'}`,
        'EMAIL',
        request.student?.userId || undefined
      );

    } else if (nextStatus === 'HOD_APPROVED' && request.facultyRequesterId) {
      // Notify Admission Dean
      const deanRole = await prisma.role.findFirst({ where: { name: 'Admission Dean' } });
      const deanUsers = deanRole ? await prisma.user.findMany({ where: { roleId: deanRole.id } }) : [];
      for (const deanUser of deanUsers) {
        await this.sendNotification(
          `🔔 HOD Approved Faculty Leave/OD Request`,
          `Faculty Leave/OD request from ${request.facultyRequester?.firstName} ${request.facultyRequester?.lastName} has been approved by HOD and is pending your final approval.`,
          'EMAIL',
          deanUser.id || undefined
        );
      }

      // Notify Faculty
      await this.sendNotification(
        `🔔 HOD Approved`,
        `Your Leave/OD request has been approved by HOD and forwarded to Admission Dean.`,
        'EMAIL',
        request.facultyRequester?.userId || undefined
      );

    } else if (nextStatus === 'REJECTED_BY_HOD') {
      if (request.facultyRequesterId) {
        await this.sendNotification(
          `🔔 HOD Rejected`,
          `Your Leave/OD request has been rejected by HOD. Remarks: ${comment || 'None'}`,
          'EMAIL',
          request.facultyRequester?.userId || undefined
        );
      } else {
        await this.sendNotification(
          `🔔 Request Rejected by HOD`,
          `Your request has been rejected by HOD. Remarks: ${comment || 'None'}`,
          'EMAIL',
          request.student?.userId || undefined
        );
      }

    } else if (nextStatus === 'REJECTED_BY_DEAN') {
      if (request.facultyRequesterId) {
        await this.sendNotification(
          `🔔 Final Rejected`,
          `Your Leave/OD request has been rejected by Admission Dean. Remarks: ${comment || 'None'}`,
          'EMAIL',
          request.facultyRequester?.userId || undefined
        );
      }

    } else if (nextStatus === 'APPROVED') {
      if (request.facultyRequesterId) {
        await this.sendNotification(
          `🔔 Final Approved`,
          `Your Leave/OD request has been fully approved.`,
          'EMAIL',
          request.facultyRequester?.userId || undefined
        );

        if (request.startDate && request.endDate) {
          try {
            const isOD = request.type.includes('OD');
            const status = isOD ? 'PRESENT' : 'ABSENT';
            const remarks = isOD ? 'On Duty (Approved)' : 'Authorized Leave (Approved)';

            let cur = new Date(request.startDate);
            const end = new Date(request.endDate);

            while (cur <= end) {
              const dateOnly = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate());
              const existing = await prisma.attendance.findFirst({
                where: {
                  facultyId: request.facultyRequesterId,
                  date: dateOnly,
                }
              });

              if (existing) {
                await prisma.attendance.update({
                  where: { id: existing.id },
                  data: { status, remarks }
                });
              } else {
                await prisma.attendance.create({
                  data: {
                    facultyId: request.facultyRequesterId,
                    date: dateOnly,
                    status,
                    remarks,
                    type: 'DAILY',
                  }
                });
              }
              cur.setDate(cur.getDate() + 1);
            }
          } catch (attErr) {
            console.error('Failed to auto-update attendance for approved faculty request:', attErr);
          }
        }
      } else {
        const actorLabel = userRole === 'HOD' ? 'HOD' : 'your Faculty Advisor / Class Advisor';
        await this.sendNotification(
          `Request Status Update: Approved`,
          `Your request has been approved by ${actorLabel}.`,
          'EMAIL',
          request.student?.userId || undefined
        );

        // ── Attendance Integration on Final Approval for Student ──
        if (request.startDate && request.endDate) {
          try {
            const isOD = request.type.includes('OD') || request.type.includes('INTERNSHIP') || request.type.includes('SYMPOSIUM');
            const status = isOD ? 'PRESENT' : 'ABSENT';
            const remarks = isOD ? 'On Duty (Approved)' : 'Authorized Leave (Approved)';

            let cur = new Date(request.startDate);
            const end = new Date(request.endDate);

            while (cur <= end) {
              const dateOnly = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate());
              const existing = await prisma.attendance.findFirst({
                where: {
                  studentId: request.studentId || '',
                  date: dateOnly,
                }
              });

              if (existing) {
                await prisma.attendance.update({
                  where: { id: existing.id },
                  data: { status, remarks }
                });
              } else {
                await prisma.attendance.create({
                  data: {
                    studentId: request.studentId || '',
                    date: dateOnly,
                    status,
                    remarks,
                    type: 'DAILY',
                  }
                });
              }
              cur.setDate(cur.getDate() + 1);
            }
          } catch (attErr) {
            console.error('Failed to auto-update attendance for approved request:', attErr);
          }
        }
      }
    } else {
      // Default notification for other statuses (e.g. clarification requested)
      await this.sendNotification(
        `Request Status Update: ${request.title}`,
        `Your request status has been updated to "${nextStatus.replace(/_/g, ' ')}" by ${actorName}.`,
        'EMAIL',
        request.facultyRequester?.userId || request.student?.userId || undefined
      );
    }

    return updatedRequest;
  }

  /**
   * Cancel pending request by student owner
   */
  async cancelRequest(requestId: string, userEmail: string) {
    const student = await prisma.student.findFirst({ where: { email: userEmail } });
    let faculty = null;
    if (!student) {
      faculty = await prisma.faculty.findFirst({ where: { email: userEmail } });
    }

    if (!student && !faculty) {
      throw new NotFoundException('User profile not found for this session');
    }

    const request = await prisma.workflowRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (student && request.studentId !== student.id) {
      throw new UnauthorizedException('Access denied');
    }

    if (faculty && request.facultyRequesterId !== faculty.id) {
      throw new UnauthorizedException('Access denied');
    }

    if (request.status !== 'PENDING' && !request.status.startsWith('PENDING')) {
      throw new BadRequestException('Only pending requests can be cancelled (before approval)');
    }

    const updated = await prisma.workflowRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' }
    });

    await prisma.workflowHistory.create({
      data: {
        requestId,
        stage: faculty ? 'FACULTY' : 'STUDENT',
        action: 'CANCEL',
        comment: 'Request cancelled by requester',
        actionById: (faculty ? faculty.userId : student?.userId) || 'USER',
        actionByName: faculty ? `${faculty.firstName} ${faculty.lastName}` : `${student?.firstName} ${student?.lastName}`,
      }
    });

    return updated;
  }

  /**
   * Helper to dispatch system notification and log to console
   */
  private async sendNotification(title: string, content: string, type: string = 'EMAIL', _targetUserId?: string) {
    await prisma.systemNotification.create({
      data: {
        title,
        content,
        type,
        status: 'SENT',
      }
    });
    console.log(`📣 [NOTIFICATION DISPATCHED] ${title}: ${content}`);
  }
}
