import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { 
  Clipboard, User, Mail, MessageSquare, AlertCircle, 
  CheckCircle, ArrowLeft, RefreshCw, Send, BookOpen, Clock 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CorrectionsConsultancy() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { darkMode, largeFont } = useSelector(state => state.settings);
  const token = useSelector(state => state.auth?.token);

  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [specialistNotes, setSpecialistNotes] = useState({});
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchCorrections = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/health/corrections', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch correction requests');
      setCorrections(data.corrections || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrections();
  }, [token]);

  const handleResolve = async (id) => {
    const notes = specialistNotes[id] || '';
    if (!notes.trim()) {
      setError('Please provide consultancy notes before resolving.');
      return;
    }
    
    setUpdatingId(id);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/health/correction/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'resolved',
          specialistNotes: notes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update correction request');
      
      setSuccessMsg('Consultancy review submitted and patient notified successfully!');
      fetchCorrections();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleNotesChange = (id, val) => {
    setSpecialistNotes(prev => ({ ...prev, [id]: val }));
  };

  const pendingCount = corrections.filter(c => c.status === 'pending').length;
  const resolvedCount = corrections.filter(c => c.status === 'resolved').length;

  return (
    <div className={`max-w-5xl mx-auto px-4 py-8 ${largeFont ? 'text-lg' : 'text-sm'}`}>
      
      {/* Header Navigation */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>

      {/* Hero Section */}
      <div className="dashboard-hero glass-panel relative overflow-hidden p-6 md:p-8 mb-8 rounded-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl -z-10 pulse-glow-indigo opacity-30" style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }} />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="premium-badge px-3 py-1 rounded-full text-xs font-bold tracking-wider inline-flex items-center gap-1.5 mb-4 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              🩺 Specialist Exclusive Portal
            </span>
            <h2 className="text-2xl md:text-3xl font-black font-display tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
              Corrections & Consultancy
            </h2>
            <p className="max-w-xl text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Review patient complaints, check automated summaries, and append clinical notes or corrections to verify health literacy.
            </p>
          </div>

          {/* Stats widget */}
          <div className="flex gap-4">
            <div className="inner-card p-4 text-center min-w-[100px]">
              <span className="text-2xl font-black text-amber-500">{pendingCount}</span>
              <span className="block text-[9px] font-bold tracking-wider uppercase mt-1 text-slate-400">Pending</span>
            </div>
            <div className="inner-card p-4 text-center min-w-[100px]">
              <span className="text-2xl font-black text-emerald-500">{resolvedCount}</span>
              <span className="block text-[9px] font-bold tracking-wider uppercase mt-1 text-slate-400">Resolved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert states */}
      {error && (
        <div className="mb-6 p-4 bg-red-950/40 border border-red-800/80 rounded-xl text-red-200 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl text-emerald-200 flex items-center gap-2 text-xs">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* Corrections List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>
            Correction Requests Queue
          </h3>
          <button
            onClick={fetchCorrections}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border sub-card"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-default)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {loading && corrections.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
            <p className="text-xs text-slate-400">Loading patient requests...</p>
          </div>
        ) : corrections.length === 0 ? (
          <div className="glass-panel text-center py-16 rounded-2xl">
            <CheckCircle className="w-12 h-12 text-emerald-500/20 mx-auto mb-3" />
            <h4 className="font-extrabold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>All caught up!</h4>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>There are no outstanding patient correction requests in the database.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {corrections.map((item) => {
              const parsedAnalysis = (() => {
                try {
                  return JSON.parse(item.automatedAnalysis);
                } catch {
                  return null;
                }
              })();

              const isExpanded = expandedId === item.id;

              return (
                <div 
                  key={item.id} 
                  className={`glass-panel p-5 rounded-2xl transition-all duration-300 relative border ${
                    item.status === 'pending' 
                      ? 'border-amber-500/20 shadow-amber-500/5 hover:border-amber-500/40' 
                      : 'border-slate-800/40 hover:border-slate-800/80'
                  }`}
                >
                  {/* Status Indicator */}
                  <div className="absolute top-5 right-5 flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                      item.status === 'pending' 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                        : 'bg-green-500/10 text-green-400 border-green-500/20'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Request Header */}
                  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border" style={{ borderColor: 'var(--border-default)' }}>
                      {item.type === 'vision' ? <span className="text-lg">👁️</span> : <span className="text-lg">🩸</span>}
                    </div>
                    <div>
                      <h4 className="font-black text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        {item.user?.name || 'Anonymous Patient'}
                        <span className="text-[10px] font-semibold text-slate-400 font-sans tracking-wide">
                          (Review ID: #{item.id.substring(0, 8)})
                        </span>
                      </h4>
                      <p className="text-[10px] flex items-center gap-3 mt-0.5" style={{ color: 'var(--text-faint)' }}>
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {item.user?.email || 'No email'}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.createdAt).toLocaleString('en-IN')}</span>
                      </p>
                    </div>
                  </div>

                  {/* Complaint Section */}
                  <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/15 mb-4 text-xs">
                    <span className="font-extrabold text-[10px] text-amber-400 uppercase tracking-wider block mb-1">
                      Patient Dissatisfaction Reason:
                    </span>
                    <p className="text-slate-300 italic">
                      "{item.reason || 'No detailed reason provided.'}"
                    </p>
                  </div>

                  {/* Expand button */}
                  <div className="mb-4">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="text-xs font-bold text-indigo-400 flex items-center gap-1"
                    >
                      {isExpanded ? 'Hide Submitted Data' : 'View Submitted Data & Reports'}
                    </button>
                  </div>

                  {/* Expanded sections */}
                  {isExpanded && (
                    <div className="space-y-4 mb-4 animate-fade-in border-t pt-4" style={{ borderColor: 'var(--border-default)' }}>
                      {/* Original Input */}
                      <div className="inner-card p-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                          Original Text Pasted by Patient:
                        </span>
                        <pre className="text-slate-300 whitespace-pre-wrap font-sans text-xs bg-slate-950/40 p-3 rounded-lg border leading-relaxed border-slate-800">
                          {item.originalInput}
                        </pre>
                      </div>

                      {/* Automated analysis result */}
                      {parsedAnalysis && (
                        <div className="inner-card p-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                            Automated Analysis Summary:
                          </span>
                          <div className="text-xs space-y-2 text-slate-300 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                              Summary Overview:
                            </p>
                            <p className="mb-3">{parsedAnalysis.generalSummary}</p>
                            
                            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                              Extracted Markers:
                            </p>
                            <div className="space-y-1.5">
                              {parsedAnalysis.markers?.map((m, idx) => (
                                <div key={idx} className="flex justify-between border-b pb-1 border-slate-800 text-[11px]">
                                  <span className="font-medium text-slate-400">{m.name}</span>
                                  <span>{m.value} {m.unit} — <b className="text-indigo-400 font-semibold">{m.status}</b></span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action/Submit Feedback subform */}
                  {item.status === 'pending' ? (
                    <div className="border-t pt-4 mt-2 flex flex-col gap-3" style={{ borderColor: 'var(--border-default)' }}>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Write Correction / Consultancy Feedback:
                      </label>
                      <textarea
                        value={specialistNotes[item.id] || ''}
                        onChange={(e) => handleNotesChange(item.id, e.target.value)}
                        placeholder="Provide corrections, clinical analysis verification, or consult instructions..."
                        rows={3}
                        className="w-full glass-input rounded-xl p-3 text-xs placeholder-slate-500 resize-none font-sans"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleResolve(item.id)}
                          disabled={updatingId === item.id}
                          className="premium-btn py-2 px-4 flex items-center gap-1.5 text-xs tracking-wider"
                          style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            boxShadow: '0 2px 8px rgba(16,185,129,0.25)'
                          }}
                        >
                          {updatingId === item.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          Submit & Resolve Request
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Resolved state details
                    <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs">
                      <span className="font-extrabold text-[10px] text-emerald-400 uppercase tracking-wider block mb-1">
                        Specialist Feedback (Resolved):
                      </span>
                      <p className="text-slate-300">
                        {item.specialistNotes || 'No notes left.'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
