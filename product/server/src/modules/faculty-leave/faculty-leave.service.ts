import { prisma } from '../../lib/prisma';
import { FacultyLeaveRepository } from './faculty-leave.repository';
import { FacultyLeaveWorkflowEngine } from './faculty-leave.workflow';
import { FacultyLeaveNotificationService } from './faculty-leave.notifications';
import { CreateFacultyLeaveOdDto } from './faculty-leave.validation';
import { PrincipalRequestRoutingService } from '../principal-availability/request-routing.service';
import { ApprovalTimelineService } from '../approvals/approval-timeline.service';
import { logger } from '../../utils/logger';

const repo = new FacultyLeaveRepository();

export interface SubstituteCandidate {
  facultyId: string;
  employeeId: string;
  name: string;
  designation: string;
  department: { id: string; name: string; code: string };
  isHomeDept: boolean;
  weeklyLoadHours: number;
  maxWeeklyHours: number;
  workloadDisplay: string;
  subjectMatch: 'SAME_SUBJECT' | 'TAUGHT_SUBJECT' | 'RELATED_DOMAIN' | 'DEPARTMENT_FACULTY' | 'CROSS_DEPARTMENT';
  subjectMatchLabel: string;
  availabilityStatus: 'AVAILABLE' | 'BUSY' | 'ON_LEAVE';
  score: number;
}

export interface AffectedTimetableSession {
  sessionId: string;
  date: string;
  dayOfWeek: string;
  periodDisplay: string;
  periodStart: number;
  periodEnd: number;
  startTime: string;
  endTime: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  isHomeDepartment: boolean;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  sectionId?: string;
  sectionName?: string;
  venue?: string;
  roomNo?: string;
  slotType: string;
  isLab: boolean;
  slotIds: string[];
  eligibleSubstitutes: SubstituteCandidate[];
  assignedSubstituteId?: string;
  assignedSubstituteName?: string;
  assignedSubstituteDept?: string;
  assignedSubstituteWorkload?: string;
  subjectMatch?: string;
}

export interface AffectedTimetablePeriod {
  date: string;
  dayOfWeek: string;
  slotIndex: number;
  timetableSlotId: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  isHomeDepartment: boolean;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  sectionId?: string;
  sectionName?: string;
  startTime: string;
  endTime: string;
  roomNo?: string;
  isLab: boolean;
  assignedSubstituteId?: string;
  assignedSubstituteName?: string;
}

export interface LeaveBalanceSummary {
  leaveType: string;
  leaveTypeName: string;
  annualQuota: number;
  usedDays: number;
  pendingDays: number;
  availableDays: number;
}

export class FacultyLeaveService {
  /**
   * Helper: Check if a faculty member is free/available for a specific period on a target date.
   */
  static async isFacultyAvailableForPeriod(params: {
    facultyId: string;
    date: Date;
    dayOfWeek: string;
    periodNumber: number;
  }): Promise<{ available: boolean; reason?: string }> {
    const targetDate = new Date(params.date);
    targetDate.setHours(0, 0, 0, 0);
    const endOfDay = new Date(params.date);
    endOfDay.setHours(23, 59, 59, 999);

    const startWindow = new Date(targetDate.getTime() - 24 * 3600 * 1000);
    const endWindow = new Date(endOfDay.getTime() + 24 * 3600 * 1000);

    // 1. Check approved leave
    const leave = await prisma.facultyLeaveRequest.findFirst({
      where: {
        facultyId: params.facultyId,
        leaveType: { not: 'ON_DUTY' },
        status: { in: ['APPROVED', 'APPROVED_PRINCIPAL', 'FINAL_APPROVED'] },
        startDate: { lte: endWindow },
        endDate: { gte: startWindow },
      },
    });
    if (leave) return { available: false, reason: 'On Approved Leave' };

    // 2. Check approved OD
    const od = await prisma.facultyLeaveRequest.findFirst({
      where: {
        facultyId: params.facultyId,
        leaveType: 'ON_DUTY',
        status: { in: ['APPROVED', 'APPROVED_PRINCIPAL', 'FINAL_APPROVED'] },
        startDate: { lte: endWindow },
        endDate: { gte: startWindow },
      },
    });
    if (od) return { available: false, reason: 'On Approved OD' };

    // 3. Check substitute assignment override
    const override = await prisma.timetableSlotOverride.findFirst({
      where: {
        substituteFacultyId: params.facultyId,
        date: { gte: startWindow, lte: endWindow },
        periodNumber: params.periodNumber,
        status: 'ACTIVE',
      },
    });
    if (override) return { available: false, reason: 'Already Assigned as Substitute' };

    // 4. Check regular timetable slot
    const regularSlot = await prisma.timetableSlot.findFirst({
      where: {
        facultyId: params.facultyId,
        dayOfWeek: params.dayOfWeek,
        slotIndex: params.periodNumber,
        status: 'ACTIVE',
      },
    });

    if (regularSlot) {
      // Check if this regular slot was substituted out
      const regularOverridden = await prisma.timetableSlotOverride.findFirst({
        where: {
          timetableSlotId: regularSlot.id,
          date: { gte: targetDate, lte: endOfDay },
          status: 'ACTIVE',
        },
      });

      if (!regularOverridden) {
        return { available: false, reason: regularSlot.isLab ? 'In Lab Session' : 'Teaching In Class' };
      }
    }

    return { available: true };
  }

