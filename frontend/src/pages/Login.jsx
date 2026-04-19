import { ButtonSpinner } from '../components/Spinner';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Building2, Eye, EyeOff, Sun, Moon, Shield, Users, Bell } from 'lucide-react';
import { useSocietyConfig } from '../context/SocietyConfigContext';
import logoImg from '../assets/logo.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { dark, toggle } = useTheme();
  const { config: societyConfig } = useSocietyConfig();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d3b66 40%, #1a6dd1 100%)' }}>

        {/* Abstract decorative shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #3b82c4 0%, transparent 70%)' }} />
          <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] rounded-full opacity-8"
            style={{ background: 'radial-gradient(circle, #2b6cb0 0%, transparent 70%)' }} />
          <div className="absolute -bottom-40 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #1a6dd1 0%, transparent 70%)' }} />

          {/* Geometric accents */}
          <div className="absolute top-16 right-20 w-20 h-20 border border-white/10 rounded-2xl rotate-12" />
          <div className="absolute bottom-32 left-16 w-14 h-14 border border-white/10 rounded-xl -rotate-12" />
          <div className="absolute top-1/3 left-12 w-3 h-3 bg-blue-400/30 rounded-full" />
          <div className="absolute bottom-1/4 right-16 w-2 h-2 bg-blue-300/40 rounded-full" />
          <div className="absolute top-20 left-1/3 w-2 h-2 bg-white/20 rounded-full" />

          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        {/* Branding content */}
        <div className="relative z-10 px-16 max-w-lg">
          {/* Logo + Society Name — same line */}
          <div className="flex items-center gap-4 mb-4">
            <img src={societyConfig.logoUrl || logoImg} alt="" className="h-12 object-contain rounded-[5px]" />
            <h1 className="text-[36px] font-bold text-white leading-tight">
              {societyConfig.societyName || 'Society Management'}
            </h1>
          </div>
          <p className="text-blue-200/80 text-[15px] leading-relaxed mb-12">
            Your complete platform for community living. Manage payments, visitors, amenities, and everything in between.
          </p>

          {/* Feature highlights */}
          <div className="space-y-5">
            {[
              { icon: Shield, label: 'Secure Access', desc: 'Role-based access for admins, residents & guards' },
              { icon: Users, label: 'Community Hub', desc: 'Forums, polls, events & notice board' },
              { icon: Bell, label: 'Stay Updated', desc: 'Real-time notifications & visitor alerts' },
            ].map((f) => (
              <div key={f.label} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/10">
                  <f.icon className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <p className="text-white font-semibold text-[14px]">{f.label}</p>
                  <p className="text-blue-300/70 text-[13px] mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center bg-body relative">
        {/* Theme toggle */}
        <button onClick={toggle}
          className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-xl text-muted hover:text-heading hover:bg-card-hover transition-colors z-10">
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="w-full max-w-[400px] px-6 sm:px-8">
          {/* Logo + branding */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 rounded-2xl bg-white dark:bg-white/10 border border-gray-100 dark:border-white/10 flex items-center justify-center mb-5"
              style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
              <img src={logoImg} alt="Logo" className="w-14 h-14 object-contain" />
            </div>
            <h2 className="text-[26px] font-bold text-heading">Welcome back</h2>
            <p className="text-muted text-[14px] mt-1">Sign in to your account to continue</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-[13px] font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-semibold text-heading mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-input-bg border border-input-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[14px] text-heading placeholder:text-muted transition-shadow"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[13px] font-semibold text-heading">Password</label>
                <Link to="/forgot-password" className="text-[12px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-input-bg border border-input-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[14px] text-heading placeholder:text-muted pr-11 transition-shadow"
                  placeholder="Enter your password"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-sub transition-colors">
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full bg-indigo-600 text-white py-3.5 rounded-xl text-[14px] font-semibold hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 mt-2">
              {loading ? <><ButtonSpinner /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-[12px] text-muted mt-8">Default login: admin / welcome</p>
        </div>
      </div>
    </div>
  );
}
