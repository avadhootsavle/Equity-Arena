import React, { useMemo } from 'react';
import { Wallet } from 'lucide-react';

const fmt = (n, d = 2) =>
  Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d
  });

const CATEGORICAL = [
  'var(--cat-1)', 'var(--cat-2)', 'var(--cat-3)', 'var(--cat-4)',
  'var(--cat-5)', 'var(--cat-6)', 'var(--cat-7)', 'var(--cat-8)'
];

/** Stable colour per ticker so a badge keeps its identity. */
function badgeColour(key = '') {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return CATEGORICAL[hash % CATEGORICAL.length];
}

/** Tiny price line for the row. */
function RowSpark({ history = [], up = true, width = 64, height = 24 }) {
  const path = useMemo(() => {
    const prices = (history || []).slice(-30).map((h) => Number(h?.price)).filter(isFinite);
    if (prices.length < 2) return null;
    const lo = Math.min(...prices);
    const hi = Math.max(...prices);
    const range = hi - lo || Math.max(hi * 0.005, 0.01);
    return prices
      .map((p, i) => {
        const x = (i / (prices.length - 1)) * width;
        const y = height - 3 - ((p - lo) / range) * (height - 6);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [history, width, height]);

  if (!path) return <div style={{ width, height }} />;

  return (
    <svg width={width} height={height} aria-hidden="true">
      <path
        d={path}
        fill="none"
        stroke={up ? 'var(--gain-green)' : 'var(--loss-red)'}
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------
   My Stocks
   ------------------------------------------------------------------ */
export function MyStocks({ holdings = [], stocks = [], onSell, onShowChart }) {
  const stockById = useMemo(() => {
    const m = new Map();
    for (const s of stocks) m.set(s.id, s);
    return m;
  }, [stocks]);

  const rows = useMemo(
    () =>
      holdings.map((h) => {
        const stock = stockById.get(h.stockId);
        const priceNow = stock?.currentPrice ?? h.currentPrice ?? 0;
        const worth = h.quantity * priceNow;
        const paid = h.quantity * (h.avgBuyPrice || 0);
        const gain = worth - paid;
        return {
          ...h,
          stock,
          priceNow,
          worth,
          paid,
          gain,
          gainPct: paid ? (gain / paid) * 100 : 0
        };
      }),
    [holdings, stockById]
  );

  const totalWorth = rows.reduce((s, r) => s + r.worth, 0);

  return (
    <section className="surface overflow-hidden" style={{ boxShadow: 'var(--card-shadow)' }}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5">
        <div>
          <h3 className="text-[15px] font-heading font-bold theme-text-main">
            My Stocks{' '}
            <span className="theme-text-dim font-normal">({rows.length})</span>
          </h3>
          <p className="text-[11px] theme-text-muted mt-0.5">
            Everything you own right now. These numbers only count stocks you still hold.
          </p>
        </div>

        {rows.length > 0 && (
          <div className="text-right">
            {/* Only the value is summarised here. A second profit total next to
                the dashboard's "Total profit" tile read as a contradiction,
                because this one excluded gains already banked from selling.
                Per-stock profit still shows on each row below. */}
            <div className="text-[9.5px] theme-text-dim uppercase tracking-wider">
              Worth now
            </div>
            <div className="text-[15px] font-mono font-bold theme-text-main">
              {fmt(totalWorth)} IC
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="theme-text-dim text-[11px] border-b theme-border whitespace-nowrap">
              <th className="text-left font-normal px-4 py-2">Stock</th>
              <th className="text-right font-normal px-2 py-2">Shares</th>
              <th className="text-right font-normal px-2 py-2">You paid</th>
              <th className="text-right font-normal px-2 py-2">Price now</th>
              <th className="text-right font-normal px-2 py-2">Profit / Loss</th>
              <th className="text-right font-normal px-2 py-2">Worth now</th>
              <th className="px-2 py-2 hidden md:table-cell" />
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <Wallet
                    className="w-7 h-7 mx-auto mb-2.5"
                    style={{ color: 'var(--text-dim)' }}
                  />
                  <div className="text-[13px] theme-text-main font-semibold">
                    You don't own any stocks yet
                  </div>
                  <div className="text-[11.5px] theme-text-muted mt-1">
                    Pick a stock below and hit Buy to get started
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const up = r.gain >= 0;
                const colour = up ? 'var(--gain-green)' : 'var(--loss-red)';
                const badge = badgeColour(r.symbol);

                return (
                  <tr
                    key={r.id || r.stockId}
                    className="border-b theme-border last:border-0 theme-bg-card-hover transition-colors"
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => r.stock && onShowChart?.(r.stock)}
                        className="flex items-center gap-2.5 text-left"
                        title={`Show ${r.symbol} on the big chart`}
                      >
                        <span
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-mono font-extrabold flex-shrink-0"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${badge} 20%, transparent)`,
                            color: badge
                          }}
                        >
                          {r.symbol?.slice(0, 2)}
                        </span>
                        <span>
                          {/* Company name leads — a ticker like "BWT" means
                              nothing to someone new to trading. */}
                          <span className="block font-semibold theme-text-main leading-tight">
                            {r.name || r.symbol}
                          </span>
                          <span
                            className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${badge} 16%, transparent)`,
                              color: badge
                            }}
                          >
                            {r.symbol}
                          </span>
                        </span>
                      </button>
                    </td>

                    <td className="px-2 py-3 text-right font-mono theme-text-main whitespace-nowrap">
                      {r.quantity}
                      {r.lockedQuantity > 0 && (
                        <span
                          className="block text-[9.5px]"
                          style={{ color: 'var(--accent)' }}
                        >
                          {r.lockedQuantity} on hold
                        </span>
                      )}
                    </td>

                    <td className="px-2 py-3 text-right font-mono theme-text-main whitespace-nowrap">
                      {fmt(r.avgBuyPrice)}
                      <span className="block text-[10px] theme-text-dim">IC</span>
                    </td>

                    <td className="px-2 py-3 text-right font-mono theme-text-main whitespace-nowrap">
                      {fmt(r.priceNow)}
                      <span className="block text-[10px] theme-text-dim">IC</span>
                    </td>

                    <td
                      className="px-2 py-3 text-right font-mono font-semibold whitespace-nowrap"
                      style={{ color: colour }}
                    >
                      {up ? '+' : '−'}
                      {fmt(Math.abs(r.gain))}
                      <span className="block text-[10px] font-normal">
                        {up ? '+' : '−'}
                        {Math.abs(r.gainPct).toFixed(2)}%
                      </span>
                    </td>

                    <td className="px-2 py-3 text-right font-mono theme-text-main whitespace-nowrap">
                      {fmt(r.worth)}
                      <span className="block text-[10px] theme-text-dim">IC</span>
                    </td>

                    <td className="px-2 py-3 hidden md:table-cell">
                      <RowSpark history={r.stock?.priceHistories} up={up} />
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => r.stock && onSell?.(r.stock, 'SELL')}
                        className="px-3.5 h-[28px] rounded-md text-[12px] font-semibold transition-colors"
                        style={{
                          color: 'var(--loss-red)',
                          border:
                            '1px solid color-mix(in srgb, var(--loss-red) 45%, transparent)',
                          backgroundColor:
                            'color-mix(in srgb, var(--loss-red) 8%, transparent)'
                        }}
                      >
                        Sell
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
