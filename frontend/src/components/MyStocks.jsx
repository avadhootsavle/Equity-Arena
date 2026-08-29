import React, { useMemo } from 'react';
import { Wallet, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

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

/* ------------------------------------------------------------------
   My Stocks Component
   ------------------------------------------------------------------ */
export function MyStocks({ holdings = [], stocks = [], onSell, onShowChart, onNavigateMarket }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
    <section
      className={`rounded-2xl border overflow-hidden ${
        isDark ? 'bg-[#0F1117] border-[#2D3142]' : 'bg-white border-[#E2E6F0] shadow-sm'
      }`}
    >
      {/* Heading Area */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b theme-border">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[20px] font-bold theme-text-main font-heading">
              My Stocks
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#F0B429]/15 text-[#F0B429] dark:bg-[#F0B429]/15 dark:text-[#F0B429] border border-[#F0B429]/30">
              {rows.length}
            </span>
          </div>
          <p className="text-[13px] text-[#6B7280] dark:text-[#7B82A0] mt-0.5">
            Everything you own right now. These numbers only count stocks you still hold.
          </p>
        </div>

        {rows.length > 0 && (
          <div className="text-right font-mono">
            <div className="text-[10px] text-[#7B82A0] uppercase tracking-wider font-semibold">
              Worth now
            </div>
            <div className="text-[18px] font-bold text-[#F0B429] dark:text-[#F0B429]">
              {fmt(totalWorth)} IC
            </div>
          </div>
        )}
      </div>

      {/* Content / Table */}
      <div className="p-4 overflow-x-auto">
        {rows.length === 0 ? (
          /* Empty State — Dashed Border Box + Go to Market Button */
          <div className={`p-8 sm:p-12 rounded-2xl border-2 border-dashed text-center my-2 ${
            isDark ? 'border-[#2D3142] bg-[#141720]/40' : 'border-[#CBD5E1] bg-[#F8FAFC]'
          }`}>
            <Wallet className="w-10 h-10 text-[#F0B429] mx-auto mb-3" />
            <h4 className="text-[16px] font-bold theme-text-main">
              You don't own any stocks yet.
            </h4>
            <p className="text-[13px] text-[#6B7280] dark:text-[#7B82A0] mt-1 max-w-sm mx-auto">
              Buy some stocks from the market to build your portfolio and start earning returns.
            </p>
            <button
              type="button"
              onClick={onNavigateMarket}
              className="mt-5 px-5 py-2.5 bg-[#F0B429] hover:bg-[#f5bc38] text-black font-extrabold text-xs font-mono uppercase tracking-wider rounded-lg shadow inline-flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Go to Market</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <table className="w-full text-[13px] font-sans">
            <thead>
              <tr className="text-[#6B7280] dark:text-[#7B82A0] text-[11px] font-mono uppercase tracking-[0.08em] border-b theme-border whitespace-nowrap">
                <th className="text-left font-semibold px-4 py-3">Stock</th>
                <th className="text-right font-semibold px-3 py-3">Shares</th>
                <th className="text-right font-semibold px-3 py-3">You paid</th>
                <th className="text-right font-semibold px-3 py-3">Price now</th>
                <th className="text-right font-semibold px-3 py-3">Profit / Loss</th>
                <th className="text-right font-semibold px-3 py-3">Worth now</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y theme-border">
              {rows.map((r, i) => {
                const up = r.gain >= 0;
                const gainColor = up ? (isDark ? '#4ADE80' : '#16A34A') : (isDark ? '#F87171' : '#DC2626');
                const badge = badgeColour(r.symbol);
                const isEven = i % 2 === 0;

                return (
                  <tr
                    key={r.id || r.stockId || `holding-${i}`}
                    className={`min-h-[52px] border-l-2 transition-colors ${
                      up ? 'border-l-[#22C55E]' : 'border-l-[#EF4444]'
                    } ${
                      isEven
                        ? 'bg-transparent'
                        : isDark
                        ? 'bg-white/[0.02]'
                        : 'bg-black/[0.02]'
                    } hover:theme-bg-card-hover`}
                  >
                    {/* Stock Logo + Name */}
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => r.stock && onShowChart?.(r.stock)}
                        className="flex items-center gap-3 text-left group cursor-pointer"
                        title={`Focus ${r.symbol} on chart`}
                      >
                        <span
                          className="w-[36px] h-[36px] rounded-lg flex items-center justify-center text-[12px] font-mono font-extrabold flex-shrink-0 border shadow-sm"
                          style={{
                            borderColor: up ? '#22C55E' : '#EF4444',
                            backgroundColor: `color-mix(in srgb, ${badge} 18%, transparent)`,
                            color: badge
                          }}
                        >
                          {r.symbol?.slice(0, 2)}
                        </span>
                        <span>
                          <span className="block text-[15px] font-semibold theme-text-main leading-tight group-hover:text-[#F0B429]">
                            {r.name || r.symbol}
                          </span>
                          <span className="block text-[11px] font-mono text-[#6B7280] dark:text-[#7B82A0] mt-0.5">
                            {r.symbol}
                          </span>
                        </span>
                      </button>
                    </td>

                    {/* Shares */}
                    <td className="px-3 py-3 text-right font-mono theme-text-main whitespace-nowrap">
                      <span className="font-bold">{r.quantity}</span>
                      {r.lockedQuantity > 0 && (
                        <span className="block text-[10px] text-[#F0B429]">
                          ({r.lockedQuantity} locked in order)
                        </span>
                      )}
                    </td>

                    {/* Avg Buy Price */}
                    <td className="px-3 py-3 text-right font-mono theme-text-main whitespace-nowrap">
                      {fmt(r.avgBuyPrice)}
                      <span className="block text-[10px] text-[#6B7280] dark:text-[#7B82A0]">IC</span>
                    </td>

                    {/* Current Price */}
                    <td className="px-3 py-3 text-right font-mono theme-text-main whitespace-nowrap font-bold">
                      {fmt(r.priceNow)}
                      <span className="block text-[10px] text-[#6B7280] dark:text-[#7B82A0] font-normal">IC</span>
                    </td>

                    {/* Profit / Loss */}
                    <td
                      className="px-3 py-3 text-right font-mono font-bold whitespace-nowrap"
                      style={{ color: gainColor }}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        <span>{up ? '+' : '−'}{fmt(Math.abs(r.gain))} IC</span>
                      </div>
                      <span className="block text-[10.5px] font-medium opacity-90">
                        {up ? '+' : '−'}{Math.abs(r.gainPct).toFixed(2)}%
                      </span>
                    </td>

                    {/* Worth Now */}
                    <td className="px-3 py-3 text-right font-mono font-bold text-[14px] theme-text-main whitespace-nowrap">
                      {fmt(r.worth)}
                      <span className="block text-[10px] text-[#6B7280] dark:text-[#7B82A0] font-normal">IC</span>
                    </td>

                    {/* Sell Button with Profit/Loss Color Bifurcation */}
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => r.stock && onSell?.(r.stock, 'SELL')}
                        className={`text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition-all hover:scale-[1.03] active:scale-[0.97] uppercase cursor-pointer ${
                          r.gain > 0
                            ? 'bg-[#16A34A] hover:bg-[#15803D] hover:shadow-[0_0_10px_rgba(22,163,74,0.4)]'
                            : r.gain < 0
                            ? 'bg-[#DC2626] hover:bg-[#B91C1C] hover:shadow-[0_0_10px_rgba(220,38,38,0.4)]'
                            : 'bg-[#DC2626] hover:bg-[#B91C1C]'
                        }`}
                        title={r.gain > 0 ? `Sell now to lock in +${fmt(r.gain)} IC profit!` : r.gain < 0 ? `Sell now with -${fmt(Math.abs(r.gain))} IC loss` : 'Sell stock'}
                      >
                        Sell
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

