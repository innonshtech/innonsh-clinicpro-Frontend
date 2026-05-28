'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  History,
  User,
  ArrowRight,
  Calendar,
  Search,
  Bell
} from 'lucide-react';
import { appointmentService } from '@/utils/appointmentService';
import { API_BASE_URL } from '@/utils/api';

export default function FollowUpMonitor() {
  const router = useRouter();
  const getLocalDateString = () => {
    const now = new Date();
    return now.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD in local time
  };

  const [followUps, setFollowUps] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [loading, setLoading] = useState(true);

  const fetchFollowUps = async (date = selectedDate) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { setLoading(false); return; }

      // Use the reliable appointmentService instead of the failing standalone endpoint
      const response = await appointmentService.getAppointments({ date, limit: 100 }, token);
      
      if (response.success) {
        const allAppts = response.data?.appointments || [];
        // Filter for follow-up appointments and map to the format the component expects
        const filteredFollowUps = allAppts
          .filter(app => app.type === 'follow_up' || app.type === 'Follow-up')
          .map(app => ({
            appointment_id: app._id,
            patient_id: app.patientId?._id || app.patientId?.id,
            patient_name: `${app.patientId?.firstName || ''} ${app.patientId?.lastName || ''}`.trim(),
            doctor_name: `${app.doctorId?.firstName || ''} ${app.doctorId?.lastName || ''}`.trim(),
            status: app.status
          }));
        
        setFollowUps(filteredFollowUps);
      }
    } catch (err) {
      console.error("Follow-up Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (e, id) => {
    e.stopPropagation(); // Prevent navigating to patient profile
    try {
      const token = localStorage.getItem('token');
      await appointmentService.checkIn(id, token);
      fetchFollowUps(); // Refresh list after check-in
    } catch (err) {
      alert("Check-in failed: " + err.message);
    }
  };

  const handleSendReminders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/followup/send-reminders`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        alert(`Successfully sent ${result.data.sent} reminders! Check backend console for logs.`);
      } else {
        alert("Failed to send reminders: " + result.message);
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  useEffect(() => {
    fetchFollowUps(selectedDate);
    // Auto refresh every 30 seconds if viewing today
    const isToday = selectedDate === getLocalDateString();
    let interval;
    if (isToday) {
      interval = setInterval(() => fetchFollowUps(selectedDate), 30000);
    }
    return () => clearInterval(interval);
  }, [selectedDate]);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-emerald-50/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl shadow-sm">
            <Calendar size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 leading-tight">Follow-up Patients</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="relative group/picker h-7 flex items-center">
                {/* Invisible native date input on top */}
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                {/* Visible custom label underneath */}
                <div className="text-[11px] bg-white border border-emerald-200 rounded-lg px-2.5 py-1 font-bold text-emerald-700 outline-none shadow-sm flex items-center gap-1.5 transition-all group-hover/picker:border-emerald-300">
                  <span>
                    {selectedDate === getLocalDateString() ? (
                      'Today'
                    ) : (
                      (() => {
                        const [y, m, d] = selectedDate.split('-');
                        return `${d}/${m}/${y}`;
                      })()
                    )}
                  </span>
                  <Calendar size={12} className="text-emerald-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSendReminders}
            title="Dispatch SMS Reminders"
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-black rounded-lg hover:bg-emerald-700 transition-all uppercase tracking-widest shadow-md shadow-emerald-200"
          >
            <Bell size={12} />
            Remind All
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-[300px]">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-2xl" />)}
          </div>
        ) : followUps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
              <History className="text-emerald-200" size={32} />
            </div>
            <p className="text-gray-500 font-medium text-sm">No follow-ups for</p>
            <p className="text-slate-600 font-bold text-sm">{selectedDate === getLocalDateString() ? 'today' : new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {followUps.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => item.patient_id && router.push(`/receptionist-dashboard/patients/${item.patient_id}`)}
                className="p-4 bg-white border border-gray-100 rounded-2xl hover:border-emerald-200 hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold uppercase border border-emerald-100 shadow-sm">
                      {item.patient_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm group-hover:text-emerald-600 transition-colors">{item.patient_name}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">With Dr. {item.doctor_name?.split(' ').pop()}</p>
                    </div>
                  </div>
                  {item.status === 'scheduled' && (
                    <button 
                      onClick={(e) => handleCheckIn(e, item.appointment_id)}
                      className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                    >
                      Check-in
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50/50 border-t border-gray-100 text-center">
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
           Total {followUps.length} follow-ups listed
        </p>
      </div>
    </div>
  );
}
