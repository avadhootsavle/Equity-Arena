import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Trophy, Search, RefreshCw, CheckCircle2, AlertCircle, Sparkles, SlidersHorizontal, Clock, Zap, Eye, Sun, Moon, RotateCcw, Bell, Users,
  ThumbsUp, ThumbsDown, Newspaper, PieChart, BarChart3, Filter, ArrowUpRight, ArrowDownRight, Layers, Activity,
  Play, Square, Coffee, Lock, Check, X, ChevronRight, HelpCircle
} from 'lucide-react';

const SECTOR_TO_STOCK_MAP = {
  'Agriculture': { symbol: 'ANAG', name: 'Annapurna Agro' },
  'Retail': { symbol: 'BRM', name: 'Bazaar Retail Mart' },
  'Media/Entertainment': { symbol: 'SWST', name: 'Swarna Studios' },
  'Renewable Energy': { symbol: 'SGE', name: 'Surya Green Energy' },
  'Shipping/Logistics': { symbol: 'GSL', name: 'Ganga Shipping Lines' },
  'Aviation': { symbol: 'ABAL', name: 'AirBharat Airlines' },
  'Telecom': { symbol: 'BWT', name: 'BharatWave Telecom' },
  'Automobile': { symbol: 'HTM', name: 'Hindustan TurboMotors' },
  'Pharmaceuticals': { symbol: 'SANP', name: 'Sanjeevani Pharma' },
  'Technology': { symbol: 'NITI', name: 'Nimbus InfoTech India' },
  'Real Estate': { symbol: 'MRI', name: 'Meridian Realty India' },
  'Oil & Gas': { symbol: 'BPTE', name: 'Bharat PetroEnergy' },
  'Defense': { symbol: 'IDW', name: 'Indus Defence Works' },
  'Banking/Finance': { symbol: 'RTB', name: 'Rashtriya Trust Bank' },
  'Precious Metals': { symbol: 'SGM', name: 'Suvarna Gold Mining' }
};

const fmtMoney = (n, d = 2) =>
  Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d
  });

