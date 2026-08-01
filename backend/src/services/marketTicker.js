const { PrismaClient } = require('@prisma/client');
const { emitStockUpdate } = require('../socket');
const config = require('../config/marketConfig');

const prisma = new PrismaClient();
let tickerInterval = null;

function getRandomVolume(min = 5000, max = 15000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Perform a single background tick: apply random small fluctuation to all stocks with volume
 */
async function tickMarket() {
  if (!config.TICKER_ENABLED) return;

  try {
    const stocks = await prisma.stock.findMany();
    if (!stocks || stocks.length === 0) return;

    for (const stock of stocks) {
      const deltaPercent = Math.random() * (config.MAX_FLUCTUATION_PERCENT - config.MIN_FLUCTUATION_PERCENT) + config.MIN_FLUCTUATION_PERCENT;
      const roundedDelta = Math.round(deltaPercent * 100) / 100;

      if (roundedDelta === 0) continue;

      const rawNewPrice = stock.currentPrice * (1 + roundedDelta / 100);
      const newPrice = Math.max(0.01, Math.round(rawNewPrice * 100) / 100);
      const tickVolume = getRandomVolume(5000, 15000);

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

      emitStockUpdate({
        stockId: updatedStock.id,
        symbol: updatedStock.symbol,
        name: updatedStock.name,
        newPrice: updatedStock.currentPrice,
        volume: newHistory.volume,
        percentChange,
        timestamp: newHistory.timestamp
      });
    }
  } catch (err) {
    console.error('Market ticker error:', err.message);
  }
}

function startMarketTicker() {
  if (tickerInterval) return;
  console.log(`📈 Background Market Ticker started (Ticking every ${config.TICK_INTERVAL_MS / 1000}s, Volume: 5k-15k)`);
  tickerInterval = setInterval(tickMarket, config.TICK_INTERVAL_MS);
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
  tickMarket
};
