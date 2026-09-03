const prisma = require('../prisma');

const ALL_NEWS_TEMPLATES = [
  {
    "headline": "Border tensions escalate between India and neighboring countries; government orders urgent emergency military fighter jet and radar missile production.",
    "sector": "Defence & Aerospace",
    "effectPercent": 25,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Defence & Aerospace\",\"effectPercent\":25}]",
    "notes": "War and military tensions directly trigger massive rush in defence manufacturing orders"
  },
  {
    "headline": "Foreign air forces place massive multi-billion export orders for Indian-made combat aircraft, attack helicopters, and naval radar systems.",
    "sector": "Defence & Aerospace",
    "effectPercent": 22,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Defence & Aerospace\",\"effectPercent\":22}]",
    "notes": "International military export orders significantly expand defence backlogs"
  },
  {
    "headline": "International peace treaty signed and border conflicts end permanently; government slashes next year’s military defense budget by 40%.",
    "sector": "Defence & Aerospace",
    "effectPercent": -20,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Defence & Aerospace\",\"effectPercent\":-20}]",
    "notes": "Peace accords and defence budget cuts drop military contractor demand"
  },
  {
    "headline": "Ministry of Defence postpones major weapons modernisation program by two years; military procurement tenders frozen.",
    "sector": "Defence & Aerospace",
    "effectPercent": -16,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Defence & Aerospace\",\"effectPercent\":-16}]",
    "notes": "Procurement freeze temporarily halts defence revenue growth"
  },
  {
    "headline": "War in Middle East and Russia shuts down major global oil pipelines; international crude oil price spikes above $120 per barrel.",
    "sector": "Energy (Oil & Gas)",
    "effectPercent": 24,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Energy (Oil & Gas)\",\"effectPercent\":24}]",
    "notes": "War oil pipeline disruptions spike crude oil prices, booming oil exploration and refinery profits"
  },
  {
    "headline": "Geologists discover massive domestic offshore natural gas and crude oil reserves; production capacity expected to double.",
    "sector": "Energy (Oil & Gas)",
    "effectPercent": 20,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Energy (Oil & Gas)\",\"effectPercent\":20}]",
    "notes": "Huge domestic energy discovery increases asset valuation and margins"
  },
  {
    "headline": "Huge global crude oil surplus floods the market; international oil and petrol prices crash by 35% overnight.",
    "sector": "Energy (Oil & Gas)",
    "effectPercent": -20,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Energy (Oil & Gas)\",\"effectPercent\":-20}]",
    "notes": "Crude oil price crash directly cuts profits of oil exploration and refinery companies"
  },
  {
    "headline": "Government imposes surprise heavy windfall profit tax on all crude oil exploration and petroleum exports.",
    "sector": "Energy (Oil & Gas)",
    "effectPercent": -17,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Energy (Oil & Gas)\",\"effectPercent\":-17}]",
    "notes": "Windfall taxes sharply reduce net revenues of domestic energy producers"
  },
  {
    "headline": "Diwali and festive holiday season sees record-breaking demand; millions of Indians buy new cars, SUVs, and commercial trucks.",
    "sector": "Automobile",
    "effectPercent": 22,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Automobile\",\"effectPercent\":22}]",
    "notes": "Festive shopping rush causes historic vehicle sales boom"
  },
  {
    "headline": "Government greenlights massive national subsidies for electric vehicles (EVs); buyers rush to purchase newly launched electric SUVs and buses.",
    "sector": "Automobile",
    "effectPercent": 19,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Automobile\",\"effectPercent\":19}]",
    "notes": "EV subsidies and consumer incentives accelerate automaker booking velocity"
  },
  {
    "headline": "Severe global computer microchip shortage shuts down vehicle manufacturing factories; car and SUV deliveries delayed by 6 months.",
    "sector": "Automobile",
    "effectPercent": -18,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Automobile\",\"effectPercent\":-18}]",
    "notes": "Microchip shortages halt assembly lines and stop vehicle sales"
  },
  {
    "headline": "Steel and rubber raw material prices surge 40%; automakers forced to hike showroom prices, causing car bookings to collapse.",
    "sector": "Automobile",
    "effectPercent": -16,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Automobile\",\"effectPercent\":-16}]",
    "notes": "High vehicle prices scare away consumer buyers"
  },
  {
    "headline": "Global Artificial Intelligence (AI) boom explodes; top American and European banks sign multi-billion dollar software deals with Indian tech companies.",
    "sector": "IT",
    "effectPercent": 22,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"IT\",\"effectPercent\":22}]",
    "notes": "Global AI software spending boom directly lifts Indian IT giants"
  },
  {
    "headline": "Fortune 500 companies migrate entire corporate infrastructure to Indian cloud IT service providers; multi-year tech backlogs surge.",
    "sector": "IT",
    "effectPercent": 18,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"IT\",\"effectPercent\":18}]",
    "notes": "Massive cloud contracts fuel multi-year IT billing growth"
  },
  {
    "headline": "US and Europe enter severe economic recession; global corporations freeze all software spending and cancel IT consulting contracts.",
    "sector": "IT",
    "effectPercent": -19,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"IT\",\"effectPercent\":-19}]",
    "notes": "US recession freezes corporate IT spending budgets"
  },
  {
    "headline": "Foreign governments impose strict work visa curbs and heavy offshore taxes on Indian software consulting engineers.",
    "sector": "IT",
    "effectPercent": -16,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"IT\",\"effectPercent\":-16}]",
    "notes": "Visa restrictions increase project delivery costs and slow billing"
  },
  {
    "headline": "Reserve Bank of India (RBI) cuts interest rates sharply; borrowing becomes super cheap and loan demand from citizens doubles.",
    "sector": "Banking",
    "effectPercent": 20,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Banking\",\"effectPercent\":20}]",
    "notes": "Cheap interest rates spark huge surge in bank loans and mortgages"
  },
  {
    "headline": "Indian corporate sector reports record quarterly business earnings; commercial bank deposit inflows and business loans reach all-time highs.",
    "sector": "Banking",
    "effectPercent": 17,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Banking\",\"effectPercent\":17}]",
    "notes": "Strong corporate expansion boosts commercial credit growth"
  },
  {
    "headline": "Reserve Bank of India (RBI) warns of rising unpaid loans; enforces heavy penalties and strict restrictions on commercial bank lending.",
    "sector": "Banking",
    "effectPercent": -18,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Banking\",\"effectPercent\":-18}]",
    "notes": "Lending restrictions and bad loan defaults hit banking profits"
  },
  {
    "headline": "RBI unexpectedly increases Cash Reserve Ratio (CRR); commercial banks forced to lock away billions in zero-interest cash reserves.",
    "sector": "Banking",
    "effectPercent": -15,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Banking\",\"effectPercent\":-15}]",
    "notes": "Tighter liquidity compresses bank lending margins"
  },
  {
    "headline": "New global flu virus outbreak detected; hospitals worldwide place massive bulk orders for Indian medicines and antibiotic treatments.",
    "sector": "Pharmaceuticals",
    "effectPercent": 24,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Pharmaceuticals\",\"effectPercent\":24}]",
    "notes": "Global virus outbreak triggers huge worldwide demand for pharmaceutical drugs"
  },
  {
    "headline": "US FDA approves Indian generic cancer and diabetes medicines with zero manufacturing inspection objections.",
    "sector": "Pharmaceuticals",
    "effectPercent": 19,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Pharmaceuticals\",\"effectPercent\":19}]",
    "notes": "Clean US FDA approval unlocks lucrative export sales"
  },
  {
    "headline": "Health Ministry imposes strict government price control on all essential drugs and medicines, capping maximum retail prices.",
    "sector": "Pharmaceuticals",
    "effectPercent": -18,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Pharmaceuticals\",\"effectPercent\":-18}]",
    "notes": "Strict medicine price caps reduce pharma profit margins"
  },
  {
    "headline": "US regulators issue import ban warnings on Indian pharmaceutical manufacturing plants following quality inspection audits.",
    "sector": "Pharmaceuticals",
    "effectPercent": -16,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Pharmaceuticals\",\"effectPercent\":-16}]",
    "notes": "Regulatory import bans freeze international drug shipments"
  },
  {
    "headline": "Internet video streaming and mobile online gaming usage hits all-time high across India; telecom monthly mobile recharge rates rise.",
    "sector": "Telecommunications",
    "effectPercent": 20,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Telecommunications\",\"effectPercent\":20}]",
    "notes": "Heavy mobile data usage and higher recharge prices boost telecom revenues"
  },
  {
    "headline": "Telecom regulator waives annual spectrum license fees and announces massive rural 5G expansion grants for mobile operators.",
    "sector": "Telecommunications",
    "effectPercent": 18,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Telecommunications\",\"effectPercent\":18}]",
    "notes": "Spectrum fee relief directly improves telecom cash flows"
  },
  {
    "headline": "Major undersea fiber-optic internet cables get severed in the ocean; widespread mobile internet blackout across Indian cities.",
    "sector": "Telecommunications",
    "effectPercent": -18,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Telecommunications\",\"effectPercent\":-18}]",
    "notes": "Severe network breakdown and blackout hurt telecom operators"
  },
  {
    "headline": "Supreme Court demands immediate payment of billions in overdue statutory government licensing dues from telecom carriers.",
    "sector": "Telecommunications",
    "effectPercent": -16,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Telecommunications\",\"effectPercent\":-16}]",
    "notes": "Heavy government penalty payouts severely strain telecom balance sheets"
  },
  {
    "headline": "Homebuyers flood property market in Mumbai and Delhi; luxury residential apartments and flats sell out within 24 hours of launch.",
    "sector": "Real Estate",
    "effectPercent": 22,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Real Estate\",\"effectPercent\":22}]",
    "notes": "Massive residential housing boom drives record sales for real estate builders"
  },
  {
    "headline": "Global multinational corporations sign record office lease agreements in major tech parks across Bengaluru, Hyderabad, and Gurugram.",
    "sector": "Real Estate",
    "effectPercent": 18,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Real Estate\",\"effectPercent\":18}]",
    "notes": "Commercial office park leasing boom elevates commercial builder valuations"
  },
  {
    "headline": "Government hikes property registration stamp duty and cement costs soar; apartment buyers postpone new home purchases.",
    "sector": "Real Estate",
    "effectPercent": -18,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Real Estate\",\"effectPercent\":-18}]",
    "notes": "Higher taxes and building costs freeze new housing bookings"
  },
  {
    "headline": "National environmental tribunal halts residential township construction in major metro cities due to groundwater concerns.",
    "sector": "Real Estate",
    "effectPercent": -15,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Real Estate\",\"effectPercent\":-15}]",
    "notes": "Construction stay orders delay project deliveries and cash collections"
  },
  {
    "headline": "Government announces ₹50,000 Crore mega subsidy package for green solar parks and giant wind turbine electricity projects.",
    "sector": "Renewable Energy",
    "effectPercent": 26,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Renewable Energy\",\"effectPercent\":26}]",
    "notes": "Mega government green subsidies trigger massive rally in renewable energy"
  },
  {
    "headline": "State electricity boards sign 25-year guaranteed clean energy purchase agreements at lucrative fixed tariffs with wind and solar producers.",
    "sector": "Renewable Energy",
    "effectPercent": 20,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Renewable Energy\",\"effectPercent\":20}]",
    "notes": "Guaranteed long-term power purchase tariffs secure future revenues"
  },
  {
    "headline": "National electricity grid fails to connect newly built green power plants; wind and solar project developers face severe payment delays.",
    "sector": "Renewable Energy",
    "effectPercent": -20,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Renewable Energy\",\"effectPercent\":-20}]",
    "notes": "Grid connectivity failure stalls revenue for wind and solar companies"
  },
  {
    "headline": "Heavy imported solar panel customs duties imposed; green electricity project installation costs skyrocket across the country.",
    "sector": "Renewable Energy",
    "effectPercent": -16,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Renewable Energy\",\"effectPercent\":-16}]",
    "notes": "Higher equipment costs squeeze clean energy developer project profits"
  },
  {
    "headline": "Government launches mega national highway, bullet train, and airport construction drive; demand for steel and iron ore skyrockets.",
    "sector": "Metals & Mining",
    "effectPercent": 24,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Metals & Mining\",\"effectPercent\":24}]",
    "notes": "National mega infrastructure building spree consumes enormous amounts of steel and iron ore"
  },
  {
    "headline": "International steel and iron ore benchmark prices jump 25% due to major supply bottlenecks in global iron ore mines.",
    "sector": "Metals & Mining",
    "effectPercent": 19,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Metals & Mining\",\"effectPercent\":19}]",
    "notes": "Global price rally lifts domestic steel and mineral profit margins"
  },
  {
    "headline": "Foreign countries dump cheap imported steel into India at rock-bottom prices; domestic steel and iron ore demand collapses.",
    "sector": "Metals & Mining",
    "effectPercent": -20,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Metals & Mining\",\"effectPercent\":-20}]",
    "notes": "Foreign cheap steel dumping undercuts domestic steelmakers and iron ore miners"
  },
  {
    "headline": "Ministry of Mines slaps heavy royalty export taxes on raw iron ore shipments and enforces strict coal mining production limits.",
    "sector": "Metals & Mining",
    "effectPercent": -17,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Metals & Mining\",\"effectPercent\":-17}]",
    "notes": "Mining taxes and environmental restrictions reduce mineral output profits"
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
