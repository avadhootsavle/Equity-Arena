const prisma = require('../prisma');

// ALL_NEWS_TEMPLATES — 40 carefully crafted news events
// Each template uses ACTUAL stock symbols from the database:
// IDW (Defence), BPTE (Oil & Gas), HTM (Automobile), NITI (Technology),
// RTB (Banking), MRI (Real Estate), SANP (Pharmaceuticals),
// BWT/ZTEL (Telecom), SGE/NVPW (Renewable Energy), KMIN/SGM (Mining/Metals),
// ABAL (Aviation), ANAG (Agriculture), BRM (Retail), GSL (Shipping),
// OMEX (Exports), SPTI (Textiles), SWST (Media/Entertainment)

const ALL_NEWS_TEMPLATES = [
  // 1. Defence
  {
    "headline": "Border tensions escalate; government places urgent emergency orders for fighter jets, missiles, and radar defence systems.",
    "sector": "Defense",
    "effectPercent": 25,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"IDW\",\"effectPercent\":25},{\"symbol\":\"BPTE\",\"effectPercent\":8}]",
    "notes": "Emergency defence orders boost IDW; fuel demand rises for BPTE"
  },
  {
    "headline": "Foreign governments award multi-billion dollar export contract for Indian-built defence equipment and radar systems.",
    "sector": "Defense",
    "effectPercent": 22,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"IDW\",\"effectPercent\":22},{\"symbol\":\"HTM\",\"effectPercent\":6}]",
    "notes": "Export contracts expand IDW revenue; military vehicle demand ripples into HTM"
  },
  {
    "headline": "International peace treaty signed; government cuts military defence budget by 40% and freezes all new weapon tenders.",
    "sector": "Defense",
    "effectPercent": -20,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"IDW\",\"effectPercent\":-20},{\"symbol\":\"BPTE\",\"effectPercent\":-6}]",
    "notes": "Peace deal collapses defence orders for IDW; fuel demand drops for BPTE"
  },
  {
    "headline": "Ministry of Defence postpones major weapons upgrade programme by two years; procurement contracts frozen.",
    "sector": "Defense",
    "effectPercent": -16,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"IDW\",\"effectPercent\":-16}]",
    "notes": "Procurement freeze halts defence revenue growth for IDW"
  },

  // 2. Oil & Gas + Automobile Interlinked
  {
    "headline": "War shuts down major Middle East pipelines; global crude oil prices spike above $120 per barrel.",
    "sector": "Oil & Gas",
    "effectPercent": 24,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"BPTE\",\"effectPercent\":24},{\"symbol\":\"HTM\",\"effectPercent\":-10},{\"symbol\":\"ANAG\",\"effectPercent\":-8}]",
    "notes": "Oil price spike boosts BPTE; higher fuel costs hurt HTM auto sales and ANAG farm logistics"
  },
  {
    "headline": "Geologists discover massive offshore crude oil and natural gas fields; domestic energy production expected to double.",
    "sector": "Oil & Gas",
    "effectPercent": 20,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"BPTE\",\"effectPercent\":22},{\"symbol\":\"GSL\",\"effectPercent\":10}]",
    "notes": "Big domestic oil discovery lifts BPTE; more tanker shipments boost GSL"
  },
  {
    "headline": "Global crude oil surplus floods international markets; petrol prices crash 35% overnight.",
    "sector": "Oil & Gas",
    "effectPercent": -20,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"BPTE\",\"effectPercent\":-20},{\"symbol\":\"HTM\",\"effectPercent\":10},{\"symbol\":\"ABAL\",\"effectPercent\":12}]",
    "notes": "Oil price crash hurts BPTE earnings; cheaper fuel boosts car demand (HTM) and airline costs drop (ABAL)"
  },
  {
    "headline": "Government imposes surprise windfall profit tax on all crude oil exploration and petroleum exports.",
    "sector": "Oil & Gas",
    "effectPercent": -17,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"BPTE\",\"effectPercent\":-17},{\"symbol\":\"GSL\",\"effectPercent\":-6}]",
    "notes": "Windfall tax cuts BPTE net revenue; petroleum shipping via GSL also hit"
  },

  // 3. Automobile + Retail Interlinked
  {
    "headline": "Festive season sees record-breaking demand; millions of Indians buy new cars, SUVs, and commercial trucks.",
    "sector": "Automobile",
    "effectPercent": 22,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"HTM\",\"effectPercent\":22},{\"symbol\":\"BRM\",\"effectPercent\":14},{\"symbol\":\"RTB\",\"effectPercent\":8}]",
    "notes": "Festive car rush drives HTM sales; auto accessories boost BRM; more auto loans go through RTB"
  },
  {
    "headline": "Government gives massive subsidies for electric vehicles; buyers rush to buy electric cars and buses.",
    "sector": "Automobile",
    "effectPercent": 20,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"HTM\",\"effectPercent\":20},{\"symbol\":\"NVPW\",\"effectPercent\":14},{\"symbol\":\"SGE\",\"effectPercent\":12}]",
    "notes": "EV subsidies lift HTM; charging stations boost renewable power demand for NVPW and SGE"
  },
  {
    "headline": "Severe computer chip shortage shuts down vehicle assembly factories; car deliveries delayed by 6 months.",
    "sector": "Automobile",
    "effectPercent": -18,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"HTM\",\"effectPercent\":-18},{\"symbol\":\"BRM\",\"effectPercent\":-8}]",
    "notes": "Factory shutdowns stop vehicle sales for HTM; auto accessories also fall at BRM"
  },
  {
    "headline": "Steel prices surge 40%; automakers forced to hike car prices, causing consumer bookings to drop sharply.",
    "sector": "Automobile",
    "effectPercent": -16,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"HTM\",\"effectPercent\":-16},{\"symbol\":\"KMIN\",\"effectPercent\":14},{\"symbol\":\"SGM\",\"effectPercent\":12}]",
    "notes": "Higher steel prices hurt HTM margins while boosting mining stocks KMIN and SGM"
  },

  // 4. Technology / IT
  {
    "headline": "Global enterprise software boom: major American and European banks sign multi-billion dollar tech deals with Indian IT companies.",
    "sector": "Technology",
    "effectPercent": 22,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"NITI\",\"effectPercent\":22},{\"symbol\":\"RTB\",\"effectPercent\":6}]",
    "notes": "Large overseas IT contracts lift NITI; digital banking integration boosts RTB"
  },
  {
    "headline": "Fortune 500 companies migrate entire global IT systems to Indian cloud providers; software backlogs hit record high.",
    "sector": "Technology",
    "effectPercent": 18,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"NITI\",\"effectPercent\":19},{\"symbol\":\"SWST\",\"effectPercent\":8}]",
    "notes": "Cloud migration contracts grow NITI multi-year revenue; digital media demand boosts SWST"
  },
  {
    "headline": "US and Europe enter severe recession; global companies freeze all software spending and cancel IT contracts.",
    "sector": "Technology",
    "effectPercent": -19,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"NITI\",\"effectPercent\":-19},{\"symbol\":\"OMEX\",\"effectPercent\":-10}]",
    "notes": "US recession freezes IT budgets for NITI; export demand for OMEX also drops"
  },
  {
    "headline": "Foreign governments impose strict work visa curbs and heavy taxes on Indian offshore software engineers.",
    "sector": "Technology",
    "effectPercent": -16,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"NITI\",\"effectPercent\":-16}]",
    "notes": "Visa restrictions increase delivery costs and slow billing for NITI"
  },

  // 5. Banking + Real Estate Interlinked
  {
    "headline": "Reserve Bank of India cuts interest rates sharply; borrowing becomes cheap and home loan applications double.",
    "sector": "Banking/Finance",
    "effectPercent": 20,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"RTB\",\"effectPercent\":20},{\"symbol\":\"MRI\",\"effectPercent\":16},{\"symbol\":\"SPTI\",\"effectPercent\":6}]",
    "notes": "Rate cut fuels bank lending (RTB) and housing demand (MRI); cheaper credit helps textile businesses (SPTI)"
  },
  {
    "headline": "Indian corporate sector reports record quarterly profits; commercial bank deposits and business credit reach all-time highs.",
    "sector": "Banking/Finance",
    "effectPercent": 17,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"RTB\",\"effectPercent\":17},{\"symbol\":\"BRM\",\"effectPercent\":10}]",
    "notes": "Strong business profits expand bank revenues (RTB) and fuel consumer spending (BRM)"
  },
  {
    "headline": "RBI warns of rising loan defaults; enforces heavy penalties and strict restrictions on commercial bank lending.",
    "sector": "Banking/Finance",
    "effectPercent": -18,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"RTB\",\"effectPercent\":-18},{\"symbol\":\"MRI\",\"effectPercent\":-10}]",
    "notes": "Lending restrictions hit bank profits (RTB); housing project financing slows (MRI)"
  },
  {
    "headline": "RBI unexpectedly hikes Cash Reserve Ratio; banks forced to lock billions in zero-interest reserves.",
    "sector": "Banking/Finance",
    "effectPercent": -15,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"RTB\",\"effectPercent\":-15},{\"symbol\":\"OMEX\",\"effectPercent\":-8}]",
    "notes": "Tighter liquidity compresses lending margins (RTB); trade finance costs rise for exporters (OMEX)"
  },

  // 6. Pharmaceuticals
  {
    "headline": "New global flu virus outbreak detected; hospitals worldwide place massive orders for Indian medicines and antibiotics.",
    "sector": "Pharmaceuticals",
    "effectPercent": 24,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"SANP\",\"effectPercent\":24},{\"symbol\":\"GSL\",\"effectPercent\":10}]",
    "notes": "Global virus scare triggers huge medicine demand for SANP; cargo shipments boost GSL"
  },
  {
    "headline": "US FDA approves Indian generic cancer and respiratory medicines with zero manufacturing objections.",
    "sector": "Pharmaceuticals",
    "effectPercent": 19,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"SANP\",\"effectPercent\":20},{\"symbol\":\"OMEX\",\"effectPercent\":8}]",
    "notes": "Clean FDA approval unlocks lucrative US export sales for SANP; export volumes grow for OMEX"
  },
  {
    "headline": "Health Ministry imposes strict government price caps on all essential drugs, cutting maximum retail prices.",
    "sector": "Pharmaceuticals",
    "effectPercent": -18,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"SANP\",\"effectPercent\":-18}]",
    "notes": "Drug price caps directly reduce SANP profit margins"
  },
  {
    "headline": "US regulators issue import ban warnings on Indian pharma factories following quality inspection failures.",
    "sector": "Pharmaceuticals",
    "effectPercent": -16,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"SANP\",\"effectPercent\":-16},{\"symbol\":\"OMEX\",\"effectPercent\":-10}]",
    "notes": "Regulatory bans freeze medicine exports for SANP; export business for OMEX also hit"
  },

  // 7. Telecommunications
  {
    "headline": "Mobile 5G internet usage hits all-time high; telecom companies hike monthly recharge rates by 20%.",
    "sector": "Telecom",
    "effectPercent": 20,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"BWT\",\"effectPercent\":20},{\"symbol\":\"ZTEL\",\"effectPercent\":22},{\"symbol\":\"SWST\",\"effectPercent\":8}]",
    "notes": "Higher data tariffs boost BWT and ZTEL revenues; streaming content demand lifts SWST"
  },
  {
    "headline": "Telecom regulator waives spectrum license fees and announces massive rural mobile network expansion grants.",
    "sector": "Telecom",
    "effectPercent": 18,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"BWT\",\"effectPercent\":17},{\"symbol\":\"ZTEL\",\"effectPercent\":20}]",
    "notes": "Spectrum fee relief directly improves cash flows for BWT and ZTEL"
  },
  {
    "headline": "Major undersea internet cables get severed; widespread mobile internet blackout hits Indian cities.",
    "sector": "Telecom",
    "effectPercent": -18,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"BWT\",\"effectPercent\":-18},{\"symbol\":\"ZTEL\",\"effectPercent\":-22},{\"symbol\":\"SWST\",\"effectPercent\":-10}]",
    "notes": "Network blackout disrupts operations for BWT and ZTEL; streaming stops for SWST"
  },
  {
    "headline": "Supreme Court demands immediate payment of billions in overdue government licensing dues from telecom carriers.",
    "sector": "Telecom",
    "effectPercent": -16,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"BWT\",\"effectPercent\":-15},{\"symbol\":\"ZTEL\",\"effectPercent\":-20}]",
    "notes": "Heavy government penalty payouts severely strain balance sheets for BWT and ZTEL"
  },

  // 8. Real Estate + Mining Interlinked
  {
    "headline": "Homebuyers flood property markets in Mumbai and Delhi; luxury apartments sell out within 24 hours of launch.",
    "sector": "Real Estate",
    "effectPercent": 22,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"MRI\",\"effectPercent\":22},{\"symbol\":\"KMIN\",\"effectPercent\":10},{\"symbol\":\"RTB\",\"effectPercent\":8}]",
    "notes": "Housing boom drives record sales for MRI; building material mining demand rises (KMIN); home loans grow (RTB)"
  },
  {
    "headline": "Multinational companies sign record office lease deals in Bengaluru and Gurugram tech parks.",
    "sector": "Real Estate",
    "effectPercent": 18,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"MRI\",\"effectPercent\":19},{\"symbol\":\"NITI\",\"effectPercent\":6}]",
    "notes": "Commercial office leasing boom drives MRI valuations; tech companies in those parks (NITI) also benefit"
  },
  {
    "headline": "Government hikes property stamp duty and cement costs soar; apartment buyers postpone purchases.",
    "sector": "Real Estate",
    "effectPercent": -18,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"MRI\",\"effectPercent\":-18},{\"symbol\":\"RTB\",\"effectPercent\":-8}]",
    "notes": "Higher property taxes freeze housing bookings (MRI) and reduce home loan demand (RTB)"
  },
  {
    "headline": "National tribunal halts residential township construction in major cities due to groundwater concerns.",
    "sector": "Real Estate",
    "effectPercent": -15,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"MRI\",\"effectPercent\":-15},{\"symbol\":\"GSL\",\"effectPercent\":-6}]",
    "notes": "Construction stay orders delay project deliveries for MRI; building material shipping falls for GSL"
  },

  // 9. Renewable Energy
  {
    "headline": "Government announces massive ₹50,000 crore subsidy package for solar parks and wind turbine electricity projects.",
    "sector": "Renewable Energy",
    "effectPercent": 26,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"SGE\",\"effectPercent\":26},{\"symbol\":\"NVPW\",\"effectPercent\":28},{\"symbol\":\"HTM\",\"effectPercent\":8}]",
    "notes": "Green energy subsidies trigger massive rally for SGE and NVPW; electric vehicle demand helps HTM"
  },
  {
    "headline": "State electricity boards sign 25-year guaranteed clean power purchase contracts with wind and solar producers.",
    "sector": "Renewable Energy",
    "effectPercent": 20,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"SGE\",\"effectPercent\":20},{\"symbol\":\"NVPW\",\"effectPercent\":22}]",
    "notes": "Long-term power purchase tariffs secure future revenues for SGE and NVPW"
  },
  {
    "headline": "Electricity grid fails to connect new green power plants; solar and wind developers face severe payment delays.",
    "sector": "Renewable Energy",
    "effectPercent": -20,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"SGE\",\"effectPercent\":-20},{\"symbol\":\"NVPW\",\"effectPercent\":-22},{\"symbol\":\"BPTE\",\"effectPercent\":8}]",
    "notes": "Grid failures stall green energy revenue (SGE, NVPW); fossil fuel demand rises helping BPTE"
  },
  {
    "headline": "Heavy import duties on solar panels imposed; renewable energy project costs skyrocket across India.",
    "sector": "Renewable Energy",
    "effectPercent": -16,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"SGE\",\"effectPercent\":-16},{\"symbol\":\"NVPW\",\"effectPercent\":-18},{\"symbol\":\"BPTE\",\"effectPercent\":6}]",
    "notes": "Higher equipment costs squeeze clean energy margins (SGE, NVPW); traditional energy BPTE gains"
  },

  // 10. Mining / Metals / Agriculture Multi-Sector
  {
    "headline": "Government launches mega highway, bullet train, and airport construction drive; demand for minerals and metals skyrockets.",
    "sector": "Mining",
    "effectPercent": 24,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"KMIN\",\"effectPercent\":24},{\"symbol\":\"SGM\",\"effectPercent\":22},{\"symbol\":\"GSL\",\"effectPercent\":10}]",
    "notes": "National infrastructure consumes minerals (KMIN), precious metals (SGM), and boosts material shipping (GSL)"
  },
  {
    "headline": "International gold prices hit all-time high; investors globally rush to buy gold and precious metal funds.",
    "sector": "Precious Metals",
    "effectPercent": 22,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"SGM\",\"effectPercent\":24},{\"symbol\":\"KMIN\",\"effectPercent\":14}]",
    "notes": "Gold rush directly lifts Suvarna Gold Mining (SGM); related mineral mines (KMIN) also benefit"
  },
  {
    "headline": "Foreign countries dump cheap imported steel and metals into India; domestic mineral demand collapses.",
    "sector": "Mining",
    "effectPercent": -20,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"KMIN\",\"effectPercent\":-20},{\"symbol\":\"SGM\",\"effectPercent\":-15},{\"symbol\":\"SPTI\",\"effectPercent\":-8}]",
    "notes": "Metal dumping undercuts domestic miners (KMIN, SGM); textile input costs also impacted (SPTI)"
  },
  {
    "headline": "Good monsoon season boosts farm output; agriculture exports hit record high and food prices stabilise across India.",
    "sector": "Agriculture",
    "effectPercent": 20,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"ANAG\",\"effectPercent\":22},{\"symbol\":\"GSL\",\"effectPercent\":10},{\"symbol\":\"OMEX\",\"effectPercent\":14}]",
    "notes": "Bumper harvest lifts Annapurna Agro (ANAG); more cargo shipments boost GSL; agri exports rise for OMEX"
  },
  {
    "headline": "Severe drought destroys crops across major farming states; food prices spike and rural consumer spending collapses.",
    "sector": "Agriculture",
    "effectPercent": -20,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"ANAG\",\"effectPercent\":-22},{\"symbol\":\"BRM\",\"effectPercent\":-10},{\"symbol\":\"OMEX\",\"effectPercent\":-12}]",
    "notes": "Drought devastates ANAG earnings; rural retail spending falls (BRM); agri export volumes drop (OMEX)"
  }
];

async function ensureNewsTemplatesSeeded() {
  try {
    // Delete all existing templates and re-seed with correct symbols
    const existingCount = await prisma.newsTemplate.count();
    if (existingCount > 0) {
      // Check if existing templates have old symbols (HAAL, BEEL, RELI, etc.)
      const oldTemplate = await prisma.newsTemplate.findFirst({
        where: {
          OR: [
            { stockEffects: { contains: '"HAAL"' } },
            { stockEffects: { contains: '"RELI"' } },
            { stockEffects: { contains: '"SURY"' } },
            { stockEffects: { contains: '"TATV"' } },
            { stockEffects: { contains: '"HDFB"' } },
            { stockEffects: { contains: '"DLEF"' } },
            { stockEffects: { contains: '"SUZL"' } },
            { stockEffects: { contains: '"NMDC"' } },
            { stockEffects: { contains: '"SAAL"' } },
            { stockEffects: { contains: '"TCX"' } },
            { stockEffects: { contains: '"AIRT"' } },
          ]
        }
      });

      if (oldTemplate) {
        console.log('⚠️  Old stock symbol templates detected — clearing and re-seeding with correct symbols...');
        await prisma.newsTemplate.deleteMany({});
        console.log('✅ Old templates cleared.');
      }
    }

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
