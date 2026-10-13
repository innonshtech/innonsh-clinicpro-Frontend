export const PHONE_REGEX = /^[0-9]{10}$/;

/**
 * Validates whether a phone number is exactly 10 numeric digits (0-9).
 * Returns null if valid (or empty when optional), or an error string if invalid.
 */
export const validatePhoneNumber = (phone, isRequired = false, fieldName = 'Phone number') => {
  if (phone === null || phone === undefined || String(phone).trim() === '') {
    return isRequired ? `${fieldName} is required` : null;
  }

  const strVal = String(phone).trim();

  // Reject if contains non-digits (+, -, spaces, letters, etc.)
  if (/\D/.test(strVal)) {
    return `${fieldName} must contain digits only (no country code +, -, or spaces)`;
  }

  // Reject if length is not exactly 10
  if (strVal.length !== 10) {
    return `${fieldName} must be exactly 10 numeric digits`;
  }

  return null;
};

/**
 * Checks if a string is a valid 10-digit phone number.
 */
export const isValidPhoneNumber = (phone) => {
  if (!phone) return false;
  return PHONE_REGEX.test(String(phone).trim());
};

/**
 * KeyDown listener to block non-numeric keystrokes during active typing.
 * Permits navigation keys (Backspace, Delete, Tab, Arrow keys, Enter) and Ctrl/Cmd shortcuts.
 */
export const handlePhoneKeyDown = (e) => {
  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter'];
  
  if (e.ctrlKey || e.metaKey || allowedKeys.includes(e.key)) return;
  
  if (!/^[0-9]$/.test(e.key)) {
    e.preventDefault();
  }
};

export const EMAIL_REGEX = /^(?!.*\.\.)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
export const GMAIL_REGEX = /^(?!.*\.\.)[a-zA-Z0-9._%+-]+@gmail\.com$/i;

/**
 * Checks if a string is a valid email address.
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
};

/**
 * Checks if a string is a valid Gmail address.
 */
export const isValidGmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return GMAIL_REGEX.test(email.trim());
};

/**
 * Validates an email address against EMAIL_REGEX and checks for incomplete domain typos.
 * Returns null if valid (or empty when optional), or an error string if invalid.
 */
export const validateEmail = (email, isRequired = false, fieldName = 'Email address') => {
  const strVal = email !== null && email !== undefined ? String(email).trim() : '';
  if (!strVal) {
    return isRequired ? `${fieldName} is required` : null;
  }

  if (!EMAIL_REGEX.test(strVal)) {
    return 'Please enter a valid email address';
  }

  const parts = strVal.split('@');
  if (parts.length === 2) {
    const domain = parts[1].toLowerCase();
    // Reject common incomplete domain typos like @gmail.co, @yahoo.co, etc. without proper country code
    if (/^(gmail|yahoo|hotmail|outlook|icloud)\.co$/i.test(domain)) {
      return 'Please enter a valid email address';
    }

    // Reject common domain typos for popular providers (e.g. gmil.com, gmai.com, gamil.com, etc.)
    if (/^(gmil|gamil|gmial|gmaill|gmai|gmal|gmall|gmaik|gmaii|gmeil|gml|gnail|gnal)(\.|$)/i.test(domain)) {
      return 'Please enter a valid email address';
    }
    if (/^(yaho|yahooo|yahu|yhoo)(\.|$)/i.test(domain)) {
      return 'Please enter a valid email address';
    }
    if (/^(hotmial|hotmaill|hotmaik|outlok|outloo)(\.|$)/i.test(domain)) {
      return 'Please enter a valid email address';
    }
    if (/^(iclud|icluod|icld)(\.|$)/i.test(domain)) {
      return 'Please enter a valid email address';
    }
    if (/^(gmail|yahoo|hotmail|outlook|icloud)\.(con|cm|cpm|om|comm|coom|cmo)$/i.test(domain)) {
      return 'Please enter a valid email address';
    }
  }

  return null;
};

/**
 * Validates whether a postal code is exactly 6 numeric digits (0-9).
 * Returns null if valid (or empty when optional), or an error string if invalid.
 */
export const validatePostalCode = (postalCode, isRequired = true, fieldName = 'Postal code') => {
  const strVal = postalCode !== null && postalCode !== undefined ? String(postalCode).trim() : '';
  if (!strVal) {
    return isRequired ? `${fieldName} is required` : null;
  }

  if (/\D/.test(strVal)) {
    return `${fieldName} must contain digits only`;
  }

  if (strVal.length !== 6) {
    return `${fieldName} must be exactly 6 numeric digits`;
  }

  return null;
};

/**
 * KeyDown listener to block non-numeric keystrokes for postal code.
 */
export const handlePostalCodeKeyDown = (e) => {
  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter'];
  if (e.ctrlKey || e.metaKey || allowedKeys.includes(e.key)) return;
  if (!/^[0-9]$/.test(e.key)) {
    e.preventDefault();
  }
};

/**
 * Validates a Doctor form email address against GMAIL_REGEX.
 * Returns null if valid (or empty when optional), or an error string if invalid.
 */
export const validateDoctorEmail = (email, isRequired = true, fieldName = 'Email address') => {
  const strVal = email !== null && email !== undefined ? String(email).trim() : '';
  if (!strVal) {
    return isRequired ? `${fieldName} is required` : null;
  }

  if (!GMAIL_REGEX.test(strVal)) {
    return 'Please enter a valid Gmail address';
  }

  return null;
};

