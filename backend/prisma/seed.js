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
  // --- EASY (Obvious single-sector signals) ---
  {
    headline: "Bumper monsoon rainfall driven by favorable weather patterns has pushed crop yields to a 5-year high nationwide.",
    sector: "Agriculture",
    effectPercent: 18.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Agriculture", effectPercent: 18.0 }]),
    notes: "Direct positive impact on agricultural processors"
  },
  {
    headline: "Global defense ministries announced a 15% increase in procurement budgets following heightened regional security concerns.",
    sector: "Defense",
    effectPercent: 22.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Defense", effectPercent: 22.0 }]),
    notes: "Order backlog expansion boosts defense contractors"
  },
  {
    headline: "A major phase-III clinical trial achieved its primary efficacy endpoint with zero adverse events reported.",
    sector: "Pharmaceuticals",
    effectPercent: 24.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Pharmaceuticals", effectPercent: 24.0 }]),
    notes: "Breakthrough clinical trial drives pharma rally"
  },
  {
    headline: "The Ministry of New Energy announced a 30% capital subsidy for grid-scale solar and wind storage installations.",
    sector: "Renewable Energy",
    effectPercent: 20.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Renewable Energy", effectPercent: 20.0 }]),
    notes: "Capital subsidies boost clean energy developers"
  },
  {
    headline: "A surprise summer blockbuster movie generated record box office revenues during its opening weekend.",
    sector: "Media/Entertainment",
    effectPercent: 16.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Media/Entertainment", effectPercent: 16.0 }]),
    notes: "Box office surge boosts media studio cash flow"
  },
  {
    headline: "Spot gold prices surged 4% in heavy international trading following currency devaluation fears across emerging markets.",
    sector: "Precious Metals",
    effectPercent: 20.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Precious Metals", effectPercent: 20.0 }]),
    notes: "Safe haven gold demand drives precious metals rally"
  },
  {
    headline: "Key auto component suppliers reported severe microchip shortages following factory downtime overseas.",
    sector: "Automobile",
    effectPercent: -16.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Automobile", effectPercent: -16.0 }]),
    notes: "Component shortages force vehicle assembly cutbacks"
  },
  {
    headline: "A severe maritime blockage in a major shipping canal has stranded container vessels, causing 2-week transit delays.",
    sector: "Shipping/Logistics",
    effectPercent: -18.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Shipping/Logistics", effectPercent: -18.0 }]),
    notes: "Freight delays spike operational costs for shipping lines"
  },

  // --- MEDIUM (Requires sector knowledge & multi-sector connections) ---
  {
    headline: "The central bank cut its benchmark repo rate by 50 basis points to stimulate domestic credit expansion.",
    sector: "Banking/Finance",
    effectPercent: 16.0,
    difficulty: "MEDIUM",
    stockEffects: JSON.stringify([
      { sector: "Banking/Finance", effectPercent: 16.0 },
      { sector: "Real Estate", effectPercent: 18.0 }
    ]),
    notes: "Rate cut lowers borrowing costs for banks and home buyers"
  },
  {
    headline: "New tariffs of 15% were announced on imported semiconductor components and tech hardware overnight.",
    sector: "Technology",
    effectPercent: -15.0,
    difficulty: "MEDIUM",
    stockEffects: JSON.stringify([
      { sector: "Technology", effectPercent: -15.0 },
      { sector: "Defense", effectPercent: 12.0 }
    ]),
    notes: "Hardware tariffs squeeze tech margins while domestic defense gains allocation"
  },
  {
    headline: "A coordinated cyberattack disrupted checkout and payment systems across major e-commerce platforms overnight.",
    sector: "Retail",
    effectPercent: -14.0,
    difficulty: "MEDIUM",
    stockEffects: JSON.stringify([
      { sector: "Retail", effectPercent: -14.0 },
      { sector: "Telecom", effectPercent: -10.0 }
    ]),
    notes: "Downtime hits retail sales volume and telecom infrastructure trust"
  },
  {
    headline: "Government approved a massive 500 billion IC infrastructure development package for highway and urban transit grids.",
    sector: "Real Estate",
    effectPercent: 18.0,
    difficulty: "MEDIUM",
    stockEffects: JSON.stringify([
      { sector: "Real Estate", effectPercent: 18.0 },
      { sector: "Shipping/Logistics", effectPercent: 14.0 }
    ]),
    notes: "Transit expansion boosts property valuations and logistics efficiency"
  },
  {
    headline: "International airline passenger traffic reached all-time summer highs while jet fuel prices stabilized.",
    sector: "Aviation",
    effectPercent: 19.0,
    difficulty: "MEDIUM",
    stockEffects: JSON.stringify([
      { sector: "Aviation", effectPercent: 19.0 },
      { sector: "Retail", effectPercent: 10.0 }
    ]),
    notes: "Travel boom increases airline passenger yields and duty-free retail"
  },
  {
    headline: "Nationwide 5G network expansion completed 3 months ahead of schedule, covering 90% of metro centers.",
    sector: "Telecom",
    effectPercent: 17.0,
    difficulty: "MEDIUM",
    stockEffects: JSON.stringify([
      { sector: "Telecom", effectPercent: 17.0 },
      { sector: "Technology", effectPercent: 14.0 }
    ]),
    notes: "High-speed network rollout drives data subscription and tech service revenue"
  },
  {
    headline: "Regulatory authorities introduced strict price caps on essential generic life-saving medications.",
    sector: "Pharmaceuticals",
    effectPercent: -14.0,
    difficulty: "MEDIUM",
    stockEffects: JSON.stringify([
      { sector: "Pharmaceuticals", effectPercent: -14.0 },
      { sector: "Agriculture", effectPercent: 8.0 }
    ]),
    notes: "Price capping squeezes drug manufacturer margins"
  },
  {
    headline: "Eviction notices and commercial property lease defaults rose 8% across secondary business districts.",
    sector: "Real Estate",
    effectPercent: -15.0,
    difficulty: "MEDIUM",
    stockEffects: JSON.stringify([
      { sector: "Real Estate", effectPercent: -15.0 },
      { sector: "Banking/Finance", effectPercent: -10.0 }
    ]),
    notes: "Commercial property weakness increases non-performing loans for banks"
  },

  // --- HARD (Ambiguous, complex reasoning, opposite multi-sector moves) ---
  {
    headline: "Military conflict escalates near a vital energy strait, threatening international crude oil supply lines.",
    sector: "Oil & Gas",
    effectPercent: 20.0,
    difficulty: "HARD",
    stockEffects: JSON.stringify([
      { sector: "Oil & Gas", effectPercent: 20.0 },
      { sector: "Aviation", effectPercent: -18.0 }
    ]),
    notes: "Oil price surge benefits energy producers but crushes airline fuel margins"
  },
  {
    headline: "The central bank unexpectedly raised cash reserve ratios by 75 basis points to curb overheating inflation.",
    sector: "Banking/Finance",
    effectPercent: -16.0,
    difficulty: "HARD",
    stockEffects: JSON.stringify([
      { sector: "Banking/Finance", effectPercent: -16.0 },
      { sector: "Precious Metals", effectPercent: 15.0 }
    ]),
    notes: "Tight monetary policy pressures bank liquidity while driving safe-haven gold demand"
  },
  {
    headline: "Electric vehicle adoption rates surpassed 25% of monthly car sales, supported by state battery mandates.",
    sector: "Automobile",
    effectPercent: 16.0,
    difficulty: "HARD",
    stockEffects: JSON.stringify([
      { sector: "Automobile", effectPercent: 16.0 },
      { sector: "Oil & Gas", effectPercent: -14.0 }
    ]),
    notes: "EV surge boosts motor manufacturers while signaling long-term gasoline demand decline"
  },
  {
    headline: "A prolonged heatwave drove record electricity grid demand, forcing peak-load emergency dispatching.",
    sector: "Renewable Energy",
    effectPercent: 18.0,
    difficulty: "HARD",
    stockEffects: JSON.stringify([
      { sector: "Renewable Energy", effectPercent: 18.0 },
      { sector: "Agriculture", effectPercent: -12.0 }
    ]),
    notes: "Peak power demand drives clean energy generation while drought hurts crop yields"
  },
  {
    headline: "Domestic currency weakened 3.5% against the US Dollar amidst global trade balance adjustments.",
    sector: "Technology",
    effectPercent: 15.0,
    difficulty: "HARD",
    stockEffects: JSON.stringify([
      { sector: "Technology", effectPercent: 15.0 },
      { sector: "Shipping/Logistics", effectPercent: -12.0 }
    ]),
    notes: "Export-heavy IT services benefit from dollar realization while import logistics cost spikes"
  },
  {
    headline: "Unseasonal unseasonal hailstorms damaged wheat and sugarcane belts across central agricultural states.",
    sector: "Agriculture",
    effectPercent: -16.0,
    difficulty: "HARD",
    stockEffects: JSON.stringify([
      { sector: "Agriculture", effectPercent: -16.0 },
      { sector: "Precious Metals", effectPercent: 10.0 }
    ]),
    notes: "Crop destruction hurts agro processors while rural hedging drives gold purchases"
  },
  {
    headline: "A major streaming platform announced a joint venture with a leading national telecom operator for exclusive content.",
    sector: "Media/Entertainment",
    effectPercent: 17.0,
    difficulty: "HARD",
    stockEffects: JSON.stringify([
      { sector: "Media/Entertainment", effectPercent: 17.0 },
      { sector: "Telecom", effectPercent: 12.0 }
    ]),
    notes: "Content partnership drives subscriber monetization for both media and telecom"
  },
  {
    headline: "Stringent new carbon emission compliance penalties were enacted across heavy industrial manufacturing sectors.",
    sector: "Renewable Energy",
    effectPercent: 16.0,
    difficulty: "HARD",
    stockEffects: JSON.stringify([
      { sector: "Renewable Energy", effectPercent: 16.0 },
      { sector: "Automobile", effectPercent: -10.0 }
    ]),
    notes: "Carbon penalties favor renewable energy offset providers while raising automaker compliance costs"
  }
];

