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
      
      if (!token) {
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
      return next(new Error('Authentication failed: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    try {
      const { userId, role, name } = socket.user || {};
      console.log(`[Socket] Client connected: ${name || 'User'} (${userId}) [Role: ${role}]`);

      // All authenticated clients join the shared 'traders' room
      socket.join('traders');

      // Each user joins their private room 'user:{userId}'
      if (userId) socket.join(`user:${userId}`);

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

module.exports = {
  initSocket,
  getIo,
  emitStockUpdate,
  emitStocksBatchUpdate,
  emitNewsBroadcast,
  emitPortfolioUpdate,
  emitBankruptAlert,
  emitActivityLog
};
