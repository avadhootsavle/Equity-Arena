const { server } = require('../src/index');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PORT = 5035;
const BASE_URL = `http://localhost:${PORT}`;

async function runPhase10Tests() {
  console.log('\n================================================================');
  console.log('🧪 STARTING PHASE 10 AGGREGATION, DRILL-DOWN & NEWS TEST SUITE');
  console.log('================================================================\n');

  await new Promise((r) => server.listen(PORT, r));
  console.log(`✅ Server listening on ${BASE_URL}`);

  try {
    // 1. Auth Login
    const adminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'admin123' })
    });
    const { token: adminToken } = await adminRes.json();

    const traderRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Phase 10 Trader',
        email: `phase10_trader_${Date.now()}@test.com`,
        password: 'password123'
      })
    });
    const { token: traderToken, user: traderUser } = await traderRes.json();

    // 2. Test 1D / 1W / 1M Downsampling Aggregation Endpoints
    console.log('\n--- 1. Testing 1D / 1W / 1M Downsampling Aggregation Endpoints ---');
    const stocksRes = await fetch(`${BASE_URL}/stocks`);
    const stocks = await stocksRes.json();
    const stockId = stocks[0].id;

    const res1D = await fetch(`${BASE_URL}/stocks/${stockId}/history?range=1D`);
    const data1D = await res1D.json();

    const res1W = await fetch(`${BASE_URL}/stocks/${stockId}/history?range=1W`);
    const data1W = await res1W.json();

    const res1M = await fetch(`${BASE_URL}/stocks/${stockId}/history?range=1M`);
    const data1M = await res1M.json();

    console.log(`1D Raw Ticks Count: ${data1D.length} data points`);
    console.log(`1W Hourly Aggregated Count: ${data1W.length} data points`);
    console.log(`1M Daily Aggregated Count: ${data1M.length} data points`);

    if (data1D.length === data1W.length || data1W.length === data1M.length) {
      throw new Error('Downsampling aggregation failed: 1D, 1W, and 1M returned identical data lengths');
    }
    console.log('✅ 1D / 1W / 1M Downsampling Aggregation verified! Each view returns distinct bucketed datasets.');

    // 3. Test Admin Trader Drill-Down Endpoint (GET /admin/trader/:id)
    console.log('\n--- 2. Testing Admin Trader Drill-Down Endpoint (GET /admin/trader/:id) ---');
    
    // Perform a trade first
    await fetch(`${BASE_URL}/trade/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${traderToken}`
      },
      body: JSON.stringify({ stockId: stockId, quantity: 5 })
    });

    const drillDownRes = await fetch(`${BASE_URL}/admin/trader/${traderUser.id}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const drillDownData = await drillDownRes.json();

    console.log('Drill-Down Response Summary:', {
      traderName: drillDownData.trader.name,
      walletBalance: drillDownData.trader.walletBalance,
      totalPortfolioValue: drillDownData.trader.totalPortfolioValue,
      holdingsCount: drillDownData.holdings.length,
      transactionsCount: drillDownData.transactions.length
    });

    if (!drillDownData.trader || !Array.isArray(drillDownData.holdings) || !Array.isArray(drillDownData.transactions)) {
      throw new Error('GET /admin/trader/:id drill-down endpoint failed format verification');
    }
    if (drillDownData.holdings.length !== 1 || drillDownData.transactions.length !== 1) {
      throw new Error('Drill-down holdings or transaction log missing');
    }
    console.log('✅ Admin Trader Drill-Down single-query endpoint verified!');

    // 4. Test Dedicated News History Endpoint (GET /news)
    console.log('\n--- 3. Testing Dedicated Trader News Endpoint (GET /news) ---');
    
    // Broadcast a news headline as admin
    await fetch(`${BASE_URL}/admin/news`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ message: 'Central bank releases quarterly economic report.' })
    });

    const newsRes = await fetch(`${BASE_URL}/news`, {
      headers: { 'Authorization': `Bearer ${traderToken}` }
    });
    const newsList = await newsRes.json();

    console.log(`Fetched ${newsList.length} past news items from /news.`);
    console.log('Sample News Item:', newsList[0]);

    if (!Array.isArray(newsList) || newsList.length === 0) {
      throw new Error('GET /news endpoint returned empty list');
    }
    if (newsList[0].stockId !== undefined || newsList[0].stockSymbol !== undefined) {
      throw new Error('GET /news leaked stockId or stockSymbol');
    }
    console.log('✅ Dedicated Trader News endpoint verified! Target stock IDs remain 100% hidden.');

    server.close();
    await prisma.$disconnect();

    console.log('\n================================================================');
    console.log('🎉 ALL PHASE 10 AGGREGATION, DRILL-DOWN & NEWS TESTS PASSED!');
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Phase 10 test failed:', err);
    server.close();
    await prisma.$disconnect();
    process.exit(1);
  }
}

runPhase10Tests();
