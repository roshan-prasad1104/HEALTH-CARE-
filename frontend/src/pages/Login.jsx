import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { loginSuccess } from '../store/authSlice';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server error — ensure backend is running on port 5000');
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || 'Login failed');

      dispatch(loginSuccess({ token: data.token, user: data.user }));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, rgba(3, 7, 18, 0.75) 0%, rgba(3, 7, 18, 0.85) 100%), url(/background.png)', backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'top center', backgroundRepeat: 'no-repeat', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative', overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Animated background orbs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', maxWidth: 600, maxHeight: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', animation: 'floatOrb1 8s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-10%', width: '40vw', height: '40vw', maxWidth: 500, maxHeight: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', animation: 'floatOrb2 10s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '40%', right: '20%', width: '20vw', height: '20vw', maxWidth: 250, maxHeight: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,63,94,0.08) 0%, transparent 70%)', animation: 'floatOrb1 12s ease-in-out infinite reverse' }} />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        @keyframes floatOrb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-20px) scale(1.05)} }
        @keyframes floatOrb2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,30px) scale(1.08)} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .auth-card { animation: fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .auth-input { width:100%; padding:0.875rem 1rem; background:rgba(15,23,42,0.6); border:1.5px solid rgba(255,255,255,0.08); border-radius:0.75rem; color:#f1f5f9; font-size:0.9375rem; transition:all 0.2s ease; outline:none; box-sizing:border-box; font-family:inherit; }
        .auth-input::placeholder { color:#475569; }
        .auth-input:focus { border-color:rgba(99,102,241,0.6); box-shadow:0 0 0 3px rgba(99,102,241,0.12), 0 0 20px rgba(99,102,241,0.08); background:rgba(15,23,42,0.8); }
        .auth-btn { width:100%; padding:0.9375rem; background:linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%); border:none; border-radius:0.75rem; color:white; font-size:1rem; font-weight:600; cursor:pointer; transition:all 0.25s ease; letter-spacing:0.01em; position:relative; overflow:hidden; font-family:inherit; }
        .auth-btn::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%); opacity:0; transition:opacity 0.25s ease; }
        .auth-btn:hover:not(:disabled)::before { opacity:1; }
        .auth-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 30px rgba(99,102,241,0.4); }
        .auth-btn:active:not(:disabled) { transform:translateY(0); }
        .auth-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .feature-chip { display:flex; align-items:center; gap:0.5rem; padding:0.5rem 1rem; background:rgba(15,23,42,0.5); border:1px solid rgba(255,255,255,0.06); border-radius:2rem; font-size:0.75rem; color:#94a3b8; }
        .eye-btn { position:absolute; right:0.875rem; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#94a3b8; transition:color 0.2s; padding:4px; display:flex; }
        .eye-btn:hover { color:#94a3b8; }
        .spinner { width:20px; height:20px; border:2.5px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:spin 0.7s linear infinite; display:inline-block; }
        .link-text { color:#818cf8; text-decoration:none; font-weight:600; transition:color 0.2s; }
        .link-text:hover { color:#a5b4fc; }
        .divider { display:flex; align-items:center; gap:1rem; margin:1.25rem 0; }
        .divider::before,.divider::after { content:''; flex:1; height:1px; background:rgba(255,255,255,0.06); }
        .error-box { padding:0.875rem 1rem; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); border-radius:0.75rem; color:#fca5a5; font-size:0.875rem; display:flex; align-items:flex-start; gap:0.5rem; }
      `}</style>

      <div className="auth-card" style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)', borderRadius: '1.25rem', marginBottom: '1.25rem', boxShadow: '0 8px 32px rgba(14, 165, 233, 0.35)', position: 'relative' }}>
            <Shield size={32} color="white" strokeWidth={2.5} />
            <div style={{ position: 'absolute', inset: -1, borderRadius: '1.3rem', border: '1px solid rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 0.375rem', background: 'linear-gradient(135deg, #e2e8f0 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            PresCrypto
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '0.875rem', margin: 0, fontWeight: 500 }}>AI-Powered Healthcare Intelligence</p>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.05) inset' }}>

          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 1.5rem', letterSpacing: '-0.02em' }}>
            Welcome back 👋
          </h2>

          {/* Error */}
          {error && (
            <div className="error-box" style={{ marginBottom: '1.25rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '0.02em' }}>
                EMAIL ADDRESS
              </label>
              <input
                id="login-email"
                type="email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '0.02em' }}>
                PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '3rem' }}
                />
                <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
              <Link to="/forgot-password" className="link-text" style={{ fontSize: '0.8125rem' }}>
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button type="submit" id="login-submit-btn" className="auth-btn" disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem' }}>
                  <span className="spinner" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="divider">
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>or</span>
          </div>

          <p style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '0.875rem', margin: 0 }}>
            Don't have an account?{' '}
            <Link to="/signup" className="link-text">Create one free</Link>
          </p>
        </div>

        {/* Feature chips */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.625rem', marginTop: '1.75rem', flexWrap: 'wrap' }}>
          <div className="feature-chip">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            End-to-end encrypted
          </div>
          <div className="feature-chip">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            HIPAA Structured
          </div>
          <div className="feature-chip">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            AI-Powered
          </div>
        </div>
      </div>
    </div>
  );
}
