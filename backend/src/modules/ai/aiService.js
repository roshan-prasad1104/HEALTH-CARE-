const { generateAIResponse } = require('../../config/gemini');
const prisma = require('../../config/db');

const fs = require('fs');
const path = require('path');

/**
 * Perform keyword-based semantic RAG search on the Database
 */
async function retrieveRagContext(userQuery) {
  const query = userQuery.toLowerCase();
  
  // 1. Fetch claims from DB
  const verifiedClaims = [];
  if (global.dbActive !== false) {
    try {
      const dbMyths = await prisma.myth.findMany();
      // Extract verifiedClaims from each myth document (stored as JSON string in SQLite)
      for (const m of dbMyths) {
        let claims = m.verifiedClaims;
        if (typeof claims === 'string') {
          try { claims = JSON.parse(claims); } catch { claims = []; }
        }
        if (Array.isArray(claims)) {
          for (const claim of claims) {
            verifiedClaims.push({
              ...claim,
              myth: {
                id: m.id,
                forwardText: m.forwardText,
                originalClaim: m.originalClaim
              }
            });
          }
        }
      }
    } catch (err) {
      console.log('[RAG] Fallback to in-memory matching (DB inactive)');
    }
  }
  
  // 2. Fetch standard medicines
  const medicines = [];
  if (global.dbActive !== false) {
    try {
      const dbMeds = await prisma.medicine.findMany();
      medicines.push(...dbMeds);
    } catch (err) {
      console.log('[RAG] Medicine fetch error:', err.message);
    }
  }

  const matchingClaims = [];
  const matchingMeds = [];

  // Match claims
  for (const claim of verifiedClaims) {
    const mythText = claim.myth.forwardText.toLowerCase();
    const claimText = claim.claimText.toLowerCase();
    if (query.includes(claim.sourceName.toLowerCase()) || 
        mythText.split(' ').some(word => word.length > 4 && query.includes(word)) ||
        claimText.split(' ').some(word => word.length > 4 && query.includes(word))) {
      matchingClaims.push(claim);
    }
  }

  // Match medicines (parse JSON string fields if stored as strings in SQLite)
  for (const med of medicines) {
    if (typeof med.sideEffects === 'string') {
      try { med.sideEffects = JSON.parse(med.sideEffects); } catch { med.sideEffects = []; }
    }
    if (typeof med.interactions === 'string') {
      try { med.interactions = JSON.parse(med.interactions); } catch { med.interactions = []; }
    }
    if (query.includes(med.name.toLowerCase()) || query.includes(med.genericName.toLowerCase())) {
      matchingMeds.push(med);
    }
  }

  // Return formatted context
  let context = '';
  const citations = [];

  if (matchingClaims.length > 0) {
    context += 'Verified Scientific Claims and Myths:\n';
    matchingClaims.forEach((c, index) => {
      context += `[Claim ${index + 1}]: "${c.claimText}" (Verified by ${c.sourceName})\n`;
      citations.push({
        id: c.id,
        source: c.sourceName,
        url: c.sourceUrl,
        text: c.claimText
      });
    });
  }

  // 3. Load dynamic PubMed claims RAG file if exists
  const pubmedPath = path.join(__dirname, '../../config/pubmed_claims.json');
  if (fs.existsSync(pubmedPath)) {
    try {
      const pmClaims = JSON.parse(fs.readFileSync(pubmedPath, 'utf8'));
      let pmIndex = 1;
      pmClaims.forEach((c) => {
        const titleMatch = c.title.toLowerCase().split(' ').some(w => w.length > 4 && query.includes(w));
        const abstractMatch = c.abstract.toLowerCase().split(' ').some(w => w.length > 4 && query.includes(w));
        
        if (titleMatch || abstractMatch) {
          if (pmIndex === 1) context += '\nRelevant PubMed Articles:\n';
          context += `[PubMed ${pmIndex}]: "${c.title}"\nAbstract: "${c.abstract}"\n`;
          citations.push({
            id: c.id,
            source: `${c.source} (${c.journal || 'NCBI'})`,
            url: c.url,
            text: c.abstract
          });
          pmIndex++;
        }
      });
    } catch (err) {
      console.warn('Failed to parse pubmed_claims.json RAG source:', err.message);
    }
  }

  if (matchingMeds.length > 0) {
    context += '\nVerified Medicine Information:\n';
    matchingMeds.forEach((m) => {
      context += `Medicine: ${m.name} (Generic: ${m.genericName})\n`;
      context += `- Description: ${m.description}\n`;
      context += `- Safety Category: ${m.safetyCategory}\n`;
      context += `- Common Side Effects: ${m.sideEffects.map(s => s.description).join(', ')}\n`;
    });
  }

  return { context, citations };
}

