import { Router } from 'express';
import { SportsController } from './sports.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new SportsController();

router.use(requireAuth);


router.get('/summary', controller.getSportsSummary);
router.get('/teams', controller.listTeams);
router.post('/teams', controller.createTeam);

router.get('/tournaments', controller.listTournaments);
router.post('/tournaments', controller.createTournament);

router.get('/bookings', controller.listBookings);
router.post('/bookings', controller.createBooking);

router.get('/equipment', controller.listEquipment);
router.post('/equipment', controller.createEquipment);

router.get('/achievements', controller.listAchievements);
router.post('/achievements', controller.createAchievement);

export default router;
