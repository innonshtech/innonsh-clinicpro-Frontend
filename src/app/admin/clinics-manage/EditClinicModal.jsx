'use client';

import { useState, useRef, useEffect } from 'react';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import {
  validatePhoneNumber,
  handlePhoneKeyDown,
  validateEmail,
  validatePostalCode,
  handlePostalCodeKeyDown
} from '@/utils/phoneValidation';
import { formatTitleCase } from '@/utils/nameFormatting';
import {
  Building2,
  X,
  Upload,
  Eye,
  Clock,
  Plus,
  Trash2,
  FileText,
  MapPin,
  Mail,
  Globe,
  AlertCircle,
  ExternalLink,
  Save,
  Check
} from 'lucide-react';

const CLINIC_TYPES = [
  { value: 'general', label: 'General Practice' },
  { value: 'specialty', label: 'Specialty Clinic' },
  { value: 'dental', label: 'Dental Clinic' },
  { value: 'pediatric', label: 'Pediatric Clinic' },
  { value: 'surgical', label: 'Surgical Center' },
  { value: 'diagnostic', label: 'Diagnostic Center' },
  { value: 'multispecialty', label: 'Multispecialty Clinic' }
];

const DEFAULT_SPECIALTIES = [
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'ENT',
  'Gastroenterology',
  'General Medicine',
  'Gynecology',
  'Neurology',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Rheumatology',
  'Surgical',
  'Urology'
];

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

const INITIAL_HOURS = {
  monday: { open: '09:00', close: '18:00', closed: false },
  tuesday: { open: '09:00', close: '18:00', closed: false },
  wednesday: { open: '09:00', close: '18:00', closed: false },
  thursday: { open: '09:00', close: '18:00', closed: false },
  friday: { open: '09:00', close: '18:00', closed: false },
  saturday: { open: '10:00', close: '14:00', closed: false },
  sunday: { open: '', close: '', closed: true }
};

const FIELD_ORDER = [
  'clinicName',
  'clinicType',
  'phone',
  'email',
  'address',
  'city',
  'state',
  'postalCode',
  'country',
  'registrationNumber',
  'taxId',
  'licenseDocumentUrl',
  'gstDocumentUrl',
  'specialties',
  'openingHours'
];

