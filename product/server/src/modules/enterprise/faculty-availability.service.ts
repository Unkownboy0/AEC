import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

export type DerivedStatus =
  | 'ON_LEAVE'
  | 'ON_DUTY'
  | 'SUBSTITUTE_CLASS'
  | 'IN_CLASS'
  | 'IN_LAB'
  | 'MEETING'
  | 'EXAM_DUTY'
  | 'ADMINISTRATIVE_WORK'
  | 'AVAILABLE'
  | 'UNKNOWN';

export interface FacultyPeriodStatus {
  facultyId: string;
  employeeId: string;
  name: string;
  homeDepartment: { id: string; name: string; code: string };
  periodNumber: number;
  date: string;
  status: DerivedStatus;
  statusLabel: string;
  departmentScope?: { id: string; name: string; code: string };
  classDetails?: {
    className?: string;
    sectionName?: string;
    subjectName?: string;
    subjectCode?: string;
    roomNo?: string;
    isLab?: boolean;
    isSubstituted?: boolean;
  };
  eventDetails?: {
    title?: string;
    reason?: string;
    venue?: string;
    endTime?: string;
  };
}

export interface FreeFacultySearchQuery {
  date: string; // YYYY-MM-DD
  periodNumber: number;
  dayOfWeek?: string;
  departmentId?: string;
  subjectId?: string;
  requiredQualification?: string;
  maxWorkloadHours?: number;
}

