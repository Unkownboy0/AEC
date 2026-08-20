import { Router } from 'express';
import { EnterpriseController } from './enterprise.controller';
import { HODController } from './hod.controller';
import { DeanController } from './dean.controller';
import { SearchController } from './search.controller';
import { requireAuth, requirePermission, requireRole } from '../../core/middlewares/auth.middleware';
import { enforceDepartmentScope } from '../../core/middlewares/departmentScope';
import { requireStudentAccess } from '../security/student-access.middleware';
import { StudentFeeController } from '../fees/student-fee.controller';

import { StudentAchievementsController } from './student-achievements.controller';

const router = Router();
const controller = new EnterpriseController();

// Public QR Code verification endpoint (does not require login)
router.get('/id-card/verify/:token', controller.verifyIdCard);

// Guard all other enterprise endpoints with authentication
router.use(requireAuth);

// Student Achievements
router.get('/students/me/achievements', StudentAchievementsController.getMyAchievements);
router.post('/students/me/achievements', StudentAchievementsController.createAchievement);
router.put('/students/me/achievements/:id/publish', StudentAchievementsController.togglePublish);
router.delete('/students/me/achievements/:id', StudentAchievementsController.deleteAchievement);
router.get('/students/:id/achievements', requireStudentAccess, StudentAchievementsController.getStudentAchievements);

// ID Cards (requires authentication)
router.get('/id-card/student/:id', requireStudentAccess, controller.getStudentIdCard);
router.get('/id-card/faculty/:id', controller.getFacultyIdCard);

router.post('/bulk-action', requireRole(['Super Admin', 'College Admin']), controller.bulkAction);
router.get('/search', SearchController.globalSearch);
router.get('/search/global', SearchController.globalSearch);


// Students
router.get('/students/mapping-validation', controller.getMappingValidation);
router.post('/students/auto-assign', controller.runAutoAssign);
router.get('/students/dashboard-summary', controller.getStudentDashboardSummary);
router.get('/students/hierarchy', enforceDepartmentScope as any, HODController.getYearClassHierarchy);
router.get('/students', controller.listStudents);
router.get('/students/:id/full-profile', requireStudentAccess, controller.getStudentFullProfile);
router.get('/students/:id/id-card/pdf', requireStudentAccess, controller.downloadIdCardPdf);
router.get('/students/:id/attendance/pdf', requireStudentAccess, controller.downloadAttendancePdf);
router.get('/students/:id', requireStudentAccess, controller.getStudent);
router.post('/students', requirePermission('students:write'), controller.createStudent);
router.put('/students/:id', requirePermission('students:write'), controller.updateStudent);
router.delete('/students/:id', requirePermission('students:write'), controller.deleteStudent);

// Faculty
const facultyWriteGuard = requireRole(['Super Admin', 'College Admin', 'HOD', 'Principal']);
router.get('/faculty', controller.listFaculties);
router.get('/faculty/:id/full-profile', controller.getFacultyFullProfile);
router.get('/faculty/:id', controller.getFaculty);
router.post('/faculty', facultyWriteGuard, controller.createFaculty);
router.put('/faculty/:id', facultyWriteGuard, controller.updateFaculty);
router.delete('/faculty/:id', facultyWriteGuard, controller.deleteFaculty);

// Attendance
router.get('/attendance', controller.listAttendances);
router.post('/attendance', controller.recordAttendance);
router.post('/attendance/bulk', controller.recordBulkAttendance);

// Exams
router.get('/exams', controller.listExams);
router.get('/exams/:id', controller.getExam);
router.post('/exams', requireRole(['Examination Cell', 'COE']), controller.createExam);
router.put('/exams/:id', requireRole(['Examination Cell', 'COE']), controller.updateExam);
router.delete('/exams/:id', requireRole(['Examination Cell', 'COE']), controller.deleteExam);

