'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, Users, Activity, Clock, 
  Stethoscope, User, ChevronRight, CheckCircle,
  AlertCircle, ArrowRight, Pill, Play
} from 'lucide-react';
import { API_BASE_URL } from '@/utils/api';

const DoctorMainDashboard = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [queue, setQueue] = useState({ current: null, next: null, waitingList: [] });
  const [stats, setStats] = useState({ total: 0, waiting: 0, completed: 0 });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const data = JSON.parse(userStr);
      setUserId(data?.id);
    }
  }, []);

  const fetchData = async () => {
    if (!userId) return;
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Parallel Fetching
      const [queueRes, apptRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/queue/${userId}`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/doctor/appointments`, { headers })
      ]);

      let queueJson = { success: false };
      let apptJson = { success: false };

      try {
        if (queueRes.ok) queueJson = await queueRes.json();
      } catch (e) { console.error("Queue Parse Error", e); }

      try {
        if (apptRes.ok) apptJson = await apptRes.json();
      } catch (e) { console.error("Appointment Parse Error", e); }

      if (queueJson.success) setQueue(queueJson.data);
      if (apptJson.success) {
        const allAppts = apptJson.data || [];
        setAppointments(allAppts);
        
        // Calculate simple stats
        setStats({
          total: allAppts.length,
          waiting: allAppts.filter(a => a.status === 'checked_in' || a.status === 'checkedIn').length,
          completed: allAppts.filter(a => a.status === 'completed').length
        });
      }
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">Synchronizing Clinical Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
        {/* Page Header */}
        {/* Breadcrumbs */}


        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Doctor Dashboard</h1>
            <p className="text-slate-500 mt-1 text-sm">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-500 bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-xl">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
        
        {/* Top Operational Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            icon={<Calendar className="text-blue-600" />} 
            label="Total Appointments" 
            value={stats.total} 
            color="blue"
          />
          <StatCard 
            icon={<Clock className="text-orange-600" />} 
            label="In Waiting Room" 
            value={stats.waiting} 
            color="orange"
          />
          <StatCard 
            icon={<CheckCircle className="text-green-600" />} 
            label="Completed Today" 
            value={stats.completed} 
            color="green"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Current & Next Patient (Operational Core) */}
          <div className="lg:col-span-12 space-y-8">
            
            {/* Current Patient Section */}
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Activity className="text-blue-500 w-5 h-5" />
                Active Consultation
              </h2>
              {queue.current ? (
                <div className="bg-white rounded-3xl shadow-xl shadow-blue-500/5 border border-blue-100 overflow-hidden group">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl font-bold border border-white/30">
                        {queue.current.queueNumber}
                      </div>
                      <div>
                        <p className="text-blue-100/80 text-sm font-bold uppercase tracking-widest mb-1">Current Patient</p>
                        <h3 className="text-3xl font-bold">{queue.current.patientName}</h3>
                        <p className="text-blue-100 text-sm mt-1">ID: {queue.current.patientId} | Slot: {queue.current.timeSlot}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => router.push(`/doctor-dashboard/consultation/${queue.current.appointmentId}`)}
                      className="bg-white text-blue-700 px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-blue-50 transition-all flex items-center gap-2"
                    >
                      <Play size={18} />
                      Resume Consult
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="text-gray-300" size={32} />
                  </div>
                  <h4 className="text-gray-800 font-bold text-xl">No active consultation</h4>
                  <p className="text-gray-500 mt-2">Pick the next patient from your waiting list to start.</p>
                </div>
              )}
            </section>

            {/* Next in Line Quick Action */}
            {queue.next && (
              <section className="bg-white border border-emerald-100 rounded-3xl p-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
                    {queue.next.queueNumber}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">Next Patient: {queue.next.patientName}</h4>
                    <p className="text-sm text-gray-500">Wait time: Approx 5-10 mins</p>
                  </div>
                </div>
                <button 
                   onClick={() => router.push(`/doctor-dashboard/consultation/${queue.next.appointmentId}`)}
                   className="p-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                >
                  <ArrowRight size={20} />
                </button>
              </section>
            )}

            {/* Today's Full Agenda */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Clock className="text-gray-500 w-5 h-5" />
                  Today's Schedule
                </h2>
                <button 
                  onClick={() => router.push('/doctor-dashboard/appointments')}
                  className="text-sm text-blue-600 font-bold hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {appointments.slice(0, 5).map((appt) => (
                    <div key={appt.appointment_id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-xs font-bold text-gray-400 w-12">{appt.time_slot}</div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{appt.patient_name}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{appt.status}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-300" />
                    </div>
                  ))}
                  {appointments.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-sm">No appointments scheduled for today.</div>
                  )}
                </div>
              </div>
            </section>
          </div>



        </div>
      </div>
  );
};

// UI Components
const StatCard = ({ icon, label, value, color }) => {
  const colors = {
    blue: 'border-blue-500 bg-blue-50/10',
    orange: 'border-orange-500 bg-orange-50/10',
    green: 'border-green-500 bg-green-50/10'
  };

  return (
    <div className={`bg-white rounded-3xl p-6 border-l-4 shadow-sm ${colors[color]}`}>
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">{icon}</div>
        <div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-black text-gray-800 mt-1">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default DoctorMainDashboard;
