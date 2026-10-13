'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import {
  HeartPulse,
  Search,
  Plus,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldAlert,
  ArrowLeft,
  Mail,
  Phone,
  Lock,
  RefreshCw,
  Building2,
  MoreVertical,
  Edit2,
  Ban,
  CheckCircle,
  Camera,
  Trash2,
  Upload
} from 'lucide-react';

const EMAIL_REGEX = /^[a-zA-Z0-9]+([._%+-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

export function formatDisplayName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .trim()
    .split(/\s+/)
    .map(word => word ? (word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) : '')
    .join(' ');
}

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

function validateNurseEmailStrict(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length === 0 || /\s/.test(trimmed) || /\.\./.test(trimmed)) return false;
  const parts = trimmed.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  if (!parts[1].includes('.') || parts[1].startsWith('.') || parts[1].endsWith('.')) return false;
  const domainParts = parts[1].split('.');
  const tld = domainParts[domainParts.length - 1].toLowerCase();
  if (!/^[a-zA-Z]{2,}$/.test(tld)) return false;
  const domainLower = parts[1].toLowerCase();
  if (/^(gmail|yahoo|hotmail|outlook|icloud)\.co$/i.test(domainLower)) return false;
  if (/^(gmail|yahoo|hotmail|outlook|icloud)\.(con|cm|cpm|om|comm|coom|cmo)$/i.test(domainLower)) return false;
  if (/^(gmil|gamil|gmial|gmaill|gmai|gmal|gmall|gmaik|gmaii|gmeil|gml|gnail|gnal)(\.|$)/i.test(domainLower)) return false;
  return EMAIL_REGEX.test(trimmed);
}


