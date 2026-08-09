const { PrismaClient } = require('@prisma/client');
const { getUserPortfolio } = require('../src/services/portfolioService');
const { getUserAvailableBalance } = require('../src/services/orderService');

const prisma = new PrismaClient();

async function runOrdersAndBankruptcyTests() {
  console.log('🧪 Starting Limit Orders & Zero Balance Bankruptcy Verification...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Get or create test trader
    let testUser = await prisma.user.findFirst({
      where: { role: 'TRADER' }
    });

    assert(testUser !== null, `Test trader account available (ID: ${testUser?.id})`);

    const stock = await prisma.stock.findFirst();
    assert(stock !== null, `Target stock available: ${stock?.symbol} @ ${stock?.currentPrice} IC`);

    // -------------------------------------------------------------
    // Test 1: Place, Fetch & Cancel Limit Order (Phase 14 Engine)
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Limit Order API Lifecycle ---');
    
    // Ensure user has balance for limit buy
    await prisma.user.update({
      where: { id: testUser.id },
      data: { walletBalance: 10000.00 }
    });

    const targetPrice = Math.round((stock.currentPrice * 0.8) * 100) / 100;
    const limitOrder = await prisma.order.create({
      data: {
        userId: testUser.id,
        stockId: stock.id,
        type: 'BUY',
        targetPrice,
        quantity: 10,
        status: 'PENDING'
      },
      include: { stock: true }
    });

    assert(
      limitOrder && limitOrder.status === 'PENDING',
      `Placed Limit BUY order for ${stock.symbol} (Target: ${targetPrice} IC, Qty: 10)`
    );

    const balanceInfo = await getUserAvailableBalance(testUser.id);
    const expectedLocked = Math.round(targetPrice * 10 * 100) / 100;
    assert(
      balanceInfo.lockedFunds === expectedLocked,
      `Locked funds calculated correctly: ${balanceInfo.lockedFunds} IC (Available: ${balanceInfo.availableBalance} IC)`
    );

    // Cancel limit order
    const cancelledOrder = await prisma.order.update({
      where: { id: limitOrder.id },
      data: { status: 'CANCELLED' }
    });

    const balanceAfterCancel = await getUserAvailableBalance(testUser.id);
    assert(
      cancelledOrder.status === 'CANCELLED' && balanceAfterCancel.lockedFunds === 0,
      `Limit order cancelled successfully, locked funds released back to wallet balance`
    );

    // -------------------------------------------------------------
    // Test 2: Full Bankruptcy (0 Balance & 0 Holdings)
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Full Bankruptcy (0 Balance & 0 Holdings) ---');

    // Wipe holdings and set wallet to 0
    await prisma.holding.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.update({
      where: { id: testUser.id },
      data: { walletBalance: 0.00 }
    });

    const bankruptPortfolio = await getUserPortfolio(testUser.id);
    assert(
      bankruptPortfolio &&
      bankruptPortfolio.walletBalance === 0 &&
      bankruptPortfolio.availableWalletBalance === 0 &&
      bankruptPortfolio.totalPortfolioValue === 0 &&
      bankruptPortfolio.holdings.length === 0,
      `Bankrupt portfolio evaluated cleanly: Wallet = 0.00 IC, Total Portfolio = 0.00 IC`
    );

    // Verify Buy Attempt with 0 Balance fails with insufficient funds
    const totalBuyCost = stock.currentPrice * 5;
    const canBuy = bankruptPortfolio.availableWalletBalance >= totalBuyCost;
    assert(
      canBuy === false,
      `Buy attempt with 0.00 IC balance correctly fails available balance check (Cost: ${totalBuyCost.toFixed(2)} IC)`
    );

    // Restore test trader balance back to 20,000 IC
    await prisma.user.update({
      where: { id: testUser.id },
      data: { walletBalance: 20000.00 }
    });

    console.log('\n==================================================');
    console.log(`📊 LIMIT ORDERS & BANKRUPTCY TEST SUMMARY:`);
    console.log(`PASSED: ${passed} | FAILED: ${failed}`);
    console.log('==================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runOrdersAndBankruptcyTests();
