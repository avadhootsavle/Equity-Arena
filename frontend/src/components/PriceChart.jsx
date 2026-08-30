import React, { useState, useRef, useEffect, useMemo, useCallback, useId } from 'react';

/* ============================================================
   SCALE HELPERS
   ============================================================ */

/**
 * Produces "nice" round tick values covering [min, max].
 * Steps are constrained to 1/2/2.5/5/10 x 10^n so the axis reads cleanly.
 */
export function niceScale(min, max, targetTicks = 5) {
  if (!isFinite(min) || !isFinite(max)) return { ticks: [0, 1], lo: 0, hi: 1 };

  if (min === max) {
    const pad = Math.abs(min) * 0.02 || 1;
    min -= pad;
    max += pad;
  }

  const rawStep = (max - min) / Math.max(1, targetTicks);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;

  let stepMultiplier;
  if (normalized <= 1) stepMultiplier = 1;
  else if (normalized <= 2) stepMultiplier = 2;
  else if (normalized <= 2.5) stepMultiplier = 2.5;
  else if (normalized <= 5) stepMultiplier = 5;
  else stepMultiplier = 10;

  const step = stepMultiplier * magnitude;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;

  const ticks = [];
  // Epsilon guard so floating-point drift doesn't drop the final tick
  for (let v = lo; v <= hi + step * 1e-9; v += step) {
    ticks.push(Math.round(v * 1e6) / 1e6);
  }

  return { ticks, lo, hi, step };
}

/** Binary search for the sample whose timestamp is nearest to `t`. */
function nearestIndexByTime(points, t) {
  if (points.length === 0) return -1;

  let low = 0;
  let high = points.length - 1;

  while (low < high) {
    const mid = (low + high) >> 1;
    if (points[mid].t < t) low = mid + 1;
    else high = mid;
  }

  // `low` is the first index at or after t — compare against its predecessor
  if (low > 0 && Math.abs(points[low - 1].t - t) <= Math.abs(points[low].t - t)) {
    return low - 1;
  }
  return low;
}

const fmtClock = (ts) =>
  new Date(ts).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

const fmtClockSeconds = (ts) =>
  new Date(ts).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

const fmtDay = (ts) =>
  new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

const fmtMoney = (n, decimals = 2) =>
  Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

const fmtCompact = (n) => {
  const v = Number(n) || 0;
  if (v >= 1e7) return `${(v / 1e7).toFixed(2)}Cr`;
  if (v >= 1e5) return `${(v / 1e5).toFixed(2)}L`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return String(Math.round(v));
};

/* ============================================================
   PRICE CHART
   ============================================================ */

/** Simple moving average over `period` samples; leading entries are null. */
export function movingAverage(values, period = 10) {
  if (!values || values.length === 0) return [];

  const out = new Array(values.length).fill(null);
  let running = 0;

  for (let i = 0; i < values.length; i++) {
    running += values[i];
    if (i >= period) running -= values[i - period];
    if (i >= period - 1) out[i] = running / period;
  }

  return out;
}

