import { Router } from 'express';
import { MastersController } from './masters.controller';
import { requireAuth, requirePermission } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new MastersController();

router.get('/', requireAuth, requirePermission('masters:read'), controller.list);
router.post('/', requireAuth, requirePermission('masters:write'), controller.create);
router.delete('/:id', requireAuth, requirePermission('masters:write'), controller.delete);

export default router;
