const express = require('express');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

const { initSocket } = require('./socket');
const { startMarketTicker } = require('./services/marketTicker');

const authRoutes = require('./routes/authRoutes');
const stockRoutes = require('./routes/stockRoutes');
const { router: tradeRoutes } = require('./routes/tradeRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

// Configure environment-driven CORS for production deployment
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000']
  : '*';

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

// Socket.io initialization
initSocket(server);

// Start continuous background market drift ticker
startMarketTicker();

// Routes
app.use('/auth', authRoutes);
app.use('/stocks', stockRoutes);
app.use('/admin', adminRoutes);
app.use('/', tradeRoutes); // Mounts GET /portfolio, POST /trade/buy, POST /trade/sell
app.use('/', stockRoutes); // Mounts GET /news

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Equity Arena Backend', timestamp: new Date() });
});

const PORT = process.env.PORT || 5001;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { app, server };
