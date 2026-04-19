import { ButtonSpinner } from '../components/Spinner';
import { StatSkeleton, TableSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useState, useEffect, useMemo } from 'react';
import { adminAPI } from '../services/api';
import Modal from '../components/Modal';
import { Plus, Lock, Unlock, Search, CheckCircle, XCircle, Clock, IndianRupee, Save, Landmark, ChevronDown } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import { useSocietyConfig } from '../context/SocietyConfigContext';
import { getTypeColor } from '../utils/typeColors';
const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
  APPROVED: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  RELEASED: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
};

const STATUS_ICONS = {
  PENDING: Clock, APPROVED: CheckCircle, RELEASED: Unlock, REJECTED: XCircle,
};

export default function FundReleases() {
  const confirm = useConfirm();
  const { incomeTypes } = useSocietyConfig();
  const FUND_TYPES = incomeTypes.filter(t => t.reserveFund).map(t => t.code);
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [form, setForm] = useState({ fundType: '', amount: '', reason: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [registerOpen, setRegisterOpen] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getFundReleases();
      setReleases(res.data);
    } catch (err) { console.error('Failed to load fund releases', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = () => {
    setForm({ fundType: FUND_TYPES[0] || '', amount: '', reason: '', notes: '' });
    setError(''); setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await adminAPI.createFundRelease(form);
      setModalOpen(false); fetchData();
    }
    catch (err) { setError(err.response?.data?.message || 'Failed to create release request'); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id) => {
    if (!await confirm({ title: 'Approve Fund Release', message: 'Approve this fund release request? The funds will be unlocked for use.', confirmLabel: 'Approve', danger: false })) return;
    try { await adminAPI.approveFundRelease(id); fetchData(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to approve'); }
  };

  const openRejectModal = (id) => {
    setRejectId(id); setRejectReason(''); setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setSaving(true);
    try {
      await adminAPI.rejectFundRelease(rejectId, { rejectionReason: rejectReason });
      setRejectModalOpen(false); fetchData();
    }
    catch (err) { alert(err.response?.data?.message || 'Failed to reject'); }
    finally { setSaving(false); }
  };

  const handleRelease = async (id) => {
    if (!await confirm({ title: 'Mark as Released', message: 'Confirm that these funds have been disbursed/used.', confirmLabel: 'Confirm Release', danger: false })) return;
    try { await adminAPI.markFundReleased(id); fetchData(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to mark as released'); }
  };

  const statusCounts = useMemo(() => {
    const counts = { PENDING: 0, APPROVED: 0, RELEASED: 0, REJECTED: 0 };
    releases.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
    return counts;
  }, [releases]);

  const allFiltered = releases.filter(r => {
    const matchSearch = !search || r.reason?.toLowerCase().includes(search.toLowerCase()) || r.requestedBy?.toLowerCase().includes(search.toLowerCase()) || r.notes?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || r.status === filterStatus;
    const matchType = !filterType || r.fundType === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const totalAmount = allFiltered.reduce((sum, r) => sum + Number(r.amount), 0);

  // Reserve fund summary from balance sheet
  const [reserveSummary, setReserveSummary] = useState(null);
  useEffect(() => {
    adminAPI.getBalanceSheet().then(res => {
      const d = res.data;
      setReserveSummary({
        totalReserve: d.totalReserveFunds,
        locked: d.lockedReserveFunds,
        released: d.releasedReserveFunds,
        breakdown: d.reserveBreakdown || [],
      });
    }).catch(() => {});
  }, [releases]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">Reserve Funds</h1>
          <p className="text-[13px] text-muted mt-0.5">Manage Corpus & Membership fund releases</p>
        </div>
        <button onClick={openModal} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Request Release
        </button>
      </div>

      {/* Reserve Fund Overview */}
      {reserveSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-lg border border-border p-5 stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Total Reserve</p>
                <p className="text-[22px] font-bold text-heading mt-1">₹{fmt(reserveSummary.totalReserve)}</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/15 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-5 stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Locked</p>
                <p className="text-[22px] font-bold text-amber-600 dark:text-amber-400 mt-1">₹{fmt(reserveSummary.locked)}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/15 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-5 stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Released</p>
                <p className="text-[22px] font-bold text-green-600 dark:text-green-400 mt-1">₹{fmt(reserveSummary.released)}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-500/15 rounded-lg flex items-center justify-center">
                <Unlock className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Per-fund breakdown */}
      {reserveSummary && reserveSummary.breakdown.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {reserveSummary.breakdown.map(b => {
            return (
              <div key={b.fundType} className="bg-card rounded-lg border border-border p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeColor(b.fundType)}`}>
                    <Landmark className="w-4 h-4" />
                  </div>
                  <h3 className="text-[14px] font-semibold text-heading">{b.fundType} Fund</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted">Collected</span>
                    <span className="font-medium text-heading">₹{fmt(b.collected)}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted">Released</span>
                    <span className="font-medium text-green-600 dark:text-green-400">₹{fmt(b.released)}</span>
                  </div>
                  <div className="flex justify-between text-[13px] pt-1 border-t border-dashed border-border">
                    <span className="text-muted font-medium">Locked</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">₹{fmt(b.locked)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pending', key: 'PENDING', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-500/15', Icon: Clock },
          { label: 'Approved', key: 'APPROVED', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/15', Icon: CheckCircle },
          { label: 'Released', key: 'RELEASED', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-500/15', Icon: Unlock },
          { label: 'Rejected', key: 'REJECTED', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-500/15', Icon: XCircle },
        ].map(s => (
          <button key={s.key} onClick={() => { setFilterStatus(filterStatus === s.key ? '' : s.key); }}
            className={`bg-card rounded-lg border p-4 stat-card text-left transition-all ${filterStatus === s.key ? 'border-indigo-500 ring-1 ring-indigo-500/30' : 'border-border'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted uppercase tracking-wider">{s.label}</p>
                <p className={`text-[22px] font-bold ${s.color} mt-1`}>{statusCounts[s.key]}</p>
              </div>
              <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center`}>
                <s.Icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Release Register */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <button onClick={() => setRegisterOpen(!registerOpen)} className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-card-hover transition-colors">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h2 className="text-[14px] font-semibold text-heading">Release Requests</h2>
            <span className="text-[11px] text-muted px-2 py-0.5 bg-card-alt rounded">{releases.length} entries</span>
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
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search releases..." className="w-full pl-10 pr-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading placeholder:text-muted" />
            </div>
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading">
            <option value="">All Fund Types</option>
            {FUND_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading">
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="RELEASED">Released</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Table */}
        {loading ? <div className="space-y-6"><StatSkeleton count={3} /><TableSkeleton /></div> : (
          <div className="table-container">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Date</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Fund Type</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Reason</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Requested By</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Status</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Amount</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt w-36">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allFiltered.map((rel) => {
                  const SIcon = STATUS_ICONS[rel.status] || Clock;
                  return (
                  <tr key={rel.id} className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                    <td className="px-5 py-3 text-[13px] text-muted">{rel.createdAt?.split('T')[0]}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${getTypeColor(rel.fundType)}`}>
                        {rel.fundType?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-[13px] text-heading">{rel.reason}</p>
                      {rel.notes && <p className="text-[11px] text-muted truncate max-w-[200px]">{rel.notes}</p>}
                      {rel.rejectionReason && <p className="text-[11px] text-red-500 mt-0.5">Rejected: {rel.rejectionReason}</p>}
                    </td>
                    <td className="px-5 py-3 text-[13px] text-heading">{rel.requestedBy}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${STATUS_COLORS[rel.status] || ''}`}>
                        <SIcon className="w-3 h-3" />{rel.status}
                      </span>
                      {rel.approvedBy && <p className="text-[10px] text-muted mt-0.5">by {rel.approvedBy}</p>}
                    </td>
                    <td className="px-5 py-3 text-right text-[13px] font-semibold text-heading">₹{fmt(rel.amount)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {rel.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleApprove(rel.id)} title="Approve" className="p-1.5 text-muted hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded transition-colors"><CheckCircle className="w-4 h-4" /></button>
                            <button onClick={() => openRejectModal(rel.id)} title="Reject" className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"><XCircle className="w-4 h-4" /></button>
                          </>
                        )}
                        {rel.status === 'APPROVED' && (
                          <button onClick={() => handleRelease(rel.id)} title="Mark as Released" className="p-1.5 text-muted hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 rounded transition-colors"><Unlock className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
                {allFiltered.length === 0 && <tr><td colSpan={7}><EmptyState icon={Lock} title="No release requests" description="No fund release requests match the current filters." /></td></tr>}
              </tbody>
              {allFiltered.length > 0 && <tfoot><tr className="bg-indigo-50 dark:bg-indigo-500/10 border-t-2 border-indigo-200 dark:border-indigo-500/20"><td colSpan={5} className="px-5 py-3 text-[13px] font-semibold text-indigo-800 dark:text-indigo-400">Total</td><td className="px-5 py-3 text-right text-[13px] font-bold text-indigo-800 dark:text-indigo-400">₹{fmt(totalAmount)}</td><td></td></tr></tfoot>}
            </table>
          </div>
        )}
        </>
        )}
      </div>

      {/* Create Release Request Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Request Fund Release" full>
        {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-lg text-[13px]">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[14px] font-semibold text-heading">Release Details</h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
              <button type="submit" disabled={saving || !form.fundType || !form.amount || !form.reason} className="px-4 py-2 bg-indigo-600 text-white rounded text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">
                {saving ? <><ButtonSpinner /> Submitting...</> : <><Save className="w-4 h-4" /> Submit Request</>}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Fund Type *</label>
                  <select value={form.fundType} onChange={(e) => setForm({ ...form, fundType: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                    {incomeTypes.filter(t => t.reserveFund).map(t => (
                      <option key={t.code} value={t.code}>{t.displayName} Fund</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Amount *</label>
                  <input type="number" min="1" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required placeholder="Enter amount to release" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Reason *</label>
                  <textarea rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading resize-none" required placeholder="Justification for releasing these funds" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Notes</label>
                  <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading resize-none" placeholder="Additional notes (optional)" />
                </div>
              </div>
            </div>
            <div className="space-y-6 md:sticky md:top-4 md:self-start">
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-5">
                <h2 className="text-[14px] font-semibold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-2"><Lock className="w-4 h-4" /> Important</h2>
                <p className="text-[12px] text-amber-700 dark:text-amber-400">
                  Reserve funds are locked by default. This request will need approval from an authorized committee member before the funds can be used.
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-[14px] font-semibold text-heading mb-1">Workflow</h2>
                <p className="text-[11px] text-muted mb-3">Fund release approval flow:</p>
                <div className="flex items-center gap-1 text-[11px] text-muted">
                  <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-500/15 rounded text-yellow-700 dark:text-yellow-400">Pending</span>
                  <span>→</span>
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-500/15 rounded text-green-700 dark:text-green-400">Approved</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Reject Modal */}
      <Modal open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Reject Fund Release">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[14px] font-semibold text-heading">Rejection Details</h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setRejectModalOpen(false)} className="px-4 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
              <button onClick={handleReject} disabled={saving || !rejectReason.trim()} className="px-4 py-2 bg-red-600 text-white rounded text-[13px] font-medium hover:bg-red-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">
                {saving ? <><ButtonSpinner /> Rejecting...</> : <><XCircle className="w-4 h-4" /> Reject</>}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-heading mb-1">Rejection Reason *</label>
            <textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading resize-none" required placeholder="Provide a reason for rejection" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
