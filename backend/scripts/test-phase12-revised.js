const { server } = require('../src/index');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../src/utils/auth');

const prisma = new PrismaClient();
const PORT = 5055;
const BASE_URL = `http://localhost:${PORT}`;

async function runPhase12RevisedTests() {
  console.log('\n================================================================');
  console.log('🧪 STARTING PHASE 12 REVISED FULL CHECK & BUG REGRESSION TEST');
  console.log('================================================================\n');

  await new Promise((r) => server.listen(PORT, r));
  console.log(`✅ Server listening on ${BASE_URL}`);

  try {
    // 1. Verify Stocks API
    console.log('\n--- 1. Testing Backend Stock APIs ---');
    const stocksRes = await fetch(`${BASE_URL}/stocks`);
    const stocks = await stocksRes.json();
    console.log(`Fetched ${stocks.length} stocks cleanly.`);

    if (!Array.isArray(stocks) || stocks.length !== 15) {
      throw new Error(`Expected 15 stocks, got ${stocks.length}`);
    }
    console.log('✅ Stock API verified!');

    // 2. Verify Registration Hard-coded TRADER Role Guard
    console.log('\n--- 2. Testing Registration Role Guard ---');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Phase12 Trader',
        email: `phase12_${Date.now()}@test.com`,
        password: 'password123',
        role: 'ADMIN' // Attempt payload injection
      })
    });
    const regData = await regRes.json();
    console.log('Registered User Role:', regData.user.role);

    if (regData.user.role !== 'TRADER') {
      throw new Error(`Registration role guard failed: created ${regData.user.role}`);
    }
    console.log('✅ Registration hard-coding intact!');

    // 3. Test Trade Buy & Sell Order Execution (No null dereferences)
    console.log('\n--- 3. Testing Trade Buy & Sell Execution ---');
    const buyRes = await fetch(`${BASE_URL}/trade/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${regData.token}`
      },
      body: JSON.stringify({ stockId: stocks[0].id, quantity: 10 })
    });
    const buyData = await buyRes.json();

    if (!buyData.portfolio || buyData.portfolio.holdings.length !== 1) {
      throw new Error('Trade buy execution failed');
    }
    console.log(`Buy order executed cleanly! Wallet balance: ${buyData.portfolio.walletBalance} IC`);

    // Wait 500ms to respect per-user 400ms trade rate limit
    await new Promise((r) => setTimeout(r, 500));

    const sellRes = await fetch(`${BASE_URL}/trade/sell`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${regData.token}`
      },
      body: JSON.stringify({ stockId: stocks[0].id, quantity: 5 })
    });
    const sellData = await sellRes.json();

    const targetHolding = sellData.portfolio?.holdings?.find(h => h.stockId === stocks[0].id);

    if (!targetHolding || targetHolding.quantity !== 5) {
      throw new Error('Trade sell execution failed');
    }
    console.log(`Sell order executed cleanly! Remaining shares: ${targetHolding.quantity}`);
    console.log('✅ Trade Buy & Sell execution verified!');

    // 4. Test Hardened Admin Login & 2-Hour JWT Lifetime
    console.log('\n--- 4. Testing Hardened Admin Login & 2-Hour JWT ---');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'admin123' })
    });
    const adminLoginData = await adminLoginRes.json();

    if (!adminLoginData.token || adminLoginData.user.role !== 'ADMIN') {
      throw new Error('Admin login failed');
    }

    const decoded = jwt.verify(adminLoginData.token, JWT_SECRET);
    const duration = decoded.exp - decoded.iat;
    console.log(`Admin Token Duration: ${duration} seconds (${duration / 3600} hours)`);

    if (duration !== 7200) {
      throw new Error(`Expected 2-hour JWT (7200s), got ${duration}s`);
    }
    console.log('✅ Admin login and 2-hour JWT lifetime intact!');

    // 5. Test Generic Server-Side 403 Guard for Non-Admins
    console.log('\n--- 5. Testing Generic Server-Side 403 Guard ---');
    const forbiddenRes = await fetch(`${BASE_URL}/admin/stock/${stocks[0].id}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${regData.token}`
      },
      body: JSON.stringify({ percent: 10 })
    });
    const forbiddenData = await forbiddenRes.json();

    if (forbiddenRes.status !== 403 || forbiddenData.error !== 'Forbidden') {
      throw new Error('Server-side role guard failed to return generic 403 Forbidden');
    }
    console.log('✅ Generic server-side 403 Forbidden role guard intact!');

    server.close();
    await prisma.$disconnect();

    console.log('\n================================================================');
    console.log('🎉 ALL PHASE 12 REVISED TESTS PASSED CLEANLY!');
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Phase 12 test failed:', err);
    server.close();
    await prisma.$disconnect();
    process.exit(1);
  }
}

runPhase12RevisedTests();
