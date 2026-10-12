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
  Scale
} from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import CreateLabOrderModal from '@/components/CreateLabOrderModal';
import VitalsTrendChart from '@/components/VitalsTrendChart';
import VitalsScheduleCard from '@/components/VitalsScheduleCard';
import { getPriorityBadge } from '@/components/LabOrdersManagement';
import ModalPortal from '@/components/ModalPortal';

// --- Utility Helpers ---

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


  // Lab Orders
  const [labOrders, setLabOrders] = useState([]);
  const [loadingLabOrders, setLoadingLabOrders] = useState(false);
  const [isCreateLabModalOpen, setIsCreateLabModalOpen] = useState(false);
  const [viewingLabOrder, setViewingLabOrder] = useState(null);

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
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-1.5">
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth" aria-label="Profile Sections">
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
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
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
                <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
                  Total Admissions: {patientHistory.length || 1}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Admission #</th>
                      <th className="py-3 px-4">Admitted</th>
                      <th className="py-3 px-4">Discharged</th>
                      <th className="py-3 px-4">Ward & Bed</th>
                      <th className="py-3 px-4">Attending Doctor</th>
                      <th className="py-3 px-4">Diagnosis</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {patientHistory.length > 0 ? (
                      patientHistory.map((admItem) => {
                        const isCurrent = admItem.id === admission.id;
                        const admStatus = (admItem.status || '').toLowerCase();
                        return (
                          <tr key={admItem.id} className={isCurrent ? 'bg-blue-50/50' : 'hover:bg-slate-50/80 transition-colors'}>
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">
                              <div className="flex items-center gap-1.5">
                                <span>{admItem.admission_number || admItem.id.slice(0, 8)}</span>
                                {isCurrent && (
                                  <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-sans font-bold">
                                    Current
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">{formatDateOnly(admItem.admission_date)}</td>
                            <td className="py-3 px-4">{admItem.discharge_date ? formatDateOnly(admItem.discharge_date) : '—'}</td>
                            <td className="py-3 px-4">{admItem.ward_name || 'General'} • {admItem.bed_number || 'Bed'}</td>
                            <td className="py-3 px-4">{admItem.doctor_name || 'Doctor'}</td>
                            <td className="py-3 px-4 max-w-[180px] truncate">{admItem.provisional_diagnosis || '—'}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                  admStatus === 'admitted'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {admStatus === 'admitted' ? 'Active' : 'Discharged'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {isCurrent ? (
                                <span className="text-slate-400 text-xs italic">Viewing</span>
                              ) : (
                                <button
                                  onClick={() => router.push(`/doctor-dashboard/ipd/${admItem.id}`)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
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
                        <td colSpan={8} className="py-4 px-4 text-center text-slate-400">
                          This is the patient&apos;s first admission record at this clinic.
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
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Clinician</th>
                      <th className="py-3 px-4">Blood Pressure</th>
                      <th className="py-3 px-4">Pulse (bpm)</th>
                      <th className="py-3 px-4">Temperature (°F)</th>
                      <th className="py-3 px-4">SpO2 (%)</th>
                      <th className="py-3 px-4">Clinical Alerts</th>
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
          </div>
        )}

        {/* TAB 5: MEDICATIONS */}
        {activeTab === 'medications' && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
              <Pill className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Inpatient Pharmacy & MAR Integration</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              Inpatient medication dispensing and bedside MAR schedules are managed through the dedicated Pharmacy Dispensing workflow. Outpatient discharge prescriptions can be issued via the Consultation module.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded text-xs font-mono">
              Status: No active inpatient orders linked directly to this admission record
            </div>
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
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Order Date</th>
                      <th className="py-3 px-4">Doctor / Creator</th>
                      <th className="py-3 px-4">Items / Tests</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
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

        {/* TAB 7: RADIOLOGY */}
        {activeTab === 'radiology' && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
              <Radio className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Radiology & Diagnostic Imaging</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              No digital imaging orders (X-Ray, Ultrasound, CT, MRI) currently recorded for this admission. Digital PACS & DICOM imaging requisition module is scheduled for integration.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded text-xs font-mono">
              Status: PACS Module Not Configured
            </div>
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
    </div>
  );
}
