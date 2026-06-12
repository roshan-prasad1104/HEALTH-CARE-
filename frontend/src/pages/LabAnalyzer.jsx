import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { AlertTriangle, BarChart3, CheckCircle, Eye, FileText, RefreshCw, Send, ShieldCheck } from 'lucide-react';

const BLOOD_HINTS = ['hba1c', 'hb a1c', 'glucose', 'blood sugar', 'fasting sugar', 'cholesterol', 'hdl', 'ldl', 'triglycerides', 'hemoglobin'];
const VISION_HINTS = ['sph', 'cyl', 'axis', 'visual acuity', 'iop', 'intraocular pressure', 'od', 'os', 'right eye', 'left eye'];

const MODE_COPY = {
  blood: {
    title: 'Blood Biomarkers',
    icon: BarChart3,
    placeholder: 'Paste report text, for example: HbA1c 6.2 %, Glucose 112 mg/dL, Total Cholesterol 190 mg/dL',
    summary: 'Text-only extraction for HbA1c, Glucose, Cholesterol, Hemoglobin, HDL, LDL, and Triglycerides.'
  },
  vision: {
    title: 'Vision Metrics',
    icon: Eye,
    placeholder: 'Paste report text, for example: OD SPH -1.25 CYL -0.50 AXIS 90, OS SPH -1.00, Visual Acuity 6/6, IOP 16',
    summary: 'Text-only extraction for OD/OS SPH, CYL, AXIS, Visual Acuity, and IOP.'
  }
};

function hasAny(text, keywords) {
  const normalized = text.toLowerCase();
  return keywords.some(keyword => normalized.includes(keyword));
}

