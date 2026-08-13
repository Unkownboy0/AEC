import React from 'react';

export type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'pending';

interface StatusBadgeProps {
  status: string | StatusType;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const FRIENDLY_STATUS_MAP: Record<string, { label: string; style: string }> = {
  SUBMITTED: { label: 'Submitted', style: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  PENDING: { label: 'Pending Review', style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  PENDING_MENTOR: { label: 'Waiting for Mentor', style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  PENDING_HOD: { label: 'Waiting for HOD', style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  PENDING_PRINCIPAL: { label: 'Waiting for Principal', style: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  PENDING_VP: { label: 'Waiting for Vice Principal', style: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  HANDLED_BY_VP: { label: 'Handled by Vice Principal', style: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  DELEGATED_TO_VP: { label: 'Handled by Vice Principal', style: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  ACTING_PRINCIPAL: { label: 'Handled by Vice Principal', style: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  APPROVED: { label: 'Approved', style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  REJECTED: { label: 'Rejected', style: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  RETURNED: { label: 'Returned for Changes', style: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  CHANGES_REQUESTED: { label: 'Returned for Changes', style: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  COMPLETED: { label: 'Completed', style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  CANCELLED: { label: 'Cancelled', style: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
  DRAFT: { label: 'Draft', style: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'md' }) => {
  const rawKey = String(status).toUpperCase();
  const normalizedKey = String(status).toLowerCase();

  const mapped = FRIENDLY_STATUS_MAP[rawKey];

  let style = mapped?.style;
  let text = label || mapped?.label;

  if (!style) {
    if (['success', 'approved', 'completed', 'active', 'signed'].includes(normalizedKey)) {
      style = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    } else if (['warning', 'pending', 'in_progress'].includes(normalizedKey)) {
      style = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    } else if (['danger', 'rejected', 'failed', 'cancelled', 'inactive', 'high'].includes(normalizedKey)) {
      style = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    } else if (['info', 'published', 'open', 'scheduled'].includes(normalizedKey)) {
      style = 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
    } else {
      style = 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  }

  if (!text) {
    text = String(status).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px]'
      : size === 'lg'
      ? 'px-3 py-1 text-xs'
      : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium tracking-wide rounded-full border shadow-2xs ${style} ${sizeClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {text}
    </span>
  );
};