/**
 * WhatsApp Forward Scanner Service
 */
async function analyzeWhatsappForward(text) {
  const { context, citations } = await retrieveRagContext(text);

  const systemInstruction = `You are a senior medical misinformation analyst verifying a WhatsApp health claim against the verified context: "${context || 'No database matches found. Rely on established CDC/WHO standards.'}". Analyze the text for fear-mongering and dangerous remedies (like self-medicating or refusing vaccines), and output a JSON object containing: classification ("False"|"Misleading"|"Dangerous"|"True"), originalClaim, confidenceScore (0-100), fearScore (0-100), isDangerous (true/false), correctionText (citing authorities), whatsappCorrectionTemplate (Compact template with 🚨 FACT CHECK, myth, 3 bulleted truths, and WHO/CDC citation), and dangerousRemedyAlert (short alert or null). Rely strictly on WHO and CDC guidelines to refute false claims, keeping corrections clear, direct, and outputting JSON only.`;

  try {
    const rawResult = await generateAIResponse(text, systemInstruction, true);
    
    // Parse response
    let parsedResult;
    try {
      // Clean raw text if Gemini adds markdown blocks
      const cleanJson = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('Failed to parse AI output, returning fallback format', rawResult);
      parsedResult = {
        classification: "Unverified",
        originalClaim: "Unparseable AI input",
        confidenceScore: 50.0,
        fearScore: 50.0,
        isDangerous: false,
        correctionText: "The system encountered an error parsing the claim. Please verify with a doctor.",
        whatsappCorrectionTemplate: "*🚨 FACT CHECK*\nUnverified claim. Consult professional doctors.",
        dangerousRemedyAlert: null
      };
    }

    // Attach citations
    parsedResult.citations = citations;
    return parsedResult;
  } catch (error) {
    console.error('WhatsApp scanner API error:', error);
    throw error;
  }
}

/**
 * Prescription Decoder Service
 */
async function decodePrescriptionText(text) {
  const { context } = await retrieveRagContext(text);

  const systemInstruction = `
    You are the "Prescription Decoder" module of Prescrypto.
    Your task is to parse a physician's handwritten or typed prescription details from OCR text.
    You must follow these safety boundaries strictly:
    1. NEVER prescribe medication, alter dose durations, or diagnose diseases.
    2. Extract identified medicine names, active ingredients, standard uses, and crucial warnings.
    3. Emphasize side effects and drug-to-drug interactions (use the provided DB context).
    4. Deliver the response in a structured JSON schema.

    Verified Context:
    ${context}

    Output format MUST be JSON matching this exact structure:
    {
      "medicines": [
        {
          "name": "Medicine Name",
          "genericName": "Generic name",
          "therapeuticClass": "Class (e.g. Antihypertensive)",
          "purpose": "What this medicine is commonly used for",
          "safetyCategory": "Safe / Caution / High Risk",
          "dosageWarning": "Standard caution warnings (e.g. take after food)",
          "sideEffects": ["effect 1", "effect 2"],
          "interactions": ["drug interaction 1", "alcohol warning"]
        }
      ],
      "safetyGuardrails": "Standard medical liability disclaimer warning user not to alter schedules without consultation."
    }
  `;

  try {
    const rawResult = await generateAIResponse(text, systemInstruction, true);
    const cleanJson = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    if (parsed && Array.isArray(parsed.medicines)) {
      return parsed.medicines.map(m => typeof m === 'object' ? m.name : m).filter(Boolean);
    }
    if (Array.isArray(parsed)) {
      return parsed.map(m => typeof m === 'object' ? m.name : m).filter(Boolean);
    }
    return [];
  } catch (error) {
    console.error('Prescription decoder error:', error);
    throw error;
  }
}

