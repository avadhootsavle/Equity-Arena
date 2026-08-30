import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AnimatedNumber } from './AnimatedNumber';
import { isSoundMuted, toggleSoundMute } from '../services/soundService';
import {
  Search,
  Wallet,
  Volume2,
  VolumeX,
  HelpCircle,
  LogOut,
  BookOpen,
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
        {/* Brand / Exchange Status Badge */}
        <div className="flex items-center gap-2">
          <img src="/vite.svg" alt="Equity Arena Logo" className="w-6 h-6 rounded-md shrink-0" />
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#F0B429]">
            EQUITY ARENA · LIVE EXCHANGE
          </span>
        </div>

        <div className="flex-1" />

        {/* Market open / closed */}
        <div
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[12px] font-medium"
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
          className="flex items-center gap-1.5 px-3 h-[34px] rounded-md border transition-all"
          style={{
            borderColor: 'color-mix(in srgb, var(--accent) 28%, transparent)',
            backgroundColor: 'color-mix(in srgb, var(--accent) 9%, transparent)'
          }}
          title={lockedFunds > 0 ? `${fmtMoney(lockedFunds)} IC reserved in open orders` : 'Available cash'}
        >
          <Wallet className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent)' }} />
          <span
            className="text-[15px] font-mono font-semibold whitespace-nowrap"
            style={{ color: 'var(--accent)' }}
          >
            <AnimatedNumber value={walletBalance} decimals={2} duration={500} suffix=" IC" />
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

        {/* Trader's Manual — reopens guide after first login */}
        {onOpenTour && (
          <button
            type="button"
            onClick={onOpenTour}
            title="Open the Trader's Manual"
            aria-label="Open the Trader's Manual"
            className="flex w-[32px] h-[32px] rounded-md border items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            style={{
              color: 'var(--accent)',
              borderColor: 'color-mix(in srgb, var(--accent) 38%, transparent)',
              backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)'
            }}
          >
            <BookOpen className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Theme */}
        <ThemeToggle />

        {/* User */}
        <div className="flex items-center gap-2 pl-2.5 ml-0.5 border-l theme-border">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center font-mono font-black text-xs shadow-sm flex-shrink-0"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent) 18%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent) 38%, transparent)',
              color: 'var(--accent)'
            }}
            title={user?.name || user?.email || 'Trader'}
          >
            {(user?.name?.[0] || user?.email?.[0] || 'T').toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-[11px] font-bold theme-text-main leading-tight max-w-[110px] truncate">
              {user?.name || user?.email?.split('@')[0] || 'Trader'}
            </div>
            <div className="text-[9px] theme-text-dim font-mono leading-tight flex items-center gap-0.5">
              {user?.role === 'ADMIN' && <ShieldCheck className="w-2.5 h-2.5" />}
              {user?.role === 'ADMIN' ? 'Admin' : 'Trader'}
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Log out"
            aria-label="Log out"
            className="w-[32px] h-[32px] rounded-md border theme-border theme-bg-input flex items-center justify-center transition-colors hover:brightness-110 ml-1"
            style={{ color: 'var(--loss-red)' }}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
