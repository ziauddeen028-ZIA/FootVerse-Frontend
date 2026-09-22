import React, { Component } from 'react';
import { AlertTriangle, RotateCcw, Home, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log error for diagnostics
    console.error('FootVerse ErrorBoundary caught an unhandled render error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetErrorBoundary: this.handleReset
        });
      }

      const isInline = this.props.inline;

      return (
        <div className={`flex items-center justify-center p-4 sm:p-6 ${
          isInline ? 'min-h-[300px] w-full' : 'min-h-[70vh] w-full'
        }`}>
          <div className="saas-card max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-red-500/20 dark:border-red-500/30 shadow-2xl bg-white dark:bg-[#101C14] text-center space-y-6">
            
            {/* Error Icon Badge */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
            </div>

            {/* Error Title & Description */}
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                Application Notice
              </span>
              <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white pt-1">
                Something Went Wrong
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                An unexpected error occurred while rendering this section. You can try refreshing the view or returning to the homepage.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-green-600/20 transition flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#16261C] dark:hover:bg-[#1E3A29] text-slate-700 dark:text-slate-200 font-semibold rounded-2xl text-xs sm:text-sm border border-slate-200 dark:border-[#1E3A29] transition flex items-center space-x-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#16261C] dark:hover:bg-[#1E3A29] text-slate-700 dark:text-slate-200 font-semibold rounded-2xl text-xs sm:text-sm border border-slate-200 dark:border-[#1E3A29] transition flex items-center space-x-1.5"
              >
                <Home className="w-3.5 h-3.5 text-green-500" />
                <span>Home</span>
              </button>
            </div>

            {/* Collapsible Technical Details (for debugging) */}
            {this.state.error && (
              <div className="pt-2 text-left">
                <button
                  type="button"
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition flex items-center space-x-1 mx-auto"
                >
                  <span>{this.state.showDetails ? 'Hide' : 'Show'} Technical Details</span>
                </button>

                {this.state.showDetails && (
                  <div className="mt-3 p-3 rounded-2xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto max-h-40 border border-slate-800">
                    <p className="text-red-400 font-bold mb-1">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo?.componentStack && (
                      <pre className="text-[10px] text-slate-400 whitespace-pre-wrap leading-tight">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
