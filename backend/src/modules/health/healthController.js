const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { performOcr } = require('../ocr/ocrService');
const { decodePrescriptionText, analyzeLabReportText } = require('../ai/aiService');
const { generateAIResponse } = require('../../config/gemini');
const prisma = require('../../config/db');
const https = require('https');

/**
 * Query openFDA drug label API for additional information
 */
async function queryOpenFda(medicineName) {
  const apiKey = process.env.FDA_API_KEY || '';
  const searchUrl = `https://api.fda.gov/drug/label.json?api_key=${apiKey}&search=openfda.brand_name:"${encodeURIComponent(medicineName)}"+OR+openfda.generic_name:"${encodeURIComponent(medicineName)}"&limit=1`;
  
  return new Promise((resolve) => {
    https.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        return resolve(null);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const result = parsed.results?.[0];
          if (!result) return resolve(null);
          
          const extractText = (field) => {
            if (!field) return '';
            const raw = Array.isArray(field) ? field.join(' ') : String(field);
            const clean = raw.replace(/<\/?[^>]+(>|$)/g, "").trim();
            if (clean.length > 200) {
              return clean.substring(0, 197) + '...';
            }
            return clean;
          };

          const extractList = (field) => {
            if (!field) return [];
            const raw = Array.isArray(field) ? field.join(' ') : String(field);
            const clean = raw.replace(/<\/?[^>]+(>|$)/g, "").trim();
            const items = clean.split(/[;•\n\-\u2022]/)
              .map(x => x.trim())
              .filter(x => x.length > 10 && x.length < 150)
              .slice(0, 4);
            if (items.length === 0 && clean.length > 0) {
              return [clean.length > 100 ? clean.substring(0, 97) + '...' : clean];
            }
            return items;
          };

          resolve({
            brandName: result.openfda?.brand_name?.[0] || medicineName,
            genericName: result.openfda?.generic_name?.[0] || 'Unknown',
            description: extractText(result.indications_and_usage || result.description),
            safetyCategory: result.pregnancy ? extractText(result.pregnancy) : 'Caution',
            sideEffects: extractList(result.adverse_reactions || result.warnings_and_cautions),
            interactions: extractList(result.drug_interactions)
          });
        } catch (e) {
          console.error('[openFDA Parse Error]', e.message);
          resolve(null);
        }
      });
    }).on('error', (err) => {
      console.error('[openFDA HTTP Error]', err.message);
      resolve(null);
    });
  });
}

/**
 * Query Gemini to get correct clinical details for a medicine as a fallback
 */
async function getMedicineDetailsFromGemini(medicineName) {
  const systemInstruction = `
    You are a clinical pharmacology model. Given a medicine name, return a JSON object with its correct clinical details.
    
    Output format MUST be JSON matching this exact structure:
    {
      "genericName": "Generic name of the medicine",
      "description": "Short description of the medicine and its primary use cases.",
      "safetyCategory": "Safe" | "Caution" | "High Risk",
      "sideEffects": ["side effect 1", "side effect 2", "side effect 3"],
      "interactions": ["drug interaction 1", "drug interaction 2"]
    }
    Output JSON only. No markdown formatting around JSON.
  `;

  try {
    const rawResponse = await generateAIResponse(medicineName, systemInstruction, true);
    const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error('Failed to get medicine details from Gemini fallback:', err.message);
    return null;
  }
}

function makeHttpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function sanitizeText(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/\b\d+(?:\.\d+)?\s*(?:mg|g|mcg|ml)\b/gi, '') // Strip strengths/dosages
    .replace(/\b\d+\s*(?:tablet|tablets|capsule|capsules|tab|tabs|cap|caps)\b/gi, '') // Strip tablet counts
    .replace(/\b(?:once|twice|thrice|three times|four times)\s*(?:daily|a day|weekly|a week|monthly|a month)\b/gi, '') // Strip frequencies
    .replace(/\bfor\s+\d+\s*(?:days|weeks|months|day|week|month)\b/gi, '') // Strip durations
    .replace(/\s+/g, ' ')
    .trim();
}

