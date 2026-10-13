'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import { formatTitleCase } from '@/utils/nameFormatting';
import {
  ArrowLeft,
  FlaskConical,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  ExternalLink,
  X,
  FileText,
  Home,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import EditLabModal from './EditLabModal';
import { supabase } from '@/lib/supabase';

const LAB_TYPE_LABELS = {
  diagnostic: 'Multi-disciplinary Diagnostic Center',
  pathology: 'Clinical Pathology Laboratory',
  radiology: 'Radiology & Imaging Center',
  molecular: 'Molecular Genetics & Microbiology',
  biochemistry: 'Clinical Biochemistry & Immunology'
};

const formatLabType = (type) => {
  if (!type) return 'Diagnostic Center';
  return LAB_TYPE_LABELS[type.toLowerCase()] || (type.charAt(0).toUpperCase() + type.slice(1));
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
};

export default function LabsManagePage() {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLab, setSelectedLab] = useState(null);
  const [editingLab, setEditingLab] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  // Delete Lab state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [labToDelete, setLabToDelete] = useState(null);
  const [isDeletingLab, setIsDeletingLab] = useState(false);
  const [deleteLabError, setDeleteLabError] = useState('');

  const openDeleteModal = (lab) => {
    setLabToDelete(lab);
    setDeleteLabError('');
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (isDeletingLab) return;
    setShowDeleteModal(false);
    setLabToDelete(null);
    setDeleteLabError('');
  };

  const handleConfirmDeleteLab = async () => {
    if (!labToDelete) return;
    const labId = labToDelete._id || labToDelete.id;
    if (!labId) return;

    try {
      setIsDeletingLab(true);
      setDeleteLabError('');

      // 1. Call API endpoint
      let res = await fetch(`${API_BASE_URL}/api/v1/lab/delete/${labId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      }).catch(() => null);

      let data = res ? await res.json().catch(() => ({})) : null;

      // 2. If endpoint not found or failed, try local Next.js route
      if (!res || !res.ok) {
        if (!data || res?.status === 404 || res?.status === 502) {
          const localRes = await fetch(`/api/v1/lab/delete/${labId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders()
            }
          }).catch(() => null);
          if (localRes) {
            res = localRes;
            data = await localRes.json().catch(() => ({}));
          }
        }
      }

      // 3. Fallback client-side dependency check & direct deletion if API route unreachable
      if (!res || !data) {
        const { count: orderCount, error: orderErr } = await supabase
          .from('lab_orders')
          .select('id', { count: 'exact', head: true })
          .eq('lab_id', labId);

        if (!orderErr && orderCount > 0) {
          setDeleteLabError(`Cannot delete laboratory because it has ${orderCount} existing lab order(s). Active orders must be completed or archived first.`);
          setIsDeletingLab(false);
          return;
        }

        // Clean up package items, packages, tests if any
        try {
          const { data: packages } = await supabase.from('lab_test_packages').select('id').eq('lab_id', labId);
          if (packages && packages.length > 0) {
            const pkgIds = packages.map(p => p.id);
            await supabase.from('lab_test_package_items').delete().in('package_id', pkgIds);
            await supabase.from('lab_test_packages').delete().eq('lab_id', labId);
          }
          await supabase.from('lab_tests').delete().eq('lab_id', labId);
        } catch (_) {}

        const { error: sbDeleteErr } = await supabase.from('labs').delete().eq('id', labId);
        if (sbDeleteErr) {
          throw new Error(sbDeleteErr.message || 'Failed to delete laboratory');
        }
        data = { success: true };
      }

      if (data && data.success === false) {
        setDeleteLabError(data.message || data.error || 'Cannot delete laboratory due to dependencies.');
        return;
      }

      // Successfully deleted!
      setShowDeleteModal(false);
      setLabToDelete(null);
      await fetchLabs();
    } catch (err) {
      console.error('Delete lab error:', err);
      setDeleteLabError(err.message || 'An unexpected error occurred while deleting the laboratory.');
    } finally {
      setIsDeletingLab(false);
    }
  };

  const fetchLabs = async () => {
    try {
      setLoading(true);
      setError('');
      const headers = getAuthHeaders();
      const res = await axios.get(`${API_BASE_URL}/api/v1/lab/fetchAll`, { headers });
      const rawLabs = res.data;
      const fetchedLabs = rawLabs?.data?.labs || rawLabs?.labs || rawLabs?.data || (Array.isArray(rawLabs) ? rawLabs : []);
      const labList = Array.isArray(fetchedLabs) ? fetchedLabs : [];

      // Sort newest labs first by created_at / createdAt
      const sorted = [...labList].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setLabs(sorted);
    } catch (err) {
      console.error('Error fetching all labs:', err);
      setError('Failed to load laboratories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  // Lock outer page scrolling while Lab Details modal is open and restore when closed
  useEffect(() => {
    if (selectedLab) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [selectedLab]);

  // Sorting helper
  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Filtered and sorted labs
  const filteredLabs = useMemo(() => {
    let result = [...labs];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(lab => (lab.status || 'active').toLowerCase() === statusFilter.toLowerCase());
    }

    // Search term (lab name, city, state, phone, contact email)
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      result = result.filter(lab => {
        const name = (lab.labName || lab.lab_name || '').toLowerCase();
        const city = (lab.city || '').toLowerCase();
        const state = (lab.state || '').toLowerCase();
        const phone = (lab.phone || '').toLowerCase();
        const email = (lab.contactEmail || lab.email || '').toLowerCase();
        return (
          name.includes(query) ||
          city.includes(query) ||
          state.includes(query) ||
          phone.includes(query) ||
          email.includes(query)
        );
      });
    }

    // Sort
    result.sort((a, b) => {
      let valA = a[sortConfig.key] || a[sortConfig.key === 'labName' ? 'lab_name' : sortConfig.key] || '';
      let valB = b[sortConfig.key] || b[sortConfig.key === 'labName' ? 'lab_name' : sortConfig.key] || '';

      if (sortConfig.key === 'created_at') {
        valA = new Date(a.createdAt || a.created_at || 0).getTime();
        valB = new Date(b.createdAt || b.created_at || 0).getTime();
      }

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [labs, statusFilter, searchTerm, sortConfig]);

  // Counts for summary cards
  const totalCount = labs.length;
  const activeCount = labs.filter(l => (l.status || 'active').toLowerCase() === 'active').length;
  const inactiveCount = labs.filter(l => (l.status || '').toLowerCase() === 'inactive').length;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
                <FlaskConical className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">Lab Management</h1>
                <p className="text-sm text-gray-500">Manage all registered laboratories</p>
              </div>
            </div>
          </div>
          <Link
            href="/admin/labs/add"
            className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Lab
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Labs Card */}
        <div
          onClick={() => setStatusFilter('all')}
          className={`bg-white rounded-xl shadow-xs border p-5 cursor-pointer transition-all hover:shadow-sm ${
            statusFilter === 'all' ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-gray-100 hover:border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Labs</p>
              <p className="mt-1.5 text-3xl font-bold text-gray-900">{totalCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-teal-50 text-teal-600">
              <FlaskConical className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Active Labs Card */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
          className={`bg-white rounded-xl shadow-xs border p-5 cursor-pointer transition-all hover:shadow-sm ${
            statusFilter === 'active' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-gray-100 hover:border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Labs</p>
              <p className="mt-1.5 text-3xl font-bold text-emerald-600">{activeCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Inactive Labs Card */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'inactive' ? 'all' : 'inactive')}
          className={`bg-white rounded-xl shadow-xs border p-5 cursor-pointer transition-all hover:shadow-sm ${
            statusFilter === 'inactive' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-gray-100 hover:border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Inactive Labs</p>
              <p className="mt-1.5 text-3xl font-bold text-rose-600">{inactiveCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
              <XCircle className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-500 mr-3 shrink-0" />
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
          <button
            onClick={fetchLabs}
            className="text-xs font-semibold text-red-700 underline hover:text-red-900 ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search & Status Filter Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search labs by lab name, location, contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by Status"
              className="px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 w-full sm:w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {(searchTerm || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-teal-600 transition-colors shrink-0"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Labs Table */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500 mb-3"></div>
            <p className="text-xs text-slate-500">Loading laboratories...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80">
                <tr>
                  <th
                    scope="col"
                    onClick={() => handleSort('labName')}
                    className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      Lab
                      {sortConfig.key === 'labName' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >
                    Location
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >
                    Contact
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >
                    Facility Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredLabs.length > 0 ? (
                  filteredLabs.map((lab, index) => {
                    const formattedName = formatTitleCase(lab?.labName || lab?.lab_name || 'Laboratory');
                    const initial = formattedName.charAt(0).toUpperCase() || 'L';
                    const logo = lab?.logo;
                    const labType = lab?.labType || lab?.lab_type || 'diagnostic';
                    const city = lab?.city || 'N/A';
                    const state = lab?.state || '';
                    const phone = lab?.phone || 'N/A';
                    const email = lab?.contactEmail || lab?.email || 'N/A';
                    const status = lab?.status || 'active';
                    const isNabl = Boolean(lab?.nablAccredited ?? lab?.nabl_accredited);

                    return (
                      <tr key={lab?._id || lab?.id || index} className="hover:bg-slate-50/70 transition-colors">
                        {/* Lab Info */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center overflow-hidden">
                              {logo ? (
                                <img
                                  src={logo}
                                  alt={formattedName}
                                  className="h-10 w-10 rounded-xl object-contain p-0.5 border border-teal-200 bg-white shadow-xs"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center border border-teal-200 shadow-xs">
                                  <span className="text-white font-bold text-sm">{initial}</span>
                                </div>
                              )}
                            </div>
                            <div className="ml-3.5">
                              <div className="text-sm font-semibold text-gray-900">{formattedName}</div>
                              <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                {lab.address || 'Address not provided'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">{city}</div>
                          <div className="text-xs text-gray-500">{state || lab.country || 'India'}</div>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">{phone}</div>
                          <div className="text-xs text-gray-500">{email}</div>
                        </td>

                        {/* Facility Type */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center text-xs font-medium text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                            {formatLabType(labType)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                                status.toLowerCase() === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {status}
                            </span>
                            {isNabl && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                <Award className="w-3 h-3 mr-0.5 text-blue-600" />
                                NABL
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="inline-flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedLab(lab)}
                              className="inline-flex items-center px-2.5 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-xs font-semibold transition-colors"
                              title="View lab details"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingLab(lab)}
                              className="inline-flex items-center px-2.5 py-1.5 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 rounded-lg text-xs font-semibold transition-colors"
                              title="Edit lab"
                            >
                              <Pencil className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteModal(lab)}
                              className="inline-flex items-center px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-colors"
                              title="Delete laboratory"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <FlaskConical className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-600">No laboratories found</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {searchTerm || statusFilter !== 'all'
                          ? 'Try adjusting your search or filters'
                          : 'Add your first laboratory to get started'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lab Details Modal (Reused identical pattern from SuperAdmin Dashboard) */}
      {selectedLab && (() => {
        const name = formatTitleCase(selectedLab.labName || selectedLab.lab_name || 'Laboratory Details');
        const initial = name.charAt(0).toUpperCase();
        const logo = selectedLab.logo;
        const labType = selectedLab.labType || selectedLab.lab_type || 'diagnostic';
        const description = selectedLab.description;
        const phone = selectedLab.phone || 'N/A';
        const email = selectedLab.contactEmail || selectedLab.email || 'N/A';
        const website = selectedLab.website;
        const address = selectedLab.address || 'N/A';
        const city = selectedLab.city || 'N/A';
        const state = selectedLab.state || 'N/A';
        const postalCode = selectedLab.postalCode || selectedLab.postal_code || 'N/A';
        const country = selectedLab.country || 'India';
        const regNumber = selectedLab.registrationNumber || selectedLab.registration_number || 'N/A';
        const taxId = selectedLab.taxId || selectedLab.tax_id || 'N/A';
        const isNabl = Boolean(selectedLab.nablAccredited ?? selectedLab.nabl_accredited);
        const hasHomeCollection = Boolean(selectedLab.homeCollectionAvailable ?? selectedLab.home_collection_available);
        const status = selectedLab.status || 'active';
        const createdAt = selectedLab.createdAt || selectedLab.created_at;
        const updatedAt = selectedLab.updatedAt || selectedLab.updated_at;

        const isValidWebsite = website && typeof website === 'string' && website.trim() !== '' && !['na', 'n/a', 'none', 'null', 'undefined'].includes(website.trim().toLowerCase());
        const cleanDescription = (description && typeof description === 'string' && !['na', 'n/a', 'none', 'null'].includes(description.trim().toLowerCase()))
          ? description
          : null;

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[680px] max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex-shrink-0 flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200 z-10">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
                    <FlaskConical className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">Laboratory Details</h2>
                    <p className="text-xs text-gray-500">Comprehensive facility record</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLab(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-100"
                  title="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* 1. Header Identity Banner */}
                <div className="bg-slate-50/80 p-4 sm:p-4.5 rounded-xl border border-slate-200/70">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {logo ? (
                        <img
                          src={logo}
                          alt={name}
                          className="h-16 w-16 rounded-xl object-contain p-1 border border-teal-200 bg-white shadow-sm"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center border border-teal-200 shadow-sm">
                          <span className="text-white text-2xl font-bold">{initial}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-bold text-gray-900 leading-tight break-words">{name}</h3>
                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 capitalize">
                          {status}
                        </span>
                        {isNabl && (
                          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 flex items-center gap-1 border border-blue-200">
                            <Award className="w-3 h-3 text-blue-600" />
                            NABL Accredited
                          </span>
                        )}
                        {hasHomeCollection && (
                          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 flex items-center gap-1 border border-purple-200">
                            <Home className="w-3 h-3 text-purple-600" />
                            Home Collection
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                        <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded text-xs border border-teal-100">
                          {formatLabType(labType)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {cleanDescription ? (
                    <div className="mt-3.5 pt-3 border-t border-slate-200/60">
                      <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Description</span>
                      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{cleanDescription}</p>
                    </div>
                  ) : (
                    <div className="mt-3.5 pt-3 border-t border-slate-200/60">
                      <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Description</span>
                      <p className="text-sm text-gray-400 italic">No description provided.</p>
                    </div>
                  )}
                </div>

                {/* 2. Contact & Communication */}
                <div>
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-teal-600" />
                    Contact &amp; Communication
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-gray-200">
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">Helpline / Phone</span>
                      <span className="text-sm font-semibold text-gray-900 break-words">{phone}</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">Contact Email</span>
                      <span className="text-sm font-semibold text-gray-900 break-words">{email}</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">Website</span>
                      {isValidWebsite ? (
                        <a
                          href={website.startsWith('http') ? website : `https://${website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-800 underline inline-flex items-center gap-1 text-sm font-semibold break-all"
                        >
                          {website}
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="text-sm font-semibold text-gray-500">N/A</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Premises Address & Location */}
                <div>
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-teal-600" />
                    Premises Address &amp; Location
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-gray-200">
                    <div className="sm:col-span-2 md:col-span-3">
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">Premises Address</span>
                      <span className="text-sm font-semibold text-gray-900 break-words">{address}</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">City</span>
                      <span className="text-sm font-semibold text-gray-900">{city}</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">State / Province</span>
                      <span className="text-sm font-semibold text-gray-900">{state}</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">PIN / Postal Code</span>
                      <span className="text-sm font-semibold text-gray-900">{postalCode}</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">Country</span>
                      <span className="text-sm font-semibold text-gray-900">{country}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Registration & Certifications */}
                <div>
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-teal-600" />
                    Registration &amp; Accreditation
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-gray-200">
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">Registration Number</span>
                      <span className="text-sm font-semibold text-gray-900 break-words">{regNumber}</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">GSTIN / Tax ID</span>
                      <span className="text-sm font-semibold text-gray-900 break-words">{taxId}</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">NABL Accredited</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${isNabl ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {isNabl ? 'Accredited' : 'Not Accredited'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">Home Collection</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${hasHomeCollection ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {hasHomeCollection ? 'Available' : 'Not Available'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Account Timestamps */}
                <div>
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-teal-600" />
                    Account Timestamps
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-gray-200">
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">Created At</span>
                      <span className="text-xs font-semibold text-gray-800">{formatDate(createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-0.5">Last Updated</span>
                      <span className="text-xs font-semibold text-gray-800">{formatDate(updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end items-center space-x-3 z-10">
                <button
                  type="button"
                  onClick={() => setEditingLab(selectedLab)}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all shadow-xs flex items-center"
                >
                  <Pencil className="h-4 w-4 mr-1.5" />
                  Edit Lab
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLab(null)}
                  className="px-5 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-white hover:border-gray-400 transition-colors shadow-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit Lab Modal */}
      {editingLab && (
        <EditLabModal
          isOpen={Boolean(editingLab)}
          lab={editingLab}
          onClose={() => setEditingLab(null)}
          onLabUpdated={(updatedLab) => {
            setLabs(prev => prev.map(l => (l._id === updatedLab._id || l.id === updatedLab.id) ? { ...l, ...updatedLab } : l));
            if (selectedLab && (selectedLab._id === updatedLab._id || selectedLab.id === updatedLab.id)) {
              setSelectedLab(updatedLab);
            }
            fetchLabs();
          }}
        />
      )}

      {/* Delete Laboratory Confirmation Modal */}
      {showDeleteModal && labToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 relative animate-in zoom-in-95 duration-150">
            <button
              onClick={closeDeleteModal}
              disabled={isDeletingLab}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-rose-100 text-rose-600">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Delete Laboratory?
                </h3>
                <p className="text-xs text-gray-500">
                  Permanent deletion confirmation
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Are you sure you want to delete <strong className="text-gray-900">{formatTitleCase(labToDelete.labName || labToDelete.lab_name || 'this laboratory')}</strong>? This action cannot be undone.
            </p>

            {deleteLabError && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">
                  {deleteLabError}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeletingLab}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteLab}
                disabled={isDeletingLab}
                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md flex items-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {isDeletingLab ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Deleting Lab...
                  </>
                ) : (
                  'Delete Lab'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
