'use client';

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  ShieldCheck,
  Users,
  Search,
  RefreshCw,
  Plus,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  Award,
  Key,
  Lock,
  ChevronDown,
  Eye,
  EyeOff
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import ModalPortal from '@/components/ModalPortal';
import {
  LAB_ROLES,
  LAB_ROLE_DETAILS,
  LAB_PERMISSIONS,
  LAB_PERMISSION_DETAILS,
  ROLE_DEFAULT_PERMISSIONS,
  hasLabPermission
} from '@/constants/labRoles';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function LabStaffPage() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Current user info from localStorage
  const [currentUser, setCurrentUser] = useState(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [phoneError, setPhoneError] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: LAB_ROLES.TECHNICIAN,
    qualification: '',
    license_number: '',
    password: '',
    permissions: ROLE_DEFAULT_PERMISSIONS[LAB_ROLES.TECHNICIAN]
  });

  const handlePhoneChange = (val) => {
    setFormData((prev) => ({ ...prev, phone: val }));
    const trimmed = val.trim();
    if (!trimmed) {
      setPhoneError('');
    } else if (!/^[0-9]{10}$/.test(trimmed)) {
      setPhoneError('Phone number must be exactly 10 numeric digits');
    } else {
      setPhoneError('');
    }
  };

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      let res;
      try {
        res = await axios.get(
          `${API_BASE_URL}/api/v1/lab/staff?role=${roleFilter}&status=${statusFilter}`,
          { headers }
        );
      } catch (e) {
        res = await axios.get(
          `/api/v1/lab/staff?role=${roleFilter}&status=${statusFilter}`,
          { headers }
        );
      }

      const fetched = res.data?.data?.staff || res.data?.staff || [];
      setStaffList(Array.isArray(fetched) ? fetched : []);
    } catch (err) {
      console.error('Error fetching lab staff:', err);
      toast.error(err.response?.data?.message || 'Failed to load laboratory staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [roleFilter, statusFilter]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingStaffId(null);
    setShowPassword(false);
    setPhoneError('');
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: LAB_ROLES.TECHNICIAN,
      qualification: '',
      license_number: '',
      password: '',
      permissions: ROLE_DEFAULT_PERMISSIONS[LAB_ROLES.TECHNICIAN]
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (staff) => {
    setModalMode('edit');
    setEditingStaffId(staff.id);
    setShowPassword(false);
    setPhoneError('');
    setFormData({
      first_name: staff.first_name || '',
      last_name: staff.last_name || '',
      email: staff.email || '',
      phone: staff.phone || '',
      role: staff.role || LAB_ROLES.TECHNICIAN,
      qualification: staff.qualification || '',
      license_number: staff.license_number || '',
      password: '', // Blank by default, never prefill or expose stored password hash
      permissions: Array.isArray(staff.permissions)
        ? staff.permissions
        : ROLE_DEFAULT_PERMISSIONS[staff.role] || []
    });
    setIsModalOpen(true);
  };

  // Role Change Handler in Form (auto-selects role default permissions)
  const handleRoleChange = (newRole) => {
    setFormData((prev) => ({
      ...prev,
      role: newRole,
      permissions: ROLE_DEFAULT_PERMISSIONS[newRole] || []
    }));
  };

  // Permission Toggle Handler in Form
  const handlePermissionToggle = (permKey) => {
    setFormData((prev) => {
      const perms = prev.permissions.includes(permKey)
        ? prev.permissions.filter((p) => p !== permKey)
        : [...prev.permissions, permKey];
      return { ...prev, permissions: perms };
    });
  };

  // Submit Add or Edit Staff
  const handleSubmitForm = async (e) => {
    e.preventDefault();

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error('First and last names are required');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email address is required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Phone validation: optional, but must be exactly 10 numeric digits if provided
    if (formData.phone && formData.phone.trim() !== '') {
      const trimmedPhone = formData.phone.trim();
      if (!/^[0-9]{10}$/.test(trimmedPhone)) {
        setPhoneError('Phone number must be exactly 10 numeric digits');
        toast.error('Phone number must be exactly 10 numeric digits');
        return;
      }
    }

    const payload = {
      ...formData,
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim()
    };

    // For editing existing staff, do not touch password unless explicitly entered
    if (modalMode === 'edit') {
      if (!payload.password || !payload.password.trim()) {
        delete payload.password;
      }
    }

    try {
      setSubmitting(true);
      const headers = getAuthHeaders();

      if (modalMode === 'create') {
        let res;
        try {
          res = await axios.post(`${API_BASE_URL}/api/v1/lab/staff`, payload, { headers });
        } catch (e) {
          res = await axios.post(`/api/v1/lab/staff`, payload, { headers });
        }
        toast.success('Staff member added successfully');
      } else {
        let res;
        try {
          res = await axios.put(`${API_BASE_URL}/api/v1/lab/staff/${editingStaffId}`, payload, {
            headers
          });
        } catch (e) {
          res = await axios.put(`/api/v1/lab/staff/${editingStaffId}`, payload, { headers });
        }
        toast.success('Staff details updated successfully');
      }

      setIsModalOpen(false);
      await fetchStaff();
    } catch (err) {
      console.error('Error saving staff:', err);
      toast.error(err.response?.data?.message || 'Failed to save staff record');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active / Inactive Status
  const handleToggleStatus = async (staff) => {
    const action = staff.status === 'active' ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${staff.first_name} ${staff.last_name}?`)) {
      return;
    }

    try {
      toast.loading(`Updating staff status...`, { id: 'status-toggle' });
      const headers = getAuthHeaders();
      let res;
      try {
        res = await axios.patch(`${API_BASE_URL}/api/v1/lab/staff/${staff.id}/status`, {}, { headers });
      } catch (e) {
        res = await axios.patch(`/api/v1/lab/staff/${staff.id}/status`, {}, { headers });
      }

      toast.success(res.data?.message || `Staff member status updated`, { id: 'status-toggle' });
      await fetchStaff();
    } catch (err) {
      console.error('Error toggling staff status:', err);
      toast.error(err.response?.data?.message || 'Failed to update status', { id: 'status-toggle' });
    }
  };

  // Filtered List
  const filteredStaff = useMemo(() => {
    if (!searchTerm.trim()) return staffList;
    const term = searchTerm.toLowerCase();

    return staffList.filter((m) => {
      const fullName = `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase();
      const email = (m.email || '').toLowerCase();
      const phone = (m.phone || '').toLowerCase();
      const roleLabel = (LAB_ROLE_DETAILS[m.role]?.label || m.role || '').toLowerCase();
      const lic = (m.license_number || '').toLowerCase();
      return (
        fullName.includes(term) ||
        email.includes(term) ||
        phone.includes(term) ||
        roleLabel.includes(term) ||
        lic.includes(term)
      );
    });
  }, [staffList, searchTerm]);

  // Metrics
  const metrics = useMemo(() => {
    return {
      total: staffList.length,
      pathologists: staffList.filter((m) => m.role === LAB_ROLES.PATHOLOGIST).length,
      technicians: staffList.filter((m) => m.role === LAB_ROLES.TECHNICIAN).length,
      active: staffList.filter((m) => m.status === 'active').length
    };
  }, [staffList]);

  // Check if current user has permission to manage staff
  const canManageStaff = hasLabPermission(currentUser || 'lab', LAB_PERMISSIONS.MANAGE_STAFF);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Laboratory Staff & RBAC
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage laboratory personnel, assign clinical and operational roles, and enforce granular access control.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canManageStaff && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Access Notice if user lacks manage_staff */}
      {!canManageStaff && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-semibold">Read-Only Staff Directory</p>
            <p className="text-amber-700 mt-0.5">
              Your account has limited operational permissions. Staff member addition, role assignment, and status modifications require the Lab Administrator / Director role.
            </p>
          </div>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Staff</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{metrics.total}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Pathologists / Validators
          </p>
          <p className="text-2xl font-bold text-teal-700 mt-1">{metrics.pathologists}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lab Technicians</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{metrics.technicians}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Accounts</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{metrics.active}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, role, license..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Role Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            {[
              { id: 'all', label: 'All Roles' },
              { id: LAB_ROLES.LAB_ADMIN, label: 'Directors' },
              { id: LAB_ROLES.PATHOLOGIST, label: 'Pathologists' },
              { id: LAB_ROLES.TECHNICIAN, label: 'Technicians' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  roleFilter === tab.id
                    ? 'bg-white text-teal-700 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            {[
              { id: 'all', label: 'All Status' },
              { id: 'active', label: 'Active' },
              { id: 'inactive', label: 'Inactive' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Staff Directory Table */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-medium">Loading laboratory staff directory...</p>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Staff Members Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchTerm
              ? 'No staff members match your search criteria.'
              : 'Add pathologists, lab technicians, and lab directors to assign operational and clinical validation privileges.'}
          </p>
          {canManageStaff && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Staff Member</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role & Authorization</th>
                  <th className="py-3 px-4">Contact & License</th>
                  <th className="py-3 px-4">Status</th>
                  {canManageStaff && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((staff) => {
                  const roleMeta = LAB_ROLE_DETAILS[staff.role] || {
                    label: staff.role,
                    badgeColor: 'slate'
                  };
                  const initial = (staff.first_name || 'U').charAt(0).toUpperCase();

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0">
                            {initial}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">
                              {staff.first_name} {staff.last_name}
                            </p>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {staff.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role & Qualification */}
                      <td className="py-3 px-4">
                        <div>
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                              staff.role === LAB_ROLES.LAB_ADMIN
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : staff.role === LAB_ROLES.PATHOLOGIST
                                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {roleMeta.label}
                          </span>
                          {staff.qualification && (
                            <p className="text-[11px] text-slate-600 mt-1 font-medium">
                              {staff.qualification}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Contact & License */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5 text-[11px]">
                          {staff.phone ? (
                            <p className="text-slate-700 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {staff.phone}
                            </p>
                          ) : (
                            <p className="text-slate-400 italic">No phone</p>
                          )}
                          {staff.license_number && (
                            <p className="text-slate-500 font-mono text-[10px]">
                              Lic: {staff.license_number}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {staff.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      {canManageStaff && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(staff)}
                              className="p-1.5 text-slate-500 hover:text-teal-700 rounded-lg hover:bg-teal-50 transition-colors"
                              title="Edit Staff Member"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleToggleStatus(staff)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                staff.status === 'active'
                                  ? 'text-slate-400 hover:text-amber-700 hover:bg-amber-50'
                                  : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                              }`}
                              title={staff.status === 'active' ? 'Deactivate Staff' : 'Activate Staff'}
                            >
                              {staff.status === 'active' ? (
                                <UserX className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      <ModalPortal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full flex flex-col max-h-[88vh] my-auto overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {modalMode === 'create' ? 'Add Laboratory Personnel' : 'Edit Staff Details & Roles'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="e.g. Eleanor"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="e.g. Vance"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="staff@laboratory.example.com"
                    autoComplete="off"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-semibold">Phone Number</label>
                    <span className="text-[10px] text-slate-400 font-normal">Optional (10 digits)</span>
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="e.g. 9876543210"
                    maxLength={15}
                    autoComplete="off"
                    className={`w-full p-2.5 bg-slate-50 border rounded-xl focus:outline-none transition-colors ${
                      phoneError
                        ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                        : 'border-slate-200 focus:border-teal-500'
                    }`}
                  />
                  {phoneError && (
                    <p className="mt-1 text-[11px] text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {phoneError}
                    </p>
                  )}
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Assigned Clinical / Technical Role <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.values(LAB_ROLES).map((roleKey) => {
                    const roleInfo = LAB_ROLE_DETAILS[roleKey];
                    const isSelected = formData.role === roleKey;

                    return (
                      <div
                        key={roleKey}
                        onClick={() => handleRoleChange(roleKey)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-teal-50/70 border-teal-500 text-teal-900 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs">{roleInfo.label}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          {roleInfo.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Qualifications & License */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Degrees / Qualification
                  </label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="e.g. MD Pathology, MBBS, MLS (ASCP)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Medical / Tech License Number
                  </label>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    placeholder="e.g. MED-LIC-99420"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Password (Optional for edit, password hash generated server-side) */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {modalMode === 'create' ? 'Account Password' : 'Reset Password (optional)'}
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    autoComplete="new-password"
                    placeholder={
                      modalMode === 'create'
                        ? 'Set initial login password (optional)'
                        : 'Leave blank to preserve existing password'
                    }
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-[10px] text-slate-400">
                  {modalMode === 'create'
                    ? 'Staff can be assigned an initial password or set one later.'
                    : 'Stored password hash is never exposed. Leave blank unless changing.'}
                </p>
              </div>

              {/* Granular Permissions Checklist */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Granular Privileges & Capabilities
                </label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  {Object.values(LAB_PERMISSIONS).map((permKey) => {
                    const permInfo = LAB_PERMISSION_DETAILS[permKey];
                    const isChecked = formData.permissions.includes(permKey);

                    return (
                      <label
                        key={permKey}
                        className="flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-white cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handlePermissionToggle(permKey)}
                          className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                        />
                        <div>
                          <p className="font-semibold text-slate-800 text-xs">{permInfo.label}</p>
                          <p className="text-[11px] text-slate-500">{permInfo.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-xs shadow-sm transition inline-flex items-center gap-1.5"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{modalMode === 'create' ? 'Add Staff Member' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}
