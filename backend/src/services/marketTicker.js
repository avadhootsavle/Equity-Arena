const { PrismaClient } = require('@prisma/client');
const { emitStockUpdate, emitStocksBatchUpdate, broadcastPublicLeaderboard } = require('../socket');
const config = require('../config/marketConfig');
const { checkAndExecuteLimitOrders } = require('./orderService');
const { checkSessionTimers } = require('./sessionService');
const { randomNormal, combineSectorNoise, calculateGBMPrice, calculateMacroMoveTarget } = require('../utils/quantMath');

const prisma = new PrismaClient();
let tickerInterval = null;

// Persistent state per stock for drift, GARCH volatility, and Phase 20b/23 15-minute jittered macro moves
const stockStates = new Map();

let baseMacroIntervalMinutes = 15;
let currentVolatilityLevel = 'MEDIUM';
let currentVolatilityDt = 0.008;

function setBaseMacroIntervalMinutes(mins) {
  if (mins && typeof mins === 'number' && mins > 0) {
    baseMacroIntervalMinutes = mins;
  }
}

function setSessionVolatility(level = 'MEDIUM', customPercent = null) {
  currentVolatilityLevel = level || 'MEDIUM';
  if (level === 'LOW') {
    currentVolatilityDt = 0.004;
  } else if (level === 'HIGH') {
    currentVolatilityDt = 0.018;
  } else if (level === 'CUSTOM' && customPercent) {
    const val = parseFloat(customPercent);
    if (!isNaN(val) && val > 0) {
      currentVolatilityDt = Math.max(0.002, Math.min(0.05, (val / 100) * 0.2));
    } else {
      currentVolatilityDt = 0.008;
    }
  } else {
    currentVolatilityDt = 0.008;
  }
}

/**
 * Generates a randomized next macro cycle duration in ms based on baseMacroIntervalMinutes
 * Randomizes within range [0.8 * base, 1.2 * base]
 */
function getNextMacroIntervalMs() {
  const baseMs = baseMacroIntervalMinutes * 60 * 1000;
  const minMs = Math.floor(baseMs * 0.8);
  const maxMs = Math.floor(baseMs * 1.2);
  return Math.floor(minMs + Math.random() * (maxMs - minMs));
}

/**
 * Gets or initializes the quant parameter state for a stock
 */
function getStockState(stockId) {
  if (!stockStates.has(stockId)) {
    const baseDrift = (Math.random() - 0.5) * 0.03;
    const baseVol = 0.10 + Math.random() * 0.10;
    const offsetMs = Math.floor(Math.random() * 900000);
    const now = Date.now();
    const initialStaggerMs = Math.floor(Math.random() * 4000);

    stockStates.set(stockId, {
      targetDrift: baseDrift,
      currentDrift: baseDrift,
      baseVolatility: baseVol,
      volatility: baseVol,
      newsDriftBonus: 0,
      newsVolBonus: 0,
      lastReturn: 0,
      lastMacroTime: now - offsetMs,
      nextMacroIntervalMs: getNextMacroIntervalMs(),
      nextTickTime: now + initialStaggerMs,
      pendingMacroSteer: null,
      macroRampActive: false,
      macroRampStep: 0,
      macroTotalRampSteps: 5,
      macroStepIncrement: 0
    });
  }
  return stockStates.get(stockId);
}

/**
 * Phase 23: Steers upcoming macro moves for target stocks based on news broadcast effects
 * @param {Array<{sector?: string, symbol?: string, effectPercent: number}>} stockEffects
 * @param {number} delaySeconds
 */
async function steerMacroMoveForNews(stockEffects, delaySeconds = 30) {
  try {
    const stocks = await prisma.stock.findMany();
    const now = Date.now();

    for (const effect of stockEffects) {
      const { sector, symbol, effectPercent } = effect;
      const matchingStocks = stocks.filter((s) => 
        (sector && s.sector.toLowerCase().trim() === sector.toLowerCase().trim()) ||
        (symbol && s.symbol.toLowerCase().trim() === symbol.toLowerCase().trim())
      );

      for (const stock of matchingStocks) {
        const state = getStockState(stock.id);
        const minPrice = Math.max(1.00, Math.round((stock.basePrice || stock.currentPrice) * 0.20 * 100) / 100);
        const maxPrice = Math.round((stock.basePrice || stock.currentPrice) * 2.50 * 100) / 100;
        const targetPrice = Math.min(maxPrice, Math.max(minPrice, Math.round(stock.currentPrice * (1 + effectPercent / 100) * 100) / 100));

        state.pendingMacroSteer = {
          targetPrice,
          effectPercent
        };

        // Accelerate next macro move to trigger in delaySeconds
        state.lastMacroTime = now - state.nextMacroIntervalMs + (delaySeconds * 1000);
        // Force next tick to occur within 1-2 seconds
        state.nextTickTime = now + Math.floor(1000 + Math.random() * 1000);
      }
    }
  } catch (err) {
    console.error('Error steering macro move for news:', err);
  }
}

/**
 * Perform market ticks using Dual-Layer Quant Engine:
 * - Staggered & randomized tick timing per stock (stocks update independently at random seconds)
 * @param {boolean} forceAll If true, forces all stocks to tick immediately (useful for tests/resets)
 */
