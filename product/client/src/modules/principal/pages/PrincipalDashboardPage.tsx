import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Landmark, Users, GraduationCap, TrendingUp, Sparkles, Megaphone } from 'lucide-react';
import { MetricCard } from '../../../design-system/components/MetricCard';
import { Skeleton } from '../../../design-system/components/Skeleton';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { pageVariants } from '../../../design-system/tokens/motion';
import api from '../../../lib/axios';
import { useAuth } from '../../../context/AuthContext';

export const PrincipalDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrincipalStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard/stats');
      if (res.data?.status === 'success') {
        setStats(res.data.data.metrics);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load principal metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrincipalStats();
  }, []);

  if (isLoading) {
    return <Skeleton variant="card" count={4} />;
  }

  if (error) {
    return <ErrorState title="Executive Dashboard Error" message={error} onRetry={fetchPrincipalStats} />;
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Executive Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-border">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
          <Sparkles className="h-4 w-4" />
          Principal Executive Portal
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Institutional Command Center
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          High-level institutional performance, pending executive approvals, and department health.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Executive Approvals"
          value={stats?.pendingExecutiveApprovals ?? 0}
          trend="Pending Review"
          isPositive={false}
          icon={ShieldCheck}
          colorClass="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
        <MetricCard
          title="Total Enrollment"
          value={stats?.totalStudents ?? 4200}
          trend="+6.2% vs last year"
          isPositive={true}
          icon={GraduationCap}
          colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <MetricCard
          title="Faculty Strength"
          value={stats?.totalFaculty ?? 240}
          trend="12 Departments"
          isPositive={true}
          icon={Users}
          colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          title="Institution Health"
          value="96.4%"
          trend="Optimal"
          isPositive={true}
          icon={TrendingUp}
          colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
      </div>
    </motion.div>
  );
};
