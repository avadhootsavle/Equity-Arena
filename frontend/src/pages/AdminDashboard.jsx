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
  Play, Square, Coffee, Lock
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

export function AdminDashboard() {
  const adminSession = useSession();
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const { theme, toggleTheme } = useTheme();

  const [activeAdminTab, setActiveAdminTab] = useState('ALL'); // ALL | NEWS | DIAGRAM | STOCKS | LEADERBOARD | SETTINGS
  const [newsCompanyFilter, setNewsCompanyFilter] = useState('ALL');

  const [stocks, setStocks] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [customPercents, setCustomPercents] = useState({});
  const [adjustingStockId, setAdjustingStockId] = useState(null);

  const [bulkPercent, setBulkPercent] = useState('');
  const [isBulkAdjusting, setIsBulkAdjusting] = useState(false);

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
  const [stockHoldingsMap, setStockHoldingsMap] = useState({});

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

  /* Break Modal State */
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState(10);
  const [breakNote, setBreakNote] = useState("☕ Refreshment Break — Grab snacks, water, and take a quick rest!");

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

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
      showToast(data.message || 'New 3-hour trading session started!');
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
      setPendingDelayedNews(data.pendingDelayedNews || []);
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
      fetchStocks();
      const sign = percent >= 0 ? '+' : '';
      showToast(`${data.stock.symbol} price adjusted by ${sign}${percent}% → ${data.stock.currentPrice.toFixed(2)} IC`);
      setCustomPercents((prev) => ({ ...prev, [stockId]: '' }));
      fetchStockHoldings();
      fetchLeaderboard();
    } catch (err) {
      showToast(err.message || 'Price adjustment failed', 'error');
    } finally {
      setAdjustingStockId(null);
    }
  };

  const handleAdjustAllPrices = async (percent) => {
    setIsBulkAdjusting(true);
    try {
      const data = await apiFetch('/admin/market/adjust-all', {
        method: 'POST',
        body: JSON.stringify({ percent })
      });
      fetchStocks();
      fetchStockHoldings();
      fetchLeaderboard();
      const sign = percent >= 0 ? '+' : '';
      showToast(`Market Move: All stocks adjusted by ${sign}${percent}%!`);
      setBulkPercent('');
    } catch (err) {
      showToast(err.message || 'Market adjust failed', 'error');
    } finally {
      setIsBulkAdjusting(false);
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

  // Filter stocks by search
  const filteredStocks = stocks.filter(
    (s) =>
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Derived analytical metrics for Top KPI bar & Diagrams
  const totalMarketCap = stocks.reduce((sum, s) => sum + s.currentPrice, 0);
  
  const totalSharesInCirculation = Object.values(stockHoldingsMap)
    .flat()
    .reduce((sum, h) => sum + (h.quantity || 0), 0);

  const bullishCount = stocks.filter((s) => s.percentChange >= 0).length;
  const bullishPercent = stocks.length > 0 ? Math.round((bullishCount / stocks.length) * 100) : 0;
  const bearishPercent = 100 - bullishPercent;

  // Most played stock (stock with most trader holders)
  const mostPopularStock = useMemo(() => {
    if (stocks.length === 0) return null;
    let best = null;
    let maxHolders = -1;

    for (const s of stocks) {
      const holders = stockHoldingsMap[s.id] || [];
      if (holders.length > maxHolders) {
        maxHolders = holders.length;
        const totalQty = holders.reduce((sum, h) => sum + h.quantity, 0);
        best = {
          symbol: s.symbol,
          name: s.name,
          holderCount: holders.length,
          sharesCount: totalQty
        };
      }
    }
    return best;
  }, [stocks, stockHoldingsMap]);

  // News studio filtered lists (Good News vs Bad News)
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

  const renderNewsTemplateCard = (tpl, type) => {
    const isUsed = usedTemplateIds.includes(tpl.id);
    const company = SECTOR_TO_STOCK_MAP[tpl.sector] || { symbol: 'MKT', name: tpl.sector };
    const isPositive = tpl.effectPercent >= 0;

    return (
      <div
        key={tpl.id}
        className={`theme-bg-panel p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 shadow-sm ${
          isUsed
            ? 'border-slate-700/60 opacity-80'
            : type === 'GOOD'
            ? 'border-emerald-500/30 hover:border-emerald-500'
            : 'border-rose-500/30 hover:border-rose-500'
        }`}
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold font-mono bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                🏢 {company.symbol} — {company.name}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold theme-bg-card theme-text-muted border theme-border font-mono">
                {tpl.sector}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {isUsed ? (
                <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500 text-slate-950 border border-emerald-400 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3 h-3" />
                  BROADCASTED
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[9px] font-bold theme-bg-card theme-text-dim border theme-border font-mono">
                  READY TO SEND
                </span>
              )}

              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-extrabold ${
                isPositive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {isPositive ? '📈 PUMP +' : '📉 DUMP '}{tpl.effectPercent}%
              </span>
            </div>
          </div>

          <p className="text-xs theme-text-main font-bold leading-snug">
            "{tpl.headline}"
          </p>
          {tpl.notes && (
            <p className="text-[11px] theme-text-muted mt-1 italic font-mono">
              Analysis: {tpl.notes}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleTriggerTemplate(tpl.id)}
          disabled={triggeringTemplateId === tpl.id}
          className={`w-full py-2 font-black text-xs rounded-xl transition-all border flex items-center justify-center gap-1.5 min-h-[36px] btn-terminal font-mono ${
            type === 'GOOD'
              ? 'bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border-emerald-500/30'
              : 'bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border-rose-500/30'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{isUsed ? 'RE-BROADCAST HEADLINE' : `BROADCAST ${type === 'GOOD' ? 'GOOD' : 'BAD'} NEWS (${delaySeconds}s)`}</span>
        </button>
      </div>
    );
  };

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

            {/* Master Session Controls Bar */}
            <div className="flex items-center gap-2 font-mono">
              {(!adminSession || adminSession.status === 'NOT_STARTED' || adminSession.status === 'ENDED') && (
                <button
                  onClick={handleStartNewSession}
                  disabled={isStartingSession}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md min-h-[38px] btn-terminal"
                  title="Start 3-Hour Trading Session"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>START SESSION</span>
                </button>
              )}

              {adminSession?.status === 'ACTIVE' && (
                <button
                  onClick={() => setShowBreakModal(true)}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md min-h-[38px] btn-terminal"
                  title="Configure and start break (10m, 5m, 4m, 2m)"
                >
                  <Coffee className="w-4 h-4" />
                  <span>PAUSE BREAK</span>
                </button>
              )}

              {adminSession?.status === 'PAUSED' && (
                <button
                  onClick={handleResumeSession}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md min-h-[38px] btn-terminal animate-pulse"
                  title="Resume market trading floor"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>RESUME MARKET</span>
                </button>
              )}

              {(adminSession?.status === 'ACTIVE' || adminSession?.status === 'PAUSED') && (
                <button
                  onClick={handleStopSession}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md min-h-[38px] btn-terminal"
                  title="Stop & Close Trading Session"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>STOP MARKET</span>
                </button>
              )}
            </div>

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

        {/* Top Analytical Intelligence Desk */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* KPI 1: Market Cap */}
          <div className="theme-bg-card p-4 rounded-xl border theme-border shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase theme-text-muted font-bold">Total Market Cap</div>
              <div className="text-lg font-extrabold font-mono theme-text-main mt-0.5">
                {totalMarketCap.toLocaleString('en-US', { maximumFractionDigits: 0 })} <span className="text-xs text-emerald-500">IC</span>
              </div>
              <div className="text-[10px] theme-text-dim font-mono mt-0.5">Across 15 India Sector Stocks</div>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 2: Active Players */}
          <div className="theme-bg-card p-4 rounded-xl border theme-border shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase theme-text-muted font-bold">Active Player Traders</div>
              <div className="text-lg font-extrabold font-mono theme-text-main mt-0.5">
                {leaderboard.length} <span className="text-xs text-indigo-400">Traders</span>
              </div>
              <div className="text-[10px] theme-text-dim font-mono mt-0.5">Participating in live session</div>
            </div>
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-500">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 3: Most Popular Stock */}
          <div className="theme-bg-card p-4 rounded-xl border theme-border shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase theme-text-muted font-bold">Most Played Stock</div>
              <div className="text-base font-extrabold font-mono theme-text-main mt-0.5 truncate max-w-[130px]">
                {mostPopularStock ? mostPopularStock.symbol : '—'}
              </div>
              <div className="text-[10px] text-amber-400 font-mono font-bold mt-0.5">
                {mostPopularStock ? `${mostPopularStock.holderCount} Players (${mostPopularStock.sharesCount} sh)` : 'No holdings yet'}
              </div>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 4: Market Sentiment Index */}
          <div className="theme-bg-card p-4 rounded-xl border theme-border shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase theme-text-muted font-bold">Market Sentiment Index</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs font-extrabold text-emerald-500 font-mono">🟢 {bullishPercent}% Bullish</span>
                <span className="text-xs font-extrabold text-rose-500 font-mono">🔴 {bearishPercent}% Bearish</span>
              </div>
              <div className="w-full bg-rose-500/30 rounded-full h-2 mt-1.5 overflow-hidden flex">
                <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${bullishPercent}%` }} />
              </div>
            </div>
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Admin Console Section Tabs Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b theme-border font-mono">
          <button
            onClick={() => setActiveAdminTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 min-h-[38px] whitespace-nowrap btn-terminal ${
              activeAdminTab === 'ALL'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'theme-text-muted hover:theme-text-main theme-bg-card border theme-border'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>ALL DESKS</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('NEWS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 min-h-[38px] whitespace-nowrap btn-terminal ${
              activeAdminTab === 'NEWS'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'theme-text-muted hover:theme-text-main theme-bg-card border theme-border'
            }`}
          >
            <Newspaper className="w-4 h-4 text-amber-400" />
            <span>📢 NEWS STUDIO (GOOD vs BAD)</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('DIAGRAM')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 min-h-[38px] whitespace-nowrap btn-terminal ${
              activeAdminTab === 'DIAGRAM'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'theme-text-muted hover:theme-text-main theme-bg-card border theme-border'
            }`}
          >
            <PieChart className="w-4 h-4 text-emerald-400" />
            <span>📊 PLAYER INTEREST DIAGRAM</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('STOCKS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 min-h-[38px] whitespace-nowrap btn-terminal ${
              activeAdminTab === 'STOCKS'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'theme-text-muted hover:theme-text-main theme-bg-card border theme-border'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span>📈 STOCK CONTROLS</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('LEADERBOARD')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 min-h-[38px] whitespace-nowrap btn-terminal ${
              activeAdminTab === 'LEADERBOARD'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'theme-text-muted hover:theme-text-main theme-bg-card border theme-border'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>🏆 LEADERBOARD</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('SETTINGS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 min-h-[38px] whitespace-nowrap btn-terminal ${
              activeAdminTab === 'SETTINGS'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'theme-text-muted hover:theme-text-main theme-bg-card border theme-border'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span>⚙️ SETTINGS</span>
          </button>
        </div>

        {/* SECTION 1: SEGREGATED NEWS STUDIO (GOOD NEWS vs BAD NEWS) */}
        {(activeAdminTab === 'ALL' || activeAdminTab === 'NEWS') && (
          <div className="space-y-6">
            <div className="theme-bg-card p-6 rounded-2xl border theme-border space-y-5 shadow-sm">
              {/* Header & Company Filter */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b theme-border pb-4">
                <div>
                  <h2 className="text-base font-extrabold theme-text-main flex items-center gap-2 font-mono">
                    <Newspaper className="w-5 h-5 text-indigo-400" />
                    News Broadcast Studio (Segregated Good vs Bad News)
                  </h2>
                  <p className="text-xs theme-text-muted font-mono">
                    Headline studio with clear company identification, status tracking (Broadcasted vs Ready to Send), and 1-click execution
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 font-mono">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 theme-text-muted" />
                    <span className="text-xs font-bold theme-text-muted">Filter Company:</span>
                    <select
                      value={newsCompanyFilter}
                      onChange={(e) => setNewsCompanyFilter(e.target.value)}
                      className="theme-bg-panel border theme-border rounded-xl px-3 py-1.5 text-xs font-mono theme-text-main focus:outline-none focus:border-indigo-500 transition-all min-h-[36px]"
                    >
                      <option value="ALL">🏢 ALL COMPANIES (15 Stocks)</option>
                      {stocks.map((s) => (
                        <option key={s.id} value={s.symbol}>
                          {s.symbol} — {s.name} ({s.sector})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 border-l theme-border pl-3">
                    <label className="text-xs font-semibold theme-text-muted whitespace-nowrap">Broadcast Delay:</label>
                    <select
                      value={delaySeconds}
                      onChange={(e) => setDelaySeconds(e.target.value)}
                      className="theme-bg-panel border theme-border rounded-xl px-3 py-1.5 text-xs font-mono theme-text-main focus:outline-none focus:border-indigo-500 transition-all min-h-[36px]"
                    >
                      <option value={15}>15 Seconds</option>
                      <option value={30}>30 Seconds</option>
                      <option value={60}>60 Seconds</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Two Side-by-Side Segregated Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* LEFT COLUMN: GOOD NEWS / BULLISH (PUMPS) */}
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono">
                      <ThumbsUp className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                        🟢 GOOD NEWS / BULLISH (MARKET PUMPS)
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      {filteredGoodNews.length} Headlines
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {filteredGoodNews.length === 0 ? (
                      <div className="py-8 text-center theme-text-dim text-xs font-mono border theme-border rounded-xl">
                        No bullish news templates found for this company filter.
                      </div>
                    ) : (
                      filteredGoodNews.map((tpl) => renderNewsTemplateCard(tpl, 'GOOD'))
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN: BAD NEWS / BEARISH (DUMPS) */}
                <div className="space-y-3">
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono">
                      <ThumbsDown className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-extrabold text-rose-400 uppercase tracking-wider">
                        🔴 BAD NEWS / BEARISH (MARKET DUMPS)
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/20 text-rose-400 border border-rose-500/40">
                      {filteredBadNews.length} Headlines
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {filteredBadNews.length === 0 ? (
                      <div className="py-8 text-center theme-text-dim text-xs font-mono border theme-border rounded-xl">
                        No bearish news templates found for this company filter.
                      </div>
                    ) : (
                      filteredBadNews.map((tpl) => renderNewsTemplateCard(tpl, 'BAD'))
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Custom News Broadcast Form Drawer */}
            <div className="theme-bg-card p-6 rounded-2xl border theme-border shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-500">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold theme-text-main uppercase tracking-wider font-mono">Custom Manual News Broadcast</h2>
                  <p className="text-xs theme-text-muted font-mono">Write and send manual breaking news headlines to all traders on the floor</p>
                </div>
              </div>

              <form onSubmit={handleSendNews} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold theme-text-muted mb-1 font-mono">Custom Headline Message</label>
                    <textarea
                      rows={2}
                      required
                      value={newsMessage}
                      onChange={(e) => setNewsMessage(e.target.value)}
                      placeholder="Type breaking headline to broadcast to all traders..."
                      className="w-full theme-bg-panel border theme-border rounded-xl p-3 text-xs theme-text-main placeholder:theme-text-dim focus:outline-none focus:border-indigo-500 transition-all resize-none font-mono"
                    />
                  </div>

                  <div className="flex flex-col justify-between space-y-2">
                    <div>
                      <label className="block text-xs font-semibold theme-text-muted mb-1 font-mono">Tag Company Stock (Optional)</label>
                      <select
                        value={selectedStockId}
                        onChange={(e) => setSelectedStockId(e.target.value)}
                        className="w-full theme-bg-panel border theme-border rounded-xl px-3 py-2 text-xs theme-text-main focus:outline-none focus:border-indigo-500 transition-all min-h-[38px] font-mono"
                      >
                        <option value="">-- General Market News --</option>
                        {stocks.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.symbol} ({s.name})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={sendingNews || !newsMessage.trim()}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 min-h-[38px] btn-terminal font-mono"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sendingNews ? 'BROADCASTING...' : 'BROADCAST NEWS'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SECTION 2: DIAGRAMMATIC PLAYER INTEREST & STOCK OWNERSHIP WINDOW */}
        {(activeAdminTab === 'ALL' || activeAdminTab === 'DIAGRAM') && (
          <div className="theme-bg-card p-6 rounded-2xl border theme-border space-y-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b theme-border pb-4">
              <div>
                <h2 className="text-base font-extrabold theme-text-main flex items-center gap-2 font-mono">
                  <PieChart className="w-5 h-5 text-emerald-400" />
                  Player Interest & Stock Ownership Diagram
                </h2>
                <p className="text-xs theme-text-muted font-mono">
                  Visual diagrammatic breakdown of how many player traders are playing each stock and total shares in circulation
                </p>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs theme-text-muted">Total Shares Held by Players: </span>
                <span className="text-sm font-extrabold text-emerald-500">{totalSharesInCirculation} sh</span>
              </div>
            </div>

            {/* Diagrammatic Bars & Player Badges */}
            <div className="space-y-4">
              {stocks.map((stock) => {
                const holdings = stockHoldingsMap[stock.id] || [];
                const totalShares = holdings.reduce((sum, h) => sum + h.quantity, 0);
                const activePlayersCount = holdings.length;
                const totalTradersCount = Math.max(1, leaderboard.length);
                const participationPercent = Math.min(100, Math.round((activePlayersCount / totalTradersCount) * 100));

                return (
                  <div key={stock.id} className="theme-bg-panel p-4 rounded-xl border theme-border space-y-2 hover:border-indigo-500/40 transition-all shadow-sm">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold theme-text-main font-mono">{stock.symbol}</span>
                        <span className="text-xs theme-text-muted truncate max-w-[180px]">{stock.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold theme-bg-card theme-text-muted border theme-border">
                          {stock.sector}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 font-mono text-xs">
                        <span className="font-bold theme-text-main">
                          {stock.currentPrice.toFixed(2)} IC
                        </span>
                        <span className={`px-2.5 py-1 rounded text-[11px] font-extrabold ${
                          activePlayersCount > 0
                            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                            : 'theme-bg-card theme-text-dim border theme-border'
                        }`}>
                          👥 {activePlayersCount} Player{activePlayersCount !== 1 ? 's' : ''} ({totalShares} sh)
                        </span>
                      </div>
                    </div>

                    {/* Diagrammatic Participation Bar */}
                    <div className="w-full bg-slate-800/60 rounded-full h-3 overflow-hidden border theme-border flex">
                      <div
                        className={`h-full transition-all duration-500 ${
                          activePlayersCount > 0 ? 'bg-gradient-to-r from-indigo-500 to-emerald-400' : 'bg-slate-700'
                        }`}
                        style={{ width: `${Math.max(2, participationPercent)}%` }}
                      />
                    </div>

                    {/* Interactive Player Chips List */}
                    {holdings.length > 0 ? (
                      <div className="flex items-center gap-2 flex-wrap pt-1 font-mono">
                        <span className="text-[10px] theme-text-dim uppercase font-bold">Active Holders:</span>
                        {holdings.map((h) => (
                          <button
                            key={h.traderId}
                            onClick={() => handleOpenTraderDetail(h.traderId)}
                            className="px-2.5 py-1 rounded-lg bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] hover:bg-[var(--accent)] text-[var(--accent)] hover:text-slate-950 text-[11px] font-bold transition-all border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] flex items-center gap-1.5 btn-terminal"
                            title="Click to view trader profile & history"
                          >
                            <Users className="w-3 h-3" />
                            <span>{h.traderName}</span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-950/40 text-[10px] font-mono">{h.quantity} sh</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] theme-text-dim italic font-mono">
                        No players hold this stock currently.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 3: LIVE STOCK CONTROLS & BULK MARKET ACTIONS */}
        {(activeAdminTab === 'ALL' || activeAdminTab === 'STOCKS') && (
          <div className="space-y-4">
            {/* Bulk Market Actions Bar */}
            <div className="theme-bg-card p-4 rounded-2xl border theme-border shadow-sm space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold theme-text-main font-mono flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Market-Wide Control Desk (Move All 15 Stocks at Once)
                  </h3>
                  <p className="text-xs theme-text-muted font-mono">
                    Pump or dump the entire market across all 15 stocks simultaneously with 1 click
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdjustAllPrices(5)}
                    disabled={isBulkAdjusting}
                    className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500 text-emerald-500 hover:text-slate-950 font-extrabold text-xs rounded-lg transition-all border border-emerald-500/30 flex items-center gap-1 font-mono btn-terminal disabled:opacity-40 min-h-[36px]"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    PUMP ALL +5%
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAdjustAllPrices(10)}
                    disabled={isBulkAdjusting}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg transition-all shadow-md flex items-center gap-1 font-mono btn-terminal disabled:opacity-40 min-h-[36px]"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    SUPER PUMP +10%
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAdjustAllPrices(-5)}
                    disabled={isBulkAdjusting}
                    className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500 text-rose-500 hover:text-white font-extrabold text-xs rounded-lg transition-all border border-rose-500/30 flex items-center gap-1 font-mono btn-terminal disabled:opacity-40 min-h-[36px]"
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    DUMP ALL -5%
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAdjustAllPrices(-10)}
                    disabled={isBulkAdjusting}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-lg transition-all shadow-md flex items-center gap-1 font-mono btn-terminal disabled:opacity-40 min-h-[36px]"
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    SUPER DUMP -10%
                  </button>

                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="±% ALL"
                      value={bulkPercent}
                      onChange={(e) => setBulkPercent(e.target.value)}
                      className="w-20 theme-bg-panel border theme-border rounded-lg py-1.5 px-2 text-xs font-mono theme-text-main text-center focus:outline-none focus:border-amber-400 min-h-[36px]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = parseFloat(bulkPercent);
                        if (!isNaN(val)) handleAdjustAllPrices(val);
                      }}
                      disabled={isBulkAdjusting || !bulkPercent}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-lg transition-all disabled:opacity-40 min-h-[36px] btn-terminal font-mono"
                    >
                      MOVE ALL
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Stock Control Desk Header & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 theme-bg-card p-4 rounded-2xl border theme-border shadow-sm">
              <div>
                <h2 className="text-base font-bold theme-text-main flex items-center gap-2 font-mono">
                  <SlidersHorizontal className="w-5 h-5 text-indigo-500" />
                  Individual Stock Controls (15 India Sector Stocks)
                </h2>
                <p className="text-xs theme-text-muted font-mono">Adjust prices instantly with 1-click preset buttons (+10%, +5%, +1%, -1%, -5%, -10%) or custom %</p>
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

                      {/* Trader Holdings breakdown for Admin view */}
                      {stockHoldingsMap[stock.id]?.length > 0 ? (
                        <div className="px-2.5 py-1.5 rounded-lg bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] text-[11px] font-mono text-[var(--accent)] flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Owned by {stockHoldingsMap[stock.id].length} trader{stockHoldingsMap[stock.id].length > 1 ? 's' : ''}:</span>
                          </span>
                          <span
                            className="font-extrabold truncate max-w-[150px] text-right"
                            title={stockHoldingsMap[stock.id].map((h) => `${h.traderName} (${h.quantity} sh)`).join(', ')}
                          >
                            {stockHoldingsMap[stock.id].map((h) => `${h.traderName} (${h.quantity} sh)`).join(', ')}
                          </span>
                        </div>
                      ) : (
                        <div className="text-[10px] font-mono theme-text-dim px-1 flex items-center gap-1">
                          <Users className="w-3 h-3 opacity-50" />
                          <span>No traders currently hold this stock.</span>
                        </div>
                      )}

                      {/* Quick Adjustment Action Presets */}
                      <div className="space-y-1.5 pt-2 border-t theme-border">
                        <div className="grid grid-cols-6 gap-1">
                          <button
                            type="button"
                            onClick={() => handleAdjustPrice(stock.id, 10)}
                            disabled={adjustingStockId === stock.id}
                            className="py-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-extrabold text-[10px] font-mono rounded border border-emerald-500/40 transition-all btn-terminal"
                          >
                            +10%
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustPrice(stock.id, 5)}
                            disabled={adjustingStockId === stock.id}
                            className="py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-slate-950 font-bold text-[10px] font-mono rounded border border-emerald-500/30 transition-all btn-terminal"
                          >
                            +5%
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustPrice(stock.id, 1)}
                            disabled={adjustingStockId === stock.id}
                            className="py-1 bg-emerald-500/5 hover:bg-emerald-500 text-emerald-500 hover:text-slate-950 font-semibold text-[10px] font-mono rounded border border-emerald-500/20 transition-all btn-terminal"
                          >
                            +1%
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustPrice(stock.id, -1)}
                            disabled={adjustingStockId === stock.id}
                            className="py-1 bg-rose-500/5 hover:bg-rose-500 text-rose-500 hover:text-white font-semibold text-[10px] font-mono rounded border border-rose-500/20 transition-all btn-terminal"
                          >
                            -1%
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustPrice(stock.id, -5)}
                            disabled={adjustingStockId === stock.id}
                            className="py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-bold text-[10px] font-mono rounded border border-rose-500/30 transition-all btn-terminal"
                          >
                            -5%
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustPrice(stock.id, -10)}
                            disabled={adjustingStockId === stock.id}
                            className="py-1 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white font-extrabold text-[10px] font-mono rounded border border-rose-500/40 transition-all btn-terminal"
                          >
                            -10%
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleAdjustPrice(stock.id, 1)}
                            disabled={adjustingStockId === stock.id}
                            className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-slate-950 font-bold text-[11px] rounded border border-emerald-500/30 flex items-center justify-center flex-1 btn-terminal font-mono"
                            title="Nudge price up +1%"
                          >
                            ▲ Nudge Up
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustPrice(stock.id, -1)}
                            disabled={adjustingStockId === stock.id}
                            className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-bold text-[11px] rounded border border-rose-500/30 flex items-center justify-center flex-1 btn-terminal font-mono"
                            title="Nudge price down -1%"
                          >
                            ▼ Nudge Down
                          </button>
                          <div className="flex items-center gap-1 flex-1">
                            <input
                              type="number"
                              placeholder="±%"
                              value={customVal}
                              onChange={(e) => setCustomPercents((prev) => ({ ...prev, [stock.id]: e.target.value }))}
                              className="w-full theme-bg-panel border theme-border rounded py-1 px-2 text-xs font-mono theme-text-main text-center focus:outline-none focus:border-indigo-500 min-h-[30px]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const val = parseFloat(customVal);
                                if (!isNaN(val)) handleAdjustPrice(stock.id, val);
                              }}
                              disabled={adjustingStockId === stock.id || !customVal}
                              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded transition-all disabled:opacity-40 min-h-[30px] btn-terminal font-mono flex-shrink-0"
                            >
                              GO
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SECTION 4: PLAYER LEADERBOARD TABLE */}
        {(activeAdminTab === 'ALL' || activeAdminTab === 'LEADERBOARD') && (
          <div className="theme-bg-card p-6 rounded-2xl border theme-border space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold theme-text-main flex items-center gap-2 font-mono">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  Live Player Leaderboard & Trader Roster
                </h2>
                <p className="text-xs theme-text-muted font-mono">Real-time portfolio rankings for all logged-in trader players</p>
              </div>

              <button
                onClick={fetchLeaderboard}
                disabled={loadingLeaderboard}
                className="px-3 py-1.5 theme-bg-panel hover:border-indigo-500 text-xs font-bold font-mono rounded-xl border theme-border theme-text-main transition-all flex items-center gap-1.5 self-start sm:self-auto min-h-[36px]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLeaderboard ? 'animate-spin' : ''}`} />
                <span>REFRESH ROSTER</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border theme-border">
              <table className="w-full text-left text-xs font-mono">
                <thead className="theme-bg-panel theme-text-muted uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Trader Name</th>
                    <th className="py-2.5 px-3 text-right">Cash Balance</th>
                    <th className="py-2.5 px-3 text-right">Stock Holdings</th>
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
        )}

        {/* SECTION 5: SESSION TIMING & ALGORITHM CONTROLLER CARD */}
        {(activeAdminTab === 'ALL' || activeAdminTab === 'SETTINGS') && (
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
        )}

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
                ✕
              </button>
            </div>

            <form onSubmit={handleStartBreak} className="space-y-4">
              <div>
                <label className="text-xs font-bold theme-text-dim block mb-2 uppercase tracking-wider">
                  Break Duration (Minutes)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[10, 5, 4, 2].map((m) => (
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
                <p className="text-[10px] theme-text-dim mt-1">
                  This note and a live break countdown timer will be displayed on all traders' screens during the break.
                </p>
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
