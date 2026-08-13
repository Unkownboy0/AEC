import React from 'react';
import { clsx } from 'clsx';

/* ═══════════════════════════════════════════════════════════════════
   BUTTON — CampusOS Design System Primitive
   
   Variants per Master Design Specification:
   - Primary: Filled Purple
   - Secondary: Outline
   - Success: Green
   - Warning: Orange
   - Danger: Red
   - Ghost: Transparent
   ═══════════════════════════════════════════════════════════════════ */

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<string, string> = {
  primary:
    'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-xs shadow-purple-600/25 border border-purple-500/30',
  secondary:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 shadow-2xs',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200',
  danger:
    'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-xs shadow-red-600/25 border border-red-500/30',
  warning:
    'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white shadow-xs shadow-amber-500/25 border border-amber-400/30',
  success:
    'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs shadow-emerald-600/25 border border-emerald-500/30',
};

const sizeStyles: Record<string, string> = {
  sm: 'h-8 px-3 text-xs font-medium gap-1.5 rounded-lg',
  md: 'h-9 px-4 text-sm font-medium gap-2 rounded-xl',
  lg: 'h-11 px-5 text-base font-medium gap-2.5 rounded-xl touch-target min-h-[44px]',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        className={clsx(
          // Base
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-150 ease-in-out',
          'select-none whitespace-nowrap cursor-pointer',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500',
          // Variant
          variantStyles[variant],
          // Size
          sizeStyles[size],
          // States
          isDisabled && 'opacity-50 pointer-events-none cursor-not-allowed shadow-none',
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {isLoading ? (
          <LoadingSpinner size={size} />
        ) : (
          <>
            {leftIcon && <span className="shrink-0 [&>svg]:w-4 [&>svg]:h-4">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0 [&>svg]:w-4 [&>svg]:h-4">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

/* ─── Loading Spinner ──────────────────────────────────────────── */
const LoadingSpinner: React.FC<{ size: string }> = ({ size }) => {
  const spinnerSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return (
    <svg
      className={clsx(spinnerSize, 'animate-spin')}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export default Button;
