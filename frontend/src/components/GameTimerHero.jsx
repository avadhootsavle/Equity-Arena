import React from 'react';
import { Clock, Flame } from 'lucide-react';
import { useSessionClock } from './GameClock';

const two = (n) => String(Math.floor(n)).padStart(2, '0');

export function GameTimerHero({ sessionData }) {
  const { remaining, hasClock, isFinalStretch, isOver, totalSeconds } = useSessionClock(sessionData);

  const isLive = sessionData?.status === 'ACTIVE' && !sessionData?.isTradingLocked;
  const urgent = isFinalStretch || isOver;

  const hrs = hasClock ? two(remaining / 3600) : '00';
  const mins = hasClock ? two((remaining % 3600) / 60) : '00';
  const secs = hasClock ? two(remaining % 60) : '00';

  const total = totalSeconds || (hasClock ? Math.max(remaining, 1) : 1);
  const elapsed = hasClock ? Math.max(0, total - remaining) : 0;
  const percent = Math.max(0, Math.min(100, (elapsed / total) * 100));

  return (
    <section className="rounded-none border border-[var(--border)] bg-[var(--bg-secondary)] p-4 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Header */}
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-[var(--gain)] animate-ping' : 'bg-[var(--text-secondary)]'}`} />
            <h2 className="font-syne font-extrabold text-base uppercase tracking-wider text-[var(--text-primary)]">
              {isOver ? 'SESSION ENDED' : isLive ? 'SESSION LIVE' : 'WAITING FOR SESSION'}
            </h2>
          </div>
          <p className="font-sans text-xs text-[var(--text-secondary)] mt-0.5">
            {isOver ? 'Trading has ended. Holdings liquidated to cash.' : isLive ? 'Real-time order execution active.' : 'Trading unlocks when admin starts session.'}
          </p>
        </div>

        {/* Timer Display (JetBrains Mono) */}
        <div className="flex items-center gap-3">
          {urgent && <Flame className="w-5 h-5 text-[var(--loss)] animate-bounce" />}
          <div className={`font-mono text-3xl font-extrabold tracking-widest ${
            urgent ? 'text-[var(--loss)] animate-urgent-pulse' : 'text-[var(--accent-gold)]'
          }`}>
            {hrs}:{mins}:{secs}
          </div>
        </div>
      </div>

      {/* Progress Tape Bar */}
      {hasClock && (
        <div className="w-full mt-3 pt-3 border-t border-[var(--border)]">
          <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-secondary)] mb-1">
            <span>SESSION PROGRESS</span>
            <span>{Math.round(percent)}%</span>
          </div>
          <div className="w-full h-1.5 bg-[var(--bg-tertiary)] overflow-hidden rounded-none border border-[var(--border)]">
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{
                width: `${percent}%`,
                backgroundColor: urgent ? 'var(--loss)' : 'var(--accent-gold)'
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