  /**
   * Free / Eligible Substitute Finder with Subject Compatibility Ranking.
   * Scoped strictly by the owning department of the affected session.
   */
  static async getAvailableSubstitutes(params: {
    date: string;
    dayOfWeek?: string;
    periodStart: number;
    periodEnd: number;
    departmentId: string;
    subjectId?: string;
    excludeFacultyId?: string;
    includeCrossDept?: boolean;
  }): Promise<SubstituteCandidate[]> {
    const targetDate = new Date(params.date);
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayOfWeek = params.dayOfWeek || dayNames[targetDate.getDay()];

    // Determine candidate faculty pool
    let facultyQuery: any = { status: 'ACTIVE' };
    if (!params.includeCrossDept) {
      facultyQuery = {
        status: 'ACTIVE',
        OR: [
          { departmentId: params.departmentId },
          { teachingAssignments: { some: { teachingDepartmentId: params.departmentId, status: 'ACTIVE' } } },
          { timetableSlots: { some: { departmentId: params.departmentId, status: 'ACTIVE' } } },
        ],
      };
    }

    if (params.excludeFacultyId) {
      facultyQuery.id = { not: params.excludeFacultyId };
    }

    const candidates = await prisma.faculty.findMany({
      where: facultyQuery,
      include: {
        department: true,
        timetableSlots: { where: { status: 'ACTIVE' } },
        teachingAssignments: { where: { status: 'ACTIVE' } },
      },
    });

    const results: SubstituteCandidate[] = [];

    for (const fac of candidates) {
      // Check availability across all periods of the session
      let isAvailable = true;
      for (let p = params.periodStart; p <= params.periodEnd; p++) {
        const availCheck = await this.isFacultyAvailableForPeriod({
          facultyId: fac.id,
          date: targetDate,
          dayOfWeek,
          periodNumber: p,
        });
        if (!availCheck.available) {
          isAvailable = false;
          break;
        }
      }

      if (!isAvailable) continue;

      const isHomeDept = fac.departmentId === params.departmentId;
      const weeklySlots = fac.timetableSlots.length;
      const maxWeekly = 20;

      // Determine subject match
      let subjectMatch: SubstituteCandidate['subjectMatch'] = 'DEPARTMENT_FACULTY';
      let subjectMatchLabel = `${fac.department.code || fac.department.name} Faculty`;
      let score = 50;

      if (params.subjectId) {
        const teachesExactSubject = fac.timetableSlots.some(s => s.subjectId === params.subjectId) ||
          fac.teachingAssignments.some(a => a.subjectId === params.subjectId);
        
        if (teachesExactSubject) {
          subjectMatch = 'SAME_SUBJECT';
          subjectMatchLabel = 'Same Subject Faculty';
          score += 40;
        } else if (isHomeDept) {
          subjectMatch = 'TAUGHT_SUBJECT';
          subjectMatchLabel = 'Department Faculty';
          score += 20;
        } else {
          subjectMatch = 'CROSS_DEPARTMENT';
          subjectMatchLabel = 'Cross-Dept Faculty';
          score += 5;
        }
      } else if (!isHomeDept) {
        subjectMatch = 'CROSS_DEPARTMENT';
        subjectMatchLabel = 'Cross-Dept Faculty';
      }

      if (isHomeDept) score += 15;
      score += Math.max(0, maxWeekly - weeklySlots); // lower workload gives higher ranking

      results.push({
        facultyId: fac.id,
        employeeId: fac.employeeId,
        name: `${fac.firstName} ${fac.lastName}`,
        designation: fac.designation || 'Faculty',
        department: {
          id: fac.department.id,
          name: fac.department.name,
          code: fac.department.code,
        },
        isHomeDept,
        weeklyLoadHours: weeklySlots,
        maxWeeklyHours: maxWeekly,
        workloadDisplay: `${weeklySlots}/${maxWeekly} hrs`,
        subjectMatch,
        subjectMatchLabel,
        availabilityStatus: 'AVAILABLE',
        score,
      });
    }

    // Sort descending by score
    results.sort((a, b) => b.score - a.score);
    return results;
  }

