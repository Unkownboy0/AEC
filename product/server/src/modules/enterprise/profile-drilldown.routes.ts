import { Router } from 'express';
import { ProfileDrilldownController } from './profile-drilldown.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';
import { SearchController } from './search.controller';

const router = Router();
const controller = new ProfileDrilldownController();

router.use(requireAuth);

router.get('/user/:id', controller.getUser360);
router.get('/student/:id', controller.getStudent360);
router.get('/faculty/:id', controller.getFaculty360);
router.get('/search', SearchController.globalSearch);

export default router;
