const { server } = require('../src/index');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../src/utils/auth');

const prisma = new PrismaClient();
const PORT = 5075;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runPhase14Tests() {
  console.log('\n================================================================');
  console.log('🧪 STARTING PHASE 14 LIMIT ORDERS TEST SUITE');
  console.log('================================================================\n');

  await new Promise((resolve, reject) => {
    server.listen(PORT, '127.0.0.1', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  console.log(`✅ Backend server listening on ${BASE_URL}`);

  try {
    // 1. Create Test Trader
    const testUser = await prisma.user.create({
      data: {
        name: 'Phase 14 Trader',
        email: `phase14_${Date.now()}@test.com`,
        passwordHash: 'hashed_password',
        role: 'TRADER',
        walletBalance: 20000.0,
        isTestAccount: true
      }
    });

    const token = generateToken(testUser);
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Get stock
    const stock = await prisma.stock.findFirst();
    console.log(`Target Stock: ${stock.symbol} (Current Price: ${stock.currentPrice} IC)`);

    // 2. Test Limit Buy Order Placement & Balance Reservation
    console.log('\n--- 1. Testing Limit Buy Order Placement & Balance Reservation ---');
    const targetPriceBuy = Math.round((stock.currentPrice * 0.8) * 100) / 100; // 20% below market
    const buyQty = 10;
    const expectedBuyCost = Math.round(targetPriceBuy * buyQty * 100) / 100;

    const buyOrderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        stockId: stock.id,
        type: 'BUY',
        targetPrice: targetPriceBuy,
        quantity: buyQty
      })
    });

    const buyOrderData = await buyOrderRes.json();
    console.log('Limit Buy Order Placement Response:', buyOrderData.message);

    if (buyOrderRes.status !== 201 || buyOrderData.order.status !== 'PENDING') {
      throw new Error('Limit Buy order placement failed');
    }
    console.log('✅ Limit Buy Order created with status PENDING!');

    // Verify Portfolio Math (available vs total)
    const portRes1 = await fetch(`${BASE_URL}/portfolio`, { headers: authHeaders });
    const portData1 = await portRes1.json();
    console.log(`Total Wallet: ${portData1.walletBalance} IC | Locked Funds: ${portData1.lockedFunds} IC | Available Balance: ${portData1.availableWalletBalance} IC`);

    if (portData1.lockedFunds !== expectedBuyCost || portData1.availableWalletBalance !== (20000 - expectedBuyCost)) {
      throw new Error(`Available wallet calculation incorrect. Expected locked: ${expectedBuyCost}`);
    }
    console.log('✅ Balance reservation verified! Available wallet balance updated.');

    // Wait for rate limiter cooldown
    await new Promise((r) => setTimeout(r, 500));

    // 3. Test Double-Spend Rejection
    console.log('\n--- 2. Testing Double-Spend Rejection ---');
    const excessiveBuyRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        stockId: stock.id,
        type: 'BUY',
        targetPrice: 20000,
        quantity: 2
      })
    });
    const excessiveBuyData = await excessiveBuyRes.json();
    console.log('Excessive Order Response Status:', excessiveBuyRes.status, '| Error:', excessiveBuyData.error);

    if (excessiveBuyRes.status !== 400) {
      throw new Error('Double-spend order was not rejected');
    }
    console.log('✅ Double-spend order rejected with 400 Bad Request!');

    // 4. Test Automated Limit Buy Execution on Price Drop
    console.log('\n--- 3. Testing Automated Limit Buy Execution on Price Drop ---');
    const { checkAndExecuteLimitOrders } = require('../src/services/orderService');

    // Simulate price drop to or below targetPriceBuy
    const executedBuyOrders = await checkAndExecuteLimitOrders(stock.id, targetPriceBuy);
    console.log(`Executed Limit Orders count on price drop: ${executedBuyOrders.length}`);

    if (executedBuyOrders.length === 0 || executedBuyOrders[0].status !== 'EXECUTED') {
      throw new Error('Limit Buy order failed to execute on price drop');
    }
    console.log('✅ Limit Buy Order executed automatically on price drop!');

    // Verify holding created
    const portRes2 = await fetch(`${BASE_URL}/portfolio`, { headers: authHeaders });
    const portData2 = await portRes2.json();
    console.log('Updated Holdings after execution:', portData2.holdings);

    const holding = portData2.holdings.find((h) => h.stockId === stock.id);
    if (!holding || holding.quantity !== buyQty) {
      throw new Error('Holding not correctly updated after Limit Buy execution');
    }
    console.log('✅ Trader holding updated with 10 shares!');

    // Wait for rate limiter cooldown
    await new Promise((r) => setTimeout(r, 500));

    // 5. Test Limit Sell Order Placement & Share Locking
    console.log('\n--- 4. Testing Limit Sell Order Placement & Share Locking ---');
    const targetPriceSell = Math.round((stock.currentPrice * 1.3) * 100) / 100; // 30% above market
    const sellQty = 6;

    const sellOrderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        stockId: stock.id,
        type: 'SELL',
        targetPrice: targetPriceSell,
        quantity: sellQty
      })
    });

    const sellOrderData = await sellOrderRes.json();
    console.log('Limit Sell Order Placement Response:', sellOrderData.message);

    if (sellOrderRes.status !== 201 || sellOrderData.order.status !== 'PENDING') {
      throw new Error('Limit Sell order placement failed');
    }
    console.log('✅ Limit Sell Order created with status PENDING!');

    // Verify Share Locking
    const portRes3 = await fetch(`${BASE_URL}/portfolio`, { headers: authHeaders });
    const portData3 = await portRes3.json();
    const updatedHolding = portData3.holdings.find((h) => h.stockId === stock.id);
    console.log(`Total Shares: ${updatedHolding.quantity} | Locked: ${updatedHolding.lockedQuantity} | Available: ${updatedHolding.availableQuantity}`);

    if (updatedHolding.lockedQuantity !== sellQty || updatedHolding.availableQuantity !== (buyQty - sellQty)) {
      throw new Error('Share locking calculation incorrect');
    }
    console.log('✅ Share locking verified! Available shares updated.');

    // 6. Test Order Cancellation
    console.log('\n--- 5. Testing Order Cancellation & Unlocking ---');
    const cancelRes = await fetch(`${BASE_URL}/orders/${sellOrderData.order.id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const cancelData = await cancelRes.json();
    console.log('Cancellation Response:', cancelData.message);

    if (cancelRes.status !== 200 || cancelData.order.status !== 'CANCELLED') {
      throw new Error('Order cancellation failed');
    }

    const portRes4 = await fetch(`${BASE_URL}/portfolio`, { headers: authHeaders });
    const portData4 = await portRes4.json();
    const unlockedHolding = portData4.holdings.find((h) => h.stockId === stock.id);
    console.log(`After Cancel -> Total Shares: ${unlockedHolding.quantity} | Locked: ${unlockedHolding.lockedQuantity} | Available: ${unlockedHolding.availableQuantity}`);

    if (unlockedHolding.lockedQuantity !== 0 || unlockedHolding.availableQuantity !== buyQty) {
      throw new Error('Shares were not unlocked upon cancellation');
    }
    console.log('✅ Order cancelled and locked shares released to available balance!');

    // Cleanup
    await prisma.user.delete({ where: { id: testUser.id } });
    server.close();
    await prisma.$disconnect();

    console.log('\n================================================================');
    console.log('🎉 ALL PHASE 14 LIMIT ORDER TESTS PASSED CLEANLY!');
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Phase 14 test failed:', err);
    server.close();
    await prisma.$disconnect();
    process.exit(1);
  }
}

runPhase14Tests();
