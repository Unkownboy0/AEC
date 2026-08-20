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

import { useState, useEffect } from 'react';
import type { Variants } from 'framer-motion';

// ─── Functional Motion Duration Scale (in seconds for Framer Motion) ─────
export const duration = {
  /** 80–120ms — Instant press feedback (button press, scale compression) */
  press: 0.1,
  /** 120–180ms — Fast micro-interactions (chip crossfade, toggle, icon pop) */
  interaction: 0.15,
  fast: 0.15,
  /** 180–240ms — Standard state transitions (workspace switch, card collapse) */
  standard: 0.2,
  normal: 0.2,
  /** 220–300ms — Page navigation & spatial transition */
  page: 0.25,
  slow: 0.3,
  /** 250–320ms — Native bottom sheet slide-up */
  sheet: 0.28,
  /** 350–550ms — Numeric counter transition */
  counter: 0.4,
  /** 400–700ms — Progress bar width transition */
  progress: 0.5,
} as const;

// ─── Deceleration & Acceleration Curves ─────────────────────────────────
export const easing = {
  /** Standard deceleration — elements arriving on screen */
  easeOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** Standard acceleration — elements leaving screen */
  easeIn: [0.4, 0, 1, 1] as [number, number, number, number],
  /** Symmetric — elements moving between positions */
  easeInOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
  /** Micro-interaction subtle spring */
  spring: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
} as const;

// ─── CSS Transition Strings ──────────────────────────────────────────────
export const transition = {
  press: 'transform 100ms cubic-bezier(0.16, 1, 0.3, 1)',
  interaction: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
  fast: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
  standard: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
  normal: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
  page: 'transform 250ms cubic-bezier(0.16, 1, 0.3, 1), opacity 250ms ease',
  sheet: 'transform 280ms cubic-bezier(0.16, 1, 0.3, 1)',
  color: 'color 150ms ease, background-color 150ms ease, border-color 150ms ease',
  progress: 'width 500ms cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

// ─── Framer Motion Variants ──────────────────────────────────────────────

/** Page enter/exit */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.page, ease: easing.easeOut },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: duration.interaction },
  },
};

/** Press compression variant */
export const pressableVariants: Variants = {
  rest: { scale: 1 },
  press: { scale: 0.98, transition: { duration: duration.press, ease: easing.easeOut } },
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
    transition: { duration: duration.standard, ease: easing.easeOut },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 4,
    transition: { duration: duration.interaction },
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
    transition: { duration: duration.standard, ease: easing.easeIn },
  },
};

/** Bottom sheet slide-up */
export const bottomSheetVariants: Variants = {
  initial: { y: '100%' },
  animate: {
    y: 0,
    transition: { duration: duration.sheet, ease: easing.easeOut },
  },
  exit: {
    y: '100%',
    transition: { duration: duration.standard, ease: easing.easeIn },
  },
};

/** Stagger children in lists */
export const listContainerVariants: Variants = {
  animate: {
    transition: { staggerChildren: 0.035 },
  },
};

/** Individual list item entrance */
export const listItemVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.interaction, ease: easing.easeOut },
  },
  exit: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
    transition: { duration: duration.standard, ease: easing.easeIn },
  },
};

/** Fade-in overlay */
export const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: duration.interaction },
  },
  exit: {
    opacity: 0,
    transition: { duration: duration.interaction },
  },
};

/** Hook to detect OS prefers-reduced-motion setting */
export function useReducedMotionPreference(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  return prefersReducedMotion;
}

// ─── Consolidated Tokens Export ───────────────────────────────────
export const motionTokens = {
  duration,
  easing,
  transition,
} as const;

