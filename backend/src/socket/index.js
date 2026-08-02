const { Server } = require('socket.io');
const { verifyToken } = require('../utils/auth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        callback(null, true);
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
    const { userId, role, name } = socket.user;
    console.log(`[Socket] Client connected: ${name} (${userId}) [Role: ${role}]`);

    // All authenticated clients join the shared 'traders' room
    socket.join('traders');

    // Each user joins their private room 'user:{userId}'
    socket.join(`user:${userId}`);

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${name} (${userId})`);
    });
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
  if (io) {
    io.to('traders').emit('stock:update', data);
  }
}

function emitNewsBroadcast(data) {
  if (io) {
    io.to('traders').emit('news:broadcast', data);
  }
}

function emitPortfolioUpdate(userId, portfolioData) {
  if (io) {
    io.to(`user:${userId}`).emit('portfolio:update', portfolioData);
  }
}

module.exports = {
  initSocket,
  getIo,
  emitStockUpdate,
  emitNewsBroadcast,
  emitPortfolioUpdate
};
