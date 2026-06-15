'use client';
import { API_BASE_URL } from '@/utils/api';

           import { useState, useEffect } from 'react';
import { FiSearch, FiUserPlus, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight, FiX, FiEye, FiEyeOff } from 'react-icons/fi';
import { MdOutlineVerified, MdOutlinePending } from 'react-icons/md';
import { User, X, Eye, EyeOff } from 'lucide-react';

const ReceptionistManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentReceptionist, setCurrentReceptionist] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [receptionists, setReceptionists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
const[doctorId,setID]=useState();
  const [clinicId, setClinicId] = useState(null);

  // Fetch receptionists on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const docData = JSON.parse(savedUser);
      setID(docData.id);
      fetchDoctorProfile(docData.id);
    }
  }, []);

  useEffect(() => {
    if (clinicId) {
      fetchReceptionists();
    }
  }, [clinicId]);

  const fetchDoctorProfile = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/clinic/fetchProfileData/${id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (data.success && data.data.clinic) {
        setClinicId(data.data.clinic.clinicId);
      }
    } catch (err) {
      console.error('Error fetching doctor profile:', err);
    }
  };

  const fetchReceptionists = async () => {
    if (!clinicId) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/clinic/fetch-receptionist/${clinicId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (data.success) {
        setReceptionists(data.data.staff || []);
      } else {
        setReceptionists([]);
        if (data.error?.code !== 'NOT_FOUND') {
           setError(data.message || 'Failed to fetch receptionists');
        }
      }
    } catch (err) {
      setError('Failed to load receptionists');
      console.error('Error fetching receptionists:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReceptionists = (receptionists || []).filter(receptionist => {
    const matchesSearch = `${receptionist.firstName} ${receptionist.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receptionist.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || receptionist.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const openAddModal = () => {
    setCurrentReceptionist(null);
    setIsModalOpen(true);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const openEditModal = (receptionist) => {
    setCurrentReceptionist(receptionist);
    setIsModalOpen(true);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this receptionist?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/clinic/delete-receptionist/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete receptionist');
      }

      // Remove from local state
      setReceptionists(prev => prev.filter(r => r._id !== id));
      alert('Receptionist deleted successfully');
    } catch (err) {
      console.error('Error deleting receptionist:', err);
      alert('Failed to delete receptionist');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clinicId) {
      alert('Clinic ID not found. Please try again later.');
      return;
    }
    setSubmitLoading(true);
    setError('');

    const formData = new FormData(e.target);
    const apiData = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      status: formData.get('status'),
      doctorId: doctorId,
      clinicId: clinicId,
    };

    // Handle password for new receptionists
    if (!currentReceptionist) {
      const password = formData.get('password');
      const confirmPassword = formData.get('confirmPassword');
      
      if (password !== confirmPassword) {
        alert('Passwords do not match!');
        setSubmitLoading(false);
        return;
      }
      apiData.password = password;
    } else {
      // Handle password change for existing receptionists
      const newPassword = formData.get('newPassword');
      if (newPassword && newPassword.length > 0) {
        apiData.password = newPassword;
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
          body: JSON.stringify(apiData),
        });
      } else {
        // Create new receptionist - note: backend uses misspelled 'add-receptinist'
        response = await fetch(`${API_BASE_URL}/api/v1/clinic/add-receptionist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(apiData),
        });
      }

      const resData = await response.json();

      if (!resData.success) {
        throw new Error(resData.message || 'Failed to save receptionist');
      }

      const savedReceptionist = resData.data.staff;

      if (currentReceptionist) {
        // Update in local state
        setReceptionists(prev => 
          prev.map(r => r._id === currentReceptionist._id ? savedReceptionist : r)
        );
        alert('Receptionist updated successfully');
      } else {
        // Add to local state
        setReceptionists(prev => [...prev, savedReceptionist]);
        alert('Receptionist created successfully');
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving receptionist:', err);
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Receptionist Management</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <FiUserPlus size={18} />
          Add New Receptionist
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search receptionists..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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
                {filteredReceptionists.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No receptionists found
                    </td>
                  </tr>
                ) : (
                  filteredReceptionists.map((receptionist) => (
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
                        {receptionist.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {receptionist.phone}
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
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(receptionist._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <div className="text-sm text-gray-500">
          Showing {filteredReceptionists.length} of {receptionists.length} entries
        </div>
        <div className="flex gap-1">
          <button className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-50">
            <FiChevronLeft size={18} />
          </button>
          <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium">
            1
          </button>
          <button className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100">
            2
          </button>
          <button className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100">
            <FiChevronRight size={18} />
          </button>
        </div>
      </div>

     {/* Add/Edit Receptionist Modal */}
{isModalOpen && (
  <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] scale-95 hover:scale-100">
      {/* Modal Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-6 border-b border-blue-200 flex justify-between items-center rounded-t-xl">
        <h3 className="text-xl font-semibold text-blue-900 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          {currentReceptionist ? 'Edit Receptionist' : 'Add New Receptionist'}
        </h3>
        <button
          onClick={() => setIsModalOpen(false)}
          className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Modal Content */}
      <div className="p-8 bg-white rounded-b-xl">
        {error && (
          <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                required
                className="w-full border border-blue-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-blue-50/50 hover:bg-blue-50"
                defaultValue={currentReceptionist?.firstName || ''}
                placeholder="Enter first name"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                required
                className="w-full border border-blue-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-blue-50/50 hover:bg-blue-50"
                defaultValue={currentReceptionist?.lastName || ''}
                placeholder="Enter last name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full border border-blue-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-blue-50/50 hover:bg-blue-50"
                defaultValue={currentReceptionist?.email || ''}
                placeholder="Enter email address"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                required
                className="w-full border border-blue-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-blue-50/50 hover:bg-blue-50"
                defaultValue={currentReceptionist?.phone || ''}
                placeholder="Enter phone number"
              />
            </div>

            {/* Password fields for new receptionist */}
            {!currentReceptionist && (
              <>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      minLength={8}
                      className="w-full border border-blue-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-blue-50/50 hover:bg-blue-50 pr-10"
                      placeholder="Enter password (min 8 characters)"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-400 hover:text-blue-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      required
                      minLength={8}
                      className="w-full border border-blue-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-blue-50/50 hover:bg-blue-50 pr-10"
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-400 hover:text-blue-600 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Optional password change for existing receptionist */}
            {currentReceptionist && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  New Password (optional)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="newPassword"
                    minLength={8}
                    className="w-full border border-blue-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-blue-50/50 hover:bg-blue-50 pr-10"
                    placeholder="Leave blank to keep current password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-400 hover:text-blue-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-blue-500 mt-1.5">
                  Minimum 8 characters required if changing password
                </p>
              </div>
            )}

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">Status</label>
              <select
                name="status"
                className="w-full border border-blue-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-blue-50/50 hover:bg-blue-50"
                defaultValue={currentReceptionist?.status || 'active'}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 mt-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 shadow-sm"
              disabled={submitLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm flex items-center gap-2"
              disabled={submitLoading}
            >
              {submitLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              )}
              {currentReceptionist ? 'Update' : 'Create'} Receptionist
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default ReceptionistManagement;
