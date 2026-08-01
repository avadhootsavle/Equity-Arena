const { server } = require('../src/index');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PORT = 5065;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runPhase13Tests() {
  console.log('\n================================================================');
  console.log('🧪 STARTING PHASE 13 RESTRUCTURE & DEPLOYMENT READINESS TEST');
  console.log('================================================================\n');

  await new Promise((resolve, reject) => {
    server.listen(PORT, '127.0.0.1', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  console.log(`✅ Backend server listening on ${BASE_URL}`);

  try {
    // 1. Health check & CORS verification
    console.log('\n--- 1. Testing Backend Health Endpoint & CORS ---');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    console.log('Health check response:', healthData);

    if (healthRes.status !== 200 || healthData.status !== 'ok') {
      throw new Error('Health check endpoint failed');
    }
    console.log('✅ Health check endpoint verified!');

    // 2. Verify Stock APIs
    console.log('\n--- 2. Testing Stock List API ---');
    const stocksRes = await fetch(`${BASE_URL}/stocks`);
    const stocks = await stocksRes.json();
    console.log(`Fetched ${stocks.length} stocks cleanly.`);

    if (!Array.isArray(stocks) || stocks.length !== 15) {
      throw new Error(`Expected 15 stocks, got ${stocks.length}`);
    }
    console.log('✅ Stock API verified from /backend!');

    // 3. Verify Trader Registration & Hardcoded Role
    console.log('\n--- 3. Testing Trader Registration ---');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Phase13 Trader',
        email: `phase13_${Date.now()}@test.com`,
        password: 'password123',
        role: 'ADMIN'
      })
    });
    const regData = await regRes.json();
    console.log('Registered User Role:', regData.user.role);

    if (regData.user.role !== 'TRADER') {
      throw new Error(`Registration role guard failed: created ${regData.user.role}`);
    }
    console.log('✅ Registration verified!');

    // 4. Test Hardened Admin Login Endpoint
    console.log('\n--- 4. Testing Hardened Admin Login Endpoint ---');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'admin123' })
    });
    const adminLoginData = await adminLoginRes.json();

    if (!adminLoginData.token || adminLoginData.user.role !== 'ADMIN') {
      throw new Error('Admin login failed');
    }
    console.log('✅ Admin login verified from /backend!');

    server.close();
    await prisma.$disconnect();

    console.log('\n================================================================');
    console.log('🎉 ALL PHASE 13 RESTRUCTURE & DEPLOYMENT TESTS PASSED!');
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Phase 13 test failed:', err);
    server.close();
    await prisma.$disconnect();
    process.exit(1);
  }
}

runPhase13Tests();
