import React, { useState } from 'react';
import { History, ChevronDown, ChevronUp, Gift } from 'lucide-react';
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
   My Recent Trades Component with Top-Up Formatting & Pagination
   ------------------------------------------------------------------ */
export function MyTrades({ transactions = [], limit = 10, title = 'My Recent Trades' }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showAll, setShowAll] = useState(false);

  const displayedRows = showAll ? transactions : transactions.slice(0, limit);
  const hasMore = transactions.length > limit;

  return (
    <section
      className={`rounded-2xl border overflow-hidden transition-all ${
        isDark ? 'bg-[#0F1117] border-[#2D3142]' : 'bg-white border-[#E2E6F0] shadow-sm'
      }`}
    >
      <div className="px-5 py-4 border-b theme-border flex items-center justify-between">
        <div>
          <h3 className="text-[18px] font-semibold theme-text-main flex items-center gap-2 font-heading">
            <History className="w-5 h-5 text-[#F0B429]" />
            {title}
          </h3>
          <p className="text-[13px] text-[#6B7280] dark:text-[#7B82A0] mt-0.5">
            Every trade and balance top-up in your tournament history
          </p>
        </div>

        {transactions.length > 0 && (
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#F0B429]/10 text-[#F0B429]">
            {transactions.length} Total
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px] font-sans">
          <thead>
            <tr className="text-[#6B7280] dark:text-[#7B82A0] text-[11px] font-mono uppercase tracking-[0.08em] border-b theme-border whitespace-nowrap">
              <th className="text-left font-semibold px-4 py-3">Type</th>
              <th className="text-left font-semibold px-3 py-3">Details</th>
              <th className="text-right font-semibold px-3 py-3">Shares</th>
              <th className="text-right font-semibold px-3 py-3">Price each</th>
              <th className="text-right font-semibold px-3 py-3">Total Amount</th>
              <th className="text-right font-semibold px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody className="divide-y theme-border">
            {displayedRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="text-[14px] theme-text-main font-semibold">
                    No trades yet
                  </div>
                  <div className="text-[12px] text-[#6B7280] dark:text-[#7B82A0] mt-1">
                    Your buys, sells, and wallet top-ups will show up here
                  </div>
                </td>
              </tr>
            ) : (
              displayedRows.map((tx, i) => {
                const isTopup = tx.quantity === 0 || tx.type === 'TOPUP';
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
                    {/* TYPE BADGE */}
                    <td className="px-4 py-3.5">
                      {isTopup ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase bg-[#F0B429] text-black shadow-sm">
                          <Gift className="w-3 h-3" />
                          ADMIN TOP-UP
                        </span>
                      ) : (
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase shadow-sm ${
                            isBuy ? 'bg-[#16A34A] text-white' : 'bg-[#DC2626] text-white'
                          }`}
                        >
                          {isBuy ? 'Bought' : 'Sold'}
                        </span>
                      )}
                    </td>

                    {/* DETAILS / STOCK */}
                    <td className="px-3 py-3.5">
                      {isTopup ? (
                        <div>
                          <span className="block text-[15px] font-bold text-[#F0B429] leading-tight">
                            Admin Balance Top-Up
                          </span>
                          <span className="block text-[11px] font-mono text-[#6B7280] dark:text-[#7B82A0] mt-0.5">
                            Cash bonus added by tournament admin
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="block text-[15px] font-medium theme-text-main leading-tight">
                            {tx.stock?.name || tx.stock?.symbol || '—'}
                          </span>
                          <span className="block text-[11px] font-mono text-[#6B7280] dark:text-[#7B82A0] mt-0.5">
                            {tx.stock?.symbol || ''}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* SHARES */}
                    <td className="px-3 py-3.5 text-right font-mono text-[14px] font-bold theme-text-main">
                      {isTopup ? '—' : qty}
                    </td>

                    {/* PRICE EACH */}
                    <td className="px-3 py-3.5 text-right font-mono text-[14px] theme-text-main whitespace-nowrap">
                      {isTopup ? '—' : `${fmt(price)} IC`}
                    </td>

                    {/* TOTAL */}
                    <td className="px-3 py-3.5 text-right font-mono text-[14px] font-bold whitespace-nowrap">
                      {isTopup ? (
                        <span className="text-[#F0B429] font-mono font-extrabold text-[15px]">
                          +{fmt(price)} IC
                        </span>
                      ) : (
                        <span className="theme-text-main">
                          {fmt(qty * price)} <span className="text-[10px] text-[#6B7280] dark:text-[#7B82A0] font-normal">IC</span>
                        </span>
                      )}
                    </td>

                    {/* TIMESTAMP */}
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

      {/* SHOW MORE / SHOW LESS PAGINATION BUTTON */}
      {hasMore && (
        <div className="p-3 text-center border-t theme-border surface-panel">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-[12px] font-mono font-bold text-[#F0B429] hover:bg-[#F0B429]/10 border border-[#F0B429]/30 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <span>{showAll ? 'Show Less Trades' : `Show More (${transactions.length - limit} more trades)`}</span>
            {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      )}
    </section>
  );
}

