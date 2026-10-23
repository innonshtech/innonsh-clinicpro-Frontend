'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { API_BASE_URL } from '@/utils/api';
import {
  Search,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Stethoscope,
  AlertCircle,
  FileText,
  Activity,
  Pill,
  Printer,
  CheckCircle,
  Clock,
  Droplet,
  Shield,
  X,
  RefreshCw,
  HeartPulse,
  BedDouble,
  ChevronRight,
  List
} from 'lucide-react';
import { Dialog } from '@headlessui/react';

// Helper Components
const InfoCard = ({ icon, title, value, className = '' }) => (
  <div className={`bg-white p-4 rounded-xl border border-slate-200 shadow-2xs ${className}`}>
    <div className="flex items-center gap-2 mb-1">
      <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg border border-blue-100 shrink-0">
        {icon}
      </div>
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
    </div>
    <div className="font-semibold text-slate-900 text-xs sm:text-sm pl-0.5">
      {value && String(value).trim() !== '' ? (
        value
      ) : (
        <span className="text-slate-400 font-normal italic">Not specified</span>
      )}
    </div>
  </div>
);

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return String(dateString);
  }
};

const calculateAge = (dobString) => {
  if (!dobString) return 'N/A';
  try {
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return 'N/A';
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  } catch {
    return 'N/A';
  }
};

const sectionIcons = {
  'Personal Info': User,
  'Treatment': Stethoscope,
  'Prescription': Pill,
  'Tablets List': List
};

