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
    <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3.5">
      <h4 className="text-xs font-extrabold uppercase text-primary tracking-wider flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary" />
        Request Details
      </h4>

      {/* Validation Warning Alert */}
      {details.warning && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span>{details.warning}</span>
        </div>
      )}

      <div className="space-y-2.5 text-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Submitted Date:</span>
          <span className="font-bold text-foreground">
            {details.submittedAt ? new Date(details.submittedAt).toLocaleString('en-IN') : 'N/A'}
          </span>
        </div>

        {formattedStart && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Duration:</span>
            <span className="font-bold text-foreground flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              {formattedStart} {formattedEnd ? `to ${formattedEnd}` : ''} ({details.totalDays || 1} day(s))
            </span>
          </div>
        )}

        {displayReason && (
          <div>
            <span className="text-muted-foreground block text-[11px] mb-1.5 font-semibold">Submitted Reason:</span>
            <div className="p-3.5 rounded-xl bg-surface-soft border border-border text-foreground leading-relaxed font-medium">
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
