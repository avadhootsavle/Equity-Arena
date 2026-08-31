import React, { useState, useEffect, useRef } from 'react';
import { Radio, ShieldCheck } from 'lucide-react';
import { BreakCountdownTimer } from './GameClock';
import { playIntermissionStartSound } from '../services/soundService';

export function IntermissionOverlay({ sessionData }) {
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

        // Browser gesture fallback: First mouse click anywhere on the page starts the soft BGM
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

  // If admin has set a custom message, show ONLY the admin message.
  // If no note was entered, fallback gracefully to standard notification.
  const displayMessage = breakNote || "Standard tournament intermission in effect. Trading floor unlocks automatically upon timer expiry.";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intermission-title"
      className={`fixed inset-0 z-[100] bg-[#06080E]/95 overflow-y-auto font-sans text-slate-200 select-none flex flex-col justify-between transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isVisible ? 'opacity-100 backdrop-blur-2xl' : 'opacity-0 backdrop-blur-none pointer-events-none'
      }`}
    >
      {/* Direct HTML5 audio element rendered directly into DOM at soft elevator BGM volume (0.05) */}
      <audio
        ref={audioElRef}
        src="/sounds/intermisson-start.mp3"
        preload="auto"
      />

      {/* Atmospheric ambient glow spots for attractive modern depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div
          className={`absolute -top-32 left-1/3 w-[550px] h-[550px] bg-amber-500/15 rounded-full blur-[120px] transition-opacity duration-700 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          className={`absolute -bottom-32 right-1/3 w-[550px] h-[550px] bg-yellow-500/10 rounded-full blur-[140px] transition-opacity duration-700 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      {/* Subtle modern geometric background texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px'
        }}
      />

      {/* ── System Status Rail / Header Chrome ──────────────────────────────── */}
      <header
        className={`relative z-10 w-full border-b-2 border-black bg-[#0B0F17]/90 backdrop-blur-md px-6 sm:px-12 py-2.5 flex items-center justify-between text-xs font-mono shadow-[0_2px_0_0_#F0B429] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#F0B429] text-black font-black tracking-widest text-xs border-2 border-black shadow-[2px_2px_0px_0px_#000000]">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>INTERMISSION IN PROGRESS</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center gap-2 text-slate-400 text-xs">
            <span>SESSION:</span>
            <span className="text-white font-bold bg-white/[0.06] px-2 py-0.5 border border-white/[0.1]">{sessionId}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-[#F0B429]" />
          <span>PORTFOLIO VALUATIONS ESCROWED</span>
        </div>
      </header>

      {/* ── Focused Stage: Live Countdown + ONLY Admin Message ──────────────── */}
      <main
        className={`relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-10 my-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.96] translate-y-4'
        }`}
      >
        <div className="space-y-6 sm:space-y-8">
          
          {/* Hero Live Countdown Timer Block */}
          <div className="bg-[#0B0F18] border-2 border-black p-5 sm:p-7 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative">
            <div className="flex items-center justify-between border-b-2 border-white/[0.08] pb-3 mb-4 font-mono">
              <span className="text-slate-300 font-bold text-xs tracking-widest uppercase">
                MARKET OPENS IN
              </span>
              <span className="text-xs font-bold text-slate-400">
                DURATION: <strong className="text-[#F0B429] font-black">{durationMins} MINUTES</strong>
              </span>
            </div>

            {/* Extra Large Big Bold Digits */}
            <div className="py-2">
              <BreakCountdownTimer sessionData={sessionData} size="xl" />
            </div>
          </div>

          {/* ── HERO ADMIN DISPATCH (EXCLUSIVELY THE ADMIN'S MESSAGE) ───────── */}
          <div className="bg-[#101522] border-2 border-[#F0B429] p-6 sm:p-9 shadow-[6px_6px_0px_0px_#F0B429] relative overflow-hidden">
            
            {/* Header Rail: Official Announcement & Target Audience */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#F0B429]/30 font-mono">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 bg-[#F0B429] animate-ping" />
                <span className="bg-[#F0B429] text-black font-black text-xs sm:text-sm px-3 py-1 tracking-widest uppercase">
                  OFFICIAL ANNOUNCEMENT
                </span>
              </div>
              <span className="text-xs text-[#F0B429] uppercase tracking-widest font-black hidden sm:inline">
                ALL TRADERS
              </span>
            </div>

            {/* Pure, Clean Admin Message Typography */}
            <p id="intermission-title" className="text-xl sm:text-3xl md:text-4xl font-black text-white leading-snug tracking-tight">
              {displayMessage}
            </p>
          </div>

        </div>
      </main>

      {/* ── Minimal Bottom Strip ────────────────────────────────────────────── */}
      <footer
        className={`relative z-10 w-full border-t-2 border-black bg-[#0B0F17]/90 backdrop-blur-md px-6 sm:px-12 py-2.5 flex items-center justify-between text-xs font-mono text-slate-400 shadow-[0_-2px_0_0_#F0B429] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <span className="font-bold text-slate-300">EQUITY ARENA TRADING FLOOR</span>
        <span>AUTOMATIC UNLOCK AT 00:00</span>
      </footer>
    </div>
  );
}
