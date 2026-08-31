const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/authMiddleware');
const { tradeRateLimiter } = require('../middleware/rateLimiter');
const { emitPortfolioUpdate, broadcastPublicLeaderboard, emitActivityLog } = require('../socket');
const { getUserAvailableBalance, getUserAvailableHolding } = require('../services/orderService');
const { getCurrentSession } = require('../services/sessionService');
const { getUserPortfolio } = require('../services/portfolioService');
const { checkTraderBankruptcy } = require('../services/bankruptcyService');

const router = express.Router();
const prisma = new PrismaClient();

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
    const session = await getCurrentSession();
    if (!session || session.status !== 'ACTIVE' || session.isTradingLocked) {
      let msg = "Trading is locked.";
      if (!session || session.status === 'NOT_STARTED') {
        msg = "Market is closed — waiting for admin to start session";
      } else if (session.status === 'PAUSED') {
        msg = "☕ Market is on break (10-15 Min Break) — trading is temporarily paused by Admin";
      } else if (session.status === 'ENDED') {
        msg = "Market is closed — trading session has ended";
      } else {
        msg = 'Trading is locked for this session (auto-liquidation or ended).';
      }
      return res.status(400).json({ error: msg });
    }

    const { stockId, quantity } = req.body;
    const userId = req.user.userId;

    const parsedQty = parseInt(quantity, 10);
    if (!stockId || isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }

    const stock = await prisma.stock.findUnique({ where: { id: stockId } });
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const totalCost = Math.round(stock.currentPrice * parsedQty * 100) / 100;

    const { availableBalance } = await getUserAvailableBalance(userId);

    if (totalCost > availableBalance) {
      return res.status(400).json({
        error: `Insufficient available wallet balance. Total cost is ${totalCost.toFixed(2)} IC, but your available balance is ${availableBalance.toFixed(2)} IC (after pending limit orders).`
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
        // Weighted-average cost basis. Deliberately NOT rounded to 2dp here:
        // rounding the stored average on every buy compounds across purchases and
        // understates the true cost basis (inflating reported profit). Rounding is
        // applied only at display / payload time.
        const newAvgBuyPrice =
          ((existingHolding.quantity * existingHolding.avgBuyPrice) + (parsedQty * stock.currentPrice)) / newQty;

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
    broadcastPublicLeaderboard();
    await checkTraderBankruptcy(userId);

    // Emit live trade event for admin dashboard feed and real-time roster updates
    try {
      emitActivityLog({
        id: result.transaction.id,
        traderId: userId,
        traderName: req.user.name || portfolio.name || 'Trader',
        symbol: stock.symbol,
        quantity: parsedQty,
        price: stock.currentPrice,
        action: `BOUGHT ${parsedQty} ${stock.symbol}`,
        timestamp: Date.now()
      });
    } catch (e) {}

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
    const session = await getCurrentSession();
    if (!session || session.status !== 'ACTIVE' || session.isTradingLocked) {
      let msg = "Trading is locked.";
      if (!session || session.status === 'NOT_STARTED') {
        msg = "Market is closed — waiting for admin to start session";
      } else if (session.status === 'PAUSED') {
        msg = "☕ Market is on break (10-15 Min Break) — trading is temporarily paused by Admin";
      } else if (session.status === 'ENDED') {
        msg = "Market is closed — trading session has ended";
      } else {
        msg = 'Trading is locked for this session (auto-liquidation or ended).';
      }
      return res.status(400).json({ error: msg });
    }

    const { stockId, quantity } = req.body;
    const userId = req.user.userId;

    const parsedQty = parseInt(quantity, 10);
    if (!stockId || isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }

    const stock = await prisma.stock.findUnique({ where: { id: stockId } });
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const { availableQuantity } = await getUserAvailableHolding(userId, stockId);

    if (parsedQty > availableQuantity) {
      return res.status(400).json({
        error: `Insufficient available shares. You have ${availableQuantity} shares available to sell (after pending limit orders).`
      });
    }

    const proceeds = Math.round(stock.currentPrice * parsedQty * 100) / 100;

    const existingHolding = await prisma.holding.findUnique({
      where: { userId_stockId: { userId, stockId } }
    });

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
    broadcastPublicLeaderboard();
    await checkTraderBankruptcy(userId);

    // Emit live trade event for admin dashboard feed and real-time roster updates
    try {
      emitActivityLog({
        id: result.transaction.id,
        traderId: userId,
        traderName: req.user.name || portfolio.name || 'Trader',
        symbol: stock.symbol,
        quantity: parsedQty,
        price: stock.currentPrice,
        action: `SOLD ${parsedQty} ${stock.symbol}`,
        timestamp: Date.now()
      });
    } catch (e) {}

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
