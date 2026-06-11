const fs = require('fs');
const path = require('path');
const { performOcr } = require('../ocr/ocrService');
const { analyzeWhatsappForward } = require('../ai/aiService');
const prisma = require('../../config/db');

async function scanClaimText(req, res) {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text input is required' });
    }

    const analysis = await analyzeWhatsappForward(text);

    // Normalize citations — simulation returns verifiedClaims, live Gemini may return citations
    if (!analysis.citations && analysis.verifiedClaims) {
      analysis.citations = analysis.verifiedClaims.map(vc => ({
        source: vc.sourceName || vc.source,
        url: vc.sourceUrl || vc.url,
        text: vc.claimText || vc.text
      }));
    }

    // Save claim report to database
    let savedMyth = null;
    try {
      savedMyth = await prisma.myth.create({
        data: {
          forwardText: text,
          originalClaim: analysis.originalClaim,
          classification: analysis.classification,
          confidenceScore: analysis.confidenceScore,
          fearScore: analysis.fearScore,
          isDangerous: analysis.isDangerous,
          correctionText: analysis.correctionText,
          verifiedClaims: JSON.stringify((analysis.citations || []).map(cit => ({
            claimText: cit.text || cit.claimText,
            sourceName: cit.source,
            sourceUrl: cit.url,
          })))
        }
      });
    } catch (dbError) {
      console.warn('Could not save myth analysis to database (likely offline/mock run):', dbError.message);
    }

    res.status(200).json({
      message: 'Analysis completed successfully',
      analysis: {
        ...analysis,
        id: savedMyth ? savedMyth.id : 'temp-id'
      }
    });

  } catch (error) {
    console.error('Scan text analysis error:', error);
    res.status(500).json({ error: 'Internal server error analyzing claim' });
  }
}

async function scanClaimScreenshot(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Screenshot image file is required' });
    }

    const filePath = req.file.path;

    // 1. Run OCR
    const ocrResult = await performOcr(filePath, 'myth');

    // 2. Delete temporary file
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Failed to clean up uploaded file:', err.message);
    }

    if (!ocrResult.text || ocrResult.text.trim().length < 5) {
      return res.status(422).json({
        error: 'OCR failed to extract readable text. Please ensure the screenshot is clear and contains readable text.',
        confidence: ocrResult.confidence
      });
    }

    // 3. Run AI analysis on extracted text
    const analysis = await analyzeWhatsappForward(ocrResult.text);

    // Normalize citations — simulation returns verifiedClaims, live Gemini may return citations
    if (!analysis.citations && analysis.verifiedClaims) {
      analysis.citations = analysis.verifiedClaims.map(vc => ({
        source: vc.sourceName || vc.source,
        url: vc.sourceUrl || vc.url,
        text: vc.claimText || vc.text
      }));
    }

    // 4. Save to database
    let savedMyth = null;
    try {
      savedMyth = await prisma.myth.create({
        data: {
          forwardText: ocrResult.text,
          originalClaim: analysis.originalClaim,
          classification: analysis.classification,
          confidenceScore: analysis.confidenceScore,
          fearScore: analysis.fearScore,
          isDangerous: analysis.isDangerous,
          correctionText: analysis.correctionText,
          verifiedClaims: JSON.stringify((analysis.citations || []).map(cit => ({
            claimText: cit.text || cit.claimText,
            sourceName: cit.source,
            sourceUrl: cit.url,
          })))
        }
      });
    } catch (dbError) {
      console.warn('Could not save screenshot myth analysis to database:', dbError.message);
    }

    res.status(200).json({
      message: 'Screenshot parsed and analyzed successfully',
      extractedText: ocrResult.text,
      ocrConfidence: ocrResult.confidence,
      ocrSource: ocrResult.source,
      analysis: {
        ...analysis,
        id: savedMyth ? savedMyth.id : 'temp-id'
      }
    });

  } catch (error) {
    console.error('Screenshot scan analysis error:', error);
    res.status(500).json({ error: 'Internal server error parsing screenshot' });
  }
}

async function listRecentMyths(req, res) {
  try {
    if (global.dbActive === false) {
      throw new Error('Database connection is inactive');
    }
    const myths = await prisma.myth.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    res.status(200).json({ myths });
  } catch (error) {
    console.error('Failed to list myths, using seed fallback', error.message);
    // Return standard mock dataset if DB isn't responding
    res.status(200).json({
      myths: [
        {
          id: 'mock-myth-1',
          forwardText: 'Drinking hot boiled ginger and garlic water completely cures COVID-19 within 24 hours!',
          originalClaim: 'Boiled garlic water is a cure for COVID-19',
          classification: 'False & Dangerous',
          confidenceScore: 98.5,
          fearScore: 45.0,
          isDangerous: true,
          correctionText: 'There is no scientific evidence to support the claim that boiling ginger or garlic water can cure COVID-19.',
          verifiedClaims: [
            { sourceName: 'WHO (World Health Organization)', sourceUrl: 'https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters' }
          ]
        }
      ]
    });
  }
}

module.exports = {
  scanClaimText,
  scanClaimScreenshot,
  listRecentMyths
};
