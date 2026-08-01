const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Aggregates price histories into bucketed time intervals (e.g. hourly or daily)
 */
function aggregatePriceHistory(histories, bucketType) {
  if (!histories || histories.length === 0) return [];

  const buckets = {};

  for (const item of histories) {
    const d = new Date(item.timestamp);
    let key = '';

    if (bucketType === 'HOURLY') {
      // Bucket by YYYY-MM-DD-HH
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}`;
    } else if (bucketType === 'DAILY') {
      // Bucket by YYYY-MM-DD
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } else {
      key = item.id;
    }

    if (!buckets[key]) {
      buckets[key] = {
        sumPrice: 0,
        sumVolume: 0,
        count: 0,
        firstTimestamp: item.timestamp,
        lastTimestamp: item.timestamp
      };
    }

    buckets[key].sumPrice += item.price;
    buckets[key].sumVolume += (item.volume || 10000);
    buckets[key].count += 1;
    buckets[key].lastTimestamp = item.timestamp;
  }

  return Object.keys(buckets).map((key) => {
    const b = buckets[key];
    return {
      price: Math.round((b.sumPrice / b.count) * 100) / 100,
      volume: Math.round(b.sumVolume),
      timestamp: b.lastTimestamp
    };
  });
}

// GET /stocks
router.get('/', async (req, res) => {
  try {
    const stocks = await prisma.stock.findMany({
      orderBy: { symbol: 'asc' },
      include: {
        priceHistories: {
          take: 30,
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    const stocksWithChange = stocks.map((stock) => {
      const historiesAsc = stock.priceHistories.slice().reverse();
      const percentChange = stock.basePrice > 0
        ? Math.round((((stock.currentPrice - stock.basePrice) / stock.basePrice) * 100) * 100) / 100
        : 0;

      return {
        id: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector,
        currentPrice: stock.currentPrice,
        basePrice: stock.basePrice,
        percentChange,
        priceHistories: historiesAsc
      };
    });

    return res.json(stocksWithChange);
  } catch (err) {
    console.error('Get stocks error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /stocks/:id/history?range=1D|1W|1M (With Downsampling Aggregation)
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const { range } = req.query; // '1D', '1W', '1M'

    const now = Date.now();
    let startDate = new Date(0);
    let bucketType = 'RAW';

    if (range === '1D') {
      startDate = new Date(now - 24 * 60 * 60 * 1000); // Last 24 hours
      bucketType = 'RAW';
    } else if (range === '1W') {
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000); // Last 7 days
      bucketType = 'HOURLY';
    } else if (range === '1M') {
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      bucketType = 'DAILY';
    }

    const rawHistory = await prisma.priceHistory.findMany({
      where: {
        stockId: id,
        timestamp: { gte: startDate }
      },
      orderBy: { timestamp: 'asc' }
    });

    if (bucketType === 'RAW') {
      return res.json(rawHistory);
    }

    const aggregated = aggregatePriceHistory(rawHistory, bucketType);
    return res.json(aggregated);
  } catch (err) {
    console.error('Get stock history error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /news (Dedicated News Broadcast History for Traders)
router.get('/news', authenticateToken, async (req, res) => {
  try {
    const newsList = await prisma.news.findMany({
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        message: true,
        timestamp: true
        // Crucial: stockId omitted to preserve news secrecy!
      }
    });

    return res.json(newsList);
  } catch (err) {
    console.error('Get news history error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
