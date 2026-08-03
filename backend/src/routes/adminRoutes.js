const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const { emitStockUpdate, emitNewsBroadcast } = require('../socket');
const { checkAndExecuteLimitOrders } = require('../services/orderService');
const { applyNewsImpact } = require('../services/marketTicker');

const router = express.Router();
const prisma = new PrismaClient();

const pendingDelayedNews = [];

function getRandomVolume(min = 50000, max = 120000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

router.use(authenticateToken, requireAdmin);

// GET /admin/trader/:id (Single-Query Admin Trader Drill-Down Endpoint)
router.get('/trader/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const trader = await prisma.user.findUnique({
      where: { id },
      include: {
        holdings: {
          include: {
            stock: true
          }
        },
        transactions: {
          orderBy: { timestamp: 'desc' },
          include: {
            stock: {
              select: { symbol: true, name: true }
            }
          }
        }
      }
    });

    if (!trader) {
      return res.status(404).json({ error: 'Trader not found' });
    }

    const holdingsWithPL = trader.holdings.map((h) => {
      const currentValue = Math.round(h.quantity * h.stock.currentPrice * 100) / 100;
      const totalCost = Math.round(h.quantity * h.avgBuyPrice * 100) / 100;
      const unrealizedPL = Math.round((currentValue - totalCost) * 100) / 100;

      return {
        id: h.id,
        stockId: h.stockId,
        symbol: h.stock.symbol,
        name: h.stock.name,
        quantity: h.quantity,
        avgBuyPrice: h.avgBuyPrice,
        currentPrice: h.stock.currentPrice,
        currentValue,
        unrealizedPL
      };
    });

    const holdingsValue = holdingsWithPL.reduce((sum, h) => sum + h.currentValue, 0);
    const totalPortfolioValue = Math.round((trader.walletBalance + holdingsValue) * 100) / 100;

    return res.json({
      trader: {
        id: trader.id,
        name: trader.name,
        email: trader.email,
        walletBalance: Math.round(trader.walletBalance * 100) / 100,
        holdingsValue: Math.round(holdingsValue * 100) / 100,
        totalPortfolioValue,
        createdAt: trader.createdAt
      },
      holdings: holdingsWithPL,
      transactions: trader.transactions
    });
  } catch (err) {
    console.error('Get admin trader drill-down error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /admin/stock/:id/adjust
router.post('/stock/:id/adjust', async (req, res) => {
  try {
    const { id } = req.params;
    const { percent } = req.body;

    const parsedPercent = parseFloat(percent);
    if (isNaN(parsedPercent) || parsedPercent < -99 || parsedPercent > 1000) {
      return res.status(400).json({ error: 'Adjustment percentage must be between -99% and +1000%' });
    }

    const stock = await prisma.stock.findUnique({ where: { id } });
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const rawNewPrice = stock.currentPrice * (1 + parsedPercent / 100);
    const newPrice = Math.max(0.50, Math.round(rawNewPrice * 100) / 100);
    const highVolume = getRandomVolume(60000, 150000);

    const [updatedStock, newHistory] = await prisma.$transaction([
      prisma.stock.update({
        where: { id },
        data: { currentPrice: newPrice }
      }),
      prisma.priceHistory.create({
        data: {
          stockId: id,
          price: newPrice,
          volume: highVolume
        }
      })
    ]);

    const percentChange = stock.basePrice > 0
      ? Math.round((((newPrice - stock.basePrice) / stock.basePrice) * 100) * 100) / 100
      : 0;

    emitStockUpdate({
      stockId: updatedStock.id,
      symbol: updatedStock.symbol,
      name: updatedStock.name,
      newPrice: updatedStock.currentPrice,
      volume: newHistory.volume,
      percentChange,
      timestamp: newHistory.timestamp
    });

    // Check limit order execution
    await checkAndExecuteLimitOrders(updatedStock.id, newPrice);

    return res.json({
      message: 'Stock price updated successfully',
      stock: updatedStock,
      percentChange
    });
  } catch (err) {
    console.error('Adjust stock price error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /admin/news (Custom news broadcast)
router.post('/news', async (req, res) => {
  try {
    const { message, stockId } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'News message is required' });
    }

    let stockSymbol = null;
    if (stockId) {
      const stock = await prisma.stock.findUnique({ where: { id: stockId } });
      if (!stock) {
        return res.status(404).json({ error: 'Associated stock not found' });
      }
      stockSymbol = stock.symbol;
    }

    const news = await prisma.news.create({
      data: {
        message: message.trim(),
        stockId: stockId || null
      }
    });

    emitNewsBroadcast({
      id: news.id,
      message: news.message,
      stockId: news.stockId,
      stockSymbol,
      timestamp: news.timestamp
    });

    return res.status(201).json({
      message: 'News broadcasted successfully',
      news
    });
  } catch (err) {
    console.error('Broadcast news error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /admin/news-templates
router.get('/news-templates', async (req, res) => {
  try {
    const templates = await prisma.newsTemplate.findMany({
      orderBy: { createdAt: 'asc' }
    });
    return res.json({ templates, pendingDelayedNews });
  } catch (err) {
    console.error('Get news templates error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /admin/news/trigger-template
router.post('/news/trigger-template', async (req, res) => {
  try {
    const { templateId, delaySeconds } = req.body;
    const delay = Math.max(0, parseInt(delaySeconds, 10) || 60);

    const template = await prisma.newsTemplate.findUnique({ where: { id: templateId } });
    if (!template) {
      return res.status(404).json({ error: 'News template not found' });
    }

    const news = await prisma.news.create({
      data: {
        message: template.headline,
        stockId: null
      }
    });

    emitNewsBroadcast({
      id: news.id,
      message: news.message,
      stockId: null,
      stockSymbol: null,
      timestamp: news.timestamp
    });

    const pendingItem = {
      id: `pending_${Date.now()}`,
      templateId: template.id,
      headline: template.headline,
      sector: template.sector,
      effectPercent: template.effectPercent,
      delaySeconds: delay,
      triggerAt: new Date(Date.now() + delay * 1000)
    };
    pendingDelayedNews.push(pendingItem);

    // Apply Quant news drift & volatility impact shift over duration window
    applyNewsImpact(template.sector, template.effectPercent, delay + 30);

    const totalPreMovePercent = template.effectPercent * 0.15;
    const totalTicks = Math.max(1, Math.floor(delay / 6));
    const preMovePerTickPercent = totalPreMovePercent / totalTicks;

    const preMoveInterval = setInterval(async () => {
      try {
        const targetSectors = template.sector.split(',').map((s) => s.trim());
        const targetStocks = await prisma.stock.findMany({
          where: { sector: { in: targetSectors } }
        });

        for (const stock of targetStocks) {
          const rawNewPrice = stock.currentPrice * (1 + preMovePerTickPercent / 100);
          const newPrice = Math.max(0.50, Math.round(rawNewPrice * 100) / 100);
          const preMoveVolume = getRandomVolume(40000, 90000);

          const [updatedStock, newHistory] = await prisma.$transaction([
            prisma.stock.update({
              where: { id: stock.id },
              data: { currentPrice: newPrice }
            }),
            prisma.priceHistory.create({
              data: {
                stockId: stock.id,
                price: newPrice,
                volume: preMoveVolume
              }
            })
          ]);

          const percentChange = stock.basePrice > 0
            ? Math.round((((newPrice - stock.basePrice) / stock.basePrice) * 100) * 100) / 100
            : 0;

          emitStockUpdate({
            stockId: updatedStock.id,
            symbol: updatedStock.symbol,
            name: updatedStock.name,
            newPrice: updatedStock.currentPrice,
            volume: newHistory.volume,
            percentChange,
            timestamp: newHistory.timestamp
          });

          await checkAndExecuteLimitOrders(updatedStock.id, newPrice);
        }
      } catch (err) {
        console.error('Pre-move drift tick error:', err);
      }
    }, 6000);

    setTimeout(async () => {
      clearInterval(preMoveInterval);

      try {
        const targetSectors = template.sector.split(',').map((s) => s.trim());
        const targetStocks = await prisma.stock.findMany({
          where: { sector: { in: targetSectors } }
        });

        const remainingEffectPercent = template.effectPercent * 0.85;

        for (const stock of targetStocks) {
          const rawNewPrice = stock.currentPrice * (1 + remainingEffectPercent / 100);
          const newPrice = Math.max(0.50, Math.round(rawNewPrice * 100) / 100);
          const spikeVolume = getRandomVolume(80000, 180000);

          const [updatedStock, newHistory] = await prisma.$transaction([
            prisma.stock.update({
              where: { id: stock.id },
              data: { currentPrice: newPrice }
            }),
            prisma.priceHistory.create({
              data: {
                stockId: stock.id,
                price: newPrice,
                volume: spikeVolume
              }
            })
          ]);

          const percentChange = stock.basePrice > 0
            ? Math.round((((newPrice - stock.basePrice) / stock.basePrice) * 100) * 100) / 100
            : 0;

          emitStockUpdate({
            stockId: updatedStock.id,
            symbol: updatedStock.symbol,
            name: updatedStock.name,
            newPrice: updatedStock.currentPrice,
            volume: newHistory.volume,
            percentChange,
            timestamp: newHistory.timestamp
          });

          await checkAndExecuteLimitOrders(updatedStock.id, newPrice);
        }

        const idx = pendingDelayedNews.findIndex((p) => p.id === pendingItem.id);
        if (idx !== -1) pendingDelayedNews.splice(idx, 1);
      } catch (err) {
        console.error('Error executing delayed news price effect:', err);
      }
    }, delay * 1000);

    return res.json({
      message: `Analyst news broadcasted! Pre-move drift active; full impact in ${delay}s.`,
      news,
      pendingItem
    });
  } catch (err) {
    console.error('Trigger news template error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /admin/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const traders = await prisma.user.findMany({
      where: {
        role: 'TRADER',
        isTestAccount: false
      },
      include: {
        holdings: {
          include: {
            stock: {
              select: { currentPrice: true }
            }
          }
        }
      }
    });

    const leaderboard = traders.map((trader) => {
      const holdingsValue = trader.holdings.reduce((sum, h) => {
        return sum + (h.quantity * h.stock.currentPrice);
      }, 0);

      const totalValue = Math.round((trader.walletBalance + holdingsValue) * 100) / 100;

      return {
        id: trader.id,
        name: trader.name,
        email: trader.email,
        walletBalance: Math.round(trader.walletBalance * 100) / 100,
        holdingsValue: Math.round(holdingsValue * 100) / 100,
        totalPortfolioValue: totalValue
      };
    });

    leaderboard.sort((a, b) => b.totalPortfolioValue - a.totalPortfolioValue);

    const rankedLeaderboard = leaderboard.map((item, index) => ({
      rank: index + 1,
      ...item
    }));

    return res.json(rankedLeaderboard);
  } catch (err) {
    console.error('Get leaderboard error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
