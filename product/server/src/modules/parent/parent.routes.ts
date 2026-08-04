import { Router } from 'express';
import { ParentController } from './parent.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/children', ParentController.getLinkedChildren);
router.get('/child/:studentId/attendance', ParentController.getChildAttendance);
router.get('/child/:studentId/marks', ParentController.getChildMarks);
router.get('/child/:studentId/fees', ParentController.getChildFees);
router.get('/child/:studentId/leave-od', ParentController.getChildLeaveOd);
router.get('/child/:studentId/timetable', ParentController.getChildTimetable);
router.post('/child/:studentId/contact-mentor', ParentController.contactMentor);

export default router;
