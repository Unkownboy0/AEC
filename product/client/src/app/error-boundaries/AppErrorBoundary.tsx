import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught Error in UI component:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-background p-6 text-center">
          <div className="p-4 bg-destructive/10 text-destructive rounded-full mb-4">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Something went wrong</h2>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm">
            {this.state.error?.message || 'An unhandled application error occurred. Refreshing may fix the issue.'}
          </p>
          <button
            onClick={this.handleReload}
            className="mt-6 flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
