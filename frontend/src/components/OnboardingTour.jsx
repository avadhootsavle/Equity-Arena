import React, { useState } from 'react';
import {
  TrendingUp, Zap, BarChart2, Trophy, ArrowRight, ArrowLeft, X, Sparkles, CheckCircle2, ShieldCheck, Compass, Activity, Target, Layers
} from 'lucide-react';

const TOUR_STEPS = [
  {
    stepNum: "01",
    badge: "STEP 1 OF 4",
    title: "Live Market Exchange",
    headline: "Track Real-time Prices Across 15 Market Sectors",
    description: "Experience true exchange mechanics with live stock price ticks updating second-by-second. Monitor industry momentum, identify market surges, and timing your entries for maximum gains.",
    tip: "Pro Tip: Prices range from starter stocks (~30–100 IC) to heavyweight blue chips (~1,000–4,000 IC).",
    highlights: [
      "Real-time live price ticks & flash indicators",
      "Interactive 15-minute price trend sparklines",
      "Sector range high/low statistics"
    ],
    mockupType: "MARKET"
  },
  {
    stepNum: "02",
    badge: "STEP 2 OF 4",
    title: "Instant 2-Tap Trading",
    headline: "Execute Orders Directly On Any Stock Card",
    description: "No slow modal popups required. Tap 'BUY' or 'SELL' right on the trading floor, adjust your share quantity with rapid stepper controls, and execute instantly at live market spot prices.",
    tip: "Pro Tip: Sell buttons dynamically illuminate GREEN when selling at a profit, and RED when selling at a loss.",
    highlights: [
      "Instant 1-click execution speed",
      "Dynamic Profit (Green) & Loss (Red) sell cues",
      "Automated balance & position updates"
    ],
    mockupType: "TRADING"
  },
  {
    stepNum: "03",
    badge: "STEP 3 OF 4",
    title: "Price Charts & Limit Orders",
    headline: "Candlestick Graphs & Automated Price Booking",
    description: "Click any stock card to expand high-resolution price charts with 1D, 1W, and 1M timeframes. Pre-book Limit Orders that automatically buy or sell when the price hits your target level.",
    tip: "Pro Tip: Limit orders fill automatically in the background while you focus on other stocks.",
    highlights: [
      "Full candlestick chart analysis",
      "Automated target price pre-booking",
      "Real-time resting order management"
    ],
    mockupType: "CHARTS"
  },
  {
    stepNum: "04",
    badge: "STEP 4 OF 4",
    title: "Portfolio Wealth & Tournament Ranks",
    headline: "Grow Net Worth & Claim Rank #1 On The Leaderboard",
    description: "Your total wealth equals Cash Left plus Money in Stocks. Monitor your total Profit & Loss (P&L) calculated against your 20,000 IC starting balance and climb the live tournament leaderboard!",
    tip: "Pro Tip: Starting balance is 20,000 IC. Sell winning positions to lock in realized profits!",
    highlights: [
      "Fixed 20,000 IC starting balance",
      "Real-time portfolio math engine",
      "Live tournament standings leaderboard"
    ],
    mockupType: "LEADERBOARD"
  }
];

