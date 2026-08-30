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
        <main className="max-w-6xl mx-auto">
          {loading ? (
            <div className="py-24 text-center font-mono text-[#7B82A0] animate-pulse text-xl">
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
          ) : (
            <div className="bg-[#11141D]/90 backdrop-blur-xl border border-[#2D3142] rounded-3xl p-4 sm:p-6 shadow-2xl overflow-hidden">
              
              {/* TABLE COLUMN HEADERS */}
              <div className="grid grid-cols-12 gap-4 pb-4 border-b border-[#2D3142] px-6 font-mono text-[11px] font-semibold text-[#555E78] uppercase tracking-[0.15em]">
                <div className="col-span-2 text-left">RANK</div>
                <div className="col-span-4 text-left">TRADER</div>
                <div className="col-span-3 text-right">PORTFOLIO VALUE</div>
                <div className="col-span-3 text-right">RETURN</div>
              </div>

              {/* SMOOTH ANIMATED ROWS */}
              <div className="space-y-2 mt-3">
                <AnimatePresence initial={false}>
                  {leaderboard.map((item) => {
                    const isRank1 = item.rank === 1;
                    const isRank2 = item.rank === 2;
                    const isRank3 = item.rank === 3;
                    const isPositive = item.returnPercent > 0;
                    const isNegative = item.returnPercent < 0;

                    const rowId = item.id || item.name;

                    return (
                      <motion.div
                        key={rowId}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          backgroundColor:
                            item.rankChange === 1
                              ? 'rgba(34, 197, 94, 0.12)'
                              : item.rankChange === -1
                              ? 'rgba(239, 68, 68, 0.12)'
                              : isRank1
                              ? 'rgba(240, 180, 41, 0.12)'
                              : 'rgba(255, 255, 255, 0.01)'
                        }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                        className={`grid grid-cols-12 gap-4 items-center px-6 py-4 sm:py-5 rounded-2xl transition-all duration-300 group hover:bg-white/[0.03] ${
                          isRank1
                            ? 'border-l-4 border-l-[#F0B429] bg-gradient-to-r from-[#F0B429]/15 via-[#F0B429]/5 to-transparent border border-[#F0B429]/40 text-white shadow-[0_0_30px_-10px_rgba(240,180,41,0.3)]'
                            : isRank2
                            ? 'border-l-4 border-l-[#94A3B8] bg-slate-900/30 border border-slate-700/40 text-white'
                            : isRank3
                            ? 'border-l-4 border-l-[#B87333] bg-amber-950/20 border border-amber-800/30 text-white'
                            : 'border border-[#1F2432] text-[#E2E8F0]'
                        }`}
                      >
                        {/* RANK */}
                        <div className="col-span-2 flex items-center gap-2">
                          <span
                            className={`font-mono font-black ${
                              isRank1
                                ? 'text-[32px] text-[#F0B429] drop-shadow-[0_0_12px_rgba(240,180,41,0.6)]'
                                : isRank2
                                ? 'text-[24px] text-[#94A3B8]'
                                : isRank3
                                ? 'text-[24px] text-[#B87333]'
                                : 'text-[18px] text-[#555E78]'
                            }`}
                          >
                            #{item.rank}
                          </span>
                          {isRank1 && (
                            <Crown className="w-6 h-6 text-[#F0B429] animate-bounce ml-1 flex-shrink-0" />
                          )}
                        </div>

                        {/* NAME */}
                        <div
                          className={`col-span-4 text-left truncate ${
                            isRank1
                              ? 'text-[22px] font-bold text-white'
                              : isRank2 || isRank3
                              ? 'text-[20px] font-semibold text-white'
                              : 'text-[18px] font-medium text-[#E2E8F0]'
                          }`}
                        >
                          {item.name}
                        </div>

                        {/* PORTFOLIO VALUE */}
                        <div
                          className={`col-span-3 text-right font-mono font-bold tracking-tight ${
                            isRank1
                              ? 'text-[28px] text-white'
                              : isRank2 || isRank3
                              ? 'text-[24px] text-white'
                              : 'text-[20px] text-white'
                          }`}
                        >
                          {item.totalValue.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}{' '}
                          <span className="text-[12px] text-[#7B82A0] font-normal">IC</span>
                        </div>

                        {/* RETURN % BADGE */}
                        <div className="col-span-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1.5 font-mono font-bold rounded-xl px-3 py-1 border shadow-sm ${
                              isRank1 ? 'text-[16px] px-4 py-1.5' : 'text-[14px]'
                            } ${
                              isPositive
                                ? 'bg-[#14532D] text-[#4ADE80] border-[#22C55E]/40'
                                : isNegative
                                ? 'bg-[#7F1D1D] text-[#F87171] border-[#EF4444]/40'
                                : 'bg-[#1F2937] text-[#9CA3AF] border-[#4B5563]/40'
                            }`}
                          >
                            <span>{isPositive ? '▲' : isNegative ? '▼' : '—'}</span>
                            <span>
                              {isPositive ? '+' : ''}
                              {item.returnPercent.toFixed(1)}%
                            </span>
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
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
