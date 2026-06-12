import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { toggleElderlyMode, toggleLargeFont } from '../store/settingsSlice';
import { logout } from '../store/authSlice';
import { useAccessibility } from '../context/AccessibilityContext';
import { Shield, Volume2, VolumeX, Type, Eye, LogOut, User, ChevronDown, Settings, Bell } from 'lucide-react';
import ProfileModal from './ProfileModal';
import NotificationsModal from './NotificationsModal';
import SettingsModal from './SettingsModal';

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
  { code: 'pa', name: 'ਪੰਜਾਬੀ' }
];

const roleLabels = {
  Patient: { label: 'Patient', color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
  'Health Specialist': { label: 'Health Specialist', color: '#818cf8', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)' },
  USER: { label: 'Patient', color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
  HEALTH_PROFESSIONAL: { label: 'Health Specialist', color: '#818cf8', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)' },
  ADMIN: { label: 'Administrator', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
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
  const idx = name ? name.charCodeAt(0) % gradients.length : 0;
  return gradients[idx];
}

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname.split('/')[1] || 'dashboard';
  const activeTab = currentPath === '' ? 'dashboard' : currentPath;

  const { elderlyMode, largeFont, isPlayingSpeech, darkMode } = useSelector(state => state.settings);
  const user = useSelector(state => state.auth?.user);
  const { speakText, stopSpeaking } = useAccessibility();

  const [profileOpen, setProfileOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'profile' | 'notifications' | 'settings'
  const dropdownRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const token = useSelector(state => state.auth?.token);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Error fetching notifications in Navbar:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // poll every 5s
    return () => clearInterval(interval);
  }, [token]);

  const unreadNotifs = notifications.filter(n => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    const text = t('speech.langChanged', { name: languages.find(l => l.code === lang)?.name, lng: lang });
    speakText(text, lang, true);
  };

  const handleNarrateNav = () => {
    speakText(t('speech.intro'), i18n.language, true);
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
    } catch (err) {
      console.error('Logout request failed:', err);
    }
    dispatch(logout());
    navigate('/login');
  };

  const menuItems = [
    { id: 'dashboard', label: t('nav.dashboard') },
    { id: 'scanner', label: t('nav.whatsappScanner') },
    { id: 'prescription', label: t('nav.prescriptionDecoder') },
    { id: 'lab', label: t('nav.labAnalyzer') },
    { id: 'learning', label: t('nav.learningHub') }
  ];

  if (user?.role === 'Health Specialist') {
    menuItems.push({ id: 'corrections', label: 'Corrections & Consultancy' });
  }

  const roleInfo = roleLabels[user?.role] || roleLabels['USER'];
  const initials = getInitials(user?.name);
  const avatarGradient = getAvatarGradient(user?.name);

  return (
    <>
    <nav className="glass-panel navbar-bg border-b sticky top-0 z-50 px-4 md:px-8 py-2 md:py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4"
      style={{ borderColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
    >
      {/* Brand Logo */}
      <div
        className="flex items-center gap-2 cursor-pointer group"
        onClick={() => navigate('/dashboard')}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-health-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-all">
          <Shield className="w-5.5 h-5.5" />
        </div>
        <div>
          {/* Brand name — gradient changes in light mode so it's visible */}
          <h1
            className="font-extrabold text-lg tracking-wide font-display"
            style={{ color: 'var(--text-primary)' }}
          >
            PresCrypto
          </h1>
          <p style={{ color: darkMode ? '#cbd5e1' : '#475569', fontSize: '10px', letterSpacing: '0.04em' }}>Health Safety Shield</p>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-1 p-1 rounded-xl border overflow-x-auto max-w-full w-full md:w-auto"
        style={{
          background: darkMode ? 'rgba(3,7,18,0.6)' : 'rgba(241,245,249,0.8)',
          borderColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
        }}
      >
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => navigate('/' + item.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 whitespace-nowrap"
            style={activeTab === item.id ? {
              background: 'linear-gradient(135deg, #6366f1, #4338ca)',
              color: 'white',
              boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
            } : {
              color: darkMode ? '#94a3b8' : '#475569',
              background: 'transparent',
            }}
            onMouseEnter={e => { if (activeTab !== item.id) { e.target.style.background = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.08)'; e.target.style.color = darkMode ? '#e2e8f0' : '#1e293b'; }}}
            onMouseLeave={e => { if (activeTab !== item.id) { e.target.style.background = 'transparent'; e.target.style.color = darkMode ? '#94a3b8' : '#475569'; }}}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 flex-wrap w-full md:w-auto justify-between md:justify-start">
        {/* Large Text Toggle */}
        <button
          onClick={() => dispatch(toggleLargeFont())}
          title={t('accessibility.normalFont')}
          className="p-2 rounded-lg border transition-all"
          style={largeFont ? {
            borderColor: '#6366f1', background: 'rgba(99,102,241,0.1)', color: '#818cf8'
          } : {
            borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
            color: darkMode ? '#94a3b8' : '#475569',
            background: 'transparent',
          }}
        >
          <Type className="w-4 h-4" />
        </button>

        {/* Elderly Mode */}
        <button
          onClick={() => {
            dispatch(toggleElderlyMode());
            const text = !elderlyMode ? t('speech.elderlyEnabled') : t('speech.elderlyDisabled');
            speakText(text, i18n.language, true);
          }}
          className="p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5"
          style={elderlyMode ? {
            borderColor: '#10b981', background: 'rgba(16,185,129,0.1)', color: '#34d399'
          } : {
            borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
            color: darkMode ? '#94a3b8' : '#475569',
            background: 'transparent',
          }}
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('accessibility.elderly')}</span>
        </button>

        {/* TTS Narrator */}
        <button
          onClick={isPlayingSpeech ? stopSpeaking : handleNarrateNav}
          className={`p-2 rounded-lg border transition-all ${isPlayingSpeech ? 'pulse-glow-indigo' : ''}`}
          style={isPlayingSpeech ? {
            borderColor: '#ec4899', background: 'rgba(236,72,153,0.1)', color: '#f472b6'
          } : {
            borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
            color: darkMode ? '#94a3b8' : '#475569',
            background: 'transparent',
          }}
          title={t('accessibility.narrate')}
        >
          {isPlayingSpeech ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Language Dropdown */}
        <div className="relative">
          <select
            value={i18n.language}
            onChange={handleLanguageChange}
            className="text-xs font-medium rounded-lg py-1.5 px-2.5 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer border"
            style={{
              background: darkMode ? '#0f172a' : '#ffffff',
              color: darkMode ? '#cbd5e1' : '#1e293b',
              borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
              boxShadow: darkMode ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* ─── User Profile Dropdown ─── */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            {/* Avatar trigger button */}
            <button
              id="user-profile-btn"
              onClick={() => setProfileOpen(!profileOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.25rem 0.625rem 0.25rem 0.25rem',
                background: profileOpen
                  ? 'rgba(99,102,241,0.12)'
                  : darkMode ? 'rgba(15,23,42,0.6)' : 'rgba(226,232,240,0.8)',
                border: `1px solid ${profileOpen ? 'rgba(99,102,241,0.4)' : darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
                borderRadius: '2rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Avatar circle */}
              <div style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: avatarGradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: 'white',
                letterSpacing: '0.03em',
                flexShrink: 0,
              }}>
                {initials}
              </div>
              {/* Name (hidden on very small screens) */}
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: darkMode ? '#cbd5e1' : '#1e293b', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name?.split(' ')[0] || 'User'}
              </span>
              <ChevronDown
                style={{
                  width: 14,
                  height: 14,
                  color: '#64748b',
                  transition: 'transform 0.2s ease',
                  transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  flexShrink: 0,
                }}
              />
            </button>

            {/* Dropdown panel */}
            {profileOpen && (
              <div
                id="user-profile-dropdown"
                className="user-profile-dropdown-panel"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  minWidth: 260,
                  background: darkMode ? 'rgba(10,15,28,0.95)' : 'rgba(255,255,255,0.98)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '1rem',
                  boxShadow: darkMode ? '0 16px 48px rgba(0,0,0,0.6)' : '0 16px 48px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                  animation: 'dropdownFadeIn 0.18s ease both',
                  zIndex: 100,
                }}
              >
                <style>{`
                  @keyframes dropdownFadeIn {
                    from { opacity: 0; transform: translateY(-8px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0)    scale(1); }
                  }
                  @media (max-width: 767px) {
                    .user-profile-dropdown-panel {
                      right: auto !important;
                      left: 0 !important;
                    }
                  }
                  .dd-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.625rem 1rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: ${darkMode ? '#94a3b8' : '#334155'};
                    cursor: pointer;
                    transition: all 0.15s ease;
                    border: none;
                    background: none;
                    width: 100%;
                    text-align: left;
                    font-family: inherit;
                  }
                  .dd-item:hover { background: ${darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(226,232,240,0.7)'}; color: ${darkMode ? '#e2e8f0' : '#0f172a'}; }
                  .dd-item.danger:hover { background: rgba(239,68,68,0.08); color: #f87171; }
                `}</style>

                {/* Profile header */}
                <div style={{ padding: '1rem 1rem 0.875rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    {/* Large avatar */}
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: avatarGradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'white',
                      flexShrink: 0,
                      boxShadow: '0 0 0 2px rgba(255,255,255,0.1)',
                    }}>
                      {initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: darkMode ? '#f1f5f9' : '#0f172a', fontSize: '0.9375rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.name || 'User'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.1rem' }}>
                        {user.email}
                      </div>
                    </div>
                  </div>

                  {/* Role badge */}
                  <div style={{ marginTop: '0.75rem' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.25rem 0.625rem',
                      background: roleInfo.bg,
                      border: `1px solid ${roleInfo.border}`,
                      borderRadius: '2rem',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: roleInfo.color,
                      letterSpacing: '0.02em',
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: roleInfo.color, display: 'inline-block' }} />
                      {roleInfo.label}
                    </span>
                  </div>
                </div>

                {/* Info rows */}
                <div style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Language</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                      {languages.find(l => l.code === (user.preferredLanguage || i18n.language))?.name || 'English'}
                    </span>
                  </div>
                  <div style={{ padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Member since</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Today'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ padding: '0.375rem 0' }}>
                  <button className="dd-item" id="open-profile-btn" onClick={() => { setProfileOpen(false); setActiveModal('profile'); }}>
                    <User style={{ width: 16, height: 16, flexShrink: 0 }} />
                    My Profile
                  </button>
                  <button className="dd-item" id="open-notifications-btn" onClick={() => { setProfileOpen(false); setActiveModal('notifications'); }}>
                    <Bell style={{ width: 16, height: 16, flexShrink: 0 }} />
                    Notifications
                    {unreadNotifs > 0 && (
                      <span style={{ marginLeft: 'auto', padding: '0.125rem 0.5rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '2rem', fontSize: '0.6875rem', color: '#f87171', fontWeight: 700 }}>
                        {unreadNotifs} new
                      </span>
                    )}
                  </button>
                  <button className="dd-item" id="open-settings-btn" onClick={() => { setProfileOpen(false); setActiveModal('settings'); }}>
                    <Settings style={{ width: 16, height: 16, flexShrink: 0 }} />
                    Settings
                  </button>
                </div>

                {/* Logout */}
                <div style={{ padding: '0.375rem 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button
                    id="logout-btn"
                    className="dd-item danger"
                    onClick={handleLogout}
                  >
                    <LogOut style={{ width: 16, height: 16, flexShrink: 0, color: '#f87171' }} />
                    <span style={{ color: '#f87171' }}>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>

    {/* ─── Modals ─── */}
    {activeModal === 'profile'       && <ProfileModal       onClose={() => setActiveModal(null)} />}
    {activeModal === 'notifications' && (
      <NotificationsModal 
        onClose={() => setActiveModal(null)} 
        initialNotifications={notifications} 
        onRefresh={fetchNotifications} 
      />
    )}
    {activeModal === 'settings'      && <SettingsModal      onClose={() => setActiveModal(null)} />}
  </>);
}
