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
  EyeOff,
  Clock,
  Check,
  Plus,
  Trash2,
  FileText,
  MapPin,
  Lock,
  Mail,
  Globe,
  AlertCircle,
  ExternalLink,
  Layers
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
  'openingHours',
  'loginEmail',
  'password'
];

export default function AddClinicModal({ isOpen, onClose, onClinicAdded }) {
  const [formData, setFormData] = useState({
    clinicName: '',
    clinicType: 'general',
    description: '',
    logo: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    registrationNumber: '',
    taxId: '',
    licenseDocumentUrl: '',
    gstDocumentUrl: '',
    specialties: [],
    is24x7: false,
    openingHours: INITIAL_HOURS,
    enableLab: false,
    enableIpd: false,
    loginEmail: '',
    password: ''
  });

  const [customSpecialty, setCustomSpecialty] = useState('');
  const [availableSpecialties, setAvailableSpecialties] = useState(DEFAULT_SPECIALTIES);

  // File upload state & previews
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [licenseName, setLicenseName] = useState('');
  const [licensePreviewUrl, setLicensePreviewUrl] = useState('');
  const [gstFile, setGstFile] = useState(null);
  const [gstName, setGstName] = useState('');
  const [gstPreviewUrl, setGstPreviewUrl] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      // Scroll modal container so the field sits comfortably around upper-middle (~22% from top of scroll container)
      const relativeTop = targetRect.top - containerRect.top;
      const desiredOffset = containerRect.height * 0.22;
      const targetScrollTop = container.scrollTop + relativeTop - desiredOffset;

      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      });

      // Focus the invalid field without scrolling window/document
      setTimeout(() => {
        const focusable = target.matches('input, select, textarea')
          ? target
          : target.querySelector('input, select, textarea');
        if (focusable && typeof focusable.focus === 'function') {
          focusable.focus({ preventScroll: true });
        }
      }, 180);
    }, 50);
  };

  // Prevent background page scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Clean form state on open / close
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        clinicName: '',
        clinicType: 'general',
        description: '',
        logo: '',
        phone: '',
        email: '',
        website: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        registrationNumber: '',
        taxId: '',
        licenseDocumentUrl: '',
        gstDocumentUrl: '',
        specialties: [],
        is24x7: false,
        openingHours: INITIAL_HOURS,
        enableLab: false,
        enableIpd: false,
        loginEmail: '',
        password: ''
      });
      setLogoFile(null);
      setLogoPreview(null);
      setLicenseFile(null);
      setLicenseName('');
      setLicensePreviewUrl('');
      setGstFile(null);
      setGstName('');
      setGstPreviewUrl('');
      setErrors({});
      setGeneralError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (generalError) setGeneralError('');
  };

  const handleEmailBlur = (field) => {
    const val = formData[field];
    if (!val) return;
    const err = validateEmail(val, true, field === 'email' ? 'Clinic contact email' : 'Admin login email');
    if (err) {
      setErrors(prev => ({ ...prev, [field]: err }));
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

    const postalCodeErr = validatePostalCode(formData.postalCode, true, 'Postal code');
    if (postalCodeErr) newErrors.postalCode = postalCodeErr;

    if (!formData.country.trim()) newErrors.country = 'Country is required';

    // Login Account
    const loginEmailErr = validateEmail(formData.loginEmail, true, 'Login email');
    if (loginEmailErr) newErrors.loginEmail = loginEmailErr;

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = 'Password must include uppercase, lowercase, number, and special character (@$!%*?&)';
    }

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
      // 1. Upload files if selected
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
            close: item.close
          };
        } else {
          formattedOpeningHours[day] = {
            open: '',
            close: ''
          };
        }
      }

      // 3. Prepare payload for /api/v1/clinic/register
      const payload = {
        clinicName: formatTitleCase(formData.clinicName),
        clinicType: formData.clinicType,
        description: formData.description.trim(),
        logo: uploadedLogoUrl,
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(), // Clinic Contact Email -> database clinics.email
        contactEmail: formData.email.trim().toLowerCase(),
        contact_email: formData.email.trim().toLowerCase(),
        loginEmail: formData.loginEmail.trim().toLowerCase(),
        adminEmail: formData.loginEmail.trim().toLowerCase(),
        website: formData.website.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim(),
        country: formData.country.trim(),
        registrationNumber: formData.registrationNumber?.trim() ? formData.registrationNumber.trim() : null,
        taxId: formData.taxId?.trim() ? formData.taxId.trim() : null,
        specialties: formData.specialties,
        is24x7: formData.is24x7,
        is_24x7: formData.is24x7,
        openingHours: formattedOpeningHours,
        modules: {
          lab: Boolean(formData.enableLab),
          ipd: Boolean(formData.enableIpd)
        },
        licenseDocumentUrl: uploadedLicenseUrl,
        gstDocumentUrl: uploadedGstUrl,
        password: formData.password
      };

      const registerRes = await fetch(`${API_BASE_URL}/api/v1/clinic/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const registerJson = await registerRes.json().catch(() => ({}));
      if (!registerRes.ok || !registerJson.success) {
        throw new Error(registerJson.message || 'Failed to register clinic.');
      }

      const createdClinic = registerJson.data?.clinic || registerJson.data || {};
      const newClinicId = createdClinic.id || createdClinic._id;

      // 4. Immediately activate clinic via /api/v1/clinic/update-status/${newClinicId}
      if (newClinicId) {
        const statusRes = await fetch(`${API_BASE_URL}/api/v1/clinic/update-status/${newClinicId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            status: 'active'
          })
        });
        const statusJson = await statusRes.json().catch(() => ({}));
        if (statusRes.ok && statusJson.success && statusJson.data?.clinic) {
          createdClinic.status = 'active';
          createdClinic.approved = true;
        } else {
          createdClinic.status = 'active';
          createdClinic.approved = true;
        }
      } else {
        createdClinic.status = 'active';
        createdClinic.approved = true;
      }

      // Ensure properties required by table rendering are in place
      createdClinic._id = newClinicId;
      createdClinic.clinicName = formatTitleCase(formData.clinicName);
      createdClinic.clinicType = formData.clinicType;
      createdClinic.phone = formData.phone.trim();
      createdClinic.email = formData.email.trim().toLowerCase();
      createdClinic.contactEmail = formData.email.trim().toLowerCase();
      createdClinic.contact_email = formData.email.trim().toLowerCase();
      createdClinic.city = formData.city.trim();
      createdClinic.address = formData.address.trim();
      createdClinic.specialties = formData.specialties;
      createdClinic.status = 'active';
      createdClinic.approved = true;
      delete createdClinic.loginEmail;
      delete createdClinic.adminEmail;
      delete createdClinic.password;

      // 5. Notify parent to prepend clinic, show success toast, and close
      onClinicAdded({ ...createdClinic, isNewlyCreated: true });
      onClose();
    } catch (err) {
      console.error('Create clinic error:', err);
      const errMsg = err.message || '';
      if (
        errMsg.includes('clinics_registration_number_key') ||
        errMsg.toLowerCase().includes('registration number') ||
        errMsg.toLowerCase().includes('registration_number')
      ) {
        setErrors(prev => ({
          ...prev,
          registrationNumber: 'Registration Number already exists. Please enter a different registration number.'
        }));
        scrollToField('registrationNumber');
        setGeneralError('Please fill in all required fields accurately.');
      } else {
        setGeneralError(errMsg || 'An error occurred while creating the clinic.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[760px] max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200 z-10">
          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">Add New Clinic</h2>
              <p className="text-xs text-gray-500">Create and immediately activate a clinic account</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form ref={formContainerRef} onSubmit={handleSubmit} autoComplete="off" className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {generalError && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-3.5 rounded-lg flex items-start gap-2.5 text-rose-800 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {/* CLINIC LOGO AT THE VERY TOP */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {logoPreview ? (
              <div className="relative h-20 w-20 rounded-xl overflow-hidden border-2 border-indigo-200 shadow-sm bg-white flex-shrink-0">
                <img src={logoPreview} alt="Logo Preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-rose-600 transition-colors"
                  title="Remove Logo"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="h-20 w-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-white flex-shrink-0">
                <Building2 className="h-7 w-7 text-gray-300" />
                <span className="text-[10px] text-gray-400 mt-1">No Logo</span>
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <span className="block text-[13px] font-semibold text-gray-800 mb-0.5">
                Clinic Logo
              </span>
              <p className="text-xs text-gray-500 mb-2.5">
                Upload your clinic’s official logo for display on profiles and documents.
              </p>
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="clinic-logo-input"
                />
                <label
                  htmlFor="clinic-logo-input"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors shadow-sm"
                >
                  <Upload className="h-3.5 w-3.5 text-indigo-600" />
                  {logoPreview ? 'Change Logo' : 'Upload Logo'}
                </label>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-rose-200 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </button>
                )}
                <span className="text-[11px] text-gray-400">PNG, JPG, or WebP up to 5MB</span>
              </div>
            </div>
          </div>

          {/* BASIC INFORMATION */}
          <div className="bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <Building2 className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                Basic Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">
                  Clinic Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="clinicName"
                  data-field="clinicName"
                  placeholder="e.g. Apex Multispecialty Clinic"
                  value={formData.clinicName}
                  onChange={(e) => handleInputChange('clinicName', e.target.value)}
                  className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${
                    errors.clinicName ? 'border-rose-400 focus:ring-rose-500' : 'border-gray-300'
                  }`}
                />
                {errors.clinicName && (
                  <p className="text-xs text-rose-600 mt-1">{errors.clinicName}</p>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">
                  Clinic Type <span className="text-rose-500">*</span>
                </label>
                <select
                  id="clinicType"
                  data-field="clinicType"
                  value={formData.clinicType}
                  onChange={(e) => handleInputChange('clinicType', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {CLINIC_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief description of the clinic, facilities, or vision..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none"
                />
              </div>
            </div>
          </div>

          {/* CONTACT & LOCATION */}
          <div className="bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <MapPin className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                Contact & Location
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-xs">
                    +91
                  </span>
                  <input
                    type="tel"
                    id="phone"
                    data-field="phone"
                    maxLength={10}
                    placeholder="10-digit number"
                    value={formData.phone}
                    onKeyDown={handlePhoneKeyDown}
                    onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className={`w-full pl-10 pr-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${
                      errors.phone ? 'border-rose-400 focus:ring-rose-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.phone && <p className="text-xs text-rose-600 mt-1">{errors.phone}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">
                  Clinic Contact Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    id="email"
                    data-field="email"
                    name="clinic_contact_email_field"
                    autoComplete="off"
                    placeholder="clinic@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onBlur={() => handleEmailBlur('email')}
                    className={`w-full pl-9 pr-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${
                      errors.email ? 'border-rose-400 focus:ring-rose-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">
                  Website
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Globe className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    id="website"
                    data-field="website"
                    placeholder="https://www.yourclinic.com"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">
                  Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  data-field="address"
                  placeholder="Street address, building, landmark"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${
                    errors.address ? 'border-rose-400 focus:ring-rose-500' : 'border-gray-300'
                  }`}
                />
                {errors.address && <p className="text-xs text-rose-600 mt-1">{errors.address}</p>}
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  data-field="city"
                  placeholder="e.g. Mumbai"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${
                    errors.city ? 'border-rose-400 focus:ring-rose-500' : 'border-gray-300'
                  }`}
                />
                {errors.city && <p className="text-xs text-rose-600 mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">
                  State / Province <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="state"
                  data-field="state"
                  placeholder="e.g. Maharashtra"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${
                    errors.state ? 'border-rose-400 focus:ring-rose-500' : 'border-gray-300'
                  }`}
                />
                {errors.state && <p className="text-xs text-rose-600 mt-1">{errors.state}</p>}
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">
                  Postal Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="postalCode"
                  data-field="postalCode"
                  maxLength={6}
                  placeholder="6 digits (e.g. 400001)"
                  value={formData.postalCode}
                  onKeyDown={handlePostalCodeKeyDown}
                  onChange={(e) => handleInputChange('postalCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${
                    errors.postalCode ? 'border-rose-400 focus:ring-rose-500' : 'border-gray-300'
                  }`}
                />
                {errors.postalCode && <p className="text-xs text-rose-600 mt-1">{errors.postalCode}</p>}
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">
                  Country <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="country"
                  data-field="country"
                  placeholder="e.g. India"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${
                    errors.country ? 'border-rose-400 focus:ring-rose-500' : 'border-gray-300'
                  }`}
                />
                {errors.country && <p className="text-xs text-rose-600 mt-1">{errors.country}</p>}
              </div>
            </div>
          </div>

          {/* BUSINESS INFORMATION */}
          <div className="bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                Business Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">
                  Registration Number
                </label>
                <input
                  type="text"
                  id="registrationNumber"
                  data-field="registrationNumber"
                  name="clinic_reg_number"
                  autoComplete="off"
                  placeholder="e.g. CLINIC-REG-12345"
                  value={formData.registrationNumber}
                  onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                  className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${
                    errors.registrationNumber ? 'border-rose-400 focus:ring-rose-500' : 'border-gray-300'
                  }`}
                />
                {errors.registrationNumber && (
                  <p className="text-xs text-rose-600 mt-1">{errors.registrationNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">
                  GST / Tax ID
                </label>
                <input
                  type="text"
                  name="clinic_tax_identifier"
                  id="taxId"
                  data-field="taxId"
                  autoComplete="off"
                  placeholder="e.g. 27ABCDE1234F1Z5"
                  value={formData.taxId}
                  onChange={(e) => handleInputChange('taxId', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              {/* License Document */}
              <div data-field="licenseDocumentUrl" className="border border-gray-200 rounded-xl p-3.5 bg-white">
                <span className="block text-[13px] font-semibold text-gray-700 mb-1">
                  License Document
                </span>
                <input
                  type="file"
                  ref={licenseInputRef}
                  accept=".pdf,image/*"
                  onChange={handleLicenseUpload}
                  className="hidden"
                  id="clinic-license-doc"
                />
                {licenseName ? (
                  <div className="flex items-center justify-between bg-indigo-50 p-2.5 rounded-lg border border-indigo-200 mt-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                      <span className="text-xs font-medium text-indigo-900 truncate">{licenseName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => viewDocument(licensePreviewUrl || formData.licenseDocumentUrl)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-100 px-2 py-1 rounded border border-indigo-200 transition-colors"
                        title="View document"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={removeLicense}
                        className="text-rose-600 hover:text-rose-800 p-1 hover:bg-rose-50 rounded"
                        title="Delete document"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="clinic-license-doc"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:border-indigo-400 hover:bg-slate-50 cursor-pointer w-full justify-center mt-1"
                  >
                    <Upload className="h-3.5 w-3.5 text-indigo-600" />
                    Upload License (PDF/Image)
                  </label>
                )}
              </div>

              {/* GST Document */}
              <div data-field="gstDocumentUrl" className="border border-gray-200 rounded-xl p-3.5 bg-white">
                <span className="block text-[13px] font-semibold text-gray-700 mb-1">
                  GST Document
                </span>
                <input
                  type="file"
                  ref={gstInputRef}
                  accept=".pdf,image/*"
                  onChange={handleGstUpload}
                  className="hidden"
                  id="clinic-gst-doc"
                />
                {gstName ? (
                  <div className="flex items-center justify-between bg-indigo-50 p-2.5 rounded-lg border border-indigo-200 mt-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                      <span className="text-xs font-medium text-indigo-900 truncate">{gstName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => viewDocument(gstPreviewUrl || formData.gstDocumentUrl)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-100 px-2 py-1 rounded border border-indigo-200 transition-colors"
                        title="View document"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={removeGst}
                        className="text-rose-600 hover:text-rose-800 p-1 hover:bg-rose-50 rounded"
                        title="Delete document"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="clinic-gst-doc"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:border-indigo-400 hover:bg-slate-50 cursor-pointer w-full justify-center mt-1"
                  >
                    <Upload className="h-3.5 w-3.5 text-indigo-600" />
                    Upload GST Document (PDF/Image)
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* SPECIALTIES */}
          <div data-field="specialties" className="bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Specialties
                </h3>
              </div>
              <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                {formData.specialties.length} selected
              </span>
            </div>

            {/* Specialties organized clean responsive grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
              {availableSpecialties.map((specialty) => {
                const isSelected = formData.specialties.includes(specialty);
                return (
                  <button
                    key={specialty}
                    type="button"
                    onClick={() => toggleSpecialty(specialty)}
                    className={`inline-flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-200'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40'
                    }`}
                  >
                    <span className="truncate mr-1">{specialty}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Specialty input */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
              <input
                type="text"
                placeholder="Add custom specialty (e.g. Ayurveda)..."
                value={customSpecialty}
                onChange={(e) => setCustomSpecialty(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSpecialty();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <button
                type="button"
                onClick={handleAddCustomSpecialty}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-gray-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
          </div>

          {/* AVAILABILITY & HOURS */}
          <div data-field="openingHours" className="bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Availability & Hours
                </h3>
              </div>

              {/* 24/7 Clean Button Switch (Zero blur / zero overlay) */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-700">24/7 Available</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.is24x7}
                  onClick={() => handleInputChange('is24x7', !formData.is24x7)}
                  className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.is24x7 ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      formData.is24x7 ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {formData.is24x7 ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                Clinic operates 24 Hours, 7 Days a Week
              </div>
            ) : (
              <div className="space-y-2">
                {DAYS_OF_WEEK.map((day) => {
                  const schedule = formData.openingHours[day] || { open: '', close: '', closed: false };
                  return (
                    <div
                      key={day}
                      className={`grid grid-cols-12 items-center gap-2.5 px-3 py-2 rounded-lg border text-xs ${
                        schedule.closed ? 'bg-gray-100/70 border-gray-200 text-gray-400' : 'bg-white border-gray-200 text-gray-800'
                      }`}
                    >
                      <span className="col-span-3 font-semibold capitalize">
                        {day}
                      </span>
                      <div className="col-span-7 flex items-center gap-2">
                        <input
                          type="time"
                          disabled={schedule.closed}
                          value={schedule.open || ''}
                          onChange={(e) => handleHourChange(day, 'open', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                        />
                        <span className="text-gray-400 font-medium">-</span>
                        <input
                          type="time"
                          disabled={schedule.closed}
                          value={schedule.close || ''}
                          onChange={(e) => handleHourChange(day, 'close', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                        />
                      </div>
                      <div className="col-span-2 text-right">
                        <label className="inline-flex items-center gap-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={Boolean(schedule.closed)}
                            onChange={() => toggleDayClosed(day)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                          />
                          <span className="text-[11px] text-gray-500 font-medium">Closed</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* MODULE CONFIGURATION */}
          <div className="bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Module Configuration
                </h3>
              </div>
              <span className="text-xs text-gray-500 font-medium">New Clinic Settings</span>
            </div>
            <p className="text-xs text-gray-600">
              Configure which clinical modules are enabled for this clinic.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:border-indigo-300 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  name="enableLab"
                  checked={formData.enableLab}
                  onChange={(e) => handleInputChange('enableLab', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-semibold text-gray-800 block">Enable Lab Module</span>
                  <span className="text-[11px] text-gray-500">Enable laboratory test ordering and tracking for this clinic</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:border-indigo-300 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  name="enableIpd"
                  checked={formData.enableIpd}
                  onChange={(e) => handleInputChange('enableIpd', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-semibold text-gray-800 block">Enable IPD & Bed Management</span>
                  <span className="text-[11px] text-gray-500">Enable inpatient admission, bed management, and nurse allocation</span>
                </div>
              </label>
            </div>
          </div>

          {/* CLINIC LOGIN ACCOUNT */}
          <div className="bg-indigo-50/50 p-4 sm:p-5 rounded-xl border border-indigo-100 space-y-4">
            <div className="flex items-center gap-2 border-b border-indigo-100 pb-2">
              <Lock className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Clinic Login Account
              </h3>
            </div>

            <p className="text-xs text-gray-500 -mt-1">
              These credentials will allow the clinic to immediately log in and access their dashboard.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">
                  Admin Login Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    name="clinic_auth_login_email"
                    id="loginEmail"
                    data-field="loginEmail"
                    autoComplete="off"
                    placeholder="clinic-login@example.com"
                    value={formData.loginEmail}
                    onChange={(e) => handleInputChange('loginEmail', e.target.value)}
                    onBlur={() => handleEmailBlur('loginEmail')}
                    className={`w-full pl-9 pr-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${
                      errors.loginEmail ? 'border-rose-400 focus:ring-rose-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.loginEmail && (
                  <p className="text-xs text-rose-600 mt-1">{errors.loginEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="clinic_admin_new_password"
                    id="password"
                    data-field="password"
                    autoComplete="new-password"
                    placeholder="Min 8 chars, Aa1@..."
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full pl-9 pr-10 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${
                      errors.password ? 'border-rose-400 focus:ring-rose-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-600 mt-1">{errors.password}</p>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end items-center space-x-3 z-10">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                <span>Creating Clinic...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Create Clinic</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
