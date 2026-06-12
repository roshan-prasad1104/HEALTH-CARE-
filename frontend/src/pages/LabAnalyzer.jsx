import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  FileText, AlertTriangle, ShieldCheck, RefreshCw, BarChart3,
  TrendingUp, Info, Volume2, VolumeX, Eye
} from 'lucide-react';

/* ─── LOINC classification (NIH Clinical Tables — free, keyless) ─── */
const LOINC_SEARCH_URL = 'https://clinicaltables.nlm.nih.gov/api/loinc/v3/search';

const BLOOD_LOINC_KEYWORDS = ['blood', 'serum', 'plasma', 'glucose', 'hba1c', 'cholesterol', 'hemoglobin', 'leukocyte', 'wbc', 'creatinine'];
const VISION_LOINC_KEYWORDS = ['acuity', 'vision', 'ophthalmology', 'eye', 'optometry', 'intraocular', 'refraction'];

const classifyLoincMatchName = (name) => {
  const lower = name.toLowerCase();
  const isBlood = BLOOD_LOINC_KEYWORDS.some(k => lower.includes(k));
  const isVision = VISION_LOINC_KEYWORDS.some(k => lower.includes(k));
  if (isBlood && !isVision) return 'laboratory';
  if (isVision && !isBlood) return 'examination';
  return null;
};

const lookupLoincClassification = async (query) => {
  try {
    const url = `${LOINC_SEARCH_URL}?terms=${encodeURIComponent(query)}&df=text,LOINC_NUM`;
    const res = await fetch(url);
    if (!res.ok) return { matches: [], laboratory: false, examination: false };
    const data = await res.json();
    const matches = Array.isArray(data[3])
      ? data[3].map(([text, loincNum]) => ({ name: text, loincNum }))
      : [];
    let laboratory = false;
    let examination = false;
    matches.forEach(item => {
      const type = classifyLoincMatchName(item.name);
      if (type === 'laboratory') laboratory = true;
      if (type === 'examination') examination = true;
    });
    return { matches, laboratory, examination };
  } catch (err) {
    console.error('LOINC lookup failed:', err.message);
    return { matches: [], laboratory: false, examination: false };
  }
};

/* ─── Marker category guards (client-side safety net) ─── */
const isVisionMarkerName = (name = '') => {
  const n = name.toLowerCase();
  return n.includes('acuity') || n.includes('intraocular') || n.includes('iop')
    || n.includes('sph') || n.includes('sphere') || n.includes('cyl')
    || n.includes('cylinder') || n.includes('axis') || n.includes('refraction')
    || n.includes('ophthalm') || n.includes('optometr');
};

const isBloodMarkerName = (name = '') => {
  const n = name.toLowerCase();
  if (isVisionMarkerName(name)) return false;
  return n.includes('hba1c') || n.includes('glucose') || n.includes('cholesterol')
    || n.includes('hemoglobin') || n.includes('wbc') || n.includes('leukocyte')
    || n.includes('creatinine') || n.includes('platelet') || n.includes('bilirubin')
    || n.includes('serum') || n.includes('plasma') || n.includes('blood');
};

const filterMarkersForMode = (markers, mode) => {
  if (!Array.isArray(markers)) return [];
  return markers.filter(m => {
    if (!m || typeof m.name !== 'string') return false;
    return mode === 'vision' ? isVisionMarkerName(m.name) : isBloodMarkerName(m.name) || !isVisionMarkerName(m.name);
  });
};

const sanitizeAnalysisResult = (raw, mode) => {
  if (!raw || typeof raw !== 'object') return null;
  const markers = filterMarkersForMode(raw.markers, mode).map(m => ({
    name: String(m.name || 'Unknown'),
    value: m.value,
    unit: m.unit || '',
    status: m.status || 'Recorded',
    normalRange: m.normalRange || '—',
    explanation: typeof m.explanation === 'string' ? m.explanation : 'Consult a healthcare professional for interpretation.',
    educationalRecommendation: typeof m.educationalRecommendation === 'string'
      ? m.educationalRecommendation
      : 'Consult a doctor or clinical provider.'
  }));
  return {
    markers,
    generalSummary: typeof raw.generalSummary === 'string'
      ? raw.generalSummary
      : (mode === 'vision'
        ? 'Vision metrics have been structured for review.'
        : 'Blood biomarkers have been structured for review.'),
    safetyDisclaimer: typeof raw.safetyDisclaimer === 'string'
      ? raw.safetyDisclaimer
      : 'Educational summary only. Not a clinical diagnosis.'
  };
};

