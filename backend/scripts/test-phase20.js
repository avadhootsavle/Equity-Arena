const { calculateMacroMoveTarget } = require('../src/utils/quantMath');

console.log('🧪 Testing Phase 20 — 3-Minute Macro Volatility Engine...\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failCount++;
  }
}

// Test 1: Verify magnitude bounds (10% to 30%) across 100 samples
let validMagnitudes = true;
for (let i = 0; i < 100; i++) {
  const result = calculateMacroMoveTarget({ currentPrice: 10.0, basePrice: 10.0 });
  if (result.magnitude < 0.10 || result.magnitude > 0.30) {
    validMagnitudes = false;
    break;
  }
}
assert(validMagnitudes, 'All macro moves generated magnitudes strictly between 10% and 30% (0.10 to 0.30)');

// Test 2: Verify Mean Reversion Pull direction weighting
let highPriceDownCount = 0;
let lowPriceUpCount = 0;
const iterations = 500;

for (let i = 0; i < iterations; i++) {
  // Stock that has run up high (20 IC vs 10 IC base)
  const highResult = calculateMacroMoveTarget({ currentPrice: 20.0, basePrice: 10.0 });
  if (highResult.isDown) highPriceDownCount++;

  // Stock that has dropped low (4 IC vs 10 IC base)
  const lowResult = calculateMacroMoveTarget({ currentPrice: 4.0, basePrice: 10.0 });
  if (!lowResult.isDown) lowPriceUpCount++;
}

const highDownRatio = highPriceDownCount / iterations;
const lowUpRatio = lowPriceUpCount / iterations;

assert(
  highDownRatio > 0.60,
  `High-priced stock is biased toward downward macro moves (observed: ${(highDownRatio * 100).toFixed(1)}% down moves)`
);
assert(
  lowUpRatio > 0.60,
  `Low-priced stock is biased toward upward macro moves (observed: ${(lowUpRatio * 100).toFixed(1)}% up moves)`
);

// Test 3: Hard Price Floor Bound Clamp (never drops below 1.00 IC)
let hardFloorHeld = true;
for (let i = 0; i < 50; i++) {
  const result = calculateMacroMoveTarget({ currentPrice: 1.10, basePrice: 10.0 });
  if (result.targetPrice < 1.00) {
    hardFloorHeld = false;
    break;
  }
}
assert(hardFloorHeld, 'Target price floor strictly clamps at >= 1.00 IC even for low-priced stocks');

console.log(`\n========================================`);
console.log(`Phase 20 Test Results: ${passCount} PASSED, ${failCount} FAILED`);
console.log(`========================================\n`);

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
