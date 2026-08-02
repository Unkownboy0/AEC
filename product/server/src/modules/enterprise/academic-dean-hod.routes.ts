import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { AcademicTaskHodService } from './academic-task-hod.service';
import { AcademicTaskFileService } from './academic-task-file.service';
import { AcademicTaskQueryService } from './academic-task-query.service';

const router = Router();

// Guard all HOD Academic Task routes with Auth + HOD role
router.use(requireAuth);
router.use(requireRole(['HOD', 'Academic Dean', 'Super Admin']));

/**
 * GET /api/hod/academic-tasks - List assigned tasks for HOD
 */
router.get('/academic-tasks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hodUserId = (req as any).user.id;
    const result = await AcademicTaskHodService.getAssignedTasks(hodUserId, req.query as any);
    res.status(200).json({ status: 'success', ...result });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/hod/academic-tasks/:assignmentId - Get single assignment details
 */
router.get('/academic-tasks/:assignmentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hodUserId = (req as any).user.id;
    const assignment = await AcademicTaskHodService.getAssignmentDetail(req.params.assignmentId, hodUserId);
    res.status(200).json({ status: 'success', data: assignment });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/hod/academic-tasks/:assignmentId/start - Mark task in-progress
 */
router.post('/academic-tasks/:assignmentId/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hodUserId = (req as any).user.id;
    const result = await AcademicTaskHodService.startTask(req.params.assignmentId, hodUserId);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/hod/academic-tasks/:assignmentId/save-draft - Save draft submission
 */
router.post('/academic-tasks/:assignmentId/save-draft', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hodUserId = (req as any).user.id;
    const result = await AcademicTaskHodService.saveDraft(req.params.assignmentId, req.body, hodUserId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/hod/academic-tasks/:assignmentId/submit - Final task submission
 */
router.post('/academic-tasks/:assignmentId/submit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hodUserId = (req as any).user.id;
    const result = await AcademicTaskHodService.submitTask(req.params.assignmentId, req.body, hodUserId);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/hod/academic-tasks/:assignmentId/queries - Post HOD query
 */
router.post('/academic-tasks/:assignmentId/queries', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hodUserId = (req as any).user.id;
    const query = await AcademicTaskQueryService.postQuery(hodUserId, {
      ...req.body,
      assignmentId: req.params.assignmentId,
    });
    res.status(201).json({ status: 'success', data: query });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/hod/academic-tasks/:assignmentId/files - Upload HOD submission file
 */
router.post('/academic-tasks/:assignmentId/files', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hodUserId = (req as any).user.id;
    const file = await AcademicTaskFileService.registerFile(hodUserId, {
      ...req.body,
      assignmentId: req.params.assignmentId,
      fileScope: req.body.fileScope || 'HOD_SUBMISSION',
    });
    res.status(201).json({ status: 'success', data: file });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/hod/academic-task-files/:fileId/download - Secure file download
 */
router.get('/academic-task-files/:fileId/download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hodUserId = (req as any).user.id;
    const file = await AcademicTaskFileService.authorizeDownload(req.params.fileId, hodUserId);
    res.status(200).json({ status: 'success', data: file });
  } catch (error) {
    next(error);
  }
});

export default router;
