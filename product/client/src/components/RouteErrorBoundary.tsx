import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppIcon } from '../design-system/icons/AppIcon';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class RouteErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CampusOS Route Error Caught:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
            <AppIcon name="RefreshCw" size={28} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Unable to Load Module</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mb-4">
            This module encountered an issue while rendering. You can retry or return to your dashboard.
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Retry Module
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
