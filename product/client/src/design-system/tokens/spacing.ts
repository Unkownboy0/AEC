/**
 * CampusOS Design System — Spacing Scale
 *
 * Strict 4px-based scale. Only these values should appear in the UI.
 * Maps to Tailwind spacing utilities: p-1 = 4px, p-2 = 8px, etc.
 */

export const spacing = {
  '0.5': '2px',
  '1': '4px',
  '1.5': '6px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '8': '32px',
  '10': '40px',
  '12': '48px',
  '16': '64px',
} as const;

/** Pixel number values for JS-side calculations */
export const spacingPx = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

/** Common page-level spacing */
export const pageSpacing = {
  /** Horizontal padding: 16px mobile, 24px tablet, 32px desktop */
  pagePaddingX: { mobile: 16, tablet: 24, desktop: 32 },
  /** Vertical gap between page sections */
  sectionGap: { mobile: 24, desktop: 32 },
  /** Gap between cards in a grid */
  cardGap: { mobile: 12, desktop: 16 },
  /** Internal card padding */
  cardPadding: { mobile: 16, desktop: 20 },
} as const;
