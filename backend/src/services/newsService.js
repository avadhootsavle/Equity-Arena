const prisma = require("../prisma");

const ALL_NEWS_TEMPLATES = [
  // =========================================================================
  // 1. DEFENCE & AEROSPACE (HAAL, BEEL)
  // =========================================================================
  {
    headline: "Border tensions escalate between India and neighboring countries; government orders urgent emergency military fighter jet and radar missile production.",
    sector: "Defence & Aerospace",
    effectPercent: 25.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Defence & Aerospace", effectPercent: 25.0 }]),
    notes: "War and military tensions directly trigger massive rush in defence manufacturing orders"
  },
  {
    headline: "International peace treaty signed and border conflicts end permanently; government slashes next year’s military defense budget by 40%.",
    sector: "Defence & Aerospace",
    effectPercent: -20.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Defence & Aerospace", effectPercent: -20.0 }]),
    notes: "Peace accords and defence budget cuts drop military contractor demand"
  },

  // =========================================================================
  // 2. ENERGY / OIL & GAS (Reliants Industries, ONGCO)
  // =========================================================================
  {
    headline: "War in Middle East and Russia shuts down major global oil pipelines; international crude oil price spikes above $120 per barrel.",
    sector: "Energy (Oil & Gas)",
    effectPercent: 22.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Energy (Oil & Gas)", effectPercent: 22.0 }]),
    notes: "War oil pipeline disruptions spike crude oil prices, booming oil exploration and refinery profits"
  },
  {
    headline: "Huge global crude oil surplus floods the market; international oil and petrol prices crash by 35% overnight.",
    sector: "Energy (Oil & Gas)",
    effectPercent: -18.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Energy (Oil & Gas)", effectPercent: -18.0 }]),
    notes: "Crude oil price crash directly cuts profits of oil exploration and refinery companies"
  },

  // =========================================================================
  // 3. AUTOMOBILE (Tatva Motors, M&M)
  // =========================================================================
  {
    headline: "Diwali and festive holiday season sees record-breaking demand; millions of Indians buy new cars, SUVs, and commercial trucks.",
    sector: "Automobile",
    effectPercent: 20.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Automobile", effectPercent: 20.0 }]),
    notes: "Festive shopping rush causes historic vehicle sales boom"
  },
  {
    headline: "Severe global computer microchip shortage shuts down vehicle manufacturing factories; car and SUV deliveries delayed by 6 months.",
    sector: "Automobile",
    effectPercent: -18.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Automobile", effectPercent: -18.0 }]),
    notes: "Microchip shortages halt assembly lines and stop vehicle sales"
  },

  // =========================================================================
  // 4. IT / SOFTWARE (TCX, Infisys)
  // =========================================================================
  {
    headline: "Global Artificial Intelligence (AI) boom explodes; top American and European banks sign multi-billion dollar software deals with Indian tech companies.",
    sector: "IT",
    effectPercent: 20.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "IT", effectPercent: 20.0 }]),
    notes: "Global AI software spending boom directly lifts Indian IT giants"
  },
  {
    headline: "US and Europe enter severe economic recession; global corporations freeze all software spending and cancel IT consulting contracts.",
    sector: "IT",
    effectPercent: -18.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "IT", effectPercent: -18.0 }]),
    notes: "US recession freezes corporate IT spending budgets"
  },

  // =========================================================================
  // 5. BANKING & FINANCE (HDFB Bank, ICICO Bank)
  // =========================================================================
  {
    headline: "Reserve Bank of India (RBI) cuts interest rates sharply; borrowing becomes super cheap and loan demand from citizens doubles.",
    sector: "Banking",
    effectPercent: 18.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Banking", effectPercent: 18.0 }]),
    notes: "Cheap interest rates spark huge surge in bank loans and mortgages"
  },
  {
    headline: "Reserve Bank of India (RBI) warns of rising unpaid loans; enforces heavy penalties and strict restrictions on commercial bank lending.",
    sector: "Banking",
    effectPercent: -16.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Banking", effectPercent: -16.0 }]),
    notes: "Lending restrictions and bad loan defaults hit banking profits"
  },

  // =========================================================================
  // 6. PHARMACEUTICALS & HEALTHCARE (Suryan Pharma, Ciplex)
  // =========================================================================
  {
    headline: "New global flu virus outbreak detected; hospitals worldwide place massive bulk orders for Indian medicines and antibiotic treatments.",
    sector: "Pharmaceuticals",
    effectPercent: 22.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Pharmaceuticals", effectPercent: 22.0 }]),
    notes: "Global virus outbreak triggers huge worldwide demand for pharmaceutical drugs"
  },
  {
    headline: "Health Ministry imposes strict government price control on all essential drugs and medicines, capping maximum retail prices.",
    sector: "Pharmaceuticals",
    effectPercent: -16.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Pharmaceuticals", effectPercent: -16.0 }]),
    notes: "Strict medicine price caps reduce pharma profit margins"
  },

  // =========================================================================
  // 7. TELECOMMUNICATIONS (Bharat Airtell, Vodfone Idea)
  // =========================================================================
  {
    headline: "Internet video streaming and mobile online gaming usage hits all-time high across India; telecom monthly mobile recharge rates rise.",
    sector: "Telecommunications",
    effectPercent: 18.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Telecommunications", effectPercent: 18.0 }]),
    notes: "Heavy mobile data usage and higher recharge prices boost telecom revenues"
  },
  {
    headline: "Major undersea fiber-optic internet cables get severed in the ocean; widespread mobile internet blackout across Indian cities.",
    sector: "Telecommunications",
    effectPercent: -16.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Telecommunications", effectPercent: -16.0 }]),
    notes: "Severe network breakdown and blackout hurt telecom operators"
  },

  // =========================================================================
  // 8. REAL ESTATE (DLEF, Godrej Properties)
  // =========================================================================
  {
    headline: "Homebuyers flood property market in Mumbai and Delhi; luxury residential apartments and flats sell out within 24 hours of launch.",
    sector: "Real Estate",
    effectPercent: 20.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Real Estate", effectPercent: 20.0 }]),
    notes: "Massive residential housing boom drives record sales for real estate builders"
  },
  {
    headline: "Government hikes property registration stamp duty and cement costs soar; apartment buyers postpone new home purchases.",
    sector: "Real Estate",
    effectPercent: -16.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Real Estate", effectPercent: -16.0 }]),
    notes: "Higher taxes and building costs freeze new housing bookings"
  },

  // =========================================================================
  // 9. RENEWABLE ENERGY (Suzlan, IREDAA)
  // =========================================================================
  {
    headline: "Government announces ₹50,000 Crore mega subsidy package for green solar parks and giant wind turbine electricity projects.",
    sector: "Renewable Energy",
    effectPercent: 25.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Renewable Energy", effectPercent: 25.0 }]),
    notes: "Mega government green subsidies trigger massive rally in renewable energy"
  },
  {
    headline: "National electricity grid fails to connect newly built green power plants; wind and solar project developers face severe payment delays.",
    sector: "Renewable Energy",
    effectPercent: -18.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Renewable Energy", effectPercent: -18.0 }]),
    notes: "Grid connectivity failure stalls revenue for wind and solar companies"
  },

  // =========================================================================
  // 10. METALS & MINING (SAAIL, NMDCX)
  // =========================================================================
  {
    headline: "Government launches mega national highway, bullet train, and airport construction drive; demand for steel and iron ore skyrockets.",
    sector: "Metals & Mining",
    effectPercent: 22.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Metals & Mining", effectPercent: 22.0 }]),
    notes: "National mega infrastructure building spree consumes enormous amounts of steel and iron ore"
  },
  {
    headline: "Foreign countries dump cheap imported steel into India at rock-bottom prices; domestic steel and iron ore demand collapses.",
    sector: "Metals & Mining",
    effectPercent: -18.0,
    difficulty: "EASY",
    stockEffects: JSON.stringify([{ sector: "Metals & Mining", effectPercent: -18.0 }]),
    notes: "Foreign cheap steel dumping undercuts domestic steelmakers and iron ore miners"
  },

  // =========================================================================
  // MULTI-SECTOR MACRO EVENTS (INTUITIVE CROSS-IMPACTS)
  // =========================================================================
  // 11. War/Oil Shock: Crude Oil (+) vs Automobile (-)
  {
    headline: "Middle East conflict blocks global oil tanker routes; petrol and diesel fuel prices jump 25% while consumers stop buying cars.",
    sector: "Energy (Oil & Gas)",
    effectPercent: 18.0,
    difficulty: "MEDIUM",
    stockEffects: JSON.stringify([
      { sector: "Energy (Oil & Gas)", effectPercent: 20.0 },
      { sector: "Automobile", effectPercent: -14.0 }
    ]),
    notes: "Fuel price spike boosts oil companies but discourages people from buying new cars"
  },

  // 12. Railway Infrastructure Boom: Renewable Energy (+) & Metals & Mining (+)
  {
    headline: "Indian Railways approves 100% green solar tracks across the nation, placing mega orders for wind/solar setups and industrial steel tracks.",
    sector: "Renewable Energy",
    effectPercent: 18.0,
    difficulty: "MEDIUM",
    stockEffects: JSON.stringify([
      { sector: "Renewable Energy", effectPercent: 18.0 },
      { sector: "Metals & Mining", effectPercent: 18.0 }
    ]),
    notes: "Green railway expansion simultaneously lifts renewable energy and metal manufacturers"
  },

  // 13. Low Home Loans: Banking (+) & Real Estate (+)
  {
    headline: "Banks slash home loan interest rates to historic lows; middle-class families rush to buy residential apartments.",
    sector: "Banking",
    effectPercent: 16.0,
    difficulty: "MEDIUM",
    stockEffects: JSON.stringify([
      { sector: "Banking", effectPercent: 15.0 },
      { sector: "Real Estate", effectPercent: 18.0 }
    ]),
    notes: "Super cheap home loan rates increase bank loan books and drive massive apartment sales"
  },

  // 14. Military Cybersecurity: Defence & Aerospace (+) & IT (+)
  {
    headline: "Ministry of Defence launches cyber warfare protection division, signing top-secret contracts for military radars, aircraft, and cyber software.",
    sector: "Defence & Aerospace",
    effectPercent: 20.0,
    difficulty: "MEDIUM",
    stockEffects: JSON.stringify([
      { sector: "Defence & Aerospace", effectPercent: 20.0 },
      { sector: "IT", effectPercent: 15.0 }
    ]),
    notes: "Military cyber upgrade awards contracts to defence equipment makers and IT software giants"
  },

  // 15. Car Boom Driving Steel: Automobile (+) & Metals & Mining (+)
  {
    headline: "Automakers ramp up vehicle factory production by 35% to meet massive buyer waiting lists, placing huge bulk orders for domestic steel.",
    sector: "Automobile",
    effectPercent: 16.0,
    difficulty: "MEDIUM",
    stockEffects: JSON.stringify([
      { sector: "Automobile", effectPercent: 16.0 },
      { sector: "Metals & Mining", effectPercent: 15.0 }
    ]),
    notes: "Surging car manufacturing directly drives up industrial steel demand"
  },

  // 16. High Property Taxes: Real Estate (-) & Banking (-)
  {
    headline: "Government doubles property purchase taxes across all major cities; flat sales freeze and bank home loan applications dry up.",
    sector: "Real Estate",
    effectPercent: -15.0,
    difficulty: "MEDIUM",
    stockEffects: JSON.stringify([
      { sector: "Real Estate", effectPercent: -16.0 },
      { sector: "Banking", effectPercent: -12.0 }
    ]),
    notes: "Heavy property taxes freeze apartment purchases and drop mortgage loan demand"
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
    console.error("Error seeding news templates:", err.message);
  }
}

module.exports = {
  ALL_NEWS_TEMPLATES,
  ensureNewsTemplatesSeeded
};
