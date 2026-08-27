import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { apiFetch } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useSession } from '../hooks/useSession';
import { PriceChart } from './PriceChart';
import {
  X,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  AlertTriangle,
  BarChart2,
  Zap,
  Clock,
  Ban,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

const fmtMoney = (n, d = 2) =>
  Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d
  });

const fmtCompact = (n) => {
  const v = Number(n) || 0;
  if (v >= 1e7) return `${(v / 1e7).toFixed(2)}Cr`;
  if (v >= 1e5) return `${(v / 1e5).toFixed(2)}L`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  return String(Math.round(v));
};

const TIMEFRAMES = [
  { key: '5M', label: '5M', minutes: 5 },
  { key: '15M', label: '15M', minutes: 15 },
  { key: '30M', label: '30M', minutes: 30 },
  { key: '1H', label: '1H', minutes: 60 }
];

const QUANTITY_PRESETS = [1, 5, 10, 50, 100];

export function StockDetailModal({
  stock,
  userWallet,
  userHolding,
  isOpen,
  onClose,
  onSuccess,
  isTradingLocked,
  initialMode = 'BUY',
  initialQuantity = 1
}) {
  const { socket } = useSocket();
  const session = useSession();

  const [tradeCategory, setTradeCategory] = useState('INSTANT'); // INSTANT | LIMIT
  const [mode, setMode] = useState(initialMode); // BUY | SELL
  const [quantity, setQuantity] = useState(String(initialQuantity || 1));
  const [targetPrice, setTargetPrice] = useState('');

  const [timeframe, setTimeframe] = useState('15M');
  const [rawHistory, setRawHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [pendingOrders, setPendingOrders] = useState([]);
  const [balanceInfo, setBalanceInfo] = useState({
    availableWalletBalance: userWallet,
    lockedFunds: 0
  });

  const [loadingTrade, setLoadingTrade] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const stockIdRef = useRef(null);

  /* ---------------------------------------------------------------
     Data loading
     --------------------------------------------------------------- */
  const fetchHistory = useCallback(async (stockId, tf) => {
    if (!stockId) return;
    setLoadingHistory(true);
    try {
      // Everything below a day lives inside the 1D window; fetch raw once
      // and slice client-side so switching timeframes is instant.
      const range = tf === 'ALL' ? 'ALL' : '1D';
      const data = await apiFetch(`/stocks/${stockId}/history?range=${range}`);
      setRawHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      setRawHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await apiFetch('/orders');
      setPendingOrders(data.pendingOrders || []);
      if (data.availableBalance !== undefined) {
        setBalanceInfo({
          availableWalletBalance: data.availableBalance,
          lockedFunds: data.lockedFunds || 0
        });
      }
    } catch (err) {
      // Ignore background fetch error
    }
  }, []);

  // Reset the form whenever a different stock is opened
  useEffect(() => {
    if (!isOpen || !stock) return;

    if (stockIdRef.current !== stock.id) {
      stockIdRef.current = stock.id;
      setQuantity(String(initialQuantity || 1));
      setTargetPrice(stock.currentPrice.toFixed(2));
      setTradeCategory('INSTANT');
      setTimeframe('15M');
      setRawHistory([]);
    } else {
      setQuantity(String(initialQuantity || 1));
    }
    setError('');
    setNotice('');
    setMode(initialMode);
  }, [stock?.id, isOpen, initialMode, initialQuantity]);

  useEffect(() => {
    if (!isOpen || !stock?.id) return;
    fetchHistory(stock.id, timeframe === 'ALL' ? 'ALL' : '1D');
    fetchOrders();
  }, [stock?.id, isOpen, timeframe === 'ALL', fetchHistory, fetchOrders]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (userWallet !== undefined) {
      setBalanceInfo((prev) => ({ ...prev, availableWalletBalance: userWallet }));
    }
  }, [userWallet]);

  // Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !loadingTrade) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, loadingTrade, onClose]);

  /* ---------------------------------------------------------------
     Live updates
     --------------------------------------------------------------- */
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handlePortfolioUpdate = (updated) => {
      if (updated.availableWalletBalance !== undefined) {
        setBalanceInfo({
          availableWalletBalance: updated.availableWalletBalance,
          lockedFunds: updated.lockedFunds || 0
        });
      }
      if (updated.pendingOrders) setPendingOrders(updated.pendingOrders);
    };

    const handleStockUpdate = (diff) => {
      if (diff.stockId !== stockIdRef.current) return;
      setRawHistory((prev) => {
        const next = [
          ...prev,
          { price: diff.newPrice, volume: diff.volume, timestamp: diff.timestamp }
        ];
        return next.length > 4000 ? next.slice(-4000) : next;
      });
    };

    // A resting order filling while the window is open should update it live
    const handleOrderExecuted = () => fetchOrders();

    socket.on('portfolio:update', handlePortfolioUpdate);
    socket.on('stock:update', handleStockUpdate);
    socket.on('order:executed', handleOrderExecuted);

    return () => {
      socket.off('portfolio:update', handlePortfolioUpdate);
      socket.off('stock:update', handleStockUpdate);
      socket.off('order:executed', handleOrderExecuted);
    };
  }, [socket, isOpen, fetchOrders]);

  /* ---------------------------------------------------------------
     Derived values (hooks must run before the early return)
     --------------------------------------------------------------- */
  const windowHistory = useMemo(() => {
    const source = rawHistory.length > 1 ? rawHistory : stock?.priceHistories || [];
    const tf = TIMEFRAMES.find((t) => t.key === timeframe);

    if (!tf || !isFinite(tf.minutes)) {
      // "ALL" = this game session. The raw feed reaches a month back with
      // multi-hour gaps, which flattens the part that actually matters.
      const sessionStart = session?.startTime
        ? new Date(session.startTime).getTime()
        : null;
      if (!sessionStart) return source;
      const sinceStart = source.filter(
        (h) => new Date(h.timestamp).getTime() >= sessionStart
      );
      return sinceStart.length >= 2 ? sinceStart : source.slice(-240);
    }

    const cutoff = Date.now() - tf.minutes * 60_000;
    const windowed = source.filter((h) => new Date(h.timestamp).getTime() >= cutoff);
    return windowed.length >= 2 ? windowed : source.slice(-60);
  }, [rawHistory, stock, timeframe, session?.startTime]);

  const stats = useMemo(() => {
    const prices = windowHistory.map((h) => Number(h.price)).filter(isFinite);
    if (prices.length === 0) {
      const p = stock?.currentPrice || 0;
      return {
        high: p,
        low: p,
        open: p,
        close: p,
        volume: 0,
        prints: 0,
        windowMove: 0
      };
    }

    const open = prices[0];
    const close = prices[prices.length - 1];

    return {
      high: Math.max(...prices),
      low: Math.min(...prices),
      open,
      close,
      volume: windowHistory.reduce((sum, h) => sum + (Number(h.volume) || 0), 0),
      prints: prices.length,
      windowMove: open ? ((close - open) / open) * 100 : 0
    };
  }, [windowHistory, stock?.currentPrice]);

  if (!isOpen || !stock) return null;

  const currentPrice = stock.currentPrice;
  const isPositive = (stock.percentChange || 0) >= 0;
  const accent = isPositive ? 'var(--gain-green)' : 'var(--loss-red)';

  const parsedQty = Math.max(0, parseInt(quantity, 10) || 0);
  const parsedTargetPrice = Math.max(0.01, parseFloat(targetPrice) || currentPrice);

  const ownedQty = userHolding?.quantity || 0;
  const availableQty =
    userHolding?.availableQuantity !== undefined
      ? userHolding.availableQuantity
      : ownedQty;
  const lockedQty = userHolding?.lockedQuantity || 0;

  const availWallet =
    balanceInfo.availableWalletBalance !== undefined
      ? balanceInfo.availableWalletBalance
      : userWallet || 0;

  const isLimit = tradeCategory === 'LIMIT';
  const isBuy = mode === 'BUY';
  const unitPrice = isLimit ? parsedTargetPrice : currentPrice;
  const orderTotal = Math.round(parsedQty * unitPrice * 100) / 100;

  // Max the trader could transact given cash / available shares
  const maxQty = isBuy
    ? Math.floor(availWallet / (unitPrice || 1))
    : availableQty;

  const stockPendingOrders = pendingOrders.filter((o) => o.stockId === stock.id);

  /* Validation — surfaced inline so the trader knows before submitting */
  let blockReason = '';
  if (isTradingLocked) {
    blockReason = session?.status === 'PAUSED' || session?.isPaused
      ? 'Market is on break — trading is temporarily paused by Admin.'
      : 'Market is closed — waiting for Admin to start the session.';
  } else if (parsedQty <= 0) {
    blockReason = 'Enter a quantity of at least 1 share.';
  } else if (isBuy && orderTotal > availWallet) {
    blockReason = `Needs ${fmtMoney(orderTotal - availWallet)} IC more than your available cash.`;
  } else if (!isBuy && parsedQty > availableQty) {
    blockReason =
      availableQty === 0
        ? `You have no ${stock.symbol} shares available to sell.`
        : `Only ${availableQty} ${stock.symbol} share${
            availableQty === 1 ? '' : 's'
          } available${lockedQty > 0 ? ` (${lockedQty} reserved in orders)` : ''}.`;
  } else if (isLimit && !(parsedTargetPrice > 0)) {
    blockReason = 'Enter a target price above zero.';
  }

  const canSubmit = !blockReason && !loadingTrade;

  /* How a resting order will behave relative to the live price */
  const limitHint = isBuy
    ? parsedTargetPrice >= currentPrice
      ? 'Target is at or above the live price — this fills immediately.'
      : `Waits for ${stock.symbol} to fall to ${fmtMoney(parsedTargetPrice)} IC.`
    : parsedTargetPrice <= currentPrice
    ? 'Target is at or below the live price — this fills immediately.'
    : `Waits for ${stock.symbol} to rise to ${fmtMoney(parsedTargetPrice)} IC.`;

  /* ---------------------------------------------------------------
     Actions
     --------------------------------------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError('');
    setNotice('');
    setLoadingTrade(true);

    try {
      if (!isLimit) {
        const endpoint = isBuy ? '/trade/buy' : '/trade/sell';
        const data = await apiFetch(endpoint, {
          method: 'POST',
          body: JSON.stringify({ stockId: stock.id, quantity: parsedQty })
        });

        onSuccess?.(
          `${isBuy ? 'Bought' : 'Sold'} ${parsedQty} shares of ${stock.symbol}`,
          data.portfolio
        );
        fetchOrders();
        onClose();
      } else {
        const data = await apiFetch('/orders', {
          method: 'POST',
          body: JSON.stringify({
            stockId: stock.id,
            type: mode,
            targetPrice: parsedTargetPrice,
            quantity: parsedQty
          })
        });

        // Limit orders stay open, so keep the window up and refresh the book
        setNotice(data.message || 'Limit order placed.');
        setQuantity('1');
        await fetchOrders();
        onSuccess?.(data.message || 'Limit order placed.');
      }
    } catch (err) {
      setError(err.message || 'Order failed');
    } finally {
      setLoadingTrade(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    setCancellingOrderId(orderId);
    setError('');
    try {
      const data = await apiFetch(`/orders/${orderId}`, { method: 'DELETE' });
      setNotice(data.message || 'Order cancelled.');
      await fetchOrders();
      onSuccess?.(data.message || 'Order cancelled.');
    } catch (err) {
      setError(err.message || 'Failed to cancel order');
    } finally {
      setCancellingOrderId(null);
    }
  };

  /* ---------------------------------------------------------------
     Render
     --------------------------------------------------------------- */
  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
      style={{ backgroundColor: 'var(--scrim)', backdropFilter: 'blur(4px)' }}
      onClick={() => !loadingTrade && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trade-window-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl max-h-[92vh] surface flex flex-col overflow-hidden animate-pop-in"
        style={{ boxShadow: 'var(--card-shadow)' }}
      >
        {/* ================= HEADER ================= */}
        <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b theme-border">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-mono font-extrabold flex-shrink-0"
              style={{
                backgroundColor: `color-mix(in srgb, ${accent} 16%, transparent)`,
                color: accent
              }}
            >
              {stock.symbol?.slice(0, 2)}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  id="trade-window-title"
                  className="text-lg font-heading font-extrabold theme-text-main leading-none"
                >
                  {stock.symbol}
                </h2>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider surface-panel theme-text-muted">
                  {stock.sector}
                </span>
              </div>
              <p className="text-[10.5px] theme-text-dim truncate mt-0.5">
                {stock.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[9px] font-mono uppercase tracking-widest theme-text-dim">
                Spot price
              </div>
              {/* Spot price stays neutral — the % badge beside it carries
                  the direction colour. */}
              <div className="text-xl font-mono font-extrabold leading-none mt-0.5 theme-text-main">
                {fmtMoney(currentPrice)} <span className="text-[11px]">IC</span>
              </div>
            </div>

            <span
              className="flex items-center gap-1 px-1.5 py-1 rounded text-[11px] font-mono font-extrabold flex-shrink-0"
              style={{
                color: accent,
                backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`
              }}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {isPositive ? '+' : ''}
              {(stock.percentChange || 0).toFixed(2)}%
            </span>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close trade window"
              className="w-8 h-8 rounded-md border theme-border theme-bg-input flex items-center justify-center theme-text-muted hover:theme-text-main transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= BODY ================= */}
        <div className="overflow-y-auto p-4 sm:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-4">
            {/* ---------------- CHART ---------------- */}
            <div className="space-y-3">
              <div className="surface-panel p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3 text-[10px] font-mono">
                    <span className="flex items-center gap-1.5 theme-text-main font-bold">
                      {/* Matches the plotted line, which is coloured by the
                          window move rather than the whole-day change. */}
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            stats.windowMove >= 0
                              ? 'var(--gain-green)'
                              : 'var(--loss-red)'
                        }}
                      />
                      Spot Price
                    </span>
                  </div>

                  <div
                    className="inline-flex items-center gap-0.5 p-0.5 rounded-md border theme-border"
                    style={{ backgroundColor: 'var(--bg-input)' }}
                    role="group"
                    aria-label="Chart timeframe"
                  >
                    {TIMEFRAMES.map((tf) => {
                      const active = tf.key === timeframe;
                      return (
                        <button
                          key={tf.key}
                          type="button"
                          onClick={() => setTimeframe(tf.key)}
                          aria-pressed={active}
                          className="px-2 h-[22px] rounded text-[10px] font-mono font-bold transition-colors"
                          style={
                            active
                              ? {
                                  backgroundColor:
                                    'color-mix(in srgb, var(--accent) 20%, transparent)',
                                  color: 'var(--accent)'
                                }
                              : { color: 'var(--text-dim)' }
                          }
                        >
                          {tf.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono mb-1">
                  <span className="theme-text-dim">
                    Price{' '}
                    <strong className="theme-text-main">{fmtMoney(stats.close)}</strong>
                  </span>
                  <span className="theme-text-dim">
                    High{' '}
                    <strong style={{ color: 'var(--gain-green)' }}>
                      {fmtMoney(stats.high)}
                    </strong>
                  </span>
                  <span className="theme-text-dim">
                    Low{' '}
                    <strong style={{ color: 'var(--loss-red)' }}>
                      {fmtMoney(stats.low)}
                    </strong>
                  </span>
                </div>

                {loadingHistory && windowHistory.length === 0 ? (
                  <div className="h-[300px] rounded-lg animate-shimmer" />
                ) : (
                  <PriceChart
                    history={windowHistory}
                    currentPrice={currentPrice}
                    height={300}
                    showFooter={false}
                    spanLabel={timeframe}
                  />
                )}

                <div className="flex items-center justify-between mt-2 text-[10px] font-mono">
                  <span className="theme-text-dim">
                    {stats.prints.toLocaleString()} prints in view
                  </span>
                  <span className="theme-text-dim">
                    Window move{' '}
                    <strong
                      style={{
                        color:
                          stats.windowMove >= 0
                            ? 'var(--gain-green)'
                            : 'var(--loss-red)'
                      }}
                    >
                      {stats.windowMove >= 0 ? '+' : ''}
                      {stats.windowMove.toFixed(2)}%
                    </strong>
                  </span>
                </div>
              </div>

              {/* Stat tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  {
                    label: `${timeframe} high`,
                    value: `${fmtMoney(stats.high)} IC`,
                    color: 'var(--gain-green)',
                    Icon: TrendingUp
                  },
                  {
                    label: `${timeframe} low`,
                    value: `${fmtMoney(stats.low)} IC`,
                    color: 'var(--loss-red)',
                    Icon: TrendingDown
                  },
                  {
                    label: `${timeframe} volume`,
                    value: `${fmtCompact(stats.volume)} shrs`,
                    color: 'var(--text-main)',
                    Icon: BarChart2
                  }
                ].map(({ label, value, color, Icon }) => (
                  <div key={label} className="surface-panel px-2.5 py-2">
                    <div className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest theme-text-dim">
                      <Icon className="w-2.5 h-2.5" style={{ color }} />
                      {label}
                    </div>
                    <div
                      className="text-[12px] font-mono font-bold mt-1"
                      style={{ color }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ---------------- TRADE PANEL ---------------- */}
            <div className="space-y-3">
              {/* Instant vs Limit */}
              <div
                className="grid grid-cols-2 gap-0.5 p-0.5 rounded-md border theme-border"
                style={{ backgroundColor: 'var(--bg-input)' }}
                role="group"
                aria-label="Order type"
              >
                {[
                  { key: 'INSTANT', label: 'Instant Trade', Icon: Zap },
                  { key: 'LIMIT', label: 'Limit Order', Icon: Clock }
                ].map(({ key, label, Icon }) => {
                  const active = tradeCategory === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setTradeCategory(key);
                        setError('');
                        setNotice('');
                        if (key === 'LIMIT' && !targetPrice) {
                          setTargetPrice(currentPrice.toFixed(2));
                        }
                      }}
                      aria-pressed={active}
                      className="flex items-center justify-center gap-1.5 h-[32px] rounded text-[11px] font-heading font-bold transition-colors"
                      style={
                        active
                          ? {
                              backgroundColor: 'var(--accent)',
                              color: '#0B0E14'
                            }
                          : { color: 'var(--text-muted)' }
                      }
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] theme-text-dim font-mono leading-snug">
                {isLimit
                  ? 'Pre-books an order that fills automatically when your target price prints. Cash or shares stay reserved until then.'
                  : 'Fills right now at the live market price.'}
              </p>

              {/* Buy vs Sell */}
              <div
                className="grid grid-cols-2 gap-0.5 p-0.5 rounded-md border theme-border"
                style={{ backgroundColor: 'var(--bg-input)' }}
                role="group"
                aria-label="Order side"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMode('BUY');
                    setError('');
                  }}
                  aria-pressed={isBuy}
                  className="flex items-center justify-center gap-1.5 h-[36px] rounded text-[11.5px] font-heading font-extrabold transition-colors"
                  style={
                    isBuy
                      ? { backgroundColor: 'var(--gain-green)', color: '#fff' }
                      : { color: 'var(--text-muted)' }
                  }
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  BUY SHARES
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('SELL');
                    setError('');
                  }}
                  aria-pressed={!isBuy}
                  className="flex items-center justify-center gap-1.5 h-[36px] rounded text-[11.5px] font-heading font-extrabold transition-colors"
                  style={
                    !isBuy
                      ? { backgroundColor: 'var(--loss-red)', color: '#fff' }
                      : { color: 'var(--text-muted)' }
                  }
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  SELL SHARES
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Target price (limit only) */}
                {isLimit && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="target-price"
                        className="text-[10px] font-mono uppercase tracking-widest"
                        style={{ color: 'var(--accent)' }}
                      >
                        Target price
                      </label>
                      <button
                        type="button"
                        onClick={() => setTargetPrice(currentPrice.toFixed(2))}
                        className="text-[10px] font-mono theme-text-dim hover:theme-text-main transition-colors"
                      >
                        Use spot {fmtMoney(currentPrice)}
                      </button>
                    </div>
                    <input
                      id="target-price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      className="w-full h-[36px] rounded-md border theme-bg-input px-3 text-[13px] font-mono font-bold theme-text-main focus:outline-none"
                      style={{
                        borderColor:
                          'color-mix(in srgb, var(--accent) 45%, transparent)'
                      }}
                    />
                    <p className="text-[10px] font-mono theme-text-dim leading-snug">
                      {limitHint}
                    </p>
                  </div>
                )}

                {/* Quantity */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="order-qty"
                      className="text-[10px] font-mono uppercase tracking-widest theme-text-dim"
                    >
                      Quantity (shares)
                    </label>
                    <div className="flex items-center gap-1">
                      {QUANTITY_PRESETS.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setQuantity(String(n))}
                          className="px-1.5 h-[20px] rounded border theme-border text-[9.5px] font-mono theme-text-muted hover:theme-text-main transition-colors"
                        >
                          {n}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setQuantity(String(Math.max(0, maxQty)))}
                        title={
                          isBuy
                            ? 'Largest quantity your cash covers'
                            : 'All available shares'
                        }
                        className="px-1.5 h-[20px] rounded text-[9.5px] font-mono font-bold transition-colors"
                        style={{
                          backgroundColor:
                            'color-mix(in srgb, var(--accent) 16%, transparent)',
                          color: 'var(--accent)'
                        }}
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((q) => String(Math.max(1, (parseInt(q, 10) || 1) - 1)))
                      }
                      aria-label="Decrease quantity"
                      className="w-9 h-[36px] rounded-md border theme-border theme-bg-input theme-text-main font-bold hover:theme-bg-card-hover transition-colors"
                    >
                      −
                    </button>
                    <input
                      id="order-qty"
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="flex-1 h-[36px] rounded-md border theme-border theme-bg-input px-3 text-center text-[13px] font-mono font-bold theme-text-main focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((q) => String((parseInt(q, 10) || 0) + 1))
                      }
                      aria-label="Increase quantity"
                      className="w-9 h-[36px] rounded-md border theme-border theme-bg-input theme-text-main font-bold hover:theme-bg-card-hover transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Totals */}
                <div className="surface-panel p-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[9px] font-mono uppercase tracking-widest theme-text-dim">
                        {isBuy
                          ? isLimit
                            ? 'Cash reserved'
                            : 'Total cost'
                          : isLimit
                          ? 'Expected proceeds'
                          : 'Total proceeds'}
                      </div>
                      {/* Label states the direction; the figure stays positive
                          and takes the colour of the side you're trading, so a
                          buy total matches the green BUY SHARES button. */}
                      <div
                        className="text-[15px] font-mono font-extrabold mt-0.5"
                        style={{ color: isBuy ? 'var(--gain-green)' : 'var(--loss-red)' }}
                      >
                        {fmtMoney(orderTotal)} IC
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[9px] font-mono uppercase tracking-widest theme-text-dim">
                        {isBuy ? 'Available cash' : 'Available shares'}
                      </div>
                      <div className="text-[12px] font-mono font-bold theme-text-main mt-0.5">
                        {isBuy
                          ? `${fmtMoney(availWallet)} IC`
                          : `${availableQty} share${availableQty === 1 ? '' : 's'}`}
                      </div>
                      {(isBuy ? balanceInfo.lockedFunds > 0 : lockedQty > 0) && (
                        <div
                          className="text-[9px] font-mono mt-0.5"
                          style={{ color: 'var(--accent)' }}
                        >
                          {isBuy
                            ? `${fmtMoney(balanceInfo.lockedFunds)} IC reserved`
                            : `${lockedQty} reserved`}
                        </div>
                      )}
                    </div>
                  </div>

                  {ownedQty > 0 && (
                    <div className="pt-2 border-t theme-border flex justify-between text-[10px] font-mono">
                      <span className="theme-text-dim">Your position</span>
                      <span className="theme-text-main font-bold">
                        {ownedQty} @ avg {fmtMoney(userHolding?.avgBuyPrice || 0)} IC
                      </span>
                    </div>
                  )}
                </div>

                {/* Messages */}
                {notice && (
                  <div
                    className="flex items-start gap-2 p-2.5 rounded-md text-[10.5px] font-mono leading-snug"
                    style={{
                      backgroundColor:
                        'color-mix(in srgb, var(--gain-green) 12%, transparent)',
                      border:
                        '1px solid color-mix(in srgb, var(--gain-green) 34%, transparent)',
                      color: 'var(--gain-green)'
                    }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
                    <span>{notice}</span>
                  </div>
                )}

                {error && (
                  <div
                    className="flex items-start gap-2 p-2.5 rounded-md text-[10.5px] font-mono leading-snug animate-error-shake"
                    style={{
                      backgroundColor:
                        'color-mix(in srgb, var(--loss-red) 12%, transparent)',
                      border:
                        '1px solid color-mix(in srgb, var(--loss-red) 34%, transparent)',
                      color: 'var(--loss-red)'
                    }}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
                    <span>{error}</span>
                  </div>
                )}

                {blockReason && !error && (
                  <div className="flex items-start gap-2 p-2.5 rounded-md text-[10.5px] font-mono leading-snug surface-panel theme-text-muted">
                    {isTradingLocked ? (
                      <Ban className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
                    )}
                    <span>{blockReason}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full h-[42px] rounded-md text-[11.5px] font-heading font-extrabold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: isLimit
                      ? 'var(--accent)'
                      : isBuy
                      ? 'var(--gain-green)'
                      : 'var(--loss-red)',
                    color: isLimit ? '#0B0E14' : '#fff'
                  }}
                >
                  {loadingTrade ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processing…
                    </>
                  ) : isLimit ? (
                    <>
                      <Clock className="w-4 h-4" />
                      PRE-BOOK {mode} ({parsedQty} @ {fmtMoney(parsedTargetPrice)} IC)
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      EXECUTE {mode} ORDER ({parsedQty} @ {fmtMoney(currentPrice)} IC)
                    </>
                  )}
                </button>
              </form>

              {/* Resting orders for this stock */}
              <div className="surface-panel p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-mono uppercase tracking-widest font-bold flex items-center gap-1.5"
                    style={{ color: 'var(--accent)' }}
                  >
                    <Clock className="w-3 h-3" />
                    Open orders · {stock.symbol}
                  </span>
                  <span className="text-[10px] font-mono theme-text-dim">
                    {stockPendingOrders.length}
                  </span>
                </div>

                {stockPendingOrders.length === 0 ? (
                  <p className="text-[10px] font-mono theme-text-dim py-1.5">
                    No resting orders on this stock.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {stockPendingOrders.map((order) => {
                      const orderColor =
                        order.type === 'BUY'
                          ? 'var(--gain-green)'
                          : 'var(--loss-red)';
                      const distance = currentPrice
                        ? ((order.targetPrice - currentPrice) / currentPrice) * 100
                        : 0;

                      return (
                        <div
                          key={order.id}
                          className="flex items-center justify-between gap-2 px-2.5 py-2 rounded border theme-border theme-bg-input"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-extrabold uppercase"
                                style={{
                                  backgroundColor: `color-mix(in srgb, ${orderColor} 16%, transparent)`,
                                  color: orderColor
                                }}
                              >
                                Limit {order.type}
                              </span>
                              <span className="text-[10.5px] font-mono font-bold theme-text-main">
                                {order.quantity} @ {fmtMoney(order.targetPrice)}
                              </span>
                            </div>
                            <div className="text-[9px] font-mono theme-text-dim mt-0.5">
                              {distance >= 0 ? '+' : ''}
                              {distance.toFixed(2)}% from spot
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancellingOrderId === order.id}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[9.5px] font-heading font-bold transition-colors disabled:opacity-50 flex-shrink-0"
                            style={{
                              backgroundColor:
                                'color-mix(in srgb, var(--loss-red) 12%, transparent)',
                              color: 'var(--loss-red)'
                            }}
                          >
                            <Ban className="w-2.5 h-2.5" />
                            {cancellingOrderId === order.id ? '…' : 'Cancel'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
