const { Server } = require('socket.io');
const { verifyToken } = require('../utils/auth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
let io = null;

function initSocket(server) {
  const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((u) => u.trim())
    : ['*'];

  io = new Server(server, {
    pingInterval: 10000,
    pingTimeout: 5000,
    transports: ['websocket', 'polling'],
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['ngrok-skip-browser-warning', 'Authorization', 'Content-Type']
    }
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || 
                    socket.handshake.headers?.authorization?.replace('Bearer ', '');
      const isPublic = socket.handshake.auth?.isPublic || socket.handshake.query?.isPublic === 'true';

      if (!token) {
        if (isPublic) {
          socket.user = {
            userId: 'PUBLIC_' + Math.random().toString(36).substring(2, 9),
            role: 'PUBLIC',
            name: 'Public Audience Viewer'
          };
          return next();
        }
        return next(new Error('Authentication token missing'));
      }

      const decoded = verifyToken(token);
      
      let userName = decoded.name;
      if (!userName && decoded.userId) {
        const u = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { name: true }
        });
        if (u) userName = u.name;
      }

      socket.user = {
        userId: decoded.userId,
        role: decoded.role,
        name: userName || 'Authenticated User'
      };

      next();
    } catch (err) {
      if (socket.handshake.auth?.isPublic || socket.handshake.query?.isPublic === 'true') {
        socket.user = {
          userId: 'PUBLIC_' + Math.random().toString(36).substring(2, 9),
          role: 'PUBLIC',
          name: 'Public Audience Viewer'
        };
        return next();
      }
      return next(new Error('Authentication failed: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    try {
      const { userId, role, name } = socket.user || {};
      console.log(`[Socket] Client connected: ${name || 'User'} (${userId}) [Role: ${role}]`);

      if (role === 'PUBLIC') {
        // Public viewers join ONLY the read-only 'public-leaderboard' room
        socket.join('public-leaderboard');
      } else {
        // All authenticated clients join the shared 'traders' room
        socket.join('traders');

        // Each user joins their private room 'user:{userId}'
        if (userId) socket.join(`user:${userId}`);
      }

      socket.on('error', (err) => {
        console.warn(`[Socket Error] Client ${name || 'User'} (${userId}):`, err?.message || err);
      });

      socket.on('disconnect', (reason) => {
        console.log(`[Socket] Client disconnected: ${name || 'User'} (${userId}) [Reason: ${reason}]`);
      });
    } catch (err) {
      console.error('[Socket Connection Handler Error]:', err);
    }
  });

  return io;
}

function getIo() {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
}

function emitStockUpdate(data) {
  try {
    if (io) io.to('traders').emit('stock:update', data);
  } catch (err) {
    console.error('[Socket emitStockUpdate error]:', err.message);
  }
}

function emitStocksBatchUpdate(batchData) {
  try {
    if (io && Array.isArray(batchData) && batchData.length > 0) {
      io.to('traders').emit('stocks:batch-update', {
        updates: batchData,
        timestamp: Date.now()
      });
    }
  } catch (err) {
    console.error('[Socket emitStocksBatchUpdate error]:', err.message);
  }
}

function emitNewsBroadcast(data) {
  try {
    if (io) io.to('traders').emit('news:broadcast', data);
  } catch (err) {
    console.error('[Socket emitNewsBroadcast error]:', err.message);
  }
}

function emitPortfolioUpdate(userId, portfolioData) {
  try {
    if (io && userId) io.to(`user:${userId}`).emit('portfolio:update', portfolioData);
  } catch (err) {
    console.error('[Socket emitPortfolioUpdate error]:', err.message);
  }
}

function emitBankruptAlert(data) {
  try {
    if (io) io.to('traders').emit('bankrupt:alert', data);
  } catch (err) {
    console.error('[Socket emitBankruptAlert error]:', err.message);
  }
}

function emitActivityLog(data) {
  try {
    if (io) io.to('traders').emit('activity:log', data);
  } catch (err) {
    console.error('[Socket emitActivityLog error]:', err.message);
  }
}

function emitPublicLeaderboardUpdate(data) {
  try {
    if (io) io.to('public-leaderboard').emit('leaderboard:update', data);
  } catch (err) {
    console.error('[Socket emitPublicLeaderboardUpdate error]:', err.message);
  }
}

async function broadcastPublicLeaderboard() {
  try {
    if (!io) return;
    const traders = await prisma.user.findMany({
      where: { role: 'TRADER', isTestAccount: false },
      include: {
        holdings: {
          include: { stock: { select: { currentPrice: true } } }
        }
      }
    });

    const leaderboard = traders.map((trader) => {
      const holdingsValue = trader.holdings.reduce((sum, h) => {
        return sum + (h.quantity * (h.stock?.currentPrice || 0));
      }, 0);

      const totalValue = Math.round((trader.walletBalance + holdingsValue) * 100) / 100;
      const returnPercent = Math.round((((totalValue - 20000) / 20000) * 100) * 10) / 10;

      return {
        name: trader.name || trader.email.split('@')[0],
        totalValue,
        returnPercent
      };
    });

    leaderboard.sort((a, b) => b.totalValue - a.totalValue);

    const rankedLeaderboard = leaderboard.map((item, index) => ({
      rank: index + 1,
      ...item
    }));

    emitPublicLeaderboardUpdate(rankedLeaderboard);
  } catch (err) {
    console.error('[broadcastPublicLeaderboard error]:', err.message);
  }
}

module.exports = {
  initSocket,
  getIo,
  emitStockUpdate,
  emitStocksBatchUpdate,
  emitNewsBroadcast,
  emitPortfolioUpdate,
  emitBankruptAlert,
  emitActivityLog,
  emitPublicLeaderboardUpdate,
  broadcastPublicLeaderboard
};
