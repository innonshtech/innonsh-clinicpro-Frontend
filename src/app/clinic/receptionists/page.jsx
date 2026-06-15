'use client';
import { API_BASE_URL } from '@/utils/api';
import { useState, useEffect } from 'react';
import { FiSearch, FiUserPlus, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight, FiX, FiEye, FiEyeOff, FiAlertCircle, FiRefreshCw, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { MdOutlineVerified, MdOutlinePending } from 'react-icons/md';

const ReceptionistManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentReceptionist, setCurrentReceptionist] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [receptionists, setReceptionists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [receptionistToDelete, setReceptionistToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [Id, setId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      setError('User not authenticated. Please login again.');
      setLoading(false);
      return;
    }

    try {
      const userdata = JSON.parse(user);
      const id = userdata?.id;
      if (!id) {
        throw new Error('Invalid user data');
      }
      setId(id);
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
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
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

  const filteredReceptionists = receptionists.filter(receptionist => {
    const matchesSearch = `${receptionist.firstName || ''} ${receptionist.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (receptionist.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || receptionist.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredReceptionists.length / itemsPerPage);
  const paginatedReceptionists = filteredReceptionists.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openAddModal = () => {
    setCurrentReceptionist(null);
    setIsModalOpen(true);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError('');
    setSuccessMessage('');
  };

  const openEditModal = (receptionist) => {
    setCurrentReceptionist(receptionist);
    setIsModalOpen(true);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError('');
    setSuccessMessage('');
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
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.message || 'Failed to delete receptionist');
      }

      setReceptionists(prev => prev.filter(r => r._id !== id));
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
    setError('');
    setSuccessMessage('');

    const formData = new FormData(e.target);
    const data = {
      firstName: formData.get('firstName')?.trim(),
      lastName: formData.get('lastName')?.trim(),
      email: formData.get('email')?.trim(),
      phone: formData.get('phone')?.trim(),
      status: formData.get('status'),
      clinicId: Id,
    };

    // Validation
    if (!data.firstName || !data.lastName || !data.email || !data.phone) {
      setError('All required fields must be filled');
      setSubmitLoading(false);
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(data.email)) {
      setError('Please enter a valid email address');
      setSubmitLoading(false);
      return;
    }

    // Handle password for new receptionists
    if (!currentReceptionist) {
      const password = formData.get('password');
      const confirmPassword = formData.get('confirmPassword');
      
      if (!password || password.length < 8) {
        setError('Password must be at least 8 characters long');
        setSubmitLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setSubmitLoading(false);
        return;
      }
      data.password = password;
    } else {
      // Handle password change for existing receptionists
      const newPassword = formData.get('newPassword');
      if (newPassword && newPassword.length > 0) {
        if (newPassword.length < 8) {
          setError('New password must be at least 8 characters long');
          setSubmitLoading(false);
          return;
        }
        data.password = newPassword;
      }
    }

    try {
      let response;
      if (currentReceptionist) {
        // Update existing receptionist
        response = await fetch(`${API_BASE_URL}/api/v1/clinic/update-receptionist/${currentReceptionist._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(data),
        });
      } else {
        // Create new receptionist
        response = await fetch(`${API_BASE_URL}/api/v1/clinic/add-receptionist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(data),
        });
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.message || 'Failed to save receptionist');
      }

      const savedReceptionist = responseData.data.staff || responseData.data.receptionist;

      if (currentReceptionist) {
        setReceptionists(prev => 
          prev.map(r => r._id === currentReceptionist._id ? savedReceptionist : r)
        );
        setSuccessMessage('Receptionist updated successfully');
      } else {
        setReceptionists(prev => [...prev, savedReceptionist]);
        setSuccessMessage('Receptionist created successfully');
      }

      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMessage('');
      }, 1500);
    } catch (err) {
      console.error('Error saving receptionist:', err);
      setError(err.message || 'An error occurred while saving. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Clear messages after timeout
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError('');
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Receptionist Management</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage your clinic's receptionists</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors w-full md:w-auto justify-center"
        >
          <FiUserPlus size={18} />
          Add New Receptionist
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
          <FiAlertCircle className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start gap-2">
          <FiCheckCircle className="flex-shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-2xl">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
            }}
          />
        </div>
        <select
          className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setCurrentPage(1); // Reset to first page when filtering
          }}
        >
          <option value="all">All Receptionists</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Receptionists Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <FiRefreshCw  className="animate-spin h-8 w-8 text-indigo-600" />
            <span className="ml-2">Loading receptionists...</span>
          </div>
        ) : error && receptionists.length === 0 ? (
          <div className="p-8 text-center">
            <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Unable to load receptionists</h3>
            <p className="mt-1 text-gray-500">{error}</p>
            <button
              onClick={() => fetchReceptionists(Id)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
            >
              <FiRefreshCw className="mr-2 h-4 w-4" />
              Retry
            </button>
          </div>
        ) : receptionists.length === 0 ? (
          <div className="p-8 text-center">
            <FiUserPlus className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No receptionists found</h3>
            <p className="mt-1 text-gray-500">Get started by adding a new receptionist.</p>
            <button
              onClick={openAddModal}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
            >
              <FiUserPlus className="mr-2 h-4 w-4" />
              Add Receptionist
            </button>
          </div>
        ) : filteredReceptionists.length === 0 ? (
          <div className="p-8 text-center">
            <FiSearch className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No matching receptionists</h3>
            <p className="mt-1 text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedReceptionists.map((receptionist) => (
                  <tr key={receptionist._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                          {receptionist.firstName?.charAt(0)}{receptionist.lastName?.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {receptionist.firstName} {receptionist.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {receptionist.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {receptionist.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {receptionist.status === 'active' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 items-center gap-1">
                          <MdOutlineVerified size={14} /> Active
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 items-center gap-1">
                          <MdOutlinePending size={14} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(receptionist)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                        disabled={deleteLoading}
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(receptionist._id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={deleteLoading}
                      >
                        {deleteLoading ? (
                          <FiRefreshCw className="animate-spin h-4 w-4" />
                        ) : (
                          <FiTrash2 size={18} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredReceptionists.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4">
          <div className="text-sm text-gray-500">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredReceptionists.length)}-
            {Math.min(currentPage * itemsPerPage, filteredReceptionists.length)} of {filteredReceptionists.length} receptionists
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiChevronLeft size={18} />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 rounded-lg border ${
                  currentPage === i + 1
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">
                {currentReceptionist ? 'Edit Receptionist' : 'Add New Receptionist'}
              </h3>
              <button 
                onClick={() => !submitLoading && setIsModalOpen(false)}
                className={`text-gray-400 hover:text-gray-500 ${submitLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={submitLoading}
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
                  <FiAlertCircle className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {successMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start gap-2">
                  <FiCheckCircle className="flex-shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        defaultValue={currentReceptionist?.firstName || ''}
                        disabled={submitLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        defaultValue={currentReceptionist?.lastName || ''}
                        disabled={submitLoading}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      defaultValue={currentReceptionist?.email || ''}
                      disabled={submitLoading || !!currentReceptionist}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      defaultValue={currentReceptionist?.phone || ''}
                      disabled={submitLoading}
                    />
                  </div>

                  {/* Password fields */}
                  {!currentReceptionist ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            required
                            minLength={8}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                            placeholder="At least 8 characters"
                            disabled={submitLoading}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={submitLoading}
                          >
                            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            required
                            minLength={8}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                            placeholder="Confirm your password"
                            disabled={submitLoading}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            disabled={submitLoading}
                          >
                            {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password (optional)
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="newPassword"
                          minLength={8}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                          placeholder="Leave blank to keep current"
                          disabled={submitLoading}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={submitLoading}
                        >
                          {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum 8 characters required if changing password
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      defaultValue={currentReceptionist?.status || 'active'}
                      disabled={submitLoading}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={submitLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      disabled={submitLoading}
                    >
                      {submitLoading && (
                        <FiRefreshCw className="animate-spin h-4 w-4" />
                      )}
                      {currentReceptionist ? 'Update' : 'Create'} Receptionist
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors z-10"
            >
              <FiX className="h-5 w-5" />
            </button>
            <div className="p-6 text-center">
              <FiTrash2 className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900">Delete Receptionist?</h3>
              <p className="text-gray-500 my-2">This action is permanent and cannot be undone.</p>
              <div className="flex justify-center gap-3 mt-6">
                <button 
                  onClick={() => setShowDeleteConfirm(false)} 
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium text-gray-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete} 
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2"
                  disabled={deleteLoading}
                >
                  {deleteLoading && <FiRefreshCw className="animate-spin h-4 w-4" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistManagement;
