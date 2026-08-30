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
  { key: '30M', label: '30M', minutes: 30 },
  { key: '1H', label: '1H', minutes: 60 }
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
  onNormalTrade,
  ownedQuantity = 0,
  cashBalance = 0,
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

  const [quickQty, setQuickQty] = useState('1');
  const parsedQuickQty = Math.max(1, parseInt(quickQty, 10) || 1);
  const canQuickSell = ownedQuantity > 0 && !isTradingLocked && ownedQuantity >= parsedQuickQty;
  const activeTf = TIMEFRAMES.find((t) => t.key === timeframe) || TIMEFRAMES[0];

  const handleQuick = (side) => {
    const parsed = Math.max(1, parseInt(quickQty, 10) || 1);
    onQuickTrade?.(side, parsed);
  };

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

          {/* ---- Quick trade: quantity stepper on left, Buy/Sell buttons on right ---- */}
          <div className="flex flex-col items-end gap-1.5 font-mono">
            <div className="flex items-center gap-2">
              {/* Stepper controls */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQuickQty((prev) => String(Math.max(1, (parseInt(prev, 10) || 1) - 1)))}
                  className="w-[44px] h-[44px] rounded-lg border theme-border theme-bg-card hover:theme-bg-card-hover font-black text-lg theme-text-main flex items-center justify-center transition-all active:scale-95 shadow-sm"
                  title="Decrease quantity by 1"
                >
                  −
                </button>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quickQty}
                  onChange={(e) => setQuickQty(e.target.value)}
                  title="Type quantity to buy or sell"
                  aria-label="Quick trade quantity"
                  className="w-[60px] h-[44px] rounded-lg border theme-border theme-bg-input px-1 text-center text-sm font-bold theme-text-main focus:outline-none focus:border-[var(--accent)]"
                />

                <button
                  type="button"
                  onClick={() => setQuickQty((prev) => String((parseInt(prev, 10) || 1) + 1))}
                  className="w-[44px] h-[44px] rounded-lg border theme-border theme-bg-card hover:theme-bg-card-hover font-black text-lg theme-text-main flex items-center justify-center transition-all active:scale-95 shadow-sm"
                  title="Increase quantity by 1"
                >
                  +
                </button>
              </div>

              {/* Large BUY / SELL buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuick('BUY')}
                  disabled={isTradingLocked}
                  title={
                    isTradingLocked
                      ? 'Trading is locked — session is not running'
                      : `Instant Quick Buy ${quickQty} ${selected.symbol}`
                  }
                  className="min-h-[44px] px-4 bg-[var(--gain-green)] hover:brightness-110 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md flex items-center gap-1.5"
                >
                  {isTradingLocked ? <Lock className="w-4 h-4" /> : <Zap className="w-4 h-4 fill-current" />}
                  <span>QUICK BUY</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuick('SELL')}
                  disabled={!canQuickSell}
                  title={
                    isTradingLocked
                      ? 'Trading is locked — session is not running'
                      : ownedQuantity === 0
                      ? `You hold no ${selected.symbol} shares to sell`
                      : parsedQuickQty > ownedQuantity
                      ? `Cannot quick-sell ${parsedQuickQty} shares — you only own ${ownedQuantity} available ${
                          ownedQuantity === 1 ? 'share' : 'shares'
                        }`
                      : `Instant Quick Sell ${parsedQuickQty} ${selected.symbol}`
                  }
                  className={`min-h-[44px] px-4 font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all active:scale-95 flex items-center gap-1.5 ${
                    !canQuickSell
                      ? 'bg-slate-700/60 dark:bg-[#1E2333] text-slate-400 dark:text-[#64748B] border border-slate-700/40 cursor-not-allowed opacity-50 shadow-none'
                      : 'bg-[var(--loss-red)] hover:brightness-110 text-white shadow-md'
                  }`}
                >
                  {!canQuickSell ? <Lock className="w-4 h-4" /> : <Zap className="w-4 h-4 fill-current" />}
                  <span>QUICK SELL</span>
                </button>
              </div>

              {/* Normal Trade Button (Review Panel & Limit Order Mode) */}
              <button
                type="button"
                onClick={() => onNormalTrade?.(selected, 'BUY', Math.max(1, parseInt(quickQty, 10) || 1))}
                className="px-3 py-2 rounded-lg border theme-border theme-bg-card hover:theme-bg-card-hover text-xs font-extrabold theme-text-main flex items-center justify-center gap-1.5 transition-all active:scale-95 min-h-[38px]"
                title="Open review panel to inspect cost breakdown or place target limit order"
              >
                <span>Normal Trade (Review & Limit)</span>
              </button>
            </div>

            {/* Live Total Cost / Proceeds Line */}
            <div className="text-[11px] font-bold theme-text-main text-right">
              You'll spend {fmtMoney((parseInt(quickQty, 10) || 1) * selected.currentPrice)} IC
            </div>

            {/* Available Funds / Shares Line */}
            <div className="text-[10px] theme-text-dim text-right">
              You have {fmtMoney(cashBalance)} IC available · You own {ownedQuantity} shares
            </div>
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
            height={420}
            spanLabel={activeTf.label}
          />
        )}
      </div>
    </div>
  );
}
