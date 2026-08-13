import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Search,
  Megaphone,
  CheckSquare,
  BarChart3,
  Power,
  ChevronRight,
  CalendarPlus,
  FileUp,
  MessageSquare,
  Pencil,
  AlertTriangle,
  GraduationCap,
  Users,
  Building2,
  TrendingUp,
  CheckCircle2,
  FileText,
  Download,
  AlertCircle,
  Clock,
  Award,
  Briefcase,
  Filter,
  AlertOctagon
} from 'lucide-react';
import { Skeleton } from '../../../design-system/components/Skeleton';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { StatusBadge } from '../../../design-system/components/StatusBadge';
import { pageVariants } from '../../../design-system/tokens/motion';
import api from '../../../lib/axios';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useRealtimeSync } from '../../../hooks/useRealtimeSync';
import { PrincipalStatusModal } from '../../principal-availability/components/PrincipalStatusModal';
import { useDelegationContext } from '../../delegation/context/DelegationContext';

export const PrincipalDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { principalStatus, delegationStatus, refetch: refetchDelegation } = useDelegationContext();
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const { data: syncStats, isLoading: isSyncLoading, refetch } = useRealtimeSync(
    ['principal-dashboard-stats'],
    '/dashboard/stats',
    { intervalMs: 10000 }
  );

  const fallbackStats = {
    pendingApprovals: 1,
    institutionAttendance: '94.2%',
    activeFaculty: 45,
    totalStudents: 161,
    openComplaints: 1,
    riskCount: 12,
  };

  const stats = syncStats?.metrics || fallbackStats;
  const isLoading = isSyncLoading && !syncStats;
  const [error, setError] = useState<string | null>(null);

  const isDelegated = delegationStatus === 'ACTIVE' || (principalStatus && (principalStatus as string) !== 'AVAILABLE' && (principalStatus as string) !== 'ONLINE');

  if (isLoading) return <Skeleton variant="card" count={4} />;
  if (error) return <ErrorState title="Executive Dashboard Error" message={error} onRetry={() => refetch()} />;

  const departmentsData = syncStats?.departments || [
    { name: 'Computer Science & Engineering', hod: 'John Doe (HOD)', students: 161, faculty: 45, attendance: '96.1%', passRate: '94.5%', placement: '92.0%', complaints: 0, riskCount: 2 },
  ];

  const complaintsData = [
    { id: '1', title: 'Lab Equipment Maintenance Delay', category: 'Infrastructure', raisedBy: 'CSE HOD', date: '04 Aug 2026', priority: 'HIGH', status: 'IN_PROGRESS', reason: 'High-end GPU server in Lab 3 experiencing power supply fluctuations causing practical session delays.' },
    { id: '2', title: 'Library Digital Journal Access Defect', category: 'Academic', raisedBy: 'Faculty Council', date: '03 Aug 2026', priority: 'MEDIUM', status: 'OPEN', reason: 'IEEE Xplore authentication token expiration preventing research paper downloads.' },
  ];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 max-w-7xl mx-auto pb-10"
    >
      <PrincipalStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        currentStatus={principalStatus === 'ONLINE' ? 'AVAILABLE' : principalStatus || 'AVAILABLE'}
        onStatusUpdated={() => {
          setIsStatusModalOpen(false);
          if (refetchDelegation) refetchDelegation();
        }}
      />

      {/* ─── Executive Overview Hero Box ───────────────── */}
      <div className="relative bg-gradient-to-b from-purple-100/80 via-purple-50/60 to-surface dark:from-purple-950/60 dark:via-purple-900/40 dark:to-surface bg-surface backdrop-blur-md rounded-3xl p-5 sm:p-7 border border-purple-200/50 dark:border-purple-800/40 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" /> Institutional Governance
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
              Principal Executive Command
            </h1>
            <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
              Institution-wide governance, high-level approvals, departmental performance, and grievance oversight.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsStatusModalOpen(true)}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 border-2 shadow-xs active:scale-95 shrink-0 ${
              isDelegated
                ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                : 'border-primary/40 bg-surface text-primary hover:bg-primary-soft'
            }`}
          >
            <Power className="w-4 h-4 text-primary" />
            <span>{isDelegated ? 'Return Available' : 'Set Delegation Mode'}</span>
          </button>
        </div>

        {/* Active Delegation Alert */}
        {isDelegated && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <h4 className="font-bold text-xs">Delegation Active</h4>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Vice Principal Dr. Ramesh is handling selected institutional approvals.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/principal/approval-center')}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0"
            >
              Monitor Approvals
            </button>
          </div>
        )}

        {/* 6 Hero Quick Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div
            onClick={() => navigate('/principal/students')}
            className="group flex items-center justify-between p-3 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary leading-tight">Student Review</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-colors shrink-0" />
          </div>

          <div
            onClick={() => navigate('/institution/details')}
            className="group flex items-center justify-between p-3 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Search className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary leading-tight">Directory</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-colors shrink-0" />
          </div>

          <div
            onClick={() => navigate('/principal/circulars')}
            className="group flex items-center justify-between p-3 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Megaphone className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary leading-tight">Circulars</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-colors shrink-0" />
          </div>

          <div
            onClick={() => navigate('/principal/tasks')}
            className="group flex items-center justify-between p-3 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <CheckSquare className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary leading-tight">Assign Task</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-colors shrink-0" />
          </div>

          <div
            onClick={() => navigate('/principal/reports')}
            className="group flex items-center justify-between p-3 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary leading-tight">Analytics</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-colors shrink-0" />
          </div>

          <div
            onClick={() => navigate('/principal/department-availability')}
            className="group flex items-center justify-between p-3 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                <Power className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary leading-tight">Availability</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-colors shrink-0" />
          </div>
        </div>
      </div>

      {/* ─── QUICK ACCESS SECTION ───────────────── */}
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-muted mb-3 px-1">
          QUICK ACCESS
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div
            onClick={() => navigate('/principal/tasks')}
            className="flex items-center gap-3.5 p-4 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-text-primary leading-snug">Create Meeting</h4>
            </div>
          </div>

          <div
            onClick={() => navigate('/principal/reports')}
            className="flex items-center gap-3.5 p-4 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <FileUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-text-primary leading-snug">Submit Report</h4>
            </div>
          </div>

          <div
            onClick={() => navigate('/hod/dashboard')}
            className="flex items-center gap-3.5 p-4 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-text-primary leading-snug">Message Department Head</h4>
            </div>
          </div>

          <div
            onClick={() => navigate('/principal/circulars')}
            className="relative flex items-center gap-3.5 p-4 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-text-primary leading-snug">New Announcement</h4>
            </div>
            <Pencil className="w-4 h-4 text-text-muted shrink-0" />
          </div>
        </div>
      </div>

      {/* ─── 8 EXECUTIVE KPI CARDS ───────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Pending Approvals */}
        <div
          onClick={() => navigate('/principal/approval-center')}
          className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              PENDING APPROVALS
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-extrabold text-text-primary tracking-tight">
                {stats?.pendingApprovals ?? 3}
              </p>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1">Pending decision</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric 2: Campus Attendance */}
        <div
          onClick={() => navigate('/principal/department-availability')}
          className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              CAMPUS ATTENDANCE
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800">
              Good
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-extrabold text-text-primary tracking-tight">
                {stats?.institutionAttendance ?? '94.2%'}
              </p>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">Overall daily average</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric 3: Total Students */}
        <div
          onClick={() => navigate('/principal/students')}
          className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              TOTAL STUDENTS
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-full border border-purple-200 dark:border-purple-800">
              Enrolled
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-extrabold text-text-primary tracking-tight">
                {stats?.totalStudents ?? 2480}
              </p>
              <p className="text-xs text-text-muted mt-1 font-medium">Across all departments</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric 4: Teaching Staff */}
        <div
          onClick={() => navigate('/principal/faculty')}
          className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              TEACHING FACULTY
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800">
              Active
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-extrabold text-text-primary tracking-tight">
                {stats?.totalFaculty ?? 184}
              </p>
              <p className="text-xs text-text-muted mt-1 font-medium">Full-time teaching staff</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric 5: Placement Rate */}
        <div
          onClick={() => navigate('/vp/placements')}
          className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              PLACEMENT RATE
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200 dark:border-indigo-800">
              Final Year
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-extrabold text-text-primary tracking-tight">
                {stats?.placementRate ?? '88.4%'}
              </p>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">420 Candidates Placed</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric 6: Pass Percentage */}
        <div
          onClick={() => navigate('/principal/reports')}
          className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              ACADEMIC PASS RATE
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-full border border-teal-200 dark:border-teal-800">
              Odd Sem
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-extrabold text-text-primary tracking-tight">
                {stats?.passPercentage ?? '91.2%'}
              </p>
              <p className="text-xs text-text-muted mt-1 font-medium">Institution Pass %</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric 7: Open Complaints */}
        <div
          onClick={() => navigate('/principal/complaints')}
          className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              OPEN COMPLAINTS
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-extrabold text-text-primary tracking-tight">
                {stats?.pendingComplaints ?? 4}
              </p>
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1">Requires Oversight</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric 8: At-Risk Students */}
        <div
          onClick={() => navigate('/principal/students')}
          className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              AT-RISK STUDENTS
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800">
              Low Attendance/GPA
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-extrabold text-text-primary tracking-tight">
                {stats?.atRiskStudents ?? 12}
              </p>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1">Mentor Intervention Active</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── DEPARTMENT PERFORMANCE COMPARISON ─────────────────── */}
      <div className="bg-surface p-5 sm:p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Department Academic & Governance Comparison
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Ranked overview of department attendance, pass percentage, placement, and open risk cases.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/principal/departments')}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 shrink-0"
          >
            Full Department Matrix <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 text-text-muted uppercase tracking-wider text-[10px] font-extrabold">
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">HOD</th>
                <th className="py-2.5 px-3">Enrolled</th>
                <th className="py-2.5 px-3">Attendance</th>
                <th className="py-2.5 px-3">Pass Rate</th>
                <th className="py-2.5 px-3">Placement</th>
                <th className="py-2.5 px-3">Open Risks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium text-text-primary">
              {departmentsData.map((dept: any, idx: number) => (
                <tr key={idx} className="hover:bg-surface-soft/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-text-primary">{dept.name}</td>
                  <td className="py-3 px-3 text-text-muted">{dept.hod}</td>
                  <td className="py-3 px-3 font-semibold">{dept.students} Students</td>
                  <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">{dept.attendance}</td>
                  <td className="py-3 px-3 font-bold text-blue-600 dark:text-blue-400">{dept.passRate}</td>
                  <td className="py-3 px-3 font-bold text-purple-600 dark:text-purple-400">{dept.placement}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      {dept.riskCount} Risk Cases
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards */}
        <div className="md:hidden space-y-3">
          {departmentsData.map((dept: any, idx: number) => (
            <div key={idx} className="p-4 bg-surface-soft border border-border/70 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-text-primary">{dept.name}</h4>
                <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Att: {dept.attendance}
                </span>
              </div>
              <p className="text-[11px] text-text-muted">HOD: {dept.hod} • {dept.students} Students</p>
              <div className="flex items-center justify-between text-[11px] font-bold text-text-muted pt-1 border-t border-border/50">
                <span>Pass: <strong className="text-blue-600 dark:text-blue-400">{dept.passRate}</strong></span>
                <span>Placement: <strong className="text-purple-600 dark:text-purple-400">{dept.placement}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── URGENT COMPLAINTS & EXECUTIVE REPORTS SHORTCUTS ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Complaints Monitor */}
        <div className="bg-surface p-5 rounded-2xl border border-border/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              Grievance Oversight Monitor
            </h3>
            <span className="text-xs font-bold text-primary hover:underline cursor-pointer" onClick={() => navigate('/principal/complaints')}>
              View Complaints
            </span>
          </div>

          <div className="space-y-3">
            {complaintsData.map((item) => (
              <div key={item.id} className="p-3.5 bg-surface-soft border border-border/70 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-text-primary">{item.title}</span>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-md border border-rose-200 dark:border-rose-800">
                    {item.priority}
                  </span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">{item.reason}</p>
                <div className="flex items-center justify-between text-[10px] text-text-muted pt-1">
                  <span>Raised by: <strong>{item.raisedBy}</strong></span>
                  <span>Date: {item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Executive Reports & Export Center */}
        <div className="bg-surface p-5 rounded-2xl border border-border/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Executive Reports &amp; Exports
            </h3>
            <span className="text-xs font-bold text-primary hover:underline cursor-pointer" onClick={() => navigate('/principal/reports')}>
              Full Export Center
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-surface-soft border border-border/70 rounded-xl flex items-center justify-between hover:border-primary/40 transition-all cursor-pointer">
              <div>
                <h4 className="font-bold text-xs text-text-primary">Institution Health Report</h4>
                <p className="text-[10px] text-text-muted mt-0.5">PDF • Excel • CSV</p>
              </div>
              <Download className="w-4 h-4 text-primary shrink-0" />
            </div>

            <div className="p-3.5 bg-surface-soft border border-border/70 rounded-xl flex items-center justify-between hover:border-primary/40 transition-all cursor-pointer">
              <div>
                <h4 className="font-bold text-xs text-text-primary">Department Audit Matrix</h4>
                <p className="text-[10px] text-text-muted mt-0.5">PDF • Excel • CSV</p>
              </div>
              <Download className="w-4 h-4 text-primary shrink-0" />
            </div>

            <div className="p-3.5 bg-surface-soft border border-border/70 rounded-xl flex items-center justify-between hover:border-primary/40 transition-all cursor-pointer">
              <div>
                <h4 className="font-bold text-xs text-text-primary">Grievance Resolution Summary</h4>
                <p className="text-[10px] text-text-muted mt-0.5">Includes full reasons</p>
              </div>
              <Download className="w-4 h-4 text-primary shrink-0" />
            </div>

            <div className="p-3.5 bg-surface-soft border border-border/70 rounded-xl flex items-center justify-between hover:border-primary/40 transition-all cursor-pointer">
              <div>
                <h4 className="font-bold text-xs text-text-primary">Placement Analytics Deck</h4>
                <p className="text-[10px] text-text-muted mt-0.5">PDF • Excel • CSV</p>
              </div>
              <Download className="w-4 h-4 text-primary shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
