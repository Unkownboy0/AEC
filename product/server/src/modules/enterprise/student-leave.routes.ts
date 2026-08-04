import { Router } from 'express';
import { StudentLeaveController } from './student-leave.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new StudentLeaveController();

router.use(requireAuth);

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
router.get('/details/:id', controller.getRequestDetails);

// HOD Specific Endpoints
router.get('/hod-requests', controller.getHodRequests);
router.get('/hod-pending', controller.getHodPending);
router.post('/bulk-approve', controller.bulkApproveHod);
router.post('/bulk-reject', controller.bulkRejectHod);
router.post('/hod/bulk-approve', controller.bulkApproveHod);
router.post('/hod/bulk-reject', controller.bulkRejectHod);

// Mentor Endpoints
router.get('/mentor-pending', controller.getMentorPending);

// Parameterized Action Endpoints (Disambiguating HOD vs Mentor context)
router.post('/:id/return-to-mentor', controller.hodReview);
router.post('/:id/return-to-student', controller.hodReview);
router.post('/:id/escalate', controller.hodReview);

router.post('/:id/:action', (req, res, next) => {
  if (req.baseUrl.includes('/hod')) {
    return controller.hodReview(req, res, next);
  }
  return controller.mentorReview(req, res, next);
});

router.post('/:id', (req, res, next) => {
  if (req.baseUrl.includes('/hod')) {
    return controller.hodReview(req, res, next);
  }
  return controller.mentorReview(req, res, next);
});

router.get('/:id', controller.getRequestDetails);

export default router;
