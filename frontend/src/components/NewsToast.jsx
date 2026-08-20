import React, { useEffect, useState, useRef } from 'react';
import { Newspaper, X, Radio } from 'lucide-react';
import { playNewsChime } from '../services/soundService';

export function NewsToast({ news, onClose }) {
  const [progress, setProgress] = useState(100);
  const playedRef = useRef(null);

  useEffect(() => {
    if (!news) return;

    // Trigger notification chime strictly ONCE per unique news item
    const newsKey = news.id || `${news.timestamp}-${news.message}`;
    if (playedRef.current !== newsKey) {
      playedRef.current = newsKey;
      playNewsChime();
    }

    const startTime = Date.now();
    const duration = 5500; // 5.5 seconds auto-dismiss

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPercent = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remainingPercent);

      if (elapsed >= duration) {
        clearInterval(timer);
        onClose();
      }
    }, 50);

    return () => clearInterval(timer);
  }, [news, onClose]);

  if (!news) return null;

  return (
    <div className="fixed top-16 right-4 z-50 max-w-sm w-full animate-slide-in-right pointer-events-auto shadow-2xl">
      <div className="theme-bg-card border border-[color-mix(in_srgb,var(--accent)_60%,transparent)] rounded-[6px] p-4 shadow-xl relative overflow-hidden transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b theme-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] rounded-[4px] text-[var(--accent)]">
              <Newspaper className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold font-heading text-[var(--accent)] uppercase tracking-wider">
              BREAKING NEWS
            </span>
            {news.stockSymbol && (
              <span className="px-1.5 py-0.2 bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-[var(--accent)] font-mono font-extrabold text-[10px] rounded-[3px] border border-[color-mix(in_srgb,var(--accent)_40%,transparent)]">
                ${news.stockSymbol}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono theme-text-dim">
              {new Date(news.timestamp || Date.now()).toLocaleTimeString()}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-[3px] theme-bg-panel hover:theme-bg-card-hover theme-text-muted hover:theme-text-main transition-colors min-h-[28px] min-w-[28px] flex items-center justify-center btn-terminal"
              title="Dismiss Toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Message Content */}
        <div className="py-2.5">
          <p className="text-xs font-semibold theme-text-main leading-relaxed font-mono">
            "{news.message}"
          </p>
        </div>

        {/* Footer info pill */}
        <div className="flex items-center justify-between text-[10px] font-mono theme-text-dim pt-1 border-t theme-border">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-[var(--accent)] animate-pulse" />
            <span>Just broadcasted</span>
          </div>
          <span className="text-[9px] text-[var(--gain-green)] font-bold">JUST NOW</span>
        </div>

        {/* Auto-Dismiss Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900/40">
          <div
            className="bg-[var(--accent)] h-full transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

      </div>
    </div>
  );
}
