import React, { useEffect, useState } from 'react';
import { Newspaper, X, Radio } from 'lucide-react';
import { playNewsChime } from '../services/soundService';

export function NewsToast({ news, onClose }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!news) return;

    // Trigger professional UI notification chime
    playNewsChime();

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
    <div className="fixed top-16 right-4 z-50 max-w-sm w-full animate-fadeIn pointer-events-auto shadow-2xl">
      <div className="theme-bg-card border border-[#D4A017]/60 rounded-[6px] p-4 shadow-xl relative overflow-hidden transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b theme-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#D4A017]/10 border border-[#D4A017]/30 rounded-[4px] text-[#D4A017]">
              <Newspaper className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold font-heading text-[#D4A017] uppercase tracking-wider">
              ANALYST WIRE
            </span>
            {news.stockSymbol && (
              <span className="px-1.5 py-0.2 bg-[#D4A017]/20 text-[#D4A017] font-mono font-extrabold text-[10px] rounded-[3px] border border-[#D4A017]/40">
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
            <Radio className="w-3 h-3 text-[#D4A017] animate-pulse" />
            <span>Market impact applied</span>
          </div>
          <span className="text-[9px] text-[#1DB954] font-bold">LIVE WIRE</span>
        </div>

        {/* Auto-Dismiss Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900/40">
          <div
            className="bg-[#D4A017] h-full transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

      </div>
    </div>
  );
}
