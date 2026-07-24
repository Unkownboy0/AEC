"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const timetable_controller_1 = require("./timetable.controller");
const auth_middleware_1 = require("../../core/middlewares/auth.middleware");
const router = (0, express_1.Router)();
const controller = new timetable_controller_1.TimetableController();
router.use(auth_middleware_1.requireAuth);
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
exports.default = router;
//# sourceMappingURL=timetable.routes.js.map