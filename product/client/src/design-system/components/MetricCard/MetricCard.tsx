import React from 'react';
import { clsx } from 'clsx';

/* ═══════════════════════════════════════════════════════════════════
   METRIC CARD — CampusOS Design System Component
   
   KPI display card for dashboards. Shows a single metric
   with label, value, trend, and optional icon.
   Uses tabular numbers for metrics.
   ═══════════════════════════════════════════════════════════════════ */

export interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  trend,
  subtitle,
  onClick,
  className,
}) => {
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={clsx(
        'bg-surface border border-border rounded-lg p-4 md:p-5',
        'text-left transition-colors duration-fast',
        onClick && 'hover:border-border-strong hover:bg-raised cursor-pointer',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-caption text-muted-foreground truncate">{label}</p>
          <p className="mt-1 text-page-title-sm md:text-page-title font-semibold tabular-nums text-foreground">
            {value}
          </p>
          {trend && (
            <p
              className={clsx(
                'mt-1 text-caption-sm font-medium',
                trend.direction === 'up' && 'text-success',
                trend.direction === 'down' && 'text-danger',
                trend.direction === 'neutral' && 'text-muted-foreground'
              )}
            >
              {trend.direction === 'up' && '↑ '}
              {trend.direction === 'down' && '↓ '}
              {trend.value}
            </p>
          )}
          {subtitle && (
            <p className="mt-1 text-caption-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="shrink-0 w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-primary [&>svg]:w-5 [&>svg]:h-5">
            {icon}
          </div>
        )}
      </div>
    </Wrapper>
  );
};

MetricCard.displayName = 'MetricCard';
export default MetricCard;
