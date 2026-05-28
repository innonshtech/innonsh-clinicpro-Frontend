'use client';
import { API_BASE_URL } from '@/utils/api';
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion'
import { FaHeartbeat, FaUserInjured, FaClinicMedical } from 'react-icons/fa';
import { 
  User, Mail, Phone, Lock, Eye, EyeOff, Stethoscope, 
  Calendar, GraduationCap, MapPin, ChevronDown, 
  CheckCircle, AlertCircle, BadgeCheck, FileText, 
  Hospital, ArrowRight, ArrowLeft, ClipboardCheck,
  Clock, Image, X
} from 'lucide-react'

const specialties = [
  'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 
  'Dermatology', 'Psychiatry', 'Oncology', 'Gynecology',
  'Urology', 'Ophthalmology', 'ENT', 'General Medicine'
]

const qualifications = [
  'MBBS', 'MD', 'MS', 'DM', 'MCh', 'DNB', 
  'BDS', 'MDS', 'BPT', 'MPT', 'PhD'
]

const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say']

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const steps = [
  { id: 'personal', title: 'Personal Information' },
  { id: 'professional', title: 'Professional Details' },
  { id: 'availability', title: 'Availability' },
  { id: 'credentials', title: 'Credentials' },
  { id: 'review', title: 'Review' }
]

