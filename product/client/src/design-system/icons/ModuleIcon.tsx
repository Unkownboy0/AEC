import React from 'react';
import { clsx } from 'clsx';
import { AppIcon } from './AppIcon';
import type { ModuleIconKey } from './icon-map';

/*
  ModuleIcon — icon with themed soft background container for Quick Actions
  
  Maps module keys to accent color variants from index.css module-accent-* utilities.
  Same module uses same color everywhere: sidebar, quick action, mobile more, empty state.
*/

const MODULE_ACCENT_MAP: Record<string, string> = {
  // Violet — primary brand color modules
  dashboard: 'module-accent-violet',
  approvals: 'module-accent-violet',
  delegation: 'module-accent-violet',
  security: 'module-accent-violet',
  settings: 'module-accent-violet',
  roles: 'module-accent-violet',

  // Green — presence / health / success
  attendance: 'module-accent-green',
  availability: 'module-accent-green',
  online: 'module-accent-green',
  marks: 'module-accent-green',
  results: 'module-accent-green',
  performance: 'module-accent-green',

  // Amber — time / finance / warnings
  fees: 'module-accent-amber',
  payments: 'module-accent-amber',
  timetable: 'module-accent-amber',
  calendar: 'module-accent-amber',
  transport: 'module-accent-amber',
  backup: 'module-accent-amber',
  scholarships: 'module-accent-amber',

  // Red — alerts / complaints / urgent
  leave: 'module-accent-red',
  od: 'module-accent-red',
  complaints: 'module-accent-red',
  alert: 'module-accent-red',
  delete: 'module-accent-red',

  // Blue — information / reports / analytics
  reports: 'module-accent-blue',
  analytics: 'module-accent-blue',
  logs: 'module-accent-blue',
  search: 'module-accent-blue',
  media: 'module-accent-blue',

  // Cyan — messaging / communication
  messages: 'module-accent-cyan',
  notifications: 'module-accent-cyan',
  announcements: 'module-accent-cyan',
  email: 'module-accent-cyan',
  phone: 'module-accent-cyan',

  // Rose — people / mentoring / care
  mentors: 'module-accent-rose',
  parents: 'module-accent-rose',
  profile: 'module-accent-rose',
  idcard: 'module-accent-rose',

  // Purple — career / advanced
  placement: 'module-accent-purple',
  internship: 'module-accent-purple',
  jobs: 'module-accent-purple',
  library: 'module-accent-purple',
  syllabus: 'module-accent-purple',
  examinations: 'module-accent-purple',

  // Default for anything unmapped
  default: 'module-accent-violet',
};

export type ModuleIconContainerSize = 'sm' | 'md' | 'lg';

export interface ModuleIconProps {
  module: ModuleIconKey | string;
  containerSize?: ModuleIconContainerSize;
  className?: string;
}

const CONTAINER_SIZE: Record<ModuleIconContainerSize, string> = {
  sm: 'w-8 h-8 rounded-lg',
  md: 'w-10 h-10 rounded-xl',
  lg: 'w-12 h-12 rounded-xl',
};

const ICON_SIZE: Record<ModuleIconContainerSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
};

export const ModuleIcon: React.FC<ModuleIconProps> = ({
  module: moduleProp,
  containerSize = 'md',
  className,
}) => {
  const accentClass = MODULE_ACCENT_MAP[moduleProp] ?? MODULE_ACCENT_MAP.default;

  return (
    <div
      className={clsx(
        'flex items-center justify-center shrink-0',
        CONTAINER_SIZE[containerSize],
        accentClass,
        className
      )}
    >
      <AppIcon
        name="LayoutDashboard"
        module={moduleProp}
        size={ICON_SIZE[containerSize]}
        strokeWidth={1.75}
      />
    </div>
  );
};

ModuleIcon.displayName = 'ModuleIcon';
