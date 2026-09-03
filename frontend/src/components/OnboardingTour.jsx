import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Wallet, MousePointerClick, Target, LineChart, Newspaper, Trophy,
  ArrowRight, ArrowLeft, X, Check, AlertTriangle, Clock, Lightbulb,
  Zap, Flame, ShieldAlert, TrendingUp, TrendingDown, Crosshair,
  Volume2, Compass, Award, Sparkles, ChevronRight, Terminal, Search,
  Building, LayoutDashboard, Layers, BarChart2, ShieldCheck, CheckCircle2,
  DollarSign, Activity, ShoppingBag, Radio, RefreshCw
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

/* ==================================================================
   Equity Arena — Redesigned Official Trader Field Manual
   100% In-App Features, Super Attractive Neo-Brutalist HUD,
   Dynamic Interactive Terminal Simulators, Real-Time Market Feed.
   ================================================================== */

const ACCENT = "#F0B429";
const UP = "#10B981";
const DOWN = "#EF4444";

/* ---------- Stage-Specific Glow Configurations ---------- */
const STAGE_GLOWS = [
  "radial-gradient(ellipse 900px 700px at 0% 100%, rgba(240, 180, 41, 0.08) 0%, transparent 70%)",
  "radial-gradient(ellipse 900px 700px at 100% 0%, rgba(16, 185, 129, 0.08) 0%, transparent 70%)",
  "radial-gradient(ellipse 850px 650px at 50% 50%, rgba(240, 180, 41, 0.08) 0%, transparent 70%)",
  "radial-gradient(ellipse 900px 700px at 100% 100%, rgba(59, 130, 246, 0.08) 0%, transparent 70%)",
  "radial-gradient(ellipse 900px 700px at 0% 0%, rgba(239, 68, 68, 0.08) 0%, transparent 70%)",
  "radial-gradient(ellipse 850px 650px at 50% 50%, rgba(240, 180, 41, 0.08) 0%, transparent 70%)",
];

/* =========================================================================
   INTERACTIVE TERMINAL WIDGETS (SIMULATING WEBSITE FEATURES EXACTLY)
   ========================================================================= */

