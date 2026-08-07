import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  description?: string;
  onRetry?: () => void;
  onBack?: () => void;
  errorId?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to load data',
  message,
  description = 'An unexpected error occurred while fetching information. Please try again.',
  onRetry,
  onBack,
  errorId,
}) => {
  const displayMessage = message || description;
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-xl border border-destructive/20 shadow-sm my-4">
      <div className="p-3 bg-destructive/10 text-destructive rounded-full mb-3">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-md">{displayMessage}</p>
      {errorId && (
        <span className="text-[10px] font-mono text-muted-foreground/70 mt-2">
          Ref ID: {errorId}
        </span>
      )}
      <div className="flex items-center gap-3 mt-4">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Go Back
          </button>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
};
