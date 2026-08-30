import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Wallet, MousePointerClick, Target, LineChart, Newspaper, Trophy,
  ArrowRight, ArrowLeft, X, Check, AlertTriangle, Clock, Lightbulb
} from 'lucide-react';

/* ==================================================================
   Equity Arena — Trader's Manual

   Every number and rule stated here is taken from the live game:
   20,000 IC start, 15 listed stocks, limit-fill comparisons, the
   5-minute auto-liquidation sweep and the 5M/15M/30M/1H timeframes.
   If game rules change, this copy must change with them.

   Visual language: frosted glass over a saturated mesh. Glass only
   reads as glass when something colourful sits behind it, so the mesh
   below is deliberately vivid; panels stay at low white opacity and
   all body copy stays near-white to hold contrast over it.
   ================================================================== */

const ACCENT = '#F0B429';
const UP = '#4ADE80';
const DOWN = '#F87171';

/* Shared glass recipe: blur + low-opacity white + a hairline top light. */
const GLASS =
  'bg-white/[0.055] backdrop-blur-2xl border border-white/[0.12] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.7)]';
const GLASS_SOFT = 'bg-white/[0.035] backdrop-blur-xl border border-white/[0.09]';

const FOCUS =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F0B429] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080A10]';

/* ---------- building blocks for the step visuals ---------- */

