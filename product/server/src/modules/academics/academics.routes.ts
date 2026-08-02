import { Router } from 'express';
import { AcademicsController } from './academics.controller';
import { requireAuth, requirePermission } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new AcademicsController();

const readGuard = [requireAuth, requirePermission('academics:read')];
const publicReadGuard = [requireAuth];
const writeGuard = [requireAuth, requirePermission('academics:write')];

// Dashboard Stats
router.get('/dashboard/stats', readGuard, controller.getDashboardStats);

// Bulk and Import
router.post('/bulk-action', writeGuard, controller.bulkAction);
router.post('/import-preview', writeGuard, controller.importPreview);
router.post('/import', writeGuard, controller.importCommit);

// Academic Years
router.get('/years', publicReadGuard, controller.listYears);
router.post('/years', writeGuard, controller.createYear);
router.get('/years/:id', publicReadGuard, controller.getYear);
router.put('/years/:id', writeGuard, controller.updateYear);
router.post('/years/:id/clone', writeGuard, controller.cloneYear);
router.delete('/years/:id', writeGuard, controller.deleteYear);

// Departments
router.get('/departments', publicReadGuard, controller.listDepts);
router.post('/departments', writeGuard, controller.createDept);
router.get('/departments/:id', publicReadGuard, controller.getDept);
router.put('/departments/:id', writeGuard, controller.updateDept);
router.delete('/departments/:id', writeGuard, controller.deleteDept);

// Programs
router.get('/programs', publicReadGuard, controller.listPrograms);
router.post('/programs', writeGuard, controller.createProgram);
router.get('/programs/:id', publicReadGuard, controller.getProgram);
router.put('/programs/:id', writeGuard, controller.updateProgram);
router.delete('/programs/:id', writeGuard, controller.deleteProgram);

// Courses
router.get('/courses', publicReadGuard, controller.listCourses);
router.post('/courses', writeGuard, controller.createCourse);
router.get('/courses/:id', publicReadGuard, controller.getCourse);
router.put('/courses/:id', writeGuard, controller.updateCourse);
router.delete('/courses/:id', writeGuard, controller.deleteCourse);

// Semesters
router.get('/semesters', publicReadGuard, controller.listSemesters);
router.post('/semesters', writeGuard, controller.createSemester);
router.get('/semesters/:id', publicReadGuard, controller.getSemester);
router.put('/semesters/:id', writeGuard, controller.updateSemester);
router.delete('/semesters/:id', writeGuard, controller.deleteSemester);

// Sections
router.get('/sections', publicReadGuard, controller.listSections);
router.post('/sections', writeGuard, controller.createSection);
router.get('/sections/:id', publicReadGuard, controller.getSection);
router.put('/sections/:id', writeGuard, controller.updateSection);
router.delete('/sections/:id', writeGuard, controller.deleteSection);

// Subjects
router.get('/subjects', publicReadGuard, controller.listSubjects);
router.post('/subjects', writeGuard, controller.createSubject);
router.get('/subjects/:id', publicReadGuard, controller.getSubject);
router.put('/subjects/:id', writeGuard, controller.updateSubject);
router.delete('/subjects/:id', writeGuard, controller.deleteSubject);

// Subject Assignments (Faculty Allocation)
router.get('/subject-assignments', publicReadGuard, controller.listSubjectAssignments);
router.post('/subject-assignments', writeGuard, controller.createSubjectAssignment);
router.delete('/subject-assignments/:id', writeGuard, controller.deleteSubjectAssignment);

// Faculty Manual Subject Assignments
router.post('/subject-assignments/faculty-assign', requireAuth, controller.facultyCreateSubjectAssignment);
router.put('/subject-assignments/faculty-update/:id', requireAuth, controller.facultyUpdateSubjectAssignment);
router.delete('/subject-assignments/faculty-delete/:id', requireAuth, controller.facultyDeleteSubjectAssignment);

export default router;
