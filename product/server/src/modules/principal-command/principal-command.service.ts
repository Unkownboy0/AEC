import { prisma } from '../../lib/prisma';
import { ManagementService } from '../management/management.service';

const management = new ManagementService();
const percentage = (part: number, whole: number) => whole ? Number(((part / whole) * 100).toFixed(1)) : 0;

export class PrincipalCommandService {
  async dashboard(periodDays: number, departmentId?: string) {
    const start = new Date(); start.setDate(start.getDate() - periodDays);
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const departmentFilter = departmentId ? { departmentId } : {};
    const executive = await management.dashboard(
      { periodDays, departmentId },
      { id: 'PRINCIPAL_DASHBOARD', email: '', role: 'Principal', permissions: ['reports:read', 'reports:export'], canDrillDown: true, canExport: true },
    );

    const [
      todayAttendance, pendingApprovals, delegatedPending, taskSummary, recentTasks, circulars,
      studentLeave, facultyLeave, hostels, transportRoutes, transportedStudents,
    ] = await Promise.all([
      prisma.attendance.findMany({ where: { deleted: false, date: { gte: todayStart, lte: todayEnd }, ...(departmentId ? { OR: [{ student: { departmentId } }, { faculty: { departmentId } }] } : {}) }, select: { status: true, studentId: true, facultyId: true } }),
      (prisma as any).approvalAssignment.count({ where: { status: 'PENDING', assignedRole: 'PRINCIPAL', ...departmentFilter } }),
      (prisma as any).approvalAssignment.count({ where: { status: 'PENDING', assignedRole: 'ACTING_PRINCIPAL', ...departmentFilter } }),
      prisma.task.groupBy({ by: ['status'], where: { ...(departmentId ? { departmentId } : {}) }, _count: { _all: true } }),
      prisma.task.findMany({ where: { status: { notIn: ['COMPLETED', 'REJECTED'] }, ...(departmentId ? { departmentId } : {}) }, select: { id: true, taskNumber: true, title: true, priority: true, status: true, dueDate: true, completionPercent: true, department: { select: { name: true, code: true } } }, orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }], take: 6 }),
      prisma.institutionalCircular.findMany({ where: { status: 'PUBLISHED', ...(departmentId ? { OR: [{ departmentId }, { departmentId: null }] } : {}) }, select: { id: true, circularNumber: true, title: true, broadcastLevel: true, publishedAt: true }, orderBy: { publishedAt: 'desc' }, take: 5 }),
      prisma.studentLeaveRequest.groupBy({ by: ['status'], where: { createdAt: { gte: start }, ...(departmentId ? { departmentId } : {}) }, _count: { _all: true } }),
      prisma.facultyLeaveRequest.groupBy({ by: ['status'], where: { createdAt: { gte: start }, ...(departmentId ? { departmentId } : {}) }, _count: { _all: true } }),
      prisma.hostelBuilding.findMany({ where: { deleted: false, archived: false }, select: { id: true, name: true, type: true, rooms: true, _count: { select: { students: true } } } }),
      prisma.transportRoute.count({ where: { deleted: false, archived: false } }),
      prisma.student.count({ where: { deleted: false, transportRouteId: { not: null }, ...(departmentId ? { departmentId } : {}) } }),
    ]);

    const byStatus = (rows: Array<{ status: string; _count: { _all: number } }>) => Object.fromEntries(rows.map((row) => [row.status, row._count._all]));
    const studentAttendance = todayAttendance.filter((row) => row.studentId);
    const facultyAttendance = todayAttendance.filter((row) => row.facultyId);
    const present = (rows: typeof todayAttendance) => rows.filter((row) => ['PRESENT', 'LATE'].includes(row.status)).length;
    const parseCapacity = (rooms: string) => {
      try { return (JSON.parse(rooms) as any[]).reduce((total, room) => total + Number(room.capacity || room.beds || 0), 0); } catch { return 0; }
    };
    const hostelCapacity = hostels.reduce((total, hostel) => total + parseCapacity(hostel.rooms), 0);
    const hostelResidents = hostels.reduce((total, hostel) => total + hostel._count.students, 0);
    const taskCounts = byStatus(taskSummary as any);
    const overdueTasks = recentTasks.filter((task) => task.dueDate && task.dueDate < new Date()).length;
    const alertItems = [
      ...(executive.alerts.majorGrievances ? [{ severity: 'CRITICAL', label: `${executive.alerts.majorGrievances} major grievance(s) require review`, route: '/principal/complaints' }] : []),
      ...(overdueTasks ? [{ severity: 'HIGH', label: `${overdueTasks} priority task(s) are overdue`, route: '/principal/tasks' }] : []),
      ...(executive.finance.outstanding ? [{ severity: 'MEDIUM', label: `${executive.finance.collectionRate}% fee collection; outstanding action remains`, route: '/principal/reports' }] : []),
      ...(!executive.accreditation.available ? [{ severity: 'INFO', label: 'IQAC progress source is unavailable in this deployment', route: '/principal/reports' }] : []),
    ];

    return {
      ...executive,
      attendanceToday: {
        students: { recorded: studentAttendance.length, present: present(studentAttendance), rate: percentage(present(studentAttendance), studentAttendance.length) },
        faculty: { recorded: facultyAttendance.length, present: present(facultyAttendance), rate: percentage(present(facultyAttendance), facultyAttendance.length) },
      },
      approvals: { pendingPrincipal: pendingApprovals, delegatedPending, total: pendingApprovals + delegatedPending },
      tasks: { counts: taskCounts, overdue: overdueTasks, active: recentTasks },
      circulars,
      leaveOd: { students: byStatus(studentLeave as any), faculty: byStatus(facultyLeave as any) },
      hostel: { buildings: hostels.length, residents: hostelResidents, recordedCapacity: hostelCapacity, occupancyRate: percentage(hostelResidents, hostelCapacity) },
      transport: { activeRoutes: transportRoutes, assignedStudents: transportedStudents },
      bottlenecks: [
        { label: 'Principal approval queue', count: pendingApprovals, route: '/principal/approval-center' },
        { label: 'Delegated approval queue', count: delegatedPending, route: '/principal/approval-center' },
        { label: 'Waiting task approval', count: taskCounts.WAITING_APPROVAL || 0, route: '/principal/tasks' },
        { label: 'Open grievances', count: executive.alerts.openGrievances, route: '/principal/complaints' },
      ].sort((a, b) => b.count - a.count),
      institutionalAlerts: alertItems,
    };
  }

  async hierarchy(departmentId?: string) {
    const departments = await prisma.department.findMany({
      where: { deleted: false, archived: false, ...(departmentId ? { id: departmentId } : {}) },
      select: {
        id: true, code: true, name: true,
        programs: { where: { deleted: false, archived: false }, select: { id: true, code: true, name: true, level: true, semesters: { where: { deleted: false, archived: false }, select: { id: true, number: true, name: true, sections: { where: { deleted: false, archived: false }, select: { id: true, name: true, _count: { select: { students: true } } } } } } } },
        _count: { select: { students: true, faculties: true } },
      }, orderBy: { name: 'asc' },
    });
    return departments.map((department) => ({
      ...department,
      programs: department.programs.map((program) => ({
        ...program,
        semesters: program.semesters.map((semester) => ({
          ...semester,
          year: Math.ceil(semester.number / 2),
        })),
      })),
    }));
  }
}