/* 1. TOPBAR & WALLET SIMULATOR */
function WalletInteractiveWidget({ isLight }) {
  const [allocation, setAllocation] = useState(60);
  const total = 20000;
  const inStocks = Math.round((total * allocation) / 100);
  const inCash = total - inStocks;
  const mockGain = Math.round(inStocks * 0.22);
  const netWorth = total + mockGain;

  return (
    <div
      className={`rounded-2xl border-2 transition-all p-5 sm:p-6 space-y-4 backdrop-blur-xl relative overflow-hidden ${
        isLight
          ? "bg-white border-black shadow-[4px_4px_0px_#000000]"
          : "bg-[#0F1420] border-black shadow-[4px_4px_0px_#000000]"
      }`}
      style={{ borderTop: "4px solid #F0B429" }}
    >
      {/* Live Website TopBar Replica Header */}
      <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-slate-200" : "border-white/10"}`}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#F0B429] flex items-center justify-center font-mono font-black text-xs text-black border border-black">
            EA
          </div>
          <span className={`font-mono text-xs font-black uppercase tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>
            Website TopBar & Balance HUD
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-extrabold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            MARKET OPEN
          </span>
        </div>
      </div>

      {/* Website TopBar Wallet Component */}
      <div className="flex items-center justify-between p-3 rounded-xl border-2 border-black bg-[#161D2B] shadow-[2px_2px_0px_#000000]">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-[#F0B429]" />
          <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
            Available Cash:
          </span>
        </div>
        <span className="text-base font-mono font-black text-[#F0B429]">
          {inCash.toLocaleString()} <span className="text-xs">IC</span>
        </span>
      </div>

      {/* Allocation Slider */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-xs font-mono">
          <span className={isLight ? "text-slate-600 font-bold" : "text-slate-400 font-bold"}>
            Portfolio Deployment:
          </span>
          <span className="font-mono font-black text-[#F0B429]">{allocation}% Invested</span>
        </div>
        <input
          type="range"
          min="10"
          max="90"
          value={allocation}
          onChange={(e) => setAllocation(Number(e.target.value))}
          className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#F0B429]"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>10% Conservative</span>
          <span>90% Maximum Aggression</span>
        </div>
      </div>

      {/* Portfolio Value Summary Tile */}
      <div className="grid grid-cols-2 gap-2.5 pt-1 font-mono">
        <div className={`p-3 rounded-xl border-2 border-black ${isLight ? "bg-slate-50" : "bg-[#141A28]"}`}>
          <span className="text-[10px] uppercase text-slate-400 font-bold block">Invested Capital</span>
          <span className={`text-base font-black ${isLight ? "text-slate-900" : "text-white"}`}>
            {inStocks.toLocaleString()} IC
          </span>
          <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">+{mockGain.toLocaleString()} IC Gain</span>
        </div>
        <div className="p-3 rounded-xl border-2 border-black bg-emerald-500/10 border-emerald-500/30">
          <span className="text-[10px] uppercase text-emerald-400 font-bold block">Live Total Net Worth</span>
          <span className="text-base font-black text-emerald-400 block">
            {netWorth.toLocaleString()} IC
          </span>
          <span className="text-[10px] text-slate-300 font-bold block mt-0.5">Rank #1 Leaderboard</span>
        </div>
      </div>
    </div>
  );
}

/* 2. 20-STOCK LIVE MARKET DIRECTORY WIDGET */
function MarketInteractiveWidget({ isLight }) {
  const [activeStock, setActiveStock] = useState("M&M");
  const [sectorFilter, setSectorFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const ALL_STOCKS = [
    { code: "HDFB", name: "HDFB Bank", sector: "Banking", price: 1800.00, change: 3.4, vol: "1.4M", desc: "Leading private bank providing retail banking, loans, mortgages, and credit facilities across India." },
    { code: "ICCO", name: "ICICO Bank", sector: "Banking", price: 1250.00, change: -1.8, vol: "1.1M", desc: "Premier financial powerhouse known for digital consumer banking, corporate lending, and retail credit." },
    { code: "TCX", name: "TCX", sector: "IT", price: 4200.00, change: 2.6, vol: "890K", desc: "Global leader in IT services, cloud infrastructure migration, and enterprise software consultancy." },
    { code: "INFS", name: "Infisys", sector: "IT", price: 1600.00, change: -0.9, vol: "1.8M", desc: "Top Indian digital IT giant delivering enterprise technology, AI modernization, and cloud software solutions." },
    { code: "HAAL", name: "HAAL", sector: "Defence & Aerospace", price: 5000.00, change: 6.2, vol: "720K", desc: "Premier state-backed aerospace contractor manufacturing military fighter aircraft and defense helicopters." },
    { code: "BEEL", name: "BEEL", sector: "Defence & Aerospace", price: 420.00, change: 1.5, vol: "2.3M", desc: "High-tech defense electronics manufacturer producing tactical radar, sonar, and avionics systems." },
    { code: "SURY", name: "Suryan Pharma", sector: "Pharmaceuticals", price: 1900.00, change: -2.1, vol: "640K", desc: "Major pharmaceutical giant developing specialty generic formulations, therapies, and active drugs." },
    { code: "CPLX", name: "Ciplex", sector: "Pharmaceuticals", price: 1500.00, change: 4.1, vol: "910K", desc: "Global healthcare and pharmaceutical company specializing in respiratory medications and lifesaving treatments." },
    { code: "AIRT", name: "Bharat Airtell", sector: "Telecommunications", price: 1850.00, change: 1.2, vol: "1.5M", desc: "Leading telecom provider delivering high-speed 5G mobile networks, broadband, and enterprise connectivity." },
    { code: "TATV", name: "Tatva Motors", sector: "Automobile", price: 950.00, change: 3.8, vol: "3.1M", desc: "Leading automotive powerhouse manufacturing passenger cars, electric vehicles, and commercial heavy trucks." },
    { code: "M&M", name: "M&M", sector: "Automobile", price: 3000.00, change: 4.5, vol: "1.2M", desc: "India’s top utility vehicle and tractor manufacturer specializing in rugged SUVs, farm machinery, and EVs." },
    { code: "RELI", name: "Reliants Industries", sector: "Energy (Oil & Gas)", price: 2900.00, change: -1.2, vol: "2.0M", desc: "Mega-conglomerate dominating oil refining, petrochemicals, energy infrastructure, and retail." },
    { code: "ONGC", name: "ONGCO", sector: "Energy (Oil & Gas)", price: 350.00, change: 0.8, vol: "4.5M", desc: "India’s largest upstream crude oil and natural gas exploration and offshore production company." },
    { code: "DLEF", name: "DLEF", sector: "Real Estate", price: 850.00, change: 2.1, vol: "1.3M", desc: "Premier real estate builder developing luxury residential townships and prime commercial offices." },
    { code: "GODR", name: "Godrej Properties", sector: "Real Estate", price: 2700.00, change: -1.5, vol: "550K", desc: "Top-tier sustainable real estate developer creating modern premium housing and urban living projects." },
    { code: "IDEA", name: "Vodfone Idea", sector: "Telecommunications", price: 18.00, change: 8.5, vol: "12.4M", desc: "Turnaround telecom operator expanding high-frequency 4G/5G mobile subscriber coverage." },
    { code: "SUZL", name: "Suzlan", sector: "Renewable Energy", price: 75.00, change: 5.8, vol: "8.7M", desc: "Wind energy technology leader supplying commercial wind turbines and green renewable power solutions." },
    { code: "IRED", name: "IREDAA", sector: "Renewable Energy", price: 95.00, change: 7.2, vol: "6.2M", desc: "Non-banking financial agency financing national green energy, solar grids, and clean power initiatives." },
    { code: "SAAL", name: "SAAIL", sector: "Metals & Mining", price: 98.00, change: -2.4, vol: "5.1M", desc: "State-owned steelmaking giant supplying industrial steel for mega infrastructure, railways, and construction." },
    { code: "NMDC", name: "NMDCX", sector: "Metals & Mining", price: 90.00, change: 1.9, vol: "4.8M", desc: "India’s largest iron ore miner supplying essential raw mineral ores to domestic blast furnaces." }
  ];

  const filteredStocks = ALL_STOCKS.filter(s => {
    const matchesSector = sectorFilter === "ALL" || s.sector === sectorFilter;
    const matchesSearch = searchQuery.trim() === "" || 
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.sector.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSector && matchesSearch;
  });

  const sel = ALL_STOCKS.find(s => s.code === activeStock) || ALL_STOCKS[0];

  return (
    <div
      className={`rounded-2xl border-2 transition-all p-5 sm:p-6 space-y-3.5 backdrop-blur-xl relative overflow-hidden ${
        isLight
          ? "bg-white border-black shadow-[4px_4px_0px_#000000]"
          : "bg-[#0F1420] border-black shadow-[4px_4px_0px_#000000]"
      }`}
      style={{ borderTop: "4px solid #F0B429" }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-slate-300" : "border-white/15"}`}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#F0B429] flex items-center justify-center text-black font-black text-xs">
            <Building className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className={`font-mono text-xs font-black uppercase tracking-wider block ${isLight ? "text-slate-900" : "text-white"}`}>
              20 Listed Equities Directory
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 font-black">
          20 / 20 STOCKS ACTIVE
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search ticker, name, sector (e.g. M&M, HAAL, RELI)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-9 pr-3 py-1.5 text-xs font-mono rounded-lg border-2 transition-all focus:outline-none focus:border-[#F0B429] ${
            isLight
              ? "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500 font-bold"
              : "bg-black/50 border-white/15 text-white placeholder:text-slate-400 font-bold"
          }`}
        />
      </div>

      {/* Sector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px] font-mono">
        {["ALL", "Automobile", "Banking", "IT", "Defence & Aerospace", "Pharmaceuticals", "Telecommunications", "Renewable Energy", "Metals & Mining", "Real Estate", "Energy (Oil & Gas)"].map(sec => (
          <button
            key={sec}
            type="button"
            onClick={() => setSectorFilter(sec)}
            className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-all cursor-pointer font-black border ${
              sectorFilter === sec
                ? "bg-[#F0B429] text-black border-black shadow-[2px_2px_0px_#000000]"
                : isLight
                  ? "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                  : "bg-white/10 border-white/10 text-slate-300 hover:bg-white/20"
            }`}
          >
            {sec}
          </button>
        ))}
      </div>

      {/* Grid of Stock Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
        {filteredStocks.map(s => {
          const isUp = s.change >= 0;
          const isActive = s.code === activeStock;
          return (
            <button
              key={s.code}
              type="button"
              onClick={() => setActiveStock(s.code)}
              className={`p-2 rounded-lg text-left transition-all border-2 cursor-pointer ${
                isActive
                  ? "bg-[#F0B429]/20 border-[#F0B429] shadow-[0_0_10px_rgba(240,180,41,0.3)] ring-1 ring-[#F0B429]"
                  : isLight
                    ? "bg-slate-50 border-slate-300 hover:bg-white"
                    : "bg-[#141A28] border-white/10 hover:bg-[#1A2234]"
              }`}
            >
              <div className="font-mono font-black text-xs flex items-center justify-between">
                <span className={isActive ? "text-[#F0B429]" : isLight ? "text-slate-900" : "text-white"}>
                  {s.code}
                </span>
                <span className="text-[9px] font-mono text-slate-400 truncate max-w-[55px]">
                  {s.sector.split(" ")[0]}
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className={`text-[11px] font-mono font-black ${isLight ? "text-slate-900" : "text-slate-100"}`}>
                  {s.price.toFixed(2)}
                </span>
                <span className={`text-[9px] font-mono font-extrabold ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                  {isUp ? "▲" : "▼"}{Math.abs(s.change)}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Stock Company Profile Card */}
      <div className={`p-3.5 rounded-xl border-2 space-y-2 ${
        isLight ? "bg-amber-500/[0.08] border-black shadow-[2px_2px_0px_#000000]" : "bg-[#161D2B] border-black shadow-[2px_2px_0px_#000000]"
      }`}>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#F0B429] font-mono font-black text-sm px-1.5 py-0.2 rounded bg-black/50 border border-[#F0B429]/40">
                {sel.code}
              </span>
              <span className={`text-xs sm:text-sm font-black ${isLight ? "text-slate-900" : "text-white"}`}>
                {sel.name}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
              Sector: <strong className="text-[#F0B429]">{sel.sector}</strong>
            </span>
          </div>
          <div className="text-right font-mono">
            <span className={`text-sm font-black block ${isLight ? "text-slate-900" : "text-white"}`}>
              {sel.price.toFixed(2)} IC
            </span>
            <span className={`text-[10px] font-bold ${sel.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {sel.change >= 0 ? "▲ +" : "▼ -"}{Math.abs(sel.change)}% Spot
            </span>
          </div>
        </div>

        {/* 1-Line Description Callout */}
        <div className={`p-2.5 rounded-lg border leading-relaxed ${
          isLight ? "bg-white border-amber-500/40 text-slate-900" : "bg-[#0B0E14] border-amber-500/40 text-slate-100"
        }`}>
          <div className="flex items-start gap-2">
            <span className="text-[#F0B429] font-bold text-xs mt-0.5">▸</span>
            <p className="text-xs font-semibold leading-snug">
              {sel.desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 3. STOCK DETAIL MODAL & INSTANT TRADE TICKET */
function TradeInteractiveWidget({ isLight }) {
  const [qty, setQty] = useState(5);
  const [action, setAction] = useState("BUY");
  const price = 950.00; // Tatva Motors
  const cost = (qty * price).toFixed(2);

  return (
    <div
      className={`rounded-2xl border-2 transition-all p-5 sm:p-6 space-y-4 backdrop-blur-xl relative overflow-hidden ${
        isLight
          ? "bg-white border-black shadow-[4px_4px_0px_#000000]"
          : "bg-[#0F1420] border-black shadow-[4px_4px_0px_#000000]"
      }`}
      style={{ borderTop: "4px solid #F0B429" }}
    >
      <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-slate-200" : "border-white/10"}`}>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#F0B429]" />
          <span className={`font-mono text-xs font-black uppercase tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>
            Trade Ticket Terminal (TATV)
          </span>
        </div>
        <span className="font-mono text-[11px] text-emerald-400 font-bold">
          Zero Brokerage & Slippage
        </span>
      </div>

      {/* Buy / Sell Tab Switch */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl border-2 border-black bg-black/40">
        <button
          type="button"
          onClick={() => setAction("BUY")}
          className={`py-2 rounded-lg font-mono text-xs font-black uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            action === "BUY"
              ? "bg-emerald-500 text-black border-2 border-black shadow-[2px_2px_0px_#000000]"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span>●</span>
          <span>BUY (LONG)</span>
        </button>
        <button
          type="button"
          onClick={() => setAction("SELL")}
          className={`py-2 rounded-lg font-mono text-xs font-black uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            action === "SELL"
              ? "bg-rose-500 text-white border-2 border-black shadow-[2px_2px_0px_#000000]"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span>●</span>
          <span>SELL (LIQUIDATE)</span>
        </button>
      </div>

      {/* Quantity Stepper & Presets */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-slate-400 font-bold uppercase">Order Shares:</span>
          <div className="flex gap-1">
            {[1, 5, 10, 50].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setQty(preset)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                  qty === preset
                    ? "bg-[#F0B429] text-black border-black"
                    : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/15"
                }`}
              >
                +{preset}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="w-11 h-11 rounded-xl border-2 border-black bg-[#1A2234] hover:bg-[#253048] text-white font-mono text-xl font-bold flex items-center justify-center cursor-pointer active:scale-95 shadow-[2px_2px_0px_#000000]"
          >
            −
          </button>
          <div className="flex-1 h-11 rounded-xl border-2 border-black bg-black/60 flex items-center justify-center font-mono text-xl font-black text-[#F0B429] shadow-[2px_2px_0px_#000000]">
            {qty} Shares
          </div>
          <button
            type="button"
            onClick={() => setQty(qty + 1)}
            className="w-11 h-11 rounded-xl border-2 border-black bg-[#1A2234] hover:bg-[#253048] text-white font-mono text-xl font-bold flex items-center justify-center cursor-pointer active:scale-95 shadow-[2px_2px_0px_#000000]"
          >
            +
          </button>
        </div>
      </div>

      {/* Total & Instant Execution Button */}
      <div className="p-3 rounded-xl border-2 border-black bg-[#161D2B] flex items-center justify-between font-mono shadow-[2px_2px_0px_#000000]">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Est. Order Value</span>
          <span className="text-base font-black text-white">{cost} IC</span>
        </div>
        <div className="text-right text-[10px] text-slate-300">
          <span className="block text-emerald-400 font-bold">Execution: 0ms</span>
          <span className="block text-[#F0B429] font-bold">Fee: 0.00 IC</span>
        </div>
      </div>
    </div>
  );
}

