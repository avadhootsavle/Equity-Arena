/**
 * Test Suite 10: Portfolio & P&L Math Engine Tests
 */

async function runPortfolioPnLMathTests() {
  const { calculatePortfolio, STARTING_BALANCE } = await import('../../frontend/src/lib/portfolio.js');

  console.log('\n==================================================');
  console.log('🧪 10. Portfolio & P&L Math Test Suite');
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

  function assertInvariant(res, testName) {
    const isInvariantValid = Math.abs(res.portfolioValue - (STARTING_BALANCE + res.totalPnL)) < 0.001;
    assert(isInvariantValid, `${testName} — Invariant portfolioValue (${res.portfolioValue}) === 20000 + totalPnL (${res.totalPnL})`);
  }

  try {
    // Case 1: Fresh Account
    const fresh = calculatePortfolio(20000, 20000, [], []);
    assert(fresh.portfolioValue === 20000, 'Fresh account: portfolioValue === 20000');
    assert(fresh.totalPnL === 0, 'Fresh account: totalPnL === 0');
    assert(fresh.totalPnLPercent === 0, 'Fresh account: totalPnLPercent === 0%');
    assert(fresh.realizedPnL === 0, 'Fresh account: realizedPnL === 0');
    assert(fresh.unrealizedPnL === 0, 'Fresh account: unrealizedPnL === 0');
    assertInvariant(fresh, 'Fresh account');

    // Case 2: Buy with no price change
    // Buy 100 shares @ 50 IC. Cash = 15,000. Current price = 50 IC.
    const buySame = calculatePortfolio(20000, 15000, [{ stockId: 'S1', quantity: 100, avgBuyPrice: 50 }], [{ id: 'S1', currentPrice: 50 }]);
    assert(buySame.portfolioValue === 20000, 'Buy same price: portfolioValue === 20000');
    assert(buySame.totalPnL === 0, 'Buy same price: totalPnL === 0');
    assert(buySame.totalPnLPercent === 0, 'Buy same price: totalPnLPercent === 0%');
    assert(buySame.invested === 5000, 'Buy same price: invested === 5000');
    assertInvariant(buySame, 'Buy same price');

    // Case 3: Price Up
    // Price rises from 50 to 60 IC.
    const priceUp = calculatePortfolio(20000, 15000, [{ stockId: 'S1', quantity: 100, avgBuyPrice: 50 }], [{ id: 'S1', currentPrice: 60 }]);
    assert(priceUp.portfolioValue === 21000, 'Price up: portfolioValue === 21000');
    assert(priceUp.totalPnL === 1000, 'Price up: totalPnL === 1000');
    assert(priceUp.totalPnLPercent === 5.0, 'Price up: totalPnLPercent === 5.0%');
    assert(priceUp.unrealizedPnL === 1000, 'Price up: unrealizedPnL === 1000');
    assert(priceUp.realizedPnL === 0, 'Price up: realizedPnL === 0');
    assertInvariant(priceUp, 'Price up');

    // Case 4: Price Down
    // Price drops from 50 to 40 IC.
    const priceDown = calculatePortfolio(20000, 15000, [{ stockId: 'S1', quantity: 100, avgBuyPrice: 50 }], [{ id: 'S1', currentPrice: 40 }]);
    assert(priceDown.portfolioValue === 19000, 'Price down: portfolioValue === 19000');
    assert(priceDown.totalPnL === -1000, 'Price down: totalPnL === -1000');
    assert(priceDown.totalPnLPercent === -5.0, 'Price down: totalPnLPercent === -5.0%');
    assert(priceDown.unrealizedPnL === -1000, 'Price down: unrealizedPnL === -1000');
    assert(priceDown.realizedPnL === 0, 'Price down: realizedPnL === 0');
    assertInvariant(priceDown, 'Price down');

    // Case 5: Partial Sell
    // Bought 100 @ 50. Price = 60. Sold 40 @ 60 (gained 2400 cash). Cash = 17400. Remaining: 60 @ 50, current 60.
    const partialSell = calculatePortfolio(20000, 17400, [{ stockId: 'S1', quantity: 60, avgBuyPrice: 50 }], [{ id: 'S1', currentPrice: 60 }]);
    assert(partialSell.portfolioValue === 21000, 'Partial sell: portfolioValue === 21000');
    assert(partialSell.totalPnL === 1000, 'Partial sell: totalPnL === 1000');
    assert(partialSell.unrealizedPnL === 600, 'Partial sell: unrealizedPnL === 600');
    assert(partialSell.realizedPnL === 400, 'Partial sell: realizedPnL === 400');
    assertInvariant(partialSell, 'Partial sell');

    // Case 6: Full Sell at Profit
    // Sold all 100 shares @ 60. Cash = 21000. Holdings = []
    const fullSellProfit = calculatePortfolio(20000, 21000, [], []);
    assert(fullSellProfit.portfolioValue === 21000, 'Full sell profit: portfolioValue === 21000');
    assert(fullSellProfit.totalPnL === 1000, 'Full sell profit: totalPnL === 1000');
    assert(fullSellProfit.realizedPnL === 1000, 'Full sell profit: realizedPnL === 1000');
    assert(fullSellProfit.unrealizedPnL === 0, 'Full sell profit: unrealizedPnL === 0');
    assertInvariant(fullSellProfit, 'Full sell profit');

    // Case 7: Full Sell at Loss
    // Bought 100 @ 50. Price = 40. Sold all 100 @ 40. Cash = 19000. Holdings = []
    const fullSellLoss = calculatePortfolio(20000, 19000, [], []);
    assert(fullSellLoss.portfolioValue === 19000, 'Full sell loss: portfolioValue === 19000');
    assert(fullSellLoss.totalPnL === -1000, 'Full sell loss: totalPnL === -1000');
    assert(fullSellLoss.realizedPnL === -1000, 'Full sell loss: realizedPnL === -1000');
    assert(fullSellLoss.unrealizedPnL === 0, 'Full sell loss: unrealizedPnL === 0');
    assertInvariant(fullSellLoss, 'Full sell loss');

    // Case 8: Multiple Positions with Mixed Profit/Loss
    // Cash = 5000. Stock A: 100 @ 50 (current 60). Stock B: 100 @ 100 (current 80).
    const mixed = calculatePortfolio(20000, 5000, [
      { stockId: 'SA', quantity: 100, avgBuyPrice: 50 },
      { stockId: 'SB', quantity: 100, avgBuyPrice: 100 }
    ], [
      { id: 'SA', currentPrice: 60 },
      { id: 'SB', currentPrice: 80 }
    ]);
    assert(mixed.portfolioValue === 19000, 'Mixed positions: portfolioValue === 19000');
    assert(mixed.totalPnL === -1000, 'Mixed positions: totalPnL === -1000');
    assert(mixed.unrealizedPnL === -1000, 'Mixed positions: unrealizedPnL === -1000');
    assert(mixed.totalPnLPercent === -5.0, 'Mixed positions: totalPnLPercent === -5.0%');
    assertInvariant(mixed, 'Mixed positions');

  } catch (err) {
    console.error('Portfolio PnL Test Error:', err);
    failed++;
  }

  return { passed, failed };
}

module.exports = { runPortfolioPnLMathTests };