async function lookupDrugDetails(drugName) {
  let details = {
    name: drugName,
    genericName: 'Unknown',
    therapeuticClass: 'Unknown',
    purpose: 'Unknown',
    safetyCategory: 'Caution',
    dosageWarning: 'Take only as directed by your physician.',
    sideEffects: [],
    interactions: []
  };

  let rxnormResolvedName = drugName;
  try {
    const rxnormUrl = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(drugName)}`;
    const rxnormData = await makeHttpGet(rxnormUrl);
    if (rxnormData && rxnormData.idGroup && rxnormData.idGroup.rxnormId) {
      const rxcui = rxnormData.idGroup.rxnormId[0];
      const propUrl = `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/property.json?propName=RxNorm%20Name`;
      const propData = await makeHttpGet(propUrl);
      if (propData && propData.propConceptGroup && propData.propConceptGroup.propConcept) {
        rxnormResolvedName = propData.propConceptGroup.propConcept[0].value;
        details.genericName = rxnormResolvedName;
      }
    }
  } catch (err) {
    console.warn(`[RxNorm Lookup Failed] for ${drugName}:`, err.message);
  }

  try {
    const fdaData = await queryOpenFda(rxnormResolvedName || drugName);
    if (fdaData) {
      details.genericName = fdaData.genericName !== 'Unknown' ? fdaData.genericName : details.genericName;
      details.purpose = fdaData.description || details.purpose;
      details.safetyCategory = fdaData.safetyCategory || details.safetyCategory;
      details.sideEffects = fdaData.sideEffects && fdaData.sideEffects.length > 0 ? fdaData.sideEffects : details.sideEffects;
      details.interactions = fdaData.interactions && fdaData.interactions.length > 0 ? fdaData.interactions : details.interactions;
      details.therapeuticClass = fdaData.therapeuticClass || details.therapeuticClass;
    }
  } catch (err) {
    console.warn(`[openFDA Lookup Failed] for ${drugName}:`, err.message);
  }

  try {
    const dailymedUrl = `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?drug_name=${encodeURIComponent(rxnormResolvedName || drugName)}&pagesize=1`;
    const dailymedData = await makeHttpGet(dailymedUrl);
    if (dailymedData && dailymedData.data && dailymedData.data.length > 0) {
      const spl = dailymedData.data[0];
      if (spl.title && details.genericName === 'Unknown') {
        details.genericName = spl.title.split('[')[0].trim();
      }
    }
  } catch (err) {
    console.warn(`[DailyMed Lookup Failed] for ${drugName}:`, err.message);
  }

  if (global.dbActive !== false) {
    try {
      const dbMed = await prisma.medicine.findFirst({
        where: {
          OR: [
            { name: { contains: drugName, mode: 'insensitive' } },
            { genericName: { contains: drugName, mode: 'insensitive' } },
            { name: { contains: rxnormResolvedName, mode: 'insensitive' } }
          ]
        }
      });
      if (dbMed) {
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

        details.genericName = dbMed.genericName || details.genericName;
        details.therapeuticClass = dbMed.therapeuticClass || details.therapeuticClass;
        details.purpose = dbMed.description || details.purpose;
        details.safetyCategory = dbMed.safetyCategory || details.safetyCategory;
        details.sideEffects = Array.from(new Set([...details.sideEffects, ...dbSideEffects]));
        details.interactions = Array.from(new Set([...details.interactions, ...dbInteractions]));
      }
    } catch (err) {
      console.warn(`[DB RAG Lookup Failed] for ${drugName}:`, err.message);
    }
  }

  if (details.genericName === 'Unknown' || details.sideEffects.length === 0 || details.interactions.length === 0) {
    try {
      const geminiData = await getMedicineDetailsFromGemini(rxnormResolvedName || drugName);
      if (geminiData) {
        details.genericName = geminiData.genericName || details.genericName;
        details.purpose = geminiData.description || details.purpose;
        details.safetyCategory = geminiData.safetyCategory || details.safetyCategory;
        details.sideEffects = Array.from(new Set([...details.sideEffects, ...(geminiData.sideEffects || [])]));
        details.interactions = Array.from(new Set([...details.interactions, ...(geminiData.interactions || [])]));
      }
    } catch (err) {
      console.warn(`[Gemini Fallback Failed] for ${drugName}:`, err.message);
    }
  }

  if (details.genericName === 'Unknown') details.genericName = drugName;
  if (details.therapeuticClass === 'Unknown') details.therapeuticClass = 'Therapeutic Agent';
  if (details.purpose === 'Unknown') details.purpose = `Used for the treatment of conditions matching ${drugName}.`;
  if (details.sideEffects.length === 0) details.sideEffects = ['Nausea', 'Headache', 'Dizziness'];
  if (details.interactions.length === 0) details.interactions = ['Consult a physician before combining with other medications.'];

  details.name = sanitizeText(details.name);
  details.genericName = sanitizeText(details.genericName);
  details.therapeuticClass = sanitizeText(details.therapeuticClass);
  details.purpose = sanitizeText(details.purpose);
  details.dosageWarning = sanitizeText(details.dosageWarning);
  details.sideEffects = details.sideEffects.map(sanitizeText).filter(x => x.length > 0);
  details.interactions = details.interactions.map(sanitizeText).filter(x => x.length > 0);

  return details;
}

async function decodePrescription(req, res) {
  try {
    let textToAnalyze = req.body.text;
    let ocrConfidence = null;
    let ocrSource = null;

    if (req.file) {
      const filePath = req.file.path;
      const fileExt = path.extname(req.file.originalname).toLowerCase();

      if (fileExt === '.pdf') {
        const pdfParse = require('pdf-parse');
        const dataBuffer = fs.readFileSync(filePath);
        try {
          const pdfData = await pdfParse(dataBuffer);
          textToAnalyze = pdfData.text;
          ocrConfidence = 100.0;
          ocrSource = 'Native PDF Digital Parser';
        } catch (pdfError) {
          console.error('[PDF Parse Error]', pdfError.message);
          return res.status(422).json({ error: 'Failed to read digital PDF prescription' });
        } finally {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {}
        }
      } else {
        const ocrResult = await performOcr(filePath, 'prescription');
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

        if (ocrConfidence !== null && ocrConfidence < 60.0) {
          return res.status(422).json({
            error: 'Unable to reliably identify medication names from the uploaded document. Please consult a pharmacist or healthcare professional.'
          });
        }
      }
    }

    if (!textToAnalyze || textToAnalyze.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide either a text string or a file upload' });
    }

    const drugNames = await decodePrescriptionText(textToAnalyze);
    const richMedicines = [];

    for (const drugName of drugNames) {
      if (typeof drugName !== 'string' || drugName.trim().length === 0) continue;
      const drugDetails = await lookupDrugDetails(drugName.trim());
      richMedicines.push(drugDetails);
    }

    res.status(200).json({
      decoded: {
        medicines: richMedicines,
        safetyGuardrails: "This is an automated machine analysis. Never alter your prescribed dosage, stop treatment, or self-medicate without consulting your prescribing physician or healthcare provider."
      }
    });

  } catch (error) {
    console.error('Prescription decoding controller error:', error);
    res.status(500).json({ error: error.message || 'Failed to decode prescription' });
  }
}

/**
 * Analyze blood report panels
 */
async function analyzeLabReport(req, res) {
  try {
    let textToAnalyze = req.body.text;
    const category = req.body.category || 'blood';
    let ocrConfidence = null;
    let ocrSource = null;

    if (req.file) {
      const filePath = req.file.path;
      const fileExt = path.extname(req.file.originalname).toLowerCase();

      if (fileExt === '.pdf') {
        const pdfParse = require('pdf-parse');
        const dataBuffer = fs.readFileSync(filePath);
        try {
          const pdfData = await pdfParse(dataBuffer);
          textToAnalyze = pdfData.text;
          ocrConfidence = 100.0;
          ocrSource = 'Native PDF Digital Parser';
        } catch (pdfError) {
          console.error('[PDF Parse Error]', pdfError.message);
          return res.status(422).json({ error: 'Failed to read digital PDF lab report' });
        } finally {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {}
        }
      } else {
        const ocrResult = await performOcr(filePath, category === 'vision' ? 'vision' : 'lab');
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

        if (ocrConfidence !== null && ocrConfidence < 60.0) {
          return res.status(422).json({
            error: 'Unable to reliably identify lab markers from the uploaded document. Please consult a healthcare professional.'
          });
        }
      }
    }

    if (!textToAnalyze || textToAnalyze.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide either a text string or a file upload' });
    }

    const analysis = await analyzeLabReportText(textToAnalyze, category);

    res.status(200).json({
      message: 'Lab report analyzed successfully',
      extractedText: textToAnalyze,
      ocrConfidence,
      ocrSource,
      analysis
    });

  } catch (error) {
    console.error('Lab report analyzing controller error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze lab report' });
  }
}



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

  const translations = [];
  const batchSize = 5;
  for (let i = 0; i < stringsToTranslate.length; i += batchSize) {
    const batch = stringsToTranslate.slice(i, i + batchSize);
    const batchPromises = batch.map(async (str) => {
      try {
        return await translateTextFree(str, targetLangCode);
      } catch (err) {
        console.error(`Failed to translate string "${str}":`, err.message);
        return str;
      }
    });
    const batchResults = await Promise.all(batchPromises);
    translations.push(...batchResults);
    if (i + batchSize < stringsToTranslate.length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

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

async function translateTextWithGemini(text, targetLanguageName) {
  const systemInstruction = `
    You are a professional medical translator. Translate the given text into ${targetLanguageName}.
    Translate it accurately and professionally. Maintain any format keys, Markdown symbols, numbers, and units as they are.
    Provide ONLY the translated text, no warnings, no quotes, and no extra explanations.
  `;
  try {
    const translated = await generateAIResponse(text, systemInstruction, false);
    return translated.trim();
  } catch (err) {
    console.error(`Gemini Translation Fallback failed for language ${targetLanguageName}:`, err.message);
    return text;
  }
}

async function translateJsonWithGemini(jsonObj, targetLanguageName) {
  const systemInstruction = `
    You are a professional medical translator. Translate the string values in the given JSON object into ${targetLanguageName}.
    
    Translate the values for keys like 'generalSummary', 'explanation', 'educationalRecommendation', 'name', 'status' where appropriate. Do NOT translate JSON keys, and do NOT translate metric values or units unless appropriate (e.g. keep 'decimal', 'mmHg' as standard, or translate them if it fits target language context).
    
    The output MUST be a valid JSON object matching the exact same keys and structure as the input. Do NOT wrap the output in markdown block codes. Output the raw JSON string only.
  `;
  try {
    const rawResponse = await generateAIResponse(JSON.stringify(jsonObj), systemInstruction, true);
    const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error(`Gemini JSON Translation Fallback failed for language ${targetLanguageName}:`, err.message);
    return jsonObj;
  }
}

const codeToLangName = {
  en: 'english',
  hi: 'hindi',
  te: 'telugu',
  ta: 'tamil',
  bn: 'bengali',
  kn: 'kannada',
  ml: 'malayalam',
  mr: 'marathi',
  gu: 'gujarati',
  pa: 'punjabi'
};

const getTargetLanguageName = (targetLang) => {
  const normalized = targetLang.toLowerCase();
  if (codeToLangName[normalized]) {
    return codeToLangName[normalized];
  }
  return normalized;
};

function isCachePoisonedOrCorrupted(translationText, targetLanguage, expectedLength = null) {
  try {
    const lang = targetLanguage.toLowerCase();
    const langCode = lang.length === 2 ? lang : (Object.keys(codeToLangName).find(k => codeToLangName[k] === lang) || 'en');
    
    // Check if it's JSON and parse it
    let parsed = null;
    try {
      parsed = JSON.parse(translationText);
    } catch (e) {
      parsed = translationText;
    }
    
    // If expected length is set, verify array size
    if (expectedLength !== null && Array.isArray(parsed)) {
      if (parsed.length !== expectedLength) {
        return true; // Corrupted length mismatch!
      }
    }
    
    // Check for Devnagari (Hindi/Marathi) leakage in non-Devnagari languages
    if (langCode !== 'hi' && langCode !== 'mr') {
      const hasDevnagari = /[\u0900-\u097F]/.test(translationText);
      if (hasDevnagari) {
        return true; // Poisoned with Hindi!
      }
    }
    
    return false;
  } catch (err) {
    return true; // If any error occurs, treat as corrupted
  }
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

    const supportedLanguages = [
      'hindi', 'telugu', 'tamil', 'kannada', 'malayalam', 'bengali', 'marathi', 'gujarati', 'punjabi', 'english',
      'en', 'hi', 'te', 'ta', 'bn', 'kn', 'ml', 'mr', 'gu', 'pa'
    ];
    if (!supportedLanguages.includes(targetLanguage.toLowerCase())) {
      return res.status(400).json({ error: `Language '${targetLanguage}' is not supported.` });
    }

    const targetLangName = getTargetLanguageName(targetLanguage);
    const langNameToCode = {
      english: 'en',
      en: 'en',
      hindi: 'hi',
      hi: 'hi',
      telugu: 'te',
      te: 'te',
      tamil: 'ta',
      ta: 'ta',
      bengali: 'bn',
      bn: 'bn',
      kannada: 'kn',
      kn: 'kn',
      malayalam: 'ml',
      ml: 'ml',
      marathi: 'mr',
      mr: 'mr',
      gujarati: 'gu',
      gu: 'gu',
      punjabi: 'pa',
      pa: 'pa'
    };
    const targetLangCode = langNameToCode[targetLanguage.toLowerCase()] || 'en';

    // Try finding in offline cache DB first
    try {
      const cacheKey = crypto.createHash('sha256').update(text).digest('hex');
      const cached = await prisma.multilingualContent.findFirst({
        where: {
          key: cacheKey,
          language: targetLangName
        }
      });
      if (cached) {
        if (isCachePoisonedOrCorrupted(cached.translationText, targetLangName)) {
          console.warn(`[Cache Clean] Deleting poisoned cached translation for key: ${cacheKey}`);
          await prisma.multilingualContent.delete({
            where: {
              key_language: {
                key: cacheKey,
                language: targetLangName
              }
            }
          }).catch(() => {});
        } else {
          return res.status(200).json({ translatedText: cached.translationText, source: 'database_cache' });
        }
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

    let translatedText;
    if (isJson) {
      try {
        const translatedJsonObj = await translateJsonFree(parsedJson, targetLangCode);
        translatedText = JSON.stringify(translatedJsonObj);

        // Check if Google Translate leaked Hindi
        if (targetLangCode !== 'hi' && targetLangCode !== 'mr' && /[\u0900-\u097F]/.test(translatedText)) {
          throw new Error('Google Translate returned Hindi Devnagari instead of the target language');
        }
      } catch (err) {
        console.error('Failed to translate JSON with Google Translate API, calling Gemini:', err.message);
        try {
          const translatedJsonObj = await translateJsonWithGemini(parsedJson, targetLangName);
          translatedText = JSON.stringify(translatedJsonObj);

          // Check if Gemini fallback leaked Hindi
          if (targetLangCode !== 'hi' && targetLangCode !== 'mr' && /[\u0900-\u097F]/.test(translatedText)) {
            throw new Error('Gemini fallback also returned Hindi Devnagari');
          }
        } catch (geminiErr) {
          console.error('Gemini JSON translation also failed:', geminiErr.message);
          translatedText = text; // Fallback
        }
      }
    } else {
      try {
        translatedText = await translateTextFree(text, targetLangCode);

        // Check if Google Translate leaked Hindi
        if (targetLangCode !== 'hi' && targetLangCode !== 'mr' && /[\u0900-\u097F]/.test(translatedText)) {
          throw new Error('Google Translate returned Hindi Devnagari instead of the target language');
        }
      } catch (err) {
        console.error('Failed to translate text with Google Translate API, calling Gemini:', err.message);
        try {
          translatedText = await translateTextWithGemini(text, targetLangName);

          // Check if Gemini fallback leaked Hindi
          if (targetLangCode !== 'hi' && targetLangCode !== 'mr' && /[\u0900-\u097F]/.test(translatedText)) {
            throw new Error('Gemini fallback also returned Hindi Devnagari');
          }
        } catch (geminiErr) {
          console.error('Gemini text translation also failed:', geminiErr.message);
          translatedText = text; // Fallback
        }
      }
    }

    // Save translation to cache DB asynchronously (if it is not poisoned)
    if (!(targetLangCode !== 'hi' && targetLangCode !== 'mr' && /[\u0900-\u097F]/.test(translatedText))) {
      try {
        const cacheKey = crypto.createHash('sha256').update(text).digest('hex');
        await prisma.multilingualContent.create({
          data: {
            key: cacheKey,
            language: targetLangName,
            translationText: translatedText
          }
        }).catch(() => {});
      } catch (e) {}
    }

    res.status(200).json({
      translatedText: translatedText.trim(),
      source: 'Google-Translate-Free-With-Gemini-Fallback'
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

    const lang = req.query.lang || 'en';
    const cleanLang = lang.split('-')[0].split('_')[0].toLowerCase();
    const targetLangName = getTargetLanguageName(cleanLang);

    if (cleanLang === 'en' || targetLangName === 'english') {
      return res.status(200).json({ resources });
    }

    // Try finding in database cache first
    const resourcesJsonStr = JSON.stringify(resources);
    const cacheKey = crypto.createHash('sha256').update(resourcesJsonStr).digest('hex');

    try {
      const cached = await prisma.multilingualContent.findFirst({
        where: {
          key: cacheKey,
          language: targetLangName
        }
      });
      if (cached) {
        if (isCachePoisonedOrCorrupted(cached.translationText, targetLangName, resources.length)) {
          console.warn(`[Cache Clean] Deleting poisoned or corrupted learning resources cache entry for key: ${cacheKey}`);
          await prisma.multilingualContent.delete({
            where: {
              key_language: {
                key: cacheKey,
                language: targetLangName
              }
            }
          }).catch(() => {});
        } else {
          const translatedResources = JSON.parse(cached.translationText);
          return res.status(200).json({ resources: translatedResources });
        }
      }
    } catch (dbErr) {
      console.warn('Learning resources DB cache check failed:', dbErr.message);
    }

    // If not in cache, translate using translateJsonFree
    let translatedResources;
    try {
      translatedResources = await translateJsonFree(resources, cleanLang);
      const translatedJsonStr = JSON.stringify(translatedResources);

      // Check if Google Translate leaked Hindi Devnagari characters for non-Hindi/Marathi
      if (cleanLang !== 'hi' && cleanLang !== 'mr' && /[\u0900-\u097F]/.test(translatedJsonStr)) {
        throw new Error('Google Translate returned Hindi Devnagari characters for learning resources');
      }
      
      // Save to cache DB asynchronously
      prisma.multilingualContent.create({
        data: {
          key: cacheKey,
          language: targetLangName,
          translationText: translatedJsonStr
        }
      }).catch((err) => {
        console.error('Failed to save learning resources translation to cache:', err.message);
      });
    } catch (err) {
      console.error('Failed to translate learning resources with Google Translate API, calling Gemini:', err.message);
      try {
        translatedResources = await translateJsonWithGemini(resources, targetLangName);
        const translatedJsonStr = JSON.stringify(translatedResources);

        // Save to cache DB asynchronously if not poisoned
        if (!(cleanLang !== 'hi' && cleanLang !== 'mr' && /[\u0900-\u097F]/.test(translatedJsonStr))) {
          prisma.multilingualContent.create({
            data: {
              key: cacheKey,
              language: targetLangName,
              translationText: translatedJsonStr
            }
          }).catch(() => {});
        }
      } catch (geminiErr) {
        console.error('Gemini learning resources translation fallback also failed:', geminiErr.message);
        translatedResources = resources; // Fallback to english
      }
    }

    res.status(200).json({ resources: translatedResources });
  } catch (error) {
    console.error('Error fetching learning resources:', error);
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