  /**
   * Auto-detect all timetable sessions affected by leave across ALL teaching and home departments,
   * merging multi-period labs/projects and pre-populating department-wise eligible substitutes.
   */
  static async detectAffectedSessions(params: {
    facultyId: string;
    startDate: Date;
    endDate: Date;
    isHalfDay?: boolean;
    halfDayPeriod?: 'FIRST_HALF' | 'SECOND_HALF';
  }): Promise<{
    sessions: AffectedTimetableSession[];
    totalSessions: number;
    nonWorkingDays: string[];
    noClassDays: string[];
  }> {
    const { facultyId, startDate, endDate, isHalfDay, halfDayPeriod } = params;

    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: { department: true },
    });

    if (!faculty) throw new Error('Faculty not found');

    const homeDeptId = faculty.departmentId;

    // Get all published active slots for this faculty across all departments
    const slots = await prisma.timetableSlot.findMany({
      where: { facultyId, status: 'ACTIVE' },
      include: {
        department: true,
        subject: true,
        section: true,
      },
      orderBy: { slotIndex: 'asc' },
    });

    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const sessions: AffectedTimetableSession[] = [];
    const nonWorkingDays: string[] = [];
    const noClassDays: string[] = [];

    const cur = new Date(startDate);
    cur.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    while (cur <= end) {
      const dateStr = cur.toISOString().split('T')[0];
      const dayName = dayNames[cur.getDay()];

      // 1. Skip Sunday & Non-working days
      if (cur.getDay() === 0) {
        nonWorkingDays.push(dateStr);
        cur.setDate(cur.getDate() + 1);
        continue;
      }

      // 2. Filter slots for this day of week
      let daySlots = slots.filter(s => s.dayOfWeek === dayName);

      // 3. Half-Day Filter
      if (isHalfDay) {
        if (halfDayPeriod === 'SECOND_HALF') {
          // Afternoon: Period 5 and above (or 13:00+)
          daySlots = daySlots.filter(s => s.slotIndex >= 5);
        } else {
          // Default / First Half: Morning: Period 1 to 4 (or before 13:00)
          daySlots = daySlots.filter(s => s.slotIndex <= 4);
        }
      }

      if (daySlots.length === 0) {
        noClassDays.push(dateStr);
        cur.setDate(cur.getDate() + 1);
        continue;
      }

      // 4. Group consecutive multi-period slots (Labs / Projects / Block Theory)
      daySlots.sort((a, b) => a.slotIndex - b.slotIndex);
      const groupedDaySessions: any[] = [];
      let i = 0;

      while (i < daySlots.length) {
        const base = daySlots[i];
        let j = i + 1;
        const mergedSlotIds = [base.id];
        let maxIndex = base.slotIndex;
        let lastEnd = base.endTime;

        while (
          j < daySlots.length &&
          daySlots[j].slotIndex === maxIndex + 1 &&
          daySlots[j].subjectId === base.subjectId &&
          daySlots[j].sectionId === base.sectionId &&
          daySlots[j].departmentId === base.departmentId &&
          (base.isLab || base.slotType === 'LAB' || daySlots[j].slotType === base.slotType)
        ) {
          mergedSlotIds.push(daySlots[j].id);
          maxIndex = daySlots[j].slotIndex;
          lastEnd = daySlots[j].endTime;
          j++;
        }

        const isMultiPeriod = base.slotIndex !== maxIndex;
        const periodDisplay = isMultiPeriod
          ? `Period ${base.slotIndex}–${maxIndex}`
          : `Period ${base.slotIndex}`;

        groupedDaySessions.push({
          date: dateStr,
          dayOfWeek: dayName,
          periodDisplay,
          periodStart: base.slotIndex,
          periodEnd: maxIndex,
          startTime: base.startTime,
          endTime: lastEnd,
          departmentId: base.department.id,
          departmentName: base.department.name,
          departmentCode: base.department.code,
          isHomeDepartment: base.department.id === homeDeptId,
          subjectId: base.subject.id,
          subjectName: base.subject.name,
          subjectCode: base.subject.code,
          sectionId: base.section?.id,
          sectionName: base.section?.name,
          venue: base.roomNo || undefined,
          roomNo: base.roomNo || undefined,
          slotType: base.slotType || (base.isLab ? 'LAB' : 'THEORY'),
          isLab: Boolean(base.isLab || base.slotType === 'LAB'),
          slotIds: mergedSlotIds,
        });

        i = j;
      }

      // 5. Populate department-wise eligible substitutes for each session
      for (const sess of groupedDaySessions) {
        const eligible = await this.getAvailableSubstitutes({
          date: dateStr,
          dayOfWeek: dayName,
          periodStart: sess.periodStart,
          periodEnd: sess.periodEnd,
          departmentId: sess.departmentId,
          subjectId: sess.subjectId,
          excludeFacultyId: facultyId,
          includeCrossDept: false,
        });

        const sessionId = `${dateStr}_slot_${sess.periodStart}_${sess.periodEnd}_${sess.subjectId}_${sess.departmentId}`;

        sessions.push({
          ...sess,
          sessionId,
          eligibleSubstitutes: eligible,
          assignedSubstituteId: eligible.length > 0 ? eligible[0].facultyId : undefined,
          assignedSubstituteName: eligible.length > 0 ? eligible[0].name : undefined,
          assignedSubstituteDept: eligible.length > 0 ? eligible[0].department.code : undefined,
          assignedSubstituteWorkload: eligible.length > 0 ? eligible[0].workloadDisplay : undefined,
          subjectMatch: eligible.length > 0 ? eligible[0].subjectMatchLabel : undefined,
        });
      }

      cur.setDate(cur.getDate() + 1);
    }

    return {
      sessions,
      totalSessions: sessions.length,
      nonWorkingDays,
      noClassDays,
    };
  }

  /**
   * Backward-compatible helper.
   */
  static async detectAffectedTimetablePeriods(
    facultyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AffectedTimetablePeriod[]> {
    const { sessions } = await this.detectAffectedSessions({ facultyId, startDate, endDate });
    const periods: AffectedTimetablePeriod[] = [];
    for (const sess of sessions) {
      periods.push({
        date: sess.date,
        dayOfWeek: sess.dayOfWeek,
        slotIndex: sess.periodStart,
        timetableSlotId: sess.slotIds[0] || '',
        departmentId: sess.departmentId,
        departmentName: sess.departmentName,
        departmentCode: sess.departmentCode,
        isHomeDepartment: sess.isHomeDepartment,
        subjectId: sess.subjectId,
        subjectName: sess.subjectName,
        subjectCode: sess.subjectCode,
        sectionId: sess.sectionId,
        sectionName: sess.sectionName,
        startTime: sess.startTime,
        endTime: sess.endTime,
        roomNo: sess.roomNo,
        isLab: sess.isLab,
        assignedSubstituteId: sess.assignedSubstituteId,
        assignedSubstituteName: sess.assignedSubstituteName,
      });
    }
    return periods;
  }

  /**
   * Validate and re-check candidate availability for all assigned substitutions.
   */
  static async revalidateSubstitutions(substitutions: any[], applicantFacultyId: string) {
    for (const sub of substitutions) {
      if (!sub.assignedSubstituteId) continue;
      if (sub.assignedSubstituteId === applicantFacultyId) {
        throw new Error(`Faculty cannot assign themselves as substitute for ${sub.subjectName || 'class session'}`);
      }

      const targetDate = new Date(sub.date);
      const dayOfWeek = sub.dayOfWeek;
      const periodStart = sub.periodStart || sub.slotIndex || 1;
      const periodEnd = sub.periodEnd || sub.slotIndex || periodStart;

      const subFaculty = await prisma.faculty.findUnique({
        where: { id: sub.assignedSubstituteId },
        include: { department: true },
      });

      if (!subFaculty) {
        throw new Error(`Substitute faculty with ID ${sub.assignedSubstituteId} not found`);
      }

      for (let p = periodStart; p <= periodEnd; p++) {
        const check = await this.isFacultyAvailableForPeriod({
          facultyId: sub.assignedSubstituteId,
          date: targetDate,
          dayOfWeek,
          periodNumber: p,
        });

        if (!check.available) {
          throw new Error(
            `Conflict detected: Proposed substitute ${subFaculty.firstName} ${subFaculty.lastName} is ${check.reason} on ${sub.date} during Period ${p} (${sub.subjectName || 'Session'})`
          );
        }
      }
    }
  }

  /**
   * Get complete Leave Quota & Real-time Balance for a faculty member.
   */
  static async getFacultyLeaveBalances(
    facultyId: string,
    academicYear = '2026-2027'
  ): Promise<LeaveBalanceSummary[]> {
    // 1. Fetch or initialize default policies
    const policies = await prisma.facultyLeavePolicy.findMany({ where: { isActive: true } });
    if (policies.length === 0) {
      await prisma.facultyLeavePolicy.createMany({
        data: [
          { leaveType: 'CASUAL_LEAVE', name: 'Casual Leave (CL)', annualQuota: 12, monthlyLimit: 3 },
          { leaveType: 'MEDICAL_LEAVE', name: 'Medical Leave (ML)', annualQuota: 10, monthlyLimit: 10 },
          { leaveType: 'EARNED_LEAVE', name: 'Earned Leave (EL)', annualQuota: 15, monthlyLimit: 15 },
          { leaveType: 'ON_DUTY', name: 'On Duty (OD)', annualQuota: 15, monthlyLimit: 5 },
        ],
        skipDuplicates: true,
      });
    }

    const allPolicies = await prisma.facultyLeavePolicy.findMany({ where: { isActive: true } });

    // 2. Fetch ledger debits and credits
    const ledgerEntries = await prisma.facultyLeaveLedger.findMany({
      where: { facultyId, academicYear },
    });

    // 3. Fetch pending requests
    const pendingRequests = await prisma.facultyLeaveRequest.findMany({
      where: {
        facultyId,
        status: { in: ['PENDING_HOD', 'FORWARDED_TO_PRINCIPAL', 'SUBMITTED', 'IN_REVIEW'] },
      },
    });

    const balances: LeaveBalanceSummary[] = [];

    for (const pol of allPolicies) {
      const typeEntries = ledgerEntries.filter(e => e.leaveType === pol.leaveType);
      const totalCredits = typeEntries.reduce((acc, e) => acc + e.credit, 0);
      const totalDebits = typeEntries.reduce((acc, e) => acc + e.debit, 0);
      const totalAdjustments = typeEntries.reduce((acc, e) => acc + e.adjustment, 0);

      const effectiveOpening = totalCredits > 0 ? totalCredits : pol.annualQuota;
      const usedDays = totalDebits;
      const pendingDays = pendingRequests
        .filter(r => r.leaveType === pol.leaveType)
        .reduce((acc, r) => acc + r.totalDays, 0);

      const availableDays = Math.max(0, effectiveOpening - usedDays - totalAdjustments);

      balances.push({
        leaveType: pol.leaveType,
        leaveTypeName: pol.name,
        annualQuota: pol.annualQuota,
        usedDays,
        pendingDays,
        availableDays,
      });
    }

    return balances;
  }

  /**
   * Submit Leave or OD application as Faculty with full affected class substitution plan.
   */
  static async submitLeaveOd(userId: string, dto: CreateFacultyLeaveOdDto & { substitutionsList?: any[] }) {
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

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const requestedDays = dto.totalDays || 1;

    // Validate Policy & Balance
    const balances = await this.getFacultyLeaveBalances(faculty.id);
    const currentBalance = balances.find(b => b.leaveType === dto.category || b.leaveType === dto.requestType);
    if (currentBalance && currentBalance.availableDays < requestedDays) {
      throw new Error(`Insufficient leave balance: Available is ${currentBalance.availableDays} day(s), but requested ${requestedDays} day(s)`);
    }

    // Auto-detect affected classes
    const { sessions } = await this.detectAffectedSessions({
      facultyId: faculty.id,
      startDate,
      endDate,
      isHalfDay: dto.isHalfDay,
      halfDayPeriod: dto.halfDayPeriod || undefined,
    });

    // Merge substitution choices if provided
    const userSubstitutions: any[] = dto.substitutionsList || (dto.affectedPeriods as any) || [];

    const finalSubstitutions: any[] = sessions.map(sess => {
      const match = userSubstitutions.find((u: any) =>
        (u.sessionId && u.sessionId === sess.sessionId) ||
        (u.date === sess.date && (u.periodStart === sess.periodStart || u.slotIndex === sess.periodStart))
      );

      return {
        ...sess,
        assignedSubstituteId: match?.assignedSubstituteId || sess.assignedSubstituteId,
        assignedSubstituteName: match?.assignedSubstituteName || sess.assignedSubstituteName,
        assignedSubstituteDept: match?.assignedSubstituteDept || sess.assignedSubstituteDept,
        assignedSubstituteWorkload: match?.assignedSubstituteWorkload || sess.assignedSubstituteWorkload,
        subjectMatch: match?.subjectMatch || sess.subjectMatch,
      };
    });

    // Revalidate substitute availability at submit time
    await this.revalidateSubstitutions(finalSubstitutions, faculty.id);

    // Generate Request Number
    const year = new Date().getFullYear();
    const count = await prisma.facultyLeaveRequest.count();
    const prefix = dto.requestType === 'LEAVE' ? 'FLV' : 'FOD';
    const randTag = Math.floor(1000 + Math.random() * 9000);
    const requestNumber = `${prefix}-${year}-${String(count + 1).padStart(4, '0')}-${randTag}`;

    const newRequest = await prisma.facultyLeaveRequest.create({
      data: {
        requestNumber,
        facultyId: faculty.id,
        departmentId: faculty.departmentId,
        leaveType: dto.category || (dto.requestType === 'LEAVE' ? 'CASUAL_LEAVE' : 'ON_DUTY'),
        reason: dto.reason || 'Personal Leave',
        startDate,
        endDate,
        totalDays: requestedDays,
        attachmentUrl: dto.supportingDocumentUrl || null,
        substitutions: JSON.stringify(finalSubstitutions),
        status: 'PENDING_HOD',
      },
      include: {
        faculty: true,
        department: true,
      },
    });

    // Send notification to Department HOD
    if (hodUser.id) {
      await FacultyLeaveNotificationService.notifyHodOnSubmission(
        newRequest,
        `${faculty.firstName} ${faculty.lastName}`,
        hodUser.id
      ).catch(() => {});
    }

    logger.info(`[FacultyLeaveService] Request ${requestNumber} submitted by Faculty ${faculty.id} to HOD ${hodUser.id}`);
    return newRequest;
  }

  /**
   * HOD Reviews complete request and FORWARDS to Principal.
   */
  static async hodForwardToPrincipal(params: {
    hodUserId: string;
    requestId: string;
    remarks?: string;
    confirmedSubstitutions?: any[];
  }) {
    const request = await prisma.facultyLeaveRequest.findUnique({
      where: { id: params.requestId },
      include: { faculty: true, department: true },
    });

    if (!request) throw new Error('Leave request not found');

    const confirmedSubs = params.confirmedSubstitutions || JSON.parse(request.substitutions || '[]');

    // Revalidate substitutions before HOD forward
    await this.revalidateSubstitutions(confirmedSubs, request.facultyId);

    const updated = await prisma.facultyLeaveRequest.update({
      where: { id: request.id },
      data: {
        status: 'FORWARDED_TO_PRINCIPAL',
        hodId: params.hodUserId,
        hodApprovedAt: new Date(),
        hodRemarks: params.remarks || 'Recommended by Department HOD and forwarded to Principal',
        substitutions: JSON.stringify(confirmedSubs),
      },
      include: {
        faculty: true,
        department: true,
      },
    });

    const isOd = request.leaveType === 'ON_DUTY' || (request as any).type === 'ON_DUTY';
    const reqType = isOd ? 'FACULTY_OD' : 'FACULTY_LEAVE';
    const facultyName = `${request.faculty?.firstName || 'Faculty'} ${request.faculty?.lastName || ''}`.trim();
    const deptName = request.department?.name || 'Academic Department';

    // 1. Create or synchronize ApprovalAssignment for Principal / Acting Principal queue
    try {
      const existingAssignment = await (prisma as any).approvalAssignment.findFirst({
        where: { requestId: request.id },
      });

      if (existingAssignment) {
        await (prisma as any).approvalAssignment.update({
          where: { id: existingAssignment.id },
          data: {
            status: 'PENDING',
            title: `[Executive] ${isOd ? 'ON DUTY' : request.leaveType.replace('_', ' ')}: ${request.requestNumber || request.id.slice(0, 8)}`,
            applicantName: facultyName,
            departmentName: deptName,
            assignedRole: 'PRINCIPAL',
          },
        });
      } else {
        await PrincipalRequestRoutingService.createApprovalAssignment({
          requestId: request.id,
          requestType: reqType,
          title: `[Executive] ${isOd ? 'ON DUTY' : request.leaveType.replace('_', ' ')}: ${request.requestNumber || request.id.slice(0, 8)}`,
          applicantName: facultyName,
          departmentName: deptName,
        });
      }
    } catch (assignErr) {
      logger.warn('[FacultyLeaveService] Failed to create ApprovalAssignment on HOD forward:', assignErr);
    }

    // 2. Record Workflow Timeline Event
    try {
      await ApprovalTimelineService.recordEvent({
        requestId: request.id,
        eventType: 'HOD_RECOMMENDED',
        fromStage: 'HOD',
        toStage: 'PRINCIPAL',
        fromStatus: 'PENDING',
        toStatus: 'PENDING',
        actorUserId: params.hodUserId,
        actorNameSnapshot: 'Department HOD',
        actorRole: 'HOD',
        actorDisplayRole: 'Head of Department',
        performedAsRole: 'HOD',
        remarks: params.remarks || 'Recommended by HOD and forwarded to Principal',
        idempotencyKey: `${request.id}:HOD_RECOMMENDED:${Date.now()}`,
      });
    } catch (timeErr) {
      logger.warn('[FacultyLeaveService] Failed to record timeline event:', timeErr);
    }

    // 3. Notify faculty applicant
    if (request.faculty.userId) {
      await FacultyLeaveNotificationService.notifyFacultyOnHodAction(
        updated,
        request.faculty.userId,
        'RECOMMENDED',
        params.remarks
      ).catch(() => {});
    }

    // 4. Notify Principal & Acting Principal
    await FacultyLeaveNotificationService.notifyPrincipalOnHodRecommendation(
      updated,
      facultyName,
      params.remarks
    ).catch(() => {});

    logger.info(`[FacultyLeaveService] Request ${request.requestNumber} forwarded to Principal by HOD ${params.hodUserId}`);
    return updated;
  }

  /**
   * Principal Grants Final Approval:
   * 1. Re-verifies substitute availability right before approval
   * 2. Transactionally records idempotent debit in FacultyLeaveLedger
   * 3. Activates TimetableSlotOverride for each substituted slot
   * 4. Dispatches multi-role notifications
   */
  static async principalFinalApprove(params: {
    principalUserId: string;
    requestId: string;
    remarks?: string;
    isActingPrincipal?: boolean;
  }) {
    const request = await prisma.facultyLeaveRequest.findUnique({
      where: { id: params.requestId },
      include: { faculty: true, department: true },
    });

    if (!request) throw new Error('Leave request not found');
    if (request.status === 'APPROVED_PRINCIPAL' || request.status === 'APPROVED') {
      return request; // Idempotent: already approved
    }

    const substitutions: any[] = JSON.parse(request.substitutions || '[]');

    // Revalidate substitute availability before final activation
    await this.revalidateSubstitutions(substitutions, request.facultyId);

    const academicYear = '2026-2027';

    // 1. Transactional approval + ledger debit + timetable slot override activation
    const result = await prisma.$transaction(async (tx) => {
      // Fetch latest balance
      const existingLedgers = await tx.facultyLeaveLedger.findMany({
        where: { facultyId: request.facultyId, leaveType: request.leaveType, academicYear },
        orderBy: { createdAt: 'desc' },
      });

      const policy = await tx.facultyLeavePolicy.findUnique({
        where: { leaveType: request.leaveType },
      });

      const currentBalance = existingLedgers.length > 0
        ? existingLedgers[0].closingBalance
        : (policy?.annualQuota || 12);

      const newClosingBalance = Math.max(0, currentBalance - request.totalDays);

      // Check if duplicate ledger debit already exists for this requestId
      const alreadyDebited = await tx.facultyLeaveLedger.findFirst({
        where: { referenceRequestId: request.id },
      });

      if (!alreadyDebited && request.leaveType !== 'ON_DUTY') {
        await tx.facultyLeaveLedger.create({
          data: {
            facultyId: request.facultyId,
            leaveType: request.leaveType,
            academicYear,
            openingBalance: currentBalance,
            debit: request.totalDays,
            closingBalance: newClosingBalance,
            transactionType: 'DEBIT_LEAVE',
            referenceRequestId: request.id,
            remarks: `Approved ${request.leaveType} (${request.requestNumber}) by Principal`,
            approvedBy: params.principalUserId,
          },
        });
      }

      // Update Leave Request Status
      const approvedReq = await tx.facultyLeaveRequest.update({
        where: { id: request.id },
        data: {
          status: 'APPROVED_PRINCIPAL',
          principalId: params.principalUserId,
          principalApprovedAt: new Date(),
          principalRemarks: params.remarks || 'Approved by Principal',
          isActingPrincipal: Boolean(params.isActingPrincipal),
        },
        include: { faculty: true, department: true },
      });

      // Parse substitutions and activate TimetableSlotOverrides for each slot
      for (const sub of substitutions) {
        if (sub.assignedSubstituteId) {
          const subDate = new Date(sub.date || request.startDate);
          const slotIdsToOverride: string[] = Array.isArray(sub.slotIds) && sub.slotIds.length > 0
            ? sub.slotIds
            : sub.timetableSlotId ? [sub.timetableSlotId] : [];

          for (const slotId of slotIdsToOverride) {
            const slot = await tx.timetableSlot.findUnique({ where: { id: slotId } });
            const periodNumber = slot ? slot.slotIndex : (sub.periodStart || 1);

            await tx.timetableSlotOverride.upsert({
              where: {
                timetableSlotId_date: {
                  timetableSlotId: slotId,
                  date: subDate,
                },
              },
              update: {
                substituteFacultyId: sub.assignedSubstituteId,
                originalFacultyId: request.facultyId,
                leaveRequestId: request.id,
                periodNumber,
                status: 'ACTIVE',
              },
              create: {
                timetableSlotId: slotId,
                date: subDate,
                dayOfWeek: sub.dayOfWeek || 'MONDAY',
                periodNumber,
                originalFacultyId: request.facultyId,
                substituteFacultyId: sub.assignedSubstituteId,
                leaveRequestId: request.id,
                status: 'ACTIVE',
              },
            });
          }
        }
      }

      return approvedReq;
    });

    // Notify substitutes, department HODs, and applicant
    await FacultyLeaveNotificationService.notifySubstitutesAndStakeholdersOnApproval({
      request: result,
      substitutions,
      applicantFaculty: request.faculty,
    }).catch(() => {});

    logger.info(`[FacultyLeaveService] Request ${request.requestNumber} finally approved by Principal. Timetable overrides activated.`);
    return result;
  }

  /**
   * Principal Rejection Action.
   */
  static async principalReject(principalUserId: string, requestId: string, reason: string) {
    const request = await prisma.facultyLeaveRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED_PRINCIPAL',
        principalId: principalUserId,
        principalRemarks: reason,
      },
      include: { faculty: true, department: true },
    });

    return request;
  }

  /**
   * Cancel / Withdraw Leave Request and reverse Ledger debit.
   */
  static async cancelLeaveRequest(userId: string, requestId: string, reason: string) {
    const request = await prisma.facultyLeaveRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new Error('Leave request not found');

    const wasApproved = request.status === 'APPROVED_PRINCIPAL' || request.status === 'APPROVED';

    const result = await prisma.$transaction(async (tx) => {
      // 1. If was approved, create reversal transaction in ledger
      if (wasApproved && request.leaveType !== 'ON_DUTY') {
        const existingLedgers = await tx.facultyLeaveLedger.findMany({
          where: { facultyId: request.facultyId, leaveType: request.leaveType },
          orderBy: { createdAt: 'desc' },
        });

        const currentBalance = existingLedgers.length > 0 ? existingLedgers[0].closingBalance : 0;
        const newBalance = currentBalance + request.totalDays;

        await tx.facultyLeaveLedger.create({
          data: {
            facultyId: request.facultyId,
            leaveType: request.leaveType,
            openingBalance: currentBalance,
            credit: request.totalDays,
            closingBalance: newBalance,
            transactionType: 'REVERSAL_CANCELLATION',
            referenceRequestId: request.id,
            remarks: `Cancelled leave reversal (${reason})`,
          },
        });

        // 2. Deactivate timetable slot overrides
        await tx.timetableSlotOverride.updateMany({
          where: { leaveRequestId: request.id },
          data: { status: 'CANCELLED' },
        });
      }

      return tx.facultyLeaveRequest.update({
        where: { id: request.id },
        data: { status: 'CANCELLED' },
      });
    });

    return result;
  }

  static async getFacultyRequests(userId: string) {
    const faculty = await repo.findFacultyByUserId(userId);
    if (!faculty) return [];
    return prisma.facultyLeaveRequest.findMany({
      where: { facultyId: faculty.id },
      include: { department: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getRequestById(requestId: string) {
    return prisma.facultyLeaveRequest.findUnique({
      where: { id: requestId },
      include: { faculty: true, department: true },
    });
  }

  static async getHodDashboard(hodUserId: string, statusFilter?: string) {
    let departmentId: string | null = null;
    const hod = await prisma.user.findUnique({ where: { id: hodUserId } });
    if (hod?.departmentId) departmentId = hod.departmentId;

    if (!departmentId) {
      const assignment = await (prisma as any).departmentHodAssignment.findFirst({
        where: { hodUserId, isActive: true },
      });
      if (assignment?.departmentId) departmentId = assignment.departmentId;
    }

    if (!departmentId) {
      const membership = await prisma.departmentMembership.findFirst({
        where: { userId: hodUserId, role: { in: ['HOD', 'HEAD_OF_DEPARTMENT'] } },
      });
      if (membership?.departmentId) departmentId = membership.departmentId;
    }

    if (!departmentId) {
      const dept = await prisma.department.findFirst({
        where: { hodUserId, status: 'ACTIVE' },
      });
      if (dept?.id) departmentId = dept.id;
    }

    if (!departmentId) {
      const faculty = await prisma.faculty.findFirst({
        where: { userId: hodUserId },
      });
      if (faculty?.departmentId) departmentId = faculty.departmentId;
    }

    if (!departmentId) {
      const firstDept = await prisma.department.findFirst({ where: { status: 'ACTIVE' } });
      departmentId = firstDept?.id || null;
    }

    const whereClause: any = {};
    if (departmentId) {
      whereClause.departmentId = departmentId;
    }
    if (statusFilter && statusFilter !== 'ALL') {
      whereClause.status = statusFilter;
    }

    const requests = await prisma.facultyLeaveRequest.findMany({
      where: whereClause,
      include: { faculty: true, department: true },
      orderBy: { createdAt: 'desc' },
    });

    const pendingCount = await prisma.facultyLeaveRequest.count({
      where: {
        ...(departmentId ? { departmentId } : {}),
        status: 'PENDING_HOD',
      },
    });

    return {
      requests,
      queue: requests,
      pendingCount,
      summary: {
        pendingHodCount: pendingCount,
        forwardedCount: requests.filter((r) => r.status === 'FORWARDED_TO_PRINCIPAL').length,
        approvedCount: requests.filter((r) => r.status === 'APPROVED_PRINCIPAL').length,
        rejectedCount: requests.filter((r) => r.status.includes('REJECT')).length,
      },
    };
  }

  static async hodRecommend(
    hodUserId: string,
    requestId: string,
    remarks?: string,
    confirmedSubstituteId?: string,
    handoverInstructions?: string,
    confirmedSubstitutions?: any[]
  ) {
    return this.hodForwardToPrincipal({
      hodUserId,
      requestId,
      remarks: remarks || handoverInstructions || 'Recommended by HOD',
      confirmedSubstitutions,
    });
  }

  static async hodReject(hodUserId: string, requestId: string, reason: string) {
    return prisma.facultyLeaveRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED_HOD',
        hodId: hodUserId,
        hodRemarks: reason,
      },
    });
  }

  static async hodReturn(hodUserId: string, requestId: string, reason: string) {
    return prisma.facultyLeaveRequest.update({
      where: { id: requestId },
      data: {
        status: 'RETURNED_HOD',
        hodId: hodUserId,
        hodRemarks: reason,
      },
    });
  }
}
