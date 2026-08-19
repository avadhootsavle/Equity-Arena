import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../services/api';
import { GameClock } from '../components/GameClock';
import { useSession } from '../hooks/useSession';
import { AdminTraderDetailModal } from '../components/AdminTraderDetailModal';
import { playNewsChime } from '../services/soundService';
import { 
  TrendingUp, TrendingDown, Shield, LogOut, Radio, Send, 
  Trophy, Search, RefreshCw, CheckCircle2, AlertCircle, Sparkles, SlidersHorizontal, Clock, Zap, Eye, Sun, Moon, RotateCcw, Bell
} from 'lucide-react';

export function AdminDashboard() {
  const adminSession = useSession();
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const { theme, toggleTheme } = useTheme();

  const [stocks, setStocks] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [customPercents, setCustomPercents] = useState({});
  const [adjustingStockId, setAdjustingStockId] = useState(null);

  const [newsMessage, setNewsMessage] = useState('');
  const [selectedStockId, setSelectedStockId] = useState('');
  const [sendingNews, setSendingNews] = useState(false);
  const [recentNews, setRecentNews] = useState([]);

  const [templates, setTemplates] = useState([]);
  const [usedTemplateIds, setUsedTemplateIds] = useState([]);
  const [pendingDelayedNews, setPendingDelayedNews] = useState([]);
  const [delaySeconds, setDelaySeconds] = useState(30);
  const [triggeringTemplateId, setTriggeringTemplateId] = useState(null);

  // 20-minute recurring news reminder timer (1200 seconds)
  const [reminderSeconds, setReminderSeconds] = useState(1200);
  const [showReminderAlert, setShowReminderAlert] = useState(false);

  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Admin Trader Drill-Down Modal state
  const [selectedTraderId, setSelectedTraderId] = useState(null);
  const [isTraderModalOpen, setIsTraderModalOpen] = useState(false);

  const [toast, setToast] = useState(null);

  const resetNewsTimer = () => {
    setReminderSeconds(1200);
    setShowReminderAlert(false);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setReminderSeconds((prev) => {
        if (prev <= 1) {
          setShowReminderAlert(true);
          playNewsChime();
          return 1200; // Reset countdown
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [sessionDurationMins, setSessionDurationMins] = useState(180);
  const [liquidationBufferMins, setLiquidationBufferMins] = useState(5);
  const [macroCycleMins, setMacroCycleMins] = useState(15);
  const [isStartingSession, setIsStartingSession] = useState(false);

  const handleStartNewSession = async (e) => {
    if (e) e.preventDefault();
    setIsStartingSession(true);
    try {
      const data = await apiFetch('/admin/session/start', {
        method: 'POST',
        body: JSON.stringify({
          durationMinutes: parseInt(sessionDurationMins, 10) || 180,
          liquidationBufferMinutes: parseInt(liquidationBufferMins, 10) || 5,
          macroCycleIntervalMinutes: parseInt(macroCycleMins, 10) || 15
        })
      });
      resetNewsTimer();
      showToast(data.message || 'New trading session started!');
    } catch (err) {
      showToast(err.message || 'Failed to start session', 'error');
    } finally {
      setIsStartingSession(false);
    }
  };

  const fetchStocks = async () => {
    try {
      const data = await apiFetch('/stocks');
      setStocks(data);
    } catch (err) {
      showToast(err.message || 'Failed to fetch stocks', 'error');
    } finally {
      setLoadingStocks(false);
    }
  };

  const fetchNewsTemplates = async () => {
    try {
      const data = await apiFetch('/admin/news-templates');
      setTemplates(data.templates || []);
      setUsedTemplateIds(data.usedTemplateIds || []);
      setPendingDelayedNews(data.pendingDelayedNews || []);
    } catch (err) {
      console.error('Failed to fetch news templates:', err);
    }
  };

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const data = await apiFetch('/admin/leaderboard');
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    fetchStocks();
    fetchNewsTemplates();
    fetchLeaderboard();

    const interval = setInterval(() => {
      fetchLeaderboard();
      fetchNewsTemplates();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Real-time socket listener for live price synchronization
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      fetchStocks();
      fetchLeaderboard();
      fetchNewsTemplates();
    };

    const handleStockUpdate = (diff) => {
      setStocks((prevStocks) =>
        prevStocks.map((s) => {
          if (s.id === diff.stockId) {
            const newHistory = [
              ...(s.priceHistories || []),
              { price: diff.newPrice, volume: diff.volume, timestamp: diff.timestamp }
            ];

            return {
              ...s,
              currentPrice: diff.newPrice,
              percentChange: diff.percentChange,
              priceHistories: newHistory
            };
          }
          return s;
        })
      );
    };

    socket.on('connect', handleConnect);
    socket.on('stock:update', handleStockUpdate);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('stock:update', handleStockUpdate);
    };
  }, [socket]);

  const handleAdjustPrice = async (stockId, percent) => {
    setAdjustingStockId(stockId);
    try {
      const data = await apiFetch(`/admin/stock/${stockId}/adjust`, {
        method: 'POST',
        body: JSON.stringify({ percent })
      });

      setStocks((prevStocks) =>
        prevStocks.map((s) => {
          if (s.id === stockId) {
            return {
              ...s,
              currentPrice: data.stock.currentPrice,
              percentChange: data.percentChange
            };
          }
          return s;
        })
      );

      const sign = percent >= 0 ? '+' : '';
      showToast(`${data.stock.symbol} price adjusted by ${sign}${percent}% → ${data.stock.currentPrice.toFixed(2)} IC`);
      setCustomPercents((prev) => ({ ...prev, [stockId]: '' }));
    } catch (err) {
      showToast(err.message || 'Price adjustment failed', 'error');
    } finally {
      setAdjustingStockId(null);
    }
  };

  const handleSendNews = async (e) => {
    e.preventDefault();
    if (!newsMessage.trim()) return;

    setSendingNews(true);
    try {
      const data = await apiFetch('/admin/news', {
        method: 'POST',
        body: JSON.stringify({
          message: newsMessage.trim(),
          stockId: selectedStockId || undefined
        })
      });

      resetNewsTimer();
      showToast('Custom news broadcasted to all connected traders!');
      setRecentNews((prev) => [data.news, ...(Array.isArray(prev) ? prev.slice(0, 9) : [])]);
      setNewsMessage('');
      setSelectedStockId('');
    } catch (err) {
      showToast(err.message || 'News broadcast failed', 'error');
    } finally {
      setSendingNews(false);
    }
  };

  const handleTriggerTemplate = async (templateId) => {
    setTriggeringTemplateId(templateId);
    try {
      const data = await apiFetch('/admin/news/trigger-template', {
        method: 'POST',
        body: JSON.stringify({
          templateId,
          delaySeconds: parseInt(delaySeconds, 10) || 30
        })
      });

      resetNewsTimer();
      showToast(data.message);
      fetchNewsTemplates();
    } catch (err) {
      showToast(err.message || 'Failed to trigger template', 'error');
    } finally {
      setTriggeringTemplateId(null);
    }
  };

  const handleOpenTraderDetail = (traderId) => {
    setSelectedTraderId(traderId);
    setIsTraderModalOpen(true);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const filteredStocks = stocks.filter((stock) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      stock.symbol.toLowerCase().includes(q) ||
      stock.name.toLowerCase().includes(q) ||
      stock.sector.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen theme-bg-app transition-colors pb-12">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b theme-border theme-bg-card/90 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold theme-text-main font-mono">EQUITY ARENA</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-500 border border-rose-500/30 uppercase tracking-wider font-mono">
                  ADMIN CONSOLE
                </span>
              </div>
              <p className="text-[11px] theme-text-muted">Control Desk for 15 Indian Stocks</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Session Countdown */}
            <GameClock sessionData={adminSession} title="TIME LEFT" />

            {/* 20-Minute News Reminder Widget */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-[4px] border theme-border theme-bg-card font-mono text-xs shadow-sm">
              <Clock className="w-4 h-4 text-[var(--accent)] animate-pulse" />
              <div>
                <span className="theme-text-dim text-[9px] block font-bold uppercase tracking-wider">SEND NEWS SOON</span>
                <span className={`font-bold font-mono ${reminderSeconds < 180 ? 'text-[var(--loss-red)]' : 'theme-text-main'}`}>
                  {Math.floor(reminderSeconds / 60).toString().padStart(2, '0')}:{(reminderSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            <button
              onClick={handleStartNewSession}
              className="px-3 py-1.5 bg-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_90%,transparent)] text-slate-950 text-xs font-bold font-mono rounded-[4px] transition-all flex items-center gap-1.5 shadow-sm min-h-[36px] btn-terminal"
              title="Start a fresh trading session"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>START NEW SESSION</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border theme-border theme-bg-panel theme-text-muted hover:theme-text-main transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Toggle Dark / Light Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" style={{ color: 'var(--accent)' }} /> : <Moon className="w-4 h-4" style={{ color: 'var(--accent)' }} />}
            </button>

            <div className="flex items-center gap-2 border-l theme-border pl-4">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold theme-text-main">{user?.name || 'Exchange Admin'}</div>
                <div className="text-[10px] theme-text-muted font-mono">{user?.email}</div>
              </div>
              <button
                onClick={logout}
                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                title="Logout Admin"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* SESSION TIMING & ALGORITHM CONTROLLER CARD */}
        <div className="theme-bg-card border theme-border rounded-[6px] p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between border-b theme-border pb-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-heading theme-text-main">
                SESSION TIMING & SETTINGS
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[var(--gain-green)] font-bold bg-[color-mix(in_srgb,var(--gain-green)_10%,transparent)] px-2.5 py-0.5 rounded border border-[color-mix(in_srgb,var(--gain-green)_20%,transparent)]">
              ADMIN SETTINGS
            </span>
          </div>

          <form onSubmit={handleStartNewSession} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-mono uppercase theme-text-muted mb-1 font-bold">
                Session Duration (Minutes)
              </label>
              <input
                type="number"
                min="1"
                max="1440"
                value={sessionDurationMins}
                onChange={(e) => setSessionDurationMins(e.target.value)}
                className="w-full px-3 py-2 rounded-[4px] border theme-border theme-bg-panel theme-text-main font-mono text-xs focus:outline-none focus:border-[var(--accent)]"
                placeholder="180"
              />
              <div className="text-[9px] theme-text-dim mt-1 font-mono">Default: 180 (3h). Test: 30 or 15</div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase theme-text-muted mb-1 font-bold">
                Auto-Liquidation Buffer (Mins)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={liquidationBufferMins}
                onChange={(e) => setLiquidationBufferMins(e.target.value)}
                className="w-full px-3 py-2 rounded-[4px] border theme-border theme-bg-panel theme-text-main font-mono text-xs focus:outline-none focus:border-[var(--accent)]"
                placeholder="5"
              />
              <div className="text-[9px] theme-text-dim mt-1 font-mono">Default: 5m before end. Test: 2m</div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase theme-text-muted mb-1 font-bold">
                Macro Price Cycle Base (Mins)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={macroCycleMins}
                onChange={(e) => setMacroCycleMins(e.target.value)}
                className="w-full px-3 py-2 rounded-[4px] border theme-border theme-bg-panel theme-text-main font-mono text-xs focus:outline-none focus:border-[var(--accent)]"
                placeholder="15"
              />
              <div className="text-[9px] theme-text-dim mt-1 font-mono">Default: 15m (prod). Test: 3m</div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isStartingSession}
                className="w-full px-4 py-2 bg-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_90%,transparent)] text-slate-950 text-xs font-black font-mono uppercase rounded-[4px] transition-all flex items-center justify-center gap-2 shadow-sm min-h-[38px] btn-terminal disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isStartingSession ? 'STARTING...' : 'START TRADING SESSION'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* 20-Minute News Reminder Alert Banner */}
        {showReminderAlert && (
          <div className="p-4 bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] border border-[color-mix(in_srgb,var(--accent)_50%,transparent)] rounded-[6px] text-[var(--accent)] text-xs font-mono flex items-center justify-between animate-fadeIn shadow-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-[var(--accent)] animate-bounce flex-shrink-0" />
              <div>
                <span className="font-extrabold text-sm block">⏰ SEND NEWS SOON: 20 MINUTES PASSED!</span>
                <span className="theme-text-muted">It's time to send a news headline to traders to keep the market active.</span>
              </div>
            </div>
            <button
              onClick={resetNewsTimer}
              className="px-3 py-1.5 bg-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_90%,transparent)] text-slate-950 font-bold rounded-[4px] text-xs font-mono transition-all btn-terminal flex-shrink-0"
            >
              DISMISS & RESET TIMER
            </button>
          </div>
        )}

        {/* Toast Alert */}
        {toast && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all animate-fadeIn ${
            toast.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Section 1: Analyst News Templates */}
        <div className="theme-bg-card p-6 rounded-2xl border theme-border space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold theme-text-main flex items-center gap-2">
                <Sparkles className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                Send News to Traders (Prebuilt Templates)
              </h2>
              <p className="text-xs theme-text-muted">
                Pick a news template to send to traders and steer stock price movement. Single & multi-stock impacts available across 3 difficulty levels.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold theme-text-muted font-mono whitespace-nowrap">Send Delay:</label>
              <select
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(e.target.value)}
                className="theme-bg-panel border theme-border rounded-xl px-3 py-1.5 text-xs font-mono theme-text-main focus:outline-none focus:border-[var(--accent)] transition-all min-h-[36px]"
              >
                <option value={15}>15 Seconds</option>
                <option value={30}>30 Seconds</option>
                <option value={60}>60 Seconds</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((tpl) => {
              const isPositive = tpl.effectPercent >= 0;
              const isUsed = usedTemplateIds.includes(tpl.id);
              const difficulty = tpl.difficulty || 'EASY';

              let diffClass = 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
              if (difficulty === 'MEDIUM') diffClass = 'bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-[var(--accent)] border-[color-mix(in_srgb,var(--accent)_30%,transparent)]';
              if (difficulty === 'HARD') diffClass = 'bg-[color-mix(in_srgb,var(--loss-red)_20%,transparent)] text-[var(--loss-red)] border-[color-mix(in_srgb,var(--loss-red)_30%,transparent)]';

              return (
                <div
                  key={tpl.id}
                  className={`theme-bg-panel p-4 rounded-xl border theme-border hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition-all flex flex-col justify-between gap-3 shadow-sm ${
                    isUsed ? 'opacity-70' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold theme-bg-card theme-text-muted border theme-border">
                          {tpl.sector}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${diffClass}`}>
                          {difficulty}
                        </span>
                        {isUsed && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-slate-800 text-slate-400 border border-slate-700">
                            USED THIS SESSION
                          </span>
                        )}
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isPositive ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
                      }`}>
                        {isPositive ? '+' : ''}{tpl.effectPercent}%
                      </span>
                    </div>

                    <p className="text-xs theme-text-main font-semibold leading-snug">
                      "{tpl.headline}"
                    </p>
                    <p className="text-[11px] theme-text-muted mt-1 italic">
                      Notes: {tpl.notes}
                    </p>
                  </div>

                  <button
                    onClick={() => handleTriggerTemplate(tpl.id)}
                    disabled={triggeringTemplateId === tpl.id}
                    className="w-full py-2 bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] hover:bg-[var(--accent)] text-[var(--accent)] hover:text-white font-bold text-xs rounded-xl transition-all border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] flex items-center justify-center gap-1.5 min-h-[36px] btn-terminal"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Send News ({delaySeconds}s)</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Custom News & Player Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-5 theme-bg-card p-6 rounded-2xl border theme-border flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-500">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold theme-text-main uppercase tracking-wider">Custom News Broadcast</h2>
                  <p className="text-xs theme-text-muted font-mono">Send manual market headlines to exchange</p>
                </div>
              </div>

              <form onSubmit={handleSendNews} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold theme-text-muted mb-1 font-mono">Custom Headline</label>
                  <textarea
                    rows={3}
                    required
                    value={newsMessage}
                    onChange={(e) => setNewsMessage(e.target.value)}
                    placeholder="Enter manual news headline..."
                    className="w-full theme-bg-panel border theme-border rounded-xl p-3 text-xs theme-text-main placeholder:theme-text-dim focus:outline-none focus:border-indigo-500 transition-all resize-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold theme-text-muted mb-1 font-mono">Tag Stock (Optional)</label>
                  <select
                    value={selectedStockId}
                    onChange={(e) => setSelectedStockId(e.target.value)}
                    className="w-full theme-bg-panel border theme-border rounded-xl px-3 py-2.5 text-xs theme-text-main focus:outline-none focus:border-indigo-500 transition-all min-h-[40px] font-mono"
                  >
                    <option value="">-- General Market Headline --</option>
                    {stocks.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.symbol} — {s.name} ({s.currentPrice.toFixed(2)} IC)
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={sendingNews || !newsMessage.trim()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs font-mono uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 min-h-[44px] btn-terminal"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>BROADCAST HEADLINE TO EXCHANGE</span>
                </button>
              </form>
            </div>
          </div>

          {/* Interactive Leaderboard */}
          <div className="lg:col-span-7 theme-bg-card p-6 rounded-2xl border theme-border flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-500">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold theme-text-main uppercase tracking-wider font-mono">Live Player Leaderboard</h2>
                  <p className="text-xs theme-text-muted">Click any trader row to monitor full holdings & transaction logs</p>
                </div>
              </div>

              <button
                onClick={fetchLeaderboard}
                disabled={loadingLeaderboard}
                className="flex items-center gap-1 px-3 py-1.5 theme-bg-panel hover:theme-bg-card-hover theme-text-main text-xs font-semibold rounded-xl transition-all border theme-border min-h-[36px] btn-terminal font-mono"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLeaderboard ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b theme-border theme-text-muted font-bold">
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Trader Name</th>
                    <th className="py-2.5 px-3 text-right">Wallet Cash</th>
                    <th className="py-2.5 px-3 text-right">Holdings Value</th>
                    <th className="py-2.5 px-3 text-right">Total Value</th>
                    <th className="py-2.5 px-3 text-center">Monitor</th>
                  </tr>
                </thead>
                <tbody className="divide-y theme-border">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center theme-text-dim">
                        No real player traders logged in yet. Register a trader account on the login screen!
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((trader) => {
                      const isTop3 = trader.rank <= 3;
                      const podiumBg = trader.rank === 1 
                        ? 'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]' 
                        : trader.rank === 2 
                        ? 'bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]' 
                        : trader.rank === 3 
                        ? 'bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]' 
                        : '';

                      return (
                        <tr
                          key={trader.id}
                          onClick={() => handleOpenTraderDetail(trader.id)}
                          className={`theme-bg-card-hover cursor-pointer transition-colors group ${podiumBg} ${
                            isTop3 ? 'border-l-4 border-[var(--accent)]' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-bold theme-text-muted">
                            {trader.rank === 1 ? '🥇 #1' : trader.rank === 2 ? '🥈 #2' : trader.rank === 3 ? '🥉 #3' : `#${trader.rank}`}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold theme-text-main group-hover:text-[var(--accent)] transition-colors">
                              {trader.name}
                            </div>
                            <div className="text-[10px] theme-text-muted">{trader.email}</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono theme-text-muted">
                            {trader.walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} IC
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono theme-text-muted">
                            {trader.holdingsValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} IC
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-[var(--gain-green)]">
                            {trader.totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} IC
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenTraderDetail(trader.id);
                              }}
                              className="p-1.5 bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] group-hover:bg-[var(--accent)] text-[var(--accent)] group-hover:text-slate-950 rounded-lg transition-all min-h-[32px] min-w-[32px] flex items-center justify-center btn-terminal"
                              title="Monitor Trader History"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Section 3: Live Stock Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 theme-bg-card p-4 rounded-2xl border theme-border shadow-sm">
            <div>
              <h2 className="text-base font-bold theme-text-main flex items-center gap-2 font-mono">
                <SlidersHorizontal className="w-5 h-5 text-indigo-500" />
                Live Stock Controls (15 India Sector Stocks)
              </h2>
              <p className="text-xs theme-text-muted font-mono">15 India sector stocks active across Low (~30-100 IC), Mid (~100-500 IC), and High (~1,000-4,000 IC) price tiers</p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-3 w-4 h-4 theme-text-dim" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbol, name, or sector..."
                className="w-full theme-bg-panel border theme-border rounded-xl py-2 pl-9 pr-4 text-xs theme-text-main placeholder:theme-text-dim focus:outline-none focus:border-indigo-500 transition-all min-h-[40px] font-mono"
              />
            </div>
          </div>

          {loadingStocks ? (
            <div className="py-16 text-center theme-text-dim text-sm font-mono">
              Loading 15 India sector stocks...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStocks.map((stock) => {
                const isPositive = stock.percentChange >= 0;
                const customVal = customPercents[stock.id] || '';

                return (
                  <div
                    key={stock.id}
                    className="theme-bg-card p-4 rounded-xl border theme-border flex flex-col justify-between gap-3 shadow-sm hover:border-indigo-500/40 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-extrabold theme-text-main font-mono">{stock.symbol}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold theme-bg-panel theme-text-muted border theme-border">
                            {stock.sector}
                          </span>
                        </div>
                        <div className="text-xs theme-text-muted truncate max-w-[180px]">{stock.name}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-bold font-mono theme-text-main">
                          {stock.currentPrice.toFixed(2)} <span className="text-xs text-emerald-500">IC</span>
                        </div>
                        <div className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                          isPositive
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                        }`}>
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span>{isPositive ? '+' : ''}{stock.percentChange.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t theme-border">
                      <button
                        onClick={() => handleAdjustPrice(stock.id, 5)}
                        disabled={adjustingStockId === stock.id}
                        className="flex-1 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-slate-950 font-bold text-xs rounded-lg transition-all border border-emerald-500/30 flex items-center justify-center gap-1 min-h-[36px] btn-terminal font-mono"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>+5%</span>
                      </button>

                      <button
                        onClick={() => handleAdjustPrice(stock.id, -5)}
                        disabled={adjustingStockId === stock.id}
                        className="flex-1 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-bold text-xs rounded-lg transition-all border border-rose-500/30 flex items-center justify-center gap-1 min-h-[36px] btn-terminal font-mono"
                      >
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>-5%</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="±%"
                          value={customVal}
                          onChange={(e) => setCustomPercents((prev) => ({ ...prev, [stock.id]: e.target.value }))}
                          className="w-16 theme-bg-panel border theme-border rounded-lg py-1.5 px-2 text-xs font-mono theme-text-main text-center focus:outline-none focus:border-indigo-500 min-h-[36px]"
                        />
                        <button
                          onClick={() => {
                            const val = parseFloat(customVal);
                            if (!isNaN(val)) handleAdjustPrice(stock.id, val);
                          }}
                          disabled={adjustingStockId === stock.id || !customVal}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all disabled:opacity-40 min-h-[36px] btn-terminal font-mono"
                        >
                          GO
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>

      {/* Admin Trader Drill-Down Modal */}
      <AdminTraderDetailModal
        traderId={selectedTraderId}
        isOpen={isTraderModalOpen}
        onClose={() => setIsTraderModalOpen(false)}
      />
    </div>
  );
}
