import React from 'react';
import { CircularPriority, CircularCategory, CircularStatus } from '../types/circular.types';

// ─── Priority Badge ───────────────────────────────────────────────
const PRIORITY_CONFIG: Record<CircularPriority, { label: string; className: string; dot: string }> = {
  LOW: {
    label: 'Low',
    className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-500'
  },
  NORMAL: {
    label: 'Normal',
    className: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
    dot: 'bg-sky-500'
  },
  HIGH: {
    label: 'High',
    className: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500'
  },
  URGENT: {
    label: 'Urgent',
    className: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500'
  },
};

// ─── Category Badge ───────────────────────────────────────────────
const CATEGORY_CONFIG: Record<string, { label: string; className: string }> = {
  GENERAL: { label: 'General', className: 'bg-surface-soft text-text-secondary border border-border' },
  ACADEMIC: { label: 'Academic', className: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' },
  EXAMINATION: { label: 'Exam', className: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800' },
  ADMISSION: { label: 'Admission', className: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' },
  IQAC: { label: 'IQAC', className: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800' },
  PLACEMENT: { label: 'Placement', className: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800' },
  INTERNSHIP: { label: 'Internship', className: 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800' },
  FEES: { label: 'Fees', className: 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800' },
  TRANSPORT: { label: 'Transport', className: 'bg-yellow-50 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800' },
  EMERGENCY: { label: 'Emergency', className: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' },
  EVENT: { label: 'Event', className: 'bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800' },
  DEPARTMENT: { label: 'Dept', className: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800' },
  STAFF: { label: 'Staff', className: 'bg-lime-50 dark:bg-lime-950/60 text-lime-700 dark:text-lime-300 border border-lime-200 dark:border-lime-800' },
  STUDENT: { label: 'Student', className: 'bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800' },
  PARENT: { label: 'Parent', className: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800' },
};

const STATUS_CONFIG: Record<CircularStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700' },
  PUBLISHED: { label: 'Published', className: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' },
  ARCHIVED: { label: 'Archived', className: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800' },
};

// ─── Components ───────────────────────────────────────────────────

export const PriorityBadge: React.FC<{ priority: CircularPriority }> = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.NORMAL;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${cfg.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

export const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.GENERAL;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${cfg.className}`}>
      {cfg.label}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: CircularStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${cfg.className}`}>
      {cfg.label}
    </span>
  );
};

export const EmergencyBadge: React.FC = () => (
  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-danger text-white animate-pulse shadow-xs">
    🚨 EMERGENCY
  </span>
);

export const UnreadDot: React.FC = () => (
  <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 ring-2 ring-primary/20" />
);

export const AcknowledgedBadge: React.FC = () => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
    ✓ Acknowledged
  </span>
);
