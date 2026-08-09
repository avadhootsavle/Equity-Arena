const { PrismaClient } = require('@prisma/client');
const { getIo } = require('../socket');

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

  // If no active or liquidating session exists, return NOT_STARTED
  if (!session) {
    return {
      id: null,
      status: 'NOT_STARTED',
      remainingSeconds: 0,
      durationMinutes: 180,
      liquidationBufferMinutes: 5,
      macroCycleIntervalMinutes: 15,
      isLiquidated: false,
      isTradingLocked: true
    };
  }

  const now = new Date();
  const remainingSeconds = Math.max(0, Math.floor((session.endTime.getTime() - now.getTime()) / 1000));
  const liquidationBufferSeconds = (session.liquidationBufferMinutes || 5) * 60;
  const isLiquidated = session.status === 'LIQUIDATING' || session.status === 'ENDED';
  const isTradingLocked = session.status !== 'ACTIVE' || remainingSeconds <= liquidationBufferSeconds;

  return {
    ...session,
    remainingSeconds,
    isLiquidated,
    isTradingLocked
  };
}

function safeEmitSocket(eventName, data) {
  try {
    const io = getIo();
    if (io) {
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
 * Starts a new session with admin-configured parameters (Admin Action)
 * Prevents overlapping sessions by ending any active/liquidating sessions first.
 */
async function startNewSession(options = {}) {
  let durationMins = 180;
  let bufferMins = 5;
  let macroMins = 15;

  if (typeof options === 'object' && options !== null) {
    if (options.durationMinutes !== undefined) durationMins = parseInt(options.durationMinutes, 10) || 180;
    if (options.liquidationBufferMinutes !== undefined) bufferMins = parseInt(options.liquidationBufferMinutes, 10) || 5;
    if (options.macroCycleIntervalMinutes !== undefined) macroMins = parseInt(options.macroCycleIntervalMinutes, 10) || 15;
  } else if (typeof options === 'number') {
    durationMins = options * 60;
  }

  const now = new Date();
  const endTime = new Date(now.getTime() + durationMins * 60 * 1000);

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
      durationMinutes: durationMins,
      liquidationBufferMinutes: bufferMins,
      macroCycleIntervalMinutes: macroMins,
      status: 'ACTIVE'
    }
  });

  const remainingSeconds = Math.floor((endTime.getTime() - now.getTime()) / 1000);

  // Dynamically update market ticker macro cycle base interval
  try {
    const { setBaseMacroIntervalMinutes } = require('./marketTicker');
    if (typeof setBaseMacroIntervalMinutes === 'function') {
      setBaseMacroIntervalMinutes(macroMins);
    }
  } catch (err) {
    // Ignore fallback
  }

  safeEmitSocket('session:started', {
    sessionId: newSession.id,
    startTime: newSession.startTime,
    endTime: newSession.endTime,
    durationMinutes: durationMins,
    liquidationBufferMinutes: bufferMins,
    macroCycleIntervalMinutes: macroMins,
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
      try {
        const { getUserPortfolio } = require('./portfolioService');
        const { emitPortfolioUpdate } = require('../socket');
        const pData = await getUserPortfolio(userId);
        if (pData) emitPortfolioUpdate(userId, pData);
      } catch (e) {
        // Safe guard
      }
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
  if (session.status === 'NOT_STARTED') return session;

  const remainingSeconds = session.remainingSeconds;
  const liquidationBufferSeconds = (session.liquidationBufferMinutes || 5) * 60;

  // Auto-Liquidation Trigger: when remainingSeconds <= liquidationBufferSeconds and status is ACTIVE
  if (remainingSeconds <= liquidationBufferSeconds && session.status === 'ACTIVE') {
    await triggerAutoLiquidation();
  }

  // Session End Trigger: 0 seconds left and status is not ENDED
  if (remainingSeconds <= 0 && session.status !== 'ENDED') {
    if (session.id) {
      await prisma.session.update({
        where: { id: session.id },
        data: { status: 'ENDED' }
      });
    }

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
