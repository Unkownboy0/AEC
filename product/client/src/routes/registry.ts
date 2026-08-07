export interface RouteDefinition {
  id: string;
  path: string;
  label: string;
  role: 'FACULTY' | 'MENTOR' | 'HOD' | 'ACADEMIC_DEAN' | 'ADMISSION_DEAN' | 'IQAC_DEAN' | 'PRINCIPAL' | 'VP' | 'SHARED' | 'STUDENT' | 'PARENT' | 'SUPER_ADMIN' | 'ACCOUNTANT';
  icon: string;
  inSidebar?: boolean;
  inBottomNav?: boolean;
  badgeKey?: string;
}

export const ROUTE_REGISTRY: RouteDefinition[] = [
  // ─── Student Routes ─────────────────────────────────────────────
  { id: 'stu-dash', path: '/student/dashboard', label: 'Dashboard', role: 'STUDENT', icon: 'LayoutDashboard', inSidebar: true, inBottomNav: true },
  { id: 'stu-academics', path: '/student/attendance', label: 'Academics', role: 'STUDENT', icon: 'BookOpen', inSidebar: true, inBottomNav: true },
  { id: 'stu-tasks', path: '/student/assignments', label: 'Tasks', role: 'STUDENT', icon: 'CheckSquare', inSidebar: true, inBottomNav: true },
  { id: 'stu-messages', path: '/student/messages', label: 'Messages', role: 'STUDENT', icon: 'MessageSquare', inSidebar: true, inBottomNav: true },
  { id: 'stu-profile', path: '/student/profile', label: 'Profile', role: 'STUDENT', icon: 'User', inSidebar: true, inBottomNav: true },
  { id: 'stu-id-card', path: '/student/id-card', label: 'ID Card', role: 'STUDENT', icon: 'CreditCard', inSidebar: true, inBottomNav: false },
  { id: 'stu-syllabus', path: '/student/syllabus', label: 'Syllabus', role: 'STUDENT', icon: 'Book', inSidebar: true, inBottomNav: false },
  { id: 'stu-timetable', path: '/student/timetable', label: 'Timetable', role: 'STUDENT', icon: 'Clock', inSidebar: true, inBottomNav: false },
  { id: 'stu-results', path: '/student/results', label: 'Results', role: 'STUDENT', icon: 'Award', inSidebar: true, inBottomNav: false },
  { id: 'stu-leave-od', path: '/student/leave-od', label: 'Leave & OD', role: 'STUDENT', icon: 'FileCheck', inSidebar: true, inBottomNav: false },
  { id: 'stu-fees', path: '/student/fees', label: 'Fees & Receipts', role: 'STUDENT', icon: 'Landmark', inSidebar: true, inBottomNav: false },
  { id: 'stu-circulars', path: '/student/circulars', label: 'Circulars', role: 'STUDENT', icon: 'Megaphone', inSidebar: true, inBottomNav: false },

  // ─── Parent Routes ──────────────────────────────────────────────
  { id: 'par-dash', path: '/parent/dashboard', label: 'Dashboard', role: 'PARENT', icon: 'LayoutDashboard', inSidebar: true, inBottomNav: true },
  { id: 'par-attendance', path: '/parent/attendance', label: 'Attendance', role: 'PARENT', icon: 'Clock', inSidebar: true, inBottomNav: true },
  { id: 'par-marks', path: '/parent/marks', label: 'Academic Marks', role: 'PARENT', icon: 'Award', inSidebar: true, inBottomNav: true },
  { id: 'par-fees', path: '/parent/fees', label: 'Fee Desk', role: 'PARENT', icon: 'Landmark', inSidebar: true, inBottomNav: true },
  { id: 'par-profile', path: '/parent/profile', label: 'Profile', role: 'PARENT', icon: 'User', inSidebar: true, inBottomNav: true },

  // ─── Faculty Routes ─────────────────────────────────────────────
  { id: 'fac-dash', path: '/faculty/dashboard', label: 'Dashboard', role: 'FACULTY', icon: 'LayoutDashboard', inSidebar: true, inBottomNav: true },
  { id: 'fac-timetable', path: '/faculty/timetable', label: 'My Timetable', role: 'FACULTY', icon: 'Clock', inSidebar: true, inBottomNav: false },
  { id: 'fac-subjects', path: '/faculty/subjects', label: 'My Subjects', role: 'FACULTY', icon: 'BookOpen', inSidebar: true, inBottomNav: false },
  { id: 'fac-attendance', path: '/faculty/attendance', label: 'Period Attendance', role: 'FACULTY', icon: 'CheckSquare', inSidebar: true, inBottomNav: true },
  { id: 'fac-assignments', path: '/faculty/assignments', label: 'Assignments', role: 'FACULTY', icon: 'FileText', inSidebar: true, inBottomNav: false },
  { id: 'fac-marks', path: '/faculty/internal-marks', label: 'Internal Marks', role: 'FACULTY', icon: 'Award', inSidebar: true, inBottomNav: false },
  { id: 'fac-students', path: '/faculty/students', label: 'Students', role: 'FACULTY', icon: 'Users', inSidebar: true, inBottomNav: true },
  { id: 'fac-leave-od', path: '/faculty/leave-od', label: 'Leave & OD', role: 'FACULTY', icon: 'FileCheck', inSidebar: true, inBottomNav: false },
  { id: 'fac-tasks', path: '/faculty/tasks', label: 'Tasks', role: 'FACULTY', icon: 'CheckSquare', inSidebar: true, inBottomNav: true },
  { id: 'fac-circulars', path: '/faculty/circulars', label: 'Circulars', role: 'FACULTY', icon: 'Megaphone', inSidebar: true, inBottomNav: false },
  { id: 'fac-availability', path: '/faculty/department-availability', label: 'Department Board', role: 'FACULTY', icon: 'Calendar', inSidebar: true, inBottomNav: false },
  { id: 'fac-profile', path: '/faculty/profile', label: 'Profile', role: 'FACULTY', icon: 'User', inSidebar: true, inBottomNav: true },

  // ─── Mentor Routes ──────────────────────────────────────────────
  { id: 'men-dash', path: '/faculty/mentor/dashboard', label: 'Mentor Dashboard', role: 'MENTOR', icon: 'Heart', inSidebar: true, inBottomNav: true },
  { id: 'men-students', path: '/faculty/mentor/students', label: 'Assigned Students', role: 'MENTOR', icon: 'Users', inSidebar: true, inBottomNav: true },
  { id: 'men-approvals', path: '/faculty/mentor/leave-od', label: 'Student Leave & OD', role: 'MENTOR', icon: 'FileCheck', inSidebar: true, inBottomNav: true },
  { id: 'men-attendance', path: '/faculty/mentor/attendance', label: 'Attendance Risk', role: 'MENTOR', icon: 'Clock', inSidebar: true, inBottomNav: false },
  { id: 'men-academics', path: '/faculty/mentor/academics', label: 'Academic Risk', role: 'MENTOR', icon: 'BookOpen', inSidebar: true, inBottomNav: false },
  { id: 'men-counselling', path: '/faculty/mentor/counselling', label: 'Counselling', role: 'MENTOR', icon: 'MessageSquare', inSidebar: true, inBottomNav: false },
  { id: 'men-parents', path: '/faculty/mentor/parents', label: 'Parent Follow-ups', role: 'MENTOR', icon: 'UserCheck', inSidebar: true, inBottomNav: false },
  { id: 'men-meetings', path: '/faculty/mentor/meetings', label: 'Meetings', role: 'MENTOR', icon: 'Calendar', inSidebar: true, inBottomNav: false },
  { id: 'men-tasks', path: '/faculty/mentor/tasks', label: 'Student Tasks', role: 'MENTOR', icon: 'CheckSquare', inSidebar: true, inBottomNav: false },
  { id: 'men-availability', path: '/faculty/mentor/department-availability', label: 'Department Board', role: 'MENTOR', icon: 'Calendar', inSidebar: true, inBottomNav: false },

  // ─── HOD Routes ─────────────────────────────────────────────────
  { id: 'hod-dash', path: '/hod/dashboard', label: 'Dashboard', role: 'HOD', icon: 'LayoutDashboard', inSidebar: true, inBottomNav: true },
  { id: 'hod-approvals', path: '/hod/approvals', label: 'Approvals', role: 'HOD', icon: 'FileCheck', inSidebar: true, inBottomNav: true },
  { id: 'hod-students', path: '/hod/students', label: 'Students', role: 'HOD', icon: 'Users', inSidebar: true, inBottomNav: false },
  { id: 'hod-faculty', path: '/hod/faculty', label: 'Faculty', role: 'HOD', icon: 'UserCheck', inSidebar: true, inBottomNav: false },
  { id: 'hod-mentors', path: '/hod/mentors', label: 'Mentors', role: 'HOD', icon: 'UserPlus', inSidebar: true, inBottomNav: false },
  { id: 'hod-academics', path: '/hod/academics', label: 'Academics', role: 'HOD', icon: 'BookOpen', inSidebar: true, inBottomNav: false },
  { id: 'hod-attendance', path: '/hod/attendance', label: 'Attendance', role: 'HOD', icon: 'Clock', inSidebar: true, inBottomNav: false },
  { id: 'hod-timetable', path: '/hod/timetable', label: 'Timetable', role: 'HOD', icon: 'Calendar', inSidebar: true, inBottomNav: false },
  { id: 'hod-tasks', path: '/hod/tasks', label: 'Tasks', role: 'HOD', icon: 'CheckSquare', inSidebar: true, inBottomNav: true },
  { id: 'hod-circulars', path: '/hod/circulars', label: 'Circulars', role: 'HOD', icon: 'Megaphone', inSidebar: true, inBottomNav: false },
  { id: 'hod-availability', path: '/hod/department-availability', label: 'Department Board', role: 'HOD', icon: 'Building2', inSidebar: true, inBottomNav: true },
  { id: 'hod-reports', path: '/hod/reports', label: 'Reports', role: 'HOD', icon: 'BarChart3', inSidebar: true, inBottomNav: false },
  { id: 'hod-profile', path: '/hod/profile', label: 'Profile', role: 'HOD', icon: 'User', inSidebar: true, inBottomNav: true },

  // ─── Academic Dean Routes ───────────────────────────────────────
  { id: 'dean-dash', path: '/academic-dean/dashboard', label: 'Dashboard', role: 'ACADEMIC_DEAN', icon: 'LayoutDashboard', inSidebar: true, inBottomNav: true },
  { id: 'dean-programs', path: '/academic-dean/programs', label: 'Programs', role: 'ACADEMIC_DEAN', icon: 'BookOpen', inSidebar: true, inBottomNav: false },
  { id: 'dean-departments', path: '/academic-dean/departments', label: 'Departments', role: 'ACADEMIC_DEAN', icon: 'Building2', inSidebar: true, inBottomNav: true },
  { id: 'dean-tasks', path: '/academic-dean/tasks', label: 'Tasks', role: 'ACADEMIC_DEAN', icon: 'CheckSquare', inSidebar: true, inBottomNav: false },
  { id: 'dean-attendance', path: '/academic-dean/attendance', label: 'Attendance', role: 'ACADEMIC_DEAN', icon: 'Clock', inSidebar: true, inBottomNav: false },
  { id: 'dean-timetable', path: '/academic-dean/timetable', label: 'Timetables', role: 'ACADEMIC_DEAN', icon: 'Calendar', inSidebar: true, inBottomNav: false },
  { id: 'dean-exams', path: '/academic-dean/examinations', label: 'Examinations', role: 'ACADEMIC_DEAN', icon: 'Award', inSidebar: true, inBottomNav: false },
  { id: 'dean-circulars', path: '/academic-dean/circulars', label: 'Circulars', role: 'ACADEMIC_DEAN', icon: 'Megaphone', inSidebar: true, inBottomNav: false },
  { id: 'dean-availability', path: '/academic-dean/department-availability', label: 'Availability Board', role: 'ACADEMIC_DEAN', icon: 'Calendar', inSidebar: true, inBottomNav: true },
  { id: 'dean-reports', path: '/academic-dean/reports', label: 'Reports', role: 'ACADEMIC_DEAN', icon: 'BarChart3', inSidebar: true, inBottomNav: false },
  { id: 'dean-profile', path: '/academic-dean/profile', label: 'Profile', role: 'ACADEMIC_DEAN', icon: 'User', inSidebar: true, inBottomNav: true },

  // ─── Admission Dean Routes ──────────────────────────────────────
  { id: 'adm-dash', path: '/admission-dean/dashboard', label: 'Dashboard', role: 'ADMISSION_DEAN', icon: 'LayoutDashboard', inSidebar: true, inBottomNav: true },
  { id: 'adm-list', path: '/admission-dean/admissions', label: 'Admissions Desk', role: 'ADMISSION_DEAN', icon: 'Users', inSidebar: true, inBottomNav: true },
  { id: 'adm-tasks', path: '/admission-dean/tasks', label: 'Tasks', role: 'ADMISSION_DEAN', icon: 'CheckSquare', inSidebar: true, inBottomNav: false },
  { id: 'adm-availability', path: '/admission-dean/department-availability', label: 'Availability Board', role: 'ADMISSION_DEAN', icon: 'Calendar', inSidebar: true, inBottomNav: true },
  { id: 'adm-circulars', path: '/admission-dean/circulars', label: 'Circulars', role: 'ADMISSION_DEAN', icon: 'Megaphone', inSidebar: true, inBottomNav: false },

  // ─── IQAC Dean Routes ───────────────────────────────────────────
  { id: 'iqac-dash', path: '/iqac/dashboard', label: 'Dashboard', role: 'IQAC_DEAN', icon: 'LayoutDashboard', inSidebar: true, inBottomNav: true },
  { id: 'iqac-accreditation', path: '/iqac/accreditation', label: 'Accreditation', role: 'IQAC_DEAN', icon: 'ShieldCheck', inSidebar: true, inBottomNav: true },
  { id: 'iqac-tasks', path: '/iqac/tasks', label: 'Tasks', role: 'IQAC_DEAN', icon: 'CheckSquare', inSidebar: true, inBottomNav: false },
  { id: 'iqac-availability', path: '/iqac/department-availability', label: 'Availability Board', role: 'IQAC_DEAN', icon: 'Calendar', inSidebar: true, inBottomNav: true },
  { id: 'iqac-circulars', path: '/iqac/circulars', label: 'Circulars', role: 'IQAC_DEAN', icon: 'Megaphone', inSidebar: true, inBottomNav: false },

  // ─── Principal Routes ───────────────────────────────────────────
  { id: 'prn-dash', path: '/principal/dashboard', label: 'Dashboard', role: 'PRINCIPAL', icon: 'LayoutDashboard', inSidebar: true, inBottomNav: true },
  { id: 'prn-approvals', path: '/principal/approval-center', label: 'Approval Center', role: 'PRINCIPAL', icon: 'ShieldCheck', inSidebar: true, inBottomNav: true },
  { id: 'prn-depts', path: '/principal/departments', label: 'Departments', role: 'PRINCIPAL', icon: 'Building2', inSidebar: true, inBottomNav: false },
  { id: 'prn-faculty', path: '/principal/faculty', label: 'Faculty', role: 'PRINCIPAL', icon: 'UserCheck', inSidebar: true, inBottomNav: false },
  { id: 'prn-students', path: '/principal/students', label: 'Students', role: 'PRINCIPAL', icon: 'Users', inSidebar: true, inBottomNav: false },
  { id: 'prn-academics', path: '/principal/academics', label: 'Academics', role: 'PRINCIPAL', icon: 'BookOpen', inSidebar: true, inBottomNav: false },
  { id: 'prn-circulars', path: '/principal/circulars', label: 'Circulars', role: 'PRINCIPAL', icon: 'Megaphone', inSidebar: true, inBottomNav: false },
  { id: 'prn-availability', path: '/principal/department-availability', label: 'Availability Board', role: 'PRINCIPAL', icon: 'Activity', inSidebar: true, inBottomNav: true },
  { id: 'prn-reports', path: '/principal/reports', label: 'Reports', role: 'PRINCIPAL', icon: 'BarChart3', inSidebar: true, inBottomNav: false },
  { id: 'prn-profile', path: '/principal/profile', label: 'Profile', role: 'PRINCIPAL', icon: 'User', inSidebar: true, inBottomNav: true },

  // ─── VP Routes ──────────────────────────────────────────────────
  { id: 'vp-dash', path: '/vp/dashboard', label: 'Dashboard', role: 'VP', icon: 'LayoutDashboard', inSidebar: true, inBottomNav: true },
  { id: 'vp-ops', path: '/vp/operations', label: 'Operations', role: 'VP', icon: 'Activity', inSidebar: true, inBottomNav: true },
  { id: 'vp-depts', path: '/vp/departments', label: 'Departments', role: 'VP', icon: 'Building2', inSidebar: true, inBottomNav: false },
  { id: 'vp-faculty', path: '/vp/faculty', label: 'Faculty', role: 'VP', icon: 'UserCheck', inSidebar: true, inBottomNav: false },
  { id: 'vp-students', path: '/vp/students', label: 'Students', role: 'VP', icon: 'Users', inSidebar: true, inBottomNav: false },
  { id: 'vp-attendance', path: '/vp/attendance', label: 'Attendance', role: 'VP', icon: 'Clock', inSidebar: true, inBottomNav: false },
  { id: 'vp-placements', path: '/vp/placements', label: 'Placements', role: 'VP', icon: 'Briefcase', inSidebar: true, inBottomNav: false },
  { id: 'vp-circulars', path: '/vp/circulars', label: 'Circulars', role: 'VP', icon: 'Megaphone', inSidebar: true, inBottomNav: false },
  { id: 'vp-availability', path: '/vp/department-availability', label: 'Availability Board', role: 'VP', icon: 'Activity', inSidebar: true, inBottomNav: true },
  { id: 'vp-reports', path: '/vp/reports', label: 'Reports', role: 'VP', icon: 'BarChart3', inSidebar: true, inBottomNav: false },
  { id: 'vp-profile', path: '/vp/profile', label: 'Profile', role: 'VP', icon: 'User', inSidebar: true, inBottomNav: true },

  // ─── Super Admin Routes ─────────────────────────────────────────
  { id: 'adm-dash', path: '/dashboard', label: 'Admin Dashboard', role: 'SUPER_ADMIN', icon: 'LayoutDashboard', inSidebar: true, inBottomNav: true },
  { id: 'adm-roles', path: '/admin/roles', label: 'Roles & IAM', role: 'SUPER_ADMIN', icon: 'ShieldCheck', inSidebar: true, inBottomNav: true },
  { id: 'adm-users', path: '/admin/users', label: 'User Directory', role: 'SUPER_ADMIN', icon: 'Users', inSidebar: true, inBottomNav: true },
  { id: 'adm-backups', path: '/admin/backup-center', label: 'Backup Center', role: 'SUPER_ADMIN', icon: 'Database', inSidebar: true, inBottomNav: false },

  // ─── Accountant Routes ──────────────────────────────────────────
  { id: 'acc-fees', path: '/admin/fees', label: 'Fee Management', role: 'ACCOUNTANT', icon: 'Landmark', inSidebar: true, inBottomNav: true },
];