// Marks
router.get('/marks', controller.listMarks);
router.post('/marks', requireRole(['Faculty', 'HOD', 'Academic Dean', 'Examination Cell', 'COE']), controller.recordMark);

// Fees
router.get('/fees/categories', controller.listFeeCategories);
router.post('/fees/categories', requirePermission('fees:write'), controller.createFeeCategory);
router.get('/fees/bills', controller.listFeeBills);
router.post('/fees/bills', requirePermission('fees:write'), controller.createFeeBill);
router.post('/fees/bills/:id/pay', requirePermission('fees:write'), controller.recordPayment);
router.get('/fees/student/portal', StudentFeeController.portal);
router.get('/parent/child/:studentId/fees', StudentFeeController.parentPortal);
router.post('/fees/student/bills/:id/online-order', StudentFeeController.createOrder);
router.post('/fees/student/online-payment/verify', StudentFeeController.verifyOnline);
router.post('/fees/student/bills/:id/external-payment', StudentFeeController.submitExternal);
router.get('/fees/student/payments/:id/receipt', StudentFeeController.receipt);
router.get('/fees/external-payments', requirePermission('fees:write'), StudentFeeController.listExternal);
router.post('/fees/external-payments/:id/review', requirePermission('fees:write'), StudentFeeController.reviewExternal);

// Library
const facilityAdminGuard = requireRole(['Super Admin', 'College Admin', 'Librarian', 'Library Staff']);
router.get('/library/books', controller.listLibraryBooks);
router.get('/library/books/:id', controller.getLibraryBook);
router.post('/library/books', facilityAdminGuard, controller.createLibraryBook);
router.put('/library/books/:id', facilityAdminGuard, controller.updateLibraryBook);
router.delete('/library/books/:id', facilityAdminGuard, controller.deleteLibraryBook);

// Transport
const transportAdminGuard = requireRole(['Super Admin', 'College Admin', 'Transport Manager', 'Transport Staff']);
router.get('/transport/routes', controller.listTransportRoutes);
router.get('/transport/routes/:id', controller.getTransportRoute);
router.post('/transport/routes', transportAdminGuard, controller.createTransportRoute);
router.put('/transport/routes/:id', transportAdminGuard, controller.updateTransportRoute);
router.delete('/transport/routes/:id', transportAdminGuard, controller.deleteTransportRoute);

// Hostel
const hostelAdminGuard = requireRole(['Super Admin', 'College Admin', 'Hostel Warden', 'Hostel Staff']);
router.get('/hostel/buildings', controller.listHostels);
router.get('/hostel/buildings/:id', controller.getHostel);
router.post('/hostel/buildings', hostelAdminGuard, controller.createHostel);
router.put('/hostel/buildings/:id', hostelAdminGuard, controller.updateHostel);
router.delete('/hostel/buildings/:id', hostelAdminGuard, controller.deleteHostel);

// Tickets
router.get('/tickets', controller.listTickets);
router.get('/tickets/:id', controller.getTicket);
router.post('/tickets', controller.createTicket);
router.put('/tickets/:id', controller.updateTicket);
router.delete('/tickets/:id', requireRole([
  'Super Admin', 'College Admin', 'Principal', 'Vice Principal',
  'Academic Dean', 'Admission Dean', 'IQAC Dean', 'Grievance', 'Grievance Officer'
]), controller.deleteTicket);

// Internships
router.get('/internships', controller.listInternships);
router.post('/internships', controller.createInternship);
router.post('/internships/:id/documents', controller.uploadInternshipDocument);
router.get('/internships/documents', controller.listAllInternshipDocuments);
router.post('/internships/documents/:id/verify', controller.verifyInternshipDocument);

