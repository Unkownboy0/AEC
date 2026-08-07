import React from 'react';
import { DashboardKpiIcon } from '../icons/DashboardKpiIcon';

export interface SummaryStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  iconName?: string;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'success' | 'amber' | 'rose' | 'purple' | 'blue';
}

export const SummaryStatCard: React.FC<SummaryStatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconName,
  trend,
  onClick,
  variant = 'default',
}) => {
  const getKpiVariant = () => {
    switch (variant) {
      case 'primary':
      case 'purple':
        return 'purple';
      case 'success':
        return 'emerald';
      case 'amber':
        return 'amber';
      case 'rose':
        return 'rose';
      case 'blue':
        return 'blue';
      default:
        return 'default';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`p-5 bg-surface border border-border rounded-2xl shadow-2xs transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-primary/40 active:scale-98' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-text-muted line-clamp-2 leading-tight">
          {title}
        </span>
        {iconName ? (
          <DashboardKpiIcon name={iconName} variant={getKpiVariant()} size="sm" />
        ) : icon ? (
          <div className="shrink-0">{icon}</div>
        ) : null}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
          {value}
        </div>
        {trend && (
          <span
            className={`text-xs font-bold ${
              trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      {subtitle && <p className="text-[11px] text-text-muted mt-1 font-medium">{subtitle}</p>}
    </div>
  );
};
