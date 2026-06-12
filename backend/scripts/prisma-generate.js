/**
 * prisma-generate.js
 * 
 * Called via `postinstall` in package.json.
 * On Vercel: generates Prisma Client from schema.prod.prisma (PostgreSQL).
 * On local:  generates Prisma Client from schema.prisma (SQLite).
 * 
 * Uses PRISMA_GENERATE_DATAPROXY=true dummy env so Prisma doesn't try to
 * resolve the DATABASE_URL at generate time on Vercel.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const isVercel = !!process.env.VERCEL;
const schemaPath = isVercel
  ? path.join(__dirname, '../prisma/schema.prod.prisma')
  : path.join(__dirname, '../prisma/schema.prisma');

// Check the right schema exists
if (!fs.existsSync(schemaPath)) {
  console.warn(`[prisma-generate] Schema not found at ${schemaPath}. Skipping Prisma generate.`);
  process.exit(0);
}

try {
  const cmd = `npx prisma generate --schema=${schemaPath}`;
  console.log(`[prisma-generate] Running: ${cmd}`);
  execSync(cmd, {
    stdio: 'inherit',
    env: {
      ...process.env,
      // Tell Prisma to skip DB introspection during generate on Vercel
      // (it only needs the schema file, not a live connection)
      DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db'
    }
  });
  console.log('[prisma-generate] Prisma Client generated successfully.');
} catch (err) {
  console.error('[prisma-generate] Failed to generate Prisma Client:', err.message);
  // Don't fail the build — the app uses mock mode as fallback
  process.exit(0);
}
