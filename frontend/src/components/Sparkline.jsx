import React, { memo } from 'react';

/**
 * Calculates a Simple Moving Average (SMA) over a given period (default 10)
 */
export function calculateSMA(data, period = 10) {
  if (!data || data.length === 0) return [];
  
  return data.map((item, index) => {
    if (index < period - 1) {
      return null; // Not enough periods yet
    }
    const slice = data.slice(index - period + 1, index + 1);
    const sum = slice.reduce((acc, curr) => acc + curr.price, 0);
    return Math.round((sum / period) * 100) / 100;
  });
}

export const Sparkline = memo(({ history = [], width = 120, height = 36, showVolume = false, showSMA = false }) => {
  if (!history || history.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-[10px] text-slate-500 font-mono bg-slate-900/50 rounded"
        style={{ width, height }}
      >
        --
      </div>
    );
  }

  const prices = history.map((h) => h.price);
  const volumes = history.map((h) => h.volume || 10000);

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const maxVolume = Math.max(...volumes) || 1;

  // Chart padding allocations
  const topPadding = 6;
  const priceChartHeight = showVolume ? height * 0.7 : height - topPadding * 2;
  const volumeChartHeight = showVolume ? height * 0.25 : 0;

  // Calculate SVG Points for Price Line
  const pricePoints = history.map((h, i) => {
    const x = (i / (history.length - 1)) * width;
    const y = topPadding + priceChartHeight - ((h.price - minPrice) / priceRange) * priceChartHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  // Calculate SMA-10 Points
  const smaValues = calculateSMA(history, 10);
  const smaPoints = history
    .map((h, i) => {
      const smaVal = smaValues[i];
      if (smaVal === null) return null;
      const x = (i / (history.length - 1)) * width;
      const y = topPadding + priceChartHeight - ((smaVal - minPrice) / priceRange) * priceChartHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .filter(Boolean);

  const isUp = prices[prices.length - 1] >= prices[0];
  const strokeColor = isUp ? '#10b981' : '#f43f5e'; // emerald-500 vs rose-500
  const fillColor = isUp ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)';

  // Fill Polygon Points (Area under price line)
  const firstX = 0;
  const lastX = width;
  const bottomY = topPadding + priceChartHeight;
  const fillPoints = `${firstX},${bottomY} ${pricePoints.join(' ')} ${lastX},${bottomY}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${isUp ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
        </linearGradient>
      </defs>

      {/* Volume Bars (rendered at bottom if showVolume is true) */}
      {showVolume &&
        history.map((h, i) => {
          const barWidth = Math.max(1, (width / history.length) - 1);
          const x = (i / (history.length - 1)) * width - barWidth / 2;
          const barHeight = ((h.volume || 10000) / maxVolume) * volumeChartHeight;
          const y = height - barHeight;
          const isBarUp = i > 0 ? h.price >= history[i - 1].price : true;

          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(1, barHeight)}
              fill={isBarUp ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}
              rx={0.5}
            />
          );
        })}

      {/* Price Area Fill */}
      <polygon points={fillPoints} fill={`url(#grad-${isUp ? 'up' : 'down'})`} />

      {/* SMA-10 Line (Dashed Amber/Indigo Line) */}
      {showSMA && smaPoints.length > 1 && (
        <polyline
          fill="none"
          stroke="#f59e0b" // amber-500
          strokeWidth="1.5"
          strokeDasharray="3 3"
          points={smaPoints.join(' ')}
        />
      )}

      {/* Primary Price Polyline */}
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pricePoints.join(' ')}
      />

      {/* Current Price Dot */}
      {pricePoints.length > 0 && (
        <circle
          cx={pricePoints[pricePoints.length - 1].split(',')[0]}
          cy={pricePoints[pricePoints.length - 1].split(',')[1]}
          r="3"
          fill={strokeColor}
          className="animate-ping opacity-75"
        />
      )}
    </svg>
  );
});
