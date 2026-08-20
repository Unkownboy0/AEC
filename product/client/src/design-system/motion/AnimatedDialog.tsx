import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { duration, easing, useReducedMotionPreference } from '../tokens/motion';

export interface AnimatedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const AnimatedDialog: React.FC<AnimatedDialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}) => {
  const isReducedMotion = useReducedMotionPreference();

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.interaction }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: isReducedMotion ? 1 : 0.97, y: isReducedMotion ? 0 : 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: isReducedMotion ? 1 : 0.97, y: isReducedMotion ? 0 : 4 }}
            transition={{ duration: duration.standard, ease: easing.easeOut }}
            className={`relative w-full max-w-md bg-white dark:bg-[#0c0c0e] rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-6 shadow-2xl z-10 ${className}`}
          >
            {title && <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-3">{title}</h3>}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedDialog;
