import { Router } from 'express';
import { TimetableController } from './timetable.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new TimetableController();

router.use(requireAuth);

router.get('/slots', controller.listSlots);
router.post('/slots', controller.createSlot);
router.delete('/slots/:id', controller.deleteSlot);
router.post('/ai-generate', controller.generateAIDraft);

// Faculty manual slots
router.post('/slots/faculty-create', controller.facultyCreateSlot);
router.put('/slots/faculty-update/:id', controller.facultyUpdateSlot);
router.delete('/slots/faculty-delete/:id', controller.facultyDeleteSlot);

// Timetable Approval/Publishing flow
router.get('/publish-status', controller.getPublishStatus);
router.post('/submit-review', controller.submitForReview);
router.put('/review/:id', controller.reviewTimetable);
router.put('/publish/:id', controller.publishTimetable);

export default router;
