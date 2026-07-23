import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import Settings from '../pages/Settings';
import MasterLists from '../pages/admin/MasterLists';
import MediaLibrary from '../pages/admin/MediaLibrary';
import BackupCenter from '../pages/admin/BackupCenter';
import NotificationCenter from '../pages/admin/NotificationCenter';
import SecurityLogs from '../pages/admin/SecurityLogs';
import ReportsPanel from '../pages/admin/ReportsPanel';

// New Feature Modules
import { Students } from '../pages/admin/Students';
import { Faculty } from '../pages/admin/Faculty';
import { Attendance } from '../pages/admin/Attendance';
import { Examinations as Exams } from '../pages/admin/Examinations';
import { Fees } from '../pages/admin/Fees';
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
import { FacultyCircularsPage } from '../pages/FacultyCircularsPage';

import Profile from '../pages/Profile';

import { useAuth } from '../context/AuthContext';

// React component registry mapping keys to Page Components
const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  dashboard: Dashboard,
  profile: Profile,
  users: Users,
  roles: Roles,
  academics: AcademicPortal,
  masters: MasterLists,
  students: Students,
  faculty: Faculty,
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
};

export const AppRouter: React.FC = () => {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected App Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard is always mapped at index */}
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />

          {/* Dynamically register other routes if permitted */}
          {user?.menus?.filter((m: any) => m.componentKey !== 'dashboard' && m.componentKey !== 'profile').map((m: any) => {
            const PageComp = COMPONENT_MAP[m.componentKey];
            if (!PageComp) return null;
            // Clean leading slashes for sub-routes
            const cleanPath = m.path.startsWith('/') ? m.path.slice(1) : m.path;
            return <Route key={m.componentKey} path={cleanPath} element={<PageComp />} />;
          })}
        </Route>

        {/* Fallback */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-6xl font-extrabold tracking-tight text-primary">404</h1>
      <h2 className="mt-4 text-2xl font-bold tracking-tight">Page Not Found</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        The page you are looking for does not exist or has been relocated.
      </p>
      <a
        href="/"
        className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all duration-200"
      >
        Go Home
      </a>
    </div>
  );
};
