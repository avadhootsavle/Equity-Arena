/**
 * Quant Math Utilities for Realistic Stock Market Simulation
 * Box-Muller Normal Distribution, Geometric Brownian Motion (GBM), and Sector Correlation Matrix
 * Phase 20b: 40-80 IC Range, 99 IC Hard Ceiling, Dynamic Macro Magnitudes
 */

/**
 * Box-Muller Transform: Generates a standard normal random variable Z ~ N(mean, stdDev^2)
 */
function randomNormal(mean = 0, stdDev = 1) {
  let u1 = Math.random();
  let u2 = Math.random();
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/**
 * Combines stock-specific normal noise with sector-wide normal noise using correlation coefficient rho
 */
function combineSectorNoise(stockNoise, sectorNoise, rho = 0.50) {
  const stockWeight = Math.sqrt(Math.max(0, 1 - Math.pow(rho, 2)));
  return stockWeight * stockNoise + rho * sectorNoise;
}

/**
 * Calculates next tick price using Geometric Brownian Motion (GBM) formula:
 * S_{t+dt} = S_t * exp((drift - 0.5 * volatility^2) * dt + volatility * sqrt(dt) * Z)
 * Calibrated for 40 to 80 IC starting range with a strict 99 IC ceiling.
 */
function calculateGBMPrice({ currentPrice, drift, volatility, dt = 0.008, combinedNoise }) {
  if (isNaN(currentPrice) || currentPrice <= 0) return 60.0;
  
  const adjustedVolatility = Math.max(0.05, Math.min(0.50, volatility || 0.15));
  const safeDrift = isNaN(drift) ? 0 : Math.max(-0.10, Math.min(0.10, drift));
  const safeNoise = isNaN(combinedNoise) ? 0 : Math.max(-3.5, Math.min(3.5, combinedNoise));

  const exponent = (safeDrift - 0.5 * Math.pow(adjustedVolatility, 2)) * dt + adjustedVolatility * Math.sqrt(dt) * safeNoise;
  const rawPrice = currentPrice * Math.exp(exponent);

  if (isNaN(rawPrice) || !isFinite(rawPrice)) {
    return currentPrice;
  }

  // Hard ceiling at 99.00 IC, floor at 1.00 IC
  const clampedPrice = Math.min(99.00, Math.max(1.00, rawPrice));
  return Math.round(clampedPrice * 100) / 100;
}

/**
 * Phase 20b: Calculates Macro Move target (10% to 30% directional move)
 * Direction is weighted by mean reversion pull relative to basePrice
 * Capped strictly at 99.00 IC max.
 */
function calculateMacroMoveTarget({ currentPrice, basePrice }) {
  const safeCurrent = Math.min(99.00, Math.max(1.00, currentPrice || 60.0));
  const safeBase = Math.min(99.00, Math.max(1.00, basePrice || 60.0));

  const priceDeviation = (safeCurrent - safeBase) / safeBase;
  const clampDev = Math.max(-1.0, Math.min(1.0, priceDeviation));

  // Base probability of downward move is 50%, weighted up to 85% if stock has run up near ceiling (e.g. > 80 IC)
  let pDown = 0.50 + 0.35 * clampDev;
  if (safeCurrent >= 85) {
    pDown = 0.90; // Extremely high downward pull near 99 IC ceiling
  }

  const isDown = Math.random() < pDown;

  // Freshly randomized magnitude between 10% and 30% per cycle
  const magnitude = 0.10 + Math.random() * 0.20;

  let rawTarget = isDown
    ? safeCurrent * (1 - magnitude)
    : safeCurrent * (1 + magnitude);

  // Strict clamp at 99.00 IC max and 1.00 IC floor
  rawTarget = Math.min(99.00, Math.max(1.00, rawTarget));
  const targetPrice = Math.round(rawTarget * 100) / 100;

  return {
    isDown,
    magnitude: Math.round(magnitude * 100) / 100,
    targetPrice
  };
}

module.exports = {
  randomNormal,
  combineSectorNoise,
  calculateGBMPrice,
  calculateMacroMoveTarget
};
