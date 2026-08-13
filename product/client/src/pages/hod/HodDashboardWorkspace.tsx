import React, { useState, useEffect } from 'react';
import {
  Users, UserCheck, ShieldCheck, Clock, AlertTriangle,
  CheckCircle2, Calendar, ArrowUpRight, Award,
  FileCheck, RefreshCw, BarChart3, Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

import { useToast } from '../../components/ui/Toast';
import { DepartmentAvailabilityBoard } from '../../components/department/DepartmentAvailabilityBoard';
import { PageHeader } from '../../design-system/components/PageHeader';
import { SummaryStatCard } from '../../design-system/components/SummaryStatCard';
import { QuickActionCard } from '../../design-system/components/QuickActionCard';
import { SectionCard } from '../../design-system/components/SectionCard';
import { StatusBadge } from '../../design-system/components/StatusBadge';

import { useRealtimeSync } from '../../hooks/useRealtimeSync';

export const HodDashboardWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: syncData, isLoading: isSyncLoading, refetch } = useRealtimeSync(
    ['hod-dashboard-summary'],
    '/hod/dashboard',
    { intervalMs: 10000 }
  );

  const data: any = syncData;
  const loading = isSyncLoading;


  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
        Loading HOD Command Workspace...
      </div>
    );
  }
  if (!data) return <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 text-center"><AlertTriangle className="mx-auto mb-3 text-rose-500"/><p className="font-semibold">Department data could not be loaded.</p><button onClick={() => refetch()} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Retry</button></div>;

  const cards = data?.summaryCards || {};
  const dept = data?.department || {};
  const recentRequests = data?.widgets?.recentRequests || [];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title="HOD Department Command Center"
        subtitle={`Department governance and operations · ${dept.name || 'Assigned department'} (${dept.code || '—'})`}
        primaryAction={{
          label: `Approvals Desk (${cards.totalPendingApprovals || 0})`,
          onClick: () => navigate('/hod/approvals'),
          icon: <FileCheck className="w-4 h-4" />,
        }}
      />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryStatCard
          title="Pending Approvals"
          value={cards.totalPendingApprovals || 0}
          subtitle="Leave & OD applications"
          iconName="leaveOd"
          variant="amber"
          onClick={() => navigate('/hod/approvals')}
        />
        <SummaryStatCard
          title="Active Department Faculty"
          value={cards.totalFaculty ?? 0}
          subtitle={`${cards.facultyOnLeaveToday || 0} on leave today`}
          iconName="faculty"
          variant="purple"
          onClick={() => navigate('/hod/faculty')}
        />
        <SummaryStatCard
          title="Total Department Students"
          value={cards.totalStudents ?? 0}
          subtitle="Enrolled across sections"
          iconName="students"
          variant="success"
          onClick={() => navigate('/hod/students')}
        />
        <SummaryStatCard
          title="Department Board"
          value="Live"
          subtitle="Real-time availability status"
          iconName="institution"
          variant="blue"
          onClick={() => navigate('/hod/department-availability')}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[['Subjects & classes','/hod/academics'],['Timetable','/hod/timetable'],['Attendance','/hod/attendance'],['Mentor allocation','/hod/mentors'],['Tasks','/hod/tasks'],['Reports','/hod/reports']].map(([title, route]) => <button key={title} onClick={() => navigate(route)} className="rounded-xl border bg-card p-3 text-left text-xs font-semibold transition hover:-translate-y-0.5 hover:border-indigo-400">{title}<ArrowUpRight className="mt-3 h-4 w-4 text-indigo-500"/></button>)}
      </div>

      {/* Quick Action Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickActionCard
          title="Review Approvals"
          description="Process pending requests"
          icon={<FileCheck className="w-5 h-5" />}
          to="/hod/approvals"
          variant="amber"
        />
        <QuickActionCard
          title="Faculty Roster"
          description="Manage workloads"
          icon={<UserCheck className="w-5 h-5" />}
          to="/hod/faculty"
          variant="primary"
        />
        <QuickActionCard
          title="Student Roster"
          description="View attendance & profiles"
          icon={<Users className="w-5 h-5" />}
          to="/hod/students"
          variant="success"
        />
        <QuickActionCard
          title="Availability Board"
          description="Live Leave & OD status"
          icon={<Building2 className="w-5 h-5" />}
          to="/hod/department-availability"
        />
      </div>

      {/* Realtime Availability Board Widget */}
      <SectionCard title="Department Availability Board" subtitle="Live Leave & On Duty (OD) presence for faculty and students">
        <DepartmentAvailabilityBoard />
      </SectionCard>

      {/* Recent Approvals Queue */}
      <SectionCard
        title="Recent Approval Submissions"
        subtitle="Incoming leave and OD requests awaiting department decision"
        action={
          <button
            onClick={() => navigate('/hod/approvals')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            Open Approval Desk
          </button>
        }
      >
        {recentRequests.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No pending approval requests.</p>
        ) : (
          <div className="space-y-3">
            {recentRequests.slice(0, 4).map((req: any) => (
              <div
                key={req.id}
                onClick={() => navigate('/hod/approvals')}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 hover:border-indigo-300 cursor-pointer transition-all flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{req.applicantName || req.user?.firstName || 'Applicant'}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{req.reason || 'Leave request'} ({req.startDate})</p>
                </div>
                <StatusBadge status={req.status || 'PENDING_HOD'} size="sm" />
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default HodDashboardWorkspace;
