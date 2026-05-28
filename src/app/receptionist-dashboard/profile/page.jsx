'use client';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/utils/api';
import { 
  User, Mail, Phone, Edit, Save, X, Building
} from 'lucide-react';

export default function ReceptionistProfilePage() {
  const [staffData, setStaffData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const user = JSON.parse(userStr || '{}');
        const staffId = user.id || user._id;

        if (!staffId) return;

        const res = await fetch(`${API_BASE_URL}/api/v1/clinic/update-receptionist/${staffId}`);
        const result = await res.json();
        if (result.success && result.data.staff) {
          setStaffData(result.data.staff);
        } else {
            // fallback if not a strict staff record (e.g. unified login)
            setStaffData({
                firstName: user.firstName || 'Receptionist',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phoneNumber || user.phone || '',
                clinicName: user.clinicName || 'N/A',
                status: user.status || 'Active'
            });
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
      const staffId = user.id || user._id;

      // Only attempt backend update if it's a real staff ID from mongo
      if (staffId && staffId.length === 24) {
          const res = await fetch(`${API_BASE_URL}/api/v1/clinic/update-receptionist/${staffId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName: staffData.firstName,
              lastName: staffData.lastName,
              email: staffData.email,
              phone: staffData.phone
            })
          });

          if (res.ok) {
            setIsEditing(false);
          }
      } else {
          // just mock it if it's not a real staff
          setTimeout(() => setIsEditing(false), 500);
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
          <p className="text-gray-500 text-sm font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!staffData) {
    return <p className="text-center text-red-500 py-12">Profile data inaccessible.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">Manage your personal and contact information</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        <div className="p-6 relative">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-end -mt-16">
            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md border flex items-center justify-center text-3xl font-bold text-blue-600">
              {staffData.firstName?.[0] || 'R'}{staffData.lastName?.[0] || ''}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-slate-800">{staffData.firstName} {staffData.lastName}</h1>
              <p className="text-sm text-slate-500 font-medium">Receptionist / Front Desk</p>
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
                type="text" 
                value={staffData.phone || ''} 
                onChange={(e) => setStaffData({...staffData, phone: e.target.value})}
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
