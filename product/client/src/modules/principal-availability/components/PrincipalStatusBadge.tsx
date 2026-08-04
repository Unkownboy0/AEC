import React from 'react';
import { Circle } from 'lucide-react';
import { PrincipalStatusType } from '../types/availability.types';

interface PrincipalStatusBadgeProps {
  status?: PrincipalStatusType;
  showDot?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PrincipalStatusBadge: React.FC<PrincipalStatusBadgeProps> = ({
  status = 'AVAILABLE',
  showDot = true,
  size = 'md',
  className = '',
}) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'BUSY':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'OFFLINE':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  const getDotStyle = () => {
    switch (status) {
      case 'AVAILABLE':
        return 'text-emerald-400 fill-emerald-400';
      case 'BUSY':
        return 'text-amber-400 fill-amber-400 animate-pulse';
      case 'OFFLINE':
        return 'text-rose-400 fill-rose-400 animate-pulse';
      default:
        return 'text-slate-400 fill-slate-400';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'AVAILABLE':
        return 'Available';
      case 'BUSY':
        return 'Busy';
      case 'OFFLINE':
        return 'Offline';
      default:
        return 'Available';
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] font-semibold gap-1.5',
    md: 'px-3 py-1 text-xs font-bold gap-2',
    lg: 'px-4 py-1.5 text-sm font-extrabold gap-2.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm transition-colors ${getBadgeStyle()} ${sizeClasses[size]} ${className}`}
    >
      {showDot && <Circle className={`w-2 h-2 ${getDotStyle()}`} />}
      <span>{getLabel()}</span>
    </span>
  );
};
