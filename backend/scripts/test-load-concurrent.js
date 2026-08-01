const { io: Client } = require('socket.io-client');
const { server } = require('../src/index');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const PORT = 5010;
const BASE_URL = `http://localhost:${PORT}`;
const CONCURRENT_CLIENTS = 50;

async function runLoadTest() {
  console.log(`\n==================================================`);
  console.log(`🚀 STARTING 50 CONCURRENT SOCKET CLIENTS LOAD TEST`);
  console.log(`==================================================\n`);

  await new Promise((r) => server.listen(PORT, r));
  console.log(`✅ Server listening on ${BASE_URL}`);

  try {
    // 1. Get Admin Token
    const adminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'admin123' })
    });
    const adminAuth = await adminRes.json();
    const adminToken = adminAuth.token;

    // 2. Batch register/login 50 traders & connect 50 Socket.io clients
    console.log(`⚡ Connecting ${CONCURRENT_CLIENTS} concurrent socket clients...`);
    const clients = [];
    const eventCounters = new Array(CONCURRENT_CLIENTS).fill(0);
    const newsCounters = new Array(CONCURRENT_CLIENTS).fill(0);

    const startTime = Date.now();

    for (let i = 0; i < CONCURRENT_CLIENTS; i++) {
      const email = `load_trader_${i}@test.com`;
      let token;

      try {
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `Load Trader ${i}`, email, password: 'password123' })
        });
        const regData = await regRes.json();
        token = regData.token;
      } catch (e) {
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: 'password123' })
        });
        const loginData = await loginRes.json();
        token = loginData.token;
      }

      const socket = Client(BASE_URL, {
        auth: { token },
        transports: ['websocket']
      });

      socket.on('stock:update', () => {
        eventCounters[i]++;
      });

      socket.on('news:broadcast', () => {
        newsCounters[i]++;
      });

      clients.push(socket);
    }

    // Wait for all 50 sockets to connect
    await Promise.all(
      clients.map((socket) =>
        new Promise((resolve) => {
          if (socket.connected) resolve();
          else socket.on('connect', resolve);
        })
      )
    );

    const connectTime = Date.now() - startTime;
    console.log(`✅ All ${CONCURRENT_CLIENTS} socket clients connected cleanly in ${connectTime}ms!`);

    // 3. Trigger 5 Admin Stock Price Adjustments
    const stocks = await (await fetch(`${BASE_URL}/stocks`)).json();
    const targetStock = stocks[0];

    console.log(`\n📢 Triggering 5 rapid admin price adjustments for ${targetStock.symbol}...`);
    const adjustStartTime = Date.now();

    for (let step = 1; step <= 5; step++) {
      const percent = step * 10;
      await fetch(`${BASE_URL}/admin/stock/${targetStock.id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ percent })
      });
    }

    // Wait 500ms for events to propagate to all sockets
    await new Promise((r) => setTimeout(r, 500));
    const adjustDuration = Date.now() - adjustStartTime;

    // 4. Trigger Admin News Broadcast
    console.log('\n📢 Triggering admin news broadcast across all 50 clients...');
    await fetch(`${BASE_URL}/admin/news`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        message: 'High-frequency load testing news event!',
        stockId: targetStock.id
      })
    });

    await new Promise((r) => setTimeout(r, 500));

    // 5. Verify event delivery metrics across all 50 sockets
    console.log('\n📊 LOAD TEST METRICS & VERIFICATION:');
    let totalStockEventsReceived = 0;
    let totalNewsEventsReceived = 0;

    for (let i = 0; i < CONCURRENT_CLIENTS; i++) {
      totalStockEventsReceived += eventCounters[i];
      totalNewsEventsReceived += newsCounters[i];
    }

    const expectedStockEvents = CONCURRENT_CLIENTS * 5;
    const expectedNewsEvents = CONCURRENT_CLIENTS * 1;

    console.log(`- Connected Sockets: ${CONCURRENT_CLIENTS}`);
    console.log(`- Connection Time: ${connectTime}ms (${(connectTime / CONCURRENT_CLIENTS).toFixed(1)}ms / socket)`);
    console.log(`- Total Stock Events Received: ${totalStockEventsReceived} / ${expectedStockEvents}`);
    console.log(`- Total News Events Received: ${totalNewsEventsReceived} / ${expectedNewsEvents}`);
    console.log(`- Broadcast Propagation Time: ${adjustDuration}ms`);

    if (totalStockEventsReceived !== expectedStockEvents) {
      throw new Error(`Stock event count mismatch: expected ${expectedStockEvents}, got ${totalStockEventsReceived}`);
    }

    if (totalNewsEventsReceived !== expectedNewsEvents) {
      throw new Error(`News event count mismatch: expected ${expectedNewsEvents}, got ${totalNewsEventsReceived}`);
    }

    console.log('\n==================================================');
    console.log('🎉 50 CONCURRENT SOCKET CLIENTS LOAD TEST PASSED 100%!');
    console.log('==================================================\n');

    // Cleanup
    clients.forEach((s) => s.disconnect());
    server.close();
    await prisma.$disconnect();
  } catch (err) {
    console.error('❌ Load test failed:', err);
    server.close();
    await prisma.$disconnect();
    process.exit(1);
  }
}

runLoadTest();
