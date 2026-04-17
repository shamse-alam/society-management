import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useToast } from '../components/Toast';
import { TableSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { Car, Plus, Edit2, Trash2, Search, Home, Bike, Zap, CircleDot, Save } from 'lucide-react';
import { useSocietyConfig } from '../context/SocietyConfigContext';
import { formatVehicleNumber } from '../utils/format';

const vehicleTypes = ['CAR', 'BIKE', 'SCOOTER', 'EV_CAR', 'EV_BIKE', 'BICYCLE', 'OTHER'];

const typeConfig = {
  CAR: { icon: Car, color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' },
  BIKE: { icon: Bike, color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400' },
  SCOOTER: { icon: Bike, color: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400' },
  EV_CAR: { icon: Zap, color: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400' },
  EV_BIKE: { icon: Zap, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
  BICYCLE: { icon: Bike, color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
  OTHER: { icon: CircleDot, color: 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400' },
};

export default function VehicleManagement() {
  const toast = useToast();
  const { config } = useSocietyConfig();
  const propertyLabel = config?.propertyLabel || 'Property';
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ vehicleNumber: '', vehicleType: 'CAR', make: '', model: '', color: '', unitNumber: '', stickerNumber: '' });
  const [properties, setProperties] = useState([]);

  useEffect(() => { fetchVehicles(); fetchProperties(); }, []);

  const fetchProperties = async () => {
    try { const res = await adminAPI.getProperties(); setProperties(res.data); } catch {}
  };

  const fetchVehicles = async () => {
    try {
      const res = await adminAPI.getVehicles();
      setVehicles(res.data);
    } catch {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await adminAPI.updateVehicle(editing.id, form);
        toast.success('Vehicle updated');
      } else {
        await adminAPI.addVehicle(form);
        toast.success('Vehicle registered');
      }
      setShowModal(false);
      setEditing(null);
      fetchVehicles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save vehicle');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this vehicle?')) return;
    try {
      await adminAPI.deleteVehicle(id);
      toast.success('Vehicle deactivated');
      fetchVehicles();
    } catch {
      toast.error('Failed to deactivate vehicle');
    }
  };

  const openEdit = (v) => {
    setEditing(v);
    setForm({ vehicleNumber: v.vehicleNumber, vehicleType: v.vehicleType || 'CAR', make: v.make || '', model: v.model || '', color: v.color || '', unitNumber: v.unitNumber || '', stickerNumber: v.stickerNumber || '' });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ vehicleNumber: '', vehicleType: 'CAR', make: '', model: '', color: '', unitNumber: '', stickerNumber: '' });
    setShowModal(true);
  };

  const filtered = vehicles.filter(v => {
    const q = search.toLowerCase();
    return !q || v.vehicleNumber?.toLowerCase().includes(q) || v.unitNumber?.toLowerCase().includes(q) || v.ownerName?.toLowerCase().includes(q) || v.make?.toLowerCase().includes(q) || v.model?.toLowerCase().includes(q);
  });

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-heading">Vehicle Management</h1>
          <p className="text-[13px] text-muted mt-1">{vehicles.length} registered vehicles</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vehicles..."
              className="pl-9 pr-4 py-2 w-56 bg-card border border-border rounded-lg text-[13px] text-heading placeholder:text-muted" />
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" /> Register Vehicle
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-card-alt">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider">Vehicle</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider">Make / Model</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider">{propertyLabel}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider">Owner</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider">Sticker</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(v => {
                const cfg = typeConfig[v.vehicleType] || typeConfig.OTHER;
                const Icon = cfg.icon;
                return (
                  <tr key={v.id} className="hover:bg-card-alt/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.color.split(' ')[0]} dark:${cfg.color.split(' ').pop()}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[13px] font-semibold text-heading font-mono">{formatVehicleNumber(v.vehicleNumber)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.color}`}>{v.vehicleType?.replace('_', ' ')}</span>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-heading">{[v.make, v.model].filter(Boolean).join(' ') || '-'}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1 text-[13px] text-heading"><Home className="w-3.5 h-3.5 text-muted" />{v.unitNumber || '-'}</span>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-muted">{v.ownerName || '-'}</td>
                    <td className="px-5 py-3 text-[13px] text-muted font-mono">{v.stickerNumber || '-'}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(v)} className="p-1.5 text-muted hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(v.id)} className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7}><EmptyState icon={Car} title="No vehicles found" description="There are no vehicles matching your search criteria." /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                    <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"><Save className="w-4 h-4" /> {editing ? 'Update Vehicle' : 'Save Vehicle'}</button>
                  </div>
                </div>
              </div>
              <div className="space-y-6 md:sticky md:top-4 md:self-start">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="text-[14px] font-semibold text-heading mb-1">Vehicle Type</h2>
                  <p className="text-[11px] text-muted mb-3">Select the type of vehicle being registered.</p>
                  <select value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                    {vehicleTypes.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="text-[14px] font-semibold text-heading mb-1">{propertyLabel}</h2>
                  <p className="text-[11px] text-muted mb-3">Assign vehicle to a {propertyLabel.toLowerCase()}.</p>
                  <select value={form.unitNumber} onChange={e => setForm({ ...form, unitNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                    <option value="">{`-- Select ${propertyLabel} --`}</option>
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
