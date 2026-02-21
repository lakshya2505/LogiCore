import { useMemo } from 'react';
import {
  Truck, AlertTriangle, Activity, Package,
  TrendingUp, Wrench, MapPin, Clock,
  ArrowUpRight, CheckCircle2, XCircle
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import { useApp } from '../context/AppContext';
import KPICard from '../components/KPICard';
import StatusPill from '../components/StatusPill';
import TopBar from '../components/TopBar';

const COLORS = {
  Available: '#16c784',
  'On Trip': '#4d8cff',
  'In Shop': '#f0a500',
  Retired: '#64748b',
  Suspended: '#ff4d6d',
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div style={{ color: 'var(--text-muted)', marginBottom: 6, fontSize: '0.7rem' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--cyan)', fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' && p.value > 999 ? `₹${(p.value / 1000).toFixed(0)}k` : p.value}
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { vehicles, drivers, trips, expenses, maintenanceLogs, computed, user, loading } = useApp();

  // Fleet status breakdown
  const fleetStatusData = useMemo(() => {
    const counts = {};
    vehicles.forEach(v => { counts[v.status] = (counts[v.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [vehicles]);

  // Monthly revenue (last 6 months using trip dates)
  const revenueData = useMemo(() => {
    const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
    const data = months.map(m => ({ month: m, revenue: 0, expense: 0 }));
    trips.filter(t => t.status === 'Completed').forEach(t => {
      const d = new Date(t.date);
      const mIdx = [8, 9, 10, 11, 12, 1].indexOf(d.getMonth() + 1);
      if (mIdx !== -1) data[mIdx].revenue += t.revenue || 0;
    });
    expenses.forEach(e => {
      const d = new Date(e.date);
      const mIdx = [8, 9, 10, 11, 12, 1].indexOf(d.getMonth() + 1);
      if (mIdx !== -1) data[mIdx].expense += e.cost || 0;
    });
    return data;
  }, [trips, expenses]);

  // Trip completion rate
  const completedTrips = trips.filter(t => t.status === 'Completed').length;
  const totalSettled = trips.filter(t => ['Completed', 'Cancelled'].includes(t.status)).length;
  const completionRate = totalSettled > 0 ? Math.round((completedTrips / totalSettled) * 100) : 0;

  // Recent activity
  const recentActivity = useMemo(() => {
    const events = [
      ...trips.filter(t => t.status === 'Dispatched').map(t => ({
        type: 'dispatch',
        text: `Trip dispatched: ${t.origin} → ${t.destination}`,
        color: 'var(--cyan)',
        time: t.date,
      })),
      ...trips.filter(t => t.status === 'Completed').slice(0, 3).map(t => ({
        type: 'complete',
        text: `Trip completed: ${t.origin} → ${t.destination}`,
        color: 'var(--green)',
        time: t.date,
      })),
      ...maintenanceLogs.filter(m => !m.completed).map(m => {
        const v = vehicles.find(v => v.id === m.vehicleId);
        return {
          type: 'maintenance',
          text: `${v?.name || 'Vehicle'} sent to shop — ${m.type}`,
          color: 'var(--amber)',
          time: m.date,
        };
      }),
    ];
    return events.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);
  }, [trips, maintenanceLogs, vehicles]);

  // Alerts
  const expiringLicenses = drivers.filter(d => {
    const days = Math.ceil((new Date(d.expiry) - new Date()) / 86400000);
    return days <= 60 && days >= 0;
  });
  const expiredLicenses = drivers.filter(d => new Date(d.expiry) < new Date());
  const inShopVehicles = vehicles.filter(v => v.status === 'In Shop');

  return (
    <>
      <TopBar
        title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${user?.name?.split(' ')[0]}`}
        subtitle="Fleet operations overview"
      />

      <div className="page-body animate-fade-in">
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: 'var(--text-muted)' }}>
            <div>Loading your fleet data...</div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="kpi-grid">
              <KPICard
                icon={Truck}
                label="Active Fleet"
                value={computed.activeFleet}
                sub={`${vehicles.length} total vehicles`}
                trend="up"
                trendLabel={`${computed.utilizationRate}% util`}
                accentColor="var(--cyan)"
                accentDim="var(--cyan-dim)"
              />
              <KPICard
                icon={Wrench}
                label="In Maintenance"
                value={computed.maintenanceAlerts}
                sub="vehicles in shop"
                trend={computed.maintenanceAlerts > 2 ? 'down' : 'neutral'}
                trendLabel={computed.maintenanceAlerts > 2 ? 'High load' : 'Normal'}
                accentColor="var(--amber)"
                accentDim="var(--amber-dim)"
              />
              <KPICard
                icon={Activity}
                label="Utilization Rate"
                value={`${computed.utilizationRate}%`}
                sub="of active fleet on trips"
                trend={computed.utilizationRate >= 60 ? 'up' : 'neutral'}
                trendLabel={computed.utilizationRate >= 60 ? 'Healthy' : 'Low'}
                accentColor="var(--green)"
                accentDim="var(--green-dim)"
              />
              <KPICard
                icon={Package}
                label="Pending Cargo"
                value={computed.pendingCargo}
                sub="trips awaiting dispatch"
                trend={computed.pendingCargo > 3 ? 'down' : 'up'}
                trendLabel={computed.pendingCargo > 3 ? 'Backlogged' : 'Clear'}
                accentColor="var(--purple)"
                accentDim="rgba(167,139,250,0.12)"
              />
            </div>

            {/* Main grid */}
            <div className="dash-grid">
              {/* Left column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Revenue chart */}
                <div className="card">
                  <div className="card-header">
                    <div>
                      <div className="card-title">Revenue vs Expenses</div>
                      <div className="card-subtitle">Last 6 months · ₹ in thousands</div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--cyan)' }}>■ Revenue</span>
                      <span style={{ color: 'var(--amber)' }}>■ Expenses</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={revenueData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar dataKey="revenue" name="Revenue" fill="var(--cyan)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                      <Bar dataKey="expense" name="Expenses" fill="var(--amber)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Fleet Status Breakdown */}
                <div className="card">
                  <div className="card-header">
                    <div>
                      <div className="card-title">Fleet Status Breakdown</div>
                      <div className="card-subtitle">{vehicles.length} vehicles total</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie
                          data={fleetStatusData}
                          cx="50%" cy="50%"
                          innerRadius={48}
                          outerRadius={72}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {fleetStatusData.map((entry, i) => (
                            <Cell key={i} fill={COLORS[entry.name] || '#666'} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="fleet-status-bars" style={{ flex: 1 }}>
                      {fleetStatusData.map(({ name, value }) => (
                        <div className="status-bar-row" key={name}>
                          <span className="status-bar-label">{name}</span>
                          <div className="status-bar-track">
                            <div
                              className="status-bar-fill"
                              style={{
                                width: `${Math.round((value / vehicles.length) * 100)}%`,
                                background: COLORS[name] || '#666',
                              }}
                            />
                          </div>
                          <span className="status-bar-count">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Trips */}
                <div className="card">
                  <div className="card-header">
                    <div>
                      <div className="card-title">Recent Trips</div>
                      <div className="card-subtitle">Latest dispatch activity</div>
                    </div>
                    <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {completionRate}% completion rate
                    </span>
                  </div>
                  <div>
                    {trips.slice(0, 5).map(t => {
                      const driver = { d1: 'Arjun S.', d2: 'Priya N.', d3: 'Rahul S.', d4: 'Sunita V.', d5: 'Karan M.', d6: 'Divya R.' }[t.driverId] || '—';
                      return (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', background: 'var(--bg-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {t.status === 'Completed' ? <CheckCircle2 size={14} color="var(--green)" /> :
                              t.status === 'Cancelled' ? <XCircle size={14} color="var(--red)" /> :
                                t.status === 'Dispatched' ? <ArrowUpRight size={14} color="var(--cyan)" /> :
                                  <Clock size={14} color="var(--amber)" />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center' }}>
                              {t.origin} <ArrowUpRight size={10} style={{ opacity: 0.4 }} /> {t.destination}
                            </div>
                            <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                              {driver} · {t.cargoType}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                            <StatusPill status={t.status} />
                            {t.revenue > 0 && <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>₹{t.revenue.toLocaleString()}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Alerts */}
                <div className="card">
                  <div className="card-header">
                    <div>
                      <div className="card-title">Active Alerts</div>
                      <div className="card-subtitle">Requires attention</div>
                    </div>
                    <span style={{
                      background: 'var(--red-dim)', color: 'var(--red)',
                      fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
                      padding: '2px 7px', borderRadius: '99px',
                    }}>
                      {expiredLicenses.length + inShopVehicles.length + expiringLicenses.length}
                    </span>
                  </div>
                  <div>
                    {inShopVehicles.map(v => (
                      <div key={v.id} className="alert-item">
                        <div className="alert-icon warn"><Wrench size={13} /></div>
                        <div className="alert-text">
                          <strong>{v.name}</strong>
                          Vehicle in maintenance · {v.plate}
                        </div>
                      </div>
                    ))}
                    {expiredLicenses.map(d => (
                      <div key={d.id} className="alert-item">
                        <div className="alert-icon danger"><AlertTriangle size={13} /></div>
                        <div className="alert-text">
                          <strong>{d.name}</strong>
                          License expired — cannot be dispatched
                        </div>
                      </div>
                    ))}
                    {expiringLicenses.map(d => {
                      const days = Math.ceil((new Date(d.expiry) - new Date()) / 86400000);
                      return (
                        <div key={d.id} className="alert-item">
                          <div className="alert-icon warn"><AlertTriangle size={13} /></div>
                          <div className="alert-text">
                            <strong>{d.name}</strong>
                            License expiring in {days} days
                          </div>
                        </div>
                      );
                    })}
                    {expiredLicenses.length === 0 && expiringLicenses.length === 0 && inShopVehicles.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                        ✓ No active alerts
                      </div>
                    )}
                  </div>
                </div>

                {/* Driver Performance */}
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Driver Performance</div>
                  </div>
                  <div>
                    {[...useApp().drivers]
                      .sort((a, b) => b.safetyScore - a.safetyScore)
                      .slice(0, 5)
                      .map((d, i) => (
                        <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%',
                            background: i === 0 ? 'var(--amber-dim)' : 'var(--bg-raised)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
                            color: i === 0 ? 'var(--amber)' : 'var(--text-muted)',
                            fontWeight: 700, flexShrink: 0,
                          }}>
                            {i + 1}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{d.name}</div>
                            <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{d.trips} trips · {d.category}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 50, height: 4, background: 'var(--bg-raised)', borderRadius: '99px', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', borderRadius: '99px',
                                width: `${d.safetyScore}%`,
                                background: d.safetyScore >= 85 ? 'var(--green)' : d.safetyScore >= 70 ? 'var(--amber)' : 'var(--red)',
                              }} />
                            </div>
                            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: d.safetyScore >= 85 ? 'var(--green)' : d.safetyScore >= 70 ? 'var(--amber)' : 'var(--red)', fontWeight: 600, minWidth: 24 }}>
                              {d.safetyScore}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Activity Feed */}
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Activity Feed</div>
                  </div>
                  <div className="activity-feed">
                    {recentActivity.map((a, i) => (
                      <div key={i} className="activity-item">
                        <div className="activity-dot" style={{ background: a.color }} />
                        <div>
                          <div className="activity-text">{a.text}</div>
                          <div className="activity-time">{a.time}</div>
                        </div>
                      </div>
                    ))}
                    {recentActivity.length === 0 && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: 20 }}>
                        No recent activity
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial summary */}
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Financial Summary</div>
                    <div className="card-subtitle" style={{ color: 'var(--text-muted)' }}>All time</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: 'Total Revenue', value: computed.totalRevenue, color: 'var(--green)' },
                      { label: 'Total Expenses', value: computed.totalExpenses, color: 'var(--red)' },
                      { label: 'Net P&L', value: computed.totalRevenue - computed.totalExpenses, color: computed.totalRevenue > computed.totalExpenses ? 'var(--green)' : 'var(--red)' },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{row.label}</span>
                        <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: row.color }}>
                          ₹{Math.abs(row.value).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
