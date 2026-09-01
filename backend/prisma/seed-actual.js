const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const ACTUAL_INDIA_STOCKS = [
  { symbol: 'HDFC', name: 'HDFC Bank', sector: 'Banking', basePrice: 1800.00 },
  { symbol: 'ICIC', name: 'ICICI Bank', sector: 'Banking', basePrice: 1250.00 },
  { symbol: 'TCS', name: 'TCS', sector: 'IT', basePrice: 4200.00 },
  { symbol: 'INFY', name: 'Infosys', sector: 'IT', basePrice: 1600.00 },
  { symbol: 'HAL', name: 'HAL', sector: 'Defence', basePrice: 5000.00 },
  { symbol: 'BEL', name: 'BEL', sector: 'Defence', basePrice: 420.00 },
  { symbol: 'SUNP', name: 'Sun Pharma', sector: 'Pharma', basePrice: 1900.00 },
  { symbol: 'CIPL', name: 'Cipla', sector: 'Pharma', basePrice: 1500.00 },
  { symbol: 'AIRT', name: 'Bharti Airtel', sector: 'Telecom', basePrice: 1850.00 },
  { symbol: 'IDEA', name: 'Vodafone Idea', sector: 'Telecom', basePrice: 18.00 },
  { symbol: 'TATA', name: 'Tata Motors', sector: 'Automobile', basePrice: 950.00 },
  { symbol: 'M&M', name: 'Mahindra & Mahindra', sector: 'Automobile', basePrice: 3000.00 },
  { symbol: 'RELI', name: 'Reliance Industries', sector: 'Energy', basePrice: 2900.00 },
  { symbol: 'ONGC', name: 'ONGC', sector: 'Energy', basePrice: 350.00 },
  { symbol: 'DLF', name: 'DLF', sector: 'Real Estate', basePrice: 850.00 },
  { symbol: 'GODR', name: 'Godrej Properties', sector: 'Real Estate', basePrice: 2700.00 },
  { symbol: 'SUZL', name: 'Suzlon', sector: 'Renewable Energy', basePrice: 75.00 },
  { symbol: 'IRED', name: 'IREDA', sector: 'Renewable Energy', basePrice: 95.00 },
  { symbol: 'SAIL', name: 'SAIL', sector: 'Metals', basePrice: 98.00 },
  { symbol: 'NMDC', name: 'NMDC', sector: 'Metals', basePrice: 90.00 }
];

