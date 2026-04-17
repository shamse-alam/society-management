import { ButtonSpinner } from '../components/Spinner';
import { FormSkeleton } from '../components/Skeleton';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI, userAPI } from '../services/api';
import Modal from '../components/Modal';
import { UserCheck, Plus, Receipt, Save } from 'lucide-react';
import { useSocietyConfig } from '../context/SocietyConfigContext';
import { formatDate, formatNumber } from '../utils/format';

export default function MembershipPayment() {
  const { isAdmin } = useAuth();
  const { config } = useSocietyConfig();
  const propertyLabel = config?.propertyLabel || 'Property';
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ userId: '', amount: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try {
      const res = isAdmin
        ? await adminAPI.getPaymentsByType('MEMBERSHIP')
        : await userAPI.getMyPaymentsByType('MEMBERSHIP');
      setPayments(res.data);
      if (isAdmin) {
        const usersRes = await adminAPI.getUsers();
        setUsers(usersRes.data);
      }
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePay = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        userId: isAdmin && form.userId ? Number(form.userId) : undefined,
        paymentType: 'MEMBERSHIP',
        amount: Number(form.amount),
        description: form.description || 'Membership Charge',
      };
      if (isAdmin) {
        await adminAPI.recordPayment(payload);
      } else {
        await userAPI.makePayment(payload);
      }
      setModalOpen(false);
      setSuccess('Membership payment recorded successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membership</h1>
          <p className="text-gray-500 mt-1">Society membership charges</p>
        </div>
        <button onClick={() => { setForm({ userId: '', amount: '', description: '' }); setError(''); setModalOpen(true); }}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="w-5 h-5" /> Pay Membership
        </button>
      </div>

      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

      {loading ? (
        <FormSkeleton />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Receipt</th>
                  {isAdmin && <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{`User / ${propertyLabel}`}</th>}
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Notes</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <span className="inline-flex items-center gap-1.5"><Receipt className="w-4 h-4 text-gray-400" />{p.receiptNumber}</span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{p.fullName}</p>
                        <p className="text-xs text-gray-500">{p.unitNumber || '-'}</p>
                      </td>
                    )}
                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">₹{formatNumber(p.amount)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.description || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(p.paidAt)}</td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-gray-500">No membership payments yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Pay Membership Charge" full>
        {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-lg text-[13px]">{error}</div>}
        <form onSubmit={handlePay}>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h2 className="text-[14px] font-semibold text-heading mb-2">Payment Details</h2>
                {isAdmin && (
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">User *</label>
                    <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}
                      className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required>
                      <option value="">-- Select User --</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.unitNumber || u.username})</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Amount (₹) *</label>
                  <input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required placeholder="Enter amount" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Notes</label>
                  <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="e.g. Annual membership" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-border rounded-lg text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    {saving ? <><ButtonSpinner /> Processing...</> : <><Save className="w-4 h-4" /> Pay Now</>}
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-6 md:sticky md:top-4 md:self-start">
              {form.amount && Number(form.amount) > 0 && (
                <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-5 text-center">
                  <p className="text-[11px] text-muted">Amount to Pay</p>
                  <p className="text-[24px] font-bold text-indigo-700 dark:text-indigo-400">₹{formatNumber(Number(form.amount))}</p>
                  <p className="text-[11px] text-muted mt-1">Membership Charge</p>
                </div>
              )}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
