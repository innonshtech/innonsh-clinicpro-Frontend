'use client';
import { API_BASE_URL } from '@/utils/api';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ClinicRegistrationForm() {
  const [formData, setFormData] = useState({
    clinicName: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phone: '',
    email: '',
    website: '',
    registrationNumber: '',
    password: '',
    taxId: '',
    clinicType: 'general',
    specialties: [],
    openingHours: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { open: '', close: '' },
      sunday: { open: '', close: '' },
    },
    description: '',
    logo: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const fileInputRef = useRef(null);

  const clinicTypes = [
    { value: 'general', label: 'General Practice' },
    { value: 'specialty', label: 'Specialty Clinic' },
    { value: 'dental', label: 'Dental Clinic' },
    { value: 'pediatric', label: 'Pediatric Clinic' },
    { value: 'surgical', label: 'Surgical Center' },
    { value: 'diagnostic', label: 'Diagnostic Center' },
  ];

  const medicalSpecialties = [
    'Cardiology',
    'Dermatology',
    'Endocrinology',
    'Gastroenterology',
    'Neurology',
    'Oncology',
    'Ophthalmology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Pulmonology',
    'Rheumatology',
    'Urology',
  ];

  const steps = [
    { title: 'Basic Info', icon: '📋' },
    { title: 'Contact', icon: '📞' },
    { title: 'Business', icon: '💼' },
    { title: 'Specialties', icon: '⚕️' },
    { title: 'Hours', icon: '🕐' },
  ];

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSpecialtyChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      if (checked) {
        return {
          ...prev,
          specialties: [...prev.specialties, value]
        };
      } else {
        return {
          ...prev,
          specialties: prev.specialties.filter(s => s !== value)
        };
      }
    });
  };

  const handleOpeningHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day],
          [field]: value
        }
      }
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      logo: e.target.files[0]
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.clinicName.trim()) {
      newErrors.clinicName = 'Clinic name is required';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\+\-\(\)]{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, number, and special character';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format openingHours as per backend expectation
      const formattedOpeningHours = {};
      for (const [day, hours] of Object.entries(formData.openingHours)) {
        formattedOpeningHours[day] = {
          open: hours.open || '',
          close: hours.close || '',
        };
      }

      const registrationData = {
        ...formData,
        openingHours: formattedOpeningHours,
        // For now, we handle logo separately or as a placeholder if not using multipart
        logo: formData.logo ? 'logo-placeholder' : null, 
      };

      const response = await fetch(`${API_BASE_URL}/api/v1/clinic/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccessMessage('Clinic registered successfully! Waiting for admin approval.');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: error.message || 'Failed to register clinic. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Information
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
                📋
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                Basic Information
              </h2>
              <p className="text-gray-600 mt-1 text-sm">Let's start with the basics about your clinic</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700 mb-1">
                  Clinic Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="clinicName"
                  name="clinicName"
                  value={formData.clinicName}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.clinicName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter clinic name"
                />
                {errors.clinicName && <p className="mt-1 text-xs text-red-600">{errors.clinicName}</p>}
              </div>
              
              <div>
                <label htmlFor="clinicType" className="block text-sm font-medium text-gray-700 mb-1">
                  Clinic Type
                </label>
                <select
                  id="clinicType"
                  name="clinicType"
                  value={formData.clinicType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {clinicTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Clinic Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Tell us about your clinic's mission and services..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clinic Logo
              </label>
              <div className="flex items-center space-x-3">
                <div className="inline-block h-14 w-14 rounded-full overflow-hidden bg-gray-100">
                  {formData.logo ? (
                    <img src="/pateint-login.png" alt="Doctor" width={500}/>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xl text-gray-400">
                      🏥
                    </div>
                  )}
                </div>
                <label className="cursor-pointer">
                  <span className="px-3 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Upload Logo
                  </span>
                  <input type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                </label>
              </div>
            </div>
          </div>
        );

      case 1: // Contact Information
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
                📞
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                Contact Information
              </h2>
              <p className="text-gray-600 mt-1 text-sm">How can patients reach your clinic?</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Street address"
                />
                {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
              </div>
              
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="City"
                />
                {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
              </div>
              
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="State or province"
                />
              </div>
              
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP/Postal Code
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Postal code"
                />
              </div>
              
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.country ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Country"
                />
                {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country}</p>}
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="contact@clinic.com"
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>
              
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://yourclinic.com"
                />
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Create a secure password"
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 text-sm"
                    onClick={() => {
                      const passwordInput = document.getElementById('password');
                      if (passwordInput.type === 'password') {
                        passwordInput.type = 'text';
                      } else {
                        passwordInput.type = 'password';
                      }
                    }}
                  >
                    👁️
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}
                <div className="mt-1 text-xs text-gray-500">
                  Password must contain:
                  <ul className="list-disc pl-4 mt-1 space-y-0.5">
                    <li className={formData.password.length >= 8 ? 'text-green-500' : ''}>At least 8 characters</li>
                    <li className={/[A-Z]/.test(formData.password) ? 'text-green-500' : ''}>One uppercase letter</li>
                    <li className={/[a-z]/.test(formData.password) ? 'text-green-500' : ''}>One lowercase letter</li>
                    <li className={/\d/.test(formData.password) ? 'text-green-500' : ''}>One number</li>
                    <li className={/[@$!%*?&]/.test(formData.password) ? 'text-green-500' : ''}>One special character</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // Business Information
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
                💼
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                Business Information
              </h2>
              <p className="text-gray-600 mt-1 text-sm">Official business details and registration</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Registration Number
                </label>
                <input
                  type="text"
                  id="registrationNumber"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Registration number"
                />
              </div>
              
              <div>
                <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-1">
                  Tax ID
                </label>
                <input
                  type="text"
                  id="taxId"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Tax identification number"
                />
              </div>
            </div>
          </div>
        );

      case 3: // Specialties
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
                ⚕️
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                Medical Specialties
              </h2>
              <p className="text-gray-600 mt-1 text-sm">Select the specialties your clinic offers</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {medicalSpecialties.map(specialty => (
                <div key={specialty} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`specialty-${specialty}`}
                    value={specialty}
                    checked={formData.specialties.includes(specialty)}
                    onChange={handleSpecialtyChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`specialty-${specialty}`} className="ml-2 block text-sm text-gray-700">
                    {specialty}
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      case 4: // Opening Hours
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
                🕐
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                Opening Hours
              </h2>
              <p className="text-gray-600 mt-1 text-sm">When is your clinic open for patients?</p>
            </div>
            <div className="space-y-4">
              {Object.entries(formData.openingHours).map(([day, hours]) => (
                <div key={day} className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center">
                  <label className="block text-sm font-medium text-gray-700 capitalize sm:text-right">
                    {day}
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="time"
                      value={hours.open}
                      onChange={(e) => handleOpeningHoursChange(day, 'open', e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={!hours.open && !hours.close}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    />
                    <span className="text-gray-500 text-sm flex-shrink-0">to</span>
                    <input
                      type="time"
                      value={hours.close}
                      onChange={(e) => handleOpeningHoursChange(day, 'close', e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={!hours.open && !hours.close}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                  <div className="flex items-center justify-start sm:justify-center">
                    <input
                      type="checkbox"
                      checked={!hours.open && !hours.close}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleOpeningHoursChange(day, 'open', '');
                          handleOpeningHoursChange(day, 'close', '');
                        } else {
                          handleOpeningHoursChange(day, 'open', '09:00');
                          handleOpeningHoursChange(day, 'close', '17:00');
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700 whitespace-nowrap">
                      Closed
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Side - Image */}
        <div className="md:w-2/5 bg-gradient-to-br from-blue-900 to-purple-900 p-6 hidden md:flex items-center justify-center">
          <div className="text-center">
            <Image 
              src="/clinic-registration.jpg"
              alt="Clinic Registration"
              width={300}
              height={300}
              className="rounded-lg shadow-md mb-4"
            />
            <h2 className="text-xl font-bold text-white mb-1">Register Your Clinic</h2>
            <p className="text-blue-200 text-sm">Join our network of healthcare providers</p>
          </div>
        </div>
        
        {/* Right Side - Form */}
        <div className="md:w-3/5 p-6 md:p-8">
          {/* Progress Steps */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              {steps.map((step, index) => (
                <div key={step.title} className="flex flex-col items-center">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= index ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                  >
                    {step.icon}
                  </div>
                  <span className={`text-xs mt-1 ${currentStep >= index ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${(currentStep + 1) * 20}%` }}
              ></div>
            </div>
          </div>
          
          {successMessage ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">
                Registration Successful!
              </h3>
              <p className="text-gray-600 mb-4 text-sm">{successMessage}</p>
              <div className="animate-pulse text-gray-500 text-xs">
                Redirecting to dashboard...
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-1">Clinic Registration</h1>
                <p className="text-gray-600 text-sm">Step {currentStep + 1} of {steps.length}</p>
              </div>
              
              <form onSubmit={handleSubmit}>
                {renderStepContent()}
                
                <div className="mt-8 flex justify-between">
                  {currentStep > 0 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Back
                    </button>
                  )}
                  
                  {currentStep < steps.length - 1 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`ml-auto px-5 py-2 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                        isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Registering...
                        </>
                      ) : 'Register Clinic'}
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
