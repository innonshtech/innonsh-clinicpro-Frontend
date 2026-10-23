'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import {
  LayoutDashboard,
  HeartPulse,
  BedDouble,
  Sparkles,
  CheckCircle2,
  LogOut,
  RefreshCw,
  AlertCircle,
  Building2,
  Clock,
  Search,
  ShieldAlert,
  Activity,
  FileText,
  Info,
  ArrowLeft,
  Send,
  Check,
  ChevronRight,
  ClipboardList,
  AlertTriangle,
  Scale,
  Droplets,
  ArrowDownRight,
  ArrowUpRight,
  Ban,
  X,
  Plus,
  Menu,
  Heart,
  Thermometer,
  Wind,
  Smile,
  User,
  ChevronDown,
  Copy,
  ArrowRightLeft,
  Pill,
  Radio,
  Eye,
  FileCheck2,
  ShieldCheck,
  Download,
  ExternalLink
} from 'lucide-react';
import { evaluateVitals, STATUS, resolveStaffName, formatScheduleFrequencyLabel } from '@/utils/vitalsEvaluation';
import VitalsTrendChart from '@/components/VitalsTrendChart';
import VitalsScheduleCard from '@/components/VitalsScheduleCard';
import ModalPortal from '@/components/ModalPortal';

export { resolveStaffName, formatScheduleFrequencyLabel };

/**
 * Returns the current local date and time formatted for datetime-local inputs (YYYY-MM-DDTHH:mm).
 */
