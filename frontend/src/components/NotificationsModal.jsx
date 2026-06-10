import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { X, Bell, AlertTriangle, Info, CheckCircle, Trash2, CheckCheck } from 'lucide-react';

const INITIAL_NOTIFICATIONS = [
  {
    id: 1, type: 'alert', read: false,
    title: 'High-Risk WhatsApp Message Detected',
    body: 'A message claiming "Lemon juice cures cancer" was flagged as False & Dangerous (99.5% confidence).',
    time: '2 min ago', icon: '🚨',
  },
  {
    id: 2, type: 'info', read: false,
    title: 'Lab Report Analysis Complete',
    body: 'Your recent blood report was analysed. HbA1c and Fasting Blood Sugar markers are within normal range.',
    time: '1 hr ago', icon: '🧪',
  },
  {
    id: 3, type: 'success', read: false,
    title: 'Prescription Decoded Successfully',
    body: 'Paracetamol 500mg prescription decoded. No dangerous drug interactions were detected.',
    time: '3 hr ago', icon: '💊',
  },
  {
    id: 4, type: 'warning', read: true,
    title: 'Potential Drug Interaction Warning',
    body: 'Atorvastatin + high-dose Paracetamol may increase hepatotoxicity risk. Consult your doctor.',
    time: 'Yesterday', icon: '⚠️',
  },
  {
    id: 5, type: 'info', read: true,
    title: 'New Learning Module Available',
    body: '"How to Spot Medical Misinformation" — a new module is now live in your Learning Hub.',
    time: '2 days ago', icon: '📚',
  },
  {
    id: 6, type: 'success', read: true,
    title: 'Profile Updated',
    body: 'Your preferred language was changed to English successfully.',
    time: '3 days ago', icon: '✅',
  },
];

const typeStyles = {
  alert:   { border: 'rgba(239,68,68,0.25)',  bg: 'rgba(239,68,68,0.05)',  dot: '#ef4444' },
  warning: { border: 'rgba(245,158,11,0.25)', bg: 'rgba(245,158,11,0.05)', dot: '#f59e0b' },
  info:    { border: 'rgba(99,102,241,0.2)',  bg: 'rgba(99,102,241,0.04)', dot: '#818cf8' },
  success: { border: 'rgba(16,185,129,0.2)',  bg: 'rgba(16,185,129,0.04)', dot: '#34d399' },
};

export default function NotificationsModal({ onClose }) {
  const { darkMode } = useSelector(state => state.settings || { darkMode: true });
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(notifications.map(n => ({ ...n, read: true })));
  const markRead = (id) => setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  const dismiss = (id) => setNotifications(notifications.filter(n => n.id !== id));
  const clearAll = () => setNotifications([]);

  const visible = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        <style>{modalCSS}</style>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '0.625rem', background: darkMode ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.12)', border: darkMode ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <Bell size={16} color={darkMode ? '#fbbf24' : '#d97706'} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', color: 'white', fontSize: '0.5625rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>Notifications</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {notifications.length > 0 && (
              <button className="modal-close-btn" onClick={clearAll} title="Clear all" style={{ fontSize: '0.75rem', gap: '0.25rem', display: 'flex', alignItems: 'center', color: '#ef4444' }}>
                <Trash2 size={14} />
              </button>
            )}
            {unreadCount > 0 && (
              <button className="modal-close-btn" onClick={markAllRead} title="Mark all read" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', color: '#34d399' }}>
                <CheckCheck size={16} />
              </button>
            )}
            <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border-default)' }}>
          {['all', 'unread'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.3125rem 0.875rem',
                borderRadius: '2rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 600,
                fontFamily: 'inherit',
                transition: 'all 0.15s',
                background: filter === f ? 'var(--bg-icon)' : 'transparent',
                color: filter === f ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              {f === 'all' ? `All (${notifications.length})` : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>

        {/* Notifications list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
          {visible.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-faint)' }}>
              <Bell size={36} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.3 }} />
              <p style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>All caught up!</p>
              <p style={{ fontSize: '0.8125rem' }}>No {filter === 'unread' ? 'unread ' : ''}notifications.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {visible.map(notif => {
                const ts = typeStyles[notif.type] || typeStyles.info;
                return (
                  <div
                    key={notif.id}
                    onClick={() => markRead(notif.id)}
                    style={{
                      padding: '0.875rem 1rem',
                      background: notif.read ? 'var(--bg-hover)' : ts.bg,
                      border: `1px solid ${notif.read ? 'var(--border-default)' : ts.border}`,
                      borderRadius: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      position: 'relative',
                    }}
                    className="notif-row"
                  >
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.25rem', flexShrink: 0, lineHeight: 1 }}>{notif.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          {!notif.read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: ts.dot, display: 'inline-block', flexShrink: 0 }} />}
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.3 }}>{notif.title}</span>
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{notif.body}</p>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-faint)', marginTop: '0.375rem', display: 'block', fontWeight: 500 }}>{notif.time}</span>
                      </div>
                      <button
                        className="modal-close-btn"
                        onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }}
                        style={{ flexShrink: 0, padding: 4 }}
                        title="Dismiss"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="modal-btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center',
  justifyContent: 'center', padding: '1rem', animation: 'overlayIn 0.2s ease both',
};

const modalStyle = {
  width: '100%', maxWidth: 480, maxHeight: '85vh', display: 'flex', flexDirection: 'column',
  background: 'var(--bg-card-deep)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid var(--border-strong)', borderRadius: '1.25rem',
  boxShadow: 'var(--shadow-dropdown)', animation: 'modalIn 0.25s cubic-bezier(0.16,1,0.3,1) both',
  overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif",
};

const modalCSS = `
  @keyframes overlayIn { from{opacity:0} to{opacity:1} }
  @keyframes modalIn { from{opacity:0;transform:scale(0.96) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
  
  .modal-close-btn { background:none; border:none; cursor:pointer; padding:6px; border-radius:8px; color:var(--text-muted); display:flex; align-items:center; transition:all 0.2s ease; }
  .modal-close-btn:hover { background:var(--bg-hover); color:var(--text-primary); transform:scale(1.08) rotate(90deg); }
  
  .notif-row:hover { background: var(--bg-hover) !important; }
  
  .modal-btn-ghost { display:inline-flex; align-items:center; gap:0.4rem; padding:0.5625rem 1.125rem; background:var(--bg-hover); border:1px solid var(--border-subtle); border-radius:0.625rem; color:var(--text-secondary); font-size:0.875rem; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:inherit; }
  .modal-btn-ghost:hover { background:var(--bg-icon); color:var(--text-primary); }
`;
