import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected rendering error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="ne-canvas flex min-h-screen items-center justify-center p-6">
          <div className="ne-surface w-full max-w-md rounded-2xl border p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 dark:border-red-800/40 dark:bg-red-950/50 dark:text-red-400">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="mt-4 font-display text-lg font-bold text-slate-900 dark:text-[#e6edf7]">Something went wrong</h1>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-[#9fb2cc]">
              Northeast Connect encountered an unexpected error. Your saved Outbox items remain stored locally on this device.
            </p>
            {this.state.message && (
              <p className="ne-surface-subtle mt-3 rounded-xl border px-3 py-2 font-mono text-xs text-slate-600 dark:text-[#94a7c4]">
                {this.state.message}
              </p>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="ne-btn-press mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
