import { Router } from 'express';
import { SettingsController } from './settings.controller';
import { requireAuth, requirePermission } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new SettingsController();

router.get('/', requireAuth, requirePermission('settings:read'), controller.list);
router.post('/', requireAuth, requirePermission('settings:write'), controller.update);

export default router;
