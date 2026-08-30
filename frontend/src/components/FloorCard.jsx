import React, { memo, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Check, Zap } from 'lucide-react';
import { StockSparkline } from './StockSparkline';
import { useTheme } from '../context/ThemeContext';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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

  const parsedCardQty = Math.max(1, parseInt(cardQty, 10) || 1);
  const canQuickSell = availableToSell > 0 && !isTradingLocked && availableToSell >= parsedCardQty;
  const avgBuyPrice = holding?.avgBuyPrice || 0;
  const isProfitableSell = holding && owned > 0 && avgBuyPrice > 0 && stock?.currentPrice > avgBuyPrice;
  const isLossSell = holding && owned > 0 && avgBuyPrice > 0 && stock?.currentPrice < avgBuyPrice;
  const priceDiffPerShare = avgBuyPrice > 0 ? (stock?.currentPrice || 0) - avgBuyPrice : 0;

  /* ---------------- Compact variant ---------------- */
  if (variant === 'compact') {
    return (
      <div
        className={`floor-card animate-card-rise p-3 rounded-xl border border-l-2 ${
          isUp ? 'border-l-[#22C55E]' : 'border-l-[#EF4444]'
        } flex items-center justify-between gap-3 ${
          isUp ? 'is-up' : 'is-down'
        } ${flashClass}`}
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #1A1D27 0%, #141720 100%)'
            : '#FFFFFF',
          boxShadow: isDark
            ? undefined
            : '0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)'
        }}
      >
        <CardBackdrop accent={accent} intensity={intensity} streakCount={2} />

        <button
          type="button"
          onClick={() => onSelect?.(stock)}
          className="flex-1 flex items-center justify-between min-w-0 text-left cursor-pointer"
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-[36px] h-[36px] rounded-lg flex items-center justify-center text-[12px] font-mono font-extrabold flex-shrink-0 shadow-sm border"
              style={{
                borderColor: isUp ? '#22C55E' : '#EF4444',
                backgroundColor: `color-mix(in srgb, ${accent} 15%, transparent)`,
                color: accent
              }}
            >
              {stock.symbol?.slice(0, 2)}
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-bold theme-text-main truncate">
                {stock.name || stock.symbol}
              </span>
              <span className="block text-[11px] font-mono text-[#6B7280] dark:text-[#7B82A0]">
                {stock.symbol}
              </span>
            </span>
          </span>

          <span className="text-right flex-shrink-0 ml-2">
            <span className={`block text-[16px] font-bold font-mono ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              {fmtMoney(stock.currentPrice)} IC
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                isUp
                  ? isDark
                    ? 'bg-[#14532D] text-[#4ADE80]'
                    : 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'
                  : isDark
                  ? 'bg-[#7F1D1D] text-[#F87171]'
                  : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
              }`}
            >
              <span>{isUp ? '▲' : '▼'} {Math.abs(percentChange).toFixed(2)}%</span>
            </span>
          </span>
        </button>

        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => handleQuickTrade(e, 'BUY')}
            disabled={isTradingLocked}
            className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow uppercase"
          >
            Buy
          </button>
          <button
            type="button"
            onClick={(e) => handleQuickTrade(e, 'SELL')}
            disabled={!canQuickSell}
            className={`text-xs font-bold px-2.5 py-1.5 rounded-lg uppercase transition-all ${
              !canQuickSell
                ? 'bg-slate-700/60 dark:bg-[#1E2333] text-slate-400 dark:text-[#64748B] border border-slate-700/40 cursor-not-allowed opacity-50 shadow-none'
                : isProfitableSell
                ? 'bg-[#16A34A] hover:bg-[#15803D] text-white shadow-sm'
                : 'bg-[#B91C1C] hover:bg-[#991B1B] text-white shadow-sm'
            }`}
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
        background: isDark
          ? 'linear-gradient(135deg, #1A1D27 0%, #141720 100%)'
          : '#FFFFFF',
        boxShadow: isDark
          ? undefined
          : '0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)'
      }}
      className={`floor-card animate-card-rise p-3.5 flex flex-col justify-between rounded-xl border border-l-2 ${
        isUp ? 'border-l-[#22C55E]' : 'border-l-[#EF4444]'
      } ${isUp ? 'is-up' : 'is-down'} ${flashClass}`}
    >
      <CardBackdrop accent={accent} intensity={intensity} />
      <span className="card-sheen" />

      <button
        type="button"
        className="card-open flex-1 flex flex-col justify-between text-left"
        onClick={() => onSelect?.(stock)}
        aria-label={`Open ${stock.symbol} ${stock.name} chart, ${fmtMoney(
          stock.currentPrice
        )} IC, ${isUp ? 'up' : 'down'} ${Math.abs(percentChange).toFixed(2)} percent`}
      >
        {/* Top strip: 36px ticker badge + 16px name + owned pill */}
        <span className="flex items-start justify-between gap-2">
          <span className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-[36px] h-[36px] rounded-lg flex items-center justify-center text-[12px] font-mono font-extrabold flex-shrink-0 shadow-sm border"
              style={{
                borderColor: isUp ? '#22C55E' : '#EF4444',
                backgroundColor: `color-mix(in srgb, ${accent} 15%, transparent)`,
                color: accent
              }}
            >
              {stock.symbol?.slice(0, 2)}
            </span>
            <span className="min-w-0 block">
              <span className="block text-[16px] font-semibold theme-text-main leading-tight truncate">
                {stock.name || stock.symbol}
              </span>
              <span className="block text-[11px] font-mono text-[#6B7280] dark:text-[#7B82A0] leading-tight mt-0.5">
                {stock.symbol}
              </span>
            </span>
          </span>

          {owned > 0 && (
            <span
              className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold flex items-center gap-1 flex-shrink-0"
              style={{
                backgroundColor: isProfitableSell
                  ? 'rgba(34, 197, 94, 0.15)'
                  : isLossSell
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'color-mix(in srgb, var(--accent) 15%, transparent)',
                color: isProfitableSell
                  ? '#22C55E'
                  : isLossSell
                  ? '#EF4444'
                  : 'var(--accent)'
              }}
            >
              <Check className="w-3 h-3" />
              {owned}
            </span>
          )}
        </span>

        {/* 30px Price + % Change Badge */}
        <span className="flex items-baseline justify-between gap-2 my-2.5">
          <span className="flex items-baseline">
            <span
              className={`text-[30px] font-bold font-mono leading-none whitespace-nowrap ${
                isDark ? 'text-white' : 'text-[#0F172A]'
              }`}
            >
              {fmtMoney(stock.currentPrice)}
            </span>
            <span className="text-[16px] font-mono text-[#7B82A0] dark:text-[#7B82A0] font-normal ml-1">
              IC
            </span>
          </span>

          <span
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-mono font-semibold ${
              isUp
                ? isDark
                  ? 'bg-[#14532D] text-[#4ADE80]'
                  : 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'
                : isDark
                ? 'bg-[#7F1D1D] text-[#F87171]'
                : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
            }`}
          >
            <span>{isUp ? '▲' : '▼'} {Math.abs(percentChange).toFixed(2)}%</span>
          </span>
        </span>

        {/* Live 36px Sparkline + 15M High/Low/Range Stats */}
        <StockSparkline stockId={stock.id} currentPrice={stock.currentPrice} index={index} />

        {/* Footer stats: Sector */}
        <span className="flex items-center justify-between pt-2 border-t theme-border text-[10.5px] font-mono text-[#6B7280] dark:text-[#7B82A0]">
          <span className="uppercase tracking-wide font-normal whitespace-nowrap">
            {stock.sector}
          </span>
        </span>
      </button>

      {/* Mode 1 & Mode 2 Trade Actions */}
      <div className="space-y-1.5 mt-2.5 pt-2 border-t theme-border font-mono" onClick={(e) => e.stopPropagation()}>
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
              className="w-[26px] h-[34px] rounded-lg border theme-border theme-bg-card hover:theme-bg-card-hover font-black text-xs theme-text-main flex items-center justify-center transition-all active:scale-95 shadow-sm"
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
              className="w-[36px] h-[34px] rounded-lg border theme-border theme-bg-input px-0.5 text-center text-xs font-bold theme-text-main focus:outline-none focus:border-[var(--accent)]"
            />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCardQty((prev) => String((parseInt(prev, 10) || 1) + 1));
              }}
              className="w-[26px] h-[34px] rounded-lg border theme-border theme-bg-card hover:theme-bg-card-hover font-black text-xs theme-text-main flex items-center justify-center transition-all active:scale-95 shadow-sm"
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
            className="bg-[#16A34A] hover:bg-[#15803D] hover:shadow-[0_0_12px_rgba(22,163,74,0.4)] text-white text-[12px] font-bold min-h-[34px] px-2 flex-1 flex items-center justify-center gap-1 shadow-md uppercase tracking-wider rounded-lg transition-all active:scale-95 disabled:opacity-50"
          >
            <span>BUY</span>
          </button>

          <button
            type="button"
            onClick={(e) => handleQuickTrade(e, 'SELL')}
            disabled={!canQuickSell}
            title={
              isTradingLocked
                ? 'Trading locked'
                : availableToSell === 0
                ? `No ${stock.symbol} shares available to sell`
                : parsedCardQty > availableToSell
                ? `Cannot sell ${parsedCardQty} shares — you only own ${availableToSell} available`
                : `Instant Quick Sell ${parsedCardQty} ${stock.symbol}`
            }
            className={`text-[12px] font-bold min-h-[34px] px-2 flex-1 flex items-center justify-center gap-1 uppercase tracking-wider rounded-lg transition-all active:scale-95 ${
              !canQuickSell
                ? 'bg-slate-700/60 dark:bg-[#1E2333] text-slate-400 dark:text-[#64748B] border border-slate-700/40 cursor-not-allowed opacity-50 shadow-none'
                : isProfitableSell
                ? 'bg-[#16A34A] hover:bg-[#15803D] text-white shadow-[0_0_12px_rgba(22,163,74,0.4)]'
                : 'bg-[#B91C1C] hover:bg-[#991B1B] text-white shadow-[0_0_12px_rgba(185,28,28,0.4)]'
            }`}
          >
            <span>SELL</span>
          </button>
        </div>

        {/* Mode 2: Normal Trade Review & Limit Mode */}
        <div className="flex items-center gap-1.5 pt-0.5 font-mono">
          <button
            type="button"
            onClick={(e) => handleNormalTrade(e, 'BUY')}
            className="flex-1 py-1.5 px-2 rounded-lg border border-[#22C55E]/40 bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E] text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 min-h-[32px] cursor-pointer"
            title="Review & set limit buy price"
          >
            <span>Normal Buy</span>
          </button>

          <button
            type="button"
            onClick={(e) => handleNormalTrade(e, 'SELL')}
            className="flex-1 py-1.5 px-2 rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 min-h-[32px] cursor-pointer"
            title="Review & set limit sell price"
          >
            <span>Normal Sell</span>
          </button>
        </div>
      </div>
    </div>
  );
});
