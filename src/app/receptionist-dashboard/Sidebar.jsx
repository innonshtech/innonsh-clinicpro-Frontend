'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/utils/api';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  CreditCard,
  Home,
  X,
  User
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/receptionist-dashboard', icon: Home },
  { name: 'Add Patient', href: '/receptionist-dashboard/patients/add', icon: UserPlus },
  { name: 'View Patients', href: '/receptionist-dashboard/patients', icon: Users },
  { name: 'Appointments', href: '/receptionist-dashboard/appointments', icon: Calendar },
  { name: 'Billing', href: '/receptionist-dashboard/Billing', icon: CreditCard },
  { name: 'Profile', href: '/receptionist-dashboard/profile', icon: User },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [userName, setUserName] = useState('MediReception');

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const localUser = JSON.parse(userStr || '{}');
    const activeUser = user || localUser;
    
    if (activeUser.clinicName) {
      setUserName(`${activeUser.clinicName} - Receptionist`);
    } else if (activeUser.firstName) {
      setUserName(`${activeUser.firstName} - Receptionist`);
    }

    const fetchLatestProfile = async () => {
      try {
        const staffId = activeUser._id || activeUser.id;
        if (!staffId) return;

        const res = await fetch(`${API_BASE_URL}/api/v1/clinic/update-receptionist/${staffId}`);
        const result = await res.json();
        
        if (result.success && result.data.staff && result.data.staff.clinicName) {
          setUserName(`${result.data.staff.clinicName} - Receptionist`);
        }
      } catch (e) {
        console.error("Sidebar Live Fetch Error:", e);
      }
    };
    fetchLatestProfile();
  }, [user]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-black bg-opacity-50"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-indigo-100 shadow-sm shadow-indigo-100/50 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center px-6 h-16 border-b border-slate-100">
          <Link href="/receptionist-dashboard" className="flex items-center hover:opacity-80 transition-opacity">
              <img src="/icons8-medical-bag-100.png" alt="ClinicPro" className="w-8 h-8 object-contain" />
            <div className="ml-3 min-w-0">
              <h1 className="text-xl font-bold text-slate-800 truncate">
                ClinicPro
              </h1>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden ml-auto p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 px-3 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 mb-1 rounded-xl transition-all duration-200 font-medium ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                  onClick={onClose}
                >
                  <Icon className={`w-5 h-5 mr-3 flex-shrink-0 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>


      </div>
    </>
  );
}
