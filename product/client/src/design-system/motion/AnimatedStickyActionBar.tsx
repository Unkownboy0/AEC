import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { duration, easing, useReducedMotionPreference } from '../tokens/motion';

export interface AnimatedStickyActionBarProps {
  isVisible?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const AnimatedStickyActionBar: React.FC<AnimatedStickyActionBarProps> = ({
  isVisible = true,
  children,
  className = '',
}) => {
  const isReducedMotion = useReducedMotionPreference();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: isReducedMotion ? 0 : 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: isReducedMotion ? 0 : 20, opacity: 0 }}
          transition={{ duration: duration.standard, ease: easing.easeOut }}
          className={`sticky bottom-4 left-0 right-0 z-30 mx-auto max-w-xl bg-white/90 dark:bg-[#0c0c0e]/90 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800 p-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedStickyActionBar;
