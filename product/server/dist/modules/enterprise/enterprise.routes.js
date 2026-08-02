"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const enterprise_controller_1 = require("./enterprise.controller");
const hod_controller_1 = require("./hod.controller");
const dean_controller_1 = require("./dean.controller");
const search_controller_1 = require("./search.controller");
const auth_middleware_1 = require("../../core/middlewares/auth.middleware");
const departmentScope_1 = require("../../core/middlewares/departmentScope");
const router = (0, express_1.Router)();
const controller = new enterprise_controller_1.EnterpriseController();
// Public QR Code verification endpoint (does not require login)
router.get('/id-card/verify/:token', controller.verifyIdCard);
// Guard all other enterprise endpoints with authentication
router.use(auth_middleware_1.requireAuth);
// ID Cards (requires authentication)
router.get('/id-card/student/:id', controller.getStudentIdCard);
router.get('/id-card/faculty/:id', controller.getFacultyIdCard);
router.post('/bulk-action', controller.bulkAction);
router.get('/search', controller.globalSearch);
router.get('/search/global', search_controller_1.SearchController.globalSearch);
// Students
router.get('/students/mapping-validation', controller.getMappingValidation);
router.post('/students/auto-assign', controller.runAutoAssign);
router.get('/students/dashboard-summary', controller.getStudentDashboardSummary);
router.get('/students/hierarchy', departmentScope_1.enforceDepartmentScope, hod_controller_1.HODController.getYearClassHierarchy);
router.get('/students', controller.listStudents);
router.get('/students/:id/full-profile', controller.getStudentFullProfile);
router.get('/students/:id/id-card/pdf', controller.downloadIdCardPdf);
router.get('/students/:id/attendance/pdf', controller.downloadAttendancePdf);
router.get('/students/:id', controller.getStudent);
router.post('/students', controller.createStudent);
router.put('/students/:id', controller.updateStudent);
router.delete('/students/:id', controller.deleteStudent);
// Faculty
router.get('/faculty', controller.listFaculties);
router.get('/faculty/:id/full-profile', controller.getFacultyFullProfile);
router.get('/faculty/:id', controller.getFaculty);
router.post('/faculty', controller.createFaculty);
router.put('/faculty/:id', controller.updateFaculty);
router.delete('/faculty/:id', controller.deleteFaculty);
// Attendance
router.get('/attendance', controller.listAttendances);
router.post('/attendance', controller.recordAttendance);
router.post('/attendance/bulk', controller.recordBulkAttendance);
// Exams
router.get('/exams', controller.listExams);
router.get('/exams/:id', controller.getExam);
router.post('/exams', controller.createExam);
router.put('/exams/:id', controller.updateExam);
router.delete('/exams/:id', controller.deleteExam);
// Marks
router.get('/marks', controller.listMarks);
router.post('/marks', controller.recordMark);
// Fees
router.get('/fees/categories', controller.listFeeCategories);
router.post('/fees/categories', controller.createFeeCategory);
router.get('/fees/bills', controller.listFeeBills);
router.post('/fees/bills', controller.createFeeBill);
router.post('/fees/bills/:id/pay', controller.recordPayment);
// Library
router.get('/library/books', controller.listLibraryBooks);
router.get('/library/books/:id', controller.getLibraryBook);
router.post('/library/books', controller.createLibraryBook);
router.put('/library/books/:id', controller.updateLibraryBook);
router.delete('/library/books/:id', controller.deleteLibraryBook);
// Transport
router.get('/transport/routes', controller.listTransportRoutes);
router.get('/transport/routes/:id', controller.getTransportRoute);
router.post('/transport/routes', controller.createTransportRoute);
router.put('/transport/routes/:id', controller.updateTransportRoute);
router.delete('/transport/routes/:id', controller.deleteTransportRoute);
// Hostel
router.get('/hostel/buildings', controller.listHostels);
router.get('/hostel/buildings/:id', controller.getHostel);
router.post('/hostel/buildings', controller.createHostel);
router.put('/hostel/buildings/:id', controller.updateHostel);
router.delete('/hostel/buildings/:id', controller.deleteHostel);
// Tickets
router.get('/tickets', controller.listTickets);
router.get('/tickets/:id', controller.getTicket);
router.post('/tickets', controller.createTicket);
router.put('/tickets/:id', controller.updateTicket);
router.delete('/tickets/:id', controller.deleteTicket);
// Internships
router.get('/internships', controller.listInternships);
router.post('/internships', controller.createInternship);
router.post('/internships/:id/documents', controller.uploadInternshipDocument);
router.get('/internships/documents', controller.listAllInternshipDocuments);
router.post('/internships/documents/:id/verify', controller.verifyInternshipDocument);
// Mentor Assignments & Counseling
router.post('/mentors/assign', controller.assignStudentsToMentor);
router.post('/mentors/remove', controller.removeStudentFromMentor);
router.get('/counseling', controller.listCounselingRecords);
router.post('/counseling', controller.createCounselingRecord);
// Placements Dashboard (Read-Only & Audit)
const placement_controller_1 = require("./placement.controller");
const placementController = new placement_controller_1.PlacementController();
router.get('/placements/analytics', placementController.getAnalytics);
router.get('/placements/records', placementController.getRecords);
router.post('/placements/audit', placementController.recordAudit);
// Placement Drive Management
router.get('/placements/drives', placementController.listDrives);
router.post('/placements/drives', placementController.createDrive);
router.put('/placements/drives/:id', placementController.updateDrive);
router.delete('/placements/drives/:id', placementController.deleteDrive);
router.post('/placements/drives/apply', placementController.applyToDrive);
router.get('/placements/drives/:driveId/applications', placementController.listApplications);
router.put('/placements/applications/:id/status', placementController.updateApplicationStatus);
router.post('/placements/applications/:id/offer-letter', placementController.uploadOfferLetter);
// Complaint Monitoring Center (Institution-Wide Read-Only & Escalation)
const complaint_controller_1 = require("./complaint.controller");
const complaintController = new complaint_controller_1.ComplaintController();
router.get('/complaints/analytics', complaintController.getAnalytics);
router.get('/complaints/feed', complaintController.getFeed);
router.post('/complaints/:id/remarks', complaintController.addInternalRemark);
router.post('/complaints/:id/escalate', complaintController.escalateComplaint);
router.post('/complaints/audit', complaintController.recordAudit);
// Campus Activities Monitoring Center (Read-Only & NAAC/NBA Accreditation Reports)
const activity_controller_1 = require("./activity.controller");
const activityController = new activity_controller_1.ActivityController();
router.get('/activities/analytics', activityController.getAnalytics);
router.get('/activities/feed', activityController.getFeed);
router.get('/activities/calendar', activityController.getCalendar);
router.post('/activities/audit', activityController.recordAudit);
// Vice Principal (VP) Operations & Monitoring Module
const vp_controller_1 = require("./vp.controller");
const vpController = new vp_controller_1.VPController();
router.get('/vp/analytics', vpController.getAnalytics);
router.get('/vp/departments', vpController.getDepartments);
router.get('/vp/feed', vpController.getFeed);
router.post('/vp/escalate', vpController.escalate);
router.post('/vp/audit', vpController.recordAudit);
// Admission Dean Operations Module
const admission_controller_1 = require("./admission.controller");
const admissionController = new admission_controller_1.AdmissionController();
router.get('/admission/analytics', admissionController.getAnalytics);
router.get('/admission/applications', admissionController.listApplications);
router.get('/admission/applications/:id', admissionController.getApplication);
router.put('/admission/applications/:id/status', admissionController.updateApplicationStatus);
router.post('/admission/applications/bulk-status', admissionController.bulkUpdateStatus);
router.post('/admission/applications/:id/verify-document', admissionController.verifyDocument);
router.get('/admission/seats', admissionController.listSeats);
router.post('/admission/seats/allocate', admissionController.autoAllocateMeritSeats);
router.post('/admission/seats/:id/allocate', admissionController.allocateSeat);
router.post('/admission/seats/:id/transfer', admissionController.transferDepartment);
router.get('/admission/enquiries', admissionController.listEnquiries);
router.post('/admission/enquiries', admissionController.createEnquiry);
router.put('/admission/enquiries/:id', admissionController.updateEnquiry);
router.post('/admission/enquiries/:id/convert', admissionController.convertEnquiry);
router.get('/admission/counselling', admissionController.listCounselling);
router.post('/admission/counselling', admissionController.createCounselling);
router.get('/admission/scholarships', admissionController.listScholarships);
router.get('/admission/payments', admissionController.listPayments);
// Certificate Request Engine
const certificate_controller_1 = require("./certificate.controller");
const certController = new certificate_controller_1.CertificateController();
router.post('/certificates/apply', certController.apply);
router.get('/certificates/my-list', certController.listMyCertificates);
router.get('/certificates/verify/:hash', certController.verify);
// Gamification Engine
const gamification_controller_1 = require("./gamification.controller");
const gamificationController = new gamification_controller_1.GamificationController();
router.get('/gamification/profile', gamificationController.getProfile);
router.get('/gamification/leaderboard', gamificationController.getLeaderboard);
router.get('/gamification/rewards', gamificationController.getStoreItems);
router.post('/gamification/redeem', gamificationController.redeemReward);
// Quiz Engine
const quiz_controller_1 = require("./quiz.controller");
const quizController = new quiz_controller_1.QuizController();
router.get('/quizzes', quizController.listQuizzes);
router.get('/quizzes/:id', quizController.getQuiz);
router.post('/quizzes/:id/submit', quizController.submitQuiz);
// Centralized Master Timetable Engine (COE & Dean Academics Control)
const master_timetable_controller_1 = require("./master-timetable.controller");
const masterTimetableController = new master_timetable_controller_1.MasterTimetableController();
router.get('/master-timetable/view', masterTimetableController.getCentralizedTimetable);
router.post('/master-timetable/conflict-check', masterTimetableController.runConflictCheck);
router.post('/master-timetable/publish', masterTimetableController.publishTimetable);
router.get('/master-timetable/audit-logs', masterTimetableController.getAuditLogs);
// Enterprise HOD & Dean Workspaces
router.get('/hod/dashboard', departmentScope_1.enforceDepartmentScope, hod_controller_1.HODController.getDashboard);
router.get('/hod/faculty', departmentScope_1.enforceDepartmentScope, hod_controller_1.HODController.getFacultyDirectory);
router.get('/hod/students', departmentScope_1.enforceDepartmentScope, hod_controller_1.HODController.getStudentDirectory);
router.get('/hod/profile', departmentScope_1.enforceDepartmentScope, hod_controller_1.HODController.getHODProfile);
router.get('/dean/dashboard', dean_controller_1.DeanController.getDashboard);
// Enterprise Work Management & Collaboration System (WMCS) Engine
const task_controller_1 = require("./task.controller");
router.get('/tasks/kanban', task_controller_1.TaskController.getKanbanBoard);
router.get('/tasks/workload-analytics', task_controller_1.TaskController.getWorkloadAnalytics);
router.get('/tasks/templates', task_controller_1.TaskController.getTemplates);
router.post('/tasks/templates', task_controller_1.TaskController.createTemplate);
router.post('/tasks', task_controller_1.TaskController.createTask);
router.get('/tasks', task_controller_1.TaskController.getTasks);
router.get('/tasks/:taskId', task_controller_1.TaskController.getTaskById);
router.patch('/tasks/:taskId/status', task_controller_1.TaskController.updateTaskStatus);
router.patch('/tasks/:taskId/checklist', task_controller_1.TaskController.updateChecklist);
router.post('/tasks/:taskId/comments', task_controller_1.TaskController.addComment);
// Enterprise Governance & Digital Document Management Suite
const governance_controller_1 = require("./governance.controller");
router.get('/governance/verify/:qrToken', governance_controller_1.GovernanceController.verifySignature);
router.post('/governance/documents', governance_controller_1.GovernanceController.createDocument);
router.patch('/governance/documents/:id/state', governance_controller_1.GovernanceController.updateState);
router.post('/governance/documents/:id/sign', governance_controller_1.GovernanceController.signDocument);
router.get('/governance/sop-library', governance_controller_1.GovernanceController.getSopLibrary);
router.post('/governance/sop-library', governance_controller_1.GovernanceController.createSopItem);
// Enterprise Executive Portal Architecture Endpoints
const executive_controller_1 = require("./executive.controller");
const executiveController = new executive_controller_1.ExecutiveController();
router.get('/executive/health-scores', executiveController.getDepartmentHealthScores);
router.get('/executive/ai-insights', executiveController.getAIExecutiveInsights);
router.get('/executive/inbox', executiveController.getExecutiveInbox);
router.post('/executive/presence', executiveController.updatePresenceStatus);
router.post('/executive/command-action', executiveController.executeCommandAction);
exports.default = router;
//# sourceMappingURL=enterprise.routes.js.map