// Mentor Assignments & Counseling
const mentorAssignmentGuard = requireRole(['Super Admin', 'College Admin', 'HOD', 'Academic Dean']);
const counselingGuard = requireRole(['Super Admin', 'College Admin', 'HOD', 'Mentor', 'Faculty']);
router.post('/mentors/assign', mentorAssignmentGuard, controller.assignStudentsToMentor);
router.post('/mentors/remove', mentorAssignmentGuard, controller.removeStudentFromMentor);
router.get('/counseling', counselingGuard, controller.listCounselingRecords);
router.post('/counseling', counselingGuard, controller.createCounselingRecord);

// Placements Dashboard (Read-Only & Audit)
import { PlacementController } from './placement.controller';
const placementController = new PlacementController();
router.get('/placements/analytics', placementController.getAnalytics);
router.get('/placements/records', placementController.getRecords);
router.post('/placements/audit', placementController.recordAudit);

// Placement Drive Management
const placementStaffGuard = requireRole(['Super Admin', 'College Admin', 'Placement Officer', 'Placement Coordinator']);
router.get('/placements/drives', placementController.listDrives);
router.post('/placements/drives', placementStaffGuard, placementController.createDrive);
router.put('/placements/drives/:id', placementStaffGuard, placementController.updateDrive);
router.delete('/placements/drives/:id', placementStaffGuard, placementController.deleteDrive);
router.post('/placements/drives/apply', placementController.applyToDrive);
router.get('/placements/student-portal', placementController.getStudentPortal);
router.post('/placements/student/apply', placementController.studentApplyToDrive);
router.post('/placements/student/applications/:id/withdraw', placementController.studentWithdrawApplication);
router.get('/placements/drives/:driveId/applications', placementController.listApplications);
router.put('/placements/applications/:id/status', placementStaffGuard, placementController.updateApplicationStatus);
router.post('/placements/applications/:id/offer-letter', placementStaffGuard, placementController.uploadOfferLetter);

// Complaint Monitoring Center (Institution-Wide Read-Only & Escalation)
import { ComplaintController } from './complaint.controller';
const complaintController = new ComplaintController();
const complaintStaffGuard = requireRole(['Super Admin', 'College Admin', 'Principal', 'Vice Principal', 'HOD', 'Grievance', 'Grievance Officer']);
router.get('/complaints/analytics', complaintStaffGuard, complaintController.getAnalytics);
router.get('/complaints/feed', complaintStaffGuard, complaintController.getFeed);
router.post('/complaints', controller.createTicket);
router.post('/complaints/:id/remarks', complaintStaffGuard, complaintController.addInternalRemark);
router.post('/complaints/:id/escalate', complaintStaffGuard, complaintController.escalateComplaint);
router.post('/complaints/audit', complaintStaffGuard, complaintController.recordAudit);

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
const admissionOperationsGuard = requireRole(['Admission Dean', 'Administration & Admission Dean', 'ADMINISTRATION_AND_ADMISSION_DEAN', 'Super Admin', 'College Admin', 'Principal']);
router.get('/admission/analytics', admissionOperationsGuard, admissionController.getAnalytics);
router.get('/admission/applications', admissionOperationsGuard, admissionController.listApplications);
router.get('/admission/applications/:id', admissionOperationsGuard, admissionController.getApplication);
router.put('/admission/applications/:id/status', admissionOperationsGuard, admissionController.updateApplicationStatus);
router.post('/admission/applications/bulk-status', admissionOperationsGuard, admissionController.bulkUpdateStatus);
router.post('/admission/applications/:id/verify-document', admissionOperationsGuard, admissionController.verifyDocument);
router.get('/admission/seats', admissionOperationsGuard, admissionController.listSeats);
router.post('/admission/seats/allocate', admissionOperationsGuard, admissionController.autoAllocateMeritSeats);
router.post('/admission/seats/:id/allocate', admissionOperationsGuard, admissionController.allocateSeat);
router.post('/admission/seats/:id/transfer', admissionOperationsGuard, admissionController.transferDepartment);
router.get('/admission/enquiries', admissionOperationsGuard, admissionController.listEnquiries);
router.post('/admission/enquiries', admissionOperationsGuard, admissionController.createEnquiry);
router.put('/admission/enquiries/:id', admissionOperationsGuard, admissionController.updateEnquiry);
router.post('/admission/enquiries/:id/convert', admissionOperationsGuard, admissionController.convertEnquiry);
router.get('/admission/counselling', admissionOperationsGuard, admissionController.listCounselling);
router.post('/admission/counselling', admissionOperationsGuard, admissionController.createCounselling);
router.get('/admission/scholarships', admissionOperationsGuard, admissionController.listScholarships);
router.get('/admission/payments', admissionOperationsGuard, admissionController.listPayments);

