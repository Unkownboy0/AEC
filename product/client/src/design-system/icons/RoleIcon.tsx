import React from 'react';
import { AppIcon } from './AppIcon';
import { getRoleIconName } from './role-icon-map';

export interface RoleIconProps {
  role: string;
  roleName?: string;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

export const RoleIcon: React.FC<RoleIconProps> = ({
  role,
  roleName,
  size = 20,
  showLabel = true,
  className = '',
}) => {
  const iconName = getRoleIconName(role);
  const formattedRoleName = roleName || role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="flex items-center justify-center p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
        <AppIcon name={iconName} size={size} strokeWidth={1.75} />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-slate-900 dark:text-white">
          {formattedRoleName}
        </span>
      )}
    </div>
  );
};
