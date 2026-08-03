import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../services/api';
import { SessionCountdown } from '../components/SessionCountdown';
import { AdminTraderDetailModal } from '../components/AdminTraderDetailModal';
import { 
  TrendingUp, TrendingDown, Shield, LogOut, Radio, Send, 
  Trophy, Search, RefreshCw, CheckCircle2, AlertCircle, Sparkles, SlidersHorizontal, Clock, Zap, Eye, Sun, Moon, RotateCcw
} from 'lucide-react';

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
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
  const [pendingDelayedNews, setPendingDelayedNews] = useState([]);
  const [delaySeconds, setDelaySeconds] = useState(60);
  const [triggeringTemplateId, setTriggeringTemplateId] = useState(null);

  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Admin Trader Drill-Down Modal state
  const [selectedTraderId, setSelectedTraderId] = useState(null);
  const [isTraderModalOpen, setIsTraderModalOpen] = useState(false);

  const [toast, setToast] = useState(null);

  const handleStartNewSession = async () => {
    try {
      const data = await apiFetch('/admin/session/start', {
        method: 'POST',
        body: JSON.stringify({ durationHours: 3 })
      });
      showToast(data.message || 'New 3-hour trading session started!');
    } catch (err) {
      showToast(err.message || 'Failed to start session', 'error');
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

      showToast('Custom news broadcasted to all connected traders!');
      setRecentNews((prev) => [data.news, ...prev.slice(0, 9)]);
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
          delaySeconds: parseInt(delaySeconds, 10) || 60
        })
      });

      showToast(data.message);
      if (data.pendingItem) {
        setPendingDelayedNews((prev) => [data.pendingItem, ...prev]);
      }
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

  const filteredStocks = stocks.filter(
    (s) =>
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen theme-bg-main theme-text-main flex flex-col transition-colors">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border transition-all animate-bounce ${
          toast.type === 'error'
            ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
            : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Admin Trader Drill-Down Modal */}
      <AdminTraderDetailModal
        traderId={selectedTraderId}
        isOpen={isTraderModalOpen}
        onClose={() => setIsTraderModalOpen(false)}
      />

      <header className="border-b theme-border theme-bg-panel backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-500">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold theme-text-main font-mono tracking-tight">ADMIN HOST CONSOLE</h1>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-indigo-500/20 text-indigo-500 border border-indigo-500/30">
                  Game Host
                </span>
              </div>
              <p className="text-xs theme-text-muted">Equity Arena Pricing, Headlines & Sector Controls</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            
            <SessionCountdown />

            <button
              onClick={handleStartNewSession}
              className="px-3.5 py-1.5 bg-[#D4A017] hover:bg-[#D4A017]/90 text-slate-950 font-heading font-extrabold text-xs rounded-[4px] shadow transition-all flex items-center gap-1.5 min-h-[34px] btn-terminal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>START NEW 3-HOUR SESSION</span>
            </button>

            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              isConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
            }`}>
              <Radio className={`w-3.5 h-3.5 ${isConnected ? 'animate-pulse' : ''}`} />
              <span>{isConnected ? 'Stream Connected' : 'Offline'}</span>
            </div>

            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="p-2.5 rounded-xl border theme-border theme-bg-card theme-bg-card-hover theme-text-main transition-all active:scale-95 shadow-sm"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            <div className="h-6 w-px theme-border hidden sm:block" />

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold theme-text-muted hidden md:inline">{user?.email}</span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border theme-border theme-bg-card theme-bg-card-hover theme-text-main text-xs font-bold transition-all shadow-sm min-h-[36px]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* Prebuilt News Templates */}
        <div className="theme-bg-card p-6 rounded-2xl border theme-border shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold theme-text-main uppercase tracking-wider flex items-center gap-2">
                  Prebuilt News Templates (Delayed Impact)
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </h2>
                <p className="text-xs theme-text-muted">
                  Broadcasting sends headline ONLY to traders. Price effect triggers automatically after selected delay.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 theme-bg-panel px-3 py-1.5 rounded-xl border theme-border">
              <Clock className="w-4 h-4 theme-text-dim" />
              <span className="text-xs theme-text-muted font-semibold">Impact Delay:</span>
              <select
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(Number(e.target.value))}
                className="theme-bg-card theme-text-main text-xs font-bold px-2.5 py-1 rounded border theme-border focus:outline-none"
              >
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds (Default)</option>
                <option value={90}>90 seconds</option>
                <option value={120}>2 minutes</option>
              </select>
            </div>
          </div>

          {pendingDelayedNews.length > 0 && (
            <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-1.5">
              <div className="font-bold text-amber-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Pending Delayed News Impact Timers ({pendingDelayedNews.length} active)</span>
              </div>
              {pendingDelayedNews.map((p) => (
                <div key={p.id} className="flex justify-between items-center theme-text-muted text-[11px] theme-bg-panel p-2 rounded border theme-border">
                  <span className="truncate max-w-md">"{p.headline}"</span>
                  <span className="font-mono text-amber-500 font-bold">
                    Target: {p.sector} ({p.effectPercent > 0 ? '+' : ''}{p.effectPercent}%) — Executes at {new Date(p.triggerAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((tpl) => {
              const isPositive = tpl.effectPercent >= 0;
              return (
                <div
                  key={tpl.id}
                  className="theme-bg-panel p-4 rounded-xl border theme-border hover:border-amber-500/40 transition-all flex flex-col justify-between gap-3 shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold theme-bg-card theme-text-muted border theme-border">
                        {tpl.sector}
                      </span>
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
                    className="w-full py-2 bg-amber-500/20 hover:bg-amber-500 text-amber-500 hover:text-slate-950 font-bold text-xs rounded-xl transition-all border border-amber-500/30 flex items-center justify-center gap-1.5 min-h-[36px]"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Broadcast ({delaySeconds}s Delay)</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle Split: Custom News & Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-5 theme-bg-card p-6 rounded-2xl border theme-border flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-500">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold theme-text-main uppercase tracking-wider">Custom News Broadcast</h2>
                  <p className="text-xs theme-text-muted">Send manual non-templated market announcements</p>
                </div>
              </div>

              <form onSubmit={handleSendNews} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold theme-text-muted mb-1">Custom Headline</label>
                  <textarea
                    rows={3}
                    required
                    value={newsMessage}
                    onChange={(e) => setNewsMessage(e.target.value)}
                    placeholder="Enter manual news announcement..."
                    className="w-full theme-bg-panel border theme-border rounded-xl p-3 text-xs theme-text-main placeholder:theme-text-dim focus:outline-none focus:border-indigo-500 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold theme-text-muted mb-1">Tag Stock (Optional)</label>
                  <select
                    value={selectedStockId}
                    onChange={(e) => setSelectedStockId(e.target.value)}
                    className="w-full theme-bg-panel border theme-border rounded-xl px-3 py-2.5 text-xs theme-text-main focus:outline-none focus:border-indigo-500 transition-all min-h-[40px]"
                  >
                    <option value="">-- General Announcement --</option>
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
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs font-mono uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 min-h-[44px]"
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
                  <h2 className="text-sm font-bold theme-text-main uppercase tracking-wider">Live Player Leaderboard</h2>
                  <p className="text-xs theme-text-muted">Click any trader row to monitor full holdings & transaction logs</p>
                </div>
              </div>

              <button
                onClick={fetchLeaderboard}
                disabled={loadingLeaderboard}
                className="flex items-center gap-1 px-3 py-1.5 theme-bg-panel hover:theme-bg-card-hover theme-text-main text-xs font-semibold rounded-xl transition-all border theme-border min-h-[36px]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLeaderboard ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-auto max-h-64">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b theme-border theme-text-muted font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Trader</th>
                    <th className="py-2.5 px-3 text-right">Wallet</th>
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
                    leaderboard.map((trader) => (
                      <tr
                        key={trader.id}
                        onClick={() => handleOpenTraderDetail(trader.id)}
                        className="theme-bg-card-hover cursor-pointer transition-colors group"
                      >
                        <td className="py-2.5 px-3 font-bold theme-text-muted">
                          {`#${trader.rank}`}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold theme-text-main group-hover:text-indigo-500 transition-colors">
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
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-500">
                          {trader.totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} IC
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenTraderDetail(trader.id);
                            }}
                            className="p-1.5 bg-indigo-500/10 group-hover:bg-indigo-500 text-indigo-500 group-hover:text-white rounded-lg transition-all min-h-[32px] min-w-[32px]"
                            title="Monitor Trader History"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* 15 India Stock Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 theme-bg-card p-4 rounded-2xl border theme-border shadow-sm">
            <div>
              <h2 className="text-base font-bold theme-text-main flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-indigo-500" />
                Live Stock Controls (15 India Sector Stocks)
              </h2>
              <p className="text-xs theme-text-muted">Prices starting between 5 and 15 Ignite Coins (IC)</p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-3 w-4 h-4 theme-text-dim" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbol, name, or sector..."
                className="w-full theme-bg-panel border theme-border rounded-xl py-2 pl-9 pr-4 text-xs theme-text-main placeholder:theme-text-dim focus:outline-none focus:border-indigo-500 transition-all min-h-[40px]"
              />
            </div>
          </div>

          {loadingStocks ? (
            <div className="py-16 text-center theme-text-dim text-sm">
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

                    <div className="space-y-2 pt-2 border-t theme-border">
                      <div className="grid grid-cols-4 gap-1.5">
                        <button
                          onClick={() => handleAdjustPrice(stock.id, 10)}
                          disabled={adjustingStockId === stock.id}
                          className="py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-500 border border-emerald-500/30 text-xs font-bold font-mono rounded-lg transition-all min-h-[32px]"
                        >
                          +10%
                        </button>
                        <button
                          onClick={() => handleAdjustPrice(stock.id, 50)}
                          disabled={adjustingStockId === stock.id}
                          className="py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-500 border border-emerald-500/40 text-xs font-bold font-mono rounded-lg transition-all min-h-[32px]"
                        >
                          +50%
                        </button>
                        <button
                          onClick={() => handleAdjustPrice(stock.id, -10)}
                          disabled={adjustingStockId === stock.id}
                          className="py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-500 border border-rose-500/30 text-xs font-bold font-mono rounded-lg transition-all min-h-[32px]"
                        >
                          -10%
                        </button>
                        <button
                          onClick={() => handleAdjustPrice(stock.id, -50)}
                          disabled={adjustingStockId === stock.id}
                          className="py-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-500 border border-rose-500/40 text-xs font-bold font-mono rounded-lg transition-all min-h-[32px]"
                        >
                          -50%
                        </button>
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const val = parseFloat(customVal);
                          if (!isNaN(val)) {
                            handleAdjustPrice(stock.id, val);
                          }
                        }}
                        className="flex gap-1.5"
                      >
                        <input
                          type="number"
                          step="any"
                          value={customVal}
                          onChange={(e) =>
                            setCustomPercents((prev) => ({ ...prev, [stock.id]: e.target.value }))
                          }
                          placeholder="Custom % (e.g. +25, -15)"
                          className="flex-1 theme-bg-panel border theme-border rounded-lg px-2.5 py-1 text-xs theme-text-main font-mono placeholder:theme-text-dim focus:outline-none focus:border-indigo-500 min-h-[32px]"
                        />
                        <button
                          type="submit"
                          disabled={adjustingStockId === stock.id || !customVal}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-40 min-h-[32px]"
                        >
                          Apply
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
