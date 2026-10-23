'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  Pill,
  Download as DownloadIcon,
  X,
  Calendar,
  Clock,
  Stethoscope,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { patientService } from '@/utils/patientService';
import { appointmentService } from '@/utils/appointmentService';

function PatientsPageContent() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pagination, setPagination] = useState({ totalPages: 1, totalCount: 0 });
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
   const { token } = useAuth();
   const searchParams = useSearchParams();
   const querySearch = searchParams.get('search') || '';

   useEffect(() => {
     setSearchTerm(querySearch);
   }, [querySearch]);

  useEffect(() => {
    const fetchPatients = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const backendSortBy = sortBy === 'name' ? 'name' : (sortBy === 'registrationDate' ? 'created_at' : sortBy);
        const result = await patientService.getPatients({
          page: currentPage,
          limit: itemsPerPage,
          name: searchTerm,
          sortBy: backendSortBy,
          sortOrder: sortOrder,
        }, token);
        
        setPatients(result.data.patients || []);
        setPagination(result.data.pagination || { totalPages: 1, totalCount: (result.data.patients || []).length });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchPatients, 500);
    return () => clearTimeout(debounceTimer);
  }, [token, currentPage, searchTerm, sortBy, sortOrder]);

  // Transform patient data for display
  const transformPatientData = (patient) => {
    return {
      id: patient._id,
      patientCode: patient.patientCode,
      name: `${patient.firstName} ${patient.lastName}`,
      age: calculateAge(patient.dateOfBirth),
      gender: patient.gender,
      phone: patient.phoneNumber,
      email: patient.email,
      lastVisit: patient.lastVisit,
      doctor: patient.doctor,
      registrationDate: patient.createdAt,
      bloodGroup: patient.bloodGroup,
      medicalHistory: patient.medicalHistory,
      allergies: patient.allergies,
      currentMedications: patient.currentMedications,
    };
  };

  function calculateAge(dateOfBirth) {
    const dob = new Date(dateOfBirth);
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  // Transform and Filter data
  // Note: Most filtering is now server-side, but gender and client-side sorting are still here for convenience
  const filteredPatients = patients
    .map(transformPatientData)
    .filter((patient) => {
      const matchesGender = !filterGender || patient.gender === filterGender;
      return matchesGender;
    })
    .sort((a, b) => {
      let aValue = a[sortBy] ?? '';
      let bValue = b[sortBy] ?? '';

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const cmp = aValue.localeCompare(bValue, undefined, { sensitivity: 'base', numeric: true });
        return sortOrder === 'asc' ? cmp : -cmp;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : (aValue < bValue ? -1 : 0);
      } else {
        return aValue < bValue ? 1 : (aValue > bValue ? -1 : 0);
      }
    });

  // Pagination is handled by server-side query, but we show the ones from filtered list
  const totalPages = pagination.totalPages;
  const paginatedPatients = filteredPatients; // Server already limited the count

  const handleDelete = async (patientId) => {
    if (!window.confirm('Are you sure you want to delete this patient record?')) return;
    try {
      await patientService.deletePatient(patientId, token);
      setPatients((prev) => prev.filter((p) => (p._id || p.id) !== patientId));
      setPagination((prev) => ({
        ...prev,
        totalCount: Math.max(0, (prev.totalCount || 1) - 1),
      }));
      alert('Patient deleted successfully');
    } catch (err) {
      alert(`Error deleting patient: ${err.message}`);
    }
  };

  const openPatientModal = async (patient) => {
    try {
      const result = await patientService.getPatientById(patient.id, token);
      setSelectedPatient(transformPatientData(result.data.patient));
      setShowModal(true);

      // Fetch appointment history in parallel
      setLoadingHistory(true);
      try {
        const historyRes = await appointmentService.getPatientHistory(patient.id, token);
        if (historyRes.success) {
          setAppointmentHistory(Array.isArray(historyRes.data) ? historyRes.data : (historyRes.data?.appointments || []));
        }
      } catch (histErr) {
        console.error('Error fetching appointment history:', histErr);
        setAppointmentHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    } catch (err) {
      alert(`Error fetching patient details: ${err.message}`);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPatient(null);
    setAppointmentHistory([]);
  };

  const getHistoryStatusStyle = (status) => {
    switch (status) {
      case 'completed': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <CheckCircle className="w-4 h-4" /> };
      case 'cancelled': return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: <XCircle className="w-4 h-4" /> };
      case 'booked': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: <Clock className="w-4 h-4" /> };
      case 'checked_in': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: <AlertCircle className="w-4 h-4" /> };
      case 'in_progress': return { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', icon: <Stethoscope className="w-4 h-4" /> };
      default: return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: <Clock className="w-4 h-4" /> };
    }
  };

  const handleDownloadPDF = () => {
    alert(`Downloading ${selectedPatient.name}'s medical records as PDF`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Card (Matching Lab Orders) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            View, search, and manage registered patient profiles, medical history, and contact details.
          </p>
        </div>

        <Link
          href="/receptionist-dashboard/patients/add"
          className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
          id="btn-add-patient"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Patient</span>
        </Link>
      </div>

      {/* 2. Search & Filter Bar (Matching Lab Orders) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-patients"
              type="text"
              placeholder="Search patients by name, phone, or patient ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
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

          {/* Gender Filter & Sort By Dropdowns */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                className="px-3.5 py-2 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors appearance-none cursor-pointer"
              >
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <ChevronRight className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-3.5 py-2 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors appearance-none cursor-pointer"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="age-asc">Age (Low-High)</option>
                <option value="age-desc">Age (High-Low)</option>
                <option value="lastVisit-desc">Recent Visit</option>
                <option value="registrationDate-desc">Recent Registration</option>
              </select>
              <ChevronRight className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Patients Table (Matching Lab Orders) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-slate-500 font-medium">Loading patients...</p>
          </div>
        ) : paginatedPatients.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No patients found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              {searchTerm || filterGender ? 'No patients match your search criteria. Try clearing search filters.' : 'No patient records registered yet.'}
            </p>
            <Link
              href="/receptionist-dashboard/patients/add"
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Patient</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Patient Info</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Age &amp; Gender</th>
                  <th className="py-3.5 px-4">Last Visit</th>
                  <th className="py-3.5 px-4">Doctor</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    onClick={() => openPatientModal(patient)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-4 sm:px-6 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          {patient.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">
                            {patient.name} <span className="text-xs text-blue-600 font-semibold ml-1">({patient.patientCode || 'N/A'})</span>
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{patient.gender || 'N/A'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <p className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {patient.phone || 'N/A'}
                        </p>
                        {patient.email && (
                          <p className="text-xs text-slate-500 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {patient.email}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                        {patient.age} Yrs
                      </span>
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-600">
                      {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : <span className="text-slate-400 italic">No visits yet</span>}
                    </td>

                    <td className="py-4 px-4 text-xs font-medium text-slate-700">
                      {patient.doctor || <span className="text-slate-400 italic">Not assigned</span>}
                    </td>

                    <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/receptionist-dashboard/appointments/add?patientId=${patient.id}`}
                          title="Book Appointment"
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Calendar className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/receptionist-dashboard/patients/${patient.id}/edit`}
                          title="Edit Patient"
                          className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(patient.id)}
                          title="Delete Patient"
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination matching Lab Orders */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <span className="text-xs text-slate-500 font-medium">
              Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, pagination.totalCount)} of {pagination.totalCount} patients
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                const pg = i + 1;
                return (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      currentPage === pg
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="text-slate-400 px-1 text-xs">…</span>}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Patient Details Modal */}
      <AnimatePresence>
        {showModal && selectedPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-y-auto border border-blue-100/30"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-blue-100/30">
                <h3 className="text-2xl font-bold text-blue-900">
                  {selectedPatient.name}'s Medical Records
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeModal}
                  className="text-blue-600 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50"
                >
                  <X className="h-6 w-6" />
                </motion.button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Patient Information */}
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 }}
  className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100/30"
