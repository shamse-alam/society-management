import { ButtonSpinner } from '../components/Spinner';
import { FormSkeleton } from '../components/Skeleton';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI, userAPI } from '../services/api';
import Modal from '../components/Modal';
import { Landmark, Plus, Receipt } from 'lucide-react';
import { useSocietyConfig } from '../context/SocietyConfigContext';
import { formatDate, formatNumber } from '../utils/format';

export default function CorpusPayment() {
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
        ? await adminAPI.getPaymentsByType('CORPUS')
        : await userAPI.getMyPaymentsByType('CORPUS');
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
        paymentType: 'CORPUS',
        amount: Number(form.amount),
        description: form.description || 'Corpus Fund Payment',
      };
      if (isAdmin) {
        await adminAPI.recordPayment(payload);
      } else {
        await userAPI.makePayment(payload);
      }
      setModalOpen(false);
      setSuccess('Corpus payment recorded successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed');
    } finally {
      setSaving(false);
    }
  };

  const totalCorpus = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Corpus Payment</h1>
          <p className="text-gray-500 mt-1">One-time or advance corpus fund contributions</p>
        </div>
        <button onClick={() => { setForm({ userId: '', amount: '', description: '' }); setError(''); setModalOpen(true); }}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="w-5 h-5" /> Pay Corpus
        </button>
      </div>

      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

      <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-6 mb-6">
        <div className="flex items-center gap-3">
          <Landmark className="w-8 h-8 text-indigo-600" />
          <div>
            <p className="text-sm text-gray-600">Total Corpus Collected</p>
            <p className="text-2xl font-bold text-indigo-700">₹{formatNumber(totalCorpus)}</p>
          </div>
        </div>
      </div>

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
                  <tr><td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-gray-500">No corpus payments yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Pay Corpus Fund">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handlePay} className="space-y-4">
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
              <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" required>
                <option value="">-- Select User --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.unitNumber || u.username})</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" required placeholder="Enter amount" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="e.g. Annual corpus contribution" />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-border rounded-lg text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {saving ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
