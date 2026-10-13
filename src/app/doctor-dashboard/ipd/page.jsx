'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import {
  BedDouble,
  UserCheck,
  Stethoscope,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Calendar,
  Building2,
  User,
  HeartPulse,
  FileText,
  UserPlus,
  LogOut,
  X,
  ShieldAlert,
  ArrowLeft,
  ChevronRight,
  Activity,
  Layers,
  Edit3,
  Ban,
  Check,
  Info,
  Eye
} from 'lucide-react';

export function formatTitleCase(str) {
  if (!str || typeof str !== 'string') return '';
  const trimmed = str.trim();
  if (!trimmed) return '';
  return trimmed
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function formatWardOptionLabel(w) {
  if (!w) return 'Ward';
  let name = (w.name || 'Ward').trim();
  if (name.toLowerCase() === 'icu') name = 'ICU';
  else if (name.toLowerCase() === 'ccu') name = 'CCU';
  else if (name.toLowerCase() === 'nicu') name = 'NICU';
  else if (name.toLowerCase() === 'picu') name = 'PICU';
  const type = (w.ward_type || w.wardType || w.type || '').trim();
  if (type && type.toLowerCase() !== name.toLowerCase()) {
    return `${name} (${type})`;
  }
  return name;
}

export function isDoctorMatch(admDocId, docId) {
  if (!admDocId || !docId) return false;
  return String(admDocId).trim().toLowerCase() === String(docId).trim().toLowerCase();
}

export function getAdmittingDocId(adm) {
  if (!adm) return undefined;
  return adm.admitting_doctor_id || adm.admittingDoctorId || adm.doctor_id || adm.doctorId;
}

export function getAdmittingDoctorName(adm, currentDoctorId, currentDoctorName, docMap = {}) {
  if (!adm) return 'Attending Doctor';
  const admDocId = getAdmittingDocId(adm);
  const isSelf = isDoctorMatch(admDocId, currentDoctorId);

  const rawName = (adm.admittingDoctorName || adm.admitting_doctor_name || '').trim();
  const isGeneric = !rawName || rawName.toLowerCase() === 'doctor' || rawName.toLowerCase() === 'dr. doctor';

  if (!isGeneric) {
    return rawName;
  }

  if (isSelf && currentDoctorName && currentDoctorName.toLowerCase() !== 'doctor') {
    return currentDoctorName;
  }

  if (admDocId) {
    const key = String(admDocId).trim().toLowerCase();
    if (docMap[key]) return docMap[key];
    if (docMap[admDocId]) return docMap[admDocId];
  }

  const nested = adm.doctor || adm.admittingDoctor || adm.staff;
  if (nested) {
    const nName = nested.name || `Dr. ${nested.first_name || nested.firstName || ''} ${nested.last_name || nested.lastName || ''}`.trim();
    if (nName && nName !== 'Dr.') return nName;
  }

  return isSelf ? (currentDoctorName || 'Doctor') : (rawName || 'Dr. Doctor');
}

export function calculateCalendarDays(admissionDate, dischargeDate = new Date(), timeZone = 'Asia/Kolkata') {
  if (!admissionDate) return 1;
  try {
    const getLocalDateString = (d) => {
      const dateObj = new Date(d);
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
  if (currentDoctorId && isDoctorMatch(val, currentDoctorId)) {
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

export function matchesDateFilter(dateStr, filter) {
  if (!filter || filter === 'all') return true;
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const now = new Date();

    if (filter === 'today') {
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }
    if (filter === 'last_7_days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      return d >= sevenDaysAgo;
    }
    if (filter === 'last_30_days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      return d >= thirtyDaysAgo;
    }
    return true;
  } catch (_) {
    return true;
  }
}

export function matchesIpdSearch(adm, query, doctorId, doctorName, docMap = {}) {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();

  const pName = (adm.patientName || adm.patient_name || '').toLowerCase();
  const pCode = (adm.patient?.patient_code || adm.patient_code || adm.patientCode || adm.patient_id || '').toLowerCase();
  const admNum = (adm.admission_number || adm.admissionNumber || '').toLowerCase();
  const wName = (adm.wardName || adm.ward_name || '').toLowerCase();
  const bNum = (adm.bedNumber || adm.bed_number || '').toLowerCase();
  const rNum = (adm.roomNumber || adm.room_number || '').toLowerCase();
  const doc = getAdmittingDoctorName(adm, doctorId, doctorName, docMap).toLowerCase();
  const nurse = (adm.nurseName || adm.nurse_name || '').toLowerCase();
  const consultants = (adm.consultingDoctors || []).map(cd => (cd.doctorName || cd.doctor_name || '')).join(' ').toLowerCase();

  return (
    pName.includes(q) ||
    pCode.includes(q) ||
    admNum.includes(q) ||
    wName.includes(q) ||
    bNum.includes(q) ||
    rNum.includes(q) ||
    doc.includes(q) ||
    nurse.includes(q) ||
    consultants.includes(q)
  );
}

function DoctorIpdPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPatientId = searchParams.get('patientId');

  // Authenticated Doctor & Clinic Context
  const [doctorId, setDoctorId] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [isIpdEnabled, setIsIpdEnabled] = useState(null);

  // Data states
  const [admissions, setAdmissions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [clinicDoctors, setClinicDoctors] = useState([]);
  const [wards, setWards] = useState([]);
  const [availableBeds, setAvailableBeds] = useState([]);
  const [wardNurses, setWardNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bedsLoading, setBedsLoading] = useState(false);
  const [nursesLoading, setNursesLoading] = useState(false);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'my_admissions', 'consulting'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'admitted', 'discharged'
  const [wardFilter, setWardFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [isConsultingModalOpen, setIsConsultingModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);

  // Clinical Notes CRUD State
  const [clinicalNotesList, setClinicalNotesList] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteForm, setEditNoteForm] = useState({
    note: '',
    bp: '',
    pulse: '',
    temperature: '',
    spo2: '',
    reason: ''
  });

  // Notification & Error
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Admit Form State
  const [admitForm, setAdmitForm] = useState({
    patientId: initialPatientId || '',
    wardId: '',
    bedId: '',
    nurseId: '',
    provisionalDiagnosis: '',
    notes: ''
  });

  // Consulting Doctor Form State
  const [consultingForm, setConsultingForm] = useState({
    doctorId: '',
    notes: ''
  });

  // Clinical Note Form State
  const [noteForm, setNoteForm] = useState({
    note: '',
    bp: '',
    pulse: '',
    temperature: '',
    spo2: ''
  });

  // Discharge Form State
  const [dischargeForm, setDischargeForm] = useState({
    dischargeSummary: '',
    dischargeCondition: 'improved'
  });

  // Map of Doctor IDs to Names
  const docMap = useMemo(() => {
    const map = {};
    (clinicDoctors || []).forEach(d => {
      const id = d.id || d._id;
      const name = d.name || `Dr. ${d.first_name || d.firstName || ''} ${d.last_name || d.lastName || ''}`.trim();
      if (id) {
        map[id] = name;
        map[String(id).trim().toLowerCase()] = name;
      }
    });
    return map;
  }, [clinicDoctors]);

  // Initialize Auth
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userStr || !token) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      const docId = user.id || user._id;
      let cId = user.clinicId || user.clinic_id || user.clinic?.id;
      if (!cId && token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            cId = payload.clinicId || payload.clinic_id;
          }
        } catch (_) {}
      }

      if (!docId || !cId) {
        router.push('/login');
        return;
      }

      setDoctorId(docId);
      setDoctorName(user.name || `Dr. ${user.firstName || user.first_name || 'Doctor'}`);
      setClinicId(cId);

      // Verify IPD module and load initial data
      initializeIpd(cId);
    } catch (e) {
      console.error('Auth parse error:', e);
      router.push('/login');
    }
  }, []);

  // Auto-dismiss notification toast after 4.5 seconds with pending timeout cleanup
  useEffect(() => {
    if (!notification.message) return;
    const timer = setTimeout(() => {
      setNotification({ type: '', message: '' });
    }, 4500);

    return () => clearTimeout(timer);
  }, [notification]);

  const initializeIpd = async (cId) => {
    setLoading(true);
    try {
      // 1. Check IPD Module Activation
      let ipdActive = true;
      try {
        const modRes = await fetch(`${API_BASE_URL}/api/v1/clinic/fetchProfileData/${cId}`, {
          headers: getAuthHeaders()
        });
        const modData = await modRes.json();
        if (modRes.ok && modData.data?.clinic?.modules) {
          ipdActive = modData.data.clinic.modules.ipd !== false;
        }
      } catch (e) {
        console.warn('Profile fetch warning:', e);
      }

      setIsIpdEnabled(ipdActive);

      // 2. Fetch Admissions, Patients, Wards, and Clinic Doctors
      await Promise.all([
        loadAdmissions(cId),
        loadPatients(cId),
        loadWards(cId),
        loadClinicDoctors(cId)
      ]);

      if (initialPatientId) {
        setAdmitForm(prev => ({ ...prev, patientId: initialPatientId }));
        setIsAdmitModalOpen(true);
      }
    } catch (err) {
      console.error('Error verifying clinic IPD:', err);
      setNotification({ type: 'error', message: 'Failed to initialize IPD workspace' });
    } finally {
      setLoading(false);
    }
  };

  const loadAdmissions = async (cId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions?clinicId=${cId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdmissions(data.data?.admissions || []);
      }
    } catch (err) {
      console.error('Error fetching admissions:', err);
    }
  };

  const loadPatients = async (cId) => {
    try {
      let res = await fetch(`${API_BASE_URL}/api/v1/clinic/fetch-patients/${cId}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        res = await fetch(`${API_BASE_URL}/api/v1/patient?clinicId=${cId}`, {
          headers: getAuthHeaders()
        });
      }
      const data = await res.json();
      if (res.ok && data.success) {
        setPatients(data.data?.patients || data.data || []);
      }
    } catch (err) {
      console.error('Error loading patients:', err);
    }
  };

  const loadClinicDoctors = async (cId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/clinic/fetch-doctor-clinicId/${cId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClinicDoctors(data.data?.doctors || []);
      }
    } catch (err) {
      console.error('Error loading clinic doctors:', err);
    }
  };

  const loadWards = async (cId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/wards?clinicId=${cId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWards(data.data?.wards || []);
      }
    } catch (err) {
      console.error('Error loading wards:', err);
    }
  };

  // Load available beds & assigned nurses when a ward is selected
  const handleWardChange = async (wardId) => {
    setAdmitForm(prev => ({ ...prev, wardId, bedId: '', nurseId: '' }));
    setAvailableBeds([]);
    setWardNurses([]);
    if (!wardId) return;

    setBedsLoading(true);
    setNursesLoading(true);
    setModalError('');

    try {
      // 1. Fetch available beds in this ward
      const bedsPromise = fetch(`${API_BASE_URL}/api/v1/ipd/beds/available?clinicId=${clinicId}&wardId=${wardId}`, {
        headers: getAuthHeaders()
      }).then(r => r.json());

      // 2. Fetch active nurses assigned to this ward
      const nursesPromise = fetch(`${API_BASE_URL}/api/v1/clinic/nurses/${clinicId}?wardId=${wardId}&status=active`, {
        headers: getAuthHeaders()
      }).then(r => r.json());

      const [bedsData, nursesData] = await Promise.all([bedsPromise, nursesPromise]);

      if (bedsData.success) {
        setAvailableBeds(bedsData.data?.beds || []);
      } else {
        setAvailableBeds([]);
      }

      if (nursesData.success) {
        const nurseList = nursesData.data?.nurses || [];
        const eligibleNurses = nurseList.filter(n => {
          const isAssigned = (n.wardId === wardId || n.ward_id === wardId);
          const isCapacityOk = (n.activeAdmissionsCount || 0) < 20;
          return isAssigned && isCapacityOk;
        });
        setWardNurses(eligibleNurses);
      } else {
        setWardNurses([]);
      }
    } catch (err) {
      console.error('Error loading ward beds or nurses:', err);
      setModalError('Failed to load available beds or nurses for selected ward');
    } finally {
      setBedsLoading(false);
      setNursesLoading(false);
    }
  };

  // Handle Admission Submit (Doctor only)
  const handleAdmitSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');

    if (!admitForm.patientId) {
      setModalError('Please select a patient');
      setSubmitting(false);
      return;
    }
    if (!admitForm.wardId) {
      setModalError('Please select a ward');
      setSubmitting(false);
      return;
    }
    if (!admitForm.bedId) {
      setModalError('Please select an available bed');
      setSubmitting(false);
      return;
    }
    if (!admitForm.nurseId) {
      setModalError('Please select an assigned nurse');
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        clinicId,
        patientId: admitForm.patientId,
        wardId: admitForm.wardId,
        bedId: admitForm.bedId,
        nurseId: admitForm.nurseId,
        assignedNurseId: admitForm.nurseId,
        provisionalDiagnosis: admitForm.provisionalDiagnosis.trim() || undefined,
        diagnosis: admitForm.provisionalDiagnosis.trim() || undefined,
        notes: admitForm.notes.trim() || undefined,
        admissionReason: admitForm.notes.trim() || undefined
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to admit patient');
      }

      const createdAdmission = data.data?.admission || data.data;
      const admNum = createdAdmission?.admission_number || createdAdmission?.admissionNumber || data.data?.admission_number || data.data?.admissionNumber;
      const successMessage = admNum
        ? `Patient admitted successfully (Admission #${admNum})`
        : 'Patient admitted successfully';

      setNotification({ type: 'success', message: successMessage });
      setIsAdmitModalOpen(false);
      setAdmitForm({
        patientId: '',
        wardId: '',
        bedId: '',
        nurseId: '',
        provisionalDiagnosis: '',
        notes: ''
      });
      await loadAdmissions(clinicId);
    } catch (err) {
      console.error('Admission error:', err);
      setModalError(err.message || 'Admission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Add Consulting Doctor Submit
  const handleConsultingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAdmission || !consultingForm.doctorId) {
      setModalError('Please select a doctor to consult');
      return;
    }

    setSubmitting(true);
    setModalError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${selectedAdmission.id}/consulting-doctors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          clinicId: clinicId || selectedAdmission.clinic_id || selectedAdmission.clinicId,
          doctorId: consultingForm.doctorId,
          notes: consultingForm.notes.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to assign consulting doctor');
      }

      setNotification({ type: 'success', message: 'Consulting doctor added successfully' });
      setIsConsultingModalOpen(false);
      setConsultingForm({ doctorId: '', notes: '' });
      await loadAdmissions(clinicId);
    } catch (err) {
      console.error('Error assigning consulting doctor:', err);
      setModalError(err.message || 'Failed to assign consulting doctor');
    } finally {
      setSubmitting(false);
    }
  };

  // Load Clinical Notes for Selected Admission
  const loadClinicalNotes = async (admissionId) => {
    if (!admissionId) return;
    setLoadingNotes(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}/clinical-notes?clinicId=${clinicId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const rawNotes = data.data?.notes || [];
        const sorted = [...rawNotes].sort((a, b) => {
          const tA = new Date(a.created_at || a.createdAt || 0).getTime();
          const tB = new Date(b.created_at || b.createdAt || 0).getTime();
          return tA - tB;
        });
        setClinicalNotesList(sorted);
      } else {
        setClinicalNotesList([]);
      }
    } catch (err) {
      console.error('Error fetching clinical notes:', err);
      setClinicalNotesList([]);
    } finally {
      setLoadingNotes(false);
    }
  };

  // Handle Add Clinical Note Submit
  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAdmission || !noteForm.note.trim()) {
      setModalError('Clinical note text is required');
      return;
    }

    setSubmitting(true);
    setModalError('');
    try {
      const vitals = (noteForm.bp || noteForm.pulse || noteForm.temperature || noteForm.spo2) ? {
        bp: noteForm.bp.trim() || undefined,
        pulse: noteForm.pulse !== '' ? Number(noteForm.pulse) : undefined,
        temperature: noteForm.temperature !== '' ? Number(noteForm.temperature) : undefined,
        spo2: noteForm.spo2 !== '' ? Number(noteForm.spo2) : undefined
      } : undefined;

      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${selectedAdmission.id}/clinical-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          clinicId,
          note: noteForm.note.trim(),
          vitals
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const errorMsg = data.message || 'Validation failed';
        throw new Error(errorMsg);
      }

      setNotification({ type: 'success', message: 'Clinical note recorded successfully' });
      setNoteForm({ note: '', bp: '', pulse: '', temperature: '', spo2: '' });
      await loadClinicalNotes(selectedAdmission.id);
      await loadAdmissions(clinicId);
    } catch (err) {
      console.error('Error adding clinical note:', err);
      setModalError(err.message || 'Failed to add clinical note');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Note Form
  const startEditNote = (cn) => {
    setEditingNoteId(cn.id || cn._id);
    setEditNoteForm({
      note: cn.note || cn.notes || '',
      bp: cn.vitals?.bp || '',
      pulse: cn.vitals?.pulse !== undefined ? String(cn.vitals.pulse) : '',
      temperature: cn.vitals?.temperature !== undefined ? String(cn.vitals.temperature) : '',
      spo2: cn.vitals?.spo2 !== undefined ? String(cn.vitals.spo2) : '',
      reason: ''
    });
    setModalError('');
  };

  // Handle Edit Note Submit
  const handleEditNoteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAdmission || !editingNoteId || !editNoteForm.note.trim()) {
      setModalError('Clinical note text is required');
      return;
    }
    if (!editNoteForm.reason.trim()) {
      setModalError('Reason for amendment is required');
      return;
    }

    setSubmitting(true);
    setModalError('');
    try {
      const vitals = (editNoteForm.bp || editNoteForm.pulse || editNoteForm.temperature || editNoteForm.spo2) ? {
        bp: editNoteForm.bp.trim() || undefined,
        pulse: editNoteForm.pulse !== '' ? Number(editNoteForm.pulse) : undefined,
        temperature: editNoteForm.temperature !== '' ? Number(editNoteForm.temperature) : undefined,
        spo2: editNoteForm.spo2 !== '' ? Number(editNoteForm.spo2) : undefined
      } : undefined;

      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${selectedAdmission.id}/clinical-notes/${editingNoteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          clinicId,
          note: editNoteForm.note.trim(),
          vitals,
          correctionReason: editNoteForm.reason.trim() || 'Clinical note amendment'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update clinical note');
      }

      setNotification({ type: 'success', message: 'Clinical note amended successfully' });
      setEditingNoteId(null);
      await loadClinicalNotes(selectedAdmission.id);
      await loadAdmissions(clinicId);
    } catch (err) {
      console.error('Error amending clinical note:', err);
      setModalError(err.message || 'Failed to update clinical note');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Void Note
  const handleVoidNote = async (noteId) => {
    const reason = prompt('Please enter a clinical reason for voiding this note:');
    if (!reason || !reason.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${selectedAdmission.id}/clinical-notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          clinicId,
          isVoided: true,
          voidReason: reason.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to void clinical note');
      }

      setNotification({ type: 'success', message: 'Clinical note voided. Audit history preserved.' });
      await loadClinicalNotes(selectedAdmission.id);
      await loadAdmissions(clinicId);
    } catch (err) {
      alert(err.message || 'Failed to void note');
    }
  };

  // Handle Discharge Submit
  const handleDischargeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAdmission) return;

    setSubmitting(true);
    setModalError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${selectedAdmission.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          clinicId,
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
        message: `Patient discharged. Bed marked as CLEANING. ${chargeInfo}`
      });
      setIsDischargeModalOpen(false);
      setDischargeForm({ dischargeSummary: '', dischargeCondition: 'improved' });
      await loadAdmissions(clinicId);
    } catch (err) {
      console.error('Discharge error:', err);
      setModalError(err.message || 'Failed to discharge patient');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter Admissions based on Active Tab, Status, Ward, Date, and Search Query
  const filteredAdmissions = admissions.filter((adm) => {
    const isAdmitting = isDoctorMatch(getAdmittingDocId(adm), doctorId);
    const isConsulting = (adm.consultingDoctors || []).some(
      (cd) => isDoctorMatch(cd.doctor_id || cd.doctorId, doctorId)
    );

    if (activeTab === 'my_admissions' && !isAdmitting) return false;
    if (activeTab === 'consulting' && !isConsulting) return false;

    if (statusFilter !== 'all' && (adm.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;

    if (wardFilter !== 'all') {
      const wId = adm.ward_id || adm.wardId;
      if (wId !== wardFilter) return false;
    }

    if (dateFilter !== 'all') {
      if (!matchesDateFilter(adm.admission_date || adm.admissionDate, dateFilter)) return false;
    }

    if (searchQuery.trim()) {
      if (!matchesIpdSearch(adm, searchQuery, doctorId, doctorName, docMap)) return false;
    }

    return true;
  });

  // --- STATS CALCULATION ---
  // Active means status === 'admitted' (discharged records NEVER count as active)
  const isAdmActive = (a) => (a.status || '').toLowerCase() === 'admitted';
  const isAdmDischarged = (a) => (a.status || '').toLowerCase() === 'discharged';

  // 1. KPI Counts (strictly active inpatients only)
  const myAdmittedActiveCount = admissions.filter(
    (a) => isAdmActive(a) && isDoctorMatch(getAdmittingDocId(a), doctorId)
  ).length;

  const consultingActiveCount = admissions.filter(
    (a) => isAdmActive(a) && (a.consultingDoctors || []).some((cd) => isDoctorMatch(cd.doctor_id || cd.doctorId, doctorId))
  ).length;

  const totalActiveCount = admissions.filter(isAdmActive).length;

  // 2. Total Historical Record Counts (all statuses)
  const myAdmittedTotalCount = admissions.filter(
    (a) => isDoctorMatch(getAdmittingDocId(a), doctorId)
  ).length;

  const consultingTotalCount = admissions.filter(
    (a) => (a.consultingDoctors || []).some((cd) => isDoctorMatch(cd.doctor_id || cd.doctorId, doctorId))
  ).length;

  const totalRecordsCount = admissions.length;

  // 3. Tab Badge Counts (dynamically scoped by current statusFilter)
  const getTabCount = (tabKey) => {
    return admissions.filter((adm) => {
      if (statusFilter === 'admitted' && !isAdmActive(adm)) return false;
      if (statusFilter === 'discharged' && !isAdmDischarged(adm)) return false;

      if (tabKey === 'my_admissions') {
        return isDoctorMatch(getAdmittingDocId(adm), doctorId);
      }
      if (tabKey === 'consulting') {
        return (adm.consultingDoctors || []).some((cd) =>
          isDoctorMatch(cd.doctor_id || cd.doctorId, doctorId)
        );
      }
      return true;
    }).length;
  };

  // Selected Admission Discharge Calculation Preview
  const dischargePreview = useMemo(() => {
    if (!selectedAdmission) return { calendarDays: 1, rate: null, total: null, isConfigured: false };
    const days = calculateCalendarDays(selectedAdmission.admission_date || selectedAdmission.admissionDate, new Date());
    let rate = null;
    let isConfigured = false;
    if (selectedAdmission.bed_daily_rate !== undefined && selectedAdmission.bed_daily_rate !== null && !isNaN(Number(selectedAdmission.bed_daily_rate))) {
      rate = Number(selectedAdmission.bed_daily_rate);
      isConfigured = true;
    } else if (selectedAdmission.bedDailyRate !== undefined && selectedAdmission.bedDailyRate !== null && !isNaN(Number(selectedAdmission.bedDailyRate))) {
      rate = Number(selectedAdmission.bedDailyRate);
      isConfigured = true;
    }
    const total = isConfigured ? (days * rate) : null;
    return { calendarDays: days, rate, total, isConfigured };
  }, [selectedAdmission]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading Inpatient Workspace...</p>
        </div>
      </div>
    );
  }

  if (isIpdEnabled === false) {
    return (
      <div className="max-w-4xl mx-auto p-6 mt-10">
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Inpatient Module Not Activated
          </h2>
          <p className="text-slate-600 max-w-lg mx-auto text-sm leading-relaxed mb-6">
            The <strong>Inpatient Department (IPD) & Bed Management</strong> module is currently disabled for this clinic.
            Inpatient admissions, ward beds, and inpatient clinical charts are only available when IPD is activated.
          </p>
          <Link
            href="/doctor-dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Doctor Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Contained Header Section (Matching Lab Orders pattern) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 mb-1">
            <BedDouble className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Inpatient Management</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inpatient Department (IPD)</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Admit patients, allocate beds, manage consulting doctors, and record clinical progress notes.
          </p>
        </div>

        <button
          onClick={() => {
            setIsAdmitModalOpen(true);
            setModalError('');
          }}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm gap-2 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Admit as Inpatient</span>
        </button>
      </div>

      {/* Notifications */}
      {notification.message && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl text-sm border ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification({ type: '', message: '' })}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 2. Stats Summary Cards (Consistent container width & increased usable width) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">My Admitted Inpatients</p>
              <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.2 rounded border border-blue-100">
                Active
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">{myAdmittedActiveCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {myAdmittedActiveCount} active ({myAdmittedTotalCount} total history)
            </p>
          </div>
          <span className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <UserCheck className="h-6 w-6" />
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Consulting Inpatients</p>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded border border-indigo-100">
                Active
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">{consultingActiveCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {consultingActiveCount} active ({consultingTotalCount} total history)
            </p>
          </div>
          <span className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Stethoscope className="h-6 w-6" />
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Active Inpatients</p>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded border border-emerald-100">
                Clinic
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalActiveCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {totalActiveCount} currently admitted ({totalRecordsCount} clinic admissions)
            </p>
          </div>
          <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <BedDouble className="h-6 w-6" />
          </span>
        </div>
      </div>

      {/* 3. Tabs & Search Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Inpatients ({getTabCount('all')})
            </button>
            <button
              onClick={() => setActiveTab('my_admissions')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'my_admissions'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              My Admitted Patients ({getTabCount('my_admissions')})
            </button>
            <button
              onClick={() => setActiveTab('consulting')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'consulting'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Consulting Patients ({getTabCount('consulting')})
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('admitted')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'admitted' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Admitted (Active)
            </button>
            <button
              onClick={() => setStatusFilter('discharged')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'discharged' ? 'bg-slate-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Discharged
            </button>
          </div>
        </div>

        {/* Search & Comprehensive Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="relative lg:col-span-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient, MRN, admission #, ward, bed, doctor, nurse, consultant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Ward Filter */}
          <div className="lg:col-span-3">
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
            >
              <option value="all">All Wards</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
                  {formatWardOptionLabel(w)}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
            >
              <option value="all">All Admission Dates</option>
              <option value="today">Admitted Today</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
            </select>

            {(searchQuery || wardFilter !== 'all' || dateFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setWardFilter('all');
                  setDateFilter('all');
                }}
                className="px-2.5 py-2 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium shrink-0 transition-colors"
                title="Reset all search and filters"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Inpatients Table (5 Logical Column Groups Matching Lab Orders Pattern) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredAdmissions.length === 0 ? (
          <div className="p-12 text-center">
            <BedDouble className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No inpatient admissions found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {activeTab === 'my_admissions'
                ? 'You have not admitted any inpatients matching the current filters. Switch tabs or reset filters.'
                : activeTab === 'consulting'
                ? 'No consulting assignments found matching the current filters.'
                : 'No inpatient admissions found matching the current filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 border-collapse">
              <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Patient & Admission</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Admitted On</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Care Team</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdmissions.map((adm) => {
                  const isAdmitting = isDoctorMatch(getAdmittingDocId(adm), doctorId);
                  const isConsulting = (adm.consultingDoctors || []).some(
                    (cd) => isDoctorMatch(cd.doctor_id || cd.doctorId, doctorId)
                  );
                  const isAdmitted = adm.status === 'admitted';
                  const resolvedDoctorName = getAdmittingDoctorName(adm, doctorId, doctorName, docMap);
                  const displayName = formatTitleCase(adm.patientName || 'Patient');

                  return (
                    <tr key={adm.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Patient & Admission */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {(adm.patientName || 'P').charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => router.push(`/doctor-dashboard/ipd/${adm.id}`)}
                                className="font-semibold text-slate-900 text-xs truncate hover:text-blue-600 hover:underline text-left cursor-pointer"
                                title="Open Inpatient Profile"
                              >
                                {displayName}
                              </button>
                              <button
                                onClick={() => router.push(`/doctor-dashboard/ipd/${adm.id}`)}
                                className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200/70 shrink-0 cursor-pointer"
                                title="Open Inpatient Profile"
                              >
                                {adm.admission_number || adm.admissionNumber || 'IPD'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Admitted On */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {new Date(adm.admission_date || adm.admissionDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </td>

                      {/* 3. Location */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                              <Building2 className="w-3 h-3 mr-1 text-indigo-500 shrink-0" />
                              {adm.wardName || 'Ward'}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-slate-700">
                            Bed {adm.bedNumber || adm.bed_number || 'N/A'}{adm.roomNumber || adm.room_number ? ` • Room ${adm.roomNumber || adm.room_number}` : ''}
                          </span>
                        </div>
                      </td>

                      {/* 4. Care Team */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 max-w-[280px]">
                          {/* Admitting Doctor */}
                          <div className="flex items-center gap-1.5 text-xs text-slate-800">
                            <Stethoscope className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                            <span className="font-semibold text-slate-900 truncate">{resolvedDoctorName}</span>
                            {isAdmitting && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-bold shrink-0">
                                You
                              </span>
                            )}
                          </div>

                          {/* Assigned Nurse & Consulting Doctors secondary line */}
                          <div className="flex items-center gap-2 flex-wrap text-[11px]">
                            <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                              <HeartPulse className="h-3 w-3 text-rose-500 shrink-0" />
                              <span>{adm.nurseName || 'Assigned Nurse'}</span>
                            </span>

                            {/* Consulting Doctors */}
                            {(adm.consultingDoctors || []).length > 0 && (
                              <span className="text-slate-300">•</span>
                            )}
                            {(adm.consultingDoctors || []).map((cd, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80 truncate max-w-[120px]"
                                title={`Consultant: ${cd.doctorName}${cd.specialty ? ` (${cd.specialty})` : ''}${cd.notes ? ` - ${cd.notes}` : ''}`}
                              >
                                {cd.doctorName}
                              </span>
                            ))}

                            {isAdmitted && isAdmitting && (
                              <button
                                onClick={() => {
                                  setSelectedAdmission(adm);
                                  setIsConsultingModalOpen(true);
                                  setModalError('');
                                }}
                                className="text-[10px] text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200/60 inline-flex items-center gap-0.5 font-semibold transition-colors shrink-0"
                                title="Add Consulting Doctor"
                                aria-label="Add Consulting Doctor"
                              >
                                <UserPlus className="h-2.5 w-2.5" />
                                Consult
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 5. Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold w-fit ${
                              isAdmitted
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isAdmitted ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                            {isAdmitted ? 'Active IPD' : 'Discharged'}
                          </span>
                          {!isAdmitted && adm.discharge_date && (
                            <span className="text-[10px] text-slate-400">
                              Disch: {new Date(adm.discharge_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inpatient Profile Action */}
                          <button
                            onClick={() => {
                              router.push(`/doctor-dashboard/ipd/${adm.id}`);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-200 transition-colors inline-flex items-center justify-center shrink-0 cursor-pointer"
                            title="Open Inpatient Profile"
                            aria-label="Open Inpatient Profile"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* View / Add Clinical Notes */}
                          <button
                            onClick={() => {
                              setSelectedAdmission(adm);
                              setIsNotesModalOpen(true);
                              setModalError('');
                              setEditingNoteId(null);
                              loadClinicalNotes(adm.id);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 hover:border-indigo-200 transition-colors inline-flex items-center justify-center shrink-0"
                            title="Clinical Chart & Notes"
                            aria-label="Clinical Chart & Notes"
                          >
                            <FileText className="h-4 w-4" />
                          </button>

                          {/* Discharge Button */}
                          {isAdmitted && (isAdmitting || isConsulting) && (
                            <button
                              onClick={() => {
                                setSelectedAdmission(adm);
                                setIsDischargeModalOpen(true);
                                setModalError('');
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition-colors inline-flex items-center justify-center shrink-0"
                              title="Discharge Patient"
                              aria-label="Discharge Patient"
                            >
                              <LogOut className="h-4 w-4" />
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

      {/* =========================================================================
          MODALS
         ========================================================================= */}

      {/* 1. ADMIT PATIENT MODAL */}
      {isAdmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 pt-16 sm:pt-24 pb-8 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto sm:translate-y-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60 shrink-0">
              <div className="flex items-center gap-2">
                <BedDouble className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Doctor Inpatient Admission</h3>
              </div>
              <button
                onClick={() => setIsAdmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAdmitSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Patient Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Existing Patient <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={admitForm.patientId}
                  onChange={(e) => setAdmitForm(prev => ({ ...prev, patientId: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Existing Patient --</option>
                  {patients.map((p) => {
                    const pId = p.id || p._id;
                    const pCode = p.patient_code || p.patientCode || p.patient_id || pId?.slice(-6);
                    const pName = `${p.first_name || p.firstName || ''} ${p.last_name || p.lastName || ''}`.trim() || p.name || 'Unnamed Patient';
                    const pPhone = p.phone_number || p.phoneNumber || p.phone || '';
                    return (
                      <option key={pId} value={pId}>
                        {pName} {pCode ? `(${pCode})` : ''} {pPhone ? `• ${pPhone}` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Ward Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Ward <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={admitForm.wardId}
                  onChange={(e) => handleWardChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Ward --</option>
                  {wards.filter(w => w.is_active !== false).map((w) => (
                    <option key={w.id} value={w.id}>
                      {formatWardOptionLabel(w)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bed Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Allocate Bed <span className="text-rose-500">*</span>
                </label>
                {bedsLoading ? (
                  <div className="text-xs text-slate-400 py-2 flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Loading available beds...
                  </div>
                ) : (
                  <>
                    <select
                      required
                      disabled={!admitForm.wardId || availableBeds.length === 0}
                      value={admitForm.bedId}
                      onChange={(e) => setAdmitForm(prev => ({ ...prev, bedId: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">
                        {!admitForm.wardId
                          ? '-- Select a ward first --'
                          : availableBeds.length === 0
                          ? '-- No AVAILABLE beds in this ward --'
                          : '-- Choose Bed (AVAILABLE) --'}
                      </option>
                      {availableBeds.map((b) => (
                        <option key={b.id} value={b.id}>
                          Bed {b.bed_number} {b.room_number ? `(Room ${b.room_number})` : ''} {b.daily_rate !== undefined && b.daily_rate !== null ? `• ₹${b.daily_rate}/day` : ''}
                        </option>
                      ))}
                    </select>
                    {admitForm.wardId && availableBeds.length === 0 && !bedsLoading && (
                      <p className="text-[11px] text-amber-700 mt-1.5 p-2 bg-amber-50 rounded border border-amber-200">
                        No beds with AVAILABLE status are currently registered in this ward. To admit patients here, beds must be configured and marked AVAILABLE in Bed Management.
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Nurse Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Nurse <span className="text-rose-500">*</span>
                </label>
                {nursesLoading ? (
                  <div className="text-xs text-slate-400 py-2 flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Loading ward nurses...
                  </div>
                ) : (
                  <>
                    <select
                      required
                      disabled={!admitForm.wardId || wardNurses.length === 0}
                      value={admitForm.nurseId}
                      onChange={(e) => setAdmitForm(prev => ({ ...prev, nurseId: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">
                        {!admitForm.wardId
                          ? '-- Select a ward first --'
                          : wardNurses.length === 0
                          ? '-- No active nurses assigned to this ward --'
                          : '-- Assign Nurse (< 20 capacity) --'}
                      </option>
                      {wardNurses.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.firstName || n.first_name} {n.lastName || n.last_name} ({n.activeAdmissionsCount || 0}/20 patients)
                        </option>
                      ))}
                    </select>
                    {admitForm.wardId && wardNurses.length === 0 && !nursesLoading && (
                      <p className="text-[11px] text-amber-700 mt-1.5 p-2 bg-amber-50 rounded border border-amber-200">
                        No active nurses are currently assigned to this ward. Nurses must be assigned to this ward in Nurse Management to care for patients admitted here.
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Provisional Diagnosis */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Provisional Diagnosis / Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acute appendicitis, Severe dehydration"
                  value={admitForm.provisionalDiagnosis}
                  onChange={(e) => setAdmitForm(prev => ({ ...prev, provisionalDiagnosis: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Initial Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admission Notes & Orders
                </label>
                <textarea
                  rows={2}
                  placeholder="Immediate vitals, diet instructions, IV fluids, monitoring frequency..."
                  value={admitForm.notes}
                  onChange={(e) => setAdmitForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setIsAdmitModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-60"
                >
                  {submitting ? 'Admitting Patient...' : 'Confirm Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ADD CONSULTING DOCTOR MODAL */}
      {isConsultingModalOpen && selectedAdmission && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60 shrink-0">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Add Consulting Doctor</h3>
              </div>
              <button
                onClick={() => setIsConsultingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConsultingSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <p className="text-xs text-slate-500 mb-2">
                  Inpatient: <strong>{selectedAdmission.patientName}</strong> ({selectedAdmission.admission_number || selectedAdmission.admissionNumber})
                </p>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Doctor to Consult <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={consultingForm.doctorId}
                  onChange={(e) => setConsultingForm(prev => ({ ...prev, doctorId: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose Doctor --</option>
                  {clinicDoctors
                    .filter(d => {
                      const dId = String(d.id || d._id).trim().toLowerCase();
                      const isAdmittingDoc = isDoctorMatch(dId, doctorId) || isDoctorMatch(dId, getAdmittingDocId(selectedAdmission));
                      const isAlreadyAssigned = (selectedAdmission.consultingDoctors || []).some(cd =>
                        isDoctorMatch(cd.doctor_id || cd.doctorId, dId)
                      );
                      return !isAdmittingDoc && !isAlreadyAssigned;
                    })
                    .map((d) => {
                      const dId = d.id || d._id;
                      const dName = d.name || `Dr. ${d.first_name || d.firstName || ''} ${d.last_name || d.lastName || ''}`.trim();
                      const dSpec = d.specialty ? `(${d.specialty})` : '';
                      return (
                        <option key={dId} value={dId}>
                          {dName} {dSpec}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Consultation Purpose / Reason
                </label>
                <textarea
                  rows={3}
                  placeholder="Clinical question, cross-specialty opinion needed, second opinion..."
                  value={consultingForm.notes}
                  onChange={(e) => setConsultingForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setIsConsultingModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-60"
                >
                  {submitting ? 'Adding...' : 'Add Consulting Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. CLINICAL NOTES & VITALS MODAL (Full CRUD & Audit Trail) */}
      {isNotesModalOpen && selectedAdmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Clinical Chart & Notes</h3>
                  <p className="text-xs text-slate-500">
                    {selectedAdmission.patientName} — {selectedAdmission.wardName} Bed {selectedAdmission.bedNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsNotesModalOpen(false);
                  setEditingNoteId(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Chronological Progress Notes Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-blue-600" />
                    Chronological Progress Notes ({clinicalNotesList.length})
                  </h4>
                  {loadingNotes && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 animate-spin" /> Refreshing...
                    </span>
                  )}
                </div>

                {clinicalNotesList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-xl text-center">
                    No clinical progress notes recorded yet for this inpatient.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {clinicalNotesList.map((cn) => {
                      const noteId = cn.id || cn._id;
                      const isAuthor = isDoctorMatch(cn.doctor_id || cn.doctorId, doctorId);
                      const isVoided = Boolean(cn.is_voided || cn.isVoided);
                      const flags = (cn.vital_flags && cn.vital_flags.length > 0) ? cn.vital_flags : computeVitalFlags(cn.vitals);

                      return (
                        <div
                          key={noteId}
                          className={`p-4 rounded-xl space-y-2 border ${
                            isVoided
                              ? 'bg-slate-100/70 border-slate-300 opacity-75'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">
                                {cn.doctor_name || cn.doctorName || 'Doctor'}
                              </span>
                              {isAuthor && (
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-bold">
                                  You
                                </span>
                              )}
                              {isVoided && (
                                <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold">
                                  VOIDED / RETRACTED
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400">
                                {new Date(cn.created_at || cn.createdAt).toLocaleString()}
                              </span>
                              {/* Edit / Void actions for author */}
                              {!isVoided && isAuthor && (
                                <div className="flex items-center gap-1 ml-2">
                                  <button
                                    onClick={() => startEditNote(cn)}
                                    className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors"
                                    title="Amend / Edit Note"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleVoidNote(noteId)}
                                    className="p-1 text-slate-500 hover:text-rose-600 rounded transition-colors"
                                    title="Void Note"
                                  >
                                    <Ban className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Note text */}
                          <p className={`text-xs ${isVoided ? 'line-through text-slate-500' : 'text-slate-800'} whitespace-pre-wrap`}>
                            {cn.note || cn.notes}
                          </p>

                          {/* Void reason if voided */}
                          {isVoided && cn.void_reason && (() => {
                            const voidActorRaw = cn.voided_by_name || cn.voided_by;
                            const voidActorName = resolveAuditActorName(voidActorRaw, doctorId, doctorName, docMap);
                            const voidActorId = cn.voided_by || (isUUID(voidActorRaw) ? voidActorRaw : null);
                            const cleanReason = cleanAuditReason(cn.void_reason, 'Incorrect entry');
                            const voidTime = cn.voided_at ? new Date(cn.voided_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                            return (
                              <div className="text-[11px] bg-rose-50/80 p-2.5 rounded-lg border border-rose-200/70 space-y-0.5">
                                <div className="text-rose-900 font-medium">
                                  <span className="font-semibold text-rose-900">Voiding reason:</span> {cleanReason}
                                </div>
                                <div
                                  className="text-rose-700/90 text-[10.5px] flex items-center gap-1.5"
                                  title={voidActorId ? `Actor ID: ${voidActorId}` : undefined}
                                >
                                  <span>Voided by: {voidActorName || 'Unknown clinician'}{voidTime ? ` · ${voidTime}` : ''}</span>
                                  {voidActorName === 'Unknown clinician' && voidActorId && (
                                    <span className="text-[9px] font-mono bg-rose-100 text-rose-700 px-1 py-0.5 rounded" title={`Actor ID: ${voidActorId}`}>
                                      ({voidActorId.slice(0, 8)}…)
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Vitals & Flags */}
                          {cn.vitals && Object.keys(cn.vitals).length > 0 && (
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                                {cn.vitals.bp && <span>BP: <strong className="text-slate-800">{cn.vitals.bp}</strong></span>}
                                {cn.vitals.pulse !== undefined && cn.vitals.pulse !== null && <span>Pulse: <strong className="text-slate-800">{cn.vitals.pulse} bpm</strong></span>}
                                {cn.vitals.temperature !== undefined && cn.vitals.temperature !== null && <span>Temp: <strong className="text-slate-800">{cn.vitals.temperature}°F</strong></span>}
                                {cn.vitals.spo2 !== undefined && cn.vitals.spo2 !== null && <span>SpO2: <strong className="text-slate-800">{cn.vitals.spo2}%</strong></span>}
                              </div>

                              {/* Clinically unusual reading flags */}
                              {flags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                  {flags.map((fl, fIdx) => (
                                    <span
                                      key={fIdx}
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                                        fl.severity === 'critical'
                                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                                          : 'bg-amber-50 text-amber-700 border-amber-200'
                                      }`}
                                    >
                                      <AlertCircle className="h-2.5 w-2.5" />
                                      {fl.label} ({fl.value})
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Amendments audit log */}
                          {cn.amendments && cn.amendments.length > 0 && (
                            <div className="text-[10px] bg-slate-100/70 p-2.5 rounded-lg border border-slate-200/80 space-y-2">
                              <span className="font-semibold text-slate-700 uppercase tracking-wider block text-[9.5px]">
                                Audit History ({cn.amendments.length} amendment{cn.amendments.length > 1 ? 's' : ''})
                              </span>
                              <div className="space-y-1.5">
                                {cn.amendments.map((am, amIdx) => {
                                  const actorRaw = am.amendedBy || am.modifiedBy || am.actorId;
                                  const actorName = resolveAuditActorName(actorRaw, doctorId, doctorName, docMap);
                                  const actorId = am.actorId || (isUUID(actorRaw) ? actorRaw : null);
                                  const cleanReason = cleanAuditReason(am.reason, 'Clinical amendment');
                                  const amTime = (am.timestamp || am.updatedAt)
                                    ? new Date(am.timestamp || am.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : '';
                                  return (
                                    <div
                                      key={amIdx}
                                      className="bg-white/80 p-2 rounded-lg border border-slate-200/60 space-y-0.5"
                                      title={actorId ? `Actor ID: ${actorId}` : undefined}
                                    >
                                      <div className="text-slate-800 text-[10.5px]">
                                        <span className="font-semibold text-slate-700">Reason:</span> {cleanReason}
                                      </div>
                                      <div className="text-slate-500 text-[10px] flex items-center gap-1.5">
                                        <span>Amended by: {actorName || 'Unknown clinician'}{amTime ? ` · ${amTime}` : ''}</span>
                                        {actorName === 'Unknown clinician' && actorId && (
                                          <span className="text-[8.5px] font-mono bg-slate-200 text-slate-600 px-1 py-0.2 rounded" title={`Actor ID: ${actorId}`}>
                                            ({actorId.slice(0, 8)}…)
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Edit Note Form (when active) */}
              {editingNoteId && (
                <form onSubmit={handleEditNoteSubmit} className="pt-4 border-t border-blue-200 bg-blue-50/40 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Edit3 className="h-4 w-4 text-blue-600" />
                      Amend Clinical Note
                    </h4>
                    <button
                      type="button"
                      onClick={() => setEditingNoteId(null)}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Cancel Edit
                    </button>
                  </div>

                  {modalError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{modalError}</span>
                    </div>
                  )}

                  <textarea
                    rows={3}
                    required
                    placeholder="Updated clinical notes..."
                    value={editNoteForm.note}
                    onChange={(e) => setEditNoteForm(prev => ({ ...prev, note: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {/* Vitals quick grid */}
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">BP (mmHg)</label>
                      <input
                        type="text"
                        placeholder="120/80"
                        value={editNoteForm.bp}
                        onChange={(e) => setEditNoteForm(prev => ({ ...prev, bp: e.target.value }))}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Pulse (bpm)</label>
                      <input
                        type="number"
                        placeholder="72"
                        value={editNoteForm.pulse}
                        onChange={(e) => setEditNoteForm(prev => ({ ...prev, pulse: e.target.value }))}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Temp (°F)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="98.6"
                        value={editNoteForm.temperature}
                        onChange={(e) => setEditNoteForm(prev => ({ ...prev, temperature: e.target.value }))}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">SpO2 (%)</label>
                      <input
                        type="number"
                        placeholder="98"
                        value={editNoteForm.spo2}
                        onChange={(e) => setEditNoteForm(prev => ({ ...prev, spo2: e.target.value }))}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Reason for Amendment <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Corrected vital reading, updated medication dosage"
                      value={editNoteForm.reason}
                      onChange={(e) => setEditNoteForm(prev => ({ ...prev, reason: e.target.value }))}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                    />
                  </div>

                  <div className="flex justify-end pt-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingNoteId(null)}
                      className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-60"
                    >
                      {submitting ? 'Saving...' : 'Save Amendment'}
                    </button>
                  </div>
                </form>
              )}

              {/* Add Note Form (for admitted patients, when not editing) */}
              {!editingNoteId && selectedAdmission.status === 'admitted' && (
                <form onSubmit={handleNoteSubmit} className="pt-4 border-t border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="h-4 w-4 text-blue-600" />
                    Record Clinical Progress Note
                  </h4>

                  {modalError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{modalError}</span>
                    </div>
                  )}

                  <textarea
                    rows={3}
                    required
                    placeholder="Clinical findings, doctor assessment, treatment plan..."
                    value={noteForm.note}
                    onChange={(e) => setNoteForm(prev => ({ ...prev, note: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {/* Vitals quick grid */}
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">BP (mmHg)</label>
                      <input
                        type="text"
                        placeholder="120/80"
                        value={noteForm.bp}
                        onChange={(e) => setNoteForm(prev => ({ ...prev, bp: e.target.value }))}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Pulse (bpm)</label>
                      <input
                        type="number"
                        placeholder="72"
                        value={noteForm.pulse}
                        onChange={(e) => setNoteForm(prev => ({ ...prev, pulse: e.target.value }))}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Temp (°F)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="98.6"
                        value={noteForm.temperature}
                        onChange={(e) => setNoteForm(prev => ({ ...prev, temperature: e.target.value }))}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">SpO2 (%)</label>
                      <input
                        type="number"
                        placeholder="98"
                        value={noteForm.spo2}
                        onChange={(e) => setNoteForm(prev => ({ ...prev, spo2: e.target.value }))}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {submitting ? 'Saving Note...' : 'Add Clinical Note'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. DISCHARGE PATIENT MODAL (Calendar-Day Bed Billing Calculation) */}
      {isDischargeModalOpen && selectedAdmission && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60 shrink-0">
              <div className="flex items-center gap-2">
                <LogOut className="h-5 w-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">Discharge Inpatient</h3>
              </div>
              <button
                onClick={() => setIsDischargeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDischargeSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Admission & Billing Details (Calendar-day Rule) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient:</span>
                  <span className="font-bold text-slate-800">{selectedAdmission.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Admission Date:</span>
                  <span className="font-medium text-slate-700">
                    {new Date(selectedAdmission.admission_date || selectedAdmission.admissionDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Discharge Date:</span>
                  <span className="font-medium text-slate-700">Today ({new Date().toLocaleDateString()})</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Billable Stay:</span>
                  <span className="font-bold text-slate-800">
                    {dischargePreview.calendarDays} Calendar Day(s)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Applicable Bed Rate:</span>
                  <span className="font-semibold text-slate-800">
                    {dischargePreview.isConfigured ? `₹${dischargePreview.rate}/day` : <span className="text-amber-600">Rate Not Configured</span>}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="font-bold text-slate-700">Estimated Bed Charge:</span>
                  <span className="font-extrabold text-blue-700 text-sm">
                    {dischargePreview.isConfigured ? `₹${dischargePreview.total}` : <span className="text-amber-600 text-xs font-semibold">Rate not configured</span>}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] pt-1">
                  <span className="text-slate-400">Post-Discharge Bed Status:</span>
                  <span className="font-bold text-amber-700">CLEANING (Housekeeping)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discharge Condition
                </label>
                <select
                  value={dischargeForm.dischargeCondition}
                  onChange={(e) => setDischargeForm(prev => ({ ...prev, dischargeCondition: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="cured">Cured / Fully Recovered</option>
                  <option value="improved">Improved / Stable</option>
                  <option value="transferred">Transferred to Higher Center</option>
                  <option value="discharged_against_medical_advice">Discharged Against Medical Advice (LAMA)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discharge Summary & Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="Summary of inpatient stay, medications on discharge, follow-up date..."
                  value={dischargeForm.dischargeSummary}
                  onChange={(e) => setDischargeForm(prev => ({ ...prev, dischargeSummary: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setIsDischargeModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-60"
                >
                  {submitting ? 'Discharging...' : 'Confirm Discharge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 5. VIEW ADMISSION DETAILS MODAL */}
      {isDetailsModalOpen && selectedAdmission && (() => {
        const isAdmActive = (selectedAdmission.status || '').toLowerCase() === 'admitted';
        const pName = selectedAdmission.patientName || selectedAdmission.patient_name || selectedAdmission.patient?.name || 'Inpatient';
        const pCode = selectedAdmission.patient?.patient_code || selectedAdmission.patient_code || selectedAdmission.patientCode || selectedAdmission.patient_id || 'N/A';
        const admNum = selectedAdmission.admission_number || selectedAdmission.admissionNumber || selectedAdmission.id?.slice(0, 8);
        const admDate = selectedAdmission.admission_date || selectedAdmission.admissionDate;
        const dischDate = selectedAdmission.discharge_date || selectedAdmission.dischargeDate;
        const admittingDoc = getAdmittingDoctorName(selectedAdmission, doctorId, doctorName, docMap);
        const nurse = selectedAdmission.nurseName || selectedAdmission.nurse_name || 'Unassigned';
        const wardLabel = selectedAdmission.wardName || selectedAdmission.ward_name || 'Ward';
        const roomNum = selectedAdmission.roomNumber || selectedAdmission.room_number || '-';
        const bedNum = selectedAdmission.bedNumber || selectedAdmission.bed_number || '-';
        const diagnosis = selectedAdmission.provisionalDiagnosis || selectedAdmission.diagnosis || selectedAdmission.provisional_diagnosis;
        const notes = selectedAdmission.notes || selectedAdmission.admissionReason || selectedAdmission.admission_reason;
        const consultants = selectedAdmission.consultingDoctors || [];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Eye className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Inpatient Admission Details</h3>
                    <p className="text-xs text-slate-500 font-mono">Admission #{admNum}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4 text-xs">
                {/* Patient Summary Card */}
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center">
                      {pName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{formatTitleCase(pName)}</h4>
                      <p className="text-[11px] text-slate-500">
                        MRN / Code: <span className="font-mono font-medium text-slate-700">{pCode}</span>
                        {selectedAdmission.patient?.phone && (
                          <span className="ml-2 text-slate-400">· {selectedAdmission.patient.phone}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      isAdmActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isAdmActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    {isAdmActive ? 'Active IPD' : 'Discharged'}
                  </span>
                </div>

                {/* Admission & Location Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Admission Info</span>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Admitted:</span>
                      <span className="font-medium text-slate-800">
                        {admDate ? new Date(admDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                      </span>
                    </div>
                    {!isAdmActive && dischDate && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Discharged:</span>
                        <span className="font-medium text-slate-800">
                          {new Date(dischDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                    {selectedAdmission.discharge_condition && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Condition:</span>
                        <span className="font-medium text-slate-800 capitalize">
                          {selectedAdmission.discharge_condition.replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Location</span>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ward:</span>
                      <span className="font-medium text-slate-800">{wardLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Room / Bed:</span>
                      <span className="font-medium text-slate-800">Room {roomNum} · Bed {bedNum}</span>
                    </div>
                  </div>
                </div>

                {/* Care Team */}
                <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Care Team</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Admitting Doctor</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                        <Stethoscope className="h-3.5 w-3.5 text-blue-600" />
                        {admittingDoc}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Assigned Nurse</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                        <HeartPulse className="h-3.5 w-3.5 text-rose-500" />
                        {nurse}
                      </span>
                    </div>
                  </div>
                  {consultants.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-400 block text-[10px] mb-1">Consulting Doctors ({consultants.length})</span>
                      <div className="flex flex-wrap gap-1.5">
                        {consultants.map((cd, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                          >
                            <Stethoscope className="h-2.5 w-2.5 text-indigo-500" />
                            {cd.doctorName || cd.doctor_name || 'Dr. Consultant'}
                            {cd.notes && <span className="text-[10px] text-indigo-500">({cd.notes})</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Clinical Notes & Diagnosis */}
                {(diagnosis || notes) && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Provisional Diagnosis & Notes</span>
                    {diagnosis && (
                      <div>
                        <span className="text-slate-500 block text-[10px]">Diagnosis</span>
                        <p className="font-medium text-slate-800 mt-0.5">{diagnosis}</p>
                      </div>
                    )}
                    {notes && (
                      <div className={diagnosis ? 'pt-1.5 border-t border-slate-100' : ''}>
                        <span className="text-slate-500 block text-[10px]">Admission Notes</span>
                        <p className="text-slate-700 mt-0.5 whitespace-pre-wrap">{notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/70">
                <button
                  type="button"
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const adm = selectedAdmission;
                      setIsDetailsModalOpen(false);
                      router.push(`/doctor-dashboard/ipd/${adm.id}`);
                    }}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Open Inpatient Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const adm = selectedAdmission;
                      setIsDetailsModalOpen(false);
                      setSelectedAdmission(adm);
                      setIsNotesModalOpen(true);
                      setModalError('');
                      setEditingNoteId(null);
                      loadClinicalNotes(adm.id);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Open Chart & Notes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default function DoctorIpdPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-sm font-medium text-slate-600">Loading Inpatient Workspace...</p>
          </div>
        </div>
      }
    >
      <DoctorIpdPageContent />
    </Suspense>
  );
}