function GlassPane({ label, children }) {
  return (
    <div className={`rounded-3xl overflow-hidden ${GLASS}`}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.09]">
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="w-3 h-3 rounded-full bg-[#F87171]/60" />
          <span className="w-3 h-3 rounded-full bg-[#F0B429]/60" />
          <span className="w-3 h-3 rounded-full bg-[#4ADE80]/60" />
        </div>
        <span className="text-[12px] font-mono uppercase tracking-[0.18em] text-slate-300">
          {label}
        </span>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function StockRow({ code, name, price, change, sector }) {
  const up = change >= 0;
  return (
    <div className={`rounded-2xl px-4 py-3.5 ${GLASS_SOFT}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="w-11 h-11 rounded-xl flex items-center justify-center text-[13px] font-mono font-extrabold border flex-shrink-0"
            style={{
              color: up ? UP : DOWN,
              borderColor: up ? `${UP}55` : `${DOWN}55`,
              backgroundColor: up ? `${UP}1A` : `${DOWN}1A`
            }}
          >
            {code.slice(0, 2)}
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-semibold text-white truncate">{name}</span>
            <span className="block text-[12px] font-mono text-slate-400">{code} · {sector}</span>
          </span>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[18px] font-mono font-bold text-white">
            {price}<span className="text-[12px] text-slate-400 ml-1">IC</span>
          </div>
          <div className="text-[13px] font-mono font-bold" style={{ color: up ? UP : DOWN }}>
            {up ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
}

/** Label/value line used across the visuals. */
function Line({ k, v, color, top }) {
  return (
    <div className={`flex justify-between items-baseline ${top ? 'border-t border-white/[0.1] pt-3' : ''}`}>
      <span className="text-[14px] text-slate-400">{k}</span>
      <span className="text-[15px] font-mono font-bold" style={{ color: color || '#FFFFFF' }}>{v}</span>
    </div>
  );
}

/* ---------- per-step visuals ---------- */

function WalletMock() {
  return (
    <GlassPane label="Your standing">
      <div className={`rounded-2xl p-5 ${GLASS_SOFT}`}>
        <span className="block text-[12px] font-mono uppercase tracking-[0.18em] text-slate-400">
          Starting balance
        </span>
        <span className="block mt-1.5 text-[34px] font-mono font-bold leading-none" style={{ color: ACCENT }}>
          20,000.00 <span className="text-[18px]">IC</span>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className={`rounded-2xl p-4 ${GLASS_SOFT}`}>
          <span className="block text-[12px] font-mono uppercase tracking-wider text-slate-400">Cash left</span>
          <span className="block mt-1.5 text-[19px] font-mono font-bold text-white">14,320.55</span>
        </div>
        <div className={`rounded-2xl p-4 ${GLASS_SOFT}`}>
          <span className="block text-[12px] font-mono uppercase tracking-wider text-slate-400">In stocks</span>
          <span className="block mt-1.5 text-[19px] font-mono font-bold text-white">6,812.40</span>
        </div>
      </div>
      <div className={`rounded-2xl px-4 py-3.5 text-center text-[14px] font-mono text-slate-300 ${GLASS_SOFT}`}>
        Net worth <span className="text-white font-bold">21,132.95 IC</span>
        <span className="ml-2 font-bold" style={{ color: UP }}>+5.66%</span>
      </div>
    </GlassPane>
  );
}

function MarketMock() {
  return (
    <GlassPane label="Trading floor">
      <StockRow code="ANAG" name="Annapurna Agro" price="46.12" change={4.31} sector="Agriculture" />
      <StockRow code="RTB" name="Rashtriya Trust Bank" price="2,584.90" change={-2.14} sector="Banking" />
      <div className="flex items-center justify-between px-1 text-[13px] font-mono text-slate-400">
        <span>HIGH <span style={{ color: UP }} className="font-bold">48.90</span></span>
        <span>LOW <span style={{ color: DOWN }} className="font-bold">41.05</span></span>
        <span className="text-slate-500">15-min window</span>
      </div>
    </GlassPane>
  );
}

function TradeMock() {
  return (
    <GlassPane label="Quick trade">
      <StockRow code="GSL" name="Ganga Shipping Lines" price="91.40" change={2.12} sector="Shipping" />
      <div className="flex items-center gap-2.5">
        <span className="w-10 h-11 rounded-xl border border-white/[0.14] flex items-center justify-center text-slate-300 text-[18px] font-mono">−</span>
        <span className="w-14 h-11 rounded-xl border border-white/[0.14] bg-white/[0.06] flex items-center justify-center text-white text-[17px] font-mono font-bold">3</span>
        <span className="w-10 h-11 rounded-xl border border-white/[0.14] flex items-center justify-center text-slate-300 text-[18px] font-mono">+</span>
        <span className="flex-1 h-11 rounded-xl bg-[#16A34A] flex items-center justify-center text-white text-[13px] font-mono font-extrabold tracking-wider">BUY</span>
        <span className="flex-1 h-11 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-slate-500 text-[13px] font-mono font-extrabold tracking-wider">SELL</span>
      </div>
      <p className="text-[15px] font-mono text-slate-300 text-center">
        You&rsquo;ll spend <span className="text-white font-bold">274.20 IC</span>
      </p>
    </GlassPane>
  );
}

function LimitMock() {
  return (
    <GlassPane label="Limit order">
      <div className={`rounded-2xl p-5 space-y-3 ${GLASS_SOFT}`}>
        <Line k="Stock" v="SANP" />
        <Line k="Side" v="BUY" color={UP} />
        <Line k="Quantity" v="10" />
        <Line k="Target price" v="320.00 IC" color={ACCENT} top />
      </div>
      <div
        className="rounded-2xl border px-4 py-3.5 text-[14px] leading-relaxed text-slate-200"
        style={{ borderColor: `${ACCENT}3D`, background: `${ACCENT}14` }}
      >
        Fills the moment SANP trades at <span className="text-white font-bold">320.00 IC or below</span>.
        Until then <span className="text-white font-bold">3,200 IC</span> stays reserved.
      </div>
    </GlassPane>
  );
}

function ChartMock() {
  const pts = '0,52 22,44 44,50 66,30 88,36 110,22 132,28 154,12 176,18 198,6';
  return (
    <GlassPane label="Price chart">
      <div className="flex items-center gap-2">
        {['5M', '15M', '30M', '1H'].map((t) => (
          <span
            key={t}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-mono font-bold ${
              t === '15M' ? 'text-slate-950' : 'text-slate-300 border border-white/[0.12]'
            }`}
            style={t === '15M' ? { background: ACCENT } : undefined}
          >
            {t}
          </span>
        ))}
      </div>
      <div className={`rounded-2xl p-4 ${GLASS_SOFT}`}>
        <svg viewBox="0 0 198 60" className="w-full h-[96px]" role="img" aria-label="Example price line trending upward">
          <defs>
            <linearGradient id="eaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={UP} stopOpacity="0.35" />
              <stop offset="100%" stopColor={UP} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`${pts} 198,60 0,60`} fill="url(#eaFill)" />
          <polyline points={pts} fill="none" stroke={UP} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </div>
      <div className="flex items-center justify-between text-[13px] font-mono text-slate-400">
        <span>OPEN <span className="text-white font-bold">88.10</span></span>
        <span>HIGH <span style={{ color: UP }} className="font-bold">96.40</span></span>
        <span>LOW <span style={{ color: DOWN }} className="font-bold">84.22</span></span>
      </div>
    </GlassPane>
  );
}

