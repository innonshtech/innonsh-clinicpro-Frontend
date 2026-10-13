'use client';
import { useState, useEffect, useRef } from 'react';
import { validatePhoneNumber, handlePhoneKeyDown, validateEmail, validateDoctorEmail } from '@/utils/phoneValidation';
import { API_BASE_URL } from '@/utils/api';
import { useDoctor } from '@/context/DoctorContext';
import { 
  User, Mail, Phone, MapPin, Edit, Save, X, Stethoscope, Building, Award, Camera
} from 'lucide-react';

export default function DoctorProfilePage() {
  const [doctorData, setDoctorData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const { setDoctor } = useDoctor();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const user = JSON.parse(userStr || '{}');
        const doctorId = user.id || user._id;

        if (!doctorId) return;

        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/v1/doctor/fetch-by-id/${doctorId}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const result = await res.json();
        if (result.success) {
          setDoctorData(result.data.doctor);
        }
      } catch (error) {
        console.error("Profile Load Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Please select a valid image file (JPG, PNG, or WebP).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      alert('Image size exceeds 5MB limit. Please choose a smaller image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'doctor-profiles');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadJson = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok || !uploadJson.url) {
        throw new Error(uploadJson.error || 'Failed to upload photo.');
      }

      const newImageUrl = uploadJson.url;

      const userStr = localStorage.getItem('user');
      const user = JSON.parse(userStr || '{}');
      const doctorId = user.id || user._id;
      const token = localStorage.getItem('token');

      const updateRes = await fetch(`${API_BASE_URL}/api/v1/doctor/update-by-id/${doctorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          profileImage: newImageUrl
        })
      });

      const updateData = await updateRes.json().catch(() => ({}));
      if (!updateRes.ok || updateData.success === false) {
        throw new Error(updateData.message || 'Failed to save photo to profile.');
      }

      setDoctorData(prev => ({
        ...prev,
        profileImage: newImageUrl
      }));

      if (setDoctor) {
        setDoctor(prev => ({
          ...(prev || {}),
          profileImage: newImageUrl
        }));
      }

      if (user) {
        user.profileImage = newImageUrl;
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      alert(err.message || 'An error occurred while uploading profile photo.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    const emailErr = validateDoctorEmail(doctorData.email, true, 'Email address');
    if (emailErr) {
      alert(emailErr);
      return;
    }
    setIsSaving(true);
    try {
      const userStr = localStorage.getItem('user');
      const user = JSON.parse(userStr || '{}');
      const doctorId = user.id || user._id;
      const token = localStorage.getItem('token');

      const res = await fetch(`${API_BASE_URL}/api/v1/doctor/update-by-id/${doctorId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(doctorData)
      });

      const resData = await res.json().catch(() => ({}));

      if (res.ok && resData.success !== false) {
        const returnedDoc = resData.data?.doctor || {};
        const updatedFirstName = returnedDoc.firstName || returnedDoc.first_name || doctorData.firstName;
        const updatedLastName = returnedDoc.lastName || returnedDoc.last_name || doctorData.lastName;
        const updatedProfileImage = returnedDoc.profileImage || returnedDoc.profile_image || doctorData.profileImage;

        const mergedDoctor = {
          ...doctorData,
          ...returnedDoc,
          firstName: updatedFirstName,
          lastName: updatedLastName,
          profileImage: updatedProfileImage
        };

        setDoctorData(mergedDoctor);

        if (setDoctor) {
          setDoctor(prev => ({
            ...(prev || {}),
            ...mergedDoctor
          }));
        }

        if (user) {
          user.firstName = updatedFirstName;
          user.lastName = updatedLastName;
          user.name = `Dr. ${updatedFirstName} ${updatedLastName}`;
          if (updatedProfileImage) {
            user.profileImage = updatedProfileImage;
          }
          localStorage.setItem('user', JSON.stringify(user));
        }

        setIsEditing(false);
      } else {
        alert(resData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error("Update Error:", error);
      alert(error.message || 'An error occurred while updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm font-medium">Loading credentials...</p>
        </div>
      </div>
    );
  }

  if (!doctorData) {
    return <p className="text-center text-red-500 py-12">Doctor metrics inaccessible.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto pt-0 pb-6 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">Manage your personal and professional information</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        <div className="p-6 relative">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-end -mt-16">
            <div className="relative group">
              <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md border flex items-center justify-center text-3xl font-bold text-blue-600 overflow-hidden">
                {doctorData.profileImage ? (
                  <img 
                    src={doctorData.profileImage} 
                    alt="Doctor Profile" 
                    className="w-full h-full object-cover rounded-full" 
                  />
                ) : (
                  <span>{doctorData.firstName?.[0]}{doctorData.lastName?.[0]}</span>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                title={doctorData.profileImage ? "Change photo" : "Upload photo"}
                aria-label="Upload or change profile photo"
                className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isUploadingPhoto ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera size={14} />
                )}
              </button>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-slate-800">Dr. {doctorData.firstName} {doctorData.lastName}</h1>
              <p className="text-sm text-slate-500 font-medium">{doctorData.specialty || 'General Practitioner'}</p>
            </div>
            <button 
              onClick={() => setIsEditing(!isEditing)}
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
                  value={doctorData.firstName} 
                  onChange={(e) => setDoctorData({...doctorData, firstName: e.target.value})}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              ) : (
                <p className="text-sm font-semibold text-slate-800 mt-1">{doctorData.firstName}</p>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-400 font-bold">Last Name</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={doctorData.lastName} 
                  onChange={(e) => setDoctorData({...doctorData, lastName: e.target.value})}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              ) : (
                <p className="text-sm font-semibold text-slate-800 mt-1">{doctorData.lastName}</p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <label className="text-xs text-slate-400 font-bold flex items-center gap-1"><Mail size={12} /> Email</label>
            {isEditing ? (
              <input 
                type="email" 
                value={doctorData.email} 
                onChange={(e) => setDoctorData({...doctorData, email: e.target.value})}
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            ) : (
              <p className="text-sm font-semibold text-slate-800 mt-1">{doctorData.email}</p>
            )}
          </div>

          <div className="pt-2">
            <label className="text-xs text-slate-400 font-bold flex items-center gap-1"><Phone size={12} /> Phone</label>
            {isEditing ? (
              <input 
                type="tel" 
                value={doctorData.phone} 
                onChange={(e) => setDoctorData({...doctorData, phone: e.target.value})}
                onKeyDown={handlePhoneKeyDown}
                maxLength={10}
                placeholder="10-digit phone number"
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            ) : (
              <p className="text-sm font-semibold text-slate-800 mt-1">{doctorData.phone}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Practice Details</h3>
          
          <div>
            <label className="text-xs text-slate-400 font-bold flex items-center gap-1"><Stethoscope size={12} /> Specialty</label>
            {isEditing ? (
              <input 
                type="text" 
                value={doctorData.specialty} 
                onChange={(e) => setDoctorData({...doctorData, specialty: e.target.value})}
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            ) : (
              <p className="text-sm font-semibold text-slate-800 mt-1">{doctorData.specialty || 'General Practitioner'}</p>
            )}
          </div>

          <div className="pt-2">
            <label className="text-xs text-slate-400 font-bold flex items-center gap-1"><Building size={12} /> Hospital</label>
            {isEditing ? (
              <input 
                type="text" 
                value={doctorData.hospital} 
                onChange={(e) => setDoctorData({...doctorData, hospital: e.target.value})}
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            ) : (
              <p className="text-sm font-semibold text-slate-800 mt-1">{doctorData.hospital || 'N/A'}</p>
            )}
          </div>

          {isEditing && (
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full mt-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={14} /> {isSaving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
