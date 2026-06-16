'use client';
import { API_BASE_URL } from '@/utils/api';

import { useState, useEffect } from 'react'
import { Pencil, Trash2, Plus, Search, ChevronDown, ChevronUp, Filter, X, Eye, Check, XCircle, Building2, Clock, CheckCircle } from 'lucide-react'

export default function ClinicsManage() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'clinicName', direction: 'asc' });
  const [filters, setFilters] = useState({
    status: 'all',
    location: 'all',
    approved: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [showApprovalSuccess, setShowApprovalSuccess] = useState(false);
  const [rejectionReason, setRejectionReason] = useState({
    title: '',
    description: ''
  });
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

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        setLoading(true)
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = localStorage.getItem('token') || user.token || '';
        const res = await fetch(`${API_BASE_URL}/api/v1/clinic/fetch-all-clinics`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!res.ok) {
          throw new Error('Failed to fetch clinics')
        }

        const responseData = await res.json()
        if (responseData.success) {
          setClinics(responseData.data.clinics || [])
        } else {
          throw new Error(responseData.message || 'Failed to fetch clinics')
        }
      } catch (err) {
        console.error('Error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchClinics()
  }, [])

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedClinics = [...clinics].sort((a, b) => {
    const aValue = a[sortConfig.key] || '';
    const bValue = b[sortConfig.key] || '';

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const filteredClinics = sortedClinics.filter(clinic => {
    const matchesSearch = clinic.clinicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.phone.includes(searchTerm);

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
          registrationDate: new Date().toISOString().split('T')[0]
        };
        setClinics([...clinics, newClinicWithId]);
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

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this clinic?')) {
      setLoading(true);
      setTimeout(() => {
        setClinics(clinics.filter(clinic => clinic._id !== id));
        setLoading(false);
      }, 500);
    }
  };

  const handleViewClinic = (clinic) => {
    setSelectedClinic(clinic);
    setShowViewModal(true);
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
          <h1 className="text-2xl font-bold text-gray-900">Clinic Management</h1>
          <p className="text-sm text-gray-500">Manage all affiliated clinics and their details</p>
        </div>
        {/* <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Clinic
        </button> */}
      </div>

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
                  filteredClinics.map((clinic) => (
                    <tr key={clinic._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-medium">{clinic.clinicName.charAt(0)}</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{clinic.clinicName}</div>
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
                        <div className="text-sm text-gray-900 capitalize">{clinic.clinicType}</div>
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
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleViewClinic(clinic)}
                            className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(clinic._id)}
                            className="text-rose-600 hover:text-rose-900 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Delete"
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

      {/* Add Clinic Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add New Clinic</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-500 transition-colors p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleAddClinic} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
                    <input
                      type="text"
                      value={newClinic.clinicName}
                      onChange={(e) => setNewClinic({ ...newClinic, clinicName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      required
                      placeholder="Enter clinic name"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={newClinic.city}
                        onChange={(e) => setNewClinic({ ...newClinic, city: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                        placeholder="Enter city"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={newClinic.phone}
                        onChange={(e) => setNewClinic({ ...newClinic, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={newClinic.address}
                      onChange={(e) => setNewClinic({ ...newClinic, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                      placeholder="Enter full address"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={newClinic.email}
                        onChange={(e) => setNewClinic({ ...newClinic, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                        placeholder="Enter email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Type</label>
                      <input
                        type="text"
                        value={newClinic.clinicType}
                        onChange={(e) => setNewClinic({ ...newClinic, clinicType: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter clinic type"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-sm font-medium text-white hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Clinic'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Clinic Modal */}
      {showViewModal && selectedClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Clinic Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-500 transition-colors p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Header with basic info */}
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center">
                      <span className="text-indigo-600 text-xl font-bold">{selectedClinic.clinicName.charAt(0)}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{selectedClinic.clinicName}</h3>
                    <div className="mt-1 flex items-center">
                      <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusClasses[selectedClinic.status]}`}>
                        {selectedClinic.status?.charAt(0).toUpperCase() + selectedClinic.status?.slice(1) || 'Unknown'}
                      </span>
                      {selectedClinic.approved && (
                        <span className="ml-2 px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">
                          Approved
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-500">{selectedClinic.address}, {selectedClinic.city}</p>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Contact Information</h4>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-900">{selectedClinic.phone}</p>
                        <p className="text-sm text-gray-900">{selectedClinic.email}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Clinic Type</h4>
                      <p className="mt-2 text-sm text-gray-900 capitalize">{selectedClinic.clinicType}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Registration Date</h4>
                      <p className="mt-2 text-sm text-gray-900">{selectedClinic.createdAt}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Specialties</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedClinic.specialties.length > 0 ? (
                          selectedClinic.specialties.map((specialty, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {specialty}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">No specialties listed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documents section */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-medium text-gray-500">Documents</h4>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="text-xs font-medium text-gray-500 mb-2">License Document</h5>
                      {selectedClinic.licenseDocumentUrl ? (
                        <img
                          src={selectedClinic.licenseDocumentUrl}
                          alt="License document"
                          className="w-full h-auto rounded border border-gray-200"
                        />
                      ) : (
                        <div className="text-sm text-gray-500">No license document uploaded</div>
                      )}
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="text-xs font-medium text-gray-500 mb-2">GST Document</h5>
                      {selectedClinic.gstDocumentUrl ? (
                        <img
                          src={selectedClinic.gstDocumentUrl}
                          alt="GST document"
                          className="w-full h-auto rounded border border-gray-200"
                        />
                      ) : (
                        <div className="text-sm text-gray-500">No GST document uploaded</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {!selectedClinic.approved && selectedClinic.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => handleApproveClinic(selectedClinic._id)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 rounded-lg text-sm font-medium text-white hover:from-emerald-700 hover:to-green-700 transition-all shadow-md"
                    disabled={loading}
                  >
                    {loading ? 'Approving...' : 'Approve Clinic'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Clinic Modal */}
      {showRejectModal && selectedClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
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
                        You are about to reject <span className="font-semibold">{selectedClinic.clinicName}</span>.
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
