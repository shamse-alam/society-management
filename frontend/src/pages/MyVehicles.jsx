import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { useToast } from '../components/Toast';
import { ListSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { Car, Plus, Edit2, Trash2, Bike, Zap, CircleDot, ParkingSquare, Save } from 'lucide-react';
import { formatVehicleNumber } from '../utils/format';

const vehicleTypes = ['CAR', 'BIKE', 'SCOOTER', 'EV_CAR', 'EV_BIKE', 'BICYCLE', 'OTHER'];

const typeConfig = {
  CAR: { icon: Car, color: 'bg-blue-500', label: 'Car' },
  BIKE: { icon: Bike, color: 'bg-purple-500', label: 'Bike' },
  SCOOTER: { icon: Bike, color: 'bg-teal-500', label: 'Scooter' },
  EV_CAR: { icon: Zap, color: 'bg-green-500', label: 'EV Car' },
  EV_BIKE: { icon: Zap, color: 'bg-emerald-500', label: 'EV Bike' },
  BICYCLE: { icon: Bike, color: 'bg-amber-500', label: 'Bicycle' },
  OTHER: { icon: CircleDot, color: 'bg-gray-500', label: 'Other' },
};

export default function MyVehicles() {
  const toast = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ vehicleNumber: '', vehicleType: 'CAR', make: '', model: '', color: '', stickerNumber: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [vRes, sRes] = await Promise.all([userAPI.getMyVehicles(), userAPI.getMyParkingSlots()]);
      setVehicles(vRes.data);
      setSlots(sRes.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await userAPI.updateVehicle(editing.id, form);
        toast.success('Vehicle updated');
      } else {
        await userAPI.addVehicle(form);
        toast.success('Vehicle registered');
      }
      setShowModal(false);
      setEditing(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save vehicle');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this vehicle?')) return;
    try {
      await userAPI.deleteVehicle(id);
      toast.success('Vehicle removed');
      fetchData();
    } catch {
      toast.error('Failed to remove vehicle');
    }
  };

  const openEdit = (v) => {
    setEditing(v);
    setForm({ vehicleNumber: v.vehicleNumber, vehicleType: v.vehicleType || 'CAR', make: v.make || '', model: v.model || '', color: v.color || '', stickerNumber: v.stickerNumber || '' });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ vehicleNumber: '', vehicleType: 'CAR', make: '', model: '', color: '', stickerNumber: '' });
    setShowModal(true);
  };

  if (loading) return <ListSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-heading">My Vehicles</h1>
          <p className="text-[13px] text-muted mt-1">{vehicles.length} registered vehicles &middot; {slots.length} parking slots assigned</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      {/* Vehicles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map(v => {
          const cfg = typeConfig[v.vehicleType] || typeConfig.OTHER;
          const Icon = cfg.icon;
          return (
            <div key={v.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${cfg.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted uppercase">{cfg.label}</p>
                    <p className="text-[15px] font-bold text-heading font-mono">{formatVehicleNumber(v.vehicleNumber)}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(v)} className="p-1.5 text-muted hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(v.id)} className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-[12px] text-muted">
                {(v.make || v.model) && <p>{[v.make, v.model].filter(Boolean).join(' ')}</p>}
                {v.color && <p>Color: {v.color}</p>}
                {v.stickerNumber && <p>Sticker: <span className="font-mono">{v.stickerNumber}</span></p>}
              </div>
            </div>
          );
        })}
        {vehicles.length === 0 && (
          <div className="col-span-full">
            <EmptyState icon={Car} title="No vehicles registered" description="Register your vehicles to get parking stickers" />
          </div>
        )}
      </div>

      {/* Parking Slots */}
      {slots.length > 0 && (
        <>
          <h2 className="text-[15px] font-bold text-heading flex items-center gap-2">
            <ParkingSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Assigned Parking Slots
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {slots.map(s => {
              const cfg = typeConfig[s.slotType === 'EV' ? 'EV_CAR' : s.slotType] || typeConfig.OTHER;
              const Icon = cfg.icon;
              return (
                <div key={s.id} className={`border rounded-xl p-4 text-center ${
                  s.occupied
                    ? 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/30'
                    : 'bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-500/30'
                }`}>
                  <Icon className={`w-6 h-6 mx-auto mb-1 ${s.occupied ? 'text-red-500' : 'text-green-500'}`} />
                  <p className="text-[14px] font-bold text-heading">{s.slotNumber}</p>
                  <p className="text-[11px] text-muted">{s.zone || ''}</p>
                  {s.assignedVehicleNumber && <p className="text-[11px] font-mono text-heading mt-1">{s.assignedVehicleNumber}</p>}
                  <p className={`text-[10px] font-semibold mt-1 ${s.occupied ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {s.occupied ? 'OCCUPIED' : 'FREE'}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {showModal && (
        <Modal open title={editing ? 'Edit Vehicle' : 'Register Vehicle'} onClose={() => { setShowModal(false); setEditing(null); }} full>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <h2 className="text-[14px] font-semibold text-heading mb-2">Vehicle Details</h2>
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Vehicle Number *</label>
                    <input type="text" required value={form.vehicleNumber} onChange={e => setForm({ ...form, vehicleNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading uppercase" placeholder="KA 01 AB 1234" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-medium text-heading mb-1">Make</label>
                      <input type="text" value={form.make} onChange={e => setForm({ ...form, make: e.target.value })}
                        className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="Maruti" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-heading mb-1">Model</label>
                      <input type="text" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })}
                        className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="Swift" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-medium text-heading mb-1">Color</label>
                      <input type="text" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                        className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="White" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-heading mb-1">Sticker Number</label>
                      <input type="text" value={form.stickerNumber} onChange={e => setForm({ ...form, stickerNumber: e.target.value })}
                        className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="STK-001" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setShowModal(false); setEditing(null); }} className="flex-1 py-2.5 border border-border rounded-lg text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"><Save className="w-4 h-4" /> {editing ? 'Update Vehicle' : 'Register Vehicle'}</button>
                  </div>
                </div>
              </div>
              <div className="space-y-6 md:sticky md:top-4 md:self-start">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="text-[14px] font-semibold text-heading mb-1">Vehicle Type</h2>
                  <p className="text-[11px] text-muted mb-3">Select the type of vehicle.</p>
                  <select value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                    {vehicleTypes.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
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
