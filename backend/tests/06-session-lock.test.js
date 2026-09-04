const { PrismaClient } = require('@prisma/client');
const { getCurrentSession, startNewSession, triggerAutoLiquidation } = require('../src/services/sessionService');

const prisma = new PrismaClient();

async function runSessionLockTests() {
  console.log('\n==================================================');
  console.log('🧪 6. Admin Session & Trading Lock Test Suite');
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
    // 1. Start Configurable Session (e.g. 180 mins, 5 min buffer)
    const durationMinutes = 180;
    const session = await startNewSession({
      durationMinutes,
      liquidationBufferMinutes: 5,
      macroCycleIntervalMinutes: 15,
      force: true
    });

    assert(session !== null && session.status === 'ACTIVE', `Session created cleanly with status ACTIVE`);

    const now = new Date();
    const expectedEndTime = new Date(session.startTime.getTime() + durationMinutes * 60 * 1000);
    const timeDiffSeconds = Math.abs(Math.round((session.endTime.getTime() - expectedEndTime.getTime()) / 1000));

    assert(timeDiffSeconds <= 2, `Session end timestamp correctly calculated for ${durationMinutes}-minute duration`);

    // 2. Trading Lock State Assertion
    const activeData = await getCurrentSession();
    assert(
      activeData.status === 'ACTIVE' && activeData.isTradingLocked === false,
      `Trading permitted when session is ACTIVE (isTradingLocked = false)`
    );

    // 3. Auto-Liquidation Sweep Execution
    const testEmail = `test_trader_liq_${Date.now()}@example.com`;
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('password123', 10);

    const trader = await prisma.user.create({
      data: {
        name: 'Liquidation Test Trader',
        email: testEmail,
        passwordHash: hash,
        role: 'TRADER',
        walletBalance: 10000.00
      }
    });

    const stock = await prisma.stock.findFirst();

    // Create position and pending order
    await prisma.holding.create({
      data: {
        userId: trader.id,
        stockId: stock.id,
        quantity: 20,
        avgBuyPrice: stock.currentPrice
      }
    });

    await prisma.order.create({
      data: {
        userId: trader.id,
        stockId: stock.id,
        type: 'BUY',
        targetPrice: stock.currentPrice * 0.9,
        quantity: 5,
        status: 'PENDING'
      }
    });

    // Execute liquidation sweep
    await triggerAutoLiquidation();

    const holdingsAfterSweep = await prisma.holding.findMany({ where: { userId: trader.id } });
    const ordersAfterSweep = await prisma.order.findMany({ where: { userId: trader.id, status: 'PENDING' } });
    const traderAfterSweep = await prisma.user.findUnique({ where: { id: trader.id } });

    assert(
      holdingsAfterSweep.length === 0 && ordersAfterSweep.length === 0,
      `Auto-liquidation sweep cleanly converted all holdings to cash and cancelled pending orders`
    );

    assert(
      traderAfterSweep.walletBalance > 10000.00,
      `Trader wallet credited proceeds from liquidated shares (${traderAfterSweep.walletBalance.toFixed(2)} IC)`
    );

    // Clean up
    await prisma.transaction.deleteMany({ where: { userId: trader.id } });
    await prisma.user.delete({ where: { id: trader.id } });
    if (testSession?.id) {
      await prisma.session.deleteMany({ where: { id: testSession.id } });
    }

    console.log(`Summary: Session Lock Suite (${passed} passed, ${failed} failed)\n`);
    return { passed, failed };
  } catch (err) {
    console.error('Session Lock Suite Error:', err);
    return { passed, failed: failed + 1 };
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runSessionLockTests().then(({ failed }) => process.exit(failed > 0 ? 1 : 0));
}

module.exports = { runSessionLockTests };
