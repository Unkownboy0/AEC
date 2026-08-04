import React from 'react';
import { TimelineEventItem } from '../api/approvalRequests.api';
import { TimelineItem } from './TimelineItem';
import { History, ShieldCheck } from 'lucide-react';

interface ApprovalWorkflowTimelineProps {
  events: TimelineEventItem[];
  isLoading?: boolean;
}

export const ApprovalWorkflowTimeline: React.FC<ApprovalWorkflowTimelineProps> = ({
  events,
  isLoading = false,
}) => {
  return (
    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
          <History className="w-4 h-4 text-amber-400" />
          Approval Workflow Timeline
        </h4>
        <span className="text-[10px] font-extrabold text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          {events.length} Database Event(s)
        </span>
      </div>

      {isLoading ? (
        <div className="py-6 text-center text-xs text-slate-500 font-semibold">Loading timeline events...</div>
      ) : events.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800/80">
          No workflow timeline events recorded yet.
        </div>
      ) : (
        <div className="pt-2">
          {events.map((evt, idx) => (
            <TimelineItem key={evt.id} event={evt} isLast={idx === events.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
};
