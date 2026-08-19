import React, { memo, useMemo, useRef, useEffect, useState, useId } from 'react';
import { TrendingUp, TrendingDown, Check } from 'lucide-react';

const fmtMoney = (n, d = 2) =>
  Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d
  });

/* ------------------------------------------------------------------
   Mini Sparkline Component
   ------------------------------------------------------------------ */
const MiniSpark = memo(({ history = [], width = 110, height = 32, up = true }) => {
  const gid = `spark${useId().replace(/:/g, '')}`;
  const pathRef = useRef(null);

  const geometry = useMemo(() => {
    const prices = (history || [])
      .map((h) => Number(h?.price))
      .filter((p) => isFinite(p));

    if (prices.length < 2) return null;

    const lo = Math.min(...prices);
    const hi = Math.max(...prices);
    const range = hi - lo || Math.max(hi * 0.005, 0.01);
    const pad = 3;
    const usableH = height - pad * 2;

    const coords = prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * width;
      const y = pad + usableH - ((p - lo) / range) * usableH;
      return [x, y];
    });

    const line = coords
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
      .join(' ');

    return {
      line,
      area: `${line} L${width},${height} L0,${height} Z`,
      lastPoint: coords[coords.length - 1]
    };
  }, [history, width, height]);

  if (!geometry) {
    return (
      <div className="flex items-center justify-center text-[9px] font-mono text-[var(--text-dim)]" style={{ width, height }}>
        --
      </div>
    );
  }

  const color = up ? 'var(--gain)' : 'var(--loss)';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={geometry.area} fill={`url(#${gid})`} />
      <path
        ref={pathRef}
        d={geometry.line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="square"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
});

/* ------------------------------------------------------------------
   Signature Element: Session Range Tape
   ------------------------------------------------------------------ */
const SessionRangeTape = memo(({ currentPrice, low, high }) => {
  const minP = Number(low) || 0;
  const maxP = Number(high) || 0;
  const currP = Number(currentPrice) || 0;

  const range = maxP - minP;
  const rawPct = range > 0 ? ((currP - minP) / range) * 100 : 50;
  const fillPct = Math.min(100, Math.max(0, rawPct));

  return (
    <div className="w-full mt-2.5 pt-2 border-t border-[var(--border)]">
      <div className="flex items-center justify-between text-[9px] font-mono text-[var(--text-secondary)] mb-1">
        <span>L ₹{fmtMoney(minP, minP >= 1000 ? 0 : 2)}</span>
        <span className="uppercase tracking-wider font-sans font-semibold text-[8.5px] text-[var(--text-dim)]">
          Session Range
        </span>
        <span>H ₹{fmtMoney(maxP, maxP >= 1000 ? 0 : 2)}</span>
      </div>
      <div className="relative w-full h-[5px] bg-[var(--bg-tertiary)] overflow-hidden rounded-none border border-[var(--border)]">
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${fillPct}%`,
            background: 'linear-gradient(90deg, var(--accent-gold), #FFD700)'
          }}
        />
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------
   FloorCard — Rebuilt with Sharp Corners & Signature Tape
   ------------------------------------------------------------------ */
export const FloorCard = memo(function FloorCard({
  stock,
  holding,
  index = 0,
  flash,
  variant = 'grid',
  isActive = false,
  isTradingLocked = false,
  onSelect,
  onTrade
}) {
  const percentChange = Number(stock?.percentChange) || 0;
  const isUp = percentChange >= 0;
  const owned = holding?.quantity || 0;
  const availableToSell = holding?.availableQuantity !== undefined ? holding.availableQuantity : owned;

  const flashClass = flash === 'up' ? 'animate-tick-up' : flash === 'down' ? 'animate-tick-down' : '';
  const history = stock?.priceHistories || [];

  const { dayLow, dayHigh } = useMemo(() => {
    const prices = history.map((h) => Number(h?.price)).filter(isFinite);
    if (!prices.length) {
      const p = stock?.currentPrice || 0;
      return { dayLow: p, dayHigh: p };
    }
    return { dayLow: Math.min(...prices), dayHigh: Math.max(...prices) };
  }, [history, stock?.currentPrice]);

  const handleTrade = (e, side) => {
    e.stopPropagation();
    onTrade?.(stock, side);
  };

  const canSell = availableToSell > 0 && !isTradingLocked;

  return (
    <div
      style={{ animationDelay: `${Math.min(index * 30, 400)}ms` }}
      className={`relative rounded-none border transition-colors duration-150 p-3 bg-[var(--bg-secondary)] ${
        isActive ? 'border-[var(--accent-gold)]' : 'border-[var(--border)] hover:border-[var(--border-strong)]'
      } ${flashClass}`}
    >
      <button
        type="button"
        className="w-full text-left bg-transparent border-0 p-0 cursor-pointer text-inherit"
        onClick={() => onSelect?.(stock)}
      >
        {/* Row 1: Symbol (Syne Bold) + Sector Label (DM Sans small caps) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-syne font-extrabold text-base tracking-tight text-[var(--text-primary)]">
              {stock.symbol}
            </span>
            {owned > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-[var(--accent-gold)]/15 text-[var(--accent-gold)] text-[9px] font-mono font-bold">
                <Check className="w-2.5 h-2.5" /> {owned}
              </span>
            )}
          </div>
          <span className="font-sans text-[10px] uppercase tracking-wider font-semibold text-[var(--text-secondary)] truncate">
            {stock.sector}
          </span>
        </div>

        {/* Row 2: Price (JetBrains Mono) + % Change Badge */}
        <div className="flex items-end justify-between gap-2 mt-2">
          <div className="font-mono text-xl font-extrabold text-[var(--text-primary)]">
            ₹ {fmtMoney(stock.currentPrice)}
          </div>
          <div
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10.5px] font-mono font-bold text-white"
            style={{ backgroundColor: isUp ? 'var(--gain)' : 'var(--loss)' }}
          >
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isUp ? '+' : ''}{percentChange.toFixed(2)}%
          </div>
        </div>

        {/* Row 3: Sparkline + Action Buttons */}
        <div className="flex items-center justify-between gap-2 mt-3">
          <div className="w-[110px] flex-shrink-0">
            <MiniSpark history={history} width={110} height={30} up={isUp} />
          </div>

          <div className="flex items-center gap-1.5 flex-1 justify-end">
            <button
              type="button"
              onClick={(e) => handleTrade(e, 'BUY')}
              disabled={isTradingLocked}
              title={isTradingLocked ? 'Trading locked' : `Buy ${stock.symbol}`}
              className="px-2.5 py-1 text-[11px] font-sans font-bold text-white rounded-none border-0 transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--gain)' }}
            >
              BUY
            </button>
            <button
              type="button"
              onClick={(e) => handleTrade(e, 'SELL')}
              disabled={!canSell}
              title={isTradingLocked ? 'Trading locked' : !canSell ? 'No shares to sell' : `Sell ${stock.symbol}`}
              className="px-2.5 py-1 text-[11px] font-sans font-bold text-white rounded-none border-0 transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--loss)' }}
            >
              SELL
            </button>
          </div>
        </div>

        {/* Row 4: Signature Session Range Tape */}
        <SessionRangeTape currentPrice={stock.currentPrice} low={dayLow} high={dayHigh} />
      </button>
    </div>
  );
});
