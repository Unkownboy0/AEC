/**
 * CampusOS Design System — Breakpoint Tokens
 *
 * Mobile-first breakpoints aligned with Tailwind defaults.
 * Used for JS-side media queries and responsive calculations.
 * For CSS, use Tailwind's responsive prefixes: sm:, md:, lg:, xl:, 2xl:
 */

export const breakpoints = {
  /** Small phones — minimum supported width */
  xs: 375,
  /** Large phones / small landscape */
  sm: 640,
  /** Tablets portrait */
  md: 768,
  /** Tablets landscape / small desktops */
  lg: 1024,
  /** Standard desktops */
  xl: 1280,
  /** Wide desktops */
  '2xl': 1536,
} as const;

/** Media query strings for JS-side use (e.g., matchMedia) */
export const mediaQueries = {
  mobile: `(max-width: ${breakpoints.md - 1}px)`,
  tablet: `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  desktop: `(min-width: ${breakpoints.lg}px)`,
  wide: `(min-width: ${breakpoints.xl}px)`,
  touch: '(hover: none) and (pointer: coarse)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
} as const;

/**
 * Layout breakpoint helpers.
 * - isMobile: < 768px (single column, bottom nav, full-screen sheets)
 * - isTablet: 768–1023px (collapsed sidebar, fluid grid)
 * - isDesktop: ≥ 1024px (full sidebar, multi-column)
 */
export const layout = {
  /** Below this: single-column mobile layout with bottom nav */
  mobileMax: breakpoints.md - 1,
  /** Below this but above mobile: tablet layout with collapsed sidebar */
  tabletMax: breakpoints.lg - 1,
  /** At or above this: full desktop layout with expanded sidebar */
  desktopMin: breakpoints.lg,
} as const;
