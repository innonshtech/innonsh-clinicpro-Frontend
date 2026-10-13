'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import {
  Sparkles,
  BedDouble,
  LogOut,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Building2,
  Clock,
  Search,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function HousekeepingDashboardPage() {
  const router = useRouter();

  const [userData, setUserData] = useState(null);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userStr || !token) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'housekeeping' && user.role !== 'admin' && user.role !== 'clinic') {
        router.push('/login');
        return;
      }
      setUserData(user);
      fetchBeds(user);
    } catch (err) {
      console.error('Error parsing user session:', err);
      router.push('/login');
    }
  }, []);

  const fetchBeds = async (user) => {
    setLoading(true);
    const clinicId = user.clinicId || user.clinic_id || user.clinic?.id;

    if (!clinicId) {
      setNotification({ type: 'error', message: 'Clinic association missing' });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/hierarchy?clinicId=${clinicId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBeds(data.data?.beds || []);
      } else {
        setNotification({ type: 'error', message: data.message || 'Failed to load bed inventory' });
      }
    } catch (err) {
      console.error('Error fetching beds:', err);
      setNotification({ type: 'error', message: 'Failed to load bed cleaning tasks' });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCleaned = async (bed) => {
    const clinicId = userData?.clinicId || userData?.clinic_id || userData?.clinic?.id;
    setActionLoading(prev => ({ ...prev, [bed.id]: true }));
    setNotification({ type: '', message: '' });

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/beds/${bed.id}/mark-cleaned`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ clinicId })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to complete cleaning action');
      }

      setNotification({
        type: 'success',
        message: `Bed ${bed.bed_number} cleaned and sanitized. Bed is now AVAILABLE for new patient admissions!`
      });

      await fetchBeds(userData);
    } catch (err) {
      console.error('Error marking bed cleaned:', err);
      setNotification({ type: 'error', message: err.message || 'Failed to mark bed cleaned' });
    } finally {
      setActionLoading(prev => ({ ...prev, [bed.id]: false }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Beds in CLEANING state
  const cleaningBeds = beds.filter(b => b.status === 'CLEANING');
  const availableBeds = beds.filter(b => b.status === 'AVAILABLE');

  const filteredCleaningBeds = cleaningBeds.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const bNum = (b.bed_number || '').toLowerCase();
    const wName = (b.wardName || '').toLowerCase();
    const rNum = (b.roomNumber || '').toLowerCase();
    return bNum.includes(q) || wName.includes(q) || rNum.includes(q);
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <RefreshCw className="h-8 w-8 text-amber-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading housekeeping tasks...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Sparkles className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-none">ClinicPro Housekeeping</h1>
              <span className="text-xs text-slate-500 font-medium">Bed Sanitization & Hygiene Workflow</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900">
                {userData?.firstName || 'Housekeeping'} {userData?.lastName || 'Staff'}
              </p>
              <p className="text-[11px] text-slate-500">Sanitization Team</p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-rose-600 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Notification */}
        {notification.message && (
          <div
            className={`p-4 rounded-xl text-sm border flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification({ type: '', message: '' })}
              className="text-slate-400 hover:text-slate-600"
            >
              &times;
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Beds Awaiting Cleaning</p>
              <p className="text-2xl font-black text-amber-600 mt-1">{cleaningBeds.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Post-discharge sanitization required</p>
            </div>
            <span className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Sparkles className="h-6 w-6" />
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sanitized & Available Beds</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{availableBeds.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Ready for patient admissions</p>
            </div>
            <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="h-6 w-6" />
            </span>
          </div>
        </div>

        {/* Workflow Info Box */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-950">Mandatory Hospital Cleaning Workflow</h4>
            <p className="mt-0.5 text-amber-800">
              When a patient is discharged, their bed automatically transitions to <strong>CLEANING</strong> status.
              To maintain infection control standards, a bed cannot be re-admitted until Housekeeping physically sanitizes it and clicks <strong>Mark Cleaning Complete</strong> to return it to <strong>AVAILABLE</strong>.
            </p>
          </div>
        </div>

        {/* Cleaning Tasks List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Pending Bed Cleaning Tasks</h3>
              <p className="text-xs text-slate-500">Beds marked CLEANING awaiting staff hygiene completion</p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by bed #, room, or ward..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {filteredCleaningBeds.length === 0 ? (
            <div className="p-12 text-center border-t border-slate-100">
              <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-900">All beds are clean & sanitized!</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                There are currently no beds waiting for housekeeping or sanitization in this clinic.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border-t border-slate-100 -mx-5 -mb-5">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                    <th className="py-3 px-5">Bed Number</th>
                    <th className="py-3 px-5">Location Hierarchy</th>
                    <th className="py-3 px-5">Current Status</th>
                    <th className="py-3 px-5">Daily Rate</th>
                    <th className="py-3 px-5 text-right">Housekeeping Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCleaningBeds.map((bed) => {
                    const isBusy = actionLoading[bed.id];

                    return (
                      <tr key={bed.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <span className="p-2 bg-amber-100 text-amber-800 rounded-lg font-bold text-xs">
                              {bed.bed_number}
                            </span>
                            <div>
                              <span className="font-bold text-slate-900 text-xs block">
                                Bed {bed.bed_number}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                Bed Type: Standard IPD
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-5 text-xs text-slate-700">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-800">
                              {bed.wardName || 'Ward'} • Room {bed.roomNumber || 'N/A'}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Floor {bed.floorNumber || '1'} • {bed.buildingName || 'Main Hospital'}
                            </p>
                          </div>
                        </td>

                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Sparkles className="h-3 w-3" />
                            CLEANING REQUIRED
                          </span>
                        </td>

                        <td className="py-3.5 px-5 text-xs font-medium text-slate-600">
                          ₹{bed.daily_rate}/day
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          <button
                            disabled={isBusy}
                            onClick={() => handleMarkCleaned(bed)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all disabled:opacity-60"
                          >
                            {isBusy ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                Mark Cleaning Complete
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
