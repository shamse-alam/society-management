import { ButtonSpinner } from '../components/Spinner';
import { ListSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { Plus, MessageSquare, Clock, CheckCircle2, AlertCircle, XCircle, Search, Paperclip, Image, Save } from 'lucide-react';

const CATEGORIES = ['PLUMBING', 'ELECTRICAL', 'HOUSEKEEPING', 'SECURITY', 'PARKING', 'NOISE', 'GENERAL', 'OTHER'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

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

const emptyForm = { title: '', description: '', category: 'GENERAL', priority: 'MEDIUM' };

export default function Complaints() {
  const toast = useToast();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [attachmentFile, setAttachmentFile] = useState(null);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getMyComplaints();
      setComplaints(res.data);
    } catch (err) { console.error('Failed to load complaints', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComplaints(); }, []);

  const openCreate = () => { setForm(emptyForm); setError(''); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const res = await userAPI.createComplaint(form);
      if (attachmentFile) {
        try {
          await userAPI.uploadComplaintAttachment(res.data.id, attachmentFile);
        } catch (uploadErr) {
          toast.warning('Complaint created but attachment upload failed');
        }
      }
      toast.success('Complaint submitted');
      setModalOpen(false);
      setAttachmentFile(null);
      fetchComplaints();
    } catch (err) { setError(err.response?.data?.message || 'Failed to submit complaint'); }
    finally { setSaving(false); }
  };

  const filtered = complaints.filter(c => !filterStatus || c.status === filterStatus);

  const statCounts = {
    OPEN: complaints.filter(c => c.status === 'OPEN').length,
    IN_PROGRESS: complaints.filter(c => c.status === 'IN_PROGRESS').length,
    RESOLVED: complaints.filter(c => c.status === 'RESOLVED').length,
  };

  if (loading) return <ListSkeleton />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">My Complaints</h1>
          <p className="text-[13px] text-muted mt-0.5">Track your complaints and service requests</p>
        </div>
        <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Raise Complaint
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Open', count: statCounts.OPEN, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/15', icon: AlertCircle },
          { label: 'In Progress', count: statCounts.IN_PROGRESS, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-500/15', icon: Clock },
          { label: 'Resolved', count: statCounts.RESOLVED, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-500/15', icon: CheckCircle2 },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-lg border border-border p-5 stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted uppercase tracking-wider">{s.label}</p>
                <p className={`text-[22px] font-bold mt-1 ${s.color}`}>{s.count}</p>
              </div>
              <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading">
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* Complaint Cards */}
      {filtered.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No complaints yet" description="Complaints you raise will appear here" />
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const statusCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.OPEN;
            const StatusIcon = statusCfg.icon;
            return (
              <div key={c.id} className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${statusCfg.color}`}>
                          <StatusIcon className="w-3 h-3" />{c.status.replace(/_/g, ' ')}
                        </span>
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${CATEGORY_COLORS[c.category] || CATEGORY_COLORS.OTHER}`}>{c.category}</span>
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${PRIORITY_COLORS[c.priority] || PRIORITY_COLORS.MEDIUM}`}>{c.priority}</span>
                      </div>
                      <h3 className="text-[14px] font-semibold text-heading">{c.title}</h3>
                      {c.description && <p className="text-[13px] text-sub mt-1 whitespace-pre-line">{c.description}</p>}
                      {c.attachmentUrl && (
                        <div className="mt-3">
                          {c.attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img src={c.attachmentUrl} alt="Attachment" className="max-w-xs rounded-lg border border-border" />
                          ) : (
                            <a href={c.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] text-indigo-600 dark:text-indigo-400 hover:underline">
                              <Paperclip className="w-3.5 h-3.5" /> View Attachment
                            </a>
                          )}
                        </div>
                      )}
                      {c.adminRemarks && (
                        <div className="mt-3 p-3 bg-card-alt rounded border border-border">
                          <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">Admin Response</p>
                          <p className="text-[13px] text-heading">{c.adminRemarks}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted">
                        <span>{new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {c.resolvedAt && <span>Resolved: {new Date(c.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Raise Complaint" full>
        {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-lg text-[13px]">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[14px] font-semibold text-heading">Complaint Details</h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
              <button type="submit" disabled={saving || !form.title} className="px-4 py-2 bg-indigo-600 text-white rounded text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">
                {saving ? <><ButtonSpinner /> Submitting...</> : <><Save className="w-4 h-4" /> Submit Complaint</>}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Title *</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required placeholder="Brief description of the issue" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading resize-none" placeholder="Provide details about the issue..." />
                </div>
              </div>
            </div>
            <div className="space-y-6 md:sticky md:top-4 md:self-start">
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-[14px] font-semibold text-heading mb-1">Category & Priority</h2>
                <p className="text-[11px] text-muted mb-3">Classify the complaint for faster resolution.</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Category</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Priority</label>
                    <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                      {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-[14px] font-semibold text-heading mb-1">Attachment</h2>
                <p className="text-[11px] text-muted mb-3">Optionally attach a photo or document.</p>
                <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={(e) => setAttachmentFile(e.target.files[0])}
                  className="w-full text-[13px] text-heading file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-[13px] file:font-medium file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-500/10 dark:file:text-indigo-400 hover:file:bg-indigo-100" />
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
