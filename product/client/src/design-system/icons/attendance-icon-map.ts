/*
  CAMPUSOS ATTENDANCE ICON MAP — Rule 7 Standard
  
  Present → CheckCircle (emerald)
  Absent  → XCircle (rose)
  Late    → Clock (amber)
  Leave   → Umbrella (purple/amber)
  OD      → Plane (indigo)
*/

export const attendanceIconMap = {
  present: {
    icon: 'CheckCircle',
    label: 'Present',
    shortLabel: 'P',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    activeClass: 'bg-emerald-600 text-white shadow-emerald-200 dark:shadow-none',
  },
  absent: {
    icon: 'XCircle',
    label: 'Absent',
    shortLabel: 'A',
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    activeClass: 'bg-rose-600 text-white shadow-rose-200 dark:shadow-none',
  },
  late: {
    icon: 'Clock',
    label: 'Late',
    shortLabel: 'L',
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    activeClass: 'bg-amber-500 text-white shadow-amber-200 dark:shadow-none',
  },
  leave: {
    icon: 'Umbrella',
    label: 'Leave',
    shortLabel: 'LV',
    colorClass: 'text-purple-600 dark:text-purple-400',
    bgClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    activeClass: 'bg-purple-600 text-white shadow-purple-200 dark:shadow-none',
  },
  od: {
    icon: 'Plane',
    label: 'On Duty',
    shortLabel: 'OD',
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    activeClass: 'bg-indigo-600 text-white shadow-indigo-200 dark:shadow-none',
  },
} as const;

export type AttendanceIconKey = keyof typeof attendanceIconMap;
