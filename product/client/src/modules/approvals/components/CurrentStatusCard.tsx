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
          <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold uppercase flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Approved
          </span>
        );
      case 'REJECTED':
      case 'REJECTED_PRINCIPAL':
        return (
          <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold uppercase flex items-center gap-1.5 shadow-2xs">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Rejected
          </span>
        );
      case 'RETURNED':
        return (
          <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold uppercase flex items-center gap-1.5 shadow-2xs">
            <RotateCcw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Returned
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold uppercase flex items-center gap-1.5 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
            Pending Action
          </span>
        );
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-extrabold uppercase tracking-wider text-[10px]">
          Current Status & Stage
        </span>
        {getStatusBadge()}
      </div>

      <div className="flex items-center justify-between pt-1">
        <div>
          <h4 className="text-sm font-extrabold text-foreground">
            {currentStage || 'Principal Level Authorization'}
          </h4>
          {assignedRole === 'ACTING_PRINCIPAL' && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              Handling Authority: Vice Principal (Acting Principal)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

CurrentStatusCard.displayName = 'CurrentStatusCard';
export default CurrentStatusCard;
