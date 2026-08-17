import React, { useState } from 'react';
import { ApprovalActionDef, ApprovalViewModel } from './ApprovalTypes';
import { ArrowRight, AlertCircle, ShieldCheck, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface ApprovalActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionDef: ApprovalActionDef | null;
  request: ApprovalViewModel | null;
  onConfirm: (action: ApprovalActionDef, remarks: string) => Promise<void> | void;
  isSubmitting?: boolean;
}

export const ApprovalActionModal: React.FC<ApprovalActionModalProps> = ({
  isOpen,
  onClose,
  actionDef,
  request,
  onConfirm,
  isSubmitting = false,
}) => {
  const [remarks, setRemarks] = useState('');

  if (!isOpen || !actionDef || !request) return null;

  const requiresRemarks =
    actionDef.requiresRemarks ??
    (actionDef.action === 'RETURN' || actionDef.action === 'REJECT');

  const title =
    actionDef.confirmationTitle ||
    (actionDef.action === 'APPROVE'
      ? 'Approve Request'
      : actionDef.action === 'RECOMMEND'
      ? 'Recommend & Forward'
      : actionDef.action === 'RETURN'
      ? 'Return for Clarification'
      : actionDef.action === 'REJECT'
      ? 'Reject Request'
      : `${actionDef.label}`);

  const handleConfirm = async () => {
    if (requiresRemarks && !remarks.trim()) {
      return;
    }
    await onConfirm(actionDef, remarks);
    setRemarks('');
  };

  const getButtonBg = () => {
    if (actionDef.variant === 'primary') return 'bg-emerald-600 hover:bg-emerald-700 text-white';
    if (actionDef.variant === 'secondary') return 'bg-amber-500 hover:bg-amber-600 text-white';
    if (actionDef.variant === 'danger') return 'bg-red-600 hover:bg-red-700 text-white';
    if (actionDef.variant === 'info') return 'bg-sky-600 hover:bg-sky-700 text-white';
    return 'bg-blue-600 hover:bg-blue-700 text-white';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
              {title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Request #{request.requestNumber || request.id.slice(0, 8)} • {request.requester.name}
            </p>
          </div>
        </div>

        {/* Next Stage Workflow Preview */}
        {actionDef.nextStagePreview && (
          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900/60 flex items-center gap-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-blue-900 dark:text-blue-200">Workflow Routing</p>
              <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                {actionDef.nextStagePreview}
              </p>
            </div>
          </div>
        )}

        {/* Remarks / Reason input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
            <span>Review Remarks / Notes</span>
            {requiresRemarks ? (
              <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
                Mandatory
              </span>
            ) : (
              <span className="text-[10px] text-gray-400 font-medium">Optional</span>
            )}
          </label>

          <textarea
            rows={3}
            className="w-full border rounded-2xl p-3 text-xs resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-gray-400"
            placeholder={
              actionDef.remarksPlaceholder ||
              (requiresRemarks
                ? 'Please specify reasons or return guidance...'
                : 'Enter optional approval notes or instructions...')
            }
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || (requiresRemarks && !remarks.trim())}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 ${getButtonBg()}`}
          >
            {isSubmitting ? 'Processing...' : 'Confirm Action'}
          </button>
        </div>
      </div>
    </div>
  );
};
