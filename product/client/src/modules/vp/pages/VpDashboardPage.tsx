import React, { useState, useEffect } from 'react';
import {
  Users,
  FileCheck,
  AlertCircle,
  Calendar,
  Building2,
  Send,
  Eye,
  Save,
  CheckCircle2,
  TrendingUp,
  Award,
  BookOpen,
  Activity,
  ShieldCheck,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import api from '@/lib/axios';
import { toast } from '../../../components/ui/Toast';

export const VpDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [metrics, setMetrics] = useState({
    attendanceRate: '94.2%',
    activeComplaints: 2,
    pendingApprovals: 3,
    departmentAlerts: 1,
    upcomingEvents: 4,
  });

  // Circular / Bulletin Form State
  const [bulletinForm, setBulletinForm] = useState({
    title: '',
    category: 'OPERATIONS',
    audience: 'ALL_FACULTY',
    department: 'ALL',
    priority: 'MEDIUM',
    description: '',
    requireAcknowledgement: false,
  });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const userName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Dr. Meenakshi Sundaram'
    : 'Dr. Meenakshi Sundaram';

  const handlePublishBulletin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulletinForm.title.trim() || !bulletinForm.description.trim()) {
      toast.error('Please enter a notice title and description.');
      return;
    }

    try {
      setPublishing(true);
      const res = await api.post('/enterprise/circulars', bulletinForm);
      if (res.status === 200 || res.status === 201) {
        toast.success('Official circular notice published successfully');
        setBulletinForm({
          title: '',
          category: 'OPERATIONS',
          audience: 'ALL_FACULTY',
          department: 'ALL',
          priority: 'MEDIUM',
          description: '',
          requireAcknowledgement: false,
        });
        setIsPreviewOpen(false);
      }
    } catch (err: any) {
      console.error('Failed to publish circular:', err);
      toast.error(err?.response?.data?.message || 'Failed to publish notice');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Professional Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Welcome back, {userName}
            </h1>
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-black uppercase tracking-wider">
              Vice Principal
            </span>
          </div>

          <p className="text-xs md:text-sm text-slate-400">
            Daily institutional operations, classroom utilization, academic compliance & disciplinary proceedings.
          </p>
        </div>
      </div>

      {/* Primary 5 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Attendance</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{metrics.attendanceRate}</div>
          <p className="text-[10px] text-slate-500">Target: 95.0%</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Complaints</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{metrics.activeComplaints}</div>
          <p className="text-[10px] text-slate-500">Inquests requiring action</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</span>
            <FileCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{metrics.pendingApprovals}</div>
          <p className="text-[10px] text-slate-500">Workflows & leave requests</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Department Alerts</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-400">{metrics.departmentAlerts}</div>
          <p className="text-[10px] text-slate-500">Resource allocation</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Upcoming Events</span>
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{metrics.upcomingEvents}</div>
          <p className="text-[10px] text-slate-500">Scheduled next 7 days</p>
        </div>
      </div>

      {/* Main Grid: Operations & Bulletin Notice */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Executive Insights & Risk Review */}
        <div className="lg:col-span-2 space-y-6">
          {/* Executive Insights (Threshold Based) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  Executive Insights
                </h3>
                <p className="text-[11px] text-slate-400">Generated from current attendance and departmental thresholds</p>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Rule Threshold Engine
              </span>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Department Performance Variance</span>
                  <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Academics</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Mid-semester pass rates in core engineering courses vary by 14%. Information Technology department leads at 89%, while ECE requires syllabus review.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Attendance Review Threshold</span>
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Operations</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Campus-wide attendance is tracking at 94.2%. 3 individual student rosters require mentor verification before exam hall tickets issuance.
                </p>
              </div>
            </div>
          </div>

          {/* Workflow-Based Risk & Attendance Review Section */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Attendance Review Needed
              </h3>
              <span className="text-xs text-slate-400 font-medium">Workflow Action Plan</span>
            </div>

            <div className="space-y-3">
              {[
                { name: 'John Smith', dept: 'Dept: CSE • Sec: Section A • Roll: ADM2026001', pct: '60.0% Attendance' },
                { name: 'CSE Student 001', dept: 'Dept: CSE • Sec: Section A • Roll: ADM-CSE-2026-001', pct: '20.0% Attendance' },
                { name: 'IT Student 001', dept: 'Dept: IT • Sec: Section A • Roll: ADM-IT-2026-001', pct: '41.7% Attendance' },
              ].map((st, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{st.name}</h4>
                      <p className="text-[10px] text-slate-500">{st.dept}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {st.pct}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1">
                    <p className="font-bold text-amber-400">Recommended Next Steps:</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-slate-300">
                      <li>Verify attendance records with class handling faculty.</li>
                      <li>Contact assigned Mentor for counselling.</li>
                      <li>Notify Student and schedule Parent review if required.</li>
                    </ol>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Permission-Controlled Bulletin / Circular Publishing */}
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-400" />
                Publish Bulletin Notice
              </h3>
              <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20">
                Official Flow
              </span>
            </div>

            <form onSubmit={handlePublishBulletin} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Notice Title:</label>
                <input
                  type="text"
                  placeholder="Enter notice title..."
                  value={bulletinForm.title}
                  onChange={(e) => setBulletinForm({ ...bulletinForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Category:</label>
                  <select
                    value={bulletinForm.category}
                    onChange={(e) => setBulletinForm({ ...bulletinForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="OPERATIONS">Operations</option>
                    <option value="DISCIPLINE">Discipline</option>
                    <option value="PLACEMENTS">Placements</option>
                    <option value="ACTIVITIES">Campus Activities</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Audience:</label>
                  <select
                    value={bulletinForm.audience}
                    onChange={(e) => setBulletinForm({ ...bulletinForm, audience: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL_FACULTY">All Faculty</option>
                    <option value="HODS">HODs & Deans</option>
                    <option value="STUDENTS">Students</option>
                    <option value="INSTITUTION">Entire Institution</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Notice Details:</label>
                <textarea
                  placeholder="Write official notice details..."
                  value={bulletinForm.description}
                  onChange={(e) => setBulletinForm({ ...bulletinForm, description: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>

                <button
                  type="submit"
                  disabled={publishing}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{publishing ? 'Publishing...' : 'Publish Bulletin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Notice Preview</h3>
              <button onClick={() => setIsPreviewOpen(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                {bulletinForm.category}
              </span>
              <h4 className="text-sm font-bold text-white">{bulletinForm.title || 'Untitled Notice'}</h4>
              <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">{bulletinForm.description || 'No description provided.'}</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
