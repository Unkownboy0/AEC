import { prisma } from '../../lib/prisma';
import type { DomainEvent } from './domain-events.types';
import { logger } from '../../utils/logger';

export class RecipientResolverService {
  /**
   * Computes the list of recipient user IDs for a given domain event.
   * Strictly resolves active user IDs (owning device tokens) across all roles.
   */
  public static async resolveRecipients(event: DomainEvent): Promise<string[]> {
    const recipients = new Set<string>();
    const explicitTargets = new Set<string>();

    // 1. Direct targets explicitly specified on the event
    if (event.targetUserIds && event.targetUserIds.length > 0) {
      event.targetUserIds.forEach((id) => {
        if (id && typeof id === 'string') {
          recipients.add(id);
          explicitTargets.add(id);
        }
      });
    }

    // 2. Resolve based on Event Type & Domain Context
    try {
      switch (event.eventType) {
        // ─── Institutional Circulars & Notices ─────────────────────────────
        case 'CIRCULAR_PUBLISHED':
        case 'EMERGENCY_CIRCULAR':
        case 'CIRCULAR_REMINDER': {
          if (event.entityId && recipients.size === 0) {
            try {
              const { CircularRecipientService } = await import('../circulars/circular-recipient.service');
              const circular = await (prisma as any).circular.findUnique({
                where: { id: event.entityId },
              });
              if (circular) {
                const targetIds = await CircularRecipientService.resolveTargetUserIds(circular);
                targetIds.forEach((id) => recipients.add(id));
              }
            } catch (err) {
              logger.warn(`[RecipientResolver] Circular lookup error for ${event.entityId}:`, err);
            }
          }

          if (recipients.size === 0) {
            if (event.departmentId) {
              const deptUsers = await prisma.user.findMany({
                where: { departmentId: event.departmentId, status: 'ACTIVE' },
                select: { id: true },
              });
              deptUsers.forEach((u) => recipients.add(u.id));

              const deptFaculty = await prisma.faculty.findMany({
                where: { departmentId: event.departmentId, status: 'ACTIVE', userId: { not: null } },
                select: { userId: true },
              });
              deptFaculty.forEach((f) => f.userId && recipients.add(f.userId));

              const deptStudents = await prisma.student.findMany({
                where: { departmentId: event.departmentId, status: 'ACTIVE', userId: { not: null } },
                select: { userId: true },
              });
              deptStudents.forEach((s) => s.userId && recipients.add(s.userId));
            } else {
              const allUsers = await prisma.user.findMany({
                where: { status: 'ACTIVE' },
                select: { id: true },
              });
              allUsers.forEach((u) => recipients.add(u.id));
            }
          }
          break;
        }

        // ─── Student Leave & OD Submissions ────────────────────────────────
        // When Student submits: notify ONLY current Mentor reviewer
        case 'LEAVE_SUBMITTED':
        case 'LEAVE_REQUESTED':
        case 'OD_SUBMITTED':
        case 'OD_REQUESTED':
        case 'STUDENT_OD_SUBMITTED':
        case 'STUDENT_LEAVE_SUBMITTED': {
          if (event.entityId && recipients.size === 0) {
            const studentLeave = await prisma.studentLeaveRequest.findUnique({
              where: { id: event.entityId },
              include: {
                student: {
                  include: {
                    mentor: { select: { userId: true } },
                    department: true,
                  },
                },
                mentor: { select: { userId: true } },
              },
            }).catch(() => null);

            let mentorUserId = studentLeave?.mentor?.userId || studentLeave?.student?.mentor?.userId;

            if (!mentorUserId && studentLeave?.studentId) {
              mentorUserId = await this.resolveStudentMentor(studentLeave.studentId);
            }

            if (mentorUserId) {
              recipients.add(mentorUserId);
            }
          }
          break;
        }

        // ─── Leave & OD Mentor Approval / Forwarding to HOD ────────────────
        case 'LEAVE_FORWARDED':
        case 'OD_FORWARDED':
        case 'STUDENT_OD_MENTOR_APPROVED':
        case 'STUDENT_LEAVE_MENTOR_APPROVED':
        case 'STUDENT_OD_FORWARDED':
        case 'STUDENT_LEAVE_FORWARDED':
        case 'FACULTY_LEAVE_FORWARDED':
        case 'FACULTY_OD_FORWARDED':
        case 'FACULTY_LEAVE_RECOMMENDED':
        case 'FACULTY_OD_RECOMMENDED': {
          let deptId = event.departmentId;

          if (!deptId && event.entityId) {
            const studentLeave = await prisma.studentLeaveRequest.findUnique({
              where: { id: event.entityId },
              select: { departmentId: true, student: { select: { departmentId: true } } },
            }).catch(() => null);
            deptId = studentLeave?.departmentId || studentLeave?.student?.departmentId || undefined;
          }

          if (deptId) {
            const hodUserId = await this.findDepartmentHod(deptId);
            if (hodUserId) recipients.add(hodUserId);
          }

          // If faculty request forwarded beyond HOD, notify Principals/VPs
          if (event.eventType.startsWith('FACULTY')) {
            const principals = await this.findUsersByRole(['PRINCIPAL', 'VICE_PRINCIPAL', 'VICE PRINCIPAL', 'VP', 'ACTING_PRINCIPAL']);
            principals.forEach((p) => recipients.add(p));
          }
          break;
        }

        // ─── Leave & OD Final Approvals ───────────────────────────────────
        case 'LEAVE_APPROVED':
        case 'OD_APPROVED':
        case 'STUDENT_OD_APPROVED':
        case 'STUDENT_LEAVE_APPROVED':
        case 'FACULTY_LEAVE_APPROVED':
        case 'FACULTY_OD_APPROVED': {
          if (event.metadata?.applicantUserId) {
            recipients.add(event.metadata.applicantUserId);
          } else if (event.entityId && recipients.size === 0) {
            const studentLeave = await prisma.studentLeaveRequest.findUnique({
              where: { id: event.entityId },
              include: { student: { select: { id: true, userId: true } } },
            }).catch(() => null);

            if (studentLeave?.student?.userId) {
              recipients.add(studentLeave.student.userId);
            }

            // Optional Parent Notification on final approval
            if (studentLeave?.student?.id) {
              const parentLinks = await (prisma as any).parentStudentLink?.findMany?.({
                where: { studentId: studentLeave.student.id },
                select: { parentUserId: true },
              }).catch(() => []) ?? [];
              parentLinks.forEach((pl: any) => pl.parentUserId && recipients.add(pl.parentUserId));
            }

            const facLeave = await prisma.facultyLeaveRequest.findUnique({
              where: { id: event.entityId },
              include: { faculty: { select: { userId: true } } },
            }).catch(() => null);
            if (facLeave?.faculty?.userId) {
              recipients.add(facLeave.faculty.userId);
            }
          }
          break;
        }

        // ─── Leave & OD Rejections & Returns ──────────────────────────────
        case 'LEAVE_REJECTED':
        case 'OD_REJECTED':
        case 'STUDENT_OD_REJECTED':
        case 'STUDENT_LEAVE_REJECTED':
        case 'FACULTY_LEAVE_REJECTED':
        case 'FACULTY_OD_REJECTED':
        case 'LEAVE_RETURNED':
        case 'OD_RETURNED':
        case 'STUDENT_OD_RETURNED':
        case 'STUDENT_LEAVE_RETURNED':
        case 'FACULTY_LEAVE_RETURNED':
        case 'FACULTY_OD_RETURNED': {
          if (event.metadata?.applicantUserId) {
            recipients.add(event.metadata.applicantUserId);
          } else if (event.entityId && recipients.size === 0) {
            const studentLeave = await prisma.studentLeaveRequest.findUnique({
              where: { id: event.entityId },
              include: { student: { select: { userId: true } } },
            }).catch(() => null);
            if (studentLeave?.student?.userId) {
              recipients.add(studentLeave.student.userId);
            }

            const facLeave = await prisma.facultyLeaveRequest.findUnique({
              where: { id: event.entityId },
              include: { faculty: { select: { userId: true } } },
            }).catch(() => null);
            if (facLeave?.faculty?.userId) {
              recipients.add(facLeave.faculty.userId);
            }
          }
          break;
        }

        // ─── Class Substitution ───────────────────────────────────────────
        case 'CLASS_SUBSTITUTION_ASSIGNED':
        case 'SUBSTITUTION_ASSIGNED': {
          if (event.metadata?.substituteFacultyUserId) {
            recipients.add(event.metadata.substituteFacultyUserId);
          }
          if (event.metadata?.originalFacultyUserId) {
            recipients.add(event.metadata.originalFacultyUserId);
          }
          if (event.sectionId) {
            const students = await prisma.student.findMany({
              where: { sectionId: event.sectionId, status: 'ACTIVE', userId: { not: null } },
              select: { userId: true },
            });
            students.forEach((s) => s.userId && recipients.add(s.userId));
          }
          break;
        }

        // ─── Tasks & Governance ───────────────────────────────────────────
        case 'TASK_ASSIGNED':
        case 'TASK_UPDATED':
        case 'TASK_COMMENTED':
        case 'TASK_SUBMITTED':
        case 'TASK_RETURNED':
        case 'TASK_COMPLETED':
        case 'TASK_OVERDUE': {
          if (event.metadata?.assigneeId) recipients.add(event.metadata.assigneeId);
          if (event.metadata?.creatorId) recipients.add(event.metadata.creatorId);
          if (event.metadata?.assigneeIds && Array.isArray(event.metadata.assigneeIds)) {
            event.metadata.assigneeIds.forEach((id: string) => recipients.add(id));
          }
          break;
        }

        // ─── Academic & Assignments ──────────────────────────────────────
        case 'ASSIGNMENT_PUBLISHED': {
          const targetSectionId = event.sectionId || event.metadata?.sectionId;
          if (targetSectionId) {
            const students = await prisma.student.findMany({
              where: { sectionId: targetSectionId, status: 'ACTIVE', userId: { not: null } },
              select: { userId: true },
            });
            students.forEach((s) => s.userId && recipients.add(s.userId));
          }
          break;
        }

        case 'ASSIGNMENT_SUBMITTED': {
          if (event.metadata?.facultyUserId) {
            recipients.add(event.metadata.facultyUserId);
          }
          break;
        }

        case 'ASSIGNMENT_GRADED': {
          if (event.metadata?.studentUserId) {
            recipients.add(event.metadata.studentUserId);
          }
          break;
        }

        // ─── Attendance & Mentorship Risks ────────────────────────────────
        case 'ATTENDANCE_SHORTAGE':
        case 'ATTENDANCE_SHORTAGE_DETECTED':
        case 'ATTENDANCE_CORRECTED':
        case 'MENTEE_RISK_DETECTED':
        case 'MENTEE_ATTENDANCE_RISK':
        case 'MENTEE_ACADEMIC_RISK':
        case 'PARENT_MEETING_REQUESTED': {
          if (event.metadata?.studentUserId) {
            recipients.add(event.metadata.studentUserId);
          }
          if (event.metadata?.mentorUserId) {
            recipients.add(event.metadata.mentorUserId);
          }
          if (event.metadata?.studentId) {
            const student = await prisma.student.findUnique({
              where: { id: event.metadata.studentId },
              include: {
                mentor: { select: { userId: true } },
              },
            });
            if (student?.userId) recipients.add(student.userId);
            if (student?.mentor?.userId) recipients.add(student.mentor.userId);

            const parentLinks = await (prisma as any).parentStudentLink?.findMany?.({
              where: { studentId: event.metadata.studentId },
              select: { parentUserId: true },
            }).catch(() => []) ?? [];
            parentLinks.forEach((pl: any) => pl.parentUserId && recipients.add(pl.parentUserId));
          }
          break;
        }

        case 'MENTOR_ASSIGNED': {
          if (event.metadata?.studentUserId) recipients.add(event.metadata.studentUserId);
          if (event.metadata?.mentorUserId) recipients.add(event.metadata.mentorUserId);
          break;
        }

        // ─── Grievance & Maintenance ──────────────────────────────────────
        case 'GRIEVANCE_CREATED':
        case 'GRIEVANCE_ASSIGNED':
        case 'GRIEVANCE_RESOLVED':
        case 'MAINTENANCE_TICKET_CREATED':
        case 'MAINTENANCE_ASSIGNED':
        case 'MAINTENANCE_RESOLVED':
        case 'TICKET_CREATED':
        case 'TICKET_ASSIGNED':
        case 'TICKET_RESOLVED': {
          if (event.metadata?.assigneeUserId) recipients.add(event.metadata.assigneeUserId);
          if (event.metadata?.requesterUserId) recipients.add(event.metadata.requesterUserId);
          break;
        }

        // ─── Procurement & Purchase ───────────────────────────────────────
        case 'PURCHASE_REQUEST_CREATED':
        case 'PURCHASE_REQUESTED':
        case 'PURCHASE_APPROVED':
        case 'PURCHASE_REJECTED':
        case 'PO_CREATED': {
          if (event.metadata?.requesterUserId) recipients.add(event.metadata.requesterUserId);
          if (event.metadata?.approverUserId) recipients.add(event.metadata.approverUserId);
          const financeAdmins = await this.findUsersByRole(['PRINCIPAL', 'FINANCE_OFFICER', 'PURCHASE_OFFICER']);
          financeAdmins.forEach((fa) => recipients.add(fa));
          break;
        }

        // ─── Office Certificates & General Workflow ───────────────────────
        case 'CERTIFICATE_READY':
        case 'REQUEST_APPROVED':
        case 'REQUEST_RETURNED':
        case 'REQUEST_REJECTED':
        case 'STAGE_APPROVED':
        case 'REQUEST_SUBMITTED':
        case 'WORKFLOW_STAGE_CHANGED': {
          if (event.metadata?.requesterUserId) recipients.add(event.metadata.requesterUserId);
          if (event.metadata?.targetUserId) recipients.add(event.metadata.targetUserId);
          if (event.metadata?.currentReviewerUserId) recipients.add(event.metadata.currentReviewerUserId);
          break;
        }

        // ─── Emergency & Security ─────────────────────────────────────────
        case 'EMERGENCY_ALERT':
        case 'CAMPUS_ANNOUNCEMENT':
        case 'SECURITY_ALERT': {
          const allActive = await prisma.user.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true },
          });
          allActive.forEach((u) => recipients.add(u.id));
          break;
        }

