'use client';
import { useState } from 'react';
import { ROLES } from '@/constants/roles';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  EnvelopeIcon,
  LockClosedIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { API_BASE_URL } from '@/utils/api';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  // Validation schema
  const loginSchema = Yup.object().shape({
    email: Yup.string().required('Email or Phone is required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  });

  const handleLogin = async (values, { setSubmitting }) => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/onelogin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password
        }),
      });

      const response = await res.json();

      if (response.success && response.data) {
        const { token, user } = response.data;
        login(token, user);
        
        if (values.remember) {
          localStorage.setItem('remember_erp_user', values.email);
        } else {
          localStorage.removeItem('remember_erp_user');
        }

        switch(user.role) {
          case ROLES.ADMIN:
            router.push('/admin');
            break;
          case ROLES.DOCTOR:
            router.push('/doctor-dashboard');
            break;
          case ROLES.CLINIC:
            if(user.status === "pending"){
              router.push(`/pending-request/${user.id}`);
            } else if(user.status === "rejected"){
              router.push(`/rejected/${user.id}`);
            } else {
              router.push('/clinic');
            }
            break;
          case ROLES.PATIENT:
            router.push('/patient-dashboard');
            break;
          case ROLES.RECEPTIONIST:
            router.push('/receptionist-dashboard');
            break;
          default:
            router.push('/');
        }
      } else {
        setError(response.message || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('A network error occurred. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-900/20 p-4 sm:p-8 relative overflow-hidden">
      
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Main Card Container */}
      <div className="relative z-10 w-full max-w-[900px] min-h-[520px] bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-[2rem] shadow-xl flex flex-col lg:flex-row overflow-hidden border border-white/80 dark:border-slate-700/80 mx-auto">
        
        {/* Left Side - Login Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-10 flex flex-col justify-center">
          
          {/* Logo & Title */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg mb-4">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-1 tracking-tight">DOC ERP</h1>
            <p className="text-xs text-gray-500/90 dark:text-slate-400 font-medium tracking-wide">Smart Healthcare Operating System</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 flex items-start space-x-2">
              <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
              <span className="text-xs font-medium text-red-800 dark:text-red-200">{error}</span>
            </div>
          )}

          <Formik
            initialValues={{ email: '', password: '', remember: false }}
            validationSchema={loginSchema}
            onSubmit={handleLogin}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                {/* Identifier Field */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500/90 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-4 w-4 text-blue-500/80 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <Field
                      type="text"
                      name="email"
                      placeholder="admin@clinic.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-gray-200/70 dark:border-slate-600 rounded-xl text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all shadow-sm"
                    />
                  </div>
                  <ErrorMessage name="email" component="div" className="text-red-500 dark:text-red-400 text-xs font-medium mt-1 pl-1" />
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-bold text-gray-500/90 dark:text-slate-400 uppercase tracking-widest">
                      Password
                    </label>
                    <button type="button" className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-4 w-4 text-blue-500/80 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <Field
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-gray-200/70 dark:border-slate-600 rounded-xl text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>
                  <ErrorMessage name="password" component="div" className="text-red-500 dark:text-red-400 text-xs font-medium mt-1 pl-1" />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 flex justify-center items-center gap-2 rounded-xl text-white text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    </div>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </Form>
            )}
          </Formik>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <span className="text-xs text-gray-500/90 dark:text-slate-400">
              Don't have an account?{' '}
            </span>
            <button
              type="button"
              onClick={() => router.push('/register')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline transition-all"
            >
              Register Clinic
            </button>
          </div>
          
        </div>

        {/* Right Side - Banner */}
        <div className="hidden lg:flex w-full lg:w-1/2 bg-blue-50/20 dark:bg-slate-900/30 flex-col items-center justify-center p-8 lg:p-10 relative overflow-hidden border-l border-white/50 dark:border-slate-700/50">
          
          <div className="max-w-xs w-full z-10 flex flex-col items-center text-center">
            
            {/* Illustration */}
            <div className="flex items-center justify-center h-40 mb-10 relative w-full group">
              {/* Central Medical Cross Card */}
              <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[1.5rem] shadow-xl flex items-center justify-center transform transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-2">
                <div className="relative w-10 h-10">
                  <div className="absolute top-1/2 left-0 w-full h-3 -translate-y-1/2 bg-white rounded-full"></div>
                  <div className="absolute left-1/2 top-0 h-full w-3 -translate-x-1/2 bg-white rounded-full"></div>
                </div>
              </div>
              
              {/* Floating Heart Card */}
              <div className="absolute z-20 -bottom-2 right-4 w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 flex items-center justify-center transform transition-all duration-500 group-hover:translate-x-2 group-hover:-translate-y-4">
                <svg className="w-7 h-7 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>

              {/* Floating Shield Card */}
              <div className="absolute z-0 top-0 left-6 w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 flex items-center justify-center transform transition-all duration-500 group-hover:-translate-x-4 group-hover:-translate-y-2 opacity-90">
                <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3 tracking-tight">
              Manage Smarter, Care Better
            </h2>
            <p className="text-xs text-gray-500/90 dark:text-slate-400 mb-10 leading-relaxed">
              End-to-end healthcare management — from patient registration to treatment. Trusted by doctors and clinics.
            </p>

            {/* Stats */}
            <div className="flex justify-between w-full">
              <div className="flex flex-col items-center">
                <span className="text-xl font-black text-blue-600 dark:text-blue-400 mb-0.5 tracking-tight">500+</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Clinics</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xl font-black text-blue-600 dark:text-blue-400 mb-0.5 tracking-tight">10k+</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Patients</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xl font-black text-blue-600 dark:text-blue-400 mb-0.5 tracking-tight">50+</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Specialists</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

