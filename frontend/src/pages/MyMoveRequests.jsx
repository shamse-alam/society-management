import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { useToast } from '../components/Toast';
import { ListSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { Truck, Plus, Calendar, MapPin, Save } from 'lucide-react';
import { useSocietyConfig } from '../context/SocietyConfigContext';

function formatDate(str) {
  if (!str) return '-';
  return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MyMoveRequests() {
  const toast = useToast();
  const { config } = useSocietyConfig();
  const propertyLabel = config?.propertyLabel || 'Property';
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ moveType: 'MOVE_IN', scheduledDate: '', timeSlot: '', vehicleDetails: '', moversCompany: '', moversPhone: '', notes: '' });

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      const res = await userAPI.getMoveRequests();
      setRequests(res.data);
    } catch {
      toast.error('Failed to load move requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await userAPI.createMoveRequest(form);
      toast.success('Move request submitted');
      setShowModal(false);
      setForm({ moveType: 'MOVE_IN', scheduledDate: '', timeSlot: '', vehicleDetails: '', moversCompany: '', moversPhone: '', notes: '' });
      fetchRequests();
    } catch {
      toast.error('Failed to submit request');
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

  if (loading) return <ListSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-heading">My Move Requests</h1>
          <p className="text-[13px] text-muted mt-1">{requests.length} requests</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {requests.map(req => (
          <div key={req.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${typeColors[req.moveType]}`}>
                {req.moveType === 'MOVE_IN' ? 'Move In' : 'Move Out'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[req.status]}`}>{req.status}</span>
            </div>

            <div className="space-y-1.5 text-[12px] text-muted">
              <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{propertyLabel} {req.unitNumber}</p>
              <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(req.scheduledDate)}{req.timeSlot ? ` — ${req.timeSlot}` : ''}</p>
              {req.moversCompany && <p className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" />{req.moversCompany}{req.moversPhone ? ` (${req.moversPhone})` : ''}</p>}
              {req.vehicleDetails && <p><span className="font-medium text-heading">Vehicle:</span> {req.vehicleDetails}</p>}
              {req.notes && <p><span className="font-medium text-heading">Notes:</span> {req.notes}</p>}
              {req.adminRemarks && (
                <div className="mt-2 p-2 bg-card-alt rounded-lg">
                  <p className="font-medium text-heading">Admin Remarks:</p>
                  <p>{req.adminRemarks}</p>
                </div>
              )}
            </div>

            {req.nocIssued && (
              <div className="mt-3 px-2 py-1 bg-green-50 dark:bg-green-500/10 rounded-lg text-[11px] text-green-700 dark:text-green-400 font-medium">
                NOC Issued {req.nocIssuedDate ? `on ${formatDate(req.nocIssuedDate)}` : ''}
              </div>
            )}
          </div>
        ))}

        {requests.length === 0 && (
          <div className="col-span-full">
            <EmptyState icon={Truck} title="No move requests" description="Submit a request when you need to move in or out" />
          </div>
        )}
      </div>

      {showModal && (
        <Modal open title="New Move Request" onClose={() => setShowModal(false)} full>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <h2 className="text-[14px] font-semibold text-heading mb-2">Move Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-medium text-heading mb-1">Scheduled Date *</label>
                      <input type="date" required value={form.scheduledDate} onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                        className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-heading mb-1">Vehicle Details</label>
                      <input type="text" value={form.vehicleDetails} onChange={e => setForm({ ...form, vehicleDetails: e.target.value })}
                        className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="Truck / tempo number" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-medium text-heading mb-1">Movers Company</label>
                      <input type="text" value={form.moversCompany} onChange={e => setForm({ ...form, moversCompany: e.target.value })}
                        className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="Company name" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-heading mb-1">Movers Phone</label>
                      <input type="text" value={form.moversPhone} onChange={e => setForm({ ...form, moversPhone: e.target.value })}
                        className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="Phone number" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Notes</label>
                    <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                      className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading resize-none" rows={3} placeholder="Any additional details..." />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-border rounded-lg text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Submit Request</button>
                  </div>
                </div>
              </div>
              <div className="space-y-6 md:sticky md:top-4 md:self-start">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="text-[14px] font-semibold text-heading mb-1">Move Type</h2>
                  <p className="text-[11px] text-muted mb-3">Are you moving in or out?</p>
                  <select value={form.moveType} onChange={e => setForm({ ...form, moveType: e.target.value })}
                    className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                    <option value="MOVE_IN">Move In</option>
                    <option value="MOVE_OUT">Move Out</option>
                  </select>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="text-[14px] font-semibold text-heading mb-1">Time Slot</h2>
                  <p className="text-[11px] text-muted mb-3">Preferred time for the move.</p>
                  <select value={form.timeSlot} onChange={e => setForm({ ...form, timeSlot: e.target.value })}
                    className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                    <option value="">Select slot</option>
                    <option value="6 AM - 10 AM">6 AM - 10 AM</option>
                    <option value="10 AM - 2 PM">10 AM - 2 PM</option>
                    <option value="2 PM - 6 PM">2 PM - 6 PM</option>
                    <option value="6 PM - 10 PM">6 PM - 10 PM</option>
                  </select>
                </div>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
