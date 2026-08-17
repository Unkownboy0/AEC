import React from 'react';
import { CheckCircle2, AlertCircle, Inbox, ShieldAlert, ArrowLeft } from 'lucide-react';

export const ApprovalEmptyState: React.FC<{
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}> = ({
  title = 'No pending approvals',
  description = 'All requests in this view have been processed or none have been submitted yet.',
  actionText,
  onAction,
}) => {
  return (
    <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 flex items-center justify-center mx-auto">
        <Inbox className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-xs text-gray-500 max-w-sm mx-auto">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-xs font-bold shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export const ApprovalErrorState: React.FC<{
  error?: string | null;
  onRetry?: () => void;
  onBack?: () => void;
}> = ({
  error = 'Failed to load approval request',
  onRetry,
  onBack,
}) => {
  return (
    <div className="p-8 text-center bg-white dark:bg-gray-900 rounded-3xl border border-red-100 dark:border-red-900/40 shadow-sm space-y-4 max-w-md mx-auto my-8">
      <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950 text-red-600 flex items-center justify-center mx-auto">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Unable to Display Request</h3>
        <p className="text-xs text-gray-500 mt-1">{error}</p>
      </div>
      <div className="flex items-center justify-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300"
          >
            Go Back
          </button>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export const ApprovalSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-16 h-5 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="w-32 h-5 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
            <div className="w-20 h-6 bg-gray-200 dark:bg-gray-800 rounded-full" />
          </div>
          <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="w-1/2 h-3 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
      ))}
    </div>
  );
};
