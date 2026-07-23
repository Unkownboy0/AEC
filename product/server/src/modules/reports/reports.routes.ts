import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { requireAuth, requirePermission } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new ReportsController();

router.get('/admissions', requireAuth, requirePermission('reports:read'), controller.getAdmissions);
router.get('/revenue', requireAuth, requirePermission('reports:read'), controller.getRevenue);
router.get('/system', requireAuth, requirePermission('reports:read'), controller.getSystem);
router.get('/export', requireAuth, requirePermission('reports:read'), controller.exportReport);

export default router;
