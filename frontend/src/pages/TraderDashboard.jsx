import React, { useState, useEffect, memo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { apiFetch } from '../services/api';
import { Sparkline } from '../components/Sparkline';
import { StockDetailModal } from '../components/StockDetailModal';
import { OnboardingTour } from '../components/OnboardingTour';
import { NewsToast } from '../components/NewsToast';
import { Navbar } from '../components/Navbar';
import { LiveTickerMarquee } from '../components/LiveTickerMarquee';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { TradeFeedbackOverlay } from '../components/TradeFeedbackOverlay';
import { StockCardSkeleton, NewsFeedSkeleton } from '../components/SkeletonLoader';
import {
  TrendingUp, TrendingDown, PieChart, History, Search, ArrowUpRight, CheckCircle2, AlertCircle, ShoppingBag,
  Newspaper, RefreshCw, Clock, Ban, Flame, Zap, Shield, X, HelpCircle
} from 'lucide-react';

const StockCard = memo(({
  stock,
  holding,
  availableWallet,
  onOpenDetail,
  onQuickTrade,
  priceFlash,
  isTradingLocked
}) => {
  const [isQuickOpen, setIsQuickOpen] = useState(false);
  const [quickMode, setQuickMode] = useState('BUY'); // 'BUY' or 'SELL'
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const percentChange = stock && stock.percentChange !== undefined && stock.percentChange !== null ? stock.percentChange : 0;
  const isPositive = percentChange >= 0;
  const flashClass = priceFlash === 'up' ? 'animate-flash-up' : priceFlash === 'down' ? 'animate-flash-down' : '';

  const availHoldingQty = holding?.availableQuantity !== undefined ? holding.availableQuantity : (holding?.quantity || 0);
  const availCash = availableWallet || 0;
  const currentPrice = stock.currentPrice || 1;

  // Max affordable / sellable quantities
  const maxBuyQty = Math.max(0, Math.floor(availCash / currentPrice));
  const maxSellQty = availHoldingQty;

  const handleOpenQuick = (e, mode) => {
    e.stopPropagation();
    setQuickMode(mode);
    setIsQuickOpen(true);
    if (mode === 'BUY') {
      setQuantity(maxBuyQty >= 1 ? 1 : 0);
    } else {
      setQuantity(maxSellQty >= 1 ? 1 : 0);
    }
  };

  const handlePreset = (e, percent) => {
    e.stopPropagation();
    if (quickMode === 'BUY') {
      const calculated = Math.floor((availCash * percent) / currentPrice);
      setQuantity(Math.max(calculated > 0 ? calculated : (maxBuyQty >= 1 ? 1 : 0), 0));
    } else {
      const calculated = Math.floor(availHoldingQty * percent);
      setQuantity(Math.max(calculated > 0 ? calculated : (availHoldingQty >= 1 ? 1 : 0), 0));
    }
  };

  const handleQuantityChange = (val) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 0) {
      setQuantity(0);
    } else {
      setQuantity(parsed);
    }
  };

  const handleConfirmTrade = async (e) => {
    e.stopPropagation();
    if (quantity <= 0) return;
    setIsSubmitting(true);
    const success = await onQuickTrade(stock, quickMode, quantity);
    setIsSubmitting(false);
    if (success) {
      setIsQuickOpen(false);
    }
  };

  const estimatedTotal = Math.round(quantity * currentPrice * 100) / 100;
  const canSubmit = !isTradingLocked && quantity > 0 && (
    quickMode === 'BUY' ? estimatedTotal <= availCash : quantity <= availHoldingQty
  );

  return (
    <div
      onClick={() => !isQuickOpen && onOpenDetail(stock)}
      className={`theme-bg-card theme-border p-4 rounded-[8px] border hover:border-[#D4A017] transition-all shadow-md group flex flex-col justify-between ${
        isQuickOpen ? 'border-[#D4A017] ring-1 ring-[#D4A017]/30' : 'cursor-pointer active:scale-[0.99]'
      } ${flashClass}`}
    >
      <div>
        {/* Top Header: Symbol, Sector, Holding Badge, Price & % Change */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold theme-text-main font-mono tracking-tight group-hover:text-[#D4A017] transition-colors">
                {stock.symbol}
              </span>
              <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-semibold theme-bg-panel theme-text-muted border theme-border font-mono">
                {stock.sector}
              </span>
              {availHoldingQty > 0 && (
                <span className="px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono font-bold bg-[#D4A017]/15 text-[#D4A017] border border-[#D4A017]/30">
                  {availHoldingQty} Owned
                </span>
              )}
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

        {/* Sparkline & Quick Action Controls */}
        <div className="mt-3 py-1 flex items-center justify-between gap-2 border-t theme-border pt-3">
          <Sparkline history={stock.priceHistories} width={100} height={32} />

          <div className="flex items-center gap-1.5">
            {/* Quick Buy Button */}
            <button
              type="button"
              onClick={(e) => handleOpenQuick(e, 'BUY')}
              disabled={isTradingLocked}
              title={isTradingLocked ? 'Session locked' : 'Instant Quick Buy'}
              className="px-3 py-1.5 bg-[#10B981]/15 hover:bg-[#10B981] text-[#10B981] hover:text-slate-950 text-xs font-heading font-bold rounded-[4px] border border-[#10B981]/40 transition-all flex items-center gap-1 min-h-[32px] active:scale-95 disabled:opacity-40 btn-terminal"
            >
              <Zap className="w-3 h-3" />
              <span>Buy</span>
            </button>

            {/* Quick Sell Button */}
            <button
              type="button"
              onClick={(e) => handleOpenQuick(e, 'SELL')}
              disabled={isTradingLocked || availHoldingQty === 0}
              title={availHoldingQty === 0 ? 'No shares owned' : 'Instant Quick Sell'}
              className={`px-3 py-1.5 text-xs font-heading font-bold rounded-[4px] border transition-all flex items-center gap-1 min-h-[32px] active:scale-95 btn-terminal ${
                availHoldingQty > 0 && !isTradingLocked
                  ? 'bg-[#EF4444]/15 hover:bg-[#EF4444] text-[#EF4444] hover:text-white border-[#EF4444]/40'
                  : 'opacity-40 bg-slate-800/30 text-slate-500 border-slate-700/40 cursor-not-allowed'
              }`}
            >
              <span>Sell</span>
            </button>

            {/* Chart / Full Modal Trigger */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(stock);
              }}
              title="Open full chart, history and limit orders"
              className="p-1.5 bg-[#D4A017]/10 hover:bg-[#D4A017]/25 text-[#D4A017] rounded-[4px] border border-[#D4A017]/30 transition-all min-h-[32px] min-w-[32px] flex items-center justify-center active:scale-95 btn-terminal"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* INLINE QUICK-TRADE EXPANSION DRAWER */}
        {isQuickOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-3 pt-3 border-t theme-border bg-slate-950/40 dark:bg-black/30 p-3 rounded-[6px] space-y-3 animate-fadeIn"
          >
            {/* Mode Switcher & Close */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQuickMode('BUY')}
                  className={`px-2.5 py-1 rounded-[4px] text-[11px] font-heading font-bold transition-all ${
                    quickMode === 'BUY'
                      ? 'bg-[#10B981] text-slate-950 shadow-sm'
                      : 'theme-bg-panel theme-text-muted hover:theme-text-main'
                  }`}
                >
                  Quick Buy
                </button>
                <button
                  type="button"
                  onClick={() => setQuickMode('SELL')}
                  disabled={availHoldingQty === 0}
                  className={`px-2.5 py-1 rounded-[4px] text-[11px] font-heading font-bold transition-all ${
                    quickMode === 'SELL'
                      ? 'bg-[#EF4444] text-white shadow-sm'
                      : 'theme-bg-panel theme-text-muted hover:theme-text-main disabled:opacity-40'
                  }`}
                >
                  Quick Sell {availHoldingQty > 0 ? `(${availHoldingQty})` : ''}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsQuickOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Context & One-Tap Percentage Presets */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-mono theme-text-muted">
                <span>{quickMode === 'BUY' ? 'Available Cash:' : 'Available Shares:'}</span>
                <span className="font-bold text-slate-200">
                  {quickMode === 'BUY'
                    ? `${availCash.toLocaleString('en-US', { minimumFractionDigits: 2 })} IC`
                    : `${availHoldingQty} shares`}
                </span>
              </div>

              {/* 1-Tap Percentage Presets (25%, 50%, 100%) */}
              <div className="grid grid-cols-3 gap-1.5">
                {[0.25, 0.50, 1.0].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={(e) => handlePreset(e, pct)}
                    className="py-1 theme-bg-panel hover:bg-slate-800 border theme-border hover:border-[#D4A017]/60 rounded-[4px] text-[11px] font-mono font-bold theme-text-main transition-all active:scale-95"
                  >
                    {pct === 1.0 ? '100% (Max)' : `${pct * 100}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Stepper Quantity Input */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 theme-bg-panel border theme-border hover:border-[#D4A017] rounded-[4px] flex items-center justify-center font-bold text-sm theme-text-main active:scale-90"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={quantity || ''}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="flex-1 theme-bg-panel border theme-border rounded-[4px] py-1 px-2 text-center text-sm font-mono font-bold theme-text-main focus:outline-none focus:border-[#D4A017] min-h-[36px]"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-9 theme-bg-panel border theme-border hover:border-[#D4A017] rounded-[4px] flex items-center justify-center font-bold text-sm theme-text-main active:scale-90"
              >
                +
              </button>
            </div>

            {/* Est. Total & Confirm Button */}
            <div className="space-y-2 pt-1 border-t theme-border">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="theme-text-muted">Est. Total:</span>
                <span className="font-extrabold text-sm theme-text-main">
                  {estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} IC
                </span>
              </div>

              <button
                type="button"
                onClick={handleConfirmTrade}
                disabled={!canSubmit || isSubmitting}
                className={`w-full py-2 rounded-[4px] font-heading font-extrabold text-xs tracking-wide transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 min-h-[38px] ${
                  quickMode === 'BUY'
                    ? 'bg-[#10B981] hover:bg-[#059669] text-slate-950 disabled:opacity-40'
                    : 'bg-[#EF4444] hover:bg-[#DC2626] text-white disabled:opacity-40'
                }`}
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>
                      {quickMode === 'BUY' ? `Confirm Buy (${estimatedTotal.toFixed(2)} IC)` : `Confirm Sell (+${estimatedTotal.toFixed(2)} IC)`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
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
  const [sessionData, setSessionData] = useState(null);

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

  const [isTourOpen, setIsTourOpen] = useState(() => {
    try {
      return localStorage.getItem('equity_arena_tour_completed') !== 'true';
    } catch (e) {
      return false;
    }
  });

  const handleQuickTrade = async (stock, mode, quantity) => {
    if (sessionData && (sessionData.status !== 'ACTIVE' || sessionData.isTradingLocked)) {
      showToast("Trading hasn't started yet — waiting for admin to start session", 'error');
      return false;
    }

    if (!quantity || quantity <= 0) {
      showToast("Please enter a valid quantity", 'error');
      return false;
    }

    const endpoint = mode === 'BUY' ? '/trade/buy' : '/trade/sell';
    try {
      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ stockId: stock.id, quantity })
      });

      const verb = mode === 'BUY' ? 'Bought' : 'Sold';
      const execPrice = data.transaction?.price || stock.currentPrice;
      const totalCost = data.transaction?.totalCost || Math.round(execPrice * quantity * 100) / 100;
      
      showToast(`⚡ ${verb} ${quantity} ${stock.symbol} @ ${execPrice.toFixed(2)} IC (Total: ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })} IC)`, 'success');

      if (data.user) {
        setPortfolio((prev) => ({
          ...prev,
          walletBalance: data.user.walletBalance,
          availableWalletBalance: Math.max(0, data.user.walletBalance - (prev.lockedFunds || 0))
        }));
      }
      fetchPortfolio();
      return true;
    } catch (err) {
      showToast(err.message || `Failed to execute ${mode.toLowerCase()} order`, 'error');
      return false;
    }
  };

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

  const liveTotalHoldingsValue = (portfolio.holdings || []).reduce((sum, h) => {
    const s = stocks.find((st) => st.id === h.stockId);
    const price = s?.currentPrice || h.currentPrice || 0;
    return sum + h.quantity * price;
  }, 0);

  const isTradingLocked = !sessionData || sessionData.status !== 'ACTIVE' || sessionData.isTradingLocked;
  const liveSelectedStock = selectedStock
    ? (stocks.find((s) => s.id === selectedStock.id) || selectedStock)
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
        onSessionUpdate={setSessionData}
        onOpenTour={() => setIsTourOpen(true)}
      />

      <LiveTickerMarquee stocks={stocks} onSelectStock={handleOpenDetail} />

      <OnboardingTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />

      <StockDetailModal
        stock={liveSelectedStock}
        userWallet={portfolio.walletBalance}
        userHolding={liveSelectedStock ? getHoldingForStock(liveSelectedStock.id) : null}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onSuccess={handleTradeSuccess}
        isTradingLocked={isTradingLocked}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* TRADING LOCK BANNER */}
        {(!sessionData || sessionData.status !== 'ACTIVE' || sessionData.isTradingLocked) && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/40 rounded-[6px] text-amber-400 text-xs font-mono flex items-center justify-between shadow-lg animate-fadeIn">
            <div className="flex items-center gap-2 font-bold">
              <Clock className="w-5 h-5 animate-pulse text-amber-400" />
              <span>
                {sessionData?.status === 'NOT_STARTED' || !sessionData?.status
                  ? 'TRADING IS LOCKED — WAITING FOR ADMIN TO START SESSION'
                  : sessionData?.status === 'LIQUIDATING'
                  ? 'AUTO-LIQUIDATION SWEEP ACTIVE — POSITIONS CONVERTING TO CASH'
                  : 'TRADING SESSION ENDED — FINAL RESULTS LOCKED'}
              </span>
            </div>
            <span className="text-[10px] bg-amber-500/20 px-2.5 py-1 rounded font-mono font-extrabold uppercase border border-amber-500/30">
              {sessionData?.status || 'LOCKED'}
            </span>
          </div>
        )}

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
                        holding={getHoldingForStock(stock.id)}
                        availableWallet={portfolio.availableWalletBalance !== undefined ? portfolio.availableWalletBalance : portfolio.walletBalance}
                        onOpenDetail={handleOpenDetail}
                        onQuickTrade={handleQuickTrade}
                        priceFlash={stockFlashes[stock.id]}
                        isTradingLocked={isTradingLocked}
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
                          const matchedStock = stocks.find((s) => s.id === h.stockId) || {
                            id: h.stockId,
                            symbol: h.symbol,
                            name: h.name,
                            currentPrice: h.currentPrice
                          };
                          const livePrice = matchedStock.currentPrice || h.currentPrice || 0;
                          const liveTotalValue = Math.round(h.quantity * livePrice * 100) / 100;
                          const totalCost = Math.round(h.quantity * h.avgBuyPrice * 100) / 100;
                          const liveUnrealizedPL = Math.round((liveTotalValue - totalCost) * 100) / 100;
                          const liveUnrealizedPLPercent = totalCost > 0
                            ? Math.round(((liveUnrealizedPL / totalCost) * 100) * 100) / 100
                            : 0;
                          const isPositive = liveUnrealizedPL >= 0;

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
                                <AnimatedNumber value={livePrice} decimals={2} suffix=" IC" />
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className={`font-mono font-bold ${isPositive ? 'text-[#1DB954]' : 'text-[#E8453C]'}`}>
                                  {isPositive ? '+' : ''}
                                  <AnimatedNumber value={liveUnrealizedPL} decimals={2} suffix=" IC" />
                                </div>
                                <div className={`text-[10px] font-mono ${isPositive ? 'text-[#1DB954]' : 'text-[#E8453C]'}`}>
                                  ({isPositive ? '+' : ''}{liveUnrealizedPLPercent.toFixed(2)}%)
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
                      {liveTotalHoldingsValue.toFixed(2)} IC
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