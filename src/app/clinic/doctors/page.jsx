'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Pencil, 
  X, 
  ChevronUp, 
  ChevronDown, 
  XCircle, 
  CheckCircle2, 
  FileText, 
  PhoneCall, 
  Upload, 
  Trash2, 
  MoreVertical, 
  Power, 
  PowerOff, 
  AlertTriangle,
  Check
} from 'lucide-react';
import { API_BASE_URL } from '@/utils/api';
import { formatTitleCase } from '@/utils/nameFormatting';
import { validateDoctorEmail, handlePhoneKeyDown, validatePhoneNumber } from '@/utils/phoneValidation';

const DEPARTMENTS = [
  'Emergency', 
  'ICU', 
  'Surgery', 
  'Outpatient', 
  'Pediatrics', 
  'Maternity', 
  'Radiology', 
  'Laboratory',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Orthopedics',
  'General Medicine'
];

const statusClasses = {
  active: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-blue-100 text-blue-800',
  rejected: 'bg-rose-100 text-rose-800',
  inactive: 'bg-rose-100 text-rose-800'
};

const formatDateDisplay = (dateVal) => {
  if (!dateVal) return 'Not specified';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateVal;
  }
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const isPdfDoc = (file, url) => {
  if (file) {
    return file.type === 'application/pdf' || (file.name && file.name.toLowerCase().endsWith('.pdf'));
  }
  if (url) {
    return url.toLowerCase().includes('.pdf');
  }
  return false;
};

const getDocumentDisplayName = (file, url, fallbackName) => {
  if (file && file.name) return file.name;
  if (url) {
    try {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split('/');
      const last = parts[parts.length - 1];
      if (last && last.trim().length > 0) {
        return decodeURIComponent(last);
      }
    } catch {
      const parts = url.split('/');
      const last = parts[parts.length - 1];
      if (last && last.trim().length > 0) {
        return last;
      }
    }
  }
  return fallbackName;
};

