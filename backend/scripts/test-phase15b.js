const { PrismaClient } = require('@prisma/client');
const { tickMarket, getStockState } = require('../src/services/marketTicker');

const prisma = new PrismaClient();

async function runPhase15bTests() {
  console.log('\n================================================================');
  console.log('🧪 STARTING PHASE 15B TICK SIMULATION & GRAPH INTEGRITY SUITE');
  console.log('================================================================\n');

  // 1. Verify Database Seed Starting Prices (Must be between 5 and 15 IC)
  const stocks = await prisma.stock.findMany();
  console.log(`Found ${stocks.length} stocks in database.`);

  if (stocks.length !== 15) {
    throw new Error(`Expected 15 stocks, found ${stocks.length}`);
  }

  for (const s of stocks) {
    console.log(`  Stock ${s.symbol} (${s.name}) -> Current: ${s.currentPrice.toFixed(2)} IC | Base: ${s.basePrice.toFixed(2)} IC`);
    if (s.basePrice < 5.0 || s.basePrice > 15.0) {
      throw new Error(`Stock ${s.symbol} base price ${s.basePrice} is outside 5-15 IC range`);
    }
  }
  console.log('✅ All 15 stocks confirmed to start strictly between 5 and 15 IC!');

  // 2. Simulate 30 Ticks Across All Stocks
  console.log('\n--- Simulating 30 Ticks Across All Stocks ---');
  
  const tickLog = [];

  for (let i = 1; i <= 30; i++) {
    await tickMarket();
    const updatedStocks = await prisma.stock.findMany();
    
    for (const u of updatedStocks) {
      if (isNaN(u.currentPrice) || !isFinite(u.currentPrice) || u.currentPrice <= 0) {
        throw new Error(`Invalid price for ${u.symbol}: ${u.currentPrice}`);
      }
    }
  }

  // 3. Verify Price Bounds & Plausible Increments
  const finalStocks = await prisma.stock.findMany({
    include: {
      priceHistories: {
        orderBy: { timestamp: 'desc' },
        take: 30
      }
    }
  });

  console.log('\n--- 30-Tick Simulation Results per Stock ---');
  for (const stock of finalStocks) {
    const prices = stock.priceHistories.map((p) => p.price);
    const startPrice = prices[prices.length - 1];
    const endPrice = prices[0];

    // Check max single tick delta
    let maxSingleTickDelta = 0;
    for (let i = 0; i < prices.length - 1; i++) {
      const delta = Math.abs(prices[i] - prices[i + 1]);
      if (delta > maxSingleTickDelta) maxSingleTickDelta = delta;
    }

    console.log(`  ${stock.symbol} (${stock.sector}): Start: ${startPrice.toFixed(2)} IC -> End: ${endPrice.toFixed(2)} IC | Max Single Tick Delta: ${maxSingleTickDelta.toFixed(2)} IC`);

    if (maxSingleTickDelta > 1.50) {
      throw new Error(`Unrealistic single tick jump of ${maxSingleTickDelta.toFixed(2)} IC detected for ${stock.symbol}`);
    }
  }
  console.log('✅ All tick moves confirmed small, smooth, and plausible for 5-15 IC stocks!');

  await prisma.$disconnect();

  console.log('\n================================================================');
  console.log('🎉 ALL PHASE 15B GRAPH & FLUCTUATION TESTS PASSED CLEANLY!');
  console.log('================================================================\n');
}

runPhase15bTests().catch((err) => {
  console.error('❌ Phase 15b test failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
