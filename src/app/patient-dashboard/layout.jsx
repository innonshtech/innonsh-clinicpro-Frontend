'use client';
// // // // import { useState,useEffect } from 'react'
// // import { usePathname } from 'next/navigation'
// // import { FiHome, FiCalendar, FiFileText, FiPieChart, FiSettings, FiUser, FiMenu, FiX } from 'react-icons/fi'
// // import { FaHeartbeat, FaClinicMedical } from 'react-icons/fa'
// // import { useRouter } from 'next/navigation'
// // import Link from 'next/link'
// // import { 
// 
// //   LogOut
// // } from 'lucide-react'
// // export default function DashboardLayout({ children }) {
// //   const [sidebarOpen, setSidebarOpen] = useState(false)
// //     const router = useRouter();
// //   const pathname = usePathname()
// // useEffect(() => {
// //       const token = localStorage.getItem('token')
// //       const userStr = localStorage.getItem('user')
//       
// //       if (!token || !userStr) {
// //         router.push('/login')
// //         return
// //       }
//       
// //        try {
// //          const user = JSON.parse(userStr)
// //          console.log(user)
// //         if (user.role !== "patient") {
// //           router.push('/login')
// //         }
// //       } catch (error) {
// //         console.error('Invalid user data in localStorage')
// //         router.push('/login')
// //       }
// //     }, [router])
// //   const navItems = [
// //     { name: 'Overview', href: '/patient-dashboard', icon: <FiHome size={20} /> },
// //     { name: 'Appointments', href: '/patient-dashboard/appointments', icon: <FiCalendar size={20} /> },
// //     { name: 'Prescriptions', href: '/patient-dashboard/prescriptions', icon: <FaClinicMedical size={20} /> },
// //     { name: 'Medical Records', href: '/patient-dashboard/medical-records', icon: <FiFileText size={20} /> },
// //     { name: 'Health Data', href: '/patient-dashboard/health-data', icon: <FaHeartbeat size={20} /> },
// //     { name: 'Settings', href: '/patient-dashboard/settings', icon: <FiSettings size={20} /> },
// //   ]
// 
// //   return (
// //     <div className="flex h-screen bg-gray-50">
// //       {/* Mobile sidebar backdrop */}
// //       {sidebarOpen && (
// //         <div 
// //           className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
// //           onClick={() => setSidebarOpen(false)}
// //         />
// //       )}
// 
// //       {/* Sidebar */}
// //       <aside 
// //         className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto`}
// //       >
// //         <div className="flex flex-col h-full">
// //           {/* Sidebar header */}
// //           <div className="flex items-center justify-between p-4 border-b">
// //             <div className="flex items-center space-x-2">
// //               <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
// //                 <FiUser className="text-white" />
// //               </div>
// //               <span className="font-semibold text-lg">Patient Portal</span>
// //             </div>
// //             <button 
// //               className="lg:hidden text-gray-500 hover:text-gray-700"
// //               onClick={() => setSidebarOpen(false)}
// //             >
// //               <FiX size={24} />
// //             </button>
// //           </div>
// 
// //           {/* Sidebar navigation */}
// //           <nav className="flex-1 overflow-y-auto p-4">
// //             <ul className="space-y-2">
// //               {navItems.map((item) => (
// //                 <li key={item.name}>
// //                   <Link
// //                     href={item.href}
// //                     className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${pathname === item.href ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
// //                     onClick={() => setSidebarOpen(false)}
// //                   >
// //                     <span className={pathname === item.href ? 'text-blue-600' : 'text-gray-500'}>
// //                       {item.icon}
// //                     </span>
// //                     <span>{item.name}</span>
// //                   </Link>
// //                 </li>
// //               ))}
// //             </ul>
// //           </nav>
// 
// //           {/* Sidebar footer */}
// //           <div className="p-4 border-t">
// //             <div className="text-sm text-gray-500">
// //               <button
// //   onClick={() => {
// //     localStorage.removeItem('token'); 
// //     localStorage.removeItem('user');// 🔐 Clear the token
// //     router.push('/login');      // 🚀 Redirect to login
// //   }}
// //   className="mt-2 w-full flex items-center justify-center px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50/50 rounded-lg transition-colors"
// // >
// //   <LogOut className="mr-2 h-4 w-4" />
// //   Sign out
// // </button>
// //             </div>
// //           </div>
// //         </div>
// //       </aside>
// 
// //       {/* Main content */}
// //       <div className="flex-1 flex flex-col overflow-hidden">
// //         {/* Top navigation */}
// //         <header className="bg-white shadow-sm z-10">
// //           <div className="flex items-center justify-between px-6 py-4">
// //             <button 
// //               className="lg:hidden text-gray-500 hover:text-gray-700"
// //               onClick={() => setSidebarOpen(true)}
// //             >
// //               <FiMenu size={24} />
// //             </button>
// 
// //             <div className="flex items-center space-x-4">
// //               <div className="relative">
// //                 <button className="text-gray-500 hover:text-gray-700">
// //                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
// //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
// //                   </svg>
// //                   <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
// //                 </button>
// //               </div>
// //               <div className="flex items-center space-x-2">
// //                 <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
// //                   <FiUser className="text-blue-600" />
// //                 </div>
// //                 <span className="font-medium">John Doe</span>
// //               </div>
// //               <Link href="/">
// //                 Home
// //               </Link>
// //             </div>
// //           </div>
// //         </header>
// 
// //         {/* Main content area */}
// //         <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
// //           {children}
// //         </main>
// //       </div>
// //     </div>
// //   )
// // }
// 
// // import { useState,useEffect } from 'react'
// // import { usePathname } from 'next/navigation'
// // import { FiHome, FiCalendar, FiFileText, FiPieChart, FiSettings, FiUser, FiMenu, FiX } from 'react-icons/fi'
// // import { FaHeartbeat, FaClinicMedical } from 'react-icons/fa'
// // import { useRouter } from 'next/navigation'
// // import Link from 'next/link'
// // import {
// //  
// //   LogOut
// // } from 'lucide-react'
// // export default function DashboardLayout({ children }) {
// //   const [sidebarOpen, setSidebarOpen] = useState(false)
// //     const router = useRouter();
// //   const pathname = usePathname()
// // useEffect(() => {
// //       const token = localStorage.getItem('token')
// //       const userStr = localStorage.getItem('user')
// //      
// //       if (!token || !userStr) {
// //         router.push('/login')
// //         return
// //       }
// //      
// //        try {
// //          const user = JSON.parse(userStr)
// //          console.log(user)
// //         if (user.role !== "patient") {
// //           router.push('/login')
// //         }
// //       } catch (error) {
// //         console.error('Invalid user data in localStorage')
// //         router.push('/login')
// //       }
// //     }, [router])
// //   const navItems = [
// //     { name: 'Overview', href: '/patient-dashboard', icon: <FiHome size={20} /> },
// //     { name: 'Appointments', href: '/patient-dashboard/appointments', icon: <FiCalendar size={20} /> },
// //     { name: 'Prescriptions', href: '/patient-dashboard/prescriptions', icon: <FaClinicMedical size={20} /> },
// //     { name: 'Medical Records', href: '/patient-dashboard/medical-records', icon: <FiFileText size={20} /> },
// //     { name: 'Health Data', href: '/patient-dashboard/health-data', icon: <FaHeartbeat size={20} /> },
// //     { name: 'Settings', href: '/patient-dashboard/settings', icon: <FiSettings size={20} /> },
// //   ]
// //  
// //   return (
// //     <div className="flex h-screen bg-gray-50">
// //       {/* Mobile sidebar backdrop */}
// //       {sidebarOpen && (
// //         <div
// //           className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
// //           onClick={() => setSidebarOpen(false)}
// //         />
// //       )}
// //  
// //       {/* Sidebar */}
// //       <aside
// //         className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto`}
// //       >
// //         <div className="flex flex-col h-full">
// //           {/* Sidebar header */}
// //           <div className="flex items-center justify-between p-4 border-b">
// //             <div className="flex items-center space-x-2">
// //               <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
// //                 <FiUser className="text-white" />
// //               </div>
// //               <span className="font-semibold text-lg">Patient Portal</span>
// //             </div>
// //             <button
// //               className="lg:hidden text-gray-500 hover:text-gray-700"
// //               onClick={() => setSidebarOpen(false)}
// //             >
// //               <FiX size={24} />
// //             </button>
// //           </div>
// //  
// //           {/* Sidebar navigation */}
// //           <nav className="flex-1 overflow-y-auto p-4">
// //             <ul className="space-y-2">
// //               {navItems.map((item) => (
// //                 <li key={item.name}>
// //                   <Link
// //                     href={item.href}
// //                     className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${pathname === item.href ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
// //                     onClick={() => setSidebarOpen(false)}
// //                   >
// //                     <span className={pathname === item.href ? 'text-blue-600' : 'text-gray-500'}>
// //                       {item.icon}
// //                     </span>
// //                     <span>{item.name}</span>
// //                   </Link>
// //                 </li>
// //               ))}
// //             </ul>
// //           </nav>
// //  
// //           {/* Sidebar footer */}
// //           <div className="p-4 border-t">
// //             <div className="text-sm text-gray-500">
// //               <button
// //   onClick={() => {
// //     localStorage.removeItem('token');
// //     localStorage.removeItem('user');// 🔐 Clear the token
// //     router.push('/login');      // 🚀 Redirect to login
// //   }}
// //   className="mt-2 w-full flex items-center justify-center px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50/50 rounded-lg transition-colors"
// // >
// //   <LogOut className="mr-2 h-4 w-4" />
// //   Sign out
// // </button>
// //             </div>
// //           </div>
// //         </div>
// //       </aside>
// //  
// //       {/* Main content */}
// //       <div className="flex-1 flex flex-col overflow-hidden">
// // {/* Top navigation */}
// // <header className="bg-white shadow-sm z-10">
// //   <div className="flex items-center justify-between px-6 py-4">
// //     <button
// //       className="lg:hidden text-gray-500 hover:text-gray-700"
// //       onClick={() => setSidebarOpen(true)}
// //     >
// //       <FiMenu size={24} />
// //     </button>
// //  
// //     <div className="flex items-center space-x-4">
// //       {/* Notification and user profile remain unchanged */}
// //       <div className="relative">
// //         <button className="text-gray-500 hover:text-gray-700">
// //           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
// //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
// //           </svg>
// //           <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
// //         </button>
// //       </div>
// //       <div className="flex items-center space-x-2">
// //         <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
// //           <FiUser className="text-blue-600" />
// //         </div>
// //         <span className="font-medium">John Doe</span>
// //       </div>
// //     </div>
// //    
// //     {/* Modern Find Doctors button */}
// //     <Link
// //       href="/doctors"
// //       className="relative inline-flex items-center justify-center px-4 py-2 overflow-hidden font-medium text-white transition-all duration-300 ease-out rounded-full group"
// //     >
// //       <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700"></span>
// //       <span className="absolute bottom-0 right-0 block w-44 h-44 mb-32 mr-4 transition-all duration-500 origin-bottom-left transform rotate-45 translate-x-24 bg-blue-800 opacity-30 group-hover:rotate-90 ease"></span>
// //       <span className="relative flex items-center text-sm">
// //         <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
// //           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
// //         </svg>
// //         Book Appointment
// //       </span>
// //     </Link>
// //   </div>
// // </header>
// //         {/* Main content area */}
// //         <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
// //           {children}
// //         </main>
// //       </div>
// //     </div>
// //   )
// // }
// // 
// 
// 
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { FiHome, FiCalendar, FiFileText, FiPieChart, FiSettings, FiUser, FiMenu, FiX, FiBell } from 'react-icons/fi'
import { FaHeartbeat, FaClinicMedical } from 'react-icons/fa'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Search, User } from 'lucide-react'
import { ROLES } from '@/constants/roles';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [userData, setUserData] = useState(null)
  const router = useRouter();
  const pathname = usePathname()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
     
    if (!token || !userStr) {
      router.push('/login')
      return
    }
     
    try {
      const user = JSON.parse(userStr)
      setUserData(user)
      
      if (user.role !== ROLES.PATIENT) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Invalid user data in localStorage')
      router.push('/login')
    }
  }, [])

  const navItems = [
    { name: 'Overview', href: '/patient-dashboard', icon: <FiHome size={20} /> },
    { name: 'Appointments', href: '/patient-dashboard/appointments', icon: <FiCalendar size={20} /> },
    { name: 'Prescriptions', href: '/patient-dashboard/prescriptions', icon: <FaClinicMedical size={20} /> },
    { name: 'Medical Records', href: '/patient-dashboard/medical-records', icon: <FiFileText size={20} /> },
    // { name: 'Health Data', href: '/patient-dashboard/health-data', icon: <FaHeartbeat size={20} /> },
    { name: 'Settings', href: '/patient-dashboard/settings', icon: <FiSettings size={20} /> },
  ]
 
  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 relative overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
 
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 flex flex-col transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-all duration-300 ease-out lg:translate-x-0 lg:static lg:inset-auto`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex h-16 items-center px-6 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FiUser className="text-white w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">
                    HealthByte
                  </h1>
                </div>
              </div>
              <button 
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <FiX size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
 
          {/* Sidebar navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1 mt-3">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 mx-3 mb-1 font-medium rounded-xl transition-all duration-200 ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className={`mr-3 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                    {item.icon}
                  </div>
                  <span className="flex-1 text-sm">{item.name}</span>
                </Link>
              )
            })}
          </nav>
 

        </div>
      </aside>
 
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-100">
          <div className="flex items-center justify-between h-16 px-8">
            <div className="flex items-center">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors mr-4">
                <FiMenu className="w-5 h-5" />
              </button>

              {pathname === '/patient-dashboard' && (
                <div className="hidden lg:flex items-center max-w-xl w-full ml-4 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4" />
                  <input 
                    type="text" 
                    placeholder="Search medical history, appointments, or prescriptions..." 
                    className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl pl-12 pr-4 py-2.5 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-6">


              <div className="relative">
                <button 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-3 hover:bg-slate-50 transition-all rounded-lg p-1 border border-transparent"
                >
                  <div className="hidden md:flex flex-col items-end">
                    <p className="text-sm font-semibold text-slate-800 capitalize truncate">Welcome, {userData?.firstName || 'Patient'}</p>
                    <p className="text-xs text-slate-500 capitalize truncate">Patient</p>
                  </div>
                  <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white overflow-hidden font-bold text-sm">
                    {userData?.firstName ? userData.firstName.charAt(0).toUpperCase() : 'P'}
                  </div>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200/60 py-2 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-900">{userData?.firstName || ''} {userData?.lastName || ''}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{userData?.email || ''}</p>
                    </div>
                    <Link href="/patient-dashboard/settings" className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setProfileDropdownOpen(false)}>
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
        
        {/* Main content area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
