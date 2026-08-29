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
    const duration = 7000; // 7 seconds auto-dismiss for easy reading

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
    <div className="fixed top-16 right-4 z-50 max-w-md w-full animate-slide-in-right pointer-events-auto shadow-2xl">
      <div className="theme-bg-card border-2 border-[color-mix(in_srgb,var(--accent)_70%,transparent)] rounded-xl p-4 sm:p-5 shadow-2xl relative overflow-hidden transition-all backdrop-blur-md">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b theme-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] rounded-lg text-[var(--accent)]">
              <Newspaper className="w-4 h-4" />
            </div>
            <span className="text-xs font-black font-heading text-[var(--accent)] uppercase tracking-wider">
              BREAKING NEWS
            </span>
            {news.stockSymbol && (
              <span className="px-2 py-0.5 bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-[var(--accent)] font-mono font-extrabold text-xs rounded-md border border-[color-mix(in_srgb,var(--accent)_40%,transparent)]">
                ${news.stockSymbol}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono theme-text-dim">
              {new Date(news.timestamp || Date.now()).toLocaleTimeString()}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-md theme-bg-panel hover:theme-bg-card-hover theme-text-muted hover:theme-text-main transition-colors min-h-[28px] min-w-[28px] flex items-center justify-center btn-terminal cursor-pointer"
              title="Dismiss Toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Content — Bigger Font & Highly Readable */}
        <div className="py-3">
          <p className="text-sm sm:text-base font-bold theme-text-main leading-snug font-sans">
            "{news.message}"
          </p>
        </div>

        {/* Footer info pill */}
        <div className="flex items-center justify-between text-[11px] font-mono theme-text-dim pt-2 border-t theme-border">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[var(--accent)] animate-pulse" />
            <span>Just broadcasted</span>
          </div>
          <span className="text-[10px] text-[var(--gain-green)] font-extrabold uppercase tracking-wider">LIVE ALERT</span>
        </div>

        {/* Auto-Dismiss Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-900/60">
          <div
            className="bg-[var(--accent)] h-full transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

      </div>
    </div>
  );
}
