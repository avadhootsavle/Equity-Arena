const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const ACTUAL_INDIA_STOCKS = [
  // 1. Banking
  { symbol: 'HDFB', name: 'HDFB Bank', sector: 'Banking', basePrice: 1800.00 },
  { symbol: 'ICCO', name: 'ICICO Bank', sector: 'Banking', basePrice: 1250.00 },

  // 2. IT
  { symbol: 'TCX', name: 'TCX', sector: 'IT', basePrice: 4200.00 },
  { symbol: 'INFS', name: 'Infisys', sector: 'IT', basePrice: 1600.00 },

  // 3. Defence & Aerospace
  { symbol: 'HAAL', name: 'HAAL', sector: 'Defence & Aerospace', basePrice: 5000.00 },
  { symbol: 'BEEL', name: 'BEEL', sector: 'Defence & Aerospace', basePrice: 420.00 },

  // 4. Pharmaceuticals
  { symbol: 'SURY', name: 'Suryan Pharma', sector: 'Pharmaceuticals', basePrice: 1900.00 },
  { symbol: 'CPLX', name: 'Ciplex', sector: 'Pharmaceuticals', basePrice: 1500.00 },

  // 5. Telecommunications
  { symbol: 'AIRT', name: 'Bharat Airtell', sector: 'Telecommunications', basePrice: 1850.00 },
  { symbol: 'IDEA', name: 'Vodfone Idea', sector: 'Telecommunications', basePrice: 18.00 },

  // 6. Automobile
  { symbol: 'TATV', name: 'Tatva Motors', sector: 'Automobile', basePrice: 950.00 },
  { symbol: 'M&M', name: 'M&M', sector: 'Automobile', basePrice: 3000.00 },

  // 7. Energy (Oil & Gas)
  { symbol: 'RELI', name: 'Reliants Industries', sector: 'Energy (Oil & Gas)', basePrice: 2900.00 },
  { symbol: 'ONGC', name: 'ONGCO', sector: 'Energy (Oil & Gas)', basePrice: 350.00 },

  // 8. Real Estate
  { symbol: 'DLEF', name: 'DLEF', sector: 'Real Estate', basePrice: 850.00 },
  { symbol: 'GODR', name: 'Godrej Properties', sector: 'Real Estate', basePrice: 2700.00 },

  // 9. Renewable Energy
  { symbol: 'SUZL', name: 'Suzlan', sector: 'Renewable Energy', basePrice: 75.00 },
  { symbol: 'IRED', name: 'IREDAA', sector: 'Renewable Energy', basePrice: 95.00 },

  // 10. Metals & Mining
  { symbol: 'SAAL', name: 'SAAIL', sector: 'Metals & Mining', basePrice: 98.00 },
  { symbol: 'NMDC', name: 'NMDCX', sector: 'Metals & Mining', basePrice: 90.00 }
];

