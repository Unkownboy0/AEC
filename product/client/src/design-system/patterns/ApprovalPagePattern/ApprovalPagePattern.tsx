import React from 'react';
import { clsx } from 'clsx';
import { Button } from '../../primitives/Button/Button';
import { StatusBadge } from '../../components/StatusBadge/StatusBadge';
import { PageHeader } from '../../components/PageHeader/PageHeader';

/* ═══════════════════════════════════════════════════════════════════
   APPROVAL PAGE PATTERN — CampusOS Design System Pattern
   
   Standard layout for leave/OD/task approval requests:
   - Header with status badge
   - Applicant summary card
   - Request details section
   - Attached documents section
   - Timeline of history
   - Sticky action buttons (Approve / Reject / Return)
   ═══════════════════════════════════════════════════════════════════ */

export interface ApprovalPagePatternProps {
  title: string;
  applicantName: string;
  applicantRole?: string;
  applicantAvatar?: string;
  status: string;
  appliedDate: string;
  details: { label: string; value: React.ReactNode }[];
  documents?: { name: string; url: string; size?: string }[];
  timeline?: React.ReactNode;
  onApprove?: () => void;
  onReject?: () => void;
  onReturn?: () => void;
  isProcessing?: boolean;
  className?: string;
}

export const ApprovalPagePattern: React.FC<ApprovalPagePatternProps> = ({
  title,
  applicantName,
  applicantRole,
  status,
  appliedDate,
  details,
  documents = [],
  timeline,
  onApprove,
  onReject,
  onReturn,
  isProcessing = false,
  className,
}) => {
  return (
    <div className={clsx('space-y-6 pb-20 lg:pb-6', className)}>
      <PageHeader
        title={title}
        badge={<StatusBadge status={status} />}
        description={`Submitted by ${applicantName} ${applicantRole ? `(${applicantRole})` : ''} on ${appliedDate}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Request Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="bg-surface border border-border rounded-lg p-5 space-y-4">
            <h3 className="text-section-title font-semibold text-foreground border-b border-border pb-3">
              Request Details
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {details.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <dt className="text-caption text-muted-foreground">{item.label}</dt>
                  <dd className="text-body font-medium text-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Documents Card */}
          {documents.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-5 space-y-3">
              <h3 className="text-section-title font-semibold text-foreground border-b border-border pb-3">
                Attached Documents
              </h3>
              <div className="space-y-2">
                {documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-raised transition-colors"
                  >
                    <span className="text-body font-medium text-foreground truncate">{doc.name}</span>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-caption font-semibold text-primary hover:underline"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timeline Sidebar */}
        {timeline && (
          <div className="bg-surface border border-border rounded-lg p-5 space-y-4 h-fit">
            <h3 className="text-section-title font-semibold text-foreground border-b border-border pb-3">
              Approval History
            </h3>
            {timeline}
          </div>
        )}
      </div>

      {/* Action Bar (Sticky on Mobile) */}
      {(onApprove || onReject || onReturn) && (
        <div className="fixed bottom-14 left-0 right-0 p-4 bg-surface/95 backdrop-blur border-t border-border lg:static lg:bg-transparent lg:p-0 lg:border-none flex items-center justify-end gap-3 z-header">
          {onReturn && (
            <Button variant="secondary" onClick={onReturn} disabled={isProcessing}>
              Return for Changes
            </Button>
          )}
          {onReject && (
            <Button variant="danger" onClick={onReject} disabled={isProcessing}>
              Reject
            </Button>
          )}
          {onApprove && (
            <Button variant="success" onClick={onApprove} isLoading={isProcessing}>
              Approve Request
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

ApprovalPagePattern.displayName = 'ApprovalPagePattern';
export default ApprovalPagePattern;
