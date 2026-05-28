'use client';
import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Trash2, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Clock,
  Info
} from 'lucide-react';
import { API_BASE_URL } from '@/utils/api';
import toast, { Toaster } from 'react-hot-toast';

const ManageLeavePage = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userData, setUserData] = useState(null);
  const [newLeave, setNewLeave] = useState({
    date: '',
    reason: ''
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserData(user);
      fetchLeaves(user.id);
    }
  }, []);

  const fetchLeaves = async (doctorId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/doctor/leave?doctorId=${doctorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLeaves(data.data);
      }
    } catch (err) {
      console.error("Error fetching leaves:", err);
      toast.error("Failed to load leaves");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLeave = async (e) => {
    e.preventDefault();
    if (!newLeave.date) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      // 1. Check for pre-existing appointments
      const apptRes = await fetch(`${API_BASE_URL}/api/v1/appointment/fetchbydoctor/${userData.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const apptData = await apptRes.json();
      
      if (apptData.success) {
        const targetDateStr = new Date(newLeave.date).toISOString().split('T')[0];
        const conflictingAppts = (apptData.data.appointments || []).filter(app => {
          const appDateStr = new Date(app.appointmentDate).toISOString().split('T')[0];
          return appDateStr === targetDateStr && app.status === 'booked';
        });
        
        if (conflictingAppts.length > 0) {
          const confirmLeave = window.confirm(`Warning: You already have ${conflictingAppts.length} patient(s) assigned on this date. Marking leave will lock them out. Do you want to proceed?`);
          if (!confirmLeave) {
            setSubmitting(false);
            return;
          }
        }
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/doctor/leave`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          doctorId: userData.id,
          date: newLeave.date,
          reason: newLeave.reason || 'Personal Leave'
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Leave marked successfully");
        setNewLeave({ date: '', reason: '' });
        fetchLeaves(userData.id);
      } else {
        toast.error(data.message || "Failed to mark leave");
      }
    } catch (err) {
      console.error("Error adding leave:", err);
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLeave = async (id) => {
    if (!window.confirm("Are you sure you want to remove this leave?")) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/doctor/leave?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success("Leave removed");
        setLeaves(leaves.filter(l => l._id !== id));
      }
    } catch (err) {
      console.error("Error deleting leave:", err);
      toast.error("Failed to remove leave");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Manage Leave</h1>
          <p className="text-slate-500 mt-1 text-sm">Mark dates when you are unavailable for appointments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-gray-100 p-6 sticky top-24">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Mark New Leave
            </h2>
            <form onSubmit={handleAddLeave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Date</label>
                <input 
                  type="date" 
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={newLeave.date}
                  onChange={(e) => setNewLeave({...newLeave, date: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 outline-none text-gray-700" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reason (Optional)</label>
                <textarea 
                  value={newLeave.reason}
                  onChange={(e) => setNewLeave({...newLeave, reason: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 outline-none text-gray-700 resize-none" 
                  placeholder="e.g. Conference, Personal"
                  rows="3"
                />
              </div>
              <button 
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {submitting ? <Loader2 className="animate-spin" /> : "Mark Leave"}
              </button>
            </form>
            
            <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Marking a day as leave will automatically block all appointments for that day in the booking calendar.
              </p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Your Leave Calendar</h2>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                {leaves.length} Dates Marked
              </span>
            </div>

            {loading ? (
              <div className="p-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-gray-400 font-medium">Fetching leave history...</p>
              </div>
            ) : leaves.length === 0 ? (
              <div className="p-20 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">No Leaves Marked</h3>
                <p className="text-gray-500 mt-1">You haven't added any leave dates yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {leaves.map((leave) => (
                  <div key={leave._id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-2xl flex flex-col items-center justify-center text-rose-600">
                        <span className="text-[10px] font-bold uppercase tracking-tighter">
                          {new Date(leave.date).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-xl font-extrabold leading-none">
                          {new Date(leave.date).getDate()}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {new Date(leave.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock size={12} /> {leave.reason}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteLeave(leave._id)}
                      className="p-3 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageLeavePage;
