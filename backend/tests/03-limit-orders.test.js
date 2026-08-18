const { PrismaClient } = require('@prisma/client');
const { getUserAvailableBalance, checkAndExecuteLimitOrders } = require('../src/services/orderService');
const { getUserPortfolio } = require('../src/services/portfolioService');

const prisma = new PrismaClient();

async function runLimitOrdersTests() {
  console.log('\n==================================================');
  console.log('🧪 3. Limit Orders Engine & Locking Test Suite');
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
    // Setup test trader and stock
    const testEmail = `test_trader_orders_${Date.now()}@example.com`;
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('password123', 10);

    const trader = await prisma.user.create({
      data: {
        name: 'Order Test Trader',
        email: testEmail,
        passwordHash: hash,
        role: 'TRADER',
        walletBalance: 20000.00
      }
    });

    const stock = await prisma.stock.findFirst({ where: { currentPrice: { lte: 500 } } });
    assert(stock !== null, `Target stock for limit order: ${stock?.symbol} @ ${stock?.currentPrice.toFixed(2)} IC`);

    // 1. Place Buy Limit Order and verify funds locking
    const targetPrice = Math.round((stock.currentPrice * 0.90) * 100) / 100;
    const orderQty = 10;
    const lockedAmount = Math.round(targetPrice * orderQty * 100) / 100;

    const buyOrder = await prisma.order.create({
      data: {
        userId: trader.id,
        stockId: stock.id,
        type: 'BUY',
        targetPrice,
        quantity: orderQty,
        status: 'PENDING'
      }
    });

    const balanceInfo = await getUserAvailableBalance(trader.id);
    assert(
      balanceInfo.lockedFunds === lockedAmount &&
      balanceInfo.availableBalance === (20000.00 - lockedAmount),
      `Buy Limit Order locks ${lockedAmount.toFixed(2)} IC. Available balance = ${balanceInfo.availableBalance.toFixed(2)} IC`
    );

    // 2. Cancel Order & Verify Funds Released
    await prisma.order.update({
      where: { id: buyOrder.id },
      data: { status: 'CANCELLED' }
    });

    const balanceAfterCancel = await getUserAvailableBalance(trader.id);
    assert(
      balanceAfterCancel.lockedFunds === 0 &&
      balanceAfterCancel.availableBalance === 20000.00,
      `Cancelling Buy Order releases locked funds cleanly. Available balance restored to 20,000.00 IC`
    );

    // 3. Place Triggerable Limit Order & Simulate Price Cross Execution
    const triggerOrder = await prisma.order.create({
      data: {
        userId: trader.id,
        stockId: stock.id,
        type: 'BUY',
        targetPrice: stock.currentPrice + 5.00, // Instantly triggerable
        quantity: 5,
        status: 'PENDING'
      }
    });

    await checkAndExecuteLimitOrders(stock.id, stock.currentPrice);

    const executedOrder = await prisma.order.findUnique({
      where: { id: triggerOrder.id }
    });

    assert(
      executedOrder.status === 'EXECUTED',
      `Automated Limit Order engine triggered and EXECUTED order #${triggerOrder.id.slice(0, 8)} on target price match`
    );

    const traderPortfolio = await getUserPortfolio(trader.id);
    assert(
      traderPortfolio.holdings.length === 1 &&
      traderPortfolio.holdings[0].quantity === 5,
      `Executed Buy Order automatically populated user holdings (5 shares of ${stock.symbol})`
    );

    // Clean up
    await prisma.order.deleteMany({ where: { userId: trader.id } });
    await prisma.holding.deleteMany({ where: { userId: trader.id } });
    await prisma.transaction.deleteMany({ where: { userId: trader.id } });
    await prisma.user.delete({ where: { id: trader.id } });

    console.log(`Summary: Limit Orders Suite (${passed} passed, ${failed} failed)\n`);
    return { passed, failed };
  } catch (err) {
    console.error('Limit Orders Suite Error:', err);
    return { passed, failed: failed + 1 };
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runLimitOrdersTests().then(({ failed }) => process.exit(failed > 0 ? 1 : 0));
}

module.exports = { runLimitOrdersTests };
