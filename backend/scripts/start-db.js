const { execSync } = require('child_process');
const path = require('path');

async function startDB() {
  console.log('🚀 Initializing Embedded PostgreSQL server...');
  const EmbeddedPostgresModule = await import('embedded-postgres');
  const EmbeddedPostgres = EmbeddedPostgresModule.default || EmbeddedPostgresModule.EmbeddedPostgres;

  const pg = new EmbeddedPostgres({
    databaseDir: path.join(__dirname, '../.pgdata'),
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    persistent: true
  });

  try {
    await pg.initialise();
    console.log('✅ PostgreSQL initialised.');
  } catch (err) {
    console.log('ℹ️ Already initialised or skipped:', err?.message || err);
  }

  try {
    await pg.start();
    console.log('✅ PostgreSQL is running on port 5432!');
  } catch (err) {
    console.log('ℹ️ Postgres start status:', err?.message || err);
  }

  // Ensure stockgame database exists
  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
    });
    await client.connect();
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'stockgame'");
    if (res.rowCount === 0) {
      await client.query('CREATE DATABASE stockgame');
      console.log('✅ Database "stockgame" created.');
    } else {
      console.log('ℹ️ Database "stockgame" already exists.');
    }
    await client.end();
  } catch (err) {
    console.error('Error ensuring stockgame database:', err?.message || err);
  }

  // Automatically run prisma db push and db seed
  try {
    console.log('🌱 Synchronizing Prisma database schema & seeding 15 stocks...');
    execSync('npx prisma db push', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    execSync('npx prisma db seed', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    console.log('🎉 Database push and seed completed successfully!');
  } catch (err) {
    console.error('Error pushing schema/seed:', err?.message || err);
  }
}

startDB();
