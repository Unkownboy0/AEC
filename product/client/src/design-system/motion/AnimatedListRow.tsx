import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { duration, easing, useReducedMotionPreference } from '../tokens/motion';

export interface AnimatedListRowProps {
  children: React.ReactNode;
  id: string | number;
  className?: string;
  isLeaving?: boolean;
  onExitComplete?: () => void;
}

export const AnimatedListRow: React.FC<AnimatedListRowProps> = ({
  children,
  id,
  className = '',
  isLeaving = false,
  onExitComplete,
}) => {
  const isReducedMotion = useReducedMotionPreference();

  if (isReducedMotion) {
    if (isLeaving) return null;
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {!isLeaving && (
        <motion.div
          key={id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{
            opacity: 0,
            height: 0,
            marginBottom: 0,
            paddingTop: 0,
            paddingBottom: 0,
            overflow: 'hidden',
          }}
          transition={{
            duration: isLeaving ? duration.standard : duration.interaction,
            ease: isLeaving ? easing.easeIn : easing.easeOut,
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedListRow;
