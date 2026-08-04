import React from 'react';
import { Clock, ShieldAlert, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface CurrentStatusCardProps {
  currentStage: string;
  status: string;
  assignedRole?: string;
  isActingMode?: boolean;
}

export const CurrentStatusCard: React.FC<CurrentStatusCardProps> = ({
  currentStage,
  status,
  assignedRole,
  isActingMode = false,
}) => {
  const getStatusBadge = () => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
      case 'APPROVED_PRINCIPAL':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Approved
          </span>
        );
      case 'REJECTED':
      case 'REJECTED_PRINCIPAL':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-black uppercase flex items-center gap-1.5 shadow-sm">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            Rejected
          </span>
        );
      case 'RETURNED':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-black uppercase flex items-center gap-1.5 shadow-sm">
            <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
            Returned
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black uppercase flex items-center gap-1.5 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            Pending Action
          </span>
        );
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 shadow-lg">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Current Status & Stage</span>
        {getStatusBadge()}
      </div>

      <div className="flex items-center justify-between pt-1">
        <div>
          <h4 className="text-sm font-black text-white">{currentStage || 'Principal Level Authorization'}</h4>
          {assignedRole === 'ACTING_PRINCIPAL' && (
            <p className="text-[11px] text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              Handling Authority: Vice Principal (Acting Principal)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
