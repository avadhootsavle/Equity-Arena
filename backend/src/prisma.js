const { PrismaClient } = require('@prisma/client');

// Global singleton instance of PrismaClient
// Prevents connection pool starvation under high concurrent trade loads
let prisma;

if (!global.__equity_arena_prisma__) {
  global.__equity_arena_prisma__ = new PrismaClient({
    log: ['error']
  });
}
prisma = global.__equity_arena_prisma__;

module.exports = prisma;
