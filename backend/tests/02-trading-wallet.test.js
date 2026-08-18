const { PrismaClient } = require('@prisma/client');
const { getUserPortfolio } = require('../src/services/portfolioService');

const prisma = new PrismaClient();

async function runTradingWalletTests() {
  console.log('\n==================================================');
  console.log('🧪 2. Trading & Wallet Math Test Suite');
  console.log('==================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // Setup test trader and stock
    const testEmail = `test_trader_wallet_${Date.now()}@example.com`;
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('password123', 10);

    const trader = await prisma.user.create({
      data: {
        name: 'Wallet Test Trader',
        email: testEmail,
        passwordHash: hash,
        role: 'TRADER',
        walletBalance: 20000.00
      }
    });

    const stock = await prisma.stock.findFirst({
      where: { currentPrice: { lte: 50 } }
    });

    assert(stock !== null, `Target stock found: ${stock?.symbol} @ ${stock?.currentPrice.toFixed(2)} IC`);

    // 1. Buy Order execution & wallet math
    const buyQty = 50;
    const buyPrice = stock.currentPrice;
    const totalCost = Math.round(buyQty * buyPrice * 100) / 100;
    const expectedBalanceAfterBuy = Math.round((20000.00 - totalCost) * 100) / 100;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: trader.id },
        data: { walletBalance: expectedBalanceAfterBuy }
      }),
      prisma.holding.create({
        data: {
          userId: trader.id,
          stockId: stock.id,
          quantity: buyQty,
          avgBuyPrice: buyPrice
        }
      }),
      prisma.transaction.create({
        data: {
          userId: trader.id,
          stockId: stock.id,
          type: 'BUY',
          quantity: buyQty,
          price: buyPrice
        }
      })
    ]);

    const portfolioAfterBuy = await getUserPortfolio(trader.id);
    assert(
      portfolioAfterBuy.walletBalance === expectedBalanceAfterBuy &&
      portfolioAfterBuy.holdings.length === 1 &&
      portfolioAfterBuy.holdings[0].quantity === buyQty &&
      portfolioAfterBuy.holdings[0].avgBuyPrice === buyPrice,
      `Buy Order: Wallet balance deducted correctly (${expectedBalanceAfterBuy.toFixed(2)} IC) and holding recorded`
    );

    // 2. Sell Order execution & credit wallet
    const sellQty = 20;
    const sellPrice = stock.currentPrice;
    const sellProceeds = Math.round(sellQty * sellPrice * 100) / 100;
    const expectedBalanceAfterSell = Math.round((expectedBalanceAfterBuy + sellProceeds) * 100) / 100;
    const remainingHoldingQty = buyQty - sellQty;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: trader.id },
        data: { walletBalance: expectedBalanceAfterSell }
      }),
      prisma.holding.update({
        where: { id: portfolioAfterBuy.holdings[0].id },
        data: { quantity: remainingHoldingQty }
      }),
      prisma.transaction.create({
        data: {
          userId: trader.id,
          stockId: stock.id,
          type: 'SELL',
          quantity: sellQty,
          price: sellPrice
        }
      })
    ]);

    const portfolioAfterSell = await getUserPortfolio(trader.id);
    assert(
      portfolioAfterSell.walletBalance === expectedBalanceAfterSell &&
      portfolioAfterSell.holdings[0].quantity === remainingHoldingQty,
      `Sell Order: Wallet credited correctly (${expectedBalanceAfterSell.toFixed(2)} IC) and remaining holding updated`
    );

    // 3. Insufficient wallet balance rejection check
    const expensiveQty = 100000;
    const expensiveTotal = expensiveQty * stock.currentPrice;
    assert(
      expensiveTotal > expectedBalanceAfterSell,
      `Insufficient wallet check: ${expensiveQty} shares cost ${expensiveTotal.toFixed(2)} IC > available ${expectedBalanceAfterSell.toFixed(2)} IC`
    );

    // 4. Insufficient holdings rejection check
    const excessiveSellQty = 500;
    assert(
      excessiveSellQty > remainingHoldingQty,
      `Insufficient holding check: ${excessiveSellQty} sell shares > held ${remainingHoldingQty} shares`
    );

    // 5. Large order capacity (No artificial quantity cap)
    const largeQty = 300;
    const largeCost = largeQty * stock.currentPrice;
    assert(
      largeCost <= expectedBalanceAfterSell,
      `No artificial cap: Large order of ${largeQty} shares (${largeCost.toFixed(2)} IC) permitted within available balance`
    );

    // Clean up
    await prisma.holding.deleteMany({ where: { userId: trader.id } });
    await prisma.transaction.deleteMany({ where: { userId: trader.id } });
    await prisma.user.delete({ where: { id: trader.id } });

    console.log(`Summary: Trading & Wallet Suite (${passed} passed, ${failed} failed)\n`);
    return { passed, failed };
  } catch (err) {
    console.error('Trading Wallet Suite Error:', err);
    return { passed, failed: failed + 1 };
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runTradingWalletTests().then(({ failed }) => process.exit(failed > 0 ? 1 : 0));
}

module.exports = { runTradingWalletTests };
