import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { apiFetch } from '../services/api';
import { AdminTraderDetailModal } from '../components/AdminTraderDetailModal';
import { 
  TrendingUp, TrendingDown, Shield, LogOut, Radio, Send, 
  Trophy, Search, RefreshCw, CheckCircle2, AlertCircle, Sparkles, SlidersHorizontal, Clock, Zap, Eye
} from 'lucide-react';

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();

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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
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
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
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

      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-wide">ADMIN MARKET CONTROL</h1>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Game Host
                </span>
              </div>
              <p className="text-xs text-slate-400">Equity Arena Pricing, Headlines & Sector Controls</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              isConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              <Radio className={`w-3.5 h-3.5 ${isConnected ? 'animate-pulse' : ''}`} />
              <span>{isConnected ? 'Socket Stream Connected' : 'Disconnected'}</span>
            </div>

            <div className="h-6 w-px bg-slate-800" />

            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-300 hidden sm:inline">{user?.email}</span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-all border border-slate-700"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* Prebuilt News Templates */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  Prebuilt News Templates (Delayed Impact)
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </h2>
                <p className="text-xs text-slate-400">
                  Broadcasting sends headline ONLY to traders. Price effect triggers automatically after selected delay.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-300 font-semibold">Impact Delay:</span>
              <select
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(Number(e.target.value))}
                className="bg-slate-800 text-xs text-amber-400 font-bold px-2.5 py-1 rounded border border-slate-700 focus:outline-none"
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
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Pending Delayed News Impact Timers ({pendingDelayedNews.length} active)</span>
              </div>
              {pendingDelayedNews.map((p) => (
                <div key={p.id} className="flex justify-between items-center text-slate-300 text-[11px] bg-slate-900/60 p-2 rounded border border-slate-800">
                  <span className="truncate max-w-md">"{p.headline}"</span>
                  <span className="font-mono text-amber-300 font-bold">
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
                  className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between gap-3 shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {tpl.sector}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {isPositive ? '+' : ''}{tpl.effectPercent}%
                      </span>
                    </div>

                    <p className="text-xs text-white font-semibold leading-snug">
                      "{tpl.headline}"
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 italic">
                      Notes: {tpl.notes}
                    </p>
                  </div>

                  <button
                    onClick={() => handleTriggerTemplate(tpl.id)}
                    disabled={triggeringTemplateId === tpl.id}
                    className="w-full py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-xs rounded-lg transition-all border border-amber-500/30 flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Broadcast ({delaySeconds}s Delay)</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle Split: Custom News & Interactive Leaderboard (Clickable Rows) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Custom News Broadcast</h2>
                  <p className="text-xs text-slate-400">Send manual non-templated market announcements</p>
                </div>
              </div>

              <form onSubmit={handleSendNews} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Custom Headline</label>
                  <textarea
                    rows={3}
                    required
                    value={newsMessage}
                    onChange={(e) => setNewsMessage(e.target.value)}
                    placeholder="Enter manual news announcement..."
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tag Stock (Optional)</label>
                  <select
                    value={selectedStockId}
                    onChange={(e) => setSelectedStockId(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
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
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Immediate News</span>
                </button>
              </form>
            </div>
          </div>

          {/* Interactive Leaderboard with Clickable Trader Rows */}
          <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Live Player Leaderboard</h2>
                  <p className="text-xs text-slate-400">Click any trader row to monitor full holdings & transaction logs</p>
                </div>
              </div>

              <button
                onClick={fetchLeaderboard}
                disabled={loadingLeaderboard}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-all border border-slate-700"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLeaderboard ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-auto max-h-64">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Trader</th>
                    <th className="py-2.5 px-3 text-right">Wallet</th>
                    <th className="py-2.5 px-3 text-right">Holdings Value</th>
                    <th className="py-2.5 px-3 text-right">Total Value</th>
                    <th className="py-2.5 px-3 text-center">Monitor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No real player traders logged in yet. Register a trader account on the login screen!
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((trader) => (
                      <tr
                        key={trader.id}
                        onClick={() => handleOpenTraderDetail(trader.id)}
                        className="hover:bg-indigo-500/10 cursor-pointer transition-colors group"
                      >
                        <td className="py-2.5 px-3 font-bold text-slate-300">
                          {`#${trader.rank}`}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                            {trader.name}
                          </div>
                          <div className="text-[10px] text-slate-400">{trader.email}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                          {trader.walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} IC
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                          {trader.holdingsValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} IC
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                          {trader.totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} IC
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenTraderDetail(trader.id);
                            }}
                            className="p-1 bg-indigo-500/10 group-hover:bg-indigo-500 text-indigo-400 group-hover:text-slate-950 rounded transition-all"
                            title="Monitor Trader History"
                          >
                            <Eye className="w-3.5 h-3.5" />
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
                Live Stock Controls (15 India Sector Stocks)
              </h2>
              <p className="text-xs text-slate-400">Prices starting between 5 and 15 Ignite Coins (IC)</p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbol, name, or sector..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {loadingStocks ? (
            <div className="py-16 text-center text-slate-500 text-sm">
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
                    className="glass-card p-4 rounded-xl border border-slate-800/80 hover:border-indigo-500/40 transition-all flex flex-col justify-between gap-3 shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-extrabold text-white font-mono">{stock.symbol}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {stock.sector}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 truncate max-w-[180px]">{stock.name}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-bold font-mono text-white">
                          {stock.currentPrice.toFixed(2)} <span className="text-xs text-emerald-400">IC</span>
                        </div>
                        <div className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                          isPositive
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}>
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span>{isPositive ? '+' : ''}{stock.percentChange.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <div className="grid grid-cols-4 gap-1.5">
                        <button
                          onClick={() => handleAdjustPrice(stock.id, 10)}
                          disabled={adjustingStockId === stock.id}
                          className="py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono rounded-lg transition-all"
                        >
                          +10%
                        </button>
                        <button
                          onClick={() => handleAdjustPrice(stock.id, 50)}
                          disabled={adjustingStockId === stock.id}
                          className="py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 text-xs font-bold font-mono rounded-lg transition-all"
                        >
                          +50%
                        </button>
                        <button
                          onClick={() => handleAdjustPrice(stock.id, -10)}
                          disabled={adjustingStockId === stock.id}
                          className="py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 text-xs font-bold font-mono rounded-lg transition-all"
                        >
                          -10%
                        </button>
                        <button
                          onClick={() => handleAdjustPrice(stock.id, -50)}
                          disabled={adjustingStockId === stock.id}
                          className="py-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 text-xs font-bold font-mono rounded-lg transition-all"
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
                          className="flex-1 bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="submit"
                          disabled={adjustingStockId === stock.id || !customVal}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-40"
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
