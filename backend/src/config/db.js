const { PrismaClient } = require('@prisma/client');

const globalForPrisma = globalThis;

// Only create a PrismaClient if DATABASE_URL is configured.
// On Vercel without a DB, this stays null and the app falls back to mock mode.
if (!globalForPrisma.prisma) {
  const dbUrl = process.env.DATABASE_URL;
  const isFileDb = !dbUrl || dbUrl.startsWith('file:');
  const isVercel = !!process.env.VERCEL;

  if (isVercel && isFileDb) {
    // On Vercel, SQLite file DBs don't work — skip Prisma initialisation entirely.
    // The app.js lazy-connect middleware will set global.dbActive = false
    // and all controllers will fall through to in-memory mock mode.
    globalForPrisma.prisma = null;
    console.log('[DB] Vercel detected with no PostgreSQL URL — running in mock mode.');
  } else {
    try {
      globalForPrisma.prisma = new PrismaClient({
        log: process.env.PRISMA_QUERY_LOG === 'true' ? ['query', 'warn', 'error'] : ['warn', 'error']
      });
    } catch (err) {
      globalForPrisma.prisma = null;
      console.error('[DB] PrismaClient instantiation failed — running in mock mode:', err.message);
    }
  }
}

module.exports = globalForPrisma.prisma;