/* ─── Vision layout: group refraction / acuity / IOP ─── */
const layoutVisionMarkers = (markers) => {
  const refraction = {
    od: { sph: null, cyl: null, axis: null },
    os: { sph: null, cyl: null, axis: null }
  };
  const acuity = [];
  const iop = [];

  markers.forEach(m => {
    const n = m.name.toLowerCase();
    if (n.includes('sph') || n.includes('sphere')) {
      if (n.includes('right') || n.includes('od')) refraction.od.sph = m;
      else if (n.includes('left') || n.includes('os')) refraction.os.sph = m;
    } else if (n.includes('cyl') || n.includes('cylinder')) {
      if (n.includes('right') || n.includes('od')) refraction.od.cyl = m;
      else if (n.includes('left') || n.includes('os')) refraction.os.cyl = m;
    } else if (n.includes('axis')) {
      if (n.includes('right') || n.includes('od')) refraction.od.axis = m;
      else if (n.includes('left') || n.includes('os')) refraction.os.axis = m;
    } else if (n.includes('acuity')) {
      acuity.push(m);
    } else if (n.includes('intraocular') || n.includes('iop') || n.includes('pressure')) {
      iop.push(m);
    }
  });

  const hasRefraction = Object.values(refraction.od).some(Boolean) || Object.values(refraction.os).some(Boolean);
  return { refraction, hasRefraction, acuity, iop };
};

/* ─── Mode-specific UI copy ─── */
const MODE_COPY = {
  blood: {
    description: 'Upload blood test results to compare against normal physiological metrics.',
    placeholder: 'e.g. Glucose Fasting: 140 mg/dL, HbA1c: 7.2 %, Total Cholesterol: 210 mg/dL...',
    pasteTitle: 'Paste Report Text',
    analyzeBtn: 'Analyze Markers',
    uploadTitle: 'Upload Lab Panel',
    uploadHint: 'Scans image metrics with Tesseract and compares to database values.',
    resultsHeader: 'Lab Metrics Analysis',
    safetyNote: 'This module compares reported blood or metabolic panel metrics to standard physiological intervals. **It does not diagnose conditions, explain absolute clinical causes, or substitute for physician reviews**.'
  },
  vision: {
    description: 'Upload eye examination or vision prescription results to analyze structural and visual health metrics.',
    placeholder: 'Paste vision report text here (e.g., SPH, CYL, AXIS, Intraocular Pressure, Visual Acuity)...',
    pasteTitle: 'Paste Vision Report Text',
    analyzeBtn: 'ANALYZE VISION METRICS',
    uploadTitle: 'Upload Vision Report',
    uploadHint: 'Scans eye sight report with Tesseract and compares to database values.',
    resultsHeader: 'Vision & Eye Metrics Analysis',
    safetyNote: 'This module compares reported visual acuity and intraocular pressure metrics to standard ophthalmological intervals. **It does not diagnose ophthalmic conditions, explain clinical causes, or substitute for comprehensive eye examinations**.'
  }
};

