import React from 'react';
import { TrendingUp, TrendingDown, Flame } from 'lucide-react';

export function LiveTickerMarquee({ stocks, onSelectStock }) {
  if (!stocks || stocks.length === 0) return null;

  // Duplicate list to create seamless infinite loop effect
  const tickerItems = [...stocks, ...stocks];

  return (
    <div className="w-full theme-bg-card border-y theme-border overflow-hidden py-2 relative shadow-inner">
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[var(--bg-card)] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[var(--bg-card)] to-transparent z-10 pointer-events-none" />

      <div className="flex items-center">
        <div className="flex-shrink-0 px-3 py-1 bg-amber-500/20 text-amber-400 font-extrabold text-[10px] uppercase font-mono tracking-wider flex items-center gap-1 border-r theme-border z-20">
          <Flame className="w-3.5 h-3.5 animate-pulse text-amber-400" />
          <span>TAPE LIVE</span>
        </div>

        <div className="overflow-hidden flex-1">
          <div className="animate-marquee flex items-center gap-6 whitespace-nowrap pl-4">
            {tickerItems.map((s, idx) => {
              const isPositive = s.percentChange >= 0;
              return (
                <div
                  key={`${s.id}-${idx}`}
                  onClick={() => onSelectStock && onSelectStock(s)}
                  className="inline-flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity text-xs select-none"
                >
                  <span className="font-bold font-mono theme-text-main">{s.symbol}</span>
                  <span className="font-mono text-slate-300 font-medium">{s.currentPrice.toFixed(2)} IC</span>
                  <span className={`inline-flex items-center text-[10px] font-extrabold font-mono px-1.5 py-0.2 rounded ${
                    isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                    {isPositive ? '+' : ''}{s.percentChange.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
