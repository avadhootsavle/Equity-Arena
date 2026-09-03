import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Wallet, MousePointerClick, Target, LineChart, Newspaper, Trophy,
  ArrowRight, ArrowLeft, X, Check, AlertTriangle, Clock, Lightbulb,
  Zap, Flame, ShieldAlert, TrendingUp, TrendingDown, Crosshair,
  Volume2, Compass, Award, Sparkles, ChevronRight, Terminal, Search,
  Building, LayoutDashboard, Layers, BarChart2, ShieldCheck, CheckCircle2,
  DollarSign, Activity, ShoppingBag, Radio, RefreshCw, Coffee
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

/* ==================================================================
   Equity Arena — Official Trader Field Manual (Simple & Super Attractive)
   100% In-App Website Features Only:
   1. 3-Hour Tournament Schedule & 15-Minute Intermission Break
   2. 20 Listed Stocks (Stock list on left, clear description on right)
   3. Limit Orders: Limit Buy vs Limit Sell (Clear Visual Explanations)
   4. Breaking News Wire & Real-Time Sector Impact
   5. 5-Minute Auto-Liquidation & Final Winner Podium
   ================================================================== */

const ACCENT = "#F0B429";
const UP = "#10B981";
const DOWN = "#EF4444";

const STAGE_GLOWS = [
  "radial-gradient(ellipse 900px 700px at 0% 100%, rgba(240, 180, 41, 0.09) 0%, transparent 70%)",
  "radial-gradient(ellipse 900px 700px at 100% 0%, rgba(16, 185, 129, 0.09) 0%, transparent 70%)",
  "radial-gradient(ellipse 850px 650px at 50% 50%, rgba(59, 130, 246, 0.09) 0%, transparent 70%)",
  "radial-gradient(ellipse 900px 700px at 0% 0%, rgba(239, 68, 68, 0.09) 0%, transparent 70%)",
  "radial-gradient(ellipse 850px 650px at 50% 50%, rgba(240, 180, 41, 0.09) 0%, transparent 70%)",
];

