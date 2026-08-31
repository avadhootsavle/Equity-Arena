const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const { emitStockUpdate, emitNewsBroadcast, emitPortfolioUpdate, emitActivityLog, broadcastPublicLeaderboard } = require('../socket');
const { checkAndExecuteLimitOrders } = require('../services/orderService');
const { applyNewsImpact, steerMacroMoveForNews, triggerOrganicRamp } = require('../services/marketTicker');
const { getUsedTemplateIds, markTemplateUsed } = require('../services/sessionService');
const { getUserPortfolio } = require('../services/portfolioService');
const { checkAllTradersBankruptcy, bankruptTraderIds } = require('../services/bankruptcyService');

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

// POST /admin/stock/:id/adjust & /admin/stocks/:id/adjust — Explicitly set or adjust stock price
router.post(['/stock/:id/adjust', '/stocks/:id/adjust'], async (req, res) => {
  try {
    const { id } = req.params;
    const { percent, percentChange, price, newPrice, targetPrice } = req.body;

    const stock = await prisma.stock.findUnique({ where: { id } });
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    let calculatedNewPrice;
    const explicitPrice = price ?? newPrice ?? targetPrice;

    if (explicitPrice !== undefined && explicitPrice !== null && explicitPrice !== '') {
      const parsedPrice = parseFloat(explicitPrice);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({ error: 'Stock price must be a positive number' });
      }
      calculatedNewPrice = Math.max(0.50, Math.round(parsedPrice * 100) / 100);
    } else {
      const p = percent !== undefined ? percent : percentChange;
      const parsedPercent = parseFloat(p);
      if (isNaN(parsedPercent) || parsedPercent < -99 || parsedPercent > 10000) {
        return res.status(400).json({ error: 'Adjustment percentage must be between -99% and +10000%' });
      }
      const rawNewPrice = stock.currentPrice * (1 + parsedPercent / 100);
      calculatedNewPrice = Math.max(0.50, Math.round(rawNewPrice * 100) / 100);
    }

    const boundedNewPrice = calculatedNewPrice;

    // Trigger organic price ramp across background ticks so the stock chart rises/falls naturally
    await triggerOrganicRamp(stock.id, boundedNewPrice, 6);

    const finalPercentChange = stock.basePrice > 0
      ? Math.round((((boundedNewPrice - stock.basePrice) / stock.basePrice) * 100) * 100) / 100
      : 0;

    return res.json({
      message: 'Stock adjustment scheduled organically — chart will trend naturally',
      stock: {
        ...stock,
        currentPrice: boundedNewPrice
      },
      percentChange: finalPercentChange,
      newPrice: boundedNewPrice
    });
  } catch (err) {
    console.error('Adjust stock price error:', err);
    return res.status(500).json({ error: 'Failed to adjust stock price' });
  }
});

