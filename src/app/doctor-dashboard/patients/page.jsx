'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/utils/api';
import { Dialog } from '@headlessui/react';
import { Search, Plus, Edit, Trash2, Eye, Filter, Download, Calendar, Phone, Mail, MapPin, User, Shield, X, Pill } from 'lucide-react';

const PatientModal = ({ showModal, selectedPatient, closeModal, modalType, formData, setFormData, handleSubmit }) => {
  const [modalSection, setModalSection] = useState('Personal Info');

  const sections = ['Personal Info', 'Prescriptions'];
  const sectionIcons = {
    'Personal Info': User,
    'Prescriptions': Pill,
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={showModal} onClose={closeModal} className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        {selectedPatient && modalType === 'view' && (
          <Dialog.Panel className="bg-white max-w-6xl w-full shadow-2xl grid grid-cols-1 md:grid-cols-4 overflow-hidden rounded-2xl transform transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] scale-95 hover:scale-100">
            {/* Sidebar */}
            <aside className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 space-y-6 sticky top-0 h-[80vh] overflow-y-auto rounded-l-2xl border-r border-white/10 backdrop-blur-md scrollbar-thin">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold truncate max-w-[80%]">{selectedPatient.name}</h3>
                  <p className="text-sm text-white/80 mt-1">Patient ID: #{selectedPatient._id?.substring(0, 8) || selectedPatient.id || 'N/A'}</p>
                </div>
                <button
                  onClick={closeModal}
                  aria-label="Close modal"
                  className="p-1.5 rounded-full hover:bg-white/20 transition transform hover:rotate-90 duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Patient Summary Card */}
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 mb-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-white/20 p-2 rounded-lg hidden">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Age</p>
                    <p className="font-medium">{selectedPatient.age || 'N/A'} years</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Condition</p>
                    <p className="font-medium">{selectedPatient.condition || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1.5">
                {sections.map((section) => {
                  const Icon = sectionIcons[section] || User;
                  return (
                    <button
                      key={section}
                      onClick={() => setModalSection(section)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                        ${modalSection === section
                          ? 'bg-white text-blue-600 font-semibold shadow-lg'
                          : 'hover:bg-white/10 focus:bg-white/10 focus:outline-none text-white/90 hover:text-white'
                        }`}
                    >
                      <Icon className={`w-4 h-4 ${modalSection === section ? 'text-blue-600' : 'text-white/70'}`} />
                      {section}
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Content Area */}
            <main className="col-span-3 p-8 bg-gradient-to-br from-gray-50 to-white overflow-y-auto max-h-[80vh] rounded-r-2xl scrollbar-thin">
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Personal Info Section */}
                {modalSection === 'Personal Info' && (
                  <section className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Personal Information
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-500 font-medium">Age & Gender</p>
                        <p className="text-sm text-blue-900">{selectedPatient.age || 'N/A'} years, {selectedPatient.gender || 'N/A'}</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-500 font-medium">Blood Type</p>
                        <p className="text-sm text-blue-900">{selectedPatient.bloodType || 'N/A'}</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-500 font-medium">Last Visit</p>
                        <p className="text-sm text-blue-900">{selectedPatient.lastVisit || 'N/A'}</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-500 font-medium">Status</p>
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPatient.status)}`}>
                          {selectedPatient.status || 'N/A'}
                        </span>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 md:col-span-2">
                        <p className="text-xs text-blue-500 font-medium">Address</p>
                        <p className="text-sm text-blue-900">{selectedPatient.address || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 mt-6">
                      <h5 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Contact Information
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-2">
                          <Phone className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-blue-500">Phone</p>
                            <p className="text-sm text-blue-900">{selectedPatient.phone || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Mail className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-blue-500">Email</p>
                            <p className="text-sm text-blue-900">{selectedPatient.email || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Prescriptions Section */}
                {modalSection === 'Prescriptions' && (
                  <section className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Pill className="w-5 h-5 text-blue-600" />
                        Prescriptions
                      </h4>
                    </div>

                    {selectedPatient.prescriptions?.length > 0 ? (
                      <div className="space-y-4">
                        {selectedPatient.prescriptions.map((prescription, index) => (
                          <div key={index} className="bg-blue-50/30 p-5 rounded-xl border border-blue-100">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-blue-500 font-medium">Date</p>
                                <p className="text-sm text-blue-900">{prescription.date || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-blue-500 font-medium">Doctor</p>
                                <p className="text-sm text-blue-900">{prescription.doctor || 'N/A'}</p>
                              </div>
                            </div>

                            <div className="mb-4">
                              <p className="text-xs text-blue-500 font-medium mb-2">Medicines</p>
                              <div className="space-y-3">
                                {prescription.medicines?.map((medicine, medIndex) => (
                                  <div key={medIndex} className="grid grid-cols-12 gap-3 bg-white p-3 rounded-lg border border-blue-100">
                                    <div className="col-span-5">
                                      <p className="text-sm font-medium text-gray-700">{medicine.name || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                      <p className="text-sm text-gray-700">{medicine.dosage || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                      <p className="text-sm text-gray-700">{medicine.frequency || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                      <p className="text-sm text-gray-700">{medicine.duration || 'N/A'}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {prescription.notes && (
                              <div>
                                <p className="text-xs text-blue-500 font-medium mb-1">Doctor's Notes</p>
                                <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-blue-100">
                                  {prescription.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-blue-50/30 p-5 rounded-xl border border-blue-100 text-center">
                        <p className="text-gray-500">No prescriptions found for this patient</p>
                      </div>
                    )}
                  </section>
                )}
              </div>
            </main>
          </Dialog.Panel>
        )}

        {/* Add/Edit Form Modal */}
        {modalType !== 'view' && (
          <Dialog.Panel className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] scale-95 hover:scale-100">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-6 border-b border-blue-200 flex justify-between items-center rounded-t-xl">
              <h3 className="text-xl font-semibold text-blue-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                {modalType === 'add' ? 'Add New Patient' : 'Edit Patient'}
              </h3>
              <button
                onClick={closeModal}
                className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 bg-white rounded-b-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-blue-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-blue-50/50 hover:bg-blue-50"
                    required
                    placeholder="Enter patient name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Age <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full border border-blue-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-blue-50/50 hover:bg-blue-50"
                    required
                    placeholder="Enter age"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Gender <span className="text-red-500">*</span></label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full border border-blue-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-blue-50/50 hover:bg-blue-50"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Phone <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-blue-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-blue-50/50 hover:bg-blue-50"
                    required
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-blue-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-blue-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-blue-50/50 hover:bg-blue-50"
                    placeholder="Enter email address"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-blue-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full border border-blue-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-blue-50/50 hover:bg-blue-50"
                    placeholder="Enter address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Condition</label>
                  <input
                    type="text"
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full border border-blue-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-blue-50/50 hover:bg-blue-50"
                    placeholder="Enter medical condition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border border-blue-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-blue-50/50 hover:bg-blue-50"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Blood Type</label>
                  <input
                    type="text"
                    value={formData.bloodType}
                    onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                    className="w-full border border-blue-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-blue-50/50 hover:bg-blue-50"
                    placeholder="Enter blood type"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="w-full border border-blue-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-blue-50/50 hover:bg-blue-50"
                    placeholder="Enter emergency contact"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
                >
                  {modalType === 'add' ? 'Add Patient' : 'Save Changes'}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        )}
      </div>
    </Dialog>
  );
};

const PatientManagementPage = () => {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view');
  const [userId, setId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    condition: '',
    status: 'Active',
    bloodType: '',
    emergencyContact: '',
    prescriptions: []
  });

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const data = JSON.parse(user);
      setId(data?.id);
    }
  }, []);



  const fetchAppointmentsByDoc = async (doctorId) => {
    try {
      const token = localStorage.getItem('token');
      // Fetch all clinic patients instead of just doctor's appointments
      const res = await fetch(`${API_BASE_URL}/api/v1/patient/list?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const response = await res.json();

      if (response.success) {
        const patientList = response.data.patients || [];

        const mappedPatients = patientList.map(p => ({
            _id: p._id,
            id: p._id,
            patientCode: p.patientCode,
            name: `${p.firstName} ${p.lastName}`,
            age: p.dateOfBirth ? Math.abs(new Date(Date.now() - new Date(p.dateOfBirth).getTime()).getUTCFullYear() - 1970) : 0,
            gender: p.gender || 'Unknown',
            phone: p.phoneNumber || 'N/A',
            email: p.email || 'No email',
            address: p.city || 'No address',
            lastVisit: p.lastVisit ? new Date(p.lastVisit).toLocaleDateString() : 'No visits yet',
            lastVisitRaw: p.lastVisit || p.createdAt,
            condition: p.medicalHistory || 'No condition specified',
            status: p.status || 'Active',
            bloodType: p.bloodGroup || 'Unknown',
            emergencyContact: p.emergencyContact || 'Not provided',
            prescriptions: []
        }));

        setPatients(mappedPatients);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchAppointmentsByDoc(userId);
    }
  }, [userId]);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.condition.toLowerCase().includes(searchTerm.toLowerCase());
      
    let matchesDate = true;
    if (filterDate) {
      if (!patient.lastVisitRaw) {
        matchesDate = false;
      } else {
        const patientDateStr = new Date(patient.lastVisitRaw).toISOString().split('T')[0];
        matchesDate = (patientDateStr === filterDate);
      }
    } else if (filterMonth) {
      if (!patient.lastVisitRaw) {
        matchesDate = false;
      } else {
        const patientDate = new Date(patient.lastVisitRaw);
        const [year, month] = filterMonth.split('-');
        matchesDate = (patientDate.getFullYear() === parseInt(year) && (patientDate.getMonth() + 1) === parseInt(month));
      }
    }
    
    return matchesSearch && matchesDate;
  });

  const openModal = async (type, patient = null) => {
    setModalType(type);

    if (type === 'view' && patient) {

      setSelectedPatient(patient);
      setFormData({ ...patient });

    } else if (patient) {
      setSelectedPatient(patient);
      setFormData({ ...patient });
    } else {
      setFormData({
        name: '',
        age: '',
        gender: '',
        phone: '',
        email: '',
        address: '',
        condition: '',
        status: 'Active',
        bloodType: '',
        emergencyContact: '',
        prescriptions: []
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPatient(null);
    setFormData({
      name: '',
      age: '',
      gender: '',
      phone: '',
      email: '',
      address: '',
      condition: '',
      status: 'Active',
      bloodType: '',
      emergencyContact: '',
      prescriptions: []
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.age || !formData.gender || !formData.phone) {
      alert('Please fill in all required fields');
      return;
    }

    if (modalType === 'add') {
      const newPatient = {
        ...formData,
        _id: Math.random().toString(36).substring(2, 11),
        id: patients.length > 0 ? Math.max(...patients.map(p => parseInt(p.id))) + 1 : 1,
        lastVisit: new Date().toLocaleDateString(),
        prescriptions: []
      };
      setPatients([...patients, newPatient]);
    } else if (modalType === 'edit') {
      setPatients(patients.map(p => p._id === selectedPatient._id ? { ...formData } : p));
    }
    closeModal();
  };

  const deletePatient = (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      setPatients(patients.filter(p => p._id !== id && p.id !== id));
    }
  };

  const getStatusColor = (status) => {
    return status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patient Management</h1>
            <p className="text-gray-600 mt-1">Manage all patient records and history</p>
          </div>
        </div>
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-2xl">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex items-center">
                  <input
                    type="date"
                    className="pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm text-gray-700 w-full sm:w-auto"
                    value={filterDate}
                    onChange={(e) => {
                      setFilterDate(e.target.value);
                      setFilterMonth('');
                    }}
                    title="Filter by Date"
                  />
                </div>
                <div className="relative flex items-center">
                  <input
                    type="month"
                    className="pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm text-gray-700 w-full sm:w-auto"
                    value={filterMonth}
                    onChange={(e) => {
                      setFilterMonth(e.target.value);
                      setFilterDate('');
                    }}
                    title="Filter by Month"
                  />
                </div>
                {(filterDate || filterMonth) && (
                  <button 
                    onClick={() => {
                      setFilterDate('');
                      setFilterMonth('');
                    }}
                    className="text-xs text-rose-500 hover:text-rose-600 font-medium px-2 py-1 rounded-md hover:bg-rose-50 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={() => openModal('add')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Patient
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 max-w-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {(filterDate || filterMonth) ? 'Filtered Patients' : 'Total Patients'}
                </p>
                <p className="text-2xl font-bold text-gray-900">{filteredPatients.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Condition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Visit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPatients.map((patient) => (
                  <tr key={patient._id || patient.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/doctor-dashboard/patients/${patient._id || patient.id}`)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                      {patient.patientCode || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center hidden">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="">
                          <div className="text-sm font-medium text-gray-900 capitalize">{patient.name}</div>
                          <div className="text-sm text-gray-500">
                            {patient.gender || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {patient.phone || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {patient.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">
                      <div className="text-sm text-gray-900">{patient.condition || 'N/A'}</div>
                      <div className="text-sm text-gray-500">Blood: {patient.bloodType || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patient.lastVisit || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal('edit', patient);
                          }}
                          className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePatient(patient._id || patient.id);
                          }}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
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
        </div>

        <PatientModal
          showModal={showModal}
          selectedPatient={selectedPatient}
          closeModal={closeModal}
          modalType={modalType}
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
        />
      </div>
  );
};

export default PatientManagementPage;