function NewsMock() {
  return (
    <GlassPane label="Breaking news">
      <div
        className="rounded-2xl border-2 p-5 bg-white/[0.05] backdrop-blur-xl"
        style={{ borderColor: `${ACCENT}5C` }}
      >
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.1]">
          <Newspaper className="w-5 h-5" style={{ color: ACCENT }} aria-hidden="true" />
          <span className="text-[13px] font-black uppercase tracking-[0.14em]" style={{ color: ACCENT }}>
            Breaking News
          </span>
        </div>
        <p className="pt-3.5 text-[17px] font-semibold text-white leading-snug">
          New tariffs of 15% announced on imported semiconductor components overnight.
        </p>
      </div>
      <p className="text-[14px] font-mono text-slate-400 text-center">
        Read it, decide, act — prices move within seconds.
      </p>
    </GlassPane>
  );
}

function PortfolioMock() {
  return (
    <GlassPane label="My stocks">
      <div className={`rounded-2xl p-5 space-y-3 ${GLASS_SOFT}`}>
        <Line k="Shares held" v="14" />
        <Line k="Avg buy price" v="486.52 IC" />
        <Line k="Price now" v="497.63 IC" />
        <Line k="Profit / loss" v="+155.58 IC" color={UP} top />
      </div>
      <div className={`rounded-2xl px-4 py-3.5 text-[14px] font-mono text-slate-300 text-center ${GLASS_SOFT}`}>
        Net worth = <span className="text-white font-bold">Cash left</span> + <span className="text-white font-bold">Money in stocks</span>
      </div>
    </GlassPane>
  );
}

/**
 * A real screenshot of the running terminal, captured from the live app
 * (frontend/public/guide/*.png). Preferred over any drawn mock-up — if a
 * screenshot exists for a step, it is used instead of the diagram.
 */
function Shot({ src, alt, label }) {
  return (
    <figure className={`rounded-3xl overflow-hidden ${GLASS}`}>
      <figcaption className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.09]">
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="w-3 h-3 rounded-full bg-[#F87171]/60" />
          <span className="w-3 h-3 rounded-full bg-[#F0B429]/60" />
          <span className="w-3 h-3 rounded-full bg-[#4ADE80]/60" />
        </div>
        <span className="text-[13px] font-mono uppercase tracking-[0.18em] text-slate-300">
          {label}
        </span>
      </figcaption>
      <img src={src} alt={alt} loading="lazy" className="block w-full h-auto" />
    </figure>
  );
}

/* ---------- the manual itself ---------- */

