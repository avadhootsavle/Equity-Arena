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
    headline: 'RBI cuts repo rate by 25 basis points; Indian banks expect huge surge in home and business loans.',
    sector: 'Banking',
    effectPercent: 15.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Banking', effectPercent: 15.0 }]),
    notes: 'RBI rate cut directly boosts lending margins for HDFC Bank and ICICI Bank'
  },
  // 2. Banking (-)
  {
    headline: 'RBI raises cash reserve ratio (CRR); Indian private banks face higher cost of funds.',
    sector: 'Banking',
    effectPercent: -14.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Banking', effectPercent: -14.0 }]),
    notes: 'Tighter liquidity by RBI squeezes bank lending margins'
  },
  // 3. IT (+)
  {
    headline: 'Digital India and global tech giants sign multi-billion dollar AI deals with Indian IT majors.',
    sector: 'IT',
    effectPercent: 18.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'IT', effectPercent: 18.0 }]),
    notes: 'Booming AI tech order wins boost TCS and Infosys revenues'
  },
  // 4. IT (-)
  {
    headline: 'Indian IT sector faces visa restrictions and delayed enterprise project rollouts overseas.',
    sector: 'IT',
    effectPercent: -15.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'IT', effectPercent: -15.0 }]),
    notes: 'Delayed client billing impacts Indian software exporters'
  },
  // 5. Defence (+)
  {
    headline: 'Defence Ministry awards historic ₹45,000 Crore "Make in India" contract for indigenous fighter jets and radars.',
    sector: 'Defence',
    effectPercent: 22.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Defence', effectPercent: 22.0 }]),
    notes: 'Defence procurement accelerates order backlogs for HAL and BEL'
  },
  // 6. Defence (-)
  {
    headline: 'Ministry of Defence defers annual procurement trials pending parliamentary standing committee review.',
    sector: 'Defence',
    effectPercent: -14.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Defence', effectPercent: -14.0 }]),
    notes: 'Trial postponements temporarily delay defence revenue realization'
  },
  // 7. Pharma (+)
  {
    headline: 'US FDA gives clean approval to Indian manufacturing facilities of Sun Pharma and Cipla with zero observations.',
    sector: 'Pharma',
    effectPercent: 19.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Pharma', effectPercent: 19.0 }]),
    notes: 'US export clearance opens massive revenue channels for Indian pharma leaders'
  },
  // 8. Pharma (-)
  {
    headline: 'National Pharmaceutical Pricing Authority (NPPA) enforces strict price caps on essential Indian medicines.',
    sector: 'Pharma',
    effectPercent: -13.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Pharma', effectPercent: -13.0 }]),
    notes: 'Domestic price controls compress pharmaceutical profit margins'
  },
  // 9. Telecom (+)
  {
    headline: 'TRAI reports record mobile data consumption in India following massive 5G network expansion.',
    sector: 'Telecom',
    effectPercent: 17.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Telecom', effectPercent: 17.0 }]),
    notes: 'Rapid 5G adoption boosts ARPU for Bharti Airtel and Vodafone Idea'
  },
  // 10. Telecom (-)
  {
    headline: 'Department of Telecommunications (DoT) demands higher spectrum fee dues from Indian telecom operators.',
    sector: 'Telecom',
    effectPercent: -16.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Telecom', effectPercent: -16.0 }]),
    notes: 'Higher regulatory statutory levies hurt telecom cash flows'
  },
  // 11. Automobile (+)
  {
    headline: 'Diwali festive season car and SUV deliveries smash all-time Indian auto sales records.',
    sector: 'Automobile',
    effectPercent: 18.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Automobile', effectPercent: 18.0 }]),
    notes: 'Record festive demand triggers stock rally for Tata Motors and M&M'
  },
  // 12. Automobile (-)
  {
    headline: 'Indian auto component manufacturers face production slowdown due to semiconductor import delays.',
    sector: 'Automobile',
    effectPercent: -15.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Automobile', effectPercent: -15.0 }]),
    notes: 'Assembly line bottlenecks slow vehicle delivery times across India'
  },
  // 13. Energy (+)
  {
    headline: 'Ministry of Petroleum confirms massive deepwater natural gas discovery in the Krishna-Godavari Basin.',
    sector: 'Energy',
    effectPercent: 18.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Energy', effectPercent: 18.0 }]),
    notes: 'Major domestic gas discovery significantly increases valuations of Reliance and ONGC'
  },
  // 14. Energy (-)
  {
    headline: 'Finance Ministry slaps surprise windfall tax on Indian domestic crude production and fuel exports.',
    sector: 'Energy',
    effectPercent: -16.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Energy', effectPercent: -16.0 }]),
    notes: 'Windfall export tax cuts into refinery and extraction margins'
  },
  // 15. Real Estate (+)
  {
    headline: 'Mumbai and Delhi-NCR luxury apartment registrations reach 10-year high amid booming Indian homeownership.',
    sector: 'Real Estate',
    effectPercent: 18.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Real Estate', effectPercent: 18.0 }]),
    notes: 'Surging housing demand powers pre-sales for DLF and Godrej Properties'
  },
  // 16. Real Estate (-)
  {
    headline: 'State governments across India increase municipal stamp duty and construction cess by 2%.',
    sector: 'Real Estate',
    effectPercent: -14.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Real Estate', effectPercent: -14.0 }]),
    notes: 'Higher property taxes cool urban real estate booking momentum'
  },
  // 17. Renewable Energy (+)
  {
    headline: 'Ministry of New & Renewable Energy announces ₹20,000 Crore PM-Surya Ghar solar subsidy scheme.',
    sector: 'Renewable Energy',
    effectPercent: 22.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Renewable Energy', effectPercent: 22.0 }]),
    notes: 'National solar push accelerates turbine orders for Suzlon and financing for IREDA'
  },
  // 18. Renewable Energy (-)
  {
    headline: 'Power Grid Corporation reports transmission congestion, temporarily capping green power evacuation.',
    sector: 'Renewable Energy',
    effectPercent: -16.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Renewable Energy', effectPercent: -16.0 }]),
    notes: 'Transmission delays postpone revenue realization for clean energy firms'
  },
  // 19. Metals (+)
  {
    headline: 'National Infrastructure Pipeline (NIP) orders massive domestic steel and iron ore supply for expressways.',
    sector: 'Metals',
    effectPercent: 20.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Metals', effectPercent: 20.0 }]),
    notes: 'Heavy infrastructure push sparks major rally for SAIL and NMDC'
  },
  // 20. Metals (-)
  {
    headline: 'Government cuts import duties on foreign steel, allowing cheap imported steel into Indian markets.',
    sector: 'Metals',
    effectPercent: -16.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Metals', effectPercent: -16.0 }]),
    notes: 'Cheaper imported metal squeezes domestic steel producers margins'
  },
  // 21. Banking (+) & Real Estate (+)
  {
    headline: 'Indian banks slash home loan interest rates to 7.9%, sparking unprecedented wave of new home registrations.',
    sector: 'Banking',
    effectPercent: 16.0,
    difficulty: 'MEDIUM',
    stockEffects: JSON.stringify([
      { sector: 'Banking', effectPercent: 15.0 },
      { sector: 'Real Estate', effectPercent: 18.0 }
    ]),
    notes: 'Lower interest rates drive loan growth for banks and apartment bookings for developers'
  },
  // 22. Renewable Energy (+) & Metals (+)
  {
    headline: 'Indian Railways approves 100% green energy transition, placing huge contracts for solar panels and track steel.',
    sector: 'Renewable Energy',
    effectPercent: 17.0,
    difficulty: 'MEDIUM',
    stockEffects: JSON.stringify([
      { sector: 'Renewable Energy', effectPercent: 18.0 },
      { sector: 'Metals', effectPercent: 16.0 }
    ]),
    notes: 'Railway electrification drives joint boom in green energy and industrial steel'
  },
  // 23. Automobile (+) & Metals (+)
  {
    headline: 'Indian carmakers report 30% surge in commercial vehicle production, placing record bulk orders for domestic steel.',
    sector: 'Automobile',
    effectPercent: 15.0,
    difficulty: 'MEDIUM',
    stockEffects: JSON.stringify([
      { sector: 'Automobile', effectPercent: 16.0 },
      { sector: 'Metals', effectPercent: 14.0 }
    ]),
    notes: 'Surging auto manufacturing directly increases domestic steel demand'
  },
  // 24. IT (+) & Telecom (+)
  {
    headline: 'Digital India initiative connects 50,000 gram panchayats with high-speed fiber, awarding contracts to IT and telecom leaders.',
    sector: 'IT',
    effectPercent: 16.0,
    difficulty: 'MEDIUM',
    stockEffects: JSON.stringify([
      { sector: 'IT', effectPercent: 17.0 },
      { sector: 'Telecom', effectPercent: 15.0 }
    ]),
    notes: 'Rural digital rollout accelerates IT software deployments and telecom data growth'
  },
  // 25. Energy (+) & Automobile (-)
  {
    headline: 'International crude oil hits $95 per barrel; Indian fuel retailers raise petrol and diesel pump prices.',
    sector: 'Energy',
    effectPercent: 18.0,
    difficulty: 'MEDIUM',
    stockEffects: JSON.stringify([
      { sector: 'Energy', effectPercent: 18.0 },
      { sector: 'Automobile', effectPercent: -12.0 }
    ]),
    notes: 'Higher fuel prices boost energy explorer earnings while cooling consumer car purchasing sentiment'
  },
  // 26. Defence (+) & IT (+)
  {
    headline: 'Indian Armed Forces award major Tri-Service secure military cloud network contract to domestic defence consortium.',
    sector: 'Defence',
    effectPercent: 20.0,
    difficulty: 'MEDIUM',
    stockEffects: JSON.stringify([
      { sector: 'Defence', effectPercent: 20.0 },
      { sector: 'IT', effectPercent: 14.0 }
    ]),
    notes: 'High-tech defence contract lifts electronic equipment makers and IT system architects'
  },
  // 27. Real Estate (-) & Banking (-)
  {
    headline: 'State stamp duty and registration charges hiked by 1.5% in top metros, leading to temporary slump in home loans.',
    sector: 'Real Estate',
    effectPercent: -14.0,
    difficulty: 'MEDIUM',
    stockEffects: JSON.stringify([
      { sector: 'Real Estate', effectPercent: -15.0 },
      { sector: 'Banking', effectPercent: -10.0 }
    ]),
    notes: 'Property registration tax hike slows residential sales and mortgage disbursals'
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

  // 4. Seed Intuitive, Simple Indian-Centric News Templates
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
  console.log(`✅ Seeded ${ACTUAL_NEWS_TEMPLATES.length} India-Centric News Templates.`);

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
