import { ButtonSpinner } from '../components/Spinner';
import { ListSkeleton } from '../components/Skeleton';
import { useState, useEffect } from 'react';
import { guardAPI } from '../services/api';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { Shield, Search, LogIn, LogOut, Users, Clock, Package, UserCheck, AlertTriangle, Truck, ChevronDown, Copy, Ban, Hourglass, Bell, Save } from 'lucide-react';
import { useSocietyConfig } from '../context/SocietyConfigContext';

const fmt = (dt) => {
  if (!dt) return '-';
  const d = new Date(dt);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
};

const duration = (checkIn) => {
  if (!checkIn) return '';
  const mins = Math.floor((Date.now() - new Date(checkIn).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

export default function GuardDashboard() {
  const toast = useToast();
  const { config } = useSocietyConfig();
  const propertyLabel = config?.propertyLabel || 'Property';
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('expected');
  const [stats, setStats] = useState({});
  const [expected, setExpected] = useState([]);
  const [awaiting, setAwaiting] = useState([]);
  const [inside, setInside] = useState([]);
  const [dailyHelp, setDailyHelp] = useState([]);
  const [deliveries, setDeliveries] = useState([]);

  // Passcode verification
  const [passcode, setPasscode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedVisitor, setVerifiedVisitor] = useState(null);

  // Walk-in modal
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInForm, setWalkInForm] = useState({ visitorName: '', visitorPhone: '', unitNumber: '', visitorType: 'GUEST', vehicleNumber: '', purpose: '' });
  const [walkInSaving, setWalkInSaving] = useState(false);

  // Delivery modal
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({ unitNumber: '', deliveryService: '', description: '' });
  const [deliverySaving, setDeliverySaving] = useState(false);

  // Pickup modal
  const [pickupOpen, setPickupOpen] = useState(false);
  const [pickupId, setPickupId] = useState(null);
  const [receivedBy, setReceivedBy] = useState('');

  // Properties list for dropdown
  const [properties, setProperties] = useState([]);

  const fetchAll = async () => {
    try {
      const [statsRes, expectedRes, awaitingRes, insideRes, helpRes, delRes] = await Promise.allSettled([
        guardAPI.getStats(),
        guardAPI.getExpected(),
        guardAPI.getAwaitingApproval(),
        guardAPI.getInside(),
        guardAPI.getDailyHelp(),
        guardAPI.getPendingDeliveries(),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (expectedRes.status === 'fulfilled') setExpected(expectedRes.value.data);
      if (awaitingRes.status === 'fulfilled') setAwaiting(awaitingRes.value.data);
      if (insideRes.status === 'fulfilled') setInside(insideRes.value.data);
      if (helpRes.status === 'fulfilled') setDailyHelp(helpRes.value.data);
      if (delRes.status === 'fulfilled') setDeliveries(delRes.value.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAll();
    guardAPI.getProperties().then(res => setProperties(res.data)).catch(() => {});
    const iv = setInterval(fetchAll, 30000);
    return () => clearInterval(iv);
  }, []);

  const handleVerify = async () => {
    if (!passcode.trim()) return;
    setVerifying(true);
    try {
      const res = await guardAPI.verifyPasscode(passcode.trim());
      setVerifiedVisitor(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired passcode');
      setVerifiedVisitor(null);
    }
    finally { setVerifying(false); }
  };

  const handleCheckIn = async (visitOrPasscode) => {
    try {
      const data = typeof visitOrPasscode === 'string'
        ? { passcode: visitOrPasscode }
        : { passcode: visitOrPasscode.passcode };
      await guardAPI.checkIn(data);
      toast.success('Visitor checked in');
      setVerifiedVisitor(null);
      setPasscode('');
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Check-in failed'); }
  };

  const handleCheckOut = async (id) => {
    try {
      await guardAPI.checkOut({ visitLogId: id });
      toast.success('Visitor checked out');
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Check-out failed'); }
  };

  const handleDeny = async (id) => {
    const notes = prompt('Reason for denial (optional):');
    try {
      await guardAPI.denyEntry(id, notes);
      toast.success('Entry denied');
      setVerifiedVisitor(null);
      setPasscode('');
      fetchAll();
    } catch (err) { toast.error('Failed to deny entry'); }
  };

  const handleWalkIn = async (e) => {
    e.preventDefault();
    setWalkInSaving(true);
    try {
      await guardAPI.requestApproval(walkInForm);
      toast.success('Approval request sent to resident');
      setWalkInOpen(false);
      setWalkInForm({ visitorName: '', visitorPhone: '', unitNumber: '', visitorType: 'GUEST', vehicleNumber: '', purpose: '' });
      setTab('awaiting');
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send approval request'); }
    finally { setWalkInSaving(false); }
  };

  const handleDailyHelpCheckIn = async (id) => {
    try {
      await guardAPI.checkInDailyHelp(id);
      toast.success('Daily help checked in');
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Check-in failed'); }
  };

  const handleLogDelivery = async (e) => {
    e.preventDefault();
    setDeliverySaving(true);
    try {
      await guardAPI.logDelivery(deliveryForm);
      toast.success('Delivery logged');
      setDeliveryOpen(false);
      setDeliveryForm({ unitNumber: '', deliveryService: '', description: '' });
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to log delivery'); }
    finally { setDeliverySaving(false); }
  };

  const handlePickUp = async () => {
    if (!receivedBy.trim()) { toast.error('Enter receiver name'); return; }
    try {
      await guardAPI.markPickedUp(pickupId, receivedBy);
      toast.success('Delivery marked as picked up');
      setPickupOpen(false);
      setPickupId(null);
      setReceivedBy('');
      fetchAll();
    } catch (err) { toast.error('Failed to mark pickup'); }
  };

  if (loading) return <ListSkeleton />;

  const tabs = [
    { id: 'awaiting', label: 'Awaiting', count: awaiting.length, icon: Hourglass },
    { id: 'expected', label: 'Approved', count: expected.length, icon: Clock },
    { id: 'inside', label: 'Inside', count: inside.length, icon: Users },
    { id: 'daily-help', label: 'Staff', count: dailyHelp.length, icon: UserCheck },
    { id: 'deliveries', label: 'Deliveries', count: deliveries.length, icon: Package },
  ];

  const categoryBadge = {
    MAID: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400',
    COOK: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
    DRIVER: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    GARDENER: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    NANNY: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
    TUTOR: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
    OTHER: 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400',
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-heading">Guard Dashboard</h1>
            <p className="text-[13px] text-muted mt-0.5">Visitor management & gate control</p>
          </div>
        </div>
        <button onClick={() => setWalkInOpen(true)} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-indigo-700 transition-colors">
          <Bell className="w-4 h-4" /> Walk-in Approval
        </button>
      </div>

      {/* Passcode Verification */}
      <div className="bg-card rounded-lg border border-border p-5 mb-6">
        <label className="block text-[13px] font-medium text-sub mb-2">Verify Visitor Passcode</label>
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text" value={passcode} onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              placeholder="Enter 6-digit passcode"
              maxLength={6}
              className="w-full pl-9 pr-4 py-2.5 bg-input-bg border border-input-border rounded-lg text-[15px] text-heading tracking-[0.3em] font-mono placeholder:tracking-normal placeholder:font-sans focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <button onClick={handleVerify} disabled={verifying || !passcode.trim()} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {verifying ? <ButtonSpinner /> : 'Verify'}
          </button>
        </div>

        {/* Verified visitor card */}
        {verifiedVisitor && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[15px] font-semibold text-heading">{verifiedVisitor.visitorName}</p>
                <p className="text-[13px] text-muted mt-0.5">{verifiedVisitor.visitorPhone} {verifiedVisitor.vehicleNumber && `| ${verifiedVisitor.vehicleNumber}`}</p>
                <p className="text-[13px] text-sub mt-1">Visiting <span className="font-medium">{verifiedVisitor.residentName}</span> at {propertyLabel} <span className="font-medium">{verifiedVisitor.unitNumber}</span></p>
                {verifiedVisitor.purpose && <p className="text-[13px] text-muted mt-0.5">Purpose: {verifiedVisitor.purpose}</p>}
                <p className="text-[12px] text-muted mt-1">Expected: {fmt(verifiedVisitor.expectedAt)}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleCheckIn(verifiedVisitor)} className="px-4 py-2 bg-indigo-600 text-white rounded text-[13px] font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1.5">
                  <LogIn className="w-3.5 h-3.5" /> Allow Entry
                </button>
                <button onClick={() => handleDeny(verifiedVisitor.id)} className="px-4 py-2 bg-red-600 text-white rounded text-[13px] font-medium hover:bg-red-700 transition-colors flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5" /> Deny
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Awaiting', value: stats.awaitingApproval || 0, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: Hourglass },
          { label: 'Approved', value: stats.expectedToday || 0, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', icon: Clock },
          { label: 'Inside', value: stats.currentlyInside || 0, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10', icon: Users },
          { label: 'Checked Out', value: stats.todayCheckOuts || 0, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-500/10', icon: LogOut },
          { label: 'Deliveries', value: stats.pendingDeliveries || 0, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10', icon: Package },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.bg}`}>
                <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-heading">{s.value}</p>
                <p className="text-[11px] text-muted font-medium">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card-alt rounded-lg p-1 mb-4">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
              tab === t.id ? 'bg-card text-heading shadow-sm' : 'text-muted hover:text-sub'
            }`}>
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count > 0 && <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${tab === t.id ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400' : 'bg-card-alt text-muted'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-3">
        {tab === 'awaiting' && (
          awaiting.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <Hourglass className="w-10 h-10 text-muted mx-auto mb-3" />
              <p className="text-[13px] text-muted">No visitors awaiting resident approval</p>
              <p className="text-[12px] text-muted mt-1">Use "Walk-in Entry" to request resident approval</p>
            </div>
          ) : awaiting.map((v) => (
            <div key={v.id} className="bg-card rounded-lg border border-amber-200 dark:border-amber-500/20 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-semibold text-heading">{v.visitorName}</p>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">Awaiting Approval</span>
                  </div>
                  <p className="text-[13px] text-muted mt-0.5">{v.visitorPhone} {v.vehicleNumber && `| ${v.vehicleNumber}`}</p>
                  <p className="text-[13px] text-sub mt-1">{propertyLabel} <span className="font-medium">{v.unitNumber}</span> - {v.residentName}</p>
                  {v.purpose && <p className="text-[12px] text-muted mt-0.5">{v.purpose}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] text-muted">Requested at</p>
                  <p className="text-[13px] font-medium text-heading">{fmt(v.createdAt)}</p>
                  <div className="flex items-center gap-1 mt-1 text-amber-600 dark:text-amber-400">
                    <Bell className="w-3 h-3 animate-pulse" />
                    <p className="text-[11px] font-medium">Waiting for resident</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <button onClick={() => handleDeny(v.id)} className="px-3 py-1.5 border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded text-[12px] font-medium hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-1">
                  <Ban className="w-3.5 h-3.5" /> Deny Entry
                </button>
              </div>
            </div>
          ))
        )}

        {tab === 'expected' && (
          expected.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <Clock className="w-10 h-10 text-muted mx-auto mb-3" />
              <p className="text-[13px] text-muted">No expected visitors right now</p>
            </div>
          ) : expected.map((v) => (
            <div key={v.id} className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-semibold text-heading">{v.visitorName}</p>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">{v.visitorType}</span>
                  </div>
                  <p className="text-[13px] text-muted mt-0.5">{v.visitorPhone} {v.vehicleNumber && `| ${v.vehicleNumber}`}</p>
                  <p className="text-[13px] text-sub mt-1">{propertyLabel} <span className="font-medium">{v.unitNumber}</span> - {v.residentName}</p>
                  {v.purpose && <p className="text-[12px] text-muted mt-0.5">{v.purpose}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] text-muted mb-1">Passcode</p>
                  <p className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400 tracking-wider">{v.passcode}</p>
                  <p className="text-[11px] text-muted mt-1">{fmt(v.expectedAt)}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <button onClick={() => handleCheckIn(v)} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-[12px] font-medium hover:bg-indigo-700 flex items-center gap-1">
                  <LogIn className="w-3.5 h-3.5" /> Check In
                </button>
                <button onClick={() => handleDeny(v.id)} className="px-3 py-1.5 border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded text-[12px] font-medium hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-1">
                  <Ban className="w-3.5 h-3.5" /> Deny
                </button>
              </div>
            </div>
          ))
        )}

        {tab === 'inside' && (
          inside.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <Users className="w-10 h-10 text-muted mx-auto mb-3" />
              <p className="text-[13px] text-muted">No visitors currently inside</p>
            </div>
          ) : inside.map((v) => (
            <div key={v.id} className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-semibold text-heading">{v.visitorName}</p>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">Inside</span>
                  </div>
                  <p className="text-[13px] text-muted mt-0.5">{v.visitorPhone}</p>
                  <p className="text-[13px] text-sub mt-1">{propertyLabel} <span className="font-medium">{v.unitNumber}</span> - {v.residentName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] text-muted">In since</p>
                  <p className="text-[13px] font-medium text-heading">{fmt(v.checkInTime)}</p>
                  <p className="text-[12px] font-medium text-orange-600 dark:text-orange-400 mt-0.5">{duration(v.checkInTime)}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <button onClick={() => handleCheckOut(v.id)} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-[12px] font-medium hover:bg-indigo-700 flex items-center gap-1">
                  <LogOut className="w-3.5 h-3.5" /> Check Out
                </button>
              </div>
            </div>
          ))
        )}

        {tab === 'daily-help' && (
          dailyHelp.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <UserCheck className="w-10 h-10 text-muted mx-auto mb-3" />
              <p className="text-[13px] text-muted">No daily help registered</p>
            </div>
          ) : dailyHelp.map((dh) => (
            <div key={dh.id} className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-semibold text-heading">{dh.name}</p>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${categoryBadge[dh.category] || categoryBadge.OTHER}`}>{dh.category}</span>
                  </div>
                  <p className="text-[13px] text-muted mt-0.5">{dh.phone || 'No phone'}</p>
                  <p className="text-[13px] text-sub mt-1">{propertyLabel} <span className="font-medium">{dh.unitNumber}</span> - {dh.residentName}</p>
                </div>
                <div className="text-right shrink-0">
                  {dh.timeSlot && <p className="text-[13px] font-medium text-heading">{dh.timeSlot}</p>}
                  {dh.workingDays && <p className="text-[11px] text-muted mt-0.5">{dh.workingDays}</p>}
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <button onClick={() => handleDailyHelpCheckIn(dh.id)} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-[12px] font-medium hover:bg-indigo-700 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Mark Present
                </button>
              </div>
            </div>
          ))
        )}

        {tab === 'deliveries' && (
          <>
            <div className="flex justify-end mb-2">
              <button onClick={() => setDeliveryOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded text-[12px] font-medium hover:bg-indigo-700 transition-colors">
                <Truck className="w-3.5 h-3.5" /> Log Delivery
              </button>
            </div>
            {deliveries.length === 0 ? (
              <div className="bg-card rounded-lg border border-border p-12 text-center">
                <Package className="w-10 h-10 text-muted mx-auto mb-3" />
                <p className="text-[13px] text-muted">No pending deliveries</p>
              </div>
            ) : deliveries.map((dl) => (
              <div key={dl.id} className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-semibold text-heading">{dl.deliveryService}</p>
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400">Pending</span>
                    </div>
                    {dl.description && <p className="text-[13px] text-muted mt-0.5">{dl.description}</p>}
                    <p className="text-[13px] text-sub mt-1">{propertyLabel} <span className="font-medium">{dl.unitNumber}</span> - {dl.residentName}</p>
                  </div>
                  <p className="text-[11px] text-muted shrink-0">{fmt(dl.createdAt)}</p>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                  <button onClick={() => { setPickupId(dl.id); setPickupOpen(true); }} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-[12px] font-medium hover:bg-indigo-700 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" /> Mark Picked Up
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Walk-in Modal */}
      <Modal open={walkInOpen} onClose={() => setWalkInOpen(false)} title="Request Resident Approval" full>
        <form onSubmit={handleWalkIn}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[14px] font-semibold text-heading">Visitor Details</h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setWalkInOpen(false)} className="px-4 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
              <button type="submit" disabled={walkInSaving || !walkInForm.visitorName || !walkInForm.visitorPhone || !walkInForm.unitNumber} className="px-4 py-2 bg-indigo-600 text-white rounded text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">
                {walkInSaving ? <><ButtonSpinner /> Sending...</> : <><Save className="w-4 h-4" /> Request Approval</>}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Visitor Name *</label>
                  <input type="text" value={walkInForm.visitorName} onChange={(e) => setWalkInForm({ ...walkInForm, visitorName: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Phone</label>
                    <input type="text" value={walkInForm.visitorPhone} onChange={(e) => setWalkInForm({ ...walkInForm, visitorPhone: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Vehicle Number</label>
                    <input type="text" value={walkInForm.vehicleNumber} onChange={(e) => setWalkInForm({ ...walkInForm, vehicleNumber: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Purpose</label>
                  <input type="text" value={walkInForm.purpose} onChange={(e) => setWalkInForm({ ...walkInForm, purpose: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" />
                </div>
              </div>
            </div>
            <div className="space-y-6 md:sticky md:top-4 md:self-start">
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-[14px] font-semibold text-heading mb-1">{propertyLabel}</h2>
                <p className="text-[11px] text-muted mb-3">Select the resident's {propertyLabel.toLowerCase()}.</p>
                <select value={walkInForm.unitNumber} onChange={(e) => setWalkInForm({ ...walkInForm, unitNumber: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required>
                  <option value="">{`Select ${propertyLabel.toLowerCase()}`}</option>
                  {properties.map((v) => (
                    <option key={v.id} value={v.unitNumber}>{v.unitNumber}{v.ownerName ? ` - ${v.ownerName}` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-[14px] font-semibold text-heading mb-1">Visitor Type</h2>
                <p className="text-[11px] text-muted mb-3">Classify the visitor.</p>
                <select value={walkInForm.visitorType} onChange={(e) => setWalkInForm({ ...walkInForm, visitorType: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                  <option value="GUEST">Guest</option>
                  <option value="DELIVERY">Delivery</option>
                  <option value="CAB">Cab</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delivery Modal */}
      <Modal open={deliveryOpen} onClose={() => setDeliveryOpen(false)} title="Log Delivery" full>
        <form onSubmit={handleLogDelivery}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[14px] font-semibold text-heading">Delivery Details</h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setDeliveryOpen(false)} className="px-4 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
              <button type="submit" disabled={deliverySaving || !deliveryForm.unitNumber || !deliveryForm.deliveryService} className="px-4 py-2 bg-indigo-600 text-white rounded text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">
                {deliverySaving ? <><ButtonSpinner /> Logging...</> : <><Save className="w-4 h-4" /> Log Delivery</>}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Description</label>
                  <input type="text" value={deliveryForm.description} onChange={(e) => setDeliveryForm({ ...deliveryForm, description: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="Package details (optional)" />
                </div>
              </div>
            </div>
            <div className="space-y-6 md:sticky md:top-4 md:self-start">
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-[14px] font-semibold text-heading mb-1">{propertyLabel}</h2>
                <p className="text-[11px] text-muted mb-3">Select the destination {propertyLabel.toLowerCase()}.</p>
                <select value={deliveryForm.unitNumber} onChange={(e) => setDeliveryForm({ ...deliveryForm, unitNumber: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required>
                  <option value="">{`Select ${propertyLabel.toLowerCase()}`}</option>
                  {properties.map((v) => (
                    <option key={v.id} value={v.unitNumber}>{v.unitNumber}{v.ownerName ? ` - ${v.ownerName}` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-[14px] font-semibold text-heading mb-1">Service</h2>
                <p className="text-[11px] text-muted mb-3">Select the delivery service.</p>
                <select value={deliveryForm.deliveryService} onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryService: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required>
                  <option value="">Select service</option>
                  <option value="Amazon">Amazon</option>
                  <option value="Flipkart">Flipkart</option>
                  <option value="Swiggy">Swiggy</option>
                  <option value="Zomato">Zomato</option>
                  <option value="Dunzo">Dunzo</option>
                  <option value="Blinkit">Blinkit</option>
                  <option value="BigBasket">BigBasket</option>
                  <option value="Courier">Courier</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Pickup Modal */}
      <Modal open={pickupOpen} onClose={() => { setPickupOpen(false); setPickupId(null); setReceivedBy(''); }} title="Mark Delivery Picked Up" full>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[14px] font-semibold text-heading">Pickup Details</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => { setPickupOpen(false); setPickupId(null); setReceivedBy(''); }} className="px-4 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
            <button onClick={handlePickUp} disabled={!receivedBy} className="px-4 py-2 bg-indigo-600 text-white rounded text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2"><Save className="w-4 h-4" /> Confirm Pickup</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-heading mb-1">Received By *</label>
                <input type="text" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="Name of person who picked up" />
              </div>
            </div>
          </div>
          <div className="space-y-6 md:sticky md:top-4 md:self-start"></div>
        </div>
      </Modal>
    </div>
  );
}
