'use client';
import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Circle,
  MoreVertical,
  Clock,
  UserX
} from 'lucide-react';
import { doctorService } from '@/utils/doctorService';

export default function DoctorStatusRoster() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) { setLoading(false); return; } // Guard: not logged in
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const clinicId = user.clinicId;

      const res = await doctorService.getDoctors(token);
      if (res.success) {
        let allDoctors = res.data.doctors || [];
        // Filter by clinicId if the user belongs to one
        if (clinicId) {
          allDoctors = allDoctors.filter(doc => doc.clinicId === clinicId);
        }
        setDoctors(allDoctors);
      }
    } catch (err) {
      // console.error("Doctor Roster Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();

    const interval = setInterval(fetchDoctors, 60000); // Roster refresh every minute
    return () => clearInterval(interval);
  }, []);

  const isAvailableToday = (doctor) => {
    // Standardize today's day name using local time (e.g. "Friday")
    const now = new Date();
    const today = now.toLocaleDateString('en-US', { weekday: 'long' }).trim().toLowerCase();
    
    // Support both schema paths and standardize array items
    let availableDays = (doctor.availableDays || doctor.available?.days || [])
      .map(d => String(d).trim().toLowerCase());
    
    // Fallback: If no days are defined, assume Monday-Friday (matches backend doctorService fallback)
    if (availableDays.length === 0) {
      availableDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    }
      
    return availableDays.includes(today);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-blue-50/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
            <Stethoscope size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Medical Roster</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Live Doctor Status</p>
          </div>
        </div>
         <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right mr-2">
               <p className="text-[11px] font-black text-gray-800">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
            </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-[300px]">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-50 animate-pulse rounded-2xl" />)}
          </div>
        ) : doctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
               <UserX className="text-gray-200" size={32} />
            </div>
            <p className="text-gray-500 text-sm">No doctors found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {doctors.map((doc) => {
              const active = isAvailableToday(doc);
              // Check if doctor has a leave record today (if we had leaves in the doctor object)
              const isOnLeave = doc.isOnLeave || false; 
              
              return (
                <div key={doc._id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-3xl hover:border-blue-100 hover:shadow-sm transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg overflow-hidden">
                        {doc.profileImage && !doc.profileImage.includes('placeholder.com') ? (
                          <img src={doc.profileImage} alt={doc.firstName} className="w-full h-full object-cover" />
                        ) : (
                          doc.firstName?.charAt(0)
                        )}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${isOnLeave ? 'bg-amber-500' : active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">Dr. {doc.firstName} {doc.lastName}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{doc.specialty || 'General Physician'}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tight ${isOnLeave ? 'bg-amber-100 text-amber-700' : active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {isOnLeave ? 'On Leave' : active ? 'Available' : 'Off-duty'}
                    </span>
                    <p className="text-[9px] text-gray-400 mt-1 font-medium flex items-center justify-end gap-1">
                      <Clock size={10} />
                      {doc.available?.time || doc.sessionTime || 'No hours set'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50/50 border-t border-gray-50 text-center">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Updates live every 60 seconds</p>
      </div>
    </div>
  );
}