export default function PatientsPage() {
  const [clinicId, setClinicId] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [modalSection, setModalSection] = useState('Personal Info');
  const [patientVisits, setPatientVisits] = useState([]);
  const [patientAdmissions, setPatientAdmissions] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem('user');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const cId = parsed.id || parsed.clinicId || parsed._id;
        setClinicId(cId);
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, []);

  const fetchPatients = async (cId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/clinic/fetch-patients/${cId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const responseData = await res.json();
      if (responseData.success) {
        setPatients(responseData.data.patients || []);
      } else {
        console.error('Failed to fetch patients:', responseData.message);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clinicId) fetchPatients(clinicId);
  }, [clinicId]);

  // Load clinical records (OPD visits + IPD admissions) whenever selectedPatient changes
  useEffect(() => {
    if (!selectedPatient) {
      setPatientVisits([]);
      setPatientAdmissions([]);
      return;
    }

    const pId = selectedPatient.id || selectedPatient._id || selectedPatient.patientId;
    if (!pId) return;

    let isCurrent = true;
    setRecordsLoading(true);

    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch(`${API_BASE_URL}/api/v1/visit/patient/${pId}`, { headers })
        .then((r) => r.json())
        .catch(() => ({})),
      fetch(`${API_BASE_URL}/api/v1/ipd/admissions`, { headers })
        .then((r) => r.json())
        .catch(() => ({}))
    ])
      .then(([visitData, ipdData]) => {
        if (!isCurrent) return;

        const opdVisits =
          visitData?.success && Array.isArray(visitData?.data?.visits)
            ? visitData.data.visits
            : [];

        const allAdms =
          ipdData?.success && Array.isArray(ipdData?.data?.admissions)
            ? ipdData.data.admissions
            : [];

        // Filter admissions for this specific patient
        const patientAdms = allAdms.filter((a) => {
          const aPid = a.patientId || a.patient_id;
          return aPid && String(aPid) === String(pId);
        });

        setPatientVisits(opdVisits);
        setPatientAdmissions(patientAdms);
      })
      .finally(() => {
        if (isCurrent) setRecordsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedPatient]);

  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients;
    const term = searchTerm.toLowerCase();
    return patients.filter((p) => {
      const fName = p.firstName || p.first_name || '';
      const lName = p.lastName || p.last_name || '';
      const name = `${fName} ${lName}`.toLowerCase();
      const phone = p.phoneNumber || p.phone_number || p.phone || '';
      const email = (p.email || '').toLowerCase();
      const code = (p.patientCode || p.patient_code || '').toLowerCase();
      return name.includes(term) || phone.includes(term) || email.includes(term) || code.includes(term);
    });
  }, [searchTerm, patients]);

  // Aggregate all prescribed medications across visits and admissions
  const allMedications = useMemo(() => {
    const list = [];

    // From OPD visits
    for (const v of patientVisits) {
      if (Array.isArray(v.medicines)) {
        for (const m of v.medicines) {
          list.push({
            id: `${v._id || v.id}-${m.name || m.medicationName}`,
            source: 'Outpatient Visit',
            name: m.name || m.medicationName || 'Medication',
            dosage: m.dosage || m.dose || 'Standard',
            frequency: m.frequency || m.instructions || 'As directed',
            instructions: m.instructions || m.duration || 'Take as prescribed',
            prescribedBy: v.doctorId ? `Dr. ${v.doctorId.firstName || ''} ${v.doctorId.lastName || ''}`.trim() : 'Attending Doctor',
            date: v.createdAt || v.start_time,
            status: 'Active'
          });
        }
      }
    }

    // From IPD admissions
    for (const adm of patientAdmissions) {
      if (Array.isArray(adm.prescriptions)) {
        for (const p of adm.prescriptions) {
          list.push({
            id: p.id || `${adm.id}-${p.medication_name || p.medicationName}`,
            source: `Inpatient (${(adm.admission_number || adm.admissionNumber || 'IPD').replace(/^#+/, '')})`,
            name: p.medication_name || p.medicationName || 'Medication',
            dosage: p.dosage || p.dose || 'Standard',
            frequency: p.frequency || (p.schedule ? p.schedule.join(', ') : 'As directed'),
            instructions: p.instructions || `Route: ${p.route || 'Oral'} | Duration: ${p.duration || 'N/A'}`,
            prescribedBy: p.doctor_name || p.doctorName || adm.admittingDoctorName || 'Inpatient Physician',
            date: p.created_at || p.createdAt || p.start_date || adm.admission_date,
            status: p.status ? p.status.toUpperCase() : 'ACTIVE'
          });
        }
      }
    }

    return list;
  }, [patientVisits, patientAdmissions]);

  // Aggregate all prescription records
  const allPrescriptionRecords = useMemo(() => {
    const records = [];

    // OPD visit prescriptions
    for (const v of patientVisits) {
      if ((v.medicines && v.medicines.length > 0) || v.prescriptionUrl) {
        records.push({
          id: v._id || v.id,
          title: 'Outpatient Prescription Record',
          type: 'OPD Consultation',
          date: v.createdAt || v.start_time,
          doctorName: v.doctorId ? `Dr. ${v.doctorId.firstName || ''} ${v.doctorId.lastName || ''}`.trim() : 'Consulting Doctor',
          medicinesCount: v.medicines?.length || 0,
          medicines: v.medicines || [],
          url: v.prescriptionUrl || `/prescription/pdf?id=${v.appointmentId?._id || v.appointmentId || v._id}`
        });
      }
    }

    // IPD admissions with prescriptions
    for (const adm of patientAdmissions) {
      if (Array.isArray(adm.prescriptions) && adm.prescriptions.length > 0) {
        records.push({
          id: adm.id,
          title: `Inpatient Medication Order Sheet — ${(adm.admission_number || adm.admissionNumber || 'IPD').replace(/^#+/, '')}`,
          type: 'Inpatient Department (IPD)',
          date: adm.admission_date || adm.created_at,
          doctorName: adm.admittingDoctorName || 'Attending Physician',
          medicinesCount: adm.prescriptions.length,
          medicines: adm.prescriptions.map((p) => ({
            name: p.medication_name || p.medicationName,
            dosage: p.dosage || p.dose,
            instructions: p.instructions || p.frequency
          })),
          url: null
        });
      }
    }

    return records;
  }, [patientVisits, patientAdmissions]);

  const sections = ['Personal Info', 'Treatment', 'Prescription', 'Tablets List'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Section — Matches Bed & Ward Management & Lab Orders */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Records</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Profiles, medical histories, inpatient admissions, and active prescriptions
          </p>
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patients by name, code, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => clinicId && fetchPatients(clinicId)}
          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors flex items-center justify-center shrink-0"
          title="Refresh patient list"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 3. Patients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-sm font-medium">Loading patient directory...</span>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-3 border border-slate-100">
              <User className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No patients found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No patients registered in this clinic account yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <th className="py-3 px-6">Patient Name</th>
                  <th className="py-3 px-6">Patient ID</th>
                  <th className="py-3 px-6">Gender</th>
                  <th className="py-3 px-6">Phone Number</th>
                  <th className="py-3 px-6">Email</th>
                  <th className="py-3 px-6 text-right">Blood Group</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((p) => {
                  const fName = p.firstName || p.first_name || '';
                  const lName = p.lastName || p.last_name || '';
                  const fullName = `${fName} ${lName}`.trim() || 'Patient';
                  const initials = (fName.charAt(0) + lName.charAt(0)).toUpperCase() || 'P';
                  const pCode = p.patientCode || p.patient_code || (p.id ? String(p.id).slice(0, 8) : 'N/A');
                  const blood = p.bloodGroup || p.blood_group || null;

                  return (
                    <tr
                      key={p.id || p._id}
                      onClick={() => {
                        setSelectedPatient(p);
                        setModalSection('Personal Info');
                      }}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200 group-hover:border-blue-400 transition-colors">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                              {fullName}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 font-mono text-slate-600 font-medium">
                        {pCode}
                      </td>

                      <td className="py-4 px-6 text-slate-700 font-medium capitalize">
                        {p.gender || 'Not specified'}
                      </td>

                      <td className="py-4 px-6 text-slate-700 font-medium">
                        {p.phoneNumber || p.phone_number || p.phone || 'N/A'}
                      </td>

                      <td className="py-4 px-6 text-slate-600">
                        {p.email || 'N/A'}
                      </td>

                      <td className="py-4 px-6 text-right">
                        {blood ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {blood}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Patient Information Modal */}
      <Dialog
        open={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          {selectedPatient && (
            <Dialog.Panel className="bg-white max-w-5xl w-full shadow-2xl grid grid-cols-1 md:grid-cols-4 overflow-hidden rounded-2xl max-h-[92vh] h-[85vh] border border-slate-200">
              {/* Left Sidebar */}
              <aside className="bg-slate-900 text-white p-6 space-y-6 overflow-y-auto flex flex-col justify-between">
                <div>
                  {(() => {
                    const pFirstName = selectedPatient.firstName || selectedPatient.first_name || '';
                    const pLastName = selectedPatient.lastName || selectedPatient.last_name || '';
                    const pFullName = `${pFirstName} ${pLastName}`.trim() || 'Patient';
                    const pDob = selectedPatient.dateOfBirth || selectedPatient.date_of_birth || selectedPatient.dob;
                    const pAge = calculateAge(pDob);
                    const pBlood = selectedPatient.bloodGroup || selectedPatient.blood_group || null;
                    const pCode =
                      selectedPatient.patientCode ||
                      selectedPatient.patient_code ||
                      (selectedPatient.id ? String(selectedPatient.id).slice(0, 8) : 'N/A');

                    return (
                      <>
                        <div className="flex justify-between items-start mb-6">
                          <div className="min-w-0 pr-2">
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                              PATIENT PROFILE
                            </span>
                            <h3 className="text-lg font-bold text-white truncate">{pFullName}</h3>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {pCode}</p>
                          </div>
                          <button
                            onClick={() => setSelectedPatient(null)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors shrink-0"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Quick Stats Card */}
                        <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 mb-6 space-y-3">
                          <div className="flex items-center space-x-2.5">
                            <User className="w-4 h-4 text-blue-400 shrink-0" />
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Age</p>
                              <p className="font-semibold text-xs text-white">
                                {pAge !== 'N/A' ? `${pAge} years` : 'Not recorded'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2.5">
                            <Droplet className="w-4 h-4 text-rose-400 shrink-0" />
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Blood Group</p>
                              <p className="font-semibold text-xs text-white">
                                {pBlood || 'Not specified'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  {/* Navigation Tabs */}
                  <nav className="space-y-1.5">
                    {sections.map((section) => {
                      const Icon = sectionIcons[section] || User;
                      const isActive = modalSection === section;
                      return (
                        <button
                          key={section}
                          onClick={() => setModalSection(section)}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4" />
                            <span>{section}</span>
                          </div>
                          {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-3">
                  ClinicPro Healthcare Systems
                </div>
              </aside>

              {/* Right Content View */}
              <main className="col-span-1 md:col-span-3 p-6 sm:p-8 bg-white overflow-y-auto text-xs">
                <div className="max-w-3xl mx-auto space-y-6">
                  {/* TAB 1: PERSONAL INFO */}
                  {modalSection === 'Personal Info' && (() => {
                    const pEmail = selectedPatient.email || null;
                    const pPhone =
                      selectedPatient.phoneNumber ||
                      selectedPatient.phone_number ||
                      selectedPatient.phone ||
                      null;
                    const pDob =
                      selectedPatient.dateOfBirth ||
                      selectedPatient.date_of_birth ||
                      selectedPatient.dob;
                    const pGender = selectedPatient.gender || null;
                    const addressParts = [
                      selectedPatient.address,
                      selectedPatient.city,
                      selectedPatient.state,
                      selectedPatient.zip_code || selectedPatient.zipCode
                    ].filter(Boolean);
                    const pAddress = addressParts.length > 0 ? addressParts.join(', ') : null;
                    const pEmergency =
                      selectedPatient.emergency_contact ||
                      selectedPatient.emergencyContact ||
                      null;

                    return (
                      <section className="space-y-5 animate-in fade-in duration-150">
                        <div className="border-b border-slate-100 pb-3">
                          <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-600" />
                            Personal Information
                          </h4>
                          <p className="text-slate-500 text-xs mt-0.5">Demographics and registered contact details</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <InfoCard icon={<Mail className="w-4 h-4" />} title="Email Address" value={pEmail} />
                          <InfoCard icon={<Phone className="w-4 h-4" />} title="Phone Number" value={pPhone} />
                          <InfoCard
                            icon={<Calendar className="w-4 h-4" />}
                            title="Date of Birth"
                            value={pDob ? formatDate(pDob) : null}
                          />
                          <InfoCard icon={<User className="w-4 h-4" />} title="Gender" value={pGender} />
                          <InfoCard
                            icon={<MapPin className="w-4 h-4" />}
                            title="Address / City"
                            value={pAddress}
                            className="sm:col-span-2"
                          />
                          {pEmergency && (
                            <InfoCard
                              icon={<Shield className="w-4 h-4" />}
                              title="Emergency Contact"
                              value={typeof pEmergency === 'object' ? JSON.stringify(pEmergency) : pEmergency}
                              className="sm:col-span-2"
                            />
                          )}
                        </div>
                      </section>
                    );
                  })()}

                  {/* TAB 2: TREATMENT */}
                  {modalSection === 'Treatment' && (() => {
                    const medHistory =
                      selectedPatient.medical_history ||
                      selectedPatient.medicalHistory ||
                      null;
                    const allergies = selectedPatient.allergies || null;
                    const symptoms = selectedPatient.symptoms || null;
                    const currMeds =
                      selectedPatient.current_medications ||
                      selectedPatient.currentMedications ||
                      null;

                    return (
                      <section className="space-y-6 animate-in fade-in duration-150">
                        <div className="border-b border-slate-100 pb-3">
                          <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-blue-600" />
                            Treatment & Medical History
                          </h4>
                          <p className="text-slate-500 text-xs mt-0.5">
                            Known medical conditions, reported allergies, and past visits
                          </p>
                        </div>

                        {/* Baseline History Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <InfoCard
                            icon={<AlertCircle className="w-4 h-4" />}
                            title="Medical History"
                            value={medHistory}
                            className="sm:col-span-2"
                          />
                          <InfoCard
                            icon={<Activity className="w-4 h-4" />}
                            title="Known Allergies"
                            value={allergies}
                          />
                          <InfoCard
                            icon={<Stethoscope className="w-4 h-4" />}
                            title="Recorded Symptoms"
                            value={symptoms}
                          />
                          {currMeds && (
                            <InfoCard
                              icon={<Pill className="w-4 h-4" />}
                              title="Current Medications"
                              value={currMeds}
                              className="sm:col-span-2"
                            />
                          )}
                        </div>

                        {/* Past Encounters & Inpatient Admissions */}
                        <div className="space-y-3 pt-2">
                          <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            Clinical Encounters & Inpatient Admissions
                          </h5>

                          {recordsLoading ? (
                            <div className="text-center py-8 text-slate-400 flex items-center justify-center gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                              <span>Loading encounter records...</span>
                            </div>
                          ) : (patientVisits.length > 0 || patientAdmissions.length > 0) ? (
                            <div className="space-y-3">
                              {/* IPD Admissions */}
                              {patientAdmissions.map((adm) => (
                                <div
                                  key={adm.id}
                                  className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2"
                                >
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold font-mono text-[11px]">
                                        {(adm.admission_number || adm.admissionNumber || 'IPD').replace(/^#+/, '')}
                                      </span>
                                      <span className="font-semibold text-slate-900 text-xs">
                                        Inpatient Admission
                                      </span>
                                    </div>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        adm.status === 'admitted'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-slate-200 text-slate-700'
                                      }`}
                                    >
                                      {adm.status === 'admitted' ? 'Active Inpatient' : 'Discharged'}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 text-xs">
                                    <div>
                                      <span className="text-slate-400">Admitted:</span>{' '}
                                      <span className="font-medium text-slate-800">
                                        {formatDate(adm.admission_date || adm.admissionDate)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400">Doctor:</span>{' '}
                                      <span className="font-medium text-slate-800">
                                        {adm.admittingDoctorName || adm.doctor_name || 'Assigned Physician'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400">Location:</span>{' '}
                                      <span className="font-medium text-slate-800">
                                        Bed {adm.bedNumber || adm.bed_number || 'N/A'} (Ward: {adm.wardName || adm.ward_name || 'Ward'})
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400">Diagnosis:</span>{' '}
                                      <span className="font-medium text-slate-800">
                                        {adm.diagnosis || adm.provisionalDiagnosis || 'Clinical observation'}
                                      </span>
                                    </div>
                                  </div>

                                  {adm.notes && (
                                    <div className="text-xs text-slate-500 pt-1 border-t border-slate-200/60">
                                      <span className="font-semibold text-slate-700">Notes:</span> {adm.notes}
                                    </div>
                                  )}
                                </div>
                              ))}

                              {/* Outpatient Visits */}
                              {patientVisits.map((visit) => (
                                <div
                                  key={visit._id || visit.id}
                                  className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2"
                                >
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <span className="font-semibold text-slate-900 text-xs">
                                      OPD Consultation ({formatDate(visit.createdAt || visit.start_time)})
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                      Consultation
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600">
                                    <strong>Diagnosis:</strong> {visit.diagnosis || 'None specified'}
                                  </p>
                                  {visit.clinicalNotes && (
                                    <p className="text-xs text-slate-500">
                                      <strong>Notes:</strong> {visit.clinicalNotes}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                              <Stethoscope className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                              <p className="font-semibold text-slate-600">No past clinical visits recorded</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                When consultations or inpatient admissions occur, they will appear here.
                              </p>
                            </div>
                          )}
                        </div>
                      </section>
                    );
                  })()}

                  {/* TAB 3: PRESCRIPTION */}
                  {modalSection === 'Prescription' && (
                    <section className="space-y-5 animate-in fade-in duration-150">
                      <div className="border-b border-slate-100 pb-3">
                        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Pill className="w-4 h-4 text-blue-600" />
                          Official Prescriptions & Medication Orders
                        </h4>
                        <p className="text-slate-500 text-xs mt-0.5">
                          Prescription records issued during consultations and inpatient stays
                        </p>
                      </div>

                      {recordsLoading ? (
                        <div className="text-center py-8 text-slate-400 flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                          <span>Loading prescriptions...</span>
                        </div>
                      ) : allPrescriptionRecords.length > 0 ? (
                        <div className="space-y-3.5">
                          {allPrescriptionRecords.map((rec) => (
                            <div
                              key={rec.id}
                              className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all space-y-3"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0 border border-blue-100">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 text-xs sm:text-sm">{rec.title}</div>
                                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                      <span>{formatDate(rec.date)}</span>
                                      <span>&bull;</span>
                                      <span className="text-slate-600 font-medium">{rec.doctorName}</span>
                                      <span>&bull;</span>
                                      <span className="text-blue-600 font-medium">{rec.type}</span>
                                    </div>
                                  </div>
                                </div>
                                {rec.url && (
                                  <button
                                    onClick={() => window.open(rec.url, '_blank')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-lg border border-slate-200 text-xs font-semibold transition-colors self-start sm:self-auto"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>Print / View PDF</span>
                                  </button>
                                )}
                              </div>

                              {/* Prescribed Items */}
                              <div className="space-y-1.5">
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                  Prescribed Medications ({rec.medicinesCount})
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {rec.medicines.map((m, idx) => (
                                    <div
                                      key={idx}
                                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                                    >
                                      <span className="font-semibold text-slate-800 block">{m.name}</span>
                                      <span className="text-slate-500 text-[11px] block mt-0.5">
                                        Dosage: {m.dosage} {m.instructions ? `• ${m.instructions}` : ''}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 flex flex-col items-center">
                          <FileText className="w-10 h-10 text-slate-300 mb-2" />
                          <p className="font-semibold text-slate-700">No prescription documents found</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm">
                            There are currently no prescription sheets or pharmacy orders linked to this patient.
                          </p>
                        </div>
                      )}
                    </section>
                  )}

                  {/* TAB 4: TABLETS LIST */}
                  {modalSection === 'Tablets List' && (
                    <section className="space-y-5 animate-in fade-in duration-150">
                      <div className="border-b border-slate-100 pb-3">
                        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <List className="w-4 h-4 text-blue-600" />
                          Prescribed Medication Tracker
                        </h4>
                        <p className="text-slate-500 text-xs mt-0.5">
                          Consolidated medication list across all inpatient admissions and consultations
                        </p>
                      </div>

                      {recordsLoading ? (
                        <div className="text-center py-8 text-slate-400 flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                          <span>Loading medications...</span>
                        </div>
                      ) : allMedications.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {allMedications.map((med) => (
                            <div
                              key={med.id}
                              className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm">{med.name}</h5>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                    {med.dosage}
                                  </span>
                                </div>
                                <div className="space-y-1.5 text-xs text-slate-600">
                                  <p className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>Frequency: {med.frequency}</span>
                                  </p>
                                  <p className="text-slate-500 text-[11px] leading-relaxed">
                                    {med.instructions}
                                  </p>
                                </div>
                              </div>

                              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                                <span>{med.prescribedBy}</span>
                                <span className="font-medium text-emerald-600">{med.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 flex flex-col items-center">
                          <Pill className="w-10 h-10 text-slate-300 mb-2" />
                          <p className="font-semibold text-slate-700">No medications found</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm">
                            No active medications or tablets have been prescribed for this patient.
                          </p>
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
