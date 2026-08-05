import { Router } from 'express';
import { FacultyLeaveController } from './faculty-leave.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();
router.use(requireAuth);

// Faculty Leave & OD Endpoints
router.get('/faculty/leave-od', FacultyLeaveController.getFacultyRequests);
router.post('/faculty/leave-od', FacultyLeaveController.submitLeaveOd);
router.get('/faculty/leave-od/:id', FacultyLeaveController.getRequestById);

// HOD Faculty Request Endpoints
router.get('/hod/faculty-requests', FacultyLeaveController.getHodDashboard);
router.get('/hod/faculty-requests/:id', FacultyLeaveController.getRequestById);
router.post('/hod/faculty-requests/:id/recommend', FacultyLeaveController.hodRecommend);
router.post('/hod/faculty-requests/:id/reject', FacultyLeaveController.hodReject);
router.post('/hod/faculty-requests/:id/return', FacultyLeaveController.hodReturn);

export default router;
