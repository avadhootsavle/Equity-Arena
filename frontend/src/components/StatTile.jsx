import React, { useMemo } from 'react';
import { AnimatedNumber } from './AnimatedNumber';

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
  const color =
    tone === 'up'
      ? 'var(--gain-green)'
      : tone === 'down'
      ? 'var(--loss-red)'
      : tone === 'gold'
      ? 'var(--accent)'
      : 'var(--text-main)';

  return (
    <div
      className="surface px-4 py-4 flex flex-col justify-between transition-colors hover:theme-bg-card-hover"
      style={{ boxShadow: 'var(--card-shadow)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-mono uppercase tracking-[0.12em] theme-text-dim">
          {label}
        </span>
        {Icon && <Icon className="w-[18px] h-[18px] flex-shrink-0" style={{ color }} />}
      </div>

      <div className="mt-2.5">
        <div
          className="text-[26px] font-mono font-extrabold leading-none tracking-tight"
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
                  color: delta >= 0 ? 'var(--gain-green)' : 'var(--loss-red)'
                }}
                className="font-bold"
              >
                {delta >= 0 ? '+' : ''}
                {Number(delta).toFixed(2)}
                {deltaLabel || '%'}
              </span>
            )}
            {hint && <span className="theme-text-dim truncate">{hint}</span>}
          </div>
        )}
      </div>

      {spark && spark.length > 1 && <TileSpark values={spark} color={color} />}
    </div>
  );
}