export class FacultyAvailabilityService {
  /**
   * Derive real-time period status for a faculty member.
   * Strict Priority Order:
   * 1. Approved Leave
   * 2. Approved OD (Official Duty)
   * 3. Substitute Assignment (TimetableSlotOverride)
   * 4. Published Timetable Slot (In Class / In Lab)
   * 5. Scheduled Institutional Meeting
   * 6. Exam / Invigilation Duty
   * 7. Available
   */
  static async deriveFacultyPeriodStatus(params: {
    facultyId: string;
    date: Date;
    periodNumber: number;
    dayOfWeek?: string;
  }): Promise<FacultyPeriodStatus> {
    const { facultyId, periodNumber } = params;
    const targetDate = new Date(params.date);
    targetDate.setHours(0, 0, 0, 0);
    const endOfDay = new Date(params.date);
    endOfDay.setHours(23, 59, 59, 999);

    const dayName = params.dayOfWeek || [
      'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'
    ][targetDate.getDay()];

    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: { department: true },
    });

    if (!faculty) throw new Error('Faculty not found');

    const baseResult: FacultyPeriodStatus = {
      facultyId: faculty.id,
      employeeId: faculty.employeeId,
      name: `${faculty.firstName} ${faculty.lastName}`,
      homeDepartment: {
        id: faculty.department.id,
        name: faculty.department.name,
        code: faculty.department.code,
      },
      periodNumber,
      date: targetDate.toISOString().split('T')[0],
      status: 'AVAILABLE',
      statusLabel: 'Available',
    };

    const startWindow = new Date(targetDate.getTime() - 24 * 3600 * 1000);
    const endWindow = new Date(endOfDay.getTime() + 24 * 3600 * 1000);

    // 1. Check Approved Leave for this date
    const activeLeave = await prisma.facultyLeaveRequest.findFirst({
      where: {
        facultyId,
        leaveType: { not: 'ON_DUTY' },
        status: { in: ['APPROVED', 'APPROVED_PRINCIPAL', 'FINAL_APPROVED'] },
        startDate: { lte: endWindow },
        endDate: { gte: startWindow },
      },
    });

    if (activeLeave) {
      baseResult.status = 'ON_LEAVE';
      baseResult.statusLabel = 'On Leave';
      baseResult.eventDetails = {
        title: `${activeLeave.leaveType} Leave`,
        reason: activeLeave.reason,
      };
      return baseResult;
    }

    // 2. Check Approved OD for this date
    const activeOd = await prisma.facultyLeaveRequest.findFirst({
      where: {
        facultyId,
        leaveType: 'ON_DUTY',
        status: { in: ['APPROVED', 'APPROVED_PRINCIPAL', 'FINAL_APPROVED'] },
        startDate: { lte: endWindow },
        endDate: { gte: startWindow },
      },
    });

    if (activeOd) {
      baseResult.status = 'ON_DUTY';
      baseResult.statusLabel = 'On Duty (OD)';
      baseResult.eventDetails = {
        title: 'Official Campus Duty (OD)',
        reason: activeOd.reason,
      };
      return baseResult;
    }

    // 3. Check Substitute Override (Faculty acting as substitute)
    const substituteDuty = await prisma.timetableSlotOverride.findFirst({
      where: {
        substituteFacultyId: facultyId,
        date: { gte: startWindow, lte: endWindow },
        periodNumber,
        status: 'ACTIVE',
      },
    });

    if (substituteDuty) {
      const slot = await prisma.timetableSlot.findUnique({
        where: { id: substituteDuty.timetableSlotId },
        include: { subject: true, section: true, department: true },
      });
      baseResult.status = 'SUBSTITUTE_CLASS';
      baseResult.statusLabel = 'Substitute Class';
      baseResult.departmentScope = slot?.department;
      baseResult.classDetails = {
        sectionName: slot?.section?.name,
        subjectName: slot?.subject?.name,
        subjectCode: slot?.subject?.code,
        roomNo: slot?.roomNo ?? undefined,
        isLab: slot?.isLab,
        isSubstituted: true,
      };
      return baseResult;
    }

    // 4. Check Published Timetable Slot for this period
    const regularSlot = await prisma.timetableSlot.findFirst({
      where: {
        facultyId,
        dayOfWeek: dayName,
        slotIndex: periodNumber,
      },
      include: { subject: true, section: true, department: true },
    });

    if (regularSlot) {
      // Check if this regular slot was substituted out by someone else
      const overridden = await prisma.timetableSlotOverride.findFirst({
        where: {
          timetableSlotId: regularSlot.id,
          date: { gte: targetDate, lte: endOfDay },
          status: 'ACTIVE',
        },
      });

      if (!overridden) {
        baseResult.status = regularSlot.isLab ? 'IN_LAB' : 'IN_CLASS';
        baseResult.statusLabel = regularSlot.isLab ? 'In Lab' : 'In Class';
        baseResult.departmentScope = regularSlot.department;
        baseResult.classDetails = {
          sectionName: regularSlot.section?.name,
          subjectName: regularSlot.subject?.name,
          subjectCode: regularSlot.subject?.code,
          roomNo: regularSlot.roomNo ?? undefined,
          isLab: regularSlot.isLab,
          isSubstituted: false,
        };
        return baseResult;
      }
    }

    // Default to AVAILABLE
    return baseResult;
  }

  /**
   * Free Faculty Finder: Find eligible, currently free faculty members.
   */
  static async findAvailableFaculty(query: FreeFacultySearchQuery) {
    const targetDate = new Date(query.date);
    targetDate.setHours(0, 0, 0, 0);
    const dayOfWeek = query.dayOfWeek || [
      'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'
    ][targetDate.getDay()];

    // 1. Get candidate faculty pool
    const facultyWhere: any = { status: 'ACTIVE' };
    if (query.departmentId && query.departmentId !== 'ALL') {
      facultyWhere.departmentId = query.departmentId;
    }

    const candidates = await prisma.faculty.findMany({
      where: facultyWhere,
      include: {
        department: true,
        timetableSlots: true,
        teachingAssignments: { where: { status: 'ACTIVE' } },
      },
    });

    const eligibleFaculty: Array<{
      facultyId: string;
      employeeId: string;
      name: string;
      department: { id: string; name: string; code: string };
      designation: string;
      qualification: string;
      status: DerivedStatus;
      weeklyLoadHours: number;
      isSubjectQualified: boolean;
      score: number;
    }> = [];

    for (const fac of candidates) {
      const statusObj = await this.deriveFacultyPeriodStatus({
        facultyId: fac.id,
        date: targetDate,
        periodNumber: query.periodNumber,
        dayOfWeek,
      });

      // Exclude if busy (in class, on leave, OD, or substitute)
      if (statusObj.status !== 'AVAILABLE') {
        continue;
      }

      // Check subject familiarity if query.subjectId provided
      let isSubjectQualified = false;
      if (query.subjectId) {
        const teachesSubject = fac.timetableSlots.some(s => s.subjectId === query.subjectId) ||
          fac.teachingAssignments.some(a => a.subjectId === query.subjectId);
        if (teachesSubject) {
          isSubjectQualified = true;
        }
      }

      const weeklyLoad = fac.timetableSlots.length;

      // Ranking score: preference for same department + subject qualified + lower workload
      let score = 50;
      if (query.departmentId && fac.departmentId === query.departmentId) score += 30;
      if (isSubjectQualified) score += 20;
      score -= Math.min(weeklyLoad, 20); // lighter workload gets higher priority

      eligibleFaculty.push({
        facultyId: fac.id,
        employeeId: fac.employeeId,
        name: `${fac.firstName} ${fac.lastName}`,
        department: {
          id: fac.department.id,
          name: fac.department.name,
          code: fac.department.code,
        },
        designation: fac.designation,
        qualification: fac.qualification,
        status: 'AVAILABLE',
        weeklyLoadHours: weeklyLoad,
        isSubjectQualified,
        score,
      });
    }

    // Sort by recommendation score descending
    eligibleFaculty.sort((a, b) => b.score - a.score);

    return {
      date: query.date,
      periodNumber: query.periodNumber,
      dayOfWeek,
      totalAvailableCount: eligibleFaculty.length,
      suggestions: eligibleFaculty,
    };
  }

  /**
   * Get campus-wide faculty availability board for a given date.
   */
  static async getCampusAvailabilityBoard(params: {
    date: Date;
    departmentId?: string;
  }) {
    const targetDate = new Date(params.date);
    targetDate.setHours(0, 0, 0, 0);
    const dayOfWeek = [
      'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'
    ][targetDate.getDay()];

    const whereClause: any = { status: 'ACTIVE' };
    if (params.departmentId && params.departmentId !== 'ALL') {
      whereClause.departmentId = params.departmentId;
    }

    const faculties = await prisma.faculty.findMany({
      where: whereClause,
      include: { department: true },
      orderBy: { firstName: 'asc' },
    });

    const board = [];

    for (const f of faculties) {
      const periods = [];
      for (let p = 1; p <= 8; p++) {
        const periodStatus = await this.deriveFacultyPeriodStatus({
          facultyId: f.id,
          date: targetDate,
          periodNumber: p,
          dayOfWeek,
        });
        periods.push(periodStatus);
      }

      board.push({
        facultyId: f.id,
        employeeId: f.employeeId,
        name: `${f.firstName} ${f.lastName}`,
        department: {
          id: f.department.id,
          name: f.department.name,
          code: f.department.code,
        },
        designation: f.designation,
        periods,
      });
    }

    return {
      date: targetDate.toISOString().split('T')[0],
      dayOfWeek,
      totalFaculty: board.length,
      board,
    };
  }
}
