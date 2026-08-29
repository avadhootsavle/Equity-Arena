import React, { useMemo } from 'react';
import { AnimatedNumber } from './AnimatedNumber';
import { useTheme } from '../context/ThemeContext';

/** Flat sparkline rendered behind a stat value. */
function TileSpark({ values = [], color }) {
  const path = useMemo(() => {
    const nums = values.filter((v) => isFinite(v));
    if (nums.length < 2) return null;

    const lo = Math.min(...nums);
    const hi = Math.max(...nums);
    const range = hi - lo || Math.max(Math.abs(hi) * 0.01, 0.01);
    const w = 100;
    const h = 22;

    return nums
      .map((v, i) => {
        const x = (i / (nums.length - 1)) * w;
        const y = h - ((v - lo) / range) * h;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [values]);

  if (!path) return null;

  return (
    <svg
      viewBox="0 0 100 22"
      preserveAspectRatio="none"
      className="w-full h-[22px] mt-1"
      aria-hidden="true"
    >
      <path
        d={`${path} L100,22 L0,22 Z`}
        fill={color}
        opacity="0.12"
      />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StatTile({
  label,
  value,
  prefix = '',
  suffix = '',
  decimals = 2,
  delta,
  deltaLabel,
  tone = 'neutral', // 'neutral' | 'up' | 'down' | 'gold'
  Icon,
  spark,
  hint
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const color =
    tone === 'up'
      ? isDark ? '#4ADE80' : '#16A34A'
      : tone === 'down'
      ? isDark ? '#F87171' : '#DC2626'
      : tone === 'gold'
      ? isDark ? '#F0B429' : '#D97706'
      : isDark ? '#FFFFFF' : '#1A1D27';

  const isGold = tone === 'gold';

  return (
    <div
      className={`p-4 rounded-xl border flex flex-col justify-between transition-all hover:scale-[1.01] ${
        isDark ? 'border-[#2D3142]' : 'border-[#E2E6F0]'
      }`}
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #1A1D27 0%, #141720 100%)'
          : '#FFFFFF',
        boxShadow: isGold
          ? isDark
            ? '0 4px 20px rgba(240,180,41,0.08)'
            : '0 4px 16px rgba(217,119,6,0.12)'
          : isDark
          ? 'undefined'
          : '0 2px 8px rgba(0,0,0,0.06)'
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-[#7B82A0] dark:text-[#7B82A0]">
          {label}
        </span>
        {Icon && <Icon className="w-[18px] h-[18px] flex-shrink-0 text-[#7B82A0] dark:text-[#64748B]" />}
      </div>

      <div className="mt-3">
        <div
          className={`${
            isGold ? 'text-[28px] font-bold' : 'text-[24px] font-semibold'
          } font-mono leading-none tracking-tight`}
          style={{ color }}
        >
          {typeof value === 'number' ? (
            <AnimatedNumber value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
          ) : (
            <span>
              {prefix}
              {value}
              {suffix}
            </span>
          )}
        </div>

        {(delta != null || hint) && (
          <div className="text-[12px] font-mono mt-2 flex items-center gap-1.5 flex-wrap">
            {delta != null && (
              <span
                style={{
                  color: delta >= 0 ? (isDark ? '#4ADE80' : '#16A34A') : (isDark ? '#F87171' : '#DC2626')
                }}
                className="font-bold"
              >
                {delta >= 0 ? '+' : ''}
                {Number(delta).toFixed(2)}
                {deltaLabel || '%'}
              </span>
            )}
            {hint && <span className="text-[#7B82A0] dark:text-[#7B82A0] truncate">{hint}</span>}
          </div>
        )}
      </div>

      {spark && spark.length > 1 && <TileSpark values={spark} color={color} />}
    </div>
  );
}
