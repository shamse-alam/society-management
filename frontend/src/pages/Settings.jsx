import { ButtonSpinner } from '../components/Spinner';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userAPI } from '../services/api';
import { useToast } from '../components/Toast';
import { Link, useNavigate } from 'react-router-dom';
import UserAvatar from '../components/UserAvatar';
import { Lock, Eye, EyeOff, Sun, Moon, Shield, Bell, Building2, Cog, User } from 'lucide-react';

export default function Settings() {
  const { user, isAdmin } = useAuth();
  const { dark, toggle } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  // Change password state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault(); setPwError('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New password and confirm password do not match'); return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('New password must be at least 6 characters'); return;
    }
    setPwSaving(true);
    try {
      await userAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { setPwError(err.response?.data?.message || 'Failed to change password'); }
    finally { setPwSaving(false); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-heading">Settings</h1>
        <p className="text-[13px] text-muted mt-1">Manage your account preferences, security, and display settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
        {/* Left Column — Account & Admin Settings */}
        <div className="space-y-6">
          {/* Password */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-[14px] font-semibold text-heading mb-4">Password</h2>
            {pwError && <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-lg text-[13px]">{pwError}</div>}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-heading mb-1">Current Password</label>
                <div className="relative">
                  <input type={showCurrentPw ? 'text' : 'password'} value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required placeholder="Enter current password" />
                  <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-heading">
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">New Password</label>
                  <div className="relative">
                    <input type={showNewPw ? 'text' : 'password'} value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                      className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required placeholder="Min. 6 characters" />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-heading">
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Confirm New Password</label>
                  <input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required placeholder="Re-enter new password" />
                </div>
              </div>
              <button type="submit" disabled={pwSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {pwSaving ? <><ButtonSpinner /> Updating...</> : <><Lock className="w-4 h-4" /> Update Password</>}
              </button>
            </form>
          </div>

          {/* Appearance */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-[14px] font-semibold text-heading mb-4">Appearance</h2>
            <label className="block text-[13px] font-medium text-heading mb-3">Theme</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { if (dark) toggle(); }}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${!dark ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-border hover:border-muted'}`}>
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Sun className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-medium text-heading">Light</p>
                  <p className="text-[11px] text-muted">Clean & bright</p>
                </div>
              </button>
              <button onClick={() => { if (!dark) toggle(); }}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${dark ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-border hover:border-muted'}`}>
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                  <Moon className="w-5 h-5 text-slate-300" />
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-medium text-heading">Dark</p>
                  <p className="text-[11px] text-muted">Easy on the eyes</p>
                </div>
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-[14px] font-semibold text-heading mb-4">Notifications</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-card-alt border border-border rounded-xl">
                <div>
                  <p className="text-[13px] font-medium text-heading">Payment Reminders</p>
                  <p className="text-[11px] text-muted">Get notified about upcoming dues</p>
                </div>
                <div className="w-11 h-6 bg-indigo-600 rounded-full relative cursor-pointer shrink-0">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-card-alt border border-border rounded-xl">
                <div>
                  <p className="text-[13px] font-medium text-heading">Booking Confirmations</p>
                  <p className="text-[11px] text-muted">Facility booking status updates</p>
                </div>
                <div className="w-11 h-6 bg-indigo-600 rounded-full relative cursor-pointer shrink-0">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm" />
                </div>
              </div>
              <p className="text-[11px] text-muted italic pt-1">More notification settings coming soon</p>
            </div>
          </div>

          {/* Administration (admin only) */}
          {isAdmin && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-[14px] font-semibold text-heading mb-4">Administration</h2>
              <div className="space-y-3">
                <div className="p-4 bg-card-alt border border-border rounded-xl">
                  <div className="flex items-center gap-3 mb-1.5">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <p className="text-[13px] font-medium text-heading">Session Management</p>
                  </div>
                  <p className="text-[12px] text-muted pl-7">Active sessions are managed via JWT tokens. Users are automatically logged out after token expiration.</p>
                </div>
                <div className="p-4 bg-card-alt border border-border rounded-xl">
                  <div className="flex items-center gap-3 mb-1.5">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <p className="text-[13px] font-medium text-heading">Password Policy</p>
                  </div>
                  <p className="text-[12px] text-muted pl-7">Minimum 6 characters required. Users can reset passwords via the forgot password flow.</p>
                </div>
                <Link to="/society-settings"
                  className="flex items-center gap-3 p-4 bg-card-alt border border-border rounded-xl hover:bg-card-hover transition-colors">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  <div>
                    <p className="text-[13px] font-medium text-heading">Society Settings</p>
                    <p className="text-[12px] text-muted">Society name, logo, property types, and contact info</p>
                  </div>
                </Link>
              </div>
            </div>
          )}

          {/* Cancel Button */}
          <button type="button" onClick={() => navigate(-1)}
            className="w-full py-2.5 border border-border rounded-lg text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">
            Cancel
          </button>
        </div>

        {/* Right Column — Profile Card & About */}
        <div className="space-y-6 md:sticky md:top-4 md:self-start">
          {/* Profile Card */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-[14px] font-semibold text-heading mb-4">Profile</h2>
            <div className="flex flex-col items-center text-center">
              <UserAvatar name={user?.fullName} src={user?.profileImage} size="lg" />
              <p className="text-[15px] font-semibold text-heading mt-3 truncate max-w-full">{user?.fullName}</p>
              <p className="text-[13px] text-muted truncate max-w-full">@{user?.username}</p>
              <p className="text-[12px] text-muted mt-1">{user?.role === 'ADMIN' ? 'Administrator' : user?.role === 'GUARD' ? 'Security Guard' : 'Member'}</p>
              <p className="text-[12px] text-muted">{user?.email}</p>
              <Link to="/my-profile" className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-[12px] font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
                <User className="w-3.5 h-3.5" /> Edit Profile
              </Link>
            </div>
          </div>

          {/* About */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-[14px] font-semibold text-heading mb-3">About</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-500/15 flex items-center justify-center shrink-0">
                <Cog className="w-[18px] h-[18px] text-gray-500 dark:text-gray-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-heading leading-tight">The Courtyard</p>
                <p className="text-[12px] text-muted mt-0.5">Society Management &middot; v1.0.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
