import React from 'react';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Rendering Error in Equity Arena:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleLogout = () => {
    localStorage.removeItem('ignite_token');
    localStorage.removeItem('ignite_user');
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen theme-bg-main theme-text-main flex items-center justify-center p-4">
          <div className="max-w-md w-full theme-bg-card p-8 rounded-[6px] border border-[color-mix(in_srgb,var(--loss-red)_40%,transparent)] shadow-2xl space-y-6 text-center">
            
            <div className="inline-flex p-3 bg-[color-mix(in_srgb,var(--loss-red)_10%,transparent)] border border-[color-mix(in_srgb,var(--loss-red)_30%,transparent)] rounded-[4px] text-[var(--loss-red)]">
              <AlertTriangle className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <h2 className="text-lg font-bold font-heading uppercase text-[var(--loss-red)]">
                TERMINAL RENDER EXCEPTION
              </h2>
              <p className="text-xs theme-text-muted mt-2 font-medium">
                A non-fatal rendering error occurred in the trading interface.
              </p>
            </div>

            <div className="p-3 theme-bg-panel rounded-[4px] border theme-border text-left font-mono text-[11px] theme-text-dim overflow-x-auto max-h-32">
              {this.state.error?.message || 'Unknown Exception'}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 bg-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_90%,transparent)] text-slate-950 font-heading font-extrabold text-xs rounded-[4px] shadow transition-all flex items-center justify-center gap-1.5 min-h-[40px] btn-terminal"
              >
                <RefreshCw className="w-4 h-4" />
                <span>RELOAD TERMINAL</span>
              </button>

              <button
                onClick={this.handleLogout}
                className="py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-heading font-bold text-xs rounded-[4px] transition-all flex items-center justify-center gap-1.5 min-h-[40px] btn-terminal"
              >
                <LogOut className="w-4 h-4" />
                <span>RE-AUTHENTICATE</span>
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
