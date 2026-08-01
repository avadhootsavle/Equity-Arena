import React, { useEffect, useState } from 'react';
import { Radio, X, Sparkles } from 'lucide-react';

export function NewsToast({ news, onClose }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!news) return;

    const startTime = Date.now();
    const duration = 6000; // 6 seconds auto-dismiss

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
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full glass-panel p-4 rounded-2xl border border-amber-500/40 shadow-2xl shadow-amber-500/10 animate-slideUp">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 flex-shrink-0 animate-pulse">
          <Radio className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              BREAKING NEWS BROADCAST
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {news.stockSymbol && (
            <span className="inline-block mt-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px] rounded border border-amber-500/30">
              ${news.stockSymbol}
            </span>
          )}

          <p className="text-xs text-white font-medium mt-1 leading-relaxed">
            {news.message}
          </p>
        </div>
      </div>

      {/* Auto-dismiss Progress Bar */}
      <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
        <div
          className="bg-amber-400 h-full transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
