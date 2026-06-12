import React, { useState, useEffect } from 'react';

const getLocalizedLabel = (key, lang) => {
  const labels = {
    scanAssessment: {
      en: "Scan Assessment",
      hi: "स्कैन परिणाम",
      te: "నిర్ధారణ ఫలితాలు",
      ta: "பகுப்பாய்வு முடிவுகள்",
      bn: "বিশ্লেষণ ফলাফল",
      kn: "ವಿಶ್ಲೇಷಣೆ ಫಲಿತಾಂಶಗಳು",
      ml: "വിശകലന ഫലങ്ങൾ",
      mr: "स्कॅन मूल्यांकन",
      gu: "સ્કેન મૂલ્યાંકન",
      pa: "ਸਕੈਨ ਮੁਲਾਂਕਣ"
    },
    analysisResults: {
      en: "Analysis Results",
      hi: "जाँच विवरण",
      te: "పరిశీలన వివరాలు",
      ta: "பரிசோதனை முடிவுகள்",
      bn: "তদন্তের বিবরণ",
      kn: "ವಿಶ್ಲೇಷಣೆ ವಿವರಗಳು",
      ml: "വിശകലന വിവരങ്ങൾ",
      mr: "विश्लेषण निकाल",
      gu: "વિશ્લેષણ પરિણામો",
      pa: "ਵਿਸ਼ਲੇਸ਼ਣ ਦੇ ਨਤੀਜੇ"
    },
    originalClaimMapped: {
      en: "Original Claim Mapped",
      hi: "मूल दावा",
      te: "పేస్ట్ చేసిన మెసేజ్",
      ta: "ஒட்டப்பட்ட செய்தி",
      bn: "মূল দাবি",
      kn: "ಮೂಲ ಸಂದೇಶ",
      ml: "യഥാർത്ഥ സന്ദേശം",
      mr: "मूळ दावा",
      gu: "મૂળ દાવો",
      pa: "ਮੂਲ ਦਾਅਵਾ"
    },
    shareFactCheck: {
      en: "Share Corrected Fact-Check",
      hi: "तथ्य-जाँच साझा करें",
      te: "నిజ నిర్ధారణ సమాచారం పంచుకోండి",
      ta: "உண்மை திருத்தத்தை பகிரவும்",
      bn: "তথ্য-যাচাই শেয়ার করুন",
      kn: "ಮಾಹಿತಿ ಹಂಚಿಕೊಳ್ಳಿ",
      ml: "വിവരങ്ങൾ പങ്കിടുക",
      mr: "तथ्य-तपासणी सामायिक करा",
      gu: "તથ્ય-તપાસ શેર કરો",
      pa: "ਤੱਥ-ਜਾਂਚ ਸਾਂਝੀ ਕਰੋ"
    },
    shareDesc: {
      en: "Send this structured debunk to the WhatsApp group or chat where you saw this rumor to safely correct family and friends!",
      hi: "अपने दोस्तों और परिवार को सुरक्षित रूप से जागरूक करने के लिए इस तथ्य-जाँच को उस व्हाट्सएप ग्रुप या चैट में भेजें जहां आपने यह अफवाह देखी थी!",
      te: "మీ స్నేహితులు మరియు కుటుంబ సభ్యులకు అవగాహన కల్పించడానికి ఈ సమాచారాన్ని మీరు చూసిన వాట్సాప్ గ్రూప్ లో పంచుకోండి!",
      ta: "உங்கள் நண்பர்கள் மற்றும் குடும்பத்தினரை విழிப்புடன் வைத்திருக்க இந்த தகவலை வாட்ஸ்அப்பில் பகிரவும்!",
      bn: "আপনার পরিবার ও বন্ধুদের সচেতন করতে এই তথ্যটি সংশ্লিষ্ট হোয়াটস্যাপ গ্রুপে শেয়ার করুন!",
      kn: "ನಿಮ್ಮ ಕುಟುಂಬ ಮತ್ತು ಸ್ನೇಹಿತರಿಗೆ ಜಾಗೃತಿ ಮೂಡಿಸಲು ಈ ಮಾಹಿತಿಯನ್ನು ಹಂಚಿಕೊಳ್ಳಿ!",
      ml: "നിങ്ങളുടെ കുടുംബത്തിനും സുഹൃത്തുക്കൾക്കും അറിവ് നൽകാൻ ഈ വിവരം പങ്കിടുക!",
      mr: "मित्र आणि कुटुंबाला जागरूक करण्यासाठी ही तथ्य-तपासणी व्हॉट्सॲप ग्रुपवर पाठवा!",
      gu: "તમારા મિત્રો અને પરિવારને જાગૃત કરવા માટે આ તથ્ય-તપાસ વોટ્સએપ ગ્રુપમાં મોકલો!",
      pa: "ਆਪਣੇ ਦੋਸਤਾਂ ਅਤੇ ਪਰਿਵਾਰ ਨੂੰ ਜਾਗਰੂਕ ਕਰਨ ਲਈ ਇਹ ਤੱਥ-ਜਾਂਚ ਵਟਸਐਪ ਗਰੁੱਪ ਵਿੱਚ ਭੇਜੋ!"
    },
    fearScoreExplanation: {
      en: "Fear Score measures how panic-inducing or hyper-sensationalized the text is.",
      hi: "डर स्कोर मापता है कि पाठ कितना घबराहट पैदा करने वाला या सनसनीखेज है।",
      te: "భయపెట్టే స్कोరు ఈ మెసేజ్ ఎంత భయాందోళన కలిగిస్తుందో తెలియజేస్తుంది.",
      ta: "பயமுறுத்தும் அளவுகோல் இந்த செய்தி எவ்வளவு பயத்தை உண்டாக்குகிறது என காட்டுகிறது.",
      bn: "ভীতি প্রদর্শন সূচক মেপে দেখায় এই লেখাটি কতটা ভীতি বা উত্তেজনা সৃষ্টি করে।",
      kn: "ಭಯದ ಸ್ಕೋರ್ ಈ ಸಂದೇಶ ಎಷ್ಟು ಆತಂಕ ಉಂಟುಮಾಡುತ್ತದೆ ಎಂದು ಅಳೆಯುತ್ತದೆ.",
      ml: "ഭയ സ്കോർ ഈ സന്ദേശം എത്രമാത്രം ആകുലത ഉണ്ടാക്കുന്നു എന്ന് കണക്കാക്കുന്നു.",
      mr: "भीती स्कोअर मजकूर किती घाबरवणारा किंवा खळबळजनक आहे हे मोजतो.",
      gu: "ડર સ્કોર માપે છે કે લખાણ કેટલું ગભરાટ પેદા કરનારું છે.",
      pa: "ਡਰ ਸਕੋਰ ਇਹ ਮਾਪਦਾ ਹੈ ਕਿ ਸੁਨੇਹਾ ਕਿੰਨਾ ਘਬਰਾਹਟ ਪੈਦਾ ਕਰਨ ਵਾਲਾ ਹੈ।"
    },
    confidenceExplanation: {
      en: "Confidence rating based on medical database corroboration.",
      hi: "चिकित्सा डेटाबेस पुष्टि के आधार पर आत्मविश्वास रेटिंग।",
      te: "వైద్య ఆధారాల నిర్ధారణ ఆధారంగా సేకరించిన నమ్మకమైన విలువ.",
      ta: "மருத்துவ சான்றுகளின் நம்பகத்தன்மை மதிப்பீடு.",
      bn: "মেডিকেল ডাটাবেস প্রমাণের উপর ভিত্তি করে নির্ভরযোগ্যতা নির্ধারণ।",
      kn: "ವೈದ್ಯಕೀಯ ಆಧಾರಗಳ ವಿಶ್ವಾಸಾರ್ಹತೆಯ ರೇಟಿಂಗ್.",
      ml: "വൈദ്യശാസ്ത്ര വിവരങ്ങളുടെ വിശ്വാസ്യത റേറ്റിംഗ്.",
      mr: "वैद्यकीय डेटाबेसच्या आधारे ठरवलेली विश्वासार्हता रेटिंग.",
      gu: "તબીબી ડેટાબેઝના આધારે નક્કી કરેલી વિશ્વસનીયતા રેટિંગ.",
      pa: "ਮੈਡੀਕਲ ਡੇਟਾਬੇਸ ਦੀ ਪੁਸ਼ਟੀ ਦੇ ਆਧਾਰ ਤੇ ਭਰੋਸੇਯੋਗਤਾ ਰੇਟਿੰਗ।"
    },
    dangerousRemedyDesc: {
      en: "This forward advocates an unverified/toxic remedy or suggests skipping official vaccines/clinical procedures. Relying on this is highly hazardous.",
      hi: "यह फॉरवर्ड एक असत्यापित/विषाक्त उपाय की वकालत करता है या आधिकारिक टीकों/नैदानिक प्रक्रियाओं को छोड़ने का सुझाव देता है। इस पर निर्भर रहना अत्यधिक खतरनाक है।",
      te: "ఈ సమాచారం నిర్ధారించబడని చిట్కాను సూచిస్తుంది లేదా టీకాలు/వైద్య చికిత్సలను వద్దని చెబుతుంది. దీనిని నమ్మడం చాలా ప్రమాదకరం.",
      ta: "இந்த செய்தி சரிபார்க்கப்படாத தீர்வை பரிந்துரைக்கிறது அல்லது மருத்துவ சிகிச்சைகளை தவிர்க்க சொல்கிறது. இதை நம்புவது மிகவும் ஆபத்தானது.",
      bn: "এই বার্তাটি একটি বিপজ্জনক প্রতিকার প্রচার করে বা চিকিৎসা এড়ানোর পরামর্শ দেয়। এটি বিশ্বাস করা অত্যন্ত ঝুঁকিপূর্ণ।",
      kn: "ಈ ಮಾಹಿತಿ ದೃಢೀಕರಿಸದ ಪರಿಹಾರವನ್ನು ಸೂಚಿಸುತ್ತದೆ ಅಥವಾ ಚಿಕಿತ್ಸೆ ಬೇಡ ಎನ್ನುತ್ತದೆ. ಇದನ್ನು ನಂಬುವುದು ಬಹಳ ಅಪಾಯಕಾರಿ.",
      ml: "ഈ സന്ദേശം സ്ഥിരീകരിക്കാത്ത പ്രതിവിധി നിർദ്ദേശിക്കുന്നു. ഇത് വിശ്വസിക്കുന്നത് അത്യന്തം അപകടകരമാണ്.",
      mr: "हा फॉरवर्ड असत्यापित उपायाचे समर्थन करतो किंवा वैद्यकीय उपचार टाळण्याचा सल्ला देतो. यावर विश्वास ठेवणे अत्यंत धोकादायक आहे.",
      gu: "આ ફોરવર્ડ અપ્રમાણિત ઉપાયનું સમર્થน કરે છે અથવા તબીબી સારવાર ટાળવાની સલાહ આપે છે. આના પર વિશ્વાસ કરવો અત્યંત જોખમી છે.",
      pa: "ਇਹ ਫਾਰਵਰਡ ਗੈਰ-ਪ੍ਰਮਾਣਿਤ ਉਪਾਅ ਦਾ ਸਮਰਥਨ ਕਰਦਾ ਹੈ ਜਾਂ ਡਾਕਟਰੀ ਇਲਾਜ ਛੱਡਣ ਦੀ ਸਲਾਹ ਦਿੰਦਾ ਹੈ। ਇਸ ਤੇ ਭਰੋਸਾ ਕਰਨਾ ਬਹੁਤ ਖ਼ਤਰਨਾਕ ਹੈ।"
    }
  };
  return labels[key]?.[lang] || labels[key]?.['en'] || key;
};
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useAccessibility } from '../context/AccessibilityContext';
import { Clipboard, Send, RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert, ExternalLink, Share2, Volume2, VolumeX } from 'lucide-react';

