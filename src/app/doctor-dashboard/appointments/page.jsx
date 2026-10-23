'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/utils/api';
import {
  Calendar,
  Clock,
  Search,
  CheckCircle,
  X,
  Stethoscope,
  Activity,
  AlertTriangle,
  RefreshCw,
  User,
  ChevronRight,
  Filter
} from 'lucide-react';

// Chronological time slot parser converting "10:30 AM", "03:00 PM" to minutes from midnight
export const parseTimeSlotToMinutes = (slotStr) => {
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

// Unified doctor appointment comparator (Emergencies -> Status lifecycle -> Time Slot)
export const compareDoctorAppointments = (a, b) => {
  // 1. Emergency prioritization: Emergency patients always float to top
  if (a.is_emergency && !b.is_emergency) return -1;
  if (!a.is_emergency && b.is_emergency) return 1;

  // 2. Appointment status lifecycle ordering
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

  // 3. For checked_in / in_progress patients: if clinic issued queue_number exists, order by it
  if (rankA <= 2 && a.queue_number && b.queue_number && a.queue_number !== b.queue_number) {
    return a.queue_number - b.queue_number;
  }

  // 4. Chronological time-slot ordering (earlier slots strictly precede later slots)
  const timeA = parseTimeSlotToMinutes(a.time_slot);
  const timeB = parseTimeSlotToMinutes(b.time_slot);
  if (timeA !== timeB) return timeA - timeB;

  // 5. Tie-breaker by queue_number or ID
  const qA = a.queue_number || 9999;
  const qB = b.queue_number || 9999;
  if (qA !== qB) return qA - qB;

  return String(a.appointment_id || a.id || '').localeCompare(String(b.appointment_id || b.id || ''));
};

const DoctorAppointmentsDashboard = () => {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setId] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const data = JSON.parse(user);
        setId(data?.id || data?._id || '');
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const fetchDailyAppointments = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token')?.trim();
      const res = await fetch(`${API_BASE_URL}/api/v1/doctor/appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const responseData = await res.json();

      if (responseData.success) {
        setAppointments(responseData.data || []);
      } else {
        console.error('Failed to fetch appointments:', responseData.message);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchDailyAppointments();
    }
  }, [userId]);

  // Robust patient name resolution fallback
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

  // Compute normalized appointments with guaranteed continuous sequential queue numbering (no skips or duplicates)
  const normalizedAppointments = useMemo(() => {
    const sorted = [...appointments].sort(compareDoctorAppointments);

    return sorted.map((app, index) => ({
      ...app,
      sequential_queue: index + 1,
      displayName: getPatientName(app),
      displayCode: app.patient_code || app.patientId?.patient_code || (app.patient_id ? `#${String(app.patient_id).slice(-6)}` : 'N/A')
    }));
  }, [appointments]);

  // Tab counts
  const counts = useMemo(() => {
    const all = normalizedAppointments.length;
    const waiting = normalizedAppointments.filter(
      (a) => a.status === 'checked_in' || a.status === 'checkedIn'
    ).length;
    const inProgress = normalizedAppointments.filter((a) => a.status === 'in_progress').length;
    const completed = normalizedAppointments.filter((a) => a.status === 'completed').length;
    const scheduled = normalizedAppointments.filter(
      (a) => a.status === 'scheduled' || a.status === 'booked' || a.status === 'pending'
    ).length;

    return { all, waiting, inProgress, completed, scheduled };
  }, [normalizedAppointments]);

  // Filtered appointments by search term & active tab
  const filteredAppointments = useMemo(() => {
    return normalizedAppointments.filter((app) => {
      // Search matching
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const nameMatches = app.displayName.toLowerCase().includes(query);
        const codeMatches = app.displayCode.toLowerCase().includes(query);
        const slotMatches = (app.time_slot || '').toLowerCase().includes(query);
        if (!nameMatches && !codeMatches && !slotMatches) return false;
      }

      // Tab matching
      if (activeTab === 'all') return true;
      if (activeTab === 'waiting') return app.status === 'checked_in' || app.status === 'checkedIn';
      if (activeTab === 'in_progress') return app.status === 'in_progress';
      if (activeTab === 'completed') return app.status === 'completed';
      if (activeTab === 'scheduled') {
        return app.status === 'scheduled' || app.status === 'booked' || app.status === 'pending';
      }

      return true;
    });
  }, [normalizedAppointments, searchTerm, activeTab]);

  // Status badge matching Lab Orders design system
  const getStatusBadge = (status) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-spin"></span>
            In Consultation
          </span>
        );
      case 'checked_in':
      case 'checkedIn':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            Waiting Room
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-purple-600" />
            Completed
          </span>
        );
      case 'scheduled':
      case 'booked':
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Scheduled
          </span>
        );
    }
  };

  const getActiveTabTitle = () => {
    switch (activeTab) {
      case 'waiting':
        return 'Waiting Room Patients';
      case 'in_progress':
        return 'Active Consultations';
      case 'completed':
        return 'Completed Consultations';
      case 'scheduled':
        return 'Scheduled Appointments';
      case 'all':
      default:
        return "Today's Patient Queue";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ─────────────────────────────────────────────────────────────
         1. CLEAN HEADER CARD (Consistent with Lab Orders design system)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 mb-1">
            <Calendar className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Doctor OPD Queue</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Today's Appointments</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage today's patient queue, track waiting room arrivals, and start consultations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-refresh-doctor-queue"
            onClick={fetchDailyAppointments}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            title="Refresh appointments list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
         2. SEARCH & FILTER BAR (Matching Lab Orders Search / Tabs)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-appointments"
              type="text"
              placeholder="Search patients by name, patient code, or slot time..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              id="tab-all-appointments"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>All Today</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-600 font-bold">
                {counts.all}
              </span>
            </button>

            <button
              id="tab-waiting-appointments"
              onClick={() => setActiveTab('waiting')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'waiting'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span>Waiting Room</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-blue-100 text-blue-800 font-bold">
                {counts.waiting}
              </span>
            </button>

            <button
              id="tab-inprogress-appointments"
              onClick={() => setActiveTab('in_progress')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'in_progress'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-spin"></span>
              <span>In Consultation</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-800 font-bold">
                {counts.inProgress}
              </span>
            </button>

            <button
              id="tab-scheduled-appointments"
              onClick={() => setActiveTab('scheduled')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'scheduled'
                  ? 'bg-slate-200 text-slate-800 border border-slate-300'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Scheduled</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-600 font-bold">
                {counts.scheduled}
              </span>
            </button>

            <button
              id="tab-completed-appointments"
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'completed'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 text-purple-600" />
              <span>Completed</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-purple-100 text-purple-800 font-bold">
                {counts.completed}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
         3. APPOINTMENTS LIST / CARDS (Consistent with Lab Orders Table Card)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">{getActiveTabTitle()}</h3>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              {filteredAppointments.length} {filteredAppointments.length === 1 ? 'patient' : 'patients'}
            </span>
          </div>
        </div>

        {/* Content list */}
        <div className="divide-y divide-slate-100">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => {
              const isInProgress = appointment.status === 'in_progress';
              const isCheckedIn = appointment.status === 'checked_in' || appointment.status === 'checkedIn';
              const isCompleted = appointment.status === 'completed';

              return (
                <div
                  key={appointment.appointment_id}
                  className="p-4 sm:p-5 transition-colors hover:bg-slate-50/70"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Patient & Queue Token Column (5 cols) */}
                    <div className="md:col-span-5 flex items-center gap-3.5">
                      {/* Queue sequence token badge */}
                      <div className="relative shrink-0">
                        <div
                          className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold text-xs border shadow-xs ${
                            isInProgress
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isCheckedIn
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : isCompleted
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold leading-none">Queue</span>
                          <span className="text-sm font-black leading-none mt-0.5">#{appointment.sequential_queue}</span>
                        </div>
                      </div>

                      {/* Patient details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {appointment.displayName}
                          </p>
                          {appointment.displayCode && appointment.displayCode !== 'N/A' && (
                            <span className="font-mono text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 font-semibold">
                              {appointment.displayCode}
                            </span>
                          )}
                          {appointment.is_emergency && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 rounded-md border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              EMERGENCY
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Slot Time Column (2 cols) */}
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold">{appointment.time_slot || 'Regular Slot'}</span>
                      </div>
                    </div>

                    {/* Status Column (2 cols) */}
                    <div className="md:col-span-2">
                      {getStatusBadge(appointment.status)}
                    </div>

                    {/* Actions Column (3 cols) */}
                    <div className="md:col-span-3 flex items-center justify-start md:justify-end gap-2">
                      {isInProgress ? (
                        <button
                          type="button"
                          id={`btn-resume-consult-${appointment.appointment_id}`}
                          onClick={() => router.push(`/doctor-dashboard/consultation/${appointment.appointment_id}`)}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>Resume Consult</span>
                        </button>
                      ) : isCheckedIn ? (
                        <button
                          type="button"
                          id={`btn-start-consult-${appointment.appointment_id}`}
                          onClick={() => router.push(`/doctor-dashboard/consultation/${appointment.appointment_id}`)}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>Start Consult</span>
                        </button>
                      ) : isCompleted ? (
                        <button
                          type="button"
                          id={`btn-view-summary-${appointment.appointment_id}`}
                          onClick={() => router.push(`/doctor-dashboard/consultation/${appointment.appointment_id}`)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-purple-600" />
                          <span>View Summary</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          id={`btn-consult-early-${appointment.appointment_id}`}
                          onClick={() => router.push(`/doctor-dashboard/consultation/${appointment.appointment_id}`)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
                          title="Open consultation directly"
                        >
                          <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
                          <span>Consult</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No appointments found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchTerm
                  ? `No patients match the search "${searchTerm}".`
                  : activeTab === 'waiting'
                  ? 'No patients are currently in the waiting room.'
                  : activeTab === 'in_progress'
                  ? 'No consultations are currently in progress.'
                  : activeTab === 'completed'
                  ? 'No appointments have been completed yet today.'
                  : 'There are no appointments scheduled for today.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorAppointmentsDashboard;
