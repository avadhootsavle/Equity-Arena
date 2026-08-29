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
  const [stockSortMode, setStockSortMode] = useState('CHANGE'); // 'CHANGE' | 'ALPHA'

  const [stocks, setStocks] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [customPercents, setCustomPercents] = useState({});
  const [adjustingStockId, setAdjustingStockId] = useState(null);
  const [confirmStockAdj, setConfirmStockAdj] = useState(null); // { stockId, percent }

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

  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [liveTradeFeed, setLiveTradeFeed] = useState([]);

  // Admin Trader Drill-Down Modal state
  const [selectedTraderId, setSelectedTraderId] = useState(null);
  const [isTraderModalOpen, setIsTraderModalOpen] = useState(false);

  const [toast, setToast] = useState(null);

  /* Break Modal State */
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState(10);
  const [breakNote, setBreakNote] = useState("☕ Refreshment Break — Grab snacks, water, and take a quick rest!");

  /* Session Setup Configurable Inputs */
  const [sessionDurationMins, setSessionDurationMins] = useState(180);
  const [customDurationInput, setCustomDurationInput] = useState('');
  const [liquidationBufferMins, setLiquidationBufferMins] = useState(5);
  const [customBufferInput, setCustomBufferInput] = useState('');
  const [macroCycleIntervalMins, setMacroCycleIntervalMins] = useState(15);
  const [customMacroInput, setCustomMacroInput] = useState('');
  const [volatilityLevel, setVolatilityLevel] = useState('MEDIUM'); // 'LOW' | 'MEDIUM' | 'HIGH' | 'CUSTOM'
  const [volatilityCustomPercent, setVolatilityCustomPercent] = useState('');

  const [isStartingSession, setIsStartingSession] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchStocks();
    fetchNewsTemplates();
    fetchLeaderboard();
  }, []);

  // WebSockets setup
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      fetchStocks();
      fetchLeaderboard();
    };

    const handleStockUpdate = (data) => {
      setStocks((prev) =>
        prev.map((s) => {
          if (s.id === data.stockId) {
            return {
              ...s,
              currentPrice: data.newPrice,
              percentChange: data.percentChange,
              lastAdjustedAt: Date.now()
            };
          }
          return s;
        })
      );
    };

    const handleTradeExecuted = () => {
      fetchLeaderboard();
    };

    const handleBankruptAlert = (alertData) => {
      fetchLeaderboard();
      const itemWithId = {
        id: alertData?.id || (Date.now() + Math.random()),
        traderName: alertData?.traderName || 'Trader',
        action: 'BANKRUPTCY ALERT',
        symbol: '0 IC',
        price: 0,
        timestamp: Date.now(),
        isBankrupt: true
      };
      setLiveTradeFeed((prev) => [itemWithId, ...prev].slice(0, 30));
    };

    const handleActivityLog = (data) => {
      if (!data) return;
      const itemWithId = {
        ...data,
        id: data.id || (Date.now() + Math.random())
      };
      setLiveTradeFeed((prev) => [itemWithId, ...prev].slice(0, 30));
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

  const fetchStocks = async () => {
    try {
      const data = await apiFetch('/stocks');
      setStocks(data);
    } catch (err) {
      showToast('Failed to fetch stocks', 'error');
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
      // Fallback
    }
  };

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const data = await apiFetch('/admin/leaderboard');
      setLeaderboard(data);
    } catch (err) {
      // Silent error fallback
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // Stock adjustments
  const executeStockAdjust = async (stockId, percent) => {
    setAdjustingStockId(stockId);
    try {
      const data = await apiFetch(`/admin/stock/${stockId}/adjust`, {
        method: 'POST',
        body: JSON.stringify({ percent })
      });
      showToast(data.message, 'success');
      fetchStocks();
    } catch (err) {
      showToast(err.message || 'Failed to adjust stock price', 'error');
    } finally {
      setAdjustingStockId(null);
      setConfirmStockAdj(null);
    }
  };

  const handleCustomApplyClick = (stockId) => {
    const rawVal = customPercents[stockId];
    if (rawVal === undefined || rawVal === '' || isNaN(parseFloat(rawVal))) return;
    setConfirmStockAdj({ stockId, percent: parseFloat(rawVal) });
  };

  // Custom news send handler with inline confirmation
  const handleCustomNewsSend = async () => {
    if (!newsMessage.trim()) return;
    setSendingNews(true);
    try {
      await apiFetch('/admin/news', {
        method: 'POST',
        body: JSON.stringify({
          message: newsMessage.trim(),
          stockId: selectedStockId || null
        })
      });

      showToast('Breaking News broadcasted successfully!', 'success');
      setNewsMessage('');
      setSelectedStockId('');
      setCustomNewsConfirm(false);
    } catch (err) {
      showToast(err.message || 'Failed to send news', 'error');
    } finally {
      setSendingNews(false);
    }
  };

  // Template trigger handler with inline confirmation
  const handleTriggerTemplate = async (templateId) => {
    setTriggeringTemplateId(templateId);
    try {
      const data = await apiFetch('/admin/news/trigger-template', {
        method: 'POST',
        body: JSON.stringify({
          templateId,
          delaySeconds
        })
      });

      showToast(data.message || 'News template broadcasted!', 'success');
      setUsedTemplateIds((prev) => [...prev, templateId]);
      setInlineConfirmTplId(null);
    } catch (err) {
      showToast(err.message || 'Failed to trigger template', 'error');
    } finally {
      setTriggeringTemplateId(null);
    }
  };

  // Session Control Handlers
  const handleStartSession = async () => {
    setIsStartingSession(true);
    try {
      const duration = customDurationInput ? parseInt(customDurationInput, 10) : sessionDurationMins;
      const buffer = customBufferInput ? parseInt(customBufferInput, 10) : liquidationBufferMins;
      const macro = customMacroInput ? parseInt(customMacroInput, 10) : macroCycleIntervalMins;

      await apiFetch('/admin/session/start', {
        method: 'POST',
        body: JSON.stringify({
          durationMinutes: duration,
          liquidationBufferMinutes: buffer,
          macroCycleIntervalMinutes: macro,
          volatilityLevel,
          volatilityCustomPercent: volatilityLevel === 'CUSTOM' ? parseFloat(volatilityCustomPercent) : null,
          force: true
        })
      });
      adminSession?.refetchSession?.();
      showToast(`Started ${duration}-minute session (Auto-liquidate: ${buffer}m, Macro: ${macro}m, Volatility: ${volatilityLevel})!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to start session', 'error');
    } finally {
      setIsStartingSession(false);
    }
  };

  const handlePauseSession = async () => {
    try {
      await apiFetch('/admin/session/pause', {
        method: 'POST',
        body: JSON.stringify({
          breakMinutes,
          note: breakNote
        })
      });
      adminSession?.refetchSession?.();
      setShowBreakModal(false);
      showToast(`Market paused for ${breakMinutes}-minute break!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to pause session', 'error');
    }
  };

  const handleResumeSession = async () => {
    try {
      await apiFetch('/admin/session/resume', { method: 'POST' });
      adminSession?.refetchSession?.();
      showToast('Market resumed! Trading unlocked.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to resume session', 'error');
    }
  };

  const handleStopSession = async () => {
    if (!window.confirm('Are you sure you want to end the current trading session? All remaining positions will lock.')) return;
    try {
      await apiFetch('/admin/session/stop', { method: 'POST' });
      adminSession?.refetchSession?.();
      showToast('Trading session stopped. Market closed.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to stop session', 'error');
    }
  };

  // Open Trader Audit Slide-Over
  const handleOpenTraderModal = (traderId) => {
    setSelectedTraderId(traderId);
    setIsTraderModalOpen(true);
  };

  // Filtered & Sorted Stocks List
  const filteredAndSortedStocks = useMemo(() => {
    let result = stocks.filter(
      (s) =>
        s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.sector.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (stockSortMode === 'CHANGE') {
      result.sort((a, b) => (b.percentChange || 0) - (a.percentChange || 0));
    } else {
      result.sort((a, b) => a.symbol.localeCompare(b.symbol));
    }

    return result;
  }, [stocks, searchQuery, stockSortMode]);

  // Categorize News Templates
  const positiveTemplates = useMemo(
    () => templates.filter((t) => t.effectPercent > 0),
    [templates]
  );
  const negativeTemplates = useMemo(
    () => templates.filter((t) => t.effectPercent < 0),
    [templates]
  );

  const isSessionRunning = adminSession.status === 'ACTIVE' || adminSession.status === 'PAUSED';

  return (
    <div className="min-h-screen bg-[#0F1117] text-[#F0F2FF] p-4 sm:p-6 font-sans selection:bg-[#F0B429] selection:text-black">
      
      {/* Toast Notification Stack */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-xl text-xs font-mono font-bold flex items-center gap-2 animate-fadeIn border ${
          toast.type === 'error'
            ? 'bg-[#EF4444]/10 border-[#EF4444] text-[#EF4444]'
            : 'bg-[#22C55E]/10 border-[#22C55E] text-[#22C55E]'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP BAR */}
      <header className="bg-[#1A1D27] border border-[#2D3142] rounded-lg p-3 sm:p-4 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] flex items-center justify-center font-bold text-[#F0B429] text-sm">
            ⬡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wide text-[#F0F2FF]">EQUITY ARENA ADMIN</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#F0B429]/15 text-[#F0B429] border border-[#F0B429]/30">
                OPS PANEL
              </span>
            </div>
            <p className="text-[10px] text-[#7B82A0] font-mono">Real-time market simulation controller</p>
          </div>
        </div>

        {/* Center: Live Session Status Badge */}
        <div className="flex items-center gap-3 bg-[#0F1117] border border-[#2D3142] px-3.5 py-1.5 rounded-lg font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isSessionRunning ? 'bg-[#22C55E] animate-pulse' : 'bg-[#EF4444]'}`} />
            <span className="font-bold text-[#F0F2FF]">
              {adminSession.status === 'ACTIVE' ? (
                <span className="text-[#22C55E]">Live</span>
              ) : adminSession.status === 'PAUSED' ? (
                <span className="text-[#F0B429]">Market Paused</span>
              ) : (
                <span className="text-[#7B82A0]">No Session</span>
              )}
            </span>
          </div>

          {isSessionRunning && (
            <>
              <span className="text-[#2D3142]">|</span>
              <GameClock sessionData={adminSession} size="sm" title="REMAINING" />
            </>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          {adminSession.status === 'ACTIVE' && (
            <button
              onClick={() => setShowBreakModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#F0B429]/10 border border-[#F0B429]/40 text-[#F0B429] hover:bg-[#F0B429]/20 transition-all flex items-center gap-1.5"
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>PAUSE BREAK</span>
            </button>
          )}

          {adminSession.status === 'PAUSED' && (
            <button
              onClick={handleResumeSession}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#22C55E]/10 border border-[#22C55E]/40 text-[#22C55E] hover:bg-[#22C55E]/20 transition-all flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>RESUME MARKET</span>
            </button>
          )}

          {isSessionRunning && (
            <button
              onClick={handleStopSession}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#EF4444]/10 border border-[#EF4444]/40 text-[#EF4444] hover:bg-[#EF4444]/20 transition-all flex items-center gap-1.5"
            >
              <Square className="w-3.5 h-3.5" />
              <span>END SESSION</span>
            </button>
          )}

          <button
            onClick={logout}
            className="p-2 rounded-lg text-[#7B82A0] hover:text-[#EF4444] hover:bg-[#1F2235] transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ROW 1: SESSION SETUP / RUNNING SUMMARY */}
      <section className="bg-[#1A1D27] border border-[#2D3142] rounded-lg p-4 sm:p-5 mb-6 shadow-lg">
        <div className="text-[10px] uppercase font-mono tracking-[0.12em] text-[#7B82A0] font-bold mb-3 flex items-center justify-between">
          <span>{isSessionRunning ? 'SESSION STATUS' : 'SESSION SETUP'}</span>
          <span className="text-[9px] text-[#F0B429]">Phase 50 Admin Engine</span>
        </div>

        {!isSessionRunning ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* 1. Duration */}
              <div className="space-y-1.5">
                <label className="text-xs text-[#7B82A0] font-medium block">Duration</label>
                <div className="flex items-center gap-1.5">
                  {[30, 60, 180].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        setSessionDurationMins(mins);
                        setCustomDurationInput('');
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                        sessionDurationMins === mins && !customDurationInput
                          ? 'bg-[#F0B429] text-black'
                          : 'bg-[#0F1117] text-[#7B82A0] hover:text-[#F0F2FF] border border-[#2D3142]'
                      }`}
                    >
                      {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  placeholder="Custom mins"
                  value={customDurationInput}
                  onChange={(e) => setCustomDurationInput(e.target.value)}
                  className="w-full h-8 bg-[#0F1117] border border-[#2D3142] rounded-md px-2.5 text-xs text-[#F0F2FF] placeholder-[#7B82A0] font-mono focus:outline-none focus:border-[#F0B429]"
                />
              </div>

              {/* 2. Auto-Liquidate Buffer */}
              <div className="space-y-1.5">
                <label className="text-xs text-[#7B82A0] font-medium block">Auto-Liquidate</label>
                <div className="flex items-center gap-1.5">
                  {[2, 5, 10].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        setLiquidationBufferMins(mins);
                        setCustomBufferInput('');
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                        liquidationBufferMins === mins && !customBufferInput
                          ? 'bg-[#F0B429] text-black'
                          : 'bg-[#0F1117] text-[#7B82A0] hover:text-[#F0F2FF] border border-[#2D3142]'
                      }`}
                    >
                      {mins}m before end
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  placeholder="Custom mins"
                  value={customBufferInput}
                  onChange={(e) => setCustomBufferInput(e.target.value)}
                  className="w-full h-8 bg-[#0F1117] border border-[#2D3142] rounded-md px-2.5 text-xs text-[#F0F2FF] placeholder-[#7B82A0] font-mono focus:outline-none focus:border-[#F0B429]"
                />
              </div>

              {/* 3. Macro Cycle Interval */}
              <div className="space-y-1.5">
                <label className="text-xs text-[#7B82A0] font-medium block">Macro Cycle</label>
                <div className="flex items-center gap-1.5">
                  {[3, 5, 15].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        setMacroCycleIntervalMins(mins);
                        setCustomMacroInput('');
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                        macroCycleIntervalMins === mins && !customMacroInput
                          ? 'bg-[#F0B429] text-black'
                          : 'bg-[#0F1117] text-[#7B82A0] hover:text-[#F0F2FF] border border-[#2D3142]'
                      }`}
                    >
                      Every {mins}m
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  placeholder="Custom mins"
                  value={customMacroInput}
                  onChange={(e) => setCustomMacroInput(e.target.value)}
                  className="w-full h-8 bg-[#0F1117] border border-[#2D3142] rounded-md px-2.5 text-xs text-[#F0F2FF] placeholder-[#7B82A0] font-mono focus:outline-none focus:border-[#F0B429]"
                />
              </div>

              {/* 4. Volatility */}
              <div className="space-y-1.5">
                <label className="text-xs text-[#7B82A0] font-medium block">Volatility</label>
                <div className="flex items-center gap-1.5">
                  {['LOW', 'MEDIUM', 'HIGH'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setVolatilityLevel(lvl)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                        volatilityLevel === lvl
                          ? 'bg-[#F0B429] text-black'
                          : 'bg-[#0F1117] text-[#7B82A0] hover:text-[#F0F2FF] border border-[#2D3142]'
                      }`}
                    >
                      {lvl === 'MEDIUM' ? 'Med' : lvl}
                    </button>
                  ))}
                </div>
                {volatilityLevel === 'CUSTOM' ? (
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Custom % range"
                    value={volatilityCustomPercent}
                    onChange={(e) => setVolatilityCustomPercent(e.target.value)}
                    className="w-full h-8 bg-[#0F1117] border border-[#2D3142] rounded-md px-2.5 text-xs text-[#F0F2FF] placeholder-[#7B82A0] font-mono focus:outline-none focus:border-[#F0B429]"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setVolatilityLevel('CUSTOM')}
                    className="text-[10px] text-[#7B82A0] hover:text-[#F0B429] font-mono block mt-1 underline"
                  >
                    + Set Custom %
                  </button>
                )}
              </div>

            </div>

            <button
              type="button"
              disabled={isStartingSession}
              onClick={handleStartSession}
              className="w-full h-[38px] bg-[#F0B429] hover:bg-[#d9a120] text-black font-bold uppercase tracking-wider text-xs rounded-lg transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span>{isStartingSession ? 'Starting Session...' : 'START SESSION'}</span>
            </button>
          </div>
        ) : (
          <div className="bg-[#0F1117] border border-[#2D3142] rounded-lg p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22C55E]"></span>
                </span>
                <span className="font-extrabold text-[#22C55E]">● SESSION RUNNING</span>
              </div>
              <GameClock sessionData={adminSession} size="md" title="SESSION COUNTDOWN" />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[#7B82A0]">
              <div>
                <span>Auto-liquidate: </span>
                <span className="text-[#F0F2FF] font-bold">
                  {adminSession.liquidationBufferMinutes || 5} min before end
                </span>
              </div>

              <div>
                <span>Macro cycle: </span>
                <span className="text-[#F0F2FF] font-bold">
                  {adminSession.macroCycleIntervalMinutes || 15} min
                </span>
              </div>

              <div>
                <span>Volatility: </span>
                <span className="text-[#F0B429] font-bold uppercase">
                  {adminSession.volatilityLevel || 'MEDIUM'}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ROW 2: TWO COLUMNS SIDE BY SIDE (NEWS 42% | STOCKS 58%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* Left Column (42%) — SEND NEWS */}
        <div className="lg:col-span-5 bg-[#1A1D27] border border-[#2D3142] rounded-lg p-4 sm:p-5 shadow-lg flex flex-col">
          <div className="text-[10px] uppercase font-mono tracking-[0.12em] text-[#7B82A0] font-bold mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#F0B429]" />
              <span>SEND NEWS</span>
            </div>
            <span className="text-[10px] text-[#7B82A0] font-mono">
              {templates.length} Templates Available
            </span>
          </div>

          {/* Templates Grid (Positive / Negative sub-columns) */}
          <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto max-h-[380px] pr-1 mb-4">
            {/* Positive Templates */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono font-bold text-[#22C55E] border-b border-[#2D3142] pb-1 uppercase flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                <span>POSITIVE ({positiveTemplates.length})</span>
              </div>

              {positiveTemplates.map((t) => {
                const isUsed = usedTemplateIds.includes(t.id);
                const isConfirming = inlineConfirmTplId === t.id;
                const targets = t.targetStocks && t.targetStocks.length > 0
                  ? t.targetStocks
                  : [{ stockName: t.sector, symbol: '', effectPercent: t.effectPercent }];

                return (
                  <div key={t.id} className="p-2 bg-[#0F1117] border border-[#2D3142] rounded-lg space-y-1.5 text-xs">
                    <p className={`text-[11px] font-mono line-clamp-2 ${isUsed ? 'opacity-40 line-through text-[#7B82A0]' : 'text-[#F0F2FF]'}`}>
                      {t.headline}
                    </p>

                    {/* Affected Target Stocks List */}
                    <div className="space-y-1 my-1">
                      {targets.map((tgt, idx) => {
                        const isUp = tgt.effectPercent >= 0;
                        return (
                          <div
                            key={tgt.symbol || tgt.stockName || `tgt-${idx}`}
                            className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded border flex items-center justify-between font-bold ${
                              isUp
                                ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]'
                                : 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
                            }`}
                          >
                            <span className="truncate mr-1">→ {tgt.stockName} {tgt.symbol ? `(${tgt.symbol})` : ''}</span>
                            <span className="shrink-0 font-extrabold">
                              {isUp ? '▲ +' : '▼ '}{tgt.effectPercent}%
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {!isConfirming ? (
                      <div className="flex items-center justify-end pt-0.5">
                        <button
                          type="button"
                          onClick={() => setInlineConfirmTplId(t.id)}
                          className="px-2.5 py-0.5 bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] text-[10px] font-mono font-bold rounded hover:bg-[#22C55E]/30 transition-colors"
                        >
                          SEND
                        </button>
                      </div>
                    ) : (
                      <div className="pt-1.5 border-t border-[#2D3142] space-y-1.5 animate-fadeIn font-mono">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-[#7B82A0]">Delay:</span>
                          <input
                            type="number"
                            value={delaySeconds}
                            onChange={(e) => setDelaySeconds(parseInt(e.target.value, 10) || 0)}
                            className="w-12 h-5 bg-[#1A1D27] border border-[#2D3142] text-center rounded text-[10px] text-[#F0F2FF]"
                          />
                          <span className="text-[#7B82A0]">sec</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={triggeringTemplateId === t.id}
                            onClick={() => handleTriggerTemplate(t.id)}
                            className="flex-1 py-1 bg-[#22C55E] text-black font-bold text-[9px] rounded uppercase hover:bg-[#1eb053]"
                          >
                            CONFIRM
                          </button>
                          <button
                            type="button"
                            onClick={() => setInlineConfirmTplId(null)}
                            className="px-1.5 py-1 bg-[#2D3142] text-[#7B82A0] hover:text-[#F0F2FF] font-bold text-[9px] rounded"
                          >
                            X
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Negative Templates */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono font-bold text-[#EF4444] border-b border-[#2D3142] pb-1 uppercase flex items-center gap-1">
                <ThumbsDown className="w-3 h-3" />
                <span>NEGATIVE ({negativeTemplates.length})</span>
              </div>

              {negativeTemplates.map((t) => {
                const isUsed = usedTemplateIds.includes(t.id);
                const isConfirming = inlineConfirmTplId === t.id;
                const targets = t.targetStocks && t.targetStocks.length > 0
                  ? t.targetStocks
                  : [{ stockName: t.sector, symbol: '', effectPercent: t.effectPercent }];

                return (
                  <div key={t.id} className="p-2 bg-[#0F1117] border border-[#2D3142] rounded-lg space-y-1.5 text-xs">
                    <p className={`text-[11px] font-mono line-clamp-2 ${isUsed ? 'opacity-40 line-through text-[#7B82A0]' : 'text-[#F0F2FF]'}`}>
                      {t.headline}
                    </p>

                    {/* Affected Target Stocks List */}
                    <div className="space-y-1 my-1">
                      {targets.map((tgt, idx) => {
                        const isUp = tgt.effectPercent >= 0;
                        return (
                          <div
                            key={tgt.symbol || tgt.stockName || `neg-tgt-${idx}`}
                            className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded border flex items-center justify-between font-bold ${
                              isUp
                                ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]'
                                : 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
                            }`}
                          >
                            <span className="truncate mr-1">→ {tgt.stockName} {tgt.symbol ? `(${tgt.symbol})` : ''}</span>
                            <span className="shrink-0 font-extrabold">
                              {isUp ? '▲ +' : '▼ '}{tgt.effectPercent}%
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {!isConfirming ? (
                      <div className="flex items-center justify-end pt-0.5">
                        <button
                          type="button"
                          onClick={() => setInlineConfirmTplId(t.id)}
                          className="px-2.5 py-0.5 bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-[10px] font-mono font-bold rounded hover:bg-[#EF4444]/30 transition-colors"
                        >
                          SEND
                        </button>
                      </div>
                    ) : (
                      <div className="pt-1.5 border-t border-[#2D3142] space-y-1.5 animate-fadeIn font-mono">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-[#7B82A0]">Delay:</span>
                          <input
                            type="number"
                            value={delaySeconds}
                            onChange={(e) => setDelaySeconds(parseInt(e.target.value, 10) || 0)}
                            className="w-12 h-5 bg-[#1A1D27] border border-[#2D3142] text-center rounded text-[10px] text-[#F0F2FF]"
                          />
                          <span className="text-[#7B82A0]">sec</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={triggeringTemplateId === t.id}
                            onClick={() => handleTriggerTemplate(t.id)}
                            className="flex-1 py-1 bg-[#EF4444] text-white font-bold text-[9px] rounded uppercase hover:bg-[#d93838]"
                          >
                            CONFIRM
                          </button>
                          <button
                            type="button"
                            onClick={() => setInlineConfirmTplId(null)}
                            className="px-1.5 py-1 bg-[#2D3142] text-[#7B82A0] hover:text-[#F0F2FF] font-bold text-[9px] rounded"
                          >
                            X
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Breaking News Input */}
          <div className="pt-3 border-t border-[#2D3142] space-y-2 font-mono">
            <div className="text-[10px] font-bold text-[#F0B429] uppercase">CUSTOM BREAKING NEWS</div>
            <textarea
              rows={2}
              placeholder="Write custom market announcement..."
              value={newsMessage}
              onChange={(e) => setNewsMessage(e.target.value)}
              className="w-full bg-[#0F1117] border border-[#2D3142] rounded-lg p-2 text-xs text-[#F0F2FF] placeholder-[#7B82A0] focus:outline-none focus:border-[#F0B429]"
            />

            {!customNewsConfirm ? (
              <button
                type="button"
                disabled={sendingNews || !newsMessage.trim()}
                onClick={() => setCustomNewsConfirm(true)}
                className="w-full py-1.5 bg-[#F0B429] text-black font-bold text-xs rounded-lg uppercase hover:bg-[#d9a120] transition-colors disabled:opacity-50"
              >
                SEND CUSTOM NEWS
              </button>
            ) : (
              <div className="flex items-center gap-2 animate-fadeIn">
                <button
                  type="button"
                  disabled={sendingNews}
                  onClick={handleCustomNewsSend}
                  className="flex-1 py-1.5 bg-[#22C55E] text-black font-bold text-xs rounded-lg uppercase hover:bg-[#1eb053]"
                >
                  CONFIRM BROADCAST
                </button>
                <button
                  type="button"
                  onClick={() => setCustomNewsConfirm(false)}
                  className="px-3 py-1.5 bg-[#2D3142] text-[#7B82A0] hover:text-[#F0F2FF] font-bold text-xs rounded-lg"
                >
                  CANCEL
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (58%) — STOCKS */}
        <div className="lg:col-span-7 bg-[#1A1D27] border border-[#2D3142] rounded-lg p-4 sm:p-5 shadow-lg flex flex-col">
          <div className="text-[10px] uppercase font-mono tracking-[0.12em] text-[#7B82A0] font-bold mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>STOCKS ({stocks.length})</span>
              <input
                type="text"
                placeholder="Filter stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-6 bg-[#0F1117] border border-[#2D3142] rounded px-2 text-[10px] text-[#F0F2FF] placeholder-[#7B82A0] focus:outline-none"
              />
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-1 bg-[#0F1117] border border-[#2D3142] rounded p-0.5 text-[10px]">
              <button
                type="button"
                onClick={() => setStockSortMode('CHANGE')}
                className={`px-2 py-0.5 rounded font-mono font-bold ${
                  stockSortMode === 'CHANGE' ? 'bg-[#F0B429] text-black' : 'text-[#7B82A0] hover:text-[#F0F2FF]'
                }`}
              >
                % Change ▼
              </button>
              <button
                type="button"
                onClick={() => setStockSortMode('ALPHA')}
                className={`px-2 py-0.5 rounded font-mono font-bold ${
                  stockSortMode === 'ALPHA' ? 'bg-[#F0B429] text-black' : 'text-[#7B82A0] hover:text-[#F0F2FF]'
                }`}
              >
                A-Z
              </button>
            </div>
          </div>

          {/* Compact Stock Rows List */}
          <div className="space-y-2 flex-1 overflow-y-auto max-h-[500px] pr-1">
            {loadingStocks ? (
              <div className="py-12 text-center text-[#7B82A0] text-xs font-mono">Loading stocks...</div>
            ) : filteredAndSortedStocks.length === 0 ? (
              <div className="py-12 text-center text-[#7B82A0] text-xs font-mono">No stocks found matching search.</div>
            ) : (
              filteredAndSortedStocks.map((s) => {
                const isPos = (s.percentChange || 0) >= 0;
                const isAdjusting = adjustingStockId === s.id;
                const isConfirmingCustom = confirmStockAdj?.stockId === s.id;

                return (
                  <div
                    key={s.id}
                    className="p-2.5 bg-[#0F1117] border border-[#2D3142] rounded-lg hover:bg-[#1F2235] transition-colors space-y-2 font-mono"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#F0F2FF]">{s.symbol}</span>
                        <span className="text-[#7B82A0] text-[11px] hidden sm:inline">{s.name}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#F0F2FF]">{fmtMoney(s.currentPrice)} IC</span>
                        <span className={`text-[11px] font-bold ${isPos ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                          {isPos ? '▲+' : '▼'}{s.percentChange || 0}%
                        </span>
                      </div>
                    </div>

                    {/* Stock Price Adjustment Row */}
                    <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-[#2D3142]/60 text-[10px]">
                      {/* Presets */}
                      <div className="flex items-center gap-1">
                        {[10, 25, -10, -25].map((pct) => (
                          <button
                            key={pct}
                            disabled={isAdjusting}
                            onClick={() => executeStockAdjust(s.id, pct)}
                            className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                              pct > 0
                                ? 'bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] hover:bg-[#22C55E]/30'
                                : 'bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/30'
                            }`}
                          >
                            {pct > 0 ? `+${pct}%` : `${pct}%`}
                          </button>
                        ))}
                      </div>

                      {/* Custom % Apply */}
                      {!isConfirmingCustom ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            placeholder="___%"
                            value={customPercents[s.id] || ''}
                            onChange={(e) =>
                              setCustomPercents({ ...customPercents, [s.id]: e.target.value })
                            }
                            className="w-14 h-5 bg-[#1A1D27] border border-[#2D3142] text-center rounded text-[10px] text-[#F0F2FF] focus:outline-none focus:border-[#F0B429]"
                          />
                          <button
                            type="button"
                            onClick={() => handleCustomApplyClick(s.id)}
                            className="px-2 py-0.5 bg-[#F0B429]/20 border border-[#F0B429]/40 text-[#F0B429] font-bold rounded hover:bg-[#F0B429]/40 transition-colors"
                          >
                            APPLY
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 animate-fadeIn">
                          <span className="text-[#F0B429] font-bold">Apply {confirmStockAdj.percent}%?</span>
                          <button
                            type="button"
                            onClick={() => executeStockAdjust(s.id, confirmStockAdj.percent)}
                            className="px-2 py-0.5 bg-[#22C55E] text-black font-bold rounded uppercase hover:bg-[#1eb053]"
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmStockAdj(null)}
                            className="px-1.5 py-0.5 bg-[#2D3142] text-[#7B82A0] hover:text-[#F0F2FF] font-bold rounded"
                          >
                            NO
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ROW 3: TWO COLUMNS SIDE BY SIDE (LIVE ACTIVITY 42% | LEADERBOARD 58%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (42%) — LIVE ACTIVITY */}
        <div className="lg:col-span-5 bg-[#1A1D27] border border-[#2D3142] rounded-lg p-4 sm:p-5 shadow-lg flex flex-col">
          <div className="text-[10px] uppercase font-mono tracking-[0.12em] text-[#7B82A0] font-bold mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#F0B429]" />
              <span>LIVE ACTIVITY STREAM</span>
            </div>
            <span className="text-[9px] text-[#7B82A0]">Real-time events</span>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[350px] pr-1 font-mono text-xs">
            {liveTradeFeed.length === 0 ? (
              <div className="py-12 text-center text-[#7B82A0] text-xs italic">
                Awaiting live trades & admin broadcasts...
              </div>
            ) : (
              liveTradeFeed.map((item) => {
                const borderClass = item.isBankrupt
                  ? 'border-l-4 border-l-[#EF4444]'
                  : item.isTopUp
                  ? 'border-l-4 border-l-[#F0B429]'
                  : 'border-l-4 border-l-[#22C55E]';

                return (
                  <div
                    key={item.id}
                    className={`p-2.5 bg-[#0F1117] border border-[#2D3142] ${borderClass} rounded-r-lg space-y-1`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span
                        onClick={() => item.traderId && handleOpenTraderModal(item.traderId)}
                        className="font-bold text-[#F0F2FF] hover:text-[#F0B429] cursor-pointer underline decoration-dotted"
                      >
                        {item.traderName || 'Trader'}
                      </span>
                      <span className="text-[10px] text-[#7B82A0]">
                        {new Date(item.timestamp || Date.now()).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#7B82A0]">
                      {item.action || 'Trade executed'}: <span className="font-bold text-[#F0F2FF]">{item.quantity} {item.symbol}</span> @ <span className="font-bold text-[#22C55E]">{fmtMoney(item.price)} IC</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (58%) — LEADERBOARD */}
        <div className="lg:col-span-7 bg-[#1A1D27] border border-[#2D3142] rounded-lg p-4 sm:p-5 shadow-lg flex flex-col">
          <div className="text-[10px] uppercase font-mono tracking-[0.12em] text-[#7B82A0] font-bold mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-[#F0B429]" />
              <span>TOURNAMENT LEADERBOARD ({leaderboard.length})</span>
            </div>
            <button
              type="button"
              onClick={fetchLeaderboard}
              disabled={loadingLeaderboard}
              className="text-[10px] text-[#F0B429] hover:underline font-mono"
            >
              REFRESH
            </button>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[350px] pr-1 font-mono text-xs">
            {loadingLeaderboard ? (
              <div className="py-12 text-center text-[#7B82A0] text-xs">Loading standings...</div>
            ) : leaderboard.length === 0 ? (
              <div className="py-12 text-center text-[#7B82A0] text-xs italic">No active traders found.</div>
            ) : (
              leaderboard.map((entry) => {
                const isTop1 = entry.rank === 1;
                const isTop3 = entry.rank <= 3;

                return (
                  <div
                    key={entry.id || entry.rank}
                    className={`p-2.5 bg-[#0F1117] border ${
                      isTop3 ? 'border-l-4 border-l-[#F0B429] border-[#2D3142]' : 'border-[#2D3142]'
                    } rounded-lg flex items-center justify-between hover:bg-[#1F2235] transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-mono font-extrabold text-sm w-6 ${isTop1 ? 'text-[#F0B429]' : 'text-[#7B82A0]'}`}>
                        #{entry.rank}
                      </span>
                      <div>
                        <span className="font-bold text-[#F0F2FF] block text-xs">{entry.name}</span>
                        <span className="text-[10px] text-[#7B82A0] block">{entry.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-[#22C55E] block">
                          {fmtMoney(entry.totalPortfolioValue)} IC
                        </span>
                        <span className="text-[9.5px] text-[#7B82A0] block">
                          Cash: {fmtMoney(entry.walletBalance)} IC
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenTraderModal(entry.id)}
                        className="px-2.5 py-1 bg-[#F0B429]/15 border border-[#F0B429]/30 text-[#F0B429] text-[10px] font-mono font-bold rounded hover:bg-[#F0B429]/30 transition-colors"
                      >
                        VIEW
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Break Modal */}
      {showBreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 font-mono animate-fadeIn backdrop-blur-xs">
          <div className="bg-[#1A1D27] border border-[#2D3142] rounded-lg p-6 max-w-md w-full space-y-4 text-[#F0F2FF] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2D3142] pb-3">
              <h3 className="text-sm font-bold text-[#F0B429] uppercase flex items-center gap-1.5">
                <Coffee className="w-4 h-4" />
                <span>PAUSE TRADING FOR BREAK</span>
              </h3>
              <button onClick={() => setShowBreakModal(false)} className="text-[#7B82A0] hover:text-[#F0F2FF]">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-[#7B82A0] uppercase block mb-1">Break Duration (Minutes):</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(parseInt(e.target.value, 10) || 10)}
                  className="w-full h-8 bg-[#0F1117] border border-[#2D3142] rounded-md px-2.5 text-xs text-[#F0F2FF] focus:outline-none focus:border-[#F0B429]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#7B82A0] uppercase block mb-1">Break Announcement Note:</label>
                <textarea
                  rows={3}
                  value={breakNote}
                  onChange={(e) => setBreakNote(e.target.value)}
                  className="w-full bg-[#0F1117] border border-[#2D3142] rounded-md p-2 text-xs text-[#F0F2FF] focus:outline-none focus:border-[#F0B429]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2D3142]">
              <button
                type="button"
                onClick={() => setShowBreakModal(false)}
                className="px-3 py-1.5 rounded-lg bg-[#2D3142] text-[#7B82A0] hover:text-[#F0F2FF] text-xs font-bold"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handlePauseSession}
                className="px-4 py-1.5 rounded-lg bg-[#F0B429] text-black text-xs font-bold uppercase hover:bg-[#d9a120]"
              >
                LOCK FLOOR & PAUSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Trader Drill-Down Slide-Over Modal */}
      <AdminTraderDetailModal
        traderId={selectedTraderId}
        isOpen={isTraderModalOpen}
        onClose={() => setIsTraderModalOpen(false)}
      />

    </div>
  );
}