>
  <h4 className="text-lg font-semibold text-blue-900 mb-4">Patient Information</h4>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <p className="text-sm text-blue-700/80">Full Name</p>
      <p className="font-medium text-blue-900">{selectedPatient.name}</p>
    </div>
    <div>
      <p className="text-sm text-blue-700/80">Age & Gender</p>
      <p className="font-medium text-blue-900">
        {selectedPatient.age} years, {selectedPatient.gender}
      </p>
    </div>
    <div>
      <p className="text-sm text-blue-700/80">Blood Group</p>
      <p className="font-medium text-blue-900">
        {selectedPatient.bloodGroup || 'Not specified'}
      </p>
    </div>
    <div>
      <p className="text-sm text-blue-700/80">Last Visit</p>
      <p className="font-medium text-blue-900">
        {appointmentHistory.length > 0 
          ? new Date(appointmentHistory[0].appointmentDate).toLocaleDateString('en-IN') 
          : 'No visits yet'}
      </p>
    </div>
    <div>
      <p className="text-sm text-blue-700/80">Treating Doctor</p>
      <p className="font-medium text-blue-900">
        {appointmentHistory.length > 0 && appointmentHistory[0].doctorId 
          ? `Dr. ${appointmentHistory[0].doctorId.firstName} ${appointmentHistory[0].doctorId.lastName}` 
          : 'Not assigned'}
      </p>
    </div>
  </div>
