const prisma = require('../prisma');

const ALL_NEWS_TEMPLATES = [
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
