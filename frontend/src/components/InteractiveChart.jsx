import React, { useState, useRef, useCallback, memo } from 'react';
import { calculateSMA } from './Sparkline';

/**
 * Interactive Trading Chart Component
 * Supports Mouse Hover (Desktop) and Touch Drag (Mobile)
 * Renders Vertical Crosshair, Line Dot Intersection Marker, and Dynamic Tooltip Box
 */
export const InteractiveChart = memo(({
  history = [],
  timeframe = '1D',
  width = 650,
  height = 200,
  showSMA = true,
  showVolume = true
}) => {
  const containerRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!history || history.length < 2) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs font-mono theme-text-dim theme-bg-card rounded-[6px] border theme-border">
        Awaiting live price ticks...
      </div>
    );
  }

  const prices = history.map((h) => h.price);
  const volumes = history.map((h) => h.volume || 10000);

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;
  const maxVolume = Math.max(...volumes) || 1;

  const topPadding = 12;
  const bottomPadding = showVolume ? 36 : 16;
  const chartHeight = height - topPadding - bottomPadding;
  const volumeChartHeight = showVolume ? 24 : 0;

  // Calculate SVG Points for Price Line
  const points = history.map((h, i) => {
    const x = (i / (history.length - 1)) * width;
    const y = topPadding + chartHeight - ((h.price - minPrice) / priceRange) * chartHeight;
    return { x, y, price: h.price, volume: h.volume, timestamp: h.timestamp };
  });

  const pricePointsString = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Calculate SMA-10
  const smaValues = calculateSMA(history, 10);
  const smaPointsString = history
    .map((h, i) => {
      const val = smaValues[i];
      if (val === null) return null;
      const x = (i / (history.length - 1)) * width;
      const y = topPadding + chartHeight - ((val - minPrice) / priceRange) * chartHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .filter(Boolean)
    .join(' ');

  const isUp = prices[prices.length - 1] >= prices[0];
  const strokeColor = isUp ? '#10b981' : '#f43f5e';
  const areaFillGradient = isUp ? 'url(#chartGradUp)' : 'url(#chartGradDown)';

  const bottomY = topPadding + chartHeight;
  const fillPolygonPoints = `0,${bottomY} ${pricePointsString} ${width},${bottomY}`;

  // Mouse / Touch Interaction Handler
  const handlePointerMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const percent = relativeX / rect.width;
    const idx = Math.round(percent * (history.length - 1));
    setHoverIndex(idx);
  }, [history.length]);

  const handleMouseMove = (e) => {
    handlePointerMove(e.clientX);
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handlePointerMove(e.touches[0].clientX);
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  // Format Tooltip Timestamp
  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    if (isNaN(date.getTime())) return '';

    if (timeframe === '1D') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } else if (timeframe === '1W') {
      return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const activeHoverPoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none cursor-crosshair touch-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseLeave}
    >
      {/* Floating Hover Tooltip Box */}
      {activeHoverPoint && (
        <div
          className="absolute z-20 pointer-events-none px-3 py-2 bg-slate-900/95 border border-slate-700 text-white rounded-[6px] shadow-xl backdrop-blur-md transition-all duration-75 flex flex-col gap-0.5"
          style={{
            left: `${Math.min(80, Math.max(15, (activeHoverPoint.x / width) * 100))}%`,
            top: '8px',
            transform: 'translateX(-50%)'
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold font-mono text-emerald-400">
              {activeHoverPoint.price.toFixed(2)} IC
            </span>
            {hoverIndex > 0 && (
              <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                activeHoverPoint.price >= points[hoverIndex - 1].price ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {activeHoverPoint.price >= points[hoverIndex - 1].price ? '+' : ''}
                {(((activeHoverPoint.price - points[hoverIndex - 1].price) / points[hoverIndex - 1].price) * 100).toFixed(2)}%
              </span>
            )}
          </div>
          <div className="text-[10px] font-mono theme-text-muted flex items-center gap-2">
            <span>{formatTimestamp(activeHoverPoint.timestamp)}</span>
            {activeHoverPoint.volume && (
              <span>• Vol: {activeHoverPoint.volume.toLocaleString()}</span>
            )}
          </div>
        </div>
      )}

      {/* SVG Chart */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chartGradUp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="chartGradDown" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Volume Bars */}
        {showVolume &&
          points.map((p, i) => {
            const barWidth = Math.max(1, (width / points.length) - 1.5);
            const barHeight = ((p.volume || 10000) / maxVolume) * volumeChartHeight;
            const y = height - barHeight;
            const isBarUp = i > 0 ? p.price >= points[i - 1].price : true;

            return (
              <rect
                key={i}
                x={p.x - barWidth / 2}
                y={y}
                width={barWidth}
                height={Math.max(1, barHeight)}
                fill={isBarUp ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)'}
                rx={0.5}
              />
            );
          })}

        {/* Area Gradient Fill */}
        <polygon points={fillPolygonPoints} fill={areaFillGradient} />

        {/* SMA-10 Line */}
        {showSMA && smaPointsString && (
          <polyline
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            points={smaPointsString}
          />
        )}

        {/* Primary Price Line */}
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pricePointsString}
        />

        {/* Static End Point Dot (when not hovering) */}
        {hoverIndex === null && points.length > 0 && (
          <g>
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="4"
              fill={strokeColor}
            />
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="7"
              fill={strokeColor}
              className="animate-ping opacity-65"
            />
          </g>
        )}

        {/* Hover Crosshair & Intersection Marker Dot */}
        {activeHoverPoint && (
          <g>
            {/* Vertical Crosshair Line */}
            <line
              x1={activeHoverPoint.x}
              y1="0"
              x2={activeHoverPoint.x}
              y2={height}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="3 3"
              className="opacity-80"
            />

            {/* Horizontal Guide Line */}
            <line
              x1="0"
              y1={activeHoverPoint.y}
              x2={width}
              y2={activeHoverPoint.y}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="3 3"
              className="opacity-40"
            />

            {/* Glowing Intersection Dot Marker */}
            <circle
              cx={activeHoverPoint.x}
              cy={activeHoverPoint.y}
              r="6"
              fill={strokeColor}
              stroke="#ffffff"
              strokeWidth="2"
              className="shadow-lg"
            />
          </g>
        )}
      </svg>
    </div>
  );
});
