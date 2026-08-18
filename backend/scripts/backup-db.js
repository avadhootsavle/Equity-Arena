const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

require('dotenv').config({ path: path.join(__dirname, '../.env') });
const prisma = new PrismaClient();

async function runDatabaseBackup() {
  console.log('\n======================================================================');
  console.log('💾 EQUITY ARENA — LOCAL DATABASE BACKUP UTILITY');
  console.log('======================================================================');

  try {
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `equity_arena_backup_${timestamp}.json`;
    const backupFilePath = path.join(backupDir, backupFileName);

    console.log(`[Backup] Fetching database state...`);

    const users = await prisma.user.findMany();
    const stocks = await prisma.stock.findMany();
    const holdings = await prisma.holding.findMany();
    const transactions = await prisma.transaction.findMany();
    const orders = await prisma.order.findMany();
    const sessions = await prisma.session.findMany();
    const news = await prisma.news.findMany();
    const auditLogs = await prisma.adminAuditLog.findMany();

    const backupData = {
      metadata: {
        timestamp: new Date(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'local',
        databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')
      },
      counts: {
        users: users.length,
        stocks: stocks.length,
        holdings: holdings.length,
        transactions: transactions.length,
        orders: orders.length,
        sessions: sessions.length,
        news: news.length,
        auditLogs: auditLogs.length
      },
      data: {
        users,
        stocks,
        holdings,
        transactions,
        orders,
        sessions,
        news,
        auditLogs
      }
    };

    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');

    console.log(`✅ Backup successfully saved to: ${backupFilePath}`);
    console.log(`📊 Summary:`);
    console.log(`   - Users:        ${users.length}`);
    console.log(`   - Stocks:       ${stocks.length}`);
    console.log(`   - Holdings:     ${holdings.length}`);
    console.log(`   - Transactions: ${transactions.length}`);
    console.log(`   - Orders:       ${orders.length}`);
    console.log(`   - Sessions:     ${sessions.length}`);
    console.log('======================================================================\n');

    return backupFilePath;
  } catch (err) {
    console.error('❌ Database Backup Error:', err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runDatabaseBackup().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { runDatabaseBackup };
