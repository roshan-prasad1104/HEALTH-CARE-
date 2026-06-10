import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginSuccess } from '../store/authSlice';

const roles = [
  { value: 'USER', label: 'Patient / General User', icon: '👤' },
  { value: 'HEALTH_PROFESSIONAL', label: 'Healthcare Professional', icon: '🩺' },
];

export default function Signup() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = info, 2 = password
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const passwordStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strengthInfo = [
    { label: 'Too short', color: '#ef4444' },
    { label: 'Weak', color: '#f97316' },
    { label: 'Fair', color: '#eab308' },
    { label: 'Good', color: '#84cc16' },
    { label: 'Strong', color: '#22c55e' },
  ];

  const pwdScore = passwordStrength(formData.password);
  const strengthData = formData.password.length > 0 ? strengthInfo[pwdScore] : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server error — ensure backend is running on port 5000');
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || 'Signup failed');

      dispatch(loginSuccess({ token: data.token, user: data.user }));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative', overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Background orbs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-5%', right: '-10%', width: '50vw', height: '50vw', maxWidth: 600, maxHeight: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', animation: 'floatOrb1 9s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-8%', width: '45vw', height: '45vw', maxWidth: 550, maxHeight: 550, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)', animation: 'floatOrb2 11s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '30%', left: '15%', width: '20vw', height: '20vw', maxWidth: 280, maxHeight: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)', animation: 'floatOrb1 14s ease-in-out infinite reverse' }} />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        @keyframes floatOrb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-20px) scale(1.05)} }
        @keyframes floatOrb2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,30px) scale(1.08)} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .auth-card-su { animation: fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .auth-input-su { width:100%; padding:0.875rem 1rem; background:rgba(15,23,42,0.6); border:1.5px solid rgba(255,255,255,0.08); border-radius:0.75rem; color:#f1f5f9; font-size:0.9375rem; transition:all 0.2s ease; outline:none; box-sizing:border-box; font-family:inherit; }
        .auth-input-su::placeholder { color:#475569; }
        .auth-input-su:focus { border-color:rgba(99,102,241,0.6); box-shadow:0 0 0 3px rgba(99,102,241,0.12), 0 0 20px rgba(99,102,241,0.08); background:rgba(15,23,42,0.85); }
        .auth-btn-su { width:100%; padding:0.9375rem; background:linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%); border:none; border-radius:0.75rem; color:white; font-size:1rem; font-weight:600; cursor:pointer; transition:all 0.25s ease; letter-spacing:0.01em; position:relative; overflow:hidden; font-family:inherit; }
        .auth-btn-su::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%); opacity:0; transition:opacity 0.25s ease; }
        .auth-btn-su:hover:not(:disabled)::before { opacity:1; }
        .auth-btn-su:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 30px rgba(99,102,241,0.4); }
        .auth-btn-su:active:not(:disabled) { transform:translateY(0); }
        .auth-btn-su:disabled { opacity:0.6; cursor:not-allowed; }
        .role-card { padding:0.875rem 1rem; background:rgba(15,23,42,0.5); border:1.5px solid rgba(255,255,255,0.07); border-radius:0.875rem; cursor:pointer; transition:all 0.2s ease; display:flex; align-items:center; gap:0.875rem; }
        .role-card:hover { border-color:rgba(99,102,241,0.35); background:rgba(15,23,42,0.7); }
        .role-card.selected { border-color:rgba(99,102,241,0.7); background:rgba(99,102,241,0.1); box-shadow:0 0 0 1px rgba(99,102,241,0.3); }
        .eye-btn-su { position:absolute; right:0.875rem; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#94a3b8; transition:color 0.2s; padding:4px; display:flex; }
        .eye-btn-su:hover { color:#94a3b8; }
        .spinner-su { width:20px; height:20px; border:2.5px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:spin 0.7s linear infinite; display:inline-block; }
        .link-su { color:#818cf8; text-decoration:none; font-weight:600; transition:color 0.2s; }
        .link-su:hover { color:#a5b4fc; }
        .error-su { padding:0.875rem 1rem; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); border-radius:0.75rem; color:#fca5a5; font-size:0.875rem; display:flex; align-items:flex-start; gap:0.5rem; margin-bottom:1.25rem; }
        .str-bar { height:3px; border-radius:2px; flex:1; transition:all 0.3s ease; }
      `}</style>

      <div className="auth-card-su" style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 60, height: 60, background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', borderRadius: '1.25rem', marginBottom: '1.125rem', boxShadow: '0 8px 32px rgba(99,102,241,0.35)', position: 'relative' }}>
            <span style={{ color: 'white', fontSize: '1.4rem', fontWeight: 800 }}>Rx</span>
            <div style={{ position: 'absolute', inset: -1, borderRadius: '1.3rem', border: '1px solid rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 0.3rem', background: 'linear-gradient(135deg, #e2e8f0 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Join PresCrypto
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '0.875rem', margin: 0, fontWeight: 500 }}>
            Your AI-powered healthcare companion
          </p>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 1.5rem', letterSpacing: '-0.02em' }}>
            Create your account ✨
          </h2>

          {error && (
            <div className="error-su">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Role selection */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.625rem', letterSpacing: '0.02em' }}>
                I AM A...
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                {roles.map((r) => (
                  <div
                    key={r.value}
                    className={`role-card${formData.role === r.value ? ' selected' : ''}`}
                    onClick={() => setFormData({ ...formData, role: r.value })}
                  >
                    <span style={{ fontSize: '1.25rem' }}>{r.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: formData.role === r.value ? '#a5b4fc' : '#cbd5e1' }}>
                        {r.label.split(' / ')[0]}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#cbd5e1', marginTop: '0.125rem' }}>
                        {r.label.split(' / ')[1] || (r.value === 'USER' ? 'Personal use' : 'Clinic / Hospital')}
                      </div>
                    </div>
                    {formData.role === r.value && (
                      <div style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '0.02em' }}>
                  FIRST NAME
                </label>
                <input
                  id="signup-firstname"
                  type="text"
                  name="firstName"
                  className="auth-input-su"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Roshan"
                  required
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '0.02em' }}>
                  LAST NAME
                </label>
                <input
                  id="signup-lastname"
                  type="text"
                  name="lastName"
                  className="auth-input-su"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Prasad"
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '0.02em' }}>
                EMAIL ADDRESS
              </label>
              <input
                id="signup-email"
                type="email"
                name="email"
                className="auth-input-su"
                value={formData.email}
                onChange={handleChange}
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
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="auth-input-su"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  required
                  autoComplete="new-password"
                  style={{ paddingRight: '3rem' }}
                />
                <button type="button" className="eye-btn-su" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              {/* Strength meter */}
              {formData.password.length > 0 && (
                <div style={{ marginTop: '0.625rem' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '0.375rem' }}>
                    {[0,1,2,3].map(i => (
                      <div key={i} className="str-bar" style={{ background: i < pwdScore ? strengthData.color : 'rgba(255,255,255,0.07)' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: strengthData.color, fontWeight: 500 }}>
                    {strengthData.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '0.02em' }}>
                CONFIRM PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="signup-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  className="auth-input-su"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  style={{ paddingRight: '3rem', borderColor: formData.confirmPassword && formData.confirmPassword !== formData.password ? 'rgba(239,68,68,0.5)' : undefined }}
                />
                <button type="button" className="eye-btn-su" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              {formData.confirmPassword && formData.confirmPassword !== formData.password && (
                <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  Passwords don't match
                </p>
              )}
            </div>

            {/* Terms note */}
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              By creating an account you agree to our{' '}
              <a href="#terms" style={{ color: '#818cf8', textDecoration: 'none' }}>Terms of Service</a>{' '}
              and{' '}
              <a href="#privacy" style={{ color: '#818cf8', textDecoration: 'none' }}>Privacy Policy</a>.
            </p>

            {/* Submit */}
            <button type="submit" id="signup-submit-btn" className="auth-btn-su" disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem' }}>
                  <span className="spinner-su" />
                  Creating account...
                </span>
              ) : 'Create Free Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '0.875rem', margin: '1.25rem 0 0' }}>
            Already have an account?{' '}
            <Link to="/login" className="link-su">Sign in</Link>
          </p>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.625rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { icon: '🔒', text: 'Zero data selling' },
            { icon: '🏥', text: 'Clinically reviewed' },
            { icon: '⚡', text: 'Always free tier' },
          ].map((b) => (
            <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.875rem', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '2rem', fontSize: '0.75rem', color: '#94a3b8' }}>
              <span style={{ fontSize: '0.875rem' }}>{b.icon}</span>
              {b.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
