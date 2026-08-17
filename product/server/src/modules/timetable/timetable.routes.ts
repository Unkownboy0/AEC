import { Router } from 'express';
import { TimetableController } from './timetable.controller';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new TimetableController();

router.use(requireAuth);

router.get('/slots', controller.listSlots);
router.get('/affected-sessions', controller.getAffectedSessions);
router.post('/slots', requireRole(['HOD', 'Academic Dean', 'Examination Cell', 'COE']), controller.createSlot);
router.delete('/slots/:id', requireRole(['HOD', 'Academic Dean', 'Examination Cell', 'COE']), controller.deleteSlot);
router.post('/ai-generate', requireRole(['HOD', 'Academic Dean', 'Examination Cell', 'COE']), controller.generateAIDraft);

// Faculty manual slots
router.post('/slots/faculty-create', requireRole(['HOD', 'Academic Dean', 'Examination Cell', 'COE']), controller.facultyCreateSlot);
router.put('/slots/faculty-update/:id', requireRole(['HOD', 'Academic Dean', 'Examination Cell', 'COE']), controller.facultyUpdateSlot);
router.delete('/slots/faculty-delete/:id', requireRole(['HOD', 'Academic Dean', 'Examination Cell', 'COE']), controller.facultyDeleteSlot);

// Timetable Approval/Publishing flow
router.get('/publish-status', controller.getPublishStatus);
router.post('/submit-review', requireRole(['HOD']), controller.submitForReview);
router.put('/review/:id', requireRole(['Academic Dean', 'Examination Cell', 'COE']), controller.reviewTimetable);
router.put('/publish/:id', requireRole(['Academic Dean', 'Examination Cell', 'COE']), controller.publishTimetable);

export default router;
