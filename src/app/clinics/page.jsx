'use client';
import { API_BASE_URL } from '@/utils/api';
import { motion } from 'framer-motion'
import { Search, Filter, MapPin, ChevronDown, Star, X, Plus, Image as ImageIcon, Clock, Phone, Mail, Globe } from 'lucide-react'
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'

export default function ClinicsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filteredClinics, setFilteredClinics] = useState([])

  const clinicTypes = [
    'Multi-specialty',
    'Primary Care',
    'Specialty Clinic',
    'Holistic Health',
    'Pediatrics',
    'Dental',
    'Emergency'
  ]

  const locations = [
    'Sector 12',
    'Sector 15',
    'Sector 20',
    'Sector 8',
    'Downtown',
    'Medical District'
  ]

  const [clinics, setClinics] = useState([])
  const fetchClinics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/clinic/fetch-all-clinics`);
      const data = await res.json();

      if (data.success) {
        // Filter clinics where status is 'active'
        const clinicsList = data.data.clinics || [];
        const approvedClinics = clinicsList.filter(clinic => clinic.status === 'active');
        setClinics(approvedClinics);
        setFilteredClinics(approvedClinics);
      } else {
        throw new Error(data.message || 'Failed to fetch clinics');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  // useEffect(() => {
  //   const fetchClinics = async () => {
  //     try {
  //       setLoading(true)
  //       const res = await fetch(`${API_BASE_URL}/api/clinic/fetch-all-clinics`)
        
  //       if (!res.ok) {
  //         throw new Error('Failed to fetch clinics')
  //       }

  //       const data = await res.json()
  //       if (data.success) {
  //         setClinics(data.clinics)
  //         setFilteredClinics(data.clinics)
  //       } else {
  //         throw new Error(data.message || 'Failed to fetch clinics')
  //       }
  //     } catch (err) {
  //       console.error('Error:', err)
  //       setError(err.message)
  //     } finally {
  //       setLoading(false)
  //     }
  //   }

  //   fetchClinics()
  // }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClinics(clinics)
    } else {
      const filtered = clinics.filter(clinic => {
        const query = searchQuery.toLowerCase()
        return (
          clinic.clinicName.toLowerCase().includes(query) || 
          (clinic.clinicType && clinic.clinicType.toLowerCase().includes(query)) ||
          (clinic.specialties && clinic.specialties.some(s => s.toLowerCase().includes(query))) ||
          (clinic.city && clinic.city.toLowerCase().includes(query)))
      })
      setFilteredClinics(filtered)
    }
  }, [searchQuery, clinics])

  const formatOpeningHours = (clinic) => {
    if (!clinic.openingHours) return 'Hours not available'
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const today = days[new Date().getDay() - 1] // Get current day
    const hoursToday = clinic.openingHours[today]
    
    if (hoursToday?.open && hoursToday?.close) {
      return `Today: ${hoursToday.open} - ${hoursToday.close}`
    }
    return 'Closed today'
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
        {/* Hero Section with Search */}
        <div className="bg-gradient-to-br from-blue-700 to-blue-900 py-16 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center">
              <h1 className="text-4xl font-bold mb-6">Find Quality Clinics Near You</h1>
              <p className="text-xl mb-8 max-w-3xl text-blue-100">
                Discover top-rated healthcare facilities with specialized services for all your needs
              </p>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-2xl p-4 w-full max-w-4xl text-left border border-white/20">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-3.5 h-5 w-5 text-blue-200" />
                    <input
                      type="text"
                      placeholder="Search for clinics, specialties, or city..."
                      className="pl-10 pr-4 py-3 w-full bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent text-white placeholder-blue-200"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white text-blue-700 px-6 py-3 rounded-lg font-medium flex items-center justify-center hover:bg-blue-50 transition-colors"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-5 w-5 mr-2" />
                    Filters
                  </motion.button>
                </div>

                {showFilters && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 pt-4 border-t border-white/20"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-blue-100 mb-3">Clinic Type</label>
                        <div className="grid grid-cols-2 gap-3">
                          {clinicTypes.map((type) => (
                            <motion.div 
                              key={type} 
                              className="flex items-center"
                              whileHover={{ scale: 1.02 }}
                            >
                              <input
                                type="checkbox"
                                id={`type-${type}`}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-white/30 rounded bg-white/10"
                              />
                              <label htmlFor={`type-${type}`} className="ml-2 text-sm text-blue-50">
                                {type}
                              </label>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-100 mb-3">Location</label>
                        <div className="grid grid-cols-2 gap-3">
                          {locations.map((location) => (
                            <motion.div 
                              key={location} 
                              className="flex items-center"
                              whileHover={{ scale: 1.02 }}
                            >
                              <input
                                type="checkbox"
                                id={`location-${location}`}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-white/30 rounded bg-white/10"
                              />
                              <label htmlFor={`location-${location}`} className="ml-2 text-sm text-blue-50">
                                {location}
                              </label>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col">
            {/* Clinic Cards */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">
                  {searchQuery ? `Search results for "${searchQuery}"` : 'All Clinics'}
                </h2>
                <p className="text-gray-600">{filteredClinics.length} {filteredClinics.length === 1 ? 'clinic' : 'clinics'} found</p>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                  <h3 className="text-xl font-medium text-gray-700 mb-2">Error loading clinics</h3>
                  <p className="text-gray-500">{error}</p>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.location.reload()}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Retry
                  </motion.button>
                </div>
              ) : filteredClinics.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                  <h3 className="text-xl font-medium text-gray-700 mb-2">No clinics found</h3>
                  <p className="text-gray-500">
                    {searchQuery ? 
                      `No clinics match your search for "${searchQuery}"` : 
                      'No clinics available at the moment'
                    }
                  </p>
                  {searchQuery && (
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSearchQuery('')}
                      className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Clear search
                    </motion.button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredClinics.map(clinic => (
                    <motion.div
                      key={clinic._id}
                      initial={{ y: 20, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      whileHover={{ 
                        y: -5,
                        boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)"
                      }}
                      viewport={{ once: true }}
                      transition={{ 
                        duration: 0.5,
                        hover: { duration: 0.2 }
                      }}
                      className="bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col border border-gray-100"
                    >
                      <div className="relative h-48 bg-gradient-to-br from-blue-50 to-blue-100">
                        {clinic.logo ? (
                          <div className="w-full h-full flex items-center justify-center p-6">
                            <img
                              src={clinic.logo}
                              alt={clinic.clinicName}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="bg-white p-6 rounded-full shadow-inner">
                              <ImageIcon className="h-12 w-12 text-blue-400" />
                            </div>
                          </div>
                        )}
                        {clinic.rating && (
                          <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full flex items-center shadow-md"
                          >
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="ml-1 text-sm font-medium text-gray-700">{clinic.rating.toFixed(1)}</span>
                          </motion.div>
                        )}
                      </div>
                      
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-xl font-bold text-gray-900">{clinic.clinicName}</h3>
                          {clinic.isPremium && (
                            <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-2 py-1 rounded-full">
                              Premium
                            </span>
                          )}
                        </div>
                        
                        <div className="mb-4">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {clinic.clinicType}
                          </span>
                        </div>
                        
                        <div className="space-y-3 mb-5">
                          <div className="flex items-start">
                            <MapPin className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                            <div>
                              <p className="text-gray-700 font-medium">{clinic.address}</p>
                              <p className="text-gray-500 text-sm">{clinic.city}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <Clock className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                            <p className="text-gray-700">
                              {clinic.is24x7? '24x7 Availablity' :formatOpeningHours(clinic)}
                            
                            </p>
                          </div>
                        </div>
                        
                        {clinic.specialties && clinic.specialties.length > 0 && (
                          <div className="mb-5">
                            <p className="text-sm text-gray-500 mb-2 font-medium">Specialties:</p>
                            <div className="flex flex-wrap gap-2">
                              {clinic.specialties.slice(0, 4).map((specialty, index) => (
                                <motion.span 
                                  key={index}
                                  whileHover={{ scale: 1.05 }}
                                  className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full"
                                >
                                  {specialty}
                                </motion.span>
                              ))}
                              {clinic.specialties.length > 4 && (
                                <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                                  +{clinic.specialties.length - 4}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-auto pt-4 border-t border-gray-100">
                          <div className="flex justify-between items-center">
                            <div className="flex space-x-3">
                              {clinic.phone && (
                                <motion.a 
                                  whileHover={{ y: -2 }}
                                  href={`tel:${clinic.phone}`}
                                  className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors"
                                  title="Call clinic"
                                >
                                  <Phone className="h-5 w-5" />
                                </motion.a>
                              )}
                              {clinic.email && (
                                <motion.a 
                                  whileHover={{ y: -2 }}
                                  href={`mailto:${clinic.email}`}
                                  className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors"
                                  title="Email clinic"
                                >
                                  <Mail className="h-5 w-5" />
                                </motion.a>
                              )}
                              {clinic.website && (
                                <motion.a 
                                  whileHover={{ y: -2 }}
                                  href={clinic.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors"
                                  title="Visit website"
                                >
                                  <Globe className="h-5 w-5" />
                                </motion.a>
                              )}
                            </div>
                            
                            <motion.a
                              whileHover={{ 
                                scale: 1.03,
                                backgroundColor: "#1d4ed8"
                              }}
                              whileTap={{ scale: 0.98 }}
                              href={`/clinics/${clinic._id}`}
                              className="text-sm py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-sm"
                            >
                              View Details
                            </motion.a>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
