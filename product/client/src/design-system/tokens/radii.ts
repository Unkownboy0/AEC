/**
 * CampusOS Design System — Border Radius Scale
 *
 * Per master spec:
 *   Small: 6px   — badges, chips
 *   Default: 8px — buttons, inputs
 *   Card: 10px   — cards, sections
 *   Drawer: 12px — drawers, bottom sheets
 *   Modal: 14px  — dialogs, modals
 *   Pill: 9999px — tags, pills, full-round buttons
 */

export const radii = {
  /** 6px — small elements like badges, chips */
  sm: '6px',
  /** 8px — buttons, inputs, default */
  default: '8px',
  /** 10px — cards, content sections */
  card: '10px',
  /** 12px — drawers, bottom sheets, large panels */
  drawer: '12px',
  /** 14px — modals, dialogs */
  modal: '14px',
  /** 9999px — pills, tags, full-round */
  pill: '9999px',
} as const;

/** Numeric values for JS calculations */
export const radiiPx = {
  sm: 6,
  default: 8,
  card: 10,
  drawer: 12,
  modal: 14,
} as const;
