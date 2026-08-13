import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppIcon } from '../design-system/icons/AppIcon';

interface Props {
  children: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
}

export class ModuleErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Module [${this.props.moduleName || 'Widget'}] Error Caught:`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-slate-900 dark:text-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AppIcon name="AlertTriangle" size={20} className="text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold">{this.props.moduleName || 'Section'} Unavailable</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Failed to load this section.</div>
            </div>
          </div>
          <button
            onClick={this.handleRetry}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 hover:bg-rose-200 transition-colors shrink-0"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
