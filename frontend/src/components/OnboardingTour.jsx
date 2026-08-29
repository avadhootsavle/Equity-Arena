import React, { useState } from 'react';
import {
  TrendingUp, Zap, BarChart2, Trophy, ArrowRight, ArrowLeft, X, Sparkles, CheckCircle2, ShieldCheck, Compass
} from 'lucide-react';

const TOUR_STEPS = [
  {
    icon: TrendingUp,
    badge: "Step 1 of 4",
    title: "Live Market Exchange",
    headline: "Real-time Stock Trading Floor",
    description: "Watch live stock prices tick second-by-second across top market sectors. Track market surges, monitor individual company trends, and capitalize on price movements as they happen.",
    tip: "Pro Tip: Stocks range from entry-level starter stocks (~30–100 IC) to high-value blue chips (~1,000–4,000 IC).",
    highlights: [
      "Real-time live price ticks",
      "Sector price change indicators",
      "Interactive 15-minute price sparklines"
    ]
  },
  {
    icon: Zap,
    badge: "Step 2 of 4",
    title: "Instant 2-Tap Trading",
    headline: "Instant Execution Right on Any Stock Card",
    description: "No multi-step forms required. Click 'BUY' or 'SELL' directly on any stock card, adjust your share quantity with rapid stepper buttons, and execute instantly at live market prices.",
    tip: "Pro Tip: Quick trades execute immediately so you lock in favorable prices without lag.",
    highlights: [
      "Instant 1-click execution",
      "Dynamic Profit (Green) & Loss (Red) sell cues",
      "Live order confirmation notifications"
    ]
  },
  {
    icon: BarChart2,
    badge: "Step 3 of 4",
    title: "Price Charts & Limit Orders",
    headline: "Technical Charts & Automated Price Pre-Booking",
    description: "Click any stock card to expand interactive candlestick price charts (1D, 1W, 1M timeframes). Pre-book automated Limit Orders that trigger buying or selling when the price hits your target.",
    tip: "Pro Tip: Limit orders automatically fill in the background while you monitor other opportunities.",
    highlights: [
      "Full candlestick chart analysis",
      "Automated target price limit orders",
      "Cancel or edit active resting orders anytime"
    ]
  },
  {
    icon: Trophy,
    badge: "Step 4 of 4",
    title: "Portfolio Wealth & Tournament Ranks",
    headline: "Grow Portfolio Value & Climb to Rank #1",
    description: "Your total wealth equals Cash Left plus Money in Stocks. Monitor your total Profit & Loss (P&L) calculated against your 20,000 IC starting balance and compete on the live leaderboard!",
    tip: "Pro Tip: Starting balance is 20,000 IC. Sell winning positions to lock in realized profits!",
    highlights: [
      "20,000 IC fixed starting balance",
      "Real-time net worth calculation",
      "Live tournament standings leaderboard"
    ]
  }
];

export function OnboardingTour({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn">
      {/* Large Glassmorphism Card Container */}
      <div className="relative w-full max-w-3xl rounded-3xl border border-white/15 bg-[#0F1117]/90 backdrop-blur-2xl p-6 sm:p-10 shadow-[0_0_80px_rgba(240,180,41,0.25)] space-y-6 sm:space-y-8 overflow-hidden text-white">
        
        {/* Ambient Glowing Glass Backdrops */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#F0B429]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-[#10B981]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Navigation Strip */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#F0B429]/15 border border-[#F0B429]/40 text-[#F0B429]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#F0B429] block">
                EQUITY ARENA · OFFICIAL TRADER GUIDE
              </span>
              <span className="text-sm font-sans font-bold text-slate-300">
                {step.badge}
              </span>
            </div>
          </div>

          <button
            onClick={handleComplete}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Guide Content */}
        <div className="space-y-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F0B429]/20 to-amber-500/10 border border-[#F0B429]/40 text-[#F0B429] shadow-inner shrink-0 mt-1">
              <StepIcon className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                {step.title}
              </h2>
              <div className="text-sm font-mono text-[#F0B429] font-bold">
                {step.headline}
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 shadow-inner">
            {step.description}
          </p>

          {/* Key Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {step.highlights.map((h, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-2 text-xs font-mono text-slate-200">
                <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>{h}</span>
              </div>
            ))}
          </div>

          {/* Pro Tip Callout Panel */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-500/30 flex items-center gap-3 text-xs sm:text-sm font-mono text-amber-200">
            <Sparkles className="w-5 h-5 text-[#F0B429] shrink-0" />
            <span className="leading-snug">{step.tip}</span>
          </div>
        </div>

        {/* Step Indicators & Navigation Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 relative z-10 gap-4 flex-wrap">
          {/* Step Pill Indicators */}
          <div className="flex items-center gap-2">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentStep
                    ? 'w-10 bg-gradient-to-r from-[#F0B429] to-amber-400'
                    : idx < currentStep
                    ? 'w-3 bg-[#10B981]'
                    : 'w-3 bg-slate-700'
                }`}
                title={`Go to step ${idx + 1}: ${s.title}`}
              />
            ))}
          </div>

          {/* Navigation Control Buttons */}
          <div className="flex items-center gap-3 ml-auto">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm font-bold text-slate-200 border border-slate-700 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F0B429] to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>{isLast ? 'START TRADING NOW!' : 'NEXT STEP'}</span>
              {isLast ? <CheckCircle2 className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
