const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const INDIA_SECTOR_STOCKS = [
  { symbol: 'BPTE', name: 'Bharat PetroEnergy', sector: 'Oil & Gas' },
  { symbol: 'IDW', name: 'Indus Defence Works', sector: 'Defense' },
  { symbol: 'NITI', name: 'Nimbus InfoTech India', sector: 'Technology' },
  { symbol: 'ABAL', name: 'AirBharat Airlines', sector: 'Aviation' },
  { symbol: 'ANAG', name: 'Annapurna Agro', sector: 'Agriculture' },
  { symbol: 'RTB', name: 'Rashtriya Trust Bank', sector: 'Banking/Finance' },
  { symbol: 'SANP', name: 'Sanjeevani Pharma', sector: 'Pharmaceuticals' },
  { symbol: 'HTM', name: 'Hindustan TurboMotors', sector: 'Automobile' },
  { symbol: 'GSL', name: 'Ganga Shipping Lines', sector: 'Shipping/Logistics' },
  { symbol: 'SGM', name: 'Suvarna Gold Mining', sector: 'Precious Metals' },
  { symbol: 'MRI', name: 'Meridian Realty India', sector: 'Real Estate' },
  { symbol: 'BRM', name: 'Bazaar Retail Mart', sector: 'Retail' },
  { symbol: 'BWT', name: 'BharatWave Telecom', sector: 'Telecom' },
  { symbol: 'SWST', name: 'Swarna Studios', sector: 'Media/Entertainment' },
  { symbol: 'SGE', name: 'Surya Green Energy', sector: 'Renewable Energy' }
];

const ANALYST_NEWS_TEMPLATES = [
  {
    headline: "Tensions escalate between two major oil-exporting nations after reports of border skirmishes. Crude benchmarks jumped over 4% in early international trade. Analysts warn of prolonged supply disruption if the standoff continues.",
    sector: "Oil & Gas",
    effectPercent: -15.0,
    notes: "Crude rally increases input costs for oil refiners"
  },
  {
    headline: "Global defense ministries announced a 12% increase in capital procurement budgets following heightened regional security concerns. Defense contractors saw immediate order book expansion. Market strategists expect strong revenue momentum to sustain through the fiscal year.",
    sector: "Defense",
    effectPercent: 20.0,
    notes: "Order backlog expansion boosts defense manufacturing valuation"
  },
  {
    headline: "New tariffs of 15% were announced on imported semiconductor components and tech hardware overnight. Supply chain leads report immediate margin compression across hardware integrators. Equity analysts have lowered near-term earnings targets for IT hardware players.",
    sector: "Technology",
    effectPercent: -12.0,
    notes: "Import tariffs squeeze tech hardware margins"
  },
  {
    headline: "Bumper monsoon rainfall driven by favorable weather patterns has pushed crop yields to a 5-year high. Agricultural processors reported record raw material inflow. Market observers note strong margin expansion across agrarian suppliers.",
    sector: "Agriculture",
    effectPercent: 18.0,
    notes: "Record yields drive agricultural processor revenue growth"
  },
  {
    headline: "The central bank cut its benchmark lending rate by 25 basis points, citing slowing inflation. Financial and real estate stocks are typically the first to react to rate moves, though analysts are split on how much is already priced in.",
    sector: "Banking/Finance, Real Estate",
    effectPercent: 15.0,
    notes: "Rate cut lowers credit costs for banks and real estate developers"
  },
  {
    headline: "A coordinated cyberattack disrupted checkout systems at several major e-commerce and telecom platforms overnight. Full financial impact is still being assessed, with some analysts calling it a temporary glitch and others warning of longer-term trust damage.",
    sector: "Retail, Telecom",
    effectPercent: -14.0,
    notes: "System downtime impacts retail & telecom revenue"
  },
  {
    headline: "A major phase-III clinical trial achieved its primary efficacy endpoint with zero serious adverse events reported. Regulatory authorities granted expedited priority review status. Healthcare analysts project potential blockbuster status upon commercial release.",
    sector: "Pharmaceuticals",
    effectPercent: 25.0,
    notes: "Breakthrough trial results drive pharma valuation surge"
  },
  {
    headline: "A severe maritime blockage in a critical global shipping canal has stranded over 40 container vessels. Daily charter rates surged 35% while transit schedules face 2-week delays. Logistics analysts warn of compounding port congestion through next month.",
    sector: "Shipping/Logistics",
    effectPercent: -18.0,
    notes: "Freight delays spike operational costs for shipping lines"
  },
  {
    headline: "Geopolitical volatility and currency devaluation fears sparked a sharp flight to quality across global markets. Spot bullion prices surged 3.5% in heavy trading volume. Commodities strategists recommend overweight exposure to precious metal miners.",
    sector: "Precious Metals",
    effectPercent: 22.0,
    notes: "Safe haven gold demand drives precious metals mining rally"
  },
  {
    headline: "The Ministry of New Energy announced a 30% capital subsidy for grid-scale solar and wind storage installations. Clean energy developers received immediate policy tailwinds. Sector analysts anticipate accelerated project commissioning over the next two quarters.",
    sector: "Renewable Energy",
    effectPercent: 20.0,
    notes: "Capital subsidy accelerates clean energy project adoption"
  },
  {
    headline: "Key auto component suppliers reported severe microchip shortages following factory downtime in Southeast Asia. Vehicle assembly lines operate at 60% capacity. Equity research desks have downgraded fiscal guidance across automobile OEMs.",
    sector: "Automobile",
    effectPercent: -15.0,
    notes: "Component shortages force assembly line cutbacks"
  },
  {
    headline: "A surprise summer blockbuster generated 850 million IC at the domestic box office during its opening weekend, surpassing all industry forecasts. Streaming rights negotiations triggered a competitive bidding war. Entertainment analysts foresee record quarterly cash flows.",
    sector: "Media/Entertainment",
    effectPercent: 16.0,
    notes: "Record box office revenues boost media studio earnings"
  }
];

