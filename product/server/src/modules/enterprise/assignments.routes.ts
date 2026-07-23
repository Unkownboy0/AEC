import { Router } from 'express';
import { AssignmentController } from './assignments.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new AssignmentController();

router.use(requireAuth);

// Assignment CRUD
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

// Submissions
router.post('/:id/submit', controller.submit);
router.get('/:id/submissions', controller.getSubmissions);
router.put('/submissions/:submissionId/grade', controller.grade);

export default router;
