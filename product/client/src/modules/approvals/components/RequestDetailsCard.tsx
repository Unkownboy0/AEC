import React from 'react';
import { FileText, AlertTriangle, Calendar } from 'lucide-react';
import { ApprovalRequestDetails } from '../api/approvalRequests.api';

interface RequestDetailsCardProps {
  details: ApprovalRequestDetails;
}

export const RequestDetailsCard: React.FC<RequestDetailsCardProps> = ({ details }) => {
  const formattedStart = details.startDate
    ? new Date(details.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    : null;
  const formattedEnd = details.endDate
    ? new Date(details.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-3">
      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
        <FileText className="w-4 h-4 text-amber-400" />
        Request Details
      </h4>

      {/* Validation Warning Alert if Category and Reason mismatch */}
      {details.warning && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>{details.warning}</span>
        </div>
      )}

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <span>Submitted Date:</span>
          <span className="font-bold text-slate-200">
            {details.submittedAt ? new Date(details.submittedAt).toLocaleString() : 'N/A'}
          </span>
        </div>

        {formattedStart && (
          <div className="flex items-center justify-between text-slate-400">
            <span>Duration:</span>
            <span className="font-bold text-slate-200 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-400" />
              {formattedStart} {formattedEnd ? `to ${formattedEnd}` : ''} ({details.totalDays || 1} day(s))
            </span>
          </div>
        )}

        {details.reason && (
          <div>
            <span className="text-slate-500 block text-[11px] mb-1 font-bold">Submitted Reason:</span>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 leading-relaxed font-medium">
              {details.reason}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
