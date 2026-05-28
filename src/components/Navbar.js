'use client';

// // import Image from 'next/image';
// import Link from 'next/link';
// import { useState,useEffect } from 'react';
// import { Menu, X, Search, User, Bell } from 'lucide-react';
// import { usePathname } from 'next/navigation';
// import { useRouter } from 'next/navigation';

// export default function Navbar() {
//   const router = useRouter();

//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const[userData,setUser]=useState();

//   const pathname = usePathname();

//   // Function to determine if a link is active
//   const isActive = (path) => {
//     if (path === '/') return pathname === path;
//     return pathname.startsWith(path);
//   };

// useEffect(() => {
//   const token = localStorage.getItem('token');
//   const userStr = localStorage.getItem('user');
//   if (userStr) {
//     try {
//       const data = JSON.parse(userStr);
//       setUser(data);
//     } catch (err) {
//       console.error("Error parsing user data", err);
//     }
//   }
// }, []);
// console.log("asdf",userData)

//   return (
//     <nav className="bg-white shadow-sm sticky top-0 z-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between h-16">
//           <div className="flex items-center">
//             <Link href="/" className="flex-shrink-0 flex items-center">
//               <div className="h-8 w-8 bg-blue-600 rounded-md flex items-center justify-center">
//                 <span className="text-white font-bold">H</span>
//               </div>
//               <span className="ml-2 text-xl font-bold text-blue-600">HealthByte</span>
//             </Link>
//             <div className="hidden md:ml-6 md:flex md:space-x-8">
//               <Link 
//                 href="/" 
//                 className={`${isActive('/') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'} px-1 pt-1 inline-flex items-center text-sm font-medium`}
//               >
//                 Home
//               </Link>
//               <Link 
//                 href="/doctors" 
//                 className={`${isActive('/doctors') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'} px-1 pt-1 inline-flex items-center text-sm font-medium`}
//               >
//                 Find Doctors
//               </Link>
//               <Link 
//                 href="/clinics" 
//                 className={`${isActive('/clinics') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'} px-1 pt-1 inline-flex items-center text-sm font-medium`}
//               >
//                 Clinics
//               </Link>
//               <Link 
//                 href="/Services" 
//                 className={`${isActive('/Services') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'} px-1 pt-1 inline-flex items-center text-sm font-medium`}
//               >
//                 Services
//               </Link>
              
//             </div>
//           </div>
//           <div className="hidden md:flex items-center">
//             {/* <div className="relative mx-4">
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                 <Search className="h-5 w-5 text-gray-400" />
//               </div>
//               <input
//                 className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//                 placeholder="Search for doctors, clinics..."
//                 type="search"
//               />
//             </div> */}
//             {/* <div className="flex items-center space-x-3">
//               <button className="p-1 rounded-full text-gray-400 hover:text-gray-600 focus:outline-none">
//                 <Bell className="h-6 w-6" />
//               </button>
//               <div className="border-l border-gray-300 h-6 mx-1"></div>
//               <Link href="/login" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
//                 Login
//               </Link>
//               <Link href="/register" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm">
//                 Register
//               </Link>
//             </div> */}
//             <div className="flex items-center space-x-3">
//   <button className="p-1 rounded-full text-gray-400 hover:text-gray-600 focus:outline-none">
//     <Bell className="h-6 w-6" />
//   </button>
//   <div className="border-l border-gray-300 h-6 mx-1"></div>

//   {userData  && userData.role=="patient"? (
//     <>
//       <button
//         onClick={() => {
//           if (userData.role === 'patient') {
//             router.push('/patient-dashboard');
//           } else if (userData.role === 'doctor') {
//             router.push('/doctor-dashboard');
//           } else {
//             router.push('/dashboard'); // default fallback
//           }
//         }}
//         className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 rounded-md"
//       >
//         Dashboard
//       </button>
//       <button
//         onClick={() => {
//           localStorage.removeItem('token');
//           localStorage.removeItem('user');
//           setUser(null);
//           window.location.reload(); // or router.push('/login') if preferred
//         }}
//         className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
//       >
//         Logout
//       </button>
//     </>
//   ) : (
//     <>
//       <Link href="/login" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
//         Login
//       </Link>
//       <Link href="/register" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm">
//         Register
//       </Link>
//     </>
//   )}
// </div>



