'use client';
import React, { useState, useEffect } from 'react';
import { Clock, User, Stethoscope, RefreshCcw, Search, Hash, CheckCircle2, PlayCircle, Loader2 } from 'lucide-react';
import { appointmentService } from '@/utils/appointmentService';
import toast from 'react-hot-toast';
import RescheduleModal from './RescheduleModal';
import LateCheckInModal from './LateCheckInModal';

export default function TodaysAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [reschedulingApp, setReschedulingApp] = useState(null);
  const [lateApp, setLateApp] = useState(null);

  const fetchTodaysAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { setLoading(false); return; } // Guard: not logged in
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const localToday = `${year}-${month}-${day}`;

      const res = await appointmentService.getAppointments({
        date: localToday,
        limit: 100,
        _t: new Date().getTime() // Cache buster
      }, token);
      if (res.success) {
        const sorted = (res.data.appointments || []).sort((a, b) => {
          if (a.queueNumber && b.queueNumber) return a.queueNumber - b.queueNumber;
          return a.timeSlot.localeCompare(b.timeSlot);
        });
        setAppointments(sorted);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (id, strategy = null) => {
    const app = appointments.find(a => a._id === id);
    if (!app) return;

    // Detect if late (only if not already providing a strategy)
    if (!strategy) {
      const [time, period] = app.timeSlot.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let slotHours = period === 'PM' && hours !== 12 ? hours + 12 : hours;
      if (period === 'AM' && hours === 12) slotHours = 0;

      const slotTime = new Date();
      slotTime.setHours(slotHours, minutes, 0, 0);

      if (new Date() > slotTime) {
        setLateApp(app);
        return;
      }
    }

    setActionLoading(id);
    try {
      const token = localStorage.getItem('token');
      const res = await appointmentService.checkIn(id, token, strategy);
      if (res.success) {
        toast.success(`Check-in complete! Queue Number: ${res.data.queueNumber || res.data.queue_number}`);
        setLateApp(null);
        // Small delay to ensure DB consistency before refresh
        setTimeout(() => {
          fetchTodaysAppointments();
        }, 500);
      }
    } catch (err) {
      toast.error(err.message || 'Check-in failed');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchTodaysAppointments();
    const interval = setInterval(fetchTodaysAppointments, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderActionButton = (app) => {
    if (actionLoading === app._id) {
      return (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 rounded-xl text-gray-400 font-bold text-xs">
          <Loader2 className="animate-spin" size={14} />
          SYNCING
        </div>
      );
    }

    switch (app.status) {
      case 'booked':
      case 'scheduled':
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCheckIn(app._id)}
              className="text-xs font-black text-white px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95"
            >
              CHECK-IN
            </button>
            <button
              onClick={() => setReschedulingApp(app)}
              className="p-3 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border border-transparent hover:border-blue-100"
              title="Reschedule"
            >
              <Clock size={18} />
            </button>
          </div>
        );
      case 'checked_in':
        return (
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100">
            <Clock size={14} className="animate-pulse" />
            CHECKED-IN
          </div>
        );
      case 'in_progress':
        return (
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs bg-indigo-50 px-4 py-2.5 rounded-xl border border-indigo-100">
            <PlayCircle size={14} className="animate-spin-slow" />
            CONSULTING
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100">
            <CheckCircle2 size={16} />
            COMPLETED
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs bg-rose-50 px-4 py-2.5 rounded-xl border border-rose-100">
            CANCELLED
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-full">
      <div className="p-7 border-b border-gray-50 bg-gray-50/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
              <Hash className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Active Patient Queue</h3>
              <p className="text-xs text-gray-400 font-medium">Real-time clinical flow monitor</p>
            </div>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              fetchTodaysAppointments();
            }}
            className="p-2.5 hover:bg-white rounded-2xl border border-transparent hover:border-gray-100 transition-all text-gray-400 hover:text-blue-600"
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-5 max-h-[600px] overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
          {loading && appointments.length === 0 ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-50 animate-pulse rounded-3xl" />
            ))
          ) : (
            <>
              {appointments.filter(app => ['checked_in', 'in_progress', 'completed'].includes(app.status)).length === 0 ? (
                <div className="text-center py-20 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                  <Search className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 font-bold text-lg tracking-tight">
                    No Active Patients
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Status: Queue is clear</p>
                </div>
              ) : (
                appointments
                  .filter(app => ['checked_in', 'in_progress', 'completed'].includes(app.status))
                  .map((app) => (

              <div
                key={app._id}
                className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-[2.5rem] hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all group relative overflow-hidden"
              >
                <div className="flex items-center gap-6">
                  {/* Queue Number Badge */}
                  <div className="w-20 h-20 bg-slate-50 text-slate-600 rounded-3xl flex flex-col items-center justify-center border border-slate-100 shadow-sm relative group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-500" />
                    <span className="text-[10px] font-black uppercase text-gray-400 mb-0.5 tracking-tighter">Queue</span>
                    <span className="text-3xl font-black leading-none text-indigo-700">
                      {app.queueNumber || '—'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-lg font-black text-gray-900 flex items-center gap-3 tracking-tight">
                      {app.patientId?.firstName} {app.patientId?.lastName}
                      {app.isEmergency && (
                        <span className="text-[9px] bg-red-600 text-white px-2.5 py-1 rounded-full font-black animate-pulse shadow-sm shadow-red-200 uppercase tracking-widest">
                          Emergency
                        </span>
                      )}
                      {app.type === 'follow_up' && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-black uppercase tracking-widest">
                          Follow-up
                        </span>
                      )}
                    </h4>

                    <div className="flex flex-wrap items-center gap-5 text-sm">
                      <div className="flex items-center gap-2 text-slate-500 font-bold">
                        <Clock size={16} className="text-gray-400" />
                        {app.timeSlot}
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-bold">
                        <div className="p-1 bg-indigo-50 rounded-lg">
                          <Stethoscope size={14} className="text-indigo-500" />
                        </div>
                        Dr. {app.doctorId?.firstName} {app.doctorId?.lastName}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pr-4">
                  {renderActionButton(app)}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  </div>

      <div className="p-5 bg-gray-50/50 border-t border-gray-100 text-center">
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">
          Live clinic throughput: {appointments.length} active records
        </p>
      </div>

      {reschedulingApp && (
        <RescheduleModal 
          appointment={reschedulingApp} 
          onClose={() => setReschedulingApp(null)} 
          onRescheduled={fetchTodaysAppointments}
        />
      )}

      {lateApp && (
        <LateCheckInModal
          patientName={`${lateApp.patientId?.firstName} ${lateApp.patientId?.lastName}`}
          onSelect={(strategy) => handleCheckIn(lateApp._id, strategy)}
          onClose={() => setLateApp(null)}
        />
      )}
    </div>
  );
}
