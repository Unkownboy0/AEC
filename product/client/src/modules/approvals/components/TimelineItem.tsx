import React, { useState } from 'react';
import { TimelineEventItem } from '../api/approvalRequests.api';
import { CheckCircle2, Clock, XCircle, UserCheck, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

interface TimelineItemProps {
  event: TimelineEventItem;
  isLast?: boolean;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({ event, isLast = false }) => {
  const [expanded, setExpanded] = useState<boolean>(false);

  const getEventIcon = () => {
    switch (event.eventType) {
      case 'APPROVED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'REJECTED':
      case 'HOD_REJECTED':
        return <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />;
      case 'DELEGATED_TO_VP':
        return <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'HOD_RECOMMENDED':
        return <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />;
    }
  };

  const formattedDate = event.createdAt
    ? new Date(event.createdAt).toLocaleString([], {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="relative pl-7 pb-5 group">
      {/* Timeline Vertical Line */}
      {!isLast && (
        <span className="absolute left-[9px] top-5 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800/80 group-hover:bg-purple-400 dark:group-hover:bg-purple-600 transition-colors" />
      )}

      {/* Timeline Status Node Icon */}
      <span className="absolute left-0 top-0.5 w-5 h-5 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
        {getEventIcon()}
      </span>

      <div className="space-y-1.5">
        {/* Title & Date */}
        <div className="flex items-center justify-between text-xs">
          <h4 className="font-extrabold text-slate-900 dark:text-slate-100">{event.title}</h4>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{formattedDate}</span>
        </div>

        {/* Actor Info */}
        <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5">
          <span>By: <strong className="text-slate-800 dark:text-slate-200">{event.actor?.name || 'System'}</strong></span>
          <span>•</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/90 text-[10px] text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700/80">
            {event.actor?.displayRole || event.actor?.role || 'System'}
          </span>
          {event.actor?.performedAsRole === 'ACTING_PRINCIPAL' && (
            <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800">
              ACTING PRINCIPAL
            </span>
          )}
        </div>

        {/* Remarks Box */}
        {event.remarks && (
          <div className="pt-1">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/90 text-xs text-slate-800 dark:text-slate-200 font-medium italic leading-relaxed">
              <div className="flex items-center justify-between">
                <span>"{event.remarks}"</span>
                {event.remarks.length > 80 && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-[10px] text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-0.5 ml-2 shrink-0"
                  >
                    {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

TimelineItem.displayName = 'TimelineItem';
export default TimelineItem;
