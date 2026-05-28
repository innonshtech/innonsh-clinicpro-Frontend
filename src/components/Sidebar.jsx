'use client';
import { LogOut, UserPlus, LayoutDashboard, Users, Settings, Activity, BarChart } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const menuItems = [
  { name: 'Dashboard', href: '/clinic/dashboard', icon: LayoutDashboard },
  { name: 'Doctors', href: '/clinic/doctors', icon: Users },
  { name: 'Add Doctor', href: '/clinic/doctors/add', icon: UserPlus },
  { name: 'Analytics', href: '/clinic/analytics', icon: BarChart },
  { name: 'Activity', href: '/clinic/activity', icon: Activity },
  { name: 'Settings', href: '/clinic/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-screen w-64 bg-white shadow-lg px-4 py-6 flex flex-col justify-between">
      <div>
        <h1 className="text-2xl font-bold text-purple-600 mb-8">HealthByte</h1>
        <nav className="space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <div className={clsx(
                  'flex items-center gap-3 p-2 rounded-lg text-gray-700 transition-all',
                  pathname === item.href ? 'bg-purple-100 font-semibold' : 'hover:bg-gray-100'
                )}>
                  <Icon className="h-5 w-5" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <Link href="/signout">
        <div className="flex items-center gap-2 text-gray-700 hover:text-red-600 hover:font-semibold cursor-pointer">
          <LogOut className="h-5 w-5" />
          Sign out
        </div>
      </Link>
    </aside>
  );
}