// Reusable Doctor Details Modal matching SuperAdmin Doctor Details View & Edit
function DoctorDetailsModal({ 
  doctor, 
  onClose, 
  isEditMode, 
  setIsEditMode, 
  onSave 
}) {
  const [docPreviewModal, setDocPreviewModal] = useState({
    isOpen: false,
    title: '',
    url: '',
    isPdf: false
  });
  const [isViewPhotoModalOpen, setIsViewPhotoModalOpen] = useState(false);

  // Raw URLs from doctor object
  const rawIdentity = doctor.identityProof || doctor.identity_proof || null;
  const identityProofUrl = typeof rawIdentity === 'string' && rawIdentity.trim().length > 0 ? rawIdentity.trim() : null;
  const rawDegree = doctor.degreeCertificate || doctor.degree_certificate || null;
  const degreeCertificateUrl = typeof rawDegree === 'string' && rawDegree.trim().length > 0 ? rawDegree.trim() : null;

  const rawProfileImageUrl = doctor.profileImage || doctor.profile_image || null;
  const hasInitialPhoto = Boolean(
    rawProfileImageUrl &&
    typeof rawProfileImageUrl === 'string' &&
    rawProfileImageUrl.trim().length > 0 &&
    !rawProfileImageUrl.toLowerCase().includes('placeholder') &&
    !rawProfileImageUrl.toLowerCase().includes('ui-avatars.com') &&
    !rawProfileImageUrl.toLowerCase().includes('default-avatar')
  );
  const profileImageUrl = hasInitialPhoto ? rawProfileImageUrl.trim() : null;

  // Photo state
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isPhotoRemoved, setIsPhotoRemoved] = useState(false);
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const fileInputRef = useRef(null);
  const photoMenuRef = useRef(null);

  // Document states
  const [selectedIdentityFile, setSelectedIdentityFile] = useState(null);
  const [identityPreviewName, setIdentityPreviewName] = useState('');
  const [identityPreviewUrl, setIdentityPreviewUrl] = useState(null);
  const [isIdentityRemoved, setIsIdentityRemoved] = useState(false);

  const [selectedDegreeFile, setSelectedDegreeFile] = useState(null);
  const [degreePreviewName, setDegreePreviewName] = useState('');
  const [degreePreviewUrl, setDegreePreviewUrl] = useState(null);
  const [isDegreeRemoved, setIsDegreeRemoved] = useState(false);

  const [docError, setDocError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isDocUploading, setIsDocUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // 3-dot menu states and refs for document cards
  const [isIdentityMenuOpen, setIsIdentityMenuOpen] = useState(false);
  const [isDegreeMenuOpen, setIsDegreeMenuOpen] = useState(false);
  const identityMenuRef = useRef(null);
  const degreeMenuRef = useRef(null);
  const identityFileInputRef = useRef(null);
  const degreeFileInputRef = useRef(null);

  // Form Data State for editing
  const [formData, setFormData] = useState({
    firstName: doctor.firstName || doctor.first_name || '',
    lastName: doctor.lastName || doctor.last_name || '',
    email: doctor.email || '',
    phone: doctor.phone || '',
    gender: doctor.gender || '',
    dateOfBirth: doctor.dateOfBirth || doctor.date_of_birth || '',
    licenseNumber: doctor.licenseNumber || doctor.license_number || '',
    homeAddress: doctor.homeAddress || doctor.home_address || '',
    location: doctor.location || doctor.hospitalCity || doctor.hospital_city || '',
    hospitalCity: doctor.hospitalCity || doctor.hospital_city || doctor.location || '',
    department: doctor.department || '',
    bio: doctor.bio || '',
    specialty: doctor.specialty || '',
    supSpeciality: doctor.supSpeciality || doctor.sup_speciality || doctor.subSpecialty || '',
    hospital: doctor.hospital || '',
    hospitalAddress: doctor.hospitalAddress || doctor.hospital_address || '',
    hospitalPhone: doctor.hospitalPhone || doctor.hospital_phone || doctor.hospitalNumber || doctor.hospital_number || '',
    hospitalNumber: doctor.hospitalNumber || doctor.hospital_number || doctor.hospitalPhone || doctor.hospital_phone || '',
    experience: doctor.experience ?? '',
    consultantFee: doctor.consultantFee || doctor.consultant_fee || doctor.consultation_fee || doctor.consultationFee || '',
    sessionTime: doctor.sessionTime || doctor.session_time || '30 mins',
    startTime: doctor.startTime || doctor.start_time || '',
    endTime: doctor.endTime || doctor.end_time || '',
    qualifications: Array.isArray(doctor.qualifications)
      ? doctor.qualifications.join(', ')
      : (typeof doctor.qualifications === 'string' ? doctor.qualifications : ''),
    available: {
      days: Array.isArray(doctor.available?.days)
        ? doctor.available.days.join(', ')
        : (typeof doctor.available?.days === 'string'
          ? doctor.available.days
          : (Array.isArray(doctor.availableDays) ? doctor.availableDays.join(', ') : (doctor.availableDays || ''))),
      time: doctor.available?.time || doctor.sessionTime || doctor.availableTime || ''
    },
    emergencyContact: doctor.emergencyContact || doctor.emergency_contact || doctor.emergencyContactName || '',
    emergencyPhone: doctor.emergencyPhone || doctor.emergency_phone || '',
    emergencyRelationship: doctor.emergencyRelationship || doctor.emergency_relationship || '',
    isVerified: Boolean(doctor.isVerified ?? doctor.is_verified ?? false)
  });

  // Re-sync form data when doctor prop changes
  useEffect(() => {
    setFormData({
      firstName: doctor.firstName || doctor.first_name || '',
      lastName: doctor.lastName || doctor.last_name || '',
      email: doctor.email || '',
      phone: doctor.phone || '',
      gender: doctor.gender || '',
      dateOfBirth: doctor.dateOfBirth || doctor.date_of_birth || '',
      licenseNumber: doctor.licenseNumber || doctor.license_number || '',
      homeAddress: doctor.homeAddress || doctor.home_address || '',
      location: doctor.location || doctor.hospitalCity || doctor.hospital_city || '',
      hospitalCity: doctor.hospitalCity || doctor.hospital_city || doctor.location || '',
      department: doctor.department || '',
      bio: doctor.bio || '',
      specialty: doctor.specialty || '',
      supSpeciality: doctor.supSpeciality || doctor.sup_speciality || doctor.subSpecialty || '',
      hospital: doctor.hospital || '',
      hospitalAddress: doctor.hospitalAddress || doctor.hospital_address || '',
      hospitalPhone: doctor.hospitalPhone || doctor.hospital_phone || doctor.hospitalNumber || doctor.hospital_number || '',
      hospitalNumber: doctor.hospitalNumber || doctor.hospital_number || doctor.hospitalPhone || doctor.hospital_phone || '',
      experience: doctor.experience ?? '',
      consultantFee: doctor.consultantFee || doctor.consultant_fee || doctor.consultation_fee || doctor.consultationFee || '',
      sessionTime: doctor.sessionTime || doctor.session_time || '30 mins',
      startTime: doctor.startTime || doctor.start_time || '',
      endTime: doctor.endTime || doctor.end_time || '',
      qualifications: Array.isArray(doctor.qualifications)
        ? doctor.qualifications.join(', ')
        : (typeof doctor.qualifications === 'string' ? doctor.qualifications : ''),
      available: {
        days: Array.isArray(doctor.available?.days)
          ? doctor.available.days.join(', ')
          : (typeof doctor.available?.days === 'string'
            ? doctor.available.days
            : (Array.isArray(doctor.availableDays) ? doctor.availableDays.join(', ') : (doctor.availableDays || ''))),
        time: doctor.available?.time || doctor.sessionTime || doctor.availableTime || ''
      },
      emergencyContact: doctor.emergencyContact || doctor.emergency_contact || doctor.emergencyContactName || '',
      emergencyPhone: doctor.emergencyPhone || doctor.emergency_phone || '',
      emergencyRelationship: doctor.emergencyRelationship || doctor.emergency_relationship || '',
      isVerified: Boolean(doctor.isVerified ?? doctor.is_verified ?? false)
    });
  }, [doctor]);

  // Clean up blob URLs when switching modes or unmounting
  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
      if (identityPreviewUrl && identityPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(identityPreviewUrl);
      if (degreePreviewUrl && degreePreviewUrl.startsWith('blob:')) URL.revokeObjectURL(degreePreviewUrl);
    };
  }, [photoPreview, identityPreviewUrl, degreePreviewUrl]);

  // Click outside to close photo and doc dropdown menus
  useEffect(() => {
    if (!isPhotoMenuOpen && !isIdentityMenuOpen && !isDegreeMenuOpen) return;
    const handleClickOutside = (e) => {
      if (photoMenuRef.current && !photoMenuRef.current.contains(e.target)) {
        setIsPhotoMenuOpen(false);
      }
      if (identityMenuRef.current && !identityMenuRef.current.contains(e.target)) {
        setIsIdentityMenuOpen(false);
      }
      if (degreeMenuRef.current && !degreeMenuRef.current.contains(e.target)) {
        setIsDegreeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPhotoMenuOpen, isIdentityMenuOpen, isDegreeMenuOpen]);

  // Lock background scroll when modal open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const openDocPreview = (title, url, isPdf) => {
    if (!url) return;
    setDocPreviewModal({ isOpen: true, title, url, isPdf });
  };

  const closeDocPreview = () => {
    setDocPreviewModal({ isOpen: false, title: '', url: '', isPdf: false });
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError('');
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name || '')) {
      setPhotoError('Invalid file type. Only JPG, PNG, and WebP images are allowed.');
      e.target.value = '';
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      setPhotoError('Image size exceeds 5MB limit.');
      e.target.value = '';
      return;
    }

    if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
    setSelectedPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setIsPhotoRemoved(false);
    e.target.value = '';
  };

  const handleIdentityProofChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocError('');
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    const hasValidExt = /\.(jpe?g|png|webp|pdf)$/i.test(file.name || '');
    if (!validTypes.includes(file.type) && !hasValidExt) {
      setDocError('Invalid file type for Identity Proof. Only JPG, PNG, and PDF files are allowed.');
      e.target.value = '';
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      setDocError('Identity Proof file size exceeds 5MB limit.');
      e.target.value = '';
      return;
    }

    if (identityPreviewUrl && identityPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(identityPreviewUrl);
    setSelectedIdentityFile(file);
    setIdentityPreviewName(file.name);
    setIdentityPreviewUrl(URL.createObjectURL(file));
    setIsIdentityRemoved(false);
    e.target.value = '';
  };

  const handleRemoveIdentityProof = () => {
    if (identityPreviewUrl && identityPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(identityPreviewUrl);
    setSelectedIdentityFile(null);
    setIdentityPreviewName('');
    setIdentityPreviewUrl(null);
    setIsIdentityRemoved(true);
    if (docPreviewModal.isOpen && docPreviewModal.title.includes('Identity Proof')) {
      closeDocPreview();
    }
  };

  const handleDegreeCertificateChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocError('');
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    const hasValidExt = /\.(jpe?g|png|webp|pdf)$/i.test(file.name || '');
    if (!validTypes.includes(file.type) && !hasValidExt) {
      setDocError('Invalid file type for Degree Certificate. Only JPG, PNG, and PDF files are allowed.');
      e.target.value = '';
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      setDocError('Degree Certificate file size exceeds 5MB limit.');
      e.target.value = '';
      return;
    }

    if (degreePreviewUrl && degreePreviewUrl.startsWith('blob:')) URL.revokeObjectURL(degreePreviewUrl);
    setSelectedDegreeFile(file);
    setDegreePreviewName(file.name);
    setDegreePreviewUrl(URL.createObjectURL(file));
    setIsDegreeRemoved(false);
    e.target.value = '';
  };

  const handleRemoveDegreeCertificate = () => {
    if (degreePreviewUrl && degreePreviewUrl.startsWith('blob:')) URL.revokeObjectURL(degreePreviewUrl);
    setSelectedDegreeFile(null);
    setDegreePreviewName('');
    setDegreePreviewUrl(null);
    setIsDegreeRemoved(true);
    if (docPreviewModal.isOpen && docPreviewModal.title.includes('Degree Certificate')) {
      closeDocPreview();
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAvailabilityChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      available: {
        ...prev.available,
        [name]: value
      }
    }));
  };

  const handleSaveDoctor = async () => {
    setPhotoError('');
    setDocError('');
    setGeneralError('');

    // Form validations
    if (!formData.firstName.trim()) {
      setGeneralError('First name is required.');
      return;
    }
    if (!formData.lastName.trim()) {
      setGeneralError('Last name is required.');
      return;
    }
    if (!formData.specialty.trim()) {
      setGeneralError('Specialty is required.');
      return;
    }

    const emailErr = validateDoctorEmail(formData.email, true, 'Email address');
    if (emailErr) {
      setGeneralError(emailErr);
      return;
    }

    const phoneErr = validatePhoneNumber(formData.phone, false, 'Phone number');
    if (phoneErr) {
      setGeneralError(phoneErr);
      return;
    }

    let uploadedImageUrl = null;
    let uploadedIdentityUrl = null;
    let uploadedDegreeUrl = null;

    const needsPhotoUpload = Boolean(selectedPhotoFile && !isPhotoRemoved);
    const needsIdentityUpload = Boolean(selectedIdentityFile && !isIdentityRemoved);
    const needsDegreeUpload = Boolean(selectedDegreeFile && !isDegreeRemoved);

    // Parallel upload of changed media files via existing /api/upload endpoint
    if (needsPhotoUpload || needsIdentityUpload || needsDegreeUpload) {
      if (needsPhotoUpload) setIsPhotoUploading(true);
      if (needsIdentityUpload || needsDegreeUpload) setIsDocUploading(true);

      try {
        const uploadPromises = [];

        if (needsPhotoUpload) {
          const uploadData = new FormData();
          uploadData.append('file', selectedPhotoFile);
          uploadData.append('folder', 'doctor-profiles');
          uploadPromises.push(
            fetch('/api/upload', {
              method: 'POST',
              body: uploadData,
            })
              .then(async (res) => {
                const json = await res.json().catch(() => ({}));
                if (!res.ok || !json.url) {
                  throw new Error(json.error || 'Failed to upload profile photo.');
                }
                uploadedImageUrl = json.url;
              })
          );
        }

        if (needsIdentityUpload) {
          const uploadData = new FormData();
          uploadData.append('file', selectedIdentityFile);
          uploadData.append('folder', 'doctor-documents');
          uploadPromises.push(
            fetch('/api/upload', {
              method: 'POST',
              body: uploadData,
            })
              .then(async (res) => {
                const json = await res.json().catch(() => ({}));
                if (!res.ok || !json.url) {
                  throw new Error(json.error || 'Failed to upload Identity Proof document.');
                }
                uploadedIdentityUrl = json.url;
              })
          );
        }

        if (needsDegreeUpload) {
          const uploadData = new FormData();
          uploadData.append('file', selectedDegreeFile);
          uploadData.append('folder', 'doctor-documents');
          uploadPromises.push(
            fetch('/api/upload', {
              method: 'POST',
              body: uploadData,
            })
              .then(async (res) => {
                const json = await res.json().catch(() => ({}));
                if (!res.ok || !json.url) {
                  throw new Error(json.error || 'Failed to upload Degree Certificate document.');
                }
                uploadedDegreeUrl = json.url;
              })
          );
        }

        await Promise.all(uploadPromises);
      } catch (err) {
        console.error('Upload error during doctor update:', err);
        if (needsPhotoUpload && !uploadedImageUrl) {
          setPhotoError(err.message || 'Failed to upload profile photo.');
        }
        if ((needsIdentityUpload && !uploadedIdentityUrl) || (needsDegreeUpload && !uploadedDegreeUrl)) {
          setDocError(err.message || 'Failed to upload verification documents.');
        }
        setIsPhotoUploading(false);
        setIsDocUploading(false);
        return;
      } finally {
        setIsPhotoUploading(false);
        setIsDocUploading(false);
      }
    }

    const qualificationsList = formData.qualifications
      ? (Array.isArray(formData.qualifications)
          ? formData.qualifications
          : formData.qualifications.split(',').map(q => q.trim()).filter(Boolean))
      : [];

    const availableDaysList = formData.available?.days
      ? (Array.isArray(formData.available.days)
          ? formData.available.days
          : (typeof formData.available.days === 'string'
              ? formData.available.days.split(',').map(d => d.trim()).filter(Boolean)
              : []))
      : [];

    const timeString = (formData.startTime && formData.endTime)
      ? `${formData.startTime} to ${formData.endTime}`
      : (formData.available?.time || '').trim();

    const formattedData = {
      firstName: formatTitleCase(formData.firstName),
      lastName: formatTitleCase(formData.lastName),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      gender: formData.gender || null,
      dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : null,
      licenseNumber: formData.licenseNumber ? formData.licenseNumber.trim() : null,
      specialty: formData.specialty.trim(),
      supSpeciality: formData.supSpeciality ? formData.supSpeciality.trim() : null,
      subSpecialty: formData.supSpeciality ? formData.supSpeciality.trim() : null,
      experience: (formData.experience !== '' && formData.experience !== null && formData.experience !== undefined)
        ? Number(formData.experience)
        : 0,
      consultantFee: (formData.consultantFee !== '' && formData.consultantFee !== null && formData.consultantFee !== undefined)
        ? Number(formData.consultantFee)
        : undefined,
      consultationFee: (formData.consultantFee !== '' && formData.consultantFee !== null && formData.consultantFee !== undefined)
        ? Number(formData.consultantFee)
        : undefined,
      department: formData.department ? formData.department.trim() : null,
      location: formData.location ? formData.location.trim() : (formData.hospitalCity ? formData.hospitalCity.trim() : null),
      hospitalCity: formData.hospitalCity ? formData.hospitalCity.trim() : (formData.location ? formData.location.trim() : null),
      hospital: formData.hospital ? formData.hospital.trim() : null,
      hospitalAddress: formData.hospitalAddress ? formData.hospitalAddress.trim() : null,
      hospitalPhone: formData.hospitalPhone ? formData.hospitalPhone.trim() : null,
      hospitalNumber: formData.hospitalPhone ? formData.hospitalPhone.trim() : null,
      homeAddress: formData.homeAddress ? formData.homeAddress.trim() : null,
      qualifications: qualificationsList,
      qualification: qualificationsList[0] || null,
      available: {
        days: availableDaysList,
        time: timeString
      },
      availableDays: availableDaysList,
      availableTime: timeString,
      sessionTime: formData.sessionTime ? formData.sessionTime.trim() : (timeString || '30 mins'),
      startTime: formData.startTime ? formData.startTime.trim() : null,
      endTime: formData.endTime ? formData.endTime.trim() : null,
      emergencyContact: formData.emergencyContact ? formData.emergencyContact.trim() : null,
      emergencyContactName: formData.emergencyContact ? formData.emergencyContact.trim() : null,
      emergencyPhone: formData.emergencyPhone ? formData.emergencyPhone.trim() : null,
      emergencyRelationship: formData.emergencyRelationship ? formData.emergencyRelationship.trim() : null,
      bio: formData.bio ? formData.bio.trim() : null,
      isVerified: Boolean(formData.isVerified)
    };

    // Profile photo mapping
    if (isPhotoRemoved) {
      formattedData.profileImage = null;
    } else if (uploadedImageUrl) {
      formattedData.profileImage = uploadedImageUrl;
    } else if (profileImageUrl) {
      formattedData.profileImage = profileImageUrl;
    }

    // Identity Proof mapping
    if (isIdentityRemoved) {
      formattedData.identityProof = null;
    } else if (uploadedIdentityUrl) {
      formattedData.identityProof = uploadedIdentityUrl;
    } else if (identityProofUrl) {
      formattedData.identityProof = identityProofUrl;
    }

    // Degree Certificate mapping
    if (isDegreeRemoved) {
      formattedData.degreeCertificate = null;
    } else if (uploadedDegreeUrl) {
      formattedData.degreeCertificate = uploadedDegreeUrl;
    } else if (degreeCertificateUrl) {
      formattedData.degreeCertificate = degreeCertificateUrl;
    }

    setIsUpdating(true);
    try {
      const success = await onSave(doctor.id || doctor._id, formattedData);
      if (success) {
        setIsEditMode(false);
      } else {
        setGeneralError('Failed to save doctor changes to server. Please try again.');
      }
    } catch (err) {
      setGeneralError(err.message || 'Error occurred while saving doctor changes.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
    setSelectedPhotoFile(null);
    setPhotoPreview(null);
    setIsPhotoRemoved(false);
    setIsPhotoMenuOpen(false);
    setPhotoError('');

    if (identityPreviewUrl && identityPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(identityPreviewUrl);
    setSelectedIdentityFile(null);
    setIdentityPreviewName('');
    setIdentityPreviewUrl(null);
    setIsIdentityRemoved(false);

    if (degreePreviewUrl && degreePreviewUrl.startsWith('blob:')) URL.revokeObjectURL(degreePreviewUrl);
    setSelectedDegreeFile(null);
    setDegreePreviewName('');
    setDegreePreviewUrl(null);
    setIsDegreeRemoved(false);

    setDocError('');
    setGeneralError('');
    closeDocPreview();
    setIsIdentityMenuOpen(false);
    setIsDegreeMenuOpen(false);
    setIsEditMode(false);
  };

  // Active document preview states
  const hasActivePhoto = !isPhotoRemoved && Boolean(photoPreview || profileImageUrl);
  const currentDisplayPhoto = hasActivePhoto ? (photoPreview || profileImageUrl) : null;

  const hasActiveIdentity = !isIdentityRemoved && Boolean(selectedIdentityFile || identityProofUrl);
  const activeIdentityUrl = selectedIdentityFile ? identityPreviewUrl : (!isIdentityRemoved ? identityProofUrl : null);
  const isIdentityPdf = isPdfDoc(selectedIdentityFile, activeIdentityUrl);
  const identityDisplayName = getDocumentDisplayName(selectedIdentityFile, activeIdentityUrl, 'Identity Proof Document');

  const hasActiveDegree = !isDegreeRemoved && Boolean(selectedDegreeFile || degreeCertificateUrl);
  const activeDegreeUrl = selectedDegreeFile ? degreePreviewUrl : (!isDegreeRemoved ? degreeCertificateUrl : null);
  const isDegreePdf = isPdfDoc(selectedDegreeFile, activeDegreeUrl);
  const degreeDisplayName = getDocumentDisplayName(selectedDegreeFile, activeDegreeUrl, 'Degree Certificate Document');

  const displayQualifications = Array.isArray(doctor.qualifications)
    ? doctor.qualifications
    : (typeof doctor.qualifications === 'string' && doctor.qualifications.trim().length > 0
      ? doctor.qualifications.split(',').map(q => q.trim()).filter(Boolean)
      : []);

  const displayAvailabilityDays = Array.isArray(doctor.available?.days) && doctor.available.days.length > 0
    ? doctor.available.days.join(', ')
    : (typeof doctor.available?.days === 'string' && doctor.available.days.trim()
      ? doctor.available.days
      : (Array.isArray(doctor.availableDays) && doctor.availableDays.length > 0
        ? doctor.availableDays.join(', ')
        : (typeof doctor.availableDays === 'string' && doctor.availableDays.trim()
          ? doctor.availableDays
          : 'Not specified')));

  const displayAvailabilityTime = doctor.available?.time || doctor.sessionTime || doctor.availableTime || 'Not specified';

  const firstName = formatTitleCase(doctor.firstName || doctor.first_name || '');
  const lastName = formatTitleCase(doctor.lastName || doctor.last_name || '');
  const fullName = `${firstName} ${lastName}`.trim() || 'Doctor';
  const initial = (firstName || lastName || 'D').charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="fixed inset-0" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[680px] max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header with doctor profile */}
        <div className="flex-shrink-0 bg-gradient-to-r from-teal-50 to-cyan-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between z-10">
          <div className="flex items-center space-x-4 min-w-0">
            {/* Avatar & Photo Menu */}
            <div className="relative shrink-0" ref={photoMenuRef}>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <div
                onClick={() => {
                  if (isEditMode) {
                    setIsPhotoMenuOpen(prev => !prev);
                  } else if (currentDisplayPhoto) {
                    setIsViewPhotoModalOpen(true);
                  }
                }}
                className={`relative h-16 w-16 rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 flex items-center justify-center overflow-hidden shadow-md ring-2 ring-white shrink-0 ${isEditMode || currentDisplayPhoto ? 'cursor-pointer hover:ring-cyan-400 hover:opacity-95 transition-all' : ''}`}
                title={isEditMode ? 'Click for photo options' : (currentDisplayPhoto ? 'Click to view photo' : undefined)}
              >
                {currentDisplayPhoto ? (
                  <img
                    src={currentDisplayPhoto}
                    alt={fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold text-xl">
                    {initial}
                  </span>
                )}
              </div>

              {/* Photo Options Dropdown in Edit Mode */}
              {isEditMode && isPhotoMenuOpen && (
                <div
                  className="absolute left-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!hasActivePhoto ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsPhotoMenuOpen(false);
                        fileInputRef.current?.click();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center transition-colors cursor-pointer"
                    >
                      <Plus className="h-4 w-4 text-teal-600 mr-2.5 flex-shrink-0" />
                      Add Photo
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPhotoMenuOpen(false);
                          setIsViewPhotoModalOpen(true);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center transition-colors cursor-pointer"
                      >
                        <Eye className="h-4 w-4 text-gray-500 mr-2.5 flex-shrink-0" />
                        View Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPhotoMenuOpen(false);
                          fileInputRef.current?.click();
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center transition-colors cursor-pointer"
                      >
                        <Upload className="h-4 w-4 text-teal-600 mr-2.5 flex-shrink-0" />
                        Change Photo
                      </button>
                      <div className="h-px bg-gray-100 my-1"></div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPhotoMenuOpen(false);
                          if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
                          setSelectedPhotoFile(null);
                          setPhotoPreview(null);
                          setIsPhotoRemoved(true);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 text-rose-500 mr-2.5 flex-shrink-0" />
                        Remove Photo
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h3 className="text-xl font-bold text-gray-900 truncate">
                {isEditMode ? (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="First name"
                      className="w-32 px-2.5 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
                    />
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Last name"
                      className="w-32 px-2.5 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
                    />
                  </div>
                ) : (
                  <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    Dr. {fullName}
                  </span>
                )}
              </h3>
              <div className="mt-1 flex items-center gap-2">
                {isEditMode ? (
                  <div className="flex space-x-2 mt-1">
                    <input
                      type="text"
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleInputChange}
                      placeholder="Specialty (e.g. Cardiology)"
                      className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      name="supSpeciality"
                      value={formData.supSpeciality}
                      onChange={handleInputChange}
                      placeholder="Sub-Specialty (optional)"
                      className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                ) : (
                  <>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                      {doctor.specialty || 'General'}
                    </span>
                    {doctor.supSpeciality && (
                      <span className="text-xs text-gray-500 font-medium">
                        • {doctor.supSpeciality}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-200/60 text-gray-500 hover:text-gray-700 transition-colors shrink-0 ml-4"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alerts */}
        {generalError && (
          <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700 text-xs">
            <XCircle className="h-4 w-4 mr-2 text-red-500 flex-shrink-0" />
            <span>{generalError}</span>
          </div>
        )}
        {photoError && (
          <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700 text-xs">
            <XCircle className="h-4 w-4 mr-2 text-red-500 flex-shrink-0" />
            <span>{photoError}</span>
          </div>
        )}
        {docError && (
          <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700 text-xs">
            <XCircle className="h-4 w-4 mr-2 text-red-500 flex-shrink-0" />
            <span>{docError}</span>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-5">
          {/* Contact Information */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-semibold text-gray-900 flex items-center">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mr-2.5 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                Contact Information
              </h4>
              {doctor.isVerified && !isEditMode && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  Verified
                </span>
              )}
            </div>

            {isEditMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    onKeyDown={handlePhoneKeyDown}
                    maxLength={10}
                    placeholder="10-digit phone number"
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white transition-colors"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : ''}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Email</span>
                    <span className="text-sm text-gray-900 font-medium">{doctor.email || <span className="text-gray-400 italic font-normal">Not provided</span>}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Phone</span>
                    <span className="text-sm text-gray-900 font-medium">{doctor.phone || <span className="text-gray-400 italic font-normal">Not provided</span>}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Gender</span>
                    <span className="text-sm text-gray-900 font-medium">{doctor.gender || <span className="text-gray-400 italic font-normal">Not provided</span>}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Date of Birth</span>
                    <span className="text-sm text-gray-900 font-medium">{formatDateDisplay(doctor.dateOfBirth || doctor.date_of_birth)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Professional & Hospital Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            {/* Hospital Details */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col h-full">
              <h4 className="text-base font-semibold text-gray-900 flex items-center mb-4 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center mr-2.5 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                Hospital Details
              </h4>
              {isEditMode ? (
                <div className="space-y-3.5 flex-1 flex flex-col justify-between">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Hospital / Clinic Name</label>
                      <input
                        type="text"
                        name="hospital"
                        value={formData.hospital}
                        onChange={handleInputChange}
                        placeholder="e.g. City General Hospital"
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Hospital Phone</label>
                      <input
                        type="tel"
                        name="hospitalPhone"
                        value={formData.hospitalPhone}
                        onChange={handleInputChange}
                        onKeyDown={handlePhoneKeyDown}
                        maxLength={10}
                        placeholder="e.g. 9876543210"
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Hospital City</label>
                    <input
                      type="text"
                      name="hospitalCity"
                      value={formData.hospitalCity}
                      onChange={handleInputChange}
                      placeholder="e.g. Pune, Maharashtra"
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Hospital Address</label>
                    <textarea
                      name="hospitalAddress"
                      value={formData.hospitalAddress}
                      onChange={handleInputChange}
                      rows="2"
                      placeholder="Hospital location or address"
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Home Address</label>
                    <textarea
                      name="homeAddress"
                      value={formData.homeAddress}
                      onChange={handleInputChange}
                      rows="2"
                      placeholder="Residential / Home Address"
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="flex items-start">
                    <svg className="flex-shrink-0 w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div>
                      <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Hospital Name</span>
                      <p className="text-sm text-gray-900 font-medium">{doctor.hospital || <span className="text-gray-400 italic font-normal">Not provided</span>}</p>
                      {(doctor.hospitalPhone || doctor.hospital_number) && (
                        <p className="text-xs text-gray-600 mt-0.5">Phone: {doctor.hospitalPhone || doctor.hospital_number}</p>
                      )}
                      {(doctor.hospitalCity || doctor.hospital_city) && (
                        <p className="text-xs text-gray-600 mt-0.5">City: {doctor.hospitalCity || doctor.hospital_city}</p>
                      )}
                      {doctor.hospitalAddress && (
                        <p className="text-xs text-gray-500 mt-1">{doctor.hospitalAddress}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start pt-3 border-t border-gray-100">
                    <svg className="flex-shrink-0 w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <div>
                      <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Home Address</span>
                      <p className="text-sm text-gray-900 font-medium">{doctor.homeAddress || doctor.home_address || <span className="text-gray-400 italic font-normal">Not provided</span>}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Professional Details */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col h-full">
              <h4 className="text-base font-semibold text-gray-900 flex items-center mb-4 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center mr-2.5 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                Professional Details
              </h4>
              {isEditMode ? (
                <div className="space-y-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Medical License Number</label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. MCI-12345"
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Experience (years)</label>
                      <input
                        type="number"
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Consultation Fee (₹)</label>
                      <input
                        type="number"
                        name="consultantFee"
                        value={formData.consultantFee}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Department</label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white transition-colors"
                      >
                        <option value="">Select Department</option>
                        {DEPARTMENTS.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Location</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="e.g. New York, NY"
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex items-center pt-1">
                    <input
                      type="checkbox"
                      id="isVerified"
                      name="isVerified"
                      checked={formData.isVerified}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="isVerified" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                      Verified Doctor
                    </label>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Medical License</span>
                        <span className="text-sm text-gray-900 font-medium">{doctor.licenseNumber || doctor.license_number || <span className="text-gray-400 italic font-normal">Not provided</span>}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Experience</span>
                        <span className="text-sm text-gray-900 font-medium">{doctor.experience ? `${doctor.experience} years` : '0 years'}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Department</span>
                        <span className="text-sm text-gray-900 font-medium">{doctor.department || <span className="text-gray-400 italic font-normal">Not provided</span>}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Consultation Fee</span>
                        <span className="text-sm text-gray-900 font-medium">{(doctor.consultantFee || doctor.consultation_fee) ? `₹${doctor.consultantFee || doctor.consultation_fee}` : <span className="text-gray-400 italic font-normal">Not provided</span>}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Verification Status</span>
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${doctor.isVerified
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                            }`}>
                            {doctor.isVerified ? 'Verified' : 'Pending Verification'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Location</span>
                        <span className="text-sm text-gray-900 font-medium">{doctor.location || doctor.hospitalAddress || <span className="text-gray-400 italic font-normal">Not provided</span>}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
              <FileText className="w-5 h-5 mr-2 text-cyan-600" />
              Documents
            </h4>

            {/* Hidden inputs for document uploads */}
            <input
              ref={identityFileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
              onChange={handleIdentityProofChange}
              className="hidden"
            />
            <input
              ref={degreeFileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
              onChange={handleDegreeCertificateChange}
              className="hidden"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
              {/* Identity Proof */}
              <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50/50 flex flex-col justify-between h-full min-w-0 relative">
                <div className="space-y-3 min-w-0">
                  <div className="flex items-start justify-between gap-2 relative">
                    <div className="min-w-0 flex-1">
                      <label className="block text-sm font-semibold text-gray-800 truncate">
                        Identity Proof
                      </label>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed break-words">
                        Govt ID, Passport, Driving License<br className="hidden sm:inline" />
                        <span className="text-gray-400 sm:ml-1">(JPG, PNG, PDF up to 5MB)</span>
                      </p>
                    </div>

                    {/* 3-Dot Actions Menu in Edit Mode */}
                    {isEditMode && (
                      <div className="relative shrink-0 -mr-1 -mt-1" ref={identityMenuRef}>
                        <button
                          type="button"
                          onClick={() => {
                            setIsIdentityMenuOpen(prev => !prev);
                            setIsDegreeMenuOpen(false);
                          }}
                          className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200 shadow-none hover:shadow-sm"
                          aria-label="Identity proof actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {isIdentityMenuOpen && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                            {hasActiveIdentity ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsIdentityMenuOpen(false);
                                    openDocPreview('Identity Proof', activeIdentityUrl, isIdentityPdf);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-left transition-colors"
                                >
                                  <Eye className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsIdentityMenuOpen(false);
                                    identityFileInputRef.current?.click();
                                  }}
                                  className="w-full px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-left transition-colors"
                                >
                                  <Upload className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                                  Change
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsIdentityMenuOpen(false);
                                    handleRemoveIdentityProof();
                                  }}
                                  className="w-full px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 text-left transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                  Remove
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsIdentityMenuOpen(false);
                                  identityFileInputRef.current?.click();
                                }}
                                className="w-full px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-left transition-colors"
                              >
                                <Plus className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                                Add Document
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {hasActiveIdentity ? (
                    <div className="flex items-center p-3 bg-white rounded-xl border border-gray-200 shadow-sm gap-3 min-w-0 overflow-hidden">
                      {isIdentityPdf ? (
                        <div
                          onClick={() => openDocPreview('Identity Proof', activeIdentityUrl, true)}
                          className="h-11 w-11 rounded-lg border border-red-100 bg-red-50 flex items-center justify-center shrink-0 text-red-500 cursor-pointer hover:bg-red-100 transition-colors"
                          title="Click to preview PDF"
                        >
                          <FileText className="h-5 w-5" />
                        </div>
                      ) : (
                        <div
                          onClick={() => openDocPreview('Identity Proof', activeIdentityUrl, false)}
                          className="h-11 w-11 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                          title="Click to preview image"
                        >
                          <img
                            src={activeIdentityUrl}
                            alt={identityDisplayName}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-800 truncate" title={identityDisplayName}>
                          {identityDisplayName}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                            {isIdentityPdf ? 'PDF' : 'DOCUMENT'}
                          </span>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => openDocPreview('Identity Proof', activeIdentityUrl, isIdentityPdf)}
                            className="text-cyan-600 hover:text-cyan-800 font-medium inline-flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" /> View
                          </button>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => {
                        if (isEditMode) identityFileInputRef.current?.click();
                      }}
                      className={`flex items-center p-3 bg-white/70 rounded-xl border border-dashed border-gray-200 min-w-0 gap-3 ${isEditMode ? 'cursor-pointer hover:bg-teal-50/30 hover:border-teal-300 transition-colors group' : ''}`}
                    >
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-gray-400 group-hover:text-teal-600">
                        <FileText className="h-5 w-5 text-gray-300 group-hover:text-teal-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-600 group-hover:text-teal-800">
                          {isIdentityRemoved ? 'Document removed' : 'Document not uploaded'}
                        </p>
                        {isEditMode && (
                          <p className="text-[11px] text-gray-400 mt-0.5">Click to upload document</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Degree Certificate */}
              <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50/50 flex flex-col justify-between h-full min-w-0 relative">
                <div className="space-y-3 min-w-0">
                  <div className="flex items-start justify-between gap-2 relative">
                    <div className="min-w-0 flex-1">
                      <label className="block text-sm font-semibold text-gray-800 truncate">
                        Degree Certificate
                      </label>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed break-words">
                        Medical Degree, Certification<br className="hidden sm:inline" />
                        <span className="text-gray-400 sm:ml-1">(JPG, PNG, PDF up to 5MB)</span>
                      </p>
                    </div>

                    {/* 3-Dot Actions Menu in Edit Mode */}
                    {isEditMode && (
                      <div className="relative shrink-0 -mr-1 -mt-1" ref={degreeMenuRef}>
                        <button
                          type="button"
                          onClick={() => {
                            setIsDegreeMenuOpen(prev => !prev);
                            setIsIdentityMenuOpen(false);
                          }}
                          className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200 shadow-none hover:shadow-sm"
                          aria-label="Degree certificate actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {isDegreeMenuOpen && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                            {hasActiveDegree ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsDegreeMenuOpen(false);
                                    openDocPreview('Degree Certificate', activeDegreeUrl, isDegreePdf);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-left transition-colors"
                                >
                                  <Eye className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsDegreeMenuOpen(false);
                                    degreeFileInputRef.current?.click();
                                  }}
                                  className="w-full px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-left transition-colors"
                                >
                                  <Upload className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                                  Change
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsDegreeMenuOpen(false);
                                    handleRemoveDegreeCertificate();
                                  }}
                                  className="w-full px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 text-left transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                  Remove
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsDegreeMenuOpen(false);
                                  degreeFileInputRef.current?.click();
                                }}
                                className="w-full px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-left transition-colors"
                              >
                                <Plus className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                                Add Document
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {hasActiveDegree ? (
                    <div className="flex items-center p-3 bg-white rounded-xl border border-gray-200 shadow-sm gap-3 min-w-0 overflow-hidden">
                      {isDegreePdf ? (
                        <div
                          onClick={() => openDocPreview('Degree Certificate', activeDegreeUrl, true)}
                          className="h-11 w-11 rounded-lg border border-red-100 bg-red-50 flex items-center justify-center shrink-0 text-red-500 cursor-pointer hover:bg-red-100 transition-colors"
                          title="Click to preview PDF"
                        >
                          <FileText className="h-5 w-5" />
                        </div>
                      ) : (
                        <div
                          onClick={() => openDocPreview('Degree Certificate', activeDegreeUrl, false)}
                          className="h-11 w-11 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                          title="Click to preview image"
                        >
                          <img
                            src={activeDegreeUrl}
                            alt={degreeDisplayName}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-800 truncate" title={degreeDisplayName}>
                          {degreeDisplayName}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                            {isDegreePdf ? 'PDF' : 'DOCUMENT'}
                          </span>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => openDocPreview('Degree Certificate', activeDegreeUrl, isDegreePdf)}
                            className="text-cyan-600 hover:text-cyan-800 font-medium inline-flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" /> View
                          </button>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => {
                        if (isEditMode) degreeFileInputRef.current?.click();
                      }}
                      className={`flex items-center p-3 bg-white/70 rounded-xl border border-dashed border-gray-200 min-w-0 gap-3 ${isEditMode ? 'cursor-pointer hover:bg-teal-50/30 hover:border-teal-300 transition-colors group' : ''}`}
                    >
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-gray-400 group-hover:text-teal-600">
                        <FileText className="h-5 w-5 text-gray-300 group-hover:text-teal-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-600 group-hover:text-teal-800">
                          {isDegreeRemoved ? 'Document removed' : 'Document not uploaded'}
                        </p>
                        {isEditMode && (
                          <p className="text-[11px] text-gray-400 mt-0.5">Click to upload document</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Qualifications */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
              <svg className="w-5 h-5 mr-2 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Qualifications
            </h4>
            {isEditMode ? (
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Qualifications (comma separated)</label>
                <textarea
                  name="qualifications"
                  value={formData.qualifications}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                  placeholder="MBBS, MD, DM Cardiology..."
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {displayQualifications.length > 0 ? (
                  displayQualifications.map((qual, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cyan-50 text-cyan-800 border border-cyan-100"
                    >
                      {qual}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-400 italic text-sm font-normal">Not provided</p>
                )}
              </div>
            )}
          </div>

          {/* Availability */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="text-base font-semibold text-gray-900 flex items-center mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center mr-2.5 shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              Availability
            </h4>
            {isEditMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Days Available</label>
                  <input
                    type="text"
                    name="days"
                    value={formData.available.days}
                    onChange={handleAvailabilityChange}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                    placeholder="Monday, Wednesday, Friday"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Start Time</label>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">End Time</label>
                    <input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Session Time</label>
                    <select
                      name="sessionTime"
                      value={formData.sessionTime}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white transition-colors"
                    >
                      <option value="15 mins">15 mins</option>
                      <option value="20 mins">20 mins</option>
                      <option value="30 mins">30 mins</option>
                      <option value="45 mins">45 mins</option>
                      <option value="60 mins">60 mins</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Custom Timings Display</label>
                  <input
                    type="text"
                    name="time"
                    value={formData.available.time}
                    onChange={handleAvailabilityChange}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                    placeholder="e.g. 09:00 AM - 05:00 PM"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-start">
                <svg className="flex-shrink-0 w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium text-gray-900">{displayAvailabilityDays}</span>
                    <span className="mx-2 text-gray-400">|</span>
                    <span>{displayAvailabilityTime}</span>
                    {doctor.sessionTime && (
                      <>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-xs text-gray-500 font-medium">Session: {doctor.sessionTime}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Emergency Information */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="text-base font-semibold text-gray-900 flex items-center mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center mr-2.5 shrink-0">
                <PhoneCall className="w-4 h-4 text-cyan-600" />
              </div>
              Emergency Information
            </h4>
            {isEditMode ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Emergency Contact Name</label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    placeholder="Emergency contact name"
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Emergency Phone</label>
                  <input
                    type="tel"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleInputChange}
                    onKeyDown={handlePhoneKeyDown}
                    maxLength={10}
                    placeholder="10-digit phone number"
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Relationship</label>
                  <input
                    type="text"
                    name="emergencyRelationship"
                    value={formData.emergencyRelationship}
                    onChange={handleInputChange}
                    placeholder="e.g. Spouse, Parent, Sibling"
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Emergency Contact Name</span>
                  <span className="text-sm text-gray-900 font-medium">
                    {doctor.emergencyContact || doctor.emergency_contact || <span className="text-gray-400 italic font-normal">Not provided</span>}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Emergency Phone</span>
                  <span className="text-sm text-gray-900 font-medium">
                    {doctor.emergencyPhone || doctor.emergency_phone || <span className="text-gray-400 italic font-normal">Not provided</span>}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Relationship</span>
                  <span className="text-sm text-gray-900 font-medium">
                    {doctor.emergencyRelationship || doctor.emergency_relationship || <span className="text-gray-400 italic font-normal">Not provided</span>}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* About Doctor / Bio */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="text-base font-semibold text-gray-900 flex items-center mb-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center mr-2.5 shrink-0">
                <FileText className="w-4 h-4 text-cyan-600" />
              </div>
              About Doctor
            </h4>
            {isEditMode ? (
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Brief description about the doctor..."
                />
              </div>
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {doctor.bio ? doctor.bio : <span className="text-gray-400 italic font-normal">Not provided</span>}
              </p>
            )}
          </div>
        </div>

        {/* Footer with action buttons */}
        <div className="flex-shrink-0 bg-white px-6 py-3.5 border-t border-gray-200 flex justify-end space-x-3">
          {isEditMode ? (
            <>
              <button
                type="button"
                onClick={handleSaveDoctor}
                disabled={isUpdating || isPhotoUploading || isDocUploading}
                className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all shadow-md disabled:opacity-70 flex items-center gap-2 cursor-pointer"
              >
                {(isUpdating || isPhotoUploading || isDocUploading) ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isPhotoUploading ? 'Uploading Photo...' : isDocUploading ? 'Uploading Documents...' : 'Saving...'}
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isUpdating || isPhotoUploading || isDocUploading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md flex items-center cursor-pointer"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>

      {/* View Photo Modal */}
      {isViewPhotoModalOpen && currentDisplayPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsViewPhotoModalOpen(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm w-full p-4 border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h4 className="text-sm font-semibold text-gray-900 truncate">
                Dr. {fullName}
              </h4>
              <button
                type="button"
                onClick={() => setIsViewPhotoModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 aspect-square rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100">
              <img
                src={currentDisplayPhoto}
                alt={fullName}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      )}

      {/* View Document Preview Modal */}
      {docPreviewModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={closeDocPreview}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate pr-4">
                {docPreviewModal.title}
              </h3>
              <button
                type="button"
                onClick={closeDocPreview}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50/70 min-h-[300px]">
              {docPreviewModal.isPdf ? (
                <iframe
                  src={docPreviewModal.url}
                  title={docPreviewModal.title}
                  className="w-full h-[70vh] rounded-lg border border-gray-200 bg-white"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full max-h-[70vh]">
                  <img
                    src={docPreviewModal.url}
                    alt={docPreviewModal.title}
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

// Confirmation Modal for Status Toggle (Activate / Deactivate)
function StatusConfirmationModal({ 
  isOpen, 
  doctor, 
  targetStatus, 
  onClose, 
  onConfirm, 
  isLoading 
}) {
  if (!isOpen || !doctor) return null;

  const isDeactivating = targetStatus === 'inactive';
  const doctorName = `Dr. ${formatTitleCase(doctor.firstName || doctor.first_name || '')} ${formatTitleCase(doctor.lastName || doctor.last_name || '')}`.trim();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 relative animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isDeactivating ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {isDeactivating ? (
              <PowerOff className="h-6 w-6" />
            ) : (
              <Check className="h-6 w-6" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {isDeactivating ? 'Deactivate Doctor' : 'Activate Doctor'}
            </h3>
            <p className="text-xs text-gray-500">
              Status change confirmation
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          {isDeactivating ? (
            <>
              Are you sure you want to deactivate <strong className="text-gray-900">{doctorName}</strong>? While deactivated, this doctor will not be able to log in, and their status will show as <span className="font-semibold text-rose-600">Inactive</span>.
            </>
          ) : (
            <>
              Are you sure you want to activate <strong className="text-gray-900">{doctorName}</strong>? The doctor will regain login access and be marked as <span className="font-semibold text-emerald-600">Active</span> in your clinic.
            </>
          )}
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-all shadow-md flex items-center gap-2 disabled:opacity-70 ${
              isDeactivating 
                ? 'bg-rose-600 hover:bg-rose-700' 
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              isDeactivating ? 'Confirm Deactivate' : 'Confirm Activate'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DoctorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'firstName', direction: 'asc' });
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Status Confirmation Modal State
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    doctor: null,
    targetStatus: 'active',
    isLoading: false
  });

  const getClinicId = () => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return null;
    try {
      const data = JSON.parse(savedUser);
      return data.id || data.clinicId || data._id || null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const clinicId = getClinicId();
    if (clinicId) {
      fetchDoctors(clinicId);
    } else {
      setLoading(false);
      setError('Clinic identification not found. Please log in again.');
    }
  }, []);

  const fetchDoctors = async (clinicId) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/clinic/fetch-doctor-clinicId/${clinicId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const responseData = await response.json();

      if (responseData.success) {
        const rawDocs = responseData.data?.doctors || [];
        const transformedDoctors = rawDocs.map(doc => ({
          _id: doc._id || doc.id,
          id: doc._id || doc.id,
          firstName: doc.firstName || doc.first_name || '',
          lastName: doc.lastName || doc.last_name || '',
          specialty: doc.specialty || '',
          supSpeciality: doc.supSpeciality || doc.sup_speciality || '',
          experience: doc.experience ?? '',
          location: doc.location || doc.hospitalAddress || doc.hospital_address || doc.homeAddress || doc.home_address || '',
          hospitalCity: doc.hospitalCity || doc.hospital_city || doc.location || '',
          homeAddress: doc.homeAddress || doc.home_address || '',
          hospital: doc.hospital || '',
          hospitalAddress: doc.hospitalAddress || doc.hospital_address || '',
          hospitalPhone: doc.hospitalPhone || doc.hospital_phone || doc.hospitalNumber || doc.hospital_number || '',
          hospitalNumber: doc.hospitalNumber || doc.hospital_number || doc.hospitalPhone || doc.hospital_phone || '',
          department: doc.department || '',
          available: doc.available || { days: doc.available_days || doc.availableDays || [] },
          availableDays: doc.availableDays || doc.available_days || [],
          sessionTime: doc.sessionTime || doc.session_time || '',
          startTime: doc.startTime || doc.start_time || '',
          endTime: doc.endTime || doc.end_time || '',
          qualifications: doc.qualifications || [],
          consultantFee: doc.consultantFee || doc.consultant_fee || doc.consultation_fee || '',
          consultationFee: doc.consultationFee || doc.consultant_fee || doc.consultantFee || '',
          status: doc.status || 'active',
          phone: doc.phone || '',
          email: doc.email || '',
          profileImage: doc.profileImage || doc.profile_image || '',
          bio: doc.bio || '',
          gender: doc.gender || '',
          dateOfBirth: doc.dateOfBirth || doc.date_of_birth || '',
          licenseNumber: doc.licenseNumber || doc.license_number || '',
          isVerified: Boolean(doc.isVerified ?? doc.is_verified ?? false),
          identityProof: doc.identityProof || doc.identity_proof || null,
          degreeCertificate: doc.degreeCertificate || doc.degree_certificate || null,
          emergencyContact: doc.emergencyContact || doc.emergency_contact || '',
          emergencyPhone: doc.emergencyPhone || doc.emergency_phone || '',
          emergencyRelationship: doc.emergencyRelationship || doc.emergency_relationship || ''
        }));
        setDoctors(transformedDoctors);
      } else {
        setError(responseData.message || 'Failed to fetch doctors.');
      }
    } catch (err) {
      console.error('Error fetching clinic doctors:', err);
      setError('An error occurred while fetching doctors.');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Secure Clinic Doctor Update Handler
  const handleUpdateDoctor = async (doctorId, formattedData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/doctor/update-by-id/${doctorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formattedData)
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        const returnedDoctor = data.data?.doctor || data.data || {};
        const normalizedDoctor = {
          ...formattedData,
          ...returnedDoctor,
          id: doctorId,
          _id: doctorId
        };

        setDoctors(prev => prev.map(d => (d.id === doctorId || d._id === doctorId) ? { ...d, ...normalizedDoctor } : d));
        setSelectedDoctor(prev => prev ? { ...prev, ...normalizedDoctor } : null);
        
        setSuccessMessage('Doctor details updated successfully.');
        setTimeout(() => setSuccessMessage(null), 4000);

        // Re-fetch to ensure database state sync
        const clinicId = getClinicId();
        if (clinicId) fetchDoctors(clinicId);

        return true;
      } else {
        throw new Error(data.message || 'Failed to update doctor.');
      }
    } catch (err) {
      console.error('Error in handleUpdateDoctor:', err);
      throw err;
    }
  };

  // Status Management Handler
  const handleInitiateStatusChange = (doctor, targetStatus) => {
    setStatusModal({
      isOpen: true,
      doctor,
      targetStatus,
      isLoading: false
    });
  };

  const handleConfirmStatusChange = async () => {
    const { doctor, targetStatus } = statusModal;
    if (!doctor) return;

    setStatusModal(prev => ({ ...prev, isLoading: true }));
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/clinic/doctor-status/${doctor.id || doctor._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: targetStatus })
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        setDoctors(prev => prev.map(d => (d.id === doctor.id || d._id === doctor.id) ? { ...d, status: targetStatus } : d));
        if (selectedDoctor && (selectedDoctor.id === doctor.id || selectedDoctor._id === doctor.id)) {
          setSelectedDoctor(prev => ({ ...prev, status: targetStatus }));
        }

        setStatusModal({ isOpen: false, doctor: null, targetStatus: 'active', isLoading: false });
        setSuccessMessage(`Doctor status changed to ${targetStatus} successfully.`);
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        alert(data.message || 'Failed to update doctor status.');
        setStatusModal(prev => ({ ...prev, isLoading: false }));
      }
    } catch (err) {
      console.error('Error changing doctor status:', err);
      alert(err.message || 'Network error occurred while changing status.');
      setStatusModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const sortedDoctors = useMemo(() => {
    return [...doctors].sort((a, b) => {
      const aValue = (a[sortConfig.key] || '').toString().toLowerCase();
      const bValue = (b[sortConfig.key] || '').toString().toLowerCase();
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [doctors, sortConfig]);

  const filteredDoctors = useMemo(() => {
    return sortedDoctors.filter(doctor => {
      const firstName = doctor.firstName || '';
      const lastName = doctor.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
      const email = (doctor.email || '').toLowerCase();
      const specialty = (doctor.specialty || '').toLowerCase();
      const location = (doctor.location || doctor.hospitalAddress || doctor.homeAddress || '').toLowerCase();
      const license = (doctor.licenseNumber || '').toLowerCase();
      const phone = (doctor.phone || '').toLowerCase();
      const search = (searchTerm || '').toLowerCase();

      const matchesSearch = searchTerm === '' ||
        fullName.includes(search) ||
        email.includes(search) ||
        specialty.includes(search) ||
        location.includes(search) ||
        license.includes(search) ||
        phone.includes(search);

      const matchesSpecialty = filterSpecialty === 'all' || doctor.specialty === filterSpecialty;
      const matchesStatus = filterStatus === 'all' || (doctor.status || 'active').toLowerCase() === filterStatus.toLowerCase();

      return matchesSearch && matchesSpecialty && matchesStatus;
    });
  }, [sortedDoctors, searchTerm, filterSpecialty, filterStatus]);

  const specialties = useMemo(() => {
    const uniqueSpecialties = [...new Set(doctors.map(d => d.specialty).filter(Boolean))];
    return ['all', ...uniqueSpecialties];
  }, [doctors]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Management</h1>
          <p className="text-sm text-gray-500">Manage your clinic doctors, edit profiles, and regulate active statuses</p>
        </div>
        <Link
          href="/clinic/doctors/add"
          className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg font-medium text-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Doctor
        </Link>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-lg flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mr-3" />
            <p className="text-sm text-emerald-800 font-medium">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error Message Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search doctors by name, specialty, location, license, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-cyan-600 transition-colors"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            {(searchTerm || filterSpecialty !== 'all' || filterStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterSpecialty('all');
                  setFilterStatus('all');
                }}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-cyan-600 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                <select
                  value={filterSpecialty}
                  onChange={(e) => setFilterSpecialty(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white text-sm"
                >
                  {specialties.map(specialty => (
                    <option key={specialty} value={specialty}>
                      {specialty === 'all' ? 'All Specialties' : specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                  <option value="pending">Pending Only</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterSpecialty('all');
                    setFilterStatus('all');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-cyan-600 transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Doctor Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('firstName')}
                  >
                    <div className="flex items-center">
                      Doctor Name
                      {sortConfig.key === 'firstName' && (
                        sortConfig.direction === 'asc' ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Specialty
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Contact
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      {sortConfig.key === 'status' && (
                        sortConfig.direction === 'asc' ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Verification
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDoctors.length > 0 ? (
                  filteredDoctors.map((doctor, idx) => {
                    const firstName = formatTitleCase(doctor.firstName || doctor.first_name || '');
                    const lastName = formatTitleCase(doctor.lastName || doctor.last_name || '');
                    const fullName = `${firstName} ${lastName}`.trim() || 'Doctor';
                    const initial = (firstName || lastName || 'D').charAt(0).toUpperCase();
                    const status = (doctor.status || 'active').toLowerCase();
                    const statusText = status.charAt(0).toUpperCase() + status.slice(1);
                    const isActive = status === 'active';

                    return (
                      <tr key={doctor._id || doctor.id || idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-teal-100 to-cyan-100 flex items-center justify-center">
                              {(doctor.profileImage || doctor.profile_image) ? (
                                <img
                                  src={doctor.profileImage || doctor.profile_image}
                                  alt={fullName}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-teal-600 font-medium">{initial}</span>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">Dr. {fullName}</div>
                              <div className="text-sm text-gray-500">{doctor.location || doctor.hospitalAddress || doctor.homeAddress || 'No address'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{doctor.specialty || 'General'}</div>
                          {doctor.supSpeciality && (
                            <div className="text-xs text-gray-400">{doctor.supSpeciality}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{doctor.phone || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{doctor.email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
                            {statusText}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {doctor.isVerified ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              Verified
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {/* View Doctor Details */}
                            <button
                              onClick={() => {
                                setSelectedDoctor(doctor);
                                setIsEditMode(false);
                                setShowViewModal(true);
                              }}
                              className="text-cyan-600 hover:text-cyan-900 p-1.5 rounded-lg hover:bg-cyan-50 transition-colors"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* Edit Doctor Profile */}
                            <button
                              onClick={() => {
                                setSelectedDoctor(doctor);
                                setIsEditMode(true);
                                setShowViewModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Edit doctor profile"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            {/* Activate / Deactivate Toggle */}
                            {isActive ? (
                              <button
                                onClick={() => handleInitiateStatusChange(doctor, 'inactive')}
                                className="text-amber-600 hover:text-amber-800 p-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                                title="Deactivate doctor"
                              >
                                <PowerOff className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleInitiateStatusChange(doctor, 'active')}
                                className="text-emerald-600 hover:text-emerald-800 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                                title="Activate doctor"
                              >
                                <Power className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      {error ? (
                        <span className="text-red-500 font-medium">{error}</span>
                      ) : (searchTerm || filterSpecialty !== 'all' || filterStatus !== 'all'
                        ? 'No doctors found matching your criteria'
                        : 'No doctors found. Add a new doctor to get started.'
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View & Edit Doctor Details Modal */}
      {showViewModal && selectedDoctor && (
        <DoctorDetailsModal
          doctor={selectedDoctor}
          onClose={() => {
            setShowViewModal(false);
            setSelectedDoctor(null);
            setIsEditMode(false);
          }}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
          onSave={handleUpdateDoctor}
        />
      )}

      {/* Activate / Deactivate Confirmation Modal */}
      <StatusConfirmationModal
        isOpen={statusModal.isOpen}
        doctor={statusModal.doctor}
        targetStatus={statusModal.targetStatus}
        isLoading={statusModal.isLoading}
        onClose={() => setStatusModal({ isOpen: false, doctor: null, targetStatus: 'active', isLoading: false })}
        onConfirm={handleConfirmStatusChange}
      />
    </div>
  );
}
