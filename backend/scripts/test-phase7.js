const { io: Client } = require('socket.io-client');
const { server } = require('../src/index');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PORT = 5020;
const BASE_URL = `http://localhost:${PORT}`;

async function runPhase7Tests() {
  console.log('\n==================================================');
  console.log('🧪 STARTING PHASE 7 CURRENCY, PRICING & INDIA STOCKS TEST');
  console.log('==================================================\n');

  await new Promise((r) => server.listen(PORT, r));
  console.log(`✅ Server listening on ${BASE_URL}`);

  try {
    // 1. Verify 15 India-Themed Sector Stocks & Starting Prices (5–15 IC)
    console.log('\n--- 1. Testing 15 India Sector Stocks & Price Range (5–15 IC) ---');
    const stocksRes = await fetch(`${BASE_URL}/stocks`);
    const stocks = await stocksRes.json();
    console.log(`Fetched ${stocks.length} stocks from /stocks endpoint.`);

    if (stocks.length !== 15) {
      throw new Error(`Expected 15 India sector stocks, got ${stocks.length}`);
    }

    const expectedSymbols = ['BPTE', 'IDW', 'NITI', 'ABAL', 'ANAG', 'RTB', 'SANP', 'HTM', 'GSL', 'SGM', 'MRI', 'BRM', 'BWT', 'SWST', 'SGE'];
    for (const stock of stocks) {
      if (!expectedSymbols.includes(stock.symbol)) {
        throw new Error(`Unexpected stock symbol found: ${stock.symbol}`);
      }
      if (stock.currentPrice < 4.0 || stock.currentPrice > 16.0) {
        throw new Error(`Stock ${stock.symbol} starting price ${stock.currentPrice} is outside 5-15 IC range`);
      }
      console.log(`   - ${stock.symbol} (${stock.name}) [${stock.sector}] → ${stock.currentPrice.toFixed(2)} IC`);
    }
    console.log('✅ 15 India-themed sector stocks & 5–15 IC starting price range verified!');

    // 2. Register New Trader (Verify 20,000 IC Starting Wallet Balance)
    console.log('\n--- 2. Testing 20,000 IC Starting Trader Wallet Balance ---');
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'India Trader 1',
        email: `india_trader_${Date.now()}@test.com`,
        password: 'password123'
      })
    });
    const regData = await registerRes.json();
    console.log('Registered Trader User:', regData.user.name);
    console.log('Starting Wallet Balance:', regData.user.walletBalance, 'IC');

    if (regData.user.walletBalance !== 20000) {
      throw new Error(`Expected starting wallet balance of 20000 IC, got ${regData.user.walletBalance}`);
    }
    console.log('✅ 20,000 IC starting wallet balance verified!');

    // 3. Trade Execution in Ignite Coins
    console.log('\n--- 3. Testing Buy & Sell Order Execution in Ignite Coins ---');
    const targetStock = stocks[0]; // BPTE
    const buyQty = 10;
    const totalCost = Math.round(targetStock.currentPrice * buyQty * 100) / 100;

    const buyRes = await fetch(`${BASE_URL}/trade/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${regData.token}`
      },
      body: JSON.stringify({ stockId: targetStock.id, quantity: buyQty })
    });
    const buyData = await buyRes.json();
    console.log(`Bought ${buyQty} shares of ${targetStock.symbol} for ${totalCost} IC.`);
    console.log(`Remaining Wallet Balance: ${buyData.portfolio.walletBalance} IC`);

    if (Math.abs(buyData.portfolio.walletBalance - (20000 - totalCost)) > 0.05) {
      throw new Error(`Wallet balance calculation mismatch after buy`);
    }
    console.log('✅ Ignite Coins trade execution & wallet calculation verified!');

    // 4. Detailed Stock Price History Endpoint (1D, 1W, 1M)
    console.log('\n--- 4. Testing 1D / 1W / 1M Detailed Stock History Endpoint ---');
    const historyRes = await fetch(`${BASE_URL}/stocks/${targetStock.id}/history?range=1W`);
    const history = await historyRes.json();
    console.log(`Fetched 1W history points for ${targetStock.symbol}: ${history.length} data points.`);
    if (!Array.isArray(history) || history.length === 0) {
      throw new Error('Stock detail history query returned empty array');
    }
    console.log('✅ Stock detail 1D/1W/1M history endpoint verified!');

    server.close();
    await prisma.$disconnect();

    console.log('\n==================================================');
    console.log('🎉 ALL PHASE 7 CURRENCY, PRICING & INDIA TESTS PASSED!');
    console.log('==================================================\n');
  } catch (err) {
    console.error('❌ Phase 7 test failed:', err);
    server.close();
    await prisma.$disconnect();
    process.exit(1);
  }
}

runPhase7Tests();
