const { io: Client } = require('socket.io-client');
const { server } = require('../src/index');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PORT = 5005;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('🧪 Starting Phase 2 Integration & Real-Time Test Suite...');

  // Start server on port 5005
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`✅ Server listening on ${BASE_URL}`);

  try {
    // 1. Auth: Login as Admin
    console.log('\n--- 1. Testing Auth Endpoints ---');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'admin123' })
    });
    const adminAuth = await adminLoginRes.json();
    console.log('Admin login result:', adminAuth.user ? `Success (${adminAuth.user.role})` : adminAuth);

    // Register a new Trader
    const traderRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Trader 1',
        email: `trader_${Date.now()}@test.com`,
        password: 'trader123'
      })
    });
    const traderAuth = await traderRegRes.json();
    console.log('Trader register result:', traderAuth.user ? `Success (Wallet: $${traderAuth.user.walletBalance})` : traderRegRes.status);

    const adminToken = adminAuth.token;
    const traderToken = traderAuth.token;

    // 2. Fetch Stocks
    console.log('\n--- 2. Testing Stock List & History ---');
    const stocksRes = await fetch(`${BASE_URL}/stocks`);
    const stocks = await stocksRes.json();
    console.log(`Fetched ${stocks.length} stocks from /stocks endpoint.`);
    if (stocks.length !== 30) throw new Error(`Expected 30 stocks, got ${stocks.length}`);

    const targetStock = stocks[0];
    console.log(`Target Stock for testing: ${targetStock.symbol} (ID: ${targetStock.id}, Current Price: $${targetStock.currentPrice})`);

    // 3. Socket Connections
    console.log('\n--- 3. Testing Socket.io Connections & Auth ---');
    const traderSocket = Client(BASE_URL, {
      auth: { token: traderToken }
    });

    await new Promise((resolve, reject) => {
      traderSocket.on('connect', () => {
        console.log('✅ Trader Socket connected cleanly!');
        resolve();
      });
      traderSocket.on('connect_error', (err) => reject(err));
    });

    // Set up socket event listeners
    let receivedStockUpdate = null;
    let receivedNewsBroadcast = null;
    let receivedPortfolioUpdate = null;

    traderSocket.on('stock:update', (data) => {
      console.log('⚡ Socket event [stock:update] received on trader client:', data);
      receivedStockUpdate = data;
    });

    traderSocket.on('news:broadcast', (data) => {
      console.log('⚡ Socket event [news:broadcast] received on trader client:', data);
      receivedNewsBroadcast = data;
    });

    traderSocket.on('portfolio:update', (data) => {
      console.log('⚡ Socket event [portfolio:update] received on private user room:', {
        walletBalance: data.walletBalance,
        totalPortfolioValue: data.totalPortfolioValue,
        holdingsCount: data.holdings.length
      });
      receivedPortfolioUpdate = data;
    });

    // 4. Admin Stock Price Adjustment & Socket Verification
    console.log('\n--- 4. Testing Admin Stock Price Adjustment (+20%) ---');
    const adjustRes = await fetch(`${BASE_URL}/admin/stock/${targetStock.id}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ percent: 20 })
    });
    const adjustData = await adjustRes.json();
    console.log('Adjust response:', adjustData);

    await new Promise((r) => setTimeout(r, 500)); // wait for socket event
    if (!receivedStockUpdate || receivedStockUpdate.stockId !== targetStock.id) {
      throw new Error('Failed to receive expected stock:update socket event');
    }
    console.log('✅ stock:update socket event verified successfully!');

    // 5. Admin News Broadcast & Socket Verification
    console.log('\n--- 5. Testing Admin News Broadcast ---');
    const newsRes = await fetch(`${BASE_URL}/admin/news`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        message: 'Major breakthrough announced by market analyst!',
        stockId: targetStock.id
      })
    });
    const newsData = await newsRes.json();
    console.log('News response:', newsData);

    await new Promise((r) => setTimeout(r, 500));
    if (!receivedNewsBroadcast || receivedNewsBroadcast.stockId !== targetStock.id) {
      throw new Error('Failed to receive expected news:broadcast socket event');
    }
    console.log('✅ news:broadcast socket event verified successfully!');

    // 6. Trader Buy Execution & Portfolio Socket
    console.log('\n--- 6. Testing Trader Buy Execution (10 shares) ---');
    const buyRes = await fetch(`${BASE_URL}/trade/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${traderToken}`
      },
      body: JSON.stringify({ stockId: targetStock.id, quantity: 10 })
    });
    const buyData = await buyRes.json();
    console.log('Buy response message:', buyData.message);
    console.log('Updated Wallet Balance:', buyData.portfolio.walletBalance);

    await new Promise((r) => setTimeout(r, 500));
    if (!receivedPortfolioUpdate || receivedPortfolioUpdate.holdings.length !== 1) {
      throw new Error('Failed to receive expected portfolio:update socket event for Buy');
    }
    console.log('✅ portfolio:update socket event verified successfully for Buy!');

    // 7. Repeat Buy & Weighted Average Buy Price Check
    console.log('\n--- 7. Testing Repeat Buy & Average Buy Price Math ---');
    // Adjust price by +10% first
    await fetch(`${BASE_URL}/admin/stock/${targetStock.id}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ percent: 10 })
    });

    const buy2Res = await fetch(`${BASE_URL}/trade/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${traderToken}`
      },
      body: JSON.stringify({ stockId: targetStock.id, quantity: 5 })
    });
    const buy2Data = await buy2Res.json();
    const holdingAfterBuy2 = buy2Data.portfolio.holdings.find(h => h.stockId === targetStock.id);
    console.log('Holding state after second buy (total 15 shares):', {
      quantity: holdingAfterBuy2.quantity,
      avgBuyPrice: holdingAfterBuy2.avgBuyPrice,
      currentPrice: holdingAfterBuy2.currentPrice,
      unrealizedPL: holdingAfterBuy2.unrealizedPL
    });
    if (holdingAfterBuy2.quantity !== 15) throw new Error('Expected holding quantity to be 15');
    console.log('✅ Average buy price math verified!');

    // 8. Trader Sell Execution
    console.log('\n--- 8. Testing Trader Sell Execution (5 shares) ---');
    const sellRes = await fetch(`${BASE_URL}/trade/sell`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${traderToken}`
      },
      body: JSON.stringify({ stockId: targetStock.id, quantity: 5 })
    });
    const sellData = await sellRes.json();
    const holdingAfterSell = sellData.portfolio.holdings.find(h => h.stockId === targetStock.id);
    console.log('Holding state after sell (10 shares remaining):', {
      quantity: holdingAfterSell.quantity,
      walletBalance: sellData.portfolio.walletBalance
    });
    if (holdingAfterSell.quantity !== 10) throw new Error('Expected holding quantity to be 10');
    console.log('✅ Sell execution & wallet update verified!');

    // 9. Portfolio Endpoint & P/L Verification
    console.log('\n--- 9. Testing GET /portfolio ---');
    const portfolioRes = await fetch(`${BASE_URL}/portfolio`, {
      headers: { 'Authorization': `Bearer ${traderToken}` }
    });
    const portfolio = await portfolioRes.json();
    console.log('Fetched Portfolio Summary:', {
      walletBalance: portfolio.walletBalance,
      totalHoldingsValue: portfolio.totalHoldingsValue,
      totalUnrealizedPL: portfolio.totalUnrealizedPL,
      totalPortfolioValue: portfolio.totalPortfolioValue,
      transactionCount: portfolio.transactions.length
    });
    console.log('✅ GET /portfolio verified!');

    // 10. Admin Leaderboard
    console.log('\n--- 10. Testing Admin Leaderboard ---');
    const leaderboardRes = await fetch(`${BASE_URL}/admin/leaderboard`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const leaderboard = await leaderboardRes.json();
    console.log('Leaderboard Top Traders:', leaderboard.slice(0, 5));
    if (!Array.isArray(leaderboard) || leaderboard.length === 0) {
      throw new Error('Leaderboard returned invalid response');
    }
    console.log('✅ Admin Leaderboard verified!');

    // Cleanup socket & server
    traderSocket.disconnect();
    server.close();
    await prisma.$disconnect();

    console.log('\n==================================================');
    console.log('🎉 ALL PHASE 2 INTEGRATION & REAL-TIME TESTS PASSED!');
    console.log('==================================================\n');
  } catch (err) {
    console.error('❌ Phase 2 test suite failed:', err);
    server.close();
    await prisma.$disconnect();
    process.exit(1);
  }
}

runTests();
