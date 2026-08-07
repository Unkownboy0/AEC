import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  UserCheck,
  FileCheck,
  BookOpen,
  Award,
  CreditCard,
  Bell,
  Clock,
  ChevronRight,
  Megaphone,
  Sparkles
} from 'lucide-react';
import { Skeleton } from '../../../design-system/components/Skeleton';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { pageVariants } from '../../../design-system/tokens/motion';
import api from '../../../lib/axios';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import { useRealtimeSync } from '../../../hooks/useRealtimeSync';

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Integrated Realtime Polling (fetches every 10 seconds, auto-syncs on tab focus)
  const { data: syncData, isLoading: isSyncLoading, error: syncError, refetch } = useRealtimeSync(
    ['student-dashboard-summary'],
    '/enterprise/students/dashboard-summary',
    { intervalMs: 10000 }
  );

  // Fallback state if API fails or backend offline
  const fallbackData = {
    metrics: {
      attendancePercentage: 92,
      cgpa: '9.2',
      pendingAssignmentsCount: 2,
      leaveStatus: 'APPROVED',
      feeDue: '₹0',
    },
    todaysClasses: [
      { time: '09:00 AM - 10:00 AM', subject: 'Data Structures & Algorithms', room: 'Lab 3', teacher: 'Dr. Priya' },
      { time: '10:15 AM - 11:15 AM', subject: 'Database Management Systems', room: 'Hall B', teacher: 'Prof. Ramesh' },
      { time: '01:30 PM - 02:30 PM', subject: 'Computer Networks', room: 'Room 204', teacher: 'Dr. Priya' },
    ],
    pendingAssignments: [
      { title: 'Tree Traversal Implementation', subject: 'DSA', dueDate: 'Tomorrow, 11:59 PM' },
      { title: 'ER Diagram & Relational Schema', subject: 'DBMS', dueDate: '08 Aug, 05:00 PM' },
    ],
    latestCirculars: [
      { id: '1', title: 'Mid-Semester Examination Schedule', date: '04 Aug 2026' },
      { id: '2', title: 'Annual Cultural Fest Registration Open', date: '02 Aug 2026' },
    ],
  };

  const data = syncData || fallbackData;
  const isLoading = isSyncLoading && !syncData;
  const error = syncError ? (syncError.message || 'Error loading dashboard') : null;

  if (isLoading) {
    return <Skeleton variant="card" count={4} />;
  }

  if (error) {
    return <ErrorState title="Student Dashboard Error" message={error} onRetry={refetch} />;
  }


  const metrics = data?.metrics || {};

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 max-w-7xl mx-auto pb-10"
    >
      {/* Student Hero Banner */}
      <div className="relative bg-gradient-to-b from-blue-100/60 via-blue-50/40 to-transparent dark:from-blue-950/30 dark:via-blue-900/10 dark:to-transparent rounded-3xl p-5 sm:p-7 border border-blue-200/50 dark:border-blue-800/40 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="h-4 w-4" />
              Student Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
              Hi, {user?.firstName || 'Student'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
              Check today's class schedule, attendance status, pending tasks, and announcements.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/student/requests')}
            className="px-4 py-2.5 rounded-2xl font-bold text-xs border-2 border-primary/40 bg-surface text-primary hover:bg-primary-soft transition-all flex items-center gap-2 shadow-xs active:scale-95 shrink-0"
          >
            <FileCheck className="w-4 h-4 text-primary" />
            <span>Apply Leave / OD</span>
          </button>
        </div>

        {/* 8 Student Quick Action Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div
            onClick={() => navigate('/student/timetable')}
            className="group flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <CalendarDays className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary truncate">Timetable</span>
            </div>
          </div>

          <div
            onClick={() => navigate('/student/attendance')}
            className="group flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary truncate">Attendance</span>
            </div>
          </div>

          <div
            onClick={() => navigate('/student/requests')}
            className="group flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <FileCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary truncate">Leave/OD</span>
            </div>
          </div>

          <div
            onClick={() => navigate('/student/assignments')}
            className="group flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary truncate">Work</span>
            </div>
          </div>

          <div
            onClick={() => navigate('/student/results')}
            className="group flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary truncate">Marks</span>
            </div>
          </div>

          <div
            onClick={() => navigate('/student/fees')}
            className="group flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary truncate">Fees</span>
            </div>
          </div>

          <div
            onClick={() => navigate('/notifications')}
            className="group flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary truncate">Alerts</span>
            </div>
          </div>

          <div
            onClick={() => navigate('/circulars')}
            className="group flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Megaphone className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary truncate">Circulars</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/student/attendance')}
          className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              ATTENDANCE
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800">
              Target &gt;85%
            </span>
          </div>
          <p className="text-3xl font-extrabold text-text-primary tracking-tight">
            {metrics.attendancePercentage ?? 92}%
          </p>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">Good Standing</p>
        </div>

        <div
          onClick={() => navigate('/student/results')}
          className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              CURRENT CGPA
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-full border border-purple-200 dark:border-purple-800">
              Top 10%
            </span>
          </div>
          <p className="text-3xl font-extrabold text-text-primary tracking-tight">
            {metrics.cgpa ?? '9.2'}
          </p>
          <p className="text-xs text-text-muted mt-1 font-medium">Semester score aggregate</p>
        </div>

        <div
          onClick={() => navigate('/student/assignments')}
          className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              PENDING WORK
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <p className="text-3xl font-extrabold text-text-primary tracking-tight">
            {metrics.pendingAssignmentsCount ?? 2}
          </p>
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1">Assignments due</p>
        </div>

        <div
          onClick={() => navigate('/student/requests')}
          className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              LEAVE / OD STATUS
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800">
              Approved
            </span>
          </div>
          <p className="text-3xl font-extrabold text-text-primary tracking-tight font-sans">
            {metrics.leaveStatus || 'Approved'}
          </p>
          <p className="text-xs text-text-muted mt-1 font-medium">Last application status</p>
        </div>
      </div>

      {/* Today's Schedule & Pending Work */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Classes */}
        <div className="bg-surface p-5 rounded-2xl border border-border/80 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-3">
            <h3 className="text-sm font-bold text-text-primary">Today's Class Schedule</h3>
            <span className="text-xs font-bold text-primary hover:underline cursor-pointer" onClick={() => navigate('/student/timetable')}>
              Full Timetable
            </span>
          </div>
          <div className="divide-y divide-border/60">
            {data?.todaysClasses?.map((item: any, idx: number) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-primary-soft text-primary shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary">{item.subject}</h4>
                    <p className="text-text-muted mt-0.5">{item.teacher} • {item.room}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-text-muted bg-surface-soft px-2.5 py-1 rounded-full border border-border shrink-0">
                  {item.time}
                </span>
              </div>
            )) || <p className="text-xs text-text-muted py-4">No classes scheduled for today.</p>}
          </div>
        </div>

        {/* Pending Assignments */}
        <div className="bg-surface p-5 rounded-2xl border border-border/80 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-3">
            <h3 className="text-sm font-bold text-text-primary">Pending Assignments</h3>
            <span className="text-xs font-bold text-primary hover:underline cursor-pointer" onClick={() => navigate('/student/assignments')}>
              View All
            </span>
          </div>
          <div className="divide-y divide-border/60">
            {data?.pendingAssignments?.map((item: any, idx: number) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-text-primary">{item.title}</h4>
                  <p className="text-text-muted mt-0.5">{item.subject}</p>
                </div>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800 shrink-0">
                  Due: {item.dueDate}
                </span>
              </div>
            )) || <p className="text-xs text-text-muted py-4">No pending assignments.</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StudentDashboardPage;
