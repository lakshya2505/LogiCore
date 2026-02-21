import { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, Radar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { Download, FileText, TrendingUp, TrendingDown, BarChart3, RefreshCw } from 'lucide-react';
import Papa from 'papaparse';
import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div style={{ color: 'var(--text-muted)', marginBottom: 6, fontSize: '0.7rem' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--cyan)', fontWeight: 600, fontSize: '0.75rem' }}>
          {p.name}: {typeof p.value === 'number' && Math.abs(p.value) > 999
            ? `₹${(p.value / 1000).toFixed(1)}k`
            : p.value}
        </div>
      ))}
    </div>
  );
}

const DATE_RANGES = ['Last 30 days', 'Last 90 days', 'Last 6 months', 'All time'];

function filterByDateRange(items, dateKey, range) {
  if (range === 'All time') return items;
  const now = new Date();
  const days = range === 'Last 30 days' ? 30 : range === 'Last 90 days' ? 90 : 180;
  const cutoff = new Date(now.setDate(now.getDate() - days));
  return items.filter(item => new Date(item[dateKey]) >= cutoff);
}

export default function AnalyticsPage() {
  const { vehicles, drivers, trips, expenses, maintenanceLogs } = useApp();
  const [dateRange, setDateRange] = useState('All time');

  const filteredTrips    = useMemo(() => filterByDateRange(trips,    'date', dateRange), [trips, dateRange]);
  const filteredExpenses = useMemo(() => filterByDateRange(expenses, 'date', dateRange), [expenses, dateRange]);
  const filteredMaint    = useMemo(() => filterByDateRange(maintenanceLogs, 'date', dateRange), [maintenanceLogs, dateRange]);

  // ── Vehicle ROI ──────────────────────────────────────────────────────────────
  const roiData = useMemo(() => {
    return vehicles
      .filter(v => v.acquisitionCost > 0)
      .map(v => {
        const revenue    = filteredTrips.filter(t => t.vehicleId === v.id && t.status === 'Completed').reduce((s, t) => s + (t.revenue || 0), 0);
        const fuelCost   = filteredExpenses.filter(e => e.vehicleId === v.id).reduce((s, e) => s + e.cost, 0);
        const maintCost  = filteredMaint.filter(m => m.vehicleId === v.id).reduce((s, m) => s + (m.cost || 0), 0);
        const totalCost  = fuelCost + maintCost;
        const roi        = ((revenue - totalCost) / v.acquisitionCost) * 100;
        return {
          name: v.name.split(' ')[0],
          fullName: v.name,
          revenue,
          cost: totalCost,
          roi: parseFloat(roi.toFixed(2)),
          acquisitionCost: v.acquisitionCost,
        };
      })
      .sort((a, b) => b.roi - a.roi);
  }, [vehicles, filteredTrips, filteredExpenses, filteredMaint]);

  // ── Fuel Efficiency per vehicle ──────────────────────────────────────────────
  const fuelData = useMemo(() => {
    return vehicles
      .map(v => {
        const fuelLogs   = filteredExpenses.filter(e => e.vehicleId === v.id && e.liters > 0);
        const totalLiters = fuelLogs.reduce((s, e) => s + e.liters, 0);
        const totalKm    = filteredTrips.filter(t => t.vehicleId === v.id && t.status === 'Completed').reduce((s, t) => s + (t.estimatedKm || 0), 0);
        const efficiency = totalLiters > 0 && totalKm > 0 ? parseFloat((totalKm / totalLiters).toFixed(2)) : 0;
        return { name: v.name.split(' ')[0], kmPerLiter: efficiency, totalKm, totalLiters };
      })
      .filter(d => d.kmPerLiter > 0)
      .sort((a, b) => b.kmPerLiter - a.kmPerLiter);
  }, [vehicles, filteredTrips, filteredExpenses]);

  // ── Cost breakdown (pie) ────────────────────────────────────────────────────
  const costBreakdown = useMemo(() => {
    const fuel   = filteredExpenses.filter(e => ['Fuel','Charging'].includes(e.type)).reduce((s, e) => s + e.cost, 0);
    const toll   = filteredExpenses.filter(e => e.type === 'Toll').reduce((s, e) => s + e.cost, 0);
    const other  = filteredExpenses.filter(e => !['Fuel','Charging','Toll'].includes(e.type)).reduce((s, e) => s + e.cost, 0);
    const maint  = filteredMaint.reduce((s, m) => s + (m.cost || 0), 0);
    return [
      { name: 'Fuel & Charging', value: fuel,  fill: 'var(--amber)' },
      { name: 'Maintenance',     value: maint,  fill: 'var(--red)' },
      { name: 'Tolls',           value: toll,   fill: 'var(--blue)' },
      { name: 'Other',           value: other,  fill: 'var(--purple)' },
    ].filter(d => d.value > 0);
  }, [filteredExpenses, filteredMaint]);

  // ── Monthly revenue trend ───────────────────────────────────────────────────
  const monthlyRevenue = useMemo(() => {
    const byMonth = {};
    filteredTrips.filter(t => t.status === 'Completed').forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth[key] = (byMonth[key] || 0) + (t.revenue || 0);
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([month, revenue]) => ({
        month: month.slice(5) + '/' + month.slice(2, 4),
        revenue,
      }));
  }, [filteredTrips]);

  // ── Driver performance ──────────────────────────────────────────────────────
  const driverPerf = useMemo(() => {
    return drivers.map(d => {
      const dTrips     = filteredTrips.filter(t => t.driverId === d.id);
      const completed  = dTrips.filter(t => t.status === 'Completed');
      const revenue    = completed.reduce((s, t) => s + (t.revenue || 0), 0);
      const rate       = dTrips.length > 0 ? Math.round((completed.length / dTrips.length) * 100) : 0;
      return { name: d.name.split(' ')[0], trips: dTrips.length, revenue, rate, safetyScore: d.safetyScore };
    }).filter(d => d.trips > 0).sort((a, b) => b.revenue - a.revenue);
  }, [drivers, filteredTrips]);

  // ── Summary KPIs ────────────────────────────────────────────────────────────
  const totalRevenue  = filteredTrips.filter(t => t.status === 'Completed').reduce((s, t) => s + (t.revenue || 0), 0);
  const totalCost     = filteredExpenses.reduce((s, e) => s + e.cost, 0) + filteredMaint.reduce((s, m) => s + (m.cost || 0), 0);
  const netPL         = totalRevenue - totalCost;
  const avgROI        = roiData.length > 0 ? (roiData.reduce((s, r) => s + r.roi, 0) / roiData.length).toFixed(1) : 0;

  // ── CSV Export ──────────────────────────────────────────────────────────────
  function exportCSV() {
    const rows = roiData.map(r => ({
      Vehicle:           r.fullName,
      'Revenue (₹)':     r.revenue,
      'Total Cost (₹)':  r.cost,
      'Acquisition Cost (₹)': r.acquisitionCost,
      'ROI (%)':         r.roi,
    }));
    const csv  = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `logicore-analytics-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  // ── PDF Export ──────────────────────────────────────────────────────────────
  async function exportPDF() {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(0, 210, 255);
    doc.text('LogiCore Analytics Report', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Period: ${dateRange}    Generated: ${new Date().toLocaleDateString()}`, 14, 28);

    // KPI summary
    doc.setFontSize(13);
    doc.setTextColor(30);
    doc.text('Financial Summary', 14, 40);
    autoTable(doc, {
      startY: 44,
      head: [['Metric', 'Value']],
      body: [
        ['Total Revenue', `₹${totalRevenue.toLocaleString()}`],
        ['Total Cost', `₹${totalCost.toLocaleString()}`],
        ['Net P&L', `₹${netPL.toLocaleString()}`],
        ['Average Fleet ROI', `${avgROI}%`],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 210, 255], textColor: 255 },
    });

    // ROI table
    doc.text('Vehicle ROI', 14, doc.lastAutoTable.finalY + 14);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 18,
      head: [['Vehicle', 'Revenue', 'Cost', 'Acquisition', 'ROI %']],
      body: roiData.map(r => [
        r.fullName,
        `₹${r.revenue.toLocaleString()}`,
        `₹${r.cost.toLocaleString()}`,
        `₹${r.acquisitionCost.toLocaleString()}`,
        `${r.roi}%`,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 26, 46], textColor: 200 },
    });

    // Fuel efficiency
    if (fuelData.length > 0) {
      doc.text('Fuel Efficiency', 14, doc.lastAutoTable.finalY + 14);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 18,
        head: [['Vehicle', 'km/L', 'Total KM', 'Total Liters']],
        body: fuelData.map(d => [d.name, d.kmPerLiter, d.totalKm, d.totalLiters]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [16, 26, 46], textColor: 200 },
      });
    }

    doc.save(`logicore-report-${Date.now()}.pdf`);
  }

  return (
    <>
      <TopBar title="Analytics" subtitle="ROI · Efficiency · Performance" />
      <div className="page-body animate-fade-in">

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {DATE_RANGES.map(r => (
              <button
                key={r}
                className={`btn btn-sm ${dateRange === r ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setDateRange(r)}
              >{r}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={exportCSV}>
              <Download size={13} /> CSV
            </button>
            <button className="btn btn-secondary" onClick={exportPDF}>
              <FileText size={13} /> PDF Report
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Revenue',    val: `₹${totalRevenue.toLocaleString()}`,  color: 'var(--green)', icon: TrendingUp },
            { label: 'Total Cost',       val: `₹${totalCost.toLocaleString()}`,      color: 'var(--red)',   icon: TrendingDown },
            { label: 'Net P&L',          val: `₹${Math.abs(netPL).toLocaleString()}${netPL < 0 ? ' ▼' : ' ▲'}`, color: netPL >= 0 ? 'var(--green)' : 'var(--red)', icon: BarChart3 },
            { label: 'Avg Fleet ROI',    val: `${avgROI}%`,                          color: 'var(--cyan)',  icon: RefreshCw },
          ].map(s => (
            <div key={s.label} className="card" style={{ flex: '1 1 160px', padding: '14px 18px' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color, letterSpacing: -1, marginBottom: 2 }}>{s.val}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Chart Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

          {/* Vehicle ROI */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <div>
                <div className="card-title">Vehicle ROI</div>
                <div className="card-subtitle">Formula: (Revenue − Cost) / Acquisition Cost × 100</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={roiData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="roi" name="ROI %" radius={[4,4,0,0]} maxBarSize={40}>
                  {roiData.map((entry, i) => (
                    <Cell key={i} fill={entry.roi >= 0 ? 'var(--cyan)' : 'var(--red)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Fuel Efficiency */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Fuel Efficiency (km/L)</div>
            </div>
            {fuelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={fuelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="kmPerLiter" name="km/L" fill="var(--amber)" radius={[0,4,4,0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><div className="empty-state-text">No fuel data in this period</div></div>
            )}
          </div>

          {/* Cost Breakdown */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Cost Breakdown</div>
            </div>
            {costBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {costBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} contentStyle={{ background: 'var(--bg-raised)', border: '1px solid var(--border-md)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><div className="empty-state-text">No expense data</div></div>
            )}
          </div>

          {/* Monthly Revenue Trend */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <div className="card-title">Monthly Revenue Trend</div>
              <div className="card-subtitle">Completed trips only</div>
            </div>
            {monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="var(--green)" strokeWidth={2.5} dot={{ fill: 'var(--green)', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><div className="empty-state-text">No revenue data in this period</div></div>
            )}
          </div>

          {/* Driver Performance Table */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <div className="card-title">Driver Performance</div>
              <div className="card-subtitle">By revenue generated · {dateRange}</div>
            </div>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Driver</th>
                    <th>Trips</th>
                    <th>Completion Rate</th>
                    <th>Revenue Generated</th>
                    <th>Safety Score</th>
                  </tr>
                </thead>
                <tbody>
                  {driverPerf.map((d, i) => (
                    <tr key={d.name}>
                      <td className="mono" style={{ color: i === 0 ? 'var(--amber)' : 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.name}</td>
                      <td className="mono">{d.trips}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 60, height: 4, background: 'var(--bg-raised)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${d.rate}%`, background: d.rate >= 80 ? 'var(--green)' : d.rate >= 60 ? 'var(--amber)' : 'var(--red)', borderRadius: 99 }} />
                          </div>
                          <span className="mono" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{d.rate}%</span>
                        </div>
                      </td>
                      <td className="mono" style={{ color: 'var(--green)' }}>₹{d.revenue.toLocaleString()}</td>
                      <td>
                        <span className="mono" style={{ fontWeight: 700, color: d.safetyScore >= 85 ? 'var(--green)' : d.safetyScore >= 70 ? 'var(--amber)' : 'var(--red)' }}>
                          {d.safetyScore}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {driverPerf.length === 0 && (
                    <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-text">No trip data in this period</div></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
