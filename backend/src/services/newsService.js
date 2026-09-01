const prisma = require('../prisma');

const ALL_NEWS_TEMPLATES = [
  {
    "headline": "RBI cuts interest rates by 25 basis points; banks expect huge rise in loan demand.",
    "sector": "Banking",
    "effectPercent": 15,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Banking\",\"effectPercent\":15}]",
    "notes": "Rate cut directly benefits HDFC Bank and ICICI Bank"
  },
  {
    "headline": "Banking regulator introduces stricter reserve norms; banks face margin pressure.",
    "sector": "Banking",
    "effectPercent": -14,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Banking\",\"effectPercent\":-14}]",
    "notes": "Margin contraction hits private banking lenders"
  },
  {
    "headline": "Major US tech firms sign billion-dollar artificial intelligence contracts with Indian IT leaders.",
    "sector": "IT",
    "effectPercent": 18,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"IT\",\"effectPercent\":18}]",
    "notes": "AI spending boom boosts TCS and Infosys revenues"
  },
  {
    "headline": "Global client IT budgets cut amid economic slowdown; project rollouts postponed.",
    "sector": "IT",
    "effectPercent": -15,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"IT\",\"effectPercent\":-15}]",
    "notes": "Weak enterprise tech demand impacts IT consulting firms"
  },
  {
    "headline": "Ministry of Defence signs major contracts for new fighter jets and advanced radar systems.",
    "sector": "Defence",
    "effectPercent": 22,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Defence\",\"effectPercent\":22}]",
    "notes": "Defence modernization powers order backlogs for HAL and BEL"
  },
  {
    "headline": "Parliament delays annual defence procurement budget approval pending parliamentary review.",
    "sector": "Defence",
    "effectPercent": -14,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Defence\",\"effectPercent\":-14}]",
    "notes": "Contract award delays temporarily slow defence revenue recognition"
  },
  {
    "headline": "US FDA approves key blockbuster generic medicines with zero inspection observations.",
    "sector": "Pharma",
    "effectPercent": 19,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Pharma\",\"effectPercent\":19}]",
    "notes": "Clean US FDA clearance opens major export markets for Sun Pharma and Cipla"
  },
  {
    "headline": "Global raw material prices for active pharma ingredients jump sharply overnight.",
    "sector": "Pharma",
    "effectPercent": -13,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Pharma\",\"effectPercent\":-13}]",
    "notes": "Input cost inflation squeezes pharmaceutical operating margins"
  },
  {
    "headline": "Telecom operators report massive surge in mobile data usage following nationwide 5G rollout.",
    "sector": "Telecom",
    "effectPercent": 17,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Telecom\",\"effectPercent\":17}]",
    "notes": "5G adoption and higher ARPU boost Bharti Airtel and Vodafone Idea"
  },
  {
    "headline": "Telecom regulator orders steep compensation cuts on call termination tariffs.",
    "sector": "Telecom",
    "effectPercent": -16,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Telecom\",\"effectPercent\":-16}]",
    "notes": "Tariff reductions lower cellular carrier operating revenue"
  },
  {
    "headline": "Festive season car and commercial vehicle bookings surge to all-time record highs.",
    "sector": "Automobile",
    "effectPercent": 18,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Automobile\",\"effectPercent\":18}]",
    "notes": "High vehicle delivery numbers boost Tata Motors and M&M"
  },
  {
    "headline": "Global supply chain snags cause severe semiconductor chip shortages for automakers.",
    "sector": "Automobile",
    "effectPercent": -15,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Automobile\",\"effectPercent\":-15}]",
    "notes": "Assembly line cutbacks delay vehicle deliveries"
  },
  {
    "headline": "Government discovers massive offshore oil and gas reserve; state energy production expands.",
    "sector": "Energy",
    "effectPercent": 18,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Energy\",\"effectPercent\":18}]",
    "notes": "New reserves and refining margins boost Reliance and ONGC"
  },
  {
    "headline": "Government slaps surprise windfall tax on domestic crude oil production and refining.",
    "sector": "Energy",
    "effectPercent": -16,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Energy\",\"effectPercent\":-16}]",
    "notes": "Export taxes and refining levies eat into oil & energy earnings"
  },
  {
    "headline": "Luxury housing registrations break 10-year records as mortgage demand skyrockets.",
    "sector": "Real Estate",
    "effectPercent": 18,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Real Estate\",\"effectPercent\":18}]",
    "notes": "Record pre-sales boost property developers DLF and Godrej Properties"
  },
  {
    "headline": "Cement and steel building material prices spike 15%, slowing major real estate projects.",
    "sector": "Real Estate",
    "effectPercent": -14,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Real Estate\",\"effectPercent\":-14}]",
    "notes": "Higher construction costs dampen property development profits"
  },
  {
    "headline": "Government announces 30% capital subsidy package for green wind and solar power projects.",
    "sector": "Renewable Energy",
    "effectPercent": 22,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Renewable Energy\",\"effectPercent\":22}]",
    "notes": "Clean energy push accelerates orders for Suzlon and financing for IREDA"
  },
  {
    "headline": "Grid connection delays and transmission bottlenecks temporarily halt green energy projects.",
    "sector": "Renewable Energy",
    "effectPercent": -16,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Renewable Energy\",\"effectPercent\":-16}]",
    "notes": "Grid delays hold up revenue realization for renewable developers"
  },
  {
    "headline": "Global infrastructure building boom triggers major shortage of steel and industrial iron ore.",
    "sector": "Metals",
    "effectPercent": 20,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Metals\",\"effectPercent\":20}]",
    "notes": "Heavy metal demand drives price surge for SAIL and NMDC"
  },
  {
    "headline": "Imported cheap metal dumping floods domestic market, pushing steel and ore prices down.",
    "sector": "Metals",
    "effectPercent": -16,
    "difficulty": "EASY",
    "stockEffects": "[{\"sector\":\"Metals\",\"effectPercent\":-16}]",
    "notes": "Price undercutting forces margin pressure on domestic metal producers"
  },
  {
    "headline": "Home loan interest rates drop to multi-year lows, sparking massive surge in new apartment bookings.",
    "sector": "Banking",
    "effectPercent": 16,
    "difficulty": "MEDIUM",
    "stockEffects": "[{\"sector\":\"Banking\",\"effectPercent\":15},{\"sector\":\"Real Estate\",\"effectPercent\":18}]",
    "notes": "Lower mortgage rates fuel both bank lending and real estate property sales"
  },
  {
    "headline": "Nationwide high-speed electric railway and solar grid expansion drives huge demand for industrial steel.",
    "sector": "Renewable Energy",
    "effectPercent": 17,
    "difficulty": "MEDIUM",
    "stockEffects": "[{\"sector\":\"Renewable Energy\",\"effectPercent\":18},{\"sector\":\"Metals\",\"effectPercent\":16}]",
    "notes": "Green energy transit infrastructure boosts renewable energy and steel manufacturers"
  },
  {
    "headline": "Automakers report 25% jump in SUV manufacturing, ordering massive quantities of domestic steel.",
    "sector": "Automobile",
    "effectPercent": 15,
    "difficulty": "MEDIUM",
    "stockEffects": "[{\"sector\":\"Automobile\",\"effectPercent\":16},{\"sector\":\"Metals\",\"effectPercent\":14}]",
    "notes": "Booming car assembly directly drives metal supplier purchase orders"
  },
  {
    "headline": "Cloud computing adoption across India hits 80%, driving record bandwidth and enterprise tech contracts.",
    "sector": "IT",
    "effectPercent": 16,
    "difficulty": "MEDIUM",
    "stockEffects": "[{\"sector\":\"IT\",\"effectPercent\":17},{\"sector\":\"Telecom\",\"effectPercent\":15}]",
    "notes": "Cloud rollout lifts both IT systems providers and telecom data networks"
  },
  {
    "headline": "Global crude oil prices jump 12% following tanker delays, raising petrol and diesel pump costs.",
    "sector": "Energy",
    "effectPercent": 18,
    "difficulty": "MEDIUM",
    "stockEffects": "[{\"sector\":\"Energy\",\"effectPercent\":18},{\"sector\":\"Automobile\",\"effectPercent\":-12}]",
    "notes": "Oil companies benefit from higher crude while vehicle buyer sentiment cools"
  },
  {
    "headline": "Armed forces award major military cyber-defence and electronic radar contract to domestic consortium.",
    "sector": "Defence",
    "effectPercent": 20,
    "difficulty": "MEDIUM",
    "stockEffects": "[{\"sector\":\"Defence\",\"effectPercent\":20},{\"sector\":\"IT\",\"effectPercent\":14}]",
    "notes": "High-tech defence contracts boost aerospace manufacturers and IT software integrators"
  },
  {
    "headline": "Property registration tax hike implemented across top metro cities, cooling buyer inquiries.",
    "sector": "Real Estate",
    "effectPercent": -14,
    "difficulty": "MEDIUM",
    "stockEffects": "[{\"sector\":\"Real Estate\",\"effectPercent\":-15},{\"sector\":\"Banking\",\"effectPercent\":-10}]",
    "notes": "Real estate slowdown reduces property sales and dampens mortgage loan volumes"
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
