import React, { useState } from 'react';
import {
  ShieldCheck,
  Clock,
  RotateCcw,
  Eye,
  FileCheck,
  Building2,
  Users,
  Award,
  BarChart3,
  Calendar,
  Send,
  UserPlus,
  ArrowRight,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { useDelegationContext } from '../../delegation/context/DelegationContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

export const PrincipalDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { principalStatus, delegationStatus, delegationEndsAt, updateStatus } = useDelegationContext();

  const isDelegationActive = (principalStatus === 'BUSY' || principalStatus === 'OFFLINE') && delegationStatus === 'ACTIVE';

  const userName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Dr. Subramanian'
    : 'Dr. Subramanian';

  const formattedEndTime = delegationEndsAt
    ? new Date(delegationEndsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '6:00 PM';

  const handleReturnAvailable = async () => {
    try {
      await updateStatus({ status: 'ONLINE', reason: 'Principal returned to office' });
    } catch (err) {
      console.error('Failed to revert status to available:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Principal Executive Header */}
      <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-slate-900 border border-violet-500/30 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Welcome, Principal {userName}
            </h1>
            <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40 text-xs font-black uppercase tracking-wider">
              Executive Suite
            </span>
          </div>

          <p className="text-xs md:text-sm text-slate-400">
            Institutional Governance, Academic Audit, Strategic Oversight & Decision Center
          </p>

          <div className="flex items-center gap-4 pt-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-slate-400 font-semibold">Principal Status:</span>
              <span className={`font-extrabold uppercase px-2 py-0.5 rounded text-[10px] ${
                String(principalStatus) === 'ONLINE' || String(principalStatus) === 'AVAILABLE'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {principalStatus || 'AVAILABLE'}
              </span>
            </div>

            {isDelegationActive && (
              <div className="flex items-center gap-1.5 bg-violet-500/10 px-3 py-1.5 rounded-xl border border-violet-500/20 text-violet-300">
                <Clock className="w-3.5 h-3.5 text-violet-400" />
                <span>Delegation Ends: <strong className="text-white">{formattedEndTime}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions (Adapts based on Busy/Offline delegation mode) */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {isDelegationActive ? (
            <>
              <button
                onClick={() => navigate('/principal/delegation')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-2"
              >
                <Eye className="w-4 h-4 text-violet-400" />
                <span>Monitor Delegation</span>
              </button>

              <button
                onClick={handleReturnAvailable}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold transition-all shadow-lg flex items-center gap-2 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Return Available</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/approval-center')}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold transition-all shadow-lg flex items-center gap-2 active:scale-95"
              >
                <FileCheck className="w-4 h-4" />
                <span>Approval Center</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-1 shadow-lg">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Enrolled Students</span>
          <div className="text-3xl font-black text-white">167</div>
          <p className="text-[10px] text-emerald-400">100% Verified DB Ledger</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-1 shadow-lg">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Accredited Faculty</span>
          <div className="text-3xl font-black text-white">51</div>
          <p className="text-[10px] text-slate-500">Full-time Roster</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-1 shadow-lg">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Academic Departments</span>
          <div className="text-3xl font-black text-white">11</div>
          <p className="text-[10px] text-slate-500">Accredited Programs</p>
        </div>

        <div className="bg-slate-900/90 border border-violet-500/30 rounded-2xl p-5 space-y-1 shadow-lg">
          <span className="text-[11px] font-bold text-violet-400 uppercase tracking-wider">
            {isDelegationActive ? 'VP Handled Approvals' : 'Pending Approvals'}
          </span>
          <div className="text-3xl font-black text-violet-400">{isDelegationActive ? '4' : '3'}</div>
          <p className="text-[10px] text-slate-400">
            {isDelegationActive ? 'Processed by Vice Principal today' : 'Requires Principal Signoff'}
          </p>
        </div>
      </div>

      {/* Delegation Monitoring Mode Box (If Delegation is Active) */}
      {isDelegationActive && (
        <div className="bg-slate-900/90 border border-violet-500/30 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-violet-400" />
              VP Delegation Live Monitoring
            </h3>
            <span className="text-xs text-violet-300 font-bold bg-violet-500/10 px-3 py-1 rounded-xl border border-violet-500/20">
              Read-Only Delegation Mode
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-bold">Delegated Approvals Pending</span>
              <div className="text-xl font-black text-amber-400">3 Pending VP Action</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-bold">Processed by VP Today</span>
              <div className="text-xl font-black text-emerald-400">4 Approved / 1 Rejected</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-bold">Returned to Principal</span>
              <div className="text-xl font-black text-indigo-400">0 Items</div>
            </div>
          </div>
        </div>
      )}

      {/* Executive Insights & Department Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-400" />
              Executive Insights
            </h3>
            <span className="text-[10px] font-bold text-slate-400">Threshold Analysis</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="font-bold text-slate-200">Department Performance Variance</span>
              <p className="text-slate-400 leading-relaxed">
                Computer Science & Engineering leads overall semester pass rates at 89%, while ECE requires mid-term syllabus review.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              Department Composite Health
            </h3>
            <span className="text-[10px] font-bold text-emerald-400">Accredited Roster</span>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { dept: 'Computer Science & Engineering', score: '89/100', status: 'Optimal' },
              { font: 'Science & Humanities', dept: 'Science & Humanities', score: '88/100', status: 'Optimal' },
              { dept: 'Information Technology', score: '80/100', status: 'Review Needed' },
            ].map((d, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="font-bold text-slate-200">{d.dept}</span>
                <div className="flex items-center gap-2">
                  <span className="font-black text-white">{d.score}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                    {d.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