export function PriceChart({
  history = [],
  currentPrice,
  height = 360,
  lineColorOverride,
  showVolume = false,
  showSMA = false,
  smaPeriod = 10,
  showFooter = true,
  spanLabel = 'session'
}) {
  const wrapRef = useRef(null);
  // Scoped id so two charts on screen can't share one gradient/filter
  const uid = useId().replace(/:/g, '');
  const [width, setWidth] = useState(720);
  const [hoverIndex, setHoverIndex] = useState(null);

  /* --- Responsive width -------------------------------------------------- */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const measure = () => setWidth(Math.max(280, el.clientWidth));
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* --- Normalise + sort the series --------------------------------------- */
  const points = useMemo(() => {
    const cleaned = (history || [])
      .filter((h) => h && isFinite(Number(h.price)))
      .map((h) => ({
        p: Number(h.price),
        v: Number(h.volume) || 0,
        t: new Date(h.timestamp || Date.now()).getTime()
      }))
      .filter((h) => isFinite(h.t))
      .sort((a, b) => a.t - b.t);

    // Collapse duplicate timestamps, keeping the last reading for each
    const deduped = [];
    for (const pt of cleaned) {
      if (deduped.length > 0 && deduped[deduped.length - 1].t === pt.t) {
        deduped[deduped.length - 1] = pt;
      } else {
        deduped.push(pt);
      }
    }
    return deduped;
  }, [history]);

  /* --- Geometry ---------------------------------------------------------- */
  const padding = { top: 14, right: 62, bottom: 26, left: 10 };
  const volumeHeight = showVolume ? 34 : 0;
  const plotW = Math.max(10, width - padding.left - padding.right);
  const plotH = Math.max(40, height - padding.top - padding.bottom - volumeHeight);

  const model = useMemo(() => {
    if (points.length < 2) return null;

    const prices = points.map((p) => p.p);
    const lo = Math.min(...prices);
    const hi = Math.max(...prices);

    // 6% headroom so the line never touches the frame
    const span = hi - lo || Math.max(hi * 0.01, 0.5);
    const scale = niceScale(lo - span * 0.06, hi + span * 0.06, 5);

    const t0 = points[0].t;
    const t1 = points[points.length - 1].t;
    const tSpan = t1 - t0 || 1;
    const yDomain = scale.hi - scale.lo || 1;

    const xOf = (t) => padding.left + ((t - t0) / tSpan) * plotW;
    const yOf = (p) => padding.top + plotH - ((p - scale.lo) / yDomain) * plotH;

    const coords = points.map((pt) => ({ ...pt, x: xOf(pt.t), y: yOf(pt.p) }));

    // Straight segments only — no smoothing, so every reading is plotted exactly
    const linePath = coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(2)},${c.y.toFixed(2)}`)
      .join(' ');

    const baseY = padding.top + plotH;
    const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(2)},${baseY} L${coords[0].x.toFixed(2)},${baseY} Z`;

    /* Minute boundaries inside the visible window — the dotted vertical rules.
       Falls back to coarser buckets on long ranges so the grid stays readable. */
    const minuteMs = 60_000;
    let bucketMs = minuteMs;
    const bucketCandidates = [1, 2, 5, 10, 15, 30, 60, 120, 240, 720, 1440];
    for (const mins of bucketCandidates) {
      bucketMs = mins * minuteMs;
      if (tSpan / bucketMs <= 9) break;
    }
    const isIntraday = bucketMs < 24 * 60 * minuteMs;

    const gridLines = [];
    const firstBucket = Math.ceil(t0 / bucketMs) * bucketMs;
    for (let t = firstBucket; t <= t1; t += bucketMs) {
      const idx = nearestIndexByTime(points, t);
      gridLines.push({
        t,
        x: xOf(t),
        label: isIntraday ? fmtClock(t) : fmtDay(t),
        // The price the tape was at when that minute struck
        price: idx >= 0 ? points[idx].p : null
      });
    }

    const maxVolume = Math.max(...points.map((p) => p.v), 1);

    const openPrice = points[0].p;
    const closePrice = points[points.length - 1].p;

    /* SMA overlay — drawn as separate runs so the leading null window
       leaves a gap rather than a line back to the origin. */
    const smaValues = movingAverage(prices, smaPeriod);
    const smaSegments = [];
    let current = [];
    smaValues.forEach((value, i) => {
      if (value == null) {
        if (current.length > 1) smaSegments.push(current);
        current = [];
        return;
      }
      current.push(`${coords[i].x.toFixed(2)},${yOf(value).toFixed(2)}`);
    });
    if (current.length > 1) smaSegments.push(current);

    const latestSMA = [...smaValues].reverse().find((v) => v != null) ?? null;

    return {
      coords,
      linePath,
      areaPath,
      smaSegments,
      latestSMA,
      totalVolume: points.reduce((sum, p) => sum + p.v, 0),
      scale,
      yOf,
      xOf,
      t0,
      t1,
      baseY,
      gridLines,
      maxVolume,
      openPrice,
      closePrice,
      high: hi,
      low: lo,
      isUp: closePrice >= openPrice,
      bucketMinutes: bucketMs / minuteMs
    };
  }, [points, plotW, plotH, padding.left, padding.top, smaPeriod]);

  /* --- Pointer interaction ------------------------------------------------ */
  const handlePointerMove = useCallback(
    (e) => {
      if (!model) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const localX = ((e.clientX - rect.left) / rect.width) * width;
      const clampedX = Math.min(
        padding.left + plotW,
        Math.max(padding.left, localX)
      );
      const ratio = (clampedX - padding.left) / plotW;
      const t = model.t0 + ratio * (model.t1 - model.t0);
      setHoverIndex(nearestIndexByTime(points, t));
    },
    [model, points, width, plotW, padding.left]
  );

  const handlePointerLeave = useCallback(() => setHoverIndex(null), []);

  /* --- Empty state --------------------------------------------------------- */
  if (!model) {
    return (
      <div
        ref={wrapRef}
        className="w-full flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed theme-border"
        style={{ height }}
      >
        <div className="w-6 h-6 rounded-full border-2 border-dashed theme-border-strong animate-spin" />
        <span className="text-[11px] font-mono theme-text-dim">
          Waiting for tape — not enough price history yet
        </span>
      </div>
    );
  }

  const upColor = 'var(--gain-green)';
  const downColor = 'var(--loss-red)';
  const lineColor = model.isUp ? upColor : downColor;
  const gradientId = `chartFill-${uid}-${model.isUp ? 'up' : 'down'}`;

  const active = hoverIndex != null ? model.coords[hoverIndex] : null;
  const last = model.coords[model.coords.length - 1];
  const marker = active || last;

  const deltaFromOpen = marker.p - model.openPrice;
  const deltaPct = model.openPrice ? (deltaFromOpen / model.openPrice) * 100 : 0;

  // Keep the tooltip inside the plot area
  const tooltipW = 158;
  const tooltipH = 80;
  const tooltipX = Math.min(
    Math.max(padding.left + 4, marker.x - tooltipW / 2),
    padding.left + plotW - tooltipW - 4
  );
  const tooltipY = Math.max(padding.top + 4, marker.y - tooltipH - 14);

  return (
    <div ref={wrapRef} className="w-full select-none">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="chart-surface block"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerMove}
        role="img"
        aria-label={`Price chart over the ${spanLabel}. Open ${fmtMoney(model.openPrice)}, high ${fmtMoney(model.high)}, low ${fmtMoney(model.low)}, last ${fmtMoney(model.closePrice)} IC.`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.26" />
            <stop offset="45%" stopColor={lineColor} stopOpacity="0.09" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>

          {/* A faint halo sits under the crisp stroke (SourceGraphic is merged
              last) so the line gains depth without going fuzzy. */}
          <filter id={`${gradientId}-glow`} x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComponentTransfer in="blur" result="softBlur">
              <feFuncA type="linear" slope="0.55" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="softBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id={`plotClip-${uid}`}>
            <rect
              x={padding.left}
              y={padding.top - 4}
              width={plotW}
              height={plotH + 8}
            />
          </clipPath>
        </defs>

        {/* ---- Horizontal price gridlines + right-hand axis labels ---- */}
        {model.scale.ticks.map((tick) => {
          const y = model.yOf(tick);
          if (y < padding.top - 1 || y > padding.top + plotH + 1) return null;

          // The live-price chip (and the crosshair chip) are drawn over this
          // axis, so drop any tick label they would sit on top of.
          const chipYs = [model.yOf(model.closePrice)];
          if (active) chipYs.push(active.y);
          const occluded = chipYs.some((chipY) => Math.abs(chipY - y) < 11);

          return (
            <g key={`ytick-${tick}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + plotW}
                y2={y}
                stroke="var(--grid-line)"
                strokeWidth="1"
              />
              {!occluded && (
              <text
                x={padding.left + plotW + 8}
                y={y + 4}
                fill="var(--text-muted)"
                fontSize="11.5"
                fontWeight="600"
                fontFamily="'JetBrains Mono', monospace"
              >
                {fmtMoney(tick, tick >= 1000 ? 0 : 2)} IC
              </text>
              )}
            </g>
          );
        })}

        {/* ---- Dotted vertical minute rules + time axis ---- */}
        {model.gridLines.map((g) => (
          <g key={`xgrid-${g.t}`}>
            <line
              x1={g.x}
              y1={padding.top}
              x2={g.x}
              y2={padding.top + plotH}
              stroke="var(--grid-line)"
              strokeWidth="1"
              strokeDasharray="2 4"
            />
            <text
              x={g.x}
              y={height - 8}
              fill="var(--text-muted)"
              fontSize="11.5"
              fontWeight="600"
              fontFamily="'JetBrains Mono', monospace"
              textAnchor="middle"
            >
              {g.label}
            </text>
            {/* Tick mark showing where price sat at that minute boundary */}
            {g.price != null && (
              <circle
                cx={g.x}
                cy={model.yOf(g.price)}
                r="1.8"
                fill="var(--text-dim)"
                opacity="0.55"
              />
            )}
          </g>
        ))}

        {/* ---- Open-price reference line ---- */}
        <line
          x1={padding.left}
          y1={model.yOf(model.openPrice)}
          x2={padding.left + plotW}
          y2={model.yOf(model.openPrice)}
          stroke="var(--text-dim)"
          strokeWidth="1"
          strokeDasharray="5 5"
          opacity="0.5"
        />

        {/* ---- Volume histogram ---- */}
        {showVolume &&
          model.coords.map((c, i) => {
            const barW = Math.max(1, plotW / model.coords.length - 1);
            const barH = (c.v / model.maxVolume) * (volumeHeight - 6);
            const rising = i > 0 ? c.p >= model.coords[i - 1].p : true;
            return (
              <rect
                key={`vol-${c.t}-${i}`}
                x={c.x - barW / 2}
                y={height - padding.bottom - barH}
                width={barW}
                height={Math.max(0.5, barH)}
                fill={rising ? upColor : downColor}
                opacity="0.22"
              />
            );
          })}

        {/* ---- Area + price line ---- */}
        <g clipPath={`url(#plotClip-${uid})`}>
          <path d={model.areaPath} fill={`url(#${gradientId})`} />

          {/* SMA overlay sits under the spot line so price stays dominant */}
          {showSMA &&
            model.smaSegments.map((segment, i) => (
              <polyline
                key={`sma-${i}`}
                points={segment.join(' ')}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.4"
                strokeDasharray="5 4"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                opacity="0.9"
              />
            ))}

          <path
            d={model.linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            shapeRendering="geometricPrecision"
            filter={`url(#${gradientId}-glow)`}
            opacity="0.95"
          />
        </g>

        {/* ---- Last-price marker (idle state) ---- */}
        {!active && (
          <>
            <circle cx={last.x} cy={last.y} r="7" fill={lineColor} opacity="0.18">
              <animate
                attributeName="r"
                values="5;11;5"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.28;0;0.28"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle
              cx={last.x}
              cy={last.y}
              r="3.4"
              fill={lineColor}
              stroke="var(--bg-card)"
              strokeWidth="1.5"
            />
          </>
        )}

        {/* ---- Live price chip pinned to the right axis ---- */}
        <g>
          <rect
            x={padding.left + plotW + 3}
            y={model.yOf(model.closePrice) - 9}
            width={padding.right - 6}
            height="18"
            rx="3"
            fill={lineColor}
          />
          <text
            x={padding.left + plotW + 3 + (padding.right - 6) / 2}
            y={model.yOf(model.closePrice) + 4}
            fill="#FFFFFF"
            fontSize="10"
            fontWeight="700"
            fontFamily="'JetBrains Mono', monospace"
            textAnchor="middle"
          >
            {fmtMoney(model.closePrice, model.closePrice >= 1000 ? 1 : 2)}
          </text>
        </g>

        {/* ================= CROSSHAIR ================= */}
        {active && (
          <g className="pointer-events-none">
            {/* Vertical dotted line — the price at this exact minute */}
            <line
              x1={active.x}
              y1={padding.top}
              x2={active.x}
              y2={padding.top + plotH}
              stroke="var(--crosshair)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            {/* Horizontal dotted line to the price axis */}
            <line
              x1={padding.left}
              y1={active.y}
              x2={padding.left + plotW}
              y2={active.y}
              stroke="var(--crosshair)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />

            {/* Price label on the axis */}
            <rect
              x={padding.left + plotW + 3}
              y={active.y - 9}
              width={padding.right - 6}
              height="18"
              rx="3"
              fill="var(--text-main)"
            />
            <text
              x={padding.left + plotW + 3 + (padding.right - 6) / 2}
              y={active.y + 4}
              fill="var(--bg-card)"
              fontSize="10"
              fontWeight="700"
              fontFamily="'JetBrains Mono', monospace"
              textAnchor="middle"
            >
              {fmtMoney(active.p, active.p >= 1000 ? 1 : 2)}
            </text>

            {/* Timestamp label on the time axis */}
            <rect
              x={Math.min(
                Math.max(padding.left, active.x - 30),
                padding.left + plotW - 60
              )}
              y={height - padding.bottom + 2}
              width="60"
              height="16"
              rx="3"
              fill="var(--text-main)"
            />
            <text
              x={Math.min(
                Math.max(padding.left, active.x - 30),
                padding.left + plotW - 60
              ) + 30}
              y={height - padding.bottom + 13}
              fill="var(--bg-card)"
              fontSize="9.5"
              fontWeight="700"
              fontFamily="'JetBrains Mono', monospace"
              textAnchor="middle"
            >
              {fmtClockSeconds(active.t)}
            </text>

            {/* Point marker */}
            <circle cx={active.x} cy={active.y} r="8" fill={lineColor} opacity="0.2" />
            <circle
              cx={active.x}
              cy={active.y}
              r="4"
              fill={lineColor}
              stroke="var(--bg-card)"
              strokeWidth="2"
            />

            {/* Readout tooltip */}
            <g transform={`translate(${tooltipX}, ${tooltipY})`}>
              <rect
                width={tooltipW}
                height={tooltipH}
                rx="6"
                fill="var(--bg-elevated)"
                stroke="var(--border-strong)"
                strokeWidth="1"
              />
              <text
                x="10"
                y="17"
                fill="var(--text-dim)"
                fontSize="9"
                fontFamily="'JetBrains Mono', monospace"
                letterSpacing="0.5"
              >
                {fmtClockSeconds(active.t)}
              </text>
              <text
                x="10"
                y="37"
                fill="var(--text-main)"
                fontSize="15"
                fontWeight="700"
                fontFamily="'JetBrains Mono', monospace"
              >
                {fmtMoney(active.p)} IC
              </text>
              {/* Delta and volume each get their own row so long values
                  (thousands + percent) can never collide. */}
              <text
                x="10"
                y="55"
                fill={deltaFromOpen >= 0 ? upColor : downColor}
                fontSize="10"
                fontWeight="700"
                fontFamily="'JetBrains Mono', monospace"
              >
                {deltaFromOpen >= 0 ? '+' : ''}
                {fmtMoney(deltaFromOpen)} ({deltaFromOpen >= 0 ? '+' : ''}
                {deltaPct.toFixed(2)}%)
              </text>
              <text
                x="10"
                y="70"
                fill="var(--text-dim)"
                fontSize="9"
                fontFamily="'JetBrains Mono', monospace"
              >
                vs open · vol {fmtCompact(active.v)}
              </text>
            </g>
          </g>
        )}
      </svg>

      {!showFooter ? null : (
      <>
      {/* ---- Session statistics strip ---- */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-px mt-3 rounded-lg overflow-hidden border theme-border">
        {[
          { label: 'Open', value: `${fmtMoney(model.openPrice)} IC` },
          { label: 'High', value: `${fmtMoney(model.high)} IC`, tone: 'up' },
          { label: 'Low', value: `${fmtMoney(model.low)} IC`, tone: 'down' },
          {
            label: 'Range',
            value: `${fmtMoney(model.high - model.low)} IC`
          },
          {
            label: 'Ticks',
            value: `${model.coords.length}`
          }
        ].map((stat) => (
          <div key={stat.label} className="theme-bg-panel px-3 py-2">
            <div className="text-[9px] uppercase tracking-widest theme-text-dim font-mono">
              {stat.label}
            </div>
            <div
              className="text-xs font-mono font-bold mt-0.5"
              style={{
                color:
                  stat.tone === 'up'
                    ? upColor
                    : stat.tone === 'down'
                    ? downColor
                    : 'var(--text-main)'
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] font-mono theme-text-dim">
        <span>
          Dotted rules mark every{' '}
          {model.bucketMinutes >= 1440
            ? `${model.bucketMinutes / 1440}d`
            : `${model.bucketMinutes}m`}{' '}
          — hover the chart for the exact price at any moment
        </span>
        <span className="hidden sm:inline">
          {fmtClock(model.t0)} → {fmtClock(model.t1)}
        </span>
      </div>
      </>
      )}
    </div>
  );
}
