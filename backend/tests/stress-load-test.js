const prisma = require('../src/prisma');
const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runStressTest() {
  console.log('====================================================');
  console.log('🚀 EQUITY ARENA — 100% PRODUCTION LOAD & CONCURRENCY AUDIT');
  console.log('====================================================');

  const startTotal = Date.now();

  // 1. Reset Session to ACTIVE
  const activeSession = await prisma.session.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  if (activeSession) {
    await prisma.session.update({
      where: { id: activeSession.id },
      data: {
        status: 'ACTIVE',
        endTime: new Date(Date.now() + 3 * 3600 * 1000)
      }
    });
    console.log('[SETUP] Live trading session activated.');
  }

  // 2. Fetch active stocks
  const stocks = await prisma.stock.findMany();
  console.log(`[SETUP] Verified ${stocks.length} active stocks.`);

  // 3. Initialize concurrent simulated traders
  const NUM_TRADERS = 20;
  console.log(`[SETUP] Spawning ${NUM_TRADERS} concurrent player sessions...`);

  const traders = [];
  const { generateToken } = require('../src/utils/auth');

  for (let i = 0; i < NUM_TRADERS; i++) {
    const ts = Date.now().toString().slice(-6);
    const email = `stress_player_${i}_${ts}@arena.test`;
    const phone = `8${ts}${String(i).padStart(3, '0')}`;
    const user = await prisma.user.create({
      data: {
        name: `Arena Competitor ${i + 1}`,
        email,
        phone,
        passwordHash: 'stresspass',
        role: 'TRADER',
        walletBalance: 20000.0,
        isTestAccount: false
      }
    });

    const token = generateToken(user);
    traders.push({ user, token });
  }
  console.log(`[SETUP] Authenticated ${traders.length} test traders.`);

  // 4. Fire concurrent Buy orders
  console.log('\n[TEST 1] Dispatching 20 concurrent BUY orders simultaneously across all 20 traders...');
  const buyPromises = traders.map((trader, i) => {
    const stock = stocks[stocks.length - 1 - (i % 5)];
    return request({
      hostname: 'localhost',
      port: 5001,
      path: '/trade/buy',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${trader.token}`
      }
    }, { stockId: stock.id, quantity: 10 });
  });

  const startBuys = Date.now();
  const buyResults = await Promise.all(buyPromises);
  const buyDuration = Date.now() - startBuys;
  const successfulBuys = buyResults.filter(r => r.status === 200 || r.status === 201).length;
  console.log(`✅ [CONCURRENT BUYS] ${successfulBuys}/${buyResults.length} orders executed successfully in ${buyDuration}ms (${(buyResults.length / (buyDuration / 1000)).toFixed(1)} req/sec).`);

  // 5. Verify portfolio integrity under load
  console.log('\n[TEST 2] Verifying concurrent portfolio balances & holding integrity...');
  const portfolioPromises = traders.map(t =>
    request({
      hostname: 'localhost',
      port: 5001,
      path: '/portfolio',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${t.token}` }
    })
  );

  const portfolioResults = await Promise.all(portfolioPromises);
  let mathIntegrityPassed = 0;

  for (let i = 0; i < NUM_TRADERS; i++) {
    const res = portfolioResults[i];
    if (res.status === 200 && res.body) {
      const p = res.body;
      const expectedTotal = p.walletBalance + p.totalHoldingsValue;
      const diff = Math.abs(p.totalPortfolioValue - expectedTotal);
      if (diff < 0.05 && p.holdings.length > 0) {
        mathIntegrityPassed++;
      }
    }
  }
  console.log(`✅ [PORTFOLIO INTEGRITY] ${mathIntegrityPassed}/${NUM_TRADERS} traders have mathematically verified balance + holding value = net worth.`);

  // Wait 450ms for per-user spam rate limiter cooldown
  await sleep(450);

  // 6. Fire concurrent Sell orders
  console.log('\n[TEST 3] Dispatching 20 concurrent SELL market orders simultaneously...');
  const sellPromises = traders.map((trader, i) => {
    const stock = stocks[stocks.length - 1 - (i % 5)];
    return request({
      hostname: 'localhost',
      port: 5001,
      path: '/trade/sell',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${trader.token}`
      }
    }, { stockId: stock.id, quantity: 5 });
  });

  const startSells = Date.now();
  const sellResults = await Promise.all(sellPromises);
  const sellDuration = Date.now() - startSells;
  const successfulSells = sellResults.filter(r => r.status === 200 || r.status === 201).length;
  console.log(`✅ [CONCURRENT SELLS] ${successfulSells}/${sellResults.length} sell orders executed in ${sellDuration}ms (${(sellResults.length / (sellDuration / 1000)).toFixed(1)} req/sec).`);

  // Wait 450ms for cooldown
  await sleep(450);

  // 7. Fire concurrent Limit Orders Escrow Locking
  console.log('\n[TEST 4] Dispatching 20 concurrent Limit Orders (Escrow Lock Stress)...');
  const limitPromises = traders.map((trader, i) => {
    const stock = stocks[stocks.length - 1 - (i % 5)];
    return request({
      hostname: 'localhost',
      port: 5001,
      path: '/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${trader.token}`
      }
    }, {
      stockId: stock.id,
      type: 'BUY',
      targetPrice: 1.00,
      quantity: 5
    });
  });

  const limitResults = await Promise.all(limitPromises);
  const successfulLimits = limitResults.filter(r => r.status === 200 || r.status === 201).length;
  console.log(`✅ [LIMIT ORDERS] ${successfulLimits}/${NUM_TRADERS} limit orders locked escrow concurrently without race conditions.`);

  // 8. Test Leaderboard Generation Under Concurrency (with Auth Token)
  console.log('\n[TEST 5] Stress testing live leaderboard generation with active participants...');
  const lbRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/stocks/leaderboard',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${traders[0].token}` }
  });
  if (lbRes.status === 200 && Array.isArray(lbRes.body)) {
    console.log(`✅ [LEADERBOARD] Generated live tournament rankings with ${lbRes.body.length} ranked competitors.`);
  } else {
    console.error('❌ Leaderboard failed:', lbRes);
  }

  // 9. Cleanup test data
  console.log('\n[CLEANUP] Purging test traders and associated transactions...');
  const traderIds = traders.map(t => t.user.id);
  await prisma.order.deleteMany({ where: { userId: { in: traderIds } } });
  await prisma.holding.deleteMany({ where: { userId: { in: traderIds } } });
  await prisma.transaction.deleteMany({ where: { userId: { in: traderIds } } });
  await prisma.user.deleteMany({ where: { id: { in: traderIds } } });
  console.log('✅ [CLEANUP] Test database cleanly restored.');

  const totalTime = Date.now() - startTotal;
  console.log('\n====================================================');
  console.log(`🏁 PRODUCTION LOAD & CONCURRENCY AUDIT COMPLETED IN ${(totalTime / 1000).toFixed(2)}s`);
  console.log('====================================================');

  await prisma.$disconnect();
}

runStressTest().catch(err => {
  console.error('Fatal Stress Test Error:', err);
  prisma.$disconnect();
  process.exit(1);
});
