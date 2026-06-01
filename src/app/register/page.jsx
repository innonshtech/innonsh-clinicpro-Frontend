'use client';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';
import { FiUser, FiMail, FiPhone, FiLock, FiCalendar } from 'react-icons/fi';
import { FaHeartbeat, FaUserInjured, FaClinicMedical, FaStethoscope } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/utils/api';

const specialties = [
  'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics',
  'Dermatology', 'Psychiatry', 'Oncology', 'Gynecology',
  'Urology', 'Ophthalmology', 'ENT', 'General Medicine'
];


const qualifications = [
  'MBBS', 'MD', 'MS', 'DM', 'MCh', 'DNB',
  'BDS', 'MDS', 'BPT', 'MPT', 'PhD'
];

const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const doctorSteps = [
  { id: 'personal', title: 'Personal Information', icon: FiUser },
  { id: 'professional', title: 'Professional Details', icon: FaStethoscope },
  { id: 'availability', title: 'Availability', icon: FiCalendar },
  { id: 'credentials', title: 'Credentials', icon: FiLock },
  { id: 'review', title: 'Review', icon: FaClinicMedical }
];

export default function RegistrationPortal() {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showClinicModal, setShowClinicModal] = useState(false);
  // Add these state variables with your other useState declarations
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const [isUploadingGst, setIsUploadingGst] = useState(false);
  const licenseFileInputRef = useRef(null);
  const gstFileInputRef = useRef(null);
  // Clinic form state
  const [clinicFormData, setClinicFormData] = useState({
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
    licenseDocument: null,
    licenseDocumentUrl: '',
    gstDocument: null,
    gstDocumentUrl: '',
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
    is24x7: false,
    status: 'pending'// Add this new field
  });
  const [newSpecialtyInput, setNewSpecialtyInput] = useState('');
  const [showNewSpecialtyInput, setShowNewSpecialtyInput] = useState(false);

  const [currentClinicStep, setCurrentClinicStep] = useState(0);
  const [isClinicSubmitting, setIsClinicSubmitting] = useState(false);
  const [clinicRegistrationSuccess, setClinicRegistrationSuccess] = useState(false);
  const [clinicErrors, setClinicErrors] = useState({});
  const [patientErrors, setPatientErrors] = useState({});

  const clinicFileInputRef = useRef(null);
  // Patient form state

  const checkEmailAvailability = async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const responseData = await response.json();
      if (!responseData.success || !responseData.data.available) {
        return `This email is already registered `;
      }
      return null;
    } catch (error) {
      console.error('Error checking email:', error);
      return 'Error checking email availability';
    }
  };
  const [patientFormData, setPatientFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    bloodType: '',
    password: '',
    confirmPassword: ''
  });
  const [currentPatientStep, setCurrentPatientStep] = useState(1);
  const [isPatientLoading, setIsPatientLoading] = useState(false);
  const [patientRegistrationSuccess, setPatientRegistrationSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Doctor form state
  const degreeCertFileInputRef = useRef(null);
  const identityProofFileInputRef = useRef(null);
  const [currentDoctorStep, setCurrentDoctorStep] = useState(0);
  const [previousDoctorStep, setPreviousDoctorStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [doctorFormData, setDoctorFormData] = useState({
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
    sessionTime: '',
    experience: '',

    qualifications: [],
    licenseNumber: '',
    degreeCertificate: null, // Added degree certificate
    degreeCertificateUrl: '', // Added degree certificate URL
    identityProof: null, // Added identity proof
    identityProofUrl: '', // Added identity proof URL
    status: 'pending',
    hospital: '',
    hospitalAddress: '',
    hospitalNumber: '',
    available: {
      days: [],
      time: "9:00 AM to 5:00 PM",  // API format
      timeSlots: {                  // UI format
        from: { hour: '9', minute: '00', period: 'AM' },
        to: { hour: '5', minute: '00', period: 'PM' }

      }
    }
  });
  const [doctorErrors, setDoctorErrors] = useState({});
  const [isDoctorSubmitting, setIsDoctorSubmitting] = useState(false);
  const [doctorSuccess, setDoctorSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const handleDegreeCertificateChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploadingLicense(true);
      const cloudinaryUrl = await uploadImageToCloudinary(file);
      setDoctorFormData(prev => ({
        ...prev,
        degreeCertificate: file,
        degreeCertificateUrl: cloudinaryUrl
      }));
    } catch (error) {
      console.error('Error uploading degree certificate:', error);
    } finally {
      setIsUploadingLicense(false);
    }
  };

  const handleIdentityProofChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploadingGst(true);
      const cloudinaryUrl = await uploadImageToCloudinary(file);
      setDoctorFormData(prev => ({
        ...prev,
        identityProof: file,
        identityProofUrl: cloudinaryUrl
      }));
    } catch (error) {
      console.error('Error uploading identity proof:', error);
    } finally {
      setIsUploadingGst(false);
    }
  };

  const removeDegreeCertificate = () => {
    setDoctorFormData(prev => ({
      ...prev,
      degreeCertificate: null,
      degreeCertificateUrl: ''
    }));
    if (degreeCertFileInputRef.current) {
      degreeCertFileInputRef.current.value = '';
    }
  };

  const removeIdentityProof = () => {
    setDoctorFormData(prev => ({
      ...prev,
      identityProof: null,
      identityProofUrl: ''
    }));
    if (identityProofFileInputRef.current) {
      identityProofFileInputRef.current.value = '';
    }
  };
  const roles = [
    {
      id: 'clinic-registration',
      title: 'Clinic',
      description: 'Register your healthcare facility with our platform',
      icon: '🏥',
      color: 'from-blue-600 to-indigo-600'
    }
  ];
  const steps = [
    { title: 'Basic Info', icon: '📋' },
    { title: 'Contact', icon: '📞' },
    { title: 'Business', icon: '💼' },
    { title: 'Specialties', icon: '⚕️' },
    { title: 'Hours', icon: '🕐' },
  ];
  // Patient form handlers
  const handlePatientFormChange = (e) => {
    const { name, value } = e.target;
    setPatientFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    console.log("this is data", patientFormData)
    if (currentPatientStep === 3) {
      setIsPatientLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/patient/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...patientFormData,
            phoneNumber: patientFormData.phone,
            dateOfBirth: patientFormData.dob,
            bloodGroup: patientFormData.bloodType
          })

        });

        const responseData = await response.json();
        if (responseData.success) {
          console.log('Registration successful:', responseData.data);
          setPatientRegistrationSuccess(true);

          setTimeout(() => {
            setPatientFormData({
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              dob: '',
              gender: '',
              bloodType: '',
              password: '',
              confirmPassword: ''
            });
            setCurrentPatientStep(1);
            setIsPatientLoading(false);
            setShowPatientModal(false);
            setPatientRegistrationSuccess(false);
          }, 2000);
        } else {
          console.error('Registration failed:', responseData.message);
          alert(`Registration failed: ${responseData.message || 'Server Error'}`);
          setIsPatientLoading(false);
        }
      } catch (err) {
        console.error('Error submitting form:', err);
        alert('Network or server error occurred');
        setIsPatientLoading(false);
      }
    }
  };

  const nextPatientStep = () => setCurrentPatientStep(prev => prev + 1);
  const prevPatientStep = () => setCurrentPatientStep(prev => prev - 1);
  const handleLicenseDocumentChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploadingLicense(true);
      const cloudinaryUrl = await uploadImageToCloudinary(file);
      setClinicFormData(prev => ({
        ...prev,
        licenseDocument: file,
        licenseDocumentUrl: cloudinaryUrl
      }));
    } catch (error) {
      console.error('Error uploading license document:', error);
    } finally {
      setIsUploadingLicense(false);
    }
  };

  const handleGstDocumentChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploadingGst(true);
      const cloudinaryUrl = await uploadImageToCloudinary(file);
      setClinicFormData(prev => ({
        ...prev,
        gstDocument: file,
        gstDocumentUrl: cloudinaryUrl
      }));
    } catch (error) {
      console.error('Error uploading GST document:', error);
    } finally {
      setIsUploadingGst(false);
    }
  };

  // const handleGstDocumentChange = async (e) => {
  //   const file = e.target.files[0];
  //   if (!file) return;

  //   try {
  //     setIsClinicSubmitting(true);
  //     const cloudinaryUrl = await uploadImageToCloudinary(file);
  //     setClinicFormData(prev => ({ 
  //       ...prev, 
  //       gstDocument: file,
  //       gstDocumentUrl: cloudinaryUrl 
  //     }));
  //   } catch (error) {
  //     console.error('Error uploading GST document:', error);
  //   } finally {
  //     setIsClinicSubmitting(false);
  //   }
  // };

  const removeLicenseDocument = () => {
    setClinicFormData(prev => ({
      ...prev,
      licenseDocument: null,
      licenseDocumentUrl: ''
    }));
    if (licenseFileInputRef.current) {
      licenseFileInputRef.current.value = '';
    }
  };

  const removeGstDocument = () => {
    setClinicFormData(prev => ({
      ...prev,
      gstDocument: null,
      gstDocumentUrl: ''
    }));
    if (gstFileInputRef.current) {
      gstFileInputRef.current.value = '';
    }
  };
  // Doctor form handlers
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

