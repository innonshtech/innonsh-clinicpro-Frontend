'use client';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ROLES } from '@/constants/roles';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Image as ImageIcon, 
  Settings, 
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  Building2,
  Stethoscope,
  User
} from 'lucide-react';

export default function ClinicLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const [clinicData, setClinicData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/login');
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      setClinicData(user);
      if (user.role !== ROLES.CLINIC) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Invalid user data in localStorage');
      router.push('/login');
    }
  }, []);

  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/clinic', id: 'dashboard' },
    { icon: Users, label: 'Doctors', href: '/clinic/doctors', id: 'doctors' },
    { icon: UserPlus, label: 'Receptionists', href: '/clinic/receptionists', id: 'receptionists' },
    { icon: User, label: 'Patients', href: '/clinic/patients', id: 'patients' },
    { icon: Settings, label: 'Settings', href: '/clinic/settings', id: 'settings' }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden text-slate-800">

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Animated Desktop Sidebar */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-64 lg:bg-white lg:border-r lg:border-slate-100 lg:flex lg:flex-col"
      >
        <div className="flex h-16 items-center px-6 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center space-x-3">
              <img src="/icons8-medical-bag-100.png" alt="ClinicPro" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                ClinicPro
              </h1>
            </div>
          </div>
        </div>

        <nav className="mt-6 px-3 flex-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center px-3 py-2.5 mb-1 rounded-xl transition-all duration-200 font-medium ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>


      </motion.div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl p-4 lg:hidden"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <img src="/icons8-medical-bag-100.png" alt="ClinicPro" className="w-6 h-6 object-contain" />
              <h1 className="text-xl font-bold text-blue-600">ClinicPro</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav>
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center px-4 py-3 mb-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </motion.div>
      )}

      {/* Main content */}
      <div className="lg:ml-64 flex-1 flex flex-col min-h-screen">
        {/* Top navbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-100">
          <div className="flex items-center justify-between h-16 px-8">
            <div className="flex items-center flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors mr-4"
              >
                <Menu className="w-5 h-5" />
              </button>

              {pathname === '/clinic' && (
                <div className="hidden lg:flex items-center max-w-2xl w-full ml-4 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4" />
                  <input 
                    type="text" 
                    placeholder="Search receptionists, doctors, or settings..." 
                    className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-6">


              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-3 hover:bg-slate-50 transition-all rounded-lg p-1"
                >
                  <div className="hidden md:flex flex-col items-end">
                    <p className="text-sm font-semibold text-slate-800">Welcome, {clinicData?.name ? clinicData.name.split(' ')[0] : 'Clinic'}</p>
                    <p className="text-xs text-slate-500">Clinic Admin</p>
                  </div>
                  <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {clinicData?.name ? clinicData.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{clinicData?.name || 'Clinic Name'}</p>
                      <p className="text-xs text-gray-500">{clinicData?.email || 'clinic@example.com'}</p>
                    </div>
                    <Link href="/clinic/settings" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50" onClick={() => setProfileDropdownOpen(false)}>
                      <Settings className="w-4 h-4 mr-3" /> Settings
                    </Link>
                    <hr className="my-2" />
                    <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); router.push('/login'); }} className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 text-left">
                      <LogOut className="w-4 h-4 mr-3" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-8 relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
