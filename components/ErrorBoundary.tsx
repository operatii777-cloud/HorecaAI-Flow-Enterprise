
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-8 text-center">
          <div className="bg-red-100 p-6 rounded-full mb-6">
              <AlertTriangle size={64} className="text-red-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Ups! Ceva nu a mers bine.</h1>
          <p className="text-slate-500 mb-8 max-w-md">
            A aparut o eroare neasteptata in acest modul. Datele tale sunt in siguranta.
          </p>
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-left mb-8 w-full max-w-lg overflow-auto max-h-32">
              <code className="text-xs text-red-500 font-mono">
                  {this.state.error?.toString()}
              </code>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg"
          >
            <RefreshCw size={20} /> Reincarca Aplicatia
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
