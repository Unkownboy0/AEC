import { prisma } from '../../lib/prisma';
import { ForbiddenException, NotFoundException } from '../../utils/exceptions';
import { UserPayload } from '../../utils/security';

export type FacultyAvailabilityStatus = 'FREE' | 'IN_CLASS' | 'IN_LAB' | 'ON_LEAVE' | 'ON_DUTY' | 'NO_SCHEDULE';

export interface FacultyOperationsQuery {
  departmentId?: string;
  date?: Date;
  period?: number;
  search?: string;
}

const approvedLeaveStatuses = [
  'APPROVED', 'APPROVED_HOD', 'APPROVED_PRINCIPAL', 'APPROVED_DEAN',
  'APPROVED_VICE_PRINCIPAL', 'HOD_APPROVED', 'FINAL_APPROVED',
];

const dayName = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' }).toUpperCase();
const dateBounds = (date: Date) => {
  const start = new Date(date); start.setHours(0, 0, 0, 0);
  const end = new Date(date); end.setHours(23, 59, 59, 999);
  return { start, end };
};
const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};
const currentMinutes = (date: Date) => date.getHours() * 60 + date.getMinutes();

export class FacultyOperationsService {
  private async resolveScope(user: UserPayload, requestedDepartmentId?: string) {
    const role = String(user.role || '').toUpperCase().replace(/[\s_-]+/g, '');
    if (['PRINCIPAL', 'VICEPRINCIPAL', 'VP', 'SUPERADMIN'].includes(role)) {
      return requestedDepartmentId && requestedDepartmentId !== 'ALL' ? requestedDepartmentId : undefined;
    }
    if (role !== 'HOD') throw new ForbiddenException('Faculty operations access is not assigned to this workspace');

    const [faculty, membership, userRecord] = await Promise.all([
      prisma.faculty.findFirst({ where: { userId: user.id }, select: { departmentId: true } }),
      prisma.departmentMembership.findFirst({ where: { userId: user.id, role: 'HOD' }, select: { departmentId: true } }),
      prisma.user.findUnique({ where: { id: user.id }, select: { departmentId: true } }),
    ]);
    const scopeId = membership?.departmentId || faculty?.departmentId || userRecord?.departmentId;
    if (!scopeId) throw new ForbiddenException('No HOD department scope is assigned');
    if (requestedDepartmentId && requestedDepartmentId !== 'ALL' && requestedDepartmentId !== scopeId) {
      throw new ForbiddenException('The requested department is outside your HOD scope');
    }
    return scopeId;
  }

