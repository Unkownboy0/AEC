import React from 'react';
import { motion } from 'framer-motion';
import { duration, easing, useReducedMotionPreference } from '../tokens/motion';

export interface AnimatedProgressProps {
  value: number; // 0 to 100
  max?: number;
  className?: string;
  barClassName?: string;
  colorClass?: string;
  height?: string;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  value,
  max = 100,
  className = '',
  barClassName = '',
  colorClass = 'bg-primary',
  height = 'h-2',
}) => {
  const isReducedMotion = useReducedMotionPreference();
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden ${height} ${className}`}>
      {isReducedMotion ? (
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClass} ${barClassName}`}
          style={{ width: `${percentage}%` }}
        />
      ) : (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: duration.progress, ease: easing.easeOut }}
          className={`h-full rounded-full ${colorClass} ${barClassName}`}
        />
      )}
    </div>
  );
};

export default AnimatedProgress;
