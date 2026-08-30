import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Wallet, MousePointerClick, Target, LineChart, Newspaper, Trophy,
  ArrowRight, ArrowLeft, X, Check, AlertTriangle, Clock, Lightbulb,
  Zap, Flame, ShieldAlert, TrendingUp, TrendingDown, Crosshair,
  Volume2, Compass, Award, Sparkles, ChevronRight, Terminal
} from 'lucide-react';

/* ==================================================================
   Equity Arena — Tournament Combat Manual (Field Playbook)
   No corporate fluff. Pure trader psychology, hard tactical mechanics,
   interactive live simulations, and high-energy pit floor styling.
   ================================================================== */

const ACCENT = '#F0B429';
const UP = '#10B981';
const DOWN = '#EF4444';

/* ---------- High-Impact Interactive Step Visuals ---------- */

function GoalInteractiveWidget() {
  const [allocation, setAllocation] = useState(65); // % in stocks
  const total = 20000;
  const inStocks = Math.round((total * allocation) / 100);
  const inCash = total - inStocks;
  const mockGain = Math.round(inStocks * 0.18);
  const projected = total + mockGain;

  return (
    <div className="rounded-3xl bg-[#0D1117]/90 border border-white/[0.12] p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl space-y-5">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-emerald-400">
            Tactical Capital Simulator
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">Drag Slider</span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-slate-400">Capital Deployment</span>
          <span className="font-bold text-amber-400">{allocation}% Risk-On</span>
        </div>
        <input
          type="range"
          min="10"
          max="95"
          value={allocation}
          onChange={(e) => setAllocation(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>Safe / Idle (10%)</span>
          <span>Aggressive Speculation (95%)</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Liquid Reserve</span>
          <span className="text-xl font-mono font-black text-white">{inCash.toLocaleString()} <span className="text-xs text-amber-400">IC</span></span>
          <span className="text-[10px] text-slate-500 block">Dry powder for dips</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20 space-y-1">
          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">Active Positions</span>
          <span className="text-xl font-mono font-black text-white">{inStocks.toLocaleString()} <span className="text-xs text-amber-400">IC</span></span>
          <span className="text-[10px] text-emerald-400 font-mono block">+{mockGain.toLocaleString()} IC at +18%</span>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono text-emerald-400 font-bold block uppercase tracking-wider">Projected Portfolio Value</span>
          <span className="text-2xl font-mono font-black text-white">{projected.toLocaleString()} IC</span>
        </div>
        <div className="text-right">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-extrabold text-xs">
            +{(mockGain / total * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">Leaderboard Rank #1</span>
        </div>
      </div>
    </div>
  );
}

function MarketInteractiveWidget() {
  const [activeStock, setActiveStock] = useState('ANAG');

  const stocks = [
    { code: 'ANAG', name: 'Annapurna Agro', price: 46.80, change: 5.4, sector: 'Agri', vol: '1.2M', sentiment: 'BULLISH' },
    { code: 'RTB', name: 'Rashtriya Trust Bank', price: 2540.10, change: -3.2, sector: 'Banking', vol: '840K', sentiment: 'BEARISH' },
    { code: 'GSL', name: 'Ganga Shipping', price: 94.50, change: 1.8, sector: 'Logistics', vol: '2.4M', sentiment: 'STABLE' },
  ];

  const sel = stocks.find(s => s.code === activeStock) || stocks[0];

  return (
    <div className="rounded-3xl bg-[#0D1117]/90 border border-white/[0.12] p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-white">
            Live Trading Floor Feed
          </span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          ● TICKER RUNNING
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {stocks.map(s => {
          const isUp = s.change >= 0;
          const isActive = s.code === activeStock;
          return (
            <button
              key={s.code}
              type="button"
              onClick={() => setActiveStock(s.code)}
              className={`p-3 rounded-2xl text-left transition-all border ${
                isActive
                  ? 'bg-amber-500/15 border-amber-400 shadow-[0_0_20px_rgba(240,180,41,0.2)] scale-[1.02]'
                  : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
              }`}
            >
              <div className="font-mono font-black text-xs text-white flex items-center justify-between">
                <span>{s.code}</span>
                <span className={`text-[10px] ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isUp ? '▲' : '▼'} {Math.abs(s.change)}%
                </span>
              </div>
              <div className="text-sm font-mono font-bold text-slate-200 mt-1">{s.price.toFixed(2)}</div>
            </button>
          );
        })}
      </div>

      <div className="p-4 rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.08] space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span>{sel.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {sel.sector}
              </span>
            </h4>
            <div className="text-xs text-slate-400 font-mono mt-0.5">Spot: <strong className="text-white text-sm">{sel.price.toFixed(2)} IC</strong></div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-extrabold ${
            sel.change >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
          }`}>
            {sel.change >= 0 ? 'STRONG BID' : 'HEAVY OFFER'}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-white/[0.06]">
          <span>Floor Vol: <strong className="text-white">{sel.vol}</strong></span>
          <span>Tape Drift: <strong className="text-amber-400">±2.5% / 6s</strong></span>
          <span>Action: <strong className="text-emerald-400">Click to Open Ticket</strong></span>
        </div>
      </div>
    </div>
  );
}

function TradeInteractiveWidget() {
  const [qty, setQty] = useState(5);
  const [action, setAction] = useState('BUY');
  const price = 48.50;
  const cost = (qty * price).toFixed(2);

  return (
    <div className="rounded-3xl bg-[#0D1117]/90 border border-white/[0.12] p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl space-y-5">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-white">
            Live Ticket Terminal
          </span>
        </div>
        <span className="font-mono text-xs text-slate-400">Instant Execution</span>
      </div>

      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/[0.08]">
        <button
          type="button"
          onClick={() => setAction('BUY')}
          className={`flex-1 py-2 rounded-xl font-mono text-xs font-black uppercase transition-all ${
            action === 'BUY'
              ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          ● BUY (Go Long)
        </button>
        <button
          type="button"
          onClick={() => setAction('SELL')}
          className={`flex-1 py-2 rounded-xl font-mono text-xs font-black uppercase transition-all ${
            action === 'SELL'
              ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          ● SELL (Liquidate)
        </button>
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-mono text-slate-400 block uppercase">Order Size (Shares)</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="w-12 h-12 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xl font-mono text-white flex items-center justify-center cursor-pointer transition-all active:scale-95"
          >
            −
          </button>
          <div className="flex-1 h-12 rounded-2xl bg-black/50 border border-white/[0.15] flex items-center justify-center font-mono text-2xl font-black text-amber-400">
            {qty}
          </div>
          <button
            type="button"
            onClick={() => setQty(qty + 1)}
            className="w-12 h-12 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xl font-mono text-white flex items-center justify-center cursor-pointer transition-all active:scale-95"
          >
            +
          </button>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between font-mono">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Est. Trade Total</span>
          <span className="text-xl font-black text-white">{cost} IC</span>
        </div>
        <div className="text-right text-[11px] text-slate-400">
          <div>Fee: <strong className="text-emerald-400">0.00 IC (Zero)</strong></div>
          <div>Fill: <strong className="text-amber-400">Immediate</strong></div>
        </div>
      </div>
    </div>
  );
}

function LimitInteractiveWidget() {
  const [target, setTarget] = useState(42.00);
  const livePrice = 46.50;
  const isBuyDiscount = target < livePrice;

  return (
    <div className="rounded-3xl bg-[#0D1117]/90 border border-white/[0.12] p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl space-y-5">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-amber-400" />
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-white">
            Automated Limit Sniper
          </span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          BOT ACTIVE
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-baseline font-mono">
          <span className="text-xs text-slate-400">Your Strike Price</span>
          <span className="text-2xl font-black text-amber-400">{target.toFixed(2)} IC</span>
        </div>
        <input
          type="range"
          min="35"
          max="55"
          step="0.5"
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
        />
        <div className="flex justify-between text-[11px] font-mono">
          <span className="text-slate-500">Deep Dip (35 IC)</span>
          <span className="text-slate-300 font-bold">Current Spot: {livePrice.toFixed(2)} IC</span>
          <span className="text-slate-500">Spike Top (55 IC)</span>
        </div>
      </div>

      <div className={`p-4 rounded-2xl border transition-all ${
        isBuyDiscount
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-amber-500/10 border-amber-500/30'
      }`}>
        <div className="flex items-start gap-2.5">
          <Target className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs font-mono space-y-1">
            <span className="font-bold text-white block">
              {isBuyDiscount ? '🎯 Limit Buy Resting Below Market' : '⚡ Instant Trigger or Sell Setup'}
            </span>
            <p className="text-slate-300 leading-relaxed">
              {isBuyDiscount
                ? `System reserves funds and sleeps. If spot drops ${((1 - target / livePrice) * 100).toFixed(1)}% to ${target.toFixed(2)} IC, your order fills instantly.`
                : `Target is at/above market. Sells trigger on rallies; buys execute immediately.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewsInteractiveWidget() {
  const [headlineIdx, setHeadlineIdx] = useState(0);

  const headlines = [
    {
      source: 'REUTERS BREAKING WIRE',
      headline: 'Govt unveils 20% subsidy boost for domestic fertilizer & agro processing plants.',
      target: 'ANAG (Annapurna Agro)',
      impact: 'MASSIVE BULLISH',
      color: UP,
      drift: '+15% to +25%'
    },
    {
      source: 'BLOOMBERG FLASH',
      headline: 'RBI hikes cash reserve ratio unexpectedly; bank liquidity squeezed.',
      target: 'RTB (Rashtriya Trust Bank)',
      impact: 'SHARP CRASH',
      color: DOWN,
      drift: '-12% to -20%'
    },
    {
      source: 'ECONOMIC TIMES ALERTS',
      headline: 'Suez Canal shipping rates spike 40% amid global container shortages.',
      target: 'GSL (Ganga Shipping)',
      impact: 'MOMENTUM SURGE',
      color: UP,
      drift: '+18% to +30%'
    }
  ];

  const curr = headlines[headlineIdx];

  return (
    <div className="rounded-3xl bg-[#0D1117]/90 border border-white/[0.12] p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400" />
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-amber-400">
            Analyst Intelligence Wire
          </span>
        </div>
        <button
          type="button"
          onClick={() => setHeadlineIdx((headlineIdx + 1) % headlines.length)}
          className="text-[11px] font-mono text-slate-300 hover:text-white px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.1] cursor-pointer"
        >
          Next Scoop ↻
        </button>
      </div>

      <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-500/[0.08] to-transparent border border-amber-500/25 space-y-3">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-amber-400 font-bold uppercase tracking-widest">
            ● {curr.source}
          </span>
          <span className="text-slate-400">JUST IN</span>
        </div>

        <p className="text-base font-bold text-white leading-snug">
          &ldquo;{curr.headline}&rdquo;
        </p>

        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300">Target: <strong className="text-white">{curr.target}</strong></span>
          <span className="font-bold px-2 py-0.5 rounded text-[11px]" style={{ color: curr.color, backgroundColor: `${curr.color}1F` }}>
            {curr.impact} ({curr.drift})
          </span>
        </div>
      </div>

      <p className="text-xs font-mono text-slate-400 text-center">
        ⚡ The edge belongs to the trader who acts in the first 5 seconds.
      </p>
    </div>
  );
}

function EndgameInteractiveWidget() {
  return (
    <div className="rounded-3xl bg-[#0D1117]/90 border border-white/[0.12] p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-rose-400">
            Auto-Liquidation Protocol
          </span>
        </div>
        <span className="text-xs font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          T-MINUS 5:00
        </span>
      </div>

      <div className="space-y-3">
        <div className="p-4 rounded-2xl bg-rose-500/[0.08] border border-rose-500/25 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-xs uppercase">
            <AlertTriangle className="w-4 h-4" />
            <span>The 5-Minute Hard Freeze</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-mono">
            When 5 minutes remain on the master tournament clock, trading floors lock permanently. Every resting share across all traders is liquidated to cash at current market value.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-slate-400 block text-[10px] uppercase">Leaderboard Basis</span>
            <strong className="text-white text-sm">100% Realized Cash</strong>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-slate-400 block text-[10px] uppercase">Resting Limit Orders</span>
            <strong className="text-amber-400 text-sm">Auto-Cancelled & Refunded</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- The Tournament Combat Steps ---------- */

const STEPS = [
  {
    id: 'mindset',
    badge: 'STAGE 01 // MANDATE',
    title: 'Grow Your 20,000 IC War Chest',
    subtitle: 'Level playing field. Same 15 companies. Whoever stacks the largest portfolio before the closing bell takes the trophy.',
    coreRule: 'Net Worth = Liquid Cash + Market Value of Held Shares.',
    tactics: [
      'Cash sitting on the sidelines earns 0% — don\'t be a spectator.',
      'Riding a falling knife ruins your standing — cut losers relentlessly.',
      'Every tick is real-time: your net worth moves dynamically with the market tape.'
    ],
    proTip: 'A disciplined trader holding 2 winning positions beats an over-diversified trader with 10 random stocks.',
    Visual: GoalInteractiveWidget
  },
  {
    id: 'radar',
    badge: 'STAGE 02 // SURVEILLANCE',
    title: 'Master the Trading Floor',
    subtitle: 'Every card on your dashboard is a real-time battleground ticking every 6 seconds.',
    coreRule: 'Color shows past trajectory — NOT future destination.',
    tactics: [
      'Green pills mean the stock is above today\'s open; Red means below open.',
      'Check the 15-minute sparkline under each card before making your entry.',
      'Click any stock card to expand its full institutional candle chart and trade ticket.'
    ],
    proTip: 'Don\'t chase a green candle that just jumped 25%. Wait for the pullback or set a limit order below market.',
    Visual: MarketInteractiveWidget
  },
  {
    id: 'execution',
    badge: 'STAGE 03 // COMBAT',
    title: 'Lightning-Fast Instant Orders',
    subtitle: 'No slow popups. No delays. Hit Quick Buy or Quick Sell and execute instantly.',
    coreRule: 'The fill happens at the live server price the microsecond your click registers.',
    tactics: [
      'Use the stepper (− / +) or preset buttons (1, 5, 10, 50, 100) to size your position.',
      'Quick Buy debits your wallet immediately; Quick Sell returns liquid IC immediately.',
      'Zero brokerage fees — you trade on 100% raw spot pricing.'
    ],
    proTip: 'In fast market spikes, size your trades conservatively so you don\'t get trapped at the peak.',
    Visual: TradeInteractiveWidget
  },
  {
    id: 'sniping',
    badge: 'STAGE 04 // AUTOMATION',
    title: 'Deploy Resting Limit Orders',
    subtitle: 'Don\'t stare at the screen all day. Let limit orders execute while you study the news.',
    coreRule: 'A Limit BUY strikes when price hits target or lower. A Limit SELL strikes when price hits target or higher.',
    tactics: [
      'Set target buy prices 5% to 15% below market to catch panic dips automatically.',
      'Target funds are safely locked in escrow so you cannot accidentally overspend.',
      'Manage or cancel pending orders anytime in the "Limit Orders" tab with 1 click.'
    ],
    proTip: 'Before stepping away for a refreshment break, plant limit buy orders at bargain price floors.',
    Visual: LimitInteractiveWidget
  },
  {
    id: 'intel',
    badge: 'STAGE 05 // CATALYSTS',
    title: 'Trade the Breaking News Wire',
    subtitle: 'Analyst bulletins interrupt the trading session and trigger violent stock swings.',
    coreRule: 'Speed is your edge: breaking bulletins broadcast to all players at the exact same millisecond.',
    tactics: [
      'When the audible chime rings, immediately read the ticker headline.',
      'Identify the named company and determine whether it\'s positive or negative.',
      'Enter your trade in the first 10 seconds before the crowd bids the price away.'
    ],
    proTip: 'Missed a breaking headline? Open the dedicated News Wire in the sidebar to review all past dispatches.',
    Visual: NewsInteractiveWidget
  },
  {
    id: 'endgame',
    badge: 'STAGE 06 // THE CLOSING BELL',
    title: 'The 5-Minute Endgame Sweep',
    subtitle: 'The tournament timer in the header controls your fate. Know when the clock runs out.',
    coreRule: 'With 5 minutes remaining, trading floor permanently freezes and auto-liquidates.',
    tactics: [
      'All stocks held across all participants are automatically sold at live spot prices.',
      'All resting limit orders are cancelled and locked funds refunded to liquid cash.',
      'Final tournament winners are ranked solely on total cash net worth.'
    ],
    proTip: 'Never count on a last-second manual sell. Take profits in the final stretch before the freeze locks your position.',
    Visual: EndgameInteractiveWidget
  }
];

export function OnboardingTour({ isOpen, onClose }) {
  const [index, setIndex] = useState(0);
  const panelRef = useRef(null);
  const total = STEPS.length;
  const step = STEPS[index];
  const isLast = index === total - 1;

  const finish = useCallback(() => {
    try {
      localStorage.setItem('equity_arena_tour_completed', 'true');
    } catch (e) {
      /* ignore storage err */
    }
    onClose();
  }, [onClose]);

  const next = useCallback(() => setIndex((i) => (i >= total - 1 ? i : i + 1)), [total]);
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') finish();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, finish, next, prev]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [isOpen]);

  if (!isOpen) return null;

  const Visual = step.Visual;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      className="fixed inset-0 z-[100] bg-[#07090E] text-white overflow-y-auto focus:outline-none select-none font-sans"
    >
      {/* High-Octane Cyber Ambient Mesh */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[140px] opacity-40 bg-amber-500" />
        <div className="absolute top-1/2 -right-40 w-[650px] h-[650px] rounded-full blur-[160px] opacity-25 bg-emerald-500" />
        <div className="absolute -bottom-40 left-1/3 w-[700px] h-[700px] rounded-full blur-[160px] opacity-20 bg-indigo-600" />
        <div className="absolute inset-0 bg-[#07090E]/80 backdrop-blur-3xl" />
      </div>

      <div className="relative z-10 min-h-full flex flex-col justify-between">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 px-6 sm:px-12 py-4 bg-[#0A0D14]/90 border-b border-white/[0.08] backdrop-blur-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center font-black font-mono text-amber-400 shadow-[0_0_15px_rgba(240,180,41,0.25)]">
              EA
            </div>
            <div>
              <div className="text-xs font-mono font-bold tracking-[0.25em] text-amber-400 uppercase">
                Tournament Combat Manual
              </div>
              <div className="text-sm font-bold text-white tracking-wide">
                Equity Arena Trader Playbook
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-slate-300">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Section {index + 1} of {total}</span>
            </span>

            <button
              type="button"
              onClick={finish}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-mono font-bold text-slate-200 hover:text-white transition-all cursor-pointer"
            >
              <span>DISMISS</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Center Main Stage */}
        <main className="flex-1 w-full max-w-[1300px] mx-auto px-6 sm:px-12 py-10 sm:py-16">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
            {/* Left Content Column */}
            <div className="space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs tracking-wider">
                <Terminal className="w-3.5 h-3.5" />
                <span>{step.badge}</span>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-3">
                <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.08]">
                  {step.title}
                </h2>
                <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed">
                  {step.subtitle}
                </p>
              </div>

              {/* Core Rule Callout Pill */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-l-4 border-l-amber-400 border-y border-r border-white/[0.08]">
                <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold block mb-1">
                  Core Floor Rule
                </span>
                <span className="text-sm sm:text-base font-bold text-white">
                  {step.coreRule}
                </span>
              </div>

              {/* Tactical Action Points */}
              <div className="space-y-2.5 pt-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
                  Battleground Tactics
                </span>
                <div className="space-y-2">
                  {step.tactics.map((t, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 font-mono font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                        {t}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pit Floor Pro-Tip */}
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/25 text-emerald-300 text-xs sm:text-sm leading-relaxed">
                <Award className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-mono text-xs uppercase mb-0.5">Pit Master Insight:</strong>
                  <span>{step.proTip}</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Simulator Column */}
            <div className="lg:sticky lg:top-28">
              <Visual />
            </div>
          </div>
        </main>

        {/* Bottom Navigation Deck */}
        <footer className="sticky bottom-0 z-20 px-6 sm:px-12 py-5 bg-[#0A0D14]/95 border-t border-white/[0.08] backdrop-blur-2xl">
          <div className="max-w-[1300px] mx-auto flex items-center justify-between gap-4">
            {/* Progress Dots */}
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    i === index
                      ? 'w-10 bg-amber-400 shadow-[0_0_12px_rgba(240,180,41,0.6)]'
                      : 'w-2.5 bg-white/20 hover:bg-white/40'
                  }`}
                  title={s.title}
                />
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={prev}
                disabled={index === 0}
                className="px-5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] font-mono text-xs font-bold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">PREV</span>
              </button>

              <button
                type="button"
                onClick={isLast ? finish : next}
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(240,180,41,0.4)] active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>{isLast ? 'ENTER THE ARENA' : 'NEXT STAGE'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

