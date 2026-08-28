import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { apiFetch } from '../services/api';
import { GameClock } from '../components/GameClock';

export function PublicLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set document page title
  useEffect(() => {
    document.title = 'Equity Arena — Live Leaderboard';
  }, []);

  // Fetch initial public leaderboard data & session state
  const fetchPublicData = useCallback(async () => {
    try {
      const [lbData, sessionData] = await Promise.all([
        apiFetch('/leaderboard/public'),
        apiFetch('/session').catch(() => null)
      ]);

      if (Array.isArray(lbData)) {
        setLeaderboard(lbData);
      }
      if (sessionData) {
        setSession(sessionData);
      }
    } catch (err) {
      console.error('Failed to fetch public leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

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
        setLeaderboard(updatedLb);
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
  }, []);

  const isSessionActive = session?.status === 'ACTIVE' || session?.status === 'PAUSED';

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#F0F2FF] p-4 sm:p-8 font-sans selection:bg-[#F0B429] selection:text-black flex flex-col justify-between">
      <div>
        {/* TOP HEADER */}
        <header className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4 sm:p-6 mb-8 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] flex items-center justify-center font-extrabold text-[#F0B429] text-2xl shadow-inner">
              ⬡
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black tracking-wider text-[#F0F2FF]">
                  EQUITY ARENA — LIVE LEADERBOARD
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                  LIVE STANDINGS
                </span>
              </div>
              <p className="text-xs text-[#8B949E] font-mono mt-0.5">
                Real-Time Tournament Rankings & Return Analytics
              </p>
            </div>
          </div>

          {/* SESSION COUNTDOWN CLOCK */}
          {isSessionActive && (
            <div className="bg-[#0D1117] border border-[#30363D] px-5 py-2 rounded-xl">
              <GameClock sessionData={session} size="md" title="SESSION TIME" />
            </div>
          )}
        </header>

        {/* MAIN LEADERBOARD SECTION */}
        <main className="max-w-6xl mx-auto">
          {loading ? (
            <div className="py-24 text-center font-mono text-[#8B949E] animate-pulse text-lg">
              Loading live tournament standings...
            </div>
          ) : !isSessionActive && leaderboard.length === 0 ? (
            <div className="py-24 text-center bg-[#161B22] border border-[#30363D] rounded-2xl p-12 shadow-xl my-8">
              <div className="text-4xl mb-4 text-[#F0B429]">⏳</div>
              <h2 className="text-2xl font-extrabold text-[#F0F2FF] mb-2">
                Waiting for the session to start
              </h2>
              <p className="text-sm font-mono text-[#8B949E]">
                The standings table will update live as soon as trading begins.
              </p>
            </div>
          ) : (
            <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4 sm:p-6 shadow-2xl overflow-hidden">
              
              {/* TABLE COLUMN HEADERS */}
              <div className="grid grid-cols-12 gap-4 pb-4 border-b border-[#30363D] px-4 font-mono text-xs font-bold text-[#8B949E] uppercase tracking-wider">
                <div className="col-span-2 text-left">RANK</div>
                <div className="col-span-4 text-left">TRADER NAME</div>
                <div className="col-span-3 text-right">TOTAL VALUE</div>
                <div className="col-span-3 text-right">RETURN %</div>
              </div>

              {/* SMOOTH ANIMATED ROWS */}
              <div className="divide-y divide-[#30363D]/60 mt-2">
                <AnimatePresence initial={false}>
                  {leaderboard.map((item) => {
                    const isRank1 = item.rank === 1;
                    const isPositive = item.returnPercent >= 0;

                    return (
                      <motion.div
                        key={item.name}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                        className={`grid grid-cols-12 gap-4 items-center px-4 py-4 sm:py-5 rounded-xl transition-colors ${
                          isRank1
                            ? 'bg-[#F0B429]/10 border border-[#F0B429]/40 text-[#F0F2FF] shadow-[0_0_25px_-8px_rgba(240,180,41,0.25)]'
                            : 'hover:bg-[#1C2128]'
                        }`}
                      >
                        {/* RANK */}
                        <div className="col-span-2 flex items-center gap-2">
                          <span
                            className={`font-mono font-black text-xl sm:text-2xl ${
                              isRank1
                                ? 'text-[#F0B429] drop-shadow-[0_0_8px_rgba(240,180,41,0.5)]'
                                : 'text-[#8B949E]'
                            }`}
                          >
                            #{item.rank}
                          </span>
                          {isRank1 && (
                            <span className="text-sm" title="Rank 1 Leader">
                              👑
                            </span>
                          )}
                        </div>

                        {/* NAME */}
                        <div className="col-span-4 text-left font-extrabold text-lg sm:text-xl text-[#F0F2FF] truncate">
                          {item.name}
                        </div>

                        {/* TOTAL VALUE */}
                        <div className="col-span-3 text-right font-mono font-black text-xl sm:text-2xl text-[#F0F2FF] tracking-tight">
                          {item.totalValue.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}{' '}
                          <span className="text-xs text-[#8B949E] font-normal">IC</span>
                        </div>

                        {/* RETURN % */}
                        <div className="col-span-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1 font-mono font-black text-lg sm:text-xl px-3 py-1 rounded-lg border ${
                              isPositive
                                ? 'bg-[#22C55E]/15 border-[#22C55E]/40 text-[#22C55E]'
                                : 'bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444]'
                            }`}
                          >
                            <span>{isPositive ? '▲' : '▼'}</span>
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

      {/* FOOTER */}
      <footer className="mt-12 pt-6 border-t border-[#30363D]/50 text-center font-mono text-xs text-[#8B949E] flex flex-wrap items-center justify-between gap-2 max-w-6xl mx-auto w-full">
        <div>EQUITY ARENA — PUBLIC LIVE AUDIENCE TERMINAL</div>
        <div>No Login Required • Live Auto-Update</div>
      </footer>
    </div>
  );
}
