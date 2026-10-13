'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/utils/api';
import { validatePhoneNumber, handlePhoneKeyDown, validateEmail } from '@/utils/phoneValidation';
import { patientService } from '@/utils/patientService';
import { formatPatientAddress } from '@/utils/addressFormatting';
import { Dialog } from '@headlessui/react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Download,
  Calendar,
  Phone,
  Mail,
  MapPin,
  User,
  Shield,
  X,
  Pill,
  AlertCircle,
  Clock,
  Activity,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const PatientModal = ({
  showModal,
  selectedPatient,
  closeModal,
  modalType,
  formData,
  setFormData,
  handleSubmit,
  formErrors = {},
  setFormErrors,
  apiError = null,
  setApiError,
  isSubmitting = false,
}) => {
  const [modalSection, setModalSection] = useState('Personal Info');

  const sections = ['Personal Info', 'Prescriptions'];
  const sectionIcons = {
    'Personal Info': User,
    'Prescriptions': Pill,
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-700 border border-emerald-200/60';
      case 'Inactive': return 'bg-rose-50 text-rose-700 border border-rose-200/60';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200/60';
    }
  };

  return (
    <Dialog open={showModal} onClose={closeModal} className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6">
        {/* View Modal */}
        {selectedPatient && modalType === 'view' && (
          <Dialog.Panel className="bg-white max-w-5xl w-full shadow-xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-4 overflow-hidden rounded-2xl max-h-[92vh] h-[85vh] transform transition-all">
            {/* Sidebar */}
            <aside className="bg-slate-50/80 p-6 space-y-6 sticky top-0 h-full overflow-y-auto rounded-l-2xl border-r border-slate-200">
              <div className="flex justify-between items-start">
                <div className="pr-2">
                  <h3 className="text-xl font-bold text-slate-900 truncate">{selectedPatient.name}</h3>
                  <p className="text-xs font-mono font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100/80 mt-1.5 inline-block">
                    {selectedPatient.patientCode || selectedPatient.patient_code || `#${selectedPatient._id?.substring(0, 8) || selectedPatient.id || 'N/A'}`}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  aria-label="Close modal"
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Patient Summary Card */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/60 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Age</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {selectedPatient.age > 0 ? `${selectedPatient.age} years` : 'Age N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 pt-2 border-t border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/60 shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Condition</p>
                    <p className="text-sm font-semibold text-slate-800 truncate max-w-[140px]">{selectedPatient.condition || 'None reported'}</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = sectionIcons[section] || User;
                  const isActive = modalSection === section;
                  return (
                    <button
                      key={section}
                      onClick={() => setModalSection(section)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors text-left
                        ${isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/60 shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                        }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      {section}
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Content Area */}
            <main className="col-span-1 md:col-span-3 p-8 bg-white overflow-y-auto h-full rounded-r-2xl">
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Personal Info Section */}
                {modalSection === 'Personal Info' && (
                  <section className="space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Personal Information
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Age & Gender</p>
                        <p className="text-sm font-semibold text-slate-800 mt-1">
                          {selectedPatient.age > 0 ? `${selectedPatient.age} years` : 'Age N/A'}, {selectedPatient.gender || 'Not specified'}
                        </p>
                      </div>
                      <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Blood Type</p>
                        <p className="text-sm font-semibold text-slate-800 mt-1">{selectedPatient.bloodType || 'Not specified'}</p>
                      </div>
                      <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Visit</p>
                        <p className="text-sm font-semibold text-slate-800 mt-1">{selectedPatient.lastVisit || 'No visits yet'}</p>
                      </div>
                      <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 mt-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPatient.status)}`}>
                          {selectedPatient.status || 'Active'}
                        </span>
                      </div>
                      <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 md:col-span-2">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Address</p>
                        <p className="text-sm font-semibold text-slate-800 mt-1">
                          {formatPatientAddress(selectedPatient)}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200/80 mt-6">
                      <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        Contact & Emergency Details
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-2.5">
                          <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-slate-500">Phone</p>
                            <p className="text-sm font-semibold text-slate-900 mt-0.5">{selectedPatient.phone || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-slate-500">Email</p>
                            <p className="text-sm font-semibold text-slate-900 mt-0.5">{selectedPatient.email || 'N/A'}</p>
                          </div>
                        </div>
                        {selectedPatient.emergencyContact && selectedPatient.emergencyContact !== 'Not provided' && (
                          <div className="flex items-start gap-2.5 md:col-span-2 pt-2 border-t border-slate-200/60">
                            <Shield className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-slate-500">Emergency Contact</p>
                              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                                {typeof selectedPatient.emergencyContact === 'object'
                                  ? `${selectedPatient.emergencyContact.name ? selectedPatient.emergencyContact.name + ': ' : ''}${selectedPatient.emergencyContact.phone || ''}`
                                  : selectedPatient.emergencyContact}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {/* Prescriptions Section */}
                {modalSection === 'Prescriptions' && (
                  <section className="space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Pill className="w-5 h-5 text-blue-600" />
                        Prescriptions
                      </h4>
                    </div>

                    {selectedPatient.prescriptions?.length > 0 ? (
                      <div className="space-y-4">
                        {selectedPatient.prescriptions.map((prescription, index) => (
                          <div key={index} className="bg-slate-50/70 p-5 rounded-xl border border-slate-200/80">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</p>
                                <p className="text-sm font-semibold text-slate-800 mt-1">{prescription.date || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Doctor</p>
                                <p className="text-sm font-semibold text-slate-800 mt-1">{prescription.doctor || 'N/A'}</p>
                              </div>
                            </div>

                            <div className="mb-4">
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Medicines</p>
                              <div className="space-y-2">
                                {prescription.medicines?.map((medicine, medIndex) => (
                                  <div key={medIndex} className="grid grid-cols-12 gap-3 bg-white p-3 rounded-lg border border-slate-200/80 text-xs">
                                    <div className="col-span-5 font-semibold text-slate-800">
                                      {medicine.name || 'N/A'}
                                    </div>
                                    <div className="col-span-2 text-slate-600">
                                      {medicine.dosage || 'N/A'}
                                    </div>
                                    <div className="col-span-2 text-slate-600">
                                      {medicine.frequency || 'N/A'}
                                    </div>
                                    <div className="col-span-3 text-slate-600">
                                      {medicine.duration || 'N/A'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {prescription.notes && (
                              <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Doctor's Notes</p>
                                <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200/80">
                                  {prescription.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-50/70 p-8 rounded-xl border border-slate-200/80 text-center">
                        <p className="text-sm text-slate-500">No prescriptions found for this patient</p>
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
          <Dialog.Panel className="bg-white rounded-2xl shadow-xl border border-slate-200/80 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-white border-b border-slate-200/80 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <Dialog.Title as="h3" className="text-lg font-bold text-slate-900">
                    {modalType === 'add' ? 'Add New Patient' : 'Edit Patient Information'}
                  </Dialog.Title>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {modalType === 'add'
                      ? 'Fill in the required information to register a new clinic patient.'
                      : `Update record details for ${formData.firstName || selectedPatient?.name || 'patient'}.`}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* API Error Notification */}
            {apiError && (
              <div className="mx-6 mt-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{apiError}</span>
                </div>
                <button
                  onClick={() => setApiError && setApiError(null)}
                  className="text-rose-400 hover:text-rose-600 p-0.5 shrink-0"
                  aria-label="Dismiss error"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Modal Body / Scrollable Form */}
            <div className="p-6 sm:p-7 overflow-y-auto flex-1 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                {/* First Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    First Name <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, firstName: e.target.value });
                      if (formErrors.firstName && setFormErrors) setFormErrors({ ...formErrors, firstName: null });
                    }}
                    className={`w-full h-10 px-3.5 py-2 text-sm text-slate-800 bg-white border rounded-lg placeholder-slate-400 focus:outline-none transition-all ${
                      formErrors.firstName
                        ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                    placeholder="Enter first name"
                  />
                  {formErrors.firstName && (
                    <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 inline shrink-0" />
                      {formErrors.firstName}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Last Name <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, lastName: e.target.value });
                      if (formErrors.lastName && setFormErrors) setFormErrors({ ...formErrors, lastName: null });
                    }}
                    className={`w-full h-10 px-3.5 py-2 text-sm text-slate-800 bg-white border rounded-lg placeholder-slate-400 focus:outline-none transition-all ${
                      formErrors.lastName
                        ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                    placeholder="Enter last name"
                  />
                  {formErrors.lastName && (
                    <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 inline shrink-0" />
                      {formErrors.lastName}
                    </p>
                  )}
                </div>

                {/* Age */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Age <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="150"
                    value={formData.age || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, age: e.target.value });
                      if (formErrors.age && setFormErrors) setFormErrors({ ...formErrors, age: null });
                    }}
                    className={`w-full h-10 px-3.5 py-2 text-sm text-slate-800 bg-white border rounded-lg placeholder-slate-400 focus:outline-none transition-all ${
                      formErrors.age
                        ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                    placeholder="Enter age (years)"
                  />
                  {formErrors.age && (
                    <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 inline shrink-0" />
                      {formErrors.age}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Gender <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <select
                    value={formData.gender || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, gender: e.target.value });
                      if (formErrors.gender && setFormErrors) setFormErrors({ ...formErrors, gender: null });
                    }}
                    className={`w-full h-10 px-3.5 py-2 text-sm text-slate-800 bg-white border rounded-lg focus:outline-none transition-all ${
                      formErrors.gender
                        ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Not Specified">Not Specified</option>
                  </select>
                  {formErrors.gender && (
                    <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 inline shrink-0" />
                      {formErrors.gender}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone Number <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (formErrors.phone && setFormErrors) setFormErrors({ ...formErrors, phone: null });
                    }}
                    onKeyDown={handlePhoneKeyDown}
                    maxLength={10}
                    className={`w-full h-10 px-3.5 py-2 text-sm text-slate-800 bg-white border rounded-lg placeholder-slate-400 focus:outline-none transition-all ${
                      formErrors.phone
                        ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                    placeholder="10-digit phone number"
                  />
                  {formErrors.phone && (
                    <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 inline shrink-0" />
                      {formErrors.phone}
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Email Address
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">Optional</span>
                  </div>
                  <input
                    type="text"
                    value={formData.email || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (formErrors.email && setFormErrors) setFormErrors({ ...formErrors, email: null });
                    }}
                    className={`w-full h-10 px-3.5 py-2 text-sm text-slate-800 bg-white border rounded-lg placeholder-slate-400 focus:outline-none transition-all ${
                      formErrors.email
                        ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                    placeholder="patient@example.com"
                  />
                  {formErrors.email && (
                    <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 inline shrink-0" />
                      {formErrors.email}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Address
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">Optional</span>
                  </div>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full h-10 px-3.5 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="Street address, city, state"
                  />
                </div>

                {/* Medical Condition */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Medical Condition / History
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">Optional</span>
                  </div>
                  <input
                    type="text"
                    value={formData.condition || ''}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full h-10 px-3.5 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="e.g. Hypertension, Diabetes"
                  />
                </div>

                {/* Blood Type */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Blood Type
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">Optional</span>
                  </div>
                  <select
                    value={formData.bloodType || ''}
                    onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                    className="w-full h-10 px-3.5 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="">Select Blood Type (Optional)</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                {/* Emergency Contact */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Emergency Contact
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">Optional</span>
                  </div>
                  <input
                    type="tel"
                    value={formData.emergencyContact || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, emergencyContact: e.target.value });
                      if (formErrors.emergencyContact && setFormErrors) setFormErrors({ ...formErrors, emergencyContact: null });
                    }}
                    onKeyDown={handlePhoneKeyDown}
                    maxLength={10}
                    className={`w-full h-10 px-3.5 py-2 text-sm text-slate-800 bg-white border rounded-lg placeholder-slate-400 focus:outline-none transition-all ${
                      formErrors.emergencyContact
                        ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                    placeholder="10-digit emergency contact phone number"
                  />
                  {formErrors.emergencyContact && (
                    <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 inline shrink-0" />
                      {formErrors.emergencyContact}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-end gap-3 shrink-0 rounded-b-2xl">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm shadow-blue-600/10 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting && <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                {modalType === 'add' ? 'Add Patient' : 'Save Changes'}
              </button>
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
  
  // Filter states (Replacing date controls)
  const [selectedGender, setSelectedGender] = useState('All');
  const [selectedBloodType, setSelectedBloodType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedAgeRange, setSelectedAgeRange] = useState('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef(null);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view');
  const [userId, setId] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
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

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAppointmentsByDoc = async (doctorId) => {
    try {
      const token = localStorage.getItem('token');
      // Fetch all clinic patients
      const res = await fetch(`${API_BASE_URL}/api/v1/patient/list?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const response = await res.json();

      if (response.success) {
        const patientList = response.data.patients || [];

        const mappedPatients = patientList.map(p => {
          const fName = p.firstName || p.first_name || '';
          const lName = p.lastName || p.last_name || '';
          const dob = p.dateOfBirth || p.date_of_birth;
          let calculatedAge = 0;
          if (dob) {
            const bDate = new Date(dob);
            if (!isNaN(bDate.getTime())) {
              calculatedAge = Math.abs(new Date(Date.now() - bDate.getTime()).getUTCFullYear() - 1970);
            }
          } else if (p.age && !isNaN(p.age)) {
            calculatedAge = parseInt(p.age, 10);
          }

          const emergencyStr = typeof p.emergencyContact === 'object' && p.emergencyContact !== null
            ? (p.emergencyContact.phone || p.emergencyContact.name || '')
            : (p.emergencyContact || p.emergency_contact || '');

          return {
            _id: p._id || p.id || p.patientId,
            id: p._id || p.id || p.patientId,
            patientCode: p.patientCode || p.patient_code,
            firstName: fName,
            lastName: lName,
            name: `${fName} ${lName}`.trim(),
            dateOfBirth: dob,
            age: calculatedAge,
            gender: (p.gender && ['Male', 'Female', 'Other', 'Not Specified'].includes(p.gender)) ? p.gender : '',
            phone: p.phoneNumber || p.phone_number || p.phone || '',
            email: p.email || '',
            address: formatPatientAddress(p),
            rawAddress: p.address || p.addressLine1 || p.address_line1 || '',
            lastVisit: p.lastVisit ? new Date(p.lastVisit).toLocaleDateString() : 'No visits yet',
            lastVisitRaw: p.lastVisit || p.createdAt || p.created_at,
            condition: p.medicalHistory || p.medical_history || p.condition || '',
            status: p.status || 'Active',
            bloodType: p.bloodGroup || p.blood_group || p.bloodType || '',
            emergencyContact: emergencyStr,
            prescriptions: []
          };
        });

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

  // Combined active filter count
  const activeFilterCount = (
    (selectedGender !== 'All' ? 1 : 0) +
    (selectedBloodType !== 'All' ? 1 : 0) +
    (selectedStatus !== 'All' ? 1 : 0) +
    (selectedAgeRange !== 'All' ? 1 : 0)
  );
  const hasActiveFilters = activeFilterCount > 0;

  const resetAllFilters = () => {
    setSelectedGender('All');
    setSelectedBloodType('All');
    setSelectedStatus('All');
    setSelectedAgeRange('All');
  };

  // Filter combined with search
  const filteredPatients = patients.filter(patient => {
    // 1. Search Query
    if (searchTerm && searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      const matchesName = patient.name?.toLowerCase().includes(query);
      const matchesEmail = patient.email?.toLowerCase().includes(query);
      const matchesCondition = patient.condition?.toLowerCase().includes(query);
      const matchesCode = patient.patientCode?.toLowerCase().includes(query);
      const matchesPhone = patient.phone?.toLowerCase().includes(query);
      if (!matchesName && !matchesEmail && !matchesCondition && !matchesCode && !matchesPhone) {
        return false;
      }
    }

    // 2. Gender Filter
    if (selectedGender !== 'All') {
      if (!patient.gender || patient.gender.toLowerCase() !== selectedGender.toLowerCase()) {
        return false;
      }
    }

    // 3. Blood Type Filter
    if (selectedBloodType !== 'All') {
      if (!patient.bloodType || patient.bloodType.toUpperCase() !== selectedBloodType.toUpperCase()) {
        return false;
      }
    }

    // 4. Status Filter
    if (selectedStatus !== 'All') {
      if (!patient.status || patient.status.toLowerCase() !== selectedStatus.toLowerCase()) {
        return false;
      }
    }

    // 5. Age Range Filter
    if (selectedAgeRange !== 'All') {
      const age = Number(patient.age);
      if (isNaN(age) || age < 0) return false;
      if (selectedAgeRange === '0-17' && (age < 0 || age > 17)) return false;
      if (selectedAgeRange === '18-35' && (age < 18 || age > 35)) return false;
      if (selectedAgeRange === '36-50' && (age < 36 || age > 50)) return false;
      if (selectedAgeRange === '51+' && age < 51) return false;
    }

    return true;
  });

  const openModal = async (type, patient = null) => {
    if (type === 'add') {
      toast.error('Only Receptionists are authorized to create new patient records.');
      return;
    }
    setModalType(type);
    setFormErrors({});
    setApiError(null);

    if (type === 'view' && patient) {
      setSelectedPatient(patient);
      setFormData({ ...patient });
    } else if (patient) {
      setSelectedPatient(patient);
      const nameParts = (patient.name || '').trim().split(' ');
      const fName = patient.firstName || nameParts[0] || '';
      const lName = patient.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');

      let initialAge = '';
      if (patient.dateOfBirth || patient.date_of_birth) {
        const bDate = new Date(patient.dateOfBirth || patient.date_of_birth);
        if (!isNaN(bDate.getTime())) {
          initialAge = String(Math.abs(new Date(Date.now() - bDate.getTime()).getUTCFullYear() - 1970));
        }
      } else if (patient.age && !isNaN(patient.age) && parseInt(patient.age, 10) > 0) {
        initialAge = String(patient.age);
      }

      const initialGender = patient.gender && ['Male', 'Female', 'Other', 'Not Specified'].includes(patient.gender)
        ? patient.gender
        : '';

      const initialBlood = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(patient.bloodType || patient.bloodGroup || patient.blood_group)
        ? (patient.bloodType || patient.bloodGroup || patient.blood_group)
        : '';

      const cleanPhone = (patient.phone === 'N/A' || patient.phone === 'Not provided') ? '' : (patient.phone || patient.phoneNumber || patient.phone_number || '');
      const cleanEmail = (patient.email === 'N/A' || patient.email === 'No email') ? '' : (patient.email || '');
      
      // Clean up address removing any literal nulls
      const cleanAddress = formatPatientAddress(patient);
      const addressForInput = cleanAddress === 'Not provided' ? '' : cleanAddress;

      const cleanCondition = (patient.condition === 'N/A' || patient.condition === 'No condition specified') ? '' : (patient.condition || patient.medicalHistory || patient.medical_history || '');
      const cleanEmergency = (patient.emergencyContact === 'N/A' || patient.emergencyContact === 'Not provided') ? '' : (patient.emergencyContact || patient.emergency_contact || '');

      setFormData({
        ...patient,
        firstName: fName,
        lastName: lName,
        age: initialAge,
        gender: initialGender,
        phone: cleanPhone,
        email: cleanEmail,
        address: addressForInput,
        condition: cleanCondition,
        bloodType: initialBlood,
        emergencyContact: cleanEmergency,
        status: patient.status || 'Active',
      });

      // Background fetch full record to ensure 100% data fidelity
      const token = localStorage.getItem('token');
      const targetId = patient._id || patient.id;
      if (token && targetId) {
        try {
          const detailRes = await patientService.getPatientById(targetId, token);
          const full = detailRes?.data?.patient || detailRes?.patient || detailRes?.data;
          if (full) {
            const fetchedFName = full.first_name || full.firstName || fName;
            const fetchedLName = full.last_name || full.lastName || lName;
            const fullDob = full.date_of_birth || full.dateOfBirth;
            let fullAge = initialAge;
            if (fullDob) {
              const bDate = new Date(fullDob);
              if (!isNaN(bDate.getTime())) {
                fullAge = String(Math.abs(new Date(Date.now() - bDate.getTime()).getUTCFullYear() - 1970));
              }
            }

            const fullBlood = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(full.blood_group || full.bloodGroup)
              ? (full.blood_group || full.bloodGroup)
              : initialBlood;

            const fetchedAddress = formatPatientAddress(full);
            const finalAddress = fetchedAddress === 'Not provided' ? addressForInput : fetchedAddress;

            const fetchedEmergency = typeof full.emergency_contact === 'object' && full.emergency_contact !== null
              ? (full.emergency_contact.phone || full.emergency_contact.name || cleanEmergency)
              : (full.emergency_contact || full.emergencyContact || cleanEmergency);

            setFormData(prev => ({
              ...prev,
              firstName: fetchedFName,
              lastName: fetchedLName,
              age: fullAge,
              gender: full.gender && ['Male', 'Female', 'Other', 'Not Specified'].includes(full.gender) ? full.gender : prev.gender,
              phone: full.phone_number || full.phoneNumber || prev.phone,
              email: full.email || '',
              address: finalAddress,
              condition: full.medical_history || full.medicalHistory || prev.condition || '',
              bloodType: fullBlood,
              emergencyContact: fetchedEmergency,
              status: full.status || prev.status || 'Active',
            }));
          }
        } catch (e) {
          // If fetch fails, table data is already populated
        }
      }
    } else {
      setFormData({
        firstName: '',
        lastName: '',
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
    setFormErrors({});
    setApiError(null);
    setIsSubmitting(false);
    setFormData({
      firstName: '',
      lastName: '',
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

  const handleSubmit = async () => {
    setApiError(null);
    const newErrors = {};

    if (!formData.firstName || !formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName || !formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.age || isNaN(formData.age) || parseInt(formData.age, 10) <= 0) {
      newErrors.age = 'Age is required';
    }
    if (!formData.gender || !formData.gender.trim() || formData.gender === 'Select Gender') {
      newErrors.gender = 'Gender is required';
    }

    const phoneErr = validatePhoneNumber(formData.phone, true, 'Phone number');
    if (phoneErr) {
      newErrors.phone = phoneErr;
    }

    const emailErr = validateEmail(formData.email, false, 'Email');
    if (emailErr) {
      newErrors.email = emailErr;
    }

    if (formData.emergencyContact && formData.emergencyContact.trim()) {
      const emErr = validatePhoneNumber(formData.emergencyContact, false, 'Emergency contact');
      if (emErr) {
        newErrors.emergencyContact = emErr;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setApiError('You must be logged in to manage patients');
      return;
    }

    const ageNum = parseInt(formData.age, 10) || 0;
    const dateOfBirth = `${new Date().getFullYear() - ageNum}-01-01`;
    const cleanEmail = formData.email && formData.email.trim() ? formData.email.trim().toLowerCase() : null;

    setIsSubmitting(true);
    try {
      if (modalType === 'add') {
        toast.error('Only Receptionists are authorized to create new patient records.');
        setIsSubmitting(false);
        closeModal();
        return;
      } else if (modalType === 'edit') {
        const payload = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: cleanEmail,
          phoneNumber: formData.phone.trim(),
          dateOfBirth,
          gender: formData.gender,
          bloodGroup: formData.bloodType || null,
          emergencyContact: formData.emergencyContact?.trim() || null,
          address: formData.address?.trim() || null,
          medicalHistory: formData.condition?.trim() || null,
          status: selectedPatient?.status || 'Active',
        };

        const targetId = selectedPatient._id || selectedPatient.id;
        await patientService.updatePatient(targetId, payload, token);

        setPatients(prev => prev.map(p => {
          if ((p._id || p.id) === targetId) {
            return {
              ...p,
              firstName: payload.firstName,
              lastName: payload.lastName,
              name: `${payload.firstName} ${payload.lastName}`.trim(),
              age: ageNum,
              dateOfBirth: payload.dateOfBirth,
              gender: payload.gender,
              phone: payload.phoneNumber,
              email: payload.email || '',
              address: payload.address || p.address || 'Not provided',
              condition: payload.medicalHistory || '',
              status: payload.status,
              bloodType: payload.bloodGroup || '',
              emergencyContact: payload.emergencyContact || '',
            };
          }
          return p;
        }));

        closeModal();
        toast.success('Patient updated successfully');
        if (userId) {
          fetchAppointmentsByDoc(userId);
        }
      }
    } catch (err) {
      console.error('Error saving patient:', err);
      const errMsg = err.message || 'Failed to save patient';
      setApiError(errMsg);
      if (errMsg.toLowerCase().includes('phone')) {
        setFormErrors(prev => ({ ...prev, phone: errMsg }));
      }
      if (errMsg.toLowerCase().includes('email')) {
        setFormErrors(prev => ({ ...prev, email: errMsg }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletePatient = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        const token = localStorage.getItem('token');
        await patientService.deletePatient(id, token);
        setPatients(prev => prev.filter(p => (p._id || p.id) !== id));
        toast.success('Patient deleted successfully');
        if (userId) {
          fetchAppointmentsByDoc(userId);
        }
      } catch (err) {
        console.error('Error deleting patient:', err);
        toast.error(err.message || 'Failed to delete patient');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Patient Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and review all clinic patient records, medical profiles, and visit histories</p>
        </div>
      </div>

      {/* Summary Stat Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {hasActiveFilters || searchTerm ? 'Filtered Patients' : 'Total Patients'}
            </p>
            <p className="text-3xl font-bold text-slate-900 tracking-tight mt-1.5">{filteredPatients.length}</p>
            <p className="text-xs text-slate-400 mt-1">
              {hasActiveFilters ? 'Matching active filter criteria' : 'Active and registered clinic records'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <User className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Action Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
        <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search patients by name, email, code, or condition..."
                className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdown Popover (Replaces Date Controls) */}
            <div className="relative" ref={filterDropdownRef}>
              <button
                type="button"
                onClick={() => setShowFilterDropdown(prev => !prev)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 border rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  hasActiveFilters
                    ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
                }`}
                aria-expanded={showFilterDropdown}
                aria-haspopup="true"
              >
                <Filter className={`w-4 h-4 ${hasActiveFilters ? 'text-blue-600' : 'text-slate-500'}`} />
                <span>Filter</span>
                {hasActiveFilters && (
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {/* Dropdown Menu */}
              {showFilterDropdown && (
                <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200/80 p-4 z-40 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-blue-600" />
                      <h4 className="text-sm font-bold text-slate-900">Filter Patients</h4>
                    </div>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetAllFilters}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                      >
                        Reset all
                      </button>
                    )}
                  </div>

                  {/* Gender Filter */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Gender
                    </label>
                    <select
                      value={selectedGender}
                      onChange={(e) => setSelectedGender(e.target.value)}
                      className="w-full h-9 px-3 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="All">All Genders</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Not Specified">Not Specified</option>
                    </select>
                  </div>

                  {/* Blood Type Filter */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Blood Type
                    </label>
                    <select
                      value={selectedBloodType}
                      onChange={(e) => setSelectedBloodType(e.target.value)}
                      className="w-full h-9 px-3 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="All">All Blood Types</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Patient Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full h-9 px-3 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Age Range Filter */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Age Range
                    </label>
                    <select
                      value={selectedAgeRange}
                      onChange={(e) => setSelectedAgeRange(e.target.value)}
                      className="w-full h-9 px-3 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="All">All Ages</option>
                      <option value="0-17">Pediatric (0 - 17 yrs)</option>
                      <option value="18-35">Young Adult (18 - 35 yrs)</option>
                      <option value="36-50">Adult (36 - 50 yrs)</option>
                      <option value="51+">Senior (51+ yrs)</option>
                    </select>
                  </div>

                  {/* Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {filteredPatients.length} match{filteredPatients.length === 1 ? '' : 'es'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowFilterDropdown(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Reset Button if filters active */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200/60 transition-colors cursor-pointer"
                title="Reset all active filters"
              >
                <X className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-end xl:self-center">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Patient Table Container */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/75">
              <tr>
                <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Patient Code
                </th>
                <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Patient Name
                </th>
                <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Condition & Blood
                </th>
                <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Address
                </th>
                <th scope="col" className="px-5 py-3.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <tr
                    key={patient._id || patient.id}
                    className="hover:bg-slate-50/80 transition-colors duration-150 group"
                  >
                    {/* Patient Code */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center font-mono text-xs font-semibold text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-md border border-blue-100/80">
                        {patient.patientCode || patient.patient_code || 'N/A'}
                      </span>
                    </td>

                    {/* Patient Name & Details */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100/80 text-blue-600 flex items-center justify-center font-semibold text-xs shrink-0">
                          {patient.firstName ? patient.firstName[0].toUpperCase() : (patient.name ? patient.name[0].toUpperCase() : <User className="w-4 h-4" />)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 capitalize group-hover:text-blue-600 transition-colors">
                            {patient.name}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>{patient.gender || 'Not Specified'}</span>
                            {patient.age > 0 && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span>{patient.age} yrs</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{patient.phone || 'N/A'}</span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[170px]">{patient.email || 'No email'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Condition & Blood Type */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-xs font-medium text-slate-800 line-clamp-1">
                          {patient.condition || 'No condition specified'}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          {patient.bloodType && patient.bloodType !== 'Unknown' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                              Blood: {patient.bloodType}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">Blood: N/A</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Address Column */}
                    <td className="px-5 py-4 text-xs text-slate-700 max-w-[220px]">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="truncate" title={patient.address}>
                          {patient.address || 'Not provided'}
                        </span>
                      </div>
                    </td>

                    {/* Explicit Actions: View, Edit, Delete */}
                    <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        {/* 1. Explicit View Action */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/doctor-dashboard/patients/${patient._id || patient.id}`);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="View Patient Details"
                          aria-label={`View details for ${patient.name}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* 2. Explicit Edit Action */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal('edit', patient);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Edit Patient"
                          aria-label={`Edit ${patient.name}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* 3. Explicit Delete Action */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePatient(patient._id || patient.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Patient"
                          aria-label={`Delete ${patient.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                /* Clean Clinical Empty State */
                <tr>
                  <td colSpan={6} className="py-12 px-6 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-3">
                        <User className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800">No patients found</h3>
                      <p className="text-xs text-slate-500 mt-1 mb-4">
                        {searchTerm || hasActiveFilters
                          ? 'No patient records matched your active search query or filter criteria.'
                          : 'There are no patient records currently registered in your clinic.'}
                      </p>
                      {(searchTerm || hasActiveFilters) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('');
                            resetAllFilters();
                          }}
                          className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                        >
                          Clear all filters & search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <PatientModal
        showModal={showModal}
        selectedPatient={selectedPatient}
        closeModal={closeModal}
        modalType={modalType}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        formErrors={formErrors}
        setFormErrors={setFormErrors}
        apiError={apiError}
        setApiError={setApiError}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default PatientManagementPage;
