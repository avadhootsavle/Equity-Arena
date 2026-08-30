const { PrismaClient } = require('@prisma/client');
const { getUserAvailableBalance, getUserAvailableHolding } = require('./orderService');

const prisma = new PrismaClient();

/**
 * Realized profit/loss per SELL transaction, keyed by transaction id.
 *
 * There is no cost-basis column on Transaction, so the only correct source is a
 * replay of the user's COMPLETE trade history: a sell's result depends on every
 * buy that preceded it. This deliberately reads the whole log rather than the
 * 20 rows the client is sent — replaying a truncated list would miss earlier
 * buys and report wrong averages.
 *
 * The running average mirrors how Holding.avgBuyPrice is maintained: a buy
 * re-weights the average, a sell realizes against it and leaves it unchanged.
 */
async function getRealizedPLByTransactionId(userId) {
  const ordered = await prisma.transaction.findMany({
    where: { userId },
    orderBy: [{ timestamp: 'asc' }, { id: 'asc' }],
    select: { id: true, stockId: true, type: true, quantity: true, price: true, timestamp: true }
  });

  // Same-timestamp ties: settle buys first, since shares must be held before they
  // can be sold. Stable sort keeps the id ordering above for everything else.
  ordered.sort((a, b) => {
    const t = a.timestamp - b.timestamp;
    if (t !== 0) return t;
    if (a.type === b.type) return 0;
    return a.type === 'BUY' ? -1 : 1;
  });

  const byId = new Map();
  const book = new Map(); // stockId -> { qty, avgCost }

  for (const tx of ordered) {
    const qty = tx.quantity || 0;
    // quantity === 0 rows are admin wallet top-ups, not trades.
    if (qty <= 0) continue;

    const pos = book.get(tx.stockId) || { qty: 0, avgCost: 0 };

    if (tx.type === 'BUY') {
      const newQty = pos.qty + qty;
      pos.avgCost = newQty > 0 ? (pos.qty * pos.avgCost + qty * tx.price) / newQty : 0;
      pos.qty = newQty;
    } else {
      // Only shares actually on the book have a known cost basis.
      const sold = Math.min(qty, pos.qty);
      if (sold > 0) {
        byId.set(tx.id, Math.round(sold * (tx.price - pos.avgCost) * 100) / 100);
      }
      pos.qty -= sold; // average is unchanged by a sale
      if (pos.qty === 0) pos.avgCost = 0;
    }

    book.set(tx.stockId, pos);
  }

  return byId;
}

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

  // Fetch recent transactions, annotated with realized P/L for sells
  const realizedPLById = await getRealizedPLByTransactionId(userId);
  const recentTransactions = await prisma.transaction.findMany({
    where: { userId },
    take: 20,
    orderBy: { timestamp: 'desc' },
    include: {
      stock: {
        select: { symbol: true, name: true }
      }
    }
  });

  // realizedPL is null for buys and top-ups; a number only for sells.
  const transactions = recentTransactions.map((t) => ({
    ...t,
    realizedPL: realizedPLById.has(t.id) ? realizedPLById.get(t.id) : null
  }));

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
    orders: pendingOrders
  };
}

module.exports = {
  getUserPortfolio,
  getRealizedPLByTransactionId
};
