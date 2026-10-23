'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/utils/api';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Phone,
  Mail,
  Shield,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const initialFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  newPassword: '',
  status: 'active'
};

export default function ReceptionistManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentReceptionist, setCurrentReceptionist] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showPassword, setShowPassword] = useState(false);
  const [receptionists, setReceptionists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [receptionistToDelete, setReceptionistToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      setError('User not authenticated. Please login again.');
      setLoading(false);
      return;
    }

    try {
      const userdata = JSON.parse(user);
      const id = userdata?.id || userdata?.clinicId || userdata?._id;
      if (!id) {
        throw new Error('Invalid user data');
      }
      setClinicId(id);
      fetchReceptionists(id);
    } catch (err) {
      console.error('Error parsing user data:', err);
      setError('Failed to load user data. Please refresh the page.');
      setLoading(false);
    }
  }, []);

  const fetchReceptionists = async (id) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/clinic/fetch-receptionist/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.message || 'Failed to fetch receptionists');
      }

      if (!responseData.data.staff || !Array.isArray(responseData.data.staff)) {
        throw new Error('Invalid data format received from server');
      }

      setReceptionists(responseData.data.staff);
    } catch (err) {
      console.error('Error fetching receptionists:', err);
      setError(err.message || 'Failed to load receptionists. Please try again later.');
      setReceptionists([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredReceptionists = receptionists.filter((receptionist) => {
    const nameMatch = `${receptionist.firstName || ''} ${receptionist.lastName || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const emailMatch = (receptionist.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const phoneMatch = (receptionist.phone || '').includes(searchTerm);
    const matchesSearch = nameMatch || emailMatch || phoneMatch;
    const matchesFilter = activeFilter === 'all' || receptionist.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredReceptionists.length / itemsPerPage) || 1;
  const paginatedReceptionists = filteredReceptionists.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openAddModal = () => {
    setCurrentReceptionist(null);
    setFormData({ ...initialFormState });
    setShowPassword(false);
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (receptionist) => {
    setCurrentReceptionist(receptionist);
    setFormData({
      firstName: receptionist.firstName || '',
      lastName: receptionist.lastName || '',
      email: receptionist.email || '',
      phone: receptionist.phone || '',
      password: '',
      newPassword: '',
      status: receptionist.status || 'active'
    });
    setShowPassword(false);
    setModalError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitLoading) return;
    setIsModalOpen(false);
    setCurrentReceptionist(null);
    setFormData({ ...initialFormState });
    setModalError('');
  };

  const handleDeleteClick = (id) => {
    setReceptionistToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!receptionistToDelete) return;
    const id = receptionistToDelete;

    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/clinic/delete-receptionist/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.message || 'Failed to delete receptionist');
      }

      setReceptionists((prev) => prev.filter((r) => (r._id || r.id) !== id));
      setSuccessMessage('Receptionist deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting receptionist:', err);
      setError(err.message || 'Failed to delete receptionist');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
      setReceptionistToDelete(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setModalError('');

    const resolvedEmail = (formData.email || currentReceptionist?.email || '').trim();
    const cleanPhone = (formData.phone || '').trim();

    const payload = {
      firstName: (formData.firstName || '').trim(),
      lastName: (formData.lastName || '').trim(),
      email: resolvedEmail,
      phone: cleanPhone,
      status: formData.status || 'active',
      clinicId: clinicId
    };

    // Form Validation
    if (!payload.firstName || !payload.lastName || !payload.email || !payload.phone) {
      setModalError('All required fields must be filled');
      setSubmitLoading(false);
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(payload.email)) {
      setModalError('Please enter a valid email address');
      setSubmitLoading(false);
      return;
    }

    if (cleanPhone.length !== 10) {
      setModalError('Phone number must be exactly 10 digits');
      setSubmitLoading(false);
      return;
    }

    if (!currentReceptionist) {
      if (!formData.password || formData.password.length < 8) {
        setModalError('Password must be at least 8 characters long');
        setSubmitLoading(false);
        return;
      }
      payload.password = formData.password;
    } else {
      if (formData.newPassword && formData.newPassword.length > 0) {
        if (formData.newPassword.length < 8) {
          setModalError('New password must be at least 8 characters long');
          setSubmitLoading(false);
          return;
        }
        payload.password = formData.newPassword;
      }
    }

    try {
      let response;
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      if (currentReceptionist) {
        const rId = currentReceptionist._id || currentReceptionist.id;
        response = await fetch(`${API_BASE_URL}/api/v1/clinic/update-receptionist/${rId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${API_BASE_URL}/api/v1/clinic/add-receptionist`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.message || 'Failed to save receptionist');
      }

      const savedReceptionist = responseData.data?.staff || responseData.data?.receptionist || responseData.data;

      if (currentReceptionist) {
        const curId = currentReceptionist._id || currentReceptionist.id;
        setReceptionists((prev) =>
          prev.map((r) => ((r._id || r.id) === curId ? { ...r, ...savedReceptionist } : r))
        );
        setSuccessMessage('Receptionist updated successfully');
      } else {
        setReceptionists((prev) => [...prev, savedReceptionist]);
        setSuccessMessage('Receptionist created successfully');
      }

      closeModal();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving receptionist:', err);
      setModalError(err.message || 'An error occurred while saving. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Section — Matches Bed & Ward Management & Lab Orders */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Receptionist Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage front desk staff, credentials, and access statuses</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm gap-2 shrink-0 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Receptionist</span>
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by receptionist name, email, or phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'active', 'inactive'].map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setActiveFilter(filter);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                activeFilter === filter
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/70 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              {filter === 'all' ? `All (${receptionists.length})` : filter}
            </button>
          ))}
          <button
            onClick={() => clinicId && fetchReceptionists(clinicId)}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors flex items-center justify-center shrink-0 ml-1"
            title="Refresh receptionists"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3. Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-sm font-medium">Loading receptionists...</span>
          </div>
        ) : filteredReceptionists.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-3 border border-slate-100">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No receptionists found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {searchTerm ? 'Try adjusting your search query or filter.' : 'Click "Add New Receptionist" above to create your clinic front desk staff.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <th className="py-3 px-6">Receptionist</th>
                  <th className="py-3 px-6">Contact Number</th>
                  <th className="py-3 px-6">Account Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedReceptionists.map((rec) => {
                  const fName = rec.firstName || rec.first_name || '';
                  const lName = rec.lastName || rec.last_name || '';
                  const fullName = `${fName} ${lName}`.trim() || 'Staff Member';
                  const initials = (fName.charAt(0) + lName.charAt(0)).toUpperCase() || 'R';
                  const isActive = (rec.status || 'active').toLowerCase() === 'active';

                  return (
                    <tr key={rec._id || rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">{fullName}</div>
                            <div className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{rec.email || 'No email provided'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{rec.phone || 'N/A'}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold gap-1.5 ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(rec)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Receptionist"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(rec._id || rec.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Receptionist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs">
            <span className="text-slate-500 font-medium">
              Page {currentPage} of {totalPages} ({filteredReceptionists.length} receptionists)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Add / Edit Modal — Visibly follows Bed Management / Nurse Management */}
      {isModalOpen && (
        <div 
          onClick={closeModal}
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col text-xs"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div>
                <span className="font-bold text-sm text-slate-900">
                  {currentReceptionist ? 'Edit Receptionist' : 'Add New Receptionist'}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {currentReceptionist
                    ? 'Update profile details, contact number, or operational status'
                    : 'Create front desk staff account with secure access credentials'}
                </p>
              </div>
              <button
                onClick={closeModal}
                disabled={submitLoading}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} autoComplete="off" className="p-6 space-y-4 overflow-y-auto flex-1">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-1.5 font-semibold text-xs">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* First & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={submitLoading}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jenkins"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={submitLoading}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="receptionist@clinic.com"
                  autoComplete="new-email"
                  value={formData.email}
                  readOnly={!!currentReceptionist}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={submitLoading}
                  className={`w-full px-3.5 py-2 border rounded-xl text-xs sm:text-sm transition-colors ${
                    currentReceptionist
                      ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600'
                  }`}
                />
                {currentReceptionist && (
                  <p className="text-[11px] text-slate-400 mt-1">Email address cannot be modified after creation.</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Phone Number (10 digits) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, phone: digitsOnly });
                  }}
                  disabled={submitLoading}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                />
              </div>

              {/* Password Section */}
              {!currentReceptionist ? (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      disabled={submitLoading}
                      className="w-full pl-3.5 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={submitLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Starts empty; no default password is assigned.</p>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    New Password <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Leave blank to retain current password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      disabled={submitLoading}
                      className="w-full pl-3.5 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={submitLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Account Status */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Account Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={submitLoading}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Modal Footer Actions */}
              <div className="px-6 py-4 -mx-6 -mb-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitLoading}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {submitLoading && <RefreshCw className="animate-spin h-3.5 w-3.5" />}
                  <span>{currentReceptionist ? 'Update Receptionist' : 'Create Receptionist'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          onClick={() => setShowDeleteConfirm(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-xl text-center animate-in zoom-in-95 duration-150"
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Receptionist?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              This staff member will be removed from your clinic account. This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-2.5">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {deleteLoading && <RefreshCw className="animate-spin h-3.5 w-3.5" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
