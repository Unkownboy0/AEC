import React from 'react';
import { AlertTriangle, WifiOff, Lock, ShieldAlert, RefreshCw } from 'lucide-react';
import { NormalizedApiError } from '../../shared/api/api-types';

interface MobileErrorStateProps {
  error?: NormalizedApiError | Error | null;
  onRetry?: () => void;
  title?: string;
  message?: string;
  className?: string;
}

export const MobileErrorState: React.FC<MobileErrorStateProps> = ({
  error,
  onRetry,
  title,
  message,
  className = '',
}) => {
  const normError = error as NormalizedApiError | undefined;
  const code = normError?.code;

  let Icon = AlertTriangle;
  let defaultTitle = 'CampusOS Information Error';
  let defaultMessage = 'CampusOS could not load this information. Try again.';

  if (code === 'OFFLINE' || code === 'NETWORK_ERROR') {
    Icon = WifiOff;
    defaultTitle = 'Connection Unavailable';
    defaultMessage = 'Unable to connect to CampusOS. Check your internet connection.';
  } else if (code === 'UNAUTHORIZED') {
    Icon = Lock;
    defaultTitle = 'Session Expired';
    defaultMessage = 'Your session has expired. Please sign in again.';
  } else if (code === 'FORBIDDEN') {
    Icon = ShieldAlert;
    defaultTitle = 'Access Denied';
    defaultMessage = 'You do not have access to view or perform this action.';
  } else if (code === 'NOT_FOUND') {
    defaultTitle = 'Record Not Found';
    defaultMessage = 'The requested resource could not be found on CampusOS.';
  }

  const finalTitle = title || normError?.message || defaultTitle;
  const finalMessage = message || (normError?.message !== finalTitle ? normError?.message : undefined) || defaultMessage;

  return (
    <div className={`p-6 my-4 text-center rounded-2xl bg-slate-900/60 border border-slate-800 ${className}`}>
      <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-100 mb-1">{finalTitle}</h3>
      <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">{finalMessage}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl border border-amber-500/20 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};
