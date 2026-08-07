/*
  CAMPUSOS ACTION ICON MAP — Central action icon registry
  
  Semantic colors:
  Create   → green
  Edit     → blue
  View     → blue
  Delete   → red
  Approve  → green
  Reject   → red
  Return   → orange
  Upload   → blue
  Download → green
  Print    → purple
  Share    → blue
*/

export const actionIconMap = {
  create: { icon: 'PlusCircle', colorClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100' },
  add: { icon: 'Plus', colorClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100' },
  edit: { icon: 'Pencil', colorClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100' },
  view: { icon: 'Eye', colorClass: 'text-sky-600 dark:text-sky-400', bgClass: 'bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100' },
  delete: { icon: 'Trash2', colorClass: 'text-rose-600 dark:text-rose-400', bgClass: 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100' },
  approve: { icon: 'CircleCheck', colorClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100' },
  reject: { icon: 'CircleX', colorClass: 'text-rose-600 dark:text-rose-400', bgClass: 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100' },
  return: { icon: 'Undo2', colorClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100' },
  upload: { icon: 'Upload', colorClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100' },
  download: { icon: 'Download', colorClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100' },
  print: { icon: 'Printer', colorClass: 'text-purple-600 dark:text-purple-400', bgClass: 'bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100' },
  share: { icon: 'Share2', colorClass: 'text-indigo-600 dark:text-indigo-400', bgClass: 'bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100' },
  more: { icon: 'Ellipsis', colorClass: 'text-slate-600 dark:text-slate-400', bgClass: 'bg-slate-100 dark:bg-slate-800' },
  search: { icon: 'Search', colorClass: 'text-slate-600 dark:text-slate-400', bgClass: 'bg-slate-100 dark:bg-slate-800' },
  filter: { icon: 'ListFilter', colorClass: 'text-slate-600 dark:text-slate-400', bgClass: 'bg-slate-100 dark:bg-slate-800' },
  refresh: { icon: 'RefreshCw', colorClass: 'text-slate-600 dark:text-slate-400', bgClass: 'bg-slate-100 dark:bg-slate-800' },
  save: { icon: 'Save', colorClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100' },
  send: { icon: 'Send', colorClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100' },
  call: { icon: 'Phone', colorClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100' },
  message: { icon: 'MessageSquare', colorClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100' },
} as const;

export type ActionIconKey = keyof typeof actionIconMap;