const STEPS = [
  {
    id: 'goal',
    Icon: Wallet,
    kicker: 'The objective',
    title: 'Grow 20,000 IC',
    lede: 'Every trader starts with exactly 20,000 IC and the same 15 listed companies. Whoever grows that pile the most before the closing bell wins.',
    points: [
      'Your net worth is Cash left + Money in stocks — holding is not the same as winning.',
      'Fifteen stocks span the board, from Annapurna Agro near 42 IC to Suvarna Gold Mining near 3,500 IC.',
      'The session clock runs down in the header. When it hits zero, the market closes.'
    ],
    callout: {
      kind: 'formula',
      title: 'How you are scored',
      body: 'Net worth = Cash left + (shares held × current price). Profit is measured against your 20,000 IC starting balance.'
    },
    tip: 'Cash sitting idle earns nothing, but neither does a stock you bought too high. Both halves count.',
    Visual: WalletMock
  },
  {
    id: 'market',
    Icon: LineChart,
    kicker: 'The market',
    title: 'Read the board',
    lede: 'The trading floor lists every stock as a live card. Prices tick continuously — roughly every six seconds — so the board is never still.',
    points: [
      'The large number is the live price; the coloured pill is its move against the opening price.',
      'The sparkline traces the last 15 minutes, with HIGH and LOW beneath it.',
      'Green means the price is above its open, red means below. It says nothing about what comes next.'
    ],
    callout: {
      kind: 'warn',
      title: 'A rising price is not a buy signal',
      body: 'Colour tells you where a stock has been, never where it is going. Read the news and the chart before committing.'
    },
    tip: 'Click any card to open its full chart and trade ticket.',
    shot: { src: '/guide/chart.png', label: 'Live terminal', alt: 'A real stock in the Equity Arena terminal showing its live price, percent change and price chart' },
    Visual: MarketMock
  },
  {
    id: 'trade',
    Icon: MousePointerClick,
    kicker: 'Trading',
    title: 'Buy and sell instantly',
    lede: 'Set a quantity with the − / + stepper, then hit Quick Buy or Quick Sell. The order fills immediately at the live price — no confirmation screen.',
    points: [
      'Quick Buy spends cash now; Quick Sell returns cash now. Both settle instantly.',
      'Quick Sell is greyed out unless you actually hold that many shares.',
      'The line under the buttons shows exactly what you will spend or receive before you commit.'
    ],
    callout: {
      kind: 'formula',
      title: 'What a trade costs',
      body: 'Total = quantity × live price. There is no brokerage or fee — the price you see is the price you pay.'
    },
    tip: 'Prices move while you decide. The fill uses the price at the moment the server accepts your order, not the one you clicked.',
    shot: { src: '/guide/stock-card.png', label: 'Live terminal', alt: 'The real trade controls: quantity stepper, Quick Buy, Quick Sell and Normal Trade' },
    Visual: TradeMock
  },
  {
    id: 'limit',
    Icon: Target,
    kicker: 'Automation',
    title: 'Let limit orders wait for you',
    lede: 'A limit order names the price you want and then watches the market for you, firing the instant your number is hit — even while you are busy elsewhere.',
    points: [
      'A limit BUY fills when the price falls to your target or below.',
      'A limit SELL fills when the price rises to your target or above.',
      'Cancel or edit any resting order from the Limit Orders tab at any time.'
    ],
    callout: {
      kind: 'warn',
      title: 'Resting orders reserve your assets',
      body: 'A pending buy locks target × quantity of your cash, and a pending sell locks those shares. Locked funds cannot be spent twice, so cancel orders you no longer want.'
    },
    tip: 'Limit orders are how you catch a crash you did not stay awake for.',
    Visual: LimitMock
  },
  {
    id: 'charts',
    Icon: LineChart,
    kicker: 'Analysis',
    title: 'Read the chart first',
    lede: 'Open any stock to see its price history drawn from real ticks. Four windows let you tell a genuine trend apart from a momentary spike.',
    points: [
      'Switch between 5M, 15M, 30M and 1H — each redraws from the actual tape.',
      'Hover anywhere on the line to read the exact price and time at that point.',
      'OPEN, HIGH and LOW beneath the chart always describe the window you are viewing.'
    ],
    callout: {
      kind: 'formula',
      title: 'Zoom changes the story',
      body: 'A stock that looks like it is collapsing on 5M can be flat on 1H. Check a longer window before reacting to a short one.'
    },
    tip: 'The tick count under the chart tells you how much real data the line is drawn from.',
    shot: { src: '/guide/chart.png', label: 'Live terminal', alt: 'The real price chart with 5M, 15M, 30M and 1H timeframe buttons' },
    Visual: ChartMock
  },
  {
    id: 'news',
    Icon: Newspaper,
    kicker: 'Events',
    title: 'Trade the news',
    lede: 'Breaking bulletins interrupt the session and genuinely move prices. This is the fastest way the market changes under your feet.',
    points: [
      'A bulletin appears top-right with a chime and stays on screen long enough to read.',
      'Every trader receives the same headline at the same moment.',
      'The bulletin never says which way the price will go — that judgement is the game.'
    ],
    callout: {
      kind: 'warn',
      title: 'Speed is your only edge',
      body: 'Because the news is broadcast to everyone simultaneously, the advantage goes to whoever reads it and decides fastest.'
    },
    tip: 'Missed one? Every bulletin is kept in the News tab in the sidebar.',
    Visual: NewsMock
  },
  {
    id: 'close',
    Icon: Trophy,
    kicker: 'Scoring',
    title: 'Track it, then close it',
    lede: 'My Stocks shows what you hold and what it is worth. My Recent Trades shows the realised result of everything you have already sold.',
    points: [
      'Avg buy price is the weighted average across every buy of that stock, so buying more re-averages it.',
      'Profit on a holding is unrealised — it only becomes real when you sell.',
      'The Result column on a sale shows what you actually made against that average.'
    ],
    callout: {
      kind: 'clock',
      title: 'Trading locks before the bell',
      body: 'With 5 minutes left, trading locks and the market auto-liquidates: every holding is sold at the live price and all resting limit orders are cancelled. Do not count on a last-second exit.'
    },
    tip: 'The leaderboard ranks live net worth, so a good unrealised position still counts — right up until the close.',
    shot: { src: '/guide/portfolio.png', label: 'Live terminal', alt: 'The real My Stocks table showing shares, average buy price, price now and profit or loss' },
    shot2: { src: '/guide/trades.png', label: 'Live terminal', alt: 'The real My Recent Trades table showing the realised Result of each sale' },
    Visual: PortfolioMock
  }
];

