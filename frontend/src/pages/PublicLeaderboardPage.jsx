import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { Crown, Trophy, Medal, Flame } from 'lucide-react';
import { apiFetch } from '../services/api';
import { GameClock } from '../components/GameClock';

export function PublicLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('TOP1'); // 'TOP1' | 'TOP5'
  const [autoCycle, setAutoCycle] = useState(false);
  const prevRankMap = useRef(new Map());

  // Auto-cycle view mode every 15s if enabled
  useEffect(() => {
    if (!autoCycle) return;
    const interval = setInterval(() => {
      setViewMode((prev) => (prev === 'TOP1' ? 'TOP5' : 'TOP1'));
    }, 15000);
    return () => clearInterval(interval);
  }, [autoCycle]);

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

        {/* Right: View Mode Toggle + Timer + Live Badge */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Top 1 / Top 5 Mode Switcher */}
          <div className="flex items-center bg-black/60 p-1 rounded-lg border-2 border-black shadow-[2px_2px_0px_#000000]">
            <button
              type="button"
              onClick={() => setViewMode('TOP1')}
              className={`px-2.5 py-1 text-xs font-mono font-black rounded transition-all cursor-pointer ${
                viewMode === 'TOP1'
                  ? 'bg-[#F0B429] text-black shadow-[1px_1px_0px_#000000]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              TOP 1
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TOP5')}
              className={`px-2.5 py-1 text-xs font-mono font-black rounded transition-all cursor-pointer ${
                viewMode === 'TOP5'
                  ? 'bg-[#F0B429] text-black shadow-[1px_1px_0px_#000000]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              TOP 5
            </button>
          </div>

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

      {/* CENTER STAGE: FIT-TO-SCREEN GRAND NEO-BRUTALIST DISPLAY */}
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
        ) : viewMode === 'TOP1' ? (
          (() => {
            const top1 = leaderboard[0];

            return (
              <div className="relative w-full">
                {/* Grand Neo-Brutalist Container with Hard Black Offset Shadow */}
                <div className="bg-[#121622] border-3 border-black rounded-2xl p-6 sm:p-8 md:p-10 shadow-[8px_8px_0px_#000000] relative overflow-hidden">
                  
                  {/* Watermark Giant #1 */}
                  <div className="absolute -right-6 -bottom-10 opacity-5 pointer-events-none select-none text-[260px] font-mono font-black text-[#F0B429] leading-none">
                    #1
                  </div>

                  {/* Ribbon Top: Crown + #1 Label */}
                  <div className="flex items-center justify-between gap-4 border-b-2 border-black pb-5 mb-6">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 bg-[#F0B429] border-2 border-black rounded-xl shadow-[3px_3px_0px_#000000] flex items-center justify-center text-black">
                        <Crown className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-black tracking-[0.25em] text-[#F0B429] uppercase">
                            TOURNAMENT LEADER
                          </span>
                          <span className="px-2 py-0.5 bg-black border border-[#F0B429] text-[#F0B429] text-[9px] font-mono font-black uppercase rounded shadow-[2px_2px_0px_#000000]">
                            RANK #1
                          </span>
                        </div>
                        <span className="text-[11px] text-[#8B949E] font-mono">
                          Official Tournament Standings
                        </span>
                      </div>
                    </div>

                    <div className="px-4 py-1.5 bg-[#F0B429] border-2 border-black font-mono font-black text-xs text-black rounded shadow-[3px_3px_0px_#000000] flex items-center gap-2 uppercase tracking-wider">
                      <span>★ LEADING ARENA ★</span>
                    </div>
                  </div>

                  {/* Hero Champion Name Title — Ultra Majestic & Clean */}
                  <div className="text-center py-12 sm:py-20 space-y-6">
                    <div className="inline-block bg-[#F0B429] text-black border-2 border-black px-6 py-1.5 rounded-lg font-mono text-sm font-black uppercase tracking-[0.3em] shadow-[4px_4px_0px_#000000]">
                      ★ FIRST POSITION ★
                    </div>
                    <h2 className="text-6xl sm:text-8xl lg:text-9xl font-black text-white tracking-tight font-sans drop-shadow-[0_8px_32px_rgba(0,0,0,0.9)] uppercase">
                      {top1.name}
                    </h2>
                  </div>

                </div>
              </div>
            );
          })()
        ) : (
          /* TOP 5 TOURNAMENT LEADERS PODIUM VIEW */
          <div className="space-y-3 w-full">
            <div className="flex items-center justify-between px-2 font-mono">
              <span className="text-xs font-black text-[#F0B429] uppercase tracking-[0.2em] flex items-center gap-2">
                <Trophy className="w-4 h-4" /> TOP 5 COMPETITORS
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                Ranked by Portfolio Net Worth
              </span>
            </div>

            <div className="space-y-2.5">
              {leaderboard.slice(0, 5).map((trader, idx) => {
                const isChampion = idx === 0;
                const isRunnerUp = idx === 1;
                const isThird = idx === 2;

                const badgeBg = isChampion
                  ? 'bg-[#F0B429] text-black'
                  : isRunnerUp
                  ? 'bg-slate-300 text-black'
                  : isThird
                  ? 'bg-amber-700 text-white'
                  : 'bg-[#1A2030] text-slate-300';

                return (
                  <motion.div
                    key={trader.id || trader.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex items-center justify-between p-3.5 sm:p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_#000000] ${
                      isChampion
                        ? 'bg-[#151A28] border-l-6 border-l-[#F0B429]'
                        : 'bg-[#101420] border-l-4 border-l-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className={`w-8 h-8 rounded-lg font-mono font-black text-sm flex items-center justify-center border border-black shadow-[1px_1px_0px_#000000] shrink-0 ${badgeBg}`}>
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base sm:text-lg text-white truncate uppercase font-sans">
                            {trader.name}
                          </span>
                          {isChampion && (
                            <span className="px-2 py-0.5 bg-[#F0B429] text-black text-[9px] font-mono font-black uppercase rounded shadow-[1px_1px_0px_#000000]">
                              CURRENT LEADER
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono shrink-0">
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                        ARENA STANDING
                      </span>
                      <span className="text-sm sm:text-base font-black text-[#F0B429]">
                        POS #{idx + 1}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
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
