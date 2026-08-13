import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  XCircle,
  FileCheck,
  Clock,
  AlertTriangle,
  MessageSquare,
  UserCheck,
  Calendar,
  ChevronRight,
  RefreshCw,
  Search,
  BookOpen
} from 'lucide-react';
import api from '../../../lib/axios';
import { EmptyState } from '../../../design-system/components/EmptyState';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { Skeleton } from '../../../design-system/components/Skeleton';
import { StatusBadge } from '../../../design-system/components/StatusBadge';

export const MentorDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMentorDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/mentor/dashboard');
      if (res.data?.status === 'success' || res.data?.success) {
        setData(res.data.data || res.data);
      } else {
        setData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch mentor dashboard:', err);
      setError(err.response?.data?.message || 'Unable to load mentor metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentorDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <Skeleton variant="card" count={4} />
        <Skeleton variant="table" count={4} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorState
          title="Mentor Workspace Offline"
          message={error}
          onRetry={fetchMentorDashboard}
        />
      </div>
    );
  }

  const assignedStudents = data?.assignedStudents || data?.totalStudents || 0;
  const presentToday = data?.presentToday || 0;
  const absentToday = data?.absentToday || 0;
  const pendingLeaveCount = data?.pendingLeaveCount || data?.pendingApprovalsCount || 0;
  const criticalAttendanceCount = data?.criticalAttendanceCount || 0;
  const academicRiskCount = data?.academicRiskCount || 0;

  const pendingApprovals = data?.pendingApprovals || [];
  const riskStudents = data?.riskStudents || [];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in-50 duration-200 pb-10">
      {/* Mentor Hero Banner */}
      <div className="relative bg-gradient-to-b from-purple-100/60 via-purple-50/40 to-transparent dark:from-purple-950/30 dark:via-purple-900/10 dark:to-transparent rounded-3xl p-5 sm:p-7 border border-purple-200/50 dark:border-purple-800/40 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
              <Users className="w-4 h-4" /> Mentor Advisement Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              Student Advisement &amp; Oversight
            </h1>
            <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
              Monitor assigned mentees, approve leave/OD requests, log counseling notes, and track academic risk.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchMentorDashboard}
              className="px-3.5 py-2 bg-surface hover:bg-surface-soft text-text-primary border border-border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>

        {/* 4 Quick Action Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => navigate('/faculty/mentor/students')}
            className="group flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary truncate">Mentees</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-colors shrink-0" />
          </div>

          <div
            onClick={() => navigate('/faculty/mentor/leave-od')}
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
            onClick={() => navigate('/faculty/mentor/counselling')}
            className="group flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary truncate">Counseling</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-colors shrink-0" />
          </div>

          <div
            onClick={() => navigate('/faculty/mentor/department-availability')}
            className="group flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary truncate">Availability</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-colors shrink-0" />
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/faculty/mentor/students')}
          className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              ASSIGNED MENTEES
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-full border border-purple-200 dark:border-purple-800">
              Active
            </span>
          </div>
          <p className="text-3xl font-extrabold text-text-primary tracking-tight">
            {assignedStudents}
          </p>
          <p className="text-xs text-text-muted mt-1 font-medium">
            {presentToday} Present • {absentToday} Absent Today
          </p>
        </div>

        <div
          onClick={() => navigate('/faculty/mentor/leave-od')}
          className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              PENDING LEAVE &amp; OD
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <p className="text-3xl font-extrabold text-text-primary tracking-tight">
            {pendingLeaveCount}
          </p>
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1">
            Requires mentor review
          </p>
        </div>

        <div
          onClick={() => navigate('/faculty/mentor/attendance')}
          className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              ATTENDANCE RISK
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full border border-rose-200 dark:border-rose-800">
              &lt;75%
            </span>
          </div>
          <p className="text-3xl font-extrabold text-text-primary tracking-tight">
            {criticalAttendanceCount}
          </p>
          <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1">
            Below 75% threshold
          </p>
        </div>

        <div
          onClick={() => navigate('/faculty/mentor/academics')}
          className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              ACADEMIC RISK CASES
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200 dark:border-indigo-800">
              Arrears
            </span>
          </div>
          <p className="text-3xl font-extrabold text-text-primary tracking-tight">
            {academicRiskCount}
          </p>
          <p className="text-xs text-text-muted mt-1 font-medium">
            Students requiring counseling
          </p>
        </div>
      </div>

      {/* Pending Approvals & Risk Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Student Requests */}
        <div className="bg-surface border border-border/80 p-5 rounded-2xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-amber-500" /> Pending Leave / OD Approvals
            </h3>
            <button
              type="button"
              onClick={() => navigate('/faculty/mentor/leave-od')}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {pendingApprovals.length === 0 ? (
            <EmptyState
              title="No Pending Approvals"
              description="All student leave and OD requests have been processed."
            />
          ) : (
            <div className="space-y-2.5">
              {pendingApprovals.slice(0, 4).map((req: any) => (
                <div
                  key={req.id}
                  className="p-3.5 bg-surface-soft border border-border/70 rounded-xl flex items-center justify-between gap-3 hover:border-primary/40 transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-text-primary">{req.studentName || req.student?.name}</span>
                      <StatusBadge status={req.type || 'LEAVE'} size="sm" />
                    </div>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      {req.reason || 'Personal Leave'} • {req.startDate} to {req.endDate}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/faculty/mentor/leave-od')}
                    className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance Risk Mentees */}
        <div className="bg-surface border border-border/80 p-5 rounded-2xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" /> High-Risk Mentees
            </h3>
            <button
              type="button"
              onClick={() => navigate('/faculty/mentor/attendance')}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {riskStudents.length === 0 ? (
            <EmptyState
              title="No Mentees at Risk"
              description="All assigned mentees maintain good attendance and academic standing."
            />
          ) : (
            <div className="space-y-2.5">
              {riskStudents.slice(0, 4).map((st: any) => (
                <div
                  key={st.id}
                  className="p-3.5 bg-surface-soft border border-border/70 rounded-xl flex items-center justify-between gap-3 hover:border-primary/40 transition-all"
                >
                  <div>
                    <h4 className="font-bold text-xs text-text-primary">{st.name} ({st.rollNo})</h4>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Attendance: <span className="font-bold text-rose-600 dark:text-rose-400">{st.attendancePercentage}%</span> • Arrears: {st.arrearsCount || 0}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/faculty/mentor/students/${st.id}`)}
                    className="px-3 py-1.5 bg-surface border border-border text-text-primary text-xs font-bold rounded-xl hover:bg-surface-soft transition-colors"
                  >
                    Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
