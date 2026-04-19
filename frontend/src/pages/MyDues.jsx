import { FormSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useState, useEffect, useMemo } from 'react';
import { userAPI } from '../services/api';
import { Receipt, AlertCircle, Clock, CheckCircle2, RotateCcw, X } from 'lucide-react';
import { useSocietyConfig, typeName } from '../context/SocietyConfigContext';
import { formatDate, formatNumber } from '../utils/format';

const STATUS_COLORS = {
  PAID: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
  CANCELLED: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400',
  REFUNDED: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
};

const REFUND_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
  APPROVED: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  PROCESSED: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};

export default function MyDues() {
  const { incomeTypes } = useSocietyConfig();
  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [refundModal, setRefundModal] = useState(null);
  const [refundForm, setRefundForm] = useState({ amount: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = () => {
    Promise.all([
      userAPI.getMyPayments().then(r => r.data),
      userAPI.getMyRefunds().then(r => r.data).catch(() => []),
    ]).then(([p, r]) => { setPayments(p); setRefunds(r); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const pendingPayments = useMemo(() => payments.filter(p => p.status === 'PENDING'), [payments]);
  const filteredPayments = useMemo(
    () => activeTab === 'ALL' ? payments : payments.filter(p => p.paymentType === activeTab),
    [payments, activeTab]
  );
  const totalPaid = useMemo(
    () => payments.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0),
    [payments]
  );
  const totalDue = useMemo(
    () => pendingPayments.reduce((s, p) => s + Number(p.amount) + Number(p.penaltyAmount || 0), 0),
    [pendingPayments]
  );
  const overdueCount = useMemo(() => pendingPayments.filter(p => p.overdue).length, [pendingPayments]);

  // Map payment ID to refund status
  const refundByPaymentId = useMemo(() => {
    const map = {};
    refunds.forEach(r => { map[r.paymentId] = r; });
    return map;
  }, [refunds]);

  const tabs = useMemo(() => [
    { code: 'ALL', label: 'All' },
    ...incomeTypes.filter(t => !t.systemManaged).map(t => ({ code: t.code, label: t.displayName })),
  ], [incomeTypes]);

  const openRefundModal = (payment) => {
    setRefundModal(payment);
    setRefundForm({ amount: String(payment.amount), reason: '' });
    setError('');
  };

  const submitRefund = async () => {
    if (!refundForm.amount || Number(refundForm.amount) <= 0) { setError('Enter a valid amount'); return; }
    if (!refundForm.reason.trim()) { setError('Please provide a reason'); return; }
    setSubmitting(true);
    setError('');
    try {
      await userAPI.requestRefund({
        paymentId: refundModal.id,
        amount: Number(refundForm.amount),
        reason: refundForm.reason.trim(),
      });
      setRefundModal(null);
      loadData();
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data?.error || 'Failed to submit refund request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-heading">My Dues</h1>
        <p className="text-[13px] text-muted mt-0.5">Your invoices, payment history, and refund requests</p>
      </div>

      {loading ? <FormSkeleton /> : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-500/15 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Total Paid</p>
                <p className="text-[18px] font-bold text-heading">{formatNumber(totalPaid)}</p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-500/15 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Outstanding Dues</p>
                <p className="text-[18px] font-bold text-heading">{formatNumber(totalDue)}</p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-500/15 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Overdue</p>
                <p className="text-[18px] font-bold text-heading">{overdueCount}</p>
              </div>
            </div>
          </div>

          {/* Pending invoices */}
          {pendingPayments.length > 0 && (
            <div className="mb-6">
              <h2 className="text-[14px] font-semibold text-heading mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" /> Pending Dues
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pendingPayments.map(p => {
                  const typeInfo = incomeTypes.find(t => t.code === p.paymentType);
                  return (
                    <div key={p.id} className={`bg-card border rounded-xl p-4 ${p.overdue ? 'border-red-300 dark:border-red-500/30' : 'border-yellow-300 dark:border-yellow-500/30'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">{typeInfo?.displayName || p.paymentType}</span>
                        {p.overdue && <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/15 px-1.5 py-0.5 rounded">OVERDUE</span>}
                      </div>
                      <p className="text-[11px] text-muted">{p.receiptNumber}</p>
                      <p className="text-[20px] font-bold text-heading mt-1">{formatNumber(Number(p.amount) + Number(p.penaltyAmount || 0))}</p>
                      {Number(p.penaltyAmount) > 0 && (
                        <p className="text-[11px] text-red-600 dark:text-red-400">Includes {formatNumber(p.penaltyAmount)} penalty</p>
                      )}
                      {p.dueDate && <p className="text-[11px] text-muted mt-1">Due: {formatDate(p.dueDate)}</p>}
                      {p.periodFrom && <p className="text-[11px] text-muted">Period: {p.periodFrom} to {p.periodTo}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Refund requests */}
          {refunds.length > 0 && (
            <div className="mb-6">
              <h2 className="text-[14px] font-semibold text-heading mb-3 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-blue-500" /> My Refund Requests
              </h2>
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="table-container">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Voucher</th>
                        <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Payment</th>
                        <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Reason</th>
                        <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Status</th>
                        <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Amount</th>
                        <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {refunds.map(r => (
                        <tr key={r.id} className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                          <td className="px-5 py-3 text-[13px] font-medium text-heading">{r.refundNumber}</td>
                          <td className="px-5 py-3 text-[13px] text-muted">{r.receiptNumber} ({typeName(r.paymentType, incomeTypes)})</td>
                          <td className="px-5 py-3 text-[13px] text-muted max-w-[200px] truncate">{r.reason || '-'}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${REFUND_STATUS_COLORS[r.status] || ''}`}>{r.status}</span>
                            {r.status === 'REJECTED' && r.rejectionReason && (
                              <p className="text-[10px] text-red-500 mt-0.5">{r.rejectionReason}</p>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right text-[13px] font-semibold text-heading">{formatNumber(r.amount)}</td>
                          <td className="px-5 py-3 text-[13px] text-muted">{formatDate(r.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Type tabs */}
          <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
            {tabs.map(tab => (
              <button key={tab.code} onClick={() => setActiveTab(tab.code)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.code
                    ? 'bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400'
                    : 'text-muted hover:bg-card-hover hover:text-heading'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Payment history table */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="table-container">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Receipt / Invoice</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Type</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Period / Notes</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Status</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Amount</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Date</th>
                    <th className="text-center px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map(p => {
                    const typeInfo = incomeTypes.find(t => t.code === p.paymentType);
                    const existingRefund = refundByPaymentId[p.id];
                    const canRequestRefund = p.status === 'PAID' && !existingRefund;
                    return (
                      <tr key={p.id} className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-heading">
                            <Receipt className="w-3.5 h-3.5 text-muted" />{p.receiptNumber}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400">
                            {typeInfo?.displayName || p.paymentType}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[13px] text-muted">
                          {p.periodFrom ? `${p.periodFrom} to ${p.periodTo}` : (p.description || '-')}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-700'}`}>{p.status}</span>
                          {existingRefund && (
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ml-1 ${REFUND_STATUS_COLORS[existingRefund.status]}`}>
                              Refund: {existingRefund.status}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-[13px] font-semibold text-heading">{formatNumber(p.amount)}</span>
                          {Number(p.penaltyAmount) > 0 && (
                            <p className="text-[10px] text-red-600 dark:text-red-400">+{formatNumber(p.penaltyAmount)} penalty</p>
                          )}
                        </td>
                        <td className="px-5 py-3 text-[13px] text-muted">{formatDate(p.paidAt || p.createdAt)}</td>
                        <td className="px-5 py-3 text-center">
                          {canRequestRefund && (
                            <button onClick={() => openRefundModal(p)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded transition-colors">
                              <RotateCcw className="w-3 h-3" /> Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPayments.length === 0 && (
                    <tr><td colSpan={7}><EmptyState icon={Receipt} title="No payments found" description="Your invoices and payment receipts will appear here." /></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Refund request modal */}
      {refundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setRefundModal(null)}>
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-semibold text-heading">Request Refund</h3>
              <button onClick={() => setRefundModal(null)} className="text-muted hover:text-heading"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3">
              <div className="bg-card-alt rounded-lg p-3 border border-border">
                <p className="text-[11px] text-muted uppercase tracking-wider">Original Payment</p>
                <p className="text-[14px] font-semibold text-heading mt-1">{refundModal.receiptNumber}</p>
                <p className="text-[12px] text-muted">{refundModal.paymentType} — {formatNumber(refundModal.amount)}</p>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-muted mb-1">Refund Amount</label>
                <input type="number" step="0.01" max={refundModal.amount}
                  value={refundForm.amount}
                  onChange={e => setRefundForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-[13px] text-heading focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-muted mb-1">Reason</label>
                <textarea rows={3}
                  value={refundForm.reason}
                  onChange={e => setRefundForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Why are you requesting a refund?"
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-[13px] text-heading focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>

              {error && <p className="text-[12px] text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setRefundModal(null)}
                  className="px-4 py-2 text-[13px] font-medium text-muted hover:text-heading rounded-lg border border-border hover:bg-card-hover transition-colors">
                  Cancel
                </button>
                <button onClick={submitRefund} disabled={submitting}
                  className="px-4 py-2 text-[13px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
