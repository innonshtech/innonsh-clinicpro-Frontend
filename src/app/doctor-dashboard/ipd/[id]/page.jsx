'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  User,
  Heart,
  Activity,
  FileText,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  FlaskConical,
  Pill,
  Radio,
  Scissors,
  DollarSign,
  FileCheck,
  LogOut,
  Stethoscope,
  Plus,
  RefreshCw,
  ExternalLink,
  Info,
  ShieldAlert,
  ChevronRight,
  Edit2,
  Trash2,
  History,
  BedDouble,
  UserCheck,
  X,
  Droplets,
  ArrowDownRight,
  ArrowUpRight,
  Scale,
  ArrowRightLeft,
  AlertTriangle,
  Eye,
  Download,
  FileCheck2,
  ShieldCheck
} from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import CreateLabOrderModal from '@/components/CreateLabOrderModal';
import VitalsTrendChart from '@/components/VitalsTrendChart';
import VitalsScheduleCard from '@/components/VitalsScheduleCard';
import { getPriorityBadge } from '@/components/LabOrdersManagement';
import ModalPortal from '@/components/ModalPortal';

// --- Utility Helpers ---

export const IPD_RADIOLOGY_PRESETS = {
  'X-Ray': [
    { name: 'Chest PA View', price: 600 },
    { name: 'Chest AP (Portable Bedside)', price: 750 },
    { name: 'Abdomen Erect & Supine', price: 800 },
    { name: 'Left Knee AP/Lateral', price: 600 },
    { name: 'Right Knee AP/Lateral', price: 600 },
    { name: 'Lumbar Spine AP/Lateral', price: 700 }
  ],
  'CT Scan': [
    { name: 'HRCT Chest Non-Contrast', price: 3500 },
    { name: 'NCCT Head / Brain', price: 2800 },
    { name: 'CECT Whole Abdomen', price: 5000 },
    { name: 'CT Angiography Pulmonary', price: 6500 },
    { name: 'CT Cervical Spine', price: 3200 }
  ],
  'Ultrasound': [
    { name: 'USG Whole Abdomen & Pelvis', price: 1500 },
    { name: 'USG KUB (Kidney, Ureter, Bladder)', price: 1200 },
    { name: 'FAST Bedside Protocol', price: 1800 },
    { name: 'USG Venous Doppler Lower Limb', price: 2500 },
    { name: 'USG Neck / Thyroid', price: 1400 }
  ],
  'MRI': [
    { name: 'MRI Brain with DWI', price: 6000 },
    { name: 'MRI Lumbar Spine', price: 6500 },
    { name: 'MRI Cervical Spine', price: 6500 },
    { name: 'MRI Knee Joint', price: 5500 }
  ]
};

export function getRadiologyPresetPrice(modality, studyName) {
  if (!studyName) return null;
  const list = IPD_RADIOLOGY_PRESETS[modality] || [];
  const found = list.find(p => p.name.trim().toLowerCase() === studyName.trim().toLowerCase());
  return found ? found.price : null;
}

export function formatDoctorName(name) {
  if (!name) return 'Dr. Doctor';
  let cleaned = String(name).trim();
  while (/^(dr\.?|doctor)\s+/i.test(cleaned)) {
    cleaned = cleaned.replace(/^(dr\.?|doctor)\s+/i, '').trim();
  }
  return cleaned ? `Dr. ${cleaned}` : 'Dr. Doctor';
}

export function formatRoomDisplay(roomNumber) {
  if (!roomNumber || !String(roomNumber).trim()) return null;
  const trimmed = String(roomNumber).trim();
  if (/^room\b/i.test(trimmed)) return trimmed;
  return `Room ${trimmed}`;
}

export function toTitleCase(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
    .join(' ');
}


export function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (_) {
    return dateStr;
  }
}

export function formatDateOnly(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (_) {
    return dateStr;
  }
}

export function calculateCalendarDays(admissionDate, dischargeDate = new Date(), timeZone = 'Asia/Kolkata') {
  if (!admissionDate) return 1;
  try {
    const getLocalDateString = (d) => {
      const dateObj = typeof d === 'string' ? new Date(d) : d;
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return formatter.format(dateObj);
    };

    const admStr = getLocalDateString(admissionDate);
    const disStr = getLocalDateString(dischargeDate);

    const admDateUtc = new Date(`${admStr}T00:00:00Z`);
    const disDateUtc = new Date(`${disStr}T00:00:00Z`);

    const diffMs = disDateUtc.getTime() - admDateUtc.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays + 1);
  } catch (_) {
    return 1;
  }
}

export function computeVitalFlags(vitals) {
  if (!vitals) return [];
  const flags = [];
  if (vitals.pulse !== undefined && vitals.pulse !== null && !isNaN(Number(vitals.pulse))) {
    const p = Number(vitals.pulse);
    if (p > 100) flags.push({ key: 'pulse', label: 'Tachycardia', value: `${p} bpm`, severity: 'warning' });
    else if (p < 60) flags.push({ key: 'pulse', label: 'Bradycardia', value: `${p} bpm`, severity: 'warning' });
  }
  if (vitals.temperature !== undefined && vitals.temperature !== null && !isNaN(Number(vitals.temperature))) {
    const t = Number(vitals.temperature);
    if (t >= 100.4) flags.push({ key: 'temperature', label: 'Fever / Pyrexia', value: `${t}°F`, severity: 'warning' });
    else if (t < 95) flags.push({ key: 'temperature', label: 'Hypothermia', value: `${t}°F`, severity: 'warning' });
  }
  if (vitals.spo2 !== undefined && vitals.spo2 !== null && !isNaN(Number(vitals.spo2))) {
    const s = Number(vitals.spo2);
    if (s < 90) flags.push({ key: 'spo2', label: 'Critical Hypoxemia', value: `${s}%`, severity: 'critical' });
    else if (s < 95) flags.push({ key: 'spo2', label: 'Low Oxygen Saturation', value: `${s}%`, severity: 'warning' });
  }
  if (vitals.bp && typeof vitals.bp === 'string' && vitals.bp.includes('/')) {
    const parts = vitals.bp.split('/');
    const sys = parseInt(parts[0], 10);
    const dia = parseInt(parts[1], 10);
    if (!isNaN(sys) && !isNaN(dia)) {
      if (sys >= 140 || dia >= 90) {
        flags.push({ key: 'bp', label: 'Hypertension', value: vitals.bp, severity: 'warning' });
      } else if (sys < 90 || dia < 60) {
        flags.push({ key: 'bp', label: 'Hypotension', value: vitals.bp, severity: 'warning' });
      }
    }
  }
  return flags;
}

export function isUUID(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

export function resolveAuditActorName(rawActor, currentDoctorId, currentDoctorName, docMap = {}) {
  if (!rawActor) return 'Unknown clinician';
  const val = String(rawActor).trim();
  if (!isUUID(val)) {
    if (val.toLowerCase() === 'author') return 'Unknown clinician';
    return val;
  }
  if (currentDoctorId && String(val).toLowerCase() === String(currentDoctorId).toLowerCase()) {
    return currentDoctorName && currentDoctorName.toLowerCase() !== 'doctor'
      ? `${currentDoctorName} (You)`
      : 'You';
  }
  const key = val.toLowerCase();
  if (docMap && (docMap[key] || docMap[val])) {
    return docMap[key] || docMap[val];
  }
  return 'Unknown clinician';
}

export function cleanAuditReason(rawReason, defaultText = 'Clinical amendment') {
  if (!rawReason) return defaultText;
  let str = String(rawReason).trim();
  str = str.replace(/\s*\((?:by\s+)?[0-9a-fA-F-]{36}(?:\s+at\s+[^)]+)?\)\s*$/, '');
  return str.trim() || defaultText;
}

// --- Main Inpatient Profile Component ---

