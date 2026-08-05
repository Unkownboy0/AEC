import React from 'react';

export interface AppRouteDefinition {
  id: string;
  path: string;
  role?: string | string[];
  permission?: string;
  title: string;
  navigationGroup?: 'Overview' | 'Academics' | 'Approvals' | 'People' | 'Tasks' | 'Communication' | 'Reports' | 'Account';
  iconName?: string;
  mobileVisible?: boolean;
  deepLinkPattern?: string;
}

export const ROUTE_REGISTRY: Record<string, AppRouteDefinition> = {
  // Public & Base
  login: { id: 'login', path: '/login', title: 'Login' },
  forgotPassword: { id: 'forgotPassword', path: '/forgot-password', title: 'Forgot Password' },
  resetPassword: { id: 'resetPassword', path: '/reset-password', title: 'Reset Password' },
  dashboard: { id: 'dashboard', path: '/', title: 'Command Center', navigationGroup: 'Overview', iconName: 'LayoutDashboard', mobileVisible: true },
  profile: { id: 'profile', path: '/profile', title: 'User Profile', navigationGroup: 'Account', iconName: 'User', mobileVisible: true },
  universalProfile: { id: 'universalProfile', path: '/profile/:userId', title: 'Profile View', navigationGroup: 'Account', iconName: 'User' },
  accessDenied: { id: 'accessDenied', path: '/access-denied', title: 'Access Denied' },
  notFound: { id: 'notFound', path: '/404', title: 'Page Not Found' },

  // Shared Global Modules
  approvalCenter: { id: 'approvalCenter', path: '/approval-center', role: ['Principal', 'Vice Principal', 'HOD'], title: 'Approval Center', navigationGroup: 'Approvals', iconName: 'ShieldCheck', mobileVisible: true },
  circulars: { id: 'circulars', path: '/circulars', title: 'Circular Center', navigationGroup: 'Communication', iconName: 'Megaphone', mobileVisible: true },
  circularDetail: { id: 'circularDetail', path: '/circulars/:id', title: 'Circular Details' },
  workManagement: { id: 'workManagement', path: '/work-management', title: 'Work Management', navigationGroup: 'Tasks', iconName: 'CheckSquare' },
  tasks: { id: 'tasks', path: '/tasks', title: 'Task Management', navigationGroup: 'Tasks', iconName: 'CheckSquare', mobileVisible: true },

  // Principal Routes
  principalDashboard: { id: 'principalDashboard', path: '/principal/dashboard', role: 'Principal', title: 'Executive Dashboard', navigationGroup: 'Overview', iconName: 'Building', mobileVisible: true },
  principalApprovalCenter: { id: 'principalApprovalCenter', path: '/principal/approval-center', role: 'Principal', title: 'Approval Desk', navigationGroup: 'Approvals', iconName: 'ShieldCheck', mobileVisible: true },
  principalDepartments: { id: 'principalDepartments', path: '/principal/departments', role: 'Principal', title: 'Departments Overview', navigationGroup: 'Academics', iconName: 'Landmark' },
  principalFaculty: { id: 'principalFaculty', path: '/principal/faculty', role: 'Principal', title: 'Faculty Directory', navigationGroup: 'People', iconName: 'Users' },
  principalStudents: { id: 'principalStudents', path: '/principal/students', role: 'Principal', title: 'Student Directory', navigationGroup: 'People', iconName: 'GraduationCap' },
  principalAcademics: { id: 'principalAcademics', path: '/principal/academics', role: 'Principal', title: 'Academic Standards', navigationGroup: 'Academics', iconName: 'BookOpen' },
  principalCirculars: { id: 'principalCirculars', path: '/principal/circulars', role: 'Principal', title: 'Institutional Circulars', navigationGroup: 'Communication', iconName: 'Megaphone', mobileVisible: true },
  principalReports: { id: 'principalReports', path: '/principal/reports', role: 'Principal', title: 'Analytics & Reports', navigationGroup: 'Reports', iconName: 'BarChart2' },
  principalNotifications: { id: 'principalNotifications', path: '/principal/notifications', role: 'Principal', title: 'Notifications', navigationGroup: 'Communication', iconName: 'Bell' },
  principalDelegation: { id: 'principalDelegation', path: '/principal/delegation', role: 'Principal', title: 'Delegation Control', navigationGroup: 'Account', iconName: 'Key' },

  // VP Routes
  vpDashboard: { id: 'vpDashboard', path: '/vp/dashboard', role: 'Vice Principal', title: 'VP Command Center', navigationGroup: 'Overview', iconName: 'Activity', mobileVisible: true },
  vpOperations: { id: 'vpOperations', path: '/vp/operations', role: 'Vice Principal', title: 'Campus Operations', navigationGroup: 'Overview', iconName: 'Building' },
  vpDepartments: { id: 'vpDepartments', path: '/vp/departments', role: 'Vice Principal', title: 'Department Monitoring', navigationGroup: 'Academics', iconName: 'Landmark' },
  vpFaculty: { id: 'vpFaculty', path: '/vp/faculty', role: 'Vice Principal', title: 'Faculty Monitoring', navigationGroup: 'People', iconName: 'Users' },
  vpStudents: { id: 'vpStudents', path: '/vp/students', role: 'Vice Principal', title: 'Student Affairs', navigationGroup: 'People', iconName: 'GraduationCap' },
  vpAttendance: { id: 'vpAttendance', path: '/vp/attendance', role: 'Vice Principal', title: 'Attendance Oversight', navigationGroup: 'Academics', iconName: 'UserCheck' },
  vpPlacements: { id: 'vpPlacements', path: '/vp/placements', role: 'Vice Principal', title: 'Placement Drive', navigationGroup: 'Reports', iconName: 'Briefcase' },
  vpComplaints: { id: 'vpComplaints', path: '/vp/complaints', role: 'Vice Principal', title: 'Grievances Desk', navigationGroup: 'Approvals', iconName: 'AlertTriangle' },
  vpCirculars: { id: 'vpCirculars', path: '/vp/circulars', role: 'Vice Principal', title: 'Vice Principal Circulars', navigationGroup: 'Communication', iconName: 'Megaphone' },
  vpReports: { id: 'vpReports', path: '/vp/reports', role: 'Vice Principal', title: 'Operational Reports', navigationGroup: 'Reports', iconName: 'FileSpreadsheet' },

  // Deans Routes
  academicDeanDashboard: { id: 'academicDeanDashboard', path: '/academic-dean/dashboard', role: 'Academic Dean', title: 'Academic Dean Portal', navigationGroup: 'Overview', iconName: 'BookOpen', mobileVisible: true },
  academicDeanTasks: { id: 'academicDeanTasks', path: '/academic-dean/tasks', role: 'Academic Dean', title: 'Academic Tasks', navigationGroup: 'Tasks', iconName: 'CheckSquare' },
  academicDeanCirculars: { id: 'academicDeanCirculars', path: '/academic-dean/circulars', role: 'Academic Dean', title: 'Academic Directives', navigationGroup: 'Communication', iconName: 'Megaphone' },
  academicDeanReports: { id: 'academicDeanReports', path: '/academic-dean/reports', role: 'Academic Dean', title: 'Academic Audit', navigationGroup: 'Reports', iconName: 'BarChart2' },

  admissionDeanDashboard: { id: 'admissionDeanDashboard', path: '/admission-dean/dashboard', role: 'Admission Dean', title: 'Admission Control', navigationGroup: 'Overview', iconName: 'UserPlus', mobileVisible: true },
  iqacDeanDashboard: { id: 'iqacDeanDashboard', path: '/iqac/dashboard', role: 'IQAC Dean', title: 'IQAC Accreditation', navigationGroup: 'Overview', iconName: 'Award', mobileVisible: true },

  // HOD Routes
  hodDashboard: { id: 'hodDashboard', path: '/hod/dashboard', role: 'HOD', title: 'Department Dashboard', navigationGroup: 'Overview', iconName: 'LayoutDashboard', mobileVisible: true },
  hodApprovals: { id: 'hodApprovals', path: '/hod/approvals', role: 'HOD', title: 'Leave & OD Approvals', navigationGroup: 'Approvals', iconName: 'CheckSquare', mobileVisible: true },
  hodFacultyRequests: { id: 'hodFacultyRequests', path: '/hod/faculty-requests', role: 'HOD', title: 'Faculty Applications', navigationGroup: 'Approvals', iconName: 'FileText' },
  hodStudents: { id: 'hodStudents', path: '/hod/students', role: 'HOD', title: 'Department Students', navigationGroup: 'People', iconName: 'GraduationCap' },
  hodFaculty: { id: 'hodFaculty', path: '/hod/faculty', role: 'HOD', title: 'Department Faculty', navigationGroup: 'People', iconName: 'Users' },
  hodAttendance: { id: 'hodAttendance', path: '/hod/attendance', role: 'HOD', title: 'Department Attendance', navigationGroup: 'Academics', iconName: 'UserCheck' },
  hodTimetable: { id: 'hodTimetable', path: '/hod/timetable', role: 'HOD', title: 'Timetable Scheduling', navigationGroup: 'Academics', iconName: 'Clock' },
  hodTasks: { id: 'hodTasks', path: '/hod/tasks', role: 'HOD', title: 'HOD Tasks', navigationGroup: 'Tasks', iconName: 'CheckSquare' },
  hodCirculars: { id: 'hodCirculars', path: '/hod/circulars', role: 'HOD', title: 'Department Circulars', navigationGroup: 'Communication', iconName: 'Megaphone', mobileVisible: true },
  hodBoard: { id: 'hodBoard', path: '/hod/board', role: 'HOD', title: 'Faculty Availability', navigationGroup: 'People', iconName: 'Users' },
  hodReports: { id: 'hodReports', path: '/hod/reports', role: 'HOD', title: 'Department Reports', navigationGroup: 'Reports', iconName: 'BarChart2' },
  hodProfile: { id: 'hodProfile', path: '/hod/profile', role: 'HOD', title: 'HOD Profile', navigationGroup: 'Account', iconName: 'User' },

  // Faculty Routes
  facultyDashboard: { id: 'facultyDashboard', path: '/faculty/dashboard', role: 'Faculty', title: 'Faculty Dashboard', navigationGroup: 'Overview', iconName: 'LayoutDashboard', mobileVisible: true },
  facultyTimetable: { id: 'facultyTimetable', path: '/faculty/timetable', role: 'Faculty', title: 'My Schedule', navigationGroup: 'Academics', iconName: 'Clock', mobileVisible: true },
  facultyAttendance: { id: 'facultyAttendance', path: '/faculty/attendance', role: 'Faculty', title: 'Class Attendance', navigationGroup: 'Academics', iconName: 'UserCheck', mobileVisible: true },
  facultyAssignments: { id: 'facultyAssignments', path: '/faculty/assignments', role: 'Faculty', title: 'Coursework & Homework', navigationGroup: 'Academics', iconName: 'FileText' },
  facultyLeave: { id: 'facultyLeave', path: '/faculty/leave-od', role: 'Faculty', title: 'Leave & OD Requests', navigationGroup: 'Approvals', iconName: 'CalendarDays', mobileVisible: true },
  facultyCirculars: { id: 'facultyCirculars', path: '/faculty/circulars', role: 'Faculty', title: 'Faculty Notices', navigationGroup: 'Communication', iconName: 'Megaphone' },
  facultyTasks: { id: 'facultyTasks', path: '/faculty/tasks', role: 'Faculty', title: 'Assigned Tasks', navigationGroup: 'Tasks', iconName: 'CheckSquare' },
  facultyProfile: { id: 'facultyProfile', path: '/faculty/profile', role: 'Faculty', title: 'Faculty Profile', navigationGroup: 'Account', iconName: 'User' },
  mentorWorkspace: { id: 'mentorWorkspace', path: '/faculty/mentor', role: ['Faculty', 'Mentor'], title: 'Mentorship Portal', navigationGroup: 'People', iconName: 'Heart' },

  // Student Routes
  studentDashboard: { id: 'studentDashboard', path: '/student/dashboard', role: 'Student', title: 'Student Home', navigationGroup: 'Overview', iconName: 'Home', mobileVisible: true },
  studentAcademics: { id: 'studentAcademics', path: '/student/academics', role: 'Student', title: 'Academic Hub', navigationGroup: 'Academics', iconName: 'BookOpen', mobileVisible: true },
  studentTimetable: { id: 'studentTimetable', path: '/student/timetable', role: 'Student', title: 'Class Schedule', navigationGroup: 'Academics', iconName: 'Clock' },
  studentAttendance: { id: 'studentAttendance', path: '/student/attendance', role: 'Student', title: 'My Attendance', navigationGroup: 'Academics', iconName: 'UserCheck' },
  studentAssignments: { id: 'studentAssignments', path: '/student/assignments', role: 'Student', title: 'Assignments', navigationGroup: 'Tasks', iconName: 'FileText', mobileVisible: true },
  studentResults: { id: 'studentResults', path: '/student/results', role: 'Student', title: 'Exam Results', navigationGroup: 'Academics', iconName: 'Award' },
  studentLeaveOd: { id: 'studentLeaveOd', path: '/student/leave-od', role: 'Student', title: 'Leave & OD Applications', navigationGroup: 'Approvals', iconName: 'CalendarDays' },
  studentCirculars: { id: 'studentCirculars', path: '/student/circulars', role: 'Student', title: 'Student Announcements', navigationGroup: 'Communication', iconName: 'Megaphone', mobileVisible: true },
  studentProfile: { id: 'studentProfile', path: '/student/profile', role: 'Student', title: 'Student Profile', navigationGroup: 'Account', iconName: 'User', mobileVisible: true },

  // Parent Routes
  parentDashboard: { id: 'parentDashboard', path: '/parent/dashboard', role: 'Parent', title: 'Parent Portal', navigationGroup: 'Overview', iconName: 'Home', mobileVisible: true },
};

export const getRoutesForRole = (roleName: string): AppRouteDefinition[] => {
  return Object.values(ROUTE_REGISTRY).filter((r) => {
    if (!r.role) return false;
    if (Array.isArray(r.role)) return r.role.includes(roleName);
    return r.role === roleName;
  });
};
