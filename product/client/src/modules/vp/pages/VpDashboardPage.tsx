import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Landmark, Users, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { MetricCard } from '../../../design-system/components/MetricCard';
import { Skeleton } from '../../../design-system/components/Skeleton';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { pageVariants } from '../../../design-system/tokens/motion';
import api from '../../../lib/axios';
import { useAuth } from '../../../context/AuthContext';

export const VpDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVpStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard/stats');
      if (res.data?.status === 'success') {
        setStats(res.data.data.metrics);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load VP operations metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVpStats();
  }, []);

  if (isLoading) {
    return <Skeleton variant="card" count={4} />;
  }

  if (error) {
    return <ErrorState title="VP Operations Error" message={error} onRetry={fetchVpStats} />;
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
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-border">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
          <Sparkles className="h-4 w-4" />
          Vice Principal Operations
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Operations & Academic Control
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Monitoring daily campus operations, attendance oversight, student affairs, and complaints.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Daily Operations"
          value="Normal"
          trend="All Shifts Active"
          isPositive={true}
          icon={Activity}
          colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <MetricCard
          title="Campus Attendance"
          value={`${stats?.avgAttendance ?? 91}%`}
          trend="Target >90%"
          isPositive={true}
          icon={UserCheck}
          colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          title="Grievances Desk"
          value={stats?.pendingComplaints ?? 2}
          trend="Under Review"
          isPositive={false}
          icon={ShieldAlert}
          colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <MetricCard
          title="Active Placements"
          value={stats?.activePlacementDrives ?? 5}
          trend="8 Companies Visiting"
          isPositive={true}
          icon={Landmark}
          colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400"
        />
      </div>
    </motion.div>
  );
};
