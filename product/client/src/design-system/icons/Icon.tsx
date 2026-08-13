import React from 'react';
import { getIconComponent } from './iconRegistry';
import { clsx } from 'clsx';

export interface IconProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  label?: string;
  tooltip?: string;
  ariaLabel?: string;
  strokeWidth?: number;
}

const sizeMap = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  className,
  label,
  tooltip,
  ariaLabel,
  strokeWidth = 2,
}) => {
  const IconComponent = getIconComponent(name);
  const pxSize = typeof size === 'number' ? size : sizeMap[size] || 20;

  const accessibleName = ariaLabel || label || tooltip || `${name} icon`;

  const iconElement = (
    <IconComponent
      size={pxSize}
      strokeWidth={strokeWidth}
      aria-label={accessibleName}
      role="img"
      className={clsx('shrink-0 transition-transform duration-150', className)}
    />
  );

  if (!label && !tooltip) {
    return iconElement;
  }

  return (
    <span
      title={tooltip || label}
      className="inline-flex items-center gap-1.5 min-w-0"
    >
      {iconElement}
      {label && <span className="truncate text-xs font-semibold">{label}</span>}
    </span>
  );
};
