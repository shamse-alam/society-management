import { ButtonSpinner } from '../components/Spinner';
import { ListSkeleton } from '../components/Skeleton';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI, userAPI } from '../services/api';
import Modal from '../components/Modal';
import { CalendarDays, Plus, XCircle, Building2, BedDouble, PartyPopper, Save } from 'lucide-react';
import { formatNumber } from '../utils/format';

const AMENITY_ICONS = {
  'Function Hall': PartyPopper,
  'Bedroom 1': BedDouble,
  'Bedroom 2': BedDouble,
};

const STATUS_COLORS = {
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
};

const PAYMENT_COLORS = {
  PAID: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
};

export default function AmenityBooking() {
  const { isAdmin } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ userId: '', amenityId: '', bookingDate: '', bookingEndDate: '', purpose: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try {
      const [bookingsRes, amenitiesRes] = await Promise.all([
        isAdmin ? adminAPI.getAllBookings() : userAPI.getMyBookings(),
        isAdmin ? adminAPI.getAmenities() : userAPI.getAmenities(),
      ]);
      setBookings(bookingsRes.data);
      setAmenities(amenitiesRes.data);
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

  const selectedAmenity = amenities.find(a => a.id === Number(form.amenityId));
  const days = form.bookingDate && form.bookingEndDate
    ? Math.max(1, Math.ceil((new Date(form.bookingEndDate) - new Date(form.bookingDate)) / 86400000) + 1)
    : 0;
  const totalCharge = selectedAmenity && days > 0 ? selectedAmenity.chargePerDay * days : 0;

  const handleBook = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        userId: isAdmin && form.userId ? Number(form.userId) : undefined,
        amenityId: Number(form.amenityId),
        bookingDate: form.bookingDate,
        bookingEndDate: form.bookingEndDate,
        purpose: form.purpose,
      };
      if (isAdmin) {
        await adminAPI.createBooking(payload);
      } else {
        await userAPI.createBooking(payload);
      }
      setModalOpen(false);
      setSuccess('Booking requested! Estimated charge: ₹' + totalCharge.toLocaleString('en-IN') + '. Payment will be captured on confirmation.');
      setTimeout(() => setSuccess(''), 4000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      if (isAdmin) {
        await adminAPI.cancelBooking(id);
      } else {
        await userAPI.cancelBooking(id);
      }
      setSuccess('Booking cancelled');
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Amenity Booking</h1>
          <p className="text-gray-500 mt-1">Book function hall & guest bedrooms</p>
        </div>
        <button onClick={() => { setForm({ userId: '', amenityId: '', bookingDate: today, bookingEndDate: today, purpose: '' }); setError(''); setModalOpen(true); }}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="w-5 h-5" /> New Booking
        </button>
      </div>

      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

      {/* Amenity Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {amenities.map((a) => {
          const Icon = AMENITY_ICONS[a.name] || Building2;
          return (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{a.name}</h3>
                  <p className="text-xs text-gray-500">{a.description}</p>
                </div>
              </div>
              <p className="text-lg font-bold text-indigo-600 mt-2">₹{Number(a.chargePerDay).toLocaleString('en-IN')}<span className="text-xs text-gray-400 font-normal">/day</span></p>
            </div>
          );
        })}
      </div>

      {/* Bookings Table */}
      {loading ? (
        <ListSkeleton />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Amenity</th>
                  {isAdmin && <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Booked By</th>}
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Dates</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Purpose</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Charge</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Payment</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{b.amenityName}</td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{b.fullName}</p>
                        <p className="text-xs text-gray-500">@{b.username}</p>
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-600">{b.bookingDate} to {b.bookingEndDate}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{b.purpose || '-'}</td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">₹{Number(b.totalCharge).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[b.status]}`}>{b.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      {b.paymentStatus ? (
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${PAYMENT_COLORS[b.paymentStatus] || 'bg-gray-100 text-gray-700'}`}>{b.paymentStatus}</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {b.status === 'CONFIRMED' && (
                        <button onClick={() => handleCancel(b.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cancel booking">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr><td colSpan={isAdmin ? 8 : 7} className="px-6 py-12 text-center text-gray-500">No bookings yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Book Amenity" full>
        {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-lg text-[13px]">{error}</div>}
        <form onSubmit={handleBook}>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h2 className="text-[14px] font-semibold text-heading mb-2">Booking Details</h2>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">From Date *</label>
                    <input type="date" min={today} value={form.bookingDate}
                      onChange={(e) => setForm({ ...form, bookingDate: e.target.value, bookingEndDate: e.target.value > form.bookingEndDate ? e.target.value : form.bookingEndDate })}
                      className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">To Date *</label>
                    <input type="date" min={form.bookingDate || today} value={form.bookingEndDate}
                      onChange={(e) => setForm({ ...form, bookingEndDate: e.target.value })}
                      className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Purpose</label>
                  <input type="text" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                    className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="e.g. Birthday party, Guest stay" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-border rounded-lg text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    {saving ? <><ButtonSpinner /> Booking...</> : <><Save className="w-4 h-4" /> Confirm Booking</>}
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-6 md:sticky md:top-4 md:self-start">
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-[14px] font-semibold text-heading mb-1">Amenity</h2>
                <p className="text-[11px] text-muted mb-3">Select the facility to book.</p>
                <select value={form.amenityId} onChange={(e) => setForm({ ...form, amenityId: e.target.value })}
                  className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required>
                  <option value="">-- Select Amenity --</option>
                  {amenities.filter(a => a.available).map(a => (
                    <option key={a.id} value={a.id}>{a.name} - ₹{Number(a.chargePerDay).toLocaleString('en-IN')}/day</option>
                  ))}
                </select>
              </div>
              {selectedAmenity && days > 0 && (
                <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-5 text-center">
                  <p className="text-[11px] text-muted">{selectedAmenity.name} x {days} day(s)</p>
                  <p className="text-[24px] font-bold text-indigo-700 dark:text-indigo-400">₹{totalCharge.toLocaleString('en-IN')}</p>
                </div>
              )}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
