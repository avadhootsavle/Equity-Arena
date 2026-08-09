const { PrismaClient } = require('@prisma/client');
const { getUserAvailableBalance, getUserAvailableHolding } = require('./orderService');

const prisma = new PrismaClient();

/**
 * Helper to fetch complete portfolio data for a user, including available & locked balance math
 */
async function getUserPortfolio(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      holdings: {
        include: {
          stock: true
        }
      }
    }
  });

  if (!user) return null;

  const { availableBalance: availableWalletBalance, lockedFunds } = await getUserAvailableBalance(userId);

  let totalHoldingsValue = 0;
  let totalHoldingsCost = 0;

  const formattedHoldings = await Promise.all(
    user.holdings.map(async (h) => {
      const currentPrice = h.stock.currentPrice;
      const totalValue = Math.round(h.quantity * currentPrice * 100) / 100;
      const totalCost = Math.round(h.quantity * h.avgBuyPrice * 100) / 100;
      const unrealizedPL = Math.round((totalValue - totalCost) * 100) / 100;
      const unrealizedPLPercent = totalCost > 0
        ? Math.round(((unrealizedPL / totalCost) * 100) * 100) / 100
        : 0;

      totalHoldingsValue += totalValue;
      totalHoldingsCost += totalCost;

      const { availableQuantity, lockedQuantity } = await getUserAvailableHolding(userId, h.stockId);

      return {
        id: h.id,
        stockId: h.stockId,
        symbol: h.stock.symbol,
        name: h.stock.name,
        quantity: h.quantity,
        lockedQuantity,
        availableQuantity,
        avgBuyPrice: h.avgBuyPrice,
        currentPrice: currentPrice,
        totalValue,
        unrealizedPL,
        unrealizedPLPercent
      };
    })
  );

  totalHoldingsValue = Math.round(totalHoldingsValue * 100) / 100;
  totalHoldingsCost = Math.round(totalHoldingsCost * 100) / 100;
  const totalUnrealizedPL = Math.round((totalHoldingsValue - totalHoldingsCost) * 100) / 100;
  const totalPortfolioValue = Math.round((user.walletBalance + totalHoldingsValue) * 100) / 100;

  // Fetch recent transactions
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    take: 20,
    orderBy: { timestamp: 'desc' },
    include: {
      stock: {
        select: { symbol: true, name: true }
      }
    }
  });

  // Fetch pending limit orders
  const pendingOrders = await prisma.order.findMany({
    where: { userId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: {
      stock: {
        select: { symbol: true, name: true, currentPrice: true }
      }
    }
  });

  return {
    walletBalance: user.walletBalance,
    availableWalletBalance,
    lockedFunds,
    totalHoldingsValue,
    totalHoldingsCost,
    totalUnrealizedPL,
    totalPortfolioValue,
    holdings: formattedHoldings,
    transactions,
    pendingOrders
  };
}

module.exports = {
  getUserPortfolio
};
