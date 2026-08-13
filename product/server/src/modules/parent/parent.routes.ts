import { Router } from 'express';
import { ParentController } from './parent.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/children', ParentController.getLinkedChildren);
router.get('/child/:studentId/attendance', ParentController.getChildAttendance);
router.get('/child/:studentId/marks', ParentController.getChildMarks);
router.get('/child/:studentId/fees', ParentController.getChildFees);
router.get('/child/:studentId/receipts', ParentController.getChildReceipts);
router.get('/child/:studentId/leave-od', ParentController.getChildLeaveOd);
router.get('/child/:studentId/timetable', ParentController.getChildTimetable);
router.get('/child/:studentId/circulars', ParentController.getChildCirculars);
router.get('/child/:studentId/transport', ParentController.getChildTransport);
router.get('/child/:studentId/alerts', ParentController.getChildAlerts);
router.get('/child/:studentId/mentor-meetings', ParentController.getMentorMeetings);
router.post('/child/:studentId/contact-mentor', ParentController.contactMentor);

router.get('/notification-preferences', ParentController.getNotificationPreferences);
router.put('/notification-preferences', ParentController.updateNotificationPreferences);

export default router;
