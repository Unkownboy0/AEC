import { Router } from 'express';
import { MentorController } from './mentor.controller';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['Mentor', 'Faculty', 'HOD', 'Super Admin', 'College Admin']));

router.get('/dashboard', MentorController.getDashboardStats);
router.get('/students', MentorController.getAssignedStudents);
router.get('/students/:studentId', MentorController.getStudentDetail);
router.get('/attendance', MentorController.getAttendance);
router.get('/academics', MentorController.getAcademics);
router.get('/counselling', MentorController.getCounseling);
router.post('/counselling', MentorController.createCounseling);
router.get('/leave-od', MentorController.getPendingLeaveOdRequests);
router.post('/leave-od/:requestId/review', MentorController.reviewStudentLeaveOd);
router.post('/students/:studentId/counseling', MentorController.addCounselingNote);

export default router;
