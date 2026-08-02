import React, { useState, useEffect } from 'react';
import {
  Building, Users, GraduationCap, CheckCircle, AlertTriangle,
  Clock, ShieldCheck, Layers, FileText, AlertCircle, TrendingUp, RefreshCw
} from 'lucide-react';
import { toast } from '../ui/Toast';
import { Loading } from '../ui/Loading';
import api from '../../lib/axios';

const KPICard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  colorClass: string;
  subtitle?: string;
}> = ({ title, value, icon: Icon, colorClass, subtitle }) => (
  <div className="border bg-card p-4 rounded-xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
    <div className="flex items-center justify-between">
      <span className="text-[10px] uppercase font-extrabold tracking-wider text-muted-foreground">{title}</span>
      <div className={`p-2 rounded-lg ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <div>
      <span className="text-2xl font-extrabold tracking-tight mt-2 block text-foreground">{value}</span>
      {subtitle && <span className="text-[11px] text-muted-foreground mt-0.5 block">{subtitle}</span>}
    </div>
  </div>
);

export const AcademicDeanDashboard: React.FC<{ user: any; onNavigateTab?: (tab: string) => void }> = ({ user, onNavigateTab }) => {
  const [stats, setStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/academic-dean/dashboard');
      setStats(res.data.data);
    } catch (err: any) {
      toast.error('Failed to fetch dashboard KPIs');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loading text="Loading Academic Dean Executive Dashboard..." />;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" /> Academic Dean Executive Command Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time academic monitoring, department task oversight, curriculum and compliance analytics
          </p>
        </div>

        <button
          onClick={fetchDashboardStats}
          className="px-3 py-1.5 rounded-lg border bg-card hover:bg-muted text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Live KPIs
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <KPICard
          title="Total Departments"
          value={stats?.totalDepartments || 0}
          icon={Building}
          colorClass="bg-blue-500/10 text-blue-600"
        />
        <KPICard
          title="Total Active HODs"
          value={stats?.activeHods || 0}
          icon={Users}
          colorClass="bg-indigo-500/10 text-indigo-600"
        />
        <KPICard
          title="Total Students"
          value={stats?.totalStudents || 0}
          icon={GraduationCap}
          colorClass="bg-emerald-500/10 text-emerald-600"
        />
        <KPICard
          title="Total Faculty"
          value={stats?.totalFaculty || 0}
          icon={Users}
          colorClass="bg-purple-500/10 text-purple-600"
        />
        <KPICard
          title="Tasks Created"
          value={stats?.tasksCreated || 0}
          icon={Layers}
          colorClass="bg-amber-500/10 text-amber-600"
        />

        <KPICard
          title="Tasks In Progress"
          value={stats?.tasksInProgress || 0}
          icon={Clock}
          colorClass="bg-blue-500/10 text-blue-600"
        />
        <KPICard
          title="Awaiting Review"
          value={stats?.tasksAwaitingReview || 0}
          icon={FileText}
          colorClass="bg-amber-500/10 text-amber-600"
        />
        <KPICard
          title="Tasks Overdue"
          value={stats?.tasksOverdue || 0}
          icon={AlertCircle}
          colorClass="bg-red-500/10 text-red-600"
        />
        <KPICard
          title="Tasks Completed"
          value={stats?.tasksCompleted || 0}
          icon={CheckCircle}
          colorClass="bg-green-500/10 text-green-600"
        />
        <KPICard
          title="Dept Submission Rate"
          value={`${stats?.departmentSubmissionRate || 100}%`}
          icon={TrendingUp}
          colorClass="bg-emerald-500/10 text-emerald-600"
        />

        <KPICard
          title="Academic Compliance"
          value={stats?.academicComplianceStatus || 'OPTIMAL'}
          icon={ShieldCheck}
          colorClass="bg-green-500/10 text-green-600"
        />
        <KPICard
          title="Low-Attendance Students"
          value={stats?.lowAttendanceCount || 0}
          icon={AlertTriangle}
          colorClass="bg-red-500/10 text-red-600"
        />
        <KPICard
          title="Academic Risk Students"
          value={stats?.academicRiskCount || 0}
          icon={AlertCircle}
          colorClass="bg-red-500/10 text-red-600"
        />
        <KPICard
          title="Pending Academic Reports"
          value={stats?.pendingAcademicReports || 0}
          icon={FileText}
          colorClass="bg-amber-500/10 text-amber-600"
        />
        <KPICard
          title="Recently Updated Timetables"
          value={stats?.recentlyUpdatedTimetables || 0}
          icon={Clock}
          colorClass="bg-blue-500/10 text-blue-600"
        />
      </div>

      {/* Primary Module Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => onNavigateTab && onNavigateTab('task_workspace')}
          className="border bg-card p-5 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2 group border-primary/20"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-foreground group-hover:text-primary transition-all flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" /> Academic Dean Task Workspace
            </h3>
            <span className="text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
              Open Workspace →
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Create per-department task assignments, collect HOD Excel & PDF documents, resolve threaded task queries, and manage approval & correction workflows.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab && onNavigateTab('departments')}
          className="border bg-card p-5 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-foreground group-hover:text-primary transition-all flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" /> Academic Department Monitoring
            </h3>
            <span className="text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
              View Departments →
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Monitor real-time pass percentage, syllabus coverage, faculty workload, timetable status, and academic risk profiles across all active departments.
          </p>
        </div>
      </div>
    </div>
  );
};
