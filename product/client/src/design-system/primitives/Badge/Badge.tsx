import React from 'react';
import { clsx } from 'clsx';

/* ═══════════════════════════════════════════════════════════════════
   BADGE — CampusOS Design System Primitive
   
   Status and label badges with semantic colors.
   Maps to human-readable workflow statuses.
   ═══════════════════════════════════════════════════════════════════ */

export interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md';
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-accent text-accent-foreground',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  danger: 'bg-danger-light text-danger',
  info: 'bg-info-light text-info',
  outline: 'bg-transparent border border-border text-muted-foreground',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-1.5 py-px text-[10px]',
  md: 'px-2 py-0.5 text-caption-sm',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  className,
}) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-medium rounded-pill whitespace-nowrap',
        'select-none shrink-0',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full shrink-0',
            variant === 'success' && 'bg-success',
            variant === 'warning' && 'bg-warning',
            variant === 'danger' && 'bg-danger',
            variant === 'info' && 'bg-info',
            variant === 'primary' && 'bg-primary',
            variant === 'default' && 'bg-muted-foreground',
            variant === 'outline' && 'bg-muted-foreground',
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';
export default Badge;
