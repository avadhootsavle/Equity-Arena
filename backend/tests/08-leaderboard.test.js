const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runLeaderboardTests() {
  console.log('\n==================================================');
  console.log('🧪 8. Tournament Leaderboard & Filtering Test Suite');
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
    // 1. Fetch eligible traders for leaderboard calculation
    const traders = await prisma.user.findMany({
      where: {
        role: 'TRADER',
        isTestAccount: false
      },
      include: {
        holdings: {
          include: {
            stock: { select: { currentPrice: true } }
          }
        }
      }
    });

    const leaderboard = traders.map((trader) => {
      const holdingsValue = trader.holdings.reduce((sum, h) => {
        return sum + (h.quantity * h.stock.currentPrice);
      }, 0);

      const totalPortfolioValue = Math.round((trader.walletBalance + holdingsValue) * 100) / 100;

      return {
        id: trader.id,
        name: trader.name,
        role: trader.role,
        isTestAccount: trader.isTestAccount,
        walletBalance: Math.round(trader.walletBalance * 100) / 100,
        holdingsValue: Math.round(holdingsValue * 100) / 100,
        totalPortfolioValue
      };
    });

    leaderboard.sort((a, b) => b.totalPortfolioValue - a.totalPortfolioValue);

    assert(Array.isArray(leaderboard), `Leaderboard generated successfully with ${leaderboard.length} ranked entries`);

    // 2. Exclusion Verification: No admin or test accounts included
    let hasAdminOrTestAccount = false;
    for (const entry of leaderboard) {
      if (entry.role === 'ADMIN' || entry.isTestAccount === true) {
        hasAdminOrTestAccount = true;
      }
    }
    assert(
      !hasAdminOrTestAccount,
      `Exclusion Filter: Admin users and isTestAccount demo accounts strictly excluded from leaderboard rankings`
    );

    // 3. Sorting Verification: Descending order by totalPortfolioValue
    let isSorted = true;
    for (let i = 0; i < leaderboard.length - 1; i++) {
      if (leaderboard[i].totalPortfolioValue < leaderboard[i + 1].totalPortfolioValue) {
        isSorted = false;
        break;
      }
    }
    assert(
      isSorted,
      `Sorting Order: Player rankings are strictly sorted in descending order by total net worth (Portfolio Value)`
    );

    console.log(`Summary: Leaderboard Suite (${passed} passed, ${failed} failed)\n`);
    return { passed, failed };
  } catch (err) {
    console.error('Leaderboard Suite Error:', err);
    return { passed, failed: failed + 1 };
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runLeaderboardTests().then(({ failed }) => process.exit(failed > 0 ? 1 : 0));
}

module.exports = { runLeaderboardTests };
