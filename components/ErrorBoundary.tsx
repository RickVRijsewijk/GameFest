'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

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
      let errorMessage = 'Er is een onverwachte fout opgetreden.';
      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.error.includes('Missing or insufficient permissions')) {
            errorMessage = 'Je hebt geen toegang tot deze gegevens. Log in met een admin account.';
          }
        }
      } catch (e) {
        // Not a JSON error message
        if (this.state.error?.message?.includes('Missing or insufficient permissions')) {
          errorMessage = 'Je hebt geen toegang tot deze gegevens. Log in met een admin account.';
        }
      }

      return (
        <div className="min-h-screen bg-[#0a0514] flex items-center justify-center p-6">
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Toegang Geweigerd</h2>
            <p className="text-purple-200/60 mb-6">{errorMessage}</p>
            <button 
              onClick={() => window.location.href = '/admin/login'}
              className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium transition-colors"
            >
              Naar Login
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
