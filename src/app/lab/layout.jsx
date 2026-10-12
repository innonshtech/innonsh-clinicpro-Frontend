'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ROLES } from '@/constants/roles';
import {
  LAB_PERMISSIONS,
  hasLabPermission,
  LAB_ROLE_DETAILS,
  LAB_ROLES,
  isLabAdmin,
  isPathologist,
  isTechnician
} from '@/constants/labRoles';
import { useAuth } from '@/context/AuthContext';
import { formatTitleCase } from '@/utils/nameFormatting';
import { Toaster } from 'react-hot-toast';
import {
  FlaskConical,
  Activity,
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
  ClipboardList,
  TestTube,
  Truck,
  RotateCcw,
  BookOpen,
  Package,
  FileCheck,
  CheckSquare,
  AlertCircle,
  FileText,
  History,
  Users,
  CreditCard,
  BarChart3,
  ShieldCheck
} from 'lucide-react';

export default function LabLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [labUser, setLabUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setLabUser(user);

      if (user.role !== ROLES.LAB && user.role !== 'lab') {
        router.push('/login');
        return;
      }
    } catch (err) {
      console.error('Invalid lab user data in localStorage:', err);
      router.push('/login');
      return;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const allNavSections = [
    {
      title: 'Core',
      items: [
        { label: 'Dashboard', href: '/lab', icon: Activity, active: true },
      ]
    },
    {
      title: 'Lab Operations',
      items: [
        { label: 'Lab Orders', href: '/lab/orders', icon: ClipboardList, active: true, permission: LAB_PERMISSIONS.MANAGE_ORDERS },
        { label: 'Sample Collection', href: '/lab/sample-collection', icon: TestTube, active: true, permission: LAB_PERMISSIONS.MANAGE_ORDERS },
        { label: 'Sample Tracking', href: '/lab/sample-tracking', icon: Truck, active: true, permission: LAB_PERMISSIONS.MANAGE_ORDERS },
        { label: 'Rejection / Recollection', href: '/lab/recollections', icon: RotateCcw, active: true, permission: LAB_PERMISSIONS.MANAGE_ORDERS },
      ]
    },
    {
      title: 'Diagnostics',
      items: [
        { label: 'Test Catalog', href: '/lab/test-catalog', icon: BookOpen, active: true },
        { label: 'Test Packages', href: '/lab/test-packages', icon: Package, active: true },
      ]
    },
    {
      title: 'Results',
      items: [
        { label: 'Result Entry', href: '/lab/result-entry', icon: FileCheck, active: true, permission: LAB_PERMISSIONS.ENTER_RESULTS },
        { label: 'Result Validation', href: '/lab/result-validation', icon: CheckSquare, active: true, permission: LAB_PERMISSIONS.VALIDATE_RESULTS },
        { label: 'Critical Results', href: '/lab/critical-results', icon: AlertCircle, active: true },
      ]
    },
    {
      title: 'Reports',
      items: [
        { label: 'Report Generation', href: '/lab/report-generation', icon: FileText, active: true, permission: LAB_PERMISSIONS.ISSUE_REPORTS },
        { label: 'Report History', href: '/lab/report-history', icon: History, active: true, permission: LAB_PERMISSIONS.VIEW_REPORTS },
        { label: 'Patient Reports', href: '/lab/patient-reports', icon: Users, active: true, permission: LAB_PERMISSIONS.VIEW_REPORTS },
      ]
    },
    {
      title: 'Management',
      items: [
        { label: 'Lab Staff & RBAC', href: '/lab/staff', icon: ShieldCheck, active: true, permission: LAB_PERMISSIONS.MANAGE_STAFF },
        { label: 'Billing', href: '/lab/billing', icon: CreditCard, active: true, permission: LAB_PERMISSIONS.VIEW_BILLING },
        { label: 'Analytics', href: '/lab/analytics', icon: BarChart3, active: true, permission: LAB_PERMISSIONS.VIEW_ANALYTICS },
      ]
    }
  ];

  // Filter sidebar sections strictly by authenticated role and permissions
  const navSections = useMemo(() => {
    if (!labUser) return [];

    const isTech = isTechnician(labUser);
    const isPatho = isPathologist(labUser);
    const isAdmin = isLabAdmin(labUser);

    return allNavSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          // 1. Dashboard is always visible to authenticated lab workstations
          if (item.href === '/lab') return true;

          // 2. Sample Collection: Strictly phlebotomy / specimen drawing.
          // Pathologists have read-only specimen tracking and must NOT see sample collection.
          if (item.href === '/lab/sample-collection') {
            if (isPatho && !isAdmin) return false;
            return hasLabPermission(labUser, LAB_PERMISSIONS.MANAGE_ORDERS);
          }

          // 3. Billing: REMOVED from Lab Technician sidebar completely.
          // Hidden from Pathologists unless explicitly authorized.
          if (item.href === '/lab/billing') {
            if (isTech && !isAdmin) return false;
            return hasLabPermission(labUser, LAB_PERMISSIONS.VIEW_BILLING);
          }

          // 4. Critical Results:
          // Pathologists & Lab Admins (VALIDATE_RESULTS), or Technicians with result entry/validation permissions.
          if (item.href === '/lab/critical-results') {
            if (isAdmin) return true;
            if (isPatho) return hasLabPermission(labUser, LAB_PERMISSIONS.VALIDATE_RESULTS);
            if (isTech) {
              return hasLabPermission(labUser, LAB_PERMISSIONS.ENTER_RESULTS) || hasLabPermission(labUser, LAB_PERMISSIONS.VALIDATE_RESULTS);
            }
            return hasLabPermission(labUser, LAB_PERMISSIONS.VALIDATE_RESULTS);
          }

          // 5. Test Catalog & Test Packages: viewable if authorized for lab operations
          if (item.href === '/lab/test-catalog' || item.href === '/lab/test-packages') {
            if (isAdmin) return true;
            return (
              hasLabPermission(labUser, LAB_PERMISSIONS.MANAGE_ORDERS) ||
              hasLabPermission(labUser, LAB_PERMISSIONS.ENTER_RESULTS) ||
              hasLabPermission(labUser, LAB_PERMISSIONS.VALIDATE_RESULTS)
            );
          }

          // 6. Generic permission check for all other items
          if (item.permission) {
            return hasLabPermission(labUser, item.permission);
          }

          return true;
        })
      }))
      .filter((section) => section.items.length > 0);
  }, [labUser]);

  // Route authorization guard for direct URL navigation
  const routeAuthorization = useMemo(() => {
    if (!labUser) return { authorized: true };

    const currentPath = (pathname || '').replace(/\/$/, '') || '/lab';
    const isTech = isTechnician(labUser);
    const isPatho = isPathologist(labUser);
    const isAdmin = isLabAdmin(labUser);

    // 1. Direct block: Technicians cannot access Billing under any circumstance
    if (currentPath === '/lab/billing' && isTech && !isAdmin) {
      return {
        authorized: false,
        reason: 'Laboratory Technicians are not authorized to access Billing modules.'
      };
    }

    // 2. Direct block: Pathologists have read-only specimen tracking, not specimen collection drawing
    if (currentPath === '/lab/sample-collection' && isPatho && !isAdmin) {
      return {
        authorized: false,
        reason: 'Pathologists have read-only specimen tracking access and are not authorized for specimen collection actions.'
      };
    }

    // 3. Direct block: Staff cannot access staff management
    if (currentPath === '/lab/staff' && !isAdmin && !hasLabPermission(labUser, LAB_PERMISSIONS.MANAGE_STAFF)) {
      return {
        authorized: false,
        reason: 'Only Laboratory Administrators can access Staff Management & RBAC.'
      };
    }

    // 4. Critical results
    if (currentPath === '/lab/critical-results') {
      const canAccess = isAdmin ||
        hasLabPermission(labUser, LAB_PERMISSIONS.VALIDATE_RESULTS) ||
        hasLabPermission(labUser, LAB_PERMISSIONS.ENTER_RESULTS);
      if (!canAccess) {
        return {
          authorized: false,
          reason: 'You are not authorized to view critical panic findings.'
        };
      }
      return { authorized: true };
    }

    const routePermissions = {
      '/lab/orders': LAB_PERMISSIONS.MANAGE_ORDERS,
      '/lab/sample-collection': LAB_PERMISSIONS.MANAGE_ORDERS,
      '/lab/sample-tracking': LAB_PERMISSIONS.MANAGE_ORDERS,
      '/lab/recollections': LAB_PERMISSIONS.MANAGE_ORDERS,
      '/lab/result-entry': LAB_PERMISSIONS.ENTER_RESULTS,
      '/lab/result-validation': LAB_PERMISSIONS.VALIDATE_RESULTS,
      '/lab/report-generation': LAB_PERMISSIONS.ISSUE_REPORTS,
      '/lab/report-history': LAB_PERMISSIONS.VIEW_REPORTS,
      '/lab/patient-reports': LAB_PERMISSIONS.VIEW_REPORTS,
      '/lab/staff': LAB_PERMISSIONS.MANAGE_STAFF,
      '/lab/billing': LAB_PERMISSIONS.VIEW_BILLING,
      '/lab/analytics': LAB_PERMISSIONS.VIEW_ANALYTICS,
    };

    const requiredPerm = routePermissions[currentPath];
    if (requiredPerm && !hasLabPermission(labUser, requiredPerm)) {
      const roleTitle = labUser.labRole
        ? LAB_ROLE_DETAILS[labUser.labRole]?.label || formatTitleCase(labUser.labRole)
        : 'Laboratory Staff';

      return {
        authorized: false,
        reason: `Your account (${roleTitle}) is not authorized to access this module. Direct URL access is restricted.`
      };
    }

    return { authorized: true };
  }, [labUser, pathname]);

  const roleLabel = useMemo(() => {
    if (labUser?.labRole && LAB_ROLE_DETAILS[labUser.labRole]) {
      return LAB_ROLE_DETAILS[labUser.labRole].label;
    }
    if (isLabAdmin(labUser)) {
      return 'Lab Administrator / Director';
    }
    return formatTitleCase(labUser?.role || 'Lab Staff');
  }, [labUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const displayName = formatTitleCase(labUser?.labName || labUser?.name || 'Diagnostic Laboratory');
  const initial = (displayName || 'L').charAt(0).toUpperCase();

  return (
    <div className="lab-portal min-h-screen bg-[#f8fafc] text-slate-800 overflow-x-clip scroll-pt-20">
      {/* Global Shared Toast Container for Lab Account */}
      <Toaster
        position="top-right"
        gutter={10}
        containerStyle={{
          top: 76,
          right: 20,
          zIndex: 99999
        }}
        toastOptions={{
          duration: 4000,
          style: {
            zIndex: 99999,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            borderRadius: '0.75rem',
            fontSize: '0.8125rem',
            fontWeight: '500',
          }
        }}
      />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop / Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center px-6 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-sm">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">ClinicPro</h1>
              <p className="text-[11px] font-semibold text-teal-600 uppercase tracking-wider">Diagnostic Lab</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
          {navSections.map((section, sIdx) => (
            <div key={section.title || sIdx} className="space-y-1">
              {section.title !== 'Core' && (
                <div className="pt-2 pb-1 px-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {section.title}
                  </p>
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                if (item.active && item.href) {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-teal-50 text-teal-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mr-2.5 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                }

                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 cursor-not-allowed select-none group hover:bg-slate-50/60"
                    title={`${item.label} (Coming Soon in next phase)`}
                  >
                    <div className="flex items-center min-w-0">
                      <Icon className="w-3.5 h-3.5 mr-2.5 text-slate-300 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60 uppercase tracking-wider ml-1.5 flex-shrink-0">
                      Soon
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User profile footer */}
        <div className="p-4 border-t border-slate-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              {labUser?.logo ? (
                <img
                  src={labUser.logo}
                  alt={displayName}
                  className="w-9 h-9 rounded-full object-contain p-0.5 border border-teal-200 bg-white shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm shrink-0">
                  {initial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 truncate" title={displayName}>
                  {displayName}
                </p>
                <p className="text-[11px] text-teal-600 font-medium truncate" title={roleLabel}>
                  {roleLabel}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-xs">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors mr-3"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Lab Operations Dashboard</h2>
              <p className="text-[11px] text-slate-400 hidden sm:block">Diagnostic orders, processing & reports</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 p-1.5 hover:bg-slate-100 rounded-xl transition-colors"
              >
                {labUser?.logo ? (
                  <img
                    src={labUser.logo}
                    alt={displayName}
                    className="w-8 h-8 rounded-full object-contain p-0.5 border border-teal-200 bg-white"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                    {initial}
                  </div>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-800 truncate">{displayName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{labUser?.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                      {roleLabel}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {!routeAuthorization.authorized ? (
            <div className="max-w-xl mx-auto my-16 bg-white rounded-2xl border border-rose-100 shadow-sm p-8 text-center animate-in fade-in duration-200">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                403 Forbidden
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-3">Access Denied</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed max-w-md mx-auto">
                {routeAuthorization.reason}
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  href="/lab"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
