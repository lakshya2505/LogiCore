import { useState } from 'react';
import { Search, Bell, Settings, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function TopBar({ title, subtitle }) {
  const { user, trips, vehicles } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);

  const alerts = [
    ...vehicles.filter(v => v.status === 'In Shop').map(v => ({
      type: 'warn',
      title: v.name,
      text: 'Vehicle is currently in maintenance',
    })),
    ...trips.filter(t => t.status === 'Draft').map(t => ({
      type: 'info',
      title: `Trip ${t.id.toUpperCase()}`,
      text: `${t.origin} → ${t.destination} awaiting dispatch`,
    })),
  ].slice(0, 5);

  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        {subtitle && <div className="topbar-breadcrumb">{subtitle}</div>}
      </div>

      <div className="topbar-search">
        <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input type="text" placeholder="Quick search..." />
      </div>

      <div className="topbar-actions">
        <div style={{ position: 'relative' }}>
          <button
            className="topbar-icon-btn"
            onClick={() => setShowNotifs(s => !s)}
            title="Alerts"
          >
            <Bell size={15} />
            {alerts.length > 0 && <span className="notif-dot" />}
          </button>

          {showNotifs && alerts.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 40, right: 0,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-md)',
              borderRadius: 'var(--r)',
              boxShadow: 'var(--shadow-lg)',
              width: 280,
              zIndex: 200,
              overflow: 'hidden',
              animation: 'slideUp 0.15s var(--ease)',
            }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Alerts ({alerts.length})
              </div>
              {alerts.map((a, i) => (
                <div key={i} style={{ padding: '10px 14px', borderBottom: i < alerts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 600 }}>{a.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>{a.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="topbar-avatar" title={user?.name}>
          {user?.avatar || user?.name?.slice(0, 2) || '?'}
        </div>
      </div>
    </header>
  );
}
