import { useState } from 'react';
import { Plus, Wrench, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';
import DataTable from '../components/DataTable';
import StatusPill from '../components/StatusPill';
import Modal from '../components/Modal';

const SERVICE_TYPES = ['Oil Change', 'Tire Replacement', 'Tire Rotation', 'Brake Service', 'Engine Overhaul', 'Engine Diagnostics', 'Battery Replacement', 'Suspension Check', 'AC Repair', 'Full Inspection', 'Electrical Work', 'Bodywork', 'Other'];

const EMPTY = {
  vehicleId: '', type: 'Oil Change', cost: '',
  date: new Date().toISOString().slice(0, 10),
  notes: '', mechanic: '', completed: false,
};

export default function MaintenancePage() {
  const { vehicles, maintenanceLogs, addMaintenance, completeMaintenance, deleteMaintenance } = useApp();

  const [modalOpen,   setModalOpen]   = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [form,        setForm]        = useState(EMPTY);
  const [errors,      setErrors]      = useState({});
  const [filterDone,  setFilterDone]  = useState('All');

  function handleChange(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  }

  function validate() {
    const e = {};
    if (!form.vehicleId)            e.vehicleId = 'Select a vehicle';
    if (!form.cost || form.cost <= 0) e.cost    = 'Cost is required';
    if (!form.date)                   e.date    = 'Date is required';
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    addMaintenance({ ...form, cost: Number(form.cost), completed: false });
    setModalOpen(false);
    setForm(EMPTY);
  }

  const filtered = maintenanceLogs.filter(m =>
    filterDone === 'All'       ? true :
    filterDone === 'Active'    ? !m.completed :
    filterDone === 'Completed' ? m.completed : true
  );

  const totalCost    = maintenanceLogs.reduce((s, m) => s + (m.cost || 0), 0);
  const activeLogs   = maintenanceLogs.filter(m => !m.completed).length;
  const completedLogs = maintenanceLogs.filter(m => m.completed).length;

  const columns = [
    {
      key: 'vehicleId', label: 'Vehicle', sortable: true,
      render: (_, row) => {
        const v = vehicles.find(v => v.id === row.vehicleId);
        return (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem' }}>{v?.name || '—'}</div>
            <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{v?.plate || '—'}</div>
          </div>
        );
      },
    },
    { key: 'type',     label: 'Service Type', sortable: true },
    { key: 'date',     label: 'Date',         sortable: true, mono: true },
    {
      key: 'cost', label: 'Cost', sortable: true, mono: true,
      render: v => `₹${Number(v).toLocaleString()}`,
    },
    { key: 'mechanic', label: 'Mechanic / Shop', sortable: false, render: v => v || '—' },
    {
      key: 'notes', label: 'Notes', sortable: false,
      render: v => v ? <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{v.slice(0, 50)}{v.length > 50 ? '…' : ''}</span> : '—',
    },
    {
      key: 'completed', label: 'Status',
      render: v => <StatusPill status={v ? 'Completed' : 'In Shop'} />,
    },
    {
      key: 'id', label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
          {!row.completed && (
            <button
              className="btn btn-ghost btn-icon btn-sm"
              title="Mark complete"
              style={{ color: 'var(--green)' }}
              onClick={() => completeMaintenance(row.id)}
            >
              <CheckCircle2 size={13} />
            </button>
          )}
          <button
            className="btn btn-ghost btn-icon btn-sm"
            title="Delete"
            style={{ color: 'var(--red)' }}
            onClick={() => setDeleteModal(row)}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <TopBar title="Maintenance" subtitle="Service logs · Auto status" />
      <div className="page-body animate-fade-in">

        {/* Summary */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Logs',    val: maintenanceLogs.length, color: 'var(--cyan)' },
            { label: 'Active / Open', val: activeLogs,             color: 'var(--amber)' },
            { label: 'Completed',     val: completedLogs,           color: 'var(--green)' },
            { label: 'Total Spent',   val: `₹${totalCost.toLocaleString()}`, color: 'var(--red)', mono: true },
          ].map(s => (
            <div key={s.label} className="card" style={{ flex: '1 1 140px', padding: '14px 18px' }}>
              <div style={{ fontSize: s.mono ? '1.1rem' : '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color, letterSpacing: -1, marginBottom: 2 }}>{s.val}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Active alert banner */}
        {activeLogs > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--amber-dim)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: 'var(--r-sm)', marginBottom: 20 }}>
            <AlertTriangle size={14} color="var(--amber)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--amber)', fontWeight: 500 }}>
              {activeLogs} vehicle{activeLogs > 1 ? 's are' : ' is'} currently in maintenance — status set to <strong>In Shop</strong>. Mark logs complete to return them to <strong>Available</strong>.
            </span>
          </div>
        )}

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div className="card-title">Maintenance Logs</div>
              <div className="card-subtitle">{filtered.length} records</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="form-select" style={{ width: 150, padding: '7px 10px', fontSize: '0.78rem' }} value={filterDone} onChange={e => setFilterDone(e.target.value)}>
                <option value="All">All Logs</option>
                <option value="Active">Open / In Progress</option>
                <option value="Completed">Completed</option>
              </select>
              <button className="btn btn-primary" onClick={() => { setModalOpen(true); setForm(EMPTY); setErrors({}); }}>
                <Plus size={14} /> Log Service
              </button>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filtered}
            searchKeys={['type', 'mechanic', 'notes']}
            pageSize={8}
          />
        </div>
      </div>

      {/* Add Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log Maintenance Service" size="lg">
        <div style={{ padding: '10px 12px', background: 'var(--amber-dim)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: 'var(--r-sm)', marginBottom: 18, fontSize: '0.75rem', color: 'var(--amber)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          Logging this service will automatically set the vehicle status to <strong style={{ marginLeft: 3 }}>In Shop</strong>. Mark the log complete to return it to <strong style={{ marginLeft: 3 }}>Available</strong>.
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Vehicle *</label>
            <select className={`form-select${errors.vehicleId ? ' error' : ''}`} value={form.vehicleId} onChange={e => handleChange('vehicleId', e.target.value)}>
              <option value="">— Select vehicle —</option>
              {vehicles.filter(v => v.status !== 'Retired').map(v => (
                <option key={v.id} value={v.id}>{v.name} · {v.plate} · {v.status}</option>
              ))}
            </select>
            {errors.vehicleId && <span className="form-error">{errors.vehicleId}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Service Type</label>
            <select className="form-select" value={form.type} onChange={e => handleChange('type', e.target.value)}>
              {SERVICE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Cost (₹) *</label>
            <input className={`form-input${errors.cost ? ' error' : ''}`} type="number" value={form.cost} onChange={e => handleChange('cost', e.target.value)} placeholder="e.g. 5000" />
            {errors.cost && <span className="form-error">{errors.cost}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Service Date *</label>
            <input className={`form-input${errors.date ? ' error' : ''}`} type="date" value={form.date} onChange={e => handleChange('date', e.target.value)} />
            {errors.date && <span className="form-error">{errors.date}</span>}
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Mechanic / Workshop</label>
            <input className="form-input" value={form.mechanic} onChange={e => handleChange('mechanic', e.target.value)} placeholder="e.g. AutoFix Garage, Delhi" />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => handleChange('notes', e.target.value)} placeholder="Details about the issue or work done..." style={{ resize: 'vertical' }} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}><Wrench size={13} /> Log Service</button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Maintenance Log">
        <div style={{ display: 'flex', gap: 12, padding: '8px 0', marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', background: 'var(--red-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={18} color="var(--red)" />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              {deleteModal?.type} — {vehicles.find(v => v.id === deleteModal?.vehicleId)?.name}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {!deleteModal?.completed
                ? 'Warning: this log is still active. Deleting it will NOT automatically restore the vehicle status.'
                : 'This maintenance log will be permanently deleted.'}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setDeleteModal(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => { deleteMaintenance(deleteModal.id); setDeleteModal(null); }}>Delete Log</button>
        </div>
      </Modal>
    </>
  );
}
