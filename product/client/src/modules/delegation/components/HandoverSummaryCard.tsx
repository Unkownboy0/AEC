import React, { useState, useEffect } from 'react';
import { FileCheck2, CheckCircle2, XCircle, RotateCcw, Clock, ArrowRight, Check } from 'lucide-react';
import { useDelegationContext } from '../context/DelegationContext';
import api from '@/lib/axios';

interface HandoverData {
  id: string;
  totalRequests: number;
  approvedCount: number;
  rejectedCount: number;
  returnedCount: number;
  pendingCount: number;
  generatedAt: string;
  acknowledgedAt: string | null;
}

export const HandoverSummaryCard: React.FC = () => {
  const { latestHandoverId, principalStatus, refreshStatus } = useDelegationContext();
  const [handover, setHandover] = useState<HandoverData | null>(null);
  const [loading, setLoading] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!latestHandoverId || principalStatus !== 'ONLINE') {
      setHandover(null);
      return;
    }
    fetchHandover();
  }, [latestHandoverId, principalStatus]);

  const fetchHandover = async () => {
    setLoading(true);
    try {
      const res = await api.get('/principal/handover/latest');
      if (res.data?.success && res.data?.data) {
        setHandover(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch handover:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!handover) return;
    setAcknowledging(true);
    try {
      const res = await api.post(`/principal/handover/${handover.id}/acknowledge`);
      if (res.status === 200) {
        setDismissed(true);
        await refreshStatus();
      }
    } catch (err) {
      console.error('Failed to acknowledge handover:', err);
    } finally {
      setAcknowledging(false);
    }
  };

  if (!handover || dismissed || loading) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-violet-950 p-5 rounded-2xl border border-violet-500/30 text-slate-100 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">VP Handover Summary</h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Generated {new Date(handover.generatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-black uppercase tracking-wider">
          Welcome Back
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 text-center">
          <div className="text-2xl font-black text-white">{handover.totalRequests}</div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-1">Total Handled</div>
        </div>
        <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-500/20 text-center">
          <div className="text-2xl font-black text-emerald-300 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-5 h-5" /> {handover.approvedCount}
          </div>
          <div className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-wide mt-1">Approved</div>
        </div>
        <div className="bg-rose-950/30 p-3 rounded-xl border border-rose-500/20 text-center">
          <div className="text-2xl font-black text-rose-300 flex items-center justify-center gap-1.5">
            <XCircle className="w-5 h-5" /> {handover.rejectedCount}
          </div>
          <div className="text-[10px] text-rose-400/70 font-bold uppercase tracking-wide mt-1">Rejected</div>
        </div>
        <div className="bg-amber-950/30 p-3 rounded-xl border border-amber-500/20 text-center">
          <div className="text-2xl font-black text-amber-300 flex items-center justify-center gap-1.5">
            <RotateCcw className="w-5 h-5" /> {handover.returnedCount}
          </div>
          <div className="text-[10px] text-amber-400/70 font-bold uppercase tracking-wide mt-1">Returned to You</div>
        </div>
      </div>

      {/* Info + Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
        <p className="text-xs text-slate-300 leading-relaxed">
          The Vice Principal handled <strong className="text-white">{handover.totalRequests}</strong> request(s) during your absence.
          {handover.returnedCount > 0 && (
            <> <strong className="text-amber-300">{handover.returnedCount}</strong> unresolved request(s) have been returned to your queue.</>
          )}
          {' '}Completed VP actions are preserved in the audit log.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAcknowledge}
            disabled={acknowledging}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
          >
            <Check className="w-4 h-4" /> {acknowledging ? 'Acknowledging...' : 'Acknowledge & Dismiss'}
          </button>
        </div>
      </div>
    </div>
  );
};
