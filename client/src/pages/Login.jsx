import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineExclamationCircle, HiOutlineCheckCircle } from 'react-icons/hi';

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
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await login(userId, password);
      toast.success('Login successful! Welcome back.');
      navigate('/');
    } catch (error) {
      console.error('[Login Error Debug]', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      // Clear all field errors - only show toast
      setErrors({});
      
      console.log('[Login Error]', error.message);

      // Show only "Invalid credentials" for any error with red toast
      toast.error('Invalid credentials', {
        icon: <HiOutlineExclamationCircle className="w-5 h-5" />,
        duration: 4000,
        style: {
          background: '#DC2626',
          color: '#FFFFFF',
          borderRadius: '0.5rem',
          padding: '1rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        },
      });

      console.error('Full login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">SciInov CRM</h1>
            <p className="text-blue-100 text-sm">Conference Management System</p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="px-8 py-12">
            {/* User ID Field */}
            <div className="mb-6">
              <label htmlFor="userId" className="block text-sm font-semibold text-gray-700 mb-3">
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
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                    errors.userId
                      ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  }`}
                  disabled={loading}
                />
                {errors.userId && (
                  <div className="absolute right-4 top-3.5 text-red-500">
                    <HiOutlineExclamationCircle className="w-5 h-5" />
                  </div>
                )}
              </div>
              {errors.userId && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <HiOutlineExclamationCircle className="w-4 h-4" />
                  {errors.userId}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-8">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
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
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none pr-12 ${
                    errors.password
                      ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-gray-500 hover:text-gray-700 transition-colors"
                  tabIndex="-1"
                  disabled={loading}
                >
                  {showPassword ? (
                    <HiOutlineEyeOff className="w-5 h-5" />
                  ) : (
                    <HiOutlineEye className="w-5 h-5" />
                  )}
                </button>
                {errors.password && (
                  <div className="absolute right-12 top-3.5 text-red-500">
                    <HiOutlineExclamationCircle className="w-5 h-5" />
                  </div>
                )}
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <HiOutlineExclamationCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:scale-105 active:scale-95'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <HiOutlineCheckCircle className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-200">
            <p className="text-xs text-gray-600">
              Powered by <span className="font-semibold text-blue-600">SciInov DBMS</span>
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-white bg-opacity-70 backdrop-blur rounded-lg p-4 border border-white">
          <p className="text-xs text-gray-600 text-center">
            💡 Tip: Use your SciInov account credentials to log in.
          </p>
        </div>
      </div>
    </div>
  );
}
