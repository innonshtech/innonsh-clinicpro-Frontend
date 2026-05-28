'use client';
import { API_BASE_URL } from '@/utils/api';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiLock, FiCalendar } from 'react-icons/fi';
import { FaHeartbeat, FaUserInjured, FaClinicMedical } from 'react-icons/fa';

export default function PatientRegistration() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: '',
    dob: '', // This will store the date in YYYY-MM-DD format
    gender: '',
    bloodType: '',
    password: '',
    confirmPassword: ''
  });

  const [currentStep, setCurrentStep] = useState(1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value,
      ...(name === 'age' && {
        dob: value ? `${new Date().getFullYear() - parseInt(value)}-01-01` : ''
      })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep === 3) {
      try {
        if (formData.password !== formData.confirmPassword) {
          alert('Passwords do not match');
          return;
        }

        const submissionData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phone,
          dateOfBirth: formData.dob,
          gender: formData.gender,
          bloodGroup: formData.bloodType,
          password: formData.password
        };

        const response = await fetch(`${API_BASE_URL}/api/v1/patient/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(submissionData)
        });

        const result = await response.json();
        if (result.success) {
          alert('Registration successful!');
          window.location.href = '/login';
        } else {
          throw new Error(result.message || 'Registration failed');
        }
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:flex flex-col justify-center items-center"
        >
          <div className="relative w-full h-96">
            <img src="/pateint-login.png" alt="Doctor" width={500}/>
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-10 left-20 bg-white p-3 rounded-full shadow-lg"
            >
              <FaHeartbeat className="text-red-400 text-2xl" />
            </motion.div>
            <motion.div
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute bottom-20 right-10 bg-white p-3 rounded-full shadow-lg"
            >
              <FaUserInjured className="text-blue-400 text-2xl" />
            </motion.div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mt-8 text-center">Your Health Journey Starts Here</h2>
          <p className="text-gray-600 mt-2 text-center max-w-md">Join thousands of patients getting personalized care from top doctors</p>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden p-8"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Patient Registration</h1>
                <p className="text-gray-500">Step {currentStep} of 3</p>
              </div>
              <div className="flex space-x-2">
                {[1, 2, 3].map((step) => (
                  <div key={step} className={`w-3 h-3 rounded-full ${currentStep >= step ? 'bg-blue-500' : 'bg-gray-200'}`} />
                ))}
              </div>
            </div>

            <AnimatePresence mode='wait'>
              {currentStep === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiUser className="h-5 w-5 text-gray-400" /></div>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="pl-10 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-3" placeholder="John" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiUser className="h-5 w-5 text-gray-400" /></div>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="pl-10 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-3" placeholder="Doe" required />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiMail className="h-5 w-5 text-gray-400" /></div>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} className="pl-10 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-3" placeholder="your@email.com" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiPhone className="h-5 w-5 text-gray-400" /></div>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="pl-10 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-3" placeholder="+1 (555) 123-4567" required />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={nextStep} className="bg-blue-600 text-white py-3 px-6 rounded-lg shadow hover:bg-blue-700 transition">Next: Medical Info</motion.button>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiCalendar className="h-5 w-5 text-gray-400" /></div>
                      <input type="number" name="age" value={formData.age} onChange={handleChange} className="pl-10 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-3" placeholder="Enter age" required min="0" max="150" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-3" required>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
                    <select name="bloodType" value={formData.bloodType} onChange={handleChange} className="w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-3">
                      <option value="">Select blood type</option>
                      <option value="A+">A+</option><option value="A-">A-</option>
                      <option value="B+">B+</option><option value="B-">B-</option>
                      <option value="AB+">AB+</option><option value="AB-">AB-</option>
                      <option value="O+">O+</option><option value="O-">O-</option>
                    </select>
                  </div>
                  <div className="flex justify-between">
                    <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={prevStep} className="text-gray-600 py-3 px-6 rounded-lg border border-gray-200 hover:bg-gray-50 transition">Back</motion.button>
                    <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={nextStep} className="bg-blue-600 text-white py-3 px-6 rounded-lg shadow hover:bg-blue-700 transition">Next: Account Setup</motion.button>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Create Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiLock className="h-5 w-5 text-gray-400" /></div>
                      <input type="password" name="password" value={formData.password} onChange={handleChange} className="pl-10 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-3" placeholder="••••••••" required minLength="6" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiLock className="h-5 w-5 text-gray-400" /></div>
                      <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="pl-10 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-3" placeholder="••••••••" required />
                    </div>
                    {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                    )}
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-700 mb-2">Registration Summary:</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                      <p><strong>Email:</strong> {formData.email}</p>
                      <p><strong>Age:</strong> {formData.age}</p>
                      <p><strong>Gender:</strong> {formData.gender || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={prevStep} className="text-gray-600 py-3 px-6 rounded-lg border border-gray-200 hover:bg-gray-50 transition">Back</motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" disabled={formData.password !== formData.confirmPassword || !formData.password} className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><FaClinicMedical className="text-lg" />Complete Registration</motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mt-8 text-center text-sm text-gray-500">Already have an account? <a href="/login" className="text-blue-600 font-medium hover:text-blue-500">Sign in</a></div>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
