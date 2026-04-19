import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ListSkeleton } from '../components/Skeleton';
import { ButtonSpinner } from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { MessageCircle, Plus, Pin, Lock, Trash2, Clock, User, Save } from 'lucide-react';

const forumCategories = ['ALL', 'GENERAL', 'MAINTENANCE', 'SECURITY', 'EVENTS', 'SUGGESTIONS', 'OTHER'];

const catColors = {
  GENERAL: 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400',
  MAINTENANCE: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  SECURITY: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  EVENTS: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  SUGGESTIONS: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  OTHER: 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Forum() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeCat, setActiveCat] = useState('ALL');
  const [form, setForm] = useState({ title: '', category: 'GENERAL', content: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTopics(); }, [activeCat]);

  const fetchTopics = async () => {
    try {
      const cat = activeCat === 'ALL' ? null : activeCat;
      const res = await userAPI.getForumTopics(cat);
      setTopics(res.data);
    } catch {
      toast.error('Failed to load forum topics');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userAPI.createForumTopic(form);
      toast.success('Topic created');
      setShowModal(false);
      setForm({ title: '', category: 'GENERAL', content: '' });
      fetchTopics();
    } catch {
      toast.error('Failed to create topic');
    } finally {
      setSaving(false);
    }
  };

  const handlePin = async (id) => {
    try {
      await adminAPI.pinForumTopic(id);
      fetchTopics();
    } catch {
      toast.error('Failed to pin topic');
    }
  };

  const handleLock = async (id) => {
    try {
      await adminAPI.lockForumTopic(id);
      fetchTopics();
    } catch {
      toast.error('Failed to lock topic');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this topic?')) return;
    try {
      await adminAPI.deleteForumTopic(id);
      toast.success('Topic deleted');
      fetchTopics();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <ListSkeleton />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">Discussion Forum</h1>
          <p className="text-[13px] text-muted mt-0.5">{topics.length} topics</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> New Topic
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {forumCategories.map(cat => (
          <button key={cat} onClick={() => { setActiveCat(cat); setLoading(true); }}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-colors ${
              activeCat === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-card border border-border text-muted hover:text-heading hover:bg-card-alt'
            }`}>
            {cat === 'ALL' ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase().replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Topic List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
        {topics.length === 0 ? (
          <EmptyState icon={MessageCircle} title="No topics yet" description="Start a discussion with your community" />
        ) : topics.map(t => (
          <div key={t.id} className="px-5 py-4 hover:bg-card-alt/50 transition-colors cursor-pointer flex items-center gap-4"
               onClick={() => navigate(`/forum/${t.id}`)}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {t.pinned && <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                {t.locked && <Lock className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                <p className="text-[13px] font-semibold text-heading truncate">{t.title}</p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${catColors[t.category] || catColors.OTHER}`}>
                  {t.category}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[12px] text-muted">
                <span className="flex items-center gap-1"><User className="w-3 h-3" />{t.createdByName}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{t.replyCount} replies</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(t.lastActivityAt)}</span>
              </div>
            </div>
            {isAdmin && (
              <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                <button onClick={() => handlePin(t.id)} className={`p-1.5 rounded-lg transition-colors ${t.pinned ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'text-muted hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'}`}>
                  <Pin className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleLock(t.id)} className={`p-1.5 rounded-lg transition-colors ${t.locked ? 'text-red-500 bg-red-50 dark:bg-red-500/10' : 'text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'}`}>
                  <Lock className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(t.id)} className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <Modal open title="New Discussion Topic" onClose={() => setShowModal(false)} full>
          <form onSubmit={handleCreate}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[14px] font-semibold text-heading">Topic Details</h2>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
                <button type="submit" disabled={saving || !form.title || !form.content} className="px-4 py-2 bg-indigo-600 text-white rounded text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">{saving ? <><ButtonSpinner /> Saving...</> : <><Save className="w-4 h-4" /> Create Topic</>}</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Title *</label>
                    <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                      className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="Topic title" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Content *</label>
                    <textarea required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                      className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading resize-none" rows={5} placeholder="Start the discussion..." />
                  </div>
                </div>
              </div>
              <div className="space-y-6 md:sticky md:top-4 md:self-start">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="text-[14px] font-semibold text-heading mb-1">Category</h2>
                  <p className="text-[11px] text-muted mb-3">Choose the topic category for filtering.</p>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                    {forumCategories.filter(c => c !== 'ALL').map(c => <option key={c} value={c}>{c}</option>)}
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
