/**
 * Utility to reliably extract patient identity and demographic information from lab reports, orders, and specimens.
 * Guarantees that:
 * 1. Correct patient name, MRN/patient code, gender, and contact phone are retrieved.
 * 2. UUIDs are NEVER displayed as visible patient IDs or MRNs. If an MRN/code is unavailable, returns 'N/A'.
 * 3. Keeps Report History and Patient Reports consistent for the same report.
 */

export function extractPatientDetails(report) {
  if (!report) {
    return {
      name: 'N/A',
      mrn: 'N/A',
      gender: 'N/A',
      ageDisplay: 'N/A',
      dob: null,
      phone: null
    };
  }

  const p = report.report_data?.patient || report.patient || {};
  const order = report.report_data?.order || report.order || {};
  const orderPatient = order.patient || {};

  // 1. Patient Full Name
  let name = report.patient_name || report.patientName;
  if (!name && (p.first_name || p.last_name)) {
    name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
  }
  if (!name && (orderPatient.first_name || orderPatient.last_name)) {
    name = `${orderPatient.first_name || ''} ${orderPatient.last_name || ''}`.trim();
  }
  if (!name && p.name) {
    name = p.name;
  }
  if (!name && orderPatient.name) {
    name = orderPatient.name;
  }
  if (!name) {
    name = 'N/A';
  }

  // 2. MRN / Patient Code (Requirement: NEVER display UUID as visible ID/MRN)
  let mrn =
    report.patient_code ||
    report.patientCode ||
    p.patient_code ||
    p.patientCode ||
    p.mrn ||
    orderPatient.patient_code ||
    orderPatient.patientCode ||
    orderPatient.mrn;

  // If the candidate MRN looks like a UUID (36 chars with hex and hyphens), do NOT treat it as MRN
  if (mrn && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(mrn).trim())) {
    mrn = null;
  }
  if (!mrn || String(mrn).trim() === '') {
    mrn = 'N/A';
  }

  // 3. Gender
  const rawGender = p.gender || orderPatient.gender || report.patient?.gender;
  let gender = 'N/A';
  if (rawGender && rawGender !== 'N/A') {
    gender = rawGender.charAt(0).toUpperCase() + rawGender.slice(1).toLowerCase();
  }

  // 4. Phone Number
  const phone =
    p.phone_number ||
    p.phoneNumber ||
    p.phone ||
    orderPatient.phone_number ||
    orderPatient.phone ||
    report.patient?.phone_number ||
    null;

  // 5. Date of Birth and Age Calculation
  const dob = p.date_of_birth || p.dateOfBirth || p.dob || orderPatient.date_of_birth || orderPatient.dob || null;
  let ageDisplay = 'N/A';
  if (p.age && p.age !== 'N/A') {
    ageDisplay = typeof p.age === 'number' ? `${p.age} yrs` : (String(p.age).includes('yr') ? p.age : `${p.age} yrs`);
  } else if (orderPatient.age && orderPatient.age !== 'N/A') {
    ageDisplay = typeof orderPatient.age === 'number' ? `${orderPatient.age} yrs` : `${orderPatient.age} yrs`;
  } else if (dob) {
    try {
      const birthDate = new Date(dob);
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        let years = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          years--;
        }
        if (years >= 0 && years < 130) {
          ageDisplay = `${years} yrs`;
        } else {
          ageDisplay = dob;
        }
      } else {
        ageDisplay = dob;
      }
    } catch (e) {
      ageDisplay = dob;
    }
  }

  return {
    name,
    mrn,
    gender,
    phone,
    dob,
    ageDisplay
  };
}
