import React from 'react';
import { clsx } from 'clsx';
import { getIconComponent } from './iconRegistry';

export interface DashboardKpiIconProps {
  name: string;
  variant?: 'purple' | 'blue' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'indigo' | 'violet' | 'default';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles = {
  purple: 'bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/25 border border-purple-400/30',
  blue: 'bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25 border border-blue-400/30',
  emerald: 'bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/30',
  amber: 'bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 text-white shadow-lg shadow-amber-500/25 border border-amber-300/30',
  rose: 'bg-gradient-to-tr from-rose-700 via-pink-600 to-rose-400 text-white shadow-lg shadow-rose-500/25 border border-rose-400/30',
  cyan: 'bg-gradient-to-tr from-cyan-700 via-teal-500 to-sky-400 text-white shadow-lg shadow-cyan-500/25 border border-cyan-300/30',
  indigo: 'bg-gradient-to-tr from-indigo-800 via-indigo-600 to-purple-500 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30',
  violet: 'bg-gradient-to-tr from-violet-700 via-purple-600 to-fuchsia-400 text-white shadow-lg shadow-violet-500/25 border border-violet-400/30',
  default: 'bg-gradient-to-tr from-slate-800 via-slate-700 to-slate-600 text-white shadow-lg shadow-slate-600/25 border border-slate-500/30',
};

const sizeStyles = {
  sm: { box: 'w-10 h-10 rounded-xl', iconSize: 20 },
  md: { box: 'w-12 h-12 rounded-2xl', iconSize: 24 },
  lg: { box: 'w-14 h-14 rounded-2xl', iconSize: 28 },
};

export const DashboardKpiIcon: React.FC<DashboardKpiIconProps> = ({
  name,
  variant = 'purple',
  size = 'md',
  className,
}) => {
  const IconComp = getIconComponent(name);
  const sizeConfig = sizeStyles[size];

  return (
    <div
      className={clsx(
        'relative flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-105 select-none overflow-hidden',
        sizeConfig.box,
        variantStyles[variant],
        className
      )}
    >
      {/* Semi-3D Top Highlight Layer */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-60 pointer-events-none" />
      <IconComp size={sizeConfig.iconSize} strokeWidth={2.2} className="relative z-10 drop-shadow-xs" />
    </div>
  );
};

DashboardKpiIcon.displayName = 'DashboardKpiIcon';
export default DashboardKpiIcon;