const handleDoctorInputChange = (field, value) => {
  // Handle nested fields (like timeSlots)
  if (field.includes('.')) {
    const [parent, child, subChild, subSubChild] = field.split('.');
    
    setDoctorFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [child]: subSubChild 
          ? {
              ...prev[parent][child],
              [subChild]: {
                ...prev[parent][child][subChild],
                [subSubChild]: value
              }
            }
          : subChild
            ? {
                ...prev[parent][child],
                [subChild]: value
              }
            : value
      }
    }));
  } else {
    setDoctorFormData(prev => ({ ...prev, [field]: value }));
  }
  
  // Clear any existing errors for this field
  if (doctorErrors[field]) {
    setDoctorErrors(prev => ({ ...prev, [field]: '' }));
  }
};

  // const handleDoctorInputChange = (field, value) => {
  //   if (field.includes('.')) {
  //     const [parent, child] = field.split('.');
  //     setDoctorFormData(prev => ({
  //       ...prev,
  //       [parent]: {
  //         ...prev[parent],
  //         [child]: value
  //       }
  //     }));
  //   } else {
  //     setDoctorFormData(prev => ({ ...prev, [field]: value }));
  //   }

  //   if (doctorErrors[field]) {
  //     setDoctorErrors(prev => ({ ...prev, [field]: '' }));
  //   }
  // };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsDoctorSubmitting(true);

      const reader = new FileReader();
      reader.onloadend = () => {
        setDoctorFormData(prev => ({ ...prev, profileImage: reader.result }));
      };
      reader.readAsDataURL(file);

      const cloudinaryUrl = await uploadImageToCloudinary(file);
      setDoctorFormData(prev => ({ ...prev, profileImageUrl: cloudinaryUrl }));

    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsDoctorSubmitting(false);
    }
  };

  const removeProfileImage = () => {
    setDoctorFormData(prev => ({ ...prev, profileImage: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleDay = (day) => {
    setDoctorFormData(prev => {
      const newDays = prev.available.days.includes(day)
        ? prev.available.days.filter(d => d !== day)
        : [...prev.available.days, day];
      return {
        ...prev,
        available: {
          ...prev.available,
          days: newDays
        }
      }
    });
  };

  const toggleQualification = (qualification) => {
    setDoctorFormData(prev => {
      const newQualifications = prev.qualifications.includes(qualification)
        ? prev.qualifications.filter(q => q !== qualification)
        : [...prev.qualifications, qualification];
      return {
        ...prev,
        qualifications: newQualifications
      }
    });
  };

  const validateDoctorStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      if (!doctorFormData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!doctorFormData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!doctorFormData.profileImage) newErrors.profileImage = 'Profile image is required';
      if (!doctorFormData.dateOfBirth.trim()) newErrors.dateOfBirth = 'Date of birth is required';
      if (!doctorFormData.gender) newErrors.gender = 'Gender is required';
      if (!doctorFormData.email.trim()) newErrors.email = 'Email is required';
      else if (!/^\S+@\S+\.\S+$/.test(doctorFormData.email)) newErrors.email = 'Email is invalid';
      if (!doctorFormData.password) newErrors.password = 'Password is required';
      else if (doctorFormData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      if (!doctorFormData.confirmPassword) newErrors.confirmPassword = 'Please confirm password';
      else if (doctorFormData.password !== doctorFormData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      if (!doctorFormData.phone.trim()) newErrors.phone = 'Phone is required';
    } else if (step === 1) {
      if (!doctorFormData.specialty) newErrors.specialty = 'Specialty is required';
      if (!doctorFormData.experience.trim()) newErrors.experience = 'Experience is required';
      if (!doctorFormData.hospital.trim()) newErrors.hospital = 'Hospital/clinic is required';
      if (!doctorFormData.consultantFee) newErrors.consultantFee = 'Consultation fee is required';
      if (!doctorFormData.hospitalNumber.trim()) newErrors.hospitalNumber = 'Hospital contact number is required';
    } else if (step === 2) {
      if (doctorFormData.available.days.length === 0) newErrors.availableDays = 'Select at least one working day';
      if (!doctorFormData.available.timeSlots.from.hour ||
        !doctorFormData.available.timeSlots.to.hour) {
        newErrors.availableTime = 'Working hours are required';
      }
    } else if (step === 3) {
      if (!doctorFormData.licenseNumber.trim()) newErrors.licenseNumber = 'License number is required';
      if (doctorFormData.qualifications.length === 0) newErrors.qualifications = 'Select at least one qualification';
    }

    setDoctorErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextDoctorStep = () => {
    if (validateDoctorStep(currentDoctorStep)) {
      setPreviousDoctorStep(currentDoctorStep);
      setCurrentDoctorStep(prev => Math.min(prev + 1, doctorSteps.length - 1));
    }
  };

  const prevDoctorStep = () => {
    setPreviousDoctorStep(currentDoctorStep);
    setCurrentDoctorStep(prev => Math.max(prev - 1, 0));
  };
  const handleDoctorSubmit = async (e) => {
    e.preventDefault();

    if (!validateDoctorStep(currentDoctorStep)) {
      return;
    }

    if (currentDoctorStep < doctorSteps.length - 1) {
      nextDoctorStep();
      return;
    }

    setIsDoctorSubmitting(true);

    const cleanedData = {
      firstName: doctorFormData.firstName,
      lastName: doctorFormData.lastName,
      dateOfBirth: doctorFormData.dateOfBirth,
      consultantFee: doctorFormData.consultantFee,
      profileImage: doctorFormData.profileImageUrl,
      gender: doctorFormData.gender,
      email: doctorFormData.email,
      password: doctorFormData.password,
      phone: doctorFormData.phone,
      specialty: doctorFormData.specialty,
      supSpeciality: doctorFormData.supSpeciality,
      sessionTime: doctorFormData.sessionTime,
      experience: doctorFormData.experience,
      qualifications: doctorFormData.qualifications,
      licenseNumber: doctorFormData.licenseNumber,
      degreeCertificate: doctorFormData.degreeCertificateUrl,
      identityProof: doctorFormData.identityProofUrl,
      status: doctorFormData.status,
      hospital: doctorFormData.hospital,
      hospitalAddress: doctorFormData.hospitalAddress,
      hospitalNumber: doctorFormData.hospitalNumber,
      available: doctorFormData.available
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/doctor/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      });

      const responseData = await response.json();

      if (responseData.success) {
        console.log('Submission successful:', responseData.data);
        setDoctorSuccess(true);

      // Reset form and close modal after 2 seconds
      setTimeout(() => {
        setDoctorFormData({
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
          sessionTime: '',
          experience: '',
          qualifications: [],
          licenseNumber: '',
          degreeCertificate: null,
          degreeCertificateUrl: '',
          identityProof: null,
          identityProofUrl: '',
          status: 'pending',
          hospital: '',
          hospitalAddress: '',
          hospitalNumber: '',
          available: {
            days: [],
            time: "9:00 AM to 5:00 PM",
            timeSlots: {
              from: {
                hour: '9',
                minute: '00',
                period: 'AM'
              },
              to: {
                hour: '5',
                minute: '00',
                period: 'PM'
              }
            }
          }
        });
        setCurrentDoctorStep(0);
        setShowDoctorModal(false);
        router.push('/login'); // Redirect to login page
      }, 2000);
    } else {
      console.error('Submission failed:', responseData.message);
      alert(`Registration failed: ${responseData.message || 'Please try again'}`);
    }
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsDoctorSubmitting(false);
    }
  };
  //   const handleDoctorSubmit = async (e) => {
  //     e.preventDefault();

  //     if (!validateDoctorStep(currentDoctorStep)) {
  //       return;
  //     }

  //     if (currentDoctorStep < doctorSteps.length - 1) {
  //       nextDoctorStep();
  //       return;
  //     }

  //     setIsDoctorSubmitting(true);
  //     // const cleanedData = {
  //     //   firstName: doctorFormData.firstName,
  //     //   lastName: doctorFormData.lastName,
  //     //   dateOfBirth: doctorFormData.dateOfBirth,
  //     //   consultantFee: doctorFormData.consultantFee,
  //     //   profileImage: doctorFormData.profileImageUrl,
  //     //   gender: doctorFormData.gender,
  //     //   email: doctorFormData.email,
  //     //   password: doctorFormData.password,
  //     //   phone: doctorFormData.phone,
  //     //   specialty: doctorFormData.specialty,
  //     //   supSpeciality: doctorFormData.supSpeciality,
  //     //   experience: doctorFormData.experience,
  //     //   qualifications: doctorFormData.qualifications,
  //     //   licenseNumber: doctorFormData.licenseNumber,
  //     //   hospital: doctorFormData.hospital,
  //     //   hospitalAddress: doctorFormData.hospitalAddress,
  //     //   hospitalNumber: doctorFormData.hospitalNumber,
  //     //   available: doctorFormData.available
  //     // };

  //     const cleanedData = {
  //   firstName: doctorFormData.firstName,
  //   lastName: doctorFormData.lastName,
  //   dateOfBirth: doctorFormData.dateOfBirth,
  //   consultantFee: doctorFormData.consultantFee,
  //   profileImage: doctorFormData.profileImageUrl,
  //   gender: doctorFormData.gender,
  //   email: doctorFormData.email,
  //   password: doctorFormData.password,
  //   phone: doctorFormData.phone,
  //   specialty: doctorFormData.specialty,
  //   supSpeciality: doctorFormData.supSpeciality,
  //   sessionTime: doctorFormData.sessionTime, // Added
  //   experience: doctorFormData.experience,
  //   qualifications: doctorFormData.qualifications,
  //   licenseNumber: doctorFormData.licenseNumber,
  //   degreeCertificate: doctorFormData.degreeCertificateUrl, // Added
  //   identityProof: doctorFormData.identityProofUrl, // Added
  //   status: doctorFormData.status, // Added
  //   hospital: doctorFormData.hospital,
  //   hospitalAddress: doctorFormData.hospitalAddress,
  //   hospitalNumber: doctorFormData.hospitalNumber,
  //   available: doctorFormData.available
  // };
  // console.log("data",cleanedData);
  //     try {

  //       const response = await fetch(`${API_BASE_URL}/api/doctor/register`, {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify(cleanedData),
  //       });

  //       const data = await response.json();

  //       if (!response.ok) {
  //         console.error('API Error:', data.message);
  //         return;
  //       }

  //       console.log('Submission successful:', data);
  //       setDoctorSuccess(true);
  //     } catch (error) {
  //       console.error('Submission error:', error);
  //     } finally {
  //       setIsDoctorSubmitting(false);
  //     }
  //   };

  const handleCardClick = (roleId) => {
    if (roleId === 'patient-registration') {
      setShowPatientModal(true);
    } else if (roleId === 'doctor-registration') {
      setShowDoctorModal(true);
    } else if (roleId === 'clinic-registration') {
      setShowClinicModal(true);
    }
  };



  const handleClinicInputChange = (e) => {
    const { name, value } = e.target;
    setClinicFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is changed
    if (clinicErrors[name]) {
      setClinicErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleClinicSpecialtyChange = (e) => {
    const { value, checked } = e.target;
    setClinicFormData(prev => {
      if (checked) {
        return { ...prev, specialties: [...prev.specialties, value] };
      } else {
        return { ...prev, specialties: prev.specialties.filter(s => s !== value) };
      }
    });
  };

  // const handleClinicSpecialtyChange = (e) => {
  //   const { value, checked } = e.target;
  //   setClinicFormData(prev => {
  //     if (checked) {
  //       return { ...prev, specialties: [...prev.specialties, value] };
  //     } else {
  //       return { ...prev, specialties: prev.specialties.filter(s => s !== value) };
  //     }
  //   });
  // };

  const handleClinicOpeningHoursChange = (day, field, value) => {
    setClinicFormData(prev => ({
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

  const handleClinicFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsClinicSubmitting(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setClinicFormData(prev => ({ ...prev, profileImage: reader.result }));
      };
      reader.readAsDataURL(file);

      const cloudinaryUrl = await uploadImageToCloudinary(file);
      setClinicFormData(prev => ({ ...prev, logo: cloudinaryUrl }));
    } catch (error) {
      console.error('Error uploading clinic logo:', error);
    } finally {
      setIsClinicSubmitting(false);
    }
  };
  const clinicTypes = [
    { value: 'general', label: 'General Practice', icon: '🏥' },
    { value: 'specialty', label: 'Specialty Clinic', icon: '⚕️' },
    { value: 'dental', label: 'Dental Clinic', icon: '🦷' },
    { value: 'pediatric', label: 'Pediatric Clinic', icon: '👶' },
    { value: 'surgical', label: 'Surgical Center', icon: '🏥' },
    { value: 'diagnostic', label: 'Diagnostic Center', icon: '🔬' },
  ];

  const validateClinicStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      if (!clinicFormData.clinicName.trim()) newErrors.clinicName = 'Clinic name is required';
    }
    else if (step === 1) {
      if (!clinicFormData.email.trim()) newErrors.email = 'Email is required';
      else if (!/^\S+@\S+\.\S+$/.test(clinicFormData.email)) newErrors.email = 'Invalid email format';
      if (!clinicFormData.password) newErrors.password = 'Password is required';
      else if (clinicFormData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    }
    else if (step === 2) {
      // Step 2 (Business Information) is now completely optional
    }

    setClinicErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  // const validateClinicStep = (step) => {
  //   const newErrors = {};

  //   if (step === 0) {
  //     if (!clinicFormData.clinicName.trim()) newErrors.clinicName = 'Clinic name is required';
  //     if (!clinicFormData.clinicType) newErrors.clinicType = 'Clinic type is required';
  //   } 
  //   else if (step === 1) {
  //     if (!clinicFormData.address.trim()) newErrors.address = 'Address is required';
  //     if (!clinicFormData.city.trim()) newErrors.city = 'City is required';
  //     if (!clinicFormData.country.trim()) newErrors.country = 'Country is required';
  //     if (!clinicFormData.phone.trim()) newErrors.phone = 'Phone is required';
  //     if (!clinicFormData.email.trim()) newErrors.email = 'Email is required';
  //     else if (!/^\S+@\S+\.\S+$/.test(clinicFormData.email)) newErrors.email = 'Invalid email format';
  //     if (!clinicFormData.password) newErrors.password = 'Password is required';
  //     else if (clinicFormData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
  //   }
  //   // Add validation for other steps as needed

  //   setClinicErrors(newErrors);
  //   return Object.keys(newErrors).length === 0;
  // };
  const nextClinicStep = () => {
    if (validateClinicStep(currentClinicStep)) {
      setCurrentClinicStep(prev => prev + 1);
    }
  };

  const prevClinicStep = () => {
    setCurrentClinicStep(prev => Math.max(prev - 1, 0));
  };
  const handleAddNewSpecialty = () => {
    const trimmedInput = newSpecialtyInput.trim();

    if (!trimmedInput) return;

    if (trimmedInput.length > 30) {
      alert('Specialty name must be 30 characters or less');
      return;
    }

    if (medicalSpecialties.some(s => s.name.toLowerCase() === trimmedInput.toLowerCase())) {
      alert('This specialty already exists');
      return;
    }

    const newSpecialty = {
      name: trimmedInput,
      icon: '➕'
    };

    // Update both the medicalSpecialties state and clinicFormData.specialties
    setMedicalSpecialties(prev => [...prev, newSpecialty]);
    setClinicFormData(prev => ({
      ...prev,
      specialties: [...prev.specialties, newSpecialty.name]
    }));

    setNewSpecialtyInput('');
    setShowNewSpecialtyInput(false);
  };
  // const handleAddNewSpecialty = () => {
  //   const trimmedInput = newSpecialtyInput.trim();

  //   if (!trimmedInput) return;

  //   if (trimmedInput.length > 30) {
  //     alert('Specialty name must be 30 characters or less');
  //     return;
  //   }

  //   if (medicalSpecialties.some(s => s.name.toLowerCase() === trimmedInput.toLowerCase())) {
  //     alert('This specialty already exists');
  //     return;
  //   }

  //   const newSpecialty = {
  //     name: trimmedInput,
  //     icon: '➕'
  //   };

  //   setClinicFormData(prev => ({
  //     ...prev,
  //     specialties: [...prev.specialties, newSpecialty.name]
  //   }));

  //   medicalSpecialties.push(newSpecialty);
  //   setNewSpecialtyInput('');
  //   setShowNewSpecialtyInput(false);
  // };

  const handleSpecialtyKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddNewSpecialty();
    }
  };

  // const handleClinicSubmit = async (e) => {
  // };
  const handleClinicSubmit = async (e) => {
    e.preventDefault();

    // Validate all steps
    // let isValid = true;
    // for (let i = 0; i < steps.length; i++) {
    //   if (!validateClinicStep(i)) {
    //     isValid = false;
    //     setCurrentClinicStep(i); // Go to the first invalid step
    //     break;
    //   }
    // }

    // if (!isValid) {
    //   return;
    // }

    setIsClinicSubmitting(true);
    console.log("Submitting clinic data:", clinicFormData);

    // Here you would typically make your API call
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/clinic/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clinicFormData)
      });
      const responseData = await response.json();
      if (responseData.success) {
        console.log('Registration successful:', responseData.data);
        setClinicRegistrationSuccess(true);

      // Reset form after success
      setTimeout(() => {
        setClinicFormData({
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
        setCurrentClinicStep(0);
        setShowClinicModal(false);
      }, 2000);
    } else {
      console.error('Registration failed:', responseData.message);
      alert(`Registration failed: ${responseData.message || 'Please try again'}`);
    }
    } catch (err) {
      console.error('Error submitting clinic form:', err);
      alert(`Registration failed: ${err.message || 'Please try again'}`);
    } finally {
      setIsClinicSubmitting(false);
    }
  };
  // const handleClinicSubmit = async (e) => {
  //   e.preventDefault();

  //   // Validate current step
  //  let isValid = true;
  //   for (let i = 0; i < steps.length; i++) {
  //     if (!validateClinicStep(i)) {
  //       isValid = false;
  //       setCurrentClinicStep(i); // Go to the first invalid step
  //       break;
  //     }
  //   }

  //   if (!isValid) {
  //     return;
  //   }

  //   setIsClinicSubmitting(true);
  //   console.log(currentClinicStep);
  //   if(currentClinicStep>4){
  //   console.log("adsf",clinicFormData)
  //   }

  //   // try {
  //   //   const response = await fetch(`${API_BASE_URL}/api/clinic/register`, {
  //   //     method: 'POST',
  //   //     headers: {
  //   //       'Content-Type': 'application/json',
  //   //     },
  //   //     body: JSON.stringify(clinicFormData)
  //   //   });

  //   //   if (!response.ok) {
  //   //     const error = await response.json();
  //   //     throw new Error(error.message || 'Registration failed');
  //   //   }

  //   //   const data = await response.json();
  //   //   console.log('Registration successful:', data);
  //   //   setClinicRegistrationSuccess(true);

  //   //   // Reset form after success
  //   //   setTimeout(() => {
  //   //     setClinicFormData({
  //   //       clinicName: '',
  //   //       address: '',
  //   //       city: '',
  //   //       state: '',
  //   //       postalCode: '',
  //   //       country: '',
  //   //       phone: '',
  //   //       email: '',
  //   //       website: '',
  //   //       registrationNumber: '',
  //   //       password: '',
  //   //       taxId: '',
  //   //       clinicType: 'general',
  //   //       specialties: [],
  //   //       openingHours: {
  //   //         monday: { open: '09:00', close: '17:00' },
  //   //         tuesday: { open: '09:00', close: '17:00' },
  //   //         wednesday: { open: '09:00', close: '17:00' },
  //   //         thursday: { open: '09:00', close: '17:00' },
  //   //         friday: { open: '09:00', close: '17:00' },
  //   //         saturday: { open: '', close: '' },
  //   //         sunday: { open: '', close: '' },
  //   //       },
  //   //       description: '',
  //   //       logo: null,
  //   //     });
  //   //     setCurrentClinicStep(0);
  //   //     setShowClinicModal(false);
  //   //   }, 2000);
  //   // } catch (err) {
  //   //   console.error('Error submitting clinic form:', err);
  //   //   alert(`Registration failed: ${err.message || 'Please try again'}`);
  //   // } finally {
  //   //   setIsClinicSubmitting(false);
  //   // }
  // };
  // const medicalSpecialties = [
  //     { name: 'Cardiology', icon: '❤️' },
  //     { name: 'Dermatology', icon: '🧴' },
  //     { name: 'Endocrinology', icon: '🧬' },
  //     { name: 'Gastroenterology', icon: '🫁' },
  //     { name: 'Neurology', icon: '🧠' },
  //     { name: 'Oncology', icon: '🎗️' },
  //     { name: 'Ophthalmology', icon: '👁️' },
  //     { name: 'Orthopedics', icon: '🦴' },
  //     { name: 'Pediatrics', icon: '👶' },
  //     { name: 'Psychiatry', icon: '🧘' },
  //     { name: 'Pulmonology', icon: '🫁' },
  //     { name: 'Rheumatology', icon: '🦴' },
  //     { name: 'Urology', icon: '🩺' },
  //   ];
  const [medicalSpecialties, setMedicalSpecialties] = useState([
    { name: 'Cardiology', icon: '❤️' },
    { name: 'Dermatology', icon: '🧴' },
    { name: 'Endocrinology', icon: '🧬' },
    { name: 'Gastroenterology', icon: '🫁' },
    { name: 'Neurology', icon: '🧠' },
    { name: 'Oncology', icon: '🎗️' },
    { name: 'Ophthalmology', icon: '👁️' },
    { name: 'Orthopedics', icon: '🦴' },
    { name: 'Pediatrics', icon: '👶' },
    { name: 'Psychiatry', icon: '🧘' },
    { name: 'Pulmonology', icon: '🫁' },
    { name: 'Rheumatology', icon: '🦴' },
    { name: 'Urology', icon: '🩺' },
  ])
  const renderClinicStepContent = () => {
    switch (currentClinicStep) {
      case 0: // Basic Information
        return (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl shadow-lg">
                📋
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Basic Information
              </h2>
              <p className="text-gray-600 mt-2">Let's start with the basics about your clinic</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="group">
                <label htmlFor="clinicName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Clinic Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="clinicName"
                  name="clinicName"
                  value={clinicFormData.clinicName}
                  onChange={handleClinicInputChange}
                  className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-blue-300 ${clinicErrors.clinicName ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="Enter clinic name"
                />
                {clinicErrors.clinicName && (
                  <p className="mt-2 text-sm text-red-600 animate-shake">{clinicErrors.clinicName}</p>
                )}
              </div>

              <div className="group">
                <label htmlFor="clinicType" className="block text-sm font-semibold text-gray-700 mb-2">
                  Clinic Type
                </label>
                <select
                  id="clinicType"
                  name="clinicType"
                  value={clinicFormData.clinicType}
                  onChange={handleClinicInputChange}
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
                value={clinicFormData.description}
                onChange={handleClinicInputChange}
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
                    {isClinicSubmitting ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    ) : clinicFormData.logo ? (
                      <img src={clinicFormData.logo} alt="Clinic logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-blue-400">
                        🏥
                      </div>
                    )}
                  </div>
                </div>
                <label className="cursor-pointer group">
                  <div className={`px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2 ${isClinicSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <span>📷</span>
                    <span className="font-medium">
                      {isClinicSubmitting ? 'Uploading...' : 'Upload Logo'}
                    </span>
                  </div>
                  <input
                    type="file"
                    className="sr-only"
                    onChange={handleClinicFileChange}
                    accept="image/*"
                    disabled={isClinicSubmitting}
                  />
                </label>
              </div>
            </div>
          </div>
        );

      case 1: // Contact Information
        return (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-3xl shadow-lg">
                📞
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                Contact Information
              </h2>
              <p className="text-gray-600 mt-2">How can patients reach your clinic?</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={clinicFormData.address}
                  onChange={handleClinicInputChange}
                  className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-green-100 focus:border-green-500 hover:border-green-300 ${clinicErrors.address ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="Street address"
                />
                {clinicErrors.address && (
                  <p className="mt-2 text-sm text-red-600 animate-shake">{clinicErrors.address}</p>
                )}
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={clinicFormData.city}
                  onChange={handleClinicInputChange}
                  className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-green-100 focus:border-green-500 hover:border-green-300 ${clinicErrors.city ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="City"
                />
                {clinicErrors.city && (
                  <p className="mt-2 text-sm text-red-600 animate-shake">{clinicErrors.city}</p>
                )}
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-2">
                  State/Province
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={clinicFormData.state}
                  onChange={handleClinicInputChange}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-green-100 focus:border-green-500 hover:border-green-300"
                  placeholder="State or province"
                />
              </div>

              <div>
                <label htmlFor="postalCode" className="block text-sm font-semibold text-gray-700 mb-2">
                  ZIP/Postal Code
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={clinicFormData.postalCode}
                  onChange={handleClinicInputChange}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-green-100 focus:border-green-500 hover:border-green-300"
                  placeholder="Postal code"
                />
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={clinicFormData.country}
                  onChange={handleClinicInputChange}
                  className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-green-100 focus:border-green-500 hover:border-green-300 ${clinicErrors.country ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="Country"
                />
                {clinicErrors.country && (
                  <p className="mt-2 text-sm text-red-600 animate-shake">{clinicErrors.country}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={clinicFormData.phone}
                  onChange={handleClinicInputChange}
                  className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-green-100 focus:border-green-500 hover:border-green-300 ${clinicErrors.phone ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="+91 9876543210"
                />
                {clinicErrors.phone && (
                  <p className="mt-2 text-sm text-red-600 animate-shake">{clinicErrors.phone}</p>
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
                  value={clinicFormData.email}
                  onChange={async (e) => {
                    const email = e.target.value;
                    handleClinicInputChange(e);

                    // Check email availability only if it's a valid email format
                    if (/^\S+@\S+\.\S+$/.test(email)) {
                      const errorMessage = await checkEmailAvailability(email);
                      setClinicErrors(prev => ({
                        ...prev,
                        email: errorMessage || ''
                      }));
                    }
                  }}
                  className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-green-100 focus:border-green-500 hover:border-green-300 ${clinicErrors.email ? 'border-red-500' : 'border-gray-200'
                    }`}
                  placeholder="contact@clinic.com"
                />
                {clinicErrors.email && (
                  <p className="mt-2 text-sm text-red-600 animate-shake">{clinicErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-semibold text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={clinicFormData.website}
                  onChange={handleClinicInputChange}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-green-100 focus:border-green-500 hover:border-green-300"
                  placeholder="https://yourclinic.com"
                />
              </div>
              <div className="group">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={clinicFormData.password}
                    onChange={handleClinicInputChange}
                    className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-green-100 focus:border-green-500 hover:border-green-300 ${clinicErrors.password ? 'border-red-500' : 'border-gray-200'
                      }`}
                    placeholder="Create a secure password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
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
                {clinicErrors.password && (
                  <p className="mt-2 text-sm text-red-600 animate-shake">{clinicErrors.password}</p>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  Password must contain:
                  <ul className="list-disc pl-5 mt-1">
                    <li className={clinicFormData.password.length >= 8 ? 'text-green-500' : ''}>At least 8 characters</li>
                    <li className={/[A-Z]/.test(clinicFormData.password) ? 'text-green-500' : ''}>One uppercase letter</li>
                    <li className={/[a-z]/.test(clinicFormData.password) ? 'text-green-500' : ''}>One lowercase letter</li>
                    <li className={/\d/.test(clinicFormData.password) ? 'text-green-500' : ''}>One number</li>
                    <li className={/[@$!%*?&]/.test(clinicFormData.password) ? 'text-green-500' : ''}>One special character</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      case 2: // Business Information
        return (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-3xl shadow-lg">
                {isLoading ? (
                  <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  '💼'
                )}
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Business Information
              </h2>
              <p className="text-gray-600 mt-2">Official business details and registration</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Registration Number
                </label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={clinicFormData.registrationNumber}
                  onChange={handleClinicInputChange}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 hover:border-orange-300"
                  placeholder="Registration number"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST No.
                </label>
                <input
                  type="text"
                  name="taxId"
                  value={clinicFormData.taxId}
                  onChange={handleClinicInputChange}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 hover:border-orange-300"
                  placeholder="Tax identification number"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Document Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* License Document */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 transition-all duration-300 hover:border-orange-400">
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clinic License Document
                  </label>
                  <p className="text-xs text-gray-500 mb-4">
                    Upload your clinic's license certificate (PDF, JPG, PNG)
                  </p>

                  {isUploadingLicense ? (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="animate-spin h-12 w-12 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="mt-4 text-sm text-gray-600">Uploading document...</p>
                    </div>
                  ) : clinicFormData.licenseDocumentUrl ? (
                    <div className="relative">
                      <div className="bg-gray-100 p-4 rounded-lg h-48 flex flex-col items-center justify-center">
                        {clinicFormData.licenseDocument.type === 'application/pdf' ? (
                          <div className="flex flex-col items-center">
                            <svg className="h-12 w-12 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <p className="mt-2 text-sm font-medium text-gray-700 truncate">
                              {clinicFormData.licenseDocument.name}
                            </p>
                          </div>
                        ) : (
                          <img
                            src={clinicFormData.licenseDocumentUrl}
                            alt="License Document Preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={removeLicenseDocument}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        disabled={isLoading}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, JPG, PNG (MAX. 5MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="sr-only"
                        onChange={handleLicenseDocumentChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                        ref={licenseFileInputRef}
                        disabled={isLoading}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* GST Document */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 transition-all duration-300 hover:border-orange-400">
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST Registration Document
                  </label>
                  <p className="text-xs text-gray-500 mb-4">
                    Upload your GST registration certificate (PDF, JPG, PNG)
                  </p>

                  {isUploadingGst ? (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="animate-spin h-12 w-12 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="mt-4 text-sm text-gray-600">Uploading document...</p>
                    </div>
                  ) : clinicFormData.gstDocumentUrl ? (
                    <div className="relative">
                      <div className="bg-gray-100 p-4 rounded-lg h-48 flex flex-col items-center justify-center">
                        {clinicFormData.gstDocument.type === 'application/pdf' ? (
                          <div className="flex flex-col items-center">
                            <svg className="h-12 w-12 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <p className="mt-2 text-sm font-medium text-gray-700 truncate">
                              {clinicFormData.gstDocument.name}
                            </p>
                          </div>
                        ) : (
                          <img
                            src={clinicFormData.gstDocumentUrl}
                            alt="GST Document Preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={removeGstDocument}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        disabled={isLoading}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, JPG, PNG (MAX. 5MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="sr-only"
                        onChange={handleGstDocumentChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                        ref={gstFileInputRef}
                        disabled={isLoading}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      // case 2: // Business Information
      //   return (
      //     <div className="space-y-8 animate-fadeIn">
      //       <div className="text-center mb-8">
      //         <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-3xl shadow-lg">
      //           💼
      //         </div>
      //         <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
      //           Business Information
      //         </h2>
      //         <p className="text-gray-600 mt-2">Official business details and registration</p>
      //       </div>

      //       <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      //         <div>
      //           <label htmlFor="registrationNumber" className="block text-sm font-semibold text-gray-700 mb-2">
      //             Business Registration Number
      //           </label>
      //           <input
      //             type="text"
      //             id="registrationNumber"
      //             name="registrationNumber"
      //             value={clinicFormData.registrationNumber}
      //             onChange={handleClinicInputChange}
      //             className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 hover:border-orange-300"
      //             placeholder="Registration number"
      //           />
      //         </div>

      //         <div>
      //           <label htmlFor="taxId" className="block text-sm font-semibold text-gray-700 mb-2">
      //             Tax ID
      //           </label>
      //           <input
      //             type="text"
      //             id="taxId"
      //             name="taxId"
      //             value={clinicFormData.taxId}
      //             onChange={handleClinicInputChange}
      //             className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 hover:border-orange-300"
      //             placeholder="Tax identification number"
      //           />
      //         </div>
      //       </div>
      //     </div>
      //   );

      // case 3: // Specialties
      //   return (
      //     <div className="space-y-8 animate-fadeIn">
      //       <div className="text-center mb-8">
      //         <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-3xl shadow-lg">
      //           ⚕️
      //         </div>
      //         <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
      //           Medical Specialties
      //         </h2>
      //         <p className="text-gray-600 mt-2">Select the specialties your clinic offers</p>
      //       </div>

      //       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      //         {medicalSpecialties.map((specialty, index) => (
      //           <div 
      //             key={specialty.name} 
      //             className="group relative"
      //             style={{ animationDelay: `${index * 0.1}s` }}
      //           >
      //             <input
      //               type="checkbox"
      //               id={`specialty-${specialty.name}`}
      //               value={specialty.name}
      //               checked={clinicFormData.specialties.includes(specialty.name)}
      //               onChange={handleClinicSpecialtyChange }
      //               className="sr-only"
      //             />
      //             <label 
      //               htmlFor={`specialty-${specialty.name}`}
      //               className={`block p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
      //                 clinicFormData.specialties.includes(specialty.name)
      //                   ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg'
      //                   : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
      //               }`}
      //             >
      //               <div className="flex items-center space-x-3">
      //                 <span className="text-2xl">{specialty.icon}</span>
      //                 <span className="font-medium text-gray-800">{specialty.name}</span>
      //                 {clinicFormData.specialties.includes(specialty.name) && (
      //                   <span className="ml-auto text-purple-500">✓</span>
      //                 )}
      //               </div>
      //             </label>
      //           </div>
      //         ))}
      //       </div>
      //     </div>
      //   );
      case 3: // Specialties
        return (
          <div className="space-y-6 md:space-y-8 animate-fadeIn px-4 sm:px-0">
            {/* Header Section */}
            <div className="text-center mb-6 md:mb-8">
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 md:mb-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl md:text-3xl shadow-lg">
                ⚕️
              </div>
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Medical Specialties
              </h2>
              <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">
                Select the specialties your clinic offers
              </p>
            </div>

            {/* Specialties Grid - Dynamic Widths */}
            <div className="flex flex-wrap gap-3 sm:gap-4 w-full">
              {medicalSpecialties.map((specialty, index) => {
                // Calculate width based on name length (minimum 8rem, adds 0.5rem per 3 characters)
                const baseWidth = 8; // 8rem minimum
                const lengthFactor = Math.ceil(specialty.name.length / 3) * 0.5;
                const widthClass = `min-w-[${baseWidth}rem] w-[${baseWidth + lengthFactor}rem]`;

                return (
                  <div
                    key={specialty.name}
                    className={`group relative ${widthClass} flex-grow`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <input
                      type="checkbox"
                      id={`specialty-${specialty.name}`}
                      value={specialty.name}
                      checked={clinicFormData.specialties.includes(specialty.name)}
                      onChange={handleClinicSpecialtyChange}
                      className="sr-only"
                    />
                    <label
                      htmlFor={`specialty-${specialty.name}`}
                      className={`block p-3 sm:p-4 rounded-lg md:rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] w-full ${clinicFormData.specialties.includes(specialty.name)
                          ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
                        }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <span className="text-xl sm:text-2xl">{specialty.icon}</span>
                          <span className="font-medium text-gray-800 text-sm sm:text-base">
                            {specialty.name}
                          </span>
                        </div>
                        {clinicFormData.specialties.includes(specialty.name) && (
                          <span className="text-purple-500 text-lg">✓</span>
                        )}
                      </div>
                    </label>
                  </div>
                );
              })}

              {/* Add New Specialty Button - Responsive */}
              {!showNewSpecialtyInput && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowNewSpecialtyInput(true)}
                  className="p-3 sm:p-4 rounded-lg md:rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-purple-300 hover:shadow-sm transition-all duration-200 flex items-center justify-center flex-grow min-w-[8rem]"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <span className="text-xl sm:text-2xl">➕</span>
                    <span className="font-medium text-gray-800 text-sm sm:text-base">
                      Add New Specialty
                    </span>
                  </div>
                </motion.button>
              )}

              {/* New Specialty Input - Responsive */}
              {showNewSpecialtyInput && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 sm:p-4 rounded-lg md:rounded-xl border-2 border-purple-300 bg-white shadow-sm w-full"
                >
                  <div className="flex flex-col space-y-2 sm:space-y-3">
                    <input
                      type="text"
                      value={newSpecialtyInput}
                      onChange={(e) => setNewSpecialtyInput(e.target.value)}
                      onKeyPress={handleSpecialtyKeyPress}
                      placeholder="Enter new specialty"
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button
                        type='button'
                        onClick={handleAddNewSpecialty}
                        disabled={!newSpecialtyInput.trim()}
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg text-white ${newSpecialtyInput.trim()
                            ? 'bg-purple-600 hover:bg-purple-700'
                            : 'bg-purple-300 cursor-not-allowed'
                          }`}
                      >
                        Add
                      </button>
                      <button
                        type='button'
                        onClick={() => {
                          setShowNewSpecialtyInput(false);
                          setNewSpecialtyInput('');
                        }}
                        className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        );
      // case 4: // Opening Hours
      //   return (
      //     <div className="space-y-8 animate-fadeIn">
      //       <div className="text-center mb-8">
      //         <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl shadow-lg">
      //           🕐
      //         </div>
      //         <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
      //           Opening Hours
      //         </h2>
      //         <p className="text-gray-600 mt-2">When is your clinic open for patients?</p>
      //       </div>

      //       <div className="space-y-4">
      //         {Object.entries(clinicFormData.openingHours).map(([day, hours], index) => (
      //           <div 
      //             key={day} 
      //             className="p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-indigo-300 transition-all duration-300 animate-slideInLeft"
      //             style={{ animationDelay: `${index * 0.1}s` }}
      //           >
      //             <div className="flex items-center justify-between">
      //               <div className="flex items-center space-x-4">
      //                 <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full flex items-center justify-center">
      //                   <span className="font-bold text-indigo-600 capitalize">{day.slice(0, 2)}</span>
      //                 </div>
      //                 <h3 className="text-lg font-semibold text-gray-800 capitalize">{day}</h3>
      //               </div>

      //               <div className="flex items-center space-x-4">
      //                 <div className="flex items-center space-x-2">
      //                   <input
      //                     type="time"
      //                     value={hours.open}
      //                     onChange={(e) => handleClinicOpeningHoursChange(day, 'open', e.target.value)}
      //                     disabled={!hours.open && !hours.close}
      //                     className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-400 transition-all duration-300"
      //                   />
      //                   <span className="text-gray-500 font-medium">to</span>
      //                   <input
      //                     type="time"
      //                     value={hours.close}
      //                     onChange={(e) => handleClinicOpeningHoursChange(day, 'close', e.target.value)}
      //                     disabled={!hours.open && !hours.close}
      //                     className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-400 transition-all duration-300"
      //                   />
      //                 </div>

      //                 <label className="flex items-center space-x-2 cursor-pointer">
      //                   <input
      //                     type="checkbox"
      //                     checked={!hours.open && !hours.close}
      //                     onChange={(e) => {
      //                       if (e.target.checked) {
      //                         handleClinicOpeningHoursChange(day, 'open', '');
      //                         handleClinicOpeningHoursChange(day, 'close', '');
      //                       } else {
      //                         handleClinicOpeningHoursChange(day, 'open', '09:00');
      //                         handleClinicOpeningHoursChange(day, 'close', '17:00');
      //                       }
      //                     }}
      //                     className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
      //                   />
      //                   <span className="text-sm font-medium text-gray-700">Closed</span>
      //                 </label>
      //               </div>
      //             </div>
      //           </div>
      //         ))}
      //       </div>
      //     </div>
      //   );
      case 4: // Opening Hours
        return (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl shadow-lg">
                🕐
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Opening Hours
              </h2>
              <p className="text-gray-600 mt-2">When is your clinic open for patients?</p>
            </div>

            {/* 24/7 Availability Toggle */}
            <div className="flex items-center justify-center mb-6">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={clinicFormData.is24x7}
                    onChange={(e) => {
                      const is24x7 = e.target.checked;
                      setClinicFormData(prev => ({
                        ...prev,
                        is24x7,
                        openingHours: is24x7
                          ? Object.fromEntries(
                            Object.keys(prev.openingHours).map(day => [
                              day,
                              { open: '00:00', close: '23:59' }
                            ])
                          )
                          : {
                            monday: { open: '09:00', close: '17:00' },
                            tuesday: { open: '09:00', close: '17:00' },
                            wednesday: { open: '09:00', close: '17:00' },
                            thursday: { open: '09:00', close: '17:00' },
                            friday: { open: '09:00', close: '17:00' },
                            saturday: { open: '', close: '' },
                            sunday: { open: '', close: '' },
                          }
                      }));
                    }}
                  />
                  <div className={`block w-14 h-8 rounded-full ${clinicFormData.is24x7 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${clinicFormData.is24x7 ? 'transform translate-x-6' : ''}`}></div>
                </div>
                <div className="ml-3 text-gray-700 font-medium">
                  24/7 Availability
                </div>
              </label>
            </div>

            {!clinicFormData.is24x7 && (
              <div className="space-y-4">
                {Object.entries(clinicFormData.openingHours).map(([day, hours], index) => (
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
                            onChange={(e) => handleClinicOpeningHoursChange(day, 'open', e.target.value)}
                            disabled={!hours.open && !hours.close}
                            className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-400 transition-all duration-300"
                          />
                          <span className="text-gray-500 font-medium">to</span>
                          <input
                            type="time"
                            value={hours.close}
                            onChange={(e) => handleClinicOpeningHoursChange(day, 'close', e.target.value)}
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
                                handleClinicOpeningHoursChange(day, 'open', '');
                                handleClinicOpeningHoursChange(day, 'close', '');
                              } else {
                                handleClinicOpeningHoursChange(day, 'open', '09:00');
                                handleClinicOpeningHoursChange(day, 'close', '17:00');
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
            )}

            {clinicFormData.is24x7 && (
              <div className="text-center py-8 bg-blue-50 rounded-xl border-2 border-blue-200">
                <div className="text-blue-600 text-5xl mb-4">🏥</div>
                <h3 className="text-xl font-bold text-blue-800">24/7 Availability Enabled</h3>
                <p className="text-blue-600 mt-2">Your clinic will be shown as open 24 hours a day, 7 days a week</p>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-900/20 p-4 sm:p-8 relative overflow-hidden">
      
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">Register Your Clinic</h1>
          <p className="text-xl text-gray-500/90 dark:text-gray-400 max-w-2xl mx-auto">
            Register Your Clinic to Start Using ClinicPro
          </p>
        </div>

        <div className="grid grid-cols-1 max-w-md mx-auto gap-8">
          {roles.map((role) => (
            <motion.div
              key={role.id}
              className={`relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/80 dark:border-slate-700/80 rounded-[2rem] shadow-xl overflow-hidden transition-all duration-300 ${hoveredCard === role.id ? 'scale-105' : 'scale-100'}`}
              onMouseEnter={() => setHoveredCard(role.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleCardClick(role.id)}
              whileHover={{ y: -10 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-5`}></div>
              <div className="relative p-10 h-full flex flex-col items-center text-center">
                <div className="text-6xl mb-6">{role.icon}</div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">{role.title}</h3>
                <p className="text-gray-500/90 dark:text-gray-400 mb-8 flex-grow">{role.description}</p>
                <div className="mt-auto w-full">
                  <button className={`w-full py-3 px-6 rounded-xl font-medium bg-gradient-to-r ${role.color} text-white shadow-md hover:shadow-lg transition-all`}>
                    Register as {role.title}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Patient Registration Modal */}
      <AnimatePresence>
        {showPatientModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => !isPatientLoading && setShowPatientModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl border border-white/80 dark:border-slate-700/80 rounded-[2rem] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 w-full">
                {/* Left Side - Illustration */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className="hidden lg:flex flex-col justify-center items-center bg-cyan-50/30 dark:bg-slate-900/40 p-8 sticky top-0 h-[90vh] flex-shrink-0 border-r border-white/50 dark:border-slate-700/50"
                >
                  <div className="relative w-full h-96">
                    <img src="/pateint-login.png" alt="Patient" className="w-full h-full object-contain" />

                    <motion.div
                      animate={{
                        y: [0, -15, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute top-10 left-20 bg-white p-3 rounded-full shadow-lg"
                    >
                      <FaHeartbeat className="text-red-400 text-2xl" />
                    </motion.div>

                    <motion.div
                      animate={{
                        y: [0, 15, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5
                      }}
                      className="absolute bottom-20 right-10 bg-white p-3 rounded-full shadow-lg"
                    >
                      <FaUserInjured className="text-blue-400 text-2xl" />
                    </motion.div>
                  </div>

                  <h2 className="text-3xl font-bold text-gray-800 mt-8 text-center">
                    Your Health Journey Starts Here
                  </h2>
                  <p className="text-gray-600 mt-2 text-center max-w-md">
                    Join thousands of patients getting personalized care from top doctors
                  </p>
                </motion.div>

                {/* Right Side - Form */}
                <form onSubmit={handlePatientSubmit} className="p-8 overflow-y-auto flex-grow bg-transparent max-h-[90vh]">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">Patient Registration</h1>
                      <p className="text-gray-500">Step {currentPatientStep} of 3</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isPatientLoading) {
                          setShowPatientModal(false);
                          setCurrentPatientStep(1);
                        }
                      }}
                      className="text-gray-400 hover:text-gray-500"
                      disabled={isPatientLoading}
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex space-x-2 mb-8">
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className={`flex-1 h-2 rounded-full ${currentPatientStep >= step ? 'bg-blue-500' : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>

                  <AnimatePresence mode='wait'>
                    {currentPatientStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiUser className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                name="firstName"
                                value={patientFormData.firstName}
                                onChange={handlePatientFormChange}
                                className="pl-10 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-3"
                                placeholder="John"
                                required
                                disabled={isPatientLoading}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiUser className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                name="lastName"
                                value={patientFormData.lastName}
                                onChange={handlePatientFormChange}
                                className="pl-10 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-3"
                                placeholder="Doe"
                                required
                                disabled={isPatientLoading}
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiMail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="email"
                              name="email"
                              value={patientFormData.email}
                              onChange={handlePatientFormChange}
                              className="pl-10 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-3"
                              placeholder="your@email.com"
                              required
                              disabled={isPatientLoading}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiPhone className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="tel"
                              name="phone"
                              value={patientFormData.phone}
                              onChange={handlePatientFormChange}
                              className="pl-10 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-3"
                              placeholder="+1 (555) 123-4567"
                              disabled={isPatientLoading}
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={nextPatientStep}
                            className="bg-blue-600 text-white py-3 px-6 rounded-lg shadow hover:bg-blue-700 transition"
                            disabled={isPatientLoading}
                          >
                            Next: Medical Info
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {currentPatientStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="space-y-6"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiCalendar className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="date"
                              name="dob"
                              value={patientFormData.dob}
                              onChange={handlePatientFormChange}
                              className="pl-10 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-3"
                              required
                              disabled={isPatientLoading}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                          <select
                            name="gender"
                            value={patientFormData.gender}
                            onChange={handlePatientFormChange}
                            className="w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-3"
                            disabled={isPatientLoading}
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
                          <select
                            name="bloodType"
                            value={patientFormData.bloodType || ''}
                            onChange={handlePatientFormChange}
                            className="w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-3"
                            disabled={isPatientLoading}
                          >
                            <option value="">Select blood type</option>
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

                        <div className="flex justify-between">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={prevPatientStep}
                            className="text-gray-600 py-3 px-6 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                            disabled={isPatientLoading}
                          >
                            Back
                          </motion.button>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={nextPatientStep}
                            className="bg-blue-600 text-white py-3 px-6 rounded-lg shadow hover:bg-blue-700 transition"
                            disabled={isPatientLoading}
                          >
                            Next: Account Setup
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {currentPatientStep === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="space-y-6"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Create Password</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiLock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="password"
                              name="password"
                              value={patientFormData.password}
                              onChange={handlePatientFormChange}
                              className="pl-10 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-3"
                              placeholder="••••••••"
                              required
                              disabled={isPatientLoading}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiLock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="password"
                              name="confirmPassword"
                              value={patientFormData.confirmPassword}
                              onChange={handlePatientFormChange}
                              className="pl-10 w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-3"
                              placeholder="••••••••"
                              required
                              disabled={isPatientLoading}
                            />
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="terms"
                              type="checkbox"
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                              required
                              disabled={isPatientLoading}
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="terms" className="font-medium text-gray-700">
                              I agree to the <a href="#" className="text-blue-600 hover:text-blue-500">Terms of Service</a> and <a href="#" className="text-blue-600 hover:text-blue-500">Privacy Policy</a>
                            </label>
                          </div>
                        </div>

                        <div className="flex justify-between">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={prevPatientStep}
                            className="text-gray-600 py-3 px-6 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                            disabled={isPatientLoading}
                          >
                            Back
                          </motion.button>

                          {isPatientLoading ? (
                            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-8 rounded-lg shadow-lg flex items-center justify-center gap-2">
                              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </div>
                          ) : patientRegistrationSuccess ? (
                            <div className="bg-green-500 text-white py-3 px-8 rounded-lg shadow-lg flex items-center gap-2">
                              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Registration Successful!
                            </div>
                          ) : (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="submit"
                              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition flex items-center gap-2"
                            >
                              <FaClinicMedical className="text-lg" />
                              Complete Registration
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-8 text-center text-sm text-gray-500">
                    Already have an account? <a href="#" className="text-blue-600 font-medium hover:text-blue-500">Sign in</a>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Doctor Registration Modal */}
      <AnimatePresence>
        {showDoctorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => !isDoctorSubmitting && setShowDoctorModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl border border-white/80 dark:border-slate-700/80 rounded-[2rem] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex" // Changed to flex and removed overflow-y-auto
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 w-full">
                {/* Left Side - Illustration */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className="hidden lg:flex flex-col justify-center items-center bg-indigo-50/30 dark:bg-slate-900/40 p-8 sticky top-0 h-[90vh] flex-shrink-0 border-r border-white/50 dark:border-slate-700/50" // Added sticky, height and flex-shrink
                >
                  <div className="relative w-full h-96">
                    <img src="/doctorportalgif4.gif" alt="Doctor" className="w-full h-full object-contain" />

                    <motion.div
                      animate={{
                        y: [0, -15, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute top-10 left-20 bg-white/90 backdrop-blur-md border border-white/50 p-3 rounded-full shadow-lg"
                    >
                      <FaStethoscope className="text-indigo-400 text-2xl" />
                    </motion.div>

                    <motion.div
                      animate={{
                        y: [0, 15, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5
                      }}
                      className="absolute bottom-20 right-10 bg-white/90 backdrop-blur-md border border-white/50 p-3 rounded-full shadow-lg"
                    >
                      <FaClinicMedical className="text-purple-400 text-2xl" />
                    </motion.div>
                  </div>

                  <h2 className="text-3xl font-bold text-gray-800 mt-8 text-center">
                    Expand Your Medical Practice
                  </h2>
                  <p className="text-gray-600 mt-2 text-center max-w-md">
                    Join our network of trusted healthcare professionals and reach more patients
                  </p>
                </motion.div>

                {/* Right Side - Form */}
                <form onSubmit={handleDoctorSubmit} className="p-8 overflow-y-auto flex-grow bg-transparent max-h-[90vh]">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">Doctor Registration</h1>
                      <p className="text-gray-500">
                        Step {currentDoctorStep + 1} of {doctorSteps.length}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isDoctorSubmitting) {
                          setShowDoctorModal(false);
                          setCurrentDoctorStep(0);
                        }
                      }}
                      className="text-gray-400 hover:text-gray-500"
                      disabled={isDoctorSubmitting}
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex space-x-2 mb-8">
                    {doctorSteps.map((_, index) => (
                      <div
                        key={index}
                        className={`flex-1 h-2 rounded-full ${currentDoctorStep >= index ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>

                  <AnimatePresence mode='wait'>
                    {currentDoctorStep === 0 && (
                      <motion.div
                        key="personal"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="space-y-6"
                      >
                        <div className="flex flex-col items-center">
                          <div className="relative mb-4">
                            {doctorFormData.profileImage ? (
                              <>
                                <img
                                  src={doctorFormData.profileImage}
                                  alt="Profile"
                                  className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100 shadow-md"
                                />
                                <button
                                  type="button"
                                  onClick={removeProfileImage}
                                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </>
                            ) : (
                              <div className="w-32 h-32 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center shadow-inner">
                                <FiUser className="h-12 w-12 text-gray-400" />
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
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors shadow-md"
                          >
                            {doctorFormData.profileImage ? 'Change Photo' : 'Upload Photo'}
                          </label>
                          {doctorErrors.profileImage && (
                            <p className="text-red-500 text-xs mt-2 flex items-center">
                              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {doctorErrors.profileImage}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">First Name*</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiUser className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                value={doctorFormData.firstName}
                                onChange={(e) => handleDoctorInputChange('firstName', e.target.value)}
                                className={`pl-10 w-full rounded-lg border ${doctorErrors.firstName ? 'border-red-300' : 'border-gray-200'} focus:border-indigo-500 focus:ring-indigo-500 py-3`}
                                placeholder="John"
                                disabled={isDoctorSubmitting}
                              />
                            </div>
                            {doctorErrors.firstName && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {doctorErrors.firstName}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name*</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiUser className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                value={doctorFormData.lastName}
                                onChange={(e) => handleDoctorInputChange('lastName', e.target.value)}
                                className={`pl-10 w-full rounded-lg border ${doctorErrors.lastName ? 'border-red-300' : 'border-gray-200'} focus:border-indigo-500 focus:ring-indigo-500 py-3`}
                                placeholder="Doe"
                                disabled={isDoctorSubmitting}
                              />
                            </div>
                            {doctorErrors.lastName && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {doctorErrors.lastName}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth*</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiCalendar className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type="date"
                                value={doctorFormData.dateOfBirth}
                                onChange={(e) => handleDoctorInputChange('dateOfBirth', e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className={`pl-10 w-full rounded-lg border ${doctorErrors.dateOfBirth ? 'border-red-300' : 'border-gray-200'} focus:border-indigo-500 focus:ring-indigo-500 py-3`}
                                disabled={isDoctorSubmitting}
                              />
                            </div>
                            {doctorErrors.dateOfBirth && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {doctorErrors.dateOfBirth}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Gender*</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiUser className="h-5 w-5 text-gray-400" />
                              </div>
                              <select
                                value={doctorFormData.gender}
                                onChange={(e) => handleDoctorInputChange('gender', e.target.value)}
                                className={`pl-10 w-full rounded-lg border ${doctorErrors.gender ? 'border-red-300' : 'border-gray-200'} focus:border-indigo-500 focus:ring-indigo-500 py-3`}
                                disabled={isDoctorSubmitting}
                              >
                                <option value="">Select gender</option>
                                {genderOptions.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </div>
                            {doctorErrors.gender && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {doctorErrors.gender}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email*</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiMail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="email"
                              value={doctorFormData.email}
                              onChange={(e) => handleDoctorInputChange('email', e.target.value)}
                              className={`pl-10 w-full rounded-lg border ${doctorErrors.email ? 'border-red-300' : 'border-gray-200'} focus:border-indigo-500 focus:ring-indigo-500 py-3`}
                              placeholder="your@email.com"
                              disabled={isDoctorSubmitting}
                            />
                          </div>
                          {doctorErrors.email && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {doctorErrors.email}
                            </p>
                          )}
                        </div> */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">Email*</label>
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <FiMail className="h-5 w-5 text-gray-400" />
    </div>
    <input
      type="email"
      value={doctorFormData.email}
      onChange={async (e) => {
        const email = e.target.value;
        handleDoctorInputChange('email', email);
        
        // Check email availability only if it's a valid email format
        if (/^\S+@\S+\.\S+$/.test(email)) {
          const errorMessage = await checkEmailAvailability(email);
          setDoctorErrors(prev => ({
            ...prev,
            email: errorMessage || ''
          }));
        }
      }}
      className={`pl-10 w-full rounded-lg border ${doctorErrors.email ? 'border-red-300' : 'border-gray-200'} focus:border-indigo-500 focus:ring-indigo-500 py-3`}
      placeholder="your@email.com"
      disabled={isDoctorSubmitting}
    />
  </div>
  {doctorErrors.email && (
    <p className="text-red-500 text-xs mt-1 flex items-center">
      <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {doctorErrors.email}
    </p>
  )}
</div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number*</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiPhone className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="tel"
                              value={doctorFormData.phone}
                              onChange={(e) => handleDoctorInputChange('phone', e.target.value)}
                              className={`pl-10 w-full rounded-lg border ${doctorErrors.phone ? 'border-red-300' : 'border-gray-200'} focus:border-indigo-500 focus:ring-indigo-500 py-3`}
                              placeholder="+1 (555) 123-4567"
                              disabled={isDoctorSubmitting}
                            />
                          </div>
                          {doctorErrors.phone && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {doctorErrors.phone}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password*</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiLock className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type={showPassword ? "text" : "password"}
                                value={doctorFormData.password}
                                onChange={(e) => handleDoctorInputChange('password', e.target.value)}
                                className={`pl-10 w-full rounded-lg border ${doctorErrors.password ? 'border-red-300' : 'border-gray-200'} focus:border-indigo-500 focus:ring-indigo-500 py-3`}
                                placeholder="••••••••"
                                disabled={isDoctorSubmitting}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                              >
                                {showPassword ? (
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                ) : (
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                  </svg>
                                )}
                              </button>
                            </div>
                            {doctorErrors.password && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {doctorErrors.password}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Use 8 or more characters with a mix of letters, numbers & symbols
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password*</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiLock className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={doctorFormData.confirmPassword}
                                onChange={(e) => handleDoctorInputChange('confirmPassword', e.target.value)}
                                className={`pl-10 w-full rounded-lg border ${doctorErrors.confirmPassword ? 'border-red-300' : 'border-gray-200'} focus:border-indigo-500 focus:ring-indigo-500 py-3`}
                                placeholder="••••••••"
                                disabled={isDoctorSubmitting}
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                              >
                                {showConfirmPassword ? (
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                ) : (
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                  </svg>
                                )}
                              </button>
                            </div>
                            {doctorErrors.confirmPassword && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {doctorErrors.confirmPassword}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={nextDoctorStep}
                            className="bg-indigo-600 text-white py-3 px-6 rounded-lg shadow hover:bg-indigo-700 transition"
                            disabled={isDoctorSubmitting}
                          >
                            Next: Professional Details
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {currentDoctorStep === 1 && (
                      <motion.div
                        key="professional"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="space-y-6"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Primary Specialty*</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FaStethoscope className="h-5 w-5 text-gray-400" />
                            </div>
                            <select
                              value={doctorFormData.specialty}
                              onChange={(e) => handleDoctorInputChange('specialty', e.target.value)}
                              className={`pl-10 w-full rounded-lg border ${doctorErrors.specialty ? 'border-red-300' : 'border-gray-200'} focus:border-indigo-500 focus:ring-indigo-500 py-3`}
                              disabled={isDoctorSubmitting}
                            >
                              <option value="">Select your specialty</option>
                              {specialties.map(specialty => (
                                <option key={specialty} value={specialty}>{specialty}</option>
                              ))}
                            </select>
                          </div>
                          {doctorErrors.specialty && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {doctorErrors.specialty}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Sub-Specialty (Optional)</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FaStethoscope className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              value={doctorFormData.supSpeciality}
                              onChange={(e) => handleDoctorInputChange('supSpeciality', e.target.value)}
                              className="pl-10 w-full rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 py-3"
                              placeholder="e.g. Pediatric Cardiology"
                              disabled={isDoctorSubmitting}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience*</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiCalendar className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="number"
                              min="0"
                              max="50"
                              value={doctorFormData.experience}
                              onChange={(e) => handleDoctorInputChange('experience', e.target.value)}
                              className={`pl-10 w-full rounded-lg border ${doctorErrors.experience ? 'border-red-300' : 'border-gray-200'} focus:border-indigo-500 focus:ring-indigo-500 py-3`}
                              placeholder="5"
                              disabled={isDoctorSubmitting}
                            />
                          </div>
                          {doctorErrors.experience && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {doctorErrors.experience}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Fee (₹)*</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500">₹</span>
                            </div>
                            <input
                              type="number"
                              min="0"
                              value={doctorFormData.consultantFee}
                              onChange={(e) => handleDoctorInputChange('consultantFee', e.target.value)}
                              className={`pl-10 w-full rounded-lg border ${doctorErrors.consultantFee ? 'border-red-300' : 'border-gray-200'} focus:border-indigo-500 focus:ring-indigo-500 py-3`}
                              placeholder="e.g. 500"
                              disabled={isDoctorSubmitting}
                            />
                          </div>
                          {doctorErrors.consultantFee && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {doctorErrors.consultantFee}
                            </p>
                          )}
                        </div>
                        {/* <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      <Clock className="inline w-4 h-4 mr-2" />
      Session Time (minutes)
    </label>
    <input
      type="number"
      name="sessionTime"
      value={doctorFormData.sessionTime}
      onChange={(e) => handleDoctorInputChange('sessionTime', e.target.value)}
      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all outline-none"
      placeholder="e.g., 30"
      min="1"
      required
    />
  </div> */}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Hospital/Clinic*</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FaClinicMedical className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              value={doctorFormData.hospital}
                              onChange={(e) => handleDoctorInputChange('hospital', e.target.value)}
                              className={`pl-10 w-full rounded-lg border ${doctorErrors.hospital ? 'border-red-300' : 'border-gray-200'} focus:border-indigo-500 focus:ring-indigo-500 py-3`}
                              placeholder="Current workplace"
                              disabled={isDoctorSubmitting}
                            />
                          </div>
                          {doctorErrors.hospital && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {doctorErrors.hospital}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Contact Number*</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiPhone className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="tel"
                              value={doctorFormData.hospitalNumber}
                              onChange={(e) => handleDoctorInputChange('hospitalNumber', e.target.value)}
                              className={`pl-10 w-full rounded-lg border ${doctorErrors.hospitalNumber ? 'border-red-300' : 'border-gray-200'} focus:border-indigo-500 focus:ring-indigo-500 py-3`}
                              placeholder="Hospital phone number"
                              disabled={isDoctorSubmitting}
                            />
                          </div>
                          {doctorErrors.hospitalNumber && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {doctorErrors.hospitalNumber}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Address</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FaClinicMedical className="h-5 w-5 text-gray-400" />
                            </div>
                            <textarea
                              value={doctorFormData.hospitalAddress}
                              onChange={(e) => handleDoctorInputChange('hospitalAddress', e.target.value)}
                              className="pl-10 w-full rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 py-3"
                              placeholder="Full hospital/clinic address"
                              rows="2"
                              disabled={isDoctorSubmitting}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={prevDoctorStep}
                            className="text-gray-600 py-3 px-6 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                            disabled={isDoctorSubmitting}
                          >
                            Back
                          </motion.button>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={nextDoctorStep}
                            className="bg-indigo-600 text-white py-3 px-6 rounded-lg shadow hover:bg-indigo-700 transition"
                            disabled={isDoctorSubmitting}
                          >
                            Next: Availability
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {currentDoctorStep === 2 && (
                      <motion.div
                        key="availability"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="space-y-6"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Working Days*</label>
                          <div className="flex flex-wrap gap-2">
                            {daysOfWeek.map(day => (
                              <motion.button
                                key={day}
                                type="button"
                                whileTap={{ scale: 0.95 }}
                                onClick={() => toggleDay(day)}
                                className={`px-4 py-2 rounded-lg text-sm transition-all ${doctorFormData.available.days.includes(day)
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                disabled={isDoctorSubmitting}
                              >
                                {day}
                              </motion.button>
                            ))}
                          </div>
                          {doctorErrors.availableDays && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {doctorErrors.availableDays}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <Clock className="inline w-4 h-4 mr-2" />
                            Session Time (minutes)
                          </label>
                          <input
                            type="number"
                            name="sessionTime"
                            value={doctorFormData.sessionTime}
                            onChange={(e) => handleDoctorInputChange("sessionTime", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                            placeholder="e.g., 30"
                            min="1"
                            required
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Clock className="inline w-4 h-4 mr-2" />
                            Working Hours*
                          </label>

                          <div className="grid md:grid-cols-2 gap-6">
                            {/* From Time */}
                            <div className="space-y-2">
                              <label className="block text-sm text-gray-600 mb-1">From</label>
                              <div className="flex gap-2">
                                {/* Hour */}
                                <select
                                  value={doctorFormData?.available?.timeSlots?.from?.hour}
                                  onChange={(e) => handleDoctorInputChange(
                                    'available.timeSlots.from.hour',
                                    e.target.value
                                  )}
                                  className={`flex-1 px-3 py-2 rounded-lg border ${doctorErrors.availableTime ? 'border-red-300' : 'border-gray-200'
                                    } focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none`}
                                >
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                                    <option key={`from-hour-${hour}`} value={hour}>{hour}</option>
                                  ))}
                                </select>

                                {/* Minute */}
                                <select
                                  value={doctorFormData?.available?.timeSlots?.from.minute}
                                  onChange={(e) => handleDoctorInputChange(
                                    'available.timeSlots.from.minute',
                                    e.target.value
                                  )}
                                  className={`flex-1 px-3 py-2 rounded-lg border ${doctorErrors.availableTime ? 'border-red-300' : 'border-gray-200'
                                    } focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none`}
                                >
                                  <option value="00">00</option>
                                  <option value="15">15</option>
                                  <option value="30">30</option>
                                  <option value="45">45</option>
                                </select>

                                {/* AM/PM */}
                                <select
                                  value={doctorFormData?.available?.timeSlots?.from.period}
                                  onChange={(e) => handleDoctorInputChange(
                                    'available.timeSlots.from.period',
                                    e.target.value
                                  )}
                                  className={`flex-1 px-3 py-2 rounded-lg border ${doctorErrors.availableTime ? 'border-red-300' : 'border-gray-200'
                                    } focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none`}
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
                                  value={doctorFormData?.available?.timeSlots?.to.hour}
                                  onChange={(e) => handleDoctorInputChange(
                                    'available.timeSlots.to.hour',
                                    e.target.value
                                  )}
                                  className={`flex-1 px-3 py-2 rounded-lg border ${doctorErrors.availableTime ? 'border-red-300' : 'border-gray-200'
                                    } focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none`}
                                >
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                                    <option key={`to-hour-${hour}`} value={hour}>{hour}</option>
                                  ))}
                                </select>

                                {/* Minute */}
                                <select
                                  value={doctorFormData?.available?.timeSlots?.to.minute}
                                  onChange={(e) => handleDoctorInputChange(
                                    'available.timeSlots.to.minute',
                                    e.target.value
                                  )}
                                  className={`flex-1 px-3 py-2 rounded-lg border ${doctorErrors.availableTime ? 'border-red-300' : 'border-gray-200'
                                    } focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none`}
                                >
                                  <option value="00">00</option>
                                  <option value="15">15</option>
                                  <option value="30">30</option>
                                  <option value="45">45</option>
                                </select>

                                {/* AM/PM */}
                                <select
                                  value={doctorFormData.available.timeSlots.to.period}
                                  onChange={(e) => handleDoctorInputChange(
                                    'available.timeSlots.to.period',
                                    e.target.value
                                  )}
                                  className={`flex-1 px-3 py-2 rounded-lg border ${doctorErrors.availableTime ? 'border-red-300' : 'border-gray-200'
                                    } focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none`}
                                >
                                  <option value="AM">AM</option>
                                  <option value="PM">PM</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Display formatted time */}
                          <div className="mt-2 p-3 bg-indigo-50 rounded-lg">
                            <p className="text-sm text-indigo-800">
                              <strong>Selected Time:</strong> {`
        ${doctorFormData.available.timeSlots.from.hour}:${doctorFormData.available.timeSlots.from.minute} ${doctorFormData.available.timeSlots.from.period} 
        to 
        ${doctorFormData.available.timeSlots.to.hour}:${doctorFormData.available.timeSlots.to.minute} ${doctorFormData.available.timeSlots.to.period}
      `}
                            </p>
                          </div>
                          {doctorErrors.availableTime && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {doctorErrors.availableTime}
                            </p>
                          )}
                        </div>

                        <div className="flex justify-between">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={prevDoctorStep}
                            className="text-gray-600 py-3 px-6 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                            disabled={isDoctorSubmitting}
                          >
                            Back
                          </motion.button>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={nextDoctorStep}
                            className="bg-indigo-600 text-white py-3 px-6 rounded-lg shadow hover:bg-indigo-700 transition"
                            disabled={isDoctorSubmitting}
                          >
                            Next: Credentials
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {currentDoctorStep === 3 && (
                      <motion.div
                        key="credentials"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="space-y-6"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Medical License Number*</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiLock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              value={doctorFormData.licenseNumber}
                              onChange={(e) => handleDoctorInputChange('licenseNumber', e.target.value)}
                              className={`pl-10 w-full rounded-lg border ${doctorErrors.licenseNumber ? 'border-red-300' : 'border-gray-200'} focus:border-indigo-500 focus:ring-indigo-500 py-3`}
                              placeholder="Enter your medical license number"
                              disabled={isDoctorSubmitting}
                            />
                          </div>
                          {doctorErrors.licenseNumber && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {doctorErrors.licenseNumber}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Degree Certificate*
                          </label>
                          <input
                            type="file"
                            onChange={handleDegreeCertificateChange}
                            accept="image/*,.pdf"
                            className="hidden"
                            id="degreeCertificate"
                            ref={degreeCertFileInputRef}
                          />
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => degreeCertFileInputRef.current.click()}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                            >
                              Upload Degree Certificate
                            </button>
                            {doctorFormData.degreeCertificateUrl && (
                              <span className="text-sm text-green-600">
                                ✓ Certificate uploaded
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Upload a clear scan of your medical degree certificate (JPG, PNG, PDF)</p>
                        </div>

                        {/* Identity Proof Upload */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Identity Proof*
                          </label>
                          <input
                            type="file"
                            onChange={handleIdentityProofChange}
                            accept="image/*,.pdf"
                            className="hidden"
                            id="identityProof"
                            ref={identityProofFileInputRef}
                          />
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => identityProofFileInputRef.current.click()}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                            >
                              Upload Identity Proof
                            </button>
                            {doctorFormData.identityProofUrl && (
                              <span className="text-sm text-green-600">
                                ✓ Identity proof uploaded
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Upload a government-issued ID (Driving License, Passport, etc.)</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications*</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {qualifications.map(qualification => (
                              <motion.div
                                key={qualification}
                                whileHover={{ scale: 1.01 }}
                                className="flex items-center"
                              >
                                <input
                                  type="checkbox"
                                  id={`qual-${qualification}`}
                                  checked={doctorFormData.qualifications.includes(qualification)}
                                  onChange={() => toggleQualification(qualification)}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                  disabled={isDoctorSubmitting}
                                />
                                <label
                                  htmlFor={`qual-${qualification}`}
                                  className="ml-2 text-sm text-gray-700"
                                >
                                  {qualification}
                                </label>
                              </motion.div>
                            ))}
                          </div>
                          {doctorErrors.qualifications && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {doctorErrors.qualifications}
                            </p>
                          )}
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start">
                            <div className="bg-blue-100 p-2 rounded-full mr-3">
                              <FiLock className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="text-sm text-blue-800">
                              <p className="font-medium mb-1">Document Verification</p>
                              <p>After registration, you'll need to upload the following documents for verification:</p>
                              <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>Medical license certificate</li>
                                <li>Degree certificate</li>
                                <li>Government-issued ID</li>
                                <li>Hospital affiliation letter</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={prevDoctorStep}
                            className="text-gray-600 py-3 px-6 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                            disabled={isDoctorSubmitting}
                          >
                            Back
                          </motion.button>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={nextDoctorStep}
                            className="bg-indigo-600 text-white py-3 px-6 rounded-lg shadow hover:bg-indigo-700 transition"
                            disabled={isDoctorSubmitting}
                          >
                            Next: Review
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {currentDoctorStep === 4 && (
                      <motion.div
                        key="review"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="space-y-6"
                      >
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                            <FiUser className="h-5 w-5 text-indigo-600 mr-2" />
                            Personal Information
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Full Name</p>
                              <p className="font-medium">
                                {doctorFormData.firstName} {doctorFormData.lastName}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Date of Birth</p>
                              <p className="font-medium">
                                {doctorFormData.dateOfBirth || 'Not provided'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Gender</p>
                              <p className="font-medium">
                                {doctorFormData.gender || 'Not provided'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Email</p>
                              <p className="font-medium">{doctorFormData.email}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Phone</p>
                              <p className="font-medium">{doctorFormData.phone}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                            <FaStethoscope className="h-5 w-5 text-indigo-600 mr-2" />
                            Professional Information
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Specialty</p>
                              <p className="font-medium">{doctorFormData.specialty}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Sub-Specialty</p>
                              <p className="font-medium">
                                {doctorFormData.supSpeciality || 'None'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Experience</p>
                              <p className="font-medium">
                                {doctorFormData.experience} years
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Hospital/Clinic</p>
                              <p className="font-medium">{doctorFormData.hospital}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Hospital Contact</p>
                              <p className="font-medium">{doctorFormData.hospitalNumber}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Hospital Address</p>
                              <p className="font-medium">
                                {doctorFormData.hospitalAddress || 'Not provided'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Consultation Fee</p>
                              <p className="font-medium">
                                {doctorFormData.consultantFee ? `₹${doctorFormData.consultantFee}` : 'Not specified'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                            <FiCalendar className="h-5 w-5 text-indigo-600 mr-2" />
                            Availability
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Working Days</p>
                              <p className="font-medium">
                                {doctorFormData.available.days.length > 0
                                  ? doctorFormData.available.days.join(', ')
                                  : 'Not specified'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Working Hours</p>
                              <p className="font-medium">
                                {doctorFormData.available.time || 'Not specified'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                            <FiLock className="h-5 w-5 text-indigo-600 mr-2" />
                            Credentials
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">License Number</p>
                              <p className="font-medium">{doctorFormData.licenseNumber}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Qualifications</p>
                              <p className="font-medium">
                                {doctorFormData.qualifications.join(', ')}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            id="terms"
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                            required
                            disabled={isDoctorSubmitting}
                          />
                          <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
                            I certify that all information provided is accurate and complete.
                            I agree to the <a href="#" className="text-indigo-600 hover:text-indigo-500">Terms of Service</a> and <a href="#" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</a>.
                          </label>
                        </div>

                        <div className="flex justify-between">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={prevDoctorStep}
                            className="text-gray-600 py-3 px-6 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                            disabled={isDoctorSubmitting}
                          >
                            Back
                          </motion.button>

                          {isDoctorSubmitting ? (
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-8 rounded-lg shadow-lg flex items-center justify-center gap-2">
                              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </div>
                          ) : doctorSuccess ? (
                            <div className="bg-green-500 text-white py-3 px-8 rounded-lg shadow-lg flex items-center gap-2">
                              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Registration Successful!
                            </div>
                          ) : (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="submit"
                              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition flex items-center gap-2"
                            >
                              <FaClinicMedical className="text-lg" />
                              Complete Registration
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-8 text-center text-sm text-gray-500">
                    Already have an account? <a href="#" className="text-indigo-600 font-medium hover:text-indigo-500">Sign in</a>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clinic Registration Modal */}
      <AnimatePresence>
        {showClinicModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => !isClinicSubmitting && setShowClinicModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl border border-white/80 dark:border-slate-700/80 rounded-[2rem] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 w-full">
                {/* Left Side - Illustration */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className="hidden lg:flex flex-col justify-center items-center bg-blue-50/30 dark:bg-slate-900/40 p-8 sticky top-0 h-[90vh] flex-shrink-0 border-r border-white/50 dark:border-slate-700/50"
                >
                  <div className="relative w-full h-72 px-16">
                    <img src="/Copilot_20250629_102248.png" alt="Clinic" className="w-full h-full object-cover rounded-2xl shadow-lg border border-white/50" />

                    <motion.div
                      animate={{ y: [0, -15, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute top-10 left-20 bg-white p-3 rounded-full shadow-lg"
                    >
                      <FaClinicMedical className="text-emerald-400 text-2xl" />
                    </motion.div>

                    <motion.div
                      animate={{ y: [0, 15, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                      className="absolute bottom-20 right-10 bg-white p-3 rounded-full shadow-lg"
                    >
                      <FaStethoscope className="text-teal-400 text-2xl" />
                    </motion.div>
                  </div>

                  <h2 className="text-3xl font-bold text-gray-800 mt-8 text-center">
                    Grow Your Healthcare Facility
                  </h2>
                  <p className="text-gray-600 mt-2 text-center max-w-md">
                    Join our network of trusted clinics and hospitals to expand your reach
                  </p>
                </motion.div>

                {/* Right Side - Form */}
                <form onSubmit={handleClinicSubmit} className="p-8 overflow-y-auto flex-grow">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">Clinic Registration</h1>
                      <p className="text-gray-500">
                        Step {currentClinicStep + 1} of {steps.length}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isClinicSubmitting) {
                          setShowClinicModal(false);
                          setCurrentClinicStep(0);
                        }
                      }}
                      className="text-gray-400 hover:text-gray-500"
                      disabled={isClinicSubmitting}
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex space-x-2 mb-8">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`flex-1 h-2 rounded-full ${currentClinicStep >= index ? 'bg-blue-600' : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>

                  {/* Render the appropriate step content */}
                  {renderClinicStepContent()}
                  <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex justify-between">
                    {currentClinicStep > 0 ? (
                      <button
                        type="button"
                        onClick={prevClinicStep}
                        className="px-6 py-3 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md"
                      >
                        Previous
                      </button>
                    ) : (
                      <div></div>
                    )}

                    {currentClinicStep < steps.length - 1 ? (
                      <button
                        type="button"
                        onClick={nextClinicStep}
                        className="px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md"
                      >
                        Next Step
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleClinicSubmit}
                        disabled={isSubmitting}
                        className={`px-8 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 hover:shadow-md ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
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
                            Processing...
                          </>
                        ) : (
                          'Complete Registration'
                        )}
                      </button>
                    )}
                  </div>
                  {/* <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex justify-between">
                {currentClinicStep > 0 ? (
                  <button
                    type="button"
                    onClick={prevClinicStep}
                    className="px-6 py-3 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md"
                  >
                    Previous
                  </button>
                ) : (
                  <div></div>
                )}

                {currentClinicStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={nextClinicStep}
                    className="px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={()=>{
handleClinicSubmit();
currentClinicStep++;
                    }}
                    className={`px-8 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 hover:shadow-md ${
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
                        Processing...
                      </>
                    ) : (
                      'Complete Registration'
                    )}
                  </button>
                )}
              </div> */}
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
