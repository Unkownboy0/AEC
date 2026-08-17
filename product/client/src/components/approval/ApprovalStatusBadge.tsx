import React from 'react';
import { ApprovalStatusType, ApprovalPriorityType } from './ApprovalTypes';
import { CheckCircle2, Clock, XCircle, RotateCcw, AlertTriangle, ShieldCheck, ArrowRightCircle } from 'lucide-react';

interface ApprovalStatusBadgeProps {
  status: ApprovalStatusType | string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const ApprovalStatusBadge: React.FC<ApprovalStatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  showIcon = true,
}) => {
  const normStatus = (status || '').toUpperCase();
  const displayLabel = label || normStatus.replace(/_/g, ' ');

  let bgClass = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  let Icon = Clock;

  if (normStatus.includes('APPROVED') || normStatus === 'COMPLETED') {
    bgClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    Icon = CheckCircle2;
  } else if (normStatus.includes('REJECTED') || normStatus === 'CANCELLED') {
    bgClass = 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800';
    Icon = XCircle;
  } else if (normStatus.includes('RETURN') || normStatus === 'NEEDS_INFORMATION') {
    bgClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    Icon = RotateCcw;
  } else if (normStatus.includes('RECOMMENDED') || normStatus.includes('FORWARDED')) {
    bgClass = 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    Icon = ArrowRightCircle;
  } else if (normStatus.includes('PENDING') || normStatus.includes('REVIEW') || normStatus === 'SUBMITTED') {
    bgClass = 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    Icon = Clock;
  } else if (normStatus === 'ESCALATED') {
    bgClass = 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800';
    Icon = AlertTriangle;
  }

  const sizeClass = {
    sm: 'text-[10px] px-2 py-0.5 font-bold gap-1',
    md: 'text-xs px-2.5 py-1 font-bold gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 font-bold gap-2',
  }[size];

  return (
    <span className={`inline-flex items-center rounded-full border ${bgClass} ${sizeClass} tracking-wide transition-colors`}>
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{displayLabel}</span>
    </span>
  );
};

export const ApprovalPriorityBadge: React.FC<{ priority?: ApprovalPriorityType | string; isEmergency?: boolean }> = ({
  priority,
  isEmergency,
}) => {
  if (isEmergency || priority === 'EMERGENCY') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-600 text-white shadow-sm animate-pulse">
        <AlertTriangle className="w-3 h-3" />
        Emergency
      </span>
    );
  }

  if (priority === 'URGENT' || priority === 'HIGH') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500 text-white shadow-sm">
        Urgent
      </span>
    );
  }

  return null;
};
