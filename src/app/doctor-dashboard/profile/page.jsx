'use client';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/utils/api';
import { 
  User, Mail, Phone, MapPin, Edit, Save, X, Stethoscope, Building, Award
} from 'lucide-react';

export default function DoctorProfilePage() {
  const [doctorData, setDoctorData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const user = JSON.parse(userStr || '{}');
        const doctorId = user.id || user._id;

        if (!doctorId) return;

        const res = await fetch(`${API_BASE_URL}/api/v1/doctor/fetch-by-id/${doctorId}`);
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userStr = localStorage.getItem('user');
      const user = JSON.parse(userStr || '{}');
      const doctorId = user.id || user._id;

      const res = await fetch(`${API_BASE_URL}/api/v1/doctor/update-by-id/${doctorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doctorData)
      });

      if (res.ok) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Update Error:", error);
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
    <div className="max-w-4xl mx-auto p-6 space-y-8">
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
            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md border flex items-center justify-center text-3xl font-bold text-blue-600">
              {doctorData.firstName?.[0]}{doctorData.lastName?.[0]}
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
                type="text" 
                value={doctorData.phone} 
                onChange={(e) => setDoctorData({...doctorData, phone: e.target.value})}
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
