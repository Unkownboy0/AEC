"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const academics_controller_1 = require("./academics.controller");
const auth_middleware_1 = require("../../core/middlewares/auth.middleware");
const router = (0, express_1.Router)();
const controller = new academics_controller_1.AcademicsController();
const readGuard = [auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('academics:read')];
const writeGuard = [auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('academics:write')];
// Dashboard Stats
router.get('/dashboard/stats', readGuard, controller.getDashboardStats);
// Bulk and Import
router.post('/bulk-action', writeGuard, controller.bulkAction);
router.post('/import-preview', writeGuard, controller.importPreview);
router.post('/import', writeGuard, controller.importCommit);
// Academic Years
router.get('/years', readGuard, controller.listYears);
router.post('/years', writeGuard, controller.createYear);
router.get('/years/:id', readGuard, controller.getYear);
router.put('/years/:id', writeGuard, controller.updateYear);
router.post('/years/:id/clone', writeGuard, controller.cloneYear);
router.delete('/years/:id', writeGuard, controller.deleteYear);
// Departments
router.get('/departments', readGuard, controller.listDepts);
router.post('/departments', writeGuard, controller.createDept);
router.get('/departments/:id', readGuard, controller.getDept);
router.put('/departments/:id', writeGuard, controller.updateDept);
router.delete('/departments/:id', writeGuard, controller.deleteDept);
// Programs
router.get('/programs', readGuard, controller.listPrograms);
router.post('/programs', writeGuard, controller.createProgram);
router.get('/programs/:id', readGuard, controller.getProgram);
router.put('/programs/:id', writeGuard, controller.updateProgram);
router.delete('/programs/:id', writeGuard, controller.deleteProgram);
// Courses
router.get('/courses', readGuard, controller.listCourses);
router.post('/courses', writeGuard, controller.createCourse);
router.get('/courses/:id', readGuard, controller.getCourse);
router.put('/courses/:id', writeGuard, controller.updateCourse);
router.delete('/courses/:id', writeGuard, controller.deleteCourse);
// Semesters
router.get('/semesters', readGuard, controller.listSemesters);
router.post('/semesters', writeGuard, controller.createSemester);
router.get('/semesters/:id', readGuard, controller.getSemester);
router.put('/semesters/:id', writeGuard, controller.updateSemester);
router.delete('/semesters/:id', writeGuard, controller.deleteSemester);
// Sections
router.get('/sections', readGuard, controller.listSections);
router.post('/sections', writeGuard, controller.createSection);
router.get('/sections/:id', readGuard, controller.getSection);
router.put('/sections/:id', writeGuard, controller.updateSection);
router.delete('/sections/:id', writeGuard, controller.deleteSection);
// Subjects
router.get('/subjects', readGuard, controller.listSubjects);
router.post('/subjects', writeGuard, controller.createSubject);
router.get('/subjects/:id', readGuard, controller.getSubject);
router.put('/subjects/:id', writeGuard, controller.updateSubject);
router.delete('/subjects/:id', writeGuard, controller.deleteSubject);
// Subject Assignments (Faculty Allocation)
router.get('/subject-assignments', readGuard, controller.listSubjectAssignments);
router.post('/subject-assignments', writeGuard, controller.createSubjectAssignment);
router.delete('/subject-assignments/:id', writeGuard, controller.deleteSubjectAssignment);
// Faculty Manual Subject Assignments
router.post('/subject-assignments/faculty-assign', auth_middleware_1.requireAuth, controller.facultyCreateSubjectAssignment);
router.put('/subject-assignments/faculty-update/:id', auth_middleware_1.requireAuth, controller.facultyUpdateSubjectAssignment);
router.delete('/subject-assignments/faculty-delete/:id', auth_middleware_1.requireAuth, controller.facultyDeleteSubjectAssignment);
exports.default = router;
//# sourceMappingURL=academics.routes.js.map