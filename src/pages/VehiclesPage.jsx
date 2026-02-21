import { useState } from 'react';
import { Plus, Truck, Edit2, Trash2, PowerOff, Power, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';
import DataTable from '../components/DataTable';
import StatusPill from '../components/StatusPill';
import Modal from '../components/Modal';

const TYPES    = ['Truck', 'Van', 'Bike', 'Trailer', 'Pickup'];
const FUELS    = ['Diesel', 'Petrol', 'CNG', 'Electric', 'Hybrid'];
const REGIONS  = ['North', 'South', 'East', 'West', 'Central'];
const STATUSES = ['Available', 'In Shop', 'Retired'];

const EMPTY = {
  name: '', plate: '', type: 'Truck', capacity: '', odometer: '',
  acquisitionCost: '', year: '', fuel: 'Diesel', region: 'North', status: 'Available',
};

function validate(f) {
  const e = {};
  if (!f.name.trim())          e.name = 'Vehicle name is required';
  if (!f.plate.trim())         e.plate = 'Plate number is required';
  if (!f.capacity || f.capacity <= 0) e.capacity = 'Capacity must be > 0';
  if (!f.odometer && f.odometer !== 0) e.odometer = 'Odometer is required';
  if (!f.year || f.year < 1990 || f.year > new Date().getFullYear() + 1) e.year = 'Valid year required';
  return e;
}

export default function VehiclesPage() {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle } = useApp();

  const [modalOpen,   setModalOpen]   = useState(false);
  const [deleteModal, setDeleteModal] = useState(null); // vehicle to delete
  const [editTarget,  setEditTarget]  = useState(null); // vehicle being edited
  const [form,        setForm]        = useState(EMPTY);
  const [errors,      setErrors]      = useState({});
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType,   setFilterType]   = useState('All');

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(v) {
    setEditTarget(v);
    setForm({ ...v });
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
    const payload = {
      ...form,
      capacity:       Number(form.capacity),
      odometer:       Number(form.odometer),
      acquisitionCost: Number(form.acquisitionCost) || 0,
      year:           Number(form.year),
    };
    if (editTarget) updateVehicle({ ...editTarget, ...payload });
    else            addVehicle(payload);
    setModalOpen(false);
  }

  function toggleRetired(v) {
    updateVehicle({ ...v, status: v.status === 'Retired' ? 'Available' : 'Retired' });
  }

  function confirmDelete() {
    deleteVehicle(deleteModal.id);
    setDeleteModal(null);
  }

  const filtered = vehicles.filter(v =>
    (filterStatus === 'All' || v.status === filterStatus) &&
    (filterType   === 'All' || v.type   === filterType)
  );

  const summary = {
    total:     vehicles.length,
    active:    vehicles.filter(v => v.status === 'Available').length,
    onTrip:    vehicles.filter(v => v.status === 'On Trip').length,
    inShop:    vehicles.filter(v => v.status === 'In Shop').length,
    retired:   vehicles.filter(v => v.status === 'Retired').length,
  };

  const columns = [
    {
      key: 'name', label: 'Vehicle', sortable: true,
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', background: 'var(--bg-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Truck size={14} color="var(--text-muted)" />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem' }}>{val}</div>
            <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{row.plate}</div>
          </div>
        </div>
      ),
    },
    { key: 'type',     label: 'Type',      sortable: true },
    { key: 'region',   label: 'Region',    sortable: true },
    { key: 'fuel',     label: 'Fuel',      sortable: true },
    {
      key: 'capacity', label: 'Capacity', sortable: true, mono: true,
      render: (v) => `${Number(v).toLocaleString()} kg`,
    },
    {
      key: 'odometer', label: 'Odometer', sortable: true, mono: true,
      render: (v) => `${Number(v).toLocaleString()} km`,
    },
    {
      key: 'acquisitionCost', label: 'Acq. Cost', sortable: true, mono: true,
      render: (v) => v ? `₹${Number(v).toLocaleString()}` : '—',
    },
    {
      key: 'status', label: 'Status',
      render: (v) => <StatusPill status={v} />,
    },
    {
      key: 'id', label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(row)} title="Edit">
            <Edit2 size={13} />
          </button>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => toggleRetired(row)}
            title={row.status === 'Retired' ? 'Reinstate' : 'Retire'}
            style={{ color: row.status === 'Retired' ? 'var(--green)' : 'var(--amber)' }}
            disabled={row.status === 'On Trip' || row.status === 'In Shop'}
          >
            {row.status === 'Retired' ? <Power size={13} /> : <PowerOff size={13} />}
          </button>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => setDeleteModal(row)}
            title="Delete"
            style={{ color: 'var(--red)' }}
            disabled={row.status === 'On Trip'}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <TopBar title="Fleet Management" subtitle="Vehicles · CRUD" />
      <div className="page-body animate-fade-in">

        {/* Summary strip */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Total',     val: summary.total,   color: 'var(--cyan)' },
            { label: 'Available', val: summary.active,  color: 'var(--green)' },
            { label: 'On Trip',   val: summary.onTrip,  color: 'var(--blue)' },
            { label: 'In Shop',   val: summary.inShop,  color: 'var(--amber)' },
            { label: 'Retired',   val: summary.retired, color: 'var(--text-muted)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ flex: '1 1 120px', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color, letterSpacing: -1 }}>{s.val}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card">
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div className="card-title">All Vehicles</div>
              <div className="card-subtitle">{filtered.length} records</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <select className="form-select" style={{ width: 130, padding: '7px 10px', fontSize: '0.78rem' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="All">All Statuses</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
                <option value="On Trip">On Trip</option>
              </select>
              <select className="form-select" style={{ width: 120, padding: '7px 10px', fontSize: '0.78rem' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="All">All Types</option>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <button className="btn btn-primary" onClick={openAdd}>
                <Plus size={14} /> Add Vehicle
              </button>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filtered}
            searchKeys={['name', 'plate', 'type', 'region']}
            onRowClick={openEdit}
            pageSize={8}
          />
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Vehicle' : 'Add New Vehicle'} size="lg">
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Vehicle Name *</label>
            <input className={`form-input${errors.name ? ' error' : ''}`} value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="e.g. Thunder Hauler" />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Plate Number *</label>
            <input className={`form-input${errors.plate ? ' error' : ''}`} value={form.plate} onChange={e => handleChange('plate', e.target.value)} placeholder="e.g. MH-01-AB-1234" />
            {errors.plate && <span className="form-error">{errors.plate}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Vehicle Type</label>
            <select className="form-select" value={form.type} onChange={e => handleChange('type', e.target.value)}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Fuel Type</label>
            <select className="form-select" value={form.fuel} onChange={e => handleChange('fuel', e.target.value)}>
              {FUELS.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Max Capacity (kg) *</label>
            <input className={`form-input${errors.capacity ? ' error' : ''}`} type="number" value={form.capacity} onChange={e => handleChange('capacity', e.target.value)} placeholder="e.g. 5000" />
            {errors.capacity && <span className="form-error">{errors.capacity}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Current Odometer (km) *</label>
            <input className={`form-input${errors.odometer ? ' error' : ''}`} type="number" value={form.odometer} onChange={e => handleChange('odometer', e.target.value)} placeholder="e.g. 45000" />
            {errors.odometer && <span className="form-error">{errors.odometer}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Year of Manufacture *</label>
            <input className={`form-input${errors.year ? ' error' : ''}`} type="number" value={form.year} onChange={e => handleChange('year', e.target.value)} placeholder="e.g. 2021" min="1990" max="2025" />
            {errors.year && <span className="form-error">{errors.year}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Acquisition Cost (₹)</label>
            <input className="form-input" type="number" value={form.acquisitionCost} onChange={e => handleChange('acquisitionCost', e.target.value)} placeholder="e.g. 1500000" />
          </div>
          <div className="form-group">
            <label className="form-label">Region</label>
            <select className="form-select" value={form.region} onChange={e => handleChange('region', e.target.value)}>
              {REGIONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          {editTarget && (
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => handleChange('status', e.target.value)} disabled={form.status === 'On Trip'}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editTarget ? 'Save Changes' : 'Add Vehicle'}</button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Vehicle">
        <div style={{ display: 'flex', gap: 12, padding: '8px 0', marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', background: 'var(--red-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={18} color="var(--red)" />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{deleteModal?.name}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              This will permanently delete the vehicle and all associated data. This action cannot be undone.
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setDeleteModal(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={confirmDelete}>Delete Vehicle</button>
        </div>
      </Modal>
    </>
  );
}