function getRandomPrice40to80() {
  const val = Math.random() * (80 - 40) + 40;
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
    const basePrice = getRandomPrice40to80();

    const histories = [];
    let runningPrice = basePrice * 0.85;

    for (let day = 30; day >= 8; day--) {
      const dailyDrift = (Math.random() - 0.48) * 0.05;
      runningPrice = Math.min(99.00, Math.max(1.0, Math.round(runningPrice * (1 + dailyDrift) * 100) / 100));

      histories.push({
        price: runningPrice,
        volume: getRandomVolume(150000, 350000),
        timestamp: new Date(now - day * ONE_DAY)
      });
    }

    for (let hour = 7 * 24; hour >= 24; hour -= 3) {
      const hourlyDrift = (Math.random() - 0.49) * 0.02;
      runningPrice = Math.min(99.00, Math.max(1.0, Math.round(runningPrice * (1 + hourlyDrift) * 100) / 100));

      histories.push({
        price: runningPrice,
        volume: getRandomVolume(15000, 35000),
        timestamp: new Date(now - hour * ONE_HOUR)
      });
    }

    for (let min = 24 * 60; min >= 0; min -= 15) {
      const tickDrift = (Math.random() - 0.49) * 0.01;
      runningPrice = Math.min(99.00, Math.max(1.0, Math.round(runningPrice * (1 + tickDrift) * 100) / 100));
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
