import React from 'react';
import { History } from 'lucide-react';

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
   My Recent Trades
   ------------------------------------------------------------------ */
export function MyTrades({ transactions = [], limit = 6, title = 'My Recent Trades' }) {
  const rows = transactions.slice(0, limit);

  return (
    <section className="surface overflow-hidden" style={{ boxShadow: 'var(--card-shadow)' }}>
      <div className="px-4 py-3.5">
        <h3 className="text-[15px] font-heading font-bold theme-text-main flex items-center gap-2">
          <History className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          {title}
        </h3>
        <p className="text-[11px] theme-text-muted mt-0.5">
          Every buy and sell you've made this game
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="theme-text-dim text-[11px] border-b theme-border whitespace-nowrap">
              <th className="text-left font-normal px-4 py-2">Bought / Sold</th>
              <th className="text-left font-normal px-3 py-2">Stock</th>
              <th className="text-right font-normal px-3 py-2">Shares</th>
              <th className="text-right font-normal px-3 py-2">Price each</th>
              <th className="text-right font-normal px-3 py-2">Total</th>
              <th className="text-right font-normal px-4 py-2">When</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center">
                  <div className="text-[13px] theme-text-main font-semibold">
                    No trades yet
                  </div>
                  <div className="text-[11.5px] theme-text-muted mt-1">
                    Your buys and sells will show up here
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((tx, i) => {
                const isBuy = tx.type === 'BUY';
                const colour = isBuy ? 'var(--gain-green)' : 'var(--loss-red)';
                const qty = tx.quantity || 0;
                const price = tx.price || 0;

                return (
                  <tr
                    key={tx.id || `trade-${i}`}
                    className="border-b theme-border last:border-0 theme-bg-card-hover transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <span
                        className="px-2 py-0.5 rounded text-[10.5px] font-bold"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${colour} 16%, transparent)`,
                          color: colour
                        }}
                      >
                        {isBuy ? 'Bought' : 'Sold'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="block font-semibold theme-text-main leading-tight">
                        {tx.stock?.name || tx.stock?.symbol || '—'}
                      </span>
                      <span className="block text-[10px] font-mono theme-text-dim leading-tight mt-0.5">
                        {tx.stock?.symbol || ''}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono theme-text-main">
                      {qty}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono theme-text-main whitespace-nowrap">
                      {fmt(price)} <span className="theme-text-dim">IC</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold theme-text-main whitespace-nowrap">
                      {fmt(qty * price)} <span className="theme-text-dim font-normal">IC</span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono theme-text-muted whitespace-nowrap">
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
