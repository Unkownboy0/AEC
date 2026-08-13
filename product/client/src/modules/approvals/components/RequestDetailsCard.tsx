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

  const displayReason =
    details.reason ||
    (details as any).description ||
    (details as any).leaveReason ||
    (details as any).reasonText ||
    'Authorization request submitted for review';

  return (
    <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
      <h4 className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-400 tracking-wider flex items-center gap-2">
        <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        Request Details
      </h4>

      {/* Validation Warning Alert */}
      {details.warning && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <span>{details.warning}</span>
        </div>
      )}

      <div className="space-y-2.5 text-xs">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span>Submitted Date:</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">
            {details.submittedAt ? new Date(details.submittedAt).toLocaleString() : 'N/A'}
          </span>
        </div>

        {formattedStart && (
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span>Duration:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              {formattedStart} {formattedEnd ? `to ${formattedEnd}` : ''} ({details.totalDays || 1} day(s))
            </span>
          </div>
        )}

        {displayReason && (
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[11px] mb-1.5 font-semibold">Submitted Reason:</span>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 leading-relaxed font-medium">
              "{displayReason}"
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

RequestDetailsCard.displayName = 'RequestDetailsCard';
export default RequestDetailsCard;
