import { ButtonSpinner } from '../components/Spinner';
import { ListSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useState, useEffect } from 'react';
import { adminAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { Plus, Trash2, BarChart3, CheckCircle2, Clock, X as XIcon, ToggleLeft, ToggleRight, Save } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';

const emptyForm = { question: '', description: '', options: ['', ''], expiresAt: '', multipleChoice: false };

export default function Polls() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [voting, setVoting] = useState(null);

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const res = isAdmin ? await adminAPI.getPolls() : await userAPI.getPolls();
      setPolls(res.data);
    } catch (err) { console.error('Failed to load polls', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPolls(); }, []);

  const openCreate = () => { setForm(emptyForm); setError(''); setModalOpen(true); };

  const addOption = () => setForm({ ...form, options: [...form.options, ''] });
  const removeOption = (idx) => setForm({ ...form, options: form.options.filter((_, i) => i !== idx) });
  const updateOption = (idx, val) => setForm({ ...form, options: form.options.map((o, i) => i === idx ? val : o) });

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    const validOptions = form.options.filter(o => o.trim());
    if (validOptions.length < 2) { setError('At least 2 options required'); setSaving(false); return; }
    try {
      await adminAPI.createPoll({ ...form, options: validOptions });
      toast.success('Poll created');
      setModalOpen(false);
      fetchPolls();
    } catch (err) { setError(err.response?.data?.message || 'Failed to create poll'); }
    finally { setSaving(false); }
  };

  const handleVote = async (pollId, optionId) => {
    setVoting(pollId);
    try {
      await userAPI.votePoll(pollId, { optionId });
      toast.success('Vote recorded');
      fetchPolls();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to vote'); }
    finally { setVoting(null); }
  };

  const handleToggle = async (id) => {
    try { await adminAPI.togglePoll(id); fetchPolls(); }
    catch { toast.error('Failed to update poll'); }
  };

  const handleDelete = async (id) => {
    if (!await confirm({ title: 'Delete Poll', message: 'Are you sure you want to delete this poll and all votes? This action cannot be undone.', confirmLabel: 'Delete', danger: true })) return;
    try { await adminAPI.deletePoll(id); toast.success('Poll deleted'); fetchPolls(); }
    catch { toast.error('Failed to delete poll'); }
  };

  if (loading) return <ListSkeleton />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">Polls & Voting</h1>
          <p className="text-[13px] text-muted mt-0.5">{isAdmin ? 'Create and manage community polls' : 'Participate in community decisions'}</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" /> Create Poll
          </button>
        )}
      </div>

      {polls.length === 0 ? (
        <EmptyState icon={BarChart3} title="No polls yet" description="Community polls and voting will appear here" />
      ) : (
        <div className="space-y-4">
          {polls.map(poll => {
            const isExpired = poll.expiresAt && new Date(poll.expiresAt) < new Date();
            const showResults = poll.hasVoted || isExpired || !poll.active;

            return (
              <div key={poll.id} className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        {poll.active && !isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
                            <CheckCircle2 className="w-3 h-3" />Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-500 dark:bg-gray-500/15 dark:text-gray-400">
                            <Clock className="w-3 h-3" />{isExpired ? 'Expired' : 'Inactive'}
                          </span>
                        )}
                        <span className="text-[11px] text-muted">{poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}</span>
                        {poll.hasVoted && <span className="text-[11px] text-green-600 dark:text-green-400 font-medium">Voted</span>}
                      </div>
                      <h3 className="text-[15px] font-semibold text-heading">{poll.question}</h3>
                      {poll.description && <p className="text-[13px] text-sub mt-1">{poll.description}</p>}
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleToggle(poll.id)} className="p-1.5 text-muted hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded transition-colors" title={poll.active ? 'Deactivate' : 'Activate'}>
                          {poll.active ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button onClick={() => handleDelete(poll.id)} className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Options / Voting */}
                  <div className="mt-4 space-y-2">
                    {poll.options.map(opt => {
                      const pct = poll.totalVotes > 0 ? (opt.voteCount / poll.totalVotes * 100) : 0;
                      const isVotedOption = poll.votedOptionId === opt.id;

                      if (showResults) {
                        return (
                          <div key={opt.id} className={`relative rounded-lg overflow-hidden border ${isVotedOption ? 'border-indigo-300 dark:border-indigo-500/40' : 'border-border'}`}>
                            <div className="absolute inset-0 bg-indigo-100 dark:bg-indigo-500/10 rounded-lg" style={{ width: `${pct}%` }} />
                            <div className="relative px-4 py-2.5 flex items-center justify-between">
                              <span className={`text-[13px] ${isVotedOption ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-heading'}`}>
                                {isVotedOption && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
                                {opt.optionText}
                              </span>
                              <span className="text-[12px] font-medium text-muted">{pct.toFixed(0)}% ({opt.voteCount})</span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleVote(poll.id, opt.id)}
                          disabled={voting === poll.id}
                          className="w-full text-left px-4 py-2.5 rounded-lg border border-border hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 dark:hover:border-indigo-500/40 transition-colors text-[13px] text-heading"
                        >
                          {opt.optionText}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3 mt-3 text-[11px] text-muted">
                    {poll.createdByName && <span>By {poll.createdByName}</span>}
                    {poll.createdAt && <span>{new Date(poll.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                    {poll.expiresAt && <span>Expires: {poll.expiresAt}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Poll Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Poll" full>
        {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-lg text-[13px]">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h2 className="text-[14px] font-semibold text-heading mb-2">Poll Details</h2>
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Question *</label>
                  <input type="text" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required placeholder="What do you want to ask?" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Description</label>
                  <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="Additional context" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Options</label>
                  <div className="space-y-2">
                    {form.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input type="text" value={opt} onChange={(e) => updateOption(idx, e.target.value)} className="flex-1 px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder={`Option ${idx + 1}`} />
                        {form.options.length > 2 && (
                          <button type="button" onClick={() => removeOption(idx)} className="p-1.5 text-muted hover:text-red-600 rounded"><XIcon className="w-4 h-4" /></button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addOption} className="mt-2 text-[12px] text-indigo-600 dark:text-indigo-400 font-medium hover:underline">+ Add option</button>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-border rounded-lg text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    {saving ? <><ButtonSpinner /> Creating...</> : <><Save className="w-4 h-4" /> Create Poll</>}
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-6 md:sticky md:top-4 md:self-start">
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-[14px] font-semibold text-heading mb-1">Expiry</h2>
                <p className="text-[11px] text-muted mb-3">Optionally set when this poll closes.</p>
                <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" />
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
