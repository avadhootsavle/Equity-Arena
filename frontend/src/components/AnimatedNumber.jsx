import React, { useState, useEffect, useRef } from 'react';

/**
 * AnimatedNumber component that counts up or down smoothly when the `value` prop changes.
 * Uses requestAnimationFrame over `duration` ms.
 */
export function AnimatedNumber({
  value,
  decimals = 2,
  prefix = '',
  suffix = '',
  className = '',
  duration = 350
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const animationRef = useRef(null);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = Number(value);

    if (startValue === endValue) return;

    const startTime = performance.now();

    const updateNumber = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const easedProgress = progress * (2 - progress);

      const currentValue = startValue + (endValue - startValue) * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(updateNumber);
      } else {
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(updateNumber);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [value, duration]);

  const numVal = typeof displayValue === 'number' && !isNaN(displayValue) ? displayValue : Number(value) || 0;

  return (
    <span className={`font-mono inline-block transition-colors ${className}`}>
      {prefix}
      {numVal.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })}
      {suffix}
    </span>
  );
}