export default function DoctorSignup() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    profileImage: null,
    profileImageUrl: '',
    consultantFee: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    specialty: '',
    supSpeciality: '',
    experience: '',
    qualifications: [],
    licenseNumber: '',
    hospital: '',
    hospitalAddress: '',
    hospitalNumber: '',
    available: {
      days: [],
      time: ''
    }
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef(null)

  const uploadImageToCloudinary = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsSubmitting(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profileImage: reader.result }));
      };
      reader.readAsDataURL(file);

      const cloudinaryUrl = await uploadImageToCloudinary(file);
      setFormData(prev => ({ ...prev, profileImageUrl: cloudinaryUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      setErrors(prev => ({ ...prev, profileImage: 'Failed to upload image' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeProfileImage = () => {
    setFormData(prev => ({ ...prev, profileImage: null, profileImageUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const toggleDay = (day) => {
    setFormData(prev => {
      const newDays = prev.available.days.includes(day)
        ? prev.available.days.filter(d => d !== day)
        : [...prev.available.days, day]
      return {
        ...prev,
        available: {
          ...prev.available,
          days: newDays
        }
      }
    })
  }

  const toggleQualification = (qualification) => {
    setFormData(prev => {
      const newQualifications = prev.qualifications.includes(qualification)
        ? prev.qualifications.filter(q => q !== qualification)
        : [...prev.qualifications, qualification]
      return {
        ...prev,
        qualifications: newQualifications
      }
    })
  }

  const validateStep = (step) => {
    const newErrors = {}
    
    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
      if (!formData.profileImage) newErrors.profileImage = 'Profile image is required'
      if (!formData.dateOfBirth.trim()) newErrors.dateOfBirth = 'Date of birth is required'
      if (!formData.gender) newErrors.gender = 'Gender is required'
      if (!formData.email.trim()) newErrors.email = 'Email is required'
      else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Email is invalid'
      if (!formData.password) newErrors.password = 'Password is required'
      else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
      if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm password'
      else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
      if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
    } else if (step === 2) {
      if (!formData.specialty) newErrors.specialty = 'Specialty is required'
      if (!formData.experience.trim()) newErrors.experience = 'Experience is required'
      if (!formData.hospital.trim()) newErrors.hospital = 'Hospital/clinic is required'
      if (!formData.consultantFee) newErrors.consultantFee = 'Consultation fee is required'
      if (!formData.hospitalNumber.trim()) newErrors.hospitalNumber = 'Hospital contact number is required'
    } else if (step === 3) {
      if (formData.available.days.length === 0) newErrors.availableDays = 'Select at least one working day'
      if (!formData.available.time.trim()) newErrors.availableTime = 'Working hours are required'
    } else if (step === 4) {
      if (!formData.licenseNumber.trim()) newErrors.licenseNumber = 'License number is required'
      if (formData.qualifications.length === 0) newErrors.qualifications = 'Select at least one qualification'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    if (currentStep < steps.length) {
      nextStep();
      return;
    }

    setIsSubmitting(true);
    const cleanedData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth,
      consultantFee: formData.consultantFee,
      profileImage: formData.profileImageUrl,
      gender: formData.gender,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      specialty: formData.specialty,
      supSpeciality: formData.supSpeciality,
      experience: formData.experience,
      qualifications: formData.qualifications,
      licenseNumber: formData.licenseNumber,
      hospital: formData.hospital,
      hospitalAddress: formData.hospitalAddress,
      hospitalNumber: formData.hospitalNumber,
      available: formData.available
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/doctor/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
      } else {
        console.error('API Error:', result.message);
        setErrors({ submit: result.message || 'Registration failed' });
      }
    } catch (error) {
      console.error('Submission error:', error);
      setErrors({ submit: 'Network or server error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Animated Illustration Section */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:flex flex-col justify-center items-center"
        >
          <div className="relative w-full h-80">
            <img src="/pateint-login.png" alt="Doctor" className="h-full w-auto mx-auto" /> 
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-8 left-16 bg-white p-2 rounded-full shadow-lg"
            >
              <FaHeartbeat className="text-red-400 text-xl" />
            </motion.div>
            <motion.div
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute bottom-16 right-8 bg-white p-2 rounded-full shadow-lg"
            >
              <FaUserInjured className="text-blue-400 text-xl" />
            </motion.div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-16 right-16 bg-white p-2 rounded-full shadow-lg"
            >
              <FaClinicMedical className="text-indigo-400 text-xl" />
            </motion.div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mt-6 text-center">
            Join Our Medical Community
          </h2>
          <p className="text-gray-600 mt-2 text-center max-w-md text-sm">
            Connect with patients and provide exceptional care through our platform
          </p>
        </motion.div>

        {/* Multi-step Form */}
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.8 }}
              className="bg-white rounded-2xl shadow-xl p-6 text-center"
            >
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Registration Complete!
              </h2>
              <p className="text-gray-600 mb-4 text-sm">
                Your doctor account has been created successfully. Please log in to continue.
              </p>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
                <motion.div
                  className="h-full bg-indigo-600"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2 }}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/login')}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-2 px-6 rounded-lg shadow hover:shadow-md transition flex items-center gap-2 mx-auto text-sm"
              >
                <FaClinicMedical className="text-sm" />
                Proceed to Login
              </motion.button>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Doctor Registration</h1>
                  <p className="text-gray-500 text-sm">Step {currentStep} of {steps.length}</p>
                </div>
                <div className="flex space-x-2">
                  {steps.map((_, index) => (
                    <div 
                      key={index}
                      className={`w-2 h-2 rounded-full ${index + 1 <= currentStep ? 'bg-blue-500' : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={steps[currentStep - 1].id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {currentStep === 1 && (
                      <>
                        <h3 className="text-md font-semibold text-gray-800 flex items-center">
                          <User className="h-4 w-4 text-blue-600 mr-2" />
                          Personal Information
                        </h3>
                        <div className="flex flex-col items-center mb-4">
                          <div className="relative">
                            {formData.profileImage ? (
                              <>
                                <img 
                                  src={formData.profileImage} 
                                  alt="Profile" 
                                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                                />
                                <button
                                  type="button"
                                  onClick={removeProfileImage}
                                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </>
                            ) : (
                              <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <Image className="h-10 w-10 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                            id="profileImage"
                          />
                          <label
                            htmlFor="profileImage"
                            className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors text-sm"
                          >
                            {formData.profileImage ? 'Change Photo' : 'Upload Photo'}
                          </label>
                          {errors.profileImage && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" /> {errors.profileImage}
                            </p>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name*</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                className={`pl-9 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-2 text-sm ${errors.firstName ? 'border-red-300' : ''}`}
                                placeholder="John"
                                required
                              />
                            </div>
                            {errors.firstName && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" /> {errors.firstName}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name*</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                className={`pl-9 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-2 text-sm ${errors.lastName ? 'border-red-300' : ''}`}
                                placeholder="Doe"
                                required
                              />
                            </div>
                            {errors.lastName && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" /> {errors.lastName}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth*</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className={`pl-9 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-2 text-sm ${errors.dateOfBirth ? 'border-red-300' : ''}`}
                                required
                              />
                            </div>
                            {errors.dateOfBirth && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" /> {errors.dateOfBirth}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender*</label>
                            <div className="relative">
                              <select
                                value={formData.gender}
                                onChange={(e) => handleInputChange('gender', e.target.value)}
                                className={`w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-2 text-sm ${errors.gender ? 'border-red-300' : ''}`}
                                required
                              >
                                <option value="">Select gender</option>
                                {genderOptions.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                            {errors.gender && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" /> {errors.gender}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className={`pl-9 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-2 text-sm ${errors.email ? 'border-red-300' : ''}`}
                                placeholder="doctor@example.com"
                                required
                              />
                            </div>
                            {errors.email && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" /> {errors.email}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Phone className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                className={`pl-9 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-2 text-sm ${errors.phone ? 'border-red-300' : ''}`}
                                placeholder="+1 (555) 123-4567"
                                required
                              />
                            </div>
                            {errors.phone && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" /> {errors.phone}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password*</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                className={`pl-9 pr-8 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-2 text-sm ${errors.password ? 'border-red-300' : ''}`}
                                placeholder="••••••••"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            {errors.password && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" /> {errors.password}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Use 8 or more characters with a mix of letters, numbers & symbols
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password*</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={formData.confirmPassword}
                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                className={`pl-9 pr-8 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-2 text-sm ${errors.confirmPassword ? 'border-red-300' : ''}`}
                                placeholder="••••••••"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            {errors.confirmPassword && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" /> {errors.confirmPassword}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end pt-2">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={nextStep}
                            className="bg-blue-600 text-white py-2 px-5 rounded-lg shadow hover:bg-blue-700 transition text-sm"
                          >
                            Next: Professional Details
                          </motion.button>
                        </div>
                      </>
                    )}

                    {currentStep === 2 && (
                      <>
                        <h3 className="text-md font-semibold text-gray-800 flex items-center">
                          <Stethoscope className="h-4 w-4 text-blue-600 mr-2" />
                          Professional Details
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Specialty*</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Stethoscope className="h-4 w-4 text-gray-400" />
                              </div>
                              <select
                                value={formData.specialty}
                                onChange={(e) => handleInputChange('specialty', e.target.value)}
                                className={`w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-2 text-sm ${errors.specialty ? 'border-red-300' : ''}`}
                                required
                              >
                                <option value="">Select your specialty</option>
                                {specialties.map(specialty => (
                                  <option key={specialty} value={specialty}>{specialty}</option>
                                ))}
                              </select>
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                            {errors.specialty && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" /> {errors.specialty}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Specialty (Optional)</label>
                            <input
                              type="text"
                              value={formData.supSpeciality}
                              onChange={(e) => handleInputChange('supSpeciality', e.target.value)}
                              className="w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-2 text-sm"
                              placeholder="e.g. Pediatric Cardiology"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience*</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="number"
                                min="0"
                                max="50"
                                value={formData.experience}
                                onChange={(e) => handleInputChange('experience', e.target.value)}
                                className={`pl-9 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-2 text-sm ${errors.experience ? 'border-red-300' : ''}`}
                                placeholder="5"
                                required
                              />
                            </div>
                            {errors.experience && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" /> {errors.experience}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hospital/Clinic*</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Hospital className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                value={formData.hospital}
                                onChange={(e) => handleInputChange('hospital', e.target.value)}
                                className={`pl-9 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-2 text-sm ${errors.hospital ? 'border-red-300' : ''}`}
                                placeholder="Current workplace"
                                required
                              />
                            </div>
                            {errors.hospital && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" /> {errors.hospital}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Contact Number*</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Phone className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="tel"
                                value={formData.hospitalNumber}
                                onChange={(e) => handleInputChange('hospitalNumber', e.target.value)}
                                className={`pl-9 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-2 text-sm ${errors.hospitalNumber ? 'border-red-300' : ''}`}
                                placeholder="Hospital phone number"
                                required
                              />
                            </div>
                            {errors.hospitalNumber && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" /> {errors.hospitalNumber}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Address</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MapPin className="h-4 w-4 text-gray-400" />
                              </div>
                              <textarea
                                value={formData.hospitalAddress}
                                onChange={(e) => handleInputChange('hospitalAddress', e.target.value)}
                                className="pl-9 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-2 text-sm"
                                placeholder="Full hospital/clinic address"
                                rows="2"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹)*</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 text-sm">₹</span>
                              </div>
                              <input
                                type="number"
                                min="0"
                                value={formData.consultantFee}
                                onChange={(e) => handleInputChange('consultantFee', e.target.value)}
                                className={`pl-9 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-2 text-sm ${errors.consultantFee ? 'border-red-300' : ''}`}
                                placeholder="e.g. 500"
                                required
                              />
                            </div>
                            {errors.consultantFee && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" /> {errors.consultantFee}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between pt-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={prevStep}
                            className="text-gray-600 py-2 px-5 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-sm"
                          >
                            Back
                          </motion.button>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={nextStep}
                            className="bg-blue-600 text-white py-2 px-5 rounded-lg shadow hover:bg-blue-700 transition text-sm"
                          >
                            Next: Availability
                          </motion.button>
                        </div>
                      </>
                    )}

                    {currentStep === 3 && (
                      <>
                        <h3 className="text-md font-semibold text-gray-800 flex items-center">
                          <Clock className="h-4 w-4 text-blue-600 mr-2" />
                          Availability
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Working Days*</label>
                            <div className="flex flex-wrap gap-2">
                              {daysOfWeek.map(day => (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => toggleDay(day)}
                                  className={`px-3 py-1 rounded-full text-xs transition-all ${
                                    formData.available.days.includes(day)
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {day}
                                </button>
                              ))}
                            </div>
                            {errors.availableDays && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" /> {errors.availableDays}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours*</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Clock className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                value={formData.available.time}
                                onChange={(e) => handleInputChange('available.time', e.target.value)}
                                className={`pl-9 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-2 text-sm ${errors.availableTime ? 'border-red-300' : ''}`}
                                placeholder="e.g. 9:00 AM - 5:00 PM"
                                required
                              />
                            </div>
                            {errors.availableTime && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" /> {errors.availableTime}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between pt-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={prevStep}
                            className="text-gray-600 py-2 px-5 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-sm"
                          >
                            Back
                          </motion.button>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={nextStep}
                            className="bg-blue-600 text-white py-2 px-5 rounded-lg shadow hover:bg-blue-700 transition text-sm"
                          >
                            Next: Credentials
                          </motion.button>
                        </div>
                      </>
                    )}

                    {currentStep === 4 && (
                      <>
                        <h3 className="text-md font-semibold text-gray-800 flex items-center">
                          <ClipboardCheck className="h-4 w-4 text-blue-600 mr-2" />
                          Credentials
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Medical License Number*</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FileText className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                value={formData.licenseNumber}
                                onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                                className={`pl-9 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-2 text-sm ${errors.licenseNumber ? 'border-red-300' : ''}`}
                                placeholder="Enter your medical license number"
                                required
                              />
                            </div>
                            {errors.licenseNumber && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" /> {errors.licenseNumber}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications*</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {qualifications.map(qualification => (
                                <div key={qualification} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`qual-${qualification}`}
                                    checked={formData.qualifications.includes(qualification)}
                                    onChange={() => toggleQualification(qualification)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <label htmlFor={`qual-${qualification}`} className="ml-2 text-sm text-gray-700">
                                    {qualification}
                                  </label>
                                </div>
                              ))}
                            </div>
                            {errors.qualifications && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" /> {errors.qualifications}
                              </p>
                            )}
                          </div>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-start">
                              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                              <div className="text-xs text-blue-800">
                                <p className="font-medium mb-1">Document Verification</p>
                                <p>After registration, you'll need to upload the following documents for verification:</p>
                                <ul className="list-disc list-inside mt-1 space-y-0.5">
                                  <li>Medical license certificate</li>
                                  <li>Degree certificate</li>
                                  <li>Government-issued ID</li>
                                  <li>Hospital affiliation letter</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between pt-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={prevStep}
                            className="text-gray-600 py-2 px-5 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-sm"
                          >
                            Back
                          </motion.button>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={nextStep}
                            className="bg-blue-600 text-white py-2 px-5 rounded-lg shadow hover:bg-blue-700 transition text-sm"
                          >
                            Next: Review
                          </motion.button>
                        </div>
                      </>
                    )}

                    {currentStep === 5 && (
                      <>
                        <h3 className="text-md font-semibold text-gray-800 flex items-center">
                          <BadgeCheck className="h-4 w-4 text-blue-600 mr-2" />
                          Review Your Information
                        </h3>
                        <div className="space-y-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <h4 className="font-medium text-gray-700 mb-2 flex items-center text-sm">
                              <User className="h-3 w-3 text-blue-600 mr-2" />
                              Personal Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div>
                                <p className="text-gray-500">Full Name</p>
                                <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Date of Birth</p>
                                <p className="font-medium">{formData.dateOfBirth || 'Not provided'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Gender</p>
                                <p className="font-medium">{formData.gender || 'Not provided'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Email</p>
                                <p className="font-medium">{formData.email}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Phone</p>
                                <p className="font-medium">{formData.phone}</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <h4 className="font-medium text-gray-700 mb-2 flex items-center text-sm">
                              <Stethoscope className="h-3 w-3 text-blue-600 mr-2" />
                              Professional Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div>
                                <p className="text-gray-500">Specialty</p>
                                <p className="font-medium">{formData.specialty}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Sub-Specialty</p>
                                <p className="font-medium">{formData.supSpeciality || 'None'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Experience</p>
                                <p className="font-medium">{formData.experience} years</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Hospital/Clinic</p>
                                <p className="font-medium">{formData.hospital}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Hospital Contact</p>
                                <p className="font-medium">{formData.hospitalNumber}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Hospital Address</p>
                                <p className="font-medium">{formData.hospitalAddress || 'Not provided'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Consultation Fee</p>
                                <p className="font-medium">{formData.consultantFee ? `₹${formData.consultantFee}` : 'Not specified'}</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <h4 className="font-medium text-gray-700 mb-2 flex items-center text-sm">
                              <Clock className="h-3 w-3 text-blue-600 mr-2" />
                              Availability
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div>
                                <p className="text-gray-500">Working Days</p>
                                <p className="font-medium">{formData.available.days.length > 0 ? formData.available.days.join(', ') : 'Not specified'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Working Hours</p>
                                <p className="font-medium">{formData.available.time || 'Not specified'}</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <h4 className="font-medium text-gray-700 mb-2 flex items-center text-sm">
                              <GraduationCap className="h-3 w-3 text-blue-600 mr-2" />
                              Credentials
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div>
                                <p className="text-gray-500">License Number</p>
                                <p className="font-medium">{formData.licenseNumber}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Qualifications</p>
                                <p className="font-medium">{formData.qualifications.join(', ')}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <input
                              type="checkbox"
                              id="terms"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                              required
                            />
                            <label htmlFor="terms" className="ml-2 text-xs text-gray-700">
                              I certify that all information provided is accurate and complete. I agree to the{' '}
                              <a href="#" className="text-blue-600 hover:text-blue-500">Terms of Service</a> and{' '}
                              <a href="#" className="text-blue-600 hover:text-blue-500">Privacy Policy</a>.
                            </label>
                          </div>
                        </div>
                        <div className="flex justify-between pt-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={prevStep}
                            className="text-gray-600 py-2 px-5 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-sm"
                          >
                            Back
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-2 px-6 rounded-lg shadow hover:shadow-md transition flex items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed text-sm"
                          >
                            {isSubmitting ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                              </>
                            ) : (
                              <>
                                <FaClinicMedical className="text-sm" />
                                Complete Registration
                              </>
                            )}
                          </motion.button>
                        </div>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
                <div className="mt-6 text-center text-xs text-gray-500">
                  Already have an account? <a href="/login" className="text-blue-600 font-medium hover:text-blue-500">Sign in</a>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
