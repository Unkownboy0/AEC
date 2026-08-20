import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, UserCheck, BookOpen, CalendarDays, Megaphone, Sparkles, CheckSquare, ChevronRight,
  ClipboardCheck, Users, FileCheck
} from 'lucide-react';
import { Skeleton } from '../../../design-system/components/Skeleton';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { pageVariants } from '../../../design-system/tokens/motion';
import api from '../../../lib/axios';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const FacultyDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFacultyDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard/stats');
      if (res.data?.status === 'success') {
        setStats(res.data.data.metrics);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load faculty metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyDashboard();
  }, []);

  if (isLoading) {
    return <Skeleton variant="card" count={4} />;
  }

  if (error) {
    return <ErrorState title="Faculty Dashboard Error" message={error} onRetry={fetchFacultyDashboard} />;
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 max-w-7xl mx-auto pb-10"
    >
      {/* Faculty Hero Banner */}
      <div className="relative bg-gradient-to-b from-purple-100/60 via-purple-50/40 to-transparent dark:from-purple-950/30 dark:via-purple-900/10 dark:to-transparent rounded-3xl p-5 sm:p-7 border border-purple-200/50 dark:border-purple-800/40 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="h-4 w-4" />
              Faculty Workspace
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
              <span className="hidden sm:inline">Welcome back, {user?.firstName}!</span>
              <span className="sm:hidden">Faculty Overview</span>
            </h1>
            <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
              Today's timetable, pending attendance marking, assigned subjects, and leave status.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/faculty/attendance')}
            className="px-4 py-2.5 rounded-2xl font-bold text-xs border-2 border-primary/40 bg-surface text-primary hover:bg-primary-soft transition-all flex items-center gap-2 shadow-xs active:scale-95 shrink-0"
          >
            <ClipboardCheck className="w-4 h-4 text-primary" />
            <span>Mark Attendance</span>
          </button>
        </div>

        {/* 6 Faculty Quick Action Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div
            onClick={() => navigate('/faculty/attendance')}
            className="group flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ClipboardCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary truncate">Attendance</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-colors shrink-0" />
          </div>

          <div
            onClick={() => navigate('/faculty/subjects')}
            className="group flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary truncate">Subjects</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-colors shrink-0" />
          </div>

          <div
            onClick={() => navigate('/faculty/timetable')}
            className="group flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary truncate">Timetable</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-colors shrink-0" />
          </div>

          <div
            onClick={() => navigate('/faculty/leave-od')}
            className="group flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <FileCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary truncate">Leave / OD</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-colors shrink-0" />
          </div>

          <div
            onClick={() => navigate('/faculty/mentor/dashboard')}
            className="group flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary truncate">Mentor Desk</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-colors shrink-0" />
          </div>

          <div
            onClick={() => navigate('/circulars')}
            className="group flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Megaphone className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary truncate">Circulars</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-colors shrink-0" />
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/faculty/timetable')}
          className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              TODAY'S CLASSES
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800">
              Scheduled
            </span>
          </div>
          <p className="text-3xl font-extrabold text-text-primary tracking-tight">
            {stats?.todayClassesCount ?? 4}
          </p>
          <p className="text-xs text-text-muted mt-1 font-medium">Periods scheduled for today</p>
        </div>

        <div
          onClick={() => navigate('/faculty/attendance')}
          className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              PENDING ATTENDANCE
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <p className="text-3xl font-extrabold text-text-primary tracking-tight">
            {stats?.pendingAttendanceCount ?? 1}
          </p>
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1">Submission required</p>
        </div>

        <div
          onClick={() => navigate('/faculty/subjects')}
          className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              ASSIGNED SUBJECTS
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800">
              Odd Sem
            </span>
          </div>
          <p className="text-3xl font-extrabold text-text-primary tracking-tight">
            {stats?.assignedSubjectsCount ?? 3}
          </p>
          <p className="text-xs text-text-muted mt-1 font-medium">Courses under instruction</p>
        </div>

        <div
          onClick={() => navigate('/faculty/leave-od')}
          className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              LEAVE / OD STATUS
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-full border border-purple-200 dark:border-purple-800">
              Available
            </span>
          </div>
          <p className="text-3xl font-extrabold text-text-primary tracking-tight">
            {stats?.leaveBalance ?? '12 Days'}
          </p>
          <p className="text-xs text-text-muted mt-1 font-medium">Casual / On-Duty balance</p>
        </div>
      </div>
    </motion.div>
  );
};
