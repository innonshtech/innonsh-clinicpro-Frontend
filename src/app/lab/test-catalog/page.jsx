'use client';

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import { isLabAdmin } from '@/constants/labRoles';
import {
  BookOpen,
  Plus,
  Search,
  Eye,
  Pencil,
  Power,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  FlaskConical,
  X,
  Filter,
  RefreshCw,
  Info
} from 'lucide-react';
import ModalPortal from '@/components/ModalPortal';

const DEPARTMENTS = [
  'Clinical Biochemistry',
  'Clinical Pathology',
  'Hematology',
  'Microbiology',
  'Immunology',
  'Histopathology',
  'Cytology',
  'Molecular Diagnostics',
  'Other'
];

const SAMPLE_TYPES = [
  'Blood',
  'Serum',
  'Plasma',
  'Urine',
  'Stool',
  'Sputum',
  'Swab',
  'Tissue',
  'Other'
];

const TAT_UNITS = ['Hours', 'Days'];

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};

export default function LabTestCatalogPage() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Modals state
  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null); // null = Add mode, object = Edit mode
  const [viewingTest, setViewingTest] = useState(null);
  const [statusModalTest, setStatusModalTest] = useState(null); // test for activate/deactivate confirmation
  const [statusToggling, setStatusToggling] = useState(false);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    test_name: '',
    test_code: '',
    department: '',
    sample_type: '',
    tat_value: '',
    tat_unit: 'Hours',
    price: '',
    test_method: '',
    description: '',
    status: 'active'
  });

  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formApiError, setFormApiError] = useState('');

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {}
    }
  }, []);

  const canManageCatalog = useMemo(() => isLabAdmin(currentUser), [currentUser]);

  // Fetch Tests from API
  const fetchTests = async () => {
    try {
      setLoading(true);
      setError('');
      const headers = getAuthHeaders();

      // Attempt backend API first; fallback to relative Next.js route if needed
      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/api/v1/lab/tests`, { headers });
      } catch (beErr) {
        res = await axios.get('/api/v1/lab/tests', { headers });
      }

      const fetched = res.data?.data?.tests || res.data?.tests || [];
      setTests(Array.isArray(fetched) ? fetched : []);
    } catch (err) {
      console.error('Error fetching test catalog:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load test catalog';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  // Filter & Search Logic
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      // Status filter
      if (statusFilter !== 'all' && (t.status || 'active').toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      // Department filter
      if (departmentFilter !== 'all' && t.department !== departmentFilter) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchesName = (t.test_name || '').toLowerCase().includes(q);
        const matchesCode = (t.test_code || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCode) return false;
      }
      return true;
    });
  }, [tests, statusFilter, departmentFilter, searchTerm]);

  // Counts for tabs
  const counts = useMemo(() => {
    const total = tests.length;
    const active = tests.filter((t) => (t.status || 'active').toLowerCase() === 'active').length;
    const inactive = tests.filter((t) => (t.status || 'active').toLowerCase() === 'inactive').length;
    return { total, active, inactive };
  }, [tests]);

  // Reset & Open Add Modal
  const openAddModal = () => {
    setEditingTest(null);
    setFormData({
      test_name: '',
      test_code: '',
      department: '',
      sample_type: '',
      tat_value: '',
      tat_unit: 'Hours',
      price: '',
      test_method: '',
      description: '',
      status: 'active'
    });
    setFormErrors({});
    setTouched({});
    setFormApiError('');
    setAddEditModalOpen(true);
  };

  // Open Edit Modal with Pre-filled Data
  const openEditModal = (test) => {
    setEditingTest(test);
    setFormData({
      test_name: test.test_name || '',
      test_code: test.test_code || '',
      department: test.department || '',
      sample_type: test.sample_type || '',
      tat_value: test.tat_value !== undefined ? String(test.tat_value) : '',
      tat_unit: test.tat_unit || 'Hours',
      price: test.price !== undefined ? String(test.price) : '',
      test_method: test.test_method || '',
      description: test.description || '',
      status: (test.status || 'active').toLowerCase()
    });
    setFormErrors({});
    setTouched({});
    setFormApiError('');
    setAddEditModalOpen(true);
  };

  // Validation function (on-blur or on-submit only, NOT on keystroke)
  const validateField = (name, value) => {
    let error = '';
    const val = typeof value === 'string' ? value.trim() : value;

    switch (name) {
      case 'test_name':
        if (!val) error = 'Test Name is required';
        break;
      case 'test_code':
        if (!val) error = 'Test Code is required';
        break;
      case 'department':
        if (!val) error = 'Department is required';
        break;
      case 'sample_type':
        if (!val) error = 'Sample Type is required';
        break;
      case 'tat_value':
        if (val === '' || val === null || val === undefined) {
          error = 'Turnaround Time value is required';
        } else if (isNaN(Number(val)) || Number(val) <= 0) {
          error = 'TAT must be a positive number';
        }
        break;
      case 'price':
        if (val === '' || val === null || val === undefined) {
          error = 'Price is required';
        } else if (isNaN(Number(val)) || Number(val) < 0) {
          error = 'Price must be a valid non-negative number';
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setFormErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Do NOT validate while typing; clear field error once user enters valid input if touched
    if (touched[field]) {
      const err = validateField(field, value);
      setFormErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  // Save Form (Add / Edit)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormApiError('');

    // Mark all required fields as touched and validate
    const requiredFields = ['test_name', 'test_code', 'department', 'sample_type', 'tat_value', 'price'];
    const newErrors = {};
    const newTouched = {};

    requiredFields.forEach((field) => {
      newTouched[field] = true;
      const err = validateField(field, formData[field]);
      if (err) newErrors[field] = err;
    });

    setTouched((prev) => ({ ...prev, ...newTouched }));
    setFormErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Focus first error field
      const firstErrorField = requiredFields.find((f) => newErrors[f]);
      if (firstErrorField) {
        const el = document.getElementById(`input-${firstErrorField}`);
        if (el) el.focus();
      }
      return;
    }

    setFormSubmitting(true);
    const headers = getAuthHeaders();

    const payload = {
      test_name: formData.test_name.trim(),
      test_code: formData.test_code.trim().toUpperCase(),
      department: formData.department,
      sample_type: formData.sample_type,
      tat_value: Number(formData.tat_value),
      tat_unit: formData.tat_unit,
      price: Number(formData.price),
      test_method: formData.test_method.trim() || null,
      description: formData.description.trim() || null,
      status: formData.status
    };

    try {
      if (editingTest) {
        // Edit Mode (PUT)
        try {
          await axios.put(`${API_BASE_URL}/api/v1/lab/tests/${editingTest.id}`, payload, { headers });
        } catch (beErr) {
          await axios.put(`/api/v1/lab/tests/${editingTest.id}`, payload, { headers });
        }
        toast.success(`Test "${payload.test_name}" updated successfully`);
      } else {
        // Add Mode (POST)
        try {
          await axios.post(`${API_BASE_URL}/api/v1/lab/tests`, payload, { headers });
        } catch (beErr) {
          await axios.post(`/api/v1/lab/tests`, payload, { headers });
        }
        toast.success(`Diagnostic test "${payload.test_name}" created successfully`);
      }

      setAddEditModalOpen(false);
      await fetchTests();
    } catch (err) {
      console.error('Error saving diagnostic test:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save diagnostic test';
      setFormApiError(msg);
      toast.error(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Status (Activate / Deactivate)
  const confirmStatusToggle = async () => {
    if (!statusModalTest) return;
    setStatusToggling(true);
    const headers = getAuthHeaders();
    const newStatus = (statusModalTest.status || 'active').toLowerCase() === 'active' ? 'inactive' : 'active';

    try {
      try {
        await axios.put(
          `${API_BASE_URL}/api/v1/lab/tests/${statusModalTest.id}`,
          { status: newStatus },
          { headers }
        );
      } catch (beErr) {
        await axios.put(
          `/api/v1/lab/tests/${statusModalTest.id}`,
          { status: newStatus },
          { headers }
        );
      }

      toast.success(
        `Test "${statusModalTest.test_name}" has been ${newStatus === 'active' ? 'activated' : 'deactivated'}`
      );
      setStatusModalTest(null);
      await fetchTests();
    } catch (err) {
      console.error('Error toggling test status:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to update test status';
      toast.error(msg);
    } finally {
      setStatusToggling(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">

      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-teal-600 mb-1">
            <BookOpen className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Diagnostic Services</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Test Catalog</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage the diagnostic tests offered by your laboratory.
          </p>
        </div>

        {canManageCatalog ? (
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Test</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            View Only Catalog
          </span>
        )}
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tests by name or test code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
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

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 shrink-0 hidden sm:inline">
              Department:
            </label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
            >
              <option value="all">All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'all'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>All</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-600">
                {counts.total}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Active</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-100/70 text-emerald-700">
                {counts.active}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'inactive'
                  ? 'bg-slate-100 text-slate-800 border border-slate-300'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>Inactive</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-200/70 text-slate-700">
                {counts.inactive}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Test List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-600">Loading your test catalog...</p>
          </div>
        ) : error && tests.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-800">Failed to load catalog</p>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">{error}</p>
            <button
              onClick={fetchTests}
              className="mt-4 px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredTests.length === 0 ? (
          // Empty State
          <div className="p-16 text-center">
            <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mx-auto mb-4">
              <FlaskConical className="w-7 h-7" />
            </div>
            {tests.length === 0 ? (
              <>
                <h3 className="text-base font-bold text-slate-900">No tests added yet</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  Create your first diagnostic test to start building your laboratory catalog.
                </p>
                {canManageCatalog && (
                  <div className="mt-6">
                    <button
                      onClick={openAddModal}
                      className="inline-flex items-center px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Test</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="text-base font-bold text-slate-900">No matching tests found</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  Try adjusting your search query or filters to find what you are looking for.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setDepartmentFilter('all');
                  }}
                  className="mt-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Test Name</th>
                  <th className="py-3.5 px-4">Test Code</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Sample Type</th>
                  <th className="py-3.5 px-4">Turnaround Time</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
                {filteredTests.map((test) => {
                  const isActive = (test.status || 'active').toLowerCase() === 'active';
                  return (
                    <tr
                      key={test.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Test Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{test.test_name}</div>
                        {test.test_method && (
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            Method: {test.test_method}
                          </div>
                        )}
                      </td>

                      {/* Test Code */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/50">
                          {test.test_code}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">
                        {test.department}
                      </td>

                      {/* Sample Type */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {test.sample_type}
                        </span>
                      </td>

                      {/* Turnaround Time */}
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {test.tat_value} {test.tat_unit || 'Hours'}
                          </span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900">
                          ₹{Number(test.price || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* View Action */}
                          <button
                            onClick={() => setViewingTest(test)}
                            title="View test details"
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canManageCatalog && (
                            <>
                              {/* Edit Action */}
                              <button
                                onClick={() => openEditModal(test)}
                                title="Edit test"
                                className="p-1.5 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              {/* Activate / Deactivate Action */}
                              <button
                                onClick={() => setStatusModalTest(test)}
                                title={isActive ? 'Deactivate test' : 'Activate test'}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isActive
                                    ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                    : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                                }`}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                            </>
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

      {/* ============================================================ */}
      {/* 4. ADD / EDIT TEST MODAL                                     */}
      {/* ============================================================ */}
      <ModalPortal isOpen={addEditModalOpen} onClose={() => setAddEditModalOpen(false)}>
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-xl w-full my-auto max-h-[88vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingTest ? 'Edit Diagnostic Test' : 'Add New Diagnostic Test'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingTest
                      ? 'Update details for this test in your laboratory catalog.'
                      : 'Configure the test details and turnaround time.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAddEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm}>
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* API Error Banner */}
                {formApiError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{formApiError}</span>
                  </div>
                )}

                {/* Test Name & Code */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Test Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-test_name"
                      type="text"
                      placeholder="e.g. Complete Blood Count"
                      value={formData.test_name}
                      onChange={(e) => handleChange('test_name', e.target.value)}
                      onBlur={() => handleBlur('test_name')}
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors ${
                        touched.test_name && formErrors.test_name
                          ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
                          : 'border-slate-200 focus:border-teal-600'
                      }`}
                    />
                    {touched.test_name && formErrors.test_name && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">
                        {formErrors.test_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Test Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-test_code"
                      type="text"
                      placeholder="e.g. CBC"
                      value={formData.test_code}
                      onChange={(e) => handleChange('test_code', e.target.value.toUpperCase())}
                      onBlur={() => handleBlur('test_code')}
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm font-mono uppercase text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors ${
                        touched.test_code && formErrors.test_code
                          ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
                          : 'border-slate-200 focus:border-teal-600'
                      }`}
                    />
                    {touched.test_code && formErrors.test_code && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">
                        {formErrors.test_code}
                      </p>
                    )}
                  </div>
                </div>

                {/* Department & Sample Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Department <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="input-department"
                      value={formData.department}
                      onChange={(e) => handleChange('department', e.target.value)}
                      onBlur={() => handleBlur('department')}
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors ${
                        touched.department && formErrors.department
                          ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
                          : 'border-slate-200 focus:border-teal-600'
                      }`}
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                    {touched.department && formErrors.department && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">
                        {formErrors.department}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sample Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="input-sample_type"
                      value={formData.sample_type}
                      onChange={(e) => handleChange('sample_type', e.target.value)}
                      onBlur={() => handleBlur('sample_type')}
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors ${
                        touched.sample_type && formErrors.sample_type
                          ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
                          : 'border-slate-200 focus:border-teal-600'
                      }`}
                    >
                      <option value="">Select Sample Type</option>
                      {SAMPLE_TYPES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    {touched.sample_type && formErrors.sample_type && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">
                        {formErrors.sample_type}
                      </p>
                    )}
                  </div>
                </div>

                {/* Turnaround Time & Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Turnaround Time */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Turnaround Time <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          id="input-tat_value"
                          type="number"
                          min="1"
                          step="1"
                          placeholder="e.g. 24"
                          value={formData.tat_value}
                          onChange={(e) => handleChange('tat_value', e.target.value)}
                          onBlur={() => handleBlur('tat_value')}
                          className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors ${
                            touched.tat_value && formErrors.tat_value
                              ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
                              : 'border-slate-200 focus:border-teal-600'
                          }`}
                        />
                      </div>
                      <select
                        value={formData.tat_unit}
                        onChange={(e) => handleChange('tat_unit', e.target.value)}
                        className="w-28 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-600"
                      >
                        {TAT_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                    {touched.tat_value && formErrors.tat_value && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">
                        {formErrors.tat_value}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Price (₹) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                        ₹
                      </span>
                      <input
                        id="input-price"
                        type="number"
                        min="0"
                        step="any"
                        placeholder="e.g. 500"
                        value={formData.price}
                        onChange={(e) => handleChange('price', e.target.value)}
                        onBlur={() => handleBlur('price')}
                        className={`w-full pl-8 pr-3 py-2 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors ${
                          touched.price && formErrors.price
                            ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
                            : 'border-slate-200 focus:border-teal-600'
                        }`}
                      />
                    </div>
                    {touched.price && formErrors.price && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">
                        {formErrors.price}
                      </p>
                    )}
                  </div>
                </div>

                {/* Test Method (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Test Method <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Automated Flow Cytometry / ELISA / PCR"
                    value={formData.test_method}
                    onChange={(e) => handleChange('test_method', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 transition-colors"
                  />
                </div>

                {/* Description (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description or clinical purpose of this test..."
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 transition-colors resize-none"
                  />
                </div>

                {/* Status Toggle on Edit */}
                {editingTest && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Catalog Status</p>
                      <p className="text-[11px] text-slate-400">
                        Active tests are eligible for ordering by healthcare facilities.
                      </p>
                    </div>
                    <select
                      value={formData.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-600"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddEditModalOpen(false)}
                  disabled={formSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {formSubmitting && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{editingTest ? 'Save Changes' : 'Create Test'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>

      {/* ============================================================ */}
      {/* 5. VIEW TEST DETAILS MODAL                                   */}
      {/* ============================================================ */}
      {viewingTest && (
        <ModalPortal isOpen={!!viewingTest} onClose={() => setViewingTest(null)}>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-lg w-full my-auto max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Diagnostic Test Details</h3>
                  <p className="text-xs text-slate-500">Full specification of this catalog entry.</p>
                </div>
              </div>
              <button
                onClick={() => setViewingTest(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details Content */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{viewingTest.test_name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/50">
                      {viewingTest.test_code}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {viewingTest.department}
                    </span>
                  </div>
                </div>

                <div>
                  {(viewingTest.status || 'active').toLowerCase() === 'active' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">
                    Price
                  </p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    ₹{Number(viewingTest.price || 0).toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">
                    Turnaround Time
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {viewingTest.tat_value} {viewingTest.tat_unit || 'Hours'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">
                    Sample Type
                  </p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {viewingTest.sample_type || 'N/A'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">
                    Test Method
                  </p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {viewingTest.test_method || 'Standard protocol'}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 text-xs">
                <p className="text-slate-400 font-medium uppercase tracking-wider text-[10px] mb-1">
                  Description
                </p>
                <p className="text-slate-700 leading-relaxed">
                  {viewingTest.description || 'No description provided.'}
                </p>
              </div>

              {/* Metadata */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <span>Created: {formatDate(viewingTest.created_at)}</span>
                <span>Last Updated: {formatDate(viewingTest.updated_at)}</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const t = viewingTest;
                  setViewingTest(null);
                  openEditModal(t);
                }}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Test</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingTest(null)}
                className="px-4 py-2 bg-slate-200/80 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
      )}

      {/* ============================================================ */}
      {/* 6. ACTIVATE / DEACTIVATE CONFIRMATION MODAL                  */}
      {/* ============================================================ */}
      {statusModalTest && (
        <ModalPortal isOpen={!!statusModalTest} onClose={() => setStatusModalTest(null)}>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] overflow-y-auto flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full my-auto max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    (statusModalTest.status || 'active').toLowerCase() === 'active'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  <Power className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {(statusModalTest.status || 'active').toLowerCase() === 'active'
                      ? 'Deactivate Diagnostic Test?'
                      : 'Activate Diagnostic Test?'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {(statusModalTest.status || 'active').toLowerCase() === 'active' ? (
                      <>
                        Are you sure you want to deactivate{' '}
                        <span className="font-semibold text-slate-800">
                          {statusModalTest.test_name} ({statusModalTest.test_code})
                        </span>
                        ? Inactive tests remain visible in your catalog for history, but cannot be selected for new orders.
                      </>
                    ) : (
                      <>
                        Are you sure you want to reactivate{' '}
                        <span className="font-semibold text-slate-800">
                          {statusModalTest.test_name} ({statusModalTest.test_code})
                        </span>
                        ? It will become immediately available in your catalog.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setStatusModalTest(null)}
                  disabled={statusToggling}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmStatusToggle}
                  disabled={statusToggling}
                  className={`px-4 py-2 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5 ${
                    (statusModalTest.status || 'active').toLowerCase() === 'active'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {statusToggling && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>
                    {(statusModalTest.status || 'active').toLowerCase() === 'active'
                      ? 'Deactivate Test'
                      : 'Activate Test'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>
      )}
    </div>
  );
}
