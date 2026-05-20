import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineExclamationCircle } from 'react-icons/hi';
import { HiArrowRight } from 'react-icons/hi2';

export default function Login() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!userId.trim()) newErrors.userId = 'User ID is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setErrors({});
    try {
      await login(userId, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      console.error('[Login Error]', error.message, error.response?.status, error.response?.data);
      setErrors({});
      toast.error('Invalid credentials', {
        icon: <HiOutlineExclamationCircle className="w-5 h-5" />,
        duration: 4000,
        style: {
          background: '#DC2626',
          color: '#FFFFFF',
          borderRadius: '0.5rem',
          padding: '1rem',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-400 dark:bg-violet-600 rounded-full opacity-10 dark:opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-400 dark:bg-indigo-600 rounded-full opacity-10 dark:opacity-20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-100 dark:bg-blue-900 rounded-full opacity-30 dark:opacity-10 blur-3xl" />
      </div>

      {/* Grid overlay (dark mode only) */}
      <div
        className="absolute inset-0 opacity-0 dark:opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white dark:bg-white/[0.04] backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-xl dark:shadow-2xl">

          {/* Brand */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 mb-5 shadow-lg shadow-violet-900/30">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">SciInov CRM</h1>
            <p className="text-gray-400 dark:text-slate-400 text-sm mt-1">Conference Management System</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* User ID */}
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                User ID
              </label>
              <div className="relative">
                <input
                  id="userId"
                  type="text"
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    if (errors.userId) setErrors({ ...errors, userId: '' });
                  }}
                  placeholder="Enter your user ID"
                  disabled={loading}
                  className={`w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/[0.06] border text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 text-sm transition-all duration-200 focus:outline-none focus:ring-2 ${
                    errors.userId
                      ? 'border-red-400 dark:border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 dark:border-white/10 focus:border-violet-500 dark:focus:border-violet-500/60 focus:ring-violet-500/20'
                  }`}
                />
                {errors.userId && (
                  <div className="absolute right-3 top-3.5 text-red-500 dark:text-red-400">
                    <HiOutlineExclamationCircle className="w-4.5 h-4.5" />
                  </div>
                )}
              </div>
              {errors.userId && (
                <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <HiOutlineExclamationCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.userId}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  placeholder="Enter your password"
                  disabled={loading}
                  className={`w-full px-4 py-3 pr-11 rounded-xl bg-gray-100 dark:bg-white/[0.06] border text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 text-sm transition-all duration-200 focus:outline-none focus:ring-2 ${
                    errors.password
                      ? 'border-red-400 dark:border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 dark:border-white/10 focus:border-violet-500 dark:focus:border-violet-500/60 focus:ring-violet-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                  disabled={loading}
                  className="absolute right-3 top-3.5 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword
                    ? <HiOutlineEyeOff className="w-4.5 h-4.5" />
                    : <HiOutlineEye className="w-4.5 h-4.5" />
                  }
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <HiOutlineExclamationCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 mt-2 ${
                loading
                  ? 'bg-gray-300 dark:bg-slate-700 cursor-not-allowed text-gray-500 dark:text-slate-400'
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-900/30 hover:shadow-violet-900/50 active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 dark:border-slate-400 border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <HiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-gray-400 dark:text-slate-600">
            Powered by{' '}
            <span className="text-gray-500 dark:text-slate-400 font-medium">SciInov DBMS</span>
          </p>
        </div>

        {/* Tip */}
        <p className="mt-4 text-center text-xs text-gray-400 dark:text-slate-600">
          Use your SciInov account credentials to sign in
        </p>
      </div>
    </div>
  );
}
