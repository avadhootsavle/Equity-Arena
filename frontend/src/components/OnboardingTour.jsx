import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Wallet, MousePointerClick, Target, LineChart, Newspaper, Trophy,
  ArrowRight, ArrowLeft, X, Check, AlertTriangle, Clock, Lightbulb,
  Zap, Flame, ShieldAlert, TrendingUp, TrendingDown, Crosshair,
  Volume2, Compass, Award, Sparkles, ChevronRight, Terminal
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/* ==================================================================
   Equity Arena — Tournament Combat Manual (Field Playbook)
   Full-screen takeover, 55/45 split, stage-tuned radial glow fields,
   high-contrast typography, and live tactile interactive preview widgets.
   All text preserved 100% verbatim.
   ================================================================== */

const ACCENT = '#F0B429';
const UP = '#10B981';
const DOWN = '#EF4444';

/* ---------- Stage-Specific Glow Configurations (Max 0.06 Opacity) ---------- */
// Stage 1: faint amber glow bottom left
// Stage 2: faint green glow top right
// Stage 3: faint amber glow center
// Stage 4: faint blue-grey glow bottom right
// Stage 5: faint red glow top left (urgent news)
// Stage 6: faint red glow center (endgame)
const STAGE_GLOWS = [
  'radial-gradient(ellipse 900px 700px at 0% 100%, rgba(240, 180, 41, 0.06) 0%, transparent 70%)',
  'radial-gradient(ellipse 900px 700px at 100% 0%, rgba(16, 185, 129, 0.06) 0%, transparent 70%)',
  'radial-gradient(ellipse 850px 650px at 50% 50%, rgba(240, 180, 41, 0.06) 0%, transparent 70%)',
  'radial-gradient(ellipse 900px 700px at 100% 100%, rgba(100, 116, 139, 0.06) 0%, transparent 70%)',
  'radial-gradient(ellipse 900px 700px at 0% 0%, rgba(239, 68, 68, 0.06) 0%, transparent 70%)',
  'radial-gradient(ellipse 850px 650px at 50% 50%, rgba(239, 68, 68, 0.06) 0%, transparent 70%)',
];

/* ---------- High-Impact Interactive Step Visuals ---------- */

