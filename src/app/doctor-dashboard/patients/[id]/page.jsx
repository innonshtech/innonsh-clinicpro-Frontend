'use client';
import { API_BASE_URL } from '@/utils/api';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, User, Phone, Mail, MapPin, 
  Calendar, Activity, Pill, Clock, FileText, 
  ChevronRight, Stethoscope, Heart, AlertCircle, Plus, Shield, BedDouble
} from 'lucide-react';
import { formatPatientAddress } from '@/utils/addressFormatting';

const PatientProfile = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const fromConsultation = searchParams.get('fromConsultation');
  const { id } = params;

  const [isLoading, setIsLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeVisit, setActiveVisit] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = localStorage.getItem('user');
        const parsedUser = JSON.parse(user || "{}");
        const token = localStorage.getItem('token') || parsedUser?.token;
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch Patient Details & History in parallel
        const [patientRes, historyRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/patient/${id}`, { headers }),
          fetch(`${API_BASE_URL}/api/v1/visit/patient/${id}`, { headers })
        ]);

        const patientData = await patientRes.json();
        const historyData = await historyRes.json();

        if (patientData.success) {
          setPatient(patientData.data.patient || patientData.data);
        }
        if (historyData.success) {
          const visitsList = historyData.data.visits || (Array.isArray(historyData.data) ? historyData.data : []);
          setHistory(visitsList);
          if (visitsList.length > 0) setActiveVisit(visitsList[0]._id);
        }
      } catch (error) {
        console.error("Error fetching patient profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-600 font-medium text-sm">Loading Clinical Chart...</p>
        </div>
      </div>
    );
  }

  if (!patient) return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-500 mb-4">
        <AlertCircle size={28} />
      </div>
      <h2 className="text-2xl font-bold text-slate-900">Patient Not Found</h2>
      <p className="text-slate-500 text-sm mt-1 max-w-sm">The record you are looking for does not exist or has been moved.</p>
      <button 
        onClick={() => router.push('/doctor-dashboard/patients')} 
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
      >
        <ArrowLeft size={16} /> Back to Patient List
      </button>
    </div>
  );

  // Computed & sanitized patient fields
  const fName = patient.firstName || patient.first_name || '';
  const lName = patient.lastName || patient.last_name || '';
  const fullName = (patient.name || `${fName} ${lName}`).trim() || 'Unnamed Patient';
  const initials = `${fName.charAt(0) || ''}${lName.charAt(0) || ''}`.toUpperCase() || 'P';

  const patientCode = patient.patientCode || patient.patient_code || patient.patientId || patient.id || 'N/A';

  // Calculate age accurately if not explicitly on record
  let displayAge = patient.age;
  const dob = patient.dateOfBirth || patient.date_of_birth;
  if ((displayAge === undefined || displayAge === null || isNaN(displayAge)) && dob) {
    const bDate = new Date(dob);
    if (!isNaN(bDate.getTime())) {
      displayAge = Math.abs(new Date(Date.now() - bDate.getTime()).getUTCFullYear() - 1970);
    }
  }
  const ageDisplay = (displayAge !== undefined && displayAge !== null && !isNaN(displayAge) && Number(displayAge) > 0)
    ? `${displayAge} yrs`
    : 'Age N/A';

  const genderDisplay = patient.gender || 'Not specified';
  const bloodGroupDisplay = patient.bloodGroup || patient.blood_group || patient.bloodType || 'N/A';
  const phoneDisplay = patient.phoneNumber || patient.phone_number || patient.phone || 'N/A';
  const emailDisplay = patient.email || 'No email provided';
  const addressDisplay = formatPatientAddress(patient);

  // Clean emergency contact handling
  let emergencyName = 'Not Available';
  let emergencyPhone = 'No phone recorded';
  const ec = patient.emergencyContact || patient.emergency_contact;
  if (ec) {
    if (typeof ec === 'object') {
      emergencyName = ec.name || 'Emergency Contact';
      emergencyPhone = ec.phone || 'No phone recorded';
    } else if (typeof ec === 'string' && ec.trim()) {
      emergencyName = 'Emergency Contact';
      emergencyPhone = ec.trim();
    }
  }

  const medicalCondition = patient.medicalHistory || patient.medical_history || patient.condition || 'None reported';

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row h-screen overflow-hidden">
      
      {/* LEFT SIDEBAR: Patient Identity & Vitals */}
      <aside className="w-full lg:w-[380px] bg-white border-r border-slate-200/80 flex flex-col h-full overflow-y-auto overflow-x-hidden">
        {/* Profile Header */}
        <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative">
          <button 
            onClick={() => fromConsultation 
              ? router.push(`/doctor-dashboard/consultation/${fromConsultation}`)
              : router.push('/doctor-dashboard/patients')
            }
            className="absolute top-4 left-4 p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
            title="Back to Patient List"
            aria-label="Back to Patient List"
          >
            <ArrowLeft size={18} />
          </button>
          
          <div className="mt-4 text-center">
            <div className="w-20 h-20 bg-white/15 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center text-3xl font-bold border border-white/25 mb-3 shadow-lg shadow-blue-900/10">
              {initials}
            </div>
            <h1 className="text-xl font-bold capitalize">{fullName}</h1>
            <div className="inline-block mt-1.5">
              <span className="font-mono text-xs font-semibold bg-white/20 px-2.5 py-0.5 rounded border border-white/20 text-white">
                {patientCode}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Vitals Strip */}
        <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50">
          <div className="p-5 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Age & Gender</p>
            <p className="font-bold text-slate-800 text-sm leading-none">{ageDisplay}, {genderDisplay}</p>
          </div>
          <div className="p-5 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Blood Group</p>
            <div className="bg-rose-50 text-rose-700 border border-rose-200/60 px-3 py-0.5 rounded-md font-bold text-xs inline-block">
              {bloodGroupDisplay}
            </div>
          </div>
        </div>

        {/* Detailed Info */}
        <div className="flex-1 p-6 space-y-6">
          <Section icon={<Phone />} label="Contact Number" value={phoneDisplay} />
          <Section icon={<Mail />} label="Email Address" value={emailDisplay} />
          <Section icon={<MapPin />} label="Address" value={addressDisplay} />
          <Section icon={<Heart />} label="Medical Condition / History" value={medicalCondition} />
          
          <div className="pt-5 border-t border-slate-100">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              Emergency Contact
            </h4>
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
              <p className="text-xs font-bold text-slate-800">{emergencyName}</p>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">{emergencyPhone}</p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => router.push(`/doctor-dashboard/ipd?patientId=${id}`)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <BedDouble size={16} />
              Admit as Inpatient
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT: Clinical Timeline */}
      <main className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden">
        
        {/* Page Title */}
        <div className="px-8 py-5 bg-white border-b border-slate-200/80 flex items-center justify-between shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
            <Activity className="text-blue-600 w-5 h-5" />
            Clinical Chart & Record Timeline
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200/60">
              {history.length} visit{history.length === 1 ? '' : 's'} recorded
            </span>
          </div>
        </div>

        {/* Timeline Scroll Context */}
        <div className="flex-1 p-8 overflow-y-auto scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {history.length > 0 ? (
              <div className="relative pl-8 space-y-8">
                {/* Vertical Timeline Line */}
                <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-300 via-blue-200 to-transparent"></div>

                {history.map((visit, index) => (
                  <div key={visit._id || index} className="relative group">
                    {/* Timeline Dot */}
                    <div className={`absolute -left-[35px] top-2 w-4 h-4 rounded-full border-2 border-white shadow-xs ring-4 ring-blue-50 transition-all ${index === 0 ? 'bg-blue-600 scale-110' : 'bg-slate-300'}`}></div>

                    <div 
                      className={`bg-white rounded-2xl p-6 shadow-xs border transition-all duration-200 ${activeVisit === visit._id ? 'border-blue-400 ring-2 ring-blue-500/10 shadow-md' : 'border-slate-200/80 hover:border-slate-300'}`} 
                      onClick={() => setActiveVisit(visit._id)}
                    >
                      
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-5">
                        <div>
                          <p className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100/80 w-fit mb-1.5">
                            {new Date(visit.startTime).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          <h3 className="text-base font-bold text-slate-900">
                            {visit.diagnosis || visit.appointmentId?.reason || "General Consultation"}
                          </h3>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                            <Stethoscope size={14} className="text-slate-400" />
                            Dr. {visit.doctorId?.firstName || ''} {visit.doctorId?.lastName || "Staff"}
                          </div>
                        </div>
                      </div>

                      {/* Prescription Detail Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-5 border-t border-slate-100">
                        
                        {/* Medications */}
                        <div className="space-y-3">
                          <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <Pill size={14} className="text-teal-600" />
                            Prescribed Medicines
                          </h4>
                          {visit.medicines && visit.medicines.length > 0 ? (
                            <div className="space-y-2">
                              {visit.medicines.map((med, midx) => (
                                <div key={midx} className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
                                  <div className="flex justify-between items-center mb-0.5">
                                    <p className="text-xs font-bold text-slate-800">{med.name}</p>
                                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60 uppercase">
                                      {med.duration}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500">{med.dosage} • {med.frequency || med.instructions || 'As prescribed'}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 italic bg-slate-50/50 p-3 rounded-xl border border-dashed border-slate-200">
                              No medications prescribed during this visit.
                            </div>
                          )}
                        </div>

                        {/* Clinical Notes */}
                        <div className="space-y-3">
                          <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <FileText size={14} className="text-amber-600" />
                            Consultation Notes
                          </h4>
                          <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/60 text-xs text-amber-900 leading-relaxed italic">
                            "{visit.diagnosis || visit.appointmentId?.description || "Patient observed for symptoms. Routine checkup completed."}"
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200/80 mb-4 flex items-center justify-center text-slate-400">
                  <Activity size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-800">No Medical History Found</h3>
                <p className="text-xs text-slate-500 mt-1">This patient has no recorded clinical visits yet.</p>
              </div>
            )}

          </div>
        </div>
      </main>

    </div>
  );
};

// UI Components
const Section = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100/80 flex-shrink-0 mt-0.5">
      {React.cloneElement(icon, { size: 16 })}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xs font-semibold text-slate-800 break-words">{value || 'N/A'}</p>
    </div>
  </div>
);

export default PatientProfile;
