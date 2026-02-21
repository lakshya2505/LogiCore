import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, CheckCircle2, AlertTriangle, Loader } from 'lucide-react';
import { initializeFirestoreWithDemoData } from '../services/firebaseInit';

export default function SetupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInitialize = async () => {
    setLoading(true);
    setError('');
    try {
      await initializeFirestoreWithDemoData();
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.message || 'Initialization failed');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-grid" />
      <div className="login-bg-glow" />
      <div className="login-bg-glow-2" />

      <div className="login-card animate-slide-up">
        <div className="login-logo">
          <div className="login-logo-icon">
            <Layers size={20} color="#fff" />
          </div>
          <div className="login-logo-text">LogiCore</div>
        </div>

        <h1 className="login-heading">Firebase Setup</h1>
        <p className="login-sub">Initialize demo data and create demo users</p>

        <div style={{ padding: '20px', background: 'var(--bg-input)', borderRadius: 'var(--r)', marginBottom: 20 }}>
          {success ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--green)' }}>
              <CheckCircle2 size={20} />
              <div>
                <div style={{ fontWeight: 600 }}>Setup Complete!</div>
                <div style={{ fontSize: '0.8rem', marginTop: 4 }}>Redirecting to login...</div>
              </div>
            </div>
          ) : error ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, color: 'var(--red)' }}>
              <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600 }}>Setup Failed</div>
                <div style={{ fontSize: '0.8rem', marginTop: 4 }}>{error}</div>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
              <p>This will:</p>
              <ul style={{ marginLeft: 16, marginTop: 8 }}>
                <li>✅ Create demo user accounts in Firebase Auth</li>
                <li>✅ Seed Firestore with demo vehicles, drivers, trips, etc.</li>
                <li>✅ Initialize all collections and demo data</li>
              </ul>
              <p style={{ marginTop: 12, fontStyle: 'italic', color: 'var(--text-muted)' }}>
                Only run this once. Check browser console for detailed logs.
              </p>
            </div>
          )}
        </div>

        {!success && !error && (
          <button
            className="btn btn-primary"
            onClick={handleInitialize}
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', gap: 8 }}
          >
            {loading ? (
              <>
                <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Initializing...
              </>
            ) : (
              'Initialize Firebase'
            )}
          </button>
        )}

        {success || error ? (
          <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ width: '100%', marginTop: 12 }}>
            Back to Login
          </button>
        ) : (
          <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ width: '100%', marginTop: 12 }}>
            Cancel
          </button>
        )}

        <div style={{ marginTop: 20, padding: '12px', background: 'var(--bg-raised)', borderRadius: 'var(--r-sm)', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <strong>Demo Accounts (after setup):</strong>
          <div style={{ marginTop: 6 }}>
            📧 manager@logicore.io<br/>
            🔑 manager123
          </div>
          <div style={{ marginTop: 6 }}>
            📧 dispatcher@logicore.io<br/>
            🔑 dispatch123
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
