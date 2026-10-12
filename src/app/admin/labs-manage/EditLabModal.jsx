'use client';

import { useState, useRef, useEffect } from 'react';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import { formatTitleCase } from '@/utils/nameFormatting';
import {
  validatePhoneNumber,
  handlePhoneKeyDown,
  validateEmail,
  validatePostalCode,
  handlePostalCodeKeyDown
} from '@/utils/phoneValidation';
import {
  FlaskConical,
  X,
  Upload,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Building2,
  FileText,
  Award,
  Home,
  AlertCircle,
  Save,
  Globe
} from 'lucide-react';

const LAB_TYPES = [
  { value: 'diagnostic', label: 'Multi-disciplinary Diagnostic Center' },
  { value: 'pathology', label: 'Clinical Pathology Laboratory' },
  { value: 'radiology', label: 'Radiology & Imaging Center' },
  { value: 'molecular', label: 'Molecular Genetics & Microbiology' },
  { value: 'biochemistry', label: 'Clinical Biochemistry & Immunology' }
];

export default function EditLabModal({ isOpen, onClose, lab, onLabUpdated }) {
  if (!isOpen || !lab) return null;

  const labId = lab._id || lab.id;

  const [formData, setFormData] = useState({
    labName: lab.labName || lab.lab_name || '',
    labType: lab.labType || lab.lab_type || 'diagnostic',
    description: lab.description || '',
    phone: lab.phone || '',
    email: lab.contactEmail || lab.email || '',
    website: lab.website || '',
    address: lab.address || '',
    city: lab.city || '',
    state: lab.state || '',
    postalCode: lab.postalCode || lab.postal_code || '',
    country: lab.country || 'India',
    registrationNumber: lab.registrationNumber || lab.registration_number || '',
    taxId: lab.taxId || lab.tax_id || '',
    nablAccredited: Boolean(lab.nablAccredited ?? lab.nabl_accredited),
    homeCollectionAvailable: Boolean(lab.homeCollectionAvailable ?? lab.home_collection_available),
    status: lab.status || 'active'
  });

  const [initialLogoUrl] = useState(lab.logo || null);
  const [logoPreview, setLogoPreview] = useState(lab.logo || null);
  const [selectedLogoFile, setSelectedLogoFile] = useState(null);
  const [isLogoRemoved, setIsLogoRemoved] = useState(false);

  const [errors, setErrors] = useState({});
  const [formGeneralError, setFormGeneralError] = useState('');
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const logoInputRef = useRef(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));

    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, logo: 'Please select a valid image file (PNG, JPG, WEBP).' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, logo: 'Logo must be smaller than 5MB.' }));
      return;
    }

    setSelectedLogoFile(file);
    setIsLogoRemoved(false);
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
    setIsLogoRemoved(true);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.labName.trim()) newErrors.labName = 'Lab Name is required';

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const phoneErr = validatePhoneNumber(formData.phone);
      if (phoneErr) newErrors.phone = phoneErr;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Contact Email is required';
    } else {
      const emailErr = validateEmail(formData.email);
      if (emailErr) newErrors.email = emailErr;
    }

    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required';
    } else {
      const postalErr = validatePostalCode(formData.postalCode);
      if (postalErr) newErrors.postalCode = postalErr;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setFormGeneralError('Please fix the highlighted errors before saving.');
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
      let finalLogoUrl = isLogoRemoved ? null : (initialLogoUrl || null);

      // If user selected a new file, upload to /api/upload
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
            throw new Error(uploadJson.error || 'Failed to upload laboratory logo.');
          }
          finalLogoUrl = uploadJson.url;
        } catch (uploadErr) {
          console.error('Logo upload error:', uploadErr);
          setApiError(uploadErr.message || 'Logo upload failed. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }

      const payload = {
        labName: formatTitleCase(formData.labName),
        lab_name: formatTitleCase(formData.labName),
        labType: formData.labType,
        lab_type: formData.labType,
        description: formData.description.trim() ? formData.description.trim() : null,
        logo: finalLogoUrl,
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        website: formData.website.trim() ? formData.website.trim() : null,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim(),
        postal_code: formData.postalCode.trim(),
        country: formData.country.trim() || 'India',
        registrationNumber: formData.registrationNumber.trim() ? formData.registrationNumber.trim() : null,
        registration_number: formData.registrationNumber.trim() ? formData.registrationNumber.trim() : null,
        taxId: formData.taxId.trim() ? formData.taxId.trim() : null,
        tax_id: formData.taxId.trim() ? formData.taxId.trim() : null,
        nablAccredited: formData.nablAccredited,
        nabl_accredited: formData.nablAccredited,
        homeCollectionAvailable: formData.homeCollectionAvailable,
        home_collection_available: formData.homeCollectionAvailable,
        status: formData.status
      };

      const updateUrl = `${API_BASE_URL}/api/v1/lab/update-by-id/${labId}`;
      const res = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });

      const resJson = await res.json().catch(() => ({}));

      if (!res.ok || !resJson.success) {
        throw new Error(resJson.error || resJson.message || 'Failed to update laboratory record.');
      }

      const updatedLab = resJson.data?.lab || resJson.lab || { ...lab, ...payload, id: labId, _id: labId };
      onLabUpdated(updatedLab);
      onClose();
    } catch (err) {
      console.error('Update lab error:', err);
      setApiError(err.message || 'An unexpected error occurred while updating the lab.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const initial = (formatTitleCase(formData.labName) || 'L').charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[720px] max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex-shrink-0 flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200 z-10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">Edit Laboratory</h2>
              <p className="text-xs text-gray-500">Update facility information and settings</p>
            </div>
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* General/API Error alerts */}
          {(formGeneralError || apiError) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700 text-xs">
              <AlertCircle className="h-4 w-4 mr-2 text-red-500 shrink-0" />
              <span>{apiError || formGeneralError}</span>
            </div>
          )}

          <form id="edit-lab-form" onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Logo Section */}
            <div className="bg-slate-50/80 p-4.5 rounded-xl border border-slate-200/70">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-teal-600" />
                Laboratory Logo
              </h3>

              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-xl bg-white border border-teal-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-xs">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Lab logo preview" className="w-full h-full object-contain p-1" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                      <span className="text-white text-xl font-bold">{initial}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 border border-teal-200/60"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {logoPreview ? 'Change Logo' : 'Upload Logo'}
                    </button>
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 border border-rose-200/60"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400">PNG, JPG, or WEBP up to 5MB. Square recommended.</p>
                  {errors.logo && <p className="text-xs text-rose-600 mt-0.5">{errors.logo}</p>}
                </div>
              </div>
            </div>

            {/* 2. Basic Facility Information */}
            <div className="bg-white p-4.5 rounded-xl border border-gray-200 shadow-xs space-y-3.5">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                Facility Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Lab Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="labName"
                    value={formData.labName}
                    onChange={handleInputChange}
                    placeholder="e.g. Apex Diagnostics Center"
                    className={`w-full px-3.5 py-2 border rounded-xl text-sm transition-colors ${
                      errors.labName ? 'border-rose-400 focus:ring-rose-500' : 'border-gray-200 focus:ring-teal-500'
                    }`}
                  />
                  {errors.labName && <p className="text-xs text-rose-600 mt-1">{errors.labName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Facility Type
                  </label>
                  <select
                    name="labType"
                    value={formData.labType}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-teal-500 bg-white"
                  >
                    {LAB_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Description / Overview
                </label>
                <textarea
                  name="description"
                  rows={2}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide an overview of diagnostics facilities, specialties, and equipment..."
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-teal-500"
                />
              </div>
            </div>

            {/* 3. Contact & Communication */}
            <div className="bg-white p-4.5 rounded-xl border border-gray-200 shadow-xs space-y-3.5">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                Contact & Communication
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Helpline / Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    onKeyDown={handlePhoneKeyDown}
                    placeholder="e.g. +91 9876543210"
                    className={`w-full px-3.5 py-2 border rounded-xl text-sm transition-colors ${
                      errors.phone ? 'border-rose-400 focus:ring-rose-500' : 'border-gray-200 focus:ring-teal-500'
                    }`}
                  />
                  {errors.phone && <p className="text-xs text-rose-600 mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Contact Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="contact@lab.com"
                    className={`w-full px-3.5 py-2 border rounded-xl text-sm transition-colors ${
                      errors.email ? 'border-rose-400 focus:ring-rose-500' : 'border-gray-200 focus:ring-teal-500'
                    }`}
                  />
                  {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Website URL
                  </label>
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://apexlab.com"
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Login Email info badge - strictly read-only */}
              {lab.login_email && (
                <div className="pt-1 text-xs text-gray-500 flex items-center gap-1.5">
                  <span className="font-semibold text-gray-600">Login Account:</span>
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[11px]">
                    {lab.login_email}
                  </span>
                  <span className="text-gray-400 italic">(Login credentials are managed independently)</span>
                </div>
              )}
            </div>

            {/* 4. Premises Address & Location */}
            <div className="bg-white p-4.5 rounded-xl border border-gray-200 shadow-xs space-y-3.5">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                Premises Address & Location
              </h3>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Street Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="e.g. Ground Floor, City Center Mall, MG Road"
                  className={`w-full px-3.5 py-2 border rounded-xl text-sm transition-colors ${
                    errors.address ? 'border-rose-400 focus:ring-rose-500' : 'border-gray-200 focus:ring-teal-500'
                  }`}
                />
                {errors.address && <p className="text-xs text-rose-600 mt-1">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Mumbai"
                    className={`w-full px-3.5 py-2 border rounded-xl text-sm transition-colors ${
                      errors.city ? 'border-rose-400 focus:ring-rose-500' : 'border-gray-200 focus:ring-teal-500'
                    }`}
                  />
                  {errors.city && <p className="text-xs text-rose-600 mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="e.g. Maharashtra"
                    className={`w-full px-3.5 py-2 border rounded-xl text-sm transition-colors ${
                      errors.state ? 'border-rose-400 focus:ring-rose-500' : 'border-gray-200 focus:ring-teal-500'
                    }`}
                  />
                  {errors.state && <p className="text-xs text-rose-600 mt-1">{errors.state}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Postal Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    onKeyDown={handlePostalCodeKeyDown}
                    placeholder="e.g. 400001"
                    className={`w-full px-3.5 py-2 border rounded-xl text-sm transition-colors ${
                      errors.postalCode ? 'border-rose-400 focus:ring-rose-500' : 'border-gray-200 focus:ring-teal-500'
                    }`}
                  />
                  {errors.postalCode && <p className="text-xs text-rose-600 mt-1">{errors.postalCode}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* 5. Registration, Accreditation & Status */}
            <div className="bg-white p-4.5 rounded-xl border border-gray-200 shadow-xs space-y-3.5">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                Registration & Settings
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. MH/LAB/2026/01"
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    GSTIN / Tax ID
                  </label>
                  <input
                    type="text"
                    name="taxId"
                    value={formData.taxId}
                    onChange={handleInputChange}
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-teal-500 bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-6 border-t border-gray-100">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="nablAccredited"
                    checked={formData.nablAccredited}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                  />
                  <span className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-blue-600" />
                    NABL Accredited Facility
                  </span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="homeCollectionAvailable"
                    checked={formData.homeCollectionAvailable}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                  />
                  <span className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                    <Home className="w-3.5 h-3.5 text-purple-600" />
                    Home Sample Collection Available
                  </span>
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end items-center gap-3 z-10">
          <button
            type="submit"
            form="edit-lab-form"
            disabled={isSubmitting}
            className="inline-flex items-center px-5 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl text-sm font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all shadow-sm hover:shadow-md disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1.5" />
                Save Changes
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-white transition-colors shadow-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
