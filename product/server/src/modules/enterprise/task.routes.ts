import { Router } from 'express';
import { TaskController } from './task.controller';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { enforceDepartmentScope } from '../../core/middlewares/departmentScope';

const router = Router();

router.use(requireAuth);

const taskAuthorRoles = ['Super Admin', 'College Admin', 'Principal', 'Vice Principal', 'Academic Dean', 'Admission Dean', 'IQAC Dean', 'HOD', 'Faculty', 'Mentor'];

router.post('/', requireRole(taskAuthorRoles), TaskController.createTask);
router.get('/', enforceDepartmentScope as any, TaskController.getTasks);
router.get('/kanban', TaskController.getKanbanBoard);
router.get('/analytics/workload', requireRole(taskAuthorRoles), enforceDepartmentScope as any, TaskController.getWorkloadAnalytics);
router.get('/templates', TaskController.getTemplates);
router.post('/templates', requireRole(taskAuthorRoles), TaskController.createTemplate);
router.get('/:taskId', TaskController.getTaskById);
router.patch('/:taskId/status', TaskController.updateTaskStatus);
router.patch('/:taskId/checklist', TaskController.updateChecklist);
router.patch('/:taskId/progress', TaskController.updateProgress);
router.post('/:taskId/accept', (req, res, next) => {
  req.body.status = 'ACCEPTED';
  TaskController.updateTaskStatus(req, res, next);
});
router.post('/:taskId/reject', (req, res, next) => {
  req.body.status = 'REJECTED';
  TaskController.updateTaskStatus(req, res, next);
});
router.post('/:taskId/complete', (req, res, next) => {
  req.body.status = 'COMPLETED';
  TaskController.updateTaskStatus(req, res, next);
});
router.post('/:taskId/comments', TaskController.addComment);

export default router;
