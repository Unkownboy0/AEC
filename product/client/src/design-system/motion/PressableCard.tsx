import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { duration, easing, useReducedMotionPreference } from '../tokens/motion';

export interface PressableCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  disabled?: boolean;
}

export const PressableCard: React.FC<PressableCardProps> = ({
  children,
  className = '',
  onClick,
  disabled = false,
  ...props
}) => {
  const isReducedMotion = useReducedMotionPreference();
  const isInteractive = Boolean(onClick) && !disabled;

  if (isReducedMotion || !isInteractive) {
    return (
      <div
        className={`${className} ${disabled ? 'opacity-60 cursor-not-allowed' : onClick ? 'cursor-pointer' : ''}`}
        onClick={disabled ? undefined : onClick}
        {...(props as any)}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={{ duration: duration.press, ease: easing.easeOut }}
      onClick={onClick}
      className={`cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default PressableCard;
