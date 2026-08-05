import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, UserCheck, CalendarDays, Award, FileText, Megaphone, Sparkles } from 'lucide-react';
import { MetricCard } from '../../../design-system/components/MetricCard';
import { Skeleton } from '../../../design-system/components/Skeleton';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { StatusBadge } from '../../../design-system/components/StatusBadge';
import { pageVariants } from '../../../design-system/tokens/motion';
import api from '../../../lib/axios';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/enterprise/students/dashboard-summary');
      if (res.data?.status === 'success') {
        setData(res.data.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load student dashboard parameters');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentDashboard();
  }, []);

  if (isLoading) {
    return <Skeleton variant="card" count={4} />;
  }

  if (error) {
    return <ErrorState title="Student Dashboard Error" message={error} onRetry={fetchStudentDashboard} />;
  }

  const metrics = data?.metrics || {};

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      {/* Student Welcome Hero */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="h-4 w-4" />
            Student Workspace
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track today's classes, attendance, assignments, and exam schedule.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Attendance"
          value={`${metrics.attendancePercentage ?? 92}%`}
          trend="Target >85%"
          isPositive={true}
          icon={UserCheck}
          colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          onClick={() => navigate('/student/attendance')}
        />
        <MetricCard
          title="Current CGPA"
          value={metrics.cgpa ?? '9.2'}
          trend="Top 10%"
          isPositive={true}
          icon={Award}
          colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400"
          onClick={() => navigate('/student/results')}
        />
        <MetricCard
          title="Pending Assignments"
          value={metrics.pendingAssignmentsCount ?? 2}
          trend="Due this week"
          isPositive={false}
          icon={FileText}
          colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          onClick={() => navigate('/student/assignments')}
        />
        <MetricCard
          title="Leave / OD Status"
          value={metrics.leaveStatus || 'APPROVED'}
          trend="Last application"
          isPositive={true}
          icon={CalendarDays}
          colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          onClick={() => navigate('/student/leave-od')}
        />
      </div>
    </motion.div>
  );
};
