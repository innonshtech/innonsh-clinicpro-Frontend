'use client';
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ROLES } from '@/constants/roles';
import { 
  Users, 
  Home, 
  Bell, 
  Search, 
  Menu, 
  X,
  UserPlus,
  Activity,
  BarChart3,
  LogOut,
  ChevronRight,
  Sparkles,
  FileText,
  Settings as SettingsIcon
} from 'lucide-react'

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter();
  const [userdata, setuserdata] = useState({ name: 'Admin User', email: 'admin@clinicpro.com' });

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Doctors', href: '/admin/doctors', icon: Users },
    { name: 'New Doctor', href: '/admin/doctors/add', icon: UserPlus },
    { name: 'Prescriptions', href: '/admin/prescription-template', icon: FileText },
    { name: 'Reports & Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Clinics', href: '/admin/clinics-manage', icon: Activity },
  ]

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    
    if (!token || !userStr) {
      router.push('/login')
      return
    }
    
    try {
      const user = JSON.parse(userStr)
      setuserdata(user)
      if (user.role !== ROLES.ADMIN) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Invalid user data in localStorage')
      router.push('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden text-slate-800">

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100
        transform transition-all duration-300 ease-out lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center px-6 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <img src="/icons8-medical-bag-100.png" alt="ClinicPro" className="w-8 h-8 object-contain" />
              <div>
                <h1 className="text-xl font-bold text-slate-800">
                  ClinicPro
                </h1>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-all duration-200 group"
            >
              <X className="h-5 w-5 text-slate-600 group-hover:text-blue-700" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-8 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                              (item.href !== '/admin' && pathname.startsWith(item.href))
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 mx-3 mb-1 font-medium rounded-xl transition-all duration-200 ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <Icon className={`h-5 w-5 mr-3 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="flex-1">{item.name}</span>
                </a>
              )
            })}
          </nav>


        </div>
      </div>

      <div className="lg:pl-72 flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-100">
          <div className="flex h-16 items-center justify-between px-8">
            <div className="flex items-center flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors mr-4"
              >
                <Menu className="w-5 h-5" />
              </button>

              {pathname === '/admin' && (
                <div className="hidden lg:flex items-center max-w-2xl w-full ml-4 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4" />
                  <input 
                    type="text" 
                    placeholder="Search clinics, doctors, or reports..." 
                    className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-6">


              <div className="relative group cursor-pointer">
                <button className="flex items-center space-x-3 hover:bg-slate-50 transition-all rounded-lg p-1 border border-transparent">
                  <div className="hidden md:flex flex-col items-end">
                    <p className="text-sm font-semibold text-slate-800">Welcome, {userdata?.name ? userdata.name.split(' ')[0] : 'Admin'}</p>
                    <p className="text-xs text-slate-500">SuperAdmin</p>
                  </div>
                  <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {userdata?.name ? userdata.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                </button>
                
                {/* Profile Dropdown */}
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-slate-200/60 z-50 transform origin-top-right group-hover:translate-y-0 translate-y-2 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 mb-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{userdata?.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium truncate">{userdata?.email}</p>
                  </div>
                  <a href="/admin/settings" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                    <SettingsIcon className="h-4 w-4 mr-3 text-slate-400" />
                    Settings
                  </a>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button 
                    onClick={() => {
                      localStorage.removeItem('token'); 
                      localStorage.removeItem('user');
                      router.push('/login');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center group/logout"
                  >
                    <LogOut className="h-4 w-4 mr-3 group-hover/logout:scale-110 transition-transform" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-8 relative z-10">
          {children}
        </main>
      </div>
    </div>
  )
}