/* 1. TOURNAMENT STRUCTURE & 15-MIN BREAK SIMULATOR */
function ScheduleInteractiveWidget({ isLight }) {
  return (
    <div
      className={`rounded-2xl border-2 transition-all p-5 sm:p-6 space-y-4 backdrop-blur-xl relative overflow-hidden ${
        isLight ? "bg-white border-black shadow-[4px_4px_0px_#000000]" : "bg-[#0F1420] border-black shadow-[4px_4px_0px_#000000]"
      }`}
      style={{ borderTop: "4px solid #F0B429" }}
    >
      <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-slate-200" : "border-white/10"}`}>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#F0B429]" />
          <span className={`font-mono text-xs font-black uppercase tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>
            3-Hour Tournament Timeline
          </span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 font-black">
          LIVE MATCH TIMER
        </span>
      </div>

      <div className="space-y-2.5 font-mono">
        <div className="p-3 rounded-xl border-2 border-black bg-emerald-500/10 flex items-center justify-between shadow-[2px_2px_0px_#000000]">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-emerald-500 text-black font-black text-xs flex items-center justify-center border border-black">
              01
            </span>
            <div>
              <span className="text-xs font-black text-emerald-400 block">Round 1: First Trading Session</span>
              <span className="text-[10px] text-slate-300">Live order fills, news spikes & portfolio building</span>
            </div>
          </div>
          <span className="text-xs font-black text-white">~80 MINS</span>
        </div>

        <div className="p-3 rounded-xl border-2 border-black bg-[#F0B429]/15 flex items-center justify-between shadow-[2px_2px_0px_#000000]">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#F0B429] text-black font-black text-xs flex items-center justify-center border border-black">
              <Coffee className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-black text-[#F0B429] block">15-Minute Intermission Break</span>
              <span className="text-[10px] text-slate-300">Trading paused, chimes sound, review strategy</span>
            </div>
          </div>
          <span className="text-xs font-black text-[#F0B429]">15 MINS</span>
        </div>

        <div className="p-3 rounded-xl border-2 border-black bg-rose-500/10 flex items-center justify-between shadow-[2px_2px_0px_#000000]">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-rose-500 text-white font-black text-xs flex items-center justify-center border border-black">
              02
            </span>
            <div>
              <span className="text-xs font-black text-rose-400 block">Round 2: The Final Showdown</span>
              <span className="text-[10px] text-slate-300">High-intensity catalysts + 5-min final lock</span>
            </div>
          </div>
          <span className="text-xs font-black text-white">~85 MINS</span>
        </div>
      </div>

      <div className="p-3 rounded-xl border-2 border-black bg-[#161D2B] flex items-center justify-between font-mono shadow-[2px_2px_0px_#000000]">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-[#F0B429]" />
          <span className="text-xs text-slate-300 font-bold">Starting Cash:</span>
        </div>
        <span className="text-sm font-black text-[#F0B429]">20,000 IC Liquid</span>
      </div>
    </div>
  );
}

/* 2. STOCKS DIRECTORY (LIST ON LEFT, DESCRIPTION ON RIGHT) */
function StockDirectoryWidget({ isLight }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("ALL");

  const ALL_STOCKS = [
    { code: "HDFB", name: "HDFB Bank", sector: "Banking", price: 1800.00, change: 3.4, desc: "Leading private bank for consumer banking, home loans, mortgages & credit facilities across India." },
    { code: "ICCO", name: "ICICO Bank", sector: "Banking", price: 1250.00, change: -1.8, desc: "Financial powerhouse known for corporate credit, retail accounts, loans & digital finance." },
    { code: "TCX", name: "TCX", sector: "IT", price: 4200.00, change: 2.6, desc: "Global IT consultancy leader delivering enterprise software, cloud infrastructure & tech solutions." },
    { code: "INFS", name: "Infisys", sector: "IT", price: 1600.00, change: -0.9, desc: "Premier digital tech giant specializing in business software, AI modernization & IT engineering." },
    { code: "HAAL", name: "HAAL", sector: "Defence & Aerospace", price: 5000.00, change: 6.2, desc: "State-backed aerospace defense manufacturer building fighter jets, helicopters & avionics." },
    { code: "BEEL", name: "BEEL", sector: "Defence & Aerospace", price: 420.00, change: 1.5, desc: "High-tech military electronics contractor producing tactical radars, sonar & defense gear." },
    { code: "SURY", name: "Suryan Pharma", sector: "Pharmaceuticals", price: 1900.00, change: -2.1, desc: "Major pharmaceutical giant developing specialty generic drugs, active ingredients & formulations." },
    { code: "CPLX", name: "Ciplex", sector: "Pharmaceuticals", price: 1500.00, change: 4.1, desc: "Global healthcare provider leading in respiratory medicines, antibiotics & lifesaving therapies." },
    { code: "AIRT", name: "Bharat Airtell", sector: "Telecommunications", price: 1850.00, change: 1.2, desc: "Leading telecom operator delivering national 5G mobile networks, broadband & digital enterprise." },
    { code: "IDEA", name: "Vodfone Idea", sector: "Telecommunications", price: 18.00, change: 8.5, desc: "Telecom service provider delivering cellular coverage and 4G data networks across India." },
    { code: "TATV", name: "Tatva Motors", sector: "Automobile", price: 950.00, change: 3.8, desc: "Automotive powerhouse producing passenger cars, commercial transport trucks & electric vehicles." },
    { code: "M&M", name: "M&M", sector: "Automobile", price: 3000.00, change: 4.5, desc: "India’s top utility vehicle and tractor company specializing in rugged SUVs, farm tractors & EVs." },
    { code: "RELI", name: "Reliants Industries", sector: "Energy (Oil & Gas)", price: 2900.00, change: -1.2, desc: "Mega-conglomerate dominating crude oil refining, petrochemicals, retail & energy infrastructure." },
    { code: "ONGC", name: "ONGCO", sector: "Energy (Oil & Gas)", price: 350.00, change: 0.8, desc: "India’s largest state oil exploration and offshore natural gas production company." },
    { code: "DLEF", name: "DLEF", sector: "Real Estate", price: 850.00, change: 2.1, desc: "Premier real estate builder constructing premium luxury townships, malls & corporate offices." },
    { code: "GODR", name: "Godrej Properties", sector: "Real Estate", price: 2700.00, change: -1.5, desc: "Top sustainable developer building modern eco-friendly residential housing & urban apartments." },
    { code: "SUZL", name: "Suzlan", sector: "Renewable Energy", price: 75.00, change: 5.8, desc: "Wind turbine manufacturing pioneer providing green renewable energy and clean power solutions." },
    { code: "IRED", name: "IREDAA", sector: "Renewable Energy", price: 95.00, change: 7.2, desc: "Non-banking financial agency financing national green energy, solar parks & hydro grid projects." },
    { code: "SAAL", name: "SAAIL", sector: "Metals & Mining", price: 98.00, change: -2.4, desc: "State-owned steelmaking titan supplying structural steel for railways, highways & infrastructure." },
    { code: "NMDC", name: "NMDCX", sector: "Metals & Mining", price: 90.00, change: 1.9, desc: "India’s largest iron ore miner supplying essential raw minerals to domestic industrial foundries." }
  ];

  const filtered = ALL_STOCKS.filter(s => {
    const matchesSector = sectorFilter === "ALL" || s.sector === sectorFilter;
    const matchesSearch = searchQuery.trim() === "" ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sector.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSector && matchesSearch;
  });

  const sectors = ["ALL", "Automobile", "Banking", "IT", "Defence & Aerospace", "Pharmaceuticals", "Telecommunications", "Renewable Energy", "Metals & Mining", "Real Estate", "Energy (Oil & Gas)"];

  return (
    <div
      className={`rounded-2xl border-2 transition-all p-4 sm:p-5 space-y-3.5 backdrop-blur-xl relative overflow-hidden ${
        isLight ? "bg-white border-black shadow-[4px_4px_0px_#000000]" : "bg-[#0F1420] border-black shadow-[4px_4px_0px_#000000]"
      }`}
      style={{ borderTop: "4px solid #F0B429" }}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-[#F0B429]" />
          <span className="font-mono text-xs font-black uppercase text-white tracking-wider">
            All 20 Listed Stocks & What They Do
          </span>
        </div>
        <div className="relative w-full sm:w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search stock..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-xs font-mono rounded-lg border border-white/15 bg-black/50 text-white focus:outline-none focus:border-[#F0B429]"
          />
        </div>
      </div>

      {/* Sector Quick Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px] font-mono">
        {sectors.map(sec => (
          <button
            key={sec}
            type="button"
            onClick={() => setSectorFilter(sec)}
            className={`px-2 py-0.5 rounded whitespace-nowrap transition-all cursor-pointer font-black border ${
              sectorFilter === sec
                ? "bg-[#F0B429] text-black border-black shadow-[2px_2px_0px_#000000]"
                : "bg-white/10 border-white/10 text-slate-300 hover:bg-white/20"
            }`}
          >
            {sec}
          </button>
        ))}
      </div>

      {/* Normal Full List Grid: 2 Columns of Clean Stock Cards with Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[460px] overflow-y-auto pr-1">
        {filtered.map(s => {
          const isUp = s.change >= 0;
          return (
            <div
              key={s.code}
              className="p-3 rounded-xl border-2 border-black bg-[#161D2B] space-y-1.5 shadow-[2px_2px_0px_#000000] flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-1.5 font-mono">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.2 rounded bg-[#F0B429] text-black font-black text-xs border border-black">
                      {s.code}
                    </span>
                    <span className="font-black text-xs text-white">
                      {s.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                    {s.sector}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-white block">{s.price.toFixed(2)} IC</span>
                  <span className={`text-[10px] font-black ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                    {isUp ? "▲ +" : "▼ -"}{Math.abs(s.change)}%
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-200 font-medium leading-relaxed bg-black/40 p-2 rounded border border-white/5">
                {s.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* 3. LIMIT BUY & LIMIT SELL ENGINE (CLEARLY EXPLAINED) */
function LimitOrdersExplainerWidget({ isLight }) {
  const [tab, setTab] = useState("BUY");

  return (
    <div
      className={`rounded-2xl border-2 transition-all p-5 sm:p-6 space-y-4 backdrop-blur-xl relative overflow-hidden ${
        isLight ? "bg-white border-black shadow-[4px_4px_0px_#000000]" : "bg-[#0F1420] border-black shadow-[4px_4px_0px_#000000]"
      }`}
      style={{ borderTop: "4px solid #F0B429" }}
    >
      <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-slate-200" : "border-white/10"}`}>
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-[#F0B429]" />
          <span className="font-mono text-xs font-black uppercase text-white">
            Limit Order Simulator (TATV Spot: 950 IC)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl border-2 border-black bg-black/50">
        <button
          type="button"
          onClick={() => setTab("BUY")}
          className={`py-2 rounded-lg font-mono text-xs font-black uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            tab === "BUY"
              ? "bg-emerald-500 text-black border-2 border-black shadow-[2px_2px_0px_#000000]"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>1. LIMIT BUY (DIP SNIPER)</span>
        </button>
        <button
          type="button"
          onClick={() => setTab("SELL")}
          className={`py-2 rounded-lg font-mono text-xs font-black uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            tab === "SELL"
              ? "bg-rose-500 text-white border-2 border-black shadow-[2px_2px_0px_#000000]"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>2. LIMIT SELL (PROFIT TARGET)</span>
        </button>
      </div>

      {tab === "BUY" ? (
        <div className="p-4 rounded-xl border-2 border-black bg-emerald-500/10 border-emerald-500/30 space-y-3 font-mono shadow-[2px_2px_0px_#000000]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-400 uppercase">How Limit Buy Works:</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-black">
              Target Price &lt; Spot Price
            </span>
          </div>
          <div className="p-3 rounded-lg bg-black/40 border border-white/10 space-y-1.5 text-xs text-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-[#F0B429] font-black">1.</span>
              <span>You set a strike price below market: <strong>850 IC</strong> (Spot is 950 IC).</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#F0B429] font-black">2.</span>
              <span>Your funds are safely held in <strong>Escrow</strong> (Locked Funds).</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#F0B429] font-black">3.</span>
              <span>When the price drops to 850 IC, the engine <strong>fills your buy automatically</strong>!</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border-2 border-black bg-rose-500/10 border-rose-500/30 space-y-3 font-mono shadow-[2px_2px_0px_#000000]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-rose-400 uppercase">How Limit Sell Works:</span>
            <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-black">
              Target Price &gt; Spot Price
            </span>
          </div>
          <div className="p-3 rounded-lg bg-black/40 border border-white/10 space-y-1.5 text-xs text-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-[#F0B429] font-black">1.</span>
              <span>You set a target sell price above market: <strong>1,100 IC</strong> (Spot is 950 IC).</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#F0B429] font-black">2.</span>
              <span>Your shares are reserved to sell automatically at the top.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#F0B429] font-black">3.</span>
              <span>When the stock rallies to 1,100 IC, it <strong>sells and books your profit to cash</strong>!</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* 4. BREAKING NEWS & SECTOR IMPACT WIDGET */
function NewsImpactWidget({ isLight }) {
  const [idx, setIdx] = useState(0);

  const newsItems = [
    {
      event: "Defence Ministry awards emergency fighter jet & missile contract to Indian contractors.",
      sector: "Defence & Aerospace",
      stocks: "HAAL, BEEL",
      direction: "UP ▲ (+25%)",
      color: UP,
      action: "BUY Defence stocks immediately upon hearing the chime!"
    },
    {
      event: "International crude oil prices spike to $120/barrel due to global pipeline shutdown.",
      sector: "Energy (Oil & Gas)",
      stocks: "Reliants, ONGCO",
      direction: "UP ▲ (+24%)",
      color: UP,
      action: "BUY Energy stocks to capture surging profit margins!"
    },
    {
      event: "Global semiconductor microchip shortages force auto assembly factories to halt.",
      sector: "Automobile",
      stocks: "Tatva Motors, M&M",
      direction: "DOWN ▼ (-18%)",
      color: DOWN,
      action: "SELL or avoid Auto stocks until production resumes!"
    }
  ];

  const item = newsItems[idx];

  return (
    <div
      className={`rounded-2xl border-2 transition-all p-5 sm:p-6 space-y-4 backdrop-blur-xl relative overflow-hidden ${
        isLight ? "bg-white border-black shadow-[4px_4px_0px_#000000]" : "bg-[#0F1420] border-black shadow-[4px_4px_0px_#000000]"
      }`}
      style={{ borderTop: "4px solid #F0B429" }}
    >
      <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-slate-200" : "border-white/10"}`}>
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-[#F0B429]" />
          <span className="font-mono text-xs font-black uppercase text-[#F0B429]">
            News Wire & Sector Impact
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIdx((idx + 1) % newsItems.length)}
          className="text-[10px] font-mono px-2.5 py-1 rounded border-2 border-black bg-[#F0B429] text-black font-black cursor-pointer shadow-[2px_2px_0px_#000000]"
        >
          Next Headline ↻
        </button>
      </div>

      <div className="p-4 rounded-xl border-2 border-black bg-[#161D2B] space-y-2.5 font-mono shadow-[2px_2px_0px_#000000]">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[#F0B429] font-black uppercase tracking-wider">● BREAKING WIRE FLASH</span>
          <span className="text-slate-400">Audio Chime Alerts All Traders</span>
        </div>

        <p className="text-sm font-black text-white leading-snug">
          "{item.event}"
        </p>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
          <div>
            <span className="text-slate-400 text-[10px] block">Target Sector:</span>
            <strong className="text-white">{item.sector}</strong>
          </div>
          <div className="text-right">
            <span className="text-slate-400 text-[10px] block">Stock Impact:</span>
            <span className="font-black text-xs" style={{ color: item.color }}>
              {item.direction}
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-black/50 border border-white/10 text-xs text-slate-200">
          <span className="text-[#F0B429] font-black">Winning Action: </span>
          <span>{item.action}</span>
        </div>
      </div>
    </div>
  );
}

/* 5. 5-MINUTE AUTO-LIQUIDATION & PODIUM */
function LiquidationPodiumWidget({ isLight }) {
  return (
    <div
      className={`rounded-2xl border-2 transition-all p-5 sm:p-6 space-y-4 backdrop-blur-xl relative overflow-hidden ${
        isLight ? "bg-white border-black shadow-[4px_4px_0px_#000000]" : "bg-[#0F1420] border-black shadow-[4px_4px_0px_#000000]"
      }`}
      style={{ borderTop: "4px solid #F0B429" }}
    >
      <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-slate-200" : "border-white/10"}`}>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span className="font-mono text-xs font-black uppercase text-rose-400">
            5-Min Auto-Liquidation & Winner Podium
          </span>
        </div>
        <span className="text-xs font-mono text-[#F0B429] font-black bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
          T-MINUS 5:00
        </span>
      </div>

      <div className="space-y-2.5 font-mono">
        <div className="p-3.5 rounded-xl bg-rose-500/10 border-2 border-black space-y-1 shadow-[2px_2px_0px_#000000]">
          <div className="flex items-center gap-1.5 text-rose-400 font-black text-xs uppercase">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>5-Minute Hard Freeze Rule</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-200">
            When 5 minutes remain on the clock, trading locks permanently. Every open share across all traders is automatically sold to cash at the current spot price.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl border-2 border-black bg-[#141A28] shadow-[2px_2px_0px_#000000]">
            <span className="block text-[10px] uppercase text-slate-400 font-bold">Leaderboard Ranking</span>
            <strong className="text-sm text-emerald-400 font-black block mt-0.5">100% Realized Cash</strong>
          </div>
          <div className="p-3 rounded-xl border-2 border-black bg-[#141A28] shadow-[2px_2px_0px_#000000]">
            <span className="block text-[10px] uppercase text-slate-400 font-bold">Unfilled Limits</span>
            <strong className="text-sm text-[#F0B429] font-black block mt-0.5">Auto-Refunded</strong>
          </div>
        </div>

        <div className="p-3 rounded-xl border-2 border-black bg-[#F0B429]/15 flex items-center justify-between shadow-[2px_2px_0px_#000000]">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#F0B429]" />
            <span className="text-xs text-white font-black">Top 3 Traders Win the Trophy!</span>
          </div>
          <span className="text-[10px] text-[#F0B429] font-black uppercase">Live Podium</span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   6 COMPLETE TOURNAMENT FIELD SECTIONS (PULLING 100% FROM WEBSITE ONLY)
   ========================================================================= */

const STEPS = [
  {
    id: "schedule",
    badge: "STAGE 01 // TOURNAMENT SCHEDULE",
    title: "3-Hour Game & 15-Min Break",
    subtitle: "The tournament runs for a total of 3 hours with a scheduled 15-minute intermission break to rest, review the leaderboard, and plan your strategy.",
    coreRule: "Every trader starts with 20,000 IC cash. Protect your capital and maximize returns.",
    tactics: [
      "The tournament is split into two halves with a 15-minute intermission in between.",
      "During the 15-minute break, market trading freezes and countdown audio plays.",
      "Check your live Net Worth and Leaderboard rank continuously in the header."
    ],
    proTip: "Keep cash reserves ready so you can buy rapid dips when the second half opens.",
    Visual: ScheduleInteractiveWidget
  },
  {
    id: "directory",
    badge: "STAGE 02 // 20 LISTED STOCKS",
    title: "Listed Stocks & Sector Directory",
    subtitle: "Browse the 20 Indian equities across 10 major industry sectors (Automobile, Banking, IT, Defence, Energy, etc.) with real-time quotes.",
    coreRule: "Click any stock on the left to read its company summary and spot price on the right.",
    tactics: [
      "Select a stock to instantly see what the company manufactures or delivers.",
      "Watch the percentage change (▲ Green for gains, ▼ Red for drops) on every 6-second tick.",
      "Use the search box to find specific tickers like M&M, HAAL, RELI, or TCX."
    ],
    proTip: "Knowing what sector each stock belongs to helps you trade breaking news instantly.",
    Visual: StockDirectoryWidget
  },
  {
    id: "limits",
    badge: "STAGE 03 // LIMIT BUY & SELL",
    title: "Mastering Limit Orders",
    subtitle: "Automate your trading so you don\'t have to stare at the screen. Set target buy or sell prices in advance.",
    coreRule: "Limit BUY triggers on dips below spot. Limit SELL triggers on rallies above spot.",
    tactics: [
      "Limit BUY: Set a strike price 5% to 15% below market to automatically catch sharp price drops.",
      "Limit SELL: Set a profit target above market to automatically lock in gains when the stock rallies.",
      "Committed purchase funds are held securely in escrow and refunded if cancelled."
    ],
    proTip: "Leave resting limit buy orders on strong stocks before stepping away or waiting for news.",
    Visual: LimitOrdersExplainerWidget
  },
  {
    id: "news",
    badge: "STAGE 04 // BREAKING NEWS WIRE",
    title: "Trade Breaking Newsflashes",
    subtitle: "Live analyst news bulletins pop up on your screen with an audio chime and immediately impact stock prices across sectors.",
    coreRule: "Breaking news directly drives stock prices up or down across related industry sectors.",
    tactics: [
      "When you hear the chime, read the news headline at the top of your screen immediately.",
      "Positive events (war orders, subsidies, contracts) cause stock prices to surge.",
      "Negative events (recession, tax hikes, chip shortages) cause stock prices to drop."
    ],
    proTip: "Act inside the first 10 seconds of a news drop before the rest of the room buys in.",
    Visual: NewsImpactWidget
  },
  {
    id: "endgame",
    badge: "STAGE 05 // AUTO-LIQUIDATION & PODIUM",
    title: "5-Minute Auto-Liquidation",
    subtitle: "When 5 minutes remain on the clock, all open positions automatically liquidate into cash for the final podium finish.",
    coreRule: "When 5 minutes remain, trading locks permanently and all shares convert to 100% cash.",
    tactics: [
      "Every share held by every trader is automatically sold at the current spot price.",
      "Unfilled limit orders are cancelled and all funds are refunded to your cash balance.",
      "The final podium winners and trophy rankings are decided 100% on realized cash."
    ],
    proTip: "Lock in your profits safely before the final 5-minute freeze takes over.",
    Visual: LiquidationPodiumWidget
  }
];

export function OnboardingTour({ isOpen, onClose }) {
  const [index, setIndex] = useState(0);
  const panelRef = useRef(null);
  const total = STEPS.length;
  const step = STEPS[index];
  const isLast = index === total - 1;

  const { theme } = useTheme();
  const isLight = theme === "light";

  const finish = useCallback(() => {
    try {
      localStorage.setItem("equity_arena_tour_completed", "true");
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
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, finish, next, prev]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
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
        isLight ? "bg-[#F0F2F7] text-slate-900" : "bg-[#07090E] text-white"
      }`}
    >
      {/* Dynamic Stage-Tuned Subtle Radial Glow Layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 transition-all duration-700 ease-out"
        style={{ background: currentGlow }}
      />

      <div className="relative z-10 min-h-screen flex flex-col justify-between">
        {/* Top Header Bar */}
        <header className={`sticky top-0 z-20 px-6 sm:px-12 py-3.5 border-b-2 border-black backdrop-blur-xl flex items-center justify-between transition-colors ${
          isLight ? "bg-[#F0F2F7]/95" : "bg-[#0A0D14]/95"
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F0B429] border-2 border-black flex items-center justify-center font-black font-mono text-black text-lg shadow-[3px_3px_0px_#000000]">
              EA
            </div>
            <div>
              <div className="text-[11px] font-mono font-black tracking-[0.2em] text-[#F0B429] uppercase">
                OFFICIAL TRADER MANUAL
              </div>
              <div className={`text-sm font-black tracking-wide font-sans ${isLight ? "text-slate-900" : "text-white"}`}>
                Tournament Field Guide & Website HUD
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Section Indicator */}
            <span className="text-xs font-mono font-black tracking-wider text-black bg-[#F0B429] px-2.5 py-1 rounded border-2 border-black shadow-[2px_2px_0px_#000000]">
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
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border-2 border-black font-mono font-black text-xs tracking-wider shadow-[3px_3px_0px_#000000] bg-[#F0B429] text-black">
                <span className="w-2 h-2 rounded-full bg-black animate-ping" />
                <span>{step.badge}</span>
              </div>

              {/* High-Impact Main Heading */}
              <div className="space-y-3">
                <h1
                  className={`font-black tracking-tight leading-[1.05] uppercase font-sans ${
                    isLight ? "text-slate-950" : "text-white"
                  }`}
                  style={{ fontSize: "clamp(32px, 3.8vw, 48px)" }}
                >
                  {step.title}
                </h1>
                <p className={`text-sm sm:text-base font-medium leading-relaxed font-sans ${
                  isLight ? "text-slate-700" : "text-slate-300"
                }`}>
                  {step.subtitle}
                </p>
              </div>

              {/* Highlighted Dramatic CORE FLOOR RULE Box with Solid Neo-Brutalist Shadow */}
              <div
                className="p-4 sm:p-5 rounded-xl border-2 border-black shadow-[4px_4px_0px_#000000] transition-all bg-[#0F1420]"
                style={{
                  borderLeft: "5px solid #F0B429"
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-black bg-[#F0B429] px-2 py-0.5 rounded font-black">
                    FLOOR RULE
                  </span>
                </div>
                <p
                  className={`font-bold leading-snug ${
                    isLight ? "text-slate-950" : "text-white"
                  }`}
                  style={{ fontSize: "16px" }}
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
                  borderLeft: "5px solid #22C55E"
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
          isLight ? "bg-[#F0F2F7]/95" : "bg-[#0A0D14]/95"
        }`}>
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
            
            {/* Progress Dots with Smooth Transitions */}
            <div className="flex items-center gap-3">
              {STEPS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`rounded-full transition-all duration-300 cursor-pointer ${
                    i === index
                      ? "w-3.5 h-3.5 bg-[#F0B429] border border-black shadow-[2px_2px_0px_#000000] scale-110"
                      : isLight
                        ? "w-2 h-2 bg-slate-300 hover:bg-slate-400"
                        : "w-2 h-2 bg-slate-700 hover:bg-slate-500"
                  }`}
                  title={s.title}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={prev}
                disabled={index === 0}
                data-tour-action="prev"
                className="px-5 py-2.5 rounded-xl border-2 border-black font-mono text-xs font-black disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5 bg-[#161B26] hover:bg-[#202736] text-white shadow-[3px_3px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px]"
                style={{ height: "48px" }}
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
                    ? "bg-[#22C55E] hover:bg-[#16a34a] text-black animate-bounce"
                    : "bg-[#F0B429] hover:bg-[#f5bc38] text-black"
                }`}
                style={{
                  height: "48px",
                  minWidth: isLast ? "190px" : "150px"
                }}
              >
                <span>{isLast ? "ENTER THE ARENA" : "NEXT STAGE"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </footer>

      </div>
    </div>
  );
}
