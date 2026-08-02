import { Router } from 'express';
import { HodPortalController } from './hod-portal.controller';
import { StudentLeaveController } from './student-leave.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();
const hodController = new HodPortalController();
const leaveController = new StudentLeaveController();

router.use(requireAuth);

// HOD Dashboard
router.get('/dashboard', hodController.getDashboardSummary);

// HOD Leave & OD Workspace
router.get('/leave-od', leaveController.getHodRequests);
router.get('/leave-od/pending', leaveController.getHodPending);
router.get('/leave-od/:id', leaveController.getRequestDetails);
router.post('/leave-od/:id/approve', leaveController.hodReview);
router.post('/leave-od/:id/reject', leaveController.hodReview);
router.post('/leave-od/:id/return-to-mentor', leaveController.hodReview);
router.post('/leave-od/:id/return-to-student', leaveController.hodReview);
router.post('/leave-od/:id/escalate', leaveController.hodReview);
router.post('/leave-od/bulk-approve', leaveController.bulkApproveHod);
router.post('/leave-od/bulk-reject', leaveController.bulkRejectHod);

// HOD Student Management
router.get('/students', hodController.getDepartmentStudents);
router.post('/students/assign-mentor', hodController.assignMentor);

// HOD Faculty & Mentor Management
router.get('/faculty', hodController.getDepartmentFaculty);
router.get('/mentors', hodController.getDepartmentMentors);

// HOD Attendance Monitoring
router.get('/attendance', hodController.getDepartmentAttendance);

// HOD Task Workspace
router.get('/tasks', hodController.getDepartmentTasks);
router.post('/tasks', hodController.createDepartmentTask);

// HOD Circulars
router.post('/circulars', hodController.createHodCircular);

// HOD Analytics & Reports
router.get('/reports', hodController.exportDepartmentData);

export default router;
