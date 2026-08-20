import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { apiFetch } from '../services/api';
import { useSession } from '../hooks/useSession';

import { Sidebar, MobileNav } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { LiveTickerMarquee } from '../components/LiveTickerMarquee';
import { GameTimerHero } from '../components/GameTimerHero';
import { StatTile } from '../components/StatTile';
import { ChartPanel, TIMEFRAMES } from '../components/ChartPanel';
import { FloorCard } from '../components/FloorCard';
import { MyStocks } from '../components/MyStocks';
import { MyTrades } from '../components/MyTrades';
import { EditOrderDialog } from '../components/EditOrderDialog';
import { Reveal, BackToTopButton } from '../components/Reveal';
import { ToastStack } from '../components/ToastStack';
import { StockDetailModal } from '../components/StockDetailModal';
import { OnboardingTour } from '../components/OnboardingTour';
import { NewsToast } from '../components/NewsToast';
import { TradeFeedbackOverlay } from '../components/TradeFeedbackOverlay';

import {
  Wallet,
  PieChart,
  TrendingUp,
  TrendingDown,
  Layers,
  Newspaper,
  RefreshCw,
  LayoutGrid,
  List,
  Clock,
  Ban,
  History,
  Pencil,
  ArrowUpRight,
  AlertTriangle
} from 'lucide-react';

const fmtMoney = (n, d = 2) =>
  Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d
  });

const PAGE_SIZES = [10, 15, 25, 50];

