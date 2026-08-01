const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/authMiddleware');
const { tradeRateLimiter } = require('../middleware/rateLimiter');
const { emitPortfolioUpdate } = require('../socket');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Helper to fetch complete portfolio data for a user
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

  let totalHoldingsValue = 0;
  let totalHoldingsCost = 0;

  const formattedHoldings = user.holdings.map((h) => {
    const currentPrice = h.stock.currentPrice;
    const totalValue = Math.round(h.quantity * currentPrice * 100) / 100;
    const totalCost = Math.round(h.quantity * h.avgBuyPrice * 100) / 100;
    const unrealizedPL = Math.round((totalValue - totalCost) * 100) / 100;
    const unrealizedPLPercent = totalCost > 0
      ? Math.round(((unrealizedPL / totalCost) * 100) * 100) / 100
      : 0;

    totalHoldingsValue += totalValue;
    totalHoldingsCost += totalCost;

    return {
      id: h.id,
      stockId: h.stockId,
      symbol: h.stock.symbol,
      name: h.stock.name,
      quantity: h.quantity,
      avgBuyPrice: h.avgBuyPrice,
      currentPrice: currentPrice,
      totalValue,
      unrealizedPL,
      unrealizedPLPercent
    };
  });

  const totalUnrealizedPL = Math.round((totalHoldingsValue - totalHoldingsCost) * 100) / 100;
  const totalPortfolioValue = Math.round((user.walletBalance + totalHoldingsValue) * 100) / 100;

  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: 50,
    include: {
      stock: {
        select: { symbol: true, name: true }
      }
    }
  });

  return {
    userId: user.id,
    walletBalance: Math.round(user.walletBalance * 100) / 100,
    totalHoldingsValue: Math.round(totalHoldingsValue * 100) / 100,
    totalHoldingsCost: Math.round(totalHoldingsCost * 100) / 100,
    totalUnrealizedPL,
    totalPortfolioValue,
    holdings: formattedHoldings,
    transactions
  };
}

// GET /portfolio
router.get('/portfolio', authenticateToken, async (req, res) => {
  try {
    const portfolio = await getUserPortfolio(req.user.userId);
    if (!portfolio) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(portfolio);
  } catch (err) {
    console.error('Get portfolio error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /trade/buy
router.post('/trade/buy', authenticateToken, tradeRateLimiter, async (req, res) => {
  try {
    const { stockId, quantity } = req.body;
    const userId = req.user.userId;

    const parsedQty = parseInt(quantity, 10);
    if (!stockId || isNaN(parsedQty) || parsedQty <= 0 || parsedQty > 1000000) {
      return res.status(400).json({ error: 'Quantity must be a positive integer between 1 and 1,000,000' });
    }

    const stock = await prisma.stock.findUnique({ where: { id: stockId } });
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const totalCost = Math.round(stock.currentPrice * parsedQty * 100) / 100;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }

    if (user.walletBalance < totalCost) {
      return res.status(400).json({
        error: `Insufficient wallet balance. Total cost is ${totalCost.toFixed(2)} IC, but your wallet balance is ${user.walletBalance.toFixed(2)} IC`
      });
    }

    // Execute trade atomically in Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct wallet
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: totalCost } }
      });

      // 2. Upsert holding
      const existingHolding = await tx.holding.findUnique({
        where: { userId_stockId: { userId, stockId } }
      });

      let holding;
      if (existingHolding) {
        const newQty = existingHolding.quantity + parsedQty;
        const newAvgBuyPrice = Math.round(
          (((existingHolding.quantity * existingHolding.avgBuyPrice) + (parsedQty * stock.currentPrice)) / newQty) * 100
        ) / 100;

        holding = await tx.holding.update({
          where: { id: existingHolding.id },
          data: {
            quantity: newQty,
            avgBuyPrice: newAvgBuyPrice
          }
        });
      } else {
        holding = await tx.holding.create({
          data: {
            userId,
            stockId,
            quantity: parsedQty,
            avgBuyPrice: stock.currentPrice
          }
        });
      }

      // 3. Log transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          stockId,
          type: 'BUY',
          quantity: parsedQty,
          price: stock.currentPrice
        }
      });

      return { holding, transaction, walletBalance: updatedUser.walletBalance };
    });

    // Fetch updated portfolio and emit to user's private socket room
    const portfolio = await getUserPortfolio(userId);
    emitPortfolioUpdate(userId, portfolio);

    return res.json({
      message: 'Buy order executed successfully',
      transaction: result.transaction,
      portfolio
    });
  } catch (err) {
    console.error('Trade buy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /trade/sell
router.post('/trade/sell', authenticateToken, tradeRateLimiter, async (req, res) => {
  try {
    const { stockId, quantity } = req.body;
    const userId = req.user.userId;

    const parsedQty = parseInt(quantity, 10);
    if (!stockId || isNaN(parsedQty) || parsedQty <= 0 || parsedQty > 1000000) {
      return res.status(400).json({ error: 'Quantity must be a positive integer between 1 and 1,000,000' });
    }

    const stock = await prisma.stock.findUnique({ where: { id: stockId } });
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const existingHolding = await prisma.holding.findUnique({
      where: { userId_stockId: { userId, stockId } }
    });

    if (!existingHolding || existingHolding.quantity < parsedQty) {
      const ownedQty = existingHolding ? existingHolding.quantity : 0;
      return res.status(400).json({
        error: `Insufficient holdings. You own ${ownedQty} shares of ${stock.symbol}, but attempted to sell ${parsedQty}`
      });
    }

    const proceeds = Math.round(stock.currentPrice * parsedQty * 100) / 100;

    // Execute trade atomically in Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Credit wallet
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: proceeds } }
      });

      // 2. Reduce or remove holding
      if (existingHolding.quantity === parsedQty) {
        await tx.holding.delete({
          where: { id: existingHolding.id }
        });
      } else {
        await tx.holding.update({
          where: { id: existingHolding.id },
          data: {
            quantity: existingHolding.quantity - parsedQty
          }
        });
      }

      // 3. Log transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          stockId,
          type: 'SELL',
          quantity: parsedQty,
          price: stock.currentPrice
        }
      });

      return { transaction, walletBalance: updatedUser.walletBalance };
    });

    // Fetch updated portfolio and emit to user's private socket room
    const portfolio = await getUserPortfolio(userId);
    emitPortfolioUpdate(userId, portfolio);

    return res.json({
      message: 'Sell order executed successfully',
      transaction: result.transaction,
      portfolio
    });
  } catch (err) {
    console.error('Trade sell error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = {
  router,
  getUserPortfolio
};
