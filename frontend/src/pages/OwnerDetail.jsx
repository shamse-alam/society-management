import { ButtonSpinner } from '../components/Spinner';
import { FormSkeleton } from '../components/Skeleton';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import UserAvatar from '../components/UserAvatar';
import { ArrowLeft, Mail, Phone, MapPin, Home, IndianRupee, CalendarDays, CreditCard, Clock, CheckCircle2, XCircle, Wrench, Landmark, UserPlus, CalendarCheck, ChevronDown, AlertCircle } from 'lucide-react';
import { useSocietyConfig } from '../context/SocietyConfigContext';
import { formatDate } from '../utils/format';

const fmt = (n) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 });

const STATUS_COLORS = {
  PAID: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  CONFIRMED: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
};

const TYPE_COLORS = {
  MAINTENANCE: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  CORPUS: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  MEMBERSHIP: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  AMENITY_BOOKING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
};

const TYPE_ICONS = {
  MAINTENANCE: Wrench,
  CORPUS: Landmark,
  MEMBERSHIP: UserPlus,
  AMENITY_BOOKING: CalendarCheck,
};

export default function OwnerDetail() {
  const { id } = useParams();
  const { config } = useSocietyConfig();
  const propertyLabel = config?.propertyLabel || 'Property';
  const [user, setUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [duesOpen, setDuesOpen] = useState(true);
  const [txnOpen, setTxnOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, paymentsRes, bookingsRes] = await Promise.all([
          adminAPI.getUser(id),
          adminAPI.getPaymentsByUser(id),
          adminAPI.getAllBookings(),
        ]);
        setUser(userRes.data);
        setPayments(paymentsRes.data);
        setBookings(bookingsRes.data.filter(b => b.userId === Number(id)));
      } catch (err) { console.error('Failed to load owner detail', err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  if (loading) return <FormSkeleton fields={6} />;
  if (!user) return <div className="text-center py-16 text-muted text-[13px]">Owner not found</div>;

  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + Number(p.amount), 0);
  const paidPayments = payments.filter(p => p.status === 'PAID');
  const pendingPayments = payments.filter(p => p.status === 'PENDING');

  return (
    <div>
      <Link to="/users" className="inline-flex items-center gap-2 text-muted hover:text-heading mb-4 text-[13px] font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Members
      </Link>

      {/* Profile Header */}
      <div className="bg-card rounded-lg border border-border overflow-hidden mb-6">
        <div className="px-5 py-4">
          <div className="flex items-center gap-4">
            <UserAvatar name={user.fullName} src={user.profileImage} size="lg" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-heading">{user.fullName}</h1>
                <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400'}`}>{user.role}</span>
              </div>
              <p className="text-[13px] text-muted">@{user.username}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
            {user.email && <div className="flex items-center gap-2 text-[13px] text-sub"><Mail className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />{user.email}</div>}
            {user.phone && <div className="flex items-center gap-2 text-[13px] text-sub"><Phone className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />{user.phone}</div>}
            {user.unitNumber && <div className="flex items-center gap-2 text-[13px] text-sub"><Home className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />{propertyLabel} {user.unitNumber}</div>}
            {user.address && <div className="flex items-center gap-2 text-[13px] text-sub"><MapPin className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />{user.address}</div>}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg border border-border p-5 stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Amount Settled</p>
              <p className="text-[20px] font-bold text-green-600 dark:text-green-400 mt-1">₹{fmt(totalPaid)}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-500/15 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5 stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Outstanding Dues</p>
              <p className="text-[20px] font-bold text-amber-600 dark:text-amber-400 mt-1">₹{fmt(totalPending)}</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/15 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5 stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Transactions</p>
              <p className="text-[20px] font-bold text-heading mt-1">{payments.length}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/15 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5 stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Facility Bookings</p>
              <p className="text-[20px] font-bold text-heading mt-1">{bookings.length}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/15 rounded-lg flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Dues (collapsible) */}
      {pendingPayments.length > 0 && (
        <div className="bg-card rounded-lg border border-border overflow-hidden mb-6">
          <button onClick={() => setDuesOpen(!duesOpen)} className="w-full px-5 py-3 border-b border-border bg-amber-50 dark:bg-amber-500/5 flex items-center justify-between hover:bg-amber-100/50 dark:hover:bg-amber-500/10 transition-colors">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h2 className="text-[13px] font-semibold text-amber-700 dark:text-amber-400">Outstanding Dues ({pendingPayments.length})</h2>
              <span className="text-[13px] font-bold text-amber-700 dark:text-amber-400 ml-2">₹{fmt(totalPending)}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-amber-600 dark:text-amber-400 transition-transform duration-200 ${duesOpen ? 'rotate-180' : ''}`} />
          </button>
          {duesOpen && (
            <div className="table-container">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Type</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Description</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Period</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPayments.map(p => (
                    <tr key={p.id} className="border-b border-dashed border-border">
                      <td className="px-5 py-3">{(() => { const Icon = TYPE_ICONS[p.paymentType]; return (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${TYPE_COLORS[p.paymentType] || 'bg-gray-100 text-gray-700'}`}>
                          {Icon && <Icon className="w-3 h-3" />}{p.paymentType?.replace(/_/g, ' ')}
                        </span>
                      ); })()}</td>
                      <td className="px-5 py-3 text-[13px] text-muted">{p.description || '-'}</td>
                      <td className="px-5 py-3 text-[13px] text-muted">{p.periodFrom && p.periodTo ? `${p.periodFrom} to ${p.periodTo}` : 'One Time'}</td>
                      <td className="px-5 py-3 text-right text-[13px] font-semibold text-amber-700 dark:text-amber-400">₹{fmt(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-amber-50 dark:bg-amber-500/10 border-t-2 border-amber-200 dark:border-amber-500/20">
                    <td colSpan={3} className="px-5 py-3 text-[13px] font-semibold text-amber-800 dark:text-amber-400">Total Outstanding</td>
                    <td className="px-5 py-3 text-right text-[13px] font-bold text-amber-800 dark:text-amber-400">₹{fmt(totalPending)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Transaction History (collapsible) */}
      <div className="bg-card rounded-lg border border-border overflow-hidden mb-6">
        <button onClick={() => setTxnOpen(!txnOpen)} className="w-full px-5 py-3 bg-card-alt border-b border-border flex items-center justify-between hover:bg-card-hover transition-colors">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-muted" />
            <h2 className="text-[13px] font-semibold text-heading">Transaction History</h2>
            <span className="text-[11px] text-muted px-2 py-0.5 bg-card rounded">{paidPayments.length} entries</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 ${txnOpen ? 'rotate-180' : ''}`} />
        </button>
        {txnOpen && (
          <div className="table-container">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Receipt</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Type</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Status</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Period</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Amount</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Date</th>
                </tr>
              </thead>
              <tbody>
                {paidPayments.map(p => (
                  <tr key={p.id} className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                    <td className="px-5 py-3 text-[13px] font-medium text-heading">{p.receiptNumber}</td>
                    <td className="px-5 py-3">{(() => { const Icon = TYPE_ICONS[p.paymentType]; return (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${TYPE_COLORS[p.paymentType] || 'bg-gray-100 text-gray-700'}`}>
                        {Icon && <Icon className="w-3 h-3" />}{p.paymentType?.replace(/_/g, ' ')}
                      </span>
                    ); })()}</td>
                    <td className="px-5 py-3"><span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${STATUS_COLORS[p.status]}`}>{p.status}</span></td>
                    <td className="px-5 py-3 text-[13px] text-muted">{p.periodFrom && p.periodTo ? `${p.periodFrom} to ${p.periodTo}` : 'One Time'}</td>
                    <td className="px-5 py-3 text-right text-[13px] font-semibold text-heading">₹{fmt(p.amount)}</td>
                    <td className="px-5 py-3 text-[13px] text-muted">{formatDate(p.paidAt)}</td>
                  </tr>
                ))}
                {paidPayments.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-muted text-[13px]">No payment history</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Facility Booking History (collapsible) */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <button onClick={() => setBookingOpen(!bookingOpen)} className="w-full px-5 py-3 bg-card-alt border-b border-border flex items-center justify-between hover:bg-card-hover transition-colors">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-muted" />
            <h2 className="text-[13px] font-semibold text-heading">Facility Booking History</h2>
            <span className="text-[11px] text-muted px-2 py-0.5 bg-card rounded">{bookings.length} entries</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 ${bookingOpen ? 'rotate-180' : ''}`} />
        </button>
        {bookingOpen && (
          <div className="table-container">
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
                {bookings.map(b => (
                  <tr key={b.id} className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                    <td className="px-5 py-3 text-[13px] font-medium text-heading">{b.amenityName}</td>
                    <td className="px-5 py-3 text-[13px] text-muted">{b.bookingDate} to {b.bookingEndDate}</td>
                    <td className="px-5 py-3 text-[13px] text-muted">{b.purpose || '-'}</td>
                    <td className="px-5 py-3 text-right text-[13px] font-semibold text-heading">₹{fmt(b.totalCharge)}</td>
                    <td className="px-5 py-3"><span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-700'}`}>{b.status}</span></td>
                  </tr>
                ))}
                {bookings.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-muted text-[13px]">No bookings</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
