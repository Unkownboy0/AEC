import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Power,
  Clock,
  Calendar,
  UserCheck,
  AlertTriangle,
  Sparkles,
  X,
  ChevronRight,
  CheckCircle2,
  Building2,
  FileCheck,
  Megaphone,
  Briefcase,
  Layers,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import api from '../../../lib/axios';
import { useAuth } from '../../../context/AuthContext';

export interface EligibleDelegateUser {
  id: string;
  name: string;
  role: string;
  designation?: string;
  email?: string;
  priority: number;
}

export interface PrincipalStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus?: string;
  onStatusUpdated?: () => void;
}

const STATUS_OPTIONS = [
  {
    id: 'AVAILABLE',
    label: 'Available',
    icon: '🟢',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    description: 'Principal handles all institutional approvals and governance responsibilities.',
  },
  {
    id: 'BUSY',
    label: 'Busy',
    icon: '🟠',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    description: 'Inside executive meetings. Approval authority delegates to Vice Principal.',
  },
  {
    id: 'LEAVE',
    label: 'On Leave',
    icon: '🔵',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    description: 'Principal unavailable. All approval authority transfers to Acting Principal.',
  },
  {
    id: 'OFFICIAL_DUTY',
    label: 'Official Duty (OD)',
    icon: '🟣',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    description: 'Principal outside campus on official duty. Delegated authority active.',
  },
  {
    id: 'CUSTOM',
    label: 'Custom Engagement',
    icon: '⚫',
    badgeBg: 'bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800',
    description: 'Specify a custom reason (Conference, NAAC Audit, Inspection, AICTE Visit).',
  },
];

const DURATION_PRESETS = [
  { id: '2_HOURS', label: '2 Hours', hours: 2 },
  { id: '4_HOURS', label: '4 Hours', hours: 4 },
  { id: 'TODAY', label: 'Today (until 6 PM)', hours: 'TODAY' },
  { id: 'TOMORROW', label: 'Tomorrow', hours: 24 },
  { id: '2_DAYS', label: '2 Days', hours: 48 },
  { id: '1_WEEK', label: '1 Week', hours: 168 },
  { id: 'CUSTOM', label: 'Custom Date & Time', hours: 'CUSTOM' },
  { id: 'UNTIL_FURTHER_NOTICE', label: 'Until Further Notice', hours: 720 },
];

const REASON_TAGS = [
  'Executive Board Meeting',
  'NAAC Accreditation Audit',
  'AICTE Inspection',
  'University Senate Visit',
  'Academic Conference',
  'Medical Leave',
  'Vacation / Off-Campus',
];

