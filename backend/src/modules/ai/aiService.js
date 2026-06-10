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

  const systemInstruction = `
    You are the "WhatsApp Medical Misinformation Scanner" module of Prescrypto.
    Analyze the user's WhatsApp forward for health claims, fear-mongering, and medical accuracy.
    You must follow these rules strictly:
    1. Do not diagnose illnesses or recommend specific pharmaceuticals.
    2. Assess if the text contains high levels of fear/panic-manipulating keywords.
    3. Look for "dangerous remedies" (e.g. self-medicating, toxic chemicals, rejecting clinical vaccines).
    4. Base your corrections on the verified sources provided in the context below. If context does not match, rely on established guidelines from WHO, CDC, and NIH.
    5. Output JSON only. No markdown formatting around JSON.
    
    Verified Context to use:
    ${context || 'No specific database matches found. Rely on established CDC/WHO standards.'}

    Output format MUST be JSON matching this exact structure:
    {
      "classification": "False" | "Misleading" | "Dangerous" | "True",
      "originalClaim": "Summarized main claim",
      "confidenceScore": 90.5, (0-100 score based on evidence)
      "fearScore": 75.0, (0-100 score on how panic-inducing the language is)
      "isDangerous": true/false, (true if encouraging toxic remedies or blocking critical care)
      "correctionText": "Clear, plain-language correction statement citing authorities.",
      "whatsappCorrectionTemplate": "A compact copy-pasteable WhatsApp message debunking this. Use emojis, start with 🚨 FACT CHECK, show the myth, list 3 quick bulleted truths, and cite WHO/CDC.",
      "dangerousRemedyAlert": "Short alert message if toxic remedy found, else null"
    }
  `;

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
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Prescription decoder error:', error);
    throw error;
  }
}

/**
 * Lab Report Analyzer Service
 */
async function analyzeLabReportText(text) {
  // Retrieve markers from database (with fallback if DB is offline)
  let labRanges = [];
  try {
    if (global.dbActive !== false) {
      labRanges = await prisma.labRange.findMany();
    }
  } catch (dbErr) {
    console.warn('[Lab Report] Could not fetch lab ranges from DB (offline):', dbErr.message);
  }
  
  const rangesContext = labRanges.map(r => 
    `Marker: ${r.markerName}, Unit: ${r.unit}, Normal Range: ${r.minRange}-${r.maxRange}, Category: ${r.category}, Info: ${r.description}`
  ).join('\n');

  const systemInstruction = `
    You are the "Lab Report Analyzer" module of Prescrypto.
    Compare the text from the lab report image against reference ranges.
    Strict Safety Guidelines:
    1. DO NOT diagnose diseases (e.g., do not say 'You have kidney failure').
    2. Identify markers in the text (like HbA1c, Cholesterol, Glucose, Hemoglobin, WBC).
    3. For each identified marker, extract the user's value and unit, and match it against the reference ranges.
    4. Highlight whether they are Normal, Elevated, or Low.
    5. Provide basic educational explanations of what the marker represents.

    Reference Lab Ranges:
    ${rangesContext}

    Output format MUST be JSON matching this exact structure:
    {
      "markers": [
        {
          "name": "Marker Name (e.g. HbA1c)",
          "value": 6.8,
          "unit": "%",
          "status": "Normal" | "Elevated" | "Low",
          "normalRange": "4.0% - 5.6%",
          "explanation": "Simple explanation of what this level implies.",
          "educationalRecommendation": "General lifestyle guidance (e.g. low-carb diet) with advice to contact a clinic."
        }
      ],
      "generalSummary": "A high-level educational summary of the overall findings.",
      "safetyDisclaimer": "Educational summary only. Not a medical diagnosis or treatment plan."
    }
  `;

  try {
    const rawResult = await generateAIResponse(text, systemInstruction, true);
    const cleanJson = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Lab report analyzer error:', error);
    throw error;
  }
}

module.exports = {
  analyzeWhatsappForward,
  decodePrescriptionText,
  analyzeLabReportText,
  retrieveRagContext
};
