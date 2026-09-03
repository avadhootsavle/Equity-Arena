import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Wallet, MousePointerClick, Target, LineChart, Newspaper, Trophy,
  ArrowRight, ArrowLeft, X, Check, AlertTriangle, Clock, Lightbulb,
  Zap, Flame, ShieldAlert, TrendingUp, TrendingDown, Crosshair,
  Volume2, Compass, Award, Sparkles, ChevronRight, Terminal, Search, Building
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
  const [activeStock, setActiveStock] = useState('M&M');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const ALL_STOCKS = [
    // Main Stocks (15)
    { code: 'HDFB', name: 'HDFB Bank', sector: 'Banking', price: 1800.00, change: 3.4, vol: '1.4M', isPenny: false, desc: 'Leading private bank providing retail banking, loans, mortgages, and credit facilities across India.' },
    { code: 'ICCO', name: 'ICICO Bank', sector: 'Banking', price: 1250.00, change: -1.8, vol: '1.1M', isPenny: false, desc: 'Premier financial powerhouse known for digital consumer banking, corporate lending, and retail credit.' },
    { code: 'TCX', name: 'TCX', sector: 'IT', price: 4200.00, change: 2.6, vol: '890K', isPenny: false, desc: 'Global leader in IT services, cloud infrastructure migration, and enterprise software consultancy.' },
    { code: 'INFS', name: 'Infisys', sector: 'IT', price: 1600.00, change: -0.9, vol: '1.8M', isPenny: false, desc: 'Top Indian digital IT giant delivering enterprise technology, AI modernization, and cloud software solutions.' },
    { code: 'HAAL', name: 'HAAL', sector: 'Defence & Aerospace', price: 5000.00, change: 6.2, vol: '720K', isPenny: false, desc: 'Premier state-backed aerospace contractor manufacturing military fighter aircraft and defense helicopters.' },
    { code: 'BEEL', name: 'BEEL', sector: 'Defence & Aerospace', price: 420.00, change: 1.5, vol: '2.3M', isPenny: false, desc: 'High-tech defense electronics manufacturer producing tactical radar, sonar, and avionics systems.' },
    { code: 'SURY', name: 'Suryan Pharma', sector: 'Pharmaceuticals', price: 1900.00, change: -2.1, vol: '640K', isPenny: false, desc: 'Major pharmaceutical giant developing specialty generic formulations, therapies, and active drugs.' },
    { code: 'CPLX', name: 'Ciplex', sector: 'Pharmaceuticals', price: 1500.00, change: 4.1, vol: '910K', isPenny: false, desc: 'Global healthcare and pharmaceutical company specializing in respiratory medications and lifesaving treatments.' },
    { code: 'AIRT', name: 'Bharat Airtell', sector: 'Telecommunications', price: 1850.00, change: 1.2, vol: '1.5M', isPenny: false, desc: 'Leading telecom provider delivering high-speed 5G mobile networks, broadband, and enterprise connectivity.' },
    { code: 'TATV', name: 'Tatva Motors', sector: 'Automobile', price: 950.00, change: 3.8, vol: '3.1M', isPenny: false, desc: 'Leading automotive powerhouse manufacturing passenger cars, electric vehicles, and commercial heavy trucks.' },
    { code: 'M&M', name: 'M&M', sector: 'Automobile', price: 3000.00, change: 4.5, vol: '1.2M', isPenny: false, desc: 'India’s top utility vehicle and tractor manufacturer specializing in rugged SUVs, farm machinery, and EVs.' },
    { code: 'RELI', name: 'Reliants Industries', sector: 'Energy (Oil & Gas)', price: 2900.00, change: -1.2, vol: '2.0M', isPenny: false, desc: 'Mega-conglomerate dominating oil refining, petrochemicals, energy infrastructure, and retail.' },
    { code: 'ONGC', name: 'ONGCO', sector: 'Energy (Oil & Gas)', price: 350.00, change: 0.8, vol: '4.5M', isPenny: false, desc: 'India’s largest upstream crude oil and natural gas exploration and offshore production company.' },
    { code: 'DLEF', name: 'DLEF', sector: 'Real Estate', price: 850.00, change: 2.1, vol: '1.3M', isPenny: false, desc: 'Premier real estate builder developing luxury residential townships and prime commercial offices.' },
    { code: 'GODR', name: 'Godrej Properties', sector: 'Real Estate', price: 2700.00, change: -1.5, vol: '550K', isPenny: false, desc: 'Top-tier sustainable real estate developer creating modern premium housing and urban living projects.' },

    // Penny Stocks (5) (< 100 IC)
    { code: 'IDEA', name: 'Vodfone Idea', sector: 'Telecommunications', price: 18.00, change: 8.5, vol: '12.4M', isPenny: true, desc: 'Turnaround telecom operator expanding high-frequency 4G/5G mobile subscriber coverage.' },
    { code: 'SUZL', name: 'Suzlan', sector: 'Renewable Energy', price: 75.00, change: 5.8, vol: '8.7M', isPenny: true, desc: 'Wind energy technology leader supplying commercial wind turbines and green renewable power solutions.' },
    { code: 'IRED', name: 'IREDAA', sector: 'Renewable Energy', price: 95.00, change: 7.2, vol: '6.2M', isPenny: true, desc: 'Non-banking financial agency financing national green energy, solar grids, and clean power initiatives.' },
    { code: 'SAAL', name: 'SAAIL', sector: 'Metals & Mining', price: 98.00, change: -2.4, vol: '5.1M', isPenny: true, desc: 'State-owned steelmaking giant supplying industrial steel for mega infrastructure, railways, and construction.' },
    { code: 'NMDC', name: 'NMDCX', sector: 'Metals & Mining', price: 90.00, change: 1.9, vol: '4.8M', isPenny: true, desc: 'India’s largest iron ore miner supplying essential raw mineral ores to domestic blast furnaces.' }
  ];

  const filteredStocks = ALL_STOCKS.filter(s => {
    const matchesSector = sectorFilter === 'ALL' || (sectorFilter === 'PENNY' ? s.isPenny : s.sector === sectorFilter);
    const matchesSearch = searchQuery.trim() === '' || 
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.sector.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSector && matchesSearch;
  });

  const sel = ALL_STOCKS.find(s => s.code === activeStock) || ALL_STOCKS[0];

  return (
    <div
      className={`rounded-2xl border transition-all p-5 sm:p-6 space-y-4 backdrop-blur-xl relative overflow-hidden ${
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
      {/* Header */}
      <div className={`flex items-center justify-between border-b pb-3.5 ${isLight ? 'border-slate-300' : 'border-white/15'}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#F0B429] flex items-center justify-center text-black font-black">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <span className={`font-mono text-xs font-black uppercase tracking-wider block ${isLight ? 'text-slate-900' : 'text-white'}`}>
              20 Listed Equities Directory
            </span>
            <span className={`text-[11px] font-medium block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Click any stock below to inspect its business profile
            </span>
          </div>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-md border border-emerald-500/30 font-bold">
          20 / 20 ACTIVE
        </span>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search stock code (e.g. M&M, HAAL, RELI, SUZL)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 text-xs font-mono rounded-lg border-2 transition-all focus:outline-none focus:border-[#F0B429] ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500 font-bold'
                : 'bg-black/50 border-white/15 text-white placeholder:text-slate-400 font-bold'
            }`}
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-mono">
          {['ALL', 'PENNY', 'Automobile', 'Banking', 'IT', 'Defence & Aerospace', 'Pharmaceuticals', 'Telecommunications', 'Renewable Energy', 'Metals & Mining', 'Real Estate', 'Energy (Oil & Gas)'].map(sec => (
            <button
              key={sec}
              type="button"
              onClick={() => setSectorFilter(sec)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-all cursor-pointer font-black text-[11px] border ${
                sectorFilter === sec
                  ? 'bg-[#F0B429] text-black border-black shadow-[2px_2px_0px_#000000]'
                  : isLight
                    ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-black'
                    : 'bg-white/10 border-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              {sec === 'PENNY' ? '⚡ PENNY (<100 IC)' : sec}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Stock Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[175px] overflow-y-auto pr-1">
        {filteredStocks.map(s => {
          const isUp = s.change >= 0;
          const isActive = s.code === activeStock;
          return (
            <button
              key={s.code}
              type="button"
              onClick={() => setActiveStock(s.code)}
              className={`p-2.5 rounded-lg text-left transition-all border-2 cursor-pointer ${
                isActive
                  ? 'bg-[#F0B429]/20 border-[#F0B429] shadow-[0_0_14px_rgba(240,180,41,0.35)] ring-1 ring-[#F0B429]'
                  : isLight
                    ? 'bg-slate-50 border-slate-300 hover:border-slate-400 hover:bg-white'
                    : 'bg-[#141A28] border-white/10 hover:border-white/25 hover:bg-[#1A2234]'
              }`}
            >
              <div className="font-mono font-black text-xs flex items-center justify-between">
                <span className={`text-sm ${isActive ? 'text-[#F0B429]' : isLight ? 'text-slate-900' : 'text-white'}`}>
                  {s.code}
                </span>
                {s.isPenny && (
                  <span className="text-[9px] bg-pink-500/25 text-pink-400 border border-pink-500/40 px-1.5 py-0.2 rounded font-black tracking-wider">
                    PENNY
                  </span>
                )}
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className={`text-xs font-mono font-black ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  {s.price.toFixed(2)} IC
                </span>
                <span className={`text-[10px] font-mono font-extrabold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isUp ? '▲ +' : '▼ -'}{Math.abs(s.change)}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Stock Sector Profile & High-Readability 1-Line Description Card */}
      <div className={`p-4 rounded-xl border-2 space-y-3 transition-all ${
        isLight
          ? 'bg-amber-500/[0.08] border-amber-500/40 shadow-sm'
          : 'bg-[#161D2B] border-amber-500/50 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
      }`}>
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[#F0B429] font-mono font-black text-base tracking-wide bg-black/40 px-2 py-0.5 rounded border border-[#F0B429]/40">
                {sel.code}
              </span>
              <span className={`text-sm sm:text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {sel.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-[#232936] text-[#F0B429] font-black border border-[#F0B429]/30">
                Sector: {sel.sector}
              </span>
              {sel.isPenny && (
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-pink-500/20 text-pink-300 font-black border border-pink-500/40">
                  ⚡ Penny Speculation (&lt;100 IC)
                </span>
              )}
            </div>
          </div>
          <div className="text-right font-mono shrink-0">
            <span className={`text-base font-black block ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {sel.price.toFixed(2)} IC
            </span>
            <span className={`text-xs font-bold ${sel.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {sel.change >= 0 ? '▲ +' : '▼ -'}{Math.abs(sel.change)}% Spot
            </span>
          </div>
        </div>

        {/* Large, High-Contrast 1-Line Description Box */}
        <div className={`p-3.5 rounded-lg border-2 leading-relaxed ${
          isLight 
            ? 'bg-white border-amber-500/40 text-slate-900 shadow-xs' 
            : 'bg-[#0B0E14] border-amber-500/40 text-slate-100 shadow-inner'
        }`}>
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#F0B429] text-black font-black flex items-center justify-center text-xs shrink-0 mt-0.5">
              i
            </div>
            <div>
              <span className="text-[10px] font-mono font-black uppercase text-[#F0B429] tracking-wider block mb-0.5">
                Company & Business Summary:
              </span>
              <p className="text-sm font-semibold leading-snug">
                {sel.desc}
              </p>
            </div>
          </div>
        </div>

        <div className={`flex items-center justify-between text-xs font-mono pt-2 border-t ${
          isLight ? 'border-slate-300 text-slate-700' : 'border-white/10 text-slate-300'
        }`}>
          <span>Volume: <strong className={isLight ? 'text-slate-900 font-black' : 'text-white font-black'}>{sel.vol}</strong></span>
          <span>Drift: <strong className="text-[#F0B429] font-black">±1.5% / 6s</strong></span>
          <span>Execution: <strong className="text-emerald-400 font-black">Instant Fill</strong></span>
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
              {isBuyDiscount ? 'Limit Buy Resting Below Market' : 'Instant Trigger or Sell Setup'}
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
      headline: 'Border tensions escalate; government orders urgent emergency military fighter jet and missile radar production.',
      target: 'Defence & Aerospace (HAAL, BEEL)',
      impact: 'MASSIVE BULLISH',
      color: UP,
      drift: '+20% to +30%'
    },
    {
      source: 'BLOOMBERG FLASH',
      headline: 'War in Middle East and Russia shuts down major global pipelines; international crude oil price spikes above $120/barrel.',
      target: 'Energy (Reliants, ONGCO)',
      impact: 'STRONG RALLY',
      color: UP,
      drift: '+18% to +25%'
    },
    {
      source: 'ECONOMIC TIMES ALERTS',
      headline: 'Diwali festive holiday season sees record-breaking demand; millions of Indians rush to buy new cars and SUVs.',
      target: 'Automobile (Tatva Motors, M&M)',
      impact: 'BULLISH SURGE',
      color: UP,
      drift: '+15% to +25%'
    },
    {
      source: 'CNBC-TV18 DISPATCH',
      headline: 'Government announces ₹50,000 Crore mega subsidy package for green solar parks and giant wind turbine projects.',
      target: 'Renewable Energy (Suzlan, IREDAA)',
      impact: 'PENNY BREAKOUT',
      color: UP,
      drift: '+20% to +35%'
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

      <p className={`text-xs font-mono text-center font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
        The edge belongs to the trader who acts in the first 5 seconds.
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

/* ---------- The Tournament Field Playbook (Real Trader Desk Voice) ---------- */

const STEPS = [
  {
    id: 'mindset',
    badge: 'SECTION 01 // CAPITAL DISCIPLINE',
    title: 'Your 20,000 IC Bankroll',
    subtitle: 'Every trader starts with the exact same 20,000 IC cash. The trader who protects their capital and lets winners run wins the tournament.',
    coreRule: 'Net Worth = Liquid Cash + Live Market Value of Open Positions.',
    tactics: [
      'Cash isn\'t trash: keeping dry powder lets you pounce on sudden 20% panic dips.',
      'Cut your bleeders fast: holding onto a sinking stock hoping it recovers is how accounts blow up.',
      'The board updates live every 6 seconds: your tournament standing moves on every tick.'
    ],
    proTip: 'Quality over quantity. Concentrating your capital in 2 or 3 high-conviction trades will beat a messy portfolio of 10 random stocks every single time.',
    Visual: GoalInteractiveWidget
  },
  {
    id: 'radar',
    badge: 'SECTION 02 // READING THE TAPE',
    title: 'Work the Floor Like a Pro',
    subtitle: '20 listed equities across Blue Chips, Mid Caps, and highly volatile Penny Stocks. Prices drift live every 6 seconds.',
    coreRule: 'Green means price is above open. Red means below. Trend is your only friend.',
    tactics: [
      'Watch the 15-minute sparkline trend on each stock card before touching the buy button.',
      'Penny stocks (marked with the amber badge) swing wildly: high risk, explosive upside.',
      'Click any stock card to expand its full Candlestick chart and open its execution ticket.'
    ],
    proTip: 'Never chase a green candle that just rocketed up 20%. Let momentum cool off, wait for the pullback, or leave a limit order underneath the market.',
    Visual: MarketInteractiveWidget
  },
  {
    id: 'execution',
    badge: 'SECTION 03 // TRADE EXECUTION',
    title: 'Instant One-Click Fills',
    subtitle: 'No broker delays, zero slippage, zero commission fees. Spot market orders fill the instant you hit the button.',
    coreRule: 'Your order fills at the live price the exact millisecond your click hits the server.',
    tactics: [
      'Size your tickets quickly using presets (+1, +5, +10, +50, +100) or the stepper buttons.',
      'Buying draws from your available cash immediately; selling books realized IC straight back to your wallet.',
      'Monitor your Portfolio tab on the dashboard to review your average buy price and open P&L.'
    ],
    proTip: 'When market volatility peaks after news drops, scale in with smaller ticket sizes so you don\'t get filled at the exact top of the wick.',
    Visual: TradeInteractiveWidget
  },
  {
    id: 'sniping',
    badge: 'SECTION 04 // AUTOMATION & LIMITS',
    title: 'Automate Entries with Limit Orders',
    subtitle: 'Don\'t glue your eyes to the screen all day. Set target strike prices and let the matching engine catch market dips for you.',
    coreRule: 'A Limit BUY strikes when spot drops to target. A Limit SELL triggers when spot rallies to target.',
    tactics: [
      'Set target buy prices 5% to 15% below spot to automatically scoop panic sell-offs.',
      'Committed funds are held in secure escrow so you can never accidentally overdraw your wallet.',
      'Track or cancel unfulfilled limit orders anytime in your "Limit Orders" panel with 1 click.'
    ],
    proTip: 'Before stepping away or scanning the newsfeed, leave resting limit buy bids on strong stocks at attractive discount floors.',
    Visual: LimitInteractiveWidget
  },
  {
    id: 'intel',
    badge: 'SECTION 05 // BREAKING CATALYSTS',
    title: 'Trade the Breaking Wire',
    subtitle: 'Real-time analyst newsflashes hit the ticker unpredictably and trigger violent sector shifts.',
    coreRule: 'Speed is your edge. Breaking bulletins broadcast to all terminals at the exact same millisecond.',
    tactics: [
      'When the audible audio alert sounds, immediately scan the news banner at the top of your screen.',
      'Look at the named ticker symbol and determine if the catalyst is a positive booster or negative shock.',
      'Act inside the first 10 seconds before the rest of the room rushes in and prices adjust.'
    ],
    proTip: 'Missed the breaking alert? Open the News tab on your dashboard anytime to read the full historical transcript of all session dispatches.',
    Visual: NewsInteractiveWidget
  },
  {
    id: 'endgame',
    badge: 'SECTION 06 // THE CLOSING BELL',
    title: 'The 5-Minute Endgame Protocol',
    subtitle: 'The session clock in your header dictates the tournament finish. Know the exact countdown rules.',
    coreRule: 'When 5 minutes remain on the clock, trading locks permanently and auto-liquidation triggers.',
    tactics: [
      'Every open share across all traders is automatically liquidated to cash at spot prices.',
      'All resting limit orders are cancelled and escrowed funds are refunded in full to cash.',
      'The final live leaderboard podium is calculated 100% on realized cash net worth.'
    ],
    proTip: 'Don\'t gamble on a panic sell in the final 10 seconds. Lock in profits calmly in the final minutes before the 5-minute freeze takes over.',
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
        <header className={`sticky top-0 z-20 px-6 sm:px-12 py-3.5 border-b-2 border-black backdrop-blur-xl flex items-center justify-between transition-colors ${
          isLight
            ? 'bg-[#F0F2F7]/95'
            : 'bg-[#0A0D14]/95'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F0B429] border-2 border-black flex items-center justify-center font-black font-mono text-black text-lg shadow-[3px_3px_0px_#000000]">
              EA
            </div>
            <div>
              <div className="text-[11px] font-mono font-black tracking-[0.2em] text-[#F0B429] uppercase">
                OFFICIAL TRADER MANUAL
              </div>
              <div className={`text-sm font-black tracking-wide font-sans ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Tournament Floor Field Guide
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Section Indicator */}
            <span className="text-xs font-mono font-black tracking-wider text-black bg-[#F0B429] px-2.5 py-1 rounded border border-black shadow-[2px_2px_0px_#000000]">
              SECTION {index + 1} OF {total}
            </span>

            {/* Clear DISMISS button */}
            <button
              type="button"
              onClick={finish}
              data-tour-action="dismiss"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border-2 border-black text-xs font-mono font-black transition-all cursor-pointer bg-[#161B26] hover:bg-[#202736] text-white shadow-[3px_3px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px]"
            >
              <span>CLOSE MANUAL</span>
              <X className="w-3.5 h-3.5 text-[#F0B429]" />
            </button>
          </div>
        </header>

        {/* Center Main Stage: Full-Screen Takeover Two-Column Split (55% Left, 45% Right) */}
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 sm:px-12 py-8 sm:py-12 flex items-center">
          <div className="w-full grid lg:grid-cols-[55%_45%] gap-10 lg:gap-14 items-center">
            
            {/* Left Content Column (55% width) */}
            <div className="space-y-6 max-w-[720px]">
              
              {/* Bold Stage Indicator Pill */}
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border-2 border-black font-mono font-black text-xs tracking-wider shadow-[3px_3px_0px_#000000] ${
                isLight
                  ? 'bg-[#F0B429] text-black'
                  : 'bg-[#F0B429] text-black'
              }`}>
                <span className="w-2 h-2 rounded-full bg-black animate-ping" />
                <span>{step.badge}</span>
              </div>

              {/* High-Impact Main Heading */}
              <div className="space-y-3">
                <h1
                  className={`font-black tracking-tight leading-[1.05] uppercase font-sans ${
                    isLight ? 'text-slate-950' : 'text-white'
                  }`}
                  style={{ fontSize: 'clamp(32px, 3.8vw, 48px)' }}
                >
                  {step.title}
                </h1>
                <p className={`text-sm sm:text-base font-medium leading-relaxed font-sans ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  {step.subtitle}
                </p>
              </div>

              {/* Highlighted Dramatic CORE FLOOR RULE Box with Solid Neo-Brutalist Shadow */}
              <div
                className="p-4 sm:p-5 rounded-xl border-2 border-black shadow-[4px_4px_0px_#000000] transition-all bg-[#0F1420]"
                style={{
                  borderLeft: '5px solid #F0B429'
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-black bg-[#F0B429] px-2 py-0.5 rounded font-black">
                    FLOOR RULE
                  </span>
                </div>
                <p
                  className={`font-bold leading-snug ${
                    isLight ? 'text-slate-950' : 'text-white'
                  }`}
                  style={{ fontSize: '16px' }}
                >
                  {step.coreRule}
                </p>
              </div>

              {/* Tactile BATTLEGROUND TACTICS List */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#8B949E] block">
                  EXECUTION PLAYBOOK
                </span>
                <div className="space-y-2">
                  {step.tactics.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-xl border-2 border-black bg-[#101522] shadow-[3px_3px_0px_#000000] transition-all"
                    >
                      <span className="w-5 h-5 rounded bg-[#F0B429] text-black font-mono font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-black shadow-[1px_1px_0px_#000000]">
                        {i + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-medium leading-relaxed text-slate-200">
                        {t}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Veteran Trader Insight Box */}
              <div
                className="flex items-start gap-3.5 p-4 rounded-xl border-2 border-black bg-[#0C1E14] shadow-[4px_4px_0px_#000000] relative overflow-hidden"
                style={{
                  borderLeft: '5px solid #22C55E'
                }}
              >
                <Award className="w-5 h-5 text-[#22C55E] flex-shrink-0 mt-0.5" />
                <div className="relative z-10">
                  <strong className="block font-mono text-[11px] uppercase mb-1 tracking-wider text-[#22C55E] font-black">
                    PRO TRADER TIP:
                  </strong>
                  <span className="text-xs sm:text-sm leading-relaxed text-slate-200">
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
        <footer className={`sticky bottom-0 z-20 px-6 sm:px-12 py-4 border-t-2 border-black backdrop-blur-xl transition-colors ${
          isLight
            ? 'bg-[#F0F2F7]/95'
            : 'bg-[#0A0D14]/95'
        }`}>
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
            
            {/* Progress Dots with Smooth Transitions: Active amber 10px, Inactive grey 6px */}
            <div className="flex items-center gap-3">
              {STEPS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`rounded-full transition-all duration-300 cursor-pointer ${
                    i === index
                      ? 'w-3 h-3 bg-[#F0B429] border border-black shadow-[2px_2px_0px_#000000] scale-110'
                      : isLight
                        ? 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                        : 'w-2 h-2 bg-slate-700 hover:bg-slate-500'
                  }`}
                  title={s.title}
                />
              ))}
            </div>

            {/* Navigation Buttons: PREV & NEXT STAGE / ENTER THE ARENA */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={prev}
                disabled={index === 0}
                data-tour-action="prev"
                className="px-5 py-2.5 rounded-xl border-2 border-black font-mono text-xs font-black disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5 bg-[#161B26] hover:bg-[#202736] text-white shadow-[3px_3px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px]"
                style={{ height: '48px' }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">PREV</span>
              </button>

              <button
                type="button"
                onClick={isLast ? finish : next}
                data-tour-action="next"
                className={`px-7 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border-2 border-black shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] ${
                  isLast
                    ? 'bg-[#22C55E] hover:bg-[#16a34a] text-black animate-bounce'
                    : 'bg-[#F0B429] hover:bg-[#f5bc38] text-black'
                }`}
                style={{
                  height: '48px',
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
