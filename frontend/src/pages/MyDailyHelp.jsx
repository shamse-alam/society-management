import { ButtonSpinner } from '../components/Spinner';
import { ListSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { UserCheck, Plus, X, Clock, Phone, Save } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const categoryBadge = {
  MAID: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400',
  COOK: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  DRIVER: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  GARDENER: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  NANNY: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  TUTOR: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
  OTHER: 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400',
};

export default function MyDailyHelp() {
  const toast = useToast();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [helpers, setHelpers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', category: 'MAID', workingDays: 'MON,TUE,WED,THU,FRI,SAT', timeSlot: '08:00-10:00' });
  const [saving, setSaving] = useState(false);

  const fetchHelpers = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getMyDailyHelp();
      setHelpers(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchHelpers(); }, []);

  const selectedDays = form.workingDays ? form.workingDays.split(',') : [];

  const toggleDay = (day) => {
    const days = new Set(selectedDays);
    if (days.has(day)) days.delete(day);
    else days.add(day);
    setForm({ ...form, workingDays: DAYS.filter(d => days.has(d)).join(',') });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userAPI.addDailyHelp(form);
      toast.success('Daily help registered');
      setModalOpen(false);
      setForm({ name: '', phone: '', category: 'MAID', workingDays: 'MON,TUE,WED,THU,FRI,SAT', timeSlot: '08:00-10:00' });
      fetchHelpers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to register'); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (id) => {
    if (!await confirm({ title: 'Deactivate Daily Help', message: 'Are you sure you want to deactivate this daily help?', confirmLabel: 'Deactivate', danger: true })) return;
    try {
      await userAPI.deactivateDailyHelp(id);
      toast.success('Daily help deactivated');
      fetchHelpers();
    } catch (err) { toast.error('Failed to deactivate'); }
  };

  if (loading) return <ListSkeleton />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">My Daily Help</h1>
          <p className="text-[13px] text-muted mt-0.5">Manage your regular domestic help for easy gate entry</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Register Helper
        </button>
      </div>

      {helpers.length === 0 ? (
        <EmptyState icon={UserCheck} title="No daily help registered yet" description="Register your maid, cook, or other regular help for seamless gate entry" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {helpers.map((h) => (
            <div key={h.id} className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="px-5 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-semibold text-heading">{h.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${categoryBadge[h.category] || categoryBadge.OTHER}`}>{h.category}</span>
                    </div>
                    {h.phone && (
                      <p className="text-[13px] text-muted mt-1 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" /> {h.phone}
                      </p>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">Active</span>
                </div>

                <div className="mt-3 pt-3 border-t border-border">
                  {h.timeSlot && (
                    <div className="flex items-center gap-1.5 text-[13px] text-sub mb-2">
                      <Clock className="w-3.5 h-3.5 text-muted" />
                      <span>{h.timeSlot}</span>
                    </div>
                  )}
                  {h.workingDays && (
                    <div className="flex gap-1 flex-wrap">
                      {DAYS.map(d => (
                        <span key={d} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          h.workingDays.includes(d)
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400'
                            : 'bg-card-alt text-muted'
                        }`}>{d}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-border flex justify-end">
                  <button onClick={() => handleDeactivate(h.id)} className="text-[12px] text-red-600 dark:text-red-400 hover:underline font-medium">
                    Deactivate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Register Daily Help" full>
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[14px] font-semibold text-heading">Helper Details</h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
              <button type="submit" disabled={saving || !form.name || !form.phone} className="px-4 py-2 bg-indigo-600 text-white rounded text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">
                {saving ? <><ButtonSpinner /> Registering...</> : <><Save className="w-4 h-4" /> Register Helper</>}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required placeholder="Full name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Phone</label>
                    <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="Mobile number" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Time Slot</label>
                    <input type="text" value={form.timeSlot} onChange={(e) => setForm({ ...form, timeSlot: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="e.g. 08:00-10:00" />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-2">Working Days</label>
                  <div className="flex gap-2 flex-wrap">
                    {DAYS.map(d => (
                      <button key={d} type="button" onClick={() => toggleDay(d)}
                        className={`px-3 py-1.5 rounded text-[12px] font-medium transition-colors ${
                          selectedDays.includes(d)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-card-alt text-muted hover:text-sub'
                        }`}>{d}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6 md:sticky md:top-4 md:self-start">
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-[14px] font-semibold text-heading mb-1">Category</h2>
                <p className="text-[11px] text-muted mb-3">Type of domestic help.</p>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                  <option value="MAID">Maid</option>
                  <option value="COOK">Cook</option>
                  <option value="DRIVER">Driver</option>
                  <option value="GARDENER">Gardener</option>
                  <option value="NANNY">Nanny</option>
                  <option value="TUTOR">Tutor</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
