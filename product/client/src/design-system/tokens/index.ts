/**
 * CampusOS Design System — Token Barrel Export
 *
 * Import all design tokens from this single entry point:
 *   import { colors, typography, spacing, radii, shadows, breakpoints, motionTokens } from '@/design-system/tokens';
 */

export { colors, brand, status, light, dark } from './colors';
export { typography, fontFamily, fontWeight, fontSize } from './typography';
export { spacing, spacingPx, pageSpacing } from './spacing';
export { radii, radiiPx } from './radii';
export { shadows } from './shadows';
export { breakpoints, mediaQueries, layout } from './breakpoints';
export {
  motionTokens,
  duration,
  easing,
  transition,
  pageVariants,
  cardHoverVariants,
  modalVariants,
  drawerVariants,
  bottomSheetVariants,
  listContainerVariants,
  listItemVariants,
  overlayVariants,
} from './motion';