/* 4. LIMIT ORDERS ENGINE */
function LimitInteractiveWidget({ isLight }) {
  const [target, setTarget] = useState(850.00);
  const livePrice = 950.00; // TATV spot price
  const isBuyDiscount = target < livePrice;

  return (
    <div
      className={`rounded-2xl border-2 transition-all p-5 sm:p-6 space-y-4 backdrop-blur-xl relative overflow-hidden ${
        isLight
          ? "bg-white border-black shadow-[4px_4px_0px_#000000]"
          : "bg-[#0F1420] border-black shadow-[4px_4px_0px_#000000]"
      }`}
      style={{ borderTop: "4px solid #F0B429" }}
    >
      <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-slate-200" : "border-white/10"}`}>
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-[#F0B429]" />
          <span className={`font-mono text-xs font-black uppercase tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>
            Limit Order Engine (TATV)
          </span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 font-black">
          AUTOMATION ACTIVE
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-baseline font-mono">
          <span className="text-xs text-slate-400 font-bold">Target Strike Price:</span>
          <span className="text-xl font-black text-[#F0B429]">{target.toFixed(2)} IC</span>
        </div>
        <input
          type="range"
          min="700"
          max="1150"
          step="10"
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
          className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#F0B429]"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>Dip Bid (700 IC)</span>
          <span className="font-bold text-white">Current Spot: {livePrice.toFixed(2)} IC</span>
          <span>Spike Sell (1150 IC)</span>
        </div>
      </div>

      <div className={`p-3.5 rounded-xl border-2 border-black transition-all ${
        isBuyDiscount
          ? "bg-emerald-500/10 border-emerald-500/40"
          : "bg-amber-500/10 border-amber-500/40"
      }`}>
        <div className="flex items-start gap-2.5">
          <Target className="w-5 h-5 text-[#F0B429] flex-shrink-0 mt-0.5" />
          <div className="text-xs font-mono space-y-1">
            <span className={`font-bold block ${isLight ? "text-slate-900" : "text-white"}`}>
              {isBuyDiscount ? "Resting Limit Buy in Escrow" : "Resting Limit Sell Target"}
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {isBuyDiscount
                ? `Funds safely reserved in escrow. If spot drops ${((1 - target / livePrice) * 100).toFixed(1)}% to ${target.toFixed(2)} IC, your order automatically fills.`
                : "Target is above spot. Order triggers automatically when market rallies."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 5. NEWS TAB & TOAST WIRE SIMULATOR */
function NewsInteractiveWidget({ isLight }) {
  const [headlineIdx, setHeadlineIdx] = useState(0);

  const headlines = [
    {
      source: "REUTERS BREAKING WIRE",
      headline: "Border tensions escalate; government orders urgent emergency military fighter jet and missile radar production.",
      target: "Defence & Aerospace (HAAL, BEEL)",
      impact: "MASSIVE BULLISH (+25%)",
      color: UP,
      drift: "+20% to +30%"
    },
    {
      source: "BLOOMBERG FLASH",
      headline: "War in Middle East and Russia shuts down major global pipelines; international crude oil price spikes above $120/barrel.",
      target: "Energy (Reliants, ONGCO)",
      impact: "STRONG RALLY (+24%)",
      color: UP,
      drift: "+18% to +25%"
    },
    {
      source: "ECONOMIC TIMES ALERTS",
      headline: "Diwali festive holiday season sees record-breaking demand; millions of Indians rush to buy new cars and SUVs.",
      target: "Automobile (Tatva Motors, M&M)",
      impact: "BULLISH SURGE (+22%)",
      color: UP,
      drift: "+15% to +25%"
    },
    {
      source: "CNBC-TV18 DISPATCH",
      headline: "Government announces ₹50,000 Crore mega subsidy package for green solar parks and giant wind turbine projects.",
      target: "Renewable Energy (Suzlan, IREDAA)",
      impact: "SECTOR RALLY (+26%)",
      color: UP,
      drift: "+20% to +35%"
    }
  ];

  const curr = headlines[headlineIdx];

  return (
    <div
      className={`rounded-2xl border-2 transition-all p-5 sm:p-6 space-y-4 backdrop-blur-xl relative overflow-hidden ${
        isLight
          ? "bg-white border-black shadow-[4px_4px_0px_#000000]"
          : "bg-[#0F1420] border-black shadow-[4px_4px_0px_#000000]"
      }`}
      style={{ borderTop: "4px solid #F0B429" }}
    >
      <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-slate-200" : "border-white/10"}`}>
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-[#F0B429]" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#F0B429]">
            Breaking News Toast Wire
          </span>
        </div>
        <button
          type="button"
          onClick={() => setHeadlineIdx((headlineIdx + 1) % headlines.length)}
          className="text-[10px] font-mono px-2 py-0.5 rounded border border-black bg-[#F0B429] text-black font-black cursor-pointer shadow-[2px_2px_0px_#000000]"
        >
          Next Alert ↻
        </button>
      </div>

      <div className="p-4 rounded-xl border-2 border-black bg-[#161D2B] space-y-2.5 shadow-[2px_2px_0px_#000000]">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-[#F0B429] font-black uppercase tracking-wider">
            ● {curr.source}
          </span>
          <span className="text-slate-400">AUDIO CHIME TRIGGERED</span>
        </div>

        <p className={`text-sm font-black leading-snug ${isLight ? "text-slate-900" : "text-white"}`}>
          "{curr.headline}"
        </p>

        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300">Sector: <strong className="text-white">{curr.target}</strong></span>
          <span className="font-black px-2 py-0.5 rounded text-[10px]" style={{ color: curr.color, backgroundColor: `${curr.color}25` }}>
            {curr.impact}
          </span>
        </div>
      </div>

      <p className="text-[11px] font-mono text-center text-slate-400 font-bold">
        News broadcasts trigger live sector drift across the entire exchange.
      </p>
    </div>
  );
}

/* 6. GAME TIMER & AUTO-LIQUIDATION */
function EndgameInteractiveWidget({ isLight }) {
  return (
    <div
      className={`rounded-2xl border-2 transition-all p-5 sm:p-6 space-y-4 backdrop-blur-xl relative overflow-hidden ${
        isLight
          ? "bg-white border-black shadow-[4px_4px_0px_#000000]"
          : "bg-[#0F1420] border-black shadow-[4px_4px_0px_#000000]"
      }`}
      style={{ borderTop: "4px solid #F0B429" }}
    >
      <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-slate-200" : "border-white/10"}`}>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span className="font-mono text-xs font-black uppercase tracking-wider text-rose-400">
            Game Timer & Auto-Liquidation
          </span>
        </div>
        <span className="text-xs font-mono text-[#F0B429] font-black bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
          T-MINUS 5:00
        </span>
      </div>

      <div className="space-y-2.5">
        <div className="p-3.5 rounded-xl bg-rose-500/10 border-2 border-black space-y-1 shadow-[2px_2px_0px_#000000]">
          <div className="flex items-center gap-1.5 text-rose-400 font-mono font-black text-xs uppercase">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>The 5-Minute Hard Freeze</span>
          </div>
          <p className="text-xs leading-relaxed font-mono text-slate-200">
            When 5 minutes remain on the master game clock, order placement locks permanently. Every open share is automatically liquidated to cash at live spot price.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-3 rounded-xl border-2 border-black bg-[#141A28] shadow-[2px_2px_0px_#000000]">
            <span className="block text-[10px] uppercase text-slate-400 font-bold">Podium Ranking Basis</span>
            <strong className="text-sm text-white font-black block mt-0.5">100% Cash Balance</strong>
          </div>
          <div className="p-3 rounded-xl border-2 border-black bg-[#141A28] shadow-[2px_2px_0px_#000000]">
            <span className="block text-[10px] uppercase text-slate-400 font-bold">Open Limit Orders</span>
            <strong className="text-sm text-[#F0B429] font-black block mt-0.5">Refunded to Cash</strong>
          </div>
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
    id: "mindset",
    badge: "SECTION 01 // CAPITAL & WALLET",
    title: "Your 20,000 IC Bankroll",
    subtitle: "Every trader starts with 20,000 IC liquid capital. Your live Net Worth and Leaderboard rank update automatically on every 6-second market tick.",
    coreRule: "Net Worth = Liquid Cash Balance + Live Market Value of Open Stock Holdings.",
    tactics: [
      "Keep dry powder cash ready: maintaining liquid reserves allows you to pounce on sudden market pullbacks.",
      "Check your TopBar HUD: your available balance and reserved order funds are tracked live in the header.",
      "Watch your live rank: the leaderboard calculates positions dynamically as prices move."
    ],
    proTip: "Concentrate your capital in 2 to 3 high-conviction trades rather than spreading thin across random stocks.",
    Visual: WalletInteractiveWidget
  },
  {
    id: "radar",
    badge: "SECTION 02 // MARKET DIRECTORY",
    title: "20 Listed Equities Directory",
    subtitle: "Explore 20 Indian equities across 10 major industry sectors (Automobile, Banking, IT, Defence, Energy, etc.) with real-time quotes.",
    coreRule: "Green cards indicate upward price momentum. Red indicates selling pressure.",
    tactics: [
      "Use the instant Sector Filter pills at the top of the Market tab to focus on specific industries.",
      "Inspect the live sparkline trends on each Floor Card to evaluate recent price action before buying.",
      "Click any stock card to expand its full high-resolution Candlestick Chart and Order Ticket."
    ],
    proTip: "Never chase a stock at the very peak of a spike. Wait for temporary consolidation or place a Limit Order below spot.",
    Visual: MarketInteractiveWidget
  },
  {
    id: "execution",
    badge: "SECTION 03 // TRADE EXECUTION",
    title: "Instant One-Click Fills",
    subtitle: "Trade instantly with zero commission fees, zero broker delays, and zero price slippage directly from the Stock Detail Modal.",
    coreRule: "Market orders fill at the live spot price the exact millisecond you click Buy or Sell.",
    tactics: [
      "Use quick share presets (+1, +5, +10, +50) or the stepper buttons to rapidly size your trade orders.",
      "Buying draws immediately from your available wallet; selling books realized profits straight to your cash.",
      "Track your holdings, average purchase price, and unrealized P&L in the \"My Stocks\" portfolio tab."
    ],
    proTip: "Scale into positions in smaller batches during peak volatility to achieve a balanced average entry price.",
    Visual: TradeInteractiveWidget
  },
  {
    id: "sniping",
    badge: "SECTION 04 // LIMIT ORDERS",
    title: "Automate Entries with Limits",
    subtitle: "Set automated target buy or sell prices so the exchange matching engine catches market dips and rallies for you automatically.",
    coreRule: "Limit BUY triggers when price drops to target. Limit SELL triggers when price rises to target.",
    tactics: [
      "Place Limit Buy bids 5% to 15% below spot to automatically buy during sudden market dips.",
      "Committed purchase funds are held securely in escrow so your account can never be overdrawn.",
      "Review, edit, or cancel active pending orders anytime in the \"Limit Orders\" dashboard tab with 1 click."
    ],
    proTip: "Set resting limit buy orders on fundamentally strong stocks before scanning breaking news wires.",
    Visual: LimitInteractiveWidget
  },
  {
    id: "intel",
    badge: "SECTION 05 // BREAKING NEWS",
    title: "Trade Breaking Newsflashes",
    subtitle: "Real-time analyst newsflashes broadcast directly to your terminal, driving macro market shifts across affected sectors.",
    coreRule: "Breaking news bulletins broadcast simultaneously to all terminals with an audible chime.",
    tactics: [
      "When the notification chime sounds, immediately read the headline banner at the top of your screen.",
      "Identify the affected industry sector and execute before the rest of the market reacts.",
      "Visit the \"News\" tab on your sidebar anytime to review the historical transcript of all session bulletins."
    ],
    proTip: "Act swiftly inside the first 10 seconds of a news drop before market prices fully adjust.",
    Visual: NewsInteractiveWidget
  },
  {
    id: "endgame",
    badge: "SECTION 06 // THE CLOSING BELL",
    title: "The 5-Minute Endgame Protocol",
    subtitle: "Keep an eye on the master tournament clock in the header. Master the countdown rules to secure your podium finish.",
    coreRule: "When 5 minutes remain on the clock, trading freezes and auto-liquidation executes.",
    tactics: [
      "All open stock holdings are automatically liquidated to cash at current market spot prices.",
      "All pending limit orders are auto-cancelled and escrowed funds are fully refunded to cash.",
      "The final tournament podium and leaderboard rankings are decided 100% on realized cash net worth."
    ],
    proTip: "Avoid entering new high-risk trades in the final seconds. Lock in your profits calmly before the 5-minute freeze.",
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
