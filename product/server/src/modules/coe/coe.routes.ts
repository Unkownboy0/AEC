import { Router } from 'express';
import { requireAuth, requireRole, requirePermission } from '../../core/middlewares/auth.middleware';
import { CoeController } from './coe.controller';

const router = Router();
const controller = new CoeController();
const coeOnly = requireRole(['Examination Cell', 'COE']);

router.use(requireAuth);
router.get('/student/hall-allotments', requireRole(['Student']), controller.studentHall);
router.get('/student/hall-ticket', requireRole(['Student']), controller.studentHallTicket);
router.get('/student/hall-ticket.pdf', requireRole(['Student']), controller.studentHallTicketPdf);
router.get('/dashboard', coeOnly, controller.dashboard);
router.get('/hall-tickets', coeOnly, controller.searchHallTickets);
router.get('/students/:studentId/hall-ticket', coeOnly, controller.coeHallTicket);
router.get('/students/:studentId/hall-ticket.pdf', coeOnly, controller.coeHallTicketPdf);
router.get('/exams/:examId/schedule', coeOnly, controller.schedule);
router.post('/schedules', coeOnly, controller.createSchedule);
router.get('/exams/:examId/validate', coeOnly, controller.validateSchedule);
router.post('/exams/:examId/publish', coeOnly, controller.publishSchedule);
router.post('/rooms', coeOnly, controller.createRoom);
router.post('/hall-allocations/auto', coeOnly, controller.allocateSeats);
router.post('/hall-allocations/:scheduleEntryId/publish', coeOnly, controller.publishSeats);
router.post('/invigilation', coeOnly, controller.assignInvigilator);
// Explicit RESULT_PUBLISH permission requirement for exam result publication
router.post('/exams/:examId/results/publish', coeOnly, requirePermission('RESULT_PUBLISH'), controller.publishResults);

export default router;
