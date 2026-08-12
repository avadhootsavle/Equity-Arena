const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runPriceTiersVerification() {
  console.log('🧪 Starting Phase 25 Diverse Price Tiers & Per-Stock Bounds Verification...\n');

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
    const stocks = await prisma.stock.findMany({ orderBy: { currentPrice: 'asc' } });
    assert(stocks.length === 15, `Found all 15 India sector stocks seeded in database`);

    // -------------------------------------------------------------
    // Test 1: Verify Price Tier Distribution
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Price Tier Distribution Verification ---');

    const lowTier = stocks.filter((s) => s.basePrice >= 20 && s.basePrice <= 120);
    const midTier = stocks.filter((s) => s.basePrice > 120 && s.basePrice <= 800);
    const highTier = stocks.filter((s) => s.basePrice > 800);

    assert(lowTier.length === 5, `Low Tier (~30-100 IC): ${lowTier.length} stocks (${lowTier.map((s) => `${s.symbol}: Base ${s.basePrice} IC`).join(', ')})`);
    assert(midTier.length === 6, `Mid Tier (~100-500 IC): ${midTier.length} stocks (${midTier.map((s) => `${s.symbol}: Base ${s.basePrice} IC`).join(', ')})`);
    assert(highTier.length === 4, `High Tier (~1,000-4,000 IC): ${highTier.length} stocks (${highTier.map((s) => `${s.symbol}: Base ${s.basePrice} IC`).join(', ')})`);

    // -------------------------------------------------------------
    // Test 2: Per-Stock Floor and Ceiling Clamps
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Per-Stock Bounds Verification ---');

    let allBoundsValid = true;
    for (const s of stocks) {
      const minPrice = Math.max(1.00, Math.round(s.basePrice * 0.20 * 100) / 100);
      const maxPrice = Math.round(s.basePrice * 2.50 * 100) / 100;
      if (s.currentPrice < minPrice || s.currentPrice > maxPrice) {
        allBoundsValid = false;
        console.error(`Bound error for ${s.symbol}: Price=${s.currentPrice}, Floor=${minPrice}, Ceiling=${maxPrice}`);
      }
    }
    assert(allBoundsValid, `All 15 stocks operate within their per-stock floor (20% base) and ceiling (250% base) bounds`);

    // -------------------------------------------------------------
    // Test 3: Natural Wallet Buying Power Variance
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Wallet Buying Power Variance ---');
    const walletBalance = 20000;

    const cheapestStock = lowTier[0];
    const maxCheapestShares = Math.floor(walletBalance / cheapestStock.currentPrice);

    const priciestStock = highTier[highTier.length - 1];
    const maxPriciestShares = Math.floor(walletBalance / priciestStock.currentPrice);

    assert(
      maxCheapestShares >= 200,
      `Trader with 20,000 IC can buy ${maxCheapestShares} shares of low-tier ${cheapestStock.symbol} (${cheapestStock.currentPrice.toFixed(2)} IC)`
    );

    assert(
      maxPriciestShares <= 10,
      `Trader with 20,000 IC can buy only ${maxPriciestShares} shares of high-tier ${priciestStock.symbol} (${priciestStock.currentPrice.toFixed(2)} IC)`
    );

    console.log('\n==================================================');
    console.log(`📊 PHASE 25 DIVERSE PRICE TIERS SUMMARY:`);
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

runPriceTiersVerification();
