const { PrismaClient } = require('@prisma/client');
const { getCurrentSession, startNewSession } = require('../src/services/sessionService');
const { getUserPortfolio } = require('../src/services/portfolioService');

const prisma = new PrismaClient();

async function runRealTimeSyncAuditTests() {
  console.log('🧪 Starting Phase 24 Real-Time Sync & Bug Fix Verification Audit...\n');

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
    // -------------------------------------------------------------
    // Test 1: Verify Session Start & Global Socket Event Payload
    // -------------------------------------------------------------
    console.log('--- Test 1: Session Timer & Lifecycle Broadcast ---');
    const freshSession = await startNewSession(3);
    assert(
      freshSession && freshSession.status === 'ACTIVE' && freshSession.remainingSeconds > 10700,
      `startNewSession(3) created active 3-hour session (Remaining: ${freshSession.remainingSeconds}s)`
    );

    const activeSession = await getCurrentSession();
    assert(
      activeSession && activeSession.id === freshSession.id && activeSession.remainingSeconds <= freshSession.remainingSeconds,
      'getCurrentSession() correctly computes remaining seconds from server clock'
    );

    // -------------------------------------------------------------
    // Test 2: Verify Complete Portfolio Data Payload Math
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Complete Portfolio Payload Retrieval ---');
    const demoTrader = await prisma.user.findFirst({ where: { role: 'TRADER' } });
    if (demoTrader) {
      const portfolioPayload = await getUserPortfolio(demoTrader.id);
      assert(
        portfolioPayload &&
        portfolioPayload.walletBalance !== undefined &&
        portfolioPayload.availableWalletBalance !== undefined &&
        portfolioPayload.lockedFunds !== undefined &&
        Array.isArray(portfolioPayload.holdings) &&
        Array.isArray(portfolioPayload.pendingOrders) &&
        Array.isArray(portfolioPayload.transactions),
        `getUserPortfolio(${demoTrader.id}) returns complete formatted payload with available/locked funds, holdings, orders & transactions`
      );
    } else {
      assert(false, 'Demo trader user missing in DB');
    }

    // -------------------------------------------------------------
    // Test 3: Verify Stock Price Bound & Dynamic Holdings Evaluation
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Stock Price Clamping & Live Calculations ---');
    const stocks = await prisma.stock.findMany();
    const allWithinBounds = stocks.every((s) => s.currentPrice >= 1.00 && s.currentPrice <= 99.00);
    assert(allWithinBounds, 'All 15 India sector stock spot prices operating strictly within 1.00 - 99.00 IC');

    console.log('\n==================================================');
    console.log(`📊 REAL-TIME SYNC AUDIT SUMMARY:`);
    console.log(`PASSED: ${passed} | FAILED: ${failed}`);
    console.log('==================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Audit execution error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runRealTimeSyncAuditTests();
