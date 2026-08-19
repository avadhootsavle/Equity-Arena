import React, { useState, useRef, useEffect, useMemo } from 'react';
import { PriceChart } from './PriceChart';
import {
  ChevronDown,
  Zap,
  TrendingUp,
  TrendingDown,
  Check,
  Lock,
  Search
} from 'lucide-react';

const fmtMoney = (n, d = 2) =>
  Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d
  });

export const TIMEFRAMES = [
  { key: '5M', label: '5M', minutes: 5 },
  { key: '15M', label: '15M', minutes: 15 },
  { key: '1H', label: '1H', minutes: 60 },
  { key: 'ALL', label: 'All', minutes: Infinity }
];

/* ------------------------------------------------------------------
   Stock picker dropdown
   ------------------------------------------------------------------ */
function StockPicker({ stocks, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const onClickAway = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onClickAway);
    document.addEventListener('keydown', onKeyDown);
    setTimeout(() => inputRef.current?.focus(), 30);

    return () => {
      document.removeEventListener('mousedown', onClickAway);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const results = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return stocks;
    return stocks.filter(
      (s) =>
        s.symbol?.toLowerCase().includes(q) ||
        s.name?.toLowerCase().includes(q) ||
        s.sector?.toLowerCase().includes(q)
    );
  }, [stocks, filter]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setFilter('');
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 px-2 py-1.5 rounded-md border theme-border theme-bg-input hover:theme-bg-card-hover transition-colors max-w-[280px]"
      >
        <span
          className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-mono font-extrabold flex-shrink-0"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)',
            color: 'var(--accent)'
          }}
        >
          {selected?.symbol?.slice(0, 2) || '--'}
        </span>
        <span className="text-[12px] font-mono font-bold theme-text-main truncate">
          {selected?.symbol || 'Select'}
        </span>
        <span className="text-[11px] theme-text-dim truncate hidden sm:inline">
          — {selected?.name || 'a listing'}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 theme-text-dim flex-shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1.5 w-[300px] max-w-[85vw] rounded-lg border theme-border theme-bg-elevated z-40 overflow-hidden animate-pop-in"
          style={{ boxShadow: 'var(--card-shadow)' }}
          role="listbox"
        >
          <div className="p-2 border-b theme-border relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 theme-text-dim" />
            <input
              ref={inputRef}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter listings…"
              className="w-full h-[30px] rounded border theme-border theme-bg-input pl-7 pr-2 text-[11px] theme-text-main placeholder:theme-text-dim focus:outline-none"
            />
          </div>

          <div className="max-h-[280px] overflow-y-auto py-1">
            {results.length === 0 && (
              <div className="px-3 py-4 text-center text-[11px] font-mono theme-text-dim">
                No match for “{filter}”
              </div>
            )}

            {results.map((s) => {
              const up = Number(s.percentChange) >= 0;
              const active = s.id === selected?.id;

              return (
                <button
                  key={s.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onSelect(s);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:theme-bg-card-hover transition-colors text-left"
                  style={
                    active
                      ? {
                          backgroundColor:
                            'color-mix(in srgb, var(--accent) 10%, transparent)'
                        }
                      : undefined
                  }
                >
                  <span className="w-3 flex-shrink-0">
                    {active && (
                      <Check className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                    )}
                  </span>
                  <span className="text-[11px] font-mono font-bold theme-text-main w-[52px] flex-shrink-0">
                    {s.symbol}
                  </span>
                  <span className="text-[10px] theme-text-dim truncate flex-1">
                    {s.name}
                  </span>
                  <span
                    className="text-[10px] font-mono font-bold flex-shrink-0"
                    style={{ color: up ? 'var(--gain-green)' : 'var(--loss-red)' }}
                  >
                    {up ? '+' : ''}
                    {Number(s.percentChange || 0).toFixed(2)}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   Chart panel
   ------------------------------------------------------------------ */
export function ChartPanel({
  stocks = [],
  selected,
  onSelectStock,
  history = [],
  timeframe,
  onTimeframeChange,
  loadingHistory = false,
  onQuickTrade,
  ownedQuantity = 0,
  isTradingLocked = false
}) {
  if (!selected) {
    return (
      <div className="surface p-5" style={{ boxShadow: 'var(--card-shadow)' }}>
        <div className="h-[300px] flex items-center justify-center text-[11px] font-mono theme-text-dim">
          No listing selected
        </div>
      </div>
    );
  }

  const percentChange = Number(selected.percentChange) || 0;
  const isUp = percentChange >= 0;
  const accent = isUp ? 'var(--gain-green)' : 'var(--loss-red)';
  const absChange =
    selected.basePrice != null
      ? selected.currentPrice - selected.basePrice
      : (selected.currentPrice * percentChange) / 100;

  const canSell = ownedQuantity > 0 && !isTradingLocked;
  const activeTf = TIMEFRAMES.find((t) => t.key === timeframe) || TIMEFRAMES[0];

  return (
    <div
      className="surface overflow-hidden flex flex-col"
      style={{ boxShadow: 'var(--card-shadow)' }}
    >
      {/* ---- Header ---- */}
      <div className="px-4 pt-3.5 pb-3 border-b theme-border space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <StockPicker stocks={stocks} selected={selected} onSelect={onSelectStock} />

            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[26px] font-mono font-extrabold theme-text-main leading-none">
                {fmtMoney(selected.currentPrice)}
              </span>
              <span className="text-[11px] font-mono theme-text-dim">IC</span>
              <span
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-extrabold"
                style={{
                  color: accent,
                  backgroundColor: `color-mix(in srgb, ${accent} 13%, transparent)`
                }}
              >
                {isUp ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {isUp ? '+' : ''}
                {fmtMoney(absChange)} ({isUp ? '+' : ''}
                {percentChange.toFixed(2)}%)
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono theme-text-dim">
              <span
                className="w-1.5 h-1.5 rounded-full animate-live-pulse"
                style={{ backgroundColor: accent, color: accent }}
              />
              <span>{selected.sector}</span>
              <span>·</span>
              <span>Base {fmtMoney(selected.basePrice || 0)} IC</span>
              {ownedQuantity > 0 && (
                <>
                  <span>·</span>
                  <span style={{ color: 'var(--accent)' }}>
                    You hold {ownedQuantity}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* ---- Quick trade: one share, instantly ---- */}
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onQuickTrade('BUY')}
                disabled={isTradingLocked}
                title={
                  isTradingLocked
                    ? 'Trading is locked — the session is not running'
                    : `Buy 1 ${selected.symbol} at the live price`
                }
                className="group flex items-center gap-1.5 px-3.5 h-[34px] rounded-md text-[12px] font-heading font-extrabold text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--gain-green)',
                  boxShadow: isTradingLocked ? 'none' : '0 4px 14px -4px var(--glow-green)'
                }}
              >
                {isTradingLocked ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  <Zap className="w-3.5 h-3.5 transition-transform group-hover:scale-125" />
                )}
                Buy
              </button>

              <button
                type="button"
                onClick={() => onQuickTrade('SELL')}
                disabled={!canSell}
                title={
                  isTradingLocked
                    ? 'Trading is locked — the session is not running'
                    : ownedQuantity === 0
                    ? `You hold no ${selected.symbol} shares to sell`
                    : `Sell 1 ${selected.symbol} at the live price`
                }
                className="group flex items-center gap-1.5 px-3.5 h-[34px] rounded-md text-[12px] font-heading font-extrabold text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--loss-red)',
                  boxShadow: canSell ? '0 4px 14px -4px var(--glow-red)' : 'none'
                }}
              >
                {!canSell ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  <Zap className="w-3.5 h-3.5 transition-transform group-hover:scale-125" />
                )}
                Sell
              </button>
            </div>

            <span className="text-[9px] font-mono theme-text-dim">
              1 share · instant · confirmed
            </span>
          </div>
        </div>

        {/* ---- Timeframe pills ---- */}
        <div className="flex items-center justify-between gap-2">
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
                  onClick={() => onTimeframeChange(tf.key)}
                  aria-pressed={active}
                  className="px-2.5 h-[24px] rounded text-[10px] font-mono font-bold transition-all"
                  style={
                    active
                      ? {
                          backgroundColor:
                            'color-mix(in srgb, var(--accent) 18%, transparent)',
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

          <span className="text-[9.5px] font-mono theme-text-dim">
            {loadingHistory ? 'loading tape…' : `${history.length} ticks plotted`}
          </span>
        </div>
      </div>

      {/* ---- Chart ---- */}
      <div className="px-3 pt-2 pb-3">
        {loadingHistory && history.length === 0 ? (
          <div className="h-[300px] rounded-lg animate-shimmer" />
        ) : (
          <PriceChart
            history={history}
            currentPrice={selected.currentPrice}
            height={340}
            spanLabel={activeTf.label}
          />
        )}
      </div>
    </div>
  );
}
