import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { duration, easing, useReducedMotionPreference } from '../tokens/motion';

export interface AnimatedBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const AnimatedBottomSheet: React.FC<AnimatedBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}) => {
  const isReducedMotion = useReducedMotionPreference();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.interaction }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: isReducedMotion ? 0 : '100%', opacity: isReducedMotion ? 0 : 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: isReducedMotion ? 0 : '100%', opacity: 0 }}
            transition={{
              duration: isReducedMotion ? duration.interaction : duration.sheet,
              ease: easing.easeOut,
            }}
            className={`relative w-full max-w-lg bg-white dark:bg-[#0c0c0e] rounded-t-2xl sm:rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xl p-6 z-10 max-h-[85vh] overflow-y-auto ${className}`}
          >
            {/* Sheet Handle indicator for mobile */}
            <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mb-4 sm:hidden" />

            <div className="flex items-center justify-between mb-4">
              {title && <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{title}</h3>}
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedBottomSheet;
