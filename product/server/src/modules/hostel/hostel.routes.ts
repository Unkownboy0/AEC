import { Router } from 'express';
import { HostelController } from './hostel.controller';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';

const router = Router();
router.use(requireAuth);

const wardenGuard = requireRole(['Hostel Warden', 'Warden', 'Chief Warden', 'Hostel Admin', 'Super Admin', 'College Admin', 'Administration Dean']);

// Dashboard & listings
router.get('/dashboard', wardenGuard, HostelController.getDashboard);
router.get('/buildings', HostelController.listHostels);
router.get('/buildings/:id', HostelController.getHostel);
router.get('/rooms', wardenGuard, HostelController.listRooms);

// Allocation
router.post('/allocations', wardenGuard, HostelController.allocateRoom);
router.post('/allocations/:id/vacate', wardenGuard, HostelController.vacateRoom);

// Outing
router.post('/outings', HostelController.requestOuting);
router.post('/outings/:id/review', wardenGuard, HostelController.reviewOuting);
router.post('/outings/:id/return', wardenGuard, HostelController.recordOutingReturn);

// Attendance
router.post('/night-attendance', wardenGuard, HostelController.recordNightAttendance);
router.post('/mess-attendance', wardenGuard, HostelController.recordMessAttendance);

// Visitors
router.post('/visitors', wardenGuard, HostelController.registerVisitor);
router.post('/visitors/:id/checkout', wardenGuard, HostelController.checkoutVisitor);

// Complaints
router.post('/complaints', HostelController.createComplaint);
router.patch('/complaints/:id/status', wardenGuard, HostelController.updateComplaintStatus);

export default router;
