'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  IndianRupee,
  TrendingUp
} from 'lucide-react';
import { appointmentService } from '@/utils/appointmentService';
import { API_BASE_URL } from '@/utils/api';

export default function DashboardStats() {
  const router = useRouter();
  const [stats, setStats] = useState({
    todayAppointments: 0,
    dailyRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    // We don't want to show the loader every time it refreshes in the background
    // only on the first load.
    try {
      // Use localStorage directly to avoid null token on initial render from useAuth context
      const token = localStorage.getItem('token');
      if (!token) return; // Not logged in yet, skip fetch

      // Fix: Use local date string YYYY-MM-DD instead of UTC to avoid timezone shifts
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const localToday = `${year}-${month}-${day}`;

      // Parallel fetching
      // Fetch only today's appointments for bookings and follow-up stats
      const apptsRes = await appointmentService.getAppointments({ date: localToday }, token);

      const billingRes = await fetch(`${API_BASE_URL}/api/v1/billing/list?limit=1000`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => {
        if (!r.ok) return { success: false, data: { bills: [] } };
        return r.json().catch(() => ({ success: false, data: { bills: [] } }));
      });

      // Calculate Revenue (paid/partially_paid for today)
      const bills = billingRes.data?.bills || [];
      const revenue = bills
        .filter(b => {
          // Check paidAt first, then fallback to createdAt
          const billDate = b.paidAt ? new Date(b.paidAt) : new Date(b.createdAt);
          const isToday = billDate.getFullYear() === year &&
                          (billDate.getMonth() + 1) === Number(month) &&
                          billDate.getDate() === Number(day);
          const isCollected = b.status === 'paid' || b.status === 'partially_paid' || b.status === 'Paid';
          return isToday && isCollected;
        })
        .reduce((sum, b) => sum + (b.finalAmount || 0), 0);

      // Today's appointments count
      const allAppts = apptsRes.data?.appointments || [];

      // Count Follow-ups using the new 'type' field
      const followUps = allAppts.filter(a => a.type === 'follow_up').length;

      // Simplify state update to only include relevant metrics
      setStats({
        todayAppointments: allAppts.length,
        dailyRevenue: revenue
      });
    } catch (err) {
      console.error("Stats Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const StatBox = ({ title, value, icon: Icon, color, subValue, subLabel, onClick }) => (
    <div 
      onClick={onClick}
      className={`bg-white rounded-3xl p-6 border border-gray-100 shadow-sm transition-all ${onClick ? 'cursor-pointer hover:border-blue-500 hover:shadow-md active:scale-[0.98]' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${color} text-white shadow-lg shadow-${color.split('-')[1]}-200`}>
          <Icon size={24} />
        </div>
        {subValue && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase tracking-wider">
            <TrendingUp size={12} />
            {subValue}
          </div>
        )}
      </div>
      <div>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-black text-gray-900">
            {loading && stats.todayAppointments === 0 ? '...' : value}
          </h3>
          {subLabel && <span className="text-[10px] text-gray-400 font-bold">{subLabel}</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <StatBox
        title="Today's Bookings"
        value={stats.todayAppointments}
        icon={Calendar}
        color="bg-indigo-600"
        subLabel="Patients"
        onClick={() => {
          const now = new Date();
          const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          router.push(`/receptionist-dashboard/appointments?date=${localToday}`);
        }}
      />
      <StatBox
        title="Daily Revenue"
        value={`₹${stats.dailyRevenue}`}
        icon={IndianRupee}
        color="bg-emerald-600"
        subValue="Today"
        onClick={() => router.push('/receptionist-dashboard/Billing')}
      />
    </div>
  );
}
