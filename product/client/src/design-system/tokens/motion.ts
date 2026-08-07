/**
 * CampusOS Design System — Motion Tokens
 *
 * Restrained, purposeful motion. Every animation must:
 *   1. Communicate a state change
 *   2. Direct attention
 *   3. Provide continuity between states
 *
 * Never animate for decoration. Keep durations short.
 * All animations respect prefers-reduced-motion automatically via CSS.
 */

import type { Variants, Easing } from 'framer-motion';

// ─── Duration Scale ───────────────────────────────────────────────
export const duration = {
  /** 100ms — instant feedback (button press, toggle) */
  instant: 0.1,
  /** 150ms — fast transitions (hover, focus, small elements) */
  fast: 0.15,
  /** 200ms — standard transitions (panels, tabs, state changes) */
  normal: 0.2,
  /** 300ms — larger elements (drawers, modals, page transitions) */
  slow: 0.3,
  /** 400ms — complex sequences (multi-step, stagger parent) */
  complex: 0.4,
} as const;

// ─── Easing ───────────────────────────────────────────────────────
export const easing = {
  /** Standard deceleration — elements arriving on screen */
  easeOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** Standard acceleration — elements leaving screen */
  easeIn: [0.4, 0, 1, 1] as [number, number, number, number],
  /** Symmetric — elements moving between positions */
  easeInOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
  /** Subtle spring-like — micro-interactions */
  spring: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
} as const;

// ─── CSS Transition Strings ───────────────────────────────────────
export const transition = {
  fast: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
  normal: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
  slow: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
  color: 'color 150ms ease, background-color 150ms ease, border-color 150ms ease',
  transform: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
  opacity: 'opacity 150ms ease',
} as const;

// ─── Framer Motion Variants ───────────────────────────────────────

/** Page enter/exit */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: easing.easeOut },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: duration.fast },
  },
};

/** Card hover lift */
export const cardHoverVariants: Variants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.01,
    y: -1,
    transition: { duration: duration.fast, ease: easing.easeOut },
  },
};

/** Modal scale-in */
export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.97, y: 8 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: duration.normal, ease: easing.easeOut },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 4,
    transition: { duration: duration.fast },
  },
};

/** Drawer slide-in from right */
export const drawerVariants: Variants = {
  initial: { x: '100%' },
  animate: {
    x: 0,
    transition: { duration: duration.slow, ease: easing.easeOut },
  },
  exit: {
    x: '100%',
    transition: { duration: duration.normal, ease: easing.easeIn },
  },
};

/** Bottom sheet slide-up */
export const bottomSheetVariants: Variants = {
  initial: { y: '100%' },
  animate: {
    y: 0,
    transition: { duration: duration.slow, ease: easing.easeOut },
  },
  exit: {
    y: '100%',
    transition: { duration: duration.normal, ease: easing.easeIn },
  },
};

/** Stagger children in lists */
export const listContainerVariants: Variants = {
  animate: {
    transition: { staggerChildren: 0.04 },
  },
};

/** Individual list item */
export const listItemVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.fast, ease: easing.easeOut },
  },
};

/** Fade-in overlay */
export const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: duration.fast },
  },
  exit: {
    opacity: 0,
    transition: { duration: duration.fast },
  },
};

// ─── Consolidated Tokens Export ───────────────────────────────────
export const motionTokens = {
  duration,
  easing,
  transition,
} as const;
