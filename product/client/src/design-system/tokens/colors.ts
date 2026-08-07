/**
 * CampusOS Design System — Color Tokens
 *
 * These TS constants mirror the CSS custom properties defined in index.css.
 * Use them in JS-side logic (charts, dynamic styling, Capacitor native UI).
 * For component styling, prefer the Tailwind classes instead.
 */

// ─── Brand ────────────────────────────────────────────────────────
export const brand = {
  primary: '#6D4AFF',
  primaryHover: '#5D3FE3',
  primaryActive: '#4A2FD0',
  primaryLight: '#F0ECFF',
  primarySubtle: '#F7F5FF',
} as const;

// ─── Status ───────────────────────────────────────────────────────
export const status = {
  success: '#16A36A',
  successHover: '#138856',
  successLight: '#E0F5EC',

  warning: '#D97706',
  warningHover: '#B56000',
  warningLight: '#FEF3E0',

  danger: '#DC3C4D',
  dangerHover: '#B82E3D',
  dangerLight: '#FDE8EA',

  info: '#3478F6',
  infoHover: '#2860D0',
  infoLight: '#E5EFFE',
} as const;

// ─── Light Mode ───────────────────────────────────────────────────
export const light = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  raised: '#FCFCFC',
  border: '#EAEAEA',
  borderStrong: '#D8D8D8',
  textPrimary: '#111111',
  textSecondary: '#666666',
  textMuted: '#8A8A8A',
} as const;

// ─── Dark Mode ────────────────────────────────────────────────────
export const dark = {
  background: '#000000',
  surface: '#0A0A0A',
  raised: '#111111',
  border: '#262626',
  borderStrong: '#353535',
  textPrimary: '#EDEDED',
  textSecondary: '#A1A1A1',
  textMuted: '#737373',
} as const;

// ─── Convenience: Full palette export ─────────────────────────────
export const colors = {
  brand,
  status,
  light,
  dark,
} as const;