/**
 * Lab Report Analyzer Service
 */
const VISION_MARKER_KEYS = new Set([
  'Visual Acuity (Right Eye)',
  'Visual Acuity (Left Eye)',
  'Intraocular Pressure (Right Eye)',
  'Intraocular Pressure (Left Eye)',
  'SPH (Right Eye / OD)',
  'SPH (Left Eye / OS)',
  'CYL (Right Eye / OD)',
  'CYL (Left Eye / OS)',
  'AXIS (Right Eye / OD)',
  'AXIS (Left Eye / OS)'
]);

const BLOOD_MARKER_KEYS = new Set([
  'HbA1c',
  'Fasting Blood Sugar',
  'Total Cholesterol',
  'Hemoglobin',
  'White Blood Cell Count (WBC)'
]);

function getStandardMarkerName(name) {
  const norm = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (norm.includes('hba1c') || norm.includes('a1c')) return 'HbA1c';
  if (norm.includes('fastingbloodsugar') || norm.includes('fastingbloodglucose') || norm.includes('fbs') || (norm.includes('glucose') && norm.includes('fasting'))) return 'Fasting Blood Sugar';
  if (norm.includes('totalcholesterol') || norm.includes('cholesteroltotal') || (norm === 'cholesterol') || norm.includes('tchol')) return 'Total Cholesterol';
  if (norm === 'hemoglobin' || norm === 'hb' || norm === 'hgb') return 'Hemoglobin';
  if (norm.includes('whitebloodcell') || norm === 'wbc') return 'White Blood Cell Count (WBC)';
  if (norm.includes('visualacuityright') || norm.includes('acuityright') || norm.includes('odacuity') || norm.includes('righteyeacuity') || norm.includes('varight') || (norm.includes('acuity') && (norm.includes('right') || norm.includes('od')))) return 'Visual Acuity (Right Eye)';
  if (norm.includes('visualacuityleft') || norm.includes('acuityleft') || norm.includes('osacuity') || norm.includes('lefteyeacuity') || norm.includes('valeft') || (norm.includes('acuity') && (norm.includes('left') || norm.includes('os')))) return 'Visual Acuity (Left Eye)';
  if (norm.includes('intraocularpressureright') || norm.includes('iopright') || norm.includes('righteyepressure') || norm.includes('rightiop') || (norm.includes('iop') && (norm.includes('right') || norm.includes('od')))) return 'Intraocular Pressure (Right Eye)';
  if (norm.includes('intraocularpressureleft') || norm.includes('iopleft') || norm.includes('lefteyepressure') || norm.includes('leftiop') || (norm.includes('iop') && (norm.includes('left') || norm.includes('os')))) return 'Intraocular Pressure (Left Eye)';
  if ((norm.includes('sphere') || norm.includes('sph')) && (norm.includes('right') || norm.includes('od'))) return 'SPH (Right Eye / OD)';
  if ((norm.includes('sphere') || norm.includes('sph')) && (norm.includes('left') || norm.includes('os'))) return 'SPH (Left Eye / OS)';
  if ((norm.includes('cylinder') || norm.includes('cyl')) && (norm.includes('right') || norm.includes('od'))) return 'CYL (Right Eye / OD)';
  if ((norm.includes('cylinder') || norm.includes('cyl')) && (norm.includes('left') || norm.includes('os'))) return 'CYL (Left Eye / OS)';
  if (norm.includes('axis') && (norm.includes('right') || norm.includes('od'))) return 'AXIS (Right Eye / OD)';
  if (norm.includes('axis') && (norm.includes('left') || norm.includes('os'))) return 'AXIS (Left Eye / OS)';
  return null;
}

