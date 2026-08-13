import React from 'react';
import { icons } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { getModuleIconName, type ModuleIconKey } from './icon-map';

/*
  CAMPUSOS AppIcon — Universal icon wrapper
  
  Standard sizes:
    sidebar: 18px
    button: 16px  
    action: 20px   (quick action cards)
    card: 20px     (dashboard metric cards)
    nav: 22px      (mobile bottom nav)
    empty: 36px    (empty states)
    xl: 48px       (auth / onboarding)

  Standard stroke: 1.75 (Lucide default is 2, we use 1.75 for premium feel)
*/

export type AppIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type AppIconVariant = 'sidebar' | 'button' | 'action' | 'card' | 'nav' | 'empty';

const SIZE_MAP: Record<AppIconVariant | AppIconSize, number> = {
  // Semantic variants
  sidebar: 18,
  button: 16,
  action: 20,
  card: 20,
  nav: 22,
  empty: 36,
  // Explicit sizes
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 36,
  xxl: 48,
};

export interface AppIconProps extends Omit<LucideProps, 'size'> {
  /** Icon name from Lucide React (e.g. "LayoutDashboard") */
  name: string;
  /** Module key from icon-map.ts (resolves to Lucide name) */
  module?: ModuleIconKey | string;
  /** Semantic size variant or explicit size */
  size?: AppIconVariant | AppIconSize | number;
  /** Stroke width — default 1.75 */
  strokeWidth?: number;
  className?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({
  name,
  module: moduleProp,
  size = 'md',
  strokeWidth = 1.75,
  className,
  ...rest
}) => {
  const iconName = moduleProp ? getModuleIconName(moduleProp) : name;
  const IconComponent = (icons as Record<string, React.FC<LucideProps>>)[iconName];

  if (!IconComponent) {
    const iconDict = icons as Record<string, React.FC<LucideProps>>;
    const Fallback = iconDict['HelpCircle'] || iconDict['CircleHelp'] || Object.values(iconDict)[0];
    const px = typeof size === 'number' ? size : SIZE_MAP[size as AppIconVariant | AppIconSize] ?? 20;
    return <Fallback size={px} strokeWidth={strokeWidth} className={className} {...rest} />;
  }

  const px = typeof size === 'number' ? size : SIZE_MAP[size as AppIconVariant | AppIconSize] ?? 20;
  return <IconComponent size={px} strokeWidth={strokeWidth} className={className} {...rest} />;
};

AppIcon.displayName = 'AppIcon';
