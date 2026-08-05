import React from 'react';

export type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'pending';

interface StatusBadgeProps {
  status: string | StatusType;
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'md' }) => {
  const normalized = String(status).toLowerCase();

  const getStyles = () => {
    if (['success', 'approved', 'completed', 'active', 'signed'].includes(normalized)) {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
    if (['warning', 'pending', 'pending_mentor', 'pending_hod', 'in_progress', 'draft'].includes(normalized)) {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
    if (['danger', 'rejected', 'failed', 'cancelled', 'inactive', 'high'].includes(normalized)) {
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    }
    if (['info', 'published', 'open', 'scheduled'].includes(normalized)) {
      return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
    }
    return 'bg-muted/60 text-muted-foreground border-border';
  };

  const displayText = label || String(status).replace(/_/g, ' ').toUpperCase();

  return (
    <span
      className={`inline-flex items-center font-bold tracking-wider rounded-full border ${getStyles()} ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
      }`}
    >
      {displayText}
    </span>
  );
};
