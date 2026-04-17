import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userAPI, adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ListSkeleton } from '../components/Skeleton';
import { ArrowLeft, Send, Trash2, Pin, Lock, MessageCircle, User, Clock } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function ForumTopicPage() {
  const { id } = useParams();
  const { isAdmin, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [topics, setTopics] = useState([]);
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const [postsRes, topicsRes] = await Promise.all([
        userAPI.getTopicPosts(id),
        userAPI.getForumTopics(),
      ]);
      setPosts(postsRes.data);
      const t = topicsRes.data.find(t => t.id === Number(id));
      setTopic(t);
      setTopics(topicsRes.data);
    } catch {
      toast.error('Failed to load topic');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSubmitting(true);
    try {
      await userAPI.replyToTopic(id, { content: reply });
      setReply('');
      toast.success('Reply posted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Delete this post?')) return;
    try {
      isAdmin ? await adminAPI.deleteForumPost(postId) : await userAPI.deleteForumPost(postId);
      toast.success('Post deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete post');
    }
  };

  if (loading) return <ListSkeleton />;
  if (!topic) return (
    <div className="text-center py-12">
      <p className="text-heading font-medium">Topic not found</p>
      <button onClick={() => navigate('/forum')} className="mt-3 text-indigo-600 text-[13px] font-medium">Back to Forum</button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => navigate('/forum')} className="flex items-center gap-1.5 text-[13px] text-muted hover:text-heading transition-colors mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Forum
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {topic.pinned && <Pin className="w-4 h-4 text-amber-500" />}
              {topic.locked && <Lock className="w-4 h-4 text-red-500" />}
              <h1 className="text-xl font-bold text-heading">{topic.title}</h1>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-[12px] text-muted">
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{topic.createdByName}</span>
              <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{topic.replyCount} replies</span>
              <span className="px-2 py-0.5 bg-card-alt rounded-full text-[10px] font-semibold">{topic.category}</span>
            </div>
          </div>
          {isAdmin && (
            <div className="flex gap-1 shrink-0">
              <button onClick={async () => { await adminAPI.pinForumTopic(id); fetchData(); }}
                className={`p-2 rounded-lg transition-colors ${topic.pinned ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'text-muted hover:text-amber-500 hover:bg-amber-50'}`} title="Pin">
                <Pin className="w-4 h-4" />
              </button>
              <button onClick={async () => { await adminAPI.lockForumTopic(id); fetchData(); }}
                className={`p-2 rounded-lg transition-colors ${topic.locked ? 'text-red-500 bg-red-50 dark:bg-red-500/10' : 'text-muted hover:text-red-500 hover:bg-red-50'}`} title="Lock">
                <Lock className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((p, i) => (
          <div key={p.id} className={`bg-card border rounded-xl p-5 ${p.originalPost ? 'border-indigo-200 dark:border-indigo-500/30' : 'border-border'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-500/15 rounded-full flex items-center justify-center">
                  <span className="text-[12px] font-bold text-indigo-600 dark:text-indigo-400">{p.authorName?.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-heading">{p.authorName}</p>
                  <p className="text-[11px] text-muted flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(p.createdAt)}</p>
                </div>
                {p.originalPost && <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-semibold">OP</span>}
              </div>
              {(isAdmin || p.authorName === user?.fullName) && !p.originalPost && (
                <button onClick={() => handleDeletePost(p.id)} className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="text-[13px] text-heading leading-relaxed whitespace-pre-wrap">{p.content}</div>
          </div>
        ))}
      </div>

      {/* Reply */}
      {!topic.locked ? (
        <form onSubmit={handleReply} className="bg-card border border-border rounded-xl p-4">
          <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Write your reply..."
            className="w-full px-3 py-2 bg-body border border-border rounded-lg text-[13px] text-heading placeholder:text-muted resize-none" rows={3} />
          <div className="flex justify-end mt-3">
            <button type="submit" disabled={submitting || !reply.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              <Send className="w-4 h-4" /> {submitting ? 'Posting...' : 'Reply'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <Lock className="w-5 h-5 text-muted mx-auto mb-1" />
          <p className="text-[13px] text-muted">This topic is locked. No new replies can be posted.</p>
        </div>
      )}
    </div>
  );
}
