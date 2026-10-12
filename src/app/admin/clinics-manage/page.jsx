'use client';
import { API_BASE_URL, getAuthHeaders } from '@/utils/api';
import { validatePhoneNumber, handlePhoneKeyDown } from '@/utils/phoneValidation';
import { formatTitleCase } from '@/utils/nameFormatting';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Plus, Search, ChevronDown, ChevronUp, Filter, X, Eye, Check, XCircle, Building2, Clock, CheckCircle, ExternalLink, FileText, MapPin, Stethoscope } from 'lucide-react';
import EditClinicModal from './EditClinicModal';
import ClinicDetailsModal from './ClinicDetailsModal';
import AdminDoctorDetailsModal from './AdminDoctorDetailsModal';
import { supabase } from '@/lib/supabase';

export default function ClinicsManage() {
  const router = useRouter();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const [filters, setFilters] = useState({
    status: 'all',
    location: 'all',
    approved: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showAddSuccess, setShowAddSuccess] = useState(false);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [showApprovalSuccess, setShowApprovalSuccess] = useState(false);
  const [rejectionReason, setRejectionReason] = useState({
    title: '',
    description: ''
  });

  // Associated Doctors in Clinic Details state (Read-Only)
  const [clinicDoctors, setClinicDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [selectedDoctorForView, setSelectedDoctorForView] = useState(null);

  // Clinic Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clinicToDelete, setClinicToDelete] = useState(null);
  const [isDeletingClinic, setIsDeletingClinic] = useState(false);
  const [deleteClinicError, setDeleteClinicError] = useState('');
  const [newClinic, setNewClinic] = useState({
    clinicName: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    status: 'pending',
    approved: false,
    clinicType: '',
    specialties: []
  });

  const sortClinicsByNewest = (list) => {
    return [...list].sort((a, b) => {
      if (a.isNewlyCreated) return -1;
      if (b.isNewlyCreated) return 1;

      const dateA = new Date(a.created_at || a.createdAt || a.registrationDate || 0).getTime();
      const dateB = new Date(b.created_at || b.createdAt || b.registrationDate || 0).getTime();
      if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) {
        return dateB - dateA;
      }

      const idA = Number(a._id || a.id);
      const idB = Number(b._id || b.id);
      if (!isNaN(idA) && !isNaN(idB) && idA !== idB) {
        return idB - idA;
      }

      return 0;
    });
  };

  const fetchClinics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/clinic/fetch-all-clinics`, {
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        throw new Error('Failed to fetch clinics');
      }

      const responseData = await res.json();
      if (responseData.success) {
        let list = responseData.data.clinics || [];
        if (typeof window !== 'undefined') {
          const stored = sessionStorage.getItem('newlyCreatedClinic');
          if (stored) {
            try {
              const newClinic = JSON.parse(stored);
              list = list.filter(c => {
                const cId = c._id || c.id;
                const nId = newClinic._id || newClinic.id;
                if (cId && nId && String(cId) === String(nId)) return false;
                const cName = c.clinicName || c.clinic_name;
                const nName = newClinic.clinicName || newClinic.clinic_name;
                if (cName && nName && cName.toLowerCase().trim() === nName.toLowerCase().trim()) return false;
                return true;
              });
              list = [{ ...newClinic, isNewlyCreated: true }, ...list];
            } catch (e) {
              console.error('Error parsing newlyCreatedClinic:', e);
            }
          }
        }
        setClinics(sortClinicsByNewest(list));
      } else {
        throw new Error(responseData.message || 'Failed to fetch clinics');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('added') === 'true') {
        setShowAddSuccess(true);

        const stored = sessionStorage.getItem('newlyCreatedClinic');
        if (stored) {
          try {
            const newClinic = JSON.parse(stored);
            setClinics(prev => {
              const filtered = prev.filter(c => {
                const cId = c._id || c.id;
                const nId = newClinic._id || newClinic.id;
                if (cId && nId && String(cId) === String(nId)) return false;
                const cName = c.clinicName || c.clinic_name;
                const nName = newClinic.clinicName || newClinic.clinic_name;
                if (cName && nName && cName.toLowerCase().trim() === nName.toLowerCase().trim()) return false;
                return true;
              });
              return [{ ...newClinic, isNewlyCreated: true }, ...filtered];
            });
          } catch (e) {
            console.error('Error prepending newlyCreatedClinic on added param:', e);
          }
        }

        fetchClinics();

        const timer = setTimeout(() => {
          setShowAddSuccess(false);
          router.replace('/admin/clinics-manage');
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [router]);

  // Lock outer page scrolling while Clinic Details modal is open and restore when closed
  useEffect(() => {
    if (showViewModal || showEditModal) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const mainContainer = document.querySelector('main');
      const originalMainOverflow = mainContainer ? mainContainer.style.overflow : '';
      const originalMainOverflowY = mainContainer ? mainContainer.style.overflowY : '';

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      if (mainContainer) {
        mainContainer.style.overflow = 'hidden';
        mainContainer.style.overflowY = 'hidden';
      }

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        if (mainContainer) {
          mainContainer.style.overflow = originalMainOverflow;
          mainContainer.style.overflowY = originalMainOverflowY;
        }
      };
    }
  }, [showViewModal, showEditModal]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedClinics = [...clinics].sort((a, b) => {
    if (a.isNewlyCreated) return -1;
    if (b.isNewlyCreated) return 1;

    if (sortConfig.key) {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
    }

    const dateA = new Date(a.created_at || a.createdAt || a.registrationDate || 0).getTime();
    const dateB = new Date(b.created_at || b.createdAt || b.registrationDate || 0).getTime();
    if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) {
      return dateB - dateA;
    }

    const idA = Number(a._id || a.id);
    const idB = Number(b._id || b.id);
    if (!isNaN(idA) && !isNaN(idB) && idA !== idB) {
      return idB - idA;
    }

    return 0;
  });

  const filteredClinics = sortedClinics.filter(clinic => {
    const cName = clinic.clinicName || clinic.clinic_name || '';
    const cCity = clinic.city || '';
    const cPhone = clinic.phone || '';

    const matchesSearch = cName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cPhone.includes(searchTerm);

    const matchesStatus = filters.status === 'all' || clinic.status === filters.status;
    const matchesLocation = filters.location === 'all' || clinic.city === filters.location;
    const matchesApproval = filters.approved === 'all' ||
      (filters.approved === 'approved' && clinic.approved) ||
      (filters.approved === 'pending' && !clinic.approved);

    return matchesSearch && matchesStatus && matchesLocation && matchesApproval;
  });

  const statusClasses = {
    active: 'bg-emerald-100 text-emerald-800',
    maintenance: 'bg-amber-100 text-amber-800',
    inactive: 'bg-rose-100 text-rose-800',
    pending: 'bg-blue-100 text-blue-800',
    rejected: 'bg-gray-100 text-gray-800'
  };

  const handleAddClinic = (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setTimeout(() => {
        const newClinicWithId = {
          ...newClinic,
          _id: (clinics.length + 1).toString(),
          registrationDate: new Date().toISOString().split('T')[0],
          isNewlyCreated: true
        };
        setClinics([newClinicWithId, ...clinics]);
        setShowAddModal(false);
        setNewClinic({
          clinicName: '',
          address: '',
          city: '',
          phone: '',
          email: '',
          status: 'pending',
          approved: false,
          clinicType: '',
          specialties: []
        });
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleClinicUpdated = (updatedClinic) => {
    const clinicId = updatedClinic._id || updatedClinic.id;
    setSelectedClinic(prev => ({
      ...(prev || {}),
      ...updatedClinic
    }));
    setClinics(prev => prev.map(c => {
      const cId = c._id || c.id;
      if (cId === clinicId) {
        return {
          ...c,
          ...updatedClinic
        };
      }
      return c;
    }));
    setShowUpdateSuccess(true);
  };

  // Fetch doctors belonging exclusively to a specific clinic
  const fetchDoctorsForClinic = async (clinicId) => {
    if (!clinicId) {
      setClinicDoctors([]);
      return;
    }
    try {
      setDoctorsLoading(true);
      // 1. Try backend/API endpoint
      const res = await fetch(`${API_BASE_URL}/api/v1/clinic/fetch-doctor-clinicId/${clinicId}`, {
        headers: getAuthHeaders()
      }).catch(() => null);

      if (res && res.ok) {
        const responseData = await res.json().catch(() => ({}));
        if (responseData.success && Array.isArray(responseData.data?.doctors)) {
          setClinicDoctors(responseData.data.doctors);
          return;
        }
      }

      // 2. Direct Supabase query fallback
      const { data, error: sbErr } = await supabase
        .from('doctors')
        .select('*')
        .eq('clinic_id', clinicId);

      if (!sbErr && Array.isArray(data)) {
        setClinicDoctors(data);
      } else {
        setClinicDoctors([]);
      }
    } catch (err) {
      console.warn('Error fetching doctors for clinic:', err);
      try {
        const { data } = await supabase.from('doctors').select('*').eq('clinic_id', clinicId);
        setClinicDoctors(Array.isArray(data) ? data : []);
      } catch (_) {
        setClinicDoctors([]);
      }
    } finally {
      setDoctorsLoading(false);
    }
  };

  const openDeleteModal = (clinic) => {
    setClinicToDelete(clinic);
    setDeleteClinicError('');
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (isDeletingClinic) return;
    setShowDeleteModal(false);
    setClinicToDelete(null);
    setDeleteClinicError('');
  };

  const handleConfirmDeleteClinic = async () => {
    if (!clinicToDelete) return;
    const clinicId = clinicToDelete._id || clinicToDelete.id;
    if (!clinicId) return;

    try {
      setIsDeletingClinic(true);
      setDeleteClinicError('');

      // 1. Call API endpoint
      let res = await fetch(`${API_BASE_URL}/api/v1/clinic/delete/${clinicId}`, {
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
          const localRes = await fetch(`/api/v1/clinic/delete/${clinicId}`, {
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
        const [docs, patients, appts, orders] = await Promise.all([
          supabase.from('doctors').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId),
          supabase.from('patients').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId),
          supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId),
          supabase.from('lab_orders').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId)
        ]);

        const reasons = [];
        if (docs.count > 0) reasons.push(`${docs.count} assigned doctor(s)`);
        if (patients.count > 0) reasons.push(`${patients.count} patient record(s)`);
        if (appts.count > 0) reasons.push(`${appts.count} appointment(s)`);
        if (orders.count > 0) reasons.push(`${orders.count} lab order(s)`);

        if (reasons.length > 0) {
          setDeleteClinicError(`Cannot delete clinic because it has associated ${reasons.join(', ')}. Please reassign or remove these records first.`);
          setIsDeletingClinic(false);
          return;
        }

        const { error: sbDeleteErr } = await supabase.from('clinics').delete().eq('id', clinicId);
        if (sbDeleteErr) {
          throw new Error(sbDeleteErr.message || 'Failed to delete clinic');
        }
        data = { success: true };
      }

      if (data && data.success === false) {
        setDeleteClinicError(data.message || data.error || 'Cannot delete clinic due to dependencies.');
        return;
      }

      // Remove from session storage if newly created
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('newlyCreatedClinic');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (String(parsed.id || parsed._id) === String(clinicId)) {
              sessionStorage.removeItem('newlyCreatedClinic');
            }
          } catch (_) {}
        }
      }

      setShowDeleteModal(false);
      setClinicToDelete(null);
      await fetchClinics();
    } catch (err) {
      console.error('Delete clinic error:', err);
      setDeleteClinicError(err.message || 'An unexpected error occurred while deleting the clinic.');
    } finally {
      setIsDeletingClinic(false);
    }
  };

  const handleViewClinic = async (clinic) => {
    setSelectedClinic(clinic);
    setClinicDoctors([]);
    setShowViewModal(true);

    const clinicId = clinic.id || clinic._id;
    if (clinicId) {
      fetchDoctorsForClinic(clinicId);
      try {
        setDetailsLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/v1/clinic/fetch-by-id/${clinicId}`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const responseData = await res.json();
          if (responseData.success && responseData.data?.clinic) {
            setSelectedClinic(prev => ({
              ...prev,
              ...responseData.data.clinic
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching clinic details:', err);
      } finally {
        setDetailsLoading(false);
      }
    }
  };

  // const handleApproveClinic = (id) => {
  //   setLoading(true);
  //   setTimeout(() => {
  //     setClinics(clinics.map(clinic => 
  //       clinic._id === id ? { ...clinic, approved: true, status: 'active' } : clinic
  //     ));
  //     setLoading(false);
  //     setShowApprovalSuccess(true);
  //   }, 500);
  // };
  const handleApproveClinic = async (id) => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token') || user.token || '';
      const response = await fetch(`${API_BASE_URL}/api/v1/clinic/update-status/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'active',

        }),
      });

      const responseData = await response.json();
      if (!responseData.success) {
        throw new Error(responseData.message || 'Failed to approve clinic');
      }

      // Update local state with the updated clinic
      setClinics(clinics.map(clinic =>
        clinic._id === id ? { ...clinic, approved: true, status: 'active' } : clinic
      ));

      setShowApprovalSuccess(true);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleRejectClinic = async () => {
    if (!rejectionReason.description) {
      alert('Please provide a description for the rejection reason');
      return;
    }

    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token') || user.token || '';
      const response = await fetch(`${API_BASE_URL}/api/v1/clinic/update-status/${selectedClinic._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({

          status: 'rejected',

          rejectionReason: rejectionReason.description
        }),
      });

      const responseData = await response.json();
      if (!responseData.success) {
        throw new Error(responseData.message || 'Failed to reject clinic');
      }

      // Update local state with the updated clinic
      setClinics(clinics.map(clinic =>
        clinic._id === selectedClinic._id ? {
          ...clinic,
          status: 'rejected',
          approved: false,
          rejectionReason: rejectionReason.description
        } : clinic
      ));

      setShowRejectModal(false);
      setRejectionReason({ title: '', description: '' });
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  // const handleRejectClinic = () => {
  //   if (!rejectionReason.description) {
  //     alert('Please provide a description for the rejection reason');
  //     return;
  //   }

  //   setLoading(true);
  //   setTimeout(() => {
  //     setClinics(clinics.map(clinic => 
  //       clinic._id === selectedClinic._id ? { ...clinic, status: 'rejected', approved: false } : clinic
  //     ));
  //     setShowRejectModal(false);
  //     setRejectionReason({ title: '', description: '' });
  //     setLoading(false);
  //   }, 500);
  // };

  const openRejectModal = (clinic) => {
    setSelectedClinic(clinic);
    setShowRejectModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">Clinic Management</h1>
              <p className="text-sm text-gray-500">Manage all affiliated clinics and their details</p>
            </div>
          </div>
        </div>
        <Link
          href="/admin/clinics/add"
          className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Clinic
        </Link>
      </div>

      {/* Add Clinic Success Message */}
      {showAddSuccess && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-lg flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-emerald-600 mr-3 flex-shrink-0" />
            <p className="text-sm font-medium text-emerald-800">
              New clinic has been successfully created and approved!
            </p>
          </div>
          <button
            onClick={() => setShowAddSuccess(false)}
            className="text-emerald-600 hover:text-emerald-800 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Update Clinic Success Message */}
      {showUpdateSuccess && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-lg flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-emerald-600 mr-3 flex-shrink-0" />
            <p className="text-sm font-medium text-emerald-800">
              Clinic details updated successfully!
            </p>
          </div>
          <button
            onClick={() => setShowUpdateSuccess(false)}
            className="text-emerald-600 hover:text-emerald-800 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search clinics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"


            />
          </div>


        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="all">All Locations</option>
                {[...new Set(clinics.map(clinic => clinic.city))].map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Approval</label>
              <select
                value={filters.approved}
                onChange={(e) => setFilters({ ...filters, approved: e.target.value })}
                className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="all">All</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending Approval</option>
              </select>
            </div>

            <div className="flex items-end col-span-3">
              <button
                onClick={() => setFilters({ status: 'all', location: 'all', approved: 'all' })}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards Section */}
{/* Interactive Stats Cards Section */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Total Clinics Card - Shows all clinics, removes any status filter */}
  <div 
    className={`bg-white rounded-lg shadow-sm border border-gray-100 p-4 cursor-pointer transition-all hover:shadow-md ${
      filters.status === 'all' ? 'ring-2 ring-indigo-500' : ''
    }`}
    onClick={() => setFilters({
      ...filters,
      status: 'all' // Show all statuses
    })}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">Total Clinics</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{clinics.length}</p>
      </div>
      <div className="p-3 rounded-lg bg-indigo-50">
        <Building2 className="h-6 w-6 text-indigo-600" />
      </div>
    </div>
   
  </div>

  {/* Pending Approval Card - Toggles pending filter */}
  <div 
    className={`bg-white rounded-lg shadow-sm border border-gray-100 p-4 cursor-pointer transition-all hover:shadow-md ${
      filters.status === 'pending' ? 'ring-2 ring-amber-500' : ''
    }`}
    onClick={() => setFilters({
      ...filters,
      status: filters.status === 'pending' ? 'all' : 'pending'
    })}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">Pending Approval</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">
          {clinics.filter(clinic => clinic.status === 'pending').length}
        </p>
      </div>
      <div className="p-3 rounded-lg bg-amber-50">
        <Clock className="h-6 w-6 text-amber-600" />
      </div>
    </div>
    
  </div>

  {/* Active Clinics Card - Toggles active filter */}
  <div 
    className={`bg-white rounded-lg shadow-sm border border-gray-100 p-4 cursor-pointer transition-all hover:shadow-md ${
      filters.status === 'active' ? 'ring-2 ring-emerald-500' : ''
    }`}
    onClick={() => setFilters({
      ...filters,
      status: filters.status === 'active' ? 'all' : 'active'
    })}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">Active Clinics</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">
          {clinics.filter(clinic => clinic.status === 'active').length}
        </p>
      </div>
      <div className="p-3 rounded-lg bg-emerald-50">
        <CheckCircle className="h-6 w-6 text-emerald-600" />
      </div>
    </div>
    
  </div>

  {/* Rejected Card - Toggles rejected filter */}
  <div 
    className={`bg-white rounded-lg shadow-sm border border-gray-100 p-4 cursor-pointer transition-all hover:shadow-md ${
      filters.status === 'rejected' ? 'ring-2 ring-rose-500' : ''
    }`}
    onClick={() => setFilters({
      ...filters,
      status: filters.status === 'rejected' ? 'all' : 'rejected'
    })}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">Rejected</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">
          {clinics.filter(clinic => clinic.status === 'rejected').length}
        </p>
      </div>
      <div className="p-3 rounded-lg bg-rose-50">
        <XCircle className="h-6 w-6 text-rose-600" />
      </div>
    </div>
    
  </div>
</div>

      {/* Interactive Stats Cards Section */}
     

      {/* Clinic Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('clinicName')}
                  >
                    <div className="flex items-center">
                      Clinic Name
                      {sortConfig.key === 'clinicName' && (
                        sortConfig.direction === 'asc' ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Location
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Contact
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      {sortConfig.key === 'status' && (
                        sortConfig.direction === 'asc' ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Approval
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClinics.length > 0 ? (
                  filteredClinics.map((clinic, index) => (
                    <tr key={clinic._id || clinic.id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {(() => {
                            const clinicLogo = clinic?.logo || clinic?.logo_url || clinic?.logoUrl;
                            const formattedClinicName = formatTitleCase(clinic?.clinicName || clinic?.clinic_name || 'Clinic');
                            const initial = (formattedClinicName || 'C').charAt(0).toUpperCase();
                            return (
                              <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center">
                                {clinicLogo ? (
                                  <img
                                    src={clinicLogo}
                                    alt={formattedClinicName}
                                    className="h-10 w-10 rounded-full object-cover border border-indigo-200 shadow-xs"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center border border-indigo-200 shadow-xs">
                                    <span className="text-indigo-600 font-medium">{initial}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{formatTitleCase(clinic.clinicName || clinic.clinic_name)}</div>
                            <div className="text-sm text-gray-500">{clinic.address}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{clinic.city}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{clinic.phone}</div>
                        <div className="text-sm text-gray-500">{clinic.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">{clinic.clinicType || clinic.clinic_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[clinic.status] || 'bg-gray-100 text-gray-800'}`}>
                          {clinic.status?.charAt(0).toUpperCase() + clinic.status?.slice(1) || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {clinic.status === 'pending' ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveClinic(clinic._id)}
                              className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors"
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openRejectModal(clinic)}
                              className="p-1.5 rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors"
                              title="Reject"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : clinic.approved ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            Approved
                          </span>
                        ) : clinic.status === 'rejected' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                            Rejected
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewClinic(clinic)}
                            className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedClinic(clinic);
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Edit clinic"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(clinic)}
                            className="text-rose-600 hover:text-rose-900 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Delete clinic"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      No clinics found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>



      {/* View Clinic Modal */}
      {showViewModal && selectedClinic && (
        <ClinicDetailsModal
          isOpen={showViewModal}
          clinic={selectedClinic}
          onClose={() => setShowViewModal(false)}
          onEditClinic={(clinic) => {
            setSelectedClinic(clinic);
            setShowEditModal(true);
          }}
          onApproveClinic={handleApproveClinic}
          isApproving={loading}
        />
      )}

      {/* Edit Clinic Modal */}
      {showEditModal && selectedClinic && (
        <EditClinicModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          clinic={selectedClinic}
          onClinicUpdated={handleClinicUpdated}
        />
      )}

      {/* Delete Clinic Confirmation Modal */}
      {showDeleteModal && clinicToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 relative animate-in zoom-in-95 duration-150">
            <button
              onClick={closeDeleteModal}
              disabled={isDeletingClinic}
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
                  Delete Clinic?
                </h3>
                <p className="text-xs text-gray-500">
                  Permanent deletion confirmation
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Are you sure you want to delete <strong className="text-gray-900">{formatTitleCase(clinicToDelete.clinicName || clinicToDelete.clinic_name || 'this clinic')}</strong>? This action cannot be undone.
            </p>

            {deleteClinicError && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">
                  {deleteClinicError}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeletingClinic}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteClinic}
                disabled={isDeletingClinic}
                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md flex items-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {isDeletingClinic ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Deleting Clinic...
                  </>
                ) : (
                  'Delete Clinic'
                )}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Reject Clinic Modal */}
      {showRejectModal && selectedClinic && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto flex flex-col">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Reject Clinic</h2>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason({ title: '', description: '' });
                  }}
                  className="text-gray-400 hover:text-gray-500 transition-colors p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <XCircle className="h-5 w-5 text-rose-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-rose-700">
                        You are about to reject <span className="font-semibold">{formatTitleCase(selectedClinic.clinicName || selectedClinic.clinic_name)}</span>.
                        Please provide a reason for rejection.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Rejection</label>
                    <textarea
                      value={rejectionReason.description}
                      onChange={(e) => setRejectionReason({ ...rejectionReason, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows="4"
                      placeholder="Provide specific details about why this clinic is being rejected..."
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason({ title: '', description: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectClinic}
                  className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 rounded-lg text-sm font-medium text-white hover:from-rose-700 hover:to-red-700 transition-all shadow-md"
                  disabled={loading}
                >
                  {loading ? 'Rejecting...' : 'Reject Clinic'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Success Modal */}
      {showApprovalSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
              <Check className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Approved Successfully!</h3>
            <p className="text-sm text-gray-500 mb-6">
              The clinic has been approved and is now active.
            </p>
            <button
              onClick={() => setShowApprovalSuccess(false)}
              className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
