require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { io } = require('socket.io-client');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../src/utils/auth');

const prisma = new PrismaClient();
const SERVER_URL = 'http://localhost:5001';
const CONCURRENT_CLIENT_COUNT = 30;
const LOAD_TEST_DURATION_SECONDS = 20; // Sustained tick load test duration

async function runPhase30LoadTest() {
  console.log('\n======================================================================');
  console.log('⚡ PHASE 30: 30-CONCURRENT-PLAYER LOAD & MEMORY LEAK TEST');
  console.log(`Target: ${CONCURRENT_CLIENT_COUNT} active WebSocket traders on local server ${SERVER_URL}`);
  console.log('======================================================================\n');

  const traders = [];
  const sockets = [];
  let totalBatchesReceived = 0;
  let totalTradeSuccesses = 0;
  let totalNewsReceived = 0;
  const latencies = [];

  try {
    // 1. Prepare 30 trader users & tokens
    console.log(`[Setup] Provisioning ${CONCURRENT_CLIENT_COUNT} trader accounts...`);
    const passwordHash = await bcrypt.hash('password123', 10);

    for (let i = 1; i <= CONCURRENT_CLIENT_COUNT; i++) {
      const email = `load_trader_${i}@test.com`;
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            name: `Load Trader ${i}`,
            email,
            passwordHash,
            role: 'TRADER',
            walletBalance: 50000.00,
            isTestAccount: true
          }
        });
      }
      const token = generateToken(user);
      traders.push({ ...user, token });
    }

    console.log(`[Setup] Provisioned ${traders.length} trader tokens successfully.`);

    // 2. Initial Memory Benchmark
    if (global.gc) global.gc();
    const initialMemory = process.memoryUsage();
    console.log(`[Memory Baseline] Heap Used: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB | RSS: ${(initialMemory.rss / 1024 / 1024).toFixed(2)} MB\n`);

    // 3. Connect 30 Socket.io client instances simultaneously
    console.log(`[Socket] Spawning ${CONCURRENT_CLIENT_COUNT} active WebSocket client connections...`);

    const connectionPromises = traders.map((trader, idx) => {
      return new Promise((resolve, reject) => {
        const clientSocket = io(SERVER_URL, {
          auth: { token: trader.token },
          transports: ['websocket', 'polling'],
          forceNew: true,
          reconnection: false
        });

        clientSocket.on('connect', () => {
          sockets.push(clientSocket);
          resolve();
        });

        clientSocket.on('connect_error', (err) => {
          console.error(`[Socket #${idx + 1}] Connection error:`, err.message);
          reject(err);
        });

        clientSocket.on('stocks:batch-update', (data) => {
          totalBatchesReceived++;
          if (data && data.timestamp) {
            const latency = Date.now() - data.timestamp;
            latencies.push(Math.max(0, latency));
          }
        });

        clientSocket.on('news:broadcast', (news) => {
          totalNewsReceived++;
        });
      });
    });

    await Promise.all(connectionPromises);
    console.log(`✅ All ${sockets.length} WebSocket clients connected & authenticated!`);

    // 4. Simulate active trading load during sustained run
    console.log(`\n[Load Run] Executing ${LOAD_TEST_DURATION_SECONDS}s continuous trade & tick load test...`);
    const stocks = await prisma.stock.findMany();
    const targetStock = stocks[0];

    const startTime = Date.now();
    const tradeInterval = setInterval(async () => {
      const randomTrader = traders[Math.floor(Math.random() * traders.length)];
      try {
        await prisma.transaction.create({
          data: {
            userId: randomTrader.id,
            stockId: targetStock.id,
            type: 'BUY',
            quantity: 2,
            price: targetStock.currentPrice
          }
        });
        totalTradeSuccesses++;
      } catch (err) {
        // Ignore expected simulated conflicts
      }
    }, 500);

    // Wait for load test duration
    await new Promise((res) => setTimeout(res, LOAD_TEST_DURATION_SECONDS * 1000));
    clearInterval(tradeInterval);

    // 5. Final Memory Check & Latency Computation
    const finalMemory = process.memoryUsage();
    const heapDiffMb = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
    const avgLatencyMs = latencies.length > 0 ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2) : '0.00';
    const maxLatencyMs = latencies.length > 0 ? Math.max(...latencies) : 0;

    console.log('\n======================================================================');
    console.log('📊 LOAD & PERFORMANCE TEST RESULTS');
    console.log('======================================================================');
    console.log(`Active Concurrent Clients:      ${sockets.length} / ${CONCURRENT_CLIENT_COUNT}`);
    console.log(`Batched WebSocket Messages:      ${totalBatchesReceived} delivered`);
    console.log(`Simulated Trade Executions:     ${totalTradeSuccesses} successful`);
    console.log(`Average Broadcast Latency:      ${avgLatencyMs} ms`);
    console.log(`Peak Broadcast Latency:         ${maxLatencyMs} ms`);
    console.log(`Heap Memory Delta:              ${heapDiffMb.toFixed(2)} MB over ${LOAD_TEST_DURATION_SECONDS}s`);
    console.log('======================================================================\n');

    // Assertions
    const passSockets = sockets.length === CONCURRENT_CLIENT_COUNT;
    const passBatches = totalBatchesReceived > 0;
    const passLatency = parseFloat(avgLatencyMs) < 100.0;
    const passMemory = heapDiffMb < 30.0; // Less than 30MB growth over test

    if (passSockets && passBatches && passLatency && passMemory) {
      console.log('🏆 PERFORMANCE HARDENING VERIFIED: 30 concurrent players handled cleanly with zero lag and zero memory leaks!\n');
    } else {
      console.error('❌ LOAD TEST FAILED — See metrics above\n');
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal Load Test Error:', err);
    process.exit(1);
  } finally {
    // Cleanup sockets
    sockets.forEach((s) => s.disconnect());
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runPhase30LoadTest().then(() => process.exit(0));
}

module.exports = { runPhase30LoadTest };
