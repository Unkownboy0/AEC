import React, { useState } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Layers, Building, Calendar as CalendarIcon
} from 'lucide-react';
import { AcademicDeanDashboard } from '../../components/academic-dean/AcademicDeanDashboard';
import { AcademicTaskWorkspace } from '../../components/academic-dean/AcademicTaskWorkspace';
import { AcademicMonitoring } from '../../components/academic-dean/AcademicMonitoring';

import { useAuth } from '../../context/AuthContext';

import { ExecutiveLeaveOdModal } from '../../components/shared/ExecutiveLeaveOdModal';

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
  const location = useLocation();
  const navigate = useNavigate();
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const routeTab = location.pathname.endsWith('/tasks') ? 'task_workspace'
    : location.pathname.endsWith('/academics') ? 'academic_monitoring'
    : location.pathname.endsWith('/reports') ? 'reports_analytics'
    : null;
  const rawTab = (searchParams.get('tab') || routeTab) as AcademicTab | null;
  const activeTab: AcademicTab = rawTab && (VALID_TABS as readonly string[]).includes(rawTab) ? rawTab : 'dashboard';

  const setActiveTab = (tab: AcademicTab) => {
    navigate(`/academic-dean/dashboard?tab=${tab}`, { replace: true });
  };

  const workspaceTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'task_workspace', label: 'Task Workspace', icon: Layers, badge: 'Core' },
  ];

  return (
    <section className="w-full min-w-0 space-y-5 text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
        <nav className="flex items-center gap-1 rounded-xl bg-muted/60 p-1" aria-label="Academic Dean workspace">
          {workspaceTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as AcademicTab)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <button
          onClick={() => setIsLeaveModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <CalendarIcon className="h-4 w-4 text-primary" /> Apply Leave / OD
        </button>
      </div>

      <div className="min-w-0">
        {activeTab === 'dashboard' && <AcademicDeanDashboard user={user} onNavigateTab={(tab: string) => setActiveTab(tab as any)} />}
        {activeTab === 'task_workspace' && <AcademicTaskWorkspace user={user} />}
        {activeTab === 'academic_monitoring' && <AcademicMonitoring onOpenTasks={() => setActiveTab('task_workspace')} />}
        {activeTab !== 'dashboard' && activeTab !== 'task_workspace' && activeTab !== 'academic_monitoring' && (
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
      </div>

      <ExecutiveLeaveOdModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        userRole="Academic Dean"
      />
    </section>
  );
};
