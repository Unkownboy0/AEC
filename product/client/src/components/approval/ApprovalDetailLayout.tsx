import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, FileText, AlertCircle } from 'lucide-react';
import { ApprovalViewModel, ApprovalActionDef } from './ApprovalTypes';
import { ApprovalStatusBadge, ApprovalPriorityBadge } from './ApprovalStatusBadge';
import { ApprovalRequesterCard } from './ApprovalRequesterCard';
import { ApprovalMetadataGrid } from './ApprovalMetadataGrid';
import { ApprovalContextSection } from './ApprovalContextSection';
import { ApprovalAttachmentSection } from './ApprovalAttachmentSection';
import { ApprovalWorkflowTimeline } from './ApprovalWorkflowTimeline';
import { ApprovalActionBar } from './ApprovalActionBar';
import { ApprovalActionModal } from './ApprovalActionModal';
import { ApprovalSkeleton } from './ApprovalEmptyState';

interface ApprovalDetailLayoutProps {
  request: ApprovalViewModel | null;
  loading?: boolean;
  error?: string | null;
  onBack?: () => void;
  backLabel?: string;
  onAction?: (actionDef: ApprovalActionDef, remarks: string) => Promise<void> | void;
  isSubmittingAction?: boolean;
  customDetailsSlot?: React.ReactNode;
  customSidebarSlot?: React.ReactNode;
  className?: string;
}

export const ApprovalDetailLayout: React.FC<ApprovalDetailLayoutProps> = ({
  request,
  loading = false,
  error = null,
  onBack,
  backLabel = 'Back to Requests',
  onAction,
  isSubmittingAction = false,
  customDetailsSlot,
  customSidebarSlot,
  className = '',
}) => {
  const navigate = useNavigate();
  const [selectedAction, setSelectedAction] = useState<ApprovalActionDef | null>(null);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
        <div className="w-32 h-6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <ApprovalSkeleton count={3} />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-red-100 dark:border-red-900/50 text-center space-y-4 max-w-md shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {error || 'Request Not Found'}
          </h2>
          <p className="text-xs text-gray-500">
            The requested workflow application does not exist or you do not have permission to view it.
          </p>
          <button
            onClick={handleBack}
            className="px-4 py-2 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-xs font-bold"
          >
            {backLabel}
          </button>
        </div>
      </div>
    );
  }

  const typeVariantClasses = {
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    sky: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  }[request.typeVariant || 'purple'];

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 space-y-6 max-w-5xl mx-auto ${className}`}>
      {/* Top Navigation */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{backLabel}</span>
      </button>

      {/* Main Request Shell */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 sm:p-7 space-y-6 shadow-sm">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-black uppercase ${typeVariantClasses}`}>
                {request.typeBadgeLabel || request.requestType}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                #{request.requestNumber || request.id.slice(0, 8)}
              </span>
              <ApprovalPriorityBadge priority={request.priority} isEmergency={request.isEmergency} />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {request.title}
            </h1>

            {request.reason && (
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-3xl">
                {request.reason}
              </p>
            )}
          </div>

          <div className="flex-shrink-0">
            <ApprovalStatusBadge status={request.status} label={request.statusLabel} size="md" />
          </div>
        </div>

        {/* Requester Identity Card */}
        <ApprovalRequesterCard requester={request.requester} />

        {/* Key Metadata Grid */}
        <ApprovalMetadataGrid fields={request.metadata} columns={4} />

        {/* Custom / Pluggable Domain Details */}
        {customDetailsSlot}

        {/* Domain-Specific Context Sections (e.g. Substitutes, Attendance %, Quotations) */}
        <ApprovalContextSection cards={request.contextSections} />

        {/* Supporting Attachments / Evidence */}
        <ApprovalAttachmentSection attachments={request.attachments} />

        {/* Workflow Timeline */}
        <ApprovalWorkflowTimeline timeline={request.timeline} />

        {/* Custom Sidebar / Extension Slot */}
        {customSidebarSlot}

        {/* Actions Bar (Integrated & Sticky on Mobile) */}
        {request.availableActions && request.availableActions.length > 0 && onAction && (
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
            <ApprovalActionBar
              actions={request.availableActions}
              onTriggerAction={(act) => setSelectedAction(act)}
            />
          </div>
        )}
      </div>

      {/* Action Confirmation Modal */}
      <ApprovalActionModal
        isOpen={Boolean(selectedAction)}
        onClose={() => setSelectedAction(null)}
        actionDef={selectedAction}
        request={request}
        isSubmitting={isSubmittingAction}
        onConfirm={async (act, remarks) => {
          if (onAction) {
            await onAction(act, remarks);
          }
          setSelectedAction(null);
        }}
      />
    </div>
  );
};
