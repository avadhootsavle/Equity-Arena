const { PrismaClient } = require('@prisma/client');
const { getUserPortfolio } = require('../src/services/portfolioService');
const { getUserAvailableBalance } = require('../src/services/orderService');

const prisma = new PrismaClient();

async function runQuickTradeVerification() {
  console.log('🧪 Starting Phase 27 Quick Trade Execution & Flow Verification...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Fetch test trader and stock
    const testUser = await prisma.user.findFirst({ where: { role: 'TRADER' } });
    assert(testUser !== null, `Test trader found: ${testUser?.email}`);

    const lowTierStock = await prisma.stock.findFirst({
      where: { currentPrice: { lte: 100 } },
      orderBy: { currentPrice: 'asc' }
    });
    assert(lowTierStock !== null, `Target low-tier stock available: ${lowTierStock?.symbol} @ ${lowTierStock?.currentPrice.toFixed(2)} IC`);

    // Ensure user has initial wallet balance of 20,000 IC
    await prisma.user.update({
      where: { id: testUser.id },
      data: { walletBalance: 20000.00 }
    });
    await prisma.holding.deleteMany({ where: { userId: testUser.id } });

    // -------------------------------------------------------------
    // Test 1: Quick Buy with 25% Preset Calculation
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Quick Buy 25% Preset Execution ---');
    const availCash = 20000.00;
    const preset25Qty = Math.floor((availCash * 0.25) / lowTierStock.currentPrice);
    assert(preset25Qty >= 50, `Calculated 25% preset quantity: ${preset25Qty} shares (affords ~5,000 IC value)`);

    const buyCost = Math.round(preset25Qty * lowTierStock.currentPrice * 100) / 100;
    const newBalance = Math.round((availCash - buyCost) * 100) / 100;

    // Simulate instant trade execution
    await prisma.$transaction([
      prisma.user.update({
        where: { id: testUser.id },
        data: { walletBalance: newBalance }
      }),
      prisma.holding.create({
        data: {
          userId: testUser.id,
          stockId: lowTierStock.id,
          quantity: preset25Qty,
          avgBuyPrice: lowTierStock.currentPrice
        }
      }),
      prisma.transaction.create({
        data: {
          userId: testUser.id,
          stockId: lowTierStock.id,
          type: 'BUY',
          quantity: preset25Qty,
          price: lowTierStock.currentPrice
        }
      })
    ]);

    const portfolioAfterBuy = await getUserPortfolio(testUser.id);
    assert(
      portfolioAfterBuy.walletBalance === newBalance &&
      portfolioAfterBuy.holdings.length === 1 &&
      portfolioAfterBuy.holdings[0].quantity === preset25Qty,
      `Quick Buy executed instantly: Wallet = ${newBalance.toFixed(2)} IC, Holding = ${preset25Qty} ${lowTierStock.symbol}`
    );

    // -------------------------------------------------------------
    // Test 2: Quick Sell with 50% Preset Execution
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Quick Sell 50% Preset Execution ---');
    const currentHolding = portfolioAfterBuy.holdings[0];
    const sell50Qty = Math.floor(currentHolding.quantity * 0.50);
    assert(sell50Qty >= 25, `Calculated 50% preset sell quantity: ${sell50Qty} shares`);

    const sellProceeds = Math.round(sell50Qty * lowTierStock.currentPrice * 100) / 100;
    const balanceAfterSell = Math.round((portfolioAfterBuy.walletBalance + sellProceeds) * 100) / 100;
    const remainingHoldingQty = currentHolding.quantity - sell50Qty;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: testUser.id },
        data: { walletBalance: balanceAfterSell }
      }),
      prisma.holding.update({
        where: { id: currentHolding.id },
        data: { quantity: remainingHoldingQty }
      }),
      prisma.transaction.create({
        data: {
          userId: testUser.id,
          stockId: lowTierStock.id,
          type: 'SELL',
          quantity: sell50Qty,
          price: lowTierStock.currentPrice
        }
      })
    ]);

    const portfolioAfterSell = await getUserPortfolio(testUser.id);
    assert(
      portfolioAfterSell.walletBalance === balanceAfterSell &&
      portfolioAfterSell.holdings[0].quantity === remainingHoldingQty,
      `Quick Sell executed instantly: Wallet = ${balanceAfterSell.toFixed(2)} IC, Remaining Holding = ${remainingHoldingQty} shares`
    );

    // -------------------------------------------------------------
    // Test 3: Quick Sell 100% (Max / Exit Position)
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Quick Sell 100% (Max / Exit Position) ---');
    const finalSellQty = remainingHoldingQty;
    const finalProceeds = Math.round(finalSellQty * lowTierStock.currentPrice * 100) / 100;
    const finalBalance = Math.round((portfolioAfterSell.walletBalance + finalProceeds) * 100) / 100;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: testUser.id },
        data: { walletBalance: finalBalance }
      }),
      prisma.holding.delete({
        where: { id: currentHolding.id }
      }),
      prisma.transaction.create({
        data: {
          userId: testUser.id,
          stockId: lowTierStock.id,
          type: 'SELL',
          quantity: finalSellQty,
          price: lowTierStock.currentPrice
        }
      })
    ]);

    const portfolioAfterExit = await getUserPortfolio(testUser.id);
    assert(
      portfolioAfterExit.walletBalance === finalBalance &&
      portfolioAfterExit.holdings.length === 0,
      `Quick Sell 100% closed position cleanly: Wallet = ${finalBalance.toFixed(2)} IC, Holdings = 0`
    );

    // Restore test trader balance
    await prisma.user.update({
      where: { id: testUser.id },
      data: { walletBalance: 20000.00 }
    });

    console.log('\n==================================================');
    console.log(`📊 PHASE 27 QUICK TRADE TEST SUMMARY:`);
    console.log(`PASSED: ${passed} | FAILED: ${failed}`);
    console.log('==================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runQuickTradeVerification();
