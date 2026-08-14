import { Router } from 'express';
import { StudentLeaveController } from './student-leave.controller';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new StudentLeaveController();

router.use(requireAuth);

// This router disambiguates HOD vs Mentor review purely by URL prefix
// (req.baseUrl.includes('/hod')), never by the caller's actual role — a
// Student hitting the same handler via a URL containing "/hod" would be
// treated as performing an HOD-level review with no verification at all.
const leaveReviewGuard = requireRole(['HOD', 'Mentor', 'Faculty', 'Super Admin', 'College Admin']);

// Root Endpoint (Handles GET /api/hod/leave-od?status=...)
router.get('/', (req, res, next) => {
  if (req.query.status || req.baseUrl.includes('/hod')) {
    return controller.getHodRequests(req, res, next);
  }
  return controller.getMyRequests(req, res, next);
});

// Student Endpoints
router.post('/', controller.submitRequest);
router.get('/my-requests', controller.getMyRequests);
router.get('/timetable-slots', controller.getTimetableForDate);
router.get('/details/:id', controller.getRequestDetails);

// HOD Specific Endpoints
router.get('/hod-requests', controller.getHodRequests);
router.get('/hod-pending', controller.getHodPending);
router.post('/bulk-approve', leaveReviewGuard, controller.bulkApproveHod);
router.post('/bulk-reject', leaveReviewGuard, controller.bulkRejectHod);
router.post('/hod/bulk-approve', leaveReviewGuard, controller.bulkApproveHod);
router.post('/hod/bulk-reject', leaveReviewGuard, controller.bulkRejectHod);

// Mentor Endpoints
router.get('/mentor-pending', controller.getMentorPending);

// Parameterized Action Endpoints (Disambiguating HOD vs Mentor context)
router.post('/:id/return-to-mentor', leaveReviewGuard, controller.hodReview);
router.post('/:id/return-to-student', leaveReviewGuard, controller.hodReview);
router.post('/:id/escalate', leaveReviewGuard, controller.hodReview);

router.post('/:id/:action', leaveReviewGuard, (req, res, next) => {
  if (req.baseUrl.includes('/hod')) {
    return controller.hodReview(req, res, next);
  }
  return controller.mentorReview(req, res, next);
});

router.post('/:id', leaveReviewGuard, (req, res, next) => {
  if (req.baseUrl.includes('/hod')) {
    return controller.hodReview(req, res, next);
  }
  return controller.mentorReview(req, res, next);
});

router.get('/:id', controller.getRequestDetails);

export default router;
