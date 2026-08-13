import React from 'react';
import { clsx } from 'clsx';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../primitives/Button/Button';

/* ═══════════════════════════════════════════════════════════════════
   EMPTY STATE — CampusOS Design System Component
   
   Shown when a page or section has no data.
   Must provide helpful message, never blank pages.
   ═══════════════════════════════════════════════════════════════════ */

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  className?: string;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}) => {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        className
      )}
    >
      {icon && (
        <div className="mb-4 w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground [&>svg]:w-6 [&>svg]:h-6">
          {icon}
        </div>
      )}
      <h3 className={clsx('font-semibold text-foreground', compact ? 'text-card-title' : 'text-section-title')}>
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 text-body text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          <Button
            variant={action.variant || 'primary'}
            size="md"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   ERROR STATE — CampusOS Design System Component
   
   Shown when a page fails to load. Always provides "Try Again".
   ═══════════════════════════════════════════════════════════════════ */

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  description = 'We could not load this page. Check your connection and try again.',
  onRetry,
  className,
  compact = false,
}) => {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        className
      )}
    >
      <div className="mb-4 w-12 h-12 rounded-xl bg-danger-light flex items-center justify-center text-danger">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className={clsx('font-semibold text-foreground', compact ? 'text-card-title' : 'text-section-title')}>
        {title}
      </h3>
      <p className="mt-1.5 text-body text-muted-foreground max-w-sm">{description}</p>
      {onRetry && (
        <div className="mt-4">
          <Button variant="secondary" size="md" onClick={onRetry} leftIcon={<RefreshCw />}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   LOADING STATE — CampusOS Design System Component
   
   Full page or section loading indicator with skeleton.
   ═══════════════════════════════════════════════════════════════════ */

export interface LoadingStateProps {
  message?: string;
  className?: string;
  compact?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  className,
  compact = false,
}) => {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        className
      )}
    >
      <div className="mb-3">
        <svg
          className="w-6 h-6 animate-spin text-primary"
          viewBox="0 0 24 24"
          fill="none"
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
      </div>
      <p className="text-body text-muted-foreground">{message}</p>
    </div>
  );
};

EmptyState.displayName = 'EmptyState';
ErrorState.displayName = 'ErrorState';
LoadingState.displayName = 'LoadingState';
