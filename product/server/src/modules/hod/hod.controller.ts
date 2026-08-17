import { Response } from 'express';
import { AuthenticatedHodRequest } from './hod.middleware';
import { HodService } from './hod.service';
import { HodRepository } from './hod.repository';
import { prisma } from '../../lib/prisma';
import { CircularService } from '../circulars/circular.service';
import { CreateCircularSchema } from '../circulars/circular.validation';

export class HodController {
  private service = new HodService();
  private repo = new HodRepository();

  getDashboardSummary = async (req: AuthenticatedHodRequest, res: Response) => {
    try {
      const deptId = req.hodContext?.departmentId!;
      const summary = await this.service.getDashboardSummary(deptId);
      return res.json({
        success: true,
        data: {
          summaryCards: summary,
          department: {
            id: req.hodContext?.departmentId,
            name: req.hodContext?.departmentName,
            code: req.hodContext?.departmentCode,
          },
          widgets: { recentRequests: summary?.recentActivities || [] },
        },
      });
    } catch (error: any) {
      console.error('[HOD Dashboard Error]:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  };

  getLeaveOdRequests = async (req: AuthenticatedHodRequest, res: Response) => {
    try {
      const deptId = req.hodContext?.departmentId!;
      const result = await this.service.getLeaveOdRequests(deptId, req.query as any);
      return res.json({ success: true, ...result });
    } catch (error: any) {
      console.error('[HOD Leave/OD List Error]:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  };

  getLeaveOdRequestDetails = async (req: AuthenticatedHodRequest, res: Response) => {
    try {
      const deptId = req.hodContext?.departmentId!;
      const { id } = req.params;
      const details = await this.repo.getLeaveOdRequestById(id, deptId);
      if (!details) {
        return res.status(404).json({ success: false, error: 'Request not found' });
      }
      return res.json({ success: true, data: details });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  };

  reviewLeaveOdRequest = async (req: AuthenticatedHodRequest, res: Response) => {
    try {
      const deptId = req.hodContext?.departmentId!;
      const userId = req.hodContext?.userId!;
      const { id } = req.params;
      const { action, remarks, rejectionReason, escalatedToRole } = req.body;

      const updated = await this.service.reviewLeaveOdRequest(deptId, userId, {
        requestId: id,
        action,
        remarks,
        rejectionReason,
        escalatedToRole,
      });

      const actionPastTense: Record<string, string> = {
        APPROVE: 'approved',
        REJECT: 'rejected',
        RETURN_TO_MENTOR: 'returned to mentor',
        RETURN_TO_STUDENT: 'returned to student',
        ESCALATE: 'escalated',
      };
      const actionLabel = actionPastTense[(action || '').toUpperCase()] || `${(action || '').toLowerCase()}d`;
      return res.json({ success: true, message: `Request ${actionLabel} successfully`, data: updated });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  };

  bulkReviewLeaveOd = async (req: AuthenticatedHodRequest, res: Response) => {
    try {
      const deptId = req.hodContext?.departmentId!;
      const userId = req.hodContext?.userId!;
      const { requestIds, action, remarks } = req.body;

      if (!Array.isArray(requestIds) || requestIds.length === 0) {
        return res.status(400).json({ success: false, error: 'requestIds array is required.' });
      }

      const result = await this.service.bulkReviewLeaveOd(deptId, userId, requestIds, action, remarks);
      return res.json({ success: true, message: `Bulk ${action.toLowerCase()} completed`, data: result });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  };

  getDepartmentStudents = async (req: AuthenticatedHodRequest, res: Response) => {
    try {
      const deptId = req.hodContext?.departmentId!;
      const result = await this.repo.getDepartmentStudents(deptId, req.query);
      return res.json({ success: true, data: result });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  };

  assignMentor = async (req: AuthenticatedHodRequest, res: Response) => {
    try {
      const deptId = req.hodContext?.departmentId!;
      const { studentId, mentorFacultyId, studentIds } = req.body;

      if (studentIds && Array.isArray(studentIds)) {
        const resObj = await this.service.bulkAssignMentor(deptId, studentIds, mentorFacultyId);
        return res.json({ success: true, message: 'Mentors assigned successfully', data: resObj });
      }

      const resObj = await this.service.assignMentorToStudent(deptId, studentId, mentorFacultyId);
      return res.json({ success: true, message: 'Mentor assigned successfully', data: resObj });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  };

  getDepartmentFaculty = async (req: AuthenticatedHodRequest, res: Response) => {
    try {
      const deptId = req.hodContext?.departmentId!;
      const faculty = await this.repo.getDepartmentFaculty(deptId, req.query);
      return res.json({ success: true, data: faculty });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  };

  assignSubject = async (req: AuthenticatedHodRequest, res: Response) => {
    try {
      const deptId = req.hodContext?.departmentId!;
      const assignment = await this.service.assignSubjectToFaculty(deptId, req.body);
      return res.json({ success: true, message: 'Subject assigned successfully', data: assignment });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  };

  getDepartmentAttendance = async (req: AuthenticatedHodRequest, res: Response) => {
    try {
      const deptId = req.hodContext?.departmentId!;
      const attendance = (prisma as any).attendanceRecord ? await (prisma as any).attendanceRecord.findMany({
        where: { student: { departmentId: deptId } },
        take: 50,
        orderBy: { date: 'desc' },
      }) : [];
      return res.json({ success: true, data: attendance });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  };

  getTasks = async (req: AuthenticatedHodRequest, res: Response) => {
    try {
      const deptId = req.hodContext?.departmentId!;
      const tasks = await prisma.task.findMany({
        where: { departmentId: deptId },
        orderBy: { createdAt: 'desc' },
        include: { createdBy: true, assignees: { include: { assignee: true } } },
      });
      return res.json({ success: true, data: tasks });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  };

  createTask = async (req: AuthenticatedHodRequest, res: Response) => {
    try {
      const deptId = req.hodContext?.departmentId!;
      const userId = req.hodContext?.userId!;
      const task = await this.service.createDepartmentTask(deptId, userId, req.body);
      return res.json({ success: true, message: 'Task created successfully', data: task });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  };

  listCirculars = async (req: AuthenticatedHodRequest, res: Response) => {
    try {
      const deptId = req.hodContext?.departmentId!;
      const userId = req.hodContext?.userId!;
      const circulars = await CircularService.listCirculars(userId, 'HOD', deptId);
      return res.json({ success: true, data: circulars });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  };

  getCircularById = async (req: AuthenticatedHodRequest, res: Response) => {
    try {
      const userId = req.hodContext?.userId!;
      const { id } = req.params;
      const circular = await CircularService.getCircularById(id, userId);
      if (!circular) return res.status(404).json({ success: false, error: 'Circular not found' });
      return res.json({ success: true, data: circular });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  };

  createCircular = async (req: AuthenticatedHodRequest, res: Response) => {
    try {
      // Department ALWAYS from server session or database fallback — NEVER trusted from client body
      const deptId = req.hodContext?.departmentId;
      const userId = req.hodContext?.userId!;

      const parseResult = CreateCircularSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        });
      }

      const result = await CircularService.createAndPublishCircular(
        userId,
        'HOD',
        deptId,
        parseResult.data
      );
      return res.json({
        success: true,
        message: 'Circular published successfully',
        circular: result.circular,
        recipients: result.recipients,
        notifications: result.notifications,
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  };

  publishCircular = async (req: AuthenticatedHodRequest, res: Response) => {
    try {
      const userId = req.hodContext?.userId!;
      const { id } = req.params;
      const circular = await CircularService.publishCircular(id, userId);
      return res.json({ success: true, data: circular });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  };

  exportReports = async (req: AuthenticatedHodRequest, res: Response) => {
    try {
      const deptId = req.hodContext?.departmentId!;
      const { type } = req.query;

      let csvData = 'ID,Name,Department\n';
      if (type === 'STUDENTS') {
        const students = await prisma.student.findMany({
          where: { departmentId: deptId },
          include: { user: true },
        });
        csvData += students.map((s: any) => `${s.registerNumber},"${s.user.firstName} ${s.user.lastName}",${req.hodContext?.departmentName}`).join('\n');
      } else if (type === 'FACULTY') {
        const faculty = await prisma.faculty.findMany({ where: { departmentId: deptId, deleted: false } });
        csvData += faculty.map((item) => `${item.employeeId},"${item.firstName} ${item.lastName}",${req.hodContext?.departmentName}`).join('\n');
      } else return res.status(400).json({ success: false, error: 'Supported report types are STUDENTS and FACULTY.' });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=hod_${type || 'report'}.csv`);
      return res.send(csvData);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  };

  getProfile = async (req: AuthenticatedHodRequest, res: Response) => {
    try {
      const userId = req.hodContext?.userId!;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { faculty: true },
      });
      return res.json({
        success: true,
        data: {
          ...user,
          activeDepartment: {
            id: req.hodContext?.departmentId,
            name: req.hodContext?.departmentName,
            code: req.hodContext?.departmentCode,
          },
          assignedDepartments: req.hodContext?.departments,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  };
}