// POST /admin/market/adjust-all & /admin/stocks/adjust-all — Shift all stock prices simultaneously
router.post(['/market/adjust-all', '/stocks/adjust-all'], async (req, res) => {
  try {
    const p = req.body.percent !== undefined ? req.body.percent : req.body.percentChange;
    const parsedPercent = parseFloat(p);
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

// POST /admin/news & /admin/news/broadcast (Custom news broadcast with algorithmic stock steering)
router.post(['/news', '/news/broadcast'], async (req, res) => {
  try {
    const { message, stockId, direction, effectDirection, effectPercent, delaySeconds } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'News message is required' });
    }

    let stockSymbol = null;
    let targetStock = null;
    if (stockId) {
      targetStock = await prisma.stock.findUnique({ where: { id: stockId } });
      if (!targetStock) {
        return res.status(404).json({ error: 'Associated stock not found' });
      }
      stockSymbol = targetStock.symbol;
    }

    const news = await prisma.news.create({
      data: {
        message: message.trim(),
        stockId: stockId || null
      }
    });

    // Broadcast announcement to all connected clients & terminals
    emitNewsBroadcast({
      id: news.id,
      message: news.message,
      stockId: news.stockId,
      stockSymbol,
      timestamp: news.timestamp
    });

    // If an affected stock was selected with RISE or FALL, steer the market quant engine algorithmically!
    const activeDir = (direction || effectDirection || '').toUpperCase();
    if (targetStock && (activeDir === 'RISE' || activeDir === 'FALL')) {
      const pct = Math.abs(parseFloat(effectPercent) || 15);
      const signedPct = activeDir === 'FALL' ? -pct : pct;
      const delay = Math.max(0, parseInt(delaySeconds, 10) || 15);

      // Steer macro move organically over 6-8 background ticks so chart rises/falls naturally
      await steerMacroMoveForNews([
        {
          stockId: targetStock.id,
          symbol: targetStock.symbol,
          sector: targetStock.sector,
          effectPercent: signedPct
        }
      ], delay, 7);
    }

    return res.status(201).json({
      message: targetStock
        ? `Custom news broadcasted! ${targetStock.symbol} will organically ${activeDir === 'FALL' ? 'fall' : 'rise'} like algorithm.`
        : 'News broadcasted successfully',
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

// GET /admin/stock-holdings — Returns breakdown of who owns which stocks (by stock and by trader)
router.get('/stock-holdings', async (req, res) => {
  try {
    const holdings = await prisma.holding.findMany({
      where: {
        user: { role: 'TRADER', isTestAccount: false },
        quantity: { gt: 0 }
      },
      include: {
        user: { select: { id: true, name: true, email: true, walletBalance: true } },
        stock: { select: { id: true, symbol: true, name: true, currentPrice: true, basePrice: true } }
      },
      orderBy: [
        { user: { name: 'asc' } },
        { stock: { symbol: 'asc' } }
      ]
    });

    const byStock = {};
    const byTrader = {};

    for (const h of holdings) {
      const stockVal = Math.round(h.quantity * h.stock.currentPrice * 100) / 100;

      // Grouped by stock
      if (!byStock[h.stockId]) {
        byStock[h.stockId] = {
          stockId: h.stock.id,
          symbol: h.stock.symbol,
          name: h.stock.name,
          currentPrice: h.stock.currentPrice,
          holders: []
        };
      }
      byStock[h.stockId].holders.push({
        traderId: h.user.id,
        traderName: h.user.name || h.user.email.split('@')[0],
        email: h.user.email,
        quantity: h.quantity,
        avgBuyPrice: h.averageBuyPrice,
        value: stockVal
      });

      // Grouped by trader
      if (!byTrader[h.userId]) {
        byTrader[h.userId] = {
          traderId: h.user.id,
          traderName: h.user.name || h.user.email.split('@')[0],
          email: h.user.email,
          walletBalance: h.user.walletBalance,
          stocks: []
        };
      }
      byTrader[h.userId].stocks.push({
        stockId: h.stock.id,
        symbol: h.stock.symbol,
        name: h.stock.name,
        quantity: h.quantity,
        avgBuyPrice: h.averageBuyPrice,
        currentPrice: h.stock.currentPrice,
        value: stockVal
      });
    }

    return res.json({
      byStock,
      byTrader: Object.values(byTrader),
      totalHoldingsCount: holdings.length
    });
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

    // Fetch full fresh portfolio for trader
    const freshPortfolio = await getUserPortfolio(id);

    // Emit live portfolio update to trader's room
    emitPortfolioUpdate(id, {
      ...(freshPortfolio || {}),
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

    // Clear trader from bankrupt set now that they received funds
    bankruptTraderIds.delete(id);

    // Broadcast updated leaderboard standings to all clients & admin
    broadcastPublicLeaderboard();

    return res.json({
      message: `Added ${parsedAmount.toLocaleString()} IC to ${traderName}'s wallet (Revived from bankruptcy)`,
      walletBalance: Math.round(updatedUser.walletBalance * 100) / 100
    });
  } catch (err) {
    console.error('Admin trader top-up error:', err);
    return res.status(500).json({ error: 'Failed to process trader top-up' });
  }
});

// GET /admin/participants (and alias /admin/roster)
router.get(['/participants', '/roster'], async (req, res) => {
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

// Helper for flexible participant row extraction
function parseParticipantRow(row, rowIndex = 0) {
  if (!row || typeof row !== 'object') {
    return { error: `Row ${rowIndex + 1}: Empty or invalid row structure`, row: null };
  }

  let rawName = '';
  let rawEmail = '';
  let rawPhone = '';

  for (const [key, val] of Object.entries(row)) {
    if (val === undefined || val === null) continue;
    const k = String(key).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const v = String(val).trim();

    if (!rawName && (k.includes('name') || k.includes('student') || k.includes('participant') || k.includes('trader'))) {
      rawName = v;
    } else if (!rawEmail && (k.includes('email') || k.includes('mail'))) {
      rawEmail = v;
    } else if (!rawPhone && (k.includes('phone') || k.includes('mobile') || k.includes('contact') || k.includes('number') || k.includes('cell') || k.includes('tel'))) {
      rawPhone = v;
    }
  }

  // Fallbacks: search by content format
  const allValues = Object.values(row).map((v) => String(v || '').trim()).filter(Boolean);
  if (!rawEmail) {
    const emailCandidate = allValues.find((v) => v.includes('@'));
    if (emailCandidate) rawEmail = emailCandidate;
  }
  if (!rawPhone) {
    const phoneCandidate = allValues.find((v) => {
      const digits = v.replace(/\D/g, '');
      return digits.length >= 7 && digits.length <= 15;
    });
    if (phoneCandidate) rawPhone = phoneCandidate;
  }
  if (!rawName && allValues.length > 0) {
    rawName = allValues.find((v) => v !== rawEmail && v !== rawPhone) || allValues[0];
  }

  const cleanEmail = rawEmail.trim().toLowerCase();
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const cleanName = rawName.trim() || (cleanEmail ? cleanEmail.split('@')[0] : 'Trader');

  if (!cleanEmail) {
    return { error: `Row ${rowIndex + 1}: Missing email address`, row: null };
  }
  if (!cleanPhone) {
    return { error: `Row ${rowIndex + 1}: Missing phone number`, row: null };
  }

  return { error: null, row: { name: cleanName, email: cleanEmail, phone: cleanPhone } };
}

// POST /admin/participants/upload — Bulk roster import (Excel/CSV)
router.post(['/participants/upload', '/upload-participants'], async (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No participant rows provided for upload' });
    }

    let createdCount = 0;
    let skippedEmailCount = 0;
    let skippedDataCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const rawRow = rows[i];
      if (!rawRow || typeof rawRow !== 'object') {
        skippedDataCount++;
        continue;
      }

      const email = String(rawRow.email || '').trim().toLowerCase();
      const phone = String(rawRow.phone || '').trim().replace(/\D/g, '');
      const name = String(rawRow.name || '').trim();

      const validEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const validPhone = phone && phone.length >= 7;

      if (!name || !validEmail || !validPhone) {
        skippedDataCount++;
        continue;
      }

      const existingUser = await prisma.user.findFirst({
        where: { email }
      });

      if (existingUser) {
        skippedEmailCount++;
        continue;
      }

      const passwordHash = await bcrypt.hash(phone, 10);
      await prisma.user.create({
        data: {
          name,
          email,
          phone,
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

    broadcastPublicLeaderboard();

    const summaryParts = [];
    summaryParts.push(`${createdCount} accounts created`);
    summaryParts.push(`${skippedEmailCount} skipped because email already exists`);
    summaryParts.push(`${skippedDataCount} skipped because of missing data`);

    const message = `Import Result: ${summaryParts.join(', ')}.`;

    return res.json({
      message,
      createdCount,
      skippedEmailCount,
      skippedDataCount
    });
  } catch (err) {
    console.error('Upload participants error:', err);
    return res.status(500).json({ error: 'Failed to import participants' });
  }
});

// POST /admin/participants/add — Single participant manual creation with full field validation
router.post('/participants/add', async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim().replace(/\D/g, '');

    // 1. Validation checks
    if (!cleanName) {
      return res.status(400).json({ error: 'Full Name is required' });
    }

    if (!cleanEmail) {
      return res.status(400).json({ error: 'Email Address is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address (e.g. name@example.com)' });
    }

    if (!cleanPhone) {
      return res.status(400).json({ error: 'Phone Number is required' });
    }

    if (cleanPhone.length < 7) {
      return res.status(400).json({ error: 'Please enter a valid phone number (at least 7 digits)' });
    }

    // 2. Uniqueness checks
    const existingEmail = await prisma.user.findFirst({
      where: { email: cleanEmail }
    });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email address is already registered in the system' });
    }

    const existingPhone = await prisma.user.findFirst({
      where: { phone: cleanPhone }
    });
    if (existingPhone) {
      return res.status(400).json({ error: 'Phone number is already registered in the system' });
    }

    // 3. Create trader account
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

    broadcastPublicLeaderboard();

    return res.status(201).json({
      message: `Participant ${user.name} added successfully!`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        walletBalance: user.walletBalance,
        role: user.role,
        hasLoggedIn: user.hasLoggedIn
      }
    });
  } catch (err) {
    console.error('Add participant error:', err);
    return res.status(500).json({ error: 'Failed to add participant' });
  }
});

// DELETE /admin/participants/:id — Permanent participant deletion
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

// POST /admin/participants/:id/reset — Atomic reset to 20,000 IC & clear trades/holdings
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

    emitPortfolioUpdate(id, {
      walletBalance: 20000,
      availableWalletBalance: 20000,
      holdings: [],
      reason: 'ADMIN_RESET'
    });

    broadcastPublicLeaderboard();
    return res.json({ message: `Reset ${user.name} to 20,000 IC and cleared all trades and holdings.` });
  } catch (err) {
    console.error('Reset participant error:', err);
    return res.status(500).json({ error: 'Failed to reset participant' });
  }
});

// POST /admin/participants/reset-all
router.post(['/participants/reset-all', '/reset-all-participants'], async (req, res) => {
  try {
    const traders = await prisma.user.findMany({
      where: { role: 'TRADER' },
      select: { id: true, name: true, phone: true }
    });

    const traderIds = traders.map((t) => t.id);

    if (traderIds.length > 0) {
      await prisma.$transaction([
        prisma.order.deleteMany({ where: { userId: { in: traderIds } } }),
        prisma.holding.deleteMany({ where: { userId: { in: traderIds } } }),
        prisma.transaction.deleteMany({ where: { userId: { in: traderIds } } }),
        prisma.user.updateMany({
          where: { role: 'TRADER' },
          data: {
            walletBalance: 20000,
            hasLoggedIn: false
          }
        })
      ]);

      for (const traderId of traderIds) {
        emitPortfolioUpdate(traderId, {
          walletBalance: 20000,
          availableWalletBalance: 20000,
          holdings: [],
          reason: 'ADMIN_RESET_ALL'
        });
      }
    }

    broadcastPublicLeaderboard();
    return res.json({
      message: `Successfully reset wallet & portfolio for all ${traders.length} participants to 20,000 IC`,
      count: traders.length
    });
  } catch (err) {
    console.error('Reset all participants error:', err);
    return res.status(500).json({ error: 'Failed to reset all participants' });
  }
});

// POST /admin/participants/delete-all
router.post(['/participants/delete-all', '/participants-delete-all', '/clear-participants'], async (req, res) => {
  try {
    const traders = await prisma.user.findMany({
      where: { role: 'TRADER' },
      select: { id: true }
    });

    const traderIds = traders.map((t) => t.id);

    if (traderIds.length > 0) {
      await prisma.$transaction([
        prisma.order.deleteMany({ where: { userId: { in: traderIds } } }),
        prisma.holding.deleteMany({ where: { userId: { in: traderIds } } }),
        prisma.transaction.deleteMany({ where: { userId: { in: traderIds } } }),
        prisma.user.deleteMany({ where: { role: 'TRADER' } })
      ]);
    }

    broadcastPublicLeaderboard();
    return res.json({
      message: `Successfully deleted all ${traders.length} participant accounts from roster. Database is clean.`,
      count: traders.length
    });
  } catch (err) {
    console.error('Delete all participants error:', err);
    return res.status(500).json({ error: 'Failed to delete all participants' });
  }
});

// Internal test helper endpoint to trigger server-side socket broadcast during automated testing
router.post('/test/broadcast-portfolio', (req, res) => {
  const { userId, portfolio } = req.body;
  emitPortfolioUpdate(userId, portfolio);
  return res.json({ ok: true });
});

router.post('/test/broadcast-news', (req, res) => {
  const { news } = req.body;
  emitNewsBroadcast(news);
  return res.json({ ok: true });
});

module.exports = router;
