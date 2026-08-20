const { io: Client } = require('socket.io-client');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}`;

async function runLanBenchmark() {
  console.log(`\n======================================================================`);
  console.log(`📊 EQUITY ARENA — LAN SERVER LOAD CAPACITY & STRESS TEST BENCHMARK`);
  console.log(`======================================================================\n`);

  // Ensure active session exists and is ACTIVE for trading test
  try {
    const { startNewSession } = require('../src/services/sessionService');
    await startNewSession({ durationMinutes: 180, force: true });
    console.log('✅ Fresh ACTIVE 3-hour trading session started for benchmark.');
  } catch (e) {
    console.error('Session prep warning:', e.message);
  }

  // Get Admin Auth Token
  let adminToken = '';
  try {
    const adminRes = await fetch(`${BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'admin123' })
    });
    const adminData = await adminRes.json();
    adminToken = adminData.token;
  } catch (e) {
    console.error('Admin auth failed:', e.message);
  }

  // Fetch Stock list for trading targets
  const stocks = await (await fetch(`${BASE_URL}/stocks`)).json();
  const testStock = stocks[0];
  console.log(`🎯 Test Target Stock: ${testStock.symbol} (ID: ${testStock.id}, Spot Price: ${testStock.currentPrice} IC)`);

  const clientLevels = [10, 25, 50, 100, 200];
  const benchmarkResults = [];

  for (const clientCount of clientLevels) {
    console.log(`\n----------------------------------------------------------------------`);
    console.log(`🧪 RUNNING BENCHMARK FOR ${clientCount} CONCURRENT LAN TRADERS...`);
    console.log(`----------------------------------------------------------------------`);

    const sockets = [];
    const tokens = [];
    const latencies = [];

    // Phase A: User Auth & Socket.IO Connection
    const connectStart = Date.now();
    for (let i = 0; i < clientCount; i++) {
      const email = `lan_load_trader_${i}@arena.local`;
      let token;
      try {
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `LAN Trader ${i}`, email, password: 'password123' })
        });
        const regData = await regRes.json();
        token = regData.token;
      } catch (e) {}

      if (!token) {
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: 'password123' })
        });
        const loginData = await loginRes.json();
        token = loginData.token;
      }
      tokens.push(token);

      const socket = Client(BASE_URL, {
        auth: { token },
        transports: ['websocket']
      });
      sockets.push(socket);
    }

    await Promise.all(
      sockets.map((s) =>
        new Promise((resolve) => {
          if (s.connected) resolve();
          else s.on('connect', resolve);
        })
      )
    );
    const connectTime = Date.now() - connectStart;
    console.log(`  ✅ Connected ${clientCount} WebSocket clients in ${connectTime}ms (${(connectTime / clientCount).toFixed(1)}ms / client)`);

    // Phase B: High-Frequency Concurrent Trading & API Operations
    let successCount = 0;
    let failCount = 0;
    const opStart = Date.now();

    const tradeProms = tokens.map(async (token, idx) => {
      const lanIp = `192.168.0.${10 + (idx % 200)}`;
      const t1 = Date.now();
      try {
        // 1. Fetch Portfolio
        const pRes = await fetch(`${BASE_URL}/portfolio`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Forwarded-For': lanIp
          }
        });
        if (!pRes.ok) {
          const txt = await pRes.text();
          throw new Error(`Portfolio fetch status ${pRes.status}: ${txt}`);
        }

        // 2. Execute Market Buy
        const bRes = await fetch(`${BASE_URL}/trade/buy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-Forwarded-For': lanIp
          },
          body: JSON.stringify({ stockId: testStock.id, quantity: 1 })
        });
        if (!bRes.ok) {
          const txt = await bRes.text();
          throw new Error(`Buy order status ${bRes.status}: ${txt}`);
        }

        // 450ms spacing to satisfy per-trader 400ms anti-spam trade cooldown
        await new Promise((r) => setTimeout(r, 450));

        // 3. Execute Market Sell
        const sRes = await fetch(`${BASE_URL}/trade/sell`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-Forwarded-For': lanIp
          },
          body: JSON.stringify({ stockId: testStock.id, quantity: 1 })
        });
        if (!sRes.ok) {
          const txt = await sRes.text();
          throw new Error(`Sell order status ${sRes.status}: ${txt}`);
        }

        const dur = Date.now() - t1;
        latencies.push(dur);
        successCount++;
      } catch (err) {
        if (failCount === 0) console.error(`  ⚠️ Example error (Trader ${idx}):`, err.message);
        failCount++;
      }
    });

    await Promise.all(tradeProms);
    const totalOpDurationMs = Date.now() - opStart;

    // Disconnect sockets after run
    sockets.forEach((s) => s.disconnect());

    // Calculate Statistics
    latencies.sort((a, b) => a - b);
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);
    const minLatency = latencies[0] || 0;
    const maxLatency = latencies[latencies.length - 1] || 0;
    const p95Latency = latencies[Math.floor(latencies.length * 0.95)] || maxLatency;
    const totalRequests = clientCount * 3; // 3 endpoints per client
    const rps = (totalRequests / (totalOpDurationMs / 1000)).toFixed(1);
    const memUsageMB = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);

    console.log(`  📈 Performance Stats (${clientCount} Traders):`);
    console.log(`     • Total API Operations: ${totalRequests} (${successCount} successful workflows)`);
    console.log(`     • Total Execution Time: ${totalOpDurationMs}ms`);
    console.log(`     • Throughput: ${rps} requests/sec`);
    console.log(`     • Avg Latency / Trader (3 Ops): ${avgLatency.toFixed(1)}ms`);
    console.log(`     • Min / Max Latency: ${minLatency}ms / ${maxLatency}ms`);
    console.log(`     • 95th Percentile Latency (p95): ${p95Latency}ms`);
    console.log(`     • Process RSS Memory: ${memUsageMB} MB`);

    benchmarkResults.push({
      clients: clientCount,
      totalRequests,
      totalDurationMs: totalOpDurationMs,
      rps: parseFloat(rps),
      avgLatencyMs: Math.round(avgLatency),
      minLatencyMs: minLatency,
      maxLatencyMs: maxLatency,
      p95LatencyMs: p95Latency,
      successRate: `${((successCount / clientCount) * 100).toFixed(1)}%`,
      rssMemoryMB: parseFloat(memUsageMB)
    });
  }

  console.log(`\n======================================================================`);
  console.log(`📋 CONSOLIDATED LAN SERVER CAPACITY BENCHMARK SUMMARY`);
  console.log(`======================================================================`);
  console.table(benchmarkResults);
  console.log(`======================================================================\n`);

  process.exit(0);
}

runLanBenchmark().catch((err) => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
