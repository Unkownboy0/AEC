import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { duration, easing, useReducedMotionPreference } from '../tokens/motion';

export interface AnimatedPageProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  direction?: 'forward' | 'backward' | 'none';
}

export const AnimatedPage: React.FC<AnimatedPageProps> = ({
  children,
  className = '',
  direction = 'forward',
  ...props
}) => {
  const isReducedMotion = useReducedMotionPreference();

  if (isReducedMotion || direction === 'none') {
    return <div className={className}>{children}</div>;
  }

  const initialX = direction === 'forward' ? 10 : -10;
  const exitX = direction === 'forward' ? -8 : 8;

  return (
    <motion.div
      initial={{ opacity: 0, x: initialX }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: exitX }}
      transition={{ duration: duration.page, ease: easing.easeOut }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage;
