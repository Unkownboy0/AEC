/**
 * CampusOS Design System — Shadow Tokens
 *
 * Shadows are used ONLY for elevated interactive elements:
 *   - Modals / Dialogs
 *   - Drawers / Bottom Sheets
 *   - Popovers / Floating Menus
 *   - Sticky Mobile Action Bars
 *
 * DO NOT use shadows on regular cards — use borders and surface contrast.
 */

export const shadows = {
  /** Barely perceptible — tiny elevation hint */
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.04)',

  /** Subtle — popover triggers, small floating UI */
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',

  /** Medium — popovers, dropdown menus */
  md: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',

  /** Large — drawers, side panels */
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)',

  /** Extra-large — page-level overlays */
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04)',

  /** Drawer-specific — right-side detail panels */
  drawer: '0 0 40px -4px rgb(0 0 0 / 0.12)',

  /** Modal-specific — centered dialogs */
  modal: '0 16px 70px -10px rgb(0 0 0 / 0.20), 0 8px 24px -6px rgb(0 0 0 / 0.08)',

  /** Popover-specific — floating menus, tooltips */
  popover: '0 4px 20px -2px rgb(0 0 0 / 0.12), 0 2px 6px -1px rgb(0 0 0 / 0.06)',

  /** Sticky action bars (mobile bottom, table header) */
  sticky: '0 -1px 0 0 rgb(0 0 0 / 0.06), 0 2px 8px -2px rgb(0 0 0 / 0.08)',

  /** Inner shadow for pressed/inset states */
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const;
