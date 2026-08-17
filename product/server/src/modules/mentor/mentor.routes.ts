import { Router } from 'express';
import { MentorController } from './mentor.controller';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['Mentor', 'Faculty', 'HOD', 'Super Admin', 'College Admin', 'Academic Dean', 'Administration Dean']));

// Dashboard & Assigned Students
router.get('/dashboard', MentorController.getDashboardStats);
router.get('/students', MentorController.getAssignedStudents);
router.get('/students/:studentId', MentorController.getStudentDetail);
router.get('/attendance', MentorController.getAttendance);
router.get('/academics', MentorController.getAcademics);

// Counseling & Notes
router.get('/counselling', MentorController.getCounseling);
router.post('/counselling', MentorController.createCounseling);
router.post('/students/:studentId/counseling', MentorController.addCounselingNote);

// Leave & OD Review
router.get('/leave-od', MentorController.getPendingLeaveOdRequests);
router.get('/leave-od/pending', MentorController.getPendingLeaveOdRequests);
router.get('/leave-od/:requestId', MentorController.getLeaveRequestDetail);
router.post('/leave-od/:requestId/review', MentorController.reviewStudentLeaveOd);

// Residential & Transport Management for Mentee
router.get('/students/:studentId/residential', MentorController.getResidentialStatus);
router.patch('/students/:studentId/residential', MentorController.updateResidentialStatus);

// Fees & Services Management for Mentee
router.get('/students/:studentId/fees', MentorController.getStudentFees);
router.post('/students/:studentId/fees', MentorController.assessFee);
router.patch('/students/:studentId/fees/:billId', MentorController.updateFeeBill);

export default router;
