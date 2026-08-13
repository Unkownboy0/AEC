import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { AdmissionCoordinationService } from './admission-coordination.service';
import { AdmissionController } from './admission.controller';

const router = Router();
const admissionController = new AdmissionController();

// Guard all Admission Dean routes with Auth
router.use(requireAuth);

/**
 * GET /api/admission-dean/dashboard - Live KPI summary
 */
router.get('/dashboard', requireRole(['Admission Dean', 'Administration & Admission Dean', 'Super Admin', 'College Admin', 'Principal']), admissionController.getAnalytics);
router.get('/analytics/funnel', requireRole(['Admission Dean', 'Administration & Admission Dean', 'Super Admin', 'College Admin', 'Principal']), admissionController.getFunnelAnalytics);

/**
 * Admission Applications & Wizard
 */
router.post('/wizard/check-duplicate', requireRole(['Admission Dean', 'Administration & Admission Dean', 'Super Admin', 'College Admin', 'Principal']), admissionController.checkDuplicate);
router.post('/wizard/save-draft', requireRole(['Admission Dean', 'Administration & Admission Dean', 'Super Admin', 'College Admin', 'Principal']), admissionController.saveWizardProgress);
router.get('/applications', requireRole(['Admission Dean', 'Administration & Admission Dean', 'Super Admin', 'College Admin', 'Principal']), admissionController.listApplications);
router.get('/applications/:id', requireRole(['Admission Dean', 'Administration & Admission Dean', 'Super Admin', 'College Admin', 'Principal']), admissionController.getApplication);
router.put('/applications/:id/status', requireRole(['Admission Dean', 'Administration & Admission Dean', 'Super Admin', 'College Admin', 'Principal']), admissionController.updateApplicationStatus);
router.post('/applications/:id/confirm-admission', requireRole(['Admission Dean', 'Administration & Admission Dean', 'Super Admin', 'College Admin', 'Principal']), admissionController.confirmAdmission);
router.post('/applications/bulk-status', requireRole(['Admission Dean', 'Administration & Admission Dean', 'Super Admin', 'College Admin', 'Principal']), admissionController.bulkUpdateStatus);
router.post('/applications/:id/verify-document', requireRole(['Admission Dean', 'Administration & Admission Dean', 'Super Admin', 'College Admin', 'Principal']), admissionController.verifyDocument);

/**
 * Seats & Quotas
 */
router.get('/seats', requireRole(['Admission Dean', 'Administration & Admission Dean', 'Super Admin', 'College Admin', 'Principal']), admissionController.listSeats);
router.post('/seats/:id/allocate', requireRole(['Admission Dean', 'Administration & Admission Dean', 'Super Admin', 'College Admin', 'Principal']), admissionController.allocateSeat);
router.post('/seats/auto-allocate', requireRole(['Admission Dean', 'Administration & Admission Dean', 'Super Admin', 'College Admin', 'Principal']), admissionController.autoAllocateMeritSeats);
router.post('/seats/:id/transfer', requireRole(['Admission Dean', 'Administration & Admission Dean', 'Super Admin', 'College Admin', 'Principal']), admissionController.transferDepartment);

/**
 * CRM Enquiries & Counselling
 */
router.get('/enquiries', requireRole(['Admission Dean', 'Administration & Admission Dean', 'Super Admin', 'College Admin', 'Principal']), admissionController.listEnquiries);
router.post('/enquiries', requireRole(['Admission Dean', 'Administration & Admission Dean', 'Super Admin', 'College Admin', 'Principal']), admissionController.createEnquiry);
router.put('/enquiries/:id', requireRole(['Admission Dean', 'Administration & Admission Dean', 'Super Admin', 'College Admin', 'Principal']), admissionController.updateEnquiry);
router.post('/enquiries/:id/convert', requireRole(['Admission Dean', 'Administration & Admission Dean', 'Super Admin', 'College Admin', 'Principal']), admissionController.convertEnquiry);
router.get('/counselling', requireRole(['Admission Dean', 'Administration & Admission Dean', 'Super Admin', 'College Admin', 'Principal']), admissionController.listCounselling);
router.post('/counselling', requireRole(['Admission Dean', 'Administration & Admission Dean', 'Super Admin', 'College Admin', 'Principal']), admissionController.createCounselling);
router.get('/scholarships', requireRole(['Admission Dean', 'Administration & Admission Dean', 'Super Admin', 'College Admin', 'Principal']), admissionController.listScholarships);
router.get('/payments', requireRole(['Admission Dean', 'Administration & Admission Dean', 'Super Admin', 'College Admin', 'Principal']), admissionController.listPayments);

/**
 * Admission Coordination Requests (Admission Dean -> HOD)
 */
router.get('/coordination', requireRole(['Admission Dean', 'Administration & Admission Dean', 'Super Admin', 'College Admin', 'Principal']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdmissionCoordinationService.getRequestsForDean(req.query as any);
    res.status(200).json({ status: 'success', ...result });
  } catch (error) {
    next(error);
  }
});

router.post('/coordination', requireRole(['Admission Dean', 'Administration & Admission Dean', 'Super Admin', 'College Admin', 'Principal']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deanUserId = (req as any).user.id;
    const request = await AdmissionCoordinationService.createRequest(deanUserId, req.body);
    res.status(201).json({ status: 'success', data: request });
  } catch (error) {
    next(error);
  }
});

router.post('/coordination/:id/review', requireRole(['Admission Dean', 'Administration & Admission Dean', 'Super Admin', 'College Admin', 'Principal']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deanUserId = (req as any).user.id;
    const { action, remarks } = req.body;
    const result = await AdmissionCoordinationService.reviewRequest(req.params.id, action, remarks, deanUserId);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * HOD Admission Coordination Endpoints (Received by HOD)
 */
router.get('/hod-coordination', requireRole(['HOD', 'Admission Dean', 'Administration & Admission Dean', 'Super Admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hodUserId = (req as any).user.id;
    const requests = await AdmissionCoordinationService.getRequestsForHod(hodUserId);
    res.status(200).json({ status: 'success', data: requests });
  } catch (error) {
    next(error);
  }
});

router.post('/hod-coordination/:id/respond', requireRole(['HOD', 'Admission Dean', 'Administration & Admission Dean', 'Super Admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hodUserId = (req as any).user.id;
    const result = await AdmissionCoordinationService.respondToRequest(req.params.id, req.body, hodUserId);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

export default router;