function Slot({ label, marker }) {
  const isMissing = !marker || marker.status === 'Missing';
  return (
    <div className="inner-card min-h-[7rem] flex flex-col justify-between">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-black uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>{label}</span>
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${isMissing ? 'text-slate-400 border-slate-700' : 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'}`}>
          {isMissing ? 'Missing' : marker.status}
        </span>
      </div>
      <div>
        <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
          {isMissing ? '-' : marker.value}
          {!isMissing && marker.unit ? <span className="text-sm ml-1" style={{ color: 'var(--text-muted)' }}>{marker.unit}</span> : null}
        </p>
        <p className="text-[11px] mt-1" style={{ color: 'var(--text-faint)' }}>{marker?.normalRange || 'Report-specific'}</p>
      </div>
    </div>
  );
}

function EventFeed({ events }) {
  if (events.length === 0) return null;
  return (
    <div className="mb-6 space-y-2">
      {events.map(event => (
        <div key={event.id} className="p-3 rounded-xl border flex items-start gap-2 text-xs bg-emerald-500/10 border-emerald-500/25 text-emerald-200">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-300" />
          <div>
            <p className="font-bold">{event.title}</p>
            {event.body ? <p className="opacity-80 mt-0.5">{event.body}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LabAnalyzer() {
  const { largeFont } = useSelector(state => state.settings);
  const token = useSelector(state => state.auth?.token);

  const [mode, setMode] = useState('blood');
  const [reportText, setReportText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [reviewReason, setReviewReason] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  const modeCopy = MODE_COPY[mode];
  const ModeIcon = modeCopy.icon;

  const warning = useMemo(() => {
    if (!reportText.trim()) return '';
    if (mode === 'vision' && hasAny(reportText, BLOOD_HINTS)) return 'Blood biomarkers detected. Switch to Blood mode for HbA1c, Glucose, and Cholesterol slots.';
    if (mode === 'blood' && hasAny(reportText, VISION_HINTS)) return 'Vision keywords detected. Switch to Vision mode for SPH, CYL, AXIS, Visual Acuity, and IOP slots.';
    return '';
  }, [mode, reportText]);

  const resetWorkspace = () => {
    setReportText('');
    setAnalysis(null);
    setError('');
    setReviewReason('');
    setReviewOpen(false);
    setReviewLoading(false);
  };

  const pushEvent = (title, body = '') => {
    setEvents(prev => [{ id: `${Date.now()}-${Math.random()}`, title, body }, ...prev].slice(0, 4));
  };

  const switchMode = (nextMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setEvents([]);
    resetWorkspace();
  };

  useEffect(() => {
    return () => resetWorkspace();
  }, []);

  const analyze = async () => {
    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const response = await fetch('/api/health/lab/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: reportText, category: mode })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analysis failed');
      setAnalysis(data.analysis);
      pushEvent(`${mode === 'blood' ? 'Blood' : 'Vision'} analyzed successfully`, data.analysis.generalSummary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!analysis || !reviewReason.trim()) return;
    setReviewLoading(true);
    setError('');

    try {
      const response = await fetch('/api/health/correction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: mode,
          originalInput: reportText,
          automatedAnalysis: JSON.stringify(analysis),
          reason: reviewReason
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not forward correction request');
      pushEvent('Correction request forwarded', 'A Health Specialist can now review this database entry.');
      setReviewOpen(false);
      setReviewReason('');
    } catch (err) {
      setError(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const markerMap = useMemo(() => {
    const map = {};
    (analysis?.markers || []).forEach(marker => {
      map[marker.key] = marker;
    });
    return map;
  }, [analysis]);

  return (
    <div className={`max-w-5xl mx-auto px-4 md:px-8 py-8 ${largeFont ? 'text-lg' : 'text-sm'}`}>
      <div className="glass-panel rounded-2xl p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 premium-badge px-3 py-1 rounded-full text-xs font-bold mb-4">
              <FileText className="w-3.5 h-3.5" /> Text-only Lab Analyzer
            </div>
            <h2 className="text-2xl md:text-3xl font-black font-display" style={{ color: 'var(--text-primary)' }}>
              {modeCopy.title}
            </h2>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {modeCopy.summary}
            </p>
          </div>

          <div className="flex p-1 rounded-xl border w-full md:w-auto" style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-default)' }}>
            {Object.entries(MODE_COPY).map(([key, item]) => {
              const Icon = item.icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => switchMode(key)}
                  className="flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2"
                  style={mode === key ? { background: key === 'blood' ? '#059669' : '#0284c7', color: 'white' } : { color: 'var(--text-muted)' }}
                >
                  <Icon className="w-4 h-4" /> {item.title}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <EventFeed events={events} />

      {warning ? (
        <div className="mb-6 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/10 border-amber-500/30 text-amber-100">
          <div className="flex items-start gap-2 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-300" />
            {warning}
          </div>
          <button type="button" className="premium-btn py-2 px-3" onClick={() => switchMode(mode === 'blood' ? 'vision' : 'blood')}>
            Switch mode
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] gap-6">
        <div className="glass-panel rounded-2xl p-5 md:p-6">
          <label className="flex items-center gap-2 text-sm font-black mb-3" style={{ color: 'var(--text-primary)' }}>
            <ModeIcon className="w-4 h-4" /> Paste Report Text
          </label>
          <textarea
            value={reportText}
            onChange={(event) => {
              setReportText(event.target.value);
              setAnalysis(null);
              setError('');
            }}
            rows={12}
            className="w-full glass-input rounded-xl p-4 text-sm resize-none"
            placeholder={modeCopy.placeholder}
          />
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={analyze} disabled={loading || !reportText.trim()} className="premium-btn flex-1">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {loading ? 'Analyzing' : 'Analyze Text'}
            </button>
            <button type="button" onClick={() => { setEvents([]); resetWorkspace(); }} className="px-4 py-3 rounded-xl border text-xs font-black" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-default)' }}>
              Clear
            </button>
          </div>
        </div>

        <aside className="glass-panel rounded-2xl p-5">
          <h3 className="font-black mb-3" style={{ color: 'var(--text-primary)' }}>Mode Safety</h3>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Switching mode clears pasted text, diagnostic output, review notes, and event messages so data from one view cannot leak into another.
          </p>
          <div className="mt-5 space-y-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <p><strong>Blood:</strong> HbA1c, Glucose, Cholesterol, Hemoglobin.</p>
            <p><strong>Vision:</strong> OD/OS SPH, CYL, AXIS, Visual Acuity, IOP.</p>
          </div>
        </aside>
      </div>

      {error ? (
        <div className="mt-6 p-4 bg-red-950/40 border border-red-800/80 rounded-xl text-red-200 flex items-center gap-2 text-xs">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <p>{error}</p>
        </div>
      ) : null}

      {analysis ? (
        <div className="mt-6 glass-panel rounded-2xl p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h3 className="text-xl font-black font-display" style={{ color: 'var(--text-primary)' }}>Structured Results</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{analysis.generalSummary}</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-default)' }}>
              {analysis.foundCount} found
            </span>
          </div>

          {mode === 'vision' ? (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wide mb-3" style={{ color: 'var(--text-faint)' }}>Right Eye (OD)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Slot label="SPH" marker={markerMap.odSph} />
                  <Slot label="CYL" marker={markerMap.odCyl} />
                  <Slot label="AXIS" marker={markerMap.odAxis} />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wide mb-3" style={{ color: 'var(--text-faint)' }}>Left Eye (OS)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Slot label="SPH" marker={markerMap.osSph} />
                  <Slot label="CYL" marker={markerMap.osCyl} />
                  <Slot label="AXIS" marker={markerMap.osAxis} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Slot label="Visual Acuity" marker={markerMap.visualAcuity} />
                <Slot label="IOP" marker={markerMap.iop} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(analysis.markers || []).map(marker => <Slot key={marker.key} label={marker.name} marker={marker} />)}
            </div>
          )}

          <div className="mt-6 pt-5 border-t" style={{ borderTopColor: 'var(--border-default)' }}>
            {!reviewOpen ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Need a manual 1-on-1 review from a Health Specialist?</p>
                <button type="button" onClick={() => setReviewOpen(true)} className="premium-btn py-2 px-4">
                  Request Review
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={reviewReason}
                  onChange={(event) => setReviewReason(event.target.value)}
                  rows={3}
                  className="w-full glass-input rounded-xl p-3 text-xs resize-none"
                  placeholder="Tell the specialist what you want checked."
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => { setReviewOpen(false); setReviewReason(''); }} className="px-3 py-2 rounded-xl border text-xs font-bold" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-default)' }}>
                    Cancel
                  </button>
                  <button type="button" onClick={submitReview} disabled={reviewLoading || !reviewReason.trim()} className="premium-btn py-2 px-4">
                    {reviewLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Forward
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
