import { prisma } from '../../lib/prisma';
import { BadRequestException, NotFoundException, UnauthorizedException } from '../../utils/exceptions';
import { PrincipalDelegationResolverService } from '../principal-delegation/principal-delegation-resolver.service';
import { PrincipalRequestRoutingService } from '../principal-availability/request-routing.service';
import { WorkflowEngineService } from './workflow-engine.service';
import { validateRequestDate } from '../../utils/leavePolicy';

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
        include: { user: { include: { role: true } } }
      });
    }

    if (!student && !faculty) {
      throw new NotFoundException('User profile not found for this session');
    }

    if (faculty) {
      const startDate = startDateStr ? new Date(startDateStr) : null;
      const endDate = endDateStr ? new Date(endDateStr) : null;

      if (startDate && (type.toUpperCase().includes('LEAVE') || type.toUpperCase().includes('OD'))) {
        await validateRequestDate(startDate, type.toUpperCase().includes('OD'));
      }

      // Determine initial step and target based on role
      const requesterRole = faculty.user?.role?.name || '';
      const isExecutiveRequester = 
        ['HOD', 'Head of Department', 'Vice Principal', 'Academic Dean', 'Admission Dean', 'IQAC Dean'].includes(requesterRole) ||
        requesterRole.toLowerCase().includes('dean') ||
        requesterRole.toLowerCase().includes('hod') ||
        requesterRole.toLowerCase().includes('principal');
      const initialStep = isExecutiveRequester ? 'PRINCIPAL' : 'HOD';

      const request = await prisma.workflowRequest.create({
        data: {
          facultyRequesterId: faculty.id,
          type,
          title,
          reason,
          startDate,
          endDate,
          status: 'PENDING',
          currentStep: initialStep,
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

      // Send notifications
      if (initialStep === 'HOD') {
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
            `Faculty member ${faculty.firstName} ${faculty.lastName} submitted request: "${title}". Forwarded for your HOD approval.`,
            'EMAIL',
            departmentHod.userId || undefined
          );
        }
      } else if (initialStep === 'PRINCIPAL') {
        // Create dynamic ApprovalAssignment record targeting Principal or Vice Principal (Acting Principal)
        const isOd = (type || '').toUpperCase().includes('OD');
        const reqType = isOd ? 'FACULTY_OD' : 'FACULTY_LEAVE';
        await PrincipalRequestRoutingService.createApprovalAssignment({
          requestId: request.id,
          requestType: reqType,
          title: `[${requesterRole || 'Executive'}] ${type}: ${title}`,
          applicantName: `${faculty.firstName} ${faculty.lastName}`,
          departmentName: 'Academic Department',
        });

        // Use authoritative resolver to determine routing
        const delegationContext = await PrincipalDelegationResolverService.resolveStatus();
        const isPrincipalOffline = delegationContext.principalStatus !== 'ONLINE';

        const principalRole = await prisma.role.findFirst({ where: { name: 'Principal' } });
        const principalUsers = principalRole ? await prisma.user.findMany({ where: { roleId: principalRole.id } }) : [];

        if (isPrincipalOffline && delegationContext.delegationStatus === 'ACTIVE' && delegationContext.actingPrincipalUserId) {
          // Route to VP (Acting Principal)
          await this.sendNotification(
            `⚡ Acting Principal: Executive ${type} Request (${faculty.firstName} ${faculty.lastName})`,
            `Principal is ${delegationContext.principalStatus}. Acting Principal mode active: ${type} request "${title}" from ${faculty.firstName} ${faculty.lastName} (${requesterRole || 'Executive'}) requires your authorization.`,
            'EMAIL',
            delegationContext.actingPrincipalUserId
          );
        } else {
          for (const principalUser of principalUsers) {
            await this.sendNotification(
              `Executive ${type} Request: ${faculty.firstName} ${faculty.lastName}`,
              `${type} request "${title}" from ${faculty.firstName} ${faculty.lastName} (${requesterRole || 'Executive'}) requires your approval.`,
              'EMAIL',
              principalUser.id
            );
          }
        }
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

    if (startDate && (type.toUpperCase().includes('LEAVE') || type.toUpperCase().includes('OD'))) {
      await validateRequestDate(startDate, type.toUpperCase().includes('OD'));
    }

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

    // Notify assigned Mentor
    if (resolvedMentorId) {
      const mentor = await prisma.faculty.findUnique({ where: { id: resolvedMentorId } });
      if (mentor) {
        await this.sendNotification(
          `New Student ${type} Request: ${student.firstName} ${student.lastName}`,
          `Student ${student.firstName} ${student.lastName} (${student.admissionNo}) has submitted a new ${type} request: "${title}". Please review and action in your Mentor Portal.`,
          'EMAIL',
          mentor.userId || undefined
        );
      }
    }

    // Send informational notification ONLY to affected class faculties (No approval required)
    try {
      let parsedMeta: any = {};
      if (attachments && typeof attachments === 'string' && attachments.startsWith('{')) {
        parsedMeta = JSON.parse(attachments);
      }
      const affectedIds: string[] = parsedMeta.affectedFacultyIds || [];
      const periodsList: (string | number)[] = parsedMeta.periods || [];

      if (affectedIds.length > 0) {
        const periodStr = periodsList.length > 0 ? `Period ${periodsList.join(', ')}` : 'full-day';
        for (const facId of affectedIds) {
          if (facId === resolvedMentorId) continue; // Avoid duplicate alert if mentor teaches affected period
          const fac = await prisma.faculty.findUnique({ where: { id: facId } });
          if (fac) {
            await this.sendNotification(
              `Student Absence Notice (${student.firstName} ${student.lastName})`,
              `Informational Notice: Student ${student.firstName} ${student.lastName} (${student.admissionNo}) will be absent for ${periodStr} today due to ${type} ("${title}"). No approval action is required from you.`,
              'EMAIL',
              fac.userId || undefined
            );
          }
        }
      }
    } catch (_) {
      // Silently ignore payload format errors
    }

    return request;
  }

  /**
   * List requests filtered by user role and context
   */
  async listRequests(userEmail: string, rawRole: any, status?: string) {
    const userRole = typeof rawRole === 'object' && rawRole !== null ? rawRole.name : String(rawRole || '');
    const filters: any = {};

    if (status) {
      filters.status = status;
    }

    const studentInclude = {
      include: {
        department: true,
        semester: true,
        section: true
      }
    };

    if (userRole === 'Student') {
      const student = await prisma.student.findFirst({ where: { email: userEmail } });
      if (!student) return [];
      filters.studentId = student.id;
      return prisma.workflowRequest.findMany({
        where: filters,
        include: { student: studentInclude, history: true },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (userRole === 'Parent') {
      const students = await prisma.student.findMany({ where: { parentEmail: userEmail } });
      const studentIds = students.map(s => s.id);
      filters.studentId = { in: studentIds };
      return prisma.workflowRequest.findMany({
        where: filters,
        include: { student: studentInclude, history: true },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (['Faculty', 'Mentor', 'FACULTY', 'MENTOR'].includes(userRole)) {
      // Find faculty advisor using email, userId, or user relation
      const user = await prisma.user.findFirst({ where: { email: userEmail } });
      const faculty = await prisma.faculty.findFirst({
        where: {
          OR: [
            { email: userEmail },
            ...(user ? [{ userId: user.id }] : []),
            { user: { email: userEmail } }
          ],
          deleted: false
        }
      });
      
      const statusFilter = status ? (status === 'PENDING' ? { in: ['PENDING', 'PENDING_MENTOR'] } : status) : undefined;

      if (!faculty) {
        // Fallback: Return all pending requests at MENTOR step
        return prisma.workflowRequest.findMany({
          where: {
            currentStep: 'MENTOR',
            ...(statusFilter ? { status: statusFilter } : {})
          },
          include: { 
            student: studentInclude, 
            facultyRequester: { include: { department: true } },
            history: true 
          },
          orderBy: { createdAt: 'desc' }
        });
      }

      return prisma.workflowRequest.findMany({
        where: {
          OR: [
            { mentorId: faculty.id },
            { facultyId: faculty.id },
            { classAdvisorId: faculty.id },
            { facultyRequesterId: faculty.id },
            { student: { mentorId: faculty.id } },
            { student: { facultyId: faculty.id } },
            { departmentId: faculty.departmentId, currentStep: 'MENTOR' }
          ],
          ...(statusFilter ? { status: statusFilter } : {})
        },
        include: { 
          student: studentInclude, 
          facultyRequester: { include: { department: true } },
          history: true 
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (userRole === 'HOD') {
      const user = await prisma.user.findFirst({
        where: { email: userEmail },
        include: { departmentMemberships: true }
      });
      
      const faculty = await prisma.faculty.findFirst({
        where: {
          OR: [
            { email: userEmail },
            ...(user ? [{ userId: user.id }] : []),
            { user: { email: userEmail } }
          ],
          deleted: false
        }
      });

      // Find department by faculty profile, user department, department membership, or HOD assignment
      let targetDeptId = faculty?.departmentId || user?.departmentId || user?.departmentMemberships?.[0]?.departmentId;
      if (!targetDeptId && user?.id) {
        const dept = await prisma.department.findFirst({ where: { hodId: user.id } });
        if (dept) targetDeptId = dept.id;
      }

      const whereClause: any = status ? { status } : {};
      if (targetDeptId) {
        whereClause.departmentId = targetDeptId;
      }

      return prisma.workflowRequest.findMany({
        where: whereClause,
        include: { 
          student: studentInclude, 
          facultyRequester: { include: { department: true } },
          history: true 
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (userRole === 'Principal' || userRole === 'Vice Principal' || userRole.includes('Dean') || userRole === 'Super Admin') {
      const wfFilters: any = { ...filters };
      if (userRole === 'Academic Dean' || userRole === 'Admission Dean' || userRole.includes('Dean')) {
        wfFilters.OR = [{ currentStep: 'DEAN' }, { currentStep: 'PRINCIPAL' }];
      } else {
        wfFilters.currentStep = 'PRINCIPAL';
      }

      const workflowReqs = await prisma.workflowRequest.findMany({
        where: wfFilters,
        include: {
          student: studentInclude,
          facultyRequester: { include: { department: true, user: { include: { role: true } } } },
          history: true
        },
        orderBy: { createdAt: 'desc' }
      });

      const facultyLeaveReqs = await prisma.facultyLeaveRequest.findMany({
        include: {
          faculty: { include: { department: true, user: { include: { role: true } } } },
          department: true,
        },
        orderBy: { createdAt: 'desc' }
      });

      const studentLeaveReqs = await prisma.studentLeaveRequest.findMany({
        include: {
          student: { include: { department: true, user: { include: { role: true } } } },
        },
        orderBy: { createdAt: 'desc' }
      });

      const mappedWf = workflowReqs.map((r: any) => {
        const isFaculty = Boolean(r.facultyRequester);
        const reqRole = isFaculty ? (r.facultyRequester?.user?.role?.name || 'Faculty') : 'Student';
        const isOd = (r.type || '').toUpperCase().includes('OD');

        return {
          ...r,
          requestNumber: r.requestNumber || r.id.substring(0, 8),
          requestType: isFaculty ? (isOd ? 'FACULTY_OD' : 'FACULTY_LEAVE') : (isOd ? 'STUDENT_OD' : 'STUDENT_LEAVE'),
          requesterRole: reqRole,
          requester: {
            id: isFaculty ? r.facultyRequester?.id : r.student?.id,
            firstName: isFaculty ? (r.facultyRequester?.firstName || 'Faculty') : (r.student?.firstName || 'Student'),
            lastName: isFaculty ? (r.facultyRequester?.lastName || '') : (r.student?.lastName || ''),
            email: isFaculty ? r.facultyRequester?.email : r.student?.email,
          },
          department: r.departmentId ? { id: r.departmentId, name: r.facultyRequester?.department?.name || r.student?.department?.name || 'Academic Department' } : (r.facultyRequester?.department || r.student?.department),
          sourceTable: 'WORKFLOW'
        };
      });

      const mappedFaculty = facultyLeaveReqs.map((r: any) => {
        const isOd = r.leaveType === 'ON_DUTY' || (r as any).type === 'ON_DUTY';
        const reqRole = r.faculty?.user?.role?.name || (r.faculty?.designation?.includes('Head') ? 'HOD' : 'Faculty');
        const isDean = reqRole.toLowerCase().includes('dean');
        const isVp = reqRole.toLowerCase().includes('vice principal') || reqRole === 'VP';

        let reqType = isOd ? 'FACULTY_OD' : 'FACULTY_LEAVE';
        if (isDean) reqType = isOd ? 'FACULTY_OD' : 'DEAN_LEAVE';
        if (isVp) reqType = isOd ? 'FACULTY_OD' : 'VP_LEAVE';

        let normalizedStatus = 'PENDING';
        if (r.status === 'APPROVED_PRINCIPAL' || r.status === 'APPROVED') normalizedStatus = 'APPROVED';
        else if (r.status === 'REJECTED_PRINCIPAL' || r.status === 'REJECTED') normalizedStatus = 'REJECTED';

        return {
          id: r.id,
          requestNumber: r.requestNumber || r.id.substring(0, 8),
          type: r.leaveType,
          requestType: reqType,
          title: `Faculty ${r.leaveType ? r.leaveType.replace('_', ' ') : 'Leave'} Request`,
          reason: r.reason || 'Faculty leave request',
          status: normalizedStatus,
          rawStatus: r.status,
          currentStep: 'PRINCIPAL',
          startDate: r.startDate,
          endDate: r.endDate,
          totalDays: r.totalDays,
          createdAt: r.createdAt,
          requesterRole: reqRole,
          requester: {
            id: r.faculty?.id,
            firstName: r.faculty?.firstName || r.faculty?.user?.firstName || 'Faculty',
            lastName: r.faculty?.lastName || r.faculty?.user?.lastName || '',
            email: r.faculty?.email || r.faculty?.user?.email,
          },
          department: r.department || r.faculty?.department,
          sourceTable: 'FACULTY_LEAVE'
        };
      });

      const mappedStudent = studentLeaveReqs.map((r: any) => {
        const isOd = r.type === 'ON_DUTY' || (r.requestCategory || '').includes('OD') || r.requestCategory === 'SPORTS';
        const reqType = isOd ? 'STUDENT_OD' : 'STUDENT_LEAVE';

        let normalizedStatus = 'PENDING';
        if (r.status === 'APPROVED_PRINCIPAL' || r.status === 'APPROVED') normalizedStatus = 'APPROVED';
        else if (r.status === 'REJECTED_PRINCIPAL' || r.status === 'REJECTED') normalizedStatus = 'REJECTED';

        return {
          id: r.id,
          requestNumber: r.requestNumber || r.id.substring(0, 8),
          type: r.type,
          requestType: reqType,
          title: `Student ${r.type} Request (${r.requestCategory || 'General'})`,
          reason: r.reason || 'Student leave request',
          status: normalizedStatus,
          rawStatus: r.status,
          currentStep: 'PRINCIPAL',
          startDate: r.startDate,
          endDate: r.endDate,
          createdAt: r.createdAt,
          requesterRole: 'Student',
          requester: {
            id: r.student?.id,
            firstName: r.student?.firstName || r.student?.user?.firstName || 'Student',
            lastName: r.student?.lastName || r.student?.user?.lastName || '',
            email: r.student?.email || r.student?.user?.email,
          },
          department: r.department || r.student?.department,
          sourceTable: 'STUDENT_LEAVE'
        };
      });

      const combined = [...mappedWf, ...mappedFaculty, ...mappedStudent];
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return combined;
    }

    return [];
  }

  /**
   * Action a request (APPROVE, REJECT, FORWARD, CLARIFICATION)
   */
  async takeAction(
    requestId: string,
    userEmail: string,
    rawRole: any,
    action: 'APPROVE' | 'REJECT' | 'CLARIFICATION' | 'FORWARD',
    comment?: string
  ) {
    const userRole = typeof rawRole === 'object' && rawRole !== null ? rawRole.name : String(rawRole || '');
    const userRoleLower = userRole.toLowerCase();

    const isExecutiveOrHod = 
      ['HOD', 'Academic Dean', 'Admission Dean', 'IQAC Dean', 'Vice Principal', 'Principal', 'Super Admin', 'College Admin'].includes(userRole) || 
      userRoleLower.includes('principal') || 
      userRoleLower.includes('dean') || 
      userRoleLower.includes('admin') ||
      userRoleLower.includes('hod');

    // 1. Check FacultyLeaveRequest
    let facReq: any = null;
    try {
      facReq = await prisma.facultyLeaveRequest.findFirst({
        where: {
          OR: [
            { id: requestId },
            { requestNumber: requestId }
          ]
        },
        include: { faculty: true }
      });
    } catch (e) {}

    if (facReq) {
      const user = await prisma.user.findFirst({
        where: { OR: [{ email: userEmail }, { id: userEmail }] }
      });
      const newStatus = action === 'APPROVE' ? 'APPROVED_PRINCIPAL' : (action === 'REJECT' ? 'REJECTED_PRINCIPAL' : facReq.status);
      const updated = await prisma.facultyLeaveRequest.update({
        where: { id: facReq.id },
        data: {
          status: newStatus,
          ...(user ? { principalId: user.id } : {}),
          principalApprovedAt: action === 'APPROVE' ? new Date() : undefined,
          principalRemarks: comment || `Action ${action} taken by ${userRole}`
        }
      });

      // Sync matching WorkflowRequest if exists
      if (facReq.facultyId) {
        await prisma.workflowRequest.updateMany({
          where: {
            OR: [
              { id: facReq.id },
              { facultyRequesterId: facReq.facultyId }
            ],
            status: { in: ['PENDING', 'HOD_APPROVED', 'PENDING_PRINCIPAL'] }
          },
          data: {
            status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
            currentStep: 'COMPLETED'
          }
        }).catch(() => {});
      }

      // Auto-update attendance for approved leave/OD
      if (action === 'APPROVE' && facReq.facultyId && facReq.startDate && facReq.endDate) {
        try {
          const isOD = facReq.leaveType === 'ON_DUTY';
          const attStatus = isOD ? 'PRESENT' : 'ABSENT';
          const attRemarks = isOD ? 'On Duty (Approved)' : 'Authorized Leave (Approved)';

          let cur = new Date(facReq.startDate);
          const end = new Date(facReq.endDate);
          while (cur <= end) {
            const dateOnly = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate());
            const existing = await prisma.attendance.findFirst({
              where: { facultyId: facReq.facultyId, date: dateOnly }
            });
            if (existing) {
              await prisma.attendance.update({
                where: { id: existing.id },
                data: { status: attStatus, remarks: attRemarks }
              });
            } else {
              await prisma.attendance.create({
                data: {
                  facultyId: facReq.facultyId,
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
          console.error('Attendance error:', attErr);
        }
      }

      if (facReq.faculty?.userId) {
        await this.sendNotification(
          `🔔 Leave Request ${action === 'APPROVE' ? 'Approved' : 'Rejected'} by ${userRole}`,
          `Your leave request (${facReq.requestNumber}) was ${action === 'APPROVE' ? 'approved' : 'rejected'} by ${userRole}.`,
          'EMAIL',
          facReq.faculty.userId
        ).catch(() => {});
      }

      return updated;
    }

    // 2. Check StudentLeaveRequest
    let studReq: any = null;
    try {
      studReq = await prisma.studentLeaveRequest.findFirst({
        where: {
          OR: [
            { id: requestId },
            { requestNumber: requestId }
          ]
        },
        include: { student: true }
      });
    } catch (e) {}

    if (studReq) {
      const user = await prisma.user.findFirst({
        where: { OR: [{ email: userEmail }, { id: userEmail }] }
      });
      const newStatus = action === 'APPROVE' ? 'APPROVED' : (action === 'REJECT' ? 'REJECTED_BY_HOD' : studReq.status);
      const updated = await prisma.studentLeaveRequest.update({
        where: { id: studReq.id },
        data: {
          status: newStatus,
          approvedAt: action === 'APPROVE' ? new Date() : undefined,
          hodRemarks: comment || `Action ${action} taken by ${userRole}`
        }
      });

      // Sync matching WorkflowRequest if exists
      if (studReq.studentId) {
        await prisma.workflowRequest.updateMany({
          where: {
            OR: [
              { id: studReq.id },
              { studentId: studReq.studentId }
            ],
            status: { in: ['PENDING', 'MENTOR_APPROVED', 'HOD_APPROVED'] }
          },
          data: {
            status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
            currentStep: 'COMPLETED'
          }
        }).catch(() => {});
      }

      // Auto-update attendance for approved student leave/OD
      if (action === 'APPROVE' && studReq.studentId && studReq.startDate && studReq.endDate) {
        try {
          const isOD = studReq.type === 'ON_DUTY';
          const attStatus = isOD ? 'ON_DUTY' : 'EXCUSED_LEAVE';
          const attRemarks = isOD ? 'On Duty (Approved)' : 'Excused Leave (Approved)';

          let cur = new Date(studReq.startDate);
          const end = new Date(studReq.endDate);
          while (cur <= end) {
            const dateOnly = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate());
            const existing = await prisma.attendance.findFirst({
              where: { studentId: studReq.studentId, date: dateOnly }
            });
            if (existing) {
              await prisma.attendance.update({
                where: { id: existing.id },
                data: { status: attStatus, remarks: attRemarks }
              });
            } else {
              await prisma.attendance.create({
                data: {
                  studentId: studReq.studentId,
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
          console.error('Student attendance error:', attErr);
        }
      }

      if (studReq.student?.userId) {
        await this.sendNotification(
          `🔔 Request ${action === 'APPROVE' ? 'Approved' : 'Rejected'} by ${userRole}`,
          `Your ${studReq.type} request was ${action === 'APPROVE' ? 'approved' : 'rejected'} by ${userRole}.`,
          'EMAIL',
          studReq.student.userId
        ).catch(() => {});
      }

      return updated;
    }

    // 3. Check WorkflowRequest
    let request: any = null;
    try {
      request = await prisma.workflowRequest.findFirst({
        where: { id: requestId },
        include: { 
          student: { include: { department: true } },
          facultyRequester: { include: { department: true } }
        }
      });
    } catch (e) {}

    if (!request) {
      throw new NotFoundException(`Leave/Workflow request '${requestId}' not found`);
    }

    if (request.facultyRequesterId) {
      if (request.currentStep === 'HOD' && !isExecutiveOrHod) {
        throw new UnauthorizedException('Only the Department HOD or Executive Authority can action this request');
      }
      if (request.currentStep === 'PRINCIPAL') {
        // Use authoritative resolver for Principal availability
        const delegationCtx = await PrincipalDelegationResolverService.resolveStatus();
        const isOffline = delegationCtx.principalStatus !== 'ONLINE';
        const isPrincipalRole = userRoleLower.includes('principal') || userRoleLower.includes('admin') || isExecutiveOrHod;

        if (isOffline && delegationCtx.delegationStatus === 'ACTIVE') {
          if (!isPrincipalRole) {
            throw new UnauthorizedException('Principal is offline. Acting Principal (Vice Principal) authorization required.');
          }
        } else if (!isPrincipalRole) {
          throw new UnauthorizedException('Only the Principal or Executive Authority can action this faculty leave request');
        }
      }
    } else {
      if (request.currentStep === 'MENTOR' && !isExecutiveOrHod && !['Faculty', 'Mentor', 'FACULTY', 'MENTOR'].includes(userRole)) {
        throw new UnauthorizedException('Only the assigned Mentor/Faculty or Department HOD can action this request');
      }

      if (request.currentStep === 'MENTOR' && ['Faculty', 'Mentor', 'FACULTY', 'MENTOR'].includes(userRole) && !isExecutiveOrHod) {
        const user = await prisma.user.findFirst({ where: { email: userEmail } });
        const faculty = await prisma.faculty.findFirst({
          where: {
            OR: [
              { email: userEmail },
              ...(user ? [{ userId: user.id }] : []),
              { user: { email: userEmail } }
            ],
            deleted: false
          }
        });

        if (faculty) {
          const isAssigned =
            request.facultyId === faculty.id ||
            request.classAdvisorId === faculty.id ||
            request.mentorId === faculty.id ||
            request.departmentId === faculty.departmentId ||
            (request.student && (
              request.student.facultyId === faculty.id ||
              request.student.classAdvisorId === faculty.id ||
              request.student.mentorId === faculty.id ||
              request.student.departmentId === faculty.departmentId
            ));

          if (!isAssigned && userRole !== 'Super Admin') {
            throw new UnauthorizedException('You are not the assigned Faculty/Mentor for this student');
          }
        }
      }

      if (request.currentStep === 'HOD' && !isExecutiveOrHod) {
        throw new UnauthorizedException('Only the Department HOD or Executive Authority can action this request');
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
        nextStatus = isExecutiveOrHod ? 'REJECTED_BY_HOD' : 'REJECTED_BY_MENTOR';
        nextStep = 'COMPLETED';
      } else if (request.currentStep === 'HOD') {
        nextStatus = 'REJECTED_BY_HOD';
        nextStep = 'COMPLETED';
      } else if (request.currentStep === 'PRINCIPAL') {
        nextStatus = 'REJECTED';
        nextStep = 'COMPLETED';
      } else {
        nextStatus = 'REJECTED';
        nextStep = 'COMPLETED';
      }

    } else if (action === 'CLARIFICATION') {
      nextStatus = 'CLARIFICATION_REQUESTED';
    } else if (action === 'FORWARD' || action === 'APPROVE') {
      if (request.currentStep === 'MENTOR') {
        if (isExecutiveOrHod) {
          // HOD or Executive Authority approving directly approves the student request
          nextStatus = 'APPROVED';
          nextStep = 'COMPLETED';
        } else {
          // Student workflow: Mentor Approved -> Forward to HOD for final approval
          nextStep = 'HOD';
          nextStatus = 'MENTOR_APPROVED';
        }
      } else if (request.currentStep === 'HOD') {
        if (request.facultyRequesterId) {
          // Faculty workflow: HOD Approved -> Forward to Principal
          nextStep = 'PRINCIPAL';
          nextStatus = 'HOD_APPROVED';
        } else {
          // Student workflow: HOD Final Approval
          nextStatus = 'APPROVED';
          nextStep = 'COMPLETED';
        }
      } else if (request.currentStep === 'PRINCIPAL') {
        nextStatus = 'APPROVED';
        nextStep = 'COMPLETED';
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
      // Use authoritative resolver for Principal availability
      const hodCtx = await PrincipalDelegationResolverService.resolveStatus();
      const isPrincipalOffline = hodCtx.principalStatus !== 'ONLINE' && hodCtx.delegationStatus === 'ACTIVE';

      const targetRoleName = isPrincipalOffline ? 'Vice Principal' : 'Principal';
      const targetRole = await prisma.role.findFirst({ where: { name: targetRoleName } });
      const targetUsers = targetRole ? await prisma.user.findMany({ where: { roleId: targetRole.id } }) : [];

      for (const targetUser of targetUsers) {
        await this.sendNotification(
          `🔔 ${isPrincipalOffline ? '⚡ Acting Principal (VP): ' : ''}HOD Approved Faculty Leave/OD Request`,
          `Faculty Leave/OD request from ${request.facultyRequester?.firstName} ${request.facultyRequester?.lastName} has been approved by HOD and is pending your ${isPrincipalOffline ? 'Acting Principal ' : ''}final approval.`,
          'EMAIL',
          targetUser.id || undefined
        );
      }

      // Notify Faculty
      await this.sendNotification(
        `🔔 HOD Approved`,
        `Your Leave/OD request has been approved by HOD and forwarded to ${targetRoleName} for final approval.`,
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
        // Cross-update FacultyLeaveRequest table
        await prisma.facultyLeaveRequest.updateMany({
          where: {
            facultyId: request.facultyRequesterId,
            status: { in: ['PENDING_HOD', 'APPROVED_HOD', 'PENDING_PRINCIPAL', 'PENDING'] }
          },
          data: {
            status: 'APPROVED_PRINCIPAL',
            principalId: actorId,
            principalApprovedAt: new Date(),
            principalRemarks: comment || `Approved by ${userRole}`
          }
        }).catch(() => {});

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
        if (request.studentId) {
          // Cross-update StudentLeaveRequest table
          await prisma.studentLeaveRequest.updateMany({
            where: {
              studentId: request.studentId,
              status: { in: ['PENDING_HOD', 'PENDING_MENTOR', 'APPROVED_MENTOR', 'PENDING'] }
            },
            data: {
              status: 'APPROVED',
              approvedAt: new Date(),
              hodRemarks: comment || `Approved by ${userRole}`
            }
          }).catch(() => {});
        }

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
      if (student) {
        const direct = await prisma.studentLeaveRequest.findFirst({ where: { id: requestId, studentId: student.id } });
        if (!direct) throw new NotFoundException('Request not found');
        if (!['DRAFT', 'PENDING_MENTOR', 'MENTOR_APPROVED', 'PENDING_HOD', 'RETURNED_TO_STUDENT'].includes(direct.status)) {
          throw new BadRequestException('Only requests awaiting a decision can be cancelled');
        }
        return prisma.studentLeaveRequest.update({ where: { id: requestId }, data: { status: 'CANCELLED' } });
      }
      if (faculty) {
        const direct = await prisma.facultyLeaveRequest.findFirst({ where: { id: requestId, facultyId: faculty.id } });
        if (!direct) throw new NotFoundException('Request not found');
        if (!direct.status.startsWith('PENDING') && !['DRAFT', 'RETURNED'].includes(direct.status)) {
          throw new BadRequestException('Only requests awaiting a decision can be cancelled');
        }
        return prisma.facultyLeaveRequest.update({ where: { id: requestId }, data: { status: 'CANCELLED' } });
      }
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
