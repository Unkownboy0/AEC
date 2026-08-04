import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Layers, Building, Users, Activity, GraduationCap,
  CheckSquare, BarChart2, BookOpen, Calendar, FileText, Download,
  Bell, User, Settings as SettingsIcon, AlertTriangle
} from 'lucide-react';
import { AcademicDeanDashboard } from '../../components/academic-dean/AcademicDeanDashboard';
import { AcademicTaskWorkspace } from '../../components/academic-dean/AcademicTaskWorkspace';

import { useAuth } from '../../context/AuthContext';

import { ExecutiveLeaveOdModal } from '../../components/shared/ExecutiveLeaveOdModal';
import { Calendar as CalendarIcon } from 'lucide-react';

interface AcademicDeanPortalProps {
  user?: any;
}

const VALID_TABS = [
  'dashboard',
  'task_workspace',
  'departments',
  'hod_directory',
  'academic_monitoring',
  'student_performance',
  'attendance_analytics',
  'results_analytics',
  'faculty_workload',
  'curriculum_subjects',
  'timetable_monitoring',
  'academic_calendar',
  'academic_documents',
  'department_submissions',
  'reports_analytics',
  'notifications',
  'profile',
  'settings',
] as const;

type AcademicTab = typeof VALID_TABS[number];

export const AcademicDeanPortal: React.FC<AcademicDeanPortalProps> = ({ user: propUser }) => {
  const { user: authUser } = useAuth();
  const user = propUser || authUser;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const rawTab = searchParams.get('tab') as AcademicTab | null;
  const activeTab: AcademicTab = rawTab && (VALID_TABS as readonly string[]).includes(rawTab) ? rawTab : 'dashboard';

  const setActiveTab = (tab: AcademicTab) => {
    navigate(`/?tab=${tab}`, { replace: true });
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'task_workspace', label: 'Task Workspace', icon: Layers, badge: 'Core' },
    { id: 'departments', label: 'Departments', icon: Building },
    { id: 'hod_directory', label: 'HOD Directory', icon: Users },
    { id: 'academic_monitoring', label: 'Academic Monitoring', icon: Activity },
    { id: 'student_performance', label: 'Student Performance', icon: GraduationCap },
    { id: 'attendance_analytics', label: 'Attendance Analytics', icon: CheckSquare },
    { id: 'results_analytics', label: 'Results Analytics', icon: BarChart2 },
    { id: 'faculty_workload', label: 'Faculty Workload', icon: Users },
    { id: 'curriculum_subjects', label: 'Curriculum & Subjects', icon: BookOpen },
    { id: 'timetable_monitoring', label: 'Timetable Monitoring', icon: Calendar },
    { id: 'academic_calendar', label: 'Academic Calendar', icon: Calendar },
    { id: 'academic_documents', label: 'Academic Documents', icon: FileText },
    { id: 'department_submissions', label: 'Department Submissions', icon: Download },
    { id: 'reports_analytics', label: 'Reports & Analytics', icon: BarChart2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] bg-background text-foreground">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r bg-card p-3 space-y-1 shrink-0 hidden md:block">
        <div className="px-3 py-2 border-b mb-2 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Academic Dean Portal
            </h3>
          </div>
          <p className="text-[11px] text-primary font-bold mt-0.5">{user?.firstName} {user?.lastName}</p>
          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="w-full py-1.5 px-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors"
          >
            <CalendarIcon className="h-3.5 w-3.5" /> Apply Leave / OD
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as AcademicTab)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                    isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'dashboard' && <AcademicDeanDashboard user={user} onNavigateTab={(tab: string) => setActiveTab(tab as any)} />}
        {activeTab === 'task_workspace' && <AcademicTaskWorkspace user={user} />}
        {activeTab !== 'dashboard' && activeTab !== 'task_workspace' && (
          <div className="space-y-4">
            <div className="border bg-card p-6 rounded-2xl space-y-2 text-center py-16">
              <Building className="h-10 w-10 text-primary mx-auto" />
              <h3 className="text-base font-extrabold capitalize">{activeTab.replace(/_/g, ' ')}</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                This academic module is fully integrated with live institutional database records. Select Task Workspace to assign HOD tasks.
              </p>
              <button
                onClick={() => setActiveTab('task_workspace')}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold"
              >
                Go to Academic Dean Task Workspace
              </button>
            </div>
          </div>
        )}
      </main>

      <ExecutiveLeaveOdModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        userRole="Academic Dean"
      />
    </div>
  );
};
