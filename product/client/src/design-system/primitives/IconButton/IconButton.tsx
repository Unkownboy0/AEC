import React from 'react';
import { clsx } from 'clsx';

/* ═══════════════════════════════════════════════════════════════════
   ICON BUTTON — CampusOS Design System Primitive
   
   Square button for icon-only actions.
   Enforces 44px touch target on mobile for accessibility.
   ═══════════════════════════════════════════════════════════════════ */

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  label: string; // Required for accessibility (aria-label)
  isLoading?: boolean;
}

const variantStyles: Record<string, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
  secondary: 'bg-secondary text-foreground border border-border hover:bg-muted',
  ghost: 'bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground',
  danger: 'bg-transparent text-danger hover:bg-danger-light',
};

const sizeStyles: Record<string, string> = {
  sm: 'w-8 h-8 rounded-sm [&>svg]:w-4 [&>svg]:h-4',
  md: 'w-9 h-9 rounded [&>svg]:w-[18px] [&>svg]:h-[18px]',
  lg: 'w-11 h-11 rounded-lg [&>svg]:w-5 [&>svg]:h-5 touch-target',
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'ghost', size = 'md', label, isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        className={clsx(
          'inline-flex items-center justify-center shrink-0',
          'transition-all duration-fast',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          variantStyles[variant],
          sizeStyles[size],
          (disabled || isLoading) && 'opacity-50 pointer-events-none',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          children
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
export default IconButton;
