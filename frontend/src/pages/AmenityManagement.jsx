import { ButtonSpinner } from '../components/Spinner';
import { ListSkeleton } from '../components/Skeleton';
import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, Building2, IndianRupee, CheckCircle2, XCircle, Save } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';

const fmt = (n) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 });
const emptyForm = { name: '', description: '', chargePerDay: '', available: true, totalUnits: 1 };

export default function AmenityManagement() {
  const toast = useToast();
  const confirm = useConfirm();
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAmenities = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAmenities();
      setAmenities(res.data);
    } catch (err) { console.error('Failed to load amenities', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAmenities(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (a) => {
    setEditingId(a.id);
    setForm({ name: a.name, description: a.description || '', chargePerDay: a.chargePerDay, available: a.available, totalUnits: a.totalUnits });
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      if (editingId) {
        await adminAPI.updateAmenity(editingId, form);
        toast.success('Amenity updated');
      } else {
        await adminAPI.createAmenity(form);
        toast.success('Amenity created');
      }
      setModalOpen(false);
      fetchAmenities();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save amenity'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!await confirm({ title: 'Delete Amenity', message: 'Are you sure you want to delete this amenity?', confirmLabel: 'Delete', danger: true })) return;
    try { await adminAPI.deleteAmenity(id); toast.success('Amenity deleted'); fetchAmenities(); }
    catch { toast.error('Failed to delete amenity'); }
  };

  if (loading) return <ListSkeleton />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">Amenity Management</h1>
          <p className="text-[13px] text-muted mt-0.5">Manage bookable facilities and amenities</p>
        </div>
        <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Amenity
        </button>
      </div>

      {/* Amenity Cards */}
      {amenities.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <Building2 className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-[13px] text-muted">No amenities configured</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {amenities.map(a => (
            <div key={a.id} className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="px-5 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[15px] font-semibold text-heading">{a.name}</h3>
                    {a.description && <p className="text-[13px] text-muted mt-1">{a.description}</p>}
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium shrink-0 ${a.available ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'}`}>
                    {a.available ? <><CheckCircle2 className="w-3 h-3" />Available</> : <><XCircle className="w-3 h-3" />Unavailable</>}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5 text-[13px]">
                    <IndianRupee className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-heading">₹{fmt(a.chargePerDay)}</span>
                    <span className="text-muted">/day</span>
                  </div>
                  <div className="text-[13px] text-muted">{a.totalUnits} unit{a.totalUnits > 1 ? 's' : ''}</div>
                  <div className="ml-auto flex items-center gap-1">
                    <button onClick={() => openEdit(a)} className="p-1.5 text-muted hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(a.id)} className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Amenity' : 'Add Amenity'} full>
        {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-lg text-[13px]">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[14px] font-semibold text-heading">Amenity Details</h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
              <button type="submit" disabled={saving || !form.name || !form.chargePerDay} className="px-4 py-2 bg-indigo-600 text-white rounded text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">
                {saving ? <><ButtonSpinner /> Saving...</> : <><Save className="w-4 h-4" /> {editingId ? 'Update Amenity' : 'Save Amenity'}</>}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required placeholder="e.g. Function Hall" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading resize-none" placeholder="Brief description of the facility" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Charge Per Day (₹) *</label>
                    <input type="number" min="0" value={form.chargePerDay} onChange={(e) => setForm({ ...form, chargePerDay: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Total Units *</label>
                    <input type="number" min="1" value={form.totalUnits} onChange={(e) => setForm({ ...form, totalUnits: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required />
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6 md:sticky md:top-4 md:self-start">
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-[14px] font-semibold text-heading mb-1">Availability</h2>
                <p className="text-[11px] text-muted mb-3">Control whether this amenity can be booked by members.</p>
                <label className="flex items-center gap-2 text-[13px] text-heading cursor-pointer">
                  <input type="checkbox" id="amenityAvailable" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} className="rounded border-input-border text-indigo-600 focus:ring-indigo-500" />
                  Available for booking
                </label>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