// Certificate Request Engine
import { CertificateController } from './certificate.controller';
const certController = new CertificateController();
router.post('/certificates/apply', requireRole(['Student']), certController.apply);
router.get('/certificates/my-list', requireRole(['Student']), certController.listMyCertificates);
router.get('/certificates/verify/:hash', certController.verify);
router.get('/certificates/download/:hash', certController.download);

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
const timetableControlGuard = requireRole(['Super Admin', 'College Admin', 'Academic Dean', 'Examination Cell', 'COE']);
router.get('/master-timetable/view', masterTimetableController.getCentralizedTimetable);
router.post('/master-timetable/conflict-check', timetableControlGuard, masterTimetableController.runConflictCheck);
router.post('/master-timetable/publish', timetableControlGuard, masterTimetableController.publishTimetable);
router.get('/master-timetable/audit-logs', timetableControlGuard, masterTimetableController.getAuditLogs);

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
const governanceGuard = requireRole(['Super Admin', 'College Admin', 'Principal', 'Vice Principal', 'Academic Dean', 'Admission Dean', 'IQAC Dean', 'HOD']);
router.get('/governance/verify/:qrToken', GovernanceController.verifySignature);
router.post('/governance/documents', governanceGuard, GovernanceController.createDocument);
router.patch('/governance/documents/:id/state', governanceGuard, GovernanceController.updateState);
router.post('/governance/documents/:id/sign', governanceGuard, GovernanceController.signDocument);
router.get('/governance/sop-library', GovernanceController.getSopLibrary);
router.post('/governance/sop-library', governanceGuard, GovernanceController.createSopItem);

// Enterprise Executive Portal Architecture Endpoints
import { ExecutiveController } from './executive.controller';
const executiveController = new ExecutiveController();
router.get('/executive/health-scores', executiveController.getDepartmentHealthScores);
router.get('/executive/ai-insights', executiveController.getAIExecutiveInsights);
router.get('/executive/inbox', executiveController.getExecutiveInbox);
router.post('/executive/presence', executiveController.updatePresenceStatus);
router.post('/executive/command-action', requireRole(['Super Admin', 'College Admin', 'Principal', 'Vice Principal', 'Academic Dean', 'Admission Dean', 'IQAC Dean']), executiveController.executeCommandAction);

// Realtime Department Availability Board for HOD, Dean, VP, Principal
import { availabilityBoardController } from './availability-board.controller';
import { facultyOperationsController } from './faculty-operations.controller';
router.get(
  '/availability-board',
  requireRole(['HOD', 'DEAN', 'VICE_PRINCIPAL', 'VP', 'PRINCIPAL', 'ADMIN', 'SUPER_ADMIN']),
  availabilityBoardController.getAvailabilityBoard
);
router.get(
  '/faculty-operations',
  requireRole(['HOD', 'VICE_PRINCIPAL', 'VP', 'PRINCIPAL', 'SUPER_ADMIN']),
  facultyOperationsController.getBoard
);
router.get(
  '/faculty-operations/:facultyId',
  requireRole(['HOD', 'VICE_PRINCIPAL', 'VP', 'PRINCIPAL', 'SUPER_ADMIN']),
  facultyOperationsController.getDetail
);

export default router;
