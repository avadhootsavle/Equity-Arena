const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/authMiddleware');
const { tradeRateLimiter } = require('../middleware/rateLimiter');
const {
  getUserAvailableBalance,
  getUserAvailableHolding,
  checkAndExecuteLimitOrders
} = require('../services/orderService');
const { getCurrentSession } = require('../services/sessionService');

const router = express.Router();
const prisma = new PrismaClient();

// POST /orders — Place a Limit Buy or Limit Sell Order
router.post('/orders', authenticateToken, tradeRateLimiter, async (req, res) => {
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

    const { stockId, type, targetPrice, quantity } = req.body;
    const userId = req.user.userId;

    if (!stockId || !type || !targetPrice || !quantity) {
      return res.status(400).json({ error: 'stockId, type, targetPrice, and quantity are required' });
    }

    const uppercaseType = type.toUpperCase();
    if (!['BUY', 'SELL'].includes(uppercaseType)) {
      return res.status(400).json({ error: 'type must be BUY or SELL' });
    }

    const parsedTargetPrice = parseFloat(targetPrice);
    const parsedQuantity = parseInt(quantity, 10);

    if (isNaN(parsedTargetPrice) || parsedTargetPrice <= 0) {
      return res.status(400).json({ error: 'targetPrice must be a positive number' });
    }

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ error: 'quantity must be a positive integer' });
    }

    const stock = await prisma.stock.findUnique({ where: { id: stockId } });
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    // Validate available funds or holdings
    if (uppercaseType === 'BUY') {
      const { availableBalance } = await getUserAvailableBalance(userId);
      const totalCost = parsedTargetPrice * parsedQuantity;

      if (totalCost > availableBalance) {
        return res.status(400).json({
          error: `Insufficient available funds for Limit Buy order. Required: ${totalCost.toFixed(2)} IC, Available: ${availableBalance.toFixed(2)} IC`
        });
      }
    } else if (uppercaseType === 'SELL') {
      const { availableQuantity } = await getUserAvailableHolding(userId, stockId);

      if (parsedQuantity > availableQuantity) {
        return res.status(400).json({
          error: `Insufficient available shares for Limit Sell order. Required: ${parsedQuantity}, Available: ${availableQuantity}`
        });
      }
    }

    // Create PENDING Order
    const newOrder = await prisma.order.create({
      data: {
        userId,
        stockId,
        type: uppercaseType,
        targetPrice: parsedTargetPrice,
        quantity: parsedQuantity,
        status: 'PENDING'
      },
      include: {
        stock: true
      }
    });

    // Check immediate execution in case current live price already satisfies target
    const executed = await checkAndExecuteLimitOrders(stockId, stock.currentPrice);
    const wasExecutedImmediately = executed.some((o) => o.id === newOrder.id);

    const refetchedOrder = await prisma.order.findUnique({
      where: { id: newOrder.id },
      include: { stock: true }
    });

    return res.status(201).json({
      message: wasExecutedImmediately
        ? `Limit ${uppercaseType} order executed immediately at ${stock.currentPrice.toFixed(2)} IC!`
        : `Limit ${uppercaseType} order placed successfully at target ${parsedTargetPrice.toFixed(2)} IC!`,
      order: refetchedOrder
    });
  } catch (err) {
    console.error('Error placing limit order:', err);
    return res.status(500).json({ error: 'Failed to place limit order' });
  }
});

