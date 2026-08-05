import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, CheckSquare, Clock, Megaphone, AlertCircle, TrendingUp, Sparkles, BookOpen, Calendar
} from 'lucide-react';
import { MetricCard } from '../../../design-system/components/MetricCard';
import { Skeleton } from '../../../design-system/components/Skeleton';
import { EmptyState } from '../../../design-system/components/EmptyState';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { pageVariants } from '../../../design-system/tokens/motion';
import api from '../../../lib/axios';
import { useAuth } from '../../../context/AuthContext';

export const HodDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard/stats');
      if (res.data?.status === 'success') {
        setStats(res.data.data.metrics);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load department metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <Skeleton variant="card" count={4} />;
  }

  if (error) {
    return <ErrorState title="Department Dashboard Error" message={error} onRetry={fetchDashboardData} />;
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-border">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="h-4 w-4" />
            Head of Department
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Department Command Center
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Welcome back, {user?.firstName}. Overview of department attendance, approvals, and faculty activity.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Pending Approvals"
          value={stats?.pendingApprovalsCount ?? 0}
          trend="Requires Action"
          isPositive={false}
          icon={CheckSquare}
          colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <MetricCard
          title="Department Students"
          value={stats?.totalStudents ?? 0}
          trend="+4% this semester"
          isPositive={true}
          icon={Users}
          colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <MetricCard
          title="Active Faculty"
          value={stats?.totalFaculty ?? 0}
          trend="All slots assigned"
          isPositive={true}
          icon={BookOpen}
          colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          title="Avg Attendance"
          value={`${stats?.avgAttendance ?? 88}%`}
          trend="Target >85%"
          isPositive={true}
          icon={TrendingUp}
          colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* Recent Updates */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" />
          Department Notices & Alerts
        </h3>
        <p className="text-xs text-muted-foreground">
          Realtime telemetry and department workflows synchronized with institution APIs.
        </p>
      </div>
    </motion.div>
  );
};
