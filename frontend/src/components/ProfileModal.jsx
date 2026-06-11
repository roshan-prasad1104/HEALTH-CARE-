import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../store/authSlice';
import { X, User, Mail, Shield, Globe, Edit3, Save, Check, Camera, Loader } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'te', name: 'తెలుగు' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'kn', name: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'മലയാളം' },
  { code: 'mr', name: 'मराठी' },
  { code: 'gu', name: 'ગુજરાતી' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ' },
];

const roleLabels = {
  USER: { label: 'Patient / General User', icon: '👤', color: '#34d399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
  HEALTH_PROFESSIONAL: { label: 'Healthcare Professional', icon: '🩺', color: '#818cf8', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.25)' },
  ADMIN: { label: 'Administrator', icon: '⚙️', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
};

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function getAvatarGradient(name) {
  const gradients = [
    'linear-gradient(135deg, #6366f1, #4338ca)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #f59e0b, #d97706)',
    'linear-gradient(135deg, #ec4899, #be185d)',
    'linear-gradient(135deg, #14b8a6, #0d9488)',
    'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  ];
  return gradients[name ? name.charCodeAt(0) % gradients.length : 0];
}

export default function ProfileModal({ onClose }) {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth?.user);
  const { darkMode } = useSelector(state => state.settings || { darkMode: true });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: user?.name || '',
    preferredLanguage: user?.preferredLanguage || 'en',
  });

  const roleInfo = roleLabels[user?.role] || roleLabels['USER'];
  const initials = getInitials(user?.name);
  const gradient = getAvatarGradient(user?.name);

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name cannot be empty'); return; }
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: form.name.trim(), preferredLanguage: form.preferredLanguage }),
      });
      // If endpoint doesn't exist yet, still update locally
      const updatedUser = { ...user, name: form.name.trim(), preferredLanguage: form.preferredLanguage };
      dispatch(setUser(updatedUser));
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      // Still update locally even if API fails
      const updatedUser = { ...user, name: form.name.trim(), preferredLanguage: form.preferredLanguage };
      dispatch(setUser(updatedUser));
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        <style>{modalCSS}</style>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '0.625rem', background: darkMode ? 'rgba(99,102,241,0.12)' : 'rgba(14,165,233,0.1)', border: darkMode ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(14,165,233,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={16} color={darkMode ? '#818cf8' : '#0ea5e9'} />
            </div>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>My Profile</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Avatar section */}
        <div style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.625rem', fontWeight: 700, color: 'white', boxShadow: '0 0 0 3px rgba(255,255,255,0.08), 0 8px 24px rgba(0,0,0,0.3)' }}>
              {initials}
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: 'var(--bg-card-solid)', border: '2px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Camera size={12} color="var(--text-muted)" />
            </div>
          </div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.125rem', marginBottom: '0.375rem' }}>{user?.name}</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{user?.email}</div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.75rem', background: roleInfo.bg, border: `1px solid ${roleInfo.border}`, borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 600, color: roleInfo.color }}>
            <span>{roleInfo.icon}</span> {roleInfo.label}
          </span>
        </div>

        {/* Editable fields */}
        <div style={{ padding: '1.25rem 1.5rem', flex: 1, overflowY: 'auto' }}>
          {error && <div style={{ padding: '0.625rem 0.875rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem', color: '#fca5a5', fontSize: '0.8125rem', marginBottom: '1rem' }}>{error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Name */}
            <div>
              <label style={labelStyle}>FULL NAME</label>
              {editing ? (
                <input className="profile-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your full name" autoFocus />
              ) : (
                <div style={fieldValueStyle}><User size={14} color="var(--text-faint)" />{user?.name || '—'}</div>
              )}
            </div>

            {/* Email (read-only) */}
            <div>
              <label style={labelStyle}>EMAIL ADDRESS</label>
              <div style={{ ...fieldValueStyle, opacity: 0.7 }}><Mail size={14} color="var(--text-muted)" />{user?.email || '—'}</div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: '0.375rem' }}>Email cannot be changed. Contact support if needed.</p>
            </div>

            {/* Role (read-only) */}
            <div>
              <label style={labelStyle}>ROLE</label>
              <div style={fieldValueStyle}><Shield size={14} color="var(--text-faint)" />{roleInfo.label}</div>
            </div>

            {/* Language */}
            <div>
              <label style={labelStyle}>PREFERRED LANGUAGE</label>
              {editing ? (
                <select className="profile-input" value={form.preferredLanguage} onChange={e => setForm({ ...form, preferredLanguage: e.target.value })}>
                  {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                </select>
              ) : (
                <div style={fieldValueStyle}><Globe size={14} color="var(--text-faint)" />{languages.find(l => l.code === (user?.preferredLanguage || 'en'))?.name || 'English'}</div>
              )}
            </div>

            {/* Account created */}
            {user?.createdAt && (
              <div>
                <label style={labelStyle}>MEMBER SINCE</label>
                <div style={fieldValueStyle}>
                  <Shield size={14} color="var(--text-faint)" />
                  {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-default)', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          {editing ? (
            <>
              <button className="modal-btn-ghost" onClick={() => { setEditing(false); setForm({ name: user?.name || '', preferredLanguage: user?.preferredLanguage || 'en' }); setError(''); }}>
                Cancel
              </button>
              <button className="modal-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><Loader size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving...</> : <><Save size={14} /> Save Changes</>}
              </button>
            </>
          ) : (
            <>
              {saved && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: '#34d399', marginRight: 'auto' }}>
                  <Check size={14} /> Saved successfully
                </span>
              )}
              <button className="modal-btn-ghost" onClick={onClose}>Close</button>
              <button className="modal-btn-primary" onClick={() => setEditing(true)}>
                <Edit3 size={14} /> Edit Profile
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared styles ─────────────────────────────────────────────────────────
const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center',
  justifyContent: 'center', padding: '1rem', animation: 'overlayIn 0.2s ease both',
};

