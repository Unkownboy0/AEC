import React from 'react';
import { motion } from 'framer-motion';
import { duration, easing, useReducedMotionPreference } from '../tokens/motion';

export interface TimelineStepItem {
  id: string;
  title: string;
  subtitle?: string;
  timestamp?: string;
  status: 'completed' | 'current' | 'pending' | 'rejected';
  isNew?: boolean;
}

export interface AnimatedTimelineProps {
  steps: TimelineStepItem[];
  className?: string;
}

export const AnimatedTimeline: React.FC<AnimatedTimelineProps> = ({
  steps,
  className = '',
}) => {
  const isReducedMotion = useReducedMotionPreference();

  return (
    <div className={`space-y-4 ${className}`}>
      {steps.map((step, idx) => {
        const isCurrentOrNew = step.status === 'current' || step.isNew;
        const isLast = idx === steps.length - 1;

        const content = (
          <div key={step.id} className="flex gap-3 relative">
            {!isLast && (
              <div className="absolute left-[13px] top-[24px] bottom-[-16px] w-[2px] bg-neutral-200 dark:bg-neutral-800" />
            )}
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                step.status === 'completed'
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                  : step.status === 'current'
                  ? 'bg-primary/10 text-primary border-primary animate-pulse'
                  : step.status === 'rejected'
                  ? 'bg-rose-50 text-rose-600 border-rose-300 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800'
                  : 'bg-neutral-100 text-neutral-400 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-500'
              }`}
            >
              {idx + 1}
            </div>

            <div className="flex-1 pt-0.5">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                <span>{step.title}</span>
                {step.timestamp && <span className="text-[10px] text-neutral-400 font-mono">{step.timestamp}</span>}
              </div>
              {step.subtitle && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{step.subtitle}</p>
              )}
            </div>
          </div>
        );

        if (!isReducedMotion && isCurrentOrNew) {
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.standard, ease: easing.easeOut }}
            >
              {content}
            </motion.div>
          );
        }

        return content;
      })}
    </div>
  );
};

export default AnimatedTimeline;
