const fs = require('fs');
const crypto = require('crypto');
const { performOcr } = require('../ocr/ocrService');
const { decodePrescriptionText, analyzeLabReportText } = require('../ai/aiService');
const { generateAIResponse } = require('../../config/gemini');
const prisma = require('../../config/db');

/**
 * Decode uploaded Prescription image or raw text
 */
async function decodePrescription(req, res) {
  try {
    let textToAnalyze = req.body.text;
    let ocrConfidence = null;
    let ocrSource = null;

    if (req.file) {
      const filePath = req.file.path;
      const ocrResult = await performOcr(filePath);
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Failed to delete uploaded prescription file:', err.message);
      }

      if (!ocrResult.text || ocrResult.text.trim().length < 5) {
        return res.status(422).json({ error: 'OCR could not read prescription text' });
      }

      textToAnalyze = ocrResult.text;
      ocrConfidence = ocrResult.confidence;
      ocrSource = ocrResult.source;
    }

    if (!textToAnalyze || textToAnalyze.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide either a text string or a file upload' });
    }

    const decoded = await decodePrescriptionText(textToAnalyze);

    // Scan database for additional real side effects and interactions for mapped medicines
    const richMedicines = [];
    for (const med of (decoded.medicines || [])) {
      // Find matching medicine in database
      let dbMed = null;
      if (global.dbActive !== false) {
        try {
          dbMed = await prisma.medicine.findFirst({
            where: {
              OR: [
                { name: { contains: med.name, mode: 'insensitive' } },
                { genericName: { contains: med.genericName || med.name, mode: 'insensitive' } }
              ]
            }
          });
        } catch (dbErr) {
          console.log(`[RAG DB Check] Failed to lookup medicine ${med.name} (DB inactive)`);
        }
      }

      if (dbMed) {
        // Parse JSON string fields stored by SQLite
        let parsedSideEffects = dbMed.sideEffects;
        let parsedInteractions = dbMed.interactions;
        if (typeof parsedSideEffects === 'string') {
          try { parsedSideEffects = JSON.parse(parsedSideEffects); } catch { parsedSideEffects = []; }
        }
        if (typeof parsedInteractions === 'string') {
          try { parsedInteractions = JSON.parse(parsedInteractions); } catch { parsedInteractions = []; }
        }
        const dbSideEffects = (parsedSideEffects || []).map(s => s.description || s);
        const dbInteractions = (parsedInteractions || []).map(i => `${i.description} (Severity: ${i.severity})`);

        richMedicines.push({
          ...med,
          dbMatched: true,
          safetyCategory: dbMed.safetyCategory,
          sideEffects: Array.from(new Set([...med.sideEffects, ...dbSideEffects])),
          interactions: Array.from(new Set([...med.interactions, ...dbInteractions]))
        });
      } else {
        richMedicines.push({
          ...med,
          dbMatched: false
        });
      }
    }

    res.status(200).json({
      message: 'Prescription decoded successfully',
      extractedText: textToAnalyze,
      ocrConfidence,
      ocrSource,
      decoded: {
        medicines: richMedicines,
        safetyGuardrails: decoded.safetyGuardrails || "Always consult your physician before altering your medication."
      }
    });

  } catch (error) {
    console.error('Prescription decoding controller error:', error);
    res.status(500).json({ error: 'Failed to decode prescription' });
  }
}

/**
 * Analyze blood report panels
 */
