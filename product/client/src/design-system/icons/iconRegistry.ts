import { moduleIcons, ModuleIconKey } from './moduleIcons';
import { actionIcons, ActionIconKey } from './actionIcons';
import { statusIcons, StatusIconKey } from './statusIcons';
import { roleIcons, RoleIconKey } from './roleIcons';
import * as LucideIcons from 'lucide-react';
import { ComponentType } from 'react';

export { moduleIcons } from './moduleIcons';
export type { ModuleIconKey } from './moduleIcons';

export { actionIcons } from './actionIcons';
export type { ActionIconKey } from './actionIcons';

export { statusIcons } from './statusIcons';
export type { StatusIconKey } from './statusIcons';

export { roleIcons } from './roleIcons';
export type { RoleIconKey } from './roleIcons';

export const allIcons = {
  ...moduleIcons,
  ...actionIcons,
  ...statusIcons,
  ...roleIcons,
};

/** Get any icon component by name, falling back to Lucide directly or Circle Dot */
export function getIconComponent(iconName: string): ComponentType<any> {
  if (!iconName) return LucideIcons.CircleDot;

  // Direct check in moduleIcons, actionIcons, statusIcons, roleIcons
  if (iconName in moduleIcons) return (moduleIcons as any)[iconName];
  if (iconName in actionIcons) return (actionIcons as any)[iconName];
  if (iconName in statusIcons) return (statusIcons as any)[iconName];
  if (iconName in roleIcons) return (roleIcons as any)[iconName];

  // Lucide direct check
  if (iconName in LucideIcons) return (LucideIcons as any)[iconName];

  // Case insensitive match
  const lower = iconName.toLowerCase();
  for (const [key, comp] of Object.entries(allIcons)) {
    if (key.toLowerCase() === lower) return comp as ComponentType<any>;
  }

  return LucideIcons.CircleDot;
}
