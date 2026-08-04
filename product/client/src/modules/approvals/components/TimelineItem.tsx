import React, { useState } from 'react';
import { TimelineEventItem } from '../api/approvalRequests.api';
import { CheckCircle2, Clock, XCircle, FileText, UserCheck, ShieldAlert, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

interface TimelineItemProps {
  event: TimelineEventItem;
  isLast?: boolean;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({ event, isLast = false }) => {
  const [expanded, setExpanded] = useState<boolean>(false);

  const getEventIcon = () => {
    switch (event.eventType) {
      case 'APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'REJECTED':
      case 'HOD_REJECTED':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'DELEGATED_TO_VP':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      case 'HOD_RECOMMENDED':
        return <UserCheck className="w-4 h-4 text-emerald-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
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
    <div className="relative pl-6 pb-4 group">
      {/* Timeline Line */}
      {!isLast && <span className="absolute left-[7px] top-4 bottom-0 w-0.5 bg-slate-800 group-hover:bg-slate-700 transition-colors" />}

      {/* Timeline Node Dot */}
      <span className="absolute left-0 top-0.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center shadow-md">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
      </span>

      <div className="space-y-1">
        {/* Title & Date */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            {getEventIcon()}
            <h4 className="font-extrabold text-white">{event.title}</h4>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">{formattedDate}</span>
        </div>

        {/* Actor Info */}
        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-1.5 pl-5">
          <span>By: <strong className="text-slate-200">{event.actor?.name || 'System'}</strong></span>
          <span>•</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-semibold border border-slate-700">
            {event.actor?.displayRole || event.actor?.role || 'System'}
          </span>
          {event.actor?.performedAsRole === 'ACTING_PRINCIPAL' && (
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30">
              ACTING PRINCIPAL
            </span>
          )}
        </div>

        {/* Remarks if present */}
        {event.remarks && (
          <div className="pl-5 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 font-medium italic space-y-1">
              <div className="flex items-center justify-between">
                <span>"{event.remarks}"</span>
                {event.remarks.length > 80 && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-[10px] text-amber-400 font-bold hover:underline flex items-center gap-0.5 ml-2"
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
