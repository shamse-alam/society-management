import { ButtonSpinner } from '../components/Spinner';
import { ListSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useState, useEffect } from 'react';
import { userAPI, guardAPI } from '../services/api';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import PhotoPicker from '../components/PhotoPicker';
import { UserCheck, Plus, Clock, Phone, Save, Check, X, AlertCircle, Camera, LayoutGrid, List, Search } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import { useAuth } from '../context/AuthContext';
import { useSocietyConfig } from '../context/SocietyConfigContext';

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

const statusBadge = {
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  APPROVED: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};

export default function MyDailyHelp() {
  const toast = useToast();
  const confirm = useConfirm();
  const { hasRole, isGuard } = useAuth();
  const { config } = useSocietyConfig();
  const propertyLabel = config?.propertyLabel || 'Property';
  const isGuardView = isGuard && !hasRole('RESIDENT') && !hasRole('ADMIN');
  const [loading, setLoading] = useState(true);
  const [helpers, setHelpers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', category: 'MAID', unitNumber: '', workingDays: 'MON,TUE,WED,THU,FRI,SAT', timeSlot: '08:00-10:00' });
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [properties, setProperties] = useState([]);

  // Guard-specific state
  const [viewMode, setViewMode] = useState('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const fetchHelpers = async () => {
    setLoading(true);
    try {
      const res = isGuardView ? await guardAPI.getDailyHelp() : await userAPI.getMyDailyHelp();
      setHelpers(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchHelpers();
    if (isGuardView) {
      guardAPI.getProperties().then(res => setProperties(res.data)).catch(() => {});
    }
  }, []);

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
      let savedId = null;
      if (isGuardView) {
        const res = await guardAPI.addDailyHelpForProperty(form);
        savedId = res.data?.id;
        toast.success('Staff registered! Awaiting owner approval.');
      } else {
        const res = await userAPI.addDailyHelp(form);
        savedId = res.data?.id;
        toast.success('Daily help registered successfully');
      }
      if (photoFile && savedId) {
        try {
          if (isGuardView) await guardAPI.uploadDailyHelpPhoto(savedId, photoFile);
          else await userAPI.uploadDailyHelpPhoto(savedId, photoFile);
        } catch { toast.error('Staff saved but photo upload failed. You can try uploading again later.'); }
      }
      setModalOpen(false);
      setForm({ name: '', phone: '', category: 'MAID', unitNumber: '', workingDays: 'MON,TUE,WED,THU,FRI,SAT', timeSlot: '08:00-10:00' });
      setPhotoFile(null);
      fetchHelpers();
    } catch (err) {
      const msg = err.response?.data?.message;
      if (err.response?.status === 400) toast.error(msg || 'Please fill in all required fields (name and category).');
      else if (err.response?.status === 404) toast.error('Property not found. Please select a valid property.');
      else if (err.response?.status === 403) toast.error('You do not have permission to register staff.');
      else toast.error(msg || 'Something went wrong. Please try again.');
    }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (id) => {
    if (!await confirm({ title: 'Deactivate Staff', message: 'This staff will no longer be allowed entry. You can register them again later if needed.', confirmLabel: 'Deactivate', danger: true })) return;
    try {
      await userAPI.deactivateDailyHelp(id);
      toast.success('Staff deactivated. They will no longer be allowed entry.');
      fetchHelpers();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not deactivate staff. Please try again.'); }
  };

  const handleApprove = async (id) => {
    try {
      await userAPI.approveDailyHelp(id);
      toast.success('Staff approved! They can now enter the premises.');
      fetchHelpers();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not approve staff. Please try again.'); }
  };

  const handleReject = async (id) => {
    if (!await confirm({ title: 'Reject Staff', message: 'This staff request will be rejected and they will not be allowed entry.', confirmLabel: 'Reject', danger: true })) return;
    try {
      await userAPI.rejectDailyHelp(id);
      toast.success('Staff request rejected.');
      fetchHelpers();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not reject staff. Please try again.'); }
  };

  const handleCheckIn = async (id) => {
    try {
      await guardAPI.checkInDailyHelp(id);
      toast.success('Staff marked as present.');
      fetchHelpers();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not check in this staff. Please try again.'); }
  };

  const pendingHelpers = helpers.filter(h => h.status === 'PENDING_APPROVAL');
  const approvedHelpers = helpers.filter(h => h.status === 'APPROVED');

  // Guard filtering
  const filteredHelpers = isGuardView ? approvedHelpers.filter(h => {
    if (filterCategory && h.category !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return h.name?.toLowerCase().includes(q) || h.unitNumber?.toLowerCase().includes(q) || h.residentName?.toLowerCase().includes(q) || h.phone?.includes(q);
    }
    return true;
  }) : approvedHelpers;

  // Group by property for guard card view
  const grouped = {};
  filteredHelpers.forEach(h => {
    const key = h.unitNumber || 'Unknown';
    if (!grouped[key]) grouped[key] = { unitNumber: key, residentName: h.residentName, helpers: [] };
    grouped[key].helpers.push(h);
  });

  const categories = [...new Set(helpers.map(h => h.category))].sort();

  if (loading) return <ListSkeleton />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">{isGuardView ? 'Daily Help' : 'My Daily Help'}</h1>
          <p className="text-[13px] text-muted mt-0.5">{isGuardView ? `Manage daily help staff across all ${propertyLabel.toLowerCase()}s` : 'Manage your regular domestic help for easy gate entry'}</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> {isGuardView ? 'Register Staff' : 'Register Helper'}
        </button>
      </div>

      {/* Guard: Search, Filter, View Toggle */}
      {isGuardView && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, or property..."
              className="w-full pl-9 pr-4 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading placeholder:text-muted focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex bg-card-alt rounded-lg p-1 self-start">
            <button onClick={() => setViewMode('card')} className={`p-2 rounded-md transition-colors ${viewMode === 'card' ? 'bg-card text-heading shadow-sm' : 'text-muted hover:text-sub'}`} title="Card view">
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-card text-heading shadow-sm' : 'text-muted hover:text-sub'}`} title="List view">
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Resident: Pending approval requests */}
      {!isGuardView && pendingHelpers.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[14px] font-semibold text-heading mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" /> Pending Approvals ({pendingHelpers.length})
          </h2>
          <div className="space-y-3">
            {pendingHelpers.map((h) => (
              <div key={h.id} className="bg-card rounded-lg border-2 border-amber-300 dark:border-amber-500/30 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {h.photo ? (
                      <img src={h.photo} alt={h.name} className="w-12 h-12 rounded-full object-cover border-2 border-amber-200 dark:border-amber-500/30" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
                        <Camera className="w-5 h-5 text-amber-500" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-heading">{h.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${categoryBadge[h.category] || categoryBadge.OTHER}`}>{h.category}</span>
                      </div>
                      {h.phone && <p className="text-[13px] text-muted mt-0.5 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {h.phone}</p>}
                      {h.addedByName && <p className="text-[12px] text-muted mt-0.5">Added by: <span className="font-medium text-sub">{h.addedByName}</span></p>}
                      {h.timeSlot && <p className="text-[12px] text-muted mt-0.5"><Clock className="w-3 h-3 inline mr-1" />{h.timeSlot}{h.workingDays ? ` (${h.workingDays})` : ''}</p>}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${statusBadge.PENDING_APPROVAL}`}>Pending</span>
                </div>
                <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                  <button onClick={() => handleApprove(h.id)} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => handleReject(h.id)} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-[13px] font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guard: List view */}
      {isGuardView ? (
        filteredHelpers.length === 0 ? (
          <EmptyState icon={UserCheck} title="No daily help staff found" description={searchQuery || filterCategory ? 'Try adjusting your search or filter' : `Register staff for ${propertyLabel.toLowerCase()}s for seamless gate entry`} />
        ) : viewMode === 'list' ? (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead><tr className="border-b border-border bg-card-alt">
                  <th className="text-left px-4 py-2.5 font-medium text-muted">Staff</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted">Category</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted">{propertyLabel}</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted">Schedule</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted">Days</th>
                  <th className="px-4 py-2.5"></th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {filteredHelpers.map((h) => (
                    <tr key={h.id} className="hover:bg-card-hover">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          {h.photo ? (
                            <img src={h.photo} alt={h.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-card-alt flex items-center justify-center shrink-0">
                              <Camera className="w-3.5 h-3.5 text-muted" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-heading">{h.name}</p>
                            {h.phone && <p className="text-[11px] text-muted">{h.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${categoryBadge[h.category] || categoryBadge.OTHER}`}>{h.category}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="text-sub font-medium">{h.unitNumber}</p>
                        <p className="text-[11px] text-muted">{h.residentName}</p>
                      </td>
                      <td className="px-4 py-2.5 text-muted">{h.timeSlot || '-'}</td>
                      <td className="px-4 py-2.5">
                        {h.workingDays && (
                          <div className="flex gap-0.5">
                            {DAYS.map(d => (
                              <span key={d} className={`px-1 py-0.5 rounded text-[9px] font-medium ${
                                h.workingDays.includes(d)
                                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400'
                                  : 'bg-card-alt text-muted'
                              }`}>{d[0]}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => handleCheckIn(h.id)} className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[11px] font-medium hover:bg-indigo-700">Present</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Guard card view - grouped by property */
          <div className="space-y-6">
            {Object.values(grouped).map(({ unitNumber, residentName, helpers: group }) => (
              <div key={unitNumber}>
                <h2 className="text-[13px] font-semibold text-heading mb-2 flex items-center gap-2">
                  {propertyLabel} {unitNumber}
                  {residentName && <span className="text-[12px] font-normal text-muted">- {residentName}</span>}
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400">{group.length}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.map((h) => (
                    <div key={h.id} className="bg-card rounded-lg border border-border overflow-hidden">
                      <div className="px-4 py-3.5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {h.photo ? (
                              <img src={h.photo} alt={h.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-card-alt flex items-center justify-center shrink-0">
                                <Camera className="w-4 h-4 text-muted" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-[14px] font-semibold text-heading">{h.name}</h3>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${categoryBadge[h.category] || categoryBadge.OTHER}`}>{h.category}</span>
                              </div>
                              {h.phone && (
                                <p className="text-[12px] text-muted mt-0.5 flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {h.phone}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400 shrink-0">Active</span>
                        </div>

                        <div className="mt-3 pt-3 border-t border-border">
                          {h.timeSlot && (
                            <div className="flex items-center gap-1.5 text-[12px] text-sub mb-2">
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
                          <button onClick={() => handleCheckIn(h.id)} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-[12px] font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5" /> Mark Present
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Resident: Approved helpers */
        <>
          {approvedHelpers.length === 0 && pendingHelpers.length === 0 ? (
            <EmptyState icon={UserCheck} title="No daily help registered yet" description="Register your maid, cook, or other regular help for seamless gate entry" />
          ) : approvedHelpers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedHelpers.map((h) => (
                <div key={h.id} className="bg-card rounded-lg border border-border overflow-hidden">
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {h.photo ? (
                          <img src={h.photo} alt={h.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-card-alt flex items-center justify-center">
                            <Camera className="w-4 h-4 text-muted" />
                          </div>
                        )}
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
        </>
      )}

      {/* Register Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={isGuardView ? 'Register Staff for Property' : 'Register Daily Help'} full>
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[14px] font-semibold text-heading">{isGuardView ? 'Staff Details' : 'Helper Details'}</h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
              <button type="submit" disabled={saving || !form.name || (isGuardView && !form.unitNumber)} className="px-4 py-2 bg-indigo-600 text-white rounded text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">
                {saving ? <><ButtonSpinner /> Registering...</> : <><Save className="w-4 h-4" /> {isGuardView ? 'Register Staff' : 'Register Helper'}</>}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                {isGuardView && (
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">{propertyLabel} *</label>
                    <select value={form.unitNumber} onChange={(e) => setForm({ ...form, unitNumber: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required>
                      <option value="">Select {propertyLabel.toLowerCase()}</option>
                      {properties.map(p => <option key={p.unitNumber} value={p.unitNumber}>{p.unitNumber}{p.ownerName ? ` - ${p.ownerName}` : ''}</option>)}
                    </select>
                  </div>
                )}
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
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Category</label>
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
            <div className="space-y-6 md:sticky md:top-4 md:self-start">
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required placeholder="Full name" />
                </div>
                <PhotoPicker preview={null} onChange={(file) => setPhotoFile(file)} icon={UserCheck} bare />
              </div>
              {isGuardView && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
                  <p className="text-[12px] text-amber-700 dark:text-amber-400">This staff will need approval from the {propertyLabel.toLowerCase()} owner before they can enter.</p>
                </div>
              )}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
