import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import MainLayout from '../components/shared/MainLayout';

// Public Pages
import Login from '../pages/Login';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';

// Protected Admin Pages
import Dashboard from '../pages/Dashboard';
import Roles from '../pages/admin/Roles';
import { AcademicPortal } from '../pages/admin/AcademicPortal';
import Users from '../pages/Users';
import Settings from '../pages/admin/Settings';
import MasterLists from '../pages/admin/MasterLists';
import MediaLibrary from '../pages/admin/MediaLibrary';
import BackupCenter from '../pages/admin/BackupCenter';
import NotificationCenter from '../pages/admin/NotificationCenter';
import SecurityLogs from '../pages/admin/SecurityLogs';
import ReportsPanel from '../pages/admin/ReportsPanel';
import AdministrationDeanCommandCentrePage from '../pages/admin/AdministrationDeanCommandCentrePage';

// New Feature Modules
import { Students } from '../pages/admin/Students';
import { Faculty } from '../pages/admin/Faculty';
import { Attendance } from '../pages/admin/Attendance';
import { Examinations as Exams } from '../pages/admin/Examinations';
import { Fees } from '../pages/admin/Fees';
import FeeLedgerPage from '../modules/fees/pages/FeeLedgerPage';
import FinanceWorkspace from '../modules/finance/FinanceWorkspace';
import { Library } from '../pages/admin/Library';
import { Transport } from '../pages/admin/Transport';
import { Hostel } from '../pages/admin/Hostel';
import { Support as HelpSupport } from '../pages/admin/Support';
import { CollegeOnboarding } from '../pages/admin/CollegeOnboarding';
import { DepartmentOverview } from '../pages/hod/DepartmentOverview';
import { DepartmentResults } from '../pages/hod/DepartmentResults';
import { HODProfile } from '../pages/hod/HODProfile';
import { DepartmentAttendance } from '../pages/hod/DepartmentAttendance';
import { DepartmentSubjects } from '../pages/hod/DepartmentSubjects';
import { AcademicPerformance } from '../pages/hod/AcademicPerformance';
import { FacultyPerformance } from '../pages/hod/FacultyPerformance';
import { DepartmentReports } from '../pages/hod/DepartmentReports';
import { CircularManagement } from '../pages/hod/CircularManagement';
import { TimetableEngine } from '../pages/hod/TimetableEngine';
import { PlacementEngine } from '../pages/admin/PlacementEngine';
import { MasterTimetableManagement } from '../pages/admin/MasterTimetableManagement';
import { IdCardVerify } from '../pages/IdCardVerify';

import HodLeaveOdApprovalDesk from '../pages/hod/HodLeaveOdApprovalDesk';
import HodDashboardWorkspace from '../pages/hod/HodDashboardWorkspace';
import HodStudentWorkspace from '../pages/hod/HodStudentWorkspace';
import HodFacultyWorkspace from '../pages/hod/HodFacultyWorkspace';
import HodAttendanceWorkspace from '../pages/hod/HodAttendanceWorkspace';
import HodTaskWorkspace from '../pages/hod/HodTaskWorkspace';
import HodReportsWorkspace from '../pages/hod/HodReportsWorkspace';

import { WorkManagementWorkspace } from '../pages/enterprise/WorkManagementWorkspace';
import FacultyWorkspaceHub from '../modules/faculty/FacultyWorkspaceHub';
import CampusOfficeWorkspace from '../modules/enterprise/office/CampusOfficeWorkspace';
import HodTimetableControlCenter from '../modules/hod/timetable/HodTimetableControlCenter';
import { GovernanceSuite } from '../pages/enterprise/GovernanceSuite';
import { InstitutionAvailabilityDashboard } from '../pages/shared/InstitutionAvailabilityDashboard';
import { ComplaintsPage } from '../pages/shared/ComplaintsPage';

import Profile from '../pages/Profile';
import UniversalProfilePage from '../pages/profile/UniversalProfilePage';
import InstitutionDetailsPage from '../pages/shared/InstitutionDetailsPage';
import StudentDirectoryPage from '../pages/shared/StudentDirectoryPage';
import { CoeWorkspacePage } from '../modules/deans/pages/CoeWorkspacePage';

// ─── Circulars Module ───────────────────────────────────────────
import { HodCircularPage } from '../modules/circulars/pages/HodCircularPage';
import { FacultyCircularsPage } from '../modules/circulars/pages/FacultyCircularsPage';
import { DeanCircularsPage } from '../modules/circulars/pages/DeanCircularsPage';
import { VpCircularsPage } from '../modules/circulars/pages/VpCircularsPage';
import { PrincipalCircularsPage } from '../modules/circulars/pages/PrincipalCircularsPage';
import { CircularDetailPage } from '../modules/circulars/pages/CircularDetailPage';

// ─── New Workflow Modules ───────────────────────────────────────
import { FacultyLeaveOdPage } from '../modules/faculty/leave-od/pages/FacultyLeaveOdPage';
import { FacultyLeaveDetailPage } from '../modules/faculty/leave-od/pages/FacultyLeaveDetailPage';
import { HodFacultyRequestsPage } from '../modules/hod/faculty-requests/pages/HodFacultyRequestsPage';
import { HodTasksPage } from '../modules/hod/tasks/pages/HodTasksPage';

