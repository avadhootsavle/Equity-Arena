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
  const [customNewsConfirm, setCustomNewsConfirm] = useState(false);
  const [delaySeconds, setDelaySeconds] = useState(60);
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

    const handleBankruptAlert = (data) => {
      showToast(`${data.traderName || 'A trader'} has gone bankrupt — total value: 0 IC`, 'error');
      setLiveTradeFeed((prev) => [
        {
          id: Date.now() + Math.random(),
          traderName: data.traderName || 'Trader',
          action: 'BANKRUPT',
          quantity: 0,
          symbol: 'BUST',
          price: data.totalValue || 0,
          timestamp: data.timestamp || Date.now(),
          isBankrupt: true
        },
        ...prev
      ].slice(0, 30));
    };

    const handleActivityLog = (data) => {
      setLiveTradeFeed((prev) => [data, ...prev].slice(0, 30));
    };

    socket.on('connect', handleConnect);
    socket.on('stock:update', handleStockUpdate);
    socket.on('trade:executed', handleTradeExecuted);
    socket.on('order:executed', handleTradeExecuted);
    socket.on('bankrupt:alert', handleBankruptAlert);
    socket.on('activity:log', handleActivityLog);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('stock:update', handleStockUpdate);
      socket.off('trade:executed', handleTradeExecuted);
      socket.off('order:executed', handleTradeExecuted);
      socket.off('bankrupt:alert', handleBankruptAlert);
      socket.off('activity:log', handleActivityLog);
    };
  }, [socket]);

  /* Recently adjusted stock flash state */
  const [recentlyAdjustedStockId, setRecentlyAdjustedStockId] = useState(null);

  /* End Session inline confirmation state */
  const [confirmEndSession, setConfirmEndSession] = useState(false);
  const [endSessionTimer, setEndSessionTimer] = useState(null);

  /* Custom % Stock adjustment inline confirmation state */
  const [confirmStockAdj, setConfirmStockAdj] = useState(null);

  const handleEndSessionClick = () => {
    setConfirmEndSession(true);
    if (endSessionTimer) clearTimeout(endSessionTimer);
    const timer = setTimeout(() => setConfirmEndSession(false), 8000);
    setEndSessionTimer(timer);
  };

  const handleCancelEndSession = () => {
    if (endSessionTimer) clearTimeout(endSessionTimer);
    setConfirmEndSession(false);
  };

  const handleStopSession = async () => {
    if (endSessionTimer) clearTimeout(endSessionTimer);
    setConfirmEndSession(false);

    try {
      const data = await apiFetch('/admin/session/stop', { method: 'POST' });
      showToast(data.message || 'Trading session stopped by Admin.');
    } catch (err) {
      showToast(err.message || 'Failed to stop session', 'error');
    }
  };

  const handleCustomApplyClick = (stockId, symbol) => {
    const percent = parseFloat(customPercents[stockId]);
    if (isNaN(percent)) return;
    if (confirmStockAdj?.timer) clearTimeout(confirmStockAdj.timer);
    const timer = setTimeout(() => setConfirmStockAdj(null), 8000);
    setConfirmStockAdj({ stockId, symbol, percent, timer });
  };

  const handleCancelCustomAdj = () => {
    if (confirmStockAdj?.timer) clearTimeout(confirmStockAdj.timer);
    setConfirmStockAdj(null);
  };

  const handleAdjustPrice = async (stockId, percent) => {
    if (confirmStockAdj?.timer) clearTimeout(confirmStockAdj.timer);
    setConfirmStockAdj(null);

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
      
      // Trigger price cell highlight flash
      setRecentlyAdjustedStockId(stockId);
      setTimeout(() => setRecentlyAdjustedStockId(null), 1000);

      fetchStockHoldings();
      fetchLeaderboard();
    } catch (err) {
      showToast(err.message || 'Price adjustment failed', 'error');
    } finally {
      setAdjustingStockId(null);
    }
  };

  const handleSendNews = async (e) => {
    if (e) e.preventDefault();
    if (!newsMessage.trim()) return;

    setSendingNews(true);
    try {
      const data = await apiFetch('/admin/news', {
        method: 'POST',
        body: JSON.stringify({
          message: newsMessage.trim(),
          stockId: selectedStockId || undefined,
          delaySeconds: parseInt(delaySeconds, 10) || 60
        })
      });

      setRecentNews((prev) => [data.news, ...prev]);
      setNewsMessage('');
      setSelectedStockId('');
      setCustomNewsConfirm(false);
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
          delaySeconds: parseInt(delaySeconds, 10) || 60
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
    <div className="min-h-screen bg-[#0D0D0D] text-white font-mono selection:bg-[#F0B429] selection:text-black">
      
      {/* Toast Notification Popup */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-[4px] border text-xs font-mono font-bold flex items-center gap-2 ${
            toast.type === 'error'
              ? 'bg-[#F85149]/10 text-[#F85149] border-[#F85149]'
              : 'bg-[#3FB950]/10 text-[#3FB950] border-[#3FB950]'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-[#F85149]" /> : <CheckCircle2 className="w-4 h-4 text-[#3FB950]" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP BAR (FULL WIDTH, MINIMAL) */}
      <header className="border-b border-[#2A2A2A] bg-[#111111] px-6 py-3.5 flex items-center justify-between font-mono text-xs flex-wrap gap-4 sticky top-0 z-40">
        {/* Left: App Title */}
        <div className="flex items-center gap-3">
          <span className="font-extrabold uppercase tracking-[0.12em] text-white text-xs">EQUITY ARENA</span>
          <span className="text-[#444444]">·</span>
          <span className="text-[#F0B429] font-bold text-[11px]">ADMIN</span>
        </div>

        {/* Center: Session Status & Timer with Pulsing Green Dot */}
        <div className="flex items-center gap-3">
          {adminSession?.status === 'ACTIVE' ? (
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3FB950] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3FB950]"></span>
              </span>
              <span className="text-[#3FB950] font-bold">Session running —</span>
              <GameClock sessionData={adminSession} />
            </div>
          ) : adminSession?.status === 'PAUSED' ? (
            <div className="flex items-center gap-2">
              <span className="text-[#F0B429] font-bold">Market on break —</span>
              <span className="text-white font-bold">{adminSession.breakNote}</span>
            </div>
          ) : (
            <span className="text-[#888888]">No active session — press Start</span>
          )}
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          {isSessionRunning ? (
            <div className="flex items-center gap-2">
              {adminSession?.status === 'PAUSED' ? (
                <button
                  type="button"
                  onClick={handleResumeSession}
                  className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-[4px] border border-white text-white hover:bg-white/5 transition-colors"
                >
                  RESUME SESSION
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowBreakModal(true)}
                  className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-[4px] border border-white text-white hover:bg-white/5 transition-colors"
                >
                  BREAK
                </button>
              )}

              {!confirmEndSession ? (
                <button
                  type="button"
                  onClick={handleEndSessionClick}
                  className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-[4px] border border-[#F85149] text-[#F85149] hover:bg-[#F85149]/10 transition-colors"
                >
                  END SESSION
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-[#0D0D0D] border border-[#F85149] px-2.5 py-1 rounded-[4px] animate-fadeIn">
                  <span className="text-[#F85149] font-bold text-[11px]">End the session now? All trading will stop. →</span>
                  <button
                    type="button"
                    onClick={handleStopSession}
                    className="px-2.5 py-0.5 text-xs font-bold uppercase border border-[#F85149] text-[#F85149] hover:bg-[#F85149]/10 rounded-[2px]"
                  >
                    YES, END
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEndSession}
                    className="px-2 py-0.5 text-xs text-[#888888] hover:text-white"
                  >
                    CANCEL
                  </button>
                </div>
              )}
            </div>
          ) : null}

          <button
            type="button"
            onClick={logout}
            className="ml-3 px-2 py-1 text-xs text-[#888888] hover:text-white transition-colors"
            title="Logout Admin"
          >
            LOGOUT
          </button>
        </div>
      </header>

      {/* TWO-COLUMN SIDE-BY-SIDE LAYOUT (FULL HEIGHT WITH 24px BREATHING ROOM & 1px DIVIDER) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-49px)]">

        {/* LEFT COLUMN (40% / LG:COL-SPAN-5): SESSION CONTROL + SEND NEWS */}
        <div className="lg:col-span-5 border-r border-[#2A2A2A] p-6 space-y-6 font-mono">
          
          {/* SESSION BLOCK (TOP OF LEFT COLUMN) */}
          <div className="border border-[#2A2A2A] rounded-[4px] bg-[#111111] p-5 space-y-4">
            <span className="text-[10px] uppercase tracking-[0.1em] text-[#555555] font-bold block mb-2">SESSION CONTROL</span>

            {!isSessionRunning ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs text-[#888888]">Duration:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[30, 60, 180].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSessionDurationMins(m)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-[4px] border transition-colors ${
                          sessionDurationMins === m
                            ? 'border-[#F0B429] text-[#F0B429] bg-[#F0B429]/10'
                            : 'border-[#3A3A3A] text-white hover:bg-white/5'
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                    <input
                      type="number"
                      min="1"
                      value={sessionDurationMins}
                      onChange={(e) => setSessionDurationMins(parseInt(e.target.value, 10) || 180)}
                      className="w-16 h-[30px] bg-[#0D0D0D] border border-[#3A3A3A] rounded-[4px] px-1 text-center text-xs text-white focus:outline-none focus:border-[#F0B429]"
                      placeholder="custom"
                    />
                  </div>
                </div>

                {/* Filled Amber START SESSION Button (Prominent) */}
                <button
                  type="button"
                  onClick={() => handleStartNewSession()}
                  disabled={isStartingSession}
                  className="w-full h-[36px] bg-[#F0B429] hover:bg-[#d9a120] text-black font-bold uppercase tracking-wider text-xs rounded-[4px] transition-colors disabled:opacity-50"
                >
                  {isStartingSession ? 'STARTING...' : 'START SESSION'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[#888888]">Timer:</span>
                  <GameClock sessionData={adminSession} />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#888888]">
                  <span>Reminder:</span>
                  <span className={`font-bold ${reminderSeconds <= 120 ? 'text-[#F0B429]' : 'text-white'}`}>
                    {Math.floor(reminderSeconds / 60).toString().padStart(2, '0')}:{(reminderSeconds % 60).toString().padStart(2, '0')}
                  </span>
                  <button type="button" onClick={resetNewsTimer} className="hover:text-white ml-1">RESET</button>
                </div>
              </div>
            )}
          </div>

          {/* NEWS BLOCK (REST OF LEFT COLUMN) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mt-5 mb-2">
              <span className="text-[10px] uppercase tracking-[0.1em] text-[#555555] font-bold block">SEND NEWS</span>
              <select
                value={newsCompanyFilter}
                onChange={(e) => setNewsCompanyFilter(e.target.value)}
                className="bg-[#111111] border border-[#2A2A2A] rounded-[4px] px-2.5 py-1 text-[11px] text-[#888888] font-mono"
              >
                <option value="ALL">All 15 Companies</option>
                {Object.values(SECTOR_TO_STOCK_MAP).map((s) => (
                  <option key={s.symbol} value={s.symbol}>{s.symbol} — {s.name}</option>
                ))}
              </select>
            </div>

            {/* Sub-Columns: POSITIVE | NEGATIVE */}
            <div className="grid grid-cols-2 border border-[#2A2A2A] rounded-[4px] bg-[#111111] overflow-hidden">
              
              {/* POSITIVE */}
              <div className="p-4 border-r border-[#2A2A2A] space-y-3">
                <div className="text-[10px] uppercase tracking-[0.1em] text-[#3FB950] font-bold border-b border-[#2A2A2A] pb-2">
                  POSITIVE ({filteredGoodNews.length})
                </div>

                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {filteredGoodNews.map((tpl) => {
                    const isSent = usedTemplateIds.includes(tpl.id);
                    const isConfirming = inlineConfirmTplId === tpl.id;
                    const isTriggering = triggeringTemplateId === tpl.id;

                    return (
                      <div
                        key={tpl.id}
                        className={`p-2.5 bg-[#161616] border border-[#2A2A2A] rounded-[4px] space-y-2 transition-opacity ${
                          isSent ? 'opacity-40' : ''
                        }`}
                      >
                        <p className="text-[14px] font-normal text-[#DDDDDD] leading-snug">{tpl.headline}</p>

                        {isConfirming ? (
                          <div className="p-2 bg-[#0D0D0D] border border-[#F0B429] rounded-[4px] space-y-2 font-mono text-[10px] animate-fadeIn">
                            <div className="flex items-center justify-between">
                              <span className="text-[#888888]">Delay:</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={delaySeconds}
                                  onChange={(e) => setDelaySeconds(parseInt(e.target.value, 10) || 60)}
                                  className="w-12 h-5 bg-[#161616] border border-[#3A3A3A] text-center text-white rounded-[2px]"
                                />
                                <span className="text-[#888888]">sec</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-[#222222]">
                              <button
                                type="button"
                                onClick={() => setInlineConfirmTplId(null)}
                                className="px-2 py-0.5 text-[#888888] hover:text-white"
                              >
                                CANCEL
                              </button>
                              <button
                                type="button"
                                disabled={isTriggering}
                                onClick={() => handleTriggerTemplate(tpl.id)}
                                className="px-3 py-1 text-xs uppercase font-bold text-[#F0B429] border border-[#F0B429] bg-transparent hover:bg-[#F0B429]/10 rounded-[4px] transition-colors"
                              >
                                {isTriggering ? 'SENDING...' : 'CONFIRM SEND'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#222222]">
                            <span className="text-[11px] text-[#3FB950] font-bold">+{tpl.effectPercent}%</span>
                            {isSent ? (
                              <span className="text-[10px] text-[#888888] font-bold">Sent</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setInlineConfirmTplId(tpl.id)}
                                className="px-3 py-1 text-xs uppercase font-bold text-[#F0B429] border border-[#F0B429] bg-transparent hover:bg-[#F0B429]/10 rounded-[4px] transition-colors"
                              >
                                SEND
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* NEGATIVE */}
              <div className="p-4 space-y-3">
                <div className="text-[10px] uppercase tracking-[0.1em] text-[#F85149] font-bold border-b border-[#2A2A2A] pb-2">
                  NEGATIVE ({filteredBadNews.length})
                </div>

                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {filteredBadNews.map((tpl) => {
                    const isSent = usedTemplateIds.includes(tpl.id);
                    const isConfirming = inlineConfirmTplId === tpl.id;
                    const isTriggering = triggeringTemplateId === tpl.id;

                    return (
                      <div
                        key={tpl.id}
                        className={`p-2.5 bg-[#161616] border border-[#2A2A2A] rounded-[4px] space-y-2 transition-opacity ${
                          isSent ? 'opacity-40' : ''
                        }`}
                      >
                        <p className="text-[14px] font-normal text-[#DDDDDD] leading-snug">{tpl.headline}</p>

                        {isConfirming ? (
                          <div className="p-2 bg-[#0D0D0D] border border-[#F85149] rounded-[4px] space-y-2 font-mono text-[10px] animate-fadeIn">
                            <div className="flex items-center justify-between">
                              <span className="text-[#888888]">Delay:</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={delaySeconds}
                                  onChange={(e) => setDelaySeconds(parseInt(e.target.value, 10) || 60)}
                                  className="w-12 h-5 bg-[#161616] border border-[#3A3A3A] text-center text-white rounded-[2px]"
                                />
                                <span className="text-[#888888]">sec</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-[#222222]">
                              <button
                                type="button"
                                onClick={() => setInlineConfirmTplId(null)}
                                className="px-2 py-0.5 text-[#888888] hover:text-white"
                              >
                                CANCEL
                              </button>
                              <button
                                type="button"
                                disabled={isTriggering}
                                onClick={() => handleTriggerTemplate(tpl.id)}
                                className="px-3 py-1 text-xs uppercase font-bold text-[#F85149] border border-[#F85149] bg-transparent hover:bg-[#F85149]/10 rounded-[4px] transition-colors"
                              >
                                {isTriggering ? 'SENDING...' : 'CONFIRM SEND'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#222222]">
                            <span className="text-[11px] text-[#F85149] font-bold">{tpl.effectPercent}%</span>
                            {isSent ? (
                              <span className="text-[10px] text-[#888888] font-bold">Sent</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setInlineConfirmTplId(tpl.id)}
                                className="px-3 py-1 text-xs uppercase font-bold text-[#F85149] border border-[#F85149] bg-transparent hover:bg-[#F85149]/10 rounded-[4px] transition-colors"
                              >
                                SEND
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* CUSTOM MANUAL NEWS BROADCAST */}
            <div className="space-y-3 pt-3 border-t border-[#2A2A2A]">
              <textarea
                rows={2}
                value={newsMessage}
                onChange={(e) => setNewsMessage(e.target.value)}
                placeholder="Type custom manual breaking news headline..."
                className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[4px] p-3 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-[#F0B429] font-mono resize-none"
              />
              <div className="flex items-center justify-between gap-2">
                <select
                  value={selectedStockId}
                  onChange={(e) => setSelectedStockId(e.target.value)}
                  className="bg-[#111111] border border-[#2A2A2A] rounded-[4px] px-3 py-1.5 text-xs text-[#888888] font-mono"
                >
                  <option value="">Target: Whole Market</option>
                  {stocks.map((s) => (
                    <option key={s.id} value={s.id}>{s.symbol} — {s.name}</option>
                  ))}
                </select>

                {!customNewsConfirm ? (
                  <button
                    type="button"
                    disabled={!newsMessage.trim()}
                    onClick={() => setCustomNewsConfirm(true)}
                    className="px-4 py-1.5 text-xs uppercase font-bold text-[#F0B429] border border-[#F0B429] bg-transparent hover:bg-[#F0B429]/10 rounded-[4px] transition-colors disabled:opacity-50"
                  >
                    SEND
                  </button>
                ) : (
                  <div className="flex items-center gap-2 font-mono text-[10px] bg-[#0D0D0D] border border-[#F0B429] p-2 rounded-[4px] animate-fadeIn">
                    <span className="text-[#888888]">Delay:</span>
                    <input
                      type="number"
                      min="0"
                      value={delaySeconds}
                      onChange={(e) => setDelaySeconds(parseInt(e.target.value, 10) || 60)}
                      className="w-12 h-5 bg-[#161616] border border-[#3A3A3A] text-center text-white rounded-[2px]"
                    />
                    <span className="text-[#888888]">sec</span>
                    <button
                      type="button"
                      onClick={() => setCustomNewsConfirm(false)}
                      className="px-2 py-0.5 text-[#888888] hover:text-white"
                    >
                      CANCEL
                    </button>
                    <button
                      type="button"
                      disabled={sendingNews}
                      onClick={handleSendNews}
                      className="px-3 py-1 text-xs uppercase font-bold text-[#F0B429] border border-[#F0B429] bg-transparent hover:bg-[#F0B429]/10 rounded-[4px] transition-colors"
                    >
                      {sendingNews ? 'SENDING...' : 'CONFIRM SEND'}
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN (60% / LG:COL-SPAN-7): STOCKS (TOP 60%) + LIVE ACTIVITY (BOTTOM 40%) */}
        <div className="lg:col-span-7 p-6 space-y-6 font-mono">
          
          {/* STOCKS BLOCK (TOP 60%) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mt-5 mb-2">
              <span className="text-[10px] uppercase tracking-[0.1em] text-[#555555] font-bold block">STOCKS (15 LISTINGS)</span>
              <button
                type="button"
                onClick={() => setStockSortMode(stockSortMode === 'CHANGE' ? 'ALPHA' : 'CHANGE')}
                className="text-[10px] uppercase font-mono text-[#888888] hover:text-white border border-[#3A3A3A] hover:bg-white/5 px-2.5 py-1 rounded-[4px] transition-colors"
              >
                {stockSortMode === 'CHANGE' ? 'Sort: Gainers Top' : 'Sort: Alphabetical A-Z'}
              </button>
            </div>

            {/* Scannable Stock Rows with Alternating Backgrounds (#111111 / #161616) & 44px Row Height */}
            <div className="border border-[#2A2A2A] rounded-[4px] overflow-hidden">
              {sortedStocks.map((s, idx) => {
                const isUp = Number(s.percentChange) >= 0;
                const isAdjusting = adjustingStockId === s.id;
                const isConfirmingCustom = confirmStockAdj?.stockId === s.id;
                const isRecentlyAdjusted = s.id === recentlyAdjustedStockId;

                return (
                  <div
                    key={s.id}
                    className={`border-b border-[#2A2A2A] last:border-b-0 ${
                      idx % 2 === 0 ? 'bg-[#111111]' : 'bg-[#161616]'
                    }`}
                  >
                    <div className="h-[44px] px-3.5 flex items-center justify-between gap-3 text-xs flex-wrap">
                      {/* Stock Symbol (14px, weight 600) & Name (13px, weight 400, #888888) */}
                      <div className="flex items-center gap-3 min-w-[170px]">
                        <span className="text-[14px] font-bold text-white w-14">{s.symbol}</span>
                        <span className="text-[13px] font-normal text-[#888888] truncate max-w-[130px]">{s.name}</span>
                      </div>

                      {/* Price (JetBrains Mono 15px, weight 500) & % Change (13px JetBrains Mono) with Flash */}
                      <div
                        className={`flex items-center gap-3 min-w-[140px] justify-end px-2 py-1 rounded-[2px] ${
                          isRecentlyAdjusted ? 'bg-[#F0B429]/20 transition-colors duration-1000' : 'transition-colors duration-1000'
                        }`}
                      >
                        <span className="font-mono text-[15px] font-medium text-white">{fmtMoney(s.currentPrice)} IC</span>
                        <span className={`font-mono text-[13px] font-bold ${isUp ? 'text-[#3FB950]' : 'text-[#F85149]'}`}>
                          {isUp ? `+${Number(s.percentChange || 0).toFixed(2)}%` : `${Number(s.percentChange || 0).toFixed(2)}%`}
                        </span>
                      </div>

                      {/* Presets (28px height, 10px px, 1px solid #3A3A3A) & Custom APPLY */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          disabled={isAdjusting}
                          onClick={() => handleAdjustPrice(s.id, 10)}
                          className="h-[28px] px-2.5 text-xs font-bold rounded-[4px] border border-[#3A3A3A] text-white hover:bg-white/5 transition-colors"
                        >
                          +10%
                        </button>
                        <button
                          type="button"
                          disabled={isAdjusting}
                          onClick={() => handleAdjustPrice(s.id, 25)}
                          className="h-[28px] px-2.5 text-xs font-bold rounded-[4px] border border-[#3A3A3A] text-white hover:bg-white/5 transition-colors"
                        >
                          +25%
                        </button>
                        <button
                          type="button"
                          disabled={isAdjusting}
                          onClick={() => handleAdjustPrice(s.id, -10)}
                          className="h-[28px] px-2.5 text-xs font-bold rounded-[4px] border border-[#3A3A3A] text-white hover:bg-white/5 transition-colors"
                        >
                          -10%
                        </button>
                        <button
                          type="button"
                          disabled={isAdjusting}
                          onClick={() => handleAdjustPrice(s.id, -25)}
                          className="h-[28px] px-2.5 text-xs font-bold rounded-[4px] border border-[#3A3A3A] text-white hover:bg-white/5 transition-colors"
                        >
                          -25%
                        </button>

                        <input
                          type="number"
                          placeholder="%"
                          value={customPercents[s.id] || ''}
                          onChange={(e) => setCustomPercents({ ...customPercents, [s.id]: e.target.value })}
                          className="w-12 h-[28px] bg-[#0D0D0D] border border-[#3A3A3A] rounded-[4px] px-1 text-center text-xs text-white focus:outline-none focus:border-[#F0B429]"
                        />
                        <button
                          type="button"
                          disabled={isAdjusting || !customPercents[s.id]}
                          onClick={() => handleCustomApplyClick(s.id, s.symbol)}
                          className="h-[28px] px-3 text-xs uppercase font-bold text-[#F0B429] border border-[#F0B429] bg-transparent hover:bg-[#F0B429]/10 rounded-[4px] transition-colors disabled:opacity-50"
                        >
                          APPLY
                        </button>
                      </div>
                    </div>

                    {/* Inline Confirmation Drawer for Custom % Adjustment */}
                    {isConfirmingCustom && (
                      <div className="p-2.5 bg-[#0D0D0D] border-t border-[#F0B429] flex items-center justify-between text-xs animate-fadeIn">
                        <span className="text-white font-bold">
                          Move {confirmStockAdj.symbol} price by {confirmStockAdj.percent >= 0 ? '+' : ''}{confirmStockAdj.percent}%?
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAdjustPrice(confirmStockAdj.stockId, confirmStockAdj.percent)}
                            disabled={isAdjusting}
                            className="px-3 py-1 text-xs uppercase font-bold text-[#F0B429] border border-[#F0B429] bg-transparent hover:bg-[#F0B429]/10 rounded-[4px] transition-colors"
                          >
                            CONFIRM
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelCustomAdj}
                            className="px-2.5 py-1 text-[#888888] hover:text-white"
                          >
                            CANCEL
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* LIVE ACTIVITY BLOCK (BOTTOM 40%) */}
          <div className="space-y-5 pt-4 border-t border-[#2A2A2A]">
            <div className="space-y-3">
              <span className="text-[10px] uppercase tracking-[0.1em] text-[#555555] font-bold block mt-5 mb-2">LIVE ACTIVITY</span>
              <div className="border border-[#2A2A2A] rounded-[4px] bg-[#111111] p-3.5 space-y-2 max-h-[240px] overflow-y-auto text-xs">
                {liveTradeFeed.length === 0 ? (
                  <div className="py-8 text-center text-[#666666] italic">
                    Awaiting player trade activity...
                  </div>
                ) : (
                  liveTradeFeed.map((trade) => {
                    const borderLeftClass = trade.isBankrupt
                      ? 'border-l-2 border-l-[#F85149]'
                      : trade.isTopUp
                      ? 'border-l-2 border-l-[#F0B429]'
                      : trade.action === 'NEWS'
                      ? 'border-l-2 border-l-[#888888]'
                      : 'border-l-2 border-l-[#3FB950]';

                    return (
                      <div
                        key={trade.id}
                        className={`flex items-center justify-between px-3 py-2 bg-[#141414] ${borderLeftClass} rounded-[2px] text-[11px]`}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenTraderDetail(trade.traderId || trade.userId)}
                            className="text-white font-semibold hover:underline cursor-pointer"
                          >
                            {trade.traderName}
                          </button>
                          {trade.isBankrupt ? (
                            <span className="text-[#F85149] font-bold uppercase">went bankrupt</span>
                          ) : trade.isTopUp ? (
                            <span className="text-[#F0B429] font-bold">gave +{fmtMoney(trade.price)} IC</span>
                          ) : (
                            <span className={trade.action === 'BUY' ? 'text-[#3FB950]' : 'text-[#F85149]'}>
                              {trade.action.toLowerCase()} {trade.quantity} shares {trade.symbol}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-white font-bold font-mono">
                            {trade.isBankrupt ? '0 IC' : trade.isTopUp ? '—' : `${fmtMoney(trade.price * trade.quantity)} IC`}
                          </span>
                          <span className="text-[#555555] font-mono text-[11px]">{new Date(trade.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Compact Leaderboard Rows with 1px Separator & Top 3 Amber Borders */}
            <div className="space-y-3 border-t border-[#2A2A2A] pt-4 mt-4">
              <span className="text-[10px] uppercase tracking-[0.1em] text-[#555555] font-bold block mb-2">COMPACT LEADERBOARD</span>
              <div className="border border-[#2A2A2A] rounded-[4px] bg-[#111111] p-3.5 space-y-2 max-h-[200px] overflow-y-auto text-xs">
                {leaderboard.length === 0 ? (
                  <div className="py-6 text-center text-[#666666] italic">
                    Loading standings...
                  </div>
                ) : (
                  leaderboard.map((entry, idx) => {
                    const isTop3 = idx < 3;
                    const rankColor = idx === 0 ? 'text-[#F0B429]' : isTop3 ? 'text-white' : 'text-[#666666]';

                    return (
                      <div
                        key={entry.id || idx}
                        className={`flex items-center justify-between px-3 py-1.5 bg-[#141414] rounded-[2px] text-[11px] ${
                          isTop3 ? 'border-l border-l-[#F0B429]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`font-mono font-bold w-5 ${rankColor}`}>#{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleOpenTraderDetail(entry.id)}
                            className="text-white font-semibold hover:underline cursor-pointer"
                          >
                            {entry.name}
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[#3FB950] font-mono font-bold text-xs">
                            {fmtMoney(entry.totalNetWorth || entry.portfolioValue)} IC
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenTraderDetail(entry.id)}
                            className="text-[10px] uppercase font-bold text-[#F0B429] border border-[#F0B429] bg-transparent hover:bg-[#F0B429]/10 rounded-[4px] px-2 py-0.5 transition-colors"
                          >
                            AUDIT
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Admin Break Setup Dialog */}
      {showBreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-mono animate-fadeIn">
          <div className="w-full max-w-md bg-[#0D0D0D] border border-[#2A2A2A] rounded-[4px] p-5 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
              <span className="text-[11px] uppercase tracking-[0.08em] text-[#666666]">START REFRESHMENT BREAK</span>
              <button
                type="button"
                onClick={() => setShowBreakModal(false)}
                className="text-[#888888] hover:text-white font-bold text-sm"
              >
                X
              </button>
            </div>

            <form onSubmit={handleStartBreak} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] uppercase text-[#666666] block mb-2 font-bold">
                  BREAK DURATION (MINUTES)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[5, 10, 15, 20].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setBreakMinutes(m)}
                      className={`py-1.5 text-xs font-bold rounded-[4px] border transition-colors ${
                        breakMinutes === m
                          ? 'border-[#F0B429] text-[#F0B429]'
                          : 'border-[#3A3A3A] text-white hover:bg-white/10'
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
                  className="w-full px-3 py-2 bg-[#111111] border border-[#2A2A2A] rounded-[4px] text-xs text-white font-mono focus:outline-none focus:border-[#F0B429]"
                  placeholder="Custom Minutes (e.g. 15)"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-[#666666] block mb-2 font-bold">
                  TRADER ANNOUNCEMENT / NOTE
                </label>
                <textarea
                  rows="3"
                  value={breakNote}
                  onChange={(e) => setBreakNote(e.target.value)}
                  className="w-full px-3 py-2 bg-[#111111] border border-[#2A2A2A] rounded-[4px] text-xs font-mono text-white resize-none focus:outline-none focus:border-[#F0B429]"
                  placeholder="e.g. Refreshment Break — Grab snacks, water, and take a quick rest!"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBreakModal(false)}
                  className="flex-1 py-2 text-xs font-bold rounded-[4px] border border-[#3A3A3A] text-[#888888] hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold uppercase rounded-[4px] border border-[#F0B429] text-[#F0B429] hover:bg-[#F0B429]/10"
                >
                  START {breakMinutes}M BREAK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Trader Drill-Down Slide-Over Audit */}
      <AdminTraderDetailModal
        traderId={selectedTraderId}
        isOpen={isTraderModalOpen}
        onClose={() => setIsTraderModalOpen(false)}
      />
    </div>
  );
}
