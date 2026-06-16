'use client';
import { API_BASE_URL } from '@/utils/api';
import { useState, useEffect,useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function ClinicSettings() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    clinicName: 'ClinicPro Clinic',
    address: '123 Main Street, City, Country',
    city: 'Metropolis',
    state: 'California',
    postalCode: '12345',
    country: 'United States',
    phone: '+1 (987) 654-3210',
    email: 'contact@clinicpro.com',
    website: 'https://clinicpro.com',
    registrationNumber: 'CL12345678',
    taxId: 'TAX987654',
    clinicType: 'general',
    specialties: ['Cardiology', 'Dermatology'],
    openingHours: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { open: '', close: '' },
      sunday: { open: '', close: '' },
    },
    description: 'A modern healthcare facility providing comprehensive medical services with cutting-edge technology and compassionate care.',
    logo: 'https://ui-avatars.com/api/?name=Clinic+Pro&background=random',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic');
  const fileInputRef = useRef(null);

  const fetchUserData = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/clinic/fetchProfileData/${id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const responseData = await res.json();
      if (responseData.success && responseData.data) {
        setFormData(responseData.data.clinic);
      } else {
        throw new Error(responseData.message || 'Failed to fetch clinic info');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to fetch profile data');
    } finally {
      setIsLoading(false);
    }
  };