// ─── Shared Pages ───────────────────────────────────────────────
import { NotificationsPage } from '../pages/shared/NotificationsPage';
import { AccessDenied } from '../pages/AccessDenied';
import { NotFoundPage } from '../components/NotFoundPage';

// Student Pages Imports (Lazy Loaded)
const StudentDashboard = React.lazy(() => import('../pages/student/StudentDashboard'));
const StudentProfile = React.lazy(() => import('../pages/student/StudentProfile'));
const StudentIdCard = React.lazy(() => import('../pages/student/StudentIdCard'));
const StudentSyllabus = React.lazy(() => import('../pages/student/StudentSyllabus'));
const StudentTimetable = React.lazy(() => import('../pages/student/StudentTimetable'));
const StudentAttendance = React.lazy(() => import('../pages/student/StudentAttendance'));
const StudentHomework = React.lazy(() => import('../pages/student/StudentHomework'));
const StudentAssignments = React.lazy(() => import('../pages/student/StudentAssignments'));
const StudentQuiz = React.lazy(() => import('../pages/student/StudentQuiz'));
const StudentExaminations = React.lazy(() => import('../pages/student/StudentExaminations'));
const StudentResults = React.lazy(() => import('../pages/student/StudentResults'));
const StudentLeaveOd = React.lazy(() => import('../pages/student/StudentLeaveOd'));
const StudentAiAssistant = React.lazy(() => import('../pages/student/StudentAiAssistant'));
const StudentPlacements = React.lazy(() => import('../pages/student/StudentPlacements'));
const StudentInternship = React.lazy(() => import('../pages/student/StudentInternship'));
const StudentResumeBuilder = React.lazy(() => import('../pages/student/StudentResumeBuilder'));
const StudentCareerDashboard = React.lazy(() => import('../pages/student/StudentCareerDashboard'));
const StudentLibrary = React.lazy(() => import('../pages/student/StudentLibrary'));
const StudentHostel = React.lazy(() => import('../pages/student/StudentHostel'));
const StudentTransport = React.lazy(() => import('../pages/student/StudentTransport'));
const StudentPortfolio = React.lazy(() => import('../pages/student/StudentPortfolio'));
const StudentSkills = React.lazy(() => import('../pages/student/StudentSkills'));
const StudentClubs = React.lazy(() => import('../pages/student/StudentClubs'));
const StudentDocuments = React.lazy(() => import('../pages/student/StudentDocuments'));
const StudentCirculars = React.lazy(() => import('../pages/student/StudentCirculars'));
const StudentAdvisorChat = React.lazy(() => import('../pages/student/StudentAdvisorChat'));
const StudentNotifications = React.lazy(() => import('../pages/student/StudentNotifications'));
const StudentCalendar = React.lazy(() => import('../pages/student/StudentCalendar'));
const StudentGamification = React.lazy(() => import('../pages/student/StudentGamification'));
const StudentCertificates = React.lazy(() => import('../pages/student/StudentCertificates'));
const StudentAchievements = React.lazy(() => import('../pages/student/StudentAchievements'));

import { useAuth } from '../context/AuthContext';
import { StudentRouteGuard } from './StudentRouteGuard';

import { CurriculumManagementPortal } from '../pages/admin/CurriculumManagementPortal';
import { SportsModule } from '../pages/admin/SportsModule';

import { MasterRBACConsole } from '../pages/admin/MasterRBACConsole';
import { IAMMasterControlConsole } from '../pages/admin/IAMMasterControlConsole';
import { SuperAdminControlCenter } from '../pages/admin/SuperAdminControlCenter';
import ManagementWorkspace from '../pages/management/ManagementWorkspace';

import { PrincipalApprovalCenterPage as PrincipalApprovalCenter } from '../modules/principal-availability/pages/PrincipalApprovalCenterPage';
import { VpActingPrincipalApprovalPage } from '../modules/vp/pages/acting-principal/VpActingPrincipalApprovalPage';
import { VpDelegatedRequestDetailsPage } from '../modules/vp/pages/acting-principal/VpDelegatedRequestDetailsPage';
import { ActingPrincipalRouteGuard } from '../modules/vp/guards/ActingPrincipalRouteGuard';
import PrincipalCommandCentrePage from '../modules/principal/pages/PrincipalCommandCentrePage';
import { VpDashboardPage } from '../modules/vp/pages/VpDashboardPage';

import { AcademicDeanPortal } from '../pages/admin/AcademicDeanPortal';
import { AdmissionDeanPortal } from '../pages/admin/AdmissionDeanPortal';
import { IQACDeanPortal } from '../pages/admin/IQACDeanPortal';
import { IQACExecutivePortal } from '../pages/admin/IQACExecutivePortal';
import { IQACDocumentationPortal } from '../pages/admin/IQACDocumentationPortal';
import ParentWorkspacePortal from '../pages/parent/ParentWorkspacePortal';
import FacultyWorkspacePortal from '../pages/faculty/FacultyWorkspacePortal';
import MentorWorkspacePortal from '../pages/mentor/MentorWorkspacePortal';
import { FacultyDashboard } from '../modules/faculty/FacultyDashboard';
import { CircularCenter } from '../modules/circulars/CircularCenter';
import { DepartmentAvailabilityBoard } from '../components/department/DepartmentAvailabilityBoard';
import { DepartmentAvailabilityPage } from '../modules/department-availability/DepartmentAvailabilityPage';
import { getRoleHome } from '../navigation/role-home';

