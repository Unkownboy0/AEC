import React from 'react';
import { CircularPriority, CircularCategory, CircularStatus } from '../types/circular.types';

// ─── Priority Badge ───────────────────────────────────────────────
const PRIORITY_CONFIG: Record<CircularPriority, { label: string; className: string; dot: string }> = {
  LOW: { label: 'Low', className: 'bg-slate-100 text-slate-600 border border-slate-200', dot: 'bg-slate-400' },
  NORMAL: { label: 'Normal', className: 'bg-sky-50 text-sky-700 border border-sky-200', dot: 'bg-sky-500' },
  HIGH: { label: 'High', className: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500' },
  URGENT: { label: 'Urgent', className: 'bg-rose-50 text-rose-700 border border-rose-200', dot: 'bg-rose-500' },
};

// ─── Category Badge ───────────────────────────────────────────────
const CATEGORY_CONFIG: Record<string, { label: string; className: string }> = {
  GENERAL: { label: 'General', className: 'bg-gray-100 text-gray-700 border border-gray-200' },
  ACADEMIC: { label: 'Academic', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  EXAMINATION: { label: 'Exam', className: 'bg-purple-50 text-purple-700 border border-purple-200' },
  ADMISSION: { label: 'Admission', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  IQAC: { label: 'IQAC', className: 'bg-teal-50 text-teal-700 border border-teal-200' },
  PLACEMENT: { label: 'Placement', className: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
  INTERNSHIP: { label: 'Internship', className: 'bg-violet-50 text-violet-700 border border-violet-200' },
  FEES: { label: 'Fees', className: 'bg-orange-50 text-orange-700 border border-orange-200' },
  TRANSPORT: { label: 'Transport', className: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  EMERGENCY: { label: 'Emergency', className: 'bg-red-50 text-red-700 border border-red-200' },
  EVENT: { label: 'Event', className: 'bg-pink-50 text-pink-700 border border-pink-200' },
  DEPARTMENT: { label: 'Dept', className: 'bg-cyan-50 text-cyan-700 border border-cyan-200' },
  STAFF: { label: 'Staff', className: 'bg-lime-50 text-lime-700 border border-lime-200' },
  STUDENT: { label: 'Student', className: 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200' },
  PARENT: { label: 'Parent', className: 'bg-rose-50 text-rose-800 border border-rose-200' },
};

const STATUS_CONFIG: Record<CircularStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-slate-100 text-slate-600 border border-slate-200' },
  PUBLISHED: { label: 'Published', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  ARCHIVED: { label: 'Archived', className: 'bg-purple-50 text-purple-700 border border-purple-200' },
};

// ─── Components ───────────────────────────────────────────────────

export const PriorityBadge: React.FC<{ priority: CircularPriority }> = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.NORMAL;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

export const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.GENERAL;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: CircularStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
};

export const EmergencyBadge: React.FC = () => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse">
    🚨 EMERGENCY
  </span>
);

export const UnreadDot: React.FC = () => (
  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
);

export const AcknowledgedBadge: React.FC = () => (
  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
    ✓ Acknowledged
  </span>
);
