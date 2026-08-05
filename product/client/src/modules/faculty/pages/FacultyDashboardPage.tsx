import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, UserCheck, BookOpen, CalendarDays, Megaphone, Sparkles, CheckSquare } from 'lucide-react';
import { MetricCard } from '../../../design-system/components/MetricCard';
import { Skeleton } from '../../../design-system/components/Skeleton';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { pageVariants } from '../../../design-system/tokens/motion';
import api from '../../../lib/axios';
import { useAuth } from '../../../context/AuthContext';

export const FacultyDashboardPage: React.FC = () => {
  const { user } = useAuth();
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
      className="space-y-6"
    >
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-border">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
          <Sparkles className="h-4 w-4" />
          Faculty Workspace
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Welcome, {user?.firstName}!
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          View today's timetable, pending attendance, assigned subjects, and leave status.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Classes"
          value={stats?.todayClassesCount ?? 4}
          trend="Next: 11:30 AM"
          isPositive={true}
          icon={Clock}
          colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <MetricCard
          title="Pending Attendance"
          value={stats?.pendingAttendanceCount ?? 1}
          trend="Needs Submission"
          isPositive={false}
          icon={UserCheck}
          colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <MetricCard
          title="Assigned Subjects"
          value={stats?.assignedSubjectsCount ?? 3}
          trend="Odd Semester"
          isPositive={true}
          icon={BookOpen}
          colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          title="Leave / OD Status"
          value={stats?.leaveBalance ?? '12 Days'}
          trend="Available"
          isPositive={true}
          icon={CalendarDays}
          colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400"
        />
      </div>
    </motion.div>
  );
};
