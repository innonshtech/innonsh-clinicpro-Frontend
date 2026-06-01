'use client';
import { useState, useEffect } from 'react';
import { ROLES } from '@/constants/roles';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Calendar, 
  Activity,
  Users,
  UserCheck,
  Stethoscope
} from 'lucide-react';
import { API_BASE_URL } from '@/utils/api';
import styles from './login.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

        switch (user.role) {
          case ROLES.ADMIN:
            router.push('/admin');
            break;
          case ROLES.DOCTOR:
            router.push('/doctor-dashboard');
            break;
          case ROLES.CLINIC:
            if (user.status === "pending") {
              router.push(`/pending-request/${user.id}`);
            } else if (user.status === "rejected") {
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

  if (!isMounted) return null;

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 relative overflow-hidden ${styles.hideScrollbar} ${styles.radialBg} dark:${styles.darkRadialBg}`}>
      
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/5 rounded-full blur-3xl"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`relative z-10 w-full max-w-[1000px] xl:max-w-[1100px] rounded-[24px] lg:rounded-[32px] overflow-hidden flex flex-col lg:flex-row ${styles.glassCard} dark:${styles.darkGlassCard}`}
      >
        {/* Left Section - Authentication (60%) */}
        <div className="w-full lg:w-[55%] xl:w-[60%] p-6 lg:p-8 xl:p-10 flex flex-col justify-center relative">
          
          <div className="absolute top-6 right-6 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">System Operational</span>
          </div>

          <div className="max-w-md w-full mx-auto">
            {/* Header */}
            <div className="mb-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                    ClinicPro
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-semibold">
                      v2.5
                    </span>
                  </h1>
                </div>
              </div>
              
              <h2 className="text-[28px] sm:text-[36px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight mb-2">
                Welcome back
              </h2>
              <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">
                Access your healthcare operations dashboard
              </p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 flex items-start space-x-3 overflow-hidden"
                >
                  <ShieldCheck className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <span className="text-xs font-medium text-red-800 dark:text-red-200">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <Formik
              initialValues={{ email: '', password: '', remember: false }}
              validationSchema={loginSchema}
              onSubmit={handleLogin}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-3.5">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <div className={`relative group ${styles.inputGlow} rounded-xl transition-all duration-300`}>
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="h-[16px] w-[16px] text-gray-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                      </div>
                      <Field
                        type="text"
                        name="email"
                        placeholder="admin@clinic.com"
                        className="w-full h-[44px] pl-10 pr-4 bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-[13px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-all"
                      />
                    </div>
                    <ErrorMessage name="email" component="div" className="text-red-500 text-[11px] font-medium mt-1 pl-1" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Password
                      </label>
                      <button type="button" className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors">
                        Forgot password?
                      </button>
                    </div>
                    <div className={`relative group ${styles.inputGlow} rounded-xl transition-all duration-300`}>
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-[16px] w-[16px] text-gray-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                      </div>
                      <Field
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="••••••••"
                        className="w-full h-[44px] pl-10 pr-10 bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-[13px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-[16px] w-[16px]" /> : <Eye className="h-[16px] w-[16px]" />}
                      </button>
                    </div>
                    <ErrorMessage name="password" component="div" className="text-red-500 text-[11px] font-medium mt-1 pl-1" />
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center"
                  >
                    <Field
                      type="checkbox"
                      name="remember"
                      id="remember"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 bg-white/60 dark:bg-slate-800 dark:border-slate-600"
                    />
                    <label htmlFor="remember" className="ml-2 block text-[13px] font-medium text-gray-600 dark:text-gray-400">
                      Remember me for 30 days
                    </label>
                  </motion.div>

                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)' }}
                    whileTap={{ y: 0 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-[44px] flex justify-center items-center gap-2 rounded-xl text-white text-[14px] font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-1 shadow-md shadow-blue-600/20"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <>
                        <span>Sign In to Dashboard</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </motion.button>
                </Form>
              )}
            </Formik>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-center"
            >
              <p className="text-[14px] text-gray-500 dark:text-gray-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/register')}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Register your clinic
                </button>
              </p>
            </motion.div>

            {/* Trust Badges */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-5 pt-4 border-t border-gray-200/60 dark:border-slate-700/60"
            >
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { text: "HIPAA Ready", icon: ShieldCheck },
                  { text: "E2E Encryption", icon: Lock },
                  { text: "Role Based Access", icon: Users },
                ].map((badge, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100/80 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-xs font-medium text-gray-600 dark:text-gray-300">
                    <badge.icon className="w-3.5 h-3.5 text-emerald-500" />
                    {badge.text}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500 font-medium">
                <ShieldCheck className="w-4 h-4" />
                Protected by Enterprise Grade Security
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Section - Product Showcase (40%) */}
        <div className="hidden lg:flex w-full lg:w-[45%] xl:w-[40%] bg-gradient-to-br from-blue-600 to-indigo-700 relative flex-col items-center justify-between p-6 lg:p-8 overflow-hidden">
          
          {/* Abstract Background Shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[50%] bg-white/10 rounded-full blur-3xl transform rotate-12"></div>
            <div className="absolute bottom-[-10%] left-[-20%] w-[60%] h-[60%] bg-indigo-500/20 rounded-full blur-3xl"></div>
            
            {/* Grid Pattern */}
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
          </div>

          <div className="relative z-10 w-full pt-0 xl:pt-2 text-center">
            <h2 className="text-xl xl:text-2xl font-bold text-white mb-2 tracking-tight">
              Manage Smarter,<br/>Care Better
            </h2>
            <p className="text-blue-100/90 text-[13px] max-w-[260px] mx-auto leading-relaxed">
              End-to-end healthcare management platform trusted by modern clinics.
            </p>
          </div>

          {/* Floating UI Presentation */}
          <div className="relative z-10 w-full h-[220px] my-auto flex items-center justify-center perspective-1000">
            
            {/* Center Main Card */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className={`absolute w-44 h-48 rounded-2xl ${styles.glassPanel} p-3 flex flex-col gap-2 shadow-2xl z-20 border border-white/20`}
            >
              <div className="w-full h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mb-1 flex flex-col p-2.5 justify-between">
                 <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <Activity className="w-3 h-3 text-white" />
                 </div>
                 <div>
                    <div className="text-white/80 text-[8px] font-semibold uppercase">Total Revenue</div>
                    <div className="text-white text-base font-bold">₹1.25L</div>
                 </div>
              </div>
              <div className="flex-1 rounded-xl bg-gray-50/50 flex flex-col gap-2 p-3">
                 <div className="h-2 w-3/4 bg-gray-200 rounded-full"></div>
                 <div className="h-2 w-1/2 bg-gray-200 rounded-full"></div>
                 <div className="h-2 w-5/6 bg-gray-200 rounded-full"></div>
              </div>
            </motion.div>

            {/* Left Floating Card - Appointments */}
            <motion.div 
              animate={{ y: [0, 15, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              className={`absolute left-[5%] top-4 w-32 rounded-xl ${styles.glassPanel} p-2 flex items-center gap-2 shadow-xl z-30 transform -rotate-6 border border-white/30`}
            >
              <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <Calendar className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <div>
                <div className="text-gray-900 text-[11px] font-bold">18</div>
                <div className="text-gray-500 text-[8px] font-semibold uppercase">Appointments</div>
              </div>
            </motion.div>

            {/* Right Floating Card - Patients */}
            <motion.div 
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 0.5 }}
              className={`absolute right-[5%] bottom-4 w-32 rounded-xl ${styles.glassPanel} p-2 flex items-center gap-2 shadow-xl z-30 transform rotate-3 border border-white/30`}
            >
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div>
                <div className="text-gray-900 text-[11px] font-bold">245</div>
                <div className="text-gray-500 text-[8px] font-semibold uppercase">Patients</div>
              </div>
            </motion.div>
            
            {/* Top Right Floating Card - Staff */}
            <motion.div 
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 2 }}
              className={`absolute right-8 top-[-5px] w-24 rounded-xl ${styles.glassPanel} p-1.5 flex items-center gap-1.5 shadow-xl z-10 transform rotate-12 opacity-80 border border-white/20`}
            >
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <UserCheck className="w-2.5 h-2.5 text-blue-600" />
              </div>
              <div>
                <div className="text-gray-900 text-[10px] font-bold">32</div>
                <div className="text-gray-500 text-[7px] font-semibold uppercase">Online</div>
              </div>
            </motion.div>

          </div>

          {/* Bottom Stats */}
          <div className="relative z-10 w-full mt-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 flex flex-col items-center">
                <div className="text-white text-lg font-bold tracking-tight mb-0.5">500+</div>
                <div className="text-blue-100/70 text-[10px] font-semibold uppercase tracking-wider">Clinics</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 flex flex-col items-center">
                <div className="text-white text-lg font-bold tracking-tight mb-0.5">10K+</div>
                <div className="text-blue-100/70 text-[10px] font-semibold uppercase tracking-wider">Patients</div>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
      
      {/* Mobile Stats (only shows on small screens) */}
      <div className="lg:hidden relative z-10 w-full max-w-md mt-6 grid grid-cols-2 gap-3">
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl p-3 border border-gray-200 dark:border-slate-700/40 text-center shadow-sm">
          <div className="text-blue-600 dark:text-blue-400 text-lg font-bold">500+</div>
          <div className="text-gray-500 dark:text-gray-400 text-[10px] font-semibold uppercase">Clinics</div>
        </div>
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl p-3 border border-gray-200 dark:border-slate-700/40 text-center shadow-sm">
          <div className="text-blue-600 dark:text-blue-400 text-lg font-bold">10K+</div>
          <div className="text-gray-500 dark:text-gray-400 text-[10px] font-semibold uppercase">Patients</div>
        </div>
      </div>
    </div>
  );
}
