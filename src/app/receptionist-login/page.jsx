'use client';
import { API_BASE_URL } from '@/utils/api';
import { useState } from 'react';
import { FiEye, FiEyeOff, FiMail, FiLock, FiArrowRight, FiShield } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation'
const ReceptionistLogin = () => {
    const { login } = useAuth();
     const router = useRouter()
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/receptionist-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const responseData = await response.json();
      
      if (responseData.success && responseData.data) {
        console.log('Login successful:', responseData);
        const userData = responseData.data.user || responseData.data.staff;
        login(responseData.data.token, userData);
        router.push("/receptionist-dashboard");
      } else {
        throw new Error(responseData.message || 'Invalid credentials');
      }
      
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/90 to-purple-700/90 z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-20 h-20 bg-white/10 rounded-full backdrop-blur-sm animate-pulse"></div>
        <div className="absolute top-40 right-32 w-16 h-16 bg-white/10 rounded-full backdrop-blur-sm animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-32 w-12 h-12 bg-white/10 rounded-full backdrop-blur-sm animate-pulse delay-2000"></div>
        
        {/* Content Overlay */}
        <div className="relative z-20 flex flex-col justify-center items-start p-16 text-white">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-sm mb-6">
              <FiShield size={32} />
            </div>
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Welcome to<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200">
                HealthCare Portal
              </span>
            </h1>
            <p className="text-xl text-white/90 leading-relaxed max-w-md">
              Streamline your clinic operations with our comprehensive receptionist management system.
            </p>
          </div>
          
          <div className="space-y-4 text-white/80">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Secure patient data management</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Appointment scheduling & tracking</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Real-time communication tools</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          {/* Logo/Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl mb-6 shadow-2xl">
              <FiShield size={40} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Receptionist Login</h2>
            <p className="text-gray-600">Enter your credentials to access the system</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-pulse">
              {error}
            </div>
          )}

          {/* Login Form */}
          <div className="space-y-6">
            {/* Email Input */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white/70"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white/70"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-colors"
                />
                <span className="ml-2 text-sm text-gray-700">Remember me</span>
              </label>
              <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2 group"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Additional Options */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Need help? Contact your{' '}
                <button className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                  system administrator
                </button>
              </p>
            </div>
          </div>

          {/* Security Badge */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center space-x-2 text-xs text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
              <FiShield size={14} />
              <span>Secured with 256-bit SSL encryption</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header for smaller screens */}
      <div className="lg:hidden absolute top-0 left-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 text-center">
        <h1 className="text-xl font-bold">HealthCare Portal</h1>
        <p className="text-sm text-white/90 mt-1">Receptionist Access</p>
      </div>
    </div>
  );
};

export default ReceptionistLogin;
