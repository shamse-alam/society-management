import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useToast } from '../components/Toast';
import { TableSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { ParkingSquare, Plus, Edit2, Trash2, Car, Bike, Zap, UserCheck, Save } from 'lucide-react';
import { useSocietyConfig } from '../context/SocietyConfigContext';

const slotTypes = ['CAR', 'BIKE', 'EV', 'VISITOR'];


const slotTypeConfig = {
  CAR: { icon: Car, color: 'bg-blue-500', label: 'Car' },
  BIKE: { icon: Bike, color: 'bg-purple-500', label: 'Bike' },
  EV: { icon: Zap, color: 'bg-green-500', label: 'EV' },
  VISITOR: { icon: UserCheck, color: 'bg-orange-500', label: 'Visitor' },
};

export default function ParkingSlots() {
  const toast = useToast();
  const { config } = useSocietyConfig();
  const propertyLabel = config?.propertyLabel || 'Property';
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [form, setForm] = useState({ slotNumber: '', slotType: 'CAR', zone: '', assignedUnitNumber: '', assignedVehicleId: '' });
  const [properties, setProperties] = useState([]);

  useEffect(() => { fetchSlots(); fetchProperties(); }, []);

  const fetchProperties = async () => {
    try { const res = await adminAPI.getProperties(); setProperties(res.data); } catch {}
  };

  const fetchSlots = async () => {
    try {
      const res = await adminAPI.getParkingSlots();
      setSlots(res.data);
    } catch {
      toast.error('Failed to load parking slots');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, assignedVehicleId: form.assignedVehicleId ? Number(form.assignedVehicleId) : null };
    try {
      if (editing) {
        await adminAPI.updateParkingSlot(editing.id, payload);
        toast.success('Slot updated');
      } else {
        await adminAPI.createParkingSlot(payload);
        toast.success('Slot created');
      }
      setShowModal(false);
      setEditing(null);
      fetchSlots();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save slot');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this parking slot?')) return;
    try {
      await adminAPI.deleteParkingSlot(id);
      toast.success('Slot deactivated');
      fetchSlots();
    } catch {
      toast.error('Failed to deactivate slot');
    }
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ slotNumber: s.slotNumber, slotType: s.slotType || 'CAR', zone: s.zone || '', assignedUnitNumber: s.assignedUnitNumber || '', assignedVehicleId: '' });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ slotNumber: '', slotType: 'CAR', zone: '', assignedUnitNumber: '', assignedVehicleId: '' });
    setShowModal(true);
  };

  const filtered = filterType ? slots.filter(s => s.slotType === filterType) : slots;

  const occupiedCount = slots.filter(s => s.occupied).length;
  const freeCount = slots.filter(s => !s.occupied).length;

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-heading">Parking Slots</h1>
          <p className="text-[13px] text-muted mt-1">{slots.length} total slots &middot; {occupiedCount} occupied &middot; {freeCount} free</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 bg-card border border-border rounded-lg text-[13px] text-heading">
            <option value="">All Types</option>
            {slotTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={openAdd} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" /> Add Slot
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {slotTypes.map(t => {
          const cfg = slotTypeConfig[t];
          const Icon = cfg.icon;
          const count = slots.filter(s => s.slotType === t).length;
          const occ = slots.filter(s => s.slotType === t && s.occupied).length;
          return (
            <div key={t} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 ${cfg.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-muted font-semibold uppercase">{cfg.label}</p>
                  <p className="text-lg font-bold text-heading">{count}</p>
                </div>
              </div>
              <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full ${cfg.color} rounded-full transition-all`} style={{ width: count > 0 ? `${(occ / count) * 100}%` : '0%' }} />
              </div>
              <p className="text-[11px] text-muted mt-1">{occ}/{count} occupied</p>
            </div>
          );
        })}
      </div>

      {/* Slot Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {filtered.map(s => {
          const cfg = slotTypeConfig[s.slotType] || slotTypeConfig.CAR;
          const Icon = cfg.icon;
          return (
            <div key={s.id} className={`relative border rounded-xl p-3 text-center cursor-pointer transition-all hover:shadow-md ${
              s.occupied
                ? 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/30'
                : 'bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-500/30'
            }`}>
              <div className="flex justify-center mb-1">
                <Icon className={`w-5 h-5 ${s.occupied ? 'text-red-500' : 'text-green-500'}`} />
              </div>
              <p className="text-[13px] font-bold text-heading">{s.slotNumber}</p>
              <p className="text-[10px] text-muted">{s.zone || 'No zone'}</p>
              {s.assignedUnitNumber && <p className="text-[10px] text-muted mt-0.5">{propertyLabel} {s.assignedUnitNumber}</p>}
              {s.assignedVehicleNumber && <p className="text-[10px] font-mono text-heading mt-0.5">{s.assignedVehicleNumber}</p>}
              <p className={`text-[10px] font-semibold mt-1 ${s.occupied ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {s.occupied ? 'OCCUPIED' : 'FREE'}
              </p>
              {/* Quick actions */}
              <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 hover:opacity-100 transition-opacity" style={{ opacity: undefined }}>
                <button onClick={(e) => { e.stopPropagation(); openEdit(s); }} className="p-1 text-muted hover:text-indigo-600 rounded">
                  <Edit2 className="w-3 h-3" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="p-1 text-muted hover:text-red-600 rounded">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full">
            <EmptyState icon={ParkingSquare} title="No parking slots found" description="There are no parking slots matching your filter criteria." />
          </div>
        )}
      </div>

      {showModal && (
        <Modal open title={editing ? 'Edit Parking Slot' : 'Add Parking Slot'} onClose={() => { setShowModal(false); setEditing(null); }} full>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <h2 className="text-[14px] font-semibold text-heading mb-2">Slot Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-medium text-heading mb-1">Slot Number *</label>
                      <input type="text" required value={form.slotNumber} onChange={e => setForm({ ...form, slotNumber: e.target.value })}
                        className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="C-01" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-heading mb-1">Zone</label>
                      <input type="text" value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })}
                        className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="Block A" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setShowModal(false); setEditing(null); }} className="flex-1 py-2.5 border border-border rounded-lg text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"><Save className="w-4 h-4" /> {editing ? 'Update Slot' : 'Create Slot'}</button>
                  </div>
                </div>
              </div>
              <div className="space-y-6 md:sticky md:top-4 md:self-start">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="text-[14px] font-semibold text-heading mb-1">Slot Type</h2>
                  <p className="text-[11px] text-muted mb-3">Type of vehicle this slot accommodates.</p>
                  <select value={form.slotType} onChange={e => setForm({ ...form, slotType: e.target.value })}
                    className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                    {slotTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="text-[14px] font-semibold text-heading mb-1">{propertyLabel}</h2>
                  <p className="text-[11px] text-muted mb-3">Assign this slot to a {propertyLabel.toLowerCase()}.</p>
                  <select value={form.assignedUnitNumber} onChange={e => setForm({ ...form, assignedUnitNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                    <option value="">Unassigned</option>
                    {properties.map(v => <option key={v.id} value={v.unitNumber}>{v.unitNumber}{v.ownerName ? ` (${v.ownerName})` : ''}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
