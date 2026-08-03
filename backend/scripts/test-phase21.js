const { PrismaClient } = require('@prisma/client');
const { getCurrentSession, startNewSession, triggerAutoLiquidation } = require('../src/services/sessionService');

const prisma = new PrismaClient();

console.log('🧪 Testing Phase 21 — 3-Hour Session Timer & Auto-Liquidation Engine...\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failCount++;
  }
}

async function runTests() {
  try {
    // Test 1: Retrieve or initialize server-authoritative session
    const session1 = await getCurrentSession();
    assert(
      session1 && session1.id && session1.remainingSeconds > 0,
      `Retrieved server-authoritative session (Remaining: ${session1.remainingSeconds}s)`
    );

    // Test 2: Admin starts a new 3-hour session (prevents overlapping sessions)
    const newSession = await startNewSession(3);
    assert(
      newSession && newSession.status === 'ACTIVE' && newSession.remainingSeconds >= 10790,
      `Admin started new 3-hour session cleanly (Remaining: ${newSession.remainingSeconds}s)`
    );

    // Create dummy stock & trader holding for auto-liquidation test
    const stock = await prisma.stock.findFirst();
    const testUser = await prisma.user.create({
      data: {
        name: 'Liquidation Test Trader',
        email: `liq_${Date.now()}@test.com`,
        passwordHash: 'hashed',
        walletBalance: 10000
      }
    });

    // Create holding & pending limit order for test user
    await prisma.holding.create({
      data: {
        userId: testUser.id,
        stockId: stock.id,
        quantity: 50,
        avgBuyPrice: stock.currentPrice
      }
    });

    await prisma.order.create({
      data: {
        userId: testUser.id,
        stockId: stock.id,
        type: 'BUY',
        targetPrice: 5.0,
        quantity: 10,
        status: 'PENDING'
      }
    });

    // Test 3: Trigger Auto-Liquidation Sweep
    await triggerAutoLiquidation();

    const postLiqUser = await prisma.user.findUnique({ where: { id: testUser.id } });
    const userHoldings = await prisma.holding.findMany({ where: { userId: testUser.id } });
    const userOrders = await prisma.order.findMany({ where: { userId: testUser.id } });

    const expectedBalance = 10000 + (50 * stock.currentPrice);
    assert(
      Math.abs(postLiqUser.walletBalance - expectedBalance) < 0.01,
      `Auto-liquidation credited exact cash proceeds (Expected: ${expectedBalance.toFixed(2)} IC, Observed: ${postLiqUser.walletBalance.toFixed(2)} IC)`
    );
    assert(
      userHoldings.length === 0,
      `All trader holdings were zeroed out post-liquidation`
    );
    assert(
      userOrders.every((o) => o.status === 'CANCELLED'),
      `All pending limit orders were cancelled prior to liquidation sweep`
    );

    // Clean up test user
    await prisma.user.delete({ where: { id: testUser.id } });

    console.log(`\n========================================`);
    console.log(`Phase 21 Test Results: ${passCount} PASSED, ${failCount} FAILED`);
    console.log(`========================================\n`);

    if (failCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
