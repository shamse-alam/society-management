import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import PropertyManagement from './pages/PropertyManagement';
import MyProfile from './pages/MyProfile';
import PropertiesView from './pages/PropertiesView';
import Payments from './pages/Payments';
import BookingRequests from './pages/BookingRequests';
import Bookings from './pages/Bookings';
import BalanceSheet from './pages/BalanceSheet';
import GSTReport from './pages/GSTReport';
import Expenses from './pages/Expenses';
import VendorManagement from './pages/VendorManagement';
import OwnerDetail from './pages/OwnerDetail';
import VendorDetail from './pages/VendorDetail';
import NoticeBoard from './pages/NoticeBoard';
import Complaints from './pages/Complaints';
import ComplaintManagement from './pages/ComplaintManagement';
import Polls from './pages/Polls';
import UserDashboard from './pages/UserDashboard';
import AmenityManagement from './pages/AmenityManagement';
import SettingsPage from './pages/Settings';
import GuardDashboard from './pages/GuardDashboard';
import VisitorPreApprove from './pages/VisitorPreApprove';
import MyDailyHelp from './pages/MyDailyHelp';
import AdminVisitorLogs from './pages/AdminVisitorLogs';
import DefaulterReport from './pages/DefaulterReport';
import EmergencyContacts from './pages/EmergencyContacts';
import HouseholdMembers from './pages/HouseholdMembers';
import VehicleManagement from './pages/VehicleManagement';
import ParkingSlots from './pages/ParkingSlots';
import MyVehicles from './pages/MyVehicles';
import Documents from './pages/Documents';
import Forum from './pages/Forum';
import ForumTopic from './pages/ForumTopic';
import Events from './pages/Events';
import MoveRequests from './pages/MoveRequests';
import MyMoveRequests from './pages/MyMoveRequests';
import SocietySettings from './pages/SocietySettings';
import PayMaintenance from './pages/PayMaintenance';
import MembershipPayment from './pages/MembershipPayment';
import CorpusPayment from './pages/CorpusPayment';
import FundReleases from './pages/FundReleases';
import { ModalProvider } from './context/ModalContext';
import { ConfirmProvider } from './context/ConfirmContext';

function ProtectedRoute({ children, adminOnly = false, guardOnly = false }) {
  const { user, isAdmin, isGuard, hasRole } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (guardOnly && !isGuard && !hasRole('GUARD')) return <Navigate to="/" replace />;
  if (adminOnly && !isAdmin && !hasRole('PRESIDENT') && !hasRole('SECRETARY') && !hasRole('ACCOUNTANT') && !hasRole('TREASURER')) return <Navigate to="/user-dashboard" replace />;
  return <Layout>{children}</Layout>;
}

