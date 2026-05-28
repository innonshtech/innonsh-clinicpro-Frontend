'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, User, Phone, Mail, Calendar, MapPin, FileText, Droplet, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { patientService } from '@/utils/patientService';

export default function EditPatientPage() {
  const router = useRouter();
  const { id } = useParams();
  const { token } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    phoneNumber: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    medicalHistory: '',
    allergies: '',
    currentMedications: '',
    symptoms: ''
  });

  useEffect(() => {
    const fetchPatient = async () => {
      if (!token || !id) return;
      
      try {
        setIsLoading(true);
        const result = await patientService.getPatientById(id, token);
        const patient = result.data.patient;
        
        // Map API data to form data
        setFormData({
          firstName: patient.firstName || '',
          lastName: patient.lastName || '',
          dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '',
          gender: patient.gender || '',
          bloodGroup: patient.bloodGroup || '',
          phoneNumber: patient.phoneNumber || '',
          email: patient.email || '',
          address: patient.address || '',
          city: patient.city || '',
          state: patient.state || '',
          zipCode: patient.zipCode || '',
          medicalHistory: patient.medicalHistory || '',
          allergies: patient.allergies || '',
          currentMedications: patient.currentMedications || '',
          symptoms: patient.symptoms || ''
        });
      } catch (err) {
        console.error('Error fetching patient:', err);
        setError('Failed to load patient records. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatient();
  }, [id, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      if (!token) throw new Error('You must be logged in to update patient records');
      
      await patientService.updatePatient(id, formData, token);
      setSuccess(true);
      
      // Show success briefly then redirect
      setTimeout(() => {
        router.push('/receptionist-dashboard/patients');
      }, 2000);
    } catch (error) {
      console.error('Error updating patient:', error);
      setError(error.message || 'An error occurred while saving the changes');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Loading patient records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center space-x-4 p-6 bg-white rounded-xl shadow-sm border border-blue-100">
          <Link 
            href="/receptionist-dashboard/patients" 
            className="p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-blue-600" />
          </Link>
          <div className="h-8 border-l border-blue-200" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Edit Patient Profile</h1>
            <p className="text-gray-500 mt-1">Updating records for {formData.firstName} {formData.lastName}</p>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mt-6 bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 animate-fade-in shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mt-6 bg-green-50 border-l-4 border-green-500 rounded-r-lg p-4 animate-bounce-subtle shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-700">Changes saved successfully! Redirecting...</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden transition-all duration-200 hover:shadow-md">
            <div className="px-6 py-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-blue-100/50">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-800">Personal Information</h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-blue-50/30"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-blue-50/30"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-blue-50/30 appearance-none"
                    />
                    <Calendar className="absolute right-3 top-3 h-5 w-5 text-blue-400 pointer-events-none" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-blue-50/30 appearance-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                  <div className="relative">
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-blue-50/30 appearance-none"
                    >
                      <option value="">Select blood group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                    <Droplet className="absolute right-3 top-3 h-5 w-5 text-red-500/70" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden transition-all duration-200 hover:shadow-md">
            <div className="px-6 py-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-blue-100/50">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <Phone className="w-5 h-5" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-800">Contact Details</h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 pl-12 border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-blue-50/30"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-blue-400" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 pl-12 border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-blue-50/30"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-blue-400" />
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Residential Address</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 pl-12 border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-blue-50/30"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-blue-400" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-blue-50/30"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-blue-50/30"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden transition-all duration-200 hover:shadow-md">
            <div className="px-6 py-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-blue-100/50">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-800">Medical Records</h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Symptoms</label>
                  <textarea
                    name="symptoms"
                    value={formData.symptoms}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-blue-50/30"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Medical History</label>
                    <textarea
                      name="medicalHistory"
                      value={formData.medicalHistory}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-blue-50/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allergies & Sensitivities</label>
                    <textarea
                      name="allergies"
                      value={formData.allergies}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-blue-50/30"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 pb-12">
            <Link
              href="/receptionist-dashboard/patients"
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-10 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
