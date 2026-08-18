import { Router } from 'express';
import { HodController } from './hod.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';
import { requireHodRoleAndDept } from './hod.middleware';

const router = Router();
const controller = new HodController();

// Protect all HOD APIs with authentication and HOD department scoping
router.use(requireAuth, requireHodRoleAndDept);

// 1. Dashboard
router.get('/dashboard', controller.getDashboardSummary);

// 2. Approvals Workspace (Leave & OD)
router.get('/leave-od', controller.getLeaveOdRequests);
router.get('/leave-od/:id', controller.getLeaveOdRequestDetails);
router.post('/leave-od/:id/review', controller.reviewLeaveOdRequest);
router.post('/leave-od/:id/approve', (req, res) => {
  req.body.action = 'APPROVE';
  return controller.reviewLeaveOdRequest(req, res);
});
router.post('/leave-od/:id/reject', (req, res) => {
  req.body.action = 'REJECT';
  return controller.reviewLeaveOdRequest(req, res);
});
router.post('/leave-od/:id/return-to-mentor', (req, res) => {
  req.body.action = 'RETURN_TO_MENTOR';
  return controller.reviewLeaveOdRequest(req, res);
});
router.post('/leave-od/:id/return-to-student', (req, res) => {
  req.body.action = 'RETURN_TO_STUDENT';
  return controller.reviewLeaveOdRequest(req, res);
});
router.post('/leave-od/:id/escalate', (req, res) => {
  req.body.action = 'ESCALATE';
  return controller.reviewLeaveOdRequest(req, res);
});
router.post('/leave-od/bulk-approve', (req, res) => {
  req.body.action = 'APPROVE';
  return controller.bulkReviewLeaveOd(req, res);
});
router.post('/leave-od/bulk-reject', (req, res) => {
  req.body.action = 'REJECT';
  return controller.bulkReviewLeaveOd(req, res);
});

// 3. Students
router.get('/students', controller.getDepartmentStudents);
router.post('/students/assign-mentor', controller.assignMentor);

// 4. Faculty & Mentors
router.get('/faculty', controller.getDepartmentFaculty);
router.post('/subjects/assign', controller.assignSubject);

// 5. Attendance & Timetable
router.get('/attendance', controller.getDepartmentAttendance);

// 6. Tasks
router.get('/tasks', controller.getTasks);
router.post('/tasks', controller.createTask);
// Tasks the HOD created and assigned to faculty
router.get('/tasks/assigned-by-me', controller.getTasksAssignedByHod);
// Faculty allocation (subject→faculty mapping)
router.get('/allocation/subjects', controller.getAllocatableSubjects);
router.get('/allocation/sections', controller.getAllocatableSections);
router.get('/allocation/faculty-workload', controller.getFacultyWorkload);
router.post('/allocation/assign', controller.createFacultyAllocation);
router.delete('/allocation/:allocationId', controller.removeFacultyAllocation);
router.get('/allocation', controller.getFacultyAllocations);

// 7. Circulars & Announcements
router.get('/circulars', controller.listCirculars);
router.post('/circulars', controller.createCircular);
router.get('/circulars/:id', controller.getCircularById);
router.post('/circulars/:id/publish', controller.publishCircular);

// 8. Reports & Profile
router.get('/reports/export', controller.exportReports);
router.get('/profile', controller.getProfile);

export default router;
