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
      className="h-screen w-screen overflow-hidden bg-[#0A0D14] text-[#F0F2FF] font-sans selection:bg-[#F0B429] selection:text-black flex flex-col justify-between relative px-6 py-4 sm:px-12 sm:py-6"
      style={{
        backgroundImage: `
          linear-gradient(rgba(240, 180, 41, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(240, 180, 41, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }}
    >
      {/* Neo-Brutalist Top Solid Yellow Accent Beam */}
      <div className="fixed top-0 left-0 right-0 h-[4px] bg-[#F0B429] z-50 shadow-[0_0_15px_rgba(240,180,41,0.5)]" />

      {/* TOP NEO-BRUTALIST HUD HEADER */}
      <header className="relative z-10 flex items-center justify-between gap-4 border-b-2 border-black pb-3 shrink-0">
        {/* Left: Brand Pill */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F0B429] border-2 border-black rounded-lg shadow-[3px_3px_0px_#000000] flex items-center justify-center font-mono font-black text-black text-xl">
            EA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-black tracking-[0.2em] text-[#F0B429] uppercase">
                EQUITY ARENA
              </span>
              <span className="px-2 py-0.5 bg-black border border-[#F0B429] text-[#F0B429] font-mono text-[9px] font-black uppercase tracking-wider rounded">
                LIVE FLOOR
              </span>
            </div>
            <span className="text-[11px] text-[#8B949E] font-mono">IGNITE 8.0 · Tournament Terminal</span>
          </div>
        </div>

        {/* Center: Neo-Brutalist Main Banner Title */}
        <div className="hidden md:flex flex-col items-center">
          <div className="bg-[#F0B429] text-black font-black px-4 py-0.5 border-2 border-black shadow-[3px_3px_0px_#000000] text-xl lg:text-2xl uppercase tracking-wider font-mono">
            LIVE LEADERBOARD
          </div>
          <span className="text-[10px] font-mono text-[#8B949E] uppercase tracking-[0.25em] mt-1">
            Official Competition Rankings
          </span>
        </div>

        {/* Right: Timer + Live Badge */}
        <div className="flex items-center gap-3">
          {isSessionActive && (
            <div className="bg-[#121622] border-2 border-black px-3 py-1 rounded shadow-[3px_3px_0px_#000000] flex items-center gap-2 font-mono">
              <GameClock sessionData={session} size="sm" />
            </div>
          )}
          <div className="px-3.5 py-1 bg-[#22C55E] border-2 border-black text-black text-xs font-mono font-black rounded flex items-center gap-2 shadow-[3px_3px_0px_#000000]">
            <span className="w-2 h-2 rounded-full bg-black animate-ping" />
            <span>LIVE</span>
          </div>
        </div>
      </header>

      {/* CENTER STAGE: FIT-TO-SCREEN GRAND NEO-BRUTALIST CHAMPION PODIUM */}
      <main className="relative z-10 flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full my-auto py-2">
        {loading ? (
          <div className="py-20 text-center font-mono text-[#F0B429] animate-pulse text-lg">
            Loading real-time rankings...
          </div>
        ) : !isSessionActive && leaderboard.length === 0 ? (
          <div className="text-center bg-[#121622] border-3 border-black rounded-xl p-8 shadow-[6px_6px_0px_#000000]">
            <div className="text-5xl mb-3 text-[#F0B429]">⏳</div>
            <h2 className="text-2xl font-bold text-white mb-1 font-mono">Session Inactive</h2>
            <p className="text-xs font-mono text-slate-400">Standings will activate once the competition begins.</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center bg-[#121622] border-3 border-black rounded-xl p-8 shadow-[6px_6px_0px_#000000]">
            <span className="text-slate-400 font-mono text-xs">Awaiting active participants on the leaderboard...</span>
          </div>
        ) : (
          (() => {
            const top1 = leaderboard[0];
            const isPositive = (top1.returnPercent || 0) > 0;
            const isNegative = (top1.returnPercent || 0) < 0;
            const profitDelta = (top1.totalValue || 0) - 20000;

            return (
              <div className="relative w-full">
                {/* Grand Neo-Brutalist Container with Hard Black Offset Shadow */}
                <div className="bg-[#121622] border-3 border-black rounded-2xl p-6 sm:p-8 md:p-10 shadow-[8px_8px_0px_#000000] relative overflow-hidden">
                  
                  {/* Watermark Giant #1 */}
                  <div className="absolute -right-6 -bottom-10 opacity-5 pointer-events-none select-none text-[260px] font-mono font-black text-[#F0B429] leading-none">
                    #1
                  </div>

                  {/* Ribbon Top: Crown + #1 Label + Return Tag */}
                  <div className="flex items-center justify-between gap-4 border-b-2 border-black pb-5 mb-6 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#F0B429] border-2 border-black rounded-xl shadow-[3px_3px_0px_#000000] flex items-center justify-center text-black">
                        <Crown className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-black tracking-[0.2em] text-[#F0B429] uppercase">
                            TOURNAMENT LEADER
                          </span>
                          <span className="px-2 py-0.5 bg-black border border-[#F0B429] text-[#F0B429] text-[9px] font-mono font-black uppercase rounded shadow-[2px_2px_0px_#000000]">
                            RANK #1
                          </span>
                        </div>
                        <span className="text-[11px] text-[#8B949E] font-mono">
                          Current Highest Tournament Net Worth
                        </span>
                      </div>
                    </div>

                    {/* Session Return Badge (Neo-Brutalist Pill) */}
                    <div className={`px-4 py-1.5 border-2 border-black font-mono font-black text-xs rounded shadow-[3px_3px_0px_#000000] flex items-center gap-2 ${
                      isPositive
                        ? 'bg-[#22C55E] text-black'
                        : isNegative
                        ? 'bg-[#EF4444] text-white'
                        : 'bg-[#2D3142] text-white'
                    }`}>
                      <span className="text-sm">{isPositive ? '▲' : isNegative ? '▼' : '•'}</span>
                      <span>{isPositive ? '+' : ''}{(top1.returnPercent || 0).toFixed(2)}% Session Return</span>
                    </div>
                  </div>

                  {/* Hero Champion Name Title */}
                  <div className="text-center py-2 space-y-2">
                    <div className="inline-block bg-[#F0B429] text-black border-2 border-black px-3.5 py-0.5 rounded font-mono text-[11px] font-black uppercase tracking-widest shadow-[2px_2px_0px_#000000]">
                      ★ FIRST POSITION ★
                    </div>
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight font-sans drop-shadow-md">
                      {top1.name}
                    </h2>
                    {top1.email && (
                      <p className="text-xs font-mono text-[#8B949E]">
                        Registered Trader: <span className="text-slate-200 font-bold">{top1.email}</span>
                      </p>
                    )}
                  </div>

                  {/* 3 Neo-Brutalist Stat Blocks with Hard Black Borders & Solid Shadows */}
                  <div className="mt-6 pt-6 border-t-2 border-black grid grid-cols-1 sm:grid-cols-3 gap-4">
                    
                    {/* Metric 1: Total Portfolio Value (Gold Theme) */}
                    <div className="p-4 bg-[#0A0D14] border-2 border-black rounded-xl shadow-[4px_4px_0px_#000000] relative">
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-[#F0B429] border border-black rounded text-[9px] font-mono font-black text-black">
                        EQUITY
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E] block mb-1 font-bold">
                        TOTAL PORTFOLIO VALUE
                      </span>
                      <div className="text-2xl sm:text-3xl font-mono font-black text-[#F0B429] tracking-tight">
                        {top1.totalValue.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                        <span className="text-xs font-normal text-slate-400 ml-1.5 font-sans font-bold">IC</span>
                      </div>
                    </div>

                    {/* Metric 2: Net Gain / Deficit */}
                    <div className="p-4 bg-[#0A0D14] border-2 border-black rounded-xl shadow-[4px_4px_0px_#000000] relative">
                      <div className={`absolute top-2 right-2 px-1.5 py-0.5 border border-black rounded text-[9px] font-mono font-black text-black ${
                        profitDelta >= 0 ? 'bg-[#22C55E]' : 'bg-[#EF4444] text-white'
                      }`}>
                        {profitDelta >= 0 ? 'PROFIT' : 'LOSS'}
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E] block mb-1 font-bold">
                        NET GAIN / DEFICIT
                      </span>
                      <div className={`text-2xl sm:text-3xl font-mono font-black tracking-tight ${
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
                        <span className="text-xs font-normal text-slate-400 ml-1.5 font-mono">IC</span>
                      </div>
                    </div>

                    {/* Metric 3: Standing Status */}
                    <div className="p-4 bg-[#0A0D14] border-2 border-black rounded-xl shadow-[4px_4px_0px_#000000] flex flex-col justify-center relative">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E] block mb-1 font-bold">
                        ARENA STANDING
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl font-mono font-black text-white">
                          #1 of {leaderboard.length}
                        </span>
                        <span className="text-[10px] font-mono font-black text-black uppercase px-2 py-0.5 rounded bg-[#F0B429] border border-black shadow-[2px_2px_0px_#000000]">
                          LEADER
                        </span>
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
      <footer className="relative z-10 pt-2 border-t-2 border-black flex items-center justify-between text-[11px] font-mono text-[#8B949E] uppercase tracking-wider shrink-0">
        <span className="text-[#F0B429] font-bold">EQUITY ARENA · IGNITE 8.0</span>
        <span className="text-slate-500">REAL-TIME TOURNAMENT ENGINE</span>
      </footer>
    </div>
  );
}
