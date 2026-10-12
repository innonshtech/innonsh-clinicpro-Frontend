'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/utils/api';
import { validatePhoneNumber, handlePhoneKeyDown, validateDoctorEmail } from '@/utils/phoneValidation';
import { formatTitleCase } from '@/utils/nameFormatting';
import {
  ArrowLeft,
  Upload,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Stethoscope,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  FileText,
  Clock,
  PhoneCall,
  Building,
  Plus,
  Trash2
} from 'lucide-react';

export default function ClinicAddDoctorPage() {
  const router = useRouter();

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    specialty: '',
    supSpeciality: '',
    department: '',
    experience: '',
    licenseNumber: '',
    dateOfBirth: '',
    gender: '',
    qualification: '',
    qualifications: [''],
    consultationFee: '',
    address: '',
    location: '',
    bio: '',
    emergencyContact: '',
    emergencyPhone: '',
    emergencyRelationship: '',
    sessionTime: '30 mins',
    availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    availableStartTime: '09:00',
    availableEndTime: '17:00'
  });

  // Logged-in Clinic Context State
  const [clinicInfo, setClinicInfo] = useState({
    id: '',
    name: '',
    address: '',
    city: '',
    phone: '',
    fullAddress: ''
  });
  const [isClinicLoading, setIsClinicLoading] = useState(true);

  // File Upload State
  const [profileImage, setProfileImage] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedIdentityFile, setSelectedIdentityFile] = useState(null);
  const [identityPreviewName, setIdentityPreviewName] = useState('');
  const [identityPreviewUrl, setIdentityPreviewUrl] = useState(null);
  const [selectedDegreeFile, setSelectedDegreeFile] = useState(null);
  const [degreePreviewName, setDegreePreviewName] = useState('');
  const [degreePreviewUrl, setDegreePreviewUrl] = useState(null);

  // Preview Modal
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    title: '',
    fileUrl: '',
    isPdf: false
  });

  // UI / Validation State
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formGeneralError, setFormGeneralError] = useState('');
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Constants
  const specialties = [
    'Cardiology', 'Dermatology', 'Endocrinology', 'ENT', 'Gastroenterology',
    'General Medicine', 'Gynecology', 'Hematology', 'Neurology', 'Oncology',
    'Ophthalmology', 'Orthopedics', 'Pediatrics', 'Psychiatry', 'Radiology',
    'Surgery', 'Urology', 'Anesthesiology'
  ];

  const departments = [
    'Outpatient (OPD)', 'Emergency', 'ICU', 'General Medicine', 'Surgery',
    'Pediatrics', 'Cardiology', 'Orthopedics', 'Radiology', 'Laboratory', 'Maternity'
  ];

  const sessionTimeOptions = [
    '15 mins', '20 mins', '30 mins', '45 mins', '60 mins'
  ];

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Fetch logged-in clinic information on mount
  useEffect(() => {
    const loadClinicProfile = async () => {
      try {
        const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        if (!userStr) {
          setIsClinicLoading(false);
          return;
        }

        const user = JSON.parse(userStr);
        const clinicId = user.id || user.clinicId;

        if (!clinicId) {
          setIsClinicLoading(false);
          return;
        }

        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/v1/clinic/fetchProfileData/${clinicId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (res.ok) {
          const resData = await res.json();
          if (resData.success && resData.data?.clinic) {
            const c = resData.data.clinic;
            const fullAddr = [c.address, c.city, c.state, c.country, c.postalCode]
              .filter(Boolean)
              .join(', ');

            setClinicInfo({
              id: clinicId,
              name: c.clinicName || c.name || user.name || 'Your Clinic',
              address: c.address || '',
              city: c.city || '',
              phone: c.phone || '',
              fullAddress: fullAddr || c.address || ''
            });
          } else {
            // Fallback to basic user session data
            setClinicInfo({
              id: clinicId,
              name: user.name || 'Your Clinic',
              address: '',
              city: '',
              phone: '',
              fullAddress: ''
            });
          }
        } else {
          setClinicInfo(prev => ({
            ...prev,
            id: clinicId,
            name: user.name || 'Your Clinic'
          }));
        }
      } catch (err) {
        console.error('Error fetching clinic profile:', err);
      } finally {
        setIsClinicLoading(false);
      }
    };

    loadClinicProfile();
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (identityPreviewUrl) URL.revokeObjectURL(identityPreviewUrl);
      if (degreePreviewUrl) URL.revokeObjectURL(degreePreviewUrl);
    };
  }, [identityPreviewUrl, degreePreviewUrl]);

  // Modal keyboard handling
  useEffect(() => {
    if (!previewModal.isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closePreviewModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewModal.isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        if (Object.keys(next).length === 0) setFormGeneralError('');
        return next;
      });
    }
    if (apiError) setApiError('');
  };

  // Additional Qualifications Handlers
  const handleAddQualification = () => {
    setFormData(prev => ({
      ...prev,
      qualifications: [...prev.qualifications, '']
    }));
  };

  const handleQualificationChange = (index, value) => {
    setFormData(prev => {
      const updated = [...prev.qualifications];
      updated[index] = value;
      return { ...prev, qualifications: updated };
    });
  };

  const handleRemoveQualification = (index) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index)
    }));
  };

  // Profile Image Handlers
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setProfileImage(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Document Handlers
  const isPdfFile = (file) => {
    if (!file) return false;
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleIdentityProofChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (identityPreviewUrl) URL.revokeObjectURL(identityPreviewUrl);
      setSelectedIdentityFile(file);
      setIdentityPreviewName(file.name);
      setIdentityPreviewUrl(URL.createObjectURL(file));
    }
    e.target.value = '';
  };

  const handleRemoveIdentityProof = () => {
    if (identityPreviewUrl) URL.revokeObjectURL(identityPreviewUrl);
    setSelectedIdentityFile(null);
    setIdentityPreviewName('');
    setIdentityPreviewUrl(null);
    if (previewModal.isOpen && previewModal.title.includes('Identity Proof')) {
      closePreviewModal();
    }
  };

  const handleDegreeCertificateChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (degreePreviewUrl) URL.revokeObjectURL(degreePreviewUrl);
      setSelectedDegreeFile(file);
      setDegreePreviewName(file.name);
      setDegreePreviewUrl(URL.createObjectURL(file));
    }
    e.target.value = '';
  };

  const handleRemoveDegreeCertificate = () => {
    if (degreePreviewUrl) URL.revokeObjectURL(degreePreviewUrl);
    setSelectedDegreeFile(null);
    setDegreePreviewName('');
    setDegreePreviewUrl(null);
    if (previewModal.isOpen && previewModal.title.includes('Degree Certificate')) {
      closePreviewModal();
    }
  };

  const openPreviewModal = (file, url, title) => {
    if (!file || !url) return;
    setPreviewModal({
      isOpen: true,
      title: `${title} - ${file.name}`,
      fileUrl: url,
      isPdf: isPdfFile(file)
    });
  };

  const closePreviewModal = () => {
    setPreviewModal(prev => ({ ...prev, isOpen: false, fileUrl: '', title: '', isPdf: false }));
  };

  // Availability Handlers
  const toggleAvailability = (day) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.includes(day)
        ? prev.availability.filter(d => d !== day)
        : [...prev.availability, day]
    }));
  };

  const formatTime12h = (time24) => {
    if (!time24) return '';
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    if (isNaN(h)) return '';
    const m = mStr || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
  };

  // Validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const fieldOrder = [
    'firstName', 'lastName', 'email', 'phone', 'password',
    'specialty', 'experience', 'licenseNumber', 'availableStartTime', 'availableEndTime'
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

    const emailErr = validateDoctorEmail(formData.email, true, 'Email address');
    if (emailErr) newErrors.email = emailErr;

    const phoneErr = validatePhoneNumber(formData.phone, true, 'Phone number');
    if (phoneErr) newErrors.phone = phoneErr;

    if (!formData.password.trim()) {
      newErrors.password = 'Initial password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = 'Password must include uppercase, lowercase, number, and special character (@$!%*?&)';
    }

    if (!formData.specialty) newErrors.specialty = 'Specialty is required';
    if (!String(formData.experience).trim()) newErrors.experience = 'Experience is required';
    if (!formData.licenseNumber.trim()) newErrors.licenseNumber = 'License number is required';

    // Timing validation
    const hasStartTime = Boolean(formData.availableStartTime && formData.availableStartTime.trim());
    const hasEndTime = Boolean(formData.availableEndTime && formData.availableEndTime.trim());

    if (hasStartTime && !hasEndTime) {
      newErrors.availableEndTime = 'Please select an end time';
    } else if (!hasStartTime && hasEndTime) {
      newErrors.availableStartTime = 'Please select a start time';
    } else if (hasStartTime && hasEndTime) {
      if (formData.availableEndTime <= formData.availableStartTime) {
        newErrors.availableEndTime = 'End time must be later than start time';
      }
    }

    if (formData.emergencyPhone?.trim()) {
      const emPhoneErr = validatePhoneNumber(formData.emergencyPhone, false, 'Emergency phone number');
      if (emPhoneErr) newErrors.emergencyPhone = emPhoneErr;
    }

    setErrors(newErrors);

    const errorKeys = Object.keys(newErrors);
    if (errorKeys.length > 0) {
      setFormGeneralError('Please correct the highlighted fields before adding the doctor.');
      const firstInvalid = fieldOrder.find(f => newErrors[f]);
      if (firstInvalid) {
        setTimeout(() => {
          const el = document.getElementById(firstInvalid);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus({ preventScroll: true });
          }
        }, 50);
      }
      return false;
    }

    setFormGeneralError('');
    return true;
  };

  // Submit Handler
  const handleSubmit = async () => {
    setApiError('');
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const user = JSON.parse(userStr || '{}');
      const token = (typeof window !== 'undefined' ? localStorage.getItem('token') : null) || user.token;
      const effectiveClinicId = clinicInfo.id || user.id || user.clinicId;

      if (!effectiveClinicId) {
        throw new Error('Authenticated Clinic session not found. Please log in again.');
      }

      // Upload profile image
      let uploadedImageUrl = null;
      if (selectedImageFile) {
        const uploadData = new FormData();
        uploadData.append('file', selectedImageFile);
        uploadData.append('folder', 'doctor-profiles');
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData,
        });
        const uploadJson = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok || !uploadJson.url) {
          throw new Error(uploadJson.error || 'Failed to upload profile photo.');
        }
        uploadedImageUrl = uploadJson.url;
      }

      // Upload identity proof
      let uploadedIdentityUrl = null;
      if (selectedIdentityFile) {
        const uploadData = new FormData();
        uploadData.append('file', selectedIdentityFile);
        uploadData.append('folder', 'doctor-documents');
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData,
        });
        const uploadJson = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok || !uploadJson.url) {
          throw new Error(uploadJson.error || 'Failed to upload Identity Proof document.');
        }
        uploadedIdentityUrl = uploadJson.url;
      }

      // Upload degree certificate
      let uploadedDegreeUrl = null;
      if (selectedDegreeFile) {
        const uploadData = new FormData();
        uploadData.append('file', selectedDegreeFile);
        uploadData.append('folder', 'doctor-documents');
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData,
        });
        const uploadJson = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok || !uploadJson.url) {
          throw new Error(uploadJson.error || 'Failed to upload Degree Certificate document.');
        }
        uploadedDegreeUrl = uploadJson.url;
      }

      // Build Combined Qualifications List
      const allQualifications = [
        formData.qualification?.trim(),
        ...formData.qualifications.map(q => q?.trim())
      ].filter(Boolean);

      // Unique qualifications array
      const uniqueQualifications = Array.from(new Set(allQualifications));

      // Build Timing String
      const timeString = (formData.availableStartTime && formData.availableEndTime)
        ? `${formatTime12h(formData.availableStartTime)} to ${formatTime12h(formData.availableEndTime)}`
        : '09:00 AM to 05:00 PM';

      // Complete Payload
      const payload = {
        firstName: formatTitleCase(formData.firstName),
        lastName: formatTitleCase(formData.lastName),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        specialty: formData.specialty,
        supSpeciality: formData.supSpeciality?.trim() || null,
        department: formData.department?.trim() || null,
        experience: Number(formData.experience) || 0,
        licenseNumber: formData.licenseNumber?.trim() || null,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        qualification: uniqueQualifications[0] || formData.qualification?.trim() || null,
        qualifications: uniqueQualifications,
        consultantFee: formData.consultationFee ? Number(formData.consultationFee) : null,
        consultationFee: formData.consultationFee ? Number(formData.consultationFee) : null,
        homeAddress: formData.address?.trim() || null,
        address: formData.address?.trim() || null,
        location: formData.location?.trim() || null,
        bio: formData.bio?.trim() || null,
        emergencyContact: formData.emergencyContact?.trim() || null,
        emergencyPhone: formData.emergencyPhone?.trim() || null,
        emergencyRelationship: formData.emergencyRelationship?.trim() || null,
        hospital: clinicInfo.name || null,
        hospitalAddress: clinicInfo.fullAddress || clinicInfo.address || null,
        hospitalNumber: clinicInfo.phone || null,
        city: clinicInfo.city || null,
        sessionTime: formData.sessionTime || '30 mins',
        clinicId: effectiveClinicId,
        available: {
          days: formData.availability,
          time: timeString
        },
        availableDays: formData.availability,
        availableTime: timeString,
        profileImage: uploadedImageUrl || null,
        identityProof: uploadedIdentityUrl || null,
        degreeCertificate: uploadedDegreeUrl || null,
        status: 'active',
        role: 'doctor'
      };

      const response = await fetch(`${API_BASE_URL}/api/v1/clinic/doctor-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok || !resData.success) {
        let serverMsg = resData.message || resData.error || '';

        if ((!serverMsg || serverMsg === 'Validation failed') && resData.data && typeof resData.data === 'object') {
          const detailedIssues = [];
          for (const [fieldKey, fieldObj] of Object.entries(resData.data)) {
            if (fieldObj && Array.isArray(fieldObj._errors) && fieldObj._errors.length > 0) {
              detailedIssues.push(`${fieldKey}: ${fieldObj._errors.join(', ')}`);
            }
          }
          if (detailedIssues.length > 0) {
            serverMsg = detailedIssues.join(' | ');
          }
        }

        if (!serverMsg || serverMsg === 'Validation failed') {
          serverMsg = 'Server rejected the request due to invalid field values.';
        }

        throw new Error(serverMsg);
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        router.push('/clinic/doctors');
      }, 2000);
    } catch (err) {
      console.error('Add doctor error:', err);
      const errMsg = err.message || 'An error occurred while adding the doctor.';
      setApiError(errMsg.startsWith('Unable to add doctor') ? errMsg : `Unable to add doctor: ${errMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm max-w-md w-full text-center animate-in fade-in zoom-in duration-200">
          <div className="h-16 w-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Doctor Added Successfully!</h2>
          <p className="text-gray-600 mb-4">
            Dr. {formData.firstName} {formData.lastName} has been registered under {clinicInfo.name || 'your clinic'}.
          </p>
          <div className="text-xs text-gray-500 bg-slate-50 py-2 px-3 rounded-lg border border-slate-100">
            Redirecting to your doctors list...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/clinic/doctors"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-3 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Doctors</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add New Doctor</h1>
              <p className="text-gray-600 text-sm mt-1">
                Fill in the details to register a doctor for your clinic
              </p>
            </div>
            {clinicInfo.name && (
              <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold self-start sm:self-auto shadow-xs">
                <Building className="h-4 w-4 text-indigo-600" />
                <span>Clinic: {clinicInfo.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* 1. Profile Photo */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-indigo-600" />
              Profile Photo
            </h3>
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden shadow-inner">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile preview" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-white" />
                  )}
                </div>
                {profileImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileImage(null);
                      setSelectedImageFile(null);
                    }}
                    className="absolute -top-1 -right-1 h-6 w-6 bg-rose-500 rounded-full flex items-center justify-center text-white hover:bg-rose-600 transition-colors shadow-sm"
                    aria-label="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div>
                <label className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 font-medium text-sm rounded-xl hover:bg-indigo-100 cursor-pointer transition-colors border border-indigo-100">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1.5">JPG, PNG up to 2MB</p>
              </div>
            </div>
          </div>

          {/* 2. Personal Information */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-indigo-600" />
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-gray-50/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                    errors.firstName ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-200'
                  }`}
                  placeholder="e.g. John"
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-gray-50/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                    errors.lastName ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-200'
                  }`}
                  placeholder="e.g. Doe"
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>

              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Contact Information */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Mail className="h-5 w-5 mr-2 text-indigo-600" />
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="off"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-gray-50/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                    errors.email ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-200'
                  }`}
                  placeholder="doctor@gmail.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="off"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  onKeyDown={handlePhoneKeyDown}
                  maxLength={10}
                  className={`w-full px-3.5 py-2.5 bg-gray-50/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                    errors.phone ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-200'
                  }`}
                  placeholder="10-digit mobile number"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Password *
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    (Doctor uses this password to log in to their independent dashboard)
                  </span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full pl-10 pr-10 py-2.5 bg-gray-50/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                      errors.password ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-200'
                    }`}
                    placeholder="Min 8 chars, uppercase, lowercase, number, symbol"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Home Address / Residential Address
                </label>
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                  placeholder="Street address, city, state, postal code"
                />
              </div>
            </div>
          </div>

          {/* 4. Emergency Information */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PhoneCall className="h-5 w-5 mr-2 text-indigo-600" />
              Emergency Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Contact Name
                </label>
                <input
                  id="emergencyContact"
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="e.g. Jane Doe"
                />
              </div>

              <div>
                <label htmlFor="emergencyPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Phone
                </label>
                <input
                  id="emergencyPhone"
                  type="tel"
                  value={formData.emergencyPhone}
                  onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                  onKeyDown={handlePhoneKeyDown}
                  maxLength={10}
                  className={`w-full px-3.5 py-2.5 bg-gray-50/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                    errors.emergencyPhone ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-200'
                  }`}
                  placeholder="10-digit number"
                />
                {errors.emergencyPhone && <p className="text-red-500 text-xs mt-1">{errors.emergencyPhone}</p>}
              </div>

              <div>
                <label htmlFor="emergencyRelationship" className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship
                </label>
                <input
                  id="emergencyRelationship"
                  type="text"
                  value={formData.emergencyRelationship}
                  onChange={(e) => handleInputChange('emergencyRelationship', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="e.g. Spouse, Parent, Sibling"
                />
              </div>
            </div>
          </div>

          {/* 5. Professional Information */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Stethoscope className="h-5 w-5 mr-2 text-indigo-600" />
              Professional Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-1">
                  Specialty *
                </label>
                <select
                  id="specialty"
                  value={formData.specialty}
                  onChange={(e) => handleInputChange('specialty', e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-gray-50/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                    errors.specialty ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-200'
                  }`}
                >
                  <option value="">Select Specialty</option>
                  {specialties.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
                {errors.specialty && <p className="text-red-500 text-xs mt-1">{errors.specialty}</p>}
              </div>

              <div>
                <label htmlFor="supSpeciality" className="block text-sm font-medium text-gray-700 mb-1">
                  Sub-Specialty
                </label>
                <input
                  id="supSpeciality"
                  type="text"
                  value={formData.supSpeciality}
                  onChange={(e) => handleInputChange('supSpeciality', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="e.g. Interventional Cardiology"
                />
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience *
                </label>
                <input
                  id="experience"
                  type="number"
                  min="0"
                  max="60"
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-gray-50/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                    errors.experience ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-200'
                  }`}
                  placeholder="e.g. 5"
                />
                {errors.experience && <p className="text-red-500 text-xs mt-1">{errors.experience}</p>}
              </div>

              <div>
                <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Medical License Number *
                </label>
                <input
                  id="licenseNumber"
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-gray-50/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                    errors.licenseNumber ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-200'
                  }`}
                  placeholder="e.g. MCI-12345"
                />
                {errors.licenseNumber && <p className="text-red-500 text-xs mt-1">{errors.licenseNumber}</p>}
              </div>

              <div>
                <label htmlFor="consultationFee" className="block text-sm font-medium text-gray-700 mb-1">
                  Consultation Fee (₹)
                </label>
                <input
                  id="consultationFee"
                  type="number"
                  min="0"
                  value={formData.consultationFee}
                  onChange={(e) => handleInputChange('consultationFee', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="e.g. 500"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Consultation Location / Chamber Room
                </label>
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="e.g. OPD Room 204, Second Floor"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Doctor Bio / Summary
                </label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                  placeholder="Brief summary of clinical expertise, background, or clinical focus..."
                />
              </div>
            </div>
          </div>

          {/* 6. Qualifications Section */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <GraduationCap className="h-5 w-5 mr-2 text-indigo-600" />
                Medical Qualifications
              </h3>
              <button
                type="button"
                onClick={handleAddQualification}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors border border-indigo-200"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Another Qualification
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="primaryQualification" className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Qualification
                </label>
                <input
                  id="primaryQualification"
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => handleInputChange('qualification', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="e.g. MBBS, MD - General Medicine"
                />
              </div>

              {formData.qualifications.map((qual, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={qual}
                      onChange={(e) => handleQualificationChange(idx, e.target.value)}
                      className="w-full px-3.5 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      placeholder={`Additional Degree / Diploma #${idx + 1} (e.g. Fellowship in Cardiology)`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveQualification(idx)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 7. Clinic / Hospital Information (Auto-Prefilled from Logged-in Clinic) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Building className="h-5 w-5 mr-2 text-indigo-600" />
                Clinic & OPD Details
              </h3>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                Automatic Clinic Association
              </span>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              This doctor will be registered under your clinic account and assigned to your facility schedule.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clinic Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={clinicInfo.name || 'Loading Clinic...'}
                    disabled
                    readOnly
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium cursor-not-allowed select-none"
                  />
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label htmlFor="sessionTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Default Session Time / Patient Slot
                </label>
                <select
                  id="sessionTime"
                  value={formData.sessionTime}
                  onChange={(e) => handleInputChange('sessionTime', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                >
                  {sessionTimeOptions.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clinic Phone Number
                </label>
                <input
                  type="text"
                  value={clinicInfo.phone || 'N/A'}
                  disabled
                  readOnly
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clinic City
                </label>
                <input
                  type="text"
                  value={clinicInfo.city || 'N/A'}
                  disabled
                  readOnly
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-600 cursor-not-allowed"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clinic Address
                </label>
                <input
                  type="text"
                  value={clinicInfo.fullAddress || clinicInfo.address || 'N/A'}
                  disabled
                  readOnly
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* 8. Verification Documents */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-indigo-600" />
              Verification Documents
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Identity Proof */}
              <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50/50 flex flex-col justify-between gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Identity Proof
                  </label>
                  <p className="text-xs text-gray-500">Govt ID, Passport, Driving License (JPG, PNG, PDF up to 5MB)</p>
                </div>

                {!selectedIdentityFile ? (
                  <div>
                    <label className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 cursor-pointer shadow-xs transition-colors">
                      <Upload className="h-4 w-4 mr-2 text-gray-500" />
                      Select Document
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleIdentityProofChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 shadow-xs gap-3">
                    <div className="flex items-center space-x-3 overflow-hidden min-w-0">
                      {isPdfFile(selectedIdentityFile) ? (
                        <div className="h-12 w-12 rounded-lg border border-red-100 bg-red-50 flex items-center justify-center flex-shrink-0 text-red-500">
                          <FileText className="h-6 w-6" />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                          <img
                            src={identityPreviewUrl}
                            alt={selectedIdentityFile.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-800 truncate" title={selectedIdentityFile.name}>
                          {selectedIdentityFile.name}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {formatFileSize(selectedIdentityFile.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => openPreviewModal(selectedIdentityFile, identityPreviewUrl, 'Identity Proof')}
                        className="px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {isPdfFile(selectedIdentityFile) ? 'View Document' : 'View'}
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveIdentityProof}
                        className="px-2.5 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Degree Certificate */}
              <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50/50 flex flex-col justify-between gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Degree Certificate
                  </label>
                  <p className="text-xs text-gray-500">Medical degree certificate (JPG, PNG, PDF up to 5MB)</p>
                </div>

                {!selectedDegreeFile ? (
                  <div>
                    <label className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 cursor-pointer shadow-xs transition-colors">
                      <Upload className="h-4 w-4 mr-2 text-gray-500" />
                      Select Document
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleDegreeCertificateChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 shadow-xs gap-3">
                    <div className="flex items-center space-x-3 overflow-hidden min-w-0">
                      {isPdfFile(selectedDegreeFile) ? (
                        <div className="h-12 w-12 rounded-lg border border-red-100 bg-red-50 flex items-center justify-center flex-shrink-0 text-red-500">
                          <FileText className="h-6 w-6" />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                          <img
                            src={degreePreviewUrl}
                            alt={selectedDegreeFile.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-800 truncate" title={selectedDegreeFile.name}>
                          {selectedDegreeFile.name}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {formatFileSize(selectedDegreeFile.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => openPreviewModal(selectedDegreeFile, degreePreviewUrl, 'Degree Certificate')}
                        className="px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {isPdfFile(selectedDegreeFile) ? 'View Document' : 'View'}
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveDegreeCertificate}
                        className="px-2.5 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 9. Availability & Timing */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
              Availability & Timing
            </h3>

            {/* Available Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Available Consultation Days
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {weekDays.map(day => {
                  const isSelected = formData.availability.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleAvailability(day)}
                      aria-pressed={isSelected}
                      className={`py-2 px-1 text-xs md:text-sm font-medium transition-all text-center rounded-xl flex items-center justify-center min-h-[40px] whitespace-nowrap ${
                        isSelected
                          ? 'bg-indigo-50/90 text-indigo-700 border-2 border-indigo-600 font-semibold shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Consultation Timing */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Consultation Timing
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                <div>
                  <label htmlFor="availableStartTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    id="availableStartTime"
                    type="time"
                    step="300"
                    value={formData.availableStartTime}
                    onChange={(e) => handleInputChange('availableStartTime', e.target.value)}
                    onClick={(e) => {
                      try {
                        e.target.showPicker?.();
                      } catch (_) {}
                    }}
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                      errors.availableStartTime ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  />
                  {errors.availableStartTime && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">
                      {errors.availableStartTime}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="availableEndTime" className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    id="availableEndTime"
                    type="time"
                    step="300"
                    value={formData.availableEndTime}
                    onChange={(e) => handleInputChange('availableEndTime', e.target.value)}
                    onClick={(e) => {
                      try {
                        e.target.showPicker?.();
                      } catch (_) {}
                    }}
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                      errors.availableEndTime ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  />
                  {errors.availableEndTime && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">
                      {errors.availableEndTime}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Error Banners */}
          {formGeneralError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700 text-sm">
              <AlertCircle className="h-5 w-5 mr-2 text-red-500 flex-shrink-0" />
              <span>{formGeneralError}</span>
            </div>
          )}

          {apiError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700 text-sm">
              <AlertCircle className="h-5 w-5 mr-2 text-red-500 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
            <button
              type="button"
              onClick={() => router.push('/clinic/doctors')}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md shadow-indigo-100"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Adding Doctor...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Add Doctor
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
