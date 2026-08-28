import React, { memo, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Check, Zap } from 'lucide-react';
import { StockSparkline } from './StockSparkline';

const fmtMoney = (n, d = 2) =>
  Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d
  });

/* ------------------------------------------------------------------
   Animated backdrop — drifting aura, tape streaks, edge pulse
   ------------------------------------------------------------------ */
const CardBackdrop = memo(({ accent, intensity, streakCount = 4 }) => (
  <span
    className="floor-card-bg"
    aria-hidden="true"
    style={{ '--card-accent': accent, '--card-intensity': intensity }}
  >
    <span className="card-pulse-bar" />
    <span className="card-aura" />
    <span className="card-streaks">
      {Array.from({ length: streakCount }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${12 + i * (76 / Math.max(1, streakCount - 1))}%`,
            animationDelay: `${(i * 1.35) % 6}s`,
            animationDuration: `${5.2 + (i % 3) * 1.1}s`
          }}
        />
      ))}
    </span>
  </span>
));

/* ------------------------------------------------------------------
   Floor card
   ------------------------------------------------------------------ */
export const FloorCard = memo(function FloorCard({
  stock,
  holding,
  index = 0,
  flash,
  variant = 'grid', // 'grid' | 'compact'
  isActive = false,
  isTradingLocked = false,
  onSelect,
  onTrade,
  onQuickTrade,
  onNormalTrade
}) {
  const percentChange = Number(stock?.percentChange) || 0;
  const isUp = percentChange >= 0;
  const owned = holding?.quantity || 0;
  const availableToSell =
    holding?.availableQuantity !== undefined ? holding.availableQuantity : owned;

  const [cardFlash, setCardFlash] = useState(null); // 'success' | 'error' | null

  const flashClass =
    cardFlash === 'success'
      ? 'ring-2 ring-emerald-500 animate-pulse'
      : cardFlash === 'error'
      ? 'ring-2 ring-rose-500 animate-error-shake'
      : flash === 'up'
      ? 'animate-tick-up'
      : flash === 'down'
      ? 'animate-tick-down'
      : '';
  const priceClass =
    flash === 'up' ? 'animate-price-up' : flash === 'down' ? 'animate-price-down' : '';

  const accent = isUp ? 'var(--gain-green)' : 'var(--loss-red)';
  const intensity = Math.min(1, Math.abs(percentChange) / 40).toFixed(3);

  const history = stock?.priceHistories || [];

  const { dayLow, dayHigh } = useMemo(() => {
    const prices = history.map((h) => Number(h?.price)).filter(isFinite);
    if (!prices.length) {
      const p = stock?.currentPrice || 0;
      return { dayLow: p, dayHigh: p };
    }
    return { dayLow: Math.min(...prices), dayHigh: Math.max(...prices) };
  }, [history, stock?.currentPrice]);

  const [cardQty, setCardQty] = useState('1');

  const handleQuickTrade = async (e, side) => {
    e.stopPropagation();
    const parsed = Math.max(1, parseInt(cardQty, 10) || 1);
    if (onQuickTrade) {
      const res = await onQuickTrade(side, parsed, stock);
      if (res?.ok) {
        setCardFlash('success');
        setTimeout(() => setCardFlash(null), 1200);
      } else {
        setCardFlash('error');
        setTimeout(() => setCardFlash(null), 1200);
      }
    } else {
      onTrade?.(stock, side, parsed);
    }
  };

  const handleNormalTrade = (e, side = 'BUY') => {
    e.stopPropagation();
    const parsed = Math.max(1, parseInt(cardQty, 10) || 1);
    if (onNormalTrade) {
      onNormalTrade(stock, side, parsed);
    } else {
      onSelect?.(stock);
    }
  };

  const canSell = availableToSell > 0 && !isTradingLocked;

  /* ---------------- Compact variant ---------------- */
  if (variant === 'compact') {
    return (
      <div
        style={{
          animationDelay: `${Math.min(index * 28, 420)}ms`,
          ...(isActive
            ? { borderColor: 'color-mix(in srgb, var(--accent) 55%, transparent)' }
            : null)
        }}
        className={`floor-card animate-card-rise surface p-2.5 flex flex-col justify-between ${
          isUp ? 'is-up' : 'is-down'
        } ${flashClass}`}
      >
        <CardBackdrop accent={accent} intensity={intensity} streakCount={3} />
        <span className="card-sheen" />

        <button
          type="button"
          className="card-open flex-1 flex flex-col justify-between"
          onClick={() => onSelect?.(stock)}
          aria-label={`Open ${stock.symbol} chart, ${fmtMoney(stock.currentPrice)} IC, ${
            isUp ? 'up' : 'down'
          } ${Math.abs(percentChange).toFixed(2)} percent`}
        >
          <span className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold theme-text-muted truncate">
              {stock.symbol}
            </span>
            {owned > 0 && (
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: 'var(--accent)' }}
                title={`${owned} owned`}
              />
            )}
          </span>

          <span
            className={`block text-sm font-mono font-extrabold theme-text-main my-1 ${priceClass}`}
          >
            {fmtMoney(stock.currentPrice, stock.currentPrice >= 1000 ? 1 : 2)}
          </span>

          <span
            className="block text-[9px] font-mono font-bold px-1 py-0.5 rounded text-center"
            style={{
              color: accent,
              backgroundColor: `color-mix(in srgb, ${accent} 13%, transparent)`
            }}
          >
            {isUp ? '+' : ''}
            {percentChange.toFixed(2)}%
          </span>
        </button>

        <div className="flex items-center gap-1 mt-2">
          <button
            type="button"
            onClick={(e) => handleQuickTrade(e, 'BUY')}
            disabled={isTradingLocked}
            title={isTradingLocked ? 'Trading locked' : `Buy ${stock.symbol}`}
            className="card-action card-action-buy"
            style={{ height: '22px', fontSize: '9.5px' }}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={(e) => handleQuickTrade(e, 'SELL')}
            disabled={!canSell}
            title={
              isTradingLocked
                ? 'Trading locked'
                : availableToSell === 0
                ? `No ${stock.symbol} shares to sell`
                : `Sell ${stock.symbol}`
            }
            className="card-action card-action-sell"
            style={{ height: '22px', fontSize: '9.5px' }}
          >
            Sell
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- Full grid variant ---------------- */
  return (
    <div
      style={{
        animationDelay: `${Math.min(index * 40, 520)}ms`,
        ...(isActive
          ? { borderColor: 'color-mix(in srgb, var(--accent) 55%, transparent)' }
          : null)
      }}
      className={`floor-card animate-card-rise surface p-4 flex flex-col justify-between ${
        isUp ? 'is-up' : 'is-down'
      } ${flashClass}`}
    >
      <CardBackdrop accent={accent} intensity={intensity} />
      <span className="card-sheen" />

      <button
        type="button"
        className="card-open flex-1 flex flex-col justify-between"
        onClick={() => onSelect?.(stock)}
        aria-label={`Open ${stock.symbol} ${stock.name} chart, ${fmtMoney(
          stock.currentPrice
        )} IC, ${isUp ? 'up' : 'down'} ${Math.abs(percentChange).toFixed(2)} percent`}
      >
        {/* Top strip: ticker badge + name + owned pill */}
        <span className="flex items-start justify-between gap-2">
          <span className="flex items-center gap-2 min-w-0">
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-mono font-extrabold flex-shrink-0 shadow-sm"
              style={{
                backgroundColor: `color-mix(in srgb, ${accent} 18%, transparent)`,
                color: accent
              }}
            >
              {stock.symbol?.slice(0, 2)}
            </span>
            <span className="min-w-0 block">
              <span className="block text-[17px] font-medium theme-text-main leading-tight">
                {stock.name || stock.symbol}
              </span>
              <span className="block text-[12px] font-normal theme-text-dim leading-tight mt-0.5">
                {stock.symbol}
              </span>
            </span>
          </span>

          {owned > 0 && (
            <span
              className="px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 flex-shrink-0"
              style={{
                backgroundColor:
                  'color-mix(in srgb, var(--accent) 15%, transparent)',
                color: 'var(--accent)'
              }}
            >
              <Check className="w-3.5 h-3.5" />
              {owned}
            </span>
          )}
        </span>

        {/* Price + % Change Badge */}
        <span className="flex items-baseline justify-between gap-2 my-2.5">
          <span
            className={`text-[26px] font-mono font-semibold theme-text-main leading-none whitespace-nowrap ${priceClass}`}
          >
            {fmtMoney(stock.currentPrice)} IC
          </span>
          <span
            className="flex items-center gap-1 px-2 py-1 rounded text-[13px] font-mono font-medium"
            style={{
              color: accent,
              backgroundColor: `color-mix(in srgb, ${accent} 15%, transparent)`
            }}
          >
            {isUp ? (
              <>
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Up {Math.abs(percentChange).toFixed(2)}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Down {Math.abs(percentChange).toFixed(2)}%</span>
              </>
            )}
          </span>
        </span>

        {/* Live 48px Sparkline + 15M High/Low/Range Stats */}
        <StockSparkline stockId={stock.id} currentPrice={stock.currentPrice} index={index} />

        {/* Footer stats: Sector & Day Range */}
        <span className="flex items-center justify-between pt-2.5 border-t theme-border text-[12px] font-mono theme-text-dim">
          <span className="uppercase tracking-wide font-normal theme-text-dim whitespace-nowrap">
            {stock.sector}
          </span>
          <span>
            Range {fmtMoney(dayLow, dayLow >= 1000 ? 0 : 2)}–
            {fmtMoney(dayHigh, dayHigh >= 1000 ? 0 : 2)}
          </span>
        </span>
      </button>

      {/* Mode 1 & Mode 2 Trade Actions */}
      <div className="space-y-2 mt-3 pt-2.5 border-t theme-border font-mono" onClick={(e) => e.stopPropagation()}>
        {/* Mode 1: Quick Buy & Quick Sell (Instant Execution) */}
        <div className="flex items-center gap-1.5">
          {/* Stepper controls */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCardQty((prev) => String(Math.max(1, (parseInt(prev, 10) || 1) - 1)));
              }}
              className="w-[30px] h-[40px] rounded-lg border theme-border theme-bg-card hover:theme-bg-card-hover font-black text-sm theme-text-main flex items-center justify-center transition-all active:scale-95 shadow-sm"
              title="Decrease quantity by 1"
            >
              −
            </button>

            <input
              type="number"
              min="1"
              step="1"
              value={cardQty}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setCardQty(e.target.value)}
              title="Quantity to trade"
              className="w-[44px] h-[40px] rounded-lg border theme-border theme-bg-input px-0.5 text-center text-xs font-bold theme-text-main focus:outline-none focus:border-[var(--accent)]"
            />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCardQty((prev) => String((parseInt(prev, 10) || 1) + 1));
              }}
              className="w-[30px] h-[40px] rounded-lg border theme-border theme-bg-card hover:theme-bg-card-hover font-black text-sm theme-text-main flex items-center justify-center transition-all active:scale-95 shadow-sm"
              title="Increase quantity by 1"
            >
              +
            </button>
          </div>

          {/* Quick Buy & Quick Sell Instant Buttons */}
          <button
            type="button"
            onClick={(e) => handleQuickTrade(e, 'BUY')}
            disabled={isTradingLocked}
            title={isTradingLocked ? 'Trading locked' : `Instant Quick Buy ${cardQty} ${stock.symbol}`}
            className="card-action card-action-buy text-[13px] font-semibold min-h-[40px] px-2 flex-1 flex items-center justify-center gap-1 shadow-md uppercase tracking-wider"
          >
            <span>BUY ⚡</span>
          </button>

          <button
            type="button"
            onClick={(e) => handleQuickTrade(e, 'SELL')}
            disabled={!canSell}
            title={
              isTradingLocked
                ? 'Trading locked'
                : availableToSell === 0
                ? `No ${stock.symbol} shares to sell`
                : `Instant Quick Sell ${availableToSell} available`
            }
            className="card-action card-action-sell text-[13px] font-semibold min-h-[40px] px-2 flex-1 flex items-center justify-center gap-1 shadow-md uppercase tracking-wider"
          >
            <span>SELL</span>
          </button>
        </div>

        {/* Mode 2: Normal Buy / Normal Sell (Review Panel & Limit Order Mode) */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={(e) => handleNormalTrade(e, 'BUY')}
            className="flex-1 py-1.5 px-2 rounded-lg border theme-border theme-bg-card hover:theme-bg-card-hover text-[13px] font-normal theme-text-main flex items-center justify-center gap-1 transition-all active:scale-95 min-h-[36px]"
            title="Open review panel to inspect cost or place target limit order"
          >
            <span>Normal Buy</span>
          </button>

          <button
            type="button"
            onClick={(e) => handleNormalTrade(e, 'SELL')}
            className="flex-1 py-1.5 px-2 rounded-lg border theme-border theme-bg-card hover:theme-bg-card-hover text-[13px] font-normal theme-text-main flex items-center justify-center gap-1 transition-all active:scale-95 min-h-[36px]"
            title="Open review panel to sell shares or set sell limit order"
          >
            <span>Normal Sell</span>
          </button>
        </div>
      </div>
    </div>
  );
});
