import { prisma } from '../../lib/prisma';
import { ManagementService } from '../management/management.service';
import { PrincipalAvailabilityResolver } from '../principal-availability/availability.resolver';

const management = new ManagementService();
const percentage = (part: number, whole: number) => whole ? Number(((part / whole) * 100).toFixed(1)) : 0;

export class VpCommandService {
  async dashboard(userId: string, periodDays: number, departmentId?: string) {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const executive = await management.dashboard(
      { periodDays, departmentId },
      { id: userId, email: '', role: 'Vice Principal', permissions: ['reports:read'], canDrillDown: true, canExport: false },
    );
    const delegationContext = await PrincipalAvailabilityResolver.resolveContext();
    const acting = Boolean(
      delegationContext.delegationStatus === 'ACTIVE' &&
      delegationContext.canVpActAsPrincipal &&
      delegationContext.actingPrincipal?.userId === userId &&
      delegationContext.delegation,
    );

    const [attendance, normalApprovals, taskAssignments, recentTasks, circulars, departments] = await Promise.all([
      prisma.attendance.findMany({
        where: { deleted: false, date: { gte: todayStart, lte: todayEnd }, ...(departmentId ? { OR: [{ student: { departmentId } }, { faculty: { departmentId } }] } : {}) },
        select: { status: true, studentId: true, facultyId: true },
      }),
      (prisma as any).approvalAssignment.findMany({
        where: { assignedUserId: userId, status: 'PENDING', assignedRole: { in: ['VP', 'VICE_PRINCIPAL'] }, delegationId: null, ...(departmentId ? { departmentId } : {}) },
        select: { id: true, requestId: true, requestType: true, title: true, applicantName: true, departmentName: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' }, take: 6,
      }),
      prisma.taskAssignee.findMany({ where: { assigneeId: userId }, select: { taskId: true, status: true } }),
      prisma.task.findMany({
        where: { OR: [{ createdById: userId }, { assignees: { some: { assigneeId: userId } } }], status: { notIn: ['COMPLETED', 'REJECTED'] }, ...(departmentId ? { departmentId } : {}) },
        select: { id: true, taskNumber: true, title: true, priority: true, status: true, dueDate: true, completionPercent: true, department: { select: { name: true, code: true } } },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }], take: 6,
      }),
      prisma.institutionalCircular.findMany({ where: { status: 'PUBLISHED', ...(departmentId ? { OR: [{ departmentId }, { departmentId: null }] } : {}) }, select: { id: true, circularNumber: true, title: true, broadcastLevel: true, publishedAt: true }, orderBy: { publishedAt: 'desc' }, take: 5 }),
      prisma.department.findMany({ where: { deleted: false, archived: false, ...(departmentId ? { id: departmentId } : {}) }, select: { id: true, code: true, name: true, _count: { select: { students: true, faculties: true } } }, orderBy: { name: 'asc' } }),
    ]);

    const studentRows = attendance.filter((row) => row.studentId);
    const facultyRows = attendance.filter((row) => row.facultyId);
    const present = (rows: typeof attendance) => rows.filter((row) => ['PRESENT', 'LATE'].includes(row.status)).length;
    const overdue = recentTasks.filter((task) => task.dueDate && task.dueDate < new Date()).length;
    const alerts = [
      ...(normalApprovals.length ? [{ severity: 'HIGH', label: `${normalApprovals.length} VP approval(s) await action`, route: '/vp/leave-approvals' }] : []),
      ...(overdue ? [{ severity: 'HIGH', label: `${overdue} assigned task(s) are overdue`, route: '/vp/tasks' }] : []),
      ...(executive.alerts.majorGrievances ? [{ severity: 'CRITICAL', label: `${executive.alerts.majorGrievances} major grievance(s) require monitoring`, route: '/vp/complaints' }] : []),
    ];

    return {
      generatedAt: new Date().toISOString(), period: executive.period, scope: executive.scope,
      overview: executive.overview, comparisons: executive.comparisons, departments: executive.departments,
      academic: { averageGpa: executive.comparisons.academicGpa.current, attendanceTrend: executive.trends.attendance },
      placements: executive.placements,
      attendanceToday: {
        students: { recorded: studentRows.length, present: present(studentRows), rate: percentage(present(studentRows), studentRows.length) },
        faculty: { recorded: facultyRows.length, present: present(facultyRows), rate: percentage(present(facultyRows), facultyRows.length) },
      },
      approvals: { pending: normalApprovals.length, recent: normalApprovals },
      tasks: { assigned: taskAssignments.length, active: recentTasks, overdue },
      circulars,
      availability: { departments: departments.map((department) => ({ id: department.id, code: department.code, name: department.name, students: department._count.students, faculty: department._count.faculties })) },
      alerts,
      delegatedPrincipal: acting ? {
        active: true,
        label: 'Acting on behalf of Principal',
        delegationId: delegationContext.delegation!.id,
        startsAt: delegationContext.delegation!.startsAt,
        endsAt: delegationContext.delegation!.endsAt,
        categories: delegationContext.delegation!.delegatedCategories,
        permissions: delegationContext.delegation!.permissions,
        scope: delegationContext.delegation!.scope,
        financialThreshold: delegationContext.delegation!.financialThreshold,
        pending: delegationContext.pendingActingRequests || 0,
        permissionVersion: delegationContext.permissionVersion,
      } : { active: false },
      sources: ['Management projection', 'Attendance', 'Approval assignments', 'Tasks', 'Circulars', 'Principal delegation resolver'],
    };
  }
}
