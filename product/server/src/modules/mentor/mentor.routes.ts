import { Router } from 'express';
import { MentorController } from './mentor.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/dashboard', MentorController.getDashboardStats);
router.get('/students', MentorController.getAssignedStudents);
router.get('/students/:studentId', MentorController.getStudentDetail);
router.get('/leave-od', MentorController.getPendingLeaveOdRequests);
router.post('/leave-od/:requestId/review', MentorController.reviewStudentLeaveOd);
router.post('/students/:studentId/counseling', MentorController.addCounselingNote);

export default router;
