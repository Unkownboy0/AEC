import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { BadRequestException, NotFoundException } from '../../utils/exceptions';
import { NotificationService } from '../notifications/notification.service';

export class VPController {
  getAnalytics = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const now = new Date();
      const [totalStudents, totalFaculty, totalMentors, totalHODs, departments, activeClasses, attendance, assignments, placements, internships, pendingComplaints, leaveRequestsPending, facultyLeavePending, circularsIssued] = await Promise.all([
        prisma.student.count({ where: { status: 'ACTIVE', deleted: false } }),
        prisma.faculty.count({ where: { status: 'ACTIVE', deleted: false } }),
        prisma.faculty.count({ where: { mentorAssignments: { some: { status: 'ACTIVE' } }, status: 'ACTIVE', deleted: false } }),
        prisma.departmentHodAssignment.count({ where: { isActive: true } }),
        prisma.department.count({ where: { archived: false, deleted: false, status: 'ACTIVE' } }),
        prisma.timetableSlot.count(),
        prisma.attendance.groupBy({ by: ['status'], where: { deleted: false }, _count: { status: true } }),
        prisma.assignment.groupBy({ by: ['status'], where: { deleted: false }, _count: { status: true } }),
        prisma.placementApplication.groupBy({ by: ['status'], _count: { status: true } }),
        prisma.internship.groupBy({ by: ['status'], _count: { status: true } }),
        prisma.ticket.count({ where: { deleted: false, status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
        prisma.studentLeaveRequest.count({ where: { status: { notIn: ['APPROVED', 'CANCELLED', 'EXPIRED'] } } }),
        prisma.facultyLeaveRequest.count({ where: { status: { startsWith: 'PENDING' } } }),
        prisma.institutionalCircular.count({ where: { status: 'PUBLISHED' } }),
      ]);
      const attendanceTotal = attendance.reduce((sum, item) => sum + item._count.status, 0);
      const attendancePresent = attendance.filter((item) => item.status === 'PRESENT').reduce((sum, item) => sum + item._count.status, 0);
      const assignmentTotal = assignments.reduce((sum, item) => sum + item._count.status, 0);
      const assignmentComplete = assignments.filter((item) => item.status === 'PUBLISHED' || item.status === 'COMPLETED').reduce((sum, item) => sum + item._count.status, 0);
      const placementTotal = placements.reduce((sum, item) => sum + item._count.status, 0);
      const placementComplete = placements.filter((item) => ['OFFERED', 'SELECTED', 'PLACED'].includes(item.status)).reduce((sum, item) => sum + item._count.status, 0);
      const internshipTotal = internships.reduce((sum, item) => sum + item._count.status, 0);
      const internshipComplete = internships.filter((item) => item.status === 'COMPLETED').reduce((sum, item) => sum + item._count.status, 0);
      res.status(200).json({
        status: 'success',
        data: { kpis: {
          totalStudents, totalFaculty, totalMentors, totalHODs, departments, activeClasses,
          attendancePercentage: attendanceTotal ? Number(((attendancePresent / attendanceTotal) * 100).toFixed(1)) : null,
          assignmentCompletion: assignmentTotal ? Number(((assignmentComplete / assignmentTotal) * 100).toFixed(1)) : null,
          internalAssessmentStatus: null,
          examinationStatus: null,
          placementProgress: placementTotal ? Number(((placementComplete / placementTotal) * 100).toFixed(1)) : null,
          internshipProgress: internshipTotal ? Number(((internshipComplete / internshipTotal) * 100).toFixed(1)) : null,
          campusActivities: null,
          pendingComplaints, leaveRequestsPending, facultyLeavePending, circularsIssued,
          academicCalendarProgress: null, todaysEvents: null, upcomingEvents: null,
          generatedAt: now.toISOString(),
        } },
      });
    } catch (error) { next(error); }
  };

  getDepartments = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const departments = await prisma.department.findMany({
        where: { archived: false, deleted: false, status: 'ACTIVE' },
        orderBy: { code: 'asc' },
        include: {
          _count: { select: { students: true, faculties: true, MentorAssignment: true } },
          hodAssignments: { where: { isActive: true }, take: 1, include: { hodUser: { select: { firstName: true, lastName: true } } } },
        },
      });
      const data = await Promise.all(departments.map(async (department) => {
        const [attendance, marks, placements, internships, complaints] = await Promise.all([
          prisma.attendance.groupBy({ by: ['status'], where: { deleted: false, student: { departmentId: department.id } }, _count: { status: true } }),
          prisma.mark.groupBy({ by: ['grade'], where: { deleted: false, status: 'PUBLISHED', student: { departmentId: department.id } }, _count: { grade: true } }),
          prisma.placementApplication.groupBy({ by: ['status'], where: { student: { departmentId: department.id } }, _count: { status: true } }),
          prisma.internship.groupBy({ by: ['status'], where: { student: { departmentId: department.id } }, _count: { status: true } }),
          prisma.ticket.count({ where: { deleted: false, status: { notIn: ['RESOLVED', 'CLOSED'] }, OR: [{ student: { departmentId: department.id } }, { faculty: { departmentId: department.id } }] } }),
        ]);
        const attendanceTotal = attendance.reduce((sum, item) => sum + item._count.status, 0);
        const marksTotal = marks.reduce((sum, item) => sum + item._count.grade, 0);
        const placementTotal = placements.reduce((sum, item) => sum + item._count.status, 0);
        const internshipTotal = internships.reduce((sum, item) => sum + item._count.status, 0);
        return {
          id: department.id, code: department.code, name: department.name,
          students: department._count.students, faculty: department._count.faculties, mentors: department._count.MentorAssignment,
          hod: department.hodAssignments[0] ? `${department.hodAssignments[0].hodUser.firstName} ${department.hodAssignments[0].hodUser.lastName}` : null,
          attendance: attendanceTotal ? Number((attendance.filter((item) => item.status === 'PRESENT').reduce((sum, item) => sum + item._count.status, 0) / attendanceTotal * 100).toFixed(1)) : null,
          pass: marksTotal ? Number((marks.filter((item) => !['F', 'RA'].includes(item.grade || '')).reduce((sum, item) => sum + item._count.grade, 0) / marksTotal * 100).toFixed(1)) : null,
          placement: placementTotal ? Number((placements.filter((item) => ['OFFERED', 'SELECTED', 'PLACED'].includes(item.status)).reduce((sum, item) => sum + item._count.status, 0) / placementTotal * 100).toFixed(1)) : null,
          internship: internshipTotal ? Number((internships.filter((item) => item.status === 'COMPLETED').reduce((sum, item) => sum + item._count.status, 0) / internshipTotal * 100).toFixed(1)) : null,
          complaints, activities: null, performanceIndex: null,
        };
      }));
      res.status(200).json({ status: 'success', data: { departments: data } });
    } catch (error) { next(error); }
  };

  getFeed = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const [studentLeaves, facultyLeaves, tickets] = await Promise.all([
        prisma.studentLeaveRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 20, include: { student: { include: { department: { select: { name: true, code: true } } } } } }),
        prisma.facultyLeaveRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 20, include: { faculty: true, department: { select: { name: true, code: true } } } }),
        prisma.ticket.findMany({
          where: { deleted: false },
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            student: { include: { department: { select: { name: true, code: true } } } },
            faculty: { include: { department: { select: { name: true, code: true } } } },
          },
        }),
      ]);
      const leaves = [
        ...studentLeaves.map((leave) => ({ id: leave.id, applicantName: `${leave.student.firstName} ${leave.student.lastName}`, role: 'Student', department: leave.student.department?.code || leave.student.department?.name || null, type: leave.type, startDate: leave.startDate, endDate: leave.endDate, reason: leave.reason, status: leave.status })),
        ...facultyLeaves.map((leave) => ({ id: leave.id, applicantName: `${leave.faculty.firstName} ${leave.faculty.lastName}`, role: 'Faculty', department: leave.department.code || leave.department.name, type: leave.leaveType, startDate: leave.startDate, endDate: leave.endDate, reason: leave.reason, status: leave.status })),
      ].sort((a, b) => b.startDate.getTime() - a.startDate.getTime()).slice(0, 20);
      const complaints = tickets.map((ticket) => ({ id: ticket.id, title: ticket.title, category: ticket.category, department: ticket.student?.department?.code || ticket.faculty?.department?.code || null, priority: ticket.priority, status: ticket.status, submittedBy: ticket.student ? `${ticket.student.firstName} ${ticket.student.lastName}` : ticket.faculty ? `${ticket.faculty.firstName} ${ticket.faculty.lastName}` : 'Anonymous' }));
      res.status(200).json({ status: 'success', data: { leaves, complaints } });
    } catch (error) { next(error); }
  };

  escalate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { issueId, internalRemark } = req.body;
      const user = (req as any).user;
      if (!issueId || !String(internalRemark || '').trim()) throw new BadRequestException('Issue and escalation remarks are required');
      const ticket = await prisma.ticket.findUnique({ where: { id: String(issueId) } });
      if (!ticket) throw new NotFoundException('Complaint not found');
      let replies: any[] = [];
      try { replies = JSON.parse(ticket.replies || '[]'); } catch { replies = []; }
      replies.push({ id: `VP-${Date.now()}`, authorId: user.id, authorRole: 'Vice Principal', content: String(internalRemark).trim(), isEscalation: true, createdAt: new Date().toISOString() });
      await prisma.ticket.update({ where: { id: ticket.id }, data: { status: 'ESCALATED', priority: 'HIGH', replies: JSON.stringify(replies) } });
      const principals = await prisma.user.findMany({ where: { status: 'ACTIVE', role: { name: 'Principal' } }, select: { id: true } });
      await Promise.all(principals.map((principal) => NotificationService.sendNotification({ recipientId: principal.id, eventType: 'COMPLAINT_ESCALATED', title: 'Complaint escalated by Vice Principal', message: ticket.title, relatedEntityType: 'TICKET', relatedEntityId: ticket.id, deepLinkRoute: `/complaints/${ticket.id}` })));
      await prisma.userActivityLog.create({ data: { userId: user.id, action: 'UPDATE', module: 'COMPLAINT', description: `Vice Principal escalated complaint ${ticket.id}: ${String(internalRemark).trim()}`, ipAddress: req.ip || req.socket.remoteAddress, userAgent: req.headers['user-agent'] } });
      res.status(200).json({ status: 'success', message: 'Complaint escalated to the Principal queue.' });
    } catch (error) { next(error); }
  };

  recordAudit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { action, description } = req.body;
      const userId = (req as any).user?.id;
      if (userId) await prisma.userActivityLog.create({ data: { userId, action: action === 'EXPORT' ? 'EXPORT' : action === 'PRINT' ? 'PRINT' : 'VIEW', module: 'ACADEMICS', description: `Vice Principal Operations Oversight: ${description || 'VP Operations Center accessed.'}`, ipAddress: req.ip || req.socket.remoteAddress, userAgent: req.headers['user-agent'] } });
      res.status(200).json({ status: 'success', message: 'VP audit recorded.' });
    } catch (error) { logger.error('Failed to log VP audit:', error); next(error); }
  };
}
