import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      appName: "PresCrypto",
      tagline: "Empowering Health Literacy, Defending Scientific Truth",
      nav: {
        dashboard: "Dashboard",
        whatsappScanner: "WhatsApp Myth Scanner",
        prescriptionDecoder: "Rx Decoder",
        labAnalyzer: "Lab Analyzer",
        learningHub: "Learning Hub",
        login: "Login",
        logout: "Logout"
      },
      dashboard: {
        welcome: "Welcome back",
        heroTitle: "Fight Medical Misinformation & Decode Reports Safely",
        heroDesc: "Upload your prescriptions, analyze lab outcomes, and factcheck WhatsApp forwards using clinical RAG parameters. Secure, safe, and doctor-approved instructions.",
        elderlyBanner: "Elderly Mode Active: Large fonts and speech narration enabled.",
        modules: "Platform Tools"
      ,
        statsDebunked: "Forwards Debunked",
        statsIndexed: "Medicines Indexed",
        statsSources: "Sources Cited"
      },
      scanner: {
        title: "WhatsApp Medical Misinformation Scanner",
        desc: "Upload screenshots or paste forward messages to extract claims, detect scaremongering language, and generate one-click shareable corrections.",
        uploadBtn: "Upload Screenshot",
        pastePlaceholder: "Paste forwarded WhatsApp message here...",
        analyzeBtn: "Scan & Debunk Claim",
        scanning: "Scanning details...",
        results: "Scan Assessment",
        fearMeter: "Fear-Manipulation Meter",
        confidence: "Evidence Confidence",
        correction: "Evidence-Backed Correction",
        citations: "Verified Citations",
        dangerousAlert: "⚠️ DANGEROUS REMEDY DETECTED!",
        shareBtn: "Share Debunk on WhatsApp",
        extractedText: "Extracted Forward Text"
      },
      prescription: {
        title: "Prescription Decoder",
        desc: "Upload a medical slip to extract dosage codes, list active molecules, and check drug-to-drug interactions.",
        uploadBtn: "Upload Prescription Slip",
        decodeBtn: "Decode Prescription",
        safetyWarn: "⚠️ SAFETY GUARDRAILS: We do not prescribe or change therapies. Consult a doctor.",
        medList: "Decoded Medicines",
        generic: "Generic Formula",
        purpose: "Therapeutic Purpose",
        dosage: "Dosage Advice",
        sideEffects: "Known Side Effects",
        interactions: "Drug Interactions",
        class: "Therapeutic Class"
      },
      lab: {
        title: "Lab Report Analyzer",
        desc: "Upload blood test results to compare against normal physiological metrics.",
        uploadBtn: "Upload Lab Panel",
        analyzeBtn: "Analyze Markers",
        normal: "Normal Range",
        markerName: "Marker Name",
        value: "Measured Value",
        status: "Clinical Status",
        explanation: "Simple Definition"
      },
      learning: {
        title: "Health Literacy Hub",
        desc: "Learn from structured guides to read medical forms, spot online misinformation, and verify science.",
        duration: "duration",
        quiz: {
          title: "Daily Health Literacy Challenge",
          desc: "Test your skills in identifying medical misstatements! Take a quiz and earn your digital badge.",
          startBtn: "Start Quiz",
          submitBtn: "Submit Answer",
          nextBtn: "Next Question",
          finishBtn: "Finish Quiz",
          restartBtn: "Restart Quiz",
          congrats: "Congratulations!",
          congratsDesc: "You have earned your 'Verified Health Researcher' digital badge.",
          score: "Your Score: {{score}} / {{total}}",
          q1_q: "A message claims an herb 'cures cancer in 48 hours'. What is the warning sign?",
          q1_o1: "It claims a rapid, complete cure for a complex disease without scientific citations.",
          q1_o2: "It was forwarded by a family member.",
          q1_o3: "It mentions the name of a natural ingredient.",
          q2_q: "If your blood pressure becomes normal after taking pills, what should you do?",
          q2_o1: "Stop taking the pills since the blood pressure is cured.",
          q2_o2: "Reduce the dose to half to prevent side effects.",
          q2_o3: "Continue taking the pills as prescribed, since normal readings prove the medication is controlling it.",
          q3_q: "Are antibiotics required to treat the common cold or flu?",
          q3_o1: "Yes, antibiotics kill all viruses.",
          q3_o2: "No, colds and flu are caused by viruses, and antibiotics only target bacteria.",
          q3_o3: "Yes, taking antibiotics prevents viral infections from spreading."
        }
      },
      accessibility: {
        narrate: "Narrate Page",
        stopNarrate: "Stop Audio",
        elderly: "Elderly Mode",
        normalFont: "Regular Text"
      },
      speech: {
        langChanged: "Language changed to {{name}}",
        intro: "PresCrypto protects health safely. Explore the WhatsApp Medical Scanner to debunk claims, check prescriptions for side effects, or inspect lab report outcomes.",
        scannerTextSuccess: "Scanner finished. Classification is {{classification}}.",
        scannerScreenshotSuccess: "Screenshot parsed successfully. Extracted text classified as {{classification}}",
        prescriptionSuccess: "Prescription decoded successfully. Please review the safety warnings and medicine interactions.",
        labSuccess: "Lab report analyzed successfully. You can review marker indicators below."
      ,
        elderlyEnabled: "Elderly mode enabled. Large text and voice narration active.",
        elderlyDisabled: "Elderly mode disabled. Regular font active."
      }
    }
  },
  hi: {
    translation: {
      appName: "प्रिस्क्रिप्टो",
      tagline: "स्वास्थ्य साक्षरता सशक्तिकरण, वैज्ञानिक सत्य की रक्षा",
      nav: {
        dashboard: "डैशबोर्ड",
        whatsappScanner: "व्हाट्सएप मिथक स्कैनर",
        prescriptionDecoder: "Rx डिकोडर",
        labAnalyzer: "लैब विश्लेषक",
        learningHub: "ज्ञान केंद्र",
        login: "लॉगिन",
        logout: "लॉगआउट"
      },
      dashboard: {
        welcome: "आपका स्वागत है",
        heroTitle: "चिकित्सा गलत सूचना से लड़ें और रिपोर्ट सुरक्षित रूप से समझें",
        heroDesc: "अपनी दवाओं की पर्ची अपलोड करें, प्रयोगशाला परिणामों का विश्लेषण करें, और वैज्ञानिक प्रमाणों का उपयोग करके व्हाट्सएप दावों की जांच करें।",
        elderlyBanner: "बुजुर्ग मोड सक्रिय: बड़े फॉन्ट और आवाज वाचन सक्षम।",
        modules: "मंच उपकरण"
      ,
        statsDebunked: "फ़ॉरवर्ड्स डीबंक किए गए",
        statsIndexed: "दवाइयां इंडेक्स की गईं",
        statsSources: "स्रोतों का हवाला दिया गया"
      },
      scanner: {
        title: "व्हाट्सएप मेडिकल अफवाह स्कैनर",
        desc: "दावों को खोजने, डर फैलाने वाली भाषा की पहचान करने और एक-क्लिक में साझा करने योग्य सुधार तैयार करने के लिए स्क्रीनशॉट अपलोड करें या संदेश पेस्ट करें।",
        uploadBtn: "स्क्रीनशॉट अपलोड करें",
        pastePlaceholder: "यहाँ फॉरवर्ड किया गया व्हाट्सएप संदेश पेस्ट करें...",
        analyzeBtn: "दावे की जाँच करें",
        scanning: "जाँच की जा रही है...",
        results: "जाँच परिणाम",
        fearMeter: "डर-अतिशयोक्ति पैमाना",
        confidence: "प्रमाण विश्वसनीयता",
        correction: "तथ्य आधारित सुधार",
        citations: "सत्यापित संदर्भ",
        dangerousAlert: "⚠️ खतरनाक उपाय पाया गया!",
        shareBtn: "व्हाट्सएप पर शेयर करें",
        extractedText: "निकाला गया संदेश"
      },
      prescription: {
        title: "पर्चे का अनुवाद (डिकोडर)",
        desc: "खुराक के संकेतों को समझने, सक्रिय तत्वों को जानने और दवाओं के आपसी दुष्प्रभावों की जांच के लिए पर्चे की फोटो अपलोड करें।",
        uploadBtn: "दवा पर्ची अपलोड करें",
        decodeBtn: "पर्चा डिकोड करें",
        safetyWarn: "⚠️ सुरक्षा निर्देश: हम दवाइयां नहीं लिखते हैं। डॉक्टर की सलाह अवश्य लें।",
        medList: "समझी गई दवाएं",
        generic: "जेनेरिक नाम",
        purpose: "उपयोग का कारण",
        dosage: "खुराक निर्देश",
        sideEffects: "संभावित दुष्प्रभाव",
        interactions: "दवाओं का आपसी प्रभाव",
        class: "चिकित्सीय श्रेणी"
      },
      lab: {
        title: "लैब रिपोर्ट विश्लेषक",
        desc: "सामान्य शारीरिक मानों के साथ रक्त परीक्षण के परिणामों की तुलना करने के लिए रिपोर्ट अपलोड करें।",
        uploadBtn: "रिपोर्ट अपलोड करें",
        analyzeBtn: "विश्लेषण करें",
        normal: "सामान्य सीमा",
        markerName: "जांच का नाम",
        value: "मापा गया मूल्य",
        status: "स्थिति",
        explanation: "सरल परिभाषा"
      },
      learning: {
        title: "स्वास्थ्य ज्ञान केंद्र",
        desc: "चिकित्सा रिपोर्ट पढ़ना सीखें, ऑनलाइन अफवाहों को पहचानें और वैज्ञानिक तथ्यों को जानें।",
        quiz: {
          title: "दैनिक स्वास्थ्य साक्षरता चुनौती",
          desc: "चिकित्सा अफवाहों को पहचानने में अपने कौशल का परीक्षण करें! प्रश्नोत्तरी लें और डिजिटल बैज अर्जित करें।",
          startBtn: "क्विज़ शुरू करें",
          submitBtn: "उत्तर सबमिट करें",
          nextBtn: "अगला प्रश्न",
          finishBtn: "क्विज़ समाप्त करें",
          restartBtn: "क्विज़ पुनरारंभ करें",
          congrats: "बधाई हो!",
          congratsDesc: "आपने 'सत्यापित स्वास्थ्य शोधकर्ता' डिजिटल बैज अर्जित किया है।",
          score: "आपका स्कोर: {{score}} / {{total}}",
          q1_q: "एक संदेश में दावा किया गया है कि एक जड़ी-बूटी '48 घंटों में कैंसर को ठीक करती है'। सबसे बड़ा चेतावनी संकेत क्या है?",
          q1_o1: "यह वैज्ञानिक संदर्भों के बिना किसी जटिल बीमारी के त्वरित, पूर्ण इलाज का दावा करता है।",
          q1_o2: "इसे किसी पारिवारिक सदस्य द्वारा भेजा गया था।",
          q1_o3: "इसमें एक प्राकृतिक सामग्री के नाम का उल्लेख है।",
          q2_q: "यदि दवा लेने के बाद आपका रक्तचाप सामान्य हो जाता है, तो आपको क्या करना चाहिए?",
          q2_o1: "दवा लेना बंद कर दें क्योंकि रक्तचाप ठीक हो गया है।",
          q2_o2: "दुष्प्रभावों से बचने के लिए खुराक को आधा कर दें।",
          q2_o3: "डॉक्टर द्वारा निर्धारित दवा लेते रहें, क्योंकि सामान्य रीडिंग दर्शाती है कि दवा इसे नियंत्रित कर रही है।",
          q3_q: "क्या सर्दी या फ्लू के इलाज के लिए एंटीबायोटिक दवाओं की आवश्यकता होती है?",
          q3_o1: "हाँ, एंटीबायोटिक्स सभी वायरस को मारते हैं।",
          q3_o2: "नहीं, सर्दी और फ्लू वायरस के कारण होते हैं, और एंटीबायोटिक्स केवल बैक्टीरिया को लक्षित करते हैं।",
          q3_o3: "हाँ, एंटीबायोटिक्स लेने से वायरल संक्रमण को फैलने से रोका जा सकता है।"
        }
      },
      accessibility: {
        narrate: "आवाज से सुनें",
        stopNarrate: "आवाज बंद करें",
        elderly: "बुजुर्ग मोड (बड़े अक्षर)",
        normalFont: "सामान्य अक्षर"
      },
      speech: {
        langChanged: "भाषा बदलकर {{name}} कर दी गई है",
        intro: "प्रिस्क्रिप्टो आपकी स्वास्थ्य सुरक्षा करता है। दावों की जांच के लिए व्हाट्सएप अफवाह स्कैनर, दवाओं के दुष्प्रभावों के लिए पर्चे डिकोडर या लैब रिपोर्ट विश्लेषक का उपयोग करें।",
        scannerTextSuccess: "स्कैनिंग पूरी हुई। वर्गीकरण {{classification}} है।",
        scannerScreenshotSuccess: "स्क्रीनशॉट सफलतापूर्वक समझा गया। सामग्री का वर्गीकरण {{classification}} है।",
        prescriptionSuccess: "दवा पर्ची का विश्लेषण सफल रहा। कृपया सुरक्षा निर्देशों और दवा दुष्प्रभावों की जांच करें।",
        labSuccess: "लैब रिपोर्ट का विश्लेषण सफलतापूर्वक किया गया। आप नीचे दिए गए मान देख सकते हैं।"
      ,
        elderlyEnabled: "बुजुर्ग मोड सक्रिय किया गया। बड़े अक्षर और आवाज वाचन सक्रिय।",
        elderlyDisabled: "बुजुर्ग मोड अक्षम किया गया। सामान्य अक्षर सक्रिय।"
      }
    }
  },
  te: {
    translation: {
      appName: "ప్రిస్క్రిప్టో",
      tagline: "ఆరోగ్య అవగాహన, శాస్త్రీయ నిజాల రక్షణ",
      nav: {
        dashboard: "డాష్‌బోర్డ్",
        whatsappScanner: "వాట్సాప్ అబద్ధాల స్కానర్",
        prescriptionDecoder: "Rx డీకోడర్",
        labAnalyzer: "ల్యాబ్ విశ్లేషణ",
        learningHub: "నేర్చుకునే హబ్",
        login: "లాగిన్",
        logout: "లాగ్అవుట్"
      },
      dashboard: {
        welcome: "స్వాగతం",
        heroTitle: "వైద్య అబద్ధాలతో పోరాడండి & ల్యాబ్ రిపోర్టులను డీకోడ్ చేయండి",
        heroDesc: "మీ ప్రిస్క్రిప్షన్లను అప్‌లోడ్ చేయండి, రక్తం పరీక్ష ఫలితాలను విశ్లేషించండి మరియు వాట్సాప్ ఫార్వార్డ్‌లను తనిఖీ చేయండి.",
        elderlyBanner: "పెద్దల మోడ్ సక్రియంగా ఉంది: పెద్ద అక్షరాలు మరియు ఆడియో వాయిస్ ఆన్ చేయబడింది.",
        modules: "ప్లాట్‌ఫారమ్ టూల్స్"
      ,
        statsDebunked: "ఫార్వర్డ్స్ నిజ నిర్ధారణ",
        statsIndexed: "మందుల వివరాలు",
        statsSources: "ధృవీకరించబడిన ఆధారాలు"
      },
      scanner: {
        title: "వాట్సాప్ వైద్య అబద్ధాల స్కానర్",
        desc: "స్క్రీన్‌షాట్‌లను అప్‌లోడ్ చేయండి లేదా వాట్సాప్ అబద్ధాలను తనిఖీ చేయడానికి మెసేజ్ పేస్ట్ చేయండి.",
        uploadBtn: "స్క్రీన్‌షాట్ అప్‌లోడ్ చేయి",
        pastePlaceholder: "వాట్సాప్ ఫార్వర్డ్ మెసేజ్ ఇక్కడ పేస్ట్ చేయి...",
        analyzeBtn: "నిజ నిర్ధారణ చేయి",
        scanning: "పరిశీలిస్తున్నాము...",
        results: "నిర్ధారణ ఫలితాలు",
        fearMeter: "భయపెట్టే స్థాయి కొలత",
        confidence: "నిజం యొక్క విశ్వసనీయత",
        correction: "నిజ నిర్ధారణ సమాచారం",
        citations: "ధృవీకరించబడిన ఆధారాలు",
        dangerousAlert: "⚠️ ప్రమాదకరమైన చిట్కా కనుగొనబడింది!",
        shareBtn: "వాట్సాప్ లో షేర్ చేయి",
        extractedText: "పేస్ట్ చేసిన మెసేజ్"
      },
      prescription: {
        title: "ప్రిస్క్రిప్షన్ డీకోడర్",
        desc: "ఔషధాల వివరాలను గ్రహించడానికి మరియు పరస్పర చర్యలను తనిఖీ చేయడానికి ప్రిస్క్రిప్షన్‌ను అప్‌లోడ్ చేయండి.",
        uploadBtn: "ప్రిస్క్రిప్షన్ అప్‌లోड చేయి",
        decodeBtn: "డీకోడ్ చేయి",
        safetyWarn: "⚠️ భద్రతా నిబంధనలు: మేము మందులు ప్రిస్క్రయిబ్ చేయము. వైద్యుడిని సంప్రదించండి.",
        medList: "డీకోడ్ చేయబడిన మందులు",
        generic: "జెనెరిక్ పేరు",
        purpose: "ఉపయోగించే కారణం",
        dosage: "వాడవలసిన విధానం",
        sideEffects: "దుష్ప్రభావాలు (సైడ్ ఎఫెక్ట్స్)",
        interactions: "మందుల పరస్పర చర్యలు",
        class: "చికిత్సా విభాగం"
      },
      lab: {
        title: "ల్యాబ్ రిపోర్ట్ విశ్లేషణ",
        desc: "మీ రక్తం పరీక్ష ఫలితాలను సాధారణ శ్రేణులతో పోల్చడానికి రిపోర్ట్ అప్‌లోడ్ చేయండి.",
        uploadBtn: "ల్యాబ్ రిపోర్ట్ అప్‌లోడ్ చేయి",
        analyzeBtn: "విశ్లేషించు",
        normal: "సాధారణ శ్రేణి",
        markerName: "పరీక్ష పేరు",
        value: "రిపోర్ట్ విలువ",
        status: "స్థితి",
        explanation: "సాధారణ వివరణ"
      },
      learning: {
        title: "ఆరోగ్య అవగాహన కేంద్రం", // wait, let's use the te block title
        desc: "వైద్య రూపాలను చదవడానికి మరియు ఆన్‌లైన్ అబద్ధాలను గుర్తించడానికి గైడ్‌లు చదవండి.",
        quiz: {
          title: "రోజువారీ ఆరోగ్య అవగాహన సవాలు",
          desc: "వైద్య అబద్ధాలను గుర్తించడంలో మీ నైపుణ్యాలను పరీక్షించుకోండి! క్విజ్ పూర్తి చేసి డిజిటల్ బ్యాడ్జ్ పొందండి.",
          startBtn: "క్విజ్ ప్రారంభించండి",
          submitBtn: "సమాధానం సమర్పించండి",
          nextBtn: "తదుపరి ప్రశ్న",
          finishBtn: "క్విజ్ ముగించండి",
          restartBtn: "మళ్ళీ ప్రారంభించండి",
          congrats: "అభినందనలు!",
          congratsDesc: "మీరు 'ధృవీకరించబడిన ఆరోగ్య పరిశోధకుడు' డిజిటల్ బ్యాడ్జ్ పొందారు.",
          score: "మీ స్కోరు: {{score}} / {{total}}",
          q1_q: "ఒక హెర్బ్ '48 గంటల్లో క్యాన్సర్ను నయం చేస్తుంది' అని ఒక మెసేజ్ పేర్కొంది. ఇందులో అనుమానించాల్సిన ప్రధాన విషయం ఏది?",
          q1_o1: "శాస్త్రీయ ఆధారాలు లేకుండా ఒక సంక్లిష్ట వ్యాధికి వేగవంతమైన, సంపూర్ణ నివారణను క్లెయిమ్ చేయడం.",
          q1_o2: "ఇది కుటుంబ సభ్యుడు పంపించారు.",
          q1_o3: "ఇందులో సహజ పదార్ధం పేరును ప్రస్తావించారు.",
          q2_q: "రోజూ మాత్రలు వేసుకున్న తర్వాత మీ రక్తపోటు సాధారణ స్థితికి వస్తే, మీరు ఏమి చేయాలి?",
          q2_o1: "రక్తపోటు నయమైందని మాత్రలు వేసుకోవడం ఆపివేయాలి.",
          q2_o2: "సైడ్ ఎఫెక్ట్స్ రాకుండా ఉండటానికి డోస్ సగానికి తగ్గించాలి.",
          q2_o3: "సూచించిన విధంగా మాత్రలు వేసుకోవడం కొనసాగించాలి, ఎందుకంటే మందులు దీనిని నియంత్రిస్తున్నాయని సాధారణ రీడింగ్స్ నిరూపిస్తాయి.",
          q3_q: "సాధారణ జలుబు లేదా ఫ్లూ చికిత్సకు యాంటీబయాటిక్స్ అవసరమా?",
          q3_o1: "అవును, యాంటీబయాటిక్స్ అన్ని వైరస్లను చంపుతాయి.",
          q3_o2: "కాదు, జలుబు మరియు ఫ్లూ వైరస్ల వల్ల వస్తాయి, యాంటీబయాటిక్స్ బ్యాక్టీరియాను మాత్రమే లక్ష్యంగా చేసుకుంటాయి.",
          q3_o3: "అవును, యాంటీబయాటిక్స్ తీసుకోవడం వల్ల వైరల్ ఇన్ఫెక్షన్లు వ్యాపించకుండా నిరోధించవచ్చు."
        }
      },
      accessibility: {
        narrate: "ఆడియో వినండి",
        stopNarrate: "ఆడియో ఆపండి",
        elderly: "పెద్దల మోడ్ (పెద్ద అక్షరాలు)",
        normalFont: "సాధారణ అక్షరాలు"
      },
      speech: {
        langChanged: "భాష {{name}} కు మార్చబడింది",
        intro: "ప్రిస్క్రిప్టో మీ ఆరోగ్యాన్ని సురక్షితంగా ఉంచుతుంది. వాట్సాప్ స్కానర్ లేదా ప్రిస్క్రిప్షన్ డీకోడర్ ఉపయోగించి నిజాలను తెలుసుకోండి.",
        scannerTextSuccess: "విశ్లేషణ పూర్తయింది. వర్గీకరణ: {{classification}}.",
        scannerScreenshotSuccess: "స్క్రీన్‌షాట్ విజయవంతంగా చదవబడింది. ఫలితం: {{classification}}",
        prescriptionSuccess: "ప్రిస్క్రిప్షన్ విజయవంతంగా డీకోడ్ చేయబడింది. దయచేసి దుష్ప్రభావాల నిబంధనలను సమీక్షించండి.",
        labSuccess: "ల్యాబ్ రిపోర్ట్ విశ్లేషణ పూర్తయింది. ఫలితాలను క్రింద చూడవచ్చు."
      ,
        elderlyEnabled: "పెద్దల మోడ్ సక్రియం చేయబడింది. పెద్ద అక్షరాలు మరియు ఆడియో వాయిస్ ఆన్ చేయబడింది.",
        elderlyDisabled: "పెద్దల మోడ్ నిష్క్రియం చేయబడింది. సాధారణ అక్షరాలు సక్రియం."
      }
    }
  },
  ta: {
    translation: {
      appName: "பிரிஸ்கிரிப்டோ",
      tagline: "சுகாதார விழிப்புணர்வு, அறிவியல் உண்மையின் பாதுகாப்பு",
      nav: {
        dashboard: "முகப்பு",
        whatsappScanner: "வாட்ஸ்அப் வதந்தி ஸ்கேனர்",
        prescriptionDecoder: "Rx குறிவிலக்கி",
        labAnalyzer: "ஆய்வக பகுப்பாய்வி",
        learningHub: "கல்வி மையம்",
        login: "உள்நுழை",
        logout: "வெளியேறு"
      },
      dashboard: {
        welcome: "நல்வரவு",
        heroTitle: "மருத்துவ வதந்திகளை எதிர்த்துப் போராடுங்கள் & அறிக்கைகளை பகுப்பாய்வு செய்யுங்கள்",
        heroDesc: "உங்கள் மருத்துவ சீட்டுகளைப் பதிவேற்றவும், ஆய்வக முடிவுகளைப் பகுப்பாய்வு செய்யவும், வாட்ஸ்அப் வதந்திகளைச் சரிபார்க்கவும்.",
        elderlyBanner: "முதியோர் பயன்முறை செயலில் உள்ளது: பெரிய எழுத்துக்கள் மற்றும் குரல்வழி வசதி இயக்கப்பட்டுள்ளது.",
        modules: "தள கருவிகள்"
      ,
        statsDebunked: "சரிபார்க்கப்பட்ட செய்திகள்",
        statsIndexed: "பட்டியலிடப்பட்ட மருந்துகள்",
        statsSources: "குறிப்பிடப்பட்ட சான்றுகள்"
      },
      scanner: {
        title: "வாட்ஸ்அப் மருத்துவ வதந்தி ஸ்கேனர்",
        desc: "வாட்ஸ்அப் வதந்திகளை சரிபார்க்க செய்தியை ஒட்டவும் அல்லது ஸ்கிரீன்ஷாட்களை பதிவேற்றவும்.",
        uploadBtn: "படம் பதிவேற்றவும்",
        pastePlaceholder: "வாட்ஸ்அப் செய்தியை இங்கே ஒட்டவும்...",
        analyzeBtn: "வதந்தியை ஸ்கேன் செய்",
        scanning: "பரிசோதிக்கப்படுகிறது...",
        results: "பகுப்பாய்வு முடிவுகள்",
        fearMeter: "பயமுறுத்தும் அளவுகோல்",
        confidence: "சான்று நம்பகத்தன்மை",
        correction: "உண்மை அடிப்படையிலான திருத்தம்",
        citations: "சரிபார்க்கப்பட்ட சான்றுகள்",
        dangerousAlert: "⚠️ ஆபத்தான தீர்வு கண்டறியப்பட்டது!",
        shareBtn: "வாட்ஸ்அப்பில் பகிரவும்",
        extractedText: "ஒட்டப்பட்ட செய்தி"
      },
      prescription: {
        title: "மருந்து சீட்டு குறிவிலக்கி",
        desc: "மருந்துகளின் தகவல்களை அறிய மற்றும் பக்கவிளைவுகளைச் சரிபார்க்க உங்கள் மருந்து சீட்டைப் பதிவேற்றவும்.",
        uploadBtn: "மருந்து சீட்டு பதிவேற்று",
        decodeBtn: "குறிவிலக்கு",
        safetyWarn: "⚠️ பாதுகாப்பு எச்சரிக்கை: நாங்கள் மருந்துகளை பரிந்துரைக்கவில்லை. மருத்துவரை அணுகவும்.",
        medList: "குறிவிலக்கப்பட்ட மருந்துகள்",
        generic: "ஜெனரிக் பெயர்",
        purpose: "பயன்படுத்தும் காரணம்",
        dosage: "மருந்து அளவு அறிவுரை",
        sideEffects: "பக்க விளைவுகள்",
        interactions: "மருந்துகளின் பரஸ்பர விளைவுகள்",
        class: "சிகிச்சை வகை"
      },
      lab: {
        title: "ஆய்வக அறிக்கை பகுப்பாய்வி",
        desc: "உடலியல் அளவுகளுடன் உங்கள் இரத்த பரிசோதனை முடிவுகளை ஒப்பிட பதிவேற்றவும்.",
        uploadBtn: "அறிக்கையைப் பதிவேற்றவும்",
        analyzeBtn: "பகுப்பாய்வு செய்",
        normal: "சாதாரண அளவு",
        markerName: "பரிசோதனை பெயர்",
        value: "அளவிடப்பட்ட மதிப்பு",
        status: "நிலை",
        explanation: "எளிமையான விளக்கம்"
      },
      learning: {
        title: "சுகாதார விழிப்புணர்வு மையம்",
        desc: "மருத்துவ ஆவணங்களைப் படிக்கவும் ஆன்லைன் வதந்திகளைக் கண்டறியவும் வழிகாட்டிகளைப் படியுங்கள்.",
        quiz: {
          title: "தினசரி சுகாதார விழிப்புணர்வு சவால்",
          desc: "மருத்துவ வதந்திகளை கண்டறிவதில் உங்கள் திறமையை சோதிக்கவும்! வினாடி வினாவை முடித்து டிஜிட்டல் பேட்ஜ் பெறுங்கள்.",
          startBtn: "வினாடி வினாவைத் தொடங்கு",
          submitBtn: "பதிலைச் சமர்ப்பி",
          nextBtn: "அடுத்த கேள்வி",
          finishBtn: "வினாடி வினாவை முடி",
          restartBtn: "மீண்டும் தொடங்கு",
          congrats: "வாழ்த்துகள்!",
          congratsDesc: "நீங்கள் 'சரிபார்க்கப்பட்ட சுகாதார ஆராய்ச்சியாளர்' டிஜிடல் பேட்ஜை வென்றுள்ளீர்கள்.",
          score: "உங்கள் மதிப்பெண்: {{score}} / {{total}}",
          q1_q: "ஒரு மூலிகை '48 மணி நேரத்தில் புற்றுநோயைக் குணப்படுத்தும்' என்று ஒரு செய்தி கூறுகிறது. எச்சரிக்கை அடையாளம் என்ன?",
          q1_o1: "அறிவியல் சான்றுகள் இல்லாமல் ஒரு சிக்கலான நோய்க்கு விரைவான, முழுமையான குணமளிப்பதாகக் கூறுவது.",
          q1_o2: "இது ஒரு குடும்ப உறுப்பினரால் அனுப்பப்பட்டது.",
          q1_o3: "இது ஒரு இயற்கை மூலப்பொருளின் பெயரைக் குறிப்பிடுகிறது.",
          q2_q: "மருந்து சாப்பிட்ட பிறகு உங்கள் இரத்த அழுத்தம் சாதாரணமாக இருந்தால், நீங்கள் என்ன செய்ய வேண்டும்?",
          q2_o1: "இரத்த அழுத்தம் குணமாகிவிட்டதால் மாத்திரைகள் உட்கொள்வதை நிறுத்த வேண்டும்.",
          q2_o2: "பக்க விளைவுகளைத் தடுக்க அளவை பாதியாகக் குறைக்க வேண்டும்.",
          q2_o3: "பரிந்துரைக்கப்பட்டபடி மாத்திரைகளைத் தொடர்ந்து உட்கொள்ள வேண்டும், ஏனெனில் சாதாரண அளவீடுகள் மாத்திரை அதை கட்டுப்படுத்துகிறது என்பதை நிரூபிக்கிறது.",
          q3_q: "சாதாரண சளி அல்லது காய்ச்சலுக்கு ஆன்டிபயாடிக்குகள் தேவையா?",
          q3_o1: "ஆம், ஆன்டிபயாடிக்குகள் அனைத்து வைரஸ்களையும் கொல்லும்.",
          q3_o2: "இல்லை, சளி மற்றும் காய்ச்சல் வைரஸ்களால் ஏற்படுகின்றன, ஆன்டிபயாடிக்குகள் பாக்டீரியாவை மட்டுமே குறிவைக்கின்றன.",
          q3_o3: "ஆம், ஆன்டிபயாடிக்குகளை உட்கொள்வது வைரஸ் தொற்றுகள் பரவுவதைத் தடுக்கிறது."
        }
      },
      accessibility: {
        narrate: "குரல்வழியாகக் கேள்",
        stopNarrate: "குரலை நிறுத்து",
        elderly: "முதியோர் பயன்முறை",
        normalFont: "சாதாரண எழுத்து"
      },
      speech: {
        langChanged: "மொழி {{name}} ஆக மாற்றப்பட்டது",
        intro: "பிரிஸ்கிரிப்டோ உங்கள் ஆரோக்கியத்தை பாதுகாக்கிறது. வாட்ஸ்அப் ஸ்கேனர் அல்லது குறிவிலக்கியைப் பயன்படுத்தி உண்மைகளை அறியுங்கள்.",
        scannerTextSuccess: "ஸ்கேன் முடிந்தது. வகைப்பாடு: {{classification}}.",
        scannerScreenshotSuccess: "படம் வெற்றிகரமாக படிக்கப்பட்டது. முடிவு: {{classification}}",
        prescriptionSuccess: "மருந்து சீட்டு வெற்றிகரமாக குறிவிலக்கப்பட்டது. பக்கவிளைவுகளை சரிபார்க்கவும்.",
        labSuccess: "ஆய்வக அறிக்கை பகுப்பாய்வு முடிந்தது. முடிவுகளை கீழே காணலாம்."
      ,
        elderlyEnabled: "முதியோர் பயன்முறை இயக்கப்பட்டது. பெரிய எழுத்துக்கள் மற்றும் குரல்வழி வசதி செயலில் உள்ளது.",
        elderlyDisabled: "முதியோர் பயன்முறை முடக்கப்பட்டது. சாதாரண எழுத்துக்கள் செயலில் உள்ளது."
      }
    }
  },
  bn: {
    translation: {
      appName: "প্রেসক্রিপ্টো",
      tagline: "স্বাস্থ্য সচেতনতা বৃদ্ধি, বৈজ্ঞানিক সত্যের সুরক্ষা",
      nav: {
        dashboard: "ড্যাশবোর্ড",
        whatsappScanner: "গুজব স্ক্যানার",
        prescriptionDecoder: "Rx ডিকোডার",
        labAnalyzer: "ল্যাব বিশ্লেষক",
        learningHub: "শিক্ষা কেন্দ্র",
        login: "লগইন",
        logout: "লগআউট"
      },
      dashboard: {
        welcome: "স্বাগতম",
        heroTitle: "চিকিৎসা সংক্রান্ত ভুল তথ্যের বিরুদ্ধে লড়াই এবং রিপোর্ট বিশ্লেষণ",
        heroDesc: "আপনার প্রেসক্রিপশন আপলোড করুন, ল্যাব রিপোর্ট বিশ্লেষণ করুন এবং হোয়াটসঅ্যাপে আসা চিকিৎসা বিষয়ক গুজবের সত্যতা যাচাই করুন।",
        elderlyBanner: "প্রবীণ মোড সক্রিয়: বড় হরফ এবং ভয়েস ন্যারেশন চালু আছে।",
        modules: "অ্যাপ্লিকেশন টুলস"
      ,
        statsDebunked: "গুজব যাচাই করা হয়েছে",
        statsIndexed: "ওষুধের তালিকা",
        statsSources: "উল্লেখিত উৎস"
      },
      scanner: {
        title: "হোয়াটসঅ্যাপ চিকিৎসা গুজব স্ক্যানার",
        desc: "গুজব যাচাই করতে মেসেজ পেস্ট করুন বা স্ক্রিনশট আপলোড করুন।",
        uploadBtn: "স্ক্রিনশট আপলোড করুন",
        pastePlaceholder: "হোয়াটসঅ্যাপ মেসেজ এখানে পেস্ট করুন...",
        analyzeBtn: "গুজব স্ক্যান করুন",
        scanning: "পরীক্ষা করা হচ্ছে...",
        results: "বিশ্লেষণ ফলাফল",
        fearMeter: "ভীতি প্রদর্শন সূচক",
        confidence: "প্রমাণের নির্ভরযোগ্যতা",
        correction: "তথ্যভিত্তিক সংশোধন",
        citations: "যাচাইকৃত সূত্র",
        dangerousAlert: "⚠️ বিপজ্জনক প্রতিকার সনাক্ত করা হয়েছে!",
        shareBtn: "হোয়াটসঅ্যাপে শেয়ার করুন",
        extractedText: "মেসেজের লেখা"
      },
      prescription: {
        title: "প্রেসক্রিপশন ডিকোডার",
        desc: "ওষুধের বিবরণ এবং পার্শ্বপ্রতিক্রিয়া পরীক্ষা করতে প্রেসক্রিপশন আপলোড করুন।",
        uploadBtn: "প্রেসক্রিপশন আপলোড করুন",
        decodeBtn: "ডিকোড করুন",
        safetyWarn: "⚠️ নিরাপত্তা নির্দেশ: আমরা ওষুধ প্রেসক্রাইব করি না। ডাক্তারের পরামর্শ নিন।",
        medList: "ডিকোড করা ওষুধ",
        generic: "জেনেরিক নাম",
        purpose: "ব্যবহারের উদ্দেশ্য",
        dosage: "ডোজ সংক্রান্ত পরামর্শ",
        sideEffects: "পার্শ্বপ্রতিক্রিয়া",
        interactions: "ওষুধের পারস্পরিক ক্রিয়া",
        class: "চিকিৎসা বিভাগ"
      },
      lab: {
        title: "ল্যাব রিপোর্ট বিশ্লেষক",
        desc: "আপনার রক্ত পরীক্ষার রিপোর্ট তুলনা করার জন্য আপলোড করুন।",
        uploadBtn: "রিপোর্ট আপলোড করুন",
        analyzeBtn: "বিশ্লেষণ করুন",
        normal: "স্বাভাবিক সীমা",
        markerName: "পরীক্ষার নাম",
        value: "রিপোর্টের মান",
        status: "অবস্থা",
        explanation: "সহজ ব্যাখ্যা"
      },
      learning: {
        title: "স্বাস্থ্য সচেতনতা কেন্দ্র",
        desc: "মেডিকেল ফর্ম পড়ার এবং ভুল তথ্য চেনার নির্দেশিকাগুলি পড়ুন।",
        quiz: {
          title: "দৈনিক স্বাস্থ্য সচেতনতা চ্যালেঞ্জ",
          desc: "ভুল তথ্য চেনার ক্ষেত্রে আপনার দক্ষতা পরীক্ষা করুন! কুইজটি শেষ করে ডিজিটাল ব্যাজ অর্জন করুন।",
          startBtn: "কুইজ শুরু করুন",
          submitBtn: "উত্তর জমা দিন",
          nextBtn: "পরবর্তী প্রশ্ন",
          finishBtn: "কুইজ শেষ করুন",
          restartBtn: "আবার শুরু করুন",
          congrats: "অভিনন্দন!",
          congratsDesc: "আপনি 'যাচাইকৃত স্বাস্থ্য গবেষক' ডিজিটাল ব্যাজ অর্জন করেছেন।",
          score: "আপনার স্কোর: {{score}} / {{total}}",
          q1_q: "একটি বার্তা দাবি করে যে একটি ভেষজ '৪৮ ঘণ্টায় ক্যান্সার নিরাময় করে'। সতর্কবার্তা চিহ্নটি কী?",
          q1_o1: "এটি বৈজ্ঞানিক প্রমাণ ছাড়াই একটি জটিল রোগের দ্রুত, সম্পূর্ণ নিরাময়ের দাবি করে।",
          q1_o2: "এটি পরিবারের কোনো সদস্য পাঠিয়েছিলেন।",
          q1_o3: "এটি একটি প্রাকৃতিক উপাদানের নাম উল্লেখ করে।",
          q2_q: "প্রতিদিন ওষুধ খাওয়ার পর আপনার রক্তচাপ স্বাভাবিক হলে আপনার কী করা উচিত?",
          q2_o1: "রক্তচাপ ঠিক হয়ে যাওয়ায় ওষুধ খাওয়া বন্ধ করুন।",
          q2_o2: "পার্শ্বপ্রতিক্রিয়া এড়াতে ডোজ অর্ধেক করুন।",
          q2_o3: "নির্দেশিত ওষুধ খাওয়া চালিয়ে যান, কারণ স্বাভাবিক রিডিং প্রমাণ করে যে ওষুধ এটি নিয়ন্ত্রণ করছে।",
          q3_q: "সাধারণ সর্দি বা ফ্লুর চিকিৎসার জন্য কি অ্যান্টিবায়োটিক প্রয়োজন?",
          q3_o1: "হ্যাঁ, অ্যান্টিবায়োটিক সব ভাইরাসকে ধ্বংস করে।",
          q3_o2: "না, সর্দি এবং ফ্লু ভাইরাসজনিত কারণে হয়, আর অ্যান্টিবায়োটিক কেবল ব্যাকটেরিয়া ধ্বংস করে।",
          q3_o3: "হ্যাঁ, অ্যান্টিবায়োটিক খেলে ভাইরাস সংক্রমণ ছড়ানো বন্ধ হয়।"
        }
      },
      accessibility: {
        narrate: "ভয়েস শুনুন",
        stopNarrate: "ভয়েস বন্ধ করুন",
        elderly: "প্রবীণ মোড (বড় অক্ষর)",
        normalFont: "স্বাভাবিক অক্ষর"
      },
      speech: {
        langChanged: "ভাষা পরিবর্তন করে {{name}} করা হয়েছে",
        intro: "প্রেসক্রিপ্টো আপনার স্বাস্থ্য রক্ষা করে। ল্যাব বা প্রেসক্রিপশন রিপোর্ট পরীক্ষা করতে পারেন।",
        scannerTextSuccess: "স্ক্যান সম্পূর্ণ হয়েছে। শ্রেণীবিভাগ: {{classification}}।",
        scannerScreenshotSuccess: "স্ক্রিনশট সফলভাবে পড়া গেছে। ফলাফল: {{classification}}",
        prescriptionSuccess: "প্রেসক্রিপশন সফলভাবে ডিকোড করা হয়েছে। অনুগ্রহ করে বিবরণ মিলিয়ে নিন।",
        labSuccess: "ল্যাব রিপোর্টের বিশ্লেষণ সম্পূর্ণ হয়েছে। ফলাফল নিচে দেখুন।"
      ,
        elderlyEnabled: "প্রবীণ মোড সক্রিয় করা হয়েছে। বড় হরফ এবং ভয়েস ন্যারেশন চালু আছে।",
        elderlyDisabled: "প্রবীণ মোড নিষ্ক্রিয় করা হয়েছে। স্বাভাবিক হরফ চালু আছে।"
      }
    }
  },
  pa: {
    translation: {
      appName: "ਪ੍ਰਿਸਕ੍ਰਿਪਟੋ",
      tagline: "ਸਿਹਤ ਸਾਖਰਤਾ ਨੂੰ ਸਮਰੱਥ ਬਣਾਉਣਾ, ਵਿਗਿਆਨਕ ਸੱਚ ਦੀ ਰੱਖਿਆ ਕਰਨਾ",
      nav: {
        dashboard: "ਡੈਸ਼ਬੋਰਡ",
        whatsappScanner: "ਵਟਸਐਪ ਅਫਵਾਹ ਸਕੈਨਰ",
        prescriptionDecoder: "Rx ਡੀਕੋਡਰ",
        labAnalyzer: "ਲੈਬ ਵਿਸ਼ਲੇਸ਼ਕ",
        learningHub: "ਸਿੱਖਿਆ ਕੇਂਦਰ",
        login: "ਲੌਗਇਨ",
        logout: "ਲੌਗਆਉਟ"
      },
      dashboard: {
        welcome: "ਜੀ ਆਇਆਂ ਨੂੰ",
        heroTitle: "ਮੈਡੀਕਲ ਅਫਵਾਹਾਂ ਨਾਲ ਲੜੋ ਅਤੇ ਰਿਪੋਰਟਾਂ ਨੂੰ ਸੁਰੱਖਿਅਤ ਢੰਗ ਨਾਲ ਸਮਝੋ",
        heroDesc: "ਆਪਣੀ ਦਵਾਈਆਂ ਦੀ ਪਰਚੀ ਅਪਲੋਡ ਕਰੋ, ਲੈਬ ਰਿਪੋਰਟਾਂ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰੋ, ਅਤੇ ਸੁਰੱਖਿਅਤ ਡਾਕਟਰੀ ਮਾਪਦੰਡਾਂ ਦੀ ਵਰਤੋਂ ਕਰਕੇ ਵਟਸਐਪ ਦਾਅਵਿਆਂ ਦੀ ਜਾਂਚ ਕਰੋ।",
        elderlyBanner: "ਬਜ਼ੁਰਗ ਮੋਡ ਸਰਗਰਮ: ਵੱਡੇ ਅੱਖਰ ਅਤੇ ਆਵਾਜ਼ ਵਾਚਨ ਸਮਰੱਥ।",
        modules: "ਮੰਚ ਉਪਕਰਣ"
      ,
        statsDebunked: "ਅਫਵਾਹਾਂ ਦੀ ਜਾਂਚ ਕੀਤੀ ਗਈ",
        statsIndexed: "ਦਵਾਈਆਂ ਦੀ ਸੂਚੀ",
        statsSources: "ਸਰੋਤਾਂ ਦਾ ਹਵਾਲਾ"
      },
      scanner: {
        title: "ਵਟਸਐਪ ਮੈਡੀਕਲ ਅਫਵਾਹ ਸਕੈਨਰ",
        desc: "ਦਾਅਵਿਆਂ ਦੀ ਜਾਂਚ ਕਰਨ ਲਈ ਸੁਨੇਹਾ ਪੇਸਟ ਕਰੋ ਜਾਂ ਸਕ੍ਰੀਨਸ਼ੌਟ ਅਪਲੋਡ ਕਰੋ।",
        uploadBtn: "ਸਕ੍ਰੀਨਸ਼ੌਟ ਅਪਲੋਡ ਕਰੋ",
        pastePlaceholder: "ਵਟਸਐਪ ਸੁਨੇਹਾ ਇੱਥੇ ਪੇਸਟ ਕਰੋ...",
        analyzeBtn: "ਅਫਵਾਹ ਸਕੈਨ ਕਰੋ",
        scanning: "ਜਾਂਚ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ...",
        results: "ਜਾਂਚ ਦੇ ਨਤੀਜੇ",
        fearMeter: "ਡਰ ਫੈਲਾਉਣ ਦਾ ਪੈਮਾਨਾ",
        confidence: "ਸਬੂਤ ਦੀ ਭਰੋਸੇਯੋਗਤਾ",
        correction: "ਤੱਥ ਅਧਾਰਤ ਸੁਧਾਰ",
        citations: "ਸਮਰਥਿਤ ਸਰੋਤ",
        dangerousAlert: "⚠️ ਖ਼ਤਰਨਾਕ ਨੁਸਖ਼ਾ ਲੱਭਿਆ ਗਿਆ!",
        shareBtn: "ਵਟਸਐਪ 'ਤੇ ਸਾਂਝਾ ਕਰੋ",
        extractedText: "ਸੁਨੇਹੇ ਦੀ ਲਿਖਤ"
      },
      prescription: {
        title: "ਪਰਚੀ ਡੀਕੋਡਰ (ਅਨੁਵਾਦ)",
        desc: "ਦਵਾਈਆਂ ਦੇ ਵੇਰਵੇ ਅਤੇ ਮਾੜੇ ਪ੍ਰਭਾਵਾਂ ਦੀ ਜਾਂਚ ਲਈ ਪਰਚੀ ਅਪਲੋਡ ਕਰੋ।",
        uploadBtn: "ਦਵਾਈ ਦੀ ਪਰਚੀ ਅਪਲੋਡ ਕਰੋ",
        decodeBtn: "ਡੀਕੋਡ ਕਰੋ",
        safetyWarn: "⚠️ ਸੁਰੱਖਿਆ ਨਿਰਦੇਸ਼: ਅਸੀਂ ਦਵਾਈਆਂ ਨਹੀਂ ਲਿਖਦੇ। ਡਾਕਟਰ ਦੀ ਸਲਾਹ ਲਓ।",
        medList: "ਡੀਕੋਡ ਕੀਤੀਆਂ ਦਵਾਈਆਂ",
        generic: "ਜੈਨਰਿਕ ਨਾਮ",
        purpose: "ਵਰਤੋਂ ਦਾ ਉਦੇਸ਼",
        dosage: "ਖ਼ੁਰਾਕ ਸਬੰਧੀ ਚੇਤਾਵਨੀ",
        sideEffects: "ਸੰਭਾਵਿਤ ਮਾੜੇ ਪ੍ਰਭਾਵ",
        interactions: "ਦਵਾਈਆਂ ਦਾ ਆਪਸੀ ਪ੍ਰਭਾਵ",
        class: "ਚਿਕਿਤਸਕ ਸ਼੍ਰੇਣੀ"
      },
      lab: {
        title: "ਲੈਬ ਰਿਪੋਰਟ ਵਿਸ਼ਲੇਸ਼ਕ",
        desc: "ਆਪਣੇ ਖੂਨ ਦੇ ਟੈਸਟਾਂ ਦੀ ਤੁਲਨਾ ਆਮ ਮਾਪਦੰਡਾਂ ਨਾਲ ਕਰਨ ਲਈ ਰਿਪੋਰਟ ਅਪਲੋਡ ਕਰੋ।",
        uploadBtn: "ਰਿਪੋਰਟ ਅਪਲੋਡ ਕਰੋ",
        analyzeBtn: "ਵਿਸ਼ਲੇਸ਼ਣ ਕਰੋ",
        normal: "ਆਮ ਸੀਮਾ",
        markerName: "ਟੈਸਟ ਦਾ ਨਾਮ",
        value: "ਰਿਪੋਰਟ ਮੁੱਲ",
        status: "ਸਥਿਤੀ",
        explanation: "ਸਰਲ ਪਰਿਭਾਸ਼ਾ"
      },
      learning: {
        title: "ਸਿਹਤ ਸਾਖਰਤਾ ਕੇਂਦਰ",
        desc: "ਮੈਡੀਕਲ ਫਾਰਮ ਪੜ੍ਹਨਾ ਅਤੇ ਆਨਲਾਈਨ ਅਫਵਾਹਾਂ ਨੂੰ ਪਛਾਣਨਾ ਸਿੱਖੋ।",
        quiz: {
          title: "ਰੋਜ਼ਾਨਾ ਸਿਹਤ ਸਾਖਰਤਾ ਚੁਣੌਤੀ",
          desc: "ਮੈਡੀਕਲ ਅਫਵਾਹਾਂ ਦੀ ਪਛਾਣ ਕਰਨ ਵਿੱਚ ਆਪਣੇ ਹੁਨਰ ਦੀ ਜਾਂਚ ਕਰੋ! ਕੁਇਜ਼ ਪੂਰੀ ਕਰੋ ਅਤੇ ਡਿਜੀਟਲ ਬੈਜ ਪ੍ਰਾਪਤ ਕਰੋ।",
          startBtn: "ਕੁਇਜ਼ ਸ਼ੁਰੂ ਕਰੋ",
          submitBtn: "ਉੱਤਰ ਜਮ੍ਹਾਂ ਕਰੋ",
          nextBtn: "ਅਗਲਾ ਪ੍ਰਸ਼ਨ",
          finishBtn: "ਕੁਇਜ਼ ਸਮਾਪਤ ਕਰੋ",
          restartBtn: "ਕੁਇਜ਼ ਮੁੜ ਸ਼ੁਰੂ ਕਰੋ",
          congrats: "ਵਧਾਈਆਂ!",
          congratsDesc: "ਤੁਸੀਂ 'ਸਤਿਆਪਿਤ ਸਿਹਤ ਖੋਜਕਰਤਾ' ਡਿਜੀਟਲ ਬੈਜ ਪ੍ਰਾਪਤ ਕੀਤਾ ਹੈ।",
          score: "ਤੁਹਾਡਾ ਸਕੋਰ: {{score}} / {{total}}",
          q1_q: "ਇੱਕ ਸੰਦੇਸ਼ ਦਾਅਵਾ ਕਰਦਾ ਹੈ ਕਿ ਇੱਕ ਜੜੀ-ਬੂਟੀ '48 ਘੰਟਿਆਂ ਵਿੱਚ ਕੈਂਸਰ ਠੀਕ ਕਰਦੀ ਹੈ'। ਚੇਤਾਵਨੀ ਦਾ ਸੰਕੇਤ ਕੀ ਹੈ?",
          q1_o1: "ਇਹ ਵਿਗਿਆਨਕ ਹਵਾਲਿਆਂ ਦੇ ਬਿਨਾਂ ਇੱਕ ਗੁੰਝਲਦਾਰ ਬੀਮਾਰੀ ਦੇ ਤੁਰੰਤ, ਪੂਰੇ ਇਲਾਜ ਦਾ ਦਾਅਵਾ ਕਰਦਾ ਹੈ।",
          q1_o2: "ਇਹ ਇੱਕ ਪਰਿਵਾਰਕ ਮੈਂਬਰ ਦੁਆਰਾ ਭੇਜਿਆ ਗਿਆ ਸੀ।",
          q1_o3: "ਇਸ ਵਿੱਚ ਇੱਕ ਕੁਦਰਤੀ ਸਮੱਗਰੀ ਦੇ ਨਾਮ ਦਾ ਜ਼ਿਕਰ ਹੈ।",
          q2_q: "ਜੇਕਰ ਦਵਾਈ ਲੈਣ ਤੋਂ ਬਾਅਦ ਤੁਹਾਡਾ ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ ਆਮ ਹੋ ਜਾਂਦਾ ਹੈ, ਤਾਂ ਤੁਹਾਨੂੰ ਕੀ ਕਰਨਾ ਚਾਹੀਦਾ ਹੈ?",
          q2_o1: "ਦਵਾਈ ਲੈਣੀ ਬੰਦ ਕਰ ਦਿਓ ਕਿਉਂਕਿ ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ ਠੀਕ ਹੋ ਗਿਆ ਹੈ।",
          q2_o2: "ਮਾੜੇ ਪ੍ਰਭਾਵਾਂ ਤੋਂ ਬਚਣ ਲਈ ਖ਼ੁਰਾਕ ਅੱਧੀ ਕਰ ਦਿਓ।",
          q2_o3: "ਡਾਕਟਰ ਦੁਆਰਾ ਦੱਸੀ ਗਈ ਦਵਾਈ ਲੈਂਦੇ ਰਹੋ, ਕਿਉਂਕਿ ਆਮ ਰੀਡਿੰਗ ਦਰਸਾਉਂਦੀ ਹੈ ਕਿ ਦਵਾਈ ਇਸਨੂੰ ਕੰਟਰੋਲ ਕਰ ਰਹੀ ਹੈ।",
          q3_q: "ਕੀ ਜ਼ੁਕਾਮ ਜਾਂ ਫਲੂ ਦੇ ਇਲਾਜ ਲਈ ਐਂਟੀਬਾਇਓਟਿਕਸ ਦੀ ਲੋੜ ਹੁੰਦੀ ਹੈ?",
          q3_o1: "ਹਾਂ, ਐਂਟੀਬਾਇਓਟਿਕਸ ਸਾਰੇ ਵਾਇਰਸਾਂ ਨੂੰ ਮਾਰਦੇ ਹਨ।",
          q3_o2: "ਨਹੀਂ, ਜ਼ੁਕਾਮ ਅਤੇ ਫਲੂ ਵਾਇਰਸ ਕਾਰਨ ਹੁੰਦੇ ਹਨ, ਅਤੇ ਐਂਟੀਬਾਇਓਟਿਕਸ ਸਿਰਫ ਬੈਕਟੀਰੀਆ ਨੂੰ ਨਿਸ਼ਾਨਾ ਬਣਾਉਂਦੇ ਹਨ।",
          q3_o3: "ਹਾਂ, ਐਂਟੀਬਾਇਓਟਿਕਸ ਲੈਣ ਨਾਲ ਵਾਇਰਸ ਦੀ ਲਾਗ ਫੈਲਣ ਤੋਂ ਰੋਕੀ ਜਾ ਸਕਦੀ ਹੈ।"
        }
      },
      accessibility: {
        narrate: "ਆਵਾਜ਼ ਸੁਣੋ",
        stopNarrate: "ਆਵਾਜ਼ ਬੰਦ ਕਰੋ",
        elderly: "ਬਜ਼ੁਰਗ ਮੋਡ (ਵੱਡੇ ਅੱਖਰ)",
        normalFont: "ਆਮ ਅੱਖਰ"
      },
      speech: {
        langChanged: "ਭਾਸ਼ਾ ਬਦਲ ਕੇ {{name}} ਕਰ ਦਿੱਤੀ ਗਈ ਹੈ",
        intro: "ਪ੍ਰਿਸਕ੍ਰਿਪਟੋ ਤੁਹਾਡੀ ਸਿਹਤ ਦੀ ਰੱਖਿਆ ਕਰਦਾ ਹੈ। ਤੁਸੀਂ ਰਿਪੋਰਟਾਂ ਦੀ ਜਾਂਚ ਕਰ ਸਕਦੇ ਹੋ।",
        scannerTextSuccess: "ਸਕੈਨਿੰਗ ਪੂਰੀ ਹੋਈ। ਸ਼੍ਰੇਣੀ: {{classification}}।",
        scannerScreenshotSuccess: "ਸਕ੍ਰੀਨਸ਼ੌਟ ਸਫਲਤਾਪੂਰਵਕ ਪੜ੍ਹਿਆ ਗਿਆ। ਨਤੀਜਾ: {{classification}}",
        prescriptionSuccess: "ਪਰਚੀ ਸਫਲਤਾਪੂਰਵਕ ਡੀਕੋਡ ਕੀਤੀ ਗਈ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਵੇਰਵੇ ਦੇਖੋ।",
        labSuccess: "ਲੈਬ ਰਿਪੋਰਟ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਪੂਰਾ ਹੋਇਆ। ਨਤੀਜੇ ਹੇਠਾਂ ਦਿੱਤੇ ਗਏ ਹਨ।"
      ,
        elderlyEnabled: "ਬਜ਼ੁਰਗ ਮੋਡ ਸਮਰੱਥ ਕੀਤਾ ਗਿਆ। ਵੱਡੇ ਅੱਖਰ ਅਤੇ ਆਵਾਜ਼ ਵਾਚਨ ਸਰਗਰਮ।",
        elderlyDisabled: "ਬਜ਼ੁਰਗ ਮੋਡ ਅਸਮਰੱਥ ਕੀਤਾ ਗਿਆ। ਆਮ ਅੱਖਰ ਸਰਗਰਮ।"
      }
    }
  },
  kn: {
    translation: {
      appName: "ಪ್ರಿಸ್ಕ್ರಿಪ್ಟೋ",
      tagline: "ಆರೋಗ್ಯ ಸಾಕ್ಷರತೆಯ ಸಬಲೀಕರಣ, ವೈಜ್ಞಾನಿಕ ಸತ್ಯದ ರಕ್ಷಣೆ",
      nav: {
        dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
        whatsappScanner: "ವದಂತಿ ಸ್ಕ್ಯಾನರ್",
        prescriptionDecoder: "Rx ಡೀಕೋಡರ್",
        labAnalyzer: "ಲ್ಯಾಬ್ ವಿಶ್ಲೇಷಕ",
        learningHub: "ಕಲಿಕಾ ಕೇಂದ್ರ"
      },
      dashboard: {
        welcome: "ಸ್ವಾಗತ",
        heroTitle: "ವೈದ್ಯಕೀಯ ತಪ್ಪು ಮಾಹಿತಿಯ ವಿರುದ್ಧ ಹೋರಾಡಿ ಮತ್ತು ವರದಿಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಡೀಕೋಡ್ ಮಾಡಿ",
        heroDesc: "ನಿಮ್ಮ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ, ಲ್ಯಾಬ್ ವರದಿಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಿ ಮತ್ತು ವಾಟ್ಸಾಪ್ ವದಂತಿಗಳ ಸತ್ಯಾಸತ್ಯತೆಯನ್ನು ಪರಿಶೀಲಿಸಿ.",
        elderlyBanner: "ಹಿರಿಯ ನಾಗರಿಕರ ಮೋಡ್ ಸಕ್ರಿಯವಾಗಿದೆ: ದೊಡ್ಡ ಅಕ್ಷರಗಳು ಮತ್ತು ಧ್ವನಿ ವಾಚನ ಸಕ್ರಿಯವಾಗಿದೆ.",
        modules: "ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಪರಿಕರಗಳು"
      ,
        statsDebunked: "ಪರಿಶೀಲಿಸಿದ ಸಂದೇಶಗಳು",
        statsIndexed: "ದಾಖಲಿಸಿದ ಔಷಧಗಳು",
        statsSources: "ಉಲ್ಲೇಖಿಸಿದ ಮೂಲಗಳು"
      },
      scanner: {
        title: "ವಾಟ್ಸಾಪ್ ವೈದ್ಯಕೀಯ ವದಂತಿ ಸ್ಕ್ಯಾನರ್",
        desc: "ವದಂತಿಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ಸಂದೇಶವನ್ನು ಪೇಸ್ಟ್ ಮಾಡಿ ಅಥವಾ ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.",
        uploadBtn: "ಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
        pastePlaceholder: "ವಾಟ್ಸಾಪ್ ಸಂದೇಶವನ್ನು ಇಲ್ಲಿ ಪೇಸ್ಟ್ ಮಾಡಿ...",
        analyzeBtn: "ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
        scanning: "ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...",
        results: "ಫಲಿತಾಂಶಗಳು",
        shareBtn: "ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಿ"
      },
      prescription: {
        title: "ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಡೀಕೋಡರ್",
        desc: "ಔಷಧ ವಿವರಗಳನ್ನು ಮತ್ತು ಅಡ್ಡಪರಿಣಾಮಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.",
        uploadBtn: "ವರದಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
        decodeBtn: "ಡೀಕೋಡ್ ಮಾಡಿ"
      },
      learning: {
        title: "ಕಲಿಕಾ ಕೇಂದ್ರ",
        quiz: {
          title: "ದೈನಂದಿನ ಆರೋಗ್ಯ ಸಾಕ್ಷರತಾ ಸವಾಲು",
          desc: "ವೈದ್ಯಕೀಯ ವದಂತಿಗಳನ್ನು ಗುರುತಿಸುವಲ್ಲಿ ನಿಮ್ಮ ಕೌಶಲ್ಯವನ್ನು ಪರೀಕ್ಷಿಸಿ! ರಸಪ್ರಶ್ನೆ ಮುಗಿಸಿ ಡಿಜಿಟಲ್ ಬ್ಯಾಡ್ಜ್ ಗೆಲ್ಲಿರಿ.",
          startBtn: "ರಸಪ್ರಶ್ನೆ ಪ್ರಾರಂಭಿಸಿ",
          submitBtn: "ಉತ್ತರ ಸಲ್ಲಿಸಿ",
          nextBtn: "ಮುಂದಿನ ಪ್ರಶ್ನೆ",
          finishBtn: "ರಸಪ್ರಶ್ನೆ ಮುಗಿಸಿ",
          restartBtn: "ಮತ್ತೆ ಪ್ರಾರಂಭಿಸಿ",
          congrats: "ಅಭಿನಂದನೆಗಳು!",
          congratsDesc: "ನೀವು 'ದೃಢೀಕೃತ ಆರೋಗ್ಯ ಸಂಶೋಧಕ' ಡಿಜಿಟಲ್ ಬ್ಯಾಡ್ಜ್ ಗಳಿಸಿದ್ದೀರಿ.",
          score: "ನಿಮ್ಮ ಸ್ಕೋರ್: {{score}} / {{total}}",
          q1_q: "ಒಂದು ಗಿಡಮೂಲಿಕೆ '48 ಗಂಟೆಗಳಲ್ಲಿ ಕ್ಯಾನ್ಸರ್ ಗುಣಪಡಿಸುತ್ತದೆ' ಎಂದು ಒಂದು ಮೆಸೇಜ್ ಹೇಳುತ್ತದೆ. ಎಚ್ಚರಿಕೆ ಚಿಹ್ನೆ ಯಾವುದು?",
          q1_o1: "ವೈಜ್ಞಾನಿಕ ಪುರಾವೆಗಳಿಲ್ಲದೆ ಸಂಕೀರ್ಣ ಕಾಯಿಲೆಗೆ ತ್ವರಿತ, ಸಂಪೂರ್ಣ ಗುಣಪಡಿಸುವಿಕೆಯನ್ನು ಹೇಳಿಕೊಳ್ಳುವುದು.",
          q1_o2: "ಇದನ್ನು ಕುಟುಂಬದ ಸದಸ್ಯರೊಬ್ಬರು ಕಳುಹಿಸಿದ್ದಾರೆ.",
          q1_o3: "ಇದು ನೈಸರ್ಗಿಕ ವಸ್ತುವೊಂದರ ಹೆಸರನ್ನು ಉಲ್ಲೇಖಿಸುತ್ತದೆ.",
          q2_q: "ಮಾತ್ರೆಗಳನ್ನು ತೆಗೆದುಕೊಂಡ ನಂತರ ನಿಮ್ಮ ರಕ್ತದೊತ್ತಡ ಸಾಮಾನ್ಯ ಸ್ಥಿತಿಗೆ ಬಂದರೆ, ನೀವು ಏನು ಮಾಡಬೇಕು?",
          q2_o1: "ರಕ್ತದೊತ್ತಡ ವಾಸಿಯಾಗಿದೆ ಎಂದು ಮಾತ್ರೆಗಳನ್ನು ನಿಲ್ಲಿಸಬೇಕು.",
          q2_o2: "ಅಡ್ಡಪರಿಣಾಮಗಳನ್ನು ತಡೆಯಲು ಪ್ರಮಾಣವನ್ನು ಅರ್ಧಕ್ಕೆ ಇಳಿಸಬೇಕು.",
          q2_o3: "ಸೂಚಿಸಿದಂತೆ ಮಾತ್ರೆಗಳನ್ನು ಮುಂದುವರಿಸಬೇಕು, ಏಕೆಂದರೆ ಸಾಮಾನ್ಯ ರೀಡಿಂಗ್‌ಗಳು ಔಷಧವು ರಕ್ತದೊತ್ತಡವನ್ನು ನಿಯಂತ್ರಿಸುತ್ತಿದೆ ಎಂದು ಸಾಬೀತುಪಡಿಸುತ್ತದೆ.",
          q3_q: "ಸಾಮಾನ್ಯ ನೆಗಡಿ ಅಥವಾ ಜ್ವರಕ್ಕೆ ಆಂಟಿಬಯೋಟಿಕ್ಸ್ ಅಗತ್ಯವಿದೆಯೇ?",
          q3_o1: "ಹೌದು, ಆಂಟಿಬಯೋಟಿಕ್ಸ್ ಎಲ್ಲಾ ವೈರಸ್ ಕೊಲ್ಲುತ್ತವೆ.",
          q3_o2: "ಇಲ್ಲ, ನೆಗಡಿ ಮತ್ತು ಜ್ವರ ವೈರಸ್‌ಗಳಿಂದ ಬರುತ್ತವೆ, ಆಂಟಿಬಯೋಟಿಕ್ಸ್ ಬ್ಯಾಕ್ಟೀರಿಯಾವನ್ನು ಮಾತ್ರ ಕೊಲ್ಲುತ್ತವೆ.",
          q3_o3: "ಹೌದು, ಆಂಟಿಬಯೋಟಿಕ್ಸ್ ತೆಗೆದುಕೊಳ್ಳುವುದರಿಂದ ವೈರಲ್ ಸೋಂಕು ಹರಡುವುದನ್ನು ತಡೆಯಬಹುದು."
        }
      },
      accessibility: {
        narrate: "ಧ್ವನಿ ಕೇಳಿ",
        stopNarrate: "ಧ್ವನಿ ನಿಲ್ಲಿಸಿ",
        elderly: "ಹಿರಿಯರ ಮೋಡ್ (ದೊಡ್ಡ ಅಕ್ಷರಗಳು)",
        normalFont: "ಸಾಮಾನ್ಯ ಅಕ್ಷರಗಳು"
      },
      speech: {
        langChanged: "ಭಾಷೆಯನ್ನು {{name}} ಗೆ ಬದಲಾಯಿಸಲಾಗಿದೆ",
        intro: "ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ವರದಿಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಡೀಕೋಡ್ ಮಾಡಲು ಇದು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
        scannerTextSuccess: "ಸ್ಕ್ಯಾನಿಂಗ್ ಪೂರ್ಣಗೊಂಡಿದೆ. ವರ್ಗೀಕರಣ: {{classification}}.",
        scannerScreenshotSuccess: "ಚಿತ್ರ ಯಶಸ್ವಿಯಾಗಿ ಓದಲಾಗಿದೆ. ಫಲಿತಾಂಶ: {{classification}}",
        prescriptionSuccess: "ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಯಶಸ್ವಿಯಾಗಿ ಡೀಕೋಡ್ ಮಾಡಲಾಗಿದೆ.",
        labSuccess: "ಲ್ಯಾಬ್ ವರದಿ ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ."
      ,
        elderlyEnabled: "ಹಿರಿಯ ನಾಗರಿಕರ ಮೋಡ್ ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ. ದೊಡ್ಡ ಅಕ್ಷರಗಳು ಮತ್ತು ಧ್ವನಿ ವಾಚನ ಸಕ್ರಿಯವಾಗಿದೆ.",
        elderlyDisabled: "ಹಿರಿಯ ನಾಗರಿಕರ ಮೋಡ್ ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ. ಸಾಮಾನ್ಯ ಅಕ್ಷರಗಳು ಸಕ್ರಿಯವಾಗಿದೆ."
      }
    }
  },
  ml: {
    translation: {
      appName: "പ്രിസ്ക്രിപ്റ്റോ",
      tagline: "ആരോഗ്യ സാക്ഷരത ശാക്തീകരണം, ശാസ്ത്രീയ സത്യത്തിന്റെ സംരക്ഷണം",
      nav: {
        dashboard: "ഡാഷ്‌ബോർഡ്",
        whatsappScanner: "വ്യാജവാർത്ത സ്കാനർ",
        prescriptionDecoder: "Rx ഡീകോഡർ",
        labAnalyzer: "ലാബ് അനലൈസർ",
        learningHub: "പഠന കേന്ദ്ര"
      },
      dashboard: {
        modules: "പ്ലാറ്റ്‌ഫോം ടൂളുകൾ",
        welcome: "സ്വാഗതം",
        heroTitle: "വൈദ്യശാസ്ത്ര വ്യാജവിവരങ്ങൾക്കെതിരെ പോരാടുക, റിപ്പോർട്ടുകൾ വായിക്കുക",
        heroDesc: "നിങ്ങളുടെ പ്രിസ്ക്രിപ്ഷനുകൾ അപ്‌ലോഡ് ചെയ്യുക, ലാബ് റിപ്പോർട്ടുകൾ വിശകലനം ചെയ്യുക, വാട്സാപ്പ് വ്യാജവാർത്തകൾ പരിശോധിക്കുക.",
        elderlyBanner: "മുതിർന്നവർക്കുള്ള മോഡ് സജീവമാണ്: വലിയ അക്ഷരങ്ങളും ശബ്ദവും ലഭ്യമാണ്."
      ,
        statsDebunked: "പരിശോധിച്ച സന്ദേശങ്ങൾ",
        statsIndexed: "രേഖപ്പെടുത്തിയ മരുന്നുകൾ",
        statsSources: "പരാമർശിച്ച ഉറവിടങ്ങൾ"
      },
      scanner: {
        title: "വാട്സാപ്പ് വ്യാജവാർത്ത സ്കാനർ",
        desc: "വാർത്തകൾ പരിശോധിക്കാൻ മെസ്സേജ് പേസ്റ്റ് ചെയ്യുക അല്ലെങ്കിൽ സ്ക്രീൻഷോട്ട് അപ്‌ലോഡ് ചെയ്യുക.",
        uploadBtn: "ചിത്രം അപ്‌ലോഡ് ചെയ്യുക",
        analyzeBtn: "പരിശോധിക്കുക"
      },
      learning: {
        title: "പഠന കേന്ദ്ര",
        quiz: {
          title: "പ്രതിദിന ആരോഗ്യ സാക്ഷരതാ വെല്ലുവിളി",
          desc: "വ്യാജ ആരോഗ്യ വിവരങ്ങൾ തിരിച്ചറിയുന്നതിലുള്ള നിങ്ങളുടെ കഴിവ് പരിശോധിക്കുക! ക്വിസ് കളിച്ച് ഡിജിറ്റൽ ബാഡ്ജ് നേടൂ.",
          startBtn: "ക്വിസ് ആരംഭിക്കുക",
          submitBtn: "ഉത്തരം സമർപ്പിക്കുക",
          nextBtn: "അടുത്ത ചോദ്യം",
          finishBtn: "ക്വിസ് പൂർത്തിയാക്കുക",
          restartBtn: "വീണ്ടും ആരംഭിക്കുക",
          congrats: "അഭിനന്ദനങ്ങൾ!",
          congratsDesc: "നിങ്ങൾ 'അംഗീകൃത ആരോഗ്യ ഗവേഷകൻ' ഡിജിറ്റൽ ബാഡ്ജ് സ്വന്തമാക്കിയിരിക്കുന്നു.",
          score: "നിങ്ങളുടെ സ്കോർ: {{score}} / {{total}}",
          q1_q: "ഒരു സസ്യമൂലിക '48 മണിക്കൂറിനുള്ളിൽ ക്യാൻസർ സുഖപ്പെടുത്തും' എന്ന് ഒരു സന്ദേശം അവകാശപ്പെടുന്നു. ഇതിലെ പ്രധാന സംശയമെന്ത്?",
          q1_o1: "ശാസ്ത്രീയ തെളിവുകളില്ലാതെ ഒരു സങ്കീർണ്ണ രോഗത്തിന് പെട്ടെന്നുള്ള പൂർണ്ണ സൗഖ്യം അവകാശപ്പെടുന്നത്.",
          q1_o2: "ഇതൊരു കുടുംബാംഗമാണ് അയച്ചത്.",
          q1_o3: "ഇതിൽ ഒരു പ്രകൃതിദത്ത ചേരുവയുടെ പേര് പരാമർശിക്കുന്നു.",
          q2_q: "പതിവായി മരുന്ന് കഴിച്ച ശേഷം നിങ്ങളുടെ രക്തസമ്മർദ്ദം സാധാരണ നിലയിലായാൽ നിങ്ങൾ എന്തുചെയ്യണം?",
          q2_o1: "രക്തസമ്മർദ്ദം കുറഞ്ഞതുകൊണ്ട് മരുന്ന് കഴിക്കുന്നത് നിർത്തുക.",
          q2_o2: "പാർശ്വഫലങ്ങൾ ഒഴിവാക്കാൻ മരുന്നിന്റെ അളവ് പകുതിയാക്കുക.",
          q2_o3: "നിർദ്ദേശിച്ച മരുന്ന് കഴിക്കുന്നത് തുടരുക, കാരണം മരുന്ന് ഇത് നിയന്ത്രിക്കുന്നുണ്ടെന്ന് സാധാരണ റീഡിങ്സ് തെളിയിക്കുന്നു.",
          q3_q: "സാധാരണ ജലദോഷത്തിനോ പനിക്കോ ആന്റിബയോട്ടിക്കുകൾ ആവശ്യമാണോ?",
          q3_o1: "അതെ, ആന്റിബയോട്ടിക്കുകൾ എല്ലാ വൈറസുകളെയും നശിപ്പിക്കും.",
          q3_o2: "അല്ല, ജലദോഷവും പനിയും വൈറസ് മൂലമാണ് ഉണ്ടാകുന്നത്, ആന്റിബയോട്ടിക്കുകൾ ബാക്ടീരിയകളെ മാത്രമേ നശിപ്പിക്കൂ.",
          q3_o3: "അതെ, ആന്റിബയോട്ടിക്കുകൾ കഴിക്കുന്നത് വൈറൽ അണുബാധ വ്യാപിക്കുന്നത് തടയും."
        }
      },
      accessibility: {
        narrate: "ശബ്ദം കേൾക്കുക",
        stopNarrate: "ശബ്ദം നിർത്തുക",
        elderly: "മുതിർന്നവർക്കുള്ള മോഡ്",
        normalFont: "സാധാരണ അക്ഷരങ്ങൾ"
      },
      speech: {
        langChanged: "ഭാഷ {{name}} ലേക്ക് മാറ്റിയിരിക്കുന്നു",
        intro: "പ്രിസ്ക്രിപ്റ്റോ നിങ്ങളുടെ ആരോഗ്യം സംരക്ഷിക്കുന്നു. ലാബ് അല്ലെങ്കിൽ പ്രിസ്ക്രിപ്ഷൻ റിപ്പോർട്ട് പരിശോധിക്കാം.",
        scannerTextSuccess: "പരിശോധന പൂർത്തിയായി. ഫലം: {{classification}}.",
        scannerScreenshotSuccess: "ചിത്രം വിജയകരമായി വായിച്ചു. ഫലം: {{classification}}",
        prescriptionSuccess: "ഡീകോഡിംഗ് വിജയകരമായി പൂർത്തിയായി.",
        labSuccess: "വിശകലനം പൂർത്തിയായി."
      ,
        elderlyEnabled: "മുതിർന്നവർക്കുള്ള മോഡ് സജീവമാക്കി. വലിയ അക്ഷരങ്ങളും ശബ്ദവും ലഭ്യമാണ്.",
        elderlyDisabled: "മുതിർന്നവർക്കുള്ള മോഡ് നിഷ്‌ക്രിയമാക്കി. സാധാരണ അക്ഷരങ്ങൾ ലഭ്യമാണ്."
      }
    }
  },
  mr: {
    translation: {
      appName: "प्रिस्क्रिप्टो",
      tagline: "आरोग्य साक्षरता सक्षमीकरण, वैज्ञानिक सत्याचे रक्षण",
      nav: {
        dashboard: "डॅशबोर्ड",
        whatsappScanner: "व्हॉट्सॲप अफवा स्कॅनर",
        prescriptionDecoder: "Rx डिकोडर",
        labAnalyzer: "लॅब विश्लेषक",
        learningHub: "ज्ञान केंद्र"
      },
      dashboard: {
        modules: "प्लॅटफॉर्म साधने",
        welcome: "स्वागत आहे",
        heroTitle: "वैद्यकीय अफवांशी लढा आणि रिपोर्ट्स सुरक्षितपणे समजून घ्या",
        heroDesc: "तुमच्या औषधांची चिठ्ठी अपलोड करा, लॅब रिपोर्टचे विश्लेषण करा आणि व्हॉट्सॲप दाव्यांची पडताळणी करा."
      ,
        statsDebunked: "तपासलेल्या अफवा",
        statsIndexed: "नोंदणीकृत औषधे",
        statsSources: "उद्धृत केलेले स्रोत"
      },
      scanner: {
        title: "व्हॉट्सॲप वैद्यकीय अफवा स्कॅनर",
        desc: "दाव्यांची पडताळणी करण्यासाठी संदेश पेस्ट करा किंवा स्क्रीनशॉट अपलोड करा.",
        uploadBtn: "स्क्रीनशॉट अपलोड करा",
        analyzeBtn: "तपासा"
      },
      learning: {
        title: "ज्ञान केंद्र",
        quiz: {
          title: "दैनिक आरोग्य साक्षरता आव्हान",
          desc: "वैद्यकीय अफवा ओळखण्याच्या तुमच्या कौशल्याची चाचणी घ्या! क्विझ पूर्ण करा आणि डिजिटल बॅज मिळवा.",
          startBtn: "क्विझ सुरू करा",
          submitBtn: "उत्तर सबमिट करा",
          nextBtn: "पुढील प्रश्न",
          finishBtn: "क्विझ पूर्ण करा",
          restartBtn: "पुन्हा सुरू करा",
          congrats: "अभिनंदन!",
          congratsDesc: "तुम्ही 'सत्यापित आरोग्य संशोधक' डिजिटल बॅज जिंकला आहे.",
          score: "तुमचा स्कोअर: {{score}} / {{total}}",
          q1_q: "एका संदेशात दावा केला आहे की एक वनस्पती '48 तासात कर्करोग बरा करते'. यात संशयास्पद गोष्ट कोणती?",
          q1_o1: "कोणत्याही वैज्ञानिक पुराव्याशिवाय जटिल आजारावर त्वरित आणि पूर्ण बरे करण्याचा दावा करणे.",
          q1_o2: "हा संदेश कुटुंबातील सदस्याने पाठवला आहे.",
          q1_o3: "यामध्ये नैसर्गिक घटकाचा उल्लेख आहे.",
          q2_q: "गोळ्या घेतल्यानंतर तुमचा रक्तदाब सामान्य झाल्यास तुम्ही काय करावे?",
          q2_o1: "रक्तदाब बरा झाल्यामुळे गोळ्या घेणे बंद करावे.",
          q2_o2: "दुष्परिणाम टाळण्यासाठी डोस अर्धा करावा.",
          q2_o3: "पिल नियमितपणे सुरू ठेवावी, कारण औषधामुळेच रक्तदाब नियंत्रणात आहे हे यातून स्पष्ट होते.",
          q3_q: "सर्दी किंवा फ्लूच्या उपचारासाठी अँटीबायोटिक्स आवश्यक आहेत का?",
          q3_o1: "होय, अँटीबायोटिक्स सर्व विषाणू मारतात.",
          q3_o2: "नाही, सर्दी आणि फ्लू विषाणूंमुळे होतात, अँटीबायोटिक्स फक्त जिवाणूंवर काम करतात.",
          q3_o3: "होय, अँटीबायोटिक्स घेतल्याने विषाणूजन्य संसर्ग पसरण्यास प्रतिबंध होतो."
        }
      },
      accessibility: {
        narrate: "आवाज ऐका",
        stopNarrate: "आवाज बंद करा",
        elderly: "वयोवृद्ध मोड (मोठे अक्षरे)",
        normalFont: "सामान्य अक्षरे"
      },
      speech: {
        langChanged: "भाषा बदलून {{name}} केली आहे",
        intro: "प्रिस्क्रिप्टो तुमच्या आरोग्याचे रक्षण करते. तुम्ही रिपोर्ट्स तपासून पाहू शकता.",
        scannerTextSuccess: "तपासणी पूर्ण झाली. वर्गीकरण: {{classification}}.",
        scannerScreenshotSuccess: "स्क्रीनशॉट यशस्वीरित्या वाचला. निकाल: {{classification}}",
        prescriptionSuccess: "प्रिस्क्रिप्शन यशस्वीरित्या डिकोड केले गेले.",
        labSuccess: "लॅब रिपोर्ट विश्लेषण पूर्ण झाले."
      ,
        elderlyEnabled: "वयोवृद्ध मोड सक्षम केला. मोठे अक्षरे आणि आवाज सक्रिय.",
        elderlyDisabled: "वयोवृद्ध मोड अक्षम केला. सामान्य अक्षरे सक्रिय."
      }
    }
  },
  gu: {
    translation: {
      appName: "પ્રિસ્ક્રિપ્ટો",
      tagline: "આરોગ્ય સાક્ષરતા સશક્તિકરણ, વૈજ્ઞાનિક સત્યનું રક્ષણ",
      nav: {
        dashboard: "ડેશબોર્ડ",
        whatsappScanner: "વોટ્સએપ અફવા સ્કેનર",
        prescriptionDecoder: "Rx ડીકોડર",
        labAnalyzer: "લેબ વિશ્લેષક",
        learningHub: "જ્ઞાન કેન્દ્ર"
      },
      dashboard: {
        modules: "પ્લેટફોર્મ સાધનો",
        welcome: "સ્વાગત છે",
        heroTitle: "તબીબી અફવાઓ સામે લડો અને રિપોર્ટ્સ સુરક્ષિત રીતે સમજો",
        heroDesc: "તમારી દવાઓની ચિઠ્ઠી અપલોડ કરો, લેબ રિપોર્ટનું વિશ્લેષણ કરો અને વોટ્સએપ દાવાઓની ચકાસણી કરો."
      ,
        statsDebunked: "ચકાસાયેલ અફવાઓ",
        statsIndexed: "નોંધાયેલ દવાઓ",
        statsSources: "સંદર્ભિત સ્ત્રોતો"
      },
      scanner: {
        title: "વોટ્સએપ તબીબી અફવા સ્કેનર",
        desc: "દાવાઓની ચકાસણી કરવા માટે સંદેશ પેસ્ટ કરો અથવા સ્ક્રીનશોટ અપલોડ કરો.",
        uploadBtn: "સ્ક્રીનશોટ અપલોડ કરો",
        analyzeBtn: "તપાસ કરો"
      },
      learning: {
        title: "જ્ઞાન કેન્દ્ર",
        quiz: {
          title: "દૈનિક આરોગ્ય સાક્ષરતા પડકાર",
          desc: "તબીબી અફવાઓ ઓળખવાની તમારી કુશળતા ચકાસો! ક્વિઝ પૂરી કરો અને ડિજિટલ બેજ મેળવો.",
          startBtn: "ક્વિઝ શરૂ કરો",
          submitBtn: "જવાબ સબમિટ કરો",
          nextBtn: "બીજો પ્રશ્ન",
          finishBtn: "ક્વિઝ પૂરી કરો",
          restartBtn: "ફરી શરૂ કરો",
          congrats: "અભિનંદન!",
          congratsDesc: "તમે 'ચકાસાયેલ આરોગ્ય સંશોધક' ડિજિટલ બેજ જીતી લીધો છે.",
          score: "તમારો સ્કોર: {{score}} / {{total}}",
          q1_q: "એક મેસેજ દાવો કરે છે કે એક જડીબુટ્ટી '48 કલાકમાં કેન્સર મટાડે છે'. સૌથી મોટી શંકાસ્પદ બાબત કઈ?",
          q1_o1: "વૈજ્ઞાનಿಕ પુરાવા વિના જટિલ રોગનો ઝડપી અને સંપૂર્ણ ઈલાજ કરવાનો દાવો કરવો.",
          q1_o2: "તે પરિવારના કોઈ સભ્યએ મોકલ્યો હતો.",
          q1_o3: "તેમાં કુદરતી ઘટકનો ઉલ્લેખ છે.",
          q2_q: "દવા લીધા પછી જો તમારું બ્લડ પ્રેશર સામાન્ય થઈ જાય, તો તમારે શું કરવું જોઈએ?",
          q2_o1: "બ્લડ પ્રેશર મટી ગયું હોવાથી દવા લેવાનું બંધ કરી દેવું.",
          q2_o2: "આડઅસર રોકવા માટે દવાનો ડોઝ અડધો કરી દેવો.",
          q2_o3: "ડોક્ટરે લખી આપેલી દવા ચાલુ રાખવી, કારણ કે દવા તેને નિયંત્રણમાં રાખે છે તે રીડિંગ સાબિત કરે છે.",
          q3_q: "શું શરદી અથવા ફ્લૂની સારવાર માટે એન્ટિબાયોટિક્સ જરૂરી છે?",
          q3_o1: "હા, એન્ટિબાયોટિક્સ બધા વાયરસનો નાશ કરે છે.",
          q3_o2: "ના, શરદી અને ફ્લૂ વાયરસને કારણે થાય છે, અને એન્ટિબಾಯોટિક્સ માત્ર બેક્ટેરિયાને જ નાશ કરે છે.",
          q3_o3: "હા, એન્ટિબાયોಟ್સ લેવાથી વાયરસનો ચેપ ફેલાતો અટકાવી શકાય છે."
        }
      },
      accessibility: {
        narrate: "અવાજ સાંભળો",
        stopNarrate: "અવાજ બંધ કરો",
        elderly: "વૃદ્ધ મોડ (મોટા અક્ષરો)",
        normalFont: "સામાન્ય અક્ષરો"
      },
      speech: {
        langChanged: "ભાષા બદલીને {{name}} કરવામાં આવી છે",
        intro: "પ્રિસ્ક્રિપ્ટો તમારા સ્વાસ્થ્યનું રક્ષણ કરે છે. તમે રિપોર્ટ્સ ચકાસી શકો છો.",
        scannerTextSuccess: "તપાસ પૂર્ણ થઈ. વર્ગીકરણ: {{classification}}.",
        scannerScreenshotSuccess: "સ્ક્રીનશોટ સફળતાપૂર્વક વંચાયો. પરિણામ: {{classification}}",
        prescriptionSuccess: "પ્રિસ્ક્રિપ્શન સફળતાપૂર્વક ડીકોડ કરવામાં આવ્યું.",
        labSuccess: "લેબ રિપોર્ટ વિશ્લેષણ પૂર્ણ થયું."
      ,
        elderlyEnabled: "વૃદ્ધ મોડ સક્ષમ કર્યો. મોટા અક્ષરો અને અવાજ સક્રિય.",
        elderlyDisabled: "વૃદ્ધ મોડ અક્ષમ કર્યો. સામાન્ય અક્ષરો સક્રિય."
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    load: 'languageOnly',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['queryString', 'cookie', 'localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
