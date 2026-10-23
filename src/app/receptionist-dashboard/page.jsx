'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  CheckCircle2,
  IndianRupee,
  CalendarPlus,
  UserPlus,
  Receipt,
  Search,
  RefreshCw,
  UserCheck,
  ChevronRight,
  Stethoscope,
  Filter,
  AlertTriangle,
  User,
  ArrowUpRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { appointmentService } from '@/utils/appointmentService';
import { API_BASE_URL } from '@/utils/api';
import LateCheckInModal from './components/LateCheckInModal';
import RescheduleModal from './components/RescheduleModal';

// Helper to convert 12-hour slot to minutes from midnight
const parseTimeSlotToMinutes = (slotStr) => {
  if (!slotStr || typeof slotStr !== 'string') return 9999;
  const startPart = slotStr.split('-')[0].trim();
  const match = startPart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 9999;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = (match[3] || '').toUpperCase();

  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

// Sort comparator: Emergency -> Status Lifecycle -> Chronological Slot
const compareAppointments = (a, b) => {
  if (a.is_emergency && !b.is_emergency) return -1;
  if (!a.is_emergency && b.is_emergency) return 1;

  const statusRank = {
    in_progress: 1,
    checked_in: 2,
    checkedIn: 2,
    booked: 3,
    scheduled: 3,
    pending: 3,
    completed: 4,
    cancelled: 5
  };
  const rankA = statusRank[a.status] || 99;
  const rankB = statusRank[b.status] || 99;
  if (rankA !== rankB) return rankA - rankB;

  const timeA = parseTimeSlotToMinutes(a.time_slot || a.timeSlot);
  const timeB = parseTimeSlotToMinutes(b.time_slot || b.timeSlot);
  if (timeA !== timeB) return timeA - timeB;

  return 0;
};

export default function ReceptionistDashboardPage() {
  const router = useRouter();

  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    waitingCheckIn: 0,
    completedVisits: 0,
    pendingPayments: 0,
    pendingPaymentsAmount: 0
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  // Modals
  const [lateApp, setLateApp] = useState(null);
  const [reschedulingApp, setReschedulingApp] = useState(null);

  // Formatted date string for header
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const fetchDashboardData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setRefreshing(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Local today date YYYY-MM-DD
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const localToday = `${year}-${month}-${day}`;

      // 1. Fetch Today's Appointments
      const apptsPromise = appointmentService.getAppointments({
        date: localToday,
        limit: 100,
        _t: Date.now()
      }, token).catch(() => ({ success: false, data: [] }));

      // 2. Fetch Billing History for Pending Invoices Count
      const billsPromise = fetch(`${API_BASE_URL}/api/v1/billing/list?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : { success: false, data: { bills: [] } })
        .catch(() => ({ success: false, data: { bills: [] } }));

      const [apptsRes, billsRes] = await Promise.all([apptsPromise, billsPromise]);

      const rawAppts = apptsRes.data?.appointments || (Array.isArray(apptsRes.data) ? apptsRes.data : []);
      const sortedAppts = [...rawAppts].sort(compareAppointments);
      setAppointments(sortedAppts);

      // Aggregate Stats
      const todayCount = sortedAppts.length;
      const waitingCount = sortedAppts.filter(a =>
        ['booked', 'scheduled', 'pending'].includes((a.status || '').toLowerCase())
      ).length;
      const completedCount = sortedAppts.filter(a =>
        (a.status || '').toLowerCase() === 'completed'
      ).length;

      const rawBills = billsRes.data?.bills || [];
      const pendingBills = rawBills.filter(b => {
        const s = (b.rawStatus || b.status || '').toLowerCase();
        if (s === 'paid' || s === 'cancelled' || s === 'void') return false;
        const rem = Number(b.remaining_amount ?? b.remainingAmount ?? (b.final_amount ?? b.finalAmount ?? 0));
        return s === 'pending' || s === 'partially_paid' || rem > 0;
      });

      const pendingAmount = pendingBills.reduce((acc, b) => {
        const rem = Number(b.remaining_amount ?? b.remainingAmount ?? (b.final_amount ?? b.finalAmount ?? 0));
        return acc + rem;
      }, 0);

      setStats({
        todayAppointments: todayCount,
        waitingCheckIn: waitingCount,
        completedVisits: completedCount,
        pendingPayments: pendingBills.length,
        pendingPaymentsAmount: pendingAmount
      });
    } catch (err) {
      console.error('Error fetching receptionist dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchDashboardData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Check-In Action
  const handleCheckIn = async (appointmentId, strategy = null) => {
    const app = appointments.find(a => (a._id || a.id) === appointmentId);
    if (!app) return;

    // Detect late check-in if slot has passed
    if (!strategy && (app.time_slot || app.timeSlot)) {
      try {
        const slotPart = (app.time_slot || app.timeSlot).split('-')[0].trim();
        const slotMinutes = parseTimeSlotToMinutes(slotPart);
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        if (currentMinutes > slotMinutes + 15) {
          setLateApp(app);
          return;
        }
      } catch (_) {}
    }

    setActionLoading(appointmentId);
    try {
      const token = localStorage.getItem('token');
      const res = await appointmentService.checkIn(appointmentId, token, strategy);
      if (res.success) {
        const queueNum = res.data?.queueNumber || res.data?.queue_number || res.data?.queue || '';
        toast.success(`Patient checked in! Queue #${queueNum || 'Assigned'}`);
        setLateApp(null);
        await fetchDashboardData(true);
      } else {
        toast.error(res.message || 'Check-in failed');
      }
    } catch (err) {
      toast.error(err.message || 'Check-in request failed');
    } finally {
      setActionLoading(null);
    }
  };

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      const pName = (
        app.patient_name ||
        `${app.patients?.first_name || app.patientId?.firstName || ''} ${app.patients?.last_name || app.patientId?.lastName || ''}`
      ).toLowerCase();

      const pCode = (
        app.patients?.patient_code ||
        app.patientId?.patientCode ||
        app.patient_code ||
        ''
      ).toLowerCase();

      const dName = (
        app.doctor_name ||
        `Dr. ${app.doctors?.first_name || app.doctorId?.firstName || ''} ${app.doctors?.last_name || app.doctorId?.lastName || ''}`
      ).toLowerCase();

      const term = searchTerm.trim().toLowerCase();
      const matchesSearch = !term || pName.includes(term) || pCode.includes(term) || dName.includes(term);

      const st = (app.status || '').toLowerCase();
      let matchesStatus = true;
      if (statusFilter === 'waiting') {
        matchesStatus = ['booked', 'scheduled', 'pending'].includes(st);
      } else if (statusFilter === 'checked_in') {
        matchesStatus = ['checked_in', 'checkedin'].includes(st);
      } else if (statusFilter === 'completed') {
        matchesStatus = st === 'completed';
      }

      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, statusFilter]);

  // Helper for Status Badges
  const renderStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'checked_in':
      case 'checkedin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
            Checked In
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></span>
            In Consultation
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Cancelled
          </span>
        );
      case 'booked':
      case 'scheduled':
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
            <Clock className="w-3 h-3 text-amber-600" />
            Waiting Check-in
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} />

      {/* ─────────────────────────────────────────────────────────
         1. TOP HEADER BAR
      ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Front Desk Operations</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Receptionist Dashboard</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Real-time patient check-ins, appointments flow, and cashier billing overview.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200/70 rounded-xl text-xs font-medium text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>{todayFormatted}</span>
          </div>

          <button
            type="button"
            id="btn-refresh-dashboard"
            onClick={() => fetchDashboardData()}
            className="inline-flex items-center justify-center p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline ml-1.5">Refresh</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
         2. EXACT 4 SUMMARY CARDS
      ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Appointments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs transition-all hover:border-blue-300 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Appointments</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '—' : stats.todayAppointments}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span>Total patients scheduled</span>
            </p>
          </div>
        </div>

        {/* Card 2: Waiting for Check-in */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs transition-all hover:border-amber-300 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Waiting for Check-in</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '—' : stats.waitingCheckIn}
            </div>
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1 font-medium">
              <span>Pending patient arrival</span>
            </p>
          </div>
        </div>

        {/* Card 3: Completed Visits */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs transition-all hover:border-emerald-300 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Visits</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '—' : stats.completedVisits}
            </div>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
              <span>Consultations finished</span>
            </p>
          </div>
        </div>

        {/* Card 4: Pending Payments */}
        <div 
          onClick={() => router.push('/receptionist-dashboard/Billing')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm cursor-pointer group"
          title="Click to view pending invoices"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Payments</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-baseline justify-between">
              <span>{loading ? '—' : stats.pendingPayments}</span>
              <span className="text-xs font-semibold text-indigo-600 flex items-center gap-0.5 group-hover:underline">
                View <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span>Awaiting cashier payment</span>
            </p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
         3. MAIN CONTENT: TODAY'S APPOINTMENTS & QUICK ACTIONS
      ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Today's Appointments Table (8 cols on lg, 9 cols on xl) */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Card Header & Search */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/40">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Today's Appointments</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200/60">
                  {filteredAppointments.length}
                </span>
              </h2>
            </div>

            {/* Search and Status Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  id="input-search-appointments"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search patient, code, doctor..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Status Tab Filter */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/60 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('waiting')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    statusFilter === 'waiting'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Waiting
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('checked_in')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    statusFilter === 'checked_in'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Checked In
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('completed')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    statusFilter === 'completed'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/70 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Time Slot</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading && appointments.length === 0 ? (
                  [1, 2, 3, 4].map(idx => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100" />
                          <div className="space-y-1.5">
                            <div className="h-3 w-28 bg-slate-100 rounded" />
                            <div className="h-2 w-16 bg-slate-100 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-3 w-24 bg-slate-100 rounded mb-1" />
                        <div className="h-2 w-14 bg-slate-100 rounded" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-3 w-16 bg-slate-100 rounded" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-5 w-20 bg-slate-100 rounded-full" />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="h-7 w-20 bg-slate-100 rounded-xl ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-14 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-100">
                        <Search className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">No appointments found</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        {searchTerm
                          ? `No appointments match "${searchTerm}".`
                          : statusFilter === 'waiting'
                          ? 'No patients are currently waiting for check-in.'
                          : statusFilter === 'checked_in'
                          ? 'No checked-in patients are waiting for consultation.'
                          : statusFilter === 'completed'
                          ? 'No appointments completed yet today.'
                          : 'There are no appointments scheduled for today.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map(app => {
                    const appId = app._id || app.id;
                    const patientName = (
                      app.patient_name ||
                      `${app.patients?.first_name || app.patientId?.firstName || ''} ${app.patients?.last_name || app.patientId?.lastName || ''}`
                    ).trim() || 'Patient';

                    const patientCode = (
                      app.patients?.patient_code ||
                      app.patientId?.patientCode ||
                      app.patient_code ||
                      (app.patient_id ? `#${String(app.patient_id).slice(-6)}` : 'N/A')
                    );

                    const doctorName = (
                      app.doctor_name ||
                      `Dr. ${app.doctors?.first_name || app.doctorId?.firstName || ''} ${app.doctors?.last_name || app.doctorId?.lastName || ''}`
                    ).trim() || 'Dr. Assigned';

                    const specialty = app.doctors?.specialty || app.doctorId?.specialization || 'Consultant';
                    const timeSlot = app.time_slot || app.timeSlot || 'Regular Slot';
                    const queueNum = app.queue_number || app.queueNumber;
                    const isWaiting = ['booked', 'scheduled', 'pending'].includes((app.status || '').toLowerCase());
                    const isCheckedIn = ['checked_in', 'checkedin'].includes((app.status || '').toLowerCase());
                    const isCompleted = (app.status || '').toLowerCase() === 'completed';

                    return (
                      <tr
                        key={appId}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* 1. Patient */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100">
                              {patientName[0]?.toUpperCase() || 'P'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">
                                {patientName}
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                                <span>{patientCode}</span>
                                {app.is_emergency && (
                                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1 rounded border border-rose-200">
                                    EMERGENCY
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Doctor */}
                        <td className="py-3.5 px-4">
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 truncate">
                              {doctorName}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {specialty}
                            </p>
                          </div>
                        </td>

                        {/* 3. Time Slot */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{timeSlot}</span>
                          </div>
                          {queueNum && (
                            <span className="text-[10px] font-semibold text-blue-600">
                              Queue #{queueNum}
                            </span>
                          )}
                        </td>

                        {/* 4. Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {renderStatusBadge(app.status)}
                        </td>

                        {/* 5. Action */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {isWaiting ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                id={`btn-checkin-${appId}`}
                                disabled={actionLoading === appId}
                                onClick={() => handleCheckIn(appId)}
                                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                              >
                                {actionLoading === appId ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <UserCheck className="w-3.5 h-3.5" />
                                )}
                                <span>Check-in</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setReschedulingApp(app)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Reschedule appointment"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : isCheckedIn ? (
                            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-100 inline-flex items-center gap-1">
                              <Check className="w-3 h-3" /> Waiting Doctor
                            </span>
                          ) : isCompleted ? (
                            <button
                              type="button"
                              onClick={() => router.push('/receptionist-dashboard/Billing')}
                              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 inline-flex items-center gap-1 transition-colors"
                              title="Go to billing"
                            >
                              <Receipt className="w-3 h-3" /> View Bill
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: Compact Quick Actions Panel (4 cols on lg, 3 cols on xl) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Quick Actions</h3>
              <p className="text-xs text-slate-500 mt-0.5">Primary reception tasks</p>
            </div>

            <div className="space-y-3">
              {/* Action 1: Book Appointment */}
              <button
                type="button"
                id="btn-quick-book-appointment"
                onClick={() => router.push('/receptionist-dashboard/appointments/add')}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-blue-50/60 border border-slate-200/70 hover:border-blue-200 rounded-xl transition-all duration-200 text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <CalendarPlus className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      Book Appointment
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      Schedule a patient consultation
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

              {/* Action 2: Register New Patient */}
              <button
                type="button"
                id="btn-quick-register-patient"
                onClick={() => router.push('/receptionist-dashboard/patients/add')}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-emerald-50/60 border border-slate-200/70 hover:border-emerald-200 rounded-xl transition-all duration-200 text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      Register New Patient
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      Create a new patient record
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

              {/* Action 3: Generate Bill */}
              <button
                type="button"
                id="btn-quick-generate-bill"
                onClick={() => router.push('/receptionist-dashboard/Billing')}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-indigo-50/60 border border-slate-200/70 hover:border-indigo-200 rounded-xl transition-all duration-200 text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      Generate Bill
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      Invoices &amp; cashier payments
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>
            </div>
          </div>

          {/* Compact Helpful Navigation Card */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Front Desk Directory</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={() => router.push('/receptionist-dashboard/patients')}
                className="w-1/2 py-2 px-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-semibold text-center transition-colors truncate"
              >
                View Patients
              </button>
              <button
                type="button"
                onClick={() => router.push('/receptionist-dashboard/appointments')}
                className="w-1/2 py-2 px-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-semibold text-center transition-colors truncate"
              >
                Appointments
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
         4. LATE CHECK-IN & RESCHEDULE MODALS (Preserved)
      ───────────────────────────────────────────────────────── */}
      {lateApp && (
        <LateCheckInModal
          patientName={
            lateApp.patient_name ||
            `${lateApp.patients?.first_name || lateApp.patientId?.firstName || ''} ${lateApp.patients?.last_name || lateApp.patientId?.lastName || ''}`.trim()
          }
          onSelect={(strategy) => handleCheckIn(lateApp._id || lateApp.id, strategy)}
          onClose={() => setLateApp(null)}
        />
      )}

      {reschedulingApp && (
        <RescheduleModal
          appointment={reschedulingApp}
          onClose={() => setReschedulingApp(null)}
          onRescheduled={() => fetchDashboardData(true)}
        />
      )}
    </div>
  );
}
