import React, { useState, useEffect } from 'react';

const getLocalizedLabel = (key, lang) => {
  const labels = {
    metricsAnalysis: {
      en: "Lab Metrics Analysis",
      hi: "लैब रिपोर्ट विश्लेषण",
      te: "ల్యాబ్ పరీక్షల విశ్లేషణ",
      ta: "ஆய்வக அறிக்கை பகுப்பாய்வு",
      bn: "ল্যাব রিপোর্ট विश्लेषण",
      kn: "ಲ್ಯಾಬ್ ವರದಿ ವಿಶ್ಲೇಷಣೆ",
      ml: "ലാബ് റിപ്പോർട്ട് വിശകലനം",
      mr: "लॅब अहवाल विश्लेषण",
      gu: "લેબ રીપોર્ટ વિશ્લેષણ",
      pa: "ਲੈਬ ਰਿਪੋਰਟ ਵਿਸ਼ਲੇਸ਼ਣ"
    },
    summaryOverview: {
      en: "Summary Overview:",
      hi: "सारांश अवलोकन:",
      te: "సారాंशం:",
      ta: "சுருக்கம்:",
      bn: "সারসংক্ষেপ:",
      kn: "ಸಾರಾಂಶ:",
      ml: "സംഗ്രഹം:",
      mr: "सारांश:",
      gu: "સારાંશ:",
      pa: "ਸਾਰਾਂਸ਼:"
    },
    lifestyleInsights: {
      en: "Lifestyle Insights",
      hi: "जीवनशैली अंतर्दृष्टि",
      te: "జీవనశైలి చిట్కాలు",
      ta: "வாழ்க்கை முறை ஆலோசனைகள்",
      bn: "জীবনধারা পরামর্শ",
      kn: "ಜೀವನಶೈಲಿ ಸಲಹೆಗಳು",
      ml: "ജീവിതശൈലി നിർദ്ദേശങ്ങൾ",
      mr: "जीवनशैली सल्ला",
      gu: "જીવનશૈલી સલાહ",
      pa: "ਜੀਵਨ ਸ਼ੈਲੀ ਸਲਾਹ"
    }
  };
  return labels[key]?.[lang] || labels[key]?.['en'] || key;
};
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useAccessibility } from '../context/AccessibilityContext';
import { FileText, AlertTriangle, ShieldCheck, RefreshCw, BarChart3, TrendingUp, Info, Volume2, VolumeX } from 'lucide-react';

