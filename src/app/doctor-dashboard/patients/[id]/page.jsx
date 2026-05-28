'use client';
import { API_BASE_URL } from '@/utils/api';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, User, Phone, Mail, MapPin, 
  Calendar, Activity, Pill, Clock, FileText, 
  ChevronRight, Stethoscope, Heart, AlertCircle, Plus
} from 'lucide-react';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading Clinical Chart...</p>
        </div>
      </div>
    );
  }

  if (!patient) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="text-rose-500 w-12 h-12 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Patient Not Found</h2>
        <p className="text-gray-500 mt-2">The record you are looking for does not exist or has been moved.</p>
        <button onClick={() => router.back()} className="mt-6 text-blue-600 font-bold flex items-center gap-2">
            <ArrowLeft size={18} /> Back to List
        </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row h-screen overflow-hidden">
      
      {/* LEFT SIDEBAR: Patient Identity & Vitals (300px - 400px) */}
      <aside className="w-full lg:w-[380px] bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto overflow-x-hidden">
        {/* Profile Header */}
        <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-800 text-white relative">
          <button 
            onClick={() => fromConsultation 
              ? router.push(`/doctor-dashboard/consultation/${fromConsultation}`)
              : router.push('/doctor-dashboard/patients')
            }
            className="absolute top-4 left-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="mt-8 text-center">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl mx-auto flex items-center justify-center text-4xl font-bold border border-white/30 mb-4 shadow-xl shadow-blue-900/20 capitalize">
              {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
            </div>
            <h1 className="text-2xl font-bold">{patient.firstName} {patient.lastName}</h1>
            <p className="text-blue-100/70 text-sm font-medium mt-1">Patient ID: #{patient.patientCode || patient.patientId || 'N/A'}</p>
          </div>
        </div>

        {/* Quick Vitals Strip */}
        <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
            <div className="p-6 text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Age & Gender</p>
                <p className="font-bold text-gray-800 leading-none">{patient.age}y, {patient.gender}</p>
            </div>
            <div className="p-6 text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Blood Group</p>
                <div className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full font-black text-sm inline-block">
                    {patient.bloodGroup || 'N/A'}
                </div>
            </div>
        </div>

        {/* Detailed Info */}
        <div className="flex-1 p-8 space-y-8">
            <Section icon={<Phone />} label="Contact Number" value={patient.phoneNumber} />
            <Section icon={<Mail />} label="Email Address" value={patient.email || "No email provided"} />
            <Section icon={<MapPin />} label="Address" value={`${patient.addressLine1}, ${patient.city}, ${patient.state}`} />
            
            <div className="pt-6 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Emergency Contact</h4>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <p className="font-bold text-gray-800">{patient.emergencyContact?.name || 'Not Available'}</p>
                    <p className="text-sm text-gray-500 mt-1">{patient.emergencyContact?.phone || 'No phone recorded'}</p>
                </div>
            </div>
        </div>
      </aside>

      {/* MAIN CONTENT: Clinical Timeline */}
      <main className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
        
        {/* Page Title */}
        <div className="px-8 py-6 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <Activity className="text-blue-600" />
                Clinical Chart & Record Timeline
            </h2>
            <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-500">{history.length} Visits recorded</span>
            </div>
        </div>

        {/* Timeline Scroll Context */}
        <div className="flex-1 p-8 overflow-y-auto scroll-smooth">
            <div className="max-w-4xl mx-auto space-y-12">
                
                {history.length > 0 ? (
                    <div className="relative pl-8 space-y-12">
                        {/* Vertical Timeline Line */}
                        <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-200 to-transparent"></div>

                        {history.map((visit, index) => (
                            <div key={visit._id} className="relative group">
                                {/* Timeline Dot */}
                                <div className={`absolute -left-[35px] top-2 w-4 h-4 rounded-full border-2 border-white shadow-sm ring-4 ring-blue-50 transition-all ${index === 0 ? 'bg-blue-600 scale-125' : 'bg-gray-300'}`}></div>

                                <div className={`bg-white rounded-3xl p-8 shadow-sm border border-gray-200 transition-all duration-300 ${activeVisit === visit._id ? 'ring-2 ring-blue-500 shadow-xl' : 'hover:shadow-md'}`} 
                                     onClick={() => setActiveVisit(visit._id)}>
                                    
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                        <div>
                                            <p className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full w-fit mb-2">
                                                {new Date(visit.startTime).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                            <h3 className="text-xl font-bold text-gray-800">
                                                {visit.diagnosis || visit.appointmentId?.reason || "General Consultation"}
                                            </h3>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 text-gray-400 text-sm font-bold">
                                                <Stethoscope size={14} />
                                                Dr. {visit.doctorId?.firstName} {visit.doctorId?.lastName || "Staff"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Prescription Detail Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-gray-100">
                                        
                                        {/* Medications */}
                                        <div className="space-y-4">
                                            <h4 className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-widest">
                                                <Pill size={16} className="text-teal-600" />
                                                Prescribed Medicines
                                            </h4>
                                            {visit.medicines && visit.medicines.length > 0 ? (
                                                <div className="space-y-3">
                                                    {visit.medicines.map((med, midx) => (
                                                        <div key={midx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <p className="font-bold text-gray-800">{med.name}</p>
                                                                <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded uppercase">
                                                                    {med.duration}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-500">{med.dosage} • {med.frequency || med.instructions || 'As prescribed'}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-400 italic">No medications prescribed during this visit.</div>
                                            )}
                                        </div>

                                        {/* Clinical Notes */}
                                        <div className="space-y-4">
                                             <h4 className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-widest">
                                                <FileText size={16} className="text-amber-600" />
                                                Consultation Notes
                                            </h4>
                                            <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100 text-sm text-amber-900 leading-relaxed italic">
                                                "{visit.diagnosis || visit.appointmentId?.description || "Patient observed for symptoms. Routine checkup completed."}"
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                        <div className="w-20 h-20 rounded-full bg-gray-200 mb-6 flex items-center justify-center">
                            <Plus size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">No Medical History Found</h3>
                        <p className="text-gray-500 mt-2">This patient has no recorded visits yet.</p>
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
    <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl flex-shrink-0">
            {React.cloneElement(icon, { size: 18 })}
        </div>
        <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-bold text-gray-800">{value || 'N/A'}</p>
        </div>
    </div>
);

export default PatientProfile;
