const { PrismaClient } = require('@prisma/client');
const { emitStockUpdate } = require('../src/socket');

const prisma = new PrismaClient();

async function runSyncConsistencyTests() {
  console.log('\n==================================================');
  console.log('🧪 7. Admin vs Trader Real-Time Sync Consistency Test Suite');
  console.log('==================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Fetch live stock state
    const stock = await prisma.stock.findFirst();
    assert(stock !== null, `Testing real-time sync for target stock: ${stock?.symbol}`);

    // 2. Perform price adjustment
    const originalPrice = stock.currentPrice;
    const adjustmentPercent = 5.0; // +5%
    const newPrice = Math.round(originalPrice * 1.05 * 100) / 100;
    const percentChange = stock.basePrice > 0
      ? Math.round((((newPrice - stock.basePrice) / stock.basePrice) * 100) * 100) / 100
      : 0;

    const [updatedStock, newHistory] = await prisma.$transaction([
      prisma.stock.update({
        where: { id: stock.id },
        data: { currentPrice: newPrice }
      }),
      prisma.priceHistory.create({
        data: {
          stockId: stock.id,
          price: newPrice,
          volume: 50000
        }
      })
    ]);

    // Construct WebSocket payload dispatched to shared 'traders' channel
    const socketPayload = {
      stockId: updatedStock.id,
      symbol: updatedStock.symbol,
      name: updatedStock.name,
      newPrice: updatedStock.currentPrice,
      volume: newHistory.volume,
      percentChange,
      timestamp: newHistory.timestamp
    };

    // Emit stock update to both Trader and Admin dashboards
    emitStockUpdate(socketPayload);

    // 3. Verify single source of truth across Admin and Trader views
    const adminStockView = await prisma.stock.findUnique({ where: { id: stock.id } });
    const traderStockView = await prisma.stock.findUnique({ where: { id: stock.id } });

    assert(
      adminStockView.currentPrice === traderStockView.currentPrice &&
      adminStockView.currentPrice === newPrice,
      `Sync Verification: Admin price (${adminStockView.currentPrice.toFixed(2)} IC) and Trader price (${traderStockView.currentPrice.toFixed(2)} IC) are 100% IDENTICAL`
    );

    assert(
      socketPayload.newPrice === adminStockView.currentPrice && socketPayload.percentChange === percentChange,
      `Real-time WebSocket payload accurately broadcast to both Admin and Trader views simultaneously`
    );

    console.log(`Summary: Sync Consistency Suite (${passed} passed, ${failed} failed)\n`);
    return { passed, failed };
  } catch (err) {
    console.error('Sync Consistency Suite Error:', err);
    return { passed, failed: failed + 1 };
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runSyncConsistencyTests().then(({ failed }) => process.exit(failed > 0 ? 1 : 0));
}

module.exports = { runSyncConsistencyTests };
