/**
 * Quant Math Utilities for Realistic Stock Market Simulation
 * Box-Muller Normal Distribution, Geometric Brownian Motion (GBM), and Sector Correlation Matrix
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
 * Combined Z = sqrt(1 - rho^2) * Z_stock + rho * Z_sector
 */
function combineSectorNoise(stockNoise, sectorNoise, rho = 0.50) {
  const stockWeight = Math.sqrt(Math.max(0, 1 - Math.pow(rho, 2)));
  return stockWeight * stockNoise + rho * sectorNoise;
}

/**
 * Calculates next tick price using Geometric Brownian Motion (GBM) formula:
 * S_{t+dt} = S_t * exp((drift - 0.5 * volatility^2) * dt + volatility * sqrt(dt) * Z)
 * Calibrated specifically for 5 to 15 IC stock price ranges.
 */
function calculateGBMPrice({ currentPrice, drift, volatility, dt = 0.008, combinedNoise }) {
  if (isNaN(currentPrice) || currentPrice <= 0) return 10.0;
  
  const adjustedVolatility = Math.max(0.05, Math.min(0.50, volatility || 0.15));
  const safeDrift = isNaN(drift) ? 0 : Math.max(-0.10, Math.min(0.10, drift));
  const safeNoise = isNaN(combinedNoise) ? 0 : Math.max(-3.5, Math.min(3.5, combinedNoise));

  const exponent = (safeDrift - 0.5 * Math.pow(adjustedVolatility, 2)) * dt + adjustedVolatility * Math.sqrt(dt) * safeNoise;
  const rawPrice = currentPrice * Math.exp(exponent);

  if (isNaN(rawPrice) || !isFinite(rawPrice)) {
    return currentPrice;
  }

  // Hard floor bound clamp: stock price never drops below 1.00 IC
  return Math.max(1.00, Math.round(rawPrice * 100) / 100);
}

/**
 * Phase 20: Calculates 3-minute Macro Move target (10% to 30% directional move)
 * Direction is weighted by mean reversion pull relative to basePrice
 */
function calculateMacroMoveTarget({ currentPrice, basePrice }) {
  const safeCurrent = Math.max(1.00, currentPrice || 10.0);
  const safeBase = Math.max(1.00, basePrice || 10.0);

  const priceDeviation = (safeCurrent - safeBase) / safeBase;
  const clampDev = Math.max(-1.0, Math.min(1.0, priceDeviation));

  // Base probability of downward move is 50%, weighted up to 80% if stock has run up high
  const pDown = 0.50 + 0.30 * clampDev;
  const isDown = Math.random() < pDown;

  // Magnitude between 10% and 30%
  const magnitude = 0.10 + Math.random() * 0.20;

  const rawTarget = isDown
    ? safeCurrent * (1 - magnitude)
    : safeCurrent * (1 + magnitude);

  const targetPrice = Math.max(1.00, Math.round(rawTarget * 100) / 100);

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