const getLocalizedLabel = (key, lang) => {
  const labels = {
    summaryOverview: {
      en: 'Summary Overview:', hi: 'सारांश अवलोकन:', te: 'సారాంశం:', ta: 'சுருக்கம்:',
      bn: 'সারসংক্ষেপ:', kn: 'ಸಾರಾಂಶ:', ml: 'സംഗ്രഹം:', mr: 'सारांश:',
      gu: 'સારાંશ:', pa: 'ਸਾਰਾਂਸ਼:'
    },
    lifestyleInsights: {
      en: 'Lifestyle Insights', hi: 'जीवनशैली अंतर्दृष्टि', te: 'జీవనశైలి చిట్కాలు',
      ta: 'வாழ்க்கை முறை ஆலோசனைகள்', bn: 'জীবনধারা পরামর্শ', kn: 'ಜೀವನಶೈಲಿ ಸಲಹೆಗಳು',
      ml: 'ജീവിതശൈലി നിർദ്ദേശങ്ങൾ', mr: 'जीवनशैली सल्ला', gu: 'જીવનશૈલી સલાહ', pa: 'ਜੀਵਨ ਸ਼ੈਲੀ ਸਲਾਹ'
    },
    low: {
      en: 'Low', hi: 'कम', te: 'తక్కువ', ta: 'குறைந்த', bn: 'কম',
      kn: 'ಕಡಿಮೆ', ml: 'കുറഞ്ഞ', mr: 'कमी', gu: 'ઓછું', pa: 'ਘੱਟ'
    },
    high: {
      en: 'High', hi: 'उच्च', te: 'ఎక్కువ', ta: 'அதிக', bn: 'উচ্চ',
      kn: 'ಹೆಚ್ಚು', ml: 'കൂടിയ', mr: 'उच्च', gu: 'વધારે', pa: 'ਉੱਚ'
    },
    normalRange: {
      en: 'Normal Range', hi: 'सामान्य सीमा', te: 'సాధారణ పరిధి', ta: 'சாதாரண வரம்பு',
      bn: 'স্বাভাবিক পরিসীমা', kn: 'ಸಾಮಾನ್ಯ ಶ್ರೇಣಿ', ml: 'സാധാരണ പരിധി',
      mr: 'सामान्य श्रेणी', gu: 'સામાન્ય શ્રેણી', pa: 'ਸਧਾਰਣ ਸੀਮਾ'
    },
    yourValue: {
      en: 'Your Value', hi: 'आपका मूल्य', te: 'మీ విలువ', ta: 'உங்கள் மதிப்பு',
      bn: 'আপনার মান', kn: 'ನಿಮ್ಮ ಮೌಲ್ಯ', ml: 'നിങ്ങളുടെ മൂല്യം',
      mr: 'तुमचे मूल्य', gu: 'તમારી કિંમત', pa: 'ਤੁਹਾਡਾ ਮੁੱਲ'
    },
    min: { en: 'MIN', hi: 'न्यूनतम', te: 'కనిష్టం', ta: 'குறைந்தது', bn: 'সর্বনিম্ন', kn: 'ಕನಿಷ್ಠ', ml: 'കുറഞ്ഞത്', mr: 'किमान', gu: 'ન્યૂનતમ', pa: 'ਘੱਟੋ-ਘੱਟ' },
    max: { en: 'MAX', hi: 'अधिकतम', te: 'గరిష్టం', ta: 'அதிகபட்சம்', bn: 'সর্বোচ্চ', kn: 'ಗರಿಷ್ಠ', ml: 'കൂടിയത്', mr: 'कमाल', gu: 'મહત્તમ', pa: 'ਵੱਧੋ-ਵੱਧ' },
    disclaimerSuffix: {
      en: 'Reference parameters correspond to standard clinical WHO databases. Report anomalies must be discussed with a certified practitioner.',
      hi: 'संदर्भ पैरामीटर मानक नैदानिक डब्ल्यूएचओ डेटाबेस के अनुरूप हैं।',
      te: 'సూచన పారామితులు ప్రామాణిక క్లినికల్ WHO డేటాబేస్లకు అనుగుణంగా ఉంటాయి.',
      ta: 'குறிப்பு அளவுருக்கள் நிலையான மருத்துவ WHO தரவுத்தளங்களுடன் ஒத்துப்போகின்றன.',
      bn: 'রেফারেন্স প্যারামিটারগুলি স্ট্যান্ডার্ড ক্লিনিকাল ডাটাবেসের সাথে মিলে যায়।',
      kn: 'ಉಲ್ಲೇಖಿತ ನಿಯತಾಂಕಗಳು ಪ್ರಮಾಣಿತ ಕ್ಲಿನಿಕಲ್ WHO ಡೇಟಾಬೇಸ್‌ಗಳಿಗೆ ಅನುಗುಣವಾಗಿರುತ್ತವೆ.',
      ml: 'റഫറൻസ് പാരാമീറ്ററുകൾ സ്റ്റാൻഡേർഡ് ക്ലിനിക്കൽ ഡാറ്റാബേസുകളുമായി പൊരുത്തപ്പെടുന്നു.',
      mr: 'संदर्भ मापदंड मानक क्लिनिकल WHO डेटाबेसशी सुसंगत आहेत.',
      gu: 'સંદર્ભ પરિમાણો પ્રમાણભૂત ક્લિનિકલ ડેટાબેઝ સાથે સુસંગત છે.',
      pa: 'ਹਵਾਲਾ ਮਾਪਦੰਡ ਮਿਆਰੀ ਕਲੀਨਿਕਲ WHO ਡੇਟਾਬੇਸ ਦੇ ਅਨੁਸਾਰ ਹਨ।'
    }
  };
  return labels[key]?.[lang] || labels[key]?.en || key;
};

