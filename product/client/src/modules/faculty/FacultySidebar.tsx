import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Layers,
  Clock,
  BookOpen,
  FileText,
  TrendingUp,
  FolderKanban,
  Megaphone,
  CheckSquare,
  History,
  AlertCircle,
  BarChart3,
  PenTool,
  CheckCircle,
  Award,
  HelpCircle,
  LineChart,
  Users,
  UserCheck,
  ShieldAlert,
  MessageSquare,
  Crown,
  HeartHandshake,
  Mail,
  Briefcase,
  ListTodo,
  FileCheck,
  UserMinus,
  CalendarCheck,
  Bell,
  Printer,
  User,
  Settings,
  Smartphone,
  Shield,
  ChevronDown
} from 'lucide-react';

interface FacultySidebarProps {
  isMentor?: boolean;
}

interface NavItem {
  label: string;
  path: string;
  icon: any;
  badge?: string;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export const FacultySidebar: React.FC<FacultySidebarProps> = ({ isMentor = false }) => {
  const location = useLocation();

  const NAV_GROUPS: NavGroup[] = [
    {
      groupName: 'Overview',
      items: [
        { label: 'Dashboard', path: '/faculty/dashboard', icon: LayoutDashboard },
        { label: 'My Calendar', path: '/faculty/calendar', icon: Calendar },
        { label: 'Department Board', path: '/faculty/dept-board', icon: Layers }
      ]
    },
    {
      groupName: 'Teaching',
      items: [
        { label: 'My Timetable', path: '/faculty/timetable', icon: Clock },
        { label: 'My Subjects', path: '/faculty/subjects', icon: BookOpen },
        { label: 'Lesson Plans', path: '/faculty/lesson-plans', icon: FileText },
        { label: 'Syllabus Progress', path: '/faculty/syllabus', icon: TrendingUp },
        { label: 'Learning Resources', path: '/faculty/resources', icon: FolderKanban },
        { label: 'Class Announcements', path: '/faculty/announcements', icon: Megaphone }
      ]
    },
    {
      groupName: 'Attendance',
      items: [
        { label: 'Period Attendance', path: '/faculty/attendance/mark', icon: CheckSquare },
        { label: 'Attendance History', path: '/faculty/attendance/history', icon: History },
        { label: 'Attendance Corrections', path: '/faculty/attendance/corrections', icon: AlertCircle },
        { label: 'Low Attendance Alert', path: '/faculty/attendance/low', icon: ShieldAlert },
        { label: 'Attendance Reports', path: '/faculty/attendance/reports', icon: BarChart3 }
      ]
    },
    {
      groupName: 'Assessment',
      items: [
        { label: 'Assignments', path: '/faculty/assignments', icon: PenTool },
        { label: 'Student Submissions', path: '/faculty/submissions', icon: CheckCircle },
        { label: 'Internal Marks', path: '/faculty/marks/internal', icon: Award },
        { label: 'Practical Marks', path: '/faculty/marks/practical', icon: Award },
        { label: 'Question Bank', path: '/faculty/question-bank', icon: HelpCircle },
        { label: 'Result Analysis', path: '/faculty/result-analysis', icon: LineChart }
      ]
    },
    {
      groupName: 'Students',
      items: [
        { label: 'My Students', path: '/faculty/students', icon: Users },
        { label: 'Subject Students', path: '/faculty/subject-students', icon: UserCheck },
        { label: 'Student Profiles', path: '/faculty/student-profiles', icon: User },
        { label: 'Academic Risk', path: '/faculty/academic-risk', icon: ShieldAlert },
        { label: 'Student Communication', path: '/faculty/communication', icon: MessageSquare }
      ]
    },
    ...(isMentor
      ? [
          {
            groupName: 'Mentor',
            items: [
              { label: 'Mentor Dashboard', path: '/faculty/mentor/dashboard', icon: Crown, badge: 'Mentor' },
              { label: 'Mentor Students', path: '/faculty/mentor/students', icon: Users },
              { label: 'Leave / OD Approvals', path: '/faculty/mentor/approvals', icon: FileCheck },
              { label: 'Attendance Alerts', path: '/faculty/mentor/alerts', icon: AlertCircle },
              { label: 'Counselling', path: '/faculty/mentor/counselling', icon: HeartHandshake },
              { label: 'Parent Communication', path: '/faculty/mentor/parents', icon: Mail },
              { label: 'Mentor Reports', path: '/faculty/mentor/reports', icon: BarChart3 }
            ]
          }
        ]
      : []),
    {
      groupName: 'Work',
      items: [
        { label: 'My Tasks', path: '/faculty/tasks', icon: Briefcase },
        { label: 'Tasks Assigned by Me', path: '/faculty/assigned-tasks', icon: ListTodo },
        { label: 'Leave / OD Request', path: '/faculty/leave-request', icon: UserMinus },
        { label: 'Substitute Classes', path: '/faculty/substitutions', icon: CalendarCheck },
        { label: 'Exam Duties', path: '/faculty/exam-duties', icon: Award },
        { label: 'Department Activities', path: '/faculty/dept-activities', icon: Layers }
      ]
    },
    {
      groupName: 'Communication',
      items: [
        { label: 'Circulars', path: '/faculty/circulars', icon: Megaphone },
        { label: 'Announcements', path: '/faculty/announcements-list', icon: Bell },
        { label: 'Messages', path: '/faculty/messages', icon: MessageSquare },
        { label: 'Meetings', path: '/faculty/meetings', icon: Calendar },
        { label: 'Notifications', path: '/faculty/notifications', icon: Bell }
      ]
    },
    {
      groupName: 'Reports',
      items: [
        { label: 'Teaching Reports', path: '/faculty/reports/teaching', icon: BarChart3 },
        { label: 'Attendance Reports', path: '/faculty/reports/attendance', icon: BarChart3 },
        { label: 'Assessment Reports', path: '/faculty/reports/assessment', icon: BarChart3 },
        { label: 'Export Center', path: '/faculty/export-center', icon: Printer }
      ]
    },
    {
      groupName: 'Account',
      items: [
        { label: 'My Profile', path: '/faculty/profile', icon: User },
        { label: 'Preferences', path: '/faculty/preferences', icon: Settings },
        { label: 'Devices', path: '/faculty/devices', icon: Smartphone },
        { label: 'Security', path: '/faculty/security', icon: Shield }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 min-h-screen p-4 flex flex-col space-y-6 text-xs font-semibold select-none">
      <div className="flex items-center gap-2.5 px-2 py-1">
        <div className="p-2 rounded-xl bg-violet-600/30 text-violet-300 border border-violet-500/40">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-black text-white leading-tight">Faculty Workspace</h2>
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Academic Operations</span>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto pr-1">
        {NAV_GROUPS.map((group) => (
          <div key={group.groupName} className="space-y-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 block">
              {group.groupName}
            </span>

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                      isActive
                        ? 'bg-violet-600 text-white font-extrabold shadow-md'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
