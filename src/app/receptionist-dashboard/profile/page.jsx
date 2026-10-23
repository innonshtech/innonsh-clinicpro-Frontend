'use client';
import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '@/utils/api';
import { validatePhoneNumber, handlePhoneKeyDown, normalizePhoneNumber } from '@/utils/phoneValidation';
import { 
  User, Mail, Phone, Edit, Save, X, Building, Camera, UploadCloud, CheckCircle, AlertCircle
} from 'lucide-react';

export default function ReceptionistProfilePage() {
  const [staffData, setStaffData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Photo upload states
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState({ type: '', text: '' });
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  const resolveAvatarUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const user = JSON.parse(userStr || '{}');
        const staffId = user.id || user._id;

        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        if (staffId) {
          const res = await fetch(`${API_BASE_URL}/api/v1/clinic/update-receptionist/${staffId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (res.status === 401) {
            localStorage.clear();
            window.location.href = '/login';
            return;
          }

          const result = await res.json();
          if (result.success && result.data?.staff) {
            const st = result.data.staff;
            const photoUrl = resolveAvatarUrl(st.avatarUrl || st.photo || st.profileImage || user.avatarUrl || user.photo);
            setStaffData({
              ...st,
              firstName: st.firstName || st.first_name || user.firstName || 'Receptionist',
              lastName: st.lastName || st.last_name || user.lastName || '',
              email: st.email || user.email || '',
              phone: st.phone || st.phoneNumber || user.phone || user.phoneNumber || '',
              clinicName: st.clinicName || st.clinic_name || user.clinicName || 'N/A',
              status: st.status || user.status || 'Active',
              photo: photoUrl,
              avatarUrl: photoUrl
            });
            setLoading(false);
            return;
          }
        }

        // Fallback from localStorage
        const storedPhoto = resolveAvatarUrl(user.avatarUrl || user.photo || user.profileImage);
        setStaffData({
          firstName: user.firstName || 'Receptionist',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phoneNumber || user.phone || '',
          clinicName: user.clinicName || 'N/A',
          status: user.status || 'Active',
          photo: storedPhoto,
          avatarUrl: storedPhoto
        });
      } catch (error) {
        console.error("Profile Load Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Upload helper: attempts /api/upload (Cloudinary) then backend fallback
  const uploadPhotoToServer = async (file) => {
    if (!file) return null;

    // 1. Try Next.js Cloudinary upload route
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('folder', 'receptionist-profiles');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData
      });
      if (res.ok) {
        const json = await res.json();
        if (json.url) return json.url;
      }
    } catch (e) {
      console.warn('Frontend /api/upload bypassed, trying backend:', e);
    }

    // 2. Fallback to backend upload-receptionist-photo route
    try {
      const token = localStorage.getItem('token');
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('folder', 'receptionist-profiles');
      const uploadRes = await fetch(`${API_BASE_URL}/api/v1/clinic/upload-receptionist-photo`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
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

  // Handle file selection with validation
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoMessage({ type: '', text: '' });

    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const isAllowedType = ALLOWED_TYPES.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name || '');

    if (!isAllowedType) {
      setPhotoMessage({
        type: 'error',
        text: 'Invalid file format. Please select a JPG, PNG, or WebP image.'
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      setPhotoMessage({
        type: 'error',
        text: 'Image size exceeds 5MB limit. Please choose a smaller file.'
      });
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

  // Upload and persist photo
  const handleConfirmUploadPhoto = async () => {
    if (!selectedPhotoFile) return;

    setIsUploadingPhoto(true);
    setPhotoMessage({ type: '', text: '' });

    try {
      const uploadedUrl = await uploadPhotoToServer(selectedPhotoFile);
      if (!uploadedUrl) {
        throw new Error('Failed to upload photo. Please check your network connection and try again.');
      }

      const userStr = localStorage.getItem('user');
      const user = JSON.parse(userStr || '{}');
      const staffId = user.id || user._id;

      // Update backend receptionist record
      if (staffId) {
        const token = localStorage.getItem('token');
        try {
          await fetch(`${API_BASE_URL}/api/v1/clinic/update-receptionist/${staffId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              photo: uploadedUrl,
              avatarUrl: uploadedUrl,
              profileImage: uploadedUrl
            })
          });
        } catch (err) {
          console.warn('Backend update-receptionist call failed, updated locally:', err);
        }
      }

      // Update local storage and dispatch events
      const updatedUser = {
        ...user,
        photo: uploadedUrl,
        avatarUrl: uploadedUrl,
        profileImage: uploadedUrl
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('user-profile-updated'));

      // Update component state
      setStaffData(prev => ({
        ...prev,
        photo: uploadedUrl,
        avatarUrl: uploadedUrl
      }));
      setSelectedPhotoFile(null);
      setPhotoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setPhotoMessage({
        type: 'success',
        text: 'Profile photo updated and saved successfully!'
      });
    } catch (err) {
      setPhotoMessage({
        type: 'error',
        text: err.message || 'Failed to upload photo. Please try again.'
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleCancelPhotoSelect = () => {
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    setSelectedPhotoFile(null);
    setPhotoPreview(null);
    setPhotoMessage({ type: '', text: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    setSaveMessage({ type: '', text: '' });

    // Normalize and validate phone value safely
    const rawPhone = staffData.phone !== undefined && staffData.phone !== null ? String(staffData.phone).trim() : '';
    let cleanPhone = '';

    if (rawPhone) {
      // Validate: validatePhoneNumber returns null on success or an error string on failure
      const phoneErr = validatePhoneNumber(rawPhone, false, 'Phone number');
      if (phoneErr) {
        setSaveMessage({ type: 'error', text: phoneErr });
        return;
      }
      cleanPhone = normalizePhoneNumber(rawPhone);
    }

    setIsSaving(true);
    try {
      const userStr = localStorage.getItem('user');
      const user = JSON.parse(userStr || '{}');
      const staffId = user.id || user._id;

      if (staffId) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/v1/clinic/update-receptionist/${staffId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            firstName: staffData.firstName,
            lastName: staffData.lastName,
            email: staffData.email,
            phone: cleanPhone
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to update profile');
        }
      }

      // Update user in localStorage while preserving profile photos and other details
      const updatedUser = {
        ...user,
        firstName: staffData.firstName,
        lastName: staffData.lastName,
        email: staffData.email,
        phone: cleanPhone,
        phoneNumber: cleanPhone,
        avatarUrl: staffData.avatarUrl || user.avatarUrl || null,
        photo: staffData.photo || user.photo || null,
        profileImage: staffData.avatarUrl || user.profileImage || null
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('user-profile-updated'));

      setStaffData(prev => ({
        ...prev,
        phone: cleanPhone
      }));

      setIsEditing(false);
      setSaveMessage({ type: 'success', text: 'Profile details saved successfully!' });
    } catch (error) {
      console.error("Update Error:", error);
      setSaveMessage({ type: 'error', text: error.message || 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!staffData) {
    return <p className="text-center text-red-500 py-12">Profile data inaccessible.</p>;
  }

  const currentAvatarSrc = photoPreview || staffData.avatarUrl || staffData.photo;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">Manage your personal details and profile photo</p>
        </div>
      </div>

      {/* Notifications */}
      {photoMessage.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
          photoMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          {photoMessage.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle className="w-5 h-5 shrink-0" />}
          <span>{photoMessage.text}</span>
        </div>
      )}

      {saveMessage.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
          saveMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          {saveMessage.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle className="w-5 h-5 shrink-0" />}
          <span>{saveMessage.text}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        <div className="p-6 relative">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-end -mt-16">
            
            {/* Avatar & Photo Upload Controls */}
            <div className="relative group flex-shrink-0 inline-block">
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-full p-1 shadow-md border-2 border-white overflow-hidden flex items-center justify-center bg-slate-50">
                {currentAvatarSrc ? (
                  <img 
                    src={currentAvatarSrc} 
                    alt={`${staffData.firstName} ${staffData.lastName}`} 
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-3xl font-bold">
                    {staffData.firstName?.[0] || 'R'}{staffData.lastName?.[0] || ''}
                  </div>
                )}
              </div>

              {/* Photo Upload Trigger Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md border-2 border-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center z-10"
                title="Change Profile Photo"
                aria-label="Change Profile Photo"
                id="btn-change-photo"
              >
                {isUploadingPhoto ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoSelect}
                className="hidden"
                id="receptionist-photo-input"
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-slate-800">{staffData.firstName} {staffData.lastName}</h1>
              <p className="text-sm text-slate-500 font-medium">Receptionist / Front Desk</p>

              {/* Pending Photo Upload Action Bar */}
              {selectedPhotoFile && (
                <div className="mt-3 flex items-center gap-2 justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={handleConfirmUploadPhoto}
                    disabled={isUploadingPhoto}
                    className="px-3 py-1.5 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    {isUploadingPhoto ? 'Uploading...' : 'Save Photo'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelPhotoSelect}
                    disabled={isUploadingPhoto}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 font-semibold text-xs rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => {
                setIsEditing(!isEditing);
                setSaveMessage({ type: '', text: '' });
              }}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 flex items-center gap-2"
            >
              {isEditing ? <X size={14} /> : <Edit size={14} />} {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Personal Information</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 font-bold">First Name</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={staffData.firstName || ''} 
                  onChange={(e) => setStaffData({...staffData, firstName: e.target.value})}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              ) : (
                <p className="text-sm font-semibold text-slate-800 mt-1">{staffData.firstName}</p>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-400 font-bold">Last Name</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={staffData.lastName || ''} 
                  onChange={(e) => setStaffData({...staffData, lastName: e.target.value})}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              ) : (
                <p className="text-sm font-semibold text-slate-800 mt-1">{staffData.lastName}</p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <label className="text-xs text-slate-400 font-bold flex items-center gap-1"><Mail size={12} /> Email</label>
            {isEditing ? (
              <input 
                type="email" 
                value={staffData.email || ''} 
                onChange={(e) => setStaffData({...staffData, email: e.target.value})}
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            ) : (
              <p className="text-sm font-semibold text-slate-800 mt-1">{staffData.email}</p>
            )}
          </div>

          <div className="pt-2">
            <label className="text-xs text-slate-400 font-bold flex items-center gap-1"><Phone size={12} /> Phone</label>
            {isEditing ? (
              <input 
                type="tel" 
                id="input-receptionist-phone"
                value={staffData.phone || ''} 
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setStaffData(prev => ({ ...prev, phone: cleaned }));
                  if (saveMessage.type === 'error') {
                    setSaveMessage({ type: '', text: '' });
                  }
                }}
                onKeyDown={handlePhoneKeyDown}
                maxLength={10}
                placeholder="10-digit mobile number (e.g. 9876543210)"
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            ) : (
              <p className="text-sm font-semibold text-slate-800 mt-1">{staffData.phone || 'N/A'}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Practice Details</h3>
          
          <div className="pt-2">
            <label className="text-xs text-slate-400 font-bold flex items-center gap-1"><Building size={12} /> Clinic</label>
            <p className="text-sm font-semibold text-slate-800 mt-1">{staffData.clinicName || 'N/A'}</p>
          </div>
          
          <div className="pt-2">
            <label className="text-xs text-slate-400 font-bold flex items-center gap-1"><User size={12} /> Status</label>
            <p className="text-sm font-semibold text-slate-800 mt-1 capitalize">{staffData.status || 'Active'}</p>
          </div>

          {isEditing && (
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full mt-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Save size={14} /> {isSaving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