const superAdminOnly = (element: React.ReactNode) => (
  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'Super Admin']}>{element}</ProtectedRoute>
);
// College Admin is seeded with every permission except settings:*/backups:* (see prisma/seed.ts),
// so it needs access to the same admin console pages as Super Admin, minus those two.
const institutionAdminOnly = (element: React.ReactNode) => (
  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'Super Admin', 'COLLEGE_ADMIN', 'College Admin']}>{element}</ProtectedRoute>
);
const managementOnly = (element: React.ReactNode) => (
  <ProtectedRoute allowedRoles={['MANAGEMENT', 'Management', 'GOVERNING_BODY', 'Governing Body', 'SUPER_ADMIN', 'Super Admin', 'COLLEGE_ADMIN', 'College Admin']}>{element}</ProtectedRoute>
);

// Modular Mentor Pages
import { MentorDashboardPage } from '../modules/mentor/pages/MentorDashboardPage';
import { MentorStudentsPage } from '../modules/mentor/pages/MentorStudentsPage';
import { MentorApprovalsPage } from '../modules/mentor/pages/MentorApprovalsPage';
import { MentorAttendanceOverviewPage } from '../modules/mentor/pages/MentorAttendanceOverviewPage';
import { MentorAcademicsPage } from '../modules/mentor/pages/MentorAcademicsPage';
import { MentorCounsellingPage } from '../modules/mentor/pages/MentorCounsellingPage';
import { MentorParentCommunicationPage } from '../modules/mentor/pages/MentorParentCommunicationPage';
import { MentorMeetingsPage } from '../modules/mentor/pages/MentorMeetingsPage';
import { MentorStudentDetailPage } from '../modules/mentor/pages/MentorStudentDetailPage';
import { HodMentorsWorkspace } from '../pages/hod/HodMentorsWorkspace';

// React component registry mapping keys to Page Components
const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  dashboard: Dashboard,
  faculty_portal: FacultyWorkspacePortal,
  faculty_dashboard: FacultyWorkspacePortal,
  faculty: FacultyWorkspacePortal,
  mentor_portal: MentorWorkspacePortal,
  mentor_dashboard: MentorWorkspacePortal,
  mentor: MentorWorkspacePortal,
  parent_portal: ParentWorkspacePortal,
  parent_dashboard: ParentWorkspacePortal,
  academic_dean_portal: AcademicDeanPortal,
  admission_dean_portal: AdmissionDeanPortal,
  iqac_dean_portal: IQACDeanPortal,
  iqac_executive: IQACExecutivePortal,
  iqac_documentation: IQACDocumentationPortal,
  approval_center: PrincipalApprovalCenter,
  principal_approvals: PrincipalApprovalCenter,
  rbac: IAMMasterControlConsole,
  iam: IAMMasterControlConsole,
  sports: SportsModule,

  curriculum_management: CurriculumManagementPortal,
  curriculum: CurriculumManagementPortal,
  profile: Profile,
  users: Users,
  roles: MasterRBACConsole,
  academics: AcademicPortal,

  masters: MasterLists,
  students: Students,
  faculty_admin: Faculty,
  attendance: Attendance,
  exams: Exams,
  fees: Fees,
  library: Library,
  transport: Transport,
  hostel: Hostel,
  media: MediaLibrary,
  backups: BackupCenter,
  notifications: NotificationCenter,
  security: SecurityLogs,
  reports: ReportsPanel,
  settings: Settings,
  college_onboarding: CollegeOnboarding,
  help: HelpSupport,
  support: HelpSupport,
  department_overview: DepartmentOverview,
  department_results: DepartmentResults,
  hod_profile: HODProfile,
  department_attendance: DepartmentAttendance,
  department_subjects: DepartmentSubjects,
  academic_performance: AcademicPerformance,
  faculty_performance: FacultyPerformance,
  department_reports: DepartmentReports,
  hod_circulars: CircularManagement,
  faculty_circulars: FacultyCircularsPage,
  timetable_engine: TimetableEngine,
  placement_engine: PlacementEngine,
  master_timetable: MasterTimetableManagement,

  hod_dashboard: HodDashboardWorkspace,
  hod_leave_approvals: HodLeaveOdApprovalDesk,
  hod_leave_od: HodLeaveOdApprovalDesk,
  hod_students: HodStudentWorkspace,
  hod_faculty: HodFacultyWorkspace,
  hod_mentors: HodStudentWorkspace,
  hod_attendance: HodAttendanceWorkspace,
  hod_tasks: HodTaskWorkspace,
  hod_reports: HodReportsWorkspace,

  // Enterprise WMCS & Governance Suite
  work_management: WorkManagementWorkspace,
  tasks: WorkManagementWorkspace,
  governance_suite: GovernanceSuite,
  governance: GovernanceSuite,

  // Student Registrations
  student_dashboard: StudentDashboard,
  student_profile: StudentProfile,
  student_id_card: StudentIdCard,
  student_syllabus: StudentSyllabus,
  student_timetable: StudentTimetable,
  student_attendance: StudentAttendance,
  student_homework: StudentHomework,
  student_assignments: StudentAssignments,
  student_quiz: StudentQuiz,
  student_examinations: StudentExaminations,
  student_results: StudentResults,
  student_leave_od: StudentLeaveOd,
  student_ai_assistant: StudentAiAssistant,
  student_placements: StudentPlacements,
  student_internship: StudentInternship,
  student_resume_builder: StudentResumeBuilder,
  student_career_dashboard: StudentCareerDashboard,
  student_library: StudentLibrary,
  student_hostel: StudentHostel,
  student_transport: StudentTransport,
  student_portfolio: StudentPortfolio,
  student_skills: StudentSkills,
  student_clubs: StudentClubs,
  student_documents: StudentDocuments,
  student_circulars: StudentCirculars,
  student_advisor_chat: StudentAdvisorChat,
  student_notifications: StudentNotifications,
  student_calendar: StudentCalendar,
  student_gamification: StudentGamification,
  student_certificates: StudentCertificates,
};

