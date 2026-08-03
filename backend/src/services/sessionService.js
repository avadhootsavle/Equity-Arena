const { PrismaClient } = require('@prisma/client');
const { getIO } = require('../socket');

const prisma = new PrismaClient();

/**
 * Server-authoritative session state retriever
 */
async function getCurrentSession() {
  let session = await prisma.session.findFirst({
    where: {
      status: { in: ['ACTIVE', 'LIQUIDATING'] }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!session) {
    session = await prisma.session.findFirst({
      orderBy: { createdAt: 'desc' }
    });
  }

  // If no session exists in DB at all, auto-initialize a default 3-hour session
  if (!session) {
    const now = new Date();
    const endTime = new Date(now.getTime() + 3 * 3600 * 1000);
    session = await prisma.session.create({
      data: {
        startTime: now,
        endTime: endTime,
        status: 'ACTIVE'
      }
    });
  }

  const now = new Date();
  const remainingSeconds = Math.max(0, Math.floor((session.endTime.getTime() - now.getTime()) / 1000));
  const isLiquidated = session.status === 'LIQUIDATING' || session.status === 'ENDED';
  const isTradingLocked = session.status === 'ENDED' || (remainingSeconds <= 300 && session.status === 'LIQUIDATING');

  return {
    ...session,
    remainingSeconds,
    isLiquidated,
    isTradingLocked
  };
}

function safeEmitSocket(eventName, data) {
  try {
    const io = getIO();
    if (io && typeof io.emit === 'function') {
      io.emit(eventName, data);
    }
  } catch (err) {
    // Silent fallback when running outside socket server context
  }
}

const usedTemplateIds = new Set();

function getUsedTemplateIds() {
  return Array.from(usedTemplateIds);
}

function markTemplateUsed(templateId) {
  if (templateId) usedTemplateIds.add(templateId);
}

function resetUsedTemplates() {
  usedTemplateIds.clear();
}

/**
 * Starts a new 3-hour session (Admin Action)
 * Prevents overlapping sessions by ending any active/liquidating sessions first.
 */
async function startNewSession(durationHours = 3) {
  const now = new Date();
  const endTime = new Date(now.getTime() + durationHours * 3600 * 1000);

  // Clear used news template tracking for the fresh session
  resetUsedTemplates();

  // End any previous active or liquidating sessions
  await prisma.session.updateMany({
    where: {
      status: { in: ['ACTIVE', 'LIQUIDATING'] }
    },
    data: { status: 'ENDED' }
  });

  // Create new active session
  const newSession = await prisma.session.create({
    data: {
      startTime: now,
      endTime: endTime,
      status: 'ACTIVE'
    }
  });

  const remainingSeconds = Math.floor((endTime.getTime() - now.getTime()) / 1000);

  safeEmitSocket('session:started', {
    sessionId: newSession.id,
    startTime: newSession.startTime,
    endTime: newSession.endTime,
    status: 'ACTIVE',
    remainingSeconds
  });

  return {
    ...newSession,
    remainingSeconds,
    isLiquidated: false,
    isTradingLocked: false
  };
}

/**
 * Atomic 5-Minute Auto-Liquidation Sweep
 * Converts all stock holdings to cash at current market price & cancels all pending limit orders.
 */
async function triggerAutoLiquidation() {
  console.log('⚡ SERVER AUTO-LIQUIDATION SWEEP INITIATED (5 MINUTES TO SESSION END)');

  // 1. Set Session Status to LIQUIDATING
  const activeSession = await prisma.session.findFirst({
    where: { status: { in: ['ACTIVE', 'LIQUIDATING'] } },
    orderBy: { createdAt: 'desc' }
  });

  if (activeSession && activeSession.status === 'ACTIVE') {
    await prisma.session.update({
      where: { id: activeSession.id },
      data: { status: 'LIQUIDATING' }
    });
  }

  // 2. Cancel ALL PENDING limit orders across all users in one atomic pass
  const pendingOrders = await prisma.order.findMany({
    where: { status: 'PENDING' }
  });

  if (pendingOrders.length > 0) {
    await prisma.order.updateMany({
      where: { status: 'PENDING' },
      data: { status: 'CANCELLED' }
    });
    console.log(`✅ Cancelled ${pendingOrders.length} pending limit orders prior to liquidation sweep.`);
  }

  // 3. Query all trader holdings with stocks
  const holdings = await prisma.holding.findMany({
    include: { user: true, stock: true }
  });

  if (holdings.length === 0) {
    console.log('ℹ️ No active stock holdings to liquidate.');
  } else {
    // Group holdings by userId
    const userHoldingsMap = new Map();
    holdings.forEach((h) => {
      if (!userHoldingsMap.has(h.userId)) {
        userHoldingsMap.set(h.userId, []);
      }
      userHoldingsMap.get(h.userId).push(h);
    });

    // Perform atomic transaction per trader
    for (const [userId, userHoldings] of userHoldingsMap.entries()) {
      let totalProceeds = 0;
      const transactionsToCreate = [];

      userHoldings.forEach((h) => {
        const value = h.quantity * h.stock.currentPrice;
        totalProceeds += value;
        transactionsToCreate.push({
          userId,
          stockId: h.stockId,
          type: 'SELL',
          quantity: h.quantity,
          price: h.stock.currentPrice
        });
      });

      await prisma.$transaction([
        // Credit trader's wallet
        prisma.user.update({
          where: { id: userId },
          data: {
            walletBalance: { increment: totalProceeds }
          }
        }),
        // Create SELL transaction logs
        prisma.transaction.createMany({
          data: transactionsToCreate
        }),
        // Delete holdings
        prisma.holding.deleteMany({
          where: { userId }
        })
      ]);

      console.log(`✅ Liquidated ${userHoldings.length} positions for trader ${userId} (+${totalProceeds.toFixed(2)} IC cash)`);
    }
  }

  // Broadcast WebSocket notification to all clients
  safeEmitSocket('session:liquidated', {
    message: 'AUTO-LIQUIDATION EXECUTED: All stock positions converted to cash at spot prices, pending orders cancelled.'
  });
}

/**
 * Checks session timing on every market tick and server startup
 */
async function checkSessionTimers() {
  const session = await getCurrentSession();
  const remainingSeconds = session.remainingSeconds;

  // Auto-Liquidation Trigger: 5 minutes left (300 seconds) and status is ACTIVE
  if (remainingSeconds <= 300 && session.status === 'ACTIVE') {
    await triggerAutoLiquidation();
  }

  // Session End Trigger: 0 seconds left and status is not ENDED
  if (remainingSeconds <= 0 && session.status !== 'ENDED') {
    await prisma.session.update({
      where: { id: session.id },
      data: { status: 'ENDED' }
    });

    console.log('🏁 SESSION ENDED: Trading is completely locked.');

    safeEmitSocket('session:ended', {
      sessionId: session.id,
      message: 'SESSION ENDED: Final trading results locked.'
    });
  }

  return session;
}

module.exports = {
  getCurrentSession,
  startNewSession,
  triggerAutoLiquidation,
  checkSessionTimers,
  getUsedTemplateIds,
  markTemplateUsed,
  resetUsedTemplates
};