  async getFacultyBoard(user: UserPayload, query: FacultyOperationsQuery = {}) {
    const date = query.date || new Date();
    const targetDepartmentId = await this.resolveScope(user, query.departmentId);
    const { start, end } = dateBounds(date);
    const weekday = dayName(date);

    // The deployed database uses the authoritative master timetable tables.
    // Load them independently because the legacy timetable_slots relation can
    // still exist in older generated clients even when that table is absent.
    const allDaySlots = await prisma.masterTimetableSlot.findMany({
      where: {
        dayOfWeek: weekday,
        masterTimetable: {
          status: { in: ['PUBLISHED', 'LOCKED'] },
          ...(targetDepartmentId ? { departmentId: targetDepartmentId } : {}),
        },
      },
      orderBy: [{ periodNumber: 'asc' }, { startTime: 'asc' }],
      include: { masterTimetable: true },
    });

    const scheduledFacultyIds = Array.from(new Set(allDaySlots.map(slot => slot.facultyId)));
    const assignedFacultyIds = targetDepartmentId
      ? (await prisma.subjectAssignment.findMany({
          where: { subject: { departmentId: targetDepartmentId } },
          select: { facultyId: true },
        })).map(row => row.facultyId)
      : [];
    const visibleFacultyIds = Array.from(new Set([...scheduledFacultyIds, ...assignedFacultyIds]));

    const facultyScope = targetDepartmentId ? {
      OR: [
        { departmentId: targetDepartmentId },
        ...(visibleFacultyIds.length ? [{ id: { in: visibleFacultyIds } }] : []),
      ],
    } : {};

    const faculties = await prisma.faculty.findMany({
      where: { status: 'ACTIVE', deleted: false, archived: false, ...facultyScope },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      include: {
        department: { select: { id: true, name: true, code: true } },
        appliedLeaves: {
          where: { status: { in: approvedLeaveStatuses }, startDate: { lte: end }, endDate: { gte: start } },
          orderBy: { createdAt: 'desc' }, take: 1,
        },
        mentorAssignments: { where: { status: 'ACTIVE' }, select: { id: true } },
      },
    });

    const subjectIds = Array.from(new Set(allDaySlots.map(slot => slot.subjectId)));
    const [subjects, departments] = await Promise.all([
      prisma.subject.findMany({
        where: { id: { in: subjectIds } },
        select: { id: true, name: true, code: true, departmentId: true },
      }),
      prisma.department.findMany({
        where: { deleted: false, status: 'ACTIVE' },
        select: { id: true, name: true, code: true }, orderBy: { name: 'asc' },
      }),
    ]);
    const subjectById = new Map(subjects.map(subject => [subject.id, subject]));
    const departmentById = new Map(departments.map(department => [department.id, department]));
    const slotsByFaculty = new Map<string, typeof allDaySlots>();
    allDaySlots.forEach(slot => {
      const slots = slotsByFaculty.get(slot.facultyId) || [];
      slots.push(slot);
      slotsByFaculty.set(slot.facultyId, slots);
    });

    const userIds = faculties.map(faculty => faculty.userId).filter((id): id is string => Boolean(id));
    const activeTasks = userIds.length ? await prisma.taskAssignee.groupBy({
      by: ['assigneeId'],
      where: { assigneeId: { in: userIds }, status: { notIn: ['COMPLETED', 'REJECTED'] } },
      _count: { _all: true },
    }) : [];
    const taskCount = new Map(activeTasks.map(row => [row.assigneeId, row._count._all]));

    const nowMinutes = currentMinutes(date);
    const items = faculties.map(faculty => {
      const timetableSlots = slotsByFaculty.get(faculty.id) || [];
      const selectedSlot = query.period
        ? timetableSlots.find(slot => slot.periodNumber === query.period)
        : timetableSlots.find(slot => toMinutes(slot.startTime) <= nowMinutes && toMinutes(slot.endTime) > nowMinutes);
      const futureSlots = timetableSlots.filter(slot => query.period
        ? slot.periodNumber > query.period!
        : toMinutes(slot.startTime) > nowMinutes);
      const leave = faculty.appliedLeaves[0];
      const status: FacultyAvailabilityStatus = leave
        ? (leave.leaveType === 'ON_DUTY' ? 'ON_DUTY' : 'ON_LEAVE')
        : selectedSlot ? (selectedSlot.isLab ? 'IN_LAB' : 'IN_CLASS')
        : timetableSlots.length ? 'FREE' : 'NO_SCHEDULE';
      const teachingDepartments = new Map<string, { id: string; name: string; code: string }>();
      teachingDepartments.set(faculty.department.id, faculty.department);
      timetableSlots.forEach(slot => {
        const department = departmentById.get(slot.masterTimetable.departmentId);
        if (department) teachingDepartments.set(department.id, department);
      });
      const weeklyTheory = timetableSlots.filter(slot => !slot.isLab).length;
      const weeklyLab = timetableSlots.filter(slot => slot.isLab).length;
      const nextClass = futureSlots[0] || null;
      const homeFaculty = !targetDepartmentId || faculty.departmentId === targetDepartmentId;
      const allocationDepartment = selectedSlot ? departmentById.get(selectedSlot.masterTimetable.departmentId) : null;
      const allocationSubject = selectedSlot ? subjectById.get(selectedSlot.subjectId) : null;
      const nextDepartment = nextClass ? departmentById.get(nextClass.masterTimetable.departmentId) : null;
      const nextSubject = nextClass ? subjectById.get(nextClass.subjectId) : null;

      return {
        id: faculty.id,
        employeeId: faculty.employeeId,
        name: `${faculty.firstName} ${faculty.lastName}`.trim(),
        designation: faculty.designation,
        email: faculty.email,
        homeDepartment: faculty.department,
        teachingDepartments: Array.from(teachingDepartments.values()),
        relationship: homeFaculty ? 'HOME' : 'CROSS_DEPARTMENT',
        status,
        currentAllocation: selectedSlot ? {
          slotId: selectedSlot.id, period: selectedSlot.periodNumber, startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime, department: allocationDepartment, subject: allocationSubject,
          section: { name: selectedSlot.masterTimetable.section, semester: { name: selectedSlot.masterTimetable.semester } },
          room: selectedSlot.roomNo || selectedSlot.labName || null,
          type: selectedSlot.isLab ? 'LAB' : 'CLASS',
        } : null,
        nextClass: nextClass ? {
          period: nextClass.periodNumber, startTime: nextClass.startTime, endTime: nextClass.endTime,
          department: nextDepartment, subject: nextSubject,
          section: { name: nextClass.masterTimetable.section, semester: { name: nextClass.masterTimetable.semester } },
          room: nextClass.roomNo || nextClass.labName || null,
        } : null,
        busyUntil: selectedSlot?.endTime || null,
        nextFreePeriod: selectedSlot ? selectedSlot.periodNumber + 1 : query.period || null,
        workload: {
          scheduledPeriodsToday: timetableSlots.length,
          theoryPeriodsToday: weeklyTheory,
          labPeriodsToday: weeklyLab,
          mentorStudents: faculty.mentorAssignments.length,
          activeTasks: faculty.userId ? taskCount.get(faculty.userId) || 0 : 0,
        },
      };
    }).filter(item => !query.search || `${item.name} ${item.employeeId} ${item.homeDepartment.name} ${item.teachingDepartments.map(d => d.name).join(' ')}`.toLowerCase().includes(query.search.toLowerCase()));

    const periods = Array.from(new Set(allDaySlots.map(slot => slot.periodNumber))).sort((a, b) => a - b);

    return {
      context: { date: date.toISOString(), dayOfWeek: weekday, departmentId: targetDepartmentId || 'ALL', period: query.period || null },
      summary: {
        total: items.length,
        homeFaculty: items.filter(item => item.relationship === 'HOME').length,
        crossDepartment: items.filter(item => item.relationship === 'CROSS_DEPARTMENT').length,
        free: items.filter(item => item.status === 'FREE').length,
        busy: items.filter(item => ['IN_CLASS', 'IN_LAB'].includes(item.status)).length,
        onLeave: items.filter(item => item.status === 'ON_LEAVE').length,
        onDuty: items.filter(item => item.status === 'ON_DUTY').length,
      },
      departments, periods, items,
    };
  }

  async getFacultyDetail(user: UserPayload, facultyId: string, query: FacultyOperationsQuery = {}) {
    const board = await this.getFacultyBoard(user, query);
    const faculty = board.items.find(item => item.id === facultyId);
    if (!faculty) throw new NotFoundException('Faculty is outside the permitted scope or does not exist');
    return faculty;
  }
}

export const facultyOperationsService = new FacultyOperationsService();
