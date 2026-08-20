const { PrismaClient } = require('@prisma/client');
const { getIo } = require('../socket');

const prisma = new PrismaClient();

/**
 * Server-authoritative session state retriever
 */
async function getCurrentSession() {
  let session = await prisma.session.findFirst({
    where: {
      status: { in: ['ACTIVE', 'PAUSED', 'LIQUIDATING'] }
    },
    orderBy: { createdAt: 'desc' }
  });

  // If no active, paused, or liquidating session exists, return NOT_STARTED
  if (!session) {
    return {
      id: null,
      status: 'NOT_STARTED',
      remainingSeconds: 0,
      durationMinutes: 180,
      liquidationBufferMinutes: 5,
      macroCycleIntervalMinutes: 15,
      isLiquidated: false,
      isTradingLocked: true,
      isPaused: false
    };
  }

  const now = new Date();
  
  if (session.status === 'PAUSED') {
    const freezeTime = session.pausedAt ? new Date(session.pausedAt) : now;
    const remainingSeconds = Math.max(0, Math.floor((session.endTime.getTime() - freezeTime.getTime()) / 1000));
    return {
      ...session,
      remainingSeconds,
      isLiquidated: false,
      isTradingLocked: true,
      isPaused: true
    };
  }

  const remainingSeconds = Math.max(0, Math.floor((session.endTime.getTime() - now.getTime()) / 1000));
  const liquidationBufferSeconds = (session.liquidationBufferMinutes || 5) * 60;
  const isLiquidated = session.status === 'LIQUIDATING' || session.status === 'ENDED';
  const isTradingLocked = session.status !== 'ACTIVE' || remainingSeconds <= liquidationBufferSeconds;

  return {
    ...session,
    remainingSeconds,
    isLiquidated,
    isTradingLocked,
    isPaused: false
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
 */
async function startNewSession(options = {}) {
  const current = await getCurrentSession();

  // If a session is already active or paused and force is not specified, return error
  if ((current.status === 'ACTIVE' || current.status === 'PAUSED') && !options.force) {
    const err = new Error(`Trading session is already running (${current.status})! Stop current session first if you want to restart.`);
    err.status = 400;
    throw err;
  }

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

  // End any previous active or liquidating or paused sessions
  await prisma.session.updateMany({
    where: {
      status: { in: ['ACTIVE', 'PAUSED', 'LIQUIDATING'] }
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
    isTradingLocked: false,
    isPaused: false
  };
}

/**
 * Pauses the current active session for a 10-15 minute break (Admin Action)
 */
async function pauseSession() {
  const session = await prisma.session.findFirst({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' }
  });

  if (!session) {
    const err = new Error('No active trading session found to pause!');
    err.status = 400;
    throw err;
  }

  const now = new Date();
  const updatedSession = await prisma.session.update({
    where: { id: session.id },
    data: {
      status: 'PAUSED',
      pausedAt: now
    }
  });

  const remainingSeconds = Math.max(0, Math.floor((session.endTime.getTime() - now.getTime()) / 1000));

  safeEmitSocket('session:paused', {
    sessionId: updatedSession.id,
    status: 'PAUSED',
    message: '☕ MARKET IS ON BREAK (10-15 Min Break): Trading is temporarily paused by Admin.',
    remainingSeconds
  });

  return {
    ...updatedSession,
    remainingSeconds,
    isTradingLocked: true,
    isPaused: true
  };
}

/**
 * Resumes a paused trading session (Admin Action)
 */
async function resumeSession() {
  const session = await prisma.session.findFirst({
    where: { status: 'PAUSED' },
    orderBy: { createdAt: 'desc' }
  });

  if (!session) {
    const err = new Error('No paused trading session found to resume!');
    err.status = 400;
    throw err;
  }

  const now = new Date();
  const pauseDurationMs = session.pausedAt ? (now.getTime() - new Date(session.pausedAt).getTime()) : 0;
  const newEndTime = new Date(session.endTime.getTime() + pauseDurationMs);

  const updatedSession = await prisma.session.update({
    where: { id: session.id },
    data: {
      status: 'ACTIVE',
      endTime: newEndTime,
      pausedAt: null
    }
  });

  const remainingSeconds = Math.max(0, Math.floor((newEndTime.getTime() - now.getTime()) / 1000));

  safeEmitSocket('session:resumed', {
    sessionId: updatedSession.id,
    status: 'ACTIVE',
    endTime: newEndTime,
    message: '🔔 MARKET RESUMED: Trading floor is unlocked!',
    remainingSeconds
  });

  return {
    ...updatedSession,
    remainingSeconds,
    isTradingLocked: false,
    isPaused: false
  };
}

/**
 * Manually stops/ends the current trading session (Admin Action)
 */
async function stopSession() {
  const session = await prisma.session.findFirst({
    where: { status: { in: ['ACTIVE', 'PAUSED', 'LIQUIDATING'] } },
    orderBy: { createdAt: 'desc' }
  });

  if (!session) {
    const err = new Error('No active or paused session found to stop!');
    err.status = 400;
    throw err;
  }

  const updatedSession = await prisma.session.update({
    where: { id: session.id },
    data: { status: 'ENDED' }
  });

  safeEmitSocket('session:ended', {
    sessionId: updatedSession.id,
    status: 'ENDED',
    message: '🔒 MARKET CLOSED: Trading session stopped by Admin.'
  });

  return {
    ...updatedSession,
    remainingSeconds: 0,
    isTradingLocked: true,
    isPaused: false
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

let lastAutoBackupTime = 0;

/**
 * Checks session timing on every market tick and server startup
 */
async function checkSessionTimers() {
  const session = await getCurrentSession();
  if (session.status === 'NOT_STARTED') return session;

  const now = Date.now();
  if (session.status === 'ACTIVE' && (now - lastAutoBackupTime > 15 * 60 * 1000)) {
    lastAutoBackupTime = now;
    try {
      const { runDatabaseBackup } = require('../../scripts/backup-db');
      runDatabaseBackup().catch(() => {});
    } catch (e) {}
  }

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

    try {
      const { runDatabaseBackup } = require('../../scripts/backup-db');
      runDatabaseBackup().catch(() => {});
    } catch (e) {}

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
  pauseSession,
  resumeSession,
  stopSession,
  triggerAutoLiquidation,
  checkSessionTimers,
  getUsedTemplateIds,
  markTemplateUsed,
  resetUsedTemplates
};
