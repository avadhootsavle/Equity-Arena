const { io: Client } = require('socket.io-client');
const { server } = require('../src/index');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PORT = 5006;
const BASE_URL = `http://localhost:${PORT}`;

async function runPhase4Tests() {
  console.log('🧪 Starting Phase 4 Trader Panel Real-Time Integration Test...');

  await new Promise((r) => server.listen(PORT, r));
  console.log(`✅ Server running on ${BASE_URL}`);

  try {
    // 1. Login Admin & Register/Login Trader
    const adminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'admin123' })
    });
    const adminData = await adminRes.json();
    const adminToken = adminData.token;

    const traderRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Phase 4 Trader',
        email: `trader_p4_${Date.now()}@test.com`,
        password: 'trader123'
      })
    });
    const traderData = await traderRes.json();
    const traderToken = traderData.token;

    // 2. Connect Trader Socket
    const traderSocket = Client(BASE_URL, {
      auth: { token: traderToken }
    });

    await new Promise((resolve, reject) => {
      traderSocket.on('connect', resolve);
      traderSocket.on('connect_error', reject);
    });
    console.log('✅ Trader socket connected successfully!');

    let stockUpdateDiff = null;
    let newsBroadcastData = null;
    let portfolioUpdateData = null;

    traderSocket.on('stock:update', (diff) => {
      stockUpdateDiff = diff;
    });

    traderSocket.on('news:broadcast', (news) => {
      newsBroadcastData = news;
    });

    traderSocket.on('portfolio:update', (p) => {
      portfolioUpdateData = p;
    });

    // 3. Admin adjusts stock price by +50%
    const stocks = await (await fetch(`${BASE_URL}/stocks`)).json();
    const stockToAdjust = stocks[1]; // e.g. NVDA

    console.log(`Adjusting stock ${stockToAdjust.symbol} by +50% from admin...`);
    await fetch(`${BASE_URL}/admin/stock/${stockToAdjust.id}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ percent: 50 })
    });

    await new Promise((r) => setTimeout(r, 400));
    if (!stockUpdateDiff || stockUpdateDiff.stockId !== stockToAdjust.id) {
      throw new Error('Failed to receive stock:update socket diff');
    }
    console.log('✅ Received stock:update socket diff:', stockUpdateDiff);

    // 4. Trader executes BUY order
    console.log(`Executing Buy order for 5 shares of ${stockToAdjust.symbol}...`);
    const buyRes = await fetch(`${BASE_URL}/trade/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${traderToken}`
      },
      body: JSON.stringify({ stockId: stockToAdjust.id, quantity: 5 })
    });
    const buyData = await buyRes.json();
    console.log('Buy response:', buyData.message);

    await new Promise((r) => setTimeout(r, 400));
    if (!portfolioUpdateData || portfolioUpdateData.holdings.length !== 1) {
      throw new Error('Failed to receive portfolio:update socket event');
    }
    console.log('✅ Received portfolio:update socket event:', {
      walletBalance: portfolioUpdateData.walletBalance,
      holdingsCount: portfolioUpdateData.holdings.length
    });

    // 5. Admin broadcasts news
    console.log('Broadcasting market news from admin...');
    await fetch(`${BASE_URL}/admin/news`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        message: 'Earnings report exceeds market expectations!',
        stockId: stockToAdjust.id
      })
    });

    await new Promise((r) => setTimeout(r, 400));
    if (!newsBroadcastData || newsBroadcastData.stockId !== stockToAdjust.id) {
      throw new Error('Failed to receive news:broadcast socket event');
    }
    console.log('✅ Received news:broadcast socket event:', newsBroadcastData.message);

    traderSocket.disconnect();
    server.close();
    await prisma.$disconnect();

    console.log('\n==================================================');
    console.log('🎉 ALL PHASE 4 TRADER PANEL REAL-TIME TESTS PASSED!');
    console.log('==================================================\n');
  } catch (err) {
    console.error('❌ Phase 4 test failed:', err);
    server.close();
    await prisma.$disconnect();
    process.exit(1);
  }
}

runPhase4Tests();