const CALLOUT_STYLES = {
  formula: { Icon: Check, color: UP },
  warn: { Icon: AlertTriangle, color: ACCENT },
  clock: { Icon: Clock, color: ACCENT }
};

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
      /* private browsing — closing still works */
    }
    onClose();
  }, [onClose]);

  const next = useCallback(() => setIndex((i) => (i >= total - 1 ? i : i + 1)), [total]);
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  // Escape closes, arrows page through. A tutorial must never trap the user.
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

  useEffect(() => { if (isOpen) panelRef.current?.focus(); }, [isOpen]);
  useEffect(() => { if (isOpen) setIndex(0); }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [isOpen]);

  if (!isOpen) return null;

  const callout = CALLOUT_STYLES[step.callout.kind];
  const CalloutIcon = callout.Icon;
  const StepIcon = step.Icon;
  const Visual = step.Visual;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Equity Arena trader's manual"
      tabIndex={-1}
      className="fixed inset-0 z-[100] bg-[#080A10] text-white overflow-y-auto focus:outline-none"
    >
      {/* Saturated mesh — without this the glass has nothing to refract. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-52 -left-32 w-[720px] h-[720px] rounded-full blur-[150px] opacity-70"
             style={{ background: 'radial-gradient(circle,#F0B429 0%,transparent 68%)' }} />
        <div className="absolute top-1/3 -right-40 w-[760px] h-[760px] rounded-full blur-[160px] opacity-55"
             style={{ background: 'radial-gradient(circle,#10B981 0%,transparent 68%)' }} />
        <div className="absolute -bottom-56 left-1/3 w-[820px] h-[820px] rounded-full blur-[170px] opacity-55"
             style={{ background: 'radial-gradient(circle,#6366F1 0%,transparent 68%)' }} />
        {/* Darkening wash keeps body copy above 4.5:1 over the bright mesh. */}
        <div className="absolute inset-0 bg-[#080A10]/72" />
      </div>

      <div className="relative z-10 min-h-full flex flex-col">
        {/* ---------------- Header ---------------- */}
        <header className={`sticky top-0 z-20 flex items-center justify-between gap-4 px-5 sm:px-10 py-4 ${GLASS_SOFT} border-x-0 border-t-0`}>
          <div className="flex items-center gap-3.5 min-w-0">
            <span
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-slate-950 text-[15px] flex-shrink-0"
              style={{ background: ACCENT }}
              aria-hidden="true"
            >
              EA
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-mono font-bold tracking-[0.2em] uppercase" style={{ color: ACCENT }}>
                Equity Arena
              </span>
              <h1 className="text-[20px] sm:text-[23px] font-bold text-white truncate">
                Trader&rsquo;s Manual
              </h1>
            </span>
          </div>

          <button
            type="button"
            onClick={finish}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl ${GLASS} text-[16px] font-mono font-bold text-slate-200 hover:text-white hover:bg-white/[0.1] transition-colors cursor-pointer min-h-[52px] ${FOCUS}`}
          >
            <span className="hidden sm:inline">SKIP GUIDE</span>
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </header>

        {/* ---------------- Body ---------------- */}
        <main className="flex-1 w-full max-w-[1240px] mx-auto px-5 sm:px-10 py-10 sm:py-16">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 items-start">
            {/* Left: the teaching copy */}
            <div className="min-w-0">
              {/* Oversized ghost numeral anchors each section */}
              <div className="flex items-center gap-5">
                <span
                  className="text-[76px] sm:text-[96px] font-black leading-none tracking-tighter select-none"
                  style={{ color: 'transparent', WebkitTextStroke: `2px ${ACCENT}66` }}
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="flex flex-col gap-1.5">
                  <span className="inline-flex items-center gap-2 text-[16px] font-mono font-bold uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
                    <StepIcon className="w-5 h-5" aria-hidden="true" />
                    {step.kicker}
                  </span>
                  <span className="text-[16px] font-mono text-slate-300">
                    Section {index + 1} of {total}
                  </span>
                </span>
              </div>

              <h2 className="mt-6 text-[46px] sm:text-[66px] font-bold leading-[1.03] tracking-tight text-white"
                  style={{ textWrap: 'balance' }}>
                {step.title}
              </h2>

              <p className="mt-6 text-[22px] sm:text-[25px] leading-[1.5] text-slate-100 max-w-[52ch]">
                {step.lede}
              </p>

              {/* Numbered rules, hairline-separated — not another bullet list */}
              <ol className="mt-9 divide-y divide-white/[0.09] border-y border-white/[0.09]">
                {step.points.map((p, i) => (
                  <li key={p} className="flex gap-5 py-4">
                    <span className="text-[17px] font-mono font-bold pt-0.5 flex-shrink-0" style={{ color: ACCENT }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[19px] leading-[1.5] text-slate-100">{p}</span>
                  </li>
                ))}
              </ol>

              <div
                className="mt-9 rounded-2xl border p-6 backdrop-blur-xl"
                style={{ borderColor: `${callout.color}33`, background: `${callout.color}12` }}
              >
                <div className="flex items-center gap-2.5">
                  <CalloutIcon className="w-5 h-5 flex-shrink-0" style={{ color: callout.color }} aria-hidden="true" />
                  <span className="text-[16px] font-mono font-bold uppercase tracking-[0.14em]" style={{ color: callout.color }}>
                    {step.callout.title}
                  </span>
                </div>
                <p className="mt-3 text-[19px] leading-[1.5] text-slate-50">{step.callout.body}</p>
              </div>

              <p className="mt-8 flex gap-4 text-[18px] leading-[1.5] text-slate-200">
                <Lightbulb className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: ACCENT }} aria-hidden="true" />
                <span>{step.tip}</span>
              </p>
            </div>

            {/* Right: a real capture when one exists, else the diagram */}
            <div className="lg:sticky lg:top-28 min-w-0 space-y-5">
              {step.shot ? <Shot {...step.shot} /> : <Visual />}
              {step.shot2 && <Shot {...step.shot2} />}
            </div>
          </div>
        </main>

        {/* ---------------- Footer controls ---------------- */}
        <footer className={`sticky bottom-0 z-20 px-5 sm:px-10 py-4 ${GLASS_SOFT} border-x-0 border-b-0`}>
          <div className="max-w-[1240px] mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5" role="group" aria-label="Jump to section">
              {STEPS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  title={s.title}
                  aria-label={`Section ${i + 1}: ${s.title}`}
                  aria-current={i === index ? 'step' : undefined}
                  className={`h-3 rounded-full transition-all cursor-pointer ${FOCUS} ${
                    i === index ? 'w-10' : 'w-3 bg-white/25 hover:bg-white/45'
                  }`}
                  style={i === index ? { background: ACCENT } : undefined}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={prev}
                disabled={index === 0}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl ${GLASS} text-[16px] font-mono font-bold text-slate-200 hover:text-white hover:bg-white/[0.1] transition-colors min-h-[52px] cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${FOCUS}`}
              >
                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                <span className="hidden sm:inline">BACK</span>
              </button>

              <button
                type="button"
                onClick={isLast ? finish : next}
                className={`flex items-center gap-2.5 px-7 py-3 rounded-2xl text-slate-950 text-[16px] font-mono font-extrabold tracking-wider transition-transform hover:scale-[1.02] active:scale-[0.98] min-h-[48px] cursor-pointer ${FOCUS}`}
                style={{ background: ACCENT, boxShadow: `0 8px 30px -8px ${ACCENT}` }}
              >
                <span>{isLast ? 'START TRADING' : 'NEXT'}</span>
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
