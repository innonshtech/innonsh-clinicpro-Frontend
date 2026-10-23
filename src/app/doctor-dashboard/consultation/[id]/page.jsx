'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { API_BASE_URL } from '@/utils/api';
import {
  ArrowLeft, User, Activity, FileText, Pill,
  Plus, X, CheckCircle, Clock, Save, Play, RefreshCw,
  AlertCircle, History, MessageSquare, Clipboard,
  ChevronRight, ChevronDown, Sparkles, LogOut, ArrowRight, Stethoscope, Phone, Search, Calendar, Settings, Brain
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
  const [startError, setStartError] = useState(null);

  // Secondary panel state (collapsible / tabbed)
  const [secondaryTab, setSecondaryTab] = useState('summary'); // 'summary' | 'labs' | 'history'
  const [isSecondaryOpen, setIsSecondaryOpen] = useState(true);

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

  // Simulated Global Medicine Database
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

    let results = MEDICINE_DB.filter(m =>
      m.name.toLowerCase().includes(q.toLowerCase()) ||
      m.cat?.toLowerCase().includes(q.toLowerCase())
    );

    if (results.length === 0 || !results.some(r => r.name.toLowerCase() === q.toLowerCase())) {
      results.push({
        name: q,
        dosage: '',
        duration: '',
        cat: 'Custom Molecule',
        isNew: true
      });
    }

    setMedResults(results.slice(0, 8));
    setShowMedResults(true);
  };

  const selectMedicine = (med) => {
    setFormData(prev => ({
      ...prev,
      medicines: [...prev.medicines, { ...med, instructions: med.instructions || '' }]
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

  // Clinical Reasoning Engine
  useEffect(() => {
    const analyzeSymptoms = () => {
      setIsAiAnalyzing(true);
      const text = (formData.symptoms + ' ' + formData.clinicalNotes + ' ' + formData.diagnosis).toLowerCase();

      let medSugs = [];
      let labSugs = [];

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
  const [aiError, setAiError] = useState(null);
  const [aiSuccess, setAiSuccess] = useState(null);

  const handleGenerateSummary = async () => {
    setIsAiProcessing(true);
    setAiError(null);
    setAiSuccess(null);
    try {
      const summary = await generateClinicalSummary(formData.symptoms, formData.clinicalNotes, formData.diagnosis);
      if (summary) {
        setFormData(prev => ({ ...prev, clinicalNotes: (prev.clinicalNotes + '\n\nSUMMARY: ' + summary).trim() }));
        setAiSuccess('Clinical summary successfully generated and appended to clinical observations.');
        setTimeout(() => setAiSuccess(null), 6000);
      }
    } catch (error) {
      console.warn("AI Summary handled gracefully:", error);
      setAiError(error.message || 'Gemini service is currently unavailable. You may continue manual notes.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleDeepAIScan = async () => {
    setIsAiProcessing(true);
    setAiError(null);
    setAiSuccess(null);
    try {
      const insights = await getClinicalInsights(formData.symptoms, formData.clinicalNotes, formData.diagnosis);

      if (insights?.medicines) {
        const existingNames = formData.medicines.map(m => m.name.toLowerCase());
        const newMeds = insights.medicines.filter(m => !existingNames.includes(m.name.toLowerCase()));
        setAiSuggestions(newMeds.slice(0, 3));
      }

      if (insights?.labs) {
        setLabSuggestions(insights.labs);
      }
      setAiSuccess('Clinical reasoning completed: suggestions updated.');
      setTimeout(() => setAiSuccess(null), 5000);
    } catch (error) {
      console.warn("Deep Scan handled gracefully:", error);
      setAiError("Deep Scan notice: " + (error.message || 'AI service unavailable.') + " Manual workflow is unaffected.");
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
          const vId = visit.id || visit._id;
          setVisitId(vId);
          setFormData({
            symptoms: visit.symptoms || '',
            diagnosis: visit.diagnosis || '',
            clinicalNotes: visit.clinicalNotes || visit.notes || '',
            medicines: visit.medicines?.length > 0 ? visit.medicines : [],
            followUpDate: visit.followUpDate || visit.follow_up_date || '',
            followUpNotes: visit.followUpNotes || visit.follow_up_notes || ''
          });
        } else if (appointment?.status === 'completed') {
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
      const res = await fetch(`${API_BASE_URL}/api/v1/queue/${userData.id || userData._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success && result.data?.next) {
        setNextPatient(result.data.next);
      }
    } catch (err) {
      console.error("Next Patient Fetch Error:", err);
    }
  };

  useEffect(() => {
    if (id) fetchConsultation();
  }, [id]);

  // Robust consultation initialization with loading, validation, and error states
  const startConsultation = async () => {
    if (isSubmitting || visitId) return;

    setStartError(null);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token')?.trim();
      const userStr = localStorage.getItem('user');
      const userData = JSON.parse(userStr || "{}");

      const apptId = id || data?.appointment?.id || data?.appointment?._id;
      const patientId = data?.patient?._id || data?.patient?.id || data?.appointment?.patient_id;
      const doctorId = data?.appointment?.doctor_id || userData?.id || userData?._id;
      const clinicId = data?.appointment?.clinic_id || userData?.clinicId;

      if (!apptId) {
        throw new Error('Appointment identifier is missing.');
      }
      if (!patientId) {
        throw new Error('Patient record could not be resolved from appointment.');
      }
      if (!doctorId) {
        throw new Error('Doctor session credentials could not be verified.');
      }

      const payload = {
        appointment_id: apptId,
        doctor_id: doctorId,
        patient_id: patientId,
        clinicId: clinicId
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/visit/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json().catch(() => ({}));

      if (res.ok && result.success && (result.data?.visit || result.data)) {
        const returnedVisit = result.data.visit || result.data;
        const newVisitId = returnedVisit.id || returnedVisit._id || returnedVisit.visit_id;

        if (!newVisitId) {
          throw new Error('Session created but visit ID was not returned by server.');
        }

        setVisitId(newVisitId);
        setData(prev => ({
          ...prev,
          appointment: {
            ...prev?.appointment,
            status: 'in_progress'
          },
          visit: returnedVisit
        }));
        setStartError(null);
      } else {
        const errMsg = result.message || result.error || 'Unable to start consultation session.';
        setStartError(errMsg);
      }
    } catch (error) {
      console.error("Start Consultation Error:", error);
      setStartError(error.message || 'An error occurred while starting the consultation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveProgress = async () => {
    if (!visitId) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token')?.trim();

      await fetch(`${API_BASE_URL}/api/v1/visit/${visitId}`, {
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

    const clinicId = user.clinicId?._id || user.clinicId || 'default';
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
      const confirm = window.confirm("Diagnosis is currently empty. Complete consultation anyway?");
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
        alert('Error completing consultation: ' + (result.message || 'Server error'));
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-600 font-medium text-sm">Loading Consultation Desk...</p>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <CompletionHub
        patientName={`${data?.patient?.firstName || ''} ${data?.patient?.lastName || ''}`}
        nextPatient={nextPatient}
        onDashboard={() => router.push('/doctor-dashboard')}
        onNext={() => {
          setIsCompleted(false);
          router.push(`/doctor-dashboard/consultation/${nextPatient.appointmentId}`);
        }}
      />
    );
  }

  if (!data) return null;
  const { appointment, patient, history } = data;
  const patientAge = calculateAge(patient?.dateOfBirth);
  const statusNormalized = (appointment?.status || '').toLowerCase().replace(/_/g, ' ');

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans flex flex-col">
      {/* ─────────────────────────────────────────────────────────
         1. TOP SECTION / HEADER CARD (Matching Lab Orders Style)
      ───────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Title & Patient Context */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/doctor-dashboard/appointments')}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
                title="Back to Appointments"
                id="btn-back-appointments"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Doctor Consultation</h1>
                  
                  {/* Status Badge */}
                  {visitId ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      In Progress
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      {statusNormalized.toUpperCase() || 'WAITING'}
                    </span>
                  )}

                  {patient?.patientCode && (
                    <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                      {patient.patientCode}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
              <button
                onClick={() => setShowAiSettings(true)}
                className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors border border-slate-200 text-xs font-medium flex items-center gap-1.5"
                title="AI Settings"
              >
                <Settings size={15} />
                <span className="hidden sm:inline">AI Settings</span>
              </button>

              <button
                onClick={handleDeepAIScan}
                disabled={isAiProcessing}
                className="px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200/60 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Run Gemini Clinical Reasoning"
              >
                <Sparkles size={14} className={isAiProcessing ? 'animate-spin' : ''} />
                <span>Deep Scan</span>
              </button>

              {!visitId ? (
                <button
                  id="btn-header-start-consult"
                  onClick={startConsultation}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                  <span>{isSubmitting ? 'Starting...' : 'Start Consultation'}</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={saveProgress}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Draft Save</span>
                  </button>
                  <button
                    onClick={completeConsultation}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    <span>Complete Visit</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
         MAIN CONTENT CONTAINER
      ───────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 w-full space-y-6 flex-1">
        
        {/* ─────────────────────────────────────────────────────────
           2. PATIENT INFORMATION CARD (Compact, readable, responsive)
        ───────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            
            {/* Identity & Blood Group */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-base shrink-0 border border-blue-100 shadow-xs">
                {patient?.firstName?.[0] || 'P'}{patient?.lastName?.[0] || ''}
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 truncate">
                  {patient?.firstName} {patient?.lastName}
                </h2>
                <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <span>{patientAge} Yrs</span>
                  <span>•</span>
                  <span>{patient?.gender || 'N/A'}</span>
                  <span>•</span>
                  <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                    {patient?.bloodGroup || 'Blood: N/A'}
                  </span>
                </p>
              </div>
            </div>

            {/* Contact details */}
            <div className="text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block">Contact Information</span>
              <p className="flex items-center gap-1.5 font-medium text-slate-800">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{patient?.phoneNumber || 'No phone recorded'}</span>
              </p>
            </div>

            {/* Allergies Highlight */}
            <div className="text-xs space-y-1">
              <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block">Allergies</span>
              <div className="flex items-center gap-1.5">
                <AlertCircle className={`w-3.5 h-3.5 ${patient?.allergies ? 'text-rose-500' : 'text-slate-400'} shrink-0`} />
                <span className={`font-semibold ${patient?.allergies ? 'text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200' : 'text-slate-500'}`}>
                  {patient?.allergies || 'No known allergies'}
                </span>
              </div>
            </div>

            {/* Chronic Conditions */}
            <div className="text-xs space-y-1">
              <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block">Medical History / Chronic</span>
              <p className="font-medium text-slate-800 line-clamp-2" title={patient?.medicalHistory || 'None recorded'}>
                {patient?.medicalHistory || 'None recorded'}
              </p>
            </div>

          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────
           3. PRIMARY WORKING AREA (Main EMR Findings + Prescription)
        ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ───────────────────────────────────────────────────────
             MAIN SECTION: Clinical Findings / EMR (7 Cols)
          ─────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
              
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Clinical Findings (EMR)</h3>
                    <p className="text-[11px] text-slate-400">Record chief complaints, clinical observations, and diagnosis</p>
                  </div>
                </div>

                {visitId && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    {isSaving ? <RefreshCw className="w-3 h-3 animate-spin text-blue-600" /> : <Save className="w-3 h-3 text-emerald-500" />}
                    <span>{isSaving ? 'Saving draft...' : 'Auto-save active'}</span>
                  </span>
                )}
              </div>

              {/* Consultation Not Started: Prominent Play Button & Clean CTA */}
              {!visitId ? (
                <div className="py-12 px-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-4">
                  
                  {/* Big Interactive Play Button */}
                  <button
                    type="button"
                    id="btn-play-consultation-icon"
                    onClick={startConsultation}
                    disabled={isSubmitting}
                    className="w-16 h-16 mx-auto bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-500/25 flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer group"
                    title="Click to Start Consultation"
                    aria-label="Start Consultation"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <Play className="w-7 h-7 fill-white translate-x-0.5 group-hover:scale-110 transition-transform" />
                    )}
                  </button>

                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="text-base font-bold text-slate-800">Consultation Not Started</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Click the Play button above or below to initialize the session. This will transition the patient to active consultation and unlock the clinical EMR record.
                    </p>
                  </div>

                  {/* Inline Error Alert */}
                  {startError && (
                    <div className="max-w-md mx-auto p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-left flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-bold block">Initialization Error:</span>
                        <span>{startError}</span>
                      </div>
                      <button
                        onClick={startConsultation}
                        className="text-xs font-bold text-rose-700 underline hover:text-rose-900 shrink-0"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  <div>
                    <button
                      type="button"
                      id="btn-start-consultation-primary"
                      onClick={startConsultation}
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer inline-flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Initializing Session...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Start Consultation</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Active Consultation Form */
                <div className="space-y-4">
                  {/* Chief Complaints */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Chief Complaints (Subjective) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="input-chief-complaints"
                      value={formData.symptoms || ''}
                      onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                      onBlur={saveProgress}
                      rows={3}
                      placeholder="e.g. Fever for 3 days, dry cough, localized abdominal pain..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors outline-none"
                    />
                  </div>

                  {/* Observations */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Clinical Observations &amp; Physical Examination (Objective)
                    </label>
                    <textarea
                      id="input-observations"
                      value={formData.clinicalNotes || ''}
                      onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                      onBlur={saveProgress}
                      rows={3}
                      placeholder="e.g. Temp: 101F, BP: 120/80 mmHg, Chest clear on auscultation..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors outline-none"
                    />
                  </div>

                  {/* Diagnosis */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Assessment &amp; Diagnosis <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="input-diagnosis"
                      type="text"
                      value={formData.diagnosis || ''}
                      onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                      onBlur={saveProgress}
                      placeholder="e.g. Acute Viral Bronchitis / Type 2 Diabetes Mellitus"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors outline-none"
                    />
                  </div>

                  {/* Follow-up Plan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                        Follow-up Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          id="input-followup-date"
                          type="date"
                          value={formData.followUpDate || ''}
                          onChange={(e) => {
                            setFormData({ ...formData, followUpDate: e.target.value });
                            saveProgress();
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                        Follow-up Instructions
                      </label>
                      <input
                        id="input-followup-notes"
                        type="text"
                        value={formData.followUpNotes || ''}
                        onChange={(e) => setFormData({ ...formData, followUpNotes: e.target.value })}
                        onBlur={saveProgress}
                        placeholder="e.g. Review after blood test reports"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ───────────────────────────────────────────────────────
             PRESCRIPTION SECTION (5 Cols)
          ─────────────────────────────────────────────────────── */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col min-h-[520px]">
              
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Prescription Pad</h3>
                    <p className="text-[11px] text-slate-400">Search and configure medications, dosage, and duration</p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                  {formData.medicines.length} Meds
                </span>
              </div>

              {/* Medicine Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="input-search-medicine"
                  type="text"
                  placeholder="Search medication (e.g. Paracetamol, Amoxicillin...)"
                  value={medQuery}
                  onChange={(e) => handleMedSearch(e.target.value)}
                  onFocus={() => medQuery && setShowMedResults(true)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors outline-none"
                />
                {medQuery && (
                  <button
                    onClick={() => { setMedQuery(''); setShowMedResults(false); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Dropdown Results */}
                {showMedResults && medResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden max-h-60 overflow-y-auto">
                    {medResults.map((med, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectMedicine(med)}
                        className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-0 transition-colors text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{med.name}</p>
                          <span className="text-[10px] text-slate-400">{med.cat || 'Standard Formulation'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {med.dosage && (
                            <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {med.dosage}
                            </span>
                          )}
                          <Plus className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Recommendations Pills */}
              {aiSuggestions.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-1.5 text-blue-700 text-[10px] font-bold uppercase tracking-wider mb-2">
                    <Sparkles className="w-3 h-3" />
                    <span>AI Suggested Medicines</span>
                    {isAiAnalyzing && <RefreshCw className="w-2.5 h-2.5 animate-spin ml-auto" />}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {aiSuggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectMedicine(sug)}
                        className="px-2.5 py-1 bg-white hover:bg-blue-100 hover:text-blue-800 text-slate-700 border border-blue-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                        title={sug.reason}
                      >
                        <span>{sug.name}</span>
                        <Plus className="w-3 h-3 text-blue-600" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Added Medicines List */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[360px] pr-1">
                {formData.medicines.length > 0 ? (
                  formData.medicines.map((med, index) => (
                    <div key={index} className="p-3 bg-slate-50 rounded-xl border border-slate-200 relative group space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          className="w-full bg-white font-bold text-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 text-xs"
                          placeholder="Medicine Name & Strength"
                          value={med.name}
                          onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                          onBlur={saveProgress}
                        />
                        <button
                          type="button"
                          onClick={() => removeMedicine(index)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove Medicine"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          className="w-full bg-white text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 text-[11px]"
                          placeholder="Dosage (e.g. 1-0-1)"
                          value={med.dosage}
                          onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                          onBlur={saveProgress}
                        />
                        <input
                          className="w-full bg-white text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 text-[11px]"
                          placeholder="Duration (e.g. 5 days)"
                          value={med.duration}
                          onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                          onBlur={saveProgress}
                        />
                      </div>

                      <input
                        className="w-full bg-white text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 text-[11px]"
                        placeholder="Instructions (e.g. After Food, with warm water)"
                        value={med.instructions || ''}
                        onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                        onBlur={saveProgress}
                      />
                    </div>
                  ))
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <Pill className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No medicines prescribed yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Search above or click recommendations to add drugs</p>
                  </div>
                )}
              </div>

              {/* Prescription Footer Actions */}
              <div className="pt-4 border-t border-slate-100 mt-auto space-y-2">
                <button
                  type="button"
                  onClick={addMedicine}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Medicine Row</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleWhatsAppRx}
                    className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Rx</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintRx}
                    className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Print Rx</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* ─────────────────────────────────────────────────────────
           4. SECONDARY INFORMATION SECTION (Collapsible / Tabbed Area)
        ───────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Header & Section Tabs */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clipboard className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900">Clinical Support &amp; Historical Records</h3>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => { setSecondaryTab('summary'); setIsSecondaryOpen(true); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  secondaryTab === 'summary' && isSecondaryOpen
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                AI Clinical Summary
              </button>

              <button
                type="button"
                onClick={() => { setSecondaryTab('labs'); setIsSecondaryOpen(true); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  secondaryTab === 'labs' && isSecondaryOpen
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Diagnostic Tests ({labSuggestions.length})
              </button>

              <button
                type="button"
                onClick={() => { setSecondaryTab('history'); setIsSecondaryOpen(true); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  secondaryTab === 'history' && isSecondaryOpen
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Visit History ({history?.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setIsSecondaryOpen(!isSecondaryOpen)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 ml-2"
                title={isSecondaryOpen ? 'Collapse section' : 'Expand section'}
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSecondaryOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Collapsible Tab Body */}
          {isSecondaryOpen && (
            <div className="p-5">
              {/* Tab 1: AI Clinical Summary */}
              {secondaryTab === 'summary' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Google Gemini Clinical Summary</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Synthesizes current symptoms, examination observations, and assessment into a structured medical discharge summary.
                      </p>
                    </div>
                    <button
                      type="button"
                      id="btn-generate-ai-summary"
                      onClick={handleGenerateSummary}
                      disabled={isAiProcessing}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      {isAiProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>{isAiProcessing ? 'Synthesizing...' : 'Generate AI Summary'}</span>
                    </button>
                  </div>

                  {aiSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between gap-2 animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{aiSuccess}</span>
                      </div>
                      <button onClick={() => setAiSuccess(null)} className="text-emerald-700 hover:text-emerald-900 p-1">
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {aiError && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start justify-between gap-3 animate-in fade-in">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-bold">AI Summary Notice</p>
                          <p className="text-amber-800">{aiError}</p>
                          <p className="text-[11px] text-amber-700">
                            Manual documentation, Draft Save, prescriptions, and completing the visit remain fully available.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowAiSettings(true)}
                          className="px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-[11px] font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
                        >
                          AI Settings
                        </button>
                        <button
                          type="button"
                          onClick={() => setAiError(null)}
                          className="p-1 text-amber-600 hover:text-amber-800"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Diagnostic & Lab Tests */}
              {secondaryTab === 'labs' && (
                <div>
                  {labSuggestions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {labSuggestions.map((lab, idx) => (
                        <div
                          key={idx}
                          onClick={() => selectLabTest(lab)}
                          className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-amber-100/80 transition-colors"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900">{lab.name}</p>
                            <p className="text-[10px] text-amber-800 mt-0.5">{lab.reason}</p>
                          </div>
                          <Plus className="w-4 h-4 text-amber-700 group-hover:scale-110 transition-transform shrink-0" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic text-center py-6">
                      No diagnostic tests currently suggested. Enter symptoms to trigger automated clinical lab recommendations.
                    </p>
                  )}
                </div>
              )}

              {/* Tab 3: Visit History & Past Records */}
              {secondaryTab === 'history' && (
                <div className="space-y-4">
                  {patient?.lastVisitSummary && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Last Clinical Outcome / Diagnosis:
                      </span>
                      <p className="text-xs text-slate-800">{patient.lastVisitSummary}</p>
                    </div>
                  )}

                  {history?.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                      {history.map((h, i) => (
                        <div key={h.id || i} className="p-3 flex items-center justify-between bg-white">
                          <div>
                            <span className="font-semibold text-slate-800">
                              Appointment #{h.id?.slice(0, 8)}
                            </span>
                            <span className="text-slate-400 text-[11px] block">
                              {h.appointment_date ? new Date(h.appointment_date).toLocaleDateString() : 'N/A'} • {h.time_slot || 'Regular'}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-semibold text-[10px] border border-emerald-200">
                            {h.status?.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic text-center py-4">
                      No prior visit history recorded for this patient.
                    </p>
                  )}

                  <div className="text-right">
                    <button
                      onClick={() => router.push(`/doctor-dashboard/patients/${patient?._id || patient?.id}?fromConsultation=${id}`)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                    >
                      <span>View Full Patient Medical Timeline</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────
         AI SETTINGS MODAL
      ───────────────────────────────────────────────────────── */}
      {showAiSettings && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">AI Intelligence Settings</h3>
              </div>
              <button
                onClick={() => setShowAiSettings(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Enter your <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold underline">Google Gemini API Key</a> to enable automated diagnostic reasoning and instant clinical discharge summaries.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  placeholder="Paste your Gemini API key..."
                  defaultValue={typeof window !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') || '' : ''}
                  id="gemini_key_input"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAiSettings(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const key = document.getElementById('gemini_key_input')?.value || '';
                    localStorage.setItem('GEMINI_API_KEY', key);
                    setShowAiSettings(false);
                  }}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
                >
                  Save Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// ─────────────────────────────────────────────────────────
// COMPLETION HUB COMPONENT
// ─────────────────────────────────────────────────────────
const CompletionHub = ({ patientName, nextPatient, onDashboard, onNext }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200/60 shadow-xs">
          <CheckCircle size={32} />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Consultation Completed!</h2>
          <p className="text-xs text-slate-500">
            The clinical encounter record for <strong className="text-slate-800">{patientName}</strong> has been finalized and saved.
          </p>
        </div>

        {nextPatient ? (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">Up Next in Queue</span>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-800 shadow-xs">
                {nextPatient.queueNumber}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{nextPatient.patientName}</h4>
                <p className="text-xs text-slate-500">Scheduled: {nextPatient.timeSlot || 'General Queue'}</p>
              </div>
            </div>
            <button
              onClick={onNext}
              className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Call Next Patient</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 italic">
            No further patients waiting in your queue.
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={onDashboard}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 transition-colors"
          >
            <LogOut size={14} />
            <span>Return to Doctor Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsultationDesk;
