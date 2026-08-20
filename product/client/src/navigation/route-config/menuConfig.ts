import { MenuGroup } from '../desktop/DesktopSidebar';

export function getMenuGroupsForRole(role?: string): MenuGroup[] {
  const normRole = role ? role.toUpperCase() : 'ADMIN';

  if (normRole.includes('MANAGEMENT') || normRole.includes('GOVERNING')) {
    return [{ label: 'Executive intelligence', items: [
      { id: 'mgmt-dash', path: normRole.includes('GOVERNING') ? '/governing-body/dashboard' : '/management/dashboard', label: 'Institution overview', icon: 'LayoutDashboard' },
      { id: 'mgmt-workspace', path: '/workspace', label: 'Campus Workspace', icon: 'Sparkles' },
      { id: 'mgmt-reports', path: normRole.includes('GOVERNING') ? '/governing-body/dashboard' : '/management/dashboard', label: 'Strategic reports', icon: 'BarChart3' },
    ] }];
  }

  if (normRole.includes('STUDENT')) {
    return [
      {
        label: 'Main',
        items: [
          { id: 'st-dash', path: '/student/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
          { id: 'st-workspace', path: '/workspace', label: 'Campus Workspace', icon: 'Sparkles' },
          { id: 'st-timetable', path: '/student/timetable', label: 'Timetable', icon: 'Calendar' },
          { id: 'st-attendance', path: '/student/attendance', label: 'Attendance', icon: 'Clock' },
          { id: 'st-assignments', path: '/student/assignments', label: 'Assignments', icon: 'FileText' },
          { id: 'st-marks', path: '/student/results', label: 'Results & Marks', icon: 'Award' },
        ],
      },
      {
        label: 'Requests & Fees',
        items: [
          { id: 'st-leave', path: '/student/leave-od', label: 'Leave & OD', icon: 'FileCheck' },
          { id: 'st-fees', path: '/student/fees', label: 'Fees & Payments', icon: 'CreditCard' },
          { id: 'st-circulars', path: '/student/circulars', label: 'Circulars', icon: 'Megaphone' },
        ],
      },
      {
        label: 'Career & Services',
        items: [
          { id: 'st-placements', path: '/student/placements', label: 'Placements', icon: 'Briefcase' },
          { id: 'st-documents', path: '/student/documents', label: 'Documents', icon: 'FileText' },
          { id: 'st-idcard', path: '/student/id-card', label: 'Digital ID Card', icon: 'User' },
        ],
      },
    ];
  }

  if (normRole.includes('PARENT')) {
    return [
      {
        label: 'Child Overview',
        items: [
          { id: 'pr-dash', path: '/parent/dashboard', label: 'Child Dashboard', icon: 'LayoutDashboard' },
          { id: 'pr-workspace', path: '/workspace', label: 'Campus Workspace', icon: 'Sparkles' },
          { id: 'pr-attendance', path: '/parent/attendance', label: 'Attendance', icon: 'Clock' },
          { id: 'pr-marks', path: '/parent/marks', label: 'Academic Performance', icon: 'Award' },
          { id: 'pr-timetable', path: '/parent/timetable', label: 'Timetable', icon: 'Calendar' },
        ],
      },
      {
        label: 'Finance & Communication',
        items: [
          { id: 'pr-fees', path: '/parent/fees', label: 'Fees & Payments', icon: 'CreditCard' },
          { id: 'pr-messages', path: '/parent/messages', label: 'Mentor Messages', icon: 'MessageSquare' },
          { id: 'pr-circulars', path: '/parent/circulars', label: 'Circulars', icon: 'Megaphone' },
        ],
      },
    ];
  }

  if (normRole.includes('HOD') || normRole.includes('HEAD_OF_DEPARTMENT')) {
    return [
      {
        label: 'Department Workspace',
        items: [
          { id: 'hod-dash', path: '/hod/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
          { id: 'hod-workspace', path: '/workspace', label: 'Campus Workspace', icon: 'Sparkles' },
          { id: 'hod-approvals', path: '/hod/approvals', label: 'Pending Approvals', icon: 'ShieldCheck' },
          { id: 'hod-availability', path: '/hod/department-availability', label: 'Availability Board', icon: 'Building2' },
        ],
      },
      {
        label: 'Management',
        items: [
          { id: 'hod-faculty', path: '/hod/faculty', label: 'Faculty Directory', icon: 'UserCheck' },
          { id: 'hod-students', path: '/hod/students', label: 'Student Records', icon: 'Users' },
          { id: 'hod-mentors', path: '/hod/mentors', label: 'Mentor Assignments', icon: 'UserPlus' },
          { id: 'hod-tasks', path: '/hod/tasks', label: 'Department Tasks', icon: 'CheckSquare' },
        ],
      },
      {
        label: 'Academics & Reports',
        items: [
          { id: 'hod-academics', path: '/hod/academics', label: 'Academic Performance', icon: 'BookOpen' },
          { id: 'hod-circulars', path: '/hod/circulars', label: 'Circulars', icon: 'Megaphone' },
          { id: 'hod-reports', path: '/hod/reports', label: 'Department Reports', icon: 'BarChart3' },
        ],
      },
    ];
  }

  if (normRole.includes('PRINCIPAL') && !normRole.includes('VICE') && !normRole.includes('VP')) {
    return [
      {
        label: 'Executive Control',
        items: [
          { id: 'prn-dash', path: '/principal/dashboard', label: 'Executive Dashboard', icon: 'LayoutDashboard' },
          { id: 'prn-workspace', path: '/workspace', label: 'Campus Workspace', icon: 'Sparkles' },
          { id: 'prn-approvals', path: '/principal/approval-center', label: 'Approval Desk', icon: 'ShieldCheck' },
          { id: 'prn-availability', path: '/principal/department-availability', label: 'Campus Availability', icon: 'Activity' },
        ],
      },
      {
        label: 'Monitoring',
        items: [
          { id: 'prn-depts', path: '/principal/departments', label: 'Departments', icon: 'Building2' },
          { id: 'prn-faculty', path: '/principal/faculty', label: 'Faculty Directory', icon: 'UserCheck' },
          { id: 'prn-students', path: '/principal/students', label: 'Student Directory', icon: 'Users' },
          { id: 'prn-circulars', path: '/principal/circulars', label: 'Circulars', icon: 'Megaphone' },
          { id: 'prn-reports', path: '/principal/reports', label: 'Institution Reports', icon: 'BarChart3' },
        ],
      },
    ];
  }

  if (normRole.includes('VP') || normRole.includes('VICE')) {
    return [
      {
        label: 'Operations',
        items: [
          { id: 'vp-dash', path: '/vp/dashboard', label: 'VP Operations', icon: 'LayoutDashboard' },
          { id: 'vp-workspace', path: '/workspace', label: 'Campus Workspace', icon: 'Sparkles' },
          { id: 'vp-approvals', path: '/vp/leave-approvals', label: 'Approvals & Workflows', icon: 'ShieldCheck' },
          { id: 'vp-availability', path: '/vp/department-availability', label: 'Availability Board', icon: 'Activity' },
        ],
      },
      {
        label: 'Academic & Campus',
        items: [
          { id: 'vp-depts', path: '/vp/departments', label: 'Departments', icon: 'Building2' },
          { id: 'vp-placements', path: '/vp/placements', label: 'Placements', icon: 'Briefcase' },
          { id: 'vp-circulars', path: '/vp/circulars', label: 'Circulars', icon: 'Megaphone' },
          { id: 'vp-reports', path: '/vp/reports', label: 'Operations Reports', icon: 'BarChart3' },
        ],
      },
    ];
  }

  // Default: Faculty / Mentor
  return [
    {
      label: 'Academics',
      items: [
        { id: 'fac-dash', path: '/faculty/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
        { id: 'fac-workspace', path: '/workspace', label: 'Campus Workspace', icon: 'Sparkles' },
        { id: 'fac-timetable', path: '/faculty/timetable', label: 'Timetable', icon: 'Calendar' },
        { id: 'fac-attendance', path: '/faculty/attendance', label: 'Mark Attendance', icon: 'Clock' },
        { id: 'fac-assignments', path: '/faculty/assignments', label: 'Assignments', icon: 'FileText' },
        { id: 'fac-marks', path: '/faculty/internal-marks', label: 'Internal Marks', icon: 'Award' },
      ],
    },
    {
      label: 'Students & Tasks',
      items: [
        { id: 'fac-students', path: '/faculty/students', label: 'My Students', icon: 'Users' },
        { id: 'fac-mentor', path: '/faculty/mentor/dashboard', label: 'Mentor Workspace', icon: 'Heart' },
        { id: 'fac-leave', path: '/faculty/leave-od', label: 'My Leave / OD', icon: 'FileCheck' },
        { id: 'fac-tasks', path: '/faculty/tasks', label: 'Tasks', icon: 'CheckSquare' },
        { id: 'fac-circulars', path: '/faculty/circulars', label: 'Circulars', icon: 'Megaphone' },
      ],
    },
  ];
}
