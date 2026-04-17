import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, MessageSquare, CreditCard, Users, Megaphone, CalendarDays, AlertTriangle, Info, X } from 'lucide-react';
import { notificationAPI } from '../services/api';
import { formatDate } from '../utils/format';

const typeConfig = {
  PAYMENT_DUE: { icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', label: 'Payment' },
  PAYMENT_REMINDER: { icon: CreditCard, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10', label: 'Payment' },
  VISITOR_ARRIVAL: { icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', label: 'Visitor' },
  COMPLAINT_UPDATE: { icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', label: 'Complaint' },
  NOTICE_NEW: { icon: Megaphone, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10', label: 'Notice' },
  BOOKING_UPDATE: { icon: CalendarDays, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10', label: 'Booking' },
  SOS_ALERT: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-500/10', label: 'SOS' },
  GENERAL: { icon: Info, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-500/10', label: 'General' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationAPI.getUnreadCount();
      setUnreadCount(res.data.count);
    } catch (e) {
      // silent
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationAPI.getNotifications(0);
      setNotifications(res.data);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      // silent
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      // silent
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:text-heading hover:bg-card-alt transition-colors relative"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 pulse-dot">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-[13px] font-semibold text-heading">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted hover:text-heading">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-muted text-[13px]">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-8 h-8 text-muted mx-auto mb-2 opacity-40" />
                <p className="text-muted text-[13px]">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const config = typeConfig[n.type] || typeConfig.GENERAL;
                const Icon = config.icon;
                return (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 border-b border-border/50 hover:bg-card-alt/50 transition-colors cursor-pointer ${!n.read ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''}`}
                    onClick={(e) => !n.read && handleMarkAsRead(n.id, e)}
                  >
                    <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-[13px] leading-tight ${!n.read ? 'font-semibold text-heading' : 'text-body'}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-[12px] text-muted mt-0.5 line-clamp-2">{n.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-medium ${config.color}`}>{config.label}</span>
                        <span className="text-[10px] text-muted">{timeAgo(n.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border text-center">
              <span className="text-[12px] text-muted">{notifications.length} notifications shown</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
