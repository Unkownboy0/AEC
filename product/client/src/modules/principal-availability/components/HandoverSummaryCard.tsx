import React from 'react';
import { CheckCircle2, XCircle, RotateCcw, ArrowRight, X } from 'lucide-react';
import { useHandoverSummary } from '../hooks/useHandoverSummary';

interface HandoverSummaryCardProps {
  onReviewReturned?: () => void;
}

export const HandoverSummaryCard: React.FC<HandoverSummaryCardProps> = ({ onReviewReturned }) => {
  const { handover, acknowledgeHandover } = useHandoverSummary();

  if (!handover) return null;

  return (
    <div className="w-full bg-gradient-to-r from-emerald-50/70 via-surface to-emerald-50/40 dark:from-emerald-950/40 dark:via-surface dark:to-emerald-950/20 border border-emerald-300 dark:border-emerald-800 rounded-3xl p-6 shadow-xs relative overflow-hidden mb-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-2 border border-emerald-200 dark:border-emerald-800">
            Welcome Back
          </div>
          <h3 className="text-xl font-extrabold text-text-primary">Delegation Handover Summary</h3>
          <p className="text-xs text-text-muted mt-1">
            Vice Principal handled requests during your absence. Here is the executive breakdown:
          </p>
        </div>
        <button
          type="button"
          onClick={acknowledgeHandover}
          className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors"
          title="Dismiss Handover"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
        <div className="p-3.5 rounded-2xl bg-surface border border-border">
          <div className="text-[11px] font-bold text-text-muted">Total Handled</div>
          <div className="text-2xl font-extrabold text-text-primary mt-1">{handover.totalRequests}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface border border-emerald-300 dark:border-emerald-800">
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{handover.approvedCount}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface border border-rose-300 dark:border-rose-800">
          <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">{handover.rejectedCount}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface border border-amber-300 dark:border-amber-800">
          <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Returned to You
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{handover.returnedCount}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={acknowledgeHandover}
          className="px-4 py-2 rounded-xl text-xs font-bold text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors"
        >
          Dismiss
        </button>

        {onReviewReturned && handover.returnedCount > 0 && (
          <button
            type="button"
            onClick={onReviewReturned}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <span>Review Returned Requests</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        )}
      </div>
    </div>
  );
};
