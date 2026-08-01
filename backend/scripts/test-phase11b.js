const { server } = require('../src/index');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../src/utils/auth');

const prisma = new PrismaClient();
const PORT = 5045;
const BASE_URL = `http://localhost:${PORT}`;

async function runPhase11bTests() {
  console.log('\n================================================================');
  console.log('🧪 STARTING PHASE 11B HIDDEN ADMIN TRIGGER & SECURITY TEST');
  console.log('================================================================\n');

  await new Promise((r) => server.listen(PORT, r));
  console.log(`✅ Server listening on ${BASE_URL}`);

  try {
    // 1. Verify Registration Hard-codes TRADER Role
    console.log('\n--- 1. Testing Registration Hard-coded TRADER Role Guard ---');
    const sneakyRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sneaky User 11b',
        email: `sneaky11b_${Date.now()}@test.com`,
        password: 'password123',
        role: 'ADMIN' // Attempt payload injection
      })
    });
    const sneakyRegData = await sneakyRegRes.json();
    console.log('Registered User Role:', sneakyRegData.user.role);

    if (sneakyRegData.user.role !== 'TRADER') {
      throw new Error(`CRITICAL SECURITY BUG: Registration allowed elevation to ${sneakyRegData.user.role}!`);
    }
    console.log('✅ Registration hard-coding verified! Role payload injection prevented.');

    // 2. Test Admin Login Endpoint (POST /auth/admin/login)
    console.log('\n--- 2. Testing Hardened Admin Login Endpoint & 2-Hour JWT ---');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'admin123' })
    });
    const adminLoginData = await adminLoginRes.json();

    if (!adminLoginData.token || adminLoginData.user.role !== 'ADMIN') {
      throw new Error('Admin login endpoint failed');
    }

    const decoded = jwt.verify(adminLoginData.token, JWT_SECRET);
    const duration = decoded.exp - decoded.iat;
    console.log(`Admin Token Duration: ${duration} seconds (${duration / 3600} hours)`);

    if (duration !== 7200) {
      throw new Error(`Expected 2-hour JWT (7200s), got ${duration}s`);
    }
    console.log('✅ Hardened Admin Login & 2-hour session lifetime verified!');

    // 3. Test Generic Server-Side 403 Guard for Traders
    console.log('\n--- 3. Testing Generic Server-Side 403 Forbidden Guard ---');
    const forbiddenRes = await fetch(`${BASE_URL}/admin/stock/some-id/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sneakyRegData.token}`
      },
      body: JSON.stringify({ percent: 10 })
    });
    const forbiddenData = await forbiddenRes.json();
    console.log('Forbidden Response:', forbiddenData);

    if (forbiddenRes.status !== 403 || forbiddenData.error !== 'Forbidden') {
      throw new Error('Server-side role guard failed to return generic 403 Forbidden');
    }
    console.log('✅ Generic server-side 403 Forbidden role guard verified!');

    server.close();
    await prisma.$disconnect();

    console.log('\n================================================================');
    console.log('🎉 ALL PHASE 11B HIDDEN TRIGGER & SECURITY TESTS PASSED!');
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Phase 11b test failed:', err);
    server.close();
    await prisma.$disconnect();
    process.exit(1);
  }
}

runPhase11bTests();