async function tickMarket(forceAll = false) {
  if (!config.TICKER_ENABLED) return;

  try {
    await checkSessionTimers();
    const stocks = await prisma.stock.findMany();
    if (!stocks || stocks.length === 0) return;

    const now = Date.now();
    const timestamp = new Date();

    // 1. Generate shared sector normal noise
    const uniqueSectors = [...new Set(stocks.map((s) => s.sector))];
    const sectorNoises = {};
    uniqueSectors.forEach((sector) => {
      sectorNoises[sector] = randomNormal(0, 1);
    });

    const pendingStockUpdates = [];
    const pendingHistories = [];
    const batchSocketUpdates = [];

    for (const stock of stocks) {
      const state = getStockState(stock.id);

      // Unless forceAll is set, only tick stocks whose randomized nextTickTime has arrived
      if (!forceAll && state.nextTickTime && now < state.nextTickTime) {
        continue;
      }

      // Schedule next tick time for this stock (randomized interval between 1.5s and 5.5s)
      state.nextTickTime = now + Math.floor(1500 + Math.random() * 4000);

      // Phase 20b/23 Macro Move Trigger Check
      const timeSinceLastMacro = now - state.lastMacroTime;
      if (timeSinceLastMacro >= state.nextMacroIntervalMs && !state.macroRampActive) {
        state.lastMacroTime = now;
        state.nextMacroIntervalMs = getNextMacroIntervalMs();

        let targetPrice;
        if (state.pendingMacroSteer) {
          targetPrice = state.pendingMacroSteer.targetPrice;
          state.pendingMacroSteer = null; // Consume news steer
        } else {
          const isSkippedCycle = Math.random() < 0.12;
          if (!isSkippedCycle) {
            const macroMove = calculateMacroMoveTarget({
              currentPrice: stock.currentPrice,
              basePrice: stock.basePrice
            });
            targetPrice = macroMove.targetPrice;
          }
        }

        if (targetPrice !== undefined && targetPrice !== stock.currentPrice) {
          state.macroRampActive = true;
          state.macroRampStep = 0;
          state.macroTotalRampSteps = 5;
          const totalDelta = targetPrice - stock.currentPrice;
          state.macroStepIncrement = totalDelta / state.macroTotalRampSteps;
        }
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

      const minPrice = Math.max(1.00, Math.round((stock.basePrice || stock.currentPrice) * 0.20 * 100) / 100);
      const maxPrice = Math.round((stock.basePrice || stock.currentPrice) * 2.50 * 100) / 100;

      const dt = currentVolatilityDt;
      let rawPrice = calculateGBMPrice({
        currentPrice: stock.currentPrice,
        drift: effectiveDrift,
        volatility: state.volatility,
        dt,
        combinedNoise,
        minPrice,
        maxPrice
      });

      // 3. Layer 2: Apply smooth macro ramp increment if active
      if (state.macroRampActive) {
        rawPrice += state.macroStepIncrement;
        state.macroRampStep += 1;
        if (state.macroRampStep >= state.macroTotalRampSteps) {
          state.macroRampActive = false;
        }
      }

      const newPrice = Math.min(maxPrice, Math.max(minPrice, Math.round(rawPrice * 100) / 100));

      if (newPrice === stock.currentPrice) continue;

      state.lastReturn = (newPrice - stock.currentPrice) / stock.currentPrice;

      const baseVol = Math.floor(5000 + Math.abs(state.lastReturn) * 120000 + state.volatility * 20000);
      const tickVolume = Math.min(120000, Math.max(3000, baseVol));

      const percentChange = stock.basePrice > 0
        ? Math.round((((newPrice - stock.basePrice) / stock.basePrice) * 100) * 100) / 100
        : 0;

      pendingStockUpdates.push(
        prisma.stock.update({
          where: { id: stock.id },
          data: { currentPrice: newPrice }
        })
      );

      pendingHistories.push({
        stockId: stock.id,
        price: newPrice,
        volume: tickVolume,
        timestamp
      });

      batchSocketUpdates.push({
        stockId: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        newPrice,
        volume: tickVolume,
        percentChange,
        timestamp
      });
    }

    if (batchSocketUpdates.length === 0) return;

    // Batched Database Execution (Single Transaction Round-Trip)
    await prisma.$transaction([
      ...pendingStockUpdates,
      prisma.priceHistory.createMany({ data: pendingHistories })
    ]);

    // Batched Socket Broadcast (Single WebSocket Message to Room)
    emitStocksBatchUpdate(batchSocketUpdates);
    broadcastPublicLeaderboard();

    // Also fire individual updates for legacy listeners and limit order execution
    for (const update of batchSocketUpdates) {
      emitStockUpdate(update);
      await checkAndExecuteLimitOrders(update.stockId, update.newPrice);
    }
  } catch (err) {
    console.error('Market ticker error:', err.message);
  }
}

function startMarketTicker() {
  if (tickerInterval) return;
  console.log(`📈 Dual-Layer Quant Market Ticker started (Randomized Independent Stock Ticks)`);
  tickerInterval = setInterval(() => tickMarket(false), 600);
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
  steerMacroMoveForNews,
  getStockState,
  setBaseMacroIntervalMinutes,
  setSessionVolatility
};
