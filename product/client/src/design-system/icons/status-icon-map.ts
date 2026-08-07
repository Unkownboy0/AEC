/*
  CAMPUSOS STATUS ICON MAP — Rule 6 Enforcement
  
  Never communicate state using only color.
  Always show Icon + Label (e.g., "✓ Approved" instead of only green badge).
*/

export const statusIconMap = {
  success: { icon: 'CircleCheck', label: 'Approved', colorClass: 'text-emerald-600 dark:text-emerald-400', badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  approved: { icon: 'CircleCheck', label: 'Approved', colorClass: 'text-emerald-600 dark:text-emerald-400', badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  pending: { icon: 'Clock3', label: 'Pending', colorClass: 'text-amber-600 dark:text-amber-400', badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  in_progress: { icon: 'RefreshCw', label: 'In Progress', colorClass: 'text-blue-600 dark:text-blue-400', badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  rejected: { icon: 'CircleX', label: 'Rejected', colorClass: 'text-rose-600 dark:text-rose-400', badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
  warning: { icon: 'TriangleAlert', label: 'Warning', colorClass: 'text-amber-600 dark:text-amber-400', badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  info: { icon: 'CircleInfo', label: 'Information', colorClass: 'text-sky-600 dark:text-sky-400', badgeClass: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800' },
  on_leave: { icon: 'Umbrella', label: 'On Leave', colorClass: 'text-amber-600 dark:text-amber-400', badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  on_od: { icon: 'Plane', label: 'On OD', colorClass: 'text-indigo-600 dark:text-indigo-400', badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
  available: { icon: 'UserRoundCheck', label: 'Available', colorClass: 'text-emerald-600 dark:text-emerald-400', badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  busy: { icon: 'UserRoundClock', label: 'Busy', colorClass: 'text-rose-600 dark:text-rose-400', badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
  offline: { icon: 'WifiOff', label: 'Offline', colorClass: 'text-slate-500 dark:text-slate-400', badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
} as const;

export type StatusIconKey = keyof typeof statusIconMap;