async function analyzeLabReport(req, res) {
  try {
    let textToAnalyze = req.body.text;
    let ocrConfidence = null;
    let ocrSource = null;

    if (req.file) {
      const filePath = req.file.path;
      const ocrResult = await performOcr(filePath);
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Failed to delete lab report file:', err.message);
      }

      if (!ocrResult.text || ocrResult.text.trim().length < 5) {
        return res.status(422).json({ error: 'OCR could not read lab report text' });
      }

      textToAnalyze = ocrResult.text;
      ocrConfidence = ocrResult.confidence;
      ocrSource = ocrResult.source;
    }

    if (!textToAnalyze || textToAnalyze.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide either a text string or a file upload' });
    }

    const analysis = await analyzeLabReportText(textToAnalyze);

    res.status(200).json({
      message: 'Lab report analyzed successfully',
      extractedText: textToAnalyze,
      ocrConfidence,
      ocrSource,
      analysis
    });

  } catch (error) {
    console.error('Lab report analyzing controller error:', error);
    res.status(500).json({ error: 'Failed to analyze lab report' });
  }
}

const https = require('https');

function translateTextFree(text, targetLangCode) {
  return new Promise((resolve, reject) => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLangCode}&dt=t&q=${encodeURIComponent(text)}`;
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Google Translate responded with status ${res.statusCode}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed[0]) {
            const translated = parsed[0].map(x => x[0]).join('');
            resolve(translated);
          } else {
            reject(new Error('Invalid structure from translation API'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function translateJsonFree(obj, targetLangCode) {
  const stringsToTranslate = [];
  const paths = [];

  const traverse = (current, path = []) => {
    if (typeof current === 'string') {
      const trimmed = current.trim();
      const lastKey = path[path.length - 1];
      if (trimmed.length > 0 && !['unit', 'value', 'url', 'sourceUrl', 'ocrSource', 'ocrConfidence', 'id', 'isDangerous', 'confidenceScore', 'fearScore'].includes(lastKey)) {
        stringsToTranslate.push(current);
        paths.push(path);
      }
    } else if (Array.isArray(current)) {
      current.forEach((item, idx) => {
        traverse(item, [...path, idx]);
      });
    } else if (typeof current === 'object' && current !== null) {
      Object.entries(current).forEach(([key, val]) => {
        traverse(val, [...path, key]);
      });
    }
  };

  traverse(obj);

  if (stringsToTranslate.length === 0) {
    return obj;
  }

  const translations = await Promise.all(
    stringsToTranslate.map(async (str) => {
      try {
        return await translateTextFree(str, targetLangCode);
      } catch (err) {
        console.error(`Failed to translate string "${str}":`, err.message);
        return str;
      }
    })
  );

  const resultObj = JSON.parse(JSON.stringify(obj));
  paths.forEach((path, idx) => {
    let current = resultObj;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = translations[idx];
  });

  return resultObj;
}

/**
 * Translate health analysis content into regional languages
 */
async function translateHealthContent(req, res) {
  try {
    const { text, targetLanguage } = req.body;
    
    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'Text and targetLanguage are required' });
    }

    const supportedLanguages = ['Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'English'];
    if (!supportedLanguages.some(l => l.toLowerCase() === targetLanguage.toLowerCase())) {
      return res.status(400).json({ error: `Language '${targetLanguage}' is not supported. Supported: ${supportedLanguages.join(', ')}` });
    }

    // Try finding in offline cache DB first
    try {
      const cacheKey = crypto.createHash('sha256').update(text).digest('hex');
      const cached = await prisma.multilingualContent.findFirst({
        where: {
          key: cacheKey,
          language: targetLanguage.toLowerCase()
        }
      });
      if (cached) {
        return res.status(200).json({ translatedText: cached.translationText, source: 'database_cache' });
      }
    } catch (dbErr) {
      console.warn('Multilingual content DB check failed:', dbErr.message);
    }

    // Check if the input is a JSON string
    let isJson = false;
    let parsedJson = null;
    try {
      if (typeof text === 'string' && (text.trim().startsWith('{') || text.trim().startsWith('['))) {
        parsedJson = JSON.parse(text);
        isJson = true;
      }
    } catch (e) {
      isJson = false;
    }

    const langNameToCode = {
      english: 'en',
      hindi: 'hi',
      telugu: 'te',
      tamil: 'ta',
      bengali: 'bn',
      kannada: 'kn',
      malayalam: 'ml',
      marathi: 'mr',
      gujarati: 'gu',
      punjabi: 'pa'
    };
    const targetLangCode = langNameToCode[targetLanguage.toLowerCase()] || 'en';

    let translatedText;
    if (isJson) {
      try {
        const translatedJsonObj = await translateJsonFree(parsedJson, targetLangCode);
        translatedText = JSON.stringify(translatedJsonObj);
      } catch (err) {
        console.error('Failed to translate JSON with Google Translate API:', err.message);
        translatedText = text; // Fallback
      }
    } else {
      try {
        translatedText = await translateTextFree(text, targetLangCode);
      } catch (err) {
        console.error('Failed to translate text with Google Translate API:', err.message);
        translatedText = text; // Fallback
      }
    }

    // Save translation to cache DB asynchronously
    try {
      const cacheKey = crypto.createHash('sha256').update(text).digest('hex');
      await prisma.multilingualContent.create({
        data: {
          key: cacheKey,
          language: targetLanguage.toLowerCase(),
          translationText: translatedText
        }
      }).catch(() => {});
    } catch (e) {}

    res.status(200).json({
      translatedText: translatedText.trim(),
      source: 'Google-Translate-Free'
    });

  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Failed to translate content' });
  }
}

/**
 * Voice Narration Synthesis configuration
 */
async function synthesizeVoice(req, res) {
  try {
    const { text, lang } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text input is required for synthesis' });
    }

    // Web Speech API will handle this on the frontend, but we expose a backend configuration metadata endpoint
    // to provide audio details or parameters (e.g. rate, pitch, selected voice options based on regional settings)
    res.status(200).json({
      message: 'Synthesis properties generated',
      config: {
        rate: 0.85, // Slower rate for elderly accessibility
        pitch: 1.0,
        lang: lang || 'en-IN',
        volume: 1.0,
        text: text
      }
    });

  } catch (error) {
    console.error('Voice synthesis error:', error);
    res.status(500).json({ error: 'Failed to prepare voice synthesis parameters' });
  }
}

/**
 * Fetch Health Literacy Hub modules
 */
async function listLearningResources(req, res) {
  try {
    const resources = [
      {
        id: 'resource-1',
        title: 'Understanding Prescription Abbreviation Symbols',
        category: 'Prescription Literacy',
        summary: 'Learn what terms like Rx, bid, tid, hs, and po mean on your prescription sheet to avoid medication dosage confusion.',
        content: `Doctors often use Latin abbreviations on prescriptions:
        - Rx: Recipe / Prescription
        - bid (bis in die): Twice a day
        - tid (ter in die): Three times a day
        - qid (quater in die): Four times a day
        - po (per os): By mouth
        - hs (hora somni): At bedtime
        - prn (pro re nata): As needed.
        Understanding these symbols reduces dosage errors and improves compliance.`,
        duration: '3 mins read',
        source: 'MedlinePlus / Pharmacist guidance'
      },
      {
        id: 'resource-2',
        title: 'Decoding Blood Test Reports: Red Cell Indices',
        category: 'Lab Literacy',
        summary: 'What are RBC count, Hemoglobin, and Hematocrit? How do they relate to anemia and overall fatigue?',
        content: `Your Complete Blood Count (CBC) contains key indices:
        - Hemoglobin (Hb): Protein in red blood cells that carries oxygen. Low Hb suggests anemia.
        - Hematocrit (Hct): The percentage of blood volume made of red blood cells.
        - Mean Corpuscular Volume (MCV): The average size of your red blood cells. Elevated MCV could point to Vitamin B12 deficiency.`,
        duration: '4 mins read',
        source: 'Clinical lab literacy'
      },
      {
        id: 'resource-3',
        title: 'Spotting WhatsApp Medical Falsehoods',
        category: 'Media Literacy',
        summary: '3 simple warning signs that a forwarded medical message is false, unverified, or potentially dangerous.',
        content: `Always check forwards for:
        1. Extreme Promises: Messages claiming a common ingredient "cures cancer in 2 days" or "guarantees complete cure."
        2. Threat & Fear: "Doctors want to hide this!" or "Urgent warning from WHO!" (without real WHO website links).
        3. Lack of Citations: Look for active links to reputable journals (PubMed, Lancet) or medical agencies (CDC, WHO). If it has none, do not forward.`,
        duration: '5 mins read',
        source: 'WHO/CDC verification habits'
      },
      {
        id: 'resource-4',
        title: 'Medicine Safety Checklist Before You Take a New Drug',
        category: 'Medicine Safety',
        summary: 'A simple checklist for confirming the medicine name, purpose, timing, dose, storage, side effects, and interaction risks.',
        content: `Before starting a new medicine, confirm:
        - Name: Know both the brand name and generic name when possible.
        - Purpose: Ask what condition it treats and how you will know it is working.
        - Dose timing: Check whether it is once daily, twice daily, with food, before food, or at bedtime.
        - Duration: Ask how long to take it and what to do if you miss a dose.
        - Warnings: Ask about side effects that need urgent care.
        - Interactions: Mention all prescription medicines, OTC medicines, vitamins, herbal products, alcohol use, and allergies.
        Do not stop or change a prescribed medicine without speaking to a qualified clinician or pharmacist.`,
        duration: '5 mins read',
        source: 'MedlinePlus'
      },
      {
        id: 'resource-5',
        title: 'Drug Interactions: What to Check Every Time',
        category: 'Medicine Safety',
        summary: 'Learn why medicines can interact with other medicines, food, alcohol, supplements, and existing medical conditions.',
        content: `Interaction checks are important because one medicine can change how another works.
        Common interaction areas:
        - Prescription plus prescription: Example risk includes duplicate blood pressure, diabetes, sleep, or blood-thinning medicines.
        - Prescription plus OTC: Painkillers, cough syrups, antacids, and allergy tablets can still interact.
        - Food and drink: Grapefruit, alcohol, and some supplements can affect selected medicines.
        - Medical conditions: Kidney disease, liver disease, pregnancy, asthma, ulcers, and high blood pressure can change medicine safety.
        Keep one updated medicine list and show it at every doctor or pharmacy visit.`,
        duration: '4 mins read',
        source: 'MedlinePlus / NHS Medicines A to Z'
      },
      {
        id: 'resource-6',
        title: 'Antibiotics: When They Help and When They Do Not',
        category: 'Antibiotic Safety',
        summary: 'Antibiotics can save lives for bacterial infections, but they do not treat colds, flu, or most viral sore throats.',
        content: `Use antibiotics carefully:
        - Antibiotics treat bacterial infections, not viral infections such as colds or flu.
        - Taking antibiotics when they are not needed can cause side effects and antibiotic resistance.
        - Complete the course exactly as prescribed unless your clinician tells you to stop.
        - Do not share leftover antibiotics with family or friends.
        - Seek medical advice if symptoms worsen, fever persists, breathing becomes difficult, or there are signs of allergy such as swelling or rash.
        Smart antibiotic use protects both you and the community.`,
        duration: '5 mins read',
        source: 'CDC Antibiotic Prescribing and Use'
      },
      {
        id: 'resource-7',
        title: 'Painkillers: Avoid Accidental Double Dosing',
        category: 'OTC Medicine Safety',
        summary: 'Pain and fever medicines are common, but taking two products with the same active ingredient can be risky.',
        content: `Before taking pain or fever medicine:
        - Read the active ingredient, not just the brand name.
        - Avoid taking two products with the same active ingredient unless a clinician says it is safe.
        - Follow the label dose and do not use higher doses to get faster relief.
        - Be extra careful with combination cold, cough, and flu products because they may already contain a painkiller.
        - Ask a pharmacist before using painkillers if you have liver disease, kidney disease, stomach ulcer, blood thinner use, pregnancy, heavy alcohol use, heart disease, or high blood pressure.
        If pain or fever is severe, persistent, or unusual, get medical care instead of repeatedly increasing doses.`,
        duration: '5 mins read',
        source: 'MedlinePlus OTC medicines'
      },
      {
        id: 'resource-8',
        title: 'Chronic Medicines: Why Normal Readings Do Not Mean Stop',
        category: 'Long-Term Medicines',
        summary: 'Blood pressure, diabetes, thyroid, cholesterol, asthma, and seizure medicines often keep numbers normal only while you keep taking them.',
        content: `For long-term conditions:
        - A normal blood pressure, sugar, thyroid, or cholesterol reading often means the treatment is controlling the condition.
        - Stopping suddenly can make the condition return or rebound.
        - Some medicines, such as steroids, beta blockers, seizure medicines, and antidepressants, may need a supervised taper.
        - Track missed doses and side effects, then discuss them instead of silently stopping.
        - Use reminders, pill boxes, refill alerts, or family support if remembering doses is difficult.
        Always ask your clinician what to do before stopping or changing chronic medicines.`,
        duration: '4 mins read',
        source: 'MedlinePlus medicine questions'
      },
      {
        id: 'resource-9',
        title: 'Side Effects vs Allergy: Know the Difference',
        category: 'Medicine Safety',
        summary: 'Not every unpleasant effect is an allergy, but some symptoms require urgent help.',
        content: `Side effects and allergies are different:
        - Common side effects can include nausea, sleepiness, mild stomach upset, dizziness, or dry mouth depending on the medicine.
        - Allergy warning signs include swelling of lips or face, wheezing, trouble breathing, widespread hives, or fainting.
        - Severe rash, blistering skin, chest pain, black stools, severe weakness, confusion, or yellow eyes also need urgent medical attention.
        - Record what happened, when it started, the medicine name, dose, and any other medicines taken that day.
        Tell your doctor and pharmacist about serious reactions before receiving new medicines.`,
        duration: '4 mins read',
        source: 'MedlinePlus drug safety'
      },
      {
        id: 'resource-10',
        title: 'Generic and Brand Names: Same Ingredient, Different Label',
        category: 'Prescription Literacy',
        summary: 'A single medicine can appear under a brand name, a generic name, or a combination product name.',
        content: `Medicine names can be confusing:
        - Generic name: The active ingredient, such as paracetamol/acetaminophen, amoxicillin, metformin, or atorvastatin.
        - Brand name: A company name for the same active ingredient.
        - Combination product: A tablet or syrup containing more than one active ingredient.
        - Strength: The amount of medicine in each tablet, capsule, spoon, puff, or injection.
        When comparing medicines, match the generic name and strength. This helps prevent duplicate therapy and accidental overdose.`,
        duration: '3 mins read',
        source: 'MedlinePlus Drugs, Herbs and Supplements'
      }
    ];

    res.status(200).json({ resources });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch learning resources' });
  }
}

/**
 * Proxy stream for Google Translate TTS to avoid browser CORS/Referer policy blocks
 */
function streamTtsAudio(req, res) {
  const https = require('https');
  const { text, lang } = req.query;

  if (!text || !lang) {
    return res.status(400).json({ error: 'Text and lang parameters are required' });
  }

  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;

  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  https.get(url, options, (googleRes) => {
    if (googleRes.statusCode !== 200) {
      console.error(`Google TTS responded with status code: ${googleRes.statusCode}`);
      return res.status(googleRes.statusCode || 500).json({ error: 'Failed to retrieve TTS' });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    googleRes.pipe(res);
  }).on('error', (err) => {
    console.error('Error fetching from Google TTS:', err.message);
    res.status(500).json({ error: 'Failed to stream TTS audio' });
  });
}

module.exports = {
  decodePrescription,
  analyzeLabReport,
  translateHealthContent,
  synthesizeVoice,
  listLearningResources,
  streamTtsAudio
};
