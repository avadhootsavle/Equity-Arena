const { PrismaClient } = require('@prisma/client');
const { emitPortfolioUpdate, broadcastPublicLeaderboard } = require('../socket');

const prisma = new PrismaClient();

/**
 * Calculates user's available wallet balance after reserving funds for PENDING BUY limit orders.
 */
async function getUserAvailableBalance(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { walletBalance: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const pendingBuyOrders = await prisma.order.findMany({
    where: {
      userId,
      type: 'BUY',
      status: 'PENDING'
    },
    select: {
      targetPrice: true,
      quantity: true
    }
  });

  const lockedFunds = Math.round(pendingBuyOrders.reduce((sum, order) => {
    return sum + (order.targetPrice * order.quantity);
  }, 0) * 100) / 100;

  const availableBalance = Math.max(0, Math.round((user.walletBalance - lockedFunds) * 100) / 100);

  return {
    walletBalance: user.walletBalance,
    lockedFunds,
    availableBalance
  };
}

/**
 * Calculates user's available holding quantity after reserving shares for PENDING SELL limit orders.
 */
async function getUserAvailableHolding(userId, stockId) {
  const holding = await prisma.holding.findUnique({
    where: {
      userId_stockId: {
        userId,
        stockId
      }
    }
  });

  const totalQuantity = holding ? holding.quantity : 0;

  const pendingSellOrders = await prisma.order.findMany({
    where: {
      userId,
      stockId,
      type: 'SELL',
      status: 'PENDING'
    },
    select: {
      quantity: true
    }
  });

  const lockedQuantity = pendingSellOrders.reduce((sum, order) => sum + order.quantity, 0);
  const availableQuantity = Math.max(0, totalQuantity - lockedQuantity);

  return {
    holding,
    totalQuantity,
    lockedQuantity,
    availableQuantity
  };
}

/**
 * Helper to emit socket execution alert to specific trader room
 */
function emitOrderExecutionAlert(userId, alertData) {
  try {
    const { getIo } = require('../socket');
    const io = getIo();
    if (io) {
      io.to(`user:${userId}`).emit('order:executed', alertData);
    }
  } catch (err) {
    // Socket emit error safeguard
  }
}

/**
 * Hook executed whenever a stock's price updates.
 * Checks all PENDING limit orders for stockId in chronological order (oldest first).
 */
async function checkAndExecuteLimitOrders(stockId, currentPrice) {
  try {
    const pendingOrders = await prisma.order.findMany({
      where: {
        stockId,
        status: 'PENDING'
      },
      include: {
        stock: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    if (pendingOrders.length === 0) return [];

    const executedOrders = [];

    for (const order of pendingOrders) {
      const qualifiesForBuy = order.type === 'BUY' && currentPrice <= order.targetPrice;
      const qualifiesForSell = order.type === 'SELL' && currentPrice >= order.targetPrice;

      if (!qualifiesForBuy && !qualifiesForSell) {
        continue;
      }

      // Execute order inside transaction
      await prisma.$transaction(async (tx) => {
        const orderUser = await tx.user.findUnique({ where: { id: order.userId } });
        if (!orderUser) return;

        if (order.type === 'BUY') {
          const totalCost = currentPrice * order.quantity;

          // Deduct cost from user wallet
          await tx.user.update({
            where: { id: order.userId },
            data: { walletBalance: { decrement: totalCost } }
          });

          // Update or Create Holding
          const existingHolding = await tx.holding.findUnique({
            where: { userId_stockId: { userId: order.userId, stockId: order.stockId } }
          });

          if (existingHolding) {
            const newTotalQuantity = existingHolding.quantity + order.quantity;
            const newAvgBuyPrice =
              (existingHolding.quantity * existingHolding.avgBuyPrice + totalCost) / newTotalQuantity;

            await tx.holding.update({
              where: { id: existingHolding.id },
              data: {
                quantity: newTotalQuantity,
                avgBuyPrice: newAvgBuyPrice
              }
            });
          } else {
            await tx.holding.create({
              data: {
                userId: order.userId,
                stockId: order.stockId,
                quantity: order.quantity,
                avgBuyPrice: currentPrice
              }
            });
          }

          // Create Transaction Record
          const transactionRecord = await tx.transaction.create({
            data: {
              userId: order.userId,
              stockId: order.stockId,
              type: 'BUY',
              quantity: order.quantity,
              price: currentPrice
            }
          });

          // Mark Order EXECUTED
          const updatedOrder = await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'EXECUTED',
              executedAt: new Date()
            }
          });

          executedOrders.push(updatedOrder);

          // Socket Execution Alert
          emitOrderExecutionAlert(order.userId, {
            order: updatedOrder,
            transaction: transactionRecord,
            message: `Limit Buy executed! Bought ${order.quantity} shares of ${order.stock.symbol} at ${currentPrice.toFixed(2)} IC (Target: ${order.targetPrice.toFixed(2)} IC).`
          });

        } else if (order.type === 'SELL') {
          const totalProceeds = currentPrice * order.quantity;

          const existingHolding = await tx.holding.findUnique({
            where: { userId_stockId: { userId: order.userId, stockId: order.stockId } }
          });

          if (!existingHolding || existingHolding.quantity < order.quantity) {
            // Cannot fulfill sell if holding missing or insufficient
            return;
          }

          // Credit wallet
          await tx.user.update({
            where: { id: order.userId },
            data: { walletBalance: { increment: totalProceeds } }
          });

          // Deduct from holding
          if (existingHolding.quantity === order.quantity) {
            await tx.holding.delete({ where: { id: existingHolding.id } });
          } else {
            await tx.holding.update({
              where: { id: existingHolding.id },
              data: { quantity: { decrement: order.quantity } }
            });
          }

          // Create Transaction Record
          const transactionRecord = await tx.transaction.create({
            data: {
              userId: order.userId,
              stockId: order.stockId,
              type: 'SELL',
              quantity: order.quantity,
              price: currentPrice
            }
          });

          // Mark Order EXECUTED
          const updatedOrder = await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'EXECUTED',
              executedAt: new Date()
            }
          });

          executedOrders.push(updatedOrder);

          // Socket Execution Alert
          emitOrderExecutionAlert(order.userId, {
            order: updatedOrder,
            transaction: transactionRecord,
            message: `Limit Sell executed! Sold ${order.quantity} shares of ${order.stock.symbol} at ${currentPrice.toFixed(2)} IC (Target: ${order.targetPrice.toFixed(2)} IC).`
          });
        }
      });

      // Emit full refreshed portfolio data for the order owner
      try {
        const { getUserPortfolio } = require('./portfolioService');
        const portfolio = await getUserPortfolio(order.userId);
        if (portfolio) {
          emitPortfolioUpdate(order.userId, portfolio);
        }
      } catch (err) {
        // Safe guard
      }
    }

    // Update public leaderboard if any limit orders were filled
    if (executedOrders.length > 0) {
      try {
        await broadcastPublicLeaderboard();
      } catch (err) {
        // Non-critical, don't crash
      }
    }

    return executedOrders;
  } catch (err) {
    console.error('Error executing limit orders:', err);
    return [];
  }
}

module.exports = {
  getUserAvailableBalance,
  getUserAvailableHolding,
  checkAndExecuteLimitOrders
};
