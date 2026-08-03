const { calculateGBMPrice, calculateMacroMoveTarget } = require('../src/utils/quantMath');

function runPhase20bTests() {
  console.log('🧪 Running Phase 20b Automated Test Suite...');

  let assertionsPassed = 0;

  // Assertion 1: Hard Ceiling Clamp at 99.00 IC max
  let ceilingViolated = false;
  for (let i = 0; i < 500; i++) {
    const rawPrice = calculateGBMPrice({
      currentPrice: 98.0,
      drift: 0.10,
      volatility: 0.50,
      dt: 0.008,
      combinedNoise: 3.5 // Extreme positive spike
    });

    if (rawPrice > 99.00) {
      ceilingViolated = true;
      break;
    }
  }

  if (!ceilingViolated) {
    console.log('✅ Assertion 1 Passed: Stock price strictly capped at 99.00 IC hard ceiling max under 500 simulated ticks');
    assertionsPassed++;
  } else {
    console.error('❌ Assertion 1 Failed: Price exceeded 99.00 IC ceiling!');
  }

  // Assertion 2: Macro Move Target Clamped to 99.00 IC Max
  let macroCeilingViolated = false;
  for (let i = 0; i < 200; i++) {
    const macroMove = calculateMacroMoveTarget({
      currentPrice: 95.0,
      basePrice: 70.0
    });

    if (macroMove.targetPrice > 99.00) {
      macroCeilingViolated = true;
      break;
    }
  }

  if (!macroCeilingViolated) {
    console.log('✅ Assertion 2 Passed: Macro move target price strictly clamped to 99.00 IC max');
    assertionsPassed++;
  } else {
    console.error('❌ Assertion 2 Failed: Macro move target exceeded 99.00 IC!');
  }

  // Assertion 3: Dynamic Macro Move Magnitude Range (10% to 30%)
  let magnitudeRangeValid = true;
  for (let i = 0; i < 100; i++) {
    const macroMove = calculateMacroMoveTarget({
      currentPrice: 60.0,
      basePrice: 60.0
    });

    if (macroMove.magnitude < 0.09 || macroMove.magnitude > 0.31) {
      magnitudeRangeValid = false;
      break;
    }
  }

  if (magnitudeRangeValid) {
    console.log('✅ Assertion 3 Passed: Macro move magnitudes dynamically fall in 10% to 30% range per cycle');
    assertionsPassed++;
  } else {
    console.error('❌ Assertion 3 Failed: Macro move magnitude out of 10-30% range!');
  }

  // Assertion 4: High Price Mean-Reversion Downward Weighting (>85 IC)
  let downCount = 0;
  const totalRuns = 500;
  for (let i = 0; i < totalRuns; i++) {
    const macroMove = calculateMacroMoveTarget({
      currentPrice: 88.0,
      basePrice: 60.0
    });
    if (macroMove.isDown) downCount++;
  }

  const downRatio = downCount / totalRuns;
  if (downRatio >= 0.80) {
    console.log(`✅ Assertion 4 Passed: Strong downward mean-reversion pull near 99 IC ceiling (${(downRatio * 100).toFixed(1)}% downward moves at 88 IC)`);
    assertionsPassed++;
  } else {
    console.error(`❌ Assertion 4 Failed: Downward move ratio was too low: ${(downRatio * 100).toFixed(1)}%`);
  }

  if (assertionsPassed === 4) {
    console.log('\n🎉 ALL 4 PHASE 20b TEST ASSERTIONS PASSED SUCCESSFULLY!');
  } else {
    console.error(`\n❌ TEST SUITE FAILED: ${assertionsPassed}/4 assertions passed.`);
    process.exit(1);
  }
}

runPhase20bTests();
