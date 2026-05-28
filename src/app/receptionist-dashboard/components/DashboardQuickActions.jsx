'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import {
  UserPlus,
  IndianRupee,
  ChevronRight,
  CalendarPlus
} from 'lucide-react';

const QuickActionItem = ({ title, icon: Icon, onClick, color, description }) => (
  <button
    onClick={onClick}
    className="group flex items-center justify-between p-5 bg-white border border-gray-100 rounded-3xl hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 text-left w-full"
  >
    <div className="flex items-center gap-4">
      <div className={`p-4 rounded-2xl ${color} text-white shadow-lg`}>
        <Icon size={24} />
      </div>
      <div>
        <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{title}</h4>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
    </div>
    <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
      <ChevronRight size={18} />
    </div>
  </button>
);

export default function DashboardQuickActions() {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <QuickActionItem
        title="Book Appointment"
        description="Schedule a patient consultation"
        icon={CalendarPlus}
        color="bg-indigo-600"
        onClick={() => router.push('/receptionist-dashboard/appointments/add')}
      />
      <QuickActionItem
        title="Register New Patient"
        description="Add a new patient to the medical system"
        icon={UserPlus}
        color="bg-blue-600"
        onClick={() => router.push('/receptionist-dashboard/patients/add')}
      />
      <QuickActionItem
        title="Generate Bill"
        description="Create invoice for completed visits"
        icon={IndianRupee}
        color="bg-emerald-600"
        onClick={() => router.push('/receptionist-dashboard/Billing')}
      />
    </div>
  );
}

