import React from 'react';
import { ErrorState } from '../../design-system/components/ErrorState';
import type { AppErrorView } from '../../shared/errors/app-error';

export interface AppErrorStateProps {
  error: AppErrorView;
  onRetry?: () => void;
  onBack?: () => void;
}

export const AppErrorState: React.FC<AppErrorStateProps> = ({ error, onRetry, onBack }) => (
  <ErrorState
    title={error.title}
    message={error.message}
    errorId={error.requestId}
    onRetry={error.canRetry ? onRetry : undefined}
    onBack={onBack}
  />
);

export default AppErrorState;