const ACTUAL_NEWS_TEMPLATES = [
  // 1. Banking (+)
  {
    headline: 'RBI cuts repo rate by 25 basis points; HDFB Bank and ICICO Bank expect huge surge in loan demand.',
    sector: 'Banking',
    effectPercent: 15.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Banking', effectPercent: 15.0 }]),
    notes: 'RBI repo rate cut directly boosts lending margins for HDFB Bank and ICICO Bank'
  },
  // 2. Banking (-)
  {
    headline: 'RBI raises cash reserve ratio (CRR); private lenders HDFB Bank and ICICO Bank face higher borrowing costs.',
    sector: 'Banking',
    effectPercent: -14.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Banking', effectPercent: -14.0 }]),
    notes: 'Tighter liquidity by RBI squeezes bank lending margins'
  },
  // 3. IT (+)
  {
    headline: 'Digital India and global tech giants sign multi-billion dollar AI enterprise deals with TCX and Infisys.',
    sector: 'IT',
    effectPercent: 18.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'IT', effectPercent: 18.0 }]),
    notes: 'Booming AI tech order wins boost TCX and Infisys revenues'
  },
  // 4. IT (-)
  {
    headline: 'Indian IT sector faces offshore visa curbs; TCX and Infisys report delayed project billing cycles.',
    sector: 'IT',
    effectPercent: -15.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'IT', effectPercent: -15.0 }]),
    notes: 'Delayed client billing impacts IT consulting leaders'
  },
  // 5. Defence & Aerospace (+)
  {
    headline: 'Defence Ministry awards historic ₹45,000 Crore "Make in India" aircraft and radar contract to HAAL and BEEL.',
    sector: 'Defence & Aerospace',
    effectPercent: 22.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Defence & Aerospace', effectPercent: 22.0 }]),
    notes: 'Defence procurement accelerates order backlogs for HAAL and BEEL'
  },
  // 6. Defence & Aerospace (-)
  {
    headline: 'Ministry of Defence defers equipment modernization trials; procurement slowed for HAAL and BEEL.',
    sector: 'Defence & Aerospace',
    effectPercent: -14.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Defence & Aerospace', effectPercent: -14.0 }]),
    notes: 'Trial postponements temporarily delay defence revenue realization'
  },
  // 7. Pharmaceuticals (+)
  {
    headline: 'US FDA grants zero-observation clean clearance to manufacturing plants of Suryan Pharma and Ciplex.',
    sector: 'Pharmaceuticals',
    effectPercent: 19.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Pharmaceuticals', effectPercent: 19.0 }]),
    notes: 'US export clearance opens massive revenue channels for Suryan Pharma and Ciplex'
  },
  // 8. Pharmaceuticals (-)
  {
    headline: 'National Pharmaceutical Pricing Authority (NPPA) enforces strict price caps on Suryan Pharma and Ciplex medicines.',
    sector: 'Pharmaceuticals',
    effectPercent: -13.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Pharmaceuticals', effectPercent: -13.0 }]),
    notes: 'Domestic price controls compress pharmaceutical profit margins'
  },
  // 9. Telecommunications (+)
  {
    headline: 'TRAI reports record mobile data usage across India following rapid 5G adoption on Bharat Airtell and Vodfone Idea.',
    sector: 'Telecommunications',
    effectPercent: 17.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Telecommunications', effectPercent: 17.0 }]),
    notes: 'Rapid 5G adoption boosts ARPU for Bharat Airtell and Vodfone Idea'
  },
  // 10. Telecommunications (-)
  {
    headline: 'Department of Telecommunications (DoT) issues statutory spectrum fee demand notices to telecom carriers.',
    sector: 'Telecommunications',
    effectPercent: -16.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Telecommunications', effectPercent: -16.0 }]),
    notes: 'Higher regulatory statutory levies hurt telecom cash flows'
  },
  // 11. Automobile (+)
  {
    headline: 'Diwali festive season SUV and commercial vehicle bookings smash all-time records for Tatva Motors and M&M.',
    sector: 'Automobile',
    effectPercent: 18.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Automobile', effectPercent: 18.0 }]),
    notes: 'Record festive deliveries trigger rally for Tatva Motors and M&M'
  },
  // 12. Automobile (-)
  {
    headline: 'Automakers face assembly line delays as imported microchip shipments get held up at Indian customs.',
    sector: 'Automobile',
    effectPercent: -15.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Automobile', effectPercent: -15.0 }]),
    notes: 'Component bottlenecks slow vehicle deliveries for Tatva Motors and M&M'
  },
  // 13. Energy (Oil & Gas) (+)
  {
    headline: 'Ministry of Petroleum confirms massive deepwater natural gas discovery, boosting Reliants Industries and ONGCO.',
    sector: 'Energy (Oil & Gas)',
    effectPercent: 18.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Energy (Oil & Gas)', effectPercent: 18.0 }]),
    notes: 'Major domestic gas discovery significantly increases valuations of Reliants and ONGCO'
  },
  // 14. Energy (Oil & Gas) (-)
  {
    headline: 'Finance Ministry slaps surprise windfall export tax on crude production of Reliants Industries and ONGCO.',
    sector: 'Energy (Oil & Gas)',
    effectPercent: -16.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Energy (Oil & Gas)', effectPercent: -16.0 }]),
    notes: 'Windfall export tax cuts into energy refinery and extraction margins'
  },
  // 15. Real Estate (+)
  {
    headline: 'Luxury apartment pre-sales reach 10-year high in Mumbai and Delhi-NCR for DLEF and Godrej Properties.',
    sector: 'Real Estate',
    effectPercent: 18.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Real Estate', effectPercent: 18.0 }]),
    notes: 'Surging housing demand powers pre-sales for DLEF and Godrej Properties'
  },
  // 16. Real Estate (-)
  {
    headline: 'State governments increase municipal stamp duty and construction cess, cooling property registrations.',
    sector: 'Real Estate',
    effectPercent: -14.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Real Estate', effectPercent: -14.0 }]),
    notes: 'Higher property taxes cool urban real estate booking momentum'
  },
  // 17. Renewable Energy (+)
  {
    headline: 'Ministry of New & Renewable Energy announces ₹20,000 Crore solar & wind subsidy package, lifting Suzlan and IREDAA.',
    sector: 'Renewable Energy',
    effectPercent: 22.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Renewable Energy', effectPercent: 22.0 }]),
    notes: 'National green push accelerates turbine orders for Suzlan and green loans for IREDAA'
  },
  // 18. Renewable Energy (-)
  {
    headline: 'Power Grid transmission congestion delays commissioning of green energy projects for Suzlan and IREDAA.',
    sector: 'Renewable Energy',
    effectPercent: -16.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Renewable Energy', effectPercent: -16.0 }]),
    notes: 'Transmission delays postpone revenue realization for clean energy firms'
  },
  // 19. Metals & Mining (+)
  {
    headline: 'National Infrastructure Pipeline orders massive domestic steel and iron ore shipments from SAAIL and NMDCX.',
    sector: 'Metals & Mining',
    effectPercent: 20.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Metals & Mining', effectPercent: 20.0 }]),
    notes: 'Heavy infrastructure push sparks major rally for SAAIL and NMDCX'
  },
  // 20. Metals & Mining (-)
  {
    headline: 'Government cuts import duties on foreign steel, allowing cheap imported metals to pressure SAAIL and NMDCX.',
    sector: 'Metals & Mining',
    effectPercent: -16.0,
    difficulty: 'EASY',
    stockEffects: JSON.stringify([{ sector: 'Metals & Mining', effectPercent: -16.0 }]),
    notes: 'Cheaper imported metal squeezes domestic steel and iron producers margins'
  },
  // 21. Banking (+) & Real Estate (+)
  {
    headline: 'HDFB Bank and ICICO Bank slash home loan interest rates to 7.9%, sparking massive apartment sales for DLEF and Godrej.',
    sector: 'Banking',
    effectPercent: 16.0,
    difficulty: 'MEDIUM',
    stockEffects: JSON.stringify([
      { sector: 'Banking', effectPercent: 15.0 },
      { sector: 'Real Estate', effectPercent: 18.0 }
    ]),
    notes: 'Lower mortgage rates fuel both bank lending and real estate property sales'
  },
  // 22. Renewable Energy (+) & Metals & Mining (+)
  {
    headline: 'Indian Railways approves 100% green transit corridor, ordering massive solar setups from Suzlan and steel tracks from SAAIL.',
    sector: 'Renewable Energy',
    effectPercent: 17.0,
    difficulty: 'MEDIUM',
    stockEffects: JSON.stringify([
      { sector: 'Renewable Energy', effectPercent: 18.0 },
      { sector: 'Metals & Mining', effectPercent: 16.0 }
    ]),
    notes: 'Railway electrification drives joint boom in green energy and industrial steel'
  },
  // 23. Automobile (+) & Metals & Mining (+)
  {
    headline: 'Tatva Motors and M&M ramp up commercial SUV manufacturing by 30%, placing record bulk steel orders with SAAIL.',
    sector: 'Automobile',
    effectPercent: 15.0,
    difficulty: 'MEDIUM',
    stockEffects: JSON.stringify([
      { sector: 'Automobile', effectPercent: 16.0 },
      { sector: 'Metals & Mining', effectPercent: 14.0 }
    ]),
    notes: 'Surging auto manufacturing directly increases domestic steel demand'
  },
  // 24. IT (+) & Telecommunications (+)
  {
    headline: 'Digital India connects 50,000 gram panchayats with high-speed fiber, awarding mega contracts to TCX, Infisys, and Bharat Airtell.',
    sector: 'IT',
    effectPercent: 16.0,
    difficulty: 'MEDIUM',
    stockEffects: JSON.stringify([
      { sector: 'IT', effectPercent: 17.0 },
      { sector: 'Telecommunications', effectPercent: 15.0 }
    ]),
    notes: 'Rural digital rollout accelerates IT software deployments and telecom data growth'
  },
  // 25. Energy (Oil & Gas) (+) & Automobile (-)
  {
    headline: 'International crude oil surges to $95 per barrel; fuel retailers raise pump rates while car buyers turn cautious.',
    sector: 'Energy (Oil & Gas)',
    effectPercent: 18.0,
    difficulty: 'MEDIUM',
    stockEffects: JSON.stringify([
      { sector: 'Energy (Oil & Gas)', effectPercent: 18.0 },
      { sector: 'Automobile', effectPercent: -12.0 }
    ]),
    notes: 'Higher fuel prices boost energy explorer earnings while cooling consumer car purchasing sentiment'
  },
  // 26. Defence & Aerospace (+) & IT (+)
  {
    headline: 'Indian Armed Forces award major Tri-Service secure military network contract to HAAL, BEEL, and TCX.',
    sector: 'Defence & Aerospace',
    effectPercent: 20.0,
    difficulty: 'MEDIUM',
    stockEffects: JSON.stringify([
      { sector: 'Defence & Aerospace', effectPercent: 20.0 },
      { sector: 'IT', effectPercent: 14.0 }
    ]),
    notes: 'High-tech defence contract lifts electronic equipment makers and IT software integrators'
  },
  // 27. Real Estate (-) & Banking (-)
  {
    headline: 'State property registration tax hiked by 1.5% in top metros, causing temporary slowdown in home loan disbursals.',
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
  console.log('🌱 Starting ACTUAL TOURNAMENT database seeding with new stock roster...');

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
  console.log(`✅ Seeded ${ACTUAL_NEWS_TEMPLATES.length} Simple & Intuitive News Templates tailored to new stock roster.`);

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