const ACTUAL_NEWS_TEMPLATES = [
  // 1. Banking (+)
  {
    headline: 'RBI cuts interest rates by 25 basis points; banks expect huge rise in loan demand.',
    sector: 'Banking',
    effectPercent: 15.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Banking', effectPercent: 15.0 }]),
    notes: 'Rate cut directly benefits HDFC Bank and ICICI Bank'
  },
  // 2. Banking (-)
  {
    headline: 'Banking regulator introduces stricter reserve norms; banks face margin pressure.',
    sector: 'Banking',
    effectPercent: -14.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Banking', effectPercent: -14.0 }]),
    notes: 'Margin contraction hits private banking lenders'
  },
  // 3. IT (+)
  {
    headline: 'Major US tech firms sign billion-dollar artificial intelligence contracts with Indian IT leaders.',
    sector: 'IT',
    effectPercent: 18.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'IT', effectPercent: 18.0 }]),
    notes: 'AI spending boom boosts TCS and Infosys revenues'
  },
  // 4. IT (-)
  {
    headline: 'Global client IT budgets cut amid economic slowdown; project rollouts postponed.',
    sector: 'IT',
    effectPercent: -15.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'IT', effectPercent: -15.0 }]),
    notes: 'Weak enterprise tech demand impacts IT consulting firms'
  },
  // 5. Defence (+)
  {
    headline: 'Ministry of Defence signs major contracts for new fighter jets and advanced radar systems.',
    sector: 'Defence',
    effectPercent: 22.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Defence', effectPercent: 22.0 }]),
    notes: 'Defence modernization powers order backlogs for HAL and BEL'
  },
  // 6. Defence (-)
  {
    headline: 'Parliament delays annual defence procurement budget approval pending parliamentary review.',
    sector: 'Defence',
    effectPercent: -14.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Defence', effectPercent: -14.0 }]),
    notes: 'Contract award delays temporarily slow defence revenue recognition'
  },
  // 7. Pharma (+)
  {
    headline: 'US FDA approves key blockbuster generic medicines with zero inspection observations.',
    sector: 'Pharma',
    effectPercent: 19.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Pharma', effectPercent: 19.0 }]),
    notes: 'Clean US FDA clearance opens major export markets for Sun Pharma and Cipla'
  },
  // 8. Pharma (-)
  {
    headline: 'Global raw material prices for active pharma ingredients jump sharply overnight.',
    sector: 'Pharma',
    effectPercent: -13.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Pharma', effectPercent: -13.0 }]),
    notes: 'Input cost inflation squeezes pharmaceutical operating margins'
  },
  // 9. Telecom (+)
  {
    headline: 'Telecom operators report massive surge in mobile data usage following nationwide 5G rollout.',
    sector: 'Telecom',
    effectPercent: 17.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Telecom', effectPercent: 17.0 }]),
    notes: '5G adoption and higher ARPU boost Bharti Airtel and Vodafone Idea'
  },
  // 10. Telecom (-)
  {
    headline: 'Telecom regulator orders steep compensation cuts on call termination tariffs.',
    sector: 'Telecom',
    effectPercent: -16.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Telecom', effectPercent: -16.0 }]),
    notes: 'Tariff reductions lower cellular carrier operating revenue'
  },
  // 11. Automobile (+)
  {
    headline: 'Festive season car and commercial vehicle bookings surge to all-time record highs.',
    sector: 'Automobile',
    effectPercent: 18.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Automobile', effectPercent: 18.0 }]),
    notes: 'High vehicle delivery numbers boost Tata Motors and M&M'
  },
  // 12. Automobile (-)
  {
    headline: 'Global supply chain snags cause severe semiconductor chip shortages for automakers.',
    sector: 'Automobile',
    effectPercent: -15.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Automobile', effectPercent: -15.0 }]),
    notes: 'Assembly line cutbacks delay vehicle deliveries'
  },
  // 13. Energy (+)
  {
    headline: 'Government discovers massive offshore oil and gas reserve; state energy production expands.',
    sector: 'Energy',
    effectPercent: 18.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Energy', effectPercent: 18.0 }]),
    notes: 'New reserves and refining margins boost Reliance and ONGC'
  },
  // 14. Energy (-)
  {
    headline: 'Government slaps surprise windfall tax on domestic crude oil production and refining.',
    sector: 'Energy',
    effectPercent: -16.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Energy', effectPercent: -16.0 }]),
    notes: 'Export taxes and refining levies eat into oil & energy earnings'
  },
  // 15. Real Estate (+)
  {
    headline: 'Luxury housing registrations break 10-year records as mortgage demand skyrockets.',
    sector: 'Real Estate',
    effectPercent: 18.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Real Estate', effectPercent: 18.0 }]),
    notes: 'Record pre-sales boost property developers DLF and Godrej Properties'
  },
  // 16. Real Estate (-)
  {
    headline: 'Cement and steel building material prices spike 15%, slowing major real estate projects.',
    sector: 'Real Estate',
    effectPercent: -14.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Real Estate', effectPercent: -14.0 }]),
    notes: 'Higher construction costs dampen property development profits'
  },
  // 17. Renewable Energy (+)
  {
    headline: 'Government announces 30% capital subsidy package for green wind and solar power projects.',
    sector: 'Renewable Energy',
    effectPercent: 22.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Renewable Energy', effectPercent: 22.0 }]),
    notes: 'Clean energy push accelerates orders for Suzlon and financing for IREDA'
  },
  // 18. Renewable Energy (-)
  {
    headline: 'Grid connection delays and transmission bottlenecks temporarily halt green energy projects.',
    sector: 'Renewable Energy',
    effectPercent: -16.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Renewable Energy', effectPercent: -16.0 }]),
    notes: 'Grid delays hold up revenue realization for renewable developers'
  },
  // 19. Metals (+)
  {
    headline: 'Global infrastructure building boom triggers major shortage of steel and industrial iron ore.',
    sector: 'Metals',
    effectPercent: 20.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Metals', effectPercent: 20.0 }]),
    notes: 'Heavy metal demand drives price surge for SAIL and NMDC'
  },
  // 20. Metals (-)
  {
    headline: 'Imported cheap metal dumping floods domestic market, pushing steel and ore prices down.',
    sector: 'Metals',
    effectPercent: -16.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Metals', effectPercent: -16.0 }]),
    notes: 'Price undercutting forces margin pressure on domestic metal producers'
  },
  // 21. Banking (+) & Real Estate (+)
  {
    headline: 'Home loan interest rates drop to multi-year lows, sparking massive surge in new apartment bookings.',
    sector: 'Banking',
    effectPercent: 16.0,
    difficulty: 'MEDIUM',
    stockEffects: JSON.stringify([
      { sector: 'Banking', effectPercent: 15.0 },
      { sector: 'Real Estate', effectPercent: 18.0 }
    ]),
    notes: 'Lower mortgage rates fuel both bank lending and real estate property sales'
  },
  // 22. Renewable Energy (+) & Metals (+)
  {
    headline: 'Nationwide high-speed electric railway and solar grid expansion drives huge demand for industrial steel.',
    sector: 'Renewable Energy',
    effectPercent: 17.0,
    difficulty: 'MEDIUM',
    stockEffects: JSON.stringify([
      { sector: 'Renewable Energy', effectPercent: 18.0 },
      { sector: 'Metals', effectPercent: 16.0 }
    ]),
    notes: 'Green energy transit infrastructure boosts renewable energy and steel manufacturers'
  },
  // 23. Automobile (+) & Metals (+)
  {
    headline: 'Automakers report 25% jump in SUV manufacturing, ordering massive quantities of domestic steel.',
    sector: 'Automobile',
    effectPercent: 15.0,
    difficulty: 'MEDIUM',
    stockEffects: JSON.stringify([
      { sector: 'Automobile', effectPercent: 16.0 },
      { sector: 'Metals', effectPercent: 14.0 }
    ]),
    notes: 'Booming car assembly directly drives metal supplier purchase orders'
  },
  // 24. IT (+) & Telecom (+)
  {
    headline: 'Cloud computing adoption across India hits 80%, driving record bandwidth and enterprise tech contracts.',
    sector: 'IT',
    effectPercent: 16.0,
    difficulty: 'MEDIUM',
    stockEffects: JSON.stringify([
      { sector: 'IT', effectPercent: 17.0 },
      { sector: 'Telecom', effectPercent: 15.0 }
    ]),
    notes: 'Cloud rollout lifts both IT systems providers and telecom data networks'
  },
  // 25. Energy (+) & Automobile (-)
  {
    headline: 'Global crude oil prices jump 12% following tanker delays, raising petrol and diesel pump costs.',
    sector: 'Energy',
    effectPercent: 18.0,
    difficulty: 'MEDIUM',
    stockEffects: JSON.stringify([
      { sector: 'Energy', effectPercent: 18.0 },
      { sector: 'Automobile', effectPercent: -12.0 }
    ]),
    notes: 'Oil companies benefit from higher crude while vehicle buyer sentiment cools'
  },
  // 26. Defence (+) & IT (+)
  {
    headline: 'Armed forces award major military cyber-defence and electronic radar contract to domestic consortium.',
    sector: 'Defence',
    effectPercent: 20.0,
    difficulty: 'MEDIUM',
    stockEffects: JSON.stringify([
      { sector: 'Defence', effectPercent: 20.0 },
      { sector: 'IT', effectPercent: 14.0 }
    ]),
    notes: 'High-tech defence contracts boost aerospace manufacturers and IT software integrators'
  },
  // 27. Real Estate (-) & Banking (-)
  {
    headline: 'Property registration tax hike implemented across top metro cities, cooling buyer inquiries.',
    sector: 'Real Estate',
    effectPercent: -14.0,
    difficulty: 'MEDIUM',
    stockEffects: JSON.stringify([
      { sector: 'Real Estate', effectPercent: -15.0 },
      { sector: 'Banking', effectPercent: -10.0 }
    ]),
    notes: 'Real estate slowdown reduces property sales and dampens mortgage loan volumes'
  }
];

function getRandomVolume(min = 5000, max = 15000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('🌱 Starting ACTUAL TOURNAMENT database seeding...');

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
    const backupPath = path.join(__dirname, '../scripts/participants-live-roster.json');
    if (fs.existsSync(backupPath)) {
      const savedUsers = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
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
      where: { role: 'TRADER' },
      data: { walletBalance: 20000, hasLoggedIn: false }
    });
    console.log('✅ Reset all registered participants back to 20,000 IC wallet balance.');
  }

  // Ensure Admin User exists
  const adminPasswordHash = await bcrypt.hash('010428', 10);
  const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'avadhoot@krishna.kavya',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        walletBalance: 20000,
        isTestAccount: false
      }
    });
    console.log('✅ Created Admin user: avadhoot@krishna.kavya');
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
  console.log(`✅ Seeded ${ACTUAL_NEWS_TEMPLATES.length} Simple & Intuitive News Templates.`);

  console.log('🎉 ACTUAL TOURNAMENT database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
