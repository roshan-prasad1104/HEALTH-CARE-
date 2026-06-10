import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  toggleElderlyMode,
  toggleLargeFont,
  toggleDarkMode,
  toggleSaveHistory,
  toggleAnalyticsOptOut,
  toggleSoundAlerts,
  togglePushNotifications,
} from '../store/settingsSlice';
import { X, Settings, Eye, Type, Moon, Sun, Shield, Volume2, VolumeX, Bell, BellOff, Database, BarChart2, Info, Check } from 'lucide-react';

// ─── Animated Toggle ─────────────────────────────────────────────────────────
function Toggle({ enabled, onToggle, id, disabled }) {
  const handleClick = (e) => {
    e.stopPropagation();
    if (!disabled && onToggle) {
      onToggle();
    }
  };
  return (
    <button
      id={id}
      onClick={handleClick}
      disabled={disabled}
      className={`custom-toggle ${enabled ? 'enabled' : ''}`}
      aria-checked={enabled}
      role="switch"
    >
      <div className="toggle-knob" />
    </button>
  );
}

// ─── Setting row ─────────────────────────────────────────────────────────────
function SettingRow({ id, icon, label, desc, enabled, onToggle, disabled, badge }) {
  return (
    <div
      onClick={disabled ? undefined : onToggle}
      className="settings-row"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.9rem 1rem', cursor: disabled ? 'not-allowed' : 'pointer',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0, paddingRight: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{label}</span>
          {badge && (
            <span style={{ padding: '0.1rem 0.5rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 700, color: '#34d399' }}>
              {badge}
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
      </div>
      <Toggle enabled={enabled} onToggle={onToggle} id={id} disabled={disabled} />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SettingsModal({ onClose }) {
  const dispatch = useDispatch();
  const {
    elderlyMode, largeFont, darkMode,
    saveHistory, analyticsOptOut,
    soundAlerts, pushNotifications,
  } = useSelector(state => state.settings);

  const [pushStatus, setPushStatus] = useState(Notification?.permission || 'default');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2800);
  };

  // Push notifications — request browser permission
  const handlePushToggle = async () => {
    if (!pushNotifications) {
      // Turning ON
      if (!('Notification' in window)) {
        showToast('⚠️ Your browser does not support notifications');
        return;
      }
      if (Notification.permission === 'denied') {
        showToast('🚫 Permission blocked — enable in browser site settings');
        return;
      }
      const perm = await Notification.requestPermission();
      setPushStatus(perm);
      if (perm === 'granted') {
        dispatch(togglePushNotifications());
        // Fire a test notification
        new Notification('PresCrypto Notifications', {
          body: '✅ You will now receive health alerts and scan results.',
          icon: '/favicon.ico',
        });
        showToast('✅ Push notifications enabled!');
      } else {
        showToast('Notification permission not granted');
      }
    } else {
      // Turning OFF
      dispatch(togglePushNotifications());
      showToast('🔕 Push notifications disabled');
    }
  };

  const handleDarkModeToggle = () => {
    dispatch(toggleDarkMode());
    showToast(darkMode ? '☀️ Light mode enabled' : '🌙 Dark mode enabled');
  };

  const handleSoundToggle = () => {
    dispatch(toggleSoundAlerts());
    showToast(soundAlerts ? '🔇 Sound alerts muted' : '🔊 Sound alerts enabled');
  };

  const handleElderlyToggle = () => {
    dispatch(toggleElderlyMode());
    showToast(!elderlyMode ? '👁️ Elderly mode ON — larger text & hover narration' : 'Elderly mode off');
  };

  const handleLargeFontToggle = () => {
    dispatch(toggleLargeFont());
    showToast(!largeFont ? '🔡 Large text enabled' : 'Normal text size');
  };

  const handleSaveHistoryToggle = () => {
    dispatch(toggleSaveHistory());
    showToast(!saveHistory ? '💾 Scan history will be saved' : '🗑️ History saving disabled');
  };

  const handleAnalyticsToggle = () => {
    dispatch(toggleAnalyticsOptOut());
    showToast(!analyticsOptOut ? '🛡️ Analytics opted out' : 'Anonymous analytics re-enabled');
  };

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        <style>{modalCSS}</style>

        {/* Toast notification */}
        {toastMsg && (
          <div style={{
            position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)',
            background: 'var(--bg-card-solid)', border: '1px solid var(--border-strong)',
            borderRadius: '2rem', padding: '0.5rem 1.125rem', fontSize: '0.8125rem',
            color: 'var(--text-primary)', fontWeight: 500, zIndex: 10, whiteSpace: 'nowrap',
            boxShadow: 'var(--shadow-dropdown)', animation: 'toastIn 0.25s ease',
          }}>
            {toastMsg}
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '0.625rem', background: darkMode ? 'rgba(99,102,241,0.12)' : 'rgba(14,165,233,0.1)', border: darkMode ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(14,165,233,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={16} color={darkMode ? '#818cf8' : '#0284c7'} />
            </div>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>Settings</span>
          </div>
          <button className="settings-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem 1rem' }}>

          {/* ── Accessibility ── */}
          <SectionHeader icon={<Eye size={14} color={darkMode ? "#818cf8" : "#0ea5e9"} />} iconBg={darkMode ? "rgba(99,102,241,0.12)" : "rgba(14,165,233,0.1)"} iconBorder={darkMode ? "rgba(99,102,241,0.2)" : "rgba(14,165,233,0.2)"} title="Accessibility" />
          <div style={sectionCard}>
            <SettingRow
              id="setting-elderlyMode"
              icon={<Eye size={14} />}
              label="Elderly Mode"
              desc="Larger text, higher contrast, hover-to-narrate on all cards"
              enabled={elderlyMode}
              onToggle={handleElderlyToggle}
            />
            <SettingRow
              id="setting-largeFont"
              icon={<Type size={14} />}
              label="Large Text"
              desc="Increase font size across the entire app interface"
              enabled={largeFont}
              onToggle={handleLargeFontToggle}
            />
          </div>

          {/* ── Interface ── */}
          <SectionHeader icon={darkMode ? <Moon size={14} color="#fbbf24" /> : <Sun size={14} color="#d97706" />} iconBg={darkMode ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.12)"} iconBorder={darkMode ? "rgba(245,158,11,0.2)" : "rgba(245,158,11,0.25)"} title="Interface" />
          <div style={sectionCard}>
            <SettingRow
              id="setting-darkMode"
              label={darkMode ? 'Dark Mode' : 'Light Mode'}
              desc={darkMode ? 'Currently using premium dark theme' : 'Currently using light theme — click to switch back to dark'}
              enabled={darkMode}
              onToggle={handleDarkModeToggle}
              badge={darkMode ? 'Active' : 'Light'}
            />
          </div>

          {/* ── Sound ── */}
          <SectionHeader icon={<Volume2 size={14} color={darkMode ? "#f472b6" : "#db2777"} />} iconBg={darkMode ? "rgba(244,114,182,0.1)" : "rgba(244,114,182,0.12)"} iconBorder={darkMode ? "rgba(244,114,182,0.2)" : "rgba(244,114,182,0.25)"} title="Sound & Narration" />
          <div style={sectionCard}>
            <SettingRow
              id="setting-soundAlerts"
              label="Sound Alerts & TTS"
              desc={
                !elderlyMode
                  ? '⚠️ Requires Elderly Mode to be active'
                  : soundAlerts
                  ? 'Audio narration and TTS alerts are active — Narrate button speaks content'
                  : 'All audio is muted — Narrate button is silenced'
              }
              enabled={soundAlerts}
              onToggle={handleSoundToggle}
              disabled={!elderlyMode}
            />
          </div>

          {/* ── Notifications ── */}
          <SectionHeader icon={<Bell size={14} color={darkMode ? "#34d399" : "#059669"} />} iconBg={darkMode ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.12)"} iconBorder={darkMode ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.25)"} title="Notifications" />
          <div style={sectionCard}>
            <SettingRow
              id="setting-pushNotifications"
              label="Push Notifications"
              desc={
                pushStatus === 'denied'
                  ? '🚫 Permission blocked in browser — open site settings to re-enable'
                  : pushNotifications
                  ? 'Browser notifications active — you\'ll get scan result alerts'
                  : 'Enable to receive browser alerts for dangerous health content'
              }
              enabled={pushNotifications}
              onToggle={handlePushToggle}
              disabled={pushStatus === 'denied'}
              badge={pushStatus === 'denied' ? 'Blocked' : pushStatus === 'granted' && pushNotifications ? 'Active' : undefined}
            />
          </div>

          {/* ── Privacy & Safety ── */}
          <SectionHeader icon={<Shield size={14} color={darkMode ? "#60a5fa" : "#2563eb"} />} iconBg={darkMode ? "rgba(96,165,250,0.1)" : "rgba(96,165,250,0.12)"} iconBorder={darkMode ? "rgba(96,165,250,0.2)" : "rgba(96,165,250,0.25)"} title="Privacy & Safety" />
          <div style={sectionCard}>
            <SettingRow
              id="setting-saveHistory"
              label="Save Scan History"
              desc={saveHistory ? 'Your scan results are saved locally for review' : 'Scans are analysed but not stored — privacy mode'}
              enabled={saveHistory}
              onToggle={handleSaveHistoryToggle}
            />
            <SettingRow
              id="setting-analyticsOptOut"
              label="Opt Out of Analytics"
              desc={analyticsOptOut ? 'Anonymous usage analytics are disabled' : 'Anonymous analytics help improve the app — no personal data'}
              enabled={analyticsOptOut}
              onToggle={handleAnalyticsToggle}
            />
          </div>

          {/* ── App Info ── */}
          <div style={{ margin: '0.75rem 0 0', padding: '0.875rem 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border-default)', borderRadius: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
              <Info size={13} color={darkMode ? 'var(--text-faint)' : '#64748b'} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>App Information</span>
            </div>
            {[
              ['Version', 'PresCrypto v1.0.0'],
              ['Build', 'Development'],
              ['Data Storage', 'Local — browser only'],
              ['AI Engine', 'Google Gemini (simulation)'],
              ['License', 'Free for personal use'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-faint)' }}>{k}</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="settings-close-btn-footer" onClick={onClose}>
            <Check size={14} /> Done
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, iconBg, iconBorder, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0.5rem 0.375rem' }}>
      <div style={{ width: 26, height: 26, borderRadius: '0.5rem', background: iconBg, border: `1px solid ${iconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{title}</span>
    </div>
  );
}

const sectionCard = {
  background: 'var(--bg-card)', border: '1px solid var(--border-default)',
  borderRadius: '0.875rem', overflow: 'hidden', marginBottom: '0.25rem',
};

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)',
  WebkitBackdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center',
  justifyContent: 'center', padding: '1rem', animation: 'overlayIn 0.2s ease both',
};

const modalStyle = {
  width: '100%', maxWidth: 460, maxHeight: '90vh', display: 'flex', flexDirection: 'column',
  background: 'var(--bg-card-deep)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid var(--border-strong)', borderRadius: '1.25rem',
  boxShadow: 'var(--shadow-dropdown)', animation: 'modalIn 0.25s cubic-bezier(0.16,1,0.3,1) both',
  overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif", position: 'relative',
};

const modalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  @keyframes overlayIn { from{opacity:0} to{opacity:1} }
  @keyframes modalIn { from{opacity:0;transform:scale(0.96) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(-8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
  
  .settings-row { transition: background 0.2s ease, border-color 0.2s ease; }
  .settings-row:first-child { border-top: none !important; }
  .settings-row:hover { background: var(--bg-hover) !important; }
  
  .settings-close-btn { background:none; border:none; cursor:pointer; padding:6px; border-radius:8px; color:var(--text-muted); display:flex; align-items:center; transition:all 0.2s ease; }
  .settings-close-btn:hover { background:var(--bg-hover); color:var(--text-primary); transform:scale(1.08) rotate(90deg); }
  
  .settings-close-btn-footer {
    display:inline-flex; align-items:center; gap:0.4rem; padding:0.5625rem 1.25rem;
    background:linear-gradient(135deg,#0ea5e9,#0284c7); border:none; border-radius:0.625rem;
    color:white; font-size:0.875rem; font-weight:600; cursor:pointer;
    transition:all 0.2s cubic-bezier(0.25,0.8,0.25,1); font-family:inherit;
    box-shadow:0 4px 12px rgba(14,165,233,0.3);
  }
  html:not(.light-mode) .settings-close-btn-footer {
    background:linear-gradient(135deg,#6366f1,#4338ca);
    box-shadow:0 4px 12px rgba(99,102,241,0.3);
  }
  .settings-close-btn-footer:hover {
    transform:translateY(-2px); box-shadow:0 6px 20px rgba(14,165,233,0.45);
  }
  html:not(.light-mode) .settings-close-btn-footer:hover {
    box-shadow:0 6px 20px rgba(99,102,241,0.45);
  }
  .settings-close-btn-footer:active { transform:translateY(0); }

  /* ─── Premium Custom Toggle Button Styles ─── */
  .custom-toggle {
    width: 44px; height: 24px; border-radius: 12px; border: none;
    cursor: pointer; position: relative; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    outline: none; display: inline-flex; align-items: center; justify-content: flex-start;
    padding: 0 3px; background: rgba(148, 163, 184, 0.3); box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
    flex-shrink: 0;
  }
  html.light-mode .custom-toggle { background: #cbd5e1; }
  
  .custom-toggle.enabled {
    background: linear-gradient(135deg, #0ea5e9, #0284c7);
    box-shadow: 0 0 12px rgba(14, 165, 233, 0.4);
  }
  html:not(.light-mode) .custom-toggle.enabled {
    background: linear-gradient(135deg, #6366f1, #4338ca);
    box-shadow: 0 0 12px rgba(99, 102, 241, 0.4);
  }
  .custom-toggle:hover:not(:disabled) { transform: scale(1.05); }
  .custom-toggle:active:not(:disabled) .toggle-knob { width: 23px; }
  .custom-toggle:disabled { cursor: not-allowed; opacity: 0.5; }
  
  .toggle-knob {
    width: 18px; height: 18px; border-radius: 50%; background: #ffffff;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform: translateX(0);
  }
  .custom-toggle.enabled .toggle-knob { transform: translateX(20px); }
  .custom-toggle.enabled:active:not(:disabled) .toggle-knob { transform: translateX(15px); }
`;
