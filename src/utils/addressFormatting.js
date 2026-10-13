/**
 * Safely formats a patient's address into a clean readable string without literal nulls or undefined.
 *
 * @param {Object} patient - The patient record object
 * @returns {string} - Formatted address string or 'Not provided' fallback
 */
export function formatPatientAddress(patient) {
  if (!patient) return 'Not provided';

  const isValidPart = (part) => {
    if (part === null || part === undefined) return false;
    const str = String(part).trim();
    if (!str) return false;
    const lower = str.toLowerCase();
    return lower !== 'null' && lower !== 'undefined' && lower !== 'n/a' && lower !== 'none';
  };

  const cleanPart = (part) => String(part).trim();

  // 1. Check direct address string (e.g. from registration or direct field)
  const directAddress = patient.address || patient.addressLine1 || patient.address_line1;
  if (directAddress && isValidPart(directAddress)) {
    // If the address contains commas (e.g. "12 road, null, null")
    const parts = String(directAddress)
      .split(',')
      .map(p => cleanPart(p))
      .filter(isValidPart);

    if (parts.length > 0) {
      // Check if city, state, or postalCode are present as separate fields and not already in parts
      const extraComponents = [
        patient.city,
        patient.state,
        patient.postalCode || patient.postal_code || patient.zipCode || patient.zip_code
      ]
        .filter(isValidPart)
        .map(cleanPart)
        .filter(comp => !parts.some(p => p.toLowerCase() === comp.toLowerCase()));

      return [...parts, ...extraComponents].join(', ');
    }
  }

  // 2. Build from discrete address components
  const components = [
    patient.addressLine1 || patient.address_line1,
    patient.addressLine2 || patient.address_line2,
    patient.city,
    patient.state,
    patient.postalCode || patient.postal_code || patient.zipCode || patient.zip_code
  ]
    .filter(isValidPart)
    .map(cleanPart);

  if (components.length > 0) {
    return components.join(', ');
  }

  return 'Not provided';
}
