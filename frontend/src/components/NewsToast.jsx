import React, { useEffect, useState } from 'react';
import { Newspaper, X } from 'lucide-react';
import { playNewsChime } from '../services/soundService';

export function NewsToast({ news, onClose }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!news) return;

    playNewsChime();

    const startTime = Date.now();
    const duration = 6000;

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
    <div className="fixed top-16 right-4 z-50 max-w-sm w-full animate-fadeIn pointer-events-auto">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] border-l-4 border-l-[var(--accent-gold)] p-3.5 shadow-2xl relative overflow-hidden rounded-none">
        
        {/* Eyebrow Label */}
        <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border)]">
          <div className="flex items-center gap-1.5">
            <Newspaper className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
            <span className="font-sans font-extrabold text-[10px] uppercase tracking-wider text-[var(--accent-gold)]">
              MARKET UPDATE
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-[var(--border)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-none"
            title="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Content */}
        <div className="py-2">
          <p className="font-sans text-xs font-medium text-[var(--text-primary)] leading-relaxed">
            {news.message}
          </p>
        </div>

        {/* Timestamp */}
        <div className="text-[9px] font-mono text-[var(--text-secondary)] pt-1 border-t border-[var(--border)] text-right">
          {new Date(news.timestamp || Date.now()).toLocaleTimeString()}
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--bg-tertiary)]">
          <div
            className="bg-[var(--accent-gold)] h-full transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

      </div>
    </div>
  );
}
