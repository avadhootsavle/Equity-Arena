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
    <div className="fixed top-14 right-4 sm:right-6 z-50 max-w-md w-full animate-slide-in-right pointer-events-auto">
      {/* Outer Glow Wrapper */}
      <div className="relative group rounded-2xl p-[1px] bg-gradient-to-b from-[#F0B429]/60 via-[#F0B429]/20 to-[#2D3142]/40 shadow-[0_16px_48px_rgba(0,0,0,0.7),0_0_24px_rgba(240,180,41,0.15)]">
        
        {/* Card Body with Glassmorphic backdrop */}
        <div className="bg-[#12161F]/95 backdrop-blur-xl rounded-2xl p-4 sm:p-5 relative overflow-hidden transition-all">
          
          {/* Subtle Ambient Radial Highlight in top-left */}
          <div className="absolute -top-12 -left-12 w-36 h-36 bg-[#F0B429]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Header Row */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#21262D]">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Pulsing Icon Capsule */}
              <div className="relative flex items-center justify-center">
                <span className="absolute -inset-0.5 rounded-lg bg-[#F0B429]/30 blur-xs animate-pulse" />
                <div className="relative w-7 h-7 rounded-lg bg-[#F0B429]/15 border border-[#F0B429]/40 flex items-center justify-center text-[#F0B429]">
                  <Newspaper className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Title & Live Badge */}
              <div className="flex items-center gap-2 truncate">
                <span className="text-[11px] font-black tracking-widest text-[#F0B429] uppercase font-mono">
                  BREAKING NEWS
                </span>
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-ping" />
                  <span>WIRE</span>
                </span>
                {news.stockSymbol && (
                  <span className="px-2 py-0.5 bg-[#F0B429]/15 text-[#F0B429] font-mono font-black text-[11px] rounded-md border border-[#F0B429]/30">
                    {news.stockSymbol}
                  </span>
                )}
              </div>
            </div>

            {/* Timestamp + Dismiss Button */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono text-[#8B949E]">
                {new Date(news.timestamp || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <button
                onClick={onClose}
                className="w-6 h-6 rounded-lg bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] text-[#8B949E] hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-xs"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Headline Message Body */}
          <div className="py-3.5">
            <p className="text-[13.5px] sm:text-[14.5px] font-semibold text-[#E6EDF3] leading-relaxed tracking-normal font-sans">
              "{news.message}"
            </p>
          </div>

          {/* Footer Status Strip */}
          <div className="flex items-center justify-between text-[11px] font-mono text-[#8B949E] pt-2.5 border-t border-[#21262D]">
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-[#F0B429] animate-pulse" />
              <span className="text-slate-400">Trading Desk Broadcast</span>
            </div>
            <span className="text-[10px] text-[#F0B429] font-bold tracking-wider">
              AUTO-DISMISS IN {Math.ceil((progress / 100) * 7)}S
            </span>
          </div>

          {/* Bottom Progress Bar Indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#21262D]">
            <div
              className="h-full bg-gradient-to-r from-[#F0B429] via-[#FBBF24] to-[#F59E0B] transition-all duration-75 ease-linear shadow-[0_0_8px_rgba(240,180,41,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>

        </div>
      </div>
    </div>
  );
}

export function RumorToast({ rumor, onClose }) {
  const [progress, setProgress] = useState(100);
  const playedRef = useRef(null);

  useEffect(() => {
    if (!rumor) return;

    const rumorKey = rumor.id || `${rumor.timestamp}-${rumor.headline}`;
    if (playedRef.current !== rumorKey) {
      playedRef.current = rumorKey;
      playNewsChime();
    }

    const duration = (rumor.expiresInSeconds || 25) * 1000;
    const startTime = Date.now();

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
  }, [rumor, onClose]);

  if (!rumor) return null;

  return (
    <div className="fixed top-14 right-4 sm:right-6 z-50 max-w-md w-full animate-slide-in-right pointer-events-auto">
      {/* Outer Neo-Brutal Glow Wrapper */}
      <div className="relative group rounded-2xl border-2 border-[#EC4899] bg-[#140D1B] p-4 sm:p-5 shadow-[6px_6px_0px_#000000] overflow-hidden">
        
        {/* Subtle Ambient Radial Highlight */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#EC4899]/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header Row */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#EC4899]/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#EC4899] text-black font-black flex items-center justify-center border border-black shadow-[2px_2px_0px_#000000] text-xs">
              <Radio className="w-4 h-4 text-black" />
            </div>

            <div className="flex items-center gap-2 truncate">
              <span className="text-[11px] font-black tracking-widest text-[#F472B6] uppercase font-mono">
                INSIDER RUMOR LEAK
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#EC4899] text-black font-mono">
                CONFIDENTIAL
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-6 h-6 rounded-lg bg-black/40 hover:bg-black/80 border border-white/20 text-slate-300 hover:text-white transition-all flex items-center justify-center cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Message Body */}
        <div className="py-3">
          <p className="text-[13.5px] sm:text-[14.5px] font-bold text-white leading-relaxed font-sans">
            "{rumor.headline}"
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs font-mono text-[#F472B6]">
            <span>Sector: <strong>{rumor.sector}</strong></span>
            {rumor.effectPercent && (
              <span className={rumor.effectPercent >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                ({rumor.effectPercent >= 0 ? '+' : ''}{rumor.effectPercent}%)
              </span>
            )}
          </div>
        </div>

        {/* Status Strip */}
        <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-[#EC4899]/30">
          <span className="text-slate-400 text-[10px] uppercase font-semibold">
            Confidential to select traders. Public in:
          </span>
          <span className="text-[11px] text-[#F472B6] font-black tracking-wider">
            {Math.ceil((progress / 100) * (rumor.expiresInSeconds || 25))}s
          </span>
        </div>

        {/* Bottom Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/50">
          <div
            className="h-full bg-gradient-to-r from-[#EC4899] to-[#F43F5E] transition-all duration-75 ease-linear shadow-[0_0_8px_rgba(236,72,153,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>

      </div>
    </div>
  );
}
