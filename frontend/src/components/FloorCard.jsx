import React, { memo, useMemo, useRef, useEffect, useState, useId } from 'react';
import { TrendingUp, TrendingDown, Check, Zap } from 'lucide-react';

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
   Mini sparkline that draws itself in on mount
   ------------------------------------------------------------------ */
const MiniSpark = memo(({ history = [], fallbackPrice = 0, width = 200, height = 40, up = true }) => {
  // Unique per instance: a shared id made every card reuse the first gradient
  const gid = `spark${useId().replace(/:/g, '')}`;
  const pathRef = useRef(null);
  const [dashLength, setDashLength] = useState(600);

  const geometry = useMemo(() => {
    const rawPrices = (history || [])
      .map((h) => Number(h?.price))
      .filter((p) => isFinite(p));

    const prices = rawPrices.length >= 2 
      ? rawPrices.slice(-50) 
      : [fallbackPrice || 0, fallbackPrice || 0];

    if (prices.length < 2) return null;

    const lo = Math.min(...prices);
    const hi = Math.max(...prices);
    const range = hi - lo || Math.max(hi * 0.005, 0.01);
    const pad = 4;
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
  }, [history, fallbackPrice, width, height]);

  useEffect(() => {
    if (pathRef.current) {
      try {
        setDashLength(Math.ceil(pathRef.current.getTotalLength()) || 600);
      } catch {
        setDashLength(600);
      }
    }
  }, [geometry]);

  if (!geometry) {
    return (
      <div
        className="flex items-center justify-center text-[9px] font-mono theme-text-dim"
        style={{ width: '100%', height }}
      >
        no tape
      </div>
    );
  }

  const color = up ? 'var(--gain-green)' : 'var(--loss-red)';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height }}
      aria-hidden="true"
      className="block overflow-hidden"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={geometry.area} fill={`url(#${gid})`} />
      <path
        ref={pathRef}
        d={geometry.line}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="animate-draw-line"
        style={{
          '--dash-len': dashLength,
          strokeDasharray: dashLength,
          strokeDashoffset: dashLength
        }}
      />
      <circle
        cx={geometry.lastPoint[0]}
        cy={geometry.lastPoint[1]}
        r="2"
        fill={color}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
});

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
  onTrade
}) {
  const percentChange = Number(stock?.percentChange) || 0;
  const isUp = percentChange >= 0;
  const owned = holding?.quantity || 0;
  const availableToSell =
    holding?.availableQuantity !== undefined ? holding.availableQuantity : owned;

  const flashClass =
    flash === 'up' ? 'animate-tick-up' : flash === 'down' ? 'animate-tick-down' : '';
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

  const handleTrade = (e, side) => {
    e.stopPropagation();
    onTrade?.(stock, side);
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
        className={`floor-card animate-card-rise surface px-2 py-1.5 ${
          isUp ? 'is-up' : 'is-down'
        } ${flashClass}`}
      >
        <CardBackdrop accent={accent} intensity={intensity} streakCount={3} />
        <span className="card-sheen" />

        <button
          type="button"
          className="card-open"
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
            className={`block text-sm font-mono font-extrabold theme-text-main mt-0.5 ${priceClass}`}
          >
            {fmtMoney(stock.currentPrice, stock.currentPrice >= 1000 ? 1 : 2)}
          </span>

          <span className="block h-6 mt-1 overflow-hidden relative rounded">
            <MiniSpark history={history} fallbackPrice={stock.currentPrice} width={90} height={24} up={isUp} />
          </span>

          <span
            className="block mt-1 text-[9px] font-mono font-bold px-1 py-0.5 rounded text-center"
            style={{
              color: accent,
              backgroundColor: `color-mix(in srgb, ${accent} 13%, transparent)`
            }}
          >
            {isUp ? '+' : ''}
            {percentChange.toFixed(2)}%
          </span>
        </button>

        <div className="flex items-center gap-1 mt-1.5">
          <button
            type="button"
            onClick={(e) => handleTrade(e, 'BUY')}
            disabled={isTradingLocked}
            title={isTradingLocked ? 'Trading locked' : `Buy ${stock.symbol}`}
            className="card-action card-action-buy"
            style={{ height: '22px', fontSize: '9.5px' }}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={(e) => handleTrade(e, 'SELL')}
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
      className={`floor-card animate-card-rise surface p-3 ${
        isUp ? 'is-up' : 'is-down'
      } ${flashClass}`}
    >
      <CardBackdrop accent={accent} intensity={intensity} />
      <span className="card-sheen" />

      <button
        type="button"
        className="card-open"
        onClick={() => onSelect?.(stock)}
        aria-label={`Open ${stock.symbol} ${stock.name} chart, ${fmtMoney(
          stock.currentPrice
        )} IC, ${isUp ? 'up' : 'down'} ${Math.abs(percentChange).toFixed(2)} percent`}
      >
        {/* Top strip: ticker badge + name + owned pill */}
        <span className="flex items-start justify-between gap-2">
          <span className="flex items-center gap-2 min-w-0">
            <span
              className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-mono font-extrabold flex-shrink-0"
              style={{
                backgroundColor: `color-mix(in srgb, ${accent} 18%, transparent)`,
                color: accent
              }}
            >
              {stock.symbol?.slice(0, 2)}
            </span>
            <span className="min-w-0 block">
              <span className="block text-[11.5px] font-semibold theme-text-main leading-tight truncate max-w-[120px]">
                {stock.name || stock.symbol}
              </span>
              <span className="block text-[9.5px] font-mono theme-text-dim leading-tight">
                {stock.symbol}
              </span>
            </span>
          </span>

          {owned > 0 && (
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-0.5 flex-shrink-0"
              style={{
                backgroundColor:
                  'color-mix(in srgb, var(--accent) 15%, transparent)',
                color: 'var(--accent)'
              }}
            >
              <Check className="w-2.5 h-2.5" />
              {owned}
            </span>
          )}
        </span>

        {/* Price + change */}
        <span className="flex items-end justify-between gap-2 mt-2">
          <span
            className={`text-xl font-mono font-extrabold theme-text-main leading-none ${priceClass}`}
          >
            {fmtMoney(stock.currentPrice)}
          </span>
          <span
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold"
            style={{
              color: accent,
              backgroundColor: `color-mix(in srgb, ${accent} 15%, transparent)`
            }}
          >
            {isUp ? (
              <TrendingUp className="w-2.5 h-2.5" />
            ) : (
              <TrendingDown className="w-2.5 h-2.5" />
            )}
            {isUp ? '+' : ''}
            {percentChange.toFixed(2)}%
          </span>
        </span>

        {/* Sparkline in a dedicated, bounded, non-overlapping container */}
        <div className="w-full h-10 my-2.5 overflow-hidden relative rounded bg-[color-mix(in_srgb,var(--bg-input)_30%,transparent)] border-y border-[color-mix(in_srgb,var(--border-card)_40%,transparent)]">
          <MiniSpark history={history} fallbackPrice={stock.currentPrice} width={200} height={40} up={isUp} />
        </div>

        {/* Footer stats */}
        <span className="flex items-center justify-between mt-1 pt-1.5 border-t theme-border text-[9px] font-mono theme-text-dim">
          <span className="uppercase tracking-wide truncate max-w-[70px]">
            {stock.sector}
          </span>
          <span>
            Range {fmtMoney(dayLow, dayLow >= 1000 ? 0 : 2)}–
            {fmtMoney(dayHigh, dayHigh >= 1000 ? 0 : 2)}
          </span>
        </span>
      </button>

      {/* Trade actions */}
      <div className="flex items-center gap-1.5 mt-2">
        <button
          type="button"
          onClick={(e) => handleTrade(e, 'BUY')}
          disabled={isTradingLocked}
          title={isTradingLocked ? 'Trading locked' : `Buy ${stock.symbol}`}
          className="card-action card-action-buy"
        >
          <Zap className="w-3 h-3" />
          Buy
        </button>
        <button
          type="button"
          onClick={(e) => handleTrade(e, 'SELL')}
          disabled={!canSell}
          title={
            isTradingLocked
              ? 'Trading locked'
              : availableToSell === 0
              ? `No ${stock.symbol} shares to sell`
              : `Sell ${availableToSell} available`
          }
          className="card-action card-action-sell"
        >
          Sell
          {availableToSell > 0 && (
            <span className="opacity-70">({availableToSell})</span>
          )}
        </button>
      </div>
    </div>
  );
});
