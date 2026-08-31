const { PrismaClient } = require('@prisma/client');
const { emitBankruptAlert } = require('../socket');

const prisma = require('../prisma');

// In-memory set of bankrupt trader IDs for current session
const bankruptTraderIds = new Set();

function clearBankruptTraders() {
  bankruptTraderIds.clear();
}

/**
 * Checks whether a single trader has fallen below the 100 IC bankruptcy threshold.
 * Triggers alert strictly once per trader per session.
 */
async function checkTraderBankruptcy(userId) {
  if (!userId || bankruptTraderIds.has(userId)) return;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        holdings: {
          include: {
            stock: {
              select: { currentPrice: true }
            }
          }
        }
      }
    });

    if (!user || user.role === 'ADMIN' || user.isTestAccount) return;

    const holdingsValue = user.holdings.reduce(
      (sum, h) => sum + (h.quantity * (h.stock?.currentPrice || 0)),
      0
    );

    const totalNetWorth = Math.round((user.walletBalance + holdingsValue) * 100) / 100;

    // Below 100 IC threshold is considered bankrupt
    if (totalNetWorth < 100) {
      bankruptTraderIds.add(userId);

      const alertPayload = {
        userId,
        traderName: user.name || user.email.split('@')[0],
        totalValue: Math.max(0, totalNetWorth),
        timestamp: Date.now()
      };

      console.log(`[Bankruptcy Alert] ${alertPayload.traderName} has gone bankrupt (Net worth: ${alertPayload.totalValue} IC)`);
      emitBankruptAlert(alertPayload);

      const { emitActivityLog } = require('../socket');
      emitActivityLog({
        id: Date.now() + Math.random(),
        traderName: alertPayload.traderName,
        action: 'DECLARED BANKRUPT',
        quantity: 0,
        symbol: 'BANKRUPT',
        price: alertPayload.totalValue,
        timestamp: Date.now(),
        isBankrupt: true
      });
    }
  } catch (err) {
    console.error('Bankruptcy check error:', err);
  }
}

/**
 * Checks all active traders against the 100 IC bankruptcy threshold.
 */
async function checkAllTradersBankruptcy() {
  try {
    const traders = await prisma.user.findMany({
      where: { role: 'TRADER', isTestAccount: false },
      select: { id: true }
    });

    for (const t of traders) {
      if (!bankruptTraderIds.has(t.id)) {
        await checkTraderBankruptcy(t.id);
      }
    }
  } catch (err) {
    console.error('Check all traders bankruptcy error:', err);
  }
}

module.exports = {
  checkTraderBankruptcy,
  checkAllTradersBankruptcy,
  clearBankruptTraders,
  bankruptTraderIds
};
