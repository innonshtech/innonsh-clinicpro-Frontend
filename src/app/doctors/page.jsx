'use client';
import { API_BASE_URL } from '@/utils/api';
import { useEffect, useState } from 'react';
import { Search, Filter, MapPin, ChevronDown, Star, Calendar, Clock, Award, HeartPulse } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';

export default function FindDoctorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState([]);
  const [locationFilter, setLocationFilter] = useState([]);
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredDoctors, setFilteredDoctors] = useState([]);

  const specialties = [
    'Cardiology',
    'Dermatology',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'Gynecology',
    'ENT',
    'General Physician'
  ];

  const locations = [
    'Mumbai',
    'Pune',
    'Delhi',
    'Bangalore',
    'Hyderabad',
    'Chennai'
  ];

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("${API_BASE_URL}/api/v1/doctor/fetchAll");
      const data = await res.json();
      
      if (data.success) {
        const doctorsList = data.data.doctors || [];
        const activeDoctors = doctorsList.filter((doctor) => doctor.status === 'active');
        setDoctors(activeDoctors);
        setFilteredDoctors(activeDoctors);
      } else {
        console.error("Failed to fetch doctors:", data.message);
        setDoctors([]);
        setFilteredDoctors([]);
      }
    } catch (err) {
      console.error("Internal Server Error", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, specialtyFilter, locationFilter, availabilityFilter, ratingFilter]);

  const applyFilters = () => {
    let results = [...doctors];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(doctor => 
        doctor.firstName.toLowerCase().includes(query) ||
        doctor.lastName.toLowerCase().includes(query) ||
        doctor.specialty.toLowerCase().includes(query) ||
        doctor.hospital.toLowerCase().includes(query)
      );
    }

    // Specialty filter
    if (specialtyFilter.length > 0) {
      results = results.filter(doctor => 
        specialtyFilter.some(spec => 
          doctor.specialty.toLowerCase().includes(spec.toLowerCase())
        )
      );
    }

    // Location filter (using hospital address)
    if (locationFilter.length > 0) {
      results = results.filter(doctor => 
        locationFilter.some(loc => 
          doctor.hospitalAddress.toLowerCase().includes(loc.toLowerCase())
        )
      );
    }

    // Availability filter
    if (availabilityFilter) {
      const today = new Date().toLocaleString('en-us', { weekday: 'long' });
      results = results.filter(doctor => {
        if (availabilityFilter === 'today') {
          return doctor.available.days.includes(today);
        } else if (availabilityFilter === 'week') {
          return doctor.available.days.length > 0;
        } else if (availabilityFilter === 'weekend') {
          return doctor.available.days.some(day => 
            ['Saturday', 'Sunday'].includes(day)
          );
        }
        return true;
      });
    }

    // Rating filter (simulated since we don't have rating data)
    if (ratingFilter > 0) {
      results = results.filter(doctor => {
        // Simulate rating based on experience
        const simulatedRating = Math.min(5, Math.max(1, Math.floor(doctor.experience / 2)));
        return simulatedRating >= ratingFilter;
      });
    }

    setFilteredDoctors(results);
  };

  const getDayStyle = (day) => {
    const today = new Date().toLocaleString('en-us', { weekday: 'long' });
    return day === today ? 'bg-blue-100 text-blue-800 font-medium' : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-600 to-blue-800 py-16 text-white"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-6">Find the Best Doctors Near You</h1>
          <p className="text-xl mb-8">
            Book appointments with top-rated, qualified doctors for all your healthcare needs
          </p>

          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="bg-white rounded-lg shadow-lg p-4"
          >
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-grow w-full">
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for doctors, specialties..."
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center w-full md:w-auto transition-all duration-300 hover:shadow-lg"
                onClick={applyFilters}
              >
                <Search className="h-5 w-5 mr-2" />
                Search
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full md:w-72 flex-shrink-0"
          >
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-medium text-xl flex items-center">
                  <Filter className="h-5 w-5 mr-2 text-blue-600" />
                  Filter Doctors
                </h3>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className="md:hidden text-blue-600 flex items-center"
                >
                  {showFilters ? 'Hide' : 'Show'} Filters
                  <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <div className={`space-y-8 ${showFilters ? 'block' : 'hidden md:block'}`}>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <HeartPulse className="h-4 w-4 mr-2 text-blue-500" />
                    Specialty
                  </h4>
                  <div className="space-y-2">
                    {specialties.map((spec) => (
                      <div key={spec} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`spec-${spec}`}
                          checked={specialtyFilter.includes(spec)}
                          onChange={() => 
                            setSpecialtyFilter(prev => 
                              prev.includes(spec) 
                                ? prev.filter(s => s !== spec) 
                                : [...prev, spec]
                            )
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`spec-${spec}`} className="ml-2 text-sm text-gray-700">
                          {spec}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                    Location
                  </h4>
                  <div className="space-y-2">
                    {locations.map((loc) => (
                      <div key={loc} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`loc-${loc}`}
                          checked={locationFilter.includes(loc)}
                          onChange={() => 
                            setLocationFilter(prev => 
                              prev.includes(loc) 
                                ? prev.filter(l => l !== loc) 
                                : [...prev, loc]
                            )
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`loc-${loc}`} className="ml-2 text-sm text-gray-700">
                          {loc}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-blue-500" />
                    Availability
                  </h4>
                  <select
                    className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-700 bg-white"
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                  >
                    <option value="">Any Time</option>
                    <option value="today">Available Today</option>
                    <option value="week">This Week</option>
                    <option value="weekend">Weekend</option>
                  </select>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <Star className="h-4 w-4 mr-2 text-blue-500" />
                    Rating
                  </h4>
                  <div className="space-y-2">
                    {[4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`rating-${rating}`}
                          checked={ratingFilter === rating}
                          onChange={() => setRatingFilter(ratingFilter === rating ? 0 : rating)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`rating-${rating}`} className="ml-2 text-sm text-gray-700 flex items-center">
                          {Array(rating).fill().map((_, i) => (
                            <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          ))}
                          {rating === 4 ? ' & Up' : ''}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Doctor Results */}
          <div className="flex-1">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-between items-center mb-8"
            >
              <h2 className="text-2xl font-bold text-gray-800">
                {specialtyFilter.length ? `${specialtyFilter.join(', ')} Doctors` : 'All Doctors'}
                {locationFilter.length > 0 && ` in ${locationFilter.join(', ')}`}
                {filteredDoctors.length > 0 && (
                  <span className="text-gray-500 text-lg font-normal ml-2">({filteredDoctors.length} found)</span>
                )}
              </h2>
              {/* <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">Sort by:</span>
                <select className="border border-gray-300 rounded-md p-2 text-sm bg-white">
                  <option>Relevance</option>
                  <option>Experience (High to Low)</option>
                  <option>Fee (Low to High)</option>
                </select>
              </div> */}
            </motion.div>

            {isLoading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-xl shadow-sm p-6 h-40 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredDoctors.length > 0 ? (
              <AnimatePresence>
                <div className="space-y-6">
                  {filteredDoctors.map((doctor, index) => (
                    <motion.div
                      key={doctor._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.01 }}
                      className="bg-white rounded-xl shadow-sm hover:shadow-md transition duration-300 border border-gray-100 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row">
                          <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                            <div className="h-32 w-32 rounded-lg overflow-hidden border border-gray-200">
                              {doctor.profileImage ? (
                                <img 
                                  src={doctor.profileImage} 
                                  alt={`${doctor.firstName} ${doctor.lastName}`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                                  {doctor.firstName.charAt(0)}{doctor.lastName.charAt(0)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:justify-between">
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 capitalize">
                                  Dr. {doctor.firstName} {doctor.lastName}
                                </h3>
                                <div className="flex items-center mt-1">
                                  <span className="text-blue-600">{doctor.specialty}</span>
                                  {doctor.supSpeciality && (
                                    <span className="ml-2 text-sm text-gray-500">({doctor.supSpeciality})</span>
                                  )}
                                </div>
                                <p className="text-gray-500 text-sm mt-1">
                                  {doctor.experience}+ Years Experience
                                </p>

                                <div className="flex items-center mt-3">
                                  <div className="flex items-center">
                                    {/* Simulated rating based on experience */}
                                    {Array(Math.min(5, Math.max(1, Math.floor(doctor.experience / 2)))).fill().map((_, i) => (
                                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                    ))}
                                    <span className="ml-1 text-sm font-medium text-gray-900">
                                      {Math.min(5, Math.max(1, Math.floor(doctor.experience / 2))).toFixed(1)}
                                    </span>
                                  </div>
                                  <span className="mx-2 text-gray-300">|</span>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Award className="h-4 w-4 mr-1 text-blue-400" />
                                    {doctor.qualifications.join(', ')}
                                  </div>
                                </div>

                                <div className="mt-4">
                                  <div className="flex items-center text-sm text-gray-600 mb-2">
                                    <MapPin className="h-4 w-4 mr-2 text-blue-400" />
                                    <span>{doctor.hospital}, {doctor.hospitalAddress}</span>
                                  </div>
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Clock className="h-4 w-4 mr-2 text-blue-400" />
                                    <span>{doctor.available.time}</span>
                                  </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  {doctor.available.days.map(day => (
                                    <span 
                                      key={day}
                                      className={`text-xs px-2 py-1 rounded ${getDayStyle(day)}`}
                                    >
                                      {day}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="mt-4 md:mt-0 flex flex-col items-end">
                                <span className="text-xl font-bold text-gray-900">
                                  ₹{doctor.consultantFee}
                                  <span className="text-sm font-normal text-gray-500"> / consultation</span>
                                </span>
                                
                                {doctor.available.days.includes(
                                  new Date().toLocaleString('en-us', { weekday: 'long' })
                                ) && (
                                  <span className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Available Today
                                  </span>
                                )}
                                
                                <Link
                                  href={`/doctors/${doctor._id}`}
                                  className="mt-4 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-sm hover:shadow-md"
                                >
                                  Book Appointment
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl shadow-sm p-8 text-center"
              >
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No doctors found</h3>
                <p className="mt-2 text-gray-500 mb-4">Try adjusting your search or filters</p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSpecialtyFilter([]);
                    setLocationFilter([]);
                    setAvailabilityFilter('');
                    setRatingFilter(0);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Clear all filters
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