export function getRoutesForRole(role: string): RouteDefinition[] {
  const normRole = role.toUpperCase();
  if (normRole.includes('STUDENT')) return ROUTE_REGISTRY.filter(r => r.role === 'STUDENT');
  if (normRole.includes('PARENT')) return ROUTE_REGISTRY.filter(r => r.role === 'PARENT');
  if (normRole.includes('HOD')) return ROUTE_REGISTRY.filter(r => r.role === 'HOD');
  if (normRole.includes('ACADEMIC_DEAN') || normRole.includes('ACADEMIC DEAN')) return ROUTE_REGISTRY.filter(r => r.role === 'ACADEMIC_DEAN');
  if (normRole.includes('ADMISSION_DEAN') || normRole.includes('ADMISSION DEAN')) return ROUTE_REGISTRY.filter(r => r.role === 'ADMISSION_DEAN');
  if (normRole.includes('IQAC')) return ROUTE_REGISTRY.filter(r => r.role === 'IQAC_DEAN');
  if (normRole.includes('PRINCIPAL') && !normRole.includes('VICE') && !normRole.includes('VP')) return ROUTE_REGISTRY.filter(r => r.role === 'PRINCIPAL');
  if (normRole.includes('VP') || normRole.includes('VICE')) return ROUTE_REGISTRY.filter(r => r.role === 'VP');
  if (normRole.includes('MENTOR')) return ROUTE_REGISTRY.filter(r => r.role === 'MENTOR');
  if (normRole.includes('SUPER_ADMIN') || normRole.includes('ADMIN')) return ROUTE_REGISTRY.filter(r => r.role === 'SUPER_ADMIN');
  if (normRole.includes('ACCOUNTANT')) return ROUTE_REGISTRY.filter(r => r.role === 'ACCOUNTANT');
  return ROUTE_REGISTRY.filter(r => r.role === 'FACULTY');
}
