import { Router, Request, Response } from 'express';
import { SettingsController } from './settings.controller';
import { requireAuth, requirePermission } from '../../core/middlewares/auth.middleware';
import { FeatureFlags } from '../../core/feature-flags';

const router = Router();
const controller = new SettingsController();

router.get('/', requireAuth, requirePermission('settings:read'), controller.list);
router.get('/catalog', requireAuth, requirePermission('settings:read'), controller.catalog);
router.get('/branding', controller.getBranding);

/**
 * GET /api/settings/features
 * Public endpoint — returns all MODULE_* feature flags as a boolean map.
 * Used by the client to conditionally render navigation and module surfaces.
 * No authentication required (values are safe to expose publicly).
 */
router.get('/features', async (_req: Request, res: Response) => {
  try {
    const flags = await FeatureFlags.load();
    res.status(200).json({ status: 'success', data: flags });
  } catch {
    res.status(200).json({ status: 'success', data: {} }); // safe fallback
  }
});

router.post('/impact-preview', requireAuth, requirePermission('settings:write'), controller.preview);
router.get('/request-policy', requireAuth, controller.getRequestPolicy);
router.post('/', requireAuth, requirePermission('settings:write'), controller.update);
router.get('/principal-availability', requireAuth, controller.getPrincipalAvailability);
router.post('/principal-availability', requireAuth, requirePermission('delegation:write'), controller.setPrincipalAvailability);
router.get('/device-capabilities', requireAuth, controller.getDeviceCapabilities);

export default router;
