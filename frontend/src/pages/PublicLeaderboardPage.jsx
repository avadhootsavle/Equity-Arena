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
      className="min-h-screen bg-[#080B10] text-[#F0F2FF] p-4 sm:p-8 font-sans selection:bg-[#F0B429] selection:text-black flex flex-col justify-between relative"
      style={{
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}
    >
      {/* 3px Top Trophy Accent Line */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#F0B429] via-[#EAB308] to-[#F0B429] z-50 shadow-[0_0_12px_#F0B429]" />

      <div>
        {/* TOP BRAND & LIVE BAR */}
        <div className="max-w-6xl mx-auto pt-2 pb-6 flex items-center justify-between">
          <div className="text-[14px] font-mono font-bold uppercase tracking-[0.2em] text-[#F0B429] flex items-center gap-2">
            <img src="/vite.svg" alt="Equity Arena Logo" className="w-6 h-6 rounded-md shrink-0" />
            <span>EQUITY ARENA</span>
          </div>

          <div className="px-3 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#4ADE80] text-[12px] font-mono font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span>LIVE</span>
          </div>
        </div>

        {/* HERO HEADER SECTION */}
        <header className="max-w-6xl mx-auto text-center mb-10 space-y-3">
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white drop-shadow-lg">
            LIVE LEADERBOARD
          </h1>
          <p className="text-[16px] text-[#7B82A0] font-normal">
            IGNITE 8.0 — India Stock Exchange
          </p>

          {/* SESSION COUNTDOWN TIMER */}
          {isSessionActive && (
            <div className="pt-2 flex justify-center">
              <div className="bg-[#0D1117]/80 backdrop-blur-md border border-[#2D3142] px-6 py-2 rounded-2xl shadow-2xl">
                <GameClock sessionData={session} size="lg" title="SESSION TIME REMAINING" />
              </div>
            </div>
          )}
        </header>

        {/* MAIN LEADERBOARD TABLE */}
        {/* MAIN LEADERBOARD SHOWCASE */}
        <main className="max-w-5xl mx-auto">
          {loading ? (
            <div className="py-32 text-center font-mono text-[#7B82A0] animate-pulse text-xl">
              Loading live tournament standings...
            </div>
          ) : !isSessionActive && leaderboard.length === 0 ? (
            <div className="py-20 text-center bg-[#11141D] border border-[#2D3142] rounded-3xl p-12 shadow-2xl my-8">
              <div className="text-5xl mb-4 text-[#F0B429]">⏳</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Waiting for the session to start
              </h2>
              <p className="text-sm font-mono text-[#7B82A0]">
                The standings table will update live as soon as trading begins.
              </p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="py-24 text-center bg-[#11141D]/60 border border-[#2D3142] rounded-3xl p-10">
              <span className="text-[#7B82A0] font-mono text-sm">No active participants on leaderboard yet.</span>
            </div>
          ) : (
            /* GRAND CHAMPION PODIUM (#1 ONLY SHOWCASE) */
            (() => {
              const top1 = leaderboard[0];
              const isPositive = (top1.returnPercent || 0) > 0;
              const isNegative = (top1.returnPercent || 0) < 0;
              const profitDelta = (top1.totalValue || 0) - 20000;

              return (
                <div className="relative my-4 sm:my-8">
                  {/* Atmospheric Stage Glow */}
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[600px] h-[340px] bg-gradient-to-b from-[#F0B429]/25 via-[#F0B429]/8 to-transparent rounded-full blur-3xl pointer-events-none" />
                  
                  {/* Main Champion Card with Gold Shimmer Border */}
                  <div className="relative rounded-3xl p-[2px] bg-gradient-to-b from-[#F0B429] via-[#FBBF24]/50 to-[#2D3142]/60 shadow-[0_24px_80px_rgba(0,0,0,0.8),0_0_50px_rgba(240,180,41,0.25)] overflow-hidden">
                    <div className="bg-[#0E121B]/95 backdrop-blur-2xl rounded-[22px] p-6 sm:p-12 relative overflow-hidden">
                      
                      {/* Subtle Watermark in Background */}
                      <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none select-none text-[220px] font-black text-white leading-none">
                        #1
                      </div>

                      {/* Top Podium Ribbon */}
                      <div className="flex items-center justify-between gap-4 border-b border-[#21262D] pb-6 mb-8 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="relative flex items-center justify-center">
                            <span className="absolute -inset-1 rounded-full bg-[#F0B429]/40 blur-sm animate-pulse" />
                            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#F0B429] to-[#FDE047] flex items-center justify-center shadow-lg">
                              <Crown className="w-6 h-6 text-black" />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-black tracking-[0.25em] text-[#F0B429] uppercase">
                                TOURNAMENT LEADER
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 font-mono">
                                LIVE #1 RANK
                              </span>
                            </div>
                            <span className="text-xs text-[#8B949E] font-mono">
                              Current highest tournament net worth
                            </span>
                          </div>
                        </div>

                        {/* Return Badge */}
                        <div className="flex items-center gap-2">
                          <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-mono font-bold text-sm ${
                            isPositive
                              ? 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30'
                              : isNegative
                              ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                              : 'bg-[#2D3142]/40 text-[#8B949E] border-[#2D3142]'
                          }`}>
                            <span className="text-base">{isPositive ? '▲' : isNegative ? '▼' : '•'}</span>
                            <span>{isPositive ? '+' : ''}{(top1.returnPercent || 0).toFixed(2)}% Session Return</span>
                          </div>
                        </div>
                      </div>

                      {/* Main Hero: Big Crown & Leader Name */}
                      <div className="text-center py-4 space-y-3">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F0B429]/10 border border-[#F0B429]/30 text-[#F0B429] font-mono text-xs font-bold uppercase tracking-widest">
                          ★ CHAMPION STANDING ★
                        </div>
                        <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
                          {top1.name}
                        </h2>
                        {top1.email && (
                          <p className="text-xs sm:text-sm font-mono text-[#8B949E]">
                            Registered Trader ID: <span className="text-slate-300 font-semibold">{top1.email}</span>
                          </p>
                        )}
                      </div>

                      {/* Big Prominent Net Worth Display */}
                      <div className="mt-8 pt-8 border-t border-[#21262D] grid grid-cols-1 sm:grid-cols-3 gap-4">
                        
                        {/* Box 1: Total Portfolio Value */}
                        <div className="p-5 rounded-2xl bg-[#161B22]/80 border border-[#2D3142] text-center sm:text-left shadow-inner">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-[#8B949E] block mb-1">
                            TOTAL PORTFOLIO NET WORTH
                          </span>
                          <div className="text-3xl sm:text-4xl font-mono font-black text-[#F0B429] tracking-tight">
                            {top1.totalValue.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                            <span className="text-sm font-normal text-slate-400 ml-1.5">IC</span>
                          </div>
                        </div>

                        {/* Box 2: Profit / Loss Difference */}
                        <div className="p-5 rounded-2xl bg-[#161B22]/80 border border-[#2D3142] text-center sm:text-left shadow-inner">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-[#8B949E] block mb-1">
                            NET GAIN / DEFICIT
                          </span>
                          <div className={`text-3xl sm:text-4xl font-mono font-black tracking-tight ${
                            profitDelta > 0
                              ? 'text-[#22C55E]'
                              : profitDelta < 0
                              ? 'text-[#EF4444]'
                              : 'text-white'
                          }`}>
                            {profitDelta > 0 ? '+' : ''}
                            {profitDelta.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                            <span className="text-sm font-normal text-slate-400 ml-1.5">IC</span>
                          </div>
                        </div>

                        {/* Box 3: Performance Rank Status */}
                        <div className="p-5 rounded-2xl bg-[#161B22]/80 border border-[#2D3142] text-center sm:text-left shadow-inner flex flex-col justify-center">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-[#8B949E] block mb-1">
                            PODIUM BENCHMARK
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl sm:text-3xl font-mono font-black text-white">
                              #1 of {leaderboard.length}
                            </span>
                            <span className="text-xs font-mono font-bold text-[#F0B429] uppercase px-2 py-0.5 rounded bg-[#F0B429]/15 border border-[#F0B429]/30">
                              DEFENDING
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
      </div>

      {/* BOTTOM WATERMARK STRIP */}
      <footer className="mt-16 pt-6 border-t border-[#1F2432] text-center font-mono text-[12px] text-[#333333] max-w-6xl mx-auto w-full tracking-widest uppercase">
        EQUITY ARENA · IGNITE 8.0 · Powered by Kalkulus Securytas
      </footer>
    </div>
  );
}
