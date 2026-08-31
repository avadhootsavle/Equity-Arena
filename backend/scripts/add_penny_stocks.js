const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PENNY_STOCKS = [
  { symbol: 'ZTEL', name: 'Zenith Telelink', sector: 'Telecom', basePrice: 2.40 },
  { symbol: 'SPTI', name: 'Spark Textile Industries', sector: 'Textiles', basePrice: 3.80 },
  { symbol: 'KMIN', name: 'Kuber Mineral Resources', sector: 'Mining', basePrice: 4.50 },
  { symbol: 'OMEX', name: 'Omkar Exports', sector: 'Trading/Exports', basePrice: 5.90 },
  { symbol: 'NVPW', name: 'Navkar Power Systems', sector: 'Renewable Energy', basePrice: 7.20 }
];

function getRandomVolume(min = 5000, max = 15000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function addPennyStocks() {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  const ONE_DAY = 24 * ONE_HOUR;

  for (const item of PENNY_STOCKS) {
    const existing = await prisma.stock.findUnique({ where: { symbol: item.symbol } });
    if (existing) {
      console.log(`Stock ${item.symbol} already exists.`);
      continue;
    }

    const basePrice = item.basePrice;
    const minPrice = Math.max(0.50, Math.round(basePrice * 0.20 * 100) / 100);
    const maxPrice = Math.round(basePrice * 3.00 * 100) / 100;

    const histories = [];
    let runningPrice = basePrice * 0.90;

    for (let day = 30; day >= 8; day--) {
      const dailyDrift = (Math.random() - 0.50) * 0.05;
      runningPrice = Math.min(maxPrice, Math.max(minPrice, Math.round(runningPrice * (1 + dailyDrift) * 100) / 100));

      histories.push({
        price: runningPrice,
        volume: getRandomVolume(200000, 500000),
        timestamp: new Date(now - day * ONE_DAY)
      });
    }

    for (let hour = 7 * 24; hour >= 24; hour -= 3) {
      const hourlyDrift = (Math.random() - 0.50) * 0.025;
      runningPrice = Math.min(maxPrice, Math.max(minPrice, Math.round(runningPrice * (1 + hourlyDrift) * 100) / 100));

      histories.push({
        price: runningPrice,
        volume: getRandomVolume(25000, 60000),
        timestamp: new Date(now - hour * ONE_HOUR)
      });
    }

    for (let min = 24 * 60; min >= 0; min -= 15) {
      const tickDrift = (Math.random() - 0.50) * 0.015;
      runningPrice = Math.min(maxPrice, Math.max(minPrice, Math.round(runningPrice * (1 + tickDrift) * 100) / 100));
      if (min === 0) runningPrice = basePrice;

      histories.push({
        price: runningPrice,
        volume: getRandomVolume(8000, 25000),
        timestamp: new Date(now - min * 60 * 1000)
      });
    }

    const created = await prisma.stock.create({
      data: {
        symbol: item.symbol,
        name: item.name,
        sector: item.sector,
        basePrice,
        currentPrice: basePrice,
        priceHistories: {
          create: histories
        }
      }
    });

    console.log(`✅ Created Penny Stock: ${created.symbol} (${created.name}) @ ${created.currentPrice} IC`);
  }

  const total = await prisma.stock.count();
  console.log(`Total stocks in market now: ${total}`);
  await prisma.$disconnect();
}

addPennyStocks().catch(e => {
  console.error(e);
  process.exit(1);
});
