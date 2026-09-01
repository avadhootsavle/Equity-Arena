const prisma = require('../prisma');

const ALL_NEWS_TEMPLATES = [
  // --- EASY ---
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

  // --- MEDIUM ---
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

  // --- HARD ---
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
  },

  // --- PHASE 23B: REALISTIC CROSS-SECTOR TEMPLATES ---
  {
    headline: "A major digital banking platform reported a security incident affecting online transactions overnight. Technology providers linked to the platform's infrastructure are also facing scrutiny.",
    sector: "Banking/Finance",
    effectPercent: -15.0,
    difficulty: "MEDIUM",
    stockEffects: JSON.stringify([
      { sector: "Banking/Finance", effectPercent: -15.0 },
      { sector: "Technology", effectPercent: -12.0 }
    ]),
    notes: "Cybersecurity incident at digital banking hub impacts both banking operations and core tech infrastructure suppliers."
  },
  {
    headline: "A leading bank announced a new AI-driven fraud detection system built with a domestic technology partner, cutting processing times significantly.",
    sector: "Banking/Finance",
    effectPercent: 16.0,
    difficulty: "MEDIUM",
    stockEffects: JSON.stringify([
      { sector: "Banking/Finance", effectPercent: 16.0 },
      { sector: "Technology", effectPercent: 15.0 }
    ]),
    notes: "Fintech infrastructure partnership accelerates digital banking efficiency and software licensing revenue."
  },
  {
    headline: "Fuel costs for commercial shipping have risen sharply following new export restrictions from a major oil-producing region.",
    sector: "Oil & Gas",
    effectPercent: 18.0,
    difficulty: "HARD",
    stockEffects: JSON.stringify([
      { sector: "Oil & Gas", effectPercent: 18.0 },
      { sector: "Shipping/Logistics", effectPercent: -16.0 }
    ]),
    notes: "Crude oil export limits boost energy producer cash flows while inflating maritime shipping bunker fuel expenses."
  },
  {
    headline: "A telecom provider announced a major content-streaming partnership with a domestic studio, bundling data plans with entertainment subscriptions.",
    sector: "Telecom",
    effectPercent: 15.0,
    difficulty: "MEDIUM",
    stockEffects: JSON.stringify([
      { sector: "Telecom", effectPercent: 15.0 },
      { sector: "Media/Entertainment", effectPercent: 18.0 }
    ]),
    notes: "Streaming and mobile data bundle accelerates subscriber adoption for both telecom operator and studio."
  },
  {
    headline: "Regulators approved a new agricultural biotech treatment developed jointly by a pharmaceutical firm and an agri-sciences team, expected to boost crop yields nationwide.",
    sector: "Pharmaceuticals",
    effectPercent: 16.0,
    difficulty: "MEDIUM",
    stockEffects: JSON.stringify([
      { sector: "Pharmaceuticals", effectPercent: 16.0 },
      { sector: "Agriculture", effectPercent: 17.0 }
    ]),
    notes: "Agri-pharma biotech breakthrough enhances crop yield expectations and pharmaceutical licensing income."
  },
  {
    headline: "New emissions regulations require increased use of specialty metals in vehicle manufacturing, raising input costs for automakers.",
    sector: "Precious Metals",
    effectPercent: 18.0,
    difficulty: "HARD",
    stockEffects: JSON.stringify([
      { sector: "Precious Metals", effectPercent: 18.0 },
      { sector: "Automobile", effectPercent: -15.0 }
    ]),
    notes: "Catalytic emissions compliance spikes precious metals spot prices while compressing automaker gross margins."
  },
  {
    headline: "The central bank signaled a shift in mortgage lending policy aimed at cooling the housing market.",
    sector: "Banking/Finance",
    effectPercent: -14.0,
    difficulty: "MEDIUM",
    stockEffects: JSON.stringify([
      { sector: "Banking/Finance", effectPercent: -14.0 },
      { sector: "Real Estate", effectPercent: -16.0 }
    ]),
    notes: "Mortgage credit tightening dampens housing sales velocity and financial sector loan growth."
  },
  {
    headline: "A major retail chain reported a data outage linked to its telecom infrastructure provider, disrupting online orders for several hours.",
    sector: "Retail",
    effectPercent: -15.0,
    difficulty: "MEDIUM",
    stockEffects: JSON.stringify([
      { sector: "Retail", effectPercent: -15.0 },
      { sector: "Telecom", effectPercent: -12.0 }
    ]),
    notes: "Network infrastructure disruption halts e-commerce sales and damages telecom service reliability ratings."
  },
  {
    headline: "Government redirected discretionary aerospace infrastructure spending toward emergency defense procurement for sovereign border defense.",
    sector: "Defense",
    effectPercent: 20.0,
    difficulty: "HARD",
    stockEffects: JSON.stringify([
      { sector: "Defense", effectPercent: 20.0 },
      { sector: "Aviation", effectPercent: -14.0 }
    ]),
    notes: "Aerospace budget reallocation accelerates defense order backlogs while delaying commercial aviation subsidies."
  },
  {
    headline: "State transport authorities announced capital rebates for commercial delivery fleets adopting grid-connected electric vehicles.",
    sector: "Renewable Energy",
    effectPercent: 17.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([
      { sector: "Renewable Energy", effectPercent: 17.0 },
      { sector: "Automobile", effectPercent: 15.0 }
    ]),
    notes: "Fleet electrification incentives boost renewable power demand and commercial motor vehicle production."
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
    console.log(`✅ Verified ${count} Analyst News Templates in database (34 total pool).`);
  } catch (err) {
    console.error('Error seeding news templates:', err.message);
  }
}

module.exports = {
  ALL_NEWS_TEMPLATES,
  ensureNewsTemplatesSeeded
};