export default function EditClinicModal({ isOpen, onClose, clinic, onClinicUpdated }) {
  if (!isOpen || !clinic) return null;

  // Helper to parse specialties
  const parseSpecialties = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch (_) {
        return raw
          .replace(/^\{|\}$/g, '')
          .split(',')
          .map(s => s.trim().replace(/^"|"$/g, ''))
          .filter(Boolean);
      }
    }
    return [];
  };

  // Helper to parse opening hours
  const parseHours = (raw) => {
    let hours = raw;
    if (typeof hours === 'string') {
      try {
        hours = JSON.parse(hours);
      } catch (_) {
        hours = null;
      }
    }
    const result = { ...INITIAL_HOURS };
    if (hours && typeof hours === 'object') {
      for (const day of DAYS_OF_WEEK) {
        if (hours[day]) {
          const item = hours[day];
          result[day] = {
            open: item.open || '',
            close: item.close || '',
            closed: Boolean(item.closed || (!item.open && !item.close))
          };
        }
      }
    }
    return result;
  };

  const initialSpecialties = parseSpecialties(clinic.specialties);

  const [formData, setFormData] = useState({
    logo: clinic.logo || clinic.logo_url || clinic.logoUrl || '',
    clinicName: clinic.clinic_name || clinic.clinicName || '',
    clinicType: clinic.clinic_type || clinic.clinicType || 'general',
    description: clinic.description || '',
    phone: clinic.phone || clinic.contact_phone || clinic.phone_number || '',
    email: clinic.contact_email || clinic.contactEmail || clinic.email || '',
    website: clinic.website || clinic.web_url || '',
    address: clinic.address || clinic.street_address || '',
    city: clinic.city || '',
    state: clinic.state || clinic.province || '',
    postalCode: clinic.postal_code || clinic.postalCode || clinic.zip_code || clinic.zipCode || '',
    country: clinic.country || 'India',
    registrationNumber: clinic.registration_number || clinic.registrationNumber || '',
    taxId: clinic.tax_id || clinic.taxId || clinic.gst_number || clinic.gstNumber || '',
    licenseDocumentUrl: clinic.license_document_url || clinic.licenseDocumentUrl || clinic.license_document || clinic.licenseDocument || '',
    gstDocumentUrl: clinic.gst_document_url || clinic.gstDocumentUrl || clinic.gst_document || clinic.gstDocument || '',
    specialties: initialSpecialties,
    is24x7: Boolean(clinic.is_24x7 ?? clinic.is24x7),
    openingHours: parseHours(clinic.opening_hours || clinic.openingHours)
  });

  const [customSpecialty, setCustomSpecialty] = useState('');
  const [availableSpecialties, setAvailableSpecialties] = useState(() => {
    const combined = [...DEFAULT_SPECIALTIES];
    initialSpecialties.forEach(spec => {
      if (!combined.some(s => s.toLowerCase() === spec.toLowerCase())) {
        combined.push(spec);
      }
    });
    return combined;
  });

  // File upload state & previews
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(clinic.logo || clinic.logo_url || clinic.logoUrl || null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [licenseName, setLicenseName] = useState('');
  const [licensePreviewUrl, setLicensePreviewUrl] = useState(
    clinic.license_document_url || clinic.licenseDocumentUrl || clinic.license_document || clinic.licenseDocument || ''
  );
  const [gstFile, setGstFile] = useState(null);
  const [gstName, setGstName] = useState('');
  const [gstPreviewUrl, setGstPreviewUrl] = useState(
    clinic.gst_document_url || clinic.gstDocumentUrl || clinic.gst_document || clinic.gstDocument || ''
  );

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (clinic) {
      const specs = parseSpecialties(clinic.specialties);
      setFormData({
        logo: clinic.logo || clinic.logo_url || clinic.logoUrl || '',
        clinicName: clinic.clinic_name || clinic.clinicName || '',
        clinicType: clinic.clinic_type || clinic.clinicType || 'general',
        description: clinic.description || '',
        phone: clinic.phone || clinic.contact_phone || clinic.phone_number || '',
        email: clinic.contact_email || clinic.contactEmail || clinic.email || '',
        website: clinic.website || clinic.web_url || '',
        address: clinic.address || clinic.street_address || '',
        city: clinic.city || '',
        state: clinic.state || clinic.province || '',
        postalCode: clinic.postal_code || clinic.postalCode || clinic.zip_code || clinic.zipCode || '',
        country: clinic.country || 'India',
        registrationNumber: clinic.registration_number || clinic.registrationNumber || '',
        taxId: clinic.tax_id || clinic.taxId || clinic.gst_number || clinic.gstNumber || '',
        licenseDocumentUrl: clinic.license_document_url || clinic.licenseDocumentUrl || clinic.license_document || clinic.licenseDocument || '',
        gstDocumentUrl: clinic.gst_document_url || clinic.gstDocumentUrl || clinic.gst_document || clinic.gstDocument || '',
        specialties: specs,
        is24x7: Boolean(clinic.is_24x7 ?? clinic.is24x7),
        openingHours: parseHours(clinic.opening_hours || clinic.openingHours)
      });
      setLogoFile(null);
      setLogoPreview(clinic.logo || clinic.logo_url || clinic.logoUrl || null);
      setLicenseFile(null);
      setLicenseName('');
      setLicensePreviewUrl(clinic.license_document_url || clinic.licenseDocumentUrl || clinic.license_document || clinic.licenseDocument || '');
      setGstFile(null);
      setGstName('');
      setGstPreviewUrl(clinic.gst_document_url || clinic.gstDocumentUrl || clinic.gst_document || clinic.gstDocument || '');
      setErrors({});
      setGeneralError('');
    }
  }, [clinic]);

  const logoInputRef = useRef(null);
  const licenseInputRef = useRef(null);
  const gstInputRef = useRef(null);
  const formContainerRef = useRef(null);

  const scrollToField = (fieldName) => {
    setTimeout(() => {
      const container = formContainerRef.current;
      if (!container) return;

      const target =
        container.querySelector(`[data-field="${fieldName}"]`) ||
        container.querySelector(`[name="${fieldName}"]`) ||
        container.querySelector(`#${fieldName}`);

      if (!target) return;

      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();

      const relativeTop = targetRect.top - containerRect.top;
      const desiredOffset = containerRect.height * 0.22;
      const targetScrollTop = container.scrollTop + relativeTop - desiredOffset;

      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      });

      setTimeout(() => {
        const focusable = target.matches('input, select, textarea')
          ? target
          : target.querySelector('input, select, textarea');
        if (focusable && typeof focusable.focus === 'function') {
          focusable.focus();
        }
      }, 250);
    }, 50);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));

    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handlePhoneChange = (e) => {
    const raw = e.target.value;
    setFormData(prev => ({ ...prev, phone: raw }));
    if (errors.phone) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated.phone;
        return updated;
      });
    }
  };

  const handlePhoneBlur = () => {
    if (!formData.phone) return;
    const err = validatePhoneNumber(formData.phone, true, 'Phone number');
    if (err) {
      setErrors(prev => ({ ...prev, phone: err }));
    }
  };

  const handlePostalCodeChange = (e) => {
    const raw = e.target.value;
    setFormData(prev => ({ ...prev, postalCode: raw }));
    if (errors.postalCode) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated.postalCode;
        return updated;
      });
    }
  };

  const handlePostalCodeBlur = () => {
    if (!formData.postalCode) return;
    const err = validatePostalCode(formData.postalCode, true, 'Postal code');
    if (err) {
      setErrors(prev => ({ ...prev, postalCode: err }));
    }
  };

  const handleEmailBlur = () => {
    if (!formData.email) return;
    const err = validateEmail(formData.email, true, 'Clinic contact email');
    if (err) {
      setErrors(prev => ({ ...prev, email: err }));
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target?.result);
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setFormData(prev => ({ ...prev, logo: '' }));
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleLicenseUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLicenseFile(file);
      setLicenseName(file.name);
      const objUrl = URL.createObjectURL(file);
      setLicensePreviewUrl(objUrl);
    }
  };

  const removeLicense = () => {
    setLicenseFile(null);
    setLicenseName('');
    if (licensePreviewUrl && licensePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(licensePreviewUrl);
    }
    setLicensePreviewUrl('');
    setFormData(prev => ({ ...prev, licenseDocumentUrl: '' }));
    if (licenseInputRef.current) licenseInputRef.current.value = '';
  };

  const handleGstUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setGstFile(file);
      setGstName(file.name);
      const objUrl = URL.createObjectURL(file);
      setGstPreviewUrl(objUrl);
    }
  };

  const removeGst = () => {
    setGstFile(null);
    setGstName('');
    if (gstPreviewUrl && gstPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(gstPreviewUrl);
    }
    setGstPreviewUrl('');
    setFormData(prev => ({ ...prev, gstDocumentUrl: '' }));
    if (gstInputRef.current) gstInputRef.current.value = '';
  };

  const viewDocument = (url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const toggleSpecialty = (item) => {
    setFormData(prev => {
      const current = prev.specialties || [];
      const updated = current.includes(item)
        ? current.filter(s => s !== item)
        : [...current, item];
      return { ...prev, specialties: updated };
    });
  };

  const handleAddCustomSpecialty = () => {
    const trimmed = customSpecialty.trim();
    if (!trimmed) return;
    if (!availableSpecialties.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setAvailableSpecialties(prev => [...prev, trimmed]);
    }
    if (!formData.specialties.includes(trimmed)) {
      setFormData(prev => ({ ...prev, specialties: [...prev.specialties, trimmed] }));
    }
    setCustomSpecialty('');
  };

  const handleHourChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day],
          [field]: value
        }
      }
    }));
  };

  const toggleDayClosed = (day) => {
    setFormData(prev => {
      const current = prev.openingHours[day];
      const isClosed = !current.closed;
      return {
        ...prev,
        openingHours: {
          ...prev.openingHours,
          [day]: {
            ...current,
            closed: isClosed,
            open: isClosed ? '' : (current.open || '09:00'),
            close: isClosed ? '' : (current.close || '18:00')
          }
        }
      };
    });
  };

  const validateForm = () => {
    const newErrors = {};

    // Basic Info
    if (!formData.clinicName.trim()) newErrors.clinicName = 'Clinic name is required';
    if (!formData.clinicType) newErrors.clinicType = 'Clinic type is required';

    // Contact & Location
    const phoneErr = validatePhoneNumber(formData.phone, true, 'Phone number');
    if (phoneErr) newErrors.phone = phoneErr;

    const emailErr = validateEmail(formData.email, true, 'Email');
    if (emailErr) newErrors.email = emailErr;

    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';

    const postalErr = validatePostalCode(formData.postalCode, true, 'Postal code');
    if (postalErr) newErrors.postalCode = postalErr;

    if (!formData.country.trim()) newErrors.country = 'Country is required';

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setGeneralError('Please fill in all required fields accurately.');
      const firstErrorField = FIELD_ORDER.find(field => Boolean(newErrors[field]));
      if (firstErrorField) {
        scrollToField(firstErrorField);
      }
      return false;
    }

    setGeneralError('');
    return true;
  };

  const uploadFileToCloudinary = async (file, folder) => {
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('folder', folder);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: uploadData
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.url) {
      throw new Error(json.error || 'Failed to upload file.');
    }
    return json.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setGeneralError('');

    try {
      // 1. Upload files if newly selected
      let uploadedLogoUrl = formData.logo || null;
      if (logoFile) {
        uploadedLogoUrl = await uploadFileToCloudinary(logoFile, 'clinic-logos');
      }

      let uploadedLicenseUrl = formData.licenseDocumentUrl || null;
      if (licenseFile) {
        uploadedLicenseUrl = await uploadFileToCloudinary(licenseFile, 'clinic-documents');
      }

      let uploadedGstUrl = formData.gstDocumentUrl || null;
      if (gstFile) {
        uploadedGstUrl = await uploadFileToCloudinary(gstFile, 'clinic-documents');
      }

      // 2. Format opening hours for backend
      const formattedOpeningHours = {};
      for (const day of DAYS_OF_WEEK) {
        const item = formData.openingHours[day];
        if (item && !item.closed && item.open && item.close) {
          formattedOpeningHours[day] = {
            open: item.open,
            close: item.close,
            closed: false
          };
        } else {
          formattedOpeningHours[day] = {
            open: '',
            close: '',
            closed: true
          };
        }
      }

      const clinicId = clinic._id || clinic.id;

      // 3. Prepare payload strictly WITHOUT password
      const payload = {
        clinicName: formatTitleCase(formData.clinicName),
        clinic_name: formatTitleCase(formData.clinicName),
        clinicType: formData.clinicType,
        clinic_type: formData.clinicType,
        description: formData.description?.trim() ? formData.description.trim() : null,
        logo: uploadedLogoUrl,
        logo_url: uploadedLogoUrl,
        logoUrl: uploadedLogoUrl,
        phone: formData.phone.trim(),
        email: formData.email.trim(), // Clinic Contact Email
        contact_email: formData.email.trim(),
        contactEmail: formData.email.trim(),
        website: formData.website?.trim() ? formData.website.trim() : null,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim(),
        postal_code: formData.postalCode.trim(),
        country: formData.country.trim(),
        registrationNumber: formData.registrationNumber?.trim() ? formData.registrationNumber.trim() : null,
        registration_number: formData.registrationNumber?.trim() ? formData.registrationNumber.trim() : null,
        taxId: formData.taxId?.trim() ? formData.taxId.trim() : null,
        tax_id: formData.taxId?.trim() ? formData.taxId.trim() : null,
        gstNumber: formData.taxId?.trim() ? formData.taxId.trim() : null,
        gst_number: formData.taxId?.trim() ? formData.taxId.trim() : null,
        specialties: formData.specialties,
        is24x7: formData.is24x7,
        is_24x7: formData.is24x7,
        openingHours: formattedOpeningHours,
        opening_hours: formattedOpeningHours,
        licenseDocumentUrl: uploadedLicenseUrl,
        license_document_url: uploadedLicenseUrl,
        gstDocumentUrl: uploadedGstUrl,
        gst_document_url: uploadedGstUrl
      };

      // 4. Call clinic update API
      const updateUrl = `${API_BASE_URL}/api/v1/clinic/update-by-id/${clinicId}`;
      const res = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });

      const resJson = await res.json().catch(() => ({}));

      if (!res.ok || resJson.success === false) {
        const errorMsg = resJson.message || `Failed to update clinic (HTTP ${res.status})`;
        throw new Error(errorMsg);
      }

      const returnedClinic = resJson.data?.clinic || resJson.clinic || {};

      // Merge updated data cleanly with server response as authoritative source
      const updatedClinic = {
        ...clinic,
        ...payload,
        ...returnedClinic,
        _id: clinicId,
        id: clinicId
      };

      // Strictly ensure password is NEVER stored or exposed in local state
      delete updatedClinic.password;

      onClinicUpdated(updatedClinic);
      onClose();
    } catch (err) {
      console.error('Update clinic error:', err);
      setGeneralError(err.message || 'An error occurred while updating the clinic.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[680px] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex-shrink-0 flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200 z-10">
          <div className="flex items-center space-x-2.5">
            <Building2 className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Edit Clinic</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-100"
            title="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable Form */}
        <div ref={formContainerRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {generalError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start text-red-700 text-sm">
              <AlertCircle className="h-5 w-5 mr-2 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          <form id="edit-clinic-form" onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Clinic Logo */}
            <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm" data-field="logo">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                Clinic Logo
              </h3>

              <div className="flex items-center gap-5">
                <div className="relative w-20 h-20 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Clinic logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-8 h-8 text-gray-400" />
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {logoPreview ? 'Change Logo' : 'Upload Logo'}
                    </button>
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400">JPG, PNG, WebP up to 5MB. Square ratio recommended.</p>
                </div>
              </div>
            </div>

            {/* 2. Basic Information */}
            <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div data-field="clinicName">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Clinic Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="clinicName"
                    value={formData.clinicName}
                    onChange={handleInputChange}
                    placeholder="e.g. City Health Clinic"
                    className={`w-full px-3.5 py-2 border rounded-lg text-sm transition-colors ${
                      errors.clinicName ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-500'
                    }`}
                  />
                  {errors.clinicName && <p className="text-xs text-red-500 mt-1">{errors.clinicName}</p>}
                </div>

                <div data-field="clinicType">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Clinic Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="clinicType"
                    value={formData.clinicType}
                    onChange={handleInputChange}
                    className={`w-full px-3.5 py-2 border rounded-lg text-sm bg-white transition-colors ${
                      errors.clinicType ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-500'
                    }`}
                  >
                    {CLINIC_TYPES.map(t => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  {errors.clinicType && <p className="text-xs text-red-500 mt-1">{errors.clinicType}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide an overview of clinic facilities, mission, or care services..."
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* 3. Contact & Location */}
            <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                Contact & Location
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div data-field="phone">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    onKeyDown={handlePhoneKeyDown}
                    onBlur={handlePhoneBlur}
                    placeholder="e.g. +91 9876543210"
                    className={`w-full px-3.5 py-2 border rounded-lg text-sm transition-colors ${
                      errors.phone ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-500'
                    }`}
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>

                <div data-field="email">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Clinic Contact Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleEmailBlur}
                    placeholder="clinic@example.com"
                    className={`w-full px-3.5 py-2 border rounded-lg text-sm transition-colors ${
                      errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-500'
                    }`}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Website URL
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://www.example.com"
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div data-field="address">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="e.g. 123 Healthcare Blvd, Suite 400"
                  className={`w-full px-3.5 py-2 border rounded-lg text-sm transition-colors ${
                    errors.address ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-500'
                  }`}
                />
                {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div data-field="city">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    className={`w-full px-3.5 py-2 border rounded-lg text-sm transition-colors ${
                      errors.city ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-500'
                    }`}
                  />
                  {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                </div>

                <div data-field="state">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    State / Province <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="State"
                    className={`w-full px-3.5 py-2 border rounded-lg text-sm transition-colors ${
                      errors.state ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-500'
                    }`}
                  />
                  {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
                </div>

                <div data-field="postalCode">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handlePostalCodeChange}
                    onKeyDown={handlePostalCodeKeyDown}
                    onBlur={handlePostalCodeBlur}
                    placeholder="6 digits"
                    maxLength={10}
                    className={`w-full px-3.5 py-2 border rounded-lg text-sm transition-colors ${
                      errors.postalCode ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-500'
                    }`}
                  />
                  {errors.postalCode && <p className="text-xs text-red-500 mt-1">{errors.postalCode}</p>}
                </div>

                <div data-field="country">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="Country"
                    className={`w-full px-3.5 py-2 border rounded-lg text-sm transition-colors ${
                      errors.country ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-500'
                    }`}
                  />
                  {errors.country && <p className="text-xs text-red-500 mt-1">{errors.country}</p>}
                </div>
              </div>
            </div>

            {/* 4. Business Information & Documents */}
            <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Business Information & Documents
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div data-field="registrationNumber">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. REG-789012"
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div data-field="taxId">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    GST / Tax ID
                  </label>
                  <input
                    type="text"
                    name="taxId"
                    value={formData.taxId}
                    onChange={handleInputChange}
                    placeholder="e.g. 29ABCDE1234F1Z5"
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                {/* License Document */}
                <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50/50 flex flex-col justify-between">
                  <div>
                    <span className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      License Document
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">Medical license or operating registration (JPG, PNG, PDF)</p>

                    <input
                      ref={licenseInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleLicenseUpload}
                      className="hidden"
                    />

                    {licensePreviewUrl ? (
                      <div className="mt-3 flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <span className="text-xs text-gray-700 truncate font-medium">
                            {licenseName || 'License Document Attached'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => viewDocument(licensePreviewUrl)}
                            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                            title="View document"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={removeLicense}
                            className="p-1 text-rose-500 hover:text-rose-700 transition-colors"
                            title="Remove document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-xs text-gray-400 italic">No document currently uploaded.</div>
                    )}
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => licenseInputRef.current?.click()}
                      className="w-full py-2 px-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5 text-gray-500" />
                      {licensePreviewUrl ? 'Replace License File' : 'Upload License File'}
                    </button>
                  </div>
                </div>

                {/* GST Document */}
                <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50/50 flex flex-col justify-between">
                  <div>
                    <span className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      GST / Tax Document
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">GST registration or Tax certificate (JPG, PNG, PDF)</p>

                    <input
                      ref={gstInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleGstUpload}
                      className="hidden"
                    />

                    {gstPreviewUrl ? (
                      <div className="mt-3 flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                          <span className="text-xs text-gray-700 truncate font-medium">
                            {gstName || 'GST Document Attached'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => viewDocument(gstPreviewUrl)}
                            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                            title="View document"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={removeGst}
                            className="p-1 text-rose-500 hover:text-rose-700 transition-colors"
                            title="Remove document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-xs text-gray-400 italic">No document currently uploaded.</div>
                    )}
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => gstInputRef.current?.click()}
                      className="w-full py-2 px-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5 text-gray-500" />
                      {gstPreviewUrl ? 'Replace GST File' : 'Upload GST File'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Specialties */}
            <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm space-y-4" data-field="specialties">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600" />
                Specialties & Medical Services
              </h3>

              <div className="flex flex-wrap gap-2">
                {availableSpecialties.map(spec => {
                  const isSelected = formData.specialties.includes(spec);
                  return (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => toggleSpecialty(spec)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {isSelected && '✓ '}
                      {spec}
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Specialty */}
              <div className="flex items-center gap-2 pt-2 max-w-md">
                <input
                  type="text"
                  value={customSpecialty}
                  onChange={(e) => setCustomSpecialty(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSpecialty();
                    }
                  }}
                  placeholder="Add custom specialty..."
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSpecialty}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>

            {/* 6. Availability & Hours */}
            <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm space-y-4" data-field="openingHours">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Availability & Operating Hours
                </h3>

                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is24x7"
                    checked={formData.is24x7}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  Open 24/7
                </label>
              </div>

              {!formData.is24x7 && (
                <div className="space-y-2.5 pt-2">
                  {DAYS_OF_WEEK.map(day => {
                    const dayHours = formData.openingHours[day] || { open: '', close: '', closed: false };
                    return (
                      <div
                        key={day}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg border text-xs gap-2 ${
                          dayHours.closed
                            ? 'bg-gray-50 border-gray-200 text-gray-400'
                            : 'bg-white border-gray-200 text-gray-700'
                        }`}
                      >
                        <span className="capitalize font-semibold w-24">{day}</span>

                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1 text-[11px] text-gray-500 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={dayHours.closed}
                              onChange={() => toggleDayClosed(day)}
                              className="h-3.5 w-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            Closed
                          </label>

                          {!dayHours.closed && (
                            <div className="flex items-center gap-2">
                              <input
                                type="time"
                                value={dayHours.open}
                                onChange={(e) => handleHourChange(day, 'open', e.target.value)}
                                className="px-2 py-1 border border-gray-200 rounded text-xs focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-gray-400">to</span>
                              <input
                                type="time"
                                value={dayHours.close}
                                onChange={(e) => handleHourChange(day, 'close', e.target.value)}
                                className="px-2 py-1 border border-gray-200 rounded text-xs focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end items-center space-x-3 z-10">
          <button
            type="submit"
            form="edit-clinic-form"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-70 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1.5" />
                Save Changes
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