function getRandomPrice5to15() {
  const val = Math.random() * (15 - 5) + 5;
  return Math.round(val * 100) / 100;
}

function getRandomVolume(min = 5000, max = 15000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('🌱 Starting Phase 11 database seeding (Hardened Admin & Audit Logging)...');

  await prisma.adminAuditLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.priceHistory.deleteMany();
  await prisma.news.deleteMany();
  await prisma.newsTemplate.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin User with bcrypt cost factor 12
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@test.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      walletBalance: 20000,
      isTestAccount: true
    }
  });
  console.log(`✅ Created Admin user (Bcrypt cost factor 12): ${adminUser.email}`);

  // Create Seed Demo Trader
  const testTraderPasswordHash = await bcrypt.hash('trader123', 10);
  await prisma.user.create({
    data: {
      name: 'Seed Demo Trader',
      email: 'seed_trader@test.com',
      passwordHash: testTraderPasswordHash,
      role: 'TRADER',
      walletBalance: 20000,
      isTestAccount: true
    }
  });
  console.log(`✅ Created Seed Demo Trader (20,000 IC Wallet)`);

  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  const ONE_DAY = 24 * ONE_HOUR;

  for (let i = 0; i < INDIA_SECTOR_STOCKS.length; i++) {
    const item = INDIA_SECTOR_STOCKS[i];
    const basePrice = getRandomPrice5to15();

    const histories = [];
    let runningPrice = basePrice * 0.85;

    for (let day = 30; day >= 8; day--) {
      const dailyDrift = (Math.random() - 0.48) * 0.05;
      runningPrice = Math.max(1.0, Math.round(runningPrice * (1 + dailyDrift) * 100) / 100);

      histories.push({
        price: runningPrice,
        volume: getRandomVolume(150000, 350000),
        timestamp: new Date(now - day * ONE_DAY)
      });
    }

    for (let hour = 7 * 24; hour >= 24; hour -= 3) {
      const hourlyDrift = (Math.random() - 0.49) * 0.02;
      runningPrice = Math.max(1.0, Math.round(runningPrice * (1 + hourlyDrift) * 100) / 100);

      histories.push({
        price: runningPrice,
        volume: getRandomVolume(15000, 35000),
        timestamp: new Date(now - hour * ONE_HOUR)
      });
    }

    for (let min = 24 * 60; min >= 0; min -= 15) {
      const tickDrift = (Math.random() - 0.49) * 0.01;
      runningPrice = Math.max(1.0, Math.round(runningPrice * (1 + tickDrift) * 100) / 100);
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
    console.log(`   [${i + 1}/15] Stock: ${stock.symbol} (${stock.name}) [${stock.sector}] — ${stock.currentPrice.toFixed(2)} IC`);
  }

  for (const template of ANALYST_NEWS_TEMPLATES) {
    await prisma.newsTemplate.create({
      data: template
    });
  }
  console.log(`✅ Seeded ${ANALYST_NEWS_TEMPLATES.length} Analyst-Style News Templates.`);

  console.log(`🎉 Phase 11 Database seeding completed successfully!`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
