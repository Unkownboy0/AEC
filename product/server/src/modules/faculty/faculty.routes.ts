import { Router } from 'express';
import { FacultyController } from './faculty.controller';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { TeachingGroupController } from './teaching-group.controller';

const router = Router();
router.use(requireAuth);

router.get('/dashboard', FacultyController.getDashboard);
router.get('/subjects', FacultyController.getSubjects);
router.get('/timetable', FacultyController.getTimetable);
router.get('/attendance/sessions/today', FacultyController.getTodayAttendanceSessions);
router.get('/attendance/sessions/:slotId', FacultyController.getAttendanceSession);
router.post('/attendance/sessions/:slotId/submit', FacultyController.submitAttendanceSession);
router.get('/teaching-groups', requireRole(['Faculty', 'Mentor', 'HOD', 'Academic Dean', 'Principal', 'Super Admin']), TeachingGroupController.list);
router.post('/teaching-groups', requireRole(['Faculty', 'HOD', 'Academic Dean', 'Principal', 'Super Admin']), TeachingGroupController.create);
router.get('/teaching-groups/:id/students', requireRole(['Faculty', 'Mentor', 'HOD', 'Academic Dean', 'Principal', 'Super Admin']), TeachingGroupController.students);

export default router;
