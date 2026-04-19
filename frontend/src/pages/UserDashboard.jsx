import { DashboardSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { CreditCard, CalendarDays, MessageSquare, Megaphone, BarChart3, IndianRupee, Clock, AlertCircle, CheckCircle2, ArrowUpRight, Home, LayoutDashboard } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';
import { useSocietyConfig, typeName } from '../context/SocietyConfigContext';

const fmt = (n) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 });

const STATUS_COLORS = {
  OPEN: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
  RESOLVED: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  CLOSED: 'bg-gray-100 text-gray-500 dark:bg-gray-500/15 dark:text-gray-400',
};

const PRIORITY_BORDER = {
  NORMAL: 'border-l-gray-300 dark:border-l-gray-600',
  IMPORTANT: 'border-l-yellow-400 dark:border-l-yellow-500',
  URGENT: 'border-l-red-500 dark:border-l-red-500',
};

export default function UserDashboard() {
  const { user } = useAuth();
  const { incomeTypes } = useSocietyConfig();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notices, setNotices] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [polls, setPolls] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const results = await Promise.allSettled([
          userAPI.getMyPayments(),
          userAPI.getMyBookings(),
          userAPI.getNotices(),
          userAPI.getMyComplaints(),
          userAPI.getPolls(),
        ]);
        if (results[0].status === 'fulfilled') setPayments(results[0].value.data);
        if (results[1].status === 'fulfilled') setBookings(results[1].value.data);
        if (results[2].status === 'fulfilled') setNotices(results[2].value.data);
        if (results[3].status === 'fulfilled') setComplaints(results[3].value.data);
        if (results[4].status === 'fulfilled') setPolls(results[4].value.data);
      } catch (err) { console.error('Dashboard fetch error', err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  if (loading) return <DashboardSkeleton />;

  const pendingDues = payments.filter(p => p.status === 'PENDING');
  const totalPending = pendingDues.reduce((s, p) => s + Number(p.amount), 0);
  const upcomingBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'PENDING').slice(0, 5);
  const recentPayments = payments.filter(p => p.status === 'PAID').slice(0, 5);
  const openComplaints = complaints.filter(c => c.status === 'OPEN' || c.status === 'IN_PROGRESS').length;
  const activePolls = polls.filter(p => !p.hasVoted).length;
  const recentNotices = notices.slice(0, 5);

  return (
    <div>
      {/* Welcome */}
      <div className="bg-card rounded-lg border border-border overflow-hidden mb-6">
        <div className="px-5 py-5">
          <div className="flex items-center gap-4">
            <UserAvatar name={user?.fullName} src={user?.profileImage} size={48} />
            <div>
              <h1 className="text-xl font-semibold text-heading">Welcome, {user?.firstName || user?.fullName?.split(' ')[0]}!</h1>
              <p className="text-[13px] text-muted mt-0.5">Here's what's happening in your society</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg border border-border p-5 stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Pending Dues</p>
              <p className={`text-[20px] font-bold mt-1 ${totalPending > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {totalPending > 0 ? `₹${fmt(totalPending)}` : 'Clear'}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${totalPending > 0 ? 'bg-red-100 dark:bg-red-500/15' : 'bg-green-100 dark:bg-green-500/15'}`}>
              <IndianRupee className={`w-5 h-5 ${totalPending > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5 stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Bookings</p>
              <p className="text-[20px] font-bold text-heading mt-1">{upcomingBookings.length}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/15 rounded-lg flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5 stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Open Complaints</p>
              <p className="text-[20px] font-bold text-heading mt-1">{openComplaints}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/15 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5 stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Pending Votes</p>
              <p className="text-[20px] font-bold text-heading mt-1">{activePolls}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/15 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Notices */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-5 py-3 bg-card-alt border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-[13px] font-semibold text-heading">Recent Notices</h2>
            </div>
            <Link to="/notices" className="text-[12px] text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1">View All <ArrowUpRight className="w-3 h-3" /></Link>
          </div>
          <div className="divide-y divide-border">
            {recentNotices.length === 0 ? (
              <EmptyState icon={Megaphone} title="No notices" description="Society notices will appear here when posted." />
            ) : recentNotices.map(n => (
              <div key={n.id} className={`px-5 py-3 border-l-4 ${PRIORITY_BORDER[n.priority] || PRIORITY_BORDER.NORMAL}`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-medium text-muted">{n.category}</span>
                  <span className="text-[11px] text-muted">{new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
                <p className="text-[13px] font-medium text-heading">{n.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-5 py-3 bg-card-alt border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
              <h2 className="text-[13px] font-semibold text-heading">Recent Payments</h2>
            </div>
          </div>
          <div className="divide-y divide-border">
            {recentPayments.length === 0 ? (
              <EmptyState icon={CreditCard} title="No payments yet" description="Your payment history will appear here." />
            ) : recentPayments.map(p => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium text-heading">{typeName(p.paymentType, incomeTypes)}</p>
                  <p className="text-[11px] text-muted">{p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                </div>
                <span className="text-[13px] font-semibold text-green-600 dark:text-green-400">₹{fmt(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-3 bg-card-alt border-b border-border">
          <h2 className="text-[13px] font-semibold text-heading">Quick Actions</h2>
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link to="/bookings" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 dark:hover:border-indigo-500/40 transition-colors">
            <CalendarDays className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span className="text-[12px] font-medium text-heading">Book Facility</span>
          </Link>
          <Link to="/complaints" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-500/10 dark:hover:border-orange-500/40 transition-colors">
            <MessageSquare className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            <span className="text-[12px] font-medium text-heading">Raise Complaint</span>
          </Link>
          <Link to="/polls" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-500/10 dark:hover:border-purple-500/40 transition-colors">
            <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span className="text-[12px] font-medium text-heading">Vote in Polls</span>
          </Link>
          <Link to="/notices" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 dark:hover:border-blue-500/40 transition-colors">
            <Megaphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span className="text-[12px] font-medium text-heading">Notice Board</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
