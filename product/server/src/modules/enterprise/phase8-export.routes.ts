import { Router } from 'express';
import { Phase8ExportController } from './phase8-export.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';
import { requirePermissionGuard } from '../../core/middlewares/rbacGuard.middleware';

const router = Router();
const controller = new Phase8ExportController();

// Public QR Verification Endpoint (no auth required)
router.get('/id-cards/verify/:token', controller.verifyDigitalIdToken);

// Protected Endpoints
router.use(requireAuth);

router.get('/id-cards/student/:id?', requirePermissionGuard('students', 'view'), controller.getStudentDigitalId);
router.get('/id-cards/faculty/:id?', requirePermissionGuard('faculty', 'view'), controller.getFacultyDigitalId);

router.get('/exports/students-excel', requirePermissionGuard('reports', 'view'), controller.exportStudentsExcel);
router.get('/exports/faculty-excel', requirePermissionGuard('reports', 'view'), controller.exportFacultyExcel);
router.get('/exports/students-csv', requirePermissionGuard('reports', 'view'), controller.exportStudentsCsv);
router.get('/exports/history', requirePermissionGuard('reports', 'view'), controller.getExportHistory);

export default router;
