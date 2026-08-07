import React, { useState } from 'react';
import { X, Check, ShieldCheck, Clock, ShieldAlert, ArrowRight, Lock } from 'lucide-react';
import { PrincipalStatusType } from '../types/availability.types';

interface AvailabilityModalProps {
  currentStatus: PrincipalStatusType;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dto: {
    status: PrincipalStatusType;
    reason?: string;
    startsAt?: string;
    endsAt?: string;
    actingUserId?: string;
    delegatedCategories?: string[];
    messageToVp?: string;
  }) => Promise<void>;
}

const CATEGORY_OPTIONS = [
  { id: 'FACULTY_LEAVE', label: 'Faculty Leave & OD Requests' },
  { id: 'HOD_LEAVE', label: 'HOD Leave Requests' },
  { id: 'DEAN_LEAVE', label: 'Dean Leave Requests' },
  { id: 'DOCUMENT_APPROVAL', label: 'Document Sign-offs' },
  { id: 'CIRCULAR_APPROVAL', label: 'Circular Approvals' },
  { id: 'TASK_APPROVAL', label: 'Administrative Tasks' },
];

export const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
  currentStatus,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<PrincipalStatusType>(currentStatus);
  const [reason, setReason] = useState<string>('');
  const [startsAt, setStartsAt] = useState<string>(new Date().toISOString().slice(0, 16));
  const [endsAt, setEndsAt] = useState<string>(
    new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 16)
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    CATEGORY_OPTIONS.map((c) => c.id)
  );
  const [messageToVp, setMessageToVp] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleCategory = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const handleConfirmSubmit = async () => {
    try {
      setSubmitting(true);
      if (selectedStatus === 'AVAILABLE') {
        await onConfirm({ status: 'AVAILABLE' });
      } else {
        await onConfirm({
          status: selectedStatus,
          reason,
          startsAt,
          endsAt,
          delegatedCategories: selectedCategories,
          messageToVp,
        });
      }
      onClose();
    } catch (err) {
      console.error('Failed to submit status change:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/30 dark:bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-surface border border-border rounded-3xl shadow-none overflow-hidden flex flex-col max-h-[85vh] my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-border flex items-center justify-between bg-surface-soft shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-text-primary">Change Availability</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Select your status and specify temporary delegation preferences.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Status Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Card 1: Available */}
            <button
              type="button"
              onClick={() => setSelectedStatus('AVAILABLE')}
              className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                selectedStatus === 'AVAILABLE'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-text-primary ring-2 ring-emerald-500/20'
                  : 'bg-surface-soft border-border text-text-muted hover:border-primary/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  {selectedStatus === 'AVAILABLE' && (
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="font-extrabold text-sm text-text-primary">Available</div>
                <div className="text-xs text-text-muted mt-1 leading-relaxed">
                  You are handling approvals normally.
                </div>
              </div>
            </button>

            {/* Card 2: Busy */}
            <button
              type="button"
              onClick={() => setSelectedStatus('BUSY')}
              className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                selectedStatus === 'BUSY'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-text-primary ring-2 ring-amber-500/20'
                  : 'bg-surface-soft border-border text-text-muted hover:border-primary/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  {selectedStatus === 'BUSY' && (
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="font-extrabold text-sm text-text-primary">Busy</div>
                <div className="text-xs text-text-muted mt-1 leading-relaxed">
                  Vice Principal will temporarily handle selected approvals.
                </div>
              </div>
            </button>

            {/* Card 3: Offline */}
            <button
              type="button"
              onClick={() => setSelectedStatus('OFFLINE')}
              className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                selectedStatus === 'OFFLINE'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-text-primary ring-2 ring-rose-500/20'
                  : 'bg-surface-soft border-border text-text-muted hover:border-primary/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  {selectedStatus === 'OFFLINE' && (
                    <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="font-extrabold text-sm text-text-primary">Offline</div>
                <div className="text-xs text-text-muted mt-1 leading-relaxed">
                  Vice Principal will act during your absence.
                </div>
              </div>
            </button>
          </div>

          {/* Conditional Options */}
          {selectedStatus === 'AVAILABLE' ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs space-y-2">
              <div className="font-bold flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                Return to Normal Operation
              </div>
              <p className="text-text-muted leading-relaxed">
                Selecting <strong className="text-text-primary">Available</strong> will automatically end active delegation, return any pending unresolved requests back to your queue, notify the Vice Principal, and generate a handover summary.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-2 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">Reason</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={
                      selectedStatus === 'BUSY'
                        ? 'Official inspection / External meeting'
                        : 'On official duty / Annual Leave'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-soft border border-border text-text-primary text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    Acting Authority
                  </label>
                  <div className="px-3.5 py-2.5 rounded-xl bg-surface-soft border border-border text-text-primary text-xs flex items-center justify-between">
                    <span className="font-bold text-amber-600 dark:text-amber-400">Vice Principal</span>
                    <Lock className="w-3.5 h-3.5 text-text-muted" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-soft border border-border text-text-primary text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-soft border border-border text-text-primary text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Delegated Categories */}
              <div>
                <label className="block text-xs font-bold text-text-primary mb-2">
                  Delegated Categories
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between ${
                        selectedCategories.includes(cat.id)
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500/60 text-amber-700 dark:text-amber-300'
                          : 'bg-surface-soft border-border text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <span>{cat.label}</span>
                      {selectedCategories.includes(cat.id) && (
                        <Check className="w-3.5 h-3.5 text-amber-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional message to VP */}
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1">
                  Optional Note to Vice Principal
                </label>
                <textarea
                  rows={2}
                  value={messageToVp}
                  onChange={(e) => setMessageToVp(e.target.value)}
                  placeholder="Please review urgent leave applications..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-soft border border-border text-text-primary text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border bg-surface-soft flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmSubmit}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <span>Updating...</span>
            ) : (
              <>
                <span>Confirm Status</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