export const PrincipalStatusModal: React.FC<PrincipalStatusModalProps> = ({
  isOpen,
  onClose,
  currentStatus = 'AVAILABLE',
  onStatusUpdated,
}) => {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<string>(currentStatus);
  const [selectedDuration, setSelectedDuration] = useState<string>('TODAY');
  const [customReasonTag, setCustomReasonTag] = useState<string>('Executive Board Meeting');
  const [customReasonText, setCustomReasonText] = useState<string>('');
  
  const now = new Date();
  const defaultEndTime = new Date(now);
  defaultEndTime.setHours(18, 0, 0, 0);
  if (defaultEndTime <= now) {
    defaultEndTime.setDate(defaultEndTime.getDate() + 1);
  }

  const [startDateStr, setStartDateStr] = useState<string>(now.toISOString().slice(0, 16));
  const [endDateStr, setEndDateStr] = useState<string>(defaultEndTime.toISOString().slice(0, 16));
  
  const [eligibleDelegates, setEligibleDelegates] = useState<EligibleDelegateUser[]>([]);
  const [selectedDelegateId, setSelectedDelegateId] = useState<string>('');
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Config, Step 2: Confirmation
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch eligible delegates from backend
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setStep(1);
      const fetchDelegates = async () => {
        try {
          const res = await api.get('/principal/availability/eligible-delegates');
          if (res.data?.status === 'success' || res.data?.success) {
            const list: EligibleDelegateUser[] = res.data.data || [];
            setEligibleDelegates(list);
            if (list.length > 0) {
              setSelectedDelegateId(list[0].id);
            }
          }
        } catch (err) {
          console.error('Failed to fetch delegates:', err);
        }
      };
      fetchDelegates();
    }
  }, [isOpen]);

  // Handle Preset Duration Changes
  const handleDurationPreset = (presetId: string) => {
    setSelectedDuration(presetId);
    const start = new Date();
    setStartDateStr(start.toISOString().slice(0, 16));

    if (presetId === '2_HOURS') {
      const end = new Date(start.getTime() + 2 * 3600 * 1000);
      setEndDateStr(end.toISOString().slice(0, 16));
    } else if (presetId === '4_HOURS') {
      const end = new Date(start.getTime() + 4 * 3600 * 1000);
      setEndDateStr(end.toISOString().slice(0, 16));
    } else if (presetId === 'TODAY') {
      const end = new Date(start);
      end.setHours(18, 0, 0, 0);
      if (end <= start) end.setDate(end.getDate() + 1);
      setEndDateStr(end.toISOString().slice(0, 16));
    } else if (presetId === 'TOMORROW') {
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      end.setHours(18, 0, 0, 0);
      setEndDateStr(end.toISOString().slice(0, 16));
    } else if (presetId === '2_DAYS') {
      const end = new Date(start.getTime() + 48 * 3600 * 1000);
      setEndDateStr(end.toISOString().slice(0, 16));
    } else if (presetId === '1_WEEK') {
      const end = new Date(start.getTime() + 7 * 24 * 3600 * 1000);
      setEndDateStr(end.toISOString().slice(0, 16));
    } else if (presetId === 'UNTIL_FURTHER_NOTICE') {
      const end = new Date(start.getTime() + 30 * 24 * 3600 * 1000);
      setEndDateStr(end.toISOString().slice(0, 16));
    }
  };

  const selectedDelegate = eligibleDelegates.find((d) => d.id === selectedDelegateId) || eligibleDelegates[0];
  const finalReason = customReasonText.trim() || customReasonTag;

  const handleApplyStatus = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const payload = {
        status: selectedStatus,
        reason: selectedStatus === 'AVAILABLE' ? null : finalReason,
        startsAt: selectedStatus === 'AVAILABLE' ? null : new Date(startDateStr).toISOString(),
        endsAt: selectedStatus === 'AVAILABLE' ? null : new Date(endDateStr).toISOString(),
        actingUserId: selectedStatus === 'AVAILABLE' ? null : selectedDelegateId,
      };

      const res = await api.post('/principal/availability', payload);
      if (res.status === 200 || res.data?.success) {
        if (onStatusUpdated) onStatusUpdated();
        onClose();
      }
    } catch (err: any) {
      console.error('Failed to update Principal status:', err);
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to update availability status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden z-10 my-auto"
        >
          {/* Modal Header */}
          <div className="p-5 sm:p-6 border-b border-border/80 flex items-center justify-between bg-surface-soft/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-text-primary flex items-center gap-2">
                  Principal Executive Command Center
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Configure status, delegation authority, duration scheduling &amp; routing.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text-primary rounded-xl hover:bg-surface-soft transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {step === 1 ? (
              <>
                {/* 1. STATUS SELECTION */}
                <div className="space-y-3">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted block">
                    1. Select Governance Status
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {STATUS_OPTIONS.map((opt) => {
                      const isSelected = selectedStatus === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => setSelectedStatus(opt.id)}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 active:scale-98 ${
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-xs'
                              : 'border-border/80 bg-surface hover:border-primary/40'
                          }`}
                        >
                          <span className="text-lg shrink-0">{opt.icon}</span>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                              {opt.label}
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                            </h4>
                            <p className="text-[11px] text-text-muted mt-1 leading-snug">
                              {opt.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedStatus !== 'AVAILABLE' && (
                  <>
                    {/* 2. DURATION PRESETS & SCHEDULE */}
                    <div className="space-y-3 pt-2 border-t border-border/60">
                      <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted block">
                        2. Duration &amp; Time Schedule
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {DURATION_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleDurationPreset(preset.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                              selectedDuration === preset.id
                                ? 'bg-primary text-white border-primary shadow-xs'
                                : 'bg-surface-soft border-border text-text-muted hover:text-text-primary'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="text-[11px] font-bold text-text-muted mb-1 block">Start Date &amp; Time</label>
                          <input
                            type="datetime-local"
                            value={startDateStr}
                            onChange={(e) => setStartDateStr(e.target.value)}
                            className="w-full px-3 py-2 bg-surface-soft border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-text-muted mb-1 block">End Date &amp; Time</label>
                          <input
                            type="datetime-local"
                            value={endDateStr}
                            onChange={(e) => setEndDateStr(e.target.value)}
                            className="w-full px-3 py-2 bg-surface-soft border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3. DELEGATE SELECTION */}
                    <div className="space-y-3 pt-2 border-t border-border/60">
                      <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted block">
                        3. Assign Acting Principal Delegate
                      </label>
                      <div className="grid grid-cols-1 gap-2.5">
                        {eligibleDelegates
                          .filter((d) => d.role.toUpperCase().includes('VICE') || d.role.toUpperCase().includes('VP'))
                          .map((delegate) => {
                            const isSelected = selectedDelegateId === delegate.id || eligibleDelegates.length === 1;
                            return (
                              <div
                                key={delegate.id}
                                onClick={() => setSelectedDelegateId(delegate.id)}
                                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                                  isSelected
                                    ? 'border-primary bg-primary/5 shadow-xs'
                                    : 'border-border/80 bg-surface hover:border-primary/40'
                                }`}
                              >
                                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                                  {delegate.name.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-text-primary truncate">{delegate.name}</p>
                                  <p className="text-[10px] text-primary font-extrabold uppercase tracking-wider truncate">
                                    Vice Principal (VP)
                                  </p>
                                </div>
                                {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* 4. REASON & CUSTOM ENGAGEMENT TAGS */}
                    <div className="space-y-3 pt-2 border-t border-border/60">
                      <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted block">
                        4. Reason &amp; Executive Note
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {REASON_TAGS.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setCustomReasonTag(tag);
                              setCustomReasonText(tag);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                              customReasonTag === tag
                                ? 'bg-indigo-500/10 text-primary border-primary/40'
                                : 'bg-surface-soft border-border text-text-muted hover:text-text-primary'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        placeholder="Or enter custom reason / instructions..."
                        value={customReasonText}
                        onChange={(e) => setCustomReasonText(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-soft border border-border rounded-xl text-xs font-semibold text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                      />
                    </div>
                  </>
                )}
              </>
            ) : (
              /* STEP 2: CONFIRMATION & IMPACT SUMMARY */
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-1">
                  <h4 className="text-xs font-extrabold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Confirm Status &amp; Delegation Authority
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                    Please review the impact summary below before applying delegation control.
                  </p>
                </div>

                <div className="p-5 bg-surface-soft rounded-2xl border border-border space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="font-bold text-text-muted">Target Status:</span>
                    <span className="font-extrabold text-text-primary">{selectedStatus}</span>
                  </div>

                  {selectedStatus !== 'AVAILABLE' && (
                    <>
                      <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <span className="font-bold text-text-muted">Acting Delegate:</span>
                        <span className="font-extrabold text-primary">{selectedDelegate?.name} ({selectedDelegate?.role})</span>
                      </div>

                      <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <span className="font-bold text-text-muted">Effective Period:</span>
                        <span className="font-bold text-text-primary">
                          {new Date(startDateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' → '}
                          {new Date(endDateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <span className="font-bold text-text-muted">Reason:</span>
                        <span className="font-bold text-text-primary">{finalReason}</span>
                      </div>

                      <div>
                        <span className="font-bold text-text-muted block mb-1.5">Affected Modules &amp; Authority:</span>
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-text-primary">
                          <span className="p-2 rounded-xl bg-surface border border-border flex items-center gap-1.5">
                            <FileCheck className="w-3.5 h-3.5 text-primary" /> Approval Center
                          </span>
                          <span className="p-2 rounded-xl bg-surface border border-border flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-emerald-500" /> Leave &amp; OD
                          </span>
                          <span className="p-2 rounded-xl bg-surface border border-border flex items-center gap-1.5">
                            <Megaphone className="w-3.5 h-3.5 text-amber-500" /> Circular Approvals
                          </span>
                          <span className="p-2 rounded-xl bg-surface border border-border flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-purple-500" /> Executive Tasks
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-5 sm:p-6 border-t border-border/80 bg-surface-soft/50 flex items-center justify-between gap-3">
            {step === 2 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-text-muted hover:text-text-primary transition-colors"
              >
                Back to Edit
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-text-muted hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
            )}

            {step === 1 && selectedStatus !== 'AVAILABLE' ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 active:scale-95 shadow-md"
              >
                <span>Review &amp; Confirm</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleApplyStatus}
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 active:scale-95 shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Applying Status...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{selectedStatus === 'AVAILABLE' ? 'Return Available' : 'Apply Delegation Mode'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PrincipalStatusModal;
