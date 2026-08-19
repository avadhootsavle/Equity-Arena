import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Radio } from 'lucide-react';
import { useSessionClock } from './GameClock';

const two = (n) => String(Math.floor(n)).padStart(2, '0');
const EASE = [0.22, 1, 0.36, 1];

/* ------------------------------------------------------------------
   A single flip-style digit pair
   ------------------------------------------------------------------ */
function Unit({ value, label, urgent }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          padding: '10px 16px',
          minWidth: 96,
          backgroundColor: urgent
            ? 'color-mix(in srgb, var(--loss-red) 12%, var(--bg-input))'
            : 'var(--bg-input)',
          border: `1px solid ${
            urgent
              ? 'color-mix(in srgb, var(--loss-red) 42%, transparent)'
              : 'var(--border-card)'
          }`,
          boxShadow: urgent
            ? '0 0 34px -12px var(--glow-red)'
            : '0 0 34px -14px var(--glow-accent)'
        }}
      >
        {/* soft top highlight */}
        <span
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${
              urgent ? 'var(--loss-red)' : 'var(--accent)'
            }, transparent)`,
            opacity: 0.5
          }}
        />

        {/* each new value slides in — a real state change, not a loop */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={value}
            initial={{ y: '-55%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            exit={{ y: '55%', opacity: 0, position: 'absolute' }}
            transition={{ duration: 0.32, ease: EASE }}
            className="font-mono font-extrabold tabular-nums text-center"
            style={{
              fontSize: 46,
              lineHeight: 1.05,
              color: urgent ? 'var(--loss-red)' : 'var(--text-main)'
            }}
          >
            {value}
          </motion.div>
        </AnimatePresence>
      </div>

      <span
        className="text-[10px] font-mono tracking-[0.24em]"
        style={{ color: urgent ? 'var(--loss-red)' : 'var(--text-dim)' }}
      >
        {label}
      </span>
    </div>
  );
}

function Separator({ urgent }) {
  return (
    <motion.span
      className="font-mono font-extrabold self-start select-none"
      style={{
        fontSize: 34,
        marginTop: 16,
        color: urgent ? 'var(--loss-red)' : 'var(--text-dim)'
      }}
      animate={{ opacity: [1, 0.25, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      :
    </motion.span>
  );
}

/* ------------------------------------------------------------------
   Game timer hero
   ------------------------------------------------------------------ */
export function GameTimerHero({ sessionData }) {
  const { remaining, hasClock, isFinalStretch, isOver, totalSeconds } =
    useSessionClock(sessionData);

  const isLive = sessionData?.status === 'ACTIVE' && !sessionData?.isTradingLocked;
  const urgent = isFinalStretch || isOver;

  const hrs = hasClock ? two(remaining / 3600) : '--';
  const mins = hasClock ? two((remaining % 3600) / 60) : '--';
  const secs = hasClock ? two(remaining % 60) : '--';

  const total = totalSeconds || (hasClock ? Math.max(remaining, 1) : 1);
  const elapsed = hasClock ? Math.max(0, total - remaining) : 0;
  const percent = Math.max(0, Math.min(100, (elapsed / total) * 100));

  const accent = urgent ? 'var(--loss-red)' : 'var(--accent)';

  return (
    <section
      className="surface relative overflow-hidden"
      aria-label="Game timer"
      style={{ boxShadow: 'var(--card-shadow)' }}
    >
      {/* ambient wash, tinted by urgency */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: urgent
            ? 'radial-gradient(70% 140% at 50% 0%, color-mix(in srgb, var(--loss-red) 14%, transparent) 0%, transparent 70%)'
            : 'radial-gradient(70% 140% at 50% 0%, color-mix(in srgb, var(--accent) 11%, transparent) 0%, transparent 70%)'
        }}
        transition={{ duration: 0.8, ease: EASE }}
      />

      <div className="relative flex flex-col lg:flex-row items-center justify-between gap-6 px-6 py-6">
        {/* ---- Status ---- */}
        <div className="text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-2">
            <motion.span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{
                backgroundColor: isLive ? 'var(--gain-green)' : 'var(--text-dim)'
              }}
              animate={{
                boxShadow: isLive
                  ? [
                      '0 0 0 0px color-mix(in srgb, var(--gain-green) 40%, transparent)',
                      '0 0 0 7px rgba(0,0,0,0)'
                    ]
                  : '0 0 0 0px transparent'
              }}
              transition={
                isLive
                  ? { duration: 1.8, repeat: Infinity, ease: 'easeOut' }
                  : { duration: 0.3 }
              }
            />
            <h2 className="text-[17px] font-heading font-extrabold tracking-wide theme-text-main">
              {isOver ? 'GAME OVER' : isLive ? 'MARKET LIVE' : 'MARKET CLOSED'}
            </h2>
          </div>

          <p className="text-[13px] theme-text-muted mt-1.5">
            {isOver
              ? 'Trading has finished for this session'
              : isLive
              ? 'Prices are moving in real-time'
              : 'Trading opens when your host starts the game'}
          </p>

          <AnimatePresence>
            {isFinalStretch && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--loss-red) 12%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--loss-red) 36%, transparent)'
                }}
              >
                <Flame className="w-4 h-4" style={{ color: 'var(--loss-red)' }} />
                <span
                  className="text-[12.5px] font-heading font-bold"
                  style={{ color: 'var(--loss-red)' }}
                >
                  Final minutes — your stocks turn back into cash soon
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ---- Clock ---- */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex items-center gap-1.5 text-[11px] font-mono tracking-[0.26em]"
            style={{ color: urgent ? 'var(--loss-red)' : 'var(--text-dim)' }}
          >
            <Radio className="w-3 h-3" />
            {isOver ? 'TIME IS UP' : 'TIME REMAINING'}
          </div>

          <div className="flex items-start gap-2.5">
            <Unit value={hrs} label="HRS" urgent={urgent} />
            <Separator urgent={urgent} />
            <Unit value={mins} label="MINS" urgent={urgent} />
            <Separator urgent={urgent} />
            <Unit value={secs} label="SECS" urgent={urgent} />
          </div>
        </div>
      </div>

      {/* ---- Progress ---- */}
      {hasClock && (
        <div className="relative px-6 pb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.16em] theme-text-dim">
              Game progress
            </span>
            <span className="text-[12.5px] font-mono font-bold theme-text-main">
              {Math.round(percent)}% done
            </span>
          </div>

          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--bg-input)' }}
            role="progressbar"
            aria-valuenow={Math.round(percent)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Game progress"
          >
            <motion.div
              className="h-full rounded-full relative"
              style={{
                background: `linear-gradient(90deg, color-mix(in srgb, ${accent} 55%, transparent), ${accent})`
              }}
              initial={false}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.8, ease: EASE }}
            >
              <span
                className="absolute right-0 top-0 bottom-0 w-6 rounded-full"
                style={{
                  background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${accent} 70%, white))`
                }}
              />
            </motion.div>
          </div>
        </div>
      )}
    </section>
  );
}
