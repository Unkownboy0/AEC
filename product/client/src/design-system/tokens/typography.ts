/**
 * CampusOS Design System — Typography Tokens
 *
 * Hierarchy follows the master spec:
 *   Display → Page Title → Section Title → Card Title → Body → Caption
 *
 * Use the Tailwind utility classes (text-display, text-page-title, etc.)
 * for component styling. Use these constants for JS-side calculations.
 */

export const fontFamily =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif';

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

export const fontSize = {
  /** 44–56px desktop / 32–40px mobile */
  display: {
    desktop: { size: '2.75rem', lineHeight: 1.15, letterSpacing: '-0.02em', weight: 700 },
    mobile: { size: '2rem', lineHeight: 1.2, letterSpacing: '-0.015em', weight: 700 },
  },
  /** 30–38px desktop / 24–30px mobile */
  pageTitle: {
    desktop: { size: '1.875rem', lineHeight: 1.25, letterSpacing: '-0.015em', weight: 600 },
    mobile: { size: '1.5rem', lineHeight: 1.3, letterSpacing: '-0.01em', weight: 600 },
  },
  /** 20–24px */
  sectionTitle: { size: '1.25rem', lineHeight: 1.35, letterSpacing: '-0.01em', weight: 600 },
  /** 15–17px */
  cardTitle: { size: '0.9375rem', lineHeight: 1.4, letterSpacing: '0', weight: 600 },
  /** 14–16px */
  body: { size: '0.875rem', lineHeight: 1.6, letterSpacing: '0', weight: 400 },
  bodyLarge: { size: '1rem', lineHeight: 1.6, letterSpacing: '0', weight: 400 },
  /** 12–13px */
  caption: { size: '0.8125rem', lineHeight: 1.4, letterSpacing: '0', weight: 500 },
  captionSmall: { size: '0.75rem', lineHeight: 1.4, letterSpacing: '0', weight: 500 },
} as const;

/**
 * Tailwind class mappings for convenience.
 * Usage: `className={typography.display}` in JSX.
 */
export const typography = {
  display: 'text-display-sm md:text-display font-bold tracking-tight leading-tight',
  pageTitle: 'text-page-title-sm md:text-page-title font-semibold tracking-tight leading-snug',
  sectionTitle: 'text-section-title font-semibold tracking-tight leading-snug',
  cardTitle: 'text-card-title font-semibold leading-normal',
  body: 'text-body md:text-body-lg font-normal leading-relaxed',
  caption: 'text-caption font-medium leading-normal',
  captionSmall: 'text-caption-sm font-medium leading-normal',
  fontFamily,
} as const;
