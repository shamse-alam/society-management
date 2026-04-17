import { ButtonSpinner } from '../components/Spinner';
import { ListSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { MessageSquare, Clock, CheckCircle2, AlertCircle, XCircle, Search, ChevronDown, Paperclip, Image, Save } from 'lucide-react';
import { useSocietyConfig } from '../context/SocietyConfigContext';

const STATUS_CONFIG = {
  OPEN: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400', icon: AlertCircle },
  IN_PROGRESS: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400', icon: Clock },
  RESOLVED: { color: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400', icon: CheckCircle2 },
  CLOSED: { color: 'bg-gray-100 text-gray-500 dark:bg-gray-500/15 dark:text-gray-400', icon: XCircle },
};

const PRIORITY_COLORS = {
  LOW: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
  HIGH: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};

const CATEGORY_COLORS = {
  PLUMBING: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
  ELECTRICAL: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
  HOUSEKEEPING: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400',
  SECURITY: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  PARKING: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  NOISE: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  GENERAL: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
  OTHER: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400',
};

export default function ComplaintManagement() {
  const toast = useToast();
  const { config } = useSocietyConfig();
  const propertyLabel = config?.propertyLabel || 'Property';
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: '', adminRemarks: '' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [registerOpen, setRegisterOpen] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, statsRes] = await Promise.all([adminAPI.getComplaints(), adminAPI.getComplaintStats()]);
      setComplaints(compRes.data);
      setStats(statsRes.data);
    } catch (err) { console.error('Failed to load complaints', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openUpdate = (complaint) => {
    setSelected(complaint);
    setUpdateForm({ status: complaint.status, adminRemarks: complaint.adminRemarks || '' });
    setModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await adminAPI.updateComplaint(selected.id, updateForm);
      toast.success('Complaint updated');
      setModalOpen(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
    finally { setSaving(false); }
  };

  const filtered = complaints.filter(c => {
    const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.userName?.toLowerCase().includes(search.toLowerCase()) || c.userUnit?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || c.status === filterStatus;
    const matchCategory = !filterCategory || c.category === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  const PAGE_SIZE = 30;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  if (loading) return <ListSkeleton />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">Complaint Management</h1>
          <p className="text-[13px] text-muted mt-0.5">Manage resident complaints and service requests</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Open', key: 'OPEN', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/15', icon: AlertCircle },
          { label: 'In Progress', key: 'IN_PROGRESS', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-500/15', icon: Clock },
          { label: 'Resolved', key: 'RESOLVED', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-500/15', icon: CheckCircle2 },
          { label: 'Closed', key: 'CLOSED', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-500/15', icon: XCircle },
        ].map(s => (
          <div key={s.key} className="bg-card rounded-lg border border-border p-5 stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted uppercase tracking-wider">{s.label}</p>
                <p className={`text-[22px] font-bold mt-1 ${s.color}`}>{stats[s.key] || 0}</p>
              </div>
              <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <button onClick={() => setRegisterOpen(!registerOpen)} className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-card-hover transition-colors">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-[14px] font-semibold text-heading">All Complaints</h2>
            <span className="text-[11px] text-muted px-2 py-0.5 bg-card-alt rounded">{complaints.length} total</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 ${registerOpen ? 'rotate-180' : ''}`} />
        </button>

        {registerOpen && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap items-end gap-3 px-5 py-3 border-t border-border">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }} placeholder={`Search by name, ${propertyLabel.toLowerCase()}, title...`} className="w-full pl-10 pr-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading placeholder:text-muted" />
                </div>
              </div>
              <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setVisibleCount(PAGE_SIZE); }} className="px-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading">
                <option value="">All Status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
              <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setVisibleCount(PAGE_SIZE); }} className="px-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading">
                <option value="">All Categories</option>
                {['PLUMBING', 'ELECTRICAL', 'HOUSEKEEPING', 'SECURITY', 'PARKING', 'NOISE', 'GENERAL', 'OTHER'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="table-container">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Date</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Resident</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Title</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Category</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Priority</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Status</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(c => {
                    const statusCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.OPEN;
                    const StatusIcon = statusCfg.icon;
                    return (
                      <tr key={c.id} className="border-b border-dashed border-border hover:bg-card-hover transition-colors cursor-pointer" onClick={() => openUpdate(c)}>
                        <td className="px-5 py-3 text-[13px] text-muted">{new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                        <td className="px-5 py-3">
                          <div className="text-[13px] font-medium text-heading">{c.userName}</div>
                          {c.userUnit && <div className="text-[11px] text-muted">{propertyLabel} {c.userUnit}</div>}
                        </td>
                        <td className="px-5 py-3 text-[13px] text-heading max-w-[250px] truncate">{c.title}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${CATEGORY_COLORS[c.category] || CATEGORY_COLORS.OTHER}`}>{c.category}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${PRIORITY_COLORS[c.priority] || PRIORITY_COLORS.MEDIUM}`}>{c.priority}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${statusCfg.color}`}>
                            <StatusIcon className="w-3 h-3" />{c.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button className="text-[12px] text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Update</button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && <tr><td colSpan={7}><EmptyState icon={MessageSquare} title="No complaints found" description="There are no complaints matching your filter criteria." /></td></tr>}
                </tbody>
              </table>
              {hasMore && (
                <div className="px-5 py-3 border-t border-border text-center">
                  <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)} className="text-[13px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">
                    Show more ({filtered.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Update Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Update Complaint" full>
        {selected && (
          <form onSubmit={handleUpdate}>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <h2 className="text-[14px] font-semibold text-heading mb-2">Complaint Details</h2>
                  <div className="p-3 bg-card-alt rounded-lg border border-border">
                    <span className="text-[13px] font-semibold text-heading">{selected.title}</span>
                    <p className="text-[12px] text-muted mt-0.5">{selected.userName}{selected.userUnit ? ` — ${propertyLabel} ${selected.userUnit}` : ''}</p>
                    {selected.description && <p className="text-[13px] text-sub mt-2">{selected.description}</p>}
                    {selected.attachmentUrl && (
                      <div className="mt-3">
                        {selected.attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img src={selected.attachmentUrl} alt="Attachment" className="max-w-xs rounded-lg border border-border" />
                        ) : (
                          <a href={selected.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] text-indigo-600 dark:text-indigo-400 hover:underline">
                            <Paperclip className="w-3.5 h-3.5" /> View Attachment
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Admin Remarks</label>
                    <textarea value={updateForm.adminRemarks} onChange={(e) => setUpdateForm({ ...updateForm, adminRemarks: e.target.value })} rows={3} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading resize-none" placeholder="Add remarks or resolution notes..." />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-border rounded-lg text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
                    <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                      {saving ? <><ButtonSpinner /> Updating...</> : <><Save className="w-4 h-4" /> Update Complaint</>}
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-6 md:sticky md:top-4 md:self-start">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="text-[14px] font-semibold text-heading mb-1">Status</h2>
                  <p className="text-[11px] text-muted mb-3">Update the complaint resolution status.</p>
                  <select value={updateForm.status} onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
