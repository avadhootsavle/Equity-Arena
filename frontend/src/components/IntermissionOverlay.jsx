import React, { useState } from 'react';
import { Coffee, Shield, CheckCircle2, Lock, Terminal, Activity, FileText, ChevronRight } from 'lucide-react';
import { BreakCountdownTimer } from './GameClock';

export function IntermissionOverlay({ sessionData, onReviewStrategy }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [showTacticalChecklist, setShowTacticalChecklist] = useState(false);

  // If dismissed temporarily to review strategy, or if session isn't paused, do not render
  if (!sessionData?.isPaused && sessionData?.status !== 'PAUSED') return null;
  if (acknowledged) {
    // Subtle, unobtrusive top banner allowing trader to return to full intermission readout
    return (
      <aside
        aria-label="Tournament Intermission Active"
        className="fixed top-0 inset-x-0 z-40 bg-[#0B0F17]/95 border-b border-amber-500/30 px-4 py-2 text-xs font-mono flex items-center justify-between shadow-lg backdrop-blur-md text-slate-300"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-xs bg-[#F0B429]" />
          <span className="text-[#F0B429] font-bold tracking-wider">FLOOR PAUSED // INTERMISSION</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Trading halted • Orders locked</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">RESUMES IN:</span>
            <BreakCountdownTimer sessionData={sessionData} size="compact" />
          </div>
          <button
            type="button"
            onClick={() => setAcknowledged(false)}
            className="px-2.5 py-1 rounded-xs bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-[11px] text-white font-mono cursor-pointer transition-colors"
          >
            RESTORE INTERMISSION VIEW
          </button>
        </div>
      </aside>
    );
  }

  const sessionId = sessionData?.id ? String(sessionData.id).slice(0, 8).toUpperCase() : 'SYS-MAIN-01';
  const durationMins = sessionData?.breakDurationMinutes || 10;
  const breakNote = sessionData?.breakNote?.trim();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intermission-title"
      className="fixed inset-0 z-50 bg-[#080B10]/95 backdrop-blur-md overflow-y-auto font-sans text-slate-200 select-none flex flex-col justify-between"
    >
      {/* Background terminal micro-grid texture (hairline CSS grid) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px'
        }}
      />

      {/* ── System Status Rail / Header Chrome ──────────────────────────────── */}
      <header className="relative z-10 w-full border-b border-white/[0.08] bg-[#0B0F17]/80 px-4 sm:px-8 py-2.5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-amber-500/10 border border-amber-500/30 text-[#F0B429]">
            <span className="w-1.5 h-1.5 rounded-xs bg-[#F0B429]" />
            <span className="font-bold tracking-widest text-[11px]">SYSTEM HALT // INTERMISSION</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center gap-2 text-slate-400 text-[11px]">
            <span>SESSION:</span>
            <span className="text-slate-200 font-semibold">{sessionId}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span className="hidden md:inline">FEED STATUS: <strong className="text-slate-300 font-normal">FROZEN (STATIONARY)</strong></span>
          <span className="hidden sm:inline">MATCHING ENGINE: <strong className="text-emerald-400 font-normal">STANDBY</strong></span>
          <span className="text-slate-400">BUILD 8.4.2-PROD</span>
        </div>
      </header>

      {/* ── Asymmetric Main Stage / Trading Floor Ledger ────────────────────── */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12 my-auto">
        <div className="grid lg:grid-cols-[1fr_340px] gap-6 lg:gap-8 items-stretch">
          
          {/* Left / Primary Panel: System Directive & Ticker Ledger Readout */}
          <div className="bg-[#0D121B] border border-white/[0.09] rounded-sm p-6 sm:p-7 flex flex-col justify-between relative shadow-xl">
            {/* Subtle hairline top accent line */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-white/[0.12]" />

            <div className="space-y-6">
              {/* Header Group */}
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] pb-4">
                <div>
                  <div className="text-[10px] font-mono tracking-[0.2em] text-slate-400 uppercase mb-1">
                    Floor Protocol Event
                  </div>
                  <h1 id="intermission-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
                    <span>Scheduled Floor Intermission</span>
                  </h1>
                </div>
                <div className="p-2 rounded-xs bg-white/[0.04] border border-white/[0.08] text-slate-400">
                  <Coffee className="w-5 h-5" />
                </div>
              </div>

              {/* Status Ledger Bar (Asymmetric readouts) */}
              <div className="grid grid-cols-3 gap-2.5 text-xs font-mono">
                <div className="p-3 rounded-xs bg-[#080C12] border border-white/[0.06]">
                  <span className="text-[10px] text-slate-500 block uppercase">Book State</span>
                  <strong className="text-amber-400 text-xs font-semibold">LOCKED</strong>
                </div>
                <div className="p-3 rounded-xs bg-[#080C12] border border-white/[0.06]">
                  <span className="text-[10px] text-slate-500 block uppercase">Spot Tape</span>
                  <strong className="text-slate-300 text-xs font-semibold">NO DRIFT</strong>
                </div>
                <div className="p-3 rounded-xs bg-[#080C12] border border-white/[0.06]">
                  <span className="text-[10px] text-slate-500 block uppercase">Limit Escrow</span>
                  <strong className="text-emerald-400 text-xs font-semibold">SAFEGUARDED</strong>
                </div>
              </div>

              {/* Terse, Competitive Trading Platform Directives */}
              <div className="space-y-3">
                <p className="text-sm text-slate-300 leading-relaxed font-normal">
                  Order matching and quote updates are paused for tournament recess. 
                  Spot valuations and resting limit queue positions are locked in memory without penalty.
                </p>

                {breakNote ? (
                  <div className="p-3.5 rounded-xs bg-amber-500/[0.05] border-l-2 border-l-[#F0B429] border-y border-r border-amber-500/20 text-xs font-mono space-y-1">
                    <span className="text-[10px] font-bold text-[#F0B429] tracking-wider uppercase block">
                      Floor Controller Dispatch
                    </span>
                    <p className="text-slate-200 leading-normal">
                      {breakNote}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xs bg-white/[0.02] border border-white/[0.05] text-xs font-mono text-slate-400">
                    Floor Controller Dispatch: Standard tournament intermission in effect. Prepare thesis for the next trading sprint.
                  </div>
                )}
              </div>
            </div>

            {/* Tactical Action Deck */}
            <div className="pt-6 mt-6 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Resumes automatically at zero</span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setAcknowledged(true);
                    if (onReviewStrategy) onReviewStrategy();
                  }}
                  className="px-4 py-2 rounded-xs border border-white/[0.12] hover:bg-white/[0.06] text-xs font-mono text-slate-200 transition-colors cursor-pointer flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Review Strategy</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAcknowledged(true)}
                  className="px-5 py-2 rounded-xs bg-[#F0B429] hover:bg-[#ffc83b] text-slate-950 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Got It</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right / Secondary Panel: Ticker/Ledger Countdown Terminal */}
          <div className="bg-[#0A0E16] border border-white/[0.09] rounded-sm p-6 flex flex-col justify-between relative shadow-xl space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <span className="font-mono text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  Resume Ledger
                </span>
                <span className="font-mono text-[10px] text-[#F0B429] bg-amber-500/10 px-1.5 py-0.5 rounded-xs border border-amber-500/20">
                  TICKING
                </span>
              </div>

              {/* Ticker / Ledger Style Countdown */}
              <div className="p-4 rounded-xs bg-[#06080D] border border-white/[0.08] space-y-2">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest text-center">
                  Countdown to Market Open
                </div>
                <div className="flex justify-center py-2">
                  <BreakCountdownTimer sessionData={sessionData} size="lg" />
                </div>
                <div className="text-[11px] font-mono text-slate-500 text-center border-t border-white/[0.04] pt-2">
                  Scheduled Duration: <span className="text-slate-300 font-bold">{durationMins} MIN</span>
                </div>
              </div>

              {/* Tactical Pre-Bell Checklist */}
              <div className="space-y-2 pt-1 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setShowTacticalChecklist(!showTacticalChecklist)}
                  className="w-full flex items-center justify-between py-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-[11px]"
                >
                  <span>TACTICAL PRE-BELL CHECK</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showTacticalChecklist ? 'rotate-90' : ''}`} />
                </button>

                <div className="space-y-1.5 text-[11px] text-slate-400">
                  <div className="flex items-start gap-2 p-1.5 rounded-xs bg-white/[0.02]">
                    <span className="text-slate-500">01</span>
                    <span>Audit resting limit orders against recent sentiment</span>
                  </div>
                  <div className="flex items-start gap-2 p-1.5 rounded-xs bg-white/[0.02]">
                    <span className="text-slate-500">02</span>
                    <span>Calculate liquid IC reserve for post-recess volatility</span>
                  </div>
                  <div className="flex items-start gap-2 p-1.5 rounded-xs bg-white/[0.02]">
                    <span className="text-slate-500">03</span>
                    <span>Review open positions ahead of the 5-min endgame freeze</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.05] text-[10px] font-mono text-slate-500 flex items-center justify-between">
              <span>LATENCY: 12ms</span>
              <span>SYNCHRONIZED WITH SERVER</span>
            </div>
          </div>

        </div>
      </main>

      {/* ── Bottom Product Chrome / Status Footer ──────────────────────────── */}
      <footer className="relative z-10 w-full border-t border-white/[0.08] bg-[#0B0F17]/80 px-4 sm:px-8 py-2.5 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-slate-400" />
          <span>EQUITY ARENA ENGINE // STANDALONE TERMINAL CLIENT</span>
        </div>
        <div className="flex items-center gap-3">
          <span>PORT: 5173</span>
          <span>PROTOCOL: WSS/TCP</span>
        </div>
      </footer>
    </div>
  );
}
