import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const two = (n) => String(Math.floor(n)).padStart(2, '0');

/**
 * Counts down the session clock.
 *
 * Seeded from the server's remainingSeconds and re-derived from that sync
 * point each tick, so a backgrounded tab can't drift out of step.
 */
export function useSessionClock(sessionData) {
  const [remaining, setRemaining] = useState(sessionData?.remainingSeconds ?? null);
  const baseRef = useRef({ seconds: null, at: Date.now() });

  useEffect(() => {
    if (sessionData?.remainingSeconds == null) return;
    baseRef.current = { seconds: sessionData.remainingSeconds, at: Date.now() };
    setRemaining(sessionData.remainingSeconds);
  }, [sessionData?.remainingSeconds, sessionData?.status]);

  useEffect(() => {
    if (baseRef.current.seconds == null) return;
    if (sessionData?.status === 'PAUSED' || sessionData?.isPaused) {
      setRemaining(sessionData?.remainingSeconds ?? baseRef.current.seconds);
      return;
    }
    const id = setInterval(() => {
      const { seconds, at } = baseRef.current;
      if (seconds == null) return;
      setRemaining(Math.max(0, seconds - Math.floor((Date.now() - at) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [sessionData?.remainingSeconds, sessionData?.status, sessionData?.isPaused]);

  const totalSeconds = sessionData?.durationMinutes
    ? sessionData.durationMinutes * 60
    : null;

  return {
    remaining,
    hasClock: remaining != null,
    isFinalStretch: remaining != null && remaining <= 300 && remaining > 0,
    isOver: remaining === 0,
    isPaused: sessionData?.status === 'PAUSED' || sessionData?.isPaused === true,
    totalSeconds
  };
}

/* ------------------------------------------------------------------
   Segmented digital clock
   ------------------------------------------------------------------ */
function Segment({ value, label, urgent, size, isPaused }) {
  const big = size === 'lg';

  return (
    <div className="flex flex-col items-center">
      <div
        className="rounded-lg flex items-center justify-center tabular-nums font-mono font-bold"
        style={{
          minWidth: big ? 68 : 56,
          padding: big ? '8px 12px' : '6px 10px',
          fontSize: big ? 40 : 32,
          lineHeight: 1,
          color: isPaused ? 'var(--accent)' : urgent ? 'var(--loss-red)' : 'var(--text-main)',
          backgroundColor: isPaused
            ? 'color-mix(in srgb, var(--accent) 15%, transparent)'
            : urgent
            ? 'color-mix(in srgb, var(--loss-red) 12%, transparent)'
            : 'var(--bg-input)',
          border: `1px solid ${
            isPaused
              ? 'color-mix(in srgb, var(--accent) 40%, transparent)'
              : urgent
              ? 'color-mix(in srgb, var(--loss-red) 38%, transparent)'
              : 'var(--border-card)'
          }`,
          boxShadow: urgent
            ? '0 0 20px -8px var(--glow-red)'
            : '0 0 20px -12px var(--glow-accent)'
        }}
      >
        {value}
      </div>
      <span
        className="text-[10px] font-mono uppercase tracking-[0.18em] mt-1 text-center w-full block"
        style={{ color: isPaused ? 'var(--accent)' : urgent ? 'var(--loss-red)' : 'var(--text-dim)' }}
      >
        {label}
      </span>
    </div>
  );
}

function Colon({ urgent, isPaused }) {
  return (
    <span
      className="font-mono font-extrabold self-start"
      style={{
        marginTop: 8,
        fontSize: 20,
        color: isPaused ? 'var(--accent)' : urgent ? 'var(--loss-red)' : 'var(--text-dim)'
      }}
    >
      :
    </span>
  );
}

export function GameClock({ sessionData, size = 'md', title = 'TIME LEFT' }) {
  const { remaining, hasClock, isFinalStretch, isOver, isPaused } = useSessionClock(sessionData);

  const hrs = hasClock ? two(remaining / 3600) : '--';
  const mins = hasClock ? two((remaining % 3600) / 60) : '--';
  const secs = hasClock ? two(remaining % 60) : '--';

  const urgent = isFinalStretch || isOver;

  return (
    <motion.div
      className="inline-flex flex-col items-center rounded-xl px-3 py-2"
      animate={{
        backgroundColor: isFinalStretch
          ? 'color-mix(in srgb, var(--loss-red) 8%, transparent)'
          : 'rgba(0,0,0,0)'
      }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isPaused ? 'paused' : isFinalStretch ? 'final' : isOver ? 'over' : 'normal'}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.25 }}
          className="text-[12px] font-mono uppercase tracking-[0.2em] mb-1.5"
          style={{ color: isPaused ? 'var(--accent)' : urgent ? 'var(--loss-red)' : 'var(--text-dim)' }}
        >
          {isPaused ? 'MARKET ON BREAK' : isOver ? 'GAME OVER' : isFinalStretch ? 'FINAL MINUTES' : title}
        </motion.div>
      </AnimatePresence>

      <motion.div
        className="flex items-start gap-1.5"
        animate={
          isFinalStretch ? { opacity: [1, 0.78, 1] } : { opacity: 1 }
        }
        transition={
          isFinalStretch
            ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.3 }
        }
      >
        <Segment value={hrs} label="HRS" urgent={urgent} isPaused={isPaused} size={size} />
        <Colon urgent={urgent} isPaused={isPaused} />
        <Segment value={mins} label="MINS" urgent={urgent} isPaused={isPaused} size={size} />
        <Colon urgent={urgent} isPaused={isPaused} />
        <Segment value={secs} label="SECS" urgent={urgent} isPaused={isPaused} size={size} />
      </motion.div>
    </motion.div>
  );
}

export function BreakCountdownTimer({ sessionData, size = 'lg' }) {
  const breakEndMs = sessionData?.breakEndTime ? new Date(sessionData.breakEndTime).getTime() : null;
  const initialSeconds = sessionData?.breakRemainingSeconds ?? (sessionData?.breakDurationMinutes || 10) * 60;
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds, sessionData?.breakEndTime]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (breakEndMs) {
        setSecondsLeft(Math.max(0, Math.floor((breakEndMs - Date.now()) / 1000)));
      } else {
        setSecondsLeft((prev) => Math.max(0, prev - 1));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [breakEndMs]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  if (size === 'sm' || size === 'compact') {
    return (
      <div className="flex items-center gap-1 font-mono font-bold">
        <div className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm tracking-wider tabular-nums shadow-inner">
          {mins}:{secs}
        </div>
      </div>
    );
  }

  const isXl = size === 'xl';

  return (
    <div className="flex items-center justify-center gap-3 select-none font-mono">
      {/* Minutes ledger digit */}
      <div className="flex flex-col items-center">
        <div className={`rounded-sm bg-[#070A10] border-2 border-white/[0.15] text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
          isXl ? 'px-6 py-4 min-w-[110px]' : 'px-3.5 py-2 min-w-[70px]'
        }`}>
          <span className={`font-mono font-black tracking-tight text-[#F0B429] tabular-nums ${
            isXl ? 'text-5xl sm:text-6xl md:text-7xl' : 'text-3xl sm:text-4xl'
          }`}>
            {mins}
          </span>
        </div>
        <span className={`font-mono tracking-[0.25em] text-slate-400 font-bold uppercase mt-2 ${
          isXl ? 'text-[11px]' : 'text-[9px]'
        }`}>
          MINUTES
        </span>
      </div>

      {/* Ticker separator */}
      <div className={`flex flex-col items-center justify-center pb-5 text-amber-500/60 ${
        isXl ? 'text-4xl sm:text-5xl' : 'text-2xl'
      }`}>
        <span className="font-mono font-black animate-pulse">:</span>
      </div>

      {/* Seconds ledger digit */}
      <div className="flex flex-col items-center">
        <div className={`rounded-sm bg-[#070A10] border-2 border-white/[0.15] text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
          isXl ? 'px-6 py-4 min-w-[110px]' : 'px-3.5 py-2 min-w-[70px]'
        }`}>
          <span className={`font-mono font-black tracking-tight text-[#F0B429] tabular-nums ${
            isXl ? 'text-5xl sm:text-6xl md:text-7xl' : 'text-3xl sm:text-4xl'
          }`}>
            {secs}
          </span>
        </div>
        <span className={`font-mono tracking-[0.25em] text-slate-400 font-bold uppercase mt-2 ${
          isXl ? 'text-[11px]' : 'text-[9px]'
        }`}>
          SECONDS
        </span>
      </div>
    </div>
  );
}
