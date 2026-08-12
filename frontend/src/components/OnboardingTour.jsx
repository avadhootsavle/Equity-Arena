import React, { useState } from 'react';
import {
  TrendingUp, Zap, BarChart2, Trophy, ArrowRight, ArrowLeft, X, Sparkles, CheckCircle2
} from 'lucide-react';

const TOUR_STEPS = [
  {
    icon: TrendingUp,
    badge: "Step 1 of 4",
    badgeColor: "text-[#D4A017] bg-[#D4A017]/10 border-[#D4A017]/30",
    title: "Live Market Exchange",
    headline: "Real-time Prices Across 15 Indian Industries",
    description: "Watch stock prices change second by second. See which industries are rising, track company trends, and decide when to jump in.",
    tip: "Tip: Stocks range from cheap starter stocks (~30-100 IC) to heavyweight blue chips (~1,000-4,000 IC)."
  },
  {
    icon: Zap,
    badge: "Step 2 of 4",
    badgeColor: "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30",
    title: "Fast 2-Tap Trading",
    headline: "Buy and Sell Directly on Any Stock Card",
    description: "No slow popups. Tap 'Buy' or 'Sell' on any stock card, tap 25%, 50%, or 100% to fill the quantity, and confirm in one click.",
    tip: "Tip: Trades happen immediately at the true current price so you never miss a market move."
  },
  {
    icon: BarChart2,
    badge: "Step 3 of 4",
    badgeColor: "text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/30",
    title: "Price Charts & Auto Orders",
    headline: "Study Trends & Set Target Prices",
    description: "Click any stock card to see historical price graphs (1 Day, 1 Week, 1 Month) and set automatic orders that buy or sell when the price hits your target.",
    tip: "Tip: Automatic orders trigger while you watch other stocks, so you don't have to stare at one screen."
  },
  {
    icon: Trophy,
    badge: "Step 4 of 4",
    badgeColor: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30",
    title: "Your Wealth & Leaderboard",
    headline: "Track Your Profit & Compete",
    description: "Check your available cash, the current value of your stocks, and whether you're up or down. Build the highest net worth to win Rank #1!",
    tip: "Tip: You start with 20,000 Ignite Coins (IC). Grow your wealth by buying low and selling high!"
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg theme-bg-card border border-[#D4A017]/40 rounded-[12px] shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden">
        
        {/* Glow effect behind modal */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#D4A017]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#10B981]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-[4px] text-xs font-mono font-bold border ${step.badgeColor}`}>
              {step.badge}
            </span>
            <span className="text-xs theme-text-muted font-heading font-medium">TRADER GUIDE</span>
          </div>

          <button
            onClick={handleComplete}
            className="p-1.5 theme-text-muted hover:theme-text-main hover:bg-slate-800/40 rounded-[4px] transition-colors"
            title="Skip Walkthrough"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Icon & Title */}
        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3.5 bg-[#D4A017]/10 border border-[#D4A017]/30 rounded-[8px] text-[#D4A017] shadow-inner">
              <StepIcon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold theme-text-main font-heading tracking-tight">
                {step.title}
              </h2>
              <div className="text-xs font-mono text-[#D4A017] font-semibold">
                {step.headline}
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm theme-text-muted leading-relaxed">
            {step.description}
          </p>

          {/* Callout Tip */}
          <div className="p-3 rounded-[6px] theme-bg-panel border theme-border flex items-start gap-2.5 text-xs text-slate-300 font-mono">
            <Sparkles className="w-4 h-4 text-[#D4A017] shrink-0 mt-0.5" />
            <span className="leading-snug">{step.tip}</span>
          </div>
        </div>

        {/* Step Progress Indicators */}
        <div className="flex items-center justify-between pt-2 border-t theme-border relative z-10">
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? 'w-6 bg-[#D4A017]'
                    : idx < currentStep
                    ? 'w-2 bg-[#10B981]'
                    : 'w-2 bg-slate-700'
                }`}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-2 theme-bg-panel hover:bg-slate-800 text-xs theme-text-main font-heading font-semibold rounded-[6px] border theme-border transition-all flex items-center gap-1 min-h-[38px]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-2 bg-[#D4A017] hover:bg-[#E5B020] text-slate-950 text-xs font-heading font-bold rounded-[6px] transition-all shadow-md active:scale-95 flex items-center gap-1.5 min-h-[38px] btn-terminal"
            >
              <span>{isLast ? 'Start Trading!' : 'Next'}</span>
              {isLast ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
