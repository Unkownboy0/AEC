import { prisma } from '../../lib/prisma';
import { ManagementQuery, ManagementViewer } from './management.types';

type CacheValue = { expiresAt: number; value: any };
const dashboardCache = new Map<string, CacheValue>();
const percentage = (part: number, whole: number) => whole ? Number(((part / whole) * 100).toFixed(1)) : 0;
const delta = (current: number, previous: number) => previous ? Number((((current - previous) / previous) * 100).toFixed(1)) : current ? 100 : 0;
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const safeJsonCount = (value?: string | null) => {
  if (!value) return 0;
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.length : 0; } catch { return 0; }
};

export class ManagementService {
  private dateRange(periodDays: number) {
    const end = new Date();
    const start = new Date(end); start.setDate(start.getDate() - periodDays);
    const previousStart = new Date(start); previousStart.setDate(previousStart.getDate() - periodDays);
    return { end, start, previousStart };
  }

  async dashboard(query: ManagementQuery, viewer: ManagementViewer) {
    const cacheKey = `${query.periodDays}:${query.departmentId || 'ALL'}:${viewer.canDrillDown}`;
    const cached = dashboardCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return { ...cached.value, cache: { hit: true, ttlSeconds: Math.ceil((cached.expiresAt - Date.now()) / 1000) } };

    const { start, end, previousStart } = this.dateRange(query.periodDays);
    const studentWhere: any = { deleted: false, ...(query.departmentId ? { departmentId: query.departmentId } : {}) };
    const facultyWhere: any = { deleted: false, ...(query.departmentId ? { departmentId: query.departmentId } : {}) };
    const attendanceWhere: any = {
      deleted: false, date: { gte: previousStart, lte: end },
      ...(query.departmentId ? { OR: [{ student: { departmentId: query.departmentId } }, { faculty: { departmentId: query.departmentId } }] } : {}),
    };
    const markWhere: any = { deleted: false, status: 'PUBLISHED', createdAt: { gte: previousStart, lte: end }, ...(query.departmentId ? { student: { departmentId: query.departmentId } } : {}) };
    // Keep the finance position cumulative so historic unpaid bills are never hidden.
    // Period comparison below selects current/previous bill cohorts from this authoritative ledger.
    const feeWhere: any = { deleted: false, ...(query.departmentId ? { student: { departmentId: query.departmentId } } : {}) };
    const admissionWhere: any = { createdAt: { gte: previousStart, lte: end }, ...(query.departmentId ? { departmentId: query.departmentId } : {}) };
    const ticketWhere: any = { deleted: false, ...(query.departmentId ? { OR: [{ student: { departmentId: query.departmentId } }, { faculty: { departmentId: query.departmentId } }] } : {}) };

    const [
      departments, students, faculty, staffCount, attendance, marks, feeBills, admissions,
      placements, tickets, openWorkflows,
    ] = await Promise.all([
      prisma.department.findMany({ where: { deleted: false, archived: false, ...(query.departmentId ? { id: query.departmentId } : {}) }, select: { id: true, code: true, name: true } }),
      prisma.student.findMany({ where: studentWhere, select: { id: true, admissionNo: true, departmentId: true, status: true, createdAt: true } }),
      prisma.faculty.findMany({ where: facultyWhere, select: { id: true, departmentId: true, status: true, publications: true, patents: true, books: true, additionalCertifications: true } }),
      prisma.user.count({ where: { status: 'ACTIVE', role: { name: { notIn: ['Student', 'Parent', 'Faculty'] } }, ...(query.departmentId ? { departmentId: query.departmentId } : {}) } }),
      prisma.attendance.findMany({ where: attendanceWhere, select: { date: true, status: true, student: { select: { departmentId: true } }, faculty: { select: { departmentId: true } } } }),
      prisma.mark.findMany({ where: markWhere, select: { gpa: true, grade: true, createdAt: true, student: { select: { departmentId: true } } } }),
      prisma.feeBill.findMany({ where: feeWhere, select: { amount: true, fine: true, scholarshipDiscount: true, paidAmount: true, status: true, createdAt: true, student: { select: { departmentId: true } } } }),
      prisma.admissionApplication.findMany({ where: admissionWhere, select: { departmentId: true, status: true, createdAt: true } }),
      prisma.placementRecord.findMany({ where: { driveDate: { gte: previousStart, lte: end } }, select: { studentRoll: true, company: true, package: true, status: true, driveDate: true } }),
      prisma.ticket.findMany({ where: ticketWhere, select: { id: true, title: true, priority: true, status: true, createdAt: true, student: { select: { departmentId: true } }, faculty: { select: { departmentId: true } } }, orderBy: { createdAt: 'desc' } }),
      prisma.workflowRequest.count({ where: { status: { startsWith: 'PENDING' }, ...(query.departmentId ? { departmentId: query.departmentId } : {}) } }),
    ]);

    const rollDepartment = new Map(students.map((student) => [student.admissionNo.toUpperCase(), student.departmentId]));
    const scopedPlacements = placements.filter((record) => !query.departmentId || rollDepartment.get(record.studentRoll.toUpperCase()) === query.departmentId);
    const inCurrent = (date: Date) => date >= start;
    const currentAttendance = attendance.filter((item) => inCurrent(item.date));
    const previousAttendance = attendance.filter((item) => !inCurrent(item.date));
    const attendanceRate = (items: typeof attendance) => percentage(items.filter((item) => ['PRESENT', 'LATE'].includes(item.status)).length, items.length);
    const currentMarks = marks.filter((item) => inCurrent(item.createdAt));
    const previousMarks = marks.filter((item) => !inCurrent(item.createdAt));
    const averageGpa = (items: typeof marks) => items.length ? Number((sum(items.map((item) => item.gpa)) / items.length).toFixed(2)) : 0;
    const currentAdmissions = admissions.filter((item) => inCurrent(item.createdAt));
    const previousAdmissions = admissions.filter((item) => !inCurrent(item.createdAt));
    const currentPlacements = scopedPlacements.filter((item) => inCurrent(item.driveDate));
    const previousPlacements = scopedPlacements.filter((item) => !inCurrent(item.driveDate));
    const selected = (items: typeof placements) => items.filter((item) => ['SELECTED', 'PLACED'].includes(item.status));

    const departmentRows = departments.map((department) => {
      const departmentStudents = students.filter((item) => item.departmentId === department.id && item.status === 'ACTIVE');
      const departmentFaculty = faculty.filter((item) => item.departmentId === department.id && item.status === 'ACTIVE');
      const departmentAttendance = currentAttendance.filter((item) => (item.student?.departmentId || item.faculty?.departmentId) === department.id);
      const departmentMarks = currentMarks.filter((item) => item.student.departmentId === department.id);
      const departmentBills = feeBills.filter((item) => item.student.departmentId === department.id);
      const departmentPlacements = selected(currentPlacements.filter((item) => rollDepartment.get(item.studentRoll.toUpperCase()) === department.id));
      const payable = sum(departmentBills.map((item) => item.amount + item.fine - item.scholarshipDiscount));
      return {
        id: department.id, code: department.code, name: department.name,
        students: departmentStudents.length, faculty: departmentFaculty.length,
        attendanceRate: attendanceRate(departmentAttendance), averageGpa: averageGpa(departmentMarks),
        feeCollectionRate: percentage(sum(departmentBills.map((item) => item.paidAmount)), payable),
        placements: departmentPlacements.length,
      };
    });

    const totalPayable = sum(feeBills.map((item) => item.amount + item.fine - item.scholarshipDiscount));
    const totalPaid = sum(feeBills.map((item) => item.paidAmount));
    const weeklyAttendance = Array.from({ length: Math.min(8, Math.ceil(query.periodDays / 7)) }, (_, index) => {
      const weekStart = new Date(start); weekStart.setDate(weekStart.getDate() + index * 7);
      const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
      const rows = currentAttendance.filter((item) => item.date >= weekStart && item.date < weekEnd);
      return { label: weekStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), value: attendanceRate(rows) };
    });

