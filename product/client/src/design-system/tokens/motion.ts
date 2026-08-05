import { Variants, Easing } from 'framer-motion';

export const motionTokens = {
  duration: {
    fast: 0.18,
    normal: 0.24,
    slow: 0.35,
  },
  easing: {
    easeOut: "easeOut" as Easing,
    easeInOut: "easeInOut" as Easing,
  },
};

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: motionTokens.duration.normal, ease: motionTokens.easing.easeOut } },
  exit: { opacity: 0, y: -4, transition: { duration: motionTokens.duration.fast } },
};

export const cardHoverVariants: Variants = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.015, y: -2, transition: { duration: motionTokens.duration.fast, ease: motionTokens.easing.easeOut } },
};

export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: motionTokens.duration.normal, ease: motionTokens.easing.easeOut } },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: motionTokens.duration.fast } },
};

export const drawerVariants: Variants = {
  initial: { x: '100%' },
  animate: { x: 0, transition: { duration: motionTokens.duration.normal, ease: motionTokens.easing.easeOut } },
  exit: { x: '100%', transition: { duration: motionTokens.duration.fast } },
};

export const listContainerVariants: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

export const listItemVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: motionTokens.duration.fast } },
};
