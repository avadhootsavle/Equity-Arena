import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Award, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  Flame, 
  ShieldCheck, 
  Coins, 
  Crown,
  X,
  ArrowLeft
} from 'lucide-react';
import { apiFetch } from '../services/api';

/**
 * Super attractive, Neo-Brutalist Post-Game Tournament Performance & Scorecard Terminal.
 * Mounts when the 3-hour game concludes and auto-liquidation occurs.
 */
export function PostGameScorecard({ user, portfolio, sessionData, onWatchLeaderboard, onClose }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [copied, setCopied] = useState(false);
  const scorecardRef = useRef(null);

  // Fetch final leaderboard standings to find exact user rank
  useEffect(() => {
    let mounted = true;
    async function loadRank() {
      try {
        const data = await apiFetch('/leaderboard');
        if (mounted && Array.isArray(data)) {
          setLeaderboard(data);
        }
      } catch (e) {
        console.error('Failed to load final standings:', e);
      } finally {
        if (mounted) setLoadingLeaderboard(false);
      }
    }
    loadRank();
    return () => { mounted = false; };
  }, []);

  // Compute player stats from user, portfolio, and standings
  const stats = useMemo(() => {
    // Priority: portfolio value (liquidated cash) -> user.walletBalance -> match from leaderboard
    let finalBalance = 20000;
    if (portfolio?.totalPortfolioValue !== undefined && portfolio.totalPortfolioValue > 0) {
      finalBalance = Number(portfolio.totalPortfolioValue);
    } else if (portfolio?.walletBalance !== undefined && portfolio.walletBalance > 0) {
      finalBalance = Number(portfolio.walletBalance);
    } else if (user?.walletBalance !== undefined && user.walletBalance > 0) {
      finalBalance = Number(user.walletBalance);
    }

    // Find rank & exact balance in tournament standings if present
    let rank = null;
    let totalPlayers = leaderboard.length || 1;
    const userIndex = leaderboard.findIndex(p => p.id === user?.id || p.email === user?.email);
    if (userIndex !== -1) {
      rank = userIndex + 1;
      if (leaderboard[userIndex].totalPortfolioValue !== undefined) {
        finalBalance = Number(leaderboard[userIndex].totalPortfolioValue);
      }
    }

    const initialBalance = 20000;
    const netPnL = finalBalance - initialBalance;
    const netPnLPercent = Math.round(((netPnL / initialBalance) * 100) * 100) / 100;
    const isProfitable = netPnL >= 0;

    // Badges computation — based on personal performance, keeping rank suspenseful for ceremony
    const badges = [];
    if (netPnLPercent >= 50) {
      badges.push({ title: 'Alpha Bull', desc: '+50% Portfolio Boom', icon: Flame, color: '#EF4444' });
    } else if (isProfitable) {
      badges.push({ title: 'Green Closer', desc: 'Ended in Clear Profit', icon: TrendingUp, color: '#22C55E' });
    }

    badges.push({ title: 'Diamond Hands', desc: 'Survived 3-Hour Arena', icon: ShieldCheck, color: '#A855F7' });
    badges.push({ title: 'Fully Liquidated', desc: '100% Cash Secured', icon: Coins, color: '#06B6D4' });

    return {
      finalBalance,
      netPnL,
      netPnLPercent,
      isProfitable,
      totalPlayers,
      badges
    };
  }, [user, leaderboard]);

  // Confetti particles generator
  const confettiParticles = useMemo(() => {
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.5,
      size: Math.random() * 8 + 6,
      color: ['#F0B429', '#22C55E', '#EC4899', '#3B82F6', '#FFFFFF', '#A855F7'][i % 6],
      rotation: Math.random() * 360
    }));
  }, []);

  const handleShare = () => {
    const text = `EQUITY ARENA — OFFICIAL TOURNAMENT RESULTS\n` +
      `Trader: ${user?.name || 'Student'}\n` +
      `Final Portfolio: ${stats.finalBalance.toLocaleString('en-IN')} IC (${stats.isProfitable ? '+' : ''}${stats.netPnLPercent}%)\n` +
      `Rank: ${stats.rank ? `#${stats.rank} of ${stats.totalPlayers}` : 'Top Finisher'}\n` +
      `Event: 3-Hour Trading Arena`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrintOrSave = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0D13] text-white flex flex-col overflow-y-auto font-sans selection:bg-[#F0B429] selection:text-black">
      {/* Dynamic Celebration Confetti falling down */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {confettiParticles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: -20, opacity: 0, rotate: 0 }}
            animate={{ 
              y: '105vh', 
              opacity: [0, 1, 1, 0.8, 0],
              rotate: p.rotation + 360
            }}
            transition={{ 
              duration: 4 + Math.random() * 3, 
              delay: p.delay, 
              repeat: Infinity,
              ease: 'linear'
            }}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              width: p.size,
              height: p.size * 0.7,
              backgroundColor: p.color,
              borderRadius: p.id % 2 === 0 ? '2px' : '50%',
              boxShadow: `0 0 8px ${p.color}80`
            }}
          />
        ))}
      </div>

      {/* Top Gold Header Ribbon */}
      <header className="relative z-10 border-b-3 border-black bg-[#121622] px-4 py-3 flex items-center justify-between shadow-[0_4px_0px_#000000]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#F0B429] border-2 border-black flex items-center justify-center text-black font-black font-mono shadow-[2px_2px_0px_#000000]">
            EA
          </div>
          <div>
            <span className="font-heading font-black text-sm uppercase tracking-wider text-white flex items-center gap-1.5">
              <span>EQUITY ARENA</span>
              <span className="text-[10px] bg-[#22C55E] text-black px-1.5 py-0.2 rounded font-mono font-black">
                TOURNAMENT CONCLUDED
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-black border border-[#22C55E] text-[#22C55E] font-mono text-[11px] font-black uppercase rounded shadow-[2px_2px_0px_#000000]">
            TRADING CONCLUDED
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-[#F0B429] hover:bg-[#d9a120] text-black font-mono text-[11px] font-black uppercase rounded shadow-[2px_2px_0px_#000000] transition-all flex items-center gap-1.5 cursor-pointer"
              title="Close scorecard and view trading dashboard"
            >
              <span>View Dashboard</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Scorecard Stage */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 md:p-8 flex flex-col justify-center my-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          ref={scorecardRef}
          className="bg-[#151926] border-3 border-black rounded-3xl p-6 sm:p-8 md:p-10 shadow-[10px_10px_0px_#000000] space-y-6 relative overflow-hidden"
        >
          {/* Banner Tag */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black/80 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-black border border-[#F0B429] text-[#F0B429] font-mono text-xs font-black uppercase rounded-md shadow-[2px_2px_0px_#000000]">
                OFFICIAL TOURNAMENT SCORECARD
              </span>
              <span className="text-xs font-mono text-slate-400">
                3-Hour Session Complete
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Auto-Liquidation Complete (100% Cash)</span>
            </div>
          </div>

          {/* Hero Welcome & Official Notice */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-mono text-[#F0B429] font-black uppercase tracking-widest">
                CONGRATULATIONS, TRADER
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight font-sans">
                {user?.name || 'Tournament Competitor'}
              </h1>
              <p className="text-xs sm:text-sm font-mono text-slate-400 mt-1">
                {user?.email} • Event Roster Validated
              </p>
            </div>

            {/* Official Ceremony Announcement Notice */}
            <div className="bg-[#0B0D13] border-3 border-[#F0B429] rounded-2xl p-4 sm:p-5 text-center shrink-0 shadow-[4px_4px_0px_#000000] min-w-[200px]">
              <span className="text-[10px] font-mono text-[#F0B429] uppercase font-black tracking-wider block">
                FINAL TOURNAMENT RANKINGS
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-white my-1">
                ANNOUNCING LIVE
              </div>
              <span className="text-[11px] font-mono text-slate-300 font-bold block">
                Podium Ceremony in Progress
              </span>
            </div>
          </div>

          {/* Key Metric Financial Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
            {/* Final Cash Liquidated */}
            <div className="bg-[#0F121C] border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_#000000]">
              <span className="text-xs uppercase font-bold text-slate-400 block tracking-wider">
                FINAL PORTFOLIO (LIQUID CASH)
              </span>
              <div className="text-3xl sm:text-4xl font-black text-white mt-1.5">
                {stats.finalBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })} <span className="text-base text-[#F0B429]">IC</span>
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                Initial starting capital: 20,000.00 IC
              </span>
            </div>

            {/* Total Net Profit / Loss */}
            <div className="bg-[#0F121C] border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_#000000]">
              <span className="text-xs uppercase font-bold text-slate-400 block tracking-wider">
                NET ARENA RETURN (P&L)
              </span>
              <div className={`text-3xl sm:text-4xl font-black mt-1.5 flex items-center gap-2 ${
                stats.isProfitable ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {stats.isProfitable ? <TrendingUp className="w-7 h-7" /> : <TrendingDown className="w-7 h-7" />}
                <span>
                  {stats.netPnL >= 0 ? '+' : ''}{stats.netPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })} IC
                </span>
              </div>
              <span className="text-xs text-slate-500 mt-1 block font-bold">
                ROI: {stats.netPnLPercent >= 0 ? '+' : ''}{stats.netPnLPercent}%
              </span>
            </div>
          </div>

          {/* Badges & Achievements Section */}
          <div className="space-y-2.5">
            <span className="text-xs font-mono font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#F0B429]" />
              <span>EARNED TOURNAMENT HONORS:</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {stats.badges.map((b, idx) => {
                const Icon = b.icon;
                return (
                  <div
                    key={idx}
                    className="bg-[#0B0D13] border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_#000000] flex flex-col items-center text-center space-y-1"
                  >
                    <div 
                      className="w-9 h-9 rounded-lg border-2 border-black flex items-center justify-center shadow-[1px_1px_0px_#000000]"
                      style={{ backgroundColor: `${b.color}20`, borderColor: b.color }}
                    >
                      <Icon className="w-5 h-5" style={{ color: b.color }} />
                    </div>
                    <span className="font-bold text-xs text-white uppercase font-heading tracking-wide">
                      {b.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {b.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clean Terminal Footer */}
          <div className="pt-4 border-t-2 border-black/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <span className="text-slate-400">
              Session verified by Equity Arena Engine • Official College Tournament
            </span>
            <div className="flex items-center gap-2">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1 bg-[#1A2030] hover:bg-[#252E45] border border-slate-700 text-slate-200 font-bold rounded shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>View Dashboard</span>
                </button>
              )}
              <span className="px-2.5 py-1 bg-black border border-emerald-500 text-emerald-400 font-bold rounded shadow-[2px_2px_0px_#000000]">
                OFFICIAL RESULTS FINALIZED
              </span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
