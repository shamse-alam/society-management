import { ButtonSpinner } from '../components/Spinner';
import { StatSkeleton, TableSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useState, useEffect, useMemo } from 'react';
import { adminAPI } from '../services/api';
import Modal from '../components/Modal';
import { Plus, Search, CheckCircle, XCircle, Clock, Banknote, Save, ChevronDown, RotateCcw, Receipt } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import { useSocietyConfig, typeName } from '../context/SocietyConfigContext';
import { getTypeColor } from '../utils/typeColors';
const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
  APPROVED: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  PROCESSED: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
};

const STATUS_ICONS = {
  PENDING: Clock, APPROVED: CheckCircle, PROCESSED: Banknote, REJECTED: XCircle,
};

export default function Refunds() {
  const confirm = useConfirm();
  const { incomeTypes } = useSocietyConfig();
  const [refunds, setRefunds] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [form, setForm] = useState({ paymentId: '', amount: '', reason: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [registerOpen, setRegisterOpen] = useState(true);
  const [paymentSearch, setPaymentSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [refRes, payRes] = await Promise.all([adminAPI.getRefunds(), adminAPI.getAllPayments()]);
      setRefunds(refRes.data);
      setPayments(payRes.data.filter(p => p.status === 'PAID'));
    } catch (err) { console.error('Failed to load refunds', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = () => {
    setForm({ paymentId: '', amount: '', reason: '', notes: '' });
    setPaymentSearch('');
    setError(''); setModalOpen(true);
  };

  const filteredPayments = payments.filter(p => {
    if (!paymentSearch) return true;
    const q = paymentSearch.toLowerCase();
    return p.fullName?.toLowerCase().includes(q) || p.unitNumber?.toLowerCase().includes(q)
      || p.receiptNumber?.toLowerCase().includes(q) || p.paymentType?.toLowerCase().includes(q)
      || p.description?.toLowerCase().includes(q) || String(p.amount).includes(q);
  });

  const selectedPayment = payments.find(p => String(p.id) === String(form.paymentId));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await adminAPI.createRefund({ paymentId: Number(form.paymentId), amount: Number(form.amount), reason: form.reason, notes: form.notes });
      setModalOpen(false); fetchData();
    }
    catch (err) { setError(err.response?.data?.message || 'Failed to create refund request'); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id) => {
    if (!await confirm({ title: 'Approve Refund', message: 'Approve this refund request? Another authorized member must process it to complete the refund.', confirmLabel: 'Approve', danger: false })) return;
    try { await adminAPI.approveRefund(id); fetchData(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to approve'); }
  };

  const openRejectModal = (id) => {
    setRejectId(id); setRejectReason(''); setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setSaving(true);
    try {
      await adminAPI.rejectRefund(rejectId, { rejectionReason: rejectReason });
      setRejectModalOpen(false); fetchData();
    }
    catch (err) { alert(err.response?.data?.message || 'Failed to reject'); }
    finally { setSaving(false); }
  };

  const handleProcess = async (id) => {
    if (!await confirm({ title: 'Process Refund', message: 'Confirm that this refund has been paid out to the resident. The original payment will be marked as REFUNDED.', confirmLabel: 'Confirm Processed', danger: false })) return;
    try { await adminAPI.processRefund(id); fetchData(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to process'); }
  };

  const statusCounts = useMemo(() => {
    const counts = { PENDING: 0, APPROVED: 0, PROCESSED: 0, REJECTED: 0 };
    refunds.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
    return counts;
  }, [refunds]);

  const allFiltered = refunds.filter(r => {
    const matchSearch = !search || r.refundNumber?.toLowerCase().includes(search.toLowerCase())
      || r.payerName?.toLowerCase().includes(search.toLowerCase()) || r.payerUnit?.toLowerCase().includes(search.toLowerCase())
      || r.receiptNumber?.toLowerCase().includes(search.toLowerCase()) || r.reason?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalAmount = allFiltered.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">Payment Refunds</h1>
          <p className="text-[13px] text-muted mt-0.5">Manage payment reversals and refunds</p>
        </div>
        <button onClick={openModal} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Raise Refund
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pending', key: 'PENDING', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-500/15', Icon: Clock },
          { label: 'Approved', key: 'APPROVED', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/15', Icon: CheckCircle },
          { label: 'Processed', key: 'PROCESSED', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-500/15', Icon: Banknote },
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

      {/* Refund Register */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <button onClick={() => setRegisterOpen(!registerOpen)} className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-card-hover transition-colors">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h2 className="text-[14px] font-semibold text-heading">Refund Register</h2>
            <span className="text-[11px] text-muted px-2 py-0.5 bg-card-alt rounded">{refunds.length} entries</span>
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
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by voucher, resident, receipt..." className="w-full pl-10 pr-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading placeholder:text-muted" />
            </div>
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading">
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="PROCESSED">Processed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Table */}
        {loading ? <div className="space-y-6"><StatSkeleton count={3} /><TableSkeleton /></div> : (
          <div className="table-container">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Refund Voucher</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Resident</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Original Payment</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Reason</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Status</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Amount</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt w-36">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allFiltered.map((ref) => {
                  const SIcon = STATUS_ICONS[ref.status] || Clock;
                  return (
                  <tr key={ref.id} className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-[13px] font-medium text-heading">{ref.refundNumber}</p>
                      <p className="text-[11px] text-muted">{ref.createdAt?.split('T')[0]}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-[13px] text-heading">{ref.payerName}</p>
                      <p className="text-[11px] text-muted">{ref.payerUnit}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-[13px] text-heading">{ref.receiptNumber}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${getTypeColor(ref.paymentType)}`}>
                        {typeName(ref.paymentType, incomeTypes)}
                      </span>
                      {ref.paymentDescription && <p className="text-[11px] text-muted truncate max-w-[180px] mt-0.5">{ref.paymentDescription}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-[13px] text-heading">{ref.reason}</p>
                      {ref.rejectionReason && <p className="text-[11px] text-red-500 mt-0.5">Rejected: {ref.rejectionReason}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${STATUS_COLORS[ref.status] || ''}`}>
                        <SIcon className="w-3 h-3" />{ref.status}
                      </span>
                      {ref.requestedBy && <p className="text-[10px] text-muted mt-0.5">by {ref.requestedBy}</p>}
                      {ref.approvedBy && <p className="text-[10px] text-muted">approved: {ref.approvedBy}</p>}
                    </td>
                    <td className="px-5 py-3 text-right text-[13px] font-semibold text-red-700 dark:text-red-400">₹{fmt(ref.amount)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {ref.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleApprove(ref.id)} title="Approve" className="p-1.5 text-muted hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded transition-colors"><CheckCircle className="w-4 h-4" /></button>
                            <button onClick={() => openRejectModal(ref.id)} title="Reject" className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"><XCircle className="w-4 h-4" /></button>
                          </>
                        )}
                        {ref.status === 'APPROVED' && (
                          <button onClick={() => handleProcess(ref.id)} title="Mark as Processed" className="p-1.5 text-muted hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 rounded transition-colors"><Banknote className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
                {allFiltered.length === 0 && <tr><td colSpan={7}><EmptyState icon={RotateCcw} title="No refund requests" description="No refund requests match the current filters." /></td></tr>}
              </tbody>
              {allFiltered.length > 0 && <tfoot><tr className="bg-red-50 dark:bg-red-500/10 border-t-2 border-red-200 dark:border-red-500/20"><td colSpan={5} className="px-5 py-3 text-[13px] font-semibold text-red-800 dark:text-red-400">Total</td><td className="px-5 py-3 text-right text-[13px] font-bold text-red-800 dark:text-red-400">₹{fmt(totalAmount)}</td><td></td></tr></tfoot>}
            </table>
          </div>
        )}
        </>
        )}
      </div>

      {/* Raise Refund Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Raise Refund" full>
        {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-lg text-[13px]">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[14px] font-semibold text-heading">Refund Details</h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
              <button type="submit" disabled={saving || !form.paymentId || !form.amount || !form.reason} className="px-4 py-2 bg-indigo-600 text-white rounded text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">
                {saving ? <><ButtonSpinner /> Submitting...</> : <><Save className="w-4 h-4" /> Raise Refund</>}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                {/* Payment picker */}
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Select Payment / Invoice *</label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input type="text" value={paymentSearch} onChange={(e) => setPaymentSearch(e.target.value)} placeholder="Search by resident, unit, receipt#, type..." className="w-full pl-10 pr-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading placeholder:text-muted" />
                  </div>
                  <div className="max-h-[240px] overflow-y-auto space-y-1.5 border border-border rounded-lg p-2">
                    {filteredPayments.length === 0 && (
                      <p className="text-center py-4 text-[13px] text-muted">No PAID payments found{paymentSearch ? ' matching your search' : ''}.</p>
                    )}
                    {filteredPayments.slice(0, 50).map(p => (
                      <label key={p.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${String(form.paymentId) === String(p.id) ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 dark:border-indigo-500/40' : 'border-border hover:bg-card-hover'}`}>
                        <input type="radio" name="payment" value={p.id} checked={String(form.paymentId) === String(p.id)}
                          onChange={() => setForm({ ...form, paymentId: String(p.id), amount: String(p.amount) })} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-medium text-heading">{p.fullName} <span className="text-muted font-normal">({p.unitNumber})</span></span>
                            <span className="text-[13px] font-semibold text-heading">₹{fmt(p.amount)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted">{p.receiptNumber}</span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${getTypeColor(p.paymentType)}`}>{typeName(p.paymentType, incomeTypes)}</span>
                            <span className="text-[11px] text-muted">{p.paidAt?.split('T')[0]}</span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Refund Amount *</label>
                  <input type="number" min="1" step="0.01" max={selectedPayment?.amount || ''} value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required placeholder="Enter refund amount" />
                  {selectedPayment && <p className="text-[11px] text-muted mt-1">Original amount: ₹{fmt(selectedPayment.amount)}</p>}
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Reason *</label>
                  <textarea rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading resize-none" required placeholder="Reason for this refund" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Notes</label>
                  <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading resize-none" placeholder="Additional notes (optional)" />
                </div>
              </div>
            </div>
            <div className="space-y-6 md:sticky md:top-4 md:self-start">
              {selectedPayment && (
                <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-5">
                  <h2 className="text-[14px] font-semibold text-indigo-800 dark:text-indigo-400 mb-2 flex items-center gap-2"><Receipt className="w-4 h-4" /> Selected Payment</h2>
                  <div className="space-y-1.5 text-[13px]">
                    <div className="flex justify-between"><span className="text-indigo-700 dark:text-indigo-300">Resident</span><span className="font-medium text-indigo-800 dark:text-indigo-300">{selectedPayment.fullName}</span></div>
                    <div className="flex justify-between"><span className="text-indigo-700 dark:text-indigo-300">Unit</span><span className="font-medium text-indigo-800 dark:text-indigo-300">{selectedPayment.unitNumber}</span></div>
                    <div className="flex justify-between"><span className="text-indigo-700 dark:text-indigo-300">Receipt</span><span className="font-medium text-indigo-800 dark:text-indigo-300">{selectedPayment.receiptNumber}</span></div>
                    <div className="flex justify-between"><span className="text-indigo-700 dark:text-indigo-300">Type</span><span className="font-medium text-indigo-800 dark:text-indigo-300">{typeName(selectedPayment.paymentType, incomeTypes)}</span></div>
                    <div className="flex justify-between"><span className="text-indigo-700 dark:text-indigo-300">Amount</span><span className="font-bold text-indigo-800 dark:text-indigo-300">₹{fmt(selectedPayment.amount)}</span></div>
                    <div className="flex justify-between"><span className="text-indigo-700 dark:text-indigo-300">Paid On</span><span className="font-medium text-indigo-800 dark:text-indigo-300">{selectedPayment.paidAt?.split('T')[0]}</span></div>
                  </div>
                </div>
              )}
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-5">
                <h2 className="text-[14px] font-semibold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Maker-Checker</h2>
                <p className="text-[12px] text-amber-700 dark:text-amber-400">
                  Refund requests require approval from a different authorized committee member before processing. The original payment will be marked as REFUNDED.
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-[14px] font-semibold text-heading mb-1">Workflow</h2>
                <p className="text-[11px] text-muted mb-3">Refund approval flow:</p>
                <div className="flex items-center gap-1 text-[11px] text-muted">
                  <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-500/15 rounded text-yellow-700 dark:text-yellow-400">Pending</span>
                  <span>→</span>
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-500/15 rounded text-blue-700 dark:text-blue-400">Approved</span>
                  <span>→</span>
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-500/15 rounded text-green-700 dark:text-green-400">Processed</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Reject Modal */}
      <Modal open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Reject Refund">
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
