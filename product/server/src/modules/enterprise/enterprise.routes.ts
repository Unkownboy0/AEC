import { Router } from 'express';
import { EnterpriseController } from './enterprise.controller';
import { HODController } from './hod.controller';
import { DeanController } from './dean.controller';
import { SearchController } from './search.controller';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { enforceDepartmentScope } from '../../core/middlewares/departmentScope';

const router = Router();
const controller = new EnterpriseController();

// Public QR Code verification endpoint (does not require login)
router.get('/id-card/verify/:token', controller.verifyIdCard);

// Guard all other enterprise endpoints with authentication
router.use(requireAuth);

// ID Cards (requires authentication)
router.get('/id-card/student/:id', controller.getStudentIdCard);
router.get('/id-card/faculty/:id', controller.getFacultyIdCard);

router.post('/bulk-action', controller.bulkAction);
router.get('/search', controller.globalSearch);
router.get('/search/global', SearchController.globalSearch);


// Students
router.get('/students/mapping-validation', controller.getMappingValidation);
router.post('/students/auto-assign', controller.runAutoAssign);
router.get('/students/dashboard-summary', controller.getStudentDashboardSummary);
router.get('/students/hierarchy', enforceDepartmentScope as any, HODController.getYearClassHierarchy);
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
import { PlacementController } from './placement.controller';
const placementController = new PlacementController();
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
import { ComplaintController } from './complaint.controller';
const complaintController = new ComplaintController();
router.get('/complaints/analytics', complaintController.getAnalytics);
router.get('/complaints/feed', complaintController.getFeed);
router.post('/complaints/:id/remarks', complaintController.addInternalRemark);
router.post('/complaints/:id/escalate', complaintController.escalateComplaint);
router.post('/complaints/audit', complaintController.recordAudit);

// Campus Activities Monitoring Center (Read-Only & NAAC/NBA Accreditation Reports)
import { ActivityController } from './activity.controller';
const activityController = new ActivityController();
router.get('/activities/analytics', activityController.getAnalytics);
router.get('/activities/feed', activityController.getFeed);
router.get('/activities/calendar', activityController.getCalendar);
router.post('/activities/audit', activityController.recordAudit);

// Vice Principal (VP) Operations & Monitoring Module
import { VPController } from './vp.controller';
const vpController = new VPController();
router.get('/vp/analytics', vpController.getAnalytics);
router.get('/vp/departments', vpController.getDepartments);
router.get('/vp/feed', vpController.getFeed);
router.post('/vp/escalate', vpController.escalate);
router.post('/vp/audit', vpController.recordAudit);

// Admission Dean Operations Module
import { AdmissionController } from './admission.controller';
const admissionController = new AdmissionController();
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
import { CertificateController } from './certificate.controller';
const certController = new CertificateController();
router.post('/certificates/apply', certController.apply);
router.get('/certificates/my-list', certController.listMyCertificates);
router.get('/certificates/verify/:hash', certController.verify);

// Gamification Engine
import { GamificationController } from './gamification.controller';
const gamificationController = new GamificationController();
router.get('/gamification/profile', gamificationController.getProfile);
router.get('/gamification/leaderboard', gamificationController.getLeaderboard);
router.get('/gamification/rewards', gamificationController.getStoreItems);
router.post('/gamification/redeem', gamificationController.redeemReward);

// Quiz Engine
import { QuizController } from './quiz.controller';
const quizController = new QuizController();
router.get('/quizzes', quizController.listQuizzes);
router.get('/quizzes/:id', quizController.getQuiz);
router.post('/quizzes/:id/submit', quizController.submitQuiz);

// Centralized Master Timetable Engine (COE & Dean Academics Control)
import { MasterTimetableController } from './master-timetable.controller';
const masterTimetableController = new MasterTimetableController();
router.get('/master-timetable/view', masterTimetableController.getCentralizedTimetable);
router.post('/master-timetable/conflict-check', masterTimetableController.runConflictCheck);
router.post('/master-timetable/publish', masterTimetableController.publishTimetable);
router.get('/master-timetable/audit-logs', masterTimetableController.getAuditLogs);

// Enterprise HOD & Dean Workspaces
router.get('/hod/dashboard', enforceDepartmentScope as any, HODController.getDashboard);
router.get('/hod/faculty', enforceDepartmentScope as any, HODController.getFacultyDirectory);
router.get('/hod/students', enforceDepartmentScope as any, HODController.getStudentDirectory);
router.get('/hod/profile', enforceDepartmentScope as any, HODController.getHODProfile);
router.get('/dean/dashboard', DeanController.getDashboard);

// Enterprise Work Management & Collaboration System (WMCS) Engine
import { TaskController } from './task.controller';
router.get('/tasks/kanban', TaskController.getKanbanBoard);
router.get('/tasks/workload-analytics', TaskController.getWorkloadAnalytics);
router.get('/tasks/templates', TaskController.getTemplates);
router.post('/tasks/templates', TaskController.createTemplate);
router.post('/tasks', TaskController.createTask);
router.get('/tasks', TaskController.getTasks);
router.get('/tasks/:taskId', TaskController.getTaskById);
router.patch('/tasks/:taskId/status', TaskController.updateTaskStatus);
router.patch('/tasks/:taskId/checklist', TaskController.updateChecklist);
router.post('/tasks/:taskId/comments', TaskController.addComment);

// Enterprise Governance & Digital Document Management Suite
import { GovernanceController } from './governance.controller';
router.get('/governance/verify/:qrToken', GovernanceController.verifySignature);
router.post('/governance/documents', GovernanceController.createDocument);
router.patch('/governance/documents/:id/state', GovernanceController.updateState);
router.post('/governance/documents/:id/sign', GovernanceController.signDocument);
router.get('/governance/sop-library', GovernanceController.getSopLibrary);
router.post('/governance/sop-library', GovernanceController.createSopItem);

// Enterprise Executive Portal Architecture Endpoints
import { ExecutiveController } from './executive.controller';
const executiveController = new ExecutiveController();
router.get('/executive/health-scores', executiveController.getDepartmentHealthScores);
router.get('/executive/ai-insights', executiveController.getAIExecutiveInsights);
router.get('/executive/inbox', executiveController.getExecutiveInbox);
router.post('/executive/presence', executiveController.updatePresenceStatus);
router.post('/executive/command-action', executiveController.executeCommandAction);

// Realtime Department Availability Board for HOD, Dean, VP, Principal
import { availabilityBoardController } from './availability-board.controller';
router.get(
  '/availability-board',
  requireRole(['HOD', 'DEAN', 'VICE_PRINCIPAL', 'VP', 'PRINCIPAL', 'ADMIN', 'SUPER_ADMIN']),
  availabilityBoardController.getAvailabilityBoard
);

export default router;

