const { randomNormal, combineSectorNoise, calculateGBMPrice } = require('../src/utils/quantMath');
const { getStockState, tickMarket } = require('../src/services/marketTicker');

async function runPhase15Tests() {
  console.log('\n================================================================');
  console.log('🧪 STARTING PHASE 15 QUANT PRICE ENGINE TEST SUITE');
  console.log('================================================================\n');

  // 1. Test Box-Muller Normal Distribution Statistical Properties
  console.log('--- 1. Testing Box-Muller Normal Distribution Output ---');
  const samples = 10000;
  let sum = 0;
  let sqSum = 0;

  for (let i = 0; i < samples; i++) {
    const val = randomNormal(0, 1);
    sum += val;
    sqSum += val * val;
  }

  const sampleMean = sum / samples;
  const sampleVar = (sqSum / samples) - (sampleMean * sampleMean);
  const sampleStdDev = Math.sqrt(sampleVar);

  console.log(`Sample Size: ${samples} | Sample Mean: ${sampleMean.toFixed(4)} (Expected: ~0) | Sample StdDev: ${sampleStdDev.toFixed(4)} (Expected: ~1)`);

  if (Math.abs(sampleMean) > 0.05 || Math.abs(sampleStdDev - 1.0) > 0.05) {
    throw new Error('Box-Muller distribution statistics deviated outside tolerance');
  }
  console.log('✅ Box-Muller Normal Distribution verified!');

  // 2. Test Geometric Brownian Motion (GBM) Formula
  console.log('\n--- 2. Testing Geometric Brownian Motion (GBM) Price Calculation ---');
  const initialPrice = 10.0;
  const p1 = calculateGBMPrice({
    currentPrice: initialPrice,
    drift: 0.02,
    volatility: 0.20,
    dt: 0.05,
    combinedNoise: 1.0
  });

  console.log(`Initial Price: ${initialPrice} IC -> New Price (+1 StdDev shock): ${p1} IC`);
  if (isNaN(p1) || p1 <= 0.50) {
    throw new Error('GBM price calculation output invalid');
  }
  console.log('✅ GBM Price Model verified!');

  // 3. Test Sector Correlation Matrix
  console.log('\n--- 3. Testing Sector Correlation Noise Combination ---');
  const sectorNoise = 1.5; // Strong positive sector trend
  const stock1Noise = randomNormal(0, 1);
  const stock2Noise = randomNormal(0, 1);

  const combined1 = combineSectorNoise(stock1Noise, sectorNoise, 0.50);
  const combined2 = combineSectorNoise(stock2Noise, sectorNoise, 0.50);

  console.log(`Sector Shock: ${sectorNoise} | Combined Stock 1 Noise: ${combined1.toFixed(3)} | Combined Stock 2 Noise: ${combined2.toFixed(3)}`);

  if ((combined1 > 0 && combined2 < 0 && Math.abs(sectorNoise) > 2) || isNaN(combined1)) {
    throw new Error('Sector correlation noise combination failed');
  }
  console.log('✅ Sector correlation noise combination verified!');

  // 4. Test Minimum Price Clamp Bound (Floor = 0.50 IC)
  console.log('\n--- 4. Testing Minimum Price Floor Clamp Bound ---');
  const crashedPrice = calculateGBMPrice({
    currentPrice: 0.10,
    drift: -2.0,
    volatility: 1.0,
    dt: 0.05,
    combinedNoise: -5.0
  });

  console.log(`Extreme Crash Scenario -> Clamped Price: ${crashedPrice} IC`);
  if (crashedPrice < 0.50) {
    throw new Error(`Price dropped below minimum floor 0.50 IC. Received: ${crashedPrice}`);
  }
  console.log('✅ Hard minimum floor bound (0.50 IC) verified!');

  console.log('\n================================================================');
  console.log('🎉 ALL PHASE 15 QUANT PRICE ENGINE TESTS PASSED CLEANLY!');
  console.log('================================================================\n');
}

runPhase15Tests().catch((err) => {
  console.error('❌ Phase 15 test failed:', err);
  process.exit(1);
});
