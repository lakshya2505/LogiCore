import { useState } from 'react';
import { Plus, User, Edit2, Trash2, AlertTriangle, Shield, CheckCircle2, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';
import DataTable from '../components/DataTable';
import StatusPill from '../components/StatusPill';
import Modal from '../components/Modal';

const CATEGORIES  = ['Light', 'Medium', 'Heavy', 'Hazardous'];
const STATUSES    = ['On Duty', 'Off Duty', 'Suspended'];

const EMPTY = {
  name: '', licenseNo: '', category: 'Light', expiry: '',
  status: 'On Duty', safetyScore: 85, phone: '', joined: new Date().toISOString().slice(0, 10),
};

function getLicenseStatus(driver) {
  const days = Math.ceil((new Date(driver.expiry) - new Date()) / 86400000);
  if (days < 0)   return { label: 'Expired',  cls: 'pill-expired',  days };
  if (days <= 60) return { label: `Exp. ${days}d`, cls: 'pill-expiring', days };
  return { label: 'Valid', cls: 'pill-valid', days };
}

function validate(f) {
  const e = {};
  if (!f.name.trim())      e.name      = 'Name is required';
  if (!f.licenseNo.trim()) e.licenseNo = 'License number required';
  if (!f.expiry)           e.expiry    = 'Expiry date required';
  if (!f.phone.trim())     e.phone     = 'Phone is required';
  if (f.safetyScore < 0 || f.safetyScore > 100) e.safetyScore = '0–100';
  return e;
}

export default function DriversPage() {
  const { drivers, trips, addDriver, updateDriver, deleteDriver } = useApp();

  const [modalOpen,   setModalOpen]   = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editTarget,  setEditTarget]  = useState(null);
  const [form,        setForm]        = useState(EMPTY);
  const [errors,      setErrors]      = useState({});
  const [filterStatus, setFilterStatus] = useState('All');

  function openAdd() {
    setEditTarget(null); setForm(EMPTY); setErrors({}); setModalOpen(true);
  }

  function openEdit(d) {
    setEditTarget(d);
    setForm({ ...d });
    setErrors({});
    setModalOpen(true);
  }

  function handleChange(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  }

  function handleSubmit() {
    const e = validate(form);
    if (Object.keys(e).length) { setErrors(e); return; }
    const payload = { ...form, safetyScore: Number(form.safetyScore), trips: editTarget?.trips || 0 };
    if (editTarget) updateDriver({ ...editTarget, ...payload });
    else            addDriver(payload);
    setModalOpen(false);
  }

  function toggleStatus(d, status) {
    updateDriver({ ...d, status });
  }

  const filtered = drivers.filter(d => filterStatus === 'All' || d.status === filterStatus);

  // Per driver stats
  function driverStats(d) {
    const dTrips      = trips.filter(t => t.driverId === d.id);
    const completed   = dTrips.filter(t => t.status === 'Completed').length;
    const settled     = dTrips.filter(t => ['Completed','Cancelled'].includes(t.status)).length;
    const rate        = settled > 0 ? Math.round((completed / settled) * 100) : 0;
    const revenue     = dTrips.filter(t => t.status === 'Completed').reduce((s, t) => s + (t.revenue || 0), 0);
    return { total: dTrips.length, completed, rate, revenue };
  }

  const columns = [
    {
      key: 'name', label: 'Driver', sortable: true,
      render: (val, row) => {
        const ls = getLicenseStatus(row);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, var(--cyan), var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', color: '#fff', flexShrink: 0 }}>
              {val.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem' }}>{val}</div>
              <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{row.phone}</div>
            </div>
          </div>
        );
      },
    },
    { key: 'licenseNo', label: 'License No.', sortable: false, mono: true },
    { key: 'category',  label: 'Category',    sortable: true },
    {
      key: 'expiry', label: 'License Expiry', sortable: true, mono: true,
      render: (val, row) => {
        const ls = getLicenseStatus(row);
        return (
          <div style={{ display: 'flex', align: 'center', gap: 6, flexDirection: 'column' }}>
            <span>{val}</span>
            <span className={`pill ${ls.cls}`} style={{ fontSize: '0.6rem' }}>
              {ls.cls !== 'pill-valid' && '⚠ '}{ls.label}
            </span>
          </div>
        );
      },
    },
    {
      key: 'safetyScore', label: 'Safety Score', sortable: true,
      render: (v) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 40, height: 4, background: 'var(--bg-raised)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${v}%`, background: v >= 85 ? 'var(--green)' : v >= 70 ? 'var(--amber)' : 'var(--red)', borderRadius: 99 }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: v >= 85 ? 'var(--green)' : v >= 70 ? 'var(--amber)' : 'var(--red)' }}>{v}</span>
        </div>
      ),
    },
    { key: 'status', label: 'Status', render: v => <StatusPill status={v} /> },
    {
      key: 'id', label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(row)} title="Edit"><Edit2 size={13} /></button>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            title="Delete"
            style={{ color: 'var(--red)' }}
            onClick={() => setDeleteModal(row)}
          ><Trash2 size={13} /></button>
        </div>
      ),
    },
  ];

  const expired  = drivers.filter(d => getLicenseStatus(d).days < 0).length;
  const expiring = drivers.filter(d => { const s = getLicenseStatus(d); return s.days >= 0 && s.days <= 60; }).length;
  const suspended = drivers.filter(d => d.status === 'Suspended').length;

  return (
    <>
      <TopBar title="Driver Management" subtitle="Profiles · Compliance · Performance" />
      <div className="page-body animate-fade-in">

        {/* Compliance banners */}
        {(expired > 0 || expiring > 0 || suspended > 0) && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {expired > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--red-dim)', border: '1px solid rgba(255,77,109,0.25)', borderRadius: 'var(--r-sm)', fontSize: '0.78rem', color: 'var(--red)' }}>
                <XCircle size={13} /> <strong>{expired}</strong> driver{expired > 1 ? 's' : ''} with expired license — dispatch blocked
              </div>
            )}
            {expiring > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--amber-dim)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: 'var(--r-sm)', fontSize: '0.78rem', color: 'var(--amber)' }}>
                <AlertTriangle size={13} /> <strong>{expiring}</strong> license{expiring > 1 ? 's' : ''} expiring within 60 days
              </div>
            )}
            {suspended > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--red-dim)', border: '1px solid rgba(255,77,109,0.2)', borderRadius: 'var(--r-sm)', fontSize: '0.78rem', color: 'var(--red)' }}>
                <Shield size={13} /> <strong>{suspended}</strong> driver{suspended > 1 ? 's' : ''} suspended
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Drivers', val: drivers.length,                                      color: 'var(--cyan)' },
            { label: 'On Duty',       val: drivers.filter(d => d.status === 'On Duty').length,   color: 'var(--green)' },
            { label: 'Off Duty',      val: drivers.filter(d => d.status === 'Off Duty').length,  color: 'var(--text-secondary)' },
            { label: 'Suspended',     val: suspended,                                            color: 'var(--red)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ flex: '1 1 120px', padding: '14px 18px', cursor: 'pointer', borderColor: filterStatus === s.label ? 'var(--border-accent)' : undefined }}
              onClick={() => setFilterStatus(filterStatus === s.label ? 'All' : s.label)}
            >
              <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color, letterSpacing: -1 }}>{s.val}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div className="card-title">Driver Roster</div>
              <div className="card-subtitle">{filtered.length} profiles · click for details & status</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="form-select" style={{ width: 140, padding: '7px 10px', fontSize: '0.78rem' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="All">All Statuses</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <button className="btn btn-primary" onClick={openAdd}>
                <Plus size={14} /> Add Driver
              </button>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filtered}
            searchKeys={['name', 'licenseNo', 'phone', 'category']}
            onRowClick={d => setDetailModal(d)}
            pageSize={8}
          />
        </div>
      </div>

      {/* Driver Detail Modal */}
      {detailModal && (() => {
        const stats = driverStats(detailModal);
        const ls    = getLicenseStatus(detailModal);
        return (
          <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title="Driver Profile">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, padding: '14px', background: 'var(--bg-input)', borderRadius: 'var(--r-sm)' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--cyan), var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color: '#fff' }}>
                {detailModal.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{detailModal.name}</div>
                <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: 2 }}>{detailModal.licenseNo} · {detailModal.category}</div>
              </div>
              <StatusPill status={detailModal.status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Phone',         val: detailModal.phone },
                { label: 'Joined',        val: detailModal.joined },
                { label: 'License Expiry',val: detailModal.expiry },
                { label: 'License Status',val: <span className={`pill ${ls.cls}`}>{ls.label}</span> },
                { label: 'Safety Score',  val: detailModal.safetyScore + ' / 100' },
                { label: 'Total Trips',   val: stats.total },
                { label: 'Completed',     val: `${stats.completed} (${stats.rate}% rate)` },
                { label: 'Revenue Generated', val: `₹${stats.revenue.toLocaleString()}` },
              ].map(row => (
                <div key={row.label}>
                  <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{row.label}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 }}>{row.val}</div>
                </div>
              ))}
            </div>

            {ls.days < 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--red-dim)', border: '1px solid rgba(255,77,109,0.25)', borderRadius: 'var(--r-sm)', marginBottom: 14, fontSize: '0.75rem', color: 'var(--red)' }}>
                <XCircle size={13} /> License expired — this driver cannot be assigned to trips
              </div>
            )}

            {/* Status toggle */}
            <div style={{ marginBottom: 4 }}>
              <div className="form-label" style={{ marginBottom: 8 }}>Change Status</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {STATUSES.map(s => (
                  <button
                    key={s}
                    className={`btn btn-sm ${detailModal.status === s ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => { toggleStatus(detailModal, s); setDetailModal(d => ({ ...d, status: s })); }}
                  >{s}</button>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetailModal(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setDetailModal(null); openEdit(detailModal); }}>
                <Edit2 size={13} /> Edit Profile
              </button>
            </div>
          </Modal>
        );
      })()}

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Driver' : 'Add Driver'} size="lg">
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className={`form-input${errors.name ? ' error' : ''}`} value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="e.g. Arjun Sharma" />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Phone *</label>
            <input className={`form-input${errors.phone ? ' error' : ''}`} value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+91-9876543210" />
            {errors.phone && <span className="form-error">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">License Number *</label>
            <input className={`form-input${errors.licenseNo ? ' error' : ''}`} value={form.licenseNo} onChange={e => handleChange('licenseNo', e.target.value)} placeholder="e.g. DL-MH-2021-0012345" />
            {errors.licenseNo && <span className="form-error">{errors.licenseNo}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">License Expiry *</label>
            <input className={`form-input${errors.expiry ? ' error' : ''}`} type="date" value={form.expiry} onChange={e => handleChange('expiry', e.target.value)} />
            {errors.expiry && <span className="form-error">{errors.expiry}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">License Category</label>
            <select className="form-select" value={form.category} onChange={e => handleChange('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => handleChange('status', e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Safety Score (0–100)</label>
            <input className={`form-input${errors.safetyScore ? ' error' : ''}`} type="number" min="0" max="100" value={form.safetyScore} onChange={e => handleChange('safetyScore', e.target.value)} />
            {errors.safetyScore && <span className="form-error">{errors.safetyScore}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Date Joined</label>
            <input className="form-input" type="date" value={form.joined} onChange={e => handleChange('joined', e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            <User size={13} /> {editTarget ? 'Save Changes' : 'Add Driver'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Driver">
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
          Permanently delete <strong style={{ color: 'var(--text-primary)' }}>{deleteModal?.name}</strong>? This cannot be undone.
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setDeleteModal(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => { deleteDriver(deleteModal.id); setDeleteModal(null); }}>Delete Driver</button>
        </div>
      </Modal>
    </>
  );
}
