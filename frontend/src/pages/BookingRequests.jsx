import { ButtonSpinner } from '../components/Spinner';
import { ListSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import UserAvatar from '../components/UserAvatar';
import { CheckCircle, XCircle, IndianRupee, CalendarDays } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
  CONFIRMED: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};

const PAYMENT_COLORS = {
  PAID: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
};

const fmt = (n) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 });

export default function BookingRequests() {
  const confirm = useConfirm();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try { const res = await adminAPI.getAllBookings(); setBookings(res.data); }
    catch (err) { console.error('Failed to load bookings', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleConfirm = async (id) => {
    try { await adminAPI.confirmBooking(id); setSuccess('Booking confirmed — pending invoice created for payment'); setTimeout(() => setSuccess(''), 3000); fetchData(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to confirm booking'); }
  };

  const handleCancel = async (id) => {
    if (!await confirm({ title: 'Cancel Booking', message: 'Cancel this booking? Any associated invoice will be removed.', confirmLabel: 'Cancel Booking', danger: true })) return;
    try { await adminAPI.cancelBooking(id); setSuccess('Booking cancelled and payment removed'); setTimeout(() => setSuccess(''), 3000); fetchData(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to cancel booking'); }
  };

  const allFiltered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter);
  const pendingCount = bookings.filter(b => b.status === 'PENDING').length;

  const PAGE_SIZE = 30;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const filtered = allFiltered.slice(0, visibleCount);
  const hasMore = visibleCount < allFiltered.length;

  const tabs = [
    { value: 'PENDING', label: `Pending (${pendingCount})` },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'ALL', label: 'All' },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">Facility Reservation Requests</h1>
          <p className="text-[13px] text-muted mt-0.5">Review and manage facility booking requests</p>
        </div>
      </div>

      {success && <div className="mb-4 p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 rounded text-[13px]">{success}</div>}

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-5 pt-4 pb-0 border-b border-border flex flex-wrap gap-0">
          {tabs.map(t => (
            <button key={t.value} onClick={() => { setFilter(t.value); setVisibleCount(PAGE_SIZE); }}
              className={`px-4 py-2.5 text-[13px] font-medium transition-colors relative ${filter === t.value ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted hover:text-heading'}`}>
              {t.label}
              {filter === t.value && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600 dark:bg-indigo-400 rounded-t" />}
            </button>
          ))}
        </div>

        {loading ? <ListSkeleton /> : (
          <div className="table-container-lg">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Requested By</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Amenity</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Dates</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Purpose</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Charge</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Status</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Payment</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={b.fullName} src={b.profileImage} />
                        <div>
                          <p className="text-[13px] font-medium text-heading">{b.fullName}</p>
                          <p className="text-[11px] text-muted">@{b.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[13px] font-medium text-heading">{b.amenityName}</td>
                    <td className="px-5 py-3 text-[13px] text-muted">{b.bookingDate} to {b.bookingEndDate}</td>
                    <td className="px-5 py-3 text-[13px] text-muted">{b.purpose || '-'}</td>
                    <td className="px-5 py-3 text-right text-[13px] font-semibold text-heading">₹{fmt(b.totalCharge)}</td>
                    <td className="px-5 py-3"><span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-700'}`}>{b.status}</span></td>
                    <td className="px-5 py-3">
                      {b.paymentStatus ? (
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${PAYMENT_COLORS[b.paymentStatus] || 'bg-gray-100 text-gray-700'}`}>{b.paymentStatus}</span>
                      ) : (
                        <span className="text-[11px] text-muted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {b.status === 'PENDING' && (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleConfirm(b.id)} className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 rounded transition-colors" title="Confirm"><CheckCircle className="w-5 h-5" /></button>
                          <button onClick={() => handleCancel(b.id)} className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors" title="Cancel"><XCircle className="w-5 h-5" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={8}><EmptyState icon={CalendarDays} title="No bookings found" description="There are no booking requests matching your filter criteria." /></td></tr>}
              </tbody>
            </table>
            {hasMore && (
              <div className="px-5 py-3 border-t border-border text-center">
                <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)} className="text-[13px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">
                  Show more ({allFiltered.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
