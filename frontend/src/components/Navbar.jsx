import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { SessionCountdown } from './SessionCountdown';
import { isSoundMuted, toggleSoundMute } from '../services/soundService';
import {
  TrendingUp, Radio, LogOut, Coins, LayoutDashboard, Newspaper, Sun, Moon, ShieldCheck, Volume2, VolumeX, HelpCircle
} from 'lucide-react';

export function Navbar({ activeTab, setActiveTab, walletBalance, lockedFunds, newsCount, onSessionUpdate, onOpenTour }) {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const [muted, setMuted] = useState(isSoundMuted());

  const handleToggleSound = () => {
    const nextState = toggleSoundMute();
    setMuted(nextState);
  };

  return (
    <>
      {/* Desktop & Tablet Navigation Header */}
      <header className="border-b theme-border theme-bg-panel sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">

            {/* Left: Brand Identifier */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[6px] overflow-hidden flex items-center justify-center shrink-0">
                <img src="/vite.svg" alt="Equity Arena Logo" className="w-8 h-8 object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold tracking-tight theme-text-main font-heading uppercase">
                    EQUITY ARENA
                  </h1>
                  {user?.role === 'ADMIN' && (
                    <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-extrabold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1 font-mono">
                      <ShieldCheck className="w-3 h-3" />
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-[11px] theme-text-muted font-medium">India Stock Exchange Terminal</p>
              </div>
            </div>

            {/* Middle: Active-Tab Indicator */}
            <div className="hidden md:flex bg-slate-900/60 dark:bg-[#0F121A] light:bg-[#E2E0D8] p-1 rounded-[6px] border theme-border">
              <button
                onClick={() => setActiveTab('MARKET')}
                className={`px-4 py-1.5 text-xs font-bold font-heading rounded-[4px] transition-all flex items-center gap-2 ${
                  activeTab === 'MARKET'
                    ? 'bg-[#D4A017] text-slate-950 shadow-sm'
                    : 'theme-text-muted hover:theme-text-main'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Live Exchange & Portfolio</span>
              </button>
              <button
                onClick={() => setActiveTab('NEWS')}
                className={`px-4 py-1.5 text-xs font-bold font-heading rounded-[4px] transition-all flex items-center gap-2 ${
                  activeTab === 'NEWS'
                    ? 'bg-[#D4A017] text-slate-950 shadow-sm'
                    : 'theme-text-muted hover:theme-text-main'
                }`}
              >
                <Newspaper className="w-4 h-4" />
                <span>Analyst Wire Feed</span>
                {newsCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-mono font-extrabold rounded-[3px] bg-slate-950/40 text-slate-900">
                    {newsCount}
                  </span>
                )}
              </button>
            </div>

            {/* Right: Session Timer, Wallet Balance, Theme Toggle, and User Actions */}
            <div className="flex items-center gap-3">
              
              {/* Server-Synced Session Countdown Timer */}
              <SessionCountdown onSessionUpdate={onSessionUpdate} />

              {/* Market Stream Connectivity Pill */}
              <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-[11px] font-mono font-semibold border ${
                isConnected
                  ? 'bg-[#1DB954]/10 border-[#1DB954]/40 text-[#1DB954]'
                  : 'bg-[#E8453C]/10 border-[#E8453C]/40 text-[#E8453C]'
              }`}>
                <Radio className={`w-3.5 h-3.5 ${isConnected ? 'animate-pulse' : ''}`} />
                <span>{isConnected ? 'STREAM ONLINE' : 'OFFLINE'}</span>
              </div>

              {/* Wallet Balance Badge */}
              <div className="px-3 py-1.5 rounded-[6px] bg-[#D4A017]/10 border border-[#D4A017]/30 flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#D4A017] flex-shrink-0" />
                <div>
                  <div className="text-[9px] uppercase font-mono font-bold theme-text-muted tracking-wider">Available Cash</div>
                  <div className="text-xs font-extrabold font-mono text-[#D4A017] whitespace-nowrap">
                    {(walletBalance || 20000).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-[10px]">IC</span>
                    {lockedFunds > 0 && (
                      <span className="text-[9px] text-[#D4A017] font-normal ml-1 border-l theme-border pl-1">
                        ({lockedFunds.toFixed(2)} reserved)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Audio News Chime Mute Button */}
              <button
                onClick={handleToggleSound}
                title={muted ? 'News Audio Muted (Click to Unmute)' : 'News Audio Active (Click to Mute)'}
                className="p-2 rounded-[4px] border theme-border theme-bg-card theme-bg-card-hover theme-text-main transition-all btn-terminal"
              >
                {muted ? (
                  <VolumeX className="w-4 h-4 text-[#E8453C]" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[#1DB954]" />
                )}
              </button>

              {/* Onboarding Guide / Tutorial Button */}
              {onOpenTour && (
                <button
                  onClick={onOpenTour}
                  title="Open Beginner Trading Guide / Tutorial"
                  className="p-2 rounded-[4px] border border-[#D4A017]/40 bg-[#D4A017]/10 hover:bg-[#D4A017]/20 text-[#D4A017] transition-all flex items-center gap-1 text-xs font-heading font-bold btn-terminal"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span className="hidden xl:inline">Guide</span>
                </button>
              )}

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                className="p-2 rounded-[4px] border theme-border theme-bg-card theme-bg-card-hover theme-text-main transition-all btn-terminal"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-[#D4A017]" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-600" />
                )}
              </button>

              {/* User Email & Logout */}
              <div className="hidden sm:flex items-center gap-2.5 border-l theme-border pl-3">
                <span className="text-xs font-medium theme-text-muted max-w-[130px] truncate font-mono">
                  {user?.name || user?.email}
                </span>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border theme-border theme-bg-card hover:bg-rose-500/10 text-rose-400 text-xs font-heading font-bold transition-all btn-terminal"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (< 768px viewports) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t theme-border theme-bg-panel px-4 py-2 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setActiveTab('MARKET')}
          className={`flex flex-col items-center gap-1 p-2 rounded-[4px] text-xs font-bold font-heading transition-all min-h-[44px] min-w-[64px] ${
            activeTab === 'MARKET'
              ? 'text-[#D4A017]'
              : 'theme-text-muted hover:theme-text-main'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Exchange</span>
        </button>

        <button
          onClick={() => setActiveTab('NEWS')}
          className={`flex flex-col items-center gap-1 p-2 rounded-[4px] text-xs font-bold font-heading transition-all min-h-[44px] min-w-[64px] relative ${
            activeTab === 'NEWS'
              ? 'text-[#D4A017]'
              : 'theme-text-muted hover:theme-text-main'
          }`}
        >
          <Newspaper className="w-5 h-5" />
          <span className="text-[10px]">Wire</span>
          {newsCount > 0 && (
            <span className="absolute top-1 right-3 px-1.5 py-0.2 text-[9px] font-mono font-extrabold rounded-full bg-[#D4A017] text-slate-950">
              {newsCount}
            </span>
          )}
        </button>

        <button
          onClick={toggleTheme}
          className="flex flex-col items-center gap-1 p-2 rounded-[4px] text-xs font-bold font-heading theme-text-muted hover:theme-text-main transition-all min-h-[44px] min-w-[64px]"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-[#D4A017]" /> : <Moon className="w-5 h-5 text-indigo-600" />}
          <span className="text-[10px]">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        <button
          onClick={logout}
          className="flex flex-col items-center gap-1 p-2 rounded-[4px] text-xs font-bold font-heading text-rose-400 transition-all min-h-[44px] min-w-[64px]"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px]">Logout</span>
        </button>
      </nav>
    </>
  );
}
