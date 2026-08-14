import { Router } from 'express';
import { FacultyLeaveController } from './faculty-leave.controller';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';

const router = Router();
router.use(requireAuth);

const hodDecisionGuard = requireRole(['HOD', 'Super Admin', 'College Admin']);

// Faculty Leave & OD Endpoints
router.get('/faculty/leave-od/affected-sessions', FacultyLeaveController.getAffectedSessions);
router.get('/faculty/leave-od/available-substitutes', FacultyLeaveController.getAvailableSubstitutes);
router.get('/faculty/leave-od', FacultyLeaveController.getFacultyRequests);
router.post('/faculty/leave-od', FacultyLeaveController.submitLeaveOd);
router.get('/faculty/leave-od/:id', FacultyLeaveController.getRequestById);

// HOD Faculty Request Endpoints
router.get('/hod/faculty-requests', hodDecisionGuard, FacultyLeaveController.getHodDashboard);
router.get('/hod/faculty-requests/:id', FacultyLeaveController.getRequestById);
router.post('/hod/faculty-requests/:id/recommend', hodDecisionGuard, FacultyLeaveController.hodRecommend);
router.post('/hod/faculty-requests/:id/reject', hodDecisionGuard, FacultyLeaveController.hodReject);
router.post('/hod/faculty-requests/:id/return', hodDecisionGuard, FacultyLeaveController.hodReturn);

export default router;
