'use client';
// app/components/Layout/Header.jsx
import { useState } from 'react'
import { Bars3Icon, MagnifyingGlassIcon, ArrowRightOnRectangleIcon, UserIcon } from '@heroicons/react/24/outline'
import { useRouter, usePathname } from 'next/navigation'

export default function Header({ onMenuClick }) {
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const pathname = usePathname()

  const getPageTitle = (path) => {
    if (path === '/receptionist-dashboard') return 'Dashboard';
    if (path.includes('/patients/add')) return 'Add Patient';
    if (path.includes('/patients')) return 'View Patients';
    if (path.includes('/appointments/add')) return 'Book Appointment';
    if (path.includes('/appointments')) return 'Appointments';
    if (path.includes('/Billing')) return 'Billing';
    if (path.includes('/Messages')) return 'Messages';
    return 'Dashboard';
  };

  const handleLogout = () => {
    // Perform logout actions here (clear tokens, etc.)
    // For example:
    localStorage.removeItem('token')
       localStorage.removeItem('user')
    
    // Redirect to login page
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-100">
      <div className="flex items-center justify-between h-16 px-8">
        <div className="flex items-center flex-1">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors mr-4"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {pathname === '/receptionist-dashboard' && (
            <div className="hidden lg:flex flex-1 max-w-2xl ml-4 group">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const term = e.target.search.value;
                  if (term.trim()) {
                    router.push(`/receptionist-dashboard/patients?search=${encodeURIComponent(term)}`);
                  }
                }}
                className="w-full relative"
              >
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  name="search"
                  type="text"
                  className="block w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                  placeholder="Search patients, appointments, or invoices..."
                />
              </form>
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-6">
          


          {/* User menu */}
          <div className="relative group">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 hover:bg-slate-50 transition-all rounded-lg p-1"
            >
              <div className="hidden md:flex flex-col items-end">
                <p className="text-sm font-semibold text-slate-800">Welcome, Receptionist</p>
                <p className="text-xs text-slate-500">Front Office</p>
              </div>
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                R
              </div>
            </button>

            {/* User dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200/60 z-50 overflow-hidden py-2 transform origin-top-right transition-all">
                <div className="py-1">
                  <button
                    onClick={() => { setShowUserMenu(false); router.push('/receptionist-dashboard/profile'); }}
                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center"
                  >
                    <UserIcon className="h-4 w-4 mr-3 text-slate-400" />
                    My Profile
                  </button>
                  <div className="border-t border-slate-100 my-2"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