        default:
          break;
      }
    } catch (err) {
      logger.error(`[RecipientResolver] Error resolving recipients for ${event.eventType}:`, err);
    }

    // 3. Prevent self-notification IF actor is in recipients list, UNLESS actor was explicitly targeted in targetUserIds
    if (
      event.actorUserId &&
      !explicitTargets.has(event.actorUserId) &&
      event.eventType !== 'EMERGENCY_ALERT' &&
      event.eventType !== 'EMERGENCY_CIRCULAR'
    ) {
      recipients.delete(event.actorUserId);
    }

    return Array.from(recipients);
  }

  /**
   * Helper to resolve active Mentor User ID for a student
   */
  public static async resolveStudentMentor(studentId: string): Promise<string | null> {
    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          mentor: { select: { userId: true } },
        },
      });

      if (student?.mentor?.userId) {
        return student.mentor.userId;
      }

      // Check active MentorAssignment
      const assignment = await prisma.mentorAssignment.findFirst({
        where: { studentId, status: 'ACTIVE' },
        include: { mentor: { select: { userId: true } } },
      });

      if (assignment?.mentor?.userId) {
        return assignment.mentor.userId;
      }

      // Fallback: Check if student has mentorId pointing directly to user
      if (student?.mentorId) {
        const fac = await prisma.faculty.findUnique({
          where: { id: student.mentorId },
          select: { userId: true },
        });
        if (fac?.userId) return fac.userId;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Helper to find authoritative active HOD for a department.
   * Checks DepartmentHodAssignment, Department.hodUserId, Department.hodId (as userId or facultyId),
   * DepartmentMembership, and Faculty/User records with HOD role.
   */
  public static async findDepartmentHod(departmentId: string): Promise<string | null> {
    if (!departmentId) return null;

    try {
      // 1. Department model direct
      const dept = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { id: true, name: true, hodUserId: true, hodId: true },
      });

      if (dept?.hodUserId) return dept.hodUserId;

      if (dept?.hodId) {
        // Check if hodId is a User.id directly
        const userById = await prisma.user.findUnique({ where: { id: dept.hodId } });
        if (userById) return userById.id;

        const fac = await prisma.faculty.findUnique({
          where: { id: dept.hodId },
          select: { userId: true },
        });
        if (fac?.userId) return fac.userId;
      }

      // 2. DepartmentHodAssignment table
      const hodAssign = await (prisma as any).departmentHodAssignment.findFirst({
        where: { departmentId, isActive: true },
      });
      if (hodAssign?.hodUserId) return hodAssign.hodUserId;

      // 3. DepartmentMembership table for HOD role
      const membership = await prisma.departmentMembership.findFirst({
        where: { departmentId, role: 'HOD', user: { status: 'ACTIVE' } },
        select: { userId: true },
      });
      if (membership?.userId) return membership.userId;

      // 4. Faculty with HOD role in department
      const hodFaculty = await prisma.faculty.findFirst({
        where: {
          departmentId,
          user: {
            role: { name: { in: ['HOD', 'Head of Department', 'Department HOD'] } },
            status: 'ACTIVE',
          },
        },
        select: { userId: true },
      });
      if (hodFaculty?.userId) return hodFaculty.userId;

      // 5. User in department with HOD role
      const hodUser = await prisma.user.findFirst({
        where: {
          departmentId,
          role: { name: { in: ['HOD', 'Head of Department', 'Department HOD'] } },
          status: 'ACTIVE',
        },
        select: { id: true },
      });
      if (hodUser) return hodUser.id;

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Helper to find users matching any of the specified role codes or names.
   */
  public static async findUsersByRole(roleCodesOrNames: string[]): Promise<string[]> {
    try {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { role: { roleCode: { in: roleCodesOrNames } } },
            { role: { name: { in: roleCodesOrNames } } },
          ],
          status: 'ACTIVE',
        },
        select: { id: true },
      });
      return users.map((u) => u.id);
    } catch {
      return [];
    }
  }
}
