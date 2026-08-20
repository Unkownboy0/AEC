import { Router } from 'express';
import { FilesController } from './files.controller';
import { requireAuth, requirePermission } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new FilesController();

// Content delivery endpoints for inline media (avatars, images, viewable attachments)
router.get('/content', requireAuth, controller.getContent);
router.get('/:id/content', requireAuth, controller.getContent);

router.get('/', requireAuth, requirePermission('files:read'), controller.list);
router.get('/:id/download', requireAuth, controller.download);
router.post('/upload', requireAuth, (req, res, next) => {
  const user = (req as any).user;
  if (user && ['Student', 'HOD', 'Faculty', 'Super Admin', 'College Admin', 'Principal', 'Vice Principal'].includes(user.role)) {
    return next();
  }
  return requirePermission('files:write')(req, res, next);
}, controller.upload);
router.delete('/:id', requireAuth, requirePermission('files:write'), controller.delete);

export default router;
