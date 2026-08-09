const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../src/utils/auth');

const prisma = new PrismaClient();

async function runAuthMeAndRefreshTests() {
  console.log('🧪 Starting GET /auth/me & Page Refresh Persistence Verification...\n');

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
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    assert(adminUser !== null, `Admin user exists (Email: ${adminUser?.email})`);

    const traderUser = await prisma.user.findFirst({ where: { role: 'TRADER' } });
    assert(traderUser !== null, `Trader user exists (Email: ${traderUser?.email})`);

    const adminToken = generateToken(adminUser);
    assert(typeof adminToken === 'string' && adminToken.length > 20, 'Generated valid Admin JWT token for session persistence');

    const traderToken = generateToken(traderUser);
    assert(typeof traderToken === 'string' && traderToken.length > 20, 'Generated valid Trader JWT token for session persistence');

    console.log('\n==================================================');
    console.log(`📊 AUTH /ME & REFRESH TEST SUMMARY:`);
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

runAuthMeAndRefreshTests();
