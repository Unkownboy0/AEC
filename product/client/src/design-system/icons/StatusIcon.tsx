import React from 'react';
import { AppIcon } from './AppIcon';
import { statusIconMap, type StatusIconKey } from './status-icon-map';

export interface StatusIconProps {
  status: StatusIconKey | string;
  customLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const StatusIcon: React.FC<StatusIconProps> = ({
  status,
  customLabel,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const normalizedKey = status.toLowerCase().replace(/[\s-]/g, '_') as StatusIconKey;
  const config = statusIconMap[normalizedKey] || {
    icon: 'CircleInfo',
    label: customLabel || status,
    colorClass: 'text-slate-600 dark:text-slate-400',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };

  const iconPx = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;
  const badgePadding = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1.5 text-sm font-semibold' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${config.badgeClass} ${badgePadding} ${className}`}>
      <AppIcon name={config.icon} size={iconPx} strokeWidth={1.75} className={config.colorClass} />
      {showLabel && <span>{customLabel || config.label}</span>}
    </span>
  );
};
