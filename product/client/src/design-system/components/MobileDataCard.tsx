import React from 'react';
import { ChevronRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export interface MobileDataCardProps {
  title: string;
  subtitle?: string;
  status?: string;
  metadata?: Array<{ label: string; value: React.ReactNode }>;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  onClick?: () => void;
}

export const MobileDataCard: React.FC<MobileDataCardProps> = ({
  title,
  subtitle,
  status,
  metadata = [],
  primaryAction,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-2xs space-y-3 transition-all ${
        onClick ? 'cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {title}
          </h4>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {status && <StatusBadge status={status} size="sm" />}
      </div>

      {metadata.length > 0 && (
        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
          {metadata.map((item, idx) => (
            <div key={idx} className="min-w-0">
              <span className="text-slate-400 dark:text-slate-500 block truncate text-[11px]">
                {item.label}
              </span>
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {(primaryAction || onClick) && (
        <div className="flex items-center justify-between pt-1">
          {primaryAction ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                primaryAction.onClick();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              {primaryAction.icon}
              <span>{primaryAction.label}</span>
            </button>
          ) : <div />}

          {onClick && (
            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600" />
          )}
        </div>
      )}
    </div>
  );
};