export function AdminDashboard() {
  const adminSession = useSession();
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const { theme, toggleTheme } = useTheme();

  const [newsCompanyFilter, setNewsCompanyFilter] = useState('ALL');
  const [stockSortMode, setStockSortMode] = useState('CHANGE'); // 'CHANGE' (Gainers top) | 'ALPHA' (A-Z)

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
  const [inlineConfirmTplId, setInlineConfirmTplId] = useState(null);
  const [delaySeconds, setDelaySeconds] = useState(30);
  const [triggeringTemplateId, setTriggeringTemplateId] = useState(null);

  // 20-minute recurring news reminder timer (1200 seconds)
  const [reminderSeconds, setReminderSeconds] = useState(1200);

  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [stockHoldingsMap, setStockHoldingsMap] = useState({});
  const [liveTradeFeed, setLiveTradeFeed] = useState([]);

  // Admin Trader Drill-Down Modal state
  const [selectedTraderId, setSelectedTraderId] = useState(null);
  const [isTraderModalOpen, setIsTraderModalOpen] = useState(false);

  const [toast, setToast] = useState(null);

  /* Break Modal State */
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState(10);
  const [breakNote, setBreakNote] = useState("Refreshment Break — Grab snacks, water, and take a quick rest!");

  const [sessionDurationMins, setSessionDurationMins] = useState(180);
  const [isStartingSession, setIsStartingSession] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const resetNewsTimer = () => {
    setReminderSeconds(1200);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setReminderSeconds((prev) => {
        if (prev <= 1) {
          playNewsChime();
          return 1200; // Reset countdown
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleStartNewSession = async (overrideDuration) => {
    setIsStartingSession(true);
    const mins = overrideDuration || parseInt(sessionDurationMins, 10) || 180;
    try {
      const data = await apiFetch('/admin/session/start', {
        method: 'POST',
        body: JSON.stringify({
          durationMinutes: mins,
          liquidationBufferMinutes: 5,
          macroCycleIntervalMinutes: 15
        })
      });
      resetNewsTimer();
      showToast(data.message || `New ${mins}-minute trading session started!`);
    } catch (err) {
      showToast(err.message || 'Failed to start session', 'error');
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleStartBreak = async (e) => {
    if (e) e.preventDefault();
    try {
      const data = await apiFetch('/admin/session/pause', {
        method: 'POST',
        body: JSON.stringify({
          breakMinutes: parseInt(breakMinutes, 10) || 10,
          note: breakNote
        })
      });
      showToast(data.message || `Market paused for ${breakMinutes}-minute break!`);
      setShowBreakModal(false);
    } catch (err) {
      showToast(err.message || 'Failed to start break', 'error');
    }
  };

  const handleResumeSession = async () => {
    try {
      const data = await apiFetch('/admin/session/resume', { method: 'POST' });
      showToast(data.message || 'Market resumed!');
    } catch (err) {
      showToast(err.message || 'Failed to resume session', 'error');
    }
  };

  const handleStopSession = async () => {
    if (!window.confirm('Are you sure you want to STOP/CLOSE the trading session? This will lock trading for all players.')) return;
    try {
      const data = await apiFetch('/admin/session/stop', { method: 'POST' });
      showToast(data.message || 'Trading session stopped by Admin.');
    } catch (err) {
      showToast(err.message || 'Failed to stop session', 'error');
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
    } catch (err) {
      console.error('Failed to fetch news templates:', err);
    }
  };

  const fetchStockHoldings = async () => {
    try {
      const data = await apiFetch('/admin/stock-holdings');
      setStockHoldingsMap(data || {});
    } catch (err) {
      console.error('Failed to fetch stock holdings:', err);
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
    fetchStockHoldings();

    const interval = setInterval(() => {
      fetchLeaderboard();
      fetchNewsTemplates();
      fetchStockHoldings();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Real-time socket listeners for live price & trader activity
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

    const handleTradeExecuted = (data) => {
      setLiveTradeFeed((prev) => [
        {
          id: Date.now() + Math.random(),
          traderName: data.traderName || data.userName || data.user?.name || 'Trader',
          action: data.side || data.type || 'BUY',
          quantity: data.quantity || 1,
          symbol: data.symbol || data.stockSymbol || 'STK',
          price: data.price || data.executedPrice || 0,
          timestamp: Date.now()
        },
        ...prev
      ].slice(0, 30));
    };

    socket.on('connect', handleConnect);
    socket.on('stock:update', handleStockUpdate);
    socket.on('trade:executed', handleTradeExecuted);
    socket.on('order:executed', handleTradeExecuted);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('stock:update', handleStockUpdate);
      socket.off('trade:executed', handleTradeExecuted);
      socket.off('order:executed', handleTradeExecuted);
    };
  }, [socket]);

  const handleAdjustPrice = async (stockId, percent) => {
    setAdjustingStockId(stockId);
    try {
      const data = await apiFetch(`/admin/stock/${stockId}/adjust`, {
        method: 'POST',
        body: JSON.stringify({ percent })
      });
      fetchStocks();
      const sign = percent >= 0 ? '+' : '';
      showToast(`${data.stock.symbol} adjusted ${sign}${percent}% → ${data.stock.currentPrice.toFixed(2)} IC`);
      setCustomPercents((prev) => ({ ...prev, [stockId]: '' }));
      fetchStockHoldings();
      fetchLeaderboard();
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

      setRecentNews((prev) => [data.news, ...prev]);
      setNewsMessage('');
      setSelectedStockId('');
      resetNewsTimer();
      showToast('News broadcasted to all connected traders!');
    } catch (err) {
      showToast(err.message || 'Failed to send news', 'error');
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

      setUsedTemplateIds((prev) => [...prev, templateId]);
      setInlineConfirmTplId(null);
      fetchNewsTemplates();
      resetNewsTimer();
      showToast(data.message || 'News headline broadcasted to exchange!');
    } catch (err) {
      showToast(err.message || 'Failed to trigger news template', 'error');
    } finally {
      setTriggeringTemplateId(null);
    }
  };

  const handleOpenTraderDetail = (traderId) => {
    setSelectedTraderId(traderId);
    setIsTraderModalOpen(true);
  };

  // Stock sorting logic (Gainers top vs A-Z)
  const sortedStocks = useMemo(() => {
    const list = [...stocks];
    if (stockSortMode === 'CHANGE') {
      return list.sort((a, b) => (Number(b.percentChange) || 0) - (Number(a.percentChange) || 0));
    }
    return list.sort((a, b) => a.symbol.localeCompare(b.symbol));
  }, [stocks, stockSortMode]);

  // News studio lists (Good News Left, Bad News Right)
  const filteredGoodNews = templates.filter((tpl) => {
    if (tpl.effectPercent <= 0) return false;
    if (newsCompanyFilter === 'ALL') return true;
    const mapped = SECTOR_TO_STOCK_MAP[tpl.sector];
    return mapped?.symbol === newsCompanyFilter;
  });

  const filteredBadNews = templates.filter((tpl) => {
    if (tpl.effectPercent >= 0) return false;
    if (newsCompanyFilter === 'ALL') return true;
    const mapped = SECTOR_TO_STOCK_MAP[tpl.sector];
    return mapped?.symbol === newsCompanyFilter;
  });

  const isSessionRunning = adminSession?.status === 'ACTIVE' || adminSession?.status === 'PAUSED';

  return (
    <div className="min-h-screen theme-bg-main theme-text-main flex flex-col font-sans transition-colors duration-200">
      
      {/* Toast Notification Popup */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl border text-xs font-mono font-bold flex items-center gap-2 animate-bounce ${
            toast.type === 'error'
              ? 'bg-rose-950 text-rose-200 border-rose-500'
              : 'bg-emerald-950 text-emerald-200 border-emerald-500'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navigation Header */}
      <header className="theme-bg-header border-b theme-border sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold theme-text-main font-mono">EQUITY ARENA</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-500/15 text-rose-500 border border-rose-500/30 uppercase font-mono">
                  ADMIN OPERATIONS DESK
                </span>
              </div>
              <p className="text-[11px] theme-text-muted font-mono">Live Tournament Operations & Stock Control</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border theme-border theme-bg-panel theme-text-muted hover:theme-text-main transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Toggle Dark / Light Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-amber-400" />}
            </button>

            <div className="flex items-center gap-2 border-l theme-border pl-3">
              <div className="text-right hidden sm:block font-mono">
                <div className="text-xs font-bold theme-text-main">{user?.name || 'Admin Host'}</div>
                <div className="text-[10px] theme-text-dim">{user?.email}</div>
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

      {/* Main 4-Section Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        {/* ====================================================================== */}
        {/* SECTION 1: SESSION CONTROL (TOP OF PAGE, ALWAYS VISIBLE)               */}
        {/* ====================================================================== */}
        <section className="theme-bg-panel p-5 rounded-2xl border theme-border shadow-lg space-y-4 font-mono">
          <div className="flex items-center justify-between border-b theme-border pb-3 flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl border ${
                adminSession?.status === 'ACTIVE'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : adminSession?.status === 'PAUSED'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                  : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
              }`}>
                {adminSession?.status === 'ACTIVE' ? <Play className="w-5 h-5 fill-current" /> : adminSession?.status === 'PAUSED' ? <Coffee className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-xs text-amber-400 font-extrabold uppercase tracking-wider">SECTION 1: MASTER SESSION CONTROL</div>
                <div className="text-sm font-bold theme-text-main flex items-center gap-2">
                  {adminSession?.status === 'ACTIVE' ? (
                    <span className="text-emerald-400">SESSION RUNNING — TRADING FLOOR UNLOCKED</span>
                  ) : adminSession?.status === 'PAUSED' ? (
                    <span className="text-amber-400">MARKET ON REFRESHMENT BREAK</span>
                  ) : (
                    <span className="theme-text-muted">MARKET CLOSED — START SESSION TO LET TRADERS TRADE</span>
                  )}
                </div>
              </div>
            </div>

            {/* 20-Minute News Reminder Timer */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border theme-border theme-bg-card text-xs shadow-sm">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <div>
                <span className="theme-text-dim text-[9px] block font-bold uppercase tracking-wider">NEWS REMINDER TIMER</span>
                <span className={`font-bold font-mono ${reminderSeconds < 180 ? 'text-rose-400 animate-bounce' : 'theme-text-main'}`}>
                  {Math.floor(reminderSeconds / 60).toString().padStart(2, '0')}:{(reminderSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <button
                type="button"
                onClick={resetNewsTimer}
                className="ml-1 p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                title="Reset 20-minute news reminder"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Session Action Bar */}
          <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
            {!isSessionRunning ? (
              /* When session is NOT running: Start Session Controls */
              <div className="flex items-center gap-3 flex-wrap w-full">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold theme-text-dim uppercase">Duration:</span>
                  {[30, 60, 180].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSessionDurationMins(m)}
                      className={`px-3 py-1.5 text-xs font-extrabold rounded-xl border transition-all ${
                        sessionDurationMins === m
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                          : 'theme-bg-card theme-text-main theme-border hover:border-emerald-500/50'
                      }`}
                    >
                      {m} Mins
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="600"
                    value={sessionDurationMins}
                    onChange={(e) => setSessionDurationMins(parseInt(e.target.value, 10) || 180)}
                    className="w-24 px-3 py-1.5 rounded-xl border theme-border theme-bg-input text-xs font-bold theme-text-main focus:outline-none"
                    placeholder="Custom Mins"
                  />
                  <button
                    type="button"
                    onClick={() => handleStartNewSession()}
                    disabled={isStartingSession}
                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase rounded-xl transition-all shadow-lg flex items-center gap-2 btn-terminal disabled:opacity-50 min-h-[40px]"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{isStartingSession ? 'STARTING...' : 'START SESSION NOW'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* When session IS running: Live Countdown Timer & Master Controls */
              <div className="flex items-center justify-between flex-wrap gap-4 w-full">
                <div className="flex items-center gap-4">
                  <GameClock sessionData={adminSession} title="SESSION CLOCK" size="large" />
                </div>

                <div className="flex items-center gap-2">
                  {adminSession?.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => setShowBreakModal(true)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase rounded-xl transition-all shadow-md flex items-center gap-1.5 btn-terminal min-h-[40px]"
                    >
                      <Coffee className="w-4 h-4" />
                      <span>PAUSE BREAK</span>
                    </button>
                  )}

                  {adminSession?.status === 'PAUSED' && (
                    <button
                      type="button"
                      onClick={handleResumeSession}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase rounded-xl transition-all shadow-md flex items-center gap-1.5 btn-terminal animate-pulse min-h-[40px]"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>RESUME MARKET</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleStopSession}
                    className="px-4 py-2 border border-rose-500/60 hover:bg-rose-500/20 text-rose-400 font-extrabold text-xs uppercase rounded-xl transition-all flex items-center gap-1.5 min-h-[40px]"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>STOP SESSION</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>


        {/* ====================================================================== */}
        {/* SECTION 2: SEND NEWS STUDIO (MOST FREQUENT ACTION — 2 COLUMNS)          */}
        {/* ====================================================================== */}
        <section className="theme-bg-panel p-5 rounded-2xl border theme-border shadow-lg space-y-4 font-mono">
          <div className="flex items-center justify-between border-b theme-border pb-3 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-indigo-400">
                <Newspaper className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs text-amber-400 font-extrabold uppercase tracking-wider">SECTION 2: SEND NEWS STUDIO</h2>
                <p className="text-sm font-bold theme-text-main">Tap any prebuilt headline to trigger instant market moves</p>
              </div>
            </div>

            {/* Filter by Stock Symbol */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold theme-text-dim uppercase">Filter Company:</label>
              <select
                value={newsCompanyFilter}
                onChange={(e) => setNewsCompanyFilter(e.target.value)}
                className="theme-bg-input border theme-border rounded-xl px-3 py-1.5 text-xs font-mono font-bold theme-text-main focus:outline-none focus:border-indigo-500 min-h-[36px]"
              >
                <option value="ALL">All 15 Companies</option>
                {Object.values(SECTOR_TO_STOCK_MAP).map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} — {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Two Side-by-Side Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* LEFT COLUMN: GOOD NEWS (GREEN HEADER) */}
            <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/10 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <ThumbsUp className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-wider">GOOD NEWS / BULLISH (PUMPS)</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {filteredGoodNews.length} Templates
                </span>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredGoodNews.map((tpl) => {
                  const isUsed = usedTemplateIds.includes(tpl.id);
                  const isConfirming = inlineConfirmTplId === tpl.id;
                  const company = SECTOR_TO_STOCK_MAP[tpl.sector] || { symbol: 'MKT' };

                  return (
                    <div key={tpl.id} className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setInlineConfirmTplId(isConfirming ? null : tpl.id)}
                        className={`w-full text-left p-3 rounded-xl border text-xs font-mono transition-all flex items-start justify-between gap-2 shadow-sm ${
                          isUsed
                            ? 'bg-slate-900/60 border-slate-800 text-slate-500 line-through opacity-70'
                            : 'theme-bg-card border-emerald-500/30 hover:border-emerald-400 text-emerald-200'
                        }`}
                      >
                        <div>
                          <span className="font-extrabold text-emerald-400 mr-1">[{company.symbol}]</span>
                          <span>{tpl.headline}</span>
                        </div>
                        {isUsed ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 flex-shrink-0">
                            SENT
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500 text-slate-950 font-black flex-shrink-0">
                            +{tpl.effectPercent}%
                          </span>
                        )}
                      </button>

                      {/* Inline Confirmation Drawer */}
                      {isConfirming && (
                        <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-500 text-xs font-mono space-y-2 animate-fadeIn">
                          <div className="text-emerald-300 font-bold">Broadcast this bullish headline?</div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] theme-text-dim uppercase font-bold">Delay:</span>
                            <select
                              value={delaySeconds}
                              onChange={(e) => setDelaySeconds(e.target.value)}
                              className="theme-bg-input border theme-border rounded-lg px-2 py-1 text-xs theme-text-main"
                            >
                              <option value={15}>15s Delay</option>
                              <option value={30}>30s Delay</option>
                              <option value={60}>60s Delay</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleTriggerTemplate(tpl.id)}
                              disabled={triggeringTemplateId === tpl.id}
                              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg shadow"
                            >
                              {triggeringTemplateId === tpl.id ? 'BROADCASTING...' : 'SEND NOW'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineConfirmTplId(null)}
                              className="px-2 py-1 text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: BAD NEWS (RED HEADER) */}
            <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/10 space-y-3">
              <div className="flex items-center justify-between border-b border-rose-500/30 pb-2">
                <div className="flex items-center gap-2 text-rose-400">
                  <ThumbsDown className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-wider">BAD NEWS / BEARISH (DUMPS)</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {filteredBadNews.length} Templates
                </span>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredBadNews.map((tpl) => {
                  const isUsed = usedTemplateIds.includes(tpl.id);
                  const isConfirming = inlineConfirmTplId === tpl.id;
                  const company = SECTOR_TO_STOCK_MAP[tpl.sector] || { symbol: 'MKT' };

                  return (
                    <div key={tpl.id} className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setInlineConfirmTplId(isConfirming ? null : tpl.id)}
                        className={`w-full text-left p-3 rounded-xl border text-xs font-mono transition-all flex items-start justify-between gap-2 shadow-sm ${
                          isUsed
                            ? 'bg-slate-900/60 border-slate-800 text-slate-500 line-through opacity-70'
                            : 'theme-bg-card border-rose-500/30 hover:border-rose-400 text-rose-200'
                        }`}
                      >
                        <div>
                          <span className="font-extrabold text-rose-400 mr-1">[{company.symbol}]</span>
                          <span>{tpl.headline}</span>
                        </div>
                        {isUsed ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/30 text-rose-400 border border-rose-500/50 flex-shrink-0">
                            SENT
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500 text-white font-black flex-shrink-0">
                            {tpl.effectPercent}%
                          </span>
                        )}
                      </button>

                      {/* Inline Confirmation Drawer */}
                      {isConfirming && (
                        <div className="p-3 rounded-xl bg-rose-950 border border-rose-500 text-xs font-mono space-y-2 animate-fadeIn">
                          <div className="text-rose-300 font-bold">Broadcast this bearish headline?</div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] theme-text-dim uppercase font-bold">Delay:</span>
                            <select
                              value={delaySeconds}
                              onChange={(e) => setDelaySeconds(e.target.value)}
                              className="theme-bg-input border theme-border rounded-lg px-2 py-1 text-xs theme-text-main"
                            >
                              <option value={15}>15s Delay</option>
                              <option value={30}>30s Delay</option>
                              <option value={60}>60s Delay</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleTriggerTemplate(tpl.id)}
                              disabled={triggeringTemplateId === tpl.id}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-lg shadow"
                            >
                              {triggeringTemplateId === tpl.id ? 'BROADCASTING...' : 'SEND NOW'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineConfirmTplId(null)}
                              className="px-2 py-1 text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Custom News Broadcast Form */}
          <div className="pt-3 border-t theme-border">
            <form onSubmit={handleSendNews} className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                required
                value={newsMessage}
                onChange={(e) => setNewsMessage(e.target.value)}
                placeholder="Type custom manual breaking news headline..."
                className="flex-1 min-w-[240px] px-3 py-2 rounded-xl border theme-border theme-bg-input text-xs font-mono theme-text-main focus:outline-none focus:border-indigo-500"
              />
              <select
                value={selectedStockId}
                onChange={(e) => setSelectedStockId(e.target.value)}
                className="px-3 py-2 rounded-xl border theme-border theme-bg-input text-xs font-mono theme-text-main focus:outline-none"
              >
                <option value="">Target: Whole Market</option>
                {stocks.map((s) => (
                  <option key={s.id} value={s.id}>{s.symbol} — {s.name}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={sendingNews || !newsMessage.trim()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow flex items-center gap-1.5 btn-terminal disabled:opacity-50 min-h-[38px]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingNews ? 'SENDING...' : 'BROADCAST CUSTOM'}</span>
              </button>
            </form>
          </div>
        </section>


        {/* ====================================================================== */}
        {/* SECTION 3: STOCK PRICE CONTROLS (SINGLE ROW PER STOCK)                  */}
        {/* ====================================================================== */}
        <section className="theme-bg-panel p-5 rounded-2xl border theme-border shadow-lg space-y-4 font-mono">
          <div className="flex items-center justify-between border-b theme-border pb-3 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-cyan-500/20 border border-cyan-500/40 rounded-xl text-cyan-400">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs text-amber-400 font-extrabold uppercase tracking-wider">SECTION 3: STOCK PRICE CONTROLS</h2>
                <p className="text-sm font-bold theme-text-main">Instant price controls for all 15 exchange listings</p>
              </div>
            </div>

            {/* Sort Order Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold theme-text-dim uppercase">Sort By:</span>
              <button
                type="button"
                onClick={() => setStockSortMode(stockSortMode === 'CHANGE' ? 'ALPHA' : 'CHANGE')}
                className="px-3 py-1.5 rounded-xl border theme-border theme-bg-card text-xs font-bold theme-text-main flex items-center gap-1.5"
              >
                {stockSortMode === 'CHANGE' ? 'Gainers Top (% Change)' : 'Alphabetical (A-Z)'}
              </button>
            </div>
          </div>

          {/* Compact Scannable Stock Rows */}
          <div className="space-y-2">
            {sortedStocks.map((s) => {
              const isUp = Number(s.percentChange) >= 0;
              const isAdjusting = adjustingStockId === s.id;

              return (
                <div
                  key={s.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between flex-wrap gap-3 ${
                    isUp
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-rose-950/20 border-rose-500/30'
                  }`}
                >
                  {/* Stock Symbol & Spot Price */}
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                      isUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {s.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm theme-text-main">{s.symbol}</span>
                        <span className={`text-xs font-extrabold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isUp ? '+' : ''}{Number(s.percentChange || 0).toFixed(2)}%
                        </span>
                      </div>
                      <div className="text-[11px] theme-text-dim">{s.name} ({s.sector})</div>
                    </div>
                  </div>

                  <div className="text-right min-w-[100px]">
                    <div className="text-base font-black theme-text-main">{fmtMoney(s.currentPrice)} IC</div>
                    <div className="text-[10px] theme-text-dim">Base: {fmtMoney(s.basePrice)} IC</div>
                  </div>

                  {/* 5 Controls: 4 Quick Presets + 1 Custom Input */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      disabled={isAdjusting}
                      onClick={() => handleAdjustPrice(s.id, 10)}
                      className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-black text-xs rounded-lg border border-emerald-500/40 transition-all"
                    >
                      +10%
                    </button>
                    <button
                      type="button"
                      disabled={isAdjusting}
                      onClick={() => handleAdjustPrice(s.id, 25)}
                      className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-black text-xs rounded-lg border border-emerald-500/40 transition-all"
                    >
                      +25%
                    </button>
                    <button
                      type="button"
                      disabled={isAdjusting}
                      onClick={() => handleAdjustPrice(s.id, -10)}
                      className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white font-black text-xs rounded-lg border border-rose-500/40 transition-all"
                    >
                      -10%
                    </button>
                    <button
                      type="button"
                      disabled={isAdjusting}
                      onClick={() => handleAdjustPrice(s.id, -25)}
                      className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white font-black text-xs rounded-lg border border-rose-500/40 transition-all"
                    >
                      -25%
                    </button>

                    {/* Custom % Input */}
                    <div className="flex items-center gap-1 ml-1">
                      <input
                        type="number"
                        step="1"
                        value={customPercents[s.id] || ''}
                        onChange={(e) => setCustomPercents({ ...customPercents, [s.id]: e.target.value })}
                        placeholder="% (e.g. 15)"
                        className="w-16 px-2 py-1 rounded-lg border theme-border theme-bg-input text-xs font-bold theme-text-main focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={isAdjusting || !customPercents[s.id]}
                        onClick={() => handleAdjustPrice(s.id, parseFloat(customPercents[s.id]))}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg disabled:opacity-40"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>


        {/* ====================================================================== */}
        {/* SECTION 4: LIVE TRADER ACTIVITY & TOURNAMENT LEADERBOARD               */}
        {/* ====================================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono">
          
          {/* LIVE TRADER ACTIVITY STREAM */}
          <div className="theme-bg-panel p-5 rounded-2xl border theme-border shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b theme-border pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xs text-amber-400 font-extrabold uppercase tracking-wider">LIVE TRADER ACTIVITY FEED</h2>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                REAL-TIME STREAM
              </span>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {liveTradeFeed.length === 0 ? (
                <div className="py-12 text-center theme-text-dim text-xs border theme-border rounded-xl">
                  Awaiting live trades from floor...
                </div>
              ) : (
                liveTradeFeed.map((item) => (
                  <div key={item.id} className="p-2.5 rounded-xl border theme-border theme-bg-card flex items-center justify-between text-xs animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        item.action === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {item.action}
                      </span>
                      <span className="font-bold theme-text-main">{item.traderName}</span>
                      <span className="theme-text-dim">traded {item.quantity} sh of <span className="theme-text-main font-bold">{item.symbol}</span></span>
                    </div>
                    <span className="font-bold theme-text-main">{fmtMoney(item.price)} IC</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* TOURNAMENT LEADERBOARD */}
          <div className="theme-bg-panel p-5 rounded-2xl border theme-border shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b theme-border pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h2 className="text-xs text-amber-400 font-extrabold uppercase tracking-wider">TOURNAMENT LEADERBOARD</h2>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {leaderboard.length} Players Ranked
              </span>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {leaderboard.map((entry, idx) => (
                <div key={entry.id || idx} className="p-2.5 rounded-xl border theme-border theme-bg-card flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] ${
                      idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : idx === 2 ? 'bg-amber-700 text-white' : 'theme-bg-panel theme-text-muted'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-bold theme-text-main">{entry.name}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-emerald-400">{fmtMoney(entry.portfolioValue || entry.totalNetWorth)} IC</span>
                    <button
                      type="button"
                      onClick={() => handleOpenTraderDetail(entry.id)}
                      className="px-2 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white border border-indigo-500/40 text-[10px] font-bold"
                    >
                      Audit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>

      </main>

      {/* Admin Break Setup Modal */}
      {showBreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn font-mono">
          <div className="w-full max-w-md theme-bg-panel border theme-border rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b theme-border pb-3">
              <div className="flex items-center gap-2">
                <Coffee className="w-6 h-6 text-amber-400 animate-bounce" />
                <h3 className="text-sm font-extrabold theme-text-main">START REFRESHMENT BREAK</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBreakModal(false)}
                className="text-slate-400 hover:text-white text-base font-bold"
              >
                X
              </button>
            </div>

            <form onSubmit={handleStartBreak} className="space-y-4">
              <div>
                <label className="text-xs font-bold theme-text-dim block mb-2 uppercase tracking-wider">
                  Break Duration (Minutes)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[5, 10, 15, 20].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setBreakMinutes(m)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        breakMinutes === m
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md'
                          : 'theme-bg-card theme-text-main theme-border hover:border-amber-500/50'
                      }`}
                    >
                      {m} Mins
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(parseInt(e.target.value, 10) || 10)}
                  className="w-full px-3 py-2 rounded-xl border theme-border theme-bg-input text-xs font-bold theme-text-main"
                  placeholder="Custom Minutes (e.g. 15)"
                />
              </div>

              <div>
                <label className="text-xs font-bold theme-text-dim block mb-2 uppercase tracking-wider">
                  Trader Announcement / Note
                </label>
                <textarea
                  rows="3"
                  value={breakNote}
                  onChange={(e) => setBreakNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border theme-border theme-bg-input text-xs font-mono theme-text-main resize-none focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Refreshment Break — Grab snacks, water, and take a quick rest!"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBreakModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl border theme-border theme-bg-card theme-text-muted hover:theme-text-main"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-black rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg flex items-center justify-center gap-1.5"
                >
                  <Coffee className="w-4 h-4" />
                  START {breakMinutes}M BREAK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Trader Drill-Down Modal */}
      <AdminTraderDetailModal
        traderId={selectedTraderId}
        isOpen={isTraderModalOpen}
        onClose={() => setIsTraderModalOpen(false)}
      />
    </div>
  );
}
