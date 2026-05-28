'use client';
import React, { useState, useEffect, useCallback, Suspense } from 'react';
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
  X,
  Plus
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
      // Mocking password for quick add
      const res = await patientService.registerPatient({ 
        ...formData, 
        password: 'Patient@123' 
      }, token);
      
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
              <UserPlus size={20} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Quick Patient Add</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">First Name</label>
              <input 
                required 
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={formData.firstName}
                onChange={e => setFormData({...formData, firstName: e.target.value})}
                placeholder="John"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Last Name</label>
              <input 
                required 
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={formData.lastName}
                onChange={e => setFormData({...formData, lastName: e.target.value})}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Email Address</label>
            <input 
              required 
              type="email"
              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              placeholder="patient@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Phone Number</label>
              <input 
                required 
                type="tel"
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={formData.phoneNumber}
                onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                placeholder="+123..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Gender</label>
              <select 
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={formData.gender}
                onChange={e => setFormData({...formData, gender: e.target.value})}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Date of Birth</label>
            <input 
              required 
              type="date"
              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={formData.dateOfBirth}
              onChange={e => setFormData({...formData, dateOfBirth: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 mt-2 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <><Plus size={18} /> Register Patient</>}
          </button>
        </form>
      </div>
    </div>
  );
};

const BookAppointmentPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedPatientId = searchParams.get('patientId');
  
  // State
  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [token, setToken] = useState('');
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  
  // Form Data
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: '',
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

  // Initialize
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
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
            setFormData(prev => ({ ...prev, patientId: p._id }));
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
    }, 400);
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

  const [isOnLeave, setIsOnLeave] = useState(false);

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
    setFormData(prev => ({ ...prev, patientId: patient._id }));
    setSearchQuery(`${patient.firstName} ${patient.lastName}`);
    setShowPatientList(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.doctorId || !formData.date || !formData.timeSlot || !formData.reason) {
      toast.error('Please complete all required fields (including Reason)');
      return;
    }

    setLoading(true);
    try {
      const res = await appointmentService.createAppointment(formData, token);
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
      const res = await appointmentService.createAppointment({ ...formData, isEmergency: true }, token);
      if (res.success) {
        toast.success(`Emergency booking confirmed! Affected appointments have been rescheduled.`);
        setTimeout(() => {
          router.push('/receptionist-dashboard/appointments');
        }, 2000);
      }
    } catch (err) {
      toast.error(err.message || 'Emergency booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      {/* Emergency Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm ring-1 ring-red-100">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Slot Already Booked</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                The selected time slot is currently occupied. If this is a medical emergency, you can force-book this slot.
                <br /><br />
                <span className="font-medium text-gray-800">Note:</span> This will automatically push the existing patient to the next available slot and notify them via SMS.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all text-sm"
                onClick={() => setShowEmergencyModal(false)}
              >
                Cancel Booking
              </button>
              <button
                type="button"
                onClick={handleEmergencySubmit}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-medium hover:from-red-700 hover:to-rose-700 focus:ring-4 focus:ring-red-200 shadow-lg shadow-red-500/30 transition-all text-sm flex justify-center items-center gap-2"
              >
                {loading ? <span className="animate-spin text-white">⟳</span> : <AlertCircle className="w-4 h-4" />}
                Book as Emergency
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
          setFormData(prev => ({ ...prev, patientId: newPatient._id }));
          setSearchQuery(`${newPatient.firstName} ${newPatient.lastName}`);
        }}
      />

      <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} />
      {/* Background Decor */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-indigo-100/30 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          <div className="text-right">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Book Appointment</h1>
            <p className="text-gray-500 text-sm mt-1">Schedule a new consultation for a patient</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Patient Selection */}
          <div className="relative z-20 bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-white/80 p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Assign Patient</h3>
                  <p className="text-xs text-gray-500">Search for a registered patient or create one</p>
                </div>
              </div>
              
              <button 
                type="button"
                onClick={() => setShowQuickAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-xs font-bold border border-blue-100"
              >
                <Plus size={14} />
                REGISTER NEW PATIENT
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Start typing patient name..."
                className="w-full px-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all outline-none text-gray-700 font-medium"
                value={searchQuery}
                onFocus={() => searchQuery.length >= 2 && setShowPatientList(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              {showPatientList && patients.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden max-h-[300px] overflow-y-auto anima-in">
                  {patients.map((p) => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => handlePatientSelect(p)}
                      className="w-full p-4 flex items-center gap-4 hover:bg-blue-50/50 transition-colors text-left border-b border-gray-50 last:border-0"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 text-sm truncate">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-gray-500 truncate">{p.phoneNumber} • {p.gender}</p>
                      </div>
                      <div className="ml-auto text-xs font-mono text-gray-400 truncate max-w-[100px] sm:max-w-[200px]" title={p.patientId}>
                        {p.patientId}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {selectedPatient && (
              <div className="mt-4 flex items-center gap-2 text-emerald-600 bg-emerald-50/50 px-4 py-2 rounded-xl border border-emerald-100 animate-in fade-in slide-in-from-top-1">
                <CheckCircle2 size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Patient Linked: {selectedPatient.patientId}</span>
              </div>
            )}
          </div>

          {/* Step 2: Appointment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-white/80 p-6 md:p-8 flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Stethoscope size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Specialist</h3>
                  <p className="text-xs text-gray-500">Choose an available doctor</p>
                </div>
              </div>

              <select
                className="w-full p-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all outline-none text-gray-700 font-medium appearance-none"
                value={formData.doctorId}
                onChange={(e) => setFormData(prev => ({ ...prev, doctorId: e.target.value }))}
                required
              >
                <option value="">Select Doctor...</option>
                {doctors.map(d => (
                  <option key={d._id} value={d._id}>Dr. {d.firstName} {d.lastName} ({d.specialty})</option>
                ))}
              </select>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-white/80 p-6 md:p-8 flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <CalendarIcon size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Visit Date</h3>
                  <p className="text-xs text-gray-500">Pick the consultation day</p>
                </div>
              </div>

              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all outline-none text-gray-700 font-medium"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value, timeSlot: '' }))}
                required
              />
            </div>
          </div>

          {/* Step 3: Slots Grid */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-white/80 p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Available Slots</h3>
                  <p className="text-xs text-gray-500">Choose a free time interval</p>
                </div>
              </div>
              
              {fetchingSlots && (
                <div className="flex items-center gap-2 text-blue-500 text-xs font-bold animate-pulse">
                  <Loader2 size={14} className="animate-spin" />
                  FETCHING...
                </div>
              )}
            </div>

            {!formData.doctorId || !formData.date ? (
              <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                <AlertCircle size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400 text-sm">Please select a doctor and date first</p>
              </div>
            ) : isOnLeave ? (
              <div className="py-12 text-center border-2 border-dashed border-rose-200 rounded-3xl bg-rose-50/50">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                  <CalendarIcon size={32} />
                </div>
                <h3 className="text-xl font-bold text-rose-900">Doctor is on Leave</h3>
                <p className="text-rose-600 text-sm font-medium mt-1">This doctor is not available for appointments on this date.</p>
              </div>
            ) : availableSlots.length === 0 && !fetchingSlots ? (
              <div className="py-12 text-center border-2 border-dashed border-rose-100 rounded-3xl bg-rose-50/20">
                <AlertCircle size={32} className="mx-auto text-rose-300 mb-3" />
                <p className="text-rose-400 text-sm font-medium">No available slots for this day</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {availableSlots.map((item) => (
                  <button
                    key={item.slot}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, timeSlot: item.slot }))}
                    className={`py-3 px-2 rounded-2xl text-sm font-bold transition-all border shadow-sm relative overflow-hidden group ${
                      formData.timeSlot === item.slot 
                        ? 'bg-blue-600 text-white border-blue-600 scale-95 ring-4 ring-blue-500/20' 
                        : item.isAvailable
                          ? 'bg-white text-gray-700 border-gray-100 hover:border-blue-400 hover:text-blue-600'
                          : 'bg-gray-50 text-rose-500 border-rose-100 hover:border-rose-300 hover:bg-rose-50'
                    }`}
                  >
                    <span className="relative z-10">{item.slot}</span>
                    {!item.isAvailable && (
                      <span className={`block text-[8px] uppercase mt-0.5 relative z-10 ${formData.timeSlot === item.slot ? 'text-rose-100' : 'text-rose-400 font-bold'}`}>
                        Busy (Emergency Only)
                      </span>
                    )}
                    {/* Subtle warning pattern for busy slots */}
                    {!item.isAvailable && (
                        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiAvPgo8cGF0aCBkPSJNMCAwbDggOHptOCAwTDAgOHoiIHN0cm9rZT0iI2U1M2UzZSIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==')] pointer-events-none"></div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 4: Reason & Notes */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-white/80 p-6 md:p-8">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Visit Info</h3>
                  <p className="text-xs text-gray-500">Brief reason for the appointment</p>
                </div>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Primary Reason (e.g., General Checkup)"
                  className="w-full p-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all outline-none text-gray-700 font-medium"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  required
                />
                <textarea
                  placeholder="Additional Notes..."
                  rows={3}
                  className="w-full p-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all outline-none text-gray-700 font-medium resize-none"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 pb-12">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-5 rounded-3xl shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-1 active:scale-[0.98] disabled:opacity-70 disabled:translate-y-0"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="animate-spin" />
                  BOOKING IN PROGRESS...
                </div>
              ) : (
                'CONFIRM APPOINTMENT'
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-10 py-5 bg-white text-gray-600 font-bold rounded-3xl border border-gray-200 hover:bg-gray-50 transition-all"
            >
              CANCEL
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .anima-in {
          animation: slideIn 0.3s ease-out;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookAppointmentPage />
    </Suspense>
  );
}
