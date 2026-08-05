import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckSquare, Megaphone, BarChart2, Sparkles, UserCheck } from 'lucide-react';
import { MetricCard } from '../../../design-system/components/MetricCard';
import { Skeleton } from '../../../design-system/components/Skeleton';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { pageVariants } from '../../../design-system/tokens/motion';
import api from '../../../lib/axios';
import { useAuth } from '../../../context/AuthContext';

export const AcademicDeanDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeanMetrics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard/stats');
      if (res.data?.status === 'success') {
        setStats(res.data.data.metrics);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load academic dean metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeanMetrics();
  }, []);

  if (isLoading) {
    return <Skeleton variant="card" count={4} />;
  }

  if (error) {
    return <ErrorState title="Academic Dean Portal Error" message={error} onRetry={fetchDeanMetrics} />;
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-border">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
          <Sparkles className="h-4 w-4" />
          Academic Dean Workspace
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Curriculum & Academic Governance
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Academic syllabus standards, department performance, and Dean task delegation.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Programs"
          value="18 Degrees"
          trend="UG & PG"
          isPositive={true}
          icon={BookOpen}
          colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <MetricCard
          title="Academic Tasks"
          value={stats?.pendingDeanTasks ?? 3}
          trend="Assigned to HODs"
          isPositive={true}
          icon={CheckSquare}
          colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          title="Campus Syllabus"
          value="100% Synced"
          trend="Academic Year 2026-2027"
          isPositive={true}
          icon={UserCheck}
          colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400"
        />
        <MetricCard
          title="Academic Directives"
          value="12 Directives"
          trend="Active"
          isPositive={true}
          icon={Megaphone}
          colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
      </div>
    </motion.div>
  );
};