// PATCH & PUT /orders/:id — Update a Pending Order (targetPrice and/or quantity)
const handleUpdateOrder = async (req, res) => {
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

    const { id } = req.params;
    const userId = req.user.userId;
    const { targetPrice, quantity } = req.body;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { stock: true }
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (existingOrder.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You can only edit your own orders' });
    }

    if (existingOrder.status !== 'PENDING') {
      return res.status(400).json({ error: `Cannot edit order with status ${existingOrder.status}` });
    }

    const newTargetPrice = targetPrice !== undefined ? parseFloat(targetPrice) : existingOrder.targetPrice;
    const newQuantity = quantity !== undefined ? parseInt(quantity, 10) : existingOrder.quantity;

    if (isNaN(newTargetPrice) || newTargetPrice <= 0) {
      return res.status(400).json({ error: 'targetPrice must be a positive number' });
    }

    if (isNaN(newQuantity) || newQuantity <= 0) {
      return res.status(400).json({ error: 'quantity must be a positive integer' });
    }

    // Check availability based on order type (BUY or SELL)
    if (existingOrder.type === 'BUY') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true }
      });
      const walletBalance = user ? user.walletBalance : 0;

      const otherPendingBuys = await prisma.order.findMany({
        where: {
          userId,
          type: 'BUY',
          status: 'PENDING',
          id: { not: id }
        },
        select: { targetPrice: true, quantity: true }
      });

      const otherLockedFunds = otherPendingBuys.reduce((sum, o) => sum + (o.targetPrice * o.quantity), 0);
      const availableCashForThisOrder = walletBalance - otherLockedFunds;
      const newCost = newTargetPrice * newQuantity;

      if (newCost > availableCashForThisOrder) {
        return res.status(400).json({
          error: `Insufficient available funds for updated Limit Buy order. Required: ${newCost.toFixed(2)} IC, Available: ${Math.max(0, availableCashForThisOrder).toFixed(2)} IC`
        });
      }
    } else if (existingOrder.type === 'SELL') {
      const holding = await prisma.holding.findUnique({
        where: { userId_stockId: { userId, stockId: existingOrder.stockId } }
      });

      const totalOwnedShares = holding ? holding.quantity : 0;

      const otherPendingSells = await prisma.order.findMany({
        where: {
          userId,
          stockId: existingOrder.stockId,
          type: 'SELL',
          status: 'PENDING',
          id: { not: id }
        },
        select: { quantity: true }
      });

      const otherLockedShares = otherPendingSells.reduce((sum, o) => sum + o.quantity, 0);
      const availableSharesForThisOrder = totalOwnedShares - otherLockedShares;

      if (newQuantity > availableSharesForThisOrder) {
        return res.status(400).json({
          error: `Insufficient available shares for updated Limit Sell order. Required: ${newQuantity}, Available: ${Math.max(0, availableSharesForThisOrder)}`
        });
      }
    }

    // Update the pending order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        targetPrice: newTargetPrice,
        quantity: newQuantity
      },
      include: { stock: true }
    });

    // Check for immediate execution if current live price satisfies updated target
    const stock = existingOrder.stock;
    const executed = await checkAndExecuteLimitOrders(stock.id, stock.currentPrice);
    const wasExecutedImmediately = executed.some((o) => o.id === id);

    const refetchedOrder = await prisma.order.findUnique({
      where: { id },
      include: { stock: true }
    });

    return res.json({
      message: wasExecutedImmediately
        ? `Limit ${updatedOrder.type} order executed immediately at ${stock.currentPrice.toFixed(2)} IC!`
        : `Limit ${updatedOrder.type} order for ${stock.symbol} updated successfully (Target: ${newTargetPrice.toFixed(2)} IC, Qty: ${newQuantity}).`,
      order: refetchedOrder
    });
  } catch (err) {
    console.error('Error updating limit order:', err);
    return res.status(500).json({ error: 'Failed to update limit order' });
  }
};

router.patch('/orders/:id', authenticateToken, tradeRateLimiter, handleUpdateOrder);
router.put('/orders/:id', authenticateToken, tradeRateLimiter, handleUpdateOrder);

// DELETE /orders/:id — Cancel a Pending Order
router.delete('/orders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { stock: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You can only cancel your own orders' });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({ error: `Cannot cancel order with status ${order.status}` });
    }

    const cancelledOrder = await prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { stock: true }
    });

    return res.json({
      message: `Limit ${cancelledOrder.type} order for ${cancelledOrder.stock.symbol} cancelled successfully. Locked ${cancelledOrder.type === 'BUY' ? 'funds' : 'shares'} released.`,
      order: cancelledOrder
    });
  } catch (err) {
    console.error('Error cancelling limit order:', err);
    return res.status(500).json({ error: 'Failed to cancel limit order' });
  }
});

// GET /orders — Get Trader's Pending & Historical Limit Orders
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const pendingOrders = await prisma.order.findMany({
      where: {
        userId,
        status: 'PENDING'
      },
      include: {
        stock: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const historicalOrders = await prisma.order.findMany({
      where: {
        userId,
        status: { in: ['EXECUTED', 'CANCELLED'] }
      },
      include: {
        stock: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    const balanceInfo = await getUserAvailableBalance(userId);

    return res.json({
      pendingOrders,
      historicalOrders,
      ...balanceInfo
    });
  } catch (err) {
    console.error('Error fetching trader orders:', err);
    return res.status(500).json({ error: 'Failed to fetch limit orders' });
  }
});

module.exports = router;
