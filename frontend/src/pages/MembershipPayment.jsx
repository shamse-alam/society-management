import { ButtonSpinner } from '../components/Spinner';
import { FormSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
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

  const isFormValid = form.amount && Number(form.amount) > 0 && (!isAdmin || form.userId);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">Membership</h1>
          <p className="text-[13px] text-muted mt-0.5">Society membership charges</p>
        </div>
        <button onClick={() => { setForm({ userId: '', amount: '', description: '' }); setError(''); setModalOpen(true); }}
          className="btn-primary inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-green-700 transition-colors">
          <Plus className="w-4 h-4" /> Pay Membership
        </button>
      </div>

      {success && <div className="mb-4 p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 rounded text-[13px]">{success}</div>}

      {loading ? (
        <FormSkeleton />
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="table-container">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Receipt</th>
                  {isAdmin && <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">{`User / ${propertyLabel}`}</th>}
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Amount</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Notes</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-heading">
                        <Receipt className="w-3.5 h-3.5 text-muted" />{p.receiptNumber}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3">
                        <p className="text-[13px] font-medium text-heading">{p.fullName}</p>
                        <p className="text-[11px] text-muted">{p.unitNumber || '-'}</p>
                      </td>
                    )}
                    <td className="px-5 py-3 text-right text-[13px] font-semibold text-heading">₹{formatNumber(p.amount)}</td>
                    <td className="px-5 py-3 text-[13px] text-muted">{p.description || '-'}</td>
                    <td className="px-5 py-3 text-[13px] text-muted">{formatDate(p.paidAt)}</td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan={isAdmin ? 5 : 4}><EmptyState icon={Receipt} title="No membership payments yet" description="Membership payments will appear here once recorded." /></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Pay Membership Charge" full>
        {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-lg text-[13px]">{error}</div>}
        <form onSubmit={handlePay}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[14px] font-semibold text-heading">Payment Details</h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
              <button type="submit" disabled={saving || !isFormValid} className="px-4 py-2 bg-green-600 text-white rounded text-[13px] font-medium hover:bg-green-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">
                {saving ? <><ButtonSpinner /> Processing...</> : <><Save className="w-4 h-4" /> Pay Now</>}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
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
