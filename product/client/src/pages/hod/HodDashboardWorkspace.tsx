import React, { useState, useEffect } from 'react';
import {
  Users, UserCheck, ShieldCheck, Layers, FileText, Clock, AlertTriangle,
  CheckCircle2, XCircle, TrendingUp, Calendar, Zap, ArrowUpRight, Award,
  Bell, FileCheck, RefreshCw, ChevronRight, BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

export const HodDashboardWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/hod/dashboard');
      if (res.data?.data) {
        setData(res.data.data);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load HOD dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
        Loading HOD Department Executive Workspace...
      </div>
    );
  }

  const cards = data?.summaryCards || {};
  const dept = data?.department || {};
  const recentRequests = data?.widgets?.recentRequests || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md">
            <Award className="w-3.5 h-3.5" /> {dept.name || 'Department Administration Workspace'} ({dept.code || 'CSE'})
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold">HOD Command Center</h1>
          <p className="text-indigo-200 text-sm max-w-xl">
            Real-time department governance overview, approval workflows, attendance monitoring, and faculty workload analytics.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/hod/leave-approvals')}
            className="px-4 py-2.5 bg-white text-indigo-900 font-semibold rounded-xl text-sm hover:bg-indigo-50 transition shadow-md flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4 text-indigo-600" /> Pending Approvals ({cards.totalPendingApprovals || 0})
          </button>
        </div>
      </div>

      {/* Quick Action Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-500" /> Quick Administrative Actions
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Review Leave/OD', route: '/hod/leave-approvals', icon: FileCheck, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
            { label: 'Student Roster', route: '/hod/students', icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
            { label: 'Faculty Workload', route: '/hod/faculty', icon: UserCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
            { label: 'Mentor Allocation', route: '/hod/mentors', icon: ShieldCheck, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
            { label: 'Attendance Alerts', route: '/hod/attendance', icon: AlertTriangle, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' },
            { label: 'Task Desk', route: '/hod/tasks', icon: Layers, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
          ].map((act, i) => {
            const Icon = act.icon;
            return (
              <button
                key={i}
                onClick={() => navigate(act.route)}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-800 transition text-left group"
              >
                <div className={`p-2 rounded-lg ${act.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {act.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Department Students', value: cards.totalStudents || 0, icon: Users, sub: 'Active Enrolled', color: 'border-l-4 border-l-blue-500' },
          { label: 'Department Faculty', value: cards.totalFaculty || 0, icon: UserCheck, sub: `${cards.totalMentors || 0} Mentors`, color: 'border-l-4 border-l-emerald-500' },
          { label: 'Pending Leave / OD Requests', value: cards.totalPendingApprovals || 0, icon: Clock, sub: `${cards.pendingLeaveRequests || 0} Leave • ${cards.pendingOdRequests || 0} OD`, color: 'border-l-4 border-l-amber-500' },
          { label: 'Low Attendance (<75%)', value: cards.lowAttendanceCount || 0, icon: AlertTriangle, sub: `Avg Attendance: ${cards.averageAttendancePct || 85}%`, color: 'border-l-4 border-l-rose-500' },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className={`p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm ${c.color}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{c.label}</span>
                <Icon className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{c.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{c.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Secondary Metrics & Dashboard Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Pending Approvals Widget */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" /> Pending Workflow Approvals Queue
              </h3>
              <p className="text-xs text-slate-500">Requests endorsed by mentors awaiting your sign-off.</p>
            </div>
            <button
              onClick={() => navigate('/hod/leave-approvals')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              View Desk <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No pending leave or OD requests in queue.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {recentRequests.map((req: any) => (
                <div key={req.id} className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 px-2 rounded-xl transition">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">
                        {req.student.firstName} {req.student.lastName}
                      </span>
                      <span className="text-xs font-mono text-slate-400">({req.student.admissionNo})</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        req.type === 'ON_DUTY' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {req.type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Reason: {req.reason} ({req.totalDays} Day(s))
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/hod/leave-approvals')}
                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold hover:bg-indigo-100"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance Summary Widget */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" /> Attendance Overview
          </h3>

          <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between">
            <div>
              <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">Department Average</div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                {cards.averageAttendancePct || 85}%
              </div>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-500 opacity-60" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-semibold">
              <span>Low Attendance (&lt;75%)</span>
              <span className="text-rose-600 font-bold">{cards.lowAttendanceCount || 0} Students</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-semibold">
              <span>Approved Leaves Today</span>
              <span className="text-emerald-600 font-bold">{cards.approvedTodayCount || 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-semibold">
              <span>Faculty On Leave Today</span>
              <span className="text-amber-600 font-bold">{cards.facultyOnLeaveCount || 0}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/hod/attendance')}
            className="w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
          >
            View Low Attendance Shortage Roster
          </button>
        </div>
      </div>
    </div>
  );
};

export default HodDashboardWorkspace;
