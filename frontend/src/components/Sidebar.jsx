import React from 'react';
import { useSocket } from '../context/SocketContext';
import {
  LayoutDashboard,
  ClipboardList,
  Newspaper,
  TrendingUp,
  Trophy
} from 'lucide-react';

export const NAV_ITEMS = [
  { key: 'DASHBOARD', label: 'Dashboard', Icon: LayoutDashboard },
  { key: 'ORDERS', label: 'Orders', Icon: ClipboardList },
  { key: 'NEWS', label: 'News', Icon: Newspaper }
];

export function Sidebar({ activeTab, setActiveTab, counts = {} }) {
  const { isConnected } = useSocket();

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[208px] flex-col border-r theme-border theme-bg-rail z-30">
      {/* Brand */}
      <div className="px-4 py-4 border-b theme-border">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent) 14%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent) 34%, transparent)',
              color: 'var(--accent)'
            }}
          >
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[13px] font-heading font-extrabold uppercase tracking-[0.08em] theme-text-main leading-tight">
              Equity Arena
            </h1>
            <p className="text-[9px] theme-text-dim font-mono leading-tight">
              India Stock Exchange
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ key, label, Icon }) => {
          const active = activeTab === key;
          const badge = counts[key];

          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              aria-current={active ? 'page' : undefined}
              className={`relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] font-medium transition-all group ${
                active
                  ? 'theme-text-main'
                  : 'theme-text-muted hover:theme-text-main hover:theme-bg-card-hover'
              }`}
              style={
                active
                  ? {
                      backgroundColor:
                        'color-mix(in srgb, var(--accent) 11%, transparent)'
                    }
                  : undefined
              }
            >
              {/* Active rail indicator */}
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] rounded-r-full transition-all duration-200"
                style={{
                  height: active ? '60%' : '0%',
                  backgroundColor: 'var(--accent)'
                }}
              />
              <Icon
                className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110"
                style={active ? { color: 'var(--accent)' } : undefined}
              />
              <span className="flex-1 text-left">{label}</span>

              {badge > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold"
                  style={{
                    backgroundColor:
                      'color-mix(in srgb, var(--accent) 16%, transparent)',
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

      {/* Footer: connection + house tip */}
      <div className="px-2.5 pb-3 space-y-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono">
          <span
            className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'animate-live-pulse' : ''}`}
            style={{
              backgroundColor: isConnected ? 'var(--gain-green)' : 'var(--loss-red)',
              color: isConnected ? 'var(--gain-green)' : 'var(--loss-red)'
            }}
          />
          <span className="theme-text-dim">
            {isConnected ? 'Live book connected' : 'Reconnecting…'}
          </span>
        </div>

        <div className="surface-panel px-3 py-2.5">
          <div
            className="flex items-center gap-1.5 text-[10px] font-heading font-bold uppercase tracking-wider"
            style={{ color: 'var(--accent)' }}
          >
            <Trophy className="w-3 h-3" />
            Trade. Climb. Win.
          </div>
          <p className="text-[9.5px] theme-text-dim leading-snug mt-1">
            One session, one shot. Every fill moves you up or down the board.
          </p>
        </div>
      </div>
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
            <span className="text-[9.5px] font-medium">{label}</span>
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
