import { Router } from 'express';
import { FacultyLeaveController } from './faculty-leave.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';
import { requirePermissionGuard } from '../../core/middlewares/rbacGuard.middleware';

const router = Router();
const controller = new FacultyLeaveController();

router.use(requireAuth);

router.post('/', controller.submitRequest);
router.get('/my-requests', controller.getMyRequests);

router.get('/hod-pending', requirePermissionGuard('leave', 'approve'), controller.getHodPending);
router.post('/:id/hod-review', requirePermissionGuard('leave', 'approve'), controller.hodReview);

router.get('/principal-pending', requirePermissionGuard('leave', 'approve'), controller.getPrincipalPending);
router.post('/:id/principal-review', requirePermissionGuard('leave', 'approve'), controller.principalReview);

export default router;
