import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { prisma } from '../../lib/prisma';

const openStatuses = ['OPEN', 'PENDING', 'IN_PROGRESS', 'UNDER_INVESTIGATION', 'ESCALATED'];
const adminCategories = ['HOSTEL', 'ADMINISTRATION', 'ADMIN', 'STUDENT_SERVICE', 'DOCUMENT', 'ADMISSION'];
const documentStats = (documents: string) => {
  try {
    const rows = JSON.parse(documents || '[]');
    return Array.isArray(rows) ? rows.reduce((stats, row) => { const key = String(row.status || 'PENDING').toUpperCase(); stats[key] = (stats[key] || 0) + 1; return stats; }, {} as Record<string, number>) : {};
  } catch { return {}; }
};
const slaHours = (priority: string) => ({ CRITICAL: 4, URGENT: 8, HIGH: 24, MEDIUM: 48, LOW: 72 }[priority] || 48);

export class AdministrationDeanService {
  async dashboard(userId: string, periodDays: number) {
    const since = new Date(); since.setDate(since.getDate() - periodDays);
    const hostelPolicy = await prisma.systemSetting.findUnique({ where: { key: 'HOSTEL_ADMINISTRATION_DEAN_OVERSIGHT' }, select: { value: true } });
    const hostelOversightEnabled = ['true', 'enabled', '1', 'yes'].includes(String(hostelPolicy?.value || '').toLowerCase());
    const allowedComplaintCategories = hostelOversightEnabled ? adminCategories : adminCategories.filter((category) => category !== 'HOSTEL');
    const [applications, students, complaints, tasks, coordination, hostels, user, serviceRequests] = await Promise.all([
      prisma.admissionApplication.findMany({ include: { department: { select: { id: true, code: true, name: true } }, program: { select: { id: true, code: true, name: true } } }, orderBy: { createdAt: 'desc' } }),
      prisma.student.findMany({ where: { deleted: false }, select: { id: true, admissionNo: true, firstName: true, lastName: true, status: true, createdAt: true, department: { select: { code: true, name: true } }, program: { select: { code: true, name: true } }, hostelBuilding: { select: { name: true } }, userId: true } }),
      prisma.ticket.findMany({ where: { deleted: false, category: { in: allowedComplaintCategories } }, select: { id: true, title: true, status: true, priority: true, category: true, createdAt: true, updatedAt: true, resolutionRemarks: true, assignedTo: { select: { id: true, firstName: true, lastName: true } }, student: { select: { admissionNo: true, firstName: true, lastName: true } } }, orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }], take: 20 }),
      prisma.task.findMany({ where: { OR: [{ createdById: userId }, { assignees: { some: { assigneeId: userId } } }], status: { notIn: ['COMPLETED', 'REJECTED'] } }, select: { id: true, taskNumber: true, title: true, priority: true, status: true, dueDate: true, completionPercent: true }, orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }], take: 8 }),
      prisma.admissionCoordinationRequest.findMany({ where: { createdById: userId }, select: { id: true, requestCode: true, title: true, status: true, priority: true, dueAt: true, department: { select: { code: true, name: true } }, assignedHod: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' }, take: 8 }),
      hostelOversightEnabled ? prisma.hostelBuilding.findMany({ where: { deleted: false, archived: false }, select: { id: true, name: true, type: true, rooms: true, _count: { select: { students: true } } } }) : Promise.resolve([]),
      prisma.user.findUnique({ where: { id: userId }, select: { faculty: { select: { id: true, employeeId: true, designation: true, department: { select: { id: true, code: true, name: true, hodAssignments: { where: { isActive: true }, select: { hodUser: { select: { id: true, firstName: true, lastName: true } } }, take: 1 } } } } }, userWorkspaces: { where: { status: 'ACTIVE' }, select: { roleName: true, workspaceCode: true } }, assignedRoles: { select: { role: { select: { name: true } } } } } }),
      prisma.workflowRequest.findMany({ where: { studentId: { not: null }, type: { in: ['BONAFIDE', 'TC', 'CONDUCT_CERTIFICATE', 'HOSTEL_LEAVE', 'BUS_PASS', 'SCHOLARSHIP'] }, createdAt: { gte: since } }, select: { id: true, type: true, title: true, status: true, currentStep: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);

    const applicationCounts = Object.fromEntries(Object.entries(applications.reduce((counts, app) => ({ ...counts, [app.status]: (counts[app.status] || 0) + 1 }), {} as Record<string, number>)));
    const docs = applications.reduce((all, app) => { const stats = documentStats(app.documents); Object.entries(stats).forEach(([key, count]) => all[key] = (all[key] || 0) + Number(count)); return all; }, {} as Record<string, number>);
    const now = Date.now();
    const complaintRows = complaints.map((complaint) => {
      const hours = slaHours(complaint.priority);
      const dueAt = new Date(complaint.createdAt.getTime() + hours * 3_600_000);
      return { ...complaint, owner: complaint.assignedTo ? `${complaint.assignedTo.firstName} ${complaint.assignedTo.lastName}`.trim() : 'Unassigned', slaHours: hours, dueAt, slaStatus: openStatuses.includes(complaint.status) && dueAt.getTime() < now ? 'BREACHED' : openStatuses.includes(complaint.status) && dueAt.getTime() - now < 7_200_000 ? 'AT_RISK' : 'ON_TRACK' };
    });
    const confirmedApplicationIds = new Set(applications.filter((app) => app.status === 'CONFIRMED').map((app) => app.id));
    const recentStudents = students.filter((student) => student.createdAt >= since);
    const capacity = hostels.reduce((total, hostel) => { try { return total + JSON.parse(hostel.rooms || '[]').reduce((sum: number, room: any) => sum + Number(room.capacity || room.beds || 0), 0); } catch { return total; } }, 0);
    const residents = hostels.reduce((total, hostel) => total + hostel._count.students, 0);
    const facultyWorkspace = Boolean(user?.faculty && ([...user.userWorkspaces.map((workspace) => workspace.roleName), ...user.assignedRoles.map((assignment) => assignment.role.name)].some((role) => role === 'Faculty')));

    return {
      generatedAt: new Date().toISOString(), periodDays,
      admission: { total: applications.length, counts: applicationCounts, confirmationRate: applications.length ? Number(((applicationCounts.CONFIRMED || 0) / applications.length * 100).toFixed(1)) : 0, recent: applications.filter((app) => app.createdAt >= since).length },
      onboarding: { confirmedApplications: confirmedApplicationIds.size, recentStudentProfiles: recentStudents.length, activeStudents: students.filter((student) => student.status === 'ACTIVE').length, unlinkedAccounts: students.filter((student) => !student.userId).length },
      documents: { pending: docs.PENDING || 0, approved: docs.APPROVED || 0, rejected: (docs.REJECTED || 0) + (docs.REUPLOAD_REQUESTED || 0) },
      complaints: { open: complaintRows.filter((row) => openStatuses.includes(row.status)).length, breached: complaintRows.filter((row) => row.slaStatus === 'BREACHED').length, important: complaintRows.filter((row) => ['HIGH', 'URGENT', 'CRITICAL'].includes(row.priority) || row.slaStatus !== 'ON_TRACK').slice(0, 8) },
      tasks: { active: tasks, overdue: tasks.filter((task) => task.dueDate && task.dueDate.getTime() < now).length },
      coordination: { active: coordination.filter((item) => !['APPROVED', 'CLOSED', 'REJECTED'].includes(item.status)).length, recent: coordination },
      hostel: { enabled: hostelOversightEnabled, buildings: hostels.length, residents, capacity, occupancyRate: capacity ? Number((residents / capacity * 100).toFixed(1)) : 0 },
      services: { active: serviceRequests.filter((request) => !['APPROVED', 'REJECTED', 'CLOSED'].includes(request.status)).length, recent: serviceRequests },
      studentRecords: students.slice(0, 8),
      facultyWorkspace: facultyWorkspace && user?.faculty ? { available: true, employeeId: user.faculty.employeeId, designation: user.faculty.designation, department: user.faculty.department, hod: user.faculty.department.hodAssignments[0]?.hodUser || null } : { available: false },
      authorities: { administration: true, admission: true, studentMaster: true, hostelOversight: hostelOversightEnabled, grievanceCategories: allowedComplaintCategories, faculty: facultyWorkspace, iqac: false, coe: false },
    };
  }

  async export(userId: string, format: 'PDF' | 'EXCEL') {
    const data = await this.dashboard(userId, 30);
    if (format === 'EXCEL') {
      const workbook = new ExcelJS.Workbook();
      const summary = workbook.addWorksheet('Administration summary');
      summary.addRows([['Administration Dean report', data.generatedAt], ['Applications', data.admission.total], ['Confirmed', data.admission.counts.CONFIRMED || 0], ['Pending documents', data.documents.pending], ['Open complaints', data.complaints.open], ['SLA breached', data.complaints.breached], ['Active students', data.onboarding.activeStudents]]);
      const complaints = workbook.addWorksheet('Complaints');
      complaints.columns = [{ header: 'Title', key: 'title', width: 35 }, { header: 'Category', key: 'category', width: 18 }, { header: 'Priority', key: 'priority', width: 14 }, { header: 'Status', key: 'status', width: 20 }, { header: 'Owner', key: 'owner', width: 24 }, { header: 'SLA', key: 'slaStatus', width: 14 }];
      complaints.addRows(data.complaints.important);
      return { buffer: Buffer.from(await workbook.xlsx.writeBuffer()), mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: `Administration_Dean_Report_${new Date().toISOString().slice(0, 10)}.xlsx` };
    }
    const doc = new PDFDocument({ margin: 48 }); const stream = new PassThrough(); const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk))); doc.pipe(stream);
    doc.fontSize(20).text('Administration Dean Report').fontSize(9).fillColor('#64748b').text(`Generated ${new Date(data.generatedAt).toLocaleString('en-IN')}`).moveDown();
    doc.fillColor('#111827').fontSize(12).text(`Applications: ${data.admission.total}  |  Confirmed: ${data.admission.counts.CONFIRMED || 0}  |  Pending documents: ${data.documents.pending}`);
    doc.moveDown().text(`Active students: ${data.onboarding.activeStudents}  |  Open complaints: ${data.complaints.open}  |  SLA breached: ${data.complaints.breached}`);
    doc.moveDown().fontSize(14).text('Important administrative complaints'); data.complaints.important.forEach((item: any) => doc.fontSize(9).text(`${item.priority} · ${item.title} · ${item.status} · ${item.owner} · ${item.slaStatus}`));
    doc.end(); await new Promise<void>((resolve, reject) => { stream.on('end', resolve); stream.on('error', reject); });
    return { buffer: Buffer.concat(chunks), mime: 'application/pdf', filename: `Administration_Dean_Report_${new Date().toISOString().slice(0, 10)}.pdf` };
  }
}