export default function WhatsAppScanner() {
  const { t, i18n } = useTranslation();
  const { largeFont, darkMode } = useSelector(state => state.settings);

  const [textInput, setTextInput] = useState(() => sessionStorage.getItem('wp_textInput') || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(() => {
    const saved = sessionStorage.getItem('wp_result');
    return saved ? JSON.parse(saved) : null;
  });
  const [originalResult, setOriginalResult] = useState(() => {
    const saved = sessionStorage.getItem('wp_originalResult');
    return saved ? JSON.parse(saved) : null;
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    sessionStorage.setItem('wp_textInput', textInput);
  }, [textInput]);

  useEffect(() => {
    if (result) {
      sessionStorage.setItem('wp_result', JSON.stringify(result));
    } else {
      sessionStorage.removeItem('wp_result');
    }
  }, [result]);

  useEffect(() => {
    if (originalResult) {
      sessionStorage.setItem('wp_originalResult', JSON.stringify(originalResult));
    } else {
      sessionStorage.removeItem('wp_originalResult');
    }
  }, [originalResult]);

  const { isPlayingSpeech, elderlyMode } = useSelector(state => state.settings);
  const { speakText, stopSpeaking } = useAccessibility();
  const lastReadResultRef = React.useRef(null);

  const handleReadAloud = (forcePlay = false) => {
    const isAutoTrigger = forcePlay === true;
    if (isPlayingSpeech && !isAutoTrigger) {
      stopSpeaking();
      return;
    }

    if (!result) return;
    const speakParts = [
      getLocalizedLabel('analysisResults', i18n.language),
      `${result.classification}.`,
      `${t('scanner.fearMeter')}: ${result.fearScore} percent.`,
      `${t('scanner.confidence')}: ${result.confidenceScore} percent.`,
      `${getLocalizedLabel('originalClaimMapped', i18n.language)}: ${result.originalClaim}.`,
      `${t('scanner.correction')}: ${result.correctionText}.`
    ];
    speakText(speakParts.join(' '), i18n.language, !isAutoTrigger);
  };

  useEffect(() => {
    if (elderlyMode && result && !loading && lastReadResultRef.current !== result) {
      lastReadResultRef.current = result;
      handleReadAloud(true);
    } else if (!elderlyMode) {
      lastReadResultRef.current = null;
    }
  }, [result, loading, elderlyMode]);

  const handleTextScan = async () => {
    if (!textInput.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/misinformation/scan-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textInput })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Scan failed');

      setOriginalResult(data.analysis);
      setResult(data.analysis);
      speakText(t('speech.scannerTextSuccess', { classification: data.analysis.classification }), i18n.language);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!originalResult) return;

    if (i18n.language === 'en') {
      setResult(originalResult);
      return;
    }

    const translateResult = async () => {
      setLoading(true);
      try {
        const langMap = {
          en: 'English',
          hi: 'Hindi',
          te: 'Telugu',
          ta: 'Tamil',
          bn: 'Bengali',
          kn: 'Kannada',
          ml: 'Malayalam',
          mr: 'Marathi',
          gu: 'Gujarati',
          pa: 'Punjabi'
        };
        const cleanLang = i18n.language ? i18n.language.split('-')[0].split('_')[0].toLowerCase() : 'en';
        const targetLanguage = langMap[cleanLang] || 'English';
        
        const response = await fetch('/api/health/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: JSON.stringify(originalResult),
            targetLanguage
          })
        });
        const data = await response.json();
        if (response.ok && data.translatedText) {
          setResult(JSON.parse(data.translatedText));
        }
      } catch (err) {
        console.error('Failed to translate results:', err);
      } finally {
        setLoading(false);
      }
    };

    translateResult();
  }, [i18n.language, originalResult]);

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied fact-check template to clipboard! You can now paste this back into your WhatsApp chat.');
  };

  const handleShareWhatsApp = (text) => {
    const encodedText = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
  };

  const getClassificationColor = (cls) => {
    if (!cls) return 'bg-slate-800 text-slate-200 border-slate-700';
    const c = cls.toLowerCase();
    if (c.includes('false') || c.includes('dangerous')) return 'bg-red-500/15 text-red-400 border-red-500/30';
    if (c.includes('misleading') || c.includes('scare')) return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    return 'bg-green-500/15 text-green-400 border-green-500/30';
  };

  return (
    <div className={`max-w-4xl mx-auto px-4 py-8 ${largeFont ? 'text-lg' : 'text-sm'}`}>
      
      {/* Title */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-black font-display mb-2" style={{ color: 'var(--text-primary)' }}>
          {t('scanner.title')}
        </h2>
        <p className="max-w-xl mx-auto leading-relaxed text-xs" style={{ color: 'var(--text-muted)' }}>
          {t('scanner.desc')}
        </p>
      </div>

      {/* Input card */}
      <div className="max-w-xl mx-auto mb-8">
        {/* Paste Text Card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Send className="w-4 h-4 text-brand-400" /> Write or Paste Text
            </h3>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={t('scanner.pastePlaceholder')}
              rows={6}
              className="w-full glass-input rounded-xl p-4 text-xs font-sans placeholder-slate-500 mb-4 resize-none"
            />
          </div>
          <button
            onClick={handleTextScan}
            disabled={loading || !textInput.trim()}
            className="premium-btn w-full"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
            {loading ? t('scanner.scanning') : t('scanner.analyzeBtn')}
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-8 p-4 bg-red-950/40 border border-red-800/80 rounded-xl text-red-200 flex items-center gap-2 text-xs">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <p>{error}</p>
        </div>
      )}

      {/* Result presentation */}
      {result && (
        <div className="glass-panel p-6 md:p-8 rounded-2xl shadow-2xl relative overflow-hidden" style={{ borderColor: 'var(--border-strong)' }}>
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"></div>

          {/* Heading */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6" style={{ borderBottom: '1px solid var(--border-default)' }}>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--text-faint)' }}>{getLocalizedLabel('scanAssessment', i18n.language)}</span>
              <h3 className="font-black text-xl font-display mt-0.5" style={{ color: 'var(--text-primary)' }}>{getLocalizedLabel('analysisResults', i18n.language)}</h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReadAloud}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border"
                style={{
                  background: 'var(--bg-hover)',
                  borderColor: isPlayingSpeech ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-default)',
                  color: isPlayingSpeech ? '#ef4444' : 'var(--text-secondary)'
                }}
              >
                {isPlayingSpeech ? (
                  <>
                    <VolumeX className="w-4 h-4 text-red-500 animate-pulse" />
                    Stop Reading
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-brand-400" />
                    Read Aloud
                  </>
                )}
              </button>
              <div className={`px-4 py-1.5 rounded-full border text-xs font-black uppercase ${getClassificationColor(originalResult?.classification || result.classification)}`}>
                {result.classification}
              </div>
            </div>
          </div>

          {/* Core Stats / Meters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Fear Meter */}
            <div className="sub-card">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('scanner.fearMeter')}</span>
                <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{result.fearScore}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden relative" style={{ background: 'var(--bg-hover)' }}>
                <div 
                  className="h-full fear-gradient rounded-full transition-all"
                  style={{ width: `${result.fearScore}%` }}
                ></div>
              </div>
              <p className="text-[10px] mt-2" style={{ color: 'var(--text-faint)' }}>
                {getLocalizedLabel('fearScoreExplanation', i18n.language)}
              </p>
            </div>

            {/* Confidence Score */}
            <div className="sub-card">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('scanner.confidence')}</span>
                <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{result.confidenceScore}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                <div 
                  className="h-full bg-brand-500 rounded-full transition-all"
                  style={{ width: `${result.confidenceScore}%` }}
                ></div>
              </div>
              <p className="text-[10px] mt-2" style={{ color: 'var(--text-faint)' }}>
                {getLocalizedLabel('confidenceExplanation', i18n.language)}
              </p>
            </div>
          </div>

          {/* Dangerous Remedy Alert */}
          {result.isDangerous && (
            <div className="mb-6 p-4 rounded-xl flex items-start gap-3 border bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider mb-0.5" style={{ color: '#ef4444' }}>
                  {t('scanner.dangerousAlert')}
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {getLocalizedLabel('dangerousRemedyDesc', i18n.language)}
                </p>
              </div>
            </div>
          )}

          {/* Extracted original claim */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{getLocalizedLabel('originalClaimMapped', i18n.language)}</h4>
            <p className="text-xs italic p-3 rounded-lg sub-card" style={{ color: 'var(--text-secondary)' }}>
              "{result.originalClaim}"
            </p>
          </div>

          {/* Factcheck text */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{t('scanner.correction')}</h4>
            <div 
              className="text-xs leading-relaxed border p-4 rounded-xl"
              style={{
                background: 'var(--bg-hover)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-secondary)',
              }}
            >
              {result.correctionText}
            </div>
          </div>

          {/* Citations */}
          {result.citations && result.citations.length > 0 && (
            <div className="mb-8">
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{t('scanner.citations')}</h4>
              <div className="space-y-2">
                {result.citations.map((cit, idx) => (
                  <div key={idx} className="flex justify-between items-center border px-4 py-2.5 rounded-lg sub-card">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      {cit.source || cit.sourceName}
                    </span>
                    <a 
                      href={cit.url || cit.sourceUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[11px] font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                    >
                      Verify Link <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Copyable templates / Share Card */}
          <div className="inner-card p-5">
            <h4 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Share2 className="w-4 h-4 text-brand-400" /> {getLocalizedLabel('shareFactCheck', i18n.language)}
            </h4>
            <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
              {getLocalizedLabel('shareDesc', i18n.language)}
            </p>
            <div 
              className="rounded-xl p-4 font-mono text-[11px] border mb-4 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto"
              style={{
                background: 'var(--bg-input)',
                borderColor: 'var(--border-default)',
                color: '#059669',
              }}
            >
              {result.whatsappCorrectionTemplate}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => handleCopyToClipboard(result.whatsappCorrectionTemplate)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-xs tracking-wider transition-all flex items-center justify-center gap-2 border"
                style={{
                  background: 'var(--bg-hover)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-secondary)',
                }}
              >
                <Clipboard className="w-3.5 h-3.5" /> Copy Text
              </button>
              <button
                onClick={() => handleShareWhatsApp(result.whatsappCorrectionTemplate)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs tracking-wider transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> {t('scanner.shareBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
