import React from 'react';
import { History } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const fmt = (n, d = 2) =>
  Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d
  });

const clock = (ts) =>
  new Date(ts).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

const when = (ts) => {
  const d = new Date(ts);
  const isToday = d.toDateString() === new Date().toDateString();
  return isToday
    ? `Today, ${clock(ts)}`
    : d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
};

/* ------------------------------------------------------------------
   My Recent Trades Component
   ------------------------------------------------------------------ */
export function MyTrades({ transactions = [], limit = 6, title = 'My Recent Trades' }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const rows = transactions.slice(0, limit);

  return (
    <section
      className={`rounded-2xl border overflow-hidden ${
        isDark ? 'bg-[#0F1117] border-[#2D3142]' : 'bg-white border-[#E2E6F0] shadow-sm'
      }`}
    >
      <div className="px-5 py-4 border-b theme-border">
        <h3 className="text-[18px] font-semibold theme-text-main flex items-center gap-2 font-heading">
          <History className="w-5 h-5 text-[#F0B429]" />
          {title}
        </h3>
        <p className="text-[13px] text-[#6B7280] dark:text-[#7B82A0] mt-0.5">
          Every buy and sell you've made this game
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px] font-sans">
          <thead>
            <tr className="text-[#6B7280] dark:text-[#7B82A0] text-[11px] font-mono uppercase tracking-[0.08em] border-b theme-border whitespace-nowrap">
              <th className="text-left font-semibold px-4 py-3">Bought / Sold</th>
              <th className="text-left font-semibold px-3 py-3">Stock</th>
              <th className="text-right font-semibold px-3 py-3">Shares</th>
              <th className="text-right font-semibold px-3 py-3">Price each</th>
              <th className="text-right font-semibold px-3 py-3">Total</th>
              <th className="text-right font-semibold px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody className="divide-y theme-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="text-[14px] theme-text-main font-semibold">
                    No trades yet
                  </div>
                  <div className="text-[12px] text-[#6B7280] dark:text-[#7B82A0] mt-1">
                    Your buys and sells will show up here
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((tx, i) => {
                const isBuy = tx.type === 'BUY';
                const qty = tx.quantity || 0;
                const price = tx.price || 0;
                const isEven = i % 2 === 0;

                return (
                  <tr
                    key={tx.id || `trade-${i}`}
                    className={`transition-colors ${
                      isEven ? 'bg-transparent' : isDark ? 'bg-white/[0.015]' : 'bg-black/[0.015]'
                    } hover:theme-bg-card-hover`}
                  >
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase shadow-sm ${
                          isBuy ? 'bg-[#16A34A] text-white' : 'bg-[#DC2626] text-white'
                        }`}
                      >
                        {isBuy ? 'Bought' : 'Sold'}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="block text-[15px] font-medium theme-text-main leading-tight">
                        {tx.stock?.name || tx.stock?.symbol || '—'}
                      </span>
                      <span className="block text-[11px] font-mono text-[#6B7280] dark:text-[#7B82A0] mt-0.5">
                        {tx.stock?.symbol || ''}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-right font-mono text-[14px] font-bold theme-text-main">
                      {qty}
                    </td>
                    <td className="px-3 py-3.5 text-right font-mono text-[14px] theme-text-main whitespace-nowrap">
                      {fmt(price)} <span className="text-[10px] text-[#6B7280] dark:text-[#7B82A0]">IC</span>
                    </td>
                    <td className="px-3 py-3.5 text-right font-mono text-[14px] font-bold theme-text-main whitespace-nowrap">
                      {fmt(qty * price)} <span className="text-[10px] text-[#6B7280] dark:text-[#7B82A0] font-normal">IC</span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-[12px] text-[#6B7280] dark:text-[#7B82A0] whitespace-nowrap">
                      {when(tx.timestamp)}
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
