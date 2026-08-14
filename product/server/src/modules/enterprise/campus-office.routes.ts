import { Router } from 'express';
import { CampusOfficeController } from './campus-office.controller';
import { requireRole } from '../../core/middlewares/auth.middleware';

const router = Router();

// This file never called router.use(requireAuth) and had no role guards at
// all; requests without a token do get 401 (enforced elsewhere in the chain),
// but any authenticated user — Student included — could reach document
// review and employee transfer processing. Adding role guards on the
// sensitive actions; self-service create/submit stays open.
const officeReviewGuard = requireRole(['Super Admin', 'College Admin', 'Principal', 'Vice Principal', 'HOD', 'Academic Dean', 'Admission Dean', 'IQAC Dean']);
const transferGuard = requireRole(['Super Admin', 'College Admin', 'Principal', 'Vice Principal', 'HOD', 'Academic Dean']);

// Office Documents & Templates
router.get('/templates', CampusOfficeController.getTemplates);
router.get('/documents', CampusOfficeController.listUserDocuments);
router.post('/documents', CampusOfficeController.createDocument);
router.put('/documents/:id', CampusOfficeController.updateDocument);
router.post('/documents/:id/submit-review', CampusOfficeController.submitForReview);
router.post('/documents/:id/review', officeReviewGuard, CampusOfficeController.reviewDocument);

// Forms Engine
router.post('/forms/:id/submit', CampusOfficeController.submitFormResponse);
router.get('/forms/:id/responses', CampusOfficeController.getFormResponses);

// Campus Drive
router.get('/drive/items', CampusOfficeController.getDriveItems);
router.post('/drive/items', CampusOfficeController.createDriveItem);

// Cross-Department & Availability
router.get('/workload/:facultyId', CampusOfficeController.getFacultyWorkload);
router.get('/roster/:departmentId', CampusOfficeController.getDepartmentRoster);
router.post('/assignments/request', transferGuard, CampusOfficeController.requestCrossAssignment);
router.post('/transfers/propose', transferGuard, CampusOfficeController.proposeTransfer);
router.post('/transfers/:id/process', transferGuard, CampusOfficeController.processTransferStep);
router.get('/availability/free-faculty', CampusOfficeController.findFreeFaculty);
router.get('/availability/board', CampusOfficeController.getCampusAvailabilityBoard);

// Leave Helper Endpoints
router.get('/leave/affected-periods/:facultyId', CampusOfficeController.getAffectedPeriods);
router.get('/leave/balances/:facultyId', CampusOfficeController.getLeaveBalances);

export default router;
