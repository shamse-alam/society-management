import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useToast } from '../components/Toast';
import { TableSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { Truck, Check, X, Clock, Filter } from 'lucide-react';
import { useSocietyConfig } from '../context/SocietyConfigContext';

function formatDate(str) {
  if (!str) return '-';
  return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MoveRequests() {
  const toast = useToast();
  const { config } = useSocietyConfig();
  const propertyLabel = config?.propertyLabel || 'Property';
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [actionModal, setActionModal] = useState(null);
  const [remarks, setRemarks] = useState('');

  useEffect(() => { fetchRequests(); }, [filter]);

  const fetchRequests = async () => {
    try {
      const res = await adminAPI.getMoveRequests(filter || undefined);
      setRequests(res.data);
    } catch {
      toast.error('Failed to load move requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await adminAPI.approveMoveRequest(actionModal.id, { adminRemarks: remarks });
      toast.success('Request approved');
      setActionModal(null);
      setRemarks('');
      fetchRequests();
    } catch {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async () => {
    try {
      await adminAPI.rejectMoveRequest(actionModal.id, { adminRemarks: remarks });
      toast.success('Request rejected');
      setActionModal(null);
      setRemarks('');
      fetchRequests();
    } catch {
      toast.error('Failed to reject');
    }
  };

  const handleComplete = async (id) => {
    if (!confirm('Mark this move as completed?')) return;
    try {
      await adminAPI.completeMoveRequest(id);
      toast.success('Move completed');
      fetchRequests();
    } catch {
      toast.error('Failed to complete');
    }
  };

  const statusColors = {
    PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    APPROVED: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    COMPLETED: 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400',
  };

  const typeColors = {
    MOVE_IN: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    MOVE_OUT: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-heading">Move In/Out Requests</h1>
          <p className="text-[13px] text-muted mt-1">{requests.length} requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted" />
          <select value={filter} onChange={e => { setFilter(e.target.value); setLoading(true); }}
            className="px-3 py-2 bg-card border border-border rounded-lg text-[13px] text-heading">
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-card-alt">
                <th className="text-left px-4 py-3 font-semibold text-heading">Resident</th>
                <th className="text-left px-4 py-3 font-semibold text-heading">{propertyLabel}</th>
                <th className="text-left px-4 py-3 font-semibold text-heading">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-heading">Scheduled</th>
                <th className="text-left px-4 py-3 font-semibold text-heading">Time Slot</th>
                <th className="text-left px-4 py-3 font-semibold text-heading">Movers</th>
                <th className="text-left px-4 py-3 font-semibold text-heading">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-heading">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id} className="border-b border-border last:border-0 hover:bg-card-alt/50 transition-colors">
                  <td className="px-4 py-3 text-heading font-medium">{req.userName}</td>
                  <td className="px-4 py-3 text-muted">{req.unitNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${typeColors[req.moveType] || ''}`}>
                      {req.moveType === 'MOVE_IN' ? 'Move In' : 'Move Out'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(req.scheduledDate)}</td>
                  <td className="px-4 py-3 text-muted">{req.timeSlot || '-'}</td>
                  <td className="px-4 py-3 text-muted">{req.moversCompany || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[req.status] || ''}`}>{req.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {req.status === 'PENDING' && (
                        <>
                          <button onClick={() => { setActionModal({ ...req, action: 'approve' }); setRemarks(''); }}
                            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors" title="Approve">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { setActionModal({ ...req, action: 'reject' }); setRemarks(''); }}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Reject">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {req.status === 'APPROVED' && (
                        <button onClick={() => handleComplete(req.id)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors" title="Mark Complete">
                          <Clock className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr><td colSpan={8}><EmptyState icon={Truck} title="No move requests" description="Move in/out requests will appear here." /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details for each request */}
      {requests.filter(r => r.notes || r.vehicleDetails || r.adminRemarks).length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {requests.filter(r => r.status === 'PENDING' || r.status === 'APPROVED').map(req => (
            <div key={req.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${typeColors[req.moveType]}`}>
                  {req.moveType === 'MOVE_IN' ? 'Move In' : 'Move Out'}
                </span>
                <span className="text-[13px] font-bold text-heading">{req.userName} — {propertyLabel} {req.unitNumber}</span>
              </div>
              <div className="space-y-1 text-[12px] text-muted">
                {req.vehicleDetails && <p><span className="font-medium text-heading">Vehicle:</span> {req.vehicleDetails}</p>}
                {req.moversCompany && <p><span className="font-medium text-heading">Movers:</span> {req.moversCompany} {req.moversPhone ? `(${req.moversPhone})` : ''}</p>}
                {req.notes && <p><span className="font-medium text-heading">Notes:</span> {req.notes}</p>}
                {req.adminRemarks && <p><span className="font-medium text-heading">Admin Remarks:</span> {req.adminRemarks}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {actionModal && (
        <Modal open title={actionModal.action === 'approve' ? 'Approve Move Request' : 'Reject Move Request'}
          onClose={() => { setActionModal(null); setRemarks(''); }}>
          <div className="space-y-4">
            <div className="bg-card-alt rounded-lg p-3 text-[13px]">
              <p><span className="font-medium text-heading">Resident:</span> <span className="text-muted">{actionModal.userName}</span></p>
              <p><span className="font-medium text-heading">{propertyLabel}:</span> <span className="text-muted">{actionModal.unitNumber}</span></p>
              <p><span className="font-medium text-heading">Type:</span> <span className="text-muted">{actionModal.moveType === 'MOVE_IN' ? 'Move In' : 'Move Out'}</span></p>
              <p><span className="font-medium text-heading">Date:</span> <span className="text-muted">{formatDate(actionModal.scheduledDate)}</span></p>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-heading mb-1">Admin Remarks</label>
              <textarea value={remarks} onChange={e => setRemarks(e.target.value)}
                className="w-full px-3 py-2 bg-card border border-border rounded-lg text-[13px] text-heading" rows={3}
                placeholder="Optional remarks..." />
            </div>
            <button onClick={actionModal.action === 'approve' ? handleApprove : handleReject}
              className={`w-full py-2.5 text-white rounded-lg text-[13px] font-medium transition-colors ${
                actionModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}>
              {actionModal.action === 'approve' ? 'Approve Request' : 'Reject Request'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
