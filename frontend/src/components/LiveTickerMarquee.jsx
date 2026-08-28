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
        <div
          className="flex-shrink-0 px-3 py-1 font-extrabold text-[10px] uppercase font-mono tracking-wider flex items-center gap-1 border-r theme-border z-20"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)',
            color: 'var(--accent)'
          }}
        >
          <Flame className="w-3.5 h-3.5 animate-pulse" />
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
                  className="inline-flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity select-none"
                >
                  <span className="text-[13px] font-semibold font-mono theme-text-main">{s.symbol}</span>
                  <span className="text-[13px] font-mono theme-text-muted">{s.currentPrice.toFixed(2)} IC</span>
                  <span
                    className="inline-flex items-center text-[12px] font-medium font-mono px-1.5 py-0.5 rounded"
                    style={{
                      color: isPositive ? 'var(--gain-green)' : 'var(--loss-red)',
                      backgroundColor: `color-mix(in srgb, ${
                        isPositive ? 'var(--gain-green)' : 'var(--loss-red)'
                      } 14%, transparent)`
                    }}
                  >
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
