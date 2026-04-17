import { ButtonSpinner } from '../components/Spinner';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Building2, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    try {
      const { data } = await authAPI.forgotPassword({ email });
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link');
    } finally { setLoading(false); }
  };

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
          <h1 className="text-2xl font-bold text-heading">Forgot Password</h1>
          <p className="text-[13px] text-muted mt-1.5">Enter your email to receive a reset link</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-8" style={{ boxShadow: '0 0.75rem 1.5rem rgba(0,0,0,0.03)' }}>
          {error && <div className="mb-5 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded text-[13px]">{error}</div>}
          {message && <div className="mb-5 p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 rounded text-[13px]">{message}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-sub mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-input-bg border border-input-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading placeholder:text-muted"
                placeholder="your@email.com" required />
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full bg-indigo-600 text-white py-2.5 rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {loading ? <><ButtonSpinner /> Sending...</> : 'Send Reset Link'}
            </button>
          </form>
          <div className="mt-5 text-center">
            <Link to="/login" className="text-[13px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
