'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import { handlePhoneKeyDown } from '@/utils/phoneValidation';
import {
  User,
  Mail,
  Phone,
  Building2,
  ShieldCheck,
  LogOut,
  Calendar,
  CheckCircle2,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  ClipboardList,
  HeartPulse,
  Droplets,
  FileText,
  Clock,
  Edit,
  Save,
  Check,
  Camera
} from 'lucide-react';

export const resolveAvatarUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim();
  if (!clean) return null;
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:') || clean.startsWith('blob:')) {
    return clean;
  }
  if (clean.startsWith('/')) {
    return `${API_BASE_URL}${clean}`;
  }
  return `${API_BASE_URL}/${clean}`;
};

export default function NurseProfilePage() {
  const router = useRouter();
  const [nurseData, setNurseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // Photo upload & preview states
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Profile edit states
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'nurse') {
        router.push('/login');
        return;
      }
      setNurseData(user);
      setEditForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phoneNumber || user.phone || ''
      });
    } catch (err) {
      console.error('Error loading nurse profile session:', err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Dismiss profile dropdown on outside click or Escape key press
  useEffect(() => {
    if (!profileDropdownOpen) return;

    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileDropdownOpen]);

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
    } catch (_) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Helper to upload file via existing frontend /api/upload or backend fallback
  const uploadNursePhoto = async (file) => {
    if (!file) return null;

    // 1. Try Next.js Cloudinary upload route
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('folder', 'nurse-profiles');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData
      });
      if (res.ok) {
        const json = await res.json();
        if (json.url) return json.url;
      }
    } catch (e) {
      console.warn('Frontend /api/upload attempt bypassed, checking backend:', e);
    }

    // 2. Fallback to existing backend upload-nurse-photo route
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('folder', 'nurse-profiles');
      const uploadRes = await fetch(`${API_BASE_URL}/api/v1/clinic/upload-nurse-photo`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: uploadData
      });
      const uploadJson = await uploadRes.json();
      if (uploadRes.ok && uploadJson.success && uploadJson.data?.url) {
        return resolveAvatarUrl(uploadJson.data.url);
      }
    } catch (uploadErr) {
      console.error('Backend photo upload failed:', uploadErr);
    }

    return null;
  };

  // File selection with validation (JPG, PNG, WEBP; <= 5MB)
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage('');
    setErrorMessage('');

    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const isAllowedType = ALLOWED_TYPES.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name || '');

    if (!isAllowedType) {
      setErrorMessage('Invalid file format. Please select a JPG, PNG, or WebP image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      setErrorMessage('Image size exceeds 5MB limit. Please choose a smaller file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedPhotoFile(file);
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  };

  // Confirm photo upload
  const handleConfirmUploadPhoto = async () => {
    if (!selectedPhotoFile) return;

    setIsUploadingPhoto(true);
    setStatusMessage('');
    setErrorMessage('');

    try {
      const uploadedUrl = await uploadNursePhoto(selectedPhotoFile);
      if (!uploadedUrl) {
        throw new Error('Failed to upload photo. Please check your network connection and try again.');
      }

      const userStr = localStorage.getItem('user');
      const user = JSON.parse(userStr || '{}');
      const nurseId = user.id || user._id;

      // Update nurse profile in backend if endpoints are accessible
      if (nurseId) {
        try {
          await fetch(`${API_BASE_URL}/api/v1/clinic/update-nurse/${nurseId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders()
            },
            body: JSON.stringify({
              photo: uploadedUrl,
              avatarUrl: uploadedUrl,
              profileImage: uploadedUrl
            })
          });
        } catch (_) {}

        try {
          await fetch(`${API_BASE_URL}/api/v1/user/update/${nurseId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders()
            },
            body: JSON.stringify({
              photo: uploadedUrl,
              avatarUrl: uploadedUrl,
              profileImage: uploadedUrl
            })
          });
        } catch (_) {}
      }

      // Persist in localStorage and component state
      const updatedUser = {
        ...user,
        profileImage: uploadedUrl,
        avatarUrl: uploadedUrl,
        photo: uploadedUrl
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setNurseData(updatedUser);

      // Clean up preview state
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
      setPhotoPreview(null);
      setSelectedPhotoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setStatusMessage('Profile photo updated successfully.');
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) {
      console.error('Photo upload error:', err);
      setErrorMessage(err.message || 'An error occurred while uploading profile photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Cancel photo preview
  const handleCancelPhotoPreview = () => {
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
    setSelectedPhotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setStatusMessage('');
    setErrorMessage('');
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    setIsSaving(true);
    setStatusMessage('');
    setErrorMessage('');

    try {
      const userStr = localStorage.getItem('user');
      const user = JSON.parse(userStr || '{}');
      const nurseId = user.id || user._id;
      const token = localStorage.getItem('token');

      const updatedUser = {
        ...user,
        firstName: editForm.firstName.trim() || user.firstName,
        lastName: editForm.lastName.trim() || user.lastName,
        email: editForm.email.trim() || user.email,
        phone: editForm.phone.trim() || user.phone,
        phoneNumber: editForm.phone.trim() || user.phoneNumber
      };

      // Persist in localStorage so dashboard and profile stay synchronized
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setNurseData(updatedUser);

      // Attempt backend update if endpoint is available
      if (nurseId) {
        try {
          await fetch(`${API_BASE_URL}/api/v1/user/update/${nurseId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify(updatedUser)
          });
        } catch (_) {}
      }

      setStatusMessage('Profile updated successfully.');
      setIsEditing(false);
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) {
      console.error('Update profile error:', err);
      setErrorMessage(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  const fullName = `${nurseData?.firstName || 'Staff'} ${nurseData?.lastName || 'Nurse'}`.trim();
  const initial = (nurseData?.firstName || 'N').charAt(0).toUpperCase();
  const wardName = nurseData?.wardName || nurseData?.ward?.name || 'Inpatient Department';
  const clinicName = nurseData?.clinicName || nurseData?.clinic?.name || 'ClinicPro Medical Center';
  const currentPhotoUrl = resolveAvatarUrl(
    nurseData?.profileImage || nurseData?.avatarUrl || nurseData?.avatar_url || nurseData?.photo
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] relative text-slate-800 overflow-x-clip">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar - Following Dashboard Shell */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200/80 flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <img src="/icons8-medical-bag-100.png" alt="ClinicPro" className="w-8 h-8 object-contain" />
              <div>
                <h1 className="text-xl font-bold text-slate-800 leading-tight">ClinicPro</h1>
                <p className="text-xs font-semibold text-blue-600">Staff Nurse</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="mt-4 px-3 space-y-6 flex-1">
            {/* Main Navigation Section */}
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Main Navigation
              </p>
              <div className="space-y-1">
                <Link
                  href="/nurse-dashboard"
                  onClick={() => setSidebarOpen(false)}
                  className="w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-xs text-left text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                >
                  <LayoutDashboard className="w-4 h-4 mr-3 flex-shrink-0 text-slate-400" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/nurse-dashboard"
                  onClick={() => setSidebarOpen(false)}
                  className="w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-xs text-left text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                >
                  <ClipboardList className="w-4 h-4 mr-3 flex-shrink-0 text-slate-400" />
                  <span>Assigned Inpatients</span>
                </Link>
              </div>
            </div>

            {/* Nursing Care Section */}
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Nursing Care
              </p>
              <div className="space-y-1">
                <Link
                  href="/nurse-dashboard"
                  onClick={() => setSidebarOpen(false)}
                  className="w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-xs text-left text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                >
                  <HeartPulse className="w-4 h-4 mr-3 flex-shrink-0 text-slate-400" />
                  <span>Vitals & Observations</span>
                </Link>

                <Link
                  href="/nurse-dashboard"
                  onClick={() => setSidebarOpen(false)}
                  className="w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-xs text-left text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                >
                  <Droplets className="w-4 h-4 mr-3 flex-shrink-0 text-slate-400" />
                  <span>Intake / Output (I/O)</span>
                </Link>

                <Link
                  href="/nurse-dashboard"
                  onClick={() => setSidebarOpen(false)}
                  className="w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-xs text-left text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                >
                  <FileText className="w-4 h-4 mr-3 flex-shrink-0 text-slate-400" />
                  <span>Nursing Notes</span>
                </Link>

                <Link
                  href="/nurse-dashboard"
                  onClick={() => setSidebarOpen(false)}
                  className="w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-xs text-left text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                >
                  <Clock className="w-4 h-4 mr-3 flex-shrink-0 text-slate-400" />
                  <span>Shift Handover</span>
                </Link>
              </div>
            </div>

            {/* Settings Section */}
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Settings
              </p>
              <div className="space-y-1">
                <div
                  className="w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-xs text-left bg-blue-50 text-blue-700 font-semibold shadow-xs"
                >
                  <User className="w-4 h-4 mr-3 flex-shrink-0 text-blue-600" />
                  <span>Profile</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-xs text-left text-slate-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-3 flex-shrink-0 text-slate-400" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:ml-72 flex-1 flex flex-col min-h-screen">
        {/* Top Header - Matching Nurse Dashboard */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors mr-3"
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  Staff Nurse Profile
                </h1>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Account & Professional Details • {wardName}
                </p>
              </div>
            </div>

            {/* Top-Right Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                id="btn-nurse-profile-menu"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
              >
                <div className="hidden sm:flex flex-col items-end text-right">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {fullName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">Staff Nurse • {wardName}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs uppercase shadow-2xs border border-rose-200/60 flex-shrink-0 overflow-hidden">
                  {currentPhotoUrl ? (
                    <img src={currentPhotoUrl} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 hidden sm:block ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileDropdownOpen && (
                <div
                  id="nurse-profile-dropdown"
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-1.5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{fullName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{nurseData?.email || 'nurse@clinicpro.com'}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                      Staff Nurse
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      id="btn-dropdown-view-profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 bg-slate-50 text-blue-600 transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <User className="w-4 h-4 text-blue-600" />
                      <span>View Profile</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      id="btn-dropdown-logout"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Profile Content Body - Matching Doctor Profile Structure */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Title Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">My Profile</h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Manage your personal and professional information</p>
              </div>

              {statusMessage && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium animate-in fade-in">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium animate-in fade-in">
                  <X className="w-3.5 h-3.5 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Banner Card */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />
              </div>
              <div className="p-6 relative">
                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-end -mt-16">
                  {/* Profile Avatar with Camera Upload Button */}
                  <div className="relative group flex-shrink-0">
                    <div className="w-24 h-24 bg-white rounded-2xl p-1 shadow-md border border-slate-200 flex items-center justify-center text-3xl font-black text-rose-600 bg-rose-50 overflow-hidden relative">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Photo preview" className="w-full h-full object-cover rounded-xl" />
                      ) : currentPhotoUrl ? (
                        <img src={currentPhotoUrl} alt={fullName} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <span>{initial}</span>
                      )}

                      {photoPreview && (
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-600/90 text-white text-[9px] font-bold rounded uppercase tracking-wider backdrop-blur-xs">
                          Preview
                        </span>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoSelect}
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      className="hidden"
                    />

                    <button
                      type="button"
                      id="btn-upload-nurse-photo"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      title={currentPhotoUrl ? "Change profile photo" : "Upload profile photo"}
                      aria-label="Upload or change profile photo"
                      className="absolute -bottom-1 -right-1 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isUploadingPhoto ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h3 className="text-2xl font-bold text-slate-900">{fullName}</h3>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 self-center sm:self-auto">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Staff Nurse
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Assigned Ward: <strong className="text-slate-700 font-semibold">{wardName}</strong> • {clinicName}
                    </p>

                    {/* Preview Confirmation Actions */}
                    {photoPreview && (
                      <div className="inline-flex items-center gap-2 mt-2 p-1.5 bg-blue-50/90 border border-blue-200 rounded-xl animate-in fade-in duration-150">
                        <span className="text-[11px] font-semibold text-blue-900 ml-1">Save new photo?</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            id="btn-confirm-nurse-photo"
                            onClick={handleConfirmUploadPhoto}
                            disabled={isUploadingPhoto}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 transition disabled:opacity-50 cursor-pointer shadow-xs"
                          >
                            {isUploadingPhoto ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Confirm</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            id="btn-cancel-nurse-photo"
                            onClick={handleCancelPhotoPreview}
                            disabled={isUploadingPhoto}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Active Duty
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(!isEditing);
                        setStatusMessage('');
                        setErrorMessage('');
                      }}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
                      <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Grid - Matching Doctor Profile Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Personal / Contact Information Card */}
              <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Personal & Contact Information
                      </h4>
                      <p className="text-[11px] text-slate-500">Contact details and nurse identity</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 font-bold">First Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.firstName}
                          onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                          className="w-full mt-1 p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                      ) : (
                        <p className="text-xs font-semibold text-slate-800 mt-1">{nurseData?.firstName || 'Staff'}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 font-bold">Last Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.lastName}
                          onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                          className="w-full mt-1 p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                      ) : (
                        <p className="text-xs font-semibold text-slate-800 mt-1">{nurseData?.lastName || 'Nurse'}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full mt-1 p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    ) : (
                      <p className="text-xs font-mono font-semibold text-slate-800 mt-1">{nurseData?.email || 'nurse@clinicpro.com'}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        onKeyDown={handlePhoneKeyDown}
                        maxLength={10}
                        placeholder="10-digit phone number"
                        className="w-full mt-1 p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    ) : (
                      <p className="text-xs font-mono font-semibold text-slate-800 mt-1">
                        {nurseData?.phoneNumber || nurseData?.phone || 'Not recorded'}
                      </p>
                    )}
                  </div>

                  {isEditing && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Identity Card */}
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Professional Identity
                    </h4>
                    <p className="text-[11px] text-slate-500">Clinical role & hospital assignment</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                    <span className="text-slate-500">Designation</span>
                    <span className="font-semibold text-slate-800 text-right">Staff Nurse</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                    <span className="text-slate-500">Staff Role</span>
                    <span className="font-mono text-slate-800 uppercase font-semibold">nurse</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                    <span className="text-slate-500">Assigned Ward</span>
                    <span className="font-semibold text-slate-800 text-right">{wardName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                    <span className="text-slate-500">Healthcare Facility</span>
                    <span className="font-semibold text-slate-800 text-right">{clinicName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      Clinic ID
                    </span>
                    <span className="font-mono text-slate-500 text-[11px] truncate max-w-[150px]">
                      {nurseData?.clinicId || nurseData?.clinic_id || 'Primary Facility'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Session Status
                    </span>
                    <span className="text-emerald-700 font-semibold">Authenticated</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