export default function InpatientProfilePage() {
  const router = useRouter();
  const params = useParams();
  const admissionId = params?.id;

  // Authentication & Context
  const [doctorId, setDoctorId] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [clinicId, setClinicId] = useState('');

  // Profile Data
  const [admission, setAdmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active Tab: 12 specified tabs
  // 'overview' | 'clinical' | 'vitals' | 'nursing' | 'medications' | 'lab' | 'radiology' | 'procedures' | 'doctor_notes' | 'billing' | 'documents' | 'discharge'
  const [activeTab, setActiveTab] = useState('overview');

  // Clinical Notes & Vitals State
  const [clinicalNotes, setClinicalNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [noteForm, setNoteForm] = useState({
    note: '',
    patient_condition: 'Stable',
    clinical_findings: '',
    treatment_plan: '',
    bp: '',
    pulse: '',
    temperature: '',
    spo2: ''
  });
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteForm, setEditNoteForm] = useState({
    note: '',
    patient_condition: '',
    clinical_findings: '',
    treatment_plan: '',
    bp: '',
    pulse: '',
    temperature: '',
    spo2: '',
    reason: ''
  });
  const [voidingNoteId, setVoidingNoteId] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [isNoteSubmitting, setIsNoteSubmitting] = useState(false);
  const [noteError, setNoteError] = useState('');

  // Nurse Vitals State
  const [nurseVitals, setNurseVitals] = useState([]);
  const [loadingNurseVitals, setLoadingNurseVitals] = useState(false);
  const [vitalsSchedule, setVitalsSchedule] = useState(null);

  // Fluid Intake / Output State
  const [intakeOutputs, setIntakeOutputs] = useState([]);
  const [ioSummary, setIoSummary] = useState(null);
  const [loadingIo, setLoadingIo] = useState(false);

  // Nursing Care Notes (Read-Only Doctor View)
  const [nursingNotes, setNursingNotes] = useState([]);
  const [loadingNursingNotes, setLoadingNursingNotes] = useState(false);

  // Lab Orders
  const [labOrders, setLabOrders] = useState([]);
  const [loadingLabOrders, setLoadingLabOrders] = useState(false);
  const [isCreateLabModalOpen, setIsCreateLabModalOpen] = useState(false);
  const [viewingLabOrder, setViewingLabOrder] = useState(null);

  // Radiology Orders
  const [radiologyOrders, setRadiologyOrders] = useState([]);
  const [loadingRadiologyOrders, setLoadingRadiologyOrders] = useState(false);
  const [isCreateRadiologyModalOpen, setIsCreateRadiologyModalOpen] = useState(false);
  const [viewingRadiologyOrder, setViewingRadiologyOrder] = useState(null);
  const [cancellingRadiologyOrder, setCancellingRadiologyOrder] = useState(null);
  const [radiologyCancelReason, setRadiologyCancelReason] = useState('');
  const [radiologyFilter, setRadiologyFilter] = useState('ALL');
  const [isRadiologySubmitting, setIsRadiologySubmitting] = useState(false);
  const [radiologyFormError, setRadiologyFormError] = useState('');
  const [activeLabs, setActiveLabs] = useState([]);
  const [loadingActiveLabs, setLoadingActiveLabs] = useState(false);

  const [radiologyForm, setRadiologyForm] = useState({
    lab_id: '',
    lab_name: '',
    investigation_type: 'X-Ray',
    study_name: '',
    price: null,
    clinical_indication: '',
    priority: 'routine',
    transport_mode: 'ambulatory',
    instructions: ''
  });

  // Discharge State
  const [dischargeForm, setDischargeForm] = useState({
    dischargeSummary: '',
    dischargeCondition: 'improved'
  });
  const [isDischarging, setIsDischarging] = useState(false);
  const [dischargeError, setDischargeError] = useState('');
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Doctor Map for audit actor resolution
  const [docMap, setDocMap] = useState({});

  // Patient Transfer State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferWards, setTransferWards] = useState([]);
  const [transferBeds, setTransferBeds] = useState([]);
  const [transferBedsLoading, setTransferBedsLoading] = useState(false);
  const [transferForm, setTransferForm] = useState({
    destinationWardId: '',
    destinationBedId: '',
    reason: '',
    clinicalNotes: ''
  });
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingTransfer, setCancellingTransfer] = useState(false);

// Inpatient Medications & MAR State (Doctor View)
  const [medicationsData, setMedicationsData] = useState({ prescriptions: [], marRecords: [], scheduledDoses: [] });
  const [loadingMeds, setLoadingMeds] = useState(false);
  const [prescribeModalOpen, setPrescribeModalOpen] = useState(false);
  const [prescribeForm, setPrescribeForm] = useState({
    medication_name: '',
    dosage: '',
    route: 'Oral',
    frequency: 'OD',
    schedule: '',
    instructions: '',
    duration: '5 days'
  });
  const [prescribeSubmitting, setPrescribeSubmitting] = useState(false);
  const [prescribeError, setPrescribeError] = useState('');
  const [prescribeSuccess, setPrescribeSuccess] = useState('');

  const [discontinueModal, setDiscontinueModal] = useState({
    isOpen: false,
    prescription: null,
    reasonPreset: 'Therapy Completed / Condition Improved',
    reasonText: '',
    isSubmitting: false,
    error: ''
  });

  const fetchMedications = useCallback(async () => {
    if (!admissionId) return;
    setLoadingMeds(true);
    try {
      const storedClinicId = localStorage.getItem('clinicId') || clinicId;
      const url = `${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}/mar${storedClinicId ? `?clinicId=${storedClinicId}` : ''}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        setMedicationsData({
          prescriptions: data.data?.prescriptions || [],
          marRecords: data.data?.marRecords || [],
          scheduledDoses: data.data?.scheduledDoses || []
        });
      }
    } catch (err) {
      console.error('Error fetching inpatient medications:', err);
    } finally {
      setLoadingMeds(false);
    }
  }, [admissionId, clinicId]);

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    if (prescribeSubmitting || !admissionId) return;

    setPrescribeSubmitting(true);
    setPrescribeError('');
    setPrescribeSuccess('');

    try {
      const storedClinicId = localStorage.getItem('clinicId') || clinicId;
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}/prescriptions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...prescribeForm,
          clinicId: storedClinicId
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPrescribeSuccess('Inpatient prescription authorized successfully.');
        setTimeout(() => setPrescribeSuccess(''), 4000);
        setPrescribeModalOpen(false);
        setPrescribeForm({
          medication_name: '',
          dosage: '',
          route: 'Oral',
          frequency: 'OD',
          schedule: '',
          instructions: '',
          duration: '5 days'
        });
        fetchMedications();
      } else {
        setPrescribeError(data.message || 'Failed to authorize inpatient prescription');
      }
    } catch (err) {
      console.error('Error authorizing prescription:', err);
      setPrescribeError('Network error while issuing prescription.');
    } finally {
      setPrescribeSubmitting(false);
    }
  };

  const handleDiscontinuePrescription = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!discontinueModal.prescription || discontinueModal.isSubmitting || !admissionId) return;

    const finalReason = (discontinueModal.reasonText || discontinueModal.reasonPreset || '').trim();
    if (finalReason.length < 3) {
      setDiscontinueModal(prev => ({ ...prev, error: 'A mandatory clinical reason is required (minimum 3 characters).' }));
      return;
    }

    setDiscontinueModal(prev => ({ ...prev, isSubmitting: true, error: '' }));

    try {
      const storedClinicId = localStorage.getItem('clinicId') || clinicId;
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}/prescriptions/${discontinueModal.prescription.id}/discontinue`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          reason: finalReason,
          clinicId: storedClinicId
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPrescribeSuccess(`Prescription for "${discontinueModal.prescription.medication_name || discontinueModal.prescription.medicationName}" discontinued successfully.`);
        setTimeout(() => setPrescribeSuccess(''), 4000);
        setDiscontinueModal({
          isOpen: false,
          prescription: null,
          reasonPreset: 'Therapy Completed / Condition Improved',
          reasonText: '',
          isSubmitting: false,
          error: ''
        });
        fetchMedications();
      } else {
        setDiscontinueModal(prev => ({ ...prev, error: data.message || 'Failed to discontinue prescription.' }));
      }
    } catch (err) {
      console.error('Error discontinuing prescription:', err);
      setDiscontinueModal(prev => ({ ...prev, error: 'Network error while discontinuing prescription.' }));
    } finally {
      setDiscontinueModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Auto-dismiss notifications
  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => {
        setNotification({ type: '', message: '' });
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Load User Context
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        const dId = u.doctor_id || u.doctorId || u.id || u.sub;
        if (dId) setDoctorId(dId);
        const dName = u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Doctor';
        setDoctorName(dName);
        const cId = u.clinic_id || u.clinicId || localStorage.getItem('clinicId') || '';
        if (cId) setClinicId(cId);
      }
    } catch (e) {
      console.error('Failed to parse user session:', e);
    }
  }, []);

  // Fetch Admission Profile
  const fetchAdmission = useCallback(async () => {
    if (!admissionId) return;
    setLoading(true);
    setError('');
    try {
      const storedClinicId = localStorage.getItem('clinicId') || clinicId;
      const url = `${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}${storedClinicId ? `?clinicId=${storedClinicId}` : ''}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load inpatient admission record');
      }

      const adm = data.data?.admission || data.data;
      setAdmission(adm);

      // Populate doctor map
      const newDocMap = {};
      if (adm.doctor) {
        const dId = adm.doctor.id || adm.doctor_id;
        const dName = adm.doctor.name || `${adm.doctor.firstName || ''} ${adm.doctor.lastName || ''}`.trim();
        if (dId) newDocMap[dId.toLowerCase()] = dName;
      }
      if (adm.consultingDoctors && Array.isArray(adm.consultingDoctors)) {
        adm.consultingDoctors.forEach(cd => {
          if (cd.doctorId) newDocMap[cd.doctorId.toLowerCase()] = cd.doctorName;
        });
      }
      setDocMap(prev => ({ ...prev, ...newDocMap }));
    } catch (err) {
      console.error('Error fetching inpatient profile:', err);
      setError(err.message || 'Failed to load inpatient profile');
    } finally {
      setLoading(false);
    }
  }, [admissionId, clinicId]);

  useEffect(() => {
    fetchAdmission();
  }, [fetchAdmission]);

  useEffect(() => {
    if (activeTab === 'medications') fetchMedications();
  }, [activeTab, fetchMedications]);

  // Load Clinical Notes for this admission
  const loadClinicalNotes = useCallback(async () => {
    if (!admissionId) return;
    setLoadingNotes(true);
    try {
      const storedClinicId = localStorage.getItem('clinicId') || clinicId;
      const url = `${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}/clinical-notes${storedClinicId ? `?clinicId=${storedClinicId}` : ''}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        const raw = data.data?.notes || [];
        const sorted = [...raw].sort((a, b) => {
          const tA = new Date(a.created_at || a.createdAt || 0).getTime();
          const tB = new Date(b.created_at || b.createdAt || 0).getTime();
          const diff = tB - tA;
          if (diff !== 0) return diff;
          return String(b.id || b._id || '').localeCompare(String(a.id || a._id || ''));
        });
        setClinicalNotes(sorted);
      } else {
        setClinicalNotes([]);
      }
    } catch (err) {
      console.error('Error loading clinical notes:', err);
      setClinicalNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  }, [admissionId, clinicId]);

  useEffect(() => {
    if (admissionId) {
      loadClinicalNotes();
    }
  }, [admissionId, loadClinicalNotes]);

  // Fetch Nurse Vitals for this admission
  const loadNurseVitals = useCallback(async () => {
    if (!admissionId) return;
    setLoadingNurseVitals(true);
    try {
      const storedClinicId = localStorage.getItem('clinicId') || clinicId;
      const url = `${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}/vitals${storedClinicId ? `?clinicId=${storedClinicId}` : ''}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
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
      console.error('Error loading nurse vitals in doctor profile:', err);
      setNurseVitals([]);
    } finally {
      setLoadingNurseVitals(false);
    }
  }, [admissionId, clinicId]);

  useEffect(() => {
    if (admissionId) {
      loadNurseVitals();
    }
  }, [admissionId, loadNurseVitals]);

  // Fetch Fluid Intake / Output for this admission
  const loadIntakeOutput = useCallback(async () => {
    if (!admissionId) return;
    setLoadingIo(true);
    try {
      const storedClinicId = localStorage.getItem('clinicId') || clinicId;
      const url = `${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}/intake-output${storedClinicId ? `?clinicId=${storedClinicId}` : ''}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        setIntakeOutputs(data.data?.entries || []);
        setIoSummary(data.data?.summary || null);
      } else {
        setIntakeOutputs([]);
        setIoSummary(null);
      }
    } catch (err) {
      console.error('Error loading intake / output in doctor profile:', err);
      setIntakeOutputs([]);
      setIoSummary(null);
    } finally {
      setLoadingIo(false);
    }
  }, [admissionId, clinicId]);

  useEffect(() => {
    if (admissionId) {
      loadIntakeOutput();
    }
  }, [admissionId, loadIntakeOutput]);

  // Fetch Nursing Care Notes for this admission (Read-Only)
  const loadNursingNotes = useCallback(async () => {
    if (!admissionId) return;
    setLoadingNursingNotes(true);
    try {
      const storedClinicId = localStorage.getItem('clinicId') || clinicId;
      const url = `${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}/nursing-notes${storedClinicId ? `?clinicId=${storedClinicId}` : ''}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        const raw = data.data?.notes || [];
        const sorted = [...raw].sort((a, b) => {
          const tA = new Date(a.recorded_at || a.created_at || a.createdAt || 0).getTime();
          const tB = new Date(b.recorded_at || b.created_at || b.createdAt || 0).getTime();
          return tB - tA;
        });
        setNursingNotes(sorted);
      } else {
        setNursingNotes([]);
      }
    } catch (err) {
      console.error('Error loading nursing notes in doctor profile:', err);
      setNursingNotes([]);
    } finally {
      setLoadingNursingNotes(false);
    }
  }, [admissionId, clinicId]);

  useEffect(() => {
    if (admissionId) {
      loadNursingNotes();
    }
  }, [admissionId, loadNursingNotes]);

  // Fetch Lab Orders for this patient
  const loadLabOrders = useCallback(async () => {
    if (!admission?.patient_id) return;
    setLoadingLabOrders(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/lab/orders`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        const allOrders = data.data?.orders || data.orders || [];
        const targetPid = String(admission.patient_id).toLowerCase();
        const pCode = (admission.patient?.patient_code || admission.patient_code || '').toLowerCase();
        const filtered = allOrders.filter(o => {
          const oPid = String(o.patient_id || o.patient?._id || o.patient?.id || '').toLowerCase();
          const oPcode = String(o.patient?.patient_code || o.patient_code || '').toLowerCase();
          return (targetPid && oPid === targetPid) || (pCode && oPcode === pCode);
        });
        setLabOrders(filtered);
      }
    } catch (err) {
      console.error('Error fetching lab orders:', err);
      setLabOrders([]);
    } finally {
      setLoadingLabOrders(false);
    }
  }, [admission?.patient_id, admission?.patient_code, admission?.patient]);

  useEffect(() => {
    if (admission?.patient_id) {
      loadLabOrders();
    }
  }, [admission?.patient_id, loadLabOrders]);

  // Fetch Active Destination Laboratories for Radiology Requisitions
  const fetchActiveLabs = useCallback(async () => {
    try {
      setLoadingActiveLabs(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/lab/active`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      const list = data.data?.labs || data.labs || [];
      if (Array.isArray(list)) {
        setActiveLabs(list);
        if (list.length === 1) {
          setRadiologyForm(prev => ({
            ...prev,
            lab_id: list[0].id || list[0]._id,
            lab_name: list[0].lab_name || list[0].name
          }));
        }
      }
    } catch (e) {
      console.warn('Error fetching active labs:', e);
    } finally {
      setLoadingActiveLabs(false);
    }
  }, []);

  // Fetch Radiology Orders for this admission
  const loadRadiologyOrders = useCallback(async () => {
    if (!admissionId) return;
    setLoadingRadiologyOrders(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}/radiology`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRadiologyOrders(data.data?.orders || []);
      } else {
        setRadiologyOrders([]);
      }
    } catch (err) {
      console.error('Error fetching radiology orders:', err);
      setRadiologyOrders([]);
    } finally {
      setLoadingRadiologyOrders(false);
    }
  }, [admissionId]);

  useEffect(() => {
    if (admissionId) {
      loadRadiologyOrders();
    }
  }, [admissionId, loadRadiologyOrders]);

  const handleCreateRadiologyOrder = async (e) => {
    e.preventDefault();
    if (isRadiologySubmitting) return;
    setRadiologyFormError('');

    if (!radiologyForm.lab_id) {
      setRadiologyFormError('Please select a destination diagnostic laboratory.');
      return;
    }
    if (!radiologyForm.study_name.trim()) {
      setRadiologyFormError('Study name / examination description is required.');
      return;
    }
    if (!radiologyForm.clinical_indication.trim() || radiologyForm.clinical_indication.trim().length < 3) {
      setRadiologyFormError('Clinical indication is mandatory (minimum 3 characters).');
      return;
    }

    setIsRadiologySubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}/radiology`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          ...radiologyForm,
          price: radiologyForm.price !== undefined && radiologyForm.price !== null ? Number(radiologyForm.price) : null,
          tariff: radiologyForm.price !== undefined && radiologyForm.price !== null ? Number(radiologyForm.price) : null,
          total_amount: radiologyForm.price !== undefined && radiologyForm.price !== null ? Number(radiologyForm.price) : null,
          clinicId: clinicId || admission?.clinic_id || admission?.clinicId
        })
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || result.error?.message || 'Failed to place radiology order.');
      }

      setIsCreateRadiologyModalOpen(false);
      setRadiologyForm({
        lab_id: '',
        lab_name: '',
        investigation_type: 'X-Ray',
        study_name: '',
        price: null,
        clinical_indication: '',
        priority: 'routine',
        transport_mode: 'ambulatory',
        instructions: ''
      });
      loadRadiologyOrders();
    } catch (err) {
      setRadiologyFormError(err.message);
    } finally {
      setIsRadiologySubmitting(false);
    }
  };

  const handleCancelRadiologyOrder = async () => {
    if (!cancellingRadiologyOrder) return;
    setIsRadiologySubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}/radiology/${cancellingRadiologyOrder.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          status: 'CANCELLED',
          cancel_reason: radiologyCancelReason || 'Cancelled by attending physician',
          clinicId: clinicId || admission?.clinic_id || admission?.clinicId
        })
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Failed to cancel order.');
      }
      setCancellingRadiologyOrder(null);
      setRadiologyCancelReason('');
      loadRadiologyOrders();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsRadiologySubmitting(false);
    }
  };

  // Handle Note Submission (Doctor Round / Clinical Note)
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (isNoteSubmitting) return;

    if (isDischarged) {
      setNoteError('Cannot record doctor rounds or clinical notes on a discharged admission.');
      return;
    }

    const hasContent = (noteForm.note || noteForm.clinical_findings || noteForm.treatment_plan).trim();
    if (!hasContent) {
      setNoteError('Clinical progress note, findings, or treatment plan content is required');
      return;
    }
    setIsNoteSubmitting(true);
    setNoteError('');
    try {
      const vitals = (noteForm.bp || noteForm.pulse || noteForm.temperature || noteForm.spo2) ? {
        bp: noteForm.bp.trim() || undefined,
        pulse: noteForm.pulse !== '' ? Number(noteForm.pulse) : undefined,
        temperature: noteForm.temperature !== '' ? Number(noteForm.temperature) : undefined,
        spo2: noteForm.spo2 !== '' ? Number(noteForm.spo2) : undefined
      } : undefined;

      const storedClinicId = localStorage.getItem('clinicId') || clinicId;
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}/clinical-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          clinicId: storedClinicId,
          noteType: 'Doctor Round',
          patient_condition: noteForm.patient_condition || undefined,
          clinical_findings: noteForm.clinical_findings.trim() || undefined,
          treatment_plan: noteForm.treatment_plan.trim() || undefined,
          note: noteForm.note.trim() || undefined,
          vitals
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to record doctor round');
      }

      setNotification({ type: 'success', message: 'Doctor round / progress note recorded successfully' });
      setNoteForm({ note: '', patient_condition: 'Stable', clinical_findings: '', treatment_plan: '', bp: '', pulse: '', temperature: '', spo2: '' });
      await loadClinicalNotes();
    } catch (err) {
      console.error('Error adding doctor round note:', err);
      setNoteError(err.message || 'Failed to record doctor round');
    } finally {
      setIsNoteSubmitting(false);
    }
  };

  // Handle Amend Note
  const handleAmendNote = async (e) => {
    e.preventDefault();
    if (isNoteSubmitting) return;

    if (!editNoteForm.reason.trim()) {
      setNoteError('A clear reason for amendment is required');
      return;
    }
    const hasContent = (editNoteForm.note || editNoteForm.clinical_findings || editNoteForm.treatment_plan).trim();
    if (!hasContent) {
      setNoteError('Progress note content cannot be empty');
      return;
    }
    setIsNoteSubmitting(true);
    setNoteError('');
    try {
      const vitals = (editNoteForm.bp || editNoteForm.pulse || editNoteForm.temperature || editNoteForm.spo2) ? {
        bp: editNoteForm.bp.trim() || undefined,
        pulse: editNoteForm.pulse !== '' ? Number(editNoteForm.pulse) : undefined,
        temperature: editNoteForm.temperature !== '' ? Number(editNoteForm.temperature) : undefined,
        spo2: editNoteForm.spo2 !== '' ? Number(editNoteForm.spo2) : undefined
      } : undefined;

      const storedClinicId = localStorage.getItem('clinicId') || clinicId;
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}/clinical-notes/${editingNoteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          clinicId: storedClinicId,
          note: editNoteForm.note.trim() || undefined,
          clinical_findings: editNoteForm.clinical_findings.trim() || undefined,
          patient_condition: editNoteForm.patient_condition.trim() || undefined,
          treatment_plan: editNoteForm.treatment_plan.trim() || undefined,
          reason: editNoteForm.reason.trim(),
          vitals
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to amend clinical note');
      }

      setNotification({ type: 'success', message: 'Doctor round / clinical note amended successfully' });
      setEditingNoteId(null);
      setEditNoteForm({ note: '', patient_condition: '', clinical_findings: '', treatment_plan: '', bp: '', pulse: '', temperature: '', spo2: '', reason: '' });
      await loadClinicalNotes();
    } catch (err) {
      console.error('Error amending clinical note:', err);
      setNoteError(err.message || 'Failed to amend clinical note');
    } finally {
      setIsNoteSubmitting(false);
    }
  };

  // Handle Void Note
  const handleVoidNote = async (e) => {
    e.preventDefault();
    if (isNoteSubmitting) return;

    if (!voidReason.trim()) {
      setNoteError('A clear reason for voiding this note is required');
      return;
    }
    setIsNoteSubmitting(true);
    setNoteError('');
    try {
      const storedClinicId = localStorage.getItem('clinicId') || clinicId;
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}/clinical-notes/${voidingNoteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          clinicId: storedClinicId,
          reason: voidReason.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to void clinical note');
      }

      setNotification({ type: 'success', message: 'Clinical note marked as voided' });
      setVoidingNoteId(null);
      setVoidReason('');
      await loadClinicalNotes();
    } catch (err) {
      console.error('Error voiding clinical note:', err);
      setNoteError(err.message || 'Failed to void clinical note');
    } finally {
      setIsNoteSubmitting(false);
    }
  };

  // Handle Discharge Submit
  const handleDischarge = async (e) => {
    e.preventDefault();
    if (!admission) return;
    setIsDischarging(true);
    setDischargeError('');
    try {
      const storedClinicId = localStorage.getItem('clinicId') || clinicId;
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          clinicId: storedClinicId,
          action: 'discharge',
          dischargeSummary: dischargeForm.dischargeSummary.trim() || undefined,
          dischargeCondition: dischargeForm.dischargeCondition
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to discharge patient');
      }

      const bill = data.data?.billing || data.data?.result?.billing;
      let chargeInfo = 'Bed billing calculated.';
      if (bill) {
        if (bill.isRateConfigured) {
          chargeInfo = `Bed billing: ₹${bill.totalBedCharge} (${bill.billableDays} calendar day(s) @ ₹${bill.dailyRate}/day)`;
        } else {
          chargeInfo = `Bed billing: Rate not configured (${bill.billableDays || 1} calendar day(s))`;
        }
      }

      setNotification({
        type: 'success',
        message: `Patient discharged successfully. Bed transitioned to CLEANING. ${chargeInfo}`
      });
      await fetchAdmission();
    } catch (err) {
      console.error('Discharge error:', err);
      setDischargeError(err.message || 'Failed to complete patient discharge');
    } finally {
      setIsDischarging(false);
    }
  };

  // Open Transfer Modal & fetch available wards
  const openTransferModal = async () => {
    setTransferError('');
    setTransferForm({
      destinationWardId: '',
      destinationBedId: '',
      reason: '',
      clinicalNotes: ''
    });
    setTransferBeds([]);
    setTransferModalOpen(true);
    try {
      const storedClinicId = localStorage.getItem('clinicId') || clinicId;
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/wards?clinicId=${storedClinicId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTransferWards(data.data?.wards || []);
      }
    } catch (err) {
      console.error('Failed to load wards for transfer:', err);
      setTransferError('Unable to load clinic wards. Please try again.');
    }
  };

  // When Doctor selects destination ward in transfer modal
  const handleTransferWardChange = async (wardId) => {
    setTransferForm(prev => ({ ...prev, destinationWardId: wardId, destinationBedId: '' }));
    setTransferBeds([]);
    if (!wardId) return;

    setTransferBedsLoading(true);
    setTransferError('');
    try {
      const storedClinicId = localStorage.getItem('clinicId') || clinicId;
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/beds/available?clinicId=${storedClinicId}&wardId=${wardId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTransferBeds(data.data?.beds || []);
      } else {
        setTransferBeds([]);
        setTransferError(data.message || 'No available beds found in the selected ward.');
      }
    } catch (err) {
      console.error('Failed to load available beds for ward:', err);
      setTransferError('Failed to fetch available beds.');
    } finally {
      setTransferBedsLoading(false);
    }
  };

  // Doctor initiates and approves patient transfer
  const handleInitiateTransfer = async (e) => {
    e?.preventDefault();
    if (!transferForm.destinationWardId) {
      setTransferError('Please select a destination ward.');
      return;
    }
    if (!transferForm.destinationBedId) {
      setTransferError('Please select an eligible destination bed.');
      return;
    }

    setTransferSubmitting(true);
    setTransferError('');
    try {
      const storedClinicId = localStorage.getItem('clinicId') || clinicId;
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}/transfers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          clinicId: storedClinicId,
          destinationWardId: transferForm.destinationWardId,
          destinationBedId: transferForm.destinationBedId,
          reason: transferForm.reason.trim() || undefined,
          clinicalNotes: transferForm.clinicalNotes.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to initiate transfer');
      }

      setTransferModalOpen(false);
      setNotification({
        type: 'success',
        message: 'Patient transfer initiated and approved. Destination bed is RESERVED awaiting nurse execution.'
      });
      await fetchAdmission();
    } catch (err) {
      console.error('Transfer initiation error:', err);
      setTransferError(err.message || 'Failed to initiate transfer');
    } finally {
      setTransferSubmitting(false);
    }
  };

  // Doctor cancels a pending transfer
  const handleCancelTransfer = async () => {
    if (!admission?.pendingTransfer?.id) return;
    setCancellingTransfer(true);
    try {
      const storedClinicId = localStorage.getItem('clinicId') || clinicId;
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}/transfers/${admission.pendingTransfer.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          clinicId: storedClinicId,
          reason: cancelReason.trim() || 'Cancelled by Doctor'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to cancel transfer');
      }

      setCancelModalOpen(false);
      setCancelReason('');
      setNotification({
        type: 'success',
        message: 'Patient transfer cancelled. Destination bed has been released back to AVAILABLE.'
      });
      await fetchAdmission();
    } catch (err) {
      console.error('Cancel transfer error:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Failed to cancel transfer'
      });
    } finally {
      setCancellingTransfer(false);
    }
  };

  // Vitals extracted from progress notes and nurse observations chronologically
  const vitalsHistory = useMemo(() => {
    const list = [];
    clinicalNotes.forEach(cn => {
      if (cn.vitals && !cn.is_voided) {
        const v = cn.vitals;
        if (v.bp || v.pulse !== undefined || v.temperature !== undefined || v.spo2 !== undefined) {
          list.push({
            id: cn.id,
            recordedAt: cn.created_at || cn.createdAt,
            recordedBy: cn.doctor_name || cn.author_name || cn.clinician_name || 'Attending Doctor',
            doctorId: cn.doctor_id,
            sourceType: 'Doctor Round',
            vitals: v,
            flags: computeVitalFlags(v),
            noteSnippet: cn.note
          });
        }
      }
    });

    nurseVitals.forEach(nv => {
      const vals = nv.values || {};
      const bpDisplay = vals.bp || (vals.bp_systolic && vals.bp_diastolic ? `${vals.bp_systolic}/${vals.bp_diastolic}` : null);
      list.push({
        id: nv.id,
        recordedAt: nv.recorded_at || nv.recordedAt || nv.created_at,
        recordedBy: nv.nurse_name || nv.nurseName || nv.recorded_by || 'Staff Nurse',
        sourceType: 'Nurse Observation',
        vitals: {
          bp: bpDisplay,
          pulse: vals.pulse,
          temperature: vals.temperature,
          temperature_unit: vals.temperature_unit || 'C',
          respiratory_rate: vals.respiratory_rate,
          spo2: vals.spo2,
          blood_glucose: vals.blood_glucose,
          glucose_context: vals.glucose_context,
          pain_score: vals.pain_score,
          weight: vals.weight
        },
        evaluations: nv.evaluations || {},
        flags: computeVitalFlags({
          bp: bpDisplay,
          pulse: vals.pulse,
          temperature: vals.temperature,
          spo2: vals.spo2
        }),
        isNurseObservation: true,
        hasCritical: Boolean(nv.has_critical),
        hasAbnormal: Boolean(nv.has_abnormal)
      });
    });

    return list.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
  }, [clinicalNotes, nurseVitals]);


  // Billing Calculations
  const billingSummary = useMemo(() => {
    if (!admission) return { billableDays: 1, dailyRate: 0, totalBedCharge: null, isRateConfigured: false };
    if (admission.billing) {
      return {
        billableDays: admission.billing.calendarDays || admission.billing.billableDays || 1,
        dailyRate: admission.billing.dailyRate || admission.billing.bedDailyRate || 0,
        totalBedCharge: admission.billing.totalBedCharge,
        isRateConfigured: Boolean(admission.billing.isRateConfigured),
        rateWarning: admission.billing.rateWarning
      };
    }
    const admDate = admission.admission_date || admission.admissionDate || admission.created_at;
    const disDate = admission.discharge_date || admission.dischargeDate || new Date();
    const days = calculateCalendarDays(admDate, disDate);
    const rawRate = admission.bed_daily_rate !== undefined ? admission.bed_daily_rate : (admission.bed?.dailyRate || admission.bed?.daily_rate);
    const isRateConfigured = rawRate !== undefined && rawRate !== null && !isNaN(Number(rawRate)) && Number(rawRate) > 0;
    const rate = isRateConfigured ? Number(rawRate) : null;
    const total = isRateConfigured ? days * rate : null;
    return {
      billableDays: days,
      dailyRate: rate,
      totalBedCharge: total,
      isRateConfigured
    };
  }, [admission]);

  // Status Helpers
  const isAdmitted = (admission?.status || '').toLowerCase() === 'admitted';
  const isDischarged = (admission?.status || '').toLowerCase() === 'discharged';

  // Authorization helper for note edit/void
  const canModifyNote = (note) => {
    if (!doctorId || !note) return false;
    const noteAuthor = String(note.doctor_id || '').toLowerCase();
    const currentDoc = String(doctorId).toLowerCase();
    return noteAuthor === currentDoc;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading Inpatient Profile...</p>
          <p className="text-xs text-slate-400">Retrieving admission, patient & clinical chart</p>
        </div>
      </div>
    );
  }

  if (error || !admission) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Inpatient Record Not Found</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            {error || 'The requested admission record does not exist or access was denied.'}
          </p>
          <button
            onClick={() => router.push('/doctor-dashboard/ipd')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Inpatient Admissions
          </button>
        </div>
      </div>
    );
  }

  const patientName = toTitleCase(admission.patientName || admission.patient_name || (admission.patient ? `${admission.patient.firstName || ''} ${admission.patient.lastName || ''}`.trim() : 'Patient'));
  const patientCode = admission.patient?.patient_code || admission.patient_code || admission.patient_id || 'N/A';
  const admissionNumber = admission.admission_number || admission.admissionNumber || `ADM-${admission.id?.slice(0, 8)}`;
  const wardName = admission.wardName || admission.ward_name || admission.ward?.name || 'General Ward';
  const rawRoomNumber = admission.roomNumber || admission.room_number || admission.room?.roomNumber || admission.room?.room_number || admission.bed?.roomNumber || admission.bed?.room_number || admission.bed?.room?.roomNumber || admission.bed?.room?.room_number || '';
  const roomNumberDisplay = formatRoomDisplay(rawRoomNumber);
  const roomNumber = rawRoomNumber;
  const bedNumber = admission.bedNumber || admission.bed_number || admission.bed?.bedNumber || admission.bed?.bed_number || 'Bed 01';
  const doctorDisplayName = formatDoctorName(admission.doctorName || admission.doctor_name || (admission.doctor ? `${admission.doctor.firstName || ''} ${admission.doctor.lastName || ''}`.trim() : 'Attending Doctor'));
  const nurseDisplayName = admission.nurseName || admission.nurse_name || (admission.nurse ? `${admission.nurse.firstName || ''} ${admission.nurse.lastName || ''}`.trim() : 'Primary Nurse');

  const consultingDocs = admission.consultingDoctors || [];
  const patientHistory = admission.patientAdmissions || [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'clinical', label: 'Clinical', icon: Stethoscope },
    { id: 'vitals', label: 'Vitals', icon: Activity, count: vitalsHistory.length },
    { id: 'nursing', label: 'Nursing', icon: Heart },
    { id: 'medications', label: 'Medications', icon: Pill },
    { id: 'lab', label: 'Lab', icon: FlaskConical, count: labOrders.length },
    { id: 'radiology', label: 'Radiology', icon: Radio },
    { id: 'procedures', label: 'Procedures', icon: Scissors },
    { id: 'doctor_notes', label: 'Doctor Notes', icon: FileText, count: clinicalNotes.length },
    { id: 'billing', label: 'Billing', icon: DollarSign },
    { id: 'documents', label: 'Documents', icon: FileSpreadsheet },
    { id: 'discharge', label: 'Discharge', icon: LogOut }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Toast Notification */}
      {notification.message && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
              notification.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification({ type: '', message: '' })}
              className="ml-2 text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Top Breadcrumb & Navigation Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/doctor-dashboard/ipd')}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1.5 text-sm font-medium"
              title="Return to Inpatient Admissions List"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Inpatients</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              Inpatient Profile
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isAdmitted && !admission?.pendingTransfer && (
              <button
                onClick={openTransferModal}
                id="doctor-initiate-transfer-btn"
                className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Initiate inpatient bed/ward transfer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Initiate Transfer</span>
              </button>
            )}
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                isAdmitted
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              {isAdmitted ? '● Active Inpatient' : '✓ Discharged'}
            </span>
            <button
              onClick={fetchAdmission}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
              title="Refresh profile details"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* PENDING TRANSFER ALERT BANNER */}
        {admission?.pendingTransfer && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
                <ArrowRightLeft className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-amber-900">Patient Transfer Approved (Awaiting Nurse Execution)</h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-200 text-amber-900 uppercase tracking-wide">
                    {admission.pendingTransfer.status || 'APPROVED'}
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Doctor approved transfer to <strong className="font-semibold">{admission.pendingTransfer.destinationWardName || 'Destination Ward'}</strong> • Bed <strong className="font-semibold">{admission.pendingTransfer.destinationBedNumber || 'Bed'}</strong>.
                  Destination bed is <span className="font-semibold text-amber-900">RESERVED</span>. The assigned nurse will record physical movement and complete the transfer.
                </p>
                {admission.pendingTransfer.reason && (
                  <p className="text-xs text-amber-700 mt-1 italic">
                    Reason: "{admission.pendingTransfer.reason}"
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button
                onClick={() => setCancelModalOpen(true)}
                id="doctor-cancel-transfer-btn"
                className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel Transfer</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================== 1. PROFILE HEADER / BANNER ==================== */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Patient Avatar & Key Identifiers */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xl shadow-sm shrink-0">
                {patientName ? patientName.slice(0, 2).toUpperCase() : 'IP'}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{patientName}</h1>
                  {/* Actual Admission Number prominently displayed */}
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-lg text-xs font-bold">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    Admission #{admissionNumber}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono font-medium">
                    MRN: {patientCode}
                  </span>
                </div>

                {/* Admission Metadata Pills */}
                <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 mt-2 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-400">Admitted:</span>
                    <span className="font-semibold text-slate-700">{formatDateTime(admission.admission_date)}</span>
                  </span>

                  {admission.discharge_date && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-400">Discharged:</span>
                      <span className="font-semibold text-slate-700">{formatDateTime(admission.discharge_date)}</span>
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1.5">
                    <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-700">{wardName}{roomNumberDisplay ? ` • ${roomNumberDisplay}` : ''} • {bedNumber}</span>
                  </span>

                </div>
              </div>
            </div>

            {/* Right: Care Team Summary Card */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-xs">
              <div className="pr-3 border-r border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Admitting Doctor</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                  {doctorDisplayName}
                </span>
              </div>

              <div className="pr-3 border-r border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Assigned Nurse</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  {nurseDisplayName}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Consulting Doctors</span>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {consultingDocs.length > 0 ? (
                    consultingDocs.map((cd, idx) => (
                      <span key={cd.id || idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200 font-medium text-[11px]">
                        {cd.doctorName}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">None assigned</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== 2. PROFILE TABS NAVIGATION ==================== */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-1.5 max-w-full overflow-hidden">
          <nav className="flex items-center gap-1.5 overflow-x-auto scroll-smooth py-1 px-0.5" aria-label="Profile Sections">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ==================== 3. TAB CONTENT PANELS ==================== */}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Cards: Stay Info + Patient Bio */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Stay & Location */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Bed & Accommodation
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                    {billingSummary.isRateConfigured ? `₹${billingSummary.dailyRate}/day` : 'Rate unconfigured'}
                  </span>
                </div>
                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ward:</span>
                    <span className="font-semibold text-slate-800">{wardName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{roomNumberDisplay ? 'Room / Bed:' : 'Bed:'}</span>
                    <span className="font-semibold text-slate-800">
                      {roomNumberDisplay ? `${roomNumberDisplay} / ${bedNumber}` : bedNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Length of Stay:</span>
                    <span className="font-semibold text-slate-800">{billingSummary.billableDays} calendar day(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Stay Status:</span>
                    <span className="font-semibold text-emerald-600">{admission.status?.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Patient Demographics */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-600" />
                    Patient Demographics
                  </h3>
                  <span className="text-xs font-mono text-slate-500">{patientCode}</span>
                </div>
                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Age / Gender:</span>
                    <span className="font-semibold text-slate-800">
                      {admission.patient?.age ? `${admission.patient.age} yrs` : 'N/A'} • {admission.patient?.gender ? toTitleCase(admission.patient.gender) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Blood Group:</span>
                    <span className="font-semibold text-slate-800">{admission.patient?.bloodGroup || admission.patient?.blood_group || 'Not recorded'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-semibold text-slate-800">{admission.patient?.phoneNumber || admission.patient?.phone_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Address:</span>
                    <span className="font-medium text-slate-700 truncate max-w-[180px]">{admission.patient?.address || 'On file'}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Care Team Overview */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    Care Team
                  </h3>
                </div>
                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Admitting Doctor:</span>
                    <span className="font-semibold text-slate-800">{doctorDisplayName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned Nurse:</span>
                    <span className="font-semibold text-slate-800">{nurseDisplayName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Consulting Docs:</span>
                    <span className="font-semibold text-slate-800">{consultingDocs.length} assigned</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Clinic:</span>
                    <span className="font-semibold text-slate-800">{clinicId ? 'Verified Clinic Context' : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Admission Reason Summary */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                Admission Reason & Provisional Diagnosis
              </h3>
              <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                {admission.provisional_diagnosis || admission.provisionalDiagnosis || 'No provisional diagnosis recorded at admission.'}
              </p>
              {admission.notes && (
                <div className="mt-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Initial Admission Notes</span>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                    {admission.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Patient Admission History Table (Requirement 4) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden max-w-full">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-600" />
                    Patient Admission History
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Previous and concurrent IPD admissions recorded for {patientName}.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
                  Total Admissions: {patientHistory.length || 1}
                </span>
              </div>

              <div className="overflow-x-auto max-w-full">
                <table className="w-full min-w-[760px] text-left text-xs border-collapse">
                  <thead className="bg-slate-100/90 border-b border-slate-300 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4 text-slate-900 font-bold whitespace-nowrap">Admission #</th>
                      <th className="py-3.5 px-4 text-slate-900 font-bold whitespace-nowrap">Admitted</th>
                      <th className="py-3.5 px-4 text-slate-900 font-bold whitespace-nowrap">Discharged</th>
                      <th className="py-3.5 px-4 text-slate-900 font-bold whitespace-nowrap">Ward & Bed</th>
                      <th className="py-3.5 px-4 text-slate-900 font-bold whitespace-nowrap">Attending Doctor</th>
                      <th className="py-3.5 px-4 text-slate-900 font-bold">Diagnosis</th>
                      <th className="py-3.5 px-4 text-slate-900 font-bold whitespace-nowrap">Status</th>
                      <th className="py-3.5 px-4 text-right text-slate-900 font-bold whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    {patientHistory.length > 0 ? (
                      patientHistory.map((admItem) => {
                        const isCurrent = admItem.id === admission.id;
                        const admStatus = (admItem.status || '').toLowerCase();
                        return (
                          <tr key={admItem.id} className={isCurrent ? 'bg-blue-50/60' : 'hover:bg-slate-50/90 transition-colors'}>
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-950">
                              <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <span>{admItem.admission_number || admItem.id.slice(0, 8)}</span>
                                {isCurrent && (
                                  <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-sans font-bold">
                                    Current
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-900 font-medium whitespace-nowrap">{formatDateOnly(admItem.admission_date)}</td>
                            <td className="py-3.5 px-4 text-slate-800 font-medium whitespace-nowrap">{admItem.discharge_date ? formatDateOnly(admItem.discharge_date) : '—'}</td>
                            <td className="py-3.5 px-4 font-semibold text-slate-950 whitespace-nowrap">{admItem.ward_name || 'General'} • {admItem.bed_number || 'Bed'}</td>
                            <td className="py-3.5 px-4 text-slate-900 font-medium whitespace-nowrap">{admItem.doctor_name || 'Doctor'}</td>
                            <td className="py-3.5 px-4 max-w-[200px] truncate text-slate-800">{admItem.provisional_diagnosis || '—'}</td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold ${
                                  admStatus === 'admitted'
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                    : 'bg-slate-200 text-slate-900 border border-slate-300'
                                }`}
                              >
                                {admStatus === 'admitted' ? 'Active' : 'Discharged'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              {isCurrent ? (
                                <span className="text-slate-500 text-xs font-semibold italic">Viewing</span>
                              ) : (
                                <button
                                  onClick={() => router.push(`/doctor-dashboard/ipd/${admItem.id}`)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded border border-blue-300 transition-colors cursor-pointer"
                                >
                                  Open Profile
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-6 px-4 text-center text-slate-600 font-medium">
                          This is the patient&apos;s first admission record at this clinic.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inpatient Transfer History Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden max-w-full">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                    Inpatient Transfer History
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Chronological audit of ward and bed movements for this admission.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
                  Total Transfers: {(admission?.transferHistory || []).length}
                </span>
              </div>

              <div className="overflow-x-auto max-w-full">
                <table className="w-full min-w-[760px] text-left text-xs border-collapse">
                  <thead className="bg-slate-100/90 border-b border-slate-300 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4 text-slate-900 font-bold whitespace-nowrap">Date & Time</th>
                      <th className="py-3.5 px-4 text-slate-900 font-bold whitespace-nowrap">From (Source)</th>
                      <th className="py-3.5 px-4 text-slate-900 font-bold whitespace-nowrap">To (Destination)</th>
                      <th className="py-3.5 px-4 text-slate-900 font-bold whitespace-nowrap">Initiating Doctor</th>
                      <th className="py-3.5 px-4 text-slate-900 font-bold whitespace-nowrap">Executing Nurse</th>
                      <th className="py-3.5 px-4 text-slate-900 font-bold">Reason / Notes</th>
                      <th className="py-3.5 px-4 text-center text-slate-900 font-bold whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    {(admission?.transferHistory && admission.transferHistory.length > 0) ? (
                      admission.transferHistory.map((tr) => (
                        <tr key={tr.id} className="hover:bg-slate-50/90 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-slate-900 font-semibold whitespace-nowrap">
                            {formatDateTime(tr.executedAt || tr.executed_at || tr.initiatedAt || tr.initiated_at || tr.createdAt)}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-950 whitespace-nowrap">
                            {tr.sourceWardName || 'Source Ward'} • Bed {tr.sourceBedNumber || 'Bed'}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-950 whitespace-nowrap">
                            {tr.destinationWardName || 'Dest Ward'} • Bed {tr.destinationBedNumber || 'Bed'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-900 font-medium whitespace-nowrap">
                            {tr.initiatingDoctorName || 'Doctor'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-900 font-medium whitespace-nowrap">
                            {tr.executingNurseName || (tr.status === 'APPROVED' ? <span className="italic text-amber-700 font-bold">Pending Execution</span> : '—')}
                          </td>
                          <td className="py-3.5 px-4 max-w-[200px]">
                            {tr.reason && <p className="font-semibold text-slate-900 truncate">{tr.reason}</p>}
                            {tr.movementNotes && <p className="text-[11px] text-slate-600 italic truncate">{tr.movementNotes}</p>}
                            {!tr.reason && !tr.movementNotes && <span className="text-slate-400">—</span>}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold ${
                                tr.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : tr.status === 'APPROVED'
                                  ? 'bg-amber-100 text-amber-950 border border-amber-300'
                                  : tr.status === 'CANCELLED'
                                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                  : 'bg-slate-100 text-slate-800 border border-slate-300'
                              }`}
                            >
                              {tr.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-6 px-4 text-center text-slate-600 font-medium">
                          No transfer records for this inpatient admission.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CLINICAL */}
        {activeTab === 'clinical' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                Admission Reason & Provisional Diagnosis
              </h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                {admission.provisional_diagnosis || admission.provisionalDiagnosis || 'No provisional diagnosis documented.'}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Initial Clinical Notes & Assessment
              </h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap">
                {admission.notes || 'No initial clinical notes entered at the time of admission.'}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-500">
              <span>Primary Specialty: General Medicine / Inpatient Care</span>
              <span>Admitting Clinician: {doctorDisplayName}</span>
            </div>
          </div>
        )}

        {/* TAB 3: VITALS */}
        {activeTab === 'vitals' && (
          <div className="space-y-6">
            {/* Observation Schedule & Early-Warning Score */}
            <VitalsScheduleCard
              admissionId={admissionId}
              clinicId={clinicId}
              scheduleData={vitalsSchedule}
              onScheduleUpdated={(updated) => setVitalsSchedule(updated)}
              canConfigure={true}
            />

            {/* Vital Signs Trend Trajectory */}
            <VitalsTrendChart
              vitalsHistory={vitalsHistory}
              admissionId={admissionId}
            />

            {/* Chronological Observations Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-500" />
                  Vital Signs Chronology & Observations
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Persisted vital observations captured during clinical progress charting.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('doctor_notes')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Record Vitals in Notes
              </button>
            </div>

            {vitalsHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100/90 border-b border-slate-300 text-slate-900 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4 text-slate-900 font-bold">Timestamp</th>
                      <th className="py-3.5 px-4 text-slate-900 font-bold">Clinician</th>
                      <th className="py-3.5 px-4 text-slate-900 font-bold">Blood Pressure</th>
                      <th className="py-3.5 px-4 text-slate-900 font-bold">Pulse (bpm)</th>
                      <th className="py-3.5 px-4 text-slate-900 font-bold">Temperature (°F)</th>
                      <th className="py-3.5 px-4 text-slate-900 font-bold">SpO2 (%)</th>
                      <th className="py-3.5 px-4 text-slate-900 font-bold">Clinical Alerts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {vitalsHistory.map((vItem) => (
                      <tr key={vItem.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap font-mono">{formatDateTime(vItem.recordedAt)}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 block">{vItem.recordedBy}</span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              vItem.sourceType === 'Nurse Observation'
                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {vItem.sourceType}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold">{vItem.vitals.bp || '—'}</td>
                        <td className="py-3 px-4 font-mono">{vItem.vitals.pulse !== undefined && vItem.vitals.pulse !== null ? vItem.vitals.pulse : '—'}</td>
                        <td className="py-3 px-4 font-mono">
                          {vItem.vitals.temperature !== undefined && vItem.vitals.temperature !== null
                            ? `${vItem.vitals.temperature}°${vItem.vitals.temperature_unit || 'F'}`
                            : '—'}
                        </td>
                        <td className="py-3 px-4 font-mono">{vItem.vitals.spo2 !== undefined && vItem.vitals.spo2 !== null ? `${vItem.vitals.spo2}%` : '—'}</td>
                        <td className="py-3 px-4">
                          {vItem.sourceType === 'Nurse Observation' ? (
                            <div className="flex flex-wrap items-center gap-1">
                              {vItem.hasCritical && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  CRITICAL
                                </span>
                              )}
                              {vItem.hasAbnormal && !vItem.hasCritical && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  ABNORMAL
                                </span>
                              )}
                              {!vItem.hasCritical && !vItem.hasAbnormal && (
                                <span className="text-emerald-600 font-semibold text-[11px]">Normal</span>
                              )}
                              {vItem.vitals.blood_glucose !== undefined && vItem.vitals.blood_glucose !== null && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
                                  Glu: {vItem.vitals.blood_glucose}
                                </span>
                              )}
                              {vItem.vitals.respiratory_rate !== undefined && vItem.vitals.respiratory_rate !== null && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
                                  RR: {vItem.vitals.respiratory_rate}
                                </span>
                              )}
                              {vItem.vitals.pain_score !== undefined && vItem.vitals.pain_score !== null && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
                                  Pain: {vItem.vitals.pain_score}/10
                                </span>
                              )}
                            </div>
                          ) : (
                            vItem.flags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {vItem.flags.map(flag => (
                                  <span
                                    key={flag.key}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      flag.severity === 'critical'
                                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                                    }`}
                                  >
                                    {flag.label}: {flag.value}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-emerald-600 font-semibold text-[11px]">Normal</span>
                            )
                          )}
                        </td>
                      </tr>
                    ))}

                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No Vital Readings Recorded</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Vital signs are captured as part of clinical progress notes in the Doctor Notes tab. No readings have been entered yet.
                </p>
                <button
                  onClick={() => setActiveTab('doctor_notes')}
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Note with Vitals
                </button>
              </div>
            )}
            </div>
          </div>
        )}

        {/* TAB 4: NURSING */}
        {activeTab === 'nursing' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                Assigned Nurse Profile
              </h3>
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-lg">
                  {nurseDisplayName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{nurseDisplayName}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Primary Staff Nurse • Assigned Ward: {wardName}</p>
                  <p className="text-xs text-slate-600 mt-1">Status: Active on Duty</p>
                </div>
              </div>
            </div>

            {/* Fluid Intake / Output (I/O) Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Fluid Intake / Output & Balance Charting</h3>
                    <p className="text-xs text-slate-500">
                      Bedside recorded fluid observations and calculated daily balance
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">
                    {ioSummary?.periodCovered || 'All Recorded Dates'}
                  </span>
                  <button
                    type="button"
                    onClick={loadIntakeOutput}
                    disabled={loadingIo}
                    className="p-1.5 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    title="Refresh Fluid Charting"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingIo ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Calculated Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-700">
                    <span className="flex items-center gap-1.5">
                      <ArrowDownRight className="w-4 h-4 text-blue-600" />
                      Calculated Total Intake
                    </span>
                    <span className="text-[10px] font-bold text-blue-500 uppercase">Summary</span>
                  </div>
                  <div className="text-2xl font-black text-blue-900 font-mono">
                    {ioSummary ? ioSummary.totalIntake : 0} <span className="text-sm font-bold text-blue-600">mL</span>
                  </div>
                  <div className="text-[11px] text-blue-800/80 space-y-0.5 border-t border-blue-100/60 pt-1.5 font-medium">
                    <div className="flex justify-between"><span>Oral fluids:</span> <span className="font-mono font-bold">{ioSummary?.intakeBreakdown?.['Oral fluids'] || 0} mL</span></div>
                    <div className="flex justify-between"><span>IV fluids:</span> <span className="font-mono font-bold">{ioSummary?.intakeBreakdown?.['IV fluids'] || 0} mL</span></div>
                    <div className="flex justify-between"><span>Enteral / tube feeding:</span> <span className="font-mono font-bold">{ioSummary?.intakeBreakdown?.['Enteral / tube feeding'] || 0} mL</span></div>
                    <div className="flex justify-between"><span>Other measurable:</span> <span className="font-mono font-bold">{ioSummary?.intakeBreakdown?.['Other measurable intake'] || 0} mL</span></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/40 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
                    <span className="flex items-center gap-1.5">
                      <ArrowUpRight className="w-4 h-4 text-amber-600" />
                      Calculated Total Output
                    </span>
                    <span className="text-[10px] font-bold text-amber-500 uppercase">Summary</span>
                  </div>
                  <div className="text-2xl font-black text-amber-900 font-mono">
                    {ioSummary ? ioSummary.totalOutput : 0} <span className="text-sm font-bold text-amber-600">mL</span>
                  </div>
                  <div className="text-[11px] text-amber-800/80 space-y-0.5 border-t border-amber-100/60 pt-1.5 font-medium">
                    <div className="flex justify-between"><span>Urine:</span> <span className="font-mono font-bold">{ioSummary?.outputBreakdown?.['Urine'] || 0} mL</span></div>
                    <div className="flex justify-between"><span>Vomit / emesis:</span> <span className="font-mono font-bold">{ioSummary?.outputBreakdown?.['Vomit / emesis'] || 0} mL</span></div>
                    <div className="flex justify-between"><span>Drain output:</span> <span className="font-mono font-bold">{ioSummary?.outputBreakdown?.['Drain output'] || 0} mL</span></div>
                    <div className="flex justify-between"><span>Other measurable:</span> <span className="font-mono font-bold">{ioSummary?.outputBreakdown?.['Other measurable output'] || 0} mL</span></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-slate-600" />
                      Net Fluid Balance
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Intake − Output</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-900">
                    {ioSummary ? (ioSummary.netBalance > 0 ? `+${ioSummary.netBalance}` : ioSummary.netBalance) : 0} <span className="text-sm font-bold text-slate-600">mL</span>
                  </div>
                  <p className="text-[11px] text-slate-500 border-t border-slate-200/80 pt-1.5 leading-relaxed">
                    Balance calculated automatically across valid recorded intake and output entries. Negative values indicate net fluid loss.
                  </p>
                </div>
              </div>

              {/* Recorded Observations History */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Recorded Bedside Observations ({intakeOutputs.length})
                  </h4>
                  <span className="text-[11px] text-slate-400 italic">
                    Newest first • Bedside entries by assigned nursing staff
                  </span>
                </div>

                {loadingIo ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-300" />
                    Loading fluid history...
                  </div>
                ) : intakeOutputs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No fluid observations recorded yet for this admission. Bedside entries are submitted through the Nurse Care workflow.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {intakeOutputs.map((item) => {
                      const isVoided = Boolean(item.is_voided || item.isVoided);
                      const isIntake = (item.direction || '').toLowerCase() === 'intake';
                      const recordedDate = item.recorded_at ? new Date(item.recorded_at) : new Date();

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                            isVoided
                              ? 'bg-slate-50 border-slate-200 opacity-60'
                              : isIntake
                              ? 'bg-blue-50/20 border-blue-100'
                              : 'bg-amber-50/20 border-amber-100'
                          }`}
                        >
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
                              <strong className={`font-bold ${isVoided ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                {item.category}
                              </strong>
                              {isVoided && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-rose-100 text-rose-700 rounded uppercase">
                                  Voided
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              <span>{recordedDate.toLocaleDateString()} {recordedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span>•</span>
                              <span>Staff Nurse: <strong className="text-slate-700">{item.nurse_name || item.recorded_by || 'Staff Nurse'}</strong></span>
                            </div>
                            {item.remarks && (
                              <p className="text-slate-600 italic bg-white/60 p-1.5 rounded border border-slate-100">
                                "{item.remarks}"
                              </p>
                            )}
                            {isVoided && item.void_reason && (
                              <p className="text-rose-700 text-[11px] bg-rose-50 p-1.5 rounded border border-rose-200">
                                <strong>Void reason:</strong> {item.void_reason} {item.voided_by_name && `(${item.voided_by_name})`}
                              </p>
                            )}
                          </div>

                          <div className={`text-base font-black font-mono shrink-0 ${
                            isVoided
                              ? 'line-through text-slate-400'
                              : isIntake
                              ? 'text-blue-700'
                              : 'text-amber-700'
                          }`}>
                            {isIntake ? `+${item.amount}` : `-${item.amount}`} <span className="text-xs font-normal">mL</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Nursing Care Notes & Shift Handover Section (Read-Only) */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">Bedside Nursing Care Notes & Shift Handover</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        Read-Only View
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Chronological observations, nursing interventions, and handover items documented by nursing staff
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">
                    {nursingNotes.length} Note{nursingNotes.length === 1 ? '' : 's'}
                  </span>
                  <button
                    type="button"
                    onClick={loadNursingNotes}
                    disabled={loadingNursingNotes}
                    className="p-1.5 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    title="Refresh Nursing Notes"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingNursingNotes ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {loadingNursingNotes ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-300" />
                  Loading nursing notes...
                </div>
              ) : nursingNotes.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No nursing care notes or shift handover entries recorded yet for this admission.
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {nursingNotes.map((note) => {
                    const isHandover = (note.note_type || note.noteType) === 'Shift Handover';
                    const condition = note.patient_condition || note.patientCondition;
                    const recordedDate = note.recorded_at || note.created_at || note.createdAt;
                    const authorName = note.nurse_name || note.nurseName || note.author_name || 'Staff Nurse';
                    const observations = note.nursing_observations || note.nursingObservations;
                    const interventions = note.interventions;
                    const handoverNotes = note.handover_notes || note.handoverNotes;

                    return (
                      <div
                        key={note.id || note._id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5 transition-colors hover:border-slate-300"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                isHandover
                                  ? 'bg-purple-100 text-purple-700 border-purple-200'
                                  : 'bg-blue-100 text-blue-700 border-blue-200'
                              }`}
                            >
                              {note.note_type || note.noteType || 'Nursing Note'}
                            </span>
                            {condition && (
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                  condition === 'Critical'
                                    ? 'bg-rose-100 text-rose-700 border-rose-200'
                                    : condition === 'Guarded'
                                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                                    : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {condition}
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] text-slate-500 font-mono">
                            {formatDateTime(recordedDate)}
                          </span>
                        </div>

                        <div className="text-xs text-slate-700 space-y-2">
                          {observations && (
                            <div>
                              <span className="font-semibold text-slate-900 text-[11px] block">Observations & Assessment:</span>
                              <p className="text-slate-600 whitespace-pre-line pl-2 border-l-2 border-blue-200 mt-0.5">
                                {observations}
                              </p>
                            </div>
                          )}

                          {interventions && (
                            <div>
                              <span className="font-semibold text-slate-900 text-[11px] block">Nursing Care & Interventions:</span>
                              <p className="text-slate-600 whitespace-pre-line pl-2 border-l-2 border-emerald-200 mt-0.5">
                                {interventions}
                              </p>
                            </div>
                          )}

                          {handoverNotes && (
                            <div>
                              <span className="font-semibold text-slate-900 text-[11px] block">Shift Handover & Follow-up:</span>
                              <p className="text-slate-600 whitespace-pre-line pl-2 border-l-2 border-purple-200 mt-0.5">
                                {handoverNotes}
                              </p>
                            </div>
                          )}

                          {!observations && !interventions && !handoverNotes && (
                            <p className="text-slate-600 whitespace-pre-line">{note.note || note.notes || '—'}</p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Documented by: <strong className="text-slate-700">{authorName}</strong></span>
                          {note.id && <span className="font-mono text-[10px] text-slate-400">ID: {String(note.id).slice(0, 8)}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: MEDICATIONS (INPATIENT PRESCRIPTIONS & MAR AUDIT) */}
        {activeTab === 'medications' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-purple-600" />
                  Inpatient Prescription Orders & MAR Audit
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Doctor-authorized inpatient medication regimens and bedside nursing administration records.
                </p>
              </div>

              {admission?.status !== 'discharged' && (
                <button
                  type="button"
                  id="btn-doc-prescribe-med"
                  onClick={() => {
                    setPrescribeForm({
                      medication_name: '',
                      dosage: '',
                      route: 'Oral',
                      frequency: 'TDS',
                      schedule: '',
                      instructions: '',
                      duration: '5 days'
                    });
                    setPrescribeError('');
                    setPrescribeModalOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Prescribe Inpatient Medication</span>
                </button>
              )}
            </div>

            {prescribeSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{prescribeSuccess}</span>
              </div>
            )}

            {/* Active Prescriptions Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Active Prescriptions ({medicationsData.prescriptions?.length || 0})
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">Approved clinical orders currently dispensing at bedside.</p>
                </div>
                <button
                  type="button"
                  onClick={fetchMedications}
                  className="text-xs text-purple-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingMeds ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {loadingMeds ? (
                <div className="p-8 text-center text-xs text-slate-500">Loading prescription orders...</div>
              ) : (medicationsData.prescriptions || []).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No active inpatient prescriptions on file for this admission. Click &quot;Prescribe Inpatient Medication&quot; above to issue orders.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/90 border-b border-slate-300">
                      <tr className="font-bold uppercase tracking-wider text-[11px] text-slate-900">
                        <th className="px-4 py-3.5 text-slate-900 font-bold">Medication</th>
                        <th className="px-4 py-3.5 text-slate-900 font-bold">Dose & Route</th>
                        <th className="px-4 py-3.5 text-slate-900 font-bold">Frequency & Schedule</th>
                        <th className="px-4 py-3.5 text-slate-900 font-bold">Prescription Instructions</th>
                        <th className="px-4 py-3.5 text-slate-900 font-bold">Physician</th>
                        <th className="px-4 py-3.5 text-center text-slate-900 font-bold">Status</th>
                        <th className="px-4 py-3.5 text-right text-slate-900 font-bold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {medicationsData.prescriptions.map((pres) => {
                        const isDiscontinued = (pres.status || '').toLowerCase() === 'discontinued';
                        return (
                          <tr key={pres.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 font-bold text-slate-900">
                              <div>{pres.medication_name || pres.medicationName}</div>
                              {isDiscontinued && (
                                <span className="text-[10px] text-rose-600 font-semibold block mt-0.5">Discontinued Medication</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-slate-800">{pres.dosage || pres.dose}</span>
                              <span className="text-slate-500"> ({pres.route})</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded mr-1.5">{pres.frequency}</span>
                              <span className="font-mono text-slate-500 text-[11px]">
                                {Array.isArray(pres.schedule || pres.schedule_times) ? (pres.schedule || pres.schedule_times).join(', ') : 'Standard'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 max-w-xs">
                              <div>{pres.instructions || 'Standard hospital protocol'}</div>
                              {isDiscontinued && (
                                <div className="mt-1 text-[11px] text-rose-700 font-semibold bg-rose-50/70 px-2 py-0.5 rounded border border-rose-200/60">
                                  Discontinued: &quot;{pres.discontinuation_reason || pres.discontinuationReason || 'Clinical discontinuation'}&quot;
                                  {pres.discontinued_at && (
                                    <span className="text-[10px] text-slate-500 font-normal block">
                                      on {new Date(pres.discontinued_at).toLocaleDateString([], { month: 'short', day: '2-digit' })} by {pres.discontinued_by_name || pres.discontinuedByName || 'Doctor'}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-700 font-medium">{pres.doctor_name || pres.doctorName || 'Attending Physician'}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                isDiscontinued
                                  ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {isDiscontinued ? 'Discontinued' : (pres.status || 'Active')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {!isDiscontinued && admission?.status !== 'discharged' ? (
                                <button
                                  type="button"
                                  id={`btn-discontinue-${pres.id}`}
                                  onClick={() => setDiscontinueModal({
                                    isOpen: true,
                                    prescription: pres,
                                    reasonPreset: 'Therapy Completed / Condition Improved',
                                    reasonText: '',
                                    isSubmitting: false,
                                    error: ''
                                  })}
                                  className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                                  title="Discontinue this medication regimen"
                                >
                                  Discontinue
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 italic">
                                  {isDiscontinued ? 'Discontinued' : '—'}
                                </span>
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

            {/* Bedside Nursing MAR Administration History */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Bedside Nurse Administration History ({medicationsData.marRecords?.length || 0})
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">Chronological eMAR log recorded by assigned nursing staff.</p>
                </div>
              </div>

              {(medicationsData.marRecords || []).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 italic">
                  No bedside doses have been administered or documented yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/90 border-b border-slate-300">
                      <tr className="font-bold uppercase tracking-wider text-[11px] text-slate-900">
                        <th className="px-4 py-3.5 text-slate-900 font-bold">Timestamp</th>
                        <th className="px-4 py-3.5 text-slate-900 font-bold">Medication</th>
                        <th className="px-4 py-3.5 text-slate-900 font-bold">Dose Given</th>
                        <th className="px-4 py-3.5 text-slate-900 font-bold">Route</th>
                        <th className="px-4 py-3.5 text-slate-900 font-bold">Status</th>
                        <th className="px-4 py-3.5 text-slate-900 font-bold">Clinical Reason / Notes</th>
                        <th className="px-4 py-3.5 text-slate-900 font-bold">Acting Nurse</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {medicationsData.marRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {new Date(rec.administered_at || rec.administeredAt || rec.created_at).toLocaleString([], {
                              month: 'short',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900">{rec.medication_name || rec.medicationName}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{rec.administered_dose || rec.prescribed_dose || '—'}</td>
                          <td className="px-4 py-3 text-slate-600">{rec.route || 'Oral'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rec.status === 'ADMINISTERED' ? 'bg-emerald-100 text-emerald-800' :
                              rec.status === 'MISSED' ? 'bg-rose-100 text-rose-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 max-w-xs">
                            {rec.reason && <span className="font-semibold text-rose-700 block text-[11px]">Reason: &quot;{rec.reason}&quot;</span>}
                            {rec.notes && <span className="text-slate-500 italic block text-[11px]">{rec.notes}</span>}
                            {!rec.reason && !rec.notes && <span className="text-slate-400">—</span>}
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-medium">{rec.nurse_name || rec.nurseName || 'Staff Nurse'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* DOCTOR PRESCRIBE INPATIENT MEDICATION MODAL */}
            {prescribeModalOpen && (
              <ModalPortal isOpen={prescribeModalOpen} onClose={() => setPrescribeModalOpen(false)}>
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) setPrescribeModalOpen(false);
                  }}
                >
                  <div className="w-full max-w-md max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in duration-200">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-purple-50/50 shrink-0">
                      <div className="flex items-center gap-2">
                        <Pill className="w-5 h-5 text-purple-700" />
                        <h3 className="text-sm font-bold text-slate-900">Prescribe Inpatient Medication</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPrescribeModalOpen(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleCreatePrescription} className="p-6 space-y-4 overflow-y-auto">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Medication Name & Strength <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={prescribeForm.medication_name}
                          onChange={(e) => setPrescribeForm(prev => ({ ...prev, medication_name: e.target.value }))}
                          placeholder="e.g. Paracetamol 500mg, Ceftriaxone 1g"
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Prescribed Dose <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={prescribeForm.dosage}
                            onChange={(e) => setPrescribeForm(prev => ({ ...prev, dosage: e.target.value }))}
                            placeholder="e.g. 500mg, 1 tab, 1g"
                            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Route <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={prescribeForm.route}
                            onChange={(e) => setPrescribeForm(prev => ({ ...prev, route: e.target.value }))}
                            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white font-medium"
                          >
                            <option value="Oral">Oral (PO)</option>
                            <option value="IV">Intravenous (IV)</option>
                            <option value="IM">Intramuscular (IM)</option>
                            <option value="SC">Subcutaneous (SC)</option>
                            <option value="Inhalation">Inhalation</option>
                            <option value="Topical">Topical</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Frequency <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={prescribeForm.frequency}
                            onChange={(e) => setPrescribeForm(prev => ({ ...prev, frequency: e.target.value }))}
                            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white font-medium"
                          >
                            <option value="OD">OD (Once Daily)</option>
                            <option value="BD">BD (Twice Daily)</option>
                            <option value="TDS">TDS (Thrice Daily)</option>
                            <option value="QID">QID (Four Times Daily)</option>
                            <option value="Q4H">Q4H (Every 4 Hours)</option>
                            <option value="Q6H">Q6H (Every 6 Hours)</option>
                            <option value="Q8H">Q8H (Every 8 Hours)</option>
                            <option value="STAT">STAT (Immediate Single Dose)</option>
                            <option value="PRN">PRN (As Needed)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Duration
                          </label>
                          <input
                            type="text"
                            value={prescribeForm.duration}
                            onChange={(e) => setPrescribeForm(prev => ({ ...prev, duration: e.target.value }))}
                            placeholder="e.g. 5 days, admission course"
                            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Instructions & Precautions
                        </label>
                        <textarea
                          rows={2}
                          value={prescribeForm.instructions}
                          onChange={(e) => setPrescribeForm(prev => ({ ...prev, instructions: e.target.value }))}
                          placeholder="e.g. Take after food, monitor temperature spikes, check IV cannula..."
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white font-medium"
                        />
                      </div>

                      {prescribeError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-800 rounded-lg flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{prescribeError}</span>
                        </div>
                      )}

                      <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setPrescribeModalOpen(false)}
                          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={prescribeSubmitting}
                          className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg shadow-sm"
                        >
                          {prescribeSubmitting ? 'Prescribing...' : 'Authorize Prescription'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </ModalPortal>
            )}

            {/* DOCTOR DISCONTINUE INPATIENT MEDICATION MODAL */}
            {discontinueModal.isOpen && discontinueModal.prescription && (
              <ModalPortal isOpen={discontinueModal.isOpen} onClose={() => setDiscontinueModal(prev => ({ ...prev, isOpen: false }))}>
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) setDiscontinueModal(prev => ({ ...prev, isOpen: false }));
                  }}
                >
                  <div className="w-full max-w-md max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in duration-200">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/70 shrink-0">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-rose-600" />
                        <h3 className="text-sm font-bold text-slate-900">Discontinue Inpatient Medication</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDiscontinueModal(prev => ({ ...prev, isOpen: false }))}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleDiscontinuePrescription} className="p-6 space-y-4 overflow-y-auto">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <div className="text-xs font-bold text-slate-900">
                          {discontinueModal.prescription.medication_name || discontinueModal.prescription.medicationName}
                        </div>
                        <div className="text-xs text-slate-600">
                          Dose: <span className="font-semibold">{discontinueModal.prescription.dosage || discontinueModal.prescription.dose}</span> • Route: <span className="font-semibold">{discontinueModal.prescription.route}</span> • Frequency: <span className="font-semibold">{discontinueModal.prescription.frequency}</span>
                        </div>
                        {discontinueModal.prescription.instructions && (
                          <div className="text-[11px] text-slate-500 italic mt-0.5">
                            Instructions: {discontinueModal.prescription.instructions}
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-700" />
                          <span>Clinical Confirmation Required</span>
                        </div>
                        <p className="text-[11px] text-amber-800">
                          Discontinuing this prescription will stop all future scheduled doses from being generated. Past administration history and nursing logs will be permanently retained in the patient audit record.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Select Preset Discontinuation Reason
                        </label>
                        <select
                          value={discontinueModal.reasonPreset}
                          onChange={(e) => setDiscontinueModal(prev => ({ ...prev, reasonPreset: e.target.value }))}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white font-medium"
                        >
                          <option value="Therapy Completed / Condition Improved">Therapy Completed / Condition Improved</option>
                          <option value="Adverse Reaction / Drug Intolerance">Adverse Reaction / Drug Intolerance</option>
                          <option value="Substituted / Regimen Altered">Substituted / Regimen Altered</option>
                          <option value="Condition Resolved / No Longer Indicated">Condition Resolved / No Longer Indicated</option>
                          <option value="Patient Discharged / Converted to Oral/Outpatient">Patient Discharged / Converted to Oral/Outpatient</option>
                          <option value="Attending Physician Discretion">Attending Physician Discretion</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Clinical Reason Details <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={discontinueModal.reasonText || discontinueModal.reasonPreset}
                          onChange={(e) => setDiscontinueModal(prev => ({ ...prev, reasonText: e.target.value }))}
                          placeholder="Provide clinical rationale for discontinuing this medication..."
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white font-medium"
                        />
                      </div>

                      {discontinueModal.error && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-800 rounded-lg flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{discontinueModal.error}</span>
                        </div>
                      )}

                      <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setDiscontinueModal(prev => ({ ...prev, isOpen: false }))}
                          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          id="btn-confirm-discontinue"
                          disabled={discontinueModal.isSubmitting}
                          className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg shadow-sm"
                        >
                          {discontinueModal.isSubmitting ? 'Discontinuing...' : 'Confirm Discontinue'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </ModalPortal>
            )}
          </div>
        )}

        {/* TAB 6: LAB */}
        {activeTab === 'lab' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-indigo-600" />
                  Diagnostic Laboratory Orders
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Laboratory requisitions and investigation orders on file for {patientName}.
                </p>
              </div>
              <button
                id="btn-open-new-lab-order"
                onClick={() => setIsCreateLabModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Lab Order
              </button>
            </div>

            {loadingLabOrders ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading lab orders...</div>
            ) : labOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100/90 border-b border-slate-300 text-slate-900 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4 text-slate-900 font-bold">Order #</th>
                      <th className="py-3.5 px-4 text-slate-900 font-bold">Priority</th>
                      <th className="py-3.5 px-4 text-slate-900 font-bold">Order Date</th>
                      <th className="py-3.5 px-4 text-slate-900 font-bold">Doctor / Creator</th>
                      <th className="py-3.5 px-4 text-slate-900 font-bold">Items / Tests</th>
                      <th className="py-3.5 px-4 text-slate-900 font-bold">Status</th>
                      <th className="py-3.5 px-4 text-right text-slate-900 font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {labOrders.map(lo => (
                      <tr key={lo.id || lo._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {lo.order_number || lo.orderNumber || lo.id?.slice(0, 8)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getPriorityBadge(lo.priority)}
                        </td>
                        <td className="py-3 px-4">{formatDateTime(lo.created_at || lo.createdAt)}</td>
                        <td className="py-3 px-4">{lo.doctor ? `Dr. ${lo.doctor.first_name || ''} ${lo.doctor.last_name || ''}`.trim() : 'Attending Clinician'}</td>
                        <td className="py-3 px-4 max-w-[200px] truncate">
                          {lo.items && Array.isArray(lo.items)
                            ? lo.items.map(it => it.item_name || it.test_name || 'Lab Test').join(', ')
                            : 'Pathology Panel'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[11px] uppercase">
                            {lo.status || 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            id={`btn-view-lab-order-${lo.id || lo._id}`}
                            onClick={() => setViewingLabOrder(lo)}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold text-xs"
                          >
                            View
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <FlaskConical className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No Laboratory Orders On File</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  No diagnostic tests or pathology panels have been ordered for this patient yet.
                </p>
                <button
                  id="btn-create-lab-requisition"
                  onClick={() => setIsCreateLabModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Lab Requisition
                </button>
              </div>
            )}

            {/* Modal for creating lab requisition with locked inpatient context */}
            <CreateLabOrderModal
              isOpen={isCreateLabModalOpen}
              onClose={() => setIsCreateLabModalOpen(false)}
              initialPatient={{
                id: admission?.patient_id,
                _id: admission?.patient_id,
                patient_name: patientName,
                first_name: admission?.patient?.first_name || patientName,
                last_name: admission?.patient?.last_name || '',
                patient_code: admission?.patient_code || admission?.patient?.patient_code,
                phone_number: admission?.patient_phone || admission?.patient?.phone_number,
                gender: admission?.patient?.gender
              }}
              onOrderCreated={async (newOrder) => {
                await loadLabOrders();
                setNotification({
                  type: 'success',
                  message: `Lab requisition ${newOrder?.order_number || ''} created successfully.`
                });
              }}
              clinicId={clinicId}
            />

            {/* Inline Modal for viewing order details without leaving profile */}
            {viewingLabOrder && (
              <ModalPortal isOpen={Boolean(viewingLabOrder)} onClose={() => setViewingLabOrder(null)}>
                <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[88vh] my-auto">
                    <div className="flex items-center justify-between p-6 pb-3 border-b border-slate-100 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                          <FlaskConical className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            Requisition {viewingLabOrder?.order_number || viewingLabOrder?.orderNumber || viewingLabOrder?.id?.slice(0, 8)}
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            {formatDateTime(viewingLabOrder?.created_at || viewingLabOrder?.createdAt)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setViewingLabOrder(null)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-6 pt-3 overflow-y-auto space-y-3 text-xs flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Order Priority:</span>
                        <div>{getPriorityBadge(viewingLabOrder?.priority)}</div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Status:</span>
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold uppercase text-[10px]">
                          {viewingLabOrder?.status || 'Pending'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Tariff:</span>
                        <span className="font-bold text-slate-900">
                          ₹{Number(viewingLabOrder?.total_amount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      {viewingLabOrder?.clinical_notes && (
                        <div>
                          <span className="text-slate-500 block mb-1">Clinical Instructions:</span>
                          <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800">
                            {viewingLabOrder.clinical_notes}
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500 block mb-1">Ordered Investigation Items:</span>
                        <div className="space-y-1">
                          {Array.isArray(viewingLabOrder?.items) && viewingLabOrder.items.length > 0 ? (
                            viewingLabOrder.items.map((it, idx) => (
                              <div key={it.id || idx} className="p-2 bg-slate-50 rounded border border-slate-100 flex justify-between">
                                <span className="font-medium text-slate-800">{it.item_name || it.test_name || 'Lab Test'}</span>
                                <span className="text-slate-600">₹{it.price || 0}</span>
                              </div>
                            ))
                          ) : (
                            <div className="p-2 bg-slate-50 rounded border border-slate-100 text-slate-500">
                              Pathology Panel
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 px-6 border-t border-slate-100 flex justify-end shrink-0">
                      <button
                        onClick={() => setViewingLabOrder(null)}
                        className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </ModalPortal>
            )}
          </div>
        )}

        {/* TAB 7: RADIOLOGY & DIAGNOSTIC IMAGING */}
        {activeTab === 'radiology' && (
          <div className="space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">Radiology & Diagnostic Imaging</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                        {radiologyOrders.length} {radiologyOrders.length === 1 ? 'Order' : 'Orders'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Requisition digital X-Ray, CT, Ultrasound and MRI studies and review signed specialist diagnostic reports
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadRadiologyOrders}
                  disabled={loadingRadiologyOrders}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Refresh Orders"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingRadiologyOrders ? 'animate-spin text-sky-600' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                {!isDischarged && (
                  <button
                    type="button"
                    onClick={() => {
                      setRadiologyFormError('');
                      fetchActiveLabs(); setIsCreateRadiologyModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Order Radiology</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div
                onClick={() => setRadiologyFilter('ALL')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  radiologyFilter === 'ALL'
                    ? 'bg-sky-50/60 border-sky-300 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-medium text-slate-500">Total Imaging Orders</div>
                <div className="text-lg font-bold text-slate-900 mt-1">{radiologyOrders.length}</div>
              </div>

              <div
                onClick={() => setRadiologyFilter('ORDERED')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  radiologyFilter === 'ORDERED'
                    ? 'bg-blue-50/60 border-blue-300 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-medium text-slate-500">Awaiting Dispatch</div>
                <div className="text-lg font-bold text-blue-600 mt-1">
                  {radiologyOrders.filter(o => o.status === 'ORDERED').length}
                </div>
              </div>

              <div
                onClick={() => setRadiologyFilter('IN_PROGRESS')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  radiologyFilter === 'IN_PROGRESS'
                    ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-medium text-slate-500">In Suite / Scanning</div>
                <div className="text-lg font-bold text-amber-600 mt-1">
                  {radiologyOrders.filter(o => o.status === 'IN_PROGRESS').length}
                </div>
              </div>

              <div
                onClick={() => setRadiologyFilter('COMPLETED')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  radiologyFilter === 'COMPLETED'
                    ? 'bg-emerald-50/60 border-emerald-300 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-medium text-slate-500">Reports Finalized</div>
                <div className="text-lg font-bold text-emerald-600 mt-1">
                  {radiologyOrders.filter(o => o.status === 'COMPLETED').length}
                </div>
              </div>
            </div>

            {/* Orders List / Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {loadingRadiologyOrders ? (
                <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-sky-600" />
                  <span>Loading patient radiology orders & diagnostic imaging history...</span>
                </div>
              ) : radiologyOrders.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
                    <Radio className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No Radiology Orders Recorded</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    No X-Ray, Ultrasound, CT Scan or MRI investigations have been ordered for this admission yet.
                  </p>
                  {!isDischarged && (
                    <button
                      type="button"
                      onClick={() => {
                        setRadiologyFormError('');
                        fetchActiveLabs(); setIsCreateRadiologyModalOpen(true);
                      }}
                      className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Requisition First Investigation</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50/90 text-slate-900 border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4 font-bold">Order # & Date</th>
                        <th className="py-3.5 px-4 font-bold">Investigation / Study</th>
                        <th className="py-3.5 px-4 font-bold">Clinical Indication</th>
                        <th className="py-3.5 px-4 font-bold">Priority</th>
                        <th className="py-3.5 px-4 font-bold">Transport Mode</th>
                        <th className="py-3.5 px-4 font-bold">Workflow Status</th>
                        <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {radiologyOrders
                        .filter(o => radiologyFilter === 'ALL' || o.status === radiologyFilter)
                        .map(order => {
                          const type = order.investigation_type || 'X-Ray';
                          let typeBadge = 'bg-sky-50 text-sky-700 border-sky-200';
                          if (type === 'CT Scan') typeBadge = 'bg-purple-50 text-purple-700 border-purple-200';
                          else if (type === 'Ultrasound') typeBadge = 'bg-teal-50 text-teal-700 border-teal-200';
                          else if (type === 'MRI') typeBadge = 'bg-indigo-50 text-indigo-700 border-indigo-200';

                          const priority = (order.priority || 'routine').toLowerCase();
                          let priorityBadge = 'bg-slate-100 text-slate-700';
                          if (priority.includes('stat') || priority === 'critical') {
                            priorityBadge = 'bg-rose-100 text-rose-800 font-bold';
                          } else if (priority === 'urgent') {
                            priorityBadge = 'bg-amber-100 text-amber-800 font-bold';
                          }

                          const status = order.status || 'ORDERED';
                          let statusBadge = 'bg-blue-50 text-blue-700 border-blue-200';
                          if (status === 'IN_PROGRESS') statusBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                          else if (status === 'COMPLETED') statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
                          else if (status === 'CANCELLED') statusBadge = 'bg-slate-100 text-slate-500 border-slate-200';

                          const hasReport = status === 'COMPLETED' && order.report;

                          return (
                            <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="font-mono font-semibold text-slate-800 block">{order.order_number || order.id?.slice(0, 8)}</span>
                                <span className="text-[11px] text-slate-400 block mt-0.5">{formatDateTime(order.created_at)}</span>
                                <span className="text-[10px] text-sky-700 font-medium block mt-0.5">To: {order.lab_name || order.destination_lab?.name || 'Diagnostic Center'}</span>
                              </td>

                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${typeBadge}`}>
                                    {type}
                                  </span>
                                  <span className="font-semibold text-slate-900">{order.study_name}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5 font-medium flex items-center gap-1.5">
                                  <span>Tariff:</span>
                                  {order.price !== null && order.price !== undefined ? (
                                    <span className="text-emerald-700 font-bold font-mono">₹{order.price}</span>
                                  ) : order.total_amount !== null && order.total_amount !== undefined ? (
                                    <span className="text-emerald-700 font-bold font-mono">₹{order.total_amount}</span>
                                  ) : (
                                    <span className="text-slate-400 italic">Unset</span>
                                  )}
                                </div>
                                {order.instructions && (
                                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">
                                    Note: {order.instructions}
                                  </p>
                                )}
                              </td>

                              <td className="py-3 px-4 max-w-xs">
                                <span className="text-slate-700 line-clamp-2">{order.clinical_indication}</span>
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide ${priorityBadge}`}>
                                  {order.priority || 'routine'}
                                </span>
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap capitalize text-slate-600">
                                {order.transport_mode ? order.transport_mode.replace('_', ' ') : 'Ambulatory'}
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border ${statusBadge}`}>
                                  {status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                                  {status === 'IN_PROGRESS' && <Clock className="w-3 h-3 text-amber-600 animate-spin" />}
                                  {status}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  {hasReport ? (
                                    <button
                                      type="button"
                                      onClick={() => setViewingRadiologyOrder(order)}
                                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>View Report</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setViewingRadiologyOrder(order)}
                                      className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                      <Info className="w-3.5 h-3.5" />
                                      <span>Details</span>
                                    </button>
                                  )}

                                  {!isDischarged && (status === 'ORDERED' || status === 'IN_PROGRESS') && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCancellingRadiologyOrder(order);
                                        setRadiologyCancelReason('');
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      title="Cancel Radiology Order"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* MODAL 1: ORDER RADIOLOGY INVESTIGATION */}
            {isCreateRadiologyModalOpen && (
              <ModalPortal isOpen={Boolean(isCreateRadiologyModalOpen)} onClose={() => setIsCreateRadiologyModalOpen(false)}>
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                  <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
                    {/* Header */}
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-sky-50/50 shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
                          <Radio className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">Order Radiology Investigation</h3>
                          <p className="text-xs text-slate-500">Inpatient Diagnostic Imaging Requisition</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCreateRadiologyModalOpen(false)}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Patient Context Tag */}
                    <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600 shrink-0">
                      <div>Patient: <strong className="text-slate-800">{admission?.patientName || admission?.patient?.name || 'Inpatient'}</strong></div>
                      <div>Admission #: <strong className="font-mono text-slate-800">{admission?.admission_number || admission?.admissionNumber || admission?.id?.slice(0, 8)}</strong></div>
                    </div>

                    {/* Body Form */}
                    <form onSubmit={handleCreateRadiologyOrder} className="p-5 space-y-4 overflow-y-auto flex-1">
                      {radiologyFormError && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{radiologyFormError}</span>
                        </div>
                      )}

                      {/* Destination Laboratory Selector */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Destination Diagnostic Facility <span className="text-rose-500">*</span>
                        </label>
                        {loadingActiveLabs ? (
                          <div className="text-xs text-slate-500 py-2">Loading active diagnostic centers...</div>
                        ) : activeLabs.length === 0 ? (
                          <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                            No active laboratories found. Please contact administration.
                          </div>
                        ) : (
                          <select
                            id="rad-select-destination-lab"
                            value={radiologyForm.lab_id || ''}
                            onChange={(e) => {
                              const lid = e.target.value;
                              const matched = activeLabs.find(l => (l.id === lid || l._id === lid));
                              setRadiologyForm(prev => ({
                                ...prev,
                                lab_id: lid,
                                lab_name: matched?.lab_name || matched?.name || ''
                              }));
                            }}
                            className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                            required
                          >
                            <option value="">-- Select Destination Diagnostic Laboratory --</option>
                            {activeLabs.map(lab => (
                              <option key={lab.id || lab._id} value={lab.id || lab._id}>
                                {lab.lab_name || lab.name} {lab.city ? `(${lab.city})` : ''}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Modality Selector */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">Investigation Modality</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { id: 'X-Ray', label: 'X-Ray' },
                            { id: 'CT Scan', label: 'CT Scan' },
                            { id: 'Ultrasound', label: 'Ultrasound' },
                            { id: 'MRI', label: 'MRI' }
                          ].map(mod => (
                            <button
                              key={mod.id}
                              type="button"
                              onClick={() => {
                                setRadiologyForm(prev => ({
                                  ...prev,
                                  investigation_type: mod.id,
                                  study_name: '' // reset study name for chosen modality
                                }));
                              }}
                              className={`py-2 px-3 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                                radiologyForm.investigation_type === mod.id
                                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {mod.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Common Preset Studies & Tariffs */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Common Preset Protocols & Tariffs</label>
                        <div className="flex flex-wrap gap-1.5">
                          {(IPD_RADIOLOGY_PRESETS[radiologyForm.investigation_type] || []).map(preset => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => setRadiologyForm(prev => ({
                                ...prev,
                                study_name: preset.name,
                                price: preset.price
                              }))}
                              className={`px-2 py-1 rounded-lg text-[11px] transition-colors cursor-pointer border flex items-center gap-1.5 ${
                                radiologyForm.study_name === preset.name
                                  ? 'bg-sky-50 text-sky-700 border-sky-300 font-semibold'
                                  : 'bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 border-slate-200'
                              }`}
                            >
                              <span>{preset.name}</span>
                              <span className="font-mono text-[10px] text-emerald-700 font-bold bg-white px-1 py-0.2 rounded border border-emerald-200">
                                ₹{preset.price}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Study Name Input & Tariff Indicator */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700">
                            Study / Examination Description <span className="text-rose-500">*</span>
                          </label>
                          {radiologyForm.price !== null && radiologyForm.price !== undefined ? (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                              Tariff: ₹{radiologyForm.price}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              Tariff: Unset / Custom Study
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          required
                          value={radiologyForm.study_name}
                          onChange={e => {
                            const val = e.target.value;
                            const matchedPrice = getRadiologyPresetPrice(radiologyForm.investigation_type, val);
                            setRadiologyForm(prev => ({
                              ...prev,
                              study_name: val,
                              price: matchedPrice
                            }));
                          }}
                          placeholder="e.g. Chest PA View"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                        />
                      </div>

                      {/* Priority & Transport Mode */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Priority</label>
                          <select
                            value={radiologyForm.priority}
                            onChange={e => setRadiologyForm(prev => ({ ...prev, priority: e.target.value }))}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                          >
                            <option value="routine">Routine (Standard Turnaround)</option>
                            <option value="urgent">Urgent (Within 4 Hours)</option>
                            <option value="critical_stat">Critical STAT (Immediate / Emergency)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Patient Transport Mode</label>
                          <select
                            value={radiologyForm.transport_mode}
                            onChange={e => setRadiologyForm(prev => ({ ...prev, transport_mode: e.target.value }))}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                          >
                            <option value="ambulatory">Ambulatory (Patient walks to suite)</option>
                            <option value="wheelchair">Wheelchair required</option>
                            <option value="stretcher">Stretcher / Bed transfer required</option>
                            <option value="bedside_portable">Bedside Portable (Equipment comes to ward)</option>
                          </select>
                        </div>
                      </div>

                      {/* Clinical Indication */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Clinical Indication & Diagnosis <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          required
                          rows={3}
                          value={radiologyForm.clinical_indication}
                          onChange={e => setRadiologyForm(prev => ({ ...prev, clinical_indication: e.target.value }))}
                          placeholder="State clinical symptoms, working diagnosis, or suspected pathology (e.g. Acute chest pain, rule out consolidation / pneumothorax)..."
                          className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                        />
                      </div>

                      {/* Instructions */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Special Instructions / Precautions (Optional)
                        </label>
                        <input
                          type="text"
                          value={radiologyForm.instructions}
                          onChange={e => setRadiologyForm(prev => ({ ...prev, instructions: e.target.value }))}
                          placeholder="e.g. O2 cylinder required, check creatinine before contrast, pregnancy ruled out"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                        />
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsCreateRadiologyModalOpen(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isRadiologySubmitting}
                          className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isRadiologySubmitting ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Placing Order...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Requisition Order</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </ModalPortal>
            )}

            {/* MODAL 2: RADIOLOGY REPORT VIEWER & DETAILS */}
            {viewingRadiologyOrder && (
              <ModalPortal isOpen={Boolean(viewingRadiologyOrder)} onClose={() => setViewingRadiologyOrder(null)}>
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                  <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
                    {/* Header */}
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                          <FileCheck2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">
                              {viewingRadiologyOrder.study_name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                              {viewingRadiologyOrder.investigation_type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono">
                            Order #{viewingRadiologyOrder.order_number || viewingRadiologyOrder.id?.slice(0, 8)} • {formatDateTime(viewingRadiologyOrder.created_at)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setViewingRadiologyOrder(null)}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Report Content */}
                    <div className="p-6 space-y-5 overflow-y-auto flex-1">
                      {/* Clinical Indication Header Block */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Ordering Physician:</span>
                          <span className="font-semibold text-slate-800">{viewingRadiologyOrder.doctor_name || 'Attending Doctor'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Priority & Transport:</span>
                          <span className="font-semibold text-slate-800 uppercase">{viewingRadiologyOrder.priority}</span>
                          <span className="text-slate-500 capitalize"> ({viewingRadiologyOrder.transport_mode || 'Ambulatory'})</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-slate-400 block text-[11px]">Clinical Indication:</span>
                          <span className="text-slate-800 font-medium">{viewingRadiologyOrder.clinical_indication}</span>
                        </div>
                        <div className="sm:col-span-2 flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200/80">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Tariff / Amount:</span>
                            <span className="font-bold text-slate-900 text-xs">
                              {viewingRadiologyOrder.price !== null && viewingRadiologyOrder.price !== undefined
                                ? `₹${Number(viewingRadiologyOrder.price).toLocaleString('en-IN')}`
                                : viewingRadiologyOrder.total_amount !== null && viewingRadiologyOrder.total_amount !== undefined
                                ? `₹${Number(viewingRadiologyOrder.total_amount).toLocaleString('en-IN')}`
                                : <span className="text-slate-500 italic font-normal">Tariff Not Set</span>}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Destination Lab:</span>
                            <span className="font-semibold text-sky-800 text-xs">
                              {viewingRadiologyOrder.lab_name || viewingRadiologyOrder.destination_lab?.name || 'Diagnostic Center'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* If Report Finalized */}
                      {viewingRadiologyOrder.report ? (
                        <div className="space-y-4">
                          {/* Finalized Signoff Banner */}
                          <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                              <div>
                                <h4 className="text-xs font-bold text-emerald-900">Final Diagnostic Report Signed</h4>
                                <p className="text-[11px] text-emerald-700">
                                  Verified & finalized by <strong className="font-semibold">{viewingRadiologyOrder.report.uploaded_by?.name || 'Diagnostic Specialist'}</strong>
                                  {viewingRadiologyOrder.report.finalized_at && ` on ${formatDateTime(viewingRadiologyOrder.report.finalized_at)}`}
                                </p>
                              </div>
                            </div>

                            {viewingRadiologyOrder.report.critical_findings && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                Critical Finding
                              </span>
                            )}
                          </div>

                          {/* Findings */}
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                              <span className="w-1.5 h-3.5 bg-sky-600 rounded-full inline-block"></span>
                              Radiological Findings
                            </h4>
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                              {viewingRadiologyOrder.report.findings}
                            </div>
                          </div>

                          {/* Diagnostic Impression */}
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                              <span className="w-1.5 h-3.5 bg-emerald-600 rounded-full inline-block"></span>
                              Diagnostic Impression
                            </h4>
                            <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200 text-xs text-emerald-950 font-medium leading-relaxed whitespace-pre-wrap">
                              {viewingRadiologyOrder.report.impression}
                            </div>
                          </div>

                          {/* Recommendations */}
                          {viewingRadiologyOrder.report.recommendations && (
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                                Recommendations & Clinical Correlation
                              </h4>
                              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                                {viewingRadiologyOrder.report.recommendations}
                              </div>
                            </div>
                          )}

                          {/* Attached Scan / Document Link */}
                          {viewingRadiologyOrder.report.file_url && (
                            <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/50 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <FileText className="w-5 h-5 text-sky-600 shrink-0" />
                                <div>
                                  <div className="text-xs font-bold text-slate-900">
                                    {viewingRadiologyOrder.report.file_name || 'Radiology_Scan_Report.pdf'}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {viewingRadiologyOrder.report.file_size
                                      ? `${Math.round(viewingRadiologyOrder.report.file_size / 1024)} KB`
                                      : 'Attached Digital Scan'}
                                  </div>
                                </div>
                              </div>

                              <a
                                href={viewingRadiologyOrder.report.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Open Full Scan</span>
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                          <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2 animate-pulse" />
                          <h4 className="text-xs font-bold text-slate-800">Imaging Report Pending</h4>
                          <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                            The investigation is currently in workflow status <strong className="uppercase font-semibold">{viewingRadiologyOrder.status}</strong>. Once diagnostic staff complete imaging and attach the finalized report, findings and impressions will appear here.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 px-6 border-t border-slate-100 flex justify-end shrink-0 bg-slate-50/50">
                      <button
                        type="button"
                        onClick={() => setViewingRadiologyOrder(null)}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </ModalPortal>
            )}

            {/* MODAL 3: CANCEL RADIOLOGY ORDER */}
            {cancellingRadiologyOrder && (
              <ModalPortal isOpen={Boolean(cancellingRadiologyOrder)} onClose={() => setCancellingRadiologyOrder(null)}>
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                  <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">Cancel Radiology Order</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCancellingRadiologyOrder(null)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-5 space-y-3">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Are you sure you want to cancel the radiology order for <strong className="text-slate-800">{cancellingRadiologyOrder.study_name}</strong> (#{cancellingRadiologyOrder.order_number})?
                      </p>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Cancellation</label>
                        <input
                          type="text"
                          value={radiologyCancelReason}
                          onChange={e => setRadiologyCancelReason(e.target.value)}
                          placeholder="e.g. Clinical condition stabilized, alternative imaging chosen..."
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                        />
                      </div>
                    </div>

                    <div className="p-4 px-5 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
                      <button
                        type="button"
                        onClick={() => setCancellingRadiologyOrder(null)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                      >
                        Keep Order
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelRadiologyOrder}
                        disabled={isRadiologySubmitting}
                        className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isRadiologySubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
                      </button>
                    </div>
                  </div>
                </div>
              </ModalPortal>
            )}
          </div>
        )}

        {/* TAB 8: PROCEDURES */}
        {activeTab === 'procedures' && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Scissors className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Procedures & Surgical Protocols</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              No surgical, operative, or bedside procedures documented for this admission. Operation Theatre (OT) scheduling and surgical protocol documentation are scheduled for the Procedure Management module.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded text-xs font-mono">
              Status: 0 Procedures Documented
            </div>
          </div>
        )}

        {/* TAB 9: DOCTOR NOTES (Interactive Clinical Chart & Doctor Rounds) */}
        {activeTab === 'doctor_notes' && (
          <div className="space-y-6">
            {/* Discharged Notice */}
            {isDischarged && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shadow-xs">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Inpatient Admission Discharged</span>
                  <p className="mt-0.5 text-amber-800">
                    This admission record is discharged. In accordance with clinical policy, new doctor rounds or progress notes cannot be recorded for discharged admissions. Historical records remain fully accessible below.
                  </p>
                </div>
              </div>
            )}

            {/* New Doctor Round / Progress Note Form */}
            {!isDischarged && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    Record Doctor Round / Clinical Progress Note
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                    Admission #{admissionNumber}
                  </span>
                </div>

                {noteError && (
                  <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{noteError}</span>
                  </div>
                )}

                <form onSubmit={handleAddNote} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Patient Condition
                      </label>
                      <select
                        value={noteForm.patient_condition}
                        onChange={(e) => setNoteForm(prev => ({ ...prev, patient_condition: e.target.value }))}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium"
                      >
                        <option value="Stable">Stable</option>
                        <option value="Improving">Improving</option>
                        <option value="Guarded">Guarded</option>
                        <option value="Critical">Critical</option>
                        <option value="Unchanged">Unchanged</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Clinical Findings & Observations
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Alert, oriented, chest clear on auscultation, wound clean..."
                        value={noteForm.clinical_findings}
                        onChange={(e) => setNoteForm(prev => ({ ...prev, clinical_findings: e.target.value }))}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Doctor's Assessment & Clinical Progress Note <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={noteForm.note}
                      onChange={(e) => setNoteForm(prev => ({ ...prev, note: e.target.value }))}
                      placeholder="Document clinical assessment, progress status, physical examination findings..."
                      className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Treatment Plan & Clinical Instructions
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Continue IV antibiotics, monitor vitals q4h, repeat CBC tomorrow..."
                      value={noteForm.treatment_plan}
                      onChange={(e) => setNoteForm(prev => ({ ...prev, treatment_plan: e.target.value }))}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50"
                    />
                  </div>

                  {/* Vitals Sub-inputs */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Bedside Vital Signs (Optional)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-600 mb-1">Blood Pressure</label>
                        <input
                          type="text"
                          placeholder="e.g. 120/80"
                          value={noteForm.bp}
                          onChange={(e) => setNoteForm(prev => ({ ...prev, bp: e.target.value }))}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600 mb-1">Pulse (bpm)</label>
                        <input
                          type="number"
                          placeholder="e.g. 72"
                          value={noteForm.pulse}
                          onChange={(e) => setNoteForm(prev => ({ ...prev, pulse: e.target.value }))}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600 mb-1">Temperature (°F)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 98.6"
                          value={noteForm.temperature}
                          onChange={(e) => setNoteForm(prev => ({ ...prev, temperature: e.target.value }))}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600 mb-1">SpO2 (%)</label>
                        <input
                          type="number"
                          placeholder="e.g. 98"
                          value={noteForm.spo2}
                          onChange={(e) => setNoteForm(prev => ({ ...prev, spo2: e.target.value }))}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isNoteSubmitting || (!noteForm.note.trim() && !noteForm.clinical_findings.trim() && !noteForm.treatment_plan.trim())}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {isNoteSubmitting ? 'Recording Round...' : 'Record Doctor Round'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Existing Notes Timeline */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />
                  Doctor Rounds & Clinical Notes ({clinicalNotes.length})
                </h3>
                <span className="text-xs text-slate-500">Newest first</span>
              </div>

              {loadingNotes ? (
                <div className="p-8 text-center text-xs text-slate-500">Loading doctor rounds and notes...</div>
              ) : clinicalNotes.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {clinicalNotes.map((cn) => {
                    const isVoid = Boolean(cn.is_voided);
                    const canEdit = canModifyNote(cn) && !isVoid;
                    const flags = cn.vitals ? computeVitalFlags(cn.vitals) : [];
                    const authorName = cn.doctor_name || cn.author_name || (cn.doctor ? `Dr. ${cn.doctor.firstName || ''} ${cn.doctor.lastName || ''}`.trim() : 'Attending Clinician');
                    const isAuthorYou = doctorId && cn.doctor_id && String(cn.doctor_id).toLowerCase() === String(doctorId).toLowerCase();
                    const noteTypeLabel = cn.note_type || cn.noteType || 'Doctor Round';
                    const condition = cn.patient_condition || cn.patientCondition;
                    const findings = cn.clinical_findings || cn.findings;
                    const plan = cn.treatment_plan || cn.treatmentPlan || cn.instructions;

                    return (
                      <div key={cn.id} className={`p-5 transition-colors ${isVoid ? 'bg-slate-50/70 opacity-60' : 'hover:bg-slate-50/40'}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-xs text-slate-900">
                              {authorName} {isAuthorYou && <span className="text-blue-600 font-bold">(You)</span>}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[11px] font-mono text-slate-500">
                              {formatDateTime(cn.created_at || cn.createdAt)}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {noteTypeLabel}
                            </span>
                            {condition && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Condition: {condition}
                              </span>
                            )}
                            {isVoid && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                VOIDED
                              </span>
                            )}
                          </div>

                          {canEdit && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingNoteId(cn.id);
                                  setEditNoteForm({
                                    note: cn.note || '',
                                    clinical_findings: cn.clinical_findings || cn.findings || '',
                                    patient_condition: cn.patient_condition || cn.patientCondition || '',
                                    treatment_plan: cn.treatment_plan || cn.treatmentPlan || cn.instructions || '',
                                    bp: cn.vitals?.bp || '',
                                    pulse: cn.vitals?.pulse !== undefined ? String(cn.vitals.pulse) : '',
                                    temperature: cn.vitals?.temperature !== undefined ? String(cn.vitals.temperature) : '',
                                    spo2: cn.vitals?.spo2 !== undefined ? String(cn.vitals.spo2) : '',
                                    reason: ''
                                  });
                                  setNoteError('');
                                }}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Amend Note"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setVoidingNoteId(cn.id);
                                  setVoidReason('');
                                  setNoteError('');
                                }}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                title="Void Note"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Structured Findings if present */}
                        {findings && (
                          <div className={`mt-2 text-xs text-slate-700 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 ${isVoid ? 'line-through' : ''}`}>
                            <span className="font-semibold text-slate-900 block mb-0.5">Clinical Findings:</span>
                            {findings}
                          </div>
                        )}

                        {/* Note Text / Assessment */}
                        <div className={`mt-2 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap ${isVoid ? 'line-through' : ''}`}>
                          {cn.note}
                        </div>

                        {/* Treatment Plan if present */}
                        {plan && (
                          <div className={`mt-2 text-xs text-indigo-900 bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-100 ${isVoid ? 'line-through' : ''}`}>
                            <span className="font-semibold text-indigo-950 block mb-0.5">Treatment Plan / Instructions:</span>
                            {plan}
                          </div>
                        )}

                        {/* Vitals summary if present */}
                        {cn.vitals && (
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                            {cn.vitals.bp && (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                                BP: {cn.vitals.bp}
                              </span>
                            )}
                            {cn.vitals.pulse !== undefined && (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                                Pulse: {cn.vitals.pulse} bpm
                              </span>
                            )}
                            {cn.vitals.temperature !== undefined && (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                                Temp: {cn.vitals.temperature}°F
                              </span>
                            )}
                            {cn.vitals.spo2 !== undefined && (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                                SpO2: {cn.vitals.spo2}%
                              </span>
                            )}
                            {flags.map(f => (
                              <span
                                key={f.key}
                                className={`px-2 py-0.5 rounded font-bold ${
                                  f.severity === 'critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {f.label}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Amendment Audit History */}
                        {cn.amendments && cn.amendments.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                            <span className="font-semibold text-slate-600">Amendment History:</span>
                            {cn.amendments.map((am, i) => {
                              const actor = resolveAuditActorName(am.amended_by, doctorId, doctorName, docMap);
                              const reason = cleanAuditReason(am.reason, 'Clinical update');
                              return (
                                <div key={i} className="pl-2 border-l-2 border-indigo-200">
                                  Amended by <span className="font-medium text-slate-700">{actor}</span>: &ldquo;{reason}&rdquo; ({formatDateTime(am.amended_at)})
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Void Audit Record */}
                        {isVoid && cn.void_reason && (
                          <div className="mt-2 text-[11px] text-rose-700 bg-rose-50 p-2 rounded border border-rose-100">
                            Reason for voiding: &ldquo;{cleanAuditReason(cn.void_reason)}&rdquo; (by {resolveAuditActorName(cn.voided_by, doctorId, doctorName, docMap)} at {formatDateTime(cn.voided_at)})
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  No clinical progress notes on file for this admission. Use the form above to add a progress note.
                </div>
              )}
            </div>

            {/* Amend Note Modal */}
            {editingNoteId && (
              <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto flex flex-col">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-sm text-slate-900">Amend Clinical Progress Note</h3>
                    <button onClick={() => setEditingNoteId(null)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
                  </div>
                  <form onSubmit={handleAmendNote} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Updated Note Content</label>
                      <textarea
                        rows={3}
                        value={editNoteForm.note}
                        onChange={(e) => setEditNoteForm(prev => ({ ...prev, note: e.target.value }))}
                        className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Findings</label>
                        <input
                          type="text"
                          value={editNoteForm.clinical_findings}
                          onChange={(e) => setEditNoteForm(prev => ({ ...prev, clinical_findings: e.target.value }))}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Treatment Plan</label>
                        <input
                          type="text"
                          value={editNoteForm.treatment_plan}
                          onChange={(e) => setEditNoteForm(prev => ({ ...prev, treatment_plan: e.target.value }))}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Reason for Amendment <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Corrected vital observation, updated assessment"
                        value={editNoteForm.reason}
                        onChange={(e) => setEditNoteForm(prev => ({ ...prev, reason: e.target.value }))}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingNoteId(null)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isNoteSubmitting || !editNoteForm.reason.trim() || (!editNoteForm.note.trim() && !editNoteForm.clinical_findings.trim() && !editNoteForm.treatment_plan.trim())}
                        className="px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isNoteSubmitting ? 'Amending...' : 'Confirm Amendment'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Void Note Modal */}
            {voidingNoteId && (
              <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto flex flex-col">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-sm text-rose-700 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      Void Clinical Note
                    </h3>
                    <button onClick={() => setVoidingNoteId(null)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Voiding retains the note in the audit trail but strikes it out from active clinical decisions. A reason is required.
                  </p>
                  <form onSubmit={handleVoidNote} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Reason for Voiding <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Entered in error, wrong patient chart"
                        value={voidReason}
                        onChange={(e) => setVoidReason(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setVoidingNoteId(null)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isNoteSubmitting || !voidReason.trim()}
                        className="px-4 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50"
                      >
                        {isNoteSubmitting ? 'Voiding...' : 'Confirm Void'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 10: BILLING */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Inpatient Bed Charges & Tariff Breakdown
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Calculated using standard midnight calendar-day billing rule.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
                  Status: {isAdmitted ? 'Stay in progress' : 'Final Stay Completed'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Daily Bed Tariff</span>
                  <span className="text-xl font-bold text-slate-900 mt-1 block">
                    {billingSummary.isRateConfigured ? `₹${billingSummary.dailyRate}` : 'Unconfigured'}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">{wardName} • {bedNumber}</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Billable Stay</span>
                  <span className="text-xl font-bold text-slate-900 mt-1 block">
                    {billingSummary.billableDays} calendar day(s)
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    {formatDateOnly(admission.admission_date)} to {formatDateOnly(admission.discharge_date || new Date())}
                  </span>
                </div>

                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Total Bed Charge</span>
                  <span className="text-xl font-bold text-emerald-900 mt-1 block">
                    {billingSummary.isRateConfigured ? `₹${billingSummary.totalBedCharge}` : 'Pending rate config'}
                  </span>
                  <span className="text-[11px] text-emerald-700 mt-0.5 block">
                    {billingSummary.billableDays} day(s) × ₹{billingSummary.dailyRate}
                  </span>
                </div>
              </div>

              {/* Truthful distinction between partial bed charges and full bill */}
              <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-950">Partial Bed Accommodation Preview</p>
                  <p className="text-amber-800 leading-relaxed">
                    This breakdown displays calculated inpatient bed accommodation charges only. Additional clinical services (such as pharmacy medications, pathology diagnostics, surgical procedures, and doctor rounds) will be consolidated upon final invoice generation at discharge.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 11: DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FileCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Patient Documents & Clinical Scans</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              No clinical documents, ID proofs, or consent forms uploaded for this admission. Encrypted document repository integration is scheduled for upcoming workflow release.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded text-xs font-mono">
              Status: 0 Documents Attached
            </div>
          </div>
        )}

        {/* TAB 12: DISCHARGE */}
        {activeTab === 'discharge' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-rose-600" />
                  Admission & Discharge Status
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage patient discharge clearance and view summary details.
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  isDischarged
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isDischarged ? 'Discharged' : 'Active Inpatient'}
              </span>
            </div>

            {isDischarged ? (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Discharge Date & Time:</span>
                    <span className="font-semibold text-slate-800">{formatDateTime(admission.discharge_date || admission.dischargeDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Discharge Condition:</span>
                    <span className="font-semibold text-slate-800 capitalize">{admission.discharge_condition || admission.dischargeCondition || 'Improved'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Final Bed Status:</span>
                    <span className="font-semibold text-amber-700">Transitioned to CLEANING upon discharge</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Stay:</span>
                    <span className="font-semibold text-slate-800">{billingSummary.billableDays} calendar day(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Final Bed Charge:</span>
                    <span className="font-semibold text-slate-800">
                      {billingSummary.isRateConfigured && billingSummary.totalBedCharge !== null
                        ? `₹${billingSummary.totalBedCharge} (${billingSummary.billableDays} calendar day(s) @ ₹${billingSummary.dailyRate}/day)`
                        : 'Rate not configured (Pending configuration)'}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Discharge Summary / Instructions</h4>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap">
                    {(admission.discharge_summary || admission.dischargeSummary || '').trim() || 'No discharge clinical summary was documented.'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                  <span className="font-bold block">Patient is currently admitted in {wardName} ({bedNumber}).</span>
                  <span className="text-emerald-800 mt-0.5 block">
                    Discharging the patient will mark the bed status as <strong>CLEANING</strong> and calculate final calendar-day bed charges.
                  </span>
                </div>

                {dischargeError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{dischargeError}</span>
                  </div>
                )}

                <form onSubmit={handleDischarge} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Discharge Condition <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={dischargeForm.dischargeCondition}
                      onChange={(e) => setDischargeForm(prev => ({ ...prev, dischargeCondition: e.target.value }))}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="improved">Improved / Stable</option>
                      <option value="recovered">Fully Recovered</option>
                      <option value="transferred">Transferred to another facility</option>
                      <option value="dama">Discharged Against Medical Advice (DAMA)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Discharge Summary / Clinical Instructions
                    </label>
                    <textarea
                      rows={4}
                      value={dischargeForm.dischargeSummary}
                      onChange={(e) => setDischargeForm(prev => ({ ...prev, dischargeSummary: e.target.value }))}
                      placeholder="Outline diagnosis on discharge, treatment given, medications advised, and follow-up plan..."
                      className="w-full text-xs p-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isDischarging}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {isDischarging ? 'Processing Discharge...' : 'Confirm Patient Discharge'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================== 4. INITIATE TRANSFER MODAL ==================== */}
      <ModalPortal isOpen={transferModalOpen} onClose={() => setTransferModalOpen(false)}>
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto my-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Initiate Patient Transfer</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Approve and reserve destination bed for {patientName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTransferModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInitiateTransfer} className="mt-5 space-y-4">
              {/* Current Bed Context */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Current Assignment</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {wardName}{roomNumberDisplay ? ` • ${roomNumberDisplay}` : ''} • Bed {bedNumber}
                </p>
              </div>

              {/* Destination Ward Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination Ward <span className="text-rose-500">*</span>
                </label>
                <select
                  id="transfer-destination-ward-select"
                  value={transferForm.destinationWardId}
                  onChange={(e) => handleTransferWardChange(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="">Select Destination Ward...</option>
                  {transferWards.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.type || 'Ward'}) {w.id === admission?.ward_id ? '• (Current Ward)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Bed Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination Bed <span className="text-rose-500">*</span>
                </label>
                <select
                  id="transfer-destination-bed-select"
                  value={transferForm.destinationBedId}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, destinationBedId: e.target.value }))}
                  required
                  disabled={!transferForm.destinationWardId || transferBedsLoading}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 font-medium disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">
                    {transferBedsLoading
                      ? 'Loading available beds...'
                      : !transferForm.destinationWardId
                      ? 'Select a destination ward first'
                      : transferBeds.length === 0
                      ? 'No available beds in this ward'
                      : 'Select Destination Bed...'}
                  </option>
                  {transferBeds.map(b => (
                    <option key={b.id} value={b.id}>
                      Bed {b.bed_number || b.bedNumber} {b.room_number ? `(${b.room_number})` : ''} — ₹{b.daily_rate || b.dailyRate || 0}/day
                    </option>
                  ))}
                </select>
              </div>

              {/* Clinical Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Reason / Indication
                </label>
                <input
                  type="text"
                  id="transfer-reason-input"
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g. Clinical improvement, step-down care, isolation, or patient request"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Clinical Handover Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Special Instructions / Handover Notes
                </label>
                <textarea
                  rows={3}
                  id="transfer-clinical-notes-input"
                  value={transferForm.clinicalNotes}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, clinicalNotes: e.target.value }))}
                  placeholder="Instructions for receiving ward, transport equipment needed (oxygen, wheelchair), etc."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {transferError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-800 rounded-lg flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{transferError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-doctor-transfer-btn"
                  disabled={transferSubmitting || !transferForm.destinationBedId}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  {transferSubmitting ? 'Approving Transfer...' : 'Approve & Reserve Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>

      {/* ==================== 5. CANCEL TRANSFER MODAL ==================== */}
      <ModalPortal isOpen={cancelModalOpen} onClose={() => setCancelModalOpen(false)}>
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto my-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">Cancel Transfer Request</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Release reserved destination bed back to available inventory
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to cancel the transfer to{' '}
                <strong>{admission?.pendingTransfer?.destinationWardName} (Bed {admission?.pendingTransfer?.destinationBedNumber})</strong>?
                The reserved bed will immediately become AVAILABLE for other patients.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Cancellation
                </label>
                <input
                  type="text"
                  id="cancel-transfer-reason-input"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Clinical condition changed, patient declined"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Keep Transfer
              </button>
              <button
                type="button"
                id="confirm-cancel-transfer-btn"
                onClick={handleCancelTransfer}
                disabled={cancellingTransfer}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                {cancellingTransfer ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}
