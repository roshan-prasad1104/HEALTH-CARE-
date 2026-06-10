const app = require('./app');
const prisma = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Attempt database check
    console.log('[DB] Checking Prisma connection...');
    await prisma.$connect();
    global.dbActive = true;
    console.log('[DB] Database connection established successfully.');
  } catch (error) {
    global.dbActive = false;
    console.error('[DB Warn] Database connection could not be pre-established. The API service will run, but database features will fall back to in-memory mocks.', error.message);
  }

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`   Prescrypto API Server Running            `);
    console.log(`   URL: http://localhost:${PORT}                    `);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`====================================================`);
  });
}

startServer();
