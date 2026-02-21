import { useState, useMemo } from 'react';
import { Plus, DollarSign, Fuel, Trash2, TrendingDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const EXPENSE_TYPES = ['Fuel', 'Toll', 'Parking', 'Charging', 'Driver Allowance', 'Repair (Minor)', 'Insurance', 'Permit', 'Cleaning', 'Other'];

const EMPTY = {
  vehicleId: '', type: 'Fuel', cost: '', liters: '',
  date: new Date().toISOString().slice(0, 10),
  tripId: '', notes: '', odometer: '',
};

export default function ExpensesPage() {
  const { vehicles, trips, expenses, maintenanceLogs, addExpense, deleteExpense } = useApp();

  const [modalOpen,   setModalOpen]   = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [form,        setForm]        = useState(EMPTY);
  const [errors,      setErrors]      = useState({});
  const [activeVehicle, setActiveVehicle] = useState('All');

  function handleChange(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  }

  function validate() {
    const e = {};
    if (!form.vehicleId)               e.vehicleId = 'Select a vehicle';
    if (!form.cost || form.cost <= 0)  e.cost      = 'Cost is required';
    if (!form.date)                    e.date      = 'Date is required';
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    addExpense({
      ...form,
      cost:     Number(form.cost),
      liters:   Number(form.liters) || 0,
      odometer: Number(form.odometer) || 0,
      tripId:   form.tripId || null,
    });
    setModalOpen(false);
    setForm(EMPTY);
  }

  // Per-vehicle summary
  const vehicleSummaries = useMemo(() => {
    return vehicles.map(v => {
      const vExpenses = expenses.filter(e => e.vehicleId === v.id);
      const vMaint    = maintenanceLogs.filter(m => m.vehicleId === v.id);
      const fuelCost  = vExpenses.filter(e => ['Fuel','Charging'].includes(e.type)).reduce((s, e) => s + e.cost, 0);
      const otherCost = vExpenses.filter(e => !['Fuel','Charging'].includes(e.type)).reduce((s, e) => s + e.cost, 0);
      const maintCost = vMaint.reduce((s, m) => s + (m.cost || 0), 0);
      const totalCost = fuelCost + otherCost + maintCost;
      const totalLiters = vExpenses.filter(e => e.liters > 0).reduce((s, e) => s + e.liters, 0);
      const completedTrips = trips.filter(t => t.vehicleId === v.id && t.status === 'Completed');
      const totalKm = completedTrips.reduce((s, t) => s + (t.estimatedKm || 0), 0);
      const fuelEff = totalLiters > 0 && totalKm > 0 ? (totalKm / totalLiters).toFixed(2) : null;
      return { ...v, fuelCost, otherCost, maintCost, totalCost, totalLiters, totalKm, fuelEff, expenseCount: vExpenses.length };
    }).sort((a, b) => b.totalCost - a.totalCost);
  }, [vehicles, expenses, maintenanceLogs, trips]);

  const filteredExpenses = expenses.filter(e =>
    activeVehicle === 'All' || e.vehicleId === activeVehicle
  );

  const grandTotal = expenses.reduce((s, e) => s + e.cost, 0);
  const totalFuel  = expenses.filter(e => ['Fuel','Charging'].includes(e.type)).reduce((s, e) => s + e.cost, 0);

  const columns = [
    {
      key: 'vehicleId', label: 'Vehicle', sortable: true,
      render: (_, row) => {
        const v = vehicles.find(v => v.id === row.vehicleId);
        return <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem' }}>{v?.name || '—'}</span>;
      },
    },
    { key: 'type', label: 'Type', sortable: true,
      render: v => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {v === 'Fuel' || v === 'Charging' ? <Fuel size={12} style={{ color: 'var(--amber)' }} /> : <DollarSign size={12} style={{ color: 'var(--blue)' }} />}
          {v}
        </span>
      ),
    },
    { key: 'date', label: 'Date', sortable: true, mono: true },
    {
      key: 'cost', label: 'Amount', sortable: true, mono: true,
      render: v => <span style={{ color: 'var(--red)', fontWeight: 600 }}>₹{Number(v).toLocaleString()}</span>,
    },
    {
      key: 'liters', label: 'Liters', sortable: true, mono: true,
      render: v => v > 0 ? `${v}L` : '—',
    },
    {
      key: 'tripId', label: 'Trip Ref', sortable: false,
      render: v => v ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--cyan)' }}>{v.toUpperCase()}</span> : '—',
    },
    {
      key: 'id', label: 'Actions',
      render: (_, row) => (
        <button
          className="btn btn-ghost btn-icon btn-sm"
          style={{ color: 'var(--red)' }}
          onClick={e => { e.stopPropagation(); setDeleteModal(row); }}
        >
          <Trash2 size={13} />
        </button>
      ),
    },
  ];

  return (
    <>
      <TopBar title="Expenses" subtitle="Fuel & operational costs" />
      <div className="page-body animate-fade-in">

        {/* Grand totals */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Expenses',    val: `₹${grandTotal.toLocaleString()}`,      color: 'var(--red)' },
            { label: 'Fuel & Charging',   val: `₹${totalFuel.toLocaleString()}`,        color: 'var(--amber)' },
            { label: 'Other Expenses',    val: `₹${(grandTotal - totalFuel).toLocaleString()}`, color: 'var(--blue)' },
            { label: 'Expense Records',   val: expenses.length,                          color: 'var(--cyan)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ flex: '1 1 150px', padding: '14px 18px' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color, letterSpacing: -1, marginBottom: 2 }}>{s.val}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Per-vehicle cost summary cards */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Operational Cost by Vehicle</div>
              <div className="card-subtitle">Fuel + Maintenance + Other · click to filter table</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {vehicleSummaries.filter(v => v.totalCost > 0).map(v => (
              <div
                key={v.id}
                onClick={() => setActiveVehicle(activeVehicle === v.id ? 'All' : v.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 14px',
                  background: activeVehicle === v.id ? 'var(--cyan-dim)' : 'var(--bg-input)',
                  border: `1px solid ${activeVehicle === v.id ? 'var(--border-accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-sm)', cursor: 'pointer',
                  transition: 'all var(--t)',
                }}
              >
                <div style={{ minWidth: 150 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem' }}>{v.name}</div>
                  <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{v.plate}</div>
                </div>

                {/* Stacked bar */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', height: 6, borderRadius: 99, overflow: 'hidden', gap: 1 }}>
                    {[
                      { val: v.fuelCost, color: 'var(--amber)' },
                      { val: v.maintCost, color: 'var(--red)' },
                      { val: v.otherCost, color: 'var(--blue)' },
                    ].map((seg, i) => (
                      <div key={i} style={{ flex: seg.val, background: seg.color, minWidth: seg.val > 0 ? 2 : 0 }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 10, fontSize: '0.63rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--amber)' }}>Fuel ₹{v.fuelCost.toLocaleString()}</span>
                    <span style={{ color: 'var(--red)' }}>Maint ₹{v.maintCost.toLocaleString()}</span>
                    <span style={{ color: 'var(--blue)' }}>Other ₹{v.otherCost.toLocaleString()}</span>
                    {v.fuelEff && <span style={{ marginLeft: 'auto' }}>⛽ {v.fuelEff} km/L</span>}
                  </div>
                </div>

                <div style={{ textAlign: 'right', minWidth: 90 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--red)' }}>₹{v.totalCost.toLocaleString()}</div>
                  <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{v.expenseCount} entries</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses table */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div className="card-title">
                Expense Ledger
                {activeVehicle !== 'All' && (
                  <span style={{ marginLeft: 8, fontSize: '0.72rem', background: 'var(--cyan-dim)', color: 'var(--cyan)', padding: '2px 8px', borderRadius: 99, fontFamily: 'var(--font-mono)' }}>
                    {vehicles.find(v => v.id === activeVehicle)?.name}
                  </span>
                )}
              </div>
              <div className="card-subtitle">{filteredExpenses.length} records</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {activeVehicle !== 'All' && (
                <button className="btn btn-secondary btn-sm" onClick={() => setActiveVehicle('All')}>Clear filter</button>
              )}
              <button className="btn btn-primary" onClick={() => { setModalOpen(true); setForm(EMPTY); setErrors({}); }}>
                <Plus size={14} /> Log Expense
              </button>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date))}
            searchKeys={['type', 'notes']}
            pageSize={10}
          />
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log Expense" size="lg">
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Vehicle *</label>
            <select className={`form-select${errors.vehicleId ? ' error' : ''}`} value={form.vehicleId} onChange={e => handleChange('vehicleId', e.target.value)}>
              <option value="">— Select vehicle —</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} · {v.plate}</option>)}
            </select>
            {errors.vehicleId && <span className="form-error">{errors.vehicleId}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Expense Type</label>
            <select className="form-select" value={form.type} onChange={e => handleChange('type', e.target.value)}>
              {EXPENSE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Amount (₹) *</label>
            <input className={`form-input${errors.cost ? ' error' : ''}`} type="number" value={form.cost} onChange={e => handleChange('cost', e.target.value)} placeholder="e.g. 4500" />
            {errors.cost && <span className="form-error">{errors.cost}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Date *</label>
            <input className={`form-input${errors.date ? ' error' : ''}`} type="date" value={form.date} onChange={e => handleChange('date', e.target.value)} />
            {errors.date && <span className="form-error">{errors.date}</span>}
          </div>

          {(form.type === 'Fuel' || form.type === 'Charging') && (
            <>
              <div className="form-group">
                <label className="form-label">Quantity (Liters / kWh)</label>
                <input className="form-input" type="number" value={form.liters} onChange={e => handleChange('liters', e.target.value)} placeholder="e.g. 45" />
              </div>
              <div className="form-group">
                <label className="form-label">Odometer at Fill-up (km)</label>
                <input className="form-input" type="number" value={form.odometer} onChange={e => handleChange('odometer', e.target.value)} placeholder="e.g. 47200" />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Trip Reference (optional)</label>
            <select className="form-select" value={form.tripId} onChange={e => handleChange('tripId', e.target.value)}>
              <option value="">— Not linked to a trip —</option>
              {trips.filter(t => !form.vehicleId || t.vehicleId === form.vehicleId).map(t => (
                <option key={t.id} value={t.id}>{t.id.toUpperCase()} · {t.origin} → {t.destination}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Notes</label>
            <input className="form-input" value={form.notes} onChange={e => handleChange('notes', e.target.value)} placeholder="Optional notes..." />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}><TrendingDown size={13} /> Add Expense</button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Expense">
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
          Delete <strong style={{ color: 'var(--text-primary)' }}>{deleteModal?.type}</strong> expense of <strong style={{ color: 'var(--red)' }}>₹{Number(deleteModal?.cost || 0).toLocaleString()}</strong> on {deleteModal?.date}?
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setDeleteModal(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => { deleteExpense(deleteModal.id); setDeleteModal(null); }}>Delete</button>
        </div>
      </Modal>
    </>
  );
}
