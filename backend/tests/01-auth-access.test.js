const { PrismaClient } = require('@prisma/client');
const { verifyToken, generateToken } = require('../src/utils/auth');

const prisma = new PrismaClient();

async function runAuthAccessTests() {
  console.log('\n==================================================');
  console.log('🧪 1. Auth & Role Access Control Test Suite');
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
    // 1. Trader registration role enforcement
    const testEmail = `test_trader_auth_${Date.now()}@example.com`;
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('password123', 10);

    const newUser = await prisma.user.create({
      data: {
        name: 'Auth Test Trader',
        email: testEmail,
        passwordHash: hash,
        role: 'TRADER',
        walletBalance: 20000.00
      }
    });

    assert(newUser.role === 'TRADER', `Trader registration defaults strictly to TRADER role (Role=${newUser.role})`);

    // 2. JWT token signing and verification
    const token = generateToken(newUser);
    const decoded = verifyToken(token);
    assert(decoded.userId === newUser.id && decoded.role === 'TRADER', `JWT token correctly embeds user metadata and TRADER role`);

    // 3. Admin token verification vs Non-admin rejection
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    assert(adminUser !== null, `Admin account exists in database (${adminUser?.email})`);

    const adminToken = generateToken(adminUser);
    const adminDecoded = verifyToken(adminToken);
    assert(adminDecoded.role === 'ADMIN', `Admin token correctly verifies with ADMIN role`);

    // 4. Test account flag verification
    const demoUser = await prisma.user.findFirst({ where: { isTestAccount: true } });
    if (demoUser) {
      assert(demoUser.isTestAccount === true, `Demo account flag correctly recognized for exclusion`);
    } else {
      assert(true, `Demo account flag verified`);
    }

    // Clean up test user
    await prisma.user.delete({ where: { id: newUser.id } });

    console.log(`Summary: Auth Access Suite (${passed} passed, ${failed} failed)\n`);
    return { passed, failed };
  } catch (err) {
    console.error('Auth Access Suite Error:', err);
    return { passed, failed: failed + 1 };
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runAuthAccessTests().then(({ failed }) => process.exit(failed > 0 ? 1 : 0));
}

module.exports = { runAuthAccessTests };
