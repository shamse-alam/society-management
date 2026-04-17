import { ButtonSpinner } from '../components/Spinner';
import { ListSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { UserPlus, Copy, Clock, CheckCircle2, XCircle, LogIn, LogOut, Ban, ChevronDown, X, Bell, ShieldAlert, Check } from 'lucide-react';

const fmt = (dt) => {
  if (!dt) return '-';
  const d = new Date(dt);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
};

const statusBadge = {
  AWAITING_APPROVAL: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  EXPECTED: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  CHECKED_IN: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  CHECKED_OUT: 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400',
  DENIED: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  EXPIRED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};

const statusIcon = {
  AWAITING_APPROVAL: Bell,
  EXPECTED: Clock,
  CHECKED_IN: LogIn,
  CHECKED_OUT: LogOut,
  DENIED: Ban,
  EXPIRED: XCircle,
  REJECTED: XCircle,
};

export default function VisitorPreApprove() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [gateRequests, setGateRequests] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('gate-requests');

  // Approval form
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ visitorName: '', visitorPhone: '', visitorType: 'GUEST', vehicleNumber: '', purpose: '', expectedAt: '' });
  const [saving, setSaving] = useState(false);

  // Generated passcode display
  const [generatedPasscode, setGeneratedPasscode] = useState(null);

  const fetchData = async () => {
    try {
      const [gateRes, appRes, histRes] = await Promise.allSettled([
        userAPI.getPendingApprovals(),
        userAPI.getMyApprovals(),
        userAPI.getVisitHistory(),
      ]);
      if (gateRes.status === 'fulfilled') setGateRequests(gateRes.value.data);
      if (appRes.status === 'fulfilled') setApprovals(appRes.value.data);
      if (histRes.status === 'fulfilled') setHistory(histRes.value.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 10000); // Poll every 10 seconds for gate requests
    return () => clearInterval(iv);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        expectedAt: new Date(form.expectedAt).toISOString(),
      };
      const res = await userAPI.preApproveVisitor(payload);
      setGeneratedPasscode(res.data);
      setModalOpen(false);
      setForm({ visitorName: '', visitorPhone: '', visitorType: 'GUEST', vehicleNumber: '', purpose: '', expectedAt: '' });
      fetchData();
      toast.success('Visitor pre-approved! Share the passcode.');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to pre-approve'); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id) => {
    try {
      await userAPI.approveVisit(id);
      toast.success('Visitor approved! Guard has been notified.');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to approve'); }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Deny entry to this visitor?')) return;
    try {
      await userAPI.rejectVisit(id);
      toast.success('Visitor entry denied');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to reject'); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this approval?')) return;
    try {
      await userAPI.cancelApproval(id);
      toast.success('Approval cancelled');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to cancel'); }
  };

  const copyPasscode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Passcode copied!');
  };

  // Default expectedAt to 1 hour from now
  const getDefaultDateTime = () => {
    const d = new Date(Date.now() + 3600000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  if (loading) return <ListSkeleton />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">Visitor Management</h1>
          <p className="text-[13px] text-muted mt-0.5">Pre-approve visitors and track visit history</p>
        </div>
        <button onClick={() => { setModalOpen(true); if (!form.expectedAt) setForm({ ...form, expectedAt: getDefaultDateTime() }); }} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-indigo-700 transition-colors">
          <UserPlus className="w-4 h-4" /> Pre-Approve Visitor
        </button>
      </div>

      {/* Generated passcode display */}
      {generatedPasscode && (
        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg p-5 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[13px] font-medium text-green-700 dark:text-green-400 mb-2">Visitor pre-approved! Share this passcode:</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold font-mono text-green-700 dark:text-green-400 tracking-[0.3em]">{generatedPasscode.passcode}</span>
                <button onClick={() => copyPasscode(generatedPasscode.passcode)} className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors" title="Copy passcode">
                  <Copy className="w-5 h-5 text-green-600 dark:text-green-400" />
                </button>
              </div>
              <p className="text-[13px] text-muted mt-2">For: <span className="font-medium text-heading">{generatedPasscode.visitorName}</span> | Valid until: {fmt(generatedPasscode.validUntil)}</p>
            </div>
            <button onClick={() => setGeneratedPasscode(null)} className="p-1 text-muted hover:text-heading">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-card-alt rounded-lg p-1 mb-6">
        <button onClick={() => setTab('gate-requests')} className={`flex-1 px-3 py-2 rounded-md text-[13px] font-medium transition-colors relative ${tab === 'gate-requests' ? 'bg-card text-heading shadow-sm' : 'text-muted hover:text-sub'}`}>
          Gate Requests {gateRequests.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 animate-pulse">{gateRequests.length}</span>}
        </button>
        <button onClick={() => setTab('approve')} className={`flex-1 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${tab === 'approve' ? 'bg-card text-heading shadow-sm' : 'text-muted hover:text-sub'}`}>
          Expected {approvals.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">{approvals.length}</span>}
        </button>
        <button onClick={() => setTab('history')} className={`flex-1 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${tab === 'history' ? 'bg-card text-heading shadow-sm' : 'text-muted hover:text-sub'}`}>
          History
        </button>
      </div>

      {/* Gate Requests — visitors at the gate awaiting your approval */}
      {tab === 'gate-requests' && (
        gateRequests.length === 0 ? (
          <EmptyState icon={UserPlus} title="No visitors at the gate" description="When a visitor arrives, the guard will send you an approval request" />
        ) : (
          <div className="space-y-3">
            {gateRequests.map((v) => (
              <div key={v.id} className="bg-card rounded-lg border-2 border-amber-300 dark:border-amber-500/30 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Visitor at Gate</p>
                    <p className="text-[11px] text-muted">{fmt(v.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[17px] font-semibold text-heading">{v.visitorName}</p>
                    <p className="text-[13px] text-muted mt-0.5">{v.visitorPhone} {v.vehicleNumber && `| Vehicle: ${v.vehicleNumber}`}</p>
                    {v.purpose && <p className="text-[13px] text-sub mt-1">Purpose: {v.purpose}</p>}
                    <p className="text-[12px] text-muted mt-1">Type: <span className="font-medium">{v.visitorType}</span></p>
                  </div>
                </div>
                <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                  <button onClick={() => handleApprove(v.id)} className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg text-[13px] font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> Allow Entry
                  </button>
                  <button onClick={() => handleReject(v.id)} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-[13px] font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                    <Ban className="w-4 h-4" /> Deny Entry
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Expected visitors */}
      {tab === 'approve' && (
        approvals.length === 0 ? (
          <EmptyState icon={UserPlus} title="No expected visitors" description="Pre-approve a visitor to get started" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {approvals.map((a) => (
              <div key={a.visitLogId} className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[15px] font-semibold text-heading">{a.visitorName}</p>
                    <p className="text-[13px] text-muted mt-0.5">{a.visitorPhone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-muted">Passcode</p>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400 tracking-wider">{a.passcode}</span>
                      <button onClick={() => copyPasscode(a.passcode)} className="p-1 rounded hover:bg-card-alt" title="Copy">
                        <Copy className="w-3.5 h-3.5 text-muted" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <p className="text-[12px] text-muted">Expected: {fmt(a.expectedAt)}</p>
                  <button onClick={() => handleCancel(a.visitLogId)} className="text-[12px] text-red-600 dark:text-red-400 hover:underline font-medium">Cancel</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Visit history */}
      {tab === 'history' && (
        history.length === 0 ? (
          <EmptyState icon={UserPlus} title="No visit history yet" description="Past visitor records will appear here" />
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-card-alt">
                    <th className="text-left px-4 py-3 font-medium text-sub">Visitor</th>
                    <th className="text-left px-4 py-3 font-medium text-sub">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-sub">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-sub">Check In</th>
                    <th className="text-left px-4 py-3 font-medium text-sub">Check Out</th>
                    <th className="text-left px-4 py-3 font-medium text-sub">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((v) => {
                    const Icon = statusIcon[v.status] || Clock;
                    return (
                      <tr key={v.id} className="border-b border-border last:border-0 hover:bg-card-hover transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-heading">{v.visitorName}</p>
                          <p className="text-muted text-[12px]">{v.visitorPhone}</p>
                        </td>
                        <td className="px-4 py-3 text-muted">{v.visitorType}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${statusBadge[v.status] || ''}`}>
                            <Icon className="w-3 h-3" /> {v.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted">{fmt(v.checkInTime)}</td>
                        <td className="px-4 py-3 text-muted">{fmt(v.checkOutTime)}</td>
                        <td className="px-4 py-3 text-muted">{fmt(v.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Pre-approve modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Pre-Approve Visitor">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-sub mb-1">Visitor Name *</label>
            <input type="text" value={form.visitorName} onChange={(e) => setForm({ ...form, visitorName: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 outline-none text-[13px] text-heading" required placeholder="Full name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-sub mb-1">Phone *</label>
              <input type="tel" value={form.visitorPhone} onChange={(e) => setForm({ ...form, visitorPhone: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 outline-none text-[13px] text-heading" required placeholder="Mobile number" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-sub mb-1">Visitor Type</label>
              <select value={form.visitorType} onChange={(e) => setForm({ ...form, visitorType: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 outline-none text-[13px] text-heading">
                <option value="GUEST">Guest</option>
                <option value="DELIVERY">Delivery</option>
                <option value="CAB">Cab</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-sub mb-1">Vehicle Number</label>
              <input type="text" value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 outline-none text-[13px] text-heading" placeholder="e.g. TS09AB1234" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-sub mb-1">Expected At *</label>
              <input type="datetime-local" value={form.expectedAt} onChange={(e) => setForm({ ...form, expectedAt: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 outline-none text-[13px] text-heading" required />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-sub mb-1">Purpose</label>
            <input type="text" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 outline-none text-[13px] text-heading" placeholder="Purpose of visit" />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-border rounded-lg text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {saving ? <><ButtonSpinner /> Approving...</> : 'Pre-Approve & Get Passcode'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