export function TraderDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  /* ---------------------------------------------------------------
     Core state
     --------------------------------------------------------------- */
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [searchQuery, setSearchQuery] = useState('');

  const [stocks, setStocks] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(true);
  const [stockFlashes, setStockFlashes] = useState({});

  const [portfolio, setPortfolio] = useState({
    walletBalance: user?.walletBalance || 0,
    availableWalletBalance: user?.walletBalance || 0,
    lockedFunds: 0,
    totalHoldingsValue: 0,
    totalUnrealizedPL: 0,
    totalPortfolioValue: user?.walletBalance || 0,
    holdings: [],
    transactions: [],
    pendingOrders: []
  });

  const [newsFeed, setNewsFeed] = useState([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [activeNewsToast, setActiveNewsToast] = useState(null);

  // One shared session source feeds the clock, the banner and the lock state
  const sessionData = useSession();

  const [toasts, setToasts] = useState([]);
  const [feedbackOverlay, setFeedbackOverlay] = useState(null);

  /* Floor display controls */
  const [floorView, setFloorView] = useState('grid'); // 'grid' | 'compact'
  const [pageSize, setPageSize] = useState(10);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  /* Chart */
  const [chartStockId, setChartStockId] = useState(null);
  const [timeframe, setTimeframe] = useState('15M');
  const [chartRaw, setChartRaw] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  /* Detail modal + quick trade */
  const [detailStock, setDetailStock] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailSide, setDetailSide] = useState('BUY');
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);

  const [quickSubmitting, setQuickSubmitting] = useState(false);

  const [isTourOpen, setIsTourOpen] = useState(() => {
    try {
      return localStorage.getItem('equity_arena_tour_completed') !== 'true';
    } catch {
      return false;
    }
  });

  /* ---------------------------------------------------------------
     Toasts
     --------------------------------------------------------------- */
  const toastIdRef = useRef(0);

  const pushToast = useCallback((message, type = 'success', title) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev.slice(-3), { id, message, type, title }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* ---------------------------------------------------------------
     Data fetching
     --------------------------------------------------------------- */
  const fetchStocks = useCallback(async () => {
    try {
      const data = await apiFetch('/stocks');
      setStocks(Array.isArray(data) ? data : []);
      setLastRefresh(Date.now());
    } catch (err) {
      pushToast(err.message || 'Failed to load the market', 'error', 'Market feed');
    } finally {
      setLoadingStocks(false);
    }
  }, [pushToast]);

  const fetchPortfolio = useCallback(async () => {
    try {
      const data = await apiFetch('/portfolio');
      setPortfolio((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error('Fetch portfolio error:', err);
    }
  }, []);

  const fetchNewsFeed = useCallback(async () => {
    setLoadingNews(true);
    try {
      const data = await apiFetch('/news');
      setNewsFeed(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch news error:', err);
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

  /* ---------------------------------------------------------------
     Chart selection + history
     --------------------------------------------------------------- */
  const chartStock = useMemo(
    () => stocks.find((s) => s.id === chartStockId) || stocks[0] || null,
    [stocks, chartStockId]
  );

  // Default the chart to the day's strongest mover once stocks land
  useEffect(() => {
    if (chartStockId || stocks.length === 0) return;
    const leader = [...stocks].sort(
      (a, b) => Math.abs(b.percentChange || 0) - Math.abs(a.percentChange || 0)
    )[0];
    setChartStockId(leader?.id || stocks[0].id);
  }, [stocks, chartStockId]);

  const fetchChartHistory = useCallback(async (stockId) => {
    if (!stockId) return;
    setLoadingHistory(true);
    try {
      const data = await apiFetch(`/stocks/${stockId}/history?range=1D`);
      setChartRaw(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch chart history error:', err);
      setChartRaw([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (!chartStock?.id) return;
    fetchChartHistory(chartStock.id);
  }, [chartStock?.id, fetchChartHistory]);

  const chartHistory = useMemo(() => {
    const source = chartRaw.length > 1 ? chartRaw : chartStock?.priceHistories || [];
    const tf = TIMEFRAMES.find((t) => t.key === timeframe);

    const minutes = tf?.minutes || 15;
    const cutoff = Date.now() - minutes * 60_000;
    const windowed = source.filter(
      (h) => new Date(h.timestamp).getTime() >= cutoff
    );

    return windowed.length >= 2 ? windowed : source.slice(-60);
  }, [chartRaw, chartStock, timeframe]);

  /* ---------------------------------------------------------------
     Real-time socket wiring
     --------------------------------------------------------------- */
  const chartStockIdRef = useRef(null);
  useEffect(() => {
    chartStockIdRef.current = chartStock?.id || null;
  }, [chartStock?.id]);

  useEffect(() => {
    if (!socket) return;

    const flashTimers = new Map();

    const handleConnect = () => {
      fetchStocks();
      fetchPortfolio();
      fetchNewsFeed();
    };

    const handleStockUpdate = (diff) => {
      setStocks((prev) =>
        prev.map((s) => {
          if (s.id !== diff.stockId) return s;

          const direction =
            diff.newPrice > s.currentPrice
              ? 'up'
              : diff.newPrice < s.currentPrice
              ? 'down'
              : null;

          if (direction) {
            setStockFlashes((f) => ({ ...f, [diff.stockId]: direction }));
            clearTimeout(flashTimers.get(diff.stockId));
            flashTimers.set(
              diff.stockId,
              setTimeout(() => {
                setStockFlashes((f) => ({ ...f, [diff.stockId]: null }));
              }, 720)
            );
          }

          return {
            ...s,
            currentPrice: diff.newPrice,
            percentChange: diff.percentChange,
            priceHistories: [
              ...(s.priceHistories || []),
              {
                price: diff.newPrice,
                volume: diff.volume,
                timestamp: diff.timestamp
              }
            ].slice(-120)
          };
        })
      );

      // Append the tick to the open chart so the line extends live
      if (diff.stockId === chartStockIdRef.current) {
        setChartRaw((prev) => {
          const next = [
            ...prev,
            {
              price: diff.newPrice,
              volume: diff.volume,
              timestamp: diff.timestamp
            }
          ];
          return next.length > 4000 ? next.slice(-4000) : next;
        });
      }
    };

    const handleNews = (news) => {
      setActiveNewsToast(news);
      setNewsFeed((prev) => (Array.isArray(prev) ? [news, ...prev] : [news]));
    };

    const handlePortfolioUpdate = (updated) => {
      setPortfolio((prev) => ({ ...prev, ...updated }));
    };

    const handleOrderExecuted = (alert) => {
      setFeedbackOverlay({
        status: 'success',
        message: alert?.message || 'Limit order executed'
      });
      pushToast(alert?.message || 'Limit order executed', 'success', 'Order filled');
      fetchPortfolio();
    };

    socket.on('connect', handleConnect);
    socket.on('stock:update', handleStockUpdate);
    socket.on('news:broadcast', handleNews);
    socket.on('portfolio:update', handlePortfolioUpdate);
    socket.on('order:executed', handleOrderExecuted);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('stock:update', handleStockUpdate);
      socket.off('news:broadcast', handleNews);
      socket.off('portfolio:update', handlePortfolioUpdate);
      socket.off('order:executed', handleOrderExecuted);
      flashTimers.forEach((t) => clearTimeout(t));
    };
  }, [socket, fetchStocks, fetchPortfolio, fetchNewsFeed, pushToast]);

  /* ---------------------------------------------------------------
     Derived values
     --------------------------------------------------------------- */
  const isTradingLocked =
    !sessionData || sessionData.status !== 'ACTIVE' || sessionData.isTradingLocked;

  const availableCash =
    portfolio.availableWalletBalance !== undefined
      ? portfolio.availableWalletBalance
      : portfolio.walletBalance;

  const holdingFor = useCallback(
    (stockId) => portfolio.holdings?.find((h) => h.stockId === stockId),
    [portfolio.holdings]
  );

  const chartHolding = chartStock ? holdingFor(chartStock.id) : null;
  const chartOwnedQty = chartHolding
    ? chartHolding.availableQuantity ?? chartHolding.quantity ?? 0
    : 0;

  const filteredStocks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return stocks;
    return stocks.filter(
      (s) =>
        s.symbol?.toLowerCase().includes(q) ||
        s.name?.toLowerCase().includes(q) ||
        s.sector?.toLowerCase().includes(q)
    );
  }, [stocks, searchQuery]);

  const visibleStocks = useMemo(
    () => filteredStocks.slice(0, pageSize),
    [filteredStocks, pageSize]
  );

  const liveHoldingsValue = useMemo(
    () =>
      (portfolio.holdings || []).reduce((sum, h) => {
        const s = stocks.find((st) => st.id === h.stockId);
        return sum + h.quantity * (s?.currentPrice || h.currentPrice || 0);
      }, 0),
    [portfolio.holdings, stocks]
  );

  const netWorth = availableCash + liveHoldingsValue + (portfolio.lockedFunds || 0);

  /* Real overall result: money already banked from selling PLUS what open
     positions are worth right now.

     The backend also returns a totalProfit, but that is a snapshot taken at
     the last /portfolio fetch, while stock prices keep ticking over the
     socket. Reading it directly left this figure frozen at an old price while
     every other tile moved, so the dashboard contradicted itself. realizedPL
     is historical and therefore safe to take from the snapshot; the unrealised
     half is recomputed from live prices. */
  const startingBalance = portfolio.startingBalance ?? 0;

  const holdingsCost = useMemo(
    () =>
      (portfolio.holdings || []).reduce(
        (sum, h) => sum + h.quantity * (h.avgBuyPrice || 0),
        0
      ),
    [portfolio.holdings]
  );

  const liveUnrealizedPL = liveHoldingsValue - holdingsCost;
  const totalProfit = (portfolio.realizedPL ?? 0) + liveUnrealizedPL;
  const totalProfitPercent =
    startingBalance > 0 ? (totalProfit / startingBalance) * 100 : 0;



  /* ---------------------------------------------------------------
     Quick trade — fires straight away with specified quantity.
     --------------------------------------------------------------- */
  const runQuickTrade = useCallback(
    async (side, qty = 1) => {
      if (!chartStock) return;
      if (isTradingLocked) {
        pushToast(
          'Trading is locked — the market session is not running yet.',
          'error',
          'Market closed'
        );
        return;
      }

      const quantity = Math.max(1, parseInt(qty, 10) || 1);
      const endpoint = side === 'BUY' ? '/trade/buy' : '/trade/sell';
      setQuickSubmitting(true);

      try {
        const data = await apiFetch(endpoint, {
          method: 'POST',
          body: JSON.stringify({ stockId: chartStock.id, quantity })
        });

        const execPrice = data.transaction?.price ?? chartStock.currentPrice;
        const total =
          data.transaction?.totalCost ??
          Math.round(execPrice * quantity * 100) / 100;

        setFeedbackOverlay({
          status: 'success',
          message: `${side === 'BUY' ? 'Bought' : 'Sold'} ${quantity} ${chartStock.symbol}`
        });
        pushToast(
          `${side === 'BUY' ? 'Bought' : 'Sold'} ${quantity} ${chartStock.symbol} @ ${fmtMoney(
            execPrice
          )} IC · ${side === 'BUY' ? 'Paid' : 'Received'} ${fmtMoney(total)} IC`,
          'success',
          `Quick ${side.toLowerCase()} filled`
        );

        if (data.user) {
          setPortfolio((prev) => ({
            ...prev,
            walletBalance: data.user.walletBalance,
            availableWalletBalance: Math.max(
              0,
              data.user.walletBalance - (prev.lockedFunds || 0)
            )
          }));
        }
        fetchPortfolio();
      } catch (err) {
        pushToast(
          err.message || `Quick ${side.toLowerCase()} failed`,
          'error',
          'Order rejected'
        );
      } finally {
        setQuickSubmitting(false);
      }
    },
    [chartStock, quickSubmitting, isTradingLocked, fetchPortfolio, pushToast]
  );

  /* ---------------------------------------------------------------
     Other handlers
     --------------------------------------------------------------- */
  const handleSelectFromFloor = useCallback((stock) => {
    setChartStockId(stock.id);
    // Must match the tab key below — 'MARKET' matched no block, so clicking a
    // card blanked the whole page instead of loading the chart.
    setActiveTab('DASHBOARD');
    // Bring the chart into view when picking from a long floor list
    requestAnimationFrame(() => {
      document
        .getElementById('main-chart')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, []);

  const handleOpenDetail = useCallback((stock, side = 'BUY', qty = 1) => {
    setDetailStock(stock);
    setDetailSide(side);
    setDetailQuantity(qty);
    setIsDetailOpen(true);
  }, []);

  // Buy / Sell straight from a floor card opens the trade window on that side
  const handleCardTrade = useCallback(
    (stock, side, qty = 1) => {
      if (isTradingLocked) {
        pushToast(
          'Trading is locked — the market session is not running yet.',
          'error',
          'Market closed'
        );
        return;
      }
      handleOpenDetail(stock, side, qty);
    },
    [isTradingLocked, pushToast, handleOpenDetail]
  );

  const handleCancelOrder = useCallback(
    async (orderId) => {
      setCancellingOrderId(orderId);
      try {
        const data = await apiFetch(`/orders/${orderId}`, { method: 'DELETE' });
        pushToast(data.message || 'Order cancelled', 'success', 'Order cancelled');
        fetchPortfolio();
      } catch (err) {
        pushToast(err.message || 'Failed to cancel order', 'error');
      } finally {
        setCancellingOrderId(null);
      }
    },
    [fetchPortfolio, pushToast]
  );

  const handleEditOrder = useCallback(
    async (orderId, changes) => {
      try {
        const data = await apiFetch(`/orders/${orderId}`, {
          method: 'PATCH',
          body: JSON.stringify(changes)
        });
        setEditingOrder(null);
        pushToast(data.message || 'Order updated', 'success', 'Order changed');
        fetchPortfolio();
        return { ok: true };
      } catch (err) {
        // Returned rather than thrown so the dialog can show it inline
        return { error: err.message || 'Could not update the order' };
      }
    },
    [fetchPortfolio, pushToast]
  );

  const liveDetailStock = detailStock
    ? stocks.find((s) => s.id === detailStock.id) || detailStock
    : null;

  const navCounts = {
    ORDERS: portfolio.pendingOrders?.length || 0,
    NEWS: newsFeed.length
  };

  /* ---------------------------------------------------------------
     Render
     --------------------------------------------------------------- */
  return (
    <div className="min-h-screen theme-bg-main theme-text-main">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} counts={navCounts} />
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} counts={navCounts} />

      <div className="lg:pl-[208px]">
        <TopBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          walletBalance={availableCash}
          lockedFunds={portfolio.lockedFunds || 0}
          sessionStatus={sessionData?.status}
          onOpenTour={() => setIsTourOpen(true)}
        />

        <LiveTickerMarquee stocks={stocks} onSelectStock={handleSelectFromFloor} />

        <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5 pb-24 lg:pb-10 space-y-5">
          {/* ---------------- Greeting ---------------- */}
          <div>
            <h2 className="text-[19px] font-heading font-extrabold theme-text-main leading-tight">
              Welcome back, {user?.name || user?.email?.split('@')[0] || 'trader'}
            </h2>
            <p className="text-[11.5px] theme-text-muted mt-0.5">
              {stocks.length} stocks to trade. Buy low, sell high, grow your cash.
            </p>

            {/* One plain sentence so the score is obvious at a glance */}
            {startingBalance > 0 && (
              <p className="text-[12.5px] theme-text-main mt-2">
                You started with{' '}
                <strong className="font-mono">{fmtMoney(startingBalance)} IC</strong> and now
                have <strong className="font-mono">{fmtMoney(netWorth)} IC</strong> —{' '}
                <strong
                  style={{
                    color: totalProfit >= 0 ? 'var(--gain-green)' : 'var(--loss-red)'
                  }}
                >
                  {totalProfit >= 0 ? 'up' : 'down'} {fmtMoney(Math.abs(totalProfit))} IC
                  {' '}({Math.abs(totalProfitPercent).toFixed(1)}%)
                </strong>
                .
              </p>
            )}
          </div>

          {/* ---------------- Session lock banner ---------------- */}
          {isTradingLocked && (
            <div
              className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border animate-fadeIn"
              style={{
                borderColor: 'color-mix(in srgb, var(--accent) 38%, transparent)',
                backgroundColor: 'color-mix(in srgb, var(--accent) 9%, transparent)',
                color: 'var(--accent)'
              }}
            >
              <div className="flex items-center gap-2 text-[11px] font-mono font-bold">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-pulse" />
                <span>
                  {!sessionData?.status || sessionData.status === 'NOT_STARTED'
                    ? "The game hasn't started yet — your host will open the market"
                    : sessionData.status === 'LIQUIDATING'
                    ? 'Game is wrapping up — your stocks are turning back into cash'
                    : 'Game over — trading is closed'}
                </span>
              </div>
              <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest px-2 py-1 rounded border theme-border flex-shrink-0">
                {sessionData?.status || 'PAUSED'}
              </span>
            </div>
          )}

          {/* =============== DASHBOARD =============== */}
          {activeTab === 'DASHBOARD' && (
            <>
              <Reveal>
                <GameTimerHero sessionData={sessionData} />
              </Reveal>

              {/* ---------------- Money tiles ---------------- */}
              <Reveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" delay={0.05}>
                <StatTile
                  label="Total worth"
                  value={netWorth}
                  suffix=" IC"
                  tone="gold"
                  Icon={Wallet}
                  hint={
                    (portfolio.lockedFunds || 0) > 0
                      ? `cash + stocks (incl. ${fmtMoney(portfolio.lockedFunds)} IC held for orders)`
                      : 'your cash plus your stocks'
                  }
                />
                <StatTile
                  label={totalProfit >= 0 ? 'Total profit' : 'Total loss'}
                  value={Math.abs(totalProfit)}
                  prefix={totalProfit >= 0 ? '+' : '-'}
                  suffix=" IC"
                  tone={totalProfit >= 0 ? 'up' : 'down'}
                  Icon={totalProfit >= 0 ? TrendingUp : TrendingDown}
                  hint={`you started with ${fmtMoney(startingBalance)} IC`}
                  delta={totalProfitPercent}
                />
                <StatTile
                  label="Money in stocks"
                  value={liveHoldingsValue}
                  suffix=" IC"
                  tone="neutral"
                  Icon={Layers}
                  hint={`across ${portfolio.holdings?.length || 0} ${
                    (portfolio.holdings?.length || 0) === 1 ? 'stock' : 'stocks'
                  }`}
                />
                <StatTile
                  label="Cash to spend"
                  value={availableCash}
                  suffix=" IC"
                  tone="neutral"
                  Icon={PieChart}
                  hint={
                    portfolio.lockedFunds > 0
                      ? `${fmtMoney(portfolio.lockedFunds)} IC held for your waiting orders`
                      : 'ready to buy'
                  }
                />
              </Reveal>

              {/* ---------------- Chart + news ---------------- */}
              <Reveal className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)] gap-4">
                <div id="main-chart">
                  <ChartPanel
                    stocks={stocks}
                    selected={chartStock}
                    onSelectStock={(s) => setChartStockId(s.id)}
                    history={chartHistory}
                    timeframe={timeframe}
                    onTimeframeChange={setTimeframe}
                    loadingHistory={loadingHistory}
                    onQuickTrade={runQuickTrade}
                    ownedQuantity={chartOwnedQty}
                    isTradingLocked={isTradingLocked}
                  />
                </div>

                <NewsPanel
                  news={newsFeed}
                  loading={loadingNews}
                  onRefresh={fetchNewsFeed}
                  onViewAll={() => setActiveTab('NEWS')}
                />
              </Reveal>

              {/* ---------------- All stocks ---------------- */}
              <Reveal as="section" className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h3 className="text-[15px] font-heading font-extrabold theme-text-main flex items-center gap-2">
                      All Stocks
                      <span className="text-[11px] font-normal theme-text-dim">
                        showing {visibleStocks.length} of {filteredStocks.length}
                      </span>
                    </h3>
                    <p className="text-[11px] theme-text-muted mt-0.5">
                      Tap any stock to see its chart, or use Buy and Sell right on the card
                      {searchQuery && ` · searching “${searchQuery}”`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      aria-label="How many stocks to show"
                      className="h-[28px] rounded-md border theme-border theme-bg-input px-2 text-[11px] font-mono theme-text-main focus:outline-none"
                    >
                      {PAGE_SIZES.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>

                    <div
                      className="inline-flex items-center gap-0.5 p-0.5 rounded-md border theme-border"
                      style={{ backgroundColor: 'var(--bg-input)' }}
                      role="group"
                      aria-label="Card size"
                    >
                      {[
                        { key: 'compact', Icon: List, label: 'Small cards' },
                        { key: 'grid', Icon: LayoutGrid, label: 'Big cards' }
                      ].map(({ key, Icon, label }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFloorView(key)}
                          title={label}
                          aria-label={label}
                          aria-pressed={floorView === key}
                          className="w-[26px] h-[24px] rounded flex items-center justify-center transition-colors"
                          style={
                            floorView === key
                              ? {
                                  backgroundColor:
                                    'color-mix(in srgb, var(--accent) 18%, transparent)',
                                  color: 'var(--accent)'
                                }
                              : { color: 'var(--text-dim)' }
                          }
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={fetchStocks}
                      aria-label="Refresh prices"
                      className="w-[28px] h-[28px] rounded-md border theme-border theme-bg-input flex items-center justify-center theme-text-muted hover:theme-text-main transition-colors"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${loadingStocks ? 'animate-spin' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {loadingStocks ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="h-[148px] rounded-lg animate-shimmer" />
                    ))}
                  </div>
                ) : filteredStocks.length === 0 ? (
                  <div className="surface py-12 text-center text-[11px] font-mono theme-text-dim">
                    No stock matches “{searchQuery}”. Try a different name.
                  </div>
                ) : (
                  <div
                    className={
                      floorView === 'grid'
                        ? 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3'
                        : 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-2'
                    }
                  >
                    {visibleStocks.map((stock, i) => (
                      <FloorCard
                        key={stock.id}
                        stock={stock}
                        holding={holdingFor(stock.id)}
                        index={i}
                        flash={stockFlashes[stock.id]}
                        variant={floorView === 'grid' ? 'grid' : 'compact'}
                        isActive={stock.id === chartStock?.id}
                        isTradingLocked={isTradingLocked}
                        onSelect={handleSelectFromFloor}
                        onTrade={handleCardTrade}
                      />
                    ))}
                  </div>
                )}

                {filteredStocks.length > pageSize && (
                  <button
                    type="button"
                    onClick={() =>
                      setPageSize((n) => Math.min(n + 15, filteredStocks.length))
                    }
                    className="w-full py-2 rounded-lg border border-dashed theme-border text-[11px] font-mono theme-text-muted hover:theme-text-main hover:theme-bg-card-hover transition-colors"
                  >
                    Show {Math.min(15, filteredStocks.length - pageSize)} more stocks
                  </button>
                )}
              </Reveal>

              {/* ---------------- What I own ---------------- */}
              <Reveal>
              <MyStocks
                holdings={portfolio.holdings || []}
                stocks={stocks}
                onSell={handleOpenDetail}
                onShowChart={handleSelectFromFloor}
              />
              </Reveal>

              {/* ---------------- What I've traded ---------------- */}
              <Reveal>
                <MyTrades transactions={portfolio.transactions || []} limit={6} />
              </Reveal>

            </>
          )}

          {/* =============== ORDERS TAB =============== */}
          {activeTab === 'ORDERS' && (
            <OrdersTab
              portfolio={portfolio}
              cancellingOrderId={cancellingOrderId}
              onCancel={handleCancelOrder}
              onEdit={setEditingOrder}
            />
          )}

          {/* =============== NEWS TAB =============== */}
          {activeTab === 'NEWS' && (
            <NewsTab news={newsFeed} loading={loadingNews} onRefresh={fetchNewsFeed} />
          )}
        </main>
      </div>

      {/* ---------------- Overlays ---------------- */}
      <BackToTopButton />

      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <TradeFeedbackOverlay
        status={feedbackOverlay?.status}
        message={feedbackOverlay?.message}
        onClose={() => setFeedbackOverlay(null)}
      />

      <NewsToast news={activeNewsToast} onClose={() => setActiveNewsToast(null)} />

      <StockDetailModal
        stock={liveDetailStock}
        userWallet={portfolio.walletBalance}
        userHolding={liveDetailStock ? holdingFor(liveDetailStock.id) : null}
        isOpen={isDetailOpen}
        initialMode={detailSide}
        initialQuantity={detailQuantity}
        onClose={() => setIsDetailOpen(false)}
        onSuccess={(message, updated) => {
          pushToast(message, 'success', 'Order confirmed');
          if (updated) setPortfolio((prev) => ({ ...prev, ...updated }));
          else fetchPortfolio();
        }}
        isTradingLocked={isTradingLocked}
      />

      <EditOrderDialog
        open={!!editingOrder}
        order={editingOrder}
        livePrice={
          editingOrder
            ? stocks.find((st) => st.id === editingOrder.stockId)?.currentPrice
            : undefined
        }
        onSave={handleEditOrder}
        onCancel={() => setEditingOrder(null)}
      />

      <OnboardingTour isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
    </div>
  );
}

/* ==================================================================
   News side panel
   ================================================================== */
function NewsPanel({ news, loading, onRefresh, onViewAll }) {
  return (
    <div className="surface flex flex-col" style={{ boxShadow: 'var(--card-shadow)' }}>
      <div className="flex items-center justify-between px-3.5 py-3 border-b theme-border">
        <h3 className="text-[12px] font-heading font-bold theme-text-main flex items-center gap-1.5">
          <Newspaper className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          Market news
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onRefresh}
            aria-label="Refresh news"
            className="p-1 rounded theme-text-dim hover:theme-text-main transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onViewAll}
            className="text-[10px] font-mono transition-colors hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            View all
          </button>
        </div>
      </div>

      <div className="flex-1 p-2.5 space-y-2 max-h-[380px] overflow-y-auto">
        {news.length === 0 ? (
          <div className="h-full min-h-[120px] flex items-center justify-center text-center px-4">
            <p className="text-[10.5px] theme-text-dim leading-relaxed">
              Nothing on the wire yet. When the desk breaks a story, prices move
              within seconds.
            </p>
          </div>
        ) : (
          news.slice(0, 12).map((item, i) => (
            <article
              key={item.id || i}
              className="surface-panel px-2.5 py-2 space-y-1 animate-card-rise"
              style={{ animationDelay: `${Math.min(i * 35, 300)}ms` }}
            >
              <div className="flex items-center justify-between text-[9px] font-mono">
                <span
                  className="font-bold uppercase tracking-widest"
                  style={{ color: 'var(--accent)' }}
                >
                  ● Analyst wire
                </span>
                <span className="theme-text-dim">
                  {new Date(item.timestamp || Date.now()).toLocaleTimeString('en-IN', {
                    hour12: false
                  })}
                </span>
              </div>
              <p className="text-[11px] theme-text-main leading-snug">{item.message}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

/* ==================================================================
   Orders tab
   ================================================================== */
function OrdersTab({ portfolio, cancellingOrderId, onCancel, onEdit }) {
  const orders = portfolio.pendingOrders || [];

  return (
    <div className="space-y-4">
      <Reveal as="section" className="surface" style={{ boxShadow: 'var(--card-shadow)' }}>
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 border-b theme-border">
          <div>
            <h3 className="text-[15px] font-heading font-bold theme-text-main flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              Waiting Orders
            </h3>
            <p className="text-[11px] theme-text-muted mt-0.5">
              These buy or sell on their own as soon as the stock hits your price
            </p>
          </div>
          <span
            className="px-2.5 py-1 rounded text-[11px] font-semibold flex-shrink-0"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent) 13%, transparent)',
              color: 'var(--accent)'
            }}
          >
            {orders.length} waiting
          </span>
        </div>

        <div className="p-3 space-y-2">
          {orders.length === 0 ? (
            <div className="py-12 text-center">
              <Clock
                className="w-7 h-7 mx-auto mb-2.5"
                style={{ color: 'var(--text-dim)' }}
              />
              <div className="text-[13px] theme-text-main font-semibold">
                No waiting orders
              </div>
              <div className="text-[11.5px] theme-text-muted mt-1 max-w-[340px] mx-auto">
                Open any stock, switch to <strong>Limit Order</strong>, and pick the price
                you want. We'll buy or sell for you when it gets there.
              </div>
            </div>
          ) : (
            orders.map((order, i) => {
              const isBuy = order.type === 'BUY';
              const color = isBuy ? 'var(--gain-green)' : 'var(--loss-red)';

              return (
                <div
                  key={order.id}
                  className="surface-panel px-3.5 py-3 flex flex-wrap items-center justify-between gap-3 animate-card-rise"
                  style={{ animationDelay: `${Math.min(i * 40, 320)}ms` }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="px-2 py-0.5 rounded text-[10.5px] font-bold flex-shrink-0"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                        color
                      }}
                    >
                      {isBuy ? 'Will buy' : 'Will sell'}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold theme-text-main">
                        {order.stock?.symbol || 'Stock'}
                        <span className="theme-text-dim font-normal text-[11px] ml-1.5">
                          {order.stock?.name || ''}
                        </span>
                      </div>
                      <div className="text-[11px] theme-text-muted mt-0.5">
                        {order.quantity} {order.quantity === 1 ? 'share' : 'shares'} when the
                        price reaches{' '}
                        <strong className="font-mono" style={{ color: 'var(--accent)' }}>
                          {fmtMoney(order.targetPrice)} IC
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => onEdit(order)}
                      disabled={cancellingOrderId === order.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] font-semibold transition-colors disabled:opacity-50"
                      style={{
                        backgroundColor:
                          'color-mix(in srgb, var(--accent) 12%, transparent)',
                        color: 'var(--accent)'
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Change
                    </button>

                    <button
                      type="button"
                      onClick={() => onCancel(order.id)}
                      disabled={cancellingOrderId === order.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] font-semibold transition-colors disabled:opacity-50"
                      style={{
                        backgroundColor:
                          'color-mix(in srgb, var(--loss-red) 12%, transparent)',
                        color: 'var(--loss-red)'
                      }}
                    >
                      <Ban className="w-3.5 h-3.5" />
                      {cancellingOrderId === order.id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Reveal>

      <Reveal delay={0.06}>
        <MyTrades
          transactions={portfolio.transactions || []}
          limit={20}
          title="Past Trades"
        />
      </Reveal>
    </div>
  );
}

/* ==================================================================
   News tab
   ================================================================== */
function NewsTab({ news, loading, onRefresh }) {
  return (
    <div className="surface" style={{ boxShadow: 'var(--card-shadow)' }}>
      <div className="flex items-center justify-between px-4 py-3.5 border-b theme-border">
        <div>
          <h3 className="text-[13px] font-heading font-bold theme-text-main flex items-center gap-1.5">
            <Newspaper className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            Analyst wire
          </h3>
          <p className="text-[10px] theme-text-dim mt-0.5">
            Every broadcast this session — sector headlines move prices within seconds
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 h-[30px] rounded-md border theme-border theme-bg-input text-[11px] font-heading font-bold theme-text-muted hover:theme-text-main transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="p-3 space-y-2">
        {news.length === 0 ? (
          <div className="py-16 text-center text-[11px] font-mono theme-text-dim">
            No broadcasts recorded yet.
          </div>
        ) : (
          news.map((item, i) => (
            <article
              key={item.id || i}
              className="surface-panel px-3.5 py-3 space-y-1.5 animate-card-rise transition-colors hover:theme-bg-card-hover"
              style={{ animationDelay: `${Math.min(i * 30, 400)}ms` }}
            >
              <div className="flex items-center justify-between gap-2 text-[9px] font-mono">
                <span
                  className="px-1.5 py-0.5 rounded font-extrabold uppercase tracking-widest"
                  style={{
                    backgroundColor:
                      'color-mix(in srgb, var(--accent) 14%, transparent)',
                    color: 'var(--accent)'
                  }}
                >
                  Financial wire
                </span>
                <span className="theme-text-dim">
                  {new Date(item.timestamp || Date.now()).toLocaleString('en-IN', {
                    hour12: false
                  })}
                </span>
              </div>
              <p className="text-[12px] theme-text-main leading-relaxed">
                {item.message}
              </p>
              <div className="text-[9px] font-mono theme-text-dim">
                Broadcast #{news.length - i}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