    let accreditation: any = { available: false, message: 'IQAC schema is not available in this deployment.' };
    try {
      const [total, closed, openObservations] = await Promise.all([
        prisma.iqacAudit.count(), prisma.iqacAudit.count({ where: { status: { in: ['VERIFIED', 'CLOSED'] } } }), prisma.iqacObservation.count(),
      ]);
      accreditation = { available: true, totalAudits: total, verifiedOrClosed: closed, progress: percentage(closed, total), observations: openObservations };
    } catch { /* Deployment baseline may not include IQAC tables yet. */ }

    const currentFeeBills = feeBills.filter((item) => inCurrent(item.createdAt));
    const previousFeeBills = feeBills.filter((item) => !inCurrent(item.createdAt));
    const value = {
      generatedAt: new Date().toISOString(), period: { days: query.periodDays, start, end, comparisonStart: previousStart },
      scope: { departmentId: query.departmentId || null, level: query.departmentId ? 'DEPARTMENT' : 'INSTITUTION' },
      permissions: { canDrillDown: viewer.canDrillDown, canExport: viewer.canExport },
      overview: { activeStudents: students.filter((item) => item.status === 'ACTIVE').length, activeFaculty: faculty.filter((item) => item.status === 'ACTIVE').length, activeStaff: staffCount, activeDepartments: departments.length },
      comparisons: {
        attendance: { current: attendanceRate(currentAttendance), previous: attendanceRate(previousAttendance), delta: Number((attendanceRate(currentAttendance) - attendanceRate(previousAttendance)).toFixed(1)) },
        academicGpa: { current: averageGpa(currentMarks), previous: averageGpa(previousMarks), delta: Number((averageGpa(currentMarks) - averageGpa(previousMarks)).toFixed(2)) },
        admissions: { current: currentAdmissions.length, previous: previousAdmissions.length, delta: delta(currentAdmissions.length, previousAdmissions.length) },
        feeDemand: { current: sum(currentFeeBills.map((item) => item.amount)), previous: sum(previousFeeBills.map((item) => item.amount)), delta: delta(sum(currentFeeBills.map((item) => item.amount)), sum(previousFeeBills.map((item) => item.amount))) },
        placements: { current: selected(currentPlacements).length, previous: selected(previousPlacements).length, delta: delta(selected(currentPlacements).length, selected(previousPlacements).length) },
      },
      finance: { payable: totalPayable, collected: totalPaid, outstanding: Math.max(0, totalPayable - totalPaid), collectionRate: percentage(totalPaid, totalPayable) },
      admissions: { applications: currentAdmissions.length, confirmed: currentAdmissions.filter((item) => ['APPROVED', 'CONFIRMED'].includes(item.status)).length, conversionRate: percentage(currentAdmissions.filter((item) => ['APPROVED', 'CONFIRMED'].includes(item.status)).length, currentAdmissions.length) },
      placements: { placed: selected(currentPlacements).length, companies: new Set(currentPlacements.map((item) => item.company)).size, averagePackage: selected(currentPlacements).length ? Number((sum(selected(currentPlacements).map((item) => item.package)) / selected(currentPlacements).length).toFixed(2)) : 0 },
      research: { publications: sum(faculty.map((item) => safeJsonCount(item.publications))), patents: sum(faculty.map((item) => safeJsonCount(item.patents))), books: sum(faculty.map((item) => safeJsonCount(item.books))) },
      staffDevelopment: { certificationsRecorded: sum(faculty.map((item) => safeJsonCount(item.additionalCertifications))), source: 'Faculty profiles' },
      accreditation,
      alerts: { majorGrievances: tickets.filter((item) => !['RESOLVED', 'CLOSED'].includes(item.status) && ['HIGH', 'URGENT', 'CRITICAL'].includes(item.priority)).length, openGrievances: tickets.filter((item) => !['RESOLVED', 'CLOSED'].includes(item.status)).length, pendingWorkflows: openWorkflows, overdueFeeBills: feeBills.filter((item) => item.status !== 'PAID').length },
      trends: { attendance: weeklyAttendance },
      departments: viewer.canDrillDown ? departmentRows : departmentRows.map(({ id, code, name, students, faculty }) => ({ id, code, name, students, faculty })),
      majorGrievances: viewer.canDrillDown ? tickets.filter((item) => !['RESOLVED', 'CLOSED'].includes(item.status) && ['HIGH', 'URGENT', 'CRITICAL'].includes(item.priority)).slice(0, 5).map((item) => ({ id: item.id, title: item.title, priority: item.priority, status: item.status, createdAt: item.createdAt })) : [],
      sources: ['Students', 'Faculty/HR profiles', 'Attendance', 'Published marks', 'Fee bills', 'Admissions', 'Placements', 'Tickets', 'Workflows', 'IQAC'],
    };
    dashboardCache.set(cacheKey, { value, expiresAt: Date.now() + 60_000 });
    return { ...value, cache: { hit: false, ttlSeconds: 60 } };
  }

  async audit(actorId: string, action: string, description: string, context: { ip?: string; userAgent?: string; query: ManagementQuery }) {
    await prisma.auditLog.create({ data: { actorId, action, entityType: 'MANAGEMENT_REPORT', description, newValues: JSON.stringify(context.query), ipAddress: context.ip, userAgent: context.userAgent } });
  }
}