export default function NurseManagementPage() {
  const router = useRouter();
  const [clinicId, setClinicId] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [isIpdEnabled, setIsIpdEnabled] = useState(null); // null = checking, true, false
  const [nurses, setNurses] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Action Menu State
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [modalError, setModalError] = useState('');

  // Add Photo State
  const [addPhotoFile, setAddPhotoFile] = useState(null);
  const [addPhotoPreview, setAddPhotoPreview] = useState(null);
  const addFileInputRef = useRef(null);

  // Form State (Always starts empty)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    wardId: '',
    status: 'active'
  });

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingNurse, setEditingNurse] = useState(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    wardId: '',
    status: 'active'
  });
  const [editPhotoFile, setEditPhotoFile] = useState(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState(null);
  const [isEditPhotoRemoved, setIsEditPhotoRemoved] = useState(false);
  const editFileInputRef = useRef(null);

  const [editModalError, setEditModalError] = useState('');
  const [editSubmitLoading, setEditSubmitLoading] = useState(false);

  // Close action menus when clicking outside
  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenActionMenuId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userStr || !token) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      const cId = user.id || user._id;
      if (!cId) {
        throw new Error('Clinic ID not found');
      }
      setClinicId(cId);
      setClinicName(user.name || user.clinicName || 'Clinic');

      fetchClinicModules(cId);
    } catch (err) {
      console.error('Error parsing user data:', err);
      setError('Unable to load clinic details. Please re-login.');
      setLoading(false);
    }
  }, []);

  const fetchClinicModules = async (cId) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/clinic/fetchProfileData/${cId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to verify clinic configuration');
      }

      const clinic = data.data?.clinic;
      const ipdActive = clinic?.modules?.ipd === true;
      setIsIpdEnabled(ipdActive);

      if (ipdActive) {
        await Promise.all([loadNurses(cId), loadWards(cId)]);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error verifying modules:', err);
      setError(err.message || 'Failed to verify clinic module settings');
      setLoading(false);
    }
  };

  const loadWards = async (cId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ipd/wards?clinicId=${cId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWards(data.data?.wards || []);
      }
    } catch (err) {
      console.error('Error loading wards:', err);
    }
  };

  const loadNurses = async (cId) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/clinic/nurses/${cId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch nurses');
      }

      // Enforce newest created nurse first ordering
      const fetched = data.data?.nurses || [];
      const sorted = [...fetched].sort(
        (a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0)
      );
      setNurses(sorted);
    } catch (err) {
      console.error('Error fetching nurses:', err);
      setError(err.message || 'Failed to fetch nurses');
      setNurses([]);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    // Explicitly reset all form fields & photos so no credentials persist or pre-fill
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      wardId: '',
      status: 'active'
    });
    setAddPhotoFile(null);
    setAddPhotoPreview(null);
    setModalError('');
    setShowPassword(false);
    setIsAddModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (modalError) setModalError('');
  };

  
  const uploadNursePhoto = async (file) => {
    if (!file) return null;
    // 1. Try ClinicPro Cloudinary upload route
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
      console.warn('Frontend /api/upload failed, falling back to backend upload:', e);
    }

    // 2. Fallback to backend upload-nurse-photo route
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

  const handleAddPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name || '')) {
      setModalError('Invalid photo format. Only JPG, PNG, and WebP images are allowed.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setModalError('Photo size exceeds 2MB limit.');
      e.target.value = '';
      return;
    }

    setAddPhotoFile(file);
    setAddPhotoPreview(URL.createObjectURL(file));
    if (modalError) setModalError('');
    e.target.value = '';
  };

  const handleRemoveAddPhoto = () => {
    setAddPhotoFile(null);
    setAddPhotoPreview(null);
  };

  const handleCreateNurse = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setModalError('');

    // Strict Validations
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setModalError('First name and last name are required');
      setSubmitLoading(false);
      return;
    }

    const cleanEmail = formData.email.trim().toLowerCase();
    if (!cleanEmail || !validateNurseEmailStrict(formData.email)) {
      setModalError('Please enter a valid email address (e.g. nurse@clinicpro.com)');
      setSubmitLoading(false);
      return;
    }

    if (!formData.wardId) {
      setModalError('Assigned Ward is required. Every nurse must belong to a specific active ward.');
      setSubmitLoading(false);
      return;
    }

    // Strong Password Security
    const pwd = formData.password;
    if (
      !pwd ||
      pwd.length < 8 ||
      !/[A-Z]/.test(pwd) ||
      !/[a-z]/.test(pwd) ||
      !/[0-9]/.test(pwd) ||
      !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(pwd)
    ) {
      setModalError('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character');
      setSubmitLoading(false);
      return;
    }

    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone.trim())) {
      setModalError('Phone number must be exactly 10 digits');
      setSubmitLoading(false);
      return;
    }

    try {
      // Photo upload
      let photoUrl = null;
      if (addPhotoFile) {
        photoUrl = await uploadNursePhoto(addPhotoFile);
      }

      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: cleanEmail,
        phone: formData.phone.trim() || null,
        password: formData.password,
        wardId: formData.wardId,
        clinicId: clinicId,
        status: formData.status,
        photo: photoUrl,
        avatarUrl: photoUrl
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/clinic/add-nurse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create nurse');
      }

      setSuccessMessage('Nurse registered successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
      setIsAddModalOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        wardId: '',
        status: 'active'
      });
      setAddPhotoFile(null);
      setAddPhotoPreview(null);
      setShowPassword(false);
      await loadNurses(clinicId);
    } catch (err) {
      console.error('Error adding nurse:', err);
      setModalError(err.message || 'Failed to add nurse');
    } finally {
      setSubmitLoading(false);
    }
  };

  const openEditModal = (nurse) => {
    const existingPhoto = resolveAvatarUrl(nurse.avatarUrl || nurse.avatar_url || nurse.photo || null);
    setEditingNurse(nurse);
    setEditFormData({
      firstName: nurse.firstName || nurse.first_name || '',
      lastName: nurse.lastName || nurse.last_name || '',
      phone: nurse.phone || '',
      wardId: nurse.wardId || nurse.ward_id || '',
      status: nurse.status || 'active'
    });
    setEditPhotoFile(null);
    setEditPhotoPreview(existingPhoto);
    setIsEditPhotoRemoved(false);
    setEditModalError('');
    setIsEditModalOpen(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
    if (editModalError) setEditModalError('');
  };

  const handleEditPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name || '')) {
      setEditModalError('Invalid photo format. Only JPG, PNG, and WebP images are allowed.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setEditModalError('Photo size exceeds 2MB limit.');
      e.target.value = '';
      return;
    }

    setEditPhotoFile(file);
    setEditPhotoPreview(URL.createObjectURL(file));
    setIsEditPhotoRemoved(false);
    if (editModalError) setEditModalError('');
    e.target.value = '';
  };

  const handleRemoveEditPhoto = () => {
    setEditPhotoFile(null);
    setEditPhotoPreview(null);
    setIsEditPhotoRemoved(true);
  };

  const handleEditNurse = async (e) => {
    e.preventDefault();
    if (!editingNurse) return;
    setEditSubmitLoading(true);
    setEditModalError('');

    if (!editFormData.firstName.trim() || !editFormData.lastName.trim()) {
      setEditModalError('First name and last name are required');
      setEditSubmitLoading(false);
      return;
    }
    if (!editFormData.wardId) {
      setEditModalError('Assigned Ward is required');
      setEditSubmitLoading(false);
      return;
    }
    if (editFormData.phone && !/^[0-9]{10}$/.test(editFormData.phone.trim())) {
      setEditModalError('Phone number must be exactly 10 digits');
      setEditSubmitLoading(false);
      return;
    }

    try {
      const nurseId = editingNurse._id || editingNurse.id;
      let photoUrl = editingNurse.avatarUrl || editingNurse.avatar_url || editingNurse.photo || null;

      if (isEditPhotoRemoved) {
        photoUrl = null;
      } else if (editPhotoFile) {
        const uploaded = await uploadNursePhoto(editPhotoFile);
        if (uploaded) {
          photoUrl = uploaded;
        }
      }

      const payload = {
        firstName: editFormData.firstName.trim(),
        lastName: editFormData.lastName.trim(),
        phone: editFormData.phone.trim() || null,
        wardId: editFormData.wardId,
        status: editFormData.status,
        photo: photoUrl,
        avatarUrl: photoUrl,
        removePhoto: isEditPhotoRemoved
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/clinic/update-nurse/${nurseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update nurse');
      }

      setSuccessMessage('Nurse details updated successfully');
      setTimeout(() => setSuccessMessage(''), 4000);
      setIsEditModalOpen(false);
      await loadNurses(clinicId);
    } catch (err) {
      console.error('Error updating nurse:', err);
      setEditModalError(err.message || 'Failed to update nurse');
    } finally {
      setEditSubmitLoading(false);
    }
  };

  const handleToggleStatus = async (nurse) => {
    const newStatus = nurse.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/clinic/update-nurse/${nurse._id || nurse.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update nurse status');
      }

      setNurses(prev => prev.map(n => (n._id === nurse._id || n.id === nurse.id) ? { ...n, status: newStatus } : n));
      setSuccessMessage(`Nurse status updated to ${newStatus}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      await loadNurses(clinicId);
    } catch (err) {
      console.error('Error toggling status:', err);
      setError(err.message || 'Failed to update nurse status');
      setTimeout(() => setError(''), 4000);
    }
  };

  // Preserve newest first order while searching/filtering
  const filteredNurses = nurses.filter(nurse => {
    const fullName = `${nurse.firstName || nurse.first_name || ''} ${nurse.lastName || nurse.last_name || ''}`.toLowerCase();
    const email = (nurse.email || '').toLowerCase();
    const phone = (nurse.phone || '').toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = fullName.includes(query) || email.includes(query) || phone.includes(query);
    const matchesFilter = statusFilter === 'all' || nurse.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  // Active wards list for clean dropdown selection
  const activeWards = wards.filter(w => w.is_active !== false);

  // 1. Loading screen
  if (loading && isIpdEnabled === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Verifying clinic configuration...</p>
      </div>
    );
  }

  // 2. IPD Module Disabled Screen
  if (isIpdEnabled === false) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 text-center shadow-sm">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-5">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            IPD Module Not Enabled
          </h2>
          <p className="text-slate-600 max-w-lg mx-auto text-sm leading-relaxed mb-6">
            The <strong>Inpatient Department (IPD) & Bed Management</strong> module is currently disabled for <strong>{clinicName}</strong>. Nurse management is exclusively available for clinics with IPD enabled.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-md mx-auto text-left text-xs text-slate-500 mb-6 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <Building2 className="h-4 w-4 text-blue-600" />
              Module Policy
            </div>
            <p>Existing clinics and outpatient-only facilities preserve their standard configuration with IPD disabled.</p>
            <p>To enable IPD and Nurse Management for this clinic, please contact the Super Administrator.</p>
          </div>
          <Link
            href="/clinic"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // 3. IPD Enabled - Nurse Management Page
  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-12 px-2 sm:px-4">
      {/* 1. MAIN HEADER — LAB ORDERS STYLE CONTAINER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 mb-1">
            <HeartPulse className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">NURSE MANAGEMENT</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nurse Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage nursing staff for IPD inpatient care and clinical operations
          </p>
        </div>

        {/* Action button inside the container */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0 self-start sm:self-auto">
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Nurse
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm shadow-sm">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm shadow-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search nurses by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({nurses.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Active ({nurses.filter(n => n.status === 'active').length})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'inactive'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Inactive ({nurses.filter(n => n.status === 'inactive').length})
          </button>
        </div>
      </div>

      {/* Nurses List */}
      <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-visible">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-500">
            <RefreshCw className="h-6 w-6 animate-spin mr-2 text-blue-600" />
            <span className="text-sm">Loading nurses...</span>
          </div>
        ) : filteredNurses.length === 0 ? (
          <div className="p-12 text-center">
            <HeartPulse className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No nurses found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'No nurses matched your search criteria.'
                : 'No nurses have been registered for this clinic yet.'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={openAddModal}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add First Nurse
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                  <th className="py-3 px-4">Nurse</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Assigned Ward</th>
                  <th className="py-3 px-4">Inpatient Load</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredNurses.map((nurse) => {
                  const rawFirstName = nurse.firstName || nurse.first_name || '';
                  const rawLastName = nurse.lastName || nurse.last_name || '';
                  const firstName = formatDisplayName(rawFirstName);
                  const lastName = formatDisplayName(rawLastName);
                  const fullName = `${firstName} ${lastName}`.trim();
                  const isActive = nurse.status === 'active';
                  const wardName = nurse.wardName || (wards.find(w => w.id === (nurse.ward_id || nurse.wardId))?.name) || 'Not Assigned';
                  const activePatients = nurse.activePatientsCount || 0;
                  const percent = Math.min(100, Math.round((activePatients / 20) * 100));
                  const isFull = activePatients >= 20;
                  const nurseKey = nurse._id || nurse.id;
                  const photoSrc = resolveAvatarUrl(nurse.avatarUrl || nurse.avatar_url || nurse.photo);

                  return (
                    <tr key={nurseKey} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {/* Profile Photo or Initials Fallback */}
                          {photoSrc ? (
                            <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 border border-slate-200 shadow-2xs bg-blue-100 flex items-center justify-center">
                              <span className="font-bold text-xs uppercase text-blue-700 select-none">
                                {firstName.charAt(0)}{lastName.charAt(0)}
                              </span>
                              <img
                                src={photoSrc}
                                alt={fullName}
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase border border-blue-200 shrink-0">
                              {firstName.charAt(0)}{lastName.charAt(0)}
                            </div>
                          )}

                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {fullName}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Added {new Date(nurse.created_at || nurse.createdAt || Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                            <span>{nurse.email}</span>
                          </div>
                          {nurse.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                              <span>{nurse.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {wardName}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="w-36 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className={isFull ? 'text-rose-600 font-bold' : 'text-slate-700 font-medium'}>
                              {activePatients} / 20 Patients
                            </span>
                            {isFull && (
                              <span className="text-[10px] bg-rose-100 text-rose-700 px-1 py-0.2 rounded font-bold">
                                FULL
                              </span>
                            )}
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isFull ? 'bg-rose-500' : activePatients >= 15 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Action Menu (Bed Management pattern: only Edit and Deactivate/Activate) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionMenuId(openActionMenuId === nurseKey ? null : nurseKey);
                            }}
                            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Nurse actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {openActionMenuId === nurseKey && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1 z-30 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1 text-xs space-y-0.5"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  openEditModal(nurse);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors font-medium text-left"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                <div>
                                  <div>Edit Nurse</div>
                                  <div className="text-[10px] text-slate-400 font-normal">Modify contact & ward</div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  handleToggleStatus(nurse);
                                }}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors font-medium text-left ${
                                  isActive
                                    ? 'text-slate-700 hover:bg-slate-50 hover:text-amber-700'
                                    : 'text-emerald-700 hover:bg-emerald-50'
                                }`}
                              >
                                {isActive ? (
                                  <>
                                    <Ban className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                    <div>
                                      <div>Deactivate Nurse</div>
                                      <div className="text-[10px] text-slate-400 font-normal">Disable admissions & login</div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                    <div>
                                      <div>Activate Nurse</div>
                                      <div className="text-[10px] text-slate-400 font-normal">Enable admissions & login</div>
                                    </div>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Nurse Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60 shrink-0">
              <div className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Add New Nurse</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNurse} noValidate autoComplete="off" className="p-6 space-y-4 overflow-y-auto">
              {/* Decoy hidden inputs to divert aggressive browser password managers */}
              <input type="text" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
              <input type="password" style={{ display: 'none' }} tabIndex={-1} autoComplete="new-password" />

              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Photo Upload / Picker */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="file"
                  ref={addFileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAddPhotoChange}
                  className="hidden"
                />

                <div className="relative w-14 h-14 rounded-full bg-slate-200 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                  {addPhotoPreview ? (
                    <img src={addPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="h-6 w-6 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-700">Profile Photo (Optional)</div>
                  <div className="text-[11px] text-slate-400">JPG, PNG, or WebP up to 2MB</div>
                  <div className="mt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => addFileInputRef.current?.click()}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
                    >
                      <Upload className="h-3 w-3" />
                      {addPhotoPreview ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    {addPhotoPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveAddPhoto}
                        className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    autoComplete="off"
                    placeholder="e.g. Sarah"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    autoComplete="off"
                    placeholder="e.g. Jenkins"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address / Login ID <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    inputMode="email"
                    name="email"
                    required
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    placeholder="nurse@clinicpro.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Valid email address required for nurse login</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    name="phone"
                    maxLength={10}
                    autoComplete="off"
                    placeholder="10 digit phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Login Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    autoComplete="new-password"
                    data-lpignore="true"
                    placeholder="Min 8 chars (A-Z, a-z, 0-9, symbol)"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-10 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Must be at least 8 characters with uppercase, lowercase, number, and special character
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Ward / Department <span className="text-rose-500">*</span>
                </label>
                <select
                  name="wardId"
                  required
                  value={formData.wardId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Select Assigned Ward --</option>
                  {/* Clean ward names with no unwanted parentheses */}
                  {activeWards.map((ward) => (
                    <option key={ward.id} value={ward.id}>
                      {ward.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Every nurse belongs to an active ward and manages up to 20 active patients.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submitLoading}
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-60"
                >
                  {submitLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      Create Nurse
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Nurse Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60 shrink-0">
              <div className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Edit Nurse Details</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditNurse} className="p-6 space-y-4 overflow-y-auto">
              {editModalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{editModalError}</span>
                </div>
              )}

              {/* Readonly credential info */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Mail className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>Login Email:</span>
                  <span className="font-semibold text-slate-900">{editingNurse?.email}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Credentials are strictly protected and never exposed in the edit view.
                </p>
              </div>

              {/* Profile Photo Edit */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="file"
                  ref={editFileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleEditPhotoChange}
                  className="hidden"
                />

                <div className="relative w-14 h-14 rounded-full bg-slate-200 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                  {editPhotoPreview ? (
                    <img
                      src={editPhotoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => {
                        setEditPhotoPreview(null);
                      }}
                    />
                  ) : (
                    <Camera className="h-6 w-6 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-700">Profile Photo</div>
                  <div className="text-[11px] text-slate-400">JPG, PNG, or WebP up to 2MB</div>
                  <div className="mt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
                    >
                      <Upload className="h-3 w-3" />
                      {editPhotoPreview ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    {editPhotoPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveEditPhoto}
                        className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={editFormData.firstName}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={editFormData.lastName}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    name="phone"
                    maxLength={10}
                    placeholder="10 digit phone number"
                    value={editFormData.phone}
                    onChange={handleEditInputChange}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Ward / Department <span className="text-rose-500">*</span>
                </label>
                <select
                  name="wardId"
                  required
                  value={editFormData.wardId}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Select Assigned Ward --</option>
                  {/* Clean ward names with no unwanted parentheses */}
                  {activeWards.map((ward) => (
                    <option key={ward.id} value={ward.id}>
                      {ward.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Changing ward requires that the nurse currently has 0 active admitted patients.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={editFormData.status}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={editSubmitLoading}
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-60"
                >
                  {editSubmitLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
