import { Router } from 'express';
import { SettingsController } from './settings.controller';
import { requireAuth, requirePermission } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new SettingsController();

router.get('/', requireAuth, requirePermission('settings:read'), controller.list);
router.get('/catalog', requireAuth, requirePermission('settings:read'), controller.catalog);
router.get('/branding', controller.getBranding);
router.post('/impact-preview', requireAuth, requirePermission('settings:write'), controller.preview);
router.get('/request-policy', requireAuth, controller.getRequestPolicy);
router.post('/', requireAuth, requirePermission('settings:write'), controller.update);
router.get('/principal-availability', requireAuth, controller.getPrincipalAvailability);
router.post('/principal-availability', requireAuth, requirePermission('delegation:write'), controller.setPrincipalAvailability);

export default router;
