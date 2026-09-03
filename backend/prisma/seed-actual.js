const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

const ACTUAL_INDIA_STOCKS = [
  // 1. Banking
  { symbol: "HDFB", name: "HDFB Bank", sector: "Banking", basePrice: 1800.00 },
  { symbol: "ICCO", name: "ICICO Bank", sector: "Banking", basePrice: 1250.00 },

  // 2. IT
  { symbol: "TCX", name: "TCX", sector: "IT", basePrice: 4200.00 },
  { symbol: "INFS", name: "Infisys", sector: "IT", basePrice: 1600.00 },

  // 3. Defence & Aerospace
  { symbol: "HAAL", name: "HAAL", sector: "Defence & Aerospace", basePrice: 5000.00 },
  { symbol: "BEEL", name: "BEEL", sector: "Defence & Aerospace", basePrice: 420.00 },

  // 4. Pharmaceuticals
  { symbol: "SURY", name: "Suryan Pharma", sector: "Pharmaceuticals", basePrice: 1900.00 },
  { symbol: "CPLX", name: "Ciplex", sector: "Pharmaceuticals", basePrice: 1500.00 },

  // 5. Telecommunications
  { symbol: "AIRT", name: "Bharat Airtell", sector: "Telecommunications", basePrice: 1850.00 },
  { symbol: "IDEA", name: "Vodfone Idea", sector: "Telecommunications", basePrice: 18.00 },

  // 6. Automobile
  { symbol: "TATV", name: "Tatva Motors", sector: "Automobile", basePrice: 950.00 },
  { symbol: "M&M", name: "M&M", sector: "Automobile", basePrice: 3000.00 },

  // 7. Energy (Oil & Gas)
  { symbol: "RELI", name: "Reliants Industries", sector: "Energy (Oil & Gas)", basePrice: 2900.00 },
  { symbol: "ONGC", name: "ONGCO", sector: "Energy (Oil & Gas)", basePrice: 350.00 },

  // 8. Real Estate
  { symbol: "DLEF", name: "DLEF", sector: "Real Estate", basePrice: 850.00 },
  { symbol: "GODR", name: "Godrej Properties", sector: "Real Estate", basePrice: 2700.00 },

  // 9. Renewable Energy
  { symbol: "SUZL", name: "Suzlan", sector: "Renewable Energy", basePrice: 75.00 },
  { symbol: "IRED", name: "IREDAA", sector: "Renewable Energy", basePrice: 95.00 },

  // 10. Metals & Mining
  { symbol: "SAAL", name: "SAAIL", sector: "Metals & Mining", basePrice: 98.00 },
  { symbol: "NMDC", name: "NMDCX", sector: "Metals & Mining", basePrice: 90.00 }
];

const { ALL_NEWS_TEMPLATES: ACTUAL_NEWS_TEMPLATES } = require("../src/services/newsService");