function GuardRoute({ children }) {
  const { user, hasRole } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!hasRole('GUARD')) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function DefaultRedirect() {
  const { user, isAdmin, isGuard, hasRole } = useAuth();
  if (isGuard) return <Navigate to="/guard-dashboard" replace />;
  if (isAdmin || hasRole('PRESIDENT') || hasRole('SECRETARY')) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/user-dashboard" replace />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <DefaultRedirect /> : <Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/dashboard" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>} />
      <Route path="/users/:id" element={<ProtectedRoute adminOnly><OwnerDetail /></ProtectedRoute>} />
      <Route path="/properties" element={<ProtectedRoute adminOnly><PropertyManagement /></ProtectedRoute>} />
      <Route path="/my-profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
      <Route path="/properties-view" element={<ProtectedRoute><PropertiesView /></ProtectedRoute>} />

      {/* Payments (admin only) */}
      <Route path="/payments" element={<ProtectedRoute adminOnly><Payments /></ProtectedRoute>} />
      {/* Booking Requests (admin only) */}
      <Route path="/booking-requests" element={<ProtectedRoute adminOnly><BookingRequests /></ProtectedRoute>} />
      {/* Amenity Management (admin only) */}
      <Route path="/amenities" element={<ProtectedRoute adminOnly><AmenityManagement /></ProtectedRoute>} />
      {/* Bookings (all users) */}
      <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
      {/* Expenses (admin only) */}
      <Route path="/expenses" element={<ProtectedRoute adminOnly><Expenses /></ProtectedRoute>} />
      {/* Vendors (admin only) */}
      <Route path="/vendors" element={<ProtectedRoute adminOnly><VendorManagement /></ProtectedRoute>} />
      <Route path="/vendors/:id" element={<ProtectedRoute adminOnly><VendorDetail /></ProtectedRoute>} />
      {/* Fund Releases (admin only) */}
      <Route path="/fund-releases" element={<ProtectedRoute adminOnly><FundReleases /></ProtectedRoute>} />
      {/* Reports (admin only) */}
      <Route path="/balance-sheet" element={<ProtectedRoute adminOnly><BalanceSheet /></ProtectedRoute>} />
      <Route path="/gst-report" element={<ProtectedRoute adminOnly><GSTReport /></ProtectedRoute>} />
      {/* Community (all users) */}
      <Route path="/notices" element={<ProtectedRoute><NoticeBoard /></ProtectedRoute>} />
      <Route path="/complaints" element={<ProtectedRoute><Complaints /></ProtectedRoute>} />
      <Route path="/complaint-management" element={<ProtectedRoute adminOnly><ComplaintManagement /></ProtectedRoute>} />
      <Route path="/polls" element={<ProtectedRoute><Polls /></ProtectedRoute>} />
      <Route path="/user-dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
      {/* Guard */}
      <Route path="/guard-dashboard" element={<GuardRoute><GuardDashboard /></GuardRoute>} />
      {/* Visitor Management */}
      <Route path="/visitors" element={<ProtectedRoute><VisitorPreApprove /></ProtectedRoute>} />
      <Route path="/daily-help" element={<ProtectedRoute><MyDailyHelp /></ProtectedRoute>} />
      <Route path="/visitor-logs" element={<ProtectedRoute adminOnly><AdminVisitorLogs /></ProtectedRoute>} />
      {/* Reports */}
      <Route path="/defaulter-report" element={<ProtectedRoute adminOnly><DefaulterReport /></ProtectedRoute>} />
      {/* Households */}
      <Route path="/household" element={<ProtectedRoute><HouseholdMembers /></ProtectedRoute>} />
      {/* Vehicles & Parking (admin) */}
      <Route path="/vehicles" element={<ProtectedRoute adminOnly><VehicleManagement /></ProtectedRoute>} />
      <Route path="/parking" element={<ProtectedRoute adminOnly><ParkingSlots /></ProtectedRoute>} />
      {/* My Vehicles (user) */}
      <Route path="/my-vehicles" element={<ProtectedRoute><MyVehicles /></ProtectedRoute>} />
      {/* Documents & Forum */}
      <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
      <Route path="/forum" element={<ProtectedRoute><Forum /></ProtectedRoute>} />
      <Route path="/forum/:id" element={<ProtectedRoute><ForumTopic /></ProtectedRoute>} />
      {/* Events */}
      <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
      {/* Move Requests */}
      <Route path="/move-requests" element={<ProtectedRoute adminOnly><MoveRequests /></ProtectedRoute>} />
      <Route path="/my-move-requests" element={<ProtectedRoute><MyMoveRequests /></ProtectedRoute>} />
      {/* Society Settings (admin) */}
      <Route path="/society-settings" element={<ProtectedRoute adminOnly><SocietySettings /></ProtectedRoute>} />
      {/* Safety */}
      <Route path="/emergency" element={<ProtectedRoute><EmergencyContacts /></ProtectedRoute>} />
      {/* Payments (all users) */}
      <Route path="/pay-maintenance" element={<ProtectedRoute><PayMaintenance /></ProtectedRoute>} />
      <Route path="/pay-membership" element={<ProtectedRoute><MembershipPayment /></ProtectedRoute>} />
      <Route path="/pay-corpus" element={<ProtectedRoute><CorpusPayment /></ProtectedRoute>} />
      {/* Settings (all users) */}
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      <Route path="*" element={user ? <DefaultRedirect /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <ConfirmProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </ConfirmProvider>
      </ModalProvider>
    </AuthProvider>
  );
}