//           </div>
//           <div className="-mr-2 flex items-center md:hidden">
//             <button
//               onClick={() => setIsMenuOpen(!isMenuOpen)}
//               className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
//             >
//               <span className="sr-only">Open main menu</span>
//               {isMenuOpen ? (
//                 <X className="block h-6 w-6" />
//               ) : (
//                 <Menu className="block h-6 w-6" />
//               )}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Mobile menu */}
//       {isMenuOpen && (
//         <div className="md:hidden bg-white border-t border-gray-100">
//           <div className="px-2 pt-2 pb-3 space-y-1">
//             <Link 
//               href="/" 
//               className={`${isActive('/') ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'} block px-3 py-2 rounded-md text-base font-medium`}
//             >
//               Home
//             </Link>
//             <Link 
//               href="/doctors" 
//               className={`${isActive('/doctors') ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'} block px-3 py-2 rounded-md text-base font-medium`}
//             >
//               Find Doctors
//             </Link>
//             <Link 
//               href="/clinics" 
//               className={`${isActive('/clinics') ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'} block px-3 py-2 rounded-md text-base font-medium`}
//             >
//               Clinics
//             </Link>
//             <Link 
//               href="/services" 
//               className={`${isActive('/services') ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'} block px-3 py-2 rounded-md text-base font-medium`}
//             >
//               Services
//             </Link>
//           </div>
//           <div className="pt-4 pb-3 border-t border-gray-200">
//             <div className="px-4 flex items-center">
//               <div className="flex-shrink-0">
//                 <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
//                   <User className="h-6 w-6 text-blue-600" />
//                 </div>
//               </div>
//               <div className="ml-3">
//                 <div className="text-sm font-medium text-gray-500">Sign in to access your account</div>
//               </div>
//             </div>
//             <div className="mt-3 px-2 space-y-1">
//               <Link href="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:bg-gray-50">
//                 Login
//               </Link>
//               <Link href="/signup" className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50">
//                 Sign Up
//               </Link>
//             </div>
//           </div>
//         </div>
//       )}
//     </nav>
//   );
// }


import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, Search, User, Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userData, setUser] = useState();
  const pathname = usePathname();

  const isActive = (path) => {
    if (path === '/') return pathname === path;
    return pathname.startsWith(path);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const data = JSON.parse(userStr);
        setUser(data);
      } catch (err) {
        console.error("Error parsing user data", err);
      }
    }
  }, []);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold">H</span>
              </div>
              <span className="ml-2 text-xl font-bold text-blue-600">HealthByte</span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link
                href="/"
                className={`${isActive('/') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'} px-1 pt-1 inline-flex items-center text-sm font-medium`}
              >
                Home
              </Link>
              <Link
                href="/services"
                className={`${isActive('/services') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'} px-1 pt-1 inline-flex items-center text-sm font-medium`}
              >
                Services
              </Link>
              <Link
                href="/doctors"
                className={`${isActive('/doctors') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'} px-1 pt-1 inline-flex items-center text-sm font-medium`}
              >
                Find Doctors
              </Link>
              <Link
                href="/clinics"
                className={`${isActive('/clinics') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'} px-1 pt-1 inline-flex items-center text-sm font-medium`}
              >
                Clinics
              </Link>
            </div>
          </div>

          <div className="hidden md:flex items-center">
            <div className="flex items-center space-x-3">
              <button className="p-1 rounded-full text-gray-400 hover:text-gray-600 focus:outline-none">
                <Bell className="h-6 w-6" />
              </button>
              <div className="border-l border-gray-300 h-6 mx-1"></div>
              {userData && userData.role === "patient" ? (
                <>
                  <button
                    onClick={() => {
                      if (userData.role === 'patient') {
                        router.push('/patient-dashboard');
                      } else if (userData.role === 'doctor') {
                        router.push('/doctor-dashboard');
                      } else {
                        router.push('/dashboard');
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 rounded-md"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem('token');
                      localStorage.removeItem('user');
                      setUser(null);
                      window.location.reload();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                    Login
                  </Link>
                  <Link href="/register" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="-mr-2 flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className={`${isActive('/') ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'} block px-3 py-2 rounded-md text-base font-medium`}
            >
              Home
            </Link>
            <Link
              href="/services"
              className={`${isActive('/services') ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'} block px-3 py-2 rounded-md text-base font-medium`}
            >
              Services
            </Link>
            <Link
              href="/doctors"
              className={`${isActive('/doctors') ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'} block px-3 py-2 rounded-md text-base font-medium`}
            >
              Find Doctors
            </Link>
            <Link
              href="/clinics"
              className={`${isActive('/clinics') ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'} block px-3 py-2 rounded-md text-base font-medium`}
            >
              Clinics
            </Link>
          </div>

          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="px-4 flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-500">Sign in to access your account</div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <Link href="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:bg-gray-50">
                Login
              </Link>
              <Link href="/register" className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
