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
import { formatTitleCase } from '@/utils/nameFormatting';
import {
  ArrowLeft,
  Building2,
  Upload,
  X,
  Plus,
  Trash2,
  FileText,
  MapPin,
  Lock,
  Mail,
  Phone,
  Globe,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  Save,
  CheckCircle,
  FlaskConical,
  Award,
  Truck
} from 'lucide-react';

const LAB_TYPES = [
  { value: 'diagnostic', label: 'Multi-disciplinary Diagnostic Center' },
  { value: 'pathology', label: 'Clinical Pathology Laboratory' },
  { value: 'radiology', label: 'Radiology & Imaging Center' },
  { value: 'molecular', label: 'Molecular Genetics & Microbiology' },
  { value: 'biochemistry', label: 'Clinical Biochemistry & Immunology' }
];

export default function AddLabPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    labName: '',
    labType: 'diagnostic',
    description: '',
    phone: '',
    email: '',
    loginEmail: '',
    website: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    registrationNumber: '',
    taxId: '',
    nablAccredited: false,
    homeCollectionAvailable: false,
    password: ''
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formGeneralError, setFormGeneralError] = useState('');
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const logoInputRef = useRef(null);

  // Field refs for auto-scroll to first invalid field on submit
  const fieldRefs = useRef({});
  const setFieldRef = (name) => (el) => { if (el) fieldRefs.current[name] = el; };

  // Strong password regex: 8+ chars, uppercase, lowercase, digit, special char
  const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
  const PASSWORD_HINT = 'Min. 8 characters with uppercase, lowercase, number & special character (e.g. Labadmin@123)';

  // Per-field validators — returns error string or null
  const revalidateField = (name, value) => {
    switch (name) {
      case 'phone': {
        if (!value.trim()) return 'Phone number is required';
        return validatePhoneNumber(value) || null;
      }
      case 'email': {
        if (!value.trim()) return 'Contact Email is required';
        return validateEmail(value) || null;
      }
      case 'loginEmail': {
        if (!value.trim()) return 'Login Email is required';
        return validateEmail(value) || null;
      }
      case 'postalCode': {
        if (!value.trim()) return 'Postal code is required';
        return validatePostalCode(value) || null;
      }
      case 'labName':  return value.trim() ? null : 'Lab Name is required';
      case 'address':  return value.trim() ? null : 'Address is required';
      case 'city':     return value.trim() ? null : 'City is required';
      case 'state':    return value.trim() ? null : 'State is required';
      case 'password': {
        if (!value) return 'Password is required';
        if (!STRONG_PASSWORD_REGEX.test(value)) {
          return PASSWORD_HINT;
        }
        return null;
      }
      default: return null;
    }
  };

  // onChange: only update state; if the field already has an error, clear it when valid
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));

    // Only clear an existing error once the field becomes valid — never add new errors on typing
    if (type !== 'checkbox' && errors[name]) {
      const fieldErr = revalidateField(name, newValue);
      if (!fieldErr) {
        setErrors(prev => {
          const next = { ...prev };
          delete next[name];
          if (Object.keys(next).length === 0) setFormGeneralError('');
          return next;
        });
      }
    }
  };

  // onBlur: validate the field and show error only after the user leaves it
  const handleBlur = (e) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') return;
    const fieldErr = revalidateField(name, value);
    setErrors(prev => {
      const next = { ...prev };
      if (fieldErr) {
        next[name] = fieldErr;
      } else {
        delete next[name];
      }
      if (Object.keys(next).length === 0) setFormGeneralError('');
      return next;
    });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, logo: 'Please select a valid image file (PNG, JPG, WEBP).' }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, logo: 'Logo must be smaller than 2MB.' }));
      return;
    }

    setSelectedLogoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
    setErrors(prev => {
      const next = { ...prev };
      delete next.logo;
      return next;
    });
  };

  const removeLogo = () => {
    if (logoPreview && logoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview);
    }
    setSelectedLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  // Field order mirrors top-to-bottom form layout — used for first-invalid scroll
  const FIELD_ORDER = [
    'labName', 'phone', 'email', 'address', 'city', 'state', 'postalCode',
    'loginEmail', 'password'
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.labName.trim()) newErrors.labName = 'Lab Name is required';

    // phone — helpers return null (valid) or error string (invalid)
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const phoneErr = validatePhoneNumber(formData.phone);
      if (phoneErr) newErrors.phone = phoneErr;
    }

    // contact email
    if (!formData.email.trim()) {
      newErrors.email = 'Contact Email is required';
    } else {
      const emailErr = validateEmail(formData.email);
      if (emailErr) newErrors.email = emailErr;
    }

    // login email
    if (!formData.loginEmail.trim()) {
      newErrors.loginEmail = 'Login Email is required';
    } else {
      const loginEmailErr = validateEmail(formData.loginEmail);
      if (loginEmailErr) newErrors.loginEmail = loginEmailErr;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!STRONG_PASSWORD_REGEX.test(formData.password)) {
      newErrors.password = PASSWORD_HINT;
    }

    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';

    // postal code
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required';
    } else {
      const postalErr = validatePostalCode(formData.postalCode);
      if (postalErr) newErrors.postalCode = postalErr;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setFormGeneralError('Please fill in all required fields correctly before submitting.');

      // Scroll & focus the first invalid field (top-to-bottom order)
      const firstInvalidKey = FIELD_ORDER.find((key) => newErrors[key]);
      if (firstInvalidKey && fieldRefs.current[firstInvalidKey]) {
        const el = fieldRefs.current[firstInvalidKey];
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        try { el.focus(); } catch (_) {}
      }

      return false;
    }

    setFormGeneralError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      let uploadedLogoUrl = null;

      // Upload logo if provided
      if (selectedLogoFile) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append('file', selectedLogoFile);
          uploadFormData.append('folder', 'lab-logos');

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData
          });

          const uploadJson = await uploadRes.json().catch(() => ({}));
          if (!uploadRes.ok || !uploadJson.url) {
            throw new Error(uploadJson.error || 'Failed to upload laboratory logo. Please try again.');
          }
          uploadedLogoUrl = uploadJson.url;
        } catch (uploadErr) {
          console.error('Logo upload failed:', uploadErr);
          setApiError(uploadErr.message || 'Logo upload failed. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }

      const payload = {
        labName: formatTitleCase(formData.labName),
        labType: formData.labType,
        description: formData.description.trim(),
        logo: uploadedLogoUrl,
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        loginEmail: formData.loginEmail.trim().toLowerCase(),
        password: formData.password,
        website: formData.website.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim(),
        country: formData.country.trim() || 'India',
        registrationNumber: formData.registrationNumber.trim() || null,
        taxId: formData.taxId.trim() || null,
        nablAccredited: formData.nablAccredited,
        homeCollectionAvailable: formData.homeCollectionAvailable,
        role: 'lab',
        status: 'active'
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/lab/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });

      const resJson = await res.json().catch(() => ({}));

      if (!res.ok || !resJson.success) {
        throw new Error(resJson.message || resJson.error || 'Failed to register lab account.');
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        router.push('/admin?labAdded=true');
      }, 1500);
    } catch (err) {
      console.error('Create lab error:', err);
      setApiError(err.message || 'An error occurred while creating the lab account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm max-w-md w-full text-center">
          <div className="h-20 w-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Lab Created Successfully!</h2>
          <p className="text-gray-600 mb-6">
            <span className="font-semibold text-gray-900">{formData.labName}</span> has been registered and activated. The lab can now log in using <span className="font-medium text-gray-800">{formData.loginEmail}</span>.
          </p>
          <div className="flex justify-center">
            <Link
              href="/admin/labs-manage"
              className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-medium shadow-md hover:from-teal-700 hover:to-cyan-700 transition-all text-sm"
            >
              Return to Labs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Page Header with Back Navigation */}
        <div>
          <Link
            href="/admin/labs-manage"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-3 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Labs</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Lab</h1>
          <p className="text-gray-600 mt-1">Register a new independent laboratory facility in ClinicPro</p>
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

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Lab Identity & Logo */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FlaskConical className="h-5 w-5 mr-2 text-teal-600" />
              Lab Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Logo Upload — balanced left column */}
              <div className="md:col-span-1 flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Lab Logo</label>
                <div className="flex-1 flex flex-col items-center justify-center p-4 border border-dashed border-gray-200 hover:border-teal-300 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors text-center">
                  {logoPreview ? (
                    <div className="flex flex-col items-center">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-xs mb-2.5 flex items-center justify-center">
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-1.5" />
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                          title="Remove Logo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-3 py-1 text-xs font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors border border-teal-200"
                      >
                        Change Logo
                      </button>
                      <p className="text-[11px] text-gray-400 mt-1">PNG, JPG, WEBP &mdash; max 2MB</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 mb-2">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-medium text-gray-700 mb-0.5">Upload Logo</p>
                      <p className="text-[11px] text-gray-400 mb-2.5">PNG, JPG, WEBP &mdash; max 2MB</p>
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors border border-teal-200"
                      >
                        Browse File
                      </button>
                    </div>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </div>
                {errors.logo && <p className="text-xs text-red-500 mt-1">{errors.logo}</p>}
              </div>

              {/* Basic Fields */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lab Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={setFieldRef('labName')}
                    type="text"
                    name="labName"
                    value={formData.labName}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="e.g. Apex Diagnostics & Pathology Laboratory"
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                      errors.labName ? 'border-red-400 bg-red-50/20' : 'border-gray-200'
                    }`}
                  />
                  {errors.labName && <p className="text-xs text-red-500 mt-1">{errors.labName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facility Type</label>
                  <select
                    name="labType"
                    value={formData.labType}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {LAB_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={2}
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of laboratory diagnostic capabilities and specializations..."
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Phone className="h-5 w-5 mr-2 text-teal-600" />
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Helpline / Phone <span className="text-red-500">*</span>
                </label>
                <input
                  ref={setFieldRef('phone')}
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  onKeyDown={handlePhoneKeyDown}
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                    errors.phone ? 'border-red-400 bg-red-50/20' : 'border-gray-200'
                  }`}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email <span className="text-red-500">*</span>
                </label>
                <input
                  ref={setFieldRef('email')}
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="lab@example.com"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                    errors.email ? 'border-red-400 bg-red-50/20' : 'border-gray-200'
                  }`}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website (Optional)</label>
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://labname.com"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Premises Address <span className="text-red-500">*</span>
                </label>
                <input
                  ref={setFieldRef('address')}
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Unit / Floor, Building Name, Street / Area"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                    errors.address ? 'border-red-400 bg-red-50/20' : 'border-gray-200'
                  }`}
                />
                {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  ref={setFieldRef('city')}
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="City"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                    errors.city ? 'border-red-400 bg-red-50/20' : 'border-gray-200'
                  }`}
                />
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  ref={setFieldRef('state')}
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="State"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                    errors.state ? 'border-red-400 bg-red-50/20' : 'border-gray-200'
                  }`}
                />
                {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PIN Code <span className="text-red-500">*</span>
                </label>
                <input
                  ref={setFieldRef('postalCode')}
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  onKeyDown={handlePostalCodeKeyDown}
                  maxLength={6}
                  placeholder="6-digit PIN code"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                    errors.postalCode ? 'border-red-400 bg-red-50/20' : 'border-gray-200'
                  }`}
                />
                {errors.postalCode && <p className="text-xs text-red-500 mt-1">{errors.postalCode}</p>}
              </div>
            </div>
          </div>

          {/* Business, Registration & Operating Model */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2 text-teal-600" />
              Registration & Accreditations
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Number (Optional)
                </label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleInputChange}
                  placeholder="Clinical Establishment Reg. No."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GSTIN / Tax ID (Optional)
                </label>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleInputChange}
                  placeholder="GSTIN"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <label className="flex items-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  name="nablAccredited"
                  checked={formData.nablAccredited}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-900 block">NABL Accredited Facility</span>
                  <span className="text-xs text-gray-500">Facility holds official NABL certification</span>
                </div>
              </label>

              <label className="flex items-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  name="homeCollectionAvailable"
                  checked={formData.homeCollectionAvailable}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-900 block">Home Sample Collection</span>
                  <span className="text-xs text-gray-500">Phlebotomist visits patient home for sample collection</span>
                </div>
              </label>
            </div>
          </div>

          {/* Portal Login Credentials */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center">
              <Lock className="h-5 w-5 mr-2 text-teal-600" />
              Lab Portal Login Credentials
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              These credentials will be used by the laboratory administrator to log in from the main ClinicPro login page.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Login Email <span className="text-red-500">*</span>
                </label>
                <input
                  ref={setFieldRef('loginEmail')}
                  type="email"
                  name="loginEmail"
                  value={formData.loginEmail}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  autoComplete="off"
                  placeholder="admin@labdomain.com"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                    errors.loginEmail ? 'border-red-400 bg-red-50/20' : 'border-gray-200'
                  }`}
                />
                {errors.loginEmail && <p className="text-xs text-red-500 mt-1">{errors.loginEmail}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={setFieldRef('password')}
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    autoComplete="new-password"
                    placeholder="Enter a strong password"
                    className={`w-full px-3.5 py-2.5 pr-10 border rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                      errors.password ? 'border-red-400 bg-red-50/20' : 'border-gray-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password
                  ? <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                  : <p className="text-xs text-gray-400 mt-1">8+ chars, uppercase, lowercase, number &amp; special character</p>
                }
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/admin/labs-manage"
              className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-6 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-medium text-sm rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Lab...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Lab Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