function getRandomVolume(min = 5000, max = 15000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("🌱 Starting ACTUAL TOURNAMENT database seeding with new stock roster & intuitive news...");

  // 1. Clean previous trading logs, holdings, orders, and stocks
  await prisma.adminAuditLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.order.deleteMany();
  await prisma.priceHistory.deleteMany();
  await prisma.news.deleteMany();
  await prisma.newsTemplate.deleteMany();
  await prisma.stock.deleteMany();

  // 2. Preserve or restore Admin and Registered Traders
  const existingUsers = await prisma.user.findMany();
  console.log(`ℹ️ Found ${existingUsers.length} existing users in database.`);

  if (existingUsers.length === 0) {
    const backupPath = path.join(__dirname, "../scripts/participants-live-roster.json");
    if (fs.existsSync(backupPath)) {
      const savedUsers = JSON.parse(fs.readFileSync(backupPath, "utf8"));
      console.log(`📦 Restoring ${savedUsers.length} participants from roster backup...`);
      for (const u of savedUsers) {
        await prisma.user.create({
          data: {
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            passwordHash: u.passwordHash,
            role: u.role,
            walletBalance: 20000,
            isTestAccount: u.isTestAccount || false,
            isPreloaded: true,
            hasLoggedIn: false
          }
        });
      }
    }
  } else {
    // Reset all trader wallets back to fresh 20,000 IC
    await prisma.user.updateMany({
      where: { role: "TRADER" },
      data: { walletBalance: 20000, hasLoggedIn: false }
    });
    console.log("✅ Reset all registered participants back to 20,000 IC wallet balance.");
  }

  // Ensure Admin User exists
  const adminPasswordHash = await bcrypt.hash("010428", 10);
  const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: "Admin User",
        email: "avadhoot@krishna.kavya",
        passwordHash: adminPasswordHash,
        role: "ADMIN",
        walletBalance: 20000,
        isTestAccount: false
      }
    });
    console.log("✅ Created Admin user: avadhoot@krishna.kavya");
  }

  // 3. Seed the 20 Actual Stocks with Dynamic Price Histories
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  const ONE_DAY = 24 * ONE_HOUR;

  for (let i = 0; i < ACTUAL_INDIA_STOCKS.length; i++) {
    const item = ACTUAL_INDIA_STOCKS[i];
    const basePrice = item.basePrice;
    const minPrice = Math.max(1.00, Math.round(basePrice * 0.20 * 100) / 100);
    const maxPrice = Math.round(basePrice * 2.50 * 100) / 100;

    const histories = [];
    let runningPrice = basePrice * 0.85;

    for (let day = 30; day >= 8; day--) {
      const dailyDrift = (Math.random() - 0.50) * 0.03;
      runningPrice = Math.min(maxPrice, Math.max(minPrice, Math.round(runningPrice * (1 + dailyDrift) * 100) / 100));

      histories.push({
        price: runningPrice,
        volume: getRandomVolume(150000, 350000),
        timestamp: new Date(now - day * ONE_DAY)
      });
    }

    for (let hour = 7 * 24; hour >= 24; hour -= 3) {
      const hourlyDrift = (Math.random() - 0.50) * 0.015;
      runningPrice = Math.min(maxPrice, Math.max(minPrice, Math.round(runningPrice * (1 + hourlyDrift) * 100) / 100));

      histories.push({
        price: runningPrice,
        volume: getRandomVolume(15000, 35000),
        timestamp: new Date(now - hour * ONE_HOUR)
      });
    }

    for (let min = 24 * 60; min >= 0; min -= 15) {
      const tickDrift = (Math.random() - 0.50) * 0.008;
      runningPrice = Math.min(maxPrice, Math.max(minPrice, Math.round(runningPrice * (1 + tickDrift) * 100) / 100));
      if (min === 0) runningPrice = basePrice;

      histories.push({
        price: runningPrice,
        volume: getRandomVolume(5000, 15000),
        timestamp: new Date(now - min * 60 * 1000)
      });
    }

    const stock = await prisma.stock.create({
      data: {
        symbol: item.symbol,
        name: item.name,
        sector: item.sector,
        basePrice: basePrice,
        currentPrice: basePrice,
        priceHistories: {
          create: histories
        }
      }
    });
    console.log(`   [${i + 1}/20] Stock: ${stock.symbol} (${stock.name}) [${stock.sector}] — ${stock.currentPrice.toFixed(2)} IC`);
  }

  // 4. Seed Intuitive, Simple News Templates
  for (const template of ACTUAL_NEWS_TEMPLATES) {
    await prisma.newsTemplate.create({
      data: {
        headline: template.headline,
        sector: template.sector,
        effectPercent: template.effectPercent,
        difficulty: template.difficulty,
        stockEffects: template.stockEffects,
        notes: template.notes
      }
    });
  }
  console.log(`✅ Seeded ${ACTUAL_NEWS_TEMPLATES.length} Simple & Intuitive News Templates tailored to new stock roster.`);

  console.log("🎉 ACTUAL TOURNAMENT database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
