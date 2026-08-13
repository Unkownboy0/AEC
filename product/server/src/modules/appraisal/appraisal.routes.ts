import { Router } from 'express';
import { AppraisalController } from './appraisal.controller';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
const router = Router();
router.use(requireAuth);
const adminGuard = requireRole(['IQAC Dean', 'Principal', 'Super Admin', 'College Admin']);
const hodGuard = requireRole(['HOD', 'Head of Department', 'IQAC Dean', 'Principal', 'Super Admin']);

router.get('/configs', AppraisalController.listConfigs);
router.get('/configs/:id', AppraisalController.getConfig);
router.post('/configs', adminGuard, AppraisalController.createConfig);
router.post('/configs/:id/activate', adminGuard, AppraisalController.activateConfig);
router.post('/categories', adminGuard, AppraisalController.addCategory);
router.post('/subcategories', adminGuard, AppraisalController.addSubcategory);
router.get('/my-submission/:configId', AppraisalController.getMySubmission);
router.post('/entries', AppraisalController.addEntry);
router.post('/submissions/:id/submit', AppraisalController.submitAppraisal);
router.post('/entries/:id/verify', hodGuard, AppraisalController.verifyEntry);
router.post('/submissions/:id/finalize', hodGuard, AppraisalController.finalizeSubmission);

export default router;
