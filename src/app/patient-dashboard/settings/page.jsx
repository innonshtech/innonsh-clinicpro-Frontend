'use client';
import { API_BASE_URL } from '@/utils/api';
import { 
  FiUser, FiMail, FiPhone, FiLock, FiCalendar, 
  FiMapPin, FiHome, FiDroplet, FiClipboard, 
  FiAlertTriangle, FiPieChart, FiShield 
} from 'react-icons/fi'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { useEffect, useState } from 'react'

export default function SettingsPage() {
  const [patientData, setPatientData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    medicalHistory: '',
    allergies: '',
    currentMedications: '',
    symptoms: '',
    bloodType: '',
    password: '',
    role: ''
  });
  const [userId, setId] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const data = JSON.parse(userData);
      setId(data.id);
    }
  }, []);
console.log("asdf",userId)
  const fetchPatientData = async () => {
    if (!userId) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/patient/fetch-by-id/${userId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      console.log("API Response:", data);
      
      if (data.patient) {
        // Format date for the date input field
        let formattedDate = '';
        if (data.patient.dateOfBirth) {
          const dateObj = new Date(data.patient.dateOfBirth);
          formattedDate = dateObj.toISOString().split('T')[0];
        }
        
        setPatientData({
          firstName: data.patient.firstName || '',
          lastName: data.patient.lastName || '',
          dateOfBirth: formattedDate,
          gender: data.patient.gender || '',
          phone: data.patient.phone || '',
          email: data.patient.email || '',
          address: data.patient.address || '',
          city: data.patient.city || '',
          state: data.patient.state || '',
          zipCode: data.patient.zipCode || '',
          medicalHistory: data.patient.medicalHistory || '',
          allergies: data.patient.allergies || '',
          currentMedications: data.patient.currentMedications || '',
          symptoms: data.patient.symptoms || '',
          bloodType: data.patient.bloodType || '',
          password: data.patient.password || '',
          role: data.patient.role || ''
        });
      }
    } catch (err) {
      console.log("Internal Server Error", err);
    }
  }

  useEffect(() => {
    fetchPatientData();
  }, [userId])

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;
    
    try {
      const submissionData = {
        ...patientData,
        dateOfBirth: patientData.dateOfBirth 
          ? new Date(patientData.dateOfBirth).toISOString()
          : null
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/patient/update/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });
      
      const data = await res.json();
      if (data.success) {
        alert('Profile updated successfully');
      } else {
        alert(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Error updating profile');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-blue-800">Patient Profile</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Personal Information */}
        <Card title="Personal Information" className="border border-blue-100 bg-white rounded-xl mb-6">
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">First Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="text-blue-400" />
                  </div>
                  <input
                    type="text"
                    value={patientData.firstName}
                    onChange={(e) => setPatientData({...patientData, firstName: e.target.value})}
                    className="w-full pl-10 rounded-lg border-blue-100 bg-blue-50 focus:border-blue-300 focus:ring-2 focus:ring-blue-200 py-2.5 px-4 text-blue-800 placeholder-blue-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">Last Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="text-blue-400" />
                  </div>
                  <input
                    type="text"
                    value={patientData.lastName}
                    onChange={(e) => setPatientData({...patientData, lastName: e.target.value})}
                    className="w-full pl-10 rounded-lg border-blue-100 bg-blue-50 focus:border-blue-300 focus:ring-2 focus:ring-blue-200 py-2.5 px-4 text-blue-800 placeholder-blue-400"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">Date of Birth</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <FiCalendar className="text-blue-400" />
                  </div>
                  <input
                    type="date"
                    value={patientData.dateOfBirth || ''}
                    onChange={(e) => setPatientData({...patientData, dateOfBirth: e.target.value})}
                    className="w-full pl-10 rounded-lg border-blue-100 bg-blue-50 focus:border-blue-300 focus:ring-2 focus:ring-blue-200 py-2.5 px-4 text-blue-800 placeholder-blue-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">Gender</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="text-blue-400" />
                  </div>
                  <select
                    value={patientData.gender}
                    onChange={(e) => setPatientData({...patientData, gender: e.target.value})}
                    className="w-full pl-10 rounded-lg border-blue-100 bg-blue-50 focus:border-blue-300 focus:ring-2 focus:ring-blue-200 py-2.5 px-4 text-blue-800 appearance-none"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="text-blue-400" />
                  </div>
                  <input
                    type="email"
                    value={patientData.email}
                    onChange={(e) => setPatientData({...patientData, email: e.target.value})}
                    className="w-full pl-10 rounded-lg border-blue-100 bg-blue-50 focus:border-blue-300 focus:ring-2 focus:ring-blue-200 py-2.5 px-4 text-blue-800 placeholder-blue-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiPhone className="text-blue-400" />
                  </div>
                  <input
                    type="tel"
                    value={patientData.phone}
                    onChange={(e) => setPatientData({...patientData, phone: e.target.value})}
                    className="w-full pl-10 rounded-lg border-blue-100 bg-blue-50 focus:border-blue-300 focus:ring-2 focus:ring-blue-200 py-2.5 px-4 text-blue-800 placeholder-blue-400"
                  />
                </div>
              </div>
            </div>

            </div>
          
        </Card>

        {/* Medical Information */}
        <Card title="Medical Information" className="border border-blue-100 bg-white rounded-xl mb-6">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">Blood Type</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiDroplet className="text-blue-400" />
                </div>
                <select
                  value={patientData.bloodType}
                  onChange={(e) => setPatientData({...patientData, bloodType: e.target.value})}
                  className="w-full pl-10 rounded-lg border-blue-100 bg-blue-50 focus:border-blue-300 focus:ring-2 focus:ring-blue-200 py-2.5 px-4 text-blue-800 appearance-none"
                >
                  <option value="">Select Blood Type</option>
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
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
