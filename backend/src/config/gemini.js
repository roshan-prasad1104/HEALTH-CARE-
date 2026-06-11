const { GoogleGenerativeAI } = require('@google/generative-ai');

// Check if Gemini API key exists
const apiKey = process.env.GEMINI_API_KEY || '';

// Detect key type:
// - AIza... = Standard Gemini AI Studio key (use @google/generative-ai SDK)
// - AQ....  = Google Cloud / Pro-tier OAuth-based key (use REST API directly)
// - empty   = No key, use simulation mode
const isAizaKey   = apiKey.startsWith('AIza');
const isAqKey     = apiKey.startsWith('AQ.');
const isMockMode  = !isAizaKey && !isAqKey;

if (isAizaKey) {
  console.log('[AI] AIza-format Gemini API key detected — using Gemini SDK.');
} else if (isAqKey) {
  console.log('[AI] AQ-format key detected (Pro/Cloud account) — using Gemini REST API.');
} else {
  console.log('[AI] No valid Gemini API key found — running in enhanced simulation mode.');
}

// Standard SDK client (for AIza keys only)
let genAI = null;
if (isAizaKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

// Fallback AI models (Simulated / Mocks for hackathon & standalone demo run)
const simulatedFallbacks = {
  openai: async (prompt, systemInstruction) => {
    console.log('[AI Fallback] Routed to OpenAI API (Simulated)');
    return simulateAiOutput(prompt, systemInstruction, 'gpt-4o');
  },
  claude: async (prompt, systemInstruction) => {
    console.log('[AI Fallback] Routed to Claude API (Simulated)');
    return simulateAiOutput(prompt, systemInstruction, 'claude-3-5-sonnet');
  }
};

/**
 * Call Gemini via REST API (works for AQ. Pro/Cloud keys using Bearer token auth)
 */
async function callGeminiRest(prompt, systemInstruction, formatJson) {
  const https = require('https');
  const model = 'gemini-1.5-flash';

  // AQ. keys are OAuth2 access tokens — use Authorization: Bearer header
  // NOT the ?key= query parameter (which is only for AIza keys)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const fullPrompt = systemInstruction
    ? `System Instructions:\n${systemInstruction}\n\nUser Request:\n${prompt}`
    : prompt;

  const body = JSON.stringify({
    contents: [{ parts: [{ text: fullPrompt }] }],
    ...(formatJson ? {
      generationConfig: { responseMimeType: 'application/json' }
    } : {})
  });

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization': `Bearer ${apiKey}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            console.error('[AI REST] API Error:', parsed.error.message, '(code:', parsed.error.code, ')');
            reject(new Error(`Gemini REST Error ${parsed.error.code}: ${parsed.error.message}`));
          } else {
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
            resolve(text);
          }
        } catch (e) {
          reject(new Error('Failed to parse Gemini REST response: ' + e.message));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}


/**
 * Block dangerous queries related to diagnosis or prescription requests
 */
function checkSafetyLimits(prompt) {
  const lowercasePrompt = prompt.toLowerCase();
  
  // Strict block words
  const diagnosisTriggers = ['diagnose me', 'what disease do i have', 'do i have cancer', 'diagnose my chest pain'];
  const prescriptionTriggers = ['write me a prescription', 'prescribe me', 'buy xanax without prescription', 'give me dosage for'];

  for (const trigger of diagnosisTriggers) {
    if (lowercasePrompt.includes(trigger)) {
      return {
        safe: false,
        reason: "Diagnosis Blocked: The platform cannot diagnose diseases. Please consult a qualified health professional.",
        code: "DIAGNOSIS_BLOCKED"
      };
    }
  }

  for (const trigger of prescriptionTriggers) {
    if (lowercasePrompt.includes(trigger)) {
      return {
        safe: false,
        reason: "Prescription Blocked: The platform cannot prescribe medicines or direct dosages. Please consult a physician.",
        code: "PRESCRIPTION_BLOCKED"
      };
    }
  }

  return { safe: true };
}

/**
 * Execute a query with Gemini, with structured safety & fallback support
 */
async function generateAIResponse(prompt, systemInstruction = '', formatJson = false) {
  // 1. Safety check
  const safetyCheck = checkSafetyLimits(prompt);
  if (!safetyCheck.safe) {
    return JSON.stringify({
      error: safetyCheck.reason,
      code: safetyCheck.code,
      safetyTriggered: true,
      confidenceScore: 0
    });
  }

  // 2. Simulation mode — no valid key
  if (isMockMode) {
    console.log('[AI] Running in enhanced simulation mode');
    return await simulateAiOutput(prompt, systemInstruction, 'gemini-1.5-flash');
  }

  // 3a. Live call using standard SDK (AIza keys)
  if (isAizaKey) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: formatJson ? { responseMimeType: 'application/json' } : undefined
      });

      const fullPrompt = systemInstruction
        ? `System Instructions:\n${systemInstruction}\n\nUser Request:\n${prompt}`
        : prompt;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('[AI SDK Error] Falling back to simulation:', error.message);
      return await simulateAiOutput(prompt, systemInstruction, 'gemini-1.5-flash');
    }
  }

  // 3b. Live call using REST API (AQ. keys — Pro/Cloud accounts)
  if (isAqKey) {
    try {
      console.log('[AI] Calling Gemini REST API with AQ key...');
      const text = await callGeminiRest(prompt, systemInstruction, formatJson);
      console.log('[AI] Gemini REST call successful');
      return text;
    } catch (error) {
      console.error('[AI REST Error]', error.message, '— falling back to simulation');
      return await simulateAiOutput(prompt, systemInstruction, 'gemini-1.5-flash');
    }
  }

  // Safety net
  return await simulateAiOutput(prompt, systemInstruction, 'gemini-1.5-flash');
}

/**
 * Simulate AI outputs for offline/keyless testing or fallbacks
 */


