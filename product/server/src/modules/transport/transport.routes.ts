import { Router } from 'express';
import { TransportController } from './transport.controller';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';

const router = Router();
router.use(requireAuth);

const transportGuard = requireRole(['Transport Manager', 'Transport Admin', 'Super Admin', 'College Admin', 'Administration Dean']);

router.get('/dashboard', transportGuard, TransportController.getDashboard);
router.get('/routes', TransportController.listRoutes);
router.get('/routes/:id', TransportController.getRoute);
router.get('/vehicles', transportGuard, TransportController.listVehicles);
router.post('/vehicles', transportGuard, TransportController.createVehicle);
router.get('/drivers', transportGuard, TransportController.listDrivers);
router.post('/drivers', transportGuard, TransportController.createDriver);
router.post('/stops', transportGuard, TransportController.addStop);
router.post('/allocations', transportGuard, TransportController.allocate);
router.post('/allocations/:id/cancel', transportGuard, TransportController.cancelAllocation);
router.post('/attendance', transportGuard, TransportController.recordAttendance);
router.post('/fuel', transportGuard, TransportController.recordFuel);
router.post('/maintenance', transportGuard, TransportController.createMaintenance);
router.post('/breakdowns', TransportController.reportBreakdown);

export default router;
