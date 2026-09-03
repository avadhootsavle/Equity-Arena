const prisma = require('../prisma');

const ALL_NEWS_TEMPLATES = [
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


async function ensureNewsTemplatesSeeded() {
  try {
    for (const tpl of ALL_NEWS_TEMPLATES) {
      const existing = await prisma.newsTemplate.findFirst({
        where: { headline: tpl.headline }
      });
      if (!existing) {
        await prisma.newsTemplate.create({ data: tpl });
      }
    }
    const count = await prisma.newsTemplate.count();
    console.log(`✅ Verified ${count} Analyst News Templates in database (${ALL_NEWS_TEMPLATES.length} total pool).`);
  } catch (err) {
    console.error('Error seeding news templates:', err.message);
  }
}

module.exports = {
  ALL_NEWS_TEMPLATES,
  ensureNewsTemplatesSeeded
};