export const AppRouter: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify/:token" element={<IdCardVerify />} />

        {/* Protected App Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Always enter the active role's current workspace; never mount a legacy global dashboard. */}
          <Route index element={<Navigate to={getRoleHome(user)} replace />} />
          <Route path="admin/dashboard" element={institutionAdminOnly(<SuperAdminControlCenter />)} />
          <Route path="management/dashboard" element={managementOnly(<ManagementWorkspace />)} />
          <Route path="governing-body/dashboard" element={managementOnly(<ManagementWorkspace />)} />
          <Route path="admin/control-center" element={institutionAdminOnly(<SuperAdminControlCenter />)} />
          <Route path="admin/people" element={institutionAdminOnly(<Users />)} />
          <Route path="master-lists" element={institutionAdminOnly(<MasterLists />)} />
          <Route path="academics" element={institutionAdminOnly(<AcademicPortal />)} />
          <Route path="backups" element={superAdminOnly(<BackupCenter />)} />
          <Route path="security-logs" element={institutionAdminOnly(<SecurityLogs />)} />
          <Route path="settings" element={superAdminOnly(<Settings />)} />
          <Route path="coe" element={<Navigate to="/coe/dashboard" replace />} />
          <Route path="coe/dashboard" element={<CoeWorkspacePage />} />
          <Route path="coe/exams" element={<Exams />} />
          <Route path="coe/schedules" element={<Exams />} />
          <Route path="coe/halls" element={<Exams />} />
          <Route path="coe/invigilation" element={<Exams />} />
          <Route path="coe/marks-results" element={<Exams />} />
          <Route path="coe/master-timetable" element={<MasterTimetableManagement />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:userId" element={<UniversalProfilePage />} />
          <Route path="users" element={<UniversalProfilePage />} />
          <Route path="users/:userId" element={<UniversalProfilePage />} />
          <Route path="students" element={<StudentDirectoryPage />} />
          <Route path="students/directory" element={<StudentDirectoryPage />} />
          <Route path="students/:userId" element={<UniversalProfilePage />} />
          <Route path="student/profile/:userId" element={<UniversalProfilePage />} />
          <Route path="faculty/profile/:userId" element={<UniversalProfilePage />} />
          <Route path="hod/students/:userId" element={<UniversalProfilePage />} />
          <Route path="hod/faculty/:userId" element={<UniversalProfilePage />} />
          <Route path="principal/students/:userId" element={<UniversalProfilePage />} />
          <Route path="principal/faculty/:userId" element={<UniversalProfilePage />} />
          <Route path="vp/students/:userId" element={<UniversalProfilePage />} />
          <Route path="vp/faculty/:userId" element={<UniversalProfilePage />} />
          <Route path="rbac" element={institutionAdminOnly(<IAMMasterControlConsole />)} />
          <Route path="admin/rbac" element={institutionAdminOnly(<IAMMasterControlConsole />)} />
          <Route path="iam" element={institutionAdminOnly(<IAMMasterControlConsole />)} />
          <Route path="admin/iam" element={institutionAdminOnly(<IAMMasterControlConsole />)} />
          <Route path="roles" element={institutionAdminOnly(<IAMMasterControlConsole />)} />

          <Route path="institution" element={<InstitutionDetailsPage />} />
          <Route path="institution/details" element={<InstitutionDetailsPage />} />
          <Route path="principal/institution" element={<InstitutionDetailsPage />} />
          <Route path="hod/institution" element={<InstitutionDetailsPage />} />
          <Route path="faculty/institution" element={<InstitutionDetailsPage />} />
          <Route path="student/institution" element={<InstitutionDetailsPage />} />
          <Route path="work-management" element={<WorkManagementWorkspace />} />
          <Route path="tasks" element={<WorkManagementWorkspace />} />
          <Route path="governance-suite" element={<GovernanceSuite />} />
          <Route path="governance" element={<GovernanceSuite />} />
          <Route path="approval-center" element={<PrincipalApprovalCenter />} />

          {/* ─── Global Notifications & Circulars ────────── */}
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="circulars" element={<CircularCenter />} />
          <Route path="circulars/:id" element={<CircularDetailPage />} />

          {/* ─── Faculty Routes ───────────────────────────── */}
          <Route path="faculty" element={<Navigate to="/faculty/dashboard" replace />} />
          <Route path="faculty/dashboard" element={<FacultyWorkspacePortal />} />
          <Route path="faculty/hub" element={<FacultyWorkspaceHub />} />
          <Route path="faculty/workspace" element={<FacultyWorkspaceHub />} />
          <Route path="faculty/office" element={<CampusOfficeWorkspace />} />
          <Route path="office" element={<CampusOfficeWorkspace />} />
          <Route path="faculty/timetable" element={<FacultyWorkspacePortal />} />
          <Route path="faculty/subjects" element={<FacultyWorkspacePortal />} />
          <Route path="faculty/attendance" element={<FacultyWorkspacePortal />} />
          <Route path="faculty/assignments" element={<FacultyWorkspacePortal />} />
          <Route path="faculty/internal-marks" element={<AcademicPerformance />} />
          <Route path="faculty/marks" element={<AcademicPerformance />} />
          <Route path="faculty/students" element={<StudentDirectoryPage />} />
          <Route path="faculty/leave" element={<FacultyLeaveOdPage />} />
          <Route path="faculty/leave-request" element={<FacultyLeaveOdPage />} />
          <Route path="faculty/leave-od" element={<FacultyLeaveOdPage />} />
          <Route path="faculty/leave-od/:id" element={<FacultyLeaveDetailPage />} />
          <Route path="faculty/tasks" element={<FacultyWorkspacePortal />} />
          <Route path="faculty/department-availability" element={<DepartmentAvailabilityPage />} />
          <Route path="faculty/availability" element={<DepartmentAvailabilityPage />} />
          <Route path="faculty/ai_assistant" element={<FacultyWorkspacePortal />} />
          <Route path="faculty/profile" element={<Profile />} />
          <Route path="faculty/reports" element={<AcademicPerformance />} />

          {/* ─── Faculty Mentor Workspace Sub-Routes ─────── */}
          <Route path="faculty/mentor" element={<Navigate to="/faculty/mentor/dashboard" replace />} />
          <Route path="faculty/mentor/dashboard" element={<MentorDashboardPage />} />
          <Route path="faculty/mentor/students" element={<MentorStudentsPage />} />
          <Route path="faculty/mentor/students/:studentId" element={<MentorStudentDetailPage />} />
          <Route path="faculty/mentor/leave-od" element={<MentorApprovalsPage />} />
          <Route path="faculty/mentor/attendance" element={<MentorAttendanceOverviewPage />} />
          <Route path="faculty/mentor/academics" element={<MentorAcademicsPage />} />
          <Route path="faculty/mentor/counselling" element={<MentorCounsellingPage />} />
          <Route path="faculty/mentor/parents" element={<MentorParentCommunicationPage />} />
          <Route path="faculty/mentor/meetings" element={<MentorMeetingsPage />} />
          <Route path="faculty/mentor/tasks" element={<MentorDashboardPage />} />
          <Route path="faculty/mentor/messages" element={<MentorDashboardPage />} />
          <Route path="faculty/mentor/reports" element={<MentorDashboardPage />} />
          <Route path="faculty/mentor/department-availability" element={<DepartmentAvailabilityPage />} />

          {/* Faculty Circulars — registered */}
          <Route path="faculty/circulars" element={<FacultyCircularsPage />} />
          <Route path="faculty/circulars/:id" element={<CircularDetailPage />} />
          <Route path="faculty/notifications" element={<NotificationsPage />} />

          {/* ─── Mentor Route Alias ───────────────────────── */}
          <Route path="mentor" element={<Navigate to="/faculty/mentor/dashboard" replace />} />

          {/* ─── Principal Workspace Routes ───────────────── */}
          <Route path="principal" element={<Navigate to="/principal/dashboard" replace />} />
          <Route path="principal/dashboard" element={<PrincipalCommandCentrePage />} />
          <Route path="principal/approval-center" element={<PrincipalApprovalCenter />} />
          <Route path="principal/department-availability" element={<DepartmentAvailabilityPage />} />
          <Route path="principal/departments" element={<InstitutionDetailsPage />} />
          <Route path="principal/faculty" element={<InstitutionDetailsPage />} />
          <Route path="principal/faculty/:userId" element={<UniversalProfilePage />} />
          <Route path="principal/students" element={<StudentDirectoryPage />} />
          <Route path="principal/students/:userId" element={<UniversalProfilePage />} />
          <Route path="principal/academics" element={<AcademicPerformance />} />
          <Route path="principal/tasks" element={<WorkManagementWorkspace />} />
          <Route path="principal/circulars" element={<PrincipalCircularsPage />} />
          <Route path="principal/circulars/:id" element={<CircularDetailPage />} />
          <Route path="principal/complaints" element={<ComplaintsPage />} />
          <Route path="principal/reports" element={<ReportsPanel />} />
          <Route path="principal/placement" element={<PlacementEngine />} />
          <Route path="principal/delegation" element={<DepartmentAvailabilityPage />} />
          <Route path="principal/search" element={<InstitutionDetailsPage />} />
          <Route path="principal/profile" element={<Profile />} />
          <Route path="principal/notifications" element={<NotificationsPage />} />

          {/* ─── Vice Principal Workspace Routes ──────────── */}
          <Route path="vp" element={<Navigate to="/vp/dashboard" replace />} />
          <Route path="vp/dashboard" element={<VpDashboardPage />} />
          <Route path="vp/operations" element={<VpDashboardPage />} />
          <Route path="vp/departments" element={<InstitutionDetailsPage />} />
          <Route path="vp/faculty" element={<InstitutionDetailsPage />} />
          <Route path="vp/students" element={<StudentDirectoryPage />} />
          <Route path="vp/attendance" element={<DepartmentAvailabilityPage />} />
          <Route path="vp/leave-approvals" element={<VpActingPrincipalApprovalPage />} />
          <Route path="vp/examinations" element={<AcademicPerformance />} />
          <Route path="vp/placements" element={<PlacementEngine />} />
          <Route path="vp/complaints" element={<ComplaintsPage />} />
          <Route path="vp/activities" element={<ReportsPanel />} />
          <Route path="vp/reports" element={<ReportsPanel />} />
          <Route path="vp/department-availability" element={<DepartmentAvailabilityPage />} />
          <Route path="vp/circulars" element={<VpCircularsPage />} />
          <Route path="vp/circulars/:id" element={<CircularDetailPage />} />
          <Route path="vp/notifications" element={<NotificationsPage />} />
          <Route path="vp/tasks" element={<WorkManagementWorkspace />} />
          <Route path="vp/profile" element={<Profile />} />

          {/* VP Acting Principal Delegated Approvals */}
          <Route
            path="vp/acting-principal/approvals"
            element={
              <ActingPrincipalRouteGuard>
                <VpActingPrincipalApprovalPage />
              </ActingPrincipalRouteGuard>
            }
          />
          <Route
            path="vp/acting-principal/approval-center"
            element={
              <ActingPrincipalRouteGuard>
                <VpActingPrincipalApprovalPage />
              </ActingPrincipalRouteGuard>
            }
          />
          <Route
            path="vp/acting-principal/approvals/:requestId"
            element={
              <ActingPrincipalRouteGuard>
                <VpDelegatedRequestDetailsPage />
              </ActingPrincipalRouteGuard>
            }
          />

          {/* ─── Executive Availability Routes ────────────────── */}
          <Route path="institution/availability" element={<InstitutionAvailabilityDashboard />} />
          <Route path="vp/department-availability" element={<InstitutionAvailabilityDashboard />} />

          {/* ─── Academic Dean Routes ─────────────────────── */}
          <Route path="academic-dean" element={<Navigate to="/academic-dean/dashboard" replace />} />
          <Route path="academic-dean/dashboard" element={<AcademicDeanPortal user={user} />} />
          <Route path="academic-dean/academics" element={<AcademicDeanPortal user={user} />} />
          <Route path="academic-dean/tasks" element={<AcademicDeanPortal user={user} />} />
          <Route path="academic-dean/department-availability" element={<InstitutionAvailabilityDashboard />} />
          <Route path="academic-dean/circulars" element={<DeanCircularsPage />} />
          <Route path="academic-dean/circulars/:id" element={<CircularDetailPage />} />
          <Route path="academic-dean/reports" element={<AcademicDeanPortal user={user} />} />
          <Route path="academic-dean/notifications" element={<NotificationsPage />} />

          {/* ─── Admission Dean Routes ────────────────────── */}
          <Route path="admission-dean" element={<Navigate to="/admission-dean/dashboard" replace />} />
          <Route path="admission-dean/dashboard" element={<AdministrationDeanCommandCentrePage />} />
          <Route path="admission-dean/admissions" element={<AdmissionDeanPortal user={user} />} />
          <Route path="admission-dean/approvals" element={<AdmissionDeanPortal user={user} />} />
          <Route path="admission-dean/tasks" element={<WorkManagementWorkspace />} />
          <Route path="admission-dean/coordination" element={<AdmissionDeanPortal user={user} />} />
          <Route path="admission-dean/students" element={<StudentDirectoryPage />} />
          <Route path="admission-dean/complaints" element={<ComplaintsPage />} />
          <Route path="admission-dean/hostel" element={<AdministrationDeanCommandCentrePage />} />
          <Route path="admission-dean/services" element={<AdministrationDeanCommandCentrePage />} />
          <Route path="admission-dean/department-availability" element={<DepartmentAvailabilityPage />} />
          <Route path="admission-dean/circulars" element={<DeanCircularsPage />} />
          <Route path="admission-dean/circulars/:id" element={<CircularDetailPage />} />
          <Route path="admission-dean/reports" element={<AdministrationDeanCommandCentrePage />} />
          <Route path="admission-dean/notifications" element={<NotificationsPage />} />
          <Route path="admission-dean/profile" element={<UniversalProfilePage />} />

          {/* ─── IQAC Dean Routes ─────────────────────────── */}
          <Route path="iqac-dean" element={<IQACDeanPortal user={user} />} />
          <Route path="iqac-executive" element={<IQACExecutivePortal user={user} />} />
          <Route path="iqac-documentation" element={<IQACDocumentationPortal user={user} />} />
          <Route path="iqac" element={<Navigate to="/iqac/dashboard" replace />} />
          <Route path="iqac/dashboard" element={<IQACDeanPortal user={user} />} />
          <Route path="iqac/accreditation" element={<IQACDeanPortal user={user} />} />
          <Route path="iqac/tasks" element={<WorkManagementWorkspace />} />
          <Route path="iqac/evidence" element={<IQACDeanPortal user={user} />} />
          <Route path="iqac/department-availability" element={<DepartmentAvailabilityPage />} />
          <Route path="iqac/circulars" element={<DeanCircularsPage />} />
          <Route path="iqac/circulars/:id" element={<CircularDetailPage />} />
          <Route path="iqac/reports" element={<IQACDeanPortal user={user} />} />
          <Route path="iqac/notifications" element={<NotificationsPage />} />

          {/* ─── HOD Portal Direct Routes ─────────────────── */}
          <Route path="hod" element={<Navigate to="/hod/dashboard" replace />} />
          <Route path="hod/dashboard" element={<HodDashboardWorkspace />} />
          <Route path="hod/approvals" element={<HodLeaveOdApprovalDesk />} />
          <Route path="hod/leave-approvals" element={<HodLeaveOdApprovalDesk />} />
          <Route path="hod/leave-od" element={<HodLeaveOdApprovalDesk />} />
          <Route path="hod/faculty-requests" element={<HodFacultyRequestsPage />} />
          <Route path="hod/faculty-requests/:id" element={<FacultyLeaveDetailPage />} />
          <Route path="hod/students" element={<HodStudentWorkspace />} />
          <Route path="hod/faculty" element={<HodFacultyWorkspace />} />
          <Route path="hod/mentors" element={<HodMentorsWorkspace />} />
          <Route path="hod/academics" element={<AcademicPerformance />} />
          <Route path="hod/academic-performance" element={<AcademicPerformance />} />
          <Route path="hod/department-overview" element={<DepartmentOverview />} />
          <Route path="hod/department-results" element={<DepartmentResults />} />
          <Route path="hod/faculty-performance" element={<FacultyPerformance />} />
          <Route path="hod/subjects" element={<DepartmentSubjects />} />
          <Route path="hod/attendance" element={<HodAttendanceWorkspace />} />
          <Route path="hod/timetable" element={<HodTimetableControlCenter />} />
          <Route path="hod/timetable-control" element={<HodTimetableControlCenter />} />
          <Route path="hod/tasks" element={<HodTasksPage />} />
          <Route path="hod/tasks/:id" element={<HodTasksPage />} />
          <Route path="hod/circulars" element={<HodCircularPage />} />
          <Route path="hod/circulars/:id" element={<CircularDetailPage />} />
          <Route path="hod/department-availability" element={<DepartmentAvailabilityPage />} />
          <Route path="hod/board" element={<DepartmentAvailabilityPage />} />
          <Route path="hod/complaints" element={<ComplaintsPage />} />
          <Route path="hod/activities" element={<HodReportsWorkspace />} />
          <Route path="hod/reports" element={<HodReportsWorkspace />} />
          <Route path="hod/profile" element={<HODProfile />} />
          {/* HOD Notifications — was MISSING */}
          <Route path="hod/notifications" element={<NotificationsPage />} />

          {/* ─── Faculty Portal Direct Routes ─────────────────── */}
          <Route path="faculty/leave-od" element={<FacultyLeaveOdPage />} />
          <Route path="faculty/leave-od/:id" element={<FacultyLeaveDetailPage />} />
          <Route path="faculty/leave" element={<FacultyLeaveOdPage />} />

          {/* ─── Student Direct Routes (Prevent 404 on Direct Links) ─── */}
          <Route path="student" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="student/dashboard" element={<React.Suspense fallback={<div className="p-6">Loading...</div>}><StudentDashboard /></React.Suspense>} />
          <Route path="student/profile" element={<React.Suspense fallback={<div className="p-6">Loading...</div>}><StudentProfile /></React.Suspense>} />
          <Route path="student/id-card" element={<React.Suspense fallback={<div className="p-6">Loading...</div>}><StudentIdCard /></React.Suspense>} />
          <Route path="student/syllabus" element={<React.Suspense fallback={<div className="p-6">Loading...</div>}><StudentSyllabus /></React.Suspense>} />
          <Route path="student/timetable" element={<React.Suspense fallback={<div className="p-6">Loading...</div>}><StudentTimetable /></React.Suspense>} />
          <Route path="student/attendance" element={<React.Suspense fallback={<div className="p-6">Loading...</div>}><StudentAttendance /></React.Suspense>} />
          <Route path="student/assignments" element={<React.Suspense fallback={<div className="p-6">Loading...</div>}><StudentAssignments /></React.Suspense>} />
          <Route path="student/results" element={<React.Suspense fallback={<div className="p-6">Loading...</div>}><StudentResults /></React.Suspense>} />
          <Route path="student/examinations" element={<React.Suspense fallback={<div className="p-6">Loading...</div>}><StudentExaminations /></React.Suspense>} />
          <Route path="student/leave-od" element={<React.Suspense fallback={<div className="p-6">Loading...</div>}><StudentLeaveOd /></React.Suspense>} />
          <Route path="student/fees" element={<FeeLedgerPage />} />
          <Route path="accountant/*" element={<FinanceWorkspace />} />
          <Route path="ao/*" element={<FinanceWorkspace />} />
          <Route path="principal/finance" element={<FinanceWorkspace />} />
          <Route path="student/circulars" element={<React.Suspense fallback={<div className="p-6">Loading...</div>}><StudentCirculars /></React.Suspense>} />
          <Route path="student/circulars/:id" element={<CircularDetailPage />} />
          <Route path="student/messages" element={<React.Suspense fallback={<div className="p-6">Loading...</div>}><StudentAdvisorChat /></React.Suspense>} />
          <Route path="student/placements" element={<React.Suspense fallback={<div className="p-6">Loading...</div>}><StudentPlacements /></React.Suspense>} />
          <Route path="student/documents" element={<React.Suspense fallback={<div className="p-6">Loading...</div>}><StudentDocuments /></React.Suspense>} />
          <Route path="student/achievements" element={<React.Suspense fallback={<div className="p-6">Loading...</div>}><StudentAchievements /></React.Suspense>} />
          <Route path="student/hostel" element={<React.Suspense fallback={<div className="p-6">Loading...</div>}><StudentHostel /></React.Suspense>} />
          <Route path="student/transport" element={<React.Suspense fallback={<div className="p-6">Loading...</div>}><StudentTransport /></React.Suspense>} />
          <Route path="student/complaints" element={<ComplaintsPage />} />
          <Route path="student/notifications" element={<NotificationsPage />} />

          {/* ─── Parent Direct Routes (Prevent 404 on Direct Links) ─── */}
          <Route path="parent" element={<Navigate to="/parent/dashboard" replace />} />
          <Route path="parent/dashboard" element={<ParentWorkspacePortal />} />
          <Route path="parent/attendance" element={<ParentWorkspacePortal />} />
          <Route path="parent/marks" element={<ParentWorkspacePortal />} />
          <Route path="parent/timetable" element={<ParentWorkspacePortal />} />
          <Route path="parent/fees" element={<ParentWorkspacePortal />} />
          <Route path="parent/messages" element={<ParentWorkspacePortal />} />
          <Route path="parent/circulars" element={<ParentWorkspacePortal />} />
          <Route path="parent/profile" element={<ParentWorkspacePortal />} />

          {/* Access Denied — shown for unauthorized routes, not 404 */}
          <Route path="access-denied" element={<AccessDenied />} />

          {/* Dynamically register other admin routes if permitted
              (excluding HOD and Faculty paths to prevent blank screen overrides) */}
          {user?.menus?.filter((m: any) =>
            m.componentKey !== 'dashboard' &&
            m.componentKey !== 'profile' &&
            !m.path?.startsWith('/hod') &&
            !m.path?.startsWith('hod') &&
            !m.path?.startsWith('/faculty') &&
            !m.path?.startsWith('faculty') &&
            !m.path?.startsWith('/principal') &&
            !m.path?.startsWith('principal') &&
            !m.path?.startsWith('/vp') &&
            !m.path?.startsWith('vp') &&
            !m.path?.startsWith('/academic-dean') &&
            !m.path?.startsWith('academic-dean') &&
            !m.path?.startsWith('/admission-dean') &&
            !m.path?.startsWith('admission-dean') &&
            !m.path?.startsWith('/iqac') &&
            !m.path?.startsWith('iqac')
          ).map((m: any) => {
            const PageComp = COMPONENT_MAP[m.componentKey];
            if (!PageComp) return null;
            // Clean leading slashes for sub-routes
            const cleanPath = m.path.startsWith('/') ? m.path.slice(1) : m.path;

            // Check if this is a student route
            const isStudentRoute = m.componentKey.startsWith('student_');

            const element = isStudentRoute ? (
              <StudentRouteGuard>
                <React.Suspense fallback={
                  <div className="p-6 space-y-4 animate-pulse">
                    <div className="h-8 bg-muted rounded w-1/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="h-32 bg-muted rounded-xl"></div>
                      <div className="h-32 bg-muted rounded-xl"></div>
                      <div className="h-32 bg-muted rounded-xl"></div>
                    </div>
                  </div>
                }>
                  <PageComp />
                </React.Suspense>
              </StudentRouteGuard>
            ) : (
              <PageComp />
            );

            return <Route key={m.componentKey} path={cleanPath} element={element} />;
          })}

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Fallback */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
