'use client';
import { API_BASE_URL } from '@/utils/api';
import { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Calendar, MapPin, Clock, Award, Stethoscope, Building, Upload, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function AddDoctorPage() {
  const Router = useRouter();
  const degreeCertRef = useRef(null);
const identityProofRef = useRef(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    profileImage: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    password: '',
    phone: '',
    specialty: '',
    homeAddress: '',
    supSpeciality: '',
    licenseNumber: '',
    experience: '',
    consultantFee: '',
     degreeCertificate: '',
  identityProof: '',
    city:'',
    qualifications: [''],
    clinicId: '',
    hospital: '',
    hospitalAddress: '',
    sessionTime:'',
    hospitalNumber: '',
    status:'active',
    // Changed to match API expectations
    availableDays: [],
    availableTime: "9:00 AM to 5:00 PM",
    // Keep these for UI management
    timeSlots: {
      from: { hour: '9', minute: '00', period: 'AM' },
      to: { hour: '5', minute: '00', period: 'PM' }
    }
  });
    const [clinicErrors, setClinicErrors] = useState({});

  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const fileInputRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const specialties = [
    'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology', 'Hematology',
    'Neurology', 'Oncology', 'Orthopedics', 'Pediatrics', 'Psychiatry', 'Radiology',
    'Surgery', 'Urology', 'Gynecology', 'Ophthalmology', 'ENT', 'Anesthesiology'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const fetchUserData = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/clinic/fetchProfileData/${id}`);
      if (!res.ok) throw new Error('Failed to fetch doctor info');
      const responseData = await res.json();
      
      if (!responseData.success) {
        throw new Error(responseData.message || 'Failed to fetch clinic info');
      }

      const data = responseData.data;
     
      setFormData(prev => ({
        ...prev,
        hospital: data.clinic.clinicName || '',
        hospitalAddress: `${data.clinic.address || ''}, ${data.clinic.city || ''}, ${data.clinic.state || ''}, ${data.clinic.country || ''} - ${data.clinic.postalCode || ''}`.replace(/^,\s*|,\s*$/g, ''),
        hospitalNumber: data.clinic.phone || '',
        licenseNumber: data.clinic.registrationNumber || "", 
        city:data.clinic.city,
        clinicId: id
      }));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const user = localStorage.getItem('user');
    const userdata = JSON.parse(user);
    const id = userdata?.id;
    fetchUserData(id);
  }, []);

  const handleQualificationChange = (index, value) => {
    const newQualifications = [...formData.qualifications];
    newQualifications[index] = value;
    setFormData(prev => ({
      ...prev,
      qualifications: newQualifications
    }));
  };
const handleDegreeCertificateChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    setIsSubmitting(true);
    const cloudinaryUrl = await uploadImageToCloudinary(file);
    setFormData(prev => ({ ...prev, degreeCertificate: cloudinaryUrl }));
  } catch (error) {
    console.error('Error uploading degree certificate:', error);
  } finally {
    setIsSubmitting(false);
  }
};

const handleIdentityProofChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    setIsSubmitting(true);
    const cloudinaryUrl = await uploadImageToCloudinary(file);
    setFormData(prev => ({ ...prev, identityProof: cloudinaryUrl }));
  } catch (error) {
    console.error('Error uploading identity proof:', error);
  } finally {
    setIsSubmitting(false);
  }
};
  const addQualification = () => {
    setFormData(prev => ({
      ...prev,
      qualifications: [...prev.qualifications, '']
    }));
  };

  const removeQualification = (index) => {
    const newQualifications = formData.qualifications.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      qualifications: newQualifications
    }));
  };

  const handleDayToggle = (day) => {
    const newDays = formData.availableDays.includes(day)
      ? formData.availableDays.filter(d => d !== day)
      : [...formData.availableDays, day];
    
    setFormData(prev => ({
      ...prev,
      availableDays: newDays
    }));
  };

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
      
      // First create a local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profileImage: reader.result }));
      };
      reader.readAsDataURL(file);

      // Then upload to Cloudinary
      const cloudinaryUrl = await uploadImageToCloudinary(file);
      setFormData(prev => ({ ...prev, profileImage: cloudinaryUrl }));
      setImagePreview(cloudinaryUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeChange = (type, field, value) => {
    setFormData(prev => {
      const newTimeSlots = {
        ...prev.timeSlots,
        [type]: {
          ...prev.timeSlots[type],
          [field]: value
        }
      };
      
      // Create the time string to match API expectations
      const timeString = `${newTimeSlots.from.hour}:${newTimeSlots.from.minute} ${newTimeSlots.from.period} to ${newTimeSlots.to.hour}:${newTimeSlots.to.minute} ${newTimeSlots.to.period}`;
      
      return {
        ...prev,
        availableTime: timeString,
        timeSlots: newTimeSlots
      };
    });
  };
  const checkEmailAvailability = async (email) => {
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return 'Please enter a valid email address';
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/check-email`, { 
      email 
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.data.success || !response.data.data.available) {
      return `This email is already registered as a ${response.data.data.existsIn || 'user'}`;
    }
    return '';
  } catch (error) {
    console.error('Error checking email:', error);
    return 'Error checking email availability. Please try again.';
  }
};
  //  const checkEmailAvailability = async (email) => {
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/api/check-email`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ email }),
  //     });

  //     if (!response.ok) {
  //       throw new Error('Network response was not ok');
  //     }

  //     const data = await response.json();
  //     if (!data.available) {
  //       return `This email is already registered as a ${data.existsIn}`;
  //     }
  //     return null;
  //   } catch (error) {
  //     console.error('Error checking email:', error);
  //     return 'Error checking email availability';
  //   }
  // };
const handleSubmit = async (e) => {
  e.preventDefault();

  if (currentStep !== 3) {
    return;
  }

  try {
    setIsSubmitting(true);
    const { timeSlots, availableDays, availableTime, ...rest } = formData;
    const apiData = {
      ...rest,
      status: formData.status,
      available: {
        days: availableDays,
        time: availableTime
      }
    };
    console.log('Submitting data:', apiData);
    
     const response = await axios.post(`${API_BASE_URL}/api/v1/clinic/doctor-add`, apiData);
    
    // Axios puts the response data in response.data
    const responseData = response.data;
    
    if (responseData.success) {
      alert(responseData.message || "Doctor Added Successfully");
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        profileImage: '',
        dateOfBirth: '',
        gender: '',
        email: '',
        password: '',
        phone: '',
        specialty: '',
        supSpeciality: '',
        licenseNumber: '',
        experience: '',
        sessionTime: '',
        consultantFee: '',
         degreeCertificate: '',
  identityProof: '',
        qualifications: [''],
        clinicId: formData.clinicId,
        hospital: formData.hospital,
        hospitalAddress: formData.hospitalAddress,
        hospitalNumber: formData.hospitalNumber,
        city: formData.city,
        homeAddress: '',
        availableDays: [],
        availableTime: "9:00 AM to 5:00 PM",
        timeSlots: {
          from: { hour: '9', minute: '00', period: 'AM' },
          to: { hour: '5', minute: '00', period: 'PM' }
        }
      });
      setCurrentStep(1);
      
      Router.refresh();
      Router.push("/clinic/doctors");
    } else {
      throw new Error(response.data.message || 'Registration failed');
    }
  } catch (err) {
    console.error('Error:', err.response?.data?.message || err.message);
    alert(err.response?.data?.message || err.message || 'Registration failed');
  } finally {
    setIsSubmitting(false);
  }
};
  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   if (currentStep !== 3) {
  //     return;
  //   }

  //   try {
  //     // Prepare data for API - remove UI-only fields
  //     const { timeSlots, ...apiData } = formData;
      
  //     console.log('Submitting data:', apiData);
      
  //      const response = await axios.post(`${API_BASE_URL}/api/clinic/doctor-add`, apiData);
  //      const datt=await response.json();
  //      console.log(datt);
  //     console.log('Success: Register');
  //     alert("Doctor Added Successfully");
      
  //     // Reset form
  //     setFormData({
  //       firstName: '',
  //       lastName: '',
  //       profileImage: '',
  //       dateOfBirth: '',
  //       gender: '',
  //       email: '',
  //       password: '',
  //       phone: '',
  //       specialty: '',
  //       supSpeciality: '',
  //       licenseNumber: '',
  //       experience: '',
  //       sessionTime:'',
  //       consultantFee: '',
  //       qualifications: [''],
  //       clinicId: formData.clinicId,
  //       hospital: formData.hospital,
  //       hospitalAddress: formData.hospitalAddress,
  //       hospitalNumber: formData.hospitalNumber,
  //       city:formData.city,
  //       homeAddress: '',
  //       availableDays: [],
  //       availableTime: "9:00 AM to 5:00 PM",
  //       timeSlots: {
  //         from: { hour: '9', minute: '00', period: 'AM' },
  //         to: { hour: '5', minute: '00', period: 'PM' }
  //       }
  //     });
  //     setCurrentStep(1);
      
  //     Router.refresh();
  //     Router.push("/clinic/doctors");
  //   } catch (err) {
  //     console.log('Error:', err.response?.data?.message || 'Registration failed');
  //     alert(err.response?.data?.message || 'Registration failed');
  //   }
  // };
const nextStep = async (e) => {
  e.preventDefault();
  
  // Validate email if we're on step 1
  if (currentStep === 1 && formData.email) {
    const emailError = await checkEmailAvailability(formData.email);
    if (emailError) {
      setErrors(prev => ({ ...prev, email: emailError }));
      return; // Don't proceed if email is invalid or taken
    }
  }
  
  if (currentStep < 3) setCurrentStep(currentStep + 1);
};
  // const nextStep = (e) => {
  //   e.preventDefault();
  //   if (currentStep < 3) setCurrentStep(currentStep + 1);
  // };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Add New Doctor
          </h1>
          <p className="text-gray-600">Complete the form to register a new doctor in the system</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {currentStep} of 3</span>
            <span className="text-sm text-gray-500">
              {currentStep === 1 && 'Personal Information'}
              {currentStep === 2 && 'Professional Details'}
              {currentStep === 3 && 'Hospital & Availability'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <div className="space-y-6">
            
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <User className="inline w-4 h-4 mr-2" />
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <User className="inline w-4 h-4 mr-2" />
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Upload className="inline w-4 h-4 mr-2" />
                    Profile Image
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    id="profileImage"
                  />
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Choose Image
                    </button>
                    {imagePreview && (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
                        <img 
                          src={imagePreview} 
                          alt="Profile preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                  {isSubmitting && <p className="text-sm text-gray-500">Uploading image...</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Calendar className="inline w-4 h-4 mr-2" />
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                      required
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Mail className="inline w-4 h-4 mr-2" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      // onChange={handleInputChange}
                       onChange={async (e) => {
                    const email = e.target.value;
                    handleInputChange(e);

                    // Check email availability only if it's a valid email format
                    if (/^\S+@\S+\.\S+$/.test(email)) {
                      const errorMessage = await checkEmailAvailability(email);
                      setClinicErrors(prev => ({
                        ...prev,
                        email: errorMessage || ''
                      }));
                    }
                  }}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                      placeholder="doctor@example.com"
                      required
                    />
                  </div> */}
                  <div className="space-y-2">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    <Mail className="inline w-4 h-4 mr-2" />
    Email Address
  </label>
  <input
    type="email"
    name="email"
    value={formData.email}
    onChange={async (e) => {
      const email = e.target.value;
      handleInputChange(e);
      
      // Clear previous errors
      setErrors(prev => ({ ...prev, email: '' }));
      
      // Only validate if it looks like an email
      if (email && /^\S+@\S+\.\S+$/.test(email)) {
        const errorMessage = await checkEmailAvailability(email);
        if (errorMessage) {
          setErrors(prev => ({ ...prev, email: errorMessage }));
        }
      }
    }}
    onBlur={async (e) => {
      // Validate again on blur to ensure we catch any missed validations
      if (e.target.value && !errors.email) {
        const errorMessage = await checkEmailAvailability(e.target.value);
        if (errorMessage) {
          setErrors(prev => ({ ...prev, email: errorMessage }));
        }
      }
    }}
    className={`w-full px-4 py-3 rounded-xl border ${
      errors.email ? 'border-red-500' : 'border-gray-200'
    } focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none`}
    placeholder="doctor@example.com"
    required
  />
  {errors.email && (
    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
  )}
</div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Phone className="inline w-4 h-4 mr-2" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                      placeholder="Enter secure password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <MapPin className="inline w-4 h-4 mr-2" />
                    Home Address
                  </label>
                  <textarea
                    name="homeAddress"
                    value={formData.homeAddress}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                    placeholder="Enter your home address"
                    rows="3"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Professional Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Stethoscope className="inline w-4 h-4 mr-2" />
                      Specialty
                    </label>
                    <select
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                      required
                    >
                      <option value="">Select specialty</option>
                      {specialties.map(specialty => (
                        <option key={specialty} value={specialty}>{specialty}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sub-Specialty
                    </label>
                    <input
                      type="text"
                      name="supSpeciality"
                      value={formData.supSpeciality}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                      placeholder="Enter sub-specialty (optional)"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Award className="inline w-4 h-4 mr-2" />
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                      placeholder="Years of experience"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Consultant Fee (₹)
                    </label>
                    <input
                      type="number"
                      name="consultantFee"
                      value={formData.consultantFee}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                      placeholder="Consultation fee"
                      min="0"
                    />
                  </div>
                </div>
                 <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        <Award className="inline w-4 h-4 mr-2" />
        Degree Certificate
      </label>
      <input
        type="file"
        onChange={handleDegreeCertificateChange}
        accept="image/*,.pdf"
        className="hidden"
        id="degreeCertificate"
        ref={degreeCertRef}
      />
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => degreeCertRef.current.click()}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
        >
          Upload Degree Certificate
        </button>
        {formData.degreeCertificate && (
          <span className="text-sm text-green-600">
            ✓ Certificate uploaded
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500">Upload a clear scan of your medical degree certificate (JPG, PNG)</p>
    </div>

    {/* Identity Proof Upload */}
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        <User className="inline w-4 h-4 mr-2" />
        Identity Proof
      </label>
      <input
        type="file"
        onChange={handleIdentityProofChange}
        accept="image/*,.pdf"
        className="hidden"
        id="identityProof"
        ref={identityProofRef}
      />
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => identityProofRef.current.click()}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
        >
          Upload Identity Proof
        </button>
        {formData.identityProof && (
          <span className="text-sm text-green-600">
            ✓ Identity proof uploaded
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500">Upload a government-issued ID (Driving License, Passport, etc.)</p>
    </div>

                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    <Award className="inline w-4 h-4 mr-2" />
                    Qualifications
                  </label>
                  {formData.qualifications.map((qualification, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={qualification}
                        onChange={(e) => handleQualificationChange(index, e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                        placeholder="Enter qualification (e.g., MBBS, MD)"
                      />
                      {formData.qualifications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQualification(index)}
                          className="px-4 py-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addQualification}
                    className="text-purple-600 hover:text-purple-800 font-medium transition-colors"
                  >
                    + Add Another Qualification
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Hospital & Availability */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Building className="inline w-4 h-4 mr-2" />
                    Hospital Name
                  </label>
                  <input
                    type="text"
                    name="hospital"
                    value={formData.hospital}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                    placeholder="Hospital or clinic name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <MapPin className="inline w-4 h-4 mr-2" />
                    Hospital Address
                  </label>
                  <textarea
                    name="hospitalAddress"
                    value={formData.hospitalAddress}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                    placeholder="Complete hospital address"
                    rows="3"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="inline w-4 h-4 mr-2" />
                    Hospital Phone Number
                  </label>
                  <input
                    type="tel"
                    name="hospitalNumber"
                    value={formData.hospitalNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                    placeholder="Hospital contact number"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="inline w-4 h-4 mr-2" />
                    Hospital City
                  </label>
                  <input
                    type="tel"
                    name="hospitalCity"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                    placeholder="Hospital City"
                    required
                  />
                </div>
<div className="space-y-2">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    <Clock className="inline w-4 h-4 mr-2" />
    Session Time (minutes)
  </label>
  <input
    type="number"
    name="sessionTime"
    value={formData.sessionTime}
    onChange={handleInputChange}
    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
    placeholder="e.g., 30"
    min="1"
    required
  />
</div>
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    <Clock className="inline w-4 h-4 mr-2" />
                    Available Days
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {days.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(day)}
                        className={`px-4 py-2 rounded-xl border-2 transition-all font-medium ${
                          formData.availableDays.includes(day)
                            ? 'border-purple-500 bg-purple-500 text-white'
                            : 'border-gray-200 hover:border-purple-300 text-gray-700'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Clock className="inline w-4 h-4 mr-2" />
                    Available Time
                  </label>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* From Time */}
                    <div className="space-y-2">
                      <label className="block text-sm text-gray-600 mb-1">From</label>
                      <div className="flex gap-2">
                        {/* Hour */}
                        <select
                          value={formData.timeSlots.from.hour}
                          onChange={(e) => handleTimeChange('from', 'hour', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                        >
                          {Array.from({length: 12}, (_, i) => i + 1).map(hour => (
                            <option key={`from-hour-${hour}`} value={hour}>{hour}</option>
                          ))}
                        </select>
                        
                        {/* Minute */}
                        <select
                          value={formData.timeSlots.from.minute}
                          onChange={(e) => handleTimeChange('from', 'minute', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                        >
                          <option value="00">00</option>
                          <option value="15">15</option>
                          <option value="30">30</option>
                          <option value="45">45</option>
                        </select>
                        
                        {/* AM/PM */}
                        <select
                          value={formData.timeSlots.from.period}
                          onChange={(e) => handleTimeChange('from', 'period', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* To Time */}
                    <div className="space-y-2">
                      <label className="block text-sm text-gray-600 mb-1">To</label>
                      <div className="flex gap-2">
                        {/* Hour */}
                        <select
                          value={formData.timeSlots.to.hour}
                          onChange={(e) => handleTimeChange('to', 'hour', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                        >
                         {Array.from({length: 12}, (_, i) => i + 1).map(hour => (
                            <option key={`to-hour-${hour}`} value={hour}>{hour}</option>
                          ))}
                        </select>
                        
                        {/* Minute */}
                        <select
                          value={formData.timeSlots.to.minute}
                          onChange={(e) => handleTimeChange('to', 'minute', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                        >
                          <option value="00">00</option>
                          <option value="15">15</option>
                          <option value="30">30</option>
                          <option value="45">45</option>
                        </select>
                        
                        {/* AM/PM */}
                        <select
                          value={formData.timeSlots.to.period}
                          onChange={(e) => handleTimeChange('to', 'period', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Display formatted time */}
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Selected Time:</strong> {formData.availableTime}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  currentStep === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                disabled={currentStep === 1}
              >
                Previous
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl ${
                    isSubmitting
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                  }`}
                >
                  {isSubmitting ? 'Adding Doctor...' : 'Add Doctor'}
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Success Message */}
        {success && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Doctor Added Successfully!</h3>
              <p className="text-gray-600 mb-6">The new doctor has been registered in the system.</p>
              <button
                onClick={() => setSuccess(false)}
                className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
