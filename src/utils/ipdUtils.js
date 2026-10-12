/**
 * Inpatient Department (IPD) Utility Functions
 * Consistent helpers for doctor identity matching, doctor name resolution,
 * vital flag computation, admission toast messages, and scoping counts.
 */

export function formatTitleCase(str) {
  if (!str || typeof str !== 'string') return '';
  const trimmed = str.trim();
  if (!trimmed) return '';
  return trimmed
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
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

export function formatAdmissionSuccessToast(apiResponseData) {
  const createdAdmission = apiResponseData?.data?.admission || apiResponseData?.data || apiResponseData?.admission;
  const admNum = createdAdmission?.admission_number || createdAdmission?.admissionNumber ||
    apiResponseData?.data?.admission_number || apiResponseData?.data?.admissionNumber;

  if (admNum && String(admNum).trim() && String(admNum).trim() !== 'IPD') {
    return `Patient admitted successfully (Admission #${String(admNum).trim()})`;
  }
  return 'Patient admitted successfully';
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

export function calculateIpdStats(admissions = [], doctorId = '', statusFilter = 'all') {
  const isAdmActive = (a) => (a.status || '').toLowerCase() === 'admitted';
  const isAdmDischarged = (a) => (a.status || '').toLowerCase() === 'discharged';

  // 1. Active KPI Counts (strictly active inpatients only; discharged records NEVER count as active)
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

  // 3. Tab Badge Counts (dynamically scoped by statusFilter)
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

  return {
    myAdmittedActiveCount,
    consultingActiveCount,
    totalActiveCount,
    myAdmittedTotalCount,
    consultingTotalCount,
    totalRecordsCount,
    getTabCount
  };
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
  // If it is a UUID, check if it matches the current authenticated doctor
  if (currentDoctorId && isDoctorMatch(val, currentDoctorId)) {
    return currentDoctorName && currentDoctorName.toLowerCase() !== 'doctor'
      ? `${currentDoctorName} (You)`
      : 'You';
  }
  const key = val.toLowerCase();
  if (docMap && (docMap[key] || docMap[val])) {
    return docMap[key] || docMap[val];
  }
  // For unresolved historical actors, display "Unknown clinician"
  return 'Unknown clinician';
}

export function cleanAuditReason(rawReason, defaultText = 'Clinical amendment') {
  if (!rawReason) return defaultText;
  let str = String(rawReason).trim();
  // Strip any accidental appended "(by <UUID>...)" from historical data
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


