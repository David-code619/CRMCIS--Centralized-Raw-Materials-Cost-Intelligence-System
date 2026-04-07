import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6 text-center">
          <div className="max-w-md w-full bg-surface p-8 rounded-3xl shadow-xl border border-border">
            <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-danger" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">Something went wrong</h2>
            <p className="text-text-secondary mt-2 text-sm">
              An unexpected error occurred in the application.
            </p>
            <div className="mt-4 p-3 bg-background rounded-xl border border-border text-left">
              <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Error Details</p>
              <p className="text-xs font-mono text-danger break-all">
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-8 stitch-button-primary w-full flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
