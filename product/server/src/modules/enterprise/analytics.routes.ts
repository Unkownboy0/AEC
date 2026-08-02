import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';
import { requirePermissionGuard } from '../../core/middlewares/rbacGuard.middleware';

const router = Router();
const controller = new AnalyticsController();

router.use(requireAuth);

router.get('/dashboard', requirePermissionGuard('reports', 'view'), controller.getDashboard);
router.post('/reports/builder/run', requirePermissionGuard('reports', 'view'), controller.runCustomReport);
router.post('/reports/save', requirePermissionGuard('reports', 'create'), controller.saveReport);
router.get('/reports/saved', requirePermissionGuard('reports', 'view'), controller.getSavedReports);

export default router;