</motion.div>

                {/* Appointment History */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white rounded-2xl p-5 border border-blue-100/30"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Appointment History
                    </h4>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                      {appointmentHistory.length} visits
                    </span>
                  </div>

                  {loadingHistory ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : appointmentHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-10 h-10 text-blue-200 mx-auto mb-2" />
                      <p className="text-sm text-blue-700/80">No appointment history found</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {appointmentHistory.map((appt, idx) => {
                        const style = getHistoryStatusStyle(appt.status);
                        return (
                          <motion.div
                            key={appt._id || idx}
                            whileHover={{ scale: 1.01 }}
                            className={`border rounded-xl p-4 ${style.border} ${style.bg} transition-all`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Stethoscope className="w-4 h-4 text-indigo-500" />
                                <span className="text-sm font-semibold text-blue-900">
                                  Dr. {appt.doctorId?.firstName || ''} {appt.doctorId?.lastName || ''}
                                </span>
                              </div>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${style.bg} ${style.text} border ${style.border}`}>
                                {style.icon}
                                {appt.status?.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-blue-700/80">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(appt.appointmentDate).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {appt.timeSlot}
                              </span>
                            </div>
                            {appt.reason && (
                              <p className="mt-2 text-xs text-blue-800/70 pl-1 border-l-2 border-blue-200 ml-1">
                                {appt.reason}
                              </p>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>

                {/* Prescriptions */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl p-5 border border-blue-100/30"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-blue-900">Prescriptions</h4>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                    >
                      
                      
                    </motion.button>
                  </div>
                  <div className="space-y-4">
                    {(() => {
                      const visitsWithMeds = appointmentHistory.filter(appt => appt.medicines && appt.medicines.length > 0);
                      
                      if (visitsWithMeds.length === 0) {
                        return (
                          <p className="text-sm text-blue-700/80 text-center py-4">No prescriptions found for this patient.</p>
                        );
                      }

                      return visitsWithMeds.slice(0, 5).map((appt, idx) => (
                        <motion.div
                          key={appt._id}
                          whileHover={{ scale: 1.02 }}
                          className="border border-blue-100/30 rounded-xl p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <Pill className="w-5 h-5 text-blue-600 mr-2" />
                              <span className="font-medium text-blue-900">{idx === 0 ? 'Latest Prescription' : 'Previous Prescription'}</span>
                            </div>
                            <span className="text-sm text-blue-700/80">{new Date(appt.appointmentDate).toLocaleDateString('en-IN')}</span>
                          </div>
                          <div className="space-y-3 pl-7">
                            {appt.medicines.map((med, mIdx) => (
                              <div key={mIdx} className="bg-white/60 p-3 rounded-lg border border-blue-100/50">
                                <p className="text-sm text-blue-900 mb-1">
                                  <span className="font-bold">{med.name}</span>
                                </p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-blue-800/80">
                                  <span className="flex items-center gap-1"><span className="font-medium">Dosage:</span> {med.dosage}</span>
                                  <span className="flex items-center gap-1"><span className="font-medium">Freq:</span> {med.frequency || 'N/A'}</span>
                                  <span className="flex items-center gap-1"><span className="font-medium">Duration:</span> {med.duration}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      ));
                    })()}
                  </div>
                </motion.div>

                {/* Medical Reports */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl p-5 border border-blue-100/30"
                >
                  <h4 className="text-lg font-semibold text-blue-900 mb-4">Medical Reports</h4>
                  <div className="space-y-4">
                    {/* Dynamic Reports would be mapped here */}
                    {(!selectedPatient.reports || selectedPatient.reports.length === 0) && (
                      <p className="text-sm text-blue-700/80 text-center">No medical reports available</p>
                    )}
                  </div>
                </motion.div>

                {/* Medical History */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-2xl p-5 border border-blue-100/30"
                >
                  <h4 className="text-lg font-semibold text-blue-900 mb-4">Medical History</h4>
                  <div className="space-y-2">
                    {selectedPatient.medicalHistory ? (
                      <p className="text-sm text-blue-900">{selectedPatient.medicalHistory}</p>
                    ) : (
                      <p className="text-sm text-blue-700/80">No medical history recorded</p>
                    )}
                  </div>
                </motion.div>

                {/* Allergies */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-2xl p-5 border border-blue-100/30"
                >
                  <h4 className="text-lg font-semibold text-blue-900 mb-4">Allergies</h4>
                  <div className="space-y-2">
                    {selectedPatient.allergies ? (
                      <p className="text-sm text-blue-900">{selectedPatient.allergies}</p>
                    ) : (
                      <p className="text-sm text-blue-700/80">No known allergies</p>
                    )}
                  </div>
                </motion.div>

                {/* Current Medications */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white rounded-2xl p-5 border border-blue-100/30"
                >
                  <h4 className="text-lg font-semibold text-blue-900 mb-4">Current Medications</h4>
                  <div className="space-y-2">
                    {selectedPatient.currentMedications ? (
                      <p className="text-sm text-blue-900">{selectedPatient.currentMedications}</p>
                    ) : (
                      <p className="text-sm text-blue-700/80">No current medications</p>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 flex justify-between items-center border-t border-blue-100/30">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={closeModal}
                  className="px-4 py-2 border border-blue-200 text-blue-900 rounded-xl hover:bg-blue-100/50 transition-colors"
                >
                  Close
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDownloadPDF}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors"
                >
                  <DownloadIcon className="w-5 h-5 mr-2" />
                  Download as PDF
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PatientsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <p className="text-sm font-medium text-slate-500 animate-pulse">Loading Patients...</p>
      </div>
    }>
      <PatientsPageContent />
    </Suspense>
  );
}
