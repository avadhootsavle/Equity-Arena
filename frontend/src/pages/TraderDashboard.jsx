import React, { useState, useEffect, memo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { apiFetch } from '../services/api';
import { Sparkline } from '../components/Sparkline';
import { StockDetailModal } from '../components/StockDetailModal';
import { NewsToast } from '../components/NewsToast';
import { Navbar } from '../components/Navbar';
import { LiveTickerMarquee } from '../components/LiveTickerMarquee';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { TradeFeedbackOverlay } from '../components/TradeFeedbackOverlay';
import { StockCardSkeleton, NewsFeedSkeleton } from '../components/SkeletonLoader';
import {
  TrendingUp, TrendingDown, PieChart, History, Search, ArrowUpRight, CheckCircle2, AlertCircle, ShoppingBag,
  Newspaper, RefreshCw, Clock, Ban, Flame, Zap, Shield
} from 'lucide-react';

const StockCard = memo(({ stock, onOpenDetail, priceFlash, isFeatured }) => {
  const percentChange = stock && stock.percentChange !== undefined && stock.percentChange !== null ? stock.percentChange : 0;
  const isPositive = percentChange >= 0;
  const flashClass = priceFlash === 'up' ? 'animate-flash-up' : priceFlash === 'down' ? 'animate-flash-down' : '';

  return (
    <div
      onClick={() => onOpenDetail(stock)}
      className={`theme-bg-card theme-border p-4 rounded-[6px] border hover:border-[#D4A017] transition-all cursor-pointer shadow-md group flex flex-col justify-between active:scale-[0.99] ${
        isFeatured ? 'col-span-1 md:col-span-2 border-[#D4A017]/40 bg-gradient-to-br from-[var(--bg-card)] to-[#D4A017]/5' : ''
      } ${flashClass}`}
    >
      <div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold theme-text-main font-mono tracking-tight group-hover:text-[#D4A017] transition-colors">
                {stock.symbol}
              </span>
              {isFeatured && (
                <span className="px-2 py-0.5 rounded-[3px] text-[9px] font-mono font-extrabold uppercase bg-[#D4A017]/20 text-[#D4A017] border border-[#D4A017]/30">
                  ★ TOP MOVER
                </span>
              )}
              <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-semibold theme-bg-panel theme-text-muted border theme-border font-mono">
                {stock.sector}
              </span>
            </div>
            <div className="text-xs theme-text-muted truncate max-w-[180px] font-medium mt-0.5">{stock.name}</div>
          </div>

          <div className="text-right">
            <div className="text-base font-extrabold theme-text-main font-mono">
              <AnimatedNumber value={stock.currentPrice || 0} decimals={2} suffix=" IC" className={isPositive ? 'text-[#1DB954]' : 'text-[#E8453C]'} />
            </div>
            <div
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-[3px] text-[11px] font-mono font-bold border ${
                isPositive
                  ? 'bg-[#1DB954]/10 text-[#1DB954] border-[#1DB954]/30'
                  : 'bg-[#E8453C]/10 text-[#E8453C] border-[#E8453C]/30'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{isPositive ? '+' : ''}{percentChange.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        <div className="mt-3 py-1 flex items-center justify-between">
          <Sparkline history={stock.priceHistories} width={isFeatured ? 220 : 130} height={36} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(stock);
            }}
            className="px-3.5 py-1.5 bg-[#D4A017]/10 group-hover:bg-[#D4A017] text-[#D4A017] group-hover:text-slate-950 font-heading font-bold text-xs rounded-[4px] transition-all border border-[#D4A017]/30 flex items-center gap-1 min-h-[34px] btn-terminal"
          >
            <span>Trade</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});

export function TraderDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [activeTab, setActiveTab] = useState('MARKET'); // 'MARKET' or 'NEWS'

  const [stocks, setStocks] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFlashes, setStockFlashes] = useState({});

  const [portfolio, setPortfolio] = useState({
    walletBalance: user?.walletBalance || 20000,
    availableWalletBalance: user?.walletBalance || 20000,
    lockedFunds: 0,
    totalHoldingsValue: 0,
    totalUnrealizedPL: 0,
    totalPortfolioValue: user?.walletBalance || 20000,
    holdings: [],
    transactions: [],
    pendingOrders: []
  });

  const [selectedStock, setSelectedStock] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [feedbackOverlay, setFeedbackOverlay] = useState(null);
  const [toast, setToast] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  // Dedicated News tab state
  const [activeNewsToast, setActiveNewsToast] = useState(null);
  const [newsFeed, setNewsFeed] = useState([]);
  const [loadingNews, setLoadingNews] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const triggerFeedbackOverlay = (status, message) => {
    setFeedbackOverlay({ status, message });
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

  const [loadingPortfolio, setLoadingPortfolio] = useState(true);

  const fetchPortfolio = useCallback(async () => {
    try {
      const data = await apiFetch('/portfolio');
      setPortfolio(data);
    } catch (err) {
      console.error('Fetch portfolio error:', err);
    } finally {
      setLoadingPortfolio(false);
    }
  }, []);

  const fetchNewsFeed = useCallback(async () => {
    setLoadingNews(true);
    try {
      const data = await apiFetch('/news');
      setNewsFeed(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch news history error:', err);
      setNewsFeed([]);
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
            const oldPrice = s.currentPrice;
            const direction = diff.newPrice > oldPrice ? 'up' : diff.newPrice < oldPrice ? 'down' : null;

            if (direction) {
              setStockFlashes((prev) => ({ ...prev, [diff.stockId]: direction }));
              setTimeout(() => {
                setStockFlashes((prev) => ({ ...prev, [diff.stockId]: null }));
              }, 650);
            }

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
      setNewsFeed((prev) => Array.isArray(prev) ? [news, ...prev] : [news]);
    };

    const handlePortfolioUpdate = (updatedPortfolio) => {
      setPortfolio((prev) => ({
        ...prev,
        ...updatedPortfolio
      }));
    };

    const handleOrderExecuted = (alert) => {
      triggerFeedbackOverlay('success', alert.message || 'Limit order executed!');
      fetchPortfolio();
    };

    socket.on('connect', handleConnect);
    socket.on('stock:update', handleStockUpdate);
    socket.on('news:broadcast', handleNewsBroadcast);
    socket.on('portfolio:update', handlePortfolioUpdate);
    socket.on('order:executed', handleOrderExecuted);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('stock:update', handleStockUpdate);
      socket.off('news:broadcast', handleNewsBroadcast);
      socket.off('portfolio:update', handlePortfolioUpdate);
      socket.off('order:executed', handleOrderExecuted);
    };
  }, [socket, fetchStocks, fetchPortfolio, fetchNewsFeed]);

  const handleOpenDetail = useCallback((stock) => {
    setSelectedStock(stock);
    setIsDetailModalOpen(true);
  }, []);

  const handleTradeSuccess = (message, updatedPortfolio) => {
    triggerFeedbackOverlay('success', message);
    if (updatedPortfolio) {
      setPortfolio((prev) => ({ ...prev, ...updatedPortfolio }));
    } else {
      fetchPortfolio();
    }
  };

  const handleCancelOrder = async (orderId) => {
    setCancellingOrderId(orderId);
    try {
      const data = await apiFetch(`/orders/${orderId}`, {
        method: 'DELETE'
      });
      triggerFeedbackOverlay('success', data.message);
      fetchPortfolio();
    } catch (err) {
      triggerFeedbackOverlay('error', err.message || 'Failed to cancel limit order');
    } finally {
      setCancellingOrderId(null);
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

  // Find top gainer for featured card highlight
  const topGainerStock = stocks && stocks.length > 0
    ? [...stocks].sort((a, b) => ((b.percentChange || 0) - (a.percentChange || 0)))[0]
    : null;

  return (
    <div className="min-h-screen theme-bg-main theme-text-main flex flex-col pb-20 md:pb-8 transition-colors">
      
      <TradeFeedbackOverlay
        status={feedbackOverlay?.status}
        message={feedbackOverlay?.message}
        onClose={() => setFeedbackOverlay(null)}
      />

      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-[6px] shadow-2xl border transition-all animate-bounce ${
          toast.type === 'error'
            ? 'bg-[#E8453C]/90 border-[#E8453C] text-white font-mono text-xs font-bold'
            : 'bg-[#1DB954]/90 border-[#1DB954] text-slate-950 font-mono text-xs font-bold'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-white" /> : <CheckCircle2 className="w-5 h-5 text-slate-950" />}
          <span>{toast.message}</span>
        </div>
      )}

      <NewsToast news={activeNewsToast} onClose={() => setActiveNewsToast(null)} />

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        walletBalance={portfolio.availableWalletBalance !== undefined ? portfolio.availableWalletBalance : portfolio.walletBalance}
        lockedFunds={portfolio.lockedFunds || 0}
        newsCount={Array.isArray(newsFeed) ? newsFeed.length : 0}
      />

      <LiveTickerMarquee stocks={stocks} onSelectStock={handleOpenDetail} />

      {(() => {
        const liveSelectedStock = selectedStock
          ? (stocks.find((s) => s.id === selectedStock.id) || selectedStock)
          : null;
        return (
          <StockDetailModal
            stock={liveSelectedStock}
            userWallet={portfolio.walletBalance}
            userHolding={liveSelectedStock ? getHoldingForStock(liveSelectedStock.id) : null}
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            onSuccess={handleTradeSuccess}
          />
        );
      })()}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* TAB 1: LIVE MARKET & ASYMMETRIC DASHBOARD */}
        {activeTab === 'MARKET' && (
          <div className="grid grid-cols-12 gap-6">
            
            {/* DOMINANT LEFT COLUMN (col-span-12 lg:col-span-8): Main Exchange & Holdings */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              
              {/* Summary Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="theme-bg-card border theme-border p-4 rounded-[6px] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] theme-text-muted uppercase font-mono font-bold tracking-wider">Total Portfolio</div>
                    <div className="text-xl font-extrabold theme-text-main mt-0.5 font-mono">
                      <AnimatedNumber value={portfolio.totalPortfolioValue} decimals={2} suffix=" IC" className="text-[#D4A017]" />
                    </div>
                  </div>
                  <div className="p-2.5 bg-[#D4A017]/10 border border-[#D4A017]/30 rounded-[4px] text-[#D4A017]">
                    <PieChart className="w-5 h-5" />
                  </div>
                </div>

                <div className="theme-bg-card border theme-border p-4 rounded-[6px] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] theme-text-muted uppercase font-mono font-bold tracking-wider">Holdings Value</div>
                    <div className="text-xl font-extrabold theme-text-main mt-0.5 font-mono">
                      <AnimatedNumber value={portfolio.totalHoldingsValue || 0} decimals={2} suffix=" IC" className="text-[#D4A017]" />
                    </div>
                  </div>
                  <div className="p-2.5 bg-[#1DB954]/10 border border-[#1DB954]/30 rounded-[4px] text-[#1DB954]">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                </div>

                <div className="theme-bg-card border theme-border p-4 rounded-[6px] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] theme-text-muted uppercase font-mono font-bold tracking-wider">Unrealized P/L</div>
                    <div className={`text-xl font-extrabold mt-0.5 font-mono ${
                      (portfolio.totalUnrealizedPL || 0) >= 0 ? 'text-[#1DB954]' : 'text-[#E8453C]'
                    }`}>
                      {(portfolio.totalUnrealizedPL || 0) >= 0 ? '+' : ''}
                      <AnimatedNumber value={portfolio.totalUnrealizedPL || 0} decimals={2} suffix=" IC" />
                    </div>
                  </div>
                  <div className={`p-2.5 rounded-[4px] border ${
                    (portfolio.totalUnrealizedPL || 0) >= 0
                      ? 'bg-[#1DB954]/10 border-[#1DB954]/30 text-[#1DB954]'
                      : 'bg-[#E8453C]/10 border-[#E8453C]/30 text-[#E8453C]'
                  }`}>
                    {(portfolio.totalUnrealizedPL || 0) >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* 15 India Stock Exchange Grid with Top Gainer Featured Card */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 theme-bg-card p-4 rounded-[6px] border theme-border">
                  <div>
                    <h2 className="text-base font-bold theme-text-main font-heading uppercase tracking-wide flex items-center gap-2">
                      <Flame className="w-4 h-4 text-[#D4A017] animate-pulse" />
                      LIVE STOCK EXCHANGE (15 SECTORS)
                    </h2>
                    <p className="text-xs theme-text-muted font-medium">Geometric Brownian Motion quant tick engine & live order book</p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 theme-text-dim" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter symbol or sector..."
                      className="w-full theme-bg-panel border theme-border rounded-[4px] py-1.5 pl-9 pr-3 text-xs theme-text-main placeholder:theme-text-dim focus:outline-none focus:border-[#D4A017] transition-all min-h-[36px] font-mono"
                    />
                  </div>
                </div>

                {loadingStocks ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[...Array(6)].map((_, i) => (
                      <StockCardSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredStocks.map((stock) => (
                      <StockCard
                        key={stock.id}
                        stock={stock}
                        onOpenDetail={handleOpenDetail}
                        priceFlash={stockFlashes[stock.id]}
                        isFeatured={topGainerStock && topGainerStock.id === stock.id}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Holdings Portfolio Table */}
              <div className="theme-bg-card p-5 rounded-[6px] border theme-border space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#D4A017]/10 border border-[#D4A017]/30 rounded-[4px] text-[#D4A017]">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold theme-text-main uppercase font-heading tracking-wider">Your Active Positions</h2>
                    <p className="text-xs theme-text-muted">Live holdings, average buy cost, and unrealized return</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b theme-border theme-text-muted font-mono uppercase tracking-wider text-[11px]">
                        <th className="py-2.5 px-3">Asset</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                        <th className="py-2.5 px-3 text-right">Avg Cost</th>
                        <th className="py-2.5 px-3 text-right">Spot Price</th>
                        <th className="py-2.5 px-3 text-right">P/L (IC)</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y theme-border">
                      {(!portfolio.holdings || portfolio.holdings.length === 0) ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center theme-text-dim font-mono text-xs">
                            No active positions. Select any stock above to place a trade!
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
                            <tr key={h.id} className="theme-bg-card-hover transition-colors">
                              <td className="py-2.5 px-3">
                                <span className="font-bold theme-text-main font-mono">{h.symbol}</span>
                                <div className="text-[10px] theme-text-muted">{h.name}</div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono theme-text-main font-semibold">
                                <div>{h.quantity}</div>
                                {h.lockedQuantity > 0 && (
                                  <div className="text-[10px] text-[#D4A017] font-normal">
                                    ({h.availableQuantity} avail / {h.lockedQuantity} locked)
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono theme-text-muted">
                                {(h.avgBuyPrice || 0).toFixed(2)} IC
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono theme-text-main font-semibold">
                                <AnimatedNumber value={h.currentPrice || 0} decimals={2} suffix=" IC" />
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className={`font-mono font-bold ${isPositive ? 'text-[#1DB954]' : 'text-[#E8453C]'}`}>
                                  {isPositive ? '+' : ''}
                                  <AnimatedNumber value={h.unrealizedPL || 0} decimals={2} suffix=" IC" />
                                </div>
                                <div className={`text-[10px] font-mono ${isPositive ? 'text-[#1DB954]' : 'text-[#E8453C]'}`}>
                                  ({isPositive ? '+' : ''}{(h.unrealizedPLPercent || 0).toFixed(2)}%)
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  onClick={() => handleOpenDetail(matchedStock)}
                                  className="px-2.5 py-1 bg-[#E8453C]/10 hover:bg-[#E8453C]/20 text-[#E8453C] border border-[#E8453C]/30 text-[11px] font-bold font-heading rounded-[4px] transition-all min-h-[30px] btn-terminal"
                                >
                                  Trade / Sell
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

            {/* PERSISTENT RIGHT COLUMN (col-span-12 lg:col-span-4): Liquidity, Limit Orders & News Wire */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              
              {/* Account Liquidity Summary */}
              <div className="theme-bg-card p-4 rounded-[6px] border theme-border space-y-3">
                <div className="flex items-center justify-between border-b theme-border pb-2">
                  <span className="text-xs font-bold uppercase theme-text-main font-heading flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-[#D4A017]" />
                    ACCOUNT LIQUIDITY
                  </span>
                  <span className="text-[10px] font-mono text-[#D4A017]">READY</span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="theme-text-muted">Available Liquidity:</span>
                    <strong className="theme-text-main font-bold text-sm">
                      {(portfolio.availableWalletBalance !== undefined ? portfolio.availableWalletBalance : portfolio.walletBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })} IC
                    </strong>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="theme-text-muted">Locked in Pending Orders:</span>
                    <span className="text-[#D4A017]">
                      {(portfolio.lockedFunds || 0).toFixed(2)} IC
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="theme-text-muted">Holdings Asset Value:</span>
                    <span className="theme-text-main">
                      {(portfolio.totalHoldingsValue || 0).toFixed(2)} IC
                    </span>
                  </div>
                </div>
              </div>

              {/* Pending Limit Orders Panel */}
              {portfolio.pendingOrders && portfolio.pendingOrders.length > 0 && (
                <div className="theme-bg-card p-4 rounded-[6px] border border-[#D4A017]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#D4A017] uppercase tracking-wider font-heading">
                      <Clock className="w-4 h-4" />
                      <span>Pending Orders ({portfolio.pendingOrders.length})</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {portfolio.pendingOrders.map((order) => (
                      <div key={order.id} className="p-2.5 theme-bg-panel rounded-[4px] border theme-border flex items-center justify-between text-xs font-mono">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.2 rounded-[2px] text-[9px] font-extrabold ${
                              order.type === 'BUY'
                                ? 'bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/30'
                                : 'bg-[#E8453C]/20 text-[#E8453C] border border-[#E8453C]/30'
                            }`}>
                              LIMIT {order.type}
                            </span>
                            <span className="font-bold theme-text-main">{order.stock?.symbol || 'STOCK'}</span>
                          </div>
                          <div className="text-[10px] theme-text-muted mt-1">
                            {order.quantity} shrs @ <strong className="text-[#D4A017]">{order.targetPrice.toFixed(2)} IC</strong>
                          </div>
                        </div>

                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancellingOrderId === order.id}
                          className="px-2.5 py-1 bg-[#E8453C]/10 hover:bg-[#E8453C]/20 text-[#E8453C] border border-[#E8453C]/30 text-[10px] font-bold rounded-[3px] flex items-center gap-1 transition-all btn-terminal"
                        >
                          <Ban className="w-3 h-3" />
                          {cancellingOrderId === order.id ? '...' : 'Cancel'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Persistent Live Analyst News Wire Widget */}
              <div className="theme-bg-card p-4 rounded-[6px] border theme-border space-y-3">
                <div className="flex items-center justify-between border-b theme-border pb-2">
                  <span className="text-xs font-bold uppercase theme-text-main font-heading flex items-center gap-1.5">
                    <Newspaper className="w-4 h-4 text-[#D4A017]" />
                    ANALYST WIRE LOG
                  </span>
                  <button
                    onClick={fetchNewsFeed}
                    className="text-[10px] font-mono text-[#D4A017] hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingNews ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {(!Array.isArray(newsFeed) || newsFeed.length === 0) ? (
                    <div className="text-center py-6 theme-text-dim text-xs font-mono italic">
                      No analyst broadcasts recorded yet.
                    </div>
                  ) : (
                    newsFeed.slice(0, 8).map((newsItem, index) => (
                      <div key={newsItem.id || index} className="p-2.5 theme-bg-panel rounded-[4px] border theme-border text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-[#D4A017] font-bold">● ANALYST WIRE</span>
                          <span className="theme-text-dim">{new Date(newsItem.timestamp || Date.now()).toLocaleTimeString()}</span>
                        </div>
                        <p className="theme-text-main text-[11px] font-medium leading-tight">
                          "{newsItem.message}"
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Trade Audit Log */}
              <div className="theme-bg-card p-4 rounded-[6px] border theme-border space-y-3">
                <div className="flex items-center gap-1.5 border-b theme-border pb-2">
                  <History className="w-4 h-4 text-[#D4A017]" />
                  <h3 className="text-xs font-bold theme-text-main uppercase font-heading">Recent Executions</h3>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs font-mono">
                  {(!portfolio.transactions || portfolio.transactions.length === 0) ? (
                    <div className="text-center py-4 theme-text-dim italic text-[11px]">
                      No transactions recorded.
                    </div>
                  ) : (
                    portfolio.transactions.slice(0, 6).map((tx) => {
                      const isBuy = tx.type === 'BUY';
                      const safePrice = tx.price || 0;
                      const safeQty = tx.quantity || 0;
                      return (
                        <div key={tx.id || Math.random()} className="p-2 theme-bg-panel rounded-[4px] border theme-border flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.2 rounded-[2px] text-[9px] font-extrabold ${
                              isBuy ? 'bg-[#1DB954]/20 text-[#1DB954]' : 'bg-[#E8453C]/20 text-[#E8453C]'
                            }`}>
                              {tx.type}
                            </span>
                            <span className="font-bold theme-text-main">{tx.stock?.symbol || 'STOCK'}</span>
                            <span className="theme-text-muted text-[10px]">({safeQty} @ {safePrice.toFixed(2)})</span>
                          </div>
                          <span className="font-bold theme-text-main text-[11px]">
                            {(safeQty * safePrice).toFixed(2)} IC
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: DEDICATED FULL NEWS FEED TAB */}
        {activeTab === 'NEWS' && (
          <div className="theme-bg-card p-6 rounded-[6px] border theme-border space-y-6">
            <div className="flex items-center justify-between border-b theme-border pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#D4A017]/10 border border-[#D4A017]/30 rounded-[4px] text-[#D4A017]">
                  <Newspaper className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold theme-text-main font-heading uppercase">
                    Official Exchange Analyst Wire Feed
                  </h2>
                  <p className="text-xs theme-text-muted">
                    Historical and live market headlines. Sector announcements trigger automated price movements.
                  </p>
                </div>
              </div>

              <button
                onClick={fetchNewsFeed}
                disabled={loadingNews}
                className="flex items-center gap-1.5 px-3 py-1.5 theme-bg-panel hover:theme-bg-card-hover theme-text-main text-xs font-heading font-bold rounded-[4px] transition-all border theme-border min-h-[34px] btn-terminal"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingNews ? 'animate-spin' : ''}`} />
                Refresh Wire
              </button>
            </div>

            {loadingNews ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <NewsFeedSkeleton key={i} />
                ))}
              </div>
            ) : (!Array.isArray(newsFeed) || newsFeed.length === 0) ? (
              <div className="py-16 text-center theme-text-dim text-xs font-mono italic">
                No market news broadcasts recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {newsFeed.map((newsItem, index) => (
                  <div
                    key={newsItem.id || index}
                    className="theme-bg-panel p-4 rounded-[6px] border theme-border hover:border-[#D4A017]/40 transition-all flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-extrabold uppercase bg-[#D4A017]/20 text-[#D4A017] border border-[#D4A017]/30">
                          FINANCIAL WIRE
                        </span>
                        <span className="theme-text-muted font-medium text-[11px]">
                          {new Date(newsItem.timestamp || Date.now()).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] theme-text-dim">
                        Broadcast #{newsFeed.length - index}
                      </span>
                    </div>

                    <p className="text-sm font-semibold theme-text-main leading-relaxed">
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