import { Router } from 'express';
import { FacultyController } from './faculty.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/dashboard', FacultyController.getDashboard);
router.get('/subjects', FacultyController.getSubjects);
router.get('/timetable', FacultyController.getTimetable);

export default router;