export function getLocalIsoDateTime(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

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

/**
 * Formats blood pressure reading into standard display format (e.g. "120/80", "60/—", "—/70").
 * Preserves legitimate partial readings without fabricating missing components.
 * Returns null if both components are missing/absent.
 */
export function formatBpValue(values) {
  if (!values) return null;
  const sys = values.bp_systolic !== undefined && values.bp_systolic !== null && values.bp_systolic !== ''
    ? Number(values.bp_systolic) : null;
  const dia = values.bp_diastolic !== undefined && values.bp_diastolic !== null && values.bp_diastolic !== ''
    ? Number(values.bp_diastolic) : null;

  if (sys !== null && dia !== null && !isNaN(sys) && !isNaN(dia)) {
    return `${sys}/${dia}`;
  }
  if (sys !== null && !isNaN(sys)) {
    return `${sys}/—`;
  }
  if (dia !== null && !isNaN(dia)) {
    return `—/${dia}`;
  }
  if (values.bp && typeof values.bp === 'string' && values.bp.trim() !== '') {
    return values.bp.trim();
  }
  return null;
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const [selectionNotice, setSelectionNotice] = useState(null);
  const [activeNav, setActiveNav] = useState('dashboard'); // 'dashboard' | 'inpatients'

  // Selected patient & care views
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [activeCareTab, setActiveCareTab] = useState('vitals');
  // Ward Beds Management State
  const [wardBeds, setWardBeds] = useState([]);
  const [loadingBeds, setLoadingBeds] = useState(false);
  const [bedsError, setBedsError] = useState('');
  const [bedStatusFilter, setBedStatusFilter] = useState('all');
  const [selectedWardBedId, setSelectedWardBedId] = useState(null);
  const [bedNotification, setBedNotification] = useState({ type: '', message: '' });
  const [bedActionModal, setBedActionModal] = useState({
    isOpen: false,
    bed: null,
    targetStatus: '',
    actionType: 'status',
    reason: '',
    isSubmitting: false,
    error: ''
  });

  // Transfer Execution Modal State
  const [transferExecutionModal, setTransferExecutionModal] = useState({
    isOpen: false,
    transfer: null,
    movementNotes: '',
    isSubmitting: false,
    error: ''
  });

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
    recorded_at: getLocalIsoDateTime()
  });
  const [voidingEntry, setVoidingEntry] = useState(null);
  const [voidReasonText, setVoidReasonText] = useState('');
  const [isVoidingSubmitting, setIsVoidingSubmitting] = useState(false);

  // MAR (Medication Administration Record) State
  const [marPrescriptions, setMarPrescriptions] = useState([]);
  const [marRecords, setMarRecords] = useState([]);
  const [marScheduledDoses, setMarScheduledDoses] = useState([]);
  const [selectedMarDate, setSelectedMarDate] = useState(new Date().toISOString().slice(0, 10));
  const [loadingMar, setLoadingMar] = useState(false);
  const [marSuccessMsg, setMarSuccessMsg] = useState('');
  const [marErrorMsg, setMarErrorMsg] = useState('');
  const [marAdminModal, setMarAdminModal] = useState({
    isOpen: false,
    doseSlot: null,
    status: 'ADMINISTERED',
    administeredAt: '',
    doseGiven: '',
    route: '',
    reasonPreset: '',
    reasonText: '',
    notes: '',
    isSubmitting: false,
    error: ''
  });

  const fetchPatientMAR = async (admissionId = selectedAdmission?.id, dateOverride = null) => {
    if (!admissionId || !nurseData) return;
    setLoadingMar(true);
    setMarErrorMsg('');
    const clinicId = nurseData.clinicId || nurseData.clinic_id || nurseData.clinic?.id;
    const targetDate = dateOverride !== null ? dateOverride : selectedMarDate;
    const dateParam = targetDate ? `&date=${targetDate}` : '';

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}/mar?clinicId=${clinicId}${dateParam}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMarPrescriptions(data.data?.prescriptions || []);
        setMarRecords(data.data?.marRecords || []);
        setMarScheduledDoses(data.data?.scheduledDoses || []);
      } else {
        setMarPrescriptions([]);
        setMarRecords([]);
        setMarScheduledDoses([]);
        if (data.message) {
          setMarErrorMsg(data.message);
        }
      }
    } catch (err) {
      console.error('Error fetching MAR data:', err);
      setMarErrorMsg('Network error while retrieving medication administration record.');
    } finally {
      setLoadingMar(false);
    }
  };

  // Radiology Reports (Read-only Nurse Care Chart)
  const [patientRadiologyOrders, setPatientRadiologyOrders] = useState([]);
  const [loadingRadiologyOrders, setLoadingRadiologyOrders] = useState(false);
  const [radiologyErrorMsg, setRadiologyErrorMsg] = useState('');
  const [viewingRadiologyReport, setViewingRadiologyReport] = useState(null);

  // Strictly scope displayed radiology orders to the actively selected admission
  const displayedRadiologyOrders = useMemo(() => {
    if (!selectedAdmission) return [];
    const selAdmId = String(selectedAdmission.id || selectedAdmission._id || '');
    const selAdmNum = String(selectedAdmission.admission_number || selectedAdmission.admissionNumber || '');
    return (patientRadiologyOrders || []).filter(order => {
      const oAdmId = String(order.admission_id || order.admissionId || '');
      const oAdmNum = String(order.admission_number || order.admissionNumber || '');
      const matchesId = selAdmId && (oAdmId === selAdmId || oAdmNum === selAdmId);
      const matchesNum = selAdmNum && (oAdmNum === selAdmNum || oAdmId === selAdmNum);
      return Boolean(matchesId || matchesNum);
    });
  }, [patientRadiologyOrders, selectedAdmission]);

  const fetchPatientRadiology = async (admissionId = selectedAdmission?.id) => {
    if (!admissionId || !nurseData) {
      setPatientRadiologyOrders([]);
      return;
    }
    setPatientRadiologyOrders([]);
    setViewingRadiologyReport(null);
    setLoadingRadiologyOrders(true);
    setRadiologyErrorMsg('');
    const clinicId = nurseData.clinicId || nurseData.clinic_id || nurseData.clinic?.id;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${admissionId}/radiology?clinicId=${clinicId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPatientRadiologyOrders(data.data?.orders || []);
      } else {
        setPatientRadiologyOrders([]);
        if (data.message) {
          setRadiologyErrorMsg(data.message);
        }
      }
    } catch (err) {
      console.error('Error fetching patient radiology orders:', err);
      setRadiologyErrorMsg('Network error while retrieving patient radiology orders.');
      setPatientRadiologyOrders([]);
    } finally {
      setLoadingRadiologyOrders(false);
    }
  };

  const handleNavMar = () => {
    if (selectedAdmission) {
      setActiveCareTab('mar');
      fetchPatientMAR(selectedAdmission.id);
    } else {
      setActiveNav('inpatients');
      setSelectionNotice({
        function: 'Medication Administration Record (MAR)',
        description: 'Select an inpatient from the worklist below to administer scheduled doses and review medication administration history.',
        tab: 'mar'
      });
    }
    setSidebarOpen(false);
  };

  const handleRecordMAR = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedAdmission || !marAdminModal.doseSlot || !nurseData) return;

    setMarAdminModal(prev => ({ ...prev, isSubmitting: true, error: '' }));

    const clinicId = nurseData.clinicId || nurseData.clinic_id || nurseData.clinic?.id;
    const { doseSlot, status, administeredAt, doseGiven, route, reasonPreset, reasonText, notes } = marAdminModal;

    let finalReason = '';
    if (status === 'MISSED' || status === 'REFUSED') {
      const parts = [];
      if (reasonPreset) parts.push(reasonPreset);
      if (reasonText && reasonText.trim()) parts.push(reasonText.trim());
      finalReason = parts.join(' - ').trim();

      if (!finalReason || finalReason.length < 3) {
        setMarAdminModal(prev => ({
          ...prev,
          isSubmitting: false,
          error: `A mandatory clinical reason is required when recording a dose as ${status}.`
        }));
        return;
      }
    }

    const payload = {
      prescription_id: doseSlot.prescriptionId,
      status,
      scheduled_time: doseSlot.scheduledTime || doseSlot.slotKey,
      administered_at: administeredAt || getLocalIsoDateTime(),
      dose_given: doseGiven || doseSlot.prescribedDose,
      route: route || doseSlot.route,
      reason: finalReason || null,
      notes: notes ? notes.trim() : null,
      clinicId
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${selectedAdmission.id}/mar`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMarSuccessMsg(`Dose recorded as ${status} successfully.`);
        setTimeout(() => setMarSuccessMsg(''), 4000);
        setMarAdminModal({
          isOpen: false,
          doseSlot: null,
          status: 'ADMINISTERED',
          administeredAt: '',
          doseGiven: '',
          route: '',
          reasonPreset: '',
          reasonText: '',
          notes: '',
          isSubmitting: false,
          error: ''
        });
        fetchPatientMAR(selectedAdmission.id);
      } else {
        const errorMsg = data.message || 'Failed to record medication administration.';
        setMarAdminModal(prev => ({ ...prev, isSubmitting: false, error: errorMsg }));
      }
    } catch (err) {
      console.error('Error submitting MAR dose:', err);
      setMarAdminModal(prev => ({ ...prev, isSubmitting: false, error: 'Network communication error.' }));
    }
  };


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

  // Dismiss profile dropdown on outside click or Escape key press
  useEffect(() => {
    if (!profileDropdownOpen) return;

    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileDropdownOpen]);

  // Sync nurseData when user profile/photo updates in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.role === 'nurse') {
            setNurseData(user);
          }
        }
      } catch (_) { }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  const latestVital = nurseVitals.length > 0 ? nurseVitals[0] : null;

  const activePatientContext = useMemo(() => {
    if (!selectedAdmission) return {};
    const pat = selectedAdmission.patient || {};
    let age = selectedAdmission.patient_age ?? selectedAdmission.age ?? selectedAdmission.patientAge ?? pat.age;
    let dob = selectedAdmission.date_of_birth ?? selectedAdmission.dateOfBirth ?? pat.date_of_birth ?? pat.dateOfBirth;
    let isAdult = false;
    if (typeof age === 'number' && age >= 18) {
      isAdult = true;
    } else if (dob) {
      const d = new Date(dob);
      if (!isNaN(d.getTime())) {
        const ageDiff = Date.now() - d.getTime();
        const calculatedAge = Math.abs(new Date(ageDiff).getUTCFullYear() - 1970);
        if (calculatedAge >= 18) {
          isAdult = true;
          age = calculatedAge;
        }
      }
    } else if (selectedAdmission.isAdult === true || pat.isAdult === true) {
      isAdult = true;
    }
    return { age, dateOfBirth: dob, isAdult };
  }, [selectedAdmission]);

  const evaluatedLatest = useMemo(() => {
    if (!latestVital) return null;
    let evals = latestVital.evaluations || {};
    let hasCrit = Boolean(latestVital.has_critical);
    let hasAbn = Boolean(latestVital.has_abnormal);

    const hasValidEvaluations = Object.keys(evals).length > 0 &&
      Object.values(evals).some(e => e?.status && e.status !== STATUS.NOT_CONFIGURED);

    // Fallback evaluation if saved record missed adult context
    if (!hasValidEvaluations && (activePatientContext.isAdult || activePatientContext.age !== undefined || activePatientContext.dateOfBirth)) {
      const res = evaluateVitals(latestVital.values || {}, activePatientContext);
      evals = res.evaluations || {};
      hasCrit = Boolean(res.has_critical);
      hasAbn = Boolean(res.has_abnormal);
    }

    return {
      ...latestVital,
      evaluations: evals,
      has_critical: hasCrit,
      has_abnormal: hasAbn
    };
  }, [latestVital, activePatientContext]);

  const abnormalMetrics = useMemo(() => {
    if (!evaluatedLatest || !evaluatedLatest.evaluations) return [];
    const metricsDef = [
      { key: 'blood_pressure', label: 'Blood Pressure' },
      { key: 'pulse', label: 'Pulse Rate' },
      { key: 'temperature', label: 'Temperature' },
      { key: 'respiratory_rate', label: 'Resp Rate' },
      { key: 'spo2', label: 'SpO2' },
      { key: 'blood_glucose', label: 'Blood Glucose' },
      { key: 'pain_score', label: 'Pain Score' },
      { key: 'weight', label: 'Weight' }
    ];

    const list = [];
    for (const m of metricsDef) {
      const ev = evaluatedLatest.evaluations[m.key];
      if (ev && (ev.status === STATUS.CRITICAL || ev.status === STATUS.HIGH || ev.status === STATUS.LOW || ev.is_critical || ev.is_abnormal)) {
        const displayVal = m.key === 'blood_pressure'
          ? (formatBpValue(evaluatedLatest.values) || ev.value)
          : ev.value;
        list.push({
          key: m.key,
          label: m.label,
          value: displayVal,
          unit: ev.unit || '',
          status: ev.status,
          isCritical: ev.status === STATUS.CRITICAL || Boolean(ev.is_critical),
          alertMessage: ev.alert_message || null
        });
      }
    }
    return list;
  }, [evaluatedLatest]);

  const hasUnconfiguredReferences = Boolean(
    evaluatedLatest &&
    Object.values(evaluatedLatest.evaluations || {}).some(
      (ev) => ev?.status === STATUS.NOT_CONFIGURED
    )
  );

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

      let activeUser = user;
      if (admRes.ok && admData.success) {
        const fetchedAdmissions = admData.data?.admissions || [];
        setAdmissions(fetchedAdmissions);

        if (!activeUser.ward_id && !activeUser.wardId && !activeUser.assigned_ward_id) {
          const admWithWard = fetchedAdmissions.find(a => a.ward_id || a.wardId);
          if (admWithWard) {
            const resolvedWardId = admWithWard.ward_id || admWithWard.wardId;
            activeUser = {
              ...activeUser,
              ward_id: resolvedWardId,
              wardId: resolvedWardId,
              assigned_ward_id: resolvedWardId
            };
            setNurseData(activeUser);
            try {
              localStorage.setItem('user', JSON.stringify(activeUser));
            } catch (_) { }
          }
        }
      } else if (!admRes.ok) {
        setError(admData.message || 'Failed to load assigned inpatient roster');
      }

      if (wardsRes.ok && wardsData.success) {
        setWards(wardsData.data?.wards || []);
      }
      fetchWardBeds(activeUser);
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
    setMarSuccessMsg('');
    setMarErrorMsg('');
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

  const handleSelectPatient = (adm, targetTab = null, targetNoteType = null) => {
    setSelectedAdmission(adm);
    const initialTab = targetTab || selectionNotice?.tab || 'vitals';
    setActiveCareTab(initialTab);
    setNoteSuccessMsg('');
    setNoteErrorMsg('');
    setVitalsSuccessMsg('');
    setVitalsErrorMsg('');
    setVitalsCriticalAlert(false);
    setIoSuccessMsg('');
    setIoErrorMsg('');
    setPatientRadiologyOrders([]);
    setViewingRadiologyReport(null);
    setRadiologyErrorMsg('');

    const initialNoteType = targetNoteType || selectionNotice?.noteType || (initialTab === 'handover' ? 'Shift Handover' : 'Nursing Note');
    setNoteForm({
      noteType: initialNoteType,
      patientCondition: 'Stable',
      observations: '',
      interventions: '',
      handoverNotes: ''
    });

    setSelectionNotice(null);
    setSidebarOpen(false);

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
      recorded_at: getLocalIsoDateTime()
    });
    setVoidingEntry(null);
    setVoidReasonText('');

    fetchNursingNotes(adm.id);
    fetchNurseVitals(adm.id);
    fetchIntakeOutput(adm.id);
    fetchPatientMAR(adm.id);
    fetchPatientRadiology(adm.id);
  };

  const handleNavDashboard = () => {
    setSelectedAdmission(null);
    setSelectionNotice(null);
    setPatientRadiologyOrders([]);
    setViewingRadiologyReport(null);
    setRadiologyErrorMsg('');
    setActiveNav('dashboard');
    setSidebarOpen(false);
    if (nurseData) {
      fetchNurseDashboard(nurseData);
    }
  };

  const fetchWardBeds = async (user = nurseData) => {
    const currentUser = user || nurseData;
    if (!currentUser) return;
    setLoadingBeds(true);
    setBedsError('');
    const clinicId = currentUser.clinicId || currentUser.clinic_id || currentUser.clinic?.id;
    const nurseWardId = currentUser.ward_id || currentUser.wardId || currentUser.assigned_ward_id || currentUser.assignedWardId;

    if (!clinicId) {
      setBedsError('Clinic association missing for nurse account.');
      setLoadingBeds(false);
      return;
    }

    if (!nurseWardId) {
      setBedsError('No assigned ward configured for this nurse account. Please contact your clinic administrator.');
      setWardBeds([]);
      setLoadingBeds(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/hierarchy?clinicId=${clinicId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const allBeds = data.data?.hierarchy?.beds || data.data?.beds || [];
        const allRooms = data.data?.hierarchy?.rooms || data.data?.rooms || [];

        const roomMap = new Map();
        for (const rm of allRooms) {
          roomMap.set(String(rm.id), rm);
        }

        const bedsInWard = allBeds
          .map(b => {
            const rmId = b.room_id || b.roomId;
            const rm = rmId ? roomMap.get(String(rmId)) : null;
            const resolvedWardId = b.ward_id || b.wardId || rm?.ward_id || rm?.wardId || null;
            return {
              ...b,
              ward_id: resolvedWardId,
              wardId: resolvedWardId,
              roomNumber: rm ? (rm.room_number || rm.roomNumber) : '—',
              roomType: rm ? (rm.room_type || rm.roomType) : ''
            };
          })
          .filter(b => b.ward_id && String(b.ward_id) === String(nurseWardId));

        setWardBeds(bedsInWard);
      } else {
        setBedsError(data?.message || 'Failed to load ward beds.');
      }
    } catch (err) {
      console.error('Error fetching ward beds:', err);
      setBedsError(err.message || 'Network error loading ward beds.');
    } finally {
      setLoadingBeds(false);
    }
  };

  const handleNavBeds = () => {
    setSelectedAdmission(null);
    setSelectionNotice(null);
    setPatientRadiologyOrders([]);
    setViewingRadiologyReport(null);
    setRadiologyErrorMsg('');
    setActiveNav('beds');
    setSidebarOpen(false);
    fetchWardBeds(nurseData);
  };

  const handleOpenBedAction = (bed, targetStatus, actionType = 'status') => {
    const defaultReason = actionType === 'clean'
      ? 'Sanitization and linen turnaround completed and verified by nurse'
      : `Bed status updated to ${targetStatus} by nurse`;
    setBedActionModal({
      isOpen: true,
      bed,
      targetStatus,
      actionType,
      reason: defaultReason,
      isSubmitting: false,
      error: ''
    });
  };

  const handleConfirmBedAction = async (e) => {
    e.preventDefault();
    if (!bedActionModal.bed) return;
    const { bed, targetStatus, actionType, reason } = bedActionModal;
    const clinicId = nurseData?.clinicId || nurseData?.clinic_id || nurseData?.clinic?.id;

    setBedActionModal(prev => ({ ...prev, isSubmitting: true, error: '' }));
    try {
      let res;
      if (actionType === 'clean' || (bed.status === 'CLEANING' && targetStatus === 'AVAILABLE')) {
        res = await fetch(`${API_BASE_URL}/api/v1/ipd/beds/${bed.id}/mark-cleaned`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ clinicId, reason: reason.trim() })
        });
      } else {
        res = await fetch(`${API_BASE_URL}/api/v1/ipd/beds/${bed.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ clinicId, status: targetStatus, reason: reason.trim() })
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update bed status');
      }

      setBedNotification({
        type: 'success',
        message: `Bed ${bed.bed_number} successfully transitioned to ${targetStatus}!`
      });
      setTimeout(() => setBedNotification({ type: '', message: '' }), 5000);

      setBedActionModal({ isOpen: false, bed: null, targetStatus: '', actionType: 'status', reason: '', isSubmitting: false, error: '' });
      setSelectedWardBedId(null);
      await fetchWardBeds(nurseData);
    } catch (err) {
      setBedActionModal(prev => ({ ...prev, isSubmitting: false, error: err.message || 'Operation failed' }));
    }
  };

  // Nurse executes an approved patient transfer and records physical movement
  const handleExecuteTransfer = async (e) => {
    e?.preventDefault();
    if (!transferExecutionModal.transfer || !selectedAdmission) return;

    setTransferExecutionModal(prev => ({ ...prev, isSubmitting: true, error: '' }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/admissions/${selectedAdmission.id}/transfers/${transferExecutionModal.transfer.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          movementNotes: transferExecutionModal.movementNotes.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to execute transfer');
      }

      const destWard = transferExecutionModal.transfer.destinationWardName;
      const destBed = transferExecutionModal.transfer.destinationBedNumber;

      setTransferExecutionModal({
        isOpen: false,
        transfer: null,
        movementNotes: '',
        isSubmitting: false,
        error: ''
      });

      setBedNotification({
        type: 'success',
        message: `Patient transfer completed successfully to ${destWard} • Bed ${destBed}. Vacated bed marked for CLEANING turnaround.`
      });
      setTimeout(() => setBedNotification({ type: '', message: '' }), 6000);

      // Refresh admissions and ward beds
      await fetchNurseDashboard(nurseData);
      if (nurseData?.assigned_ward_id) {
        await fetchWardBeds(nurseData);
      }
      // Clear selected admission so nurse returns to updated worklist
      setSelectedAdmission(null);
    } catch (err) {
      console.error('Execute transfer error:', err);
      setTransferExecutionModal(prev => ({
        ...prev,
        isSubmitting: false,
        error: err.message || 'Failed to execute transfer'
      }));
    }
  };

  const handleSharedBedAction = (targetStatus) => {
    if (!selectedWardBedId) {
      setBedNotification({
        type: 'error',
        message: 'Please select an eligible bed from the inventory below before applying this action.'
      });
      return;
    }
    const targetBed = wardBeds.find(b => b.id === selectedWardBedId);
    if (!targetBed) {
      setBedNotification({
        type: 'error',
        message: 'Selected bed record could not be found. Please select a bed from the inventory.'
      });
      return;
    }
    if (targetBed.status === 'OCCUPIED') {
      setBedNotification({
        type: 'error',
        message: `Bed ${targetBed.bed_number} is OCCUPIED by an active inpatient. Nurse cannot manually modify occupied beds.`
      });
      return;
    }
    const permittedActions = getPermittedBedActions(targetBed);
    const isPermitted = permittedActions.some(act => act.targetStatus === targetStatus);
    if (!isPermitted) {
      setBedNotification({
        type: 'error',
        message: `Action not permitted: Bed ${targetBed.bed_number} is currently ${targetBed.status} and cannot transition to ${targetStatus}.`
      });
      return;
    }
    handleOpenBedAction(targetBed, targetStatus, 'status');
  };

  const getPermittedBedActions = (bed) => {
    switch (bed.status) {
      case 'CLEANING':
        return [
          { label: 'Mark Cleaned (Available)', targetStatus: 'AVAILABLE', actionType: 'clean', isPrimary: true, variant: 'emerald' },
          { label: 'Set Maintenance', targetStatus: 'MAINTENANCE', actionType: 'status', variant: 'rose' },
          { label: 'Block Bed', targetStatus: 'BLOCKED', actionType: 'status', variant: 'slate' }
        ];
      case 'AVAILABLE':
        return [
          { label: 'Reserve Bed', targetStatus: 'RESERVED', actionType: 'status', variant: 'cyan' },
          { label: 'Set Maintenance', targetStatus: 'MAINTENANCE', actionType: 'status', variant: 'rose' },
          { label: 'Block Bed', targetStatus: 'BLOCKED', actionType: 'status', variant: 'slate' },
          { label: 'Set Isolation', targetStatus: 'ISOLATION', actionType: 'status', variant: 'purple' }
        ];
      case 'RESERVED':
        return [
          { label: 'Release to Available', targetStatus: 'AVAILABLE', actionType: 'status', isPrimary: true, variant: 'emerald' },
          { label: 'Set Maintenance', targetStatus: 'MAINTENANCE', actionType: 'status', variant: 'rose' },
          { label: 'Block Bed', targetStatus: 'BLOCKED', actionType: 'status', variant: 'slate' }
        ];
      case 'MAINTENANCE':
        return [
          { label: 'Release to Available', targetStatus: 'AVAILABLE', actionType: 'status', isPrimary: true, variant: 'emerald' },
          { label: 'Send to Cleaning', targetStatus: 'CLEANING', actionType: 'status', variant: 'amber' },
          { label: 'Block Bed', targetStatus: 'BLOCKED', actionType: 'status', variant: 'slate' }
        ];
      case 'BLOCKED':
        return [
          { label: 'Unblock (Available)', targetStatus: 'AVAILABLE', actionType: 'status', isPrimary: true, variant: 'emerald' },
          { label: 'Set Maintenance', targetStatus: 'MAINTENANCE', actionType: 'status', variant: 'rose' }
        ];
      case 'ISOLATION':
        return [
          { label: 'Release to Available', targetStatus: 'AVAILABLE', actionType: 'status', isPrimary: true, variant: 'emerald' },
          { label: 'Send to Cleaning', targetStatus: 'CLEANING', actionType: 'status', variant: 'amber' },
          { label: 'Set Maintenance', targetStatus: 'MAINTENANCE', actionType: 'status', variant: 'rose' },
          { label: 'Block Bed', targetStatus: 'BLOCKED', actionType: 'status', variant: 'slate' }
        ];
      case 'OCCUPIED':
      default:
        return [];
    }
  };

  const handleNavInpatients = () => {
    setSelectedAdmission(null);
    setSelectionNotice(null);
    setPatientRadiologyOrders([]);
    setViewingRadiologyReport(null);
    setRadiologyErrorMsg('');
    setActiveNav('inpatients');
    setSidebarOpen(false);
    if (nurseData) {
      fetchNurseDashboard(nurseData);
    }
  };

  const handleNavWorklist = () => {
    setSelectedAdmission(null);
    setSelectionNotice(null);
    setPatientRadiologyOrders([]);
    setViewingRadiologyReport(null);
    setRadiologyErrorMsg('');
    setActiveNav('inpatients');
    setSidebarOpen(false);
    if (nurseData) {
      fetchNurseDashboard(nurseData);
    }
  };

  const handleNavVitals = () => {
    if (selectedAdmission) {
      setActiveCareTab('vitals');
    } else {
      setActiveNav('inpatients');
      setSelectionNotice({
        function: 'Vitals & Observations',
        description: 'Select an inpatient from the worklist below to view or record bedside vital signs.',
        tab: 'vitals'
      });
    }
    setSidebarOpen(false);
  };

  const handleNavIo = () => {
    if (selectedAdmission) {
      setActiveCareTab('io');
      setIoForm(prev => ({
        ...prev,
        recorded_at: prev.recorded_at || getLocalIsoDateTime()
      }));
    } else {
      setActiveNav('inpatients');
      setSelectionNotice({
        function: 'Fluid Intake / Output (I/O)',
        description: 'Select an inpatient from the worklist below to record fluid charting or view 24-hour balance.',
        tab: 'io'
      });
    }
    setSidebarOpen(false);
  };

  const handleReuseCareNotes = () => {
    const careNotes = nursingNotes.filter(n => (n.note_type || n.noteType) !== 'Shift Handover');
    if (!careNotes || careNotes.length === 0) return;

    // Collect latest non-empty observations, care interventions, and follow-up from recent shift notes
    const latestObs = careNotes.find(n => n.nursing_observations)?.nursing_observations || '';
    const latestInterv = careNotes.find(n => n.interventions)?.interventions || '';
    const latestFollowup = careNotes.find(n => n.handover_notes)?.handover_notes || '';
    const latestCond = careNotes.find(n => n.patient_condition || n.patientCondition);
    const cond = latestCond ? (latestCond.patient_condition || latestCond.patientCondition) : null;

    setNoteForm(prev => ({
      ...prev,
      patientCondition: cond || prev.patientCondition || 'Stable',
      observations: prev.observations ? `${prev.observations}\n${latestObs}`.trim() : latestObs,
      interventions: prev.interventions ? `${prev.interventions}\n${latestInterv}`.trim() : latestInterv,
      handoverNotes: prev.handoverNotes ? `${prev.handoverNotes}\n${latestFollowup}`.trim() : latestFollowup
    }));

    setNoteSuccessMsg('Imported recent nursing observations and care items into handover form.');
    setTimeout(() => setNoteSuccessMsg(''), 3000);
  };

  const handleNavNotes = () => {
    if (selectedAdmission) {
      setActiveCareTab('notes');
      setNoteForm(prev => ({ ...prev, noteType: 'Nursing Note' }));
    } else {
      setActiveNav('inpatients');
      setSelectionNotice({
        function: 'Nursing Care Notes',
        description: 'Select an inpatient from the worklist below to document observations and nursing care.',
        tab: 'notes',
        noteType: 'Nursing Note'
      });
    }
    setSidebarOpen(false);
  };

  const handleNavHandover = () => {
    if (selectedAdmission) {
      setActiveCareTab('handover');
      setNoteForm(prev => ({ ...prev, noteType: 'Shift Handover' }));
    } else {
      setActiveNav('inpatients');
      setSelectionNotice({
        function: 'Shift Handover',
        description: 'Select an inpatient from the worklist below to document or review shift handover notes.',
        tab: 'handover',
        noteType: 'Shift Handover'
      });
    }
    setSidebarOpen(false);
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
      payload.recorded_at = ioForm.recorded_at
        ? new Date(ioForm.recorded_at).toISOString()
        : new Date().toISOString();

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
          recorded_at: getLocalIsoDateTime()
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

    const isHandover = noteForm.noteType === 'Shift Handover';

    if (isHandover) {
      if (!observations && !interventions && !handover) {
        setNoteErrorMsg('Please provide a shift status summary, interventions, or pending handover items.');
        return;
      }
    } else {
      if (!observations && !interventions && !handover) {
        setNoteErrorMsg('Please enter nursing observations or care interventions.');
        return;
      }
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

      setNoteSuccessMsg(
        noteForm.noteType === 'Shift Handover'
          ? 'Shift handover documented successfully'
          : 'Nursing note recorded successfully'
      );
      setNoteForm({
        noteType: activeCareTab === 'handover' ? 'Shift Handover' : 'Nursing Note',
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

  const handleNavProfile = () => {
    setProfileDropdownOpen(false);
    setSidebarOpen(false);
    router.push('/nurse-dashboard/profile');
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
    } catch (_) { }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleScrollToRecordVitals = () => {
    const formEl = document.getElementById('record-vitals-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        const firstInput = formEl.querySelector('input:not([disabled])');
        if (firstInput) firstInput.focus();
      }, 350);
    }
  };

  const getStatusBadge = (status) => {
    if (!status || status === STATUS.NOT_CONFIGURED) return null;
    switch (status) {
      case STATUS.CRITICAL:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-rose-600 text-white shadow-2xs">
            <AlertTriangle className="w-2.5 h-2.5" />
            CRITICAL
          </span>
        );
      case STATUS.HIGH:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-amber-100 text-amber-900 border border-amber-300">
            <ArrowUpRight className="w-2.5 h-2.5 text-amber-700 stroke-[2.5]" />
            HIGH
          </span>
        );
      case STATUS.LOW:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-amber-100 text-amber-900 border border-amber-300">
            <ArrowDownRight className="w-2.5 h-2.5 text-amber-700 stroke-[2.5]" />
            LOW
          </span>
        );
      case STATUS.WITHIN_REFERENCE:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check className="w-2.5 h-2.5 text-emerald-600" />
            NORMAL
          </span>
        );
      default:
        return null;
    }
  };

  const getCardContainerClass = (hasVal, isCrit, isAbn) => {
    if (!hasVal) return 'bg-slate-50/70 border border-slate-200/70';
    if (isCrit) return 'bg-rose-50/50 border border-rose-300 shadow-2xs';
    if (isAbn) return 'bg-amber-50/40 border border-amber-200/90 shadow-2xs';
    return 'bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300';
  };

  const getIconContainerClass = (hasVal, isCrit, isAbn, normalColor) => {
    if (!hasVal) return 'bg-slate-100 text-slate-400';
    if (isCrit) return 'bg-rose-100 text-rose-700 border border-rose-200';
    if (isAbn) return 'bg-amber-100 text-amber-800 border border-amber-200';
    return normalColor;
  };

  const getValueTextClass = (isCrit, isAbn) => {
    if (isCrit) return 'text-rose-950 font-bold';
    if (isAbn) return 'text-amber-950 font-bold';
    return 'text-slate-900 font-bold';
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
  const nurseWardId = nurseData?.wardId || nurseData?.ward_id || nurseData?.assigned_ward_id;
  const assignedWard = wards.find(w => String(w.id) === String(nurseWardId));
  const wardName = assignedWard ? `${assignedWard.name} (${assignedWard.type || 'General'})` : (nurseWardId ? 'Assigned Ward' : 'Unassigned');
  const nursePhotoUrl = nurseData?.profileImage || nurseData?.avatarUrl || nurseData?.avatar_url || nurseData?.photo || null;

  // Inpatients assigned to this nurse (and strictly belonging to assigned ward)
  const myAssignedInpatients = admissions.filter((adm) => {
    const isMyPatient = (adm.assigned_nurse_id || adm.assignedNurseId || adm.nurse_id || adm.nurseId) === nurseId;
    const isMyWard = nurseWardId ? (String(adm.ward_id || adm.wardId) === String(nurseWardId)) : false;
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

  const isDashboardActive = !selectedAdmission && !selectionNotice && activeNav === 'dashboard';
  const isInpatientsActive = !selectedAdmission && !selectionNotice && activeNav === 'inpatients';
  const isVitalsActive = (selectedAdmission && activeCareTab === 'vitals') || (!selectedAdmission && selectionNotice?.tab === 'vitals');
  const isIoActive = (selectedAdmission && activeCareTab === 'io') || (!selectedAdmission && selectionNotice?.tab === 'io');
  const isNotesActive = (selectedAdmission && activeCareTab === 'notes') || (!selectedAdmission && selectionNotice?.tab === 'notes');
  const isHandoverActive = (selectedAdmission && activeCareTab === 'handover') || (!selectedAdmission && selectionNotice?.tab === 'handover');
  const isMarActive = (selectedAdmission && activeCareTab === 'mar') || (!selectedAdmission && selectionNotice?.tab === 'mar');

  return (
    <div className="min-h-screen bg-[#f8fafc] relative text-slate-800 overflow-x-clip">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200/80 flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <img src="/icons8-medical-bag-100.png" alt="ClinicPro" className="w-8 h-8 object-contain" />
              <div>
                <h1 className="text-xl font-bold text-slate-800 leading-tight">ClinicPro</h1>
                <p className="text-xs font-semibold text-blue-600">Staff Nurse</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selected Patient In-Focus Card */}
          {selectedAdmission && (
            <div className="px-4 py-2">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Patient In Care</span>
                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded">
                    Bed {selectedAdmission.bedNumber}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 truncate">
                  {selectedAdmission.patientName || 'Inpatient'}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="mt-2 px-3 space-y-6 flex-1">
            {/* Main Navigation Section */}
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Main Navigation
              </p>
              <div className="space-y-1">
                {/* Dashboard */}
                <button
                  type="button"
                  onClick={handleNavDashboard}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-xs text-left ${isDashboardActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                >
                  <div className="flex items-center">
                    <LayoutDashboard className={`w-4 h-4 mr-3 flex-shrink-0 ${isDashboardActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>Dashboard</span>
                  </div>
                </button>

                {/* Assigned Inpatients */}
                <button
                  type="button"
                  onClick={handleNavInpatients}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-xs text-left ${isInpatientsActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                >
                  <div className="flex items-center">
                    <ClipboardList className={`w-4 h-4 mr-3 flex-shrink-0 ${isInpatientsActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>Assigned Inpatients</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isInpatientsActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                    {activeCount}
                  </span>
                </button>

                {/* Ward Beds & Cleaning */}
                <button
                  type="button"
                  id="nav-ward-beds"
                  onClick={handleNavBeds}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-xs text-left ${activeNav === 'beds' && !selectedAdmission
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                >
                  <div className="flex items-center">
                    <BedDouble className={`w-4 h-4 mr-3 flex-shrink-0 ${activeNav === 'beds' && !selectedAdmission ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>Ward Beds</span>
                  </div>
                  {wardBeds.filter(b => b.status === 'CLEANING').length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 animate-pulse">
                      {wardBeds.filter(b => b.status === 'CLEANING').length} clean
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Nursing Care Section */}
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Nursing Care
              </p>
              <div className="space-y-1">
                {/* Vitals & Observations */}
                <button
                  type="button"
                  onClick={handleNavVitals}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-xs text-left ${isVitalsActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                >
                  <div className="flex items-center">
                    <HeartPulse className={`w-4 h-4 mr-3 flex-shrink-0 ${isVitalsActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>Vitals & Observations</span>
                  </div>
                  {!selectedAdmission && selectionNotice?.tab === 'vitals' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold uppercase">Pending</span>
                  )}
                </button>

                {/* Medication Administration (MAR) */}
                <button
                  type="button"
                  id="nav-mar"
                  onClick={handleNavMar}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-xs text-left ${isMarActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                >
                  <div className="flex items-center">
                    <Pill className={`w-4 h-4 mr-3 flex-shrink-0 ${isMarActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>Medication (MAR)</span>
                  </div>
                  {!selectedAdmission && selectionNotice?.tab === 'mar' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold uppercase">Pending</span>
                  )}
                  {selectedAdmission && marScheduledDoses.filter(d => d.status === 'SCHEDULED').length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                      {marScheduledDoses.filter(d => d.status === 'SCHEDULED').length} due
                    </span>
                  )}
                </button>

                {/* Intake / Output (I/O) */}
                <button
                  type="button"
                  onClick={handleNavIo}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-xs text-left ${isIoActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                >
                  <div className="flex items-center">
                    <Droplets className={`w-4 h-4 mr-3 flex-shrink-0 ${isIoActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>Intake / Output (I/O)</span>
                  </div>
                  {!selectedAdmission && selectionNotice?.tab === 'io' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold uppercase">Pending</span>
                  )}
                </button>

                {/* Nursing Notes */}
                <button
                  type="button"
                  onClick={handleNavNotes}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-xs text-left ${isNotesActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                >
                  <div className="flex items-center">
                    <FileText className={`w-4 h-4 mr-3 flex-shrink-0 ${isNotesActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>Nursing Notes</span>
                  </div>
                  {!selectedAdmission && selectionNotice?.tab === 'notes' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold uppercase">Pending</span>
                  )}
                </button>

                {/* Shift Handover */}
                <button
                  type="button"
                  onClick={handleNavHandover}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-xs text-left ${isHandoverActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                >
                  <div className="flex items-center">
                    <Clock className={`w-4 h-4 mr-3 flex-shrink-0 ${isHandoverActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>Shift Handover</span>
                  </div>
                  {!selectedAdmission && selectionNotice?.tab === 'handover' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold uppercase">Pending</span>
                  )}
                </button>
              </div>
            </div>

            {/* Settings Section */}
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Settings
              </p>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={handleNavProfile}
                  className="w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-xs text-left text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                >
                  <User className="w-4 h-4 mr-3 flex-shrink-0 text-slate-400" />
                  <span>Profile</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-xs text-left text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                >
                  <LogOut className="w-4 h-4 mr-3 flex-shrink-0 text-slate-400" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </nav>
        </div>
      </aside>


      {/* Main Content Area */}
      <div className="lg:ml-72 flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors mr-3"
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  {selectedAdmission ? (
                    <span className="flex items-center gap-1.5">
                      <span>Care Chart:</span>
                      <span className="text-blue-600">{selectedAdmission.patientName || 'Patient'}</span>
                    </span>
                  ) : activeNav === 'beds' ? (
                    <span className="flex items-center gap-2">
                      <BedDouble className="w-5 h-5 text-blue-600" />
                      <span>Ward Bed Management</span>
                    </span>
                  ) : (
                    'Nurse Care Dashboard'
                  )}
                </h1>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  {selectedAdmission
                    ? `Bed ${selectedAdmission.bedNumber} • ${selectedAdmission.wardName || wardName}`
                    : activeNav === 'beds'
                      ? `Bed turnaround & sanitization • ${wardName}`
                      : `Inpatient monitoring • ${wardName}`}
                </p>
              </div>
            </div>

            {/* Top-Right Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                id="btn-nurse-profile-menu"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
              >
                <div className="hidden sm:flex flex-col items-end text-right">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {nurseData?.firstName || 'Staff'} {nurseData?.lastName || 'Nurse'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">Staff Nurse • {wardName}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs uppercase shadow-2xs border border-rose-200/60 flex-shrink-0 overflow-hidden">
                  {nursePhotoUrl ? (
                    <img src={nursePhotoUrl} alt={nurseData?.firstName || 'Nurse'} className="w-full h-full object-cover" />
                  ) : (
                    <span>{(nurseData?.firstName || 'N').charAt(0)}</span>
                  )}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 hidden sm:block ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileDropdownOpen && (
                <div
                  id="nurse-profile-dropdown"
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-1.5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {nurseData?.firstName || 'Staff'} {nurseData?.lastName || 'Nurse'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{nurseData?.email || 'nurse@clinicpro.com'}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                      Staff Nurse
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      id="btn-dropdown-view-profile"
                      onClick={handleNavProfile}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>View Profile</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      id="btn-dropdown-logout"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>


        {/* Main Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Patient Selection Guidance Notice (When a clinical function was clicked from sidebar without an active patient) */}
          {selectionNotice && !selectedAdmission && (
            <div className="p-4 bg-blue-50/90 border border-blue-200 rounded-2xl flex items-start justify-between gap-3 text-xs text-blue-900 shadow-xs">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg flex-shrink-0 mt-0.5">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-blue-900">
                    {selectionNotice.function} — Patient Selection Required
                  </div>
                  <div className="text-blue-700 mt-0.5">
                    {selectionNotice.description}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectionNotice(null)}
                className="text-blue-500 hover:text-blue-700 p-1 text-xs font-semibold"
                title="Dismiss guidance"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Error notification */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Capacity & Ward Summary (Shown on main worklist view) */}
          {!selectedAdmission && activeNav !== 'beds' && (
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
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isCapacityFull ? 'bg-rose-100 text-rose-700' : activeCount >= 15 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
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
                    className={`h-full rounded-full transition-all duration-300 ${isCapacityFull ? 'bg-rose-500' : activeCount >= 15 ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                    style={{ width: `${capacityPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: WARD BEDS MANAGEMENT (Nurse Assigned Ward) */}
          {!selectedAdmission && activeNav === 'beds' ? (
            <div className="space-y-6">
              {/* Bed Notification Alert */}
              {bedNotification.message && (
                <div className={`p-4 rounded-xl text-sm flex items-center justify-between gap-2 animate-in fade-in ${bedNotification.type === 'error'
                    ? 'bg-rose-50 border border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  }`}>
                  <div className="flex items-center gap-2">
                    {bedNotification.type === 'error' ? (
                      <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    )}
                    <span className="font-medium">{bedNotification.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBedNotification({ type: '', message: '' })}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Ward Bed Summary Cards (Clickable Filters) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => setBedStatusFilter('all')}
                  aria-pressed={bedStatusFilter === 'all'}
                  title="Filter by all beds"
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer focus:outline-none focus:border-blue-400 ${bedStatusFilter === 'all'
                      ? 'border-blue-500 bg-blue-50/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                >
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Ward Beds</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{wardBeds.length}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{wardName}</p>
                </button>

                <button
                  type="button"
                  onClick={() => setBedStatusFilter('CLEANING')}
                  aria-pressed={bedStatusFilter === 'CLEANING'}
                  title="Filter by cleaning turnaround beds"
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer focus:outline-none focus:border-amber-400 ${bedStatusFilter === 'CLEANING'
                      ? 'border-amber-400 bg-amber-50/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-amber-300 hover:shadow-xs'
                    }`}
                >
                  <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Cleaning Needed</p>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <p className="text-2xl font-black text-amber-700">
                      {wardBeds.filter(b => b.status === 'CLEANING').length}
                    </p>
                    <span className="text-[11px] text-amber-600 font-medium">turnaround</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Ready for sanitization</p>
                </button>

                <button
                  type="button"
                  onClick={() => setBedStatusFilter('AVAILABLE')}
                  aria-pressed={bedStatusFilter === 'AVAILABLE'}
                  title="Filter by available beds"
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer focus:outline-none focus:border-emerald-400 ${bedStatusFilter === 'AVAILABLE'
                      ? 'border-emerald-400 bg-emerald-50/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs'
                    }`}
                >
                  <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Available for Intake</p>
                  <p className="text-2xl font-black text-emerald-700 mt-1">
                    {wardBeds.filter(b => b.status === 'AVAILABLE').length}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Ready for patient</p>
                </button>

                <button
                  type="button"
                  onClick={() => setBedStatusFilter('OTHER')}
                  aria-pressed={bedStatusFilter === 'OTHER'}
                  title="Filter by occupied and other beds"
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer focus:outline-none focus:border-blue-400 ${bedStatusFilter === 'OTHER'
                      ? 'border-blue-400 bg-blue-50/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs'
                    }`}
                >
                  <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">Occupied / Other</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {wardBeds.filter(b => b.status !== 'AVAILABLE' && b.status !== 'CLEANING').length}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {wardBeds.filter(b => b.status === 'OCCUPIED').length} active inpatient
                  </p>
                </button>
              </div>

              {/* Bed Inventory & Turnaround Table / Cards */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Ward Beds & Sanitization Control</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-500">
                        Manage cleaning turnaround and permitted status transitions for beds in {wardName}
                      </p>
                      {selectedWardBedId && (() => {
                        const selBed = wardBeds.find(b => b.id === selectedWardBedId);
                        return selBed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[11px] font-semibold">
                            <span>Target: <strong>Bed {selBed.bed_number}</strong> ({selBed.status})</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedWardBedId(null);
                              }}
                              className="text-blue-500 hover:text-blue-800 ml-0.5 font-bold cursor-pointer"
                              title="Clear bed selection"
                            >
                              ×
                            </button>
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  {/* Shared Action Buttons Aligned with Heading */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSharedBedAction('RESERVED')}
                      className="h-7 px-2.5 text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 hover:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 shrink-0"
                    >
                      <span>Reserve Bed</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSharedBedAction('MAINTENANCE')}
                      className="h-7 px-2.5 text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 hover:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400 shrink-0"
                    >
                      <span>Maintenance</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSharedBedAction('BLOCKED')}
                      className="h-7 px-2.5 text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 shrink-0"
                    >
                      <span>Block</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSharedBedAction('ISOLATION')}
                      className="h-7 px-2.5 text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 hover:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400 shrink-0"
                    >
                      <span>Isolation</span>
                    </button>
                  </div>
                </div>

                {/* Bed Cards Grid */}
                {loadingBeds ? (
                  <div className="p-12 text-center text-slate-500">
                    <RefreshCw className="h-8 w-8 mx-auto text-blue-600 animate-spin mb-2" />
                    <p className="text-sm font-semibold text-slate-700">Loading ward beds...</p>
                    <p className="text-xs text-slate-400 mt-1">Retrieving bed turnaround and sanitization data for {wardName}.</p>
                  </div>
                ) : bedsError ? (
                  <div className="p-12 text-center text-rose-500">
                    <AlertCircle className="h-8 w-8 mx-auto text-rose-500 mb-2" />
                    <p className="text-sm font-semibold text-rose-700">Failed to load ward beds</p>
                    <p className="text-xs text-slate-500 mt-1 mb-4">{bedsError}</p>
                    <button
                      type="button"
                      onClick={() => fetchWardBeds(nurseData)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </button>
                  </div>
                ) : wardBeds.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <BedDouble className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No beds configured in this ward</p>
                    <p className="text-xs text-slate-400 mt-1">Ward {wardName} currently has no registered bed inventory.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(() => {
                      const filtered = wardBeds.filter(b => {
                        if (bedStatusFilter === 'all') return true;
                        if (bedStatusFilter === 'CLEANING') return b.status === 'CLEANING';
                        if (bedStatusFilter === 'AVAILABLE') return b.status === 'AVAILABLE';
                        if (bedStatusFilter === 'OTHER') return b.status !== 'CLEANING' && b.status !== 'AVAILABLE';
                        return true;
                      });
                      if (filtered.length === 0) {
                        return (
                          <div className="col-span-full p-8 text-center text-slate-400">
                            <p className="text-xs font-semibold text-slate-600">No beds found matching status filter "{bedStatusFilter}"</p>
                            <button
                              type="button"
                              onClick={() => setBedStatusFilter('all')}
                              className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                            >
                              Show all beds ({wardBeds.length})
                            </button>
                          </div>
                        );
                      }
                      return filtered.map(bed => {
                        const actions = getPermittedBedActions(bed);
                        const isCleaning = bed.status === 'CLEANING';
                        const isOccupied = bed.status === 'OCCUPIED';
                        const isAvailable = bed.status === 'AVAILABLE';

                        return (
                          <div
                            key={bed.id}
                            onClick={() => setSelectedWardBedId(prev => prev === bed.id ? null : bed.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedWardBedId === bed.id
                                ? 'ring-2 ring-blue-500 border-blue-500 shadow-sm'
                                : isCleaning
                                  ? 'bg-amber-50/50 border-amber-200 shadow-xs hover:border-amber-300'
                                  : isAvailable
                                    ? 'bg-emerald-50/30 border-emerald-200/80 shadow-xs hover:border-emerald-300'
                                    : isOccupied
                                      ? 'bg-blue-50/20 border-slate-200 hover:border-slate-300'
                                      : 'bg-white border-slate-200 hover:border-slate-300'
                              } space-y-3 flex flex-col justify-between`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                    <BedDouble className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span>Bed {bed.bed_number}</span>
                                  </h4>
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    Room {bed.roomNumber || '—'} {bed.roomType ? `• ${bed.roomType}` : ''}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {selectedWardBedId === bed.id && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white shadow-2xs">
                                      Selected
                                    </span>
                                  )}
                                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${bed.status === 'AVAILABLE'
                                      ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300'
                                      : bed.status === 'CLEANING'
                                        ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                                        : bed.status === 'OCCUPIED'
                                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                                          : bed.status === 'MAINTENANCE'
                                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                                            : bed.status === 'BLOCKED'
                                              ? 'bg-slate-200 text-slate-800 border-slate-300'
                                              : bed.status === 'ISOLATION'
                                                ? 'bg-purple-100 text-purple-800 border-purple-300'
                                                : 'bg-cyan-100 text-cyan-800 border-cyan-300'
                                    }`}>
                                    {bed.status}
                                  </span>
                                </div>
                              </div>

                              <p className="text-xs text-slate-600 line-clamp-2">
                                {isCleaning && 'Sanitization and linen change required before intake.'}
                                {isAvailable && 'Available and sanitization verified. Ready for inpatient admission.'}
                                {isOccupied && 'Occupied by patient. Requires doctor discharge workflow to modify.'}
                                {bed.status === 'MAINTENANCE' && 'Temporarily out of service for repairs or maintenance.'}
                                {bed.status === 'BLOCKED' && 'Temporarily blocked from allocation.'}
                                {bed.status === 'ISOLATION' && 'Designated for clinical isolation protocols.'}
                                {bed.status === 'RESERVED' && 'Reserved for pending patient admission.'}
                              </p>
                            </div>

                            {/* Permitted Action Buttons */}
                            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                              {isOccupied ? (
                                <span className="text-[11px] text-slate-400 italic">
                                  Doctor admission active (controlled allocation)
                                </span>
                              ) : actions.length === 0 ? (
                                <span className="text-[11px] text-slate-400 italic">No transitions permitted</span>
                              ) : (
                                actions.map(act => (
                                  <button
                                    key={act.targetStatus}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenBedAction(bed, act.targetStatus, act.actionType);
                                    }}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 ${act.isPrimary
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                        : act.variant === 'rose'
                                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                          : act.variant === 'amber'
                                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                                            : act.variant === 'purple'
                                              ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                                              : act.variant === 'cyan'
                                                ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200'
                                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                      }`}
                                  >
                                    {act.actionType === 'clean' && <Sparkles className="w-3.5 h-3.5 text-white" />}
                                    <span>{act.label}</span>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>
          ) : !selectedAdmission ? (
            /* VIEW 1: PATIENT WORKLIST ROSTER */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Assigned Inpatient Worklist</h3>
                  <p className="text-xs text-slate-500">Currently admitted inpatients under your primary nursing care in {wardName}</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search patient, bed, or admission #..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => nurseData && fetchNurseDashboard(nurseData)}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                    title="Refresh Worklist"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
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
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${isAdmitted
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}
                              >
                                {isAdmitted ? 'Active IPD' : 'Discharged'}
                              </span>
                              {adm.pendingTransfer && (
                                <span className="block mt-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 text-center animate-pulse">
                                  Transfer Approved
                                </span>
                              )}
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
              {/* Compact Patient Summary Header */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-3.5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleNavWorklist}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-1.5 text-xs font-semibold"
                      title="Return to Assigned Inpatient Worklist"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back to Worklist</span>
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900 leading-tight">
                          {selectedAdmission.patientName || 'Inpatient'}
                        </h2>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active IPD
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {selectedAdmission.admission_number || selectedAdmission.admissionNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-500">
                    <span>Admitted: <strong className="text-slate-700">{new Date(selectedAdmission.admission_date || selectedAdmission.admissionDate).toLocaleDateString()}</strong></span>
                  </div>
                </div>

                {/* Compact Details Grid: Bed & Room, Ward, Doctor, Assigned Nurse */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block text-[11px]">Bed & Room</span>
                    <span className="font-bold text-slate-800">
                      Bed {selectedAdmission.bedNumber}
                      {formatRoomDisplay(selectedAdmission.roomNumber) ? ` • ${formatRoomDisplay(selectedAdmission.roomNumber)}` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block text-[11px]">Assigned Ward</span>
                    <span className="font-semibold text-slate-800">{selectedAdmission.wardName || wardName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block text-[11px]">Admitting Doctor</span>
                    <span className="font-semibold text-slate-800">{formatDoctorName(selectedAdmission.admittingDoctorName)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block text-[11px]">Assigned Nurse</span>
                    <span className="font-semibold text-slate-800">{nurseData?.firstName || 'Staff'} {nurseData?.lastName || 'Nurse'} (Primary Care)</span>
                  </div>
                </div>

                {/* PENDING PATIENT TRANSFER BANNER FOR NURSE */}
                {selectedAdmission.pendingTransfer && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
                        <ArrowRightLeft className="h-5 w-5 text-amber-700" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Transfer Approved by Doctor</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-950 uppercase">
                            Action Required
                          </span>
                        </div>
                        <p className="text-xs text-amber-800 mt-1">
                          Doctor approved transfer to <strong>{selectedAdmission.pendingTransfer.destinationWardName || 'Destination Ward'}</strong> • Bed <strong>{selectedAdmission.pendingTransfer.destinationBedNumber || 'Bed'}</strong>.
                          Please record physical transport and execute the transfer below.
                        </p>
                        {selectedAdmission.pendingTransfer.reason && (
                          <p className="text-xs text-amber-700 mt-0.5 italic">
                            Clinical Reason: &quot;{selectedAdmission.pendingTransfer.reason}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      id="nurse-execute-transfer-btn"
                      onClick={() => setTransferExecutionModal({
                        isOpen: true,
                        transfer: selectedAdmission.pendingTransfer,
                        movementNotes: '',
                        isSubmitting: false,
                        error: ''
                      })}
                      className="shrink-0 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Execute Transfer</span>
                    </button>
                  </div>
                )}
              </div>

              {/* PATIENT CARE NAVIGATION TAB STRIP */}
              <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
                <button
                  type="button"
                  id="tab-btn-vitals"
                  onClick={() => setActiveCareTab('vitals')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all duration-150 cursor-pointer ${activeCareTab === 'vitals'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  <HeartPulse className="h-4 w-4" />
                  <span>Vitals & Observations</span>
                </button>

                <button
                  type="button"
                  id="tab-btn-mar"
                  onClick={() => {
                    setActiveCareTab('mar');
                    fetchPatientMAR(selectedAdmission.id);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all duration-150 cursor-pointer ${activeCareTab === 'mar'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  <Pill className="h-4 w-4" />
                  <span>Medication (MAR)</span>
                  {marScheduledDoses.filter(d => d.status === 'SCHEDULED').length > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeCareTab === 'mar' ? 'bg-white text-blue-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                      {marScheduledDoses.filter(d => d.status === 'SCHEDULED').length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  id="tab-btn-io"
                  onClick={() => setActiveCareTab('io')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all duration-150 cursor-pointer ${activeCareTab === 'io'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  <Droplets className="h-4 w-4" />
                  <span>Intake / Output (I/O)</span>
                </button>

                <button
                  type="button"
                  id="tab-btn-notes"
                  onClick={() => setActiveCareTab('notes')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all duration-150 cursor-pointer ${activeCareTab === 'notes'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Nursing Notes</span>
                </button>

                <button
                  type="button"
                  id="tab-btn-handover"
                  onClick={() => setActiveCareTab('handover')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all duration-150 cursor-pointer ${activeCareTab === 'handover'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  <Clock className="h-4 w-4" />
                  <span>Shift Handover</span>
                </button>

                <button
                  type="button"
                  id="tab-btn-radiology"
                  onClick={() => {
                    setActiveCareTab('radiology');
                    fetchPatientRadiology(selectedAdmission.id);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all duration-150 cursor-pointer ${activeCareTab === 'radiology'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  <Radio className="h-4 w-4" />
                  <span>Radiology</span>
                  {displayedRadiologyOrders.length > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeCareTab === 'radiology' ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                      {displayedRadiologyOrders.length}
                    </span>
                  )}
                </button>
              </div>

              {/* SECTION: MEDICATION ADMINISTRATION RECORD (MAR) WORKFLOW */}
              {activeCareTab === 'mar' && (
                <div className="space-y-6">
                  {/* 0. Top Section Header: MAR with Aligned Date & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:px-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                          <Pill className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">Medication Administration Record (eMAR)</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Active doctor prescriptions, scheduled bedside doses, and administration tracking for {selectedAdmission.patientName}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Date Controls & Refresh */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date(selectedMarDate);
                            d.setDate(d.getDate() - 1);
                            const prevStr = d.toISOString().slice(0, 10);
                            setSelectedMarDate(prevStr);
                            fetchPatientMAR(selectedAdmission.id, prevStr);
                          }}
                          className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors cursor-pointer"
                          title="Previous Day"
                        >
                          ‹ Prev
                        </button>
                        <input
                          type="date"
                          value={selectedMarDate}
                          onChange={(e) => {
                            setSelectedMarDate(e.target.value);
                            fetchPatientMAR(selectedAdmission.id, e.target.value);
                          }}
                          className="bg-transparent px-2 py-1 text-xs font-bold text-slate-800 focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const todayStr = new Date().toISOString().slice(0, 10);
                            setSelectedMarDate(todayStr);
                            fetchPatientMAR(selectedAdmission.id, todayStr);
                          }}
                          className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors cursor-pointer"
                          title="Today"
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date(selectedMarDate);
                            d.setDate(d.getDate() + 1);
                            const nextStr = d.toISOString().slice(0, 10);
                            setSelectedMarDate(nextStr);
                            fetchPatientMAR(selectedAdmission.id, nextStr);
                          }}
                          className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors cursor-pointer"
                          title="Next Day"
                        >
                          Next ›
                        </button>
                      </div>

                      <button
                        type="button"
                        id="btn-refresh-mar"
                        onClick={() => fetchPatientMAR(selectedAdmission.id)}
                        disabled={loadingMar}
                        className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg border border-slate-200 transition-colors cursor-pointer shrink-0"
                        title="Refresh MAR"
                      >
                        <RefreshCw className={`h-4 w-4 ${loadingMar ? 'animate-spin text-purple-600' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Feedback Alerts */}
                  {marSuccessMsg && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 rounded-xl flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{marSuccessMsg}</span>
                    </div>
                  )}
                  {marErrorMsg && (
                    <div className="p-4 bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 rounded-xl flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      <span>{marErrorMsg}</span>
                    </div>
                  )}

                  {/* 1. Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 pt-1">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Prescriptions</span>
                        <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                          {marPrescriptions.filter(p => (p.status || 'active').toLowerCase() === 'active').length}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Doctor authorized orders</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Scheduled Doses</span>
                        <div className="text-xl sm:text-2xl font-black text-blue-700 mt-1">
                          {marScheduledDoses.length}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">For {selectedMarDate}</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Administered</span>
                        <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                          {marScheduledDoses.filter(d => d.status === 'ADMINISTERED').length}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Bedside doses confirmed</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Missed</span>
                        <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
                          {marScheduledDoses.filter(d => d.status === 'MISSED').length}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Unadministered / delayed</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Refused</span>
                        <div className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
                          {marScheduledDoses.filter(d => d.status === 'REFUSED').length}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Patient declined dose</span>
                    </div>
                  </div>

                  {/* 2. Scheduled Doses Bedside Checklist */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-600" />
                          Scheduled Doses Checklist ({selectedMarDate})
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Bedside administration tasks for active prescription regimens.
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        {marScheduledDoses.filter(d => d.status === 'SCHEDULED').length} pending due
                      </span>
                    </div>

                    {loadingMar ? (
                      <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 text-purple-600 animate-spin" />
                        <span>Loading scheduled medication doses...</span>
                      </div>
                    ) : marScheduledDoses.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                          <Pill className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-slate-700">No scheduled medication doses for this date</p>
                        <p className="text-[11px] text-slate-400 mt-1">Select another date or check active doctor prescription orders below.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {marScheduledDoses.map((dose) => {
                          const isScheduled = dose.status === 'SCHEDULED';
                          const isAdministered = dose.status === 'ADMINISTERED';
                          const isMissed = dose.status === 'MISSED';
                          const isRefused = dose.status === 'REFUSED';

                          return (
                            <div
                              key={dose.slotId}
                              className={`p-4 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${isScheduled ? 'bg-white hover:bg-slate-50/60' : 'bg-slate-50/30'
                                }`}
                            >
                              <div className="flex items-start sm:items-center gap-3">
                                {/* Time Pill */}
                                <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold shrink-0 text-center ${isScheduled ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                                    isAdministered ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                                      isMissed ? 'bg-rose-100 text-rose-900 border border-rose-200' :
                                        'bg-purple-100 text-purple-900 border border-purple-200'
                                  }`}>
                                  {dose.scheduledTime}
                                </div>

                                {/* Medication Details */}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-sm text-slate-900">{dose.medicationName}</span>
                                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-slate-100 text-slate-700">
                                      Dose: {dose.prescribedDose}
                                    </span>
                                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-purple-50 text-purple-700">
                                      Route: {dose.route}
                                    </span>
                                    <span className="px-2 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-100 rounded">
                                      {dose.frequency}
                                    </span>
                                  </div>

                                  {dose.instructions && (
                                    <p className="text-xs text-slate-600 font-medium">
                                      <strong className="text-slate-700">Instructions:</strong> {dose.instructions}
                                    </p>
                                  )}

                                  {/* Recorded Audit Details */}
                                  {!isScheduled && (
                                    <div className="text-[11px] text-slate-600 flex items-center gap-2 pt-0.5 flex-wrap">
                                      <span className="font-semibold text-slate-700">
                                        Recorded by: {dose.nurseName || 'Assigned Nurse'}
                                      </span>
                                      {dose.administeredAt && (
                                        <span>• Time: {new Date(dose.administeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      )}
                                      {dose.administeredDose && (
                                        <span>• Dose Given: <strong>{dose.administeredDose}</strong></span>
                                      )}
                                      {dose.reason && (
                                        <span className="text-rose-700 font-semibold">• Clinical Reason: &quot;{dose.reason}&quot;</span>
                                      )}
                                      {dose.notes && (
                                        <span className="text-slate-500 italic">• Notes: &quot;{dose.notes}&quot;</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Status Badge & Actions */}
                              <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
                                {isScheduled ? (
                                  <>
                                    <button
                                      type="button"
                                      id={`btn-administer-${dose.slotId}`}
                                      onClick={() => setMarAdminModal({
                                        isOpen: true,
                                        doseSlot: dose,
                                        status: 'ADMINISTERED',
                                        administeredAt: getLocalIsoDateTime(),
                                        doseGiven: dose.prescribedDose,
                                        route: dose.route,
                                        reasonPreset: '',
                                        reasonText: '',
                                        notes: '',
                                        isSubmitting: false,
                                        error: ''
                                      })}
                                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Administer</span>
                                    </button>

                                    <button
                                      type="button"
                                      id={`btn-missed-${dose.slotId}`}
                                      onClick={() => setMarAdminModal({
                                        isOpen: true,
                                        doseSlot: dose,
                                        status: 'MISSED',
                                        administeredAt: getLocalIsoDateTime(),
                                        doseGiven: '',
                                        route: dose.route,
                                        reasonPreset: 'Patient Asleep / Unreachable',
                                        reasonText: '',
                                        notes: '',
                                        isSubmitting: false,
                                        error: ''
                                      })}
                                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                                    >
                                      Missed
                                    </button>

                                    <button
                                      type="button"
                                      id={`btn-refused-${dose.slotId}`}
                                      onClick={() => setMarAdminModal({
                                        isOpen: true,
                                        doseSlot: dose,
                                        status: 'REFUSED',
                                        administeredAt: getLocalIsoDateTime(),
                                        doseGiven: '',
                                        route: dose.route,
                                        reasonPreset: 'Patient Declined / Reluctant',
                                        reasonText: '',
                                        notes: '',
                                        isSubmitting: false,
                                        error: ''
                                      })}
                                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
                                    >
                                      Refused
                                    </button>
                                  </>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${isAdministered ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                        isMissed ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                          'bg-purple-100 text-purple-800 border border-purple-200'
                                      }`}>
                                      {isAdministered && <CheckCircle2 className="w-3.5 h-3.5" />}
                                      {isMissed && <AlertTriangle className="w-3.5 h-3.5" />}
                                      {isRefused && <Ban className="w-3.5 h-3.5" />}
                                      <span>{dose.status}</span>
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-semibold italic">Recorded</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 3. Active Doctor Prescriptions Regimen Details */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          Active Doctor Inpatient Prescriptions
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Prescription regimens ordered by attending physicians. Doses are read-only for nursing staff.
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {marPrescriptions.length} Orders
                      </span>
                    </div>

                    {marPrescriptions.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500">
                        No prescription orders found on file for this admission.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100/90 border-b border-slate-300">
                            <tr className="font-bold uppercase tracking-wider text-[11px] text-slate-900">
                              <th className="px-4 py-3.5 text-slate-900 font-bold">Medication</th>
                              <th className="px-4 py-3.5 text-slate-900 font-bold">Dose & Route</th>
                              <th className="px-4 py-3.5 text-slate-900 font-bold">Frequency & Schedule</th>
                              <th className="px-4 py-3.5 text-slate-900 font-bold">Doctor Instructions</th>
                              <th className="px-4 py-3.5 text-slate-900 font-bold">Prescribing Physician</th>
                              <th className="px-4 py-3.5 text-right text-slate-900 font-bold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {marPrescriptions.map((pres) => (
                              <tr key={pres.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-3 font-bold text-slate-900">
                                  {pres.medication_name || pres.medicationName}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="font-semibold text-slate-800">{pres.dosage || pres.dose}</span>
                                  <span className="text-slate-500 font-normal"> ({pres.route})</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded mr-1.5">
                                    {pres.frequency}
                                  </span>
                                  <span className="text-slate-600 font-mono text-[11px]">
                                    {Array.isArray(pres.schedule || pres.schedule_times)
                                      ? (pres.schedule || pres.schedule_times).join(', ')
                                      : 'Standard timings'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-600 max-w-xs">
                                  {pres.instructions || 'Follow standard precautions'}
                                </td>
                                <td className="px-4 py-3 text-slate-700 font-medium">
                                  {pres.doctor_name || pres.doctorName || 'Attending Physician'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {pres.status === 'discontinued' ? (
                                    <div className="flex flex-col items-end gap-1">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase border border-slate-200">
                                        Discontinued
                                      </span>
                                      {pres.discontinuation_reason && (
                                        <span className="text-[10px] text-slate-500 italic max-w-xs truncate" title={pres.discontinuation_reason}>
                                          &quot;{pres.discontinuation_reason}&quot;
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                                      {pres.status || 'Active'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* 4. Complete Administration History Log (Bedside Audit) */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 text-blue-600" />
                          Medication Administration History (eMAR Audit Log)
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Chronological record of all medication administrations, missed doses, and refusals.
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        {marRecords.length} records logged
                      </span>
                    </div>

                    {marRecords.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 italic">
                        No medication administrations logged yet for this admission.
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
                              <th className="px-4 py-3.5 text-slate-900 font-bold">Administering Nurse</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {marRecords.map((rec) => (
                              <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                                  {new Date(rec.administered_at || rec.administeredAt || rec.created_at).toLocaleString([], {
                                    month: 'short',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </td>
                                <td className="px-4 py-3 font-bold text-slate-900">
                                  {rec.medication_name || rec.medicationName}
                                </td>
                                <td className="px-4 py-3 font-semibold text-slate-800">
                                  {rec.administered_dose || rec.prescribed_dose || '—'}
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  {rec.route || 'Oral'}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${rec.status === 'ADMINISTERED' ? 'bg-emerald-100 text-emerald-800' :
                                      rec.status === 'MISSED' ? 'bg-rose-100 text-rose-800' :
                                        'bg-purple-100 text-purple-800'
                                    }`}>
                                    {rec.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-600 max-w-xs">
                                  {rec.reason && (
                                    <span className="font-semibold text-rose-700 block text-[11px]">
                                      Reason: &quot;{rec.reason}&quot;
                                    </span>
                                  )}
                                  {rec.notes && (
                                    <span className="text-slate-500 italic block text-[11px]">
                                      {rec.notes}
                                    </span>
                                  )}
                                  {!rec.reason && !rec.notes && <span className="text-slate-400">—</span>}
                                </td>
                                <td className="px-4 py-3 text-slate-700 font-medium">
                                  {rec.nurse_name || rec.nurseName || 'Staff Nurse'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 1: VITALS OBSERVATIONS WORKFLOW */}
              {activeCareTab === 'vitals' && (
                <div className="space-y-6">
                  {/* 0. Top Section Header: Vitals & Observations with Aligned Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:px-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <HeartPulse className="h-5 w-5 text-blue-600" />
                        <h3 className="text-base font-bold text-slate-900">Vitals & Observations</h3>
                        {latestVital && (
                          <span className="text-[11px] font-medium text-slate-500 hidden md:inline-block">
                            • Last recorded {new Date(latestVital.recorded_at || latestVital.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Physiological monitoring trajectory, latest clinical observations, and vital trends
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('observation-schedule-card');
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                        title="View Observation Schedule & Timing"
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Observation Schedule</span>
                        {vitalsSchedule?.frequency && vitalsSchedule.frequency !== 'none' && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                            {formatScheduleFrequencyLabel(vitalsSchedule)}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        id="btn-top-record-vitals"
                        onClick={handleScrollToRecordVitals}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors cursor-pointer"
                        title="Scroll to Record Vital Signs form"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Record Vitals</span>
                      </button>
                    </div>
                  </div>

                  {/* 1. Latest Recorded Vitals Summary */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Latest Vitals Summary</h4>
                      </div>
                      {latestVital && (
                        <span className="text-[11px] text-slate-500">
                          Recorded by <strong className="text-slate-700 font-semibold">{resolveStaffName(latestVital)}</strong> at {new Date(latestVital.recorded_at || latestVital.recordedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    {evaluatedLatest ? (
                      <div className="space-y-3.5">
                        {/* Row of 8 Decorated Metric Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
                          {/* 1. Blood Pressure */}
                          {(() => {
                            const evalData = evaluatedLatest.evaluations?.blood_pressure;
                            const evalStatus = evalData?.status;
                            const bpStr = formatBpValue(evaluatedLatest.values);
                            const hasVal = Boolean(bpStr);
                            const isCrit = evalStatus === STATUS.CRITICAL || Boolean(evalData?.is_critical);
                            const isAbn = evalStatus === STATUS.HIGH || evalStatus === STATUS.LOW || Boolean(evalData?.is_abnormal);

                            return (
                              <div className={`p-3.5 rounded-2xl flex flex-col justify-between transition-all ${getCardContainerClass(hasVal, isCrit, isAbn)}`}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconContainerClass(hasVal, isCrit, isAbn, 'bg-blue-50 text-blue-600 border border-blue-100/80')}`}>
                                    <Activity className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                                    Blood Pressure
                                  </span>
                                </div>
                                <div className="mt-3">
                                  {hasVal ? (
                                    <div className="flex items-baseline gap-1 flex-wrap">
                                      <span className={`text-base tracking-tight ${getValueTextClass(isCrit, isAbn)}`}>
                                        {bpStr}
                                      </span>
                                      <span className="text-[10px] font-medium text-slate-400 font-sans">
                                        mmHg
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-base font-bold text-slate-300 block">—</span>
                                  )}
                                </div>
                                <div className="mt-2.5 min-h-[20px] flex items-center">
                                  {getStatusBadge(evalStatus) || (!hasVal ? <span className="text-[10px] text-slate-400 italic">Unrecorded</span> : null)}
                                </div>
                              </div>
                            );
                          })()}

                          {/* 2. Pulse Rate */}
                          {(() => {
                            const evalData = evaluatedLatest.evaluations?.pulse;
                            const evalStatus = evalData?.status;
                            const hasVal = evaluatedLatest.values?.pulse !== null && evaluatedLatest.values?.pulse !== undefined && evaluatedLatest.values?.pulse !== '';
                            const isCrit = evalStatus === STATUS.CRITICAL || Boolean(evalData?.is_critical);
                            const isAbn = evalStatus === STATUS.HIGH || evalStatus === STATUS.LOW || Boolean(evalData?.is_abnormal);

                            return (
                              <div className={`p-3.5 rounded-2xl flex flex-col justify-between transition-all ${getCardContainerClass(hasVal, isCrit, isAbn)}`}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconContainerClass(hasVal, isCrit, isAbn, 'bg-pink-50 text-pink-600 border border-pink-100/80')}`}>
                                    <Heart className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                                    Pulse Rate
                                  </span>
                                </div>
                                <div className="mt-3">
                                  {hasVal ? (
                                    <div className="flex items-baseline gap-1 flex-wrap">
                                      <span className={`text-base tracking-tight ${getValueTextClass(isCrit, isAbn)}`}>
                                        {evaluatedLatest.values.pulse}
                                      </span>
                                      <span className="text-[10px] font-medium text-slate-400 font-sans">
                                        bpm
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-base font-bold text-slate-300 block">—</span>
                                  )}
                                </div>
                                <div className="mt-2.5 min-h-[20px] flex items-center">
                                  {getStatusBadge(evalStatus) || (!hasVal ? <span className="text-[10px] text-slate-400 italic">Unrecorded</span> : null)}
                                </div>
                              </div>
                            );
                          })()}

                          {/* 3. Temperature */}
                          {(() => {
                            const evalData = evaluatedLatest.evaluations?.temperature;
                            const evalStatus = evalData?.status;
                            const hasVal = evaluatedLatest.values?.temperature !== null && evaluatedLatest.values?.temperature !== undefined && evaluatedLatest.values?.temperature !== '';
                            const isCrit = evalStatus === STATUS.CRITICAL || Boolean(evalData?.is_critical);
                            const isAbn = evalStatus === STATUS.HIGH || evalStatus === STATUS.LOW || Boolean(evalData?.is_abnormal);

                            return (
                              <div className={`p-3.5 rounded-2xl flex flex-col justify-between transition-all ${getCardContainerClass(hasVal, isCrit, isAbn)}`}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconContainerClass(hasVal, isCrit, isAbn, 'bg-amber-50 text-amber-600 border border-amber-100/80')}`}>
                                    <Thermometer className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                                    Temperature
                                  </span>
                                </div>
                                <div className="mt-3">
                                  {hasVal ? (
                                    <div className="flex items-baseline gap-1 flex-wrap">
                                      <span className={`text-base tracking-tight ${getValueTextClass(isCrit, isAbn)}`}>
                                        {evaluatedLatest.values.temperature}
                                      </span>
                                      <span className="text-[10px] font-medium text-slate-400 font-sans">
                                        °{evaluatedLatest.values.temperature_unit || 'C'}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-base font-bold text-slate-300 block">—</span>
                                  )}
                                </div>
                                <div className="mt-2.5 min-h-[20px] flex items-center">
                                  {getStatusBadge(evalStatus) || (!hasVal ? <span className="text-[10px] text-slate-400 italic">Unrecorded</span> : null)}
                                </div>
                              </div>
                            );
                          })()}

                          {/* 4. Respiratory Rate */}
                          {(() => {
                            const evalData = evaluatedLatest.evaluations?.respiratory_rate;
                            const evalStatus = evalData?.status;
                            const hasVal = evaluatedLatest.values?.respiratory_rate !== null && evaluatedLatest.values?.respiratory_rate !== undefined && evaluatedLatest.values?.respiratory_rate !== '';
                            const isCrit = evalStatus === STATUS.CRITICAL || Boolean(evalData?.is_critical);
                            const isAbn = evalStatus === STATUS.HIGH || evalStatus === STATUS.LOW || Boolean(evalData?.is_abnormal);

                            return (
                              <div className={`p-3.5 rounded-2xl flex flex-col justify-between transition-all ${getCardContainerClass(hasVal, isCrit, isAbn)}`}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconContainerClass(hasVal, isCrit, isAbn, 'bg-teal-50 text-teal-600 border border-teal-100/80')}`}>
                                    <Wind className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                                    Resp Rate
                                  </span>
                                </div>
                                <div className="mt-3">
                                  {hasVal ? (
                                    <div className="flex items-baseline gap-1 flex-wrap">
                                      <span className={`text-base tracking-tight ${getValueTextClass(isCrit, isAbn)}`}>
                                        {evaluatedLatest.values.respiratory_rate}
                                      </span>
                                      <span className="text-[10px] font-medium text-slate-400 font-sans">
                                        /min
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-base font-bold text-slate-300 block">—</span>
                                  )}
                                </div>
                                <div className="mt-2.5 min-h-[20px] flex items-center">
                                  {getStatusBadge(evalStatus) || (!hasVal ? <span className="text-[10px] text-slate-400 italic">Unrecorded</span> : null)}
                                </div>
                              </div>
                            );
                          })()}

                          {/* 5. SpO2 */}
                          {(() => {
                            const evalData = evaluatedLatest.evaluations?.spo2;
                            const evalStatus = evalData?.status;
                            const hasVal = evaluatedLatest.values?.spo2 !== null && evaluatedLatest.values?.spo2 !== undefined && evaluatedLatest.values?.spo2 !== '';
                            const isCrit = evalStatus === STATUS.CRITICAL || Boolean(evalData?.is_critical);
                            const isAbn = evalStatus === STATUS.HIGH || evalStatus === STATUS.LOW || Boolean(evalData?.is_abnormal);

                            return (
                              <div className={`p-3.5 rounded-2xl flex flex-col justify-between transition-all ${getCardContainerClass(hasVal, isCrit, isAbn)}`}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconContainerClass(hasVal, isCrit, isAbn, 'bg-cyan-50 text-cyan-600 border border-cyan-100/80')}`}>
                                    <Activity className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                                    SpO2
                                  </span>
                                </div>
                                <div className="mt-3">
                                  {hasVal ? (
                                    <div className="flex items-baseline gap-1 flex-wrap">
                                      <span className={`text-base tracking-tight ${getValueTextClass(isCrit, isAbn)}`}>
                                        {evaluatedLatest.values.spo2}
                                      </span>
                                      <span className="text-[10px] font-medium text-slate-400 font-sans">
                                        %
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-base font-bold text-slate-300 block">—</span>
                                  )}
                                </div>
                                <div className="mt-2.5 min-h-[20px] flex items-center">
                                  {getStatusBadge(evalStatus) || (!hasVal ? <span className="text-[10px] text-slate-400 italic">Unrecorded</span> : null)}
                                </div>
                              </div>
                            );
                          })()}

                          {/* 6. Blood Glucose */}
                          {(() => {
                            const evalData = evaluatedLatest.evaluations?.blood_glucose;
                            const evalStatus = evalData?.status;
                            const hasVal = evaluatedLatest.values?.blood_glucose !== null && evaluatedLatest.values?.blood_glucose !== undefined && evaluatedLatest.values?.blood_glucose !== '';
                            const isCrit = evalStatus === STATUS.CRITICAL || Boolean(evalData?.is_critical);
                            const isAbn = evalStatus === STATUS.HIGH || evalStatus === STATUS.LOW || Boolean(evalData?.is_abnormal);

                            return (
                              <div className={`p-3.5 rounded-2xl flex flex-col justify-between transition-all ${getCardContainerClass(hasVal, isCrit, isAbn)}`}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconContainerClass(hasVal, isCrit, isAbn, 'bg-indigo-50 text-indigo-600 border border-indigo-100/80')}`}>
                                    <Droplets className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                                    Glucose
                                  </span>
                                </div>
                                <div className="mt-3">
                                  {hasVal ? (
                                    <div className="flex items-baseline gap-1 flex-wrap">
                                      <span className={`text-base tracking-tight ${getValueTextClass(isCrit, isAbn)}`}>
                                        {evaluatedLatest.values.blood_glucose}
                                      </span>
                                      <span className="text-[10px] font-medium text-slate-400 font-sans">
                                        mg/dL
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-base font-bold text-slate-300 block">—</span>
                                  )}
                                </div>
                                <div className="mt-2.5 min-h-[20px] flex items-center">
                                  {getStatusBadge(evalStatus) || (!hasVal ? <span className="text-[10px] text-slate-400 italic">Unrecorded</span> : null)}
                                </div>
                              </div>
                            );
                          })()}

                          {/* 7. Pain Score */}
                          {(() => {
                            const evalData = evaluatedLatest.evaluations?.pain_score;
                            const evalStatus = evalData?.status;
                            const hasVal = evaluatedLatest.values?.pain_score !== null && evaluatedLatest.values?.pain_score !== undefined && evaluatedLatest.values?.pain_score !== '';
                            const isCrit = evalStatus === STATUS.CRITICAL || Boolean(evalData?.is_critical);
                            const isAbn = evalStatus === STATUS.HIGH || evalStatus === STATUS.LOW || Boolean(evalData?.is_abnormal);

                            return (
                              <div className={`p-3.5 rounded-2xl flex flex-col justify-between transition-all ${getCardContainerClass(hasVal, isCrit, isAbn)}`}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconContainerClass(hasVal, isCrit, isAbn, 'bg-purple-50 text-purple-600 border border-purple-100/80')}`}>
                                    <Smile className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                                    Pain Score
                                  </span>
                                </div>
                                <div className="mt-3">
                                  {hasVal ? (
                                    <div className="flex items-baseline gap-1 flex-wrap">
                                      <span className={`text-base tracking-tight ${getValueTextClass(isCrit, isAbn)}`}>
                                        {evaluatedLatest.values.pain_score}
                                      </span>
                                      <span className="text-[10px] font-medium text-slate-400 font-sans">
                                        / 10
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-base font-bold text-slate-300 block">—</span>
                                  )}
                                </div>
                                <div className="mt-2.5 min-h-[20px] flex items-center">
                                  {getStatusBadge(evalStatus) || (!hasVal ? <span className="text-[10px] text-slate-400 italic">Unrecorded</span> : null)}
                                </div>
                              </div>
                            );
                          })()}

                          {/* 8. Weight */}
                          {(() => {
                            const evalData = evaluatedLatest.evaluations?.weight;
                            const evalStatus = evalData?.status;
                            const hasVal = evaluatedLatest.values?.weight !== null && evaluatedLatest.values?.weight !== undefined && evaluatedLatest.values?.weight !== '';
                            const isCrit = evalStatus === STATUS.CRITICAL || Boolean(evalData?.is_critical);
                            const isAbn = evalStatus === STATUS.HIGH || evalStatus === STATUS.LOW || Boolean(evalData?.is_abnormal);

                            return (
                              <div className={`p-3.5 rounded-2xl flex flex-col justify-between transition-all ${getCardContainerClass(hasVal, isCrit, isAbn)}`}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconContainerClass(hasVal, isCrit, isAbn, 'bg-slate-100 text-slate-700 border border-slate-200')}`}>
                                    <Scale className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                                    Weight
                                  </span>
                                </div>
                                <div className="mt-3">
                                  {hasVal ? (
                                    <div className="flex items-baseline gap-1 flex-wrap">
                                      <span className={`text-base tracking-tight ${getValueTextClass(isCrit, isAbn)}`}>
                                        {evaluatedLatest.values.weight}
                                      </span>
                                      <span className="text-[10px] font-medium text-slate-400 font-sans">
                                        kg
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-base font-bold text-slate-300 block">—</span>
                                  )}
                                </div>
                                <div className="mt-2.5 min-h-[20px] flex items-center">
                                  {getStatusBadge(evalStatus) || (!hasVal ? <span className="text-[10px] text-slate-400 italic">Unrecorded</span> : null)}
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Single subtle message when clinical reference ranges are unconfigured */}
                        {hasUnconfiguredReferences && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2">
                            <Info className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                            <span>Clinical reference ranges are not configured for this patient or clinic.</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No bedside vitals recorded yet for this admission. Use the Record Vital Signs form below to enter initial measurements.</p>
                    )}
                  </div>

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

                  {/* 2. Vitals Trend Analysis */}

                  <VitalsTrendChart
                    vitalsHistory={nurseVitals}
                    admissionId={selectedAdmission?.id}
                  />

                  {/* 4. Observation Schedule & Timing */}
                  <div id="observation-schedule-card">
                    <VitalsScheduleCard
                      admissionId={selectedAdmission?.id}
                      clinicId={nurseData?.clinicId || nurseData?.clinic_id}
                      scheduleData={vitalsSchedule}
                      onScheduleUpdated={(updated) => setVitalsSchedule(updated)}
                      canConfigure={true}
                    />
                  </div>

                  {/* 5. Recent Observations Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Recent Observations</h3>
                        <p className="text-[11px] text-slate-500">Chronological bedside observation history for this admission (newest first)</p>
                      </div>
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                        {nurseVitals.length} {nurseVitals.length === 1 ? 'Record' : 'Records'}
                      </span>
                    </div>

                    {loadingVitals ? (
                      <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                        Loading recent observations...
                      </div>
                    ) : nurseVitals.length === 0 ? (
                      <div className="p-10 text-center text-slate-400">
                        <Activity className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-xs font-semibold text-slate-600">No vitals observations recorded yet</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Use the Record Vital Signs form below to enter initial bedside measurements.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                            <tr>
                              <th className="py-2.5 px-3 whitespace-nowrap">Date & Time</th>
                              <th className="py-2.5 px-3 whitespace-nowrap">Blood Pressure</th>
                              <th className="py-2.5 px-3 whitespace-nowrap">Temp</th>
                              <th className="py-2.5 px-3 whitespace-nowrap">Pulse</th>
                              <th className="py-2.5 px-3 whitespace-nowrap">Resp Rate</th>
                              <th className="py-2.5 px-3 whitespace-nowrap">SpO2</th>
                              <th className="py-2.5 px-3 whitespace-nowrap">Glucose</th>
                              <th className="py-2.5 px-3 whitespace-nowrap">Weight</th>
                              <th className="py-2.5 px-3 whitespace-nowrap">Recorded By</th>
                              <th className="py-2.5 px-3 text-right whitespace-nowrap">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {nurseVitals.map((item) => {
                              const vals = item.values || {};
                              const evals = item.evaluation || (evaluateVitals(vals, activePatientContext) || {});
                              const isCritical = Boolean(item.has_critical || evals.is_critical);
                              const isAbnormal = Boolean(item.has_abnormal || evals.is_abnormal || isCritical);

                              const bpEval = evals.blood_pressure;
                              const isBpAbnormal = bpEval && (bpEval.status === STATUS.HIGH || bpEval.status === STATUS.LOW || bpEval.status === STATUS.CRITICAL);
                              const isBpCritical = bpEval && bpEval.status === STATUS.CRITICAL;

                              const tempEval = evals.temperature;
                              const isTempAbnormal = tempEval && (tempEval.status === STATUS.HIGH || tempEval.status === STATUS.LOW || tempEval.status === STATUS.CRITICAL);
                              const isTempCritical = tempEval && tempEval.status === STATUS.CRITICAL;

                              const pulseEval = evals.pulse;
                              const isPulseAbnormal = pulseEval && (pulseEval.status === STATUS.HIGH || pulseEval.status === STATUS.LOW || pulseEval.status === STATUS.CRITICAL);
                              const isPulseCritical = pulseEval && pulseEval.status === STATUS.CRITICAL;

                              const rrEval = evals.respiratory_rate;
                              const isRrAbnormal = rrEval && (rrEval.status === STATUS.HIGH || rrEval.status === STATUS.LOW || rrEval.status === STATUS.CRITICAL);
                              const isRrCritical = rrEval && rrEval.status === STATUS.CRITICAL;

                              const spo2Eval = evals.spo2;
                              const isSpo2Abnormal = spo2Eval && (spo2Eval.status === STATUS.HIGH || spo2Eval.status === STATUS.LOW || spo2Eval.status === STATUS.CRITICAL);
                              const isSpo2Critical = spo2Eval && spo2Eval.status === STATUS.CRITICAL;

                              const glucoseEval = evals.blood_glucose;
                              const isGlucoseAbnormal = glucoseEval && (glucoseEval.status === STATUS.HIGH || glucoseEval.status === STATUS.LOW || glucoseEval.status === STATUS.CRITICAL);
                              const isGlucoseCritical = glucoseEval && glucoseEval.status === STATUS.CRITICAL;

                              const weightEval = evals.weight;
                              const isWeightAbnormal = weightEval && (weightEval.status === STATUS.HIGH || weightEval.status === STATUS.LOW || weightEval.status === STATUS.CRITICAL);

                              const bpStr = formatBpValue(vals);

                              return (
                                <tr
                                  key={item.id}
                                  className={`transition-colors ${isCritical ? 'bg-rose-50/30 hover:bg-rose-50/50' : isAbnormal ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-slate-50/80'
                                    }`}
                                >
                                  <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-800">
                                    {new Date(item.recorded_at || item.recordedAt).toLocaleString([], {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                                    {bpStr ? (
                                      <span className={isBpCritical ? 'font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200' : isBpAbnormal ? 'font-semibold text-amber-800 bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-200/60' : 'font-semibold text-slate-800'}>
                                        {bpStr} <span className="text-[10px] text-slate-400 font-normal">mmHg</span>
                                      </span>
                                    ) : (
                                      <span className="text-slate-300">—</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                                    {vals.temperature !== null && vals.temperature !== undefined ? (
                                      <span className={isTempCritical ? 'font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200' : isTempAbnormal ? 'font-semibold text-amber-800 bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-200/60' : ''}>
                                        {vals.temperature} °{vals.temperature_unit || 'C'}
                                      </span>
                                    ) : (
                                      <span className="text-slate-300">—</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                                    {vals.pulse !== null && vals.pulse !== undefined ? (
                                      <span className={isPulseCritical ? 'font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200' : isPulseAbnormal ? 'font-semibold text-amber-800 bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-200/60' : ''}>
                                        {vals.pulse} <span className="text-[10px] text-slate-400 font-normal">bpm</span>
                                      </span>
                                    ) : (
                                      <span className="text-slate-300">—</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                                    {vals.respiratory_rate !== null && vals.respiratory_rate !== undefined ? (
                                      <span className={isRrCritical ? 'font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200' : isRrAbnormal ? 'font-semibold text-amber-800 bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-200/60' : ''}>
                                        {vals.respiratory_rate} <span className="text-[10px] text-slate-400 font-normal">/min</span>
                                      </span>
                                    ) : (
                                      <span className="text-slate-300">—</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                                    {vals.spo2 !== null && vals.spo2 !== undefined ? (
                                      <span className={isSpo2Critical ? 'font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200' : isSpo2Abnormal ? 'font-semibold text-amber-800 bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-200/60' : ''}>
                                        {vals.spo2}%
                                      </span>
                                    ) : (
                                      <span className="text-slate-300">—</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                                    {vals.blood_glucose !== null && vals.blood_glucose !== undefined ? (
                                      <span className={isGlucoseCritical ? 'font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200' : isGlucoseAbnormal ? 'font-semibold text-amber-800 bg-amber-50/80 px-1 py-0.5 rounded border border-amber-200/60' : ''}>
                                        {vals.blood_glucose} <span className="text-[10px] text-slate-400 font-normal">mg/dL</span>
                                        {vals.glucose_context && (
                                          <span className="text-[10px] text-slate-400 block font-normal capitalize">
                                            {vals.glucose_context.replace('_', ' ')}
                                          </span>
                                        )}
                                      </span>
                                    ) : (
                                      <span className="text-slate-300">—</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                                    {vals.weight !== null && vals.weight !== undefined ? (
                                      <span className={isWeightAbnormal ? 'font-semibold text-amber-800 bg-amber-50/80 px-1 py-0.5 rounded border border-amber-200/60' : ''}>
                                        {vals.weight} <span className="text-[10px] text-slate-400 font-normal">kg</span>
                                      </span>
                                    ) : (
                                      <span className="text-slate-300">—</span>
                                    )}
                                  </td>
                                  <td
                                    className="py-2.5 px-3 whitespace-nowrap text-slate-600"
                                    title={item.id ? `Record ID: ${item.id}` : undefined}
                                    data-record-id={item.id || undefined}
                                  >
                                    <div className="font-medium text-slate-700">{resolveStaffName(item)}</div>
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap text-right">
                                    {isCritical ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white shadow-2xs">
                                        <AlertTriangle className="h-3 w-3" />
                                        Critical
                                      </span>
                                    ) : isAbnormal ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                        <AlertCircle className="h-3 w-3" />
                                        Abnormal
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                        Recorded
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

                  {/* 6. Record Vital Signs Form (Positioned at Bottom for Easy Access) */}
                  <div id="record-vitals-form" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Record Vital Signs</h3>
                        <p className="text-[11px] text-slate-500">Record bedside observations (leave unmeasured fields blank)</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 font-semibold">
                        <HeartPulse className="h-3.5 w-3.5" />
                        <span>Bedside Entry</span>
                      </div>
                    </div>

                    <form onSubmit={handleSaveVitals} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Pulse & Resp Rate
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              min="20"
                              max="300"
                              placeholder="Pulse (bpm)"
                              value={vitalsForm.pulse}
                              onChange={(e) => setVitalsForm({ ...vitalsForm, pulse: e.target.value })}
                              className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                            />
                            <input
                              type="number"
                              min="2"
                              max="100"
                              placeholder="Resp (/min)"
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
                              className="w-20 text-xs border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-slate-50 font-bold"
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

                        {/* Pain Score */}
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

                        {/* Weight */}
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

                        {/* Submit Action */}
                        <div className="flex items-end">
                          <button
                            type="submit"
                            disabled={isSubmittingVitals}
                            className="w-full py-2.5 px-4 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition shadow-xs"
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
                        </div>
                      </div>
                    </form>
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
                              className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${ioForm.direction === 'intake'
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
                              className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${ioForm.direction === 'output'
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

                        {/* Recorded Date / Time (Defaults to local current time, editable) */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-slate-700">
                              Recorded Date/Time
                            </label>
                            <button
                              type="button"
                              onClick={() => setIoForm(prev => ({ ...prev, recorded_at: getLocalIsoDateTime() }))}
                              className="text-[10px] text-cyan-700 hover:text-cyan-900 font-semibold cursor-pointer"
                            >
                              Set to Current Time
                            </button>
                          </div>
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
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow-sm transition-all ${isSubmittingIo || !ioForm.amount
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
                                className={`p-3.5 rounded-xl border transition-all ${isVoided
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
                                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${isVoided
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
                                    <div className={`text-base font-black font-mono ${isVoided
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
                    <ModalPortal isOpen={Boolean(voidingEntry)} onClose={() => setVoidingEntry(null)}>
                      <div 
                        onClick={() => setVoidingEntry(null)}
                        className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
                      >
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 max-h-[92vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200"
                        >
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
                              className={`px-4 py-1.5 text-xs font-bold text-white rounded-xl transition-all ${!voidReasonText.trim() || isVoidingSubmitting
                                  ? 'bg-slate-300 cursor-not-allowed'
                                  : 'bg-rose-600 hover:bg-rose-700 shadow-xs'
                                }`}
                            >
                              {isVoidingSubmitting ? 'Voiding...' : 'Confirm Void'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </ModalPortal>
                  )}
                </div>
              )}

              {/* SECTION 2: NURSING CARE NOTES WORKSPACE */}
              {activeCareTab === 'notes' && (
                <div className="space-y-6">
                  {/* Header Title Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Nursing Care Notes
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Document bedside clinical assessments, care interventions, and patient condition
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Bedside Care
                      </span>
                    </div>
                  </div>

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
                    {/* Form: Record Nursing Note */}
                    <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Record Nursing Note</h4>
                          <p className="text-[11px] text-slate-500">Document bedside clinical care and patient condition</p>
                        </div>
                        <FileText className="h-4 w-4 text-blue-500" />
                      </div>

                      <form onSubmit={handleSaveNursingNote} className="space-y-3.5">
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

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Nursing Observations & Assessment
                          </label>
                          <textarea
                            rows={3}
                            value={noteForm.observations}
                            onChange={(e) => setNoteForm({ ...noteForm, observations: e.target.value })}
                            placeholder="Bedside observations, patient symptoms, mental status, pain scale, tolerance..."
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
                            placeholder="Nursing interventions performed (hygiene, wound dressing, catheter care, repositioning)..."
                            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Clinical Follow-up & Additional Notes
                          </label>
                          <textarea
                            rows={2}
                            value={noteForm.handoverNotes}
                            onChange={(e) => setNoteForm({ ...noteForm, handoverNotes: e.target.value })}
                            placeholder="Clinical follow-up, pending doctor orders, precautions..."
                            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingNote}
                          className="w-full py-2 px-4 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition shadow-xs"
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
                    <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Nursing Care Notes History</h4>
                          <p className="text-[11px] text-slate-500">Chronological history for this admission (newest first)</p>
                        </div>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                          {nursingNotes.filter(n => (n.note_type || n.noteType) !== 'Shift Handover').length} Notes
                        </span>
                      </div>

                      {loadingNotes ? (
                        <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                          Loading care notes...
                        </div>
                      ) : nursingNotes.filter(n => (n.note_type || n.noteType) !== 'Shift Handover').length === 0 ? (
                        <div className="p-10 text-center text-slate-400">
                          <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                          <p className="text-xs font-semibold text-slate-600">No nursing care notes recorded yet</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Use the form on the left to record the first bedside nursing care note.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                          {nursingNotes
                            .filter(n => (n.note_type || n.noteType) !== 'Shift Handover')
                            .map((note) => {
                              const condition = note.patient_condition || note.patientCondition;

                              return (
                                <div
                                  key={note.id}
                                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-slate-50/50 space-y-2"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                        Nursing Note
                                      </span>
                                      {condition && (
                                        <span
                                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${condition === 'Critical'
                                              ? 'bg-rose-100 text-rose-700'
                                              : condition === 'Guarded'
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-emerald-100 text-emerald-700'
                                            }`}
                                        >
                                          Condition: {condition}
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
                                        <p className="text-slate-600 whitespace-pre-line pl-1.5 border-l-2 border-blue-200">
                                          {note.nursing_observations}
                                        </p>
                                      </div>
                                    )}

                                    {note.interventions && (
                                      <div>
                                        <span className="font-semibold text-slate-800 text-[11px] block">Care Provided:</span>
                                        <p className="text-slate-600 whitespace-pre-line pl-1.5 border-l-2 border-emerald-200">
                                          {note.interventions}
                                        </p>
                                      </div>
                                    )}

                                    {note.handover_notes && (
                                      <div>
                                        <span className="font-semibold text-slate-800 text-[11px] block">Follow-up:</span>
                                        <p className="text-slate-600 whitespace-pre-line pl-1.5 border-l-2 border-slate-300">
                                          {note.handover_notes}
                                        </p>
                                      </div>
                                    )}

                                    {!note.nursing_observations && !note.interventions && !note.handover_notes && (
                                      <p className="text-slate-600 whitespace-pre-line">{note.note || note.notes}</p>
                                    )}
                                  </div>

                                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                                    <span>Author: <strong className="text-slate-600 font-medium">{note.nurse_name || note.author_name || 'Nurse'}</strong></span>
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

              {/* SECTION 3: SHIFT HANDOVER WORKSPACE */}
              {activeCareTab === 'handover' && (
                <div className="space-y-6">
                  {/* Header Title Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-purple-600" />
                        Shift Handover
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Prepare clinical handover report, summarize patient status, and transfer pending care items to incoming shift
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        Shift Transition
                      </span>
                    </div>
                  </div>

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
                    {/* Form: Record Shift Handover */}
                    <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Document Shift Handover</h4>
                          <p className="text-[11px] text-slate-500">Prepare transition summary for incoming nurse</p>
                        </div>
                        <Clock className="h-4 w-4 text-purple-500" />
                      </div>

                      {/* Quick reuse action from active shift notes */}
                      {nursingNotes.filter(n => (n.note_type || n.noteType) !== 'Shift Handover').length > 0 && (
                        <div className="p-2.5 bg-purple-50/70 border border-purple-200/80 rounded-xl flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-purple-600 flex-shrink-0" />
                            <span className="text-[11px] text-purple-900 font-medium">
                              {nursingNotes.filter(n => (n.note_type || n.noteType) !== 'Shift Handover').length} recent care note(s) available
                            </span>
                          </div>
                          <button
                            type="button"
                            id="btn-reuse-care-notes"
                            onClick={handleReuseCareNotes}
                            className="px-2.5 py-1 bg-white hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <Copy className="h-3 w-3" />
                            <span>Import Shift Notes</span>
                          </button>
                        </div>
                      )}

                      <form onSubmit={handleSaveNursingNote} className="space-y-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Condition at Handover</label>
                          <select
                            value={noteForm.patientCondition}
                            onChange={(e) => setNoteForm({ ...noteForm, patientCondition: e.target.value })}
                            className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          >
                            <option value="Stable">Stable</option>
                            <option value="Improving">Improving</option>
                            <option value="Guarded">Guarded</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Shift Observations & Status Summary
                          </label>
                          <textarea
                            rows={3}
                            value={noteForm.observations}
                            onChange={(e) => setNoteForm({ ...noteForm, observations: e.target.value })}
                            placeholder="Summary of patient status during shift, clinical progression, mental status, IV line status..."
                            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Interventions Completed During Shift
                          </label>
                          <textarea
                            rows={3}
                            value={noteForm.interventions}
                            onChange={(e) => setNoteForm({ ...noteForm, interventions: e.target.value })}
                            placeholder="Care provided during shift (wound care, lines flushed, position changes, tests completed)..."
                            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-purple-900 mb-1 flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-purple-600" />
                            Pending Care Items & Incoming Instructions
                          </label>
                          <textarea
                            rows={3}
                            value={noteForm.handoverNotes}
                            onChange={(e) => setNoteForm({ ...noteForm, handoverNotes: e.target.value })}
                            placeholder="Pending items for next nurse: upcoming lab draws, doctor review needed, fluid changes, precautions..."
                            className="w-full text-xs border border-purple-200 bg-purple-50/20 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingNote}
                          className="w-full py-2 px-4 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition shadow-xs"
                        >
                          {isSubmittingNote ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              Submitting Handover...
                            </>
                          ) : (
                            <>
                              <Send className="h-3.5 w-3.5" />
                              Submit Shift Handover
                            </>
                          )}
                        </button>
                      </form>
                    </div>

                    {/* History: Chronological Shift Handover List */}
                    <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Shift Handover History</h4>
                          <p className="text-[11px] text-slate-500">Transition reports and handover notes for this admission</p>
                        </div>
                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                          {nursingNotes.filter(n => (n.note_type || n.noteType) === 'Shift Handover').length} Handovers
                        </span>
                      </div>

                      {loadingNotes ? (
                        <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin text-purple-600" />
                          Loading handover reports...
                        </div>
                      ) : nursingNotes.filter(n => (n.note_type || n.noteType) === 'Shift Handover').length === 0 ? (
                        <div className="p-10 text-center text-slate-400">
                          <Clock className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                          <p className="text-xs font-semibold text-slate-600">No shift handovers documented yet</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Use the form on the left to prepare the shift transition report for the incoming nurse.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                          {nursingNotes
                            .filter(n => (n.note_type || n.noteType) === 'Shift Handover')
                            .map((note) => {
                              const condition = note.patient_condition || note.patientCondition;

                              return (
                                <div
                                  key={note.id}
                                  className="p-3.5 rounded-xl border border-purple-100 hover:border-purple-200 transition-colors bg-purple-50/20 space-y-2.5"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                        Shift Handover
                                      </span>
                                      {condition && (
                                        <span
                                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${condition === 'Critical'
                                              ? 'bg-rose-100 text-rose-700'
                                              : condition === 'Guarded'
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-emerald-100 text-emerald-700'
                                            }`}
                                        >
                                          Condition: {condition}
                                        </span>
                                      )}
                                    </div>

                                    <div className="text-right">
                                      <span className="text-[11px] text-slate-500 block">
                                        {new Date(note.recorded_at || note.created_at).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-xs text-slate-700 space-y-2 pt-1">
                                    {note.nursing_observations && (
                                      <div>
                                        <span className="font-semibold text-slate-800 text-[11px] block">Shift Summary & Observations:</span>
                                        <p className="text-slate-600 whitespace-pre-line pl-1.5 border-l-2 border-purple-300">
                                          {note.nursing_observations}
                                        </p>
                                      </div>
                                    )}

                                    {note.interventions && (
                                      <div>
                                        <span className="font-semibold text-slate-800 text-[11px] block">Interventions Completed:</span>
                                        <p className="text-slate-600 whitespace-pre-line pl-1.5 border-l-2 border-emerald-300">
                                          {note.interventions}
                                        </p>
                                      </div>
                                    )}

                                    {note.handover_notes && (
                                      <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200">
                                        <span className="font-bold text-amber-900 text-[11px] flex items-center gap-1.5 mb-1">
                                          <AlertTriangle className="h-3 w-3 text-amber-700" />
                                          Pending Items for Incoming Shift:
                                        </span>
                                        <p className="text-amber-950 whitespace-pre-line font-medium text-xs">
                                          {note.handover_notes}
                                        </p>
                                      </div>
                                    )}

                                    {!note.nursing_observations && !note.interventions && !note.handover_notes && (
                                      <p className="text-slate-600 whitespace-pre-line">{note.note || note.notes}</p>
                                    )}
                                  </div>

                                  <div className="pt-2 border-t border-purple-100 flex items-center justify-between text-[11px] text-slate-400">
                                    <span>Outgoing Nurse: <strong className="text-slate-600 font-medium">{note.nurse_name || note.author_name || 'Nurse'}</strong></span>
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

              {/* SECTION: RADIOLOGY & DIAGNOSTIC IMAGING REPORTS (READ-ONLY NURSE CHART) */}
              {activeCareTab === 'radiology' && (
                <div className="space-y-6">
                  {/* Header Title Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Radio className="h-5 w-5 text-sky-600" />
                          Radiology & Diagnostic Imaging Reports
                        </h3>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                          {displayedRadiologyOrders.length} {displayedRadiologyOrders.length === 1 ? 'Investigation' : 'Investigations'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        View physician imaging orders, transport mode, and finalized diagnostic reports for {selectedAdmission?.patientName || 'assigned patient'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                        Nurse: Read-Only Access
                      </span>
                      <button
                        type="button"
                        onClick={() => fetchPatientRadiology(selectedAdmission?.id)}
                        disabled={loadingRadiologyOrders}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Refresh Radiology Orders"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${loadingRadiologyOrders ? 'animate-spin text-sky-600' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                      </button>
                    </div>
                  </div>


                  {radiologyErrorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      <span>{radiologyErrorMsg}</span>
                    </div>
                  )}

                  {/* Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <div className="text-[11px] font-medium text-slate-500">Ordered Investigations</div>
                      <div className="text-lg font-bold text-slate-900 mt-1">{displayedRadiologyOrders.length}</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <div className="text-[11px] font-medium text-slate-500">In Suite / Scanning</div>
                      <div className="text-lg font-bold text-amber-600 mt-1">
                        {displayedRadiologyOrders.filter(o => o.status === 'IN_PROGRESS' || o.status === 'ORDERED').length}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <div className="text-[11px] font-medium text-slate-500">Reports Signed & Available</div>
                      <div className="text-lg font-bold text-emerald-600 mt-1">
                        {displayedRadiologyOrders.filter(o => o.status === 'COMPLETED').length}
                      </div>
                    </div>
                  </div>

                  {/* Orders List / Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    {loadingRadiologyOrders ? (
                      <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-sky-600" />
                        <span>Loading radiology investigations & signed reports...</span>
                      </div>
                    ) : displayedRadiologyOrders.length === 0 ? (
                      <div className="p-12 text-center text-slate-400">
                        <Radio className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                        <p className="text-xs font-semibold text-slate-600">No radiology investigations ordered</p>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                          There are currently no X-Ray, Ultrasound, CT Scan, or MRI orders recorded for this patient's admission.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
                            <tr>
                              <th className="py-3 px-4 font-bold">Order # & Date</th>
                              <th className="py-3 px-4 font-bold">Modality & Study</th>
                              <th className="py-3 px-4 font-bold">Priority</th>
                              <th className="py-3 px-4 font-bold">Transport Mode</th>
                              <th className="py-3 px-4 font-bold">Clinical Indication</th>
                              <th className="py-3 px-4 font-bold">Doctor</th>
                              <th className="py-3 px-4 font-bold">Status</th>
                              <th className="py-3 px-4 font-bold text-right">Diagnostic Report</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {displayedRadiologyOrders.map((order) => {
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
                                    <span className="font-mono font-semibold text-slate-800 block">
                                      {order.order_number || order.id?.slice(0, 8)}
                                    </span>
                                    <span className="text-[11px] text-slate-400 block mt-0.5">
                                      {new Date(order.created_at).toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-sky-700 font-medium block mt-0.5">
                                      Facility: {order.lab_name || order.destination_lab?.name || 'Diagnostic Center'}
                                    </span>
                                  </td>

                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${typeBadge}`}>
                                        {type}
                                      </span>
                                      <span className="font-semibold text-slate-900">{order.study_name}</span>
                                    </div>
                                    {order.instructions && (
                                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">
                                        Prep / Transport: {order.instructions}
                                      </p>
                                    )}
                                  </td>

                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide ${priorityBadge}`}>
                                      {order.priority || 'routine'}
                                    </span>
                                  </td>

                                  <td className="py-3 px-4 whitespace-nowrap capitalize text-slate-600">
                                    {order.transport_mode ? order.transport_mode.replace('_', ' ') : 'Ambulatory'}
                                  </td>

                                  <td className="py-3 px-4 max-w-xs">
                                    <span className="text-slate-700 line-clamp-2">{order.clinical_indication}</span>
                                  </td>

                                  <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                                    {order.doctor_name || 'Dr. Physician'}
                                  </td>

                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border ${statusBadge}`}>
                                      {status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                                      {status === 'IN_PROGRESS' && <Clock className="w-3 h-3 text-amber-600 animate-spin" />}
                                      {status}
                                    </span>
                                  </td>

                                  <td className="py-3 px-4 text-right whitespace-nowrap">
                                    {hasReport ? (
                                      <button
                                        type="button"
                                        onClick={() => setViewingRadiologyReport(order)}
                                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>View Report</span>
                                      </button>
                                    ) : (
                                      <span className="text-[11px] text-slate-400 italic">
                                        {status === 'IN_PROGRESS' ? 'Scanning In Progress' : 'Awaiting Report'}
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

                  {/* NURSE MODAL: VIEW RADIOLOGY REPORT */}
                  {viewingRadiologyReport && (
                    <ModalPortal isOpen={Boolean(viewingRadiologyReport)} onClose={() => setViewingRadiologyReport(null)}>
                      <div 
                        onClick={() => setViewingRadiologyReport(null)}
                        className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
                      >
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
                        >
                          {/* Header */}
                          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                <FileCheck2 className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-base font-bold text-slate-900">
                                    {viewingRadiologyReport.study_name}
                                  </h3>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                                    {viewingRadiologyReport.investigation_type}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 font-mono">
                                  Order #{viewingRadiologyReport.order_number || viewingRadiologyReport.id?.slice(0, 8)} • Requisition: {new Date(viewingRadiologyReport.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setViewingRadiologyReport(null)}
                              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Report Content */}
                          <div className="p-6 space-y-5 overflow-y-auto flex-1">
                            {/* Physician and Context */}
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-slate-400 block text-[11px]">Ordering Doctor:</span>
                                <span className="font-semibold text-slate-800">{viewingRadiologyReport.doctor_name || 'Attending Physician'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[11px]">Priority / Transport:</span>
                                <span className="font-semibold text-slate-800 uppercase">{viewingRadiologyReport.priority}</span>
                                <span className="text-slate-500 capitalize"> ({viewingRadiologyReport.transport_mode || 'Ambulatory'})</span>
                              </div>
                              <div className="sm:col-span-2">
                                <span className="text-slate-400 block text-[11px]">Clinical Indication:</span>
                                <span className="text-slate-800 font-medium">{viewingRadiologyReport.clinical_indication}</span>
                              </div>
                            </div>

                            {viewingRadiologyReport.report ? (
                              <div className="space-y-4">
                                {/* Signed Signoff Banner */}
                                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <div>
                                      <h4 className="text-xs font-bold text-emerald-900">Signed Diagnostic Radiology Report</h4>
                                      <p className="text-[11px] text-emerald-700">
                                        Issued by <strong className="font-semibold">{viewingRadiologyReport.report.uploaded_by?.name || 'Diagnostic Specialist'}</strong>
                                        {viewingRadiologyReport.report.finalized_at && ` on ${new Date(viewingRadiologyReport.report.finalized_at).toLocaleString()}`}
                                      </p>
                                    </div>
                                  </div>

                                  {viewingRadiologyReport.report.critical_findings && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                      Critical Finding
                                    </span>
                                  )}
                                </div>

                                {/* Findings */}
                                <div>
                                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <span className="w-1.5 h-3.5 bg-sky-600 rounded-full inline-block"></span>
                                    Findings
                                  </h4>
                                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                                    {viewingRadiologyReport.report.findings}
                                  </div>
                                </div>

                                {/* Diagnostic Impression */}
                                <div>
                                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <span className="w-1.5 h-3.5 bg-emerald-600 rounded-full inline-block"></span>
                                    Impression
                                  </h4>
                                  <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200 text-xs text-emerald-950 font-medium leading-relaxed whitespace-pre-wrap">
                                    {viewingRadiologyReport.report.impression}
                                  </div>
                                </div>

                                {/* Recommendations */}
                                {viewingRadiologyReport.report.recommendations && (
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                                      Clinical Recommendations
                                    </h4>
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                                      {viewingRadiologyReport.report.recommendations}
                                    </div>
                                  </div>
                                )}

                                {/* Attached Scan / Document Link */}
                                {viewingRadiologyReport.report.file_url && (
                                  <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/50 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                      <FileText className="w-5 h-5 text-sky-600 shrink-0" />
                                      <div>
                                        <div className="text-xs font-bold text-slate-900">
                                          {viewingRadiologyReport.report.file_name || 'Radiology_Report.pdf'}
                                        </div>
                                        <div className="text-[11px] text-slate-500">
                                          {viewingRadiologyReport.report.file_size
                                            ? `${Math.round(viewingRadiologyReport.report.file_size / 1024)} KB`
                                            : 'Attached Digital Imaging File'}
                                        </div>
                                      </div>
                                    </div>

                                    <a
                                      href={viewingRadiologyReport.report.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                      <span>View Imaging Scan</span>
                                    </a>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                                <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2 animate-pulse" />
                                <h4 className="text-xs font-bold text-slate-800">Imaging Report Pending</h4>
                                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                                  The diagnostic imaging study is in progress. The finalized report and scan attachment will be displayed here once issued by radiology staff.
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="p-4 px-6 border-t border-slate-100 flex justify-end shrink-0 bg-slate-50/50">
                            <button
                              type="button"
                              onClick={() => setViewingRadiologyReport(null)}
                              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
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
            </div>
          )}

          {/* BED ACTION CONFIRMATION MODAL */}
          {bedActionModal.isOpen && bedActionModal.bed && (
            <ModalPortal isOpen={Boolean(bedActionModal.isOpen)} onClose={() => setBedActionModal(prev => ({ ...prev, isOpen: false }))}>
              <div 
                onClick={() => setBedActionModal(prev => ({ ...prev, isOpen: false }))}
                className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
              >
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 p-6 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <BedDouble className="w-5 h-5 text-blue-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Confirm Bed Status Transition
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBedActionModal(prev => ({ ...prev, isOpen: false }))}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {bedActionModal.error && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{bedActionModal.error}</span>
                    </div>
                  )}

                  <form onSubmit={handleConfirmBedAction} className="space-y-4 text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Bed Number:</span>
                        <span className="font-bold text-slate-900">Bed {bedActionModal.bed.bed_number}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Room:</span>
                        <span className="font-medium text-slate-800">Room {bedActionModal.bed.roomNumber || '—'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Current Status:</span>
                        <span className="font-bold text-slate-800 uppercase">{bedActionModal.bed.status}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <span className="text-slate-700 font-semibold">Target Status:</span>
                        <span className="font-black text-blue-600 uppercase text-sm">{bedActionModal.targetStatus}</span>
                      </div>
                    </div>

                    {bedActionModal.actionType === 'clean' ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          Confirm that Bed {bedActionModal.bed.bed_number} has been thoroughly cleaned and sanitized in accordance with hospital hygiene protocols. The bed will immediately become AVAILABLE for new patient allocation.
                        </span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500">
                        This action will update the bed status and record an entry in the hospital audit trail.
                      </p>
                    )}

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Reason / Clinical Note
                      </label>
                      <input
                        type="text"
                        value={bedActionModal.reason}
                        onChange={(e) => setBedActionModal(prev => ({ ...prev, reason: e.target.value }))}
                        required
                        placeholder="Enter verification notes or turnaround details..."
                        className="w-full border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setBedActionModal(prev => ({ ...prev, isOpen: false }))}
                        disabled={bedActionModal.isSubmitting}
                        className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={bedActionModal.isSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {bedActionModal.isSubmitting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <span>Confirm Transition</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </ModalPortal>
          )}

          {/* ==================== TRANSFER EXECUTION MODAL ==================== */}
          {transferExecutionModal.isOpen && transferExecutionModal.transfer && (
            <ModalPortal
              isOpen={Boolean(transferExecutionModal.isOpen)}
              onClose={() => setTransferExecutionModal(prev => ({ ...prev, isOpen: false }))}
            >
              <div 
                onClick={() => setTransferExecutionModal(prev => ({ ...prev, isOpen: false }))}
                className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
              >
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto my-auto animate-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                        <ArrowRightLeft className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 leading-tight">Execute Inpatient Transfer</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Confirm physical patient movement & bed re-assignment
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTransferExecutionModal(prev => ({ ...prev, isOpen: false }))}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleExecuteTransfer} className="mt-5 space-y-4">
                    {/* Movement Route Summary */}
                    <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Vacating Bed (Source)</span>
                        <p className="font-semibold text-slate-800 mt-0.5">
                          {selectedAdmission?.wardName || wardName} • Bed {selectedAdmission?.bedNumber}
                        </p>
                        <span className="text-[10px] text-amber-700 font-medium block mt-0.5">→ Moves to CLEANING</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Receiving Bed (Destination)</span>
                        <p className="font-semibold text-slate-800 mt-0.5">
                          {transferExecutionModal.transfer.destinationWardName} • Bed {transferExecutionModal.transfer.destinationBedNumber}
                        </p>
                        <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">→ Moves to OCCUPIED</span>
                      </div>
                    </div>

                    {/* Doctor Order & Clinical Context */}
                    <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/70 text-xs text-amber-900 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-amber-800 font-medium">Initiating Doctor:</span>
                        <span className="font-bold">{transferExecutionModal.transfer.initiatingDoctorName || 'Doctor'}</span>
                      </div>
                      {transferExecutionModal.transfer.reason && (
                        <div className="flex justify-between">
                          <span className="text-amber-800 font-medium">Doctor Reason:</span>
                          <span className="italic">{transferExecutionModal.transfer.reason}</span>
                        </div>
                      )}
                    </div>

                    {/* Physical Movement Notes */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Physical Transport & Handover Notes
                      </label>
                      <textarea
                        rows={3}
                        id="nurse-movement-notes-input"
                        value={transferExecutionModal.movementNotes}
                        onChange={(e) => setTransferExecutionModal(prev => ({ ...prev, movementNotes: e.target.value }))}
                        placeholder="Document transport mode (wheelchair, stretcher), patient status during movement, and handover to receiving nurse..."
                        className="w-full text-xs p-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-amber-500 font-medium"
                      />
                    </div>

                    {transferExecutionModal.error && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-800 rounded-lg flex items-center gap-2 font-medium">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{transferExecutionModal.error}</span>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setTransferExecutionModal(prev => ({ ...prev, isOpen: false }))}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        id="submit-nurse-execute-transfer-btn"
                        disabled={transferExecutionModal.isSubmitting}
                        className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {transferExecutionModal.isSubmitting ? 'Recording Movement...' : 'Confirm Movement & Complete'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </ModalPortal>
          )}
          {/* RECORD MEDICATION ADMINISTRATION MODAL (MAR) */}
          {marAdminModal.isOpen && marAdminModal.doseSlot && (
            <ModalPortal isOpen={Boolean(marAdminModal.isOpen)} onClose={() => setMarAdminModal(prev => ({ ...prev, isOpen: false }))}>
              <div 
                onClick={() => setMarAdminModal(prev => ({ ...prev, isOpen: false }))}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
              >
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                >
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-purple-50/50">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-purple-100 text-purple-700 rounded-lg shrink-0">
                        <Pill className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Record Medication Administration</h3>
                        <p className="text-xs text-slate-500">
                          Bedside eMAR confirmation for <strong>{selectedAdmission?.patientName}</strong> • Bed {selectedAdmission?.bedNumber}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMarAdminModal(prev => ({ ...prev, isOpen: false }))}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleRecordMAR} className="p-6 space-y-4">
                    {/* Prescription Summary Card (Read-Only) */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 text-sm">{marAdminModal.doseSlot.medicationName}</span>
                        <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-mono font-bold text-[11px]">
                          Slot: {marAdminModal.doseSlot.scheduledTime}
                        </span>
                      </div>
                      <div className="flex gap-4 text-slate-600">
                        <span>Prescribed Dose: <strong className="text-slate-800">{marAdminModal.doseSlot.prescribedDose}</strong></span>
                        <span>Route: <strong className="text-slate-800">{marAdminModal.doseSlot.route}</strong></span>
                        <span>Frequency: <strong className="text-slate-800">{marAdminModal.doseSlot.frequency}</strong></span>
                      </div>
                      {marAdminModal.doseSlot.instructions && (
                        <p className="text-slate-500 italic pt-1 border-t border-slate-200/60">
                          Doctor Instructions: &quot;{marAdminModal.doseSlot.instructions}&quot;
                        </p>
                      )}
                    </div>

                    {/* Status Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Administration Status <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          id="status-btn-administered"
                          onClick={() => setMarAdminModal(prev => ({
                            ...prev,
                            status: 'ADMINISTERED',
                            doseGiven: prev.doseSlot?.prescribedDose || '',
                            error: ''
                          }))}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer ${marAdminModal.status === 'ADMINISTERED'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                          Administered
                        </button>

                        <button
                          type="button"
                          id="status-btn-missed"
                          onClick={() => setMarAdminModal(prev => ({
                            ...prev,
                            status: 'MISSED',
                            reasonPreset: prev.reasonPreset || 'Patient Asleep / Unreachable',
                            error: ''
                          }))}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer ${marAdminModal.status === 'MISSED'
                              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                          Missed Dose
                        </button>

                        <button
                          type="button"
                          id="status-btn-refused"
                          onClick={() => setMarAdminModal(prev => ({
                            ...prev,
                            status: 'REFUSED',
                            reasonPreset: prev.reasonPreset || 'Patient Declined / Reluctant',
                            error: ''
                          }))}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer ${marAdminModal.status === 'REFUSED'
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                          Patient Refusal
                        </button>
                      </div>
                    </div>

                    {/* Actual Administration Date & Time */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Actual Date & Time <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          id="mar-administered-at-input"
                          value={marAdminModal.administeredAt}
                          onChange={(e) => setMarAdminModal(prev => ({ ...prev, administeredAt: e.target.value }))}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white font-medium"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Administered Dose
                        </label>
                        <input
                          type="text"
                          id="mar-dose-given-input"
                          value={marAdminModal.doseGiven}
                          disabled={marAdminModal.status !== 'ADMINISTERED'}
                          onChange={(e) => setMarAdminModal(prev => ({ ...prev, doseGiven: e.target.value }))}
                          placeholder={marAdminModal.status === 'ADMINISTERED' ? 'Dose given' : 'N/A for missed/refusal'}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Mandatory Clinical Reason (For Missed & Refused) */}
                    {(marAdminModal.status === 'MISSED' || marAdminModal.status === 'REFUSED') && (
                      <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
                        <label className="block text-xs font-bold text-rose-900">
                          Mandatory Clinical Reason <span className="text-rose-600">*</span>
                        </label>
                        <select
                          id="mar-reason-preset-select"
                          value={marAdminModal.reasonPreset}
                          onChange={(e) => setMarAdminModal(prev => ({ ...prev, reasonPreset: e.target.value }))}
                          className="w-full text-xs p-2.5 rounded-lg border border-rose-200 bg-white font-medium text-slate-800"
                        >
                          {marAdminModal.status === 'MISSED' ? (
                            <>
                              <option value="Patient Asleep / Unreachable">Patient Asleep / Unreachable</option>
                              <option value="Patient Out of Ward / Diagnostic Scan">Patient Out of Ward / Diagnostic Scan</option>
                              <option value="Patient NPO / Fasting Protocol">Patient NPO / Fasting Protocol</option>
                              <option value="Medication Temporarily Unavailable in Ward">Medication Temporarily Unavailable in Ward</option>
                              <option value="Vital Sign Contraindication">Vital Sign Contraindication</option>
                              <option value="Other Clinical Reason">Other Clinical Reason (Specify Below)</option>
                            </>
                          ) : (
                            <>
                              <option value="Patient Declined / Reluctant">Patient Declined / Reluctant</option>
                              <option value="Patient Reports Nausea / Discomfort">Patient Reports Nausea / Discomfort</option>
                              <option value="Patient Requested Alternate Timing">Patient Requested Alternate Timing</option>
                              <option value="Patient Refused Without Stating Reason">Patient Refused Without Stating Reason</option>
                              <option value="Other Clinical Reason">Other Clinical Reason (Specify Below)</option>
                            </>
                          )}
                        </select>

                        <textarea
                          rows={2}
                          id="mar-reason-text-input"
                          value={marAdminModal.reasonText}
                          onChange={(e) => setMarAdminModal(prev => ({ ...prev, reasonText: e.target.value }))}
                          placeholder="Add specific clinical notes or context for why this dose was not administered..."
                          className="w-full text-xs p-2.5 rounded-lg border border-rose-200 bg-white placeholder-rose-300 font-medium"
                        />
                      </div>
                    )}

                    {/* Optional Clinical Remarks */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Clinical Remarks & Observations (Optional)
                      </label>
                      <textarea
                        rows={2}
                        id="mar-notes-input"
                        value={marAdminModal.notes}
                        onChange={(e) => setMarAdminModal(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Document patient tolerance, bedside reaction, injection site check..."
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white font-medium"
                      />
                    </div>

                    {/* Clinical Audit Policy Notice - Omitted from missed and refused cards */}
                    {marAdminModal.status !== 'MISSED' && marAdminModal.status !== 'REFUSED' && (
                      <div className="p-3 bg-slate-50 border border-slate-200 text-[11px] text-slate-500 rounded-lg">
                        <strong className="text-slate-700">Clinical Audit Policy:</strong> Doses recorded are immutable and permanently attached to the patient&apos;s electronic Medication Administration Record with your nurse ID and timestamp.
                      </div>
                    )}

                    {marAdminModal.error && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-800 rounded-lg flex items-center gap-2 font-medium">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{marAdminModal.error}</span>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setMarAdminModal(prev => ({ ...prev, isOpen: false }))}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        id="submit-mar-record-btn"
                        disabled={marAdminModal.isSubmitting}
                        className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {marAdminModal.isSubmitting ? 'Recording Dose...' : 'Confirm & Record Dose'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </ModalPortal>
          )}
        </main>
      </div>
    </div>
  );
}
