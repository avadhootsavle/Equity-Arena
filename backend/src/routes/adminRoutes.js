const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const { emitStockUpdate, emitNewsBroadcast, emitPortfolioUpdate, emitActivityLog, broadcastPublicLeaderboard } = require('../socket');
const { checkAndExecuteLimitOrders } = require('../services/orderService');
const { applyNewsImpact, steerMacroMoveForNews } = require('../services/marketTicker');
const { getUsedTemplateIds, markTemplateUsed } = require('../services/sessionService');
const { checkAllTradersBankruptcy, checkTraderBankruptcy } = require('../services/bankruptcyService');

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

    // Check bankruptcy for all active traders
    await checkAllTradersBankruptcy();

    // Broadcast updated leaderboard standings to all clients & admin
    broadcastPublicLeaderboard();

    return res.json({
      message: 'Stock price updated successfully',
      stock: updatedStock,
      percentChange
    });
  } catch (err) {
    console.error('Adjust stock price error:', err);
    return res.status(500).json({ error: 'Failed to adjust stock price' });
  }
});

// POST /admin/market/adjust-all — Shift all stock prices simultaneously
router.post('/market/adjust-all', async (req, res) => {
  try {
    const { percent } = req.body;
    const parsedPercent = parseFloat(percent);
    if (isNaN(parsedPercent) || parsedPercent < -99 || parsedPercent > 1000) {
      return res.status(400).json({ error: 'Adjustment percentage must be between -99% and +1000%' });
    }

    const stocks = await prisma.stock.findMany();
    const updatedStocks = [];

    for (const stock of stocks) {
      const rawNewPrice = stock.currentPrice * (1 + parsedPercent / 100);
      const newPrice = Math.max(0.50, Math.round(rawNewPrice * 100) / 100);
      const highVolume = getRandomVolume(60000, 150000);

      const [updatedStock, newHistory] = await prisma.$transaction([
        prisma.stock.update({
          where: { id: stock.id },
          data: { currentPrice: newPrice }
        }),
        prisma.priceHistory.create({
          data: {
            stockId: stock.id,
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

      await checkAndExecuteLimitOrders(updatedStock.id, newPrice);
      updatedStocks.push(updatedStock);
    }

    // Broadcast updated leaderboard standings to all clients & admin
    broadcastPublicLeaderboard();

    return res.json({
      message: `Adjusted all ${updatedStocks.length} stocks by ${parsedPercent >= 0 ? '+' : ''}${parsedPercent}%`,
      stocksCount: updatedStocks.length
    });
  } catch (err) {
    console.error('Market-wide adjust error:', err);
    return res.status(500).json({ error: 'Failed to adjust market prices' });
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

// GET /admin/news-templates or /admin/news/templates
router.get(['/news-templates', '/news/templates'], async (req, res) => {
  try {
    const [templates, stocks] = await Promise.all([
      prisma.newsTemplate.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.stock.findMany({ select: { id: true, symbol: true, name: true, sector: true } })
    ]);

    const sectorMap = {};
    const symbolMap = {};
    for (const s of stocks) {
      sectorMap[s.sector.toLowerCase().trim()] = s;
      symbolMap[s.symbol.toUpperCase().trim()] = s;
    }

    const templatesWithEffects = templates.map((tpl) => {
      let rawEffects = [];
      if (tpl.stockEffects) {
        try {
          rawEffects = JSON.parse(tpl.stockEffects);
        } catch (e) {
          rawEffects = [{ sector: tpl.sector, effectPercent: tpl.effectPercent }];
        }
      } else {
        rawEffects = [{ sector: tpl.sector, effectPercent: tpl.effectPercent }];
      }

      const resolvedTargets = rawEffects.map((eff) => {
        let matchedStock = null;
        if (eff.symbol) {
          matchedStock = symbolMap[eff.symbol.toUpperCase().trim()];
        }
        if (!matchedStock && eff.sector) {
          matchedStock = sectorMap[eff.sector.toLowerCase().trim()];
        }

        return {
          sector: eff.sector || matchedStock?.sector || tpl.sector,
          stockName: matchedStock ? matchedStock.name : (eff.sector || tpl.sector),
          symbol: matchedStock ? matchedStock.symbol : '',
          effectPercent: eff.effectPercent !== undefined ? eff.effectPercent : tpl.effectPercent
        };
      });

      return {
        ...tpl,
        targetStocks: resolvedTargets
      };
    });

    const usedTemplateIds = getUsedTemplateIds();
    return res.json({ templates: templatesWithEffects, usedTemplateIds, pendingDelayedNews });
  } catch (err) {
    console.error('Get news templates error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /admin/news/trigger-template
router.post('/news/trigger-template', async (req, res) => {
  try {
    const { templateId, delaySeconds } = req.body;
    const delay = Math.max(0, parseInt(delaySeconds, 10) || 30);

    const template = await prisma.newsTemplate.findUnique({ where: { id: templateId } });
    if (!template) {
      return res.status(404).json({ error: 'News template not found' });
    }

    // Mark template as used in current session
    markTemplateUsed(template.id);

    const news = await prisma.news.create({
      data: {
        message: template.headline,
        stockId: null
      }
    });

    // Broadcast headline immediately (without revealing stock targets to traders!)
    emitNewsBroadcast({
      id: news.id,
      message: news.message,
      stockId: null,
      stockSymbol: null,
      timestamp: news.timestamp
    });

    // Parse multi-stock or single-stock effects
    let effects = [];
    if (template.stockEffects) {
      try {
        effects = JSON.parse(template.stockEffects);
      } catch (e) {
        effects = [{ sector: template.sector, effectPercent: template.effectPercent }];
      }
    } else {
      effects = [{ sector: template.sector, effectPercent: template.effectPercent }];
    }

    // Phase 23: Steer targeted stock(s)' next scheduled 15-minute macro move directly!
    await steerMacroMoveForNews(effects, delay);

    return res.json({
      message: `Analyst news broadcasted! Macro move steered for target stocks in ~${delay}s.`,
      news
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
        return sum + (h.quantity * (h.stock?.currentPrice || 0));
      }, 0);

      const totalValue = Math.round((trader.walletBalance + holdingsValue) * 100) / 100;

      return {
        id: trader.id,
        name: trader.name,
        email: trader.email,
        walletBalance: Math.round(trader.walletBalance * 100) / 100,
        holdingsValue: Math.round(holdingsValue * 100) / 100,
        totalPortfolioValue: totalValue,
        totalNetWorth: totalValue,
        holdings: trader.holdings.map((h) => ({
          stockId: h.stockId,
          quantity: h.quantity
        }))
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

// GET /admin/stock-holdings — Returns breakdown of who owns which stocks
router.get('/stock-holdings', async (req, res) => {
  try {
    const holdings = await prisma.holding.findMany({
      where: {
        user: { role: 'TRADER', isTestAccount: false }
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        stock: { select: { id: true, symbol: true, name: true } }
      }
    });

    const stockMap = {};
    for (const h of holdings) {
      if (!stockMap[h.stockId]) {
        stockMap[h.stockId] = [];
      }
      stockMap[h.stockId].push({
        traderId: h.user.id,
        traderName: h.user.name || h.user.email.split('@')[0],
        quantity: h.quantity
      });
    }

    return res.json(stockMap);
  } catch (err) {
    console.error('Get stock holdings error:', err);
    return res.status(500).json({ error: 'Failed to fetch stock holdings' });
  }
});

// POST /admin/trader/:id/topup — Admin manual IC top-up for a specific trader
router.post('/trader/:id/topup', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Top-up amount must be a positive number' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'Trader not found' });
    }

    // Update trader's wallet balance
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        walletBalance: { increment: parsedAmount }
      }
    });

    // Create bonus transaction record
    const firstStock = await prisma.stock.findFirst();
    if (firstStock) {
      await prisma.transaction.create({
        data: {
          userId: id,
          stockId: firstStock.id,
          type: 'BUY',
          quantity: 0,
          price: parsedAmount
        }
      });
    }

    const traderName = user.name || user.email.split('@')[0];

    // Emit live portfolio update to trader's room
    // Tagged so the trader UI can attribute this credit to the admin. Without the
    // tag the client can only guess from "balance went up", which mislabels sell proceeds.
    emitPortfolioUpdate(id, {
      walletBalance: Math.round(updatedUser.walletBalance * 100) / 100,
      availableWalletBalance: Math.round(updatedUser.walletBalance * 100) / 100,
      reason: 'ADMIN_TOPUP',
      topUpAmount: parsedAmount
    });

    // Emit activity log to admin live activity stream
    emitActivityLog({
      id: Date.now() + Math.random(),
      traderName,
      action: 'BONUS TOP-UP',
      quantity: 0,
      symbol: 'IC',
      price: parsedAmount,
      timestamp: Date.now(),
      isTopUp: true
    });

    // Broadcast updated leaderboard standings to all clients & admin
    broadcastPublicLeaderboard();

    return res.json({
      message: `Added ${parsedAmount.toLocaleString()} IC to ${traderName}'s wallet`,
      walletBalance: Math.round(updatedUser.walletBalance * 100) / 100
    });
  } catch (err) {
    console.error('Admin trader top-up error:', err);
    return res.status(500).json({ error: 'Failed to process trader top-up' });
  }
});

// GET /admin/participants
router.get('/participants', async (req, res) => {
  try {
    const participants = await prisma.user.findMany({
      where: { role: 'TRADER' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        walletBalance: true,
        hasLoggedIn: true,
        isPreloaded: true,
        isTestAccount: true,
        createdAt: true,
        _count: {
          select: { holdings: true, orders: true, transactions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(participants);
  } catch (err) {
    console.error('Get participants error:', err);
    return res.status(500).json({ error: 'Failed to fetch participants' });
  }
});

// POST /admin/participants/upload (Import roster array)
router.post('/participants/upload', async (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Participant rows array is required' });
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      const rawName = row.Name || row['Full Name'] || row['Student Name'] || row.name || '';
      const rawEmail = row.Email || row['Email Address'] || row.email || '';
      const rawPhone = String(row.Phone || row['Mobile'] || row['Phone Number'] || row.phone || '').trim();

      if (!rawEmail || !rawPhone) {
        skippedCount++;
        continue;
      }

      const cleanEmail = String(rawEmail).trim().toLowerCase();
      const cleanName = String(rawName).trim() || cleanEmail.split('@')[0];
      const cleanPhone = rawPhone.replace(/\D/g, '');

      const existing = await prisma.user.findFirst({
        where: {
          OR: [{ email: cleanEmail }, { phone: cleanPhone }]
        }
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      const passwordHash = await bcrypt.hash(cleanPhone, 10);
      await prisma.user.create({
        data: {
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          passwordHash,
          role: 'TRADER',
          walletBalance: 20000,
          isTestAccount: false,
          isPreloaded: true,
          hasLoggedIn: false
        }
      });
      createdCount++;
    }

    return res.json({
      message: `${createdCount} participants imported, ${skippedCount} already existed (skipped)`,
      createdCount,
      skippedCount
    });
  } catch (err) {
    console.error('Upload participants error:', err);
    return res.status(500).json({ error: 'Failed to import participants' });
  }
});

// POST /admin/participants/add
router.post('/participants/add', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!email || !email.trim() || !phone || !String(phone).trim()) {
      return res.status(400).json({ error: 'Email and Phone Number are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = String(phone).trim().replace(/\D/g, '');
    const cleanName = (name && name.trim()) ? name.trim() : cleanEmail.split('@')[0];

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: cleanEmail }, { phone: cleanPhone }] }
    });
    if (existing) {
      return res.status(400).json({ error: 'Participant with this email or phone already exists' });
    }

    const passwordHash = await bcrypt.hash(cleanPhone, 10);
    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash,
        role: 'TRADER',
        walletBalance: 20000,
        isTestAccount: false,
        isPreloaded: true,
        hasLoggedIn: false
      }
    });

    return res.status(201).json({ message: 'Participant added successfully', user });
  } catch (err) {
    console.error('Add participant error:', err);
    return res.status(500).json({ error: 'Failed to add participant' });
  }
});

// DELETE /admin/participants/:id
router.delete('/participants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    await prisma.$transaction([
      prisma.order.deleteMany({ where: { userId: id } }),
      prisma.holding.deleteMany({ where: { userId: id } }),
      prisma.transaction.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } })
    ]);

    broadcastPublicLeaderboard();
    return res.json({ message: `Participant ${user.name} removed successfully` });
  } catch (err) {
    console.error('Delete participant error:', err);
    return res.status(500).json({ error: 'Failed to remove participant' });
  }
});

// POST /admin/participants/:id/reset
router.post('/participants/:id/reset', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    let passwordHash = user.passwordHash;
    if (user.phone) {
      passwordHash = await bcrypt.hash(user.phone, 10);
    }

    await prisma.$transaction([
      prisma.order.deleteMany({ where: { userId: id } }),
      prisma.holding.deleteMany({ where: { userId: id } }),
      prisma.transaction.deleteMany({ where: { userId: id } }),
      prisma.user.update({
        where: { id },
        data: {
          walletBalance: 20000,
          passwordHash,
          hasLoggedIn: false
        }
      })
    ]);

    broadcastPublicLeaderboard();
    return res.json({ message: `Reset wallet and portfolio for ${user.name} to 20,000 IC` });
  } catch (err) {
    console.error('Reset participant error:', err);
    return res.status(500).json({ error: 'Failed to reset participant' });
  }
});

module.exports = router;