const parseRangeString = (normalRangeStr) => {
  if (!normalRangeStr) return { min: 0, max: 100 };
  const cleaned = normalRangeStr.replace(/[^\d.\-]/g, '');
  const parts = cleaned.split('-');
  if (parts.length === 2) {
    const min = parseFloat(parts[0]);
    const max = parseFloat(parts[1]);
    if (!isNaN(min) && !isNaN(max)) return { min, max };
  }
  const matches = normalRangeStr.match(/(\d+(\.\d+)?)/g);
  if (matches && matches.length >= 2) {
    return { min: parseFloat(matches[0]), max: parseFloat(matches[1]) };
  }
  return { min: 0, max: 100 };
};

const supportsRangeVisualizer = (markerName = '') => {
  const n = markerName.toLowerCase();
  return n.includes('acuity') || n.includes('intraocular') || n.includes('iop')
    || n.includes('hba1c') || n.includes('glucose') || n.includes('cholesterol')
    || n.includes('hemoglobin') || n.includes('wbc');
};

export default function LabAnalyzer() {
  const { t, i18n } = useTranslation();
  const { largeFont, darkMode, isPlayingSpeech, elderlyMode } = useSelector(state => state.settings);
  const { speakText, stopSpeaking } = useAccessibility();

  const lastReadResultRef = useRef(null);

  const [analysisMode, setAnalysisMode] = useState('blood');
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [originalResult, setOriginalResult] = useState(null);
  const [error, setError] = useState(null);
  const [warningMessage, setWarningMessage] = useState(null);

  const modeCopy = MODE_COPY[analysisMode];

  const handleModeChange = (newMode, preserveInput = false) => {
    if (newMode === analysisMode) return;
    stopSpeaking();
    lastReadResultRef.current = null;
    setAnalysisMode(newMode);
    setResult(null);
    setOriginalResult(null);
    setError(null);
    setWarningMessage(null);
    if (!preserveInput) {
      setTextInput('');
    }
  };

  /* LOINC auto-classification while typing */
  useEffect(() => {
    if (!textInput || textInput.trim().length < 3) {
      setWarningMessage(null);
      return;
    }

    const timer = setTimeout(async () => {
      const cleaned = textInput.replace(/[^a-zA-Z\s]/g, ' ').trim();
      const keywords = cleaned.split(/\s+/).filter(w => w.length > 2).slice(0, 4).join(' ');
      if (!keywords) return;

      const { laboratory, examination } = await lookupLoincClassification(keywords);

      if (laboratory && !examination && analysisMode === 'vision') {
        setWarningMessage({
          type: 'switch-to-blood',
          message: 'We noticed you are entering blood biomarkers. Would you like to switch to Blood mode?'
        });
      } else if (examination && !laboratory && analysisMode === 'blood') {
        setWarningMessage({
          type: 'switch-to-vision',
          message: 'We noticed you are entering vision biomarkers. Would you like to switch to Eye Sight / Vision mode?'
        });
      } else {
        setWarningMessage(null);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [textInput, analysisMode]);

  const handleReadAloud = (forcePlay = false) => {
    const isAutoTrigger = forcePlay === true;
    if (isPlayingSpeech && !isAutoTrigger) {
      stopSpeaking();
      return;
    }
    if (!result) return;

    const header = MODE_COPY[analysisMode].resultsHeader;
    const speakParts = [header];
    if (result.generalSummary) {
      speakParts.push(`${getLocalizedLabel('summaryOverview', i18n.language)} ${result.generalSummary}`);
    }
    result.markers?.forEach((marker) => {
      speakParts.push(`${marker.name}. ${t('lab.normal')}: ${marker.normalRange}. ${marker.value} ${marker.unit || ''}. ${marker.status}.`);
      speakParts.push(`${t('lab.explanation')}: ${marker.explanation}.`);
      speakParts.push(`${getLocalizedLabel('lifestyleInsights', i18n.language)}: ${marker.educationalRecommendation}.`);
    });
    if (result.safetyDisclaimer) speakParts.push(result.safetyDisclaimer);
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

  const handleAnalyze = async (e) => {
    e?.preventDefault?.();
    setLoading(true);
    setError(null);
    setResult(null);
    setOriginalResult(null);

    const formData = new FormData();
    if (textInput.trim()) {
      formData.append('text', textInput);
    } else {
      setLoading(false);
      return;
    }
    formData.append('category', analysisMode);

    try {
      const response = await fetch('/api/health/lab/analyze', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analysis failed');

      const sanitized = sanitizeAnalysisResult(data.analysis, analysisMode);
      setOriginalResult(sanitized);
      setResult(sanitized);
      speakText(t('speech.labSuccess'), i18n.language);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!originalResult) return;
    if (i18n.language === 'en' || i18n.language?.startsWith('en')) {
      setResult(sanitizeAnalysisResult(originalResult, analysisMode));
      return;
    }

    const translateResult = async () => {
      setLoading(true);
      try {
        const langMap = {
          en: 'English', hi: 'Hindi', te: 'Telugu', ta: 'Tamil', bn: 'Bengali',
          kn: 'Kannada', ml: 'Malayalam', mr: 'Marathi', gu: 'Gujarati', pa: 'Punjabi'
        };
        const cleanLang = i18n.language ? i18n.language.split('-')[0].split('_')[0].toLowerCase() : 'en';
        const targetLanguage = langMap[cleanLang] || 'English';

        const response = await fetch('/api/health/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: JSON.stringify(originalResult), targetLanguage })
        });
        const data = await response.json();
        if (response.ok && data.translatedText) {
          const parsed = JSON.parse(data.translatedText);
          setResult(sanitizeAnalysisResult(parsed, analysisMode));
        }
      } catch (err) {
        console.error('Failed to translate results:', err);
      } finally {
        setLoading(false);
      }
    };

    translateResult();
  }, [i18n.language, originalResult, analysisMode]);

  const getStatusColor = (status) => {
    if (!status) return 'bg-slate-800 text-slate-200 border-slate-700';
    const s = status.toLowerCase();
    if (s.includes('elevated') || s.includes('high') || s.includes('low') || s.includes('critical')) {
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
    return 'bg-green-500/10 text-green-400 border-green-500/20';
  };

  const renderRangeVisualizer = (marker, idx) => {
    const { min, max } = parseRangeString(marker.normalRange);
    const val = parseFloat(marker.value);
    if (isNaN(val)) return null;

    const span = max - min || 1;
    const startValue = Math.max(0, min - span * 0.8);
    const endValue = max + span * 0.8;
    const totalRange = endValue - startValue;
    let percentage = totalRange > 0 ? ((val - startValue) / totalRange) * 100 : 50;
    percentage = Math.max(0, Math.min(100, percentage));

    const normalStartPct = totalRange > 0 ? ((min - startValue) / totalRange) * 100 : 30;
    const normalEndPct = totalRange > 0 ? ((max - startValue) / totalRange) * 100 : 70;
    const isLow = val < min;
    const isHigh = val > max;

    let pointerColor = 'bg-emerald-500';
    let textThemeColor = '#10b981';
    if (isLow) { pointerColor = 'bg-sky-500'; textThemeColor = '#0ea5e9'; }
    else if (isHigh) { pointerColor = 'bg-rose-500'; textThemeColor = '#f43f5e'; }

    return (
      <div className="my-4 px-1" key={`viz-${idx}`}>
        <div className="flex justify-between text-[10px] font-bold mb-1.5" style={{ color: 'var(--text-faint)' }}>
          <span>{getLocalizedLabel('low', i18n.language)} ({startValue.toFixed(1)})</span>
          <span style={{ color: 'var(--text-secondary)' }}>{getLocalizedLabel('normalRange', i18n.language)} ({min.toFixed(1)} - {max.toFixed(1)})</span>
          <span>{getLocalizedLabel('high', i18n.language)} ({endValue.toFixed(1)})</span>
        </div>
        <div
          className="h-3 w-full rounded-full relative overflow-hidden shadow-inner border"
          style={{ backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.9)', borderColor: 'var(--border-default)' }}
        >
          <div className="absolute top-0 left-0 bottom-0 border-r border-dashed" style={{ width: `${normalStartPct}%`, backgroundColor: 'rgba(14, 165, 233, 0.1)', borderColor: 'rgba(14, 165, 233, 0.2)' }} />
          <div className="absolute top-0 bottom-0 border-r border-dashed" style={{ left: `${normalStartPct}%`, width: `${normalEndPct - normalStartPct}%`, backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.2)' }} />
          <div className="absolute top-0 right-0 bottom-0" style={{ left: `${normalEndPct}%`, backgroundColor: 'rgba(244, 63, 94, 0.1)' }} />
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white ${pointerColor} shadow-lg z-10`}
            style={{ left: `calc(${percentage}% - 8px)` }}
            title={`${getLocalizedLabel('yourValue', i18n.language)}: ${val} ${marker.unit || ''}`}
          />
        </div>
        <div className="relative h-4 mt-1 text-[10px] font-bold">
          <div className="absolute transition-all duration-700 text-center whitespace-nowrap" style={{ left: `${percentage}%`, transform: 'translateX(-50%)', color: textThemeColor }}>
            {getLocalizedLabel('yourValue', i18n.language)} ({val} {marker.unit || ''})
          </div>
        </div>
      </div>
    );
  };

  const renderMarkerCard = (marker, idx) => (
    <div key={`${marker.name}-${idx}`} className="inner-card flex flex-col gap-3">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div>
          <h4 className="font-extrabold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>{marker.name}</h4>
          <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
            {t('lab.normal')}: <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{marker.normalRange}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black px-2.5 py-1 rounded-lg border" style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
            {marker.value} {marker.unit}
          </span>
          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${getStatusColor(originalResult?.markers?.[idx]?.status || marker.status)}`}>
            {marker.status}
          </span>
        </div>
      </div>

      {supportsRangeVisualizer(marker.name) && renderRangeVisualizer(marker, idx)}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1 text-[11px]">
        <div className="p-2.5 rounded-lg border sub-card">
          <span className="text-[9px] font-bold uppercase block mb-0.5 flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
            <Info className="w-3 h-3" /> {t('lab.explanation')}
          </span>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{marker.explanation}</p>
        </div>
        <div className="p-2.5 rounded-lg border sub-card">
          <span className="text-[9px] font-bold uppercase block mb-0.5" style={{ color: 'var(--text-faint)' }}>{getLocalizedLabel('lifestyleInsights', i18n.language)}</span>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{marker.educationalRecommendation}</p>
        </div>
      </div>
    </div>
  );

  const renderVisionResults = (markers) => {
    const { refraction, hasRefraction, acuity, iop } = layoutVisionMarkers(markers);

    return (
      <>
        {hasRefraction && (
          <div className="inner-card mb-4">
            <h4 className="font-extrabold text-sm mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <Eye className="w-4 h-4 text-sky-400" /> Refraction Values (SPH / CYL / AXIS)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ color: 'var(--text-secondary)' }}>
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-default)' }}>
                    <th className="text-left py-2 pr-3 font-bold" style={{ color: 'var(--text-faint)' }}>Eye</th>
                    <th className="text-left py-2 px-2 font-bold" style={{ color: 'var(--text-faint)' }}>SPH (Sphere)</th>
                    <th className="text-left py-2 px-2 font-bold" style={{ color: 'var(--text-faint)' }}>CYL (Cylinder)</th>
                    <th className="text-left py-2 pl-2 font-bold" style={{ color: 'var(--text-faint)' }}>AXIS</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Right Eye (OD)', row: refraction.od },
                    { label: 'Left Eye (OS)', row: refraction.os }
                  ].map(({ label, row }) => (
                    <tr key={label} className="border-b" style={{ borderColor: 'var(--border-default)' }}>
                      <td className="py-2.5 pr-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</td>
                      <td className="py-2.5 px-2">{row.sph ? `${row.sph.value} ${row.sph.unit}` : '—'}</td>
                      <td className="py-2.5 px-2">{row.cyl ? `${row.cyl.value} ${row.cyl.unit}` : '—'}</td>
                      <td className="py-2.5 pl-2">{row.axis ? `${row.axis.value}${row.axis.unit}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {acuity.length > 0 && (
          <div className="space-y-3 mb-2">
            <h4 className="font-extrabold text-xs uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Visual Acuity</h4>
            {acuity.map((m, i) => renderMarkerCard(m, i))}
          </div>
        )}

        {iop.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Intraocular Pressure (IOP)</h4>
            {iop.map((m, i) => renderMarkerCard(m, acuity.length + i))}
          </div>
        )}
      </>
    );
  };

  const visionLayout = result ? layoutVisionMarkers(result.markers || []) : null;
  const hasVisionContent = visionLayout && (visionLayout.hasRefraction || visionLayout.acuity.length > 0 || visionLayout.iop.length > 0);

  return (
    <div className={`max-w-4xl mx-auto px-4 py-8 ${largeFont ? 'text-lg' : 'text-sm'}`}>

      <div className="mb-8 text-center">
        <h2 className="text-3xl font-black font-display mb-2" style={{ color: darkMode ? '#ffffff' : '#0c1a2e' }}>
          {t('lab.title')}
        </h2>
        <p className="max-w-xl mx-auto leading-relaxed text-xs" style={{ color: darkMode ? '#94a3b8' : '#4a6280' }}>
          {modeCopy.description}
        </p>
      </div>

      {/* Mode toggle pills */}
      <div className="flex justify-center mb-6">
        <div
          className="flex p-1 rounded-xl border max-w-sm w-full"
          style={{
            background: darkMode ? 'rgba(3,7,18,0.6)' : 'rgba(241,245,249,0.8)',
            borderColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'
          }}
        >
          <button
            type="button"
            onClick={() => handleModeChange('blood')}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5"
            style={analysisMode === 'blood' ? {
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              boxShadow: '0 2px 8px rgba(16,185,129,0.35)'
            } : { color: darkMode ? '#94a3b8' : '#475569', background: 'transparent' }}
          >
            <span>🩸</span> Blood Biomarkers
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('vision')}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5"
            style={analysisMode === 'vision' ? {
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              color: 'white',
              boxShadow: '0 2px 8px rgba(14,165,233,0.35)'
            } : { color: darkMode ? '#94a3b8' : '#475569', background: 'transparent' }}
          >
            <span>👁️</span> Eye Sight / Vision
          </button>
        </div>
      </div>

      {/* Safety notice */}
      <div
        className="mb-8 p-4 rounded-xl flex items-start gap-3"
        style={darkMode ? {
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.35)',
          color: '#fef3c7'
        } : {
          background: 'rgba(217,119,6,0.1)',
          border: '1px solid rgba(217,119,6,0.3)',
          color: '#b45309'
        }}
      >
        <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider mb-0.5" style={{ color: darkMode ? '#fbbf24' : '#b45309' }}>
            Strict Safety Layer Active
          </h4>
          <p className="text-xs leading-relaxed" style={{ color: darkMode ? '#cbd5e1' : '#78350f' }}>
            {modeCopy.safetyNote}
          </p>
        </div>
      </div>

      {/* LOINC mismatch banner */}
      {warningMessage && (
        <div
          className="mb-6 p-4 rounded-xl flex items-center justify-between gap-4 border"
          style={darkMode ? {
            background: 'rgba(217,119,6,0.1)',
            borderColor: 'rgba(217,119,6,0.3)',
            color: '#fef3c7'
          } : {
            background: 'rgba(245,158,11,0.1)',
            borderColor: 'rgba(245,158,11,0.25)',
            color: '#b45309'
          }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
            <p className="text-xs font-semibold leading-relaxed">{warningMessage.message}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const target = warningMessage.type === 'switch-to-blood' ? 'blood' : 'vision';
              handleModeChange(target, true);
            }}
            className="px-3.5 py-1.5 rounded-lg text-xs font-black tracking-wide border whitespace-nowrap shadow transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              borderColor: 'rgba(245,158,11,0.4)',
              color: 'white',
              boxShadow: '0 2px 6px rgba(217,119,6,0.25)'
            }}
          >
            {warningMessage.type === 'switch-to-blood' ? 'Switch to Blood mode' : 'Switch to Vision mode'}
          </button>
        </div>
      )}

      {/* Inputs */}
      <div className="max-w-xl mx-auto mb-8">
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              {analysisMode === 'vision' ? <Eye className="w-4 h-4 text-sky-400" /> : <TrendingUp className="w-4 h-4 text-emerald-400" />}
              {modeCopy.pasteTitle}
            </h3>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={modeCopy.placeholder}
              rows={5}
              className="w-full glass-input rounded-xl p-4 text-xs font-sans placeholder-slate-500 mb-4 resize-none"
            />
          </div>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading || !textInput.trim()}
            className="premium-btn w-full"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
            {loading ? 'Analyzing...' : modeCopy.analyzeBtn}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-950/40 border border-red-800/80 rounded-xl text-red-200 flex items-center gap-2 text-xs">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="glass-panel p-6 md:p-8 rounded-2xl shadow-2xl relative overflow-hidden" style={{ borderColor: 'var(--border-strong)' }}>
            <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${analysisMode === 'vision' ? 'from-sky-500 via-blue-500 to-indigo-500' : 'from-health-500 via-emerald-500 to-teal-500'}`} />

            <div className="flex items-center justify-between pb-4 mb-6" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-health-400" />
                <h3 className="font-black text-xl font-display" style={{ color: 'var(--text-primary)' }}>{modeCopy.resultsHeader}</h3>
              </div>
              <button
                type="button"
                onClick={handleReadAloud}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border"
                style={{
                  background: 'var(--bg-hover)',
                  borderColor: isPlayingSpeech ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-default)',
                  color: isPlayingSpeech ? '#ef4444' : 'var(--text-secondary)'
                }}
              >
                {isPlayingSpeech ? (
                  <><VolumeX className="w-4 h-4 text-red-500 animate-pulse" /> Stop Reading</>
                ) : (
                  <><Volume2 className="w-4 h-4 text-health-400" /> Read Aloud</>
                )}
              </button>
            </div>

            <div className="p-4 rounded-xl border mb-6 text-xs leading-relaxed sub-card">
              <span className="font-bold block mb-1" style={{ color: 'var(--text-primary)' }}>{getLocalizedLabel('summaryOverview', i18n.language)}</span>
              {result.generalSummary}
            </div>

            <div className="space-y-4">
              {analysisMode === 'vision' && hasVisionContent
                ? renderVisionResults(result.markers)
                : result.markers?.map((marker, idx) => renderMarkerCard(marker, idx))}
            </div>

            <div className="mt-8 pt-6 text-[10px] leading-relaxed border-t" style={{ borderTopColor: 'var(--border-default)', color: 'var(--text-faint)' }}>
              * {result.safetyDisclaimer} {getLocalizedLabel('disclaimerSuffix', i18n.language)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
