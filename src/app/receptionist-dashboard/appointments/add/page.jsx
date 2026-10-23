'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Stethoscope, 
  Search, 
  ChevronLeft, 
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  UserPlus,
  X
} from 'lucide-react';
import { patientService } from '@/utils/patientService';
import { doctorService } from '@/utils/doctorService';
import { appointmentService } from '@/utils/appointmentService';
import toast, { Toaster } from 'react-hot-toast';

const QuickAddPatientModal = ({ isOpen, onClose, onAdded, token }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: 'Male'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await patientService.registerPatient(formData, token);
      
      if (res.success) {
        toast.success('Patient registered successfully');
        onAdded(res.data.patient);
        onClose();
      } else {
        toast.error(res.message || 'Registration failed');
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <UserPlus size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Register New Patient</h3>
              <p className="text-xs text-slate-500">Quickly create a patient profile</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto" autoComplete="off">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">First Name *</label>
              <input 
                required 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs text-slate-800 transition-all"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Last Name *</label>
              <input 
                required 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs text-slate-800 transition-all"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Email Address *</label>
            <input 
              required 
              type="email"
              autoComplete="off"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs text-slate-800 transition-all"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="patient@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Phone Number *</label>
              <input 
                required 
                type="tel"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs text-slate-800 transition-all"
                value={formData.phoneNumber}
                onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+91..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Gender *</label>
              <select 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs text-slate-800 transition-all"
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Date of Birth *</label>
            <input 
              required 
              type="date"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs text-slate-800 transition-all"
              value={formData.dateOfBirth}
              onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : <UserPlus size={14} />}
              <span>Register Patient</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const getTodayLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const BookAppointmentPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedPatientId = searchParams.get('patientId');
  const searchContainerRef = useRef(null);
  
  // State
  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [token, setToken] = useState('');
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  
  // Form Data
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: getTodayLocalDate(),
    timeSlot: '',
    reason: '',
    notes: ''
  });

  // Data Lists
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientList, setShowPatientList] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [isOnLeave, setIsOnLeave] = useState(false);

  // Close patient dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowPatientList(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) setToken(storedToken);
    
    // Fetch Doctors
    const fetchDoctors = async () => {
      try {
        const res = await doctorService.getDoctors(storedToken);
        if (res.success) setDoctors(res.data.doctors);
      } catch (err) {
        console.error('Error fetching doctors:', err);
      }
    };
    
    if (storedToken) fetchDoctors();
  }, []);

  // Handle pre-selected patient from query params
  useEffect(() => {
    const fetchPreSelectedPatient = async () => {
      if (preSelectedPatientId && token) {
        try {
          const res = await patientService.getPatientById(preSelectedPatientId, token);
          if (res.success) {
            const p = res.data.patient;
            setSelectedPatient(p);
            setFormData(prev => ({ ...prev, patientId: p._id || p.id }));
            setSearchQuery(`${p.firstName} ${p.lastName}`);
          }
        } catch (err) {
          console.error('Error fetching pre-selected patient:', err);
        }
      }
    };
    fetchPreSelectedPatient();
  }, [preSelectedPatientId, token]);

  // Patient Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchPatients();
      } else {
        setPatients([]);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchPatients = async () => {
    try {
      const res = await patientService.getPatients({ name: searchQuery }, token);
      if (res.success) {
        setPatients(res.data.patients);
        setShowPatientList(true);
      }
    } catch (err) {
      console.error('Error searching patients:', err);
    }
  };

  // Fetch Available Slots when Doctor or Date changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (formData.doctorId && formData.date) {
        setFetchingSlots(true);
        setIsOnLeave(false);
        try {
          const res = await doctorService.getAvailableSlots(formData.doctorId, formData.date, token);
          if (res.success) {
            setAvailableSlots(res.data.slots || []);
            setIsOnLeave(res.data.onLeave || false);
          }
        } catch (err) {
          console.error('Error fetching slots:', err);
          setAvailableSlots([]);
        } finally {
          setFetchingSlots(false);
        }
      }
    };
    fetchSlots();
  }, [formData.doctorId, formData.date, token]);

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({ ...prev, patientId: patient._id || patient.id }));
    setSearchQuery(`${patient.firstName} ${patient.lastName}`);
    setShowPatientList(false);
  };

  const handleClearPatient = () => {
    setSelectedPatient(null);
    setFormData(prev => ({ ...prev, patientId: '' }));
    setSearchQuery('');
    setPatients([]);
    setShowPatientList(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!formData.patientId) {
      if (searchQuery.trim()) {
        toast.error('Please select a patient from the search results to link to this appointment');
      } else {
        toast.error('Please search and select a patient, or register a new patient');
      }
      return;
    }

    if (!formData.doctorId) {
      toast.error('Please select a specialist');
      return;
    }

    if (!formData.date) {
      toast.error('Please select a visit date');
      return;
    }

    if (!formData.timeSlot) {
      if (availableSlots.length > 0) {
        toast.error('Please select an available time slot from the list');
      } else if (isOnLeave) {
        toast.error('The selected doctor is on leave on this date. Please choose another date or doctor.');
      } else if (fetchingSlots) {
        toast.error('Still fetching available time slots. Please wait a moment.');
      } else {
        toast.error('No available slots for this doctor on this date. Please choose another date.');
      }
      return;
    }

    if (!formData.reason || !formData.reason.trim()) {
      toast.error('Please enter the primary reason for the visit');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        reason: formData.reason.trim(),
        notes: formData.notes ? formData.notes.trim() : ''
      };
      const res = await appointmentService.createAppointment(payload, token);
      if (res.success) {
        toast.success(`Appointment confirmed for ${formData.date} at ${formData.timeSlot}`);
        setTimeout(() => {
          router.push('/receptionist-dashboard/appointments');
        }, 1500);
      }
    } catch (err) {
      if (err.code === 'SLOT_OCCUPIED') {
        setShowEmergencyModal(true);
      } else {
        toast.error(err.message || 'Booking failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencySubmit = async () => {
    setShowEmergencyModal(false);
    setLoading(true);
    try {
      const payload = {
        ...formData,
        reason: formData.reason.trim(),
        notes: formData.notes ? formData.notes.trim() : '',
        isEmergency: true
      };
      const res = await appointmentService.createAppointment(payload, token);
      if (res.success) {
        toast.success('Emergency booking confirmed! Affected appointments have been rescheduled.');
        setTimeout(() => {
          router.push('/receptionist-dashboard/appointments');
        }, 1800);
      }
    } catch (err) {
      toast.error(err.message || 'Emergency booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-8">
      <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} />

      {/* Emergency Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-md p-6 animate-in zoom-in-95 duration-150 flex flex-col">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-3 border border-rose-100">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1.5">Slot Already Booked</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                The selected time slot is currently occupied. If this is a medical emergency, you can force-book this slot.
                <br /><br />
                <span className="font-semibold text-slate-800">Note:</span> This will automatically push the existing patient to the next available slot and notify them via SMS.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-xs"
                onClick={() => setShowEmergencyModal(false)}
              >
                Cancel Booking
              </button>
              <button
                type="button"
                onClick={handleEmergencySubmit}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors text-xs flex justify-center items-center gap-1.5 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <AlertCircle className="w-4 h-4" />}
                <span>Book as Emergency</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Patient Modal */}
      <QuickAddPatientModal 
        isOpen={showQuickAddModal} 
        onClose={() => setShowQuickAddModal(false)}
        token={token}
        onAdded={(newPatient) => {
          setSelectedPatient(newPatient);
          setFormData(prev => ({ ...prev, patientId: newPatient._id || newPatient.id }));
          setSearchQuery(`${newPatient.firstName} ${newPatient.lastName}`);
        }}
      />

      <div className="max-w-3xl mx-auto">
        {/* Page Header (Above Card) */}
        <div className="mb-6">
          <button 
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-3 group"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Appointments</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Book Appointment</h1>
            <p className="text-sm text-slate-500 mt-1">Schedule a new consultation for a patient</p>
          </div>
        </div>

        {/* Single Unified Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Assign Patient */}
            <div className="space-y-2" ref={searchContainerRef}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={15} className="text-blue-600" />
                  <span>Assign Patient</span>
                  <span className="text-rose-500">*</span>
                </label>
                <button 
                  type="button"
                  onClick={() => setShowQuickAddModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60 transition-colors"
                >
                  <UserPlus size={13} />
                  <span>Register New Patient</span>
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search patient by name or phone (type at least 2 characters)..."
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  value={searchQuery}
                  onFocus={() => searchQuery.length >= 2 && setShowPatientList(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearPatient}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100"
                    title="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}

                {/* Dropdown Results */}
                {showPatientList && patients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden max-h-60 overflow-y-auto">
                    {patients.map((p) => (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => handlePatientSelect(p)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50/60 transition-colors text-left border-b border-slate-100 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {p.firstName?.[0]}{p.lastName?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                            {p.firstName} {p.lastName}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {p.phoneNumber || 'No phone'} • {p.gender}
                          </p>
                        </div>
                        <div className="text-xs font-mono text-slate-400 shrink-0">
                          {p.patientId}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Patient Pill */}
              {selectedPatient && (
                <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200/80 rounded-xl px-3.5 py-2 text-xs text-emerald-800 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span className="truncate">
                      Selected: <strong className="font-semibold text-emerald-950">{selectedPatient.firstName} {selectedPatient.lastName}</strong>
                      {selectedPatient.patientId ? ` (${selectedPatient.patientId})` : ''}
                      {selectedPatient.phoneNumber ? ` • ${selectedPatient.phoneNumber}` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearPatient}
                    className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold underline ml-3 shrink-0"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* 2. Specialist & Visit Date (2-column layout on desktop) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Specialist */}
              <div className="space-y-1.5">
                <label htmlFor="select-doctor" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope size={15} className="text-blue-600" />
                  <span>Specialist</span>
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  id="select-doctor"
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  value={formData.doctorId}
                  onChange={(e) => setFormData(prev => ({ ...prev, doctorId: e.target.value, timeSlot: '' }))}
                  required
                >
                  <option value="">Select Doctor...</option>
                  {doctors.map(d => (
                    <option key={d._id || d.id} value={d._id || d.id}>Dr. {d.firstName} {d.lastName} ({d.specialty})</option>
                  ))}
                </select>
              </div>

              {/* Visit Date */}
              <div className="space-y-1.5">
                <label htmlFor="input-visit-date" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarIcon size={15} className="text-blue-600" />
                  <span>Visit Date</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-visit-date"
                  type="date"
                  min={getTodayLocalDate()}
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value, timeSlot: '' }))}
                  required
                />
              </div>
            </div>

            {/* 3. Available Slots */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={15} className="text-blue-600" />
                  <span>Available Slots</span>
                  <span className="text-rose-500">*</span>
                </label>
                {fetchingSlots ? (
                  <div className="flex items-center gap-1.5 text-blue-600 text-xs font-semibold">
                    <Loader2 size={13} className="animate-spin" />
                    <span>Checking slots...</span>
                  </div>
                ) : formData.timeSlot ? (
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full">
                    Selected: {formData.timeSlot}
                  </span>
                ) : availableSlots.length > 0 ? (
                  <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <AlertCircle size={11} className="text-amber-600" />
                    <span>Select a slot below</span>
                  </span>
                ) : null}
              </div>

              {!formData.doctorId || !formData.date ? (
                <div className="py-7 px-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <AlertCircle size={22} className="mx-auto text-slate-300 mb-1.5" />
                  <p className="text-slate-500 text-xs font-medium">Please select a specialist and visit date to view available time slots.</p>
                </div>
              ) : isOnLeave ? (
                <div className="py-5 px-4 text-center border border-rose-200 rounded-xl bg-rose-50/60">
                  <AlertCircle size={22} className="mx-auto text-rose-500 mb-1.5" />
                  <h4 className="text-xs sm:text-sm font-bold text-rose-900">Doctor is on Leave</h4>
                  <p className="text-rose-600 text-xs font-medium mt-0.5">This specialist is not taking consultations on the selected date.</p>
                </div>
              ) : availableSlots.length === 0 && !fetchingSlots ? (
                <div className="py-7 px-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <Clock size={22} className="mx-auto text-slate-300 mb-1.5" />
                  <p className="text-slate-500 text-xs font-medium">No available slots found for this doctor on this date.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {availableSlots.map((item) => {
                    const isSelected = formData.timeSlot === item.slot;
                    const isAvailable = item.isAvailable;
                    return (
                      <button
                        key={item.slot}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, timeSlot: item.slot }))}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all border text-center relative ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-500/20'
                            : isAvailable
                              ? 'bg-slate-50 hover:bg-blue-50/60 text-slate-700 hover:text-blue-700 border-slate-200 hover:border-blue-300'
                              : 'bg-rose-50/60 text-rose-600 border-rose-200/80 hover:bg-rose-50'
                        }`}
                      >
                        <div className="truncate">{item.slot}</div>
                        {!isAvailable && (
                          <span className={`block text-[9px] uppercase font-bold tracking-tight mt-0.5 ${
                            isSelected ? 'text-rose-100' : 'text-rose-500'
                          }`}>
                            Busy
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. Visit Info: Primary Reason & Additional Notes */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="input-reason" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={15} className="text-blue-600" />
                  <span>Primary Reason</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-reason"
                  type="text"
                  placeholder="Primary reason for visit (e.g., General Checkup, Follow-up, Fever & Cold)"
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="input-notes" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText size={15} className="text-slate-400" />
                    <span>Additional Notes</span>
                  </span>
                  <span className="text-[11px] font-normal text-slate-400 lowercase">optional</span>
                </label>
                <textarea
                  id="input-notes"
                  rows={3}
                  placeholder="Add any relevant symptoms, patient history or instructions..."
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium resize-none"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>

            {/* 5. Bottom Actions Footer */}
            <div className="pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-xs sm:text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs hover:shadow transition-all text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Confirming Appointment...</span>
                  </>
                ) : (
                  <span>Confirm Appointment</span>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 text-sm">Loading appointment form...</div>}>
      <BookAppointmentPage />
    </Suspense>
  );
}
