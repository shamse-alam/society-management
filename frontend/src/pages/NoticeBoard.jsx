import { ButtonSpinner } from '../components/Spinner';
import { ListSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useState, useEffect } from 'react';
import { adminAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, Megaphone, AlertTriangle, Calendar, Clock, User, Search, Filter, ChevronDown, Save } from 'lucide-react';

const CATEGORIES = ['GENERAL', 'MAINTENANCE', 'EVENT', 'EMERGENCY', 'MEETING'];
const PRIORITIES = ['NORMAL', 'IMPORTANT', 'URGENT'];

const CATEGORY_COLORS = {
  GENERAL: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  MAINTENANCE: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  EVENT: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  EMERGENCY: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  MEETING: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
};

const PRIORITY_COLORS = {
  NORMAL: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400',
  IMPORTANT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};

const PRIORITY_BORDER = {
  NORMAL: 'border-l-gray-300 dark:border-l-gray-600',
  IMPORTANT: 'border-l-yellow-400 dark:border-l-yellow-500',
  URGENT: 'border-l-red-500 dark:border-l-red-500',
};

const emptyForm = { title: '', content: '', category: 'GENERAL', priority: 'NORMAL', attachmentUrl: '', expiresAt: '', active: true };

export default function NoticeBoard() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = isAdmin ? await adminAPI.getNotices() : await userAPI.getNotices();
      setNotices(res.data);
    } catch (err) { console.error('Failed to load notices', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotices(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (notice) => {
    setEditingId(notice.id);
    setForm({
      title: notice.title,
      content: notice.content || '',
      category: notice.category,
      priority: notice.priority,
      attachmentUrl: notice.attachmentUrl || '',
      expiresAt: notice.expiresAt || '',
      active: notice.active,
    });
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editingId) {
        await adminAPI.updateNotice(editingId, form);
        toast.success('Notice updated');
      } else {
        await adminAPI.createNotice(form);
        toast.success('Notice published');
      }
      setModalOpen(false);
      fetchNotices();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save notice');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notice?')) return;
    try {
      await adminAPI.deleteNotice(id);
      toast.success('Notice deleted');
      fetchNotices();
    } catch { toast.error('Failed to delete notice'); }
  };

  const filtered = notices.filter(n => {
    const matchSearch = !search || n.title?.toLowerCase().includes(search.toLowerCase()) || n.content?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !filterCategory || n.category === filterCategory;
    const matchPriority = !filterPriority || n.priority === filterPriority;
    return matchSearch && matchCategory && matchPriority;
  });

  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  if (loading) return <ListSkeleton />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">Notice Board</h1>
          <p className="text-[13px] text-muted mt-0.5">
            {isAdmin ? 'Manage society announcements and notices' : 'Society announcements and updates'}
          </p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" /> New Notice
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }} placeholder="Search notices..." className="w-full pl-10 pr-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading placeholder:text-muted" />
          </div>
        </div>
        <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setVisibleCount(PAGE_SIZE); }} className="px-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value); setVisibleCount(PAGE_SIZE); }} className="px-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading">
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Notice Cards */}
      {filtered.length === 0 ? (
        <EmptyState icon={Megaphone} title="No notices yet" description="Notices posted by the admin will appear here" />
      ) : (
        <div className="space-y-4">
          {visible.map(notice => (
            <div key={notice.id} className={`bg-card rounded-lg border border-border border-l-4 ${PRIORITY_BORDER[notice.priority] || PRIORITY_BORDER.NORMAL} overflow-hidden`}>
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${CATEGORY_COLORS[notice.category] || CATEGORY_COLORS.GENERAL}`}>{notice.category}</span>
                      {notice.priority !== 'NORMAL' && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${PRIORITY_COLORS[notice.priority]}`}>
                          {notice.priority === 'URGENT' && <AlertTriangle className="w-3 h-3" />}
                          {notice.priority}
                        </span>
                      )}
                      {isAdmin && !notice.active && (
                        <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-500 dark:bg-gray-500/15 dark:text-gray-400">INACTIVE</span>
                      )}
                    </div>
                    <h3 className="text-[15px] font-semibold text-heading">{notice.title}</h3>
                    {notice.content && (
                      <p className="text-[13px] text-sub mt-1.5 whitespace-pre-line">{notice.content}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-[11px] text-muted">
                      {notice.postedByName && (
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{notice.postedByName}</span>
                      )}
                      {notice.createdAt && (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(notice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      )}
                      {notice.expiresAt && (
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Expires: {notice.expiresAt}</span>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEdit(notice)} className="p-1.5 text-muted hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(notice.id)} className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="text-center py-3">
              <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)} className="text-[13px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">
                Show more ({filtered.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Notice' : 'New Notice'} full>
        {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-lg text-[13px]">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h2 className="text-[14px] font-semibold text-heading mb-2">Notice Details</h2>
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Title *</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required placeholder="Notice title" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Content</label>
                  <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading resize-none" placeholder="Notice details..." />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-border rounded-lg text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving ? <><ButtonSpinner /> Saving...</> : <><Save className="w-4 h-4" /> {editingId ? 'Update Notice' : 'Publish Notice'}</>}
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-6 md:sticky md:top-4 md:self-start">
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-[14px] font-semibold text-heading mb-1">Category & Priority</h2>
                <p className="text-[11px] text-muted mb-3">Classify the notice for filtering.</p>
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
                <h2 className="text-[14px] font-semibold text-heading mb-1">Expiry</h2>
                <p className="text-[11px] text-muted mb-3">Optionally set when this notice expires.</p>
                <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" />
                {editingId && (
                  <label className="flex items-center gap-2 text-[13px] text-heading cursor-pointer mt-3">
                    <input type="checkbox" id="noticeActive" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded border-input-border text-indigo-600 focus:ring-indigo-500" />
                    Active
                  </label>
                )}
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
