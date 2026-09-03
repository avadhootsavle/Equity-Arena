const prisma = require('../prisma');

const ALL_NEWS_TEMPLATES = [
  // 1. Defence & Aerospace (Affects HAAL, BEEL, and Metal suppliers SAAL)
  {
    "headline": "Border tensions escalate; government orders urgent emergency military fighter jets and missile radar defense systems.",
    "sector": "Defence & Aerospace",
    "effectPercent": 25,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"HAAL\",\"effectPercent\":25},{\"symbol\":\"BEEL\",\"effectPercent\":22},{\"symbol\":\"SAAL\",\"effectPercent\":10}]",
    "notes": "Emergency defense orders boost military aircraft (HAAL), radar electronics (BEEL), and industrial steel (SAAL)"
  },
  {
    "headline": "Foreign air forces award multi-billion dollar export contract for Indian fighter aircraft and naval radar equipment.",
    "sector": "Defence & Aerospace",
    "effectPercent": 22,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"HAAL\",\"effectPercent\":22},{\"symbol\":\"BEEL\",\"effectPercent\":20}]",
    "notes": "International export contracts expand revenue for HAAL and BEEL"
  },
  {
    "headline": "International peace treaty signed; government cuts military defense budget by 40% and halts new weapon tenders.",
    "sector": "Defence & Aerospace",
    "effectPercent": -20,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"HAAL\",\"effectPercent\":-20},{\"symbol\":\"BEEL\",\"effectPercent\":-18}]",
    "notes": "Peace accords and defense budget cuts drop orders for HAAL and BEEL"
  },
  {
    "headline": "Ministry of Defence postpones major weapons modernisation program by two years; procurement contracts frozen.",
    "sector": "Defence & Aerospace",
    "effectPercent": -16,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"HAAL\",\"effectPercent\":-16},{\"symbol\":\"BEEL\",\"effectPercent\":-15}]",
    "notes": "Procurement freeze temporarily halts defense revenue growth for HAAL and BEEL"
  },

  // 2. Energy (Oil & Gas) + Automobile Interlinked
  {
    "headline": "War in Middle East and Russia shuts down major pipelines; global crude oil prices spike above $120/barrel.",
    "sector": "Energy (Oil & Gas)",
    "effectPercent": 24,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"RELI\",\"effectPercent\":24},{\"symbol\":\"ONGC\",\"effectPercent\":22},{\"symbol\":\"TATV\",\"effectPercent\":-12}]",
    "notes": "High crude oil prices boom oil producers (RELI, ONGC) while fuel inflation hurts car buyers (TATV)"
  },
  {
    "headline": "Geologists discover massive offshore crude oil and natural gas fields; domestic production capacity expected to double.",
    "sector": "Energy (Oil & Gas)",
    "effectPercent": 20,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"ONGC\",\"effectPercent\":22},{\"symbol\":\"RELI\",\"effectPercent\":18}]",
    "notes": "Huge domestic energy discovery increases asset valuation for ONGC and RELI"
  },
  {
    "headline": "Global crude oil surplus floods international market; crude petrol prices crash by 35% overnight.",
    "sector": "Energy (Oil & Gas)",
    "effectPercent": -20,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"RELI\",\"effectPercent\":-20},{\"symbol\":\"ONGC\",\"effectPercent\":-22},{\"symbol\":\"TATV\",\"effectPercent\":10}]",
    "notes": "Oil price crash cuts exploration profits (ONGC, RELI) while cheaper fuel boosts automobile demand (TATV)"
  },
  {
    "headline": "Government imposes surprise windfall profit tax on all crude oil exploration and petroleum exports.",
    "sector": "Energy (Oil & Gas)",
    "effectPercent": -17,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"RELI\",\"effectPercent\":-17},{\"symbol\":\"ONGC\",\"effectPercent\":-18}]",
    "notes": "Windfall taxes sharply reduce net revenues of domestic energy producers RELI and ONGC"
  },

  // 3. Automobile + Metals & Mining Interlinked
  {
    "headline": "Diwali holiday festival sees record-breaking demand; millions of Indians buy new cars, SUVs, and commercial trucks.",
    "sector": "Automobile",
    "effectPercent": 22,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"TATV\",\"effectPercent\":22},{\"symbol\":\"M&M\",\"effectPercent\":24},{\"symbol\":\"HDFB\",\"effectPercent\":10}]",
    "notes": "Festive car shopping boom drives automaker sales (TATV, M&M) and retail auto loans (HDFB)"
  },
  {
    "headline": "Government greenlights massive national subsidies for electric vehicles (EVs); buyers rush to purchase electric SUVs and buses.",
    "sector": "Automobile",
    "effectPercent": 20,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"TATV\",\"effectPercent\":22},{\"symbol\":\"M&M\",\"effectPercent\":20}]",
    "notes": "EV subsidies accelerate bookings for top electric automakers TATV and M&M"
  },
  {
    "headline": "Severe computer microchip shortage shuts down vehicle assembly factories; car and SUV deliveries delayed by 6 months.",
    "sector": "Automobile",
    "effectPercent": -18,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"TATV\",\"effectPercent\":-18},{\"symbol\":\"M&M\",\"effectPercent\":-17}]",
    "notes": "Microchip shortages halt assembly lines and stop vehicle sales for TATV and M&M"
  },
  {
    "headline": "Steel raw material prices surge 40%; automakers forced to hike vehicle prices, causing consumer car bookings to drop.",
    "sector": "Automobile",
    "effectPercent": -16,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"TATV\",\"effectPercent\":-16},{\"symbol\":\"M&M\",\"effectPercent\":-15},{\"symbol\":\"SAAL\",\"effectPercent\":14}]",
    "notes": "Higher steel prices hurt automaker margins (TATV, M&M) while boosting steelmakers (SAAL)"
  },

  // 4. IT (Information Technology)
  {
    "headline": "Global enterprise software boom explodes; top American and European banks sign multi-billion dollar tech deals with Indian IT giants.",
    "sector": "IT",
    "effectPercent": 22,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"TCX\",\"effectPercent\":22},{\"symbol\":\"INFS\",\"effectPercent\":20}]",
    "notes": "Global enterprise software contracts directly lift TCX and INFS"
  },
  {
    "headline": "Fortune 500 companies migrate entire global IT infrastructure to Indian cloud service providers; software backlogs hit record high.",
    "sector": "IT",
    "effectPercent": 18,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"TCX\",\"effectPercent\":18},{\"symbol\":\"INFS\",\"effectPercent\":19}]",
    "notes": "Massive cloud contracts fuel multi-year revenue growth for TCX and INFS"
  },
  {
    "headline": "US and Europe enter severe economic recession; global corporations freeze all software spending and cancel IT consulting contracts.",
    "sector": "IT",
    "effectPercent": -19,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"TCX\",\"effectPercent\":-19},{\"symbol\":\"INFS\",\"effectPercent\":-18}]",
    "notes": "US recession freezes corporate IT spending budgets, cutting TCX and INFS revenues"
  },
  {
    "headline": "Foreign governments impose strict work visa curbs and heavy offshore project taxes on Indian software engineers.",
    "sector": "IT",
    "effectPercent": -16,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"TCX\",\"effectPercent\":-16},{\"symbol\":\"INFS\",\"effectPercent\":-15}]",
    "notes": "Visa restrictions increase project delivery costs and slow billing for TCX and INFS"
  },

  // 5. Banking + Real Estate Interlinked
  {
    "headline": "Reserve Bank of India (RBI) cuts interest rates sharply; borrowing becomes super cheap and home loan applications double.",
    "sector": "Banking",
    "effectPercent": 20,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"HDFB\",\"effectPercent\":20},{\"symbol\":\"ICCO\",\"effectPercent\":19},{\"symbol\":\"DLEF\",\"effectPercent\":15},{\"symbol\":\"GODR\",\"effectPercent\":15}]",
    "notes": "Rate cuts spark surge in banking loans (HDFB, ICCO) and fuel housing boom for builders (DLEF, GODR)"
  },
  {
    "headline": "Indian corporate sector reports record quarterly profits; commercial bank deposit inflows and business credit reach all-time highs.",
    "sector": "Banking",
    "effectPercent": 17,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"HDFB\",\"effectPercent\":17},{\"symbol\":\"ICCO\",\"effectPercent\":18}]",
    "notes": "Strong corporate business expansion boosts commercial credit for HDFB and ICCO"
  },
  {
    "headline": "RBI warns of rising unpaid loan defaults; enforces heavy penalties and strict restrictions on commercial bank lending.",
    "sector": "Banking",
    "effectPercent": -18,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"HDFB\",\"effectPercent\":-18},{\"symbol\":\"ICCO\",\"effectPercent\":-19}]",
    "notes": "Lending restrictions and loan default provisions hit banking profits for HDFB and ICCO"
  },
  {
    "headline": "RBI unexpectedly hikes Cash Reserve Ratio (CRR); commercial banks forced to lock away billions in zero-interest cash reserves.",
    "sector": "Banking",
    "effectPercent": -15,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"HDFB\",\"effectPercent\":-15},{\"symbol\":\"ICCO\",\"effectPercent\":-16}]",
    "notes": "Tighter liquidity compresses lending margins for HDFB and ICCO"
  },

  // 6. Pharmaceuticals
  {
    "headline": "New global flu virus outbreak detected; hospitals worldwide place massive bulk orders for Indian medicines and antibiotic treatments.",
    "sector": "Pharmaceuticals",
    "effectPercent": 24,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"SURY\",\"effectPercent\":24},{\"symbol\":\"CPLX\",\"effectPercent\":22}]",
    "notes": "Global virus outbreak triggers huge worldwide demand for medicines from SURY and CPLX"
  },
  {
    "headline": "US FDA approves Indian generic cancer and respiratory medicines with zero manufacturing inspection objections.",
    "sector": "Pharmaceuticals",
    "effectPercent": 19,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"SURY\",\"effectPercent\":18},{\"symbol\":\"CPLX\",\"effectPercent\":20}]",
    "notes": "Clean US FDA approval unlocks lucrative export sales for SURY and CPLX"
  },
  {
    "headline": "Health Ministry imposes strict government price caps on all essential drugs and medicines, reducing maximum retail prices.",
    "sector": "Pharmaceuticals",
    "effectPercent": -18,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"SURY\",\"effectPercent\":-18},{\"symbol\":\"CPLX\",\"effectPercent\":-17}]",
    "notes": "Strict retail medicine price caps reduce profit margins for SURY and CPLX"
  },
  {
    "headline": "US regulators issue import ban warnings on Indian pharmaceutical factories following quality inspection audits.",
    "sector": "Pharmaceuticals",
    "effectPercent": -16,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"SURY\",\"effectPercent\":-16},{\"symbol\":\"CPLX\",\"effectPercent\":-15}]",
    "notes": "Regulatory import bans freeze international medicine shipments for SURY and CPLX"
  },

  // 7. Telecommunications
  {
    "headline": "Mobile 5G internet streaming and online video usage hits all-time high; telecom monthly mobile recharge rates rise 20%.",
    "sector": "Telecommunications",
    "effectPercent": 20,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"AIRT\",\"effectPercent\":20},{\"symbol\":\"IDEA\",\"effectPercent\":25}]",
    "notes": "Higher data usage and mobile recharge tariffs boost telecom revenue for AIRT and IDEA"
  },
  {
    "headline": "Telecom regulator waives annual spectrum license fees and announces massive rural mobile network expansion grants.",
    "sector": "Telecommunications",
    "effectPercent": 18,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"AIRT\",\"effectPercent\":17},{\"symbol\":\"IDEA\",\"effectPercent\":24}]",
    "notes": "Spectrum fee relief directly improves cash flows for telecom operators AIRT and IDEA"
  },
  {
    "headline": "Major undersea fiber-optic internet cables get severed in the ocean; widespread mobile internet blackout across Indian cities.",
    "sector": "Telecommunications",
    "effectPercent": -18,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"AIRT\",\"effectPercent\":-18},{\"symbol\":\"IDEA\",\"effectPercent\":-22}]",
    "notes": "Severe network blackout disrupts telecom operations for AIRT and IDEA"
  },
  {
    "headline": "Supreme Court demands immediate payment of billions in overdue statutory government licensing dues from mobile telecom carriers.",
    "sector": "Telecommunications",
    "effectPercent": -16,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"AIRT\",\"effectPercent\":-15},{\"symbol\":\"IDEA\",\"effectPercent\":-24}]",
    "notes": "Heavy government penalty payouts severely strain telecom balance sheets for AIRT and IDEA"
  },

  // 8. Real Estate + Metals & Mining Interlinked
  {
    "headline": "Homebuyers flood property market in Mumbai and Delhi; luxury residential apartments sell out within 24 hours of launch.",
    "sector": "Real Estate",
    "effectPercent": 22,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"DLEF\",\"effectPercent\":22},{\"symbol\":\"GODR\",\"effectPercent\":20},{\"symbol\":\"SAAL\",\"effectPercent\":10}]",
    "notes": "Residential housing boom drives record sales for builders (DLEF, GODR) and building steel (SAAL)"
  },
  {
    "headline": "Multinational companies sign record corporate office lease agreements in major tech parks across Bengaluru and Gurugram.",
    "sector": "Real Estate",
    "effectPercent": 18,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"DLEF\",\"effectPercent\":19},{\"symbol\":\"GODR\",\"effectPercent\":17}]",
    "notes": "Commercial office leasing boom elevates commercial builder valuations for DLEF and GODR"
  },
  {
    "headline": "Government hikes property registration stamp duty and cement costs soar; apartment buyers postpone new home purchases.",
    "sector": "Real Estate",
    "effectPercent": -18,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"DLEF\",\"effectPercent\":-18},{\"symbol\":\"GODR\",\"effectPercent\":-17}]",
    "notes": "Higher property taxes freeze new housing bookings for DLEF and GODR"
  },
  {
    "headline": "National environmental tribunal halts residential township construction in major metro cities due to groundwater concerns.",
    "sector": "Real Estate",
    "effectPercent": -15,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"DLEF\",\"effectPercent\":-15},{\"symbol\":\"GODR\",\"effectPercent\":-14}]",
    "notes": "Construction stay orders delay project deliveries for DLEF and GODR"
  },

  // 9. Renewable Energy
  {
    "headline": "Government announces ₹50,000 Crore mega subsidy package for green solar parks and giant wind turbine electricity projects.",
    "sector": "Renewable Energy",
    "effectPercent": 26,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"SUZL\",\"effectPercent\":26},{\"symbol\":\"IRED\",\"effectPercent\":28}]",
    "notes": "Mega green energy subsidies trigger massive rally for SUZL and IRED"
  },
  {
    "headline": "State electricity boards sign 25-year guaranteed clean power purchase contracts at fixed tariffs with wind and solar producers.",
    "sector": "Renewable Energy",
    "effectPercent": 20,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"SUZL\",\"effectPercent\":20},{\"symbol\":\"IRED\",\"effectPercent\":22}]",
    "notes": "Guaranteed long-term power purchase tariffs secure future revenues for SUZL and IRED"
  },
  {
    "headline": "National electricity grid fails to connect newly built green power plants; wind and solar developers face severe payment delays.",
    "sector": "Renewable Energy",
    "effectPercent": -20,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"SUZL\",\"effectPercent\":-20},{\"symbol\":\"IRED\",\"effectPercent\":-22}]",
    "notes": "Grid connectivity failure stalls revenue for green energy developers SUZL and IRED"
  },
  {
    "headline": "Heavy imported solar panel customs duties imposed; green electricity project installation costs skyrocket across the country.",
    "sector": "Renewable Energy",
    "effectPercent": -16,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"SUZL\",\"effectPercent\":-16},{\"symbol\":\"IRED\",\"effectPercent\":-18}]",
    "notes": "Higher equipment costs squeeze clean energy project margins for SUZL and IRED"
  },

  // 10. Metals & Mining
  {
    "headline": "Government launches mega national highway, bullet train, and airport construction drive; demand for steel and iron ore skyrockets.",
    "sector": "Metals & Mining",
    "effectPercent": 24,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"SAAL\",\"effectPercent\":24},{\"symbol\":\"NMDC\",\"effectPercent\":22}]",
    "notes": "National infrastructure construction consumes enormous amounts of steel (SAAL) and iron ore (NMDC)"
  },
  {
    "headline": "International steel and iron ore benchmark prices jump 25% due to major supply bottlenecks in global iron ore mines.",
    "sector": "Metals & Mining",
    "effectPercent": 19,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"SAAL\",\"effectPercent\":19},{\"symbol\":\"NMDC\",\"effectPercent\":20}]",
    "notes": "Global commodity rally lifts domestic steel (SAAL) and iron ore (NMDC) profit margins"
  },
  {
    "headline": "Foreign countries dump cheap imported steel into India at rock-bottom prices; domestic steel and iron ore demand collapses.",
    "sector": "Metals & Mining",
    "effectPercent": -20,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"SAAL\",\"effectPercent\":-20},{\"symbol\":\"NMDC\",\"effectPercent\":-18}]",
    "notes": "Foreign steel dumping undercuts domestic steelmakers (SAAL) and iron miners (NMDC)"
  },
  {
    "headline": "Ministry of Mines slaps heavy royalty export taxes on raw iron ore shipments and enforces strict mining production limits.",
    "sector": "Metals & Mining",
    "effectPercent": -17,
    "difficulty": "EASY",
    "stockEffects": "[{\"symbol\":\"NMDC\",\"effectPercent\":-18},{\"symbol\":\"SAAL\",\"effectPercent\":-15}]",
    "notes": "Mining taxes and environmental output caps reduce mineral profits for NMDC and SAAL"
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
