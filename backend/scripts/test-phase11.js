const { server } = require('../src/index');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../src/utils/auth');

const prisma = new PrismaClient();
const PORT = 5040;
const BASE_URL = `http://localhost:${PORT}`;

async function runPhase11Tests() {
  console.log('\n================================================================');
  console.log('🧪 STARTING PHASE 11 HIDE ADMIN LOGIN & SECURITY AUDIT TEST');
  console.log('================================================================\n');

  await new Promise((r) => server.listen(PORT, r));
  console.log(`✅ Server listening on ${BASE_URL}`);

  try {
    // 1. Verify Registration Hard-codes TRADER Role Server-Side
    console.log('\n--- 1. Testing Registration Hard-coded TRADER Role Guard ---');
    const sneakyRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sneaky User',
        email: `sneaky_${Date.now()}@test.com`,
        password: 'password123',
        role: 'ADMIN' // Attempting to elevate to ADMIN via payload!
      })
    });
    const sneakyRegData = await sneakyRegRes.json();
    console.log('Registered User Role:', sneakyRegData.user.role);

    if (sneakyRegData.user.role !== 'TRADER') {
      throw new Error(`CRITICAL SECURITY BUG: Registration allowed elevation to ${sneakyRegData.user.role}!`);
    }
    console.log('✅ Registration hard-coding verified! Role payload injection prevented, user created as TRADER.');

    // 2. Verify Public Login Rejects Admin Accounts
    console.log('\n--- 2. Testing Public Login Rejection for Admin Accounts ---');
    const publicAdminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'admin123' })
    });
    if (publicAdminLoginRes.status !== 401) {
      throw new Error('Public login failed to reject Admin user credentials');
    }
    console.log('  [✓] Public login endpoint rejected Admin user credentials with 401 Unauthorized.');

    // 3. Test Dedicated Admin Login Endpoint & 2-Hour JWT Expiration
    console.log('\n--- 3. Testing Dedicated Admin Login & 2-Hour JWT Expiration ---');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'admin123' })
    });
    const adminLoginData = await adminLoginRes.json();
    if (!adminLoginData.token || adminLoginData.user.role !== 'ADMIN') {
      throw new Error('Dedicated admin login failed');
    }

    const decoded = jwt.verify(adminLoginData.token, JWT_SECRET);
    const tokenDurationSec = decoded.exp - decoded.iat;
    console.log(`Admin Token Duration: ${tokenDurationSec} seconds (${tokenDurationSec / 3600} hours)`);

    if (tokenDurationSec !== 7200) { // 2 hours = 7200s
      throw new Error(`Expected 2-hour Admin JWT (7200s), got ${tokenDurationSec}s`);
    }
    console.log('✅ Dedicated Admin login & 2-hour shorter JWT expiration verified!');

    // 4. Verify Admin Audit Log Table
    console.log('\n--- 4. Testing Admin Audit Logging ---');
    const auditLogs = await prisma.adminAuditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 2
    });
    console.log('Recent Admin Audit Logs:', auditLogs);

    if (auditLogs.length === 0 || auditLogs[0].status !== 'SUCCESS') {
      throw new Error('AdminAuditLog entry missing or invalid');
    }
    console.log('✅ Admin Audit Logging verified! IP, timestamp, and SUCCESS status recorded in DB.');

    // 5. Test Admin Login Rate Limiting (5 Attempts)
    console.log('\n--- 5. Testing Admin Login Rate Limiter (Max 5 Attempts) ---');
    for (let i = 0; i < 4; i++) {
      await fetch(`${BASE_URL}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@test.com', password: 'wrongpassword' })
      });
    }

    // 6th attempt should trigger 429 Too Many Requests
    const rateLimitedRes = await fetch(`${BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'wrongpassword' })
    });

    console.log(`6th Login Attempt Status: ${rateLimitedRes.status}`);
    if (rateLimitedRes.status !== 429) {
      throw new Error(`Expected 429 Too Many Requests after 5 failed attempts, got ${rateLimitedRes.status}`);
    }
    console.log('✅ Admin Login Rate Limiting verified! 429 Too Many Requests returned.');

    // 6. Test Generic Server-Side 403 Forbidden for Non-Admins
    console.log('\n--- 6. Testing Generic Server-Side 403 Forbidden Guard ---');
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
    console.log('🎉 ALL PHASE 11 HIDE ADMIN LOGIN & SECURITY TESTS PASSED!');
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Phase 11 test failed:', err);
    server.close();
    await prisma.$disconnect();
    process.exit(1);
  }
}

runPhase11Tests();
