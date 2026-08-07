import React from 'react';
import { clsx } from 'clsx';
import { DashboardKpiIcon } from '../icons/DashboardKpiIcon';
import { ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   QUICK CARDS / METRIC CARDS — CampusOS Enterprise ERP
   
   Premium SaaS Dashboard Quick Cards:
   - Semi-3D Soft Gradient Icon
   - Metric Count
   - Label & Subtitle
   - Trend Indicator & Status Color
   - Optional Action Trigger
   ═══════════════════════════════════════════════════════════════════ */

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  isPositive?: boolean;
  comparison?: string;
  iconName?: string;
  iconVariant?: 'purple' | 'blue' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'indigo' | 'violet' | 'default';
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  colorClass?: string;
  statusColor?: 'purple' | 'blue' | 'emerald' | 'amber' | 'rose';
  actionLabel?: string;
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  isPositive = true,
  comparison,
  iconName = 'LayoutDashboard',
  iconVariant = 'purple',
  icon,
  colorClass,
  actionLabel,
  onClick,
  className,
}) => {
  const IconComponent = typeof icon === 'function' ? (icon as React.ComponentType<{ className?: string }>) : null;

  return (
    <div
      onClick={onClick}
      className={clsx(
        'relative bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md',
        'transition-all duration-200 flex flex-col justify-between group overflow-hidden',
        onClick && 'cursor-pointer hover:border-purple-300 active:scale-[0.99]',
        className
      )}
    >
      {/* Accent subtle top border highlight */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Header with Title & Semi-3D Gradient Icon */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block truncate">
            {title}
          </span>
          <span className="text-3xl font-extrabold tracking-tight text-slate-900 block font-mono">
            {value}
          </span>
        </div>

        {/* Semi-3D Soft Gradient KPI Icon or Custom Component */}
        {React.isValidElement(icon) ? (
          <div className={clsx('p-3 rounded-2xl shadow-sm shrink-0', colorClass || 'bg-purple-100 text-purple-600')}>
            {icon}
          </div>
        ) : IconComponent ? (
          <div className={clsx('p-3 rounded-2xl shadow-sm shrink-0', colorClass || 'bg-purple-100 text-purple-600')}>
            <IconComponent className="w-6 h-6 stroke-[2]" />
          </div>
        ) : (
          <DashboardKpiIcon name={iconName} variant={iconVariant} size="md" />
        )}
      </div>

      {/* Footer Details: Subtitle, Trend, Action */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          {trend && (
            <span
              className={clsx(
                'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0',
                isPositive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3 h-3 text-emerald-600" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-rose-600" />
              )}
              {trend}
            </span>
          )}
          {(subtitle || comparison) && (
            <span className="text-slate-500 text-[11px] font-medium truncate">
              {subtitle || comparison}
            </span>
          )}
        </div>

        {actionLabel && (
          <span className="text-purple-600 font-semibold text-[11px] inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform shrink-0">
            {actionLabel}
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </div>
  );
};

MetricCard.displayName = 'MetricCard';
export default MetricCard;