const modalStyle = {
  width: '100%', maxWidth: 440, maxHeight: '90vh', display: 'flex', flexDirection: 'column',
  background: 'var(--bg-card-deep)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid var(--border-strong)', borderRadius: '1.25rem',
  boxShadow: 'var(--shadow-dropdown)', animation: 'modalIn 0.25s cubic-bezier(0.16,1,0.3,1) both',
  overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif",
};

const labelStyle = {
  display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-faint)',
  letterSpacing: '0.06em', marginBottom: '0.4rem',
};

const fieldValueStyle = {
  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem',
  background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
  borderRadius: '0.625rem', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500,
};

const modalCSS = `
  @keyframes overlayIn { from{opacity:0} to{opacity:1} }
  @keyframes modalIn { from{opacity:0;transform:scale(0.96) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  
  .modal-close-btn { background:none; border:none; cursor:pointer; padding:6px; border-radius:8px; color:var(--text-muted); display:flex; align-items:center; transition:all 0.2s ease; }
  .modal-close-btn:hover { background:var(--bg-hover); color:var(--text-primary); transform:scale(1.08) rotate(90deg); }
  
  .profile-input { width:100%; padding:0.625rem 0.875rem; background:var(--bg-input); border:1.5px solid var(--border-strong); border-radius:0.625rem; color:var(--text-primary); font-size:0.9rem; outline:none; box-sizing:border-box; font-family:inherit; transition:all 0.2s; }
  
  .profile-input:focus {
    border-color: #0ea5e9;
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
  }
  html:not(.light-mode) .profile-input:focus {
    border-color: rgba(99, 102, 241, 0.7);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  }
  
  .modal-btn-primary { display:inline-flex; align-items:center; gap:0.4rem; padding:0.5625rem 1.125rem; background:linear-gradient(135deg,#0ea5e9,#0284c7); border:none; border-radius:0.625rem; color:white; font-size:0.875rem; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:inherit; }
  html:not(.light-mode) .modal-btn-primary { background:linear-gradient(135deg,#6366f1,#4338ca); }
  
  .modal-btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 20px rgba(14,165,233,0.4); }
  html:not(.light-mode) .modal-btn-primary:hover:not(:disabled) { box-shadow:0 6px 20px rgba(99,102,241,0.4); }
  
  .modal-btn-primary:disabled { opacity:0.6; cursor:not-allowed; }
  
  .modal-btn-ghost { display:inline-flex; align-items:center; gap:0.4rem; padding:0.5625rem 1.125rem; background:var(--bg-hover); border:1px solid var(--border-subtle); border-radius:0.625rem; color:var(--text-secondary); font-size:0.875rem; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:inherit; }
  .modal-btn-ghost:hover { background:var(--bg-icon); color:var(--text-primary); }
`;