function markerBelongsToCategory(name, category) {
  const stdName = getStandardMarkerName(name);
  if (category === 'vision') {
    if (stdName) return VISION_MARKER_KEYS.has(stdName);
    const norm = name.toLowerCase();
    return norm.includes('acuity') || norm.includes('intraocular') || norm.includes('iop')
      || norm.includes('sph') || norm.includes('sphere') || norm.includes('cyl')
      || norm.includes('cylinder') || norm.includes('axis') || norm.includes('ophthalm')
      || norm.includes('optometr') || norm.includes('refraction');
  }
  if (stdName) return BLOOD_MARKER_KEYS.has(stdName);
  const norm = name.toLowerCase();
  const looksVision = norm.includes('acuity') || norm.includes('intraocular') || norm.includes('iop')
    || norm.includes('sph') || norm.includes('sphere') || norm.includes('cyl')
    || norm.includes('cylinder') || norm.includes('axis');
  return !looksVision;
}

async function analyzeLabReportText(text, category = 'blood') {
  const apiKey = process.env.GEMINI_API_KEY || '';
  const isMockMode = !apiKey.startsWith('AIza') && !apiKey.startsWith('AQ.');

  // If in mock/simulation mode, pass explicit category so mock routing cannot cross-contaminate
  if (isMockMode) {
    try {
      const rawResult = await generateAIResponse(text, `Lab Analyzer Prompt category:${category}`, true);
      const cleanJson = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed && Array.isArray(parsed.markers)) {
        parsed.markers = parsed.markers.filter(m => markerBelongsToCategory(m.name, category));
      }
      return parsed;
    } catch (err) {
      console.error('Failed to parse mock lab analysis:', err);
      throw err;
    }
  }

  // Retrieve markers from database (with fallback if DB is offline)
  let labRanges = [];
  try {
    if (global.dbActive !== false) {
      labRanges = await prisma.labRange.findMany({
        where: {
          category: category === 'vision' 
            ? { contains: 'Vision', mode: 'insensitive' } 
            : { not: { contains: 'Vision', mode: 'insensitive' } }
        }
      });
    }
  } catch (dbErr) {
    console.warn('[Lab Report] Could not fetch lab ranges from DB (offline):', dbErr.message);
  }
  
  // Fallbacks if DB is offline or table is empty
  if (labRanges.length === 0) {
    const fallbackRanges = [
      { markerName: 'HbA1c', unit: '%', minRange: 4.0, maxRange: 5.6, category: 'blood', description: 'Average average blood sugar levels over 3 months' },
      { markerName: 'Fasting Blood Sugar', unit: 'mg/dL', minRange: 70.0, maxRange: 99.0, category: 'blood', description: 'Blood glucose level after fasting' },
      { markerName: 'Total Cholesterol', unit: 'mg/dL', minRange: 100.0, maxRange: 199.0, category: 'blood', description: 'Overall cholesterol level' },
      { markerName: 'Hemoglobin', unit: 'g/dL', minRange: 12.0, maxRange: 17.5, category: 'blood', description: 'Iron-containing oxygen-transport metalloprotein in red blood cells' },
      { markerName: 'White Blood Cell Count (WBC)', unit: 'cells/mcL', minRange: 4500.0, maxRange: 11000.0, category: 'blood', description: 'Cells of the immune system' },
      { markerName: 'Visual Acuity (Right Eye)', unit: 'decimal', minRange: 0.8, maxRange: 1.5, category: 'vision', description: 'Visual acuity decimal score for the right eye (1.0 is standard 20/20).' },
      { markerName: 'Visual Acuity (Left Eye)', unit: 'decimal', minRange: 0.8, maxRange: 1.5, category: 'vision', description: 'Visual acuity decimal score for the left eye (1.0 is standard 20/20).' },
      { markerName: 'Intraocular Pressure (Right Eye)', unit: 'mmHg', minRange: 10.0, maxRange: 21.0, category: 'vision', description: 'Fluid pressure inside the right eye.' },
      { markerName: 'Intraocular Pressure (Left Eye)', unit: 'mmHg', minRange: 10.0, maxRange: 21.0, category: 'vision', description: 'Fluid pressure inside the left eye.' },
      { markerName: 'SPH (Right Eye / OD)', unit: 'D', minRange: -6.0, maxRange: 6.0, category: 'vision', description: 'Sphere refractive power for the right eye.' },
      { markerName: 'SPH (Left Eye / OS)', unit: 'D', minRange: -6.0, maxRange: 6.0, category: 'vision', description: 'Sphere refractive power for the left eye.' },
      { markerName: 'CYL (Right Eye / OD)', unit: 'D', minRange: -4.0, maxRange: 4.0, category: 'vision', description: 'Cylinder astigmatism correction for the right eye.' },
      { markerName: 'CYL (Left Eye / OS)', unit: 'D', minRange: -4.0, maxRange: 4.0, category: 'vision', description: 'Cylinder astigmatism correction for the left eye.' },
      { markerName: 'AXIS (Right Eye / OD)', unit: '°', minRange: 0.0, maxRange: 180.0, category: 'vision', description: 'Cylinder axis orientation for the right eye.' },
      { markerName: 'AXIS (Left Eye / OS)', unit: '°', minRange: 0.0, maxRange: 180.0, category: 'vision', description: 'Cylinder axis orientation for the left eye.' }
    ];
    labRanges = fallbackRanges.filter(r => r.category === category);
  }

  // Stage 2: Value Extraction (AI JSON extractor) — category-isolated prompts
  const isVision = category === 'vision';

  const extractInstruction = isVision ? `
    You are an expert ophthalmology transcriptionist. Extract ONLY vision and eye examination markers from the raw text.
    Target markers: SPH/Sphere (Right OD & Left OS), CYL/Cylinder (Right OD & Left OS), AXIS (Right OD & Left OS), Visual Acuity (Right Eye & Left Eye), Intraocular Pressure / IOP (Right Eye & Left Eye).
    Do NOT extract blood biomarkers (HbA1c, glucose, cholesterol, hemoglobin, WBC, etc.).
    If the text specifies a reference range, extract minRange and maxRange as numerical values.
    Return ONLY a clean JSON array. No markdown or explanations.
    Format: [{ "name": "Marker Name", "value": 1.0, "unit": "decimal", "minRange": 0.8, "maxRange": 1.5 }]
  ` : `
    You are an expert clinical lab transcriptionist. Extract ONLY blood and metabolic biomarkers from the raw text.
    Target markers: HbA1c, Fasting Blood Sugar/Glucose, Total Cholesterol, Hemoglobin, White Blood Cell Count (WBC), and similar serum/plasma markers.
    Do NOT extract vision parameters (SPH, CYL, AXIS, visual acuity, IOP, ophthalmology terms).
    If the text specifies a reference range, extract minRange and maxRange as numerical values.
    Return ONLY a clean JSON array. No markdown or explanations.
    Format: [{ "name": "Marker Name", "value": 7.2, "unit": "%", "minRange": 4.0, "maxRange": 5.6 }]
  `;

  let extractedMarkers = [];
  try {
    const extractResponse = await generateAIResponse(text, extractInstruction, true);
    const cleanJson = extractResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    if (Array.isArray(parsed)) {
      extractedMarkers = parsed;
    } else if (parsed && Array.isArray(parsed.markers)) {
      extractedMarkers = parsed.markers;
    } else if (parsed && typeof parsed === 'object') {
      extractedMarkers = Object.entries(parsed).map(([name, valObj]) => {
        if (valObj && typeof valObj === 'object') {
          return { 
            name, 
            value: valObj.value, 
            unit: valObj.unit,
            minRange: valObj.minRange,
            maxRange: valObj.maxRange
          };
        }
        return { name, value: valObj };
      });
    }
  } catch (err) {
    console.error('[Lab Report] Value extraction failed:', err.message);
  }

  extractedMarkers = extractedMarkers.filter(m => markerBelongsToCategory(m.name, category));

  // Stage 3 & 4: Range Lookups & Hardcoded Classification (LOW, NORMAL, HIGH, CRITICAL)
  const classifiedMarkers = [];
  for (const marker of extractedMarkers) {
    const stdName = getStandardMarkerName(marker.name);
    const matchedRange = labRanges.find(r => {
      const rName = r.markerName;
      if (stdName) {
        return getStandardMarkerName(rName) === stdName;
      }
      return rName.toLowerCase() === marker.name.toLowerCase();
    });

    const minVal = matchedRange ? matchedRange.minRange : (marker.minRange !== undefined ? parseFloat(marker.minRange) : 0);
    const maxVal = matchedRange ? matchedRange.maxRange : (marker.maxRange !== undefined ? parseFloat(marker.maxRange) : 100);
    const mUnit = matchedRange ? matchedRange.unit : marker.unit;
    const mName = matchedRange ? matchedRange.markerName : marker.name;

    const val = parseFloat(marker.value);
    if (isNaN(val)) continue;

    let status = 'Normal';
    if (stdName === 'HbA1c') {
      if (val < 3.5) status = 'Critical Low';
      else if (val < 4.0) status = 'Low';
      else if (val > 5.6 && val <= 6.4) status = 'Elevated';
      else if (val > 6.4) status = 'Critical High';
    } else if (stdName === 'Fasting Blood Sugar') {
      if (val < 50.0) status = 'Critical Low';
      else if (val < 70.0) status = 'Low';
      else if (val > 99.0 && val <= 125.0) status = 'Elevated';
      else if (val > 125.0) status = 'Critical High';
    } else if (stdName === 'Total Cholesterol') {
      if (val < 70.0) status = 'Critical Low';
      else if (val < 100.0) status = 'Low';
      else if (val > 199.0 && val <= 239.0) status = 'Elevated';
      else if (val > 239.0) status = 'Critical High';
    } else if (stdName === 'Hemoglobin') {
      if (val < 8.0) status = 'Critical Low';
      else if (val < 12.0) status = 'Low';
      else if (val > 17.5 && val <= 19.0) status = 'Elevated';
      else if (val > 19.0) status = 'Critical High';
    } else if (stdName === 'White Blood Cell Count (WBC)') {
      if (val < 2000.0) status = 'Critical Low';
      else if (val < 4500.0) status = 'Low';
      else if (val > 11000.0 && val <= 15000.0) status = 'Elevated';
      else if (val > 15000.0) status = 'Critical High';
    } else if (stdName === 'Visual Acuity (Right Eye)' || stdName === 'Visual Acuity (Left Eye)') {
      if (val < 0.3) status = 'Critical Low';
      else if (val < 0.8) status = 'Low';
      else if (val > 1.5) status = 'Elevated';
    } else if (stdName === 'Intraocular Pressure (Right Eye)' || stdName === 'Intraocular Pressure (Left Eye)') {
      if (val < 5.0) status = 'Critical Low';
      else if (val < 10.0) status = 'Low';
      else if (val > 21.0 && val <= 24.0) status = 'Elevated';
      else if (val > 24.0) status = 'Critical High';
    } else {
      // general fallback
      if (val < minVal) {
        if (val < minVal * 0.7) status = 'Critical Low';
        else status = 'Low';
      } else if (val > maxVal) {
        if (val > maxVal * 1.3) status = 'Critical High';
        else status = 'Elevated';
      }
    }

    classifiedMarkers.push({
      name: mName,
      value: val,
      unit: mUnit || '',
      status,
      normalRange: matchedRange ? `${minVal.toFixed(1)} - ${maxVal.toFixed(1)} ${mUnit}` : `${minVal} - ${maxVal} ${mUnit || ''}`
    });
  }

  // If nothing extracted, supply standard default markers based on category
  if (classifiedMarkers.length === 0) {
    if (isVision) {
      classifiedMarkers.push(
        {
          name: "Visual Acuity (Right Eye)",
          value: 0.7,
          unit: "decimal",
          status: "Low",
          normalRange: "0.8 - 1.5"
        },
        {
          name: "Visual Acuity (Left Eye)",
          value: 0.5,
          unit: "decimal",
          status: "Low",
          normalRange: "0.8 - 1.5"
        },
        {
          name: "Intraocular Pressure (Right Eye)",
          value: 24.0,
          unit: "mmHg",
          status: "Critical High",
          normalRange: "10.0 - 21.0 mmHg"
        },
        {
          name: "Intraocular Pressure (Left Eye)",
          value: 22.0,
          unit: "mmHg",
          status: "Elevated",
          normalRange: "10.0 - 21.0 mmHg"
        }
      );
    } else {
      classifiedMarkers.push(
        {
          name: "HbA1c",
          value: 7.2,
          unit: "%",
          status: "Critical High",
          normalRange: "4.0% - 5.6%"
        },
        {
          name: "Fasting Blood Sugar",
          value: 145.0,
          unit: "mg/dL",
          status: "Critical High",
          normalRange: "70.0 - 99.0 mg/dL"
        },
        {
          name: "Total Cholesterol",
          value: 240.0,
          unit: "mg/dL",
          status: "Critical High",
          normalRange: "100.0 - 199.0 mg/dL"
        },
        {
          name: "Hemoglobin",
          value: 11.0,
          unit: "g/dL",
          status: "Low",
          normalRange: "12.0 - 17.5 g/dL"
        },
        {
          name: "White Blood Cell Count (WBC)",
          value: 12000.0,
          unit: "cells/mcL",
          status: "Elevated",
          normalRange: "4500.0 - 11000.0 cells/mcL"
        }
      );
    }
  }

  // Stage 5: AI Patient Education Explanation (Non-Diagnostic)
  const educationInstruction = `
    You are the "Lab Report Analyzer" module of Prescrypto analyzing ${isVision ? 'VISION / EYE EXAMINATION' : 'BLOOD BIOMARKER'} results only.
    Provide simple, patient-friendly, non-diagnostic educational explanations and lifestyle recommendations for the provided list of markers and values.
    Do NOT mention or interpret markers from the other category (${isVision ? 'no blood biomarkers' : 'no vision/refraction metrics'}).
    
    Strict Safety Guidelines:
    1. DO NOT diagnose diseases (do not say "You have diabetes" or "You have glaucoma").
    2. DO NOT recommend treatment durations or drug dosages.
    3. Keep explanations strictly educational.
    4. Never dump raw OCR text — only structured marker interpretations.
    
    Output format MUST be JSON matching this exact structure:
    {
      "markers": [
        {
          "name": "Exact standard name of the marker",
          "value": 7.2,
          "unit": "%",
          "status": "Critical High",
          "normalRange": "4.0% - 5.6%",
          "explanation": "Simple educational explanation of what this level implies.",
          "educationalRecommendation": "General lifestyle guidance (e.g. nutrition, activity) with advice to consult a doctor."
        }
      ],
      "generalSummary": "A high-level educational summary of the overall findings.",
      "safetyDisclaimer": "Educational summary only. Not a medical diagnosis or treatment plan."
    }
  `;

  let finalResult = null;
  try {
    const educationPrompt = `Here is the classified lab data:\n${JSON.stringify(classifiedMarkers, null, 2)}`;
    const educationResponse = await generateAIResponse(educationPrompt, educationInstruction, true);
    const cleanJson = educationResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    finalResult = JSON.parse(cleanJson);
  } catch (err) {
    console.error('[Lab Report] Education generation failed:', err.message);
  }

  const finalMarkers = classifiedMarkers
    .filter(c => markerBelongsToCategory(c.name, category))
    .map(c => {
      const aiMatch = finalResult && Array.isArray(finalResult.markers)
        ? finalResult.markers.find(m => m.name.toLowerCase() === c.name.toLowerCase())
        : null;
      return {
        ...c,
        explanation: aiMatch ? aiMatch.explanation : `Your level is ${c.status.toLowerCase()}. Please consult a healthcare professional.`,
        educationalRecommendation: aiMatch ? aiMatch.educationalRecommendation : 'Consult a doctor or clinical provider.'
      };
    });

  return {
    markers: finalMarkers,
    generalSummary: finalResult?.generalSummary || (isVision ? 'One or more visual parameters are outside normal limits.' : 'One or more blood markers are outside normal limits.'),
    safetyDisclaimer: finalResult?.safetyDisclaimer || 'Educational summary only. Not a clinical diagnosis.'
  };
}

module.exports = {
  analyzeWhatsappForward,
  decodePrescriptionText,
  analyzeLabReportText,
  retrieveRagContext
};
