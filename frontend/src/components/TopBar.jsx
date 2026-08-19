import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { isSoundMuted, toggleSoundMute } from '../services/soundService';
import { useSession } from '../hooks/useSession';
import {
  Wallet,
  Volume2,
  VolumeX,
  LogOut,
  Sun,
  Moon,
  Clock,
  LayoutGrid,
  PieChart,
  Newspaper,
  List
} from 'lucide-react';

const fmtMoney = (n) =>
  Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
      className="w-8 h-8 flex items-center justify-center border border-[var(--border)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-none"
    >
      {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
    </button>
  );
}

export function TopBar({
  activeTab = 'DASHBOARD',
  setActiveTab,
  walletBalance = 0
}) {
  const { user, logout } = useAuth();
  const [muted, setMuted] = useState(isSoundMuted());
  const session = useSession();
  const formattedTime = session?.formattedTime || '00:00:00';
  const sessionStatus = session?.status || 'NOT_STARTED';

  const isUrgent = formattedTime !== '00:00:00' && (
    formattedTime.startsWith('00:04') ||
    formattedTime.startsWith('00:03') ||
    formattedTime.startsWith('00:02') ||
    formattedTime.startsWith('00:01')
  );

  const navItems = [
    { id: 'DASHBOARD', label: 'MARKETS', icon: LayoutGrid },
    { id: 'PORTFOLIO', label: 'PORTFOLIO', icon: PieChart },
    { id: 'NEWS', label: 'NEWS', icon: Newspaper },
    { id: 'ORDERS', label: 'ORDERS', icon: List }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-primary)] border-b border-[var(--border)]">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left: Event Branding */}
        <div className="flex items-center gap-2.5">
          <span className="font-syne font-extrabold text-lg tracking-tight text-[var(--text-primary)]">
            EQUITY ARENA
          </span>
          <span className="px-1.5 py-0.5 text-[9.5px] font-mono font-bold uppercase bg-[var(--accent-gold)]/15 text-[var(--accent-gold)] border border-[var(--accent-gold)]/30 rounded-none">
            IGNITE 8.0
          </span>
        </div>

        {/* Center: Tab Navigation (Active tab gets gold bottom border underline) */}
        {setActiveTab && (
          <nav className="hidden md:flex items-center gap-1 h-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`h-full px-3.5 flex items-center gap-1.5 font-sans font-bold text-xs uppercase tracking-wider transition-colors rounded-none relative ${
                    isActive ? 'text-[var(--accent-gold)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent-gold)]" />
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right: Wallet + Timer + Sound + Theme + Logout */}
        <div className="flex items-center gap-3">
          {/* Session Timer Pill */}
          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 border text-xs font-mono font-bold rounded-none ${
            isUrgent ? 'border-[var(--loss)] text-[var(--loss)] animate-urgent-pulse bg-[var(--loss)]/10' : 'border-[var(--border)] text-[var(--accent-gold)] bg-[var(--bg-secondary)]'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{sessionStatus === 'NOT_STARTED' ? 'Waiting for session' : formattedTime}</span>
          </div>

          {/* Wallet Balance */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--accent-gold)] font-mono text-xs font-bold rounded-none">
            <Wallet className="w-3.5 h-3.5" />
            <span>₹ {fmtMoney(walletBalance)}</span>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setMuted(toggleSoundMute())}
            title={muted ? 'Unmute audio' : 'Mute audio'}
            className="w-8 h-8 flex items-center justify-center border border-[var(--border)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-none"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Logout */}
          <button
            type="button"
            onClick={logout}
            title="Log out"
            className="w-8 h-8 flex items-center justify-center border border-[var(--border)] bg-[var(--bg-tertiary)] text-[var(--loss)] hover:bg-[var(--loss)] hover:text-white rounded-none transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
