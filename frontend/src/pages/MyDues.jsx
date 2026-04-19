import { FormSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useState, useEffect, useMemo } from 'react';
import { userAPI } from '../services/api';
import { Receipt, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useSocietyConfig } from '../context/SocietyConfigContext';
import { formatDate, formatNumber } from '../utils/format';

const STATUS_COLORS = {
  PAID: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
  CANCELLED: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400',
  REFUNDED: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
};

export default function MyDues() {
  const { incomeTypes } = useSocietyConfig();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    userAPI.getMyPayments()
      .then(res => setPayments(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

  // Tabs from active income types (exclude system-managed like AMENITY_BOOKING)
  const tabs = useMemo(() => [
    { code: 'ALL', label: 'All' },
    ...incomeTypes.filter(t => !t.systemManaged).map(t => ({ code: t.code, label: t.displayName })),
  ], [incomeTypes]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-heading">My Dues</h1>
        <p className="text-[13px] text-muted mt-0.5">Your invoices and payment history</p>
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
                <p className="text-[18px] font-bold text-heading">₹{formatNumber(totalPaid)}</p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-500/15 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Outstanding Dues</p>
                <p className="text-[18px] font-bold text-heading">₹{formatNumber(totalDue)}</p>
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
                      <p className="text-[20px] font-bold text-heading mt-1">₹{formatNumber(Number(p.amount) + Number(p.penaltyAmount || 0))}</p>
                      {Number(p.penaltyAmount) > 0 && (
                        <p className="text-[11px] text-red-600 dark:text-red-400">Includes ₹{formatNumber(p.penaltyAmount)} penalty</p>
                      )}
                      {p.dueDate && <p className="text-[11px] text-muted mt-1">Due: {formatDate(p.dueDate)}</p>}
                      {p.periodFrom && <p className="text-[11px] text-muted">Period: {p.periodFrom} to {p.periodTo}</p>}
                    </div>
                  );
                })}
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
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map(p => {
                    const typeInfo = incomeTypes.find(t => t.code === p.paymentType);
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
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-[13px] font-semibold text-heading">₹{formatNumber(p.amount)}</span>
                          {Number(p.penaltyAmount) > 0 && (
                            <p className="text-[10px] text-red-600 dark:text-red-400">+₹{formatNumber(p.penaltyAmount)} penalty</p>
                          )}
                        </td>
                        <td className="px-5 py-3 text-[13px] text-muted">{formatDate(p.paidAt || p.createdAt)}</td>
                      </tr>
                    );
                  })}
                  {filteredPayments.length === 0 && (
                    <tr><td colSpan={6}><EmptyState icon={Receipt} title="No payments found" description="Your invoices and payment receipts will appear here." /></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
