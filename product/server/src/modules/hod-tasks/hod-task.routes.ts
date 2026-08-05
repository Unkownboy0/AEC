import { Router } from 'express';
import { HodTaskController } from './hod-task.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/hod/tasks', HodTaskController.getHodTaskDashboard);
router.get('/hod/tasks/:id', HodTaskController.getTaskById);
router.post('/hod/tasks/:id/acknowledge', HodTaskController.acknowledgeTask);
router.post('/hod/tasks/:id/start', HodTaskController.startTask);
router.post('/hod/tasks/:id/progress', HodTaskController.updateProgress);
router.post('/hod/tasks/:id/query', HodTaskController.raiseQuery);
router.post('/hod/tasks/:id/submit', HodTaskController.submitTask);

export default router;
