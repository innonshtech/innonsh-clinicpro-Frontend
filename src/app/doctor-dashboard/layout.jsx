'use client';
import { useState, useEffect } from 'react';
import { useDoctor } from '@/context/DoctorContext';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ROLES } from '@/constants/roles';
import { 
  Stethoscope, Calendar, Users, Activity, Settings, Search, Menu, X, User, LogOut, ChevronDown, Clock, FileText
} from 'lucide-react';

export default function ClinicDashboardLayout({ children }) {
  const { doctor, loading } = useDoctor();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/login');
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      setUserData(user);
      if (user.role !== ROLES.DOCTOR) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Invalid user data in localStorage');
      router.push('/login');
    }
  }, []);

  const sidebarItems = [
    { icon: Activity, label: 'Dashboard', href: '/doctor-dashboard', id: 'overview' },
    { icon: Calendar, label: 'Appointments', href: '/doctor-dashboard/appointments', id: 'appointments' },
    { icon: Users, label: 'Patients', href: '/doctor-dashboard/patients', id: 'patients' },
    { icon: Calendar, label: 'Manage Leave', href: '/doctor-dashboard/leave', id: 'leave' },
    // { icon: FileText, label: 'Medical Records', href: '/doctor-dashboard/records', id: 'records' },
    { icon: Settings, label: 'Profile', href: '/doctor-dashboard/profile', id: 'profile' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden text-slate-800">

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-300" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-16 items-center px-6 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center space-x-3">
              <img src="/icons8-medical-bag-100.png" alt="ClinicPro" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-slate-800">ClinicPro</h1>
            </div>
          </div>
        </div>

        <nav className="mt-8 px-4">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center px-3 py-2.5 mx-3 mb-1 rounded-xl transition-all duration-200 font-medium ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>


      </div>

      {/* Main content */}
      <div className="lg:ml-72 flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-100">
          <div className="flex items-center justify-between h-16 px-8">
            <div className="flex items-center flex-1">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors mr-4">
                <Menu className="w-5 h-5" />
              </button>

              {pathname === '/doctor-dashboard' && (
                <div className="hidden lg:flex items-center max-w-2xl w-full ml-4 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4" />
                  <input 
                    type="text" 
                    placeholder="Search analytics, records, or patients..." 
                    className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-6">


              {/* Top-Right Profile Dropdown */}
              <div className="relative">
                <button onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} className="flex items-center space-x-3 hover:bg-slate-50 transition-all rounded-lg p-1">
                  <div className="hidden md:flex flex-col items-end">
                    <p className="text-sm font-semibold text-slate-800 capitalize truncate">Welcome, Dr. {doctor?.firstName || userData?.firstName || ''}</p>
                    <p className="text-xs text-slate-500 capitalize truncate">{doctor?.hospital || 'Clinic Consultant'}</p>
                  </div>
                  <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white overflow-hidden font-bold text-sm">
                    {doctor?.profileImage ? (
                      <img src={doctor.profileImage} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-bold text-sm">{(doctor?.firstName || userData?.firstName || 'D').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200/60 py-2 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-900">Dr. {doctor?.firstName || ''} {doctor?.lastName || ''}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{doctor?.email || ''}</p>
                    </div>
                    <Link href="/doctor-dashboard/profile" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setProfileDropdownOpen(false)}>
                      <User className="w-4 h-4 mr-3 text-slate-400" /> Profile
                    </Link>
                    <hr className="my-2 border-slate-100" />
                    <button onClick={() => {
                      localStorage.removeItem('token');
                      localStorage.removeItem('user');
                      router.push('/login');
                    }} className="w-full flex items-center px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-left">
                      <LogOut className="w-4 h-4 mr-3" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-8 relative z-10">{children}</main>
      </div>
    </div>
  );
}
