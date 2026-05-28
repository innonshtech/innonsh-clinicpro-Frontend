'use client';
import { API_BASE_URL } from '@/utils/api';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, Eye, Edit, Trash2, X, User, Mail, Phone, Calendar, VenetianMask, 
  MapPin, Shield, Stethoscope, AlertCircle, FileText, Activity, Pill, 
  Printer, CheckCircle, MoreHorizontal, Plus, List, Droplet, PenLine, Info, Clock
} from 'lucide-react';
import { Dialog } from '@headlessui/react';

// Helper Components
const InfoCard = ({ icon, title, value, className = '' }) => (
  <div className={`bg-white p-4 rounded-xl border border-gray-200 shadow-xs ${className}`}>
    <div className="flex items-center gap-3 mb-2">
      <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
        {icon}
      </div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
    </div>
    <p className="font-medium text-gray-800">{value}</p>
  </div>
);

const StatusBadge = ({ status }) => {
  const statusColors = {
    'Completed': 'bg-green-100 text-green-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Pending': 'bg-amber-100 text-amber-800',
    'Cancelled': 'bg-gray-100 text-gray-800'
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

const TimelineItem = ({ date, title, description, active = false }) => (
  <div className="relative">
    <div className={`absolute -left-7 top-1 w-4 h-4 rounded-full border-4 ${active ? 'border-blue-600 bg-white' : 'border-gray-300 bg-white'}`} />
    <div className="text-sm text-gray-500">{formatDate(date)}</div>
    <h6 className="font-medium text-gray-800 mt-1">{title}</h6>
    <p className="text-sm text-gray-600 mt-1">{description}</p>
  </div>
);

const MedicationCard = ({ name, dosage, frequency, lastTaken }) => (
  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:shadow-sm transition-shadow">
    <div className="flex justify-between items-start mb-3">
      <h5 className="font-bold text-gray-800">{name}</h5>
      <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full">{dosage}</span>
    </div>
    <div className="space-y-2 text-sm">
      <p className="text-gray-600 flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-gray-400" />
        {frequency}
      </p>
      <p className="text-gray-600 flex items-center gap-2">
        <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
        Prescribed on: {lastTaken}
      </p>
    </div>
  </div>
);

// Utility Functions
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

const calculateAge = (dobString) => {
  if (!dobString) return 'N/A';
  const dob = new Date(dobString);
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const addDays = (dateString, days) => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return formatDate(date);
};

// Icon mapping for sections
const sectionIcons = {
  "Personal Info": User,
  "Treatment": Stethoscope,
  "Prescription": Pill,
  "Tablets List": List
};

// Sample data
const medicationSchedule = [
  { time: '08:00 AM', medication: 'Ibuprofen', dosage: '200mg', status: 'Taken' },
  { time: '12:00 PM', medication: 'Amoxicillin', dosage: '500mg', status: 'Upcoming' },
  { time: '06:00 PM', medication: 'Ibuprofen', dosage: '200mg', status: 'Upcoming' },
  { time: '10:00 PM', medication: 'Amoxicillin', dosage: '500mg', status: 'Upcoming' }
];

export default function PatientsPage() {
  const [clinicId, setId] = useState();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [treatmentFilter, setTreatmentFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [modalSection, setModalSection] = useState("Personal Info");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [patientVisits, setPatientVisits] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const searchRef = useRef();

  useEffect(() => {
    const data = localStorage.getItem('user');
    if (data) {
      const dum = JSON.parse(data);
      setId(dum.id || dum.clinicId || dum._id);
    }
  }, []);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/clinic/fetch-patients/${clinicId}`);
        const responseData = await res.json();
        if (responseData.success) {
          setPatients(responseData.data.patients || []);
        } else {
          console.error('Failed to fetch patients:', responseData.message);
        }
      } catch (err) {
        console.error('Error fetching patients:', err);
      }
    }
    if (clinicId) fetchPatients();
  }, [clinicId]);

  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients;
    const term = searchTerm.toLowerCase();
    return patients.filter((p) => 
      (p.firstName?.toLowerCase().includes(term)) || 
      (p.lastName?.toLowerCase().includes(term)) ||
      (p.phoneNumber?.includes(term)) ||
      (p.email?.toLowerCase().includes(term))
    );
  }, [searchTerm, patients]);

  const suggestions = useMemo(() => {
    if (!searchTerm) return [];
    return filteredPatients.map(p => `${p.firstName} ${p.lastName}`).slice(0, 5);
  }, [searchTerm, filteredPatients]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchVisits = async () => {
      if (!selectedPatient) return;
      setVisitsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/v1/visit/patient/${selectedPatient._id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const responseData = await res.json();
        if (responseData.success) {
          setPatientVisits(responseData.data.visits || []);
        } else {
          setPatientVisits([]);
        }
      } catch (err) {
        console.error('Error fetching patient visits:', err);
        setPatientVisits([]);
      } finally {
        setVisitsLoading(false);
      }
    };
    fetchVisits();
  }, [selectedPatient]);

  const sections = ["Personal Info", "Treatment", "Prescription", "Tablets List"];

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Patients</h1>
            <p className="text-slate-500 mt-1 text-sm">Manage all patient records and details</p>
          </div>
          <div className="relative max-w-2xl" ref={searchRef}>
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search patients..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg overflow-hidden">
                {suggestions.map((name, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors"
                    onClick={() => {
                      setSearchTerm(name);
                      setShowSuggestions(false);
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Gender</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone Number</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Blood Type</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredPatients.map((p, index) => (
                  <tr 
                    key={index} 
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedPatient(p)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {p.firstName?.charAt(0)}{p.lastName?.charAt(0)}
                        </div>
                        <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {p.firstName} {p.lastName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{p.gender}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{p.phoneNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{p.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-bold border border-blue-100">
                        {p.bloodGroup || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredPatients.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No patients found</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedPatient} onClose={() => setSelectedPatient(null)} className="fixed inset-0 z-50">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          {selectedPatient && (
            <Dialog.Panel className="bg-white max-w-5xl w-full shadow-2xl grid grid-cols-1 md:grid-cols-4 overflow-hidden rounded-2xl h-[80vh]">
              <aside className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 space-y-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold truncate">{selectedPatient.firstName} {selectedPatient.lastName}</h3>
                    <p className="text-xs text-white/80 mt-1">Patient ID: #{selectedPatient._id?.slice(-6) || selectedPatient.id}</p>
                  </div>
                  <button onClick={() => setSelectedPatient(null)} className="p-1.5 rounded-full hover:bg-white/20 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 mb-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <User className="w-5 h-5 opacity-60" />
                    <div>
                      <p className="text-[10px] text-white/60 uppercase font-bold tracking-wider">Age</p>
                      <p className="font-medium text-sm">{calculateAge(selectedPatient.dateOfBirth)} years</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Droplet className="w-5 h-5 opacity-60" />
                    <div>
                      <p className="text-[10px] text-white/60 uppercase font-bold tracking-wider">Blood Group</p>
                      <p className="font-medium text-sm">{selectedPatient.bloodGroup || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                <nav className="space-y-1">
                  {sections.map((section) => {
                    const Icon = sectionIcons[section] || Info;
                    return (
                      <button
                        key={section}
                        onClick={() => setModalSection(section)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                          ${modalSection === section ? 'bg-white text-blue-600 shadow-md' : 'text-white/80 hover:bg-white/10'}`}
                      >
                        <Icon className="w-4 h-4" />
                        {section}
                      </button>
                    );
                  })}
                </nav>
              </aside>

              <main className="col-span-3 p-8 bg-white overflow-y-auto">
                <div className="max-w-3xl mx-auto">
                  {modalSection === "Personal Info" && (
                    <section className="space-y-6">
                      <h4 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
                        <User className="w-5 h-5 text-blue-600" />
                        Personal Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InfoCard icon={<Mail className="w-4 h-4" />} title="Email" value={selectedPatient.email} />
                        <InfoCard icon={<Phone className="w-4 h-4" />} title="Phone" value={selectedPatient.phoneNumber} />
                        <InfoCard icon={<Calendar className="w-4 h-4" />} title="Date of Birth" value={selectedPatient.dateOfBirth} />
                        <InfoCard icon={<VenetianMask className="w-4 h-4" />} title="Gender" value={selectedPatient.gender} />
                        <InfoCard icon={<MapPin className="w-4 h-4" />} title="Address" value={selectedPatient.address || 'N/A'} className="md:col-span-2" />
                      </div>
                    </section>
                  )}

                  {modalSection === "Treatment" && (
                    <section className="space-y-6">
                      <h4 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
                        <Stethoscope className="w-5 h-5 text-blue-600" />
                        Treatment & History
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <InfoCard icon={<AlertCircle className="w-4 h-4" />} title="Medical History" value={selectedPatient.medicalHistory || 'None reported'} className="md:col-span-2" />
                        <InfoCard icon={<Activity className="w-4 h-4" />} title="Allergies" value={selectedPatient.allergies || 'None reported'} className="md:col-span-2" />
                      </div>
                      
                      <h5 className="text-lg font-bold text-gray-800 mb-4">Past Visits</h5>
                      {visitsLoading ? (
                        <div className="text-center py-8 text-gray-500">Loading visit history...</div>
                      ) : patientVisits.length > 0 ? (
                        <div className="space-y-4">
                          {patientVisits.map((visit, i) => (
                            <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-semibold text-gray-800">{formatDate(visit.createdAt)}</span>
                                <StatusBadge status={visit.status === 'completed' ? 'Completed' : 'In Progress'} />
                              </div>
                              <p className="text-sm text-gray-600 mb-2"><strong>Diagnosis:</strong> {visit.diagnosis || 'No diagnosis recorded'}</p>
                              <p className="text-sm text-gray-600"><strong>Notes:</strong> {visit.notes || visit.followUpNotes || 'No additional notes'}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No past visits recorded.</p>
                      )}
                    </section>
                  )}
                  
                  {modalSection === "Tablets List" && (
                    <section className="space-y-6">
                      <h4 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
                        <Pill className="w-5 h-5 text-blue-600" />
                        Medication Tracker
                      </h4>
                      {visitsLoading ? (
                        <div className="text-center py-8 text-gray-500">Loading medications...</div>
                      ) : patientVisits.some(v => v.medicines && v.medicines.length > 0) ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {patientVisits.map(visit => 
                            visit.medicines?.map((med, idx) => (
                              <MedicationCard 
                                key={`${visit._id}-${idx}`}
                                name={med.name}
                                dosage={med.dosage}
                                frequency={med.instructions || med.duration || 'As prescribed'}
                                remaining="N/A"
                                lastTaken={formatDate(visit.createdAt)}
                              />
                            ))
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500">
                           <List className="w-12 h-12 text-gray-200 mb-4" />
                           <p className="font-medium">No medications found</p>
                           <p className="text-sm">No medicines have been prescribed in previous visits.</p>
                        </div>
                      )}
                    </section>
                  )}

                  {modalSection === "Prescription" && (
                    <section className="space-y-6">
                      <h4 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Official Prescriptions
                      </h4>
                      {visitsLoading ? (
                        <div className="text-center py-8 text-gray-500">Loading prescription documents...</div>
                      ) : patientVisits.filter(v => (v.medicines && v.medicines.length > 0) || v.prescriptionUrl).length > 0 ? (
                        <div className="space-y-4">
                          {patientVisits
                            .filter(v => (v.medicines && v.medicines.length > 0) || v.prescriptionUrl)
                            .map((visit) => (
                            <div 
                              key={visit._id} 
                              onClick={() => window.open(visit.prescriptionUrl || `/prescription/pdf?id=${visit.appointmentId?._id || visit.appointmentId}`, '_blank')}
                              className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
                            >
                               <div className="flex items-start gap-4">
                                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                     <FileText className="w-6 h-6" />
                                  </div>
                                  <div>
                                     <p className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors">Prescription Record</p>
                                     <p className="text-sm text-gray-500 mt-0.5">
                                        <Calendar className="inline-block w-3.5 h-3.5 mr-1 mb-0.5" />
                                        {formatDate(visit.createdAt)}
                                        {visit.doctorId && (
                                           <span className="ml-3 border-l pl-3 border-gray-300">
                                              Dr. {visit.doctorId.firstName} {visit.doctorId.lastName}
                                           </span>
                                        )}
                                     </p>
                                     <p className="text-xs text-gray-400 mt-1">{visit.medicines?.length || 0} medications prescribed</p>
                                  </div>
                               </div>
                               <div className="flex gap-2 sm:ml-auto">
                                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition border border-gray-200 text-sm font-medium">
                                     <Printer className="w-4 h-4" /> Print / View
                                  </button>
                               </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                           <FileText className="w-12 h-12 text-gray-300 mb-4" />
                           <p className="font-medium text-gray-700">No prescription documents</p>
                           <p className="text-sm mt-1">There are no official prescriptions linked to this patient yet.</p>
                        </div>
                      )}
                    </section>
                  )}
                </div>
              </main>
            </Dialog.Panel>
          )}
        </div>
      </Dialog>
    </div>
  );
}
