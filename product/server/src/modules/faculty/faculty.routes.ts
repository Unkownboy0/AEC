import { Router } from 'express';
import { FacultyDashboardController } from './faculty.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/faculty/dashboard', FacultyDashboardController.getDashboardData);

export default router;