function GoalInteractiveWidget({ isLight }) {
  const [allocation, setAllocation] = useState(65); // % in stocks
  const total = 20000;
  const inStocks = Math.round((total * allocation) / 100);
  const inCash = total - inStocks;
  const mockGain = Math.round(inStocks * 0.18);
  const projected = total + mockGain;

  return (
    <div
      className={`rounded-2xl border transition-all p-6 sm:p-7 space-y-5 backdrop-blur-xl relative overflow-hidden ${
        isLight
          ? 'bg-white border-[#E2E8F0] shadow-[0_12px_40px_rgba(0,0,0,0.06)]'
          : 'bg-[#101520] border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.6)]'
      }`}
      style={{
        borderTop: '2px solid #F0B429',
        boxShadow: isLight
          ? 'inset 0 1px 0 rgba(240,180,41,0.2), 0 12px 40px rgba(0,0,0,0.06)'
          : 'inset 0 1px 2px rgba(240,180,41,0.18), inset 0 0 40px rgba(240,180,41,0.02), 0 20px 50px rgba(0,0,0,0.6)'
      }}
    >
      <div className={`flex items-center justify-between border-b pb-3.5 ${isLight ? 'border-slate-200' : 'border-white/[0.08]'}`}>
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-emerald-400">
            Tactical Capital Simulator
          </span>
        </div>
        <span className={`font-mono text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Drag Slider
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono">
          <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Capital Deployment</span>
          <span className="font-bold text-[#F0B429]">{allocation}% Risk-On</span>
        </div>
        <input
          type="range"
          min="10"
          max="95"
          value={allocation}
          onChange={(e) => setAllocation(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#F0B429]"
        />
        <div className={`flex justify-between text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
          <span>Safe / Idle (10%)</span>
          <span>Aggressive Speculation (95%)</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className={`p-3.5 rounded-xl border space-y-1 ${
          isLight
            ? 'bg-slate-50 border-slate-200'
            : 'bg-white/[0.03] border-white/[0.06]'
        }`}>
          <span className={`text-[10px] font-mono uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Liquid Reserve
          </span>
          <span className={`text-xl font-mono font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {inCash.toLocaleString()} <span className="text-xs text-[#F0B429]">IC</span>
          </span>
          <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
            Dry powder for dips
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 space-y-1">
          <span className="text-[10px] font-mono text-[#F0B429] uppercase tracking-wider block">
            Active Positions
          </span>
          <span className={`text-xl font-mono font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {inStocks.toLocaleString()} <span className="text-xs text-[#F0B429]">IC</span>
          </span>
          <span className="text-[10px] text-emerald-400 font-mono block">
            +{mockGain.toLocaleString()} IC at +18%
          </span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono text-emerald-400 font-bold block uppercase tracking-wider">
            Projected Portfolio Value
          </span>
          <span className={`text-2xl font-mono font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {projected.toLocaleString()} IC
          </span>
        </div>
        <div className="text-right">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-extrabold text-xs">
            +{(mockGain / total * 100).toFixed(1)}%
          </span>
          <span className={`text-[10px] block mt-1 font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Leaderboard Rank #1
          </span>
        </div>
      </div>
    </div>
  );
}

function MarketInteractiveWidget({ isLight }) {
  const [activeStock, setActiveStock] = useState('ANAG');

  const stocks = [
    { code: 'ANAG', name: 'Annapurna Agro', price: 46.80, change: 5.4, sector: 'Agri', vol: '1.2M', sentiment: 'BULLISH' },
    { code: 'RTB', name: 'Rashtriya Trust Bank', price: 2540.10, change: -3.2, sector: 'Banking', vol: '840K', sentiment: 'BEARISH' },
    { code: 'GSL', name: 'Ganga Shipping', price: 94.50, change: 1.8, sector: 'Logistics', vol: '2.4M', sentiment: 'STABLE' },
  ];

  const sel = stocks.find(s => s.code === activeStock) || stocks[0];

  return (
    <div
      className={`rounded-2xl border transition-all p-6 sm:p-7 space-y-4 backdrop-blur-xl relative overflow-hidden ${
        isLight
          ? 'bg-white border-[#E2E8F0] shadow-[0_12px_40px_rgba(0,0,0,0.06)]'
          : 'bg-[#101520] border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.6)]'
      }`}
      style={{
        borderTop: '2px solid #F0B429',
        boxShadow: isLight
          ? 'inset 0 1px 0 rgba(240,180,41,0.2), 0 12px 40px rgba(0,0,0,0.06)'
          : 'inset 0 1px 2px rgba(240,180,41,0.18), inset 0 0 40px rgba(240,180,41,0.02), 0 20px 50px rgba(0,0,0,0.6)'
      }}
    >
      <div className={`flex items-center justify-between border-b pb-3.5 ${isLight ? 'border-slate-200' : 'border-white/[0.08]'}`}>
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F0B429] animate-pulse" />
          <span className={`font-mono text-xs font-bold uppercase tracking-widest ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Live Trading Floor Feed
          </span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          ● TICKER RUNNING
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {stocks.map(s => {
          const isUp = s.change >= 0;
          const isActive = s.code === activeStock;
          return (
            <button
              key={s.code}
              type="button"
              onClick={() => setActiveStock(s.code)}
              className={`p-3 rounded-xl text-left transition-all border cursor-pointer ${
                isActive
                  ? 'bg-amber-500/15 border-[#F0B429] shadow-[0_0_20px_rgba(240,180,41,0.2)] scale-[1.02]'
                  : isLight
                    ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
              }`}
            >
              <div className="font-mono font-black text-xs flex items-center justify-between">
                <span className={isLight ? 'text-slate-900' : 'text-white'}>{s.code}</span>
                <span className={`text-[10px] ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isUp ? '▲' : '▼'} {Math.abs(s.change)}%
                </span>
              </div>
              <div className={`text-sm font-mono font-bold mt-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                {s.price.toFixed(2)}
              </div>
            </button>
          );
        })}
      </div>

      <div className={`p-4 rounded-xl border space-y-3 ${
        isLight
          ? 'bg-slate-50/80 border-slate-200'
          : 'bg-gradient-to-br from-white/[0.04] to-transparent border-white/[0.08]'
      }`}>
        <div className="flex justify-between items-start">
          <div>
            <h4 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <span>{sel.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {sel.sector}
              </span>
            </h4>
            <div className={`text-xs font-mono mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Spot: <strong className={`text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{sel.price.toFixed(2)} IC</strong>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-extrabold ${
            sel.change >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
          }`}>
            {sel.change >= 0 ? 'STRONG BID' : 'HEAVY OFFER'}
          </span>
        </div>

        <div className={`flex items-center justify-between text-[11px] font-mono pt-2 border-t ${
          isLight ? 'border-slate-200 text-slate-600' : 'border-white/[0.06] text-slate-400'
        }`}>
          <span>Floor Vol: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{sel.vol}</strong></span>
          <span>Tape Drift: <strong className="text-[#F0B429]">±2.5% / 6s</strong></span>
          <span>Action: <strong className="text-emerald-400">Click to Open Ticket</strong></span>
        </div>
      </div>
    </div>
  );
}

function TradeInteractiveWidget({ isLight }) {
  const [qty, setQty] = useState(5);
  const [action, setAction] = useState('BUY');
  const price = 48.50;
  const cost = (qty * price).toFixed(2);

  return (
    <div
      className={`rounded-2xl border transition-all p-6 sm:p-7 space-y-5 backdrop-blur-xl relative overflow-hidden ${
        isLight
          ? 'bg-white border-[#E2E8F0] shadow-[0_12px_40px_rgba(0,0,0,0.06)]'
          : 'bg-[#101520] border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.6)]'
      }`}
      style={{
        borderTop: '2px solid #F0B429',
        boxShadow: isLight
          ? 'inset 0 1px 0 rgba(240,180,41,0.2), 0 12px 40px rgba(0,0,0,0.06)'
          : 'inset 0 1px 2px rgba(240,180,41,0.18), inset 0 0 40px rgba(240,180,41,0.02), 0 20px 50px rgba(0,0,0,0.6)'
      }}
    >
      <div className={`flex items-center justify-between border-b pb-3.5 ${isLight ? 'border-slate-200' : 'border-white/[0.08]'}`}>
        <div className="flex items-center gap-2.5">
          <Zap className="w-4 h-4 text-[#F0B429]" />
          <span className={`font-mono text-xs font-bold uppercase tracking-widest ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Live Ticket Terminal
          </span>
        </div>
        <span className={`font-mono text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Instant Execution
        </span>
      </div>

      <div className={`flex items-center gap-2 p-1.5 rounded-xl border ${
        isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/40 border-white/[0.08]'
      }`}>
        <button
          type="button"
          onClick={() => setAction('BUY')}
          className={`flex-1 py-2 rounded-lg font-mono text-xs font-black uppercase transition-all cursor-pointer ${
            action === 'BUY'
              ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
              : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
          }`}
        >
          ● BUY (Go Long)
        </button>
        <button
          type="button"
          onClick={() => setAction('SELL')}
          className={`flex-1 py-2 rounded-lg font-mono text-xs font-black uppercase transition-all cursor-pointer ${
            action === 'SELL'
              ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
              : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
          }`}
        >
          ● SELL (Liquidate)
        </button>
      </div>

      <div className="space-y-2">
        <span className={`text-[11px] font-mono block uppercase ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          Order Size (Shares)
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            className={`w-12 h-12 rounded-xl border text-xl font-mono flex items-center justify-center cursor-pointer transition-all active:scale-95 ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-900'
                : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.1] text-white'
            }`}
          >
            −
          </button>
          <div className={`flex-1 h-12 rounded-xl border flex items-center justify-center font-mono text-2xl font-black text-[#F0B429] ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/50 border-white/[0.15]'
          }`}>
            {qty}
          </div>
          <button
            type="button"
            onClick={() => setQty(qty + 1)}
            className={`w-12 h-12 rounded-xl border text-xl font-mono flex items-center justify-center cursor-pointer transition-all active:scale-95 ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-900'
                : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.1] text-white'
            }`}
          >
            +
          </button>
        </div>
      </div>

      <div className={`p-4 rounded-xl border flex items-center justify-between font-mono ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/[0.06]'
      }`}>
        <div>
          <span className={`text-[10px] uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Est. Trade Total
          </span>
          <span className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{cost} IC</span>
        </div>
        <div className={`text-right text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          <div>Fee: <strong className="text-emerald-400">0.00 IC (Zero)</strong></div>
          <div>Fill: <strong className="text-[#F0B429]">Immediate</strong></div>
        </div>
      </div>
    </div>
  );
}

function LimitInteractiveWidget({ isLight }) {
  const [target, setTarget] = useState(42.00);
  const livePrice = 46.50;
  const isBuyDiscount = target < livePrice;

  return (
    <div
      className={`rounded-2xl border transition-all p-6 sm:p-7 space-y-5 backdrop-blur-xl relative overflow-hidden ${
        isLight
          ? 'bg-white border-[#E2E8F0] shadow-[0_12px_40px_rgba(0,0,0,0.06)]'
          : 'bg-[#101520] border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.6)]'
      }`}
      style={{
        borderTop: '2px solid #F0B429',
        boxShadow: isLight
          ? 'inset 0 1px 0 rgba(240,180,41,0.2), 0 12px 40px rgba(0,0,0,0.06)'
          : 'inset 0 1px 2px rgba(240,180,41,0.18), inset 0 0 40px rgba(240,180,41,0.02), 0 20px 50px rgba(0,0,0,0.6)'
      }}
    >
      <div className={`flex items-center justify-between border-b pb-3.5 ${isLight ? 'border-slate-200' : 'border-white/[0.08]'}`}>
        <div className="flex items-center gap-2.5">
          <Crosshair className="w-4 h-4 text-[#F0B429]" />
          <span className={`font-mono text-xs font-bold uppercase tracking-widest ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Automated Limit Sniper
          </span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          BOT ACTIVE
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-baseline font-mono">
          <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Your Strike Price</span>
          <span className="text-2xl font-black text-[#F0B429]">{target.toFixed(2)} IC</span>
        </div>
        <input
          type="range"
          min="35"
          max="55"
          step="0.5"
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#F0B429]"
        />
        <div className="flex justify-between text-[11px] font-mono">
          <span className={isLight ? 'text-slate-500' : 'text-slate-500'}>Deep Dip (35 IC)</span>
          <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Current Spot: {livePrice.toFixed(2)} IC</span>
          <span className={isLight ? 'text-slate-500' : 'text-slate-500'}>Spike Top (55 IC)</span>
        </div>
      </div>

      <div className={`p-4 rounded-xl border transition-all ${
        isBuyDiscount
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-amber-500/10 border-amber-500/30'
      }`}>
        <div className="flex items-start gap-2.5">
          <Target className="w-5 h-5 text-[#F0B429] flex-shrink-0 mt-0.5" />
          <div className="text-xs font-mono space-y-1">
            <span className={`font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {isBuyDiscount ? '🎯 Limit Buy Resting Below Market' : '⚡ Instant Trigger or Sell Setup'}
            </span>
            <p className={`leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
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

function NewsInteractiveWidget({ isLight }) {
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
    <div
      className={`rounded-2xl border transition-all p-6 sm:p-7 space-y-4 backdrop-blur-xl relative overflow-hidden ${
        isLight
          ? 'bg-white border-[#E2E8F0] shadow-[0_12px_40px_rgba(0,0,0,0.06)]'
          : 'bg-[#101520] border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.6)]'
      }`}
      style={{
        borderTop: '2px solid #F0B429',
        boxShadow: isLight
          ? 'inset 0 1px 0 rgba(240,180,41,0.2), 0 12px 40px rgba(0,0,0,0.06)'
          : 'inset 0 1px 2px rgba(240,180,41,0.18), inset 0 0 40px rgba(240,180,41,0.02), 0 20px 50px rgba(0,0,0,0.6)'
      }}
    >
      <div className={`flex items-center justify-between border-b pb-3.5 ${isLight ? 'border-slate-200' : 'border-white/[0.08]'}`}>
        <div className="flex items-center gap-2.5">
          <Flame className="w-4 h-4 text-[#F0B429]" />
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#F0B429]">
            Analyst Intelligence Wire
          </span>
        </div>
        <button
          type="button"
          onClick={() => setHeadlineIdx((headlineIdx + 1) % headlines.length)}
          className={`text-[11px] font-mono px-2 py-0.5 rounded border cursor-pointer transition-all ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              : 'text-slate-300 hover:text-white bg-white/[0.06] border-white/[0.1]'
          }`}
        >
          Next Scoop ↻
        </button>
      </div>

      <div className={`p-5 rounded-xl border space-y-3 ${
        isLight
          ? 'bg-amber-500/[0.05] border-amber-500/25'
          : 'bg-gradient-to-b from-amber-500/[0.08] to-transparent border-amber-500/25'
      }`}>
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-[#F0B429] font-bold uppercase tracking-widest">
            ● {curr.source}
          </span>
          <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>JUST IN</span>
        </div>

        <p className={`text-base font-bold leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>
          &ldquo;{curr.headline}&rdquo;
        </p>

        <div className={`pt-2 border-t flex items-center justify-between text-xs font-mono ${
          isLight ? 'border-slate-200 text-slate-700' : 'border-white/[0.06] text-slate-300'
        }`}>
          <span>Target: <strong className={isLight ? 'text-slate-950' : 'text-white'}>{curr.target}</strong></span>
          <span className="font-bold px-2 py-0.5 rounded text-[11px]" style={{ color: curr.color, backgroundColor: `${curr.color}1F` }}>
            {curr.impact} ({curr.drift})
          </span>
        </div>
      </div>

      <p className={`text-xs font-mono text-center ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
        ⚡ The edge belongs to the trader who acts in the first 5 seconds.
      </p>
    </div>
  );
}

function EndgameInteractiveWidget({ isLight }) {
  return (
    <div
      className={`rounded-2xl border transition-all p-6 sm:p-7 space-y-4 backdrop-blur-xl relative overflow-hidden ${
        isLight
          ? 'bg-white border-[#E2E8F0] shadow-[0_12px_40px_rgba(0,0,0,0.06)]'
          : 'bg-[#101520] border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.6)]'
      }`}
      style={{
        borderTop: '2px solid #F0B429',
        boxShadow: isLight
          ? 'inset 0 1px 0 rgba(240,180,41,0.2), 0 12px 40px rgba(0,0,0,0.06)'
          : 'inset 0 1px 2px rgba(240,180,41,0.18), inset 0 0 40px rgba(240,180,41,0.02), 0 20px 50px rgba(0,0,0,0.6)'
      }}
    >
      <div className={`flex items-center justify-between border-b pb-3.5 ${isLight ? 'border-slate-200' : 'border-white/[0.08]'}`}>
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-rose-400">
            Auto-Liquidation Protocol
          </span>
        </div>
        <span className="text-xs font-mono text-[#F0B429] font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          T-MINUS 5:00
        </span>
      </div>

      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-rose-500/[0.08] border border-rose-500/25 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-xs uppercase">
            <AlertTriangle className="w-4 h-4" />
            <span>The 5-Minute Hard Freeze</span>
          </div>
          <p className={`text-xs leading-relaxed font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            When 5 minutes remain on the master tournament clock, trading floors lock permanently. Every resting share across all traders is liquidated to cash at current market value.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
          <div className={`p-3 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/[0.06]'
          }`}>
            <span className={`block text-[10px] uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Leaderboard Basis</span>
            <strong className={`text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>100% Realized Cash</strong>
          </div>
          <div className={`p-3 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/[0.06]'
          }`}>
            <span className={`block text-[10px] uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Resting Limit Orders</span>
            <strong className="text-[#F0B429] text-sm">Auto-Cancelled & Refunded</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- The Tournament Combat Steps (Exact Verbatim Content) ---------- */

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

  const { theme } = useTheme();
  const isLight = theme === 'light';

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
  const currentGlow = STAGE_GLOWS[index] || STAGE_GLOWS[0];

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      className={`fixed inset-0 z-[100] overflow-y-auto focus:outline-none select-none font-sans transition-colors duration-300 ${
        isLight ? 'bg-[#F0F2F7] text-slate-900' : 'bg-[#07090E] text-white'
      }`}
    >
      {/* Dynamic Stage-Tuned Subtle Radial Glow Layer (Max 0.06 Opacity) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 transition-all duration-700 ease-out"
        style={{
          background: currentGlow
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col justify-between">
        {/* Top Header Bar */}
        <header className={`sticky top-0 z-20 px-6 sm:px-12 py-3.5 border-b backdrop-blur-xl flex items-center justify-between transition-colors ${
          isLight
            ? 'bg-[#F0F2F7]/90 border-slate-300/80'
            : 'bg-[#07090E]/90 border-white/[0.08]'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center font-black font-mono text-[#F0B429] shadow-[0_0_15px_rgba(240,180,41,0.25)]">
              EA
            </div>
            <div>
              <div className="text-[11px] font-mono font-bold tracking-[0.25em] text-[#F0B429] uppercase">
                Tournament Combat Manual
              </div>
              <div className={`text-sm font-bold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Equity Arena Trader Playbook
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Small and Muted Section Indicator */}
            <span className={`text-xs font-mono font-medium tracking-wide ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
              Section {index + 1} of {total}
            </span>

            {/* Clear DISMISS button in both modes */}
            <button
              type="button"
              onClick={finish}
              data-tour-action="dismiss"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-950 shadow-sm'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.12] text-slate-300 hover:text-white'
              }`}
            >
              <span>DISMISS</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Center Main Stage: Full-Screen Takeover Two-Column Split (55% Left, 45% Right) */}
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 sm:px-12 py-8 sm:py-12 flex items-center">
          <div className="w-full grid lg:grid-cols-[55%_45%] gap-10 lg:gap-14 items-center">
            
            {/* Left Content Column (55% width) */}
            <div className="space-y-6 max-w-[720px]">
              
              {/* Pulsing Live Stage Pill Badge */}
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border font-mono font-bold text-xs tracking-wider ${
                isLight
                  ? 'bg-white border-[#F0B429] text-[#B45309] shadow-xs'
                  : 'bg-[#0D1117] border-[#F0B429] text-[#F0B429] shadow-[0_0_15px_rgba(240,180,41,0.15)]'
              }`}>
                <span className="w-2 h-2 rounded-full bg-[#F0B429] animate-pulse" />
                <span>{step.badge}</span>
              </div>

              {/* High-Impact Main Heading (52px minimum, 800 weight) */}
              <div className="space-y-3">
                <h1
                  className={`font-extrabold tracking-tight leading-[1.05] ${
                    isLight ? 'text-slate-950' : 'text-white'
                  }`}
                  style={{ fontSize: 'clamp(38px, 4.2vw, 56px)', fontWeight: 800 }}
                >
                  {step.title}
                </h1>
                <p className={`text-base sm:text-lg font-medium leading-relaxed ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  {step.subtitle}
                </p>
              </div>

              {/* Highlighted Dramatic CORE FLOOR RULE Box */}
              <div
                className={`p-4 sm:p-5 rounded-xl border border-y border-r transition-all ${
                  isLight
                    ? 'border-slate-300/80'
                    : 'border-white/[0.08]'
                }`}
                style={{
                  backgroundColor: 'rgba(240, 180, 41, 0.08)',
                  borderLeft: '3px solid #F0B429'
                }}
              >
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#F0B429] font-bold block mb-1.5">
                  Core Floor Rule
                </span>
                <p
                  className={`font-semibold leading-snug ${
                    isLight ? 'text-slate-950' : 'text-white'
                  }`}
                  style={{ fontSize: '17px', fontWeight: 600 }}
                >
                  {step.coreRule}
                </p>
              </div>

              {/* Tactile BATTLEGROUND TACTICS List */}
              <div className="space-y-2.5 pt-1">
                <span className={`text-xs font-mono uppercase tracking-wider font-bold block ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  Battleground Tactics
                </span>
                <div className="space-y-2">
                  {step.tactics.map((t, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3.5 p-3 sm:p-3.5 rounded-xl border transition-all ${
                        isLight
                          ? 'bg-white border-slate-200 shadow-xs'
                          : 'bg-[#101520] border-white/[0.06]'
                      }`}
                      style={{
                        borderLeft: '2px solid rgba(240, 180, 41, 0.4)'
                      }}
                    >
                      <span className="w-5 h-5 rounded-md bg-amber-500/20 text-[#F0B429] font-mono font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className={`text-xs sm:text-sm font-medium leading-relaxed ${
                        isLight ? 'text-slate-800' : 'text-slate-200'
                      }`}>
                        {t}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personality-Packed PIT MASTER INSIGHT Box with subtle diagonal stripes */}
              <div
                className={`flex items-start gap-3.5 p-4 rounded-xl border relative overflow-hidden ${
                  isLight
                    ? 'border-emerald-600/30'
                    : 'border-emerald-500/25'
                }`}
                style={{
                  backgroundColor: isLight ? 'rgba(5, 150, 105, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                  backgroundImage: `repeating-linear-gradient(45deg, rgba(16, 185, 129, 0.03) 0, rgba(16, 185, 129, 0.03) 2px, transparent 0, transparent 8px)`
                }}
              >
                <Award className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="relative z-10">
                  <strong className={`block font-mono text-xs uppercase mb-1 tracking-wider ${
                    isLight ? 'text-emerald-800' : 'text-emerald-300'
                  }`}>
                    Pit Master Insight:
                  </strong>
                  <span
                    className="text-xs sm:text-sm leading-relaxed"
                    style={{ color: isLight ? '#1E293B' : '#F1F5F9' }}
                  >
                    {step.proTip}
                  </span>
                </div>
              </div>

            </div>

            {/* Right Column: Institutional Terminal Preview Widget (45% width) */}
            <div className="w-full">
              <Visual isLight={isLight} />
            </div>

          </div>
        </main>

        {/* Bottom Navigation Deck */}
        <footer className={`sticky bottom-0 z-20 px-6 sm:px-12 py-4 border-t backdrop-blur-xl transition-colors ${
          isLight
            ? 'bg-[#F0F2F7]/95 border-slate-300/80'
            : 'bg-[#07090E]/95 border-white/[0.08]'
        }`}>
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
            
            {/* Progress Dots with Smooth Transitions: Active amber 10px, Inactive grey 6px */}
            <div className="flex items-center gap-2.5">
              {STEPS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`rounded-full transition-all duration-300 cursor-pointer ${
                    i === index
                      ? 'w-2.5 h-2.5 bg-[#F0B429] shadow-[0_0_12px_rgba(240,180,41,0.7)] scale-100'
                      : isLight
                        ? 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
                        : 'w-1.5 h-1.5 bg-slate-600 hover:bg-slate-400'
                  }`}
                  style={{
                    width: i === index ? '10px' : '6px',
                    height: i === index ? '10px' : '6px'
                  }}
                  title={s.title}
                />
              ))}
            </div>

            {/* Navigation Buttons: PREV & 48px NEXT STAGE / ENTER THE ARENA */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={prev}
                disabled={index === 0}
                data-tour-action="prev"
                className={`px-5 py-2.5 rounded-xl border font-mono text-xs font-bold disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5 ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-xs'
                    : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.1] text-slate-300'
                }`}
                style={{ height: '48px' }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">PREV</span>
              </button>

              <button
                type="button"
                onClick={isLast ? finish : next}
                data-tour-action="next"
                className={`px-7 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 active:scale-95 ${
                  isLast
                    ? 'bg-[#F0B429] hover:bg-[#ffc63d] text-slate-950 shadow-[0_0_35px_rgba(240,180,41,0.6)] animate-pulse'
                    : 'bg-[#F0B429] hover:bg-[#f5bc38] text-slate-950 shadow-[0_0_20px_rgba(240,180,41,0.35)]'
                }`}
                style={{
                  height: '48px',
                  fontWeight: 700,
                  minWidth: isLast ? '190px' : '150px'
                }}
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
