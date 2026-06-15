'use client';
import { API_BASE_URL } from '@/utils/api';

import { motion } from 'framer-motion'
import { MapPin, Star, Clock, Phone, Mail, Globe, ChevronLeft, HeartPulse, Stethoscope, Pill, User, Award, Calendar, X, ChevronRight, Map } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useParams } from 'next/navigation';
import MapModal from './MapModal'
export default function ClinicDetailsPage() {
  const params = useParams();
  const router = useRouter()
  const [clinicData, setClinicData] = useState(null)
  const [doctorsData, setDoctorsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [doctorsLoading, setDoctorsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showMapModal, setShowMapModal] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showDetailedHours, setShowDetailedHours] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const fetchClinicData = async () => {
    try {
      setLoading(true)
      if (!params?.id) {
        throw new Error('No clinic ID provided')
      }

      console.log('Fetching clinic with ID:', params.id)
      
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/clinic/fetch-by-id/${params.id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const data = await res.json()
      
      if (data.success && data.data.clinic) {
        setClinicData(data.data.clinic)
      } else {
        throw new Error(data.message || 'Failed to fetch clinic data')
      }
    } catch (err) {
      console.error('Error fetching clinic:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchDoctorsData = async () => {
    try {
      setDoctorsLoading(true)
      if (!params?.id) {
        return
      }

      console.log('Fetching doctors for clinic ID:', params.id)
      
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/clinic/fetch-doctor-clinicId/${params.id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const data = await res.json()

      if (data.success) {
        setDoctorsData(data.data.doctors || [])
      } else {
        setDoctorsData([])
      }
    } catch (err) {
      console.error('Error fetching doctors:', err)
      setDoctorsData([])
    } finally {
      setDoctorsLoading(false)
    }
  }

  useEffect(() => {
    fetchClinicData();
    fetchDoctorsData();
  }, [params?.id])

  // Helper function to format opening hours
  const formatOpeningHours = (openingHours, is24x7) => {
    if (is24x7) {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const formatted = {};
      days.forEach(day => {
        formatted[day] = '24x7 Open';
      });
      return formatted;
    }
    
    if (!openingHours) return null;
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const formatted = {};
    
    days.forEach(day => {
      if (openingHours[day] && openingHours[day].open && openingHours[day].close) {
        formatted[day] = `${openingHours[day].open} - ${openingHours[day].close}`;
      } else {
        formatted[day] = 'Closed';
      }
    });
    
    return formatted;
  };

  // Helper function to get weekday hours summary
  const getWeekdayHours = (openingHours, is24x7) => {
    if (is24x7) return '24x7 Open';
    
    if (!openingHours) return 'Not available';
    
    // Check if Monday-Friday have same hours
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const mondayHours = openingHours.monday;
    
    if (mondayHours && mondayHours.open && mondayHours.close) {
      const sameHours = weekdays.every(day => 
        openingHours[day] && 
        openingHours[day].open === mondayHours.open && 
        openingHours[day].close === mondayHours.close
      );
      
      if (sameHours) {
        return `${mondayHours.open} - ${mondayHours.close}`;
      }
    }
    
    return 'Varies by day';
  };

  // Image modal functions
  const openImageModal = (index) => {
    setCurrentImageIndex(index);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };

  const goToNextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      (prevIndex + 1) % (clinicData?.images?.length || clinic?.images?.length || 1)
    );
  };

  const goToPrevImage = () => {
    setCurrentImageIndex((prevIndex) => 
      (prevIndex - 1 + (clinicData?.images?.length || clinic?.images?.length || 1)) % 
      (clinicData?.images?.length || clinic?.images?.length || 1)
    );
  };

  // Fallback clinic data for development
  const fallbackClinic = {
    _id: params?.id || '1',
    clinicName: "City Health Clinic",
    clinicType: "Multi-specialty",
    description: "City Health Clinic is a leading multi-specialty healthcare provider offering comprehensive medical services. We are committed to delivering high-quality care with a patient-first approach.",
    address: "123 Main Street, Sector 12",
    city: "Sample City",
    state: "Sample State",
    country: "India",
    postalCode: "123456",
    specialties: ["Cardiology", "Pediatrics", "Orthopedics", "Radiology", "Emergency Care", "Lab Services", "Pharmacy", "Physiotherapy"],
    logo: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=60",
    images: [
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=60",
      "https://media.istockphoto.com/id/1139755582/photo/medical-equipment-on-the-background-of-group-of-health-workers-in-the-icu.webp?a=1&b=1&s=612x612&w=0&k=20&c=U5oZr7UsC9pOBoostQFuZ2aP2gVE3HGqAn1fUSwU2Lg="
    ],
    openingHours: {
      monday: { open: "08:00", close: "20:00" },
      tuesday: { open: "08:00", close: "20:00" },
      wednesday: { open: "08:00", close: "20:00" },
      thursday: { open: "08:00", close: "20:00" },
      friday: { open: "08:00", close: "20:00" },
      saturday: { open: "09:00", close: "17:00" },
      sunday: { open: "09:00", close: "17:00" }
    },
    phone: "+1 (555) 123-4567",
    email: "info@cityhealth.com",
    website: "www.cityhealth.com"
  }

  // Use fetched data if available, otherwise use fallback
  const clinic = clinicData || fallbackClinic
  const formattedHours = formatOpeningHours(clinic.openingHours, clinic.is24x7)

  const handleBackClick = () => {
    router.push('/clinics')
  }

  const toggleDetailedHours = () => {
    setShowDetailedHours(!showDetailedHours)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'doctors':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-800">Our Specialist Doctors</h3>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {doctorsData.length} {doctorsData.length === 1 ? 'Doctor' : 'Doctors'}
              </span>
            </div>
            
            {doctorsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 animate-pulse">
                    <div className="flex items-center mb-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-full mr-4"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : doctorsData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctorsData.map((doctor, index) => (
                  <motion.div 
                    key={doctor._id || index}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 transition-all hover:shadow-lg"
                  >
                    <div className="relative h-48">
                      <img
                        src={doctor.profileImage || doctor.image || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&auto=format&fit=crop&q=60"}
                        alt={`Dr. ${doctor.firstName} ${doctor.lastName}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&auto=format&fit=crop&q=60";
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <h3 className="text-xl font-bold text-white">
                          Dr. {doctor.firstName} {doctor.lastName}
                        </h3>
                        <p className="text-blue-300">{doctor.specialization || doctor.specialty}</p>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center mb-3">
                        <Award className="h-4 w-4 text-yellow-400 mr-2" />
                        <span className="text-sm text-gray-600">
                          {doctor.experience || doctor.yearsOfExperience || 'Experience'} 
                          {doctor.experience && !doctor.experience ? ' years' : ' Years of Experience'}
                        </span>
                      </div>
                      
                      {doctor.education && (
                        <div className="flex items-center mb-3">
                          <User className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="text-sm text-gray-600">{doctor.education}</span>
                        </div>
                      )}

                      {doctor.qualifications && doctor.qualifications.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Qualifications:</p>
                          <div className="flex flex-wrap gap-1">
                            {doctor.qualifications.slice(0, 2).map((qualification, i) => (
                              <span key={i} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded">
                                {qualification}
                              </span>
                            ))}
                            {doctor.qualifications.length > 2 && (
                              <span className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded">
                                +{doctor.qualifications.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {doctor.languages && doctor.languages.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Languages:</p>
                          <div className="flex flex-wrap gap-1">
                            {doctor.languages.slice(0, 3).map((lang, i) => (
                              <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                                {lang}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {doctor.consultationFee && (
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                          <span className="text-sm text-gray-600">Consultation Fee:</span>
                          <span className="font-semibold text-green-600">₹{doctor.consultationFee}</span>
                        </div>
                      )}

                      <button className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                        Book Appointment
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Stethoscope className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-500 mb-2">No Doctors Found</h4>
                <p className="text-gray-400">
                  No doctors are currently associated with this clinic.
                </p>
              </div>
            )}
          </div>
        )
      case 'services':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800">Available Services ({clinic.specialties?.length || 0})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clinic.specialties?.map((specialty, index) => (
                <motion.div 
                  key={index}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl shadow-md p-6 border border-gray-100 transition-all"
                >
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <Stethoscope className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800">{specialty}</h4>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Professional {specialty.toLowerCase()} services with experienced specialists.
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )
      default:
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">About {clinic.clinicName}</h3>
              <p className="text-gray-600 leading-relaxed">
                {clinic.description || `${clinic.clinicName} is a ${clinic.clinicType} clinic providing quality healthcare services to the community.`}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Updated Opening Hours Card */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center mb-3">
                  <Clock className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="font-semibold text-gray-800">Opening Hours</h4>
                </div>
                
                {clinic.is24x7 ? (
                  <div className="text-center py-4">
                    <p className="text-2xl font-bold text-green-600">24x7</p>
                    <p className="text-gray-600 mt-1">Open all days</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span className="text-gray-600">Mon-Fri</span>
                      <span className="font-medium">{getWeekdayHours(clinic.openingHours, clinic.is24x7)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">Saturday</span>
                      <span className="font-medium">
                        {clinic.openingHours?.saturday?.open && clinic.openingHours?.saturday?.close 
                          ? `${clinic.openingHours.saturday.open} - ${clinic.openingHours.saturday.close}`
                          : 'Closed'
                        }
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">Sunday</span>
                      <span className="font-medium">
                        {clinic.openingHours?.sunday?.open && clinic.openingHours?.sunday?.close 
                          ? `${clinic.openingHours.sunday.open} - ${clinic.openingHours.sunday.close}`
                          : 'Closed'
                        }
                      </span>
                    </li>
                  </ul>
                )}
                
                {/* Only show detailed hours toggle if not 24x7 */}
                {!clinic.is24x7 && (
                  <button 
                    onClick={toggleDetailedHours}
                    className="text-blue-600 hover:underline text-sm mt-2"
                  >
                    {showDetailedHours ? 'Hide detailed hours' : 'View detailed hours →'}
                  </button>
                )}
              </div>
              
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center mb-3">
                  <Pill className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="font-semibold text-gray-800">Specialties</h4>
                </div>
                <ul className="space-y-2">
                  {clinic.specialties?.slice(0, 3).map((specialty, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                      <span className="text-gray-600">{specialty}</span>
                    </li>
                  ))}
                  {clinic.specialties?.length > 3 && (
                    <li>
                      <button 
                        onClick={() => setActiveTab('services')}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View all {clinic.specialties?.length || 0} specialties →
                      </button>
                    </li>
                  )}
                </ul>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center mb-3">
                  <Stethoscope className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="font-semibold text-gray-800">Our Doctors</h4>
                </div>
                <div className="space-y-2">
                  {doctorsLoading ? (
                    <div className="animate-pulse">
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ) : doctorsData.length > 0 ? (
                    <>
                      {doctorsData.slice(0, 2).map((doctor, index) => (
                        <div key={index} className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                          <span className="text-gray-600">
                            Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialization || doctor.specialty}
                          </span>
                        </div>
                      ))}
                      <button 
                        onClick={() => setActiveTab('doctors')}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Meet all {doctorsData.length} doctors →
                      </button>
                    </>
                  ) : (
                    <p className="text-gray-500 text-sm">No doctors available</p>
                  )}
                </div>
              </div>
            </div>
{showMapModal && (
  <MapModal 
    address={`${clinic.address}, ${clinic.city}, ${clinic.state} ${clinic.postalCode}, ${clinic.country}`}
    onClose={() => setShowMapModal(false)}
  />
)}
            {/* Updated Detailed Hours Section */}
            {showDetailedHours && !clinic.is24x7 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mt-6"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-4">Detailed Opening Hours</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {formattedHours && Object.entries(formattedHours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                      <span className="font-medium text-gray-800 capitalize">{day}</span>
                      <span className={`${hours === 'Closed' ? 'text-red-600' : 'text-green-600'} font-medium`}>
                        {hours}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading clinic details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <button 
              onClick={() => router.push('/clinics')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Back to Clinics
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="pt-0"
      >
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-12 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <button
              onClick={handleBackClick}
              className="flex items-center text-white hover:text-blue-200 mb-6 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back to Clinics
            </button>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">{clinic.clinicName}</h1>
                <p className="text-blue-200 text-lg mt-1 capitalize">{clinic.clinicType} Clinic</p>
                <div className="flex items-center mt-2">
                  <MapPin className="h-4 w-4 text-blue-200 mr-1" />
                  <span className="text-blue-200">{clinic.city}, {clinic.state}</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <Star className="h-5 w-5 text-yellow-300 fill-yellow-300 mr-1" />
                  <span className="font-medium">4.8</span>
                  <span className="text-blue-100 ml-1">(125+ reviews)</span>
                </div>
                {doctorsData.length > 0 && (
                  <div className="flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <User className="h-5 w-5 text-blue-200 mr-1" />
                    <span>{doctorsData.length} {doctorsData.length === 1 ? 'Doctor' : 'Doctors'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Image and Details Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Left Column - Images */}
            <div className="lg:col-span-2 space-y-4">
              {/* Main Image */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative rounded-xl overflow-hidden shadow-xl"
              >
                <img
                  src={clinic.logo || "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=60"}
                  alt={`${clinic.clinicName} main view`}
                  className="w-full h-96 object-cover"
                />
              </motion.div>
              
              {/* Thumbnail Images */}
              {clinic.images && clinic.images.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="grid grid-cols-4 gap-4"
                >
                  {clinic.images.slice(0, 4).map((image, index) => (
                    <div 
                      key={index} 
                      className="relative rounded-lg overflow-hidden shadow-md h-28 cursor-pointer hover:shadow-lg transition-all"
                      onClick={() => openImageModal(index)}
                    >
                      <img
                        src={image}
                        alt={`${clinic.clinicName} view ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Right Column - Clinic Info */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="lg:col-span-1"
            >
              <div className="bg-white rounded-xl shadow-xl p-6 h-full border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Clinic Information</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-700 font-medium">Address</p>
                      <p className="text-gray-600">
                        {clinic.address}<br />
                        {clinic.city}, {clinic.state} {clinic.postalCode}<br />
                        {clinic.country}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-700 font-medium">Opening Hours</p>
                      <p className="text-gray-600">
                        <span className="block">Weekdays: {getWeekdayHours(clinic.openingHours, clinic.is24x7)}</span>
                        <span className="block">
                          Weekend: {clinic.openingHours?.saturday?.open ? 
                            `${clinic.openingHours.saturday.open} - ${clinic.openingHours.saturday.close}` : 
                            'Closed'
                          }
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  {clinic.phone && (
                    <div className="flex items-start">
                      <Phone className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-gray-700 font-medium">Phone</p>
                        <a href={`tel:${clinic.phone}`} className="text-blue-600 hover:underline">
                          {clinic.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {clinic.email && (
                    <div className="flex items-start">
                      <Mail className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-gray-700 font-medium">Email</p>
                        <a href={`mailto:${clinic.email}`} className="text-blue-600 hover:underline">
                          {clinic.email}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {clinic.website && (
                    <div className="flex items-start">
                      <Globe className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-gray-700 font-medium">Website</p>
                        <a 
                          href={`https://${clinic.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {clinic.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button 
  onClick={() => setShowMapModal(true)}
  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
>
  <Map className="h-5 w-5 mr-2" />
  Show Location
</button>
                  <button className="w-full mt-3 border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center">
                    <Phone className="h-5 w-5 mr-2" />
                    Call Now
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Navigation Tabs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-8"
          >
            <div className="flex border-b border-gray-200">
              {[
                { id: 'overview', label: 'Overview', icon: HeartPulse },
                { id: 'doctors', label: `Doctors (${doctorsData.length})`, icon: User },
                { id: 'services', label: `Services (${clinic.specialties?.length || 0})`, icon: Stethoscope }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-1 flex items-center justify-center px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tab Content */}
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-8 border border-gray-100"
          >
            {renderTabContent()}
          </motion.div>
        </div>

        {/* Image Modal */}
        {isImageModalOpen && clinic.images && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
            onClick={closeImageModal}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-6xl bg-gray-900 rounded-xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button 
                onClick={closeImageModal}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700/90 transition-colors shadow-lg"
              >
                <X className="h-6 w-6 text-white" />
              </button>
              
              {/* Main image container */}
              <div className="relative w-full aspect-[4/3] max-h-[80vh]">
                <img
                  src={clinic.images[currentImageIndex]}
                  alt={`${clinic.clinicName} view ${currentImageIndex + 1}`}
                  className="w-full h-full object-contain"
                />
                
                {/* Navigation arrows */}
                <div className="absolute inset-0 flex items-center justify-between px-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(prev => 
                        (prev - 1 + clinic.images.length) % clinic.images.length
                      );
                    }}
                    className="z-10 bg-gray-800/70 hover:bg-gray-700/90 backdrop-blur-sm rounded-full p-3 transition-all transform hover:scale-105 shadow-lg"
                  >
                    <ChevronLeft className="h-6 w-6 text-white" />
                  </button>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(prev => 
                        (prev + 1) % clinic.images.length
                      );
                    }}
                    className="z-10 bg-gray-800/70 hover:bg-gray-700/90 backdrop-blur-sm rounded-full p-3 transition-all transform hover:scale-105 shadow-lg"
                  >
                    <ChevronRight className="h-6 w-6 text-white" />
                  </button>
                </div>
              </div>
              
              {/* Image indicator dots */}
              {clinic.images.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <div className="flex space-x-2 bg-gray-800/70 backdrop-blur-sm px-4 py-2 rounded-full">
                    {clinic.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(index);
                        }}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          index === currentImageIndex 
                            ? 'bg-white scale-125' 
                            : 'bg-white/50 hover:bg-white/70'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Optional: Image counter */}
              <div className="absolute bottom-4 right-4 bg-gray-800/70 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full">
                {currentImageIndex + 1} / {clinic.images.length}
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}