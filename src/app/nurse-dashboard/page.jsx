'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import {
  HeartPulse,
  User,
  BedDouble,
  LogOut,
  RefreshCw,
  AlertCircle,
  Building2,
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  ShieldAlert,
  Activity,
  Phone,
  FileText,
  ArrowLeft,
  Send,
  PlusCircle,
  Check,
  Stethoscope,
  ChevronRight,
  ClipboardList,
  Thermometer,
  AlertTriangle,
  Scale,
  Droplets,
  ArrowDownRight,
  ArrowUpRight,
  Ban,
  X,
  Plus,
} from 'lucide-react';
import { evaluateVitals, STATUS } from '@/utils/vitalsEvaluation';
import VitalsTrendChart from '@/components/VitalsTrendChart';
import VitalsScheduleCard from '@/components/VitalsScheduleCard';

/**
 * Normalizes doctor name to avoid duplicate prefixes like "Dr. Dr. Clinic Doctor".
 * Does not alter persisted clinician names.
 */
export function formatDoctorName(name) {
  if (!name) return 'Dr. Doctor';
  let cleaned = String(name).trim();
  while (/^(dr\.?|doctor)\s+/i.test(cleaned)) {
    cleaned = cleaned.replace(/^(dr\.?|doctor)\s+/i, '').trim();
  }
  return cleaned ? `Dr. ${cleaned}` : 'Dr. Doctor';
}

/**
 * Formats room number or returns null if no valid room value exists.
 */
export function formatRoomDisplay(roomNumber) {
  if (!roomNumber || !String(roomNumber).trim()) return null;
  const trimmed = String(roomNumber).trim();
  if (/^room\b/i.test(trimmed)) return trimmed;
  return `Room ${trimmed}`;
}

