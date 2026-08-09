const { PrismaClient } = require('@prisma/client');
const { getCurrentSession, startNewSession } = require('../src/services/sessionService');
const { setBaseMacroIntervalMinutes } = require('../src/services/marketTicker');

const prisma = new PrismaClient();

async function runConfigurableSessionTests() {
  console.log('🧪 Starting Phase 24 Configurable Session & Trading Lock Verification...\n');

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
    // Test 1: Verify 30-Minute Test Session Creation
    // -------------------------------------------------------------
    console.log('--- Test 1: Configurable 30-Min Session Creation ---');
    const testSession = await startNewSession({
      durationMinutes: 30,
      liquidationBufferMinutes: 2,
      macroCycleIntervalMinutes: 3
    });

    assert(
      testSession &&
      testSession.durationMinutes === 30 &&
      testSession.liquidationBufferMinutes === 2 &&
      testSession.macroCycleIntervalMinutes === 3 &&
      testSession.status === 'ACTIVE',
      `startNewSession created 30-min session with 2-min buffer & 3-min macro cycle (ID: ${testSession.id})`
    );

    const activeSession = await getCurrentSession();
    assert(
      activeSession &&
      activeSession.remainingSeconds <= 1800 &&
      activeSession.remainingSeconds >= 1790 &&
      activeSession.isTradingLocked === false,
      `getCurrentSession() correctly computes ~1800s (30 mins) remaining for active session`
    );

    // -------------------------------------------------------------
    // Test 2: Verify 180-Minute Production Session Defaulting
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Default 180-Min Production Session Creation ---');
    const prodSession = await startNewSession();

    assert(
      prodSession &&
      prodSession.durationMinutes === 180 &&
      prodSession.liquidationBufferMinutes === 5 &&
      prodSession.macroCycleIntervalMinutes === 15 &&
      prodSession.status === 'ACTIVE',
      `startNewSession() defaults cleanly to 180-min session with 5-min buffer & 15-min macro cycle`
    );

    const activeProdSession = await getCurrentSession();
    assert(
      activeProdSession &&
      activeProdSession.remainingSeconds <= 10800 &&
      activeProdSession.remainingSeconds >= 10790,
      `getCurrentSession() computes ~10800s (3 hours) remaining for production session`
    );

    // -------------------------------------------------------------
    // Test 3: Verify Trading Lock Status
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Session End Trading Lock Verification ---');
    await prisma.session.update({
      where: { id: prodSession.id },
      data: { status: 'ENDED' }
    });

    const endedSession = await getCurrentSession();
    assert(
      endedSession.isTradingLocked === true,
      `getCurrentSession() enforces isTradingLocked = true when session status is ENDED or NOT_STARTED`
    );

    console.log('\n==================================================');
    console.log(`📊 PHASE 24 CONFIGURABLE SESSION SUMMARY:`);
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

runConfigurableSessionTests();
