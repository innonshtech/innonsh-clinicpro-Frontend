'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import {
  validatePhoneNumber,
  handlePhoneKeyDown,
  validateEmail,
  validatePostalCode,
  handlePostalCodeKeyDown
} from '@/utils/phoneValidation';
import {
  ArrowLeft,
  Building2,
  Upload,
  X,
  Check,
  Plus,
  Trash2,
  FileText,
  MapPin,
  Lock,
  Mail,
  Globe,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  Save,
  CheckCircle,
  ExternalLink
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

export default function AddClinicPage() {
  const router = useRouter();

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

  // Preview modal for documents
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    title: '',
    fileUrl: '',
    isPdf: false
  });

  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [formGeneralError, setFormGeneralError] = useState('');
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const logoInputRef = useRef(null);
  const licenseInputRef = useRef(null);
  const gstInputRef = useRef(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        if (Object.keys(next).length === 0) {
          setFormGeneralError('');
        }
        return next;
      });
    }
    if (apiError) setApiError('');
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
      if (file.size > 5 * 1024 * 1024) {
        setApiError('Logo file size must be less than 5MB');
        return;
      }
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
      if (file.size > 10 * 1024 * 1024) {
        setApiError('License document must be less than 10MB');
        return;
      }
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
      if (file.size > 10 * 1024 * 1024) {
        setApiError('GST document must be less than 10MB');
        return;
      }
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

  const openDocumentPreview = (url, title, filename = '') => {
    if (!url) return;
    const isPdf = filename.toLowerCase().endsWith('.pdf') || url.toLowerCase().includes('.pdf');
    setPreviewModal({
      isOpen: true,
      title: title || 'Document Preview',
      fileUrl: url,
      isPdf
    });
  };

  const closePreviewModal = () => {
    setPreviewModal({
      isOpen: false,
      title: '',
      fileUrl: '',
      isPdf: false
    });
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

    const emailErr = validateEmail(formData.email, true, 'Clinic contact email');
    if (emailErr) newErrors.email = emailErr;

    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State / Province is required';

    const postalCodeErr = validatePostalCode(formData.postalCode, true, 'Postal code');
    if (postalCodeErr) newErrors.postalCode = postalCodeErr;

    if (!formData.country.trim()) newErrors.country = 'Country is required';

    // Clinic Login Account
    const loginEmailErr = validateEmail(formData.loginEmail, true, 'Admin login email');
    if (loginEmailErr) newErrors.loginEmail = loginEmailErr;

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!formData.password) {
      newErrors.password = 'Initial password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = 'Password must include uppercase, lowercase, number, and special character (@$!%*?&)';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setFormGeneralError('Please correct the highlighted fields before adding the clinic.');

      // Find the FIRST invalid field in natural form order and auto-scroll page to it
      const firstInvalidField = FIELD_ORDER.find(field => Boolean(newErrors[field]));
      if (firstInvalidField) {
        setTimeout(() => {
          const el = document.getElementById(firstInvalidField) ||
                     document.querySelector(`[data-field="${firstInvalidField}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const focusable = el.matches('input, select, textarea')
              ? el
              : el.querySelector('input, select, textarea');
            if (focusable && typeof focusable.focus === 'function') {
              focusable.focus({ preventScroll: true });
            }
          }
        }, 50);
      }
      return false;
    }

    setFormGeneralError('');
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
    if (e && e.preventDefault) e.preventDefault();
    setApiError('');
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // 1. Upload files to Cloudinary if selected
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
        clinicName: formData.clinicName.trim(),
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
        licenseDocumentUrl: uploadedLicenseUrl,
        gstDocumentUrl: uploadedGstUrl,
        modules: {
          lab: Boolean(formData.enableLab),
          ipd: Boolean(formData.enableIpd)
        },
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
        await fetch(`${API_BASE_URL}/api/v1/clinic/update-status/${newClinicId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            status: 'active'
          })
        }).catch((err) => {
          console.warn('Auto-activation non-blocking warning:', err);
        });
      }

      const fullClinic = {
        ...createdClinic,
        _id: newClinicId,
        id: newClinicId,
        clinicName: formData.clinicName.trim(),
        clinic_name: formData.clinicName.trim(),
        clinicType: formData.clinicType,
        clinic_type: formData.clinicType,
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        contact_email: formData.email.trim().toLowerCase(),
        contactEmail: formData.email.trim().toLowerCase(),
        city: formData.city.trim(),
        address: formData.address.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim(),
        country: formData.country.trim(),
        specialties: formData.specialties,
        status: 'active',
        approved: true,
        isNewlyCreated: true,
        created_at: new Date().toISOString()
      };
      delete fullClinic.loginEmail;
      delete fullClinic.adminEmail;
      delete fullClinic.password;

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('newlyCreatedClinic', JSON.stringify(fullClinic));
      }

      setSubmitSuccess(true);

      // Return to Clinics Manage page with success notification
      setTimeout(() => {
        router.push('/admin/clinics-manage?added=true');
      }, 1200);
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
        setTimeout(() => {
          const el = document.getElementById('registrationNumber') || document.querySelector('[data-field="registrationNumber"]');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const focusable = el.matches('input, select, textarea') ? el : el.querySelector('input, select, textarea');
            focusable?.focus({ preventScroll: true });
          }
        }, 50);
        setFormGeneralError('Please correct the highlighted fields before adding the clinic.');
        setApiError('');
      } else {
        setApiError(errMsg || 'An error occurred while creating the clinic.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm max-w-md w-full text-center">
          <div className="h-20 w-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Clinic Added Successfully!</h2>
          <p className="text-gray-600 mb-6">
            <span className="font-semibold text-gray-900">{formData.clinicName}</span> has been created and immediately activated.
          </p>
          <div className="flex justify-center">
            <Link
              href="/admin/clinics-manage?added=true"
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium shadow-md hover:from-indigo-600 hover:to-purple-700 transition-all"
            >
              Go to Clinics List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div>
          <Link
            href="/admin/clinics-manage"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-3 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Clinics</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Clinic</h1>
          <p className="text-gray-600 mt-1">Fill in the details to add a new clinic to the system</p>
        </div>

        {/* General Form Error Alert */}
        {formGeneralError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center shadow-sm">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
            <p className="text-sm text-red-700">{formGeneralError}</p>
          </div>
        )}

        {/* API Error Alert */}
        {apiError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center shadow-sm">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
            <p className="text-sm text-red-700">{apiError}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Clinic Logo Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-indigo-600" />
              Clinic Logo
            </h3>
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Clinic Logo" className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-10 w-10 text-white" />
                  )}
                </div>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-sm"
                    title="Remove logo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div>
                <label className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 cursor-pointer transition-colors font-medium text-sm">
                  <Upload className="h-4 w-4 mr-2" />
                  {logoPreview ? 'Change Logo' : 'Upload Logo'}
                  <input
                    type="file"
                    accept="image/*"
                    ref={logoInputRef}
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-1">PNG, JPG, or WebP up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Basic Information Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-indigo-600" />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700 mb-1">
                  Clinic Name *
                </label>
                <input
                  id="clinicName"
                  data-field="clinicName"
                  type="text"
                  value={formData.clinicName}
                  onChange={(e) => handleInputChange('clinicName', e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-50/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                    errors.clinicName ? 'border-red-300' : 'border-gray-200/50'
                  }`}
                  placeholder="e.g. Apex Multispecialty Clinic"
                />
                {errors.clinicName && <p className="text-red-500 text-xs mt-1">{errors.clinicName}</p>}
              </div>

              <div>
                <label htmlFor="clinicType" className="block text-sm font-medium text-gray-700 mb-1">
                  Clinic Type *
                </label>
                <select
                  id="clinicType"
                  data-field="clinicType"
                  value={formData.clinicType}
                  onChange={(e) => handleInputChange('clinicType', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                >
                  {CLINIC_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                  placeholder="Brief description of the clinic, facilities, vision, or history..."
                />
              </div>
            </div>
          </div>

          {/* Contact & Location Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-indigo-600" />
              Contact & Location
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-xs">
                    +91
                  </span>
                  <input
                    id="phone"
                    data-field="phone"
                    type="tel"
                    maxLength={10}
                    value={formData.phone}
                    onKeyDown={handlePhoneKeyDown}
                    onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className={`w-full pl-10 pr-3 py-2 bg-gray-50/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                      errors.phone ? 'border-red-300' : 'border-gray-200/50'
                    }`}
                    placeholder="10-digit number"
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Clinic Contact Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    id="email"
                    data-field="email"
                    type="email"
                    name="clinic_contact_email_field"
                    autoComplete="off"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onBlur={() => handleEmailBlur('email')}
                    className={`w-full pl-9 pr-3 py-2 bg-gray-50/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                      errors.email ? 'border-red-300' : 'border-gray-200/50'
                    }`}
                    placeholder="clinic@example.com"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    id="website"
                    data-field="website"
                    type="text"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="https://www.yourclinic.com"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  id="address"
                  data-field="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-50/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                    errors.address ? 'border-red-300' : 'border-gray-200/50'
                  }`}
                  placeholder="Street address, building, suite, landmark"
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  id="city"
                  data-field="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-50/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                    errors.city ? 'border-red-300' : 'border-gray-200/50'
                  }`}
                  placeholder="e.g. Mumbai"
                />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State / Province *
                </label>
                <input
                  id="state"
                  data-field="state"
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-50/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                    errors.state ? 'border-red-300' : 'border-gray-200/50'
                  }`}
                  placeholder="e.g. Maharashtra"
                />
                {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
              </div>

              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code *
                </label>
                <input
                  id="postalCode"
                  data-field="postalCode"
                  type="text"
                  maxLength={6}
                  value={formData.postalCode}
                  onKeyDown={handlePostalCodeKeyDown}
                  onChange={(e) => handleInputChange('postalCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={`w-full px-3 py-2 bg-gray-50/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                    errors.postalCode ? 'border-red-300' : 'border-gray-200/50'
                  }`}
                  placeholder="6 numeric digits (e.g. 400001)"
                />
                {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <input
                  id="country"
                  data-field="country"
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-50/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                    errors.country ? 'border-red-300' : 'border-gray-200/50'
                  }`}
                  placeholder="e.g. India"
                />
                {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
              </div>
            </div>
          </div>

          {/* Business Information Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-indigo-600" />
              Business Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Number
                </label>
                <input
                  id="registrationNumber"
                  data-field="registrationNumber"
                  name="clinic_reg_number"
                  autoComplete="off"
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-50/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                    errors.registrationNumber ? 'border-red-300' : 'border-gray-200/50'
                  }`}
                  placeholder="e.g. CLINIC-REG-12345"
                />
                {errors.registrationNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.registrationNumber}</p>
                )}
              </div>

              <div>
                <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-1">
                  GST / Tax ID
                </label>
                <input
                  id="taxId"
                  data-field="taxId"
                  name="clinic_tax_identifier"
                  autoComplete="off"
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => handleInputChange('taxId', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="e.g. 27ABCDE1234F1Z5"
                />
              </div>

              {/* License Document */}
              <div data-field="licenseDocumentUrl" className="border border-gray-200/70 rounded-xl p-4 bg-slate-50/50">
                <span className="block text-sm font-medium text-gray-700 mb-1.5">
                  License Document
                </span>
                <input
                  type="file"
                  ref={licenseInputRef}
                  accept=".pdf,image/*"
                  onChange={handleLicenseUpload}
                  className="hidden"
                  id="license-doc-file"
                />
                {licenseName ? (
                  <div className="flex items-center justify-between bg-indigo-50/80 p-3 rounded-xl border border-indigo-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                      <span className="text-xs font-medium text-indigo-900 truncate">{licenseName}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => openDocumentPreview(licensePreviewUrl || formData.licenseDocumentUrl, 'License Document', licenseName)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors shadow-sm"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={removeLicense}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete document"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="license-doc-file"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-xl text-xs font-semibold text-gray-600 hover:border-indigo-400 hover:bg-white cursor-pointer w-full transition-colors bg-white shadow-sm"
                  >
                    <Upload className="h-4 w-4 text-indigo-600" />
                    Upload License Document (PDF / Image)
                  </label>
                )}
              </div>

              {/* GST Document */}
              <div data-field="gstDocumentUrl" className="border border-gray-200/70 rounded-xl p-4 bg-slate-50/50">
                <span className="block text-sm font-medium text-gray-700 mb-1.5">
                  GST Document
                </span>
                <input
                  type="file"
                  ref={gstInputRef}
                  accept=".pdf,image/*"
                  onChange={handleGstUpload}
                  className="hidden"
                  id="gst-doc-file"
                />
                {gstName ? (
                  <div className="flex items-center justify-between bg-indigo-50/80 p-3 rounded-xl border border-indigo-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                      <span className="text-xs font-medium text-indigo-900 truncate">{gstName}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => openDocumentPreview(gstPreviewUrl || formData.gstDocumentUrl, 'GST Document', gstName)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors shadow-sm"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={removeGst}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete document"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="gst-doc-file"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-xl text-xs font-semibold text-gray-600 hover:border-indigo-400 hover:bg-white cursor-pointer w-full transition-colors bg-white shadow-sm"
                  >
                    <Upload className="h-4 w-4 text-indigo-600" />
                    Upload GST Document (PDF / Image)
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Specialties Card */}
          <div data-field="specialties" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Check className="h-5 w-5 mr-2 text-indigo-600" />
                Specialties
              </h3>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                {formData.specialties.length} selected
              </span>
            </div>

            {/* Specialties grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1">
              {availableSpecialties.map((specialty) => {
                const isSelected = formData.specialties.includes(specialty);
                return (
                  <button
                    key={specialty}
                    type="button"
                    onClick={() => toggleSpecialty(specialty)}
                    className={`inline-flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all text-left border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-200'
                        : 'bg-gray-50/60 text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40'
                    }`}
                  >
                    <span className="truncate mr-1">{specialty}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Specialty input */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                placeholder="Add custom specialty (e.g. Ayurveda, Homeopathy)..."
                value={customSpecialty}
                onChange={(e) => setCustomSpecialty(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSpecialty();
                  }
                }}
                className="flex-1 px-3.5 py-2 text-xs bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <button
                type="button"
                onClick={handleAddCustomSpecialty}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-800 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
          </div>

          {/* Availability & Hours Card */}
          <div data-field="openingHours" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-indigo-600" />
                Availability & Hours
              </h3>

              {/* 24/7 Button Switch (Clean, zero blur, isolated) */}
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-gray-700">24/7 Available</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.is24x7}
                  onClick={() => handleInputChange('is24x7', !formData.is24x7)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.is24x7 ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      formData.is24x7 ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {formData.is24x7 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 font-semibold flex items-center gap-2.5">
                <Clock className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span>Clinic operates 24 Hours, 7 Days a Week</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {DAYS_OF_WEEK.map((day) => {
                  const schedule = formData.openingHours[day] || { open: '', close: '', closed: false };
                  return (
                    <div
                      key={day}
                      className={`grid grid-cols-12 items-center gap-3 px-4 py-2.5 rounded-xl border text-sm transition-all ${
                        schedule.closed
                          ? 'bg-gray-50/80 border-gray-200 text-gray-400'
                          : 'bg-white border-gray-200 text-gray-800'
                      }`}
                    >
                      <span className="col-span-3 font-medium capitalize">
                        {day}
                      </span>
                      <div className="col-span-6 sm:col-span-7 flex items-center gap-2">
                        <input
                          type="time"
                          disabled={schedule.closed}
                          value={schedule.open || ''}
                          onChange={(e) => handleHourChange(day, 'open', e.target.value)}
                          className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                        />
                        <span className="text-gray-400 font-medium">-</span>
                        <input
                          type="time"
                          disabled={schedule.closed}
                          value={schedule.close || ''}
                          onChange={(e) => handleHourChange(day, 'close', e.target.value)}
                          className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-2 text-right">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={Boolean(schedule.closed)}
                            onChange={() => toggleDayClosed(day)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                          <span className="text-xs text-gray-500 font-medium">Closed</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Module Configuration Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-indigo-600" />
                  Module Configuration
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enable or disable specialized clinic modules for this new clinic.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Lab Module Toggle */}
              <div 
                onClick={() => handleInputChange('enableLab', !formData.enableLab)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  formData.enableLab 
                    ? 'border-indigo-300 bg-indigo-50/40 shadow-sm' 
                    : 'border-gray-200 bg-gray-50/40 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  id="enableLab"
                  checked={Boolean(formData.enableLab)}
                  onChange={(e) => handleInputChange('enableLab', e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="enableLab" className="block text-sm font-semibold text-gray-900 cursor-pointer">
                    Diagnostic Lab Module
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    Enables diagnostic lab test orders, catalog browsing, and lab integration for clinic staff.
                  </p>
                </div>
              </div>

              {/* IPD Module Toggle */}
              <div 
                onClick={() => handleInputChange('enableIpd', !formData.enableIpd)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  formData.enableIpd 
                    ? 'border-emerald-300 bg-emerald-50/40 shadow-sm' 
                    : 'border-gray-200 bg-gray-50/40 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  id="enableIpd"
                  checked={Boolean(formData.enableIpd)}
                  onChange={(e) => handleInputChange('enableIpd', e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="enableIpd" className="block text-sm font-semibold text-gray-900 cursor-pointer">
                    IPD, Bed &amp; Nurse Management
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    Enables in-patient ward management, bed tracking, and nurse staff management for this clinic.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Clinic Login Account Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Lock className="h-5 w-5 mr-2 text-indigo-600" />
              Clinic Login Account
            </h3>
            <p className="text-xs text-gray-500 -mt-2">
              These credentials will allow the clinic administrator to immediately log in and manage their clinic dashboard.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="loginEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Login Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    id="loginEmail"
                    data-field="loginEmail"
                    type="email"
                    name="clinic_auth_login_email"
                    autoComplete="off"
                    value={formData.loginEmail}
                    onChange={(e) => handleInputChange('loginEmail', e.target.value)}
                    onBlur={() => handleEmailBlur('loginEmail')}
                    className={`w-full pl-9 pr-3 py-2 bg-gray-50/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                      errors.loginEmail ? 'border-red-300' : 'border-gray-200/50'
                    }`}
                    placeholder="clinic-admin@example.com"
                  />
                </div>
                {errors.loginEmail && <p className="text-red-500 text-xs mt-1">{errors.loginEmail}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    id="password"
                    data-field="password"
                    type={showPassword ? 'text' : 'password'}
                    name="clinic_admin_new_password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full pl-9 pr-10 py-2 bg-gray-50/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                      errors.password ? 'border-red-300' : 'border-gray-200/50'
                    }`}
                    placeholder="Min 8 chars, Aa1@..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
            </div>
          </div>

          {/* Page Actions Footer */}
          <div className="flex justify-end space-x-4 pt-4 pb-12">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => router.push('/admin/clinics-manage')}
              className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium text-sm shadow-md hover:shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Creating Clinic...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Clinic
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
          onClick={closePreviewModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate pr-4">
                {previewModal.title}
              </h3>
              <button
                type="button"
                onClick={closePreviewModal}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50/70 min-h-[300px]">
              {previewModal.isPdf ? (
                <iframe
                  src={previewModal.fileUrl}
                  title={previewModal.title}
                  className="w-full h-[70vh] rounded-lg border border-gray-200 bg-white"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full max-h-[70vh]">
                  <img
                    src={previewModal.fileUrl}
                    alt={previewModal.title}
                    className="max-h-[70vh] max-w-full w-auto h-auto object-contain rounded-lg shadow-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
