import { Router } from 'express';
import { AssignmentController } from './assignments.controller';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new AssignmentController();

router.use(requireAuth);

// update/delete/grade had zero role or ownership check at all — any Student
// could edit/delete any assignment, or grade any submission with arbitrary
// marks. `create` already checks internally; these three did not.
const assignmentStaffGuard = requireRole(['Faculty', 'HOD', 'Academic Dean', 'Principal', 'Vice Principal', 'Super Admin', 'College Admin']);

// Assignment CRUD
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.put('/:id', assignmentStaffGuard, controller.update);
router.delete('/:id', assignmentStaffGuard, controller.delete);

// Submissions
router.post('/:id/submit', controller.submit);
router.get('/:id/submissions', controller.getSubmissions);
router.put('/submissions/:submissionId/grade', assignmentStaffGuard, controller.grade);

export default router;
