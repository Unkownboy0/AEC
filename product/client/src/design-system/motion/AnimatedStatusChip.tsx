import React from 'react';
import { motion } from 'framer-motion';
import { duration, easing, useReducedMotionPreference } from '../tokens/motion';

export interface AnimatedStatusChipProps {
  label: string;
  statusKey: string;
  className?: string;
  variant?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'neutral';
  icon?: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  neutral: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700',
};

export const AnimatedStatusChip: React.FC<AnimatedStatusChipProps> = ({
  label,
  statusKey,
  className = '',
  variant = 'neutral',
  icon,
}) => {
  const isReducedMotion = useReducedMotionPreference();
  const baseClasses = `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${variantStyles[variant] || variantStyles.neutral} ${className}`;

  if (isReducedMotion) {
    return (
      <span className={baseClasses}>
        {icon}
        {label}
      </span>
    );
  }

  return (
    <motion.span
      key={statusKey}
      initial={{ opacity: 0.7, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: duration.interaction, ease: easing.easeOut }}
      className={baseClasses}
    >
      {icon}
      {label}
    </motion.span>
  );
};

export default AnimatedStatusChip;
