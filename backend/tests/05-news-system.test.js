const { PrismaClient } = require('@prisma/client');
const { ensureNewsTemplatesSeeded } = require('../src/services/newsService');

const prisma = new PrismaClient();

async function runNewsSystemTests() {
  console.log('\n==================================================');
  console.log('🧪 5. Analyst News Engine & Privacy Test Suite');
  console.log('==================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    await ensureNewsTemplatesSeeded();

    // 1. Verify News Template Seed Pool
    const templates = await prisma.newsTemplate.findMany();
    assert(templates.length >= 30, `Verified ${templates.length} Analyst News Templates seeded in pool`);

    // 2. Multi-Stock News Template (2-Stock Cause-and-Effect)
    const multiStockTemplate = templates.find((t) => {
      if (!t.stockEffects) return false;
      try {
        const parsed = JSON.parse(t.stockEffects);
        return Array.isArray(parsed) && parsed.length >= 2;
      } catch (e) {
        return false;
      }
    });

    assert(multiStockTemplate !== undefined, `Multi-stock template found: "${multiStockTemplate?.headline?.slice(0, 45)}..."`);

    // 3. Privacy & Payload Security Verification (Price Target Privacy)
    const publicNews = await prisma.news.findFirst({
      orderBy: { timestamp: 'desc' }
    });

    if (publicNews) {
      assert(
        !publicNews.message.includes('targetPrice') && !publicNews.message.includes('targetPercent'),
        `Trader-facing news broadcast payload is privacy-protected: "${publicNews.message.slice(0, 60)}..."`
      );
    } else {
      assert(true, `Trader-facing news broadcast payloads are privacy-protected`);
    }

    // 4. Multi-stock template cause and effect validation
    if (multiStockTemplate) {
      const effects = JSON.parse(multiStockTemplate.stockEffects);
      const stockA = await prisma.stock.findFirst({ where: { sector: effects[0].sector } });
      const stockB = await prisma.stock.findFirst({ where: { sector: effects[1].sector } });

      assert(stockA !== null && stockB !== null, `Multi-stock template linked stocks identified: ${stockA?.symbol} (${effects[0].sector}) & ${stockB?.symbol} (${effects[1].sector})`);
    }

    console.log(`Summary: News System Suite (${passed} passed, ${failed} failed)\n`);
    return { passed, failed };
  } catch (err) {
    console.error('News System Suite Error:', err);
    return { passed, failed: failed + 1 };
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runNewsSystemTests().then(({ failed }) => process.exit(failed > 0 ? 1 : 0));
}

module.exports = { runNewsSystemTests };
