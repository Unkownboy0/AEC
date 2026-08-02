import { Router } from 'express';
import { StudentLeaveController } from './student-leave.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new StudentLeaveController();

router.use(requireAuth);

// Student Endpoints
router.post('/', controller.submitRequest);
router.get('/my-requests', controller.getMyRequests);
router.get('/details/:id', controller.getRequestDetails);
router.get('/:id', controller.getRequestDetails);

// Mentor Endpoints
router.get('/mentor-pending', controller.getMentorPending);
router.post('/:id/mentor-review', controller.mentorReview);
router.post('/:id/approve', controller.mentorReview);
router.post('/:id/reject', controller.mentorReview);
router.post('/:id/return', controller.mentorReview);

// HOD Endpoints
router.get('/hod-requests', controller.getHodRequests);
router.get('/hod-pending', controller.getHodPending);
router.post('/hod/bulk-approve', controller.bulkApproveHod);
router.post('/hod/bulk-reject', controller.bulkRejectHod);
router.post('/:id/hod-review', controller.hodReview);
router.post('/:id/return-to-mentor', controller.hodReview);
router.post('/:id/return-to-student', controller.hodReview);
router.post('/:id/escalate', controller.hodReview);

export default router;