useEffect(()=>{
  const user=localStorage.getItem('user')
  const userdata=JSON.parse(user);
  const id=userdata?.id
 fetchUserData(id); }, [])
  const clinicTypes = [
    { value: 'general', label: 'General Practice', icon: '🏥' },
    { value: 'specialty', label: 'Specialty Clinic', icon: '⚕️' },
    { value: 'dental', label: 'Dental Clinic', icon: '🦷' },
    { value: 'pediatric', label: 'Pediatric Clinic', icon: '👶' },
  ];

  const medicalSpecialties = [
    { name: 'Cardiology', icon: '❤️' },
    { name: 'Dermatology', icon: '🧴' },
    { name: 'Endocrinology', icon: '🧬' },
    { name: 'Gastroenterology', icon: '🫁' },
    { name: 'Neurology', icon: '🧠' },
    { name: 'Oncology', icon: '🎗️' },
    { name: 'Ophthalmology', icon: '👁️' },
    { name: 'Orthopedics', icon: '🦴' },
  ];

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: '📋' },
    { id: 'contact', label: 'Contact', icon: '📞' },
    { id: 'business', label: 'Business', icon: '💼' },
    { id: 'specialties', label: 'Specialties', icon: '⚕️' },
    { id: 'hours', label: 'Hours', icon: '🕐' },
  ];

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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsSubmitting(true);
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
      toast.success('Logo uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload logo');
    } finally {
      setIsSubmitting(false);
    }
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Clinic settings updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update clinic settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="group">
              <label htmlFor="clinicName" className="block text-sm font-semibold text-gray-700 mb-2">
                Clinic Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="clinicName"
                name="clinicName"
                value={formData.clinicName}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-blue-300 ${
                  errors.clinicName ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Enter clinic name"
              />
              {errors.clinicName && (
                <p className="mt-2 text-sm text-red-600 animate-shake">{errors.clinicName}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="group">
                <label htmlFor="clinicType" className="block text-sm font-semibold text-gray-700 mb-2">
                  Clinic Type
                </label>
                <select
                  id="clinicType"
                  name="clinicType"
                  value={formData.clinicType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-blue-300"
                >
                  {clinicTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="group">
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                Clinic Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-blue-300 resize-none"
                placeholder="Tell us about your clinic's mission and services..."
              />
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Clinic Logo
              </label>
              <div className="flex items-center space-x-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 border-4 border-white shadow-lg transition-transform duration-300 group-hover:scale-105">
                    {formData.logo ? (
                      <img src={formData.logo} alt="Clinic logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-blue-400">
                        🏥
                      </div>
                    )}
                  </div>
                </div>
                <label className="cursor-pointer group">
                  <div className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-all duration-300 flex items-center space-x-2">
                    <span>📷</span>
                    <span className="font-medium">Change Logo</span>
                  </div>
                  <input 
                    type="file" 
                    className="sr-only" 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    ref={fileInputRef}
                  />
                </label>
              </div>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="group">
              <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-green-100 focus:border-green-500 hover:border-green-300 ${
                  errors.address ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Street address"
              />
              {errors.address && (
                <p className="mt-2 text-sm text-red-600 animate-shake">{errors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="group">
                <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-green-100 focus:border-green-500 hover:border-green-300 ${
                    errors.city ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="City"
                />
                {errors.city && (
                  <p className="mt-2 text-sm text-red-600 animate-shake">{errors.city}</p>
                )}
              </div>

              <div className="group">
                <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-2">
                  State/Province
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-green-100 focus:border-green-500 hover:border-green-300"
                  placeholder="State or province"
                />
              </div>

              <div className="group">
                <label htmlFor="postalCode" className="block text-sm font-semibold text-gray-700 mb-2">
                  ZIP/Postal Code
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-green-100 focus:border-green-500 hover:border-green-300"
                  placeholder="Postal code"
                />
              </div>

              <div className="group">
                <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-green-100 focus:border-green-500 hover:border-green-300 ${
                    errors.country ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Country"
                />
                {errors.country && (
                  <p className="mt-2 text-sm text-red-600 animate-shake">{errors.country}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="group">
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-green-100 focus:border-green-500 hover:border-green-300 ${
                    errors.phone ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phone && (
                  <p className="mt-2 text-sm text-red-600 animate-shake">{errors.phone}</p>
                )}
              </div>

              <div className="group">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-green-100 focus:border-green-500 hover:border-green-300 ${
                    errors.email ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="contact@clinic.com"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 animate-shake">{errors.email}</p>
                )}
              </div>

              <div className="group">
                <label htmlFor="website" className="block text-sm font-semibold text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-green-100 focus:border-green-500 hover:border-green-300"
                  placeholder="https://yourclinic.com"
                />
              </div>
            </div>
          </div>
        );

      case 'business':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="group">
                <label htmlFor="registrationNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                  Business Registration Number
                </label>
                <input
                  type="text"
                  id="registrationNumber"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 hover:border-orange-300"
                  placeholder="Registration number"
                />
              </div>

              <div className="group">
                <label htmlFor="taxId" className="block text-sm font-semibold text-gray-700 mb-2">
                  Tax ID
                </label>
                <input
                  type="text"
                  id="taxId"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 hover:border-orange-300"
                  placeholder="Tax identification number"
                />
              </div>
            </div>
          </div>
        );

      case 'specialties':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {medicalSpecialties.map((specialty, index) => (
                <div 
                  key={specialty.name} 
                  className="group relative"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <input
                    type="checkbox"
                    id={`specialty-${specialty.name}`}
                    value={specialty.name}
                    checked={formData.specialties.includes(specialty.name)}
                    onChange={handleSpecialtyChange}
                    className="sr-only"
                  />
                  <label 
                    htmlFor={`specialty-${specialty.name}`}
                    className={`block p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                      formData.specialties.includes(specialty.name)
                        ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{specialty.icon}</span>
                      <span className="font-medium text-gray-800">{specialty.name}</span>
                      {formData.specialties.includes(specialty.name) && (
                        <span className="ml-auto text-purple-500">✓</span>
                      )}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'hours':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-4">
              {Object.entries(formData.openingHours).map(([day, hours], index) => (
                <div 
                  key={day} 
                  className="p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-indigo-300 transition-all duration-300 animate-slideInLeft"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full flex items-center justify-center">
                        <span className="font-bold text-indigo-600 capitalize">{day.slice(0, 2)}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 capitalize">{day}</h3>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="time"
                          value={hours.open}
                          onChange={(e) => handleOpeningHoursChange(day, 'open', e.target.value)}
                          disabled={!hours.open && !hours.close}
                          className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-400 transition-all duration-300"
                        />
                        <span className="text-gray-500 font-medium">to</span>
                        <input
                          type="time"
                          value={hours.close}
                          onChange={(e) => handleOpeningHoursChange(day, 'close', e.target.value)}
                          disabled={!hours.open && !hours.close}
                          className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-400 transition-all duration-300"
                        />
                      </div>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
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
                          className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Closed</span>
                      </label>
                    </div>
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
    <div className="min-h-screen bg-slate-50">






      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Clinic Settings
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage your clinic's profile and preferences
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto scrollbar-hide">
              <ul className="flex w-full">
                {tabs.map((tab) => (
                  <li key={tab.id} className="flex-1">
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center space-x-2 transition-colors duration-300 ${
                        activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-lg">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit}>
            <div className="p-8 sm:p-10">
              {renderTabContent()}
            </div>

            {/* Form Footer */}
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md ${
                  isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.5s ease-out forwards;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

