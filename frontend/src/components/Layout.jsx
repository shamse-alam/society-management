import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Building2, Users, LayoutDashboard, LogOut, Menu, CreditCard, CalendarDays, ClipboardList, ChevronDown, Plus, Home, FileBarChart, Wallet, Receipt, Store, Sun, Moon, FileText, Bell, Search, X, Settings, Megaphone, MessageSquare, BarChart3, Shield, UserPlus, UserCheck, Car, ParkingSquare, FolderOpen, MessageCircle, Calendar, Truck, Cog, ArrowLeft, Landmark, IndianRupee, LifeBuoy, Lock } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import UserAvatar from './UserAvatar';
import NotificationDropdown from './NotificationDropdown';
import { useSocietyConfig } from '../context/SocietyConfigContext';
import { useModalHeader } from '../context/ModalContext';

function UserAvatarPopup({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const timeoutRef = useRef(null);

  const showPopup = () => { clearTimeout(timeoutRef.current); setOpen(true); };
  const hidePopup = () => { timeoutRef.current = setTimeout(() => setOpen(false), 200); };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative ml-2 pl-3 border-l border-border" onMouseEnter={showPopup} onMouseLeave={hidePopup}>
      <button className="flex items-center cursor-pointer" onClick={() => setOpen(!open)}>
        <UserAvatar name={user?.fullName} src={user?.profileImage} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
          onMouseEnter={showPopup} onMouseLeave={hidePopup}>
          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <UserAvatar name={user?.fullName} src={user?.profileImage} size="lg" />
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-heading truncate">{user?.fullName}</p>
                <p className="text-[12px] text-muted truncate">@{user?.username}</p>
              </div>
            </div>
          </div>
          <div className="p-2">
            <Link to="/my-profile" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-sub hover:bg-card-hover hover:text-heading transition-colors">
              <Users className="w-4 h-4" /> My Profile
            </Link>
            <Link to="/settings" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-sub hover:bg-card-hover hover:text-heading transition-colors">
              <Settings className="w-4 h-4" /> Settings
            </Link>
            <button onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout({ children }) {
  const { user, logout, isAdmin, isGuard, hasRole } = useAuth();
  const canManageAccounts = isAdmin || hasRole('ACCOUNTANT') || hasRole('TREASURER') || hasRole('PRESIDENT');
  const canManageSociety = isAdmin || hasRole('PRESIDENT') || hasRole('SECRETARY');
  const { dark, toggle } = useTheme();
  const { config: societyConfig } = useSocietyConfig();
  const { modal } = useModalHeader();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const propertyLabel = societyConfig.propertyLabel || 'Property';
  const p = location.pathname;
  const [accountsOpen, setAccountsOpen] = useState(
    p === '/payments' || p === '/expenses' || p === '/vendors' || p.startsWith('/vendors/') || p === '/balance-sheet' || p === '/gst-report' || p === '/defaulter-report' || p === '/fund-releases'
  );
  const [userPaymentsOpen, setUserPaymentsOpen] = useState(
    p === '/pay-maintenance' || p === '/pay-membership' || p === '/pay-corpus'
  );
  const [societyOpen, setSocietyOpen] = useState(
    p === '/users' || p === '/properties' || p === '/household' || p === '/vehicles' || p === '/parking' || p === '/move-requests' || p.startsWith('/users/')
  );
  const [communityOpen, setCommunityOpen] = useState(
    p === '/notices' || p === '/polls' || p === '/emergency' || p === '/documents' || p.startsWith('/forum') || p === '/events'
  );
  const [bookingsOpen, setBookingsOpen] = useState(
    p === '/bookings' || p === '/booking-requests' || p === '/amenities'
  );
  const [visitorsOpen, setVisitorsOpen] = useState(
    p === '/visitors' || p === '/daily-help' || p === '/visitor-logs'
  );
  const [myPropertyOpen, setMyPropertyOpen] = useState(
    p === '/household' || p === '/my-vehicles' || p === '/my-move-requests'
  );
  const [settingsOpen, setSettingsOpen] = useState(
    p === '/settings' || p === '/society-settings'
  );

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (path) => p === path;
  const isAccountsSection = p === '/payments' || p === '/expenses' || p === '/vendors' || p.startsWith('/vendors/') || p === '/balance-sheet' || p === '/gst-report' || p === '/defaulter-report' || p === '/fund-releases';
  const isUserPaymentsSection = p === '/pay-maintenance' || p === '/pay-membership' || p === '/pay-corpus';
  const isSocietySection = p === '/users' || p === '/properties' || p === '/household' || p === '/vehicles' || p === '/parking' || p === '/move-requests' || p.startsWith('/users/');
  const isCommunitySection = p === '/notices' || p === '/polls' || p === '/emergency' || p === '/documents' || p.startsWith('/forum') || p === '/events';
  const isHelpdeskSection = p === '/complaints' || p === '/complaint-management';
  const isBookingsSection = p === '/bookings' || p === '/booking-requests' || p === '/amenities';
  const isVisitorsSection = p === '/visitors' || p === '/daily-help' || p === '/visitor-logs';
  const isMyPropertySection = p === '/household' || p === '/my-vehicles' || p === '/my-move-requests';
  const isSettingsSection = p === '/settings' || p === '/society-settings';

  const mainItems = isGuard ? [
    { path: '/guard-dashboard', label: 'Guard Dashboard', icon: Shield },
  ] : canManageSociety ? [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ] : [
    { path: '/user-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const accountsSubItems = [
    { path: '/payments', label: 'Income', icon: CreditCard },
    { path: '/expenses', label: 'Expenditure', icon: Receipt },
    { path: '/vendors', label: 'Vendors', icon: Store },
    { path: '/balance-sheet', label: 'Receipts & Payments', icon: Wallet },
    { path: '/fund-releases', label: 'Reserve Funds', icon: Lock },
    { path: '/gst-report', label: 'GST Statement', icon: FileText },
    { path: '/defaulter-report', label: 'Defaulter Report', icon: FileBarChart },
  ];

  const userPaymentSubItems = [
    { path: '/pay-maintenance', label: 'Maintenance', icon: CreditCard },
    { path: '/pay-membership', label: 'Membership', icon: UserCheck },
    { path: '/pay-corpus', label: 'Corpus Fund', icon: Landmark },
  ];

  const societySubItems = [
    { path: '/users', label: 'Members', icon: Users },
    { path: '/properties', label: `${propertyLabel}s`, icon: Building2 },
    { path: '/household', label: 'Households', icon: Home },
    { path: '/vehicles', label: 'Vehicles', icon: Car },
    { path: '/parking', label: 'Parking', icon: ParkingSquare },
    { path: '/move-requests', label: 'Move In/Out', icon: Truck },
  ];

  const communitySubItems = [
    { path: '/notices', label: 'Notice Board', icon: Megaphone },
    { path: '/forum', label: 'Discussion Forum', icon: MessageCircle },
    { path: '/events', label: 'Events', icon: Calendar },
    { path: '/polls', label: 'Polls & Voting', icon: BarChart3 },
    { path: '/documents', label: 'Documents', icon: FolderOpen },
    { path: '/emergency', label: 'Emergency Contacts', icon: Shield },
  ];

  const bookingSubItems = [
    ...(canManageSociety ? [{ path: '/amenities', label: 'Manage Amenities', icon: Building2 }] : []),
    { path: '/bookings', label: 'Book Facility', icon: Plus },
    ...(canManageSociety ? [{ path: '/booking-requests', label: 'Reservation Requests', icon: ClipboardList }] : []),
  ];

  const visitorSubItems = canManageSociety ? [
    { path: '/visitor-logs', label: 'Visitor Logs', icon: ClipboardList },
  ] : [
    { path: '/visitors', label: 'Pre-Approve', icon: UserPlus },
    { path: '/daily-help', label: 'My Daily Help', icon: UserCheck },
  ];

  const navLinkClass = (active) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
      active
        ? 'bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400'
        : 'text-sub hover:bg-sidebar-hover hover:text-heading'
    }`;

  const subLinkClass = (active) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
      active
        ? 'bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400'
        : 'text-muted hover:bg-sidebar-hover hover:text-heading'
    }`;

  const parentBtnClass = (active) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 w-full ${
      active
        ? 'bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400'
        : 'text-sub hover:bg-sidebar-hover hover:text-heading'
    }`;

  const sectionLabel = (text) => (
    <p className="px-4 pt-4 pb-1.5 text-[10px] font-semibold text-muted uppercase tracking-widest">{text}</p>
  );

  return (
    <div className="min-h-screen bg-body flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-[270px] bg-sidebar border-r border-border transform transition-transform duration-200 lg:translate-x-0 lg:static flex-shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-[75px] px-5 flex items-center gap-3 border-b border-border shrink-0">
            {societyConfig.logoUrl ? (
              <img src={societyConfig.logoUrl} alt="" className="w-9 h-9 rounded-lg object-contain shadow-sm" />
            ) : (
              <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <Building2 className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-[15px] font-semibold text-heading leading-tight">{societyConfig.societyName || 'Society Management'}</h1>
              <p className="text-[10px] text-muted font-medium">{societyConfig.tagline || 'Society Management'}</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden p-1 text-muted hover:text-heading rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 pb-3 overflow-y-auto">
            {sectionLabel('Main')}

            {mainItems.map((item) => (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={navLinkClass(isActive(item.path))}>
                <item.icon className="w-[20px] h-[20px] shrink-0" />
                {item.label}
              </Link>
            ))}

            {/* Accounts — Admin, Accountant, Treasurer, President */}
            {canManageAccounts && !isGuard && (
              <>
                {sectionLabel('Accounts')}
                <button onClick={() => setAccountsOpen(!accountsOpen)} className={parentBtnClass(isAccountsSection)}>
                  <IndianRupee className="w-[20px] h-[20px] shrink-0" />
                  Accounts
                  <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-200 ${accountsOpen ? 'rotate-180' : ''}`} />
                </button>
                {accountsOpen && (
                  <div className="ml-5 pl-3 border-l border-border space-y-0.5">
                    {accountsSubItems.map((item) => (
                      <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={subLinkClass(isActive(item.path))}>
                        <item.icon className="w-4 h-4 shrink-0" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Payments (non-admin residents) */}
            {!canManageAccounts && !isGuard && (
              <>
                {sectionLabel('Payments')}
                <button onClick={() => setUserPaymentsOpen(!userPaymentsOpen)} className={parentBtnClass(isUserPaymentsSection)}>
                  <IndianRupee className="w-[20px] h-[20px] shrink-0" />
                  Payments
                  <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-200 ${userPaymentsOpen ? 'rotate-180' : ''}`} />
                </button>
                {userPaymentsOpen && (
                  <div className="ml-5 pl-3 border-l border-border space-y-0.5">
                    {userPaymentSubItems.map((item) => (
                      <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={subLinkClass(isActive(item.path))}>
                        <item.icon className="w-4 h-4 shrink-0" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Society — Admin, President, Secretary */}
            {canManageSociety && !isGuard && (
              <>
                {sectionLabel('Society')}
                <button onClick={() => setSocietyOpen(!societyOpen)} className={parentBtnClass(isSocietySection)}>
                  <Home className="w-[20px] h-[20px] shrink-0" />
                  Society
                  <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-200 ${societyOpen ? 'rotate-180' : ''}`} />
                </button>
                {societyOpen && (
                  <div className="ml-5 pl-3 border-l border-border space-y-0.5">
                    {societySubItems.map((item) => (
                      <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={subLinkClass(isActive(item.path))}>
                        <item.icon className="w-4 h-4 shrink-0" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Community (not guard) */}
            {!isGuard && (
              <>
                {sectionLabel('Community')}
                <button onClick={() => setCommunityOpen(!communityOpen)} className={parentBtnClass(isCommunitySection)}>
                  <Megaphone className="w-[20px] h-[20px] shrink-0" />
                  Community
                  <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-200 ${communityOpen ? 'rotate-180' : ''}`} />
                </button>
                {communityOpen && (
                  <div className="ml-5 pl-3 border-l border-border space-y-0.5">
                    {communitySubItems.map((item) => (
                      <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={subLinkClass(isActive(item.path))}>
                        <item.icon className="w-4 h-4 shrink-0" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Helpdesk (not guard) — standalone complaints section */}
            {!isGuard && (
              <Link
                to={canManageSociety ? '/complaint-management' : '/complaints'}
                onClick={() => setSidebarOpen(false)}
                className={navLinkClass(isHelpdeskSection)}>
                <LifeBuoy className="w-[20px] h-[20px] shrink-0" />
                Helpdesk
              </Link>
            )}

            {/* Facilities (not guard) */}
            {!isGuard && (
              <>
                {sectionLabel('Facilities')}
                <button onClick={() => setBookingsOpen(!bookingsOpen)} className={parentBtnClass(isBookingsSection)}>
                  <CalendarDays className="w-[20px] h-[20px] shrink-0" />
                  Facilities
                  <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-200 ${bookingsOpen ? 'rotate-180' : ''}`} />
                </button>
                {bookingsOpen && (
                  <div className="ml-5 pl-3 border-l border-border space-y-0.5">
                    {bookingSubItems.map((item) => (
                      <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={subLinkClass(isActive(item.path))}>
                        <item.icon className="w-4 h-4 shrink-0" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Visitors (not guard) */}
            {!isGuard && (
              <>
                {sectionLabel('Visitors')}
                <button onClick={() => setVisitorsOpen(!visitorsOpen)} className={parentBtnClass(isVisitorsSection)}>
                  <Shield className="w-[20px] h-[20px] shrink-0" />
                  Visitors
                  <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-200 ${visitorsOpen ? 'rotate-180' : ''}`} />
                </button>
                {visitorsOpen && (
                  <div className="ml-5 pl-3 border-l border-border space-y-0.5">
                    {visitorSubItems.map((item) => (
                      <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={subLinkClass(isActive(item.path))}>
                        <item.icon className="w-4 h-4 shrink-0" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* My Property (non-admin residents) */}
            {!canManageSociety && !isGuard && (
              <>
                {sectionLabel(`My ${propertyLabel}`)}
                <button onClick={() => setMyPropertyOpen(!myPropertyOpen)} className={parentBtnClass(isMyPropertySection)}>
                  <Home className="w-[20px] h-[20px] shrink-0" />
                  {`My ${propertyLabel}`}
                  <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-200 ${myPropertyOpen ? 'rotate-180' : ''}`} />
                </button>
                {myPropertyOpen && (
                  <div className="ml-5 pl-3 border-l border-border space-y-0.5">
                    <Link to="/household" onClick={() => setSidebarOpen(false)} className={subLinkClass(isActive('/household'))}>
                      <Users className="w-4 h-4 shrink-0" /> Household
                    </Link>
                    <Link to="/my-vehicles" onClick={() => setSidebarOpen(false)} className={subLinkClass(isActive('/my-vehicles'))}>
                      <Car className="w-4 h-4 shrink-0" /> My Vehicles
                    </Link>
                    <Link to="/my-move-requests" onClick={() => setSidebarOpen(false)} className={subLinkClass(isActive('/my-move-requests'))}>
                      <Truck className="w-4 h-4 shrink-0" /> Move Requests
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Settings (all users except guard) */}
            {!isGuard && (
              <>
                {sectionLabel('Settings')}
                <button onClick={() => setSettingsOpen(!settingsOpen)} className={parentBtnClass(isSettingsSection)}>
                  <Settings className="w-[20px] h-[20px] shrink-0" />
                  Settings
                  <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`} />
                </button>
                {settingsOpen && (
                  <div className="ml-5 pl-3 border-l border-border space-y-0.5">
                    <Link to="/settings" onClick={() => setSidebarOpen(false)} className={subLinkClass(isActive('/settings'))}>
                      <Settings className="w-4 h-4 shrink-0" /> User Settings
                    </Link>
                    {canManageSociety && (
                      <Link to="/society-settings" onClick={() => setSidebarOpen(false)} className={subLinkClass(isActive('/society-settings'))}>
                        <Cog className="w-4 h-4 shrink-0" /> Society Settings
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </nav>

          {/* Sidebar footer spacer */}
          <div className="shrink-0 h-3" />
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-[75px] bg-topbar border-b border-border px-6 flex items-center gap-4 shrink-0 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="text-sub lg:hidden">
            <Menu className="w-6 h-6" />
          </button>

          {modal ? (
            <div className="flex items-center gap-2 flex-1">
              <button onClick={modal.onClose}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:text-heading hover:bg-card-alt transition-colors shrink-0"
                title="Back">
                <ArrowLeft className="w-[18px] h-[18px]" />
              </button>
              <h2 className="text-[15px] font-semibold text-heading truncate">{modal.title}</h2>
            </div>
          ) : (
            <>
              <div className="hidden lg:flex items-center gap-2 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 w-64 bg-card-alt border-0 rounded-lg text-[13px] text-heading placeholder:text-muted focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <h1 className="text-base font-semibold text-heading lg:hidden flex-1">{societyConfig.societyName || 'Society Management'}</h1>
            </>
          )}

          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <button onClick={toggle} className="w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:text-heading hover:bg-card-alt transition-colors" title={dark ? 'Light Mode' : 'Dark Mode'}>
              {dark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>

            {/* Notifications */}
            {!isGuard && <NotificationDropdown />}

            {/* User avatar with hover popup */}
            <UserAvatarPopup user={user} onLogout={handleLogout} />
          </div>
        </header>

        {/* Page content */}
        <main id="main-page-content" className="flex-1 p-6 overflow-auto relative">
          {children}
        </main>
      </div>
    </div>
  );
}
