/**
 * PRE-FIX AUDIT FINDINGS SUMMARY
 * ------------------------------
 * 1. Auth Module: Managed under src/modules/auth/. Handles login & registration. Token generation currently occurs inside the register controller which we must remove.
 * 2. Misinformation Module: Under src/modules/misinformation/. Uses scanClaimText / scanClaimScreenshot which delegates to analyzeWhatsappForward in aiService.js.
 * 3. AI Module (Rx Decoder): Managed in src/modules/ai/aiService.js. Will be updated to use pdf-parse and correct APIs.
 * 4. Health Module (Lab Analyzer): Managed in src/modules/health/healthController.js.
 * 5. Mock / Hardcoded Fallbacks: Identified in mockAuth.js (test users), ocrService.js (pre-seeded fallback results matching file size hash), and aiService.js (fallback lab ranges).
 * 6. Form API Endpoints: Frontend submits register form to /api/auth/register, login to /api/auth/login, forgot password to /api/auth/forgot-password, scans to corresponding sub-routes.
 * 7. JWT Generation: Handled in authController.js using jwt.sign and JWT_SECRET from middleware/auth.
 * 8. AI Integration: Uses gemini-1.5-flash with @google/generative-ai SDK or REST endpoint with AQ. Cloud key.
 * 9. Environment Variables: Stored in backend/.env (PORT, NODE_ENV, DATABASE_URL, JWT_SECRET, GEMINI_API_KEY, FDA_API_KEY).
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const authRoutes = require('./modules/auth/authRoutes');
const misinformationRoutes = require('./modules/misinformation/misinformationRoutes');
const healthRoutes = require('./modules/health/healthRoutes');

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Allow connections from frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Lazy database connection initialization for serverless / Vercel environment
app.use(async (req, res, next) => {
  if (global.dbActive === undefined) {
    const prisma = require('./config/db');
    try {
      console.log('[DB] Checking Prisma connection lazily...');
      await prisma.$connect();
      global.dbActive = true;
      console.log('[DB] Database connection established lazily.');
    } catch (error) {
      global.dbActive = false;
      console.error('[DB Warn] Database connection could not be established lazily. Falling back to mocks.', error.message);
    }
  }
  next();
});

// Serve static uploads folder (if needed for persistent links)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/misinformation', misinformationRoutes);
app.use('/api/health', healthRoutes);

// Healthcheck endpoint
app.get('/api/healthcheck', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date(),
    service: 'Prescrypto API Service'
  });
});

// Diagnostics endpoint
app.get('/api/diagnostics', async (req, res) => {
  const diagnosticResults = {
    database: { status: 'unknown', error: null },
    gemini: { status: 'unknown', error: null, keyType: 'none' },
    fda: { status: 'unknown', error: null }
  };

  // Test Database Connection
  try {
    const prisma = require('./config/db');
    await prisma.$queryRaw`SELECT 1`;
    diagnosticResults.database.status = 'connected';
  } catch (err) {
    diagnosticResults.database.status = 'failed';
    diagnosticResults.database.error = err.message;
  }

  // Test Gemini API Key
  try {
    const { generateAIResponse } = require('./config/gemini');
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (apiKey.startsWith('AIza')) {
      diagnosticResults.gemini.keyType = 'AIza (Standard)';
    } else if (apiKey.startsWith('AQ.')) {
      diagnosticResults.gemini.keyType = 'AQ (Pro/Cloud)';
    } else {
      diagnosticResults.gemini.keyType = 'None/Mock';
    }

    const start = Date.now();
    const response = await generateAIResponse('Return "Success" in JSON format.', 'System test', true);
    diagnosticResults.gemini.status = 'success';
    diagnosticResults.gemini.latencyMs = Date.now() - start;
    diagnosticResults.gemini.responseSample = response.substring(0, 100);
  } catch (err) {
    diagnosticResults.gemini.status = 'failed';
    diagnosticResults.gemini.error = err.message;
  }

  // Test FDA API Key
  try {
    const https = require('https');
    const fdaApiKey = process.env.FDA_API_KEY || '';
    const fdaUrl = `https://api.fda.gov/drug/label.json?api_key=${fdaApiKey}&search=openfda.brand_name:"aspirin"&limit=1`;
    const fdaStart = Date.now();
    
    diagnosticResults.fda = await new Promise((resolve) => {
      https.get(fdaUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve({ status: 'success', latencyMs: Date.now() - fdaStart });
          } else {
            resolve({ status: 'failed', statusCode: res.statusCode, error: `FDA returned status ${res.statusCode}` });
          }
        });
      }).on('error', (err) => {
        resolve({ status: 'failed', error: err.message });
      });
    });
  } catch (err) {
    diagnosticResults.fda = { status: 'failed', error: err.message };
  }

  res.status(200).json(diagnosticResults);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Global Error Middleware]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;
