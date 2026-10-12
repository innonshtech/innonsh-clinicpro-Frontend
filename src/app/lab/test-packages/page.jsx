'use client';

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import { isLabAdmin } from '@/constants/labRoles';
import {
  Package,
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
  Info,
  Trash2,
  Check,
  Calendar
} from 'lucide-react';
import ModalPortal from '@/components/ModalPortal';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
};

export default function LabTestPackagesPage() {
  const [packages, setPackages] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTests, setLoadingTests] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null); // null = Add, obj = Edit
  const [viewingPackage, setViewingPackage] = useState(null);
  const [statusModalPackage, setStatusModalPackage] = useState(null);
  const [statusToggling, setStatusToggling] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    package_name: '',
    package_code: '',
    description: '',
    package_price: '',
    status: 'active',
    test_ids: []
  });

  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formApiError, setFormApiError] = useState('');

  // Selected test search / picker state
  const [testSearchQuery, setTestSearchQuery] = useState('');

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {}
    }
  }, []);

  const canManagePackages = useMemo(() => isLabAdmin(currentUser), [currentUser]);

  // 1. Fetch Packages from API
  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError('');
      const headers = getAuthHeaders();

      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/api/v1/lab/packages`, { headers });
      } catch (beErr) {
        res = await axios.get('/api/v1/lab/packages', { headers });
      }

      const fetched = res.data?.data?.packages || res.data?.packages || [];
      setPackages(Array.isArray(fetched) ? fetched : []);
    } catch (err) {
      console.error('Error fetching test packages:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load test packages';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Active Tests for Picker
  const fetchAvailableTests = async () => {
    try {
      setLoadingTests(true);
      const headers = getAuthHeaders();

      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/api/v1/lab/tests?status=active`, { headers });
      } catch (beErr) {
        res = await axios.get('/api/v1/lab/tests?status=active', { headers });
      }

      const fetched = res.data?.data?.tests || res.data?.tests || [];
      // Only keep active tests
      const activeOnly = (Array.isArray(fetched) ? fetched : []).filter(
        (t) => (t.status || 'active').toLowerCase() === 'active'
      );
      setAvailableTests(activeOnly);
    } catch (err) {
      console.error('Error fetching active tests for package picker:', err);
    } finally {
      setLoadingTests(false);
    }
  };

  useEffect(() => {
    fetchPackages();
    fetchAvailableTests();
  }, []);

  // Filter & Search Logic for Packages
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      // Status filter
      if (statusFilter !== 'all' && (pkg.status || 'active').toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchesName = (pkg.package_name || '').toLowerCase().includes(q);
        const matchesCode = (pkg.package_code || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCode) return false;
      }
      return true;
    });
  }, [packages, statusFilter, searchTerm]);

  // Counts for tabs
  const counts = useMemo(() => {
    const total = packages.length;
    const active = packages.filter((p) => (p.status || 'active').toLowerCase() === 'active').length;
    const inactive = packages.filter((p) => (p.status || 'active').toLowerCase() === 'inactive').length;
    return { total, active, inactive };
  }, [packages]);

  // Calculate Individual Tests Total for the current form selection
  const formIndividualTotal = useMemo(() => {
    const selectedIds = new Set(formData.test_ids || []);
    return availableTests
      .filter((t) => selectedIds.has(t.id))
      .reduce((sum, t) => sum + (Number(t.price) || 0), 0);
  }, [formData.test_ids, availableTests]);

  // Selected test objects for form
  const selectedTestObjects = useMemo(() => {
    const idMap = new Map(availableTests.map((t) => [t.id, t]));
    return (formData.test_ids || []).map((id) => {
      if (idMap.has(id)) return idMap.get(id);
      // If editing and test not in active list (e.g. from package's included tests)
      if (editingPackage && Array.isArray(editingPackage.tests)) {
        const match = editingPackage.tests.find((t) => t.id === id);
        if (match) return match;
      }
      return { id, test_name: 'Diagnostic Test', test_code: 'TEST', price: 0 };
    });
  }, [formData.test_ids, availableTests, editingPackage]);

  // Tests available to be added (excluding already selected)
  const selectableTests = useMemo(() => {
    const selectedSet = new Set(formData.test_ids || []);
    return availableTests.filter((t) => {
      if (selectedSet.has(t.id)) return false;
      if (testSearchQuery.trim()) {
        const q = testSearchQuery.trim().toLowerCase();
        return (
          (t.test_name || '').toLowerCase().includes(q) ||
          (t.test_code || '').toLowerCase().includes(q) ||
          (t.department || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [availableTests, formData.test_ids, testSearchQuery]);

  // Open Add Modal
  const openAddModal = () => {
    setEditingPackage(null);
    setFormData({
      package_name: '',
      package_code: '',
      description: '',
      package_price: '',
      status: 'active',
      test_ids: []
    });
    setFormErrors({});
    setTouched({});
    setFormApiError('');
    setTestSearchQuery('');
    setAddEditModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (pkg) => {
    setEditingPackage(pkg);
    const existingIds = (pkg.tests || []).map((t) => t.id);
    setFormData({
      package_name: pkg.package_name || '',
      package_code: pkg.package_code || '',
      description: pkg.description || '',
      package_price: pkg.package_price !== undefined ? String(pkg.package_price) : '',
      status: (pkg.status || 'active').toLowerCase(),
      test_ids: existingIds
    });
    setFormErrors({});
    setTouched({});
    setFormApiError('');
    setTestSearchQuery('');
    setAddEditModalOpen(true);
  };

  // Validation function
  const validateField = (name, value) => {
    let error = '';
    const val = typeof value === 'string' ? value.trim() : value;

    switch (name) {
      case 'package_name':
        if (!val) error = 'Package Name is required';
        break;
      case 'package_code':
        if (!val) error = 'Package Code is required';
        break;
      case 'package_price':
        if (val === '' || val === null || val === undefined) {
          error = 'Package Price is required';
        } else if (isNaN(Number(val)) || Number(val) <= 0) {
          error = 'Package Price must be a positive number';
        }
        break;
      case 'test_ids':
        if (!Array.isArray(value) || value.length === 0) {
          error = 'At least one diagnostic test must be included in the package';
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
    if (touched[field]) {
      const err = validateField(field, value);
      setFormErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const addTestToPackage = (testId) => {
    if (!formData.test_ids.includes(testId)) {
      const nextIds = [...formData.test_ids, testId];
      setFormData((prev) => ({ ...prev, test_ids: nextIds }));
      if (touched.test_ids) {
        setFormErrors((prev) => ({ ...prev, test_ids: '' }));
      }
    }
  };

  const removeTestFromPackage = (testId) => {
    const nextIds = formData.test_ids.filter((id) => id !== testId);
    setFormData((prev) => ({ ...prev, test_ids: nextIds }));
    if (touched.test_ids) {
      const err = validateField('test_ids', nextIds);
      setFormErrors((prev) => ({ ...prev, test_ids: err }));
    }
  };

  // Submit Form (Add / Edit)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormApiError('');

    const requiredFields = ['package_name', 'package_code', 'package_price', 'test_ids'];
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
      const firstErrorField = requiredFields.find((f) => newErrors[f]);
      if (firstErrorField && firstErrorField !== 'test_ids') {
        const el = document.getElementById(`input-${firstErrorField}`);
        if (el) el.focus();
      }
      return;
    }

    setFormSubmitting(true);
    const headers = getAuthHeaders();

    const payload = {
      package_name: formData.package_name.trim(),
      package_code: formData.package_code.trim().toUpperCase(),
      description: formData.description.trim() || null,
      package_price: Number(formData.package_price),
      status: formData.status,
      test_ids: formData.test_ids
    };

    try {
      if (editingPackage) {
        // Edit Mode (PUT)
        try {
          await axios.put(`${API_BASE_URL}/api/v1/lab/packages/${editingPackage.id}`, payload, { headers });
        } catch (beErr) {
          await axios.put(`/api/v1/lab/packages/${editingPackage.id}`, payload, { headers });
        }
        toast.success(`Package "${payload.package_name}" updated successfully`);
      } else {
        // Add Mode (POST)
        try {
          await axios.post(`${API_BASE_URL}/api/v1/lab/packages`, payload, { headers });
        } catch (beErr) {
          await axios.post(`/api/v1/lab/packages`, payload, { headers });
        }
        toast.success(`Package "${payload.package_name}" created successfully`);
      }

      setAddEditModalOpen(false);
      await fetchPackages();
    } catch (err) {
      console.error('Error saving package:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save test package';
      setFormApiError(msg);
      toast.error(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Status (Activate / Deactivate)
  const confirmStatusToggle = async () => {
    if (!statusModalPackage) return;
    setStatusToggling(true);
    const headers = getAuthHeaders();
    const newStatus = (statusModalPackage.status || 'active').toLowerCase() === 'active' ? 'inactive' : 'active';

    try {
      try {
        await axios.put(
          `${API_BASE_URL}/api/v1/lab/packages/${statusModalPackage.id}`,
          { status: newStatus },
          { headers }
        );
      } catch (beErr) {
        await axios.put(
          `/api/v1/lab/packages/${statusModalPackage.id}`,
          { status: newStatus },
          { headers }
        );
      }

      toast.success(
        `Package "${statusModalPackage.package_name}" has been ${newStatus === 'active' ? 'activated' : 'deactivated'}`
      );
      setStatusModalPackage(null);
      await fetchPackages();
    } catch (err) {
      console.error('Error toggling package status:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to update package status';
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
            <Package className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Diagnostic Bundles</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lab Test Packages</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Group diagnostic tests into attractive, bundled health packages for patients.
          </p>
        </div>

        {canManagePackages ? (
          <button
            id="btn-add-package"
            onClick={openAddModal}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Package</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            View Only Packages
          </span>
        )}
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-packages"
              type="text"
              placeholder="Search packages by name or code..."
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
              <span>All Packages</span>
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
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Active</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-100/60 text-emerald-700">
                {counts.active}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'inactive'
                  ? 'bg-slate-200 text-slate-800 border border-slate-300'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              <span>Inactive</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-200 text-slate-700">
                {counts.inactive}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Packages Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-slate-500 font-medium">Loading test packages...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Error Loading Packages</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchPackages}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No test packages found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'No packages match your search filters. Try clearing filters.'
                : 'Create your first health package to bundle multiple diagnostic tests together.'}
            </p>
            {searchTerm || statusFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Clear Filters
              </button>
            ) : canManagePackages ? (
              <button
                onClick={openAddModal}
                className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Package</span>
              </button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Package Name</th>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Included Tests</th>
                  <th className="py-3.5 px-4">Individual Total</th>
                  <th className="py-3.5 px-4">Package Price</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPackages.map((pkg) => {
                  const isActive = (pkg.status || 'active').toLowerCase() === 'active';
                  const testCount = Array.isArray(pkg.tests) ? pkg.tests.length : (pkg.test_ids?.length || 0);
                  const individualTotal = pkg.individual_total || 0;
                  const packagePrice = pkg.package_price || 0;
                  const discountPercent =
                    individualTotal > packagePrice
                      ? Math.round(((individualTotal - packagePrice) / individualTotal) * 100)
                      : null;

                  return (
                    <tr key={pkg.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Package Name */}
                      <td className="py-4 px-4 sm:px-6 font-medium text-slate-900">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">{pkg.package_name}</span>
                            {pkg.description ? (
                              <span className="text-xs text-slate-400 line-clamp-1 max-w-xs">
                                {pkg.description}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Package Code */}
                      <td className="py-4 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {pkg.package_code}
                        </span>
                      </td>

                      {/* Tests */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 text-xs">
                            <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
                            {testCount} {testCount === 1 ? 'Test' : 'Tests'}
                          </span>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(pkg.tests || []).slice(0, 3).map((t) => (
                              <span
                                key={t.id}
                                className="px-1.5 py-0.5 bg-slate-100 text-[10px] text-slate-600 rounded border border-slate-200 truncate max-w-[120px]"
                                title={t.test_name}
                              >
                                {t.test_name}
                              </span>
                            ))}
                            {testCount > 3 && (
                              <span className="px-1.5 py-0.5 bg-slate-100 text-[10px] text-slate-500 rounded font-medium">
                                +{testCount - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Individual Total */}
                      <td className="py-4 px-4 font-medium text-slate-500">
                        <span className="text-xs">₹{Number(individualTotal).toLocaleString('en-IN')}</span>
                      </td>

                      {/* Package Price */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-sm">
                            ₹{Number(packagePrice).toLocaleString('en-IN')}
                          </span>
                          {discountPercent && discountPercent > 0 ? (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {discountPercent}% OFF
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold gap-1.5 ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          ></span>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View */}
                          <button
                            id={`btn-view-${pkg.id}`}
                            onClick={() => setViewingPackage(pkg)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="View Package Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canManagePackages && (
                            <>
                              {/* Edit */}
                              <button
                                id={`btn-edit-${pkg.id}`}
                                onClick={() => openEditModal(pkg)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Package"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              {/* Activate / Deactivate */}
                              <button
                                id={`btn-status-${pkg.id}`}
                                onClick={() => setStatusModalPackage(pkg)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isActive
                                    ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                    : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={isActive ? 'Deactivate Package' : 'Activate Package'}
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

      {/* ========================================================= */}
      {/* 4. CREATE / EDIT PACKAGE MODAL                            */}
      {/* ========================================================= */}
      <ModalPortal isOpen={addEditModalOpen} onClose={() => setAddEditModalOpen(false)}>
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[88vh] my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingPackage ? 'Edit Test Package' : 'Create New Test Package'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {editingPackage
                      ? 'Update package details, price, or included diagnostic tests.'
                      : 'Bundle multiple tests together from your diagnostic catalog.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAddEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="overflow-y-auto p-6 space-y-5 flex-1">
              {formApiError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Failed to save package</span>
                    <span>{formApiError}</span>
                  </div>
                </div>
              )}

              {/* Package Name & Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Package Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-package_name"
                    type="text"
                    placeholder="e.g. Comprehensive Full Body Checkup"
                    value={formData.package_name}
                    onChange={(e) => handleChange('package_name', e.target.value)}
                    onBlur={() => handleBlur('package_name')}
                    className={`w-full px-3.5 py-2 text-sm bg-slate-50 border rounded-xl focus:outline-none transition-colors ${
                      formErrors.package_name && touched.package_name
                        ? 'border-red-300 focus:border-red-500 bg-red-50/20'
                        : 'border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20'
                    }`}
                  />
                  {formErrors.package_name && touched.package_name && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.package_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Package Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-package_code"
                    type="text"
                    placeholder="e.g. PKG-FULLBODY"
                    value={formData.package_code}
                    onChange={(e) => handleChange('package_code', e.target.value.toUpperCase())}
                    onBlur={() => handleBlur('package_code')}
                    className={`w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border rounded-xl focus:outline-none transition-colors uppercase ${
                      formErrors.package_code && touched.package_code
                        ? 'border-red-300 focus:border-red-500 bg-red-50/20'
                        : 'border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20'
                    }`}
                  />
                  {formErrors.package_code && touched.package_code && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.package_code}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="input-description"
                  rows={2}
                  placeholder="Short description of health parameters covered and who this package is recommended for..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-colors"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={formData.status === 'active'}
                      onChange={() => handleChange('status', 'active')}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span>Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={formData.status === 'inactive'}
                      onChange={() => handleChange('status', 'inactive')}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span>Inactive</span>
                  </label>
                </div>
              </div>

              {/* Test Selection Section */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-800">
                    Select Included Diagnostic Tests <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-500">
                    Selected: <strong className="text-teal-700">{formData.test_ids.length}</strong>
                  </span>
                </div>

                {/* Search / Add from catalog */}
                <div className="space-y-2 mb-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search active tests to add to this package..."
                      value={testSearchQuery}
                      onChange={(e) => setTestSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600"
                    />
                  </div>

                  {/* Dropdown list of selectable tests */}
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50/60 divide-y divide-slate-100">
                    {loadingTests ? (
                      <div className="p-3 text-center text-xs text-slate-500">Loading catalog tests...</div>
                    ) : selectableTests.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">
                        {testSearchQuery
                          ? 'No matching tests found'
                          : formData.test_ids.length > 0 && selectableTests.length === 0
                          ? 'All active tests have been selected'
                          : 'No active tests available in your catalog. Please add tests in Test Catalog first.'}
                      </div>
                    ) : (
                      selectableTests.map((t) => (
                        <div
                          key={t.id}
                          className="p-2 px-3 flex items-center justify-between hover:bg-teal-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-semibold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                              {t.test_code}
                            </span>
                            <span className="text-xs font-medium text-slate-800">{t.test_name}</span>
                            <span className="text-[11px] text-slate-400">({t.department || 'General'})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-slate-700">₹{t.price}</span>
                            <button
                              type="button"
                              id={`btn-add-test-${t.id}`}
                              onClick={() => addTestToPackage(t.id)}
                              className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Selected Tests List */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    Included Tests in this Package ({selectedTestObjects.length})
                  </div>

                  {selectedTestObjects.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400 italic">
                      No tests selected yet. Pick tests from the list above.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {selectedTestObjects.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs shadow-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-semibold bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-200">
                              {t.test_code}
                            </span>
                            <span className="font-medium text-slate-900">{t.test_name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-slate-600">₹{t.price}</span>
                            <button
                              type="button"
                              id={`btn-remove-test-${t.id}`}
                              onClick={() => removeTestFromPackage(t.id)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Remove from package"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {formErrors.test_ids && touched.test_ids && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.test_ids}</p>
                  )}
                </div>
              </div>

              {/* Price Calculation Card */}
              <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Individual Tests Total</div>
                    <div className="text-lg font-bold text-slate-800">
                      ₹{Number(formIndividualTotal).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Sum of standard catalog prices for the {selectedTestObjects.length} selected tests
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <label className="block text-xs font-semibold text-teal-900 mb-1">
                      Package Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative inline-block w-40">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                        ₹
                      </span>
                      <input
                        id="input-package_price"
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="e.g. 1499"
                        value={formData.package_price}
                        onChange={(e) => handleChange('package_price', e.target.value)}
                        onBlur={() => handleBlur('package_price')}
                        className={`w-full pl-7 pr-3 py-1.5 text-sm font-bold bg-white border rounded-xl focus:outline-none transition-colors ${
                          formErrors.package_price && touched.package_price
                            ? 'border-red-300 focus:border-red-500 text-red-700'
                            : 'border-teal-300 focus:border-teal-600 text-teal-950 focus:ring-2 focus:ring-teal-500/20'
                        }`}
                      />
                    </div>
                    {formErrors.package_price && touched.package_price && (
                      <p className="text-[11px] text-red-600 mt-1 text-left sm:text-right">
                        {formErrors.package_price}
                      </p>
                    )}
                  </div>
                </div>

                {formData.package_price && formIndividualTotal > Number(formData.package_price) && (
                  <div className="text-xs text-emerald-700 bg-emerald-100/60 p-2 rounded-lg font-medium flex items-center justify-between">
                    <span>Patient Savings / Discount:</span>
                    <strong className="font-bold">
                      ₹{(formIndividualTotal - Number(formData.package_price)).toLocaleString('en-IN')} (
                      {Math.round(
                        ((formIndividualTotal - Number(formData.package_price)) / formIndividualTotal) * 100
                      )}
                      % OFF)
                    </strong>
                  </div>
                )}
              </div>
            </form>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setAddEditModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-submit-package"
                onClick={handleSubmitForm}
                disabled={formSubmitting}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 inline-flex items-center gap-2"
              >
                {formSubmitting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>{editingPackage ? 'Save Changes' : 'Create Package'}</span>
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* ========================================================= */}
      {/* 5. VIEW PACKAGE DETAILS MODAL                             */}
      {/* ========================================================= */}
      {viewingPackage && (
        <ModalPortal isOpen={!!viewingPackage} onClose={() => setViewingPackage(null)}>
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[88vh] my-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Package Details</h2>
                  <span className="text-xs font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                    {viewingPackage.package_code}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingPackage(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Name & Status */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{viewingPackage.package_name}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {viewingPackage.description || 'No description provided for this package.'}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold gap-1.5 shrink-0 ${
                    (viewingPackage.status || 'active').toLowerCase() === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      (viewingPackage.status || 'active').toLowerCase() === 'active'
                        ? 'bg-emerald-500'
                        : 'bg-slate-400'
                    }`}
                  ></span>
                  {(viewingPackage.status || 'active').toLowerCase() === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Price Breakdown Banner */}
              <div className="grid grid-cols-2 gap-4 bg-teal-50/70 p-4 rounded-xl border border-teal-200/70">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Individual Tests Total</div>
                  <div className="text-lg font-bold text-slate-700">
                    ₹{Number(viewingPackage.individual_total || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-teal-800 font-medium">Package Price</div>
                  <div className="text-xl font-extrabold text-teal-900">
                    ₹{Number(viewingPackage.package_price || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Included Tests List */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-teal-600" />
                  <span>Included Diagnostic Tests ({viewingPackage.tests?.length || 0})</span>
                </h4>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {(viewingPackage.tests || []).map((t, idx) => (
                    <div key={t.id || idx} className="p-3 flex items-center justify-between text-xs bg-white">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          {t.test_code}
                        </span>
                        <div>
                          <span className="font-semibold text-slate-900 block">{t.test_name}</span>
                          <span className="text-[10px] text-slate-400">
                            {t.department ? `${t.department} • ` : ''}
                            {t.sample_type ? `Sample: ${t.sample_type}` : ''}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-slate-800">
                          ₹{Number(t.price || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meta details */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Created: {formatDate(viewingPackage.created_at)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Updated: {formatDate(viewingPackage.updated_at)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/50">
              <button
                type="button"
                onClick={() => {
                  const p = viewingPackage;
                  setViewingPackage(null);
                  openEditModal(p);
                }}
                className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Package</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingPackage(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
      )}

      {/* ========================================================= */}
      {/* 6. ACTIVATE / DEACTIVATE CONFIRMATION MODAL               */}
      {/* ========================================================= */}
      {statusModalPackage && (
        <ModalPortal isOpen={!!statusModalPackage} onClose={() => setStatusModalPackage(null)}>
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4 my-auto max-h-[88vh]">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Power className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                {(statusModalPackage.status || 'active').toLowerCase() === 'active'
                  ? 'Deactivate Package?'
                  : 'Activate Package?'}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5">
                {(statusModalPackage.status || 'active').toLowerCase() === 'active'
                  ? `Are you sure you want to deactivate "${statusModalPackage.package_name}"? Patients will not see this package, but existing records are preserved.`
                  : `Are you sure you want to activate "${statusModalPackage.package_name}"? It will become visible for health checkups.`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalPackage(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-status"
                onClick={confirmStatusToggle}
                disabled={statusToggling}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors inline-flex items-center gap-1.5 ${
                  (statusModalPackage.status || 'active').toLowerCase() === 'active'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {statusToggling && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>
                  {(statusModalPackage.status || 'active').toLowerCase() === 'active'
                    ? 'Deactivate'
                    : 'Activate'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
      )}
    </div>
  );
}
