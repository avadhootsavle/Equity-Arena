const assert = require('assert');
const { io: ioClient } = require('socket.io-client');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../src/utils/auth');
const { emitPortfolioUpdate, emitNewsBroadcast } = require('../src/socket');
const { server } = require('../src/index');

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5001';

async function runMultiTabSyncTest() {
  console.log('\n==================================================');
  console.log('🧪 9. Multi-Tab Real-Time Sync Test Suite');
  console.log('==================================================');

  let socketTab1 = null;
  let socketTab2 = null;
  let socketTab3 = null;
  let startedServer = false;

  try {
    if (!server.listening) {
      await new Promise((resolve) => {
        server.listen(5001, '127.0.0.1', resolve);
      });
      startedServer = true;
    }
    // 1. Create a test trader user
    const testEmail = `multitab_${Date.now()}@test.com`;
    const user = await prisma.user.create({
      data: {
        name: 'Multi-Tab Trader',
        email: testEmail,
        passwordHash: 'hash',
        role: 'TRADER',
        isTestAccount: true,
        walletBalance: 20000.00
      }
    });

    const token = generateToken(user);

    // 2. Connect 3 simultaneous WebSocket clients representing 3 open browser tabs
    const socketOptions = {
      transports: ['websocket'],
      auth: { token }
    };

    socketTab1 = ioClient(API_URL, socketOptions);
    socketTab2 = ioClient(API_URL, socketOptions);
    socketTab3 = ioClient(API_URL, socketOptions);

    await Promise.all([
      new Promise((resolve) => socketTab1.on('connect', resolve)),
      new Promise((resolve) => socketTab2.on('connect', resolve)),
      new Promise((resolve) => socketTab3.on('connect', resolve))
    ]);

    assert.strictEqual(socketTab1.connected, true, 'Tab 1 WebSocket connected');
    assert.strictEqual(socketTab2.connected, true, 'Tab 2 WebSocket connected');
    assert.strictEqual(socketTab3.connected, true, 'Tab 3 WebSocket connected');
    console.log('  ✅ [PASS] 3 concurrent tab WebSocket connections authenticated for single user');

    // 3. Test Portfolio Update Sync across all 3 tabs
    const portfolioPayload = {
      availableWalletBalance: 18500.00,
      holdings: [{ stockId: 'test-stock-1', quantity: 10 }]
    };

    const tab1Received = new Promise((res) => socketTab1.once('portfolio:update', res));
    const tab2Received = new Promise((res) => socketTab2.once('portfolio:update', res));
    const tab3Received = new Promise((res) => socketTab3.once('portfolio:update', res));

    // Dispatch via server endpoint so the active running server's socket.io instance emits the events
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const adminToken = generateToken(adminUser);

    await fetch(`${API_URL}/admin/test/broadcast-portfolio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ userId: user.id, portfolio: portfolioPayload })
    });

    const [res1, res2, res3] = await Promise.all([tab1Received, tab2Received, tab3Received]);

    assert.strictEqual(res1.availableWalletBalance, 18500.00, 'Tab 1 received portfolio update');
    assert.strictEqual(res2.availableWalletBalance, 18500.00, 'Tab 2 received portfolio update');
    assert.strictEqual(res3.availableWalletBalance, 18500.00, 'Tab 3 received portfolio update');
    console.log('  ✅ [PASS] Portfolio update broadcast simultaneously received by all 3 open tabs');

    // 4. Test News Broadcast Sync across all 3 tabs
    const newsPayload = { id: 'news-1', headline: 'Multi-Tab Market Rally', category: 'MARKET' };

    const newsTab1 = new Promise((res) => socketTab1.once('news:broadcast', res));
    const newsTab2 = new Promise((res) => socketTab2.once('news:broadcast', res));
    const newsTab3 = new Promise((res) => socketTab3.once('news:broadcast', res));

    await fetch(`${API_URL}/admin/test/broadcast-news`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ news: newsPayload })
    });

    const [n1, n2, n3] = await Promise.all([newsTab1, newsTab2, newsTab3]);

    assert.strictEqual(n1.headline, 'Multi-Tab Market Rally', 'Tab 1 received news');
    assert.strictEqual(n2.headline, 'Multi-Tab Market Rally', 'Tab 2 received news');
    assert.strictEqual(n3.headline, 'Multi-Tab Market Rally', 'Tab 3 received news');
    console.log('  ✅ [PASS] News broadcast received live across all 3 open tabs');

    // Cleanup test user
    await prisma.user.delete({ where: { id: user.id } });

    console.log('Summary: Multi-Tab Sync Suite (3 passed, 0 failed)\n');
    return { passed: 3, failed: 0 };
  } catch (err) {
    console.error('  ❌ [FAIL] Multi-Tab Sync Suite:', err.message);
    return { passed: 0, failed: 1 };
  } finally {
    if (socketTab1) socketTab1.disconnect();
    if (socketTab2) socketTab2.disconnect();
    if (socketTab3) socketTab3.disconnect();
    if (startedServer && server.listening) {
      await new Promise((resolve) => server.close(resolve));
    }
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runMultiTabSyncTest();
}

module.exports = { runMultiTabSyncTest };
