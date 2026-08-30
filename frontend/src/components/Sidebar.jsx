import React from 'react';
import { useSocket } from '../context/SocketContext';
import {
  LayoutDashboard,
  Wallet,
  ClipboardList,
  Newspaper,
  TrendingUp
} from 'lucide-react';

export const NAV_ITEMS = [
  { key: 'DASHBOARD', label: 'Market', Icon: LayoutDashboard },
  { key: 'PORTFOLIO', label: 'My Stocks', Icon: Wallet },
  { key: 'ORDERS', label: 'Limit Orders', Icon: ClipboardList },
  { key: 'NEWS', label: 'News', Icon: Newspaper }
];

export function Sidebar({ activeTab, setActiveTab, counts = {} }) {
  const { isConnected } = useSocket();

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[208px] flex-col border-r theme-border theme-bg-rail z-30">
      {/* Brand */}
      <div className="px-4 py-4 border-b theme-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 overflow-hidden">
            <img src="/vite.svg" alt="Equity Arena Logo" className="w-8 h-8 object-cover" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold uppercase tracking-[0.08em] theme-text-main leading-tight">
              Equity Arena
            </h1>
            <p className="text-[11px] theme-text-dim font-mono leading-tight">
              India Stock Exchange
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ key, label, Icon }) => {
          const active = activeTab === key;
          const badge = counts[key];

          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              aria-current={active ? 'page' : undefined}
              className={`relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[15px] transition-all group ${
                active
                  ? 'theme-text-main font-semibold'
                  : 'theme-text-muted font-medium hover:theme-text-main hover:theme-bg-card-hover'
              }`}
              style={
                active
                  ? {
                      backgroundColor:
                        'color-mix(in srgb, var(--accent) 15%, transparent)',
                      color: 'var(--accent)',
                      border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)'
                    }
                  : undefined
              }
            >
              {/* Active rail indicator */}
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-200"
                style={{
                  height: active ? '70%' : '0%',
                  backgroundColor: 'var(--accent)'
                }}
              />
              <Icon
                className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110"
                style={{ color: active ? 'var(--accent)' : 'var(--text-dim)' }}
              />
              <span className="flex-1 text-left">{label}</span>

              {badge > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold"
                  style={{
                    backgroundColor:
                      'color-mix(in srgb, var(--accent) 20%, transparent)',
                    color: 'var(--accent)'
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Connection status indicator (only shown if disconnected) */}
      {!isConnected && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono rounded bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Reconnecting to market...</span>
          </div>
        </div>
      )}
    </aside>
  );
}

/** Fixed bottom navigation for viewports below the lg breakpoint. */
export function MobileNav({ activeTab, setActiveTab, counts = {} }) {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t theme-border theme-bg-rail flex items-stretch">
      {NAV_ITEMS.map(({ key, label, Icon }) => {
        const active = activeTab === key;
        const badge = counts[key];

        return (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            aria-current={active ? 'page' : undefined}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[52px] relative transition-colors"
            style={{ color: active ? 'var(--accent)' : 'var(--text-dim)' }}
          >
            <Icon className="w-[18px] h-[18px]" />
            <span className="text-[9.5px] font-bold">{label}</span>
            {badge > 0 && (
              <span
                className="absolute top-1.5 right-[22%] px-1 rounded text-[8px] font-mono font-bold"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--bg-main)'
                }}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
