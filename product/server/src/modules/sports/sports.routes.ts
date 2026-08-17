import { Router } from 'express';
import { SportsController } from './sports.controller';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { requireFeature } from '../../core/middlewares/requireFeature.middleware';

const router = Router();
const controller = new SportsController();

router.use(requireAuth);
router.use(requireFeature('MODULE_SPORTS_ENABLED'));

const sportsAdmin = requireRole([
  'Super Admin',
  'College Admin',
  'Principal',
  'Sports',
  'Sports Coordinator',
  'Physical Education Director',
]);


router.get('/summary', controller.getSportsSummary);
router.get('/teams', controller.listTeams);
router.post('/teams', sportsAdmin, controller.createTeam);

router.get('/tournaments', controller.listTournaments);
router.post('/tournaments', sportsAdmin, controller.createTournament);

router.get('/bookings', controller.listBookings);
router.post('/bookings', controller.createBooking);

router.get('/equipment', controller.listEquipment);
router.post('/equipment', sportsAdmin, controller.createEquipment);

router.get('/achievements', controller.listAchievements);
router.post('/achievements', sportsAdmin, controller.createAchievement);

export default router;
