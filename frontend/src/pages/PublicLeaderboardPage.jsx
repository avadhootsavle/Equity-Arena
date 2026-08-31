import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { Crown } from 'lucide-react';
import { apiFetch } from '../services/api';
import { GameClock } from '../components/GameClock';

export function PublicLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const prevRankMap = useRef(new Map());

  // Set document page title
  useEffect(() => {
    document.title = 'Equity Arena — Live Leaderboard';
  }, []);

  // Process & deduplicate leaderboard entries by ID/name
  const processLeaderboard = useCallback((data) => {
    if (!Array.isArray(data)) return [];

    // Deduplicate by id (or fallback to name)
    const map = new Map();
    data.forEach((item) => {
      const key = item.id || item.name;
      if (!map.has(key)) {
        map.set(key, item);
      }
    });

    const unique = Array.from(map.values());
    unique.sort((a, b) => b.totalValue - a.totalValue);

    return unique.map((item, idx) => {
      const currentRank = idx + 1;
      const key = item.id || item.name;
      const prevRank = prevRankMap.current.get(key);

      let rankChange = 0; // 0: same, >0: moved up, <0: moved down
      if (prevRank !== undefined) {
        if (currentRank < prevRank) rankChange = 1; // moved up
        else if (currentRank > prevRank) rankChange = -1; // moved down
      }
      prevRankMap.current.set(key, currentRank);

      return {
        ...item,
        rank: currentRank,
        rankChange
      };
    });
  }, []);

  // Fetch initial public leaderboard data & session state
  const fetchPublicData = useCallback(async () => {
    try {
      const [lbData, sessionData] = await Promise.all([
        apiFetch('/leaderboard/public'),
        apiFetch('/session').catch(() => null)
      ]);

      if (Array.isArray(lbData)) {
        setLeaderboard(processLeaderboard(lbData));
      }
      if (sessionData) {
        setSession(sessionData);
      }
    } catch (err) {
      console.error('Failed to fetch public leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [processLeaderboard]);

  useEffect(() => {
    fetchPublicData();
  }, [fetchPublicData]);

  // Connect to public read-only socket room
  useEffect(() => {
    const targetUrl =
      import.meta.env.VITE_API_URL ||
      (typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname}:5001`
        : '/');

    const socket = io(targetUrl, {
      auth: { isPublic: true },
      query: { isPublic: 'true' },
      reconnection: true,
      transports: ['websocket', 'polling']
    });

    socket.on('leaderboard:update', (updatedLb) => {
      if (Array.isArray(updatedLb)) {
        setLeaderboard(processLeaderboard(updatedLb));
      }
    });

    const refreshSession = async () => {
      try {
        const sData = await apiFetch('/session');
        if (sData) setSession(sData);
      } catch (e) {
        // Silent session refresh fallback
      }
    };

    socket.on('session:started', refreshSession);
    socket.on('session:paused', refreshSession);
    socket.on('session:resumed', refreshSession);
    socket.on('session:ended', refreshSession);

    const interval = setInterval(refreshSession, 15000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [processLeaderboard]);

  const isSessionActive = session?.status === 'ACTIVE' || session?.status === 'PAUSED';

  return (
    <div
      className="h-screen w-screen overflow-hidden bg-[#07090E] text-[#F0F2FF] font-sans selection:bg-[#E23636] selection:text-white flex flex-col justify-between relative px-6 py-4 sm:px-12 sm:py-6"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 10%, rgba(226, 54, 54, 0.18) 0%, transparent 50%),
          radial-gradient(circle at 10% 90%, rgba(26, 115, 232, 0.15) 0%, transparent 45%),
          radial-gradient(circle at 90% 90%, rgba(226, 54, 54, 0.12) 0%, transparent 45%),
          linear-gradient(rgba(226, 54, 54, 0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(226, 54, 54, 0.04) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 100% 100%, 100% 100%, 36px 36px, 36px 36px'
      }}
    >
      {/* Top Spider-Verse Cyber Laser Line */}
      <div className="fixed top-0 left-0 right-0 h-[3.5px] bg-gradient-to-r from-[#E23636] via-[#1A73E8] to-[#E23636] z-50 shadow-[0_0_20px_#E23636]" />

      {/* Subtle Spider-Web SVG Background Graphic */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.07] stroke-[#E23636]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50%" cy="45%" r="140" fill="none" strokeWidth="1.5" strokeDasharray="6 4" />
        <circle cx="50%" cy="45%" r="280" fill="none" strokeWidth="1.5" strokeDasharray="6 4" />
        <circle cx="50%" cy="45%" r="440" fill="none" strokeWidth="1" strokeDasharray="8 6" />
        <circle cx="50%" cy="45%" r="620" fill="none" strokeWidth="0.8" strokeDasharray="10 8" />
        <line x1="50%" y1="45%" x2="0%" y2="0%" strokeWidth="1" />
        <line x1="50%" y1="45%" x2="100%" y2="0%" strokeWidth="1" />
        <line x1="50%" y1="45%" x2="0%" y2="100%" strokeWidth="1" />
        <line x1="50%" y1="45%" x2="100%" y2="100%" strokeWidth="1" />
        <line x1="50%" y1="45%" x2="50%" y2="0%" strokeWidth="1" />
        <line x1="50%" y1="45%" x2="50%" y2="100%" strokeWidth="1" />
        <line x1="50%" y1="45%" x2="0%" y2="45%" strokeWidth="1" />
        <line x1="50%" y1="45%" x2="100%" y2="45%" strokeWidth="1" />
      </svg>

      {/* TOP COMPACT HUD: BRAND + TITLE + CLOCK (Zero Vertical Waste) */}
      <header className="relative z-10 flex items-center justify-between gap-4 border-b border-[#E23636]/25 pb-3 shrink-0">
        {/* Left: Spider Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E23636] to-[#B91C1C] p-0.5 shadow-[0_0_15px_rgba(226,54,54,0.6)] flex items-center justify-center">
            <span className="text-xl">🕷️</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-black tracking-[0.25em] text-[#E23636] uppercase drop-shadow-[0_0_8px_rgba(226,54,54,0.6)]">
                EQUITY ARENA
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#1A73E8]/20 text-[#60A5FA] border border-[#1A73E8]/40 font-mono">
                SPIDER-VERSE EDITION
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">IGNITE 8.0 · Tournament Floor</span>
          </div>
        </div>

        {/* Center: Hero Heading */}
        <div className="hidden md:flex flex-col items-center">
          <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-wider text-white drop-shadow-[0_0_16px_rgba(226,54,54,0.5)] flex items-center gap-2.5">
            <span className="text-[#E23636]">LIVE</span> LEADERBOARD
          </h1>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.3em]">
            Real-Time Tournament Net Worth
          </span>
        </div>

        {/* Right: Countdown Clock + Live Pill */}
        <div className="flex items-center gap-3">
          {isSessionActive && (
            <div className="bg-[#0B0F19]/90 border border-[#E23636]/30 px-3 py-1 rounded-xl shadow-lg flex items-center gap-2 font-mono">
              <GameClock sessionData={session} size="sm" />
            </div>
          )}
          <div className="px-3 py-1 rounded-full bg-[#E23636]/15 border border-[#E23636]/50 text-[#F87171] text-xs font-mono font-black flex items-center gap-2 shadow-[0_0_12px_rgba(226,54,54,0.4)]">
            <span className="w-2 h-2 rounded-full bg-[#E23636] animate-ping" />
            <span>LIVE</span>
          </div>
        </div>
      </header>

      {/* CENTER STAGE: FIT-TO-SCREEN GRAND SPIDER-MAN CHAMPION PODIUM */}
      <main className="relative z-10 flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full my-auto py-2">
        {loading ? (
          <div className="py-20 text-center font-mono text-[#E23636] animate-pulse text-lg">
            Scanning multi-verse tournament frequencies...
          </div>
        ) : !isSessionActive && leaderboard.length === 0 ? (
          <div className="text-center bg-[#0C101A]/90 border border-[#E23636]/30 rounded-3xl p-8 shadow-2xl">
            <div className="text-5xl mb-3">🕸️</div>
            <h2 className="text-2xl font-bold text-white mb-1">Session Inactive</h2>
            <p className="text-xs font-mono text-slate-400">Standings will broadcast live when trading commences.</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center bg-[#0C101A]/90 border border-[#E23636]/30 rounded-3xl p-8">
            <span className="text-slate-400 font-mono text-xs">Awaiting active participants...</span>
          </div>
        ) : (
          (() => {
            const top1 = leaderboard[0];
            const isPositive = (top1.returnPercent || 0) > 0;
            const isNegative = (top1.returnPercent || 0) < 0;
            const profitDelta = (top1.totalValue || 0) - 20000;

            return (
              <div className="relative w-full">
                {/* Spider Neon Radial Glows */}
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-[580px] h-[300px] bg-gradient-to-b from-[#E23636]/30 via-[#1A73E8]/15 to-transparent rounded-full blur-3xl pointer-events-none" />

                {/* Main Card with Spider-Verse Dual Red/Blue Border */}
                <div className="relative rounded-3xl p-[2px] bg-gradient-to-br from-[#E23636] via-[#1A73E8] to-[#E23636] shadow-[0_0_50px_rgba(226,54,54,0.35),0_20px_60px_rgba(0,0,0,0.85)]">
                  <div className="bg-[#0B0F19]/95 backdrop-blur-2xl rounded-[22px] p-6 sm:p-8 md:p-10 relative overflow-hidden">
                    
                    {/* Giant Translucent Spider / #1 Watermark in background */}
                    <div className="absolute -right-8 -bottom-8 opacity-[0.06] pointer-events-none select-none text-[220px] font-black text-[#E23636] leading-none font-mono">
                      #1
                    </div>

                    {/* Ribbon: Top 1 Crown + Session Return */}
                    <div className="flex items-center justify-between gap-4 border-b border-[#21283B] pb-4 mb-6 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center">
                          <span className="absolute -inset-1 rounded-full bg-[#E23636]/40 blur-sm animate-pulse" />
                          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E23636] to-[#EF4444] flex items-center justify-center shadow-lg text-black">
                            <Crown className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-black tracking-[0.25em] text-[#E23636] uppercase">
                              SUPREME CHAMPION
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-[#1A73E8]/20 text-[#60A5FA] border border-[#1A73E8]/40 font-mono">
                              WEBSLINGER #1
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Highest tournament valuation
                          </span>
                        </div>
                      </div>

                      {/* Session Return Badge */}
                      <div className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 font-mono font-black text-xs ${
                        isPositive
                          ? 'bg-[#22C55E]/15 text-[#4ADE80] border-[#22C55E]/40 shadow-[0_0_12px_rgba(34,197,94,0.25)]'
                          : isNegative
                          ? 'bg-[#EF4444]/15 text-[#F87171] border-[#EF4444]/40 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                          : 'bg-[#1E2538] text-slate-400 border-slate-700'
                      }`}>
                        <span className="text-sm">{isPositive ? '▲' : isNegative ? '▼' : '•'}</span>
                        <span>{isPositive ? '+' : ''}{(top1.returnPercent || 0).toFixed(2)}% Session Return</span>
                      </div>
                    </div>

                    {/* Hero Title: Trader Name */}
                    <div className="text-center py-2 space-y-2">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E23636]/15 border border-[#E23636]/40 text-[#F87171] font-mono text-[11px] font-extrabold uppercase tracking-widest">
                        🕷️ MULTIVERSE #1 RANKING 🕷️
                      </div>
                      <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-[0_4px_24px_rgba(226,54,54,0.6)]">
                        {top1.name}
                      </h2>
                      {top1.email && (
                        <p className="text-xs font-mono text-slate-400">
                          Operative ID: <span className="text-slate-200 font-semibold">{top1.email}</span>
                        </p>
                      )}
                    </div>

                    {/* 3 Prominent Stat Modules */}
                    <div className="mt-6 pt-6 border-t border-[#21283B] grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      
                      {/* Metric 1: Total Portfolio Value */}
                      <div className="p-4 rounded-2xl bg-[#0F1422] border border-[#1A73E8]/30 shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#60A5FA] block mb-1 font-bold">
                          TOTAL PORTFOLIO VALUE
                        </span>
                        <div className="text-2xl sm:text-3xl font-mono font-black text-white tracking-tight drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                          {top1.totalValue.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                          <span className="text-xs font-normal text-[#E23636] ml-1.5 font-bold">IC</span>
                        </div>
                      </div>

                      {/* Metric 2: Net Profit / Loss */}
                      <div className="p-4 rounded-2xl bg-[#0F1422] border border-[#E23636]/30 shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#F87171] block mb-1 font-bold">
                          NET GAIN / DEFICIT
                        </span>
                        <div className={`text-2xl sm:text-3xl font-mono font-black tracking-tight ${
                          profitDelta > 0
                            ? 'text-[#4ADE80] drop-shadow-[0_0_12px_rgba(74,222,128,0.4)]'
                            : profitDelta < 0
                            ? 'text-[#F87171] drop-shadow-[0_0_12px_rgba(248,113,113,0.4)]'
                            : 'text-white'
                        }`}>
                          {profitDelta > 0 ? '+' : ''}
                          {profitDelta.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                          <span className="text-xs font-normal text-slate-400 ml-1.5 font-mono">IC</span>
                        </div>
                      </div>

                      {/* Metric 3: Standing Status */}
                      <div className="p-4 rounded-2xl bg-[#0F1422] border border-[#21283B] flex flex-col justify-center shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1 font-bold">
                          ARENA STANDING
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xl sm:text-2xl font-mono font-black text-white">
                            #1 of {leaderboard.length}
                          </span>
                          <span className="text-[10px] font-mono font-black text-[#E23636] uppercase px-2 py-0.5 rounded bg-[#E23636]/15 border border-[#E23636]/40 shadow-xs">
                            LEADER
                          </span>
                        </div>
                      </div>

                    </div>

                  </div>
                </div>
              </div>
            );
          })()
        )}
      </main>

      {/* COMPACT FOOTER (Always Visible On Big Screens Without Scroll) */}
      <footer className="relative z-10 pt-2 border-t border-[#E23636]/20 flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase tracking-wider shrink-0">
        <span className="text-[#E23636] font-bold">🕸️ EQUITY ARENA · SPIDER-VERSE TOURNAMENT</span>
        <span className="text-slate-400">IGNITE 8.0 · LIVE TICKER ENGINE ACTIVE</span>
      </footer>
    </div>
  );
}