export function OnboardingTour({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('equity_arena_tour_completed', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] w-screen h-screen bg-[#07090E] text-white flex flex-col justify-between p-6 md:p-12 overflow-y-auto animate-fadeIn select-none">
      
      {/* Ambient Mesh Glow Spotlights */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#F0B429]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#10B981]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[160px] pointer-events-none" />

      {/* ---------------- 1. Top Header ---------------- */}
      <div className="flex items-center justify-between relative z-10 border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F0B429] to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-[0_0_20px_rgba(240,180,41,0.4)]">
            EA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-[#F0B429] uppercase">
                EQUITY ARENA
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
            </div>
            <h1 className="text-sm font-sans font-bold text-slate-300">
              TRADER MASTERCLASS & ONBOARDING GUIDE
            </h1>
          </div>
        </div>

        {/* Step Tab Buttons */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
          {TOUR_STEPS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                idx === currentStep
                  ? 'bg-gradient-to-r from-[#F0B429] to-amber-500 text-slate-950 shadow-md scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {s.stepNum}. {s.title}
            </button>
          ))}
        </div>

        <button
          onClick={handleComplete}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-mono font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <span>CLOSE GUIDE</span>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ---------------- 2. Main Center Hero (2-Column Grid) ---------------- */}
      <div className="my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10 max-w-7xl mx-auto w-full">
        
        {/* Left Column: Text & Features */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F0B429]/10 border border-[#F0B429]/30 text-[#F0B429] text-xs font-mono font-bold">
            <Compass className="w-4 h-4" />
            <span>{step.badge}</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-heading tracking-tight leading-tight bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">
              {step.title}
            </h2>
            <p className="text-lg sm:text-xl font-mono text-[#F0B429] font-bold">
              {step.headline}
            </p>
          </div>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans bg-slate-900/50 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-xl shadow-2xl">
            {step.description}
          </p>

          {/* Highlights List */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {step.highlights.map((h, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5 text-xs font-mono text-slate-200 shadow-sm"
              >
                <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>{h}</span>
              </div>
            ))}
          </div>

          {/* Pro Tip Callout Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-500/30 flex items-center gap-3 text-sm font-mono text-amber-200 shadow-lg">
            <Sparkles className="w-6 h-6 text-[#F0B429] shrink-0" />
            <span className="leading-snug">{step.tip}</span>
          </div>
        </div>

        {/* Right Column: Super Aesthetic Visual UI Graphic Preview Mockup */}
        <div className="lg:col-span-5 relative">
          <div className="relative rounded-3xl border-2 border-white/15 bg-[#0F121C]/90 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_0_60px_rgba(240,180,41,0.15)] space-y-6 overflow-hidden">
            
            {/* Mockup Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
                LIVE INTERACTIVE PREVIEW
              </span>
            </div>

            {/* Render Specific Step Mockup Graphics */}
            {step.mockupType === "MARKET" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-sm border border-emerald-500/40">
                      AB
                    </div>
                    <div>
                      <div className="text-base font-bold text-white">Adani Ports</div>
                      <div className="text-xs font-mono text-slate-400">ADANIPORTS</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold font-mono text-white">300.77 IC</div>
                    <div className="text-xs font-mono text-emerald-400 font-bold">▲ +107.45%</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center text-sm border border-amber-500/40">
                      TT
                    </div>
                    <div>
                      <div className="text-base font-bold text-white">Tata Motors</div>
                      <div className="text-xs font-mono text-slate-400">TATAMOTORS</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold font-mono text-white">942.54 IC</div>
                    <div className="text-xs font-mono text-emerald-400 font-bold">▲ +12.30%</div>
                  </div>
                </div>
              </div>
            )}

            {step.mockupType === "TRADING" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                    <span>INSTANT QUICK TRADE</span>
                    <span className="text-emerald-400 font-bold">PROFITABLE SELL READY</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="flex-1 py-3 rounded-xl bg-[#16A34A] text-white font-bold text-sm uppercase tracking-wider shadow-lg">
                      BUY
                    </button>
                    <button className="flex-1 py-3 rounded-xl bg-[#16A34A] text-white font-bold text-sm uppercase tracking-wider shadow-lg">
                      SELL
                    </button>
                  </div>
                  <div className="text-center text-xs font-mono text-emerald-400 font-bold p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    Selling locks in +250.00 IC realized profit!
                  </div>
                </div>
              </div>
            )}

            {step.mockupType === "CHARTS" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-300 font-bold">CANDLESTICK CHART</span>
                    <span className="text-amber-400 font-bold">LIMIT TARGET: 150.00 IC</span>
                  </div>
                  <div className="h-32 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center relative overflow-hidden">
                    <div className="w-full h-1 border-b-2 border-dashed border-amber-400 absolute top-12 left-0" />
                    <Activity className="w-full h-20 text-emerald-400 opacity-80" />
                  </div>
                </div>
              </div>
            )}

            {step.mockupType === "LEADERBOARD" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-[#F0B429]" />
                      <span className="text-sm font-bold text-white font-mono">RANK #1 TRADER</span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#F0B429] text-black">
                      28,450 IC
                    </span>
                  </div>
                  <div className="text-xs font-mono text-emerald-400 font-bold">
                    Total Profit: +8,450.00 IC (+42.25%)
                  </div>
                </div>
              </div>
            )}

            <div className="text-center text-xs font-mono text-slate-400">
              Interactive Trading Floor Preview · Step {step.stepNum}
            </div>
          </div>
        </div>

      </div>

      {/* ---------------- 3. Bottom Control Bar ---------------- */}
      <div className="flex items-center justify-between relative z-10 border-t border-slate-800/80 pt-6 max-w-7xl mx-auto w-full gap-4 flex-wrap">
        
        {/* Step Progress Pill Indicators */}
        <div className="flex items-center gap-3">
          {TOUR_STEPS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`h-3 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentStep
                  ? 'w-12 bg-gradient-to-r from-[#F0B429] to-amber-400 shadow-[0_0_15px_rgba(240,180,41,0.5)]'
                  : idx < currentStep
                  ? 'w-4 bg-[#10B981]'
                  : 'w-4 bg-slate-800'
              }`}
              title={`Go to step ${idx + 1}: ${s.title}`}
            />
          ))}
          <span className="text-xs font-mono text-slate-400 font-bold ml-2">
            {step.badge}
          </span>
        </div>

        {/* Navigation Control Buttons */}
        <div className="flex items-center gap-4 ml-auto">
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-sm font-bold text-slate-200 border border-slate-700 transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>PREVIOUS</span>
            </button>
          )}

          <button
            onClick={handleNext}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#F0B429] via-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(240,180,41,0.4)] transition-all active:scale-95 flex items-center gap-2.5 cursor-pointer"
          >
            <span>{isLast ? 'START TRADING NOW!' : 'NEXT STEP'}</span>
            {isLast ? <CheckCircle2 className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          </button>
        </div>

      </div>

    </div>
  );
}
