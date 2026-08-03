const { PrismaClient } = require('@prisma/client');
const { emitStockUpdate } = require('../socket');
const config = require('../config/marketConfig');
const { checkAndExecuteLimitOrders } = require('./orderService');
const { checkSessionTimers } = require('./sessionService');
const { randomNormal, combineSectorNoise, calculateGBMPrice, calculateMacroMoveTarget } = require('../utils/quantMath');

const prisma = new PrismaClient();
let tickerInterval = null;

// Persistent state per stock for drift, GARCH volatility, and 3-minute staggered macro moves
const stockStates = new Map();

/**
 * Gets or initializes the quant parameter state for a stock
 */
function getStockState(stockId) {
  if (!stockStates.has(stockId)) {
    const baseDrift = (Math.random() - 0.5) * 0.03;
    const baseVol = 0.10 + Math.random() * 0.10;
    // Staggered offset: each stock gets a random 0 to 180 second cycle offset
    const offsetMs = Math.floor(Math.random() * 180000);

    stockStates.set(stockId, {
      targetDrift: baseDrift,
      currentDrift: baseDrift,
      baseVolatility: baseVol,
      volatility: baseVol,
      newsDriftBonus: 0,
      newsVolBonus: 0,
      lastReturn: 0,
      // Phase 20: 3-Minute Macro Volatility Cycle State
      lastMacroTime: Date.now() - offsetMs,
      cycleOffsetMs: offsetMs,
      macroRampActive: false,
      macroRampStep: 0,
      macroTotalRampSteps: 5, // Smooth 5-tick ramp over 10-15s
      macroStepIncrement: 0
    });
  }
  return stockStates.get(stockId);
}

/**
 * Apply temporary news impact parameters
 */
function applyNewsImpact(sectorList, effectPercent, durationSeconds = 60) {
  const driftShift = (effectPercent / 100) * 0.5;
  const volBoost = Math.min(0.25, Math.abs(effectPercent / 100) * 0.3);

  stockStates.forEach((state) => {
    state.newsDriftBonus += driftShift;
    state.newsVolBonus += volBoost;
  });

  setTimeout(() => {
    stockStates.forEach((state) => {
      state.newsDriftBonus = Math.max(0, state.newsDriftBonus - driftShift);
      state.newsVolBonus = Math.max(0, state.newsVolBonus - volBoost);
    });
  }, durationSeconds * 1000);
}

/**
 * Perform a single background tick using Dual-Layer Quant Market Engine:
 * Layer 1: Continuous 1-2% GBM noise + Volatility Clustering + Sector Correlation
 * Layer 2: Independent 3-Minute Staggered 10-30% Macro Volatility Swings
 */
async function tickMarket() {
  if (!config.TICKER_ENABLED) return;

  try {
    await checkSessionTimers();
    const stocks = await prisma.stock.findMany();
    if (!stocks || stocks.length === 0) return;

    const now = Date.now();

    // 1. Generate shared sector normal noise
    const uniqueSectors = [...new Set(stocks.map((s) => s.sector))];
    const sectorNoises = {};
    uniqueSectors.forEach((sector) => {
      sectorNoises[sector] = randomNormal(0, 1);
    });

    for (const stock of stocks) {
      const state = getStockState(stock.id);

      // Phase 20 Macro Move Trigger Check (Every 180,000ms / 3 minutes per stock)
      const timeSinceLastMacro = now - state.lastMacroTime;
      if (timeSinceLastMacro >= 180000 && !state.macroRampActive) {
        const macroMove = calculateMacroMoveTarget({
          currentPrice: stock.currentPrice,
          basePrice: stock.basePrice
        });

        state.lastMacroTime = now;
        state.macroRampActive = true;
        state.macroRampStep = 0;
        state.macroTotalRampSteps = 5; // 5 ticks ramp (~10-15 seconds)

        const totalDelta = macroMove.targetPrice - stock.currentPrice;
        state.macroStepIncrement = totalDelta / state.macroTotalRampSteps;
      }

      // 2. Layer 1: Continuous GBM Noise calculation
      const stockNoise = randomNormal(0, 1);
      const sectorNoise = sectorNoises[stock.sector] || randomNormal(0, 1);
      const combinedNoise = combineSectorNoise(stockNoise, sectorNoise, 0.50);

      const priceDeviation = stock.basePrice > 0
        ? (stock.currentPrice - stock.basePrice) / stock.basePrice
        : 0;
      const meanReversionPull = -0.08 * priceDeviation;
      const effectiveDrift = state.targetDrift + state.newsDriftBonus + meanReversionPull;

      const absLastReturn = Math.abs(state.lastReturn);
      if (absLastReturn > 0.02) {
        state.volatility = Math.min(0.40, state.volatility + absLastReturn * 0.20);
      } else {
        const targetVol = state.baseVolatility + state.newsVolBonus;
        state.volatility = state.volatility * 0.90 + targetVol * 0.10;
      }

      const dt = 0.008;
      let rawPrice = calculateGBMPrice({
        currentPrice: stock.currentPrice,
        drift: effectiveDrift,
        volatility: state.volatility,
        dt,
        combinedNoise
      });

      // 3. Layer 2: Apply smooth macro ramp increment if active
      if (state.macroRampActive) {
        rawPrice += state.macroStepIncrement;
        state.macroRampStep += 1;
        if (state.macroRampStep >= state.macroTotalRampSteps) {
          state.macroRampActive = false;
        }
      }

      // Clamp price floor to >= 1.00 IC
      const newPrice = Math.max(1.00, Math.round(rawPrice * 100) / 100);

      if (newPrice === stock.currentPrice) continue;

      state.lastReturn = (newPrice - stock.currentPrice) / stock.currentPrice;

      const baseVol = Math.floor(5000 + Math.abs(state.lastReturn) * 120000 + state.volatility * 20000);
      const tickVolume = Math.min(120000, Math.max(3000, baseVol));

      // Update Database
      const [updatedStock, newHistory] = await prisma.$transaction([
        prisma.stock.update({
          where: { id: stock.id },
          data: { currentPrice: newPrice }
        }),
        prisma.priceHistory.create({
          data: {
            stockId: stock.id,
            price: newPrice,
            volume: tickVolume
          }
        })
      ]);

      const percentChange = stock.basePrice > 0
        ? Math.round((((newPrice - stock.basePrice) / stock.basePrice) * 100) * 100) / 100
        : 0;

      // Broadcast live update
      emitStockUpdate({
        stockId: updatedStock.id,
        symbol: updatedStock.symbol,
        name: updatedStock.name,
        newPrice: updatedStock.currentPrice,
        volume: newHistory.volume,
        percentChange,
        timestamp: newHistory.timestamp
      });

      // Hook: Check and execute limit orders
      await checkAndExecuteLimitOrders(stock.id, newPrice);
    }
  } catch (err) {
    console.error('Market ticker error:', err.message);
  }
}

function startMarketTicker() {
  if (tickerInterval) return;
  console.log(`📈 Dual-Layer Quant Market Ticker started (Continuous GBM + 3-Min Staggered 10-30% Macro Swings)`);
  tickerInterval = setInterval(tickMarket, config.TICKER_INTERVAL_MS || config.TICK_INTERVAL_MS);
}

function stopMarketTicker() {
  if (tickerInterval) {
    clearInterval(tickerInterval);
    tickerInterval = null;
    console.log('🛑 Background Market Ticker stopped');
  }
}

module.exports = {
  startMarketTicker,
  stopMarketTicker,
  tickMarket,
  applyNewsImpact,
  getStockState
};
