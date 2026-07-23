import { Router } from 'express';
import { BackupController } from './backup.controller';
import { requireAuth, requirePermission } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new BackupController();

router.get('/', requireAuth, requirePermission('backups:read'), controller.list);
router.post('/trigger', requireAuth, requirePermission('backups:write'), controller.trigger);
router.get('/:id/download', requireAuth, requirePermission('backups:read'), controller.download);
router.post('/:id/restore', requireAuth, requirePermission('backups:write'), controller.restore);

export default router;
