import React, { memo, useState, useEffect, useRef, useMemo } from 'react';
import { apiFetch } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const fmtMoney = (n, d = 2) =>
  Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d
  });

/**
 * 36px SVG Sparkline Chart + 15M Rolling High/Low Stats
 */
export const StockSparkline = memo(function StockSparkline({
  stockId,
  currentPrice,
  stockTick,
  index = 0
}) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoverIndex, setHoverIndex] = useState(null);
  const containerRef = useRef(null);

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Staggered fetch on mount (3-4 cards per batch to avoid backend hit)
  useEffect(() => {
    let isMounted = true;
    const delay = Math.min((index % 5) * 80, 400);

    const timer = setTimeout(async () => {
      try {
        const data = await apiFetch(`/stocks/${stockId}/history?range=15M`);
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            setHistory(data);
          } else {
            setHistory([{ price: Number(currentPrice) || 0, timestamp: new Date().toISOString() }]);
          }
        }
      } catch (err) {
        if (isMounted) {
          setHistory([{ price: Number(currentPrice) || 0, timestamp: new Date().toISOString() }]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }, delay);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [stockId, index]); // eslint-disable-line react-hooks/exhaustive-deps

  // Append new incoming tick or price update to rolling 15-minute window
  useEffect(() => {
    const priceVal = Number(stockTick?.newPrice || stockTick?.currentPrice || currentPrice);
    if (!priceVal || isNaN(priceVal)) return;

    const now = Date.now();
    const cutoff = now - 15 * 60 * 1000; // 15 minutes rolling cutoff

    setHistory((prev) => {
      if (prev.length > 0) {
        const lastP = Number(prev[prev.length - 1].price);
        if (lastP === priceVal) return prev;
      }
      return [
        ...prev.filter((item) => new Date(item.timestamp).getTime() >= cutoff),
        { price: priceVal, timestamp: new Date().toISOString() }
      ];
    });
  }, [stockTick, currentPrice]);

  // Compute 15M High, Low, and Trend Color
  const { points, high, low, isUp, startPrice, endPrice } = useMemo(() => {
    const rawPrices = history.map((h) => Number(h.price)).filter(isFinite);
    
    if (rawPrices.length === 0) {
      const p = Number(currentPrice) || 0;
      return {
        points: [p, p],
        high: p,
        low: p,
        isUp: true,
        startPrice: p,
        endPrice: p
      };
    }

    const first = rawPrices[0];
    const last = rawPrices[rawPrices.length - 1];
    const highVal = Math.max(...rawPrices);
    const lowVal = Math.min(...rawPrices);

    return {
      points: rawPrices,
      high: highVal,
      low: lowVal,
      isUp: last >= first,
      startPrice: first,
      endPrice: last
    };
  }, [history, currentPrice]);

  // Generate SVG Path & Area Coordinates
  const height = 36;
  const viewBoxWidth = 260;

  const { pathD, areaD, coords } = useMemo(() => {
    if (points.length < 2) {
      const midY = height / 2;
      return {
        pathD: `M 0 ${midY} L ${viewBoxWidth} ${midY}`,
        areaD: `M 0 ${midY} L ${viewBoxWidth} ${midY} L ${viewBoxWidth} ${height} L 0 ${height} Z`,
        coords: [
          { x: 0, y: midY, price: points[0] || 0, time: history[0]?.timestamp },
          { x: viewBoxWidth, y: midY, price: points[0] || 0, time: history[0]?.timestamp }
        ]
      };
    }

    const minP = low;
    const maxP = high;
    const pDiff = maxP - minP || 1.0;
    const pad = pDiff * 0.08;

    const calcY = (val) => {
      const normalized = (val - (minP - pad)) / ((maxP + pad) - (minP - pad));
      return height - 4 - normalized * (height - 8);
    };

    const calculatedCoords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * viewBoxWidth;
      const y = calcY(p);
      return {
        x,
        y,
        price: p,
        time: history[i]?.timestamp
      };
    });

    const dStr = calculatedCoords.reduce(
      (acc, c, i) => (i === 0 ? `M ${c.x.toFixed(1)} ${c.y.toFixed(1)}` : `${acc} L ${c.x.toFixed(1)} ${c.y.toFixed(1)}`),
      ''
    );

    const firstX = calculatedCoords[0].x.toFixed(1);
    const lastX = calculatedCoords[calculatedCoords.length - 1].x.toFixed(1);
    const areaStr = `${dStr} L ${lastX} ${height} L ${firstX} ${height} Z`;

    return { pathD: dStr, areaD: areaStr, coords: calculatedCoords };
  }, [points, high, low, history]);

  // Hover Tooltip Handlers
  const handleMouseMove = (e) => {
    if (!containerRef.current || coords.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, touchX / rect.width));
    const closestIdx = Math.round(ratio * (coords.length - 1));
    setHoverIndex(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const strokeColor = isUp ? '#22C55E' : '#EF4444';
  const gradientId = `sparkline-grad-${stockId}`;

  const activePoint = hoverIndex !== null && coords[hoverIndex] ? coords[hoverIndex] : null;

  const sparkBg = isUp
    ? (isDark ? 'rgba(34,197,94,0.05)' : 'rgba(22,163,74,0.06)')
    : (isDark ? 'rgba(239,68,68,0.05)' : 'rgba(220,38,38,0.06)');

  return (
    <div className="w-full space-y-1.5 my-2">
      {/* 36px Sparkline Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseLeave}
        className="relative w-full h-[36px] border theme-border rounded-lg overflow-hidden cursor-crosshair group transition-colors"
        style={{ backgroundColor: sparkBg }}
      >
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-[#7B82A0] animate-pulse">
            Loading trend...
          </div>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${viewBoxWidth} ${height}`}
              preserveAspectRatio="none"
              className="w-full h-full block"
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area Fill */}
              <path d={areaD} fill={`url(#${gradientId})`} />

              {/* Line Path - 2px Thick */}
              <path
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Active Hover Point Circle */}
              {activePoint && (
                <>
                  <line
                    x1={activePoint.x}
                    y1={0}
                    x2={activePoint.x}
                    y2={height}
                    stroke="#F0F2FF"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                    opacity="0.6"
                  />
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="3.5"
                    fill={strokeColor}
                    stroke="#F0F2FF"
                    strokeWidth="1.5"
                  />
                </>
              )}
            </svg>

            {/* Hover Tooltip Overlay */}
            {activePoint && (
              <div
                className="absolute top-1 z-10 px-2 py-0.5 rounded bg-[#1A1D27] border border-[#2D3142] text-[9.5px] font-mono font-bold text-[#F0F2FF] shadow-lg pointer-events-none transform -translate-x-1/2 whitespace-nowrap"
                style={{
                  left: `${Math.max(15, Math.min(85, (activePoint.x / viewBoxWidth) * 100))}%`
                }}
              >
                <span>{fmtMoney(activePoint.price)} IC</span>
                {activePoint.time && (
                  <span className="text-[#7B82A0] ml-1.5 font-normal">
                    {new Date(activePoint.time).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 15M Rolling Stats Row (HIGH / LOW) */}
      <div className="flex items-center justify-between px-0.5 text-[10px] font-mono theme-text-dim">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-semibold uppercase text-[#7B82A0]">HIGH</span>
          <span className={`text-[14px] font-semibold font-mono ${isDark ? 'text-[#4ADE80]' : 'text-[#16A34A]'}`}>
            {fmtMoney(high)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-semibold uppercase text-[#7B82A0]">LOW</span>
          <span className={`text-[14px] font-semibold font-mono ${isDark ? 'text-[#F87171]' : 'text-[#DC2626]'}`}>
            {fmtMoney(low)}
          </span>
        </div>
      </div>
    </div>
  );
});
