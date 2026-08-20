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
        'min-w-0 bg-surface border border-border/80 rounded-2xl p-4 md:p-5 shadow-2xs',
        'text-left transition-all duration-fast',
        onClick && 'hover:border-primary/30 hover:bg-raised cursor-pointer active:scale-[0.99]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-caption text-muted-foreground line-clamp-2 leading-snug">{label}</p>
          <p className="mt-1 text-[clamp(1.375rem,7vw,1.75rem)] leading-tight font-semibold tabular-nums text-foreground break-words">
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
          <div className="shrink-0 w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-primary [&>svg]:w-5 [&>svg]:h-5">
            {icon}
          </div>
        )}
      </div>
    </Wrapper>
  );
};

MetricCard.displayName = 'MetricCard';
export default MetricCard;
