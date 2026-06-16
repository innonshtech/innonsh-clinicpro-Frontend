'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { API_BASE_URL } from '@/utils/api';
import {
  ArrowLeft, User, Activity, FileText, Pill,
  Plus, X, CheckCircle, Clock, Save, Play, RefreshCw,
  AlertCircle, History, MessageSquare, Clipboard,
  ChevronRight, Sparkles, LogOut, ArrowRight, Stethoscope, Phone, Search, Calendar, Settings, Brain
} from 'lucide-react';
import { generateClinicalSummary, getClinicalInsights } from '@/utils/gemini';

import { generatePrescriptionHtml } from '@/utils/prescriptionHtmlGenerator';

const ConsultationDesk = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [nextPatient, setNextPatient] = useState(null);

  // Unified State for EMR
  const [formData, setFormData] = useState({
    symptoms: '',
    diagnosis: '',
    clinicalNotes: '',
    medicines: [],
    followUpDate: '',
    followUpNotes: ''
  });
  const [visitId, setVisitId] = useState(null);

  // Medicine Search State
  const [medQuery, setMedQuery] = useState('');
  const [medResults, setMedResults] = useState([]);
  const [showMedResults, setShowMedResults] = useState(false);

  // Simulated Massive Global Medicine Database
  const MEDICINE_DB = [
    { name: 'Paracetamol 500mg', dosage: '1-0-1', duration: '5 days', cat: 'Antipyretic' },
    { name: 'Amoxicillin 250mg', dosage: '1-1-1', duration: '7 days', cat: 'Antibiotic' },
    { name: 'Cetirizine 10mg', dosage: '0-0-1', duration: '3 days', cat: 'Antiallergic' },
    { name: 'Ibuprofen 400mg', dosage: '1-0-1', duration: '3 days', cat: 'Analgesic' },
    { name: 'Azithromycin 500mg', dosage: '1-0-0', duration: '3 days', cat: 'Antibiotic' },
    { name: 'Pantoprazole 40mg', dosage: '1-0-0', duration: '10 days', cat: 'Antacid' },
    { name: 'Metformin 500mg', dosage: '0-1-1', duration: '1 month', cat: 'Antidiabetic' },
    { name: 'Amlodipine 5mg', dosage: '1-0-0', duration: '1 month', cat: 'Antihypertensive' },
    { name: 'Atorvastatin 10mg', dosage: '0-0-1', duration: '1 month', cat: 'Cholesterol' },
    { name: 'Montelukast 10mg', dosage: '0-0-1', duration: '5 days', cat: 'Asthma/Allergy' },
    { name: 'Omeprazole 20mg', dosage: '1-0-0', duration: '7 days', cat: 'Antacid' },
    { name: 'Augmentin 625 Duo', dosage: '1-0-1', duration: '5 days', cat: 'Antibiotic' },
    { name: 'Telmisartan 40mg', dosage: '1-0-0', duration: '1 month', cat: 'BP Control' },
    { name: 'Metoprolol 25mg', dosage: '1-0-1', duration: '1 month', cat: 'Beta Blocker' },
    { name: 'Gliclazide 80mg', dosage: '1-1-0', duration: '1 month', cat: 'Antidiabetic' },
    { name: 'Levocetirizine 5mg', dosage: '0-0-1', duration: '5 days', cat: 'Antihistamine' },
    { name: 'Salbutamol Inhaler', dosage: 'As required', duration: '7 days', cat: 'Bronchodilator' }
  ];

  const handleMedSearch = (q) => {
    setMedQuery(q);
    if (!q.trim() || q.length < 1) {
      setMedResults([]);
      setShowMedResults(false);
      return;
    }

    // 1. Search Local/Common DB
    let results = MEDICINE_DB.filter(m =>
      m.name.toLowerCase().includes(q.toLowerCase()) ||
      m.cat?.toLowerCase().includes(q.toLowerCase())
    );

    // 2. Google-Style Fallback: Always allow adding whatever they typed
    if (results.length === 0 || !results.some(r => r.name.toLowerCase() === q.toLowerCase())) {
      results.push({
        name: q,
        dosage: '',
        duration: '',
        cat: 'Custom Molecule',
        isNew: true
      });
    }

    setMedResults(results.slice(0, 8)); // Top 8 results
    setShowMedResults(true);
  };

  const selectMedicine = (med) => {
    setFormData(prev => ({
      ...prev,
      medicines: [...prev.medicines, { ...med, instructions: '' }]
    }));
    setMedQuery('');
    setMedResults([]);
    setShowMedResults(false);
  };

  const selectLabTest = (lab) => {
    setFormData(prev => ({
      ...prev,
      diagnosis: prev.diagnosis 
        ? `${prev.diagnosis}, ${lab.name}` 
        : lab.name
    }));
    saveProgress();
  };

  // AI Suggestion State
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [labSuggestions, setLabSuggestions] = useState([]);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  // Clinical Reasoning Engine (Mock AI Logic)
  useEffect(() => {
    const analyzeSymptoms = () => {
      setIsAiAnalyzing(true);
      const text = (formData.symptoms + ' ' + formData.clinicalNotes + ' ' + formData.diagnosis).toLowerCase();

      let medSugs = [];
      let labSugs = [];

      // --- Medicine Logic ---
      if (text.includes('fever') || text.includes('body ache')) {
        medSugs.push({ name: 'Paracetamol 500mg', dosage: '1-0-1', duration: '3 days', reason: 'Antipyretic for fever' });
      }
      if (text.includes('weakness') || text.includes('low bp') || text.includes('tired')) {
        medSugs.push({ name: 'Multivitamin (B-Complex)', dosage: '0-0-1', duration: '15 days', reason: 'Nutritional support for weakness' });
        medSugs.push({ name: 'ORS Solution', dosage: 'As required', duration: '2 days', reason: 'Rehydration' });
      }
      if (text.includes('pain') || text.includes('injury')) {
        medSugs.push({ name: 'Ibuprofen 400mg', dosage: '1-0-1 (After Food)', duration: '3 days', reason: 'Analgesic' });
      }
      if (text.includes('cough') || text.includes('cold') || text.includes('throat')) {
        medSugs.push({ name: 'Cetirizine 10mg', dosage: '0-0-1', duration: '5 days', reason: 'Antihistamine' });
        medSugs.push({ name: 'Azithromycin 500mg', dosage: '1-0-0', duration: '3 days', reason: 'Antibiotic' });
      }

      // --- Lab Suggestion Logic ---
      if (text.includes('fever')) {
        labSugs.push({ name: 'CBC (Complete Blood Count)', reason: 'To check infection markers' });
        labSugs.push({ name: 'Widal/Malaria Test', reason: 'If fever persists > 3 days' });
      }
      if (text.includes('weakness') || text.includes('dignosis')) {
        labSugs.push({ name: 'Vitamin D / B12 Profile', reason: 'Persistent fatigue' });
        labSugs.push({ name: 'HB% (Hemoglobin Check)', reason: 'Rule out Anemia' });
      }
      if (text.includes('stomach') || text.includes('pain')) {
        labSugs.push({ name: 'USG Abdomen', reason: 'Localized abdominal pain' });
      }

      // Filter out those already prescribed
      const existingNames = formData.medicines.map(m => m.name);
      const finalMedSugs = medSugs.filter(s => !existingNames.includes(s.name));

      setAiSuggestions(finalMedSugs.slice(0, 3));
      setLabSuggestions(labSugs.slice(0, 3));
      setTimeout(() => setIsAiAnalyzing(false), 600);
    };

    const timer = setTimeout(analyzeSymptoms, 1000);
    return () => clearTimeout(timer);
  }, [formData.symptoms, formData.clinicalNotes, formData.diagnosis]);

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const difference = Date.now() - birthDate.getTime();
    const age = new Date(difference);
    return Math.abs(age.getUTCFullYear() - 1970);
  };

  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);

  const handleGenerateSummary = async () => {
    setIsAiProcessing(true);
    try {
      const summary = await generateClinicalSummary(formData.symptoms, formData.clinicalNotes, formData.diagnosis);
      setFormData({ ...formData, clinicalNotes: (formData.clinicalNotes + '\n\nSUMMARY: ' + summary).trim() });
    } catch (error) {
      alert("AI Summary Error: " + error.message + "\n\nMake sure your Gemini API Key is set in AI Settings.");
      setShowAiSettings(true);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleDeepAIScan = async () => {
    setIsAiProcessing(true);
    try {
      const insights = await getClinicalInsights(formData.symptoms, formData.clinicalNotes, formData.diagnosis);

      // Add new medications if any
      if (insights.medicines) {
        const existingNames = formData.medicines.map(m => m.name.toLowerCase());
        const newMeds = insights.medicines.filter(m => !existingNames.includes(m.name.toLowerCase()));
        setAiSuggestions(newMeds.slice(0, 3));
      }

      // Add lab suggestions
      if (insights.labs) {
        setLabSuggestions(insights.labs);
      }
    } catch (error) {
      alert("Deep Scan Error: " + error.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const fetchConsultation = async () => {
    try {
      const token = localStorage.getItem('token')?.trim();

      const res = await fetch(`${API_BASE_URL}/api/v1/doctor/consultation/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();

      if (result.success) {
        setData(result.data);
        const { appointment, visit } = result.data;

        if (visit) {
          setVisitId(visit._id);
          setFormData({
            symptoms: visit.symptoms || '',
            diagnosis: visit.diagnosis || '',
            clinicalNotes: visit.clinicalNotes || '',
            medicines: visit.medicines?.length > 0 ? visit.medicines : [],
            followUpDate: visit.followUpDate || '',
            followUpNotes: visit.followUpNotes || ''
          });
        } else if (appointment.status === 'completed') {
          setIsCompleted(true);
          fetchNextPatient();
        }
      } else {
        alert('Failed to load consultation data: ' + result.message);
        router.push('/doctor-dashboard/appointments');
      }
    } catch (error) {
      console.error("Error loading consultation data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNextPatient = async () => {
    try {
      const token = localStorage.getItem('token')?.trim();
      const user = localStorage.getItem('user');
      const userData = JSON.parse(user || "{}");
      const res = await fetch(`${API_BASE_URL}/api/v1/queue/${userData.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success && result.data.next) {
        setNextPatient(result.data.next);
      }
    } catch (err) {
      console.error("Next Patient Fetch Error:", err);
    }
  }

  useEffect(() => {
    if (id) fetchConsultation();
  }, [id]);

  const startConsultation = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token')?.trim();
      const user = localStorage.getItem('user');
      const userData = JSON.parse(user || "{}");

      const payload = {
        appointment_id: id,
        doctor_id: userData.id || userData._id,
        patient_id: data.patient?._id,
        clinicId: userData.clinicId
      };
      console.log('Starting consultation with payload:', payload);

      const res = await fetch(`${API_BASE_URL}/api/v1/visit/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result.success) {
        setVisitId(result.data.visit._id);
        setData({ ...data, appointment: { ...data.appointment, status: 'in_progress' } });
      } else {
        alert('Could not start consultation: ' + result.message);
      }
    } catch (error) {
      console.error(error);
      alert('Error starting consultation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveProgress = async () => {
    if (!visitId) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token')?.trim();

      const res = await fetch(`${API_BASE_URL}/api/v1/visit/${visitId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          medicines: formData.medicines.filter(m => m.name.trim() !== '')
        })
      });

      if (res.ok) {
        // Success indicator
      }
    } catch (error) {
      console.error("Save Error:", error);
    } finally {
      setTimeout(() => setIsSaving(false), 800);
    }
  };

  const handlePrintRx = async () => {
    await saveProgress();
    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr || '{}');

    const clinicId = user.clinicId?._id || 'default';
    const savedTemplateStr = localStorage.getItem(`rx_template_${clinicId}`);
    const savedTemplate = savedTemplateStr ? JSON.parse(savedTemplateStr) : {};

    const doctorObj = data?.appointment?.doctorId || {};

    const rxData = {
      doctor: {
        firstName: doctorObj.firstName || user.firstName || 'Dr.',
        lastName: doctorObj.lastName || user.lastName || 'Consultant',
        qualification: doctorObj.qualification || user.qualification || 'MD, MBBS',
        specialty: doctorObj.specialty || user.specialty || 'General Practitioner',
        phone: doctorObj.phone || user.phone || '+123 456 789',
        registrationNumber: doctorObj.registrationNumber || user.registrationNumber || 'N/A',
        clinicName: doctorObj.hospital || user.hospital || doctorObj.clinicId?.clinicName || user.clinicId?.clinicName || 'Health Care Medical Clinic'
      },
      patient: {
        firstName: data.patient?.firstName || '',
        lastName: data.patient?.lastName || '',
        age: calculateAge(data.patient?.dateOfBirth),
        address: data.patient?.address || 'N/A'
      },
      medicines: formData.medicines,
      notes: `${formData.diagnosis ? `Diagnosis: ${formData.diagnosis}\n` : ''}${formData.clinicalNotes}`,
      template: savedTemplate
    };

    localStorage.setItem('print_medicines', JSON.stringify(formData.medicines));
    localStorage.setItem('print_notes', formData.clinicalNotes);
    localStorage.setItem('print_diagnosis', formData.diagnosis);
    window.open(`/prescription/pdf?id=${id}`, '_blank');
  };

  const handleWhatsAppRx = async () => {
    await saveProgress();
    const patientName = `${data.patient?.firstName || ''} ${data.patient?.lastName || ''}`;
    const clinicName = data.patient?.clinicId?.clinicName || 'Health Care Medical Clinic';
    const pdfUrl = `${window.location.origin}/prescription/pdf?id=${id}`;

    const text = `Hello ${patientName},\n\n` +
      `Your prescription is ready.\n\n` +
      `Download here:\n` +
      `${pdfUrl}\n\n` +
      `– ${clinicName}`;
      
    window.open(`https://wa.me/${data.patient?.phoneNumber}?text=${encodeURIComponent(text)}`);
  };

  const completeConsultation = async () => {
    if (!visitId) return;
    if (!formData.diagnosis.trim()) {
      const confirm = window.confirm("Diagnosis is empty. Complete anyway?");
      if (!confirm) return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token')?.trim();

      const res = await fetch(`${API_BASE_URL}/api/v1/visit/complete/${visitId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          medicines: formData.medicines.filter(m => m.name.trim() !== '')
        })
      });

      const result = await res.json();
      if (result.success) {
        router.push('/doctor-dashboard');
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      alert('Network error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMedicine = () => {
    setFormData(prev => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    }));
  };

  const removeMedicine = (index) => {
    const newMeds = [...formData.medicines];
    newMeds.splice(index, 1);
    setFormData({ ...formData, medicines: newMeds });
  };

  const updateMedicine = (index, field, value) => {
    const newMeds = [...formData.medicines];
    newMeds[index][field] = value;
    setFormData({ ...formData, medicines: newMeds });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">Synchronizing Clinical Desk...</p>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <CompletionHub
        patientName={`${data.patient.firstName} ${data.patient.lastName}`}
        nextPatient={nextPatient}
        onDashboard={() => router.push('/doctor-dashboard')}
        onNext={() => {
          setIsCompleted(false);
          router.push(`/doctor-dashboard/consultation/${nextPatient.appointmentId}`);
        }}
      />
    )
  }

  if (!data) return null;
  const { appointment, patient, history } = data;
  const isInProgress = (appointment.status === 'in_progress' || appointment.status === 'checked_in') && visitId;

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans flex flex-col h-screen overflow-hidden">
      {/* Top Header / Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/doctor-dashboard/appointments')}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                Consultation Desk
                <button
                  onClick={() => setShowAiSettings(true)}
                  className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-all"
                  title="AI Settings"
                >
                  <Settings size={16} />
                </button>
              </h1>
              <p className="text-xs text-slate-500">Appt ID: {id} | {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* AI SETTINGS MODAL */}
          {showAiSettings && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-[40px] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-blue-600 p-2.5 rounded-2xl">
                    <Brain size={24} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">AI Intelligence Center</h2>
                </div>
                <p className="text-sm text-slate-500 mb-8 font-medium">To enable free professional medical AI, please enter your <a href="https://aistudio.google.com" target="_blank" className="text-blue-600 font-bold underline">Gemini API Key</a> below.</p>
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Google Gemini API Key</label>
                    <input
                      type="password"
                      placeholder="Paste your key here..."
                      defaultValue={localStorage.getItem('GEMINI_API_KEY') || ''}
                      id="gemini_key_input"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-blue-100 transition-all outline-none font-mono"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowAiSettings(false)}
                      className="flex-1 py-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const key = document.getElementById('gemini_key_input').value;
                        localStorage.setItem('GEMINI_API_KEY', key);
                        setShowAiSettings(false);
                      }}
                      className="flex-1 bg-blue-600 text-white py-4 rounded-3xl font-bold shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="hidden md:flex bg-slate-100 rounded-xl p-1 mr-4">
              <button className="px-4 py-1.5 text-xs font-bold bg-white text-blue-600 rounded-lg shadow-sm border border-blue-100">Consultation</button>
              <button
                onClick={handleDeepAIScan}
                disabled={isAiProcessing}
                className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-2 group transition-all"
              >
                <Sparkles size={14} className={`${isAiProcessing ? 'animate-spin' : 'group-hover:scale-125 transition-transform'}`} />
                AI Deep Reason
              </button>
            </div>

            {!visitId ? (
              <button
                onClick={startConsultation}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Start Consultation
              </button>
            ) : (
              <>
                <button
                  onClick={saveProgress}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin text-blue-600" /> : <Save className="w-4 h-4" />}
                  Draft Save
                </button>
                <button
                  onClick={completeConsultation}
                  disabled={isSubmitting || isAiProcessing}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Complete Visit
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-6 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

          {/* PANEL 1: PATIENT CONTEXT (LEFT - 3 Cols) */}
          <div className="xl:col-span-3 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold">
                  {patient?.firstName?.[0]}{patient?.lastName?.[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{patient?.firstName} {patient?.lastName}</h2>
                  <p className="text-sm text-slate-500">{calculateAge(patient?.dateOfBirth)} yrs • {patient?.gender}</p>
                </div>
              </div>

              <div className="space-y-4 border-t border-slate-100 pt-6">
                <ContextItem icon={<Phone className="w-4 h-4" />} label="Contact" value={patient?.phoneNumber} />
                <ContextItem icon={<Activity className="w-4 h-4" />} label="Blood Group" value={patient?.bloodGroup || 'Not Checked'} />
                <ContextItem icon={<AlertCircle className="w-4 h-4 text-red-500" />} label="Allergies" value={patient?.allergies || 'No known allergies'} />
              </div>

              <div className="mt-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Chronic Conditions</h3>
                <div className="flex flex-wrap gap-2">
                  {patient?.medicalHistory ? (
                    <span className="px-3 py-2 bg-red-50 text-red-600 text-[10px] font-bold rounded-xl border border-red-100 break-words break-all max-w-full inline-block">{patient.medicalHistory}</span>
                  ) : (
                    <span className="text-xs text-slate-400 italic">None recorded</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Outcome Summary Links */}
            <div className="bg-slate-800 rounded-3xl p-6 text-white overflow-hidden relative">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
              <h3 className="text-lg font-bold mb-4 relative z-10">Last Visit Summary</h3>
              <p className="text-slate-400 text-sm leading-relaxed relative z-10">
                {patient?.lastVisitSummary || "No previous visit records available for this patient."}
              </p>
              <button 
                onClick={() => router.push(`/doctor-dashboard/patients/${patient._id}?fromConsultation=${id}`)}
                className="mt-6 text-blue-400 text-sm font-bold flex items-center gap-2 hover:text-blue-300">
                View History Timeline <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* PANEL 2: CONSULTATION / EMR (CENTER - 5 Cols) */}
          <div className="xl:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Stethoscope size={20} className="text-blue-600" />
                Clinical Findings (EMR)
              </h3>

              <div className="space-y-8">
                {!visitId ? (
                  <div className="bg-blue-50/50 rounded-3xl p-12 text-center border border-blue-100">
                    <Play className="mx-auto text-blue-300 mb-4" size={48} />
                    <h4 className="text-blue-800 font-bold text-lg">Consultation Not Started</h4>
                    <p className="text-blue-600 text-sm max-w-xs mx-auto mt-2">Initialize the session above to begin capturing patient symptoms and findings.</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Chief Complaints</label>
                      <textarea
                        value={formData.symptoms || ''}
                        onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                        onBlur={saveProgress}
                        placeholder="Why is the patient here today?"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none min-h-[100px]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Examination / Observations (Objective)</label>
                      <textarea
                        value={formData.clinicalNotes || ''}
                        onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                        onBlur={saveProgress}
                        placeholder="Enter BP, Heart Rate, Physical examination notes..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Diagnosis (Assessment)</label>
                        <input
                          type="text"
                          value={formData.diagnosis || ''}
                          onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                          onBlur={saveProgress}
                          placeholder="Final Diagnosis"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Follow-up Date</label>
                          <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="date"
                              value={formData.followUpDate || ''}
                              onChange={(e) => {
                                setFormData({ ...formData, followUpDate: e.target.value });
                                saveProgress();
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Follow-up Notes</label>
                          <input
                            type="text"
                            value={formData.followUpNotes || ''}
                            onChange={(e) => setFormData({ ...formData, followUpNotes: e.target.value })}
                            onBlur={saveProgress}
                            placeholder="Instructions for follow-up"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* AI LAB ASSISTANT & SUMMARIZER */}
            <div className="space-y-4">
              {labSuggestions.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-amber-100 p-1.5 rounded-lg">
                      <Activity size={16} className="text-amber-600" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Recommended Diagnostic Tests</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {labSuggestions.map((lab, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => selectLabTest(lab)}
                        className="p-3 bg-amber-50/50 border border-amber-100 rounded-2xl flex justify-between items-center group cursor-pointer hover:bg-amber-100 transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800">{lab.name}</p>
                          <p className="text-[10px] text-amber-700 italic">{lab.reason}</p>
                        </div>
                        <Plus size={14} className="text-amber-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleGenerateSummary}
                  disabled={isAiProcessing}
                  className="flex items-center gap-3 p-5 bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-3xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all active:scale-95 group disabled:opacity-50"
                >
                  <div className="bg-white/20 p-2 rounded-xl group-hover:rotate-12 transition-transform">
                    {isAiProcessing ? <RefreshCw size={20} className="animate-spin" /> : <Sparkles size={20} />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Generate AI Summary</p>
                    <p className="text-[10px] text-white/60 font-medium">{isAiProcessing ? 'Thinking...' : 'Google Gemini Flash'}</p>
                  </div>
                </button>

                <button className="flex items-center gap-3 p-5 bg-white border border-slate-200 text-slate-700 rounded-3xl hover:bg-slate-50 transition-all active:scale-95 group shadow-sm">
                  <div className="bg-slate-100 p-2 rounded-xl group-hover:rotate-12 transition-transform">
                    <Clipboard size={20} className="text-slate-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Previous Documents</p>
                    <p className="text-[10px] text-slate-400 font-medium">View Lab Results</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* PANEL 3: PRESCRIPTION (RIGHT - 4 Cols) */}
          <div className="xl:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 min-h-[600px] flex flex-col relative">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Pill size={20} className="text-blue-600" />
                  Prescription Pad
                </h3>
                <button className="text-xs font-bold text-blue-600 px-3 py-1 bg-blue-50 rounded-full hover:bg-blue-100">Use Template</button>
              </div>

              {/* AI SMART SUGGESTIONS */}
              {aiSuggestions.length > 0 && (
                <div className="mb-8 animate-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-1 rounded-lg">
                      <Sparkles size={14} className="text-white" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">AI Assisted Recommendations</span>
                    {isAiAnalyzing && <RefreshCw size={10} className="text-blue-400 animate-spin ml-auto" />}
                  </div>
                  <div className="space-y-2">
                    {aiSuggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectMedicine(sug)}
                        className="w-full text-left p-3 bg-white border border-blue-100 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all group relative overflow-hidden"
                      >
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500/10 group-hover:bg-blue-500 transition-colors"></div>
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-slate-800">{sug.name}</span>
                          <Plus size={14} className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium italic">Logic: {sug.reason}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Medicine Add Bar */}
              <div className="flex gap-2 mb-6 relative">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Medicine (e.g. Para...)"
                    value={medQuery}
                    onChange={(e) => handleMedSearch(e.target.value)}
                    onFocus={() => medQuery && setShowMedResults(true)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  />

                  {/* Search Results Dropdown (Google Style) */}
                  {showMedResults && medResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {medResults.map((med, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectMedicine(med)}
                          className="w-full px-5 py-3 text-left hover:bg-blue-50 flex items-center justify-between border-b border-slate-50 last:border-0 group transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className={`font-bold ${med.isNew ? 'text-blue-600' : 'text-slate-700'} group-hover:text-blue-700`}>
                              {med.name}
                              {med.isNew && <span className="ml-2 text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">New Entry</span>}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">{med.cat || 'Global Database'}</span>
                          </div>
                          {!med.isNew && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">{med.dosage}</span>}
                          {med.isNew && <Plus size={14} className="text-blue-400 group-hover:text-blue-600" />}
                        </button>
                      ))}
                      <div className="bg-slate-50 px-5 py-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Searching Universal Registry</span>
                        <div className="flex gap-1">
                          <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.1s]"></div>
                          <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.2s]"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={addMedicine}
                  className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg active:scale-90"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                {formData.medicines.length > 0 ? (
                  formData.medicines.map((med, index) => (
                    <div key={index} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 relative group animate-in slide-in-from-right-4 duration-300">
                      <button
                        onClick={() => removeMedicine(index)}
                        className="absolute -right-2 -top-2 w-6 h-6 bg-white shadow-md border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <input
                        className="w-full bg-transparent font-bold text-slate-800 mb-2 focus:outline-none"
                        placeholder="Medicine Name"
                        value={med.name}
                        onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                        onBlur={saveProgress}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <input
                            className="w-full text-xs bg-transparent focus:outline-none"
                            placeholder="Dosage (e.g. 1-0-1)"
                            value={med.dosage}
                            onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                            onBlur={saveProgress}
                          />
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <input
                            className="w-full text-xs bg-transparent focus:outline-none"
                            placeholder="Duration (e.g. 5 days)"
                            value={med.duration}
                            onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                            onBlur={saveProgress}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 text-slate-300 opacity-50">
                    <Pill size={32} className="text-slate-200" />

                    <p className="text-sm font-bold text-slate-400">No medicines added yet</p>
                    <p className="text-[10px] text-slate-300 mt-1">Search above or click AI recommendations</p>
                  </div>
                )}
              </div>

              {/* Right Panel Bottom Actions */}
              <div className="pt-6 border-t border-slate-100 mt-auto space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={handleWhatsAppRx}
                    className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-2xl text-xs font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={14} /> WhatsApp
                  </button>
                  <button 
                    onClick={handlePrintRx}
                    className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-2xl text-xs font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText size={14} /> Print Rx
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- SUCCESS HUB ---
const CompletionHub = ({ patientName, nextPatient, onDashboard, onNext }) => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8 animate-in fade-in zoom-in duration-500">
      <div className="max-w-xl w-full text-center space-y-10">
        <div className="relative inline-block">
          <div className="w-32 h-32 bg-emerald-50 rounded-[40px] flex items-center justify-center mx-auto mb-2 rotate-12 relative z-10">
            <CheckCircle size={64} className="text-emerald-600 -rotate-12" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">Visit Finalized!</h2>
          <p className="text-gray-500 font-medium">The clinical record for <span className="text-gray-900 font-black">{patientName}</span> has been securely saved.</p>
        </div>

        {nextPatient ? (
          <div className="bg-gray-50 rounded-[40px] p-8 border border-gray-100 relative group overflow-hidden">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">Up Next in Line</p>
            <div className="flex items-center justify-center gap-6">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center text-2xl font-black text-gray-800">
                {nextPatient.queueNumber}
              </div>
              <div className="text-left">
                <h3 className="text-xl font-black text-gray-900">{nextPatient.patientName}</h3>
                <p className="text-sm font-bold text-gray-400">Scheduled for {nextPatient.timeSlot}</p>
              </div>
            </div>
            <div className="mt-8">
              <button
                onClick={onNext}
                className="w-full bg-blue-600 text-white py-4 rounded-3xl font-bold shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 group"
              >
                Start Next Consultation
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-[40px] p-8 border border-gray-100">
            <p className="text-gray-400 font-bold italic">No more patients in your queue.</p>
          </div>
        )}

        <div className="pt-4">
          <button onClick={onDashboard} className="text-gray-400 hover:text-gray-600 font-bold text-sm flex items-center gap-2 mx-auto transition-colors">
            <LogOut size={16} /> Exit to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

// Reusable Sub-components
const ContextItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-4">
    <div className="mt-1 text-slate-400">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">{label}</p>
      <p className="text-sm font-semibold text-slate-700 break-words break-all whitespace-pre-wrap">{value || 'N/A'}</p>
    </div>
  </div>
);

const ModuleCard = ({ icon, title, desc }) => (
  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
    <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-tight">{desc}</p>
  </div>
);

export default ConsultationDesk;
