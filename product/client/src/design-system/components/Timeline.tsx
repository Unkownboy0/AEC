import React from 'react';
import { StatusBadge } from './StatusBadge';

export interface TimelineItem {
  id: string;
  title: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
  status?: string;
  remarks?: string;
  fileUrl?: string;
  fileName?: string;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ items, className = '' }) => {
  if (items.length === 0) {
    return (
      <div className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">
        No history available
      </div>
    );
  }

  return (
    <div className={`relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 ${className}`}>
      {items.map((item, idx) => (
        <div key={item.id || idx} className="relative group">
          {/* Node Dot */}
          <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-indigo-600 bg-white dark:bg-slate-900 group-hover:scale-125 transition-transform" />

          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 p-3.5 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {item.title}
                </span>
                {item.status && <StatusBadge status={item.status} size="sm" />}
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {item.timestamp}
              </span>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400">
              By <span className="font-semibold text-slate-800 dark:text-slate-200">{item.actorName}</span> ({item.actorRole})
            </div>

            {item.remarks && (
              <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-900/80 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                "{item.remarks}"
              </p>
            )}

            {item.fileUrl && (
              <a
                href={item.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline pt-1"
              >
                📎 {item.fileName || 'View attachment'}
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
