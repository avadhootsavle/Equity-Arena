const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { initSocket } = require('./socket');
const { startMarketTicker } = require('./services/marketTicker');
const { ensureNewsTemplatesSeeded } = require('./services/newsService');

// Startup Environment Variables Audit & Validation
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.warn(`[CONFIG WARNING]: Missing required environment variables in .env: ${missingEnvVars.join(', ')}`);
}

// Top-level process safety nets to prevent backend crashes on stray errors
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL UNCAUGHT EXCEPTION]:', err?.stack || err?.message || err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL UNHANDLED REJECTION]:', reason);
});

const authRoutes = require('./routes/authRoutes');
const stockRoutes = require('./routes/stockRoutes');
const { router: tradeRoutes } = require('./routes/tradeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

const app = express();
const server = http.createServer(app);

// Environment & Dynamic CORS configuration (Supports local LAN, Vercel & ngrok deployments)
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((u) => u.trim())
  : ['*'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive fallback for seamless local WiFi / LAN demo
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'ngrok-skip-browser-warning',
    'X-Requested-With',
    'Accept'
  ]
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Socket.io initialization
initSocket(server);

// Start continuous background market drift ticker
startMarketTicker();

// Ensure analyst news templates are populated
ensureNewsTemplatesSeeded();

const distPath = path.join(__dirname, '../../frontend/dist');
const hasClientBuild = fs.existsSync(distPath);

// '/admin' is a client-side route as well as an API prefix. The admin router
// applies requireAdmin to everything under it, so a browser refreshing /admin
// would get 401 JSON instead of the SPA. Serve the page for that one exact
// navigation; every /admin/* API path still goes to the router below.
if (hasClientBuild) {
  app.get('/admin', (req, res, next) => {
    if (req.headers.authorization) return next();
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.sendFile(path.join(distPath, 'index.html'));
  });
}

// API Routes
app.use('/auth', authRoutes);
app.use('/stocks', stockRoutes);
app.use('/admin', adminRoutes);
app.use('/api/admin', adminRoutes); // Dual mount for /api/admin prefix compatibility
app.use('/', tradeRoutes); // Mounts GET /portfolio, POST /trade/buy, POST /trade/sell
app.use('/', orderRoutes); // Mounts POST /orders, DELETE /orders/:id, GET /orders
app.use('/api', orderRoutes); // Dual mount for /api/orders prefix compatibility
app.use('/', stockRoutes); // Mounts GET /news
app.use('/', sessionRoutes); // Mounts GET /api/session, POST /api/admin/session/start

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Equity Arena Backend', timestamp: new Date() });
});

// Serve frontend static build files (if compiled dist folder exists)
if (hasClientBuild) {
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else if (filePath.includes('/assets/') || path.extname(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));

  // SPA Fallback: Serve index.html ONLY for non-asset client routes
  app.use((req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }
    if (path.extname(req.path) || req.path.startsWith('/assets/')) {
      return res.status(404).set('Content-Type', 'text/plain').send('404 Not Found: Missing Asset');
    }
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5001;

if (require.main === module) {
  const listener = server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Equity Arena Server listening on http://0.0.0.0:${PORT} (Bound to all network interfaces)`);
  });

  process.once('SIGUSR2', () => {
    listener.close(() => {
      process.kill(process.pid, 'SIGUSR2');
    });
  });

  const gracefulShutdown = () => {
    listener.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 1000).unref();
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
}

module.exports = { app, server };
