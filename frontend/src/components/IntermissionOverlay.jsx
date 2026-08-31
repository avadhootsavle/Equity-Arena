import React, { useState, useEffect, useRef } from 'react';
import { Coffee, Lock, Terminal, ChevronRight, Radio } from 'lucide-react';
import { BreakCountdownTimer } from './GameClock';
import { playIntermissionStartSound } from '../services/soundService';

export function IntermissionOverlay({ sessionData }) {
  const [showTacticalChecklist, setShowTacticalChecklist] = useState(true);

  // If session is not paused, do not render overlay
  const isPaused = sessionData?.isPaused || sessionData?.status === 'PAUSED';

  // Smooth cinematic animation transition state
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Play "intermisson-start.mp3" at whisper-soft elevator BGM volume (0.05) strictly ONCE when break starts
  const hasTriggeredAudioRef = useRef(false);
  const audioElRef = useRef(null);
  const breakKey = sessionData?.breakEndTime || sessionData?.id || 'session_break';

  const triggerAudio = () => {
    playIntermissionStartSound(breakKey);
    if (audioElRef.current) {
      try {
        audioElRef.current.currentTime = 0;
        audioElRef.current.volume = 0.05;
        audioElRef.current.play().catch(() => {});
      } catch (e) {}
    }
  };

  // Mount/unmount animation transition: cinematic, silky-smooth 500ms fade & subtle scale
  useEffect(() => {
    let timer;
    if (isPaused) {
      setIsRendered(true);
      // Double rAF ensures the browser repaints the initial 0-opacity state before transitioning to 1
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });

      if (!hasTriggeredAudioRef.current) {
        hasTriggeredAudioRef.current = true;
        triggerAudio();

        const onUserGesture = () => {
          triggerAudio();
          window.removeEventListener('pointerdown', onUserGesture, true);
          window.removeEventListener('click', onUserGesture, true);
          window.removeEventListener('keydown', onUserGesture, true);
        };
        window.addEventListener('pointerdown', onUserGesture, true);
        window.addEventListener('click', onUserGesture, true);
        window.addEventListener('keydown', onUserGesture, true);

        return () => {
          window.removeEventListener('pointerdown', onUserGesture, true);
          window.removeEventListener('click', onUserGesture, true);
          window.removeEventListener('keydown', onUserGesture, true);
        };
      }
    } else {
      hasTriggeredAudioRef.current = false;
      setIsVisible(false);
      // Keep DOM element rendered during the 500ms exit transition
      timer = setTimeout(() => {
        setIsRendered(false);
      }, 500);
    }
    return () => clearTimeout(timer);
  }, [isPaused, breakKey]);

  if (!isRendered) return null;

  const sessionId = sessionData?.id ? String(sessionData.id).slice(0, 8).toUpperCase() : 'SYS-MAIN-01';
  const durationMins = sessionData?.breakDurationMinutes || 10;
  const breakNote = sessionData?.breakNote?.trim();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intermission-title"
      className={`fixed inset-0 z-[100] bg-[#07090E]/95 overflow-y-auto font-sans text-slate-200 select-none flex flex-col justify-between transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isVisible ? 'opacity-100 backdrop-blur-xl' : 'opacity-0 backdrop-blur-none pointer-events-none'
      }`}
    >
      {/* Direct HTML5 audio element rendered directly into DOM at soft elevator BGM volume (0.15) */}
      <audio
        ref={audioElRef}
        src="/sounds/intermisson-start.mp3"
        preload="auto"
      />

      {/* Atmospheric ambient glow spots for attractive depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div
          className={`absolute -top-40 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl transition-opacity duration-700 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          className={`absolute -bottom-40 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl transition-opacity duration-700 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      {/* High-contrast neo-brutalist diagonal hatch background accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              -45deg,
              #ffffff 0px,
              #ffffff 1px,
              transparent 1px,
              transparent 12px
            )
          `
        }}
      />

      {/* ── System Status Rail / Header Chrome ──────────────────────────────── */}
      <header
        className={`relative z-10 w-full border-b-2 border-black bg-[#0B0F17]/90 backdrop-blur-md px-4 sm:px-8 py-2.5 flex items-center justify-between text-xs font-mono shadow-[0_2px_0_0_#F0B429] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-[#F0B429] text-black font-black tracking-widest text-[11px] border-2 border-black shadow-[2px_2px_0px_0px_#000000]">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>BREAK IN PROGRESS</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center gap-2 text-slate-400 text-[11px]">
            <span>SESSION ID:</span>
            <span className="text-white font-bold bg-white/[0.06] px-1.5 py-0.5 border border-white/[0.1]">{sessionId}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
          <span className="hidden md:inline">MATCHING ENGINE: <strong className="text-rose-400 font-bold">HALTED</strong></span>
          <span className="hidden sm:inline">TAPE: <strong className="text-white font-bold">STATIONARY</strong></span>
          <span className="text-slate-400 bg-white/[0.04] px-2 py-0.5 border border-white/[0.08]">SYS-VER 8.4</span>
        </div>
      </header>

      {/* ── Asymmetric Neo-Brutalist Main Stage with Smooth Scale/Fade Animation ── */}
      <main
        className={`relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10 my-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.96] translate-y-4'
        }`}
      >
        <div className="grid lg:grid-cols-[1.1fr_360px] gap-6 lg:gap-8 items-stretch">
          
          {/* Left Panel: Neo-Brutalist Dispatch & Security Deck */}
          <div className="bg-[#0E121B] border-2 border-black rounded-none p-6 sm:p-7 flex flex-col justify-between relative shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300">
            
            <div className="space-y-6">
              {/* Header Group */}
              <div className="flex items-start justify-between gap-4 border-b-2 border-white/[0.08] pb-4">
                <div>
                  <div className="text-[10px] font-mono tracking-[0.25em] text-[#F0B429] font-black uppercase mb-1">
                    [ FLOOR INTERMISSION PROTOCOL ]
                  </div>
                  <h1 id="intermission-title" className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
                    Trading Session Paused
                  </h1>
                </div>
                <div className="p-2.5 bg-black border-2 border-[#F0B429] text-[#F0B429] shadow-[3px_3px_0px_0px_#F0B429]">
                  <Coffee className="w-5 h-5" />
                </div>
              </div>

              {/* Neo-Brutalist Status Readouts */}
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-[#07090E] border-2 border-white/[0.1] shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)]">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Book State</span>
                  <strong className="text-amber-400 text-xs font-black">FROZEN</strong>
                </div>
                <div className="p-2.5 bg-[#07090E] border-2 border-white/[0.1] shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)]">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Spot Valuation</span>
                  <strong className="text-slate-200 text-xs font-black">PRESERVED</strong>
                </div>
                <div className="p-2.5 bg-[#07090E] border-2 border-white/[0.1] shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)]">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Order Queue</span>
                  <strong className="text-emerald-400 text-xs font-black">LOCKED</strong>
                </div>
              </div>

              {/* ── BIG HIGH-VISIBILITY NEO-BRUTALIST ADMIN NOTE ──────────────── */}
              <div className="pt-2">
                <div className="bg-[#121620] border-2 border-[#F0B429] p-4 sm:p-5 shadow-[5px_5px_0px_0px_#F0B429] relative overflow-hidden">
                  
                  {/* Top Dispatch Tag */}
                  <div className="flex items-center justify-between pb-2.5 mb-3 border-b-2 border-[#F0B429]/30 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-[#F0B429] animate-ping" />
                      <span className="bg-[#F0B429] text-black font-black text-[11px] px-2 py-0.5 tracking-widest uppercase">
                        OFFICIAL ADMIN DISPATCH
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-300/80 uppercase tracking-widest font-bold">
                      BROADCAST TO ALL TRADERS
                    </span>
                  </div>

                  {/* Big Prominent Text Content */}
                  <div className="space-y-1">
                    <p className="text-lg sm:text-xl md:text-2xl font-black text-white leading-snug tracking-tight font-sans">
                      {breakNote || "Standard tournament intermission in effect. Trading floor unlocks automatically upon timer expiry."}
                    </p>
                  </div>

                  {/* Dispatch Footnote */}
                  <div className="pt-3 mt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-amber-400/90 font-bold">
                    <span>TRANSMISSION: DIRECT FROM PIT MASTER</span>
                    <span>PRIORITY: CRITICAL</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed font-mono pt-1">
                Notice: All trader terminals are synchronized and locked until the intermission timer expires. 
                Liquid IC balances and open positions remain securely escrowed.
              </p>
            </div>

            {/* Lock Security Footer Strip */}
            <div className="pt-4 mt-6 border-t-2 border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 bg-black px-3 py-1.5 border border-white/[0.15]">
                <Lock className="w-4 h-4 text-[#F0B429]" />
                <span className="text-white font-bold tracking-wider">CONSOLE ACCESS LOCKED</span>
              </div>

              <div className="text-slate-400 text-[11px]">
                Trading resumes automatically when timer reaches 00:00
              </div>
            </div>
          </div>

          {/* Right Panel: Neo-Brutalist Countdown & Operational Checklist */}
          <div className="bg-[#0A0E16] border-2 border-black p-6 flex flex-col justify-between relative shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5">
            <div className="space-y-4">
              
              <div className="flex items-center justify-between border-b-2 border-white/[0.08] pb-3">
                <span className="font-mono text-xs text-white font-black uppercase tracking-wider">
                  Resume Countdown
                </span>
                <span className="font-mono text-[10px] text-black bg-[#F0B429] px-2 py-0.5 font-black border border-black shadow-[1px_1px_0px_0px_#000000]">
                  ACTIVE
                </span>
              </div>

              {/* Neo-Brutalist Timer Block */}
              <div className="p-4 bg-[#05070B] border-2 border-white/[0.15] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] space-y-3">
                <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest text-center">
                  TIME REMAINING UNTIL OPEN
                </div>
                <div className="flex justify-center py-2">
                  <BreakCountdownTimer sessionData={sessionData} size="lg" />
                </div>
                <div className="text-[11px] font-mono text-slate-400 text-center border-t border-white/[0.08] pt-2 flex justify-between px-2">
                  <span>DURATION:</span>
                  <span className="text-white font-black">{durationMins} MINUTES</span>
                </div>
              </div>

              {/* Tactical Pre-Bell Checklist */}
              <div className="space-y-2 pt-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setShowTacticalChecklist(!showTacticalChecklist)}
                  className="w-full flex items-center justify-between py-1 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-bold border-b border-white/[0.08]"
                >
                  <span className="text-[11px] text-[#F0B429] uppercase tracking-wider">Tactical Pre-Bell Check</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showTacticalChecklist ? 'rotate-90' : ''}`} />
                </button>

                {showTacticalChecklist && (
                  <div className="space-y-2 text-[11px] text-slate-300">
                    <div className="p-2 bg-black border border-white/[0.08]">
                      <span className="text-[#F0B429] font-bold block mb-0.5">01 // LIMIT ORDER RECALIBRATION</span>
                      <span className="text-slate-400 text-[10px]">Audit order triggers against the latest news bulletins.</span>
                    </div>
                    <div className="p-2 bg-black border border-white/[0.08]">
                      <span className="text-[#F0B429] font-bold block mb-0.5">02 // LIQUID IC ALLOCATION</span>
                      <span className="text-slate-400 text-[10px]">Keep dry powder ready for post-recess volatility spikes.</span>
                    </div>
                    <div className="p-2 bg-black border border-white/[0.08]">
                      <span className="text-[#F0B429] font-bold block mb-0.5">03 // 5-MIN FREEZE PREP</span>
                      <span className="text-slate-400 text-[10px]">Position for final cash realization before the hard liquidation bell.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t-2 border-white/[0.08] text-[10px] font-mono text-slate-400 flex items-center justify-between font-bold">
              <span>LATENCY: 12ms</span>
              <span>SYNCHRONIZED WITH SERVER</span>
            </div>
          </div>

        </div>
      </main>

      {/* ── Bottom Terminal Chrome ─────────────────────────────────────────── */}
      <footer
        className={`relative z-10 w-full border-t-2 border-black bg-[#0B0F17]/90 backdrop-blur-md px-4 sm:px-8 py-2 flex items-center justify-between text-[11px] font-mono text-slate-400 shadow-[0_-2px_0_0_#F0B429] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#F0B429]" />
          <span className="font-bold text-slate-300">EQUITY ARENA ENGINE // STANDALONE TERMINAL CLIENT</span>
        </div>
        <div className="flex items-center gap-3">
          <span>PORT: 5173</span>
          <span>PROTOCOL: WSS/TCP</span>
        </div>
      </footer>
    </div>
  );
}