export default function NurseDashboardPage() {
  const router = useRouter();

  const [nurseData, setNurseData] = useState(null);
  const [admissions, setAdmissions] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ipdDisabled, setIpdDisabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected patient & care views
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [activeCareTab, setActiveCareTab] = useState('vitals'); // 'vitals' | 'notes'

  // Nursing Notes state
  const [nursingNotes, setNursingNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteSuccessMsg, setNoteSuccessMsg] = useState('');
  const [noteErrorMsg, setNoteErrorMsg] = useState('');
  const [noteForm, setNoteForm] = useState({
    noteType: 'Nursing Note',
    patientCondition: 'Stable',
    observations: '',
    interventions: '',
    handoverNotes: ''
  });

  // Nurse Vitals state
  const [nurseVitals, setNurseVitals] = useState([]);
  const [loadingVitals, setLoadingVitals] = useState(false);
  const [isSubmittingVitals, setIsSubmittingVitals] = useState(false);
  const [vitalsSuccessMsg, setVitalsSuccessMsg] = useState('');
  const [vitalsErrorMsg, setVitalsErrorMsg] = useState('');
  const [vitalsCriticalAlert, setVitalsCriticalAlert] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({
    bp_systolic: '',
    bp_diastolic: '',
    pulse: '',
    temperature: '',
    temperature_unit: 'C',
    respiratory_rate: '',
    spo2: '',
    blood_glucose: '',
    glucose_context: 'fasting',
    pain_score: '',
    weight: ''
  });
  const [vitalsSchedule, setVitalsSchedule] = useState(null);

  // Intake / Output state
  const [intakeOutputs, setIntakeOutputs] = useState([]);
  const [ioSummary, setIoSummary] = useState(null);
  const [selectedIoDate, setSelectedIoDate] = useState(new Date().toISOString().slice(0, 10));
  const [availableIoDates, setAvailableIoDates] = useState([]);
  const [loadingIo, setLoadingIo] = useState(false);
  const [isSubmittingIo, setIsSubmittingIo] = useState(false);
  const [ioSuccessMsg, setIoSuccessMsg] = useState('');
  const [ioErrorMsg, setIoErrorMsg] = useState('');
  const [ioForm, setIoForm] = useState({
    direction: 'intake',
    category: 'Oral fluids',
    amount: '',
    remarks: '',
    recorded_at: ''
  });
  const [voidingEntry, setVoidingEntry] = useState(null);
  const [voidReasonText, setVoidReasonText] = useState('');
  const [isVoidingSubmitting, setIsVoidingSubmitting] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userStr || !token) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'nurse') {
        router.push('/login');
        return;
      }
      setNurseData(user);
      fetchNurseDashboard(user);
    } catch (err) {
      console.error('Error parsing user session:', err);
      router.push('/login');
    }
  }, []);

  const fetchNurseDashboard = async (user) => {
    setLoading(true);
    setError('');
    setIpdDisabled(false);
    const clinicId = user.clinicId || user.clinic_id || user.clinic?.id;

    if (!clinicId) {
      setError('Clinic association missing for this nurse account');
      setLoading(false);
      return;
    }

    try {
      const [admRes, wardsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/ipd/admissions?clinicId=${clinicId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${API_BASE_URL}/api/v1/ipd/wards?clinicId=${clinicId}`, {
          headers: getAuthHeaders()
        })
      ]);

      const admData = await admRes.json();
      const wardsData = await wardsRes.json();

      if (admRes.status === 403 && (admData.errorCode === 'IPD_MODULE_DISABLED' || admData.message?.includes('not enabled'))) {
        setIpdDisabled(true);
        setLoading(false);
        return;
      }

      if (admRes.ok && admData.success) {
        setAdmissions(admData.data?.admissions || []);
      } else if (!admRes.ok) {
        setError(admData.message || 'Failed to load assigned inpatient roster');
      }

      if (wardsRes.ok && wardsData.success) {
        setWards(wardsData.data?.wards || []);
      }
    } catch (err) {
      console.error('Error fetching nurse data:', err);
      setError('Failed to load assigned inpatient roster');
    } finally {
      setLoading(false);
    }
  };

  const fetchNursingNotes = async (admissionId) => {
    if (!admissionId || !nurseData) return;
    setLoadingNotes(true);
    setNoteErrorMsg('');
    const clinicId = nurseData.clinicId || nurseData.clinic_id || nurseData.clinic?.id;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}/nursing-notes?clinicId=${clinicId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNursingNotes(data.data?.notes || []);
      } else {
        setNursingNotes([]);
      }
    } catch (err) {
      console.error('Error fetching nursing notes:', err);
    } finally {
      setLoadingNotes(false);
    }
  };

  const fetchNurseVitals = async (admissionId) => {
    if (!admissionId || !nurseData) return;
    setLoadingVitals(true);
    setVitalsErrorMsg('');
    const clinicId = nurseData.clinicId || nurseData.clinic_id || nurseData.clinic?.id;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}/vitals?clinicId=${clinicId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNurseVitals(data.data?.vitals || []);
        if (data.data?.schedule) {
          setVitalsSchedule(data.data.schedule);
        }
      } else {
        setNurseVitals([]);
      }
    } catch (err) {
      console.error('Error fetching nurse vitals:', err);
    } finally {
      setLoadingVitals(false);
    }
  };

  const fetchIntakeOutput = async (admissionId, dateOverride = null) => {
    if (!admissionId || !nurseData) return;
    setLoadingIo(true);
    setIoErrorMsg('');
    const clinicId = nurseData.clinicId || nurseData.clinic_id || nurseData.clinic?.id;
    const targetDate = dateOverride !== null ? dateOverride : selectedIoDate;
    const dateParam = targetDate ? `&date=${targetDate}` : '';

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}/intake-output?clinicId=${clinicId}${dateParam}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIntakeOutputs(data.data?.entries || []);
        setIoSummary(data.data?.summary || null);
        if (data.data?.availableDates) {
          setAvailableIoDates(data.data.availableDates);
        }
      } else {
        setIntakeOutputs([]);
        setIoSummary(null);
      }
    } catch (err) {
      console.error('Error fetching fluid intake/output records:', err);
    } finally {
      setLoadingIo(false);
    }
  };

  const handleSelectPatient = (adm) => {
    setSelectedAdmission(adm);
    setNoteSuccessMsg('');
    setNoteErrorMsg('');
    setVitalsSuccessMsg('');
    setVitalsErrorMsg('');
    setVitalsCriticalAlert(false);
    setIoSuccessMsg('');
    setIoErrorMsg('');

    setNoteForm({
      noteType: 'Nursing Note',
      patientCondition: 'Stable',
      observations: '',
      interventions: '',
      handoverNotes: ''
    });

    setVitalsForm({
      bp_systolic: '',
      bp_diastolic: '',
      pulse: '',
      temperature: '',
      temperature_unit: 'C',
      respiratory_rate: '',
      spo2: '',
      blood_glucose: '',
      glucose_context: 'fasting',
      pain_score: '',
      weight: ''
    });

    setIoForm({
      direction: 'intake',
      category: 'Oral fluids',
      amount: '',
      remarks: '',
      recorded_at: ''
    });
    setVoidingEntry(null);
    setVoidReasonText('');

    fetchNursingNotes(adm.id);
    fetchNurseVitals(adm.id);
    fetchIntakeOutput(adm.id);
  };

  const handleSaveIntakeOutput = async (e) => {
    e.preventDefault();
    if (isSubmittingIo || !selectedAdmission || !nurseData) return;

    setIoSuccessMsg('');
    setIoErrorMsg('');

    const amt = parseFloat(ioForm.amount);
    if (!ioForm.amount || isNaN(amt) || amt <= 0) {
      setIoErrorMsg('Please enter a positive measurable amount in mL (greater than zero).');
      return;
    }

    if (!ioForm.category) {
      setIoErrorMsg('Please select a valid category.');
      return;
    }

    setIsSubmittingIo(true);
    const clinicId = nurseData.clinicId || nurseData.clinic_id || nurseData.clinic?.id;

    try {
      const payload = {
        clinicId,
        direction: ioForm.direction,
        category: ioForm.category,
        amount: amt,
        remarks: ioForm.remarks.trim() || undefined
      };
      if (ioForm.recorded_at) {
        payload.recorded_at = new Date(ioForm.recorded_at).toISOString();
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${selectedAdmission.id}/intake-output`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setIoErrorMsg(data.message || 'Failed to record intake/output entry.');
      } else {
        setIoSuccessMsg(`Successfully recorded ${ioForm.direction} entry of ${amt} mL (${ioForm.category}).`);
        setIoForm({
          direction: ioForm.direction,
          category: ioForm.direction === 'intake' ? 'Oral fluids' : 'Urine',
          amount: '',
          remarks: '',
          recorded_at: ''
        });
        await fetchIntakeOutput(selectedAdmission.id);
      }
    } catch (err) {
      setIoErrorMsg(err.message || 'Network error occurred while saving.');
    } finally {
      setIsSubmittingIo(false);
    }
  };

  const handleVoidEntry = async () => {
    if (!voidingEntry || isVoidingSubmitting || !selectedAdmission || !nurseData) return;
    if (!voidReasonText.trim()) {
      setIoErrorMsg('A reason for voiding this entry is required.');
      return;
    }

    setIsVoidingSubmitting(true);
    const clinicId = nurseData.clinicId || nurseData.clinic_id || nurseData.clinic?.id;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${selectedAdmission.id}/intake-output/${voidingEntry.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          clinicId,
          isVoided: true,
          voidReason: voidReasonText.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setIoErrorMsg(data.message || 'Failed to void fluid entry.');
      } else {
        setIoSuccessMsg(`Entry (${voidingEntry.amount} mL ${voidingEntry.category}) voided successfully.`);
        setVoidingEntry(null);
        setVoidReasonText('');
        await fetchIntakeOutput(selectedAdmission.id);
      }
    } catch (err) {
      setIoErrorMsg(err.message || 'Error voiding fluid entry.');
    } finally {
      setIsVoidingSubmitting(false);
    }
  };

  const handleSaveNursingNote = async (e) => {
    e.preventDefault();
    if (isSubmittingNote || !selectedAdmission || !nurseData) return;

    const observations = noteForm.observations.trim();
    const interventions = noteForm.interventions.trim();
    const handover = noteForm.handoverNotes.trim();

    if (!observations && !interventions && !handover) {
      setNoteErrorMsg('Please enter nursing observations, care interventions, or handover notes.');
      return;
    }

    setIsSubmittingNote(true);
    setNoteErrorMsg('');
    setNoteSuccessMsg('');

    const clinicId = nurseData.clinicId || nurseData.clinic_id || nurseData.clinic?.id;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${selectedAdmission.id}/nursing-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          clinicId,
          noteType: noteForm.noteType,
          patientCondition: noteForm.patientCondition,
          nursingObservations: observations || undefined,
          interventions: interventions || undefined,
          handoverNotes: handover || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save nursing note');
      }

      setNoteSuccessMsg('Nursing note recorded successfully');
      setNoteForm({
        noteType: 'Nursing Note',
        patientCondition: 'Stable',
        observations: '',
        interventions: '',
        handoverNotes: ''
      });
      await fetchNursingNotes(selectedAdmission.id);
    } catch (err) {
      console.error('Error saving nursing note:', err);
      setNoteErrorMsg(err.message || 'Failed to save nursing note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleSaveVitals = async (e) => {
    e.preventDefault();
    if (isSubmittingVitals || !selectedAdmission || !nurseData) return;

    // Check that at least one valid measurement is entered (never silent 0)
    const hasSys = vitalsForm.bp_systolic !== '' && !isNaN(Number(vitalsForm.bp_systolic));
    const hasDia = vitalsForm.bp_diastolic !== '' && !isNaN(Number(vitalsForm.bp_diastolic));
    const hasPulse = vitalsForm.pulse !== '' && !isNaN(Number(vitalsForm.pulse));
    const hasTemp = vitalsForm.temperature !== '' && !isNaN(Number(vitalsForm.temperature));
    const hasResp = vitalsForm.respiratory_rate !== '' && !isNaN(Number(vitalsForm.respiratory_rate));
    const hasSpo2 = vitalsForm.spo2 !== '' && !isNaN(Number(vitalsForm.spo2));
    const hasGlucose = vitalsForm.blood_glucose !== '' && !isNaN(Number(vitalsForm.blood_glucose));
    const hasPain = vitalsForm.pain_score !== '' && !isNaN(Number(vitalsForm.pain_score));
    const hasWeight = vitalsForm.weight !== '' && !isNaN(Number(vitalsForm.weight));

    if (!hasSys && !hasDia && !hasPulse && !hasTemp && !hasResp && !hasSpo2 && !hasGlucose && !hasPain && !hasWeight) {
      setVitalsErrorMsg('Please record at least one valid vital measurement. Do not leave all fields empty.');
      return;
    }

    setIsSubmittingVitals(true);
    setVitalsErrorMsg('');
    setVitalsSuccessMsg('');
    setVitalsCriticalAlert(false);

    const clinicId = nurseData.clinicId || nurseData.clinic_id || nurseData.clinic?.id;

    const payload = {
      clinicId,
      temperature_unit: vitalsForm.temperature_unit || 'C'
    };

    if (hasSys) payload.bp_systolic = Number(vitalsForm.bp_systolic);
    if (hasDia) payload.bp_diastolic = Number(vitalsForm.bp_diastolic);
    if (hasPulse) payload.pulse = Number(vitalsForm.pulse);
    if (hasTemp) payload.temperature = Number(vitalsForm.temperature);
    if (hasResp) payload.respiratory_rate = Number(vitalsForm.respiratory_rate);
    if (hasSpo2) payload.spo2 = Number(vitalsForm.spo2);
    if (hasGlucose) {
      payload.blood_glucose = Number(vitalsForm.blood_glucose);
      payload.glucose_context = vitalsForm.glucose_context || 'fasting';
    }
    if (hasPain) payload.pain_score = Number(vitalsForm.pain_score);
    if (hasWeight) payload.weight = Number(vitalsForm.weight);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${selectedAdmission.id}/vitals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to record vital signs');
      }

      const savedRecord = data.data?.vital;
      setVitalsSuccessMsg('Patient vital signs recorded and evaluated successfully.');
      if (savedRecord?.has_critical) {
        setVitalsCriticalAlert(true);
      }

      setVitalsForm({
        bp_systolic: '',
        bp_diastolic: '',
        pulse: '',
        temperature: '',
        temperature_unit: 'C',
        respiratory_rate: '',
        spo2: '',
        blood_glucose: '',
        glucose_context: 'fasting',
        pain_score: '',
        weight: ''
      });

      await fetchNurseVitals(selectedAdmission.id);
    } catch (err) {
      console.error('Error recording vitals:', err);
      setVitalsErrorMsg(err.message || 'Failed to record vital signs');
    } finally {
      setIsSubmittingVitals(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (_) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getStatusBadge = (status) => {
    if (!status) return null;
    switch (status) {
      case STATUS.CRITICAL:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            CRITICAL
          </span>
        );
      case STATUS.HIGH:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            HIGH
          </span>
        );
      case STATUS.LOW:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            LOW
          </span>
        );
      case STATUS.WITHIN_REFERENCE:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            WITHIN REFERENCE
          </span>
        );
      case STATUS.NOT_CONFIGURED:
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            REFERENCE NOT CONFIGURED
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading Nurse Care Dashboard...</p>
        </div>
      </div>
    );
  }

  if (ipdDisabled) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center">
          <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">IPD Module Disabled</h2>
          <p className="text-xs text-slate-500 mt-2">
            Inpatient department services are currently disabled for your clinic.
            Please contact your clinic administrator to activate the IPD module.
          </p>
          <button
            onClick={handleLogout}
            className="mt-5 w-full py-2 px-4 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  const nurseId = nurseData?.id || nurseData?._id;
  const nurseWardId = nurseData?.wardId || nurseData?.ward_id;
  const assignedWard = wards.find(w => w.id === nurseWardId);
  const wardName = assignedWard ? `${assignedWard.name} (${assignedWard.type})` : 'Assigned Ward';

  // Inpatients assigned to this nurse (and strictly belonging to assigned ward)
  const myAssignedInpatients = admissions.filter((adm) => {
    const isMyPatient = (adm.assigned_nurse_id || adm.assignedNurseId || adm.nurse_id || adm.nurseId) === nurseId;
    const isMyWard = !nurseWardId || adm.ward_id === nurseWardId || adm.wardId === nurseWardId;
    return isMyPatient && isMyWard;
  });

  const activeInpatients = myAssignedInpatients.filter(a => a.status === 'admitted');
  const activeCount = activeInpatients.length;
  const maxCapacity = 20;
  const capacityPercent = Math.min(100, Math.round((activeCount / maxCapacity) * 100));
  const isCapacityFull = activeCount >= maxCapacity;

  // Search filter
  const filteredPatients = myAssignedInpatients.filter((adm) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const pName = (adm.patientName || '').toLowerCase();
    const admNum = (adm.admission_number || adm.admissionNumber || '').toLowerCase();
    const bNum = (adm.bedNumber || '').toLowerCase();
    return pName.includes(q) || admNum.includes(q) || bNum.includes(q);
  });

  const latestVital = nurseVitals.length > 0 ? nurseVitals[0] : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <HeartPulse className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-none">ClinicPro IPD</h1>
              <span className="text-xs text-slate-500 font-medium">Nurse Care Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900">
                {nurseData?.firstName || 'Nurse'} {nurseData?.lastName || ''}
              </p>
              <p className="text-[11px] text-slate-500">{wardName}</p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-rose-600 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Error notification */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Capacity & Ward Summary (Shown on main worklist view) */}
        {!selectedAdmission && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Ward Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Ward</p>
                <h2 className="text-lg font-bold text-slate-900 mt-1">{wardName}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Strict ward-scoped patient monitoring</p>
              </div>
              <span className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Building2 className="h-6 w-6" />
              </span>
            </div>

            {/* Active Patients Count */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Inpatients</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">{activeCount}</span>
                  <span className="text-xs text-slate-500">/ {maxCapacity} Max Capacity</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {maxCapacity - activeCount} capacity remaining
                </p>
              </div>
              <span className={`p-3 rounded-xl ${isCapacityFull ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                <BedDouble className="h-6 w-6" />
              </span>
            </div>

            {/* Capacity Meter Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nurse Capacity</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isCapacityFull ? 'bg-rose-100 text-rose-700' : activeCount >= 15 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {capacityPercent}%
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {isCapacityFull
                    ? 'Maximum capacity reached (20 patients). Admissions will block further assignments.'
                    : `${activeCount} out of 20 maximum active patients.`}
                </p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mt-3">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isCapacityFull ? 'bg-rose-500' : activeCount >= 15 ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${capacityPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 1: PATIENT WORKLIST ROSTER */}
        {!selectedAdmission ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Assigned Inpatient Worklist</h3>
                <p className="text-xs text-slate-500">Currently admitted inpatients under your primary nursing care in {wardName}</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient, bed, or admission #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {filteredPatients.length === 0 ? (
              <div className="p-12 text-center border-t border-slate-100">
                <HeartPulse className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-800">No assigned inpatients found</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? 'No patients matched your search filter.'
                    : 'You do not have any active inpatients currently assigned to your care roster.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border-t border-slate-100 -mx-5 -mb-5">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                      <th className="py-3 px-5">Patient Name / UHID</th>
                      <th className="py-3 px-5">Bed / Room</th>
                      <th className="py-3 px-5">Admitting Doctor</th>
                      <th className="py-3 px-5">Admission Date</th>
                      <th className="py-3 px-5">Diagnosis / Reason</th>
                      <th className="py-3 px-5">Status</th>
                      <th className="py-3 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPatients.map((adm) => {
                      const isAdmitted = adm.status === 'admitted';
                      const roomText = formatRoomDisplay(adm.roomNumber);

                      return (
                        <tr
                          key={adm.id}
                          onClick={() => handleSelectPatient(adm)}
                          className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                        >
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs uppercase">
                                {(adm.patientName || 'P').charAt(0)}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-900 block text-xs">
                                  {adm.patientName || 'Patient'}
                                </span>
                                <span className="text-[11px] font-mono text-blue-600">
                                  {adm.admission_number || adm.admissionNumber}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-5">
                            <div className="text-xs">
                              <span className="font-bold text-slate-800">Bed {adm.bedNumber}</span>
                              {roomText && (
                                <span className="text-slate-400 block text-[11px]">{roomText}</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-5 text-xs text-slate-700 font-medium">
                            {formatDoctorName(adm.admittingDoctorName)}
                          </td>

                          <td className="py-3.5 px-5 text-xs text-slate-500">
                            {new Date(adm.admission_date || adm.admissionDate).toLocaleDateString()}
                          </td>

                          <td className="py-3.5 px-5 text-xs text-slate-600 max-w-xs truncate">
                            {adm.provisional_diagnosis || adm.provisionalDiagnosis || 'General Inpatient Care'}
                          </td>

                          <td className="py-3.5 px-5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                isAdmitted
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {isAdmitted ? 'Active IPD' : 'Discharged'}
                            </span>
                            {adm.vitals_schedule?.frequency && (
                              <span className="block mt-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-center">
                                Q{adm.vitals_schedule.frequency.toUpperCase()} Vitals
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-5 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectPatient(adm);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-semibold transition"
                            >
                              <ClipboardList className="h-3.5 w-3.5" />
                              Care Chart
                              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* VIEW 2: PATIENT CARE CHART (VITALS OBSERVATIONS & NURSING NOTES) */
          <div className="space-y-6">
            {/* Top Navigation & Patient Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedAdmission(null)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-1.5 text-xs font-semibold"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Worklist
                  </button>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 leading-tight">
                      {selectedAdmission.patientName || 'Patient'}
                    </h2>
                    <p className="text-xs text-slate-500 font-mono">
                      {selectedAdmission.admission_number || selectedAdmission.admissionNumber} • Bed {selectedAdmission.bedNumber}
                      {formatRoomDisplay(selectedAdmission.roomNumber) ? ` (${formatRoomDisplay(selectedAdmission.roomNumber)})` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active IPD
                  </span>
                  <span className="text-xs text-slate-500">
                    Admitted: {new Date(selectedAdmission.admission_date || selectedAdmission.admissionDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Patient Admission Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Ward</span>
                  <span className="font-semibold text-slate-800">{selectedAdmission.wardName || wardName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Admitting Doctor</span>
                  <span className="font-semibold text-slate-800">{formatDoctorName(selectedAdmission.admittingDoctorName)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Provisional Diagnosis</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {selectedAdmission.provisional_diagnosis || selectedAdmission.provisionalDiagnosis || 'General Care'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Assigned Nurse</span>
                  <span className="font-semibold text-slate-800">{nurseData?.firstName || 'Me'} (Primary Care)</span>
                </div>
              </div>

              {/* Latest Recorded Vitals Summary Box */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-rose-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Latest Recorded Vitals Summary</h4>
                  </div>
                  {latestVital && (
                    <span className="text-[11px] text-slate-400">
                      Recorded by <strong className="text-slate-600">{latestVital.nurse_name || latestVital.nurseName}</strong> at {new Date(latestVital.recorded_at || latestVital.recordedAt).toLocaleString()}
                    </span>
                  )}
                </div>

                {latestVital ? (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                      {/* Blood Pressure */}
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Blood Pressure</span>
                        <span className="text-xs font-bold text-slate-800 block mt-0.5">
                          {latestVital.values?.bp_systolic && latestVital.values?.bp_diastolic
                            ? `${latestVital.values.bp_systolic}/${latestVital.values.bp_diastolic} mmHg`
                            : latestVital.values?.bp || '—'}
                        </span>
                        <div className="mt-1">
                          {getStatusBadge(latestVital.evaluations?.blood_pressure?.status)}
                        </div>
                      </div>

                      {/* Pulse */}
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Pulse Rate</span>
                        <span className="text-xs font-bold text-slate-800 block mt-0.5">
                          {latestVital.values?.pulse !== null && latestVital.values?.pulse !== undefined
                            ? `${latestVital.values.pulse} bpm`
                            : '—'}
                        </span>
                        <div className="mt-1">
                          {getStatusBadge(latestVital.evaluations?.pulse?.status)}
                        </div>
                      </div>

                      {/* Temperature */}
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Temperature</span>
                        <span className="text-xs font-bold text-slate-800 block mt-0.5">
                          {latestVital.values?.temperature !== null && latestVital.values?.temperature !== undefined
                            ? `${latestVital.values.temperature} °${latestVital.values.temperature_unit || 'C'}`
                            : '—'}
                        </span>
                        <div className="mt-1">
                          {getStatusBadge(latestVital.evaluations?.temperature?.status)}
                        </div>
                      </div>

                      {/* Respiratory Rate */}
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Resp Rate</span>
                        <span className="text-xs font-bold text-slate-800 block mt-0.5">
                          {latestVital.values?.respiratory_rate !== null && latestVital.values?.respiratory_rate !== undefined
                            ? `${latestVital.values.respiratory_rate}/min`
                            : '—'}
                        </span>
                        <div className="mt-1">
                          {getStatusBadge(latestVital.evaluations?.respiratory_rate?.status)}
                        </div>
                      </div>

                      {/* SpO2 */}
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">SpO2</span>
                        <span className="text-xs font-bold text-slate-800 block mt-0.5">
                          {latestVital.values?.spo2 !== null && latestVital.values?.spo2 !== undefined
                            ? `${latestVital.values.spo2} %`
                            : '—'}
                        </span>
                        <div className="mt-1">
                          {getStatusBadge(latestVital.evaluations?.spo2?.status)}
                        </div>
                      </div>

                      {/* Blood Glucose */}
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Glucose</span>
                        <span className="text-xs font-bold text-slate-800 block mt-0.5">
                          {latestVital.values?.blood_glucose !== null && latestVital.values?.blood_glucose !== undefined
                            ? `${latestVital.values.blood_glucose} mg/dL`
                            : '—'}
                        </span>
                        <div className="mt-1">
                          {getStatusBadge(latestVital.evaluations?.blood_glucose?.status)}
                        </div>
                      </div>

                      {/* Pain Score */}
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Pain Score</span>
                        <span className="text-xs font-bold text-slate-800 block mt-0.5">
                          {latestVital.values?.pain_score !== null && latestVital.values?.pain_score !== undefined
                            ? `${latestVital.values.pain_score} / 10`
                            : '—'}
                        </span>
                        <div className="mt-1">
                          {getStatusBadge(latestVital.evaluations?.pain_score?.status)}
                        </div>
                      </div>

                      {/* Weight */}
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Weight</span>
                        <span className="text-xs font-bold text-slate-800 block mt-0.5">
                          {latestVital.values?.weight !== null && latestVital.values?.weight !== undefined
                            ? `${latestVital.values.weight} kg`
                            : '—'}
                        </span>
                        <div className="mt-1">
                          {getStatusBadge(latestVital.evaluations?.weight?.status)}
                        </div>
                      </div>
                    </div>

                    {/* Critical Alert Advisory Banner */}
                    {latestVital.has_critical && (
                      <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs flex items-start gap-2 text-rose-900">
                        <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold">CRITICAL CLINICAL ALERT:</strong> Measured vital signs indicate critical values exceeding safety thresholds.
                          Advise promptly notifying attending clinician ({formatDoctorName(selectedAdmission.admittingDoctorName)}) according to clinic protocol.
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No bedside vitals recorded yet for this admission. Use the Vitals tab below to enter initial measurements.</p>
                )}
              </div>
            </div>

            {/* Navigation Tabs for Inpatient Care View */}
            <div className="flex items-center gap-2 border-b border-slate-200">
              <button
                onClick={() => setActiveCareTab('vitals')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                  activeCareTab === 'vitals'
                    ? 'border-rose-600 text-rose-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Activity className="h-4 w-4" />
                Bedside Vitals Signs ({nurseVitals.length})
              </button>
              <button
                onClick={() => setActiveCareTab('io')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                  activeCareTab === 'io'
                    ? 'border-cyan-600 text-cyan-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Droplets className="h-4 w-4" />
                Intake / Output ({intakeOutputs.length})
              </button>
              <button
                onClick={() => setActiveCareTab('notes')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                  activeCareTab === 'notes'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ClipboardList className="h-4 w-4" />
                Nursing Care Notes ({nursingNotes.length})
              </button>
            </div>

            {/* SECTION 1: VITALS OBSERVATIONS WORKFLOW */}
            {activeCareTab === 'vitals' && (
              <div className="space-y-6">
                {/* Notifications */}
                {vitalsSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span>{vitalsSuccessMsg}</span>
                  </div>
                )}
                {vitalsCriticalAlert && (
                  <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs flex items-start gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">CRITICAL ALERT FOR RECORDED VITALS</span>
                      <span>One or more measured observations exceed safety reference limits. Please notify the responsible clinician immediately per clinic escalation protocol.</span>
                    </div>
                  </div>
                )}
                {vitalsErrorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                    <span>{vitalsErrorMsg}</span>
                  </div>
                )}

                {/* Observation Schedule & Timing Card */}
                <VitalsScheduleCard
                  admissionId={selectedAdmission?.id}
                  clinicId={nurseData?.clinicId || nurseData?.clinic_id}
                  scheduleData={vitalsSchedule}
                  onScheduleUpdated={(updated) => setVitalsSchedule(updated)}
                  canConfigure={true}
                />

                {/* Vitals Trajectory Trend Chart */}
                <VitalsTrendChart
                  vitalsHistory={nurseVitals}
                  admissionId={selectedAdmission?.id}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Record Vitals Form */}
                  <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Record Vital Signs</h3>
                        <p className="text-[11px] text-slate-500">Record bedside observations (leave unmeasured fields blank)</p>
                      </div>
                      <HeartPulse className="h-4 w-4 text-rose-500" />
                    </div>

                    <form onSubmit={handleSaveVitals} className="space-y-3.5">
                      {/* Blood Pressure: Systolic & Diastolic */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Blood Pressure (mmHg)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            min="30"
                            max="300"
                            placeholder="Systolic (e.g. 120)"
                            value={vitalsForm.bp_systolic}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, bp_systolic: e.target.value })}
                            className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                          />
                          <input
                            type="number"
                            min="20"
                            max="200"
                            placeholder="Diastolic (e.g. 80)"
                            value={vitalsForm.bp_diastolic}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, bp_diastolic: e.target.value })}
                            className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Pulse & Respiratory Rate */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Pulse / HR (bpm)
                          </label>
                          <input
                            type="number"
                            min="10"
                            max="350"
                            placeholder="e.g. 72"
                            value={vitalsForm.pulse}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, pulse: e.target.value })}
                            className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Respiratory Rate (/min)
                          </label>
                          <input
                            type="number"
                            min="2"
                            max="100"
                            placeholder="e.g. 16"
                            value={vitalsForm.respiratory_rate}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, respiratory_rate: e.target.value })}
                            className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Temperature with explicit Unit Selector */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Body Temperature
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.1"
                            min="20"
                            max="120"
                            placeholder="e.g. 37.0"
                            value={vitalsForm.temperature}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                            className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                          />
                          <select
                            value={vitalsForm.temperature_unit}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, temperature_unit: e.target.value })}
                            className="w-24 text-xs border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-slate-50 font-bold"
                          >
                            <option value="C">°C</option>
                            <option value="F">°F</option>
                          </select>
                        </div>
                      </div>

                      {/* SpO2 */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Oxygen Saturation - SpO2 (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="e.g. 98"
                          value={vitalsForm.spo2}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: e.target.value })}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        />
                      </div>

                      {/* Blood Glucose with Context */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Blood Glucose (mg/dL) & Context
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            min="10"
                            max="1000"
                            placeholder="e.g. 110"
                            value={vitalsForm.blood_glucose}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, blood_glucose: e.target.value })}
                            className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                          />
                          <select
                            value={vitalsForm.glucose_context}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, glucose_context: e.target.value })}
                            className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                          >
                            <option value="fasting">Fasting</option>
                            <option value="post_meal">Post-Meal</option>
                            <option value="random">Random</option>
                          </select>
                        </div>
                      </div>

                      {/* Pain Score & Weight */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Pain Score (0–10)
                          </label>
                          <select
                            value={vitalsForm.pain_score}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, pain_score: e.target.value })}
                            className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                          >
                            <option value="">Omitted</option>
                            <option value="0">0 - No Pain</option>
                            <option value="1">1 - Mild</option>
                            <option value="2">2 - Mild</option>
                            <option value="3">3 - Mild</option>
                            <option value="4">4 - Moderate</option>
                            <option value="5">5 - Moderate</option>
                            <option value="6">6 - Moderate</option>
                            <option value="7">7 - Severe</option>
                            <option value="8">8 - Severe</option>
                            <option value="9">9 - Severe</option>
                            <option value="10">10 - Severe</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Weight (kg)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0.5"
                            max="500"
                            placeholder="e.g. 70"
                            value={vitalsForm.weight}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, weight: e.target.value })}
                            className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingVitals}
                        className="w-full py-2.5 px-4 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition mt-2"
                      >
                        {isSubmittingVitals ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            Recording Vitals...
                          </>
                        ) : (
                          <>
                            <HeartPulse className="h-3.5 w-3.5" />
                            Record Vitals Observation
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Right: Vitals History Table */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Vitals Signs History</h3>
                        <p className="text-[11px] text-slate-500">Chronological bedside observations for this admission (newest first)</p>
                      </div>
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                        {nurseVitals.length} Recorded
                      </span>
                    </div>

                    {loadingVitals ? (
                      <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-rose-600" />
                        Loading vitals observations...
                      </div>
                    ) : nurseVitals.length === 0 ? (
                      <div className="p-10 text-center text-slate-400">
                        <Activity className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-xs font-semibold text-slate-600">No vitals observations recorded yet</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Use the form on the left to record the first bedside vital reading.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
                        {nurseVitals.map((item) => {
                          const ev = item.evaluations || {};
                          const vals = item.values || {};
                          return (
                            <div
                              key={item.id}
                              className={`p-3.5 rounded-xl border transition-colors ${
                                item.has_critical
                                  ? 'bg-rose-50/40 border-rose-200'
                                  : 'bg-slate-50/50 border-slate-200'
                              } space-y-2`}
                            >
                              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-800">
                                    {item.nurse_name || item.nurseName || 'Nurse'}
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    • {new Date(item.recorded_at || item.recordedAt).toLocaleString()}
                                  </span>
                                </div>
                                {item.has_critical && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                    <AlertTriangle className="h-3 w-3" />
                                    CRITICAL
                                  </span>
                                )}
                              </div>

                              {/* Measurement Badges Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                {vals.bp_systolic && vals.bp_diastolic && (
                                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                                    <span className="text-[10px] text-slate-400 block font-semibold">BP</span>
                                    <span className="font-bold text-slate-800">{vals.bp_systolic}/{vals.bp_diastolic} mmHg</span>
                                    <div className="mt-0.5">{getStatusBadge(ev.blood_pressure?.status)}</div>
                                  </div>
                                )}
                                {vals.pulse !== null && vals.pulse !== undefined && (
                                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                                    <span className="text-[10px] text-slate-400 block font-semibold">Pulse</span>
                                    <span className="font-bold text-slate-800">{vals.pulse} bpm</span>
                                    <div className="mt-0.5">{getStatusBadge(ev.pulse?.status)}</div>
                                  </div>
                                )}
                                {vals.temperature !== null && vals.temperature !== undefined && (
                                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                                    <span className="text-[10px] text-slate-400 block font-semibold">Temp</span>
                                    <span className="font-bold text-slate-800">{vals.temperature} °{vals.temperature_unit || 'C'}</span>
                                    <div className="mt-0.5">{getStatusBadge(ev.temperature?.status)}</div>
                                  </div>
                                )}
                                {vals.respiratory_rate !== null && vals.respiratory_rate !== undefined && (
                                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                                    <span className="text-[10px] text-slate-400 block font-semibold">Resp Rate</span>
                                    <span className="font-bold text-slate-800">{vals.respiratory_rate} /min</span>
                                    <div className="mt-0.5">{getStatusBadge(ev.respiratory_rate?.status)}</div>
                                  </div>
                                )}
                                {vals.spo2 !== null && vals.spo2 !== undefined && (
                                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                                    <span className="text-[10px] text-slate-400 block font-semibold">SpO2</span>
                                    <span className="font-bold text-slate-800">{vals.spo2} %</span>
                                    <div className="mt-0.5">{getStatusBadge(ev.spo2?.status)}</div>
                                  </div>
                                )}
                                {vals.blood_glucose !== null && vals.blood_glucose !== undefined && (
                                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                                    <span className="text-[10px] text-slate-400 block font-semibold">Glucose ({vals.glucose_context || 'fasting'})</span>
                                    <span className="font-bold text-slate-800">{vals.blood_glucose} mg/dL</span>
                                    <div className="mt-0.5">{getStatusBadge(ev.blood_glucose?.status)}</div>
                                  </div>
                                )}
                                {vals.pain_score !== null && vals.pain_score !== undefined && (
                                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                                    <span className="text-[10px] text-slate-400 block font-semibold">Pain</span>
                                    <span className="font-bold text-slate-800">{vals.pain_score} / 10</span>
                                    <div className="mt-0.5">{getStatusBadge(ev.pain_score?.status)}</div>
                                  </div>
                                )}
                                {vals.weight !== null && vals.weight !== undefined && (
                                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                                    <span className="text-[10px] text-slate-400 block font-semibold">Weight</span>
                                    <span className="font-bold text-slate-800">{vals.weight} kg</span>
                                    <div className="mt-0.5">{getStatusBadge(ev.weight?.status)}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION: FLUID INTAKE / OUTPUT (I/O) CHARTING WORKFLOW */}
            {activeCareTab === 'io' && (
              <div className="space-y-6">
                {/* Notifications */}
                {ioSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span>{ioSuccessMsg}</span>
                  </div>
                )}
                {ioErrorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                    <span>{ioErrorMsg}</span>
                  </div>
                )}

                {/* 1. Fluid Balance Summary Header */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                        <Droplets className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Fluid Intake / Output Daily Balance</h3>
                        <p className="text-[11px] text-slate-500">
                          {ioSummary?.periodCovered || `Date: ${selectedIoDate}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-slate-600">Date:</label>
                      <input
                        type="date"
                        value={selectedIoDate}
                        onChange={(e) => {
                          setSelectedIoDate(e.target.value);
                          fetchIntakeOutput(selectedAdmission.id, e.target.value);
                        }}
                        className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => fetchIntakeOutput(selectedAdmission.id, selectedIoDate)}
                        disabled={loadingIo}
                        className="p-1.5 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        title="Refresh Fluid Summary"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${loadingIo ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* 3 Metric Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Total Intake */}
                    <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-blue-700">
                        <span className="flex items-center gap-1.5">
                          <ArrowDownRight className="h-4 w-4 text-blue-600" />
                          Total Intake
                        </span>
                        <span className="text-[10px] uppercase font-bold text-blue-500">24h Cumulative</span>
                      </div>
                      <div className="text-2xl font-black text-blue-900 font-mono">
                        {ioSummary ? ioSummary.totalIntake : 0} <span className="text-sm font-bold text-blue-600">mL</span>
                      </div>
                      {/* Breakdown */}
                      <div className="text-[11px] text-blue-800/80 space-y-0.5 border-t border-blue-100/60 pt-1.5 font-medium">
                        <div className="flex justify-between"><span>Oral fluids:</span> <span className="font-mono font-bold">{ioSummary?.intakeBreakdown?.['Oral fluids'] || 0} mL</span></div>
                        <div className="flex justify-between"><span>IV fluids:</span> <span className="font-mono font-bold">{ioSummary?.intakeBreakdown?.['IV fluids'] || 0} mL</span></div>
                        <div className="flex justify-between"><span>Enteral / tube feeding:</span> <span className="font-mono font-bold">{ioSummary?.intakeBreakdown?.['Enteral / tube feeding'] || 0} mL</span></div>
                        <div className="flex justify-between"><span>Other measurable:</span> <span className="font-mono font-bold">{ioSummary?.intakeBreakdown?.['Other measurable intake'] || 0} mL</span></div>
                      </div>
                    </div>

                    {/* Total Output */}
                    <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/50 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
                        <span className="flex items-center gap-1.5">
                          <ArrowUpRight className="h-4 w-4 text-amber-600" />
                          Total Output
                        </span>
                        <span className="text-[10px] uppercase font-bold text-amber-500">24h Cumulative</span>
                      </div>
                      <div className="text-2xl font-black text-amber-900 font-mono">
                        {ioSummary ? ioSummary.totalOutput : 0} <span className="text-sm font-bold text-amber-600">mL</span>
                      </div>
                      {/* Breakdown */}
                      <div className="text-[11px] text-amber-800/80 space-y-0.5 border-t border-amber-100/60 pt-1.5 font-medium">
                        <div className="flex justify-between"><span>Urine:</span> <span className="font-mono font-bold">{ioSummary?.outputBreakdown?.['Urine'] || 0} mL</span></div>
                        <div className="flex justify-between"><span>Vomit / emesis:</span> <span className="font-mono font-bold">{ioSummary?.outputBreakdown?.['Vomit / emesis'] || 0} mL</span></div>
                        <div className="flex justify-between"><span>Drain output:</span> <span className="font-mono font-bold">{ioSummary?.outputBreakdown?.['Drain output'] || 0} mL</span></div>
                        <div className="flex justify-between"><span>Other measurable:</span> <span className="font-mono font-bold">{ioSummary?.outputBreakdown?.['Other measurable output'] || 0} mL</span></div>
                      </div>
                    </div>

                    {/* Net Balance */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <Scale className="h-4 w-4 text-slate-600" />
                          Net Fluid Balance
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-500">Intake − Output</span>
                      </div>
                      <div className="text-2xl font-black font-mono text-slate-900">
                        {ioSummary ? (ioSummary.netBalance > 0 ? `+${ioSummary.netBalance}` : ioSummary.netBalance) : 0} <span className="text-sm font-bold text-slate-600">mL</span>
                      </div>
                      <div className="text-[11px] text-slate-600 border-t border-slate-200/80 pt-1.5 leading-relaxed">
                        Calculated as recorded Total Intake minus Total Output. Individual clinical targets or restriction protocols should be verified against attending clinician orders.
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2-Column Bedside Layout: Record Form & History */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Record Bedside Entry */}
                  <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Record Fluid Entry</h3>
                        <p className="text-[11px] text-slate-500">Record timestamped intake or output measurement</p>
                      </div>
                      <Plus className="h-4 w-4 text-cyan-600" />
                    </div>

                    <form onSubmit={handleSaveIntakeOutput} className="space-y-4">
                      {/* Direction Selector */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Direction</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setIoForm(prev => ({
                              ...prev,
                              direction: 'intake',
                              category: 'Oral fluids'
                            }))}
                            className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                              ioForm.direction === 'intake'
                                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <ArrowDownRight className="h-3.5 w-3.5" />
                            Fluid Intake
                          </button>
                          <button
                            type="button"
                            onClick={() => setIoForm(prev => ({
                              ...prev,
                              direction: 'output',
                              category: 'Urine'
                            }))}
                            className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                              ioForm.direction === 'output'
                                ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                            Fluid Output
                          </button>
                        </div>
                      </div>

                      {/* Category Selection */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {ioForm.direction === 'intake' ? 'Intake Category' : 'Output Category'}
                        </label>
                        <select
                          value={ioForm.category}
                          onChange={(e) => setIoForm(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
                          required
                        >
                          {ioForm.direction === 'intake' ? (
                            <>
                              <option value="Oral fluids">Oral fluids</option>
                              <option value="IV fluids">IV fluids</option>
                              <option value="Enteral / tube feeding">Enteral / tube feeding</option>
                              <option value="Other measurable intake">Other measurable intake</option>
                            </>
                          ) : (
                            <>
                              <option value="Urine">Urine</option>
                              <option value="Vomit / emesis">Vomit / emesis</option>
                              <option value="Drain output">Drain output</option>
                              <option value="Other measurable output">Other measurable output</option>
                            </>
                          )}
                        </select>
                      </div>

                      {/* Amount in mL */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Measurable Amount (mL) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            required
                            placeholder="e.g. 250"
                            value={ioForm.amount}
                            onChange={(e) => setIoForm(prev => ({ ...prev, amount: e.target.value }))}
                            className="w-full text-xs px-3 py-2 pr-12 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono font-bold"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">mL</span>
                        </div>
                      </div>

                      {/* Recorded Date / Time (Optional, defaults to now) */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Recorded Date/Time (Leave empty for current time)
                        </label>
                        <input
                          type="datetime-local"
                          value={ioForm.recorded_at}
                          onChange={(e) => setIoForm(prev => ({ ...prev, recorded_at: e.target.value }))}
                          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                        />
                      </div>

                      {/* Remarks */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Clinical Remarks / Notes (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={ioForm.remarks}
                          onChange={(e) => setIoForm(prev => ({ ...prev, remarks: e.target.value }))}
                          placeholder="e.g., Tolerated oral fluids well; surgical drain serosanguinous fluid..."
                          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingIo || !ioForm.amount}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow-sm transition-all ${
                          isSubmittingIo || !ioForm.amount
                            ? 'bg-slate-300 cursor-not-allowed'
                            : 'bg-cyan-600 hover:bg-cyan-700 active:scale-[0.99]'
                        }`}
                      >
                        {isSubmittingIo ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            Recording Fluid Observation...
                          </>
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Save {ioForm.direction === 'intake' ? 'Intake' : 'Output'} Observation
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Entry History & Auditing */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Bedside I/O Flowsheet ({intakeOutputs.length})</h3>
                        <p className="text-[11px] text-slate-500">Historical entries ordered newest first</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        Admission Chronology
                      </span>
                    </div>

                    {loadingIo ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-300" />
                        Loading fluid entries...
                      </div>
                    ) : intakeOutputs.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400 italic">
                        No fluid intake or output entries recorded yet for this admission. Use the form on the left to enter bedside measurements.
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                        {intakeOutputs.map((item) => {
                          const isVoided = Boolean(item.is_voided || item.isVoided);
                          const isIntake = (item.direction || '').toLowerCase() === 'intake';
                          const recordedDate = item.recorded_at ? new Date(item.recorded_at) : new Date();

                          return (
                            <div
                              key={item.id}
                              className={`p-3.5 rounded-xl border transition-all ${
                                isVoided
                                  ? 'bg-slate-50 border-slate-200 opacity-60'
                                  : isIntake
                                  ? 'bg-blue-50/30 border-blue-100 hover:border-blue-200'
                                  : 'bg-amber-50/30 border-amber-100 hover:border-amber-200'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                                        isVoided
                                          ? 'bg-slate-200 text-slate-600'
                                          : isIntake
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {item.direction}
                                    </span>
                                    <span className={`text-xs font-bold ${isVoided ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                      {item.category}
                                    </span>
                                    {isVoided && (
                                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-rose-100 text-rose-700 rounded uppercase">
                                        Voided
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                    <Clock className="h-3 w-3 text-slate-400" />
                                    <span>{recordedDate.toLocaleDateString()} {recordedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span>•</span>
                                    <span>Recorded by: <strong className="text-slate-700">{item.nurse_name || item.recorded_by || 'Staff Nurse'}</strong></span>
                                  </div>

                                  {item.remarks && (
                                    <p className="text-xs text-slate-600 bg-white/70 p-2 rounded-lg border border-slate-100 mt-1 italic">
                                      "{item.remarks}"
                                    </p>
                                  )}

                                  {isVoided && item.void_reason && (
                                    <div className="text-[11px] text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-200 mt-1">
                                      <strong>Void Reason:</strong> {item.void_reason}
                                      {item.voided_by_name && <span> (by {item.voided_by_name})</span>}
                                    </div>
                                  )}
                                </div>

                                <div className="text-right space-y-1.5 shrink-0">
                                  <div className={`text-base font-black font-mono ${
                                    isVoided
                                      ? 'line-through text-slate-400'
                                      : isIntake
                                      ? 'text-blue-700'
                                      : 'text-amber-700'
                                  }`}>
                                    {isIntake ? `+${item.amount}` : `-${item.amount}`} <span className="text-xs font-normal">mL</span>
                                  </div>

                                  {!isVoided && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setVoidingEntry(item);
                                        setVoidReasonText('');
                                      }}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded transition-colors"
                                    >
                                      <Ban className="h-2.5 w-2.5" />
                                      Void
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Void Modal */}
                {voidingEntry && (
                  <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 max-h-[92vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2 text-rose-600">
                          <Ban className="h-5 w-5" />
                          <h4 className="text-sm font-bold text-slate-900">Void Fluid Entry</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setVoidingEntry(null)}
                          className="text-slate-400 hover:text-slate-600 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div><strong>Category:</strong> {voidingEntry.category} ({voidingEntry.direction})</div>
                        <div><strong>Amount:</strong> {voidingEntry.amount} mL</div>
                        <div><strong>Recorded:</strong> {new Date(voidingEntry.recorded_at).toLocaleString()}</div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                          Reason for Voiding <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={voidReasonText}
                          onChange={(e) => setVoidReasonText(e.target.value)}
                          placeholder="e.g. Mismeasurement, spilled fluid, entered for incorrect patient..."
                          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                        <p className="text-[11px] text-slate-500">
                          Clinical audit rule: The original entry will remain in audit history marked voided, and daily totals will be recomputed automatically.
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setVoidingEntry(null)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={!voidReasonText.trim() || isVoidingSubmitting}
                          onClick={handleVoidEntry}
                          className={`px-4 py-1.5 text-xs font-bold text-white rounded-xl transition-all ${
                            !voidReasonText.trim() || isVoidingSubmitting
                              ? 'bg-slate-300 cursor-not-allowed'
                              : 'bg-rose-600 hover:bg-rose-700 shadow-xs'
                          }`}
                        >
                          {isVoidingSubmitting ? 'Voiding...' : 'Confirm Void'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 2: NURSING NOTES WORKFLOW (RETAINED FROM TASK 9) */}
            {activeCareTab === 'notes' && (
              <div className="space-y-6">
                {noteSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span>{noteSuccessMsg}</span>
                  </div>
                )}
                {noteErrorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                    <span>{noteErrorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Form: Record Nursing Note / Shift Handover */}
                  <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Record Nursing Note</h3>
                        <p className="text-[11px] text-slate-500">Document bedside nursing care or shift handover</p>
                      </div>
                      <FileText className="h-4 w-4 text-slate-400" />
                    </div>

                    <form onSubmit={handleSaveNursingNote} className="space-y-3.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Entry Type</label>
                          <select
                            value={noteForm.noteType}
                            onChange={(e) => setNoteForm({ ...noteForm, noteType: e.target.value })}
                            className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          >
                            <option value="Nursing Note">Nursing Note</option>
                            <option value="Shift Handover">Shift Handover</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Condition</label>
                          <select
                            value={noteForm.patientCondition}
                            onChange={(e) => setNoteForm({ ...noteForm, patientCondition: e.target.value })}
                            className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          >
                            <option value="Stable">Stable</option>
                            <option value="Improving">Improving</option>
                            <option value="Guarded">Guarded</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Nursing Observations & Assessment
                        </label>
                        <textarea
                          rows={3}
                          value={noteForm.observations}
                          onChange={(e) => setNoteForm({ ...noteForm, observations: e.target.value })}
                          placeholder="Bedside observations, patient symptoms, mental status, pain scale..."
                          className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Care Provided / Interventions
                        </label>
                        <textarea
                          rows={3}
                          value={noteForm.interventions}
                          onChange={(e) => setNoteForm({ ...noteForm, interventions: e.target.value })}
                          placeholder="Nursing interventions performed (e.g. hygiene, wound dressing, catheter care)..."
                          className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Follow-up & Handover Notes
                        </label>
                        <textarea
                          rows={2}
                          value={noteForm.handoverNotes}
                          onChange={(e) => setNoteForm({ ...noteForm, handoverNotes: e.target.value })}
                          placeholder="Pending care items for next shift, upcoming doctor orders, precautions..."
                          className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingNote}
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition"
                      >
                        {isSubmittingNote ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            Saving Note...
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" />
                            Save Nursing Note
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* History: Chronological Nursing Notes List */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Nursing Care Notes History</h3>
                        <p className="text-[11px] text-slate-500">Chronological history for this admission (newest first)</p>
                      </div>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        {nursingNotes.length} Entries
                      </span>
                    </div>

                    {loadingNotes ? (
                      <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                        Loading care notes...
                      </div>
                    ) : nursingNotes.length === 0 ? (
                      <div className="p-10 text-center text-slate-400">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-xs font-semibold text-slate-600">No nursing notes recorded yet</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Use the form on the left to record the first bedside nursing note or shift handover.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                        {nursingNotes.map((note) => {
                          const isHandover = (note.note_type || note.noteType) === 'Shift Handover';
                          const condition = note.patient_condition || note.patientCondition;

                          return (
                            <div
                              key={note.id}
                              className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-slate-50/50 space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                      isHandover
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-blue-100 text-blue-700'
                                    }`}
                                  >
                                    {note.note_type || note.noteType || 'Nursing Note'}
                                  </span>
                                  {condition && (
                                    <span
                                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                        condition === 'Critical'
                                          ? 'bg-rose-100 text-rose-700'
                                          : condition === 'Guarded'
                                          ? 'bg-amber-100 text-amber-700'
                                          : 'bg-emerald-100 text-emerald-700'
                                      }`}
                                    >
                                      {condition}
                                    </span>
                                  )}
                                </div>

                                <div className="text-right">
                                  <span className="text-[11px] text-slate-500 block">
                                    {new Date(note.recorded_at || note.created_at).toLocaleString()}
                                  </span>
                                </div>
                              </div>

                              <div className="text-xs text-slate-700 space-y-1.5 pt-1">
                                {note.nursing_observations && (
                                  <div>
                                    <span className="font-semibold text-slate-800 text-[11px] block">Observations:</span>
                                    <p className="text-slate-600 whitespace-pre-line pl-1 border-l-2 border-blue-200">
                                      {note.nursing_observations}
                                    </p>
                                  </div>
                                )}

                                {note.interventions && (
                                  <div>
                                    <span className="font-semibold text-slate-800 text-[11px] block">Care Provided:</span>
                                    <p className="text-slate-600 whitespace-pre-line pl-1 border-l-2 border-emerald-200">
                                      {note.interventions}
                                    </p>
                                  </div>
                                )}

                                {note.handover_notes && (
                                  <div>
                                    <span className="font-semibold text-slate-800 text-[11px] block">Follow-up / Handover:</span>
                                    <p className="text-slate-600 whitespace-pre-line pl-1 border-l-2 border-purple-200">
                                      {note.handover_notes}
                                    </p>
                                  </div>
                                )}

                                {!note.nursing_observations && !note.interventions && !note.handover_notes && (
                                  <p className="text-slate-600 whitespace-pre-line">{note.note || note.notes}</p>
                                )}
                              </div>

                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                                <span>Author: {note.nurse_name || note.author_name || 'Nurse'}</span>
                                <span className="font-mono text-[10px] text-slate-400">{note.id.slice(0, 8)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
