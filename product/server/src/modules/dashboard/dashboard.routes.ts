import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new DashboardController();

router.get('/stats', requireAuth, controller.getStats);
router.get('/charts', requireAuth, controller.getCharts);

export default router;