export default function LabAnalyzer() {
  const { t, i18n } = useTranslation();
  const { largeFont, darkMode } = useSelector(state => state.settings);

  const [textInput, setTextInput] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [originalResult, setOriginalResult] = useState(null);
  const [error, setError] = useState(null);

  const { isPlayingSpeech, elderlyMode } = useSelector(state => state.settings);
  const { speakText, stopSpeaking } = useAccessibility();
  const lastReadResultRef = React.useRef(null);

  const handleReadAloud = (forcePlay = false) => {
    if (isPlayingSpeech && !forcePlay) {
      stopSpeaking();
      return;
    }

    if (!result) return;
    const speakParts = [getLocalizedLabel('metricsAnalysis', i18n.language)];
    if (result.generalSummary) {
      speakParts.push(`${getLocalizedLabel('summaryOverview', i18n.language)} ${result.generalSummary}`);
    }
    if (result.markers) {
      result.markers.forEach((marker) => {
        speakParts.push(`${marker.name}. ${t('lab.normal')}: ${marker.normalRange}. ${marker.value} ${marker.unit || ''}. ${marker.status}.`);
        speakParts.push(`${t('lab.explanation')}: ${marker.explanation}.`);
        speakParts.push(`${getLocalizedLabel('lifestyleInsights', i18n.language)}: ${marker.educationalRecommendation}.`);
      });
    }
    if (result.safetyDisclaimer) {
      speakParts.push(result.safetyDisclaimer);
    }
    speakText(speakParts.join(' '), i18n.language);
  };

  useEffect(() => {
    if (elderlyMode && result && !loading && lastReadResultRef.current !== result) {
      lastReadResultRef.current = result;
      handleReadAloud(true);
    } else if (!elderlyMode) {
      lastReadResultRef.current = null;
    }
  }, [result, loading, elderlyMode]);

  const handleAnalyze = async (e, directFile = null) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setOriginalResult(null);

    const formData = new FormData();
    if (directFile) {
      formData.append('file', directFile);
    } else if (textInput.trim()) {
      formData.append('text', textInput);
    } else {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/health/lab/analyze', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analysis failed');

      setOriginalResult(data.analysis);
      setResult(data.analysis);
      speakText(t('speech.labSuccess'), i18n.language);
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
        const targetLanguage = langMap[i18n.language] || 'English';
        
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      handleAnalyze(null, selectedFile);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-slate-800 text-slate-200 border-slate-700';
    const s = status.toLowerCase();
    if (s.includes('elevated') || s.includes('high') || s.includes('low')) {
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
    return 'bg-green-500/10 text-green-400 border-green-500/20';
  };

  return (
    <div className={`max-w-4xl mx-auto px-4 py-8 ${largeFont ? 'text-lg' : 'text-sm'}`}>
      
      {/* Title */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-black font-display mb-2" style={{ color: darkMode ? '#ffffff' : '#0c1a2e' }}>
          {t('lab.title')}
        </h2>
        <p className="max-w-xl mx-auto leading-relaxed text-xs" style={{ color: darkMode ? '#94a3b8' : '#4a6280' }}>
          {t('lab.desc')}
        </p>
      </div>

      {/* Strict Safety warning */}
      <div 
        className="mb-8 p-4 rounded-xl flex items-start gap-3"
        style={darkMode ? {
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.35)',
          color: '#fef3c7',
        } : {
          background: 'rgba(217,119,6,0.1)',
          border: '1px solid rgba(217,119,6,0.3)',
          color: '#b45309',
        }}
      >
        <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider mb-0.5" style={{ color: darkMode ? '#fbbf24' : '#b45309' }}>
            Strict Safety Layer Active
          </h4>
          <p className="text-xs leading-relaxed" style={{ color: darkMode ? '#cbd5e1' : '#78350f' }}>
            This module compares reported blood or metabolic panel metrics to standard physiological intervals. **It does not diagnose conditions, explain absolute clinical causes, or substitute for physician reviews**.
          </p>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Paste Text */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Paste Report Text
            </h3>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="e.g. Glucose Fasting: 140 mg/dL, HbA1c: 7.2 %, Total Cholesterol: 210 mg/dL..."
              rows={5}
              className="w-full glass-input rounded-xl p-4 text-xs font-sans placeholder-slate-500 mb-4 resize-none"
            />
          </div>
          <button
            onClick={(e) => handleAnalyze(e)}
            disabled={loading || !textInput.trim()}
            className="premium-btn w-full"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
            {loading ? "Analyzing..." : t('lab.analyzeBtn')}
          </button>
        </div>

        {/* Upload File */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between items-center text-center">
          <div className="w-full">
            <h3 className="font-bold mb-3 text-left flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FileText className="w-4 h-4 text-brand-400" /> Upload Report Image
            </h3>
            
            <label className="premium-upload-zone">
              <FileText className="w-8 h-8 mb-3 upload-icon" />
              <p className="upload-title">
                {file ? file.name : t('lab.uploadBtn')}
              </p>
              <p className="upload-subtitle">Supports PDF, PNG, JPG, WebP</p>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
          <div className="w-full text-center mt-3">
            <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
              Scans image metrics with Tesseract and compares to database values.
            </p>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-8 p-4 bg-red-950/40 border border-red-800/80 rounded-xl text-red-200 flex items-center gap-2 text-xs">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <p>{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          <div className="glass-panel p-6 md:p-8 rounded-2xl shadow-2xl relative overflow-hidden" style={{ borderColor: 'var(--border-strong)' }}>
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-health-500 via-emerald-500 to-teal-500"></div>

            <div className="flex items-center justify-between pb-4 mb-6" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-health-400" />
                <h3 className="font-black text-xl font-display" style={{ color: 'var(--text-primary)' }}>{getLocalizedLabel('metricsAnalysis', i18n.language)}</h3>
              </div>
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
                    <Volume2 className="w-4 h-4 text-health-400" />
                    Read Aloud
                  </>
                )}
              </button>
            </div>

            {/* General Summary */}
            <div className="p-4 rounded-xl border mb-6 text-xs leading-relaxed sub-card">
              <span className="font-bold block mb-1" style={{ color: 'var(--text-primary)' }}>{getLocalizedLabel('summaryOverview', i18n.language)}</span>
              {result.generalSummary}
            </div>

            {/* Markers list */}
            <div className="space-y-4">
              {result.markers && result.markers.map((marker, idx) => (
                <div key={idx} className="inner-card flex flex-col gap-3">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div>
                      <h4 className="font-extrabold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                        {marker.name}
                      </h4>
                      <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                        {t('lab.normal')}: <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{marker.normalRange}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span 
                        className="text-xs font-black px-2.5 py-1 rounded-lg border"
                        style={{
                          background: 'var(--bg-hover)',
                          borderColor: 'var(--border-default)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {marker.value} {marker.unit}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${getStatusColor(marker.status)}`}>
                        {marker.status}
                      </span>
                    </div>
                  </div>

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
              ))}
            </div>

            {/* Disclaimer */}
            <div className="mt-8 pt-6 text-[10px] leading-relaxed border-t" style={{ borderTopColor: 'var(--border-default)', color: 'var(--text-faint)' }}>
              * {result.safetyDisclaimer} Reference parameters correspond to standard clinical WHO databases. Report anomalies must be discussed with a certified practitioner.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
