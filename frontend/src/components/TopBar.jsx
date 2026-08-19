import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { isSoundMuted, toggleSoundMute } from '../services/soundService';
import {
  Search,
  Wallet,
  Volume2,
  VolumeX,
  HelpCircle,
  LogOut,
  Sun,
  Moon,
  ShieldCheck,
  X
} from 'lucide-react';

const fmtMoney = (n) =>
  Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

/* ------------------------------------------------------------------
   Segmented light / dark switch
   ------------------------------------------------------------------ */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className="relative flex items-center rounded-md p-0.5 border theme-border"
      style={{ backgroundColor: 'var(--bg-input)' }}
      role="group"
      aria-label="Colour theme"
    >
      {/* Sliding thumb */}
      <span
        className="absolute top-0.5 bottom-0.5 w-[26px] rounded transition-transform duration-250 ease-out"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--accent) 20%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)',
          transform: isDark ? 'translateX(26px)' : 'translateX(0)',
          left: '2px'
        }}
      />

      <button
        type="button"
        onClick={() => isDark && toggleTheme()}
        aria-pressed={!isDark}
        title="Light theme"
        className="relative z-10 w-[26px] h-[24px] flex items-center justify-center rounded transition-colors"
        style={{ color: !isDark ? 'var(--accent)' : 'var(--text-dim)' }}
      >
        <Sun className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => !isDark && toggleTheme()}
        aria-pressed={isDark}
        title="Dark theme"
        className="relative z-10 w-[26px] h-[24px] flex items-center justify-center rounded transition-colors"
        style={{ color: isDark ? 'var(--accent)' : 'var(--text-dim)' }}
      >
        <Moon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------
   Top bar
   ------------------------------------------------------------------ */
export function TopBar({
  searchQuery,
  setSearchQuery,
  walletBalance = 0,
  lockedFunds = 0,
  sessionStatus,
  onOpenTour
}) {
  const { user, logout } = useAuth();
  const [muted, setMuted] = useState(isSoundMuted());
  const searchRef = useRef(null);

  // "/" focuses search, Esc clears it
  useEffect(() => {
    const onKeyDown = (e) => {
      const typingElsewhere =
        e.target instanceof HTMLElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);

      if (e.key === '/' && !typingElsewhere) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        setSearchQuery('');
        searchRef.current?.blur();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setSearchQuery]);

  const marketOpen = sessionStatus === 'ACTIVE';

  return (
    <header className="sticky top-0 z-30 border-b theme-border theme-bg-rail">
      <div className="flex items-center gap-3 px-3 sm:px-5 h-[54px]">
        {/* Search */}
        <div className="relative flex-1 max-w-[320px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 theme-text-dim pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stocks, sectors…"
            aria-label="Search stocks and sectors"
            className="w-full h-[32px] rounded-md border theme-border theme-bg-input pl-8 pr-14 text-[12px] theme-text-main placeholder:theme-text-dim focus:outline-none transition-colors"
            style={{ caretColor: 'var(--accent)' }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border-card)')}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded theme-text-dim hover:theme-text-main"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[9px] font-mono theme-text-dim border theme-border hidden sm:block">
              /
            </kbd>
          )}
        </div>

        <div className="flex-1" />

        {/* Market open / closed */}
        <div
          className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-mono font-bold"
          style={{
            borderColor: `color-mix(in srgb, ${
              marketOpen ? 'var(--gain-green)' : 'var(--loss-red)'
            } 30%, transparent)`,
            backgroundColor: `color-mix(in srgb, ${
              marketOpen ? 'var(--gain-green)' : 'var(--loss-red)'
            } 10%, transparent)`,
            color: marketOpen ? 'var(--gain-green)' : 'var(--loss-red)'
          }}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${marketOpen ? 'animate-live-pulse' : ''}`}
            style={{ backgroundColor: 'currentColor', color: 'currentColor' }}
          />
          {marketOpen ? 'Market open' : 'Market closed'}
        </div>

        {/* Wallet */}
        <div
          className="flex items-center gap-1.5 px-2.5 h-[32px] rounded-md border"
          style={{
            borderColor: 'color-mix(in srgb, var(--accent) 28%, transparent)',
            backgroundColor: 'color-mix(in srgb, var(--accent) 9%, transparent)'
          }}
          title={lockedFunds > 0 ? `${fmtMoney(lockedFunds)} IC reserved in open orders` : 'Available cash'}
        >
          <Wallet className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
          <span
            className="text-[11px] font-mono font-extrabold whitespace-nowrap"
            style={{ color: 'var(--accent)' }}
          >
            {fmtMoney(walletBalance)} <span className="text-[9px]">IC</span>
          </span>
        </div>

        {/* Sound */}
        <button
          type="button"
          onClick={() => setMuted(toggleSoundMute())}
          title={muted ? 'Unmute news audio' : 'Mute news audio'}
          aria-label={muted ? 'Unmute news audio' : 'Mute news audio'}
          className="hidden sm:flex w-[32px] h-[32px] rounded-md border theme-border theme-bg-input items-center justify-center theme-text-muted hover:theme-text-main transition-colors"
        >
          {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Guide */}
        {onOpenTour && (
          <button
            type="button"
            onClick={onOpenTour}
            title="Open the beginner trading guide"
            aria-label="Open the beginner trading guide"
            className="hidden sm:flex w-[32px] h-[32px] rounded-md border theme-border theme-bg-input items-center justify-center theme-text-muted hover:theme-text-main transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Theme */}
        <ThemeToggle />

        {/* User */}
        <div className="flex items-center gap-2 pl-2.5 ml-0.5 border-l theme-border">
          <div className="hidden sm:block text-right">
            <div className="text-[11px] font-medium theme-text-main leading-tight max-w-[110px] truncate">
              {user?.name || user?.email?.split('@')[0] || 'Trader'}
            </div>
            <div className="text-[9px] theme-text-dim font-mono leading-tight flex items-center gap-0.5 justify-end">
              {user?.role === 'ADMIN' && <ShieldCheck className="w-2.5 h-2.5" />}
              {user?.role === 'ADMIN' ? 'Admin' : 'Trader'}
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Log out"
            aria-label="Log out"
            className="w-[32px] h-[32px] rounded-md border theme-border theme-bg-input flex items-center justify-center transition-colors hover:brightness-110"
            style={{ color: 'var(--loss-red)' }}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
