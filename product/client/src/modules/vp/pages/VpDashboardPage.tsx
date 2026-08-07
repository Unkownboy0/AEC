import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Briefcase,
  UserCheck,
  Building2,
  Megaphone,
  ShieldAlert,
  ChevronRight,
  Clock,
  Users,
  CheckSquare,
  FileCheck,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Skeleton } from '../../../design-system/components/Skeleton';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { pageVariants } from '../../../design-system/tokens/motion';
import api from '../../../lib/axios';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import { useRealtimeSync } from '../../../hooks/useRealtimeSync';

export const VpDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: syncStats, isLoading: isSyncLoading, refetch } = useRealtimeSync(
    ['vp-dashboard-stats'],
    '/dashboard/stats',
    { intervalMs: 10000 }
  );

  const fallbackStats = {
    attendancePercentage: 93.4,
    placementEligible: 420,
    facultyPresence: 96,
    pendingDelegatedCount: 3,
  };

  const stats = syncStats?.metrics || fallbackStats;
  const isLoading = isSyncLoading && !syncStats;
  const [isActingPrincipal, setIsActingPrincipal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVpStats = async () => {
    try {
      const availRes = await api.get('/settings/principal-availability');

      if (availRes.status === 200 && availRes.data?.status === 'success') {
        setIsActingPrincipal(availRes.data.data.isOffline);
      }
    } catch (err: any) {
      console.error('Failed to load VP availability');
    }
  };

  useEffect(() => {
    fetchVpStats();
  }, []);


  if (isLoading) return <Skeleton variant="card" count={4} />;
  if (error) return <ErrorState title="VP Operations Error" message={error} onRetry={fetchVpStats} />;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 max-w-7xl mx-auto pb-10"
    >
      {/* VP Hero Overview Card */}
      <div className="relative bg-gradient-to-b from-indigo-100/60 via-indigo-50/40 to-transparent dark:from-indigo-950/30 dark:via-indigo-900/10 dark:to-transparent rounded-3xl p-5 sm:p-7 border border-indigo-200/50 dark:border-indigo-800/40 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
              Vice Principal Command
            </h1>
            <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
              Campus operations, academic monitoring, placement drives, and administrative oversight.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/vp/acting-principal/approvals')}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 border-2 shadow-xs active:scale-95 ${
              isActingPrincipal
                ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                : 'border-primary/40 bg-surface text-primary hover:bg-primary-soft'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-primary" />
            <span>{isActingPrincipal ? 'Acting Desk Active' : 'Delegation Desk'}</span>
          </button>
        </div>

        {/* Acting Principal Mode Banner if Active */}
        {isActingPrincipal && (
          <div className="mb-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-900 dark:text-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div>
                <h4 className="font-bold text-xs">Acting Principal Authority Active</h4>
                <p className="text-xs text-indigo-700 dark:text-indigo-300">
                  The Principal is offline. You are currently handling delegated institutional approvals.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/vp/acting-principal/approvals')}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0"
            >
              Open Approvals Desk
            </button>
          </div>
        )}

        {/* 8 VP Quick Action Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div
            onClick={() => navigate('/vp/operations')}
            className="group flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary truncate">Operations</span>
            </div>
          </div>

          <div
            onClick={() => navigate('/vp/attendance')}
            className="group flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary truncate">Attendance</span>
            </div>
          </div>

          <div
            onClick={() => navigate('/vp/placements')}
            className="group flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary truncate">Placements</span>
            </div>
          </div>

          <div
            onClick={() => navigate('/vp/departments')}
            className="group flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary truncate">Depts</span>
            </div>
          </div>

          <div
            onClick={() => navigate('/vp/faculty')}
            className="group flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary truncate">Faculty</span>
            </div>
          </div>

          <div
            onClick={() => navigate('/vp/students')}
            className="group flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary truncate">Students</span>
            </div>
          </div>

          <div
            onClick={() => navigate('/vp/circulars')}
            className="group flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Megaphone className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary truncate">Notices</span>
            </div>
          </div>

          <div
            onClick={() => navigate('/vp/acting-principal/approvals')}
            className="group flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary truncate">Delegated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operations Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/vp/attendance')}
          className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              CAMPUS ATTENDANCE
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800">
              Optimal
            </span>
          </div>
          <p className="text-3xl font-extrabold text-text-primary tracking-tight">
            {stats?.attendancePercentage ?? 93.4}%
          </p>
          <p className="text-xs text-text-muted mt-1 font-medium">Daily student attendance rate</p>
        </div>

        <div
          onClick={() => navigate('/vp/placements')}
          className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              PLACEMENT ELIGIBLE
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800">
              Final Year
            </span>
          </div>
          <p className="text-3xl font-extrabold text-text-primary tracking-tight">
            {stats?.placementEligible ?? 420}
          </p>
          <p className="text-xs text-text-muted mt-1 font-medium">Candidates active for drives</p>
        </div>

        <div
          onClick={() => navigate('/vp/faculty')}
          className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              FACULTY PRESENCE
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-full border border-purple-200 dark:border-purple-800">
              Present
            </span>
          </div>
          <p className="text-3xl font-extrabold text-text-primary tracking-tight">
            {stats?.facultyPresence ?? 96}%
          </p>
          <p className="text-xs text-text-muted mt-1 font-medium">On-duty teaching staff</p>
        </div>

        <div
          onClick={() => navigate('/vp/acting-principal/approvals')}
          className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              DELEGATED APPROVALS
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
              isActingPrincipal
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                : 'bg-surface-soft text-text-muted border-border'
            }`}>
              {isActingPrincipal ? 'Active' : 'Offline'}
            </span>
          </div>
          <p className="text-3xl font-extrabold text-text-primary tracking-tight">
            {isActingPrincipal ? (stats?.pendingDelegatedCount ?? 3) : 0}
          </p>
          <p className="text-xs text-text-muted mt-1 font-medium">
            {isActingPrincipal ? 'Requires VP decision' : 'Principal online'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
