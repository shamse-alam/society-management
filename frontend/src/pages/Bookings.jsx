import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { ListSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { Plus, X, Building2, BedDouble, PartyPopper, IndianRupee, CalendarDays, Save } from 'lucide-react';

const AMENITY_ICONS = { 'Function Hall': PartyPopper, 'Room 201': BedDouble, 'Room 202': BedDouble };
const STATUS_COLORS = { CONFIRMED: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400', PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400', CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' };
const fmt = (n) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 });

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState([]);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try {
      const [bookingsRes, amenitiesRes] = await Promise.all([userAPI.getMyBookings(), userAPI.getAmenities()]);
      setBookings(bookingsRes.data); setAmenities(amenitiesRes.data);
    } catch (err) { console.error('Failed to load data', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const today = new Date().toISOString().split('T')[0];

  const openModal = () => {
    setSelectedAmenityIds([]); setForm({ bookingDate: today, bookingEndDate: today, purpose: '' }); setError(''); setModalOpen(true);
  };

  const handleAmenitySelect = (e) => {
    const id = Number(e.target.value);
    if (id && !selectedAmenityIds.includes(id)) setSelectedAmenityIds([...selectedAmenityIds, id]);
    e.target.value = '';
  };

  const removeAmenity = (id) => setSelectedAmenityIds(selectedAmenityIds.filter(a => a !== id));

  const selectedAmenities = amenities.filter(a => selectedAmenityIds.includes(a.id));
  const bookingDays = form.bookingDate && form.bookingEndDate ? Math.max(1, Math.ceil((new Date(form.bookingEndDate) - new Date(form.bookingDate)) / 86400000) + 1) : 0;
  const totalCharge = selectedAmenities.reduce((sum, a) => sum + (a.chargePerDay * bookingDays), 0);
  const availableToSelect = amenities.filter(a => a.available && !selectedAmenityIds.includes(a.id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedAmenityIds.length === 0) { setError('Please select at least one amenity'); return; }
    setError(''); setSaving(true);
    try {
      await Promise.all(selectedAmenityIds.map(amenityId => userAPI.createBooking({ amenityId, bookingDate: form.bookingDate, bookingEndDate: form.bookingEndDate, purpose: form.purpose })));
      setSuccess(`${selectedAmenityIds.length} booking(s) submitted! Pending admin confirmation.`);
      setModalOpen(false); setTimeout(() => setSuccess(''), 3000); fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Failed to create booking'); }
    finally { setSaving(false); }
  };

  const PAGE_SIZE = 30;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleBookings = bookings.slice(0, visibleCount);
  const hasMore = visibleCount < bookings.length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">Facility Reservations</h1>
          <p className="text-[13px] text-muted mt-0.5">Book function hall and guest rooms for your events</p>
        </div>
        <button onClick={openModal} className="btn-primary inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-indigo-700 transition-colors"><Plus className="w-4 h-4" /> Book Facility</button>
      </div>

      {success && <div className="mb-4 p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 rounded text-[13px]">{success}</div>}

      {amenities.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {amenities.map((a) => {
            const Icon = AMENITY_ICONS[a.name] || Building2;
            return (
              <div key={a.id} className="bg-card rounded-lg border border-border p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/15 rounded-lg flex items-center justify-center shrink-0"><Icon className="w-6 h-6 text-purple-600 dark:text-purple-400" /></div>
                <div className="min-w-0">
                  <h3 className="text-[13px] font-semibold text-heading">{a.name}</h3>
                  <p className="text-[16px] font-bold text-indigo-600 dark:text-indigo-400">₹{fmt(a.chargePerDay)}<span className="text-[11px] text-muted font-normal"> /day</span></p>
                  <p className="text-[11px] text-muted">{a.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {loading ? <ListSkeleton /> : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border"><h2 className="text-[13px] font-semibold text-heading">My Reservations</h2></div>
          <div className="table-container-lg">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Amenity</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Dates</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Purpose</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Charge</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleBookings.map((b) => (
                  <tr key={b.id} className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                    <td className="px-5 py-3 text-[13px] font-medium text-heading">{b.amenityName}</td>
                    <td className="px-5 py-3 text-[13px] text-muted">{b.bookingDate} to {b.bookingEndDate}</td>
                    <td className="px-5 py-3 text-[13px] text-muted">{b.purpose || '-'}</td>
                    <td className="px-5 py-3 text-right text-[13px] font-semibold text-heading">₹{fmt(b.totalCharge)}</td>
                    <td className="px-5 py-3"><span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-700'}`}>{b.status}</span></td>
                  </tr>
                ))}
                {bookings.length === 0 && <tr><td colSpan={5}><EmptyState icon={CalendarDays} title="No bookings yet" description="Your facility reservations will appear here" /></td></tr>}
              </tbody>
            </table>
            {hasMore && (
              <div className="px-5 py-3 border-t border-border text-center">
                <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)} className="text-[13px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">
                  Show more ({bookings.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Booking" full>
        {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-lg text-[13px]">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[14px] font-semibold text-heading">Booking Details</h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
              <button type="submit" disabled={saving || selectedAmenityIds.length === 0} className="px-4 py-2 bg-indigo-600 text-white rounded text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">{saving ? 'Processing...' : <><Save className="w-4 h-4" /> Confirm Booking</>}</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Amenities</label>
                  <select value="" onChange={handleAmenitySelect} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                    <option value="">-- Add Amenity --</option>
                    {availableToSelect.map(a => <option key={a.id} value={a.id}>{a.name} - ₹{fmt(a.chargePerDay)}/day</option>)}
                  </select>
                  {selectedAmenities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedAmenities.map(a => (
                        <span key={a.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded text-[13px] font-medium">
                          {a.name}<span className="text-[11px] text-indigo-400 dark:text-indigo-500">(₹{fmt(a.chargePerDay)}/day)</span>
                          <button type="button" onClick={() => removeAmenity(a.id)} className="ml-0.5 text-indigo-400 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">From Date *</label>
                    <input type="date" min={today} value={form.bookingDate} onChange={(e) => setForm({ ...form, bookingDate: e.target.value, bookingEndDate: e.target.value > form.bookingEndDate ? e.target.value : form.bookingEndDate })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">To Date *</label>
                    <input type="date" min={form.bookingDate || today} value={form.bookingEndDate} onChange={(e) => setForm({ ...form, bookingEndDate: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Purpose</label>
                  <input type="text" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="e.g. Birthday party, Guest stay" />
                </div>
              </div>
            </div>
            <div className="space-y-6 md:sticky md:top-4 md:self-start">
              {selectedAmenities.length > 0 && bookingDays > 0 && (
                <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-5">
                  <h2 className="text-[14px] font-semibold text-heading mb-3">Cost Summary</h2>
                  <div className="space-y-1">
                    {selectedAmenities.map(a => (
                      <div key={a.id} className="flex justify-between text-[13px] text-sub"><span>{a.name} x {bookingDays} day(s)</span><span className="font-medium">₹{(a.chargePerDay * bookingDays).toLocaleString('en-IN')}</span></div>
                    ))}
                  </div>
                  {selectedAmenities.length > 1 && <div className="border-t border-indigo-200 dark:border-indigo-500/30 my-2" />}
                  <div className="flex justify-between items-center mt-2"><span className="text-[13px] font-medium text-sub">Total</span><span className="text-[20px] font-bold text-indigo-700 dark:text-indigo-400">₹{totalCharge.toLocaleString('en-IN')}</span></div>
                </div>
              )}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
