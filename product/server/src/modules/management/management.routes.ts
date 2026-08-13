import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { ManagementController } from './management.controller';

const router = Router();
const controller = new ManagementController();
router.use(requireAuth, requireRole(['Management', 'Governing Body', 'Super Admin', 'College Admin']));
router.get('/dashboard', controller.dashboard);
router.get('/export', controller.export);
export default router;
