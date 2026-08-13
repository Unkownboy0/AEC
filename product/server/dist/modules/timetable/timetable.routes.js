"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const timetable_controller_1 = require("./timetable.controller");
const auth_middleware_1 = require("../../core/middlewares/auth.middleware");
const router = (0, express_1.Router)();
const controller = new timetable_controller_1.TimetableController();
router.use(auth_middleware_1.requireAuth);
router.get('/slots', controller.listSlots);
router.post('/slots', (0, auth_middleware_1.requireRole)(['HOD', 'Academic Dean', 'Examination Cell', 'COE']), controller.createSlot);
router.delete('/slots/:id', (0, auth_middleware_1.requireRole)(['HOD', 'Academic Dean', 'Examination Cell', 'COE']), controller.deleteSlot);
router.post('/ai-generate', (0, auth_middleware_1.requireRole)(['HOD', 'Academic Dean', 'Examination Cell', 'COE']), controller.generateAIDraft);
// Faculty manual slots
router.post('/slots/faculty-create', (0, auth_middleware_1.requireRole)(['HOD', 'Academic Dean', 'Examination Cell', 'COE']), controller.facultyCreateSlot);
router.put('/slots/faculty-update/:id', (0, auth_middleware_1.requireRole)(['HOD', 'Academic Dean', 'Examination Cell', 'COE']), controller.facultyUpdateSlot);
router.delete('/slots/faculty-delete/:id', (0, auth_middleware_1.requireRole)(['HOD', 'Academic Dean', 'Examination Cell', 'COE']), controller.facultyDeleteSlot);
// Timetable Approval/Publishing flow
router.get('/publish-status', controller.getPublishStatus);
router.post('/submit-review', (0, auth_middleware_1.requireRole)(['HOD']), controller.submitForReview);
router.put('/review/:id', (0, auth_middleware_1.requireRole)(['Academic Dean', 'Examination Cell', 'COE']), controller.reviewTimetable);
router.put('/publish/:id', (0, auth_middleware_1.requireRole)(['Academic Dean', 'Examination Cell', 'COE']), controller.publishTimetable);
exports.default = router;
//# sourceMappingURL=timetable.routes.js.map