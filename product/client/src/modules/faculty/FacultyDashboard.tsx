import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckSquare,
  Calendar,
  PenTool,
  Award,
  FileCheck,
  CheckCircle2,
  Clock,
  BookOpen,
  Users,
  Megaphone,
  Upload,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { MetricCard } from '../../design-system/components/MetricCard';
import { QuickActionCard } from '../../design-system/components/QuickActionCard';
import { SectionCard } from '../../design-system/components/SectionCard';
import { Skeleton } from '../../design-system/components/Skeleton';
import { ErrorState } from '../../design-system/components/ErrorState';
import { StatusBadge } from '../../design-system/components/StatusBadge';
import { pageVariants } from '../../design-system/tokens/motion';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import { useRealtimeSync } from '../../hooks/useRealtimeSync';

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Integrated Realtime Sync Hook
  const { data: syncData, isLoading: isSyncLoading, refetch } = useRealtimeSync(
    ['faculty-dashboard-summary'],
    '/enterprise/faculty/dashboard-summary',
    { intervalMs: 10000 }
  );

  const fallbackData = {
    todayClassesCount: 4,
    metrics: {
      pendingAttendance: 1,
      assignmentsToGrade: 3,
      marksToEnter: 2,
      studentsOnLeave: 4,
    },
    classesSchedule: [
      { period: 1, time: '09:00 AM - 10:00 AM', subject: 'Data Structures', room: 'Lab 3', status: 'Completed' },
      { period: 2, time: '10:15 AM - 11:15 AM', subject: 'Algorithms', room: 'Hall B', status: 'Pending Attendance' },
      { period: 3, time: '01:30 PM - 02:30 PM', subject: 'Database Systems', room: 'Room 204', status: 'Upcoming' },
      { period: 4, time: '02:45 PM - 03:45 PM', subject: 'Operating Systems', room: 'Lab 1', status: 'Upcoming' },
    ],
    pendingTasks: [
      { id: '1', title: 'Grade Mid-Term Assignments', count: 18, actionPath: '/faculty/assignments' },
      { id: '2', title: 'Enter Internal Test 1 Marks', count: 42, actionPath: '/faculty/internal-marks' },
    ],
  };

  const data = syncData || fallbackData;
  const loading = isSyncLoading && !syncData;
  const error = null;

  if (loading) return <Skeleton variant="card" count={4} />;
  if (error) return <ErrorState title="Faculty Dashboard Error" message={error} onRetry={refetch} />;

  const facultyName = user ? `Dr. ${user.firstName} ${user.lastName}` : 'Dr. Priya';
  const classesCount = data?.todayClassesCount ?? 4;

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      {/* Faculty Greeting Banner */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 sm:p-8 rounded-2xl border border-border">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Good Morning, {facultyName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          You have {classesCount} classes scheduled for today.
        </p>

        {/* 8 Faculty Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-6">
          <QuickActionCard
            title="Mark Attendance"
            icon={CheckSquare}
            onClick={() => navigate('/faculty/attendance')}
          />
          <QuickActionCard
            title="View Timetable"
            icon={Calendar}
            onClick={() => navigate('/faculty/timetable')}
          />
          <QuickActionCard
            title="Create Assignment"
            icon={PenTool}
            onClick={() => navigate('/faculty/assignments')}
          />
          <QuickActionCard
            title="Enter Marks"
            icon={Award}
            onClick={() => navigate('/faculty/internal-marks')}
          />
          <QuickActionCard
            title="Leave Requests"
            icon={FileCheck}
            onClick={() => navigate('/faculty/leave-od')}
          />
          <QuickActionCard
            title="View Tasks"
            icon={CheckCircle2}
            onClick={() => navigate('/faculty/tasks')}
          />
          <QuickActionCard
            title="Send Message"
            icon={MessageSquare}
            onClick={() => navigate('/messages')}
          />
          <QuickActionCard
            title="Upload Material"
            icon={Upload}
            onClick={() => navigate('/faculty/resources')}
          />
        </div>
      </div>

      {/* 4 Important Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Pending Attendance"
          value={data?.metrics?.pendingAttendance ?? 1}
          trend="Period attendance required"
          isPositive={false}
          icon={Clock}
          colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          onClick={() => navigate('/faculty/attendance')}
        />
        <MetricCard
          title="Assignments to Grade"
          value={data?.metrics?.assignmentsToGrade ?? 3}
          trend="Submissions pending"
          isPositive={false}
          icon={BookOpen}
          colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          onClick={() => navigate('/faculty/assignments')}
        />
        <MetricCard
          title="Marks to Enter"
          value={data?.metrics?.marksToEnter ?? 2}
          trend="Internal assessment"
          isPositive={true}
          icon={Award}
          colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400"
          onClick={() => navigate('/faculty/internal-marks')}
        />
        <MetricCard
          title="Students on Leave/OD"
          value={data?.metrics?.studentsOnLeave ?? 4}
          trend="Today's approved list"
          isPositive={true}
          icon={Users}
          colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          onClick={() => navigate('/faculty/students')}
        />
      </div>

      {/* Today's Lectures & Pending Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionCard title="Today's Lectures">
            <div className="divide-y divide-border">
              {data?.classesSchedule?.map((slot: any) => (
                <div key={slot.period} className="py-3.5 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      P{slot.period}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{slot.subject}</h4>
                      <p className="text-xs text-muted-foreground">{slot.room} • {slot.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={slot.status} size="sm" />
                    {slot.status !== 'Completed' && (
                      <button
                        onClick={() => navigate('/faculty/attendance')}
                        className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs rounded-lg transition-colors"
                      >
                        Mark Attendance
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div>
          <SectionCard title="Pending Tasks & Action Items">
            <div className="divide-y divide-border">
              {data?.pendingTasks?.map((task: any) => (
                <div key={task.id} className="py-3 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-foreground">{task.title}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-medium">{task.dueDate}</span>
                  </div>
                  <button
                    onClick={() => navigate('/faculty/tasks')}
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-1 mt-1"
                  >
                    View Task Details <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </motion.div>
  );
};

