import { useState, useMemo } from 'react';
import {
  Plus, Route, AlertTriangle, CheckCircle2, XCircle,
  ArrowRight, Send, Ban, Gauge
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';
import DataTable from '../components/DataTable';
import StatusPill from '../components/StatusPill';
import Modal from '../components/Modal';

const CARGO_TYPES = ['Electronics', 'Textiles', 'Food Grains', 'Auto Parts', 'Pharma', 'Building Materials', 'FMCG', 'Documents', 'Parcels', 'Machinery', 'Garments', 'Electrical Goods', 'Other'];

const EMPTY_TRIP = {
  vehicleId: '', driverId: '', origin: '', destination: '',
  cargoType: 'Electronics', cargoWeight: '', estimatedKm: '', revenue: '', notes: '',
  date: new Date().toISOString().slice(0, 10),
};

function isLicenseValid(driver) {
  return new Date(driver.expiry) >= new Date();
}

function daysToExpiry(driver) {
  return Math.ceil((new Date(driver.expiry) - new Date()) / 86400000);
}

export default function TripsPage() {
  const { vehicles, drivers, trips, addTrip, dispatchTrip, completeTrip, cancelTrip } = useApp();

  const [createModal,   setCreateModal]   = useState(false);
  const [detailModal,   setDetailModal]   = useState(null); // trip
  const [completeModal, setCompleteModal] = useState(null); // trip
  const [finalOdo,      setFinalOdo]      = useState('');
  const [form,          setForm]          = useState(EMPTY_TRIP);
  const [errors,        setErrors]        = useState({});
  const [filterStatus,  setFilterStatus]  = useState('All');

  // Available vehicles (only Available status)
  const availableVehicles = vehicles.filter(v => v.status === 'Available');

  // Available drivers (On Duty + valid license, not currently on an active trip)
  const activeDriverIds = trips
    .filter(t => t.status === 'Dispatched')
    .map(t => t.driverId);

  const availableDrivers = drivers.filter(d =>
    d.status !== 'Suspended' &&
    !activeDriverIds.includes(d.id)
  );

  const selectedVehicle = vehicles.find(v => v.id === form.vehicleId);
  const selectedDriver  = drivers.find(d => d.id === form.driverId);

  function handleChange(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  }

  function validate() {
    const e = {};
    if (!form.vehicleId) e.vehicleId = 'Select a vehicle';
    if (!form.driverId)  e.driverId  = 'Select a driver';
    if (!form.origin.trim())      e.origin      = 'Origin is required';
    if (!form.destination.trim()) e.destination = 'Destination required';
    if (!form.cargoWeight || form.cargoWeight <= 0) e.cargoWeight = 'Cargo weight required';
    if (!form.estimatedKm || form.estimatedKm <= 0) e.estimatedKm = 'Distance required';
    if (!form.date) e.date = 'Date required';

    // Capacity check
    if (selectedVehicle && form.cargoWeight > 0) {
      if (Number(form.cargoWeight) > selectedVehicle.capacity) {
        e.cargoWeight = `Exceeds vehicle capacity (${selectedVehicle.capacity.toLocaleString()} kg max)`;
      }
    }

    // License check
    if (selectedDriver && !isLicenseValid(selectedDriver)) {
      e.driverId = `Driver license expired on ${selectedDriver.expiry}`;
    }

    return e;
  }

  function handleCreate() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    addTrip({
      ...form,
      cargoWeight:  Number(form.cargoWeight),
      estimatedKm:  Number(form.estimatedKm),
      revenue:      Number(form.revenue) || 0,
      status: 'Draft',
    });
    setCreateModal(false);
    setForm(EMPTY_TRIP);
    setErrors({});
  }

  function handleDispatch(trip) {
    dispatchTrip(trip.id);
    setDetailModal(null);
  }

  function openComplete(trip) {
    setCompleteModal(trip);
    setFinalOdo('');
  }

  function handleComplete() {
    if (!finalOdo || Number(finalOdo) <= 0) return;
    completeTrip(completeModal.id, Number(finalOdo));
    setCompleteModal(null);
    setDetailModal(null);
  }

  function handleCancel(trip) {
    cancelTrip(trip.id);
    setDetailModal(null);
  }

  const filtered = trips.filter(t => filterStatus === 'All' || t.status === filterStatus);

  const columns = [
    {
      key: 'id', label: 'Trip', sortable: false,
      render: (_, row) => {
        const v = vehicles.find(v => v.id === row.vehicleId);
        const d = drivers.find(d => d.id === row.driverId);
        return (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              {row.origin} <ArrowRight size={11} style={{ opacity: 0.4 }} /> {row.destination}
            </div>
            <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: 2 }}>
              {v?.name || '—'} · {d?.name || '—'}
            </div>
          </div>
        );
      },
    },
    { key: 'date',      label: 'Date',       sortable: true, mono: true },
    { key: 'cargoType', label: 'Cargo',      sortable: true },
    {
      key: 'cargoWeight', label: 'Weight', sortable: true, mono: true,
      render: v => `${Number(v).toLocaleString()} kg`,
    },
    {
      key: 'estimatedKm', label: 'Est. Km', sortable: true, mono: true,
      render: v => `${Number(v).toLocaleString()} km`,
    },
    {
      key: 'revenue', label: 'Revenue', sortable: true, mono: true,
      render: v => v ? `₹${Number(v).toLocaleString()}` : '—',
    },
    { key: 'status', label: 'Status', render: v => <StatusPill status={v} /> },
  ];

  // Summary counts
  const counts = {
    draft:      trips.filter(t => t.status === 'Draft').length,
    dispatched: trips.filter(t => t.status === 'Dispatched').length,
    completed:  trips.filter(t => t.status === 'Completed').length,
    cancelled:  trips.filter(t => t.status === 'Cancelled').length,
  };

  return (
    <>
      <TopBar title="Trip Management" subtitle="Dispatch · Lifecycle" />
      <div className="page-body animate-fade-in">

        {/* Summary */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Draft',      val: counts.draft,      color: 'var(--purple)' },
            { label: 'Dispatched', val: counts.dispatched, color: 'var(--cyan)' },
            { label: 'Completed',  val: counts.completed,  color: 'var(--green)' },
            { label: 'Cancelled',  val: counts.cancelled,  color: 'var(--red)' },
          ].map(s => (
            <div
              key={s.label}
              className="card"
              style={{ flex: '1 1 120px', padding: '14px 18px', cursor: 'pointer', borderColor: filterStatus === s.label ? 'var(--border-accent)' : undefined }}
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
              <div className="card-title">All Trips</div>
              <div className="card-subtitle">{filtered.length} records · click a row to manage lifecycle</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="form-select" style={{ width: 140, padding: '7px 10px', fontSize: '0.78rem' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="All">All Statuses</option>
                {['Draft','Dispatched','Completed','Cancelled'].map(s => <option key={s}>{s}</option>)}
              </select>
              <button className="btn btn-primary" onClick={() => { setCreateModal(true); setForm(EMPTY_TRIP); setErrors({}); }}>
                <Plus size={14} /> New Trip
              </button>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filtered}
            searchKeys={['origin', 'destination', 'cargoType']}
            onRowClick={row => setDetailModal(row)}
            pageSize={8}
          />
        </div>
      </div>

      {/* Create Trip Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create New Trip" size="lg">
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Vehicle (Available only) *</label>
            <select className={`form-select${errors.vehicleId ? ' error' : ''}`} value={form.vehicleId} onChange={e => handleChange('vehicleId', e.target.value)}>
              <option value="">— Select vehicle —</option>
              {availableVehicles.map(v => (
                <option key={v.id} value={v.id}>{v.name} · {v.plate} · {v.capacity.toLocaleString()} kg cap</option>
              ))}
            </select>
            {errors.vehicleId && <span className="form-error">{errors.vehicleId}</span>}
            {selectedVehicle && (
              <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--cyan)', marginTop: 3 }}>
                Max capacity: {selectedVehicle.capacity.toLocaleString()} kg
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Driver *</label>
            <select className={`form-select${errors.driverId ? ' error' : ''}`} value={form.driverId} onChange={e => handleChange('driverId', e.target.value)}>
              <option value="">— Select driver —</option>
              {availableDrivers.map(d => {
                const valid = isLicenseValid(d);
                const days  = daysToExpiry(d);
                return (
                  <option key={d.id} value={d.id} disabled={!valid}>
                    {d.name} · {d.category} · {valid ? (days <= 60 ? `⚠ expires in ${days}d` : `✓ valid`) : '✗ expired'}
                  </option>
                );
              })}
            </select>
            {errors.driverId && <span className="form-error">{errors.driverId}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Origin *</label>
            <input className={`form-input${errors.origin ? ' error' : ''}`} value={form.origin} onChange={e => handleChange('origin', e.target.value)} placeholder="e.g. Mumbai" />
            {errors.origin && <span className="form-error">{errors.origin}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Destination *</label>
            <input className={`form-input${errors.destination ? ' error' : ''}`} value={form.destination} onChange={e => handleChange('destination', e.target.value)} placeholder="e.g. Delhi" />
            {errors.destination && <span className="form-error">{errors.destination}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Cargo Type</label>
            <select className="form-select" value={form.cargoType} onChange={e => handleChange('cargoType', e.target.value)}>
              {CARGO_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Cargo Weight (kg) *</label>
            <input
              className={`form-input${errors.cargoWeight ? ' error' : ''}`}
              type="number" value={form.cargoWeight}
              onChange={e => handleChange('cargoWeight', e.target.value)}
              placeholder="e.g. 3500"
            />
            {errors.cargoWeight && (
              <span className="form-error" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertTriangle size={11} /> {errors.cargoWeight}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Estimated Distance (km) *</label>
            <input className={`form-input${errors.estimatedKm ? ' error' : ''}`} type="number" value={form.estimatedKm} onChange={e => handleChange('estimatedKm', e.target.value)} placeholder="e.g. 450" />
            {errors.estimatedKm && <span className="form-error">{errors.estimatedKm}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Revenue (₹)</label>
            <input className="form-input" type="number" value={form.revenue} onChange={e => handleChange('revenue', e.target.value)} placeholder="e.g. 45000" />
          </div>

          <div className="form-group">
            <label className="form-label">Trip Date *</label>
            <input className={`form-input${errors.date ? ' error' : ''}`} type="date" value={form.date} onChange={e => handleChange('date', e.target.value)} />
            {errors.date && <span className="form-error">{errors.date}</span>}
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => handleChange('notes', e.target.value)} placeholder="Optional notes or special instructions..." style={{ resize: 'vertical' }} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setCreateModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate}><Route size={14} /> Create Trip</button>
        </div>
      </Modal>

      {/* Trip Detail / Lifecycle Modal */}
      {detailModal && (
        <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title="Trip Details" size="lg">
          {(() => {
            const t  = detailModal;
            const v  = vehicles.find(v => v.id === t.vehicleId);
            const d  = drivers.find(d => d.id === t.driverId);
            return (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  {[
                    { label: 'Route',    val: `${t.origin} → ${t.destination}` },
                    { label: 'Status',   val: <StatusPill status={t.status} /> },
                    { label: 'Vehicle',  val: v?.name || '—' },
                    { label: 'Driver',   val: d?.name || '—' },
                    { label: 'Cargo',    val: `${t.cargoType} · ${Number(t.cargoWeight).toLocaleString()} kg` },
                    { label: 'Distance', val: `${Number(t.estimatedKm).toLocaleString()} km` },
                    { label: 'Revenue',  val: t.revenue ? `₹${Number(t.revenue).toLocaleString()}` : '—' },
                    { label: 'Date',     val: t.date },
                  ].map(row => (
                    <div key={row.label}>
                      <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{row.label}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 }}>{row.val}</div>
                    </div>
                  ))}
                </div>
                {t.notes && (
                  <div style={{ padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 'var(--r-sm)', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                    {t.notes}
                  </div>
                )}

                {/* Lifecycle Actions */}
                <div className="modal-footer" style={{ flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary" onClick={() => setDetailModal(null)}>Close</button>
                  {t.status === 'Draft' && (
                    <>
                      <button className="btn btn-danger" style={{ marginLeft: 'auto' }} onClick={() => handleCancel(t)}>
                        <Ban size={13} /> Cancel Trip
                      </button>
                      <button className="btn btn-primary" onClick={() => handleDispatch(t)}>
                        <Send size={13} /> Dispatch
                      </button>
                    </>
                  )}
                  {t.status === 'Dispatched' && (
                    <>
                      <button className="btn btn-danger" style={{ marginLeft: 'auto' }} onClick={() => handleCancel(t)}>
                        <XCircle size={13} /> Cancel
                      </button>
                      <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--green), #0d9b66)' }} onClick={() => openComplete(t)}>
                        <CheckCircle2 size={13} /> Mark Complete
                      </button>
                    </>
                  )}
                </div>
              </>
            );
          })()}
        </Modal>
      )}

      {/* Complete Trip — Final Odometer Modal */}
      <Modal open={!!completeModal} onClose={() => setCompleteModal(null)} title="Complete Trip">
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
            Enter the final odometer reading to complete this trip. The vehicle odometer will be updated.
          </div>
          <div className="form-group">
            <label className="form-label">Final Odometer Reading (km)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Gauge size={14} style={{ color: 'var(--cyan)', flexShrink: 0 }} />
              <input
                className="form-input"
                type="number"
                value={finalOdo}
                onChange={e => setFinalOdo(e.target.value)}
                placeholder={`> ${vehicles.find(v => v.id === completeModal?.vehicleId)?.odometer || 0}`}
                autoFocus
              />
            </div>
            {finalOdo && Number(finalOdo) <= (vehicles.find(v => v.id === completeModal?.vehicleId)?.odometer || 0) && (
              <span className="form-error">Must be greater than current odometer</span>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setCompleteModal(null)}>Cancel</button>
          <button
            className="btn btn-primary"
            style={{ background: 'linear-gradient(135deg, var(--green), #0d9b66)' }}
            onClick={handleComplete}
            disabled={!finalOdo || Number(finalOdo) <= 0}
          >
            <CheckCircle2 size={13} /> Confirm Complete
          </button>
        </div>
      </Modal>
    </>
  );
}
