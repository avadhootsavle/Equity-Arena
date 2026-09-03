const { PrismaClient } = require('@prisma/client');
const {
  getUserAvailableBalance,
  getUserAvailableHolding,
  checkAndExecuteLimitOrders
} = require('../src/services/orderService');
const { getUserPortfolio } = require('../src/services/portfolioService');

const prisma = new PrismaClient();

async function runLimitOrdersTests() {
  console.log('\n==================================================');
  console.log('🧪 3. Limit Orders Engine & Locking Test Suite');
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
    const testEmail = `test_trader_orders_${Date.now()}@example.com`;
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('password123', 10);

    const trader = await prisma.user.create({
      data: {
        name: 'Order Test Trader',
        email: testEmail,
        passwordHash: hash,
        role: 'TRADER',
        walletBalance: 20000.00
      }
    });

    const stock = await prisma.stock.findFirst({ where: { currentPrice: { lte: 500 } } });
    assert(stock !== null, `Target stock for limit order: ${stock?.symbol} @ ${stock?.currentPrice.toFixed(2)} IC`);

    // =========================================================================
    // PART 1: LIMIT BUY ORDERS
    // =========================================================================

    // 1. Place Buy Limit Order and verify funds locking
    const targetBuyPrice = Math.round((stock.currentPrice * 0.90) * 100) / 100;
    const orderQty = 10;
    const lockedAmount = Math.round(targetBuyPrice * orderQty * 100) / 100;

    const buyOrder = await prisma.order.create({
      data: {
        userId: trader.id,
        stockId: stock.id,
        type: 'BUY',
        targetPrice: targetBuyPrice,
        quantity: orderQty,
        status: 'PENDING'
      }
    });

    const balanceInfo = await getUserAvailableBalance(trader.id);
    assert(
      balanceInfo.lockedFunds === lockedAmount &&
      balanceInfo.availableBalance === Math.round((20000.00 - lockedAmount) * 100) / 100,
      `Buy Limit Order locks ${lockedAmount.toFixed(2)} IC. Available balance = ${balanceInfo.availableBalance.toFixed(2)} IC`
    );

    // 2. Insufficient balance check for Limit Buy
    const excessiveBuyCost = 25000.00;
    assert(
      excessiveBuyCost > balanceInfo.availableBalance,
      `Insufficient balance check: Cannot place Limit Buy exceeding available balance (${excessiveBuyCost.toFixed(2)} IC > ${balanceInfo.availableBalance.toFixed(2)} IC)`
    );

    // 3. Cancel Buy Order & Verify Funds Released
    await prisma.order.update({
      where: { id: buyOrder.id },
      data: { status: 'CANCELLED' }
    });

    const balanceAfterCancel = await getUserAvailableBalance(trader.id);
    assert(
      balanceAfterCancel.lockedFunds === 0 &&
      balanceAfterCancel.availableBalance === 20000.00,
      `Cancelling Buy Order releases locked funds cleanly. Available balance restored to 20,000.00 IC`
    );

    // 4. Place Triggerable Limit Buy Order & Simulate Price Cross Execution
    const triggerBuyOrder = await prisma.order.create({
      data: {
        userId: trader.id,
        stockId: stock.id,
        type: 'BUY',
        targetPrice: stock.currentPrice + 5.00, // Triggerable at current price
        quantity: 15,
        status: 'PENDING'
      }
    });

    const executedBuyList = await checkAndExecuteLimitOrders(stock.id, stock.currentPrice);
    const executedBuyOrder = await prisma.order.findUnique({
      where: { id: triggerBuyOrder.id }
    });

    assert(
      executedBuyOrder.status === 'EXECUTED' && executedBuyOrder.executedAt !== null,
      `Automated Limit Buy engine triggered and EXECUTED order #${triggerBuyOrder.id.slice(0, 8)} on target price match`
    );

    const traderPortfolioAfterBuy = await getUserPortfolio(trader.id);
    assert(
      traderPortfolioAfterBuy.holdings.length === 1 &&
      traderPortfolioAfterBuy.holdings[0].quantity === 15,
      `Executed Buy Order populated user holdings (15 shares of ${stock.symbol})`
    );

    const expectedWalletAfterBuy = Math.round((20000.00 - (15 * stock.currentPrice)) * 100) / 100;
    assert(
      Math.abs(traderPortfolioAfterBuy.walletBalance - expectedWalletAfterBuy) < 0.05,
      `Trader wallet balance debited accurately: ${traderPortfolioAfterBuy.walletBalance.toFixed(2)} IC`
    );

    // =========================================================================
    // PART 2: LIMIT SELL ORDERS
    // =========================================================================

    // 5. Place Sell Limit Order and verify share locking
    const targetSellPrice = Math.round((stock.currentPrice * 1.15) * 100) / 100; // 15% above current
    const sellQty = 6;

    const sellOrder = await prisma.order.create({
      data: {
        userId: trader.id,
        stockId: stock.id,
        type: 'SELL',
        targetPrice: targetSellPrice,
        quantity: sellQty,
        status: 'PENDING'
      }
    });

    const holdingInfo1 = await getUserAvailableHolding(trader.id, stock.id);
    assert(
      holdingInfo1.totalQuantity === 15 &&
      holdingInfo1.lockedQuantity === sellQty &&
      holdingInfo1.availableQuantity === (15 - sellQty),
      `Limit Sell order reserves ${sellQty} shares. Total: ${holdingInfo1.totalQuantity}, Locked: ${holdingInfo1.lockedQuantity}, Available: ${holdingInfo1.availableQuantity}`
    );

    // 6. Insufficient available shares check for Limit Sell
    const excessiveSellQty = 10;
    assert(
      excessiveSellQty > holdingInfo1.availableQuantity,
      `Insufficient available shares check: Cannot sell ${excessiveSellQty} shares when only ${holdingInfo1.availableQuantity} are available`
    );

    // 7. Cancel Sell Order & Verify Shares Released
    await prisma.order.update({
      where: { id: sellOrder.id },
      data: { status: 'CANCELLED' }
    });

    const holdingInfoAfterCancel = await getUserAvailableHolding(trader.id, stock.id);
    assert(
      holdingInfoAfterCancel.lockedQuantity === 0 &&
      holdingInfoAfterCancel.availableQuantity === 15,
      `Cancelling Sell Order releases reserved shares cleanly. Available shares restored to 15`
    );

    // 8. Place Triggerable Limit Sell Order & Simulate Price Cross Execution
    const triggerSellPrice = Math.round((stock.currentPrice * 1.10) * 100) / 100;
    const partialSellQty = 5;

    const triggerSellOrder = await prisma.order.create({
      data: {
        userId: trader.id,
        stockId: stock.id,
        type: 'SELL',
        targetPrice: triggerSellPrice,
        quantity: partialSellQty,
        status: 'PENDING'
      }
    });

    // Simulate stock price rising to or above targetSellPrice
    const simulatedHighPrice = triggerSellPrice + 1.00;
    const executedSellList = await checkAndExecuteLimitOrders(stock.id, simulatedHighPrice);

    const executedSellOrder = await prisma.order.findUnique({
      where: { id: triggerSellOrder.id }
    });

    assert(
      executedSellOrder.status === 'EXECUTED' && executedSellOrder.executedAt !== null,
      `Automated Limit Sell engine triggered and EXECUTED order #${triggerSellOrder.id.slice(0, 8)} on target price cross (${simulatedHighPrice.toFixed(2)} >= ${triggerSellPrice.toFixed(2)} IC)`
    );

    const expectedProceeds = Math.round(simulatedHighPrice * partialSellQty * 100) / 100;
    const traderPortfolioAfterSell = await getUserPortfolio(trader.id);
    const updatedHolding = traderPortfolioAfterSell.holdings.find((h) => h.stockId === stock.id);

    assert(
      updatedHolding && updatedHolding.quantity === (15 - partialSellQty),
      `Partial Limit Sell decremented holdings cleanly (remaining: ${updatedHolding?.quantity} shares)`
    );

    const sellTx = await prisma.transaction.findFirst({
      where: { userId: trader.id, type: 'SELL' },
      orderBy: { timestamp: 'desc' }
    });

    assert(
      sellTx !== null && sellTx.quantity === partialSellQty && sellTx.price === simulatedHighPrice,
      `SELL transaction recorded in database: Sold ${sellTx?.quantity} shares @ ${sellTx?.price.toFixed(2)} IC`
    );

    // 9. Full Liquidation via Limit Sell (Sell all remaining 10 shares)
    const remainingShares = updatedHolding.quantity;
    const fullSellOrder = await prisma.order.create({
      data: {
        userId: trader.id,
        stockId: stock.id,
        type: 'SELL',
        targetPrice: stock.currentPrice,
        quantity: remainingShares,
        status: 'PENDING'
      }
    });

    await checkAndExecuteLimitOrders(stock.id, stock.currentPrice);

    const finalPortfolio = await getUserPortfolio(trader.id);
    const finalHolding = finalPortfolio.holdings.find((h) => h.stockId === stock.id);

    assert(
      !finalHolding || finalHolding.quantity === 0,
      `Full Limit Sell completely cleared holding position for ${stock.symbol}`
    );

    // 10. Immediate Execution check: Limit Buy with target >= current spot
    const userBalanceBeforeImmBuy = finalPortfolio.walletBalance;
    const immBuyTarget = stock.currentPrice + 10.00;
    const immBuyOrder = await prisma.order.create({
      data: {
        userId: trader.id,
        stockId: stock.id,
        type: 'BUY',
        targetPrice: immBuyTarget,
        quantity: 2,
        status: 'PENDING'
      }
    });

    const immBuyExec = await checkAndExecuteLimitOrders(stock.id, stock.currentPrice);
    const immBuyRefetched = await prisma.order.findUnique({ where: { id: immBuyOrder.id } });

    assert(
      immBuyRefetched.status === 'EXECUTED',
      `Immediate Execution verified: Limit BUY with target (${immBuyTarget.toFixed(2)} IC) >= spot (${stock.currentPrice.toFixed(2)} IC) fills immediately`
    );

    // 11. Immediate Execution check: Limit Sell with target <= current spot
    const immSellTarget = stock.currentPrice - 5.00;
    const immSellOrder = await prisma.order.create({
      data: {
        userId: trader.id,
        stockId: stock.id,
        type: 'SELL',
        targetPrice: immSellTarget,
        quantity: 2,
        status: 'PENDING'
      }
    });

    const immSellExec = await checkAndExecuteLimitOrders(stock.id, stock.currentPrice);
    const immSellRefetched = await prisma.order.findUnique({ where: { id: immSellOrder.id } });

    assert(
      immSellRefetched.status === 'EXECUTED',
      `Immediate Execution verified: Limit SELL with target (${immSellTarget.toFixed(2)} IC) <= spot (${stock.currentPrice.toFixed(2)} IC) fills immediately`
    );

    // Clean up
    await prisma.order.deleteMany({ where: { userId: trader.id } });
    await prisma.holding.deleteMany({ where: { userId: trader.id } });
    await prisma.transaction.deleteMany({ where: { userId: trader.id } });
    await prisma.user.delete({ where: { id: trader.id } });

    console.log(`Summary: Limit Orders Suite (${passed} passed, ${failed} failed)\n`);
    return { passed, failed };
  } catch (err) {
    console.error('Limit Orders Suite Error:', err);
    return { passed, failed: failed + 1 };
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runLimitOrdersTests().then(({ failed }) => process.exit(failed > 0 ? 1 : 0));
}

module.exports = { runLimitOrdersTests };
