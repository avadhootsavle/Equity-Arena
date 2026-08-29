const { runAuthAccessTests } = require('./01-auth-access.test');
const { runTradingWalletTests } = require('./02-trading-wallet.test');
const { runLimitOrdersTests } = require('./03-limit-orders.test');
const { runPriceEngineTests } = require('./04-price-engine.test');
const { runNewsSystemTests } = require('./05-news-system.test');
const { runSessionLockTests } = require('./06-session-lock.test');
const { runSyncConsistencyTests } = require('./07-sync-consistency.test');
const { runLeaderboardTests } = require('./08-leaderboard.test');
const { runMultiTabSyncTest } = require('./09-multi-tab-sync.test');
const { runPortfolioPnLMathTests } = require('./10-portfolio-pnl-math.test');

async function runFullTestSuite() {
  console.log('\n======================================================================');
  console.log('🚀 EQUITY ARENA — COMPREHENSIVE SYSTEM AUTOMATED TEST SUITE');
  console.log('======================================================================');

  let totalPassed = 0;
  let totalFailed = 0;
  const suiteResults = [];

  const suites = [
    { name: '1. Auth & Role Access Control', fn: runAuthAccessTests },
    { name: '2. Trading & Wallet Math', fn: runTradingWalletTests },
    { name: '3. Limit Orders Engine & Locking', fn: runLimitOrdersTests },
    { name: '4. Quant Price Engine & Mathematics', fn: runPriceEngineTests },
    { name: '5. Analyst News Engine & Privacy', fn: runNewsSystemTests },
    { name: '6. Admin Session & Trading Lock', fn: runSessionLockTests },
    { name: '7. Admin vs Trader Sync Consistency', fn: runSyncConsistencyTests },
    { name: '8. Tournament Leaderboard & Filtering', fn: runLeaderboardTests },
    { name: '9. Multi-Tab Real-Time Sync', fn: runMultiTabSyncTest },
    { name: '10. Portfolio & P&L Math Engine', fn: runPortfolioPnLMathTests }
  ];

  for (const suite of suites) {
    try {
      const { passed, failed } = await suite.fn();
      totalPassed += passed;
      totalFailed += failed;
      suiteResults.push({ name: suite.name, passed, failed, status: failed === 0 ? 'PASSED' : 'FAILED' });
    } catch (err) {
      console.error(`Suite Error [${suite.name}]:`, err);
      totalFailed += 1;
      suiteResults.push({ name: suite.name, passed: 0, failed: 1, status: 'FAILED' });
    }
  }

  console.log('\n======================================================================');
  console.log('📊 CONSOLIDATED TEST SUITE SUMMARY REPORT');
  console.log('======================================================================');
  suiteResults.forEach((res) => {
    const symbol = res.status === 'PASSED' ? '✅' : '❌';
    console.log(`${symbol} ${res.name.padEnd(45)} | ${res.passed} Passed | ${res.failed} Failed [${res.status}]`);
  });
  console.log('----------------------------------------------------------------------');
  console.log(`TOTAL ASSERTIONS: ${totalPassed + totalFailed} | PASSED: ${totalPassed} | FAILED: ${totalFailed}`);
  console.log('======================================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runFullTestSuite();
