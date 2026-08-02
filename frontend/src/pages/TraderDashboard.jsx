import React, { useState, useEffect, memo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { apiFetch } from '../services/api';
import { Sparkline } from '../components/Sparkline';
import { StockDetailModal } from '../components/StockDetailModal';
import { NewsToast } from '../components/NewsToast';
import {
  TrendingUp, TrendingDown, Wallet, PieChart, History, Radio, LogOut,
  Search, ArrowUpRight, CheckCircle2, AlertCircle, ShoppingBag, Coins,
  Newspaper, RefreshCw, LayoutDashboard, Calendar
} from 'lucide-react';

const StockCard = memo(({ stock, onOpenDetail }) => {
  const isPositive = stock.percentChange >= 0;

  return (
    <div
      onClick={() => onOpenDetail(stock)}
      className="glass-card p-4 rounded-xl border border-slate-800/80 hover:border-emerald-500/40 transition-all cursor-pointer shadow-lg hover:shadow-emerald-500/5 group flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-white font-mono group-hover:text-emerald-400 transition-colors">
                {stock.symbol}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {stock.sector}
              </span>
            </div>
            <div className="text-xs text-slate-400 truncate max-w-[160px]">{stock.name}</div>
          </div>

          <div className="text-right">
            <div className="text-base font-bold font-mono text-white">
              {stock.currentPrice.toFixed(2)} <span className="text-xs font-bold text-emerald-400">IC</span>
            </div>
            <div
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                isPositive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{isPositive ? '+' : ''}{stock.percentChange.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        <div className="mt-3 py-1 flex items-center justify-between">
          <Sparkline history={stock.priceHistories} width={130} height={36} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(stock);
            }}
            className="px-3 py-1 bg-emerald-500/10 group-hover:bg-emerald-500 text-emerald-400 group-hover:text-slate-950 font-bold text-xs rounded-lg transition-all border border-emerald-500/30 flex items-center gap-1"
          >
            <span>View Chart</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});

export function TraderDashboard() {
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();

  const [activeTab, setActiveTab] = useState('MARKET'); // 'MARKET' or 'NEWS'

  const [stocks, setStocks] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [portfolio, setPortfolio] = useState({
    walletBalance: user?.walletBalance || 20000,
    totalHoldingsValue: 0,
    totalUnrealizedPL: 0,
    totalPortfolioValue: user?.walletBalance || 20000,
    holdings: [],
    transactions: []
  });

  const [selectedStock, setSelectedStock] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Dedicated News tab state
  const [activeNewsToast, setActiveNewsToast] = useState(null);
  const [newsFeed, setNewsFeed] = useState([]);
  const [loadingNews, setLoadingNews] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchStocks = useCallback(async () => {
    try {
      const data = await apiFetch('/stocks');
      setStocks(data);
    } catch (err) {
      showToast(err.message || 'Failed to fetch stocks', 'error');
    } finally {
      setLoadingStocks(false);
    }
  }, []);

  const fetchPortfolio = useCallback(async () => {
    try {
      const data = await apiFetch('/portfolio');
      setPortfolio(data);
    } catch (err) {
      console.error('Fetch portfolio error:', err);
    }
  }, []);

  const fetchNewsFeed = useCallback(async () => {
    setLoadingNews(true);
    try {
      const data = await apiFetch('/news');
      setNewsFeed(data);
    } catch (err) {
      console.error('Fetch news history error:', err);
    } finally {
      setLoadingNews(false);
    }
  }, []);

  useEffect(() => {
    fetchStocks();
    fetchPortfolio();
    fetchNewsFeed();
  }, [fetchStocks, fetchPortfolio, fetchNewsFeed]);

  // Real-time Socket Handlers
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      fetchStocks();
      fetchPortfolio();
      fetchNewsFeed();
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

    const handleNewsBroadcast = (news) => {
      setActiveNewsToast(news);
      setNewsFeed((prev) => [news, ...prev]);
    };

    const handlePortfolioUpdate = (updatedPortfolio) => {
      setPortfolio(updatedPortfolio);
    };

    socket.on('connect', handleConnect);
    socket.on('stock:update', handleStockUpdate);
    socket.on('news:broadcast', handleNewsBroadcast);
    socket.on('portfolio:update', handlePortfolioUpdate);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('stock:update', handleStockUpdate);
      socket.off('news:broadcast', handleNewsBroadcast);
      socket.off('portfolio:update', handlePortfolioUpdate);
    };
  }, [socket, fetchStocks, fetchPortfolio, fetchNewsFeed]);

  const handleOpenDetail = useCallback((stock) => {
    setSelectedStock(stock);
    setIsDetailModalOpen(true);
  }, []);

  const handleTradeSuccess = (message, updatedPortfolio) => {
    showToast(message);
    if (updatedPortfolio) {
      setPortfolio(updatedPortfolio);
    } else {
      fetchPortfolio();
    }
  };

  const filteredStocks = stocks.filter(
    (s) =>
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getHoldingForStock = (stockId) => {
    return portfolio.holdings?.find((h) => h.stockId === stockId);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
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

      <NewsToast news={activeNewsToast} onClose={() => setActiveNewsToast(null)} />

      <StockDetailModal
        stock={selectedStock}
        userWallet={portfolio.walletBalance}
        userHolding={selectedStock ? getHoldingForStock(selectedStock.id) : null}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onSuccess={handleTradeSuccess}
      />

      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">

          {/* Mobile: simplified header — just wallet balance and logout, per design request */}
          <div className="flex sm:hidden items-center justify-between gap-3">
            <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Wallet Balance</div>
                <div className="text-sm font-extrabold font-mono text-emerald-400 whitespace-nowrap">
                  {portfolio.walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs">IC</span>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-all border border-slate-700"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>

          {/* Desktop: full header with branding, connection status, wallet, and account info */}
          <div className="hidden sm:flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-white tracking-wide whitespace-nowrap">EQUITY ARENA</h1>
                <p className="text-xs text-slate-400 whitespace-nowrap">Real-Time India Stock Exchange</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                isConnected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}>
                <Radio className={`w-3.5 h-3.5 ${isConnected ? 'animate-pulse' : ''}`} />
                <span>{isConnected ? 'Market Stream Live' : 'Disconnected'}</span>
              </div>

              <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Wallet Balance</div>
                  <div className="text-sm font-extrabold font-mono text-emerald-400 whitespace-nowrap">
                    {portfolio.walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs">IC</span>
                  </div>
                </div>
              </div>

              <div className="h-6 w-px bg-slate-800" />

              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-300 hidden md:inline">{user?.email}</span>
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
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* Top View Selector Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('MARKET')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'MARKET'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Live Market & Holdings</span>
            </button>
            <button
              onClick={() => setActiveTab('NEWS')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'NEWS'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Newspaper className="w-4 h-4" />
              <span>Analyst News Feed</span>
              {newsFeed.length > 0 && (
                <span className="px-1.5 py-0.2 bg-slate-950/40 text-[10px] font-extrabold rounded-full">
                  {newsFeed.length}
                </span>
              )}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Interactive 1D / 1W / 1M Downsampled Charts Active</span>
          </div>
        </div>

        {/* TAB 1: LIVE MARKET & HOLDINGS VIEW */}
        {activeTab === 'MARKET' && (
          <div className="space-y-8">
            
            {/* Top Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-semibold uppercase">Total Portfolio Value</div>
                  <div className="text-xl font-extrabold font-mono text-white mt-1">
                    {portfolio.totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-sm text-emerald-400 font-bold">IC</span>
                  </div>
                </div>
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
                  <PieChart className="w-6 h-6" />
                </div>
              </div>

              <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-semibold uppercase">Holdings Market Value</div>
                  <div className="text-xl font-extrabold font-mono text-slate-200 mt-1">
                    {(portfolio.totalHoldingsValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-sm text-emerald-400 font-bold">IC</span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              </div>

              <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-semibold uppercase">Total Unrealized P/L</div>
                  <div className={`text-xl font-extrabold font-mono mt-1 ${
                    (portfolio.totalUnrealizedPL || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {(portfolio.totalUnrealizedPL || 0) >= 0 ? '+' : ''}
                    {(portfolio.totalUnrealizedPL || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-sm font-bold">IC</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl border ${
                  (portfolio.totalUnrealizedPL || 0) >= 0
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                  {(portfolio.totalUnrealizedPL || 0) >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                </div>
              </div>
            </div>

            {/* 15 India Stock Cards Grid */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    Live Market (15 India Sector Stocks)
                  </h2>
                  <p className="text-xs text-slate-400">Click any stock card to view SMA-10 trendlines & volume bars</p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search India company, symbol, sector..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {loadingStocks ? (
                <div className="py-16 text-center text-slate-500 text-sm">
                  Loading 15 India sector stocks...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredStocks.map((stock) => (
                    <StockCard key={stock.id} stock={stock} onOpenDetail={handleOpenDetail} />
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Split: Holdings & Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Your Holdings Portfolio</h2>
                    <p className="text-xs text-slate-400">Live positions, cost basis, and unrealized P/L in IC</p>
                  </div>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-auto max-h-72">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Stock</th>
                        <th className="py-2.5 px-3 text-right">Shares</th>
                        <th className="py-2.5 px-3 text-right">Avg Buy</th>
                        <th className="py-2.5 px-3 text-right">Current</th>
                        <th className="py-2.5 px-3 text-right">Unrealized P/L</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {(!portfolio.holdings || portfolio.holdings.length === 0) ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">
                            No active stock positions. Select a stock above to view detailed chart & buy shares!
                          </td>
                        </tr>
                      ) : (
                        portfolio.holdings.map((h) => {
                          const isPositive = h.unrealizedPL >= 0;
                          const matchedStock = stocks.find((s) => s.id === h.stockId) || {
                            id: h.stockId,
                            symbol: h.symbol,
                            name: h.name,
                            currentPrice: h.currentPrice
                          };

                          return (
                            <tr key={h.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-white font-mono">{h.symbol}</span>
                                <div className="text-[10px] text-slate-400">{h.name}</div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-200 font-semibold">
                                {h.quantity}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                                {h.avgBuyPrice.toFixed(2)} IC
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-white font-semibold">
                                {h.currentPrice.toFixed(2)} IC
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className={`font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {isPositive ? '+' : ''}{h.unrealizedPL.toFixed(2)} IC
                                </div>
                                <div className={`text-[10px] font-mono ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  ({isPositive ? '+' : ''}{h.unrealizedPLPercent.toFixed(2)}%)
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  onClick={() => handleOpenDetail(matchedStock)}
                                  className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold rounded transition-all"
                                >
                                  Detail / Sell
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

              <div className="lg:col-span-5 glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col max-h-72">
                <div className="flex items-center gap-2 mb-3">
                  <History className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Trade History</h3>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {(!portfolio.transactions || portfolio.transactions.length === 0) ? (
                    <div className="text-center py-8 text-xs text-slate-500 italic">
                      No trade transactions recorded yet.
                    </div>
                  ) : (
                    portfolio.transactions.map((tx) => {
                      const isBuy = tx.type === 'BUY';
                      const totalAmt = (tx.quantity * tx.price).toFixed(2);

                      return (
                        <div key={tx.id} className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold font-mono ${
                              isBuy ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}>
                              {tx.type}
                            </span>
                            <div>
                              <span className="font-bold font-mono text-white">{tx.stock?.symbol || 'STOCK'}</span>
                              <span className="text-[10px] text-slate-400 ml-1.5">({tx.quantity} shrs @ {tx.price.toFixed(2)} IC)</span>
                            </div>
                          </div>
                          <div className="text-right font-mono font-bold text-slate-200">
                            {totalAmt} IC
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: DEDICATED ANALYST NEWS FEED TAB */}
        {activeTab === 'NEWS' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                  <Newspaper className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white uppercase tracking-wider">
                    Official Analyst News Feed
                  </h2>
                  <p className="text-xs text-slate-400">
                    All historical & live financial broadcasts. Use analyst figures & market reaction framing to read the tape.
                  </p>
                </div>
              </div>

              <button
                onClick={fetchNewsFeed}
                disabled={loadingNews}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-all border border-slate-700"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingNews ? 'animate-spin' : ''}`} />
                Refresh News
              </button>
            </div>

            {loadingNews ? (
              <div className="py-16 text-center text-slate-500 text-sm">
                Loading financial news broadcasts...
              </div>
            ) : newsFeed.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-sm italic">
                No news broadcasts recorded yet. Incoming market news will stream here live.
              </div>
            ) : (
              <div className="space-y-4">
                {newsFeed.map((newsItem, index) => (
                  <div
                    key={newsItem.id || index}
                    className="glass-card p-4 rounded-xl border border-slate-800/80 hover:border-amber-500/40 transition-all flex flex-col gap-2 shadow-md"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          FINANCIAL WIRE
                        </span>
                        <span className="text-slate-400 font-medium text-[11px]">
                          {new Date(newsItem.timestamp || Date.now()).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        Broadcast #{newsFeed.length - index}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-100 leading-relaxed">
                      "{newsItem.message}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}