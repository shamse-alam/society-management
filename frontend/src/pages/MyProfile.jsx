import { ButtonSpinner } from '../components/Spinner';
import { FormSkeleton } from '../components/Skeleton';
import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import UserAvatar from '../components/UserAvatar';
import { useToast } from '../components/Toast';
import { User, Mail, Phone, MapPin, Building2, Pencil, Save, X, CreditCard, CalendarDays, AlertCircle, CheckCircle2, Clock, IndianRupee, Camera, ChevronDown, Home } from 'lucide-react';
import { useSocietyConfig } from '../context/SocietyConfigContext';
import { getTypeColor } from '../utils/typeColors';

const STATUS_BADGE = {
  PAID: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  CONFIRMED: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
};

const fmt = (n) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 });

export default function MyProfile() {
  const toast = useToast();
  const { config } = useSocietyConfig();
  const propertyLabel = config?.propertyLabel || 'Property';
  const [profile, setProfile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ email: '', phone: '', address: '', unitNumber: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Profile image state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Collapsible sections
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [txnOpen, setTxnOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, propertiesRes, paymentsRes, bookingsRes] = await Promise.all([
          userAPI.getProfile(), userAPI.getProperties(), userAPI.getMyPayments(), userAPI.getMyBookings(),
        ]);
        setProfile(profileRes.data); setProperties(propertiesRes.data); setPayments(paymentsRes.data); setBookings(bookingsRes.data);
      } catch (err) { console.error('Failed to load profile data', err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const startEditing = () => {
    setForm({ email: profile.email || '', phone: profile.phone || '', address: profile.address || '', unitNumber: profile.unitNumber || '' });
    setError(''); setEditing(true);
  };

  const handleSave = async () => {
    setError(''); setSaving(true);
    try {
      const { data } = await userAPI.updateProfile(form);
      setProfile(data); setEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) { setError(err.response?.data?.message || 'Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be less than 5MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setUploadingImage(true);
    try {
      const { data } = await userAPI.uploadProfileImage(file);
      setProfile(data);
      toast.success('Profile photo updated');
    } catch (err) { toast.error('Failed to upload image'); }
    finally { setUploadingImage(false); }
  };

  if (loading) return <FormSkeleton fields={5} />;
  if (!profile) return <p className="text-muted">Failed to load profile</p>;

  const pendingPayments = payments.filter(p => p.status === 'PENDING');
  const paidPayments = payments.filter(p => p.status === 'PAID');
  const totalPaid = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingDues = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const myProperties = properties.filter(v => v.ownerName === profile.fullName);

  return (
    <div>
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">My Profile</h1>
          <p className="text-[13px] text-muted mt-0.5">View and manage your personal information & account settings</p>
        </div>
        {!editing && (
          <button onClick={startEditing} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-indigo-700 transition-colors">
            <Pencil className="w-4 h-4" /> Edit Profile
          </button>
        )}
      </div>

      {/* Profile Header */}
      <div className="bg-card rounded-lg border border-border overflow-hidden mb-6">
        <div className="px-5 py-4">
          <div className="flex items-center gap-4">
            <label className="relative cursor-pointer group">
              <UserAvatar name={profile.fullName} src={imagePreview || profile.profileImage} size="lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-3 h-3 text-white" />
              </div>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
            <div className="flex-1">
              <p className="text-lg font-semibold text-heading">{profile.fullName}</p>
              <p className="text-[13px] text-muted">@{profile.username} &middot; {profile.role}</p>
              {profile.unitNumber && <p className="text-[12px] text-muted mt-0.5">{propertyLabel} {profile.unitNumber}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { icon: CreditCard, color: 'bg-indigo-100 dark:bg-indigo-500/20', iconColor: 'text-indigo-600 dark:text-indigo-400', value: payments.length, label: 'Total Transactions', textColor: 'text-heading' },
          { icon: CheckCircle2, color: 'bg-green-100 dark:bg-green-500/20', iconColor: 'text-green-600 dark:text-green-400', value: `₹${fmt(totalPaid)}`, label: 'Amount Settled', textColor: 'text-green-600 dark:text-green-400' },
          { icon: Clock, color: 'bg-amber-100 dark:bg-amber-500/20', iconColor: 'text-amber-600 dark:text-amber-400', value: `₹${fmt(pendingDues)}`, label: 'Outstanding Dues', textColor: 'text-amber-600 dark:text-amber-400' },
          { icon: CalendarDays, color: 'bg-purple-100 dark:bg-purple-500/20', iconColor: 'text-purple-600 dark:text-purple-400', value: bookings.length, label: 'Facility Bookings', textColor: 'text-purple-600 dark:text-purple-400' },
        ].map((c) => (
          <div key={c.label} className="bg-card rounded-lg border border-border p-5 stat-card">
            <div className={`w-10 h-10 ${c.color} rounded-lg flex items-center justify-center mb-2`}>
              <c.icon className={`w-5 h-5 ${c.iconColor}`} />
            </div>
            <p className={`text-[20px] font-bold ${c.textColor}`}>{c.value}</p>
            <p className="text-[11px] text-muted mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Personal Information */}
      <div className="bg-card rounded-lg border border-border overflow-hidden mb-6">
        <div className="px-5 py-3 bg-card-alt border-b border-border">
          <h2 className="text-[13px] font-semibold text-heading">Personal Information</h2>
        </div>
        {editing ? (
          <div className="p-5">
            {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded text-[13px]">{error}</div>}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[{ icon: User, label: 'Username', value: profile.username }, { icon: User, label: 'First Name', value: profile.firstName }, { icon: User, label: 'Last Name', value: profile.lastName }].map(f => (
                  <div key={f.label} className="flex items-center gap-4 p-3 bg-card-alt rounded-lg">
                    <f.icon className="w-5 h-5 text-muted shrink-0" />
                    <div><p className="text-[11px] text-muted">{f.label}</p><p className="text-[13px] font-medium text-heading">{f.value}</p></div>
                    <span className="ml-auto text-[11px] text-muted italic">Read-only</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-[13px] font-medium text-sub mb-1">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading" /></div>
                <div><label className="block text-[13px] font-medium text-sub mb-1">Phone</label><input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-[13px] font-medium text-sub mb-1">Address</label><input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading" /></div>
                <div><label className="block text-[13px] font-medium text-sub mb-1">{propertyLabel} No.</label><select value={form.unitNumber} onChange={(e) => setForm({ ...form, unitNumber: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading"><option value="">-- Select --</option>{properties.map((v) => <option key={v.id} value={v.unitNumber}>{v.unitNumber} {v.ownerName ? `(${v.ownerName})` : ''}</option>)}</select></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => { setEditing(false); setError(''); }} className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded text-[13px] text-sub hover:bg-card-hover font-medium"><X className="w-4 h-4" /> Cancel</button>
                <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50"><Save className="w-4 h-4" /> {saving ? <><ButtonSpinner /> Saving...</> : 'Save Changes'}</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: User, label: 'Username', value: profile.username },
                { icon: User, label: 'First Name', value: profile.firstName || '-' },
                { icon: User, label: 'Last Name', value: profile.lastName || '-' },
                { icon: Mail, label: 'Email', value: profile.email || '-' },
                { icon: Phone, label: 'Phone', value: profile.phone || '-' },
                { icon: MapPin, label: 'Address', value: profile.address || '-' },
                { icon: Building2, label: `${propertyLabel} No.`, value: profile.unitNumber || '-' },
              ].map((field) => (
                <div key={field.label} className="flex items-center gap-3 p-3 bg-card-alt rounded-lg">
                  <field.icon className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                  <div><p className="text-[11px] text-muted">{field.label}</p><p className="text-[13px] font-medium text-heading">{field.value}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* My Properties (collapsible) */}
      {myProperties.length > 0 && (
        <div className="bg-card rounded-lg border border-border overflow-hidden mb-6">
          <button onClick={() => setPropertiesOpen(!propertiesOpen)} className="w-full px-5 py-3 bg-card-alt border-b border-border flex items-center justify-between hover:bg-card-hover transition-colors">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-muted" />
              <h2 className="text-[13px] font-semibold text-heading">My {propertyLabel}s</h2>
              <span className="text-[11px] text-muted px-2 py-0.5 bg-card rounded">{myProperties.length} {myProperties.length === 1 ? propertyLabel.toLowerCase() : `${propertyLabel.toLowerCase()}s`}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 ${propertiesOpen ? 'rotate-180' : ''}`} />
          </button>
          {propertiesOpen && (
            <div className="table-container">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">{propertyLabel} No.</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Status</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Area (sq.ft)</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Type</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Tenant</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {myProperties.map((v) => (
                    <tr key={v.id} className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                      <td className="px-5 py-3 text-[13px] font-semibold text-heading">{v.unitNumber}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${
                          v.status === 'OCCUPIED' ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400' :
                          v.status === 'RENTED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' :
                          'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400'
                        }`}>{v.status}</span>
                      </td>
                      <td className="px-5 py-3 text-[13px] text-muted">{v.areaInSqFt || '-'}</td>
                      <td className="px-5 py-3 text-[13px] text-muted">{v.propertyType || '-'}</td>
                      <td className="px-5 py-3 text-[13px] text-muted">{v.tenantName || '-'}</td>
                      <td className="px-5 py-3 text-[13px] text-muted">{v.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Outstanding Dues Alert */}
      {pendingPayments.length > 0 && (
        <div className="bg-card rounded-lg border border-border overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-border bg-amber-50 dark:bg-amber-500/5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-[13px] font-semibold text-amber-700 dark:text-amber-400">Outstanding Dues ({pendingPayments.length})</h3>
            <span className="ml-auto text-[13px] font-bold text-amber-700 dark:text-amber-400">₹{fmt(pendingDues)}</span>
          </div>
          <div className="table-container">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Particulars</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Description</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Billing Period</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map((p) => (
                  <tr key={p.id} className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                    <td className="px-5 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${getTypeColor(p.paymentType)}`}>
                        {p.paymentType?.replace(/_/g, ' ')}
                      </span></td>
                    <td className="px-5 py-3 text-[13px] text-muted">{p.description || '-'}</td>
                    <td className="px-5 py-3 text-[13px] text-muted">{p.periodFrom ? `${p.periodFrom} to ${p.periodTo}` : 'One-Time'}</td>
                    <td className="px-5 py-3 text-right text-[13px] font-semibold text-amber-700 dark:text-amber-400">₹{fmt(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-amber-50 dark:bg-amber-500/10 border-t-2 border-amber-200 dark:border-amber-500/20">
                  <td colSpan={3} className="px-5 py-3 text-[13px] font-bold text-amber-800 dark:text-amber-400 text-right">Total Outstanding</td>
                  <td className="px-5 py-3 text-right text-[13px] font-bold text-amber-800 dark:text-amber-400">₹{fmt(pendingDues)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Transaction History (collapsible) */}
      <div className="bg-card rounded-lg border border-border overflow-hidden mb-6">
        <button onClick={() => setTxnOpen(!txnOpen)} className="w-full px-5 py-3 bg-card-alt border-b border-border flex items-center justify-between hover:bg-card-hover transition-colors">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-muted" />
            <h2 className="text-[13px] font-semibold text-heading">Transaction History</h2>
            <span className="text-[11px] text-muted px-2 py-0.5 bg-card rounded">{payments.length} entries</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 ${txnOpen ? 'rotate-180' : ''}`} />
        </button>
        {txnOpen && (
          <div className="table-container">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Particulars</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Billing Period</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Description</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Amount (₹)</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                    <td className="px-5 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${getTypeColor(p.paymentType)}`}>
                        {p.paymentType?.replace(/_/g, ' ')}
                      </span></td>
                    <td className="px-5 py-3 text-[13px] text-muted">{p.periodFrom ? `${p.periodFrom} to ${p.periodTo}` : 'One-Time'}</td>
                    <td className="px-5 py-3 text-[13px] text-muted">{p.description || '-'}</td>
                    <td className="px-5 py-3 text-right text-[13px] font-semibold text-heading">₹{fmt(p.amount)}</td>
                    <td className="px-5 py-3"><span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${STATUS_BADGE[p.status] || 'bg-gray-100 text-gray-600'}`}>{p.status}</span></td>
                  </tr>
                ))}
                {payments.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-muted text-[13px]">No transactions found</td></tr>}
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
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Facility</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Booking Period</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Purpose</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Charges (₹)</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                    <td className="px-5 py-3 text-[13px] font-medium text-heading">{b.amenityName}</td>
                    <td className="px-5 py-3 text-[13px] text-muted">{b.bookingDate} to {b.bookingEndDate}</td>
                    <td className="px-5 py-3 text-[13px] text-muted">{b.purpose || '-'}</td>
                    <td className="px-5 py-3 text-right text-[13px] font-semibold text-heading">₹{fmt(b.totalCharge)}</td>
                    <td className="px-5 py-3"><span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${STATUS_BADGE[b.status] || 'bg-gray-100 text-gray-600'}`}>{b.status}</span></td>
                  </tr>
                ))}
                {bookings.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-muted text-[13px]">No bookings yet</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
