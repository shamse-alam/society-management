import { ButtonSpinner } from '../components/Spinner';
import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Building2, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError(''); setLoading(true);
    try {
      await authAPI.resetPassword({ token, newPassword: password });
      navigate('/login', { state: { message: 'Password reset successful. Please sign in.' } });
    } catch (err) { setError(err.response?.data?.message || 'Failed to reset password'); }
    finally { setLoading(false); }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-body flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600/5 dark:bg-indigo-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-600/5 dark:bg-indigo-500/5 rounded-full blur-3xl" />
        </div>
        <div className="bg-card rounded-lg border border-border p-8 text-center max-w-md relative z-10" style={{ boxShadow: '0 0.75rem 1.5rem rgba(0,0,0,0.03)' }}>
          <h2 className="text-xl font-bold text-heading mb-2">Invalid Link</h2>
          <p className="text-[13px] text-muted mb-4">This password reset link is invalid or has expired.</p>
          <Link to="/login" className="text-[13px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">Back to Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-body flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600/5 dark:bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-600/5 dark:bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ boxShadow: '0 8px 24px rgba(49, 103, 243, 0.3)' }}>
            <Building2 className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-heading">Set New Password</h1>
          <p className="text-[13px] text-muted mt-1.5">Choose a strong password for your account</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-8" style={{ boxShadow: '0 0.75rem 1.5rem rgba(0,0,0,0.03)' }}>
          {error && <div className="mb-5 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded text-[13px]">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-sub mb-1.5">New Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-input-bg border border-input-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading placeholder:text-muted pr-10"
                  placeholder="Min 6 characters" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-sub">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-sub mb-1.5">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-input-bg border border-input-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading placeholder:text-muted"
                placeholder="Re-enter your password" required />
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full bg-indigo-600 text-white py-2.5 rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {loading ? <><ButtonSpinner /> Resetting...</> : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