async function simulateAiOutput(prompt, systemInstruction, modelName) {
  // Short delay to mimic API latency
  await new Promise(resolve => setTimeout(resolve, 800));

  // Check if it is a translation request
  const sysLower = (systemInstruction || '').toLowerCase();
  if (sysLower.includes('translator') || sysLower.includes('translate')) {
    let targetLanguage = 'Hindi';
    const langMatch = systemInstruction.match(/regional language:\s*([a-zA-Z\s]+)/i) || 
                      systemInstruction.match(/into\s+the\s+([a-zA-Z\s]+)/i) || 
                      systemInstruction.match(/into\s+([a-zA-Z\s]+)/i);
    if (langMatch && langMatch[1]) {
      targetLanguage = langMatch[1].trim().replace(/\.$/, '');
    }

    try {
      const parsed = JSON.parse(prompt);
      const mockTranslateJson = (obj) => {
        if (typeof obj === 'string') {
          if (obj.trim().startsWith('{') || obj.trim().startsWith('[')) {
            try {
              const innerObj = JSON.parse(obj);
              return JSON.stringify(mockTranslateJson(innerObj));
            } catch (e) {}
          }
          return `[${targetLanguage}] ${obj}`;
        }
        if (Array.isArray(obj)) {
          return obj.map(mockTranslateJson);
        }
        if (typeof obj === 'object' && obj !== null) {
          const res = {};
          for (const [k, v] of Object.entries(obj)) {
            if (['name', 'genericName', 'unit', 'value', 'url', 'sourceUrl', 'ocrSource', 'ocrConfidence', 'id', 'isDangerous', 'confidenceScore', 'fearScore'].includes(k)) {
              res[k] = v;
            } else {
              res[k] = mockTranslateJson(v);
            }
          }
          return res;
        }
        return obj;
      };
      return JSON.stringify(mockTranslateJson(parsed));
    } catch (e) {
      return `[${targetLanguage}] ${prompt}`;
    }
  }

  const promptLower = prompt.toLowerCase();

  // Scenario 1: WhatsApp forward misinformation detection
  if (systemInstruction.includes('whatsapp') || systemInstruction.includes('misinformation') || systemInstruction.includes('scanner') ||
      promptLower.includes('cure') || promptLower.includes('cures') || promptLower.includes('treat') ||
      promptLower.includes('covid') || promptLower.includes('garlic') || promptLower.includes('beer') ||
      promptLower.includes('microwave') || promptLower.includes('cancer') || promptLower.includes('diabetes') ||
      promptLower.includes('blood pressure') || promptLower.includes('insomnia') || promptLower.includes('ayurveda') ||
      promptLower.includes('natural remedy') || promptLower.includes('home remedy') || promptLower.includes('myth') ||
      promptLower.includes('forward') || promptLower.includes('share') || promptLower.includes('doctors hide')) {

    let claim = prompt.trim();
    if (claim.length > 200) {
      claim = claim.substring(0, 197) + "...";
    }

    // ─── Comprehensive Health Myth Pattern Database ───────────────────────────
    const mythPatterns = [
      // Alcohol / Beer health myths
      {
        keywords: ['beer', 'alcohol', 'wine', 'whisky', 'vodka', 'rum'],
        secondaryKeywords: ['blood pressure', 'heart', 'healthy', 'good for', 'help', 'benefit', 'cures', 'sleep', 'insomnia'],
        classification: "Misleading",
        fearScore: 35.0,
        isDangerous: false,
        correctionText: "Moderate alcohol consumption has been associated with certain cardiovascular markers in some observational studies, but the overall scientific consensus is that no 'safe' level of alcohol consumption is beneficial for health. Alcohol is classified as a Group 1 carcinogen by the WHO. Regular consumption, even in small amounts, increases risks of liver disease, several cancers, and mental health disorders. It does NOT reliably treat blood pressure or improve sleep quality — it disrupts REM sleep cycles.",
        bulletPoints: [
          "WHO classifies alcohol as a Group 1 carcinogen — there is no safe dose for cancer prevention.",
          "Alcohol suppresses deep (REM) sleep, causing poorer sleep quality despite initial drowsiness.",
          "Short-term blood pressure reduction from alcohol is followed by rebound hypertension."
        ],
        sources: [
          { claimText: "No safe level of alcohol consumption exists for health, per WHO Global Status Report on Alcohol 2023.", sourceName: "World Health Organization (WHO)", sourceUrl: "https://www.who.int/news-room/fact-sheets/detail/alcohol" },
          { claimText: "Alcohol consumption is associated with risk of 7 different cancers including breast and colon cancer.", sourceName: "International Agency for Research on Cancer", sourceUrl: "https://www.iarc.who.int" }
        ]
      },
      // Garlic / Ginger COVID cures
      {
        keywords: ['garlic', 'ginger', 'turmeric', 'neem', 'tulsi', 'ashwagandha'],
        secondaryKeywords: ['cure', 'cures', 'covid', 'coronavirus', 'virus', 'immunity', 'fight', 'kill', 'prevent'],
        classification: "False & Dangerous",
        fearScore: 82.0,
        isDangerous: true,
        correctionText: "While garlic, ginger, turmeric, neem, and tulsi have antioxidant and anti-inflammatory properties, there is NO clinical evidence that any of these herbs alone can cure or prevent COVID-19, influenza, or similar viral infections. Relying exclusively on these remedies instead of seeking medical advice — particularly for high-risk populations — is dangerous and can lead to severe complications.",
        bulletPoints: [
          "Herbs like garlic and ginger are healthy dietary additives but are NOT antivirals against COVID-19.",
          "No randomized controlled trial has shown any herbal remedy cures acute viral infections.",
          "Delaying evidence-based treatment (antivirals, supportive care) in favor of herbs is life-threatening."
        ],
        sources: [
          { claimText: "No herbal supplement has been proven to prevent or cure COVID-19.", sourceName: "WHO Myth Busters Guide", sourceUrl: "https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters" },
          { claimText: "Garlic is a healthy food that may have antimicrobial properties, but it has not been proven to protect against COVID-19.", sourceName: "Centers for Disease Control and Prevention (CDC)", sourceUrl: "https://www.cdc.gov" }
        ]
      },
      // Lemon / Vitamin C cancer myths
      {
        keywords: ['lemon', 'citrus', 'vitamin c', 'alkaline', 'baking soda'],
        secondaryKeywords: ['cancer', 'tumor', 'kills cancer', 'cures cancer', 'prevent cancer', 'alkaline body'],
        classification: "False & Dangerous",
        fearScore: 78.0,
        isDangerous: true,
        correctionText: "Claims that lemon juice, alkaline water, or baking soda can kill cancer cells or create an 'alkaline environment' that cancer cannot survive in are scientifically false. The body tightly regulates blood pH regardless of what you eat. The body's pH cannot be meaningfully altered through diet. Cancer requires oncological treatment (surgery, chemotherapy, radiation, immunotherapy) — delaying proper care in favor of dietary myths is extremely dangerous.",
        bulletPoints: [
          "Blood pH is regulated by the lungs and kidneys — food cannot make your body 'alkaline'.",
          "No food or drink has been clinically proven to kill cancer cells in humans.",
          "Delaying cancer treatment in favor of dietary myths significantly worsens survival outcomes."
        ],
        sources: [
          { claimText: "Cancer cells can survive in a range of pH levels; the alkaline diet cannot change blood pH.", sourceName: "Cancer Research UK", sourceUrl: "https://www.cancerresearchuk.org/about-cancer/myths-about-cancer" },
          { claimText: "No evidence supports dietary pH manipulation as cancer treatment.", sourceName: "National Cancer Institute (NCI)", sourceUrl: "https://www.cancer.gov" }
        ]
      },
      // Microwave myths
      {
        keywords: ['microwave'],
        secondaryKeywords: ['cancer', 'radiation', 'dangerous', 'kills nutrients', 'destroy', 'harmful'],
        classification: "Misleading",
        fearScore: 42.0,
        isDangerous: false,
        correctionText: "Microwaves use non-ionizing radiation (similar to radio waves) which does not make food radioactive or cause cancer. While all cooking methods reduce some nutrients, microwave cooking often preserves nutrients better than boiling due to shorter cooking times and less water. The WHO, FDA, and international health authorities consider microwave ovens safe for food preparation when used as directed.",
        bulletPoints: [
          "Microwave radiation is non-ionizing — it cannot alter DNA or cause cancer.",
          "Microwave cooking can actually preserve nutrients better than boiling because it's faster and uses less water.",
          "Use only microwave-safe containers to avoid plastics leaching chemicals into food."
        ],
        sources: [
          { claimText: "Microwave ovens, when used correctly, are safe and do not render food radioactive or carcinogenic.", sourceName: "World Health Organization (WHO) Food Safety", sourceUrl: "https://www.who.int/news-room/q-a-detail/food-safety-microwave-ovens" },
          { claimText: "There is no evidence that microwaving food increases cancer risk.", sourceName: "American Cancer Society", sourceUrl: "https://www.cancer.org" }
        ]
      },
      // Blood pressure myths
      {
        keywords: ['blood pressure', 'hypertension', 'bp'],
        secondaryKeywords: ['cure', 'lower', 'control', 'natural', 'home remedy', 'without medicine', 'stop medication'],
        classification: "Misleading",
        fearScore: 55.0,
        isDangerous: true,
        correctionText: "While lifestyle changes (low-sodium diet, exercise, stress management, limiting alcohol) can significantly help manage blood pressure, stopping prescribed antihypertensive medications without consulting a doctor is extremely dangerous. Uncontrolled hypertension is a major risk factor for stroke, heart attack, and kidney failure. Natural approaches should complement — not replace — medically prescribed treatment plans.",
        bulletPoints: [
          "Do NOT stop prescribed blood pressure medication without consulting your doctor.",
          "Lifestyle modifications (exercise, diet) can help but rarely replace medication for moderate-to-severe hypertension.",
          "Uncontrolled high blood pressure silently damages kidneys, eyes, and arteries over time."
        ],
        sources: [
          { claimText: "Hypertension management requires both lifestyle changes AND medication for most patients.", sourceName: "American Heart Association (AHA)", sourceUrl: "https://www.heart.org/en/health-topics/high-blood-pressure" },
          { claimText: "Stopping antihypertensive medication suddenly can cause dangerous rebound hypertension.", sourceName: "NIH National Heart, Lung, and Blood Institute", sourceUrl: "https://www.nhlbi.nih.gov" }
        ]
      },
      // Diabetes myths
      {
        keywords: ['diabetes', 'sugar', 'insulin', 'blood sugar'],
        secondaryKeywords: ['cure', 'reverse', 'no medicine', 'natural', 'karela', 'bitter gourd', 'cinnamon', 'fenugreek'],
        classification: "Misleading",
        fearScore: 60.0,
        isDangerous: true,
        correctionText: "Type 1 diabetes cannot be reversed — it requires insulin for survival. Type 2 diabetes can sometimes be managed (put into remission) through significant weight loss, dietary changes, and exercise, but this requires close medical supervision. Claims that specific foods like bitter gourd or cinnamon 'cure diabetes' are not supported by sufficient clinical evidence and should never lead to stopping prescribed medication.",
        bulletPoints: [
          "Type 1 diabetes requires insulin — stopping it is life-threatening.",
          "While type 2 diabetes can be managed through diet and exercise, it requires doctor guidance.",
          "No single food has been proven to cure or reverse diabetes in clinical trials."
        ],
        sources: [
          { claimText: "No food or supplement can replace prescribed diabetes treatment.", sourceName: "American Diabetes Association", sourceUrl: "https://www.diabetes.org" },
          { claimText: "Type 1 diabetes is an autoimmune condition requiring lifelong insulin therapy.", sourceName: "National Institute of Diabetes (NIDDK)", sourceUrl: "https://www.niddk.nih.gov" }
        ]
      },
      // Sleep / insomnia myths
      {
        keywords: ['insomnia', 'sleep', 'sleepless'],
        secondaryKeywords: ['cure', 'warm milk', 'beer', 'alcohol', 'natural', 'home remedy', 'ayurveda', 'ashwagandha'],
        classification: "Misleading",
        fearScore: 30.0,
        isDangerous: false,
        correctionText: "While warm milk, certain herbal teas, and relaxation techniques may offer mild sleep benefits, alcohol and beer actively disrupt healthy sleep architecture — reducing REM sleep and causing more frequent awakenings in the second half of the night. Chronic insomnia requires evaluation by a healthcare provider; CBT-I (Cognitive Behavioral Therapy for Insomnia) is the most evidence-based first-line treatment.",
        bulletPoints: [
          "Alcohol may help you fall asleep faster but significantly reduces sleep quality and REM cycles.",
          "Warm milk contains tryptophan, which may mildly help sleep, but its effect is modest.",
          "Chronic insomnia is best treated with CBT-I, not self-medication with alcohol or supplements."
        ],
        sources: [
          { claimText: "Alcohol disrupts sleep architecture and suppresses REM sleep, worsening insomnia long-term.", sourceName: "Sleep Foundation (sleepfoundation.org)", sourceUrl: "https://www.sleepfoundation.org" },
          { claimText: "CBT-I is the most effective treatment for chronic insomnia, superior to sleep aids.", sourceName: "American Academy of Sleep Medicine", sourceUrl: "https://aasm.org" }
        ]
      },
      // Onion / general immunity myths
      {
        keywords: ['onion', 'raw onion', 'cut onion'],
        secondaryKeywords: ['absorb', 'bacteria', 'virus', 'flu', 'infection', 'immunity', 'room', 'air'],
        classification: "False",
        fearScore: 25.0,
        isDangerous: false,
        correctionText: "The claim that cut onions placed in rooms absorb viruses or bacteria is a popular WhatsApp myth with no scientific basis. Microorganisms like influenza are airborne or contact-transmitted — they cannot be 'absorbed' by a vegetable. While onions contain flavonoids with some antioxidant properties when consumed, they have no 'air purifying' pathogen-absorption properties.",
        bulletPoints: [
          "Viruses and bacteria cannot be 'absorbed' or neutralized by cut onions placed in rooms.",
          "Influenza spreads via respiratory droplets and surface contact, not by proximity to vegetables.",
          "Onions are healthy food but have no room-based antimicrobial effects."
        ],
        sources: [
          { claimText: "There is no scientific evidence that cut onions absorb viruses or bacteria from the air.", sourceName: "Snopes / Science-based Fact-Checking", sourceUrl: "https://www.snopes.com" },
          { claimText: "Flu viruses spread via droplets and do not interact with vegetable matter in this way.", sourceName: "Centers for Disease Control and Prevention (CDC)", sourceUrl: "https://www.cdc.gov/flu/about/disease/spread.htm" }
        ]
      }
    ];

    // ─── Match the best pattern for the given prompt ────────────────────────
    let bestMatch = null;
    let bestScore = 0;

    for (const pattern of mythPatterns) {
      let score = 0;
      for (const kw of pattern.keywords) {
        if (promptLower.includes(kw)) score += 10;
      }
      for (const kw of pattern.secondaryKeywords) {
        if (promptLower.includes(kw)) score += 5;
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = pattern;
      }
    }

    // Generic fallback if no pattern matched well
    if (!bestMatch || bestScore < 10) {
      const cleanWords = prompt.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?!]/g, "").split(/\s+/);
      const keyTerms = cleanWords.filter(w => w.length > 4 && !['about', 'causes', 'should', 'would', 'could', 'there', 'their', 'health', 'drinking', 'eating', 'taking'].includes(w.toLowerCase())).slice(0, 3).join(' ');

      bestMatch = {
        classification: "Unverified",
        fearScore: 50.0,
        isDangerous: false,
        correctionText: `Health claims circulating on social messaging platforms require careful verification. The claim you submitted about "${keyTerms || 'this health topic'}" does not match established guidelines from the WHO, CDC, or NIH. Always consult a licensed healthcare provider before acting on health advice received via social media. Look for peer-reviewed sources on PubMed or reputable medical websites.`,
        bulletPoints: [
          "Verify claims using reputable sources: WHO, NIH, CDC, and peer-reviewed journals.",
          "Avoid acting on health advice from forwarded messages without consulting your doctor.",
          "Be critical of sensational health claims that lack scientific citations."
        ],
        sources: [
          { claimText: "How to evaluate online health information.", sourceName: "NIH MedlinePlus – Evaluating Health Information", sourceUrl: "https://medlineplus.gov/healthliteracy.html" },
          { claimText: "Health literacy and identifying medical misinformation.", sourceName: "WHO Health & Misinformation Guide", sourceUrl: "https://www.who.int/health-topics/infodemic" }
        ]
      };
    }

    const whatsappCorrectionTemplate = `*🚨 FACT CHECK: Prescrypto*\n\n❌ *Claim*: ${claim}\n\n✅ *What Science Says*:\n${bestMatch.correctionText.substring(0, 200)}...\n\n*Key Facts*:\n${bestMatch.bulletPoints.map(p => `• ${p}`).join('\n')}\n\n*Verified Sources*: ${bestMatch.sources.map(s => s.sourceName).join(', ')}\n\n_This fact-check was generated by Prescrypto Health Literacy Platform. Not a medical diagnosis._`;

    return JSON.stringify({
      classification: bestMatch.classification,
      originalClaim: claim,
      confidenceScore: bestScore >= 15 ? 91.5 : 72.0,
      fearScore: bestMatch.fearScore,
      isDangerous: bestMatch.isDangerous,
      correctionText: bestMatch.correctionText,
      whatsappCorrectionTemplate: whatsappCorrectionTemplate,
      verifiedClaims: bestMatch.sources
    });
  }


  // Scenario 2: Prescription Decoder
  if (sysLower.includes('prescription') || sysLower.includes('decoder') || (!sysLower.includes('lab') && (promptLower.includes('mg') || promptLower.includes('tablet') || promptLower.includes('paracetamol')))) {
    const baseMocks = {
      paracetamol: {
        name: "Paracetamol 650mg",
        genericName: "Acetaminophen / Paracetamol",
        therapeuticClass: "Analgesic & Antipyretic (Pain reliever & Fever reducer)",
        purpose: "Used to treat mild to moderate pain (headache, muscle ache, backache, toothache) and reduce fever.",
        safetyCategory: "Safe (Follow Dosage)",
        dosageWarning: "Do not exceed 4,000 mg in 24 hours to prevent severe liver damage. Avoid alcohol.",
        sideEffects: ["Nausea", "Allergic skin reactions (rare)", "Sweating", "Loss of appetite"],
        interactions: ["Alcohol (increases liver toxicity)", "Warfarin (may increase bleeding risk with chronic use)", "Other paracetamol-containing cold remedies"]
      },
      ibuprofen: {
        name: "Ibuprofen 400mg",
        genericName: "Ibuprofen",
        therapeuticClass: "Nonsteroidal Anti-inflammatory Drug (NSAID)",
        purpose: "Reduces hormones that cause pain and inflammation in the body. Used for arthritis, menstrual cramps, dental pain, and muscular pain.",
        safetyCategory: "Caution (Cardiovascular & GI Risk)",
        dosageWarning: "Take with food or milk to decrease stomach upset. Do not take with other NSAIDs.",
        sideEffects: ["Stomach pain", "Heartburn", "Dizziness", "Mild headache", "Nausea"],
        interactions: ["Aspirin & other NSAIDs (increases ulcer risk)", "Blood thinners like Warfarin & Heparin", "ACE inhibitors & diuretics (reduces blood pressure efficacy)"]
      },
      alidigesic: {
        name: "Alidigesic (Ibuprofen + Paracetamol)",
        genericName: "Ibuprofen 400mg + Paracetamol 325mg",
        therapeuticClass: "Analgesic & NSAID Combination",
        purpose: "Synergistic pain relief for severe headaches, body aches, muscle strains, dental pain, and joint pain.",
        safetyCategory: "Caution (Take after meals)",
        dosageWarning: "Always take after food. Do not exceed 3 tablets daily. Do not take with other paracetamol or ibuprofen products.",
        sideEffects: ["Acidity", "Stomach discomfort", "Nausea", "Dizziness", "Drowsiness"],
        interactions: ["Alcohol (increases liver and stomach risks)", "Blood thinners (Warfarin)", "Other NSAIDs", "Antihypertensives"]
      },
      combiflam: {
        name: "Combiflam",
        genericName: "Ibuprofen 400mg + Paracetamol 325mg",
        therapeuticClass: "Analgesic & NSAID Combination",
        purpose: "Relieves muscle spasms, dental pain, headache, and fever by reducing inflammation and pain signals.",
        safetyCategory: "Caution (Take after meals)",
        dosageWarning: "Take with meals. Avoid if you have active stomach ulcers or asthma sensitive to aspirin.",
        sideEffects: ["Heartburn", "Nausea", "Stomach upset", "Dizziness"],
        interactions: ["Other NSAIDs", "Aspirin", "Alcohol", "Warfarin", "Antihypertensives"]
      },
      amoxicillin: {
        name: "Amoxicillin 500mg",
        genericName: "Amoxicillin",
        therapeuticClass: "Beta-lactam Antibiotic (Penicillin group)",
        purpose: "Treats bacterial infections such as ear, nose, throat, skin, respiratory tract, and urinary tract infections.",
        safetyCategory: "Caution (Complete Course / Allergy check)",
        dosageWarning: "Complete the entire course prescribed by your physician even if symptoms resolve. Do not use if allergic to penicillin.",
        sideEffects: ["Diarrhea", "Nausea", "Skin rash", "Vomiting", "Oral thrush"],
        interactions: ["Oral contraceptives (may reduce effectiveness)", "Allopurinol (increases risk of skin rash)", "Probenecid"]
      },
      azithromycin: {
        name: "Azithromycin 500mg",
        genericName: "Azithromycin",
        therapeuticClass: "Macrolide Antibiotic",
        purpose: "Treats various bacterial infections like bronchitis, throat, skin, and sinus infections, and atypical pneumonia.",
        safetyCategory: "Caution (Complete Course)",
        dosageWarning: "Complete the entire course prescribed. Avoid antacids containing aluminum or magnesium within 2 hours of dose.",
        sideEffects: ["Diarrhea", "Nausea", "Abdominal pain", "Vomiting", "Temporary hearing loss (high dose)"],
        interactions: ["Antacids (may delay absorption)", "Warfarin (may increase bleeding)", "Digoxin"]
      },
      metformin: {
        name: "Metformin Hydrochloride 500mg",
        genericName: "Metformin",
        therapeuticClass: "Antidiabetic agent (Biguanide)",
        purpose: "Improves insulin sensitivity and lowers blood glucose levels in Type 2 Diabetes patients.",
        safetyCategory: "Caution (Renal Impairment)",
        dosageWarning: "Take with meals to reduce gastrointestinal side effects. Monitor kidney function regularly.",
        sideEffects: ["Nausea", "Diarrhea", "Metallic taste in mouth", "Abdominal bloating", "Vitamin B12 deficiency (long term)"],
        interactions: ["Iodinated contrast media (high risk of lactic acidosis)", "Alcohol (increases risk of lactic acidosis)", "Cimetidine"]
      },
      metoprolol: {
        name: "Metoprolol Succinate ER 25mg/50mg",
        genericName: "Metoprolol Succinate",
        therapeuticClass: "Antihypertensive & Antianginal (Selective Beta-1 Blocker)",
        purpose: "Treats high blood pressure, chest pain (angina), and improves survival after heart attacks.",
        safetyCategory: "Caution (Do Not Abruptly Discontinue)",
        dosageWarning: "Take regularly at the same time every day. Monitor blood pressure and heart rate. Do not stop suddenly.",
        sideEffects: ["Fatigue", "Dizziness", "Slow heart rate", "Cold extremities", "Shortness of breath"],
        interactions: ["Calcium channel blockers (Amlodipine, Diltiazem)", "Digoxin", "NSAIDs (reduces blood pressure lowering effect)"]
      },
      atorvastatin: {
        name: "Atorvastatin Calcium 10mg/20mg",
        genericName: "Atorvastatin",
        therapeuticClass: "Lipid-lowering agent (HMG-CoA Reductase Inhibitor / Statin)",
        purpose: "Lowers LDL cholesterol and triglycerides while raising HDL. Reduces risk of heart attack and stroke.",
        safetyCategory: "Caution (Pregnancy Class X)",
        dosageWarning: "Take once daily, usually in the evening. Avoid large amounts of grapefruit juice. Monitor liver enzymes.",
        sideEffects: ["Headache", "Muscle ache (myalgia)", "Mild joint pain", "Diarrhea", "Nasal congestion"],
        interactions: ["Gemfibrozil / Fibrates (high risk of rhabdomyolysis)", "Strong CYP3A4 inhibitors (Clarithromycin, Ketoconazole)", "Digoxin"]
      },
      rosuvastatin: {
        name: "Rosuvastatin Calcium 10mg",
        genericName: "Rosuvastatin",
        therapeuticClass: "Lipid-lowering agent (Statin)",
        purpose: "Lowers cholesterol and prevents cardiovascular disease. Highly effective at low doses.",
        safetyCategory: "Caution (Pregnancy Class X)",
        dosageWarning: "Take once daily. Avoid antacids within 2 hours of taking this medication. Inform doctor of unexplained muscle pain.",
        sideEffects: ["Myalgia (muscle pain)", "Dizziness", "Nausea", "Headache", "Abdominal pain"],
        interactions: ["Cyclosporine", "Warfarin (increases bleeding risk)", "Fibrates", "Antacids"]
      },
      pantoprazole: {
        name: "Pantoprazole Sodium 40mg",
        genericName: "Pantoprazole",
        therapeuticClass: "Gastrointestinal agent (Proton Pump Inhibitor - PPI)",
        purpose: "Reduces stomach acid production. Used for treating GERD, stomach ulcers, and acid reflux.",
        safetyCategory: "Safe (Take on Empty Stomach)",
        dosageWarning: "Take 30-60 minutes before breakfast (first meal of the day). Swallow whole.",
        sideEffects: ["Headache", "Diarrhea", "Flatulence", "Nausea", "Vitamin B12 deficiency (with long-term use)"],
        interactions: ["Ketoconazole / Itraconazole (reduces absorption)", "Atazanavir", "Methotrexate"]
      },
      omeprazole: {
        name: "Omeprazole 20mg",
        genericName: "Omeprazole",
        therapeuticClass: "Gastrointestinal agent (Proton Pump Inhibitor - PPI)",
        purpose: "Reduces stomach acid to treat heartburn, gastroesophageal reflux disease (GERD), and peptic ulcer disease.",
        safetyCategory: "Safe (Take on Empty Stomach)",
        dosageWarning: "Take on empty stomach, 30 minutes before breakfast. Swallow capsule whole.",
        sideEffects: ["Headache", "Stomach pain", "Nausea", "Diarrhea", "Constipation"],
        interactions: ["Clopidogrel (may reduce its antiplatelet effect)", "Ketoconazole", "Iron supplements"]
      },
      rabeprazole: {
        name: "Rabeprazole Sodium 20mg",
        genericName: "Rabeprazole",
        therapeuticClass: "Gastrointestinal agent (PPI)",
        purpose: "Provides rapid relief from acidity, heartburn, and gastroesophageal reflux.",
        safetyCategory: "Safe (Take on Empty Stomach)",
        dosageWarning: "Take in the morning 30 minutes before breakfast. Swallow whole, do not crush or chew.",
        sideEffects: ["Headache", "Nausea", "Diarrhea", "Abdominal pain", "Dizziness"],
        interactions: ["Ketoconazole", "Warfarin", "Digoxin"]
      },
      esomeprazole: {
        name: "Esomeprazole 40mg",
        genericName: "Esomeprazole",
        therapeuticClass: "Gastrointestinal agent (PPI)",
        purpose: "Treats acid-related stomach issues, erosive esophagitis, and ulcers.",
        safetyCategory: "Safe (Take on Empty Stomach)",
        dosageWarning: "Take 1 hour before eating. Swallow whole or disperse in non-carbonated water if needed.",
        sideEffects: ["Headache", "Nausea", "Gas", "Dry mouth", "Diarrhea"],
        interactions: ["Clopidogrel", "Ketoconazole", "Diazepam"]
      },
      ranitidine: {
        name: "Ranitidine 150mg",
        genericName: "Ranitidine",
        therapeuticClass: "Gastrointestinal agent (H2 Receptor Blocker)",
        purpose: "Reduces acid levels in the stomach for relief from heartburn, indigestion, and acid reflux.",
        safetyCategory: "Safe",
        dosageWarning: "Can be taken with or without food. Follow doctor's specific dosing instructions.",
        sideEffects: ["Headache", "Dizziness", "Constipation or diarrhea (mild)", "Drowsiness"],
        interactions: ["Ketoconazole", "Procainamide", "Alcohol"]
      },
      famotidine: {
        name: "Famotidine 20mg",
        genericName: "Famotidine",
        therapeuticClass: "Gastrointestinal agent (H2 Receptor Blocker)",
        purpose: "Treats and prevents ulcers in stomach/intestine and treats acid reflux.",
        safetyCategory: "Safe",
        dosageWarning: "Take before meals or at bedtime. Stay hydrated and avoid smoking.",
        sideEffects: ["Headache", "Dizziness", "Constipation", "Diarrhea"],
        interactions: ["Ketoconazole", "Tizanidine", "Atazanavir"]
      },
      domperidone: {
        name: "Domperidone 10mg",
        genericName: "Domperidone",
        therapeuticClass: "Antiemetic & Prokinetic",
        purpose: "Treats nausea, vomiting, indigestion, bloating, and gas. Improves gut motility.",
        safetyCategory: "Caution (Cardiac history)",
        dosageWarning: "Take 15-30 minutes before meals. Not recommended for patients with cardiac conduction issues.",
        sideEffects: ["Dry mouth", "Headache", "Drowsiness", "Breast tenderness / Galactorrhea (rare)"],
        interactions: ["QT-prolonging drugs (Amiodarone, Erythromycin)", "Ketoconazole", "Fluconazole"]
      },
      ondansetron: {
        name: "Ondansetron Hydrochloride 4mg",
        genericName: "Ondansetron",
        therapeuticClass: "Antiemetic (5-HT3 Receptor Antagonist)",
        purpose: "Prevents and treats nausea and vomiting caused by chemotherapy, radiation, surgery, or acute gastroenteritis.",
        safetyCategory: "Safe",
        dosageWarning: "Take as directed by doctor. Can be taken with or without food. Dispersible tablets dissolve on tongue.",
        sideEffects: ["Headache", "Fatigue", "Constipation", "Flushing or sensation of warmth"],
        interactions: ["Apomorphine (contraindicated)", "Serotonergic drugs (SSRI/SNRI - risk of serotonin syndrome)"]
      },
      cetirizine: {
        name: "Cetirizine Hydrochloride 10mg",
        genericName: "Cetirizine",
        therapeuticClass: "Antihistamine (Second Generation Allergy Reliever)",
        purpose: "Relieves allergy symptoms like runny nose, sneezing, itchy/watery eyes, and hives.",
        safetyCategory: "Safe (May cause drowsiness)",
        dosageWarning: "Usually taken once daily in the evening. Avoid driving or operating heavy machinery if drowsy. Limit alcohol.",
        sideEffects: ["Drowsiness", "Dry mouth", "Fatigue", "Headache", "Dizziness"],
        interactions: ["Alcohol (increases drowsiness)", "Other CNS depressants / sleeping pills", "Theophylline"]
      },
      levocetirizine: {
        name: "Levocetirizine Dihydrochloride 5mg",
        genericName: "Levocetirizine",
        therapeuticClass: "Antihistamine (Non-sedating/Low-sedation)",
        purpose: "Relieves seasonal allergic rhinitis, perennial allergic rhinitis, and chronic hives.",
        safetyCategory: "Safe (Low Drowsiness)",
        dosageWarning: "Take once daily in the evening. Do not exceed the recommended dose.",
        sideEffects: ["Dry mouth", "Mild drowsiness", "Fatigue", "Pharyngitis"],
        interactions: ["Alcohol", "CNS depressants"]
      },
      montelukast: {
        name: "Montelukast Sodium 10mg",
        genericName: "Montelukast",
        therapeuticClass: "Bronchodilator (Leukotriene Receptor Antagonist)",
        purpose: "Prevents asthma attacks and treats seasonal or year-round allergies.",
        safetyCategory: "Caution (Neuropsychiatric Warnings)",
        dosageWarning: "Take once daily in the evening. Monitor for mood changes, anxiety, or sleep disturbances.",
        sideEffects: ["Headache", "Stomach pain", "Cough", "Mild fever", "Mood/behavior changes (rare but important)"],
        interactions: ["Phenobarbital", "Phenytoin", "Rifampin (reduces montelukast levels)"]
      },
      'montek lc': {
        name: "Montek LC (Montelukast + Levocetirizine)",
        genericName: "Montelukast 10mg + Levocetirizine 5mg",
        therapeuticClass: "Antihistamine & Bronchodilator Combination",
        purpose: "Highly effective combo for seasonal allergic rhinitis, chronic allergic asthma, and respiratory congestion.",
        safetyCategory: "Caution (May cause mild drowsiness)",
        dosageWarning: "Take once daily at bedtime. Avoid alcohol. Report any unusual mood swings to your doctor.",
        sideEffects: ["Drowsiness", "Dry mouth", "Fatigue", "Headache", "Nausea"],
        interactions: ["CNS depressants", "Alcohol", "Phenobarbital", "Rifampin"]
      },
      telmisartan: {
        name: "Telmisartan 40mg",
        genericName: "Telmisartan",
        therapeuticClass: "Antihypertensive (Angiotensin II Receptor Blocker - ARB)",
        purpose: "Lowers blood pressure to reduce risk of strokes, heart attacks, and kidney problems.",
        safetyCategory: "Caution (Pregnancy Contraindication)",
        dosageWarning: "Do NOT take during pregnancy (fetal risk). Take regularly at same time. Avoid potassium supplements.",
        sideEffects: ["Dizziness", "Back pain", "Hyperkalemia (high blood potassium)", "Sinus congestion"],
        interactions: ["Potassium-sparing diuretics & potassium supplements", "NSAIDs like Ibuprofen (increases renal failure risk)", "Lithium"]
      },
      'telma-h': {
        name: "Telma-H (Telmisartan + Hydrochlorothiazide)",
        genericName: "Telmisartan 40mg + Hydrochlorothiazide 12.5mg",
        therapeuticClass: "Antihypertensive (ARB + Thiazide Diuretic)",
        purpose: "Combination therapy for managing high blood pressure when single agents are insufficient.",
        safetyCategory: "Caution (Electrolyte & Pregnancy Warning)",
        dosageWarning: "Take in the morning to prevent night urination. Stay hydrated. Do not take during pregnancy.",
        sideEffects: ["Dizziness", "Fatigue", "Electrolyte imbalance (low sodium/potassium)", "Dehydration signs"],
        interactions: ["Lithium (increased toxicity)", "NSAIDs (decreases effect)", "Potassium supplements", "Other BP medications"]
      },
      amlodipine: {
        name: "Amlodipine Besylate 5mg",
        genericName: "Amlodipine",
        therapeuticClass: "Antihypertensive & Antianginal (Calcium Channel Blocker)",
        purpose: "Relaxes blood vessels to lower blood pressure and treats chest pain (angina).",
        safetyCategory: "Caution (Fluid Retention)",
        dosageWarning: "Check for ankle/foot swelling. Take at the same time every day. Report rapid heart rate.",
        sideEffects: ["Peripheral edema (swelling of ankles/feet)", "Dizziness", "Flushing", "Palpitations", "Fatigue"],
        interactions: ["Simvastatin (increases statin toxicity risk)", "Beta-blockers", "Strong CYP3A4 inhibitors (Grapefruit juice)"]
      },
      losartan: {
        name: "Losartan Potassium 50mg",
        genericName: "Losartan",
        therapeuticClass: "Antihypertensive (ARB)",
        purpose: "Treats high blood pressure and helps protect kidneys in diabetic patients with hypertension.",
        safetyCategory: "Caution (Pregnancy Contraindication)",
        dosageWarning: "Do not take during pregnancy. Monitor blood pressure and renal function regularly.",
        sideEffects: ["Dizziness", "Fatigue", "Congestion", "Anemia (rare)"],
        interactions: ["NSAIDs", "Potassium supplements", "Lithium"]
      },
      olmesartan: {
        name: "Olmesartan Medoxomil 20mg",
        genericName: "Olmesartan",
        therapeuticClass: "Antihypertensive (ARB)",
        purpose: "Lowers high blood pressure. Relaxes blood vessels for smoother blood flow.",
        safetyCategory: "Caution (Pregnancy Contraindication)",
        dosageWarning: "Contraindicated in pregnancy. Seek immediate medical help if severe, chronic diarrhea develops.",
        sideEffects: ["Dizziness", "Sprue-like enteropathy (severe diarrhea/weight loss - rare)", "Back pain", "Hyperkalemia"],
        interactions: ["NSAIDs", "Aliskiren", "Potassium-sparing diuretics"]
      },
      ramipril: {
        name: "Ramipril 5mg",
        genericName: "Ramipril",
        therapeuticClass: "Antihypertensive (ACE Inhibitor)",
        purpose: "Treats hypertension, congestive heart failure, and improves survival after a heart attack.",
        safetyCategory: "Caution (Dry Cough / Angioedema)",
        dosageWarning: "Report swelling of face, lips, or tongue immediately (angioedema). A persistent dry cough is common.",
        sideEffects: ["Dry hacking cough", "Dizziness", "Hyperkalemia", "Fatigue", "Headache"],
        interactions: ["NSAIDs", "Lithium", "Potassium supplements", "Sacubitril / Valsartan (contraindicated)"]
      },
      lisinopril: {
        name: "Lisinopril 10mg",
        genericName: "Lisinopril",
        therapeuticClass: "Antihypertensive (ACE Inhibitor)",
        purpose: "Treats high blood pressure, heart failure, and improves survival post-myocardial infarction.",
        safetyCategory: "Caution (Dry Cough / Pregnancy Warning)",
        dosageWarning: "Do not use in pregnancy. Report dry cough or swelling immediately to your physician.",
        sideEffects: ["Dry cough", "Headache", "Dizziness", "Low blood pressure"],
        interactions: ["NSAIDs", "Potassium-sparing diuretics", "Lithium"]
      },
      aspirin: {
        name: "Aspirin 75mg/150mg (Low Dose / Ecosprin)",
        genericName: "Aspirin (Acetylsalicylic Acid)",
        therapeuticClass: "Antiplatelet / Cardioprotective (Salicylate)",
        purpose: "Prevents blood clots, reducing the risk of heart attacks and strokes in high-risk patients.",
        safetyCategory: "Caution (Bleeding Risk / Take after food)",
        dosageWarning: "Take with food to minimize gastric irritation. Do not stop abruptly without doctor approval. Avoid in children (Reye's syndrome).",
        sideEffects: ["Stomach irritation", "Increased bruising/bleeding", "Heartburn", "Tinnitus (ringing in ears - high dose)"],
        interactions: ["NSAIDs like Ibuprofen (increases ulcer risk)", "Warfarin & Clopidogrel (increases bleeding risk)", "Alcohol"]
      },
      clopidogrel: {
        name: "Clopidogrel 75mg",
        genericName: "Clopidogrel",
        therapeuticClass: "Antiplatelet agent (P2Y12 Inhibitor)",
        purpose: "Prevents platelets from sticking together to form dangerous blood clots after a stent or heart attack.",
        safetyCategory: "Caution (Bleeding Risk)",
        dosageWarning: "Report black tarry stools or blood in urine immediately. Do not stop taking this without consulting your cardiologist.",
        sideEffects: ["Bruising", "Nosebleeds", "Bleeding at minor cut sites", "Abdominal pain"],
        interactions: ["Omeprazole/Esomeprazole (reduces clopidogrel efficacy)", "NSAIDs & Aspirin (increases bleeding risk)", "Warfarin"]
      },
      warfarin: {
        name: "Warfarin Sodium 2mg/5mg",
        genericName: "Warfarin",
        therapeuticClass: "Anticoagulant (Vitamin K Antagonist)",
        purpose: "Prevents new blood clots from forming and stops existing clots from growing larger.",
        safetyCategory: "High Risk (Requires strict INR monitoring)",
        dosageWarning: "Requires regular blood tests (INR monitoring). Maintain consistent intake of Vitamin K-rich foods (leafy greens).",
        sideEffects: ["Bruising", "Prolonged bleeding", "Headache (severe - seek emergency help)", "Nosebleeds"],
        interactions: ["Aspirin & NSAIDs (extreme bleeding risk)", "Antibiotics (increases warfarin effect)", "Alcohol", "Vitamin K supplements"]
      },
      rivaroxaban: {
        name: "Rivaroxaban 15mg/20mg",
        genericName: "Rivaroxaban",
        therapeuticClass: "Direct Oral Anticoagulant (Factor Xa Inhibitor)",
        purpose: "Prevents deep vein thrombosis (DVT), pulmonary embolism, and stroke in atrial fibrillation.",
        safetyCategory: "Caution (Bleeding Risk)",
        dosageWarning: "Take with food (increases absorption for higher doses). Monitor for any signs of bleeding.",
        sideEffects: ["Bleeding gums", "Nosebleeds", "Heavy menstrual periods", "Dizziness"],
        interactions: ["Aspirin/NSAIDs", "Ketoconazole", "Rifampin", "Other anticoagulants"]
      },
      apixaban: {
        name: "Apixaban 2.5mg/5mg",
        genericName: "Apixaban",
        therapeuticClass: "Direct Oral Anticoagulant (Factor Xa Inhibitor)",
        purpose: "Reduces risk of stroke and systemic embolism in patients with non-valvular atrial fibrillation.",
        safetyCategory: "Caution (Bleeding Risk)",
        dosageWarning: "Can be taken with or without food. Follow prescribed dose exactly; missing doses increases stroke risk.",
        sideEffects: ["Bruising", "Nausea", "Minor bleeding", "Anemia"],
        interactions: ["Aspirin/NSAIDs", "CYP3A4 inhibitors (Ketoconazole, Ritonavir)", "Rifampin"]
      },
      glimepiride: {
        name: "Glimepiride 1mg/2mg",
        genericName: "Glimepiride",
        therapeuticClass: "Antidiabetic (Sulfonylurea)",
        purpose: "Stimulates insulin release from pancreas to lower blood sugar in Type 2 Diabetes.",
        safetyCategory: "Caution (Hypoglycemia Risk)",
        dosageWarning: "Always take with or immediately after breakfast (first main meal). Carry a fast-acting sugar source.",
        sideEffects: ["Hypoglycemia (low blood sugar: sweating, shaking, confusion)", "Weight gain", "Nausea", "Headache"],
        interactions: ["Beta-blockers (may mask hypoglycemia symptoms)", "Alcohol (extreme blood sugar drops)", "Salicylates"]
      },
      vildagliptin: {
        name: "Vildagliptin 50mg",
        genericName: "Vildagliptin",
        therapeuticClass: "Antidiabetic (DPP-4 Inhibitor)",
        purpose: "Increases insulin secretion and decreases glucagon secretion to manage Type 2 Diabetes.",
        safetyCategory: "Caution (Hepatic Monitoring)",
        dosageWarning: "Can be taken with or without food. Monitor liver enzymes periodically as per doctor guidance.",
        sideEffects: ["Dizziness", "Headache", "Nausea", "Hypoglycemia (when used with sulfonylureas)"],
        interactions: ["ACE inhibitors (increases risk of angioedema)", "Thiazide diuretics (decreases efficacy)"]
      },
      sitagliptin: {
        name: "Sitagliptin 50mg/100mg",
        genericName: "Sitagliptin",
        therapeuticClass: "Antidiabetic (DPP-4 Inhibitor)",
        purpose: "Helps regulate insulin levels after eating to manage blood sugar in Type 2 Diabetes.",
        safetyCategory: "Caution (Pancreatitis risk)",
        dosageWarning: "Take once daily. Report persistent, severe abdominal pain immediately (possible acute pancreatitis).",
        sideEffects: ["Upper respiratory tract infection", "Headache", "Nasopharyngitis", "Hypoglycemia (if combined with insulin)"],
        interactions: ["Digoxin (mild elevation in digoxin levels)", "Insulin / Sulfonylureas"]
      },
      dapagliflozin: {
        name: "Dapagliflozin 10mg",
        genericName: "Dapagliflozin",
        therapeuticClass: "Antidiabetic (SGLT2 Inhibitor)",
        purpose: "Promotes kidney removal of glucose through urine. Used for Type 2 Diabetes and heart failure management.",
        safetyCategory: "Caution (Dehydration & UTI Risk)",
        dosageWarning: "Stay well-hydrated. Maintain good perineal hygiene to prevent genital yeast infections.",
        sideEffects: ["Urinary tract infections (UTIs)", "Genital yeast infections", "Increased urination", "Mild dehydration"],
        interactions: ["Diuretics (increases dehydration risk)", "Insulin (increases hypoglycemia risk)"]
      },
      ciprofloxacin: {
        name: "Ciprofloxacin 500mg",
        genericName: "Ciprofloxacin",
        therapeuticClass: "Fluoroquinolone Antibiotic",
        purpose: "Treats severe bacterial infections (urinary tract, skin, respiratory tract, bone, joint).",
        safetyCategory: "Caution (Tendonitis / Complete Course)",
        dosageWarning: "Avoid dairy products or calcium-fortified juices close to dose. Report any sudden tendon pain immediately.",
        sideEffects: ["Nausea", "Diarrhea", "Photosensitivity (sunburn risk)", "Joint pain", "Tendon rupture (rare)"],
        interactions: ["Antacids / Iron supplements (severely reduces absorption)", "Theophylline", "Tizanidine"]
      },
      levofloxacin: {
        name: "Levofloxacin 500mg",
        genericName: "Levofloxacin",
        therapeuticClass: "Fluoroquinolone Antibiotic",
        purpose: "Treats bacterial sinusitis, pneumonia, skin, and urinary tract infections.",
        safetyCategory: "Caution (Tendonitis warning)",
        dosageWarning: "Avoid sun exposure. Drink plenty of fluids. Do not take with multivalent cations (iron, calcium).",
        sideEffects: ["Nausea", "Headache", "Insomnia", "Dizziness", "Tendon discomfort"],
        interactions: ["NSAIDs (increases seizure risk)", "Antacids", "Warfarin"]
      },
      cefixime: {
        name: "Cefixime 200mg",
        genericName: "Cefixime",
        therapeuticClass: "Third-Generation Cephalosporin Antibiotic",
        purpose: "Treats middle ear, throat, lung, and urinary tract bacterial infections.",
        safetyCategory: "Caution (Complete Course)",
        dosageWarning: "Complete the entire course. Can be taken with or after meals to prevent stomach issues.",
        sideEffects: ["Diarrhea", "Abdominal pain", "Nausea", "Dyspepsia", "Vaginal itching"],
        interactions: ["Warfarin (increased bleeding risk)", "Carbamazepine (increases carbamazepine toxicity)"]
      },
      cefpodoxime: {
        name: "Cefpodoxime Proxetil 200mg",
        genericName: "Cefpodoxime",
        therapeuticClass: "Third-Generation Cephalosporin Antibiotic",
        purpose: "Treats acute respiratory, tonsil, sinus, and skin bacterial infections.",
        safetyCategory: "Caution (Complete Course)",
        dosageWarning: "Take with food to enhance absorption. Complete the prescribed timeline.",
        sideEffects: ["Diarrhea", "Vaginal yeast infection", "Nausea", "Headache"],
        interactions: ["Antacids & H2 blockers (reduces absorption)", "Probenecid"]
      },
      doxycycline: {
        name: "Doxycycline 100mg",
        genericName: "Doxycycline",
        therapeuticClass: "Tetracycline Antibiotic",
        purpose: "Treats bacterial infections, acne, malaria prophylaxis, and bacterial pneumonia.",
        safetyCategory: "Caution (Esophageal Irritation / Sun Sensitivity)",
        dosageWarning: "Take with a full glass of water and sit upright for 30 minutes to prevent throat ulcers. Avoid sun exposure.",
        sideEffects: ["Photosensitivity", "Esophagitis", "Nausea", "Teeth discoloration (in children)"],
        interactions: ["Calcium, Iron, Magnesium (reduces doxycycline efficacy)", "Oral contraceptives", "Retinoids"]
      },
      clindamycin: {
        name: "Clindamycin 300mg",
        genericName: "Clindamycin",
        therapeuticClass: "Lincosamide Antibiotic",
        purpose: "Treats serious anaerobic bacterial infections of the lungs, skin, abdomen, and soft tissues.",
        safetyCategory: "Caution (C. difficile diarrhea risk)",
        dosageWarning: "Take with a full glass of water. Report severe, watery diarrhea immediately (possible C. diff colitis).",
        sideEffects: ["Nausea", "Diarrhea", "Vomiting", "Skin rash / hives"],
        interactions: ["Neuromuscular blockers", "Erythromycin"]
      },
      levothyroxine: {
        name: "Levothyroxine Sodium 25mcg/50mcg/100mcg",
        genericName: "Levothyroxine (Thyroxine)",
        therapeuticClass: "Thyroid Hormone replacement",
        purpose: "Supplements deficient thyroid hormone levels in patients with hypothyroidism.",
        safetyCategory: "Safe (Lifetime Therapy for most)",
        dosageWarning: "Take first thing in the morning on an empty stomach with water, 30-60 minutes before breakfast.",
        sideEffects: ["Signs of excess thyroid (hyperthyroidism: rapid heart rate, weight loss, sweating, anxiety - if dose is high)"],
        interactions: ["Calcium/Iron supplements (take 4 hours apart)", "Soy products", "Antacids"]
      },
      prednisolone: {
        name: "Prednisolone 5mg/10mg",
        genericName: "Prednisolone",
        therapeuticClass: "Systemic Corticosteroid (Glucocorticoid)",
        purpose: "Suppresses immune response and reduces inflammation. Used in asthma, severe allergies, and autoimmune flare-ups.",
        safetyCategory: "Caution (Taper Dose / Long-term risks)",
        dosageWarning: "Take with food in the morning. Do NOT stop taking this suddenly if used long-term; requires tapering.",
        sideEffects: ["Increased appetite", "Insomnia / mood swings", "Fluid retention", "Elevated blood sugar", "Osteoporosis (long term)"],
        interactions: ["NSAIDs (increases risk of stomach ulcers)", "Antidiabetics (prednisolone increases blood sugar)", "Live vaccines"]
      },
      dexamethasone: {
        name: "Dexamethasone 0.5mg/4mg",
        genericName: "Dexamethasone",
        therapeuticClass: "Potent Corticosteroid",
        purpose: "Highly potent anti-inflammatory steroid used for severe allergic conditions, croup, and chemotherapy-induced nausea.",
        safetyCategory: "Caution (Immunosuppression)",
        dosageWarning: "Take with food. Do not stop abruptly. Report signs of infection immediately.",
        sideEffects: ["Increased appetite", "Restlessness", "Water retention", "Elevated blood sugar"],
        interactions: ["NSAIDs", "Phenytoin", "Phenobarbital", "Antidiabetics"]
      },
      methylprednisolone: {
        name: "Methylprednisolone 4mg/8mg/16mg",
        genericName: "Methylprednisolone",
        therapeuticClass: "Corticosteroid",
        purpose: "Treats arthritis, lupus, severe allergies, asthma flare-ups, and skin conditions.",
        safetyCategory: "Caution (Taper Dose)",
        dosageWarning: "Take with food. Follow exact dose schedule (often a taper pack). Avoid close contact with sick individuals.",
        sideEffects: ["Mood changes", "Indigestion", "High blood pressure", "Weight gain (fluid)"],
        interactions: ["NSAIDs", "Clarithromycin", "Ketoconazole", "Blood thinners"]
      },
      hydroxychloroquine: {
        name: "Hydroxychloroquine Sulfate 200mg",
        genericName: "Hydroxychloroquine",
        therapeuticClass: "Disease-modifying Antirheumatic Drug (DMARD) / Antimalarial",
        purpose: "Treats rheumatoid arthritis, systemic lupus erythematosus (SLE), and prevents malaria.",
        safetyCategory: "Caution (Retinal Toxicity Check)",
        dosageWarning: "Requires regular eye exams (retinal toxicity check for long-term use). Take with food or milk.",
        sideEffects: ["Stomach cramps", "Mild nausea", "Headache", "Rashes", "Vision changes (rare but serious)"],
        interactions: ["Digoxin", "Antidiabetic drugs (may increase hypoglycemia risk)", "Amiodarone"]
      },
      methotrexate: {
        name: "Methotrexate 2.5mg/7.5mg",
        genericName: "Methotrexate",
        therapeuticClass: "Immunosuppressant / Antimetabolite",
        purpose: "Treats severe rheumatoid arthritis, psoriasis, and certain cancers.",
        safetyCategory: "High Risk (Strict Weekly Dosing / Folic Acid)",
        dosageWarning: "TAKEN ONCE WEEKLY (not daily) for arthritis. Take with Folic Acid as prescribed to reduce side effects.",
        sideEffects: ["Nausea", "Mouth ulcers", "Fatigue", "Liver toxicity", "Low white blood cell count"],
        interactions: ["NSAIDs (increases methotrexate toxicity risk)", "Penicillins", "Proton Pump Inhibitors", "Alcohol"]
      },
      salbutamol: {
        name: "Salbutamol Inhaler (Asthalin / Ventolin)",
        genericName: "Salbutamol (Albuterol)",
        therapeuticClass: "Bronchodilator (Short-Acting Beta-2 Agonist)",
        purpose: "Relieves acute asthma attacks, wheezing, and shortness of breath quickly by dilating airways.",
        safetyCategory: "Safe (Rescue Inhaler)",
        dosageWarning: "Use as needed for sudden breathing difficulty. Keep inhaler with you. Inform doctor if using >2 times/week.",
        sideEffects: ["Tremor (especially hands)", "Rapid heart rate (tachycardia)", "Palpitations", "Mild headache"],
        interactions: ["Beta-blockers like Propranolol (blocks effect)", "Digoxin", "Diuretics (increases hypokalemia risk)"]
      },
      albendazole: {
        name: "Albendazole 400mg",
        genericName: "Albendazole",
        therapeuticClass: "Anthelmintic (Deworming medication)",
        purpose: "Treats tapeworm, roundworm, and other parasitic worm infestations.",
        safetyCategory: "Safe (Single Dose for basic deworming)",
        dosageWarning: "Dose is usually a single chewable tablet. Take with fatty foods to improve absorption.",
        sideEffects: ["Headache", "Dizziness", "Nausea", "Temporary hair thinning (long-term use only)"],
        interactions: ["Dexamethasone", "Praziquantel", "Cimetidine"]
      },
      ivermectin: {
        name: "Ivermectin 6mg/12mg",
        genericName: "Ivermectin",
        therapeuticClass: "Antiparasitic",
        purpose: "Treats scabies, strongyloidiasis, head lice, and other parasitic infections.",
        safetyCategory: "Safe",
        dosageWarning: "Take on an empty stomach with water, 1 hour before breakfast, as a single dose or repeated dose.",
        sideEffects: ["Dizziness", "Nausea", "Itching (with scabies treatment)", "Mild fever"],
        interactions: ["Warfarin (enhances anticoagulant effect)"]
      },
      diclofenac: {
        name: "Diclofenac Sodium 50mg/75mg",
        genericName: "Diclofenac",
        therapeuticClass: "Nonsteroidal Anti-inflammatory Drug (NSAID)",
        purpose: "Relieves joint pain, stiffness, and inflammation associated with arthritis, gout, and strains.",
        safetyCategory: "Caution (Cardiovascular & GI Risk)",
        dosageWarning: "Always take with or after meals. Avoid long-term use if you have cardiovascular disease.",
        sideEffects: ["Acidity", "Stomach pain", "Nausea", "Heartburn", "Drowsiness"],
        interactions: ["Aspirin/NSAIDs", "ACE inhibitors", "Warfarin", "Methotrexate"]
      },
      naproxen: {
        name: "Naproxen 250mg/500mg",
        genericName: "Naproxen",
        therapeuticClass: "NSAID (Longer Acting)",
        purpose: "Provides long-lasting relief from pain, swelling, and stiffness (rheumatoid arthritis, menstrual pain).",
        safetyCategory: "Caution (Cardiovascular & GI Risk)",
        dosageWarning: "Take with food or milk. Do not exceed recommended dosage.",
        sideEffects: ["Indigestion", "Stomach ache", "Drowsiness", "Headache"],
        interactions: ["Aspirin", "Other NSAIDs", "ACE inhibitors", "Anticoagulants"]
      },
      tramadol: {
        name: "Tramadol Hydrochloride 50mg",
        genericName: "Tramadol",
        therapeuticClass: "Opioid Analgesic",
        purpose: "Treats moderate to moderately severe pain when non-opioid pain relievers are insufficient.",
        safetyCategory: "High Risk (Habit forming / Drowsiness)",
        dosageWarning: "May be habit-forming. Causes drowsiness — do not drive or run heavy machinery. Avoid alcohol.",
        sideEffects: ["Drowsiness", "Dizziness", "Constipation", "Nausea", "Dry mouth"],
        interactions: ["Antidepressants (extreme risk of serotonin syndrome)", "Alcohol & sleeping pills (respiratory depression)", "MAO inhibitors"]
      },
      sertraline: {
        name: "Sertraline Hydrochloride 50mg",
        genericName: "Sertraline",
        therapeuticClass: "Antidepressant (Selective Serotonin Reuptake Inhibitor - SSRI)",
        purpose: "Treats depression, obsessive-compulsive disorder (OCD), panic attacks, and anxiety.",
        safetyCategory: "Caution (Suicidality Warning / Withdrawal)",
        dosageWarning: "Do not stop taking this medication suddenly (withdrawal syndrome). May take 4-6 weeks to work. Limit alcohol.",
        sideEffects: ["Nausea", "Insomnia or sleepiness", "Sexual dysfunction", "Dry mouth", "Increased anxiety (first 2 weeks)"],
        interactions: ["MAO Inhibitors (contraindicated)", "NSAIDs & Aspirin (increases bleeding risk)", "Tramadol (serotonin syndrome)"]
      },
      fluoxetine: {
        name: "Fluoxetine 20mg",
        genericName: "Fluoxetine",
        therapeuticClass: "Antidepressant (SSRI)",
        purpose: "Treats major depressive disorder, bulimia nervosa, panic disorder, and premenstrual dysphoric disorder.",
        safetyCategory: "Caution (Suicidality Risk)",
        dosageWarning: "Take in the morning (can cause insomnia). Report any suicidal thoughts or worsening depression.",
        sideEffects: ["Nausea", "Insomnia", "Loss of appetite", "Tremors", "Fatigue"],
        interactions: ["MAOIs", "NSAIDs", "Aspirin", "Triptans"]
      },
      escitalopram: {
        name: "Escitalopram 10mg",
        genericName: "Escitalopram",
        therapeuticClass: "Antidepressant (SSRI)",
        purpose: "Treats generalized anxiety disorder and major depressive disorder.",
        safetyCategory: "Caution (Suicidality warning)",
        dosageWarning: "Take once daily, with or without food. Do not stop abruptly.",
        sideEffects: ["Nausea", "Increased sweating", "Fatigue", "Sexual dysfunction", "Insomnia"],
        interactions: ["MAOIs", "Aspirin/NSAIDs", "QT-prolonging drugs"]
      },
      alprazolam: {
        name: "Alprazolam 0.25mg/0.5mg (Xanax / Alprax)",
        genericName: "Alprazolam",
        therapeuticClass: "Anxiolytic (Benzodiazepine / Sedative)",
        purpose: "Provides immediate, short-term relief from severe anxiety and panic disorders.",
        safetyCategory: "High Risk (Addictive / Severe Drowsiness)",
        dosageWarning: "Highly habit-forming and addictive. Do not use long-term. Causes severe drowsiness — do not drive. Do NOT consume alcohol.",
        sideEffects: ["Severe drowsiness", "Lightheadedness", "Dry mouth", "Memory impairment", "Slurred speech"],
        interactions: ["Alcohol & opioids (extremely dangerous respiratory depression)", "Antifungals", "Grapefruit juice"]
      },
      clonazepam: {
        name: "Clonazepam 0.5mg",
        genericName: "Clonazepam",
        therapeuticClass: "Anticonvulsant & Anxiolytic (Benzodiazepine)",
        purpose: "Treats panic disorder, anxiety, and acts as an add-on therapy for seizures.",
        safetyCategory: "High Risk (Habit forming)",
        dosageWarning: "Avoid alcohol. Long-term use can cause physical dependence. Taper down when stopping.",
        sideEffects: ["Drowsiness", "Unsteady gait (ataxia)", "Fatigue", "Depression"],
        interactions: ["Alcohol", "Opioids", "Other sedatives"]
      },
      diazepam: {
        name: "Diazepam 5mg",
        genericName: "Diazepam",
        therapeuticClass: "Benzodiazepine",
        purpose: "Treats anxiety, muscle spasms, alcohol withdrawal symptoms, and acute seizures.",
        safetyCategory: "High Risk (Dependency Risk)",
        dosageWarning: "Highly sedating. Do not drive or operate machinery. Do not mix with alcohol or pain pills.",
        sideEffects: ["Muscle weakness", "Drowsiness", "Confusion", "Fatigue"],
        interactions: ["Alcohol", "Opioids", "Cimetidine"]
      },
      gabapentin: {
        name: "Gabapentin 300mg",
        genericName: "Gabapentin",
        therapeuticClass: "Neuropathic Pain agent & Anticonvulsant",
        purpose: "Treats nerve pain (diabetic neuropathy, post-herpetic neuralgia) and controls partial seizures.",
        safetyCategory: "Caution (Drowsiness / Mood Warning)",
        dosageWarning: "May cause suicidal thoughts or severe sleepiness. Do not stop taking this medication suddenly.",
        sideEffects: ["Drowsiness", "Dizziness", "Swelling in hands/feet", "Fatigue", "Coordination issues"],
        interactions: ["Antacids (take 2 hours apart)", "Opioids (increases sedation & breathing risks)", "Alcohol"]
      },
      pregabalin: {
        name: "Pregabalin 75mg",
        genericName: "Pregabalin",
        therapeuticClass: "Neuropathic Pain agent (Anticonvulsant)",
        purpose: "Treats fibromyalgia, diabetic nerve pain, spinal cord injury pain, and shingles pain.",
        safetyCategory: "Caution (Abuse Potential / Drowsiness)",
        dosageWarning: "Take as directed. Do not stop suddenly. Avoid alcohol. Report any visual disturbances.",
        sideEffects: ["Dizziness", "Somnolence (extreme sleepiness)", "Dry mouth", "Weight gain", "Blurred vision"],
        interactions: ["Alcohol", "Lorazepam / Benzodiazepines", "Pioglitazone"]
      },
      phenytoin: {
        name: "Phenytoin Sodium 100mg",
        genericName: "Phenytoin",
        therapeuticClass: "Antiepileptic (Hydantoin derivative)",
        purpose: "Controls and prevents tonic-clonic (grand mal) and psychomotor seizures.",
        safetyCategory: "Caution (Narrow therapeutic window)",
        dosageWarning: "Requires blood level monitoring. Maintain excellent oral hygiene (causes gum enlargement).",
        sideEffects: ["Gingival hyperplasia (gum overgrowth)", "Nystagmus (uncontrolled eye movement)", "Dizziness", "Slurred speech"],
        interactions: ["Amiodarone", "Cimetidine", "Oral contraceptives (decreases effectiveness)", "Warfarin"]
      },
      levetiracetam: {
        name: "Levetiracetam 500mg (Levipil)",
        genericName: "Levetiracetam",
        therapeuticClass: "Antiepileptic / Anticonvulsant",
        purpose: "Controls seizures in patients with epilepsy (partial, myoclonic, or tonic-clonic).",
        safetyCategory: "Caution (Mood changes / Behavioral side effects)",
        dosageWarning: "Take twice daily. Do not miss doses. Monitor for irritability, aggression, or mood swings.",
        sideEffects: ["Drowsiness", "Irritability / aggression", "Weakness", "Dizziness", "Headache"],
        interactions: ["Minimal drug interactions (kidney clearance)", "Alcohol"]
      },
      valproate: {
        name: "Valproic Acid / Sodium Valproate 500mg",
        genericName: "Valproic Acid",
        therapeuticClass: "Antiepileptic & Mood Stabilizer",
        purpose: "Treats epilepsy, bipolar disorder manic phases, and prevents migraine headaches.",
        safetyCategory: "Caution (Teratogenicity - Severe Birth Defects)",
        dosageWarning: "Highly dangerous in pregnancy (neural tube defects). Take with food. Monitor liver functions.",
        sideEffects: ["Nausea", "Weight gain", "Hair loss (temporary)", "Tremors", "Liver toxicity"],
        interactions: ["Aspirin", "Carbamazepine", "Lamotrigine", "Warfarin"]
      },
      lithium: {
        name: "Lithium Carbonate 300mg",
        genericName: "Lithium Carbonate",
        therapeuticClass: "Mood Stabilizer (Antimanic)",
        purpose: "Manages manic episodes and prevents relapse in Bipolar Disorder.",
        safetyCategory: "High Risk (Requires Lithium Level Blood Tests)",
        dosageWarning: "Requires regular blood testing to prevent toxicity. Stay consistently hydrated and maintain normal salt intake.",
        sideEffects: ["Hand tremors", "Increased urination", "Mild thirst", "Nausea", "Metallic taste"],
        interactions: ["NSAIDs like Ibuprofen (increases lithium toxicity)", "ACE inhibitors", "Diuretics"]
      },
      quetiapine: {
        name: "Quetiapine 25mg/100mg",
        genericName: "Quetiapine",
        therapeuticClass: "Atypical Antipsychotic",
        purpose: "Treats schizophrenia, bipolar disorder, and major depressive disorder.",
        safetyCategory: "Caution (Drowsiness / Metabolic effects)",
        dosageWarning: "Check blood sugar and lipid panels. Highly sedating — usually taken at bedtime.",
        sideEffects: ["Drowsiness", "Dry mouth", "Weight gain", "Orthostatic hypotension (dizziness when standing)"],
        interactions: ["Antihypertensives", "QT-prolonging drugs", "Alcohol"]
      },
      olanzapine: {
        name: "Olanzapine 5mg/10mg",
        genericName: "Olanzapine",
        therapeuticClass: "Atypical Antipsychotic",
        purpose: "Treats schizophrenia and manic/mixed episodes of Bipolar Disorder.",
        safetyCategory: "Caution (High Weight Gain / Metabolic Syndrome)",
        dosageWarning: "Monitor weight, blood sugar, and lipid profiles regularly. Do not discontinue abruptly.",
        sideEffects: ["Significant weight gain", "Increased appetite", "Somnolence", "Dry mouth", "Constipation"],
        interactions: ["Levodopa", "Fluvoxamine", "Ciprofloxacin"]
      },
      risperidone: {
        name: "Risperidone 2mg",
        genericName: "Risperidone",
        therapeuticClass: "Atypical Antipsychotic",
        purpose: "Treats schizophrenia, bipolar mania, and irritability associated with autism.",
        safetyCategory: "Caution (Prolactin elevation)",
        dosageWarning: "Report any muscle rigidity or tremors to your doctor. Stand up slowly from sitting position.",
        sideEffects: ["Weight gain", "Tremor / stiffness", "Sleepiness", "Increased prolactin levels"],
        interactions: ["Fluoxetine", "Paroxetine", "Levodopa", "Antihypertensives"]
      },
      acyclovir: {
        name: "Acyclovir 400mg",
        genericName: "Acyclovir",
        therapeuticClass: "Antiviral",
        purpose: "Treats viral infections like shingles, chickenpox, herpes simplex, and genital herpes.",
        safetyCategory: "Safe (Stay Hydrated)",
        dosageWarning: "Drink plenty of water to prevent kidney crystal formation. Start at the first sign of symptoms.",
        sideEffects: ["Nausea", "Diarrhea", "Headache", "Dizziness", "Kidney dysfunction (if dehydrated)"],
        interactions: ["Tenofovir", "Zidovudine", "Probenecid"]
      },
      oseltamivir: {
        name: "Oseltamivir Phosphate 75mg (Tamiflu)",
        genericName: "Oseltamivir",
        therapeuticClass: "Antiviral (Neuraminidase Inhibitor)",
        purpose: "Treats and prevents influenza (Flu) symptoms. Must be started within 48 hours of flu symptoms.",
        safetyCategory: "Safe",
        dosageWarning: "Take with food to minimize stomach upset. Complete the full 5-day course.",
        sideEffects: ["Nausea", "Vomiting", "Headache", "Unusual behavior/delirium (extremely rare in children)"],
        interactions: ["Live influenza vaccine (wait 2 weeks)"]
      },
      fluconazole: {
        name: "Fluconazole 150mg",
        genericName: "Fluconazole",
        therapeuticClass: "Antifungal (Triazole derivative)",
        purpose: "Treats vaginal, oral, and systemic fungal/yeast infections.",
        safetyCategory: "Safe (Often single dose)",
        dosageWarning: "Often taken as a single one-off tablet for vaginal candidiasis. Inform doctor of liver issues.",
        sideEffects: ["Headache", "Nausea", "Stomach pain", "Dizziness", "Diarrhea"],
        interactions: ["Statins (increases statin side effects)", "Warfarin", "Oral hypoglycemics"]
      },
      clotrimazole: {
        name: "Clotrimazole Topical 1%",
        genericName: "Clotrimazole",
        therapeuticClass: "Antifungal (Imidazole derivative)",
        purpose: "Treats athlete's foot, jock itch, ringworm, and skin yeast infections.",
        safetyCategory: "Safe (Topical use)",
        dosageWarning: "For external skin use only. Apply to clean, dry areas. Wash hands after application.",
        sideEffects: ["Local skin irritation", "Burning", "Redness or stinging"],
        interactions: ["None significant with topical form"]
      },
      metronidazole: {
        name: "Metronidazole 400mg (Flagyl)",
        genericName: "Metronidazole",
        therapeuticClass: "Nitroimidazole Antibiotic & Antiprotozoal",
        purpose: "Treats bacterial infections in vagina, stomach, joints, skin, and amoebic liver abscesses.",
        safetyCategory: "Caution (Strict Alcohol Block)",
        dosageWarning: "Do NOT consume alcohol during and for 48 hours after treatment (causes severe vomiting/headache). Take with food.",
        sideEffects: ["Metallic taste in mouth", "Nausea", "Headache", "Darkened urine (harmless)", "Anorexia"],
        interactions: ["Alcohol (Disulfiram-like reaction)", "Warfarin (extreme bleeding risk)", "Lithium"]
      },
      tinidazole: {
        name: "Tinidazole 500mg",
        genericName: "Tinidazole",
        therapeuticClass: "Antiprotozoal & Antibacterial",
        purpose: "Treats trichomoniasis, giardiasis, amebiasis, and bacterial vaginosis.",
        safetyCategory: "Caution (No Alcohol)",
        dosageWarning: "Do not consume alcohol. Take with food to avoid gastric irritation.",
        sideEffects: ["Metallic taste", "Nausea", "Indigestion", "Dizziness"],
        interactions: ["Alcohol", "Warfarin", "Lithium"]
      },
      ors: {
        name: "Oral Rehydration Salts (ORS / Electral)",
        genericName: "Electrolyte replacement formula",
        therapeuticClass: "Oral Rehydration solution",
        purpose: "Restores body fluids and essential minerals/electrolytes lost due to diarrhea, vomiting, and dehydration.",
        safetyCategory: "Safe",
        dosageWarning: "Dissolve the contents of one packet in exactly 1 liter of clean water. Do not boil or add sugar.",
        sideEffects: ["Mild nausea if drank too quickly"],
        interactions: ["None significant. Consult doctor if on severe potassium/sodium restricted diets."]
      },
      electral: {
        name: "Oral Rehydration Salts (ORS / Electral)",
        genericName: "Electrolyte replacement formula",
        therapeuticClass: "Oral Rehydration solution",
        purpose: "Restores body fluids and essential minerals/electrolytes lost due to diarrhea, vomiting, and dehydration.",
        safetyCategory: "Safe",
        dosageWarning: "Dissolve the contents of one packet in exactly 1 liter of clean water. Do not boil or add sugar.",
        sideEffects: ["Mild nausea if drank too quickly"],
        interactions: ["None significant. Consult doctor if on severe potassium/sodium restricted diets."]
      },
      'vitamin d3': {
        name: "Cholecalciferol (Vitamin D3) 60k IU",
        genericName: "Cholecalciferol",
        therapeuticClass: "Vitamin D supplement",
        purpose: "Prevents and treats vitamin D deficiency, osteomalacia, osteoporosis, and bone weakness.",
        safetyCategory: "Safe (Follow Dosage)",
        dosageWarning: "60k IU is usually taken ONCE A WEEK for 8-12 weeks, not daily. Take with a fatty meal or milk.",
        sideEffects: ["None at normal doses (Hypercalcemia if severely overdosed)"],
        interactions: ["Thiazide diuretics", "Orlistat (decreases absorption)", "Cholestyramine"]
      },
      'vitamin b12': {
        name: "Methylcobalamin (Vitamin B12) 1500mcg",
        genericName: "Methylcobalamin / Mecobalamin",
        therapeuticClass: "Vitamin B12 supplement",
        purpose: "Treats vitamin B12 deficiency, diabetic neuropathy, peripheral neuropathy, and anemia.",
        safetyCategory: "Safe",
        dosageWarning: "Take with or without food. Inform doctor if you have kidney or liver issues.",
        sideEffects: ["None significant", "Mild diarrhea (rare)"],
        interactions: ["Colchicine", "Metformin (long term metformin can decrease B12 absorption)"]
      },
      'folic acid': {
        name: "Folic Acid 5mg (Folvite)",
        genericName: "Folic Acid (Vitamin B9)",
        therapeuticClass: "Vitamin B supplement",
        purpose: "Treats folate deficiency anemia and prevents neural tube defects in pregnancy.",
        safetyCategory: "Safe (Crucial in pregnancy)",
        dosageWarning: "Highly recommended during preconception and early pregnancy. Take once daily.",
        sideEffects: ["Bitter taste", "Nausea", "Mild bloating (rare)"],
        interactions: ["Methotrexate", "Phenytoin (folic acid may reduce phenytoin levels)"]
      },
      folvite: {
        name: "Folic Acid 5mg (Folvite)",
        genericName: "Folic Acid (Vitamin B9)",
        therapeuticClass: "Vitamin B supplement",
        purpose: "Treats folate deficiency anemia and prevents neural tube defects in pregnancy.",
        safetyCategory: "Safe (Crucial in pregnancy)",
        dosageWarning: "Highly recommended during preconception and early pregnancy. Take once daily.",
        sideEffects: ["Bitter taste", "Nausea", "Mild bloating (rare)"],
        interactions: ["Methotrexate", "Phenytoin (folic acid may reduce phenytoin levels)"]
      },
      'ferrous sulphate': {
        name: "Ferrous Sulphate (Iron Supplement)",
        genericName: "Ferrous Sulphate",
        therapeuticClass: "Mineral supplement (Iron)",
        purpose: "Treats and prevents iron-deficiency anemia.",
        safetyCategory: "Safe (Causes dark stools)",
        dosageWarning: "Best taken on empty stomach (with vitamin C/orange juice). Causes harmless dark/black stools.",
        sideEffects: ["Constipation", "Nausea", "Black stools (harmless)", "Stomach cramps"],
        interactions: ["Calcium supplements & antacids (reduces iron absorption)", "Levothyroxine", "Tetracycline antibiotics"]
      },
      calcium: {
        name: "Calcium Carbonate + Vitamin D3",
        genericName: "Calcium Carbonate 500mg + Cholecalciferol 250 IU",
        therapeuticClass: "Mineral supplement (Calcium)",
        purpose: "Maintains healthy bones, teeth, and prevents osteopenia or osteoporosis.",
        safetyCategory: "Safe",
        dosageWarning: "Take with food to aid absorption. Do not take within 2 hours of iron or thyroid supplements.",
        sideEffects: ["Constipation", "Flatulence (gas)", "Bloating"],
        interactions: ["Thyroid hormone (Levothyroxine)", "Iron supplements", "Ciprofloxacin/Tetracyclines"]
      },
      shelcal: {
        name: "Shelcal 500",
        genericName: "Calcium Carbonate 500mg + Vitamin D3 250 IU",
        therapeuticClass: "Mineral supplement (Calcium)",
        purpose: "Used to treat calcium deficiency, maintain bone strength, and support muscle function.",
        safetyCategory: "Safe",
        dosageWarning: "Take with a meal. Stay hydrated to prevent kidney stones.",
        sideEffects: ["Constipation", "Mild gas"],
        interactions: ["Iron supplements", "Levothyroxine", "Tetracyclines"]
      },
      zincovit: {
        name: "Zincovit Tablet",
        genericName: "Multivitamins + Multiminerals + Zinc",
        therapeuticClass: "Nutritional Supplement",
        purpose: "Boosts immune system, aids recovery after illness, and treats nutritional deficiencies.",
        safetyCategory: "Safe",
        dosageWarning: "Take one tablet daily after food. Do not take on an empty stomach to prevent nausea.",
        sideEffects: ["Nausea (if taken empty stomach)", "Metallic taste in mouth"],
        interactions: ["High dose calcium can decrease zinc absorption"]
      },
      zinc: {
        name: "Zinc Sulfate Supplement",
        genericName: "Zinc Sulfate",
        therapeuticClass: "Essential Trace Mineral",
        purpose: "Aids immune health, wound healing, and reduces duration of acute diarrhea (especially in children).",
        safetyCategory: "Safe",
        dosageWarning: "Take after meals. Do not exceed recommended dosage.",
        sideEffects: ["Nausea", "Vomiting", "Stomach upset"],
        interactions: ["Tetracyclines", "Fluoroquinolone antibiotics (take 2 hours apart)"]
      },
      digoxin: {
        name: "Digoxin 0.25mg",
        genericName: "Digoxin",
        therapeuticClass: "Cardiac Glycoside (Antiarrhythmic)",
        purpose: "Treats heart failure and controls heart rate in patients with atrial fibrillation.",
        safetyCategory: "High Risk (Narrow Therapeutic Range)",
        dosageWarning: "Take exactly as directed. Check pulse before taking; if heart rate is <60 bpm, consult doctor.",
        sideEffects: ["Nausea / vomiting", "Visual halos (yellow-green vision - sign of toxicity)", "Arrhythmias"],
        interactions: ["Diuretics (electrolyte shifts increase digoxin toxicity)", "Amiodarone", "Spironolactone"]
      },
      nitroglycerin: {
        name: "Nitroglycerin Sublingual 0.5mg (Sorbitrate / Angispan)",
        genericName: "Nitroglycerin",
        therapeuticClass: "Vasodilator (Nitrate)",
        purpose: "Relieves chest pain (angina attack) quickly by dilating coronary arteries.",
        safetyCategory: "Caution (Sublingual administration)",
        dosageWarning: "Place tablet under tongue at first sign of chest pain. Sit down (causes rapid drop in blood pressure).",
        sideEffects: ["Throbbing headache (very common)", "Dizziness / lightheadedness", "Flushing", "Rapid heart rate"],
        interactions: ["Sildenafil / Viagra (extreme, life-threatening drop in blood pressure)", "Alcohol"]
      },
      multivitamin: {
        name: "AtoZ Multivitamin / Becosules",
        genericName: "B-Complex + Vitamin C + Zinc",
        therapeuticClass: "Multivitamins & Minerals",
        purpose: "Maintains general immunity, treats mouth ulcers, and resolves vitamin deficiencies.",
        safetyCategory: "Safe",
        dosageWarning: "Take once daily after a meal. Swallow tablet whole.",
        sideEffects: ["Bright yellow urine (harmless B-vitamin excretion)", "Unusual taste"],
        interactions: ["None significant at standard dietary levels"]
      },
      'cough syrup': {
        name: "Standard Cough Formula (Benadryl / Ascoril)",
        genericName: "Dextromethorphan / Ambroxol / Guaifenesin combo",
        therapeuticClass: "Antitussive / Expectorant",
        purpose: "Relieves throat irritation, dry cough, or clears heavy chest congestion.",
        safetyCategory: "Safe (May cause drowsiness)",
        dosageWarning: "Take using the provided measuring cup. Avoid driving if it contains sedating antihistamines.",
        sideEffects: ["Drowsiness", "Dry mouth", "Mild stomach irritation"],
        interactions: ["MAO inhibitors", "Alcohol"]
      },
      'pantoprazole + domperidone': {
        name: "Pan-D / Pantocid-D",
        genericName: "Pantoprazole 40mg + Domperidone 30mg SR",
        therapeuticClass: "Anti-reflux & Acid Reducer",
        purpose: "Treats GERD, severe acidity, and bloating by combining an acid blocker with an antiemetic.",
        safetyCategory: "Caution (Take before food)",
        dosageWarning: "Must be taken 30-60 minutes before breakfast. Swallow whole.",
        sideEffects: ["Dry mouth", "Headache", "Flatulence", "Diarrhea"],
        interactions: ["QT-prolonging medicines", "Ketoconazole", "Warfarin"]
      },
      'pan-d': {
        name: "Pan-D (Pantoprazole + Domperidone)",
        genericName: "Pantoprazole 40mg + Domperidone 30mg SR",
        therapeuticClass: "Anti-reflux & Acid Reducer",
        purpose: "Treats gastroesophageal reflux disease (GERD), heartburn, and stomach fullness/bloating.",
        safetyCategory: "Caution (Take before food)",
        dosageWarning: "Take on an empty stomach in the morning. Swallow whole, do not crush or chew.",
        sideEffects: ["Dry mouth", "Headache", "Mild stomach pain", "Diarrhea"],
        interactions: ["QT-prolonging drugs", "Ketoconazole", "Warfarin"]
      },
      'omeprazole + domperidone': {
        name: "Omez-D (Omeprazole + Domperidone)",
        genericName: "Omeprazole 20mg + Domperidone 10mg",
        therapeuticClass: "Anti-reflux & Acid Reducer",
        purpose: "Relieves indigestion, nausea, vomiting, and acid reflux.",
        safetyCategory: "Caution (Take before food)",
        dosageWarning: "Take 30 minutes before breakfast. Swallow whole.",
        sideEffects: ["Dry mouth", "Headache", "Dizziness", "Flatulence"],
        interactions: ["Clopidogrel", "Ketoconazole", "QT-prolonging drugs"]
      },
      'rabeprazole + domperidone': {
        name: "Razo-D / Rabicip-D",
        genericName: "Rabeprazole 20mg + Domperidone 30mg SR",
        therapeuticClass: "Anti-reflux & Acid Reducer",
        purpose: "Treats acidity, GERD, and nausea/bloating caused by delayed gastric emptying.",
        safetyCategory: "Caution (Take before food)",
        dosageWarning: "Take in the morning before breakfast. Swallow whole.",
        sideEffects: ["Dry mouth", "Headache", "Diarrhea", "Dizziness"],
        interactions: ["Ketoconazole", "QT-prolonging drugs", "Digoxin"]
      },
      aceclofenac: {
        name: "Aceclofenac 100mg (Zerodol)",
        genericName: "Aceclofenac",
        therapeuticClass: "NSAID (Painkiller)",
        purpose: "Reduces pain and inflammation in rheumatoid arthritis, osteoarthritis, and ankylosing spondylitis.",
        safetyCategory: "Caution (GI Bleed Risk)",
        dosageWarning: "Take after food. Do not take if you have severe kidney, liver, or heart issues.",
        sideEffects: ["Stomach upset", "Nausea", "Dizziness", "Acid reflux"],
        interactions: ["Aspirin/NSAIDs", "Warfarin", "Lithium", "Digoxin"]
      },
      'zerodol-sp': {
        name: "Zerodol-SP",
        genericName: "Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg",
        therapeuticClass: "Analgesic, Anti-inflammatory & Enzyme combo",
        purpose: "Reduces severe muscular pain, post-surgical pain, swelling, and joint inflammation.",
        safetyCategory: "Caution (Take after meals)",
        dosageWarning: "Always take after food. Do not take with other paracetamol-containing drugs.",
        sideEffects: ["Heartburn", "Stomach irritation", "Nausea", "Drowsiness"],
        interactions: ["Aspirin & other NSAIDs", "Blood thinners (Warfarin)", "Lithium", "Antihypertensives"]
      },
      mupirocin: {
        name: "Mupirocin Topical Ointment 2% (Bactroban)",
        genericName: "Mupirocin",
        therapeuticClass: "Topical Antibiotic",
        purpose: "Treats bacterial skin infections such as impetigo, folliculitis, and minor infected cuts.",
        safetyCategory: "Safe (Topical)",
        dosageWarning: "Apply a small amount to clean, dry skin 3 times daily. Wash hands. Complete course.",
        sideEffects: ["Local burning or stinging", "Itching", "Redness"],
        interactions: ["None significant with topical form"]
      },
      permethrin: {
        name: "Permethrin Cream 5%",
        genericName: "Permethrin",
        therapeuticClass: "Scabicide / Pediculicide",
        purpose: "Treats scabies and head lice infestations.",
        safetyCategory: "Safe (External Application)",
        dosageWarning: "Apply cream from neck down to soles of feet. Leave on for 8-14 hours, then wash off. Wash bedding in hot water.",
        sideEffects: ["Mild burning or stinging", "Itching or redness of skin"],
        interactions: ["None significant"]
      },
      heparin: {
        name: "Heparin Sodium Injection",
        genericName: "Heparin",
        therapeuticClass: "Anticoagulant (Blood Thinner)",
        purpose: "Prevents and treats blood clots in the veins, arteries, or lungs. Also used before surgery to reduce clot risk.",
        safetyCategory: "High Risk (Injection only / Monitoring required)",
        dosageWarning: "Administered via injection under medical supervision. Monitor partial thromboplastin time (aPTT) and watch for bleeding.",
        sideEffects: ["Easy bruising", "Bleeding at injection site", "Thrombocytopenia (low platelets - rare but serious)"],
        interactions: ["Aspirin & NSAIDs (severe bleeding risk)", "Oral anticoagulants (Warfarin, Rivaroxaban)", "Thrombolytics"]
      },
      amlopress: {
        name: "Amlopress-AT (Amlodipine + Atenolol)",
        genericName: "Amlodipine 5mg + Atenolol 50mg",
        therapeuticClass: "Antihypertensive Combination (Calcium Channel Blocker + Beta-Blocker)",
        purpose: "Dual action treatment for managing high blood pressure and preventing chest pain (angina).",
        safetyCategory: "Caution (Do not stop abruptly)",
        dosageWarning: "Take once daily. Do not stop suddenly as it may trigger chest pain or blood pressure rebound.",
        sideEffects: ["Swelling of ankles", "Dizziness", "Slow heart rate", "Cold fingers/toes", "Fatigue"],
        interactions: ["Other antihypertensives", "NSAIDs like Ibuprofen", "Digoxin", "Insulin (beta-blockers can mask low blood sugar signs)"]
      },
      atenolol: {
        name: "Atenolol 50mg",
        genericName: "Atenolol",
        therapeuticClass: "Antihypertensive & Selective Beta-Blocker",
        purpose: "Lowers blood pressure, slows heart rate, and prevents chest pain (angina).",
        safetyCategory: "Caution (Do not stop abruptly)",
        dosageWarning: "Take once daily. Monitor heart rate. Report slow heart rate or breathing difficulty.",
        sideEffects: ["Cold extremities", "Fatigue", "Dizziness", "Slow heart rate"],
        interactions: ["Calcium channel blockers (Amlodipine, Verapamil)", "NSAIDs", "Insulin"]
      },
      bisoprolol: {
        name: "Bisoprolol Fumarate 5mg",
        genericName: "Bisoprolol",
        therapeuticClass: "Beta-Blocker",
        purpose: "Treats high blood pressure and mild to moderate heart failure.",
        safetyCategory: "Caution (Do not stop abruptly)",
        dosageWarning: "Take at the same time daily. Do not discontinue without consulting your cardiologist.",
        sideEffects: ["Dizziness", "Slow heartbeat", "Fatigue", "Cold hands/feet"],
        interactions: ["Other blood pressure medications", "NSAIDs", "Insulin"]
      },
      furosemide: {
        name: "Furosemide 40mg (Lasix)",
        genericName: "Furosemide",
        therapeuticClass: "Loop Diuretic (Water Pill)",
        purpose: "Reduces fluid retention (edema) caused by heart failure, liver disease, or kidney disease.",
        safetyCategory: "Caution (Electrolyte & Hydration check)",
        dosageWarning: "Take in the morning to prevent waking up at night. Eat potassium-rich foods or take supplements as prescribed.",
        sideEffects: ["Dehydration", "Electrolyte imbalance (low potassium/sodium)", "Dizziness", "Muscle cramps"],
        interactions: ["Digoxin (toxicity risk if potassium is low)", "Aminoglycoside antibiotics", "NSAIDs"]
      },
      spironolactone: {
        name: "Spironolactone 25mg/50mg (Aldactone)",
        genericName: "Spironolactone",
        therapeuticClass: "Potassium-Sparing Diuretic / Aldosterone Antagonist",
        purpose: "Treats fluid retention (edema) in heart failure/liver cirrhosis, and manages high blood pressure.",
        safetyCategory: "Caution (High Potassium Risk)",
        dosageWarning: "Avoid potassium supplements or salt substitutes containing potassium to prevent hyperkalemia.",
        sideEffects: ["Hyperkalemia (high blood potassium)", "Gynecomastia (breast swelling in men)", "Dizziness", "Dehydration"],
        interactions: ["ACE Inhibitors / ARBs (extreme hyperkalemia risk)", "NSAIDs", "Lithium"]
      },
      codeine: {
        name: "Codeine Phosphate 15mg/30mg",
        genericName: "Codeine",
        therapeuticClass: "Opioid Analgesic & Antitussive",
        purpose: "Relieves mild to moderately severe pain and suppresses dry, irritating coughs.",
        safetyCategory: "High Risk (Habit forming / Respiratory depression)",
        dosageWarning: "May be habit-forming. Causes drowsiness. Avoid alcohol. Do not exceed standard safety guidelines.",
        sideEffects: ["Drowsiness", "Constipation", "Nausea", "Lightheadedness", "Dry mouth"],
        interactions: ["Alcohol & sedatives (severe respiratory depression)", "Antidepressants", "Other opioids"]
      }
    };

    // Generate drug aliases dynamically to cover brands and alternative spellings
    const medicineMocks = { ...baseMocks };
    
    const aliases = {
      heparin: 'heparin',
      amlopress: 'amlopress',
      'amlopress-at': 'amlopress',
      'amlopress at': 'amlopress',
      dolo: 'paracetamol',
      'dolo 650': 'paracetamol',
      crocin: 'paracetamol',
      advil: 'ibuprofen',
      motrin: 'ibuprofen',
      mox: 'amoxicillin',
      azee: 'azithromycin',
      'azithromycin 500mg': 'azithromycin',
      'azithromycin 500': 'azithromycin',
      'azithromycin 250': 'azithromycin',
      azythromycin: 'azithromycin',
      atoz: 'multivitamin',
      lipitor: 'atorvastatin',
      crestor: 'rosuvastatin',
      rosuvas: 'rosuvastatin',
      pan: 'pantoprazole',
      'pan 40': 'pantoprazole',
      pantocid: 'pantoprazole',
      omez: 'omeprazole',
      razo: 'rabeprazole',
      rablet: 'rabeprazole',
      nexium: 'esomeprazole',
      esoz: 'esomeprazole',
      aciloc: 'ranitidine',
      famocid: 'famotidine',
      domstal: 'domperidone',
      motilium: 'domperidone',
      emeset: 'ondansetron',
      zofran: 'ondansetron',
      zyrtec: 'cetirizine',
      okacet: 'cetirizine',
      cetrizine: 'cetirizine',
      '1al': 'levocetirizine',
      levocet: 'levocetirizine',
      levocetrizine: 'levocetirizine',
      singulair: 'montelukast',
      montair: 'montelukast',
      telma: 'telmisartan',
      'telma 40': 'telmisartan',
      telmikind: 'telmisartan',
      norvasc: 'amlodipine',
      amlokind: 'amlodipine',
      cozaar: 'losartan',
      losar: 'losartan',
      olmecip: 'olmesartan',
      cardace: 'ramipril',
      prinivil: 'lisinopril',
      lipril: 'lisinopril',
      tenormin: 'atenolol',
      metolar: 'metoprolol',
      lopressor: 'metoprolol',
      concor: 'bisoprolol',
      lasix: 'furosemide',
      aldactone: 'spironolactone',
      ecosprin: 'aspirin',
      disprin: 'aspirin',
      plavix: 'clopidogrel',
      clopivas: 'clopidogrel',
      coumadin: 'warfarin',
      xarelto: 'rivaroxaban',
      eliquis: 'apixaban',
      amaryl: 'glimepiride',
      glimy: 'glimepiride',
      galvus: 'vildagliptin',
      januvia: 'sitagliptin',
      forxiga: 'dapagliflozin',
      ciplox: 'ciprofloxacin',
      cifran: 'ciprofloxacin',
      taxim: 'cefixime',
      'taxim-o': 'cefixime',
      'taxim o': 'cefixime',
      zifi: 'cefixime',
      cepodem: 'cefpodoxime',
      cleocin: 'clindamycin',
      thyronorm: 'levothyroxine',
      eltroxin: 'levothyroxine',
      thyroxine: 'levothyroxine',
      wysolone: 'prednisolone',
      decadron: 'dexamethasone',
      dexona: 'dexamethasone',
      medrol: 'methylprednisolone',
      hcqs: 'hydroxychloroquine',
      plaquenil: 'hydroxychloroquine',
      folitrax: 'methotrexate',
      asthalin: 'salbutamol',
      ventolin: 'salbutamol',
      zentel: 'albendazole',
      ivecop: 'ivermectin',
      voveran: 'diclofenac',
      voltaren: 'diclofenac',
      naprosyn: 'naproxen',
      aleve: 'naproxen',
      ultracet: 'tramadol',
      zoloft: 'sertraline',
      prozac: 'fluoxetine',
      lexapro: 'escitalopram',
      nexito: 'escitalopram',
      xanax: 'alprazolam',
      alprax: 'alprazolam',
      rivotril: 'clonazepam',
      valium: 'diazepam',
      calmpose: 'diazepam',
      gabantin: 'gabapentin',
      lyrica: 'pregabalin',
      dilantin: 'phenytoin',
      eptoin: 'phenytoin',
      keppra: 'levetiracetam',
      levipil: 'levetiracetam',
      depakote: 'valproate',
      lithosun: 'lithium',
      seroquel: 'quetiapine',
      zyprexa: 'olanzapine',
      risperdal: 'risperidone',
      zovirax: 'acyclovir',
      tamiflu: 'oseltamivir',
      diflucan: 'fluconazole',
      candid: 'clotrimazole',
      flagyl: 'metronidazole',
      metrogyl: 'metronidazole',
      electral: 'ors',
      calcirol: 'vitamin d3',
      methylcobalamin: 'vitamin b12',
      mecobalamin: 'vitamin b12',
      folvite: 'folic acid',
      feosol: 'ferrous sulphate',
      shelcal: 'calcium',
      zincovit: 'zinc'
    };

    for (const [alias, canonical] of Object.entries(aliases)) {
      if (baseMocks[canonical]) {
        medicineMocks[alias] = baseMocks[canonical];
      }
    }

    const lines = prompt.split(/[\n,;]+/).map(l => l.trim()).filter(l => l.length > 0);
    const results = [];
    const seenNames = new Set();

    for (const line of lines) {
      const lineLower = line.toLowerCase();
      // Remove noise terms
      const cleaned = lineLower
        .replace(/rx/gi, '')
        .replace(/\d+\s*mcg/gi, '')
        .replace(/\d+\s*mg/gi, '')
        .replace(/\d+\s*g/gi, '')
        .replace(/\d+\s*ml/gi, '')
        .replace(/tablet/gi, '')
        .replace(/tab/gi, '')
        .replace(/capsule/gi, '')
        .replace(/cap/gi, '')
        .replace(/syrup/gi, '')
        .replace(/suspension/gi, '')
        .replace(/injection/gi, '')
        .replace(/inj/gi, '')
        .replace(/ointment/gi, '')
        .replace(/cream/gi, '')
        .replace(/[\d\-\.\/]+/g, '') // remove pure numbers, dosages
        .replace(/[^a-zA-Z\s]/g, '') // remove special characters
        .trim();

      if (!cleaned) continue;

      const words = cleaned.split(/\s+/).filter(w => w.length >= 3);
      if (words.length === 0) continue;

      let matchedItem = null;

      // Check 1: Exact match on the cleaned phrase (e.g. "dolo 650" -> "dolo")
      const joinedClean = words.join(' ');
      if (medicineMocks[joinedClean]) {
        matchedItem = medicineMocks[joinedClean];
      } else {
        // Check 2: Try exact match on individual words
        for (const word of words) {
          if (medicineMocks[word]) {
            matchedItem = medicineMocks[word];
            break;
          }
        }
      }

      // Check 3: Substring match (e.g. check if a key is inside the cleaned phrase)
      if (!matchedItem) {
        for (const key of Object.keys(medicineMocks)) {
          if (joinedClean.includes(key) || key.includes(joinedClean)) {
            matchedItem = medicineMocks[key];
            break;
          }
        }
      }

      // Check 4: Fuzzy prefix match (e.g. "met" matches "metformin", "amlod" matches "amlodipine")
      if (!matchedItem && joinedClean.length >= 3) {
        for (const key of Object.keys(medicineMocks)) {
          if (key.startsWith(joinedClean) || joinedClean.startsWith(key)) {
            matchedItem = medicineMocks[key];
            break;
          }
        }
      }

      if (matchedItem) {
        if (!seenNames.has(matchedItem.name)) {
          results.push(matchedItem);
          seenNames.add(matchedItem.name);
        }
      } else {
        // Honest fallback for unrecognized medicines
        const candidate = words.find(w => w.length >= 3) || cleaned;
        if (candidate) {
          const capitalized = candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase();
          if (!seenNames.has(capitalized)) {
            results.push({
              name: capitalized,
              genericName: "Information not available in offline database",
              therapeuticClass: "Unrecognized / Offline Fallback",
              purpose: `This medicine ("${capitalized}") was not found in our offline medical database. For accurate information, please consult your prescribing doctor or local pharmacist, or search verified drug portals.`,
              safetyCategory: "Consult Doctor",
              dosageWarning: "Please consult your prescribing doctor or pharmacist for correct dosage instructions.",
              sideEffects: ["Consult your healthcare provider or pharmacist for information on side effects."],
              interactions: ["Consult your healthcare provider regarding potential drug-to-drug interactions."]
            });
            seenNames.add(capitalized);
          }
        }
      }
    }

    if (results.length === 0) {
      results.push(medicineMocks.metformin);
    }

    return JSON.stringify({
      medicines: results,
      safetyGuardrails: "This is a machine analysis. Never modify your prescribed medication dosage or stop treatment without consulting your prescribing physician."
    });
  }

  // Scenario 3: Lab Report Analyzer
  if (sysLower.includes('lab') || sysLower.includes('analyzer') || promptLower.includes('hba1c') || promptLower.includes('cholesterol') || promptLower.includes('mg/dl')) {
    const parseMockLabReport = (inputText) => {
      const textLower = inputText.toLowerCase();
      const markers = [];

      const markerDefinitions = [
        {
          names: ['hba1c', 'a1c', 'hb a1c'],
          key: 'HbA1c',
          unit: '%',
          normalRange: '4.0% - 5.6%',
          ranges: { low: [0, 4.0], normal: [4.0, 5.7], elevated: [5.7, 6.5], high: [6.5, 25] },
          explanations: {
            low: 'Your HbA1c is low. This is rare unless associated with chronic hypoglycemia or red blood cell lifespan variations.',
            normal: 'Your HbA1c is within the healthy reference range. This indicates good average blood sugar control over the past 3 months.',
            elevated: 'Your HbA1c is slightly elevated (pre-diabetes range). This indicates an increased risk of developing type 2 diabetes. Lifestyle modifications are recommended.',
            high: 'Your HbA1c is high (diabetes range). This suggests active diabetes. Regular monitoring and clinical consultation are necessary.'
          },
          recommendations: {
            low: 'Consult your doctor to evaluate potential nutritional deficiencies or metabolic conditions.',
            normal: 'Continue maintaining a balanced diet, regular exercise, and healthy lifestyle habits.',
            elevated: 'Consider reducing simple carbohydrate intake, increasing daily physical activity, and consulting a physician.',
            high: 'Engage with a primary care provider or endocrinologist to design a glycemic management plan, which may include medication and dietary counselling.'
          }
        },
        {
          names: ['glucose fasting', 'fasting blood sugar', 'fasting sugar', 'fbs', 'fasting glucose'],
          key: 'Glucose Fasting',
          unit: 'mg/dL',
          normalRange: '70 - 100 mg/dL',
          ranges: { low: [0, 70], normal: [70, 100], elevated: [100, 126], high: [126, 1000] },
          explanations: {
            low: 'Your fasting blood sugar is low (hypoglycemia), which can cause shakiness, sweating, and dizziness.',
            normal: 'Your fasting glucose is normal. This indicates healthy fasting glucose clearance and insulin sensitivity.',
            elevated: 'Your fasting glucose is elevated (impaired fasting glucose), corresponding to pre-diabetes.',
            high: 'Your fasting glucose is in the diabetic range. This suggests persistent hyperglycemia or insulin resistance.'
          },
          recommendations: {
            low: 'Consume a fast-acting carbohydrate (e.g. fruit juice, honey) immediately, and speak to your doctor if this is recurring.',
            normal: 'Continue with your regular diet and active lifestyle.',
            elevated: 'Focus on low-glycemic foods, exercise regularly, and monitor blood sugar levels.',
            high: 'Schedule a visit with your physician to discuss formal metabolic tests and potential management strategies.'
          }
        },
        {
          names: ['glucose random', 'random blood sugar', 'random glucose', 'rbs', 'blood sugar', 'glucose'],
          key: 'Glucose Random',
          unit: 'mg/dL',
          normalRange: '70 - 140 mg/dL',
          ranges: { low: [0, 70], normal: [70, 140], elevated: [140, 200], high: [200, 1000] },
          explanations: {
            low: 'Your blood sugar is low, indicating hypoglycemia.',
            normal: 'Your blood sugar is in the normal random range.',
            elevated: 'Your blood sugar is elevated. This is often seen shortly after a heavy meal but can indicate pre-diabetic tendencies.',
            high: 'Your blood sugar is highly elevated. This suggests diabetes.'
          },
          recommendations: {
            low: 'Have a snack or sugary drink, and monitor your symptoms.',
            normal: 'Maintain regular healthy eating habits.',
            elevated: 'Limit processed sugars, increase dietary fiber, and discuss with a doctor.',
            high: 'Consult a medical practitioner for diagnostic follow-up and clinical management.'
          }
        },
        {
          names: ['total cholesterol', 'cholesterol total', 'cholesterol', 'tchol'],
          key: 'Total Cholesterol',
          unit: 'mg/dL',
          normalRange: '100 - 200 mg/dL',
          ranges: { low: [0, 100], normal: [100, 200], elevated: [200, 240], high: [240, 1000] },
          explanations: {
            low: 'Your total cholesterol is lower than standard, which is occasionally seen in malnutrition or severe liver disease.',
            normal: 'Your total cholesterol is optimal, indicating a healthy lipid profile and lower cardiovascular risk.',
            elevated: 'Your total cholesterol is borderline high. This increases the risk of plaque build-up in arteries over time.',
            high: 'Your total cholesterol is high. This is a risk factor for cardiovascular diseases, coronary artery disease, and stroke.'
          },
          recommendations: {
            low: 'Focus on a nutrient-rich diet with healthy fats (nuts, seeds, olive oil).',
            normal: 'Maintain your current diet consisting of healthy fats, fiber, and regular exercise.',
            elevated: 'Reduce saturated and trans fats, increase soluble fiber, and engage in aerobic exercise.',
            high: 'Consult your physician. A lipid panel (HDL, LDL, Triglycerides) and cardiovascular risk assessment are advised.'
          }
        },
        {
          names: ['hemoglobin', 'hb', 'hgb'],
          key: 'Hemoglobin',
          unit: 'g/dL',
          normalRange: '12.0 - 17.5 g/dL',
          ranges: { low: [0, 12.0], normal: [12.0, 17.5], elevated: [17.5, 18.5], high: [18.5, 30] },
          explanations: {
            low: 'Your hemoglobin is low, suggesting anemia. This reduces the oxygen-carrying capacity of your blood, leading to fatigue.',
            normal: 'Your hemoglobin levels are optimal, indicating healthy red blood cell counts and oxygen transport.',
            elevated: 'Your hemoglobin is slightly elevated.',
            high: 'Your hemoglobin is high. This can indicate dehydration, smoking, chronic hypoxia, or polycythemia.'
          },
          recommendations: {
            low: 'Increase consumption of iron-rich foods (spinach, lentils, red meat) and Vitamin C. Speak to your doctor about checking ferritin levels.',
            normal: 'Maintain a balanced diet with sufficient iron, folate, and Vitamin B12.',
            elevated: 'Ensure you are staying properly hydrated.',
            high: 'Drink plenty of water. Consult a physician to rule out respiratory issues, sleep apnea, or bone marrow conditions.'
          }
        },
        {
          names: ['creatinine', 'creat', 'serum creatinine'],
          key: 'Creatinine',
          unit: 'mg/dL',
          normalRange: '0.6 - 1.2 mg/dL',
          ranges: { low: [0, 0.6], normal: [0.6, 1.2], elevated: [1.2, 1.5], high: [1.5, 20] },
          explanations: {
            low: 'Your creatinine is low. This is often associated with low muscle mass, pregnancy, or severe malnutrition.',
            normal: 'Your creatinine is normal, suggesting healthy glomerular filtration and kidney clearance.',
            elevated: 'Your creatinine is borderline elevated, suggesting mild kidney strain or dehydration.',
            high: 'Your creatinine is high. This indicates reduced kidney function or acute kidney injury.'
          },
          recommendations: {
            low: 'Ensure adequate dietary protein and strength training to maintain muscle health.',
            normal: 'Maintain healthy hydration levels (around 2-3 liters of water daily).',
            elevated: 'Stay well-hydrated, avoid excessive protein supplements or NSAID painkillers, and check again in a few days.',
            high: 'Consult a doctor or nephrologist immediately. Avoid taking nephrotoxic medications like ibuprofen or naproxen.'
          }
        }
      ];

      for (const def of markerDefinitions) {
        let matchedName = null;
        let matchIdx = -1;

        for (const name of def.names) {
          const idx = textLower.indexOf(name);
          if (idx !== -1) {
            matchedName = name;
            matchIdx = idx;
            break;
          }
        }

        if (matchedName !== null) {
          const substring = textLower.substring(matchIdx + matchedName.length, matchIdx + matchedName.length + 40);
          const numMatch = substring.match(/[:\s\-\=\+]?(\d+(\.\d+)?)/);
          if (numMatch) {
            const val = parseFloat(numMatch[1]);
            if (!isNaN(val)) {
              let status = 'Normal';
              let exp = def.explanations.normal;
              let rec = def.recommendations.normal;

              if (val < def.ranges.low[1]) {
                status = 'Low';
                exp = def.explanations.low;
                rec = def.recommendations.low;
              } else if (val >= def.ranges.high[0]) {
                status = 'Elevated (High)';
                exp = def.explanations.high;
                rec = def.recommendations.high;
              } else if (val >= def.ranges.elevated[0] && val < def.ranges.elevated[1]) {
                status = 'Elevated';
                exp = def.explanations.elevated;
                rec = def.recommendations.elevated;
              }

              markers.push({
                name: def.key,
                value: val,
                unit: def.unit,
                status: status,
                normalRange: def.normalRange,
                explanation: exp,
                educationalRecommendation: rec
              });
            }
          }
        }
      }

      if (markers.length === 0) {
        markers.push({
          name: "Glucose Fasting",
          value: 120,
          unit: "mg/dL",
          status: "Elevated",
          normalRange: "70 - 100 mg/dL",
          explanation: "Your fasting blood sugar is 120 mg/dL, which is elevated (pre-diabetes range). This indicates impaired fasting glucose.",
          educationalRecommendation: "Focus on reducing sugar intake, exercise regularly, and monitor your glucose levels."
        });
      }

      return {
        markers,
        generalSummary: markers.some(m => m.status.toLowerCase().includes('elevated') || m.status.toLowerCase().includes('low'))
          ? "One or more blood markers are outside the reference range. Please consult your physician for evaluation."
          : "All blood markers parsed are within normal limits. Maintain your healthy routine.",
        safetyDisclaimer: "Educational summary only. Not a clinical diagnosis."
      };
    };

    return JSON.stringify(parseMockLabReport(prompt));
  }

  // Scenario 4: Single Medicine Details Fallback
  if (sysLower.includes('clinical pharmacology model') || sysLower.includes('medicine name')) {
    return JSON.stringify({
      genericName: `${prompt} Generic`,
      description: `Simulated description for ${prompt}. Commonly used to treat related symptoms.`,
      safetyCategory: "Caution",
      sideEffects: [`Side effect 1 for ${prompt}`, `Side effect 2 for ${prompt}`],
      interactions: [`Interaction with alcohol`, `Do not take with blood thinners`]
    });
  }

  // Fallback default response
  return JSON.stringify({
    text: `[Simulated ${modelName}] Prescrypto Response to: "${prompt.substring(0, 50)}..."`,
    disclaimer: "Disclaimer: Prescrypto provides health literacy information. We do not replace doctors, diagnose, or prescribe.",
    translatedText: "An educational response generated securely."
  });
}

module.exports = {
  generateAIResponse,
  checkSafetyLimits
};
