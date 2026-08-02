import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { AcademicTaskService } from './academic-task.service';
import { AcademicTaskFileService } from './academic-task-file.service';
import { AcademicTaskQueryService } from './academic-task-query.service';
import { prisma } from '../../lib/prisma';

const router = Router();

// Guard all routes with Auth + Academic Dean authority
router.use(requireAuth);
router.use(requireRole(['Academic Dean', 'Super Admin', 'College Admin', 'Principal']));

/**
 * GET /api/academic-dean/dashboard - Executive Dashboard KPIs
 */
router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await AcademicTaskService.getExecutiveDashboardStats();
    res.status(200).json({ status: 'success', data: stats });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/academic-dean/tasks - List tasks (paginated, filtered)
 */
router.get('/tasks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AcademicTaskService.getTasksForDean(req.query as any);
    res.status(200).json({ status: 'success', ...result });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/academic-dean/tasks - Create task (draft or publish)
 */
router.post('/tasks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deanUserId = (req as any).user.id;
    const result = await AcademicTaskService.createTask(deanUserId, req.body);
    res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/academic-dean/tasks/:taskId - Task detail
 */
router.get('/tasks/:taskId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await AcademicTaskService.getTaskDetail(req.params.taskId);
    res.status(200).json({ status: 'success', data: task });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/academic-dean/tasks/:taskId/publish - Publish task
 */
router.post('/tasks/:taskId/publish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deanUserId = (req as any).user.id;
    const result = await AcademicTaskService.publishTask(req.params.taskId, deanUserId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/academic-dean/task-assignments/:assignmentId/review - Review submission
 */
router.post('/task-assignments/:assignmentId/review', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deanUserId = (req as any).user.id;
    const result = await AcademicTaskService.reviewSubmission(req.params.assignmentId, req.body, deanUserId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/academic-dean/tasks/:taskId/extend-due-date - Extend due date
 */
router.post('/tasks/:taskId/extend-due-date', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deanUserId = (req as any).user.id;
    const result = await AcademicTaskService.extendDueDate(req.params.taskId, req.body, deanUserId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/academic-dean/tasks/:taskId/files - Upload reference file
 */
router.post('/tasks/:taskId/files', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deanUserId = (req as any).user.id;
    const file = await AcademicTaskFileService.registerFile(deanUserId, {
      ...req.body,
      taskId: req.params.taskId,
      fileScope: 'REFERENCE',
    });
    res.status(201).json({ status: 'success', data: file });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/academic-dean/task-files/:fileId/download - Download file
 */
router.get('/task-files/:fileId/download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const file = await AcademicTaskFileService.authorizeDownload(req.params.fileId, userId);
    res.status(200).json({ status: 'success', data: file });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/academic-dean/task-assignments/:assignmentId/queries - Post Dean Query Reply
 */
router.post('/task-assignments/:assignmentId/queries', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deanUserId = (req as any).user.id;
    const query = await AcademicTaskQueryService.postQuery(deanUserId, {
      ...req.body,
      assignmentId: req.params.assignmentId,
    });
    res.status(201).json({ status: 'success', data: query });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/academic-dean/departments - List active departments with HOD status
 */
router.get('/departments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const depts = await prisma.department.findMany({
      where: { status: 'ACTIVE', deleted: false },
      select: {
        id: true,
        name: true,
        code: true,
        hodName: true,
        hodId: true,
        color: true,
        _count: { select: { students: true, faculties: true } },
      },
    });

    const enriched = await Promise.all(
      depts.map(async (d) => {
        const hodUser = await prisma.user.findFirst({
          where: { departmentId: d.id, role: { name: 'HOD' }, status: 'ACTIVE' },
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        });

        const activeTaskCount = await (prisma as any).academicTaskAssignment.count({
          where: { departmentId: d.id, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
        });

        return { ...d, hodUser, activeTaskCount };
      })
    );

    res.status(200).json({ status: 'success', data: enriched });
  } catch (error) {
    next(error);
  }
});

export default router;
