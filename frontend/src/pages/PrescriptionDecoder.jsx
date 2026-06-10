import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useAccessibility } from '../context/AccessibilityContext';
import { FileText, AlertTriangle, ShieldCheck, Pill, RefreshCw, Layers, Volume2, VolumeX } from 'lucide-react';

export default function PrescriptionDecoder() {
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

    if (!result || !result.medicines) return;
    const speakParts = [t('prescription.medList')];
    result.medicines.forEach((med, idx) => {
      speakParts.push(`${idx + 1}. ${med.name}.`);
      if (med.genericName) speakParts.push(`${t('prescription.generic')}: ${med.genericName}.`);
      speakParts.push(`${t('prescription.purpose')}: ${med.purpose}.`);
      if (med.therapeuticClass) speakParts.push(`${t('prescription.class')}: ${med.therapeuticClass}.`);
      speakParts.push(`${t('prescription.dosage')}: ${med.dosageWarning}.`);
      if (med.sideEffects && med.sideEffects.length > 0) {
        speakParts.push(`${t('prescription.sideEffects')}: ${med.sideEffects.join(', ')}.`);
      }
      if (med.interactions && med.interactions.length > 0) {
        speakParts.push(`${t('prescription.interactions')}: ${med.interactions.join(', ')}.`);
      }
    });
    if (result.safetyGuardrails) {
      speakParts.push(result.safetyGuardrails);
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

  const handleDecode = async (e, directFile = null) => {
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
      const response = await fetch('/api/health/prescription/decode', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Decoding failed');

      setOriginalResult(data.decoded);
      setResult(data.decoded);
      speakText(t('speech.prescriptionSuccess'), i18n.language);
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
      handleDecode(null, selectedFile);
    }
  };

  return (
    <div className={`max-w-4xl mx-auto px-4 py-8 ${largeFont ? 'text-lg' : 'text-sm'}`}>
      
      {/* Title */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-black font-display mb-2" style={{ color: darkMode ? '#ffffff' : '#0c1a2e' }}>
          {t('prescription.title')}
        </h2>
        <p className="max-w-xl mx-auto leading-relaxed text-xs" style={{ color: darkMode ? '#94a3b8' : '#4a6280' }}>
          {t('prescription.desc')}
        </p>
      </div>

      {/* Safety Warning Header */}
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
            PresCrypto is an **educational assistant** only. This tool **does not prescribe medication, verify dosages, or diagnose illnesses**. Never alter medication doses or stop therapy without speaking to your doctor.
          </p>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Paste Box */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Pill className="w-4 h-4 text-indigo-400" /> Paste Prescription Text
            </h3>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="e.g. Rx Metformin 500mg bid after food, Paracetamol 650mg prn..."
              rows={5}
              className="w-full glass-input rounded-xl p-4 text-xs font-sans placeholder-slate-500 mb-4 resize-none"
            />
          </div>
          <button
            onClick={(e) => handleDecode(e)}
            disabled={loading || !textInput.trim()}
            className="premium-btn w-full"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {loading ? "Decoding..." : t('prescription.decodeBtn')}
          </button>
        </div>

        {/* Upload Box */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between items-center text-center">
          <div className="w-full">
            <h3 className="font-bold mb-3 text-left flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FileText className="w-4 h-4 text-brand-400" /> Upload Prescription Slip
            </h3>
            
            <label className="premium-upload-zone">
              <FileText className="w-8 h-8 mb-3 upload-icon" />
              <p className="upload-title">
                {file ? file.name : t('prescription.uploadBtn')}
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
              Parses using Tesseract.js OCR and queries Gemini with safety guardrails.
            </p>
          </div>
        </div>
      </div>

      {/* Error display */}
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
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-500 via-indigo-500 to-blue-500"></div>

            <div className="flex items-center justify-between pb-4 mb-6" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-brand-400" />
                <h3 className="font-black text-xl font-display" style={{ color: 'var(--text-primary)' }}>{t('prescription.medList')}</h3>
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
                    <Volume2 className="w-4 h-4 text-brand-400" />
                    Read Aloud
                  </>
                )}
              </button>
            </div>

            {/* Medicines loop */}
            <div className="space-y-6">
              {result.medicines && result.medicines.map((med, idx) => (
                <div key={idx} className="inner-card">
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                    <div>
                      <h4 className="font-extrabold text-base flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Pill className="w-4.5 h-4.5 text-brand-400" /> {med.name}
                      </h4>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {t('prescription.generic')}: <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{med.genericName || 'Not specified'}</span>
                      </p>
                    </div>
                    {med.safetyCategory && (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                        med.safetyCategory.toLowerCase().includes('safe') 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                          : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      }`}>
                        {med.safetyCategory}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                    {/* Purpose */}
                    <div className="sub-card">
                      <span className="text-[10px] font-bold uppercase tracking-wide block mb-1" style={{ color: 'var(--text-muted)' }}>{t('prescription.purpose')}</span>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{med.purpose}</p>
                    </div>

                    {/* Class */}
                    {med.therapeuticClass && (
                      <div className="sub-card">
                        <span className="text-[10px] font-bold uppercase tracking-wide block mb-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <Layers className="w-3 h-3" /> {t('prescription.class')}
                        </span>
                        <p style={{ color: 'var(--text-secondary)' }}>{med.therapeuticClass}</p>
                      </div>
                    )}

                    {/* Dosage advice */}
                    <div className="sub-card md:col-span-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide block mb-1" style={{ color: 'var(--text-muted)' }}>{t('prescription.dosage')}</span>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }} className="font-medium">{med.dosageWarning}</p>
                    </div>
                  </div>

                  {/* Side Effects */}
                  {med.sideEffects && med.sideEffects.length > 0 && (
                    <div className="mt-4 pt-4 border-t" style={{ borderTopColor: 'var(--border-default)' }}>
                      <span className="text-[10px] font-bold uppercase tracking-wide block mb-2" style={{ color: 'var(--text-muted)' }}>{t('prescription.sideEffects')}</span>
                      <div className="flex flex-wrap gap-2">
                        {med.sideEffects.map((se, sIdx) => (
                          <span 
                            key={sIdx} 
                            className="text-xs px-2.5 py-1 rounded-lg border"
                            style={{
                              background: 'var(--bg-hover)',
                              borderColor: 'var(--border-default)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            • {se}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Drug Interactions */}
                  {med.interactions && med.interactions.length > 0 && (
                    <div className="mt-4 pt-4 border-t" style={{ borderTopColor: 'var(--border-default)' }}>
                      <span className="text-[10px] font-bold uppercase tracking-wide block mb-2 flex items-center gap-1" style={{ color: '#ef4444' }}>
                        <AlertTriangle className="w-3.5 h-3.5" /> {t('prescription.interactions')}
                      </span>
                      <div className="space-y-2">
                        {med.interactions.map((inter, iIdx) => (
                          <div 
                            key={iIdx} 
                            className="p-2.5 rounded-lg text-xs border bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                          >
                            {inter}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="mt-8 pt-6 text-[10px] leading-relaxed border-t" style={{ borderTopColor: 'var(--border-default)', color: 'var(--text-faint)' }}>
              * {result.safetyGuardrails} All facts matches verified medical references (WHO, CDC). Never change prescribed plans based on automated analyses.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
