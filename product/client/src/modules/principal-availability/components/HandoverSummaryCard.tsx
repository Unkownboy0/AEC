import React from 'react';
import { CheckCircle2, XCircle, RotateCcw, ArrowRight, X, Layers } from 'lucide-react';
import { useHandoverSummary } from '../hooks/useHandoverSummary';

interface HandoverSummaryCardProps {
  onReviewReturned?: () => void;
}

export const HandoverSummaryCard: React.FC<HandoverSummaryCardProps> = ({ onReviewReturned }) => {
  const { handover, acknowledgeHandover } = useHandoverSummary();

  if (!handover) return null;

  return (
    <div className="w-full bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden mb-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
            Welcome Back
          </div>
          <h3 className="text-xl font-black text-white">Delegation Handover Summary</h3>
          <p className="text-xs text-slate-400 mt-1">
            Vice Principal handled requests during your absence. Here is the executive breakdown:
          </p>
        </div>
        <button
          onClick={acknowledgeHandover}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Dismiss Handover"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] font-bold text-slate-400">Total Handled</div>
          <div className="text-2xl font-black text-white mt-1">{handover.totalRequests}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-emerald-500/20">
          <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </div>
          <div className="text-2xl font-black text-emerald-300 mt-1">{handover.approvedCount}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-rose-500/20">
          <div className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </div>
          <div className="text-2xl font-black text-rose-300 mt-1">{handover.rejectedCount}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-amber-500/20">
          <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Returned to You
          </div>
          <div className="text-2xl font-black text-amber-300 mt-1">{handover.returnedCount}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={acknowledgeHandover}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          Dismiss
        </button>

        {onReviewReturned && handover.returnedCount > 0 && (
          <button
            onClick={onReviewReturned}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5"
          >
            <span>Review Returned Requests</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        )}
      </div>
    </div>
  );
};
