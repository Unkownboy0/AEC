import { prisma } from '../../lib/prisma';
import type { DomainEvent } from './domain-events.types';
import { logger } from '../../utils/logger';

export class RecipientResolverService {
  /**
   * Authoritative Recipient Resolution Engine.
   * Computes the exact authorized, deduplicated recipient user IDs based on:
   * Event Type + Domain Context + Target Scope + Workspace Boundaries + Negative Rules.
   */
  public static async resolveRecipients(event: DomainEvent): Promise<string[]> {
    const recipients = new Set<string>();
    const explicitTargets = new Set<string>();

    // 1. Direct targets explicitly supplied on the event
    if (event.targetUserIds && event.targetUserIds.length > 0) {
      event.targetUserIds.forEach((id) => {
        if (id && typeof id === 'string') {
          recipients.add(id);
          explicitTargets.add(id);
        }
      });
    }

    // 2. Domain-Specific Business Event Resolution
    try {
      switch (event.eventType) {
        // ====================================================================
        // ─── 1. CIRCULARS & NOTICES (Explicit Audience Resolution) ──────────
        // ====================================================================
        case 'CIRCULAR_PUBLISHED':
        case 'EMERGENCY_CIRCULAR':
        case 'CIRCULAR_REMINDER':
        case 'EMERGENCY_NOTICE':
        case 'CIRCULAR_ACKNOWLEDGEMENT_REQUIRED':
        case 'SECTION_CIRCULAR': {
          if (recipients.size === 0) {
            const targetIds = await this.resolveCircularAudience(event);
            targetIds.forEach((id) => recipients.add(id));
          }
          break;
        }

        // ====================================================================
        // ─── 2. STUDENT LEAVE & OD WORKFLOW ─────────────────────────────────
        // ====================================================================
        case 'LEAVE_SUBMITTED':
        case 'LEAVE_REQUESTED':
        case 'OD_SUBMITTED':
        case 'OD_REQUESTED':
        case 'LEAVE_SUBMITTED':
        case 'LEAVE_REQUESTED':
        case 'OD_SUBMITTED':
        case 'OD_REQUESTED':
        case 'STUDENT_OD_SUBMITTED':
        case 'STUDENT_LEAVE_SUBMITTED': {
          // Mentor Review Stage: ONLY notify the assigned Mentor of this student
          let studentId = event.studentId || event.metadata?.studentId;
          if (studentId) {
            const mentorUserId = await this.resolveStudentMentor(studentId);
            if (mentorUserId) recipients.add(mentorUserId);
          } else if (event.entityId && recipients.size === 0) {
            const studentLeave = await prisma.studentLeaveRequest.findUnique({
              where: { id: event.entityId },
              include: {
                student: { select: { id: true, userId: true, mentorId: true, mentor: { select: { userId: true } } } },
                mentor: { select: { userId: true } },
              },
            }).catch(() => null);

            let mentorUserId = studentLeave?.mentor?.userId || studentLeave?.student?.mentor?.userId;
            if (!mentorUserId && studentLeave?.studentId) {
              mentorUserId = await this.resolveStudentMentor(studentLeave.studentId);
            }
            if (mentorUserId) recipients.add(mentorUserId);
          }
          break;
        }

        case 'LEAVE_FORWARDED':
        case 'OD_FORWARDED':
        case 'STUDENT_OD_MENTOR_APPROVED':
        case 'STUDENT_LEAVE_MENTOR_APPROVED':
        case 'STUDENT_OD_FORWARDED':
        case 'STUDENT_LEAVE_FORWARDED': {
          // HOD Review Stage: ONLY notify the HOD of the operating department
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
          break;
        }

        case 'STUDENT_OD_APPROVED':
        case 'STUDENT_LEAVE_APPROVED':
        case 'LEAVE_APPROVED':
        case 'OD_APPROVED': {
          // Final Approval: Notify the Student Applicant + linked Parent
          const studentLeave = event.entityId
            ? await prisma.studentLeaveRequest.findUnique({
                where: { id: event.entityId },
                include: { student: { select: { id: true, userId: true } } },
              }).catch(() => null)
            : null;

          const studentUserId = event.metadata?.applicantUserId || studentLeave?.student?.userId;
          if (studentUserId) recipients.add(studentUserId);

          const studentId = event.studentId || event.metadata?.studentId || studentLeave?.student?.id;
          if (studentId) {
            const parentUserIds = await this.resolveLinkedParents(studentId);
            parentUserIds.forEach((pid) => recipients.add(pid));
          }
          break;
        }

        case 'STUDENT_OD_REJECTED':
        case 'STUDENT_LEAVE_REJECTED':
        case 'STUDENT_OD_RETURNED':
        case 'STUDENT_LEAVE_RETURNED':
        case 'LEAVE_REJECTED':
        case 'OD_REJECTED':
        case 'LEAVE_RETURNED':
        case 'OD_RETURNED': {
          // Rejection / Return: Notify the Student Applicant
          const studentLeave = event.entityId
            ? await prisma.studentLeaveRequest.findUnique({
                where: { id: event.entityId },
                include: { student: { select: { userId: true } } },
              }).catch(() => null)
            : null;

          const studentUserId = event.metadata?.applicantUserId || studentLeave?.student?.userId;
          if (studentUserId) recipients.add(studentUserId);
          break;
        }

        // ====================================================================
        // ─── 3. FACULTY LEAVE & OD WORKFLOW ─────────────────────────────────
        // ====================================================================
        case 'FACULTY_LEAVE_SUBMITTED':
        case 'FACULTY_OD_SUBMITTED': {
          // HOD Stage: Notify HOD of the faculty's home department
          let deptId = event.departmentId;
          if (!deptId && event.entityId) {
            const facLeave = await prisma.facultyLeaveRequest.findUnique({
              where: { id: event.entityId },
              select: { departmentId: true, faculty: { select: { departmentId: true } } },
            }).catch(() => null);
            deptId = facLeave?.departmentId || facLeave?.faculty?.departmentId || undefined;
          }
          if (deptId) {
            const hodUserId = await this.findDepartmentHod(deptId);
            if (hodUserId) recipients.add(hodUserId);
          }
          break;
        }

        case 'FACULTY_LEAVE_RECOMMENDED':
        case 'FACULTY_OD_RECOMMENDED':
        case 'FACULTY_LEAVE_FORWARDED':
        case 'FACULTY_OD_FORWARDED': {
          // Executive Stage: Notify Principal & Vice Principal (or Acting Principal)
          const execs = await this.findUsersByRole([
            'PRINCIPAL',
            'Principal',
            'VICE_PRINCIPAL',
            'Vice Principal',
            'VP',
            'ACTING_PRINCIPAL',
          ]);
          execs.forEach((u) => recipients.add(u));
          break;
        }

        case 'FACULTY_LEAVE_APPROVED':
        case 'FACULTY_OD_APPROVED':
        case 'FACULTY_LEAVE_REJECTED':
        case 'FACULTY_OD_REJECTED':
        case 'FACULTY_LEAVE_RETURNED':
        case 'FACULTY_OD_RETURNED': {
          // Result: Notify Faculty Applicant
          const facLeave = event.entityId
            ? await prisma.facultyLeaveRequest.findUnique({
                where: { id: event.entityId },
                include: { faculty: { select: { userId: true } } },
              }).catch(() => null)
            : null;

          const facUserId = event.metadata?.applicantUserId || facLeave?.faculty?.userId;
          if (facUserId) recipients.add(facUserId);
          break;
        }

        case 'HOD_LEAVE_SUBMITTED':
        case 'DEAN_LEAVE_SUBMITTED':
        case 'VP_LEAVE_SUBMITTED': {
          // HOD/Dean/VP own leave -> Notify Principal directly
          const principals = await this.findUsersByRole(['PRINCIPAL', 'Principal']);
          principals.forEach((p) => recipients.add(p));
          break;
        }

        // ====================================================================
        // ─── 4. ACADEMICS, ASSIGNMENTS & TIMETABLE ──────────────────────────
        // ====================================================================
        case 'ASSIGNMENT_PUBLISHED':
        case 'ASSIGNMENT_UPDATED': {
          // Target students in that specific section only
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

        case 'ASSIGNMENT_DUE_SOON':
        case 'ASSIGNMENT_DUE_REMINDER': {
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

        case 'ASSIGNMENT_SUBMITTED':
        case 'ASSIGNMENT_SUBMISSION_RECEIVED': {
          // Notify the creator/evaluator faculty member
          if (event.metadata?.facultyUserId) recipients.add(event.metadata.facultyUserId);
          break;
        }

        case 'ASSIGNMENT_GRADED': {
          // Notify the student whose assignment was graded
          if (event.metadata?.studentUserId) recipients.add(event.metadata.studentUserId);
          break;
        }

        case 'TIMETABLE_CHANGED':
        case 'CLASS_TIMETABLE_CHANGED': {
          // Notify affected section students + affected faculty
          if (event.sectionId) {
            const students = await prisma.student.findMany({
              where: { sectionId: event.sectionId, status: 'ACTIVE', userId: { not: null } },
              select: { userId: true },
            });
            students.forEach((s) => s.userId && recipients.add(s.userId));

            const classAdvisorUserId = await this.resolveSectionClassAdvisor(event.sectionId);
            if (classAdvisorUserId) recipients.add(classAdvisorUserId);
          }
          if (event.metadata?.facultyUserId) recipients.add(event.metadata.facultyUserId);
          break;
        }

        case 'CLASS_SUBSTITUTION_ASSIGNED':
        case 'SUBSTITUTION_ASSIGNED': {
          // Notify Substitute Faculty + Original Faculty + Section Students
          if (event.metadata?.substituteFacultyUserId) recipients.add(event.metadata.substituteFacultyUserId);
          if (event.metadata?.originalFacultyUserId) recipients.add(event.metadata.originalFacultyUserId);
          if (event.sectionId) {
            const students = await prisma.student.findMany({
              where: { sectionId: event.sectionId, status: 'ACTIVE', userId: { not: null } },
              select: { userId: true },
            });
            students.forEach((s) => s.userId && recipients.add(s.userId));
          }
          break;
        }

        case 'ATTENDANCE_PENDING':
        case 'ATTENDANCE_MARKED': {
          if (event.metadata?.facultyUserId) recipients.add(event.metadata.facultyUserId);
          break;
        }

        case 'SECTION_ATTENDANCE_EXCEPTION':
        case 'CLASS_ACADEMIC_ALERT': {
          if (event.sectionId) {
            const classAdvisorUserId = await this.resolveSectionClassAdvisor(event.sectionId);
            if (classAdvisorUserId) recipients.add(classAdvisorUserId);
          }
          break;
        }

        case 'TIMETABLE_CONFLICT_DETECTED':
        case 'FACULTY_MAPPING_ISSUE':
        case 'FACULTY_WORKLOAD_ALERT':
        case 'SUBSTITUTE_REQUIRED':
        case 'ATTENDANCE_PENDING_HOD_ALERT': {
          // HOD of that department
          if (event.departmentId) {
            const hodUserId = await this.findDepartmentHod(event.departmentId);
            if (hodUserId) recipients.add(hodUserId);
          }
          break;
        }

        case 'DEPARTMENT_ACADEMIC_EXCEPTION':
        case 'CLASSES_WITHOUT_FACULTY':
        case 'ACADEMIC_WORKLOAD_ISSUE':
        case 'ATTENDANCE_RISK_SUMMARY':
        case 'INTERNAL_MARKS_PENDING':
        case 'COURSE_PROGRESS_DELAY':
        case 'ACADEMIC_CALENDAR_MILESTONE': {
          // Academic Dean
          const deans = await this.findUsersByRole(['ACADEMIC_DEAN', 'Academic Dean']);
          deans.forEach((d) => recipients.add(d));
          break;
        }

        // ====================================================================
        // ─── 5. MENTORSHIP & STUDENT AT-RISK ALERTS ─────────────────────────
        // ====================================================================
        case 'ATTENDANCE_SHORTAGE':
        case 'ATTENDANCE_SHORTAGE_DETECTED':
        case 'MENTEE_RISK_DETECTED':
        case 'MENTEE_ATTENDANCE_RISK':
        case 'MENTEE_ACADEMIC_RISK':
        case 'PARENT_MEETING_REQUESTED': {
          const studentId = event.studentId || event.metadata?.studentId;
          if (studentId) {
            // 1. Notify Student
            const student = await prisma.student.findUnique({
              where: { id: studentId },
              include: { mentor: { select: { userId: true } } },
            });
            if (student?.userId) recipients.add(student.userId);

            // 2. Notify Assigned Mentor ONLY
            const mentorUserId = student?.mentor?.userId || (await this.resolveStudentMentor(studentId));
            if (mentorUserId) recipients.add(mentorUserId);

            // 3. Notify Linked Parents
            const parentUserIds = await this.resolveLinkedParents(studentId);
            parentUserIds.forEach((pid) => recipients.add(pid));
          }
          break;
        }

        case 'MENTOR_ASSIGNED': {
          if (event.metadata?.studentUserId) recipients.add(event.metadata.studentUserId);
          if (event.metadata?.mentorUserId) recipients.add(event.metadata.mentorUserId);
          break;
        }

        // ====================================================================
        // ─── 6. EXAMINATIONS & COE (Controller of Examinations) ─────────────
        // ====================================================================
        case 'EXAM_REGISTRATION_ISSUE':
        case 'EXAM_ELIGIBILITY_ISSUE':
        case 'QP_WORKFLOW_PENDING':
        case 'INVIGILATION_ISSUE':
        case 'EXAM_ATTENDANCE_COMPLETED':
        case 'MARKS_ENTRY_PENDING':
        case 'VALUATION_PENDING':
        case 'MODERATION_TASK':
        case 'REVALUATION_REQUESTED':
        case 'RESULT_PROCESSING_MILESTONE':
        case 'RESULT_FINAL_REVIEW': {
          const coeUsers = await this.findUsersByRole(['COE', 'Controller of Examinations', 'Examination Cell']);
          coeUsers.forEach((u) => recipients.add(u));
          break;
        }

        case 'RESULT_PUBLISHED':
        case 'EXAM_RESULT_PUBLISHED':
        case 'MARKS_PUBLISHED':
        case 'REVALUATION_UPDATE': {
          if (event.metadata?.studentUserId) {
            recipients.add(event.metadata.studentUserId);
          } else if (event.studentId) {
            const student = await prisma.student.findUnique({ where: { id: event.studentId }, select: { userId: true } });
            if (student?.userId) recipients.add(student.userId);
          }
          break;
        }

        // ====================================================================
        // ─── 7. FEES & FINANCE (Accounts Officer & Accountant) ──────────────
        // ====================================================================
        case 'FEE_DUE':
        case 'FEE_PAYMENT_DUE':
        case 'PAYMENT_SUCCESS':
        case 'PAYMENT_FAILED':
        case 'FEE_PAYMENT_SUCCESS':
        case 'RECEIPT_GENERATED':
        case 'FEE_RECEIPT_AVAILABLE':
        case 'SCHOLARSHIP_UPDATE':
        case 'SCHOLARSHIP_STATUS_CHANGED': {
          // Notify Student + Linked Parents
          const studentId = event.studentId || event.metadata?.studentId;
          if (studentId) {
            const student = await prisma.student.findUnique({ where: { id: studentId }, select: { userId: true } });
            if (student?.userId) recipients.add(student.userId);
            const parentUserIds = await this.resolveLinkedParents(studentId);
            parentUserIds.forEach((pid) => recipients.add(pid));
          } else if (event.metadata?.studentUserId) {
            recipients.add(event.metadata.studentUserId);
          }
          break;
        }

        case 'PAYMENT_ACTION_REQUIRED':
        case 'OFFLINE_PAYMENT_VERIFICATION':
        case 'RECEIPT_GENERATION_ISSUE':
        case 'FEE_REFUND_REQUESTED':
        case 'EXPENSE_VOUCHER_TASK':
        case 'SCHOLARSHIP_FINANCIAL_POSTING':
        case 'BANK_RECONCILIATION_ISSUE': {
          // Notify Accounts / Accountant
          const accountsUsers = await this.findUsersByRole(['ACCOUNTS_OFFICER', 'Accounts Officer', 'Accountant']);
          accountsUsers.forEach((u) => recipients.add(u));
          break;
        }

        case 'REFUND_APPROVAL_REQUIRED':
        case 'FEE_ADJUSTMENT_APPROVAL':
        case 'FEE_CONCESSION_APPROVAL':
        case 'FINANCE_WRITE_OFF_APPROVAL':
        case 'BUDGET_ALERT':
        case 'FINANCE_ESCALATION': {
          // Notify Administrative Officer (AO) / Finance Head
          const aoUsers = await this.findUsersByRole(['AO', 'Administrative Officer', 'Accounts Officer', 'PRINCIPAL']);
          aoUsers.forEach((u) => recipients.add(u));
          break;
        }

        // ====================================================================
        // ─── 8. HOSTEL MANAGEMENT (Active Hostellers Only) ──────────────────
        // ====================================================================
        case 'HOSTEL_ALLOCATION_REQUIRED':
        case 'ROOM_BED_CHANGE_REQUEST':
        case 'HOSTEL_OUTING_REQUEST':
        case 'HOSTEL_RETURN_OVERDUE':
        case 'HOSTEL_COMPLAINT_SUBMITTED':
        case 'VISITOR_REQUEST':
        case 'HOSTEL_MESS_ISSUE':
        case 'HOSTEL_MAINTENANCE_TICKET':
        case 'HOSTEL_DISCIPLINE_ALERT': {
          // Notify Hostel Warden & Admin
          const wardens = await this.findUsersByRole(['HOSTEL_WARDEN', 'Hostel Warden', 'Hostel Admin']);
          wardens.forEach((w) => recipients.add(w));
          break;
        }

        case 'HOSTEL_ROOM_ALLOCATED':
        case 'HOSTEL_OUTING_APPROVED':
        case 'HOSTEL_OUTING_REJECTED':
        case 'HOSTEL_MESS_NOTICE': {
          // NEGATIVE CHECK: Active Hostellers ONLY (student.hostelId !== null)
          if (event.studentId) {
            const student = await prisma.student.findUnique({
              where: { id: event.studentId },
              select: { userId: true, hostelId: true },
            });
            if (student?.hostelId && student?.userId) {
              recipients.add(student.userId);
            }
          }
          break;
        }

        // ====================================================================
        // ─── 9. TRANSPORT MANAGEMENT (Active Bus Users Only) ────────────────
        // ====================================================================
        case 'TRANSPORT_ALLOCATION_REQUIRED':
        case 'ROUTE_STOP_CHANGE_REQUEST':
        case 'BUS_BREAKDOWN_ALERT':
        case 'VEHICLE_MAINTENANCE_ALERT':
        case 'TRANSPORT_COMPLAINT_SUBMITTED':
        case 'ROUTE_ALLOCATION_CONFLICT': {
          // Notify Transport Manager & Team
          const transportUsers = await this.findUsersByRole(['TRANSPORT_MANAGER', 'Transport Manager', 'Transport Admin']);
          transportUsers.forEach((t) => recipients.add(t));
          break;
        }

        case 'TRANSPORT_ROUTE_ALLOCATED':
        case 'TRANSPORT_BUS_DELAY': {
          // NEGATIVE CHECK: Active Transport Users ONLY (student.transportRouteId !== null)
          if (event.studentId) {
            const student = await prisma.student.findUnique({
              where: { id: event.studentId },
              select: { userId: true, transportRouteId: true },
            });
            if (student?.transportRouteId && student?.userId) {
              recipients.add(student.userId);
            }
          } else if (event.transportRouteId) {
            // Notify all active students registered on this transport route
            const routeStudents = await prisma.student.findMany({
              where: { transportRouteId: event.transportRouteId, status: 'ACTIVE', userId: { not: null } },
              select: { userId: true },
            });
            routeStudents.forEach((s) => s.userId && recipients.add(s.userId));
          }
          break;
        }

        // ====================================================================
        // ─── 10. LIBRARY MANAGEMENT ─────────────────────────────────────────
        // ====================================================================
        case 'BOOK_RESERVATION_REQUEST':
        case 'BOOK_LOST_DAMAGED':
        case 'LIBRARY_CLEARANCE_REQUEST': {
          const librarians = await this.findUsersByRole(['LIBRARIAN', 'Librarian']);
          librarians.forEach((l) => recipients.add(l));
          break;
        }

        case 'LIBRARY_BOOK_ISSUED':
        case 'LIBRARY_BOOK_RETURNED':
        case 'LIBRARY_BOOK_OVERDUE':
        case 'LIBRARY_FINE_GENERATED': {
          // Specific borrower only
          if (event.metadata?.borrowerUserId) recipients.add(event.metadata.borrowerUserId);
          if (event.metadata?.studentUserId) recipients.add(event.metadata.studentUserId);
          break;
        }

        // ====================================================================
        // ─── 11. PLACEMENTS & CAREERS (Eligible Students Only) ──────────────
        // ====================================================================
        case 'STUDENT_JOB_APPLIED': {
          const placementOfficers = await this.findUsersByRole(['PLACEMENT_OFFICER', 'Placement Officer']);
          placementOfficers.forEach((p) => recipients.add(p));
          break;
        }

        case 'PLACEMENT_JOB_POSTED':
        case 'COMPANY_JOB_POSTED':
        case 'PLACEMENT_DRIVE_SCHEDULED': {
          // Eligible students in matching department
          if (event.departmentId) {
            const students = await prisma.student.findMany({
              where: { departmentId: event.departmentId, status: 'ACTIVE', userId: { not: null } },
              select: { userId: true },
            });
            students.forEach((s) => s.userId && recipients.add(s.userId));
          }
          break;
        }

        case 'INTERVIEW_ROUND_SCHEDULED':
        case 'PLACEMENT_OFFER_RECEIVED':
        case 'JOB_OFFER_ISSUED': {
          if (event.metadata?.studentUserId) recipients.add(event.metadata.studentUserId);
          break;
        }

        // ====================================================================
        // ─── 12. COMPLAINT ROUTING (Domain-Specific Owners) ─────────────────
        // ====================================================================
        case 'ACADEMIC_COMPLAINT_SUBMITTED': {
          // 1. Current Operating Department HOD (Primary Owner)
          if (event.departmentId) {
            const hodUserId = await this.findDepartmentHod(event.departmentId);
            if (hodUserId) recipients.add(hodUserId);
          }
          // 2. A&A Dean (Oversight / Escalation)
          const aaDeans = await this.findUsersByRole(['ADMISSION_DEAN', 'Admission Dean', 'A&A Dean']);
          aaDeans.forEach((d) => recipients.add(d));
          break;
        }

        case 'ADMINISTRATIVE_COMPLAINT':
        case 'ADMINISTRATIVE_GRIEVANCE':
        case 'GRIEVANCE_CREATED':
        case 'ADMISSION_VERIFICATION_REQUIRED':
        case 'APPLICATION_STATUS_ESCALATED':
        case 'BONAFIDE_CERTIFICATE_ESCALATED':
        case 'STUDENT_SERVICE_REQUEST': {
          const aaDeans = await this.findUsersByRole(['ADMISSION_DEAN', 'Admission Dean', 'A&A Dean']);
          aaDeans.forEach((d) => recipients.add(d));
          break;
        }

        // ====================================================================
        // ─── 13. COLLEGE ADMIN / IT FACILITIES ──────────────────────────────
        // ====================================================================
        case 'IT_TICKET_CREATED':
        case 'NETWORK_OUTAGE_ALERT':
        case 'DEVICE_MALFUNCTION_TICKET':
        case 'CLASSROOM_LAB_ISSUE':
        case 'FACILITY_MAINTENANCE_TICKET':
        case 'MAINTENANCE_TICKET_CREATED':
        case 'TICKET_CREATED':
        case 'STAFF_EXIT_IT_CLEARANCE': {
          const collegeAdmins = await this.findUsersByRole(['COLLEGE_ADMIN', 'College Admin', 'Super Admin']);
          collegeAdmins.forEach((a) => recipients.add(a));
          break;
        }

        // ====================================================================
        // ─── 14. IQAC QUALITY & COMPLIANCE ──────────────────────────────────
        // ====================================================================
        case 'EVIDENCE_SUBMITTED':
        case 'EVIDENCE_RETURNED':
        case 'EVIDENCE_MISSING':
        case 'APPRAISAL_SUBMITTED':
        case 'APPRAISAL_VERIFICATION_PENDING':
        case 'ACCREDITATION_TASK':
        case 'NAAC_NBA_DEADLINE':
        case 'RESEARCH_PUBLICATION_VERIFIED':
        case 'DEPARTMENT_QUALITY_ISSUE':
        case 'STAFF_EXIT_IQAC_CLEARANCE': {
          const iqacUsers = await this.findUsersByRole([
            'IQAC_DEAN',
            'IQAC Dean',
            'IQAC_EXECUTIVE_OFFICER',
            'IQAC Executive Officer',
            'IQAC_DOCUMENTATION_OFFICER',
            'IQAC Documentation Officer',
          ]);
          iqacUsers.forEach((u) => recipients.add(u));
          break;
        }

        // ====================================================================
        // ─── 15. VP & PRINCIPAL ESCALATIONS ─────────────────────────────────
        // ====================================================================
        case 'ESCALATED_APPROVAL':
        case 'ACADEMIC_RISK_ESCALATION':
        case 'TIMETABLE_DISRUPTION':
        case 'SUBSTITUTE_CRISIS':
        case 'STAFF_EXIT_VP_STAGE':
        case 'GRIEVANCE_ESCALATION':
        case 'MAINTENANCE_SLA_BREACH':
        case 'OVERDUE_HIGH_PRIORITY_TASK': {
          const vps = await this.findUsersByRole(['VICE_PRINCIPAL', 'Vice Principal', 'VP', 'ACTING_PRINCIPAL']);
          vps.forEach((v) => recipients.add(v));
          break;
        }

        case 'HIGH_LEVEL_ESCALATION':
        case 'STAFF_EXIT_PRINCIPAL_STAGE':
        case 'GOVERNANCE_APPROVAL_REQUIRED':
        case 'MAJOR_INCIDENT_ALERT':
        case 'PRINCIPAL_TASK_UPDATED':
        case 'CIRCULAR_DELIVERY_SUMMARY':
        case 'PRINCIPAL_DELEGATION_ACTIVATED':
        case 'PRINCIPAL_DELEGATION_EXPIRED': {
          const principals = await this.findUsersByRole(['PRINCIPAL', 'Principal']);
          principals.forEach((p) => recipients.add(p));
          break;
        }

        // ====================================================================
        // ─── 16. TASKS ──────────────────────────────────────────────────────
        // ====================================================================
        case 'TASK_ASSIGNED':
        case 'TASK_UPDATED':
        case 'TASK_COMMENTED':
        case 'TASK_SUBMITTED':
        case 'TASK_RETURNED':
        case 'TASK_COMPLETED':
        case 'TASK_OVERDUE':
        case 'TASK_DEADLINE_APPROACHING': {
          if (event.metadata?.assigneeId) recipients.add(event.metadata.assigneeId);
          if (event.metadata?.creatorId) recipients.add(event.metadata.creatorId);
          if (event.metadata?.assigneeIds && Array.isArray(event.metadata.assigneeIds)) {
            event.metadata.assigneeIds.forEach((id: string) => recipients.add(id));
          }
          break;
        }

        // ====================================================================
        // ─── 17. EMERGENCY & SECURITY ───────────────────────────────────────
        // ====================================================================
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

    // 3. Self-Notification Suppression (Deduplicate & Prevent self-echo)
    if (
      event.actorUserId &&
      !explicitTargets.has(event.actorUserId) &&
      event.eventType !== 'EMERGENCY_ALERT' &&
      event.eventType !== 'EMERGENCY_CIRCULAR'
    ) {
      recipients.delete(event.actorUserId);
    }

    // 4. Return deduplicated array
    return Array.from(recipients);
  }

  /**
   * Resolve explicit audience for Circulars based on audience rules
   */
  public static async resolveCircularAudience(event: DomainEvent): Promise<string[]> {
    const targetUserIds = new Set<string>();

    try {
      const audience = event.audience;

      if (audience) {
        if (audience.scope === 'INSTITUTION') {
          const all = await prisma.user.findMany({ where: { status: 'ACTIVE' }, select: { id: true } });
          all.forEach((u) => targetUserIds.add(u.id));
        } else if (audience.scope === 'ROLE' && audience.roleCodes) {
          const users = await this.findUsersByRole(audience.roleCodes);
          users.forEach((u) => targetUserIds.add(u));
        } else if (audience.scope === 'DEPARTMENT' && audience.departmentIds) {
          const users = await prisma.user.findMany({
            where: { departmentId: { in: audience.departmentIds }, status: 'ACTIVE' },
            select: { id: true },
          });
          users.forEach((u) => targetUserIds.add(u.id));
        } else if (audience.scope === 'HOSTELLERS') {
          // Active Hostellers ONLY
          const students = await prisma.student.findMany({
            where: { hostelId: { not: null }, status: 'ACTIVE', userId: { not: null } },
            select: { userId: true },
          });
          students.forEach((s) => s.userId && targetUserIds.add(s.userId));
        } else if (audience.scope === 'DAY_SCHOLARS') {
          // Day Scholars ONLY
          const students = await prisma.student.findMany({
            where: { hostelId: null, status: 'ACTIVE', userId: { not: null } },
            select: { userId: true },
          });
          students.forEach((s) => s.userId && targetUserIds.add(s.userId));
        } else if (audience.scope === 'TRANSPORT') {
          // Active Bus Users ONLY
          const students = await prisma.student.findMany({
            where: { transportRouteId: { not: null }, status: 'ACTIVE', userId: { not: null } },
            select: { userId: true },
          });
          students.forEach((s) => s.userId && targetUserIds.add(s.userId));
        } else if (audience.scope === 'SELECTED_USERS' && audience.userIds) {
          audience.userIds.forEach((uid) => targetUserIds.add(uid));
        }
      }

      // Department scope fallback
      if (targetUserIds.size === 0 && event.departmentId) {
        const deptUsers = await prisma.user.findMany({
          where: { departmentId: event.departmentId, status: 'ACTIVE' },
          select: { id: true },
        });
        deptUsers.forEach((u) => targetUserIds.add(u.id));
      }
    } catch (err) {
      logger.warn('[RecipientResolver] Failed to resolve circular audience:', err);
    }

    return Array.from(targetUserIds);
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
          section: { select: { classAdvisor: true } },
        },
      });

      if (student?.mentor?.userId) return student.mentor.userId;

      const assignment = await prisma.mentorAssignment.findFirst({
        where: { studentId, status: 'ACTIVE' },
        include: { mentor: { select: { userId: true } } },
      });

      if (assignment?.mentor?.userId) return assignment.mentor.userId;

      if (student?.mentorId) {
        const fac = await prisma.faculty.findUnique({
          where: { id: student.mentorId },
          select: { userId: true },
        });
        if (fac?.userId) return fac.userId;
      }

      // Section Class Advisor fallback
      if (student?.section?.classAdvisor) {
        const advisorUser = await prisma.user.findUnique({
          where: { id: student.section.classAdvisor },
          select: { id: true },
        });
        if (advisorUser) return advisorUser.id;

        const advisorFac = await prisma.faculty.findUnique({
          where: { id: student.section.classAdvisor },
          select: { userId: true },
        });
        if (advisorFac?.userId) return advisorFac.userId;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Helper to resolve Class Advisor User ID for a Section
   */
  public static async resolveSectionClassAdvisor(sectionId: string): Promise<string | null> {
    try {
      const section = await prisma.section.findUnique({
        where: { id: sectionId },
        select: { classAdvisor: true },
      });

      if (!section?.classAdvisor) return null;

      // Check if classAdvisor is already a User ID
      const user = await prisma.user.findUnique({ where: { id: section.classAdvisor }, select: { id: true } });
      if (user) return user.id;

      // Check if classAdvisor is a Faculty ID
      const faculty = await prisma.faculty.findUnique({
        where: { id: section.classAdvisor },
        select: { userId: true },
      });
      if (faculty?.userId) return faculty.userId;

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Helper to resolve linked Parent User IDs for a Student
   */
  public static async resolveLinkedParents(studentId: string): Promise<string[]> {
    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { parentEmail: true, parentPhone: true },
      });

      const parentUserIds = new Set<string>();

      // 1. ParentStudentLink table if available
      try {
        const links = await (prisma as any).parentStudentLink.findMany({
          where: { studentId },
          select: { parentUserId: true },
        });
        links.forEach((l: any) => l.parentUserId && parentUserIds.add(l.parentUserId));
      } catch {}

      // 2. Email matching
      if (student?.parentEmail) {
        const parentUser = await prisma.user.findUnique({
          where: { email: student.parentEmail },
          select: { id: true },
        });
        if (parentUser) parentUserIds.add(parentUser.id);
      }

      return Array.from(parentUserIds);
    } catch {
      return [];
    }
  }

  /**
   * Helper to find authoritative active HOD for a department.
   */
  public static async findDepartmentHod(departmentId: string): Promise<string | null> {
    if (!departmentId) return null;

    try {
      const dept = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { id: true, name: true, hodUserId: true, hodId: true },
      });

      if (dept?.hodUserId) return dept.hodUserId;

      if (dept?.hodId) {
        const userById = await prisma.user.findUnique({ where: { id: dept.hodId } });
        if (userById) return userById.id;

        const fac = await prisma.faculty.findUnique({
          where: { id: dept.hodId },
          select: { userId: true },
        });
        if (fac?.userId) return fac.userId;
      }

      const hodAssign = await (prisma as any).departmentHodAssignment?.findFirst?.({
        where: { departmentId, isActive: true },
      }).catch(() => null);
      if (hodAssign?.hodUserId) return hodAssign.hodUserId;

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
