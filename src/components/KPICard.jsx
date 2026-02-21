import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function KPICard({ icon: Icon, label, value, trend, trendLabel, accentColor, accentDim, sub }) {
  const trendDir = trend === 'up' ? 'up' : trend === 'down' ? 'down' : 'neutral';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div
      className="kpi-card animate-slide-up"
      style={{
        '--kpi-accent': accentColor || 'var(--cyan)',
        '--kpi-accent-dim': accentDim || 'var(--cyan-dim)',
      }}
    >
      <div className="kpi-top">
        <div className="kpi-icon-wrap">
          <Icon size={18} />
        </div>
        {trendLabel && (
          <span className={`kpi-trend ${trendDir}`}>
            <TrendIcon size={10} />
            {trendLabel}
          </span>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}
