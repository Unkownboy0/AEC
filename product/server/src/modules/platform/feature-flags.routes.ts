import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { FeatureFlagsController } from './feature-flags.controller';

const router = Router();
const controller = new FeatureFlagsController();
const superAdmin = requireRole(['Super Admin']);

router.use(requireAuth);

// Any authenticated user may check the flags that gate their own UI.
router.get('/check/:key', controller.check);

router.get('/flags', superAdmin, controller.list);
router.get('/flags/:key', superAdmin, controller.get);
router.post('/flags', superAdmin, controller.create);
router.patch('/flags/:key', superAdmin, controller.update);
router.get('/flags/:key/resolve', superAdmin, controller.resolve);
router.get('/flags/:key/history', superAdmin, controller.history);
router.post('/flags/:key/overrides', superAdmin, controller.upsertOverride);
router.delete('/flags/:key/overrides/:overrideId', superAdmin, controller.deleteOverride);

export default router;
