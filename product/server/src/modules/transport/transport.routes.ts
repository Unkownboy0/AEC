import { Router } from 'express';
import { TransportController } from './transport.controller';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';

const router = Router();
router.use(requireAuth);

const transportGuard = requireRole([
  'TRANSPORT_MANAGER',
  'Transport Manager',
  'TRANSPORT_ADMIN',
  'Transport Admin',
  'SUPER_ADMIN',
  'Super Admin',
  'COLLEGE_ADMIN',
  'College Admin',
  'ADMINISTRATION_DEAN',
  'Administration Dean',
]);

// ── Dashboard & Fleet Live Operations ───────────────────────────────────
router.get('/dashboard', transportGuard, TransportController.getDashboard);
router.get('/fleet-live', transportGuard, TransportController.getFleetLive);
router.get('/routes', TransportController.listRoutes);
router.get('/routes/:id', TransportController.getRoute);
router.get('/routes/:id/passengers', transportGuard, TransportController.listRoutePassengers);
router.get('/vehicles', transportGuard, TransportController.listVehicles);
router.post('/vehicles', transportGuard, TransportController.createVehicle);
router.get('/drivers', transportGuard, TransportController.listDrivers);
router.post('/drivers', transportGuard, TransportController.createDriver);
router.post('/stops', transportGuard, TransportController.addStop);

// ── Allocations Management ──────────────────────────────────────────────
router.get('/allocations', transportGuard, TransportController.listAllocations);
router.post('/allocations', transportGuard, TransportController.allocate);
router.post('/allocations/:id/cancel', transportGuard, TransportController.cancelAllocation);

// ── Canonical Unified Live Bus Tracking (Student, Faculty, Staff, Parent) ─
router.get('/my-allocation', TransportController.getMyAllocation);
router.get('/student/live-tracking', TransportController.getMyAllocation);
router.get('/faculty/live-tracking', TransportController.getMyAllocation);

// ── GPS Location Ingestion ──────────────────────────────────────────────
router.post('/tracking/location', TransportController.ingestLocation);

// ── Breakdown & Vehicle Replacement ─────────────────────────────────────
router.post('/trips/replace-vehicle', transportGuard, TransportController.assignReplacementVehicle);
router.post('/breakdowns', TransportController.reportBreakdown);

// ── Transport Maintenance, Fuel & Attendance ────────────────────────────
router.post('/attendance', transportGuard, TransportController.recordAttendance);
router.post('/fuel', transportGuard, TransportController.recordFuel);
router.post('/maintenance', transportGuard, TransportController.createMaintenance);

export default router;
