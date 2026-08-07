import React from 'react';
import { AppIcon } from './AppIcon';
import { actionIconMap, type ActionIconKey } from './action-icon-map';

export interface ActionIconProps {
  action: ActionIconKey | string;
  size?: number;
  showBg?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
}

export const ActionIcon: React.FC<ActionIconProps> = ({
  action,
  size = 16,
  showBg = false,
  className = '',
  onClick,
  title,
}) => {
  const key = action.toLowerCase() as ActionIconKey;
  const config = actionIconMap[key] || actionIconMap.more;

  if (showBg) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title || action}
        className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-colors cursor-pointer ${config.bgClass} ${className}`}
      >
        <AppIcon name={config.icon} size={size} strokeWidth={1.75} className={config.colorClass} />
      </button>
    );
  }

  return (
    <AppIcon
      name={config.icon}
      size={size}
      strokeWidth={1.75}
      className={`${config.colorClass} ${className}`}
    />
  );
};
