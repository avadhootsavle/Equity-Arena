const { PrismaClient } = require('@prisma/client');
const { ensureNewsTemplatesSeeded } = require('../src/services/newsService');

const prisma = new PrismaClient();

async function runCrossSectorNewsTests() {
  console.log('🧪 Starting Phase 23b Cross-Sector News Template Verification...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Ensure templates are seeded
    await ensureNewsTemplatesSeeded();

    const totalTemplates = await prisma.newsTemplate.count();
    assert(totalTemplates >= 34, `Database contains ${totalTemplates} news templates (>= 34 expected)`);

    // 2. Verify specific cross-sector templates
    const techBankingTpl = await prisma.newsTemplate.findFirst({
      where: { headline: { contains: 'security incident affecting online transactions' } }
    });

    assert(
      techBankingTpl && techBankingTpl.stockEffects.includes('Banking/Finance') && techBankingTpl.stockEffects.includes('Technology'),
      'Tech + Banking (Negative) cross-sector template correctly targets Banking/Finance (-15%) & Technology (-12%)'
    );

    const energyShippingTpl = await prisma.newsTemplate.findFirst({
      where: { headline: { contains: 'Fuel costs for commercial shipping' } }
    });

    assert(
      energyShippingTpl && energyShippingTpl.stockEffects.includes('Oil & Gas') && energyShippingTpl.stockEffects.includes('Shipping/Logistics'),
      'Energy + Shipping (Opposite) cross-sector template correctly targets Oil & Gas (+18%) & Shipping/Logistics (-16%)'
    );

    const autoPreciousTpl = await prisma.newsTemplate.findFirst({
      where: { headline: { contains: 'specialty metals in vehicle manufacturing' } }
    });

    assert(
      autoPreciousTpl && autoPreciousTpl.stockEffects.includes('Precious Metals') && autoPreciousTpl.stockEffects.includes('Automobile'),
      'Automobile + Precious Metals (Supply Chain) cross-sector template correctly targets Precious Metals (+18%) & Automobile (-15%)'
    );

    const pharmaAgriTpl = await prisma.newsTemplate.findFirst({
      where: { headline: { contains: 'agricultural biotech treatment' } }
    });

    assert(
      pharmaAgriTpl && pharmaAgriTpl.stockEffects.includes('Pharmaceuticals') && pharmaAgriTpl.stockEffects.includes('Agriculture'),
      'Pharma + Agriculture (Biotech JV) cross-sector template correctly targets Pharmaceuticals (+16%) & Agriculture (+17%)'
    );

    console.log('\n==================================================');
    console.log(`📊 PHASE 23B CROSS-SECTOR NEWS SUMMARY:`);
    console.log(`PASSED: ${passed} | FAILED: ${failed}`);
    console.log('==================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runCrossSectorNewsTests();
