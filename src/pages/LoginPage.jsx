import { useState } from 'react';
import { Layers, Eye, EyeOff, ArrowRight, UserPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';
export default function LoginPage() {
  const { login, register } = useApp();

  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState('');
  const [role, setRole] = useState('Dispatcher');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email.trim().toLowerCase(), password);
      } else {
        await register(email.trim().toLowerCase(), password, name.trim() || 'New User', role);
      }
      // Firebase will handle auth state update, which triggers navigation via protected routes
    } catch (err) {
      if (err.message.includes('email-already-in-use')) {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
      setLoading(false);
    }
  }

  async function quickLogin(userEmail, password) {
    setError('');
    setLoading(true);
    try {
      await login(userEmail, password);
    } catch (err) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg-grid" />
      <div className="login-bg-glow" />
      <div className="login-bg-glow-2" />

      <div className="login-card animate-slide-up">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <Layers size={20} color="#fff" />
          </div>
          <div className="login-logo-text">LogiCore</div>
        </div>

        <h1 className="login-heading">{isLogin ? 'Welcome back' : 'Create an account'}</h1>
        <p className="login-sub">Fleet & Logistics Command Center</p>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          {!isLogin && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Vikram Anand"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                >
                  <option value="Manager">Manager</option>
                  <option value="Dispatcher">Dispatcher</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@logicore.io"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus={isLogin}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Password</label>
              {isLogin && <span className="login-forgot">Forgot password?</span>}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute', right: 10, top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', background: 'none',
                  border: 'none', cursor: 'pointer', display: 'flex',
                }}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4, padding: '11px 16px', fontSize: '0.85rem' }}
          >
            {loading ? (
              <span style={{ opacity: 0.7 }}>Authenticating…</span>
            ) : (
              <>{isLogin ? 'Sign In' : 'Sign Up'} <ArrowRight size={14} /></>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>

        {/* Demo credentials */}
        {isLogin && (
          <div className="login-creds">
            <strong>Firebase Demo Credentials</strong><br />
            Manager: manager@logicore.io / manager123<br />
            Dispatcher: dispatcher@logicore.io / dispatch123<br />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => quickLogin('manager@logicore.io', 'manager123')}
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.68rem' }}
              >
                Login as Manager
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => quickLogin('dispatcher@logicore.io', 'dispatch123')}
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.68rem' }}
              >
                Login as Dispatcher
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
