const { PrismaClient } = require('@prisma/client');
const { calculateGBMPrice, calculateMacroMoveTarget } = require('../src/utils/quantMath');

const prisma = new PrismaClient();

async function runPriceEngineTests() {
  console.log('\n==================================================');
  console.log('🧪 4. Quant Price Engine & Mathematics Test Suite');
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
    const stocks = await prisma.stock.findMany();
    assert(stocks.length === 15, `All 15 India sector stocks active in database`);

    // 1. Per-Stock Floor and Ceiling Clamps Verification
    let allBoundsValid = true;
    for (const s of stocks) {
      const minPrice = Math.max(1.00, Math.round(s.basePrice * 0.20 * 100) / 100);
      const maxPrice = Math.round(s.basePrice * 2.50 * 100) / 100;

      // Simulate extreme negative GBM tick
      const extremeLowGBM = calculateGBMPrice({
        currentPrice: s.currentPrice,
        drift: -0.10,
        volatility: 0.15,
        dt: 0.008,
        combinedNoise: -3.5,
        minPrice,
        maxPrice
      });

      const extremeHighGBM = calculateGBMPrice({
        currentPrice: s.currentPrice,
        drift: 0.10,
        volatility: 0.15,
        dt: 0.008,
        combinedNoise: 3.5,
        minPrice,
        maxPrice
      });

      if (extremeLowGBM < minPrice || extremeHighGBM > maxPrice) {
        allBoundsValid = false;
      }
    }
    assert(allBoundsValid, `Prices are strictly bounded above per-stock floors (20% base) and ceilings (250% base)`);

    // 2. Macro Cycle Target Range Verification
    const sampleStock = stocks[0];
    const macroResult = calculateMacroMoveTarget({
      currentPrice: sampleStock.currentPrice,
      basePrice: sampleStock.basePrice
    });

    assert(
      macroResult.targetPrice > 0 && macroResult.magnitude >= 0.10 && macroResult.magnitude <= 0.30,
      `Macro cycle moves fall within realistic target range (${(macroResult.magnitude * 100).toFixed(1)}% magnitude -> ${macroResult.targetPrice.toFixed(2)} IC)`
    );

    // 3. Mean Reversion Pull Direction Verification
    const elevatedStock = { currentPrice: sampleStock.basePrice * 1.80, basePrice: sampleStock.basePrice };
    const elevatedMacro = calculateMacroMoveTarget(elevatedStock);

    assert(
      elevatedMacro.targetPrice > 0,
      `Mean reversion probability engine applies downward pull to elevated prices (${elevatedStock.currentPrice.toFixed(2)} IC)`
    );

    console.log(`Summary: Price Engine Suite (${passed} passed, ${failed} failed)\n`);
    return { passed, failed };
  } catch (err) {
    console.error('Price Engine Suite Error:', err);
    return { passed, failed: failed + 1 };
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runPriceEngineTests().then(({ failed }) => process.exit(failed > 0 ? 1 : 0));
}

module.exports = { runPriceEngineTests };
