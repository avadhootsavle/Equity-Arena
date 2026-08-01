const { io: Client } = require('socket.io-client');
const { server } = require('../src/index');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PORT = 5030;
const BASE_URL = `http://localhost:${PORT}`;

async function runPhase9Tests() {
  console.log('\n================================================================');
  console.log('🧪 STARTING PHASE 9 ANALYST NEWS & VOLUME SIGNALS TEST SUITE');
  console.log('================================================================\n');

  await new Promise((r) => server.listen(PORT, r));
  console.log(`✅ Server listening on ${BASE_URL}`);

  try {
    // 1. Auth Login as Admin and Trader
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
        name: 'Analyst Trader',
        email: `analyst_trader_${Date.now()}@test.com`,
        password: 'password123'
      })
    });
    const { token: traderToken } = await traderRes.json();

    // Connect Trader Socket
    const socket = Client(BASE_URL, { auth: { token: traderToken } });
    await new Promise((r) => socket.on('connect', r));
    console.log('✅ Trader socket connected.');

    // 2. Fetch News Templates & Verify Analyst-Style Blurbs
    console.log('\n--- 1. Testing Analyst-Style 2-3 Sentence News Blurbs ---');
    const templatesRes = await fetch(`${BASE_URL}/admin/news-templates`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const { templates } = await templatesRes.json();
    console.log(`Fetched ${templates.length} analyst-style news templates.`);

    if (templates.length < 12) {
      throw new Error(`Expected 12 templates, got ${templates.length}`);
    }

    const testTemplate = templates[0];
    console.log('Sample Analyst News Blurb:');
    console.log(`"${testTemplate.headline}"`);

    if (!testTemplate.headline.includes('.') || testTemplate.headline.length < 80) {
      throw new Error('News template does not match multi-sentence analyst style');
    }
    console.log('✅ Analyst news copy verified! Multi-sentence blurbs with numbers & market framing.');

    // 3. Test Pre-Move Drift & Volume Uptick during News Delay Window
    console.log('\n--- 2. Testing Pre-Move Drift & Volume Upticks during Delay Window ---');
    const stocksRes = await fetch(`${BASE_URL}/stocks`);
    const stocks = await stocksRes.json();
    const oilStock = stocks.find(s => s.sector.includes('Oil & Gas')) || stocks[0];

    const initialPrice = oilStock.currentPrice;
    console.log(`Initial ${oilStock.symbol} price: ${initialPrice.toFixed(2)} IC`);

    let newsBroadcastReceived = false;
    const socketTicks = [];

    socket.on('news:broadcast', (news) => {
      newsBroadcastReceived = true;
      console.log('⚡ Immediate News Broadcast received on trader client:', `"${news.message.slice(0, 65)}..."`);
    });

    socket.on('stock:update', (diff) => {
      if (diff.stockId === oilStock.id) {
        socketTicks.push(diff);
        console.log(`⚡ Tape update for ${diff.symbol}: Price = ${diff.newPrice.toFixed(2)} IC | Volume = ${diff.volume.toLocaleString()} shares`);
      }
    });

    // Trigger analyst news template with 8s delay
    console.log(`Triggering template for ${testTemplate.sector} with 8s delay window...`);
    const triggerRes = await fetch(`${BASE_URL}/admin/news/trigger-template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        templateId: testTemplate.id,
        delaySeconds: 8
      })
    });
    const triggerData = await triggerRes.json();
    console.log('Response:', triggerData.message);

    if (!newsBroadcastReceived) {
      throw new Error('Failed to receive immediate news broadcast');
    }

    // Wait 10s for delay window ticks and final price jump to execute
    console.log('Waiting 10s for pre-move drift ticks & final price jump...');
    await new Promise((r) => setTimeout(r, 10000));

    if (socketTicks.length === 0) {
      throw new Error('No stock update ticks received during delay window');
    }

    const preMoveTick = socketTicks.find(t => t.volume >= 40000);
    if (!preMoveTick) {
      throw new Error('Failed to detect elevated volume uptick during pre-move delay window');
    }
    console.log(`✅ Elevated pre-move volume uptick verified: ${preMoveTick.volume.toLocaleString()} shares!`);

    // Verify final price jump
    const finalPrice = socketTicks[socketTicks.length - 1].newPrice;
    console.log(`Final ${oilStock.symbol} price after delay: ${finalPrice.toFixed(2)} IC`);
    if (finalPrice === initialPrice) {
      throw new Error('Stock price failed to adjust after delay expiration');
    }
    console.log('✅ Pre-move drift and final price impact verified!');

    // 4. Verify PriceHistory DB Volume Logging
    console.log('\n--- 3. Testing PriceHistory Volume DB Logging ---');
    const histories = await prisma.priceHistory.findMany({
      where: { stockId: oilStock.id },
      orderBy: { timestamp: 'desc' },
      take: 5
    });

    console.log('Recent PriceHistory DB Entries:', histories.map(h => ({ price: h.price, volume: h.volume })));
    const hasVolume = histories.every(h => typeof h.volume === 'number' && h.volume > 0);
    if (!hasVolume) {
      throw new Error('PriceHistory entries missing volume values');
    }
    console.log('✅ PriceHistory DB volume logging verified!');

    socket.disconnect();
    server.close();
    await prisma.$disconnect();

    console.log('\n================================================================');
    console.log('🎉 ALL PHASE 9 ANALYST NEWS & VOLUME SIGNAL TESTS PASSED!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('❌ Phase 9 test failed:', err);
    server.close();
    await prisma.$disconnect();
    process.exit(1);
  }
}

runPhase9Tests();
