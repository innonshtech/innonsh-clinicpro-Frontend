'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  CheckCircle,
  Activity,
  User,
  ChevronRight,
  ArrowRight,
  Play,
  RefreshCw,
  Stethoscope,
  AlertCircle
} from 'lucide-react';
import { API_BASE_URL } from '@/utils/api';

const DoctorMainDashboard = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userId, setUserId] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [queue, setQueue] = useState({ current: null, next: null, waitingList: [] });
  const [stats, setStats] = useState({ total: 0, waiting: 0, completed: 0 });
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const data = JSON.parse(userStr);
        setUserId(data?.id || data?._id || '');
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const fetchData = async (showRefreshSpinner = false) => {
    if (!userId) return;
    if (showRefreshSpinner) setIsRefreshing(true);
    try {
      const token = localStorage.getItem('token')?.trim();
      const headers = { Authorization: `Bearer ${token}` };

      // Parallel Fetching
      const [queueRes, apptRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/queue/${userId}`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/doctor/appointments`, { headers })
      ]);

      let queueJson = { success: false };
      let apptJson = { success: false };

      try {
        if (queueRes.ok) queueJson = await queueRes.json();
      } catch (e) {
        console.error('Queue Parse Error', e);
      }

      try {
        if (apptRes.ok) apptJson = await apptRes.json();
      } catch (e) {
        console.error('Appointment Parse Error', e);
      }

      if (queueJson.success && queueJson.data) {
        setQueue(queueJson.data);
      }

      if (apptJson.success) {
        const allAppts = apptJson.data || [];
        setAppointments(allAppts);

        // Calculate simple stats
        setStats({
          total: allAppts.length,
          waiting: allAppts.filter((a) => a.status === 'checked_in' || a.status === 'checkedIn').length,
          completed: allAppts.filter((a) => a.status === 'completed').length
        });
      }

      const now = new Date();
      setLastUpdated(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    } catch (error) {
      console.error('Dashboard Fetch Error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchData();
      const interval = setInterval(() => fetchData(false), 60000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  // Robust patient name resolution helper
  const getPatientName = (app) => {
    if (app.patient_name && app.patient_name.trim() && app.patient_name !== 'Unknown Patient') {
      return app.patient_name.trim();
    }
    if (typeof app.patientId === 'object' && app.patientId) {
      const name = `${app.patientId.first_name || ''} ${app.patientId.last_name || ''}`.trim();
      if (name) return name;
    }
    if (app.patients) {
      const name = `${app.patients.first_name || ''} ${app.patients.last_name || ''}`.trim();
      if (name) return name;
    }
    if (app.patientName && app.patientName.trim()) {
      return app.patientName.trim();
    }
    return 'Patient';
  };

  // Status badge helper
  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase().replace(/_/g, ' ');
    if (s === 'in progress') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          In Progress
        </span>
      );
    }
    if (s === 'checked in' || s === 'checkedin') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Waiting
        </span>
      );
    }
    if (s === 'completed') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Completed
        </span>
      );
    }
    if (s === 'cancelled') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        Scheduled
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center max-w-7xl mx-auto">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-semibold text-slate-700">Synchronizing Clinical Data...</p>
        <p className="text-xs text-slate-400 mt-1">Retrieving queue tokens and today's schedule</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER SECTION (Consistent with Lab Orders design)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 mb-1">
            <Activity className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Clinical Practice Overview</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Doctor Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Real-time overview of today's schedule, waiting queue, and active consultations.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="font-medium">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {lastUpdated ? ` • ${lastUpdated}` : ''}
            </span>
          </div>

          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Refresh Queue and Schedule"
            aria-label="Refresh Dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SUMMARY METRIC CARDS (3 Cards: Total, Waiting, Completed)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Card 1: Total Appointments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Appointments
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/60">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.total}
            </span>
            <span className="text-xs text-slate-500 font-medium">scheduled</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            All OPD appointments booked for today
          </p>
        </div>

        {/* Card 2: In Waiting Room */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              In Waiting Room
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/60">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.waiting}
            </span>
            <span className="text-xs text-amber-700 font-medium">in queue</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Checked-in patients waiting for consultation
          </p>
        </div>

        {/* Card 3: Completed Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Completed Today
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/60">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.completed}
            </span>
            <span className="text-xs text-emerald-700 font-medium">concluded</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Consultations documented &amp; completed
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. ACTIVE CONSULTATION & NEXT IN LINE SECTION
      ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="text-blue-600 w-4 h-4" />
            <span>Active Consultation</span>
          </h2>

          {queue.current && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Session Active
            </span>
          )}
        </div>

        {queue.current ? (
          <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-md flex flex-col items-center justify-center border border-white/30 shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Queue</span>
                  <span className="text-xl sm:text-2xl font-black leading-tight">
                    #{queue.current.queueNumber || queue.current.queue_number || '1'}
                  </span>
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 text-blue-100 text-xs font-semibold uppercase tracking-wider mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Currently in Consultation Room</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                    {queue.current.patientName || queue.current.patient_name || 'Patient'}
                  </h3>
                  <p className="text-blue-100 text-xs sm:text-sm mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>ID: <span className="font-mono">{queue.current.patientId || queue.current.patient_id || 'N/A'}</span></span>
                    {queue.current.timeSlot && (
                      <>
                        <span>•</span>
                        <span>Slot: {queue.current.timeSlot}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push(`/doctor-dashboard/consultation/${queue.current.appointmentId || queue.current.id}`)}
                className="px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all inline-flex items-center gap-2 shrink-0 cursor-pointer self-stretch sm:self-auto justify-center"
              >
                <Play className="w-4 h-4 fill-blue-700" />
                <span>Resume Consult</span>
              </button>
            </div>
          </div>
        ) : (
          /* Compact & Useful Empty State */
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
                <Stethoscope className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">No active consultation in progress</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pick the next patient from your waiting room or schedule to begin consultation.
                </p>
              </div>
            </div>

            {queue.next ? (
              <button
                type="button"
                onClick={() => router.push(`/doctor-dashboard/consultation/${queue.next.appointmentId || queue.next.id}`)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start Next: {queue.next.patientName}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push('/doctor-dashboard/appointments')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Open OPD Queue</span>
              </button>
            )}
          </div>
        )}

        {/* Next in Line Card (if queue.next and queue.current both active) */}
        {queue.next && queue.current && (
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-200">
                #{queue.next.queueNumber || 'Next'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Next in Line</span>
                  <span className="text-xs text-emerald-600">• Ready in Waiting Room</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">{queue.next.patientName}</h4>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push(`/doctor-dashboard/consultation/${queue.next.appointmentId}`)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shrink-0 self-end sm:self-auto"
            >
              <span>Consult Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. TODAY'S SCHEDULE SECTION
      ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <h2 className="text-base font-bold text-slate-900">Today's Schedule</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
              {appointments.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => router.push('/doctor-dashboard/appointments')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>View All Appointments</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {appointments.length === 0 ? (
            <div className="py-14 text-center px-4">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-2 border border-slate-100">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">No appointments scheduled for today</h3>
              <p className="text-xs text-slate-400 mt-0.5 max-w-sm mx-auto">
                Patient bookings and walk-ins registered by reception will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-100/90 text-slate-900 text-xs font-bold uppercase tracking-wider border-b border-slate-300">
                  <tr>
                    <th className="py-3 px-4 sm:px-6 font-bold">Time Slot</th>
                    <th className="py-3 px-4 font-bold">Patient</th>
                    <th className="py-3 px-4 font-bold">Patient ID</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 text-right font-bold sm:pr-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {appointments.slice(0, 6).map((appt, idx) => {
                    const patientName = getPatientName(appt);
                    const patientCode = appt.patient_code || appt.patientCode || (appt.patient_id ? `#${String(appt.patient_id).slice(-6)}` : '—');
                    const apptId = appt.appointment_id || appt.id || appt._id;

                    return (
                      <tr
                        key={apptId || idx}
                        onClick={() => router.push(`/doctor-dashboard/consultation/${apptId}`)}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                          <span className="font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {appt.time_slot || 'Today'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors block">
                                {patientName}
                              </span>
                              {appt.is_emergency && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  EMERGENCY
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-500">
                          {patientCode}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getStatusBadge(appt.status)}
                        </td>

                        <td className="py-3.5 px-4 sm:pr-6 text-right whitespace-nowrap">
                          <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-700 group-hover:underline inline-flex items-center gap-1">
                            <span>Open</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorMainDashboard;
