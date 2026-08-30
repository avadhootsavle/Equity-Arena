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

export function BreakCountdownTimer({ sessionData }) {
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

  return (
    <div className="font-mono text-xl sm:text-2xl font-extrabold text-amber-400 bg-amber-500/20 border border-amber-500/40 px-4 py-2 rounded-xl inline-flex items-center gap-2 shadow-inner">
      <span>BREAK ENDS IN</span>
      <span className="text-amber-300 font-black tracking-widest">{mins}:{secs}</span>
    </div>
  );
}
