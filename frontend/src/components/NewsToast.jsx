import React, { useEffect, useState, useRef } from 'react';
import { Newspaper, X, Radio, ArrowRight, ShieldAlert } from 'lucide-react';
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
    const duration = 12000; // 12 seconds so traders digest the news impact

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
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-4 animate-bounce-subtle pointer-events-auto">
      {/* Outer Glowing High-Impact Glass Card */}
      <div className="relative rounded-2xl border-2 border-[#F0B429] bg-[#0F1117]/95 backdrop-blur-2xl p-5 sm:p-6 shadow-[0_0_50px_rgba(240,180,41,0.35)] overflow-hidden">
        {/* Pulsing Accent Glow Backing */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#F0B429]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Strip */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#F0B429]/20 border border-[#F0B429]/50 rounded-lg text-[#F0B429] animate-pulse">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black font-mono tracking-widest text-[#F0B429] uppercase px-2 py-0.5 rounded bg-[#F0B429]/15 border border-[#F0B429]/40">
                  MARKET BREAKING NEWS
                </span>
                {news.stockSymbol && (
                  <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 font-mono font-extrabold text-xs rounded border border-amber-400/40">
                    ${news.stockSymbol}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                Broadcasted at {new Date(news.timestamp || Date.now()).toLocaleTimeString()}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Dismiss News Alert"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main News Content — Large Bold Font for High Psychological Impact */}
        <div className="py-4 space-y-2">
          <h4 className="text-sm font-mono text-amber-300 font-bold uppercase tracking-wide flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            ATTENTION TRADERS: MARKET MOVING ANNOUNCEMENT
          </h4>
          <p className="text-base sm:text-lg font-extrabold text-white leading-relaxed font-sans bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/60 shadow-inner">
            "{news.message}"
          </p>
        </div>

        {/* Action / Dismiss CTA Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-3">
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
            Impact live on trading floor
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F0B429] to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <span>I HAVE READ THIS NEWS</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Auto-Dismiss Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-950/80">
          <div
            className="bg-gradient-to-r from-[#F0B429] to-amber-400 h-full transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
